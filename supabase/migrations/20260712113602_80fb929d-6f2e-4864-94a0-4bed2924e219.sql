-- Sprint 29 — Extended (multivariate) statistics
CREATE STATISTICS IF NOT EXISTS stx_entregas_status_transp
  (ndistinct, dependencies, mcv) ON status, transportadora_id FROM public.entregas;
CREATE STATISTICS IF NOT EXISTS stx_entregas_cliente_status
  (ndistinct, dependencies, mcv) ON cliente_id, status FROM public.entregas;
CREATE STATISTICS IF NOT EXISTS stx_coletas_status_transp
  (ndistinct, dependencies, mcv) ON status, transportadora_id FROM public.coletas;
CREATE STATISTICS IF NOT EXISTS stx_notifications_user_type
  (ndistinct, dependencies, mcv) ON user_id, type FROM public.notifications;
CREATE STATISTICS IF NOT EXISTS stx_user_levels_level_xp
  (ndistinct, dependencies) ON level, total_xp FROM public.user_levels;

ANALYZE public.entregas;
ANALYZE public.coletas;
ANALYZE public.notifications;
ANALYZE public.user_levels;