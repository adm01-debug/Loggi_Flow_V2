// Teste do guarda do perimetro do GitHub (scripts/ci/github-settings-guard.mjs).
// O guard roda como subprocesso, igual ao workflow, com `fetch` trocado por um mock carregado via
// `node --import`: cada caso descreve as respostas da API por rota e confere exit code, log e as
// chamadas feitas (em especial as de ESCRITA). As respostas "ao vivo" abaixo sao copia do que a API
// devolveu para este repo em 2026-11-09. Nenhuma chamada de rede real; nenhum token real.
// Rodar: node --test scripts/ci/github-settings-guard.unit.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assinaturaDe, problemasDoBaseline } from "./github-settings-guard.mjs";

const GUARD = fileURLToPath(
  new URL("./github-settings-guard.mjs", import.meta.url),
);
const BASELINE = fileURLToPath(
  new URL("./github-settings-baseline.json", import.meta.url),
);
const baselineReal = () => JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const P = "/repos/adm01-debug/Loggi_Flow_V2";
const TITULO = "[settings-guard] perimeter regression detected";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "settings-guard-"));
after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// Mock de fetch: resolve a rota por "METODO caminho?query [@token]", do mais especifico ao mais
// generico; lista = uma resposta por chamada (a ultima se repete). Encurta as esperas do guard
// (setTimeout e AbortSignal.timeout) para o teste rodar em milissegundos.
const MOCK = path.join(TMP, "mock-fetch.mjs");
fs.writeFileSync(
  MOCK,
  `import fs from 'node:fs';
const { rotas } = JSON.parse(fs.readFileSync(process.env.MOCK_CENARIO, 'utf8'));
const vezes = new Map();
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  const metodo = init.method ?? 'GET';
  const token = String(init.headers?.Authorization ?? '').replace(/^Bearer /, '');
  fs.appendFileSync(process.env.MOCK_LOG, JSON.stringify({ metodo, caminho: u.pathname + u.search, token, body: init.body ? JSON.parse(init.body) : null }) + '\\n');
  const chaves = [metodo + ' ' + u.pathname + u.search, metodo + ' ' + u.pathname].flatMap((c) => [c + ' @' + token, c]);
  const chave = chaves.find((c) => rotas[c] !== undefined);
  let rota = chave === undefined ? { status: 599, body: { message: 'rota nao mockada: ' + chaves[1] } } : rotas[chave];
  if (Array.isArray(rota)) {
    const n = vezes.get(chave) ?? 0;
    vezes.set(chave, n + 1);
    rota = rota[Math.min(n, rota.length - 1)];
  }
  if (rota.rede) throw Object.assign(new TypeError('fetch failed'), { cause: { code: rota.rede } });
  if (rota.pendurar) {
    // Um socket de verdade segura o event loop; aqui quem segura e este intervalo (o timer do AbortSignal e unref).
    const vivo = setInterval(() => {}, 1000);
    return new Promise((_, rejeitar) => init.signal.addEventListener('abort', () => { clearInterval(vivo); rejeitar(init.signal.reason); }));
  }
  const status = rota.status ?? 200;
  const corpo = rota.texto ?? (rota.body === undefined ? '' : JSON.stringify(rota.body));
  return new Response(status === 204 ? null : corpo, { status, headers: rota.headers ?? {} });
};
const timeoutReal = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...resto) => timeoutReal(fn, Math.min(ms ?? 0, 2), ...resto);
const abortReal = AbortSignal.timeout.bind(AbortSignal);
AbortSignal.timeout = (ms) => abortReal(Math.min(ms, 100));
`,
);

// ------------------------------------------------------------------ respostas da API (copia do real)

const CHECKS = [
  "Security Scan",
  "Lint",
  "Type Check",
  "Warning Budget Gate",
  "Unit & Integration Tests",
  "Build Artifact",
  "quality-gate",
  "Security Audits",
  "Agents Docs Integrity",
  "Contratos da automação local",
];
const protecaoViva = () => ({
  required_status_checks: {
    strict: false,
    contexts: [...CHECKS],
    checks: CHECKS.map((context) => ({ context, app_id: 15368 })),
  },
  required_signatures: { enabled: false },
  enforce_admins: { enabled: false },
  required_linear_history: { enabled: false },
  allow_force_pushes: { enabled: false },
  allow_deletions: { enabled: false },
  block_creations: { enabled: false },
  required_conversation_resolution: { enabled: false },
  lock_branch: { enabled: false },
  allow_fork_syncing: { enabled: false },
});
// Fixture do repo como o GITHUB_TOKEN o ve. Espelha o baseline real (publico desde 2026-11-23).
const repoPublicoAoToken = () => ({
  id: 1235608521,
  full_name: "adm01-debug/Loggi_Flow_V2",
  private: false,
  visibility: "public",
  has_issues: true,
  default_branch: "main",
});
const repoVivo = () => ({
  ...repoPublicoAoToken(),
  allow_squash_merge: true,
  allow_merge_commit: true,
  allow_rebase_merge: true,
  allow_auto_merge: false,
  delete_branch_on_merge: false,
  squash_merge_commit_message: "COMMIT_MESSAGES",
  squash_merge_commit_title: "COMMIT_OR_PR_TITLE",
});
const AMBIENTES = [
  "banco-leitura",
  "copilot",
  "perimetro-leitura",
  "Preview",
  "producao-edge-functions",
  "Production",
];
const ambientes = (nomes = AMBIENTES, total = nomes.length) => ({
  total_count: total,
  environments: nomes.map((name) => ({ name })),
});
const negado = (doc) => ({
  status: 403,
  body: {
    message: "Resource not accessible by integration",
    documentation_url: `https://docs.github.com/rest/${doc}`,
    status: "403",
  },
});

/** Tudo legivel e igual ao baseline (token com leitura administrativa); sem issue aberta. */
const rotasAdmin = (por = {}) => ({
  [`GET ${P}/branches/main/protection`]: { body: protecaoViva() },
  [`GET ${P}`]: { body: repoVivo() },
  [`GET ${P}/actions/permissions`]: {
    body: {
      enabled: true,
      allowed_actions: "all",
      sha_pinning_required: false,
    },
  },
  [`GET ${P}/actions/permissions/workflow`]: {
    body: {
      default_workflow_permissions: "read",
      can_approve_pull_request_reviews: true,
    },
  },
  [`GET ${P}/rulesets`]: { body: [] },
  [`GET ${P}/environments`]: { body: ambientes() },
  [`GET ${P}/issues`]: { body: [] },
  [`POST ${P}/labels`]: { status: 201, body: { name: "settings-guard" } },
  [`POST ${P}/issues`]: { status: 201, body: { number: 200 } },
  ...por,
});

