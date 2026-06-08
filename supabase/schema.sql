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
