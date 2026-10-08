-- Apply after leaderboard.sql; retain old scores as a read-only legacy board.
begin;
-- An anonymous guest identity owns exactly one immutable public nickname.
create table if not exists public.moruwa_players (
  -- Supabase handles credentials; this table never stores passwords or email addresses.
  user_id uuid primary key references auth.users(id) on delete restrict,
  -- Preserve the winner's chosen capitalization for display.
  player_name text not null check (player_name ~ '^[A-Za-z0-9][A-Za-z0-9 -]{0,15}$' and player_name = btrim(regexp_replace(player_name, '[[:space:]]+', ' ', 'g'))),
  -- Case-insensitive uniqueness is enforced inside the database, including concurrent requests.
  name_key text generated always as (lower(player_name)) stored unique,
  -- Record when the successful claim was committed.
  claimed_at timestamptz not null default now()
-- Finish the owned-name table.
);
-- Preserve old names without guessing which current account owned them.
create table if not exists public.moruwa_legacy_names (
  -- These reservations prevent a new account from impersonating a legacy player.
  name_key text primary key
-- Finish the legacy reservation table.
);
-- Keep historic names protected when this migration is rerun.
insert into public.moruwa_legacy_names(name_key)
  -- Normalize existing names using the new case and spacing rules.
  select distinct lower(btrim(regexp_replace(player_name, '[[:space:]]+', ' ', 'g'))) from public.moruwa_scores
  -- Existing reservations do not need to be overwritten.
  on conflict do nothing;
-- A player's best score is attached to identity, never to arbitrary input text.
create table if not exists public.moruwa_player_scores (
  -- One leaderboard entry per named guest.
  user_id uuid primary key references public.moruwa_players(user_id) on delete restrict,
  -- Retain the game's supported score range.
  score integer not null check (score between 0 and 999999),
  -- The earlier achievement wins ties between different players.
  created_at timestamptz not null default now()
-- Finish the new leaderboard table.
);
-- Support top-ten ordering without scanning every player.
create index if not exists moruwa_player_scores_rank_idx on public.moruwa_player_scores(score desc, created_at asc);
-- Hide identities and reservations from direct public table access.
alter table public.moruwa_players enable row level security;
-- All reservation lookup happens inside the claim function.
alter table public.moruwa_legacy_names enable row level security;
-- Scores are exposed only through the limited public leaderboard function.
alter table public.moruwa_player_scores enable row level security;
-- Remove default API privileges so clients cannot bypass ownership checks.
revoke all on public.moruwa_players, public.moruwa_legacy_names, public.moruwa_player_scores from public, anon, authenticated;
-- Return only the signed-in caller's name, not another user's identity.
create or replace function public.my_moruwa_name() returns text
  -- A fixed path prevents object shadowing in a privileged function.
  language sql stable security definer set search_path = ''
  -- Supabase supplies the caller's identity from its verified session.
  as $$ select player_name from public.moruwa_players where user_id = auth.uid(); $$;
-- Claim a name atomically, with the database unique constraint deciding the winner.
create or replace function public.claim_moruwa_name(p_name text) returns text
  -- Privileged writes are limited to the authenticated caller's own identity.
  language plpgsql security definer set search_path = ''
-- Begin the claim transaction body.
as $$
-- Declare validated input and the caller's existing name.
declare
  -- Never accept a user ID supplied by the browser.
  caller uuid := auth.uid();
  -- Collapse spacing before testing length and uniqueness.
  cleaned text := btrim(regexp_replace(p_name, '[[:space:]]+', ' ', 'g'));
  -- Hold an existing or newly claimed name for idempotent retries.
  owned text;
-- Begin the protected mutation.
begin
  -- Refuse anonymous API keys without a user session.
  if caller is null then raise exception 'SIGN_IN_REQUIRED'; end if;
  -- Validate every client, including callers outside the game UI.
  if cleaned is null or cleaned !~ '^[A-Za-z0-9][A-Za-z0-9 -]{0,15}$' then raise exception 'INVALID_NAME'; end if;
  -- A retry can return the same owned name, but cannot change ownership.
  select player_name into owned from public.moruwa_players where user_id = caller;
  -- Accounts keep their first successful nickname.
  if owned is not null then
    -- Different capitalization is still the same name.
    if lower(owned) = lower(cleaned) then return owned; end if;
    -- Do not release or replace the original name.
    raise exception 'NAME_ALREADY_OWNED';
  -- Finish the returning-player branch.
  end if;
  -- Existing unverified legacy names require manual ownership review.
  if exists(select 1 from public.moruwa_legacy_names where name_key = lower(cleaned)) then raise exception 'LEGACY_NAME_RESERVED'; end if;
  -- Unique constraints serialize competing claims for both names and accounts.
  insert into public.moruwa_players(user_id, player_name) values(caller, cleaned) on conflict do nothing;
  -- Check which name this identity now owns after any conflicting transaction finishes.
  select player_name into owned from public.moruwa_players where user_id = caller;
  -- Return success only for the actual owner of the requested name.
  if lower(owned) = lower(cleaned) then return owned; end if;
  -- A concurrent claim by the same account cannot create a second identity.
  if owned is not null then raise exception 'NAME_ALREADY_OWNED'; end if;
  -- Another identity committed this name first.
  raise exception 'NAME_TAKEN';
