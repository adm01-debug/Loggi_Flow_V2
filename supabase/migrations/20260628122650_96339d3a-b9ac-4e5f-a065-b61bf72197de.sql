
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Garantir search_path padrão inclui extensions
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;
ALTER ROLE service_role SET search_path = public, extensions;

ALTER EXTENSION pg_trgm SET SCHEMA extensions;
