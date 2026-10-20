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
