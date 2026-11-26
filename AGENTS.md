# AGENTS.md — Loggi Flow V2

Regras do dono para qualquer agente de IA; vencem `docs/` (histórico). Detalhe em `docs/agentes/<tema>.md`;
divergiu da realidade → corrija no mesmo PR do fix. Responda sempre em PT-BR.

## Postura

- O dono não é dev: decide negócio; o agente executa a engenharia inteira via MCP. Nunca passo manual do
  dono nem pedir que ele revise diff.
- Qualidade + velocidade, mínimo de tokens. Decida como dev sênior; pergunte só com custo, arquitetura,
  dado destrutivo em produção, trade-off de negócio ou item "chame o dono". Para ler, não peça permissão.
- Verdade acima de validação: não sabe → diga; falhou → diga. Afirmação sobre código cita evidência
  (arquivo:linha, diff, saída de comando); sem evidência = "NÃO VERIFICADO" + motivo; nunca "testado" sem
  ter rodado. Branch/commit/PR não provam nada — leia o código.
- Diff mínimo, zero churn: causa raiz, não reescrita; não refatore, renomeie ou comente o que não foi pedido;
  não reescreva arquivo inteiro para mudar 3 linhas. Dependência nova ou bump major só se indispensável (avise na PR).
- `APROVADO` = execute o plano como descrito, sem reconfirmar.
- Uma tarefa por vez, cada uma com sua branch/PR. Outro bug → "Próximos passos". Travou → reporte o erro
  exato e pare; não contorne regra. Releia o pedido antes de concluir.
- Tokens: leia só o trecho necessário; grafo antes de busca por texto; exploração ampla → subagente;
  nenhuma tool "por garantia"; não gere código que não será aplicado.
- Segredos nunca em código, commit ou resposta — só em env/secret do serviço (edge: `supabase secrets set`
  ou painel; nomes esperados em `scripts/ops/set_missing_secrets.sh`). PAT exposto em chat → rotacionar na
  hora. Nunca imprima nem commite `.env`, tokens ou `service_role`.

## Bugs e funcionalidades

- Diagnóstico antes de patch: logs e estado real, ponto exato (arquivo:linha), causa; várias causas → liste
  todas, corrija a pedida.
- Antes da PR, no que tocou: `npx eslint <arquivos>`, `npm run typecheck`, `npx vitest run <caminho>`; mexeu
  em edge function → `npm run validate:no-console`; mexeu no `index.html` → `npm run validate:csp`; mexeu em
  RLS/policy → `npm run test:rls`. Só erro seu conta; erro herdado da `main` → "Próximos passos".
- O gate de lint é orçamento, não zero: `.warning-budget.json` (hoje `lintWarnings: 105`, `lintErrors: 0`,
  `tsErrors: 0`). Subir o número exige decisão do dono; baixar é bem-vindo (`npm run lint:budget:ratchet`).
- "Pronto" = PR mergeada + deploy confirmado (Vercel na `main`; edge function pelo `deploy-functions.yml`)
  - comportamento verificado (log, query ou request real); faltou um → diga onde parou.
- Funcionalidade pronta = integrada ponta a ponta (rota em `src/App.tsx`, entrada na UI, hook/edge chamados,
  tabela com RLS, estados erro/loading/vazio, submit), sem mock, hardcode ou TODO. Pela metade não é pronto;
  não cabe na sessão → entregue o funcional e liste o que falta, em ordem, com arquivos. Nunca deixe código
  morto ou feature "quase" sem dizer.

## Comunicação

- Resultado primeiro, só o que muda decisão do dono. Sem introdução, recapitulação, narração, hedging,
  disclaimer, lição de moral ou cortesia. Efeito no negócio; técnica só se perguntarem. Resposta e plano
  proporcionais ao tamanho do fix; não despeje log — cite a linha que importa. Caminhos, comandos e links
  completos. Destrutivo de verdade: uma linha ("isso apaga X, sem volta — confirma?").
- Toda execução fecha com exatamente 3 "Próximos passos" (`N. [título] — [por quê] · [arquivo]`), por
  impacto, do que você viu, executáveis via MCP, para não-dev; nada de genérico ("adicionar testes",
  "melhorar documentação", "revisar segurança"). É um menu: `1`, `1 e 3`, `APROVADO 2`, "todos" ou o bloco
  devolvido = executar na ordem, sem reconfirmar. Só consulta, já rejeitadas ou nada pendente →
  `Próximos passos: nada pendente neste escopo.`

