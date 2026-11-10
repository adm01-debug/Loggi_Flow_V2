#!/bin/sh
# Backup diario da ORIGEM (Lovable hgicfqjayrjurivtygqf) ate o descomissionamento. Roda no container claude-code da VPS.
# Segredo fora do repo: /workspace/.secrets/loggi-origem.pgpass (formato pgpass: host:port:db:user:senha)
# Overrides por env (defaults = VPS): BACKUP_PGPASSFILE, BACKUP_DIR (destino), PG_DUMP (binario).
# Somente leitura na origem: so roda pg_dump. Teste: node --test scripts/ops/backup_origem.unit.mjs
set -eu
export PGPASSFILE="${BACKUP_PGPASSFILE:-/workspace/.secrets/loggi-origem.pgpass}"
OUT=${BACKUP_DIR:-/workspace/backups/loggi-flow-v2}
DAY=$(date +%F)
if [ ! -r "$PGPASSFILE" ]; then
  echo "ERRO: pgpass ausente ou ilegivel em $PGPASSFILE - backup de $DAY nao executado" >&2
  exit 1
fi
mkdir -p "$OUT"
PG_DUMP=${PG_DUMP:-/usr/lib/postgresql/17/bin/pg_dump}
# Dump em arquivo .partial e rename so no sucesso: falha no meio nao deixa dump truncado com o nome
# final (a rotacao o contaria como backup valido) nem sobrescreve o dump bom ja feito no dia.
# --no-password: sem entrada valida no pgpass, falha na hora em vez de esperar senha no terminal.
TMP="$OUT/origem-$DAY.dump.partial"
if ! "$PG_DUMP" "host=aws-1-us-east-1.pooler.supabase.com port=5432 user=postgres.hgicfqjayrjurivtygqf dbname=postgres sslmode=require" --no-password -Fc -f "$TMP" || [ ! -s "$TMP" ]; then
  rm -f "$TMP"
  echo "ERRO: pg_dump falhou em $DAY - dump nao gerado; MANIFEST e rotacao nao executados" >&2
  exit 1
fi
mv -f "$TMP" "$OUT/origem-$DAY.dump"
# MANIFEST com cabecalho datado; linhas '#' nao quebram consumidores existentes
if [ ! -f "$OUT/MANIFEST.txt" ]; then
  echo "# backup - ROTINA <$DAY>" > "$OUT/MANIFEST.txt"
fi
# Reexecucao no mesmo dia troca a linha do dump de hoje; empilhar deixaria o hash antigo e
# `sha256sum -c MANIFEST.txt` acusaria FAILED num dump integro.
if grep -qF "  $OUT/origem-$DAY.dump" "$OUT/MANIFEST.txt"; then
  grep -vF "  $OUT/origem-$DAY.dump" "$OUT/MANIFEST.txt" > "$OUT/MANIFEST.txt.tmp" || true
  mv -f "$OUT/MANIFEST.txt.tmp" "$OUT/MANIFEST.txt"
fi
sha256sum "$OUT/origem-$DAY.dump" >> "$OUT/MANIFEST.txt"
# rotacao: manter 7 diarios + ate 4 semanais (domingos), deterministica e POSIX-portatil (sem GNU date).
# Dia da semana calculado na data do nome (formula de Sakamoto) via aritmetica de shell.
# Protecao: nunca apaga o dump de hoje; nunca apaga nome fora do padrao origem-YYYY-MM-DD.dump; sem matches => nada e apagado.
if find "$OUT" -name 'origem-*.dump' -type f -print | grep -q .; then
  newest=$(find "$OUT" -name 'origem-*.dump' -type f -print | sed 's,.*/,,' | sort -r)
  i=0
  sundays_seen=0
  for f in $newest; do
    date_part=${f#origem-}
    date_part=${date_part%.dump}
    case $date_part in
      [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) ;;
      *) echo "aviso: preservado arquivo fora do padrao: $f" >&2; continue ;;
    esac
    y=${date_part%%-*}
    rest=${date_part#*-}
    mm=${rest%%-*}
    dd=${rest#*-}
    mm=${mm#0}; dd=${dd#0}
    if [ "$mm" -lt 3 ]; then y=$((y - 1)); fi
    case $mm in
      1) t=0;; 2) t=3;; 3) t=2;; 4) t=5;; 5) t=0;; 6) t=3;;
      7) t=5;; 8) t=1;; 9) t=4;; 10) t=6;; 11) t=2;; 12) t=4;;
      *) echo "aviso: preservado arquivo com data invalida: $f" >&2; continue ;;
    esac
    dow=$(( (y + y / 4 - y / 100 + y / 400 + t + dd) % 7 ))
    if [ "$dow" -eq 0 ]; then sundays_seen=$((sundays_seen + 1)); fi
    i=$((i + 1))
    keep=0
    [ "$i" -le 7 ] && keep=1
    [ "$dow" -eq 0 ] && [ "$sundays_seen" -le 4 ] && keep=1
    # protecao: nunca apagar o dump de hoje, mesmo que a contagem diga o contrario
    if [ "$keep" -eq 0 ] && [ "$date_part" != "$DAY" ]; then rm -f "$OUT/$f"; fi
  done
else
  echo "aviso: nenhum dump encontrado para rotacao" >&2
fi
echo "ok $DAY"
