# GitHub (perímetro, CI, workflows) — referência para agentes

Ler quando mexer em branch protection, settings do repo, `.github/workflows/`, ou quando um merge ou um
workflow falhar de forma estranha.

## Escrita no GitHub

- Repo `adm01-debug/Loggi_Flow_V2`, branch `main`, **publico** (medido na API em
  2026-11-23: `"visibility":"public"`; a linha dizia "privado"), licença MIT, homepage
  `https://loggi-flow-v2.vercel.app`.
- **Escrita: MCP `GITHUB - MCP - FOREVER`** (`github_push_files`). Ele sobrescreve o arquivo — mande o
  conteúdo integral com apenas a mudança semântica e confira depois que o arquivo remoto bate com o que você
  testou. Aceita `files` e `delete` no mesmo commit (1 commit atômico). O MCP padrão do GitHub retorna 403 em
  write nos repos `adm01-debug`.
- Sessão na nuvem: `git clone`/`git fetch` funcionam quando o repo está entre as fontes autorizadas da
  sessão; fora disso, só leitura pelo MCP. Para listar PRs abertas com os arquivos que tocam numa chamada só,
  use `github_graphql` (`pullRequests(states:OPEN){ nodes { number headRefName files { nodes { path } } } }`):
  `github_list_pull_requests` devolve o repositório inteiro em cada nó e estoura o contexto.
- Commits: `<tipo>(<escopo>): <assunto>` no padrão `@commitlint/config-conventional` (`.commitlintrc.json`).
  **Nada executa o commitlint**: `.husky/` só tem `pre-commit` (`npx lint-staged`). Via MCP nenhum hook roda
  — siga o padrão de qualquer forma.

## Perímetro do GitHub — estado canônico

