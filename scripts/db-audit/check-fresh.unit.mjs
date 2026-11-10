// Teste dos tres comparadores do types-sync (check-catalog-fresh, check-manifest-fresh,
// check-grants-fresh) e da manifest-lib. Cada caso roda o CLI como o workflow roda, com
// snapshots sinteticos em pasta temporaria. Offline, sem credencial.
// Rodar da raiz: node --test scripts/db-audit/check-fresh.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { MANIFEST_SECTIONS, compararManifestos, validarManifesto } from './manifest-lib.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const REF = 'abcdefghijklmnopqrst';
const DESTINO = `postgresql://postgres:segredo@db.${REF}.supabase.co:5432/postgres`;
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const md5 = (v) => crypto.createHash('md5').update(v).digest('hex');
const clone = (v) => JSON.parse(JSON.stringify(v));

const IDENTIDADE = {
  format_version: 1,
  connection_provider: 'supabase-cloud',
  project_ref_sha256: sha256(REF),
  database: 'postgres',
  schema: 'public',
  server_major: 17,
};

function catalogo() {
  return {
    format_version: 2,
    generated_at: '2026-11-09',
    source: 'postgres schema public',
    database_identity: { database: 'postgres', schema: 'public', server_major: 17 },
    how_to_regenerate: 'scripts/db-audit/catalog.sql',
    tables: ['coletas', 'entregas'],
    views: ['v_entregas'],
    enums: ['app_role'],
    columns: ['coletas.id:uuid:not-null', 'entregas.id:uuid:not-null', 'entregas.status:text:nullable'],
    functions: ['has_role'],
    function_signatures: ['has_role(_user_id uuid, _role app_role)->boolean|kind=f'],
    trigger_functions: ['set_updated_at'],
    check_constraints: ['entregas.valor_check:CHECK ((valor >= (0)::numeric))'],
  };
}

function manifesto() {
  const m = {
    format_version: 2,
    generated_at: '2026-11-09T00:00:00Z',
    database_identity: { database: 'postgres', schema: 'public', server_major: 17 },
    how_to_regenerate: 'scripts/db-audit/manifest.sql',
  };
  for (const secao of MANIFEST_SECTIONS) m[secao] = {};
  m.columns = { 'entregas.id': md5('uuid'), 'entregas.status': md5('text') };
  m.rls = { entregas: md5('true|false') };
  m.policies = { 'entregas."Admins veem tudo"': md5('r|true|authenticated') };
  m.relation_grants = { 'r:public.entregas|anon|SELECT|grantor=postgres': md5('false') };
  return m;
}

function grants() {
  return {
    generated_at: '2026-11-09',
    how_to_regenerate: 'scripts/db-audit/grants-baseline.sql (E26)',
    note: 'x',
    anon_execute: ['Zeta()', 'a_b()', 'has_role(_user_id uuid, _role app_role)'],
    anon_table_select: ['v_entregas'],
    authenticated_execute_count: 3,
    service_role_execute_count: 3,
  };
}

function ambiente() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-audit-check-'));
  const grava = (nome, valor) => {
    const arquivo = path.join(dir, nome);
    fs.writeFileSync(arquivo, typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2));
    return arquivo;
  };
  grava('identidade.json', IDENTIDADE);
  const rodar = (script, fresco, env = {}) => {
    const base = { ...process.env };
    for (const chave of ['DESTINO_URL', 'CATALOG_PATH', 'MANIFEST_PATH', 'GRANTS_BASELINE_PATH', 'CATALOG_IDENTITY_PATH']) {
      delete base[chave];
    }
    const args = [path.join(AQUI, script)];
    if (fresco !== undefined) args.push(fresco);
    const r = spawnSync(process.execPath, args, {
      cwd: RAIZ,
      encoding: 'utf8',
      env: {
        ...base,
        DESTINO_URL: DESTINO,
        CATALOG_IDENTITY_PATH: path.join(dir, 'identidade.json'),
        CATALOG_PATH: path.join(dir, 'catalogo.json'),
        MANIFEST_PATH: path.join(dir, 'manifesto.json'),
        GRANTS_BASELINE_PATH: path.join(dir, 'grants.json'),
        ...env,
      },
    });
    return { status: r.status, saida: r.stdout + r.stderr };
  };
  return { dir, grava, rodar, limpar: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function comAmbiente(nome, fn) {
  test(nome, () => {
    const amb = ambiente();
    try {
      fn(amb);
    } finally {
      amb.limpar();
    }
  });
}

// ---------------------------------------------------------------- catalogo

comAmbiente('catalogo: identico sai 0, mesmo com ordem e generated_at diferentes', ({ grava, rodar }) => {
  grava('catalogo.json', catalogo());
  const fresco = catalogo();
  fresco.generated_at = '2099-01-01';
  fresco.tables.reverse();
  fresco.columns.reverse();
  const r = rodar('check-catalog-fresh.mjs', grava('fresco.json', fresco));
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /OK: catalogo em sincronia/);
});

