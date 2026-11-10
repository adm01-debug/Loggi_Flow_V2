// Teste dos tres SQL de auditoria (catalog.sql, manifest.sql, grants-baseline.sql) contra um
// Postgres DESCARTAVEL, rodando o psql exatamente como o types-sync roda, e dos comparadores
// detectando deriva real. Pulado por padrao (os demais testes do diretorio sao offline).
//
// Para rodar: aponte DB_AUDIT_TEST_URL para um banco LOCAL cujo nome comece com "dbaudit_test"
// (o teste recria o schema public dele e cria os papeis anon/authenticated/service_role):
//   createdb dbaudit_test
//   DB_AUDIT_TEST_URL='postgresql://postgres:senha@127.0.0.1:5432/dbaudit_test' \
//     node --test scripts/db-audit/sql-banco-local.unit.mjs
// Qualquer outro host ou nome de banco e recusado: nunca aponte para o banco oficial.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { withPsqlEnvironment } from './psql-environment.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const URL_TESTE = process.env.DB_AUDIT_TEST_URL || '';
const REF = 'abcdefghijklmnopqrst';

function alvoSeguro(valor) {
  try {
    const u = new URL(valor);
    const host = u.hostname.replace(/^\[|\]$/g, '');
    return ['127.0.0.1', 'localhost', '::1'].includes(host) && /^dbaudit_test/.test(decodeURIComponent(u.pathname.slice(1)));
  } catch {
    return false;
  }
}

const pular = !URL_TESTE ? 'defina DB_AUDIT_TEST_URL (banco local descartavel)' : false;
if (URL_TESTE && !alvoSeguro(URL_TESTE)) {
  throw new Error('DB_AUDIT_TEST_URL recusada: use host local (127.0.0.1/localhost) e banco com nome iniciado por "dbaudit_test".');
}

const FIXTURE = `
DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS extensions CASCADE;
DROP SCHEMA IF EXISTS auth CASCADE;
CREATE SCHEMA public;
CREATE SCHEMA extensions;
CREATE SCHEMA auth;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE TYPE extensions.moeda AS ENUM ('BRL', 'USD');
CREATE TYPE public.app_role AS ENUM ('admin', 'operador');
CREATE TYPE public."Status Envio" AS ENUM ('pendente', 'em rota');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id), role public.app_role NOT NULL);
CREATE TABLE public.entregas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo varchar(20) NOT NULL UNIQUE,
  status public."Status Envio" NOT NULL DEFAULT 'pendente',
  valor numeric(12,2) CHECK (valor >= 0),
  moeda extensions.moeda DEFAULT 'BRL',
  deleted_at timestamptz
);
CREATE TABLE public."Tabela Com Espaço" ("Coluna;Estranha" text, "a""b" int);
CREATE VIEW public.v_entregas WITH (security_invoker = true) AS SELECT id, codigo FROM public.entregas WHERE deleted_at IS NULL;
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE FUNCTION public.converte(m extensions.moeda) RETURNS extensions.moeda LANGUAGE sql AS $$ SELECT m $$;
CREATE FUNCTION public."Função Esquisita"("p x" int DEFAULT 1) RETURNS int LANGUAGE sql AS $$ SELECT "p x" $$;
CREATE FUNCTION public.set_updated() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER trg_entregas BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.set_updated();
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins veem tudo" ON public.entregas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.v_entregas TO anon;
GRANT SELECT, INSERT ON public.entregas TO authenticated;
`;

function psql(args, url = URL_TESTE) {
  return withPsqlEnvironment(url, (env) => execFileSync(
    process.env.PSQL_BIN || 'psql',
    ['-X', '-v', 'ON_ERROR_STOP=1', '-At', ...args],
    { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000, env, maxBuffer: 64 * 1024 * 1024 },
  ));
}
const gerar = (nome, url) => psql(['-f', `scripts/db-audit/${nome}.sql`], url);
const sql = (texto) => psql(['-q', '-c', texto]);
const semData = (json) => { const o = JSON.parse(json); delete o.generated_at; return o; };
const comOpcoes = (opcoes) => {
  const u = new URL(URL_TESTE);
  u.searchParams.set('options', opcoes);
  return u.toString();
};

