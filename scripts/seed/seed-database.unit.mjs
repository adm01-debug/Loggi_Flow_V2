// Teste do seed (scripts/seed-database.ts) sem banco e sem rede.
// Roda o script como subprocesso contra um servidor HTTP local que imita o GoTrue admin e o
// PostgREST e que recusa, como o banco recusaria, tudo o que não bate com o schema real
// (src/integrations/supabase/types.ts, gerado do banco): tabela/coluna inexistente, coluna
// obrigatória ausente, valor fora do enum, ON CONFLICT sem UNIQUE, CHECK violado.
// Todo subprocesso sobe com uma sentinela de rede: fetch para fora de 127.0.0.1 é bloqueado e
// anotado — é o que prova "não tocou em produção" sem tocar em produção.
// Rodar: node --test scripts/seed/seed-database.unit.mjs

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// SEED_SCRIPT permite rodar a mesma bateria contra outra versão do seed (comparar antes/depois).
const SEED = path.resolve(process.env.SEED_SCRIPT ?? path.join(RAIZ, 'scripts', 'seed-database.ts'));
const TSX = path.join(RAIZ, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const TYPES = path.join(RAIZ, 'src', 'integrations', 'supabase', 'types.ts');
const CHAVE = 'chave-falsa-de-teste-0123456789abcdef';
const PRODUCAO = 'https://jvfhclubfpxrtrrazrgr.supabase.co';

// ── Schema real (types.ts) ───────────────────────────────────────────────────

function lerSchema() {
  const tabelas = {};
  const enums = {};
  let emPublic = false, bloco = null, tabela = null, parte = null, enumAtual = null;
  for (const linha of fs.readFileSync(TYPES, 'utf8').split('\n')) {
    if (/^ {2}public: \{/.test(linha)) { emPublic = true; continue; }
    if (!emPublic) continue;
    if (/^ {2}\}/.test(linha)) break;
    let m;
    if ((m = /^ {4}(\w+): \{/.exec(linha))) { bloco = m[1]; continue; }
    if (bloco === 'Tables') {
      if ((m = /^ {6}(\w+): \{$/.exec(linha))) { tabela = m[1]; tabelas[tabela] = { Row: {}, Insert: {} }; continue; }
      if ((m = /^ {8}(Row|Insert|Update|Relationships): /.exec(linha))) { parte = m[1]; continue; }
      if ((parte === 'Row' || parte === 'Insert') && (m = /^ {10}(\w+)(\??): (.*)$/.exec(linha))) {
        tabelas[tabela][parte][m[1]] = { opcional: m[2] === '?', tipo: m[3] };
      }
    } else if (bloco === 'Enums') {
      if ((m = /^ {6}(\w+):(.*)$/.exec(linha))) { enumAtual = m[1]; enums[enumAtual] = []; }
      if (enumAtual) for (const v of linha.replace(/^ {6}\w+:/, '').matchAll(/"([^"]+)"/g)) enums[enumAtual].push(v[1]);
    }
  }
  return { tabelas, enums };
}
const SCHEMA = lerSchema();

// O que types.ts não diz. Fonte: replay de supabase/migrations/ num Postgres 16 local
// (pg_constraint/pg_indexes) — migrations são histórico; conferir no banco ao vivo quando puder.
const UNICOS = {
  profiles: [['id']], user_roles: [['id'], ['user_id', 'role']], user_levels: [['id'], ['user_id']],
  clientes: [['id']], fornecedores: [['id']], transportadoras: [['id'], ['cnpj']],
  coletas: [['id'], ['numero_coleta']], entregas: [['id'], ['numero_entrega']],
  ocorrencias: [['id']], cotacoes_frete: [['id']], achievements: [['id'], ['code']],
  reward_items: [['id']], conciliacoes: [['id']], notifications: [['id']],
  ip_access_rules: [['id']], geo_blocking_rules: [['id'], ['country_code']],
  audit_logs: [], system_heartbeat: [['service_name']],
};
const CHECKS = {
  conciliacoes: { tipo: ['faturas_entregas', 'custos_previstos_realizados', 'pagamentos_notas'], status: ['rascunho', 'em_andamento', 'concluida', 'arquivada'] },
  ip_access_rules: { rule_type: ['whitelist', 'blacklist'] },
  achievements: { rarity: ['common', 'rare', 'epic', 'legendary'] },
};
const FKS = {
  coletas: { fornecedor_id: 'fornecedores' },
  entregas: { cliente_id: 'clientes', transportadora_id: 'transportadoras' },
  ocorrencias: { entrega_id: 'entregas' },
  cotacoes_frete: { entrega_id: 'entregas', transportadora_id: 'transportadoras' },
};
// Chave natural de cada tabela semeada: é o que tem de ficar igual entre execuções.
const CHAVES = {
  profiles: ['email'], user_roles: ['user_id', 'role'], user_levels: ['user_id'],
  clientes: ['cnpj'], fornecedores: ['cnpj'], transportadoras: ['cnpj'],
  coletas: ['numero_coleta'], entregas: ['numero_entrega'],
  ocorrencias: ['entrega_id', 'tipo_ocorrencia'], cotacoes_frete: ['entrega_id', 'transportadora_id'],
  achievements: ['code'], reward_items: ['name'], conciliacoes: ['nome'],
  notifications: ['user_id', 'title'], ip_access_rules: ['ip_pattern', 'rule_type'],
  geo_blocking_rules: ['country_code'], audit_logs: ['record_id', 'table_name'], system_heartbeat: ['service_name'],
};
const ESPERADO = {
  profiles: 4, user_roles: 5, user_levels: 4, clientes: 10, fornecedores: 10, transportadoras: 8, coletas: 12,
  entregas: 15, ocorrencias: 8, cotacoes_frete: 10, achievements: 8, reward_items: 6, conciliacoes: 8,
  notifications: 5, ip_access_rules: 1, geo_blocking_rules: 1, audit_logs: 5, system_heartbeat: 1,
};

// ── Servidor falso (GoTrue admin + PostgREST) ────────────────────────────────

class ErroPg extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

function validarLinha(tabela, linha) {
  const def = SCHEMA.tabelas[tabela];
  for (const [col, valor] of Object.entries(linha)) {
    if (!def.Row[col]) throw new ErroPg(400, 'PGRST204', `Could not find the '${col}' column of '${tabela}' in the schema cache`);
    const en = /Enums"\]\["(\w+)"\]/.exec(def.Row[col].tipo);
    if (en && valor !== null && !SCHEMA.enums[en[1]].includes(valor)) {
      throw new ErroPg(400, '22P02', `invalid input value for enum ${en[1]}: "${valor}"`);
    }
    const permitido = CHECKS[tabela]?.[col];
    if (permitido && valor !== null && !permitido.includes(valor)) {
      throw new ErroPg(400, '23514', `new row for relation "${tabela}" violates check constraint "${tabela}_${col}_check"`);
    }
  }
  for (const [col, info] of Object.entries(def.Insert)) {
    if (!info.opcional && (linha[col] === undefined || linha[col] === null)) {
      throw new ErroPg(400, '23502', `null value in column "${col}" of relation "${tabela}" violates not-null constraint`);
    }
  }
}

function listaIn(texto) { // in.(a,"b,c",d)
  const dentro = texto.slice(texto.indexOf('(') + 1, texto.lastIndexOf(')'));
  const itens = [];
  for (const m of dentro.matchAll(/"((?:[^"\\]|\\.)*)"|([^,]+)/g)) itens.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : m[2]);
  return itens;
}

/**
 * opts: usuarios [{email}] pré-existentes no Auth; tabelas {nome: [linhas]} pré-existentes;
 * falhar {alvo: {status, metodo?}} onde alvo é nome de tabela, 'auth:listar' ou 'auth:criar';
 * travar: nunca responde; chave: a service key aceita.
 */
async function iniciarFake(opts = {}) {
  const tabelas = Object.fromEntries(Object.keys(SCHEMA.tabelas).map((t) => [t, []]));
  for (const [t, linhas] of Object.entries(opts.tabelas ?? {})) tabelas[t].push(...linhas.map((l) => ({ id: randomUUID(), ...l })));
  const usuarios = (opts.usuarios ?? []).map((u) => ({ id: randomUUID(), ...u }));
  const requisicoes = [];
  const conexoes = new Set();

  const gatilhosDeSignup = (u) => { // handle_new_user + handle_new_user_levels
    tabelas.profiles.push({ id: u.id, email: u.email, full_name: u.user_metadata?.full_name ?? '' });
    tabelas.user_roles.push({ id: randomUUID(), user_id: u.id, role: 'user' });
    tabelas.user_levels.push({ id: randomUUID(), user_id: u.id, level: 1, coins: 0, total_xp: 0 });
  };
  usuarios.forEach(gatilhosDeSignup);

  function auth(req, url, corpo) {
    if (req.method === 'GET' && url.pathname === '/auth/v1/admin/users') {
      if (opts.falhar?.['auth:listar']) throw new ErroPg(opts.falhar['auth:listar'].status, 'unexpected_failure', 'falha injetada ao listar');
      const page = Number(url.searchParams.get('page') || 1);
      const perPage = Number(url.searchParams.get('per_page') || 50);
      return { status: 200, json: { users: usuarios.slice((page - 1) * perPage, page * perPage), aud: 'authenticated' } };
    }
    if (req.method === 'POST' && url.pathname === '/auth/v1/admin/users') {
      if (opts.falhar?.['auth:criar']) throw new ErroPg(opts.falhar['auth:criar'].status, 'unexpected_failure', 'falha injetada ao criar');
      if (usuarios.some((u) => u.email === corpo.email)) {
        throw new ErroPg(422, 'email_exists', 'A user with this email address has already been registered');
      }
      const u = { id: randomUUID(), email: corpo.email, user_metadata: corpo.user_metadata ?? {}, senha: corpo.password };
      usuarios.push(u);
      gatilhosDeSignup(u);
      return { status: 200, json: { id: u.id, email: u.email, user_metadata: u.user_metadata } };
    }
    throw new ErroPg(404, 'not_found', `rota de auth desconhecida: ${req.method} ${url.pathname}`);
  }

  function rest(req, url, corpo) {
    const tabela = url.pathname.slice('/rest/v1/'.length);
    if (!SCHEMA.tabelas[tabela]) throw new ErroPg(404, 'PGRST205', `Could not find the table 'public.${tabela}' in the schema cache`);
    const inj = opts.falhar?.[tabela];
    if (inj && (!inj.metodo || inj.metodo === req.method)) throw new ErroPg(inj.status, inj.code ?? 'XX000', inj.message ?? `falha injetada em ${tabela}`);
    const colunas = SCHEMA.tabelas[tabela].Row;
    const projetar = (linhas) => {
      const sel = url.searchParams.get('select');
      let saida = linhas;
      if (sel && sel !== '*') {
        const cols = sel.split(',');
        for (const c of cols) if (!colunas[c]) throw new ErroPg(400, '42703', `column ${tabela}.${c} does not exist`);
        saida = linhas.map((l) => Object.fromEntries(cols.map((c) => [c, l[c] ?? null])));
      }
      if (!String(req.headers.accept ?? '').includes('vnd.pgrst.object')) return saida;
      // .single()/.maybeSingle(): o PostgREST devolve um objeto, e 406 se não for exatamente uma linha
      if (saida.length !== 1) throw new ErroPg(406, 'PGRST116', 'JSON object requested, multiple (or no) rows returned');
      return saida[0];
    };

    if (req.method === 'GET') {
      let linhas = tabelas[tabela];
      for (const [col, filtro] of url.searchParams) {
        if (col === 'select') continue;
        if (!colunas[col]) throw new ErroPg(400, '42703', `column ${tabela}.${col} does not exist`);
        if (filtro.startsWith('in.')) { const vs = listaIn(filtro); linhas = linhas.filter((l) => vs.includes(String(l[col]))); }
        else if (filtro.startsWith('eq.')) linhas = linhas.filter((l) => String(l[col]) === filtro.slice(3));
        else throw new ErroPg(400, 'PGRST100', `filtro não suportado pelo servidor de teste: ${col}=${filtro}`);
      }
      return { status: 200, json: projetar(linhas) };
    }

    if (req.method === 'POST') {
      const prefer = String(req.headers.prefer ?? '');
      const linhas = Array.isArray(corpo) ? corpo : [corpo];
      const upsert = /resolution=(merge|ignore)-duplicates/.test(prefer);
      const conflito = url.searchParams.get('on_conflict')?.split(',');
      if (upsert) {
        const alvo = conflito ?? UNICOS[tabela]?.[0];
        if (!alvo || !(UNICOS[tabela] ?? []).some((u) => u.length === alvo.length && u.every((c) => alvo.includes(c)))) {
          throw new ErroPg(400, '42P10', 'there is no unique or exclusion constraint matching the ON CONFLICT specification');
        }
      }
      const saida = [];
      const novas = [];
      for (const linha of linhas) {
        validarLinha(tabela, linha);
        for (const [col, alvo] of Object.entries(FKS[tabela] ?? {})) {
          if (linha[col] != null && !tabelas[alvo].some((l) => l.id === linha[col])) {
            throw new ErroPg(409, '23503', `insert or update on table "${tabela}" violates foreign key constraint (${col})`);
          }
        }
        const igual = (cols) => (l) => cols.every((c) => l[c] !== undefined && linha[c] !== undefined && String(l[c]) === String(linha[c]));
        if (upsert) {
          const existente = [...tabelas[tabela], ...novas].find(igual(conflito ?? UNICOS[tabela][0]));
          if (existente) { if (/merge/.test(prefer)) Object.assign(existente, linha); saida.push(existente); continue; }
        }
        for (const cols of UNICOS[tabela] ?? []) {
          if ([...tabelas[tabela], ...novas].some(igual(cols))) {
            throw new ErroPg(409, '23505', `duplicate key value violates unique constraint "${tabela}_${cols.join('_')}_key"`);
          }
        }
        const nova = { ...(colunas.id ? { id: randomUUID() } : {}), ...linha };
        novas.push(nova);
        saida.push(nova);
      }
      tabelas[tabela].push(...novas); // tudo ou nada, como um INSERT de várias linhas
      return /return=representation/.test(prefer) ? { status: 201, json: projetar(saida) } : { status: 201, json: null };
    }
    throw new ErroPg(405, 'PGRST000', `método não esperado do seed: ${req.method}`);
  }

  const servidor = http.createServer((req, res) => {
    let bruto = '';
    req.on('data', (c) => { bruto += c; });
    req.on('end', () => {
      const url = new URL(req.url, 'http://fake');
      const corpo = bruto ? JSON.parse(bruto) : null;
      const reg = { metodo: req.method, caminho: url.pathname, query: Object.fromEntries(url.searchParams), corpo, prefer: req.headers.prefer ?? '' };
      requisicoes.push(reg);
      if (opts.travar) return; // nunca responde
      let resp;
      try {
        if (req.headers.apikey !== (opts.chave ?? CHAVE) || req.headers.authorization !== `Bearer ${opts.chave ?? CHAVE}`) {
          throw new ErroPg(401, 'PGRST301', 'Invalid API key');
        }
        resp = url.pathname.startsWith('/auth/v1/') ? auth(req, url, corpo) : rest(req, url, corpo);
      } catch (e) {
        if (!(e instanceof ErroPg)) throw e;
        resp = { status: e.status, json: { code: e.code, error_code: e.code, message: e.message, msg: e.message, details: null, hint: null } };
      }
      reg.status = resp.status;
      res.writeHead(resp.status, { 'content-type': 'application/json' });
      res.end(resp.json === null ? '' : JSON.stringify(resp.json));
    });
  });
  servidor.on('connection', (s) => { conexoes.add(s); s.on('close', () => conexoes.delete(s)); });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  return {
    url: `http://127.0.0.1:${servidor.address().port}`,
    tabelas, usuarios, requisicoes,
    chaves: () => Object.fromEntries(Object.entries(CHAVES).map(([t, cols]) => [t, tabelas[t].map((l) => cols.map((c) => l[c]).join('|')).sort()])),
    fechar: () => new Promise((ok) => { for (const s of conexoes) s.destroy(); servidor.close(ok); }),
  };
}

// ── Execução do seed ─────────────────────────────────────────────────────────

let tmp;
before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-unit-'));
  // Sentinela: só 127.0.0.1 passa; qualquer outro destino é anotado e recusado.
  fs.writeFileSync(path.join(tmp, 'sentinela.mjs'), `
import fs from 'node:fs';
const real = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = String(input?.url ?? input);
  if (new URL(url).hostname === '127.0.0.1') return real(input, init);
  fs.appendFileSync(process.env.SEED_TESTE_SENTINELA, url + '\\n');
  return Promise.reject(new TypeError('rede bloqueada pela sentinela do teste'));
};`);
});
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

