#!/usr/bin/env python3
"""Regressões offline: uma coleta parcial não pode destruir o SQL já publicado."""

from __future__ import annotations

import contextlib
import copy
import datetime as dt
import importlib.util
import io
import json
import os
import pathlib
import re
import shutil
import sys
import tempfile
import types
import unittest
from unittest import mock


class OfflineConnection:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, command):
        if not command.startswith("SET "):
            raise AssertionError("O teste offline não permite consultas ao banco")

    def rollback(self):
        pass


def function(name="demo", value=1):
    return {
        "schema": "public", "name": name, "args": "", "returns": "integer",
        "language": "sql", "kind": "function", "is_trigger_fn": False,
        "security_definer": False, "volatility": "v", "config": [],
        "execute_api_roles": ["authenticated"], "execute_public": False,
        "definition": f"CREATE FUNCTION public.{name}() RETURNS integer LANGUAGE sql AS $$ SELECT {value} $$;",
    }


def migration(version="20260101000000", name="demo", statements=None):
    return {
        "version": version, "name": name,
        "statements": statements if statements is not None else [
            "CREATE TABLE public.demo_table (id integer);",
            "CREATE INDEX demo_id ON public.demo_table (id);",
        ],
    }


def structural_records(records):
    return [{k: v for k, v in row.items() if k != "callers"} for row in records] if records is not None else None


class SnapshotFixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="snapshot-sql-test-")
        self.addCleanup(self.temp.cleanup)
        self.out = pathlib.Path(self.temp.name) / "output"

        # Nem driver instalado nem credenciais são necessários. Qualquer tentativa real falha.
        driver = types.ModuleType("psycopg")
        driver.connect = mock.Mock(side_effect=AssertionError("Conexão real proibida no teste"))
        rows = types.ModuleType("psycopg.rows")
        rows.dict_row = object()
        spec = importlib.util.spec_from_file_location("snapshot_tested", pathlib.Path(__file__).with_name("snapshot.py"))
        self.snapshot = importlib.util.module_from_spec(spec)
        env = {
            "SUPABASE_DB_URL": "offline-fixture", "SNAPSHOT_DIR": str(self.out),
            "PGDUMP": "false", "GEN_TYPES": "false", "REPO_ROOT": "",
        }
        with mock.patch.dict(sys.modules, {"psycopg": driver, "psycopg.rows": rows}):
            with mock.patch.dict(os.environ, env, clear=True):
                spec.loader.exec_module(self.snapshot)

        self.source_files = [("src/client.ts", "supabase.rpc('demo')")]

    def collect(self, *, failures=(), functions=None, migrations=None):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        snapshot.CARRIED.clear()
        snapshot._SLUG_SEEN.clear()
        records = {
            "server": {"server_version": "offline-fixture"},
            "functions": [function()] if functions is None else functions,
            "migrations": [migration()] if migrations is None else migrations,
        }

        def section(name):
            @snapshot.section(name)
            def collect_section(_conn):
                if name in failures:
                    raise PermissionError(f"Falha simulada na seção {name}")
                return copy.deepcopy(records[name])
            return collect_section

        snapshot.DB_SECTIONS = [section(name) for name in records]
        with mock.patch.object(snapshot.psycopg, "connect", return_value=OfflineConnection()):
            with mock.patch.object(snapshot, "scan_code_files", return_value=self.source_files):
                with mock.patch.object(snapshot.urllib.request, "urlopen", side_effect=AssertionError("HTTP proibido no teste")):
                    with mock.patch.object(snapshot.subprocess, "run", side_effect=AssertionError("Comando externo proibido no teste")):
                        with contextlib.redirect_stdout(io.StringIO()):
                            return snapshot.main()

    def metadata(self):
        return json.loads((self.out / "snapshot.json").read_text(encoding="utf-8"))

    def function_sql(self, name="demo"):
        return self.out / "functions" / "public" / f"{name}__{self.snapshot.sha('')}.sql"

    def migration_sql(self, version="20260101000000", name="demo"):
        return self.out / "migrations" / f"{version}_{name}.sql"

    def error_sections(self):
        return {error["section"] for error in self.metadata()["errors"]}


class SnapshotSQLRecoveryTests(SnapshotFixture):
    def test_output_marker_is_created_preserved_and_recovers_legacy_snapshot(self):
        self.out.mkdir()  # diretório existente e vazio também é um alvo novo válido.
        self.assertEqual(self.collect(), 0)
        marker = self.out / self.snapshot.OUTPUT_MARKER
        self.assertEqual(marker.read_text(encoding="utf-8"), self.snapshot.OUTPUT_MARKER_CONTENT)
        marker.unlink()  # snapshot.json v2 identifica uma saída legítima anterior ao marcador.
        self.assertEqual(self.collect(), 0)
        self.assertEqual(marker.read_text(encoding="utf-8"), self.snapshot.OUTPUT_MARKER_CONTENT)

    def test_unowned_nonempty_output_is_rejected_before_collection(self):
        unowned = pathlib.Path(self.temp.name) / "unowned"
        unowned.mkdir()
        sentinel = unowned / "user.txt"
        sentinel.write_text("não apagar", encoding="utf-8")
        self.snapshot.OUT = unowned
        with mock.patch.object(self.snapshot, "introspect_db", side_effect=AssertionError("coleta proibida")):
            with contextlib.redirect_stderr(io.StringIO()) as stderr:
                self.assertEqual(self.snapshot.main(), 2)
        self.assertIn("sem marcador/snapshot válido", stderr.getvalue())
        self.assertEqual(sentinel.read_text(encoding="utf-8"), "não apagar")
        self.assertFalse((unowned / self.snapshot.OUTPUT_MARKER).exists())

    def test_broad_output_paths_are_rejected_before_collection(self):
        cwd = pathlib.Path.cwd().resolve()
        unsafe = {pathlib.Path(cwd.anchor).resolve(), pathlib.Path.home().resolve(), cwd, cwd.parent}
        for path in unsafe:
            with self.subTest(path=path):
                self.snapshot.OUT = path
                with mock.patch.object(self.snapshot, "introspect_db", side_effect=AssertionError("coleta proibida")):
                    with contextlib.redirect_stderr(io.StringIO()) as stderr:
                        self.assertEqual(self.snapshot.main(), 2)
                self.assertIn("SNAPSHOT_DIR inseguro", stderr.getvalue())

    def test_successful_collection_writes_full_sql_with_compact_metadata(self):
        self.assertEqual(self.collect(), 0)
        self.assertEqual(self.function_sql().read_text().strip(), function()["definition"])
        self.assertEqual(self.migration_sql().read_text().strip(), "\n\n".join(migration()["statements"]))
        metadata = self.metadata()
        self.assertIsNone(metadata["db"]["functions"][0]["definition"])
        self.assertEqual(metadata["db"]["migrations"][0]["statements"], 2)
        self.assertEqual(metadata["errors"], [])

    def test_repeated_failures_preserve_sql_counts_hashes_and_db_callers(self):
        self.assertEqual(self.collect(), 0)
        original_function = self.function_sql().read_bytes()
        original_migration = self.migration_sql().read_bytes()
        original_metadata = self.metadata()["db"]
        self.source_files = []

        for _ in range(2):
            self.assertEqual(self.collect(failures={"functions", "migrations"}), 0)
            self.assertEqual(self.function_sql().read_bytes(), original_function)
            self.assertEqual(self.migration_sql().read_bytes(), original_migration)
            metadata = self.metadata()
            self.assertEqual(structural_records(metadata["db"]["functions"]), structural_records(original_metadata["functions"]))
            self.assertEqual(metadata["db"]["functions"][0]["callers"]["db"], original_metadata["functions"][0]["callers"]["db"])
            self.assertEqual(metadata["db"]["functions"][0]["callers"]["code"], [])
            self.assertEqual(metadata["db"]["migrations"], original_metadata["migrations"])
            self.assertEqual(set(metadata["carried"]), {"functions", "migrations"})
            self.assertEqual(self.error_sections(), {"functions", "migrations"})
            for name in ("functions", "migrations"):
                self.assertIn("versão anterior", (self.out / f"{name}.md").read_text())
            for name in ("functions.md", "README.md"):
                document = (self.out / name).read_text()
                self.assertIn("| código do repo | coleta atual |", document)
                self.assertIn("| outras funções | coleta anterior; corpos SQL não atualizados |", document)

    def test_failed_functions_allow_healthy_migrations_to_update(self):
        self.collect()
        old_function = self.function_sql().read_bytes()
        statements = ["ALTER TABLE public.demo_table ADD COLUMN name text;"]
        self.assertEqual(self.collect(failures={"functions"}, migrations=[migration(statements=statements)]), 0)
        self.assertEqual(self.function_sql().read_bytes(), old_function)
        self.assertEqual(self.migration_sql().read_text().strip(), statements[0])
        self.assertEqual(self.metadata()["carried"], ["functions"])

    def test_failed_migrations_allow_healthy_functions_to_update(self):
        self.collect()
        old_migration = self.migration_sql().read_bytes()
        changed = function(value=2)
        self.assertEqual(self.collect(failures={"migrations"}, functions=[changed]), 0)
        self.assertEqual(self.function_sql().read_text().strip(), changed["definition"])
        self.assertEqual(self.migration_sql().read_bytes(), old_migration)
        self.assertEqual(self.metadata()["carried"], ["migrations"])

    def test_next_healthy_collection_replaces_sql_and_prunes_removed_objects(self):
        obsolete_migration = migration("20260102000000", "obsolete")
        self.collect(functions=[function(), function("obsolete")], migrations=[migration(), obsolete_migration])
        self.collect(failures={"functions", "migrations"})
        self.assertTrue(self.function_sql("obsolete").is_file())
        self.assertTrue(self.migration_sql("20260102000000", "obsolete").is_file())

        changed = function(value=3)
        statements = ["ALTER TABLE public.demo_table ADD COLUMN enabled boolean;"]
        self.assertEqual(self.collect(functions=[changed], migrations=[migration(statements=statements)]), 0)
        self.assertFalse(self.function_sql("obsolete").exists())
        self.assertFalse(self.migration_sql("20260102000000", "obsolete").exists())
        self.assertEqual(self.function_sql().read_text().strip(), changed["definition"])
        self.assertEqual(self.migration_sql().read_text().strip(), statements[0])
        self.assertEqual(self.metadata()["carried"], [])
        self.assertEqual(self.metadata()["errors"], [])
        self.assertNotIn("versão anterior", (self.out / "functions.md").read_text())

    def test_missing_previous_sql_is_reported_without_fake_content_or_links(self):
        self.collect()
        original_migrations = self.metadata()["db"]["migrations"]
        shutil.rmtree(self.out / "functions")
        shutil.rmtree(self.out / "migrations")

        self.assertEqual(self.collect(failures={"functions", "migrations"}), 0)
        self.assertFalse(self.function_sql().exists())
        self.assertFalse(self.migration_sql().exists())
        self.assertEqual(self.metadata()["db"]["migrations"], original_migrations)
        self.assertTrue({"functions.sql", "migrations.sql"}.issubset(self.error_sections()))
        for name in ("functions", "migrations"):
            document = (self.out / f"{name}.md").read_text()
            self.assertIn("SQL indisponível", document)
            self.assertNotIn(f"]({name}/", document)

    def test_failed_first_collection_does_not_claim_empty_sections(self):
        self.assertEqual(self.collect(failures={"functions", "migrations"}), 0)
        self.assertFalse(self.function_sql().exists())
        self.assertFalse(self.migration_sql().exists())
        self.assertEqual(self.metadata()["carried"], [])
        self.assertEqual(self.error_sections(), {"functions", "migrations"})
        for name in ("functions", "migrations"):
            document = (self.out / f"{name}.md").read_text()
            self.assertIn("Coleta indisponível", document)
            self.assertNotIn("_nenhum_", document)
            self.assertIn(f"| {name} | n/d |", (self.out / "README.md").read_text())

    def test_successful_empty_sections_are_not_reported_as_collection_failures(self):
        self.assertEqual(self.collect(functions=[], migrations=[]), 0)
        self.assertEqual(self.metadata()["errors"], [])
        self.assertEqual(self.metadata()["carried"], [])
        for name in ("functions", "migrations"):
            self.assertIn("_nenhum_", (self.out / f"{name}.md").read_text())
            self.assertIn(f"| {name} | 0 |", (self.out / "README.md").read_text())

    def test_aggregate_and_window_without_sql_remain_healthy_catalog_entries(self):
        entries = [{**function(f"demo_{kind}"), "kind": kind, "definition": None} for kind in ("aggregate", "window")]
        self.assertEqual(self.collect(functions=entries), 0)
        self.assertEqual(self.error_sections(), set())
        self.assertEqual([f["kind"] for f in self.metadata()["db"]["functions"]], ["aggregate", "window"])
        for entry in entries:
            self.assertFalse(self.function_sql(entry["name"]).exists())
        document = (self.out / "functions.md").read_text()
        self.assertIn("SQL não coletado para este tipo", document)
        self.assertNotIn("](functions/", document)
        self.assertEqual(self.collect(failures={"functions"}), 0)
        self.assertEqual(self.error_sections(), {"functions"})
        self.assertEqual(self.metadata()["carried"], ["functions"])
        self.assertEqual(self.collect(functions=entries), 0)
        self.assertEqual(self.error_sections(), set())


