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