/** O que o GITHUB_TOKEN do workflow enxerga de verdade (run 42578699357 / issue #117). */
const rotasSoWorkflow = (por = {}) =>
  rotasAdmin({
    [`GET ${P}/branches/main/protection`]: negado(
      "branches/branch-protection#get-branch-protection",
    ),
    [`GET ${P}`]: { body: repoPublicoAoToken() },
    [`GET ${P}/actions/permissions`]: negado(
      "actions/permissions#get-github-actions-permissions-for-a-repository",
    ),
    [`GET ${P}/actions/permissions/workflow`]: negado(
      "actions/permissions#get-default-workflow-permissions-for-a-repository",
    ),
    [`GET ${P}/environments`]: negado(
      "deployments/environments#list-environments",
    ),
    ...por,
  });

const issueAberta = ({
  body = "",
  comments = 0,
  autor = "github-actions[bot]",
  haMs = 0,
} = {}) => ({
  number: 117,
  title: TITULO,
  user: { login: autor },
  body,
  comments,
  created_at: new Date(Date.now() - haMs).toISOString(),
});
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

let serie = 0;
function rodar({
  rotas = rotasAdmin(),
  env = {},
  args = [],
  guard = GUARD,
} = {}) {
  serie += 1;
  const cenario = path.join(TMP, `cenario-${serie}.json`);
  const log = path.join(TMP, `chamadas-${serie}.jsonl`);
  fs.writeFileSync(cenario, JSON.stringify({ rotas }));
  const r = spawnSync(
    process.execPath,
    ["--import", pathToFileURL(MOCK).href, guard, ...args],
    {
      cwd: TMP,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        GITHUB_TOKEN: "tok-workflow",
        ADMIN_READ_TOKEN: "tok-admin",
        GITHUB_REPOSITORY: "adm01-debug/Loggi_Flow_V2",
        GITHUB_RUN_ID: "777",
        MOCK_CENARIO: cenario,
        MOCK_LOG: log,
        ...env,
      },
    },
  );
  const chamadas = fs.existsSync(log)
    ? fs
        .readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : [];
  const escritas = chamadas.filter((c) => c.metodo !== "GET");
  return {
    status: r.status,
    out: r.stdout,
    err: r.stderr,
    tudo: `${r.stdout}${r.stderr}`,
    chamadas,
    escritas,
  };
}

const SO_WORKFLOW = { ADMIN_READ_TOKEN: "tok-workflow" };
const corpoDaIssue = (r) =>
  r.escritas.find(
    (c) =>
      c.metodo === "POST" &&
      (c.caminho === `${P}/issues` || c.caminho.endsWith("/comments")),
  )?.body.body ?? "";

/** Copia o guard para uma pasta temporaria ao lado de um baseline alterado (ou de um texto cru). */
function guardComBaseline(alterar) {
  serie += 1;
  const dir = path.join(TMP, `guard-${serie}`);
  fs.mkdirSync(dir);
  fs.copyFileSync(GUARD, path.join(dir, "github-settings-guard.mjs"));
  if (alterar !== null) {
    const conteudo =
      typeof alterar === "string"
        ? alterar
        : JSON.stringify(alterar(baselineReal()) ?? null, null, 2);
    fs.writeFileSync(path.join(dir, "github-settings-baseline.json"), conteudo);
  }
  return path.join(dir, "github-settings-guard.mjs");
}

// ------------------------------------------------------------------ baseline x realidade deste repo

test("baseline versionado bate com o perimetro canonico (docs/agentes/github-ci.md)", () => {
  const bl = baselineReal();
  assert.deepEqual(problemasDoBaseline(bl), { erros: [], avisos: [] });
  assert.deepEqual(bl.branch_protection_main.required_status_checks, CHECKS);
  assert.equal(bl.branch_protection_main.required_status_checks.length, 10);
  assert.equal(bl.branch_protection_main.strict, false);
  assert.equal(bl.branch_protection_main.enforce_admins, false);
  assert.equal(bl.branch_protection_main.required_pull_request_reviews, null);
  assert.equal(bl.branch_protection_main.allow_force_pushes, false);
  assert.equal(bl.branch_protection_main.allow_deletions, false);
  assert.equal(bl.repo.private, false);
  assert.deepEqual(bl.merge, {
    allow_squash_merge: true,
    allow_merge_commit: true,
    allow_rebase_merge: true,
    allow_auto_merge: false,
    delete_branch_on_merge: false,
    squash_merge_commit_message: "COMMIT_MESSAGES",
    squash_merge_commit_title: "COMMIT_OR_PR_TITLE",
  });
  assert.equal(bl.actions.allowed_actions, "all");
  assert.match(bl.medido_em, /^\d{4}-\d{2}-\d{2}$/);
});