class SnapshotFailureMatrixTests(SnapshotFixture):
    """24 sequências: seção × histórico/SQL disponível × repetição × recuperação."""

    def exercise_failure_recovery(self, section, history, attempts, recovery):
        if history != "none":
            self.collect(functions=[function(), function("obsolete")],
                         migrations=[migration(), migration("20260102000000", "obsolete")])
            previous = copy.deepcopy(self.metadata()["db"][section])
            sql_before = {p.relative_to(self.out): p.read_bytes() for p in (self.out / section).rglob("*.sql")}
            if history == "metadata_only":
                shutil.rmtree(self.out / section)
        else:
            previous, sql_before = None, {}

        self.source_files = []  # não pode apagar callers da seção que veio do histórico
        for attempt in range(attempts):
            changed_function = function(value=attempt + 20)
            changed_statement = f"ALTER TABLE public.demo_table ADD COLUMN field_{attempt} integer;"
            self.assertEqual(self.collect(failures={section}, functions=[changed_function],
                                         migrations=[migration(statements=[changed_statement])]), 0)
            metadata = self.metadata()
            self.assertEqual(structural_records(metadata["db"][section]), structural_records(previous))
            if section == "functions" and previous:
                self.assertEqual(metadata["db"][section][0]["callers"]["db"], previous[0]["callers"]["db"])
                self.assertEqual(metadata["db"][section][0]["callers"]["code"], [])
            self.assertEqual(metadata["carried"], [section] if history != "none" else [])
            self.assertIn(section, self.error_sections())
            self.assertEqual(f"{section}.sql" in self.error_sections(), history == "metadata_only")
            document = (self.out / f"{section}.md").read_text()
            if history == "complete":
                for relative, contents in sql_before.items():
                    self.assertEqual((self.out / relative).read_bytes(), contents)
                self.assertIn("versão anterior", document)
                self.assertNotIn("SQL indisponível", document)
            else:
                self.assertFalse((self.out / section).exists())
                self.assertNotIn(f"]({section}/", document)
                self.assertIn("SQL indisponível" if history == "metadata_only" else "Coleta indisponível", document)
            if history == "none":
                self.assertIn(f"| {section} | n/d |", (self.out / "README.md").read_text())
            else:
                self.assertIn(f"| {section} | 2 |", (self.out / "README.md").read_text())
                # Falha da coleta não pode transformar registros conhecidos em remoções.
                changes = self.snapshot.diff_fingerprints(
                    self.snapshot.fingerprints({"db": {section: structural_records(previous)}}),
                    self.snapshot.fingerprints({"db": {section: structural_records(metadata["db"][section])}}))
                self.assertEqual(changes, [])
            if section == "functions":
                self.assertEqual(self.migration_sql().read_text().strip(), changed_statement)
            else:
                self.assertEqual(self.function_sql().read_text().strip(), changed_function["definition"])

        self.source_files = [("src/recovered.ts", "supabase.rpc('demo')")]
        final_function = function(value=99)
        final_statement = "ALTER TABLE public.demo_table ADD COLUMN recovered boolean;"
        functions = [] if section == "functions" and recovery == "empty" else [final_function]
        migrations = [] if section == "migrations" and recovery == "empty" else [migration(statements=[final_statement])]
        self.assertEqual(self.collect(functions=functions, migrations=migrations), 0)
        metadata = self.metadata()
        self.assertEqual(metadata["errors"], [])
        self.assertEqual(metadata["carried"], [])
        self.assertFalse(self.function_sql("obsolete").exists())
        self.assertFalse(self.migration_sql("20260102000000", "obsolete").exists())
        document = (self.out / f"{section}.md").read_text()
        self.assertNotIn("versão anterior", document)
        self.assertNotIn("SQL indisponível", document)
        if recovery == "empty":
            self.assertEqual(metadata["db"][section], [])
            self.assertFalse((self.out / section).exists())
            self.assertIn("_nenhum_", document)
        elif section == "functions":
            self.assertEqual(self.function_sql().read_text().strip(), final_function["definition"])
            self.assertEqual(metadata["db"][section][0]["callers"]["code"], [{"file": "src/recovered.ts", "hits": 1}])
        else:
            self.assertEqual(self.migration_sql().read_text().strip(), final_statement)
            self.assertEqual(metadata["db"][section][0]["statements"], 1)