comAmbiente('catalogo: cada secao comparada acusa drift (exit 1) nos dois sentidos', ({ grava, rodar }) => {
  grava('catalogo.json', catalogo());
  for (const secao of ['tables', 'views', 'enums', 'columns', 'functions', 'function_signatures', 'check_constraints']) {
    const mais = catalogo();
    mais[secao].push('novo_objeto');
    let r = rodar('check-catalog-fresh.mjs', grava('fresco.json', mais));
    assert.equal(r.status, 1, secao + '\n' + r.saida);
    assert.match(r.saida, /criados no banco e ausentes do catalogo: novo_objeto/);

    const menos = catalogo();
    const removido = menos[secao].pop();
    r = rodar('check-catalog-fresh.mjs', grava('fresco.json', menos));
    assert.equal(r.status, 1, secao + '\n' + r.saida);
    assert.ok(r.saida.includes('removidos do banco mas ainda no catalogo: ' + removido), r.saida);
  }
});

comAmbiente('catalogo: mudanca de tipo ou nulabilidade de coluna e drift', ({ grava, rodar }) => {
  grava('catalogo.json', catalogo());
  const fresco = catalogo();
  fresco.columns[2] = 'entregas.status:text:not-null';
  const r = rodar('check-catalog-fresh.mjs', grava('fresco.json', fresco));
  assert.equal(r.status, 1, r.saida);
});

comAmbiente('catalogo: commitado ausente (primeira execucao) e drift revisavel, nao erro', ({ grava, rodar, dir }) => {
  const fresco = grava('fresco.json', catalogo());
  const r = rodar('check-catalog-fresh.mjs', fresco);
  assert.equal(r.status, 1, r.saida);
  assert.match(r.saida, /DRIFT: catalogo commitado ausente/);
  assert.ok(!fs.existsSync(path.join(dir, 'catalogo.json')));
});

comAmbiente('catalogo: commitado ausente NAO libera fresco sem identidade comprovada', ({ grava, rodar }) => {
  const outroBanco = catalogo();
  outroBanco.database_identity.server_major = 15;
  assert.equal(rodar('check-catalog-fresh.mjs', grava('fresco.json', outroBanco)).status, 2);

  const semSecao = catalogo();
  delete semSecao.enums;
  assert.equal(rodar('check-catalog-fresh.mjs', grava('fresco.json', semSecao)).status, 2);

  const duplicado = catalogo();
  duplicado.tables.push('coletas');
  assert.equal(rodar('check-catalog-fresh.mjs', grava('fresco.json', duplicado)).status, 2);

  const bom = grava('fresco.json', catalogo());
  assert.equal(rodar('check-catalog-fresh.mjs', bom, { DESTINO_URL: '' }).status, 2);
});

comAmbiente('catalogo: fresco nao confiavel sai 2 (nunca vira snapshot)', ({ grava, rodar, dir }) => {
  grava('catalogo.json', catalogo());
  const casos = {
    vazio: '',
    quebrado: '{',
    lista: '[]',
    nulo: 'null',
    'format_version errado': { ...catalogo(), format_version: 1 },
    'source de outro banco': { ...catalogo(), source: 'outro schema public' },
    'how_to_regenerate errado': { ...catalogo(), how_to_regenerate: 'x' },
    'identidade ausente': { ...catalogo(), database_identity: undefined },
    'secao com numero': { ...catalogo(), tables: [1, 2] },
    'secao duplicada': { ...catalogo(), views: ['v_entregas', 'v_entregas'] },
  };
  for (const [nome, valor] of Object.entries(casos)) {
    const r = rodar('check-catalog-fresh.mjs', grava('fresco.json', valor));
    assert.equal(r.status, 2, nome + '\n' + r.saida);
  }
  assert.equal(rodar('check-catalog-fresh.mjs', path.join(dir, 'nao-existe.json')).status, 2);
  assert.equal(rodar('check-catalog-fresh.mjs').status, 2);
});

comAmbiente('catalogo: destino nao comprovado sai 2', ({ grava, rodar }) => {
  grava('catalogo.json', catalogo());
  const fresco = grava('fresco.json', catalogo());
  const outro = `postgresql://postgres:segredo@db.zzzzzzzzzzzzzzzzzzzz.supabase.co:5432/postgres`;
  for (const DESTINO_URL of ['', outro, 'postgresql://u:p@127.0.0.1/postgres', DESTINO.replace(/\/postgres$/, '/outro')]) {
    const r = rodar('check-catalog-fresh.mjs', fresco, { DESTINO_URL });
    assert.equal(r.status, 2, DESTINO_URL + '\n' + r.saida);
    assert.ok(!r.saida.includes('segredo'), r.saida);
  }
});

