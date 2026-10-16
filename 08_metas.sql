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
