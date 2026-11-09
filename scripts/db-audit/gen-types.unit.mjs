// Teste de gen-types.sh. O `supabase` CLI e o `pgbouncer` sao dubles postos no PATH; o
// local-pg-proxy.mjs e o real. Nao abre conexao com banco nenhum. Offline.
// Rodar da raiz: node --test scripts/db-audit/gen-types.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const SCRIPT = path.join('scripts', 'db-audit', 'gen-types.sh');
const SENHA_REAL = 'S3nh4-R34l-d0-b4nc0';
const DESTINO = `postgresql://postgres.abc:${SENHA_REAL}@db.exemplo.com:5432/postgres`;
const TIPOS = 'export type Example = {\n\n  id: string\n}\n';

const SUPABASE_DUBLE = `#!/bin/sh
printf '%s\\n' "$*" >> "$DUBLE_DIR/supabase.args"
n=$(cat "$DUBLE_DIR/supabase.count" 2>/dev/null || echo 0)
n=$((n + 1))
echo "$n" > "$DUBLE_DIR/supabase.count"
if [ "$n" -le "\${DUBLE_FALHAS:-0}" ]; then
  echo 'Error: timeout exceeded when trying to connect' >&2
  exit 1
fi
[ -n "\${DUBLE_DORME:-}" ] && sleep "$DUBLE_DORME"
[ -n "\${DUBLE_VAZIO:-}" ] && exit 0
printf 'export type Example = {\\n\\n  id: string\\n}\\n\\n\\n'
`;

// Duble do pgbouncer: escuta na porta do .ini ate receber TERM, como o real em foreground.
const PGBOUNCER_DUBLE = `#!/bin/sh
if [ -n "\${DUBLE_PGB_MORRE:-}" ]; then
  echo "$DUBLE_PGB_MORRE"
  exit 1
fi
cp "$1" "$DUBLE_DIR/pgbouncer.ini.visto"
exec node -e '
const fs = require("fs");
const ini = fs.readFileSync(process.argv[1], "utf8");
const porta = Number(/^listen_port = (\\d+)$/m.exec(ini)[1]);
fs.writeFileSync(process.env.DUBLE_DIR + "/pgbouncer.pid", String(process.pid));
require("net").createServer((s) => s.destroy()).listen(porta, "127.0.0.1");
process.on("SIGTERM", () => { if (!process.env.DUBLE_PGB_IGNORA_TERM) process.exit(0); });
' "$1"
`;

function ambiente({ comPgbouncer = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-audit-gentypes-'));
  const bin = path.join(dir, 'bin');
  const tmp = path.join(dir, 'tmp');
  fs.mkdirSync(bin);
  fs.mkdirSync(tmp);
  fs.writeFileSync(path.join(bin, 'supabase'), SUPABASE_DUBLE, { mode: 0o755 });
  if (comPgbouncer) fs.writeFileSync(path.join(bin, 'pgbouncer'), PGBOUNCER_DUBLE, { mode: 0o755 });
  const env = (extra = {}) => ({
    PATH: [bin, path.dirname(process.execPath), '/usr/bin', '/bin'].join(':'),
    HOME: dir,
    TMPDIR: tmp,
    DUBLE_DIR: dir,
    GEN_TYPES_RETRY_DELAY_S: '0',
    ...extra,
  });
  const rodar = (args = [], extra = {}) => {
    const r = spawnSync('bash', [SCRIPT, ...args], { cwd: RAIZ, encoding: 'utf8', env: env(extra), timeout: 30_000 });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  };
  const ler = (nome) => (fs.existsSync(path.join(dir, nome)) ? fs.readFileSync(path.join(dir, nome), 'utf8') : '');
  return {
    dir,
    tmp,
    env,
    rodar,
    ler,
    saida: path.join(dir, 'types.ts'),
    chamadas: () => Number(ler('supabase.count') || 0),
    limpar: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

function caso(nome, opcoes, fn) {
  test(nome, opcoes.skip ? { skip: opcoes.skip } : {}, async () => {
    const amb = ambiente(opcoes);
    try {
      await fn(amb);
    } finally {
      amb.limpar();
    }
  });
}

const vivo = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

// Os casos "sem pgbouncer" dependem de ele nao existir no PATH reduzido do teste.
const PGBOUNCER_NO_SISTEMA = ['/usr/bin/pgbouncer', '/bin/pgbouncer', path.join(path.dirname(process.execPath), 'pgbouncer')]
  .some((p) => fs.existsSync(p));
const semPgbouncer = { skip: PGBOUNCER_NO_SISTEMA ? 'pgbouncer instalado em /usr/bin' : false };
const SUPABASE_NO_SISTEMA = ['/usr/bin/supabase', '/bin/supabase', path.join(path.dirname(process.execPath), 'supabase')]
  .some((p) => fs.existsSync(p));

caso('gera o arquivo, preserva linhas internas e normaliza as vazias do fim', semPgbouncer, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(amb.saida, 'utf8'), TIPOS);
  assert.match(r.stdout, /types gerado: .*types\.ts \(\d+ bytes\)/);
  assert.equal(amb.ler('supabase.args'), `gen types typescript --db-url ${DESTINO} --schema public\n`);
  assert.match(r.stderr, /Aviso: pgbouncer ausente/);
  assert.deepEqual(fs.readdirSync(amb.tmp), [], 'sem temporario sobrando');
});

caso('em CI sem pgbouncer falha em vez de expor a credencial ao CLI', semPgbouncer, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, CI: 'true' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pgbouncer ausente em CI/);
  assert.equal(amb.chamadas(), 0);
  assert.ok(!fs.existsSync(amb.saida));
  assert.ok(!(r.stdout + r.stderr).includes(SENHA_REAL));
});

