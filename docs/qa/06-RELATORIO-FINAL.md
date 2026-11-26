# Relatório final — auditoria QA do Loggi Flow V2

> 2026-11-26 · `main` em `9bf8bac6a` · banco `jvfhclubfpxrtrrazrgr` · plano de 300 etapas em
> `docs/qa/` (achados em `03-ACHADOS.md`, execução em `05-PROGRESSO.md`)

## 1. Resultado em três linhas

- **299 das 300 etapas estão fechadas; 1 espera você (286, Sentry) e nenhuma está não iniciada.** Não existe
  mais trabalho de código parado por falta de autorização: as 22 decisões que este relatório listava em 25/11
  foram todas resolvidas entre 25 e 26/11.
- **Todas as automações de qualidade estão rodando de verdade.** `tsc` com 0 erro, 112 arquivos de teste com
  1010 casos passando, 78 avisos de lint (teto 80), RLS/segurança 19/19, e as duas suítes E2E que antes
  testavam um sistema que não existe (Nexus Core) foram reescritas contra as telas reais do LogiFlow.
- **O que ainda não tem prova** é o que só se vê fora do repositório: o erro de tela chegando ao Sentry (286),
  duas restrições de chave no painel (S-05/S-08) e o E2E entrando como check obrigatório do `main` (depende de
  mergear a PR #524, Regra 8).

## 2. O que fechou desde a versão de 25/11

| Frente                                                    | Como fechou                                                                          | Prova                                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Unicidade do código de rastreio (027)                     | PR #473 mergeada, migration `20261125154000` aplicada                                | `ux_logistica_reversa_codigo_rastreio` válido no banco oficial, 0 duplicatas            |
| Função órfã `reconcile_pending_freights()` (070)          | migration `20261125154100` aplicada                                                  | função ausente no banco; `manifest_summary` sem objeto sem dono                         |
| Schema real entregue aos agentes (263)                    | secret `SUPABASE_DB_URL` criado; branch `contexto` publica `docs/contexto/supabase/` | `manifest.json` sem erro, 563 arquivos                                                  |
| Agentes com contrato de automação (272, 274, 016, 017)    | PRs #521 e #519 mergeadas                                                            | job `Contratos da automação local` verde no `main`                                      |
| Melhor Envio / cotação por transportadora (008, 039, 041) | fluxo liberado e gravação provada ponta a ponta                                      | `cotacoes_multicanal` recebeu a linha da prova e a linha foi removida depois (0 linhas) |
| Teste de ponta a ponta (283)                              | PR #523 mergeada: suítes reescritas para as telas reais                              | 6/6 no Chromium local; contrato de persistência com 5 casos                             |
| E2E na CI                                                 | PR #524 aberta com `.github/workflows/e2e.yml`                                       | job `E2E (chromium)` verde em runner limpo do GitHub                                    |

Não há regressão conhecida nessas frentes: `main` em `9bf8bac6a` com o site `loggi-flow-v2.vercel.app`
respondendo 200 e o deploy de Production criado a partir desse commit.

## 3. O que ainda é risco, por ordem de dano

1. **Erro de tela de usuário invisível (285/286).** Enquanto `VITE_SENTRY_DSN` não estiver no Vercel, falha em
   produção não deixa registro — foi assim que os bugs desta auditoria chegaram até você por print. O
   `ErrorBoundary.componentDidCatch` já chama `Sentry.captureException`; sem DSN a chamada é no-op.
2. **Proteção da `main` incompleta.** A branch protection tem 10 contexts obrigatórios e o job novo
   `E2E (chromium)` **não** está entre eles; além disso `strict = false`, então verde numa PR antiga não prova
   nada sobre a `main` de hoje. Enquanto a #524 não for mergeada e o job não entrar nos required checks, o
   E2E verde de hoje não bloqueia regressão nenhuma.
3. **Modo de teste e segredo de webhook só conferíveis no painel (002, 010, 011, S-05, S-08).**
   `NEXUS_WEBHOOK_SECRET`, `ALLOW_TEST_MODE` e o token do Mapbox não são legíveis do repositório: com o modo
   de teste ligado em produção, um webhook de teste passa como verdadeiro.
4. **Teste de tela, por dentro (H-13).** O E2E cobre os caminhos críticos, mas nenhuma tela tem teste
   unitário — o miolo do achado segue aberto. Os marcadores de `03-ACHADOS.md` contam hoje 7 achados
   resolvidos, 4 parciais (H-02 a H-04 e H-12, todos de documentação) e 4 abertos: H-09 (a fonte do fato
   "banco" — a 263 fechou e o marcador não foi atualizado), H-11 (allowlist de vulnerabilidades com entradas
   obsoletas), H-13 e H-14 (observabilidade — as 288 a 290 fecharam, a 285/286 não).
5. **14 PRs do Dependabot abertas, 6 delas bump major** (Sentry 10→11, react-i18next 17→18, framer-motion
   13→14, lucide 0.462→1.77, tailwind-merge 2→3, sonner 1→2). Não foram mergeadas de propósito: major sem
   verificação de tela é risco de regressão, que é justamente o que o dono proibiu.
6. **`crm_seller_identity_links` no banco de produtos `doufsxqlfjyuvxuezpln` tem RLS habilitada e zero
   policies.** Ninguém lê a tabela pela API: ou é feature pela metade, ou é dado que só o `service_role`
   deveria tocar. Decisão de negócio, registrada em `docs/seguranca/banco-produtos-doufsxqlfjyuvxuezpln/`.

## 4. As decisões que sobraram

| Item                                                          | O que você decide                                              | Recomendação                                                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [#524](https://github.com/adm01-debug/Loggi_Flow_V2/pull/524) | Mergear o workflow de E2E (Regra 8: toca `.github/workflows/`) | Sim — o job já rodou verde em runner limpo; depois disso incluir `E2E (chromium)` nos required checks |
| `VITE_SENTRY_DSN` (285/286)                                   | Informar o DSN do projeto Sentry                               | Sim — é a última etapa `[~]` do plano e o único jeito de erro de tela virar registro                  |
| 6 PRs major do Dependabot                                     | Autorizar uma por vez, com conferência de tela                 | Comece pelas de menor risco (tailwind-merge, sonner); Sentry e react-i18next por último               |
| Painel (S-05, S-08)                                           | Conferir os três valores no Supabase e no Mapbox               | Registrar `ALLOW_TEST_MODE=false` em produção                                                         |

## 5. Os números

| Indicador                            | Valor                                                             | Fonte                                      |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------ |
| Etapas do plano                      | **299 concluídas / 1 esperando você / 0 não iniciadas**           | `05-PROGRESSO.md` em `9bf8bac6a`           |
| PR aberta no plano                   | nenhuma de código; **#524** aberta por ser Regra 8                | `gh pr list` em 2026-11-26                 |
| Achados                              | **7 resolvidos / 4 parciais / 4 abertos** (de 15)                 | marcadores de estado de `03-ACHADOS.md`    |
| `tsc --noEmit`                       | 0 erros                                                           | medido em 2026-11-26                       |
| Lint                                 | **78 avisos / 0 erros** (era 105), teto cravado em 80/80          | medido em 2026-11-26                       |
| Testes de unidade                    | **112 arquivos / 1010 testes / 0 falha**                          | medido em 2026-11-26                       |
| Cobertura                            | 77,78 statements · 72,24 branches · 75,16 functions · 79,88 lines | medido em 2026-11-26                       |
| Testes de E2E                        | 6 casos em Chromium local + job `E2E (chromium)` verde na CI      | PR #523 e PR #524                          |
| RLS e segurança                      | 19/19 testes                                                      | medido em 2026-11-26                       |
| `.env` rastreado                     | 0 arquivos                                                        | etapa 299                                  |
| `SECURITY DEFINER` sem `search_path` | **0**                                                             | etapa 299                                  |
| Edge functions                       | 44                                                                | `inventario/estado/edges.json`             |
| Telas com rota                       | 61                                                                | `inventario/estado/rotas.json`             |
| Cron jobs no banco                   | 28 jobs, **0 com falha** na última execução                       | `inventario/estado/banco.json` + etapa 290 |

Os itens `inventario/estado/*` foram gerados em 2026-11-24 e não foram regerados desde então: servem como
ordem de grandeza, não como medição do commit atual.

## 6. O que a auditoria não pode verificar

- **As três restrições de chave** (S-05 `ALLOW_TEST_MODE`, S-08 URL do token Mapbox, 285 DSN do Sentry): só
  existem no painel. O código foi conferido; o valor em produção, não.
- **Efeito em produção das correções de front.** O deploy do Vercel sobe a cada merge e o site responde 200,
  mas sem Sentry não há prova de que a tela corrigida se comporta como o teste diz.
- **Comportamento após o merge da #524.** O job rodou verde na PR; que ele continue verde em cada push futuro
  da `main` só se confirma depois de mergeado.
- **Proteção de branch**: `strict = false` — CI verde numa PR antiga não prova nada sobre a `main` de hoje.
- **O banco ao vivo, só em parte:** as consultas de 2026-11-24 fecharam F-02, F-03, P-05 e P-06 e provaram que
  `webhook_failures` e `cron_job_logs` não existem; o que depende de painel (S-05, S-08) segue como hipótese.
- **O banco de produtos:** o endurecimento de 25/11 foi conferido ao vivo (`mv_product_compositions` deixou de
  ser legível pelo `anon`), mas o endpoint OpenAPI daquele projeto exige secret key, então não houve
  inventário completo — só a lista de tabelas com grant a `anon` que a auditoria levantou.

**Aprendizado que evita a repetição:** documento sem data, sem commit e sem o nome do banco custou mais caro que
qualquer bug encontrado — foi o que fez uma auditoria inteira nascer de um `ESTADO_ATUAL.md` que descrevia um
sistema que já não existia. Por isso o inventário semanal agora datado (`inventario/estado/contagens.json`,
etapa 257) e os gates de CI passaram a conferir os fatos que os documentos afirmam (etapas 248, 255 e 273).