comAmbiente('catalogo: commitado invalido (nao ausente) continua sendo drift ou erro, nunca 0', ({ grava, rodar }) => {
  const fresco = grava('fresco.json', catalogo());
  grava('catalogo.json', '{');
  assert.equal(rodar('check-catalog-fresh.mjs', fresco).status, 2);
  const semSecao = catalogo();
  delete semSecao.enums;
  grava('catalogo.json', semSecao);
  assert.equal(rodar('check-catalog-fresh.mjs', fresco).status, 1);
  grava('catalogo.json', { ...catalogo(), format_version: 1 });
  assert.equal(rodar('check-catalog-fresh.mjs', fresco).status, 1);
});

comAmbiente('caminho fora do repositorio e do diretorio temporario e recusado (exit 2)', ({ grava, rodar }) => {
  grava('catalogo.json', catalogo());
  grava('manifesto.json', manifesto());
  grava('grants.json', grants());
  for (const script of ['check-catalog-fresh.mjs', 'check-manifest-fresh.mjs', 'check-grants-fresh.mjs']) {
    for (const fora of ['/etc/passwd', '../'.repeat(24) + 'etc/hostname']) {
      const r = rodar(script, fora);
      assert.equal(r.status, 2, script + ' ' + fora + '\n' + r.saida);
      assert.match(r.saida, /fora das raizes permitidas/);
    }
  }
});

// ---------------------------------------------------------------- manifesto

comAmbiente('manifesto: identico sai 0; generated_at nao conta', ({ grava, rodar }) => {
  grava('manifesto.json', manifesto());
  const r = rodar('check-manifest-fresh.mjs', grava('fresco.json', { ...manifesto(), generated_at: '2099-01-01T00:00:00Z' }));
  assert.equal(r.status, 0, r.saida);
});

comAmbiente('manifesto: objeto novo, removido ou com hash diferente e drift em qualquer secao', ({ grava, rodar }) => {
  grava('manifesto.json', manifesto());
  for (const secao of MANIFEST_SECTIONS) {
    const novo = manifesto();
    novo[secao]['objeto.novo'] = md5('x');
    let r = rodar('check-manifest-fresh.mjs', grava('fresco.json', novo));
    assert.equal(r.status, 1, secao + '\n' + r.saida);
    assert.ok(r.saida.includes('so em banco: objeto.novo'), r.saida);
  }
  const alterado = manifesto();
  alterado.policies['entregas."Admins veem tudo"'] = md5('outra definicao');
  let r = rodar('check-manifest-fresh.mjs', grava('fresco.json', alterado));
  assert.equal(r.status, 1, r.saida);
  assert.ok(r.saida.includes('divergente: entregas."Admins veem tudo"'), r.saida);

  const removido = manifesto();
  delete removido.rls.entregas;
  r = rodar('check-manifest-fresh.mjs', grava('fresco.json', removido));
  assert.equal(r.status, 1, r.saida);
  assert.ok(r.saida.includes('so em arquivo: entregas'), r.saida);
});

comAmbiente('manifesto: commitado ausente e drift (1) so com fresco comprovado', ({ grava, rodar }) => {
  const fresco = grava('fresco.json', manifesto());
  assert.equal(rodar('check-manifest-fresh.mjs', fresco).status, 1);
  assert.equal(rodar('check-manifest-fresh.mjs', fresco, { DESTINO_URL: '' }).status, 2);
});

comAmbiente('manifesto: fresco invalido sai 2, inclusive JSON null', ({ grava, rodar }) => {
  grava('manifesto.json', manifesto());
  const casos = {
    nulo: 'null',
    lista: '[]',
    vazio: '',
    numero: '7',
    'sem secao': (() => { const m = manifesto(); delete m.policies; return m; })(),
    'hash que nao e md5': (() => { const m = manifesto(); m.rls.entregas = 'abc'; return m; })(),
    'format_version errado': { ...manifesto(), format_version: 1 },
    'outro banco': { ...manifesto(), database_identity: { database: 'x', schema: 'public', server_major: 17 } },
    'e um catalogo': catalogo(),
  };
  for (const [nome, valor] of Object.entries(casos)) {
    const r = rodar('check-manifest-fresh.mjs', grava('fresco.json', valor));
    assert.equal(r.status, 2, nome + '\n' + r.saida);
    assert.ok(!/TypeError/.test(r.saida), nome + '\n' + r.saida);
  }
});

comAmbiente('manifesto: commitado estruturalmente invalido e drift (1), JSON quebrado e erro (2)', ({ grava, rodar }) => {
  const fresco = grava('fresco.json', manifesto());
  grava('manifesto.json', catalogo());
  assert.equal(rodar('check-manifest-fresh.mjs', fresco).status, 1);
  grava('manifesto.json', '{');
  assert.equal(rodar('check-manifest-fresh.mjs', fresco).status, 2);
});

