create table exercises (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,
  name        text not null,
  sessions    jsonb not null default '[]',
  updated_at  bigint not null
);

alter table exercises enable row level security;

create policy "users can select own exercises"
  on exercises for select
  using (auth.uid() = user_id);

create policy "users can insert own exercises"
  on exercises for insert
  with check (auth.uid() = user_id);

create policy "users can update own exercises"
  on exercises for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own exercises"
  on exercises for delete
  using (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription jsonb NOT NULL,
  created_at bigint DEFAULT extract(epoch from now()) * 1000
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ─── Atomic session RPCs ───────────────────────────────────────────────────
-- These replace full-array client-side writes to avoid concurrent-write data
-- loss. Each function runs a single UPDATE using jsonb operators so two
-- simultaneous calls can never silently overwrite each other's data.
-- RLS on the exercises table (SECURITY INVOKER) enforces auth.uid() = user_id.

CREATE OR REPLACE FUNCTION append_session(
  p_exercise_id text,
  p_session     jsonb,
  p_updated_at  bigint
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE exercises
  SET sessions   = sessions || jsonb_build_array(p_session),
      updated_at = p_updated_at
  WHERE id = p_exercise_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_session(
  p_exercise_id text,
  p_session_id  text,
  p_updated_at  bigint
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE exercises
  SET sessions = (
    SELECT coalesce(jsonb_agg(elem ORDER BY ordinality), '[]'::jsonb)
    FROM   jsonb_array_elements(sessions) WITH ORDINALITY AS t(elem, ordinality)
    WHERE  elem->>'id' != p_session_id
  ),
  updated_at = p_updated_at
  WHERE id = p_exercise_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_session(
  p_exercise_id text,
  p_session_id  text,
  p_weight      float,
  p_reps        int,
  p_date        bigint,
  p_updated_at  bigint
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE exercises
  SET sessions = (
    SELECT coalesce(jsonb_agg(
      CASE
        WHEN elem->>'id' = p_session_id THEN
          jsonb_build_object('id', p_session_id, 'weight', p_weight,
                             'reps', p_reps, 'date', p_date)
        ELSE elem
      END
      ORDER BY ordinality
    ), '[]'::jsonb)
    FROM jsonb_array_elements(sessions) WITH ORDINALITY AS t(elem, ordinality)
  ),
  updated_at = p_updated_at
  WHERE id = p_exercise_id;
END;
$$;

-- ─── One-time backfill migration ───────────────────────────────────────────
-- Run this ONCE in Supabase SQL editor before deploying the new client code.
-- Adds a stable `id` field to every session entry that was created before
-- this RPC migration (those entries have no `id` and cannot be atomically
-- edited/deleted without one).
--
-- UPDATE exercises
-- SET sessions = (
--   SELECT coalesce(
--     jsonb_agg(
--       CASE
--         WHEN elem ? 'id' THEN elem
--         ELSE elem || jsonb_build_object('id', gen_random_uuid()::text)
--       END
--       ORDER BY ordinality
--     ),
--     '[]'::jsonb
--   )
--   FROM jsonb_array_elements(sessions) WITH ORDINALITY AS t(elem, ordinality)
-- )
-- WHERE sessions != '[]'::jsonb;