## Fluxo Git — detalhe em `docs/agentes/github-ci.md`

- Repo `adm01-debug/Loggi_Flow_V2`, `main`, **publico** (medido na API em 2026-11-23: `"visibility":"public"`).
  Consequencia: nada de segredo em commit, issue, PR ou log de CI - o mundo le. Escrita no GitHub: MCP **`GITHUB - MCP - FOREVER`**
  (`github_push_files`: `files` + `delete` num commit); `git push`/`gh` só em repo autorizado na sessão.
- Nunca commite em `main`. Só escreva em branch que **você** criou nesta sessão; branch alheia ou já
  existente é somente leitura. Antes do push, confira que o último commit é seu.
- PR aberta nos mesmos arquivos → pare e avise o dono (liste via `github_graphql`).
- Branch de `main` atualizado: `claude/<fix|feat|chore|ci|docs>-<slug>-<AAMMDD-HHMM>`.
- Commit PT-BR, 1 atômico, `<tipo>(<escopo>): <assunto>` (commitlint `config-conventional`). **Não existe
  hook `commit-msg` neste repo** (`.husky/` só tem `pre-commit` = `lint-staged`): o padrão é sua
  responsabilidade, ninguém o cobra no caminho.
- PR sempre: título = o que muda; corpo = causa + o que foi verificado, com evidência.
- Mergeie sem aprovação (squash; **apague a branch à mão** — `delete_branch_on_merge` está desligado) PR sua
  pronta: os 10 required checks verdes, sem conflito, escopo comum (front, edge function, config).
  Os 10 sao: Security Scan, Lint, Type Check, Warning Budget Gate, Unit & Integration Tests,
  Build Artifact, quality-gate, Security Audits, Agents Docs Integrity e Contratos da automacao local
  (fonte: `scripts/ci/github-settings-baseline.json`; medido na API em 2026-11-23).
  **Deixe aberta e chame o dono**: DDL/migration em produção; CI/workflows, segredos, Dockerfile; deleção de
  dado, arquitetura ou custo; conflito com PR de outro agente.
- `strict` está **desligado**: PR atrasada da `main` mergeia mesmo assim. CI de PR antiga não prova nada
  sobre a `main` de hoje — se a `main` mexeu no que você tocou, atualize a branch antes de mergear.
- Conflito: rebase em `main`; `--force-with-lease` só na sua branch.
- Merge = produção (o Vercel publica a `main`): confira o deploy e reporte. CI vermelha → leia o resumo da
  falha antes de qualquer patch; do seu merge → `fix:` em branch nova na mesma sessão.
- Fim: link da PR + estado.

## Banco — ler `docs/agentes/banco.md` antes de SQL, migration ou deploy

- Oficial: Supabase Cloud **`jvfhclubfpxrtrrazrgr`** (`supabase/config.toml:1`), SQL pelo MCP
  **`SUPABASE - LOGGI FLOW V2 - MCP`** — confira qual carregou: há vários Supabase quase homônimos na conta
  e nenhum dos outros é este banco.
- Esse MCP conecta com `service_role` e **aceita DDL**: diagnóstico é só leitura. DDL/migration em produção é
  decisão do dono — arquivo em `supabase/migrations/`, PR, e chame. **Não há staging.**
- **Não escrever** em `hgicfqjayrjurivtygqf` (Lovable Cloud, origem do cutover — só referência de paridade).
  `uwbpzfcysppwikfpnzok` é ref morto ainda citado em `index.html` e em
  `supabase/functions/send-password-reset/index.ts` — dívida, não destino.
- As migrations do repo (hoje **271** em 2026-11-26; confira com `ls supabase/migrations/*.sql | wc -l`) são
  histórico; o estado real é o banco ao vivo (e, quando ela existir, a fonte `supabase/` da branch
  `contexto`). RLS segue o padrão `SECURITY DEFINER` (`docs/adr/0014-security-definer-rls-pattern.md`);
  exclusão é lógica, por `deleted_at` (`docs/SOFT_DELETE_POLICY.md`).
- **Plano B da fonte do banco:** se `docs/contexto/supabase/` não existir ou o `manifest.json` dela acusar
  erro, consulte o banco pelo MCP `SUPABASE - LOGGI FLOW V2 - MCP` (só leitura) — e **não** use
  `docs/contexto/codigo/banco.json` como fonte de RLS nem de existência de objeto: ele não modela índice nem
  DDL dinâmico e foi dele o falso positivo "36 tabelas sem RLS". O índice da branch (`00-INDEX.md`) publica a
  idade de cada fonte; fonte velha se trata como ausente.