def recovery_case(section, history, attempts, recovery):
    def run(self):
        self.exercise_failure_recovery(section, history, attempts, recovery)
    return run


for _section in ("functions", "migrations"):
    for _history in ("none", "complete", "metadata_only"):
        for _attempts in (1, 3):
            for _recovery in ("changed", "empty"):
                setattr(SnapshotFailureMatrixTests,
                        f"test_{_section}_{_history}_{_attempts}_failures_recover_{_recovery}",
                        recovery_case(_section, _history, _attempts, _recovery))


class SnapshotFunctionCallerTests(SnapshotFixture):
    def callers(self, files, *, scan_dirs=None, kind="function"):
        root = pathlib.Path(self.temp.name) / "repo"
        for relative, text in files.items():
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
        self.snapshot.REPO_ROOT = root
        self.snapshot.CODE_SCAN_DIRS = scan_dirs or ["."]
        db = {"functions": [{**function(), "kind": kind}]}
        with contextlib.redirect_stdout(io.StringIO()):
            self.snapshot.build_function_callers(db)
        return db["functions"][0]["callers"]["code"]

    def test_function_declaration_is_not_a_call(self):
        declarations = {
            "supabase/migrations/001.sql": function()["definition"],
            "supabase/migrations/002.sql": "CREATE OR REPLACE\nFUNCTION public.demo() RETURNS integer AS $$ SELECT 2 $$ LANGUAGE sql;",
            "supabase/migrations/003.sql": "CREATE PROCEDURE public.demo() LANGUAGE sql AS $$ SELECT 1 $$;",
        }
        self.assertEqual(self.callers(declarations), [])

    def test_aggregate_declarations_and_metadata_are_not_calls(self):
        statements = [
            "CREATE AGGREGATE public.demo(integer) (SFUNC = int4pl, STYPE = integer);",
            "DROP AGGREGATE IF EXISTS public.demo(integer);",
            "ALTER AGGREGATE public.demo(integer) OWNER TO postgres;",
            "COMMENT ON AGGREGATE public.demo(integer) IS 'description';",
        ]
        self.assertEqual(self.callers({f"supabase/migrations/{i}.sql": text for i, text in enumerate(statements)}, kind="aggregate"), [])

    def test_ddl_function_signatures_are_not_calls(self):
        statements = [
            "DROP FUNCTION IF EXISTS public.demo();",
            "ALTER FUNCTION public.demo() OWNER TO postgres;",
            "COMMENT ON FUNCTION public.demo() IS 'description';",
            "GRANT EXECUTE ON FUNCTION public.demo() TO authenticated;",
            "REVOKE EXECUTE ON FUNCTION public.demo() FROM anon;",
        ]
        self.assertEqual(self.callers({f"supabase/migrations/{i}.sql": text for i, text in enumerate(statements)}), [])

    def test_real_calls_inside_function_bodies_and_migrations_remain(self):
        text = "CREATE FUNCTION public.demo() RETURNS integer AS $$ SELECT public.demo(); $$ LANGUAGE sql;\nSELECT public.demo();"
        self.assertEqual(self.callers({"supabase/migrations/active.sql": text}),
                         [{"file": "supabase/migrations/active.sql", "hits": 2}])

    def test_ddl_like_text_does_not_hide_a_real_call_later_in_the_statement(self):
        text = "SELECT audit_note('ALTER FUNCTION public.demo()'), public.demo();"
        self.assertEqual(self.callers({"supabase/migrations/active.sql": text}),
                         [{"file": "supabase/migrations/active.sql", "hits": 1}])

    def test_multiple_signatures_are_ignored_but_default_argument_calls_remain(self):
        text = ("GRANT EXECUTE ON FUNCTION public.demo(), public.demo(integer) TO authenticated;\n"
                "CREATE FUNCTION public.other(value integer DEFAULT public.demo()) RETURNS integer AS $$ SELECT 1 $$ LANGUAGE sql;")
        self.assertEqual(self.callers({"supabase/migrations/active.sql": text}),
                         [{"file": "supabase/migrations/active.sql", "hits": 1}])

    def test_overlapping_scan_paths_do_not_duplicate_real_calls(self):
        self.assertEqual(self.callers({"src/hooks/useDemo.ts": "supabase.rpc('demo')"}, scan_dirs=["src", "src/hooks"]),
                         [{"file": "src/hooks/useDemo.ts", "hits": 1}])

    def test_historical_and_test_files_do_not_prove_current_usage(self):
        excluded = [
            "supabase/migrations/_foreign/other/old.sql", "supabase/migrations/_superseded/old.sql",
            "src/__tests__/client.ts", "src/tests/client.ts", "src/test/client.ts", "src/__fixtures__/client.ts",
            "src/fixtures/client.ts", "src/__mocks__/client.ts", "src/client.test.ts", "src/client.spec.ts",
            "scripts/ci/client.unit.mjs", "scripts/test_client.py", "server/client_test.go", "src/client.stories.tsx",
        ]
        files = {name: "supabase.rpc('demo'); SELECT public.demo();" for name in excluded}
        files["src/client.ts"] = "supabase.rpc('demo')"
        self.assertEqual(self.callers(files), [{"file": "src/client.ts", "hits": 1}])

    def test_similar_names_operational_scripts_and_custom_scan_paths_remain(self):
        names = ["runtime/testimonials.ts", "runtime/customer_foreign/client.ts", "runtime/_superseded_backup/client.ts",
                 "runtime/fixtures-page.ts", "scripts/operations/sync.ts", "supabase/migrations/_foreign.sql"]
        files = {name: "supabase.rpc('demo')" for name in names}
        # SQL reconhece a chamada SQL, não a sintaxe de RPC do cliente.
        files[names[-1]] = "SELECT public.demo();"
        files["src/not_selected.ts"] = "supabase.rpc('demo')"
        self.assertEqual(self.callers(files, scan_dirs=["runtime", "scripts/operations", "supabase/migrations"]),
                         [{"file": name, "hits": 1} for name in sorted(names)])


