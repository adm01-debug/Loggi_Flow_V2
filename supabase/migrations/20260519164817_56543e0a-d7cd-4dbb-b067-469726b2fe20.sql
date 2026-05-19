-- Adicionar colunas de suporte a OCR e Auditoria na tabela entregas
ALTER TABLE public.entregas 
ADD COLUMN IF NOT EXISTS ocr_data_extraida JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS comprovante_audit_info JSONB DEFAULT '{}'::jsonb;

-- Criar tabela de auditoria de comprovantes
CREATE TABLE IF NOT EXISTS public.delivery_receipt_audit (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID NOT NULL REFERENCES public.entregas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    storage_path TEXT NOT NULL,
    upload_status TEXT NOT NULL, -- 'success', 'failed'
    ocr_status TEXT, -- 'pending', 'processed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.delivery_receipt_audit ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view delivery receipt audit" 
ON public.delivery_receipt_audit FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert delivery receipt audit" 
ON public.delivery_receipt_audit FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_delivery_receipt_audit_delivery_id ON public.delivery_receipt_audit(delivery_id);
