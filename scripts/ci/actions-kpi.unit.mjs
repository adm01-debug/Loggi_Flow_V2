// Teste do KPI do GitHub Actions (scripts/ci/actions-kpi.mjs).
// A conta é pura (agregar, maisLentos, paginaTemMais, tabela); a coleta recebe `pedir`
// injetado; o CLI roda como subprocesso contra um servidor HTTP local (GITHUB_API_URL),
// então nada sai para a rede nem escreve em issue de verdade.
// Rodar: node --test scripts/ci/actions-kpi.unit.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  agregar, coletarJobs, coletarRuns, corpoDoKpi, duracaoMinutos, maisLentos, paginaTemMais, pedir,
  publicarIssue, runsNaJanela, runsParaRanking, tabela, tabelaLentos,
} from './actions-kpi.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'actions-kpi.mjs');
const AGORA = Date.UTC(2026, 10, 9, 12, 0, 0);
const MIN = 60_000;
const DIA = 86_400_000;
const iso = (ms) => new Date(ms).toISOString();
const run = (id, { nome = 'CI', haMs = 60 * MIN, minutos = 10, conclusion = 'success', agora = AGORA } = {}) => ({
  id, name: nome, conclusion, run_started_at: iso(agora - haMs), updated_at: iso(agora - haMs + minutos * MIN),
});
const temporarios = [];
after(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });

async function capturarStderr(fn) {
  const original = console.error;
  const linhas = [];
  console.error = (...a) => linhas.push(a.join(' '));
  try { return { valor: await fn(), linhas }; } finally { console.error = original; }
}

// ------------------------------------------------------------------ duração e janela
test('duracaoMinutos: diferença entre início e última atualização', () => {
  assert.equal(duracaoMinutos({ run_started_at: '2026-11-09T10:00:00Z', updated_at: '2026-11-09T10:12:30Z' }), 12.5);
  assert.equal(duracaoMinutos({ run_started_at: '2026-11-09T10:00:00Z', updated_at: '2026-11-09T10:00:00Z' }), 0);
});

test('duracaoMinutos: carimbo ausente, inválido ou invertido vale 0 (nunca NaN nem negativo)', () => {
  for (const r of [{}, { run_started_at: 'x', updated_at: 'y' }, { run_started_at: '2026-11-09T10:00:00Z' }, { updated_at: '2026-11-09T10:00:00Z' },
    { run_started_at: null, updated_at: null }, { run_started_at: '2026-11-09T11:00:00Z', updated_at: '2026-11-09T10:00:00Z' }]) {
    assert.equal(duracaoMinutos(r), 0);
  }
});

test('duracaoMinutos: fuso não altera a duração', () => {
  assert.equal(duracaoMinutos({ run_started_at: '2026-11-09T07:00:00-03:00', updated_at: '2026-11-09T10:30:00Z' }), 30);
});

test('runsNaJanela: o corte é inclusivo e em instante absoluto (UTC), não em dia de calendário', () => {
  const noCorte = run(1, { haMs: 7 * DIA });
  const fora = run(2, { haMs: 7 * DIA + 1000 });
  const dentro = run(3, { haMs: 7 * DIA - 1000 });
  assert.deepEqual(runsNaJanela([noCorte, fora, dentro], { janelaDias: 7, agora: AGORA }).map((r) => r.id), [1, 3]);
});

test('runsNaJanela: run sem run_started_at fica fora; entrada nula vira lista vazia', () => {
  assert.deepEqual(runsNaJanela([{ id: 1 }, { id: 2, run_started_at: 'lixo' }], { agora: AGORA }), []);
  assert.deepEqual(runsNaJanela(null, { agora: AGORA }), []);
  assert.deepEqual(runsNaJanela(undefined), []);
});

test('runsNaJanela: janela de 1 dia e de 30 dias', () => {
  const runs = [run(1, { haMs: 2 * 3600_000 }), run(2, { haMs: 3 * DIA }), run(3, { haMs: 20 * DIA }), run(4, { haMs: 40 * DIA })];
  assert.deepEqual(runsNaJanela(runs, { janelaDias: 1, agora: AGORA }).map((r) => r.id), [1]);
  assert.deepEqual(runsNaJanela(runs, { janelaDias: 30, agora: AGORA }).map((r) => r.id), [1, 2, 3]);
});

// ------------------------------------------------------------------ agregar
test('agregar: sem runs não divide por zero', () => {
  assert.deepEqual(agregar([], { agora: AGORA }), []);
  assert.deepEqual(agregar(null, { agora: AGORA }), []);
  assert.deepEqual(agregar([run(1, { haMs: 30 * DIA })], { agora: AGORA }), []);
});

