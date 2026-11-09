// Teste de scripts/inventario/gerar-banco.mjs (e do scripts/inventario/banco.sql):
//  - funcoes puras (extracao da resposta, conferencia de origem, uso no codigo, edges, alertas);
//  - a CLI como subprocesso numa copia do script dentro de um repo sintetico, com `--entrada` e
//    contra um servidor HTTP local que faz o papel da Management API (401/403/404/429/5xx, corpo
//    invalido, conexao derrubada, timeout);
//  - opcional: o banco.sql de verdade num Postgres descartavel. So roda com
//    INVENTARIO_PG_TEST_URL=postgres://superusuario@host:porta/banco_vazio (NUNCA producao: o teste
//    cria roles, schemas e tabelas de fixture) e `psql` no PATH; sem isso o caso e pulado.
// Offline, sem credencial; nada e escrito no repo.
// Rodar: node --test scripts/inventario/gerar-banco.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LEDGER_TOLERANCIA, LIMIARES, PARECE_CREDENCIAL, PROJETO_OFICIAL, compararEdges, conferirOrigem, contarUsoNoCodigo,
  edgesNoRepo, extrairInventario, montarInventario, rodaTodoDia, tabelasDeReferencia, versoesDoRepo,
} from './gerar-banco.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..', '..');
const TOKEN = 'token-de-teste-nao-e-segredo';

const TABELAS = ['audit_logs', 'clientes', 'coletas', 'entregas', 'fornecedores', 'orfa_vazia', 'profiles', 'so_no_banco', 'transportadoras', 'user_roles'];
const PARTICOES = ['audit_logs_y2026m10', 'audit_logs_y2026m11', 'audit_logs_y2026m12'];
const VERSOES = Array.from({ length: 30 }, (_, i) => `202601${String(i + 1).padStart(2, '0')}120000`);

const tabela = (nome, extra = {}) => ({
  nome, rls: true, rls_forcado: false, policies: 1, triggers: 0, linhas: 3, linhas_exatas: true, bytes: 8192, citada_no_banco: false, particao_de: null, ...extra,
});

/** Resposta do banco.sql coerente com o repo sintetico de `montar()`. */
function resposta(mexer = () => {}) {
  const dado = {
    format_version: 1,
    medido_em: '2026-11-09T12:00:00Z',
    resumo: { postgres: '17.6', tabelas_public: TABELAS.length + PARTICOES.length, ledger_registros: VERSOES.length, ledger_versao_max: VERSOES[VERSOES.length - 1], cron_jobs: 2 },
    tabelas: [
      ...TABELAS.map((nome) => tabela(nome, nome === 'orfa_vazia' || nome === 'so_no_banco' ? { linhas: 0 } : {})),
      ...PARTICOES.map((nome) => tabela(nome, { particao_de: 'audit_logs', linhas: nome.endsWith('m12') ? 0 : 5 })),
    ].sort((a, b) => (a.nome < b.nome ? -1 : 1)),
    cron: {
      config: { max_worker_processes: '8' },
      jobs: [
        { nome: 'predict-delays-every-30min', agenda: '*/30 * * * *', ativo: true, chama: ['net.http_post'], execucoes_24h: 48, falhas_24h: 0, execucoes_7d: 336, falhas_7d: 3, startup_timeout_7d: 0, taxa_falha_7d_pct: 0.9, ultima_falha: null, duracao_max_s_7d: 2 },
        { nome: 'cleanup-telemetry-daily', agenda: '0 3 * * *', ativo: true, chama: ['public.cleanup_telemetry'], execucoes_24h: 1, falhas_24h: 0, execucoes_7d: 7, falhas_7d: 0, startup_timeout_7d: 0, taxa_falha_7d_pct: 0, ultima_falha: null, duracao_max_s_7d: 1 },
      ],
      horas_paradas_7d: [],
      historico: { linhas: 343, mais_de_7_dias: 0, mais_antigo: '2026-11-02T12:00:00Z', bytes: 65536 },
    },
  };
  mexer(dado);
  return dado;
}

const TYPES = `export type Json = string | number | boolean | null

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
${[...TABELAS, ...PARTICOES].map((n) => `      ${n}: {\n        Row: {\n          id: string\n          metadata: {\n            x: number\n          }\n        }\n        Relationships: []\n      }`).join('\n')}
      "Tabela Estranha (ação)": {
        Row: {
          id: string
        }
      }
    }
    Views: {
      v_nao_e_tabela: {
        Row: {
          id: string | null
        }
      }
    }
    Functions: {
      has_role: {
        Args: { _role: string }
        Returns: boolean
      }
    }
  }
}
`;

/** Repo sintetico com uma copia do script e do banco.sql em scripts/inventario/. */
function montar(t, { nome = 'inv-banco-', sem = [], extras = {} } = {}) {
  const raiz = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), nome)));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  const arquivos = {
    'src/integrations/supabase/types.ts': TYPES,
    'src/hooks/useColetas.ts': 'supabase.from("coletas"); supabase.from(\'coletas\').select(); supabase.from(`clientes`);\nsupabase.storage.from("fornecedores"); fetch("/rest/v1/entregas?select=*"); fetch("/rest/v1/rpc/profiles");\nsupabase.from(variavel);\n',
    'src/hooks/useColetas.test.ts': 'supabase.from("orfa_vazia");\n',
    'src/__tests__/x.ts': 'supabase.from("orfa_vazia");\n',
    'src/node_modules/pacote/index.js': 'supabase.from("orfa_vazia");\n',
    'src/.oculto/x.ts': 'supabase.from("orfa_vazia");\n',
    'src/notas.md': 'supabase.from("orfa_vazia")\n',
    'supabase/functions/health/index.ts': 'supabase.from("user_roles"); supabase.from("coletas");\n',
    'supabase/functions/predict-delays/index.ts': 'export {};\n',
    'supabase/functions/_shared/auth.ts': 'supabase.from("profiles");\n',
    'supabase/functions/so-pasta/README.md': 'sem index.ts\n',
    'supabase/migrations/_superseded/20200101000000_velha.sql': 'select 1;\n',
    'supabase/migrations/README.md': 'nao e migration\n',
    ...Object.fromEntries(VERSOES.map((v) => [`supabase/migrations/${v}_m.sql`, 'select 1;\n'])),
    ...extras,
  };
  for (const [rel, texto] of Object.entries(arquivos)) {
    if (sem.includes(rel)) continue;
    fs.mkdirSync(path.dirname(path.join(raiz, rel)), { recursive: true });
    fs.writeFileSync(path.join(raiz, rel), texto);
  }
  fs.mkdirSync(path.join(raiz, 'scripts/inventario'), { recursive: true });
  for (const f of ['gerar-banco.mjs', 'banco.sql']) fs.copyFileSync(path.join(AQUI, f), path.join(raiz, 'scripts/inventario', f));
  const script = path.join(raiz, 'scripts/inventario/gerar-banco.mjs');
  const saida = path.join(raiz, 'inventario/estado/banco.json');
  const semRede = { SUPABASE_ACCESS_TOKEN: '', SUPABASE_API_URL: '', SUPABASE_PROJECT_REF: '', INVENTARIO_PERMITIR_OUTRO_PROJETO: '' };
  const rodar = (args = [], env = {}) => {
    const r = spawnSync(process.execPath, [script, ...args], { cwd: raiz, encoding: 'utf8', env: { ...process.env, ...semRede, ...env } });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  };
  const rodarAsync = (args = [], env = {}) => new Promise((resolve) => {
    execFile(process.execPath, [script, ...args], { cwd: raiz, encoding: 'utf8', env: { ...process.env, ...semRede, ...env } },
      (erro, stdout, stderr) => resolve({ status: erro ? erro.code : 0, stdout, stderr }));
  });
  const gravar = (rel, conteudo) => {
    const p = path.join(raiz, rel);
    fs.writeFileSync(p, typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo));
    return p;
  };
  return { raiz, saida, rodar, rodarAsync, gravar, lerSaida: () => JSON.parse(fs.readFileSync(saida, 'utf8')) };
}

