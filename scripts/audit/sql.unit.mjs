// Testes dos SQL de scripts/audit/ (manifest_full, manifest_detail, manifest_data) e dos dois scripts
// históricos da raiz (scripts/cleanup_triggers_source.sql, scripts/origem_remediacao_2026-08-31.sql).
// Rodam de verdade num Postgres DESCARTÁVEL, com fixture que imita o Supabase (roles, schemas auth/
// storage/supabase_migrations, cron.job de mentira). Nunca apontam para banco do projeto:
//   - AUDIT_TEST_PG_URL=postgres://postgres@127.0.0.1:5432/postgres  → usa esse servidor (superuser),
//     criando e apagando bancos `audit_t_*`; ou
//   - sem a env e sem ser root: sobe um cluster temporário com initdb/pg_ctl (PG_BINDIR, pg_config
//     ou /usr/lib/postgresql/*/bin) e o derruba no fim.
// Sem nenhum dos dois, os testes são pulados (e dizem por quê).
// Rodar: node --test scripts/audit/sql.unit.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SQL = {
  full: path.join(AQUI, 'manifest_full.sql'),
  detail: path.join(AQUI, 'manifest_detail.sql'),
  data: path.join(AQUI, 'manifest_data.sql'),
  cleanup: path.resolve(AQUI, '../cleanup_triggers_source.sql'),
  remediacao: path.resolve(AQUI, '../origem_remediacao_2026-08-31.sql'),
  estadoFnEntrega: path.resolve(AQUI, '../../supabase/migrations/20261124090000_fn_valida_transicao_entrega.sql'),
  estadoTrgEntrega: path.resolve(AQUI, '../../supabase/migrations/20261124090100_trigger_valida_transicao_entrega.sql'),
  estadoFnColeta: path.resolve(AQUI, '../../supabase/migrations/20261124090200_fn_valida_transicao_coleta.sql'),
  estadoNfEntrega: path.resolve(AQUI, '../../supabase/migrations/20261124090300_trigger_entrega_nf_obrigatoria.sql'),
};

// ── servidor de teste ────────────────────────────────────────────────────────────────────────────
function achaBindir() {
  const candidatos = [process.env.PG_BINDIR];
  const cfg = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' });
  if (cfg.status === 0) candidatos.push(cfg.stdout.trim());
  if (fs.existsSync('/usr/lib/postgresql')) {
    for (const v of fs.readdirSync('/usr/lib/postgresql').sort((a, b) => Number(b) - Number(a))) candidatos.push(`/usr/lib/postgresql/${v}/bin`);
  }
  return candidatos.find((d) => d && fs.existsSync(path.join(d, 'initdb')) && fs.existsSync(path.join(d, 'pg_ctl')));
}
const portaLivre = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.once('error', reject);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

