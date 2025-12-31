-- Tabela para armazenar dispositivos conhecidos do usuário
CREATE TABLE IF NOT EXISTS public.known_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  location TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_trusted BOOLEAN DEFAULT false,
  name TEXT,
  UNIQUE(user_id, device_fingerprint)
);

-- Índices
CREATE INDEX idx_known_devices_user_id ON public.known_devices(user_id);
CREATE INDEX idx_known_devices_fingerprint ON public.known_devices(device_fingerprint);

-- RLS
ALTER TABLE public.known_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
ON public.known_devices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
ON public.known_devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
ON public.known_devices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
ON public.known_devices FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar last_seen_at
CREATE OR REPLACE FUNCTION public.update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_known_devices_last_seen
BEFORE UPDATE ON public.known_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_device_last_seen();