test("a tabela canonica da doc lista os mesmos 10 required checks do baseline", () => {
  const doc = fs.readFileSync(
    new URL("../../docs/agentes/github-ci.md", import.meta.url),
    "utf8",
  );
  const linha = doc
    .split("\n")
    .find((l) => l.includes("Branch protection — required checks"));
  assert.ok(linha, "linha dos required checks nao encontrada na doc");
  const naDoc = [...linha.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  assert.deepEqual([...naDoc].sort(), [...CHECKS].sort());
});

// ------------------------------------------------------------------ entrada: token, repo, argumentos

test("GITHUB_TOKEN ausente ou vazio: exit 1 sem nenhuma chamada", () => {
  for (const GITHUB_TOKEN of [undefined, ""]) {
    const r = rodar({ env: { GITHUB_TOKEN } });
    assert.equal(r.status, 1);
    assert.match(r.err, /::error::GITHUB_TOKEN ausente/);
    assert.equal(r.chamadas.length, 0);
  }
});

test("GITHUB_REPOSITORY vazio cai no repo padrao; malformado da erro claro sem chamar a API", () => {
  const vazio = rodar({ env: { GITHUB_REPOSITORY: "" } });
  assert.equal(vazio.status, 0, vazio.tudo);
  assert.ok(vazio.chamadas.every((c) => c.caminho.startsWith(P)));
  for (const GITHUB_REPOSITORY of ["sem-barra", "a/b/c", "/repo", "dono/"]) {
    const r = rodar({ env: { GITHUB_REPOSITORY } });
    assert.equal(r.status, 1, GITHUB_REPOSITORY);
    assert.match(r.err, /::error::GITHUB_REPOSITORY invalido/);
    assert.equal(r.chamadas.length, 0);
  }
});

test("--help mostra o uso e nao chama a API; argumento desconhecido e erro (nao roda de verdade)", () => {
  const ajuda = rodar({ args: ["--help"] });
  assert.equal(ajuda.status, 0);
  assert.match(ajuda.out, /--dry-run/);
  assert.equal(ajuda.chamadas.length, 0);
  const typo = rodar({ args: ["--dryrun"] });
  assert.equal(typo.status, 1);
  assert.match(typo.err, /::error::Argumento desconhecido: --dryrun/);
  assert.equal(typo.chamadas.length, 0);
});

test("importar o modulo nao executa nada (sem token, sem rede)", () => {
  const r = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { assinaturaDe } from ${JSON.stringify(pathToFileURL(GUARD).href)}; console.log(typeof assinaturaDe);`,
    ],
    {
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "function");
});

// ------------------------------------------------------------------ perimetro OK

test("tudo igual ao baseline: exit 0, so leituras, leitura administrativa com o token dedicado", () => {
  const r = rodar();
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /Leitura administrativa: SETTINGS_GUARD_TOKEN/);
  for (const nome of [
    "branch protection",
    "merge/repo",
    "actions",
    "workflow permissions",
    "selected actions",
    "rulesets",
    "environments",
  ]) {
    assert.ok(
      r.out.includes(`${nome}: OK`),
      `${nome} deveria estar OK\n${r.out}`,
    );
  }
  assert.match(r.out, /✅ Perimetro OK/);
  assert.deepEqual(r.escritas, []);
  const adm = r.chamadas.filter((c) => !c.caminho.includes("/issues"));
  assert.ok(
    adm.every((c) => c.token === "tok-admin"),
    "leituras administrativas usam o PAT",
  );
  assert.equal(
    r.chamadas.find((c) => c.caminho.includes("/issues")).token,
    "tok-workflow",
    "issues usam o GITHUB_TOKEN",
  );
});

test("tudo OK com issue aberta: fecha a issue e comenta", () => {
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/issues`]: {
        body: [{ number: 5, title: "outra coisa" }, issueAberta()],
      },
      [`PATCH ${P}/issues/117`]: { body: { number: 117, state: "closed" } },
      [`POST ${P}/issues/117/comments`]: { status: 201, body: { id: 1 } },
    }),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.deepEqual(
    r.escritas.map((c) => `${c.metodo} ${c.caminho}`),
    [`PATCH ${P}/issues/117`, `POST ${P}/issues/117/comments`],
  );
  assert.deepEqual(r.escritas[0].body, {
    state: "closed",
    state_reason: "completed",
  });
  assert.match(r.out, /Issue #117 fechada\./);
});

test("ordem diferente dos required checks na API nao e divergencia", () => {
  const p = protecaoViva();
  p.required_status_checks.contexts.reverse();
  const r = rodar({
    rotas: rotasAdmin({ [`GET ${P}/branches/main/protection`]: { body: p } }),
  });
  assert.equal(r.status, 0, r.tudo);
});

test("environments pedidos com per_page=100", () => {
  const r = rodar();
  assert.ok(
    r.chamadas.some((c) => c.caminho === `${P}/environments?per_page=100`),
  );
});

// ------------------------------------------------------------------ ponto cego (so GITHUB_TOKEN)

