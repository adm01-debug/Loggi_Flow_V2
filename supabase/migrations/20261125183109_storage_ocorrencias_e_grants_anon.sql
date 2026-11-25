-- Storage: bucket das fotos de ocorrencia, comprovantes de entrega e privilegios da role anon
--
-- Causas tratadas:
--  1. src/pages/Ocorrencias.tsx usa o bucket 'ocorrencias-fotos' em 3 pontos e
--     src/components/common/ImageUploader.tsx o usa como default, mas o bucket
--     nao existe em producao (a migration 20251220173229_storage_buckets ficou
--     registrada como aplicada sem o efeito persistir) -> upload quebrava em runtime.
--  2. src/pages/Envios.tsx grava em documents sob 'entregas/<id>/...'; a policy
--     antiga exigia que a primeira pasta fosse o auth.uid(), entao o upload de
--     comprovante e de NF era barrado pelo RLS.
--  3. a role anon tinha INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES em todas
--     as tabelas de public (default do Supabase). RLS segurava, mas qualquer policy
--     futura permissiva abriria escrita publica. Apenas SELECT permanece, o que
--     mantem as leituras publicas existentes e a funcao health.

-- 1) Bucket privado das fotos de ocorrencia (o codigo sempre usa URL assinada)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ocorrencias-fotos', 'ocorrencias-fotos', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Ocorrencias fotos: leitura autenticada" on storage.objects;
create policy "Ocorrencias fotos: leitura autenticada" on storage.objects
  for select to authenticated
  using (bucket_id = 'ocorrencias-fotos');

drop policy if exists "Ocorrencias fotos: upload autenticado" on storage.objects;
create policy "Ocorrencias fotos: upload autenticado" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ocorrencias-fotos');

drop policy if exists "Ocorrencias fotos: atualizacao autenticada" on storage.objects;
create policy "Ocorrencias fotos: atualizacao autenticada" on storage.objects
  for update to authenticated
  using (bucket_id = 'ocorrencias-fotos')
  with check (bucket_id = 'ocorrencias-fotos');

drop policy if exists "Ocorrencias fotos: remocao autenticada" on storage.objects;
create policy "Ocorrencias fotos: remocao autenticada" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ocorrencias-fotos');

-- 2) Comprovante de entrega e NF de remessa em documents/entregas/<id>/...
drop policy if exists "Documents: entregas leitura" on storage.objects;
create policy "Documents: entregas leitura" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = 'entregas');

drop policy if exists "Documents: entregas upload" on storage.objects;
create policy "Documents: entregas upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = 'entregas');

drop policy if exists "Documents: entregas atualizacao" on storage.objects;
create policy "Documents: entregas atualizacao" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = 'entregas')
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = 'entregas');

drop policy if exists "Documents: entregas remocao" on storage.objects;
create policy "Documents: entregas remocao" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = 'entregas');

-- 3) Endurecimento dos privilegios da role anon em public
revoke insert, update, delete, truncate, trigger, references on all tables in schema public from anon;
grant insert on public.password_reset_requests to anon;
revoke truncate, trigger, references on all tables in schema public from authenticated;
alter default privileges in schema public
  revoke insert, update, delete, truncate, trigger, references on tables from anon;
alter default privileges in schema public
  revoke truncate, trigger, references on tables from authenticated;
