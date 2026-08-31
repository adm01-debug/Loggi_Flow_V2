-- Fix search_path for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_coleta_numero()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.numero_coleta = 'COL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('coleta_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_entrega_numero()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.numero_entrega = 'ENT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('entrega_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;