test("so com o GITHUB_TOKEN (como o run real de 2026-11-09): exit 0, avisos e issue aberta com a mesma assinatura", () => {
  const r = rodar({ rotas: rotasSoWorkflow(), env: SO_WORKFLOW });
  assert.equal(r.status, 0, r.tudo);
  assert.match(
    r.out,
    /Leitura administrativa: GITHUB_TOKEN \(SETTINGS_GUARD_TOKEN ausente/,
  );
  for (const nome of [
    "branch protection",
    "merge/repo",
    "actions",
    "workflow permissions",
    "environments",
  ]) {
    assert.ok(r.out.includes(`::warning::${nome}: NAO VERIFICAVEL`), nome);
  }
  assert.match(r.out, /rulesets: OK/);
  assert.match(r.out, /::warning::Perimetro com 5 ponto\(s\) cego\(s\)/);
  assert.deepEqual(
    r.escritas.map((c) => `${c.metodo} ${c.caminho}`),
    [`POST ${P}/labels`, `POST ${P}/issues`],
  );
  const issue = r.escritas[1].body;
  assert.equal(issue.title, TITULO);
  assert.deepEqual(issue.labels, ["settings-guard"]);
  // Mesmo marcador da issue #117 real: mudar a assinatura reabriria o alerta que ja esta em dedupe.
  assert.ok(
    issue.body.startsWith(
      "<!-- causa:80cc97fbf6edfe46 -->\n## 👁️ Ponto cego do perímetro",
    ),
    issue.body.slice(0, 80),
  );
  assert.match(
    issue.body,
    /\| branch protection \| 403 — \{"message":"Resource not accessible by integration"/,
  );
  assert.match(
    issue.body,
    /Run: https:\/\/github\.com\/adm01-debug\/Loggi_Flow_V2\/actions\/runs\/777/,
  );
});

test('ADMIN_READ_TOKEN vazio (secret ausente) cai no GITHUB_TOKEN, nunca manda "Bearer " vazio', () => {
  const r = rodar({ rotas: rotasSoWorkflow(), env: { ADMIN_READ_TOKEN: "" } });
  assert.equal(r.status, 0, r.tudo);
  assert.ok(r.chamadas.every((c) => c.token === "tok-workflow"));
});

test("dedupe de ponto cego: mesma causa registrada pelo guard ha 6 dias suprime; ha 8 dias comenta", () => {
  const marcador = "<!-- causa:80cc97fbf6edfe46 -->";
  const com = (haMs, autor) =>
    rodar({
      env: SO_WORKFLOW,
      rotas: rotasSoWorkflow({
        [`GET ${P}/issues`]: {
          body: [issueAberta({ body: `${marcador}\ncorpo`, haMs, autor })],
        },
        [`POST ${P}/issues/117/comments`]: { status: 201, body: { id: 1 } },
      }),
    });
  const recente = com(6 * DIA);
  assert.equal(recente.status, 0);
  assert.match(
    recente.out,
    /Dedupe: mesma causa \(80cc97fbf6edfe46\) ha menos de 168 h/,
  );
  assert.deepEqual(recente.escritas, []);

  const antiga = com(8 * DIA);
  assert.deepEqual(
    antiga.escritas.map((c) => `${c.metodo} ${c.caminho}`),
    [`POST ${P}/issues/117/comments`],
  );

  const deTerceiro = com(1 * HORA, "alguem-de-fora");
  assert.equal(
    deTerceiro.escritas.length,
    1,
    "marcador colado por outro autor nao pode silenciar o alerta",
  );
});

test("dedupe olha os comentarios: marcador do guard na penultima pagina suprime", () => {
  const marcador = "<!-- causa:80cc97fbf6edfe46 -->";
  const r = rodar({
    env: SO_WORKFLOW,
    rotas: rotasSoWorkflow({
      [`GET ${P}/issues`]: {
        body: [
          issueAberta({
            body: "corpo antigo, outra causa",
            comments: 150,
            haMs: 30 * DIA,
          }),
        ],
      },
      [`GET ${P}/issues/117/comments?per_page=100&page=2`]: {
        body: [
          {
            user: { login: "humano" },
            body: "vou olhar",
            created_at: new Date().toISOString(),
          },
        ],
      },
      [`GET ${P}/issues/117/comments?per_page=100&page=1`]: {
        body: [
          {
            user: { login: "humano" },
            body: marcador,
            created_at: new Date().toISOString(),
          },
          {
            user: { login: "github-actions[bot]" },
            body: `${marcador}\n...`,
            created_at: new Date(Date.now() - 2 * DIA).toISOString(),
          },
        ],
      },
    }),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.deepEqual(r.escritas, []);
  assert.deepEqual(
    r.chamadas
      .filter((c) => c.caminho.includes("/comments"))
      .map((c) => c.caminho.split("page=").pop()),
    ["2", "1"],
  );
});

test("cegueira parcial em merge.*: aviso PARCIALMENTE VERIFICAVEL e exit 0", () => {
  const repo = repoVivo();
  delete repo.allow_auto_merge;
  repo.delete_branch_on_merge = null;
  const r = rodar({ rotas: rotasAdmin({ [`GET ${P}`]: { body: repo } }) });
  assert.equal(r.status, 0, r.tudo);
  assert.match(
    r.out,
    /::warning::merge\/repo: PARCIALMENTE VERIFICAVEL — 200 — campos nao expostos ao token: allow_auto_merge, delete_branch_on_merge/,
  );
  assert.equal(r.escritas.at(-1).caminho, `${P}/issues`);
});

test("404 generico (Not Found) na branch protection continua sendo ponto cego", () => {
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/branches/main/protection`]: {
        status: 404,
        body: { message: "Not Found", status: "404" },
      },
    }),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /::warning::branch protection: NAO VERIFICAVEL — 404/);
});

test("corpo de erro com quebra de linha nao quebra a tabela da issue nem forja linha de log", () => {
  const texto =
    '{\n  "message": "Resource not accessible by personal access token",\n  "status": "403"\n}\n::error::forjado';
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/actions/permissions`]: { status: 403, texto },
    }),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.ok(
    !r.out.split("\n").some((l) => l.startsWith("::error::")),
    "nenhuma linha de log forjada",
  );
  const linha = corpoDaIssue(r)
    .split("\n")
    .find((l) => l.startsWith("| actions |"));
  assert.ok(
    linha &&
      linha.endsWith(" |") &&
      linha.includes("Resource not accessible by personal access token"),
    linha,
  );
});

// ------------------------------------------------------------------ divergencias

const divergindo = (rotas, env) => {
  const r = rodar({ rotas, env });
  assert.equal(r.status, 1, r.tudo);
  return r;
};

test('branch protection removida ("Branch not protected") e divergencia, nao ponto cego', () => {
  const r = divergindo(
    rotasAdmin({
      [`GET ${P}/branches/main/protection`]: {
        status: 404,
        body: {
          message: "Branch not protected",
          documentation_url:
            "https://docs.github.com/rest/branches/branch-protection#get-branch-protection",
          status: "404",
        },
      },
    }),
  );
  assert.match(
    r.out,
    /divergencia: branch_protection_main esperado=protegida encontrado=sem protecao \(Branch not protected\)/,
  );
  assert.match(corpoDaIssue(r), /## ⚠️ Divergência de perímetro detectada/);
  assert.ok(
    !r.escritas.some((c) => c.metodo === "PATCH"),
    "nada a restaurar sozinho",
  );
});

test("strict ligado ao vivo: restaura para o valor do BASELINE (false), preservando os checks", () => {
  const p = protecaoViva();
  p.required_status_checks.strict = true;
  const r = divergindo(
    rotasAdmin({
      [`GET ${P}/branches/main/protection`]: { body: p },
      [`PATCH ${P}/branches/main/protection/required_status_checks`]: {
        body: {},
      },
    }),
  );
  assert.match(
    r.out,
    /divergencia: branch_protection_main\.strict esperado=false encontrado=true/,
  );
  const patch = r.escritas.find((c) => c.metodo === "PATCH");
  assert.deepEqual(patch.body, { strict: false, contexts: CHECKS });
  assert.equal(
    patch.token,
    "tok-workflow",
    "escrita nunca usa o PAT de leitura",
  );
  assert.match(r.out, /Restaurado: branch_protection_main\.strict/);
  assert.match(
    corpoDaIssue(r),
    /### Restaurações aplicadas\n\n- `branch_protection_main\.strict` restaurado para `false`/,
  );
});

test("restauracao negada (403, o caso do GITHUB_TOKEN): registra a falha e segue saindo 1", () => {
  const p = protecaoViva();
  p.required_status_checks.strict = true;
  const r = divergindo(
    rotasAdmin({
      [`GET ${P}/branches/main/protection @tok-admin`]: { body: p },
      [`GET ${P}/branches/main/protection @tok-workflow`]: negado("branches"),
    }),
  );
  assert.ok(!r.escritas.some((c) => c.metodo === "PATCH"));
  assert.match(
    corpoDaIssue(r),
    /⚠️ falhou ao restaurar `branch_protection_main\.strict`: 403 em/,
  );
});

test("restauracao efetiva forca comentario mesmo com a causa em dedupe", () => {
  const p = protecaoViva();
  p.required_status_checks.strict = true;
  const assinatura = assinaturaDe(
    [{ campo: "branch_protection_main.strict", encontrado: true }],
    [],
  );
  const r = divergindo(
    rotasAdmin({
      [`GET ${P}/branches/main/protection`]: { body: p },
      [`PATCH ${P}/branches/main/protection/required_status_checks`]: {
        body: {},
      },
      [`GET ${P}/issues`]: {
        body: [
          issueAberta({ body: `<!-- causa:${assinatura} -->`, haMs: HORA }),
        ],
      },
      [`POST ${P}/issues/117/comments`]: { status: 201, body: { id: 1 } },
    }),
  );
  assert.equal(r.escritas.at(-1).caminho, `${P}/issues/117/comments`);
});

test("divergencia repetida em menos de 6 h e suprimida; depois de 6 h comenta de novo", () => {
  const p = protecaoViva();
  p.enforce_admins.enabled = true;
  const assinatura = assinaturaDe(
    [{ campo: "branch_protection_main.enforce_admins", encontrado: true }],
    [],
  );
  const com = (haMs) =>
    divergindo(
      rotasAdmin({
        [`GET ${P}/branches/main/protection`]: { body: p },
        [`GET ${P}/issues`]: {
          body: [issueAberta({ body: `<!-- causa:${assinatura} -->`, haMs })],
        },
        [`POST ${P}/issues/117/comments`]: { status: 201, body: { id: 1 } },
      }),
    );
  assert.deepEqual(com(5 * HORA).escritas, []);
  assert.equal(com(7 * HORA).escritas.length, 1);
});

const casosDeProtecao = [
  [
    "um required check removido",
    (p) => p.required_status_checks.contexts.pop(),
    /branch_protection_main\.required_status_checks esperado=.*Agents Docs Integrity/,
  ],
  [
    "um required check a mais",
    (p) => p.required_status_checks.contexts.push("Extra"),
    /required_status_checks .*encontrado=.*Extra/,
  ],
  [
    "required_status_checks desligado (null)",
    (p) => {
      p.required_status_checks = null;
    },
    /strict esperado=false encontrado=required_status_checks desligado/,
  ],
  [
    "enforce_admins ligado",
    (p) => {
      p.enforce_admins.enabled = true;
    },
    /enforce_admins esperado=false encontrado=true/,
  ],
  [
    "historico linear ligado",
    (p) => {
      p.required_linear_history.enabled = true;
    },
    /required_linear_history esperado=false encontrado=true/,
  ],
  [
    "force push liberado",
    (p) => {
      p.allow_force_pushes.enabled = true;
    },
    /allow_force_pushes esperado=false encontrado=true/,
  ],
  [
    "delecao da main liberada",
    (p) => {
      p.allow_deletions.enabled = true;
    },
    /allow_deletions esperado=false encontrado=true/,
  ],
  [
    "review obrigatorio ligado",
    (p) => {
      p.required_pull_request_reviews = { required_approving_review_count: 1 };
    },
    /required_pull_request_reviews esperado=\(nenhum review obrigatorio\) encontrado=1 aprovacao/,
  ],
  [
    "payload sem enforce_admins",
    (p) => {
      delete p.enforce_admins;
    },
    /enforce_admins esperado=false encontrado=null/,
  ],
  [
    "payload vazio ({})",
    (p) => {
      for (const k of Object.keys(p)) delete p[k];
    },
    /required_status_checks esperado=.*encontrado=\(nenhum\)/,
  ],
];
for (const [nome, mexer, esperado] of casosDeProtecao) {
  test(`branch protection: ${nome} → divergencia`, () => {
    const p = protecaoViva();
    mexer(p);
    const r = divergindo(
      rotasAdmin({
        [`GET ${P}/branches/main/protection`]: { body: p },
        [`PATCH ${P}/branches/main/protection/required_status_checks`]: {
          body: {},
        },
      }),
    );
    assert.match(r.out, esperado);
  });
}

test("required_status_checks desligado nao tenta PATCH (nao ha bloco para atualizar)", () => {
  const p = protecaoViva();
  p.required_status_checks = null;
  const r = divergindo(
    rotasAdmin({ [`GET ${P}/branches/main/protection`]: { body: p } }),
  );
  assert.ok(!r.escritas.some((c) => c.metodo === "PATCH"));
});

test("repo mudou de visibilidade: divergencia mesmo so com o GITHUB_TOKEN (sem os campos de merge)", () => {
  // O baseline (publico, medido em 2026-11-23) e a expectativa; o teste inverte o valor vivo.
  const r = divergindo(
    rotasSoWorkflow({
      [`GET ${P}`]: {
        body: { ...repoPublicoAoToken(), private: true, visibility: "private" },
      },
    }),
    SO_WORKFLOW,
  );
  assert.match(
    r.out,
    /divergencia: repo\.private esperado=false encontrado=true/,
  );
  assert.match(r.out, /merge\/repo: PARCIALMENTE VERIFICAVEL/);
  assert.match(corpoDaIssue(r), /\| `repo\.private` \| `false` \| `true` \|/);
});

const casosDeMerge = [
  ["delete_branch_on_merge", true],
  ["allow_squash_merge", false],
  ["allow_merge_commit", false],
  ["allow_rebase_merge", false],
  ["squash_merge_commit_title", "PR_TITLE"],
  ["squash_merge_commit_message", "BLANK"],
];
for (const [campo, valor] of casosDeMerge) {
  test(`merge.${campo}=${valor} → divergencia sem restauracao automatica`, () => {
    const r = divergindo(
      rotasAdmin({ [`GET ${P}`]: { body: { ...repoVivo(), [campo]: valor } } }),
    );
    assert.ok(
      r.out.includes(
        `divergencia: merge.${campo} esperado=${baselineReal().merge[campo]} encontrado=${valor}`,
      ),
      r.out,
    );
    assert.ok(!r.escritas.some((c) => c.metodo === "PATCH"));
  });
}

test("allow_auto_merge ligado: restaura para false (valor do baseline) com PATCH no repo", () => {
  const r = divergindo(
    rotasAdmin({
      [`GET ${P}`]: { body: { ...repoVivo(), allow_auto_merge: true } },
      [`PATCH ${P}`]: { body: {} },
    }),
  );
  assert.deepEqual(r.escritas.find((c) => c.metodo === "PATCH").body, {
    allow_auto_merge: false,
  });
});

test("actions e workflow permissions: valor diferente e campo ausente no payload divergem", () => {
  const a = divergindo(
    rotasAdmin({
      [`GET ${P}/actions/permissions`]: {
        body: { enabled: true, allowed_actions: "selected" },
      },
    }),
  );
  assert.match(
    a.out,
    /actions\.allowed_actions esperado=all encontrado=selected/,
  );
  assert.match(
    a.out,
    /actions\.sha_pinning_required esperado=false encontrado=null/,
  );
  const w = divergindo(
    rotasAdmin({
      [`GET ${P}/actions/permissions/workflow`]: {
        body: {
          default_workflow_permissions: "write",
          can_approve_pull_request_reviews: false,
        },
      },
    }),
  );
  assert.match(
    w.out,
    /workflow_permissions\.default_workflow_permissions esperado=read encontrado=write/,
  );
  assert.match(
    w.out,
    /workflow_permissions\.can_approve_pull_request_reviews esperado=true encontrado=false/,
  );
});

test('rulesets: um ruleset criado diverge; resposta 200 sem lista vira ponto cego (nao "zero rulesets")', () => {
  const um = divergindo(
    rotasAdmin({ [`GET ${P}/rulesets`]: { body: [{ id: 1, name: "x" }] } }),
  );
  assert.match(um.out, /rulesets\.count esperado=0 encontrado=1/);
  const vazio = rodar({
    rotas: rotasAdmin({ [`GET ${P}/rulesets`]: { status: 200, texto: "" } }),
  });
  assert.equal(vazio.status, 0, vazio.tudo);
  assert.match(
    vazio.out,
    /::warning::rulesets: NAO VERIFICAVEL — 200 em \/rulesets/,
  );
  assert.doesNotMatch(vazio.out, /✅ Perimetro OK/);
});

test("environments: faltando e extra inesperado divergem", () => {
  const r = divergindo(
    rotasAdmin({
      [`GET ${P}/environments`]: {
        body: ambientes([
          "copilot",
          "perimetro-leitura",
          "Preview",
          "Production",
          "producao-edge-functions",
          "intruso",
        ]),
      },
    }),
  );
  assert.match(
    r.out,
    /environments\.faltando esperado=banco-leitura encontrado=\(ausente\)/,
  );
  assert.match(r.out, /environments\.extras_inesperados .*encontrado=intruso/);
});

test("environments da Vercel: sumir ou aparecer outro com o mesmo prefixo nao e regressao", () => {
  const sumiu = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/environments`]: {
        body: ambientes(
          AMBIENTES.filter((a) => a !== "Preview" && a !== "Production"),
        ),
      },
    }),
  });
  assert.equal(sumiu.status, 0, sumiu.tudo);
  assert.match(sumiu.out, /environments: OK/);
  const novo = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/environments`]: {
        body: ambientes([...AMBIENTES, "Preview – loggi-flow-v2"]),
      },
    }),
  });
  assert.equal(novo.status, 0, novo.tudo);
  assert.match(
    novo.err,
    /::warning::W13: environments gerenciados pela Vercel presentes/,
  );
});

