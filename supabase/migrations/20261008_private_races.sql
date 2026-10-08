-- Private two-player rooms use guest identities created by the name migration.
begin;
-- Keep room admission and winner selection in one row-locked server transaction.
create table if not exists public.road_clear_rooms (
  -- Eight random hex characters are easy to share and are not sequential room IDs.
  code text primary key,
  -- The creator alone can start or reset this private race.
  host_id uuid not null references public.moruwa_players(user_id),
  -- Waiting, racing and finished states are explicit rather than inferred from client clocks.
  status text not null default 'waiting' check(status in ('waiting','racing','finished','closed')),
  -- Every client receives the same server-defined start timestamp.
  start_at timestamptz,
  -- A row lock ensures that the first accepted finish remains the winner.
  winner_id uuid references public.moruwa_players(user_id),
  -- Explain a finish-line win separately from an opponent leaving or disconnecting.
  result_reason text,
  -- Increment the round so rematches reset each local simulation exactly once.
  round integer not null default 1,
  -- Expire invitations instead of leaving joinable rooms open forever.
  expires_at timestamptz not null default(now()+interval '24 hours')
-- Finish private room metadata.
);
-- Exactly two unique slots enforce the player limit even for concurrent joins.
create table if not exists public.road_clear_racers (
  -- Each participant belongs to one known room.
  room_code text not null references public.road_clear_rooms(code),
  -- Identity is supplied by the authenticated guest session, never by a room message.
  user_id uuid not null references public.moruwa_players(user_id),
  -- Only positions one and two are available.
  slot integer not null check(slot in (1,2)),
  -- Car choice is locked when the countdown starts.
  vehicle_id text not null default 'korope',
  -- Ready means the client has decoded the selected car image.
  ready boolean not null default false,
  -- Last reported world position drives the opponent ghost and race progress bar.
  x double precision not null default 40,
  -- Visual state never controls admission, ownership or which client may write.
  y double precision not null default 320,
  -- The local physics engine reports body angle and remaining fuel.
  angle double precision not null default 0,
  fuel double precision not null default 100,
  -- Checkpoints advance only one sector at a time through validated progress reports.
  checkpoint integer not null default 0,
  -- Respawns and reconnections retain a visible penalty count.
  deaths integer not null default 0,
  -- Ignore duplicate or out-of-order reports.
  seq bigint not null default 0,
  -- Separate connection health from movement validation timestamps.
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One seat per identity, and no third player can occupy either existing seat.
  primary key(room_code,user_id), unique(room_code,slot)
-- Finish private race participants.
);
-- Do not expose rooms or players through direct table reads or writes.
alter table public.road_clear_rooms enable row level security;
-- All participant operations go through the membership-checked function below.
alter table public.road_clear_racers enable row level security;
-- Remove default privileges so knowing a table name cannot reveal private invites.
revoke all on public.road_clear_rooms, public.road_clear_racers from public, anon, authenticated;
-- A single RPC serializes admission, ready states, starts, updates and results.
create or replace function public.road_clear_room(p_action text, p_code text default null, p_vehicle text default 'korope', p_state jsonb default '{}'::jsonb) returns jsonb
  -- The fixed empty search path prevents privileged object shadowing.
  language plpgsql security definer set search_path=''
-- Begin the private-room operation.
as $$
-- Keep validated state local to this transaction.
declare
  -- Caller identity always comes from Supabase Auth.
  caller uuid:=auth.uid();
  -- Normalize manually entered room codes.
  code_key text:=upper(btrim(p_code));
  -- Hold the locked room and the current player's previous report.
  room public.road_clear_rooms%rowtype;
  racer public.road_clear_racers%rowtype;
  -- Track admission and validated position fields.
  seats integer; nx double precision; ny double precision; na double precision; nf double precision; nd integer; ns bigint;
  -- Capture a single server time for the response and all race decisions.
  stamp timestamptz:=clock_timestamp();
  -- Shared vehicle IDs match the selectable production roster.
  vehicles text[]:=array['korope','okada','danfo','molue','taxi','delivery','tipper','suv','dangote','police','lexus','fayawo','micra','brt','peugeot','purewater','tractor','benzgle','benzcoupe'];