let serie = 0;
/** Roda o seed. Devolve { status, saida (stdout+stderr), stdout, stderr, fora: URLs que tentou fora de 127.0.0.1 }. */
function rodar(args = [], env = {}, { cwd = RAIZ, limiteMs = 60000 } = {}) {
  const marcador = path.join(tmp, `fora-${++serie}.txt`);
  fs.writeFileSync(marcador, '');
  const limpo = { ...process.env };
  for (const k of ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SEED_PASSWORD', 'SEED_TIMEOUT_MS', 'NODE_OPTIONS']) delete limpo[k];
  return new Promise((resolve, reject) => {
    const filho = spawn(process.execPath, [TSX, SEED, ...args], {
      cwd,
      env: { ...limpo, ...env, SEED_TESTE_SENTINELA: marcador, NODE_OPTIONS: `--import ${pathToFileURL(path.join(tmp, 'sentinela.mjs')).href}` },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true, // grupo próprio: o tsx sobe um node filho, e o limite tem de derrubar os dois
    });
    let stdout = '', stderr = '';
    filho.stdout.on('data', (d) => { stdout += d; });
    filho.stderr.on('data', (d) => { stderr += d; });
    const relogio = setTimeout(() => {
      try { process.kill(-filho.pid, 'SIGKILL'); } catch { /* já terminou */ }
      reject(new Error(`seed não terminou em ${limiteMs} ms\n${stdout}\n${stderr}`));
    }, limiteMs);
    filho.on('close', (status) => {
      clearTimeout(relogio);
      const saida = stdout + stderr;
      // Nenhum pedaço da chave (janela de 8 caracteres) pode aparecer em lugar nenhum.
      const chave = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
      for (let i = 0; i + 8 <= chave.length; i++) {
        if (saida.includes(chave.slice(i, i + 8))) {
          reject(new assert.AssertionError({ message: `trecho da service key na saída: "${chave.slice(i, i + 8)}…"` }));
          return;
        }
      }
      resolve({ status, saida, stdout, stderr, fora: fs.readFileSync(marcador, 'utf8').split('\n').filter(Boolean) });
    });
  });
}
const envDe = (fake, extra = {}) => ({ SUPABASE_URL: fake.url, SUPABASE_SERVICE_ROLE_KEY: CHAVE, ...extra });
const contagens = (fake) => Object.fromEntries(Object.keys(ESPERADO).map((t) => [t, fake.tabelas[t].length]));
const escritas = (fake) => fake.requisicoes.filter((r) => r.metodo !== 'GET');
async function comFake(opts, fn) {
  const fake = await iniciarFake(opts);
  try { return await fn(fake); } finally { await fake.fechar(); }
}

// ── Testes ───────────────────────────────────────────────────────────────────

describe('servidor de teste recusa o que o banco recusaria', { concurrency: true }, () => {
  const post = (fake, tabela, corpo, query = '', prefer = 'return=representation') => fetch(`${fake.url}/rest/v1/${tabela}${query}`, {
    method: 'POST', headers: { apikey: CHAVE, authorization: `Bearer ${CHAVE}`, 'content-type': 'application/json', prefer }, body: JSON.stringify(corpo),
  }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));

  test('types.ts tem as 18 tabelas que o seed usa', () => {
    for (const t of Object.keys(ESPERADO)) assert.ok(SCHEMA.tabelas[t], `tabela ${t} não está em types.ts`);
    assert.deepEqual(SCHEMA.enums.app_role, ['admin', 'user']);
  });
  test('coluna inexistente, obrigatória ausente, enum inválido, CHECK, ON CONFLICT sem UNIQUE, FK', () => comFake({}, async (fake) => {
    assert.equal((await post(fake, 'ip_access_rules', { ip_pattern: '1.1.1.1', rule_type: 'blacklist', descricao: 'x' })).json.code, 'PGRST204');
    assert.equal((await post(fake, 'geo_blocking_rules', { country_code: 'BR' })).json.code, '23502');
    assert.equal((await post(fake, 'notifications', { user_id: 'u', title: 't', message: 'm', type: 'urgente' })).json.code, '22P02');
    assert.equal((await post(fake, 'ip_access_rules', { ip_pattern: '1.1.1.1', rule_type: 'deny' })).json.code, '23514');
    assert.equal((await post(fake, 'clientes', { razao_social: 'a', endereco_completo: 'b', cnpj: '1' }, '?on_conflict=cnpj', 'resolution=merge-duplicates')).json.code, '42P10');
    assert.equal((await post(fake, 'ocorrencias', { entrega_id: randomUUID(), tipo_ocorrencia: 'atraso' })).json.code, '23503');
    assert.equal((await post(fake, 'tabela_que_nao_existe', {})).json.code, 'PGRST205');
    assert.equal((await post(fake, 'achievements', { code: 'c', name: 'n', description: 'd', requirement_type: 'x' })).status, 201);
    assert.equal((await post(fake, 'achievements', { code: 'c', name: 'n', description: 'd', requirement_type: 'x' })).json.code, '23505');
  }));
});

