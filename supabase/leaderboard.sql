-- Shared Moruwa Dash scores. Run this once in the Supabase SQL editor.
-- Creates the table only if it is not already there.
create table if not exists public.moruwa_scores (
  -- A random id for each saved run.
  id uuid primary key default gen_random_uuid(),
  -- The name typed at the end of a run. 16 letters is the same limit as the form.
  player_name text not null,
  -- The points from that run.
  score integer not null,
  -- When the score was saved.
  created_at timestamptz not null default now(),
  -- Rejects a blank name and a name longer than the form allows.
  constraint moruwa_name_length check (char_length(btrim(player_name)) between 1 and 16),
  -- Rejects a negative score and a score bigger than the game can send.
  constraint moruwa_score_range check (score >= 0 and score <= 999999)
);

-- Makes the highest scores quick to read.
create index if not exists moruwa_scores_score_idx
  -- Highest score first.
  on public.moruwa_scores (score desc, created_at asc);

-- Turns on row security so the policies below are what visitors may do.
alter table public.moruwa_scores enable row level security;

-- Lets the public anon key read rows.
grant select on public.moruwa_scores to anon, authenticated;

-- Lets the public anon key add rows. Update and delete stay blocked.
grant insert on public.moruwa_scores to anon, authenticated;

-- Drops an older copy of the read rule so this file can be run again.
drop policy if exists "anyone can read moruwa scores" on public.moruwa_scores;

-- Anyone with the anon key can read the leaderboard.
create policy "anyone can read moruwa scores"
  -- This rule is on the scores table.
  on public.moruwa_scores
  -- It allows reading.
  for select
  -- Both public site visitors and signed-in users.
  to anon, authenticated
  -- Every row is readable.
  using (true);

-- Drops an older copy of the insert rule so this file can be run again.
drop policy if exists "anyone can add a moruwa score" on public.moruwa_scores;

-- Anyone can add one score when the name and points are inside the limits.
create policy "anyone can add a moruwa score"
  -- This rule is on the scores table.
  on public.moruwa_scores
  -- It allows new rows only.
  for insert
  -- Both public site visitors and signed-in users.
  to anon, authenticated
  -- The new row must match the same limits as the game form.
  with check (
    -- The saved name cannot be blank or longer than 16 letters.
    char_length(btrim(player_name)) between 1 and 16
    -- The saved points must be zero or more.
    and score >= 0
    -- The saved points cannot pass the game maximum.
    and score <= 999999
    -- Closes the check.
  );
-- Closes the insert rule.

-- Removes older extra rows so each name has one score before the unique rule.
delete from public.moruwa_scores as older
  -- Compares each row with another row of the same name.
  using public.moruwa_scores as newer
  -- Same nickname.
  where older.player_name = newer.player_name
  -- The other row is a better score, or the same score saved earlier.
  and (
    -- The other score is higher.
    newer.score > older.score
    -- Or the scores match and the other row was saved first.
    or (newer.score = older.score and newer.created_at < older.created_at)
    -- Or they were saved together and the other id sorts first.
    or (newer.score = older.score and newer.created_at = older.created_at and newer.id < older.id)
  -- Closes the comparison.
  );

-- One row per name. A second Ada cannot be inserted beside the first.
create unique index if not exists moruwa_scores_name_idx
  -- The nickname is the unique key.
  on public.moruwa_scores (player_name);

-- Replaces the save function so this file can be run again.
drop function if exists public.save_moruwa_score(text, integer);

-- Keeps one best score for a name. The browser calls this instead of writing rows itself.
create function public.save_moruwa_score(p_name text, p_score integer)
  -- Sends back whether this run was saved or the old score stayed.
  returns table (outcome text, best_score integer)
  -- Plain SQL language is not enough because the function branches.
  language plpgsql
  -- Runs with the table owner's rights so it can update a row the public key cannot.
  security definer
  -- Looks up tables only in public, not in another schema.
  set search_path = public
-- Starts the function body.
as $$
-- The id of the row already stored for this name.
declare
  -- The stored row, if this name already has one.
  existing_id uuid;
  -- The points on that row.
  existing_score integer;
-- Starts the steps.
begin
  -- Rejects a blank name or a name longer than the form allows.
  if char_length(btrim(p_name)) < 1 or char_length(btrim(p_name)) > 16 then
    -- Stops the save.
    raise exception 'Use 1 to 16 letters.';
  -- Closes the name check.
  end if;
  -- Rejects a score outside the game limits.
  if p_score < 0 or p_score > 999999 then
    -- Stops the save.
    raise exception 'That score cannot be saved.';
  -- Closes the score check.
  end if;
  -- Finds the row for this exact name.
  select id, score into existing_id, existing_score
    -- The scores table.
    from public.moruwa_scores
    -- The nickname, with spaces trimmed.
    where player_name = btrim(p_name);
  -- This name has no score yet.
  if existing_id is null then
    -- Adds the first row.
    insert into public.moruwa_scores (player_name, score)
      -- The trimmed name and this run's points.
      values (btrim(p_name), p_score);
    -- Tells the game the score was saved.
    return query select 'saved'::text, p_score;
    -- Stops here.
    return;
  -- Closes the first-score branch.
  end if;
  -- This run is higher, so it replaces the stored one.
  if p_score > existing_score then
    -- Updates that one row. The time becomes now.
    update public.moruwa_scores
      -- The new points and the time of this run.
      set score = p_score, created_at = now()
      -- Only the row for this name.
      where id = existing_id;
    -- Tells the game the new best was saved.
    return query select 'saved'::text, p_score;
    -- Stops here.
    return;
  -- Closes the higher-score branch.
  end if;
  -- This run was lower or equal, so the old score stays.
  return query select 'kept'::text, existing_score;
-- Ends the steps.
end;
-- Ends the function body.
$$;

-- The public site may call the function. It still cannot update or delete rows itself.
grant execute on function public.save_moruwa_score(text, integer) to anon, authenticated;
