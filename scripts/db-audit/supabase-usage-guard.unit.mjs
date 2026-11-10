// Teste do guard de acoplamento codigo <-> banco (supabase-usage-guard.mjs) e do Gate 3
// (check-remocoes-destrutivas.mjs). Cada caso monta um repositorio sintetico em pasta
// temporaria e roda o CLI com cwd nele, como o types-sync roda na raiz. Offline.
// Rodar da raiz: node --test scripts/db-audit/supabase-usage-guard.unit.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const GUARD = path.join(AQUI, 'supabase-usage-guard.mjs');
const GATE3 = path.join(AQUI, 'check-remocoes-destrutivas.mjs');

function catalogo(extra = {}) {
  return {
    format_version: 2,
    generated_at: '2026-06-01',
    tables: ['coletas', 'entregas'],
    views: ['v_entregas'],
    enums: ['app_role', 'entrega_status'],
    functions: ['has_role', 'calcular_frete'],
    function_signatures: [
      'has_role(_user_id uuid, _role app_role)->boolean|kind=f',
      'calcular_frete(p_cep text)->numeric|kind=f',
      'calcular_frete(p_cep text, p_peso numeric)->numeric|kind=f',
    ],
    trigger_functions: [],
    ...extra,
  };
}

function repo(arquivos = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-audit-guard-'));
  const grava = (rel, texto) => {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, typeof texto === 'string' ? texto : JSON.stringify(texto, null, 2));
    return p;
  };
  grava('supabase/schema-catalog.json', catalogo());
  grava('scripts/db-audit/known-violations.json', { _comment: 'x', known: [] });
  for (const [rel, texto] of Object.entries(arquivos)) grava(rel, texto);
  const rodar = (script, ...args) => {
    const r = spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
    return { status: r.status, saida: r.stdout + r.stderr };
  };
  return {
    dir,
    grava,
    guard: (...args) => rodar(GUARD, ...args),
    gate3: (...args) => rodar(GATE3, ...args),
    ler: (rel) => fs.readFileSync(path.join(dir, rel), 'utf8'),
    limpar: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

function caso(nome, arquivos, fn) {
  test(nome, () => {
    const r = repo(arquivos);
    try {
      fn(r);
    } finally {
      r.limpar();
    }
  });
}

const usa = (...linhas) => linhas.join('\n') + '\n';

// ------------------------------------------------------------------ scan

caso('guard: chamadas a objetos do catalogo passam', {
  'src/a.ts': usa(
    "await supabase.from('entregas').select('*');",
    'const { data } = await supabase',
    '  .from("coletas")',
    "  .select('id');",
    'supabase.from(`v_entregas`);',
    "supabase.rpc('has_role', { _user_id: id });",
    "supabase.from('entregas' as never);",
  ),
  'supabase/functions/x/index.ts': usa("admin.from('coletas').insert({});", "admin.rpc('calcular_frete');"),
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /Violacoes totais: 0/);
});

caso('guard: tabela ou funcao fora do catalogo e violacao nova (exit 1) com arquivo:linha', {
  'src/a.tsx': usa('// linha 1', "supabase.from('nao_existe');", "supabase.rpc('fantasma');"),
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 1, r.saida);
  assert.match(r.saida, /src\/a\.tsx:2 {2}\.from\('nao_existe'\)/);
  assert.match(r.saida, /src\/a\.tsx:3 {2}\.rpc\('fantasma'\)/);
  assert.match(r.saida, /"from:nao_existe:src\/a\.tsx",/);
});

caso('guard: storage, Array e outros clientes nao sao o banco principal', {
  'src/a.ts': usa(
    "supabase.storage.from('bucket-qualquer').upload(p, f);",
    'await supabase.storage',
    "  .from('outro_bucket')",
    '  .remove([p]);',
    "Array.from('abc');",
    "externalSupabase.from('tabela_de_fora');",
    'supabase.from(nomeDinamico);',
    "const texto = 'x.from(tabela)';",
  ),
  'src/ignorado.md': "supabase.from('nao_existe')",
  'docs/fora.ts': "supabase.from('nao_existe')",
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 0, r.saida);
});