// ---------- extrairInventario ----------

test('extrairInventario: aceita objeto direto, array, {rows}, envelope do MCP e JSON em texto', () => {
  const dado = resposta();
  const formas = {
    'objeto direto': dado,
    'texto (psql -At)': `${JSON.stringify(dado)}\n`,
    'Management API': [{ inventario: dado }],
    'MCP {rows}': { rows: [{ inventario: dado }] },
    'MCP com a coluna em texto': { rows: [{ inventario: JSON.stringify(dado) }] },
    'envelope tools/call': { result: { content: [{ type: 'text', text: JSON.stringify({ rows: [{ inventario: dado }] }) }] } },
    'envelope content': { content: [{ type: 'text', text: JSON.stringify([{ inventario: dado }]) }] },
  };
  for (const [nome, bruto] of Object.entries(formas)) assert.deepEqual(extrairInventario(bruto), dado, nome);
});

test('extrairInventario: recusa entrada vazia, que nao e JSON, sem chaves, de outra versao, sem tabelas ou com cron incompleto', () => {
  assert.throws(() => extrairInventario(''), /entrada vazia/);
  assert.throws(() => extrairInventario('  \n'), /entrada vazia/);
  assert.throws(() => extrairInventario('psql: error: connection refused'), /entrada nao e JSON valido/);
  assert.throws(() => extrairInventario('{}'), /entrada sem as chaves: format_version, medido_em, resumo, tabelas, cron/);
  assert.throws(() => extrairInventario([]), /entrada sem as chaves/);
  assert.throws(() => extrairInventario({ rows: [] }), /entrada sem as chaves/);
  assert.throws(() => extrairInventario(resposta((d) => { d.format_version = 2; })), /format_version 2 desconhecido/);
  assert.throws(() => extrairInventario(resposta((d) => { d.tabelas = []; })), /entrada sem tabelas/);
  assert.throws(() => extrairInventario(resposta((d) => { delete d.cron.jobs; })), /`cron` incompleto/);
  assert.throws(() => extrairInventario(resposta((d) => { d.cron.historico = null; })), /`cron` incompleto/);
  assert.throws(() => extrairInventario(resposta((d) => { d.cron = 'x'; })), /`cron` incompleto/);
});

// ---------- referencia e origem ----------

test('tabelasDeReferencia: sem schema-manifest.json usa o Tables do public em types.ts (antes: ENOENT e exit 2 sempre)', (t) => {
  const r = montar(t);
  const ref = tabelasDeReferencia(r.raiz);
  assert.equal(ref.fonte, 'src/integrations/supabase/types.ts');
  assert.deepEqual(ref.tabelas, [...TABELAS, ...PARTICOES, 'Tabela Estranha (ação)'], 'so tabelas do public: nem coluna aninhada, nem view, nem funcao, nem graphql_public');
});

test('tabelasDeReferencia: o manifesto do types-sync tem prioridade; chave entre aspas (format %I) perde as aspas', (t) => {
  const r = montar(t, { extras: { 'supabase/schema-manifest.json': JSON.stringify({ rls: { coletas: 'h1', '"Tabela Estranha"': 'h2', '"com""aspas"': 'h3' }, columns: {} }) } });
  assert.deepEqual(tabelasDeReferencia(r.raiz), { fonte: 'supabase/schema-manifest.json', tabelas: ['coletas', 'Tabela Estranha', 'com"aspas'] });
});

test('tabelasDeReferencia: sem manifesto e sem tabelas em types.ts falha fechado', (t) => {
  assert.throws(() => tabelasDeReferencia(montar(t, { sem: ['src/integrations/supabase/types.ts'] }).raiz), /sem referencia para conferir a origem/);
  assert.throws(() => tabelasDeReferencia(montar(t, { extras: { 'src/integrations/supabase/types.ts': 'export type Database = {}\n' } }).raiz), /sem referencia para conferir a origem/);
});

test('tabelasDeReferencia: no repo de verdade acha as tabelas do banco oficial', () => {
  const ref = tabelasDeReferencia(REPO);
  assert.ok(ref.tabelas.length > 50, `${ref.fonte}: ${ref.tabelas.length} tabelas`);
  for (const nome of ['coletas', 'clientes', 'user_roles']) assert.ok(ref.tabelas.includes(nome), nome);
});

test('conferirOrigem: banco oficial passa; banco irmao com outras tabelas e recusado', () => {
  const ref = [...TABELAS, ...PARTICOES];
  assert.deepEqual(conferirOrigem(resposta(), ref), { tabelas_em_comum_com_manifesto: 10, tabelas_no_manifesto: 10 });
  const irmao = resposta((d) => { d.tabelas = ['contatos', 'mensagens', 'coletas'].map((n) => tabela(n)); });
  assert.throws(() => conferirOrigem(irmao, ref, null, 'types.ts'), /nao parece ser do banco oficial: 1 tabelas em comum com types\.ts \(8% da referencia, 33% da resposta\)/);
  assert.throws(() => conferirOrigem(resposta(), []), /nao parece ser do banco oficial/);
  // 1 tabela a mais ou a menos em 10 ainda passa (>= 90%); 2 nao.
  assert.ok(conferirOrigem(resposta(), ref.filter((n) => n !== 'coletas')));
  assert.throws(() => conferirOrigem(resposta(), ref.filter((n) => n !== 'coletas' && n !== 'clientes').concat(['x1'])), /nao parece ser do banco oficial/);
});

test('conferirOrigem: particao que nasceu ou morreu depois da referencia nao derruba a conferencia', () => {
  // A referencia foi gerada meses atras: 3 particoes ja dropadas; o banco hoje tem 6 novas.
  const referencia = [...TABELAS, 'audit_logs_y2026m01', 'audit_logs_y2026m02', 'audit_logs_y2026m03'];
  const hoje = resposta((d) => {
    d.tabelas = [...TABELAS.map((n) => tabela(n)), ...['y2026m10', 'y2026m11', 'y2026m12', 'y2027m01', 'y2027m02', 'y2027m03'].map((s) => tabela(`audit_logs_${s}`, { particao_de: 'audit_logs' }))];
  });
  assert.deepEqual(conferirOrigem(hoje, referencia), { tabelas_em_comum_com_manifesto: 10, tabelas_no_manifesto: 10 });
});

