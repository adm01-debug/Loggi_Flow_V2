#!/bin/sh
# Backup diario da ORIGEM (Lovable hgicfqjayrjurivtygqf) ate o descomissionamento. Roda no container claude-code da VPS.
# Segredo fora do repo: /workspace/.secrets/loggi-origem.pgpass (formato pgpass: host:port:db:user:senha)
set -e
export PGPASSFILE=/workspace/.secrets/loggi-origem.pgpass
OUT=/workspace/backups/loggi-flow-v2
DAY=$(date +%F)
mkdir -p "$OUT"
/usr/lib/postgresql/17/bin/pg_dump "host=aws-1-us-east-1.pooler.supabase.com port=5432 user=postgres.hgicfqjayrjurivtygqf dbname=postgres sslmode=require" -Fc -f "$OUT/origem-$DAY.dump"
sha256sum "$OUT/origem-$DAY.dump" >> "$OUT/MANIFEST.txt"
# rotacao: 7 diarios + 4 semanais (domingos)
find "$OUT" -name 'origem-*.dump' -mtime +7 ! -name "origem-*$(date -d 'last sunday' +%F 2>/dev/null)*.dump" -type f | while read f; do d=$(basename "$f" .dump | cut -d- -f2-); [ "$(date -d "$d" +%u)" = 7 ] && [ "$(( ( $(date +%s) - $(date -d "$d" +%s) ) / 86400 ))" -le 28 ] || rm -f "$f"; done
echo "ok $DAY"
