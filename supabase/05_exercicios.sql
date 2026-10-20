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
