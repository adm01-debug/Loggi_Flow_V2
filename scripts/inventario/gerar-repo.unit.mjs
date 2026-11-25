// Teste de scripts/inventario/gerar-repo.mjs. O script e uma CLI com efeito no topo do modulo e
// calcula a raiz a partir do proprio caminho: cada caso monta um repo sintetico em pasta temporaria,
// copia o script para scripts/inventario/ dessa pasta e o roda como subprocesso. Offline; precisa
// do ripgrep (rg) no PATH, como o proprio script (sem ele os casos que dependem de rg sao pulados).
// Rodar: node --test scripts/inventario/gerar-repo.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'gerar-repo.mjs');
const temRg = spawnSync('rg', ['--version']).status === 0;

const ARQUIVOS = {
  // edges
  'supabase/functions/health/index.ts': 'import { cors } from "../_shared/cors.ts";\nDeno.serve(() => new Response(Deno.env.get("HEALTH_KEY")));\n',
  'supabase/functions/health/index_test.ts': 'Deno.env.get("SO_DO_TESTE");\nfetch(`${u}/functions/v1/health`);\nfetch(`${u}/functions/v1/health-check`);\n',
  'supabase/functions/health-check/index.ts': 'import { exigirInterno } from "../_shared/auth.ts";\nimport { local } from "./local.ts";\nDeno.env.get("SUPABASE_URL");\nDeno.env.get( \'SUPABASE_URL\' );\n',
  'supabase/functions/health-check/local.ts': 'export const local = Deno.env.get("LOCAL_KEY");\n',
  'supabase/functions/predict-delays/index.ts': 'export {};\n',
  'supabase/functions/predict-delays-scheduled/index.ts': 'await supabase.functions.invoke("predict-delays");\n',
  'supabase/functions/sem-chamador/index.ts': 'const dinamico = Deno.env.get(nome);\n',
  'supabase/functions/a.b/index.ts': 'export {};\n',
  'supabase/functions/so-pasta/README.md': 'pasta sem index.ts nao e edge\n',
  'supabase/functions/_shared/cors.ts': 'export const cors = Deno.env.get("ALLOWED_ORIGINS");\n',
  'supabase/functions/_shared/auth.ts': 'import { cors } from "./cors.ts";\nimport "./auth.ts";\nexport const exigirInterno = () => Deno.env.get("INTERNAL_FN_SECRET");\n',
  'supabase/functions/import_map.json': '{}\n',
  'supabase/config.toml': 'project_id = "x"\n[functions.health-check]\nverify_jwt = false\n[functions.predict-delays-scheduled]\nverify_jwt = false\n',
  // chamadores
  'src/hooks/useSaude.ts': 'export const f = () => supabase.functions.invoke(\n  "health-check", {});\nconst t = supabase.from("coletas").select();\nconst u = supabase.from(\'coletas\');\n',
  'src/lib/edge.ts': 'export const g = () => chamar(\'predict-delays\', {});\nfetch(`${base}/functions/v1/aXb`);\nsupabase.from("entregas");\n',
  'src/integrations/supabase/types.ts': 'export type Database = {\n  public: {\n    Tables: {\n      coletas: {\n        Row: {}\n      }\n    }\n  }\n}\n',
  'supabase/migrations/20260101000000_cron.sql': "select net.http_post(url := base || '/functions/v1/predict-delays-scheduled');\n",
  'tests/e2e/saude.spec.ts': 'await page.request.get("/functions/v1/health-check");\n',
  '.github/workflows/deploy.yml': 'run: supabase functions deploy predict-delays-scheduled\n',
};

