"""Regressões offline do índice único (00-INDEX.md); não usam rede, git remoto nem banco."""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import re
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).with_name("indice.py")
SPEC = importlib.util.spec_from_file_location("context_index", SCRIPT)
indice = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(indice)

HEAD = "a" * 40
# as três fontes, com os nomes e caminhos que o job `publicar` de contexto-ia.yml passa
FONTES = ("banco real=docs/contexto/supabase", "código=docs/contexto/codigo", "regras de negócio=docs/contexto/regras")


def iso(minutes_ago: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")


class IndexFixture(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="context-index-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.out = self.root / "docs/contexto/00-INDEX.md"

    def source(self, name, manifest=None, **files):
        folder = self.root / "docs/contexto" / name
        folder.mkdir(parents=True, exist_ok=True)
        if manifest is not None:
            (folder / "manifest.json").write_text(manifest if isinstance(manifest, str) else json.dumps(manifest), encoding="utf-8")
        for filename, content in {"README.md": "x", **files}.items():
            (folder / filename).write_text(content, encoding="utf-8")
        return folder

    def fresh(self, name, minutes_ago=1, commit=HEAD, **extra):
        return self.source(name, {"gerado_em": iso(minutes_ago), "commit": commit, "entrada": "README.md", **extra})

    def run_index(self, *extra, fontes=FONTES, head=HEAD):
        command = [sys.executable, str(SCRIPT), "--repo", str(self.root), "--out", "docs/contexto/00-INDEX.md", "--remote", "owner/repo"]
        command += ["--head", head] if head else []
        for fonte in fontes:
            command += ["--fonte", fonte]
        return subprocess.run(command + list(extra), capture_output=True, text=True, timeout=30, cwd="/")

    def estados(self):
        rows = [line.split(" | ") for line in self.out.read_text(encoding="utf-8").splitlines() if line.startswith("| ") and "**" in line]
        return {row[1].strip("*"): row[3].rstrip(" |") for row in rows}

    def estado(self, name):
        return self.estados()[name]


class WorkflowContractTests(IndexFixture):
    def test_three_fresh_sources_are_ok_in_reading_order_with_files_listed(self):
        for name in ("supabase", "codigo", "regras"):
            self.fresh(name)
        result = self.run_index()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(list(self.estados()), ["regras de negócio", "banco real", "código"])
        for estado in self.estados().values():
            self.assertRegex(estado, r"^ok · [0-2] min atrás$")
        document = self.out.read_text(encoding="utf-8")
        self.assertIn(f"HEAD `{HEAD[:10]}`", document)
        self.assertIn("| **regras de negócio** | `docs/contexto/regras/README.md` | ok ·", document)
        self.assertIn("- `docs/contexto/supabase/manifest.json`", document)
        self.assertIn("contam até a data deste índice", document)

    def test_source_that_never_ran_is_reported_without_hiding_the_others(self):
        self.fresh("codigo")
        self.fresh("regras")
        self.assertEqual(self.run_index().returncode, 0)
        self.assertEqual(self.estado("banco real"), "ainda não gerado")
        self.assertIn("`docs/contexto/supabase/` (ainda não existe — o produtor não rodou)", self.out.read_text(encoding="utf-8"))
        self.assertTrue(self.estado("código").startswith("ok · "))
        self.assertTrue(self.estado("regras de negócio").startswith("ok · "))

    def test_empty_source_folder_counts_as_not_generated(self):
        (self.root / "docs/contexto/supabase").mkdir(parents=True)
        self.assertEqual(self.run_index(fontes=FONTES[:1]).returncode, 0)
        self.assertEqual(self.estado("banco real"), "ainda não gerado")

    def test_git_is_not_needed_when_head_remote_and_manifest_dates_are_given(self):
        for name in ("supabase", "codigo", "regras"):
            self.fresh(name)
        arguments = [str(SCRIPT), "--repo", str(self.root), "--out", "docs/contexto/00-INDEX.md", "--remote", "owner/repo", "--head", HEAD]
        for fonte in FONTES:
            arguments += ["--fonte", fonte]
        with mock.patch.object(sys, "argv", arguments), mock.patch.object(indice, "git", side_effect=AssertionError("git não deveria ser chamado")):
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(indice.main(), 0)

    def test_runs_without_git_repository_and_without_head(self):
        self.fresh("regras")
        result = self.run_index(head="", fontes=FONTES[2:])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HEAD `n/d`", self.out.read_text(encoding="utf-8"))
        self.assertTrue(self.estado("regras de negócio").startswith("ok · "))


class FreshnessTests(IndexFixture):
    def test_every_date_format_written_by_the_three_producers_is_understood(self):
        now = datetime.now(timezone.utc) - timedelta(minutes=5)
        formats = {
            "generate.py": now.strftime("%Y-%m-%d %H:%M UTC"),
            "gerar.mjs": now.strftime("%Y-%m-%dT%H:%M:%S.123Z"),
            "snapshot.py": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "offset -03:00": now.astimezone(timezone(timedelta(hours=-3))).isoformat(timespec="seconds"),
            "offset +00:00 com microssegundos": now.isoformat(),
            "sem segundos": now.strftime("%Y-%m-%dT%H:%MZ"),
            "sem fuso (assumido UTC)": now.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for label, value in formats.items():
            with self.subTest(label):
                self.source("supabase", {"gerado_em": value})
                self.assertEqual(self.run_index(fontes=FONTES[:1]).returncode, 0)
                self.assertRegex(self.estado("banco real"), r"^ok · [4-6] min atrás$")

    def test_date_in_the_future_is_never_shown_as_ok_or_as_negative_age(self):
        self.fresh("supabase", minutes_ago=-7)
        self.fresh("codigo", minutes_ago=-200)
        self.fresh("regras", minutes_ago=-7, commit="b" * 40)
        self.assertEqual(self.run_index().returncode, 0)
        for name in ("banco real", "código", "regras de negócio"):
            estado = self.estado(name)
            self.assertRegex(estado, r"^(não verificável|desatualizado) · ⚠️ data de geração no futuro \(\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC\)", name)
            self.assertNotIn("atrás", estado)
            self.assertNotRegex(estado, r"-\d+ ?(min|h)")

    def test_small_clock_skew_between_runners_is_age_zero(self):
        self.fresh("supabase", minutes_ago=-2)
        self.assertEqual(self.run_index(fontes=FONTES[:1]).returncode, 0)
        self.assertEqual(self.estado("banco real"), "ok · 0 min atrás")

    def test_source_without_readable_generation_date_is_not_verifiable(self):
        cases = {"sem manifest": None, "sem gerado_em": {"commit": HEAD}, "data ilegível": {"gerado_em": "ontem"}, "data numérica": {"gerado_em": 1794266303}}
        for label, manifest in cases.items():
            with self.subTest(label):
                folder = self.source("supabase", manifest)
                self.assertEqual(self.run_index(fontes=FONTES[:1]).returncode, 0)
                self.assertEqual(self.estado("banco real"), "não verificável · ⚠️ sem data de geração legível (`gerado_em` no manifest.json)")
                if manifest is not None:
                    (folder / "manifest.json").unlink()

    def test_unreadable_manifest_is_not_verifiable(self):
        self.source("supabase", "{quebrado")
        self.source("codigo", "[1, 2]")
        (self.source("regras") / "manifest.json").write_bytes(b"\xff\xfe\x00{")
        self.assertEqual(self.run_index().returncode, 0)
        self.assertEqual(self.estado("banco real"), "não verificável · ⚠️ manifest.json ilegível")
        self.assertEqual(self.estado("código"), "não verificável · ⚠️ manifest.json não contém um objeto JSON")
        self.assertEqual(self.estado("regras de negócio"), "não verificável · ⚠️ manifest.json ilegível")

    def test_code_and_rules_follow_the_commit_and_database_follows_the_age(self):
        self.fresh("supabase", minutes_ago=180, commit="b" * 40)
        self.fresh("codigo", minutes_ago=4320)
        self.fresh("regras", minutes_ago=1, commit="b" * 40)
        self.assertEqual(self.run_index().returncode, 0)
        self.assertEqual(self.estado("código"), "ok · 72h atrás")
        self.assertRegex(self.estado("banco real"), r"^desatualizado · 3h atrás · ⚠️ desatualizado há 3h0\d$")
        self.assertRegex(self.estado("regras de negócio"), r"^desatualizado · [0-2] min atrás · ⚠️ gerado no commit `bbbbbbb`, HEAD é `aaaaaaa`$")

    def test_stale_limit_is_configurable(self):
        self.fresh("supabase", minutes_ago=30)
        self.assertEqual(self.run_index("--stale-min", "10", fontes=FONTES[:1]).returncode, 0)
        self.assertTrue(self.estado("banco real").startswith("desatualizado · "))

    def test_collection_failures_make_the_source_partial(self):
        (self.fresh("supabase") / "errors.md").write_text("# Erros\n\n| Seção | Erro |\n|---|---|\n| functions | timeout |\n| cron | negado |\n", encoding="utf-8")
        self.fresh("codigo", erros_do_gerador=["rotas"])
        self.fresh("regras", carried=["x"])
        self.assertEqual(self.run_index().returncode, 0)
        self.assertRegex(self.estado("banco real"), r"^parcial · \d min atrás · ⚠️ 2 seção\(ões\) com erro em errors\.md$")
        self.assertRegex(self.estado("código"), r"^parcial · \d min atrás · ⚠️ 1 erro\(s\) de coleta no manifest \(erros_do_gerador\)$")
        self.assertRegex(self.estado("regras de negócio"), r"^parcial · \d min atrás · ⚠️ seções reaproveitadas da coleta anterior$")

    def test_error_report_without_rows_keeps_the_source_ok(self):
        (self.fresh("supabase") / "errors.md").write_text("# Erros\n\n_nenhum_\n", encoding="utf-8")
        self.assertEqual(self.run_index(fontes=FONTES[:1]).returncode, 0)
        self.assertTrue(self.estado("banco real").startswith("ok · "))


class WritingTests(IndexFixture):
    def test_only_structural_changes_rewrite_the_index(self):
        self.fresh("supabase", minutes_ago=3)
        self.assertEqual(self.run_index(fontes=FONTES[:1]).returncode, 0)
        original = self.out.read_text(encoding="utf-8")
        self.fresh("supabase", minutes_ago=40)  # só a idade muda
        second = self.run_index(fontes=FONTES[:1])
        self.assertEqual(second.returncode, 0)
        self.assertIn("sem mudança estrutural", second.stderr)
        self.assertEqual(self.out.read_text(encoding="utf-8"), original)
        self.fresh("supabase", minutes_ago=200)  # passou do limite: o estado muda
        self.assertEqual(self.run_index(fontes=FONTES[:1]).returncode, 0)
        self.assertTrue(self.estado("banco real").startswith("desatualizado · "))

    def test_usage_errors_exit_2_and_write_nothing(self):
        self.fresh("regras")
        cases = {"sem --fonte": (), "sem '='": ("regras",), "nome repetido": ("regras de negócio=docs/contexto/regras", "regras de negócio=docs/contexto/codigo"),
                 "caminho vazio": ("regras de negócio=",)}
        for label, fontes in cases.items():
            with self.subTest(label):
                result = self.run_index(fontes=fontes)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("[indice]", result.stderr)
                self.assertFalse(self.out.exists())

    def test_source_published_in_another_branch_is_described_not_invented(self):
        self.assertEqual(self.run_index(fontes=("banco real=docs/contexto/supabase@contexto",)).returncode, 0)
        document = self.out.read_text(encoding="utf-8")
        self.assertIn("git fetch origin contexto && git show origin/contexto:docs/contexto/supabase/<arquivo>", document)
        self.assertIn("https://raw.githubusercontent.com/owner/repo/contexto/docs/contexto/supabase/<arquivo>", document)
        self.assertEqual(self.estado("banco real"), "não disponível neste checkout")

    def test_usage_text_names_paths_that_exist_in_this_repository(self):
        repo = SCRIPT.resolve().parents[2]
        self.assertNotIn("scripts/ai_context", indice.__doc__)
        for path in re.findall(r"scripts/[\w/.-]+\.py", indice.__doc__):
            self.assertTrue((repo / path).is_file(), path)


if __name__ == "__main__":
    unittest.main()