let pg = null; // { url, psql, para() }
let motivoSkip = null;
before(async () => {
  if (process.env.AUDIT_TEST_PG_URL) {
    pg = { url: process.env.AUDIT_TEST_PG_URL, psql: 'psql', para() {} };
  } else if (process.getuid?.() === 0) {
    motivoSkip = 'rodando como root sem AUDIT_TEST_PG_URL (initdb não roda como root)';
  } else {
    const bindir = achaBindir();
    if (!bindir) { motivoSkip = 'sem AUDIT_TEST_PG_URL e sem initdb/pg_ctl na máquina'; return; }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-pg-'));
    const dados = path.join(dir, 'dados');
    const porta = await portaLivre();
    const init = spawnSync(path.join(bindir, 'initdb'), ['-D', dados, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8'], { encoding: 'utf8' });
    assert.equal(init.status, 0, init.stderr);
    const sobe = spawnSync(path.join(bindir, 'pg_ctl'), ['-D', dados, '-w', '-l', path.join(dir, 'log'), '-o', `-p ${porta} -c listen_addresses=127.0.0.1 -c unix_socket_directories=''`, 'start'], { encoding: 'utf8' });
    assert.equal(sobe.status, 0, sobe.stdout + sobe.stderr);
    pg = {
      url: `postgres://postgres@127.0.0.1:${porta}/postgres`,
      psql: path.join(bindir, 'psql'),
      para() { spawnSync(path.join(bindir, 'pg_ctl'), ['-D', dados, '-m', 'immediate', '-w', 'stop']); fs.rmSync(dir, { recursive: true, force: true }); },
    };
  }
  if (pg && spawnSync(pg.psql, ['--version']).status !== 0) { pg.para(); pg = null; motivoSkip = 'psql não encontrado no PATH'; }
});
const bancos = [];
after(() => {
  if (!pg) return;
  for (const b of bancos) psql('postgres', { comandos: [`DROP DATABASE IF EXISTS ${b} WITH (FORCE)`] });
  pg.para();
});

const urlDo = (banco) => { const u = new URL(pg.url); u.pathname = `/${banco}`; return u.toString(); };
// Roda arquivos/comandos numa ÚNICA sessão psql. paraNoErro=false imita o psql padrão (segue após erro).
function psql(banco, { arquivos = [], comandos = [], stdin, paraNoErro = true } = {}) {
  const args = [urlDo(banco), '-X', '-q', '-At'];
  if (paraNoErro) args.push('-v', 'ON_ERROR_STOP=1');
  for (const c of comandos) args.push('-c', c);
  for (const f of arquivos) args.push('-f', f);
  const r = spawnSync(pg.psql, args, { encoding: 'utf8', input: stdin, env: { ...process.env, PGOPTIONS: '-c client_min_messages=warning' } });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, linhas: r.stdout.split('\n').filter(Boolean) };
}
let seq = 0;
function banco(...fixtures) {
  const nome = `audit_t_${process.pid}_${++seq}`;
  bancos.push(nome);
  const cria = psql('postgres', { comandos: [`DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`, `CREATE DATABASE ${nome}`] });
  assert.equal(cria.status, 0, cria.stderr);
  for (const sql of fixtures) {
    const r = psql(nome, { stdin: sql });
    assert.equal(r.status, 0, `fixture falhou: ${r.stderr}`);
  }
  return nome;
}
const consulta = (b, sql) => psql(b, { comandos: [sql] }).linhas;
const caso = (nome, fn) => test(nome, (t) => (pg ? fn(t) : t.skip(motivoSkip)));

// ── fixtures ─────────────────────────────────────────────────────────────────────────────────────
const SUPABASE = `
DO $$ DECLARE r text; BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','sandbox_exec','supabase_realtime_admin'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN EXECUTE format('CREATE ROLE %I NOLOGIN', r); END IF;
  END LOOP;
END $$;
CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA supabase_migrations; CREATE SCHEMA extensions; CREATE SCHEMA internal;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_app_meta_data jsonb, email_confirmed_at timestamptz);
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean DEFAULT false, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
CREATE TABLE supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text);
`;
// Montado em tempo de execução: um JWT literal no arquivo dispara o gitleaks (e não abrimos exceção para service_role).
const JWT = ['eyJhbGciOiJIUzI1NiJ9', 'eyJyb2xlIjoic2VydmljZV9yb2xlIn0', 'assinatura-_123'].join('.');
const CRON = `
CREATE SCHEMA cron;
CREATE TABLE cron.job (jobid bigserial PRIMARY KEY, schedule text NOT NULL, command text NOT NULL, nodename text DEFAULT 'localhost', nodeport int DEFAULT 5432, database text DEFAULT 'postgres', username text DEFAULT 'postgres', active boolean DEFAULT true, jobname text);
CREATE FUNCTION cron.alter_job(job_id bigint, schedule text DEFAULT NULL, command text DEFAULT NULL, database text DEFAULT NULL, username text DEFAULT NULL, active boolean DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN UPDATE cron.job j SET active = COALESCE(alter_job.active, j.active) WHERE j.jobid = job_id; IF NOT FOUND THEN RAISE EXCEPTION 'job % inexistente', job_id; END IF; END $f$;
CREATE FUNCTION cron.unschedule(job_name text) RETURNS boolean LANGUAGE plpgsql AS $f$
BEGIN DELETE FROM cron.job WHERE jobname = job_name; IF NOT FOUND THEN RAISE EXCEPTION 'could not find valid entry for job ''%''', job_name; END IF; RETURN true; END $f$;
INSERT INTO cron.job (schedule, command, jobname) VALUES
  ('* * * * *', 'select 1', 'nexus_heartbeat'), ('0 * * * *', 'select 2', 'nexus_notifications_ttl'), ('0 3 * * *', 'select 3', 'nexus_telemetry_cleanup'),
  ('*/5 * * * *', 'select net.http_post(''https://abcdefghijklmnopqrst.supabase.co/functions/v1/x'',
     headers := ''{"Authorization":"Bearer ${JWT}"}'')', 'chama_edge'),
  ('1 1 * * *', 'select 9', NULL), ('2 2 * * *', 'select 10', NULL);
`;
const OBJETOS = `
CREATE TYPE public.status_entrega AS ENUM ('pendente','em_rota','entregue');
CREATE TYPE public.endereco AS (rua text, numero int);
CREATE DOMAIN public.cep AS text CHECK (VALUE ~ '^[0-9]{8}$');
CREATE TABLE public.entregas (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, status public.status_entrega NOT NULL DEFAULT 'pendente', version int DEFAULT 1, obs text, dobro int GENERATED ALWAYS AS (version * 2) STORED, deleted_at timestamptz);
CREATE TABLE public."Tabela Com Espaço" ("Coluna Ç" text, "select" int, "a""b" text);
CREATE TABLE public."a.b" (c int);
CREATE TABLE public.vazia (id serial PRIMARY KEY);
CREATE UNLOGGED TABLE internal.segredo (k text PRIMARY KEY, v text);
CREATE TABLE public.part (id int, d date) PARTITION BY RANGE (d);
CREATE TABLE public.part_2026 PARTITION OF public.part FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE INDEX idx_entregas_status ON public.entregas (status) WHERE deleted_at IS NULL;
CREATE INDEX "Índice Expr" ON public.entregas (lower(obs));
CREATE VIEW public.v_entregas AS SELECT id, status FROM public.entregas;
CREATE MATERIALIZED VIEW public.mv_entregas AS SELECT count(*) AS n FROM public.entregas;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view" ON public.entregas FOR SELECT TO authenticated USING (true);
CREATE POLICY p_ins ON public.entregas FOR INSERT WITH CHECK (status = 'pendente');
CREATE FUNCTION public.toca() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN RETURN NEW; END $f$;
CREATE FUNCTION public.f(a int) RETURNS int LANGUAGE sql AS 'select a';
CREATE FUNCTION public.f(a text) RETURNS text LANGUAGE sql AS 'select a';
COMMENT ON FUNCTION public.f(int) IS 'versao int';
COMMENT ON FUNCTION public.f(text) IS 'versao text';
CREATE AGGREGATE public.soma(int) (SFUNC = int4pl, STYPE = int);
CREATE TRIGGER tr_toca BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.toca();
COMMENT ON TABLE public.entregas IS 'entregas';
COMMENT ON COLUMN public.entregas.obs IS 'observação';
GRANT SELECT ON public.entregas TO anon, authenticated, sandbox_exec;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
INSERT INTO public.entregas (obs) VALUES ('a'), ('b'), (NULL);
INSERT INTO public.part VALUES (1, '2026-05-01');
INSERT INTO auth.users (id, email, raw_app_meta_data, email_confirmed_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'a@x.com', '{"providers":["email"]}', now()),
  ('00000000-0000-0000-0000-000000000002', NULL, '{}', NULL),
  ('00000000-0000-0000-0000-000000000003', NULL, NULL, NULL);
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovantes', 'comprovantes', false), ('sem_flag', 'sem_flag', NULL);
INSERT INTO storage.objects (bucket_id, name) VALUES ('comprovantes', 'a.pdf'), ('comprovantes', 'b.pdf'), (NULL, 'orfao');
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20260101000000', 'init'), ('20260102000000', NULL);
`;
const linhasTabela = (ordem) => `INSERT INTO public."Tabela Com Espaço" VALUES ${ordem.join(', ')};`;
const L1 = `('x', 1, 'y')`;
const L2 = `('<&>"''', 2, NULL)`;

test('exceptions.json é JSON válido e toda exceção tem seção e motivo', () => {
  const { exceptions } = JSON.parse(fs.readFileSync(path.join(AQUI, 'exceptions.json'), 'utf8'));
  assert.ok(Array.isArray(exceptions) && exceptions.length > 0);
  for (const e of exceptions) assert.ok(e.section && e.reason, JSON.stringify(e));
});

// ── manifestos ───────────────────────────────────────────────────────────────────────────────────
caso('Supabase vazio: os três manifestos rodam; cron e vault ausentes viram linha <ausente>', () => {
  const b = banco(SUPABASE);
  const full = psql(b, { arquivos: [SQL.full] });
  assert.equal(full.status, 0, full.stderr);
  assert.ok(full.linhas.includes('cron|<ausente>|pg_cron não instalado'));
  assert.ok(full.linhas.includes('vault|<ausente>|vault não instalado'));
  const detail = psql(b, { arquivos: [SQL.detail] });
  assert.equal(detail.status, 0, detail.stderr);
  assert.deepEqual(detail.linhas.map((l) => l.split('|').slice(0, 2).join('|')), ['schema|internal', 'schema|public']);
  const data = psql(b, { arquivos: [SQL.data] });
  assert.equal(data.status, 0, data.stderr);
  assert.deepEqual(data.linhas, []);
});

caso('manifest_detail e manifest_data não dependem dos schemas do Supabase', () => {
  const b = banco();
  for (const f of [SQL.detail, SQL.data]) assert.equal(psql(b, { arquivos: [f] }).status, 0);
});

caso('manifest_full em Postgres sem auth/storage/supabase_migrations falha (com ON_ERROR_STOP) em vez de dar manifesto parcial', () => {
  const r = psql(banco(), { arquivos: [SQL.full] });
  assert.equal(r.status, 3);
  assert.match(r.stderr, /relation "storage\.buckets" does not exist/);
  assert.deepEqual(r.linhas, []);
});

caso('com objetos: toda linha tem section|key|def, sem chave nula, sem def nula e sem chave repetida', () => {
  const b = banco(SUPABASE, CRON, OBJETOS, linhasTabela([L1, L2]));
  for (const [nome, tabela] of [['full', '_manifest_full'], ['detail', '_manifest_detail'], ['data', '_manifest_data']]) {
    // Tudo menos o SELECT final e o DROP: deixa a temp table viva para inspecionar.
    const corpo = fs.readFileSync(SQL[nome], 'utf8').replace(/\nSELECT section, key, def FROM [\s\S]*$/, '\n');
    const r = psql(b, { stdin: `${corpo}
      SELECT 'chave_nula', section, count(*) FROM ${tabela} WHERE key IS NULL GROUP BY 2;
      SELECT 'def_nula', section, key FROM ${tabela} WHERE def IS NULL;
      SELECT 'repetida', section, key, count(*) FROM ${tabela} GROUP BY 2, 3 HAVING count(*) > 1;
      SELECT 'total', count(*) FROM ${tabela};` });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.linhas.filter((l) => !l.startsWith('total|')), [], nome);
    assert.ok(Number(r.linhas.at(-1).split('|')[1]) > 5, nome);
  }
});

