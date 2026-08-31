#!/bin/sh
# Secrets com PLACEHOLDER_NEEDS_SETUP — preencher antes do cutover (etapa 83)
# Uso: export SUPABASE_ACCESS_TOKEN=sbp_... && sh scripts/ops/set_missing_secrets.sh
PROJ=jvfhclubfpxrtrrazrgr

# ── Transportadoras ──
supabase secrets set \
  RODONAVES_USERNAME="<usuario_portal_rodonaves>" \
  RODONAVES_PASSWORD="<senha_portal_rodonaves>" \
  RODONAVES_CNPJ_REMETENTE="<cnpj_sem_mascara>" \
  MELHOR_ENVIO_TOKEN="<token_melhor_envio>" \
  LALAMOVE_API_KEY="<lalamove_api_key>" \
  LALAMOVE_API_SECRET="<lalamove_api_secret>" \
  --project-ref "$PROJ"

# ── IA ──
# LOVABLE_API_KEY: chama ai.gateway.lovable.dev (nao funciona fora do Lovable Cloud).
# Alternativa: usar OPENAI_API_KEY diretamente e ajustar predict-delays/index.ts.
supabase secrets set \
  OPENAI_API_KEY="<sk-...>" \
  LOVABLE_API_KEY="<nao-existe-fora-do-lovable-ver-docs/ops/predict-delays.md>" \
  --project-ref "$PROJ"

# ── Mapas e clima ──
supabase secrets set \
  MAPBOX_PUBLIC_TOKEN="<pk.eyJ1Ijo...>" \
  OPENWEATHER_API_KEY="<openweather_key>" \
  --project-ref "$PROJ"

# ── Comunicacao ──
supabase secrets set \
  RESEND_API_KEY="<re_...>" \
  ATICKET_API_KEY="<aticket_key>" \
  SECURITY_SLACK_WEBHOOK_URL="<https://hooks.slack.com/services/...>" \
  --project-ref "$PROJ"

# ── CRM / integracao ──
supabase secrets set \
  BITRIX24_WEBHOOK_URL="<https://promobrindes.bitrix24.com.br/rest/1/...>" \
  --project-ref "$PROJ"

# ── Cache (Upstash Redis) ──
# Sem UPSTASH_REDIS_REST_*: rate limiting usa fallback em memoria (funciona, sem persistencia entre cold starts)
supabase secrets set \
  UPSTASH_REDIS_REST_URL="<https://...upstash.io>" \
  UPSTASH_REDIS_REST_TOKEN="<AX...>" \
  --project-ref "$PROJ"

# ── LGPD / criptografia ──
# Gerar: openssl rand -hex 32
# Cifrar transportadoras.credentials com secure-store apos definir
supabase secrets set \
  FIELD_ENCRYPTION_KEY="<hex_64_chars>" \
  --project-ref "$PROJ"

echo "Done. Verificar: supabase secrets list --project-ref $PROJ"
