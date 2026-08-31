# Auditoria de migração — Loggi Flow V2 — 2026-08-31 (pós-remediação)
**Origem:** Lovable Cloud `hgicfqjayrjurivtygqf` · **Destino:** Supabase `jvfhclubfpxrtrrazrgr` · PG 17.6 nos dois.
**Método:** manifesto de catálogo idêntico (`scripts/audit/manifest_full.sql` + `manifest_data.sql`, 3.324 objetos na origem / 3.449 no destino)
executado nos dois bancos e comparado objeto a objeto dentro do destino (`audit_tmp.diff`). Origem via `pg_net → exec_sql`; destino direto.

## Resultado por camada (após as correções desta sessão)
| Camada | Iguais | DIFF | Só origem | Só destino | Veredito |
|---|---|---|---|---|---|
| schema (12) | 12 | 0 | 0 | 0 | ✅ |
| extensões (8) | 8 | 0 | 0 | 0 | ✅ (pg_net 0.20.0/0.20.4 = plataforma) |
| roles (16) | 16 | 0 | 0 | 0 | ✅ (`sandbox_exec` = Lovable, excluído) |
| enums (7) | 7 | 0 | 0 | 0 | ✅ `notification_type` presente |
| tabelas (131) | 125 | 6 | 0 | 1 | ✅ DIFF = reloptions autovacuum em `audit_logs_y2026m07..12` (melhoria etapa 32); só-destino = `audit_logs_y2027m07` (criada ao testar `ensure_monthly_partition`) |
| colunas (1.074) | 1.055 | 16 | 0 | 3 | ✅ os 16 DIFF são só posição ordinal (tipo/NOT NULL/default idênticos): `coletas`, `fretes_internos`, `scheduled_reports`; só-destino = `coletas.created_by`, `fretes_internos.created_by/data_criacao` (legado, sem uso em src/) |
| constraints (300) | 292 | 3 | 0 | 5 | ✅ 3 CHECKs com deparse diferente e literais idênticos (`conciliacoes` ×2, `conciliacao_itens_importados`); só-destino = FKs `created_by` (legado) + `notifications.user_id`/`scheduled_reports.user_id → auth.users` (mais estritas) + PK da partição y2027m07 |
| índices (678) | 659 | 1 | 0 | 18 | ✅ DIFF = `idx_notifications_user_read` superconjunto; só-destino = 3 índices extras + 15 da partição y2027m07 |
| RLS/policies (320) | **320** | 0 | 0 | 0 | ✅ **paridade total** (corrigido nesta sessão) |
| funções (113) | 110 | 1 | 0 | 2 | ✅ DIFF = `ensure_monthly_partition` (agora aplica reloptions); só-destino = `update_comments_updated_at`, `update_fretes_internos_updated_at` |
| ACL de funções (113) | 111 | 0 | 0 | 2 | ✅ (as 2 acima) |
| triggers (139) | 136 | 0 | 0 | 3 | ✅ só-destino = `auth.users.on_auth_user_created(_levels)` (a origem NÃO cria profile/levels no signup) + `comments.trigger_comments_updated_at` |
| views/matviews (6) | 6 | 0 | 0 | 0 | ✅ |
| sequences (3) | 3 | 0 | 0 | 0 | ✅ |
| grants em relações (110) | 110 | 0 | 0 | 0 | ✅ |
| default ACLs (31) | 27 | 0 | 4 | 0 | ✅ os 4 só-origem ficam `{}` sem `sandbox_exec` (plataforma Lovable) |
| event triggers (6) | 6 | 0 | 0 | 0 | ✅ |
| publications (2) | 1 | 1 | 0 | 0 | ✅ DIFF = partições `realtime.messages_*` (plataforma); `supabase_realtime` vazia nos dois |
| cron (25) | 15 | 9 | 0 | 1 | ✅ 24 jobs da origem presentes; 7 DIFF = URL/apikey via vault (intencional), 2 = espaço/caixa; só-destino = `cleanup-cron-job-run-details` |
| storage buckets (2) | 2 | 0 | 0 | 0 | ✅ `avatars`, `documents`; 0 objetos nos dois |
| comentários (14) | 1 | 0 | 0 | 13 | ✅ documentação só no destino |
| vault | – | – | 0 | 2 | ✅ `anon_key`, `project_url` (etapa 47) |
| migrations | 3 | 0 | 156 | 232 | ⚠️ esperado: versões da Lovable (timestamps+uuid) ≠ versões da CLI; paridade provada pelo catálogo, não pela tabela. Arquivo das 159 com `statements` em `docs/migrations/lovable_schema_migrations.json` |
| auth.users | 0 | 0 | 1 | 4 | 🔴 `adm01@promobrindes.com.br` (Google) ainda não migrado; destino tem `ti@` + 3 seed |
| **dados** (101 tabelas) | 57 | 44 | 0 | 0 | 🔴 ver abaixo — Fase 5 pendente |

