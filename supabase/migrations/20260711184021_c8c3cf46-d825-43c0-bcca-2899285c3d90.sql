
-- Sprint 12: Storage hygiene — drop stale partitions & unused heavy indexes.

DROP TABLE IF EXISTS public.audit_logs_y2024_m12 CASCADE;
DROP TABLE IF EXISTS public.audit_logs_y2025_m01 CASCADE;
DROP TABLE IF EXISTS public.audit_logs_y2025_m02 CASCADE;
DROP TABLE IF EXISTS public.audit_logs_y2025_m03 CASCADE;
DROP TABLE IF EXISTS public.audit_logs_y2025_m04 CASCADE;
DROP TABLE IF EXISTS public.audit_logs_y2025_m05 CASCADE;
DROP TABLE IF EXISTS public.audit_logs_y2025_m06 CASCADE;

-- Unused GIN indexes on jsonb columns (never scanned, expensive on writes)
DROP INDEX IF EXISTS public.idx_ai_chat_messages_metadata_gin;
DROP INDEX IF EXISTS public.idx_ai_delay_predictions_data_gin;
