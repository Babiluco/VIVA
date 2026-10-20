-- Viva, etapa 11: check-in diário. Rode depois do supabase_metas.sql.
create table public.daily_checkins(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  feeling text not null check (feeling in ('muito_bem','bem','normal','cansada','nao_bem')),
  energy smallint not null check (energy between 1 and 5),
  mood smallint not null check (mood between 1 and 5),
  stress smallint not null check (stress between 1 and 5),
  hunger smallint not null check (hunger between 1 and 5),
  disposition smallint not null check (disposition between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, logged_on));            -- um check-in por dia (refazer o do dia atualiza o registro)
create index on public.daily_checkins(user_id, logged_on);

revoke all on public.daily_checkins from anon;
alter table public.daily_checkins enable row level security;
create policy "own checkins" on public.daily_checkins for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
