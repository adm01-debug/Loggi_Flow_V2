// Teste dos instaladores do runner (scripts/ci/install-postgresql-client.sh e install-pgbouncer.sh).
// Nada e instalado: cada caso roda o script com um PATH que so tem stubs de `sudo`, `apt-get` e do
// binario alvo, e com `/etc/apt` trocado por uma pasta temporaria numa COPIA do script (as duas
// unicas ocorrencias do caminho; o teste falha se esse numero mudar). Offline, sem root.
// Rodar: node --test scripts/ci/install-scripts.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BASH = ['/bin/bash', '/usr/bin/bash'].find((p) => fs.existsSync(p));
const INSTALADORES = [
  { script: 'install-postgresql-client.sh', binario: 'psql', pacote: 'postgresql-client', versao: 'psql (PostgreSQL) 16.15' },
  { script: 'install-pgbouncer.sh', binario: 'pgbouncer', pacote: 'pgbouncer', versao: 'PgBouncer 1.22.0' },
];

const temporarios = [];
after(() => {
  for (const dir of temporarios) fs.rmSync(dir, { recursive: true, force: true });
});

const executavel = (arquivo, corpo) => {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, `#!${BASH}\n${corpo}\n`, { mode: 0o755 });
};

/**
 * Monta o ambiente falso. `fonte`: 'deb822' (ubuntu.sources), 'classica' (sources.list), 'ambas' ou 'nenhuma'.
 * `instalado`: o binario ja esta no PATH ('ok'), esta mas quebra ao rodar ('quebrado') ou nao esta (false).
 */
function ambiente({ script, binario, versao }, { fonte = 'deb822', instalado = false, comSudo = true } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'instalador-'));
  temporarios.push(raiz);
  const bin = path.join(raiz, 'bin');
  const pool = path.join(raiz, 'pool');
  const etc = path.join(raiz, 'etc/apt');
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(path.join(etc, 'sources.list.d'), { recursive: true });
  if (fonte === 'deb822' || fonte === 'ambas') fs.writeFileSync(path.join(etc, 'sources.list.d/ubuntu.sources'), 'Types: deb\n');
  if (fonte === 'classica' || fonte === 'ambas') fs.writeFileSync(path.join(etc, 'sources.list'), 'deb http://archive.ubuntu.com/ubuntu noble main\n');

  const original = fs.readFileSync(fileURLToPath(new URL(`./${script}`, import.meta.url)), 'utf8');
  assert.equal(original.split('/etc/apt/').length - 1, 2, 'o script deve citar /etc/apt/ exatamente 2 vezes');
  const copia = path.join(raiz, script);
  fs.writeFileSync(copia, original.replaceAll('/etc/apt/', `${etc}/`));

  executavel(path.join(pool, binario), `echo '${versao}'`);
  if (instalado === 'ok') executavel(path.join(bin, binario), `echo '${versao}'`);
  if (instalado === 'quebrado') executavel(path.join(bin, binario), `echo 'Error: You must install at least one postgresql-client-<version> package' >&2\nexit 2`);
  if (comSudo) executavel(path.join(bin, 'sudo'), `echo "sudo $*" >> "$FAKE_LOG"\nexec "$@"`);
  executavel(
    path.join(bin, 'apt-get'),
    `PATH=/usr/bin:/bin
echo "apt-get $*" >> "$FAKE_LOG"
case " $* " in
  *" update "*) exit "\${APT_UPDATE_EXIT:-0}" ;;
  *" install "*)
    [ "\${APT_INSTALL_EXIT:-0}" = 0 ] || { echo "E: Unable to locate package" >&2; exit "$APT_INSTALL_EXIT"; }
    [ -n "\${APT_INSTALL_SEM_BINARIO:-}" ] || cp "$FAKE_POOL/${binario}" "$FAKE_BIN/${binario}"
    exit 0 ;;
esac
exit 64`,
  );

  const log = path.join(raiz, 'chamadas.log');
  const rodar = (env = {}) => {
    const r = spawnSync(BASH, [copia], {
      cwd: raiz,
      env: { PATH: bin, FAKE_LOG: log, FAKE_BIN: bin, FAKE_POOL: pool, ...env },
      encoding: 'utf8',
    });
    const chamadas = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : [];
    return { status: r.status, out: r.stdout, err: r.stderr, chamadas };
  };
  return { rodar, bin };
}

const OPCOES = (fonte) =>
  `-o Dir::Etc::sourcelist=${fonte} -o Dir::Etc::sourceparts=- -o APT::Get::List-Cleanup=0 -o Acquire::Retries=3`;

test('bash disponivel para os testes', () => assert.ok(BASH));

