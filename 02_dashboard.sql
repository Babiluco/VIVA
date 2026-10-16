-- Viva, etapa 3: registros diários que alimentam o Dashboard. Rode depois do supabase_schema.sql.
create table public.water_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  amount_ml int not null check (amount_ml > 0),
  created_at timestamptz not null default now());
create table public.sleep_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  hours numeric(3,1) not null check (hours > 0 and hours <= 24),
  created_at timestamptz not null default now(),
  unique (user_id, logged_on));
create table public.workout_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  name text not null,
  minutes int not null check (minutes > 0),
  created_at timestamptz not null default now());
create table public.meal_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  meal text not null,
  description text,
  created_at timestamptz not null default now());
do $$ declare t text; begin
  foreach t in array array['water_logs','sleep_logs','workout_logs','meal_logs'] loop
    execute format('create index on public.%I(user_id, logged_on)', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;