test('manifest-lib: validarManifesto e compararManifestos', () => {
  assert.deepEqual(validarManifesto(manifesto(), 'x'), []);
  assert.deepEqual(validarManifesto(null, 'x'), ['manifesto x: raiz precisa ser objeto JSON']);
  const semChave = manifesto();
  semChave.columns[''] = md5('x');
  assert.ok(validarManifesto(semChave, 'x').some((e) => e.includes('chave vazia')));

  const a = manifesto();
  const b = clone(a);
  assert.equal(compararManifestos(a, b).total, 0);
  b.columns['entregas.nova'] = md5('y');
  delete b.rls.entregas;
  b.policies['entregas."Admins veem tudo"'] = md5('z');
  const r = compararManifestos(a, b);
  assert.equal(r.total, 3);
  const por = Object.fromEntries(r.secoes.map((s) => [s.secao, s]));
  assert.deepEqual(por.columns.soEmB, ['entregas.nova']);
  assert.deepEqual(por.rls.soEmA, ['entregas']);
  assert.deepEqual(por.policies.divergentes, ['entregas."Admins veem tudo"']);
});

// ---------------------------------------------------------------- grants

comAmbiente('grants: identico sai 0; metadados (generated_at, note) nao contam', ({ grava, rodar }) => {
  grava('grants.json', grants());
  const fresco = { ...grants(), generated_at: '2099-01-01', note: 'outra nota' };
  const r = rodar('check-grants-fresh.mjs', grava('fresco.json', fresco));
  assert.equal(r.status, 0, r.saida);
});

comAmbiente('grants: qualquer mudanca de ACL e drift (exit 1)', ({ grava, rodar }) => {
  grava('grants.json', grants());
  const variantes = [
    (g) => g.anon_execute.push('zz_nova()'),
    (g) => g.anon_execute.shift(),
    (g) => g.anon_table_select.push('x_tabela'),
    (g) => { g.anon_table_select = []; },
    (g) => { g.authenticated_execute_count += 1; },
    (g) => { g.service_role_execute_count -= 1; },
  ];
  for (const [i, mudar] of variantes.entries()) {
    const fresco = grants();
    mudar(fresco);
    const r = rodar('check-grants-fresh.mjs', grava('fresco.json', fresco));
    assert.equal(r.status, 1, 'variante ' + i + '\n' + r.saida);
  }
});

comAmbiente('grants: placeholder commitado (listas vazias) x banco real e drift, nao erro', ({ grava, rodar }) => {
  fs.copyFileSync(path.join(AQUI, 'grants-baseline.json'), path.join(path.dirname(grava('x', '')), 'grants.json'));
  const r = rodar('check-grants-fresh.mjs', grava('fresco.json', grants()));
  assert.equal(r.status, 1, r.saida);
});

comAmbiente('grants: entrada invalida sai 2 e sempre diz por que', ({ grava, rodar, dir }) => {
  grava('grants.json', grants());
  const casos = {
    nulo: 'null',
    lista: '[]',
    vazio: '',
    'lista fora de ordem': { ...grants(), anon_execute: ['b()', 'a()'] },
    'lista com repetido': { ...grants(), anon_table_select: ['a', 'a'] },
    'contagem negativa': { ...grants(), authenticated_execute_count: -1 },
    'contagem como texto': { ...grants(), service_role_execute_count: '3' },
    'sem lista': { ...grants(), anon_execute: undefined },
  };
  for (const [nome, valor] of Object.entries(casos)) {
    const r = rodar('check-grants-fresh.mjs', grava('fresco.json', valor));
    assert.equal(r.status, 2, nome + '\n' + r.saida);
    assert.match(r.saida, /ERRO: baseline de grants fresco/, nome);
  }
  const bom = grava('fresco.json', grants());
  grava('grants.json', 'null');
  let r = rodar('check-grants-fresh.mjs', bom);
  assert.equal(r.status, 2);
  assert.match(r.saida, /ERRO: baseline de grants commitado/);
  fs.rmSync(path.join(dir, 'grants.json'));
  r = rodar('check-grants-fresh.mjs', bom);
  assert.equal(r.status, 2);
  assert.match(r.saida, /ERRO: baseline de grants commitado/);
  assert.equal(rodar('check-grants-fresh.mjs').status, 2);
});

test('grants-baseline.json versionado tem o formato que o comparador exige', () => {
  const r = spawnSync(process.execPath, [path.join(AQUI, 'check-grants-fresh.mjs'), path.join(AQUI, 'grants-baseline.json')], {
    cwd: RAIZ,
    encoding: 'utf8',
    env: { ...process.env, GRANTS_BASELINE_PATH: '' },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
