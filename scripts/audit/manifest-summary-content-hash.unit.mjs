// Testes de scripts/audit/manifest_summary.sql e scripts/audit/content_hash.sql.
// Os dois existem para comparar DOIS bancos; então o teste roda de verdade em bancos de fixture
// estilo Supabase (roles anon/authenticated/service_role; storage.buckets; supabase_migrations;
// cron.job ora presente, ora ausente) com os mesmos dados carregados em ordem diferente.
// Servidor: o mesmo de scripts/audit/sql.unit.mjs —
//   AUDIT_TEST_PG_URL=postgres://postgres@127.0.0.1:5432/postgres  (superuser de um Postgres LOCAL
//   descartável; o teste cria e apaga bancos `audit_t_i_*`), ou, sem a env e sem ser root, um
//   cluster temporário via initdb/pg_ctl. Sem nenhum dos dois, só as checagens estáticas rodam.
// Rodar: node --test scripts/audit/manifest-summary-content-hash.unit.mjs

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RESUMO = path.join(AQUI, 'manifest_summary.sql');
const HASH = path.join(AQUI, 'content_hash.sql');
const ler = (f) => fs.readFileSync(f, 'utf8');
const semComentario = (sql) => sql.split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n');

// ── checagens estáticas (sempre rodam) ───────────────────────────────────────

