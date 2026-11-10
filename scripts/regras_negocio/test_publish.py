"""Regressões offline do publish.sh: só repositórios git locais (um bare faz de `origin`); nunca toca remoto real."""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("publish.sh")
OUT = "docs/contexto/regras"
GENERATOR = """#!/usr/bin/env bash
# gerador de mentira: a saída depende do código, como no gerador real
set -e
[ -f gen.fail ] && { echo "gerador quebrado" >&2; exit 3; }
mkdir -p docs/contexto/regras
echo "regras de $(cat src/a.txt)" > docs/contexto/regras/07.md
echo '{"commit": "x"}' > docs/contexto/regras/manifest.json
"""


@unittest.skipUnless(shutil.which("git") and shutil.which("bash"), "precisa de git e bash")
class PublishFixture(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="context-publish-")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.origin = self.base / "origin.git"
        self.work = self.base / "work"
        # sem config global/sistema e sem identidade: o script tem de se virar sozinho
        self.env = {"PATH": os.environ.get("PATH", ""), "HOME": str(self.base), "GIT_CONFIG_GLOBAL": os.devnull,
                    "GIT_CONFIG_SYSTEM": os.devnull, "GIT_TERMINAL_PROMPT": "0", "LC_ALL": "C"}
        self.dev = {**self.env, "GIT_AUTHOR_NAME": "dev", "GIT_AUTHOR_EMAIL": "dev@example.com",
                    "GIT_COMMITTER_NAME": "dev", "GIT_COMMITTER_EMAIL": "dev@example.com"}
        self.git("init", "-q", "--bare", "-b", "main", str(self.origin), cwd=self.base)
        self.git("clone", "-q", str(self.origin), str(self.work), cwd=self.base)
        self.write("src/a.txt", "v1\n")
        self.write("AGENTS.md", "# regras do dono\n")
        self.write(f"{OUT}/manual/README.md", "regras humanas\n")
        self.write("gen.sh", GENERATOR)
        self.commit_and_push("feat: base")
        self.generate()

    def git(self, *args, cwd=None, check=True):
        result = subprocess.run(["git", *args], cwd=cwd or self.work, env=self.dev, capture_output=True, text=True, timeout=60)
        if check and result.returncode != 0:
            raise AssertionError(f"git {' '.join(args)} falhou: {result.stderr}")
        return result.stdout.strip()

    def write(self, name, content, repo=None):
        path = (repo or self.work) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def commit_and_push(self, message, branch="main"):
        self.git("add", "-A", ".", ":!docs/contexto/regras/07.md", ":!docs/contexto/regras/manifest.json")
        self.git("commit", "-q", "-m", message)
        self.git("push", "-q", "origin", f"HEAD:refs/heads/{branch}")

    def generate(self, cwd=None):
        subprocess.run(["bash", "gen.sh"], cwd=cwd or self.work, env=self.dev, check=True, capture_output=True, timeout=30)

    def publish(self, cwd=None, **variables):
        return subprocess.run(["bash", str(SCRIPT)], cwd=cwd or self.work, env={**self.env, **variables},
                              capture_output=True, text=True, timeout=120)

    def remote(self, *args):
        return self.git(*args, cwd=self.origin)

    def remote_branches(self):
        return set(self.remote("for-each-ref", "--format=%(refname:short)", "refs/heads").split())

    def published_files(self, branch="contexto"):
        return set(self.remote("ls-tree", "-r", "--name-only", branch).split("\n"))

    def other_producer_publishes(self, clone_name="outro"):
        """Outro produtor grava docs/contexto/codigo na branch derivada, por fora deste script."""
        clone = self.base / clone_name
        if not clone.exists():
            self.git("clone", "-q", str(self.origin), str(clone), cwd=self.base)
        self.git("fetch", "-q", "origin", "contexto", cwd=clone)
        self.git("checkout", "-q", "-B", "contexto", "FETCH_HEAD", cwd=clone)
        self.write("docs/contexto/codigo/INDEX.md", "codigo\n", repo=clone)
        self.git("add", "-A", cwd=clone)
        self.git("commit", "-q", "-m", "chore: codigo", cwd=clone)
        self.git("push", "-q", "origin", "contexto", cwd=clone)
        return clone