test('conferirOrigem: ledger de migrations x supabase/migrations', () => {
  const ref = [...TABELAS, ...PARTICOES];
  assert.deepEqual(conferirOrigem(resposta(), ref, VERSOES), {
    tabelas_em_comum_com_manifesto: 10, tabelas_no_manifesto: 10, ledger_registros: 30, migrations_no_repo: 30,
  });
  assert.ok(conferirOrigem(resposta((d) => { d.resumo.ledger_registros = 27; }), ref, VERSOES), '10% de diferenca ainda passa');
  assert.throws(() => conferirOrigem(resposta((d) => { d.resumo.ledger_registros = 26; }), ref, VERSOES), /ledger com 26 registros/);
  assert.throws(() => conferirOrigem(resposta((d) => { d.resumo.ledger_registros = 34; }), ref, VERSOES), /ledger com 34 registros/);
  const limite = [...VERSOES].sort().reverse()[LEDGER_TOLERANCIA.versoesRecentes - 1];
  assert.ok(conferirOrigem(resposta((d) => { d.resumo.ledger_versao_max = limite; }), ref, VERSOES));
  assert.throws(() => conferirOrigem(resposta((d) => { d.resumo.ledger_versao_max = '20250101000000'; }), ref, VERSOES), /maior versao 20250101000000/);
  assert.throws(() => conferirOrigem(resposta((d) => { delete d.resumo.ledger_versao_max; }), ref, VERSOES), /nao traz resumo\.ledger_versao_max/);
  assert.throws(() => conferirOrigem(resposta((d) => { d.resumo.ledger_registros = '30'; }), ref, VERSOES), /nao traz resumo\.ledger_versao_max/);
  assert.ok(conferirOrigem(resposta((d) => { delete d.resumo.ledger_registros; }), ref, []), 'repo sem migrations: so as tabelas contam');
});

test('versoesDoRepo e edgesNoRepo: so migration numerada da raiz e pasta com index.ts (sem _shared)', (t) => {
  const r = montar(t);
  assert.deepEqual(versoesDoRepo(r.raiz), VERSOES);
  assert.deepEqual(edgesNoRepo(r.raiz), ['health', 'predict-delays']);
  assert.equal(versoesDoRepo(REPO).length, fs.readdirSync(path.join(REPO, 'supabase/migrations')).filter((f) => /^\d+_.*\.sql$/.test(f)).length);
});

// ---------- uso no codigo, edges, cron ----------

test('contarUsoNoCodigo: .from literal e /rest/v1 contam; storage.from, rpc, teste, node_modules, oculto e nao-codigo nao', (t) => {
  const r = montar(t);
  const uso = contarUsoNoCodigo(r.raiz, [...TABELAS, 'toString', 'constructor']);
  assert.deepEqual(uso.coletas, { src: 2, edges: 1 });
  assert.deepEqual(uso.clientes, { src: 1, edges: 0 });
  assert.deepEqual(uso.entregas, { src: 1, edges: 0 }, '/rest/v1/entregas');
  assert.deepEqual(uso.fornecedores, { src: 0, edges: 0 }, 'storage.from e bucket');
  assert.deepEqual(uso.profiles, { src: 0, edges: 1 }, '/rest/v1/rpc/... nao e tabela; _shared conta como edge');
  assert.deepEqual(uso.user_roles, { src: 0, edges: 1 });
  assert.deepEqual(uso.orfa_vazia, { src: 0, edges: 0 });
  assert.deepEqual(uso.so_no_banco, { src: 0, edges: 0 });
});

test('contarUsoNoCodigo: repo sem src/ ou sem supabase/functions/ devolve zero, nao erro', (t) => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-vazio-'));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  assert.deepEqual(contarUsoNoCodigo(raiz, ['coletas']), { coletas: { src: 0, edges: 0 } });
});

test('compararEdges: sem consulta, publicadas x repo e resposta invalida', () => {
  assert.deepEqual(compararEdges(null, ['a', 'b']), { publicadas: null, no_repo: 2, publicadas_sem_codigo_no_repo: null, no_repo_sem_deploy: null });
  const api = [
    { slug: 'predict-delays', version: 7, status: 'ACTIVE', verify_jwt: false, updated_at: 1762000000000, id: 'x', name: 'y' },
    { slug: 'fantasma', version: 1, status: 'ACTIVE', verify_jwt: true, updated_at: '2026-11-01T10:20:30.000Z' },
    { slug: 'Zeta', version: 1, status: 'REMOVED', verify_jwt: true },
    { slug: 'data-ruim', version: 1, status: 'ACTIVE', verify_jwt: true, updated_at: 'ontem' },
  ];
  const r = compararEdges(api, ['health', 'predict-delays']);
  assert.deepEqual(r.publicadas.map((p) => p.slug), ['Zeta', 'data-ruim', 'fantasma', 'predict-delays'], 'ordem por unidade de codigo, igual em qualquer locale');
  assert.deepEqual(r.publicadas[3], { slug: 'predict-delays', versao: 7, status: 'ACTIVE', verify_jwt: false, atualizada_em: '2025-11-01T12:26Z' });
  assert.equal(r.publicadas[2].atualizada_em, '2026-11-01T10:20Z');
  assert.equal(r.publicadas[0].atualizada_em, null);
  assert.equal(r.publicadas[1].atualizada_em, null, 'data invalida vira null em vez de RangeError');
  assert.deepEqual(r.publicadas_sem_codigo_no_repo, ['Zeta', 'data-ruim', 'fantasma']);
  assert.deepEqual(r.no_repo_sem_deploy, ['health']);
  assert.equal(r.no_repo, 2);
  assert.throws(() => compararEdges({ message: 'Unauthorized' }, []), /lista de edge functions invalida/);
  assert.throws(() => compararEdges([{ name: 'sem slug' }], []), /lista de edge functions invalida/);
  assert.deepEqual(compararEdges([], ['a']).no_repo_sem_deploy, ['a']);
});

test('rodaTodoDia: agendas do pg_cron', () => {
  for (const agenda of ['* * * * *', '*/30 * * * *', '0 3 * * *', '0 3 */1 * *', '15 2 1-31 1-12 0-6', '0 0 * * 0-7', '0 0 * * 1-7', '30 seconds', '1 second', '  0 3 * * *  ']) {
    assert.equal(rodaTodoDia(agenda), true, agenda);
  }
  for (const agenda of ['0 4 * * 1', '0 0 1 * *', '0 0 * 6 *', '0 0 */2 * *', '0 0 * * 1-5', '@daily', '', null, undefined, '* * * *']) {
    assert.equal(rodaTodoDia(agenda), false, String(agenda));
  }
});

// ---------- montarInventario ----------

test('montarInventario: orfas (particao vazia nao e orfa), uso no codigo e fonte', (t) => {
  const r = montar(t);
  const dado = resposta();
  const inv = montarInventario(dado, contarUsoNoCodigo(r.raiz, dado.tabelas.map((x) => x.nome)), compararEdges(null, edgesNoRepo(r.raiz)));
  // Antes a particao do mes que vem (0 linhas, sem .from, nao citada) entrava na lista de orfas.
  assert.deepEqual(inv.tabelas_orfas.lista, ['orfa_vazia', 'so_no_banco']);
  assert.ok(!inv.tabelas_orfas.lista.includes('audit_logs_y2026m12'));
  assert.match(inv.tabelas_orfas.criterio, /particao nao conta/);
  assert.deepEqual(inv.tabelas.find((x) => x.nome === 'coletas').uso_no_codigo, { src: 2, edges: 1 });
  assert.equal(inv.tabelas.find((x) => x.nome === 'audit_logs_y2026m12').particao_de, 'audit_logs');
  assert.deepEqual(inv.alertas, []);
  assert.deepEqual(inv.edge_functions, { publicadas: null, no_repo: 2, publicadas_sem_codigo_no_repo: null, no_repo_sem_deploy: null });
  assert.equal(inv.medido_em, dado.medido_em);
  assert.deepEqual(Object.keys(inv), [...Object.keys(inv)].sort(), 'chaves ordenadas: diff so no que mudou');
  assert.deepEqual(Object.keys(inv.tabelas[0]), [...Object.keys(inv.tabelas[0])].sort());
});

