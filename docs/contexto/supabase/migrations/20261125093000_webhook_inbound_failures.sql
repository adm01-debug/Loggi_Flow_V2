-- Etapa 288 (achado H-14): dar destino persistente a falha de webhook de ENTRADA.
--
-- Hoje o unico vestigio de um webhook de entrada que falha e o `log.error(...)` da
-- edge function, que some em poucos dias e ninguem le. O webhook de SAIDA ja tem
-- destino (`public.webhook_deliveries`); o de entrada nao tinha.
--
-- Por que nao reaproveitar `public.webhook_deliveries` (etapa 287 confirmou que
-- `webhook_failures` e `cron_job_logs` nao existem: `to_regclass` = null):
--   * `webhook_id uuid NOT NULL REFERENCES public.client_webhooks(id) ON DELETE CASCADE`
--     (20260317215104_154b5d22-37a6-4cc8-8919-e48967ba6ebd.sql:27) - um webhook de
--     entrada nao pertence a nenhum `client_webhooks`, entao o registro exigiria
--     apontar para um dono falso;
--   * as policies ("Strict insert webhook deliveries", "Webhook owners can view
--     deliveries") filtram pelo dono do webhook de saida.
--
-- Sem payload na tabela: o corpo de um webhook de transportadora pode carregar dado
-- pessoal do destinatario (docs/LGPD_COMPLIANCE.md). Grava-se o identificador do
-- evento, o provedor, o status devolvido e a mensagem de erro.

CREATE TABLE IF NOT EXISTS public.webhook_inbound_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver text NOT NULL,
  provider text,
  event_id text,
  response_status integer NOT NULL DEFAULT 500,
  error_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
)

COMMENT ON TABLE public.webhook_inbound_failures IS
  'Etapa 288 - falha de webhook de entrada por receptor. Sem payload (LGPD).'

COMMENT ON COLUMN public.webhook_inbound_failures.receiver IS
  'Edge function que recebeu: carrier-webhook-receiver, rodonaves-webhook, ...'

COMMENT ON COLUMN public.webhook_inbound_failures.provider IS
  'Provedor declarado no payload (carrier_id), quando ele ainda e legivel.'

-- A tela da etapa 289 lista as falhas recentes: `created_at DESC`.
CREATE INDEX IF NOT EXISTS idx_webhook_inbound_failures_created
  ON public.webhook_inbound_failures (created_at DESC)

ALTER TABLE public.webhook_inbound_failures ENABLE ROW LEVEL SECURITY

-- Leitura: so admin, no mesmo padrao de `security_events` e `idempotency_keys`.
CREATE POLICY "Admins can view webhook inbound failures"
  ON public.webhook_inbound_failures
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))

-- Escrita: so service_role. As edge functions usam SUPABASE_SERVICE_ROLE_KEY e ja
-- passariam por cima da RLS; a policy existe para deixar explicito que nenhum outro
-- papel grava nesta tabela.
CREATE POLICY "System can insert webhook inbound failures"
  ON public.webhook_inbound_failures
  FOR INSERT
  TO service_role
  WITH CHECK (true)

-- Retencao: o projeto nao tem pg_cron instalado (etapa 087), entao o expurgo e uma
-- funcao chamavel pelo agendador em vez de um job preso ao banco.
-- SECURITY DEFINER justificado: precisa apagar linhas que o agendador nao enxerga
-- pela RLS; `SET search_path = public` e o EXECUTE restrito a `service_role` contem
-- o privilegio (docs/adr/0014-security-definer-rls-pattern.md).
CREATE OR REPLACE FUNCTION public.purge_webhook_inbound_failures(
  _keep_days integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removidas integer;
BEGIN
  DELETE FROM public.webhook_inbound_failures
   WHERE created_at < now() - make_interval(days => _keep_days);
  GET DIAGNOSTICS removidas = ROW_COUNT;
  RETURN removidas;
END;
$$

REVOKE ALL ON FUNCTION public.purge_webhook_inbound_failures(integer) FROM PUBLIC

REVOKE ALL ON FUNCTION public.purge_webhook_inbound_failures(integer) FROM anon

REVOKE ALL ON FUNCTION public.purge_webhook_inbound_failures(integer) FROM authenticated

GRANT EXECUTE ON FUNCTION public.purge_webhook_inbound_failures(integer) TO service_role