caso('falha transitoria: tenta de novo e avisa (2 falhas + 1 sucesso)', semPgbouncer, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_FALHAS: '2' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(amb.chamadas(), 3);
  assert.equal(fs.readFileSync(amb.saida, 'utf8'), TIPOS);
  assert.match(r.stderr, /falhou na tentativa 1\/3; nova tentativa/);
  assert.match(r.stderr, /falhou na tentativa 2\/3; nova tentativa/);
});

caso('falha persistente nao e mascarada: 3 tentativas, exit 1, sem arquivo', semPgbouncer, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_FALHAS: '99' });
  assert.equal(r.status, 1);
  assert.equal(amb.chamadas(), 3);
  assert.match(r.stderr, /falhou em 3 tentativas/);
  assert.ok(!fs.existsSync(amb.saida));
  assert.deepEqual(fs.readdirSync(amb.tmp), []);
});

caso('saida vazia com exit 0 conta como falha', semPgbouncer, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_VAZIO: '1' });
  assert.equal(r.status, 1);
  assert.equal(amb.chamadas(), 3);
  assert.ok(!fs.existsSync(amb.saida));
});

caso('nao sobrescreve um types anterior quando a geracao falha', semPgbouncer, (amb) => {
  fs.writeFileSync(amb.saida, 'conteudo anterior\n');
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_FALHAS: '99' });
  assert.equal(r.status, 1);
  assert.equal(fs.readFileSync(amb.saida, 'utf8'), 'conteudo anterior\n');
});

caso('sem DESTINO_URL sai 1 antes de chamar o CLI', {}, (amb) => {
  const r = amb.rodar([amb.saida]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /DESTINO_URL nao definida/);
  assert.equal(amb.chamadas(), 0);
  assert.deepEqual(fs.readdirSync(amb.tmp), []);
});

caso('sem supabase CLI no PATH sai 1 com orientacao', { skip: SUPABASE_NO_SISTEMA ? 'supabase CLI instalado no sistema' : false }, (amb) => {
  fs.rmSync(path.join(amb.dir, 'bin', 'supabase'));
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /supabase CLI ausente/);
});

caso('--local nao exige DESTINO_URL nem proxy', {}, (amb) => {
  const r = amb.rodar(['--local', amb.saida]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(amb.ler('supabase.args'), 'gen types typescript --local --schema public\n');
  assert.equal(fs.readFileSync(amb.saida, 'utf8'), TIPOS);
});

caso('uso invalido sai 2; --help sai 0 e explica', {}, (amb) => {
  assert.equal(amb.rodar(['--nao-existe']).status, 2);
  assert.equal(amb.rodar(['a.ts', 'b.ts']).status, 2);
  const ajuda = amb.rodar(['--help']);
  assert.equal(ajuda.status, 0);
  assert.match(ajuda.stdout, /gen-types\.sh \[--local\] \[arquivo_de_saida\]/);
  assert.equal(amb.chamadas(), 0);
});

caso('diretorio de saida inexistente sai 1 e nao deixa temporario', semPgbouncer, (amb) => {
  const r = amb.rodar([path.join(amb.dir, 'nao', 'existe.ts')], { DESTINO_URL: DESTINO });
  assert.equal(r.status, 1);
  assert.deepEqual(fs.readdirSync(amb.tmp), []);
});

caso('nome de saida com espaco e acento', semPgbouncer, (amb) => {
  const saida = path.join(amb.dir, 'meus tipos é.ts');
  const r = amb.rodar([saida], { DESTINO_URL: DESTINO });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(saida, 'utf8'), TIPOS);
});