caso('manifest_full cobre as seções esperadas e identifica função sobrecarregada, usuário sem e-mail e job sem nome', () => {
  const b = banco(SUPABASE, CRON, OBJETOS);
  const r = psql(b, { arquivos: [SQL.full] });
  assert.equal(r.status, 0, r.stderr);
  const secoes = new Set(r.stdout.split('\n').map((l) => /^([a-z_]+)\|/.exec(l)?.[1]).filter(Boolean));
  for (const s of ['schema', 'ext', 'role', 'enum', 'type', 'table', 'column', 'constraint', 'index', 'policy', 'function', 'fn_acl', 'trigger', 'view', 'sequence', 'grant', 'defacl', 'cron', 'bucket', 'comment', 'migration', 'auth_user', 'storage_objects', 'vault']) {
    assert.ok(secoes.has(s), `seção ${s} ausente`);
  }
  for (const chave of ['comment|public.f(a integer)|versao int', 'comment|public.f(a text)|versao text', 'bucket|sem_flag| limit= mime=', 'storage_objects|<none>|1', 'storage_objects|comprovantes|2']) {
    assert.ok(r.linhas.includes(chave), `faltou "${chave}"`);
  }
  assert.ok(r.linhas.some((l) => l.startsWith('auth_user|<sem-email:00000000-0000-0000-0000-000000000002>|')));
  assert.ok(r.linhas.some((l) => l.startsWith('auth_user|<sem-email:00000000-0000-0000-0000-000000000003>|')));
  assert.equal(r.linhas.filter((l) => l.startsWith('cron|<sem-nome:')).length, 2);
  assert.ok(r.linhas.some((l) => l.startsWith('table|public.Tabela Com Espaço|')));
  assert.ok(r.linhas.some((l) => l.startsWith('column|public.Tabela Com Espaço.a"b|')));
});