function montar(t, { nome = 'inv-repo-', omitir = [] } = {}) {
  const raiz = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), nome)));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  for (const [rel, texto] of Object.entries(ARQUIVOS)) {
    if (omitir.some((prefixo) => rel.startsWith(prefixo))) continue;
    fs.mkdirSync(path.dirname(path.join(raiz, rel)), { recursive: true });
    fs.writeFileSync(path.join(raiz, rel), texto);
  }
  fs.mkdirSync(path.join(raiz, 'scripts/inventario'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(raiz, 'scripts/inventario/gerar-repo.mjs'));
  const script = path.join(raiz, 'scripts/inventario/gerar-repo.mjs');
  // stdio 'ignore' no stdin = /dev/null, como o `< /dev/null` do workflow.
  const rodar = (opcoes = {}, args = []) => spawnSync(process.execPath, [script, ...args], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opcoes });
  const lerJson = (rel) => JSON.parse(fs.readFileSync(path.join(raiz, 'inventario/estado', rel), 'utf8'));
  return { raiz, script, rodar, lerJson };
}

test('edges.json: total, linhas, segredos (index.ts + imports locais, sem teste) e chamadores', { skip: !temRg }, (t) => {
  const r = montar(t);
  const saida = r.rodar();
  assert.equal(saida.status, 0, saida.stderr);
  assert.match(saida.stdout, /^edges: 6 \| sem chamador no repo \(src\/migrations\/edges\): 3\n/);
  const inv = r.lerJson('edges.json');
  assert.equal(inv.total, 6);
  assert.ok(!Number.isNaN(Date.parse(inv.gerado_em)));
  assert.deepEqual(Object.keys(inv.edge_functions), ['a.b', 'health', 'health-check', 'predict-delays', 'predict-delays-scheduled', 'sem-chamador'],
    '_shared, pasta sem index.ts e arquivo solto ficam de fora');
  const e = inv.edge_functions;
  assert.equal(e.health.linhas, 3);
  assert.deepEqual(e.health.segredos_lidos, ['ALLOWED_ORIGINS', 'HEALTH_KEY'], 'segue ../_shared/cors.ts; index_test.ts nao conta');
  assert.deepEqual(e['health-check'].segredos_lidos, ['ALLOWED_ORIGINS', 'INTERNAL_FN_SECRET', 'LOCAL_KEY', 'SUPABASE_URL'],
    'transitivo (auth.ts -> cors.ts), arquivo irmao, sem repeticao e sem laco no import circular');
  assert.deepEqual(e['sem-chamador'].segredos_lidos, [], 'Deno.env.get(variavel) nao e resolvido');
  assert.deepEqual(e['health-check'].chamada_em, { src: 1, migrations: 0, outras_edges: 1, e2e: 1, ci_config: 1 });
  assert.deepEqual(e['predict-delays-scheduled'].chamada_em, { src: 0, migrations: 1, outras_edges: 0, e2e: 0, ci_config: 2 });
  assert.equal(e['sem-chamador'].sem_chamador, true);
  assert.equal(e['health-check'].sem_chamador, false);
  assert.deepEqual(inv.sem_chamador_no_repo, ['a.b', 'health', 'sem-chamador']);
  assert.ok(!fs.existsSync(path.join(r.raiz, 'inventario/estado/tabelas-uso.json')), 'sem lista no stdin nao gera tabelas-uso.json');
});

test('nome de edge que e prefixo de outra nao herda os chamadores dela (health x health-check)', { skip: !temRg }, (t) => {
  const r = montar(t);
  assert.equal(r.rodar().status, 0);
  const e = r.lerJson('edges.json').edge_functions;
  // Antes: health saia com outras_edges 1, e2e 1 e ci_config 1 por causa de "health-check".
  assert.deepEqual(e.health.chamada_em, { src: 0, migrations: 0, outras_edges: 0, e2e: 0, ci_config: 0 });
  assert.equal(e.health.sem_chamador, true);
  // Antes: predict-delays "aparecia" na migration e no workflow que so citam predict-delays-scheduled.
  assert.deepEqual(e['predict-delays'].chamada_em, { src: 1, migrations: 0, outras_edges: 1, e2e: 0, ci_config: 0 });
  // O ponto de "a.b" e literal: /functions/v1/aXb nao e chamada dela.
  assert.deepEqual(e['a.b'].chamada_em, { src: 0, migrations: 0, outras_edges: 0, e2e: 0, ci_config: 0 });
});