describe('guardas antes de qualquer requisição', { concurrency: true }, () => {
  test('sem SUPABASE_SERVICE_ROLE_KEY: sai com 1 e não chama nada', () => comFake({}, async (fake) => {
    const r = await rodar([], { SUPABASE_URL: fake.url });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.equal(fake.requisicoes.length, 0);
  }));
  test('SUPABASE_SERVICE_ROLE_KEY só com espaços conta como ausente', () => comFake({}, async (fake) => {
    const r = await rodar([], { SUPABASE_URL: fake.url, SUPABASE_SERVICE_ROLE_KEY: '   ' });
    assert.equal(r.status, 1);
    assert.equal(fake.requisicoes.length, 0);
  }));
  test('sem URL: não cai em produção por padrão', async () => {
    const r = await rodar([], { SUPABASE_SERVICE_ROLE_KEY: CHAVE });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /SUPABASE_URL/);
    assert.deepEqual(r.fora, []);
  });
  for (const [nome, env] of [
    ['exata', { SUPABASE_URL: PRODUCAO }],
    ['com barra final', { SUPABASE_URL: `${PRODUCAO}/` }],
    ['em maiúsculas', { SUPABASE_URL: PRODUCAO.toUpperCase().replace('HTTPS', 'https') }],
    ['via VITE_SUPABASE_URL', { VITE_SUPABASE_URL: PRODUCAO }],
    ['nas duas variáveis', { SUPABASE_URL: PRODUCAO, VITE_SUPABASE_URL: `${PRODUCAO}/` }],
  ]) {
    test(`URL de produção (${nome}) sem --confirmar-producao: recusa sem tocar na rede`, async () => {
      const r = await rodar([], { ...env, SUPABASE_SERVICE_ROLE_KEY: CHAVE, SEED_PASSWORD: 'senha-senha-11' });
      assert.equal(r.status, 1);
      assert.match(r.stderr, /PRODUÇÃO/);
      assert.match(r.stderr, /--confirmar-producao/);
      assert.deepEqual(r.fora, []);
    });
  }
  test('produção confirmada mas com a senha padrão do repositório: recusa', async () => {
    const r = await rodar(['--confirmar-producao'], { SUPABASE_URL: PRODUCAO, SUPABASE_SERVICE_ROLE_KEY: CHAVE });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /SEED_PASSWORD/);
    assert.deepEqual(r.fora, []);
  });
  test('produção confirmada + senha própria: só então tenta a rede (bloqueada pela sentinela) e falha sem vazar senha', async () => {
    const r = await rodar(['--confirmar-producao'], { SUPABASE_URL: PRODUCAO, SUPABASE_SERVICE_ROLE_KEY: CHAVE, SEED_PASSWORD: 'senha-senha-11' });
    assert.equal(r.status, 1);
    assert.ok(r.fora.length >= 1 && r.fora.every((u) => u.startsWith(PRODUCAO)), `esperava tentativa só em produção: ${r.fora}`);
    assert.match(r.stdout, /Alvo: PRODUÇÃO/);
    assert.ok(!r.saida.includes('senha-senha-11'));
    assert.ok(!/concluído com sucesso/.test(r.saida));
  });
  test('origem do cutover (hgicfqjayrjurivtygqf): recusa mesmo com --confirmar-producao', async () => {
    const r = await rodar(['--confirmar-producao'], { SUPABASE_URL: 'https://hgicfqjayrjurivtygqf.supabase.co', SUPABASE_SERVICE_ROLE_KEY: CHAVE, SEED_PASSWORD: 'senha-senha-11' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /origem/);
    assert.deepEqual(r.fora, []);
  });
  test('SUPABASE_URL e VITE_SUPABASE_URL diferentes: recusa em vez de escolher uma', () => comFake({}, async (fake) => {
    const r = await rodar([], { ...envDe(fake), VITE_SUPABASE_URL: PRODUCAO });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /diferentes/);
    assert.equal(fake.requisicoes.length, 0);
    assert.deepEqual(r.fora, []);
  }));
  for (const url of ['ftp://exemplo.test', 'exemplo.test', 'http://127.0.0.1:9/rest/v1']) {
    test(`URL inválida (${url}): recusa`, async () => {
      const r = await rodar([], { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: CHAVE });
      assert.equal(r.status, 1);
      assert.match(r.stderr, /inválida/);
      assert.deepEqual(r.fora, []);
    });
  }
  for (const flag of ['--dryrun', '--dry-run=true', '--apply', 'extra']) {
    test(`argumento desconhecido (${flag}): recusa em vez de gravar`, () => comFake({}, async (fake) => {
      const r = await rodar([flag], envDe(fake));
      assert.equal(r.status, 1);
      assert.match(r.stderr, /desconhecido/);
      assert.equal(fake.requisicoes.length, 0);
    }));
  }
  test('SEED_TIMEOUT_MS inválido: recusa', () => comFake({}, async (fake) => {
    const r = await rodar([], envDe(fake, { SEED_TIMEOUT_MS: 'abc' }));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /SEED_TIMEOUT_MS/);
    assert.equal(fake.requisicoes.length, 0);
  }));
  test('--help: mostra o uso, sai com 0 e não chama nada', () => comFake({}, async (fake) => {
    const r = await rodar(['--help'], envDe(fake));
    assert.equal(r.status, 0);
    assert.match(r.stdout, /--dry-run/);
    assert.equal(fake.requisicoes.length, 0);
  }));
});

