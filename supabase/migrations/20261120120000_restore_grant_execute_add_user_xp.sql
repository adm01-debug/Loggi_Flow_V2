-- Fix: restaura o GRANT EXECUTE de public.add_user_xp para authenticated.
-- Causa: as migrations 20260711183644 e 20260711192237 revogaram o execute para
-- PUBLIC, anon e authenticated, e nenhuma migration posterior reconcedeu o grant.
-- O front (useGamification.ts -> supabase.rpc("add_user_xp")) passou a falhar com
-- "permission denied for function add_user_xp" para usuários autenticados, quebrando
-- XP no onboarding, conquistas e progresso de nível.
-- Replay-safe: GRANT é idempotente.

GRANT EXECUTE ON FUNCTION public.add_user_xp(p_user_id uuid, p_xp_amount integer, p_coins_amount integer) TO authenticated;