caso('manifest_full neutraliza URL do projeto, JWT e ACL do sandbox_exec no que sai', () => {
  const r = psql(banco(SUPABASE, CRON, OBJETOS), { arquivos: [SQL.full] });
  assert.equal(r.status, 0, r.stderr);
  const job = r.linhas.find((l) => l.startsWith('cron|chama_edge|'));
  assert.match(job, /<URL>\/functions\/v1\/x/);
  assert.match(job, /Bearer <KEY>/);
  assert.ok(!r.stdout.includes(JWT) && !r.stdout.includes('abcdefghijklmnopqrst'));
  assert.ok(!r.stdout.includes('sandbox_exec'));
});

caso('saída determinística: duas sessões dão bytes idênticos, ordenados por section, key, def', () => {
  const b = banco(SUPABASE, CRON, OBJETOS, linhasTabela([L1, L2]));
  for (const f of [SQL.full, SQL.detail, SQL.data]) {
    const a = psql(b, { arquivos: [f] });
    const c = psql(b, { arquivos: [f] });
    assert.equal(a.status, 0, a.stderr);
    assert.ok(a.stdout.length > 0);
    assert.equal(a.stdout, c.stdout, path.basename(f));
  }
  const ordem = psql(b, { stdin: `${fs.readFileSync(SQL.full, 'utf8').replace(/\nSELECT section, key, def FROM [\s\S]*$/, '\n')}
    SELECT count(*) FROM (SELECT section, key, def, lag(ROW(section, key, def)) OVER (ORDER BY section, key, def) AS ant FROM _manifest_full) s WHERE ant IS NOT NULL AND ROW(section, key, def) = ant;` });
  assert.deepEqual(ordem.linhas, ['0'], 'há linhas (section, key, def) idênticas — a ordem entre elas seria arbitrária');
});

caso('duas execuções seguidas na mesma sessão dão o mesmo resultado nas duas', () => {
  const b = banco(SUPABASE, CRON, OBJETOS, linhasTabela([L1, L2]));
  for (const f of [SQL.full, SQL.detail, SQL.data]) {
    const uma = psql(b, { arquivos: [f] });
    const duas = psql(b, { arquivos: [f, f] });
    assert.equal(duas.status, 0, duas.stderr);
    assert.equal(duas.stdout, uma.stdout + uma.stdout, path.basename(f));
  }
});