test('environments: lista cortada pela paginacao vira ponto cego, nao "faltando"', () => {
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/environments`]: {
        body: ambientes(AMBIENTES.slice(0, 3), 140),
      },
    }),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.match(
    r.out,
    /::warning::environments: NAO VERIFICAVEL — 200 em \/environments: lista incompleta: 3 de 140/,
  );
  assert.doesNotMatch(r.out, /environments\.faltando/);
});

test("divergencia + ponto cego no mesmo run: exit 1 e as duas secoes na issue", () => {
  const r = divergindo(
    rotasSoWorkflow({ [`GET ${P}/rulesets`]: { body: [{ id: 9 }] } }),
    SO_WORKFLOW,
  );
  const corpo = corpoDaIssue(r);
  assert.match(corpo, /### Divergências/);
  assert.match(corpo, /### Não verificável com o token do workflow/);
});

test("valor vindo da API com quebra de linha nao forja linha de log", () => {
  const r = divergindo(
    rotasAdmin({
      [`GET ${P}/actions/permissions`]: {
        body: {
          enabled: true,
          allowed_actions: "all\n::error::forjado",
          sha_pinning_required: false,
        },
      },
    }),
  );
  assert.ok(!r.out.split("\n").some((l) => l.startsWith("::error::")));
});

// ------------------------------------------------------------------ tokens recusados

test("PAT recusado (401): avisa, volta ao GITHUB_TOKEN e termina como ponto cego (exit 0)", () => {
  const rotas = rotasSoWorkflow();
  for (const chave of Object.keys(rotas).filter(
    (c) => c.startsWith("GET") && !c.includes("/issues"),
  ))
    rotas[`${chave} @tok-admin`] = {
      status: 401,
      body: { message: "Bad credentials" },
    };
  const r = rodar({ rotas });
  assert.equal(r.status, 0, r.tudo);
  assert.equal(
    r.out.match(/::warning::SETTINGS_GUARD_TOKEN recusado \(401\)/g).length,
    1,
    "avisa uma vez so",
  );
  assert.equal(
    r.chamadas.filter((c) => c.token === "tok-admin").length,
    1,
    "depois do 401 o PAT nao e mais usado",
  );
  assert.match(
    corpoDaIssue(r),
    /GITHUB_TOKEN \(SETTINGS_GUARD_TOKEN recusado com 401 — rotacionar\)/,
  );
});

test("GITHUB_TOKEN recusado (401): exit 1 com erro, sem virar ponto cego", () => {
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/branches/main/protection`]: {
        status: 401,
        body: { message: "Bad credentials" },
      },
    }),
    env: SO_WORKFLOW,
  });
  assert.equal(r.status, 1);
  assert.match(r.err, /::error::401 em .*token recusado/);
  assert.deepEqual(r.escritas, []);
});

test("nenhum token aparece no log nem no corpo da issue", () => {
  const r = rodar({ rotas: rotasSoWorkflow() });
  assert.ok(!r.tudo.includes("tok-admin") && !r.tudo.includes("tok-workflow"));
  assert.ok(!corpoDaIssue(r).includes("tok-"));
});

// ------------------------------------------------------------------ rede: 5xx, rate limit, timeout

test("500 transitorio em leitura: repete e conclui OK", () => {
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/actions/permissions`]: [
        { status: 500, body: {} },
        { status: 502, body: {} },
        {
          body: {
            enabled: true,
            allowed_actions: "all",
            sha_pinning_required: false,
          },
        },
      ],
    }),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.equal(
    r.chamadas.filter((c) => c.caminho === `${P}/actions/permissions`).length,
    3,
  );
});

test("500 persistente: exit 1 com o status no erro, depois de 3 tentativas", () => {
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/rulesets`]: { status: 500, body: { message: "Server Error" } },
    }),
  });
  assert.equal(r.status, 1);
  assert.match(r.err, /::error::GitHub API GET .*\/rulesets → 500/);
  assert.equal(
    r.chamadas.filter((c) => c.caminho === `${P}/rulesets`).length,
    3,
  );
});

test("falha de rede: repete a leitura; se persistir, erro claro (exit 1)", () => {
  const ok = rodar({
    rotas: rotasAdmin({
      [`GET ${P}`]: [{ rede: "ECONNRESET" }, { body: repoVivo() }],
    }),
  });
  assert.equal(ok.status, 0, ok.tudo);
  const r = rodar({
    rotas: rotasAdmin({ [`GET ${P}`]: { rede: "ENOTFOUND" } }),
  });
  assert.equal(r.status, 1);
  assert.match(
    r.err,
    /::error::GitHub API GET .* → falha de rede \(ENOTFOUND\) apos 3 tentativa\(s\)/,
  );
});

test("API que nao responde: o timeout aborta e o run falha em vez de pendurar", () => {
  const r = rodar({
    rotas: rotasAdmin({ [`GET ${P}/environments`]: { pendurar: true } }),
  });
  assert.equal(r.status, 1);
  assert.match(r.err, /falha de rede \(sem resposta em 30s\)/);
});

