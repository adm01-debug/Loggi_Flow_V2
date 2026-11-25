# Mapa do repositório — referência para agentes

Ler quando precisar saber onde fica algo antes de buscar por texto.

## Onde olhar primeiro

| Precisa de | Leia |
|---|---|
| **Estado real do projeto — antes de qualquer tarefa ou planejamento** | **`docs/contexto/00-INDEX.md` na branch `contexto`** (`git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md`): diz qual fonte é dona de cada fato e a ordem de leitura. Gerado por automação — não editar. Detalhe: `docs/agentes/contexto-ia.md` |
| Qual banco, migrations, deploy, GitHub, integrações | `AGENTS.md` + `docs/agentes/*.md` |
| Inventário funcional escrito à mão | `docs/INVENTARIO_FUNCIONALIDADES.md`, `DOCUMENTATION.md`, `TEMPLATE_STRUCTURE.md` — contexto, **não** fonte de verdade (envelhecem em silêncio) |
| Decisões de arquitetura | `docs/adr/` (14 ADRs; `0008` = arquitetura por feature, `0014` = RLS com `SECURITY DEFINER`) |
| Auditorias e estado histórico | `ESTADO_ATUAL.md`, `ESTADO_ATUAL_EVIDENCIAS.md`, `docs/audit/` — retratos datados, não o presente |
| Runbooks de incidente/banco/backup | `docs/INCIDENT_PLAYBOOK.md`, `docs/RUNBOOK_DB_PERFORMANCE.md`, `docs/RUNBOOK_BACKUP.md`, `docs/DISASTER_RECOVERY.md` |

## Mapa rápido

| Onde | O que tem |
|---|---|
| `src/App.tsx` | **todas as rotas** e os providers; feature nova sem entrada aqui não existe para o usuário |
| `src/pages/` | **78 páginas** `PascalCase.tsx` com `export default` — 59 na raiz + 19 em subpastas por domínio: `admin/`, `auth/`, `ranking/`, `conciliacao/`, `cotacao-multicanal/`, `dashboard-cotacoes/`, `admin-telemetria/`, `aprovacao-reset/` |
| `src/components/` | 33 pastas por domínio (`coletas/`, `freight/`, `shipping/`, `transportadoras/`, `rodonaves/`, `melhorenvio/`, `gamification/`, `map/`, `security/`, …) + `ui/` (shadcn) e `common/` (Pagination, FilterBar, BulkActions, CSVImporter…) |
| `src/hooks/` | hooks `use*.ts(x)` com export nomeado, agrupados por domínio: `logistics/`, `integrations/`, `gamification/`, `predictions/`, `security/`, `analytics/`, `ai/`, `auth/`, `data/`, `notifications/`, `rodonaves/`, `ui/`, `common/` |
| `src/features/` | fatias novas no padrão do ADR 0008: `analytics/`, `db-observability/`, `incidents/`, `logistics/`, `preferences/` |
| `src/services/` | `api/` (authService, logisticsService, storageService), `base/BaseService.ts`, `resilience/CircuitBreaker.ts` |
| `src/lib/` | utilitários e contratos: `schemas/` (Zod), `queryKeys.ts`/`queryConfig.ts` (TanStack Query), `formatters.ts`, importadores CSV/Excel, `predictions/`, `rodonaves/` |
| `src/integrations/` | `src/integrations/supabase/client.ts` + `src/integrations/supabase/types.ts` (**gerado — não editar à mão**), `lovable/`, `shared/` |
| `supabase/functions/` | **43 edge functions deployáveis** + `_shared/` (CORS em `cors.ts`, auth em `auth.ts`, `webhookSignature.ts`, `rateLimiter.ts`, `circuitBreaker.ts`, `idempotency.ts`, `logger.ts`, `crypto.ts`, `safeFetch.ts`, `schemas/`) |
| `supabase/migrations/` | 244 arquivos `.sql` — **histórico**, não estado; o estado é o banco ao vivo |
| `supabase/config.toml` | `project_id` oficial e quais functions rodam com `verify_jwt = false` (auth no código) |
| `scripts/` | gates e operação: `validate-csp.mjs`, `validate-no-console.mjs`, `audit-gate.mjs`, `check-warning-budget.mjs`, `ratchet-warning-budget.mjs`, `generate-quality-report.mjs`, `seed-database.ts`, `ci/` (guarda das instruções de agente), `audit/` (manifestos SQL), `ops/` (backup, secrets, pós-deploy), `graphify/` (grafo), `ai-context/` + `regras_negocio/` + `supabase_snapshot/` (produtores do contexto para agentes) |
| `tests/` | `unit/`, `integration/`, `security/` (RLS e integrações), `contracts/`, `fuzzing/`, `load/`, `e2e/` (Playwright, fora do vitest) |
| `docs/` | ADRs, runbooks, auditorias, `api/openapi.yaml`, `data/dicionario.md`, `ops/cron_jobs_origem.json`, `agentes/` (esta pasta) |
| `docs/contexto/` | na `main` existe só `regras/manual/` (regras de negócio escritas por humano, entram no contexto gerado). O conteúdo gerado vive na branch **`contexto`** — ver `docs/agentes/contexto-ia.md` |

