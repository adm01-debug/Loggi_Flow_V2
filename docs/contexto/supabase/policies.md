# Policies (RLS)


Visão consolidada (inclui `storage.objects` e `realtime.messages`); detalhes por tabela em `tables/`.

| tabela | policy | cmd | tipo | roles | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| public.achievements | Admins can manage achievements | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.achievements | Anyone can view achievements | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.ai_chat_messages | Users can create their own chat messages | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.ai_chat_messages | Users can delete their own chat messages | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.ai_chat_messages | Users can view their own chat messages | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.ai_delay_predictions | Admins can manage AI delay predictions | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.ai_delay_predictions | Users can view AI delay predictions | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.alertas_custo | Admins can delete alertas_custo | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.alertas_custo | Admins can insert alertas_custo | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.alertas_custo | Admins can update alertas_custo | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.alertas_custo | Admins can view alertas_custo | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.architecture_decisions | Admins can manage ADRs | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.audit_logs | Allow admins to view audit logs | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.audit_logs | Authenticated can insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs | Strict insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs | Users can view their organization's audit logs | SELECT | PERMISSIVE | public | `(user_id IN ( SELECT profiles.id    FROM profiles   WHERE (profiles.organization_id = get_current_organization_id())))` |  |
| public.audit_logs_y2026m07 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2026m07 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2026m08 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2026m08 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2026m09 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2026m09 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2026m10 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2026m10 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2026m11 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2026m11 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2026m12 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2026m12 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2027m01 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2027m01 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2027m02 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2027m02 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2027m03 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2027m03 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2027m04 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2027m04 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2027m05 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2027m05 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2027m06 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2027m06 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.audit_logs_y2027m07 | Admins view audit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs_y2027m07 | Authenticated insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.automation_audit_logs | Admins manage automation_audit_logs | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.automation_audit_logs | Authenticated read automation_audit_logs | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.bio_sync_alert_rules | Admins manage alert rules | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.bio_sync_alert_rules | Regras de alerta visíveis a usuários autenticados | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.bio_sync_telemetry | Admins insert bio telemetry | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.bio_sync_telemetry | Authenticated read bio telemetry | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.bitrix_sync_config | Admins manage bitrix_sync_config | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.bitrix_sync_logs | Admins manage bitrix_sync_logs | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.business_rules | Admins can manage business rules | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.business_rules | Authenticated users can view business rules | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.business_rules_config | Business rules are viewable by all authenticated users | SELECT | PERMISSIVE | public | `(auth.role() = 'authenticated'::text)` |  |
| public.business_rules_config | Business rules can only be managed by admins | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.carrier_rankings | Authenticated view carrier rankings | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.client_webhooks | Webhook admin can delete | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.client_webhooks | Webhook owners can insert | INSERT | PERMISSIVE | authenticated |  | `(created_by = auth.uid())` |
| public.client_webhooks | Webhook owners can update | UPDATE | PERMISSIVE | authenticated | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.client_webhooks | Webhook owners can view | SELECT | PERMISSIVE | authenticated | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.clientes | Admins can delete clientes | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.clientes | Admins can insert clientes | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.clientes | Admins can update clientes | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.clientes | Authenticated users can view clientes | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.coletas | Admins can delete coletas | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.coletas | Admins can update coletas | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.coletas | Auth users can insert coletas | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.coletas | Authenticated users can view coletas | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.comments | Users can create their own comments | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.comments | Users can delete their own comments | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.comments | Users can update their own comments | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.comments | Users can view all comments | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.conciliacao_itens_importados | Admins can delete conciliacao_itens | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.conciliacao_itens_importados | Admins can insert conciliacao_itens | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.conciliacao_itens_importados | Admins can update conciliacao_itens | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.conciliacao_itens_importados | Admins can view conciliacao_itens | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.conciliacoes | Admin delete conciliacoes | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.conciliacoes | Admin or creator can view conciliacoes | SELECT | PERMISSIVE | authenticated | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.conciliacoes | Admins can insert conciliacoes | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.conciliacoes | Admins can update conciliacoes | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.contract_test_logs | Admins insert test logs | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.cotacoes_frete | Admins can delete cotacoes_frete | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.cotacoes_frete | Admins can insert cotacoes_frete | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.cotacoes_frete | Admins can update cotacoes_frete | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.cotacoes_frete | Auth users can view cotacoes_frete | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.cotacoes_multicanal | Admins can delete cotacoes_multicanal | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.cotacoes_multicanal | Users can insert own cotacoes_multicanal | INSERT | PERMISSIVE | authenticated |  | `(user_id = auth.uid())` |
| public.cotacoes_multicanal | Users can update own cotacoes_multicanal | UPDATE | PERMISSIVE | authenticated | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.cotacoes_multicanal | Users can view own cotacoes_multicanal | SELECT | PERMISSIVE | authenticated | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.db_health_score_history | Admins can view health score history | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.db_health_snapshots | Admins can view db health snapshots | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.db_slo_daily | Admins can view db slo daily | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.delay_predictions_history | admin_full_access_predictions | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.delay_predictions_history | authenticated_read_all_predictions | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.delay_predictions_history | service_role_all_predictions | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.delivery_receipt_audit | Admins view delivery receipt audit | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.delivery_receipt_audit | System inserts delivery receipt audit | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.entregas | Admins can delete entregas | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.entregas | Admins can update entregas | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.entregas | Auth users can insert entregas | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.entregas | Authenticated users can view entregas | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.error_events | Admins can view all error events | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.error_events | Users can insert their own errors | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.feature_flags | Authenticated users can view feature flags | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.feature_flags | Only admins can modify feature flags | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.fornecedores | Admins can delete fornecedores | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.fornecedores | Admins can insert fornecedores | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.fornecedores | Admins can update fornecedores | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.fornecedores | Authenticated users can view fornecedores | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.freight_decisions | Service role inserts decisions | INSERT | PERMISSIVE | service_role |  | `true` |
| public.freight_decisions | Users can view their own freight decisions | SELECT | PERMISSIVE | authenticated | `((auth.uid() = user_id) OR (auth.role() = 'service_role'::text))` |  |
| public.freight_integration_mappings | Admins manage integration mappings | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.freight_integration_mappings | Allow read for mappings | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.freight_selection_rules | Admins manage selection rules | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.freight_selection_rules | Allow read for rules | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.freight_webhooks | Admins manage freight_webhooks | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.fretes_internos | Admin delete fretes_internos | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.fretes_internos | Admins can update fretes_internos | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.fretes_internos | Authenticated users can insert fretes_internos | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.fretes_internos | Authenticated users can view fretes_internos | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.fretes_internos | Users can insert their organization's fretes | INSERT | PERMISSIVE | public |  | `(organization_id = get_current_organization_id())` |
| public.fretes_internos | Users can view their organization's fretes | SELECT | PERMISSIVE | public | `(organization_id = get_current_organization_id())` |  |
| public.geo_access_rules | Admins can manage geo access rules | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.geo_blocked_attempts | Admins can view geo blocked attempts | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.geo_blocked_attempts | Strict log geo blocked attempts | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.geo_blocking_rules | Admins can manage geo blocking rules | ALL | PERMISSIVE | public | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.geo_blocking_rules | Admins can view geo rules | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.geo_blocking_settings | Admins can manage geo settings | ALL | PERMISSIVE | public | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.geo_blocking_settings | Admins can view geo settings | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.idempotency_keys | Admins view idempotency logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.index_proposals | Admins can insert index proposals | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.index_proposals | Admins can update index proposals | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.index_proposals | Admins can view index proposals | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.ip_access_rules | Admins can manage IP rules | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.ip_access_rules | Admins can view IP rules | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.kanban_history | Authenticated insert kanban history | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.kanban_history | Authenticated view kanban history | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.known_devices | Users can delete their own devices | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.known_devices | Users can insert their own devices | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.known_devices | Users can update their own devices | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.known_devices | Users can view their own devices | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.login_attempts | Admins can view login attempts | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.login_attempts | Strict log login attempts | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.logistica_reversa | Apenas admins podem atualizar solicitações | UPDATE | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.logistica_reversa | Logística Reversa visível para todos os usuários autenticado | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.logistica_reversa | Usuários podem inserir solicitações de logística reversa | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.mitigation_actions | Users manage own mitigations | ALL | PERMISSIVE | authenticated | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.nexus_tactical_logs | Admins insert tactical logs | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.nexus_tactical_logs | Authenticated read tactical logs | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.notificacoes_custo | Admins can insert notificacoes_custo | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.notificacoes_custo | Admins can view notificacoes_custo | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.notifications | Strict insert notifications | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.notifications | Users can create their own notifications | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.notifications | Users can delete their own notifications | DELETE | PERMISSIVE | public | `(auth.uid() = user_id)` |  |
| public.notifications | Users can update their own notifications | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.notifications | Users can view their own notifications | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.ocorrencias | Admin delete ocorrencias | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.ocorrencias | Admins can update ocorrencias | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.ocorrencias | Insert ocorrencias | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.ocorrencias | View ocorrencias | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.organizations | Admins manage organizations | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.organizations | Authenticated read organizations | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.password_reset_requests | Admins can manage password reset requests | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.password_reset_requests | Public can create pending reset requests | INSERT | PERMISSIVE | public |  | `((email IS NOT NULL) AND (length(email) > 0) AND (status = 'pending'::text) AND (reviewed_at IS NULL) AND (reviewed_by IS NULL))` |
| public.performance_metrics | Admins manage performance_metrics | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.performance_metrics | Authenticated read performance_metrics | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.permissions | Admins can manage permissions | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.permissions | Authenticated users can view permissions | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.prediction_accuracy_settings | Users manage own accuracy settings | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.profiles | Admins can view all profiles | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.profiles | Users can update their own profile | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = id)` |  |
| public.profiles | Users can view their own profile | SELECT | PERMISSIVE | authenticated | `(auth.uid() = id)` |  |
| public.push_subscriptions | Users can manage their own push subscriptions | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.query_telemetry | Admins can delete telemetry | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.query_telemetry | Admins can view telemetry | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.query_telemetry | Users can insert own telemetry | INSERT | PERMISSIVE | authenticated |  | `((user_id = auth.uid()) OR (user_id IS NULL))` |
| public.rastreamento_alertas | Admins can update rastreamento_alertas | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.rastreamento_alertas | Authenticated users can insert tracking alerts | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_alertas | Authenticated users can update tracking alerts | UPDATE | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.rastreamento_alertas | Authenticated users can view tracking alerts | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.rastreamento_alertas | Strict insert rastreamento alertas | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico | Admins can view tracking history | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico | Strict insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m01 | Admins can view tracking history y2026m01 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m01 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m02 | Admins can view tracking history y2026m02 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m02 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m03 | Admins can view tracking history y2026m03 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m03 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m04 | Admins can view tracking history y2026m04 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m04 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m05 | Admins can view tracking history y2026m05 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m05 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m06 | Admins can view tracking history y2026m06 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m06 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m07 | Admins can view tracking history y2026m07 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m07 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m08 | Admins can view tracking history y2026m08 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m08 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m09 | Admins can view tracking history y2026m09 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m09 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m10 | Admins can view tracking history y2026m10 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m10 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m11 | Admins can view tracking history y2026m11 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m11 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2026m12 | Admins can view tracking history y2026m12 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2026m12 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2027m01 | Admins can view tracking history y2027m01 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2027m01 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2027m02 | Admins can view tracking history y2027m02 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2027m02 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2027m03 | Admins can view tracking history y2027m03 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2027m03 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2027m04 | Admins can view tracking history y2027m04 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2027m04 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2027m05 | Admins can view tracking history y2027m05 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2027m05 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rastreamento_historico_y2027m06 | Admins can view tracking history y2027m06 | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rastreamento_historico_y2027m06 | Authenticated can insert tracking data | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.rate_limit_logs | Admins can delete rate limit logs | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rate_limit_logs | Admins can view rate limit logs | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rate_limit_logs | Strict insert rate limit logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.remediation_actions | Admins can delete remediation actions | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.remediation_actions | Admins can insert remediation actions | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.remediation_actions | Admins can update remediation actions | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.remediation_actions | Admins can view remediation actions | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.reward_items | Admins podem gerenciar itens | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.reward_items | Authenticated users can view reward items | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.reward_purchases | Admins podem atualizar compras | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.reward_purchases | Admins podem ver todas compras | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.reward_purchases | Usuários podem criar compras | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.reward_purchases | Usuários podem ver suas compras | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.risk_zones | Users can view risk zones | SELECT | PERMISSIVE | public | `(auth.role() = 'authenticated'::text)` |  |
| public.role_permissions | Admins can manage role permissions | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.role_permissions | Auth users can view role permissions | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.rte_gateway_health | Admins can delete gateway health history | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rte_gateway_health | Authenticated users can read gateway health | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.rte_slo_daily_snapshots | Admins can delete slo snapshots | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rte_slo_daily_snapshots | Admins can insert slo snapshots | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.rte_slo_daily_snapshots | Admins can update slo snapshots | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.rte_slo_daily_snapshots | Authenticated can read slo snapshots | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.rte_slo_targets | Admins podem atualizar metas de SLO | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.rte_slo_targets | Admins podem inserir metas de SLO | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.rte_slo_targets | Admins podem remover metas de SLO | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rte_slo_targets | Autenticados podem ver metas de SLO | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.rule_execution_logs | Authenticated users can view rule logs | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.rule_execution_logs | Strict insert rule logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.scheduled_reports | Users can create their own scheduled reports | INSERT | PERMISSIVE | public |  | `(auth.uid() = user_id)` |
| public.scheduled_reports | Users can delete their own scheduled reports | DELETE | PERMISSIVE | public | `(auth.uid() = user_id)` |  |
| public.scheduled_reports | Users can update their own scheduled reports | UPDATE | PERMISSIVE | public | `(auth.uid() = user_id)` |  |
| public.scheduled_reports | Users can view their own scheduled reports | SELECT | PERMISSIVE | public | `(auth.uid() = user_id)` |  |
| public.security_events | Admins can view security events | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.security_events | Strict insert security events | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.security_events | Users can insert their own security events | INSERT | PERMISSIVE | authenticated |  | `((auth.uid() IS NOT NULL) AND ((user_id IS NULL) OR (user_id = auth.uid())))` |
| public.sla_alerts | Admins manage sla_alerts | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.sla_alerts | Authenticated read sla_alerts | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.system_heartbeat | Heartbeat visível a usuários autenticados | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.system_integrity_logs | Admins can manage system logs | ALL | PERMISSIVE | authenticated | `(auth.uid() IN ( SELECT profiles.id    FROM profiles   WHERE ((profiles.cargo = 'admin'::text) OR (profiles.cargo = 'gestor'::text))))` |  |
| public.tabelas_frete | Admins can delete tabelas_frete | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.tabelas_frete | Admins can insert tabelas_frete | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.tabelas_frete | Admins can update tabelas_frete | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.tabelas_frete | Auth users can view tabelas_frete | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.telemetry_logs | Admins can view all telemetry logs | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.telemetry_logs | Strict insert telemetry logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.transportadora_rotas | Admins can delete transportadora_rotas | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.transportadora_rotas | Admins can insert transportadora_rotas | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.transportadora_rotas | Admins can update transportadora_rotas | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.transportadora_rotas | Auth users can view transportadora_rotas | SELECT | PERMISSIVE | authenticated | `(auth.uid() IS NOT NULL)` |  |
| public.transportadoras | Admins can delete transportadoras | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.transportadoras | Admins can insert transportadoras | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.transportadoras | Admins can update transportadoras | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.transportadoras | Authenticated users can view transportadoras | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.user_achievements | Strict insert user achievements | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.user_achievements | Users can view their achievements | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.user_levels | Strict insert user levels | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.user_levels | Users can view their own level | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.user_notification_preferences | Users can insert own notification preferences | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.user_notification_preferences | Users can update own notification preferences | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.user_notification_preferences | Users can view own notification preferences | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.user_onboarding | Users can insert their own onboarding progress | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.user_onboarding | Users can update their own onboarding progress | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.user_onboarding | Users can view their own onboarding progress | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.user_panel_preferences | Users can insert own panel preferences | INSERT | PERMISSIVE | public |  | `(auth.uid() = user_id)` |
| public.user_panel_preferences | Users can update own panel preferences | UPDATE | PERMISSIVE | public | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.user_panel_preferences | Users can view own panel preferences | SELECT | PERMISSIVE | public | `(auth.uid() = user_id)` |  |
| public.user_ranks | Ranks visíveis a usuários autenticados | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.user_roles | Only admins can delete roles | DELETE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_roles | Only admins can insert roles | INSERT | PERMISSIVE | authenticated |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.user_roles | Only admins can update roles | UPDATE | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_roles | Users can view their own roles | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.user_sessions | Admins can view all sessions | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_sessions | Users can delete their own sessions | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.user_sessions | Users can insert their own sessions | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.user_sessions | Users can update their own sessions | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.user_sessions | Users can view their own sessions | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.webauthn_challenges | Admins manage registration challenges | ALL | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.webauthn_challenges | Users can manage their own challenges | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.webauthn_credentials | Users can delete their own credentials | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.webauthn_credentials | Users can insert their own credentials | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.webauthn_credentials | Users can update their own credentials | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.webauthn_credentials | Users can view their own credentials | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.webhook_deliveries | Strict insert webhook deliveries | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() IS NOT NULL)` |
| public.webhook_deliveries | Webhook owners can view deliveries | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM client_webhooks w   WHERE ((w.id = webhook_deliveries.webhook_id) AND ((w.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.webhook_events_processed | Admins can view webhook logs | SELECT | PERMISSIVE | authenticated | `(auth.uid() IN ( SELECT profiles.id    FROM profiles   WHERE (profiles.cargo = 'admin'::text)))` |  |
| public.webhook_events_processed | Admins read webhook processing | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.webhook_inbound_failures | Admins can view webhook inbound failures | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.webhook_inbound_failures | System can insert webhook inbound failures | INSERT | PERMISSIVE | service_role |  | `true` |
| storage.objects | Avatars readable by authenticated | SELECT | PERMISSIVE | authenticated | `(bucket_id = 'avatars'::text)` |  |
| storage.objects | Documents: entregas atualizacao | UPDATE | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'entregas'::text))` | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'entregas'::text))` |
| storage.objects | Documents: entregas leitura | SELECT | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'entregas'::text))` |  |
| storage.objects | Documents: entregas remocao | DELETE | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'entregas'::text))` |  |
| storage.objects | Documents: entregas upload | INSERT | PERMISSIVE | authenticated |  | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'entregas'::text))` |
| storage.objects | Documents: users can delete own files | DELETE | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |  |
| storage.objects | Documents: users can update own files | UPDATE | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |  |
| storage.objects | Documents: users can upload own files | INSERT | PERMISSIVE | authenticated |  | `((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |
| storage.objects | Documents: users can view own files | SELECT | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |  |
| storage.objects | Ocorrencias fotos: atualizacao autenticada | UPDATE | PERMISSIVE | authenticated | `(bucket_id = 'ocorrencias-fotos'::text)` | `(bucket_id = 'ocorrencias-fotos'::text)` |
| storage.objects | Ocorrencias fotos: leitura autenticada | SELECT | PERMISSIVE | authenticated | `(bucket_id = 'ocorrencias-fotos'::text)` |  |
| storage.objects | Ocorrencias fotos: remocao autenticada | DELETE | PERMISSIVE | authenticated | `(bucket_id = 'ocorrencias-fotos'::text)` |  |
| storage.objects | Ocorrencias fotos: upload autenticado | INSERT | PERMISSIVE | authenticated |  | `(bucket_id = 'ocorrencias-fotos'::text)` |
| storage.objects | Users delete own avatar | DELETE | PERMISSIVE | authenticated | `((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |  |
| storage.objects | Users update own avatar | UPDATE | PERMISSIVE | authenticated | `((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |  |
| storage.objects | Users upload own avatar | INSERT | PERMISSIVE | authenticated |  | `((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |
