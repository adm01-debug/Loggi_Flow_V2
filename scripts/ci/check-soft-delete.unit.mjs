// Teste do gate de exclusão lógica (scripts/ci/check-soft-delete.mjs).
// Cada caso monta um repositório sintético (src/ + types.ts) num diretório temporário e roda o CLI como
// subprocesso: o contrato é a saída e o código de saída.
// Rodar: node --test scripts/ci/check-soft-delete.unit.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-soft-delete.mjs");
const temporarios = [];
after(() => {
  for (const dir of temporarios) fs.rmSync(dir, { recursive: true, force: true });
});

const TIPOS = `export type Database = {
  public: {
    Tables: {
      entregas: {
        Row: {
          id: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
        }
        Update: {
          deleted_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
        }
        Insert: {
          deleted_at?: string | null
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_entregas_ativas: {
        Row: {
          id: string
          deleted_at: string | null
        }
      }
    }
  }
}
`;

const TIPOS_PATH = "src/integrations/supabase/types.ts";

// arquivos: { "src/pages/X.tsx": "conteudo" }; types.ts é incluído por padrão.
function repo(arquivos = {}, { semTipos = false } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "soft-delete-"));
  temporarios.push(raiz);
  const tudo = semTipos ? arquivos : { [TIPOS_PATH]: TIPOS, ...arquivos };
  for (const [rel, conteudo] of Object.entries(tudo)) {
    const destino = path.join(raiz, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, conteudo);
  }
  return raiz;
}

function run(raiz, ...extras) {
  return spawnSync(process.execPath, [SCRIPT, "--root", raiz, ...extras], { encoding: "utf8" });
}

test("cadeia limpa em tabela com deleted_at passa", () => {
  const raiz = repo({ "src/pages/A.tsx": 'await supabase.from("entregas").update({ deleted_at: new Date().toISOString() });\n' });
  const r = run(raiz);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /OK/);
});

test(".delete() em linha unica numa tabela com deleted_at falha com arquivo e linha", () => {
  const raiz = repo({ "src/pages/A.tsx": 'export const x = (supabase: any) => supabase.from("entregas").delete();\n' });
  const r = run(raiz);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /src\/pages\/A\.tsx:1/);
  assert.match(r.stderr, /entregas/);
});

test(".delete() em cadeia multilinha tambem falha", () => {
  const raiz = repo({
    "src/hooks/useEntregas.ts": 'const q = supabase\n      .from("entregas")\n      .delete()\n      .eq("id", id);\n',
  });
  const r = run(raiz);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /src\/hooks\/useEntregas\.ts:2/);
});

test("deleted_at so no Insert nao torna a tabela alvo do gate", () => {
  const raiz = repo({ "src/pages/B.tsx": 'await supabase.from("audit_logs").delete().eq("id", id);\n' });
  const r = run(raiz);
  assert.equal(r.status, 0, r.stderr);
});

test("delete em tabela fora da secao Tables (view) nao e reprovado", () => {
  const raiz = repo({ "src/pages/C.tsx": 'await supabase.from("v_entregas_ativas").delete();\n' });
  const r = run(raiz);
  assert.equal(r.status, 0, r.stderr);
});

test("arquivo de teste e ignorado", () => {
  const raiz = repo({ "src/pages/A.test.tsx": 'await supabase.from("entregas").delete();\n' });
  const r = run(raiz);
  assert.equal(r.status, 0, r.stderr);
});

test("--json lista so as tabelas da secao Tables e as violacoes", () => {
  const raiz = repo({ "src/pages/A.tsx": 'await supabase.from("entregas").delete();\n' });
  const r = run(raiz, "--json");
  assert.equal(r.status, 1);
  const saida = JSON.parse(r.stdout);
  assert.deepEqual(saida.tabelasComDeletedAt, ["entregas"]);
  assert.deepEqual(saida.violacoes, [{ arquivo: "src/pages/A.tsx", linha: 1, tabela: "entregas" }]);
});

test("sem types.ts o gate avisa e nao aprova", () => {
  const raiz = repo({ "src/pages/A.tsx": 'await supabase.from("entregas").delete();\n' }, { semTipos: true });
  const r = run(raiz);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /não encontrado/);
});

test("delete depois de ponto e virgula dentro de string nao escapa", () => {
  const raiz = repo({ "src/pages/D.tsx": 'await supabase.from("entregas").delete().eq("nome", "a; b").select("x; y");\n' });
  const r = run(raiz);
  assert.equal(r.status, 1, r.stderr);
});