test('pasta opcional ausente (tests/e2e, .github/workflows, migrations, src, config.toml) nao derruba o inventario', { skip: !temRg }, (t) => {
  const r = montar(t, { omitir: ['tests/', '.github/', 'supabase/migrations/', 'src/', 'supabase/config.toml'] });
  const saida = r.rodar();
  assert.equal(saida.status, 0, saida.stderr);
  const e = r.lerJson('edges.json').edge_functions;
  assert.deepEqual(e['health-check'].chamada_em, { src: 0, migrations: 0, outras_edges: 1, e2e: 0, ci_config: 0 });
});

test('raiz do repo com espaco, acento, parenteses e colchetes', { skip: !temRg }, (t) => {
  const r = montar(t, { nome: 'inv repo ação (1) [x] ' });
  const saida = r.rodar();
  assert.equal(saida.status, 0, saida.stderr);
  assert.equal(r.lerJson('edges.json').total, 6);
  assert.deepEqual(r.lerJson('edges.json').edge_functions['health-check'].chamada_em, { src: 1, migrations: 0, outras_edges: 1, e2e: 1, ci_config: 1 });
  // Antes a raiz vinha percent-encoded e o mkdir criava uma pasta irma "inv%20repo%20a%C3%A7...".
  const irmas = fs.readdirSync(path.dirname(r.raiz)).filter((n) => n.includes('%20') && n.startsWith('inv%20repo'));
  assert.deepEqual(irmas, []);
});

test('rodado de outro cwd grava na raiz do repo, nao no cwd', { skip: !temRg }, (t) => {
  const r = montar(t);
  const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-cwd-'));
  t.after(() => fs.rmSync(fora, { recursive: true, force: true }));
  assert.equal(r.rodar({ cwd: fora }).status, 0);
  assert.deepEqual(fs.readdirSync(fora), []);
  assert.equal(r.lerJson('edges.json').total, 6);
});

test('duas execucoes dao o mesmo conteudo (so gerado_em muda)', { skip: !temRg }, (t) => {
  const r = montar(t);
  const semData = () => { const inv = r.lerJson('edges.json'); delete inv.gerado_em; return inv; };
  r.rodar();
  const um = semData();
  r.rodar();
  assert.deepEqual(semData(), um);
});

test('lista de tabelas no stdin gera tabelas-uso.json (CRLF, linha em branco, nome com espaco/acento/regex)', { skip: !temRg }, (t) => {
  const r = montar(t);
  fs.appendFileSync(path.join(r.raiz, 'src/lib/edge.ts'), 'supabase.from("Tabela Estranha (ação) [x]");\n');
  const saida = r.rodar({ stdio: ['pipe', 'pipe', 'pipe'], input: 'coletas\r\n\r\n  entregas  \nfantasma\ncol.tas\nTabela Estranha (ação) [x]\n' });
  assert.equal(saida.status, 0, saida.stderr);
  assert.match(saida.stdout, /tabelas: 5 \| sem \.from\(\) em src nem edges: 2\n$/);
  const uso = r.lerJson('tabelas-uso.json');
  assert.deepEqual(uso.tabelas, {
    coletas: { from_src: 2, from_edges: 0, em_types_ts: true },
    entregas: { from_src: 1, from_edges: 0, em_types_ts: false },
    fantasma: { from_src: 0, from_edges: 0, em_types_ts: false },
    'col.tas': { from_src: 0, from_edges: 0, em_types_ts: false },
    // Um nome por linha: espaco, acento, parenteses e colchetes fazem parte do nome.
    'Tabela Estranha (ação) [x]': { from_src: 1, from_edges: 0, em_types_ts: false },
  });
  assert.deepEqual(uso.sem_from_em_src_nem_edges, ['fantasma', 'col.tas']);
});