test('agregar: conta, taxas com uma casa e minutos somados', () => {
  const runs = [
    run(1, { conclusion: 'success', minutos: 10 }),
    run(2, { conclusion: 'failure', minutos: 5.26 }),
    run(3, { conclusion: 'cancelled', minutos: 1 }),
  ];
  assert.deepEqual(agregar(runs, { agora: AGORA }), [
    { workflow: 'CI', runs: 3, cancelados: 1, falhas: 1, minutos: 16.3, taxaCancelamento: 33.3, taxaFalha: 33.3 },
  ]);
});

test('agregar: failure, timed_out e startup_failure são falha; cancelled é cancelado; o resto não conta', () => {
  const conclusoes = ['failure', 'timed_out', 'startup_failure', 'cancelled', 'success', 'skipped', 'neutral', 'action_required', 'stale', null];
  const [linha] = agregar(conclusoes.map((conclusion, i) => run(i, { conclusion })), { agora: AGORA });
  assert.equal(linha.runs, 10);
  assert.equal(linha.falhas, 3);
  assert.equal(linha.cancelados, 1);
  assert.equal(linha.taxaFalha, 30);
  assert.equal(linha.taxaCancelamento, 10);
});

test('agregar: 100% e 0% saem exatos', () => {
  assert.equal(agregar([run(1, { conclusion: 'failure' })], { agora: AGORA })[0].taxaFalha, 100);
  assert.equal(agregar([run(1)], { agora: AGORA })[0].taxaFalha, 0);
});

test('agregar: agrupa por workflow e ordena por runs, depois por minutos', () => {
  const runs = [
    run(1, { nome: 'B', minutos: 1 }), run(2, { nome: 'A', minutos: 50 }), run(3, { nome: 'B', minutos: 1 }),
    run(4, { nome: 'C', minutos: 99 }), run(5, { nome: 'D', minutos: 50 }),
  ];
  assert.deepEqual(agregar(runs, { agora: AGORA }).map((l) => l.workflow), ['B', 'C', 'A', 'D']);
});

test('agregar: sem nome usa o workflow_id e, por último, "(sem nome)"', () => {
  const base = run(1);
  const linhas = agregar([{ ...base, name: '', workflow_id: 123 }, { ...base, name: null }], { agora: AGORA });
  assert.deepEqual(linhas.map((l) => l.workflow).sort(), ['(sem nome)', 123].sort());
});

test('agregar: run ainda rodando (conclusion null) conta como run, sem falha', () => {
  const [linha] = agregar([{ ...run(1), conclusion: null }], { agora: AGORA });
  assert.deepEqual([linha.runs, linha.falhas, linha.cancelados], [1, 0, 0]);
});

// ------------------------------------------------------------------ paginação
test('paginaTemMais: página incompleta é a última', () => {
  assert.equal(paginaTemMais([run(1)], { agora: AGORA }), false);
  assert.equal(paginaTemMais([], { agora: AGORA }), false);
  assert.equal(paginaTemMais(null, { agora: AGORA }), false);
});

test('paginaTemMais: página cheia dentro da janela continua; cheia que já saiu da janela para', () => {
  const cheia = Array.from({ length: 100 }, (_, i) => run(i));
  assert.equal(paginaTemMais(cheia, { agora: AGORA }), true);
  assert.equal(paginaTemMais([...cheia.slice(1), run(999, { haMs: 8 * DIA })], { agora: AGORA }), false);
  assert.equal(paginaTemMais(Array.from({ length: 100 }, (_, i) => ({ id: i })), { agora: AGORA }), false);
  assert.equal(paginaTemMais([run(1), run(2)], { agora: AGORA, porPagina: 2 }), true);
});

// ------------------------------------------------------------------ jobs
test('maisLentos: os 5 mais demorados, em ordem', () => {
  const jobs = [3, 9, 1, 7, 5, 8, 2].map((m, i) => ({ name: `j${i}`, workflow_name: 'CI', started_at: iso(AGORA), completed_at: iso(AGORA + m * MIN) }));
  assert.deepEqual(maisLentos(jobs).map((j) => j.minutos), [9, 8, 7, 5, 3]);
  assert.deepEqual(maisLentos(jobs, { limite: 2 }).map((j) => j.job), ['j1', 'j5']);
});

test('maisLentos: job sem fim (rodando ou pulado) vale 0; entrada vazia ou nula', () => {
  assert.deepEqual(maisLentos([{ name: 'x', started_at: iso(AGORA), completed_at: null }]), [{ job: 'x', workflow: '', minutos: 0 }]);
  assert.deepEqual(maisLentos([]), []);
  assert.deepEqual(maisLentos(null), []);
});

// ------------------------------------------------------------------ saída
test('tabela: formato publicado no Job Summary e na issue', () => {
  const texto = tabela(agregar([run(1, { minutos: 10 }), run(2, { conclusion: 'failure', minutos: 2.5 })], { agora: AGORA }));
  assert.equal(texto, [
    '## KPI do GitHub Actions — 7 dias',
    '',
    '| workflow | runs | cancelados | taxa cancel. | falhas | taxa falha | minutos |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    '| CI | 2 | 0 | 0% | 1 | 50% | 12.5 |',
    '',
    'Total: **2** runs, **12.5** minutos.',
  ].join('\n'));
});