test("rate limit primario (403 + x-ratelimit-remaining: 0) nao vira ponto cego: exit 1", () => {
  const daquiUmaHora = String(Math.floor(Date.now() / 1000) + 3600);
  const limite = {
    status: 403,
    headers: {
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": daquiUmaHora,
    },
    body: { message: "API rate limit exceeded for installation." },
  };
  const rotas = rotasAdmin();
  for (const chave of Object.keys(rotas).filter((c) => c.startsWith("GET")))
    rotas[chave] = limite;
  const r = rodar({ rotas });
  assert.equal(r.status, 1, r.tudo);
  assert.match(r.err, /::error::GitHub API GET .* → rate limit \(403\)/);
  assert.doesNotMatch(r.out, /NAO VERIFICAVEL/);
  assert.equal(r.chamadas.length, 1, "reset distante: nao insiste");
});

test("rate limit secundario curto (429 + retry-after): espera e repete", () => {
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/rulesets`]: [
        {
          status: 429,
          headers: { "retry-after": "3" },
          body: { message: "secondary rate limit" },
        },
        { body: [] },
      ],
    }),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /Rate limit em GET .*\/rulesets: nova tentativa em 3s\./);
});

test("403 de rate limit sem cabecalho (so a mensagem) tambem e erro, nao ponto cego", () => {
  const r = rodar({
    rotas: rotasAdmin({
      [`GET ${P}/rulesets`]: {
        status: 403,
        body: { message: "You have exceeded a secondary rate limit." },
      },
    }),
  });
  assert.equal(r.status, 1);
  assert.match(r.err, /rate limit \(403\)/);
});

test("escrita nao e repetida: 500 ao abrir a issue falha sem POST duplicado", () => {
  const r = rodar({
    rotas: rotasSoWorkflow({
      [`POST ${P}/issues`]: { status: 500, body: { message: "boom" } },
    }),
    env: SO_WORKFLOW,
  });
  assert.equal(r.status, 1);
  assert.equal(r.escritas.filter((c) => c.caminho === `${P}/issues`).length, 1);
});

test("label que ja existe (422) nao impede abrir a issue", () => {
  const r = rodar({
    rotas: rotasSoWorkflow({
      [`POST ${P}/labels`]: {
        status: 422,
        body: { message: "Validation Failed" },
      },
    }),
    env: SO_WORKFLOW,
  });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /Issue #200 aberta\./);
});

// ------------------------------------------------------------------ snapshot

test("PERIMETER_SNAPSHOT_PATH: grava divergencias e pontos cegos em JSON", () => {
  const arquivo = path.join(TMP, "snapshot-ok.json");
  const r = rodar({
    rotas: rotasSoWorkflow({ [`GET ${P}/rulesets`]: { body: [{ id: 1 }] } }),
    env: { ...SO_WORKFLOW, PERIMETER_SNAPSHOT_PATH: arquivo },
  });
  assert.equal(r.status, 1);
  const snapshot = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  assert.equal(snapshot.run_id, "777");
  assert.deepEqual(
    snapshot.divergencias.map((d) => d.campo),
    ["rulesets.count"],
  );
  assert.equal(snapshot.nao_verificaveis.length, 5);
  assert.ok(!Number.isNaN(Date.parse(snapshot.medido_em)));
});

test("snapshot em caminho impossivel: avisa e o resultado do perimetro continua valendo", () => {
  const r = rodar({
    env: {
      PERIMETER_SNAPSHOT_PATH: path.join(
        TMP,
        "nao-existe",
        "sub",
        "snapshot.json",
      ),
    },
  });
  assert.equal(r.status, 0, r.tudo);
  assert.match(r.out, /::warning::Snapshot do perimetro nao foi salvo/);
  assert.match(r.out, /✅ Perimetro OK/);
});

// ------------------------------------------------------------------ --dry-run

test("--dry-run com divergencia restauravel: nenhuma escrita, mesmo exit code, mostra o que faria", () => {
  const p = protecaoViva();
  p.required_status_checks.strict = true;
  const r = rodar({
    args: ["--dry-run"],
    rotas: rotasAdmin({
      [`GET ${P}/branches/main/protection`]: { body: p },
      [`GET ${P}`]: { body: { ...repoVivo(), allow_auto_merge: true } },
    }),
  });
  assert.equal(r.status, 1, r.tudo);
  assert.deepEqual(r.escritas, []);
  assert.match(
    r.out,
    /\[dry-run\] restauraria branch_protection_main\.strict para false\./,
  );
  assert.match(
    r.out,
    /\[dry-run\] restauraria merge\.allow_auto_merge para false\./,
  );
  assert.match(r.out, /\[dry-run\] corpo que iria para a issue:\n<!-- causa:/);
  assert.match(r.out, /\[dry-run\] POST .*\/issues nao enviado\./);
  assert.doesNotMatch(r.out, /Restaurado:/);
});

test("--dry-run com tudo OK e issue aberta: nao fecha a issue", () => {
  const r = rodar({
    args: ["--dry-run"],
    rotas: rotasAdmin({ [`GET ${P}/issues`]: { body: [issueAberta()] } }),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.deepEqual(r.escritas, []);
  assert.match(r.out, /\[dry-run\] PATCH .*\/issues\/117 nao enviado\./);
});

// ------------------------------------------------------------------ baseline quebrado / alterado

test("baseline ausente ou com JSON invalido: erro claro, sem stack trace, sem chamar a API", () => {
  for (const conteudo of [null, '{ "merge": ', ""]) {
    const r = rodar({ guard: guardComBaseline(conteudo) });
    assert.equal(r.status, 1);
    assert.match(
      r.err,
      /^::error::Baseline invalido \(scripts\/ci\/github-settings-baseline\.json\): nao foi possivel ler o arquivo: /,
    );
    assert.doesNotMatch(r.err, /\n\s+at /, "sem stack trace");
    assert.equal(r.chamadas.length, 0);
  }
});

const baselinesQuebrados = [
  [
    "sem branch_protection_main",
    (b) => {
      delete b.branch_protection_main;
      return b;
    },
    /falta o objeto `branch_protection_main`/,
  ],
  [
    "sem merge",
    (b) => {
      delete b.merge;
      return b;
    },
    /falta o objeto `merge`/,
  ],
  [
    "merge vazio",
    (b) => {
      b.merge = {};
      return b;
    },
    /falta o objeto `merge`/,
  ],
  [
    "sem actions",
    (b) => {
      delete b.actions;
      return b;
    },
    /falta o objeto `actions`/,
  ],
  [
    "sem environments",
    (b) => {
      delete b.environments;
      return b;
    },
    /`environments` tem de ser uma lista/,
  ],
  [
    "strict como texto",
    (b) => {
      b.branch_protection_main.strict = "false";
      return b;
    },
    /`branch_protection_main\.strict` tem de ser true ou false/,
  ],
  [
    "required_status_checks ausente",
    (b) => {
      delete b.branch_protection_main.required_status_checks;
      return b;
    },
    /required_status_checks` tem de ser uma lista/,
  ],
  ["arquivo e uma lista", () => [], /nao contem um objeto JSON/],
  ["arquivo e null", () => null, /nao contem um objeto JSON/],
];
for (const [nome, alterar, esperado] of baselinesQuebrados) {
  test(`baseline ${nome}: exit 1 dizendo o que falta, antes de qualquer chamada`, () => {
    const r = rodar({ guard: guardComBaseline(alterar) });
    assert.equal(r.status, 1, r.tudo);
    assert.match(r.err, esperado);
    assert.doesNotMatch(r.err, /Cannot read properties|is not iterable/);
    assert.equal(r.chamadas.length, 0);
  });
}

