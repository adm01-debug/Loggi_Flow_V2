// Teste da fila de merge (scripts/ci/fila-merge.mjs).
// Núcleo puro chamado direto; o CLI roda como subprocesso numa cópia em pasta temporária,
// com um `gh` falso no PATH (nenhuma chamada sai para a rede) e um baseline de fixture.
// Rodar: node --test scripts/ci/fila-merge.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  checksObrigatorios, classificar, confirmarCandidato, decidir, estadoDoCheck, execComRetry,
  exigeBranchAtualizada, resolverDesconhecidos,
} from './fila-merge.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const OBRIGATORIOS = ['Lint', 'Type Check'];
const temporarios = [];
after(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });

const GH_FALSO = `#!/bin/sh
echo "$*" >> "$GH_STUB/calls.log"
if [ "$1" = pr ]; then
  [ -f "$GH_STUB/pr-list.stderr" ] && cat "$GH_STUB/pr-list.stderr" >&2
  [ -f "$GH_STUB/pr-list.json" ] && cat "$GH_STUB/pr-list.json"
  exit "$(cat "$GH_STUB/pr-list.exit" 2>/dev/null || echo 0)"
fi
sha="\${2##*...}"
[ -f "$GH_STUB/compare-$sha.stderr" ] && cat "$GH_STUB/compare-$sha.stderr" >&2
[ -f "$GH_STUB/compare-$sha.out" ] && cat "$GH_STUB/compare-$sha.out"
exit "$(cat "$GH_STUB/compare-$sha.exit" 2>/dev/null || echo 0)"
`;

function fixture({ strict = true, baseline, nome = 'fila-merge-' } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), nome));
  temporarios.push(raiz);
  for (const d of ['scripts/ci', 'scripts/lib', 'bin', 'stub', 'vazio']) fs.mkdirSync(path.join(raiz, d), { recursive: true });
  fs.copyFileSync(path.join(AQUI, 'fila-merge.mjs'), path.join(raiz, 'scripts/ci/fila-merge.mjs'));
  fs.copyFileSync(path.join(RAIZ, 'scripts/lib/seguranca-processo.mjs'), path.join(raiz, 'scripts/lib/seguranca-processo.mjs'));
  fs.writeFileSync(
    path.join(raiz, 'scripts/ci/github-settings-baseline.json'),
    baseline ?? JSON.stringify({ branch_protection_main: { strict, required_status_checks: OBRIGATORIOS } }),
  );
  fs.writeFileSync(path.join(raiz, 'bin/gh'), GH_FALSO, { mode: 0o755 });
  return raiz;
}

function rodar(raiz, { args = [], prs, stub = {}, env = {}, script, cwd, semGh = false } = {}) {
  const dirStub = path.join(raiz, 'stub');
  fs.rmSync(dirStub, { recursive: true, force: true });
  fs.mkdirSync(dirStub);
  if (prs !== undefined) fs.writeFileSync(path.join(dirStub, 'pr-list.json'), typeof prs === 'string' ? prs : JSON.stringify(prs));
  for (const [nome, conteudo] of Object.entries(stub)) fs.writeFileSync(path.join(dirStub, nome), String(conteudo));
  const saida = path.join(raiz, 'github-output.txt');
  const resumo = path.join(raiz, 'github-summary.md');
  fs.rmSync(saida, { force: true });
  fs.rmSync(resumo, { force: true });
  const r = spawnSync(process.execPath, [script ?? path.join(raiz, 'scripts/ci/fila-merge.mjs'), ...args], {
    encoding: 'utf8',
    cwd: cwd ?? raiz,
    env: {
      PATH: semGh ? path.join(raiz, 'vazio') : `${path.join(raiz, 'bin')}:/usr/bin:/bin`,
      GH_STUB: dirStub,
      GITHUB_REPOSITORY: 'dono/repo',
      GITHUB_OUTPUT: saida,
      GITHUB_STEP_SUMMARY: resumo,
      ...env,
    },
  });
  const ler = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, output: ler(saida), resumo: ler(resumo), chamadas: ler(path.join(dirStub, 'calls.log')).split('\n').filter(Boolean) };
}

