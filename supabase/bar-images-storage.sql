-- Rode este arquivo uma vez no SQL Editor do Supabase.
-- Ele cria o espaco publico de fotos e deixa cada dono enviar imagens apenas
-- para os estabelecimentos que administra.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bar-images',
  'bar-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Bar managers can upload their cover images" on storage.objects;
create policy "Bar managers can upload their cover images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bar-images'
  and public.is_bar_manager(split_part(name, '/', 1))
);

drop policy if exists "Bar managers can read their cover images" on storage.objects;
create policy "Bar managers can read their cover images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'bar-images'
  and public.is_bar_manager(split_part(name, '/', 1))
);