test('montarInventario: tabela vazia citada no banco ou usada no codigo nao e orfa', () => {
  const dado = resposta((d) => {
    d.tabelas = [tabela('a', { linhas: 0, citada_no_banco: true }), tabela('b', { linhas: 0 }), tabela('c', { linhas: 0 }), tabela('d', { linhas: 1 }), tabela('e', { linhas: 0 })];
  });
  const inv = montarInventario(dado, { b: { src: 1, edges: 0 }, c: { src: 0, edges: 2 } });
  assert.deepEqual(inv.tabelas_orfas.lista, ['e']);
  assert.deepEqual(inv.tabelas.find((x) => x.nome === 'e').uso_no_codigo, { src: 0, edges: 0 }, 'tabela sem entrada em `uso` vira zero');
});

test('montarInventario: cada tipo de alerta', () => {
  const dado = resposta((d) => {
    d.tabelas.find((x) => x.nome === 'clientes').rls = false;
    d.tabelas.find((x) => x.nome === 'audit_logs_y2026m12').policies = 0; // particao sem policy continua alertando
    d.cron.jobs = [
      { nome: 'falhando', agenda: '* * * * *', ativo: true, execucoes_24h: 10, taxa_falha_7d_pct: LIMIARES.taxaFalhaCronPct },
      { nome: 'quase', agenda: '* * * * *', ativo: true, execucoes_24h: 10, taxa_falha_7d_pct: LIMIARES.taxaFalhaCronPct - 0.1 },
      { nome: 'falhando-inativo', agenda: '* * * * *', ativo: false, execucoes_24h: 0, taxa_falha_7d_pct: 90 },
      { nome: 'mudo', agenda: '0 3 * * *', ativo: true, execucoes_24h: 0, taxa_falha_7d_pct: 0 },
      { nome: 'semanal-sem-execucao', agenda: '0 4 * * 1', ativo: true, execucoes_24h: 0, taxa_falha_7d_pct: 0 },
    ];
    d.cron.horas_paradas_7d = [{ hora: '2026-11-07T03:00Z', execucoes: 4, falhas: 3 }];
    d.cron.historico.mais_de_7_dias = LIMIARES.historicoCronMaisDe7Dias + 1;
  });
  const edges = compararEdges([{ slug: 'health' }, { slug: 'fantasma' }], ['health', 'predict-delays']);
  assert.deepEqual(montarInventario(dado, {}, edges).alertas, [
    { tipo: 'tabela_sem_rls', detalhe: ['clientes'] },
    { tipo: 'rls_sem_policy', detalhe: ['audit_logs_y2026m12'] },
    { tipo: 'cron_falhando', detalhe: ['falhando (5% em 7d)'] },
    { tipo: 'cron_sem_execucao', detalhe: ['mudo'] },
    { tipo: 'cron_parado', detalhe: ['2026-11-07T03:00Z'] },
    { tipo: 'historico_cron_sem_limpeza', detalhe: ['50001 linhas com mais de 7 dias'] },
    { tipo: 'edge_sem_deploy', detalhe: ['predict-delays'] },
    { tipo: 'edge_publicada_sem_codigo', detalhe: ['fantasma'] },
  ]);
  const noLimite = resposta((d) => { d.cron.historico.mais_de_7_dias = LIMIARES.historicoCronMaisDe7Dias; });
  assert.deepEqual(montarInventario(noLimite, {}).alertas, []);
});

test('PARECE_CREDENCIAL: pega Bearer, JWT e sb_secret_; nao pega texto comum do inventario', () => {
  for (const texto of ['Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345', ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'eyJyb2xlIjoiYW5vbiJ9', 'assinatura'].join('.'), 'sb_secret_AbC123']) {
    assert.ok(PARECE_CREDENCIAL.test(texto), texto);
  }
  assert.ok(!PARECE_CREDENCIAL.test(JSON.stringify(montarInventario(resposta(), {}), null, 2)));
  assert.ok(!PARECE_CREDENCIAL.test('"chama": ["net.http_post"], "nome": "bearer-token-rotation", "eyJ": 1'));
});

// ---------- CLI com --entrada ----------

test('CLI --entrada: grava banco.json, resume no stdout e nao consulta a rede', (t) => {
  const r = montar(t, { nome: 'inv banco ação (1) [x] ' });
  const entrada = r.gravar('resposta do mcp é.json', { rows: [{ inventario: resposta() }] });
  const saida = r.rodar(['--entrada', entrada]);
  assert.equal(saida.status, 0, saida.stderr);
  assert.match(saida.stdout, /^banco\.json: 13 tabelas, 2 cron jobs, 2 orfas, 0 alertas, edges 2 no repo \(publicadas nao consultadas\) \(medido_em 2026-11-09T12:00:00Z\)\.\n$/);
  const inv = r.lerSaida();
  assert.equal(inv.tabelas.length, 13);
  assert.equal(inv.edge_functions.publicadas, null);
  assert.deepEqual(inv.tabelas_orfas.lista, ['orfa_vazia', 'so_no_banco']);
  assert.ok(fs.readFileSync(r.saida, 'utf8').endsWith('}\n'));
});

test('CLI --entrada + --functions: compara as edges publicadas com o repo', (t) => {
  const r = montar(t);
  const entrada = r.gravar('resposta.json', resposta());
  const functions = r.gravar('functions.json', [{ slug: 'health', version: 2, status: 'ACTIVE', verify_jwt: true, updated_at: 1762000000000 }, { slug: 'fantasma', version: 1, status: 'ACTIVE', verify_jwt: false }]);
  const saida = r.rodar(['--functions', functions, '--entrada', entrada]);
  assert.equal(saida.status, 0, saida.stderr);
  assert.match(saida.stdout, /edges 2 publicadas\/2 no repo/);
  assert.deepEqual(r.lerSaida().alertas, [
    { tipo: 'edge_sem_deploy', detalhe: ['predict-delays'] },
    { tipo: 'edge_publicada_sem_codigo', detalhe: ['fantasma'] },
  ]);
});

test('CLI --entrada: a mesma entrada gera o mesmo arquivo, byte a byte, de qualquer cwd', (t) => {
  const r = montar(t);
  const entrada = r.gravar('resposta.json', resposta());
  assert.equal(r.rodar(['--entrada', entrada]).status, 0);
  const um = fs.readFileSync(r.saida);
  // Mesma resposta com as chaves em outra ordem: a saida e ordenada.
  const invertida = Object.fromEntries(Object.entries(resposta()).reverse());
  const r2 = spawnSync(process.execPath, [path.join(r.raiz, 'scripts/inventario/gerar-banco.mjs'), '--entrada', r.gravar('resposta2.json', invertida)],
    { cwd: os.tmpdir(), encoding: 'utf8', env: { ...process.env, SUPABASE_ACCESS_TOKEN: '' } });
  assert.equal(r2.status, 0, r2.stderr);
  assert.ok(um.equals(fs.readFileSync(r.saida)));
});

