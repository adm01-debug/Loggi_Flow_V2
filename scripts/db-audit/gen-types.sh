#!/usr/bin/env bash
# gen-types.sh [--local] [arquivo_de_saida]
# Gera os types TypeScript do schema public (src/integrations/supabase/types.ts).
#
# Modo padrao: introspecta o banco oficial (DESTINO_URL) com
#   `supabase gen types typescript --db-url ... --schema public`.
#   Uso em CI: types-sync.yml (`bash scripts/db-audit/gen-types.sh /tmp/types.new.ts`).
#   Uso local: DESTINO_URL="postgresql://..." bash scripts/db-audit/gen-types.sh [saida]
#   Rodar da raiz do repositorio (a CA pinada e o proxy sao resolvidos a partir dela).
#
# Modo --local: introspecta o Postgres local de `supabase db start` (so o que
#   esta em supabase/migrations; nao enxerga o banco oficial). Nenhum workflow usa.
#
# Saida padrao: /tmp/types.generated.ts. Exit: 0=gerado, 1=falha, 2=uso invalido.
#
# Por que o proxy: a CLI entrega a --db-url em texto puro a um container
# (postgres-meta). Com a credencial real ali, ela fica visivel via /proc a
# qualquer processo do job. Com pgbouncer disponivel, sobe um proxy so-loopback
# (config 0600 em diretorio 0700, ver local-pg-proxy.mjs) e a CLI recebe uma
# credencial descartavel; o trecho proxy->banco usa verify-full com a CA pinada.
# Em CI sem pgbouncer o script falha em vez de expor a credencial.
set -euo pipefail

uso() {
  sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
}

MODE=db-url
if [ "${1:-}" = "--local" ]; then
  MODE=local
  shift
fi
case "${1:-}" in
  -h|--help) uso; exit 0 ;;
  -*) echo "Erro: opcao desconhecida: $1" >&2; uso >&2; exit 2 ;;
esac
if [ "$#" -gt 1 ]; then
  echo "Erro: argumentos demais." >&2
  uso >&2
  exit 2
fi

OUTPUT="${1:-/tmp/types.generated.ts}"
TMP_ROOT="${TMPDIR:-/tmp}"
RETRY_DELAY_S="${GEN_TYPES_RETRY_DELAY_S:-10}"
case "$RETRY_DELAY_S" in
  ''|*[!0-9]*) RETRY_DELAY_S=10 ;;
esac

if ! command -v supabase >/dev/null 2>&1; then
  echo "Erro: supabase CLI ausente no PATH (CI: supabase/setup-cli)." >&2
  exit 1
fi

TMP=''
PROXY_DIR=''
PROXY_PID=''
limpar() {
  if [ -n "$PROXY_PID" ]; then
    # TERM e, se o pgbouncer nao sair em ~2s (a partir da 1.23 o TERM espera os
    # clientes), KILL: o proxy nunca pode sobrar vivo com a credencial real.
    kill "$PROXY_PID" 2>/dev/null || true
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      kill -0 "$PROXY_PID" 2>/dev/null || break
      sleep 0.2
    done
    kill -9 "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
  if [ -n "$TMP" ]; then rm -f "$TMP" "$TMP.normalized"; fi
  if [ -n "$PROXY_DIR" ]; then rm -rf "$PROXY_DIR"; fi
}
trap limpar EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

TMP="$(mktemp "$TMP_ROOT/types.XXXXXX")"

# O banco oficial tem rajadas transitorias de saturacao em que a CLI morre com
# "timeout exceeded when trying to connect". Um gate de conformidade nao pode
# ficar vermelho por isso: tenta de novo com espera crescente. Saida vazia com
# exit 0 tambem conta como falha.
gerar() {
  local tentativa=1 max=3 espera
  while :; do
    if supabase gen types typescript "$@" > "$TMP" && [ -s "$TMP" ]; then
      return 0
    fi
    if [ "$tentativa" -ge "$max" ]; then
      break
    fi
    espera=$((tentativa * RETRY_DELAY_S))
    echo "Aviso: 'supabase gen types' falhou na tentativa ${tentativa}/${max}; nova tentativa em ${espera}s." >&2
    sleep "$espera"
    tentativa=$((tentativa + 1))
  done
  echo "Erro: 'supabase gen types' falhou em ${max} tentativas." >&2
  return 1
}

if [ "$MODE" = local ]; then
  gerar --local --schema public
