#!/bin/sh
# Secrets das edge functions do projeto oficial — referencia dos NOMES esperados e envio dos que
# ainda estao com PLACEHOLDER_NEEDS_SETUP (cutover, etapa 83).
#
# Os VALORES nunca ficam neste arquivo: vem de um arquivo NOME=valor fora do git (--env-file) ou,
# sem ele, das variaveis de ambiente de mesmo nome. Sem --apply nada e' enviado.
#
# Uso:
#   sh scripts/ops/set_missing_secrets.sh --modelo > ~/loggi-secrets.env   # gera o arquivo para preencher
#   sh scripts/ops/set_missing_secrets.sh --env-file ~/loggi-secrets.env   # mostra o que seria enviado
#   export SUPABASE_ACCESS_TOKEN=sbp_... && \
#     sh scripts/ops/set_missing_secrets.sh --env-file ~/loggi-secrets.env --apply
#   sh scripts/ops/set_missing_secrets.sh --list                          # so' os nomes esperados
#
# So' vai para a CLI o que tem valor real: vazio, <entre_sinais> ou contendo "placeholder" fica de
# fora e aparece como faltando. Nenhum valor e' impresso. Saida: 0 ok, 1 falha, 2 uso incorreto.
set +x  # nunca ecoar valor, mesmo se chamado com `sh -x`
set -eu

PROJ=jvfhclubfpxrtrrazrgr

# NOME|observacao — um por linha, tudo o que supabase/functions le com Deno.env.get (o teste
# scripts/ops/set-missing-secrets.unit.mjs confere esta lista contra o codigo).
# Ficam de fora de proposito: SUPABASE_URL/SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY (injetados
# pela plataforma) e ALLOW_TEST_MODE (liga modo de teste nos webhooks; nao se define em producao).
catalogo() {
  cat <<'EOF'
# ── Transportadoras ──
RODONAVES_USERNAME|usuario do portal Rodonaves
RODONAVES_PASSWORD|senha do portal Rodonaves
RODONAVES_CNPJ_REMETENTE|CNPJ sem mascara
RODONAVES_WEBHOOK_SECRET|HMAC do rodonaves-webhook (sem ele o webhook recusa tudo)
MELHOR_ENVIO_TOKEN|token Melhor Envio
MELHOR_ENVIO_SANDBOX|opcional; true liga o sandbox fora do projeto de producao
LALAMOVE_API_KEY|
LALAMOVE_API_SECRET|tambem e' o HMAC do lalamove-webhook
LALAMOVE_BASE_URL|opcional; padrao https://rest.lalamove.com
CARRIER_WEBHOOK_SECRET|HMAC do carrier-webhook-receiver (sem ele o webhook recusa tudo)
# ── IA ──
GOOGLE_API_KEY|predict-delays e ai-logistics-assistant
OPENAI_API_KEY|normalize-freight-response (sk-...)
# ── Mapas e clima ──
OPENWEATHER_API_KEY|
# ── Comunicacao ──
RESEND_API_KEY|re_...
SECURITY_ALERT_EMAIL|destinatario dos alertas do log-security-event
SECURITY_SLACK_WEBHOOK_URL|https://hooks.slack.com/services/...
EVOLUTION_API_URL|WhatsApp Evolution
EVOLUTION_API_KEY|WhatsApp Evolution
EVOLUTION_INSTANCE_NAME|conexao usada por whatsapp-notification (padrao PRINCIPAL)
EVOLUTION_ALLOWED_INSTANCES|opcional; conexoes extras aceitas por evolution-whatsapp (virgula)
APP_URL|URL publica do app, usada nos links dos e-mails de SLA
# ── CRM / integracao ──
BITRIX24_WEBHOOK_URL|https://promobrindes.bitrix24.com.br/rest/1/...
NEXUS_WEBHOOK_SECRET|HMAC do nexus-webhook-receiver (obrigatorio quando definido)
EXTERNAL_SUPABASE_URL|external-db-bridge: OUTRO projeto Supabase, nunca o oficial
EXTERNAL_SUPABASE_SERVICE_KEY|external-db-bridge
EXTERNAL_DB_ALLOWED_TABLES|opcional; tabelas liberadas no bridge (virgula)
EXTERNAL_DB_ALLOWED_RPCS|opcional; RPCs liberadas no bridge (virgula)
# ── Cache (Upstash Redis) ──
# Sem UPSTASH_REDIS_REST_*: rate limiting usa fallback em memoria (funciona, sem persistencia entre cold starts)
UPSTASH_REDIS_REST_URL|https://...upstash.io
UPSTASH_REDIS_REST_TOKEN|
# ── Push (Web Push) ──
VAPID_SUBJECT|mailto: ou URL do site, usado por push-send
VAPID_PUBLIC_KEY|chave publica VAPID
VAPID_PRIVATE_KEY|chave privada VAPID (segredo)
# ── Plataforma ──
INTERNAL_FN_SECRET|header x-internal-secret dos crons; o MESMO valor do vault (ver scripts/ops/pos_deploy_functions.sql)
ALLOWED_ORIGINS|opcional; origens CORS separadas por virgula (padrao *)
# ── LGPD / criptografia ──
# Gerar: openssl rand -hex 32
# Cifrar transportadoras.credentials com secure-store apos definir
FIELD_ENCRYPTION_KEY|>= 32 caracteres; trocar depois de haver dado cifrado torna esse dado ilegivel
EOF
}

