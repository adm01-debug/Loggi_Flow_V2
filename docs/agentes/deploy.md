# Vercel e deploy — referência para agentes

Ler quando for confirmar um deploy, mexer em env vars do Vercel, domínio ou deploy de edge functions.

| O que                      | Valor                                                                                                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projeto Vercel             | `loggi-flow-v2` (`prj_nlhANvvSlulm7XwtN46kKeMhEKdw`)                                                                                                                                                                                                                                    |
| Team                       | `juca1` (`team_QyN41X0q8hrqhW80AwokbFLv`)                                                                                                                                                                                                                                               |
| URL de produção            | `https://loggi-flow-v2.vercel.app` (também é a `homepage` do repo no GitHub)                                                                                                                                                                                                            |
| Aliases                    | `loggi-flow-v2-juca1.vercel.app`, `loggi-flow-v2-git-main-juca1.vercel.app`                                                                                                                                                                                                             |
| Framework / build / output | Vite + React · `npm run build` (roda `prebuild` = `validate-csp`) · `dist/` · Node **24.x** no Vercel (a CI do GitHub usa Node 20)                                                                                                                                                      |
| Proteção                   | `ssoProtection` ligada para tudo que não é domínio próprio — preview só abre logado no time; `passwordProtection` desligada                                                                                                                                                             |
| MCP Vercel                 | `mcp__Vercel__*` — leitura é livre; **escrita é ação de produção**                                                                                                                                                                                                                      |
| Lovable                    | o projeto nasceu no Lovable (`lovable-tagger` no `vite.config.ts`, `.lovable/`, `@lovable.dev/cloud-auth-js`); app `logiflow-nexus.lovable.app` e projeto `uwbpzfcysppwikfpnzok.lovableproject.com` ainda aparecem em código. O que você muda aqui **não** volta para o Lovable sozinho |

## Deploy

### Front (Vercel)

**Merge em `main` = deploy de produção**, automático, via integração Git. Cada PR ganha um deploy de preview
(checks `Vercel`, `Vercel Preview Comments`). Depois de mergear, confirme o deploy — não diga "pronto" sem
isso:

```sh
# último deploy de produção, com o SHA que foi publicado
mcp__Vercel__list_deployments(projectId="prj_nlhANvvSlulm7XwtN46kKeMhEKdw", target="production", limit=1)
```

Verificado em 2026-11-08: `dpl_HWTLWGB7yTen4FgNKNG24KHscykv` · `state: READY` · `githubCommitRef: main` ·
`githubCommitSha: b43d84b` — a trilha `main → produção` está viva.

Rollback: `mcp__Vercel__request_rollback` para um deploy anterior marcado `isRollbackCandidate` (é ação de
produção — avise o dono).

### Edge functions (Supabase)

Deploy **automático em merge para a `main`** quando o diff toca `supabase/functions/**`, e também manual por
`workflow_dispatch` (input `only` para uma função específica): `.github/workflows/deploy-functions.yml:9-13`
contra o projeto `jvfhclubfpxrtrrazrgr`. Exige o secret `SUPABASE_ACCESS_TOKEN` (token pessoal `sbp_…`);
sem ele o job falha no primeiro passo, de propósito. Nunca rode `supabase functions deploy` direto em produção, e
confirme o run (e registre o horário) depois do merge.

Consequência: **merge na `main` publica o front e, se o diff tocar `supabase/functions/**`, também as
edges.** Quando o diff não toca `supabase/functions/**`, as edges ficam como estão e a única saída é o
dispatch manual. Mudança que dependa das duas pontas: confirme os dois runs (front e edges) e registre os
horários.

## Env vars no Vercel

### Regras

- **Nunca** segredo de servidor: este projeto é SPA estática, não tem serverless no Vercel — qualquer chave
  posta aqui não serve ao app e só aumenta superfície. Chave de integração vive em **secret de edge
  function** (`scripts/ops/set_missing_secrets.sh` lista os nomes).
- Vars `VITE_*` entram no bundle e são **públicas** — nunca segredo com esse prefixo.
- Em dev, o `.env` manda (e aponta para **produção**). `.env` está commitado neste repo: só o que é público
  por design pode entrar ali (anon key, token `pk.` do Mapbox) — ver a allowlist do `.gitleaks.toml`.

### O que está lá hoje (lido em 2026-11-08, só nomes)

- **Usadas pelo build:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_MAPBOX_TOKEN`,
  `VITE_BITRIX24_WEBHOOK`, `VITE_N8N_WEBHOOK_URL`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_APP_NAME`,
  `VITE_APP_ENV`, `VITE_SENTRY_DSN`, `VITE_ENABLE_GAMIFICATION`, `VITE_ENABLE_LALAMOVE`,
  `VITE_ENABLE_BITRIX24_SYNC` (production + preview).
- **Dívida — segredo de servidor onde não deveria existir:** `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`,
  `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`,
  `LALAMOVE_API_KEY`, `LALAMOVE_API_SECRET`, `LALAMOVE_BASE_URL`.
- **Dívida — lixo de integração:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL` —
  criadas pela integração Supabase↔Vercel (`configurationId: icfg_l6F3AhnOcvXqyj1eMSD7Jpxb`) com prefixo de
  Next.js; este projeto é Vite e não lê nenhuma delas.

Remover essas vars é mudança de produção com risco de build quebrar se alguma estiver sendo lida sem
ninguém saber: **só com o dono**, e rodando `grep -rn "<NOME>" src supabase scripts` antes de cada remoção.
As de servidor que forem removidas devem ser **rotacionadas**, não apenas apagadas.

## Pendências de deploy (dependem de decisão do dono)

1. Limpar as 13 vars de servidor + 6 de integração morta listadas acima e rotacionar as chaves expostas.
2. Domínio próprio (hoje só `*.vercel.app`) e, com ele, o `ssoProtection` deixa de proteger o acesso.
3. `index.html` e `supabase/functions/send-password-reset/index.ts` ainda apontam para o projeto Supabase
   morto `uwbpzfcysppwikfpnzok` — o reset de senha manda link para o domínio errado quando cai no fallback.