const check = (name, conclusion, extra = {}) => ({ __typename: 'CheckRun', name, status: 'COMPLETED', conclusion, startedAt: '2026-11-01T10:00:00Z', ...extra });
const verdes = OBRIGATORIOS.map((n) => check(n, 'SUCCESS'));
const pr = (number, extra = {}) => ({
  number, isDraft: false, isCrossRepository: false, baseRefName: 'main', headRefOid: `sha${number}`,
  autoMergeRequest: { enabledAt: `2026-11-01T00:00:${String(number % 60).padStart(2, '0')}Z` },
  mergeStateStatus: 'BEHIND', statusCheckRollup: verdes, ...extra,
});

// ------------------------------------------------------------------ estadoDoCheck
test('estadoDoCheck: sem entrada do check = pendente', () => {
  assert.equal(estadoDoCheck([], 'Lint'), 'pendente');
  assert.equal(estadoDoCheck(null, 'Lint'), 'pendente');
  assert.equal(estadoDoCheck([check('Outro', 'FAILURE')], 'Lint'), 'pendente');
});

test('estadoDoCheck: CheckRun concluído', () => {
  for (const c of ['SUCCESS', 'SKIPPED', 'NEUTRAL']) assert.equal(estadoDoCheck([check('Lint', c)], 'Lint'), 'passou', c);
  for (const c of ['FAILURE', 'TIMED_OUT', 'STARTUP_FAILURE']) assert.equal(estadoDoCheck([check('Lint', c)], 'Lint'), 'falhou', c);
  for (const c of ['CANCELLED', 'ACTION_REQUIRED', 'STALE']) assert.equal(estadoDoCheck([check('Lint', c)], 'Lint'), 'pendente', c);
});

test('estadoDoCheck: CheckRun ainda rodando = pendente', () => {
  for (const status of ['QUEUED', 'IN_PROGRESS', 'WAITING', 'PENDING']) {
    assert.equal(estadoDoCheck([{ __typename: 'CheckRun', name: 'Lint', status, conclusion: '' }], 'Lint'), 'pendente', status);
  }
});

test('estadoDoCheck: StatusContext usa `context` e `state`', () => {
  const st = (state) => [{ __typename: 'StatusContext', context: 'Lint', state, startedAt: '2026-11-01T10:00:00Z' }];
  assert.equal(estadoDoCheck(st('SUCCESS'), 'Lint'), 'passou');
  assert.equal(estadoDoCheck(st('FAILURE'), 'Lint'), 'falhou');
  assert.equal(estadoDoCheck(st('ERROR'), 'Lint'), 'falhou');
  assert.equal(estadoDoCheck(st('PENDING'), 'Lint'), 'pendente');
  assert.equal(estadoDoCheck(st('EXPECTED'), 'Lint'), 'pendente');
});

test('estadoDoCheck: runs repetidos no mesmo head — vale o mais recente', () => {
  const antigo = check('Lint', 'FAILURE', { startedAt: '2026-11-01T10:00:00Z' });
  const novo = check('Lint', 'SUCCESS', { startedAt: '2026-11-01T11:00:00Z' });
  assert.equal(estadoDoCheck([antigo, novo], 'Lint'), 'passou');
  assert.equal(estadoDoCheck([novo, antigo], 'Lint'), 'passou');
  assert.equal(estadoDoCheck([check('Lint', 'SUCCESS', { startedAt: '2026-11-01T09:00:00Z' }), antigo], 'Lint'), 'falhou');
});

// ------------------------------------------------------------------ classificar
test('classificar: fora da fila — draft, sem auto-merge, outra base, conflito', () => {
  assert.equal(classificar(pr(1, { isDraft: true }), OBRIGATORIOS), 'fora');
  assert.equal(classificar(pr(1, { autoMergeRequest: null }), OBRIGATORIOS), 'fora');
  assert.equal(classificar(pr(1, { baseRefName: 'contexto' }), OBRIGATORIOS), 'fora');
  assert.equal(classificar(pr(1, { baseRefName: 'master' }), OBRIGATORIOS), 'fora');
  assert.equal(classificar(pr(1, { mergeStateStatus: 'DIRTY' }), OBRIGATORIOS), 'fora');
});