test('tabela: sem runs ainda fecha com o total zerado', () => {
  assert.match(tabela([]), /\n\nTotal: \*\*0\*\* runs, \*\*0\*\* minutos\.$/);
});

test('tabela: total de minutos não acumula erro de ponto flutuante', () => {
  const runs = Array.from({ length: 30 }, (_, i) => run(i, { nome: `w${i}`, minutos: 0.1 }));
  assert.match(tabela(agregar(runs, { agora: AGORA })), /Total: \*\*30\*\* runs, \*\*3\*\* minutos\./);
});

test('tabelaLentos: vazio e preenchido', () => {
  assert.equal(tabelaLentos([]), '_nenhum job registrado na janela_');
  assert.equal(tabelaLentos([{ job: 'Lint', workflow: 'CI', minutos: 3.2 }]), '### 5 jobs mais lentos\n\n| job | workflow | minutos |\n| --- | --- | ---: |\n| Lint | CI | 3.2 |');
});

test('corpoDoKpi: o ranking sai dos jobs recebidos e o título segue a janela', () => {
  const jobs = [{ name: 'Build', workflow_name: 'CI', started_at: iso(AGORA), completed_at: iso(AGORA + 4 * MIN) }];
  const corpo = corpoDoKpi([run(1)], jobs, { janelaDias: 14, agora: AGORA });
  assert.match(corpo, /^## KPI do GitHub Actions — 14 dias\n/);
  assert.match(corpo, /\| Build \| CI \| 4 \|$/);
});

test('corpoDoKpi: avisa quando o ranking cobre só parte dos runs da janela', () => {
  const runs = Array.from({ length: 120 }, (_, i) => run(i));
  assert.match(corpoDoKpi(runs, [], { agora: AGORA, runsComJobs: 50 }), /\n\n_Ranking de jobs calculado sobre 50 dos 120 runs da janela/);
  assert.doesNotMatch(corpoDoKpi(runs, [], { agora: AGORA, runsComJobs: 120 }), /Ranking de jobs calculado/);
  assert.doesNotMatch(corpoDoKpi(runs, [], { agora: AGORA }), /Ranking de jobs calculado/);
});

test('runsParaRanking: os runs mais longos da janela, não os mais recentes', () => {
  const runs = [
    run(1, { haMs: 1 * MIN, minutos: 1 }), run(2, { haMs: 2 * MIN, minutos: 1 }),
    run(3, { haMs: 5 * DIA, minutos: 30 }), run(4, { haMs: 6 * DIA, minutos: 45 }),
    run(5, { haMs: 20 * DIA, minutos: 500 }),
  ];
  assert.deepEqual(runsParaRanking(runs, { agora: AGORA, limite: 3 }).map((r) => r.id), [4, 3, 1]);
  assert.deepEqual(runsParaRanking(runs, { agora: AGORA }).map((r) => r.id), [4, 3, 1, 2]);
  assert.deepEqual(runs.map((r) => r.id), [1, 2, 3, 4, 5], 'não reordena a lista recebida');
  assert.deepEqual(runsParaRanking([], { agora: AGORA }), []);
});

// ------------------------------------------------------------------ coleta (pedir injetado)
function apiDeRuns(total, { haMsDoMaisNovo = 0, passoMs = MIN } = {}) {
  const chamadas = [];
  const todos = Array.from({ length: total }, (_, i) => run(i + 1, { haMs: haMsDoMaisNovo + i * passoMs }));
  const buscar = async (caminho) => {
    chamadas.push(caminho);
    const pagina = Number(new URL(`http://x${caminho}`).searchParams.get('page'));
    return { workflow_runs: todos.slice((pagina - 1) * 100, pagina * 100) };
  };
  return { buscar, chamadas };
}

test('coletarRuns: uma página incompleta = uma requisição', async () => {
  const { buscar, chamadas } = apiDeRuns(30);
  const runs = await coletarRuns({ repo: 'dono/repo', token: 't', agora: AGORA, pedir: buscar });
  assert.equal(runs.length, 30);
  assert.deepEqual(chamadas, ['/repos/dono/repo/actions/runs?per_page=100&page=1']);
});

test('coletarRuns: 250 runs na janela — pagina até a página incompleta', async () => {
  const { buscar, chamadas } = apiDeRuns(250);
  const runs = await coletarRuns({ repo: 'dono/repo', token: 't', agora: AGORA, pedir: buscar });
  assert.equal(runs.length, 250);
  assert.equal(chamadas.length, 3);
  assert.equal(agregar(runs, { agora: AGORA })[0].runs, 250);
});

test('coletarRuns: para na página que atravessa o fim da janela', async () => {
  // 1 run por hora: a janela de 7 dias tem 168; a 2ª página já sai da janela.
  const { buscar, chamadas } = apiDeRuns(1000, { passoMs: 3600_000 });
  const runs = await coletarRuns({ repo: 'dono/repo', token: 't', agora: AGORA, pedir: buscar });
  assert.equal(chamadas.length, 2);
  assert.equal(runsNaJanela(runs, { agora: AGORA }).length, 169);
});

test('coletarRuns: repositório sem runs e resposta sem workflow_runs', async () => {
  assert.deepEqual(await coletarRuns({ repo: 'r', token: 't', agora: AGORA, pedir: async () => ({ workflow_runs: [] }) }), []);
  assert.deepEqual(await coletarRuns({ repo: 'r', token: 't', agora: AGORA, pedir: async () => ({}) }), []);
});

test('coletarRuns: avisa quando o teto de páginas corta runs da janela — e só nesse caso', async () => {
  const cheio = apiDeRuns(1000);
  const cortado = await capturarStderr(() => coletarRuns({ repo: 'r', token: 't', agora: AGORA, maxPaginas: 3, pedir: cheio.buscar }));
  assert.equal(cortado.valor.length, 300);
  assert.equal(cortado.linhas.length, 1);
  assert.match(cortado.linhas[0], /^::warning::paginacao de runs parou no teto de 3 paginas/);

  const exato = apiDeRuns(250);
  const completo = await capturarStderr(() => coletarRuns({ repo: 'r', token: 't', agora: AGORA, maxPaginas: 3, pedir: exato.buscar }));
  assert.equal(completo.valor.length, 250);
  assert.deepEqual(completo.linhas, []);
});

test('coletarRuns: erro da API sobe (o KPI não inventa número)', async () => {
  await assert.rejects(coletarRuns({ repo: 'r', token: 't', pedir: async () => { throw new Error('GET x -> 403'); } }), /403/);
});

test('coletarJobs: pagina os jobs de cada run e preenche workflow_name', async () => {
  const chamadas = [];
  const buscar = async (caminho) => {
    chamadas.push(caminho);
    const pagina = Number(new URL(`http://x${caminho}`).searchParams.get('page'));
    if (caminho.includes('/runs/1/')) return { jobs: Array.from({ length: pagina === 1 ? 100 : 50 }, (_, i) => ({ name: `j${pagina}-${i}` })) };
    return { jobs: [{ name: 'unico', workflow_name: 'Vem da API' }] };
  };
  const jobs = await coletarJobs([{ id: 1, name: 'CI' }, { run_id: 2, name: 'Outro' }, { name: 'sem id' }], { repo: 'dono/repo', token: 't', pedir: buscar });
  assert.equal(jobs.length, 151);
  assert.equal(jobs[0].workflow_name, 'CI');
  assert.equal(jobs[150].workflow_name, 'Vem da API');
  assert.deepEqual(chamadas, [
    '/repos/dono/repo/actions/runs/1/jobs?per_page=100&page=1',
    '/repos/dono/repo/actions/runs/1/jobs?per_page=100&page=2',
    '/repos/dono/repo/actions/runs/2/jobs?per_page=100&page=1',
  ]);
});

test('coletarJobs: lista vazia ou nula não chama a API', async () => {
  const buscar = async () => { throw new Error('não era para chamar'); };
  assert.deepEqual(await coletarJobs([], { repo: 'r', token: 't', pedir: buscar }), []);
  assert.deepEqual(await coletarJobs(null, { repo: 'r', token: 't', pedir: buscar }), []);
});

test('coletarJobs: run apagado (404) não derruba a coleta — segue com os outros e avisa', async () => {
  const falhas = [];
  const buscar = async (caminho) => {
    if (caminho.includes('/runs/2/')) throw new Error('GET /x -> 404 (Not Found)');
    return { jobs: [{ name: 'ok' }] };
  };
  const { valor, linhas } = await capturarStderr(() => coletarJobs([{ id: 1 }, { id: 2 }, { id: 3 }], { repo: 'r', token: 't', pedir: buscar, aoFalhar: (r) => falhas.push(r.id) }));
  assert.equal(valor.length, 2);
  assert.deepEqual(falhas, [2]);
  assert.match(linhas[0], /^::warning::jobs do run 2 indisponiveis \(GET \/x -> 404 \(Not Found\)\)/);
});

test('coletarJobs: API fora do ar — desiste depois de 3 runs seguidos, sem gastar tempo com os demais', async () => {
  const consultados = [];
  const falhas = [];
  const buscar = async (caminho) => {
    consultados.push(Number(caminho.match(/runs\/(\d+)\//)[1]));
    throw new Error('GET /x -> sem resposta (TimeoutError: timeout)');
  };
  const runs = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
  const { valor, linhas } = await capturarStderr(() => coletarJobs(runs, { repo: 'r', token: 't', pedir: buscar, aoFalhar: (r) => falhas.push(r.id) }));
  assert.deepEqual(valor, []);
  assert.deepEqual(consultados, [1, 2, 3]);
  assert.equal(falhas.length, 50);
  assert.match(linhas.at(-1), /^::warning::3 runs seguidos sem jobs; os runs restantes nao serao consultados$/);
});

test('coletarJobs: falha isolada não aciona a desistência (o contador zera a cada sucesso)', async () => {
  const consultados = [];
  const buscar = async (caminho) => {
    const id = Number(caminho.match(/runs\/(\d+)\//)[1]);
    consultados.push(id);
    if (id % 2 === 0) throw new Error('GET /x -> 404 (Not Found)');
    return { jobs: [{ name: `j${id}` }] };
  };
  const { valor } = await capturarStderr(() => coletarJobs(Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })), { repo: 'r', token: 't', pedir: buscar }));
  assert.equal(consultados.length, 10);
  assert.equal(valor.length, 5);
});

// ------------------------------------------------------------------ pedir e publicarIssue (fetch trocado)
async function comFetch(impl, fn) {
  const original = globalThis.fetch;
  const chamadas = [];
  globalThis.fetch = async (url, init = {}) => {
    chamadas.push({ url: String(url), metodo: init.method, headers: init.headers, corpo: init.body ? JSON.parse(init.body) : undefined });
    return impl(chamadas.length, String(url), init);
  };
  try { return { valor: await fn(), chamadas }; } finally { globalThis.fetch = original; }
}
const json = (corpo, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } });
const RAPIDO = { delaysMs: [1] };

test('pedir: manda token, versão da API e devolve o JSON', async () => {
  const { valor, chamadas } = await comFetch(() => json({ ok: 1 }), () => pedir('/repos/a/b/issues', 'tok-123'));
  assert.deepEqual(valor, { ok: 1 });
  assert.equal(chamadas[0].url, 'https://api.github.com/repos/a/b/issues');
  assert.equal(chamadas[0].metodo, 'GET');
  assert.equal(chamadas[0].headers.Authorization, 'Bearer tok-123');
  assert.equal(chamadas[0].headers.Accept, 'application/vnd.github+json');
  assert.equal(chamadas[0].headers['X-GitHub-Api-Version'], '2022-11-28');
});

test('pedir: 502/503/504 são repetidos até dar certo', async () => {
  for (const status of [502, 503, 504]) {
    const { valor, chamadas } = await comFetch((n) => (n < 3 ? json({}, status) : json({ ok: 1 })), () => pedir('/x', 't', RAPIDO));
    assert.deepEqual(valor, { ok: 1 });
    assert.equal(chamadas.length, 3, String(status));
  }
});

test('pedir: 5xx que não passa desiste depois das tentativas, com o status na mensagem', async () => {
  const { valor, chamadas } = await comFetch(() => json({ message: 'Server Error' }, 503), () => pedir('/x', 't', { ...RAPIDO, tentativas: 3 }).catch((e) => e.message));
  assert.equal(valor, 'GET /x -> 503 (Server Error)');
  assert.equal(chamadas.length, 3);
});

test('pedir: 401, 403, 404, 409, 422, 429 e 500 não são repetidos e trazem a mensagem da API', async () => {
  const casos = { 401: 'Bad credentials', 403: 'Resource not accessible by integration', 404: 'Not Found', 409: 'Conflict', 422: 'Validation Failed', 429: 'API rate limit exceeded', 500: 'Server Error' };
  for (const [status, mensagem] of Object.entries(casos)) {
    const { valor, chamadas } = await comFetch(() => json({ message: mensagem }, Number(status)), () => pedir('/x', 't', RAPIDO).catch((e) => e.message));
    assert.equal(valor, `GET /x -> ${status} (${mensagem})`);
    assert.equal(chamadas.length, 1, status);
  }
});

test('pedir: erro com corpo que não é JSON ainda informa o status', async () => {
  const { valor } = await comFetch(() => new Response('<html>', { status: 404 }), () => pedir('/x', 't', RAPIDO).catch((e) => e.message));
  assert.equal(valor, 'GET /x -> 404');
});

test('pedir: queda de rede em GET é repetida; em POST não (repetir criaria a issue duas vezes)', async () => {
  const cai = () => { throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } }); };
  const get = await comFetch((n) => (n < 3 ? cai() : json({ ok: 1 })), () => pedir('/x', 't', RAPIDO));
  assert.deepEqual(get.valor, { ok: 1 });
  assert.equal(get.chamadas.length, 3);
  const post = await comFetch(cai, () => pedir('/x', 't', { ...RAPIDO, metodo: 'POST', corpo: { a: 1 } }).catch((e) => e.message));
  assert.equal(post.valor, 'POST /x -> sem resposta (ECONNRESET: fetch failed)');
  assert.equal(post.chamadas.length, 1);
});