caso('sobra de execução interrompida na sessão não contamina nem quebra a próxima', () => {
  const b = banco(SUPABASE, OBJETOS);
  for (const [f, tabela] of [[SQL.full, '_manifest_full'], [SQL.detail, '_manifest_detail'], [SQL.data, '_manifest_data']]) {
    const limpo = psql(b, { arquivos: [f] });
    const sujo = psql(b, { comandos: [`CREATE TEMP TABLE ${tabela} (section text, key text, def text)`, `INSERT INTO ${tabela} VALUES ('zzz_lixo', 'velho', 'x')`], arquivos: [f] });
    assert.equal(sujo.status, 0, sujo.stderr);
    assert.equal(sujo.stdout, limpo.stdout, path.basename(f));
  }
});

caso('tabela permanente com o mesmo nome da temp table não é apagada', () => {
  const b = banco(SUPABASE, 'CREATE TABLE public._manifest_data (x int); CREATE TABLE public._manifest_full (x int); CREATE TABLE public._manifest_detail (x int);');
  for (const f of [SQL.full, SQL.detail, SQL.data]) assert.equal(psql(b, { arquivos: [f] }).status, 0);
  assert.deepEqual(consulta(b, "select count(*) from pg_tables where schemaname = 'public' and tablename like '\\_manifest\\_%'"), ['3']);
});

caso('manifest_data: nomes com espaço/aspas/ponto, tabela vazia, particionada só pelo pai', () => {
  const r = psql(banco(SUPABASE, OBJETOS, linhasTabela([L1, L2])), { arquivos: [SQL.data] });
  assert.equal(r.status, 0, r.stderr);
  const porChave = Object.fromEntries(r.linhas.map((l) => l.split('|').slice(1)));
  assert.deepEqual(Object.keys(porChave), ['internal.segredo', 'public.Tabela Com Espaço', 'public.a.b', 'public.entregas', 'public.part', 'public.vazia']);
  assert.equal(porChave['public.vazia'], 'rows=0 hash=');
  assert.match(porChave['public.Tabela Com Espaço'], /^rows=2 hash=[0-9a-f]{32}$/);
  assert.match(porChave['public.part'], /^rows=1 hash=[0-9a-f]{32}$/);
});

caso('manifest_data: mesmo conteúdo em ordem física diferente dá o mesmo hash; conteúdo diferente, hash diferente', () => {
  const hash = (...fx) => psql(banco(SUPABASE, OBJETOS, ...fx), { arquivos: [SQL.data] }).linhas.find((l) => l.includes('Tabela Com Espaço'));
  const ab = hash(linhasTabela([L1, L2]));
  assert.equal(hash(linhasTabela([L2, L1])), ab);
  assert.notEqual(hash(linhasTabela([L1, `('<&>"''', 3, NULL)`])), ab);
  assert.notEqual(hash(linhasTabela([L1])), ab);
});

caso('manifest_data sem privilégio de leitura falha em vez de dar hash vazio', () => {
  const b = banco(SUPABASE, OBJETOS);
  const r = psql(b, { comandos: ['SET ROLE anon'], arquivos: [SQL.data] });
  assert.equal(r.status, 3);
  assert.match(r.stderr, /permission denied/);
});