test('classificar: check obrigatório falhando bloqueia, atrasada ou não', () => {
  const rollup = [check('Lint', 'FAILURE'), check('Type Check', 'SUCCESS')];
  assert.equal(classificar(pr(1, { statusCheckRollup: rollup }), OBRIGATORIOS), 'bloqueada');
  assert.equal(classificar(pr(1, { statusCheckRollup: rollup, mergeStateStatus: 'BLOCKED' }), OBRIGATORIOS), 'bloqueada');
});

test('classificar: check NÃO obrigatório falhando não bloqueia', () => {
  assert.equal(classificar(pr(1, { statusCheckRollup: [...verdes, check('Vercel', 'FAILURE')] }), OBRIGATORIOS), 'aguardando');
});

test('classificar: atrasada da própria origem aguarda; atrasada de fork fica fora', () => {
  assert.equal(classificar(pr(1), OBRIGATORIOS), 'aguardando');
  assert.equal(classificar(pr(1, { isCrossRepository: true }), OBRIGATORIOS), 'fora');
});

test('classificar: em dia com a main ocupa a vez (inclusive fork e UNKNOWN)', () => {
  for (const estado of ['CLEAN', 'BLOCKED', 'UNSTABLE', 'HAS_HOOKS', 'UNKNOWN']) {
    assert.equal(classificar(pr(1, { mergeStateStatus: estado }), OBRIGATORIOS), 'em-voo', estado);
  }
  assert.equal(classificar(pr(1, { mergeStateStatus: 'CLEAN', isCrossRepository: true }), OBRIGATORIOS), 'em-voo');
});

// ------------------------------------------------------------------ decidir
test('decidir: lista vazia = nada', () => {
  assert.deepEqual(decidir([], OBRIGATORIOS), { acao: 'nada', bloqueadas: [] });
});

test('decidir: havendo PR em voo ninguém é atualizado', () => {
  const d = decidir([pr(1), pr(2, { mergeStateStatus: 'BLOCKED' }), pr(3)], OBRIGATORIOS);
  assert.equal(d.acao, 'esperar');
  assert.deepEqual(d.emVoo, [2]);
  assert.equal(d.pr, undefined);
});

test('decidir: FIFO por enabledAt, e não pela ordem da lista nem pelo número', () => {
  const d = decidir([
    pr(30, { autoMergeRequest: { enabledAt: '2026-11-03T00:00:00Z' } }),
    pr(20, { autoMergeRequest: { enabledAt: '2026-11-01T00:00:00Z' } }),
    pr(10, { autoMergeRequest: { enabledAt: '2026-11-02T00:00:00Z' } }),
  ], OBRIGATORIOS);
  assert.deepEqual(d, { acao: 'atualizar', pr: 20, fila: [20, 10, 30], restantes: [10, 30], bloqueadas: [] });
});

test('decidir: empate em enabledAt desempata pelo número', () => {
  const quando = { autoMergeRequest: { enabledAt: '2026-11-01T00:00:00Z' } };
  assert.deepEqual(decidir([pr(9, quando), pr(4, quando), pr(7, quando)], OBRIGATORIOS).fila, [4, 7, 9]);
});

test('decidir: bloqueadas, drafts, forks e conflitos não entram na fila', () => {
  const d = decidir([
    pr(1, { statusCheckRollup: [check('Lint', 'FAILURE')] }),
    pr(2, { isDraft: true }),
    pr(3, { isCrossRepository: true }),
    pr(4, { mergeStateStatus: 'DIRTY' }),
    pr(5),
  ], OBRIGATORIOS);
  assert.deepEqual(d, { acao: 'atualizar', pr: 5, fila: [5], restantes: [], bloqueadas: [1] });
});

test('decidir: mesma entrada, mesma saída (execução repetida)', () => {
  const prs = [pr(3), pr(1), pr(2)];
  assert.deepEqual(decidir(prs, OBRIGATORIOS), decidir(prs, OBRIGATORIOS));
  assert.deepEqual(decidir(prs, OBRIGATORIOS), decidir([...prs].reverse(), OBRIGATORIOS));
});

test('decidir: 250 PRs — a em voo no fim da lista ainda segura a fila', () => {
  const muitas = Array.from({ length: 249 }, (_, i) => pr(i + 1));
  assert.equal(decidir(muitas, OBRIGATORIOS).fila.length, 249);
  assert.deepEqual(decidir([...muitas, pr(999, { mergeStateStatus: 'CLEAN' })], OBRIGATORIOS).emVoo, [999]);
});