class SnapshotCallerFreshnessTests(SnapshotFixture):
    @staticmethod
    def database(stage):
        consumer = function(f"{stage}_consumer")
        consumer["definition"] = f"CREATE FUNCTION public.{stage}_consumer() RETURNS integer AS $$ SELECT public.demo() $$ LANGUAGE sql;"
        return {
            "functions": [function(), consumer],
            "cron": {"jobs": [{"jobid": stage, "jobname": stage, "command": "SELECT public.demo();"}]},
            "triggers": [{"schema": "public", "table": "orders", "name": f"{stage}_trigger", "function": "public.demo"}],
            "views": [{"schema": "public", "name": f"{stage}_view", "definition": "SELECT public.demo();"}],
        }

    def build(self, database, files):
        with mock.patch.object(self.snapshot, "scan_code_files", return_value=files):
            with contextlib.redirect_stdout(io.StringIO()):
                return self.snapshot.build_function_callers(database)

    def previous_database(self):
        previous = self.database("old")
        self.build(previous, [("src/old.ts", "supabase.rpc('demo')")])
        for entry in previous["functions"]:
            entry["definition_sha"] = self.snapshot.sha(entry["definition"])
            entry["definition"] = None
        return previous

    def exercise_sources(self, failed_sources):
        previous = self.previous_database()
        previous_copy = copy.deepcopy(previous)
        current = self.database("new")
        # introspect_db reutiliza a lista anterior; o mapa não pode alterar esse histórico em memória.
        current["functions"] = previous["functions"]
        self.snapshot.CARRIED[:] = ["functions", *failed_sources]
        for source in failed_sources:
            current[source] = previous[source]
        states = self.build(current, [("src/new.ts", "supabase.rpc('demo')")])
        callers = current["functions"][0]["callers"]
        self.assertEqual(callers["code"], [{"file": "src/new.ts", "hits": 1}])
        self.assertEqual(callers["code_total_files"], 1)
        self.assertEqual(callers["db"], ["public.old_consumer"])
        expected = {"cron": ["new:new"], "triggers": ["public.orders.new_trigger"], "views": ["public.new_view"]}
        for source in expected:
            if source in failed_sources:
                self.assertEqual(callers[source], previous_copy["functions"][0]["callers"][source])
                self.assertIn("anterior", states[source])
            else:
                self.assertEqual(callers[source], expected[source])
                self.assertIn("coleta atual", states[source])
        self.assertIn("anterior", states["db"])
        self.assertEqual(previous, previous_copy, "recalcular callers não pode reescrever a base do changelog")
        self.assertEqual([{k: v for k, v in f.items() if k != "callers"} for f in current["functions"]],
                         [{k: v for k, v in f.items() if k != "callers"} for f in previous_copy["functions"]])

        self.snapshot.CARRIED.clear()
        recovered = self.database("recovered")
        states = self.build(recovered, [("src/recovered.ts", "supabase.rpc('demo')")])
        callers = recovered["functions"][0]["callers"]
        self.assertEqual(callers["db"], ["public.recovered_consumer"])
        self.assertEqual(callers["cron"], ["recovered:recovered"])
        self.assertEqual(callers["triggers"], ["public.orders.recovered_trigger"])
        self.assertEqual(callers["views"], ["public.recovered_view"])
        self.assertTrue(all("coleta atual" in state for state in states.values()))

    def test_unavailable_sources_preserve_known_references_without_claiming_freshness(self):
        previous = self.previous_database()
        expected = copy.deepcopy(previous["functions"][0]["callers"])
        current = {"functions": previous["functions"], "cron": None, "triggers": None, "views": None}
        self.snapshot.CARRIED[:] = ["functions"]
        states = self.build(current, None)
        self.assertEqual(current["functions"][0]["callers"], expected)
        for source in ("code", "cron", "triggers", "views"):
            self.assertIn("indisponível", states[source])

    def test_successful_empty_sources_remove_old_references(self):
        previous = self.previous_database()
        current = {"functions": previous["functions"], "cron": {"jobs": []}, "triggers": [], "views": []}
        self.snapshot.CARRIED[:] = ["functions"]
        states = self.build(current, [])
        callers = current["functions"][0]["callers"]
        for source in ("code", "cron", "triggers", "views"):
            self.assertEqual(callers[source], [])
            self.assertIn("coleta atual", states[source])
        self.assertEqual(callers["code_total_files"], 0)
        self.assertEqual(callers["db"], ["public.old_consumer"])

    def test_unreadable_code_preserves_previous_code_references_and_reports_failure(self):
        previous = self.previous_database()
        expected = copy.deepcopy(previous["functions"][0]["callers"]["code"])
        root = pathlib.Path(self.temp.name) / "repo"
        (root / "src").mkdir(parents=True)
        (root / "src/client.ts").write_text("supabase.rpc('demo')", encoding="utf-8")
        self.snapshot.REPO_ROOT = root
        self.snapshot.CODE_SCAN_DIRS = ["src"]
        self.snapshot.CARRIED[:] = ["functions"]
        with mock.patch.object(pathlib.Path, "read_text", side_effect=PermissionError("fixture ilegível")):
            with contextlib.redirect_stdout(io.StringIO()):
                states = self.snapshot.build_function_callers(previous)
        self.assertEqual(previous["functions"][0]["callers"]["code"], expected)
        self.assertIn("indisponível", states["code"])
        self.assertTrue(any(e["section"] == "callers.code" for e in self.snapshot.ERRORS))

    def test_database_callers_include_defaults_on_the_first_definition_line(self):
        consumer = function("consumer")
        consumer["definition"] = (
            "CREATE OR REPLACE FUNCTION public.consumer(value integer DEFAULT public.demo())\n"
            " RETURNS integer\n LANGUAGE sql\n AS $function$ SELECT value $function$;"
        )
        database = {"functions": [function(), consumer]}
        self.build(database, [])
        self.assertEqual(database["functions"][0]["callers"]["db"], ["public.consumer"])
        self.assertEqual(database["functions"][1]["callers"]["db"], [])


class SnapshotHeartbeatTests(SnapshotFixture):
    def manifest(self):
        return json.loads((self.out / "manifest.json").read_text(encoding="utf-8"))

    def collect_at(self, instant, **options):
        class FrozenDateTime(dt.datetime):
            @classmethod
            def now(cls, tz=None):
                return instant.astimezone(tz) if tz is not None else instant.replace(tzinfo=None)
        with mock.patch.object(self.snapshot.dt, "datetime", FrozenDateTime):
            return self.collect(**options)

    def unified_index(self):
        script = pathlib.Path(__file__).resolve().parents[1] / "regras_negocio" / "indice.py"
        spec = importlib.util.spec_from_file_location("heartbeat_index", script)
        index = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(index)
        arguments = [str(script), "--repo", self.temp.name, "--out", "INDEX.md", "--remote", "owner/repo",
                     "--head", "a" * 40, "--fonte", "banco real=output"]
        with mock.patch.object(sys, "argv", arguments):
            with mock.patch.object(index, "git", side_effect=AssertionError("manifest/CHANGELOG dispensam fallback Git")):
                with contextlib.redirect_stderr(io.StringIO()):
                    self.assertEqual(index.main(), 0)
        return (pathlib.Path(self.temp.name) / "INDEX.md").read_text(encoding="utf-8")

    def test_unchanged_collection_refreshes_utc_heartbeat_without_structural_changes(self):
        first = dt.datetime(2026, 1, 1, 0, 0, tzinfo=dt.timezone.utc)
        second = first + dt.timedelta(minutes=10)
        self.assertEqual(self.collect_at(first), 0)
        original_manifest = self.manifest()
        original_snapshot = (self.out / "snapshot.json").read_bytes()
        original_changelog = (self.out / "CHANGELOG.md").read_bytes()
        original_fingerprints = self.snapshot.fingerprints(self.metadata())
        self.assertEqual(self.collect_at(second), 0)
        current_manifest = self.manifest()
        self.assertEqual(original_manifest["gerado_em"], "2026-01-01T00:00:00Z")
        self.assertEqual(current_manifest["gerado_em"], "2026-01-01T00:10:00Z")
        self.assertEqual(dt.datetime.fromisoformat(current_manifest["gerado_em"]).utcoffset(), dt.timedelta(0))
        self.assertEqual(current_manifest["entrada"], "README.md")
        self.assertEqual(current_manifest["gerador"], "scripts/supabase_snapshot/snapshot.py")
        self.assertEqual(current_manifest["erros"], [])
        self.assertEqual(current_manifest["carried"], [])
        self.assertEqual((self.out / "snapshot.json").read_bytes(), original_snapshot)
        self.assertEqual((self.out / "CHANGELOG.md").read_bytes(), original_changelog)
        self.assertEqual(self.snapshot.fingerprints(self.metadata()), original_fingerprints)

    def test_partial_heartbeat_includes_collection_and_render_errors(self):
        self.collect()
        shutil.rmtree(self.out / "functions")
        self.assertEqual(self.collect(failures={"functions"}), 0)
        manifest = self.manifest()
        self.assertEqual(manifest["erros"], self.metadata()["errors"])
        self.assertEqual({error["section"] for error in manifest["erros"]}, {"functions", "functions.sql"})
        self.assertEqual(manifest["carried"], ["functions"])
        self.assertIn("| parcial ·", self.unified_index())

    def test_recovery_clears_heartbeat_errors_and_carried_sections(self):
        self.collect()
        self.collect(failures={"functions", "migrations"})
        self.assertTrue(self.manifest()["erros"])
        self.assertEqual(set(self.manifest()["carried"]), {"functions", "migrations"})
        self.assertEqual(self.collect(), 0)
        self.assertEqual(self.manifest()["erros"], [])
        self.assertEqual(self.manifest()["carried"], [])

    def test_index_prefers_current_heartbeat_to_old_structural_changelog(self):
        self.collect()
        (self.out / "CHANGELOG.md").write_text("# Histórico\n\n## 2000-01-01 00:00 UTC\n", encoding="utf-8")
        document = self.unified_index()
        self.assertIn("| ok ·", document)
        self.assertNotIn("desatualizado", document)
        (self.out / "manifest.json").unlink()
        self.assertIn("| desatualizado ·", self.unified_index())

    def test_unavailable_collection_does_not_renew_previous_heartbeat(self):
        self.collect()
        before = (self.out / "manifest.json").read_bytes()
        with mock.patch.object(self.snapshot, "introspect_db", return_value=({"functions": None, "migrations": None}, {})):
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(self.snapshot.main(), 1)
        self.assertEqual((self.out / "manifest.json").read_bytes(), before)

    def test_interrupted_render_does_not_publish_a_completed_heartbeat(self):
        with mock.patch.object(self.snapshot, "render_simple", side_effect=RuntimeError("falha de escrita simulada")):
            with self.assertRaisesRegex(RuntimeError, "falha de escrita"):
                self.collect()
        self.assertFalse((self.out / "manifest.json").exists())


def source_freshness_case(failed_sources):
    def run(self):
        self.exercise_sources(failed_sources)
    return run


for _mask in range(8):
    _sources = tuple(source for bit, source in enumerate(("cron", "triggers", "views")) if _mask & (1 << bit))
    setattr(SnapshotCallerFreshnessTests, f"test_functions_carried_with_{'_'.join(_sources) or 'no_other_failure'}",
            source_freshness_case(_sources))


