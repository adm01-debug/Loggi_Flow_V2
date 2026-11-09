#!/usr/bin/env python3
"""Integração: roda snapshot.py de verdade contra um Postgres LOCAL e DESCARTÁVEL.

Pulado quando SNAPSHOT_TEST_PG_URL não está definido (CI e `pytest` sem banco continuam offline).
Aponte para um superusuário de um cluster de teste na própria máquina; host que não seja local é recusado.
O teste cria e apaga o banco `snapshot_it_<pid>` e os roles que faltarem (anon, authenticated, ...).

    SNAPSHOT_TEST_PG_URL=postgresql://postgres@127.0.0.1:54404/postgres \
        python3 scripts/supabase_snapshot/test_snapshot_postgres.py -v
"""

from __future__ import annotations

import importlib.util
import os
import pathlib
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

SCRIPT = pathlib.Path(__file__).with_name("snapshot.py")
ADMIN_URL = os.environ.get("SNAPSHOT_TEST_PG_URL", "").strip()
API_ROLES = ("anon", "authenticated", "service_role", "authenticator")
# Mesmo grep do passo "Guard - nenhum segredo na saida" de .github/workflows/contexto-ia.yml.
WORKFLOW_GUARD = re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sb_secret_|sb_publishable_|"
                            r"postgres(ql)?://[^ ]*:[^ @]+@")

# Tudo que carrega SENTINELA é dado de linha ou segredo: não pode aparecer em nenhum arquivo gerado.
FIXTURE = r"""
CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA cron; CREATE SCHEMA vault;
CREATE SCHEMA supabase_migrations; CREATE SCHEMA supabase_functions; CREATE SCHEMA app_privado;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, email_confirmed_at timestamptz,
  phone_confirmed_at timestamptz, created_at timestamptz DEFAULT now());
CREATE TABLE auth.identities (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text);
CREATE TABLE auth.mfa_factors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), factor_type text, status text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
INSERT INTO auth.users (email) VALUES ('usuario_SENTINELA@exemplo.com');

CREATE TYPE public.status_pedido AS ENUM ('rascunho', 'entregue');
CREATE TYPE app_privado.status_pedido AS ENUM ('a', 'b');

CREATE TABLE public.clientes (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid REFERENCES auth.users(id),
  nome text NOT NULL, email text UNIQUE, deleted_at timestamptz);
COMMENT ON TABLE public.clientes IS 'Clientes | cadastro "principal"';
CREATE INDEX clientes_user_id_idx ON public.clientes (user_id);
INSERT INTO public.clientes (nome, email) VALUES ('João SENTINELA da Silva', 'cliente_SENTINELA@exemplo.com');
CREATE TABLE public.depositos (regiao text, codigo integer, PRIMARY KEY (regiao, codigo));
CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id bigint NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  status public.status_pedido NOT NULL DEFAULT 'rascunho',
  status_interno app_privado.status_pedido,
  dep_codigo integer,  -- ordem física (codigo, regiao) diferente da ordem da FK (regiao, codigo)
  dep_regiao text,
  CONSTRAINT pedidos_deposito_fk FOREIGN KEY (dep_regiao, dep_codigo) REFERENCES public.depositos (regiao, codigo));
CREATE INDEX pedidos_cliente_idx ON public.pedidos (cliente_id);
CREATE TABLE public.sem_rls (id integer PRIMARY KEY);
CREATE TABLE public."Tabela Ação" ("Id" integer PRIMARY KEY, "Nome Completo" text, "com|pipe" text);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tabela Ação" ENABLE ROW LEVEL SECURITY;
CREATE POLICY clientes_select ON public.clientes FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Pedidos: tudo" ON public.pedidos AS RESTRICTIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE FUNCTION public.has_role(_user uuid, _role text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public AS $$ SELECT _role = 'admin' $$;
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE FUNCTION app_privado.com_segredo() RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM 'Bearer @@JWT_FIXTURE@@';
  PERFORM 'postgresql://postgres.ref:senha_SENTINELA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';
  RETURN 'sb_secret_' || 'x';
END $fn$;

CREATE VIEW public.v_sem_invoker AS SELECT id FROM public.clientes;
CREATE VIEW public.v_invoker_on WITH (security_invoker = on) AS SELECT id FROM public.clientes;
CREATE MATERIALIZED VIEW public.mv_resumo AS SELECT status, count(*) AS n FROM public.pedidos GROUP BY 1 WITH NO DATA;

GRANT SELECT ON public.clientes, public.mv_resumo TO anon;
GRANT SELECT, INSERT ON public.pedidos TO authenticated;
GRANT SELECT ("Id") ON public."Tabela Ação" TO anon;

CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint,
  allowed_mime_types text[], created_at timestamptz DEFAULT '2026-01-02 03:04:05+00');
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, metadata jsonb);
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovantes', 'comprovantes', false);
INSERT INTO storage.objects (bucket_id, name, metadata) VALUES ('comprovantes', 'rg_SENTINELA.pdf', '{"size": 10}');

CREATE TABLE vault.secrets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, description text, secret text,
  created_at timestamptz DEFAULT '2026-02-03 04:05:06+00');
INSERT INTO vault.secrets (name, secret) VALUES ('service_role_key', 'cifrado_SENTINELA');
CREATE VIEW vault.decrypted_secrets AS SELECT name, 'decifrado_SENTINELA' AS decrypted_secret FROM vault.secrets;

CREATE TABLE cron.job (jobid bigserial PRIMARY KEY, schedule text, command text, database text DEFAULT current_database(),
  username text DEFAULT 'postgres', active boolean DEFAULT true, jobname text);
CREATE TABLE cron.job_run_details (jobid bigint, runid bigserial PRIMARY KEY, username text DEFAULT 'postgres', status text,
  return_message text, start_time timestamptz, end_time timestamptz);
ALTER TABLE cron.job ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron.job_run_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY cron_job_policy ON cron.job USING (username = current_user);
CREATE POLICY cron_job_run_details_policy ON cron.job_run_details USING (username = current_user);
INSERT INTO cron.job (schedule, command, jobname) VALUES ('0 3 * * *', 'SELECT public.has_role(NULL, ''admin'')', 'limpeza-diaria');
INSERT INTO cron.job_run_details (jobid, status, return_message, start_time, end_time) VALUES (1, 'failed',
  E'ERROR:  duplicate key value violates unique constraint "clientes_email_key"\nDETAIL:  Key (email)=(cron_SENTINELA@exemplo.com) already exists.',
  now() - interval '1 hour', now() - interval '1 hour' + interval '2 seconds');
INSERT INTO pg_extension (oid, extname, extowner, extnamespace, extrelocatable, extversion)
  VALUES (900001, 'pg_cron', 10, 'cron'::regnamespace, false, '1.6'), (900002, 'supabase_vault', 10, 'vault'::regnamespace, false, '0.3');

CREATE TABLE supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text);
INSERT INTO supabase_migrations.schema_migrations VALUES
  ('20260901000000', ARRAY['CREATE ROLE etl LOGIN PASSWORD ''migration_SENTINELA'''], 'cron_jobs_canonical');
"""
# Montado em tempo de execução: um JWT literal no arquivo dispara o gitleaks.
FIXTURE = FIXTURE.replace("@@JWT_FIXTURE@@", ".".join((
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "eyJyb2xlIjoic2VydmljZV9yb2xlIn0", "assinatura_SENTINELA_123")))