test('CLI --entrada: resposta de outro banco, com cara de credencial ou invalida sai com exit 2 e nao toca no banco.json', async (t) => {
  const casos = {
    'banco irmao (tabelas)': [resposta((d) => { d.tabelas = ['contatos', 'mensagens'].map((n) => tabela(n)); }), /nao parece ser do banco oficial: 0 tabelas em comum com src\/integrations\/supabase\/types\.ts/],
    'banco irmao (ledger)': [resposta((d) => { d.resumo.ledger_registros = 159; }), /ledger com 159 registros/],
    'JWT num nome de job': [resposta((d) => { d.cron.jobs[0].nome = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'eyJyb2xlIjoiYW5vbiJ9', 'x'].join('.'); }), /cara de credencial; nada foi gravado/],
    'arquivo vazio': ['', /entrada vazia/],
    'erro do psql no lugar do JSON': ['psql: error: FATAL:  password authentication failed\n', /entrada nao e JSON valido/],
    'JSON sem o inventario': [{ rows: [] }, /entrada sem as chaves/],
  };
  for (const [nome, [conteudo, erro]] of Object.entries(casos)) {
    await t.test(nome, () => {
      const r = montar(t);
      fs.mkdirSync(path.dirname(r.saida), { recursive: true });
      fs.writeFileSync(r.saida, 'ANTERIOR');
      const saida = r.rodar(['--entrada', r.gravar('resposta.json', conteudo)]);
      assert.equal(saida.status, 2, saida.stdout);
      assert.match(saida.stderr, erro);
      assert.match(saida.stderr, /^ERRO: /);
      assert.equal(fs.readFileSync(r.saida, 'utf8'), 'ANTERIOR');
    });
  }
});

test('CLI: sem referencia de tabelas no repo falha fechado', (t) => {
  const r = montar(t, { sem: ['src/integrations/supabase/types.ts'] });
  const saida = r.rodar(['--entrada', r.gravar('resposta.json', resposta())]);
  assert.equal(saida.status, 2);
  assert.match(saida.stderr, /sem referencia para conferir a origem/);
  assert.ok(!fs.existsSync(r.saida));
});

test('CLI: argumentos - ajuda, desconhecido, valor faltando, arquivo ausente, sem entrada e sem token', (t) => {
  const r = montar(t);
  const entrada = r.gravar('resposta.json', resposta());
  // --help com token e URL de API: nao pode consultar nada.
  const ajuda = r.rodar(['--help'], { SUPABASE_ACCESS_TOKEN: TOKEN, SUPABASE_API_URL: 'http://127.0.0.1:1' });
  assert.equal(ajuda.status, 0);
  assert.match(ajuda.stdout, /^Uso:\n/);
  const erros = [
    [['--saida', 'x'], /argumento desconhecido: --saida/],
    [[entrada], /argumento desconhecido/],
    [['--entrada'], /--entrada exige o caminho do arquivo com a resposta do banco\.sql/],
    [['--entrada', '--functions', 'x'], /--entrada exige o caminho/],
    [['--entrada', entrada, '--functions'], /--functions exige o caminho/],
    [['--functions', entrada], /--functions so vale junto de --entrada/],
    [['--entrada', path.join(r.raiz, 'nao-existe.json')], /ENOENT/],
    [['--entrada', entrada, '--functions', path.join(r.raiz, 'nao-existe.json')], /--functions: ENOENT/],
    [['--entrada', entrada, '--functions', r.gravar('ruim.json', '{"message":"Unauthorized"}')], /lista de edge functions invalida/],
    [[], /sem --entrada e sem SUPABASE_ACCESS_TOKEN/],
  ];
  for (const [args, erro] of erros) {
    const saida = r.rodar(args);
    assert.equal(saida.status, 2, `${args.join(' ')} => ${saida.stdout}`);
    assert.match(saida.stderr, erro, args.join(' '));
  }
  assert.ok(!fs.existsSync(r.saida));
});

// ---------- CLI contra a "Management API" local ----------

/**
 * Servidor que responde como a Management API. `roteiro` e a lista de respostas, uma por chamada:
 * 'ok' (resposta certa da rota), um status HTTP, 'vazio', 'html', 'derruba' ou 'demora'.
 */
async function api(t, { roteiro = [], dado = resposta(), functions = [{ slug: 'health', version: 1, status: 'ACTIVE', verify_jwt: true }] } = {}) {
  const chamadas = [];
  const servidor = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      const passo = roteiro.shift() ?? 'ok';
      chamadas.push({ metodo: req.method, url: req.url, auth: req.headers.authorization, corpo, passo });
      const responder = (status, texto) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(texto); };
      if (typeof passo === 'number') return responder(passo, JSON.stringify({ message: `corpo do erro com segredo Bearer ${TOKEN} e trecho da consulta` }));
      if (passo === 'vazio') return responder(200, '');
      if (passo === 'html') return responder(200, '<html>502 Bad Gateway</html>');
      if (passo === 'derruba') return req.socket.destroy();
      if (passo === 'demora') return setTimeout(() => responder(200, '[]'), 3000).unref();
      if (req.headers.authorization !== `Bearer ${TOKEN}`) return responder(401, '{"message":"Unauthorized"}');
      if (req.method === 'GET' && req.url.endsWith('/functions')) return responder(200, JSON.stringify(functions));
      if (req.method === 'POST' && req.url.endsWith('/database/query/read-only')) {
        const { query } = JSON.parse(corpo);
        if (query.includes('to_regclass')) return responder(201, JSON.stringify([{ 'cron.job': false, 'cron.job_run_details': false, 'supabase_migrations.schema_migrations': true }]));
        return responder(201, JSON.stringify([{ inventario: dado }]));
      }
      return responder(404, '{"message":"not found"}');
    });
  });
  await new Promise((resolve) => { servidor.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise((resolve) => { servidor.closeAllConnections?.(); servidor.close(resolve); }));
  const env = { SUPABASE_ACCESS_TOKEN: TOKEN, SUPABASE_API_URL: `http://127.0.0.1:${servidor.address().port}/`, INVENTARIO_API_ESPERA_MS: '1' };
  return { chamadas, env };
}

test('CLI com token: consulta o banco.sql em modo somente leitura e as edges do projeto oficial', async (t) => {
  const r = montar(t);
  const { chamadas, env } = await api(t);
  const saida = await r.rodarAsync([], env);
  assert.equal(saida.status, 0, saida.stderr);
  assert.match(saida.stdout, /^banco\.json: 13 tabelas, 2 cron jobs, 2 orfas, 1 alertas, edges 1 publicadas\/2 no repo/);
  assert.deepEqual(chamadas.map((c) => `${c.metodo} ${c.url}`), [
    `POST /v1/projects/${PROJETO_OFICIAL}/database/query/read-only`,
    `GET /v1/projects/${PROJETO_OFICIAL}/functions`,
  ]);
  assert.ok(chamadas.every((c) => c.auth === `Bearer ${TOKEN}`));
  assert.equal(JSON.parse(chamadas[0].corpo).query, fs.readFileSync(path.join(AQUI, 'banco.sql'), 'utf8'), 'manda o banco.sql inteiro, sem alterar');
  const texto = fs.readFileSync(r.saida, 'utf8');
  assert.ok(!texto.includes(TOKEN));
  assert.deepEqual(JSON.parse(texto).alertas, [{ tipo: 'edge_sem_deploy', detalhe: ['predict-delays'] }]);
});

