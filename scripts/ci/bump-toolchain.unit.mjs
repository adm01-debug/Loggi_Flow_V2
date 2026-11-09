// Teste da verificação de versões da toolchain (scripts/ci/bump-toolchain.mjs).
// O script roda efeitos no topo do módulo e lê `../../.github/toolchain.json` relativo a si
// mesmo, então cada caso copia o script para uma árvore temporária com um toolchain.json de
// fixture e o executa como subprocesso com `fetch` trocado por `--import` (nada vai à rede).
// Rodar: node --test scripts/ci/bump-toolchain.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const temporarios = [];
after(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });

const FETCH_FALSO = `import fs from 'node:fs';
const regras = JSON.parse(fs.readFileSync(process.env.MOCK_FETCH, 'utf8'));
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  fs.appendFileSync(process.env.MOCK_LOG, JSON.stringify({ host: u.host, caminho: u.pathname, metodo: init.method ?? 'GET', auth: init.headers?.Authorization ?? null, temTimeout: Boolean(init.signal) }) + '\\n');
  const r = regras[u.pathname] ?? regras['*'];
  if (!r) return new Response('{"message":"Not Found"}', { status: 404 });
  if (r.rede) throw new TypeError('fetch failed');
  return new Response(typeof r.corpo === 'string' ? r.corpo : JSON.stringify(r.corpo), { status: r.status ?? 200 });
};
`;

const PINADAS = { bun: '1.4.0', deno: '2.9.5', 'supabase-cli': '2.116.0', playwright: '1.64.1', 'actionlint-version': '1.7.7' };
const REPOS = { bun: 'oven-sh/bun', deno: 'denoland/deno', 'supabase-cli': 'supabase/cli', playwright: 'microsoft/playwright', 'actionlint-version': 'rhysd/actionlint' };
const caminho = (chave) => `/repos/${REPOS[chave]}/releases/latest`;
const tags = (porChave) => Object.fromEntries(Object.entries(porChave).map(([chave, tag]) => [caminho(chave), { corpo: { tag_name: tag } }]));
const EM_DIA = tags({ bun: 'bun-v1.4.0', deno: 'v2.9.5', 'supabase-cli': 'v2.116.0', playwright: 'v1.64.1', 'actionlint-version': 'v1.7.7' });

function fixture(toolchain = PINADAS, prefixo = 'bump-toolchain-') {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
  temporarios.push(raiz);
  fs.mkdirSync(path.join(raiz, 'scripts', 'ci'), { recursive: true });
  fs.mkdirSync(path.join(raiz, '.github'));
  fs.mkdirSync(path.join(raiz, 'apoio'));
  fs.copyFileSync(path.join(AQUI, 'bump-toolchain.mjs'), path.join(raiz, 'scripts', 'ci', 'bump-toolchain.mjs'));
  if (toolchain !== null) fs.writeFileSync(path.join(raiz, '.github', 'toolchain.json'), typeof toolchain === 'string' ? toolchain : JSON.stringify(toolchain, null, 2));
  fs.writeFileSync(path.join(raiz, 'apoio', 'fetch-falso.mjs'), FETCH_FALSO);
  return raiz;
}

function rodar(raiz, regras, { env = {}, cwd } = {}) {
  const apoio = path.join(raiz, 'apoio');
  const log = path.join(apoio, 'chamadas.log');
  const resumo = path.join(apoio, 'summary.md');
  fs.rmSync(log, { force: true });
  fs.rmSync(resumo, { force: true });
  fs.writeFileSync(path.join(apoio, 'regras.json'), JSON.stringify(regras));
  const r = spawnSync(process.execPath, ['--import', pathToFileURL(path.join(apoio, 'fetch-falso.mjs')).href, path.join(raiz, 'scripts', 'ci', 'bump-toolchain.mjs')], {
    encoding: 'utf8',
    cwd: cwd ?? raiz,
    env: { PATH: '', MOCK_FETCH: path.join(apoio, 'regras.json'), MOCK_LOG: log, GITHUB_STEP_SUMMARY: resumo, ...env },
  });
  const chamadas = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, chamadas, resumo: fs.existsSync(resumo) ? fs.readFileSync(resumo, 'utf8') : '' };
}

test('tudo em dia: relatório verde citando o que foi verificado, exit 0', () => {
  const r = rodar(fixture(), EM_DIA);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^## 🔧 Toolchain — verificação de versões \(W40\)\n\nVerificado em: \d{4}-\d{2}-\d{2}\n\n/);
  assert.match(r.stdout, /✅ Nenhuma atualização entre as 5 ferramentas verificadas \(bun, deno, supabase-cli, playwright, actionlint-version\)\.\n$/);
  assert.equal(r.stderr, '');
});