caso('com pgbouncer: o CLI recebe so a URL descartavel do proxy; nada sobra depois', { comPgbouncer: true }, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, CI: 'true', PGSSLMODE: 'verify-full' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(amb.saida, 'utf8'), TIPOS);

  const args = amb.ler('supabase.args');
  assert.match(args, /^gen types typescript --db-url postgresql:\/\/proxy:proxy@127\.0\.0\.1:\d+\/proxydb\?sslmode=disable --network-id host --schema public\n$/);
  assert.ok(!args.includes(SENHA_REAL));
  assert.ok(!args.includes('db.exemplo.com'));
  assert.ok(!(r.stdout + r.stderr).includes(SENHA_REAL));

  const ini = amb.ler('pgbouncer.ini.visto');
  assert.ok(ini.includes(`host=db.exemplo.com port=5432 dbname=postgres user=postgres.abc password=${SENHA_REAL}\n`));
  assert.match(ini, /^server_tls_sslmode = verify-full$/m);
  assert.equal(new RegExp(`:(\\d+)/proxydb`).exec(args)[1], /^listen_port = (\d+)$/m.exec(ini)[1]);

  assert.deepEqual(fs.readdirSync(amb.tmp), [], 'diretorio do proxy (com a credencial) removido');
  const pid = Number(amb.ler('pgbouncer.pid'));
  assert.ok(pid > 0);
  assert.ok(!vivo(pid), 'pgbouncer encerrado');
});

caso('com pgbouncer: proxy e derrubado e limpo tambem quando a geracao falha', { comPgbouncer: true }, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_FALHAS: '99' });
  assert.equal(r.status, 1);
  assert.equal(amb.chamadas(), 3);
  assert.deepEqual(fs.readdirSync(amb.tmp), []);
  assert.ok(!vivo(Number(amb.ler('pgbouncer.pid'))));
});

caso('com pgbouncer: proxy que ignora TERM e morto com KILL (nunca sobra com a credencial)', { comPgbouncer: true }, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_PGB_IGNORA_TERM: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!vivo(Number(amb.ler('pgbouncer.pid'))), 'pgbouncer encerrado');
  assert.deepEqual(fs.readdirSync(amb.tmp), []);
});

caso('com pgbouncer: DESTINO_URL que tenta baixar o TLS e recusada antes de subir o proxy', { comPgbouncer: true }, (amb) => {
  const r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO + '?sslmode=require' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /tenta reduzir sslmode/);
  assert.equal(amb.chamadas(), 0);
  assert.equal(amb.ler('pgbouncer.pid'), '');
  assert.deepEqual(fs.readdirSync(amb.tmp), []);
});

caso('com pgbouncer: se ele morre na largada, falha rapido e diz por que', { comPgbouncer: true }, (amb) => {
  const inicio = Date.now();
  let r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_PGB_MORRE: 'FATAL @src/main.c:1014 in function main(): PgBouncer should not run as root' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pgbouncer recusa rodar como root/);
  r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_PGB_MORRE: 'FATAL cannot create socket: Address already in use' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /porta local do proxy foi ocupada/);
  r = amb.rodar([amb.saida], { DESTINO_URL: DESTINO, DUBLE_PGB_MORRE: `erro qualquer com user=postgres.abc password=${SENHA_REAL}` });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pgbouncer encerrou antes de aceitar conexoes/);
  assert.ok(!(r.stdout + r.stderr).includes(SENHA_REAL), 'log do pgbouncer nao e ecoado');
  assert.equal(amb.chamadas(), 0);
  assert.deepEqual(fs.readdirSync(amb.tmp), []);
  assert.ok(Date.now() - inicio < 8000, 'nao espera o tempo limite do proxy');
});

caso('com pgbouncer: TERM no meio da geracao derruba o proxy e limpa os temporarios', { comPgbouncer: true }, async (amb) => {
  const filho = spawn('bash', [SCRIPT, amb.saida], { cwd: RAIZ, env: amb.env({ DESTINO_URL: DESTINO, DUBLE_DORME: '1' }), stdio: 'ignore' });
  const fim = new Promise((resolve) => filho.on('exit', (codigo, sinal) => resolve({ codigo, sinal })));
  for (let i = 0; i < 100 && amb.chamadas() === 0; i += 1) await new Promise((r) => setTimeout(r, 50));
  assert.equal(amb.chamadas(), 1, 'CLI chegou a ser chamado');
  const pid = Number(amb.ler('pgbouncer.pid'));
  assert.ok(vivo(pid));
  filho.kill('SIGTERM');
  const { codigo } = await fim;
  assert.equal(codigo, 143);
  assert.ok(!vivo(pid), 'pgbouncer encerrado');
  assert.deepEqual(fs.readdirSync(amb.tmp), []);
  assert.ok(!fs.existsSync(amb.saida));
});