describe('--dry-run', { concurrency: true }, () => {
  test('não faz nenhuma requisição e lista o plano das 18 tabelas', () => comFake({}, async (fake) => {
    const r = await rodar(['--dry-run'], envDe(fake));
    assert.equal(r.status, 0, r.saida);
    assert.equal(fake.requisicoes.length, 0);
    assert.deepEqual(r.fora, []);
    const plano = { ...ESPERADO, user_roles: 4, user_levels: 3 }; // sem as linhas que os gatilhos de signup criam
    for (const [t, n] of Object.entries(plano)) assert.match(r.stdout, new RegExp(`- ${t}: ${n}\\b`), `plano sem ${t}: ${n}`);
    assert.match(r.stdout, /nada foi gravado/);
  }));
  test('funciona sem chave e sem URL', async () => {
    const r = await rodar(['--dry-run']);
    assert.equal(r.status, 0, r.saida);
    assert.deepEqual(r.fora, []);
  });
  test('com URL de produção: avisa o alvo e continua sem requisição', async () => {
    const r = await rodar(['--dry-run'], { SUPABASE_URL: PRODUCAO, SUPABASE_SERVICE_ROLE_KEY: CHAVE });
    assert.equal(r.status, 0, r.saida);
    assert.match(r.stdout, /PRODUÇÃO/);
    assert.deepEqual(r.fora, []);
  });
});