test('pedir: API que não responde estoura o tempo em vez de pendurar o job', async () => {
  const pendura = (n, url, init) => new Promise((_, rejeitar) => init.signal.addEventListener('abort', () => rejeitar(init.signal.reason)));
  const inicio = Date.now();
  const { valor, chamadas } = await comFetch(pendura, () => pedir('/x', 't', { ...RAPIDO, tentativas: 2, timeoutMs: 50 }).catch((e) => e.message));
  assert.match(valor, /^GET \/x -> sem resposta \(TimeoutError/);
  assert.equal(chamadas.length, 2);
  assert.ok(Date.now() - inicio < 5000);
});

test('pedir: POST manda o corpo em JSON com Content-Type', async () => {
  const { chamadas } = await comFetch(() => json({ number: 1 }, 201), () => pedir('/x', 't', { metodo: 'POST', corpo: { title: 'ação' } }));
  assert.deepEqual(chamadas[0].corpo, { title: 'ação' });
  assert.equal(chamadas[0].headers['Content-Type'], 'application/json');
});

test('publicarIssue: sem issue aberta cria uma, com a etiqueta', async () => {
  const { valor, chamadas } = await comFetch((n) => (n === 1 ? json([]) : json({ number: 42 }, 201)), () => publicarIssue({ repo: 'a/b', token: 't', marca: '[kpi-actions] Semana de 2026-11-09', corpo: 'C' }));
  assert.deepEqual(valor, { acao: 'criada', numero: 42 });
  assert.equal(chamadas[0].url, 'https://api.github.com/repos/a/b/issues?state=open&labels=kpi-actions&per_page=10');
  assert.equal(chamadas[1].metodo, 'POST');
  assert.deepEqual(chamadas[1].corpo, { title: '[kpi-actions] Semana de 2026-11-09', body: 'C', labels: ['kpi-actions'] });
});

test('publicarIssue: com issue aberta atualiza título e corpo — rodar de novo não empilha', async () => {
  const abertas = [{ number: 5, title: 'outra coisa' }, { number: 6, title: '[kpi-actions] PR', pull_request: {} }, { number: 7, title: '[kpi-actions] Semana de 2026-11-02' }];
  const { valor, chamadas } = await comFetch((n) => (n === 1 ? json(abertas) : json({ number: 7 })), () => publicarIssue({ repo: 'a/b', token: 't', marca: 'M', corpo: 'C' }));
  assert.deepEqual(valor, { acao: 'atualizada', numero: 7 });
  assert.equal(chamadas.length, 2);
  assert.equal(chamadas[1].metodo, 'PATCH');
  assert.equal(chamadas[1].url, 'https://api.github.com/repos/a/b/issues/7');
  assert.deepEqual(chamadas[1].corpo, { title: 'M', body: 'C' });
});

test('publicarIssue: só PR ou issue de outro assunto com a etiqueta = cria a issue do KPI', async () => {
  const abertas = [{ number: 6, title: '[kpi-actions] é uma PR', pull_request: {} }, { number: 8, title: 'sem prefixo' }];
  const { valor } = await comFetch((n) => (n === 1 ? json(abertas) : json({ number: 9 }, 201)), () => publicarIssue({ repo: 'a/b', token: 't', marca: 'M', corpo: 'C' }));
  assert.deepEqual(valor, { acao: 'criada', numero: 9 });
});

test('publicarIssue: sem permissão de escrita (403) o erro sobe com a mensagem da API', async () => {
  await assert.rejects(
    comFetch((n) => (n === 1 ? json([]) : json({ message: 'Resource not accessible by integration' }, 403)), () => publicarIssue({ repo: 'a/b', token: 't', marca: 'M', corpo: 'C' })),
    /POST \/repos\/a\/b\/issues -> 403 \(Resource not accessible by integration\)/,
  );
});

// ------------------------------------------------------------------ CLI contra servidor local
let servidor;
let base;
let responder = () => ({ status: 404, corpo: { message: 'Not Found' } });
let pedidos = [];

before(async () => {
  servidor = http.createServer((req, res) => {
    let dados = '';
    req.on('data', (d) => { dados += d; });
    req.on('end', () => {
      const pedido = { metodo: req.method, url: req.url, auth: req.headers.authorization, corpo: dados ? JSON.parse(dados) : undefined };
      pedidos.push(pedido);
      const { status = 200, corpo = {} } = responder(pedido);
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(typeof corpo === 'string' ? corpo : JSON.stringify(corpo));
    });
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => new Promise((ok) => servidor.close(ok)));

function api({ runs = [], jobs = () => [], issues = [], novaIssue = 77, sobrepor = () => null } = {}) {
  return (pedido) => {
    const especial = sobrepor(pedido);
    if (especial) return especial;
    const url = new URL(pedido.url, base);
    if (pedido.metodo === 'GET' && url.pathname === '/repos/dono/repo/actions/runs') {
      const pagina = Number(url.searchParams.get('page'));
      return { corpo: { workflow_runs: runs.slice((pagina - 1) * 100, pagina * 100) } };
    }
    const mJobs = url.pathname.match(/^\/repos\/dono\/repo\/actions\/runs\/(\d+)\/jobs$/);
    if (pedido.metodo === 'GET' && mJobs) return { corpo: { jobs: jobs(Number(mJobs[1])) } };
    if (pedido.metodo === 'GET' && url.pathname === '/repos/dono/repo/issues') return { corpo: issues };
    if (pedido.metodo === 'POST' && url.pathname === '/repos/dono/repo/issues') return { status: 201, corpo: { number: novaIssue } };
    if (pedido.metodo === 'PATCH' && /^\/repos\/dono\/repo\/issues\/\d+$/.test(url.pathname)) return { corpo: { number: Number(url.pathname.split('/').pop()) } };
    return { status: 404, corpo: { message: 'Not Found' } };
  };
}

function cli({ env = {}, script = SCRIPT, cwd } = {}) {
  pedidos = [];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kpi-'));
  temporarios.push(dir);
  const resumo = path.join(dir, 'summary.md');
  return new Promise((ok) => {
    execFile(process.execPath, [script], {
      encoding: 'utf8',
      cwd,
      env: { PATH: '', GITHUB_API_URL: base, GITHUB_REPOSITORY: 'dono/repo', GH_TOKEN: 'tok-de-teste', JANELA_DIAS: '7', GITHUB_STEP_SUMMARY: resumo, ...env },
    }, (erro, stdout, stderr) => {
      ok({ status: erro ? erro.code : 0, stdout, stderr, resumo: fs.existsSync(resumo) ? fs.readFileSync(resumo, 'utf8') : '', pedidos: [...pedidos] });
    });
  });
}
const agoraReal = () => Date.now();
const runReal = (id, opcoes = {}) => run(id, { agora: agoraReal(), ...opcoes });

test('cli: sem token ou sem repositório sai com 2 e não chama a API', async () => {
  for (const env of [{ GH_TOKEN: '', GITHUB_TOKEN: '' }, { GITHUB_REPOSITORY: '' }]) {
    const r = await cli({ env });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /::error::GITHUB_REPOSITORY e GH_TOKEN sao obrigatorios/);
    assert.deepEqual(r.pedidos, []);
  }
});

test('cli: aceita GITHUB_TOKEN quando não há GH_TOKEN', async () => {
  responder = api();
  const r = await cli({ env: { GH_TOKEN: '', GITHUB_TOKEN: 'outro-token' } });
  assert.equal(r.status, 0);
  assert.equal(r.pedidos[0].auth, 'Bearer outro-token');
});

test('cli: JANELA_DIAS inválido sai com 2 antes de qualquer chamada', async () => {
  responder = api();
  for (const valor of ['abc', '0', '-7', 'NaN', 'Infinity']) {
    const r = await cli({ env: { JANELA_DIAS: valor } });
    assert.equal(r.status, 2, valor);
    assert.match(r.stderr, /::error::JANELA_DIAS invalido/);
    assert.deepEqual(r.pedidos, []);
  }
});

test('cli: JANELA_DIAS vazio ou ausente usa 7 dias', async () => {
  responder = api({ runs: [runReal(1)] });
  for (const env of [{ JANELA_DIAS: '' }, { JANELA_DIAS: undefined }]) {
    const r = await cli({ env });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /^## KPI do GitHub Actions — 7 dias\n/);
  }
});

test('cli: caminho feliz — imprime, grava o Job Summary e cria a issue', async () => {
  responder = api({
    runs: [runReal(1, { minutos: 10 }), runReal(2, { conclusion: 'failure', minutos: 5 }), runReal(3, { nome: 'Deploy', haMs: 9 * DIA })],
    jobs: (id) => [{ name: `job-${id}`, started_at: '2026-11-09T10:00:00Z', completed_at: `2026-11-09T10:0${id}:00Z` }],
  });
  const r = await cli();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\| CI \| 2 \| 0 \| 0% \| 1 \| 50% \| 15 \|/);
  assert.ok(!r.stdout.includes('Deploy'), 'run de 9 dias atrás está fora da janela de 7');
  assert.match(r.stdout, /\| job-2 \| CI \| 2 \|\n\| job-1 \| CI \| 1 \|/);
  assert.match(r.stdout, /\nissue criada: #77\n$/);
  assert.equal(r.resumo, `${r.stdout.split('\nissue criada')[0]}\n`);
  const post = r.pedidos.find((p) => p.metodo === 'POST');
  assert.equal(post.url, '/repos/dono/repo/issues');
  assert.match(post.corpo.title, /^\[kpi-actions\] Semana de \d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(post.corpo.labels, ['kpi-actions']);
  assert.equal(post.corpo.body, r.resumo.trimEnd());
  assert.ok(r.pedidos.every((p) => p.auth === 'Bearer tok-de-teste'));
  assert.ok(!`${r.stdout}${r.stderr}${r.resumo}`.includes('tok-de-teste'), 'o token não pode aparecer em saída nenhuma');
});

test('cli: segunda execução atualiza a issue existente (PATCH), não cria outra', async () => {
  responder = api({ runs: [runReal(1)], issues: [{ number: 12, title: '[kpi-actions] Semana de 2026-11-02' }] });
  const r = await cli();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /issue atualizada: #12\n$/);
  assert.deepEqual(r.pedidos.filter((p) => p.metodo !== 'GET').map((p) => `${p.metodo} ${p.url}`), ['PATCH /repos/dono/repo/issues/12']);
});

test('cli: repositório sem nenhum run publica a tabela zerada', async () => {
  responder = api();
  const r = await cli();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Total: \*\*0\*\* runs, \*\*0\*\* minutos\.\n\n_nenhum job registrado na janela_\n/);
});

test('cli: 250 runs — pagina a listagem, busca jobs só dos 50 mais longos e diz isso', async () => {
  // Os 50 mais antigos (ids 201..250) são os longos: a amostra tem de ser eles, não os 50 mais recentes.
  responder = api({ runs: Array.from({ length: 250 }, (_, i) => runReal(i + 1, { haMs: (i + 1) * 30 * MIN, minutos: i >= 200 ? 20 : 1 })), jobs: () => [] });
  const r = await cli();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\| CI \| 250 \|/);
  assert.equal(r.pedidos.filter((p) => p.url.includes('/actions/runs?')).length, 3);
  assert.deepEqual(r.pedidos.filter((p) => p.url.includes('/jobs?')).map((p) => Number(p.url.match(/runs\/(\d+)\/jobs/)[1])), Array.from({ length: 50 }, (_, i) => i + 201));
  assert.match(r.stdout, /_Ranking de jobs calculado sobre 50 dos 250 runs da janela/);
});

test('cli: 401/403/404 na listagem de runs — exit 1, erro com a mensagem da API, nenhuma issue', async () => {
  for (const [status, message] of [[401, 'Bad credentials'], [403, 'Resource not accessible by integration'], [404, 'Not Found']]) {
    responder = api({ sobrepor: (p) => (p.url.includes('/actions/runs?') ? { status, corpo: { message } } : null) });
    const r = await cli();
    assert.equal(r.status, 1);
    assert.equal(r.stderr, `::error::GET /repos/dono/repo/actions/runs?per_page=100&page=1 -> ${status} (${message})\n`);
    assert.equal(r.resumo, '');
    assert.ok(r.pedidos.every((p) => p.metodo === 'GET'));
  }
});

test('cli: jobs de um run com 404 — segue, avisa e desconta o run da amostra', async () => {
  responder = api({
    runs: [runReal(1), runReal(2), runReal(3)],
    jobs: () => [{ name: 'j', started_at: '2026-11-09T10:00:00Z', completed_at: '2026-11-09T10:01:00Z' }],
    sobrepor: (p) => (p.url.includes('/runs/2/jobs') ? { status: 404, corpo: { message: 'Not Found' } } : null),
  });
  const r = await cli();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /::warning::jobs do run 2 indisponiveis/);
  assert.match(r.stdout, /_Ranking de jobs calculado sobre 2 dos 3 runs da janela/);
  assert.match(r.stdout, /issue criada: #77/);
});

test('cli: sem permissão para escrever issue (403) — exit 1 depois de imprimir o KPI', async () => {
  responder = api({ runs: [runReal(1)], sobrepor: (p) => (p.metodo === 'POST' ? { status: 403, corpo: { message: 'Resource not accessible by integration' } } : null) });
  const r = await cli();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^## KPI do GitHub Actions — 7 dias/);
  assert.match(r.stderr, /::error::POST \/repos\/dono\/repo\/issues -> 403 \(Resource not accessible by integration\)/);
});

test('cli: resposta 200 que não é JSON — exit 1 com ::error::', async () => {
  responder = () => ({ status: 200, corpo: '<html>manutenção</html>' });
  const r = await cli();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^::error::/);
});

test('cli: roda por link simbólico, em caminho com espaço e acento, e de outro cwd', async () => {
  responder = api({ runs: [runReal(1)] });
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'kpi com espaço ação '));
  temporarios.push(pasta);
  fs.cpSync(path.resolve(path.dirname(SCRIPT), '..', 'lib'), path.join(pasta, 'scripts', 'lib'), { recursive: true });
  fs.mkdirSync(path.join(pasta, 'scripts', 'ci'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(pasta, 'scripts', 'ci', 'actions-kpi.mjs'));
  fs.symlinkSync(pasta, `${pasta}-link`);
  temporarios.push(`${pasta}-link`);
  for (const opcoes of [{ script: path.join(pasta, 'scripts', 'ci', 'actions-kpi.mjs') }, { script: path.join(`${pasta}-link`, 'scripts', 'ci', 'actions-kpi.mjs') }, { cwd: os.tmpdir() }]) {
    const r = await cli(opcoes);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /issue criada: #77/);
  }
});