caso('guard: .schema(...) muda o schema do alvo', {
  'src/a.ts': usa("supabase.schema('internal').from('entregas');", "supabase.schema('public').from('entregas');"),
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 1, r.saida);
  assert.match(r.saida, /"from:internal\.entregas:src\/a\.ts"/);
  assert.match(r.saida, /novas: 1/);
});

// ------------------------------------------------------------------ baseline

caso('guard: violacao conhecida no baseline passa; uma nova continua falhando', {
  'src/a.ts': usa("supabase.from('legado');"),
  'scripts/db-audit/known-violations.json': { known: ['from:legado:src/a.ts'] },
}, ({ guard, grava }) => {
  let r = guard();
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /no baseline: 1 \| novas: 0/);
  grava('src/b.ts', usa("supabase.from('outra_nova');"));
  r = guard();
  assert.equal(r.status, 1, r.saida);
});

caso('guard: entrada obsoleta so e podada com --prune-obsolete, e a mensagem diz a verdade', {
  'src/a.ts': usa("supabase.from('entregas');"),
  'scripts/db-audit/known-violations.json': { _comment: 'mantem', known: ['from:sumiu:src/x.ts', 'rpc:tambem:src/y.ts'] },
}, ({ guard, ler }) => {
  let r = guard();
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /2 obsoleta\(s\) no baseline/);
  assert.ok(!/podada\(s\)\)/.test(r.saida), r.saida);
  assert.equal(JSON.parse(ler('scripts/db-audit/known-violations.json')).known.length, 2);

  r = guard('--prune-obsolete');
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /2 obsoleta\(s\) podada\(s\)/);
  const podado = JSON.parse(ler('scripts/db-audit/known-violations.json'));
  assert.deepEqual(podado, { _comment: 'mantem', known: [] });
  assert.ok(ler('scripts/db-audit/known-violations.json').endsWith('\n'));

  r = guard('--prune-obsolete');
  assert.equal(r.status, 0, r.saida);
  assert.ok(!/obsoleta/.test(r.saida), r.saida);
});

caso('guard: sem known-violations.json o baseline e vazio', {
  'src/a.ts': usa("supabase.from('entregas');"),
}, ({ guard, dir }) => {
  fs.rmSync(path.join(dir, 'scripts/db-audit/known-violations.json'));
  assert.equal(guard('--prune-obsolete').status, 0);
});

caso('guard: catalogo ou baseline ausente/invalido sai 2 com mensagem (nao excecao)', {
  'src/a.ts': usa("supabase.from('entregas');"),
}, ({ guard, grava, dir }) => {
  for (const ruim of ['{', 'null', '[]', '{"tables":[]}', JSON.stringify({ tables: 'x', views: [], functions: [] })]) {
    grava('supabase/schema-catalog.json', ruim);
    const r = guard();
    assert.equal(r.status, 2, ruim + '\n' + r.saida);
    assert.match(r.saida, /ERRO: catalogo invalido/);
    assert.ok(!/at .*\.mjs:\d+/.test(r.saida), r.saida);
  }
  fs.rmSync(path.join(dir, 'supabase/schema-catalog.json'));
  let r = guard();
  assert.equal(r.status, 2, r.saida);
  assert.match(r.saida, /nao encontrado/);

  grava('supabase/schema-catalog.json', catalogo());
  for (const ruim of ['{', '{"known":"x"}', 'null']) {
    grava('scripts/db-audit/known-violations.json', ruim);
    r = guard();
    assert.equal(r.status, 2, ruim + '\n' + r.saida);
    assert.match(r.saida, /ERRO: baseline invalido/);
  }
});

// ------------------------------------------------------------------ projecao forward-only

const MIG = (nome) => 'supabase/migrations/' + nome;