Lido da API em 2026-11-08 (atualizado no mesmo dia: `Agents Docs Integrity` passou a required check após o
merge da #110). Qualquer mudança nesses campos atualiza **esta tabela no mesmo PR**.

| Campo                                              | Estado canônico                                                                                                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch protection — required checks                | **10**: `Security Scan` · `Lint` · `Type Check` · `Warning Budget Gate` · `Unit & Integration Tests` · `Build Artifact` · `quality-gate` · `Security Audits` · `Agents Docs Integrity` · `Contratos da automação local` |
| Branch protection — `strict` (branch atualizada)   | **`false`** — PR atrasada da `main` mergeia sem atualizar                                                                                                                                                               |
| Branch protection — `enforce_admins`               | `false`                                                                                                                                                                                                                 |
| Branch protection — histórico linear               | `false`                                                                                                                                                                                                                 |
| Branch protection — review obrigatório             | **nenhum** (deliberado: vários agentes com merge próprio)                                                                                                                                                               |
| Branch protection — force push / deleção da `main` | bloqueados                                                                                                                                                                                                              |
| Merge                                              | `allow_squash_merge=true` · `allow_merge_commit=true` · `allow_rebase_merge=true` · `allow_auto_merge=false` · `delete_branch_on_merge=false`                                                                           |
| Squash                                             | `squash_merge_commit_message=COMMIT_MESSAGES` · `squash_merge_commit_title=COMMIT_OR_PR_TITLE`                                                                                                                          |
| Apps de review no PR                               | `Vercel` (deploy de preview), `Vercel Agent Review`, `Devin Review`, `Vercel Preview Comments` — **nenhum é required check**                                                                                            |
| Dependabot                                         | npm + github-actions, semanal, até 10 PRs; majors travados de `eslint`, `@eslint/js`, `vite`, `react`, `react-dom`, `@types/react*` (ver `.github/dependabot.yml` para o motivo de cada um)                             |

Consequências práticas:

- **Padronize squash.** Os três métodos de merge estão habilitados; merge commit e rebase sujam o histórico
  que o `strict=false` já deixa frouxo.
- **Apague a branch à mão depois do merge** — `delete_branch_on_merge` está desligado.
- **Sem auto-merge**: não existe fila. Mergeie só com os 9 checks verdes na sua PR.
- **`Build Artifact` depende de todos os outros** (`needs: [security, lint, typecheck, warning-budget, test]`
  em `ci.yml`): se qualquer um falhar, ele sai `skipped` — e check obrigatório `skipped` conta como
  **sucesso** para o GitHub. Aqui isso não abre brecha porque os cinco também são obrigatórios; não remova
  nenhum deles da lista sem criar um gate agregador (`if: always()`) no lugar.
- **`Agents Docs Integrity` não está no `needs` do `build`** — roda em paralelo, como job independente; ele
  bloqueia o merge por ser required check, não por dependência de pipeline.
- **`enforce_admins=false`** significa que o dono pode mergear com check vermelho. Você não: vermelho é
  vermelho.

## Workflows (6 arquivos em `.github/workflows/`)

| Arquivo                                  | Dispara                                                                                                                                                    | Entrega                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml` (`CI/CD Pipeline`)              | push em `main`/`develop`, PR para `main`                                                                                                                   | `security` (npm audit via `scripts/audit-gate.mjs` + gitleaks), `lint`, `typecheck`, `warning-budget`, `test` (`test:coverage`, com pisos), `build` (build + teto de 8 MB em `dist/assets` + artefato)                                                                                                        |
| `ci-nexus.yml` (`CI Quality Gate Nexus`) | push/PR em `main`/`master`/`develop`                                                                                                                       | job único `quality-gate`: lint, typecheck, `validate:csp`, `validate:no-console`, `security-scan`, `test:rls`, smoke de edge com Deno, testes, fuzzing, cobertura                                                                                                                                             |
| `security.yml` (`Security Scan`)         | push/PR em `main`/`master` + semanal (dom. 00:00 UTC)                                                                                                      | `Security Audits`: npm audit + gitleaks                                                                                                                                                                                                                                                                       |
| `deploy-functions.yml`                   | push em `main` que toque `supabase/functions/**` **+** `workflow_dispatch`**                                                                               | deploy das edge functions no projeto `jvfhclubfpxrtrrazrgr` (input `only` = uma função); exige o secret `SUPABASE_ACCESS_TOKEN`                                                                                                                                                                               |
| `contexto-ia.yml`                        | push em `main` que toque `src/`, `supabase/`, os scripts das automações ou `docs/contexto/regras/manual/` + a cada 10 min (minuto 7) + `workflow_dispatch` | regera o contexto para agentes e publica na branch gerada **`contexto`** (nunca na `main`); 5 jobs (`gate`, `codigo`, `banco`, `regras`, `publicar`), produtor que falha não derruba os outros. A fonte `supabase/` fica vazia até existir o secret `SUPABASE_DB_URL`. Detalhe: `docs/agentes/contexto-ia.md` |

Fatos que já custaram retrabalho:

- **`ci.yml` e `ci-nexus.yml` se sobrepõem** (lint, typecheck e testes rodam duas vezes, com configs
  diferentes de Node e cache). Antes de "consertar" duplicação, lembre que os dois nomes de job estão na
  lista de required checks: apagar um workflow trava todo merge até alguém editar a branch protection.
- **`Deno Edge Function Smoke Tests` termina em `|| true`** (`ci-nexus.yml`): o passo é informativo, não
  gate. Não o cite como prova de que edge function foi testada.
- **gitleaks precisa de `fetch-depth: 0`** e de `pull-requests: read` (o repo é publico, mas a permissão
  explícita vale nos dois casos) — os dois workflows de
  security já fazem isso; copiar um job de security sem essas duas linhas dá falso verde.
- **Allowlist do gitleaks (`.gitleaks.toml`) cobre só credencial pública por design**: anon key do Supabase
  (JWT com `role=anon`) e token `pk.` do Mapbox, em `.env`, `.env.example` e `tests/security/*.spec.ts`.
  Nunca adicione `service_role`, `sb_secret_`, senha ou token privado ali.
- **E2E não é gate.** Nenhum workflow de PR roda Playwright; "passou o E2E" so vale com run manual.
  Os specs em tests/e2e seguem no repo (credenciais ficticias, sem webServer), sem workflow.
  O workflow e2e.yml foi removido em 20/11/2026 por nao haver usuario de teste em producao.
- **`contexto.yml` publica numa branch, não na `main`.** Não edite a branch `contexto` nem abra PR dela: o
  próximo run sobrescreve. O push dela usa `GITHUB_TOKEN`, que não dispara outros workflows.

## Guards que você pode rodar antes do PR

- `node scripts/ci/check-claude-md-integrity.mjs` — se mexer em `AGENTS.md`, `CLAUDE.md` ou `docs/agentes/`:
  exige os 8 cabeçalhos do `AGENTS.md` e barra o conjunto encolher >30% (ou qualquer arquivo vigiado
  encolher >50%). Detalhe em `scripts/ci/README.md`.
- `npm run lint:budget` — orçamento de warnings (`.warning-budget.json`).
- `npm run validate:csp`, `npm run validate:no-console`, `npm run security-scan`, `npm run test:rls`.
