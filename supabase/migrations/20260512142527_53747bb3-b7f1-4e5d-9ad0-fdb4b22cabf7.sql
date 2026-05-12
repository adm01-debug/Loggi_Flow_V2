-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_entregas_updated_at ON public.entregas;
CREATE TRIGGER update_entregas_updated_at
BEFORE UPDATE ON public.entregas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para validar valores positivos em frete
CREATE OR REPLACE FUNCTION public.validate_frete_values()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.valor_frete < 0 THEN
        RAISE EXCEPTION 'O valor do frete não pode ser negativo.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_entregas_frete ON public.entregas;
CREATE TRIGGER validate_entregas_frete
BEFORE INSERT OR UPDATE ON public.entregas
FOR EACH ROW EXECUTE FUNCTION public.validate_frete_values();