## Dados (Fase 5 ainda não executada)
- **Só na origem (a carregar):** `tabelas_frete` 53, `business_rules` 7, `system_contract_schemas` 3, `logistica_reversa` 1, `contract_test_logs` 125, `db_health_snapshots` 561, `db_slo_daily` 43, `rte_gateway_health` 17.936, `rte_slo_daily_snapshots` 256.
- **Origem prevalece (contagem diferente):** `business_rules_config` 24/3, `feature_flags` 19/5, `transportadoras` 5 reais/56 seed, `architecture_decisions` 2/1, `achievements` 6/26 (D5), `audit_logs` 4.648/3.007 (união), `rate_limit_logs` 4.495/2, `db_health_score_history` 43/10, `internal.query_baseline` 2.150/500.
- **Iguais em contagem, hash diferente (ids/timestamps):** `user_ranks` 5, `freight_selection_rules` 3, `bio_sync_alert_rules` 1, `system_heartbeat` 4.
- **Só no destino:** seed 26/08 (`clientes` 90, `fornecedores` 80, `coletas` 48, `entregas` 45, `ocorrencias` 16, `cotacoes_frete` 20, `notifications` 133, `conciliacoes` 8, `permissions` 25, `role_permissions` 30, `reward_items` 14, `profiles` 4, `user_roles` 5, `user_levels` 4) + uso real de `ti@` (`security_events` 1.303, `telemetry_logs` 472, `login_attempts` 19, `known_devices` 1, `geo_access_rules` 1, `user_onboarding` 1, `user_notification_preferences` 1) + `nexus_tactical_logs` 2 (teste do fix).

## Correções aplicadas nesta auditoria
1. Destino: `audit_log_trigger()` e `record_heartbeat()` substituídos pelo corpo byte-a-byte da origem (o destino usava `to_jsonb(NEW)` em vez de `row_to_json(NEW)::jsonb`).
2. Destino: 7 policies da origem recriadas (`comments` ×3, `fretes_internos` ×2, `notifications` ×2) — a etapa 33 não as havia criado; 9 policies só-destino removidas (5 quase-duplicatas + `profiles` insert/update own, `user_achievements` view own, `user_levels."Users can update own level"` — esta permitia ao usuário alterar o próprio XP). Migration `20260831120200`.
3. Destino: reloptions em 12/12 partições de `audit_logs` (a etapa 32 anterior só pegara 6: `bool_or` sobre array NULL) + `ensure_monthly_partition()` passa a aplicá-las. Migration `20260831120300`.
4. Origem: `cotacoes_multicanal.tr_cotacoes_multicanal_version` (duplicata de version) removido.
5. Comentário de `user_levels.nexus_score` alinhado ao texto da origem.

## Itens abertos
- `auth.users` (`adm01@`) e todos os dados de configuração/telemetria da origem — Fase 5 (etapas 55–71).
- Decisão D5 (`achievements` 6 vs 26) antes da carga.
- Coluna `created_by` em `coletas`/`fretes_internos` (+FKs) e `data_criacao`: legado sem uso; manter ou remover é decisão de produto (não afeta paridade funcional).
- Ordem física das colunas em `coletas`, `fretes_internos`, `scheduled_reports` difere; irrelevante para a aplicação (Supabase-js seleciona por nome).
