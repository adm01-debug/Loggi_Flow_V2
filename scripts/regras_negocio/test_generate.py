"""Regressões offline do gerador de regras; não acessam banco nem APIs de LLM."""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("generate.py")
SPEC = importlib.util.spec_from_file_location("context_rules_generate", SCRIPT)
generator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(generator)


class CurrentSqlSourcesTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="context-rules-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.files = []

    def write(self, name, content):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(content, encoding="utf-8")
        self.files.append(file)
        return file

    def schema(self):
        return generator.parse_sql_schema(self.root, self.files)

    def test_foreign_migration_cannot_replace_current_table(self):
        current = "supabase/migrations/20260101000000_orders.sql"
        self.write(current, "CREATE TABLE public.orders (id uuid, created_at timestamptz);")
        self.write("supabase/migrations/_foreign/another-project/20250101000000_orders.sql",
                   "CREATE TABLE public.orders (id uuid, changed_at timestamptz);")
        schema = self.schema()
        self.assertEqual([c["name"] for c in schema["tables"]["orders"]["columns"]], ["id", "created_at"])
        self.assertEqual(schema["tables"]["orders"]["src"], current)
        self.assertEqual(schema["sources"], [current])

    def test_superseded_migration_cannot_undo_current_changes(self):
        self.write("supabase/migrations/20260101000000_orders.sql", "CREATE TABLE public.orders (id uuid);")
        self.write("supabase/migrations/20260102000000_status.sql", "ALTER TABLE public.orders ADD COLUMN status text;")
        self.write("supabase/migrations/_superseded/20250101000000_orders.sql", "DROP TABLE public.orders;")
        schema = self.schema()
        self.assertIn("orders", schema["tables"])
        self.assertEqual([c["name"] for c in schema["tables"]["orders"]["columns"]], ["id", "status"])
        self.assertEqual(len(schema["sources"]), 2)

    def test_archived_objects_do_not_contribute_to_schema_or_rules(self):
        sql = """
CREATE TYPE order_state AS ENUM ('open', 'done');
CREATE TABLE public.orders (id uuid PRIMARY KEY, status order_state DEFAULT 'open', amount numeric CHECK (amount >= 0));
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select ON public.orders FOR SELECT TO authenticated USING (true);
CREATE FUNCTION public.ensure_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'amount cannot be negative';
  RETURN NEW;
END;
$$;
CREATE TRIGGER ensure_order_before BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.ensure_order();
CREATE INDEX orders_status ON public.orders (status);
CREATE VIEW public.open_orders AS SELECT * FROM public.orders;
GRANT SELECT ON public.orders TO authenticated;
COMMENT ON TABLE public.orders IS 'Current orders';
SELECT cron.schedule('daily_orders', '0 0 * * *', $$SELECT 1$$);
"""
        self.write("supabase/migrations/20260101000000_orders.sql", sql)
        self.write("supabase/seed.sql", "INSERT INTO public.orders (id) VALUES ('current');")
        expected = self.schema()
        for key in ("tables", "policies", "triggers", "functions", "enums", "indexes", "cron_jobs",
                    "views", "rls", "grants", "raises", "seed", "comments"):
            self.assertTrue(expected[key], key)
        self.write("supabase/migrations/_foreign/old-project/20240101000000_schema.sql",
                   sql.replace("orders", "foreign_orders").replace("order_state", "foreign_state").replace("ensure_order", "ensure_foreign"))
        self.write("supabase/migrations/_superseded/20240102000000_seed.sql", "INSERT INTO public.orders (id) VALUES ('historical');")
        self.assertEqual(self.schema(), expected)

    def test_archive_only_repository_has_no_current_sql_schema(self):
        self.write("db/migrations/_foreign/old.sql", "CREATE TABLE old_foreign (id uuid);")
        self.write("db/migrations/_superseded/old.sql", "CREATE TABLE old_superseded (id uuid);")
        schema = self.schema()
        self.assertEqual(schema["sources"], [])
        self.assertEqual(schema["tables"], {})

    def test_exact_directory_names_leave_other_sql_sources_visible(self):
        # O nome de um diretório acima da raiz do repo não muda seu significado.
        self.root = self.root / "_foreign" / "project"
        paths = [
            "supabase/migrations/_foreign.sql",
            "supabase/migrations/_superseded.sql",
            "supabase/migrations/customer_foreign/active.sql",
            "supabase/migrations/_superseded_backup/active.sql",
            "packages/store/prisma/migrations/20260101/active.sql",
            "db/current.sql",
            "sql/current.sql",
            "database/current.sql",
            "prisma/current.sql",
            "custom/schema.sql",
        ]
        for index, name in enumerate(paths):
            self.write(name, f"CREATE TABLE current_{index} (id uuid);")
        schema = self.schema()
        self.assertEqual(schema["sources"], sorted(paths))
        self.assertEqual(set(schema["tables"]), {f"current_{i}" for i in range(len(paths))})

    def test_current_prisma_and_types_fallback_remain_available(self):
        self.write("prisma/schema.prisma", "model Store {\n id String @id\n}\n")
        self.write("src/database.types.ts", """
export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
        }
      }
    }
  }
}
""")
        schema = self.schema()
        self.assertEqual(set(schema["tables"]), {"Store", "customers"})
        self.assertEqual(schema["tables"]["Store"]["origin"], "prisma")
        self.assertEqual(schema["tables"]["customers"]["origin"], "types.ts")

    def test_archived_sql_is_not_current_code_but_remains_in_file_inventory(self):
        current = self.write("supabase/migrations/20260101000000_retention.sql", "SELECT now() - interval '7 days';")
        archived = self.write("supabase/migrations/_superseded/20250101000000_retention.sql", "SELECT now() - interval '365 days';")
        self.assertTrue(generator.analyze_code_file(current, self.root)["temporal"])
        self.assertIsNone(generator.analyze_code_file(archived, self.root))
        files = generator.walk_repo(self.root, self.root / "output")
        self.assertEqual(set(files), {current, archived})

    def test_cli_rules_profile_uses_current_schema_and_temporal_rules(self):
        current = "supabase/migrations/20260101000000_orders.sql"
        archived = "supabase/migrations/_superseded/20250101000000_orders.sql"
        self.write(current, "CREATE TABLE public.orders (id uuid, created_at timestamptz);\nSELECT now() - interval '7 days';")
        self.write(archived, "CREATE TABLE public.orders (id uuid, historical_status text);\nSELECT now() - interval '365 days';")
        subprocess.run([sys.executable, str(SCRIPT), "--repo", str(self.root), "--out", "output",
                        "--profile", "regras", "--no-pointer"], check=True, capture_output=True, text=True, timeout=30)
        context = json.loads((self.root / "output/context.json").read_text(encoding="utf-8"))
        self.assertEqual(context["schema"]["sources"], [current])
        self.assertEqual([c["name"] for c in context["schema"]["tables"]["orders"]["columns"]], ["id", "created_at"])
        self.assertEqual(context["rules"]["temporal"], [{"file": current, "line": "SELECT now() - interval '7 days';"}])
        self.assertIn(current, context["code_files"])
        self.assertNotIn(archived, context["code_files"])
        self.assertEqual(context["meta"]["files_total"], 2)
        rendered = (self.root / "output/07-REGRAS-DE-NEGOCIO.md").read_text(encoding="utf-8")
        self.assertIn("7 days", rendered)
        self.assertNotIn("365 days", rendered)
        self.assertNotIn("historical_status", rendered)
        self.assertFalse((self.root / "AGENTS.md").exists())