else
  if [ -z "${DESTINO_URL:-}" ]; then
    echo "Erro: DESTINO_URL nao definida no ambiente." >&2
    exit 1
  fi

  if command -v pgbouncer >/dev/null 2>&1; then
    if [ ! -f scripts/db-audit/local-pg-proxy.mjs ]; then
      echo "Erro: rode a partir da raiz do repositorio (scripts/db-audit/local-pg-proxy.mjs nao encontrado)." >&2
      exit 1
    fi
    PROXY_DIR="$(mktemp -d "$TMP_ROOT/pg-proxy.XXXXXX")"
    chmod 700 "$PROXY_DIR"

    PROXY_PORT="$(node scripts/db-audit/local-pg-proxy.mjs "$PROXY_DIR")"
    case "$PROXY_PORT" in
      ''|*[!0-9]*) echo "Erro: local-pg-proxy.mjs nao devolveu uma porta." >&2; exit 1 ;;
    esac

    # Saida do pgbouncer vai para dentro do PROXY_DIR (apagado ao sair): o log
    # dele traz usuario e IP reais do banco, que o ::add-mask:: do workflow nao
    # cobre por serem so fragmentos da DESTINO_URL.
    pgbouncer "$PROXY_DIR/pgbouncer.ini" >"$PROXY_DIR/pgbouncer.stdout.log" 2>&1 &
    PROXY_PID=$!

    # Espera so a porta abrir (TCP puro). `pg_isready` nao serve: ele manda o
    # startup packet, o pgbouncer segura o cliente ate fechar o handshake com o
    # banco e NAO libera a vaga quando o probe desiste (3s). Com o banco lento,
    # 10 probes esgotam max_client_conn e o 11o devolve "accepting connections"
    # (a recusa por lotacao conta como resposta) - falso pronto.
    i=0
    until (exec 3<>"/dev/tcp/127.0.0.1/$PROXY_PORT") 2>/dev/null; do
      if ! kill -0 "$PROXY_PID" 2>/dev/null; then
        if grep -q 'should not run as root' "$PROXY_DIR/pgbouncer.stdout.log" 2>/dev/null; then
          echo "Erro: pgbouncer recusa rodar como root; rode com um usuario comum." >&2
        elif grep -qi 'address already in use' "$PROXY_DIR/pgbouncer.stdout.log" 2>/dev/null; then
          echo "Erro: a porta local do proxy foi ocupada por outro processo; rode de novo." >&2
        else
          echo "Erro: pgbouncer encerrou antes de aceitar conexoes (log omitido: traz dados da conexao)." >&2
        fi
        exit 1
      fi
      i=$((i + 1))
      if [ "$i" -ge 50 ]; then
        echo "Erro: proxy local (pgbouncer) nao subiu a tempo." >&2
        exit 1
      fi
      sleep 0.2
    done

    # sslmode=disable so na perna loopback: o lado que escuta em 127.0.0.1
    # (auth_type=trust) nao fala TLS, e o job exporta PGSSLMODE=verify-full.
    # Usuario/senha aqui sao descartaveis (o trust ignora) e nunca apontam para
    # o banco oficial. --network-id host fixa a rede do container da CLI em vez
    # de depender da rede gerada a cada execucao.
    PROXY_USER=proxy
    gerar \
      --db-url "postgresql://${PROXY_USER}:${PROXY_USER}@127.0.0.1:${PROXY_PORT}/proxydb?sslmode=disable" \
      --network-id host \
      --schema public
  else
    if [ "${CI:-}" = "true" ]; then
      echo "Erro: pgbouncer ausente em CI; a DESTINO_URL nao pode ir direto no --db-url. Rode scripts/ci/install-pgbouncer.sh antes." >&2
      exit 1
    fi
    echo "Aviso: pgbouncer ausente; DESTINO_URL vai direto no --db-url (visivel via ps/proc). Instale pgbouncer para blindar a credencial." >&2
    gerar --db-url "$DESTINO_URL" --schema public
  fi
fi

# A CLI pode emitir mais de uma quebra de linha no EOF. Normaliza so as linhas
# vazias finais (artefato deterministico, passa em `git diff --check`) e
# preserva as internas.
awk '
  NF {
    while (blank_lines > 0) {
      print ""
      blank_lines--
    }
    print
    next
  }
  { blank_lines++ }
' "$TMP" > "$TMP.normalized"

mv "$TMP.normalized" "$OUTPUT"
BYTES="$(wc -c < "$OUTPUT")"
echo "types gerado: ${OUTPUT} (${BYTES} bytes)"