describe('execução completa', { concurrency: true }, () => {
  test('banco vazio: tudo entra, nenhuma requisição é recusada, FKs fecham', () => comFake({}, async (fake) => {
    const r = await rodar([], envDe(fake));
    assert.equal(r.status, 0, r.saida);
    assert.deepEqual(fake.requisicoes.filter((q) => q.status >= 400), []);
    assert.deepEqual(contagens(fake), ESPERADO);
    assert.deepEqual(r.fora, []);
    assert.deepEqual(fake.usuarios.map((u) => u.email).sort(), ['admin@loggiflow.com.br', 'user1@loggiflow.com.br', 'user2@loggiflow.com.br', 'user3@loggiflow.com.br']);
    const admin = fake.usuarios.find((u) => u.email === 'admin@loggiflow.com.br');
    assert.ok(fake.tabelas.user_roles.some((l) => l.user_id === admin.id && l.role === 'admin'));
    assert.equal(fake.tabelas.profiles.find((l) => l.id === admin.id).cargo, 'Administrador');
    for (const [t, fks] of Object.entries(FKS)) {
      for (const l of fake.tabelas[t]) for (const [col, alvo] of Object.entries(fks)) {
        assert.ok(fake.tabelas[alvo].some((x) => x.id === l[col]), `${t}.${col} aponta para ${alvo} inexistente`);
      }
    }
    for (const l of fake.tabelas.notifications) assert.equal(l.user_id, admin.id);
    assert.match(r.stdout, /concluído com sucesso/);
    assert.match(r.stdout, /- clientes: 10 novo\(s\), 0 já existia\(m\)/);
    assert.match(r.stdout, /Login admin: admin@loggiflow\.com\.br \/ LoggiFlow@2026/);
  }));

  test('toda escrita só usa coluna que existe em types.ts e ON CONFLICT com UNIQUE', () => comFake({}, async (fake) => {
    assert.equal((await rodar([], envDe(fake))).status, 0);
    const usadas = new Set();
    for (const q of escritas(fake).filter((x) => x.caminho.startsWith('/rest/v1/'))) {
      const t = q.caminho.slice('/rest/v1/'.length);
      usadas.add(t);
      for (const linha of [q.corpo].flat()) for (const col of Object.keys(linha)) assert.ok(SCHEMA.tabelas[t].Row[col], `${t}.${col} não existe`);
      if (q.query.on_conflict) {
        const alvo = q.query.on_conflict.split(',');
        assert.ok(UNICOS[t].some((u) => u.length === alvo.length && u.every((c) => alvo.includes(c))), `${t}: sem UNIQUE em (${alvo})`);
      }
    }
    assert.deepEqual([...usadas].sort(), Object.keys(ESPERADO).sort());
  }));

  test('idempotência: a 2ª execução não grava linha nova e mantém as mesmas chaves', () => comFake({}, async (fake) => {
    assert.equal((await rodar([], envDe(fake))).status, 0);
    const chaves1 = fake.chaves();
    const ids1 = JSON.stringify(fake.tabelas.entregas.map((l) => l.id));
    const antes = fake.requisicoes.length;
    const r2 = await rodar([], envDe(fake));
    assert.equal(r2.status, 0, r2.saida);
    assert.deepEqual(contagens(fake), ESPERADO);
    assert.deepEqual(fake.chaves(), chaves1);
    assert.equal(JSON.stringify(fake.tabelas.entregas.map((l) => l.id)), ids1);
    assert.equal(fake.usuarios.length, 4);
    const escritas2 = fake.requisicoes.slice(antes).filter((q) => q.metodo !== 'GET').map((q) => q.caminho.slice('/rest/v1/'.length));
    assert.deepEqual(escritas2.sort(), ['profiles', 'user_levels', 'user_roles']); // só os upserts por usuário
    assert.match(r2.stdout, /- entregas: 0 novo\(s\), 15 já existia\(m\)/);
    assert.match(r2.stdout, /já existia — senha não alterada/);
    assert.ok(!r2.saida.includes('LoggiFlow@2026'));
  }));

  test('dois bancos vazios recebem exatamente o mesmo conjunto de chaves', async () => {
    // ids gerados pelo banco mudam de um para o outro; compara só as chaves que o seed escolhe
    const fixas = ['profiles', 'clientes', 'fornecedores', 'transportadoras', 'coletas', 'entregas', 'achievements', 'reward_items',
      'conciliacoes', 'ip_access_rules', 'geo_blocking_rules', 'audit_logs', 'system_heartbeat'];
    const vistas = [];
    for (let i = 0; i < 2; i++) {
      await comFake({}, async (fake) => {
        assert.equal((await rodar([], envDe(fake))).status, 0);
        const c = fake.chaves();
        vistas.push(Object.fromEntries(fixas.map((t) => [t, c[t]])));
      });
    }
    assert.deepEqual(vistas[0], vistas[1]);
    assert.equal(vistas[0].clientes.length, 10);
  });

  test('retoma depois de falha parcial: a reexecução completa o que faltou sem duplicar', async () => {
    const falhar = { conciliacoes: { status: 500 } };
    await comFake({ falhar }, async (fake) => {
      const r1 = await rodar([], envDe(fake));
      assert.equal(r1.status, 1);
      assert.equal(fake.tabelas.entregas.length, 15);
      assert.equal(fake.tabelas.notifications.length, 0);
      assert.match(r1.stderr, /reexecute/);
      delete falhar.conciliacoes;
      const r2 = await rodar([], envDe(fake));
      assert.equal(r2.status, 0, r2.saida);
      assert.deepEqual(contagens(fake), ESPERADO);
    });
  });

  test('dado pré-existente não é sobrescrito nem duplicado; só o que falta entra', () => comFake({
    tabelas: {
      achievements: [{ code: 'first_delivery', name: 'Nome editado em produção', description: 'd', requirement_type: 'deliveries', xp_reward: 999 }],
      reward_items: [{ name: 'Kit Loggi', description: 'descrição real', coins_cost: 1 }],
      transportadoras: [{ cnpj: '99.003.001/0001-00', razao_social: 'Já cadastrada', nome_fantasia: 'JC', email_comercial: 'a@b.c', contato_comercial: 'x' }],
      system_heartbeat: [{ service_name: 'api', status: 'degraded' }],
    },
  }, async (fake) => {
    const r = await rodar([], envDe(fake));
    assert.equal(r.status, 0, r.saida);
    assert.deepEqual(contagens(fake), ESPERADO);
    assert.equal(fake.tabelas.achievements.find((l) => l.code === 'first_delivery').xp_reward, 999);
    assert.equal(fake.tabelas.reward_items.find((l) => l.name === 'Kit Loggi').coins_cost, 1);
    assert.equal(fake.tabelas.transportadoras.find((l) => l.cnpj === '99.003.001/0001-00').razao_social, 'Já cadastrada');
    assert.equal(fake.tabelas.system_heartbeat[0].status, 'degraded');
    assert.match(r.stdout, /- achievements: 7 novo\(s\), 1 já existia\(m\)/);
  }));

  test('admin já existe e está além da 1ª página do Auth (450 usuários): reaproveita, não recria', () => comFake({
    usuarios: [...Array.from({ length: 430 }, (_, i) => ({ email: `real${i}@empresa.test` })), { email: 'admin@loggiflow.com.br' }, ...Array.from({ length: 19 }, (_, i) => ({ email: `outro${i}@empresa.test` }))],
  }, async (fake) => {
    const adminId = fake.usuarios[430].id;
    const r = await rodar([], envDe(fake));
    assert.equal(r.status, 0, r.saida);
    assert.equal(fake.usuarios.filter((u) => u.email === 'admin@loggiflow.com.br').length, 1);
    assert.equal(fake.usuarios.length, 453);
    assert.ok(fake.tabelas.user_roles.some((l) => l.user_id === adminId && l.role === 'admin'));
    assert.equal(fake.tabelas.conciliacoes[0].created_by, adminId);
    assert.match(r.stdout, /já existia — senha não alterada/);
  }));

  test('SEED_PASSWORD própria: vai para o Auth e nunca para a saída', () => comFake({}, async (fake) => {
    const r = await rodar([], envDe(fake, { SEED_PASSWORD: 'Outra$Senha 123' }));
    assert.equal(r.status, 0, r.saida);
    assert.ok(fake.usuarios.every((u) => u.senha === 'Outra$Senha 123'));
    assert.ok(!r.saida.includes('Outra$Senha 123'));
    assert.match(r.stdout, /valor de SEED_PASSWORD/);
  }));

  test('roda a partir de outro diretório (cwd fora do repo)', () => comFake({}, async (fake) => {
    const r = await rodar([], envDe(fake), { cwd: tmp });
    assert.equal(r.status, 0, r.saida);
    assert.deepEqual(contagens(fake), ESPERADO);
  }));

  test('URL com barra final e via VITE_SUPABASE_URL também funcionam', () => comFake({}, async (fake) => {
    const r = await rodar([], { VITE_SUPABASE_URL: `${fake.url}/`, SUPABASE_SERVICE_ROLE_KEY: CHAVE });
    assert.equal(r.status, 0, r.saida);
    assert.deepEqual(contagens(fake), ESPERADO);
  }));
});