function comparadores(dir) {
  const banco = decodeURIComponent(new URL(URL_TESTE).pathname.slice(1));
  const maior = Number(psql(['-c', "select current_setting('server_version_num')::int / 10000"]).trim());
  const identidade = path.join(dir, 'identidade.json');
  fs.writeFileSync(identidade, JSON.stringify({
    format_version: 1,
    connection_provider: 'supabase-cloud',
    project_ref_sha256: crypto.createHash('sha256').update(REF).digest('hex'),
    database: banco,
    schema: 'public',
    server_major: maior,
  }));
  const env = {
    ...process.env,
    CATALOG_IDENTITY_PATH: identidade,
    DESTINO_URL: `postgresql://postgres:x@db.${REF}.supabase.co:5432/${banco}`,
    CATALOG_PATH: path.join(dir, 'catalog.json'),
    MANIFEST_PATH: path.join(dir, 'manifest.json'),
    GRANTS_BASELINE_PATH: path.join(dir, 'grants-baseline.json'),
  };
  const fotografar = () => {
    for (const nome of ['catalog', 'manifest', 'grants-baseline']) fs.writeFileSync(path.join(dir, nome + '.json'), gerar(nome));
  };
  const conferir = () => Object.fromEntries(['catalog', 'manifest', 'grants'].map((curto) => {
    const nome = curto === 'grants' ? 'grants-baseline' : curto;
    const fresco = path.join(dir, nome + '.fresco.json');
    fs.writeFileSync(fresco, gerar(nome));
    const r = spawnSync(process.execPath, [path.join(AQUI, `check-${curto}-fresh.mjs`), fresco], { cwd: RAIZ, encoding: 'utf8', env });
    return [curto, r.status];
  }));
  return { fotografar, conferir };
}