test('CLI com token: 429/5xx e conexao derrubada sao repetidos; na terceira falha desiste com exit 2', async (t) => {
  await t.test('503, 503, ok', async () => {
    const r = montar(t);
    const { chamadas, env } = await api(t, { roteiro: [503, 503] });
    const saida = await r.rodarAsync([], env);
    assert.equal(saida.status, 0, saida.stderr);
    assert.equal(chamadas.length, 4);
  });
  await t.test('conexao derrubada uma vez', async () => {
    const r = montar(t);
    const { chamadas, env } = await api(t, { roteiro: ['derruba'] });
    assert.equal((await r.rodarAsync([], env)).status, 0);
    assert.equal(chamadas.length, 3);
  });
  await t.test('429 persistente', async () => {
    const r = montar(t);
    const { chamadas, env } = await api(t, { roteiro: [429, 429, 429, 429] });
    const saida = await r.rodarAsync([], env);
    assert.equal(saida.status, 2);
    assert.match(saida.stderr, /^ERRO: Management API \/database\/query\/read-only respondeu HTTP 429 \(apos 3 tentativas\)\n$/);
    assert.equal(chamadas.length, 3);
    assert.ok(!fs.existsSync(r.saida));
  });
  await t.test('conexao derrubada sempre', async () => {
    const r = montar(t);
    const { chamadas, env } = await api(t, { roteiro: ['derruba', 'derruba', 'derruba', 'derruba'] });
    const saida = await r.rodarAsync([], env);
    assert.equal(saida.status, 2);
    assert.match(saida.stderr, /inacessivel apos 3 tentativas/);
    assert.equal(chamadas.length, 3);
  });
  await t.test('GET /functions falhando derruba o inventario (nao grava pela metade)', async () => {
    const r = montar(t);
    const { env } = await api(t, { roteiro: ['ok', 500, 500, 500] });
    const saida = await r.rodarAsync([], env);
    assert.equal(saida.status, 2);
    assert.match(saida.stderr, /Management API \/functions respondeu HTTP 500 \(apos 3 tentativas\)/);
    assert.ok(!fs.existsSync(r.saida));
  });
});

test('CLI com token: 401/403/404 nao sao repetidos, dizem o que fazer e nunca repassam o corpo do erro', async (t) => {
  const casos = { 401: /HTTP 401 \(token recusado: confira\/renove o SUPABASE_ACCESS_TOKEN\)/, 403: /HTTP 403 \(token sem acesso a este projeto\)/, 404: /HTTP 404 \(projeto ou rota nao encontrados/ };
  for (const [status, erro] of Object.entries(casos)) {
    await t.test(status, async () => {
      const r = montar(t);
      const { chamadas, env } = await api(t, { roteiro: [Number(status)] });
      const saida = await r.rodarAsync([], env);
      assert.equal(saida.status, 2);
      assert.match(saida.stderr, erro);
      assert.equal(chamadas.length, 1);
      assert.ok(!saida.stderr.includes(TOKEN) && !saida.stderr.includes('trecho da consulta') && !saida.stdout.includes(TOKEN));
    });
  }
});

test('CLI com token: banco.sql recusado (HTTP 400) diz o que falta no banco (pg_cron/ledger ausentes)', async (t) => {
  const r = montar(t);
  const { chamadas, env } = await api(t, { roteiro: [400] });
  const saida = await r.rodarAsync([], env);
  assert.equal(saida.status, 2);
  assert.match(saida.stderr, /^ERRO: Management API \/database\/query\/read-only respondeu HTTP 400: o banco nao tem cron\.job, cron\.job_run_details \(pg_cron\/ledger ausentes: nao e o banco oficial\?\)\.\n$/);
  assert.equal(chamadas.length, 2, 'a consulta e uma de diagnostico; /functions nem e chamado');
  assert.ok(!saida.stderr.includes(TOKEN));

  const r2 = montar(t);
  const outra = await api(t, { roteiro: [400, 400] });
  const saida2 = await r2.rodarAsync([], outra.env);
  assert.equal(saida2.status, 2);
  assert.match(saida2.stderr, /HTTP 400: nem a consulta de diagnostico passou; rode scripts\/inventario\/banco\.sql no SQL Editor/);
});

test('CLI com token: corpo que nao e JSON, timeout e resposta de outro banco', async (t) => {
  await t.test('200 com corpo vazio', async () => {
    const r = montar(t);
    const saida = await r.rodarAsync([], (await api(t, { roteiro: ['vazio'] })).env);
    assert.equal(saida.status, 2);
    assert.match(saida.stderr, /respondeu HTTP 200 com corpo que nao e JSON/);
  });
  await t.test('200 com HTML de gateway', async () => {
    const r = montar(t);
    const saida = await r.rodarAsync([], (await api(t, { roteiro: ['html'] })).env);
    assert.equal(saida.status, 2);
    assert.match(saida.stderr, /com corpo que nao e JSON/);
  });
  await t.test('timeout', async () => {
    const r = montar(t);
    const { chamadas, env } = await api(t, { roteiro: ['demora'] });
    const saida = await r.rodarAsync([], { ...env, INVENTARIO_API_TIMEOUT_MS: '600' });
    assert.equal(saida.status, 2);
    assert.match(saida.stderr, /nao respondeu em 600 ms \(timeout\)/);
    // <= 1: em maquina carregada o pedido pode ser abortado antes de o servidor termina-lo de ler.
    assert.ok(chamadas.length <= 1, 'timeout nao e repetido');
  });
  await t.test('API devolve inventario de outro banco', async () => {
    const r = montar(t);
    const { env } = await api(t, { dado: resposta((d) => { d.tabelas = [tabela('contatos')]; }) });
    const saida = await r.rodarAsync([], env);
    assert.equal(saida.status, 2);
    assert.match(saida.stderr, /nao parece ser do banco oficial/);
    assert.ok(!fs.existsSync(r.saida));
  });
  await t.test('GET /functions devolve objeto de erro com 200', async () => {
    const r = montar(t);
    const saida = await r.rodarAsync([], (await api(t, { functions: { message: 'x' } })).env);
    assert.equal(saida.status, 2);
    assert.match(saida.stderr, /lista de edge functions invalida/);
  });
});

test('CLI com token: o token so sai para a API oficial ou 127.0.0.1, e so para o projeto oficial', async (t) => {
  const r = montar(t);
  const { chamadas, env } = await api(t);
  const externo = r.rodar([], { ...env, SUPABASE_API_URL: 'https://api.exemplo.invalid' });
  assert.equal(externo.status, 2);
  assert.match(externo.stderr, /SUPABASE_API_URL aponta para api\.exemplo\.invalid/);
  const malformada = r.rodar([], { ...env, SUPABASE_API_URL: 'nao e url' });
  assert.equal(malformada.status, 2);
  assert.match(malformada.stderr, /SUPABASE_API_URL nao e uma URL valida/);
  const outroProjeto = await r.rodarAsync([], { ...env, SUPABASE_PROJECT_REF: 'hgicfqjayrjurivtygqf' });
  assert.equal(outroProjeto.status, 2);
  assert.match(outroProjeto.stderr, /SUPABASE_PROJECT_REF=hgicfqjayrjurivtygqf nao e o banco oficial \(jvfhclubfpxrtrrazrgr\)/);
  assert.equal(chamadas.length, 0, 'nenhuma requisicao saiu');
  const permitido = await r.rodarAsync([], { ...env, SUPABASE_PROJECT_REF: 'projeto-de-teste', INVENTARIO_PERMITIR_OUTRO_PROJETO: '1' });
  assert.equal(permitido.status, 0, permitido.stderr);
  assert.equal(chamadas[0].url, '/v1/projects/projeto-de-teste/database/query/read-only');
  const tokenErrado = await r.rodarAsync([], { ...env, SUPABASE_ACCESS_TOKEN: '  outro-token  ' });
  assert.equal(tokenErrado.status, 2);
  assert.match(tokenErrado.stderr, /HTTP 401/);
});

// ---------- banco.sql num Postgres de verdade (opcional) ----------

const PG_URL = process.env.INVENTARIO_PG_TEST_URL;
const temPsql = spawnSync('psql', ['--version']).status === 0;

// Montado em tempo de execução: um JWT literal no arquivo dispara o gitleaks.
const JWT_FIXTURE = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'eyJyb2xlIjoic2VydmljZV9yb2xlIn0', 'assinaturaDeFixture'].join('.');
const FIXTURE_SQL = String.raw`
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;
DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS cron CASCADE; DROP SCHEMA IF EXISTS net CASCADE; DROP SCHEMA IF EXISTS supabase_migrations CASCADE;
CREATE SCHEMA auth; CREATE SCHEMA cron; CREATE SCHEMA net; CREATE SCHEMA supabase_migrations;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE TABLE supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text);
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20260101000000', 'a'), ('20260301000000', 'c'), ('20260201000000', 'b');
CREATE TABLE cron.job (jobid bigserial PRIMARY KEY, schedule text NOT NULL, command text NOT NULL, nodename text, nodeport int, database text, username text, active boolean DEFAULT true, jobname text);
CREATE TABLE cron.job_run_details (jobid bigint, runid bigserial PRIMARY KEY, job_pid int, database text, username text, command text, status text, return_message text, start_time timestamptz, end_time timestamptz);

CREATE TABLE public.clientes (id serial PRIMARY KEY, nome text, updated_at timestamptz);
CREATE TABLE public.coletas (id serial PRIMARY KEY, cliente_id int REFERENCES public.clientes (id));
CREATE TABLE public.sem_rls (id int);
CREATE TABLE public.rls_sem_policy (id int);
CREATE TABLE public.orfa_vazia (id int);
CREATE TABLE public.citada_so_em_funcao (id int);
CREATE TABLE public.citada_em_view (id int);
CREATE TABLE public."Tabela Estranha (ação) [x]" (id int);
CREATE TABLE public."com.ponto+mais" (id int);
CREATE TABLE public."par(" (id int);
CREATE TABLE public."quebra[regex" (id int);
CREATE TABLE public.audit_logs (id bigserial, criado_em timestamptz NOT NULL) PARTITION BY RANGE (criado_em);
CREATE TABLE public.audit_logs_y2026m11 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE public.audit_logs_y2027m01 PARTITION OF public.audit_logs FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
INSERT INTO public.clientes (nome) SELECT 'c' || g FROM generate_series(1, 5) g;
INSERT INTO public.coletas (cliente_id) SELECT 1 FROM generate_series(1, 3);
INSERT INTO public.audit_logs (criado_em) SELECT '2026-11-05' FROM generate_series(1, 7);
INSERT INTO public."Tabela Estranha (ação) [x]" VALUES (1);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY; ALTER TABLE public.clientes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.coletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rls_sem_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orfa_vazia ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.has_role(_uid uuid, _role text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT true $$;
CREATE POLICY clientes_select ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY clientes_admin ON public.clientes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY coletas_select ON public.coletas FOR SELECT TO authenticated USING (true);
CREATE POLICY orfa_select ON public.orfa_vazia FOR SELECT TO anon USING (true);
CREATE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_a BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_b BEFORE INSERT ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE FUNCTION public.limpa() RETURNS void LANGUAGE plpgsql AS $$ BEGIN
  DELETE FROM citada_so_em_funcao WHERE id < 0; PERFORM 1 FROM "par("; PERFORM 1 FROM "Tabela Estranha (ação) [x]"; PERFORM 1 FROM comXponto_mais;
END $$;
CREATE PROCEDURE public.proc_x() LANGUAGE plpgsql AS $$ BEGIN NULL; END $$;
CREATE VIEW public.v_citada AS SELECT id FROM public.citada_em_view;
CREATE MATERIALIZED VIEW public.mv_clientes AS SELECT count(*) AS n FROM public.clientes;

INSERT INTO cron.job (schedule, command, active, jobname) VALUES
  ('*/30 * * * *', $c$select net.http_post(url := 'https://exemplo.invalid/functions/v1/predict-delays-scheduled', headers := '{"Authorization":"Bearer ${JWT_FIXTURE}","x-internal-secret":"sb_secret_FIXTURE"}'::jsonb)$c$, true, 'predict-delays-every-30min'),
  ('0 3 * * *', 'SELECT public.limpa(); select cron.unschedule(1)', true, 'cleanup-telemetry-daily'),
  ('0 4 * * 1', 'SELECT public.limpa()', true, 'cleanup-notifications-weekly'),
  ('30 seconds', 'SELECT 1', true, 'job-mudo'),
  ('0 0 1 * *', 'CALL public.proc_x()', false, 'inativo');
INSERT INTO cron.job_run_details (jobid, status, return_message, start_time, end_time)
  SELECT 1, CASE WHEN g <= 2 THEN 'failed' ELSE 'succeeded' END,
         CASE WHEN g = 1 THEN 'job startup timeout' WHEN g = 2 THEN 'ERROR: senha=hunter2' ELSE '1 row' END,
         now() - (g || ' hours')::interval, now() - (g || ' hours')::interval + interval '3 seconds'
    FROM generate_series(1, 10) g;
INSERT INTO cron.job_run_details (jobid, status, return_message, start_time, end_time)
  SELECT 2, 'failed', 'connection failed', date_trunc('hour', now() - interval '3 days') + (g || ' minutes')::interval,
         date_trunc('hour', now() - interval '3 days') + (g || ' minutes')::interval + interval '1 second'
    FROM generate_series(1, 3) g;
INSERT INTO cron.job_run_details (jobid, status, return_message, start_time, end_time)
  SELECT 3, 'succeeded', 'ok', now() - interval '20 days', now() - interval '20 days' + interval '1 second' FROM generate_series(1, 4);
ANALYZE;
`;

