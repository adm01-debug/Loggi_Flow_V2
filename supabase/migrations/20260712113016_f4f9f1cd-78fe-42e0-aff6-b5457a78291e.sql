-- Sprint 27 — Fillfactor tuning para maximizar HOT updates
-- Tabelas com alto UPDATE rate se beneficiam de espaço livre por página.

ALTER TABLE public.entregas             SET (fillfactor = 85);
ALTER TABLE public.coletas              SET (fillfactor = 85);
ALTER TABLE public.user_levels          SET (fillfactor = 80);
ALTER TABLE public.user_sessions        SET (fillfactor = 80);
ALTER TABLE public.fretes_internos      SET (fillfactor = 85);
ALTER TABLE public.cotacoes_multicanal  SET (fillfactor = 85);
ALTER TABLE public.carrier_rankings     SET (fillfactor = 80);
ALTER TABLE public.profiles             SET (fillfactor = 90);

-- Reamostragem para o planner
ANALYZE public.entregas;
ANALYZE public.coletas;
ANALYZE public.user_levels;
ANALYZE public.user_sessions;
ANALYZE public.fretes_internos;
ANALYZE public.cotacoes_multicanal;
ANALYZE public.carrier_rankings;
ANALYZE public.profiles;