test("baseline com chave de topo desconhecida (erro de digitacao): avisa e segue", () => {
  const r = rodar({
    guard: guardComBaseline((b) => ({
      ...b,
      ruleset_count: 0,
      _nota: "comentario livre",
    })),
  });
  assert.equal(r.status, 0, r.tudo);
  assert.match(
    r.out,
    /::warning::Baseline .* tem chave\(s\) que nenhuma checagem le: ruleset_count\./,
  );
});

test("baseline antigo, sem as chaves novas (repo, allow_deletions, reviews): as checagens novas ficam desligadas", () => {
  const antigo = (b) => {
    delete b.repo;
    delete b.branch_protection_main.allow_deletions;
    delete b.branch_protection_main.required_pull_request_reviews;
    return b;
  };
  const p = protecaoViva();
  p.allow_deletions.enabled = true;
  p.required_pull_request_reviews = { required_approving_review_count: 2 };
  const r = rodar({
    guard: guardComBaseline(antigo),
    rotas: rotasAdmin({
      [`GET ${P}/branches/main/protection`]: { body: p },
      [`GET ${P}`]: { body: { ...repoVivo(), private: false } },
    }),
  });
  assert.equal(r.status, 0, r.tudo);
});

test("baseline que exige 1 aprovacao: sem review ao vivo diverge; com 1, passa", () => {
  const guard = guardComBaseline((b) => {
    b.branch_protection_main.required_pull_request_reviews = 1;
    return b;
  });
  const sem = rodar({ guard });
  assert.equal(sem.status, 1);
  assert.match(
    sem.out,
    /required_pull_request_reviews esperado=1 aprovacao\(oes\) obrigatoria\(s\) encontrado=\(nenhum review obrigatorio\)/,
  );
  const p = protecaoViva();
  p.required_pull_request_reviews = { required_approving_review_count: 1 };
  assert.equal(
    rodar({
      guard,
      rotas: rotasAdmin({ [`GET ${P}/branches/main/protection`]: { body: p } }),
    }).status,
    0,
  );
});

test("baseline com allowed_actions=selected: confere os padroes; fora disso o endpoint nem e chamado", () => {
  assert.ok(
    !rodar().chamadas.some((c) => c.caminho.endsWith("/selected-actions")),
  );
  const guard = guardComBaseline((b) => {
    b.actions.allowed_actions = "selected";
    b.selected_actions_patterns = ["actions/checkout", "supabase/setup-cli"];
    b.selected_actions_github_owned_allowed = true;
    return b;
  });
  const rotas = (patterns) =>
    rotasAdmin({
      [`GET ${P}/actions/permissions`]: {
        body: {
          enabled: true,
          allowed_actions: "selected",
          sha_pinning_required: false,
        },
      },
      [`GET ${P}/actions/permissions/selected-actions`]: {
        body: {
          github_owned_allowed: true,
          verified_allowed: false,
          patterns_allowed: patterns,
        },
      },
    });
  assert.equal(
    rodar({
      guard,
      rotas: rotas(["supabase/setup-cli@*", "actions/checkout@*"]),
    }).status,
    0,
  );
  const r = rodar({
    guard,
    rotas: rotas(["actions/checkout@*", "malicioso/acao@*"]),
  });
  assert.equal(r.status, 1);
  assert.match(
    r.out,
    /selected_actions\.patterns_allowed .*encontrado=actions\/checkout, malicioso\/acao/,
  );
});

test("baseline com security_and_analysis: status diferente diverge", () => {
  const guard = guardComBaseline((b) => {
    b.security_and_analysis = { secret_scanning: "enabled" };
    return b;
  });
  const com = (status) =>
    rodar({
      guard,
      rotas: rotasAdmin({
        [`GET ${P}`]: {
          body: {
            ...repoVivo(),
            security_and_analysis: { secret_scanning: { status } },
          },
        },
      }),
    });
  assert.equal(com("enabled").status, 0);
  assert.match(
    com("disabled").out,
    /security_and_analysis\.secret_scanning esperado=enabled encontrado=disabled/,
  );
});

// ------------------------------------------------------------------ funcoes puras

test("assinaturaDe: estavel, independe da ordem, muda com valor lido e com o conjunto de campos cegos", () => {
  const d1 = { campo: "merge.allow_auto_merge", encontrado: true };
  const d2 = { campo: "rulesets.count", encontrado: 2 };
  const c1 = { nome: "actions", campos: ["403"] };
  const c2 = { nome: "merge/repo (parcial)", campos: ["b", "a"] };
  const base = assinaturaDe([d1, d2], [c1, c2]);
  assert.match(base, /^[0-9a-f]{16}$/);
  assert.equal(assinaturaDe([d2, d1], [c2, c1]), base);
  assert.equal(
    assinaturaDe([d1, d2], [c1, { ...c2, campos: ["a", "b"] }]),
    base,
  );
  assert.notEqual(assinaturaDe([d1, { ...d2, encontrado: 3 }], [c1, c2]), base);
  assert.notEqual(assinaturaDe([d1, d2], [c1, { ...c2, campos: ["a"] }]), base);
  assert.notEqual(assinaturaDe([d1], [c1, c2]), base);
  assert.equal(assinaturaDe([], []), assinaturaDe([], []));
});

test("problemasDoBaseline: aceita o minimo valido e ignora chaves que comecam com _", () => {
  const minimo = {
    branch_protection_main: {
      strict: true,
      enforce_admins: true,
      required_status_checks: [],
    },
    merge: { allow_auto_merge: true },
    actions: { enabled: true },
    environments: [],
    _obs: 1,
  };
  assert.deepEqual(problemasDoBaseline(minimo), { erros: [], avisos: [] });
  assert.equal(problemasDoBaseline({}).erros.length, 4);
  assert.deepEqual(problemasDoBaseline("texto"), {
    erros: ["o arquivo nao contem um objeto JSON"],
    avisos: [],
  });
});