class FixtureRepo:
    """Repositório temporário + atalhos; sem testes próprios, para as classes abaixo não repetirem os de cima."""
    setUp = CurrentSqlSourcesTests.setUp
    write = CurrentSqlSourcesTests.write
    schema = CurrentSqlSourcesTests.schema

    def analyze(self, name, content):
        return generator.analyze_code_file(self.write(name, content), self.root)

    def cli(self, *extra, repo=None):
        return subprocess.run([sys.executable, str(SCRIPT), "--repo", str(repo or self.root), "--out", "docs/contexto/regras",
                               "--profile", "regras", "--no-pointer", *extra], capture_output=True, text=True, timeout=60)

    def context(self):
        return json.loads((self.root / "docs/contexto/regras/context.json").read_text(encoding="utf-8"))


class SqlReplayTests(FixtureRepo, unittest.TestCase):
    """O histórico de migrations é reproduzido como o Postgres o executaria (casos reais deste repo)."""

    MIG = "supabase/migrations/2026010100000{}_m.sql"

    def test_apostrophe_inside_quoted_policy_name_does_not_swallow_following_statements(self):
        self.write(self.MIG.format(0), """
CREATE TABLE public.fretes (id uuid, organization_id uuid);
CREATE POLICY "Users can view their organization's fretes" ON public.fretes FOR SELECT USING (true);
CREATE POLICY "Users can insert their organization's fretes" ON public.fretes FOR INSERT WITH CHECK (true);
CREATE TABLE public.depois (id uuid);
""")
        schema = self.schema()
        self.assertEqual([(p["name"], p["cmd"]) for p in schema["policies"]],
                         [("Users can view their organization's fretes", "SELECT"), ("Users can insert their organization's fretes", "INSERT")])
        self.assertIn("depois", schema["tables"])

    def test_drop_policy_matches_quoted_name_containing_the_word_on(self):
        self.write(self.MIG.format(0), """
CREATE TABLE public.freight_webhooks (id uuid);
CREATE POLICY "Enable all for authenticated users on webhooks" ON public.freight_webhooks FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for authenticated users on webhooks" ON public.freight_webhooks;
CREATE POLICY "Admins manage freight_webhooks" ON public.freight_webhooks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
""")
        self.assertEqual([p["name"] for p in self.schema()["policies"]], ["Admins manage freight_webhooks"])

    def test_drop_table_takes_policies_triggers_indexes_and_rls_with_it(self):
        self.write(self.MIG.format(0), """
CREATE TABLE public.saved_filters (id uuid);
CREATE TABLE public.outra (id uuid);
CREATE TABLE public.fica (id uuid);
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own filters" ON public.saved_filters FOR SELECT USING (true);
CREATE POLICY "fica_select" ON public.fica FOR SELECT USING (true);
CREATE TRIGGER trg_saved BEFORE UPDATE ON public.saved_filters FOR EACH ROW EXECUTE FUNCTION public.touch();
CREATE INDEX idx_saved ON public.saved_filters (id);
""")
        self.write(self.MIG.format(1), """
DROP TABLE IF EXISTS public.saved_filters, public.outra CASCADE;
CREATE TABLE public.saved_filters (id uuid, name text);
""")
        schema = self.schema()
        self.assertEqual(set(schema["tables"]), {"saved_filters", "fica"})
        self.assertEqual([p["name"] for p in schema["policies"]], ["fica_select"])
        self.assertEqual(schema["triggers"], [])
        self.assertEqual(schema["indexes"], [])
        self.assertNotIn("saved_filters", schema["rls"])

    def test_create_table_if_not_exists_is_a_noop_for_an_existing_table(self):
        self.write(self.MIG.format(0), "CREATE TABLE public.mappings (id uuid, mapping_config jsonb);")
        self.write(self.MIG.format(1), "ALTER TABLE public.mappings ADD COLUMN ativo boolean;")
        self.write(self.MIG.format(2), "CREATE TABLE IF NOT EXISTS public.mappings (id uuid, config jsonb, updated_at timestamptz);")
        schema = self.schema()
        self.assertEqual([c["name"] for c in schema["tables"]["mappings"]["columns"]], ["id", "mapping_config", "ativo"])
        self.assertEqual(schema["tables"]["mappings"]["src"], self.MIG.format(0))

    def test_alter_table_with_several_actions_keeps_every_column_and_full_types(self):
        self.write(self.MIG.format(0), """
CREATE TABLE public.entregas (id uuid, velho text, obs text);
ALTER TABLE public.entregas
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{a,b}',
DROP COLUMN velho,
ALTER COLUMN obs SET DEFAULT 'x, y';
ALTER TABLE public.entregas ADD COLUMN nexus_score numeric(5,2) DEFAULT 0;
ALTER TABLE public.entregas ADD PRIMARY KEY (id, latitude);
ALTER TABLE public.entregas ADD CONSTRAINT nexus_range CHECK (nexus_score >= 0 AND nexus_score <= 100), ADD COLUMN extra int;
""")
        table = self.schema()["tables"]["entregas"]
        types = {c["name"]: c["type"] for c in table["columns"]}
        self.assertEqual(list(types), ["id", "obs", "latitude", "longitude", "tags", "nexus_score", "extra"])
        self.assertEqual(types["latitude"], "DECIMAL(10, 8)")
        self.assertEqual(types["nexus_score"], "numeric(5,2) DEFAULT 0")
        self.assertEqual(types["tags"], "text[] DEFAULT '{a,b}'")
        self.assertIn("DEFAULT 'x, y'", types["obs"])
        self.assertEqual(table["constraints"], ["PRIMARY KEY (id, latitude)", "constraint nexus_range CHECK (nexus_score >= 0 AND nexus_score <= 100)"])

    def test_columns_whose_names_start_with_a_constraint_keyword_are_columns(self):
        self.write(self.MIG.format(0), """
CREATE TABLE public.health (
  id uuid PRIMARY KEY,
  checked_at timestamptz NOT NULL DEFAULT now(),
  checks jsonb,
  unique_code text,
  like_count int,
  excluded boolean,
  UNIQUE (unique_code),
  CHECK (like_count >= 0),
  CONSTRAINT health_code CHECK (unique_code <> '')
);""")
        table = self.schema()["tables"]["health"]
        self.assertEqual([c["name"] for c in table["columns"]], ["id", "checked_at", "checks", "unique_code", "like_count", "excluded"])
        self.assertEqual(len(table["constraints"]), 3)

    def test_literal_ddl_inside_do_blocks_counts_and_runtime_built_ddl_does_not(self):
        self.write(self.MIG.format(0), """
CREATE TABLE public.user_roles (id uuid);
CREATE TABLE public.webhook_events (id uuid);
CREATE TABLE public.rastreio (id uuid);
CREATE POLICY "antiga" ON public.webhook_events FOR SELECT USING (true);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Admins can view webhook logs') THEN
    CREATE POLICY "Admins can view webhook logs" ON public.webhook_events FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'admin'));
  END IF;
  DROP POLICY IF EXISTS "antiga" ON public.webhook_events;
END $$;
DO $do1$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only admins can delete roles') THEN
    EXECUTE 'CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $do1$;
DO $$ BEGIN
  CREATE TYPE public.achievement_tier AS ENUM ('bronze', 'silver');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables LOOP
    EXECUTE format('CREATE POLICY "dinamica" ON public.%I FOR SELECT USING (true)', t);
    EXECUTE 'CREATE POLICY "concatenada" ON public.' || t || ' FOR SELECT USING (true)';
  END LOOP;
  ALTER TABLE public.rastreio ADD COLUMN IF NOT EXISTS lat numeric(9,6), ADD COLUMN IF NOT EXISTS lng numeric(9,6);
END $$;
""")
        schema = self.schema()
        policies = {p["name"]: p for p in schema["policies"]}
        self.assertEqual(set(policies), {"Admins can view webhook logs", "Only admins can delete roles"})
        self.assertEqual(policies["Only admins can delete roles"]["cmd"], "DELETE")
        self.assertEqual(policies["Only admins can delete roles"]["roles"], "authenticated")
        self.assertEqual(policies["Only admins can delete roles"]["using"], "public.has_role(auth.uid(), 'admin')")
        self.assertEqual(policies["Admins can view webhook logs"]["using"], "auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'admin')")
        self.assertEqual(schema["enums"]["achievement_tier"], ["bronze", "silver"])
        self.assertEqual([c["name"] for c in schema["tables"]["rastreio"]["columns"]], ["id", "lat", "lng"])

    def test_alter_function_hardening_in_a_later_migration_is_applied(self):
        function = """
CREATE OR REPLACE FUNCTION public.{name}() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $fn1$
BEGIN
  PERFORM 1;
END;
$fn1$;
"""
        self.write(self.MIG.format(0), function.format(name="update_user_rank") + function.format(name="sem_hardening")
                   + "CREATE TABLE public.depois_da_funcao (id uuid);")
        self.write(self.MIG.format(1), "ALTER FUNCTION public.update_user_rank() SET search_path = public;")
        schema = self.schema()
        self.assertIn("depois_da_funcao", schema["tables"])  # $fn1$ (tag com dígito) fecha a função
        self.assertTrue(schema["functions"]["update_user_rank"]["security_definer"])
        self.assertTrue(schema["functions"]["update_user_rank"]["search_path"])
        self.assertFalse(schema["functions"]["sem_hardening"]["search_path"])

    def test_dropped_views_do_not_linger(self):
        self.write(self.MIG.format(0), """
CREATE MATERIALIZED VIEW public.mv_dashboard AS SELECT 1 AS x;
CREATE VIEW public.v_fica AS SELECT 1 AS x;
CREATE VIEW public.v_sai AS SELECT 2 AS x;
""")
        self.write(self.MIG.format(1), """
DROP MATERIALIZED VIEW IF EXISTS public.mv_dashboard CASCADE;
DROP VIEW IF EXISTS public.v_sai;
CREATE MATERIALIZED VIEW internal.mv_dashboard AS SELECT 1 AS x;
""")
        self.assertEqual(set(self.schema()["views"]), {"v_fica", "internal.mv_dashboard"})

    def test_renamed_table_keeps_its_policies_and_triggers(self):
        self.write(self.MIG.format(0), """
CREATE TABLE public.audit_logs (id uuid);
CREATE POLICY "Admins view" ON public.audit_logs FOR SELECT USING (true);
CREATE TRIGGER trg_audit BEFORE INSERT ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.f();
ALTER TABLE public.audit_logs RENAME TO audit_logs_old;
""")
        schema = self.schema()
        self.assertEqual([p["table"] for p in schema["policies"]], ["audit_logs_old"])
        self.assertEqual([t["table"] for t in schema["triggers"]], ["audit_logs_old"])