// ── scripts históricos da origem ─────────────────────────────────────────────────────────────────
const ORIGEM = `
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN NEW.updated_at = now(); RETURN NEW; END $f$;
CREATE FUNCTION public.increment_version_column() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN NEW.version := COALESCE(OLD.version, 0) + 1; RETURN NEW; END $f$;
CREATE FUNCTION public.increment_version() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN NEW.version := COALESCE(OLD.version, 0) + 1; RETURN NEW; END $f$;
CREATE FUNCTION public.tr_increment_version() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN NEW.version := COALESCE(OLD.version, 0) + 1; NEW.updated_at = now(); RETURN NEW; END $f$;
CREATE FUNCTION public.audit_log_trigger() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN RETURN NEW; END $f$;
CREATE FUNCTION public.fn_audit_trigger() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN RETURN NEW; END $f$;
CREATE FUNCTION public.audit_trigger_func() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN RETURN NEW; END $f$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['entregas','transportadoras','cotacoes_frete','coletas','clientes','fornecedores','fretes_internos','alertas_custo','business_rules','tabelas_frete','ocorrencias','business_rules_config','achievements','cotacoes_multicanal','rate_limit_logs'] LOOP
    EXECUTE format('CREATE TABLE public.%I (id bigserial PRIMARY KEY, version int DEFAULT 1, updated_at timestamptz DEFAULT now(), nome text)', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['clientes','coletas','cotacoes_frete','entregas','fornecedores','fretes_internos','transportadoras'] LOOP
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger()', 'audit_' || t, t);
    EXECUTE format('CREATE TRIGGER audit_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger()', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['alertas_custo','business_rules','cotacoes_frete','tabelas_frete','transportadoras'] LOOP
    EXECUTE format('CREATE TRIGGER %I AFTER UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger()', 'trg_audit_' || t, t);
  END LOOP;
END $$;
CREATE TRIGGER tr_entregas_version BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER tr_increment_entrega_version BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER tr_version_entregas BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER tr_increment_version_entregas BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
CREATE TRIGGER trigger_increment_version_entregas BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
CREATE TRIGGER tr_increment_entregas_version BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
CREATE TRIGGER tr_transportadoras_version BEFORE UPDATE ON public.transportadoras FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER tr_version_transportadoras BEFORE UPDATE ON public.transportadoras FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER trigger_increment_version_transportadoras BEFORE UPDATE ON public.transportadoras FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
CREATE TRIGGER tr_increment_version_transportadoras BEFORE UPDATE ON public.transportadoras FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
CREATE TRIGGER tr_cotacoes_frete_version BEFORE UPDATE ON public.cotacoes_frete FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER tr_version_cotacoes BEFORE UPDATE ON public.cotacoes_frete FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER tr_increment_version_cotacoes_frete BEFORE UPDATE ON public.cotacoes_frete FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
CREATE TRIGGER tr_cotacoes_version BEFORE UPDATE ON public.cotacoes_frete FOR EACH ROW EXECUTE FUNCTION public.tr_increment_version();
CREATE TRIGGER tr_version_coletas BEFORE UPDATE ON public.coletas FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER tr_increment_coletas_version BEFORE UPDATE ON public.coletas FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
CREATE TRIGGER audit_cotacoes_frete_trigger AFTER UPDATE ON public.cotacoes_frete FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_ocorrencias AFTER UPDATE ON public.ocorrencias FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER update_business_rules_updated_at BEFORE UPDATE ON public.business_rules_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_cotacoes_multicanal_version BEFORE UPDATE ON public.cotacoes_multicanal FOR EACH ROW EXECUTE FUNCTION public.increment_version();
CREATE TRIGGER trigger_increment_version_cotacoes BEFORE UPDATE ON public.cotacoes_multicanal FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
CREATE TRIGGER audit_log_trigger AFTER INSERT ON public.rate_limit_logs FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE FUNCTION public.purge_rte_gateway_health(integer) RETURNS void LANGUAGE sql AS 'select';
CREATE FUNCTION public.rte_rollup_slo_daily(date) RETURNS void LANGUAGE sql AS 'select';
CREATE FUNCTION public.rte_gateway_sustained_downtime(integer) RETURNS void LANGUAGE sql AS 'select';
CREATE FUNCTION public.cleanup_old_delay_predictions() RETURNS void LANGUAGE sql AS 'select';
CREATE FUNCTION public.mark_predictions_accurate() RETURNS void LANGUAGE sql AS 'select';
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
`;
// Retrato do que os dois scripts mexem: triggers, crons, policy e ACL das funções sensíveis.
const retrato = (b) => consulta(b, `
  SELECT 'trg ' || c.relname || '.' || t.tgname || ' -> ' || p.proname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_proc p ON p.oid = t.tgfoid WHERE NOT t.tgisinternal AND c.relnamespace = 'public'::regnamespace
  UNION ALL SELECT 'cron ' || coalesce(jobname, '<null>') || ' active=' || active FROM cron.job
  UNION ALL SELECT 'pol ' || policyname || ' ' || roles::text FROM pg_policies WHERE schemaname = 'public'
  UNION ALL SELECT 'acl ' || proname || ' anon=' || has_function_privilege('anon', oid, 'EXECUTE') || ' auth=' || has_function_privilege('authenticated', oid, 'EXECUTE') || ' service=' || has_function_privilege('service_role', oid, 'EXECUTE') FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prorettype = 'void'::regtype
  ORDER BY 1`);
const triggersDe = (r, tabela) => r.filter((l) => l.startsWith(`trg ${tabela}.`)).map((l) => l.slice(4));
const origem = () => banco(SUPABASE, CRON, ORIGEM);

caso('cleanup_triggers_source: deixa um trigger de versão por tabela, separa updated_at e desativa os crons nexus', () => {
  const b = origem();
  const r = psql(b, { arquivos: [SQL.cleanup] });
  assert.equal(r.status, 0, r.stderr);
  const depois = retrato(b);
  assert.deepEqual(triggersDe(depois, 'entregas'), ['entregas.audit_log_trigger -> audit_log_trigger', 'entregas.tr_increment_entregas_version -> increment_version_column']);
  assert.deepEqual(triggersDe(depois, 'cotacoes_frete'), [
    'cotacoes_frete.audit_cotacoes_frete_trigger -> audit_trigger_func',
    'cotacoes_frete.audit_log_trigger -> audit_log_trigger',
    'cotacoes_frete.tr_increment_cotacoes_frete_version -> increment_version_column',
    'cotacoes_frete.update_cotacoes_frete_updated_at -> update_updated_at_column',
  ]);
  assert.deepEqual(triggersDe(depois, 'coletas'), ['coletas.audit_log_trigger -> audit_log_trigger', 'coletas.tr_increment_coletas_version -> increment_version_column']);
  assert.deepEqual(triggersDe(depois, 'business_rules_config'), []);
  assert.deepEqual(depois.filter((l) => l.startsWith('cron nexus_')), ['cron nexus_heartbeat active=false', 'cron nexus_notifications_ttl active=false', 'cron nexus_telemetry_cleanup active=false']);
  assert.ok(depois.includes('cron chama_edge active=true'));
  // A verificação final do script lista exatamente um trigger de versão por tabela.
  assert.deepEqual(r.linhas.map((l) => l.split('|').slice(0, 2).join('|')), ['coletas|tr_increment_coletas_version', 'cotacoes_frete|tr_increment_cotacoes_frete_version', 'entregas|tr_increment_entregas_version', 'transportadoras|tr_increment_version_transportadoras']);
});

