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