// ------------------------------------------------------------------ confirmarCandidato
test('confirmarCandidato: só a primeira não recusada da fila recalculada', () => {
  const d = { acao: 'atualizar', pr: 1, fila: [1, 2, 3], restantes: [2, 3], bloqueadas: [] };
  assert.equal(confirmarCandidato(d, 1), true);
  assert.equal(confirmarCandidato(d, 2), false);
  assert.equal(confirmarCandidato(d, 2, [1]), true);
  assert.equal(confirmarCandidato(d, 3, [1]), false);
  assert.equal(confirmarCandidato(d, 9, [1, 2, 3]), false);
  assert.equal(confirmarCandidato({ acao: 'esperar', emVoo: [5], bloqueadas: [] }, 1), false);
  assert.equal(confirmarCandidato({ acao: 'nada', bloqueadas: [] }, 1), false);
});

// ------------------------------------------------------------------ resolverDesconhecidos
test('resolverDesconhecidos: UNKNOWN atrasada vira BEHIND; em dia continua UNKNOWN', async () => {
  const atras = { sha1: 3, sha2: 0 };
  const saida = await resolverDesconhecidos(
    [pr(1, { mergeStateStatus: 'UNKNOWN' }), pr(2, { mergeStateStatus: 'UNKNOWN' }), pr(3, { mergeStateStatus: 'CLEAN' })],
    async (sha) => atras[sha],
  );
  assert.deepEqual(saida.map((p) => p.mergeStateStatus), ['BEHIND', 'UNKNOWN', 'CLEAN']);
});

test('resolverDesconhecidos: compare falhou ou devolveu lixo = continua UNKNOWN (ocupa a vez)', async () => {
  for (const behindBy of [async () => { throw new Error('HTTP 404'); }, async () => Number.NaN, async () => null, async () => -1]) {
    const [saida] = await resolverDesconhecidos([pr(1, { mergeStateStatus: 'UNKNOWN' })], behindBy);
    assert.equal(saida.mergeStateStatus, 'UNKNOWN');
  }
});

test('resolverDesconhecidos: não consulta a API para draft, sem auto-merge ou sem head', async () => {
  let chamadas = 0;
  const conta = async () => { chamadas += 1; return 5; };
  await resolverDesconhecidos([
    pr(1, { mergeStateStatus: 'UNKNOWN', isDraft: true }),
    pr(2, { mergeStateStatus: 'UNKNOWN', autoMergeRequest: null }),
    pr(3, { mergeStateStatus: 'UNKNOWN', headRefOid: '' }),
    pr(4, { mergeStateStatus: 'BEHIND' }),
  ], conta);
  assert.equal(chamadas, 0);
});

// ------------------------------------------------------------------ execComRetry
function comandoQueFalha(vezes, stderr) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fila-retry-'));
  temporarios.push(dir);
  const contador = path.join(dir, 'n');
  const cmd = path.join(dir, 'cmd');
  fs.writeFileSync(contador, '');
  fs.writeFileSync(cmd, `#!/bin/sh\nprintf x >> "${contador}"\nif [ "$(wc -c < "${contador}")" -le ${vezes} ]; then echo "${stderr}" >&2; exit 1; fi\necho ok\n`, { mode: 0o755 });
  return { cmd, tentativasFeitas: () => fs.readFileSync(contador, 'utf8').length };
}
const OPCOES = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };

test('execComRetry: erro transitório (502) é repetido até dar certo', async () => {
  const { cmd, tentativasFeitas } = comandoQueFalha(2, 'HTTP 502: Bad Gateway');
  assert.equal(await execComRetry(cmd, [], OPCOES, { delaysMs: [1] }), 'ok\n');
  assert.equal(tentativasFeitas(), 3);
});

test('execComRetry: erro definitivo (401/403/404/422) não é repetido', async () => {
  for (const erro of ['HTTP 401: Bad credentials', 'HTTP 403: Resource not accessible by integration', 'HTTP 404: Not Found', 'HTTP 422: Validation Failed']) {
    const { cmd, tentativasFeitas } = comandoQueFalha(99, erro);
    await assert.rejects(execComRetry(cmd, [], OPCOES, { delaysMs: [1] }));
    assert.equal(tentativasFeitas(), 1, erro);
  }
});