class ExtractionNoiseTests(FixtureRepo, unittest.TestCase):
    """Fatos errados ou ruído evidente que saíam no 07/11 deste repo."""

    def test_constant_with_arithmetic_keeps_the_whole_expression(self):
        info = self.analyze("src/lib/limits.ts", """
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_TIMEOUT = 15_000;
const MAX_REQUESTS_PER_WINDOW = 100;
const CARRIER_ALL_LABEL = "Todas" as const;
const WINDOW_FROM_VAR = 5 * MINUTE;
""")
        self.assertEqual({p["name"]: p["value"] for p in info["params"]},
                         {"RATE_LIMIT_WINDOW_MS": "60 * 1000", "WEEK_MS": "7 * 24 * 60 * 60 * 1000", "DEFAULT_TIMEOUT": "15_000",
                          "MAX_REQUESTS_PER_WINDOW": "100", "CARRIER_ALL_LABEL": '"Todas"'})

    def test_rule_comments_come_from_comments_not_from_code(self):
        info = self.analyze("src/hooks/useGeo.ts", """
// Regra: o limite de tentativas é 3 por usuário
const q = supabase.from("geo").select("*").order("created_at", { ascending: false }).limit(50);
const re = /[#$%]/.test(password) && required === true; // senha deve ter caractere especial
/**
 * Somente administradores podem alterar o prazo de coleta.
 */
""")
        self.assertEqual(info["rule_comments"], ["Regra: o limite de tentativas é 3 por usuário", "senha deve ter caractere especial",
                                                 "Somente administradores podem alterar o prazo de coleta."])

    def test_storage_bucket_in_multiline_chain_is_not_a_table(self):
        info = self.analyze("src/hooks/useUpload.ts", """
await supabase
  .storage
  .from("avatars")
  .upload(path, file);
await supabase.from("profiles").select("id");
""")
        self.assertEqual([t["table"] for t in info["tables"]], ["profiles"])
        self.assertEqual(info["storage"], ["avatars"])

    def test_fixtures_in_scripts_and_tests_are_not_app_inconsistencies_and_app_errors_come_first(self):
        self.write("supabase/migrations/20260101000000_t.sql", "CREATE TABLE public.coletas (id uuid);")
        self.write("scripts/ai-context/gerar.unit.mjs", """
await supabase.from("fixture_table").select("id");
await supabase.rpc("fixture_rpc");
await supabase.functions.invoke("fixture-edge");
await supabase.from(tabela).select("id");
throw new Error("erro de script de manutenção");
""")
        self.write("src/hooks/useColetas.test.ts", 'await supabase.from("so_teste").select("id"); await supabase.rpc("rpc_de_teste");')
        self.write("src/hooks/useColetas.ts", """
await supabase.from("coletas").select("id");
await supabase.from("tabela_fantasma").select("id");
await supabase.rpc("rpc_fantasma");
await supabase.functions.invoke("edge-fantasma");
throw new Error("Coleta já finalizada não pode ser alterada");
""")
        self.assertEqual(self.cli().returncode, 0)
        context = self.context()
        found = {(i["kind"], i["msg"].split("`")[1]) for i in context["audit"]["issues"] if i["kind"] in ("tabela", "rpc", "edge", "dinâmico")}
        self.assertEqual(found, {("tabela", "tabela_fantasma"), ("rpc", "rpc_fantasma"), ("edge", "edge-fantasma")})
        self.assertEqual([e["file"] for e in context["rules"]["error_messages"]], ["src/hooks/useColetas.ts", "scripts/ai-context/gerar.unit.mjs"])

    def test_uf_columns_and_partition_children_are_not_status_columns(self):
        self.write("supabase/migrations/20260101000000_t.sql", """
CREATE TABLE public.clientes (id uuid, cidade text, estado text, cep text);
CREATE TABLE public.rotas (id uuid, estado_destino text NOT NULL);
CREATE TABLE public.pedidos (id uuid, estado text, status text);
CREATE TABLE public.rastreamento (id uuid, order_status text) PARTITION BY RANGE (id);
CREATE TABLE public.rastreamento_y2026m01 (id uuid, order_status text);
CREATE TABLE public.relatorio_y2026m01 (id uuid, status text);
""")
        self.assertEqual(self.cli().returncode, 0)
        columns = {(c["table"], c["column"]) for c in self.context()["rules"]["state_machines"]["columns"]}
        self.assertEqual(columns, {("pedidos", "estado"), ("pedidos", "status"), ("rastreamento", "order_status"), ("relatorio_y2026m01", "status")})

    def test_manual_rules_enter_section_a_first_and_are_never_overwritten(self):
        manual = "docs/contexto/regras/manual/regras.md"
        text = "# Regras do dono\n\nColeta `finalizada` nunca volta para `em_transito`.\n"
        self.write(manual, text)
        self.write("docs/contexto/regras/manual/TEMPLATE-regras-de-negocio.md", "modelo que não é regra\n")
        self.write("supabase/migrations/20260101000000_t.sql", "CREATE TABLE public.coletas (id uuid);")
        self.assertEqual(self.cli().returncode, 0)
        rendered = (self.root / "docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md").read_text(encoding="utf-8")
        self.assertLess(rendered.index("## A. Regras escritas por humanos"), rendered.index("nunca volta para"))
        self.assertLess(rendered.index("nunca volta para"), rendered.index("## B. "))
        self.assertNotIn("modelo que não é regra", rendered)
        self.assertEqual((self.root / manual).read_text(encoding="utf-8"), text)
        self.assertEqual((self.root / "docs/contexto/regras/manual/TEMPLATE-regras-de-negocio.md").read_text(encoding="utf-8"), "modelo que não é regra\n")
        self.assertEqual([m["file"] for m in self.context()["manual"]], ["regras.md"])

    def test_rules_profile_points_to_the_snapshot_instead_of_a_file_it_does_not_write(self):
        self.write("supabase/migrations/20260101000000_t.sql", "CREATE TABLE public.coletas (id uuid);")
        self.assertEqual(self.cli("--schema-snapshot", "docs/contexto/supabase").returncode, 0)
        out = self.root / "docs/contexto/regras"
        self.assertFalse((out / "06-BANCO-DE-DADOS.md").exists())
        for name in ("07-REGRAS-DE-NEGOCIO.md", "10-ACESSO-E-SEGURANCA.md"):
            rendered = (out / name).read_text(encoding="utf-8")
            self.assertNotIn("`06`", rendered, name)
            self.assertIn("`docs/contexto/supabase/` (snapshot do banco real)", rendered, name)