for (const alvo of INSTALADORES) {
  const { script, binario, pacote, versao } = alvo;
  const fonteReal = fileURLToPath(new URL(`./${script}`, import.meta.url));

  test(`${script}: sintaxe valida e modo estrito ligado`, () => {
    assert.equal(spawnSync(BASH, ['-n', fonteReal]).status, 0);
    const texto = fs.readFileSync(fonteReal, 'utf8');
    assert.match(texto, /^set -Eeuo pipefail$/m);
    assert.ok(texto.startsWith('#!/usr/bin/env bash\n'));
    assert.doesNotMatch(texto, /\r/, 'CRLF quebraria o shebang no runner');
  });

  test(`${script}: ${binario} ja instalado — mostra a versao e nao chama apt nem sudo`, () => {
    const r = ambiente(alvo, { instalado: 'ok' }).rodar();
    assert.equal(r.status, 0, r.err);
    assert.equal(r.out.trim(), versao);
    assert.deepEqual(r.chamadas, []);
  });

  test(`${script}: ausente — update e install so com a fonte oficial (deb822) e mostra a versao`, () => {
    const r = ambiente(alvo).rodar();
    assert.equal(r.status, 0, r.err);
    assert.deepEqual(r.chamadas, [
      `sudo apt-get ${OPCOES('sources.list.d/ubuntu.sources')} update -qq`,
      `apt-get ${OPCOES('sources.list.d/ubuntu.sources')} update -qq`,
      `sudo apt-get ${OPCOES('sources.list.d/ubuntu.sources')} install -y -qq --no-install-recommends ${pacote}`,
      `apt-get ${OPCOES('sources.list.d/ubuntu.sources')} install -y -qq --no-install-recommends ${pacote}`,
    ]);
    assert.equal(r.out.trim(), versao);
  });

  test(`${script}: so com sources.list classico usa esse arquivo`, () => {
    const r = ambiente(alvo, { fonte: 'classica' }).rodar();
    assert.equal(r.status, 0, r.err);
    assert.ok(r.chamadas[0].includes('Dir::Etc::sourcelist=sources.list '), r.chamadas[0]);
  });

  test(`${script}: com as duas fontes prefere ubuntu.sources`, () => {
    const r = ambiente(alvo, { fonte: 'ambas' }).rodar();
    assert.ok(r.chamadas[0].includes('sourcelist=sources.list.d/ubuntu.sources'), r.chamadas[0]);
  });

  test(`${script}: sem fonte oficial do Ubuntu falha com mensagem e nao chama apt`, () => {
    const r = ambiente(alvo, { fonte: 'nenhuma' }).rodar();
    assert.equal(r.status, 1);
    assert.match(r.err, /ERRO: fonte oficial do Ubuntu nao encontrada\./);
    assert.deepEqual(r.chamadas, []);
  });

  test(`${script}: falha de rede no apt-get update aborta antes do install`, () => {
    const r = ambiente(alvo).rodar({ APT_UPDATE_EXIT: '100' });
    assert.equal(r.status, 100);
    assert.equal(r.chamadas.filter((c) => c.includes(' install ')).length, 0);
  });

  test(`${script}: pacote indisponivel (install sai 100) propaga o erro`, () => {
    const r = ambiente(alvo).rodar({ APT_INSTALL_EXIT: '100' });
    assert.equal(r.status, 100);
    assert.match(r.err, /Unable to locate package/);
    assert.equal(r.out, '');
  });

  test(`${script}: install "ok" mas o binario nao aparece — falha dizendo isso`, () => {
    const r = ambiente(alvo).rodar({ APT_INSTALL_SEM_BINARIO: '1' });
    assert.equal(r.status, 1);
    assert.match(r.err, new RegExp(`ERRO: ${binario} continuou ausente apos a instalacao\\.`));
  });

  test(`${script}: sem sudo no PATH falha (127) em vez de seguir sem instalar`, () => {
    const r = ambiente(alvo, { comSudo: false }).rodar();
    assert.equal(r.status, 127);
    assert.equal(r.out, '');
  });

  test(`${script}: ${binario} no PATH mas quebrado — instala em vez de abortar`, () => {
    const r = ambiente(alvo, { instalado: 'quebrado' }).rodar();
    assert.equal(r.status, 0, `${r.err}\n${r.chamadas.join('\n')}`);
    assert.equal(r.chamadas.filter((c) => c.startsWith('sudo apt-get')).length, 2);
    assert.equal(r.out.trim(), versao);
  });

  test(`${script}: ${binario} continua quebrado depois do install — falha`, () => {
    const r = ambiente(alvo, { instalado: 'quebrado' }).rodar({ APT_INSTALL_SEM_BINARIO: '1' });
    assert.notEqual(r.status, 0);
  });

  test(`${script}: segunda execucao e no-op (idempotente)`, () => {
    const amb = ambiente(alvo);
    const primeira = amb.rodar();
    const segunda = amb.rodar();
    assert.equal(primeira.status, 0, primeira.err);
    assert.equal(segunda.status, 0);
    assert.equal(segunda.chamadas.length, primeira.chamadas.length, 'a segunda execucao nao pode chamar apt de novo');
    assert.equal(segunda.out.trim(), versao);
  });
}
