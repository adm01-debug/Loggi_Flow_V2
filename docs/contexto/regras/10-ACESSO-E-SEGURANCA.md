# 10 · ACESSO E SEGURANÇA — quem pode o quê

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `285036298f` · branch `main` · 2026-11-27 00:35 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Perfis / roles identificados

`admin`, `assistant`, `authenticated`, `default`, `denied`, `granted`, `role`, `service_role`, `unsupported`, `user`

- Tabelas de perfil/permissão: `user_roles`, `permissions`, `role_permissions`
- Colunas de perfil: `user_roles.role` (app_role NOT NULL DEFAULT 'user'), `ai_chat_messages.role` (TEXT NOT NULL CHECK (role IN ('user', 'assistant'))), `role_permissions.role` (app_role NOT NULL)
- Claims do JWT usados em políticas/funções: nenhum
- Funções usadas dentro de políticas RLS (a regra real está no corpo delas — veja `docs/contexto/supabase/` (snapshot do banco real)): `get_current_organization_id`, `has_role`

## Matriz tabela × operação → quem pode (derivada das políticas RLS)

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `account_lockouts` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role)<br>authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) |
| `achievements` | enabled | public: has_role(auth.uid(), 'admin')<br>public: true | public: has_role(auth.uid(), 'admin') | public: has_role(auth.uid(), 'admin') | public: has_role(auth.uid(), 'admin') |
| `ai_chat_messages` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | — | public: auth.uid() = user_id |
| `ai_delay_predictions` | enabled | public: auth.uid() IS NOT NULL<br>public: EXISTS ( SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' ) | public: EXISTS ( SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' ) | public: EXISTS ( SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' ) | public: EXISTS ( SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' ) |
| `alertas_custo` | enabled | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `allowed_ips` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role)<br>authenticated: (auth.uid() = user_id) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role)<br>authenticated: ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role)<br>authenticated: ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role)<br>authenticated: ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)) |
| `architecture_decisions` | enabled | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') |
| `audit_logs` | enabled | public: EXISTS ( SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' )<br>public: user_id IN (SELECT id FROM public.profiles WHERE organization_id = public.get_current_organization_id()) | authenticated: auth.uid() IS NOT NULL | — | — |
| `audit_logs_y2026m07` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2026m08` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2026m09` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2026m10` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2026m11` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2026m12` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2027m01` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2027m02` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2027m03` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2027m04` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2027m05` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2027m06` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `audit_logs_y2027m07` | não encontrado | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: auth.uid() IS NOT NULL | sem RLS | sem RLS |
| `automation_audit_logs` | enabled | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' |
| `bio_sync_alert_rules` | enabled | authenticated: public.has_role(auth.uid(),'admin')<br>public: true | authenticated: public.has_role(auth.uid(),'admin') | authenticated: public.has_role(auth.uid(),'admin') | authenticated: public.has_role(auth.uid(),'admin') |
| `bio_sync_telemetry` | enabled | authenticated: true | authenticated: public.has_role(auth.uid(), 'admin') | — | — |
| `bitrix_sync_config` | enabled | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') |
| `bitrix_sync_logs` | enabled | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' |
| `business_rules` | enabled | public: auth.uid() IS NOT NULL<br>public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `business_rules_config` | enabled | public: auth.role() = 'authenticated'<br>public: EXISTS ( SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' ) | public: EXISTS ( SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' ) | public: EXISTS ( SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' ) | public: EXISTS ( SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' ) |
| `carrier_rankings` | enabled | authenticated: true | — | — | — |
| `client_webhooks` | enabled | authenticated: created_by = auth.uid() OR has_role(auth.uid(), 'admin') | authenticated: created_by = auth.uid() | authenticated: created_by = auth.uid() OR has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `clientes` | enabled | authenticated: true<br>authenticated: true | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') |
| `coletas` | enabled | authenticated: true<br>authenticated: (auth.uid() IS NOT NULL) | authenticated: true<br>authenticated: auth.uid() IS NOT NULL | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') |
| `comments` | enabled | public: true<br>authenticated: true | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id |
| `conciliacao_itens_importados` | enabled | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `conciliacoes` | enabled | authenticated: created_by = auth.uid() OR has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `contract_test_logs` | enabled | — | authenticated: public.has_role(auth.uid(),'admin') | — | — |
| `cotacoes_frete` | enabled | authenticated: auth.uid() IS NOT NULL | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `cotacoes_multicanal` | enabled | authenticated: user_id = auth.uid() OR has_role(auth.uid(), 'admin') | authenticated: user_id = auth.uid() | authenticated: user_id = auth.uid() OR has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `db_health_score_history` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `db_health_snapshots` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `db_slo_daily` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `delay_predictions_history` | enabled | authenticated: true<br>authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true |
| `delivery_receipt_audit` | enabled | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: auth.uid() IS NOT NULL | — | — |
| `driver_badges` | enabled | authenticated: (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.cargo = 'admin'::text))))<br>authenticated: (auth.uid() = driver_id) | authenticated: (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.cargo = 'admin'::text)))) | authenticated: (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.cargo = 'admin'::text)))) | authenticated: (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.cargo = 'admin'::text)))) |
| `email_verification_tokens` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) |
| `entregas` | enabled | authenticated: true<br>authenticated: (auth.uid() IS NOT NULL) | authenticated: true<br>authenticated: auth.uid() IS NOT NULL | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') |
| `error_events` | enabled | public: EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') | public: auth.uid() = user_id | — | — |
| `feature_flags` | enabled | public: public.has_role(auth.uid(), 'admin')<br>public: auth.uid() IS NOT NULL | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') |
| `fornecedores` | enabled | authenticated: true<br>authenticated: true | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') |
| `freight_decisions` | enabled | public: auth.uid() = user_id OR auth.role() = 'service_role' | service_role: true | — | — |
| `freight_integration_mappings` | enabled | public: auth.role() = 'authenticated'<br>authenticated: public.has_role(auth.uid(),'admin')<br>authenticated: true | public: auth.role() = 'authenticated'<br>authenticated: public.has_role(auth.uid(),'admin') | public: auth.role() = 'authenticated'<br>authenticated: public.has_role(auth.uid(),'admin') | public: auth.role() = 'authenticated'<br>authenticated: public.has_role(auth.uid(),'admin') |
| `freight_selection_rules` | enabled | public: auth.role() = 'authenticated'<br>authenticated: public.has_role(auth.uid(),'admin')<br>authenticated: true | public: auth.role() = 'authenticated'<br>authenticated: public.has_role(auth.uid(),'admin') | public: auth.role() = 'authenticated'<br>authenticated: public.has_role(auth.uid(),'admin') | public: auth.role() = 'authenticated'<br>authenticated: public.has_role(auth.uid(),'admin') |
| `freight_webhooks` | enabled | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') |
| `fretes_internos` | enabled | authenticated: true<br>public: organization_id = public.get_current_organization_id()<br>authenticated: auth.uid() IS NOT NULL | authenticated: true<br>public: organization_id = public.get_current_organization_id()<br>authenticated: auth.uid() IS NOT NULL | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') |
| `geo_access_rules` | enabled | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') | public: public.has_role(auth.uid(), 'admin') |
| `geo_blocked_attempts` | enabled | public: public.has_role(auth.uid(), 'admin') | authenticated: auth.uid() IS NOT NULL | — | — |
| `geo_blocking_rules` | não encontrado | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `geo_blocking_settings` | não encontrado | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `idempotency_keys` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `index_proposals` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | — |
| `internal.query_baseline` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `ip_access_rules` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `kanban_history` | enabled | authenticated: true | authenticated: auth.uid() IS NOT NULL | — | — |
| `known_devices` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `login_attempts` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | authenticated: auth.uid() IS NOT NULL | — | — |
| `logistica_reversa` | enabled | public: auth.uid() IS NOT NULL | public: auth.uid() IS NOT NULL | public: auth.uid() IS NOT NULL | — |
| `mitigation_actions` | enabled | authenticated: auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') | authenticated: auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') | authenticated: auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') | authenticated: auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') |
| `nexus_tactical_logs` | enabled | authenticated: true | authenticated: public.has_role(auth.uid(), 'admin') | — | — |
| `notificacoes_custo` | enabled | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | — | — |
| `notification_templates` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role)<br>authenticated: true | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) |
| `notifications` | enabled | public: auth.uid() = user_id | authenticated: auth.uid() = user_id<br>authenticated: auth.uid() IS NOT NULL | public: auth.uid() = user_id | public: (auth.uid() = user_id) |
| `ocorrencias` | enabled | authenticated: auth.uid() IS NOT NULL | authenticated: auth.uid() IS NOT NULL | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `organizations` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: true | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') |
| `password_reset_requests` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role)<br>public: email IS NOT NULL AND length(email) > 0 AND status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `performance_metrics` | enabled | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' |
| `permissions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `prediction_accuracy_settings` | enabled | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id |
| `profiles` | enabled | public: auth.uid() = id<br>public: public.has_role(auth.uid(), 'admin')<br>authenticated: true | — | public: auth.uid() = id | — |
| `push_subscriptions` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `query_telemetry` | enabled | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: user_id = auth.uid() OR user_id IS NULL | — | authenticated: public.has_role(auth.uid(), 'admin') |
| `rastreamento_alertas` | enabled | public: auth.uid() IS NOT NULL | public: auth.uid() IS NOT NULL<br>authenticated: auth.uid() IS NOT NULL | public: auth.uid() IS NOT NULL<br>authenticated: has_role(auth.uid(), 'admin') | — |
| `rastreamento_historico` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: auth.uid() IS NOT NULL | — | — |
| `rastreamento_historico_y2026m01` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: true | — | — |
| `rastreamento_historico_y2026m02` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: true | — | — |
| `rastreamento_historico_y2026m03` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: true | — | — |
| `rastreamento_historico_y2026m04` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: true | — | — |
| `rastreamento_historico_y2026m05` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: true | — | — |
| `rastreamento_historico_y2026m06` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: true | — | — |
| `rastreamento_historico_y2026m07` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2026m08` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2026m09` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2026m10` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2026m11` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2026m12` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2027m01` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2027m02` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2027m03` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2027m04` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2027m05` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rastreamento_historico_y2027m06` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `rate_limit_logs` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | authenticated: auth.uid() IS NOT NULL | — | public: has_role(auth.uid(), 'admin'::app_role) |
| `remediation_actions` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin'::app_role) |
| `reward_items` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: auth.uid() IS NOT NULL | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `reward_purchases` | enabled | public: auth.uid() = user_id<br>public: has_role(auth.uid(), 'admin'::app_role) | public: auth.uid() = user_id | public: has_role(auth.uid(), 'admin'::app_role) | — |
| `reward_redemptions` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | — | — |
| `rewards` | enabled | public: true | — | — | — |
| `risk_zones` | enabled | public: auth.role() = 'authenticated' | — | — | — |
| `role_permissions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: auth.uid() IS NOT NULL | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `rte_gateway_health` | enabled | authenticated: true | — | — | authenticated: public.has_role(auth.uid(), 'admin') |
| `rte_slo_daily_snapshots` | enabled | authenticated: true | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') |
| `rte_slo_targets` | enabled | authenticated: true | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') |
| `rule_execution_logs` | enabled | public: auth.uid() IS NOT NULL | authenticated: auth.uid() IS NOT NULL | — | — |
| `scheduled_reports` | não encontrado | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) |
| `security_events` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | authenticated: auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())<br>authenticated: auth.uid() IS NOT NULL | — | — |
| `sla_alerts` | enabled | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' | public: auth.role() = 'authenticated' |
| `system_adr` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role) |
| `system_contract_schemas` | enabled | authenticated: true | — | — | — |
| `system_heartbeat` | enabled | public: true | — | — | — |
| `system_integrity_logs` | enabled | public: auth.uid() IN (SELECT id FROM profiles WHERE cargo = 'admin' OR cargo = 'gestor') | public: auth.uid() IN (SELECT id FROM profiles WHERE cargo = 'admin' OR cargo = 'gestor') | public: auth.uid() IN (SELECT id FROM profiles WHERE cargo = 'admin' OR cargo = 'gestor') | public: auth.uid() IN (SELECT id FROM profiles WHERE cargo = 'admin' OR cargo = 'gestor') |
| `tabelas_frete` | enabled | authenticated: auth.uid() IS NOT NULL | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `telemetry_logs` | enabled | public: EXISTS ( SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin' ) | authenticated: auth.uid() IS NOT NULL | — | — |
| `transportadora_rotas` | enabled | authenticated: auth.uid() IS NOT NULL | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') | authenticated: has_role(auth.uid(), 'admin') |
| `transportadoras` | enabled | authenticated: true<br>authenticated: true | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') | authenticated: true<br>authenticated: has_role(auth.uid(), 'admin') |
| `user_achievements` | enabled | public: auth.uid() = user_id | authenticated: true<br>authenticated: auth.uid() IS NOT NULL | — | — |
| `user_gamification` | enabled | public: auth.uid() = user_id | — | public: auth.uid() = user_id | — |
| `user_levels` | enabled | public: auth.uid() = user_id<br>authenticated: true | authenticated: true<br>authenticated: auth.uid() IS NOT NULL | — | — |
| `user_notification_preferences` | enabled | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | — |
| `user_onboarding` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | — |
| `user_panel_preferences` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | — |
| `user_ranks` | enabled | public: true | — | — | — |
| `user_roles` | enabled | public: auth.uid() = user_id | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') |
| `user_sessions` | enabled | authenticated: auth.uid() = user_id<br>authenticated: public.has_role(auth.uid(), 'admin') | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id |
| `v_prediction_accuracy` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `v_prediction_accuracy_by_carrier` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `v_prediction_accuracy_daily` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `v_prediction_accuracy_daily_carrier` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `webauthn_challenges` | enabled | authenticated: auth.uid() = user_id<br>authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: auth.uid() = user_id<br>authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: auth.uid() = user_id<br>authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: auth.uid() = user_id<br>authenticated: public.has_role(auth.uid(), 'admin'::app_role) |
| `webauthn_credentials` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `webhook_deliveries` | enabled | authenticated: EXISTS ( SELECT 1 FROM public.client_webhooks w WHERE w.id = webhook_deliveries.webhook_id AND (w.created_by = auth.uid() OR  | authenticated: auth.uid() IS NOT NULL | — | — |
| `webhook_events_processed` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role)<br>public: auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'admin') | — | — | — |
| `webhook_inbound_failures` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | service_role: true | — | — |

> `—` com RLS ligado = ninguém além de service_role. `sem RLS` = qualquer chave anon lê/escreve tudo.

## Onde o RLS é IGNORADO (service_role) — 148 arquivo(s)

- `docs/seguranca/banco-produtos-doufsxqlfjyuvxuezpln/20261125-aplicado-revoke-anon-mv_product_compositions.sql`
- `scripts/ai-context/cenarios.mjs`
- `scripts/ai-context/gerar.unit.mjs`
- `scripts/audit/manifest-summary-content-hash.unit.mjs`
- `scripts/audit/manifest_full.sql`
- `scripts/audit/sql.unit.mjs`
- `scripts/ci/check-soft-delete.mjs`
- `scripts/db-audit/check-fresh.unit.mjs`
- `scripts/db-audit/check-grants-fresh.mjs`
- `scripts/db-audit/grants-baseline.sql`
- `scripts/db-audit/sql-banco-local.unit.mjs`
- `scripts/historico/origem_remediacao_2026-08-31.sql`
- `scripts/inventario/gerar-banco.mjs`
- `scripts/inventario/gerar-banco.unit.mjs`
- `scripts/ops/pos-deploy-functions.unit.mjs`
- `scripts/ops/pos_deploy_functions.sql`
- `scripts/ops/set-missing-secrets.unit.mjs`
- `scripts/regras_negocio/generate.py`
- `scripts/seed-database.ts`
- `scripts/seed/seed-database.unit.mjs`
- `scripts/supabase_snapshot/snapshot.py`
- `scripts/supabase_snapshot/test_snapshot_postgres.py`
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/_shared/idempotency.test.ts`
- `supabase/functions/_shared/idempotency.ts`
- `supabase/functions/_shared/invokeFunction.ts`
- `supabase/functions/_shared/rateLimiter.ts`
- `supabase/functions/accuracy-meta-monitor/index.ts`
- `supabase/functions/accuracy-weekly-digest/index.ts`
- `supabase/functions/ai-logistics-assistant/index.test.ts`
- `supabase/functions/ai-logistics-assistant/index.ts`
- `supabase/functions/bitrix24-integration/index.ts`
- `supabase/functions/bitrix24-integration/index_test.ts`
- `supabase/functions/carrier-webhook-receiver/index.ts`
- `supabase/functions/check-password-breach/index_test.ts`
- `supabase/functions/check-rate-limit/index.ts`
- `supabase/functions/check-rate-limit/index_test.ts`
- `supabase/functions/db-health-snapshot/index.ts`
- `supabase/functions/db-health-weekly-report/index.ts`
- `supabase/functions/db-regression-monitor/index.ts`
- `supabase/functions/evolution-whatsapp/index.ts`
- `supabase/functions/evolution-whatsapp/index_test.ts`
- `supabase/functions/execute-protocol/index.ts`
- `supabase/functions/execute-protocol/index_test.ts`
- `supabase/functions/external-db-bridge/index.ts`
- `supabase/functions/external-db-bridge/index_test.ts`
- `supabase/functions/get-weather-data/index_test.ts`
- `supabase/functions/health-check/index.ts`
- `supabase/functions/health-check/index_test.ts`
- `supabase/functions/health/index.ts`
- `supabase/functions/health/index_test.ts`
- `supabase/functions/ingest-biosync/index.ts`
- `supabase/functions/ingest-biosync/index_test.ts`
- `supabase/functions/lalamove-api/index_test.ts`
- `supabase/functions/lalamove-tracking/index_test.ts`
- `supabase/functions/lalamove-webhook/index.ts`
- `supabase/functions/lgpd-erase-user/index.ts`
- `supabase/functions/lgpd-erase-user/index_test.ts`
- `supabase/functions/log-login-attempt/index.ts`
- `supabase/functions/log-login-attempt/index_test.ts`
- `supabase/functions/log-security-event/index.ts`
- `supabase/functions/log-security-event/index_test.ts`
- `supabase/functions/melhor-envio-api/index_test.ts`
- `supabase/functions/new-device-alert/index.ts`
- `supabase/functions/new-device-alert/index_test.ts`
- `supabase/functions/nexus-auto-healing/index.ts`
- `supabase/functions/nexus-auto-healing/index_test.ts`
- `supabase/functions/nexus-webhook-receiver/index.ts`
- `supabase/functions/normalize-freight-response/index.ts`
- `supabase/functions/normalize-freight-response/index_test.ts`
- `supabase/functions/ocr-receipt-processor/index.ts`
- `supabase/functions/ocr-receipt-processor/index_test.ts`
- `supabase/functions/predict-delays-scheduled/index.ts`
- `supabase/functions/predict-delays-scheduled/index_test.ts`
- `supabase/functions/predict-delays/index.ts`
- `supabase/functions/predict-delays/index_test.ts`
- `supabase/functions/push-send/index.ts`
- `supabase/functions/resend-email/index.ts`
- `supabase/functions/rodonaves-api/index.ts`
- `supabase/functions/rodonaves-api/index_test.ts`
- `supabase/functions/rodonaves-webhook/index.ts`
- `supabase/functions/scheduled-reports/index.test.ts`
- `supabase/functions/scheduled-reports/index.ts`
- `supabase/functions/send-password-reset/index.ts`
- `supabase/functions/send-password-reset/index_test.ts`
- `supabase/functions/smart-carrier-selection/index.ts`
- `supabase/functions/smart-carrier-selection/index_test.ts`
- `supabase/functions/validate-login/index.ts`
- `supabase/functions/validate-login/index_test.ts`
- `supabase/functions/webhook-status/index.ts`
- `supabase/functions/webhook-status/index_test.ts`
- `supabase/functions/whatsapp-notification/index.ts`
- `supabase/functions/whatsapp-notification/index_test.ts`
- `supabase/migrations/20260314202647_2105a918-ba42-44f9-805d-bdc954688fe5.sql`
- `supabase/migrations/20260314203713_95f85fe5-f0ed-44fb-8a0f-5c2157deda07.sql`
- `supabase/migrations/20260317222256_785e5238-ea75-4138-b9d5-cfbabd62ae59.sql`
- `supabase/migrations/20260317222320_b8e54bf7-1303-4fc8-b4a6-ba04c3dabbf6.sql`
- `supabase/migrations/20260317222815_fce4c284-f168-480c-8537-12357b456446.sql`
- `supabase/migrations/20260317223512_1226ae47-0eaa-4192-a2bf-780ffd222293.sql`
- `supabase/migrations/20260317225234_4cb37c73-fb00-48de-afd6-6d56126a6ec0.sql`
- `supabase/migrations/20260513190800_bea79467-c8d4-4d88-9c0d-72c32537d69c.sql`
- `supabase/migrations/20260517175115_f5cfc3ce-c630-4b30-827e-d8b344fb903e.sql`
- `supabase/migrations/20260519122727_d3db084e-8d4c-4733-9af6-30e8fba02116.sql`
- `supabase/migrations/20260628122650_96339d3a-b9ac-4e5f-a065-b61bf72197de.sql`
- `supabase/migrations/20260628122741_0dcb312b-caab-4782-a326-9d6eaea2ad24.sql`
- `supabase/migrations/20260711152903_d80535e0-3580-4d93-89e9-eb2c49be6a4d.sql`
- `supabase/migrations/20260711153045_42d1824a-1b6a-485d-bb4f-0b19e2064e9b.sql`
- `supabase/migrations/20260711153319_785edc4c-3e2b-4a6e-895e-7ee382fe4946.sql`
- `supabase/migrations/20260711153637_9a5686f4-685e-4db1-b3e6-012d866990bf.sql`
- `supabase/migrations/20260711183644_f0a68bec-ea27-4334-8540-2f34861aa7b1.sql`
- `supabase/migrations/20260711184952_5ae257f1-7832-4c6a-868c-bd8fe73834ec.sql`
- `supabase/migrations/20260711185045_1705b3fd-cc2b-459f-9aa4-664dacfe7c9d.sql`
- `supabase/migrations/20260712110825_53cc394a-b8cf-4066-8cab-ab9f0c27f83e.sql`
- `supabase/migrations/20260712110919_2772614a-8b54-4b13-9dc1-72b5e30145a0.sql`
- `supabase/migrations/20260712113823_c083f8cb-f3d7-4093-b615-107800d1b5f9.sql`
- `supabase/migrations/20260712161002_b19fcb77-c1a6-42e0-9509-55a06df9b5a7.sql`
- `supabase/migrations/20260712183625_ed8a21e5-2aa1-4965-bdce-5831f0729248.sql`
- `supabase/migrations/20260712195104_b8eb63a5-994d-4209-8e8f-970b5b4930a1.sql`
- `supabase/migrations/20260712195636_5a4fbf15-cea4-4b1d-9ec6-b9b2131c2d15.sql`
- `supabase/migrations/20260712200133_ab6b07eb-f3d2-4ecb-a237-e3f33c6e40e5.sql`
- `supabase/migrations/20260712214106_9a64fd95-99c1-45ce-97a5-6f71604341e6.sql`
- `supabase/migrations/20260712214421_cd6c9b73-7831-4d22-98f2-ed5ed0faa79d.sql`
- `supabase/migrations/20260712214637_62050a93-e930-406b-a565-68db4825c7d5.sql`
- `supabase/migrations/20260723131130_e168be83-467b-49a6-b778-9d47f3f08cc8.sql`
- `supabase/migrations/20260723132054_9de9aeb1-7fbc-40f0-8c93-e443f0eeba3e.sql`
- `supabase/migrations/20260723132537_e0ef23f7-0233-426a-b712-d47b6968c957.sql`
- `supabase/migrations/20260723132902_65c49e6d-0ce3-4710-a72f-5711164da92e.sql`
- `supabase/migrations/20260723133405_ebfce3e7-8edf-4f2f-a1a1-2520fdee28ef.sql`
- `supabase/migrations/20260723160819_6dcf6872-6503-4f41-ad8e-1602926f4d47.sql`
- `supabase/migrations/20260726144527_3331276b-7cfb-40d6-8060-6c6bb9452cb9.sql`
- `supabase/migrations/20260726150554_2c369f79-a2cb-447c-a366-3bce9a9555c2.sql`
- `supabase/migrations/20260726155625_5fb556c9-85ee-4bd5-bb97-5a9696e9bc69.sql`
- `supabase/migrations/20260726165713_13b8fdbe-4732-4be8-953c-9e616f80724e.sql`
- `supabase/migrations/20260822190000_fix_record_heartbeat_columns.sql`
- `supabase/migrations/20260902120000_hardening_pos_auditoria.sql`
- `supabase/migrations/20261124133000_count_prediction_breach_days_bulk.sql`
- `supabase/migrations/20261125093000_webhook_inbound_failures.sql`
- `supabase/migrations/20261126120000_retencao_logs_contrato_e_webhook.sql`
- `supabase/migrations/20261126150000_execute_anon_por_default_e_retencao.sql`
- `supabase/migrations/20261126220000_registrar_crash_ui_para_anonimo.sql`
- `supabase/rollbacks/20261126170000_rollback_remove_tabelas_mortas.sql`
- `supabase/rollbacks/20261126190000_rollback_remove_camada_fast_metrics.sql`
- `supabase/rollbacks/20261126210000_rollback_remove_xp_for_level.sql`
- `tests/contracts/carrier-webhook-entrada-persistente.spec.ts`
- `tests/contracts/invoke-function-timeout.spec.ts`
- `tests/contracts/resend-email-contrato.spec.ts`
- `tests/contracts/resend-email-erro-provedor.spec.ts`
- `tests/security/integrations-access.spec.ts`

## Funções SQL `SECURITY DEFINER` (rodam com privilégio do dono, ignoram RLS)

- `add_user_xp`
- `alert_slow_queries`
- `apply_index_proposal`
- `audit_log_trigger`
- `auto_revert_ineffective_indexes`
- `cancel_long_running_query`
- `capture_index_proposal_baseline`
- `check_and_alert_health_regression`
- `cleanup_old_contract_test_logs`
- `cleanup_old_delay_predictions`
- `cleanup_old_health_snapshots`
- `cleanup_old_notifications`
- `cleanup_old_telemetry_logs`
- `collect_db_health`
- `compute_db_slo_for`
- `count_prediction_breach_days`
- `count_prediction_breach_days_bulk`
- `detect_health_score_regression`
- `drop_old_partitions`
- `ensure_future_partitions`
- `ensure_monthly_partition`
- `execute_nexus_protocol`
- `generate_coleta_numero`
- `generate_entrega_numero`
- `get_active_sessions_summary`
- `get_autovacuum_health`
- `get_bloat_hotspots`
- `get_cache_hit_ratios`
- `get_capacity_forecast_fast`
- `get_carrier_performance_fast`
- `get_carrier_performance_stats`
- `get_cron_jobs_status`
- `get_current_organization_id`
- `get_dashboard_metrics`
- `get_dashboard_metrics_fast`
- `get_duplicate_indexes`
- `get_extensions_audit`
- `get_global_health_score_fast`
- `get_health_anomalies_fast`
- `get_health_score_history_fast`
- `get_index_roi_summary`
- `get_leaderboard`
- `get_load_heatmap`
- `get_lock_conflicts`
- `get_long_running_queries`
- `get_maintenance_windows`
- `get_monthly_analytics`
- `get_public_tracking`
- `get_query_detail_fast`
- `get_query_index_suggestion`
- `get_query_regressions_fast`
- `get_remediation_mttr_fast`
- `get_remediation_suggestions_fast`
- `get_replication_status`
- `get_rls_audit`
- `get_seq_scan_hotspots`
- `get_table_coaccess_graph`
- `get_temp_file_stats`
- `get_top_queries_fast`
- `get_top_tables_by_size`
- `get_transaction_health`
- `get_unindexed_foreign_keys`
- `get_unused_indexes`
- `get_user_permissions`
- `get_wal_health`
- `get_wraparound_status`
- `handle_new_user`
- `handle_new_user_levels`
- `has_permission`
- `has_role`
- `log_biometric_anomaly`
- `mark_predictions_accurate`
- `measure_index_proposal_impact`
- `notify_coleta_atrasada`
- `notify_conquista_desbloqueada`
- `notify_entrega_atrasada`
- `notify_entrega_concluida`
- `notify_frete_interno_concluido`
- `notify_ocorrencia_registrada`
- `persist_db_health_snapshot`
- `persist_global_health_score`
- `purchase_reward`
- `purge_rte_gateway_health`
- `purge_webhook_inbound_failures`
- `reconcile_pending_freights`
- `record_heartbeat`
- `refresh_dashboard_views`
- `reindex_hot_indexes`
- `reject_index_proposal`
- `rte_gateway_sustained_downtime`
- `rte_rollup_slo_daily`
- `snapshot_query_baseline`
- `system_health_check`
- `update_carrier_ranking`
- `update_device_last_seen`
- `update_user_rank`
- `update_user_streak`

## Edge functions públicas (sem JWT — qualquer um chama)

- `predict-delays-scheduled`
- `lalamove-webhook`
- `rodonaves-webhook`
- `carrier-webhook-receiver`
- `nexus-webhook-receiver`
- `evolution-whatsapp`
- `resend-email`
- `log-security-event`
- `webhook-status`
- `health`
- `health-check`
- `melhor-envio-api`

## Rotas protegidas no front

| Rota | Guard | Roles | Arquivo |
|---|---|---|---|
| / | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| / | ProtectedRoute |  | `scripts/inventario/gerar-rotas.unit.mjs` |
| / | ProtectedRoute |  | `src/App.tsx` |
| /admin | ProtectedRoute | admin | `scripts/inventario/gerar-rotas.unit.mjs` |
| /admin/adr | ProtectedRoute | admin | `src/App.tsx` |
| /admin/db-health | ProtectedRoute | admin | `src/App.tsx` |
| /admin/quality-gate | ProtectedRoute | admin | `src/App.tsx` |
| /admin/telemetria | ProtectedRoute | admin | `src/App.tsx` |
| /alertas-custo | ProtectedRoute |  | `src/App.tsx` |
| /analytics | ProtectedRoute |  | `src/App.tsx` |
| /api-docs | ProtectedRoute | admin | `src/App.tsx` |
| /app | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| /aprovacao-reset-senha | ProtectedRoute | admin | `src/App.tsx` |
| /area | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| /audit-trail | ProtectedRoute | admin | `src/App.tsx` |
| /automacao-regras | ProtectedRoute |  | `src/App.tsx` |
| /bitrix24 | ProtectedRoute | admin | `src/App.tsx` |
| /calendario | ProtectedRoute |  | `src/App.tsx` |
| /central-rastreamento | ProtectedRoute |  | `src/App.tsx` |
| /clientes | ProtectedRoute |  | `src/App.tsx` |
| /coletas | ProtectedRoute |  | `src/App.tsx` |
| /conciliacao | ProtectedRoute |  | `src/App.tsx` |
| /conciliacao-automatica | ProtectedRoute |  | `src/App.tsx` |
| /config-frete | ProtectedRoute |  | `src/App.tsx` |
| /configuracoes | ProtectedRoute |  | `src/App.tsx` |
| /conquistas | ProtectedRoute |  | `src/App.tsx` |
| /cotacao-frete | ProtectedRoute |  | `src/App.tsx` |
| /cotacao-multicanal | ProtectedRoute |  | `src/App.tsx` |
| /custos | ProtectedRoute |  | `src/App.tsx` |
| /dashboard-cotacoes | ProtectedRoute |  | `src/App.tsx` |
| /dashboard-executivo | ProtectedRoute |  | `src/App.tsx` |
| /despachos | ProtectedRoute |  | `src/App.tsx` |
| /envios | ProtectedRoute |  | `src/App.tsx` |
| /exportacao | ProtectedRoute |  | `src/App.tsx` |
| /fornecedores | ProtectedRoute |  | `src/App.tsx` |
| /fretes-internos | ProtectedRoute |  | `src/App.tsx` |
| /gerenciamento-usuarios | ProtectedRoute | admin | `src/App.tsx` |
| /gestao-box | ProtectedRoute |  | `src/App.tsx` |
| /gestao-rodonaves | ProtectedRoute |  | `src/App.tsx` |
| /importacao-massa | ProtectedRoute |  | `src/App.tsx` |
| /inteligencia-frete | ProtectedRoute |  | `src/App.tsx` |
| /kanban-entregas | ProtectedRoute |  | `src/App.tsx` |
| /logistica-reversa | ProtectedRoute |  | `src/App.tsx` |
| /loja | ProtectedRoute |  | `src/App.tsx` |
| /mapa-rotas | ProtectedRoute |  | `src/App.tsx` |
| /melhor-envio | ProtectedRoute |  | `src/App.tsx` |
| /notificacoes | ProtectedRoute |  | `src/App.tsx` |
| /ocorrencias | ProtectedRoute |  | `src/App.tsx` |
| /painel-otif | ProtectedRoute |  | `src/App.tsx` |
| /painel-sla | ProtectedRoute |  | `src/App.tsx` |
| /perfil | ProtectedRoute |  | `src/App.tsx` |
| /ranking | ProtectedRoute |  | `src/App.tsx` |
| /rastreamento-motorista | ProtectedRoute |  | `src/App.tsx` |
| /rastreamento/:id | ProtectedRoute |  | `scripts/inventario/gerar-rotas.unit.mjs` |
| /rastreamento/:id | ProtectedRoute |  | `src/App.tsx` |
| /rate-limit | ProtectedRoute | admin | `src/App.tsx` |
| /relatorio-pdf | ProtectedRoute |  | `src/App.tsx` |
| /relatorios | ProtectedRoute |  | `src/App.tsx` |
| /rotas-transportadoras | ProtectedRoute |  | `src/App.tsx` |
| /seguranca | ProtectedRoute | admin | `src/App.tsx` |
| /sla-dashboard | ProtectedRoute |  | `src/App.tsx` |
| /transportadoras | ProtectedRoute |  | `src/App.tsx` |
| /webhooks | ProtectedRoute | admin | `src/App.tsx` |

Guards usados: Protected, ProtectedRoute, RequireAuth

Middleware matcher (Next.js): nenhum

## Grants / Revokes (agrupados por role e privilégio)

| Ação | Para/De | Privilégios | Objetos |
|---|---|---|---|
| grant | anon | insert | `password_reset_requests` |
| grant | anon | select,maintain | `account_lockouts`, `allowed_ips`, `driver_badges`, `email_verification_tokens`, `notification_templates`, `system_adr`, `system_contract_schemas` |
| grant | anon, authenticated | execute | `get_public_tracking`, `get_public_tracking`, `get_public_tracking` |
| grant | anon, authenticated, service_role | execute | `get_public_tracking`, `xp_for_level`, `calculate_level`, `registrar_crash_ui` |
| grant | authenticated | execute | `add_user_xp`, `create_notification`, `broadcast_notification`, `get_leaderboard`, `add_user_xp`, `update_user_streak`, `add_user_xp`, `calculate_level`, `get_carrier_performance_stats`, `get_leaderboard`, `get_user_permissions`, `purchase_reward`, `update_user_streak`, `xp_for_level`, `system_health_check` … +36 |
| grant | authenticated | select | `mv_dashboard_metrics`, `mv_carrier_performance`, `db_health_snapshots`, `db_slo_daily`, `db_health_score_history`, `delay_predictions_history`, `v_prediction_accuracy`, `v_prediction_accuracy`, `rte_gateway_health` |
| grant | authenticated | select, insert, update | `index_proposals` |
| grant | authenticated | select, insert, update, delete | `remediation_actions`, `prediction_accuracy_settings`, `mitigation_actions`, `rte_slo_targets`, `rte_slo_daily_snapshots` |
| grant | authenticated | select,insert,delete,maintain,update | `account_lockouts`, `allowed_ips`, `driver_badges`, `email_verification_tokens`, `notification_templates`, `system_adr`, `system_contract_schemas` |
| grant | authenticated, service_role | execute | `has_role`, `has_permission`, `get_user_permissions`, `get_current_organization_id`, `get_leaderboard`, `get_dashboard_metrics`, `get_carrier_performance_stats`, `get_monthly_analytics`, `refresh_dashboard_views`, `get_dashboard_metrics_fast`, `get_carrier_performance_fast`, `get_transaction_health`, `get_wal_health`, `get_calibrated_tolerance`, `count_prediction_breach_days` … +4 |
| grant | authenticated, service_role | select | `v_prediction_accuracy_by_carrier`, `v_prediction_accuracy_daily`, `v_prediction_accuracy_daily_carrier` |
| grant | service_role | all | `mv_dashboard_metrics`, `mv_carrier_performance`, `db_health_snapshots`, `db_slo_daily`, `remediation_actions`, `db_health_score_history`, `index_proposals`, `delay_predictions_history`, `prediction_accuracy_settings`, `mitigation_actions`, `rte_gateway_health`, `rte_slo_targets`, `rte_slo_daily_snapshots`, `account_lockouts`, `allowed_ips` … +5 |
| grant | service_role | execute | `update_carrier_ranking`, `drop_old_partitions`, `cleanup_old_notifications`, `record_heartbeat`, `alert_slow_queries`, `public`, `ensure_monthly_partition`, `ensure_future_partitions`, `ensure_monthly_partition`, `refresh_dashboard_views`, `cleanup_old_health_snapshots`, `persist_db_health_snapshot`, `compute_db_slo_for`, `purge_rte_gateway_health`, `rte_gateway_sustained_downtime` … +6 |
| revoke | PUBLIC | all | `get_public_tracking`, `add_user_xp`, `update_user_streak`, `system_health_check`, `refresh_dashboard_views`, `internal.collect_db_health`, `persist_db_health_snapshot`, `get_health_anomalies_fast`, `compute_db_slo_for`, `get_capacity_forecast_fast`, `get_remediation_suggestions_fast`, `get_long_running_queries`, `cancel_long_running_query`, `get_lock_conflicts`, `get_cache_hit_ratios` … +15 |
| revoke | PUBLIC | execute | `add_user_xp`, `audit_trigger_func`, `calculate_level`, `cleanup_old_telemetry_logs`, `fn_audit_trigger`, `generate_coleta_numero`, `generate_entrega_numero`, `get_carrier_performance_stats`, `get_leaderboard`, `get_user_permissions`, `handle_new_user`, `handle_new_user_levels`, `notify_coleta_atrasada`, `notify_conquista_desbloqueada`, `notify_entrega_atrasada` … +23 |
| revoke | PUBLIC, anon | all | `refresh_dashboard_views`, `get_dashboard_metrics_fast`, `get_carrier_performance_fast`, `get_query_regressions_fast`, `get_top_queries_fast`, `get_cron_jobs_status`, `get_table_coaccess_graph`, `get_seq_scan_hotspots`, `get_unused_indexes`, `get_bloat_hotspots`, `get_unindexed_foreign_keys`, `get_transaction_health`, `get_wal_health` |
| revoke | PUBLIC, anon | execute | `execute_nexus_protocol`, `system_health_check`, `count_prediction_breach_days`, `count_prediction_breach_days_bulk` |
| revoke | PUBLIC, anon, authenticated | all | `drop_old_partitions`, `cleanup_old_notifications`, `record_heartbeat`, `alert_slow_queries`, `update_user_rank`, `handle_new_user_levels`, `audit_log_trigger`, `tr_increment_version`, `handle_optimistic_locking`, `update_performance_metrics`, `fn_audit_trigger`, `update_device_last_seen`, `generate_entrega_numero`, `generate_coleta_numero`, `notify_coleta_atrasada` … +32 |
| revoke | PUBLIC, anon, authenticated | execute | `ensure_monthly_partition`, `ensure_future_partitions`, `ensure_monthly_partition`, `cleanup_old_telemetry_logs`, `cleanup_old_telemetry_logs`, `cleanup_old_notifications`, `drop_old_partitions`, `ensure_monthly_partition`, `ensure_future_partitions`, `reconcile_pending_freights`, `alert_slow_queries`, `record_heartbeat`, `validate_payload_schema`, `add_user_xp`, `update_user_streak` … +22 |
| revoke | anon | all | `bio_sync_telemetry`, `nexus_tactical_logs`, `carrier_rankings`, `kanban_history`, `transportadoras`, `organizations`, `purge_webhook_inbound_failures`, `reconcile_pending_freights` |
| revoke | anon | execute | `add_user_xp`, `calculate_level`, `cleanup_old_telemetry_logs`, `get_carrier_performance_stats`, `get_leaderboard`, `get_user_permissions`, `purchase_reward`, `update_user_streak`, `xp_for_level`, `update_carrier_ranking`, `get_autovacuum_health`, `get_wraparound_status`, `get_active_sessions_summary`, `get_top_tables_by_size`, `get_rls_audit` … +28 |
| revoke | anon | insert, update, delete, truncate, trigger, references | `public` |
| revoke | anon, authenticated | execute | `cleanup_old_contract_test_logs` |
| revoke | anon, public | execute | `audit_log_trigger`, `cleanup_old_telemetry_logs`, `execute_nexus_protocol`, `get_current_organization_id`, `get_monthly_analytics`, `log_biometric_anomaly`, `reconcile_pending_freights`, `update_user_rank`, `validate_payload_schema` |
| revoke | authenticated | all | `purge_webhook_inbound_failures`, `reconcile_pending_freights` |
| revoke | authenticated | truncate, trigger, references | `public` |
| revoke | public | all | `registrar_crash_ui` |
| revoke | public | execute | `get_dashboard_metrics`, `update_user_streak` |
| revoke | public, anon | all | `get_remediation_mttr_fast`, `refresh_dashboard_views`, `get_dashboard_metrics_fast`, `get_carrier_performance_fast` |
| revoke | public, anon, authenticated | all | `system_health_check` |

## Riscos de acesso detectados

| Tabela | Problema | Arquivos |
|---|---|---|
| `geo_blocking_rules` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/components/security/GeoBlockingPanel.tsx` |
| `geo_blocking_settings` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/components/security/GeoBlockingPanel.tsx` |
| `notificacoes_custo` | front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/hooks/logistics/useCostAlerts.tsx` |

## Multi-tenancy

- Chave de tenant: **`organization_id`** presente em 2 tabela(s): `profiles`, `fretes_internos`
- Cobertura: 1% das tabelas. Abaixo de 60% — isolamento provavelmente por usuário (auth.uid()) ou misto; não flagado por tabela.

## Soft delete (registros 'apagados' continuam na tabela — filtre!)

| Tabela | Coluna |
|---|---|
| `transportadoras` | `deleted_at` |
| `fornecedores` | `deleted_at` |
| `coletas` | `deleted_at` |
| `clientes` | `deleted_at` |
| `entregas` | `deleted_at` |
| `tabelas_frete` | `ativo` |
| `alertas_custo` | `ativo` |
| `fretes_internos` | `deleted_at` |
| `business_rules` | `is_active` |
| `transportadora_rotas` | `ativo` |
| `ip_access_rules` | `is_active` |
| `geo_access_rules` | `is_active` |
| `rewards` | `is_active` |
| `client_webhooks` | `active` |
| `freight_selection_rules` | `is_active` |
| `freight_integration_mappings` | `is_active` |
| `freight_webhooks` | `is_active` |
| `bitrix_sync_config` | `is_active` |
| `bio_sync_alert_rules` | `is_active` |
| `geo_blocking_rules` | `is_active` |
| `allowed_ips` | `is_active` |
| `notification_templates` | `is_active` |
| `scheduled_reports` | `is_active` |

## Auditoria (colunas de rastreio)

| Tabela | Colunas |
|---|---|
| `transportadoras` | `created_at`, `updated_at` |
| `fornecedores` | `created_at`, `updated_at` |
| `coletas` | `created_at`, `updated_at` |
| `clientes` | `created_at`, `updated_at` |
| `entregas` | `created_at`, `updated_at` |
| `ocorrencias` | `created_at` |
| `cotacoes_frete` | `created_at` |
| `profiles` | `created_at`, `updated_at` |
| `user_roles` | `created_at` |
| `user_levels` | `created_at`, `updated_at` |
| `achievements` | `created_at` |
| `tabelas_frete` | `created_at`, `updated_at` |
| `alertas_custo` | `created_at`, `created_by`, `updated_at` |
| `notificacoes_custo` | `created_at` |
| `rastreamento_alertas` | `created_at` |
| `fretes_internos` | `created_at`, `updated_at` |
| `notifications` | `created_at` |
| `comments` | `created_at`, `updated_at` |
| `reward_items` | `created_at` |
| `reward_purchases` | `created_at` |
| `conciliacoes` | `created_at`, `created_by`, `updated_at` |
| `conciliacao_itens_importados` | `created_at` |
| `user_onboarding` | `created_at`, `updated_at` |
| `business_rules` | `created_at`, `created_by`, `updated_at` |
| `rule_execution_logs` | `created_at` |
| `transportadora_rotas` | `created_at`, `updated_at` |
| `ai_chat_messages` | `created_at` |
| `password_reset_requests` | `created_at` |
| `ip_access_rules` | `created_at`, `created_by`, `updated_at` |
| `login_attempts` | `created_at` |
| `rate_limit_logs` | `created_at` |
| `user_sessions` | `created_at` |
| `permissions` | `created_at` |
| `role_permissions` | `created_at` |
| `security_events` | `created_at` |
| `webauthn_credentials` | `created_at` |
| `webauthn_challenges` | `created_at` |
| `geo_access_rules` | `created_at`, `created_by` |
| `geo_blocked_attempts` | `created_at` |
| `user_gamification` | `created_at`, `updated_at` |
| `reward_redemptions` | `created_at` |
| `rewards` | `created_at` |
| `cotacoes_multicanal` | `created_at`, `updated_at` |
| `client_webhooks` | `created_at`, `created_by`, `updated_at` |
| `webhook_deliveries` | `created_at` |
| `query_telemetry` | `created_at` |
| `user_notification_preferences` | `created_at`, `updated_at` |
| `telemetry_logs` | `created_at` |
| `push_subscriptions` | `created_at`, `updated_at` |
| `logistica_reversa` | `created_at`, `created_by`, `updated_at` |
| `feature_flags` | `created_at`, `updated_at` |
| `error_events` | `created_at` |
| `audit_logs` | `created_at` |
| `business_rules_config` | `updated_at`, `updated_by` |
| `architecture_decisions` | `created_at`, `updated_at` |
| `rastreamento_historico` | `created_at` |
| `ai_delay_predictions` | `created_at` |
| `freight_selection_rules` | `created_at`, `updated_at` |
| `freight_integration_mappings` | `created_at` |
| `freight_decisions` | `created_at` |
| `freight_webhooks` | `created_at`, `updated_at` |
| `automation_audit_logs` | `created_at` |
| `user_ranks` | `created_at` |
| `performance_metrics` | `created_at`, `updated_at` |
| `bitrix_sync_config` | `created_at`, `updated_at` |
| `bitrix_sync_logs` | `created_at` |
| `sla_alerts` | `created_at` |
| `kanban_history` | `created_at` |
| `delivery_receipt_audit` | `created_at` |
| `system_integrity_logs` | `created_at` |
| `contract_test_logs` | `created_at` |
| `organizations` | `created_at`, `updated_at` |
| `nexus_tactical_logs` | `created_at` |
| `bio_sync_telemetry` | `created_at` |
| `risk_zones` | `created_at` |
| `bio_sync_alert_rules` | `created_at`, `updated_at` |
| `db_health_snapshots` | `created_at` |
| `remediation_actions` | `created_at`, `updated_at` |
| `db_health_score_history` | `created_at` |
| `index_proposals` | `created_at`, `updated_at` |
| `delay_predictions_history` | `created_at` |
| `prediction_accuracy_settings` | `created_at`, `updated_at` |
| `mitigation_actions` | `created_at`, `updated_at` |
| `rte_gateway_health` | `created_at` |
| `rte_slo_targets` | `created_at`, `updated_at`, `updated_by` |
| `rte_slo_daily_snapshots` | `created_at`, `updated_at` |
| `geo_blocking_rules` | `created_at`, `created_by`, `updated_at` |
| `user_panel_preferences` | `created_at`, `updated_at` |
| `webhook_inbound_failures` | `created_at` |
| `account_lockouts` | `created_at`, `updated_at` |
| `allowed_ips` | `created_at`, `created_by`, `updated_at` |
| `email_verification_tokens` | `created_at` |
| `notification_templates` | `created_at`, `updated_at` |
| `system_adr` | `created_at`, `updated_at` |
| `system_contract_schemas` | `created_at`, `updated_at` |
| `audit_logs_y2026m07` | `created_at` |
| `audit_logs_y2026m08` | `created_at` |
| `audit_logs_y2026m09` | `created_at` |
| `audit_logs_y2026m10` | `created_at` |
| `audit_logs_y2026m11` | `created_at` |
| `audit_logs_y2026m12` | `created_at` |
| `audit_logs_y2027m01` | `created_at` |
| `audit_logs_y2027m02` | `created_at` |
| `audit_logs_y2027m03` | `created_at` |
| `audit_logs_y2027m04` | `created_at` |
| `audit_logs_y2027m05` | `created_at` |
| `audit_logs_y2027m06` | `created_at` |
| `audit_logs_y2027m07` | `created_at` |
| `geo_blocking_settings` | `updated_at`, `updated_by` |
| `rastreamento_historico_y2026m01` | `created_at` |
| `rastreamento_historico_y2026m02` | `created_at` |
| `rastreamento_historico_y2026m03` | `created_at` |
| `rastreamento_historico_y2026m04` | `created_at` |
| `rastreamento_historico_y2026m05` | `created_at` |
| `rastreamento_historico_y2026m06` | `created_at` |
| `rastreamento_historico_y2026m07` | `created_at` |
| `rastreamento_historico_y2026m08` | `created_at` |
| `rastreamento_historico_y2026m09` | `created_at` |
| `rastreamento_historico_y2026m10` | `created_at` |
| `rastreamento_historico_y2026m11` | `created_at` |
| `rastreamento_historico_y2026m12` | `created_at` |
| `rastreamento_historico_y2027m01` | `created_at` |
| `rastreamento_historico_y2027m02` | `created_at` |
| `rastreamento_historico_y2027m03` | `created_at` |
| `rastreamento_historico_y2027m04` | `created_at` |
| `rastreamento_historico_y2027m05` | `created_at` |
| `rastreamento_historico_y2027m06` | `created_at` |
| `scheduled_reports` | `created_at`, `updated_at` |

## Dados pessoais / sensíveis (LGPD — cuidado em logs, exports, prompts de IA)

| Tabela | Coluna |
|---|---|
| `transportadoras` | `cnpj` |
| `fornecedores` | `cnpj` |
| `fornecedores` | `cep` |
| `clientes` | `cnpj` |
| `clientes` | `cep` |
| `entregas` | `latitude` |
| `entregas` | `longitude` |
| `profiles` | `email` |
| `rastreamento_alertas` | `latitude` |
| `rastreamento_alertas` | `longitude` |
| `password_reset_requests` | `email` |
| `login_attempts` | `email` |
| `login_attempts` | `ip_address` |
| `rate_limit_logs` | `ip_address` |
| `user_sessions` | `ip_address` |
| `security_events` | `ip_address` |
| `known_devices` | `ip_address` |
| `geo_blocked_attempts` | `ip_address` |
| `geo_blocked_attempts` | `email` |
| `audit_logs` | `ip_address` |
| `rastreamento_historico` | `latitude` |
| `rastreamento_historico` | `longitude` |
| `prediction_accuracy_settings` | `email` |
| `account_lockouts` | `email` |
| `allowed_ips` | `ip_address` |
| `audit_logs_y2026m07` | `ip_address` |
| `audit_logs_y2026m08` | `ip_address` |
| `audit_logs_y2026m09` | `ip_address` |
| `audit_logs_y2026m10` | `ip_address` |
| `audit_logs_y2026m11` | `ip_address` |
| `audit_logs_y2026m12` | `ip_address` |
| `audit_logs_y2027m01` | `ip_address` |
| `audit_logs_y2027m02` | `ip_address` |
| `audit_logs_y2027m03` | `ip_address` |
| `audit_logs_y2027m04` | `ip_address` |
| `audit_logs_y2027m05` | `ip_address` |
| `audit_logs_y2027m06` | `ip_address` |
| `audit_logs_y2027m07` | `ip_address` |
| `rastreamento_historico_y2026m01` | `latitude` |
| `rastreamento_historico_y2026m01` | `longitude` |
| `rastreamento_historico_y2026m02` | `latitude` |
| `rastreamento_historico_y2026m02` | `longitude` |
| `rastreamento_historico_y2026m03` | `latitude` |
| `rastreamento_historico_y2026m03` | `longitude` |
| `rastreamento_historico_y2026m04` | `latitude` |
| `rastreamento_historico_y2026m04` | `longitude` |
| `rastreamento_historico_y2026m05` | `latitude` |
| `rastreamento_historico_y2026m05` | `longitude` |
| `rastreamento_historico_y2026m06` | `latitude` |
| `rastreamento_historico_y2026m06` | `longitude` |
| `rastreamento_historico_y2026m07` | `latitude` |
| `rastreamento_historico_y2026m07` | `longitude` |
| `rastreamento_historico_y2026m08` | `latitude` |
| `rastreamento_historico_y2026m08` | `longitude` |
| `rastreamento_historico_y2026m09` | `latitude` |
| `rastreamento_historico_y2026m09` | `longitude` |
| `rastreamento_historico_y2026m10` | `latitude` |
| `rastreamento_historico_y2026m10` | `longitude` |
| `rastreamento_historico_y2026m11` | `latitude` |
| `rastreamento_historico_y2026m11` | `longitude` |
| `rastreamento_historico_y2026m12` | `latitude` |
| `rastreamento_historico_y2026m12` | `longitude` |
| `rastreamento_historico_y2027m01` | `latitude` |
| `rastreamento_historico_y2027m01` | `longitude` |
| `rastreamento_historico_y2027m02` | `latitude` |
| `rastreamento_historico_y2027m02` | `longitude` |
| `rastreamento_historico_y2027m03` | `latitude` |
| `rastreamento_historico_y2027m03` | `longitude` |
| `rastreamento_historico_y2027m04` | `latitude` |
| `rastreamento_historico_y2027m04` | `longitude` |
| `rastreamento_historico_y2027m05` | `latitude` |
| `rastreamento_historico_y2027m05` | `longitude` |
| `rastreamento_historico_y2027m06` | `latitude` |
| `rastreamento_historico_y2027m06` | `longitude` |

## Colunas de dinheiro (tipo importa: numeric ✅ / float ❌)

| Tabela | Coluna | Tipo |
|---|---|---|
| `coletas` | `custo_estimado` | `NUMERIC(10,2)` |
| `coletas` | `custo_real` | `NUMERIC(10,2)` |
| `entregas` | `valor_frete` | `DECIMAL(10,2)` |
| `cotacoes_frete` | `valor` | `DECIMAL(10,2)` |
| `user_levels` | `total_xp` | `INTEGER` |
| `tabelas_frete` | `preco_por_kg` | `NUMERIC` |
| `tabelas_frete` | `taxa_fixa` | `NUMERIC` |
| `notificacoes_custo` | `valor_atual` | `NUMERIC` |
| `conciliacoes` | `total_itens_importados` | `INTEGER` |
| `conciliacoes` | `total_itens_conciliados` | `INTEGER` |
| `conciliacoes` | `total_divergencias` | `INTEGER` |
| `conciliacoes` | `valor_total_importado` | `NUMERIC(12,2)` |
| `conciliacoes` | `valor_total_sistema` | `NUMERIC(12,2)` |
| `conciliacao_itens_importados` | `valor` | `NUMERIC(12,2)` |
| `transportadora_rotas` | `preco_por_kg` | `NUMERIC` |
| `transportadora_rotas` | `taxa_fixa` | `NUMERIC` |
| `user_gamification` | `total_deliveries` | `INT` |
| `user_gamification` | `total_collections` | `INT` |
| `rewards` | `cost_coins` | `INT` |
| `cotacoes_multicanal` | `valor_mercadoria` | `NUMERIC` |
| `cotacoes_multicanal` | `valor_cotado` | `NUMERIC` |
| `logistica_reversa` | `valor_estorno` | `DECIMAL(10,2)` |
| `freight_selection_rules` | `price_weight` | `NUMERIC` |
| `performance_metrics` | `total_freights` | `INTEGER` |
| `carrier_rankings` | `total_shipments` | `INTEGER` |
| `internal.query_baseline` | `total_exec_time` | `double` |
| `db_health_snapshots` | `total_connections` | `int` |
| `v_prediction_accuracy` | `total_acertos` | `number` |
| `v_prediction_accuracy` | `total_confirmadas` | `number` |
| `v_prediction_accuracy` | `total_predicoes` | `number` |
| `v_prediction_accuracy_by_carrier` | `total_acertos` | `number` |
| `v_prediction_accuracy_by_carrier` | `total_confirmadas` | `number` |
| `v_prediction_accuracy_by_carrier` | `total_predicoes` | `number` |
| `v_prediction_accuracy_daily` | `total_confirmadas` | `number` |
| `v_prediction_accuracy_daily_carrier` | `total_confirmadas` | `number` |