caso('origem_remediacao: triggers, crons removidos, EXECUTE só para service_role e policy só para authenticated', () => {
  const b = origem();
  const r = psql(b, { arquivos: [SQL.remediacao] });
  assert.equal(r.status, 0, r.stderr);
  const depois = retrato(b);
  assert.deepEqual(triggersDe(depois, 'cotacoes_frete'), [
    'cotacoes_frete.audit_log_trigger -> audit_log_trigger',
    'cotacoes_frete.tr_increment_cotacoes_frete_version -> increment_version_column',
    'cotacoes_frete.update_cotacoes_frete_updated_at -> update_updated_at_column',
  ]);
  assert.deepEqual(triggersDe(depois, 'cotacoes_multicanal'), ['cotacoes_multicanal.trigger_increment_version_cotacoes -> increment_version_column']);
  assert.deepEqual(triggersDe(depois, 'rate_limit_logs'), []);
  assert.deepEqual(depois.filter((l) => l.startsWith('cron nexus_')), []);
  assert.equal(depois.filter((l) => l.startsWith('cron ')).length, 3);
  assert.deepEqual(depois.filter((l) => l.startsWith('acl ')), ['cleanup_old_delay_predictions', 'mark_predictions_accurate', 'purge_rte_gateway_health', 'rte_gateway_sustained_downtime', 'rte_rollup_slo_daily'].map((f) => `acl ${f} anon=false auth=false service=true`));
  assert.deepEqual(depois.filter((l) => l.startsWith('pol ')), ['pol Anyone can view achievements {authenticated}']);
});

for (const [nome, arq] of [['cleanup_triggers_source', 'cleanup'], ['origem_remediacao', 'remediacao']]) {
  caso(`${nome}: reexecutar (2ª e 3ª vez) não dá erro nem muda nada`, () => {
    const b = origem();
    assert.equal(psql(b, { arquivos: [SQL[arq]] }).status, 0);
    const depois = retrato(b);
    for (let i = 0; i < 2; i += 1) {
      const r = psql(b, { arquivos: [SQL[arq]] });
      assert.equal(r.status, 0, r.stderr);
      assert.deepEqual(retrato(b), depois);
    }
  });

  caso(`${nome}: trigger de updated_at já existente não quebra a aplicação`, () => {
    const b = banco(SUPABASE, CRON, ORIGEM, 'CREATE TRIGGER update_cotacoes_frete_updated_at BEFORE UPDATE ON public.cotacoes_frete FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();');
    const r = psql(b, { arquivos: [SQL[arq]] });
    assert.equal(r.status, 0, r.stderr);
  });

  for (const [falta, quebra] of [
    ['função do trigger novo ausente', 'DROP FUNCTION public.update_updated_at_column() CASCADE'],
    ['pg_cron ausente', 'DROP SCHEMA cron CASCADE'],
    ...(arq === 'remediacao' ? [['função sensível ausente', 'DROP FUNCTION public.mark_predictions_accurate()'], ['tabela da policy ausente', 'DROP TABLE public.achievements']] : []),
  ]) {
    caso(`${nome}: erro no meio (${falta}) desfaz tudo — nada fica aplicado pela metade`, () => {
      const b = banco(SUPABASE, CRON, ORIGEM, quebra);
      const antes = consulta(b, "SELECT c.relname || '.' || t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE NOT t.tgisinternal ORDER BY 1");
      for (const paraNoErro of [true, false]) {
        const r = psql(b, { arquivos: [SQL[arq]], paraNoErro });
        assert.match(r.stderr, /ERROR/);
        assert.deepEqual(consulta(b, "SELECT c.relname || '.' || t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE NOT t.tgisinternal ORDER BY 1"), antes, `paraNoErro=${paraNoErro}`);
      }
    });
  }

  caso(`${nome}: tabela-alvo de DROP TRIGGER ausente é só pulada`, () => {
    const b = banco(SUPABASE, CRON, ORIGEM, 'DROP TABLE public.alertas_custo; DROP TABLE public.ocorrencias;');
    const r = psql(b, { arquivos: [SQL[arq]] });
    assert.equal(r.status, 0, r.stderr);
  });
}