def local_admin_url() -> str:
    """Só banco local: este teste cria objetos e não pode nem por engano encostar no banco oficial."""
    import psycopg.conninfo
    info = psycopg.conninfo.conninfo_to_dict(ADMIN_URL)
    host = str(info.get("host") or "")
    if host not in ("localhost", "127.0.0.1", "::1") and not host.startswith("/"):
        raise unittest.SkipTest(f"SNAPSHOT_TEST_PG_URL recusado: host {host!r} não é local")
    return ADMIN_URL


@unittest.skipUnless(ADMIN_URL, "defina SNAPSHOT_TEST_PG_URL (superusuário de um Postgres local descartável)")
class SnapshotPostgresTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            import psycopg
            import psycopg.conninfo
        except ImportError:
            raise unittest.SkipTest("psycopg não instalado") from None
        cls.psycopg = psycopg
        cls.admin_url = local_admin_url()
        cls.database = f"snapshot_it_{os.getpid()}"
        cls.reader = f"snapshot_it_reader_{os.getpid()}"
        cls.reader_password = "leitor_SENTINELA_" + secrets.token_hex(6)
        cls.temp = tempfile.TemporaryDirectory(prefix="snapshot-pg-test-")
        cls.created_roles = []
        with psycopg.connect(cls.admin_url, autocommit=True) as conn:
            # Em cluster SQL_ASCII (initdb com locale C) o psycopg devolve texto como bytes.
            existing = {r.decode() if isinstance(r, bytes) else r
                        for (r,) in conn.execute("SELECT rolname FROM pg_roles").fetchall()}
            for role in API_ROLES:
                if role not in existing:
                    conn.execute(f'CREATE ROLE "{role}" NOLOGIN')
                    cls.created_roles.append(role)
            conn.execute(f'CREATE ROLE "{cls.reader}" LOGIN PASSWORD \'{cls.reader_password}\' IN ROLE pg_read_all_data')
            cls.created_roles.append(cls.reader)
            # UTF8 explícito: o fixture tem acento e o Supabase é UTF8; num cluster com locale C o
            # banco herdaria SQL_ASCII e o setUp quebraria (deixando roles órfãos).
            conn.execute(f'CREATE DATABASE "{cls.database}" TEMPLATE template0 ENCODING \'UTF8\' LC_COLLATE \'C\' LC_CTYPE \'C\'')
        try:
            with psycopg.connect(cls.url_for(), autocommit=True) as conn:
                conn.execute(FIXTURE)
                conn.execute(f'GRANT USAGE ON SCHEMA cron, vault, storage, auth, supabase_migrations TO "{cls.reader}"')
            cls.admin = cls.run_snapshot("admin", cls.url_for())
            cls.reader_run = cls.run_snapshot("reader", cls.url_for(user=cls.reader, password=cls.reader_password))
        except BaseException:
            cls.tearDownClass()  # setUpClass que falha não chama tearDownClass: sem isto sobram banco e roles
            raise

    @classmethod
    def tearDownClass(cls):
        with cls.psycopg.connect(cls.admin_url, autocommit=True) as conn:
            conn.execute(f'DROP DATABASE IF EXISTS "{cls.database}" WITH (FORCE)')
            for role in reversed(cls.created_roles):
                conn.execute(f'DROP ROLE IF EXISTS "{role}"')
        cls.temp.cleanup()

    @classmethod
    def url_for(cls, **overrides) -> str:
        """URL postgresql:// (o formato que o workflow entrega) para o banco de fixture."""
        from urllib.parse import quote
        info = {**cls.psycopg.conninfo.conninfo_to_dict(cls.admin_url), **overrides}
        auth = quote(str(info.get("user") or ""), safe="")
        if info.get("password"):
            auth += ":" + quote(str(info["password"]), safe="")
        host, port = str(info.get("host") or "localhost"), info.get("port") or 5432
        if host.startswith("/"):
            return f"postgresql://{auth}@/{cls.database}?host={quote(host, safe='')}&port={port}"
        return f"postgresql://{auth}@{host}:{port}/{cls.database}"

    @classmethod
    def run_snapshot(cls, name, url, out=None):
        out = out or pathlib.Path(cls.temp.name) / name
        env = {"PATH": os.environ.get("PATH", ""), "SUPABASE_DB_URL": url, "SNAPSHOT_DIR": str(out),
               "PGDUMP": "false", "GEN_TYPES": "false", "REPO_ROOT": ""}
        result = subprocess.run([sys.executable, "-B", str(SCRIPT)], env=env, cwd=cls.temp.name,
                                capture_output=True, text=True, timeout=120, check=False)
        return result, out

    def text(self, run, name):
        return (run[1] / name).read_text(encoding="utf-8")

    def everything(self, run):
        return {path: path.read_text(encoding="utf-8") for path in run[1].rglob("*") if path.is_file()}

    def test_collection_succeeds_without_section_errors(self):
        result, _ = self.admin
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("_nenhum_", self.text(self.admin, "errors.md"))
        self.assertIn("| tabelas | 5 |", self.text(self.admin, "README.md"))

    def test_composite_foreign_key_pairs_columns_in_constraint_order(self):
        self.assertIn("| public.pedidos | dep_regiao, dep_codigo | public.depositos | regiao, codigo |",
                      self.text(self.admin, "relationships.md"))

    def test_enum_usage_is_resolved_by_schema(self):
        types = self.text(self.admin, "types-enums.md")
        self.assertIn("| app_privado.status_pedido | enum | a, b | public.pedidos.status_interno |", types)
        self.assertIn("| public.status_pedido | enum | rascunho, entregue | public.mv_resumo.status, public.pedidos.status |", types)

    def test_security_invoker_on_is_not_reported_as_definer_view(self):
        lints = self.text(self.admin, "lints.md")
        self.assertIn("| ALTA | view_security_definer | public.v_sem_invoker |", lints)
        self.assertNotIn("public.v_invoker_on", lints)
        self.assertIn("| ALTA | secdef_mutable_search_path | public.handle_new_user() |", lints)
        self.assertIn("| ALTA | rls_disabled | public.sem_rls |", lints)

    def test_quoted_names_policies_and_internal_triggers_are_rendered(self):
        table = self.text(self.admin, "tables/public/Tabela_A_o.md")
        self.assertIn("# public.Tabela Ação", table)
        self.assertIn("| 3 | `com\\|pipe` | `text` |", table)
        self.assertIn("| Id | anon | SELECT |", table)
        self.assertIn("| public.pedidos | Pedidos: tudo | ALL | RESTRICTIVE | authenticated |", self.text(self.admin, "policies.md"))
        self.assertIn("| auth.users | on_auth_user_created | AFTER | INSERT |", self.text(self.admin, "triggers.md"))
        self.assertIn('Clientes \\| cadastro "principal"', self.text(self.admin, "tables.md"))

    def test_grants_do_not_depend_on_the_connection_role(self):
        grants = self.text(self.admin, "grants.md")
        for row in ("| public.clientes | anon | SELECT |", "| public.mv_resumo | anon | SELECT |",
                    "| public.pedidos | authenticated | INSERT, SELECT |", "| public.Tabela Ação.Id | anon | SELECT |"):
            self.assertIn(row, grants)
        self.assertEqual(self.reader_run[0].returncode, 0, self.reader_run[0].stderr)
        self.assertEqual(self.text(self.reader_run, "grants.md"), grants)

    def test_cron_jobs_hidden_from_a_reader_role_are_flagged(self):
        self.assertIn("| 1 | limpeza-diaria |", self.text(self.admin, "cron.md"))
        self.assertNotIn("limpeza-diaria", self.text(self.reader_run, "cron.md"))
        self.assertIn("| cron.rls |", self.text(self.reader_run, "errors.md"))

    def test_no_row_data_or_secret_reaches_any_output_or_log(self):
        for run in (self.admin, self.reader_run):
            self.assertNotIn("SENTINELA", run[0].stdout + run[0].stderr)
            for path, content in self.everything(run).items():
                self.assertNotIn("SENTINELA", content, path.name)
                self.assertIsNone(WORKFLOW_GUARD.search(content), f"guard do workflow reprovaria {path.name}")
        self.assertIn("| service_role_key |", self.text(self.admin, "vault.md"))
        self.assertIn('violates unique constraint "clientes_email_key" |', self.text(self.admin, "cron-runs.md"))
        self.assertIn("postgresql://[REDACTED CREDENTIALS]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",
                      self.text(self.admin, "functions/app_privado/com_segredo__" + "12ae32cb1ec02d01.sql"))

    def test_second_collection_is_byte_identical_outside_volatile_files(self):
        copy = pathlib.Path(self.temp.name) / "again"
        shutil.copytree(self.admin[1], copy)
        result, _ = self.run_snapshot("again", self.url_for(), out=copy)
        self.assertEqual(result.returncode, 0, result.stderr)
        volatile = {"manifest.json", "stats.json", "stats.md", "cron-runs.md"}
        first = {p.relative_to(self.admin[1]): c for p, c in self.everything(self.admin).items() if p.name not in volatile}
        second = {p.relative_to(copy): p.read_text(encoding="utf-8") for p in copy.rglob("*") if p.is_file() and p.name not in volatile}
        self.assertEqual(first, second)

    def test_session_rejects_writes(self):
        spec = importlib.util.spec_from_file_location("snapshot_pg_readonly", SCRIPT)
        snapshot = importlib.util.module_from_spec(spec)
        env = {"SUPABASE_DB_URL": self.url_for(), "SNAPSHOT_DIR": str(pathlib.Path(self.temp.name) / "unused")}
        with mock.patch.dict(os.environ, env, clear=True):
            spec.loader.exec_module(snapshot)

        @snapshot.section("escrita")
        def write(conn):
            return snapshot.q(conn, "CREATE TABLE public.nao_pode_existir (id integer)")

        snapshot.DB_SECTIONS = [write]
        with mock.patch.object(snapshot, "log"):
            db, _ = snapshot.introspect_db(None)
        self.assertIsNone(db["escrita"])
        self.assertIn("read-only transaction", snapshot.ERRORS[0]["error"])
        with self.psycopg.connect(self.url_for(), autocommit=True) as conn:
            self.assertIsNone(conn.execute("SELECT to_regclass('public.nao_pode_existir')").fetchone()[0])

    def test_refused_connection_fails_in_one_line_without_the_password(self):
        # Banco inexistente falha com qualquer método de autenticação (senha errada passa em pg_hba `trust`).
        out = pathlib.Path(self.temp.name) / "denied"
        url = self.url_for(user=self.reader, password="errada_SENTINELA").replace(self.database, "banco_que_nao_existe")
        result, _ = self.run_snapshot("denied", url, out=out)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(len(result.stderr.strip().splitlines()), 1, result.stderr)
        self.assertIn("Banco inacessível — nada foi coletado nem sobrescrito.", result.stderr)
        self.assertNotIn("SENTINELA", result.stdout + result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        self.assertEqual([p.name for p in out.iterdir()], [".supabase-snapshot-output"])


if __name__ == "__main__":
    unittest.main()
