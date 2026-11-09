// Testes de scripts/graphify/setup.sh (`npm run graph:setup`).
// Roda o script de verdade num clone git sintético, com `uv`, `pipx`, `graphify` e `husky` trocados
// por stubs que só registram a chamada — nada é instalado, nada vai à rede e o graphify-out/ real
// não é tocado. O PATH do teste só tem os stubs e o mínimo (bash, git, coreutils usados).
// Rodar: node --test scripts/graphify/setup.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SETUP = path.join(AQUI, 'setup.sh');
const VERSAO = /^GRAPHIFY_VERSION="\$\{GRAPHIFY_VERSION:-([0-9.]+)\}"$/m.exec(fs.readFileSync(SETUP, 'utf8'))?.[1];
const abertos = [];
after(() => abertos.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

const onde = (cmd) => execFileSync('/bin/sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8' }).trim();
const exe = (p, corpo) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, `#!/bin/sh\n${corpo}\n`); fs.chmodSync(p, 0o755); };

// "Instalador": registra a chamada e, como o uv/pipx de verdade, deixa um graphify em ~/.local/bin
// na versão pedida.
const instalador = (nome) => `echo "${nome} $*" >> "$LOG"
[ -n "$INSTALL_FAIL" ] && { echo "${nome}: falha simulada de rede" >&2; exit 1; }
for a in "$@"; do pkg="$a"; done
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/graphify" <<FIM
#!/bin/sh
VERSAO_INSTALADA="\${pkg##*==}"
. "$STUBS_DIR/graphify.lib"
FIM
chmod +x "$HOME/.local/bin/graphify"`;
const GRAPHIFY_LIB = `case "$1" in
  --version) echo "graphify $VERSAO_INSTALADA" ;;
  *) echo "graphify $* @ $(pwd)" >> "$LOG"
     [ "$1" = update ] && [ -n "$UPDATE_FAIL" ] && exit 1
     exit 0 ;;
esac`;

// com: quais ferramentas existem no PATH ('uv', 'pipx'); graphify: versão já instalada (ou null);
// husky: 'configurado' (core.hooksPath pronto), 'instalado' (só o binário) ou 'ausente'.
function cenario({ com = ['uv'], graphify = null, husky = 'configurado', nomeRepo = 'repo' } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'graphify-setup-'));
  abertos.push(base);
  const repo = path.join(base, nomeRepo);
  const bin = path.join(base, 'bin');
  const home = path.join(base, 'home');
  const log = path.join(base, 'chamadas.log');
  fs.mkdirSync(path.join(repo, 'scripts/graphify'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'src'));
  fs.mkdirSync(bin);
  fs.mkdirSync(home);
  fs.writeFileSync(log, '');
  fs.copyFileSync(SETUP, path.join(repo, 'scripts/graphify/setup.sh'));
  for (const cmd of ['bash', 'sh', 'git', 'dirname', 'cat', 'grep', 'mkdir', 'chmod']) fs.symlinkSync(onde(cmd), path.join(bin, cmd));
  for (const nome of com) exe(path.join(bin, nome), instalador(nome));
  fs.writeFileSync(path.join(bin, 'graphify.lib'), GRAPHIFY_LIB);
  if (graphify) exe(path.join(bin, 'graphify'), `VERSAO_INSTALADA="${graphify}"\n. "$STUBS_DIR/graphify.lib"`);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
  git('init', '-q');
  if (husky === 'configurado') git('config', 'core.hooksPath', '.husky/_');
  if (husky !== 'ausente') exe(path.join(repo, 'node_modules/.bin/husky'), 'echo "husky @ $(pwd)" >> "$LOG"\ngit config core.hooksPath .husky/_');
  const roda = ({ cwd = repo, env = {}, script = path.join(repo, 'scripts/graphify/setup.sh') } = {}) => {
    const r = spawnSync(path.join(bin, 'bash'), [script], {
      cwd,
      encoding: 'utf8',
      env: { PATH: bin, HOME: home, LOG: log, STUBS_DIR: bin, GIT_CONFIG_NOSYSTEM: '1', ...env },
    });
    return { status: r.status, saida: `${r.stdout}${r.stderr}`, chamadas: fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) };
  };
  return { base, repo, bin, home, log, git, roda };
}
const PKG = `graphifyy[sql]==${VERSAO}`;
const real = (p) => fs.realpathSync(p);

