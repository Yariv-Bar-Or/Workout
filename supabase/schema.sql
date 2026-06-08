-- Iron Log schema
-- Run this in the Supabase SQL editor before using the app.

create table if not exists profiles (
  id         text primary key,
  name       text    not null,
  updated_at bigint  not null default 0
);

create table if not exists exercises (
  id         text primary key,
  profile_id text    not null references profiles(id) on delete cascade,
  category   text    not null,
  name       text    not null,
  sessions   jsonb   not null default '[]'::jsonb,
  updated_at bigint  not null default 0
);

-- Row-level security: enable but allow all access (no auth required)
alter table profiles  enable row level security;
alter table exercises enable row level security;

create policy "allow all" on profiles  for all using (true) with check (true);
create policy "allow all" on exercises for all using (true) with check (true);
