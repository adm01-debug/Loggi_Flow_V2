// Teste do runbook scripts/ops/pos_deploy_functions.sql: cada afirmação conferida contra o repo
// (functions, forma de auth, config.toml, workflow de deploy, nomes de secret) e os comandos de
// terminal executados de ponta a ponta com psql/supabase falsos e um servidor HTTP local.
// Rodar: node --test scripts/ops/pos-deploy-functions.unit.mjs

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ler = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');
const RUNBOOK = ler('scripts', 'ops', 'pos_deploy_functions.sql');
const LINHAS = RUNBOOK.split('\n');
const PROJ = /project_id = "(\w+)"/.exec(ler('supabase', 'config.toml'))[1];

const POR_SEGREDO = ['resend-email', 'predict-delays-scheduled'];
const POR_USUARIO = ['evolution-whatsapp', 'melhor-envio-api', 'log-security-event'];

describe('pos_deploy_functions.sql confere com o repositório', () => {
  test('é só comentário: colar no SQL editor não executa nada', () => {
    assert.deepEqual(LINHAS.filter((l) => l.trim() !== '' && !l.startsWith('--')), []);
  });

  test('usa o project ref de supabase/config.toml e nenhum outro', () => {
    const refs = new Set([...RUNBOOK.matchAll(/\b[a-z]{20}\b/g)].map((m) => m[0]));
    assert.deepEqual([...refs], [PROJ]);
  });

  test('toda function citada existe e está com verify_jwt = false', () => {
    const citadas = new Set([...POR_SEGREDO, ...POR_USUARIO, ...[...RUNBOOK.matchAll(/functions\/v1\/([a-z0-9-]+)/g)].map((m) => m[1])]);
    const toml = ler('supabase', 'config.toml');
    for (const fn of citadas) {
      if (fn === '$fn') continue;
      assert.ok(fs.existsSync(path.join(RAIZ, 'supabase', 'functions', fn, 'index.ts')), `function ${fn} não existe`);
      assert.match(toml, new RegExp(`\\[functions\\.${fn}\\]\\s*\\nverify_jwt = false`), `${fn} sem verify_jwt = false`);
    }
    for (const fn of [...POR_SEGREDO, ...POR_USUARIO]) assert.ok(RUNBOOK.includes(fn), `runbook não cita ${fn}`);
  });

  test('a auth descrita é a do código: segredo interno x usuário', () => {
    for (const fn of POR_SEGREDO) {
      const src = ler('supabase', 'functions', fn, 'index.ts');
      assert.match(src, /requireInternalSecret\(req\)/, `${fn} não usa x-internal-secret`);
      assert.match(src, /claims\.role !== "service_role"/, `${fn} deixou de exigir service_role no Bearer`);
    }
    for (const fn of POR_USUARIO) {
      const src = ler('supabase', 'functions', fn, 'index.ts');
      assert.match(src, /require(User|Role)\(req/, `${fn} não autentica usuário (requireUser/requireRole)`);
      assert.ok(!/requireInternalSecret/.test(src), `${fn} passou a aceitar x-internal-secret: atualize o runbook`);
    }
    const auth = ler('supabase', 'functions', '_shared', 'auth.ts');
    assert.match(auth, /Deno\.env\.get\("INTERNAL_FN_SECRET"\)/);
    assert.match(auth, /req\.headers\.get\("x-internal-secret"\)/);
  });

  test('predict-delays-scheduled autenticada executa a previsão (por isso o runbook proíbe o teste nela)', () => {
    assert.match(ler('supabase', 'functions', 'predict-delays-scheduled', 'index.ts'), /(?:functions\.invoke|invokeFunction)\(\s*"predict-delays"/);
    assert.match(RUNBOOK, /Não repita esse teste em predict-delays-scheduled/);
  });

  test('deploy só pelo workflow: nenhuma instrução de `supabase functions deploy` na mão', () => {
    for (const l of LINHAS.filter((x) => x.includes('supabase functions deploy'))) assert.match(l, /nunca `supabase functions deploy`/);
    const wf = ler('.github', 'workflows', 'deploy-functions.yml');
    assert.match(wf, /^name: Deploy Edge Functions$/m);
    assert.match(wf, /workflow_dispatch:\s*\n\s*inputs:\s*\n\s*only:/);
    assert.match(RUNBOOK, /gh workflow run deploy-functions\.yml/);
    assert.match(RUNBOOK, /-f only=resend-email/);
  });

  test('nenhum passo põe o valor do segredo na tela', () => {
    const comSegredo = LINHAS.map((l, i) => ({ l, i })).filter(({ l }) => l.includes('decrypted_secret'));
    assert.ok(comSegredo.length >= 3);
    for (const { l, i } of comSegredo) {
      const soTamanho = /length\(decrypted_secret\)/.test(l) || /FROM vault\.decrypted_secrets\s*$/.test(l);
      const aviso = /NÃO rode/.test(LINHAS[i - 1] + l);
      const vaiParaArquivo = /> ~\/loggi-internal\.env/.test(l + LINHAS[i + 1]);
      assert.ok(soTamanho || aviso || vaiParaArquivo, `linha ${i + 1} mostraria o segredo: ${l}`);
    }
    assert.ok(!/echo\s+"?\$\{?INTERNAL_FN_SECRET/.test(RUNBOOK));
    assert.ok(!/export INTERNAL_FN_SECRET=/.test(RUNBOOK)); // iria para o histórico do shell
  });

  test('nomes de secret existem: INTERNAL_FN_SECRET no catálogo, chaves do vault na migration dos crons', () => {
    const catalogo = spawnSync('sh', [path.join(RAIZ, 'scripts', 'ops', 'set_missing_secrets.sh'), '--list'], { encoding: 'utf8' }).stdout.split('\n');
    assert.ok(catalogo.includes('INTERNAL_FN_SECRET'));
    const mig = ler('supabase', 'migrations', '20260902120000_hardening_pos_auditoria.sql');
    for (const nome of ['internal_fn_secret', 'project_url', 'anon_key']) {
      assert.ok(mig.includes(`name='${nome}'`), `vault '${nome}' não é usado pelos crons`);
      assert.ok(RUNBOOK.includes(`'${nome}'`));
    }
  });
});

describe('comandos de terminal do runbook, executados', () => {
  const PASSO_2 = [
    'umask 077',
    'psql "$DATABASE_URL" -Atc "SELECT \'INTERNAL_FN_SECRET=\' || decrypted_secret',
    '  FROM vault.decrypted_secrets WHERE name = \'internal_fn_secret\'" > ~/loggi-internal.env',
    'sh scripts/ops/set_missing_secrets.sh --env-file ~/loggi-internal.env           # deve listar só "+ INTERNAL_FN_SECRET"',
    'sh scripts/ops/set_missing_secrets.sh --env-file ~/loggi-internal.env --apply',
  ];
  const PASSO_4 = [
    'sed \'s/^INTERNAL_FN_SECRET=/x-internal-secret: /\' ~/loggi-internal.env > ~/loggi-internal.hdr',
    'curl -s -o /dev/null -w \'%{http_code}\\n\' -X POST -H @"$HOME/loggi-internal.hdr" \\',
    `  https://${PROJ}.supabase.co/functions/v1/resend-email`,
  ];
  const LIMPEZA = ['rm -f ~/loggi-internal.env ~/loggi-internal.hdr'];

  test('os comandos testados aqui são, letra por letra, os do runbook', () => {
    for (const cmd of [...PASSO_2, ...PASSO_4, ...LIMPEZA]) {
      assert.ok(LINHAS.some((l) => l.replace(/^--/, '').trim() === cmd.trim()), `runbook mudou; atualize o teste: ${cmd}`);
    }
  });

  test('vault -> arquivo -> CLI -> header: o segredo chega igual nas duas pontas e não aparece na saída', { skip: spawnSync('sh', ['-c', 'command -v curl']).status !== 0 && 'curl ausente' }, async () => {
    const SEGREDO = 'S3gr3do/do+vault=com$simbolos&"aspas"';
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'runbook-unit-'));
    const recebidos = [];
    const srv = http.createServer((req, res) => { recebidos.push({ url: req.url, metodo: req.method, segredo: req.headers['x-internal-secret'] }); res.writeHead(500).end(); });
    await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
    try {
      const bin = path.join(tmp, 'bin');
      fs.mkdirSync(bin);
      const stub = (nome, corpo) => fs.writeFileSync(path.join(bin, nome), `#!/bin/sh\n${corpo}\n`, { mode: 0o755 });
      stub('psql', `printf '%s\\n' "$3" > "${tmp}/psql.sql"; cat "${tmp}/vault.txt"`);
      stub('supabase', `for a in "$@"; do printf '%s\\0' "$a"; done >> "${tmp}/cli.argv"`);
      // troca só o host: o `-H @arquivo` é interpretado pelo curl de verdade
      stub('curl', `n=$#; i=0; for a in "$@"; do i=$((i+1)); case "$a" in https://${PROJ}.supabase.co/*) a="http://127.0.0.1:${srv.address().port}/\${a#https://*/}";; esac; set -- "$@" "$a"; done; shift "$n"; exec /usr/bin/curl "$@"`);
      fs.writeFileSync(path.join(tmp, 'vault.txt'), `INTERNAL_FN_SECRET=${SEGREDO}\n`);
      const rodar = (linhas) => new Promise((ok) => {
        const f = spawn('sh', ['-eu', '-c', linhas.join('\n')], { cwd: RAIZ, env: { PATH: `${bin}:/usr/bin:/bin`, HOME: tmp, DATABASE_URL: 'postgres://falso', SUPABASE_ACCESS_TOKEN: 'sbp_falso' } });
        let saida = '';
        f.stdout.on('data', (d) => { saida += d; });
        f.stderr.on('data', (d) => { saida += d; });
        f.on('close', (status) => ok({ status, saida }));
      });

      const p2 = await rodar(PASSO_2);
      assert.equal(p2.status, 0, p2.saida);
      assert.ok(!p2.saida.includes(SEGREDO));
      assert.match(p2.saida, /Com valor \(1\):\n {2}\+ INTERNAL_FN_SECRET/);
      assert.equal(fs.statSync(path.join(tmp, 'loggi-internal.env')).mode & 0o077, 0, 'arquivo do segredo legível por outros');
      assert.match(fs.readFileSync(path.join(tmp, 'psql.sql'), 'utf8'), /FROM vault\.decrypted_secrets WHERE name = 'internal_fn_secret'/);
      const argv = fs.readFileSync(path.join(tmp, 'cli.argv'), 'utf8').split('\0').slice(0, -1);
      assert.deepEqual(argv, ['secrets', 'set', '--yes', `INTERNAL_FN_SECRET=${SEGREDO}`, '--project-ref', PROJ]);

      const p4 = await rodar(PASSO_4);
      assert.equal(p4.status, 0, p4.saida);
      assert.equal(p4.saida.trim(), '500');
      assert.deepEqual(recebidos, [{ url: '/functions/v1/resend-email', metodo: 'POST', segredo: SEGREDO }]);

      assert.equal((await rodar(LIMPEZA)).status, 0);
      assert.deepEqual(fs.readdirSync(tmp).filter((f) => f.startsWith('loggi-internal')), []);
    } finally {
      await new Promise((ok) => srv.close(ok));
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('vault sem o segredo: nada é enviado e o --apply falha', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'runbook-unit-'));
    try {
      const bin = path.join(tmp, 'bin');
      fs.mkdirSync(bin);
      fs.writeFileSync(path.join(bin, 'psql'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
      fs.writeFileSync(path.join(bin, 'supabase'), `#!/bin/sh\n: > "${tmp}/cli-chamada"\n`, { mode: 0o755 });
      const r = spawnSync('sh', ['-eu', '-c', PASSO_2.join('\n')], { cwd: RAIZ, encoding: 'utf8', env: { PATH: `${bin}:/usr/bin:/bin`, HOME: tmp, DATABASE_URL: 'x', SUPABASE_ACCESS_TOKEN: 'sbp_falso' } });
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.match(r.stderr, /nenhum secret/);
      assert.ok(!fs.existsSync(path.join(tmp, 'cli-chamada')));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