test('a linha da versão segue no formato que .claude/hooks/session-start.sh lê com sed', () => {
  assert.match(VERSAO ?? '', /^\d+\.\d+\.\d+$/);
});

test('com uv: instala a versão fixada, instala os hooks e gera o grafo na raiz do repo', () => {
  const c = cenario();
  const r = c.roda();
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.chamadas, [`uv tool install --force ${PKG}`, `graphify hook install @ ${real(c.repo)}`, `graphify update . @ ${real(c.repo)}`]);
  assert.match(r.saida, new RegExp(`graphify ${VERSAO.replaceAll('.', '\\.')}`));
});

test('só pipx: usa o pipx', () => {
  const c = cenario({ com: ['pipx'] });
  const r = c.roda();
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.chamadas[0], `pipx install --force ${PKG}`);
  assert.equal(r.chamadas.length, 3);
});

test('uv e pipx: prefere o uv', () => {
  const r = cenario({ com: ['uv', 'pipx'] }).roda();
  assert.equal(r.status, 0, r.saida);
  assert.ok(r.chamadas[0].startsWith('uv tool install'));
  assert.ok(!r.chamadas.some((l) => l.startsWith('pipx')));
});

test('sem uv e sem pipx: para com instrução, sem tocar em hook nem grafo', () => {
  const r = cenario({ com: [] }).roda();
  assert.equal(r.status, 1, r.saida);
  assert.match(r.saida, /instale o uv/);
  assert.match(r.saida, /pipx/);
  assert.deepEqual(r.chamadas, []);
});

test('GRAPHIFY_VERSION no ambiente troca a versão instalada', () => {
  const r = cenario().roda({ env: { GRAPHIFY_VERSION: '9.9.9' } });
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.chamadas[0], 'uv tool install --force graphifyy[sql]==9.9.9');
  assert.match(r.saida, /graphify 9\.9\.9/);
});

test('graphify já na versão fixada: não reinstala (roda sem rede)', () => {
  const c = cenario({ graphify: VERSAO });
  const r = c.roda({ env: { INSTALL_FAIL: '1' } });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.chamadas, [`graphify hook install @ ${real(c.repo)}`, `graphify update . @ ${real(c.repo)}`]);
});

test('graphify já na versão fixada e sem uv/pipx: segue em frente', () => {
  const r = cenario({ com: [], graphify: VERSAO }).roda();
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.chamadas.length, 2);
});

test('graphify em outra versão: reinstala a fixada', () => {
  const r = cenario({ graphify: '0.0.1' }).roda();
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.chamadas[0], `uv tool install --force ${PKG}`);
});

test('falha de instalação: sai com erro e não instala hook nem gera grafo', () => {
  const r = cenario().roda({ env: { INSTALL_FAIL: '1' } });
  assert.notEqual(r.status, 0, r.saida);
  assert.match(r.saida, /falha simulada de rede/);
  assert.deepEqual(r.chamadas, [`uv tool install --force ${PKG}`]);
});

test('~/.local/bin fora do PATH: avisa e ainda assim acha o graphify recém-instalado', () => {
  const r = cenario().roda();
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /\.local\/bin fora do PATH/);
});