caso('projecao: tabela criada por migration posterior ao catalogo ja conta', {
  'src/a.ts': usa("supabase.from('nova_tabela');", "supabase.from('nova_view');", "supabase.rpc('nova_fn');"),
  [MIG('20260702000000_nova.sql')]: usa(
    'CREATE TABLE IF NOT EXISTS public."nova_tabela" (id uuid);',
    'CREATE OR REPLACE VIEW nova_view AS SELECT 1;',
    'CREATE OR REPLACE FUNCTION public.nova_fn(p int DEFAULT 1) RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;',
  ),
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 0, r.saida);
});

caso('projecao: migration anterior ao catalogo e ignorada', {
  'src/a.ts': usa("supabase.from('entregas');"),
  [MIG('20260101000000_antiga.sql')]: 'DROP TABLE public.entregas;',
}, ({ guard }) => {
  assert.equal(guard().status, 0);
});

caso('projecao: DROP TABLE / DROP VIEW / RENAME posteriores derrubam o alvo', {
  'src/a.ts': usa("supabase.from('entregas');", "supabase.from('v_entregas');", "supabase.from('coletas');", "supabase.from('coletas_v2');"),
  [MIG('20260702000000_drop.sql')]: usa(
    'DROP TABLE IF EXISTS public.entregas CASCADE;',
    'drop view v_entregas;',
    'ALTER TABLE public.coletas RENAME TO coletas_v2;',
  ),
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 1, r.saida);
  assert.match(r.saida, /\.from\('entregas'\)/);
  assert.match(r.saida, /\.from\('v_entregas'\)/);
  assert.match(r.saida, /\.from\('coletas'\)/);
  assert.ok(!/coletas_v2/.test(r.saida), r.saida);
});

caso('projecao: DROP dentro de comentario, string ou corpo dollar-quoted nao conta', {
  'src/a.ts': usa("supabase.from('entregas');", "supabase.rpc('has_role');"),
  [MIG('20260702000000_falsos.sql')]: usa(
    '-- DROP TABLE public.entregas;',
    '/* DROP TABLE public.entregas; /* aninhado */ DROP FUNCTION public.has_role(uuid, app_role); */',
    "COMMENT ON TABLE public.entregas IS 'antes: DROP TABLE public.entregas;';",
    "DO $$ BEGIN EXECUTE 'DROP TABLE public.entregas'; END $$;",
    'CREATE FUNCTION public.limpa() RETURNS void LANGUAGE plpgsql AS $fn$ BEGIN DROP TABLE public.entregas; END $fn$;',
    "SELECT E'\\'; DROP TABLE public.entregas; --';",
  ),
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 0, r.saida);
});

caso('projecao: ALTER PUBLICATION ... DROP TABLE tira do realtime, nao apaga a tabela', {
  'src/a.ts': usa("supabase.from('entregas');", "supabase.from('coletas');"),
  [MIG('20260702000000_realtime.sql')]: usa(
    'ALTER PUBLICATION supabase_realtime DROP TABLE public.entregas;',
    'ALTER PUBLICATION supabase_realtime',
    '  DROP TABLE public.coletas;',
  ),
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 0, r.saida);
});

caso('projecao: nome de policy com texto livre nao vira DDL', {
  'src/a.ts': usa("supabase.from('entregas');"),
  [MIG('20260702000000_policy.sql')]: usa(
    'DROP POLICY IF EXISTS "Users can drop table entregas" ON public.entregas;',
    'CREATE POLICY "Admins can create view v_fantasma" ON public.entregas FOR SELECT USING (true);',
  ),
}, ({ guard, grava }) => {
  assert.equal(guard().status, 0);
  grava('src/b.ts', usa("supabase.from('v_fantasma');"));
  assert.equal(guard().status, 1);
});

