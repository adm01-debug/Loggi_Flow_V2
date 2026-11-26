# Auditoria de cobertura da UI — censo de objetos de banco x consumidor

Data: 2026-11-26 · base: `main` `cdc670d7c` · método: catálogo ao vivo de produção cruzado com o código.

## O que este documento responde

O objetivo do plano é que **todo objeto de backend tenha tela**. Esta é a medição que prova (ou derruba) essa afirmação: quais tabelas, views e funções existem no banco de produção e quais têm consumidor no código — tela, hook, edge function, cron, trigger ou outra função.

## Como foi medido

1. **Catálogo ao vivo** do banco de produção `jvfhclubfpxrtrrazrgr`: `pg_class` (relkind `r`/`p`/`v`/`m`), `pg_proc`, `pg_trigger`, `pg_inherits`, `pg_get_viewdef`, `pg_get_functiondef`, `pg_stat_user_tables.n_live_tup`, `cron.job.command`.
2. **Cruzamento com o código**: busca pelo nome do objeto em `src/`, `supabase/functions/`, `supabase/migrations/` e `tests/`.
3. **Dependências internas**: função → função (corpo), view → tabela, cron → função, trigger → função.
4. **Armadilhas tratadas** (todas geraram falso positivo na primeira passada e foram corrigidas): o `src/integrations/supabase/types.ts` é gerado e cita todas as tabelas — foi excluído pelo **nome do arquivo**; 31 partições (`audit_logs_y2026m*`, `rastreamento_historico_y2026m*`) citam o nome-base e não são órfãs, são filhas de tabela particionada em uso; tabela lida por RPC aparece "sem tela" mesmo tendo tela.

## Números

| Medida                            | Valor                                                             |
| --------------------------------- | ----------------------------------------------------------------- |
| Relações no schema `public`       | 137 (106 normais, 31 partições, 4 views `v_prediction_accuracy*`) |
| Funções                           | 116                                                               |
| Cron jobs                         | 28                                                                |
| Tabelas com estatística de linhas | 133                                                               |
| **Objetos totalmente órfãos**     | **0**                                                             |

Nenhuma tabela, view ou função do banco ficou sem _nenhum_ consumidor. O que existe é um bloco de objetos com consumidor parcial ou nenhum uso de negócio, detalhado abaixo.

## 1. Tabelas sem tela (13)