class SnapshotDBStatsTests(SnapshotFixture):
    """Catálogo e resultados sintéticos; nenhum driver, socket ou banco real."""

    def stats(self, *, schema="extensions", auth_error=False, top=15, failure=None, empty=False):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        snapshot.STAT_STATEMENTS_TOP = top
        calls = []

        def query(_conn, sql, params=None):
            calls.append((sql, params))
            compact = " ".join(sql.split())
            if "pg_extension" in compact:
                extension = params[0] if params else "pg_stat_statements"
                if extension == "pgmq":
                    return [{"present": 1}]
                if failure == "catalog":
                    raise PermissionError("catálogo indisponível na fixture")
                if schema is None:
                    return []
                if "extnamespace" in compact:
                    return [{"schema": schema}]
                return [{"present": 1}]  # has_ext do código anterior
            if "total_exec_time" in compact:
                # O backend de teste não inclui a extensão no search_path.
                # Aceita somente um identificador SQL delimitado, não texto cru.
                relation = re.search(
                    r'FROM\s+("(?:""|[^"])*")\.pg_stat_statements\s+s', sql, re.I)
                if relation is None or relation.group(1)[1:-1].replace('""', '"') != schema:
                    raise RuntimeError('relation "pg_stat_statements" does not exist')
                if failure == "permission":
                    raise PermissionError("view sem permissão na fixture")
                if failure == "missing":
                    raise RuntimeError("view removida depois da consulta ao catálogo")
                if failure == "timeout":
                    raise TimeoutError("statement timeout simulado")
                if failure == "row":
                    return [{"query": None}]
                return [] if empty else [{
                    "role": "fixture_reader", "calls": 3, "total_ms": 8,
                    "mean_ms": 2.67, "rows": 3, "query": "select 'literal-fixture'",
                }]
            if "pg_database_size" in compact:
                if failure == "database":
                    raise RuntimeError("banco indisponível na fixture")
                return [{"s": 123456}]
            if "pg_stat_activity" in compact:
                return [{"usename": "fixture_reader", "state": "idle", "n": 2}]
            if "sum(pg_total_relation_size" in compact:
                return [{"schema": "public", "bytes": 45678}]
            if "FROM storage.objects" in compact:
                return [{"bucket_id": "fixture", "objects": 2, "bytes": 42}]
            if "FROM auth." in compact:
                if auth_error:
                    raise PermissionError("permission denied for schema auth")
                if "auth.identities" in compact:
                    return [{"provider": "fixture", "users": 5}]
                if "auth.mfa_factors" in compact:
                    return [{"factor_type": "totp", "status": "verified", "total": 2}]
                return [{"c": 5}]
            if "pgmq.metrics_all()" in compact:
                return [{"queue_name": "fixture", "queue_length": 3, "newest_msg_age_sec": 1,
                         "oldest_msg_age_sec": 2, "total_messages": 4}]
            raise AssertionError(f"Consulta não prevista no modelo offline: {compact[:70]}")

        with mock.patch.object(snapshot, "q", side_effect=query):
            with mock.patch.object(snapshot.urllib.request, "urlopen", side_effect=AssertionError("HTTP proibido")):
                with contextlib.redirect_stdout(io.StringIO()):
                    result = snapshot.get_db_stats(OfflineConnection())
        errors = {error["section"] for error in snapshot.ERRORS}
        return result, calls, errors

    def assert_core_metrics(self, stats, auth_error):
        self.assertIsInstance(stats, dict, "Falha opcional não deve descartar db_stats")
        self.assertEqual(stats["database_bytes"], 123456)
        self.assertEqual(stats["connections"], [{"usename": "fixture_reader", "state": "idle", "n": 2}])
        self.assertEqual(stats["schema_bytes"], [{"schema": "public", "bytes": 45678}])
        self.assertEqual(stats["storage"], [{"bucket_id": "fixture", "objects": 2, "bytes": 42}])
        self.assertEqual(stats["queues"][0]["queue_length"], 3)
        self.assertEqual(bool(stats["auth"]), not auth_error)

    def exercise_schema(self, schema, auth_error):
        stats, calls, errors = self.stats(schema=schema, auth_error=auth_error)
        self.assert_core_metrics(stats, auth_error)
        self.assertEqual(stats["top_queries"][0]["query"], "select '?'")
        self.assertEqual(errors, {"db_stats.auth"} if auth_error else set())
        lookup = [(sql, params) for sql, params in calls if "extnamespace" in sql]
        self.assertEqual(len(lookup), 1)
        top_calls = [(sql, params) for sql, params in calls if "total_exec_time" in sql]
        self.assertEqual(len(top_calls), 1)
        # Sem binds, '%' no identificador não vira placeholder do psycopg.
        self.assertIsNone(top_calls[0][1])
        self.assertIn("LIMIT 15", top_calls[0][0])

    def exercise_availability(self, present, top, auth_error):
        stats, calls, errors = self.stats(schema="extensions" if present else None,
                                         top=top, auth_error=auth_error)
        self.assert_core_metrics(stats, auth_error)
        self.assertEqual(errors, {"db_stats.auth"} if auth_error else set())
        self.assertEqual("top_queries" in stats, present and top > 0)
        stat_calls = [(sql, params) for sql, params in calls
                      if "total_exec_time" in sql or "extnamespace" in sql or params == ("pg_stat_statements",)]
        if top <= 0:
            self.assertEqual(stat_calls, [])
        elif present:
            self.assertEqual(len(stat_calls), 2)
            self.assertIn("LIMIT 1", stat_calls[-1][0])
        else:
            self.assertEqual(len(stat_calls), 1)

    def exercise_failure(self, failure, auth_error):
        stats, _, errors = self.stats(failure=failure, auth_error=auth_error)
        self.assert_core_metrics(stats, auth_error)
        self.assertNotIn("top_queries", stats)
        expected = {"db_stats.top_queries"} | ({"db_stats.auth"} if auth_error else set())
        self.assertEqual(errors, expected)

    def exercise_recovery(self, auth_error, empty):
        failed, _, errors = self.stats(failure="permission", auth_error=auth_error)
        self.assert_core_metrics(failed, auth_error)
        self.assertIn("db_stats.top_queries", errors)
        recovered, _, errors = self.stats(empty=empty, auth_error=auth_error)
        self.assert_core_metrics(recovered, auth_error)
        self.assertEqual(errors, {"db_stats.auth"} if auth_error else set())
        self.assertEqual(len(recovered["top_queries"]), 0 if empty else 1)
        self.assertNotIn("top_queries", failed, "Recuperação não deve alterar o resultado anterior")

    def test_schema_is_resolved_again_after_extension_moves(self):
        first, _, first_errors = self.stats(schema="extensions")
        second, _, second_errors = self.stats(schema='Stats "new"')
        self.assert_core_metrics(first, False)
        self.assert_core_metrics(second, False)
        self.assertEqual(first_errors | second_errors, set())
        self.assertEqual(first["top_queries"], second["top_queries"])

    def test_partial_metrics_remain_in_rendered_json_and_markdown(self):
        stats, _, errors = self.stats(failure="missing", auth_error=True)
        self.assert_core_metrics(stats, True)
        self.snapshot.render_stats({"db_stats": stats}, {}, {})
        rendered = json.loads((self.out / "stats.json").read_text())["db"]["db_stats"]
        self.assertEqual(rendered["database_bytes"], 123456)
        self.assertEqual(rendered["queues"][0]["queue_name"], "fixture")
        self.assertNotIn("top_queries", rendered)
        self.assertTrue((self.out / "stats.md").exists())
        self.assertEqual(errors, {"db_stats.auth", "db_stats.top_queries"})

    def test_mandatory_database_failure_keeps_section_error_contract(self):
        stats, _, errors = self.stats(failure="database")
        self.assertIsNone(stats)
        self.assertEqual(errors, {"db_stats"})


class SnapshotConfigurationTests(unittest.TestCase):
    def test_invalid_integer_environment_is_reported_without_traceback(self):
        script = pathlib.Path(__file__).with_name("snapshot.py")
        for key, value in (("CRON_RUNS_PER_JOB", "x"), ("STAT_STATEMENTS_TOP", "1.5"),
                           ("CODE_SCAN_MAX_FILES", "")):
            with self.subTest(key=key):
                driver = types.ModuleType("psycopg")
                driver.connect = mock.Mock(side_effect=AssertionError("conexão proibida"))
                rows = types.ModuleType("psycopg.rows")
                rows.dict_row = object()
                spec = importlib.util.spec_from_file_location(f"snapshot_invalid_{key}", script)
                snapshot = importlib.util.module_from_spec(spec)
                env = {"SUPABASE_DB_URL": "offline-fixture", key: value}
                with mock.patch.dict(sys.modules, {"psycopg": driver, "psycopg.rows": rows}):
                    with mock.patch.dict(os.environ, env, clear=True):
                        spec.loader.exec_module(snapshot)
                with contextlib.redirect_stderr(io.StringIO()) as stderr:
                    self.assertEqual(snapshot.main(), 2)
                message = stderr.getvalue()
                self.assertIn(f"Configuração inválida: {key}", message)
                self.assertNotIn("Traceback", message)


