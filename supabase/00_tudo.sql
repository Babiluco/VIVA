-- Viva: todos os arquivos SQL em uma só execução (mesma ordem de 01 a 09).
-- Rode UMA vez em um projeto novo. Em um projeto já em uso, rode só os arquivos que faltam.

-- ============ 01_base.sql ============
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

-- ============ 02_dashboard.sql ============
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

-- ============ 03_alimentacao.sql ============
-- Viva, etapa 4: diário alimentar. Rode depois do supabase_dashboard.sql.
alter table public.meal_logs
  add column category text check (category in ('cafe','lanche_manha','almoco','lanche_tarde','jantar','ceia','outra')),
  add column eaten_at time,
  add column quantity text,
  add column note text,
  add column calories int check (calories > 0),   -- opcional; o app não cria metas calóricas
  add column tags text[] not null default '{}'
    check (tags <@ array['fruta','vegetal','proteina','agua','caseira','fora','ultra']),
  add column photo_path text;

-- Bucket privado para fotos; cada pessoa só acessa a própria pasta (<user_id>/arquivo.jpg)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy "fotos: ler as próprias" on storage.objects for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fotos: enviar nas próprias" on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fotos: apagar as próprias" on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ============ 04_sono.sql ============
-- Viva, etapa 6: módulo de sono. Rode depois do supabase_alimentacao.sql.
-- logged_on = data em que a pessoa acordou (uma noite por dia).
alter table public.sleep_logs
  add column slept_at time,
  add column woke_at time,
  add column duration_min int check (duration_min > 0 and duration_min <= 1440),
  add column quality smallint check (quality between 1 and 5),
  add column wake_feeling text check (wake_feeling in ('energia','tranquilo','normal','sonolento','cansado')),
  add column note text;
update public.sleep_logs set duration_min = round(hours * 60) where duration_min is null;

-- ============ 05_exercicios.sql ============
-- Viva, etapa 7: módulo de exercícios. Rode depois do supabase_sono.sql.
alter table public.workout_logs
  add column category text check (category in ('musculacao','cardio','caminhada','corrida','pilates','yoga','alongamento','outro')),
  add column intensity smallint check (intensity between 1 and 3),   -- 1 leve, 2 moderada, 3 intensa
  add column note text;

-- Vários exercícios dentro de um mesmo treino (musculação)
create table public.workout_exercises(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workout_logs(id) on delete cascade,
  name text not null,
  sets int check (sets > 0),
  reps int check (reps > 0),
  weight_kg numeric(6,2) check (weight_kg >= 0),
  note text,
  position int not null default 0,
  created_at timestamptz not null default now());
create index on public.workout_exercises(workout_id);
create index on public.workout_exercises(user_id);

revoke all on public.workout_exercises from anon;
alter table public.workout_exercises enable row level security;
create policy "own exercises" on public.workout_exercises for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.workout_logs w where w.id = workout_id and w.user_id = (select auth.uid())));

-- ============ 06_habitos.sql ============
-- Viva, etapa 8: sistema de hábitos. Rode depois do supabase_exercicios.sql.
alter table public.habits
  add column icon text not null default '✅',
  add column days smallint[] not null default '{0,1,2,3,4,5,6}'   -- 0 = domingo ... 6 = sábado
    check (cardinality(days) > 0 and days <@ array[0,1,2,3,4,5,6]::smallint[]);

update public.habits set frequency = 'diario' where frequency = 'semanal';
update public.habits set days = '{1,2,3,4,5}' where frequency = 'dias_uteis';
alter table public.habits drop constraint if exists habits_frequency_check;
alter table public.habits add constraint habits_frequency_check
  check (frequency in ('diario','dias_uteis','fim_semana','personalizado'));

-- Novos usuários começam com 3 hábitos sugeridos (a pessoa pode pausar ou editar)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  insert into public.habits(user_id, name, icon) values
    (new.id, 'Beber água', '💧'), (new.id, 'Caminhar', '🚶'), (new.id, 'Dormir no horário', '😴');
  return new;
end $$;

-- ============ 07_evolucao.sql ============
-- Viva, etapa 9: estrutura para fotos de evolução (privadas). Rode depois do supabase_habitos.sql.
-- A página "Minha Evolução" usa as tabelas que já existem; só as fotos precisam de estrutura nova.
create table public.progress_photos(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  taken_on date not null default current_date,
  angle text not null default 'outro' check (angle in ('frente','lado','costas','outro')),
  photo_path text not null,            -- <user_id>/<arquivo>.jpg dentro do bucket progress-photos
  note text,
  created_at timestamptz not null default now());
create index on public.progress_photos(user_id, taken_on);

revoke all on public.progress_photos from anon;
alter table public.progress_photos enable row level security;
create policy "own progress photos" on public.progress_photos for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and photo_path like (select auth.uid())::text || '/%');

-- Bucket privado: cada pessoa só enxerga a própria pasta
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "progress photos: ler as próprias" on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "progress photos: enviar nas próprias" on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "progress photos: apagar as próprias" on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ============ 08_metas.sql ============
-- Viva, etapa 10: metas e conquistas. Rode depois do supabase_evolucao.sql.
create table public.goals(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('peso','medida','hidratacao','sono','exercicios','habitos','personalizada')),
  title text not null,
  description text,
  metric text check (metric in ('cintura','abdomen','quadril','coxa','braco')),   -- só para metas de medida
  unit text,
  start_value numeric(8,2) not null default 0,
  target_value numeric(8,2) not null,
  manual_value numeric(8,2),          -- progresso informado à mão (metas personalizadas)
  progress smallint not null default 0 check (progress between 0 and 100),   -- último progresso calculado pelo app
  start_date date not null default current_date,   -- metas de contagem consideram registros a partir daqui
  deadline date,
  status text not null default 'ativa' check (status in ('ativa','concluida','pausada')),
  completed_on date,
  created_at timestamptz not null default now(),
  check (type <> 'medida' or metric is not null));
create index on public.goals(user_id, status);

create table public.achievements(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null check (code in ('semana','agua','treinos','sono','consist','alim')),
  unlocked_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, code));

do $$ declare t text; begin
  foreach t in array array['goals','achievements'] loop
    execute format('revoke all on public.%I from anon', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ============ 09_checkin.sql ============
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