class DerivedBranchTests(PublishFixture):
    """MODE=branch (default): a branch gerada recebe a saída; a branch padrão nunca é escrita."""

    def setUp(self):
        super().setUp()
        self.main_before = self.remote("rev-parse", "main")
        self.addCleanup(lambda: self.assertEqual(self.remote("rev-parse", "main"), self.main_before, "a main do remoto foi alterada"))

    def test_defaults_publish_the_rules_folder_to_the_generated_branch(self):
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("publicado em contexto", result.stdout)
        self.assertEqual(self.remote_branches(), {"main", "contexto"})
        self.assertLessEqual({f"{OUT}/07.md", f"{OUT}/manifest.json", f"{OUT}/manual/README.md"}, self.published_files())
        self.assertEqual(self.remote("show", f"contexto:{OUT}/07.md"), "regras de v1")
        self.assertEqual(self.remote("rev-parse", "contexto^"), self.main_before)
        self.assertEqual(self.remote("log", "-1", "--format=%an <%ae>|%s", "contexto"),
                         "ai-context-bot <ai-context-bot@users.noreply.github.com>|chore(ai-context): atualiza contexto para agentes [skip ci]")

    def test_checkout_is_left_as_it_was(self):
        self.write("src/a.txt", "v1 com edição local\n")
        self.write("AGENTS.md", "# regras do dono\nedição local não commitada\n")
        self.write("solto.txt", "não rastreado\n")
        self.generate()
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.git("rev-parse", "--abbrev-ref", "HEAD"), "main")
        self.assertEqual(self.git("rev-parse", "HEAD"), self.main_before)
        self.assertEqual((self.work / "AGENTS.md").read_text(encoding="utf-8"), "# regras do dono\nedição local não commitada\n")
        self.assertEqual((self.work / "src/a.txt").read_text(encoding="utf-8"), "v1 com edição local\n")
        self.assertTrue((self.work / "solto.txt").exists())
        self.assertEqual((self.work / OUT / "07.md").read_text(encoding="utf-8"), "regras de v1 com edição local\n")
        self.assertEqual(self.git("diff", "--cached", "--name-only"), "")
        self.assertEqual(self.git("config", "--local", "--get", "user.name", check=False), "")
        # edição local do AGENTS.md não vaza para a branch publicada
        self.assertEqual(self.remote("show", "contexto:AGENTS.md"), "# regras do dono")

    def test_second_run_without_changes_publishes_nothing(self):
        self.assertEqual(self.publish().returncode, 0)
        published = self.remote("rev-parse", "contexto")
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("nada a publicar", result.stdout)
        self.assertEqual(self.remote("rev-parse", "contexto"), published)

    def test_new_source_commit_republishes_on_top_of_it(self):
        self.assertEqual(self.publish().returncode, 0)
        self.write("src/a.txt", "v2\n")
        self.commit_and_push("feat: v2")
        self.main_before = self.remote("rev-parse", "main")
        self.generate()
        self.assertEqual(self.publish().returncode, 0)
        self.assertEqual(self.remote("show", f"contexto:{OUT}/07.md"), "regras de v2")
        self.assertEqual(self.remote("rev-parse", "contexto^"), self.main_before)

    def test_other_producers_folders_are_kept_even_in_a_single_branch_clone(self):
        self.assertEqual(self.publish().returncode, 0)
        self.other_producer_publishes()
        single = self.base / "single"
        self.git("clone", "-q", "--single-branch", "--branch", "main", str(self.origin), str(single), cwd=self.base)
        self.write("src/a.txt", "v2\n", repo=single)
        self.generate(cwd=single)
        result = self.publish(cwd=single, KEEP_DIRS="docs/contexto/codigo docs/contexto/supabase")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("docs/contexto/codigo/INDEX.md", self.published_files())
        self.assertEqual(self.remote("show", f"contexto:{OUT}/07.md"), "regras de v2")

    def test_concurrent_publication_is_not_overwritten(self):
        self.assertEqual(self.publish().returncode, 0)
        clone = self.other_producer_publishes()
        self.write("docs/contexto/codigo/INDEX.md", "codigo novo\n", repo=clone)
        self.git("commit", "-q", "-am", "chore: codigo novo", cwd=clone)
        # o outro produtor publica depois do nosso fetch e antes do nosso push (hook pre-push, só na 1ª vez)
        hook = self.work / ".git/hooks/pre-push"
        hook.write_text(f"#!/bin/sh\n[ -f '{self.base}/corrida' ] && exit 0\ntouch '{self.base}/corrida'\n"
                        f"unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE\ngit -C '{clone}' push -q origin contexto\n", encoding="utf-8")
        hook.chmod(0o755)
        self.write("src/a.txt", "v2\n")
        self.generate()
        result = self.publish(KEEP_DIRS="docs/contexto/codigo", GIT_AUTHOR_NAME="dev", GIT_AUTHOR_EMAIL="dev@example.com",
                              GIT_COMMITTER_NAME="dev", GIT_COMMITTER_EMAIL="dev@example.com")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("tentativa 1 de 3", result.stderr)
        self.assertEqual(self.remote("show", "contexto:docs/contexto/codigo/INDEX.md"), "codigo novo")
        self.assertEqual(self.remote("show", f"contexto:{OUT}/07.md"), "regras de v2")

    def test_push_failure_gives_up_after_three_attempts_and_restores_the_checkout(self):
        self.assertEqual(self.publish().returncode, 0)
        published = self.remote("rev-parse", "contexto")
        hook = self.work / ".git/hooks/pre-push"
        hook.write_text("#!/bin/sh\necho 'remote: recusado pelo servidor' >&2\nexit 1\n", encoding="utf-8")
        hook.chmod(0o755)
        self.write("src/a.txt", "v2\n")
        self.generate()
        result = self.publish()
        self.assertEqual(result.returncode, 1)
        self.assertIn("após 3 tentativas", result.stderr)
        self.assertIn("recusado pelo servidor", result.stderr)
        self.assertEqual(self.remote("rev-parse", "contexto"), published)
        self.assertEqual(self.git("rev-parse", "--abbrev-ref", "HEAD"), "main")
        self.assertTrue((self.work / OUT / "07.md").exists())

    def test_unreadable_remote_is_a_failure_not_a_first_publication(self):
        self.assertEqual(self.publish().returncode, 0)
        self.other_producer_publishes()
        published = self.remote("rev-parse", "contexto")
        result = self.publish(KEEP_DIRS="docs/contexto/codigo", PUSH_URL="https://bot:s3cr3t-token@127.0.0.1:9/owner/repo.git")
        self.assertEqual(result.returncode, 1)
        self.assertIn("não foi possível ler contexto no remoto", result.stderr)
        self.assertNotIn("s3cr3t-token", result.stdout + result.stderr)
        self.assertEqual(self.remote("rev-parse", "contexto"), published)

    def test_push_url_is_used_for_reading_and_writing(self):
        # CI com persist-credentials: false: `origin` não enxerga o repo, só a URL com token
        self.assertEqual(self.publish().returncode, 0)
        self.other_producer_publishes()
        self.git("remote", "set-url", "origin", str(self.base / "sem-acesso.git"))
        self.write("src/a.txt", "v2\n")
        self.generate()
        result = self.publish(KEEP_DIRS="docs/contexto/codigo", PUSH_URL=str(self.origin))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("docs/contexto/codigo/INDEX.md", self.published_files())
        self.assertEqual(self.remote("show", f"contexto:{OUT}/07.md"), "regras de v2")

    def test_missing_generator_output_fails_closed(self):
        self.assertEqual(self.publish().returncode, 0)
        published = self.remote("rev-parse", "contexto")
        (self.work / OUT / "manifest.json").unlink()
        (self.work / OUT / "07.md").unlink()
        (self.work / "vazio").mkdir()
        for label, variables in {"só manual/": {}, "pasta vazia": {"OUT_DIR": "vazio"}, "pasta inexistente": {"OUT_DIR": "nao/existe"}}.items():
            with self.subTest(label):
                result = self.publish(**variables)
                self.assertEqual(result.returncode, 1)
                self.assertIn("manifest.json não existe — rode o gerador antes", result.stderr)
                self.assertIn("scripts/regras_negocio/generate.py", result.stderr)
                self.assertEqual(self.remote("rev-parse", "contexto"), published)

    def test_invalid_usage_exits_2_before_touching_anything(self):
        cases = {"MODE desconhecido": {"MODE": "brnach"}, "BRANCH_OUT=main": {"BRANCH_OUT": "main"}, "BRANCH_OUT=master": {"BRANCH_OUT": "master"}}
        for label, variables in cases.items():
            with self.subTest(label):
                result = self.publish(**variables)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("Nada foi publicado.", result.stderr)
                self.assertEqual(self.remote_branches(), {"main"})
                self.assertEqual(self.git("rev-parse", "--abbrev-ref", "HEAD"), "main")
        outside = self.publish(cwd=self.base)
        self.assertEqual(outside.returncode, 2)
        self.assertIn("não é um repositório git", outside.stderr)

    def test_source_branch_is_never_the_output_branch(self):
        self.git("checkout", "-q", "-b", "feature")
        result = self.publish(BRANCH_OUT="feature")
        self.assertEqual(result.returncode, 2)
        self.assertEqual(self.remote_branches(), {"main"})

    def test_foreign_staged_change_blocks_publication(self):
        self.write("src/a.txt", "v2\n")
        self.git("add", "src/a.txt")
        result = self.publish()
        self.assertEqual(result.returncode, 1)
        self.assertIn("alteração staged fora da saída gerada: src/a.txt", result.stderr)
        self.assertEqual(self.remote_branches(), {"main"})
        self.assertEqual(self.git("diff", "--cached", "--name-only"), "src/a.txt")

    def test_dry_run_shows_what_would_go_and_pushes_nothing(self):
        result = self.publish(DRY_RUN="1")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("DRY_RUN: publicaria", result.stdout)
        self.assertIn(f"{OUT}/07.md", result.stdout)
        self.assertEqual(self.remote_branches(), {"main"})
        self.assertEqual(self.git("rev-parse", "--abbrev-ref", "HEAD"), "main")

    def test_runs_from_a_subdirectory_and_from_detached_head(self):
        self.git("checkout", "-q", "--detach", "HEAD")
        result = self.publish(cwd=self.work / "src")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f"{OUT}/07.md", self.published_files())
        self.assertEqual(self.git("rev-parse", "--abbrev-ref", "HEAD"), "HEAD")
        self.assertEqual(self.git("rev-parse", "HEAD"), self.main_before)

    def test_index_command_output_is_published_and_its_failure_aborts(self):
        result = self.publish(INDEX_CMD="echo indice > docs/contexto/00-INDEX.md")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.remote("show", "contexto:docs/contexto/00-INDEX.md"), "indice")
        published = self.remote("rev-parse", "contexto")
        self.write("src/a.txt", "v2\n")
        self.generate()
        failed = self.publish(INDEX_CMD="exit 7")
        self.assertEqual(failed.returncode, 1)
        self.assertIn("INDEX_CMD falhou", failed.stderr)
        self.assertEqual(self.remote("rev-parse", "contexto"), published)

    def test_pointer_files_are_published_only_when_asked(self):
        self.write("AGENTS.md", "# regras do dono\nponteiro do gerador\n")
        result = self.publish(POINTER_FILES="CLAUDE.md AGENTS.md")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.remote("show", "contexto:AGENTS.md"), "# regras do dono\nponteiro do gerador")
        self.assertEqual((self.work / "AGENTS.md").read_text(encoding="utf-8"), "# regras do dono\n")

    def test_custom_author_identity_is_used_without_touching_repo_config(self):
        result = self.publish(GIT_USER_NAME="contexto[bot]", GIT_USER_EMAIL="bot@example.com")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.remote("log", "-1", "--format=%an <%ae> / %cn <%ce>", "contexto"), "contexto[bot] <bot@example.com> / contexto[bot] <bot@example.com>")
        self.assertEqual(self.git("config", "--local", "--get", "user.email", check=False), "")