## Listagens: teto e paginação

Três decisões, na ordem — use a primeira que servir ao caso:

| Caso | O que fazer | Referência |
|---|---|---|
| Lista **curta** de domínio fechado (`transportadoras`, `clientes`, `feature_flags`) | leitura inteira, sem teto; se a tela precisar paginar, `usePagination` recorta em memória | `src/hooks/common/usePagination.ts` |
| Lista **longa** que a tela só exibe (feed, log, telemetria) | teto no servidor com `.limit()` | `src/hooks/notifications/useNotifications.tsx:35` (`.limit(50)` + `.eq("user_id", ...)`) |
| Lista longa que o usuário **navega página por página** | `useServerPagination`, com `.range(from, to)` e `count: "exact"` | `src/hooks/common/useServerPagination.ts` |

Regras do `useServerPagination`: `from = (page - 1) * pageSize` e `to = from + pageSize - 1` (nunca `.range()`
junto com `.limit()`); o total vem do `count` do servidor, não de `rows.length`; trocar filtro volta para a
página 1; `placeholderData` mantém as linhas durante a troca; a ordenação tem de ser estável (com desempate) —
`.range()` sem ordem determinística repete e some linhas entre páginas.

`src/hooks/common/usePagination.ts` recorta um array **já carregado** (`data.slice`): não busca no servidor.
## Testes — onde o vitest realmente olha

`vitest.config.ts` é a configuração válida: `include` cobre `src/**/*.{test,spec}.*` e `tests/**/*.{test,spec}.*`,
`exclude` tira `tests/e2e`, setup em `src/test/setup.ts`, cobertura com piso (`lines 72 / functions 73 /
branches 67 / statements 70`) — piso sobe, nunca desce sem aprovação.

O bloco `test:` dentro de `vite.config.ts` é **morto** e mente: aponta `setupFiles: './tests/test-utils.tsx'`,
arquivo que não existe. Não use como referência; se mexer em config de teste, mexa em `vitest.config.ts`.

## Automações (`scripts/`)

Automação nova vive em `scripts/<nome>/`, um subdiretório por automação, cada um com `README.md` dizendo o
que faz, como rodar e que secrets usa. Os gates antigos (`validate-*.mjs`, `audit-gate.mjs`,
`check-warning-budget.mjs`) estão soltos na raiz de `scripts/` por histórico — não adicione mais nenhum lá.
`supabase/scripts` e `src/scripts` nao existe hoje e nao devem ser criados: o CLI do Supabase e dono de `supabase/`, e `src/scripts` entraria no bundle.
**Leia o README da automação antes de alterar.**

## Comandos

O repo usa **npm**: a CI roda `npm ci` com `package-lock.json` e Node 20. `bun.lock` e `bun.lockb` estão
commitados e **não** são usados por nenhum workflow — tratá-los como fonte já levaria a lockfile divergente.

- testes só do que você tocou: `npx vitest run <caminho>` (`npm run test:coverage` roda a suíte inteira com
  os pisos de cobertura);
- typecheck: `npm run typecheck` (`tsc --noEmit`);
- lint dos arquivos tocados: `npx eslint <arquivos>`; orçamento de warnings: `npm run lint:budget`;
- gates específicos: `npm run validate:csp` (meta CSP do `index.html`), `npm run validate:no-console`
  (nenhum `console.*` cru em edge function — evita PII em log), `npm run security-scan` (npm audit
  high+critical), `npm run test:rls` e `npm run test:security`;
- E2E: `npm run test:e2e` — **manual**, exige usuário de teste semeado e credenciais no ambiente alvo;
- ciclos duplicados: `npm run check-circular`; relatório de qualidade: `npm run quality:report`;
- guarda das instruções de agente: `node scripts/ci/check-claude-md-integrity.mjs` (ver `scripts/ci/README.md`);
- hook do husky: só `pre-commit` (`npx lint-staged` → eslint --fix + prettier). **Não há `commit-msg`**:
  o commitlint está instalado mas nada o executa.

## Grafo de código (graphify) — detalhes

`npm run graph:setup` → `scripts/graphify/setup.sh`; precisa de `uv` ou `pipx`. `graphify-out/` fica fora do
Git (dezenas de MB): cada clone gera o seu. Frescura: compare `git rev-parse --short HEAD` com a linha
"Built from commit" de `graphify-out/GRAPH_REPORT.md`; se divergir, `graphify update .` (só AST, sem custo de
API). Os hooks `PreToolUse` em `.claude/settings.json` chamam `graphify hook-guard` e não fazem nada onde o
graphify não estiver instalado. Em sessão de nuvem, `.claude/hooks/session-start.sh` instala o graphify e
gera o grafo em segundo plano (log em `graphify-out/.session-start.log`; pula se o grafo já é do commit atual).
