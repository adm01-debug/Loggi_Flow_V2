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

| Tabela                      | Linhas | Policies | Veredicto                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db_health_score_history`   | 142    | 1        | **TEM TELA** (falso positivo) — RPC `get_health_score_history_fast` chamada em `src/features/db-observability/hooks/useHealthScoreHistory.ts:22`, renderizada por `src/pages/admin/DbHealth.tsx:43`                                                                                                                                                               |
| `business_rules_config`     | 24     | 2        | **MANTER + decidir quem lê** — 24 chaves de negócio gravadas (`bitrix_spa_coletas_id = 1186`, `coins_entrega_no_prazo = 10`, `coleta_sla_hours_outros = 72`) e **nenhum leitor**: só o `audit_log_trigger` cita o nome. A tela `/automacao-regras` (`src/pages/AutomacaoRegras.tsx` → `BusinessRulesManager`) usa `business_rules`, que é outra tabela (7 linhas) |
| `contract_test_logs` | 1775 | 1 | **MANTER, sem tela** — é o log da validação de contrato gravado por `_shared/contract-validator.ts`; as 1.775 linhas são **artefato de teste**, não falha de parceiro: todas têm payload `{"invalid": "__fuzz__"}`, enviado pelos 37 `supabase/functions/*/index_test.ts` do próprio repo. Esses smoke tests usam `VITE_SUPABASE_URL` do ambiente, então quando o ambiente aponta para produção **o teste escreve no banco de produção**. Decisão: limpar/reter, não construir tela |
| `system_contract_schemas` | 3 | 1 | **REMOVER** — guarda 3 contratos JSON, mas nenhum código lê a tabela: a validação real é feita dentro das edge functions por `_shared/contract-validator.ts` (usado por 5 delas, com log em `contract_test_logs`) |
| `carrier_rankings`          | 0      | 1        | **MANTER** — mantida pelo trigger `entregas.trigger_update_carrier_ranking` → `update_carrier_ranking()`. Não tem tela: `src/components/dashboard/TransportadoraRanking.tsx` não lê a tabela nem RPC                                                                                                                                                              |
| `driver_badges`             | 0      | 2        | **DECIDIR** — a gamificação em produção usa `achievements` + `user_achievements` + `driver_badges` está fora do fluxo                                                                                                                                                                                                                                             |
| `organizations`             | 0      | 2        | **DECIDIR** — par com `get_current_organization_id` e `has_permission`; o multi-tenant nunca foi ligado                                                                                                                                                                                                                                                           |
| `account_lockouts`          | 0      | 2        | **DECIDIR** — bloqueio por tentativa de login não implementado (só `login_attempts` é gravada)                                                                                                                                                                                                                                                                    |
| `allowed_ips`               | 0      | 5        | **DECIDIR** — allowlist de IP tem tela? Não: `ip_access_rules` e `geo_blocking_rules` são as usadas                                                                                                                                                                                                                                                               |
| `email_verification_tokens` | 0      | 1        | **DECIDIR** — verificação de e-mail é feita pelo Supabase Auth                                                                                                                                                                                                                                                                                                    |
| `ai_chat_messages`          | 0      | 3        | **DECIDIR** — não existe chat de IA na UI                                                                                                                                                                                                                                                                                                                         |
| `notification_templates`    | 0      | 2        | **DECIDIR** — as notificações usam toast/Sonner, sem template persistido                                                                                                                                                                                                                                                                                          |
| `freight_webhooks`          | 0      | 1        | **MANTER** — tabela de entrada de webhook de transportadora; só os testes de RLS a citam (`tests/security/integrations-access.spec.ts:35`)                                                                                                                                                                                                                        |
| `system_adr`                | 0      | 1        | **REMOVER** (duplicata vazia) — a tela `/admin/adr` grava e lê `architecture_decisions` (`src/pages/AdminADR.tsx:63`)                                                                                                                                                                                                                                             |

## 2. Funções sem chamador (15)

| Função                              | Assinatura                             | Veredicto                                                                                                                                    |
| ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_trigger_func`                | —                                      | **REMOVER** — 0 triggers. A função de auditoria realmente em uso é `audit_log_trigger`, com **61 triggers** anexados                         |
| `fn_audit_trigger`                  | —                                      | **REMOVER** — mesma duplicata, 0 triggers                                                                                                    |
| `tr_increment_version`              | —                                      | **REMOVER** — 0 triggers                                                                                                                     |
| `update_fretes_internos_updated_at` | —                                      | **REMOVER** — 0 triggers (`updated_at` de `fretes_internos` é resolvido pelo trigger de auditoria)                                           |
| `update_performance_metrics`        | —                                      | **REMOVER** — 0 triggers                                                                                                                     |
| `xp_for_level`                      | `lvl integer`                          | **MANTER** — é chamada por `calculate_level`, que é chamada pelo RPC `add_user_xp` (vivo)                                                    |
| `jsonb_recursive_merge`             | `a jsonb, b jsonb`                     | **REMOVER** — helper sem chamador                                                                                                            |
| `mcp_exec_many`                     | `statements text[], max_rows integer`  | **MANTER** — interface do servidor MCP; `EXECUTE` só para `postgres` e `service_role` (não exposta a `anon`/`authenticated`)                 |
| `purge_webhook_inbound_failures`    | `_keep_days integer DEFAULT 90`        | **LIGAR** — ver achado colateral nº 1                                                                                                        |
| `validate_payload_schema` | `p_entity_name text, p_payload jsonb` | **REMOVER** — stub explícito: `RETURN TRUE` incondicional, com o próprio comentário do autor dizendo que a validação seria tratada nas edge functions; sem chamador |
| `system_health_check`               | —                                      | **DECIDIR** — a saúde exibida em `/admin/db-health` vem de `persist_global_health_score` + `get_health_score_history_fast`, não desta função |
| `get_dashboard_metrics_fast`        | —                                      | **DECIDIR** — RPC `SECURITY DEFINER` com `EXECUTE` para `authenticated` e nenhuma chamada no app                                             |
| `get_carrier_performance_fast`      | —                                      | **DECIDIR** — mesma situação                                                                                                                 |
| `has_permission`                    | `_user_id uuid, _permission_code text` | **DECIDIR** — RBAC nunca ligado (junto com `organizations`)                                                                                  |
| `get_current_organization_id`       | —                                      | **DECIDIR** — idem                                                                                                                           |

## 3. Módulos de `src/` sem importador (6) — resolvidos

Removidos na **PR #526** (mergeada em `cdc670d7c`), 1 commit por arquivo: `src/components/common/TiltCard.tsx`, `src/components/gamification/GamificationPanel.tsx`, `src/features/logistics/services/LogisticsService.ts`, `src/integrations/shared/api-schemas.ts`, `src/utils/logger.ts` e `src/hooks/gamification/useGamification.tsx`.

O último é o **veredicto da etapa 080**, que estava como "INDEFINIDO: aguarda decisão do dono" (`05-PROGRESSO.md:138`): `npx tsc --noEmit --traceResolution` resolve `@/hooks/gamification/useGamification` sempre para o `.ts` (o Vite resolve `.ts` antes de `.tsx`), os 12 importadores usam o caminho sem extensão, nenhum usa os helpers que só existiam no `.tsx` (`xpForLevel`, `calculateLevel`, `calculateLevelProgress`) e o `.ts` é a versão alinhada ao banco real (`user_levels`, `achievements`, `user_achievements`, `reward_items`, RPC `add_user_xp`). Era a única das duas implementações alcançável.

## 4. Achados colaterais (bugs reais, um por linha)

1. **A tabela de falhas de webhook cresce sem limite.** `carrier-webhook-receiver/index.ts:249` insere em `webhook_inbound_failures` e `purge_webhook_inbound_failures(90)` não está em nenhum `cron.job`; os outros cleanups do banco são agendados (`cleanup-old-delay-predictions`, `cleanup-security-logs-daily`, `cleanup-telemetry-daily`, `cleanup-health-snapshots-daily`). Falta um `cron.schedule` diário.
2. **A camada de contrato de payload funciona de ponta a ponta, e o que sobrou dela é lixo de teste dentro de produção.** As 5 edge functions (`carrier-webhook-receiver`, `ocr-receipt-processor`, `normalize-freight-response`, `lalamove-webhook`, `rodonaves-webhook`) chamam `validateContract` de `supabase/functions/_shared/contract-validator.ts`, devolvem **400 com a lista de erros** quando o payload não bate e gravam o resultado em `contract_test_logs`. Só que **100% das 1.775 linhas são fuzz** (`{"invalid": "__fuzz__"}`), sem nenhuma falha real de parceiro — os payloads vêm dos 37 `index_test.ts` do repo, que montam a URL com `VITE_SUPABASE_URL` do ambiente: com o ambiente apontando para produção, o smoke test grava no banco de produção (1.512 linhas em novembro, contra 138 em setembro). A validação em si está sã; o defeito é de ambiente e de retenção. O par de banco `system_contract_schemas` + `validate_payload_schema` é a sobra desse desenho (cópia dos contratos + stub que sempre retorna TRUE e ninguém chama), e o `src/integrations/shared/api-schemas.ts` removido na #526 (36 linhas zod, zero importadores) foi uma terceira tentativa do mesmo assunto, abandonada antes de ser ligada e recuperável no git.
3. **As 24 chaves de `business_rules_config` não têm efeito em runtime.**
4. **4 RPCs `SECURITY DEFINER` expostas a `authenticated` e sem chamador no app**: `get_dashboard_metrics_fast`, `get_carrier_performance_fast`, `has_permission`, `get_current_organization_id`. Superfície sem uso (não é vazamento: nenhuma delas devolve dado de outra linha sem RLS, mas é superfície que ninguém usa).
5. **Comentários apontando para o arquivo removido.** `src/services/api/authService.ts:43` e `src/hooks/gamification/useGamification.ts:16` diziam "schema em uso pelo `useGamification.tsx`"; corrigidos na mesma PR desta auditoria.

## 5. O que este documento NÃO afirma

- **Não houve clique autenticado no navegador.** "Tem tela" aqui significa "existe caminho de código do componente até a rota" (import → render → `App.tsx`), não "eu vi funcionando".
- **As 9 tabelas vazias não foram julgadas por intenção de negócio** — só pelo fato de não haver leitor nem escritor no código. Manter ou remover é decisão do dono.
- **Um veredicto deste documento mudou durante a própria auditoria:** `system_contract_schemas` começou como “par inerte” (a função não tinha chamador) e virou **LIGAR** ao ler as 3 linhas da tabela e ver que as entidades são edge functions vivas. Registrado para calibrar a confiança das outras linhas.
- **Os artefatos de inventário continuam datados.** `inventario/estado/*` e `.tools/graphify/output/*` são de 2026-11-24 e ainda citam os 6 arquivos removidos na #526; regenerá-los é higiene separada.

## Decisões que dependem do dono

| #   | Decisão                                                                       | Objetos                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Agendar (ou não) a limpeza de falhas de webhook                               | `purge_webhook_inbound_failures` + `webhook_inbound_failures`                                                                                                                           |
| 2 | Remover as 6 funções **REMOVER** acima | `audit_trigger_func`, `fn_audit_trigger`, `tr_increment_version`, `update_fretes_internos_updated_at`, `update_performance_metrics`, `jsonb_recursive_merge` |
| 2b | Limpar os 1.775 registros de fuzz e impedir que os smoke tests escrevam em produção | `contract_test_logs`, `supabase/functions/*/index_test.ts` |
| 3 | Remover a tabela duplicada | `system_adr` |
| 4   | Tela de configuração de regras de negócio (e leitor real) ou remover a tabela | `business_rules_config`                                                                                                                                                                 |
| 5   | Multi-tenant/RBAC e as 4 tabelas de segurança vazias                          | `organizations`, `allowed_ips`, `account_lockouts`, `email_verification_tokens`                                                                                                         |