nomes() { catalogo | sed -n 's/^\([A-Z][A-Z0-9_]*\)|.*$/\1/p'; }

uso() {
  sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
}

erro() { echo "Erro: $*" >&2; }

# Vazio, so' espacos, <entre_sinais> ou contendo "placeholder": nao e' valor real.
eh_placeholder() {
  case "$1" in
    *[![:space:]]*) ;;
    *) return 0 ;;
  esac
  case "$1" in
    '<'*'>') return 0 ;;
    *[Pp][Ll][Aa][Cc][Ee][Hh][Oo][Ll][Dd][Ee][Rr]*) return 0 ;;
  esac
  return 1
}

conhecido() {
  case "
$NOMES
" in
    *"
$1
"*) return 0 ;;
  esac
  return 1
}

# Le NOME=valor sem executar nada do arquivo: sem expansao de $, sem `eval` do conteudo.
ler_arquivo() {
  arq=$1
  cr=$(printf '\r')
  n=0
  while IFS= read -r linha || [ -n "$linha" ]; do
    n=$((n + 1))
    linha=${linha%"$cr"}
    linha=${linha#"${linha%%[![:space:]]*}"}
    case "$linha" in
      '' | '#'*) continue ;;
      'export '*) linha=${linha#export } ;;
    esac
    case "$linha" in
      *=*) ;;
      *) erro "$arq, linha $n: esperado NOME=valor."; exit 2 ;;
    esac
    nome=${linha%%=*}
    nome=${nome%"${nome##*[![:space:]]}"}
    valor=${linha#*=}
    case "$nome" in
      '' | [!A-Z]* | *[!A-Z0-9_]*) erro "$arq, linha $n: nome de variavel invalido."; exit 2 ;;
    esac
    if ! conhecido "$nome"; then
      erro "$arq, linha $n: $nome nao e' um secret esperado (nome digitado errado?). Veja --list."
      exit 2
    fi
    if eval "[ \"\${DEF_$nome+x}\" = x ]"; then
      erro "$arq, linha $n: $nome aparece mais de uma vez."
      exit 2
    fi
    valor=${valor#"${valor%%[![:space:]]*}"}
    valor=${valor%"${valor##*[![:space:]]}"}
    case "$valor" in
      \"*\") valor=${valor#\"}; valor=${valor%\"} ;;
      \'*\') valor=${valor#\'}; valor=${valor%\'} ;;
    esac
    eval "DEF_$nome=1; VAL_$nome=\$valor"
  done <"$arq"
}

ler_ambiente() {
  for nome in $NOMES; do
    if eval "[ \"\${$nome+x}\" = x ]"; then
      eval "DEF_$nome=1; VAL_$nome=\$$nome"
    fi
  done
}

# Arquivo de segredos dentro do repositorio so' se o git o ignora — senao um `git add` o commita.
recusar_arquivo_versionavel() {
  dir=$(cd "$(dirname "$1")" 2>/dev/null && pwd) || return 0
  command -v git >/dev/null 2>&1 || return 0
  git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 0
  git -C "$dir" check-ignore -q "$dir/$(basename "$1")" 2>/dev/null && return 0
  erro "$1 esta' dentro de um repositorio git e nao e' ignorado: mova-o para fora (ex.: ~/loggi-secrets.env)."
  exit 2
}

