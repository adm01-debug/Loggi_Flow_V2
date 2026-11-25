// Teste do gate de fatos do AGENTS.md (scripts/ci/check-agents-facts.mjs).
// Cada caso monta um repositorio sintetico (AGENTS.md + baseline + migrations + workflows) e roda o CLI
// como subprocesso: o contrato e a saida e o codigo de saida.
// Rodar: node --test scripts/ci/check-agents-facts.unit.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "check-agents-facts.mjs",
);
const temporarios = [];
after(() => {
  for (const dir of temporarios)
    fs.rmSync(dir, { recursive: true, force: true });
});

const BASELINE = {
  branch_protection_main: {
    required_status_checks: ["Lint", "Type Check", "quality-gate"],
  },
};

function repo({ agents, migrations = 3, workflows = ["ci-nexus.yml"] }) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "agents-facts-"));
  temporarios.push(raiz);
  fs.writeFileSync(path.join(raiz, "AGENTS.md"), agents);
  fs.mkdirSync(path.join(raiz, "scripts", "ci"), { recursive: true });
  fs.writeFileSync(
    path.join(raiz, "scripts", "ci", "github-settings-baseline.json"),
    JSON.stringify(BASELINE),
  );
  fs.mkdirSync(path.join(raiz, "supabase", "migrations"), { recursive: true });
  for (let i = 0; i < migrations; i += 1) {
    fs.writeFileSync(
      path.join(raiz, "supabase", "migrations", `20260101${i}_teste.sql`),
      "",
    );
  }
  fs.mkdirSync(path.join(raiz, ".github", "workflows"), { recursive: true });
  for (const nome of workflows)
    fs.writeFileSync(path.join(raiz, ".github", "workflows", nome), "");
  return raiz;
}

function rodar(raiz) {
  const r = spawnSync(process.execPath, [SCRIPT, "--root", raiz], {
    encoding: "utf8",
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

const CERTO =
  "Mergeie quando os 3 required checks estiverem verdes.\nAs migrations (hoje **3** em 2026-11-25).\nCI em `.github/workflows/ci-nexus.yml`.\n";

test("fatos conferidos passam", () => {
  const r = rodar(repo({ agents: CERTO }));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /agents-facts] OK: 3 required checks e 3 migrations/);
});

test("numero de required checks divergente reprova", () => {
  const r = rodar(
    repo({ agents: CERTO.replace("os 3 required", "os 9 required") }),
  );
  assert.equal(r.code, 1);
  assert.match(r.out, /diz "os 9 required checks", mas .*lista 3/);
});

test("contagem de migrations divergente reprova", () => {
  const r = rodar(repo({ agents: CERTO, migrations: 5 }));
  assert.equal(r.code, 1);
  assert.match(r.out, /diz 3 migrations .*ha 5 arquivos/);
});

test("workflow citado que nao existe reprova", () => {
  const r = rodar(
    repo({ agents: `${CERTO}\nVeja \`.github/workflows/fantasma.yml\`.\n` }),
  );
  assert.equal(r.code, 1);
  assert.match(r.out, /fantasma\.yml, que nao existe/);
});

test("frase removida do AGENTS.md reprova em vez de passar em silencio", () => {
  const r = rodar(repo({ agents: "Nada afirmado.\n" }));
  assert.equal(r.code, 1);
  assert.match(r.out, /nao afirma mais "os N required checks"/);
  assert.match(r.out, /nao afirma mais a contagem de migrations/);
});