-- Finish the claim function.
end;
-- End the function definition.
$$;
-- Save scores using identity, with no writable nickname or user ID argument.
create or replace function public.submit_moruwa_score(p_score integer) returns integer
  -- Only the following validated write is allowed elevated privileges.
  language plpgsql security definer set search_path = ''
-- Begin score submission.
as $$
-- Store the signed-in identity and the resulting best score.
declare
  -- Identity comes from the session token.
  caller uuid := auth.uid();
  -- The best score returned after the atomic upsert.
  best integer;
-- Begin validation and update.
begin
  -- A shared score always needs an authenticated owner.
  if caller is null then raise exception 'SIGN_IN_REQUIRED'; end if;
  -- Reject missing, negative and out-of-range values.
  if p_score is null or p_score < 0 or p_score > 999999 then raise exception 'INVALID_SCORE'; end if;
  -- Scores cannot be submitted until a name has been claimed.
  if not exists(select 1 from public.moruwa_players where user_id = caller) then raise exception 'CLAIM_NAME_FIRST'; end if;
  -- A concurrent lower score must never replace a higher one.
  insert into public.moruwa_player_scores as current_score(user_id, score) values(caller, p_score)
    -- Keep the first time of a tied best and update time only on a genuine improvement.
    on conflict(user_id) do update set score = greatest(current_score.score, excluded.score), created_at = case when excluded.score > current_score.score then now() else current_score.created_at end
    -- Return the persisted best score to the caller.
    returning score into best;
  -- Report the server's result instead of trusting the submitted value.
  return best;
-- Finish the score function.
end;
-- End the function definition.
$$;
-- Public readers receive names and scores but no account identifiers.
create or replace function public.moruwa_named_board() returns table(player_name text, score integer, created_at timestamptz)
  -- Read through a controlled projection of the protected tables.
  language sql stable security definer set search_path = ''
  -- Rank exactly one best score per owned name.
  as $$ select p.player_name, s.score, s.created_at from public.moruwa_player_scores s join public.moruwa_players p on p.user_id = s.user_id order by s.score desc, s.created_at asc, p.name_key asc limit 10; $$;
-- Disable the old unauthenticated write path, including direct inserts.
revoke insert, update, delete on public.moruwa_scores from public, anon, authenticated;
-- Remove the obsolete permissive policy without deleting historical rows.
drop policy if exists "anyone can add a moruwa score" on public.moruwa_scores;
-- Disable the old privileged function so stale clients cannot impersonate names.
revoke execute on function public.save_moruwa_score(text, integer) from public, anon, authenticated;
-- Explicitly remove PostgreSQL's default public function permissions.
revoke all on function public.my_moruwa_name(), public.claim_moruwa_name(text), public.submit_moruwa_score(integer), public.moruwa_named_board() from public, anon, authenticated;
-- Guests with a valid session may access only their own claim and score operations.
grant execute on function public.my_moruwa_name(), public.claim_moruwa_name(text), public.submit_moruwa_score(integer) to authenticated;
-- Everyone can view the safe public leaderboard projection.
grant execute on function public.moruwa_named_board() to anon, authenticated;
-- Return the current caller's ranking after a saved run, without exposing other identities.
create or replace function public.my_moruwa_medal() returns table(player_name text, score integer, rank bigint)
  -- The database, not a client-supplied rank, decides top-ten eligibility.
  language sql stable security definer set search_path = ''
  -- Rank by the same deterministic tie-breaking rule as the public board.
  as $$ with ranked as (select p.user_id, p.player_name, s.score, row_number() over(order by s.score desc, s.created_at asc, p.name_key asc) as rank from public.moruwa_player_scores s join public.moruwa_players p on p.user_id=s.user_id) select player_name, score, rank from ranked where user_id=auth.uid() and rank<=10; $$;
-- Do not expose this identity-specific function to anonymous API keys.
revoke all on function public.my_moruwa_medal() from public, anon, authenticated;
-- Supabase guest sessions use the authenticated role without email/password registration.
grant execute on function public.my_moruwa_medal() to authenticated;
-- Publish all name, score and medal operations together.
commit;
