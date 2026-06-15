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
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  created_at bigint DEFAULT extract(epoch from now()) * 1000
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ─── Migration: deduplicate then add UNIQUE constraint ─────────────────────
-- Run these two statements IN ORDER in Supabase SQL editor on the live DB.
-- Step 1 must complete before Step 2 or the ALTER TABLE will fail.
--
-- Step 1 — remove duplicate rows, keep the most recently created per user:
--
-- DELETE FROM push_subscriptions
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (user_id) id
--   FROM push_subscriptions
--   ORDER BY user_id, created_at DESC NULLS LAST
-- );
--
-- Step 2 — add the unique constraint (no-op for a fresh install since the
-- CREATE TABLE above already includes UNIQUE on user_id):
--
-- ALTER TABLE push_subscriptions
--   ADD CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id);