APPLY=0
ARQUIVO=
MODO=enviar
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --list) MODO=list ;;
    --modelo) MODO=modelo ;;
    --env-file)
      [ $# -ge 2 ] || { erro "--env-file precisa do caminho do arquivo."; exit 2; }
      ARQUIVO=$2
      shift
      ;;
    --env-file=*) ARQUIVO=${1#--env-file=} ;;
    -h | --help) uso; exit 0 ;;
    *) erro "argumento desconhecido '$1'."; uso >&2; exit 2 ;;
  esac
  shift
done

NOMES=$(nomes)

case "$MODO" in
  list) echo "$NOMES"; exit 0 ;;
  modelo)
    echo "# Secrets das edge functions de $PROJ — preencha so' os que for enviar e guarde FORA do git."
    catalogo | sed -e 's/^\([A-Z][A-Z0-9_]*\)|\(..*\)$/# \2\
\1=/' -e 's/^\([A-Z][A-Z0-9_]*\)|$/\1=/'
    exit 0
    ;;
esac

if [ -n "$ARQUIVO" ]; then
  [ -f "$ARQUIVO" ] && [ -r "$ARQUIVO" ] || { erro "arquivo nao encontrado ou ilegivel: $ARQUIVO"; exit 2; }
  recusar_arquivo_versionavel "$ARQUIVO"
  ler_arquivo "$ARQUIVO"
  ORIGEM="arquivo $ARQUIVO"
else
  ler_ambiente
  ORIGEM="variaveis de ambiente"
fi

# Monta o argv da CLI em "$@": cada valor vai inteiro, sem passar por novo parse do shell.
set --
ENVIAR=
FALTANDO=
PLACEHOLDER=
for nome in $NOMES; do
  if ! eval "[ \"\${DEF_$nome+x}\" = x ]"; then
    FALTANDO="$FALTANDO $nome"
    continue
  fi
  eval "valor=\$VAL_$nome"
  if eh_placeholder "$valor"; then
    PLACEHOLDER="$PLACEHOLDER $nome"
    continue
  fi
  if [ "$nome" = FIELD_ENCRYPTION_KEY ] && [ "${#valor}" -lt 32 ]; then
    erro "FIELD_ENCRYPTION_KEY tem menos de 32 caracteres: as functions recusariam (fail-closed). Gere com: openssl rand -hex 32"
    exit 1
  fi
  set -- "$@" "$nome=$valor"
  ENVIAR="$ENVIAR $nome"
done
valor=

echo "Projeto: $PROJ — origem dos valores: $ORIGEM"
echo "Com valor (${#}):"
for nome in $ENVIAR; do echo "  + $nome"; done
if [ -n "$PLACEHOLDER" ]; then
  echo "Ignorados por estarem vazios ou com placeholder:"
  for nome in $PLACEHOLDER; do echo "  ! $nome"; done
fi
if [ -n "$FALTANDO" ]; then
  echo "Sem valor informado (nao serao alterados):"
  for nome in $FALTANDO; do echo "  - $nome"; done
fi
case " $ENVIAR " in
  *" FIELD_ENCRYPTION_KEY "*)
    echo "ATENCAO: se ja' existe dado cifrado com outra FIELD_ENCRYPTION_KEY, troca'-la torna esse dado ilegivel." >&2
    ;;
esac

if [ "$APPLY" -eq 0 ]; then
  echo "Dry-run: nada foi enviado. Para enviar os $# acima, repita o comando com --apply."
  exit 0
fi

if [ $# -eq 0 ]; then
  erro "nenhum secret com valor real para enviar."
  exit 1
fi
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  erro "SUPABASE_ACCESS_TOKEN nao definido. Exporte antes: export SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 1
fi
if ! command -v supabase >/dev/null 2>&1; then
  erro "CLI 'supabase' nao encontrada no PATH."
  exit 1
fi

# Uma chamada so': ou a CLI aceita o lote inteiro ou falha — nao sobra metade aplicada por este script.
# --yes: em CI (Sem TTY) o CLI pede confirmacao e aborta sem ela.
rc=0
supabase secrets set --yes "$@" --project-ref "$PROJ" || rc=$?
if [ "$rc" -ne 0 ]; then
  erro "'supabase secrets set' falhou (codigo $rc). Confira o estado com: supabase secrets list --project-ref $PROJ"
  exit "$rc"
fi

echo "Done: $# secret(s) enviados. Verificar: supabase secrets list --project-ref $PROJ"
