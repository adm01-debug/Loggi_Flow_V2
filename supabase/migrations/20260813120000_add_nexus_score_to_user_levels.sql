-- Migration: 20260813120000_add_nexus_score_to_user_levels
-- Aplicada na origem em 13/08/2026; aplicada no destino via plano de migração (31/08/2026)
ALTER TABLE public.user_levels ADD COLUMN IF NOT EXISTS nexus_score numeric(5,2) DEFAULT 0;

ALTER TABLE public.user_levels
  ADD CONSTRAINT user_levels_nexus_score_check
  CHECK ((nexus_score >= 0::numeric) AND (nexus_score <= 100::numeric));

COMMENT ON COLUMN public.user_levels.nexus_score
  IS 'Core Nexus Score (0-100): logistics performance composite metric used by useGamification hook';