class CliContractTests(FixtureRepo, unittest.TestCase):
    """Contrato de linha de comando usado pelo job `regras` de .github/workflows/contexto-ia.yml."""

    def seed(self):
        self.write("supabase/migrations/20260101000000_t.sql", "CREATE TABLE public.coletas (id uuid, status text);")
        self.write("src/a.ts", "export const MAX_ITENS = 10;\n")

    def test_missing_repo_fails_closed_without_creating_anything(self):
        missing = self.root / "nao-existe"
        result = self.cli(repo=missing)
        self.assertEqual(result.returncode, 2)
        self.assertIn("não é um diretório", result.stderr)
        self.assertFalse(missing.exists())

    def test_out_that_is_a_file_is_a_usage_error(self):
        self.seed()
        self.write("docs/contexto/regras", "sou um arquivo")
        result = self.cli()
        self.assertEqual(result.returncode, 2)
        self.assertIn("não é um diretório", result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_check_reports_outdated_until_generated_and_writes_nothing(self):
        self.seed()
        self.assertEqual(self.cli("--check").returncode, 1)
        self.assertFalse((self.root / "docs/contexto/regras").exists())
        self.assertEqual(self.cli().returncode, 0)
        self.assertEqual(self.cli("--check").returncode, 0)
        self.write("src/a.ts", "export const MAX_ITENS = 11;\n")
        self.assertEqual(self.cli("--check").returncode, 1)

    def test_deleted_output_is_outdated_and_gets_regenerated(self):
        self.seed()
        self.assertEqual(self.cli().returncode, 0)
        target = self.root / "docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md"
        target.unlink()
        check = self.cli("--check")
        self.assertEqual(check.returncode, 1)
        self.assertIn("07-REGRAS-DE-NEGOCIO.md", check.stderr)
        self.assertFalse(target.exists())
        self.assertEqual(self.cli().returncode, 0)
        self.assertTrue(target.exists())

    def test_output_is_deterministic_and_independent_of_cwd_and_hash_seed(self):
        self.seed()
        self.write("src/b.tsx", 'if (status === "em_transito" || status === "finalizada") {}\nconst t = supabase.from("coletas").select("id, status");\n')
        out = self.root / "docs/contexto/regras"
        names = ("07-REGRAS-DE-NEGOCIO.md", "10-ACESSO-E-SEGURANCA.md", "11-GLOSSARIO-E-LACUNAS.md", "context.json", "manifest.json")
        stamp = __import__("re").compile(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC")
        snapshots = []
        for seed, cwd, out_arg in (("1", self.root, "docs/contexto/regras"), ("2", Path("/"), "docs/contexto/regras"), ("3", self.root.parent, str(out))):
            result = subprocess.run([sys.executable, str(SCRIPT), "--repo", str(self.root), "--out", out_arg, "--profile", "regras", "--no-pointer", "--force"],
                                    capture_output=True, text=True, timeout=60, cwd=cwd, env={"PYTHONHASHSEED": seed, "PATH": __import__("os").environ.get("PATH", "")})
            self.assertEqual(result.returncode, 0, result.stderr)
            snapshots.append({n: stamp.sub("", (out / n).read_text(encoding="utf-8")) for n in names})
        self.assertEqual(snapshots[0], snapshots[1])
        self.assertEqual(snapshots[0], snapshots[2])
        manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["entrada"], "07-REGRAS-DE-NEGOCIO.md")
        self.assertEqual(manifest["arquivos"], ["07-REGRAS-DE-NEGOCIO.md", "10-ACESSO-E-SEGURANCA.md", "11-GLOSSARIO-E-LACUNAS.md", "context.json"])
        self.assertRegex(manifest["gerado_em"], r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$")

    def test_hostile_input_files_do_not_break_the_run(self):
        self.seed()
        (self.root / "supabase/migrations/20260102000000_vazia.sql").write_bytes(b"")
        (self.root / "supabase/migrations/20260103000000_bom_crlf.sql").write_bytes(
            "﻿CREATE TABLE public.com_bom (id uuid,\r\n  nome text);\r\n".encode("utf-8"))
        (self.root / "supabase/migrations/20260104000000_latin1.sql").write_bytes("CREATE TABLE public.acentuação (id uuid); -- comentário\n".encode("latin-1"))
        (self.root / "supabase/migrations/20260105000000_aberta.sql").write_bytes(b"CREATE FUNCTION f() RETURNS void AS $$ BEGIN PERFORM 'sem fim")
        (self.root / "src").mkdir(exist_ok=True)
        (self.root / "src/binario.ts").write_bytes(b"\x00\xff\xfe export const X = 1;\n")
        self.write("src/com espaço e 'aspas'.ts", "export const LIMITE_MAXIMO = 3;\n")
        result = self.cli()
        self.assertEqual(result.returncode, 0, result.stderr)
        tables = self.context()["schema"]["tables"]
        self.assertIn("com_bom", tables)
        self.assertEqual([c["name"] for c in tables["com_bom"]["columns"]], ["id", "nome"])
        self.assertIn("coletas", tables)

    def test_default_out_is_the_directory_the_workflow_publishes(self):
        self.seed()
        result = subprocess.run([sys.executable, str(SCRIPT), "--repo", str(self.root), "--profile", "regras", "--no-pointer"],
                                capture_output=True, text=True, timeout=60)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.root / "docs/contexto/regras/manifest.json").is_file())
        self.assertFalse((self.root / "docs/ai-context").exists())
        self.assertFalse((self.root / "AGENTS.md").exists())

    def test_usage_text_names_paths_that_exist_in_this_repository(self):
        repo = SCRIPT.resolve().parents[2]
        self.assertIn("scripts/regras_negocio/generate.py", generator.__doc__)
        self.assertNotIn("scripts/ai_context", generator.__doc__)
        self.assertTrue((repo / "scripts/regras_negocio/generate.py").is_file())


if __name__ == "__main__":
    unittest.main()