test('husky instalado mas core.hooksPath ainda não aponta para .husky/_: roda o husky antes', () => {
  const c = cenario({ husky: 'instalado' });
  const r = c.roda();
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.chamadas.slice(1), [`husky @ ${real(c.repo)}`, `graphify hook install @ ${real(c.repo)}`, `graphify update . @ ${real(c.repo)}`]);
  assert.equal(c.git('config', 'core.hooksPath').trim(), '.husky/_');
});

test('sem husky (npm ci não rodou): para com instrução, sem instalar hook', () => {
  const r = cenario({ husky: 'ausente' }).roda();
  assert.equal(r.status, 1, r.saida);
  assert.match(r.saida, /rode npm ci antes/);
  assert.ok(!r.chamadas.some((l) => l.startsWith('graphify hook') || l.startsWith('graphify update')));
});

test('falha do graphify update propaga o erro', () => {
  const r = cenario().roda({ env: { UPDATE_FAIL: '1' } });
  assert.notEqual(r.status, 0, r.saida);
});

test('execução repetida: a segunda não reinstala e repete hook + grafo', () => {
  const c = cenario();
  assert.equal(c.roda().status, 0);
  const r = c.roda({ env: { PATH: `${c.bin}:${path.join(c.home, '.local/bin')}` } });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.chamadas.slice(3), [`graphify hook install @ ${real(c.repo)}`, `graphify update . @ ${real(c.repo)}`]);
});

test('cwd numa subpasta do repo: trabalha na raiz', () => {
  const c = cenario({ graphify: VERSAO });
  const r = c.roda({ cwd: path.join(c.repo, 'src') });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.chamadas, [`graphify hook install @ ${real(c.repo)}`, `graphify update . @ ${real(c.repo)}`]);
});

test('cwd fora de qualquer repo: trabalha no repo do script, não na pasta corrente', () => {
  const c = cenario({ graphify: VERSAO });
  const r = c.roda({ cwd: c.home });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.chamadas, [`graphify hook install @ ${real(c.repo)}`, `graphify update . @ ${real(c.repo)}`]);
});

test('cwd dentro de OUTRO repo git: não instala hook nem gera grafo lá', () => {
  const c = cenario({ graphify: VERSAO });
  const outro = path.join(c.base, 'outro');
  fs.mkdirSync(outro);
  execFileSync('git', ['-C', outro, 'init', '-q']);
  execFileSync('git', ['-C', outro, 'config', 'core.hooksPath', '.husky/_']);
  const r = c.roda({ cwd: outro });
  assert.equal(r.status, 0, r.saida);
  assert.deepEqual(r.chamadas, [`graphify hook install @ ${real(c.repo)}`, `graphify update . @ ${real(c.repo)}`]);
});

test('caminho relativo para o script também resolve a raiz', () => {
  const c = cenario({ graphify: VERSAO });
  const r = c.roda({ cwd: path.join(c.repo, 'scripts'), script: 'graphify/setup.sh' });
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.chamadas[1], `graphify update . @ ${real(c.repo)}`);
});

test('repo em caminho com espaço e acento', () => {
  const c = cenario({ nomeRepo: 'meu repositório' });
  const r = c.roda();
  assert.equal(r.status, 0, r.saida);
  assert.equal(r.chamadas[2], `graphify update . @ ${real(c.repo)}`);
});

test('script fora de um clone git: erro claro, nada é instalado', () => {
  const c = cenario();
  const solto = path.join(c.base, 'solto/scripts/graphify');
  fs.mkdirSync(solto, { recursive: true });
  fs.copyFileSync(SETUP, path.join(solto, 'setup.sh'));
  const r = c.roda({ cwd: c.home, script: path.join(solto, 'setup.sh'), env: { GIT_CEILING_DIRECTORIES: c.base } });
  assert.notEqual(r.status, 0, r.saida);
  assert.match(r.saida, /clone git/);
  assert.deepEqual(r.chamadas, []);
});

test('bash -n: sem erro de sintaxe', () => {
  assert.equal(spawnSync('bash', ['-n', SETUP]).status, 0);
});
