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