describe('estático', () => {
  for (const [nome, arquivo, temp] of [['manifest_summary.sql', RESUMO, '_manifest_summary'], ['content_hash.sql', HASH, '_content_hash']]) {
    test(`${nome}: só escreve na própria tabela temporária e nunca apaga tabela sem pg_temp.`, () => {
      const sql = semComentario(ler(arquivo));
      for (const m of sql.matchAll(/\b(DROP TABLE|TRUNCATE)\s+(IF EXISTS\s+)?(\S+)/gi)) assert.equal(m[3].replace(/;$/, ''), `pg_temp.${temp}`, `${m[0]} sem pg_temp.`);
      for (const m of sql.matchAll(/\bINSERT INTO\s+(\S+)/gi)) assert.ok([temp, `pg_temp.${temp}`].includes(m[1]), `INSERT em ${m[1]}`);
      assert.ok(!/\b(UPDATE|DELETE FROM|ALTER|GRANT|REVOKE|CREATE (?!TEMP TABLE _))\b/i.test(sql), 'statement que altera o banco');
      assert.match(sql, new RegExp(`DROP TABLE IF EXISTS pg_temp\\.${temp};\\s*CREATE TEMP TABLE ${temp} `));
    });
  }
  test('content_hash.sql: agrega na ordem do próprio hash (ORDER BY 1 dentro de agregado é a constante 1)', () => {
    const sql = semComentario(ler(HASH));
    assert.ok(!/string_agg\([^)]*ORDER BY 1\b/i.test(sql));
    assert.match(sql, /string_agg\(x, '''' ORDER BY x COLLATE "C"\)/);
  });
});

// ── servidor de teste ────────────────────────────────────────────────────────

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

const SUFIXO = `${process.pid}`;
const BANCOS = { a: `audit_t_i_${SUFIXO}_a`, b: `audit_t_i_${SUFIXO}_b`, c: `audit_t_i_${SUFIXO}_c` };
const LEITOR = `audit_t_i_${SUFIXO}_leitor`;
let pg = null; // { url, psql, para() }
let pular = false;
let tmp;

function urlDe(banco) { const u = new URL(pg.url); u.pathname = `/${banco}`; return u.href; }
/** Roda SQL num banco e devolve { status, out, err }. `sql` pode usar \i 'arquivo' e meta-comandos. */
function psql(banco, sql, { parar = true } = {}) {
  const arq = path.join(tmp, `q-${Math.random().toString(36).slice(2)}.sql`);
  fs.writeFileSync(arq, sql);
  const r = spawnSync(pg.psql, [urlDe(banco), '-X', '-q', '-At', '-v', `ON_ERROR_STOP=${parar ? 1 : 0}`, '-f', arq], { encoding: 'utf8', env: { ...process.env, PGOPTIONS: '-c client_min_messages=warning' } });
  return { status: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
}
function ok(banco, sql) { const r = psql(banco, sql); assert.equal(r.status, 0, `${r.err}\n${sql.slice(0, 300)}`); return r.out; }
const I = (arquivo) => `\\i '${arquivo.replace(/'/g, "''")}'\n`;
const tabela = (saida) => Object.fromEntries(saida.split('\n').filter(Boolean).map((l) => { const [k, ...v] = l.split('|'); return [k, v.join('|')]; }));
const resumo = (banco) => tabela(ok(banco, I(RESUMO)));
const hashes = (banco) => tabela(ok(banco, I(HASH)));

const ESTRUTURA = `
CREATE SCHEMA storage; CREATE TABLE storage.buckets (id text PRIMARY KEY, name text);
INSERT INTO storage.buckets VALUES ('docs','docs'),('fotos','fotos');
CREATE SCHEMA supabase_migrations; CREATE TABLE supabase_migrations.schema_migrations (version text PRIMARY KEY);
INSERT INTO supabase_migrations.schema_migrations VALUES ('2024'),('2025'),('2026');
CREATE TABLE public.clientes (id int PRIMARY KEY, nome text, criado timestamptz, valor numeric(12,2), meta jsonb, blob bytea, f float8, d date, iv interval, tags text[]);
CREATE TABLE public.vazia (id int PRIMARY KEY, x text);
CREATE TABLE public."Tabela Maiúscula" (id int, "Coluna X" text);
CREATE TABLE public."com""aspas" (id int, v text);
CREATE TABLE public.sem_pk (a int, b text);
CREATE TABLE public.audit_logs (id int, t timestamptz DEFAULT clock_timestamp());
CREATE TABLE public.system_heartbeat (id int, t timestamptz DEFAULT clock_timestamp());
CREATE TABLE public.cron_job_run_details (id int, t timestamptz DEFAULT clock_timestamp());
CREATE TABLE public.part (id int, k int) PARTITION BY RANGE (k);
CREATE TABLE public.part_1 PARTITION OF public.part FOR VALUES FROM (0) TO (100);
CREATE TABLE public.part_2 PARTITION OF public.part FOR VALUES FROM (100) TO (200);
CREATE VIEW public.v_clientes AS SELECT id, nome FROM public.clientes;
CREATE INDEX ON public.clientes (nome);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY p1 ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE FUNCTION public.f1() RETURNS int LANGUAGE sql AS 'select 1';
CREATE FUNCTION public.tg() RETURNS trigger LANGUAGE plpgsql AS 'begin return new; end';
CREATE TRIGGER t1 BEFORE INSERT ON public.sem_pk FOR EACH ROW EXECUTE FUNCTION public.tg();
INSERT INTO public.audit_logs(id) VALUES (1); INSERT INTO public.system_heartbeat(id) VALUES (1); INSERT INTO public.cron_job_run_details(id) VALUES (1);
`;
const CRON = `CREATE SCHEMA cron; CREATE TABLE cron.job (jobid int PRIMARY KEY, jobname text); INSERT INTO cron.job VALUES (1,'a'),(2,'b'),(3,'c'),(4,'d');`;
const L = { // linhas de clientes, reutilizadas em ordens diferentes
  1: `(1,'Ana','2026-01-01 12:00:00+00',10.50,'{"b":1,"a":[1,2,{"z":null}]}','\\x00ff10',0.1,'2026-02-03','1 day 02:03:04','{x,y}')`,
  2: `(2,'Çélia "aspas" ''simples''','2026-06-15 23:59:59.123456-03',0.00,NULL,NULL,NULL,NULL,NULL,NULL)`,
  3: `(3,NULL,NULL,123456789.99,'{}','\\x',1e300,'1999-12-31','-3 mons','{}')`,
  4: `(4,'D','2026-03-29 02:30:00+01',-1.10,'[]','\\xdeadbeef',-0.0,'2026-11-09','00:00:00',NULL)`,
  5: `(5,'E','2026-10-25 01:30:00+00',5.00,'{"k":"v"}','\\x01',0.10000000149011612,'2026-01-01','1 year','{a}')`, // float que muda de texto com extra_float_digits
};
const DADOS_A = `
INSERT INTO public.clientes VALUES ${L[1]},${L[2]},${L[3]},${L[4]},${L[5]};
INSERT INTO public."Tabela Maiúscula" VALUES (1,'um'),(2,'dois'),(3,'três');
INSERT INTO public."com""aspas" VALUES (1,'a'),(2,'b');
INSERT INTO public.sem_pk VALUES (1,'dup'),(1,'dup'),(2,'x'),(NULL,NULL);
INSERT INTO public.part VALUES (1,10),(2,150),(3,20);
`;
// mesmas linhas: ordem inversa, lixo inserido e apagado no meio (muda a ordem física), jsonb com chaves trocadas
const DADOS_B = `
INSERT INTO public.clientes VALUES ${L[5]},${L[4]},(99,'lixo',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),${L[3]};
DELETE FROM public.clientes WHERE id = 99;
INSERT INTO public.clientes VALUES ${L[2]},${L[1].replace('{"b":1,"a":[1,2,{"z":null}]}', '{"a":[1,2,{"z":null}],"b":1}')};
INSERT INTO public."Tabela Maiúscula" VALUES (3,'três'),(1,'um'),(2,'dois');
INSERT INTO public."com""aspas" VALUES (2,'b'),(1,'a');
INSERT INTO public.sem_pk VALUES (NULL,NULL),(2,'x'),(1,'dup'),(1,'dup');
INSERT INTO public.part VALUES (3,20),(2,150),(1,10);
`;

function recriar(letra, { cron = false, dados = '', criar = '' } = {}) {
  ok('postgres', `DROP DATABASE IF EXISTS ${BANCOS[letra]}; CREATE DATABASE ${BANCOS[letra]} ${criar};`);
  ok(BANCOS[letra], ESTRUTURA + (cron ? CRON : '') + dados);
}

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-i-'));
  if (process.env.AUDIT_TEST_PG_URL) {
    const host = new URL(process.env.AUDIT_TEST_PG_URL).hostname.replace(/^\[|\]$/g, '');
    if (!['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('AUDIT_TEST_PG_URL recusada: só Postgres local descartável (127.0.0.1/localhost).');
    pg = { url: process.env.AUDIT_TEST_PG_URL, psql: 'psql', para() {} };
  } else if (process.getuid?.() === 0) {
    pular = 'rodando como root sem AUDIT_TEST_PG_URL (initdb não roda como root)';
  } else {
    const bindir = achaBindir();
    if (!bindir) { pular = 'sem AUDIT_TEST_PG_URL e sem initdb/pg_ctl na máquina'; return; }
    const dados = path.join(tmp, 'dados');
    const porta = await portaLivre();
    const init = spawnSync(path.join(bindir, 'initdb'), ['-D', dados, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8'], { encoding: 'utf8' });
    assert.equal(init.status, 0, init.stderr);
    const sobe = spawnSync(path.join(bindir, 'pg_ctl'), ['-D', dados, '-w', '-l', path.join(tmp, 'log'), '-o', `-p ${porta} -c listen_addresses=127.0.0.1 -c unix_socket_directories=''`, 'start'], { encoding: 'utf8' });
    assert.equal(sobe.status, 0, sobe.stdout + sobe.stderr);
    pg = {
      url: `postgres://postgres@127.0.0.1:${porta}/postgres`,
      psql: path.join(bindir, 'psql'),
      para() { spawnSync(path.join(bindir, 'pg_ctl'), ['-D', dados, '-m', 'immediate', '-w', 'stop']); },
    };
  }
  if (pg && spawnSync(pg.psql, ['--version']).status !== 0) { pg.para(); pg = null; pular = 'psql não encontrado no PATH'; }
  if (!pg) return;
  ok('postgres', `DO $$ DECLARE r text; BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN EXECUTE format('CREATE ROLE %I NOLOGIN', r); END IF; END LOOP; END $$;
    DROP ROLE IF EXISTS ${LEITOR}; CREATE ROLE ${LEITOR} NOLOGIN;`);
  recriar('a', { cron: true, dados: DADOS_A });
  recriar('b', { cron: false, dados: DADOS_B });
});
after(() => {
  if (pg) {
    for (const b of Object.values(BANCOS)) psql('postgres', `DROP DATABASE IF EXISTS ${b} WITH (FORCE);`, { parar: false });
    psql('postgres', `DROP ROLE IF EXISTS ${LEITOR};`, { parar: false });
    pg.para();
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});
const banco = (nome, fn) => test(nome, (t) => (pular ? t.skip(pular) : fn(t)));

// ── manifest_summary.sql ─────────────────────────────────────────────────────

describe('manifest_summary.sql', () => {
  const ESPERADO = { columns: '32', functions: '2', indexes: '3', migrations: '3', policies: '1', storage_buckets: '2', tables: '11', triggers: '1' };

  banco('com pg_cron: uma linha por seção, em ordem, com as contagens da fixture', () => {
    const saida = ok(BANCOS.a, I(RESUMO)).split('\n');
    assert.deepEqual(saida, ['columns|32', 'cron_jobs|4', 'functions|2', 'indexes|3', 'migrations|3', 'policies|1', 'storage_buckets|2', 'tables|11', 'triggers|1']);
  });

  banco('sem pg_cron: não quebra; cron_jobs sai NULL (ausente), o resto igual', () => {
    assert.deepEqual(tabela(ok(BANCOS.b, `\\pset null NULO\n${I(RESUMO)}`)), { ...ESPERADO, cron_jobs: 'NULO' });
  });

  banco('pg_cron instalado e sem jobs é 0, diferente de ausente', () => {
    recriar('c', { cron: true, dados: 'DELETE FROM cron.job;' });
    assert.equal(resumo(BANCOS.c).cron_jobs, '0');
  });

  banco('duas execuções na mesma sessão dão a mesma saída e não deixam tabela temporária', () => {
    const saida = ok(BANCOS.a, `${I(RESUMO)}\\echo ===\n${I(RESUMO)}\\echo ===\nSELECT to_regclass('pg_temp._manifest_summary') IS NULL;`).split('\n===\n');
    assert.equal(saida[0], saida[1]);
    assert.equal(saida[2], 't');
  });

  banco('sobra de execução abortada (temp table com lixo) não vaza para a saída nem dá erro', () => {
    const saida = ok(BANCOS.a, `CREATE TEMP TABLE _manifest_summary (section text, total bigint); INSERT INTO _manifest_summary VALUES ('lixo', 99), ('tables', 1);\n${I(RESUMO)}`);
    assert.deepEqual(tabela(saida), { ...ESPERADO, cron_jobs: '4' });
  });

  banco('tabela permanente homônima em public fica intacta', () => {
    recriar('c', { cron: true });
    const saida = ok(BANCOS.c, `CREATE TABLE public._manifest_summary (section text, total bigint); INSERT INTO public._manifest_summary VALUES ('minha', 7);\n${I(RESUMO)}\\echo ===\nSELECT * FROM public._manifest_summary;`).split('\n===\n');
    assert.equal(saida[1], 'minha|7');
    assert.equal(tabela(saida[0]).tables, '12'); // a tabela extra conta; a temporária do script não
  });

  banco('dentro de transação com ROLLBACK funciona e não deixa nada', () => {
    const antes = ok(BANCOS.a, 'SELECT count(*) FROM pg_class;');
    assert.deepEqual(tabela(ok(BANCOS.a, `BEGIN;\n${I(RESUMO)}ROLLBACK;`)), { ...ESPERADO, cron_jobs: '4' });
    assert.equal(ok(BANCOS.a, 'SELECT count(*) FROM pg_class;'), antes);
  });

  banco('é só leitura para o banco: nenhum objeto novo nem linha nova em cron/storage/migrations depois de rodar', () => {
    const foto = () => ok(BANCOS.a, `SELECT count(*) FROM pg_class; SELECT count(*) FROM pg_attribute; SELECT (SELECT sum(xmin::text::bigint) FROM cron.job), (SELECT sum(xmin::text::bigint) FROM storage.buckets), (SELECT sum(xmin::text::bigint) FROM supabase_migrations.schema_migrations);`);
    const antes = foto();
    resumo(BANCOS.a);
    assert.equal(foto(), antes);
  });

  banco('limite conhecido: em transação READ ONLY falha com erro claro (usa tabela temporária), sem saída parcial', () => {
    const r = psql(BANCOS.a, `SET default_transaction_read_only = on;\n${I(RESUMO)}`);
    assert.notEqual(r.status, 0);
    assert.match(r.err, /read-only transaction/);
    assert.equal(r.out, '');
  });
});

// ── content_hash.sql ─────────────────────────────────────────────────────────

describe('content_hash.sql', () => {
  const TABELAS = ['Tabela Maiúscula', 'clientes', 'com"aspas', 'part', 'sem_pk', 'vazia'];

  banco('mesmas linhas carregadas em ordem diferente: saída idêntica nos dois bancos', () => {
    const a = ok(BANCOS.a, I(HASH));
    assert.equal(a, ok(BANCOS.b, I(HASH)));
    assert.deepEqual(a.split('\n').map((l) => l.split('|')[0]), TABELAS); // ordenado, sem excluídas, sem partições-filhas, sem view
    for (const l of a.split('\n').filter((x) => !x.startsWith('vazia|'))) assert.match(l, /\|\d+\|[0-9a-f]{32}$/);
    assert.equal(tabela(a).clientes.split('|')[0], '5');
    assert.equal(tabela(a).part.split('|')[0], '3'); // tabela-mãe cobre as partições
  });

  banco('tabela vazia: 0 linhas e hash vazio (não NULL, para comparar com =)', () => {
    assert.ok(ok(BANCOS.a, `\\pset null NULO\n${I(HASH)}`).split('\n').includes('vazia|0|'));
  });

  for (const [caso, sql, afetada] of [
    ['1 valor de texto muda', `UPDATE public.clientes SET nome = 'Anna' WHERE id = 1`, 'clientes'],
    ['1 centavo muda', `UPDATE public.clientes SET valor = 10.51 WHERE id = 1`, 'clientes'],
    ['1 microssegundo muda', `UPDATE public.clientes SET criado = criado + interval '1 microsecond' WHERE id = 2`, 'clientes'],
    ['1 byte muda num bytea', `UPDATE public.clientes SET blob = '\\x00ff11' WHERE id = 1`, 'clientes'],
    ['1 valor dentro de jsonb muda', `UPDATE public.clientes SET meta = '{"b":2,"a":[1,2,{"z":null}]}' WHERE id = 1`, 'clientes'],
    ['NULL vira string vazia', `UPDATE public.clientes SET nome = '' WHERE id = 3`, 'clientes'],
    ['valores trocados entre duas linhas', `UPDATE public.clientes SET nome = CASE id WHEN 4 THEN 'E' ELSE 'D' END WHERE id IN (4, 5)`, 'clientes'],
    ['1 linha a mais', `INSERT INTO public."Tabela Maiúscula" VALUES (4, 'quatro')`, 'Tabela Maiúscula'],
    ['1 linha a menos', `DELETE FROM public."com""aspas" WHERE id = 2`, 'com"aspas'],
    ['linha duplicada a menos em tabela sem PK', `DELETE FROM public.sem_pk WHERE ctid = (SELECT min(ctid) FROM public.sem_pk WHERE a = 1)`, 'sem_pk'],
    ['linha muda de valor dentro de partição', `UPDATE public.part SET k = 151 WHERE id = 2`, 'part'],
    ['linha entra na tabela que estava vazia', `INSERT INTO public.vazia VALUES (1, NULL)`, 'vazia'],
  ]) {
    banco(`detecta diferença: ${caso} — e só a tabela afetada muda`, () => {
      recriar('c', { dados: DADOS_B });
      const base = hashes(BANCOS.a);
      assert.deepEqual(hashes(BANCOS.c), base);
      ok(BANCOS.c, `${sql};`);
      const depois = hashes(BANCOS.c);
      assert.deepEqual(Object.keys(depois).filter((t) => depois[t] !== base[t]), [afetada]);
    });
  }

  banco('mudança em tabela excluída (audit_logs, system_heartbeat, cron_job_run_details) não aparece', () => {
    recriar('c', { dados: `${DADOS_B} INSERT INTO public.audit_logs(id) VALUES (2),(3); DELETE FROM public.system_heartbeat;` });
    assert.deepEqual(hashes(BANCOS.c), hashes(BANCOS.a));
  });

  banco('não depende da sessão: TimeZone, IntervalStyle, extra_float_digits e bytea_output diferentes dão o mesmo hash', () => {
    const base = ok(BANCOS.a, I(HASH));
    const outra = ok(BANCOS.b, `SET TimeZone = 'America/Sao_Paulo'; SET IntervalStyle = 'iso_8601'; SET extra_float_digits = 0; SET bytea_output = 'escape'; SET DateStyle = 'SQL, DMY';\n${I(HASH)}\\echo ===\nSHOW TimeZone; SHOW IntervalStyle; SHOW extra_float_digits; SHOW bytea_output;`).split('\n===\n');
    assert.equal(outra[0], base);
    assert.equal(outra[1], 'America/Sao_Paulo\niso_8601\n0\nescape'); // e devolve a sessão como estava
  });

  banco('não depende da collation do banco (C x padrão do servidor)', () => {
    recriar('c', { dados: DADOS_B, criar: `TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'` });
    assert.equal(ok(BANCOS.c, I(HASH)), ok(BANCOS.a, I(HASH)));
  });

  banco('a consulta "uma tabela só" do rodapé dá o mesmo hash da linha da tabela', () => {
    const rodape = /^-- SELECT count\(\*\)[\s\S]*$/m.exec(ler(HASH))[0].split('\n').map((l) => l.replace(/^-- ?/, '')).join(' ');
    for (const [t, ident] of [['clientes', 'clientes'], ['Tabela Maiúscula', '"Tabela Maiúscula"'], ['vazia', 'vazia']]) {
      assert.equal(ok(BANCOS.a, `SET TimeZone = 'UTC';\n${rodape.replace('<tabela>', ident)}`), hashes(BANCOS.a)[t]);
    }
  });

  banco('duas execuções na mesma sessão, sobra de execução abortada e transação com ROLLBACK', () => {
    const base = ok(BANCOS.a, I(HASH));
    const duas = ok(BANCOS.a, `${I(HASH)}\\echo ===\n${I(HASH)}\\echo ===\nSELECT to_regclass('pg_temp._content_hash') IS NULL;`).split('\n===\n');
    assert.deepEqual(duas, [base, base, 't']);
    assert.equal(ok(BANCOS.a, `CREATE TEMP TABLE _content_hash (tablename text, row_count bigint, content_hash text); INSERT INTO _content_hash VALUES ('lixo', 1, 'x');\n${I(HASH)}`), base);
    assert.equal(ok(BANCOS.a, `BEGIN;\n${I(HASH)}ROLLBACK;`), base);
  });

  banco('é só leitura para o banco: nenhum objeto novo e nenhuma linha alterada depois de rodar', () => {
    const foto = () => ok(BANCOS.a, `SELECT count(*) FROM pg_class; SELECT count(*) FROM pg_attribute; SELECT sum(xmin::text::bigint) FROM public.clientes;`);
    const antes = foto();
    hashes(BANCOS.a);
    assert.equal(foto(), antes);
  });

  banco('RLS que esconderia linhas do role corrente: falha citando a tabela, em vez de hash parcial', () => {
    recriar('c', { dados: `${DADOS_A} GRANT USAGE ON SCHEMA public TO ${LEITOR}; GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${LEITOR};` });
    const r = psql(BANCOS.c, `SET ROLE ${LEITOR};\n${I(HASH)}`);
    assert.notEqual(r.status, 0);
    assert.match(r.err, /content_hash: falha em public\.clientes: .*row-level security/);
    assert.equal(r.out, '');
    // e, depois da falha, a mesma sessão roda de novo como dono sem "relation already exists"
    const r2 = psql(BANCOS.c, `SET ROLE ${LEITOR};\n${I(HASH)}RESET ROLE;\n${I(HASH)}`, { parar: false });
    assert.equal(r2.out, ok(BANCOS.a, I(HASH)));
  });

  banco('tabela ilegível para o role: falha citando a tabela', () => {
    recriar('c', { dados: `${DADOS_A} GRANT USAGE ON SCHEMA public TO ${LEITOR};` });
    const r = psql(BANCOS.c, `SET ROLE ${LEITOR};\n${I(HASH)}`);
    assert.notEqual(r.status, 0);
    assert.match(r.err, /content_hash: falha em public\./);
  });

  banco('limite documentado: null DENTRO de jsonb é ignorado ({"a":null} e {} dão o mesmo hash)', () => {
    recriar('c', { dados: DADOS_B });
    ok(BANCOS.c, `UPDATE public.clientes SET meta = '{"a": null}' WHERE id = 3;`);
    assert.deepEqual(hashes(BANCOS.c), hashes(BANCOS.a));
  });

  banco('200 mil linhas carregadas em ordem oposta: mesmo hash, em poucos segundos', () => {
    const carga = (ordem) => `CREATE TABLE public.grande (id int, txt text, quando timestamptz, v numeric);
      INSERT INTO public.grande SELECT g, 'linha ' || g, timestamptz '2026-01-01 00:00:00+00' + g * interval '1 second', g / 7.0 FROM generate_series(1, 200000) g ORDER BY g ${ordem};`;
    recriar('c', { dados: carga('ASC') });
    const t0 = Date.now();
    const asc = hashes(BANCOS.c).grande;
    const ms = Date.now() - t0;
    recriar('c', { dados: carga('DESC') });
    assert.equal(hashes(BANCOS.c).grande, asc);
    assert.match(asc, /^200000\|[0-9a-f]{32}$/);
    assert.ok(ms < 30000, `demorou ${ms} ms`);
  });
});