test('SQL de auditoria contra Postgres local', { skip: pular }, async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-audit-sql-'));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    sql('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS extensions CASCADE; DROP SCHEMA IF EXISTS auth CASCADE; CREATE SCHEMA public;');
  });

  await t.test('banco vazio: os tres SQL devolvem JSON valido com secoes vazias', () => {
    sql('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    const catalogo = JSON.parse(gerar('catalog'));
    for (const secao of ['tables', 'views', 'enums', 'columns', 'functions', 'function_signatures', 'trigger_functions', 'check_constraints']) {
      assert.deepEqual(catalogo[secao], [], secao);
    }
    const manifesto = JSON.parse(gerar('manifest'));
    assert.deepEqual(manifesto.columns, {});
    assert.deepEqual(manifesto.policies, {});
    const grants = JSON.parse(gerar('grants-baseline'));
    assert.deepEqual(grants.anon_execute, []);
    assert.equal(grants.authenticated_execute_count, 0);
  });

  await t.test('fixture: stdout e so o JSON e os nomes com aspas, espaco e acento sobrevivem', () => {
    sql(FIXTURE);
    const bruto = gerar('catalog');
    assert.ok(bruto.startsWith('{') && bruto.trimEnd().endsWith('}'));
    const catalogo = JSON.parse(bruto);
    assert.deepEqual(catalogo.tables, ['Tabela Com Espaço', 'entregas', 'user_roles']);
    assert.deepEqual(catalogo.views, ['v_entregas']);
    assert.deepEqual(catalogo.enums, ['Status Envio', 'app_role']);
    assert.deepEqual(catalogo.functions, ['Função Esquisita', 'converte', 'has_role']);
    assert.deepEqual(catalogo.trigger_functions, ['set_updated']);
    assert.ok(catalogo.columns.includes('Tabela Com Espaço.Coluna;Estranha:text:nullable'));
    assert.ok(catalogo.columns.includes('Tabela Com Espaço.a"b:integer:nullable'));
    assert.ok(catalogo.columns.includes('entregas.status:"Status Envio":not-null'));
    assert.ok(catalogo.columns.includes('entregas.moeda:moeda:nullable'), 'tipo de extensions sem qualificar, como na sessao padrao do Supabase');
    assert.ok(catalogo.function_signatures.includes('converte(m moeda)->moeda|kind=f'));

    const manifesto = JSON.parse(gerar('manifest'));
    assert.ok('entregas."Admins veem tudo"' in manifesto.policies);
    assert.ok('"Tabela Com Espaço"."Coluna;Estranha"' in manifesto.columns);
    assert.ok('f:"Função Esquisita"("p x" integer)' in manifesto.functions);
    assert.ok('entregas.trg_entregas' in manifesto.triggers);

    const grants = JSON.parse(gerar('grants-baseline'));
    assert.deepEqual(grants.anon_table_select, ['v_entregas']);
    assert.ok(grants.anon_execute.includes('has_role(_user_id uuid, _role app_role)'));
    assert.deepEqual([...grants.anon_execute].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), grants.anon_execute);
  });

  await t.test('saida deterministica: duas execucoes e qualquer search_path de sessao dao o mesmo resultado', () => {
    for (const nome of ['catalog', 'manifest', 'grants-baseline']) {
      const base = semData(gerar(nome));
      assert.deepEqual(semData(gerar(nome)), base, nome + ': segunda execucao');
      for (const opcoes of ['-c search_path=pg_catalog', '-c search_path=auth', '-c search_path=public,extensions,auth', '-c search_path=extensions -c jit=off']) {
        assert.deepEqual(semData(gerar(nome, comOpcoes(opcoes))), base, `${nome} com [${opcoes}]`);
      }
    }
    assert.equal(psql(['-c', 'show search_path', '-f', 'scripts/db-audit/grants-baseline.sql', '-c', 'show search_path'], comOpcoes('-c search_path=auth'))
      .split('\n').filter((l) => l === 'auth').length, 2, 'o search_path da sessao nao muda');
  });

  await t.test('comparadores: sem mudanca = 0; cada deriva real e detectada e some ao reverter', () => {
    const { fotografar, conferir } = comparadores(dir);
    fotografar();
    assert.deepEqual(conferir(), { catalog: 0, manifest: 0, grants: 0 });
    const derivas = [
      ['coluna nova', 'ALTER TABLE public.entregas ADD COLUMN peso numeric', 'ALTER TABLE public.entregas DROP COLUMN peso', { catalog: 1, manifest: 1, grants: 0 }],
      ['policy nova', 'CREATE POLICY p_tmp ON public.entregas FOR DELETE TO authenticated USING (false)', 'DROP POLICY p_tmp ON public.entregas', { catalog: 0, manifest: 1, grants: 0 }],
      ['policy alterada', 'ALTER POLICY "Admins veem tudo" ON public.entregas USING (true)', "ALTER POLICY \"Admins veem tudo\" ON public.entregas USING (public.has_role(auth.uid(), 'admin'))", { catalog: 0, manifest: 1, grants: 0 }],
      ['RLS desligada', 'ALTER TABLE public.entregas DISABLE ROW LEVEL SECURITY', 'ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY', { catalog: 0, manifest: 1, grants: 0 }],
      ['SELECT para anon', 'GRANT SELECT ON public.user_roles TO anon', 'REVOKE SELECT ON public.user_roles FROM anon', { catalog: 0, manifest: 1, grants: 1 }],
      ['EXECUTE tirado de anon', 'REVOKE EXECUTE ON FUNCTION public.converte(extensions.moeda) FROM PUBLIC', 'GRANT EXECUTE ON FUNCTION public.converte(extensions.moeda) TO PUBLIC', { catalog: 0, manifest: 1, grants: 1 }],
      ['SECURITY DEFINER removido', 'ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER', 'ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY DEFINER', { catalog: 0, manifest: 1, grants: 0 }],
      ['tabela com nome estranho', `CREATE TABLE public."x'y;--" ("c$$" int)`, `DROP TABLE public."x'y;--"`, { catalog: 1, manifest: 1, grants: 0 }],
      ['funcao nova', 'CREATE FUNCTION public.nova() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$', 'DROP FUNCTION public.nova()', { catalog: 1, manifest: 1, grants: 1 }],
      ['so dados (nao e deriva)', "INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001')", 'DELETE FROM auth.users', { catalog: 0, manifest: 0, grants: 0 }],
    ];
    for (const [nome, aplicar, reverter, esperado] of derivas) {
      sql(aplicar);
      assert.deepEqual(conferir(), esperado, nome);
      sql(reverter);
      assert.deepEqual(conferir(), { catalog: 0, manifest: 0, grants: 0 }, nome + ' (revertido)');
    }
  });

  await t.test('papel ausente derruba o grants-baseline.sql em vez de gerar baseline parcial', () => {
    sql('ALTER ROLE anon RENAME TO anon_dbaudit_tmp');
    try {
      assert.throws(() => gerar('grants-baseline'), /role "anon" does not exist/);
    } finally {
      sql('ALTER ROLE anon_dbaudit_tmp RENAME TO anon');
    }
  });
});
