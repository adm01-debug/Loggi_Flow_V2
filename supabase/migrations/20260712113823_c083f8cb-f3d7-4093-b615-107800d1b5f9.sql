-- Sprint 32 — Timeouts defensivos por role
ALTER ROLE anon           SET statement_timeout = '5s';
ALTER ROLE authenticated  SET statement_timeout = '15s';
ALTER ROLE authenticated  SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE service_role   SET statement_timeout = '60s';
ALTER ROLE authenticator  SET lock_timeout = '3s';