describe('erro não é engolido', { concurrency: true }, () => {
  for (const alvo of ['profiles', 'user_roles', 'user_levels', 'clientes', 'fornecedores', 'transportadoras', 'coletas', 'entregas', 'ocorrencias',
    'cotacoes_frete', 'achievements', 'reward_items', 'conciliacoes', 'notifications', 'ip_access_rules', 'geo_blocking_rules', 'audit_logs',
    'system_heartbeat', 'auth:listar', 'auth:criar']) {
    test(`falha em ${alvo}: sai com código ≠ 0, diz onde foi e não anuncia sucesso`, () => comFake({ falhar: { [alvo]: { status: 500 } } }, async (fake) => {
      const r = await rodar([], envDe(fake));
      assert.equal(r.status, 1, r.saida);
      assert.match(r.stderr, /Erro durante seed/);
      assert.match(r.stderr, new RegExp(alvo.startsWith('auth:') ? 'auth' : alvo));
      assert.match(r.stderr, /falha injetada/); // a mensagem do banco chega ao operador
      assert.ok(!/concluído com sucesso/.test(r.saida));
      assert.ok(!/TypeError|Cannot read prop/.test(r.saida), r.saida);
    }));
  }
  for (const alvo of ['clientes', 'entregas', 'notifications', 'system_heartbeat']) {
    test(`consulta passa mas o INSERT em ${alvo} é recusado: mesma falha explícita`, () => comFake({ falhar: { [alvo]: { status: 500, metodo: 'POST' } } }, async (fake) => {
      const r = await rodar([], envDe(fake));
      assert.equal(r.status, 1, r.saida);
      assert.match(r.stderr, new RegExp(`${alvo} \\(insert\\): falha injetada`));
      assert.equal(fake.tabelas[alvo].length, 0);
      assert.ok(!/concluído com sucesso/.test(r.saida));
    }));
  }
  test('service key recusada (401): falha sem imprimir a chave', () => comFake({ chave: 'outra-chave-esperada-pelo-servidor' }, async (fake) => {
    const r = await rodar([], envDe(fake));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Erro durante seed/);
    assert.equal(fake.tabelas.clientes.length, 0);
  }));
  test('servidor que nunca responde: desiste no SEED_TIMEOUT_MS em vez de travar', () => comFake({ travar: true }, async (fake) => {
    const t0 = Date.now();
    const r = await rodar([], envDe(fake, { SEED_TIMEOUT_MS: '400' }), { limiteMs: 20000 });
    assert.equal(r.status, 1, r.saida);
    assert.match(r.stderr, /Erro durante seed/);
    assert.ok(Date.now() - t0 < 15000);
  }));
  test('servidor fora do ar (conexão recusada): falha com mensagem', async () => {
    const r = await rodar([], { SUPABASE_URL: 'http://127.0.0.1:9', SUPABASE_SERVICE_ROLE_KEY: CHAVE });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Erro durante seed/);
  });
});
