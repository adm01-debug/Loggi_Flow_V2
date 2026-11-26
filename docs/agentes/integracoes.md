# Integrações externas e edge functions — referência para agentes

Ler antes de mexer em transportadora, WhatsApp, webhook, IA ou qualquer edge function. São 43 deployáveis em
`supabase/functions/` (+ `_shared/`); o que importa aqui é **quem chama**, **qual segredo** e **como a auth é feita**.

## Regras que valem para todas

- **Segredo só em secret de edge function** (`supabase secrets set` ou painel do projeto
  `jvfhclubfpxrtrrazrgr`). Nunca no front, nunca no Vercel, nunca em `VITE_*`. Os nomes esperados estão em
  `scripts/ops/set_missing_secrets.sh` — ele também tem guard contra gravar placeholder.
- **As functions acessam o Supabase por `SUPABASE_URL` e `SUPABASE_ANON_KEY`** (injetados automaticamente
  pelo runtime Deno/Supabase — não são vars `VITE_*`). `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
  existem no **front** e em fixtures de teste, nunca em `index.ts` de produção.
- **Nenhum `console.*` cru**: use `_shared/logger.ts`. O gate `npm run validate:no-console` reprova (evita
  PII em log).
- **Utilidades compartilhadas em `_shared/`** — use, não reescreva: `cors.ts` (CORS), `auth.ts`
  (JWT + `x-internal-secret`), `webhookSignature.ts` (HMAC), `rateLimiter.ts` + `redis.ts` (Upstash),
  `circuitBreaker.ts`, `idempotency.ts`, `fetch-with-timeout.ts`/`safeFetch.ts`, `crypto.ts`
  (criptografia de campo com `FIELD_ENCRYPTION_KEY`, fail-closed), `validate.ts` + `schemas/` (Zod),
  `contract-validator.ts`, `service-wrapper.ts`.
- **Auth pública é fail-closed no código.** `verify_jwt = false` em `supabase/config.toml` só existe onde a
  function valida sozinha:

| Function                                                       | Como autentica sem JWT                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `lalamove-webhook`                                             | HMAC do corpo cru (`verifyWebhookHmac`)                                                             |
| `rodonaves-webhook`                                            | HMAC com `RODONAVES_WEBHOOK_SECRET` (+ `ALLOW_TEST_MODE` para teste)                                |
| `carrier-webhook-receiver`                                     | HMAC com `CARRIER_WEBHOOK_SECRET`                                                                   |
| `nexus-webhook-receiver`                                       | HMAC com `NEXUS_WEBHOOK_SECRET` (se o secret existir, é obrigatório)                                |
| `predict-delays-scheduled`                                     | header `x-internal-secret` (`INTERNAL_FN_SECRET`) ou `Bearer service_role` — chamada pelo `pg_cron` |
| `evolution-whatsapp`, `melhor-envio-api`, `log-security-event` | `requireUser` — JWT do usuário validado no código via Supabase Auth                                 |
| `resend-email`                                                 | `requireInternalSecret` ou `Bearer service_role` — chamada interna                                  |
| `webhook-status`                                               | Authorization header obrigatório                                                                    |
| `health`, `health-check`                                       | health checks — auth presente mas não bloqueante (sem dados sensíveis)                              |

Mexer na assinatura, no nome ou na auth de uma dessas quebra o chamador externo (ou o cron) **em silêncio**:
o webhook passa a responder 401 e ninguém olha. Teste com request real antes de dizer pronto.

## Transportadoras e frete

| Integração             | Functions                                               | Secrets                                                                                            | Observação                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lalamove**           | `lalamove-api`, `lalamove-tracking`, `lalamove-webhook` | `LALAMOVE_API_KEY`, `LALAMOVE_API_SECRET`, `LALAMOVE_BASE_URL`                                     | produção em `https://rest.lalamove.com`; webhook com HMAC                                                                                                                                                                             |
| **Rodonaves (RTE)**    | `rodonaves-api`, `rodonaves-webhook`                    | `RODONAVES_USERNAME`, `RODONAVES_PASSWORD`, `RODONAVES_CNPJ_REMETENTE`, `RODONAVES_WEBHOOK_SECRET` | contrato em `docs/rodonaves_tracking_openapi_v1.27.3.json` e `docs/ANALISE_API_RODONAVES.md`; front em `src/components/rodonaves/` + `src/lib/rodonaves/`; jobs `rte-gateway-health-check`/`rte-slo-daily-rollup` monitoram o gateway |
| **Melhor Envio**       | `melhor-envio-api`                                      | `MELHOR_ENVIO_TOKEN`, `MELHOR_ENVIO_SANDBOX`                                                       | ambiente decidido no servidor: produção por padrão, sandbox só com `MELHOR_ENVIO_SANDBOX=true` fora do projeto de produção (etapa 008) · front em `src/components/melhorenvio/`                                                       |
| **Cotação multicanal** | `smart-carrier-selection`, `normalize-freight-response` | `OPENAI_API_KEY` (normalização)                                                                    | páginas `src/pages/cotacao-multicanal/` e `dashboard-cotacoes/`                                                                                                                                                                       |

