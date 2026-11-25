// Teste do gate de caminhos citados na documentacao (scripts/ci/check-doc-paths.mjs).
// Cada caso monta um repositorio sintetico (AGENTS.md + docs/agentes/) e roda o CLI como subprocesso:
// o contrato e a saida e o codigo de saida.
// Rodar: node --test scripts/ci/check-doc-paths.unit.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "check-doc-paths.mjs",
);
const temporarios = [];
after(() => {
  for (const dir of temporarios)
    fs.rmSync(dir, { recursive: true, force: true });
});

function repo(arquivos) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "doc-paths-"));
  temporarios.push(raiz);
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    const destino = path.join(raiz, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, conteudo);
  }
  return raiz;
}

function rodar(raiz) {
  const r = spawnSync(process.execPath, [SCRIPT, "--root", raiz], {
    encoding: "utf8",
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

test("caminho citado que existe passa", () => {
  const raiz = repo({
    "AGENTS.md": "Leia `src/App.tsx` e `supabase/config.toml`.\n",
    "src/App.tsx": "",
    "supabase/config.toml": "",
  });
  const r = rodar(raiz);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /doc-paths] OK/);
});

test("caminho citado que nao existe reprova e diz onde", () => {
  const raiz = repo({
    "AGENTS.md": "O hook fica em `src/hooks/fantasma.ts`.\n",
    "src/App.tsx": "",
  });
  const r = rodar(raiz);
  assert.equal(r.code, 1);
  assert.match(r.out, /AGENTS\.md:1/);
  assert.match(r.out, /fantasma\.ts/);
});

test("linha que declara o alvo inexistente fica isenta", () => {
  const raiz = repo({
    "AGENTS.md": "`src/hooks/antigo.ts` nao existe mais, use o hook novo.\n",
  });
  assert.equal(rodar(raiz).code, 0);
});

test("sufixo :linha e validado contra o arquivo, nao contra o nome composto", () => {
  const raiz = repo({
    "docs/agentes/rotas.md":
      "Rota em `src/App.tsx:153-160` e em `src/App.tsx:154`.\n",
    "src/App.tsx": "",
  });
  assert.equal(rodar(raiz).code, 0);
});

test("varre docs/agentes/*.md e aceita repo sem essa pasta", () => {
  const comPasta = repo({
    "docs/agentes/banco.md": "Tipos em `src/integrations/supabase/types.ts`.\n",
    "src/integrations/supabase/types.ts": "",
  });
  assert.equal(rodar(comPasta).code, 0);

  const semPasta = repo({ "AGENTS.md": "Nada a conferir.\n" });
  const r = rodar(semPasta);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /1 documentos/);
});

test("glob e placeholder nao sao tratados como caminho literal", () => {
  const raiz = repo({
    "AGENTS.md": "Rode `scripts/ci/*.mjs` e `src/<feature>/index.ts`.\n",
  });
  assert.equal(rodar(raiz).code, 0);
});