| Tabela                      | Linhas | Policies | Veredicto                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db_health_score_history`   | 142    | 1        | **TEM TELA** (falso positivo) — RPC `get_health_score_history_fast` chamada em `src/features/db-observability/hooks/useHealthScoreHistory.ts:22`, renderizada por `src/pages/admin/DbHealth.tsx:43`                                                                                                                                                                                                                                                                                 |
| `business_rules_config`     | 24     | 2        | **TEM TELA + LEITOR** (supera o veredicto anterior de 26/11) - o painel `Integracao Bitrix24` grava as tres chaves de SPA e a edge function `bitrix24-integration` le a tabela antes de cada chamada (`supabase/functions/bitrix24-integration/index.ts:60-83`, commit `1549d6fc2` / #537). A tela `/automacao-regras` continua usando `business_rules`, que e outra tabela. As outras 21 chaves seguem sem leitor                                                                  |
| `contract_test_logs`        | 1775   | 1        | **MANTER, sem tela** — medido em 26/11 no banco oficial: 1.775 linhas, **todas `is_valid` = false**, 1.704 delas de `lalamove-webhook`, todas com o mesmo erro (`eventType` ausente), `latency_ms` = 0 e `payload_hash` nulo; a mais nova e de 22/11, ou seja, **nenhuma linha depois do commit `b31440015`**, que trocou o payload bruto pelo hash. Nao existe escritor automatico: a unica rotina que toca a tabela e a retencao de 26/11 (`cron.job` 103, `cleanup-contract-test-logs-daily`, 03:45, 30 dias). Decisao: reter com cron, sem tela |
| `system_contract_schemas`   | 3      | 1        | **REMOVIDO** (migration `20261126170000`, 26/11) - guardava 3 contratos JSON e nenhum codigo lia a tabela: a validacao real e feita dentro das edge functions por `_shared/contract-validator.ts` (usado por 5 delas, com log em `contract_test_logs`); o unico leitor, `validate_payload_schema`, saiu na `20261126130000`. As 3 linhas estao no rollback                                                                                                                          |
| `carrier_rankings`          | 0      | 1        | **MANTER** — mantida pelo trigger `entregas.trigger_update_carrier_ranking` → `update_carrier_ranking()`. Não tem tela: `src/components/dashboard/TransportadoraRanking.tsx` não lê a tabela nem RPC                                                                                                                                                                                                                                                                                |
| `driver_badges`             | 0      | 2        | **REMOVIDO** (migration `20261126170000`, 26/11) - duplicata vazia: a gamificacao em producao usa `achievements` + `user_achievements` (`src/pages/Conquistas.tsx`); `driver_badges` nunca entrou no fluxo                                                                                                                                                                                                                                                                          |
| `organizations`             | 0      | 2        | **MANTER** (decidido em 26/11) - o multi-tenant nunca foi ligado, mas a tabela tem FK entrante (`profiles.organization_id`, `fretes_internos.organization_id`) e a RPC `get_current_organization_id` aparece em 3 policies ativas; remover seria mudanca de arquitetura, nao limpeza                                                                                                                                                                                                |
| `account_lockouts`          | 0      | 2        | **REMOVIDO** (migration `20261126170000`, 26/11) - nao existe bloqueio por tentativa de login no app (so `login_attempts` e gravada); bloqueio de login e do Supabase Auth                                                                                                                                                                                                                                                                                                          |
| `allowed_ips`               | 0      | 5        | **REMOVIDO** (migration `20261126170000`, 26/11) - duplicata vazia: as telas usam `ip_access_rules` e `geo_blocking_rules` (`src/components/security/IPAccessControl.tsx`)                                                                                                                                                                                                                                                                                                          |
| `email_verification_tokens` | 0      | 1        | **REMOVIDO** (migration `20261126170000`, 26/11) - a verificacao de e-mail e feita pelo Supabase Auth, nao pelo app                                                                                                                                                                                                                                                                                                                                                                 |
| `ai_chat_messages`          | 0      | 3        | **TEM TELA + PERSISTENCIA** (ligado em 26/11) - o painel `AIAssistant` grava cada turno aqui e recarrega os ultimos 50 ao abrir (painel da IA no dashboard)                                                                                                                                                                                                                                                                                                                         |
| `notification_templates`    | 0      | 2        | **REMOVIDO** (migration `20261126170000`, 26/11) - duplicata vazia: as notificacoes usam a tabela `notifications` (`src/pages/Notificacoes.tsx`); toast/Sonner e so o aviso na tela                                                                                                                                                                                                                                                                                                 |
| `freight_webhooks`          | 0      | 1        | **MANTER** — tabela de entrada de webhook de transportadora; só os testes de RLS a citam (`tests/security/integrations-access.spec.ts:35`)                                                                                                                                                                                                                                                                                                                                          |
| `system_adr`                | 0      | 1        | **REMOVIDO** (migration `20261126170000`, 26/11) - duplicata vazia: a tela `/admin/adr` grava e le `architecture_decisions` (`src/pages/AdminADR.tsx:63`)                                                                                                                                                                                                                                                                                                                           |

## 2. Funções sem chamador (15)

| Função                              | Assinatura                             | Veredicto                                                                                                                                                           |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_trigger_func`                | —                                      | **REMOVER** — 0 triggers. A função de auditoria realmente em uso é `audit_log_trigger`, com **61 triggers** anexados                                                |
| `fn_audit_trigger`                  | —                                      | **REMOVER** — mesma duplicata, 0 triggers                                                                                                                           |
| `tr_increment_version`              | —                                      | **REMOVER** — 0 triggers                                                                                                                                            |
| `update_fretes_internos_updated_at` | —                                      | **REMOVER** — 0 triggers (`updated_at` de `fretes_internos` é resolvido pelo trigger de auditoria)                                                                  |
| `update_performance_metrics`        | —                                      | **REMOVER** — 0 triggers                                                                                                                                            |
| `xp_for_level`                      | `lvl integer`                          | **MANTER** — é chamada por `calculate_level`, que é chamada pelo RPC `add_user_xp` (vivo)                                                                           |
| `jsonb_recursive_merge`             | `a jsonb, b jsonb`                     | **REMOVER** — helper sem chamador                                                                                                                                   |
| `mcp_exec_many`                     | `statements text[], max_rows integer`  | **MANTER** — interface do servidor MCP; `EXECUTE` só para `postgres` e `service_role` (não exposta a `anon`/`authenticated`)                                        |
| `purge_webhook_inbound_failures`    | `_keep_days integer DEFAULT 90`        | **LIGADO em 26/11** — `cron.job` 102 `purge-webhook-inbound-failures-daily` (03:35) chama `purge_webhook_inbound_failures(90)`; `webhook_inbound_failures` tem 0 linhas. Ver Adendo (5) |
| `validate_payload_schema`           | `p_entity_name text, p_payload jsonb`  | **REMOVER** — stub explícito: `RETURN TRUE` incondicional, com o próprio comentário do autor dizendo que a validação seria tratada nas edge functions; sem chamador |
| `system_health_check` | - | **REMOVIDO** - devolvia `healthy`/`production-grade` fixos, sem medir nada (PR #547) |
| `get_dashboard_metrics_fast` | - | **REMOVIDO** - wrapper `SECURITY DEFINER` sem chamador; a MV que ele lia nao tem outro leitor (PR #547) |
| `get_carrier_performance_fast` | - | **REMOVIDO** - mesma situacao (PR #547) |
| `has_permission` | `_user_id uuid, _permission_code text` | **MANTER** - camada RBAC/multi-tenant, mantida junto com `organizations` (0 chamador hoje) |
| `get_current_organization_id` | - | **MANTER** - sustenta 3 policies ativas (`fretes_internos` SELECT/INSERT, `audit_logs` SELECT) |

## 3. Módulos de `src/` sem importador (6) — resolvidos

Removidos na **PR #526** (mergeada em `cdc670d7c`), 1 commit por arquivo: `src/components/common/TiltCard.tsx`, `src/components/gamification/GamificationPanel.tsx`, `src/features/logistics/services/LogisticsService.ts`, `src/integrations/shared/api-schemas.ts`, `src/utils/logger.ts` e `src/hooks/gamification/useGamification.tsx`.

O último é o **veredicto da etapa 080**, que estava como "INDEFINIDO: aguarda decisão do dono" (`05-PROGRESSO.md:138`): `npx tsc --noEmit --traceResolution` resolve `@/hooks/gamification/useGamification` sempre para o `.ts` (o Vite resolve `.ts` antes de `.tsx`), os 12 importadores usam o caminho sem extensão, nenhum usa os helpers que só existiam no `.tsx` (`xpForLevel`, `calculateLevel`, `calculateLevelProgress`) e o `.ts` é a versão alinhada ao banco real (`user_levels`, `achievements`, `user_achievements`, `reward_items`, RPC `add_user_xp`). Era a única das duas implementações alcançável.

## 4. Achados colaterais (bugs reais, um por linha)

1. **RESOLVIDO em 26/11** (era: a tabela de falhas de webhook cresce sem limite). `purge_webhook_inbound_failures(90)` agora tem `cron.schedule` diario (`cron.job` 102, 03:35, criado pela migration `20261126120000`); a tabela esta com 0 linhas e a primeira execucao e 27/11 03:35 UTC.
2. **A camada de contrato de payload funciona de ponta a ponta, e o que sobrou dela é lixo de teste dentro de produção.** As 5 edge functions (`carrier-webhook-receiver`, `ocr-receipt-processor`, `normalize-freight-response`, `lalamove-webhook`, `rodonaves-webhook`) chamam `validateContract` de `supabase/functions/_shared/contract-validator.ts`, devolvem **400 com a lista de erros** quando o payload não bate e gravam o resultado em `contract_test_logs`. Só que **100% das 1.775 linhas são fuzz** (`{"invalid": "__fuzz__"}`), sem nenhuma falha real de parceiro — os payloads vêm dos 37 `index_test.ts` do repo, que montam a URL com `VITE_SUPABASE_URL` do ambiente: com o ambiente apontando para produção, o smoke test grava no banco de produção (1.512 linhas em novembro, contra 138 em setembro). A validação em si está sã; o defeito é de ambiente e de retenção. O par de banco `system_contract_schemas` + `validate_payload_schema` é a sobra desse desenho (cópia dos contratos + stub que sempre retorna TRUE e ninguém chama), e o `src/integrations/shared/api-schemas.ts` removido na #526 (36 linhas zod, zero importadores) foi uma terceira tentativa do mesmo assunto, abandonada antes de ser ligada e recuperável no git.
3. **`business_rules_config` passou a ter efeito em runtime em 26/11.** As 24 chaves seguem gravadas; as tres de SPA (`bitrix_spa_coletas_id`, `bitrix_spa_entregas_id`, `bitrix_spa_ocorrencias_id`) sao lidas pela edge function `bitrix24-integration` (`index.ts:60-83`, #537) e gravadas pelo painel `Integracao Bitrix24`. Ver Adendo 4.
4. **4 RPCs `SECURITY DEFINER` expostas a `authenticated` e sem chamador no app**: `get_dashboard_metrics_fast`, `get_carrier_performance_fast`, `has_permission`, `get_current_organization_id`. Superfície sem uso (não é vazamento: nenhuma delas devolve dado de outra linha sem RLS, mas é superfície que ninguém usa).
5. **Comentários apontando para o arquivo removido.** `src/services/api/authService.ts:43` e `src/hooks/gamification/useGamification.ts:16` diziam "schema em uso pelo `useGamification.tsx`"; corrigidos na mesma PR desta auditoria.

## 5. O que este documento NÃO afirma

- **Não houve clique autenticado no navegador.** "Tem tela" aqui significa "existe caminho de código do componente até a rota" (import → render → `App.tsx`), não "eu vi funcionando".
- **As 9 tabelas vazias não foram julgadas por intenção de negócio** — só pelo fato de não haver leitor nem escritor no código. Manter ou remover é decisão do dono.
- **Um veredicto deste documento mudou durante a própria auditoria:** `system_contract_schemas` começou como “par inerte” (a função não tinha chamador) e virou **LIGAR** ao ler as 3 linhas da tabela e ver que as entidades são edge functions vivas. Registrado para calibrar a confiança das outras linhas.
- **Os artefatos de inventário continuam datados.** `inventario/estado/*` e `.tools/graphify/output/*` são de 2026-11-24 e ainda citam os 6 arquivos removidos na #526; regenerá-los é higiene separada.

## Decisões que dependem do dono

| #   | Decisão                                                                                                                                                                                                                                                                         | Objetos                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **RESOLVIDO em 26/11** — o cron `purge-webhook-inbound-failures-daily` (job 102, 03:35) agenda `purge_webhook_inbound_failures(90)`; `webhook_inbound_failures` tem 0 linhas | `purge_webhook_inbound_failures` + `webhook_inbound_failures` |
| 2   | Remover as 6 funções **REMOVER** acima                                                                                                                                                                                                                                          | `audit_trigger_func`, `fn_audit_trigger`, `tr_increment_version`, `update_fretes_internos_updated_at`, `update_performance_metrics`, `jsonb_recursive_merge` |
| 2b  | **RESOLVIDO em 26/11** — nada foi apagado a mao: a retencao de 30 dias (`cleanup-contract-test-logs-daily`, job 103, 03:45) apaga as 1.775 linhas em no maximo 30 dias (263 ja vencidas saem em 27/11); nenhum registro novo desde 22/11 e o payload ja nao e gravado (hash desde `b31440015`) | `contract_test_logs`, `supabase/functions/*/index_test.ts` |
| 3   | **RESOLVIDO em 26/11** - migration `20261126170000` removeu `system_adr` e as outras 6 tabelas comprovadamente mortas, com rollback em `supabase/rollbacks/`                                                                                                                    | `system_adr`, `system_contract_schemas`, `driver_badges`, `account_lockouts`, `allowed_ips`, `email_verification_tokens`, `notification_templates`           |
| 4   | **RESOLVIDO em 26/11** - tela e leitor ja existem: o painel `Integracao Bitrix24` grava as tres chaves de SPA e a edge function le a tabela (`index.ts:60-83`, #537). Nao remover a tabela                                                                                      | `business_rules_config`                                                                                                                                      |
| 5   | **PARCIALMENTE RESOLVIDO em 26/11** - as 4 tabelas vazias sairam na migration `20261126170000`; `organizations` + `get_current_organization_id` + `has_permission` ficam porque tem FK entrante e 3 policies ativas. O que falta decidir e se o multi-tenant liga ou sai de vez | `organizations`, `has_permission`                                                                                                                            |

## Adendo 2026-11-26 (verificacoes feitas depois do merge deste documento)

1. **`contract_test_logs` parou de guardar payload em 23/11.** As 1.775 linhas tem payload `{"invalid": "__fuzz__"}`, mas nenhuma e posterior a 22/11: o commit `b31440015` (etapa 015, #298, 23/11) tirou o corpo do payload do insert e passou a gravar `payload_hash`. Ou seja, a pendencia de LGPD ja esta resolvida; o que sobra e a retencao (PR #528).
2. **`business_rules_config` nao e so uma tabela sem leitor: os valores reais estao hardcoded.** Os IDs de SPA do Bitrix existem nos dois lugares: `bitrix_spa_coletas_id=1186` e `bitrix_spa_entregas_id=1234` na tabela, e `body.spa_id || 1186` / `|| 1234` em `supabase/functions/bitrix24-integration/index.ts:68, 96, 153, 197` (os quatro pontos de default). Quem edita a tabela nao muda comportamento nenhum; quem manda `spa_id` no corpo, sim. As outras 22 chaves (moedas, SLA, IDs de etapa) nao aparecem em nenhum arquivo do repo.
3. **As 7 funcoes do veredicto REMOVER foram reconferidas no catalogo antes de virarem migration:** 0 triggers, 0 mencoes no corpo de outra funcao, 0 policies, 0 cron jobs e nenhuma chamada em `src/`, `supabase/functions/` ou `scripts/`. Nenhuma tem `REVOKE` de `PUBLIC`, entao hoje todas respondem em `POST /rest/v1/rpc/<nome>` com a chave publica (PR #529).
4. **A tabela `business_rules_config` deixou de ser inerte em 26/11.** O commit `1549d6fc2` (#537) tirou os IDs de SPA de dentro do codigo: a edge function `bitrix24-integration` le `bitrix_spa_coletas_id`, `bitrix_spa_entregas_id` e `bitrix_spa_ocorrencias_id` da tabela antes de qualquer chamada (`supabase/functions/bitrix24-integration/index.ts:60-83`) e usa `SPA_IDS_PADRAO` (1186/1234/1050) apenas como ultimo recurso se a leitura falhar. O painel `Integracao Bitrix24` (`src/pages/IntegracaoBitrix.tsx:38-52, 148-186`) grava essas chaves com `upsert` e exibe o valor salvo. Consequencia: a decisao 4 da secao anterior deixa de existir e as linhas 33 e 77 deste documento ficam superadas por este item. As outras 21 chaves (moedas, SLA, IDs de etapa) continuam sem leitor no repo.
5. **Reverificacao de 26/11, depois da #529 (catalogo de producao).** 110 funcoes em `public`: 83 chamadas por `src/` ou `supabase/functions/` e as outras 27 sao funcoes de trigger, todas com pelo menos um trigger ativo (0 orfas). Das 44 edge functions, 39 tem chamador no front; das 5 restantes, 4 rodam por `cron.job` (`db-regression-monitor` job 89, `db-health-snapshot` 90, `db-health-weekly-report` 91, `predict-delays-scheduled` 99) e `ingest-biosync` e endpoint autenticado de ingestao, cujo leitor (`useBiometricAnomalies` -> `LogisticsMapWidget`) e configurador (`BioSyncConfig`, 1 regra ativa em `bio_sync_alert_rules`) existem. RLS: 131 tabelas, todas com RLS habilitada e ao menos uma policy. As 7 funcoes da #529 estao de fato fora do banco (0 linhas no catalogo).

## Adendo 2026-11-26 (2) - as tabelas DECIDIR viraram migration

1. **As 7 tabelas foram reconferidas no catalogo de producao antes de virarem `DROP`** (migration `20261126170000_remove_tabelas_mortas_sem_consumidor.sql`): 0 FK entrante (`pg_constraint`), 0 view/materialized view dependente, 0 funcao citando o nome no corpo (`pg_proc.prosrc`), 0 policy de outra tabela citando o nome, e nenhuma mencao em `src/`, `supabase/functions/` ou `scripts/` fora das migrations e dos tipos gerados. Linhas: 0 em todas, menos `system_contract_schemas` com 3 fixtures.
2. **O `DROP` nao usa `CASCADE` de proposito** - se aparecer dependencia nova, a migration falha em vez de levar objetos junto.
3. **Nada foi perdido:** `supabase/rollbacks/20261126170000_rollback_remove_tabelas_mortas.sql` recria as 7 tabelas exatamente como estavam (pg_dump 17.12 `--schema-only`: colunas, defaults, 14 policies, indices, grants e RLS habilitada) e reinsere as 3 linhas de `system_contract_schemas`.
4. **Ganho de superficie:** as 7 tabelas tinham `GRANT SELECT` para `anon` (default do Supabase), bloqueado apenas pela RLS. Com o `DROP`, a linha some do `grants-baseline` - o `types-sync` regenera os artefatos derivados.
5. **`organizations` + `get_current_organization_id()` + `has_permission()` ficam.** `profiles.organization_id` e `fretes_internos.organization_id` apontam para a tabela, e a RPC sustenta 3 policies (`fretes_internos` SELECT/INSERT e `audit_logs` SELECT). Hoje elas sao permissivas somadas a `auth.uid() IS NOT NULL`, entao nao bloqueiam nada - mas apagar FK, coluna e policy e mudanca de arquitetura (multi-tenant), nao limpeza. Registrado aqui para nao virar divida invisivel.

## Adendo 2026-11-26 (3) - `ai_chat_messages` ganhou tela e persistencia

1. **O veredicto DECIDIR estava errado.** Existe chat de IA na UI: `src/components/ai/AIAssistant.tsx` chama a edge
   function `ai-logistics-assistant` (streaming real sobre `transportadoras`, `entregas` e `ocorrencias`). O que
   faltava era persistencia: `conversationHistory` vivia so em memoria e o botao `Trash2` so limpava o estado local.
2. **Agora grava e le de verdade:** `src/hooks/ai/useHistoricoChat.ts` insere um turno por mensagem (`user_id` +
   `role` + `content`), recarrega os ultimos 50 turnos (`created_at desc` + `reverse()`) e apaga somente as linhas do
   proprio usuario no `Trash2`. O escopo e a RLS da tabela (SELECT/INSERT/DELETE por `auth.uid() = user_id`, TO
   authenticated).
3. **Contrato coberto por teste:** `tests/contracts/ia-historico-persistente.spec.tsx` (5 casos, duplo do cliente em
   `tests/contracts/ia-historico-fixtures.ts`) prova o teto de 50 linhas, o `user_id` dos dois turnos, a exclusao
   escopada, a conversa seguindo quando a gravacao falha e nenhuma consulta quando nao ha sessao.
4. **Sem regressao:** falha de leitura ou gravacao nao interrompe o streaming; o usuario recebe um `toast` unico por
   sessao.

## Adendo 2026-11-26 (4) - a camada "fast metrics" saiu do banco

1. **Os tres vereditos DECIDIR de funcao viraram REMOVIDO** na migration
   `20261126190000_remove_camada_fast_metrics_sem_leitor.sql` (PR #547): `system_health_check()`,
   `get_dashboard_metrics_fast()` e `get_carrier_performance_fast()`.
2. **`system_health_check()` mentia.** Devolvia `status: 'healthy'`, `database: 'online'`,
   `env: 'production-grade'` e `audit_compliance: true` fixos, sem consultar nada. A tela `/admin/db-health`
   usa `persist_global_health_score` + `get_health_score_history_fast`.
3. **Os dois wrappers eram o unico leitor das MVs internas.** `internal.mv_dashboard_metrics` (1 linha) e
   `internal.mv_carrier_performance` (5 linhas) existiam para acelerar o dashboard, mas o dashboard calcula
   ao vivo nas tabelas. Sem os wrappers, o cron `refresh-dashboard-views-5m` (job 54, `*/5 * * * *`, 288
   execucoes/dia, 57-329 ms cada) atualizaria MV sem leitor - por isso `refresh_dashboard_views()`, as duas
   MVs e o job saem juntos.
4. **As MVs nao devem virar UI.** Elas agregam `coletas`, `entregas` e `transportadoras` de todas as
   organizacoes, sem filtro de RLS: expor o resultado a `authenticated` mostraria numero de outro tenant.
   Manter o dashboard lendo as tabelas e decisao de seguranca, nao de performance.
5. **`has_permission()` e `get_current_organization_id()` ficam** (mesma decisao do Adendo (2) item 5): a
   segunda sustenta 3 policies ativas e as duas sao a camada RBAC/multi-tenant.
6. **Rollback testado:** `supabase/rollbacks/20261126190000_rollback_remove_camada_fast_metrics.sql` rodou
   junto com a migration dentro de uma transacao revertida no banco oficial - recriou as 2 MVs, os 3 indices,
   as 4 funcoes com os grants originais e o cron; o `ROLLBACK` devolveu o estado anterior (4 funcoes, 2 MVs,
   1 cron).

## Adendo 2026-11-26 (5) - retencao de logs medida, cron conferido e camada fast-metrics aplicada

1. **Os dois cron de retencao existem, estao ativos e nunca rodaram por um motivo banal.** `cron.job` 102
   (`purge-webhook-inbound-failures-daily`, `35 3 * * *`) e 103 (`cleanup-contract-test-logs-daily`,
   `45 3 * * *`) foram criados pela migration `20261126120000` em 26/11 por volta de 12:00 UTC - o horario dos
   dois (03:35 e 03:45 UTC) ja tinha passado, entao `execucoes = 0` era esperado, nao bug. Primeira execucao:
   27/11 03:35 e 03:45 UTC.
2. **`webhook_inbound_failures`: 0 linhas.** A decisao 1 do censo esta fechada; nao ha acumulo para limpar.
3. **`contract_test_logs`: 1.775 linhas medidas, nenhuma e falha de parceiro em producao.** Todas com
   `is_valid = false`, 1.704 concentradas em `lalamove-webhook`, todas com o mesmo erro (`eventType` ausente),
   `latency_ms = 0` e `payload_hash` nulo; a mais recente e de 22/11. Nenhum registro novo desde entao, e a
   retencao de 30 dias resolve o passado sem `DELETE` manual.
4. **A camada fast-metrics saiu do banco oficial em 26/11.** PR #547 (merge `ccea0b65a`) e workflow
   `Aplicar Migration` (run 45890225703, `success`). Prova no catalogo depois do apply: `pg_proc` com as 4
   funcoes = 0, `pg_class` das 2 MVs internas = 0, `cron.job` com `refresh-dashboard-views-5m` = 0,
   `supabase_migrations.schema_migrations` com a versao
   `20261126190000_remove_camada_fast_metrics_sem_leitor.sql`; `has_permission` e
   `get_current_organization_id` seguem existindo com `prosecdef = true`, ou seja, as 3 policies de
   `fretes_internos` e `audit_logs` que dependem da segunda nao foram afetadas.
5. **`carrier_rankings`: o veredicto MANTER fica de pe e o trigger existe.** `pg_trigger` ligado a
   `pg_proc.proname = 'update_carrier_ranking'` devolve `trigger_update_carrier_ranking on entregas` com
   `tgenabled = 'O'` (habilitado). A tabela esta em 0 linhas porque `entregas` tambem esta (0 linhas), nao
   porque o gatilho falte; a UI de ranking usa `transportadoras.score_performance`, que tem 5 linhas
   homologadas. Sem tela nova enquanto nao houver entrega real.