caso('projecao: troca de assinatura mantem a funcao; DROP sem recriar derruba', {
  'src/a.ts': usa("supabase.rpc('calcular_frete');", "supabase.rpc('has_role');"),
  [MIG('20260702000000_fn.sql')]: usa(
    'DROP FUNCTION IF EXISTS public.calcular_frete(text);',
    'DROP FUNCTION public.has_role(uuid, app_role);',
    'CREATE FUNCTION public.has_role(_user_id uuid, _role app_role, _estrito boolean) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;',
  ),
}, ({ guard, grava }) => {
  let r = guard();
  assert.equal(r.status, 0, r.saida);
  grava(MIG('20260703000000_fn2.sql'), 'DROP FUNCTION public.calcular_frete(p_cep TEXT, p_peso NUMERIC(10,2));');
  r = guard();
  assert.equal(r.status, 1, r.saida);
  assert.match(r.saida, /\.rpc\('calcular_frete'\)/);
  assert.ok(!/has_role/.test(r.saida.split('NOVAS')[1]), r.saida);
});

caso('projecao: DROP FUNCTION sem lista de argumentos derruba a funcao inteira', {
  'src/a.ts': usa("supabase.rpc('calcular_frete');", "supabase.rpc('has_role');"),
  [MIG('20260702000000_fn.sql')]: usa('DROP FUNCTION IF EXISTS public.calcular_frete;', 'DROP FUNCTION has_role CASCADE;'),
}, ({ guard }) => {
  const r = guard();
  assert.equal(r.status, 1, r.saida);
  assert.match(r.saida, /\.rpc\('calcular_frete'\)/);
  assert.match(r.saida, /\.rpc\('has_role'\)/);
});

caso('projecao: catalogo sem generated_at valido nao projeta migrations', {
  'src/a.ts': usa("supabase.from('entregas');"),
  [MIG('20260702000000_drop.sql')]: 'DROP TABLE public.entregas;',
}, ({ guard, grava }) => {
  assert.equal(guard().status, 1);
  grava('supabase/schema-catalog.json', catalogo({ generated_at: null }));
  assert.equal(guard().status, 0);
});

test('projecao: nenhuma tabela criada pelas migrations reais e perdida no replay por falso DROP', { skip: !fs.existsSync(path.join(RAIZ, 'supabase/migrations')) }, () => {
  const r = repo();
  try {
    const origem = path.join(RAIZ, 'supabase/migrations');
    const destino = path.join(r.dir, 'supabase/migrations');
    fs.mkdirSync(destino, { recursive: true });
    const publicacao = new Set();
    for (const nome of fs.readdirSync(origem).filter((n) => n.endsWith('.sql'))) {
      const sql = fs.readFileSync(path.join(origem, nome), 'utf8');
      fs.writeFileSync(path.join(destino, nome), sql);
      for (const m of sql.matchAll(/^ALTER PUBLICATION \w+ DROP TABLE public\.(\w+);/gm)) publicacao.add(m[1]);
    }
    if (publicacao.size === 0) return;
    r.grava('supabase/schema-catalog.json', catalogo({ generated_at: '2000-01-01', tables: [...publicacao], views: [], functions: [], function_signatures: [] }));
    r.grava('src/a.ts', [...publicacao].map((t) => `supabase.from('${t}');`).join('\n'));
    // Tabela dropada de verdade mais tarde continua sendo violacao; o que nao pode e
    // a saida da publicacao contar como DROP.
    const dropadas = new Set();
    for (const nome of fs.readdirSync(origem)) {
      const sql = fs.readFileSync(path.join(origem, nome), 'utf8');
      for (const m of sql.matchAll(/^\s*DROP TABLE (?:IF EXISTS )?(?:public\.)?(\w+)/gim)) dropadas.add(m[1]);
    }
    const saida = r.guard();
    for (const tabela of publicacao) {
      if (dropadas.has(tabela)) continue;
      assert.ok(!saida.saida.includes(`.from('${tabela}')`), tabela + '\n' + saida.saida);
    }
  } finally {
    r.limpar();
  }
});

// ------------------------------------------------------------------ Gate 3

const CONSUMIDORES = {
  'src/a.ts': usa(
    "supabase.from('entregas').select('*');",
    "supabase.rpc('has_role');",
    "const s: Database['public']['Enums']['entrega_status'] = 'x';",
  ),
  'src/integrations/supabase/types.ts': usa('export type Enums = { app_role: "admin"; entrega_status: "x" }'),
};

