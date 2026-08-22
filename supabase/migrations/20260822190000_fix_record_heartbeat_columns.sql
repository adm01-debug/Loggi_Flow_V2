-- R4 (ESTADO_ATUAL.md): record_heartbeat() usava colunas inexistentes
-- (message, checked_at) e os crons (nexus_heartbeat + system-heartbeat-1m)
-- falhavam toda execução desde 2026-05-19, deixando o heartbeat congelado.
-- Schema real de system_heartbeat: service_name, status, latency_ms,
-- last_check, version, metadata (PK = service_name).
--
-- Fix: atualizar last_check dos 4 serviços registrados (heartbeat por
-- serviço, respeitando a PK), sem inserir linha nova e sem referências
-- a colunas inexistentes.
CREATE OR REPLACE FUNCTION public.record_heartbeat()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.system_heartbeat
     SET last_check = now()
   WHERE service_name IN ('database', 'edge_functions', 'storage', 'auth');
END; $$;

REVOKE ALL ON FUNCTION public.record_heartbeat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_heartbeat() TO service_role;