test('execComRetry: transitório que não passa desiste depois das tentativas', async () => {
  const { cmd, tentativasFeitas } = comandoQueFalha(99, 'HTTP 503: Service Unavailable');
  await assert.rejects(execComRetry(cmd, [], OPCOES, { tentativas: 3, delaysMs: [1] }), /503/);
  assert.equal(tentativasFeitas(), 3);
});

// ------------------------------------------------------------------ baseline deste repositório
test('baseline real: todo check obrigatório existe como job em .github/workflows', () => {
  const dir = path.join(RAIZ, '.github', 'workflows');
  const nomes = new Set();
  for (const arquivo of fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    const texto = fs.readFileSync(path.join(dir, arquivo), 'utf8');
    const jobs = texto.slice(texto.search(/^jobs:\s*$/m));
    for (const m of jobs.matchAll(/^ {2}([A-Za-z0-9_-]+):\s*$/gm)) nomes.add(m[1]);
    for (const m of jobs.matchAll(/^ {4}name:\s*(.+?)\s*$/gm)) nomes.add(m[1].replace(/^(['"])(.*)\1$/, '$2'));
  }
  const obrigatorios = checksObrigatorios();
  assert.ok(Array.isArray(obrigatorios) && obrigatorios.length > 0);
  assert.deepEqual(obrigatorios.filter((n) => !nomes.has(n)), []);
});

test('baseline real: com strict=false a fila não chama o gh nem atualiza ninguém', (t) => {
  if (exigeBranchAtualizada()) return t.skip('baseline deste repo está com strict=true');
  const raiz = fixture();
  const r = rodar(raiz, { script: path.join(AQUI, 'fila-merge.mjs'), prs: [pr(1, { mergeStateStatus: 'UNKNOWN' })], stub: { 'compare-sha1.out': '3' } });
  assert.equal(r.status, 0);
  assert.deepEqual(r.chamadas, []);
  assert.equal(r.output, '');
  assert.match(r.resumo, /Fila desligada/);
});

// ------------------------------------------------------------------ CLI (strict=true)
test('cli: sem GITHUB_REPOSITORY sai com 2', () => {
  const r = rodar(fixture(), { env: { GITHUB_REPOSITORY: '' }, prs: [] });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /GITHUB_REPOSITORY ausente/);
  assert.deepEqual(r.chamadas, []);
});

test('cli: --help mostra o uso e não chama o gh', () => {
  const r = rodar(fixture(), { args: ['--help'], prs: [pr(1)] });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^Uso: node scripts\/ci\/fila-merge\.mjs/);
  assert.deepEqual(r.chamadas, []);
  assert.equal(r.output, '');
});

test('cli: lista vazia — nada a atualizar, nenhum output', () => {
  const r = rodar(fixture(), { prs: [] });
  assert.equal(r.status, 0);
  assert.equal(r.output, '');
  assert.match(r.resumo, /Nenhuma PR com auto-merge esperando atualização\./);
  assert.equal(r.chamadas.length, 1);
  assert.match(r.chamadas[0], /^pr list --repo dono\/repo --state open --base main --limit 1000 --json /);
});

test('cli: uma PR atrasada vira pr= e fila= no GITHUB_OUTPUT', () => {
  const r = rodar(fixture(), { prs: [pr(12)] });
  assert.equal(r.status, 0);
  assert.equal(r.output, 'pr=12\nfila=12\n');
  assert.equal(r.resumo, '### Fila de merge\n\n- Próxima da fila: #12.\n');
});

test('cli: fila em ordem FIFO, com restantes e bloqueadas no resumo', () => {
  const r = rodar(fixture(), {
    prs: [
      pr(30, { autoMergeRequest: { enabledAt: '2026-11-03T00:00:00Z' } }),
      pr(20, { autoMergeRequest: { enabledAt: '2026-11-01T00:00:00Z' } }),
      pr(10, { autoMergeRequest: { enabledAt: '2026-11-02T00:00:00Z' } }),
      pr(40, { statusCheckRollup: [check('Lint', 'FAILURE')] }),
    ],
  });
  assert.equal(r.output, 'pr=20\nfila=20 10 30\n');
  assert.match(r.resumo, /Próxima da fila: #20\./);
  assert.match(r.resumo, /Esperando a vez \(sem gastar CI\): #10, #30\./);
  assert.match(r.resumo, /Fora da fila até corrigir check obrigatório: #40\./);
});

test('cli: PR em voo — ninguém é atualizado', () => {
  const r = rodar(fixture(), { prs: [pr(1), pr(2, { mergeStateStatus: 'BLOCKED' })] });
  assert.equal(r.status, 0);
  assert.equal(r.output, '');
  assert.match(r.resumo, /Em voo: #2 — ninguém mais é atualizado agora\./);
});

test('cli: só draft, fork atrasada, conflito e PR sem auto-merge — nada', () => {
  const r = rodar(fixture(), {
    prs: [pr(1, { isDraft: true }), pr(2, { isCrossRepository: true }), pr(3, { mergeStateStatus: 'DIRTY' }), pr(4, { autoMergeRequest: null })],
  });
  assert.equal(r.output, '');
  assert.match(r.resumo, /Nenhuma PR com auto-merge esperando atualização\./);
});

test('cli: UNKNOWN atrasada (compare > 0) entra na fila', () => {
  const r = rodar(fixture(), { prs: [pr(7, { mergeStateStatus: 'UNKNOWN' })], stub: { 'compare-sha7.out': '3\n' } });
  assert.equal(r.output, 'pr=7\nfila=7\n');
  assert.equal(r.chamadas[1], 'api repos/dono/repo/compare/main...sha7 --jq .behind_by');
});

test('cli: UNKNOWN em dia (compare = 0) ocupa a vez', () => {
  const r = rodar(fixture(), { prs: [pr(7, { mergeStateStatus: 'UNKNOWN' }), pr(8)], stub: { 'compare-sha7.out': '0\n' } });
  assert.equal(r.output, '');
  assert.match(r.resumo, /Em voo: #7/);
});

test('cli: UNKNOWN com compare falhando (404) ou vazio fica conservador', () => {
  for (const stub of [{ 'compare-sha7.exit': 1, 'compare-sha7.stderr': 'gh: Not Found (HTTP 404)' }, { 'compare-sha7.out': '' }, { 'compare-sha7.out': 'null\n' }]) {
    const r = rodar(fixture(), { prs: [pr(7, { mergeStateStatus: 'UNKNOWN' }), pr(8)], stub });
    assert.equal(r.status, 0);
    assert.equal(r.output, '');
    assert.match(r.resumo, /Em voo: #7/);
  }
});

test('cli: gh falhando (401/403/404/422/429/500) não atualiza ninguém e o resumo diz por quê', () => {
  const erros = [
    'gh: Bad credentials (HTTP 401)',
    'gh: Resource not accessible by integration (HTTP 403)',
    'gh: Not Found (HTTP 404)',
    'gh: Validation Failed (HTTP 422)',
    'gh: API rate limit exceeded (HTTP 429)',
    'gh: Server Error (HTTP 500)',
  ];
  const raiz = fixture();
  for (const erro of erros) {
    const r = rodar(raiz, { prs: [pr(1)], stub: { 'pr-list.exit': 1, 'pr-list.stderr': `${erro}\n` } });
    assert.equal(r.status, 0, erro);
    assert.equal(r.output, '', erro);
    assert.ok(r.stderr.includes(`::warning::gh pr list falhou (${erro}); nenhuma PR atualizada nesta execução.`), r.stderr);
    assert.ok(r.resumo.includes(`gh pr list falhou (${erro})`), r.resumo);
    assert.doesNotMatch(r.resumo, /Nenhuma PR com auto-merge esperando/);
    assert.equal(r.chamadas.length, 1, 'erro definitivo não é repetido');
  }
});

test('cli: sem token o gh recusa e ninguém é atualizado', () => {
  const r = rodar(fixture(), { stub: { 'pr-list.exit': 4, 'pr-list.stderr': 'gh: To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable.\n' } });
  assert.equal(r.status, 0);
  assert.equal(r.output, '');
  assert.match(r.resumo, /gh pr list falhou \(gh: To use GitHub CLI/);
});

test('cli: gh fora do PATH não atualiza ninguém e avisa', () => {
  const r = rodar(fixture(), { prs: [pr(1)], semGh: true });
  assert.equal(r.status, 0);
  assert.equal(r.output, '');
  assert.match(r.resumo, /gh pr list falhou \(comando nao encontrado no PATH: gh\)/);
});

test('cli: resposta que não é lista de PRs (HTML, null, objeto, vazio) falha fechado', () => {
  const raiz = fixture();
  for (const corpo of ['<html>502</html>', 'null', '{"message":"x"}', '']) {
    const r = rodar(raiz, { prs: corpo });
    assert.equal(r.status, 0, corpo);
    assert.equal(r.output, '', corpo);
    assert.match(r.stderr, /::warning::gh pr list falhou/, corpo);
    assert.match(r.resumo, /gh pr list falhou/, corpo);
  }
});

test('cli: entrada nula dentro da lista é ignorada sem derrubar a fila', () => {
  const r = rodar(fixture(), { prs: [null, pr(5)] });
  assert.equal(r.status, 0);
  assert.equal(r.output, 'pr=5\nfila=5\n');
});

test('cli: 150 PRs (mais de uma página do gh) — FIFO preservado', () => {
  const prs = Array.from({ length: 150 }, (_, i) => pr(i + 1, { autoMergeRequest: { enabledAt: new Date(Date.UTC(2026, 10, 1, 0, 0, 150 - i)).toISOString() } }));
  const r = rodar(fixture(), { prs });
  assert.equal(r.output.split('\n')[0], 'pr=150');
  assert.equal(r.output.split('\n')[1].split(' ').length, 150);
});

test('cli: lista cheia até o limite gera aviso de que pode faltar PR', () => {
  const prs = Array.from({ length: 1000 }, (_, i) => pr(i + 1, { autoMergeRequest: null }));
  const r = rodar(fixture(), { prs });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /::warning::A lista de PRs veio cheia \(1000\)/);
  assert.match(r.resumo, /A lista de PRs veio cheia \(1000\)/);
});

test('cli: só inteiros positivos chegam ao output que o shell itera', () => {
  const r = rodar(fixture(), { prs: [pr(3), { ...pr(4), number: '5; rm -rf /' }, { ...pr(6), number: -1 }] });
  assert.match(r.output, /^pr=[^\n]*\nfila=[0-9 ]*\n$/);
  assert.ok(!r.output.includes('rm -rf'));
});

test('cli: executar duas vezes dá a mesma decisão', () => {
  const raiz = fixture();
  const a = rodar(raiz, { prs: [pr(2), pr(1)] });
  const b = rodar(raiz, { prs: [pr(2), pr(1)] });
  assert.equal(a.output, 'pr=1\nfila=1 2\n');
  assert.deepEqual([a.status, a.output, a.resumo, a.stdout], [b.status, b.output, b.resumo, b.stdout]);
});

test('cli: nunca chama endpoint de escrita', () => {
  const r = rodar(fixture(), { prs: [pr(1, { mergeStateStatus: 'UNKNOWN' }), pr(2)], stub: { 'compare-sha1.out': '2' } });
  assert.equal(r.output, 'pr=1\nfila=1 2\n');
  for (const chamada of r.chamadas) {
    assert.match(chamada, /^(pr list |api repos\/dono\/repo\/compare\/main\.\.\.\S+ --jq \.behind_by$)/);
    assert.doesNotMatch(chamada, /(^| )(-X|--method|-f|-F|--field|--input)( |$)|update-branch/);
  }
});

test('cli: sem GITHUB_OUTPUT e sem GITHUB_STEP_SUMMARY só imprime', () => {
  const r = rodar(fixture(), { prs: [pr(1)], env: { GITHUB_OUTPUT: '', GITHUB_STEP_SUMMARY: '' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'Próxima da fila: #1.\n');
});

test('cli: roda de outro cwd, por link simbólico e em caminho com espaço e acento', () => {
  const raiz = fixture({ nome: 'fila merge ação ' });
  const link = `${raiz}-link`;
  fs.symlinkSync(raiz, link);
  temporarios.push(link);
  for (const opcoes of [{ cwd: os.tmpdir() }, { script: path.join(link, 'scripts/ci/fila-merge.mjs') }]) {
    const r = rodar(raiz, { prs: [pr(1)], ...opcoes });
    assert.equal(r.status, 0);
    assert.equal(r.output, 'pr=1\nfila=1\n');
  }
});

test('cli: baseline ilegível falha alto (exit != 0), sem output', () => {
  const r = rodar(fixture({ baseline: '{ não é json' }), { prs: [pr(1)] });
  assert.notEqual(r.status, 0);
  assert.equal(r.output, '');
});

// ------------------------------------------------------------------ CLI --confirmar
test('confirmar: exit 0 para a próxima da fila, sem escrever output nem resumo', () => {
  const r = rodar(fixture(), { args: ['--confirmar', '1'], prs: [pr(1), pr(2)] });
  assert.equal(r.status, 0);
  assert.equal(r.output, '');
  assert.equal(r.resumo, '');
});

test('confirmar: exit 3 para quem não é a próxima; 0 quando a da frente já foi recusada', () => {
  const raiz = fixture();
  const prs = [pr(1), pr(2), pr(3)];
  assert.equal(rodar(raiz, { args: ['--confirmar', '2'], prs }).status, 3);
  assert.equal(rodar(raiz, { args: ['--confirmar', '2', '--recusadas', ' 1'], prs }).status, 0);
  assert.equal(rodar(raiz, { args: ['--confirmar', '3', '--recusadas', '1 2'], prs }).status, 0);
  assert.equal(rodar(raiz, { args: ['--confirmar', '3', '--recusadas', '1'], prs }).status, 3);
  assert.equal(rodar(raiz, { args: ['--confirmar', '99'], prs }).status, 3);
});

test('confirmar: exit 3 quando alguém entrou em voo ou a lista falhou', () => {
  const raiz = fixture();
  const emVoo = rodar(raiz, { args: ['--confirmar', '1'], prs: [pr(1), pr(2, { mergeStateStatus: 'CLEAN' })] });
  assert.equal(emVoo.status, 3);
  assert.match(emVoo.stdout, /Fila recalculada não autoriza #1 \(em voo: #2\)\./);
  const falha = rodar(raiz, { args: ['--confirmar', '1'], prs: [pr(1)], stub: { 'pr-list.exit': 1, 'pr-list.stderr': 'gh: Bad credentials (HTTP 401)\n' } });
  assert.equal(falha.status, 3);
  assert.match(falha.stdout, /não autoriza #1 \(gh pr list falhou/);
});

test('confirmar: número ausente ou inválido sai com 2 sem chamar o gh', () => {
  const raiz = fixture();
  for (const args of [['--confirmar'], ['--confirmar', 'abc'], ['--confirmar', '0'], ['--confirmar', '-3'], ['--confirmar', '1.5']]) {
    const r = rodar(raiz, { args, prs: [pr(1)] });
    assert.equal(r.status, 2, args.join(' '));
    assert.deepEqual(r.chamadas, []);
  }
});

// ------------------------------------------------------------------ CLI (strict=false)
test('strict=false: UNKNOWN atrasada NÃO é atualizada e o gh nem é chamado', () => {
  const r = rodar(fixture({ strict: false }), { prs: [pr(7, { mergeStateStatus: 'UNKNOWN' })], stub: { 'compare-sha7.out': '3' } });
  assert.equal(r.status, 0);
  assert.equal(r.output, '');
  assert.deepEqual(r.chamadas, []);
  assert.match(r.resumo, /Fila desligada: a proteção da `main` está com `strict=false`/);
});

test('strict=false: --confirmar nega (exit 3)', () => {
  const r = rodar(fixture({ strict: false }), { args: ['--confirmar', '7'], prs: [pr(7)] });
  assert.equal(r.status, 3);
  assert.deepEqual(r.chamadas, []);
});

test('baseline sem o campo strict mantém a fila ligada (comportamento de origem)', () => {
  const raiz = fixture({ baseline: JSON.stringify({ branch_protection_main: { required_status_checks: OBRIGATORIOS } }) });
  assert.equal(rodar(raiz, { prs: [pr(1)] }).output, 'pr=1\nfila=1\n');
});
