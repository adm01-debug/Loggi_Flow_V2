// Testes de scripts/ops/backup_origem.sh (backup diário da ORIGEM, banco somente leitura).
// NUNCA conecta em banco: `pg_dump` é um stub que registra o argv e grava o que o cenário mandar;
// `date` é um stub para fixar o "hoje"; destino e pgpass são pastas temporárias (BACKUP_DIR e
// BACKUP_PGPASSFILE). Roda com /bin/sh, como o cron da VPS.
// Rodar: node --test scripts/ops/backup_origem.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'backup_origem.sh');
const SENHA = 'SENHA-SUPER-SECRETA-DO-TESTE';
const abertos = [];
after(() => abertos.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

const exe = (p, corpo) => { fs.writeFileSync(p, `#!/bin/sh\n${corpo}\n`); fs.chmodSync(p, 0o755); };
const sha256 = (texto) => crypto.createHash('sha256').update(texto).digest('hex');

function ambiente({ hoje = '2026-11-09', pgpass = true } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-origem-'));
  abertos.push(base);
  const bin = path.join(base, 'bin');
  const out = path.join(base, 'destino com espaço', 'loggi');
  const argvLog = path.join(base, 'argv.log');
  fs.mkdirSync(bin);
  fs.writeFileSync(argvLog, '');
  // pg_dump: grava $DUMP_CONTEUDO no arquivo do -f (DUMP_VAZIO=1 grava 0 bytes) e sai com $DUMP_EXIT.
  exe(path.join(bin, 'pg_dump'), `echo "argv: $*" >> "$ARGV_LOG"
echo "env: PGPASSFILE=$PGPASSFILE PGPASSWORD=\${PGPASSWORD:-<unset>}" >> "$ARGV_LOG"
while [ $# -gt 0 ]; do [ "$1" = "-f" ] && saida="$2"; shift; done
if [ -n "\${DUMP_VAZIO:-}" ]; then : > "$saida"; else printf '%s' "\${DUMP_CONTEUDO:-PGDMP-completo}" > "$saida"; fi
[ "\${DUMP_EXIT:-0}" -ne 0 ] && echo "pg_dump: error: connection to server was lost" >&2
exit "\${DUMP_EXIT:-0}"`);
  exe(path.join(bin, 'date'), `[ "$1" = "+%F" ] && { echo "$HOJE"; exit 0; }\necho "stub date: chamada inesperada: $*" >&2; exit 99`);
  const pgpassFile = path.join(base, 'origem.pgpass');
  if (pgpass) { fs.writeFileSync(pgpassFile, `host:5432:postgres:usuario:${SENHA}\n`); fs.chmodSync(pgpassFile, 0o600); }
  const roda = (env = {}) => {
    const r = spawnSync('/bin/sh', [SCRIPT], {
      cwd: base,
      encoding: 'utf8',
      env: { PATH: `${bin}:${process.env.PATH}`, HOJE: hoje, BACKUP_DIR: out, BACKUP_PGPASSFILE: pgpassFile, PG_DUMP: path.join(bin, 'pg_dump'), ARGV_LOG: argvLog, ...env },
    });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr, saida: `${r.stdout}${r.stderr}` };
  };
  const lista = () => (fs.existsSync(out) ? fs.readdirSync(out).sort() : []);
  const manifest = () => fs.readFileSync(path.join(out, 'MANIFEST.txt'), 'utf8').split('\n').filter(Boolean);
  const semeia = (...nomes) => { fs.mkdirSync(out, { recursive: true }); for (const n of nomes) fs.writeFileSync(path.join(out, n), `dump ${n}`); };
  return { base, bin, out, argvLog, pgpassFile, roda, lista, manifest, semeia };
}
const confereManifest = (a) => spawnSync('sha256sum', ['-c', path.join(a.out, 'MANIFEST.txt')], { encoding: 'utf8' });
const dump = (dia) => `origem-${dia}.dump`;

test('caminho feliz: cria o destino, grava o dump com a data no nome e o MANIFEST confere', () => {
  const a = ambiente();
  const r = a.roda({ DUMP_CONTEUDO: 'conteudo-A' });
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.stdout.trim(), 'ok 2026-11-09');
  assert.deepEqual(a.lista(), ['MANIFEST.txt', dump('2026-11-09')]);
  assert.equal(fs.readFileSync(path.join(a.out, dump('2026-11-09')), 'utf8'), 'conteudo-A');
  assert.deepEqual(a.manifest(), ['# backup - ROTINA <2026-11-09>', `${sha256('conteudo-A')}  ${path.join(a.out, dump('2026-11-09'))}`]);
  assert.equal(confereManifest(a).status, 0);
});

