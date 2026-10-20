-- Viva: esquema + Row Level Security. Cole no SQL Editor do Supabase e execute.
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  age int check (age between 10 and 120),
  height_cm numeric(5,1) check (height_cm > 0),
  start_weight numeric(5,2), current_weight numeric(5,2), goal_weight numeric(5,2),
  objective text default 'Emagrecimento sustentável',
  activity_level text default 'leve' check (activity_level in ('sedentária','leve','moderada','intensa')),
  water_goal_ml int not null default 2000 check (water_goal_ml > 0),
  sleep_goal_h numeric(3,1) not null default 8 check (sleep_goal_h > 0),
  exercise_per_week int not null default 3 check (exercise_per_week between 0 and 14),
  journey_start date default current_date,
  created_at timestamptz not null default now());

create table public.weight_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  weight numeric(5,2) not null check (weight > 0),
  note text,
  created_at timestamptz not null default now());

create table public.body_measurements(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  measured_on date not null default current_date,
  type text not null check (type in ('cintura','abdomen','quadril','coxa','braco')),
  value_cm numeric(5,1) not null check (value_cm > 0),
  created_at timestamptz not null default now());

create table public.habits(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  frequency text not null default 'diario' check (frequency in ('diario','dias_uteis','semanal')),
  reminder_time time,
  active boolean not null default true,
  created_at timestamptz not null default now());

create table public.habit_logs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  done_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, done_on));

create index on public.weight_logs(user_id, logged_on);
create index on public.body_measurements(user_id, measured_on);
create index on public.habits(user_id);
create index on public.habit_logs(user_id, done_on);

-- RLS: cada pessoa só enxerga e altera as próprias linhas
revoke all on public.profiles, public.weight_logs, public.body_measurements, public.habits, public.habit_logs from anon;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$ declare t text; begin
  foreach t in array array['weight_logs','body_measurements','habits'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

alter table public.habit_logs enable row level security;
create policy "own logs" on public.habit_logs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid())));

-- Novo usuário: cria perfil e hábitos iniciais
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  insert into public.habits(user_id, name) values (new.id,'Beber água'),(new.id,'Caminhar 20 min'),(new.id,'Dormir cedo');
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