test('banco.sql num Postgres de verdade (INVENTARIO_PG_TEST_URL)', { skip: !PG_URL || !temPsql ? 'defina INVENTARIO_PG_TEST_URL (banco descartavel, superusuario) e tenha psql no PATH' : false }, async (t) => {
  // O fixture faz DROP SCHEMA public: so aceita banco em loopback, para nunca apontar para um banco de verdade.
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(PG_URL).hostname), 'INVENTARIO_PG_TEST_URL tem de ser um Postgres local descartavel (127.0.0.1)');
  const psql = (args, opcoes = {}) => spawnSync('psql', [PG_URL, '-X', '-v', 'ON_ERROR_STOP=1', ...args], { encoding: 'utf8', maxBuffer: 1 << 28, ...opcoes });
  const fixture = psql(['-q', '-f', '-'], { input: FIXTURE_SQL });
  assert.equal(fixture.status, 0, fixture.stderr);
  const SQL = path.join(AQUI, 'banco.sql');
  // Somente leitura de verdade: a transacao inteira e read only, como no endpoint /database/query/read-only.
  const rodarSql = () => psql(['-At', '-f', SQL], { env: { ...process.env, PGOPTIONS: '-c default_transaction_read_only=on' } });

  const bruto = rodarSql();
  assert.equal(bruto.status, 0, bruto.stderr);
  assert.equal(bruto.stdout.trim().split('\n').length, 1, 'UMA linha com UM JSON');
  const dado = extrairInventario(bruto.stdout);

  await t.test('tabelas: RLS, policies, triggers, linhas, particao e citacao no banco', () => {
    const por = Object.fromEntries(dado.tabelas.map((x) => [x.nome, x]));
    assert.deepEqual(Object.keys(por).sort(), ['Tabela Estranha (ação) [x]', 'audit_logs', 'audit_logs_y2026m11', 'audit_logs_y2027m01', 'citada_em_view',
      'citada_so_em_funcao', 'clientes', 'coletas', 'com.ponto+mais', 'orfa_vazia', 'par(', 'quebra[regex', 'rls_sem_policy', 'sem_rls']);
    assert.equal(dado.tabelas.length, 14, 'sem nome repetido');
    assert.deepEqual({ rls: por.clientes.rls, forcado: por.clientes.rls_forcado, policies: por.clientes.policies, triggers: por.clientes.triggers, linhas: por.clientes.linhas, exatas: por.clientes.linhas_exatas },
      { rls: true, forcado: true, policies: 2, triggers: 2, linhas: 5, exatas: true });
    assert.equal(por.sem_rls.rls, false);
    assert.deepEqual([por.rls_sem_policy.rls, por.rls_sem_policy.policies], [true, 0]);
    assert.equal(por.audit_logs.linhas, 7, 'tabela-mae conta as particoes');
    assert.equal(por.audit_logs.particao_de, null);
    assert.deepEqual([por.audit_logs_y2026m11.particao_de, por.audit_logs_y2026m11.linhas], ['audit_logs', 7]);
    assert.deepEqual([por.audit_logs_y2027m01.particao_de, por.audit_logs_y2027m01.linhas], ['audit_logs', 0]);
    assert.equal(por.clientes.citada_no_banco, true, 'materialized view');
    assert.equal(por.citada_em_view.citada_no_banco, true);
    assert.equal(por.citada_so_em_funcao.citada_no_banco, true);
    assert.equal(por.orfa_vazia.citada_no_banco, false);
    // Nomes com caractere de regex: antes "par(" e "quebra[regex" derrubavam a consulta inteira.
    assert.equal(por['par('].citada_no_banco, true);
    assert.equal(por['quebra[regex'].citada_no_banco, false);
    assert.equal(por['Tabela Estranha (ação) [x]'].citada_no_banco, true);
    assert.equal(por['Tabela Estranha (ação) [x]'].linhas, 1);
    assert.equal(por['com.ponto+mais'].citada_no_banco, false, 'o ponto do nome nao e coringa (comXponto_mais nao e ela)');
    assert.ok(por.clientes.bytes > 0);
  });

  await t.test('resumo e cron: contagens, telemetria e so o nome das funcoes chamadas', () => {
    assert.deepEqual({ ...dado.resumo, postgres: 'x', tamanho_bytes: 0, max_connections: 0 }, {
      postgres: 'x', tabelas_public: 14, tabelas_sem_rls: 10, policies: 4, funcoes_public: 4, views_public: 2, triggers_public: 2,
      cron_jobs: 5, cron_ativos: 4, ledger_registros: 3, ledger_versao_max: '20260301000000', max_connections: 0, tamanho_bytes: 0,
    });
    const job = Object.fromEntries(dado.cron.jobs.map((j) => [j.nome, j]));
    assert.deepEqual(Object.keys(job), ['cleanup-notifications-weekly', 'cleanup-telemetry-daily', 'inativo', 'job-mudo', 'predict-delays-every-30min']);
    assert.deepEqual(job['predict-delays-every-30min'].chama, ['net.http_post']);
    assert.deepEqual(job['cleanup-telemetry-daily'].chama, ['cron.unschedule', 'public.limpa']);
    const { ultima_falha: ultima, ...predict } = job['predict-delays-every-30min'];
    assert.deepEqual(predict, { nome: 'predict-delays-every-30min', agenda: '*/30 * * * *', ativo: true, chama: ['net.http_post'], execucoes_24h: 10, falhas_24h: 2, execucoes_7d: 10, falhas_7d: 2, startup_timeout_7d: 1, taxa_falha_7d_pct: 20, duracao_max_s_7d: 3 });
    assert.match(ultima, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    assert.equal(job['cleanup-telemetry-daily'].taxa_falha_7d_pct, 100);
    assert.equal(job.inativo.ativo, false);
    assert.equal(job['job-mudo'].execucoes_7d, 0);
    assert.ok(dado.cron.horas_paradas_7d.length >= 2 && dado.cron.horas_paradas_7d.every((h) => /^\d{4}-\d\d-\d\dT\d\d:00Z$/.test(h.hora) && h.falhas * 2 > h.execucoes));
    assert.deepEqual({ ...dado.cron.historico, bytes: 0, mais_antigo: 'x' }, { linhas: 17, mais_de_7_dias: 4, mais_antigo: 'x', bytes: 0 });
    assert.equal(dado.cron.config.max_worker_processes > 0, true);
    assert.match(dado.medido_em, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  });

  await t.test('nada com cara de credencial sai do banco (comando do cron e return_message ficam de fora)', () => {
    assert.ok(!PARECE_CREDENCIAL.test(bruto.stdout));
    for (const proibido of ['hunter2', 'exemplo.invalid', 'x-internal-secret', 'assinaturaDeFixture']) assert.ok(!bruto.stdout.includes(proibido), proibido);
  });

  await t.test('duas execucoes: so medido_em (e o tamanho do banco) podem mudar', () => {
    const de = (texto) => { const d = JSON.parse(texto); delete d.medido_em; delete d.resumo.tamanho_bytes; return d; };
    const segunda = rodarSql();
    assert.equal(segunda.status, 0, segunda.stderr);
    assert.deepEqual(de(segunda.stdout), de(bruto.stdout));
  });

  await t.test('a saida do psql entra no gerar-banco.mjs e vira banco.json com os alertas esperados', () => {
    const nomes = dado.tabelas.map((x) => x.nome);
    const types = `export type Database = {\n  public: {\n    Tables: {\n${nomes.map((n) => `      ${/^[a-z_][a-z0-9_]*$/.test(n) ? n : JSON.stringify(n)}: {\n        Row: {}\n      }`).join('\n')}\n    }\n  }\n}\n`;
    const r = montar(t, { extras: { 'src/integrations/supabase/types.ts': types }, sem: VERSOES.slice(3).map((v) => `supabase/migrations/${v}_m.sql`) });
    const saida = r.rodar(['--entrada', r.gravar('psql.json', bruto.stdout)]);
    assert.equal(saida.status, 0, saida.stderr);
    const inv = r.lerSaida();
    assert.deepEqual(inv.tabelas_orfas.lista, ['com.ponto+mais', 'orfa_vazia', 'quebra[regex', 'rls_sem_policy', 'sem_rls'], 'a particao vazia de 2027 nao e orfa');
    assert.deepEqual(inv.alertas.map((a) => a.tipo), ['tabela_sem_rls', 'rls_sem_policy', 'cron_falhando', 'cron_sem_execucao', 'cron_parado']);
    assert.deepEqual(inv.alertas[1].detalhe, ['rls_sem_policy']);
    assert.deepEqual(inv.alertas.find((a) => a.tipo === 'cron_falhando').detalhe, ['cleanup-telemetry-daily (100% em 7d)', 'predict-delays-every-30min (20% em 7d)']);
    assert.deepEqual(inv.alertas.find((a) => a.tipo === 'cron_sem_execucao').detalhe, ['cleanup-telemetry-daily', 'job-mudo']);
  });

  await t.test('sem pg_cron (schema cron ausente) a consulta falha inteira: nada de inventario pela metade', () => {
    assert.equal(psql(['-q', '-c', 'DROP SCHEMA cron CASCADE']).status, 0);
    const sem = rodarSql();
    assert.notEqual(sem.status, 0);
    assert.match(sem.stderr, /relation "cron\.job(_run_details)?" does not exist/);
    assert.equal(sem.stdout.trim(), '');
  });
});