-- Begin membership validation.
begin
  -- A named guest is required for private competitive play.
  if caller is null or not exists(select 1 from public.moruwa_players where user_id=caller) then raise exception 'CLAIM_NAME_FIRST'; end if;
  -- Reject invented vehicles before room creation or ready changes.
  if not (p_vehicle=any(vehicles)) then raise exception 'INVALID_VEHICLE'; end if;
  -- Create at most one active hosted room per guest even if two requests arrive together.
  if p_action='create' then
    -- Serialize create requests for the same identity.
    perform pg_advisory_xact_lock(hashtextextended(caller::text,0));
    -- Reuse a current room instead of accumulating abandoned invitations.
    select r.* into room from public.road_clear_rooms r join public.road_clear_racers m on m.room_code=r.code where m.user_id=caller and r.status in ('waiting','racing') and r.expires_at>stamp order by r.expires_at desc limit 1;
    -- A new room is created only when the caller has no active race.
    if room.code is null then
      -- Random UUID-derived room codes avoid exposing sequential identifiers.
      loop
        -- Retry the extremely unlikely unique-code collision.
        code_key:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
        -- The conflict clause keeps creation safe under concurrency.
        insert into public.road_clear_rooms(code,host_id) values(code_key,caller) on conflict do nothing returning * into room;
        -- Stop once this request actually created its room.
        exit when room.code is not null;
      -- Finish code generation.
      end loop;
      -- The host occupies slot one and initially chooses its requested vehicle.
      insert into public.road_clear_racers(room_code,user_id,slot,vehicle_id) values(room.code,caller,1,p_vehicle);
    -- Finish new-room creation.
    end if;
    -- Continue through the common membership-checked response path.
    code_key:=room.code;
  -- Finish create handling.
  end if;
  -- Locking the room serializes join, start and finish races.
  select * into room from public.road_clear_rooms where code=code_key for update;
  -- Expired or missing invitations cannot be joined or inspected.
  if room.code is null or room.expires_at<stamp then raise exception 'ROOM_NOT_FOUND'; end if;
  -- Locate the caller's existing seat for idempotent joins and reconnections.
  select * into racer from public.road_clear_racers where room_code=code_key and user_id=caller;
  -- Only a correct invite can add the second player, and only while waiting.
  if p_action='join' and racer.user_id is null then
    -- Once racing starts, a third identity cannot replace a participant.
    if room.status<>'waiting' then raise exception 'RACE_ALREADY_STARTED'; end if;
    -- Check capacity under the same room lock used by other join requests.
    select count(*) into seats from public.road_clear_racers where room_code=code_key;
    -- The second successful join wins the only remaining seat.
    if seats>=2 then raise exception 'ROOM_FULL'; end if;
    -- Add this guest in slot two without exposing any other room.
    insert into public.road_clear_racers(room_code,user_id,slot,vehicle_id) values(code_key,caller,2,p_vehicle) returning * into racer;
  -- Finish admission.
  end if;
  -- All remaining actions, including read/poll, require actual membership.
  if racer.user_id is null then raise exception 'NOT_A_ROOM_MEMBER'; end if;
  -- Resolve a disconnected opponent after a generous reconnect window.
  if room.status='racing' and stamp>room.start_at+interval '60 seconds' then
    -- The active guest can win when the other seat has stopped heartbeating.
    if exists(select 1 from public.road_clear_racers where room_code=code_key and user_id<>caller and last_seen<stamp-interval '60 seconds') then
      -- Only a currently connected caller may receive this forfeit result.
      if racer.last_seen>=stamp-interval '60 seconds' then update public.road_clear_rooms set status='finished',winner_id=caller,result_reason='opponent disconnected' where code=code_key returning * into room; end if;
    -- Finish disconnect adjudication.
    end if;
  -- Finish timeout handling.
  end if;
  -- Every valid operation is also a heartbeat, including lobby polling.
  update public.road_clear_racers set last_seen=stamp where room_code=code_key and user_id=caller;
  -- Ready toggles are available only in the lobby and lock to a valid vehicle.
  if p_action='ready' then
    -- Car changes after the start would desynchronize physics.
    if room.status<>'waiting' then raise exception 'RACE_ALREADY_STARTED'; end if;
    -- The caller can change only its own ready flag and car.
    update public.road_clear_racers set ready=coalesce((p_state->>'ready')::boolean,false),vehicle_id=p_vehicle where room_code=code_key and user_id=caller;
  -- The host begins one synchronized countdown after both guests load their cars.
  elsif p_action='start' then
    -- Never allow the joining guest to force an early start.
    if room.host_id<>caller then raise exception 'HOST_ONLY'; end if;
    -- Idempotent retries must not restart an already running clock.
    if room.status='waiting' then
      -- Both seats must be ready and recently connected.
      if (select count(*) from public.road_clear_racers where room_code=code_key and ready and last_seen>stamp-interval '15 seconds')<>2 then raise exception 'BOTH_PLAYERS_MUST_BE_READY'; end if;
      -- Allow one second of synchronization before the visible 3–2–1 countdown.
      update public.road_clear_rooms set status='racing',start_at=stamp+interval '4 seconds',winner_id=null,result_reason=null where code=code_key returning * into room;
      -- Reset movement-validation timestamps to the shared start.
      update public.road_clear_racers set updated_at=room.start_at where room_code=code_key;
    -- Finish a new race start.
    end if;
  -- Progress reports are accepted only during the live race after countdown.
  elsif p_action='progress' and room.status='racing' and stamp>=room.start_at then
    -- Parse bounded values rather than storing arbitrary JSON or strings.
    nx:=(p_state->>'x')::double precision;ny:=(p_state->>'y')::double precision;na:=(p_state->>'angle')::double precision;nf:=(p_state->>'fuel')::double precision;nd:=(p_state->>'deaths')::integer;ns:=(p_state->>'seq')::bigint;
    -- Numeric ranges reject NaN, infinities and unreasonable world coordinates.
    if nx is null or not(nx between 20 and 30000) or ny is null or not(ny between -2000 and 2500) or na is null or not(na between -1000 and 1000) or nf is null or not(nf between 0 and 100) or nd is null or nd<racer.deaths or nd>racer.deaths+1 or ns is null then raise exception 'INVALID_PROGRESS'; end if;
    -- Late duplicate packets cannot overwrite newer position or checkpoint state.
    if ns>racer.seq then
      -- A death must return the car to its last server-acknowledged checkpoint.
      if nd>racer.deaths then
        -- Force the reset position and fuel rather than trusting a claimed teleport.
        nx:=greatest(40,racer.checkpoint);ny:=320;nf:=100;
      -- Ordinary movement is limited to plausible speed and cannot skip checkpoints.
      elsif nx>racer.x+greatest(0,extract(epoch from stamp-racer.updated_at))*900+160 or nx>racer.checkpoint+2160 then raise exception 'PROGRESS_TOO_FAST';
      -- Finish movement validation.
      end if;
      -- Store only the caller's bounded report and monotonically earned checkpoint.
      update public.road_clear_racers set x=nx,y=ny,angle=na,fuel=nf,deaths=nd,seq=ns,checkpoint=greatest(checkpoint,least(28000,floor(nx/2000)::integer*2000)),updated_at=stamp where room_code=code_key and user_id=caller;
      -- The room lock makes a finish-line winner atomic and immutable.
      if nx>=30000 and racer.checkpoint>=28000 then update public.road_clear_rooms set status='finished',winner_id=caller,result_reason='finish line' where code=code_key returning * into room; end if;
    -- Finish one new progress report.
    end if;
  -- Leaving a live race is an explicit forfeit, not a permanent stalled room.
  elsif p_action='leave' then
    -- Award the remaining racer when a started opponent leaves.
    if room.status='racing' then update public.road_clear_rooms set status='finished',winner_id=(select user_id from public.road_clear_racers where room_code=code_key and user_id<>caller limit 1),result_reason='opponent left' where code=code_key returning * into room;
    -- A waiting host closes its invitation; a waiting guest simply frees slot two.
    elsif room.status='waiting' then
      -- Do not permit an orphaned hostless waiting room.
      if room.host_id=caller then update public.road_clear_rooms set status='closed' where code=code_key returning * into room;
      -- Rejoining the same lobby remains possible for another invited guest.
      else delete from public.road_clear_racers where room_code=code_key and user_id=caller; update public.road_clear_racers set ready=false where room_code=code_key; end if;
    -- Finish leaving.
    end if;
  -- Finished rooms can host another round with fresh readiness checks.
  elsif p_action='rematch' then
    -- Both the host role and a completed race are required.
    if room.host_id<>caller or room.status<>'finished' then raise exception 'HOST_ONLY'; end if;
    -- Keep the invitation but reset every gameplay field.
    update public.road_clear_rooms set status='waiting',round=round+1,start_at=null,winner_id=null,result_reason=null where code=code_key returning * into room;
    -- Every player chooses readiness again before the next countdown.
    update public.road_clear_racers set ready=false,x=40,y=320,angle=0,fuel=100,checkpoint=0,deaths=0,seq=0,updated_at=stamp where room_code=code_key;
  -- Recognize pure membership-checked reads and idempotent joins/creates.
  elsif p_action not in ('read','join','create','progress') then raise exception 'INVALID_ROOM_ACTION';
  -- Finish action dispatch.
  end if;
  -- Return one private snapshot and the timestamp needed for countdown clock synchronization.
  return jsonb_build_object('code',room.code,'status',room.status,'host_id',room.host_id,'start_at',room.start_at,'winner_id',room.winner_id,'reason',room.result_reason,'round',room.round,'server_now',stamp,'players',(select jsonb_agg(jsonb_build_object('user_id',m.user_id,'slot',m.slot,'player_name',p.player_name,'vehicle_id',m.vehicle_id,'ready',m.ready,'x',m.x,'y',m.y,'angle',m.angle,'fuel',m.fuel,'checkpoint',m.checkpoint,'deaths',m.deaths,'seq',m.seq,'last_seen',m.last_seen) order by m.slot) from public.road_clear_racers m join public.moruwa_players p on p.user_id=m.user_id where m.room_code=code_key));
-- Finish the membership-checked room operation.
end;
-- End the protected function body.
$$;
-- Supabase guest sessions use the authenticated role; public API keys alone get no access.
revoke all on function public.road_clear_room(text,text,text,jsonb) from public,anon,authenticated;
-- Grant only the single validated room operation to guest sessions.
grant execute on function public.road_clear_room(text,text,text,jsonb) to authenticated;
-- Apply room tables and policies as one migration.
commit;