test('stdin vazio ou fechado: so o edges.json, exit 0', { skip: !temRg }, async (t) => {
  await t.test('pipe que fecha sem dados', () => {
    const r = montar(t);
    const saida = r.rodar({ stdio: ['pipe', 'pipe', 'pipe'], input: '' });
    assert.equal(saida.status, 0, saida.stderr);
    assert.ok(!fs.existsSync(path.join(r.raiz, 'inventario/estado/tabelas-uso.json')));
  });
  await t.test('stdin fechado (<&-)', () => {
    const r = montar(t);
    const saida = spawnSync('bash', ['-c', 'exec "$0" "$1" <&-', process.execPath, r.script], { cwd: r.raiz, encoding: 'utf8' });
    assert.equal(saida.status, 0, saida.stderr);
    assert.equal(r.lerJson('edges.json').total, 6);
  });
});

test('produtor lento no stdin: a lista chega inteira (antes: EAGAIN e exit 1)', { skip: !temRg }, async (t) => {
  const r = montar(t);
  const filho = spawn(process.execPath, [r.script], { cwd: r.raiz, stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  filho.stderr.on('data', (c) => { stderr += c; });
  const fim = new Promise((resolve) => { filho.on('close', resolve); });
  await new Promise((resolve) => { setTimeout(resolve, 700); });
  filho.stdin.end('coletas\n');
  assert.equal(await fim, 0, stderr);
  assert.deepEqual(Object.keys(r.lerJson('tabelas-uso.json').tabelas), ['coletas']);
});

test('contagens.json: edges, migrations e rotas com a data da coleta (etapa 257)', { skip: !temRg }, async (t) => {
  await t.test('sem rotas.json o numero de rotas e null, nao zero', () => {
    const r = montar(t);
    const saida = r.rodar();
    assert.equal(saida.status, 0);
    assert.match(saida.stdout, /contagens: edges 6 \| migrations 1 \| rotas n\/d\n$/);
    const c = r.lerJson('contagens.json');
    assert.match(c.coletado_em, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!Number.isNaN(Date.parse(c.gerado_em)));
    assert.equal(c.edges, 6);
    assert.equal(c.migrations_no_repo, 1);
    assert.equal(c.rotas_no_app, null);
    assert.match(c.paridade_com_o_banco, /SUPABASE_ACCESS_TOKEN/);
  });
  await t.test('com rotas.json (gerar-rotas.mjs antes na CI) le resumo.urls', () => {
    const r = montar(t);
    fs.mkdirSync(path.join(r.raiz, 'inventario/estado'), { recursive: true });
    fs.writeFileSync(path.join(r.raiz, 'inventario/estado/rotas.json'), '{ "resumo": { "urls": 61 } }\n');
    assert.equal(r.rodar().status, 0);
    assert.equal(r.lerJson('contagens.json').rotas_no_app, 61);
  });
  await t.test('sem supabase/migrations o repo continua valido (0, nao erro)', () => {
    const r = montar(t, { omitir: ['supabase/migrations/'] });
    assert.equal(r.rodar().status, 0);
    assert.equal(r.lerJson('contagens.json').migrations_no_repo, 0);
  });
});

test('sem ripgrep falha fechado: exit != 0, mensagem clara e nenhum edges.json gravado', (t) => {
  const r = montar(t);
  const saida = r.rodar({ env: { ...process.env, PATH: path.join(r.raiz, 'sem-binarios') } });
  assert.notEqual(saida.status, 0);
  assert.match(saida.stderr, /ripgrep \(rg\) não encontrado/);
  assert.ok(!fs.existsSync(path.join(r.raiz, 'inventario/estado/edges.json')));
});

test('sem supabase/functions falha (exit != 0) em vez de gravar inventario vazio', (t) => {
  const r = montar(t, { omitir: ['supabase/functions/'] });
  const saida = r.rodar();
  assert.notEqual(saida.status, 0);
  assert.ok(!fs.existsSync(path.join(r.raiz, 'inventario/estado/edges.json')));
});

test('--help explica o uso e nao grava nada', (t) => {
  const r = montar(t);
  const saida = r.rodar({}, ['--help']);
  assert.equal(saida.status, 0);
  assert.match(saida.stdout, /^Uso: node scripts\/inventario\/gerar-repo\.mjs < \/dev\/null/);
  assert.ok(!fs.existsSync(path.join(r.raiz, 'inventario')));
});
