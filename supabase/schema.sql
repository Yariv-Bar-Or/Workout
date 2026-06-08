create table profiles (
  id text primary key,
  name text not null,
  updated_at bigint not null
);

create table exercises (
  id text primary key,
  profile_id text references profiles(id) on delete cascade,
  category text not null,
  name text not null,
  sessions jsonb not null default '[]',
  updated_at bigint not null
);

alter table profiles enable row level security;
alter table exercises enable row level security;

create policy "allow all" on profiles for all using (true) with check (true);
create policy "allow all" on exercises for all using (true) with check (true);