class DirectPushTests(PublishFixture):
    """MODE=push/pr: só em branch que não é a padrão."""

    def test_push_to_default_or_conventional_branches_is_refused(self):
        main_before = self.remote("rev-parse", "main")
        for label, variables in {"branch atual = main": {}, "BRANCH=main": {"BRANCH": "main"}, "BRANCH=master": {"BRANCH": "master"}, "BRANCH=develop": {"BRANCH": "develop"}}.items():
            with self.subTest(label):
                result = self.publish(MODE="push", **variables)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("MODE=push não escreve em", result.stderr)
                self.assertEqual(self.remote_branches(), {"main"})
                self.assertEqual(self.remote("rev-parse", "main"), main_before)
                self.assertEqual(self.git("rev-parse", "HEAD"), main_before)

    def test_remote_default_branch_with_another_name_is_also_refused(self):
        self.git("checkout", "-q", "-b", "trunk")
        self.git("push", "-q", "origin", "trunk")
        self.git("symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/trunk")
        result = self.publish(MODE="push")
        self.assertEqual(result.returncode, 2)
        self.assertEqual(self.remote("rev-parse", "trunk"), self.remote("rev-parse", "main"))

    def test_detached_head_without_branch_is_a_usage_error(self):
        self.git("checkout", "-q", "--detach", "HEAD")
        result = self.publish(MODE="push")
        self.assertEqual(result.returncode, 2)
        self.assertIn("HEAD destacado", result.stderr)

    def feature(self):
        self.git("checkout", "-q", "-b", "docs-sync")
        self.git("push", "-q", "-u", "origin", "docs-sync")

    def test_push_to_a_feature_branch_commits_only_the_output(self):
        self.feature()
        main_before = self.remote("rev-parse", "main")
        result = self.publish(MODE="push")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.remote("rev-parse", "main"), main_before)
        self.assertEqual(set(self.remote("diff", "--name-only", "main", "docs-sync").split()), {f"{OUT}/07.md", f"{OUT}/manifest.json"})
        again = self.publish(MODE="push")
        self.assertEqual(again.returncode, 0)
        self.assertIn("nada a commitar", again.stdout)

    def test_remote_ahead_is_rebased_and_regenerated_before_pushing(self):
        self.feature()
        other = self.base / "colega"
        self.git("clone", "-q", "--branch", "docs-sync", str(self.origin), str(other), cwd=self.base)
        self.write("src/a.txt", "v2 do colega\n", repo=other)
        self.git("commit", "-q", "-am", "feat: v2 do colega", cwd=other)
        self.git("push", "-q", "origin", "docs-sync", cwd=other)
        result = self.publish(MODE="push", GEN_CMD="bash gen.sh")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("tentativa 1", result.stdout)
        self.assertEqual(self.remote("show", f"docs-sync:{OUT}/07.md"), "regras de v2 do colega")
        self.assertEqual(self.remote("log", "--format=%s", "-2", "docs-sync").split("\n"),
                         ["chore(ai-context): atualiza contexto para agentes [skip ci]", "feat: v2 do colega"])

    def test_failing_generator_after_rebase_stops_with_a_clear_error(self):
        self.feature()
        other = self.base / "colega"
        self.git("clone", "-q", "--branch", "docs-sync", str(self.origin), str(other), cwd=self.base)
        self.write("gen.fail", "x\n", repo=other)
        self.git("add", "-A", cwd=other)
        self.git("commit", "-q", "-m", "feat: quebra o gerador", cwd=other)
        self.git("push", "-q", "origin", "docs-sync", cwd=other)
        before = self.remote("rev-parse", "docs-sync")
        result = self.publish(MODE="push", GEN_CMD="bash gen.sh")
        self.assertEqual(result.returncode, 1)
        self.assertIn("GEN_CMD falhou ao regenerar após o rebase", result.stderr)
        self.assertEqual(self.remote("rev-parse", "docs-sync"), before)

    def test_default_generator_command_points_to_this_repository(self):
        text = SCRIPT.read_text(encoding="utf-8")
        repo = SCRIPT.resolve().parents[2]
        self.assertNotIn("scripts/ai_context", text)
        self.assertNotIn("docs/ai-context", text)
        self.assertIn('GEN_CMD="${GEN_CMD:-python3 scripts/regras_negocio/generate.py --repo . --out $OUT_DIR --profile regras --no-pointer}"', text)
        self.assertTrue((repo / "scripts/regras_negocio/generate.py").is_file())

    def test_dry_run_in_push_mode_leaves_no_commit_and_nothing_staged(self):
        self.feature()
        head = self.git("rev-parse", "HEAD")
        result = self.publish(MODE="push", DRY_RUN="1")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("DRY_RUN: commitaria em docs-sync", result.stdout)
        self.assertEqual(self.git("rev-parse", "HEAD"), head)
        self.assertEqual(self.git("diff", "--cached", "--name-only"), "")
        self.assertEqual(self.remote("rev-parse", "docs-sync"), head)

    def test_script_passes_bash_syntax_check(self):
        result = subprocess.run(["bash", "-n", str(SCRIPT)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
