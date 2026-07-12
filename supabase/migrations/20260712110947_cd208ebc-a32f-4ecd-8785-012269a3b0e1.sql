
-- ================================
-- SPRINT 24: BRIN indexes for time-series
-- ================================

CREATE INDEX IF NOT EXISTS brin_audit_logs_created_at ON public.audit_logs USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_telemetry_logs_created_at ON public.telemetry_logs USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_nexus_tactical_logs_created_at ON public.nexus_tactical_logs USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_rate_limit_logs_created_at ON public.rate_limit_logs USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_login_attempts_created_at ON public.login_attempts USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_security_events_created_at ON public.security_events USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_notifications_created_at ON public.notifications USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_query_telemetry_created_at ON public.query_telemetry USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_bio_sync_telemetry_created_at ON public.bio_sync_telemetry USING BRIN (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS brin_geo_blocked_attempts_created_at ON public.geo_blocked_attempts USING BRIN (created_at) WITH (pages_per_range = 32);

-- GIN for array/jsonb search
CREATE INDEX IF NOT EXISTS gin_audit_logs_changed_fields ON public.audit_logs USING GIN (changed_fields);
CREATE INDEX IF NOT EXISTS gin_notifications_metadata ON public.notifications USING GIN (metadata);
CREATE INDEX IF NOT EXISTS gin_audit_logs_new_data ON public.audit_logs USING GIN (new_data jsonb_path_ops);