def db_stats_case(method, *args):
    def run(self):
        getattr(self, method)(*args)
    return run


for _index, _schema in enumerate((
        "extensions", "public", "analytics", "Query Metrics", 'stats"quoted',
        "select", "stats%raw", 'stats"; DROP TABLE private; --')):
    for _auth_error in (False, True):
        setattr(SnapshotDBStatsTests, f"test_schema_{_index}_auth_{_auth_error}",
                db_stats_case("exercise_schema", _schema, _auth_error))

for _present in (False, True):
    for _top in (0, -1, 1):
        for _auth_error in (False, True):
            setattr(SnapshotDBStatsTests, f"test_available_{_present}_top_{_top}_auth_{_auth_error}",
                    db_stats_case("exercise_availability", _present, _top, _auth_error))

for _failure in ("catalog", "permission", "missing", "timeout", "row"):
    for _auth_error in (False, True):
        setattr(SnapshotDBStatsTests, f"test_failure_{_failure}_auth_{_auth_error}",
                db_stats_case("exercise_failure", _failure, _auth_error))

for _auth_error in (False, True):
    for _empty in (False, True):
        setattr(SnapshotDBStatsTests, f"test_recovery_auth_{_auth_error}_empty_{_empty}",
                db_stats_case("exercise_recovery", _auth_error, _empty))


# --------------------------------------------------------------------------- #
# Robustez: segredos x guard do workflow, falha de conexão, privacidade, catálogo, Management API
# --------------------------------------------------------------------------- #

# Cópia do grep do passo "Guard - nenhum segredo na saida" de .github/workflows/contexto-ia.yml.
WORKFLOW_GUARD = (r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sb_secret_|sb_publishable_|"
                  r"postgres(ql)?://[^ ]*:[^ @]+@")