test('pg_dump recebe a origem, formato custom, --no-password e nenhuma senha em argv ou saída', () => {
  const a = ambiente();
  const r = a.roda();
  assert.equal(r.status, 0, r.saida);
  const log = fs.readFileSync(a.argvLog, 'utf8');
  assert.match(log, /argv: host=aws-1-us-east-1\.pooler\.supabase\.com port=5432 user=postgres\.hgicfqjayrjurivtygqf dbname=postgres sslmode=require --no-password -Fc -f /);
  assert.match(log, new RegExp(`env: PGPASSFILE=${a.pgpassFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} PGPASSWORD=<unset>`));
  assert.doesNotMatch(log.split('\n')[0], /password=/i);
  for (const texto of [log, r.saida, fs.readFileSync(path.join(a.out, 'MANIFEST.txt'), 'utf8')]) assert.ok(!texto.includes(SENHA));
});

test('falha do pg_dump no meio: exit 1, nenhum dump (nem parcial) no destino, MANIFEST intocado', () => {
  const a = ambiente();
  const r = a.roda({ DUMP_EXIT: '1', DUMP_CONTEUDO: 'TRUNCADO' });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /ERRO: pg_dump falhou em 2026-11-09/);
  assert.doesNotMatch(r.stdout, /^ok/m);
  assert.deepEqual(a.lista(), []);
});

test('falha hoje não destrói o dump bom já feito hoje nem o MANIFEST', () => {
  const a = ambiente();
  assert.equal(a.roda({ DUMP_CONTEUDO: 'BOM' }).status, 0);
  const manifestAntes = a.manifest();
  const r = a.roda({ DUMP_EXIT: '1', DUMP_CONTEUDO: 'TRUNCADO' });
  assert.equal(r.status, 1, r.saida);
  assert.equal(fs.readFileSync(path.join(a.out, dump('2026-11-09')), 'utf8'), 'BOM');
  assert.deepEqual(a.lista(), ['MANIFEST.txt', dump('2026-11-09')]);
  assert.deepEqual(a.manifest(), manifestAntes);
  assert.equal(confereManifest(a).status, 0);
});

test('falha hoje não conta como backup na rotação: nenhum dump antigo é apagado', () => {
  const a = ambiente();
  const antigos = Array.from({ length: 10 }, (_, i) => dump(`2026-10-${String(20 + i).padStart(2, '0')}`));
  a.semeia(...antigos);
  const r = a.roda({ DUMP_EXIT: '1' });
  assert.equal(r.status, 1, r.saida);
  assert.deepEqual(a.lista(), antigos);
});

test('pg_dump sai 0 mas grava 0 bytes: tratado como falha', () => {
  const a = ambiente();
  const r = a.roda({ DUMP_VAZIO: '1' });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /ERRO: pg_dump falhou/);
  assert.deepEqual(a.lista(), []);
});

test('pg_dump inexistente: exit 1 com erro, nada gravado', () => {
  const a = ambiente();
  const r = a.roda({ PG_DUMP: path.join(a.base, 'nao-existe/pg_dump') });
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /ERRO: pg_dump falhou/);
  assert.deepEqual(a.lista(), []);
});

test('pgpass ausente: para antes de chamar o pg_dump e não cria o destino', () => {
  const a = ambiente({ pgpass: false });
  const r = a.roda();
  assert.equal(r.status, 1, r.saida);
  assert.match(r.stderr, /ERRO: pgpass ausente ou ilegivel/);
  assert.equal(fs.readFileSync(a.argvLog, 'utf8'), '');
  assert.ok(!fs.existsSync(a.out));
});

test('PGPASSFILE herdado do ambiente não substitui o pgpass da origem', () => {
  const a = ambiente();
  const r = a.roda({ PGPASSFILE: '/outro/projeto.pgpass' });
  assert.equal(r.status, 0, r.saida);
  assert.ok(fs.readFileSync(a.argvLog, 'utf8').includes(`PGPASSFILE=${a.pgpassFile} `));
});

test('reexecução no mesmo dia: troca o dump e a linha do MANIFEST (sha256sum -c continua OK)', () => {
  const a = ambiente();
  assert.equal(a.roda({ DUMP_CONTEUDO: 'primeira' }).status, 0);
  const r = a.roda({ DUMP_CONTEUDO: 'segunda' });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(a.manifest(), ['# backup - ROTINA <2026-11-09>', `${sha256('segunda')}  ${path.join(a.out, dump('2026-11-09'))}`]);
  assert.equal(confereManifest(a).status, 0, confereManifest(a).stdout);
  assert.deepEqual(a.lista(), ['MANIFEST.txt', dump('2026-11-09')]);
});