// ── maquina de estados no banco: etapas 028-031 ──────────────────────────────────────────────────
const ESTADOS = `
CREATE TYPE public.entrega_status AS ENUM ('aguardando_producao','pronto_despacho','cotacao_frete','nf_emitida','despachado','em_transito','saiu_entrega','entregue','ocorrencia','finalizado');
CREATE TYPE public.coleta_status AS ENUM ('aguardando_liberacao','solicitada','em_transito','chegou_expedicao','conferencia_ok','divergencia','finalizada');
CREATE TABLE public.entregas (id serial PRIMARY KEY, status public.entrega_status NOT NULL DEFAULT 'aguardando_producao', nf_remessa text);
CREATE TABLE public.coletas (id serial PRIMARY KEY, status public.coleta_status NOT NULL DEFAULT 'aguardando_liberacao');
`;
const MIGRACOES_ESTADO = [SQL.estadoFnEntrega, SQL.estadoTrgEntrega, SQL.estadoFnColeta, SQL.estadoNfEntrega];

caso('maquina de estados (028-031): transicao valida passa; salto invalido e despacho sem NF sao recusados', () => {
  const b = banco(ESTADOS);
  const aplica = psql(b, { arquivos: MIGRACOES_ESTADO });
  assert.equal(aplica.status, 0, aplica.stderr);

  // A funcao responde o mapa, inclusive p_de = p_para (update que nao muda status).
  assert.deepEqual(
    consulta(
      b,
      `SELECT public.fn_valida_transicao_entrega('nf_emitida','despachado'),
              public.fn_valida_transicao_entrega('pronto_despacho','entregue'),
              public.fn_valida_transicao_entrega('em_transito','em_transito'),
              public.fn_valida_transicao_entrega('em_transito','entregue'),
              public.fn_valida_transicao_entrega('finalizado','entregue')`,
    ),
    ['t|f|t|t|f'],
  );

  // Os dois triggers existem, so nas tabelas certas e com nome que ordena antes da auditoria.
  assert.deepEqual(
    consulta(
      b,
      "SELECT c.relname || ':' || t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE NOT t.tgisinternal AND c.relname IN ('entregas','coletas') ORDER BY 1",
    ),
    ['coletas:a_valida_transicao_coletas', 'entregas:a_valida_transicao_entregas'],
  );

  // Despacho sem NF (nulo e vazio) e recusado com a mensagem de operacao.
  psql(b, { comandos: ["INSERT INTO public.entregas (status) VALUES ('nf_emitida')"] });
  const semNf = psql(b, { comandos: ["UPDATE public.entregas SET status = 'despachado' WHERE id = 1"] });
  assert.notEqual(semNf.status, 0);
  assert.match(semNf.stderr, /NF de simples remessa obrigatória para despachar/);

  psql(b, { comandos: ["INSERT INTO public.entregas (status, nf_remessa) VALUES ('nf_emitida', '')"] });
  const nfVazia = psql(b, { comandos: ["UPDATE public.entregas SET status = 'despachado' WHERE id = 2"] });
  assert.notEqual(nfVazia.status, 0);
  assert.match(nfVazia.stderr, /NF de simples remessa obrigatória para despachar/);

  // Com NF o mesmo despacho passa.
  assert.equal(psql(b, { comandos: ["UPDATE public.entregas SET nf_remessa = 'NF-1' WHERE id = 1", "UPDATE public.entregas SET status = 'despachado' WHERE id = 1"] }).status, 0);

  // Salto invalido e recusado; update que nao muda status continua passando.
  psql(b, { comandos: ["INSERT INTO public.entregas (status) VALUES ('aguardando_producao')"] });
  const salto = psql(b, { comandos: ["UPDATE public.entregas SET status = 'entregue' WHERE id = 3"] });
  assert.notEqual(salto.status, 0);
  assert.match(salto.stderr, /Transição de status inválida: aguardando_producao -> entregue/);
  assert.equal(psql(b, { comandos: ["UPDATE public.entregas SET status = 'aguardando_producao', nf_remessa = NULL WHERE id = 3"] }).status, 0);

  // Passivo: entrega ja despachada sem NF continua avancando (a regra so olha a entrada em despachado).
  psql(b, { comandos: ["INSERT INTO public.entregas (status) VALUES ('despachado')"] });
  assert.equal(psql(b, { comandos: ["UPDATE public.entregas SET status = 'em_transito' WHERE id = 4"] }).status, 0);

  // Coletas: o salto que o lalamove-webhook pratica passa; pular a conferencia nao.
  psql(b, { comandos: ["INSERT INTO public.coletas (status) VALUES ('solicitada')"] });
  assert.equal(psql(b, { comandos: ["UPDATE public.coletas SET status = 'chegou_expedicao' WHERE id = 1"] }).status, 0);
  const coletaInvalida = psql(b, { comandos: ["UPDATE public.coletas SET status = 'finalizada' WHERE id = 1"] });
  assert.notEqual(coletaInvalida.status, 0);
  assert.match(coletaInvalida.stderr, /Transição de status inválida: chegou_expedicao -> finalizada/);

  // Reaplicar as quatro migrations e seguro (idempotencia do aplicar-migration.yml).
  assert.equal(psql(b, { arquivos: MIGRACOES_ESTADO }).status, 0);
});