# Montado em tempo de execução: um JWT literal no arquivo dispara o gitleaks.
JWT = ".".join(("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "eyJyb2xlIjoic2VydmljZV9yb2xlIn0", "assinatura_de_teste_123"))


class SnapshotSecretGuardTests(SnapshotFixture):
    def test_guard_copy_matches_the_workflow_that_consumes_the_output(self):
        workflow = pathlib.Path(__file__).resolve().parents[2] / ".github" / "workflows" / "contexto-ia.yml"
        if not workflow.is_file():
            self.skipTest("workflow consumidor ausente neste checkout")
        self.assertIn(f"grep -rIEl '{WORKFLOW_GUARD}'", workflow.read_text(encoding="utf-8"))

    def test_redacted_text_never_trips_the_workflow_guard(self):
        samples = {
            "dsn": "PERFORM dblink('postgresql://postgres.ref:S3nh4-Secreta@aws-0-sa-east-1.pooler.supabase.com:5432/postgres');",
            "dsn seguido de arroba": "x := 'postgres://app:S3nh4-Secreta@db.interno:5432/erp?application_name=a@b';",
            "prefixo solto": "SELECT chave LIKE 'sb_secret_%' OR chave LIKE 'sb_publishable_%'",
            "chave nova": "apikey sb_secret_AbCdEf0123456789 e sb_publishable_AbCdEf0123456789",
            "chave curta": "sb_secret_abc",
            "jwt": f'headers := \'{{"Authorization": "Bearer {JWT}"}}\'',
        }
        for name, text in samples.items():
            with self.subTest(name=name):
                self.assertRegex(text, WORKFLOW_GUARD, "a amostra precisa reprovar no guard antes do scrub")
                clean = self.snapshot.scrub(text)
                self.assertNotRegex(clean, WORKFLOW_GUARD)
                # Ordem e nome do laço evitam falso "chave = valor" da regra genérica de segredos do gitleaks.
                for valor in ("assinatura_de_teste_123", "AbCdEf0123456789", "S3nh4-Secreta"):
                    self.assertNotIn(valor, clean)

    def test_redacted_dsn_keeps_host_and_drops_user_and_password(self):
        clean = self.snapshot.scrub("postgresql://postgres.ref:S3nh4@aws-0-sa-east-1.pooler.supabase.com:5432/postgres")
        self.assertEqual(clean, "postgresql://[REDACTED CREDENTIALS]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres")

    def test_ordinary_sql_and_urls_are_left_alone(self):
        for text in ("SELECT public.has_role(auth.uid(), 'admin'::text)", "https://exemplo.com:443/hook?x=1",
                     "postgresql://localhost:5432/postgres", "token := encode(gen_random_bytes(32), 'hex')"):
            self.assertEqual(self.snapshot.scrub(text), text)

    def test_pg_dump_output_is_scrubbed_before_it_is_written(self):
        dump = ("CREATE TRIGGER hook AFTER INSERT ON public.pedidos FOR EACH ROW EXECUTE FUNCTION "
                f"supabase_functions.http_request('https://x/hook', 'POST', '{{\"Authorization\":\"Bearer {JWT}\"}}');\n")
        completed = types.SimpleNamespace(returncode=0, stdout=dump, stderr="")
        self.snapshot.PGDUMP = True
        with mock.patch.object(self.snapshot.shutil, "which", return_value="/usr/bin/pg_dump"):
            with mock.patch.object(self.snapshot.subprocess, "run", return_value=completed):
                with contextlib.redirect_stdout(io.StringIO()):
                    schema = self.snapshot.run_pg_dump()
        self.assertIn("CREATE TRIGGER hook", schema)
        self.assertNotIn("assinatura_de_teste_123", schema)
        self.assertNotRegex(schema, WORKFLOW_GUARD)

    def test_recorded_errors_are_scrubbed(self):
        self.snapshot.ERRORS.clear()
        with contextlib.redirect_stdout(io.StringIO()) as log:
            self.snapshot.record_error("pg_dump", "pg_dump: error: postgresql://postgres.ref:S3nh4-Secreta@host:5432/postgres")
        self.assertNotIn("S3nh4-Secreta", self.snapshot.ERRORS[-1]["error"] + log.getvalue())


class SnapshotCommandLineTests(SnapshotFixture):
    def run_cli(self, *argv):
        stdout, stderr = io.StringIO(), io.StringIO()
        with mock.patch.object(self.snapshot, "main", side_effect=AssertionError("argumento não pode iniciar coleta")):
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                code = self.snapshot.cli(list(argv))
        return code, stdout.getvalue(), stderr.getvalue()

    def test_help_prints_the_environment_contract_and_collects_nothing(self):
        for flag in ("--help", "-h"):
            code, stdout, stderr = self.run_cli(flag)
            self.assertEqual((code, stderr), (0, ""))
            self.assertIn("SUPABASE_DB_URL", stdout)
            self.assertIn("SNAPSHOT_DIR", stdout)

    def test_unknown_argument_is_rejected_instead_of_starting_a_collection(self):
        code, stdout, stderr = self.run_cli("--check")
        self.assertEqual((code, stdout), (2, ""))
        self.assertIn("Argumento não reconhecido: --check", stderr)
        self.assertFalse(self.out.exists())

    def test_no_argument_runs_the_collection(self):
        with mock.patch.object(self.snapshot, "main", return_value=0) as main:
            self.assertEqual(self.snapshot.cli([]), 0)
        main.assert_called_once_with()


CONNECTION_FAILURES = {
    # nome: (SUPABASE_DB_URL, mensagem do driver, pedaços que não podem sair, trecho da dica)
    "senha_errada": ("postgresql://postgres.ref:S3nh4-Secreta@pooler.exemplo.com:5432/postgres",
                     'connection failed: FATAL:  password authentication failed for user "postgres.ref"',
                     ["S3nh4-Secreta"], "usuário ou senha recusados"),
    "arroba_na_senha": ("postgresql://postgres.ref:p@Segredo-Longo@pooler.exemplo.com:5432/postgres",
                        "failed to resolve host 'Segredo-Longo@pooler.exemplo.com': [Errno -2] Name or service not known",
                        ["Segredo-Longo"], "percent-encoding"),
    "url_entre_aspas": ('"postgresql://postgres.ref:S3nh4-Secreta@pooler.exemplo.com:5432/postgres"',
                        'missing "=" after ""postgresql://postgres.ref:S3nh4-Secreta@pooler.exemplo.com:5432/postgres"" in connection info string',
                        ["S3nh4-Secreta"], "sem aspas"),
    "url_sem_esquema": ("postgres.ref:S3nh4-Secreta@pooler.exemplo.com:5432/postgres",
                        'missing "=" after "postgres.ref:S3nh4-Secreta@pooler.exemplo.com:5432/postgres" in connection info string',
                        ["S3nh4-Secreta"], "postgresql://usuario:senha@host:porta/banco"),
    "senha_ecoada_em_outro_url": ("postgresql://postgres.ref:S3nh4-Secreta@pooler.exemplo.com:5432/postgres",
                                  "could not connect via postgresql://postgres.ref:S3nh4-Secreta@10.0.0.1:5432/postgres",
                                  ["S3nh4-Secreta"], "confira host, porta e banco"),
    "formato_chave_valor": ("host=pooler.exemplo.com user=postgres password=S3nh4-Secreta",
                            'invalid connection option "S3nh4-Secreta"', ["S3nh4-Secreta"], "postgresql://usuario:senha@host:porta/banco"),
    "so_ipv6": ("postgresql://postgres:S3nh4-Secreta@db.ref.supabase.co:5432/postgres",
                'connection to server at "db.ref.supabase.co" (2600:1f1e::1), port 5432 failed: Network is unreachable',
                ["S3nh4-Secreta"], "Session pooler"),
    "timeout": ("postgresql://postgres:S3nh4-Secreta@pooler.exemplo.com:5432/postgres", "connection timeout expired",
                ["S3nh4-Secreta"], "não respondeu em 30s"),
    "porta_recusada": ("postgresql://postgres:S3nh4-Secreta@127.0.0.1:1/postgres",
                       'connection failed: connection to server at "127.0.0.1", port 1 failed: Connection refused\n'
                       "\tIs the server running on that host and accepting TCP/IP connections?",
                       ["S3nh4-Secreta"], "confira host, porta e banco"),
}


class SnapshotConnectionFailureTests(SnapshotFixture):
    def fail_to_connect(self, url, driver_message):
        self.snapshot.ERRORS.clear()
        self.snapshot.CARRIED.clear()
        self.snapshot.DB_URL = url
        stdout, stderr = io.StringIO(), io.StringIO()
        with mock.patch.object(self.snapshot.psycopg, "connect", side_effect=RuntimeError(driver_message)):
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                code = self.snapshot.main()
        return code, stdout.getvalue(), stderr.getvalue()

    def exercise(self, name):
        url, driver_message, forbidden, hint = CONNECTION_FAILURES[name]
        code, stdout, stderr = self.fail_to_connect(url, driver_message)
        self.assertEqual(code, 1)
        self.assertEqual(len(stderr.strip().splitlines()), 1, stderr)
        self.assertIn("Banco inacessível", stderr)
        self.assertIn(hint, stderr)
        self.assertNotIn("Traceback", stdout + stderr)
        for secret in forbidden + [url]:
            self.assertNotIn(secret, stdout + stderr)
        # Falha de conexão não publica nada: só o marcador de posse do diretório.
        self.assertEqual([path.name for path in self.out.iterdir()], [self.snapshot.OUTPUT_MARKER])

    def test_connection_failure_keeps_the_previous_snapshot_untouched(self):
        self.assertEqual(self.collect(), 0)
        before = {path.name: path.read_bytes() for path in self.out.iterdir() if path.is_file()}
        code, _, stderr = self.fail_to_connect(*CONNECTION_FAILURES["timeout"][:2])
        self.assertEqual(code, 1)
        self.assertIn("nada foi coletado nem sobrescrito", stderr)
        self.assertEqual(before, {path.name: path.read_bytes() for path in self.out.iterdir() if path.is_file()})


for _name in CONNECTION_FAILURES:
    setattr(SnapshotConnectionFailureTests, f"test_{_name}_is_one_line_without_secret",
            lambda self, name=_name: self.exercise(name))


class SnapshotCronPrivacyTests(SnapshotFixture):
    def test_cron_message_keeps_only_the_primary_error_line(self):
        cases = {
            'ERROR:  duplicate key value violates unique constraint "clientes_email_key"\n'
            "DETAIL:  Key (email)=(joao@exemplo.com) already exists.":
                'ERROR:  duplicate key value violates unique constraint "clientes_email_key"',
            'ERROR:  null value in column "nome" violates not-null constraint\n'
            "DETAIL:  Failing row contains (7, null, joao@exemplo.com, 123.456.789-00).\nCONTEXT:  SQL statement":
                'ERROR:  null value in column "nome" violates not-null constraint',
            "ERROR: duplicate key DETAIL: Key (email, cpf)=(joao@exemplo.com, 123) already exists.":
                "ERROR: duplicate key DETAIL: Key (email, cpf)=(?) already exists.",
            "ERROR: x DETAIL: Failing row contains (7, joao@exemplo.com).": "ERROR: x DETAIL: Failing row contains (?).",
            "1 row": "1 row", "": "", None: None,
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(self.snapshot.cron_message(raw), expected)

    def test_cron_runs_do_not_carry_row_values(self):
        row = {"jobid": 2, "runid": 9, "status": "failed", "start_time": None, "end_time": None, "seconds": 1,
               "return_message": "ERROR:  duplicate key\nDETAIL:  Key (email)=(joao@exemplo.com) already exists."}

        def query(_conn, sql, params=None):
            return [{"present": 1}] if "pg_extension" in sql else [dict(row)]

        with mock.patch.object(self.snapshot, "q", side_effect=query):
            with contextlib.redirect_stdout(io.StringIO()):
                runs = self.snapshot.get_cron_runs(OfflineConnection())
        self.assertEqual(runs[0]["return_message"], "ERROR:  duplicate key")

    def cron(self, rls_active):
        self.snapshot.ERRORS.clear()

        def query(_conn, sql, params=None):
            if "pg_extension" in sql:
                return [{"present": 1}]
            if "row_security_active" in sql:
                return [{"active": rls_active}]
            return [] if rls_active else [{"jobid": 1, "jobname": "demo", "schedule": "* * * * *", "command": "SELECT 1"}]

        with mock.patch.object(self.snapshot, "q", side_effect=query):
            with contextlib.redirect_stdout(io.StringIO()):
                return self.snapshot.get_cron(OfflineConnection()), {e["section"] for e in self.snapshot.ERRORS}

    def test_cron_jobs_hidden_by_row_security_are_reported_not_published_as_zero(self):
        cron, errors = self.cron(rls_active=True)
        self.assertEqual(cron, {"installed": True, "jobs": []})
        self.assertEqual(errors, {"cron.rls"})

    def test_cron_without_row_security_restriction_has_no_warning(self):
        cron, errors = self.cron(rls_active=False)
        self.assertEqual(len(cron["jobs"]), 1)
        self.assertEqual(errors, set())


class SnapshotCatalogQueryTests(SnapshotFixture):
    def emitted_sql(self):
        """Todo SQL que o módulo envia ao banco: 2º argumento de q() e 1º de conn.execute()."""
        import ast
        tree = ast.parse(pathlib.Path(self.snapshot.__file__).read_text(encoding="utf-8"))
        statements = []
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            target = node.func.id if isinstance(node.func, ast.Name) else getattr(node.func, "attr", "")
            index = {"q": 1, "execute": 0}.get(target)
            if index is None or len(node.args) <= index:
                continue
            argument = node.args[index]
            parts = [argument]
            while parts and not all(isinstance(part, (ast.Constant, ast.FormattedValue)) for part in parts):
                parts = [child for part in parts for child in (
                    part.values if isinstance(part, ast.JoinedStr) else
                    [part.left, part.right] if isinstance(part, ast.BinOp) else [part])]
                if any(not isinstance(part, (ast.Constant, ast.FormattedValue, ast.JoinedStr, ast.BinOp)) for part in parts):
                    break
            text = "".join(part.value if isinstance(part, ast.Constant) and isinstance(part.value, str) else " x "
                           for part in parts if isinstance(part, (ast.Constant, ast.FormattedValue)))
            if text.strip():
                statements.append(" ".join(text.split()))
        return statements

    def test_every_statement_sent_to_the_database_is_read_only(self):
        statements = self.emitted_sql()
        self.assertGreater(len(statements), 50, "a varredura do fonte deixou de encontrar as consultas")
        for sql in statements:
            self.assertRegex(sql, r"(?i)^(SELECT|SET)\b", sql[:80])
            # Um único SELECT sem INTO nem função de escrita não altera o banco; o resto a sessão read-only barra.
            self.assertNotIn(";", sql)
            self.assertNotRegex(sql, r"(?i)\b(INTO|nextval|setval|set_config|decrypted_secrets?)\b", sql[:80])
        self.assertIn("SET default_transaction_read_only = on", statements)

    def test_no_query_reads_rows_of_application_tables(self):
        for sql in self.emitted_sql():
            self.assertNotRegex(sql, r"(?i)\b(FROM|JOIN)\s+public\.", sql[:80])
            if re.search(r"(?i)\bFROM\s+(auth|storage)\.(users|identities|mfa_factors|objects)\b", sql):
                self.assertRegex(sql, r"(?i)count\(\*\)", "tabelas com dado pessoal só entram como contagem")

    def captured(self, collector):
        calls = []
        with mock.patch.object(self.snapshot, "q", side_effect=lambda _conn, sql, params=None: calls.append(sql) or []):
            with contextlib.redirect_stdout(io.StringIO()):
                collector(OfflineConnection())
        return [" ".join(sql.split()) for sql in calls]

    def test_composite_key_columns_follow_the_constraint_order(self):
        (sql,) = self.captured(self.snapshot.get_constraints)
        for key, relation in (("conkey", "conrelid"), ("confkey", "confrelid")):
            self.assertIn(f"unnest(con.{key}) WITH ORDINALITY k(attnum, ord) JOIN pg_attribute a "
                          f"ON a.attrelid = con.{relation} AND a.attnum = k.attnum ORDER BY k.ord", sql)

    def test_grants_come_from_the_catalog_not_from_the_caller_dependent_views(self):
        tables, columns, *_ = self.captured(self.snapshot.get_grants)
        for sql in (tables, columns):
            self.assertNotIn("information_schema.", sql)
            self.assertIn("aclexplode(", sql)
        self.assertIn("c.relkind IN ('r','p','v','m','f')", tables)

    def test_security_invoker_accepts_every_true_spelling(self):
        pattern = re.search(r"~\* '([^']+)'", self.snapshot.SECURITY_INVOKER_ON).group(1)
        views = " ".join(self.captured(self.snapshot.get_views))
        self.assertIn(self.snapshot.SECURITY_INVOKER_ON, views)
        for options in ("security_invoker=true", "security_invoker=on", "security_invoker=1", "security_invoker=yes",
                        "security_invoker=TRUE", "security_barrier=true,security_invoker=on", "security_invoker=on,check_option=local"):
            self.assertRegex(options, re.compile(pattern, re.I))
        for options in ("", "security_invoker=false", "security_invoker=off", "security_invoker=0", "security_invoker=no",
                        "security_barrier=true", "not_security_invoker=true"):
            self.assertNotRegex(options, re.compile(pattern, re.I))

    def test_storage_and_queue_failures_do_not_discard_the_other_database_metrics(self):
        self.snapshot.ERRORS.clear()
        self.snapshot.STAT_STATEMENTS_TOP = 0

        def query(_conn, sql, params=None):
            if "storage.objects" in sql:
                raise RuntimeError('relation "storage.objects" does not exist')
            if "pg_extension" in sql:
                return [{"present": 1}]
            if "pgmq.metrics_all" in sql:
                raise PermissionError("permission denied for schema pgmq")
            if "pg_database_size" in sql:
                return [{"s": 123}]
            if "FROM auth." in sql:
                return [{"c": 1}]
            return []

        with mock.patch.object(self.snapshot, "q", side_effect=query):
            with contextlib.redirect_stdout(io.StringIO()):
                stats = self.snapshot.get_db_stats(OfflineConnection())
        self.assertEqual(stats["database_bytes"], 123)
        self.assertEqual(stats["storage"], [])
        self.assertEqual(stats["queues"], [])
        self.assertEqual({e["section"] for e in self.snapshot.ERRORS}, {"db_stats.storage", "db_stats.queues"})

    def test_enums_with_the_same_name_in_two_schemas_do_not_share_usage(self):
        db = {
            "types": [{"schema": schema, "name": "status_pedido", "kind": "enum", "values": ["a"], "definition": None}
                      for schema in ("app_privado", "public")],
            "columns": [
                {"schema": "public", "table": "pedidos", "name": "status", "type": "status_pedido", "is_enum": True,
                 "enum_type": "public.status_pedido"},
                {"schema": "public", "table": "pedidos", "name": "status_interno", "type": "app_privado.status_pedido",
                 "is_enum": True, "enum_type": "app_privado.status_pedido"},
            ],
        }
        self.out.mkdir()
        self.snapshot.render_simple(db, {"enabled": False})
        rendered = (self.out / "types-enums.md").read_text(encoding="utf-8")
        self.assertIn("| app_privado.status_pedido | enum | a | public.pedidos.status_interno |", rendered)
        self.assertIn("| public.status_pedido | enum | a | public.pedidos.status |", rendered)


class SnapshotManagementApiTests(SnapshotFixture):
    FUNCTIONS = [{"slug": "predict-delays", "name": "predict-delays", "status": "ACTIVE", "version": 3, "verify_jwt": False},
                 {"slug": "send-password-reset", "name": "send-password-reset", "status": "ACTIVE", "version": 7, "verify_jwt": True}]

    def collect_with_api(self, failure=None, functions=None):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        snapshot.CARRIED.clear()
        snapshot._SLUG_SEEN.clear()
        snapshot.PROJECT_REF, snapshot.ACCESS_TOKEN = "refteste", "token-de-teste"
        answers = {
            "": {"id": "refteste", "name": "Loggi", "region": "sa-east-1", "db_pass": "valor-secreto-da-api"},
            "/functions": self.FUNCTIONS if functions is None else functions,
            "/secrets": [{"name": "RESEND_API_KEY", "value": "valor-secreto-da-api"}],
            "/config/auth": {"site_url": "https://exemplo.com", "smtp_pass": "valor-secreto-da-api"},
            "/postgrest": {"db_schema": "public", "jwt_secret": "valor-secreto-da-api"},
            "/config/database/pooler": {"pool_mode": "transaction"},
        }

        class Response(io.BytesIO):
            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

        def urlopen(request, timeout=None):
            path = request.full_url.split("/projects/refteste", 1)[1].split("?")[0]
            if isinstance(failure, int):
                raise snapshot.urllib.error.HTTPError(request.full_url, failure, "erro", {}, None)
            if failure == "timeout":
                raise TimeoutError("timed out")
            if failure == "vazio":
                return Response(b"")
            if failure == "html":
                return Response(b"<html>bad gateway</html>")
            if path not in answers:
                raise snapshot.urllib.error.HTTPError(request.full_url, 404, "Not Found", {}, None)
            return Response(json.dumps(answers[path]).encode())

        @snapshot.section("server")
        def server(_conn):
            return {"server_version": "offline-fixture"}

        snapshot.DB_SECTIONS = [server]
        with mock.patch.object(snapshot.psycopg, "connect", return_value=OfflineConnection()):
            with mock.patch.object(snapshot.urllib.request, "urlopen", side_effect=urlopen):
                with contextlib.redirect_stdout(io.StringIO()):
                    return snapshot.main()

    def function_dirs(self):
        return sorted(path.name for path in (self.out / "edge-functions").iterdir())

    def exercise_failure(self, failure):
        self.assertEqual(self.collect_with_api(), 0)
        changelog = (self.out / "CHANGELOG.md").read_text(encoding="utf-8")
        published = self.metadata()["api"]
        self.assertEqual(self.collect_with_api(failure=failure), 0)
        self.assertEqual(self.function_dirs(), ["predict-delays", "send-password-reset"])
        self.assertEqual((self.out / "CHANGELOG.md").read_text(encoding="utf-8"), changelog)
        for key in ("edge_functions", "secrets_names", "auth_config", "postgrest_config", "pooler_config"):
            self.assertEqual(self.metadata()["api"][key], published[key])
        self.assertIn("api.edge_functions", self.error_sections())
        self.assertIn("api.edge_functions", self.metadata()["carried"])
        self.assertIn("mostrando a versão anterior", (self.out / "edge-functions.md").read_text(encoding="utf-8"))

    def test_successful_collection_publishes_metadata_without_secret_values(self):
        self.assertEqual(self.collect_with_api(), 0)
        self.assertEqual(self.function_dirs(), ["predict-delays", "send-password-reset"])
        self.assertEqual(self.metadata()["api"]["secrets_names"], ["RESEND_API_KEY"])
        for path in self.out.rglob("*"):
            if path.is_file():
                self.assertNotIn("valor-secreto-da-api", path.read_text(encoding="utf-8"), path.name)
                self.assertNotIn("token-de-teste", path.read_text(encoding="utf-8"), path.name)

    def test_recovery_after_failure_removes_a_function_that_was_really_deleted(self):
        self.assertEqual(self.collect_with_api(), 0)
        self.assertEqual(self.collect_with_api(failure=500), 0)
        self.assertEqual(self.collect_with_api(functions=self.FUNCTIONS[:1]), 0)
        self.assertEqual(self.function_dirs(), ["predict-delays"])
        self.assertEqual(self.metadata()["carried"], [])
        self.assertIn("**edge functions** removido (1): `send-password-reset`",
                      (self.out / "CHANGELOG.md").read_text(encoding="utf-8"))

    def test_failed_first_collection_says_unavailable_instead_of_listing_nothing(self):
        self.assertEqual(self.collect_with_api(failure=500), 0)
        self.assertIn("indisponível nesta coleta e sem versão anterior", (self.out / "edge-functions.md").read_text(encoding="utf-8"))
        self.assertIn("api.edge_functions", self.error_sections())


for _failure in (500, 429, 401, "timeout", "vazio", "html"):
    setattr(SnapshotManagementApiTests, f"test_failure_{_failure}_keeps_previous_metadata_and_changelog",
            lambda self, failure=_failure: self.exercise_failure(failure))


if __name__ == "__main__":
    unittest.main()