test('MANIFEST acumula um dia por linha e mantém o cabeçalho', () => {
  const a = ambiente({ hoje: '2026-11-08' });
  assert.equal(a.roda({ DUMP_CONTEUDO: 'd8' }).status, 0);
  assert.equal(a.roda({ HOJE: '2026-11-09', DUMP_CONTEUDO: 'd9' }).status, 0);
  assert.deepEqual(a.manifest(), [
    '# backup - ROTINA <2026-11-08>',
    `${sha256('d8')}  ${path.join(a.out, dump('2026-11-08'))}`,
    `${sha256('d9')}  ${path.join(a.out, dump('2026-11-09'))}`,
  ]);
  assert.equal(confereManifest(a).status, 0);
});

test('resto de .partial de uma execução morta não atrapalha nem vira backup', () => {
  const a = ambiente();
  a.semeia(`${dump('2026-11-09')}.partial`, `${dump('2026-11-08')}.partial`);
  const r = a.roda();
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(a.lista(), ['MANIFEST.txt', dump('2026-11-08') + '.partial', dump('2026-11-09')]);
});

// Rotação: 7 mais recentes + os 4 domingos mais recentes; conferida contra o calendário do JS.
function esperadoAposRotacao(dias) {
  const ordem = [...dias].sort().reverse();
  let domingos = 0;
  return ordem.filter((dia, i) => {
    const domingo = new Date(`${dia}T00:00:00Z`).getUTCDay() === 0;
    if (domingo) domingos += 1;
    return i < 7 || (domingo && domingos <= 4);
  }).sort();
}
const diasAte = (hoje, n) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${hoje}T00:00:00Z`) - i * 86400000).toISOString().slice(0, 10));

for (const hoje of ['2026-11-09', '2026-03-01', '2024-02-29', '2027-01-03', '2025-12-31']) {
  test(`rotação com 60 dias de dumps até ${hoje}: sobram 7 diários + domingos`, () => {
    const a = ambiente({ hoje });
    const dias = diasAte(hoje, 60);
    a.semeia(...dias.slice(1).map(dump));
    const r = a.roda();
    assert.equal(r.status, 0, r.saida);
    const sobrou = a.lista().filter((n) => n.endsWith('.dump')).map((n) => n.slice('origem-'.length, -'.dump'.length));
    assert.deepEqual(sobrou, esperadoAposRotacao(dias));
    assert.ok(sobrou.length <= 11 && sobrou.includes(hoje));
  });
}

test('rotação é idempotente: rodar de novo no mesmo dia não apaga mais nada', () => {
  const a = ambiente();
  a.semeia(...diasAte('2026-11-09', 40).slice(1).map(dump));
  assert.equal(a.roda().status, 0);
  const depois = a.lista();
  assert.equal(a.roda().status, 0);
  assert.deepEqual(a.lista(), depois);
});

test('rotação nunca apaga o dump de hoje, mesmo com dumps de data futura', () => {
  const a = ambiente({ hoje: '2026-11-09' });
  a.semeia(...Array.from({ length: 9 }, (_, i) => dump(`2026-11-${String(10 + i).padStart(2, '0')}`)));
  const r = a.roda();
  assert.equal(r.status, 0, r.saida);
  assert.ok(a.lista().includes(dump('2026-11-09')));
});

test('rotação preserva (com aviso) arquivo fora do padrão e com data inválida', () => {
  const a = ambiente();
  const estranhos = ['origem-manual.dump', 'origem-2026-13-01.dump', 'origem-2026-1-1.dump', 'outro-2020-01-01.dump', 'origem-2020-01-01.dump.bak'];
  a.semeia(...estranhos, ...diasAte('2026-11-09', 20).slice(1).map(dump));
  const r = a.roda();
  assert.equal(r.status, 0, r.saida);
  for (const n of estranhos) assert.ok(a.lista().includes(n), `${n} foi apagado`);
  assert.match(r.stderr, /aviso: preservado arquivo fora do padrao: origem-manual\.dump/);
  assert.match(r.stderr, /aviso: preservado arquivo com data invalida: origem-2026-13-01\.dump/);
  assert.match(r.stdout, /^ok 2026-11-09$/m);
});

test('primeiro backup num destino vazio não apaga nada', () => {
  const a = ambiente();
  const r = a.roda();
  assert.equal(r.status, 0, r.saida);
  assert.doesNotMatch(r.stderr, /aviso/);
});

test('sintaxe válida em sh (dash) e bash', () => {
  for (const sh of ['/bin/sh', 'bash']) assert.equal(spawnSync(sh, ['-n', SCRIPT]).status, 0, sh);
});