test('só lê: 5 GETs em api.github.com/repos/<repo>/releases/latest, com timeout', () => {
  const r = rodar(fixture(), EM_DIA);
  assert.deepEqual(r.chamadas.map((c) => c.caminho).sort(), Object.keys(REPOS).map(caminho).sort());
  for (const c of r.chamadas) {
    assert.equal(c.host, 'api.github.com');
    assert.equal(c.metodo, 'GET');
    assert.equal(c.temTimeout, true);
  }
});

test('não altera o toolchain.json nem cria arquivo na árvore', () => {
  const raiz = fixture();
  const arquivo = path.join(raiz, '.github', 'toolchain.json');
  const antes = fs.readFileSync(arquivo, 'utf8');
  const listar = () => fs.readdirSync(raiz, { recursive: true }).filter((f) => !String(f).startsWith('apoio')).sort();
  const arvoreAntes = listar();
  rodar(raiz, tags({ bun: 'bun-v9.0.0', deno: 'v9.0.0', 'supabase-cli': 'v9.0.0', playwright: 'v9.0.0', 'actionlint-version': 'v9.0.0' }));
  assert.equal(fs.readFileSync(arquivo, 'utf8'), antes);
  assert.deepEqual(listar(), arvoreAntes);
});

test('atualização disponível vira linha da tabela, com changelog, e continua exit 0', () => {
  const r = rodar(fixture(), { ...EM_DIA, ...tags({ 'supabase-cli': 'v2.117.0', playwright: 'v1.65.0' }) });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /### ⬆️ Atualizações disponíveis\n\n\| Ferramenta \| Pinada \| Disponível \| Changelog \|\n\|---\|---\|---\|---\|\n/);
  assert.match(r.stdout, /\| `supabase-cli` \| `2\.116\.0` \| `2\.117\.0` \| \[ver\]\(https:\/\/github\.com\/supabase\/cli\/releases\) \|/);
  assert.match(r.stdout, /\| `playwright` \| `1\.64\.1` \| `1\.65\.0` \|/);
  assert.match(r.stdout, /\n2 atualização\(ões\) disponível\(eis\) — veja a tabela acima\.\n$/);
  assert.ok(!r.stdout.includes('✅'));
});

test('tag do bun (`bun-v1.5.0`) é reconhecida como versão mais nova', () => {
  const r = rodar(fixture(), { ...EM_DIA, ...tags({ bun: 'bun-v1.5.0' }) });
  assert.match(r.stdout, /\| `bun` \| `1\.4\.0` \| `1\.5\.0` \| \[ver\]\(https:\/\/github\.com\/oven-sh\/bun\/releases\) \|/);
});

test('comparação é numérica por segmento, não alfabética', () => {
  const casos = [
    ['1.4.0', 'v1.10.0', true], ['1.9.9', 'v1.10.0', true], ['2.0.0', 'v10.0.0', true], ['1.4.0', 'v1.4.1', true], ['1.4', 'v1.4.1', true],
    ['1.4.0', 'v1.4.0', false], ['1.4.0', '1.4.0', false], ['v1.4.0', 'v1.4.0', false], ['1.10.0', 'v1.9.0', false], ['2.0.0', 'v1.99.99', false], ['1.4.0', 'v1.4', false],
  ];
  for (const [pinada, tag, atualiza] of casos) {
    const r = rodar(fixture({ deno: pinada }), tags({ deno: tag }));
    assert.equal(r.stdout.includes('| `deno` |'), atualiza, `${pinada} x ${tag}`);
    assert.equal(r.status, 0);
  }
});

test('consulta que falha (403 rate limit, 404, 500, rede, corpo inválido, sem tag_name) vai para "não foi possível verificar"', () => {
  const falhas = [{ status: 403, corpo: { message: 'API rate limit exceeded' } }, { status: 404, corpo: { message: 'Not Found' } }, { status: 500, corpo: '' }, { status: 429, corpo: {} }, { rede: true }, { corpo: '<html>' }, { corpo: {} }, { corpo: { tag_name: null } }];
  for (const falha of falhas) {
    const r = rodar(fixture(), { ...EM_DIA, [caminho('playwright')]: falha });
    assert.equal(r.status, 0, JSON.stringify(falha));
    assert.match(r.stdout, /✅ Nenhuma atualização entre as 4 ferramentas verificadas \(bun, deno, supabase-cli, actionlint-version\)\./);
    assert.match(r.stdout, /### ⚠️ Não foi possível verificar\n- playwright: não foi possível consultar microsoft\/playwright\n$/);
  }
});

test('todas as consultas falhando: sem ✅, exit 0', () => {
  for (const regra of [{ status: 403, corpo: { message: 'API rate limit exceeded' } }, { status: 401, corpo: { message: 'Bad credentials' } }, { rede: true }]) {
    const r = rodar(fixture(), { '*': regra });
    assert.equal(r.status, 0);
    assert.ok(!r.stdout.includes('✅'), r.stdout);
    assert.match(r.stdout, /Nenhuma ferramenta pôde ser verificada nesta execução\./);
    assert.equal(r.stdout.split('\n').filter((l) => l.startsWith('- ')).length, 5);
  }
});

test('tag sem número de versão não é tratada como "em dia"', () => {
  const r = rodar(fixture(), { ...EM_DIA, ...tags({ deno: 'nightly' }) });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /- deno: versão não reconhecida \(pinada `2\.9\.5`, tag `nightly` em denoland\/deno\)/);
  assert.match(r.stdout, /entre as 4 ferramentas verificadas/);
});

