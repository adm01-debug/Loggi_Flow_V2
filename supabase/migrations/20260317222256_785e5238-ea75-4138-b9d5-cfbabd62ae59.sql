
-- Fix remaining critical security findings

-- 1. Remove old permissive client_webhooks policy
DROP POLICY IF EXISTS "Authenticated users can manage client_webhooks" ON public.client_webhooks;

-- 2. user_achievements: restrict INSERT to service_role only
DROP POLICY IF EXISTS "System can insert user achievements" ON public.user_achievements;

CREATE POLICY "Backend inserts user achievements" ON public.user_achievements
  FOR INSERT TO service_role
  WITH CHECK (true);

-- 3. user_levels: restrict INSERT to service_role only  
DROP POLICY IF EXISTS "System can insert user levels" ON public.user_levels;

CREATE POLICY "Backend inserts user levels" ON public.user_levels
  FOR INSERT TO service_role
  WITH CHECK (true);

-- 4. Remove old cotacoes_multicanal permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage cotacoes_multicanal" ON public.cotacoes_multicanal;

-- 5. Fix conciliacoes delete - remove overly permissive, keep admin only
DROP POLICY IF EXISTS "Authenticated users can delete conciliacoes" ON public.conciliacoes;

-- 6. Remove old webhook_deliveries ALL policy
DROP POLICY IF EXISTS "Authenticated users can view webhook_deliveries" ON public.webhook_deliveries;

-- 7. Remove old alertas_custo ALL policy
DROP POLICY IF EXISTS "Authenticated users can manage alertas_custo" ON public.alertas_custo;
