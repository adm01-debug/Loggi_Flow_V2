-- Criar bucket para fotos de ocorrências
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ocorrencias-fotos',
  'ocorrencias-fotos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket
CREATE POLICY "Acesso público para leitura de fotos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ocorrencias-fotos');

CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ocorrencias-fotos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Usuários podem excluir seus próprios uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ocorrencias-fotos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Bucket para fotos de entregas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entregas-fotos',
  'entregas-fotos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policies para entregas-fotos
CREATE POLICY "Acesso público para leitura de fotos entregas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'entregas-fotos');

CREATE POLICY "Upload em entregas-fotos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'entregas-fotos' 
    AND auth.role() = 'authenticated'
  );

-- Bucket para comprovantes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Policies para comprovantes (acesso restrito)
CREATE POLICY "Usuários autenticados podem ver comprovantes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprovantes' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Upload de comprovantes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comprovantes' 
    AND auth.role() = 'authenticated'
  );