## CRM, mensageria e e-mail

| Integração               | Functions                                                                     | Secrets                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bitrix24**             | `bitrix24-integration`                                                        | `BITRIX24_WEBHOOK_URL` (servidor) — o front usa `VITE_BITRIX24_WEBHOOK`, que é público; os IDs das SPAs (compras, entregas, ocorrencias) vem de `business_rules_config`                                     |
| **WhatsApp — Evolution** | `evolution-whatsapp`                                                          | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`                                                                                                                                                                    |
| **WhatsApp — A-Ticket**  | `whatsapp-notification`                                                       | `ATICKET_API_URL`, `ATICKET_API_KEY`; o texto da notificação linka `logiflow-nexus.lovable.app/rastreamento/<id>` (URL fixa no código — conferir se é o domínio vigente antes de prometer link funcionando) |
| **E-mail (Resend)**      | `resend-email`, `new-device-alert`, `log-security-event`, `scheduled-reports` | `RESEND_API_KEY`, `SECURITY_ALERT_EMAIL`, `SECURITY_SLACK_WEBHOOK_URL`                                                                                                                                      |
| **Reset de senha**       | `send-password-reset`, `aprovacao-reset` (front)                              | — (usa o Supabase Auth; **fallback de URL aponta para o projeto morto `uwbpzfcysppwikfpnzok`** — dívida conhecida)                                                                                          |

## IA, dados e mapas

| O que                                     | Functions                                                                                                                                                                        | Secrets                                                                                                                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assistente logístico e previsão de atraso | `ai-logistics-assistant`, `predict-delays`, `predict-delays-scheduled`, `accuracy-meta-monitor`, `accuracy-weekly-digest`                                                        | `GOOGLE_API_KEY`, `APP_URL`                                                                                                                                                                                                     |
| OCR de comprovante                        | `ocr-receipt-processor`                                                                                                                                                          | —                                                                                                                                                                                                                               |
| Mapas e endereço                          | `geocode-address`                                                                                                                                                                | Nenhum secret: geocodificação por OSM (Nominatim + Photon) com apoio do ViaCEP. O token Mapbox foi revogado e `get-mapbox-token` removida (etapa 295 / S-08); os mapas do front usam estilos sem token (`src/lib/mapStyles.ts`) |
| Clima                                     | `get-weather-data`                                                                                                                                                               | `OPENWEATHER_API_KEY`                                                                                                                                                                                                           |
| Banco externo                             | `external-db-bridge`                                                                                                                                                             | `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_SERVICE_KEY` — **é outro projeto Supabase**: nunca aponte para o oficial nem rode migration por ele                                                                                 |
| Rate limit / cache                        | `check-rate-limit` + `_shared/redis.ts`                                                                                                                                          | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (sem eles o rate limit degrada para memória local)                                                                                                                         |
| Segurança e LGPD                          | `validate-login`, `log-login-attempt`, `check-password-breach`, `secure-store`, `lgpd-erase-user`                                                                                | `FIELD_ENCRYPTION_KEY` (≥32 chars, fail-closed em `_shared/crypto.ts`)                                                                                                                                                          |
| Observabilidade do banco                  | `db-health-snapshot`, `db-health-weekly-report`, `db-regression-monitor`, `nexus-auto-healing`, `execute-protocol`, `ingest-biosync`, `webhook-status`, `health`, `health-check` | — (chamadas por `pg_cron`; ver `docs/agentes/banco.md`)                                                                                                                                                                         |

## Antes de dizer que uma integração está pronta

1. Secret existe no projeto certo (`supabase secrets list`) e não é placeholder.
2. A function foi **publicada** depois da sua mudança (`deploy-functions.yml` é manual — merge não publica).
3. Request real feito e logado (status, corpo, e o registro que ela gravou no banco).
4. Webhook: entrega real do parceiro ou `curl` com assinatura HMAC válida — 401 em teste não é "proteção
   funcionando" se você nunca viu um 200.
