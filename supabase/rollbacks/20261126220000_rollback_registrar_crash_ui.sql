-- Rollback da 20261126220000_registrar_crash_ui_para_anonimo.sql
-- Depois disto o crash de tela publica volta a morrer no console (etapa 285 fica
-- apenas parcial, como antes). Nada de dado e apagado: as linhas ja gravadas com
-- category = 'ui_crash' permanecem em telemetry_logs.
drop function if exists public.registrar_crash_ui(text, text, text, jsonb);