## Serviços

- **Vercel** — ler `docs/agentes/deploy.md` ao confirmar deploy ou mexer em env/domínio. Projeto
  `loggi-flow-v2` (team `juca1`), Vite, Node 24.x, `https://loggi-flow-v2.vercel.app`; **merge em `main` =
  deploy de produção**. Nunca segredo de servidor no Vercel; `VITE_*` vai para o bundle e é público.
- **Edge functions** — 44 em `supabase/functions/`; deploy **automatico em merge para a `main`**
  quando o diff toca `supabase/functions/**` (e tambem manual por `workflow_dispatch`), pelo
  `deploy-functions.yml`. Exige o secret `SUPABASE_ACCESS_TOKEN`. Merge em edge function **e deploy em producao**:
  confirme o run e registre o horario. Nunca `supabase functions deploy` direto.
  `verify_jwt = false` só onde a auth está no código (HMAC ou `x-internal-secret`) — ver `supabase/config.toml`.
- **Integrações externas** — Lalamove, Rodonaves, Melhor Envio, Bitrix24, Evolution/A-Ticket (WhatsApp),
  Mapbox, OpenWeather, Resend, OpenAI, Upstash Redis. Chave só em secret de edge function:
  `docs/agentes/integracoes.md`.
- **Lovable** — o repo nasceu no Lovable e ainda carrega `lovable-tagger` no build e `.lovable/`; o que você
  muda aqui não volta para lá sozinho.
- **GitHub/CI** — ler `docs/agentes/github-ci.md` ao mexer em settings, branch protection ou workflows
  (10 checks obrigatórios — inclui `Agents Docs Integrity` — `strict=false`, sem revisor obrigatório).
- **Regras de domínio** — ler `docs/agentes/regras-dominio.md` ao mexer em coleta, entrega, frete,
  gamificação, papéis de usuário ou CSP.
- **Contexto gerado para agentes** — branch gerada `contexto`, regerada por automação
  (`.github/workflows/contexto-ia.yml`). Leia **antes** do README:
  `git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md` (ou
  `raw.githubusercontent.com/adm01-debug/Loggi_Flow_V2/contexto/docs/contexto/00-INDEX.md`, ou MCP do GitHub
  com `ref=contexto`). Três fontes, cada fato com um dono: `codigo/` (rotas, hooks, edges, grafo),
  `supabase/` (banco oficial ao vivo), `regras/` (o que pode e o que não pode). Detalhe em
  `docs/agentes/contexto-ia.md`. Não edite essa branch nem abra PR dela.

## Stack e comandos — detalhe em `docs/agentes/mapa-repo.md`

- Vite + React 18 + TS (`src/`), Tailwind/shadcn, Supabase (`supabase/functions/`, `supabase/migrations/`),
  TanStack Query, Sentry, PWA; Playwright em `tests/e2e/`.
- **npm** — o gerenciador do projeto e da CI (`npm ci`, `package-lock.json`, Node 20). Os antigos `bun.lock` e
  `bun.lockb` foram removidos (etapa 272): nenhum workflow usava bun e o lock estava defasado do `package.json`.
- `npx vitest run <caminho>` (suíte inteira é longa); `npm run typecheck`; `npx eslint <arquivos>`;
  `npm run lint:budget`; `npm run test:rls`; `npm run test:security`; `npm run validate:csp`;
  `npm run validate:no-console`; `npm run security-scan`; `npm run test:e2e` (manual, precisa de usuário
  semeado); `node scripts/ci/check-claude-md-integrity.mjs` se mexer em `AGENTS.md` ou `docs/agentes/`.
- Antes de qualquer tarefa: `git show origin/contexto:docs/contexto/00-INDEX.md`. `docs/agentes/mapa-repo.md`
  antes de grep.
- Automação em `scripts/<nome>/` com README (leia antes de alterar); nunca em `supabase/` nem `src/`.

## Grafo de código (graphify)

Grafo em `graphify-out/` (`npm run graph:setup`; ver `mapa-repo.md`). Quando `graphify-out/graph.json`
existir: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<conceito>"` antes de
buscar por texto; `GRAPH_REPORT.md` só para revisão ampla. Alterou código ou o report não é do HEAD atual →
`graphify update .` (só AST). Em nuvem o grafo é gerado em segundo plano
(`.claude/hooks/session-start.sh`) — siga sem ele até terminar.