caso('gate3: catalogos iguais ou so com adicoes passam', CONSUMIDORES, ({ gate3, grava }) => {
  const antigo = grava('antigo.json', catalogo());
  assert.equal(gate3(antigo, antigo).status, 0);
  const novo = grava('novo.json', catalogo({ tables: ['coletas', 'entregas', 'mais_uma'] }));
  const r = gate3(antigo, novo);
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /nenhum objeto do catalogo foi removido/);
});

caso('gate3: remocao de tabela, funcao ou enum ainda consumidos bloqueia (exit 1)', CONSUMIDORES, ({ gate3, grava }) => {
  const antigo = grava('antigo.json', catalogo());
  for (const [chave, valor, padrao] of [
    ['tables', ['coletas'], /tabela\/view public\.entregas <- src\/a\.ts:1/],
    ['functions', ['calcular_frete'], /funcao public\.has_role <- src\/a\.ts:2/],
    ['enums', ['app_role'], /enum public\.entrega_status <- src\/a\.ts/],
  ]) {
    const r = gate3(antigo, grava('novo.json', catalogo({ [chave]: valor })));
    assert.equal(r.status, 1, chave + '\n' + r.saida);
    assert.match(r.saida, padrao);
  }
});

caso('gate3: remocao sem consumidor passa; tabela que vira view nao e remocao', CONSUMIDORES, ({ gate3, grava }) => {
  const antigo = grava('antigo.json', catalogo());
  let r = gate3(antigo, grava('novo.json', catalogo({ tables: ['entregas'], functions: ['has_role'] })));
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /public\.coletas {2}\(sem call-site\)/);
  assert.match(r.saida, /public\.calcular_frete {2}\(sem call-site\)/);
  r = gate3(antigo, grava('novo.json', catalogo({ tables: ['coletas'], views: ['v_entregas', 'entregas'] })));
  assert.equal(r.status, 0, r.saida);
});

caso('gate3: o types.ts gerado nao conta como consumidor de enum', CONSUMIDORES, ({ gate3, grava }) => {
  const antigo = grava('antigo.json', catalogo());
  const r = gate3(antigo, grava('novo.json', catalogo({ enums: ['entrega_status'] })));
  assert.equal(r.status, 0, r.saida);
  assert.match(r.saida, /public\.app_role {2}\(sem call-site\)/);
});

caso('gate3: nome com caractere especial de regex nao derruba o script', CONSUMIDORES, ({ gate3, grava }) => {
  const antigo = grava('antigo.json', catalogo({ enums: ['app_role', 'entrega_status', 'a(b', 'x[y', 'c+d'], tables: ['coletas', 'entregas', 't*'] }));
  const r = gate3(antigo, grava('novo.json', catalogo()));
  assert.equal(r.status, 0, r.saida);
  assert.ok(!/SyntaxError/.test(r.saida), r.saida);
});

caso('gate3: catalogo ausente ou invalido sai 2', CONSUMIDORES, ({ gate3, grava, dir }) => {
  const bom = grava('bom.json', catalogo());
  assert.equal(gate3(path.join(dir, 'nao.json'), bom).status, 2);
  assert.equal(gate3(bom, path.join(dir, 'nao.json')).status, 2);
  for (const ruim of ['{', 'null', '[]', '{"tables":"x"}', '{"enums":[1]}']) {
    const arquivo = grava('ruim.json', ruim);
    for (const r of [gate3(arquivo, bom), gate3(bom, arquivo)]) {
      assert.equal(r.status, 2, ruim + '\n' + r.saida);
      assert.match(r.saida, /ERRO: catalogo invalido/);
    }
  }
});

caso('gate3: catalogo antigo {} (primeira execucao) nao tem o que remover', CONSUMIDORES, ({ gate3, grava }) => {
  const r = gate3(grava('vazio.json', '{}'), grava('novo.json', catalogo()));
  assert.equal(r.status, 0, r.saida);
});