test('toolchain.json ausente, inválido ou que não é objeto: aviso e exit 0, sem consultar nada', () => {
  for (const conteudo of [null, '{ quebrado', '', 'null']) {
    const r = rodar(fixture(conteudo), EM_DIA);
    assert.equal(r.status, 0, String(conteudo));
    assert.match(r.stderr, /^::warning::bump-toolchain falhou: /);
    assert.deepEqual(r.chamadas, []);
    assert.equal(r.stdout, '');
  }
});

test('toolchain.json sem as chaves conhecidas: nada a consultar', () => {
  for (const conteudo of [{}, [], { node: '24', go: '1.24.x' }]) {
    const r = rodar(fixture(conteudo), EM_DIA);
    assert.equal(r.status, 0);
    assert.deepEqual(r.chamadas, []);
    assert.match(r.stdout, /Nenhuma ferramenta pôde ser verificada nesta execução\./);
  }
});

test('só consulta as ferramentas pinadas no arquivo', () => {
  const r = rodar(fixture({ bun: '1.4.0', node: '24' }), EM_DIA);
  assert.deepEqual(r.chamadas.map((c) => c.caminho), [caminho('bun')]);
  assert.match(r.stdout, /entre as 1 ferramentas verificadas \(bun\)/);
});

test('token: GH_TOKEN vai no cabeçalho, GITHUB_TOKEN serve de reserva, sem token consulta anônimo — e nunca é impresso', () => {
  const comGh = rodar(fixture(), EM_DIA, { env: { GH_TOKEN: 'segredo-gh', GITHUB_TOKEN: 'segredo-outro' } });
  assert.ok(comGh.chamadas.every((c) => c.auth === 'Bearer segredo-gh'));
  const comGithub = rodar(fixture(), EM_DIA, { env: { GITHUB_TOKEN: 'segredo-outro' } });
  assert.ok(comGithub.chamadas.every((c) => c.auth === 'Bearer segredo-outro'));
  const semToken = rodar(fixture(), EM_DIA);
  assert.ok(semToken.chamadas.every((c) => c.auth === null));
  for (const r of [comGh, comGithub]) assert.ok(!`${r.stdout}${r.stderr}${r.resumo}`.includes('segredo'));
});

test('Job Summary recebe a mesma saída; sem a variável só imprime; caminho inválido não derruba', () => {
  const raiz = fixture();
  const normal = rodar(raiz, EM_DIA);
  assert.equal(normal.resumo, `\n${normal.stdout}`);
  const sem = rodar(raiz, EM_DIA, { env: { GITHUB_STEP_SUMMARY: '' } });
  assert.equal(sem.status, 0);
  assert.equal(sem.stdout, normal.stdout);
  const invalido = rodar(raiz, EM_DIA, { env: { GITHUB_STEP_SUMMARY: path.join(raiz, 'nao', 'existe', 'summary.md') } });
  assert.equal(invalido.status, 0);
  assert.equal(invalido.stdout, normal.stdout);
});

test('duas execuções com as mesmas respostas dão a mesma saída', () => {
  const raiz = fixture();
  const regras = { ...EM_DIA, ...tags({ deno: 'v3.0.0' }) };
  assert.equal(rodar(raiz, regras).stdout, rodar(raiz, regras).stdout);
});

test('roda de outro cwd e em caminho com espaço e acento', () => {
  const r = rodar(fixture(PINADAS, 'bump toolchain ação '), EM_DIA, { cwd: os.tmpdir() });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /entre as 5 ferramentas verificadas/);
});

test('toolchain.json deste repo: as 5 chaves consultadas existem e têm versão numérica', (t) => {
  const arquivo = path.join(RAIZ, '.github', 'toolchain.json');
  if (!fs.existsSync(arquivo)) return t.skip('.github/toolchain.json não existe neste checkout');
  const real = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  for (const chave of Object.keys(REPOS)) assert.match(String(real[chave] ?? ''), /^v?\d+(\.\d+)*$/, chave);
  const r = rodar(fixture(real), EM_DIA);
  assert.equal(r.status, 0);
  assert.equal(r.chamadas.length, 5);
});
