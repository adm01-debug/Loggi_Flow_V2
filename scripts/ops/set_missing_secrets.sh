#!/bin/sh
# Secrets com PLACEHOLDER_NEEDS_SETUP — preencher antes do cutover (etapa 83)
# Uso: export SUPABASE_ACCESS_TOKEN=sbp_... && sh scripts/ops/set_missing_secrets.sh [--apply]
# Modo seguro: sem --apply, apenas mostra o plano (nomes, sem valores) e sai com sucesso.
set -eu

# dash (sh padrao no Ubuntu) nao suporta pipefail; ativa apenas se o shell aceitar
if (set -o pipefail) 2>/dev/null; then
  set -o pipefail
fi

PROJ=jvfhclubfpxrtrrazrgr

# ── Valores a preencher (substitua os placeholders antes de rodar com --apply) ──
RODONAVES_USERNAME="<usuario_portal_rodonaves>"
RODONAVES_PASSWORD="<senha_portal_rodonaves>"
RODONAVES_CNPJ_REMETENTE="<cnpj_sem_mascara>"
MELHOR_ENVIO_TOKEN="<token_melhor_envio>"
LALAMOVE_API_KEY="<lalamove_api_key>"
LALAMOVE_API_SECRET="<lalamove_api_secret>"
OPENAI_API_KEY="<sk-...>"
LOVABLE_API_KEY="<nao-existe-fora-do-lovable-ver-docs/ops/predict-delays.md>"
MAPBOX_PUBLIC_TOKEN="<pk.eyJ1Ijo...>"
OPENWEATHER_API_KEY="<openweather_key>"
RESEND_API_KEY="<re_...>"
ATICKET_API_KEY="<aticket_key>"
SECURITY_SLACK_WEBHOOK_URL="<https://hooks.slack.com/services/...>"
BITRIX24_WEBHOOK_URL="<https://promobrindes.bitrix24.com.br/rest/1/...>"
UPSTASH_REDIS_REST_URL="<https://...upstash.io>"
UPSTASH_REDIS_REST_TOKEN="<AX...>"
FIELD_ENCRYPTION_KEY="<hex_64_chars>"

# Segredos gerenciados pelo script (usados no guard e no plano)
SEGREDOS="RODONAVES_USERNAME RODONAVES_PASSWORD RODONAVES_CNPJ_REMETENTE MELHOR_ENVIO_TOKEN LALAMOVE_API_KEY LALAMOVE_API_SECRET OPENAI_API_KEY LOVABLE_API_KEY MAPBOX_PUBLIC_TOKEN OPENWEATHER_API_KEY RESEND_API_KEY ATICKET_API_KEY SECURITY_SLACK_WEBHOOK_URL BITRIX24_WEBHOOK_URL UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN FIELD_ENCRYPTION_KEY"

# Guard: nenhum valor placeholder pode chegar a CLI
guard_placeholder() {
  for nome in $SEGREDOS; do
    eval "valor=\${$nome:-}"
    case "$valor" in
      *\<*|*\>*|*[Pp][Ll][Aa][Cc][Ee][Hh][Oo][Ll][Dd][Ee][Rr]*)
        echo "Erro: a variavel '$nome' ainda contem placeholder ('$valor')." >&2
        echo "Preencha o valor real no topo do script antes de executar." >&2
        exit 1
        ;;
    esac
  done
}

# Verifica prerequisitos de ambiente para o apply
valida_ambiente() {
  if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    echo "Erro: SUPABASE_ACCESS_TOKEN nao definido. Exporte antes: export SUPABASE_ACCESS_TOKEN=sbp_..." >&2
    exit 1
  fi
  if ! command -v supabase >/dev/null 2>&1; then
    echo "Erro: CLI 'supabase' nao encontrada no PATH." >&2
    exit 1
  fi
}

# Plano (dry-run): o que seria setado, sem expor valores
mostra_plano() {
  echo "Plano (dry-run): sem --apply nada foi enviado. Com --apply seriam definidos no projeto $PROJ:"
  for nome in $SEGREDOS; do
    echo "  - $nome"
  done
}

APPLY=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    *)
      echo "Erro: argumento desconhecido '$arg'. Uso: sh scripts/ops/set_missing_secrets.sh [--apply]" >&2
      exit 2
      ;;
  esac
done

guard_placeholder

if [ "$APPLY" -eq 0 ]; then
  mostra_plano
  exit 0
fi

valida_ambiente

if [ -t 0 ]; then
  printf "Confirmar definicao dos segredos no projeto %s? (s/N) " "$PROJ"
  read -r confirm
  case "$confirm" in
    s|S|sim|Sim|SIM)
      ;;
    *)
      echo "Abortado pelo usuario."
      exit 1
      ;;
  esac
fi

# ── Transportadoras ──
supabase secrets set \
  RODONAVES_USERNAME="$RODONAVES_USERNAME" \
  RODONAVES_PASSWORD="$RODONAVES_PASSWORD" \
  RODONAVES_CNPJ_REMETENTE="$RODONAVES_CNPJ_REMETENTE" \
  MELHOR_ENVIO_TOKEN="$MELHOR_ENVIO_TOKEN" \
  LALAMOVE_API_KEY="$LALAMOVE_API_KEY" \
  LALAMOVE_API_SECRET="$LALAMOVE_API_SECRET" \
  --project-ref "$PROJ"

# ── IA ──
# LOVABLE_API_KEY: chama ai.gateway.lovable.dev (nao funciona fora do Lovable Cloud).
# Alternativa: usar OPENAI_API_KEY diretamente e ajustar predict-delays/index.ts.
supabase secrets set \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  LOVABLE_API_KEY="$LOVABLE_API_KEY" \
  --project-ref "$PROJ"

# ── Mapas e clima ──
supabase secrets set \
  MAPBOX_PUBLIC_TOKEN="$MAPBOX_PUBLIC_TOKEN" \
  OPENWEATHER_API_KEY="$OPENWEATHER_API_KEY" \
  --project-ref "$PROJ"

# ── Comunicacao ──
supabase secrets set \
  RESEND_API_KEY="$RESEND_API_KEY" \
  ATICKET_API_KEY="$ATICKET_API_KEY" \
  SECURITY_SLACK_WEBHOOK_URL="$SECURITY_SLACK_WEBHOOK_URL" \
  --project-ref "$PROJ"

# ── CRM / integracao ──
supabase secrets set \
  BITRIX24_WEBHOOK_URL="$BITRIX24_WEBHOOK_URL" \
  --project-ref "$PROJ"

# ── Cache (Upstash Redis) ──
# Sem UPSTASH_REDIS_REST_*: rate limiting usa fallback em memoria (funciona, sem persistencia entre cold starts)
supabase secrets set \
  UPSTASH_REDIS_REST_URL="$UPSTASH_REDIS_REST_URL" \
  UPSTASH_REDIS_REST_TOKEN="$UPSTASH_REDIS_REST_TOKEN" \
  --project-ref "$PROJ"

# ── LGPD / criptografia ──
# Gerar: openssl rand -hex 32
# Cifrar transportadoras.credentials com secure-store apos definir
supabase secrets set \
  FIELD_ENCRYPTION_KEY="$FIELD_ENCRYPTION_KEY" \
  --project-ref "$PROJ"

echo "Done. Verificar: supabase secrets list --project-ref $PROJ"