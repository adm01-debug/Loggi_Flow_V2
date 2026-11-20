# 07 · REGRAS DE NEGÓCIO

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `ea8d1a4c0c` · branch `main` · 2026-11-20 00:34 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## A. Regras escritas por humanos (`manual/` — prioridade máxima, nunca sobrescrito)

_Nenhum arquivo em `manual/`. Copie `manual/TEMPLATE-regras-de-negocio.md` para `manual/regras.md` e preencha._

## B. Quem pode ver/alterar o quê (RLS — conforme migrations do repo; schema real em `docs/contexto/supabase/` (snapshot do banco real))

| Tabela | Política | Comando | Roles | Modo | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| `rank_badges` | Allow public read for authenticated | SELECT | authenticated | permissive | `true` |  |
| `task_gifts` | Allow public read for authenticated | SELECT | authenticated | permissive | `true` |  |
| `user_achievements` | Users can view their own achievements | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `profiles` | Users can view their own profile | SELECT | public | permissive | `auth.uid() = id` |  |
| `profiles` | Users can update their own profile | UPDATE | public | permissive | `auth.uid() = id` |  |
| `profiles` | Admins can view all profiles | SELECT | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `user_roles` | Users can view their own roles | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_levels` | Users can view their own level | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `achievements` | Admins can manage achievements | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `user_achievements` | Users can view their achievements | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `rastreamento_alertas` | Authenticated users can view tracking alerts | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `rastreamento_alertas` | Authenticated users can insert tracking alerts | INSERT | public | permissive |  | `auth.uid() IS NOT NULL` |
| `rastreamento_alertas` | Authenticated users can update tracking alerts | UPDATE | public | permissive | `auth.uid() IS NOT NULL` |  |
| `fretes_internos` | Enable read for authenticated users | SELECT | authenticated | permissive | `true` |  |
| `fretes_internos` | Enable insert for authenticated users | INSERT | authenticated | permissive |  | `true` |
| `fretes_internos` | Enable update for authenticated users | UPDATE | authenticated | permissive | `true` |  |
| `fretes_internos` | Enable delete for authenticated users | DELETE | authenticated | permissive | `true` |  |
| `clientes` | Authenticated users can view clients | SELECT | authenticated | permissive | `true` |  |
| `clientes` | Authenticated users can insert clients | INSERT | authenticated | permissive |  | `true` |
| `clientes` | Authenticated users can update clients | UPDATE | authenticated | permissive | `true` |  |
| `clientes` | Authenticated users can delete clients | DELETE | authenticated | permissive | `true` |  |
| `fornecedores` | Authenticated users can manage fornecedores | ALL | authenticated | permissive | `true` | `true` |
| `coletas` | Authenticated users can manage coletas | ALL | authenticated | permissive | `true` | `true` |
| `entregas` | Authenticated users can manage entregas | ALL | authenticated | permissive | `true` | `true` |
| `transportadoras` | Authenticated users can manage transportadoras | ALL | authenticated | permissive | `true` | `true` |
| `user_levels` | Users can view all levels | SELECT | authenticated | permissive | `true` |  |
| `user_levels` | System can insert levels | INSERT | authenticated | permissive |  | `true` |
| `user_achievements` | System can insert achievements | INSERT | authenticated | permissive |  | `true` |
| `profiles` | Users can view all profiles | SELECT | authenticated | permissive | `true` |  |
| `comments` | Usuários podem ver comentários | SELECT | public | permissive | `true` |  |
| `storage.objects` | Acesso público para leitura de fotos | SELECT | public | permissive | `bucket_id = 'ocorrencias-fotos'` |  |
| `storage.objects` | Usuários autenticados podem fazer upload | INSERT | public | permissive |  | `bucket_id = 'ocorrencias-fotos' AND auth.role() = 'authenticated'` |
| `storage.objects` | Usuários podem excluir seus próprios uploads | DELETE | public | permissive | `bucket_id = 'ocorrencias-fotos' AND auth.uid()::text = (storage.foldername(name))[1]` |  |
| `storage.objects` | Acesso público para leitura de fotos entregas | SELECT | public | permissive | `bucket_id = 'entregas-fotos'` |  |
| `storage.objects` | Upload em entregas-fotos | INSERT | public | permissive |  | `bucket_id = 'entregas-fotos' AND auth.role() = 'authenticated'` |
| `storage.objects` | Usuários autenticados podem ver comprovantes | SELECT | public | permissive | `bucket_id = 'comprovantes' AND auth.role() = 'authenticated'` |  |
| `storage.objects` | Upload de comprovantes | INSERT | public | permissive |  | `bucket_id = 'comprovantes' AND auth.role() = 'authenticated'` |
| `reward_items` | Admins podem gerenciar itens | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `reward_purchases` | Usuários podem ver suas compras | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `reward_purchases` | Usuários podem criar compras | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `reward_purchases` | Admins podem ver todas compras | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `reward_purchases` | Admins podem atualizar compras | UPDATE | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `user_onboarding` | Users can view their own onboarding progress | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_onboarding` | Users can insert their own onboarding progress | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_onboarding` | Users can update their own onboarding progress | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `business_rules` | Authenticated users can view business rules | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `business_rules` | Admins can manage business rules | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rule_execution_logs` | Authenticated users can view rule logs | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `ai_chat_messages` | Users can view their own chat messages | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `ai_chat_messages` | Users can create their own chat messages | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `ai_chat_messages` | Users can delete their own chat messages | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `password_reset_requests` | Admins can manage password reset requests | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `allowed_ips` | Users can view their own allowed IPs | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `allowed_ips` | Admins can manage all allowed IPs | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `ip_access_rules` | Admins can view IP rules | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `ip_access_rules` | Admins can manage IP rules | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `login_attempts` | Admins can view login attempts | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rate_limit_logs` | Admins can view rate limit logs | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rate_limit_logs` | Admins can delete rate limit logs | DELETE | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `permissions` | Admins can manage permissions | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `role_permissions` | Admins can manage role permissions | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `security_events` | Admins can view security events | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `account_lockouts` | Admins can view lockouts | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `known_devices` | Users can view their own devices | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `known_devices` | Users can insert their own devices | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `known_devices` | Users can update their own devices | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `known_devices` | Users can delete their own devices | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can view their own credentials | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can insert their own credentials | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `webauthn_credentials` | Users can update their own credentials | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can delete their own credentials | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `geo_access_rules` | Admins can manage geo access rules | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `geo_blocked_attempts` | Admins can view geo blocked attempts | SELECT | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `user_gamification` | Users can view own gamification | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_gamification` | Users can update own gamification | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `achievements` | Anyone can view achievements | SELECT | public | permissive | `true` |  |
| `reward_redemptions` | Users can view own redemptions | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `reward_redemptions` | Users can create redemptions | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `rewards` | Anyone can view rewards | SELECT | public | permissive | `true` |  |
| `user_sessions` | Users can view their own sessions | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `user_sessions` | Admins can view all sessions | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `user_sessions` | Users can insert their own sessions | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `user_sessions` | Users can update their own sessions | UPDATE | authenticated | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `user_sessions` | Users can delete their own sessions | DELETE | authenticated | permissive | `auth.uid() = user_id` |  |
| `notifications` | Users can create their own notifications | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `security_events` | Users can insert their own security events | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())` |
| `entregas` | Admins can delete entregas | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `clientes` | Admins can delete clientes | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `fornecedores` | Admins can delete fornecedores | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `transportadoras` | Admins can delete transportadoras | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `coletas` | Admins can delete coletas | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `permissions` | Authenticated users can view permissions | SELECT | authenticated | permissive | `true` |  |
| `webauthn_challenges` | Users can manage their own challenges | ALL | authenticated | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `conciliacoes` | Admin delete conciliacoes | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `fretes_internos` | Admin delete fretes_internos | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `ocorrencias` | View ocorrencias | SELECT | authenticated | permissive | `auth.uid() IS NOT NULL` |  |
| `ocorrencias` | Insert ocorrencias | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `ocorrencias` | Admin delete ocorrencias | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `allowed_ips` | Insert own IPs | INSERT | authenticated | permissive |  | `user_id = auth.uid() OR has_role(auth.uid(), 'admin')` |
| `allowed_ips` | Update own IPs | UPDATE | authenticated | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin')` | `user_id = auth.uid() OR has_role(auth.uid(), 'admin')` |
| `allowed_ips` | Delete own IPs | DELETE | authenticated | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `client_webhooks` | Webhook owners can view | SELECT | authenticated | permissive | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `client_webhooks` | Webhook owners can insert | INSERT | authenticated | permissive |  | `created_by = auth.uid()` |
| `client_webhooks` | Webhook owners can update | UPDATE | authenticated | permissive | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |
| `client_webhooks` | Webhook admin can delete | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `coletas` | Auth users can insert coletas | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `entregas` | Auth users can insert entregas | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `tabelas_frete` | Auth users can view tabelas_frete | SELECT | authenticated | permissive | `auth.uid() IS NOT NULL` |  |
| `tabelas_frete` | Admins can delete tabelas_frete | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `transportadora_rotas` | Auth users can view transportadora_rotas | SELECT | authenticated | permissive | `auth.uid() IS NOT NULL` |  |
| `transportadora_rotas` | Admins can delete transportadora_rotas | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `cotacoes_frete` | Auth users can view cotacoes_frete | SELECT | authenticated | permissive | `auth.uid() IS NOT NULL` |  |
| `cotacoes_frete` | Admins can delete cotacoes_frete | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `alertas_custo` | Admins can delete alertas_custo | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `cotacoes_multicanal` | Users can view own cotacoes_multicanal | SELECT | authenticated | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `cotacoes_multicanal` | Users can insert own cotacoes_multicanal | INSERT | authenticated | permissive |  | `user_id = auth.uid()` |
| `cotacoes_multicanal` | Users can update own cotacoes_multicanal | UPDATE | authenticated | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `cotacoes_multicanal` | Admins can delete cotacoes_multicanal | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `webhook_deliveries` | Webhook owners can view deliveries | SELECT | authenticated | permissive | `EXISTS ( SELECT 1 FROM public.client_webhooks w WHERE w.id = webhook_deliveries.webhook_id AND (w.created_by = auth.uid() OR has_role(auth.uid(), 'admin')) )` |  |
| `clientes` | Admins can insert clientes | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `clientes` | Admins can update clientes | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `fornecedores` | Admins can insert fornecedores | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `fornecedores` | Admins can update fornecedores | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `transportadoras` | Admins can insert transportadoras | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `transportadoras` | Admins can update transportadoras | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `tabelas_frete` | Admins can insert tabelas_frete | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `tabelas_frete` | Admins can update tabelas_frete | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `transportadora_rotas` | Admins can insert transportadora_rotas | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `transportadora_rotas` | Admins can update transportadora_rotas | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `entregas` | Admins can update entregas | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `coletas` | Admins can update coletas | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `cotacoes_frete` | Admins can insert cotacoes_frete | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `cotacoes_frete` | Admins can update cotacoes_frete | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `notificacoes_custo` | Admins can view notificacoes_custo | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `notificacoes_custo` | Admins can insert notificacoes_custo | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `conciliacao_itens_importados` | Admins can view conciliacao_itens | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `conciliacao_itens_importados` | Admins can insert conciliacao_itens | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `conciliacao_itens_importados` | Admins can update conciliacao_itens | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `conciliacao_itens_importados` | Admins can delete conciliacao_itens | DELETE | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `conciliacoes` | Admin or creator can view conciliacoes | SELECT | authenticated | permissive | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `conciliacoes` | Admins can insert conciliacoes | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `conciliacoes` | Admins can update conciliacoes | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `alertas_custo` | Admins can view alertas_custo | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin')` |  |
| `alertas_custo` | Admins can insert alertas_custo | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'admin')` |
| `alertas_custo` | Admins can update alertas_custo | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `fretes_internos` | Admins can update fretes_internos | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `ocorrencias` | Admins can update ocorrencias | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `role_permissions` | Auth users can view role permissions | SELECT | authenticated | permissive | `auth.uid() IS NOT NULL` |  |
| `password_reset_requests` | Public can create pending reset requests | INSERT | public | permissive |  | `email IS NOT NULL AND length(email) > 0 AND status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL` |
| `rastreamento_alertas` | Admins can update rastreamento_alertas | UPDATE | authenticated | permissive | `has_role(auth.uid(), 'admin')` | `has_role(auth.uid(), 'admin')` |
| `query_telemetry` | Admins can view telemetry | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `query_telemetry` | Admins can delete telemetry | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `user_notification_preferences` | Users can view own notification preferences | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `user_notification_preferences` | Users can insert own notification preferences | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `user_notification_preferences` | Users can update own notification preferences | UPDATE | authenticated | permissive | `auth.uid() = user_id` |  |
| `storage.objects` | Documents: users can view own files | SELECT | authenticated | permissive | `bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]` |  |
| `storage.objects` | Documents: users can upload own files | INSERT | authenticated | permissive |  | `bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]` |
| `storage.objects` | Documents: users can update own files | UPDATE | authenticated | permissive | `bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]` |  |
| `storage.objects` | Documents: users can delete own files | DELETE | authenticated | permissive | `bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]` |  |
| `user_roles` | Only admins can insert roles | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin')` |
| `user_roles` | Only admins can update roles | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `user_roles` | Only admins can delete roles | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `query_telemetry` | Users can insert own telemetry | INSERT | authenticated | permissive |  | `user_id = auth.uid() OR user_id IS NULL` |
| `telemetry_logs` | Admins can view all telemetry logs | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin' )` |  |
| `push_subscriptions` | Users can manage their own push subscriptions | ALL | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `logistica_reversa` | Logística Reversa visível para todos os usuários autenticados | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `logistica_reversa` | Usuários podem inserir solicitações de logística reversa | INSERT | public | permissive |  | `auth.uid() IS NOT NULL` |
| `logistica_reversa` | Apenas admins podem atualizar solicitações | UPDATE | public | permissive | `auth.uid() IS NOT NULL` |  |
| `feature_flags` | Only admins can modify feature flags | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `error_events` | Users can insert their own errors | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `error_events` | Admins can view all error events | SELECT | public | permissive | `EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')` |  |
| `audit_logs` | Allow admins to view audit logs | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' )` |  |
| `business_rules_config` | Business rules are viewable by all authenticated users | SELECT | public | permissive | `auth.role() = 'authenticated'` |  |
| `business_rules_config` | Business rules can only be managed by admins | ALL | public | permissive | `EXISTS ( SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' )` |  |
| `account_lockouts` | Admins can manage lockouts | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` | `public.has_role(auth.uid(), 'admin'::app_role)` |
| `email_verification_tokens` | Admins can manage verification tokens | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` | `public.has_role(auth.uid(), 'admin'::app_role)` |
| `webauthn_challenges` | Admins manage registration challenges | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` | `public.has_role(auth.uid(), 'admin'::app_role)` |
| `webhook_events_processed` | Admins read webhook processing | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `storage.objects` | Avatars readable by authenticated | SELECT | authenticated | permissive | `bucket_id = 'avatars'` |  |
| `architecture_decisions` | Admins can manage ADRs | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `rastreamento_historico` | Admins can view tracking history | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rastreamento_historico_y2026m01` | Admins can view tracking history y2026m01 | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rastreamento_historico_y2026m01` | Authenticated can insert tracking data y2026m01 | INSERT | authenticated | permissive |  | `true` |
| `rastreamento_historico_y2026m02` | Admins can view tracking history y2026m02 | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rastreamento_historico_y2026m02` | Authenticated can insert tracking data y2026m02 | INSERT | authenticated | permissive |  | `true` |
| `rastreamento_historico_y2026m03` | Admins can view tracking history y2026m03 | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rastreamento_historico_y2026m03` | Authenticated can insert tracking data y2026m03 | INSERT | authenticated | permissive |  | `true` |
| `rastreamento_historico_y2026m04` | Admins can view tracking history y2026m04 | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rastreamento_historico_y2026m04` | Authenticated can insert tracking data y2026m04 | INSERT | authenticated | permissive |  | `true` |
| `rastreamento_historico_y2026m05` | Admins can view tracking history y2026m05 | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rastreamento_historico_y2026m05` | Authenticated can insert tracking data y2026m05 | INSERT | authenticated | permissive |  | `true` |
| `rastreamento_historico_y2026m06` | Admins can view tracking history y2026m06 | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `rastreamento_historico_y2026m06` | Authenticated can insert tracking data y2026m06 | INSERT | authenticated | permissive |  | `true` |
| `system_adr` | Admins manage ADRs | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `idempotency_keys` | Admins view idempotency logs | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `audit_logs` | Strict insert audit logs | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `geo_blocked_attempts` | Strict log geo blocked attempts | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `login_attempts` | Strict log login attempts | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `notifications` | Strict insert notifications | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `rastreamento_alertas` | Strict insert rastreamento alertas | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `rastreamento_historico` | Strict insert tracking data | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `rate_limit_logs` | Strict insert rate limit logs | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `rule_execution_logs` | Strict insert rule logs | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `security_events` | Strict insert security events | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `telemetry_logs` | Strict insert telemetry logs | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `user_achievements` | Strict insert user achievements | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `user_levels` | Strict insert user levels | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `webhook_deliveries` | Strict insert webhook deliveries | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `webhook_events_processed` | Admins can view webhook logs | SELECT | public | permissive | `auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'admin')` |  |
| `ai_delay_predictions` | Users can view AI delay predictions | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `ai_delay_predictions` | Admins can manage AI delay predictions | ALL | public | permissive | `EXISTS ( SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' )` |  |
| `reward_items` | Authenticated users can view reward items | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `feature_flags` | Authenticated users can view feature flags | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `freight_selection_rules` | Allow all for authenticated on rules | ALL | public | permissive | `auth.role() = 'authenticated'` |  |
| `freight_integration_mappings` | Allow all for authenticated on mappings | ALL | public | permissive | `auth.role() = 'authenticated'` |  |
| `freight_decisions` | Users can view their own freight decisions | SELECT | public | permissive | `auth.uid() = user_id OR auth.role() = 'service_role'` |  |
| `automation_audit_logs` | Enable all for authenticated users on audit logs | ALL | public | permissive | `auth.role() = 'authenticated'` |  |
| `user_ranks` | Ranks são visíveis por todos | SELECT | public | permissive | `true` |  |
| `performance_metrics` | Full access to performance_metrics for authenticated | ALL | public | permissive | `auth.role() = 'authenticated'` |  |
| `bitrix_sync_logs` | Full access to bitrix_sync_logs for authenticated | ALL | public | permissive | `auth.role() = 'authenticated'` |  |
| `notification_templates` | Full access to notification_templates for authenticated | ALL | public | permissive | `auth.role() = 'authenticated'` |  |
| `sla_alerts` | Full access to sla_alerts for authenticated | ALL | public | permissive | `auth.role() = 'authenticated'` |  |
| `driver_badges` | Drivers can view their own badges | SELECT | public | permissive | `auth.uid() = driver_id` |  |
| `driver_badges` | Admins can manage driver badges | ALL | public | permissive | `EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND cargo = 'admin' )` |  |
| `system_integrity_logs` | Admins can manage system logs | ALL | public | permissive | `auth.uid() IN (SELECT id FROM profiles WHERE cargo = 'admin' OR cargo = 'gestor')` |  |
| `system_heartbeat` | All users can view heartbeat | SELECT | public | permissive | `true` |  |
| `system_contract_schemas` | Allow authenticated read for schemas | SELECT | authenticated | permissive | `true` |  |
| `fretes_internos` | Users can view their organization's fretes | SELECT | public | permissive | `organization_id = public.get_current_organization_id()` |  |
| `fretes_internos` | Users can insert their organization's fretes | INSERT | public | permissive |  | `organization_id = public.get_current_organization_id()` |
| `audit_logs` | Users can view their organization's audit logs | SELECT | public | permissive | `user_id IN (SELECT id FROM public.profiles WHERE organization_id = public.get_current_organization_id())` |  |
| `risk_zones` | Users can view risk zones | SELECT | public | permissive | `auth.role() = 'authenticated'` |  |
| `bio_sync_alert_rules` | Rules are viewable by everyone | SELECT | public | permissive | `true` |  |
| `organizations` | Admins manage organizations | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `organizations` | Authenticated read organizations | SELECT | authenticated | permissive | `true` |  |
| `bio_sync_telemetry` | Authenticated read bio telemetry | SELECT | authenticated | permissive | `true` |  |
| `bio_sync_telemetry` | Admins insert bio telemetry | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin')` |
| `nexus_tactical_logs` | Authenticated read tactical logs | SELECT | authenticated | permissive | `true` |  |
| `nexus_tactical_logs` | Admins insert tactical logs | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin')` |
| `carrier_rankings` | Authenticated view carrier rankings | SELECT | authenticated | permissive | `true` |  |
| `kanban_history` | Authenticated view kanban history | SELECT | authenticated | permissive | `true` |  |
| `kanban_history` | Authenticated insert kanban history | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `bio_sync_alert_rules` | Admins manage alert rules | ALL | authenticated | permissive | `public.has_role(auth.uid(),'admin')` | `public.has_role(auth.uid(),'admin')` |
| `contract_test_logs` | Admins insert test logs | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(),'admin')` |
| `freight_decisions` | Service role inserts decisions | INSERT | service_role | permissive |  | `true` |
| `freight_integration_mappings` | Admins manage integration mappings | ALL | authenticated | permissive | `public.has_role(auth.uid(),'admin')` | `public.has_role(auth.uid(),'admin')` |
| `freight_selection_rules` | Admins manage selection rules | ALL | authenticated | permissive | `public.has_role(auth.uid(),'admin')` | `public.has_role(auth.uid(),'admin')` |
| `bitrix_sync_config` | Admins manage bitrix_sync_config | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `freight_webhooks` | Admins manage freight_webhooks | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `storage.objects` | Avatars publicly readable | SELECT | public | permissive | `bucket_id = 'avatars'` |  |
| `storage.objects` | Users upload own avatar | INSERT | authenticated | permissive |  | `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]` |
| `storage.objects` | Users update own avatar | UPDATE | authenticated | permissive | `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]` |  |
| `storage.objects` | Users delete own avatar | DELETE | authenticated | permissive | `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]` |  |
| `delivery_receipt_audit` | Admins view delivery receipt audit | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `delivery_receipt_audit` | System inserts delivery receipt audit | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `db_health_snapshots` | Admins can view db health snapshots | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `db_slo_daily` | Admins can view db slo daily | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `remediation_actions` | Admins can view remediation actions | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `remediation_actions` | Admins can insert remediation actions | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin'::app_role)` |
| `remediation_actions` | Admins can update remediation actions | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` | `public.has_role(auth.uid(), 'admin'::app_role)` |
| `remediation_actions` | Admins can delete remediation actions | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `db_health_score_history` | Admins can view health score history | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `index_proposals` | Admins can view index proposals | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `index_proposals` | Admins can insert index proposals | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin'::app_role)` |
| `index_proposals` | Admins can update index proposals | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin'::app_role)` |  |
| `delay_predictions_history` | authenticated_read_all_predictions | SELECT | authenticated | permissive | `true` |  |
| `delay_predictions_history` | admin_full_access_predictions | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `delay_predictions_history` | service_role_all_predictions | ALL | service_role | permissive | `true` | `true` |
| `prediction_accuracy_settings` | Users manage own accuracy settings | ALL | authenticated | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `mitigation_actions` | Users manage own mitigations | ALL | authenticated | permissive | `auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')` | `auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')` |
| `rte_gateway_health` | Authenticated users can read gateway health | SELECT | authenticated | permissive | `true` |  |
| `rte_gateway_health` | Admins can delete gateway health history | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `rte_slo_targets` | Autenticados podem ver metas de SLO | SELECT | authenticated | permissive | `true` |  |
| `rte_slo_targets` | Admins podem inserir metas de SLO | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin')` |
| `rte_slo_targets` | Admins podem atualizar metas de SLO | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `rte_slo_targets` | Admins podem remover metas de SLO | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `rte_slo_daily_snapshots` | Authenticated can read slo snapshots | SELECT | authenticated | permissive | `true` |  |
| `rte_slo_daily_snapshots` | Admins can insert slo snapshots | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin')` |
| `rte_slo_daily_snapshots` | Admins can update slo snapshots | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `rte_slo_daily_snapshots` | Admins can delete slo snapshots | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `comments` | Users can create their own comments | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `comments` | Users can delete their own comments | DELETE | authenticated | permissive | `auth.uid() = user_id` |  |
| `comments` | Users can update their own comments | UPDATE | authenticated | permissive | `auth.uid() = user_id` |  |
| `fretes_internos` | Authenticated users can insert fretes_internos | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `fretes_internos` | Authenticated users can view fretes_internos | SELECT | authenticated | permissive | `auth.uid() IS NOT NULL` |  |
| `notifications` | Users can update their own notifications | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `notifications` | Users can view their own notifications | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `clientes` | Authenticated users can view clientes | SELECT | authenticated | permissive | `true` |  |
| `coletas` | Authenticated users can view coletas | SELECT | authenticated | permissive | `(auth.uid() IS NOT NULL)` |  |
| `entregas` | Authenticated users can view entregas | SELECT | authenticated | permissive | `(auth.uid() IS NOT NULL)` |  |
| `fornecedores` | Authenticated users can view fornecedores | SELECT | authenticated | permissive | `true` |  |
| `transportadoras` | Authenticated users can view transportadoras | SELECT | authenticated | permissive | `true` |  |
| `comments` | Users can view all comments | SELECT | authenticated | permissive | `true` |  |
| `notifications` | Users can delete their own notifications | DELETE | public | permissive | `(auth.uid() = user_id)` |  |
| `geo_blocking_settings` | Admins can manage geo settings | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `geo_blocking_settings` | Admins can view geo settings | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `geo_blocking_rules` | Admins can manage geo blocking rules | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `geo_blocking_rules` | Admins can view geo rules | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `scheduled_reports` | Users can create their own scheduled reports | INSERT | public | permissive |  | `(auth.uid() = user_id)` |
| `scheduled_reports` | Users can delete their own scheduled reports | DELETE | public | permissive | `(auth.uid() = user_id)` |  |
| `scheduled_reports` | Users can update their own scheduled reports | UPDATE | public | permissive | `(auth.uid() = user_id)` |  |
| … +5 linhas — lista completa em `context.json` | | | | | | |

## C. Restrições de dados (obrigatório / único / default / CHECK / FK / calculada)

| Tabela | Coluna | Regra |
|---|---|---|
| `rank_badges` | `id` | PK; default gen_random_uuid() |
| `rank_badges` | `name` | obrigatório |
| `rank_badges` | `tier` | default 'bronze' |
| `rank_badges` | `xp_requirement` | default 0 |
| `rank_badges` | `created_at` | default now() |
| `rank_badges` | `updated_at` | default now() |
| `task_gifts` | `id` | PK; default gen_random_uuid() |
| `task_gifts` | `name` | obrigatório |
| `task_gifts` | `coin_cost` | default 0 |
| `task_gifts` | `stock_quantity` | default 0 |
| `task_gifts` | `created_at` | default now() |
| `task_gifts` | `updated_at` | default now() |
| `user_achievements` | `id` | PK; default gen_random_uuid() |
| `user_achievements` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `user_achievements` | `achievement_id` | obrigatório; FK → achievements.id ON DELETE CASCADE |
| `user_achievements` | `unlocked_at` | default now() |
| `user_achievements` | `(tabela)` | UNIQUE(user_id, achievement_id) |
| `profiles` | `id` | PK; FK → users.id ON DELETE CASCADE |
| `profiles` | `created_at` | default now() |
| `profiles` | `updated_at` | default now() |
| `profiles` | `organization_id` | FK → organizations.id |
| `transportadoras` | `id` | PK; default gen_random_uuid() |
| `transportadoras` | `razao_social` | obrigatório |
| `transportadoras` | `cnpj` | obrigatório; único |
| `transportadoras` | `nome_fantasia` | obrigatório |
| `transportadoras` | `contato_comercial` | obrigatório |
| `transportadoras` | `email_comercial` | obrigatório |
| `transportadoras` | `regioes_atendidas` | default '{}' |
| `transportadoras` | `api_disponivel` | default FALSE |
| `transportadoras` | `homologada` | default TRUE |
| `transportadoras` | `data_homologacao` | default now() |
| `transportadoras` | `score_performance` | default 0 |
| `transportadoras` | `created_at` | default now() |
| `transportadoras` | `updated_at` | default now() |
| `transportadoras` | `version` | default 1 |
| `transportadoras` | `credentials` | default '{}'::jsonb |
| `transportadoras` | `coverage_details` | default '{}'::jsonb |
| `transportadoras` | `non_api_config` | default '{}'::jsonb |
| `fornecedores` | `id` | PK; default gen_random_uuid() |
| `fornecedores` | `razao_social` | obrigatório |
| `fornecedores` | `endereco_completo` | obrigatório |
| `fornecedores` | `created_at` | default now() |
| `fornecedores` | `updated_at` | default now() |
| `coletas` | `id` | PK; default gen_random_uuid() |
| `coletas` | `numero_coleta` | obrigatório; único |
| `coletas` | `fornecedor_id` | FK → fornecedores.id |
| `coletas` | `endereco_coleta` | obrigatório |
| `coletas` | `tipo_coleta` | default 'lalamove' |
| `coletas` | `transportadora_id` | FK → transportadoras.id |
| `coletas` | `qtd_volumes` | default 1 |
| `coletas` | `status` | default 'aguardando_liberacao' |
| `coletas` | `created_at` | default now() |
| `coletas` | `updated_at` | default now() |
| `coletas` | `version` | default 0 |
| `coletas` | `is_reverse` | default false |
| `coletas` | `is_urgent` | default false |
| `coletas` | `custo_estimado` | default 0 |
| `coletas` | `custo_real` | default 0 |
| `coletas` | `(tabela)` | constraint fk_coletas_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id) ON DELETE SET NULL |
| `coletas` | `(tabela)` | constraint fk_coletas_transportadora FOREIGN KEY (transportadora_id) REFERENCES public.transportadoras(id) ON DELETE SET NULL |
| `coletas` | `(tabela)` | constraint fk_coletas_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id) ON DELETE SET NULL |
| `coletas` | `(tabela)` | constraint fk_coletas_transportadora FOREIGN KEY (transportadora_id) REFERENCES public.transportadoras(id) ON DELETE SET NULL |
| `coletas` | `(tabela)` | constraint coletas_qtd_volumes_nonneg CHECK (qtd_volumes IS NULL OR qtd_volumes >= 0) NOT VALID |
| `clientes` | `id` | PK; default gen_random_uuid() |
| `clientes` | `razao_social` | obrigatório |
| `clientes` | `endereco_completo` | obrigatório |
| `clientes` | `created_at` | default now() |
| `clientes` | `updated_at` | default now() |
| `entregas` | `id` | PK; default gen_random_uuid() |
| `entregas` | `numero_entrega` | obrigatório; único |
| `entregas` | `cliente_id` | FK → clientes.id |
| `entregas` | `endereco_entrega` | obrigatório |
| `entregas` | `transportadora_id` | FK → transportadoras.id |
| `entregas` | `tipo_frete` | default 'cif' |
| `entregas` | `status` | default 'aguardando_producao' |
| `entregas` | `created_at` | default now() |
| `entregas` | `updated_at` | default now() |
| `entregas` | `is_cross_docking` | default false |
| `entregas` | `version` | default 1 |
| `entregas` | `tags` | default '{}' |
| `entregas` | `ocr_data_extraida` | default '{}'::jsonb |
| `entregas` | `comprovante_audit_info` | default '{}'::jsonb |
| `entregas` | `weather_risk_score` | default 0 |
| `entregas` | `(tabela)` | constraint entregas_valor_frete_nonneg CHECK (valor_frete IS NULL OR valor_frete >= 0) NOT VALID |
| `ocorrencias` | `id` | PK; default gen_random_uuid() |
| `ocorrencias` | `entrega_id` | FK → entregas.id |
| `ocorrencias` | `coleta_id` | FK → coletas.id |
| `ocorrencias` | `tipo_ocorrencia` | obrigatório |
| `ocorrencias` | `fotos_urls` | default '{}' |
| `ocorrencias` | `resolvida` | default FALSE |
| `ocorrencias` | `created_at` | default now() |
| `cotacoes_frete` | `id` | PK; default gen_random_uuid() |
| `cotacoes_frete` | `entrega_id` | obrigatório; FK → entregas.id |
| `cotacoes_frete` | `transportadora_id` | obrigatório; FK → transportadoras.id |
| `cotacoes_frete` | `valor` | obrigatório |
| `cotacoes_frete` | `selecionada` | default FALSE |
| `cotacoes_frete` | `created_at` | default now() |
| `cotacoes_frete` | `version` | default 1 |
| `user_roles` | `id` | PK; default gen_random_uuid() |
| `user_roles` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `user_roles` | `role` | default 'user' |
| `user_roles` | `created_at` | default now() |
| `user_roles` | `(tabela)` | UNIQUE (user_id, role) |
| `user_levels` | `id` | PK; default gen_random_uuid() |
| `user_levels` | `user_id` | obrigatório; único; FK → users.id ON DELETE CASCADE |
| `user_levels` | `current_xp` | default 0 |
| `user_levels` | `total_xp` | default 0 |
| `user_levels` | `level` | default 1 |
| `user_levels` | `coins` | default 0 |
| `user_levels` | `streak_days` | default 0 |
| `user_levels` | `created_at` | default now() |
| `user_levels` | `updated_at` | default now() |
| `user_levels` | `rank_id` | FK → user_ranks.id |
| `user_levels` | `nexus_score` | default 0 |
| `user_levels` | `(tabela)` | constraint user_levels_coins_nonneg CHECK (coins >= 0) NOT VALID |
| `user_levels` | `(tabela)` | constraint user_levels_total_xp_nonneg CHECK (total_xp >= 0) NOT VALID |
| `user_levels` | `(tabela)` | constraint user_levels_level_min CHECK (level >= 1) NOT VALID |
| `user_levels` | `(tabela)` | constraint user_levels_nexus_score_check CHECK ((nexus_score >= 0::numeric) AND (nexus_score <= 100::numeric)) |
| `achievements` | `id` | PK; default gen_random_uuid() |
| `achievements` | `code` | obrigatório; único |
| `achievements` | `name` | obrigatório |
| `achievements` | `description` | obrigatório |
| `achievements` | `icon` | default 'Trophy' |
| `achievements` | `category` | default 'general' |
| `achievements` | `rarity` | default 'common'; CHECK rarity IN ('common', 'rare', 'epic', 'legendary') |
| `achievements` | `xp_reward` | default 50 |
| `achievements` | `coins_reward` | default 10 |
| `achievements` | `requirement_type` | obrigatório |
| `achievements` | `requirement_value` | default 1 |
| `achievements` | `created_at` | default now() |
| `achievements` | `(tabela)` | constraint achievements_rewards_nonneg CHECK (xp_reward >= 0 AND coins_reward >= 0) NOT VALID |
| `tabelas_frete` | `id` | PK; default gen_random_uuid() |
| `tabelas_frete` | `transportadora_id` | obrigatório; FK → transportadoras.id ON DELETE CASCADE |
| `tabelas_frete` | `regiao_destino` | obrigatório |
| `tabelas_frete` | `estado_destino` | obrigatório |
| `tabelas_frete` | `peso_min_kg` | default 0 |
| `tabelas_frete` | `peso_max_kg` | default 999999 |
| `tabelas_frete` | `preco_por_kg` | obrigatório |
| `tabelas_frete` | `taxa_fixa` | default 0 |
| `tabelas_frete` | `prazo_dias` | default 5 |
| `tabelas_frete` | `ativo` | default true |
| `tabelas_frete` | `created_at` | default now() |
| `tabelas_frete` | `updated_at` | default now() |
| `alertas_custo` | `id` | PK; default gen_random_uuid() |
| `alertas_custo` | `tipo` | obrigatório; CHECK tipo IN ('transportadora', 'rota', 'global') |
| `alertas_custo` | `transportadora_id` | FK → transportadoras.id ON DELETE CASCADE |
| `alertas_custo` | `limite_mensal` | obrigatório |
| `alertas_custo` | `ativo` | default true |
| `alertas_custo` | `notificar_percentual` | default 80 |
| `alertas_custo` | `created_at` | default now() |
| `alertas_custo` | `updated_at` | default now() |
| `alertas_custo` | `created_by` | FK → users.id |
| `notificacoes_custo` | `id` | PK; default gen_random_uuid() |
| `notificacoes_custo` | `alerta_id` | FK → alertas_custo.id ON DELETE CASCADE |
| `notificacoes_custo` | `tipo_notificacao` | obrigatório; CHECK tipo_notificacao IN ('warning', 'critical', 'exceeded') |
| `notificacoes_custo` | `mensagem` | obrigatório |
| `notificacoes_custo` | `valor_atual` | obrigatório |
| `notificacoes_custo` | `limite` | obrigatório |
| `notificacoes_custo` | `percentual_atingido` | obrigatório |
| `notificacoes_custo` | `lida` | default false |
| `notificacoes_custo` | `created_at` | default now() |
| `rastreamento_alertas` | `id` | PK; default gen_random_uuid() |
| `rastreamento_alertas` | `lalamove_order_id` | obrigatório |
| `rastreamento_alertas` | `coleta_id` | FK → coletas.id ON DELETE SET NULL |
| `rastreamento_alertas` | `alert_type` | obrigatório |
| `rastreamento_alertas` | `severity` | obrigatório |
| `rastreamento_alertas` | `message` | obrigatório |
| `rastreamento_alertas` | `resolved` | default false |
| `rastreamento_alertas` | `created_at` | default now() |
| `fretes_internos` | `id` | PK; default gen_random_uuid() |
| `fretes_internos` | `origem` | obrigatório |
| `fretes_internos` | `destino` | obrigatório |
| `fretes_internos` | `quantidade_itens` | default 1 |
| `fretes_internos` | `status` | default 'pendente' |
| `fretes_internos` | `xp_reward` | default 50 |
| `fretes_internos` | `created_at` | default now() |
| `fretes_internos` | `updated_at` | default now() |
| `fretes_internos` | `organization_id` | FK → organizations.id |
| `fretes_internos` | `(tabela)` | constraint fretes_internos_xp_nonneg CHECK (xp_reward IS NULL OR xp_reward >= 0) NOT VALID |
| `notifications` | `id` | PK; default gen_random_uuid() |
| `notifications` | `user_id` | obrigatório |
| `notifications` | `title` | obrigatório |
| `notifications` | `message` | obrigatório |
| `notifications` | `type` | default 'info'::public.notification_type |
| `notifications` | `read` | default false |
| `notifications` | `metadata` | default '{}'::jsonb |
| `notifications` | `created_at` | default now() |
| `comments` | `id` | PK; default gen_random_uuid() |
| `comments` | `content` | obrigatório |
| `comments` | `entity_type` | obrigatório; CHECK entity_type IN ('ocorrencia', 'coleta', 'entrega', 'frete_interno') |
| `comments` | `entity_id` | obrigatório |
| `comments` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `comments` | `created_at` | default now() |
| `comments` | `updated_at` | default now() |
| `comments` | `(tabela)` | constraint comments_entity_type_check CHECK ((entity_type = ANY (ARRAY['ocorrencia'::text,'coleta'::text,'entrega'::text,'frete_interno'::text]))) |
| `reward_items` | `id` | PK; default gen_random_uuid() |
| `reward_items` | `name` | obrigatório |
| `reward_items` | `description` | obrigatório |
| `reward_items` | `coins_cost` | default 100 |
| `reward_items` | `category` | default 'geral' |
| `reward_items` | `icon` | default 'Gift' |
| `reward_items` | `rarity` | default 'common' |
| `reward_items` | `available` | default true |
| `reward_items` | `stock` | default NULL |
| `reward_items` | `created_at` | default now() |
| `reward_items` | `(tabela)` | constraint reward_items_cost_nonneg CHECK (coins_cost >= 0) NOT VALID |
| `reward_purchases` | `id` | PK; default gen_random_uuid() |
| `reward_purchases` | `user_id` | obrigatório |
| `reward_purchases` | `reward_item_id` | obrigatório; FK → reward_items.id ON DELETE CASCADE |
| `reward_purchases` | `coins_spent` | obrigatório |
| `reward_purchases` | `status` | default 'pending' |
| `reward_purchases` | `redeemed_at` | default NULL |
| `reward_purchases` | `created_at` | default now() |
| `reward_purchases` | `(tabela)` | constraint reward_purchases_coins_nonneg CHECK (coins_spent >= 0) NOT VALID |
| `conciliacoes` | `id` | PK; default gen_random_uuid() |
| `conciliacoes` | `tipo` | obrigatório; CHECK tipo IN ('faturas_entregas', 'custos_previstos_realizados', 'pagamentos_notas') |
| `conciliacoes` | `nome` | obrigatório |
| `conciliacoes` | `status` | default 'rascunho'; CHECK status IN ('rascunho', 'em_andamento', 'concluida', 'arquivada') |
| `conciliacoes` | `total_itens_importados` | default 0 |
| `conciliacoes` | `total_itens_conciliados` | default 0 |
| `conciliacoes` | `total_divergencias` | default 0 |
| `conciliacoes` | `valor_total_importado` | default 0 |
| `conciliacoes` | `valor_total_sistema` | default 0 |
| `conciliacoes` | `diferenca_total` | default 0 |
| `conciliacoes` | `created_by` | FK → users.id |
| `conciliacoes` | `created_at` | default now() |
| `conciliacoes` | `updated_at` | default now() |
| `conciliacao_itens_importados` | `id` | PK; default gen_random_uuid() |
| `conciliacao_itens_importados` | `conciliacao_id` | obrigatório; FK → conciliacoes.id ON DELETE CASCADE |
| `conciliacao_itens_importados` | `valor` | obrigatório |
| `conciliacao_itens_importados` | `status` | default 'pendente'; CHECK status IN ('pendente', 'conciliado', 'divergencia', 'ignorado') |
| `conciliacao_itens_importados` | `conciliado_por` | FK → users.id |
| `conciliacao_itens_importados` | `created_at` | default now() |
| `user_onboarding` | `id` | PK; default gen_random_uuid() |
| `user_onboarding` | `user_id` | obrigatório; único |
| `user_onboarding` | `completed_steps` | default '{}' |
| `user_onboarding` | `current_step` | default 0 |
| `user_onboarding` | `xp_earned` | default 0 |
| `user_onboarding` | `created_at` | default now() |
| `user_onboarding` | `updated_at` | default now() |
| `business_rules` | `id` | PK; default gen_random_uuid() |
| `business_rules` | `name` | obrigatório |
| `business_rules` | `entity_type` | obrigatório |
| `business_rules` | `trigger_event` | obrigatório |
| `business_rules` | `conditions` | default '[]'::jsonb |
| `business_rules` | `actions` | default '[]'::jsonb |
| `business_rules` | `is_active` | default true |
| `business_rules` | `priority` | default 0 |
| `business_rules` | `created_by` | FK → users.id |
| `business_rules` | `created_at` | default now() |
| `business_rules` | `updated_at` | default now() |
| `rule_execution_logs` | `id` | PK; default gen_random_uuid() |
| `rule_execution_logs` | `rule_id` | FK → business_rules.id ON DELETE CASCADE |
| `rule_execution_logs` | `entity_type` | obrigatório |
| `rule_execution_logs` | `entity_id` | obrigatório |
| `rule_execution_logs` | `trigger_event` | obrigatório |
| `rule_execution_logs` | `conditions_met` | obrigatório |
| `rule_execution_logs` | `created_at` | default now() |
| `transportadora_rotas` | `id` | PK; default gen_random_uuid() |
| `transportadora_rotas` | `transportadora_id` | obrigatório; FK → transportadoras.id ON DELETE CASCADE |
| `transportadora_rotas` | `origem_estado` | obrigatório |
| `transportadora_rotas` | `destino_estado` | obrigatório |
| `transportadora_rotas` | `prazo_dias` | default 5 |
| `transportadora_rotas` | `preco_por_kg` | default 0 |
| `transportadora_rotas` | `taxa_fixa` | default 0 |
| `transportadora_rotas` | `ativo` | default true |
| `transportadora_rotas` | `created_at` | default now() |
| `transportadora_rotas` | `updated_at` | default now() |
| `ai_chat_messages` | `id` | PK; default gen_random_uuid() |
| `ai_chat_messages` | `user_id` | obrigatório |
| `ai_chat_messages` | `role` | obrigatório; CHECK role IN ('user', 'assistant') |
| `ai_chat_messages` | `content` | obrigatório |
| `ai_chat_messages` | `metadata` | default '{}'::jsonb |
| `ai_chat_messages` | `created_at` | default now() |
| `password_reset_requests` | `id` | PK; default gen_random_uuid() |
| `password_reset_requests` | `email` | obrigatório |
| `password_reset_requests` | `user_id` | FK → users.id ON DELETE CASCADE |
| `password_reset_requests` | `status` | default 'pending'; CHECK status IN ('pending', 'approved', 'rejected') |
| `password_reset_requests` | `requested_at` | default now() |
| `password_reset_requests` | `created_at` | default now() |
| `allowed_ips` | `id` | PK; default gen_random_uuid() |
| `allowed_ips` | `user_id` | FK → users.id ON DELETE CASCADE |
| `allowed_ips` | `ip_address` | obrigatório |
| `allowed_ips` | `is_active` | default true |
| `allowed_ips` | `created_at` | default now() |
| `allowed_ips` | `updated_at` | default now() |
| `ip_access_rules` | `id` | PK; default gen_random_uuid() |
| `ip_access_rules` | `ip_pattern` | obrigatório |
| `ip_access_rules` | `rule_type` | obrigatório; CHECK rule_type IN ('whitelist', 'blacklist') |
| `ip_access_rules` | `is_active` | default true |
| `ip_access_rules` | `created_at` | default now() |
| `ip_access_rules` | `updated_at` | default now() |
| `login_attempts` | `id` | PK; default gen_random_uuid() |
| `login_attempts` | `email` | obrigatório |
| `login_attempts` | `success` | default false |
| `login_attempts` | `created_at` | default now() |
| `rate_limit_logs` | `id` | PK; default gen_random_uuid() |
| `rate_limit_logs` | `ip_address` | obrigatório |
| `rate_limit_logs` | `endpoint` | obrigatório |
| `rate_limit_logs` | `user_id` | FK → users.id ON DELETE SET NULL |
| … +679 linhas — lista completa em `context.json` | | |

## D. Automações no banco (triggers e funções — regras que rodam sozinhas)

| Trigger | Quando | Tabela | Executa | Condição |
|---|---|---|---|---|
| update_transportadoras_updated_at | BEFORE UPDATE | `transportadoras` | `update_updated_at_column` |  |
| update_fornecedores_updated_at | BEFORE UPDATE | `fornecedores` | `update_updated_at_column` |  |
| update_coletas_updated_at | BEFORE UPDATE | `coletas` | `update_updated_at_column` |  |
| update_clientes_updated_at | BEFORE UPDATE | `clientes` | `update_updated_at_column` |  |
| generate_coleta_numero_trigger | BEFORE INSERT | `coletas` | `generate_coleta_numero` | `NEW.numero_coleta IS NULL` |
| generate_entrega_numero_trigger | BEFORE INSERT | `entregas` | `generate_entrega_numero` | `NEW.numero_entrega IS NULL` |
| on_auth_user_created | AFTER INSERT | `auth.users` | `handle_new_user` |  |
| update_profiles_updated_at | BEFORE UPDATE | `profiles` | `update_updated_at_column` |  |
| audit_fornecedores | AFTER INSERT OR UPDATE OR DELETE | `fornecedores` | `audit_trigger_func` |  |
| audit_clientes | AFTER INSERT OR UPDATE OR DELETE | `clientes` | `audit_trigger_func` |  |
| audit_transportadoras | AFTER INSERT OR UPDATE OR DELETE | `transportadoras` | `audit_trigger_func` |  |
| audit_ocorrencias | AFTER INSERT OR UPDATE OR DELETE | `ocorrencias` | `audit_trigger_func` |  |
| audit_cotacoes_frete | AFTER INSERT OR UPDATE OR DELETE | `cotacoes_frete` | `audit_trigger_func` |  |
| update_user_levels_updated_at | BEFORE UPDATE | `user_levels` | `update_updated_at_column` |  |
| on_auth_user_created_levels | AFTER INSERT | `auth.users` | `handle_new_user_levels` |  |
| update_tabelas_frete_updated_at | BEFORE UPDATE | `tabelas_frete` | `update_updated_at_column` |  |
| update_alertas_custo_updated_at | BEFORE UPDATE | `alertas_custo` | `update_updated_at_column` |  |
| fretes_internos_updated_at | BEFORE UPDATE | `fretes_internos` | `update_fretes_internos_updated_at` |  |
| notify_ocorrencia_trigger | AFTER INSERT | `ocorrencias` | `notify_on_ocorrencia` |  |
| update_fretes_internos_updated_at | BEFORE UPDATE | `fretes_internos` | `update_updated_at_column` |  |
| trigger_notify_entrega_atrasada | AFTER UPDATE | `entregas` | `notify_entrega_atrasada` |  |
| trigger_notify_entrega_concluida | AFTER UPDATE | `entregas` | `notify_entrega_concluida` |  |
| trigger_notify_coleta_atrasada | AFTER UPDATE | `coletas` | `notify_coleta_atrasada` |  |
| trigger_notify_ocorrencia | AFTER INSERT | `ocorrencias` | `notify_ocorrencia_registrada` |  |
| trigger_notify_frete_interno | AFTER UPDATE | `fretes_internos` | `notify_frete_interno_concluido` |  |
| trigger_notify_conquista | AFTER INSERT | `user_achievements` | `notify_conquista_desbloqueada` |  |
| audit_coletas | AFTER INSERT OR UPDATE OR DELETE | `coletas` | `audit_log_trigger` |  |
| audit_entregas | AFTER INSERT OR UPDATE OR DELETE | `entregas` | `audit_log_trigger` |  |
| trigger_comments_updated_at | BEFORE UPDATE | `comments` | `update_comments_updated_at` |  |
| update_comments_updated_at | BEFORE UPDATE | `comments` | `update_updated_at_column` |  |
| update_conciliacoes_updated_at | BEFORE UPDATE | `conciliacoes` | `update_updated_at_column` |  |
| update_user_onboarding_updated_at | BEFORE UPDATE | `user_onboarding` | `update_updated_at_column` |  |
| update_business_rules_updated_at | BEFORE UPDATE | `business_rules` | `update_updated_at_column` |  |
| update_transportadora_rotas_updated_at | BEFORE UPDATE | `transportadora_rotas` | `update_updated_at_column` |  |
| update_known_devices_last_seen | BEFORE UPDATE | `known_devices` | `update_device_last_seen` |  |
| trg_audit_transportadoras | AFTER INSERT OR UPDATE OR DELETE | `transportadoras` | `fn_audit_trigger` |  |
| trg_audit_tabelas_frete | AFTER INSERT OR UPDATE OR DELETE | `tabelas_frete` | `fn_audit_trigger` |  |
| trg_audit_alertas_custo | AFTER INSERT OR UPDATE OR DELETE | `alertas_custo` | `fn_audit_trigger` |  |
| trg_audit_cotacoes_frete | AFTER INSERT OR UPDATE OR DELETE | `cotacoes_frete` | `fn_audit_trigger` |  |
| trg_audit_business_rules | AFTER INSERT OR UPDATE OR DELETE | `business_rules` | `fn_audit_trigger` |  |
| update_user_notification_preferences_updated_at | BEFORE UPDATE | `user_notification_preferences` | `update_updated_at_column` |  |
| update_entregas_updated_at | BEFORE UPDATE | `entregas` | `update_updated_at_column` |  |
| validate_entregas_frete | BEFORE INSERT OR UPDATE | `entregas` | `validate_frete_values` |  |
| update_push_subscriptions_updated_at | BEFORE UPDATE | `push_subscriptions` | `update_updated_at_column` |  |
| update_logistica_reversa_updated_at | BEFORE UPDATE | `logistica_reversa` | `update_updated_at_column` |  |
| update_feature_flags_updated_at | BEFORE UPDATE | `feature_flags` | `update_updated_at_column` |  |
| update_business_rules_updated_at | BEFORE UPDATE | `business_rules_config` | `update_updated_at_column` |  |
| tr_increment_entregas_version | BEFORE UPDATE | `entregas` | `increment_version_column` |  |
| tr_increment_coletas_version | BEFORE UPDATE | `coletas` | `increment_version_column` |  |
| tr_version_entregas | BEFORE UPDATE | `entregas` | `increment_version` |  |
| tr_version_coletas | BEFORE UPDATE | `coletas` | `increment_version` |  |
| tr_version_transportadoras | BEFORE UPDATE | `transportadoras` | `increment_version` |  |
| tr_version_cotacoes | BEFORE UPDATE | `cotacoes_frete` | `increment_version` |  |
| tr_cotacoes_version | BEFORE UPDATE | `cotacoes_frete` | `tr_increment_version` | `OLD.* IS DISTINCT FROM NEW.*` |
| trg_increment_logistica_reversa_version | BEFORE UPDATE | `logistica_reversa` | `increment_version` |  |
| tr_entregas_optimistic_locking | BEFORE UPDATE | `entregas` | `handle_optimistic_locking` |  |
| tr_cotacoes_frete_optimistic_locking | BEFORE UPDATE | `cotacoes_frete` | `handle_optimistic_locking` |  |
| tr_transportadoras_optimistic_locking | BEFORE UPDATE | `transportadoras` | `handle_optimistic_locking` |  |
| trigger_increment_version_entregas | BEFORE UPDATE | `entregas` | `increment_version_column` |  |
| trigger_increment_version_cotacoes | BEFORE UPDATE | `cotacoes_multicanal` | `increment_version_column` |  |
| trigger_increment_version_transportadoras | BEFORE UPDATE | `transportadoras` | `increment_version_column` |  |
| tr_increment_entrega_version | BEFORE UPDATE | `entregas` | `increment_version` |  |
| tr_increment_version_entregas | BEFORE UPDATE | `entregas` | `increment_version_column` |  |
| tr_increment_version_cotacoes_frete | BEFORE UPDATE | `cotacoes_frete` | `increment_version_column` |  |
| tr_increment_version_transportadoras | BEFORE UPDATE | `transportadoras` | `increment_version_column` |  |
| tr_entregas_version | BEFORE UPDATE | `entregas` | `increment_version` |  |
| tr_cotacoes_frete_version | BEFORE UPDATE | `cotacoes_frete` | `increment_version` |  |
| tr_cotacoes_multicanal_version | BEFORE UPDATE | `cotacoes_multicanal` | `increment_version` |  |
| tr_transportadoras_version | BEFORE UPDATE | `transportadoras` | `increment_version` |  |
| on_user_level_up | AFTER UPDATE OF LEVEL | `user_levels` | `update_user_rank` |  |
| trigger_update_carrier_ranking | AFTER UPDATE OF STATUS | `entregas` | `update_carrier_ranking` | `NEW.status IN ('entregue', 'finalizado')` |
| set_updated_at | BEFORE UPDATE | `organizations` | `handle_updated_at` |  |
| tr_log_biometric_anomaly | AFTER INSERT | `bio_sync_telemetry` | `log_biometric_anomaly` |  |
| on_critical_alert_bitrix_sync | AFTER INSERT | `nexus_tactical_logs` | `trigger_bitrix_alert_notification` |  |
| trg_remediation_updated_at | BEFORE UPDATE | `remediation_actions` | `update_updated_at_column` |  |
| trg_index_proposals_updated_at | BEFORE UPDATE | `index_proposals` | `update_updated_at_column` |  |
| tr_capture_index_proposal_baseline | BEFORE INSERT | `index_proposals` | `capture_index_proposal_baseline` |  |
| trg_entregas_prediction_feedback | AFTER UPDATE OF DATA_ENTREGA_EFETIVA | `entregas` | `mark_predictions_accurate` |  |
| update_prediction_accuracy_settings_updated_at | BEFORE UPDATE | `prediction_accuracy_settings` | `update_updated_at_column` |  |
| update_mitigation_actions_updated_at | BEFORE UPDATE | `mitigation_actions` | `update_updated_at_column` |  |
| update_rte_slo_targets_updated_at | BEFORE UPDATE | `rte_slo_targets` | `update_updated_at_column` |  |
| update_rte_slo_daily_snapshots_updated_at | BEFORE UPDATE | `rte_slo_daily_snapshots` | `update_updated_at_column` |  |

Erros lançados por funções SQL (`RAISE EXCEPTION` = regra de negócio no banco):

| Função | Mensagem | Origem |
|---|---|---|
| `add_user_xp` | XP and coins amounts must be non-negative | `supabase/migrations/20260314203713_95f85fe5-f0ed-44fb-8a0f-5c2157deda07.sql` |
| `validate_frete_values` | O valor do frete não pode ser negativo. | `supabase/migrations/20260512142527_53747bb3-b7f1-4e5d-9ad0-fdb4b22cabf7.sql` |
| `get_top_queries_fast` | access denied: admin role required | `supabase/migrations/20260712160921_964f0d7a-8cab-4349-9b12-89053b0d2b7b.sql` |
| `get_cron_jobs_status` | access denied: admin role required | `supabase/migrations/20260712160921_964f0d7a-8cab-4349-9b12-89053b0d2b7b.sql` |
| `get_health_anomalies_fast` | access denied: admin role required | `supabase/migrations/20260712183625_ed8a21e5-2aa1-4965-bdce-5831f0729248.sql` |
| `get_remediation_suggestions_fast` | forbidden | `supabase/migrations/20260712194141_8114c3a0-a949-4517-bf62-4c0a940d1c8c.sql` |
| `get_remediation_mttr_fast` | access denied: admin role required | `supabase/migrations/20260712195313_c3bd1d37-3196-48a7-9203-a54dcef792ef.sql` |
| `get_global_health_score_fast` | access denied: admin role required | `supabase/migrations/20260712195449_e5198bd8-8a64-488a-a2e4-26244e90c7e2.sql` |
| `get_health_score_history_fast` | access denied: admin role required | `supabase/migrations/20260712195636_5a4fbf15-cea4-4b1d-9ec6-b9b2131c2d15.sql` |
| `get_query_detail_fast` | access denied: admin role required | `supabase/migrations/20260712195949_43d7c4d1-32c7-423c-aad5-4f334723a845.sql` |
| `get_query_index_suggestion` | access denied: admin role required | `supabase/migrations/20260712195949_43d7c4d1-32c7-423c-aad5-4f334723a845.sql` |
| `apply_index_proposal` | access denied: admin role required | `supabase/migrations/20260712200133_ab6b07eb-f3d2-4ecb-a237-e3f33c6e40e5.sql` |
| `apply_index_proposal` | proposal not found | `supabase/migrations/20260712200133_ab6b07eb-f3d2-4ecb-a237-e3f33c6e40e5.sql` |
| `apply_index_proposal` | DDL não passou na whitelist de segurança | `supabase/migrations/20260712200133_ab6b07eb-f3d2-4ecb-a237-e3f33c6e40e5.sql` |
| `apply_index_proposal` | DDL contém comandos não permitidos | `supabase/migrations/20260712200133_ab6b07eb-f3d2-4ecb-a237-e3f33c6e40e5.sql` |
| `reject_index_proposal` | access denied: admin role required | `supabase/migrations/20260712200133_ab6b07eb-f3d2-4ecb-a237-e3f33c6e40e5.sql` |
| `measure_index_proposal_impact` | access denied: admin role required | `supabase/migrations/20260712200325_8f1311ec-c79b-4c34-9d5c-d7f20aef22f6.sql` |
| `measure_index_proposal_impact` | proposal not found | `supabase/migrations/20260712200325_8f1311ec-c79b-4c34-9d5c-d7f20aef22f6.sql` |
| `measure_index_proposal_impact` | proposal not yet applied | `supabase/migrations/20260712200325_8f1311ec-c79b-4c34-9d5c-d7f20aef22f6.sql` |
| `measure_index_proposal_impact` | proposal has no queryid to measure | `supabase/migrations/20260712200325_8f1311ec-c79b-4c34-9d5c-d7f20aef22f6.sql` |
| `auto_revert_ineffective_indexes` | access denied: admin role required | `supabase/migrations/20260712200502_c2ad2762-a1b7-4996-8e4e-36b26ce827ce.sql` |
| `get_index_roi_summary` | access denied: admin role required | `supabase/migrations/20260712200616_b71ac0fb-9118-472a-a9bd-632188ca1700.sql` |
| `get_load_heatmap` | access denied: admin role required | `supabase/migrations/20260712200757_895fca3f-1a03-406c-b0da-c3ff374f74c6.sql` |
| `get_maintenance_windows` | access denied: admin role required | `supabase/migrations/20260712200951_b15e8046-3214-4f64-b492-895c2a99c7da.sql` |
| `get_table_coaccess_graph` | access denied | `supabase/migrations/20260712202322_096fee33-6997-4108-b4b1-ece479e85fad.sql` |
| `get_seq_scan_hotspots` | access denied: admin role required | `supabase/migrations/20260712202813_d620fe6b-6a1e-47f8-ae36-75403bdcf9d1.sql` |
| `get_unused_indexes` | access denied: admin role required | `supabase/migrations/20260712202939_d519b1e9-7e7e-47c5-884b-767ea6196d6e.sql` |
| `get_bloat_hotspots` | access denied: admin role required | `supabase/migrations/20260712203121_082005c4-c719-4e8a-a3e6-fbc1cbf44ecf.sql` |
| `get_long_running_queries` | Access denied: admin role required | `supabase/migrations/20260712203444_9c648354-c882-49de-bc6a-9033bba167da.sql` |
| `cancel_long_running_query` | Access denied: admin role required | `supabase/migrations/20260712203444_9c648354-c882-49de-bc6a-9033bba167da.sql` |
| `cancel_long_running_query` | Invalid PID | `supabase/migrations/20260712203444_9c648354-c882-49de-bc6a-9033bba167da.sql` |
| `get_lock_conflicts` | Access denied: admin role required | `supabase/migrations/20260712203614_d5304907-6636-4d5c-877e-f274d6c80792.sql` |
| `get_replication_status` | Access denied: admin role required | `supabase/migrations/20260712203852_62af6721-5bfc-4a0a-999b-cb29357a3ebe.sql` |
| `get_duplicate_indexes` | Access denied: admin role required | `supabase/migrations/20260712204147_630b757b-480e-4da7-beb0-32b1e37ebae8.sql` |
| `get_autovacuum_health` | access denied | `supabase/migrations/20260712205647_66a58041-9842-4f02-9fd1-9b7d1efe18f7.sql` |
| `get_wraparound_status` | Access denied: admin role required | `supabase/migrations/20260712211720_cade28fc-94b3-4840-9df3-055f24ebdfc3.sql` |
| `get_rls_audit` | Access denied: admin role required | `supabase/migrations/20260712212132_d59626e8-c3eb-438c-b158-67882acd95e8.sql` |
| `get_extensions_audit` | Access denied: admin role required | `supabase/migrations/20260712212239_c00d0672-eb45-49c6-8e68-c0e0be52b2a4.sql` |
| `get_active_sessions_summary` | Access denied: admin role required | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |
| `get_temp_file_stats` | Access denied: admin role required | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |
| `get_unindexed_foreign_keys` | access denied: admin role required | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |
| `get_capacity_forecast_fast` | forbidden | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |
| `get_cache_hit_ratios` | Access denied: admin role required | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |
| `get_top_tables_by_size` | Access denied: admin role required | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |
| `get_wal_health` | forbidden | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |
| `get_transaction_health` | forbidden | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |

## E. Estados, máquinas de estado e transições

### E.1 Colunas de status no banco

| Tabela | Coluna | Valores permitidos (enum/CHECK) | Default |
|---|---|---|---|
| `coletas` | `status` | `aguardando_liberacao`, `solicitada`, `em_transito`, `chegou_expedicao`, `conferencia_ok`, `divergencia`, `finalizada` | `aguardando_liberacao` |
| `entregas` | `status` | `aguardando_producao`, `pronto_despacho`, `cotacao_frete`, `nf_emitida`, `despachado`, `em_transito`, `saiu_entrega`, `entregue`, `ocorrencia`, `finalizado` | `aguardando_producao` |
| `fretes_internos` | `status` | `pendente`, `em_transito`, `entregue`, `atrasado`, `cancelado` | `pendente` |
| `reward_purchases` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `conciliacoes` | `status` | `arquivada`, `concluida`, `em_andamento`, `rascunho` | `rascunho` |
| `conciliacao_itens_importados` | `status` | `conciliado`, `divergencia`, `ignorado`, `pendente` | `pendente` |
| `user_onboarding` | `current_step` | **livre (sem enum/CHECK)** | `0` |
| `password_reset_requests` | `status` | `approved`, `pending`, `rejected` | `pending` |
| `reward_redemptions` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `cotacoes_multicanal` | `status` | `expirado`, `pendente`, `respondido`, `selecionado` | `pendente` |
| `webhook_deliveries` | `response_status` | **livre (sem enum/CHECK)** |  |
| `logistica_reversa` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `architecture_decisions` | `status` | **livre (sem enum/CHECK)** | `accepted` |
| `rastreamento_historico` | `order_status` | **livre (sem enum/CHECK)** |  |
| `system_adr` | `status` | **livre (sem enum/CHECK)** |  |
| `freight_decisions` | `status` | **livre (sem enum/CHECK)** | `success` |
| `automation_audit_logs` | `status` | **livre (sem enum/CHECK)** |  |
| `bitrix_sync_logs` | `status` | **livre (sem enum/CHECK)** |  |
| `kanban_history` | `from_status` | **livre (sem enum/CHECK)** |  |
| `kanban_history` | `to_status` | **livre (sem enum/CHECK)** |  |
| `delivery_receipt_audit` | `upload_status` | **livre (sem enum/CHECK)** |  |
| `delivery_receipt_audit` | `ocr_status` | **livre (sem enum/CHECK)** |  |
| `system_heartbeat` | `status` | **livre (sem enum/CHECK)** |  |
| `remediation_actions` | `status` | `ignored`, `in_progress`, `pending`, `resolved` | `pending` |
| `index_proposals` | `status` | `applied`, `approved`, `failed`, `proposed`, `rejected`, `reverted` | `proposed` |
| `mitigation_actions` | `status` | `cancelada`, `concluida`, `em_execucao`, `planejada` | `planejada` |
| `rte_gateway_health` | `http_status` | **livre (sem enum/CHECK)** | `0` |
| `rte_slo_daily_snapshots` | `status` | `atencao`, `ok`, `violado` | `ok` |

### E.2 Mapas de transição declarados no código

- **validTransitions** (`src/pages/Despachos.tsx`):
  ```ts
  pronto_despacho: "cotacao_frete", cotacao_frete: "nf_emitida", nf_emitida: "despachado",
  ```

### E.3 Valores de status usados no código (escreve / compara / filtra)

| Campo | Valor | Uso | Onde |
|---|---|---|---|
| `type` | `ADD_TOAST` | compara, escreve | `src/hooks/ui/use-toast.ts` |
| `type` | `DISMISS_TOAST` | compara, escreve | `src/hooks/ui/use-toast.ts` |
| `type` | `Feature` | escreve | `src/components/dashboard/LogisticsMapWidget.tsx`<br>`src/components/map/MapboxMap.tsx` |
| `type` | `FeatureCollection` | escreve | `src/components/dashboard/LogisticsMapWidget.tsx`<br>`src/components/map/MapboxMap.tsx` |
| `type` | `Inbound` | escreve | `src/pages/Coletas.tsx` |
| `type` | `LineString` | escreve | `src/components/dashboard/LogisticsMapWidget.tsx`<br>`src/components/map/MapboxMap.tsx` |
| `type` | `Point` | escreve | `src/components/dashboard/LogisticsMapWidget.tsx`<br>`src/components/map/MapboxMap.tsx` |
| `type` | `Polygon` | escreve | `src/components/map/MapboxMap.tsx` |
| `type` | `REMOVE_TOAST` | compara, escreve | `src/hooks/ui/use-toast.ts` |
| `type` | `Reversa` | escreve | `src/pages/Coletas.tsx` |
| `type` | `SKIP_WAITING` | escreve | `src/components/pwa/UpdatePrompt.tsx` |
| `type` | `UPDATE_TOAST` | compara, escreve | `src/hooks/ui/use-toast.ts` |
| `type` | `Urgente` | escreve | `src/pages/Coletas.tsx` |
| `type` | `achievement` | compara | `src/components/notifications/UserNotificationCenter.tsx` |
| `type` | `all` | compara, escreve | `src/components/dashboard/LogisticsMapWidget.tsx`<br>`src/hooks/logistics/useLogisticsCalendar.tsx`<br>`src/pages/CalendarioLogistico.tsx` |
| `type` | `array` | escreve | `src/components/common/CSVImporter.tsx`<br>`src/hooks/common/useImportData.ts`<br>`src/lib/excelImporter.ts` |
| `type` | `authentication` | escreve | `src/hooks/auth/useWebAuthn.tsx` |
| `type` | `bar` | compara | `src/components/dashboard/PerformanceChart.tsx`<br>`src/components/ui/skeletons.tsx` |
| `type` | `binary` | escreve | `src/lib/conciliacaoImport.ts` |
| `type` | `block_carrier` | compara | `src/components/automation/RuleEditor.tsx` |
| `type` | `boolean` | escreve | `src/hooks/logistics/useBusinessRules.tsx` |
| `type` | `change_status` | compara | `src/components/automation/RuleEditor.tsx`<br>`src/hooks/logistics/useBusinessRuleEngine.tsx` |
| `type` | `circle` | escreve | `src/components/map/MapboxMap.tsx` |
| `type` | `cliente` | compara, escreve | `src/components/search/GlobalSearch.tsx`<br>`src/hooks/common/useGlobalSearch.tsx` |
| `type` | `coleta` | compara, escreve | `src/components/search/GlobalSearch.tsx`<br>`src/hooks/common/useGlobalSearch.tsx`<br>`src/hooks/logistics/useLogisticsCalendar.tsx` |
| `type` | `coleta_atrasada` | compara, escreve | `src/components/dashboard/AlertsPanel.tsx`<br>`src/components/notifications/NotificationCenter.tsx`<br>`src/hooks/analytics/useDashboardMetrics.tsx`<br>`src/hooks/logistics/useSmartAlerts.tsx` |
| `type` | `coletas` | escreve | `supabase/functions/scheduled-reports/index.ts` |
| `type` | `collection` | compara | `src/components/analytics/OperationalPulse.tsx` |
| `type` | `cost` | escreve | `src/hooks/logistics/useLogisticsIntelligence.tsx` |
| `type` | `create` | escreve | `src/hooks/common/useOnlineStatus.tsx` |
| `type` | `create_alert` | compara | `src/components/automation/RuleEditor.tsx`<br>`src/hooks/logistics/useBusinessRuleEngine.tsx` |
| `type` | `crit` | compara | `src/hooks/logistics/useSmartAlerts.tsx`<br>`src/pages/MapaRotas.tsx` |
| `type` | `critical` | compara, escreve | `src/components/common/ConfirmProvider.tsx`<br>`src/hooks/logistics/useSLANotifications.tsx` |
| `type` | `custos` | escreve | `supabase/functions/scheduled-reports/index.ts` |
| `type` | `danger` | escreve | `src/components/common/ConfirmProvider.tsx` |
| `type` | `data_repair` | escreve | `supabase/functions/nexus-auto-healing/index.ts` |
| `type` | `decimal` | escreve | `src/pages/ConfiguracoesFrete.tsx` |
| `type` | `delivery` | compara, escreve | `src/components/analytics/OperationalPulse.tsx`<br>`src/pages/RastreamentoRealTime.tsx` |
| `type` | `device` | escreve | `src/components/security/SecurityOverviewPanel.tsx` |
| `type` | `divergencia` | compara, escreve | `src/components/dashboard/AlertsPanel.tsx`<br>`src/components/notifications/NotificationCenter.tsx`<br>`src/hooks/analytics/useDashboardMetrics.tsx` |
| `type` | `entrega` | compara, escreve | `src/components/search/GlobalSearch.tsx`<br>`src/hooks/common/useGlobalSearch.tsx`<br>`src/hooks/logistics/useLogisticsCalendar.tsx`<br>`src/pages/CalendarioLogistico.tsx` |
| `type` | `entrega_atrasada` | compara, escreve | `src/components/notifications/NotificationCenter.tsx`<br>`src/hooks/logistics/useSmartAlerts.tsx` |
| `type` | `entregas` | escreve | `supabase/functions/scheduled-reports/index.ts` |
| `type` | `error` | compara, escreve | `src/components/notifications/UserNotificationCenter.tsx`<br>`supabase/functions/db-regression-monitor/index.ts` |
| `type` | `fill` | escreve | `src/components/map/MapboxMap.tsx` |
| `type` | `first-input` | escreve | `src/hooks/analytics/usePerformanceMonitor.ts` |
| `type` | `fornecedor` | compara, escreve | `src/components/search/GlobalSearch.tsx`<br>`src/hooks/common/useGlobalSearch.tsx` |
| `type` | `geojson` | escreve | `src/components/map/MapboxMap.tsx` |
| `type` | `ia_previsao` | compara, escreve | `src/components/dashboard/AlertsPanel.tsx`<br>`src/hooks/analytics/useDashboardMetrics.tsx` |
| `type` | `info` | escreve | `src/components/common/ConfirmProvider.tsx`<br>`src/hooks/notifications/useNotifications.tsx`<br>`src/lib/freightForecast.ts`<br>`src/pages/MapaRotas.tsx`<br>`supabase/functions/accuracy-weekly-digest/index.ts` |
| `type` | `integer` | escreve | `src/pages/ConfiguracoesFrete.tsx` |
| `type` | `json_object` | escreve | `supabase/functions/normalize-freight-response/index.ts` |
| `type` | `largest-contentful-paint` | escreve | `src/hooks/analytics/usePerformanceMonitor.ts` |
| `type` | `layout-shift` | escreve | `src/hooks/analytics/usePerformanceMonitor.ts` |
| `type` | `line` | compara, escreve | `src/components/map/MapboxMap.tsx`<br>`src/components/ui/skeletons.tsx` |
| `type` | `login` | escreve | `src/components/security/SecurityOverviewPanel.tsx` |
| `type` | `mfa` | escreve | `src/components/security/SecurityOverviewPanel.tsx` |
| `type` | `mobile` | escreve | `src/components/melhorenvio/MELojasPanel.tsx` |
| `type` | `nexus_tactical` | escreve | `src/hooks/logistics/useSmartAlerts.tsx` |
| `type` | `number` | escreve | `src/hooks/logistics/useBusinessRules.tsx` |
| `type` | `occurrence` | compara, escreve | `src/components/analytics/OperationalPulse.tsx` |
| `type` | `ocorrencia` | compara, escreve | `src/components/dashboard/AlertsPanel.tsx`<br>`src/components/notifications/NotificationCenter.tsx`<br>`src/hooks/analytics/useDashboardMetrics.tsx` |
| `type` | `page` | escreve | `src/hooks/common/useGlobalSearch.tsx` |
| `type` | `password` | compara | `src/components/ui/input.tsx` |
| `type` | `pie` | compara | `src/components/dashboard/PerformanceChart.tsx`<br>`src/components/ui/skeletons.tsx` |
| `type` | `portal` | compara | `src/pages/Transportadoras.tsx` |
| `type` | `prazo_critico` | compara, escreve | `src/components/dashboard/AlertsPanel.tsx`<br>`src/components/notifications/NotificationCenter.tsx`<br>`src/hooks/analytics/useDashboardMetrics.tsx`<br>`src/hooks/logistics/useSmartAlerts.tsx` |
| `type` | `process` | escreve | `src/hooks/logistics/useLogisticsIntelligence.tsx` |
| `type` | `public-key` | escreve | `src/hooks/auth/useWebAuthn.tsx` |
| `type` | `raster` | escreve | `src/lib/mapStyles.ts` |
| `type` | `raster-dem` | escreve | `src/lib/mapStyles.ts` |
| `type` | `recovery` | escreve | `supabase/functions/send-password-reset/index.ts` |
| `type` | `registration` | escreve | `src/hooks/auth/useWebAuthn.tsx` |
| `type` | `resource` | escreve | `src/hooks/logistics/useLogisticsIntelligence.tsx` |
| `type` | `route_deviation` | escreve | `src/hooks/logistics/useLalamoveTracking.tsx` |
| `type` | `security` | escreve | `src/components/security/SecurityOverviewPanel.tsx` |
| `type` | `select` | escreve | `src/hooks/logistics/useBusinessRules.tsx` |
| `type` | `send_email` | compara | `src/components/automation/RuleEditor.tsx` |
| `type` | `send_notification` | compara, escreve | `src/components/automation/RuleEditor.tsx`<br>`src/hooks/logistics/useBusinessRuleEngine.tsx` |
| `type` | `servico` | compara | `src/components/melhorenvio/METransportadorasPanel.tsx` |
| `type` | `sla` | escreve | `supabase/functions/scheduled-reports/index.ts` |
| `type` | `spring` | escreve | `src/components/achievements/AchievementNotification.tsx`<br>`src/components/common/ConfirmProvider.tsx`<br>`src/components/common/StepProgress.tsx`<br>`src/components/dashboard/AlertsPanel.tsx`<br>`src/components/dashboard/FavoriteMetricsBar.tsx`<br>… +11 |
| `type` | `success` | compara, escreve | `src/components/notifications/UserNotificationCenter.tsx`<br>`src/lib/freightForecast.ts` |
| `type` | `symbol` | escreve | `src/components/map/MapboxMap.tsx` |
| `type` | `system` | escreve | `src/components/analytics/OperationalPulse.tsx` |
| `type` | `text` | escreve | `src/hooks/logistics/useBusinessRules.tsx`<br>`src/pages/ConfiguracoesFrete.tsx` |
| `type` | `transportadora` | compara, escreve | `src/components/melhorenvio/METransportadorasPanel.tsx`<br>`src/hooks/common/useGlobalSearch.tsx` |
| `type` | `truck` | compara, escreve | `src/components/map/MapboxMap.tsx`<br>`src/pages/RastreamentoRealTime.tsx` |
| `type` | `warn` | compara | `src/pages/MapaRotas.tsx` |
| `type` | `warning` | compara, escreve | `src/components/notifications/UserNotificationCenter.tsx`<br>`src/hooks/logistics/useSLANotifications.tsx`<br>`src/lib/freightForecast.ts`<br>`supabase/functions/accuracy-meta-monitor/index.ts` |
| `type` | `whatsapp` | compara, escreve | `src/pages/Transportadoras.tsx` |
| `status` | `Ativo` | escreve | `src/pages/IntegracaoBitrix.tsx` |
| `status` | `CHANNEL_ERROR` | compara | `src/hooks/data/useRealtime.tsx` |
| `status` | `CLOSED` | compara | `src/hooks/data/useRealtime.tsx` |
| `status` | `COMPLETED` | compara, escreve | `supabase/functions/lalamove-webhook/index.ts`<br>`supabase/functions/lalamove-webhook/index_test.ts` |
| `status` | `ERROR` | escreve | `src/utils/systemTester.ts` |
| `status` | `Finalizado` | escreve | `src/components/dashboard/MissionDetail.tsx` |
| `status` | `Iniciado` | escreve | `src/components/dashboard/MissionDetail.tsx` |
| `status` | `JOINING` | compara | `src/components/common/RealtimeBadge.tsx`<br>`src/components/common/RealtimeStatus.tsx` |
| `status` | `PASS` | compara | `src/utils/systemTester.ts` |
| `status` | `Processamento` | escreve | `src/components/dashboard/MissionDetail.tsx` |
| `status` | `SUBSCRIBED` | compara | `src/components/common/RealtimeBadge.tsx`<br>`src/components/common/RealtimeStatus.tsx`<br>`src/hooks/data/useRealtime.tsx`<br>`src/utils/systemTester.ts` |
| `status` | `SUCCESS` | compara | `src/pages/IntegracaoBitrix.tsx` |
| `status` | `Status` | escreve | `src/hooks/common/useExport.tsx`<br>`src/hooks/security/useAuditLogs.tsx`<br>`src/hooks/security/useEntityHistory.tsx` |
| `status` | `TIMED_OUT` | compara | `src/hooks/data/useRealtime.tsx` |
| `status` | `Transito` | escreve | `src/components/dashboard/MissionDetail.tsx` |
| `status` | `aberta` | filtra | `supabase/functions/ai-logistics-assistant/index.ts` |
| `status` | `above` | compara | `src/pages/Analytics.tsx` |
| `status` | `aguardando_liberacao` | compara, escreve, filtra | `src/components/coletas/PickupDetailsDialog.tsx`<br>`src/components/coletas/PickupDialog.tsx`<br>`src/pages/Coletas.tsx`<br>`src/pages/PainelSLA.tsx` |
| `status` | `aguardando_producao` | compara, escreve | `src/hooks/logistics/useDeliveryRoutes.tsx`<br>`src/pages/Envios.tsx` |
| `status` | `all` | compara, escreve | `src/hooks/common/useFilters.ts` |
| `status` | `applied` | compara | `src/features/db-observability/components/IndexProposalsCard.tsx` |
| `status` | `approved` | compara, escreve | `src/features/db-observability/components/IndexProposalsCard.tsx`<br>`src/pages/AprovacaoResetSenha.tsx`<br>`src/pages/aprovacao-reset/ResetRequestsTable.tsx`<br>`supabase/functions/send-password-reset/index.ts` |
| `status` | `aprovado` | escreve | `src/pages/LogisticaReversa.tsx` |
| `status` | `arquivada` | compara | `src/pages/conciliacao/ConciliacaoList.tsx` |
| `status` | `atencao` | compara | `src/components/rodonaves/RTEGatewaySLOPanel.tsx`<br>`src/components/rodonaves/RTESLOHistoryPanel.tsx`<br>`src/lib/rodonaves/gatewaySLO.ts`<br>`src/lib/rodonaves/sloAlerts.ts` |
| `status` | `below` | compara | `src/pages/Analytics.tsx` |
| `status` | `bloqueado` | escreve | `src/lib/rodonaves/capabilities.ts` |
| `status` | `cancelado` | escreve | `src/pages/LogisticaReversa.tsx` |
| `status` | `canceled` | compara | `src/components/melhorenvio/MEEtiquetasPanel.tsx` |
| `status` | `chegou_expedicao` | compara, escreve | `src/components/coletas/PickupDetailsDialog.tsx`<br>`supabase/functions/lalamove-webhook/index.ts` |
| `status` | `coletada` | filtra | `supabase/functions/nexus-auto-healing/index.ts` |
| `status` | `completed` | compara, escreve | `src/components/common/Timeline.tsx`<br>`src/pages/RastreamentoPublico.tsx` |
| `status` | `conciliado` | compara, escreve | `src/hooks/logistics/useConciliacao.tsx`<br>`src/pages/ConciliacaoAutomatica.tsx`<br>`src/pages/ConciliacaoFinanceira.tsx`<br>`src/pages/conciliacao/ConciliacaoDialogs.tsx`<br>`src/pages/conciliacao/ConciliacaoItensTable.tsx` |
| `status` | `concluida` | compara, escreve | `src/components/predictions/MitigationHistoryPanel.tsx`<br>`src/hooks/logistics/useConciliacao.tsx`<br>`src/lib/predictions/mitigationROI.ts`<br>`src/pages/ConciliacaoFinanceira.tsx`<br>`src/pages/conciliacao/ConciliacaoList.tsx` |
| `status` | `conferencia_ok` | compara | `src/hooks/analytics/useKPIBenchmark.tsx`<br>`src/pages/Coletas.tsx` |
| `status` | `configured` | compara | `src/hooks/security/useIntegrationValidation.tsx` |
| `status` | `connected` | compara, escreve | `src/hooks/security/useIntegrationValidation.tsx`<br>`src/pages/Configuracoes.tsx` |
| `status` | `cotacao_frete` | compara | `src/components/shipping/ExpeditionDetailsDialog.tsx`<br>`src/hooks/logistics/useDeliveryRoutes.tsx`<br>`src/pages/Despachos.tsx` |
| `status` | `critical` | compara | `src/hooks/logistics/useCostAlerts.tsx` |
| `status` | `critical_failure` | escreve | `supabase/functions/health/index.ts` |
| `status` | `current` | compara | `src/components/common/Timeline.tsx` |
| `status` | `degraded` | compara | `src/components/dashboard/SystemHealthWidget.tsx` |
| `status` | `deleted_at_set` | escreve | `src/hooks/data/useSoftDelete.ts` |
| `status` | `delivered` | compara | `src/components/melhorenvio/MEEtiquetasPanel.tsx` |
| `status` | `despachado` | compara, escreve, filtra | `src/hooks/logistics/useDeliveryRoutes.tsx`<br>`src/hooks/logistics/useSLAAlerts.tsx`<br>`src/pages/Despachos.tsx`<br>`src/pages/Envios.tsx`<br>`src/pages/KanbanEntregas.tsx`<br>… +4 |
| `status` | `divergencia` | compara | `src/components/coletas/PickupDetailsDialog.tsx`<br>`src/hooks/analytics/useDashboardData.tsx`<br>`src/hooks/logistics/useConciliacao.tsx`<br>`src/pages/Coletas.tsx`<br>`src/pages/ConciliacaoAutomatica.tsx`<br>… +2 |
| `status` | `down` | compara | `src/components/dashboard/SystemHealthWidget.tsx` |
| `status` | `elite` | escreve | `src/components/admin/DORAMetrics.tsx` |
| `status` | `em_andamento` | compara, escreve | `src/hooks/logistics/useConciliacao.tsx`<br>`src/pages/conciliacao/ConciliacaoList.tsx` |
| `status` | `em_execucao` | escreve | `src/hooks/predictions/useMitigationActions.ts` |
| `status` | `em_transito` | compara, escreve | `src/components/coletas/PickupDetailsDialog.tsx`<br>`src/components/common/ActivityTimeline.tsx`<br>`src/hooks/analytics/useDashboardData.tsx`<br>`src/hooks/logistics/useDeliveryRoutes.tsx`<br>`src/pages/Coletas.tsx`<br>… +5 |
| `status` | `empty` | compara, escreve | `supabase/functions/accuracy-weekly-digest/index.ts` |
| `status` | `entregue` | compara, escreve, filtra | `src/components/analytics/OperationalPulse.tsx`<br>`src/components/common/ActivityTimeline.tsx`<br>`src/components/dashboard/MissionDetail.tsx`<br>`src/hooks/analytics/useExecutiveMetrics.tsx`<br>`src/hooks/analytics/useKPIBenchmark.tsx`<br>… +15 |
| `status` | `error` | compara, escreve | `src/components/analytics/OperationalPulse.tsx`<br>`src/components/freight/FreightAudit.tsx`<br>`src/hooks/security/useIntegrationValidation.tsx`<br>`src/pages/Configuracoes.tsx`<br>`supabase/functions/accuracy-meta-monitor/channelHealth.ts`<br>… +2 |
| `status` | `exceeded` | compara | `src/hooks/logistics/useCostAlerts.tsx` |
| `status` | `expirado` | compara | `src/hooks/logistics/useCotacoesMulticanal.tsx`<br>`src/pages/DashboardCotacoes.tsx`<br>`src/pages/cotacao-multicanal/CotacaoResultsTable.tsx` |
| `status` | `falhou` | compara | `src/hooks/analytics/useDashboardMetrics.tsx`<br>`src/pages/DashboardCotacoes.tsx` |
| `status` | `finalizada` | compara, escreve | `src/components/common/ActivityTimeline.tsx`<br>`src/hooks/analytics/useKPIBenchmark.tsx`<br>`src/pages/CalendarioLogistico.tsx`<br>`src/pages/Coletas.tsx`<br>`src/pages/Relatorios.tsx`<br>… +2 |
| `status` | `finalizado` | compara | `src/hooks/analytics/useExecutiveMetrics.tsx`<br>`src/hooks/analytics/useKPIBenchmark.tsx`<br>`src/pages/DashboardExecutivo.tsx`<br>`src/pages/Envios.tsx`<br>`src/pages/RelatorioPDF.tsx` |
| `status` | `healthy` | compara, escreve | `src/utils/systemTester.ts`<br>`supabase/functions/health/index.ts` |
| `status` | `identified` | escreve | `src/features/incidents/components/PostMortemDashboard.tsx` |
| `status` | `ignorado` | compara, escreve | `src/pages/ConciliacaoFinanceira.tsx`<br>`src/pages/conciliacao/ConciliacaoItensTable.tsx` |
| `status` | `ignored` | compara, escreve | `src/features/db-observability/components/RemediationHistoryCard.tsx`<br>`src/features/db-observability/hooks/useRemediationActions.ts` |
| `status` | `importing` | compara | `src/hooks/common/useImportData.ts` |
| `status` | `in_progress` | compara, escreve | `src/features/db-observability/components/RemediationHistoryCard.tsx`<br>`src/features/db-observability/hooks/useRemediationActions.ts` |
| `status` | `info` | escreve | `src/components/analytics/OperationalPulse.tsx` |
| `status` | `instavel` | escreve | `src/lib/rodonaves/capabilities.ts` |
| `status` | `investigating` | escreve | `src/features/incidents/types/index.ts` |
| `status` | `liberado` | compara, escreve | `src/lib/rodonaves/capabilities.ts` |
| `status` | `measured` | compara | `src/features/db-observability/hooks/useIndexProposals.ts` |
| `status` | `nao_testado` | compara, escreve | `src/lib/rodonaves/capabilities.ts` |
| `status` | `neutral` | compara | `src/components/dashboard/KPICard.tsx` |
| `status` | `nf_emitida` | compara | `src/components/shipping/ExpeditionDetailsDialog.tsx`<br>`src/hooks/logistics/useDeliveryRoutes.tsx`<br>`src/pages/Despachos.tsx` |
| `status` | `no_options` | escreve | `supabase/functions/smart-carrier-selection/index.ts` |
| `status` | `none` | compara, escreve | `src/components/ui/avatar.tsx` |
| `status` | `not_configured` | escreve | `src/hooks/security/useIntegrationValidation.tsx` |
| `status` | `ocorrencia` | compara, filtra | `src/components/common/ActivityTimeline.tsx`<br>`src/components/dashboard/LogisticsMapWidget.tsx`<br>`src/hooks/analytics/useDashboardData.tsx`<br>`src/hooks/analytics/useDashboardMetrics.tsx`<br>`src/hooks/logistics/useDeliveryRoutes.tsx`<br>… +4 |
| `status` | `ok` | compara, escreve | `src/components/rodonaves/RTEGatewaySLOPanel.tsx`<br>`src/components/rodonaves/RTESLOHistoryPanel.tsx`<br>`src/hooks/logistics/useCostAlerts.tsx`<br>`src/hooks/rodonaves/useSLOSnapshots.ts`<br>`src/lib/rodonaves/gatewaySLO.ts`<br>… +3 |
| `status` | `online` | compara, escreve | `src/components/layout/SystemPulse.tsx`<br>`src/components/ui/badge.tsx` |
| `status` | `operational` | compara, escreve | `src/components/dashboard/SystemHealthWidget.tsx`<br>`supabase/functions/nexus-auto-healing/index.ts` |
| `status` | `optimized` | compara, escreve | `src/components/layout/SystemPulse.tsx` |
| `status` | `parsing` | compara | `src/hooks/common/useImportData.ts` |
| `status` | `pendente` | compara, escreve, filtra | `src/hooks/logistics/useConciliacao.tsx`<br>`src/hooks/logistics/useCotacoesMulticanal.tsx`<br>`src/hooks/logistics/useLogisticaReversaReal.tsx`<br>`src/lib/conciliacaoImport.ts`<br>`src/pages/CalendarioLogistico.tsx`<br>… +8 |
| `status` | `pending` | compara, escreve | `src/components/common/Timeline.tsx`<br>`src/features/db-observability/components/RemediationHistoryCard.tsx`<br>`src/features/db-observability/hooks/useRemediationActions.ts`<br>`src/hooks/logistics/useAccuracyMetaCycle.ts`<br>`src/pages/AprovacaoResetSenha.tsx`<br>… +3 |
| `status` | `planejada` | escreve | `src/lib/predictions/mitigationROI.ts` |
| `status` | `posted` | compara | `src/components/melhorenvio/MEEtiquetasPanel.tsx` |
| `status` | `pronto_despacho` | compara, escreve, filtra | `src/components/box/BoxDetailModal.tsx`<br>`src/components/shipping/ExpeditionDetailsDialog.tsx`<br>`src/hooks/logistics/useBoxManagement.tsx`<br>`src/hooks/logistics/useDeliveryRoutes.tsx`<br>`src/pages/Despachos.tsx`<br>… +1 |
| `status` | `proposed` | compara, escreve | `src/features/db-observability/components/IndexProposalsCard.tsx`<br>`src/features/db-observability/hooks/useIndexProposals.ts`<br>`src/pages/AdminADR.tsx` |
| `status` | `purchased` | compara | `src/components/rewards/RewardPurchaseHistory.tsx` |
| `status` | `rascunho` | compara, escreve | `src/hooks/logistics/useConciliacao.tsx`<br>`src/pages/conciliacao/ConciliacaoList.tsx` |
| `status` | `read` | compara | `src/components/predictions/AccuracyMetaAuditPanel.tsx` |
| `status` | `recebido` | compara, escreve | `src/pages/LogisticaReversa.tsx` |
| `status` | `rejected` | compara, escreve | `src/pages/AprovacaoResetSenha.tsx`<br>`src/pages/aprovacao-reset/ResetRequestsTable.tsx`<br>`supabase/functions/log-security-event/index.ts` |
| `status` | `released` | compara | `src/components/melhorenvio/MEEtiquetasPanel.tsx` |
| `status` | `resolved` | compara, escreve | `src/features/db-observability/components/RemediationHistoryCard.tsx`<br>`src/features/db-observability/hooks/useRemediationActions.ts`<br>`src/features/incidents/components/PostMortemDashboard.tsx` |
| `status` | `respondido` | compara, escreve | `src/components/freight/ResponseConsole.tsx`<br>`src/hooks/logistics/useCotacoesMulticanal.tsx`<br>`src/pages/CotacaoMultiCanal.tsx`<br>`src/pages/DashboardCotacoes.tsx`<br>`src/pages/cotacao-multicanal/CotacaoResultsTable.tsx`<br>… +1 |
| `status` | `saiu_entrega` | compara | `src/hooks/logistics/useDeliveryRoutes.tsx`<br>`src/pages/RastreamentoRealTime.tsx` |
| `status` | `secure` | compara, escreve | `src/components/layout/SystemPulse.tsx` |
| `status` | `selecionado` | compara, escreve | `src/hooks/logistics/useCotacoesMulticanal.tsx`<br>`src/pages/DashboardCotacoes.tsx`<br>`src/pages/dashboard-cotacoes/TrechoComparativo.tsx` |
| `status` | `sem_match` | compara, escreve | `src/pages/ConciliacaoAutomatica.tsx` |
| `status` | `sent` | compara, escreve | `supabase/functions/accuracy-weekly-digest/index.ts` |
| `status` | `slow` | compara | `supabase/functions/external-db-bridge/index.ts` |
| `status` | `solicitada` | compara, filtra | `src/components/coletas/PickupDetailsDialog.tsx`<br>`supabase/functions/predict-delays/index.ts` |
| `status` | `success` | compara, escreve | `src/components/analytics/OperationalPulse.tsx`<br>`src/components/dashboard/LiveStatusBar.tsx`<br>`src/components/freight/DecisionAudit.tsx`<br>`src/components/freight/FreightAudit.tsx`<br>`supabase/functions/carrier-webhook-receiver/index.ts`<br>… +3 |
| `status` | `throw` | compara, escreve | `supabase/functions/accuracy-meta-monitor/channelHealth.ts` |
| `status` | `unhealthy` | escreve | `supabase/functions/health-check/index.ts`<br>`supabase/functions/health/index.ts` |
| `status` | `unknown` | escreve | `supabase/functions/accuracy-meta-monitor/channelHealth.ts` |
| `status` | `unread` | compara | `src/components/predictions/AccuracyMetaAuditPanel.tsx` |
| `status` | `validating` | compara | `src/hooks/common/useImportData.ts` |
| `status` | `verified` | compara | `src/components/security/TwoFactorSetup.tsx`<br>`src/hooks/auth/useMFA.ts` |
| `status` | `very_slow` | compara | `supabase/functions/external-db-bridge/index.ts` |
| `status` | `violado` | compara | `src/hooks/rodonaves/useSLOSnapshots.ts`<br>`src/lib/rodonaves/gatewaySLO.ts`<br>`src/lib/rodonaves/sloAlerts.ts`<br>`src/lib/rodonaves/sloReport.ts` |
| `status` | `warning` | compara, escreve | `src/components/analytics/OperationalPulse.tsx` |
| `role` | `CEO` | escreve | `src/pages/auth/AuthHeroSection.tsx` |
| `role` | `Coordenadora` | escreve | `src/pages/auth/AuthHeroSection.tsx` |
| `role` | `admin` | compara, escreve, filtra | `src/hooks/auth/useAuth.tsx`<br>`src/pages/GerenciamentoUsuarios.tsx`<br>`supabase/functions/db-health-weekly-report/index.ts`<br>`supabase/functions/db-regression-monitor/index.ts`<br>`supabase/functions/lgpd-erase-user/index.ts`<br>… +2 |
| `role` | `assistant` | compara, escreve | `src/components/ai/AIAssistant.tsx` |
| `role` | `authenticated` | compara | `supabase/functions/_shared/auth.ts`<br>`supabase/functions/log-security-event/index.ts` |
| `role` | `service_role` | compara, escreve | `supabase/functions/_shared/auth.ts`<br>`supabase/functions/predict-delays-scheduled/index.ts`<br>`supabase/functions/resend-email/index.ts` |
| `role` | `system` | escreve | `supabase/functions/ai-logistics-assistant/index.ts`<br>`supabase/functions/normalize-freight-response/index.ts`<br>`supabase/functions/predict-delays/index.ts` |
| `role` | `user` | compara, escreve | `src/components/ai/AIAssistant.tsx`<br>`src/pages/GerenciamentoUsuarios.tsx`<br>`supabase/functions/ai-logistics-assistant/index.ts`<br>`supabase/functions/normalize-freight-response/index.ts`<br>`supabase/functions/predict-delays/index.ts` |
| `step` | `idle` | compara | `src/components/dashboard/BiometricConsentModal.tsx` |
| `step` | `scan` | compara | `src/components/coletas/PickupConference.tsx` |
| `step` | `scanning` | compara | `src/components/dashboard/BiometricConsentModal.tsx` |
| `step` | `start` | compara | `src/components/security/MFAEnroll.tsx` |
| `step` | `success` | compara | `src/components/dashboard/BiometricConsentModal.tsx` |
| `tipo` | `coleta` | compara, escreve | `src/hooks/logistics/useUnifiedTracking.tsx`<br>`src/pages/PainelSLA.tsx`<br>`supabase/functions/predict-delays/index.ts` |
| `tipo` | `entrega` | compara, escreve | `src/components/dashboard/LogisticsMapWidget.tsx`<br>`src/components/dashboard/MissionDetail.tsx`<br>`src/components/predictions/DelayPredictionPanel.tsx`<br>`src/hooks/logistics/useDelayPrediction.tsx`<br>`src/hooks/logistics/useUnifiedTracking.tsx`<br>… +5 |
| `tipo` | `faturas_entregas` | escreve | `src/hooks/logistics/useConciliacao.tsx`<br>`src/pages/ConciliacaoFinanceira.tsx` |
| `tipo` | `global` | compara | `src/hooks/logistics/useCostAlerts.tsx` |
| `tipo` | `rota` | compara | `src/hooks/logistics/useCostAlerts.tsx` |
| `tipo` | `transportadora` | compara, escreve | `src/hooks/logistics/useCostAlerts.tsx` |
| `tipo` | `valor_maximo` | escreve | `src/pages/AlertasCusto.tsx` |
| `estado` | `MG` | escreve | `src/components/freight/NexusCoverageMap.tsx` |
| `estado` | `PE` | escreve | `src/components/freight/NexusCoverageMap.tsx` |
| `estado` | `RJ` | escreve | `src/components/freight/NexusCoverageMap.tsx` |
| `estado` | `SP` | escreve | `src/components/freight/NexusCoverageMap.tsx` |
| `estado` | `UF` | escreve | `src/hooks/common/useExport.tsx` |
| `state` | `OPEN` | compara | `src/services/resilience/CircuitBreaker.ts` |
| `state` | `collapsed` | compara | `src/components/ui/sidebar.tsx` |
| `state` | `expanded` | escreve | `src/components/ui/sidebar.tsx` |
| `state` | `granted` | compara | `src/hooks/ui/useQRScanner.tsx` |
| `state` | `installed` | compara | `src/components/pwa/UpdatePrompt.tsx` |
| `state` | `suspended` | compara | `src/utils/celebrationSounds.ts` |
| `upload_status` | `failed` | escreve | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| `upload_status` | `success` | escreve | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| `ocr_status` | `pending` | escreve | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| `ocr_status` | `processed` | escreve | `supabase/functions/ocr-receipt-processor/index.ts` |
| `last_status` | `failed` | compara | `src/features/db-observability/components/CronJobsCard.tsx` |
| `last_status` | `succeeded` | compara | `src/features/db-observability/components/CronJobsCard.tsx` |
| `phase` | `entregue` | compara | `src/lib/rodonaves/eventCodes.ts` |
| `phase` | `no_destino` | compara | `src/lib/rodonaves/freightHealth.ts` |
| `origem_estado` | `SP` | escreve | `src/pages/DashboardCotacoes.tsx` |
| `destino_estado` | `RJ` | escreve | `src/pages/DashboardCotacoes.tsx` |
| `to_status` | `despachado` | escreve | `src/pages/Despachos.tsx` |
| `order_status` | `motorista_alocado` | escreve | `supabase/functions/lalamove-webhook/index.ts` |

### E.4 Enums e listas de valores

| Nome | Valores | Onde |
|---|---|---|
| achievement_tier | `bronze`, `silver`, `gold`, `platinum`, `diamond` | banco |
| coleta_tipo | `lalamove`, `transportadora` | banco |
| coleta_status | `aguardando_liberacao`, `solicitada`, `em_transito`, `chegou_expedicao`, `conferencia_ok`, `divergencia`, `finalizada` | banco |
| entrega_status | `aguardando_producao`, `pronto_despacho`, `cotacao_frete`, `nf_emitida`, `despachado`, `em_transito`, `saiu_entrega`, `entregue`, `ocorrencia`, `finalizado` | banco |
| frete_tipo | `cif`, `fob`, `cortesia` | banco |
| app_role | `admin`, `user` | banco |
| frete_interno_status | `pendente`, `em_transito`, `entregue`, `atrasado`, `cancelado` | banco |
| notification_type | `info`, `success`, `warning`, `error`, `achievement` | banco |
| ColetaStatus | aguardando_liberacao \| solicitada \| em_transito \| chegou_expedicao \| conferencia_ok \| divergencia \| finalizada | `src/components/coletas/types.ts` |
| ColetaTipo | lalamove \| transportadora | `src/components/coletas/types.ts` |
| ConfirmType | danger \| warning \| info \| success \| critical | `src/components/common/ConfirmDialog.tsx` |
| EmptyStateVariant | search \| data \| delivery \| notifications \| users \| error \| inbox \| calendar \| default \| location | `src/components/common/EmptyState.tsx` |
| StatusType | pending \| in_progress \| completed \| cancelled \| error \| warning \| aguardando_producao \| pronto_despacho \| despachado \| em_transito \| saiu_entrega \| entregue \| finalizado \| finalizada \| ocorrencia \| divergencia \| atrasado \| solicitada \| agendada \| coletada \| cancelada \| pendente \| ativo \| inativo | `src/components/common/statusHelpers.ts` |
| WidgetSize | small \| medium \| large \| full | `src/components/dashboard/DraggableDashboard.tsx` |
| RegressionSeverity | critical \| warning \| ok | `src/features/db-observability/types/index.ts` |
| CircuitState | CLOSED \| OPEN \| HALF_OPEN | `src/features/incidents/types/index.ts` |
| UIDensity | compact \| standard \| comfortable | `src/features/preferences/types/index.ts` |
| ThemeMode | light \| dark \| system | `src/features/preferences/types/index.ts` |
| TelemetrySeverity | info \| warning \| error \| critical | `src/hooks/analytics/useTelemetry.ts` |
| Density | compact \| standard \| comfortable | `src/hooks/common/useDensity.ts` |
| ImportStatus | idle \| parsing \| validating \| importing \| complete \| error | `src/hooks/common/useImportData.ts` |
| SortDirection | asc \| desc | `src/hooks/common/useSorting.ts` |
| BadgeTier | bronze \| silver \| gold \| platinum \| diamond | `src/hooks/gamification/useGamification.ts` |
| BadgeRarity | common \| rare \| epic \| legendary | `src/hooks/gamification/useGamification.ts` |
| EntityType | coleta \| entrega \| ocorrencia \| frete | `src/hooks/logistics/useBusinessRules.tsx` |
| TriggerEvent | on_create \| on_update \| on_status_change \| low_performance \| high_cost | `src/hooks/logistics/useBusinessRules.tsx` |
| ConditionOperator | equals \| not_equals \| contains \| greater_than \| less_than \| is_empty \| is_not_empty \| below_threshold | `src/hooks/logistics/useBusinessRules.tsx` |
| ActionType | send_notification \| change_status \| send_email \| add_tag \| assign_user \| create_alert \| block_carrier | `src/hooks/logistics/useBusinessRules.tsx` |
| FlowStep | dados \| resultados \| comparar \| despachar | `src/hooks/logistics/useQuotationFlow.tsx` |
| NotificationPermissionState | default \| granted \| denied | `src/hooks/logistics/useSLANotifications.tsx` |
| TrackingFilter | all \| atrasados \| em_transito \| entregue \| pendentes | `src/hooks/logistics/useUnifiedTracking.tsx` |
| MitigationStatus | planejada \| em_execucao \| concluida \| cancelada | `src/hooks/predictions/useMitigationActions.ts` |
| TIPOS_FRETE | { value: "cif", label: "CIF - Frete por conta do remetente" }, { value: "fob", label: "FOB - Frete por conta do destinatário" }, { value: "cortesia", label: "Cortesia - Sem cobrança" }, | `src/lib/constants.ts` |
| TIPOS_OCORRENCIA | { value: "atraso", label: "Atraso na Entrega" }, { value: "avaria", label: "Avaria/Dano" }, { value: "extravio", label: "Extravio" }, { value: "endereco_incorreto", label: "Endereço Incorreto" }, { value: "ausente", label: "Destinatário Ausente" }, { value: "recusa", label: "Recusa de Recebimento" } … | `src/lib/constants.ts` |
| MitigationPriority | alta \| media \| baixa | `src/lib/predictions/mitigationRecommender.ts` |
| RootCauseCategory | clima \| transportadora \| distancia \| feriado \| demanda \| endereco \| documentacao \| outros | `src/lib/predictions/rootCauseAnalyzer.ts` |
| RTEGateway | quotation \| tracking \| pickup \| customer \| selfattendance \| dne \| payments \| unittocity | `src/lib/rodonaves/capabilities.ts` |
| RTECapabilityStatus | liberado \| bloqueado \| offline \| instavel \| nao_testado | `src/lib/rodonaves/capabilities.ts` |
| RTEPhase | coletado \| transferencia \| distribuicao \| no_destino \| em_rota \| entregue \| desconhecido | `src/lib/rodonaves/eventCodes.ts` |
| RTEExceptionCategory | tentativa \| recusa \| estabelecimento_fechado \| endereco_nao_localizado \| pessoa_nao_localizada \| aguardando_retirada \| avaria \| extravio \| reagendado \| devolucao \| parcial | `src/lib/rodonaves/eventCodes.ts` |
| RTESeverity | info \| atencao \| critico | `src/lib/rodonaves/eventCodes.ts` |
| RTECodeSystem | event \| step | `src/lib/rodonaves/eventCodes.ts` |
| FreightAnomaly | atrasado \| parado \| excecao | `src/lib/rodonaves/freightHealth.ts` |
| SLOStatus | ok \| atencao \| violado | `src/lib/rodonaves/gatewaySLO.ts` |
| AlertSeverity | info \| warning \| critical | `src/lib/rodonaves/sloAlerts.ts` |
| CircuitState | CLOSED = "CLOSED", // Normal operation OPEN = "OPEN", // Service is failing, stop requests HALF_OPEN = "HALF_OPEN" // Service might be back, try one request | `supabase/functions/_shared/circuitBreaker.ts` |
| LogLevel | INFO = 'INFO', WARN = 'WARN', ERROR = 'ERROR', DEBUG = 'DEBUG' | `supabase/functions/_shared/logger.ts` |
| ChannelName | email \| whatsapp | `supabase/functions/accuracy-meta-monitor/channelHealth.ts` |
| ChannelStatus | ok \| error \| throw \| unknown | `supabase/functions/accuracy-meta-monitor/channelHealth.ts` |
| ActionKind | skip_group \| skip_below_threshold \| skip_signature \| update \| insert | `supabase/functions/accuracy-meta-monitor/simulator.ts` |

## F. Validações de entrada

### F.1 Schemas Zod

- **ipSchema** (`src/components/security/IPAccessControl.tsx`, z.object):
  ```ts
  { ip_pattern: z.string().min(1, "IP é obrigatório").regex(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^\*$/, "IP inválido (ex: 192.168.1.1 ou 192.168.1.0/24)"), description: z.string().max(200, "Descrição muito longa").optional(), rule_type: z.enum(["whitelist", "blacklist"]), }
  ```
- **LalamoveOrderSchema** (`src/integrations/shared/api-schemas.ts`, z.object):
  ```ts
  { id: z.string(), status: z.string(), price: z.object({ amount: z.string(), currency: z.string() }).optional(), driverId: z.string().nullable().optional(), }
  ```
- **RodonavesTrackingSchema** (`src/integrations/shared/api-schemas.ts`, z.object):
  ```ts
  { numero: z.string(), status: z.string(), data: z.string().optional(), descricao: z.string().optional(), }
  ```
- **BitrixDealSchema** (`src/integrations/shared/api-schemas.ts`, z.object):
  ```ts
  { ID: z.string(), TITLE: z.string(), STAGE_ID: z.string(), OPPORTUNITY: z.string().optional(), CURRENCY_ID: z.string().optional(), }
  ```
- **cnpjSchema** (`src/lib/validations.ts`, z.string, encadeia refine):
  ```ts
  
  ```
  - Regras cruzadas (refine): “CNPJ inválido - dígitos verificadores incorretos”
- **clienteSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { razao_social: z.string().min(3, "Razão social deve ter no mínimo 3 caracteres"), nome_fantasia: z.string().optional(), cnpj: cnpjSchema.optional().or(z.literal("")), endereco_completo: z.string().min(10, "Endereço deve ter no mínimo 10 caracteres"), cidade: z.string().optional(), estado: z.string().length(2, "UF deve ter 2 caracteres").optional().or(z.literal("")), cep: z.string().regex(cepRegex, "CEP inválido").optional().or(z.literal("")), contato_nome: z.string().optional(), contato_email: z.string().email("Email inválido").optional().or(z.literal("")), contato_telefone: z.string().regex(phoneRegex, "Telefone inválido").optional().or(z.literal("")), horario_entrega: z.string().optional(), restricoes_entrega: z.string().optional(), }
  ```
- **fornecedorSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { razao_social: z.string().min(3, "Razão social deve ter no mínimo 3 caracteres"), nome_fantasia: z.string().optional(), cnpj: cnpjSchema.optional().or(z.literal("")), endereco_completo: z.string().min(10, "Endereço deve ter no mínimo 10 caracteres"), cidade: z.string().optional(), estado: z.string().length(2, "UF deve ter 2 caracteres").optional().or(z.literal("")), cep: z.string().regex(cepRegex, "CEP inválido").optional().or(z.literal("")), contato_nome: z.string().optional(), contato_email: z.string().email("Email inválido").optional().or(z.literal("")), contato_telefone: z.string().regex(phoneRegex, "Telefone inválido").optional().or(z.literal("")), }
  ```
- **transportadoraSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"), cnpj: cnpjSchema.optional().or(z.literal("")), endereco: z.string().optional(), cidade: z.string().optional(), uf: z.string().length(2, "UF deve ter 2 caracteres").optional().or(z.literal("")), cep: z.string().regex(cepRegex, "CEP inválido").optional().or(z.literal("")), telefone: z.string().regex(phoneRegex, "Telefone inválido").optional().or(z.literal("")), email: z.string().email("Email inválido").optional().or(z.literal("")), website: z.string().url("URL inválida").optional().or(z.literal("")), prazo_medio_dias: z.number().min(0).optional(), avaliacao: z.number().min(0).max(5).optional(), ativa: z.boolean().default(true), }
  ```
- **coletaSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { fornecedor_id: z.string().uuid("Selecione um fornecedor"), endereco_coleta: z.string().min(10, "Endereço deve ter no mínimo 10 caracteres"), observacoes: z.string().optional(), tipo_coleta: z.enum(["lalamove", "transportadora"]), transportadora_id: z.string().uuid().optional(), }
  ```
- **entregaSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { cliente_id: z.string().uuid("Selecione um cliente").optional(), endereco_entrega: z.string().min(10, "Endereço deve ter no mínimo 10 caracteres"), transportadora_id: z.string().uuid().optional(), tipo_frete: z.enum(["cif", "fob", "cortesia"]), previsao_entrega: z.string().optional(), observacoes: z.string().optional(), }
  ```
- **ocorrenciaSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { tipo_ocorrencia: z.string().min(1, "Selecione um tipo"), descricao: z.string().optional(), acao_tomada: z.string().optional(), coleta_id: z.string().uuid().optional(), entrega_id: z.string().uuid().optional(), }
  ```
- **freteInternoSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { origem: z.string().min(3, "Origem deve ter no mínimo 3 caracteres"), destino: z.string().min(3, "Destino deve ter no mínimo 3 caracteres"), motorista: z.string().optional(), quantidade_itens: z.number().min(1, "Mínimo 1 item"), previsao_entrega: z.string().optional(), xp_reward: z.number().min(0).default(50), observacoes: z.string().optional(), }
  ```
- **addressSchema** (`src/lib/schemas/common.ts`, z.object):
  ```ts
  { cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'), logradouro: z.string().min(3), numero: z.string(), bairro: z.string(), cidade: z.string(), estado: z.string().length(2), }
  ```
- **carrierSchema** (`src/lib/schemas/common.ts`, z.object):
  ```ts
  { id: z.string().uuid().optional(), nome_fantasia: z.string().min(2), cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'), homologada: z.boolean().default(false), }
  ```
- **deliverySchema** (`src/lib/schemas/common.ts`, z.object):
  ```ts
  { id: z.string().uuid().optional(), status: z.enum(['pendente', 'coletado', 'despachado', 'em_transito', 'saiu_entrega', 'entregue', 'atrasado', 'cancelado']), valor_frete: z.number().nonnegative(), previsao_entrega: z.string().datetime().optional(), }
  ```
- **clienteCSVSchema** (`src/pages/Clientes.tsx`, z.object):
  ```ts
  { razao_social: z.string().min(1), nome_fantasia: z.string().optional().default(""), cnpj: z.string().optional().default(""), endereco_completo: z.string().min(1), cidade: z.string().optional().default(""), estado: z.string().optional().default(""), cep: z.string().optional().default(""), contato_nome: z.string().optional().default(""), contato_email: z.string().optional().default(""), contato_telefone: z.string().optional().default(""), }
  ```
- **entregaSchema** (`src/pages/ImportacaoMassa.tsx`, z.object):
  ```ts
  { numero_entrega: z.string().min(1, "Número obrigatório"), endereco_entrega: z.string().min(1, "Endereço obrigatório"), nf_remessa: z.string().optional(), valor_frete: z.coerce.number().optional(), previsao_entrega: z.string().optional(), observacoes: z.string().optional(), }
  ```
- **coletaSchema** (`src/pages/ImportacaoMassa.tsx`, z.object):
  ```ts
  { numero_coleta: z.string().min(1, "Número obrigatório"), endereco_coleta: z.string().min(1, "Endereço obrigatório"), contato_coleta: z.string().optional(), peso_estimado_kg: z.coerce.number().optional(), qtd_volumes: z.coerce.number().optional(), observacoes: z.string().optional(), }
  ```
- **fornecedorSchema** (`src/pages/ImportacaoMassa.tsx`, z.object):
  ```ts
  { razao_social: z.string().min(1, "Razão social obrigatória"), endereco_completo: z.string().min(1, "Endereço obrigatório"), cnpj: z.string().optional(), nome_fantasia: z.string().optional(), contato_nome: z.string().optional(), contato_email: z.string().email().optional().or(z.literal("")), contato_telefone: z.string().optional(), cidade: z.string().optional(), estado: z.string().optional(), cep: z.string().optional(), }
  ```
- **clienteSchema** (`src/pages/ImportacaoMassa.tsx`, z.object):
  ```ts
  { razao_social: z.string().min(1, "Razão social obrigatória"), endereco_completo: z.string().min(1, "Endereço obrigatório"), cnpj: z.string().optional(), nome_fantasia: z.string().optional(), contato_nome: z.string().optional(), contato_email: z.string().email().optional().or(z.literal("")), contato_telefone: z.string().optional(), cidade: z.string().optional(), estado: z.string().optional(), cep: z.string().optional(), }
  ```
- **resetSchema** (`src/pages/ResetPassword.tsx`, z.object, encadeia refine):
  ```ts
  { password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"), confirmPassword: z.string().min(6, "Confirme sua senha"), }
  ```
  - Regras cruzadas (refine): “As senhas não coincidem”
- **forgotPasswordSchema** (`src/pages/auth/AuthForgotPassword.tsx`, z.object):
  ```ts
  { email: z.string().email("Email inválido") }
  ```
- **loginSchema** (`src/pages/auth/authUtils.ts`, z.object):
  ```ts
  { email: z.string().email("Email inválido"), password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"), }
  ```
- **addressSchema** (`supabase/functions/_shared/schemas/common.ts`, z.object):
  ```ts
  { cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'), logradouro: z.string().min(3), numero: z.string(), bairro: z.string(), cidade: z.string(), estado: z.string().length(2), }
  ```
- **carrierSchema** (`supabase/functions/_shared/schemas/common.ts`, z.object):
  ```ts
  { id: z.string().uuid().optional(), nome_fantasia: z.string().min(2), cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'), homologada: z.boolean().default(false), }
  ```
- **deliverySchema** (`supabase/functions/_shared/schemas/common.ts`, z.object):
  ```ts
  { id: z.string().uuid().optional(), status: z.enum(['pendente', 'coletado', 'despachado', 'em_transito', 'saiu_entrega', 'entregue', 'atrasado', 'cancelado']), valor_frete: z.number().nonnegative(), previsao_entrega: z.string().datetime().optional(), }
  ```

### F.2 react-hook-form (register/rules)

| Campo | Regras | Arquivo |
|---|---|---|
| `numero_coleta` | `required: true` | `src/components/coletas/PickupDialog.tsx` |
| `endereco_coleta` | `required: true` | `src/components/coletas/PickupDialog.tsx` |

### F.3 Restrições em inputs HTML (required/min/max/pattern)

| Campo | Restrições | Arquivo |
|---|---|---|
| `numero_coleta` | required | `src/components/coletas/PickupDialog.tsx` |
| `endereco_coleta` | required | `src/components/coletas/PickupDialog.tsx` |
| `data_prevista_coleta` | type=date | `src/components/coletas/PickupDialog.tsx` |
| `qtd_volumes` | type=number | `src/components/coletas/PickupDialog.tsx` |
| `peso_estimado_kg` | type=number, step=0.01 | `src/components/coletas/PickupDialog.tsx` |
| `observacoes` | min | `src/components/coletas/PickupDialog.tsx` |
| `csv-upload` | accept=.csv,.xlsx,.xls, disabled=isImporting | `src/components/common/CSVImporter.tsx` |
| `volumes` | type=number | `src/components/freight/ScenarioSimulator.tsx` |
| `target-input` | type=number, min=0, max=100 | `src/components/predictions/PredictionAccuracyTimeline.tsx` |
| `days-input` | type=number, min=1, max=30 | `src/components/predictions/PredictionAccuracyTimeline.tsx` |
| `slo-uptime` | type=number, min=50, max=100, step=0.1, disabled=!canEdit \|\| saveTarget.isPending | `src/components/rodonaves/RTEGatewaySLOPanel.tsx` |
| `slo-latency` | type=number, min=50, max=120000, step=50, disabled=!canEdit \|\| saveTarget.isPending | `src/components/rodonaves/RTEGatewaySLOPanel.tsx` |
| `code` | pattern=[0-9]*, max | `src/components/security/MFAEnroll.tsx` |
| `mfa-code` | pattern=[0-9]*, max | `src/components/security/MFAVerify.tsx` |
| `csv-upload` | accept=.csv | `src/components/transportadoras/BulkRouteImport.tsx` |
| `password` | type=password | `src/pages/ResetPassword.tsx` |
| `confirmPassword` | type=password | `src/pages/ResetPassword.tsx` |
| `forgot-email` | type=email | `src/pages/auth/AuthForgotPassword.tsx` |
| `login-email` | type=email | `src/pages/auth/AuthFormPanel.tsx` |
| `signup-email` | type=email | `src/pages/auth/AuthFormPanel.tsx` |

## G. Fórmulas e derivações (como valores são calculados)

### G.1 Colunas calculadas no banco

| Tabela | Coluna | Expressão |
|---|---|---|
| `mitigation_actions` | `otif_delta` | `COALESCE(otif_after,0) - COALESCE(otif_before,0)` |

### G.2 Views (consultas derivadas)

| View | SELECT |
|---|---|
| `internal.mv_dashboard_metrics` | `SELECT 1 AS singleton, (SELECT count(*) FROM public.coletas) AS total_coletas, (SELECT count(*) FROM public.coletas WHERE status IN ('aguardando_liberacao','solicitada')) AS coletas_pendentes, (SELECT count(*) FROM public.coletas WHERE status = 'em_transito') AS coletas_em_transito, (SELECT count(*) …` |
| `internal.mv_carrier_performance` | `SELECT t.id AS transportadora_id, t.nome_fantasia, count(e.id) AS total_entregas, count(e.id) FILTER (WHERE e.data_entrega_efetiva <= e.previsao_entrega) AS entregas_no_prazo, CASE WHEN count(e.id) > 0 THEN (count(e.id) FILTER (WHERE e.data_entrega_efetiva <= e.previsao_entrega))::numeric / count(e. …` |
| `v_prediction_accuracy` | `SELECT date_trunc('day', predicted_at)::date AS dia, risco, COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas, COUNT(*) FILTER (WHERE was_accurate = true) AS total_acertos, ROUND( (COUNT(*) FILTER (WHERE was_accurate = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE confirmed_at I …` |
| `v_prediction_accuracy_by_carrier` | `SELECT COALESCE(transportadora, 'Sem transportadora') AS transportadora, risco, COUNT(*) AS total_predicoes, COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas, COUNT(*) FILTER (WHERE was_accurate = true) AS total_acertos, ROUND( 100.0 * COUNT(*) FILTER (WHERE was_accurate = true) …` |
| `v_prediction_accuracy_daily` | `SELECT DATE_TRUNC('day', predicted_at)::date AS dia, COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas, COUNT(*) FILTER (WHERE was_accurate = true) AS acertos, ROUND( 100.0 * COUNT(*) FILTER (WHERE was_accurate = true) / NULLIF(COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL), 0) …` |
| `v_prediction_accuracy_daily_carrier` | `SELECT DATE_TRUNC('day', predicted_at)::date AS dia, COALESCE(NULLIF(transportadora, ''), 'Sem transportadora') AS transportadora, COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas, COUNT(*) FILTER (WHERE was_accurate = true) AS acertos, ROUND( 100.0 * COUNT(*) FILTER (WHERE was_ …` |

### G.3 Funções de cálculo/decisão no código

- **generateManifestoPDF()** — `src/components/coletas/PickupDetailsDialog.tsx`
  ```
  playSuccess(); const doc = new jsPDF(); // Header doc.setFillColor(31, 41, 55); doc.rect(0, 0, 210, 40, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("MANIFESTO DE COLETA NEXUS", 20, 25); doc.setFontSize(10); doc.text(`ID DO PROTOCOLO: ${pickup.numero_coleta}`, 20, 33); // Body doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.text("DADOS DA OPERAÇÃO", 20, 55); autoTable(doc, { startY: 60, head: [['Campo', 'Informação']], body: [ ['Fornecedor', pickup.fornecedores?.nome_ …
  ```
- **formatCurrency(value: number)** — `src/components/freight/SmartCarrierSelector.tsx`
  ```
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", }).format(value);
  ```
- **validateReverseForm()** — `src/components/melhorenvio/MECarrinhoPanel.tsx`
  ```
  const errors: Record<string, string> = {}; if (!reverseForm.service.trim()) errors["service"] = "ID do serviço é obrigatório"; if (!reverseForm.from_name.trim()) errors["from_name"] = "Nome é obrigatório"; if (!reverseForm.from_postal_code.replace(/\D/g, "").trim()) errors["from_postal_code"] = "CEP é obrigatório"; if (!reverseForm.from_address.trim()) errors["from_address"] = "Endereço é obrigatório"; if (!reverseForm.from_number.trim()) errors["from_number"] = "Número é obrigatório"; if (!reve …
  ```
- **validateAddressForm(form: AddressFormValues, prefix: "sender" | "to", opts: { requirePostalCode?: boolean } = {},)** — `src/components/melhorenvio/MECartValidation.ts`
  ```
  const errors: Record<string, string> = {}; collectRequiredErrors(form, prefix, errors); collectOptionalFormatErrors(form, prefix, errors); if (opts.requirePostalCode && !(form.postal_code ?? "").trim()) { errors[`${prefix}_postal_code`] = "CEP é obrigatório"; } return errors;
  ```
- **validateCartForms(sender: AddressFormValues, receiver: AddressFormValues,)** — `src/components/melhorenvio/MECartValidation.ts`
  ```
  return { ...validateAddressForm(sender, "sender"), ...validateAddressForm(receiver, "to", { requirePostalCode: true }), };
  ```
- **scoreColor(score: number)** — `src/features/db-observability/components/GlobalHealthScoreCard.tsx`
  ```
  if (score >= 90) return "text-emerald-600"; if (score >= 75) return "text-sky-600"; if (score >= 60) return "text-amber-600"; return "text-destructive";
  ```
- **ScoreMetric({ icon, label, value, weight, detail, }: { icon: React.ReactNode; label: string; value: number; weight: number; detail?:)** — `src/features/db-observability/components/GlobalHealthScoreCard.tsx`
  ```
  return ( <div className="rounded-lg border bg-card p-3 space-y-1"> <div className="flex items-center justify-between text-xs text-muted-foreground"> <span className="flex items-center gap-1">{icon} {label}</span> <span className="text-[10px]">peso {weight}%</span> </div> <div className={`text-2xl font-semibold ${scoreColor(value)}`}> {Number(value).toFixed(1)} </div> {detail && <p className="text-xs text-muted-foreground">{detail}</p>} </div> );
  ```
- **generateChallenge()** — `src/hooks/auth/useWebAuthn.tsx`
  ```
  const array = new Uint8Array(32); crypto.getRandomValues(array); return base64URLEncode(array.buffer);
  ```
- **validateMagicBytes(file: File)** — `src/hooks/data/useDocumentUpload.ts`
  ```
  const header = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onloadend = (e) => { const arr = (new Uint8Array(e.target?.result as ArrayBuffer)).subarray(0, 4); let header = ""; for (let i = 0; i < arr.length; i++) { header += arr[i].toString(16); } resolve(header.toUpperCase()); }; reader.readAsArrayBuffer(file.slice(0, 4)); }); // Signatures: PDF: 25504446, PNG: 89504E47, JPEG: FFD8FF, WEBP: 52494646 const signatures: Record<string, string[]> = { "application/ …
  ```
- **calculateLevel(xp: number)** — `src/hooks/gamification/useGamification.tsx`
  ```
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  ```
- **calculateLevelProgress(totalXP: number)** — `src/hooks/gamification/useGamification.tsx`
  ```
  currentLevel: number; currentLevelXP: number; nextLevelXP: number; progress: number;
  ```
- **calculateQuotations(request: QuotationRequest & { event_type?: string })** — `src/hooks/logistics/useFreightQuotation.tsx`
  ```
  if (!tabelasFrete || tabelasFrete.length === 0) return []; // Fetch selection rules for specific event type if provided const { data: selectionRules } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { eq: (k: string, v: boolean) => { maybeSingle: () => Promise<{ data: { price_weight?: string; time_weight?: string; max_sla_days?: number } | null }>; }; }; }; }; }) .from('freight_selection_rules') .select('*') .eq('event_type', reques …
  ```
- **calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number)** — `src/hooks/logistics/useLalamoveTracking.tsx`
  ```
  const R = 6371e3; // Earth radius in meters const φ1 = (lat1 * Math.PI) / 180; const φ2 = (lat2 * Math.PI) / 180; const Δφ = ((lat2 - lat1) * Math.PI) / 180; const Δλ = ((lng2 - lng1) * Math.PI) / 180; const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c; // Distance in meters
  ```
- **calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number)** — `src/hooks/logistics/useTrackingAnalytics.tsx`
  ```
  const R = 6371; // Earth radius in km const φ1 = (lat1 * Math.PI) / 180; const φ2 = (lat2 * Math.PI) / 180; const Δφ = ((lat2 - lat1) * Math.PI) / 180; const Δλ = ((lng2 - lng1) * Math.PI) / 180; const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c;
  ```
- **calcDiasAtraso(previsao: string | null, status: string)** — `src/hooks/logistics/useUnifiedTracking.tsx`
  ```
  if (!previsao || ["entregue", "finalizado", "cancelado"].includes(status)) return 0; const diff = Math.ceil( (Date.now() - new Date(previsao).getTime()) / (1000 * 60 * 60 * 24), ); return Math.max(0, diff);
  ```
- **numeroValido(bruto: string | undefined, min: number, max: number)** — `src/lib/centroDistribuicao.ts`
  ```
  if (bruto === undefined || bruto === null) return null; const texto = String(bruto).trim(); if (texto === "") return null; const valor = Number(texto); if (!Number.isFinite(valor)) return null; if (valor < min || valor > max) return null; return valor;
  ```
- **generateCSVTemplate(columns: { key: string; label: string; example?: string }[],)** — `src/lib/csvImporter.ts`
  ```
  const headers = columns.map((c) => c.label).join(","); const examples = columns.map((c) => c.example || "").join(","); return `${headers}\n${examples}`;
  ```
- **formatCurrency(value: NumberInput)** — `src/lib/formatters.ts`
  ```
  if (value === null || value === undefined) return "-"; return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", }).format(value);
  ```
- **gerarInsightsFrete(fonte: FonteInsights)** — `src/lib/freightForecast.ts`
  ```
  return [ insightTendencia(fonte.variacaoProjetada), insightAbusivos(fonte.abusivos), insightConsolidacao(fonte.consolidacao), insightTransportadora(fonte.melhorTransportadora), ].filter((i): i is InsightFrete => i !== null);
  ```
- **limparValorEnv(bruto: string | undefined | null)** — `src/lib/supabaseEnv.ts`
  ```
  if (bruto === undefined || bruto === null) return ""; let texto = String(bruto).trim(); // remove aspas simples ou duplas que envolvem o valor inteiro while ( texto.length >= 2 && ((texto.startsWith('"') && texto.endsWith('"')) || (texto.startsWith("'") && texto.endsWith("'"))) ) { texto = texto.slice(1, -1).trim(); } // barra final quebra a montagem de `${URL}/functions/v1/...` while (texto.endsWith("/")) { texto = texto.slice(0, -1); } return texto;
  ```
- **validateCNPJDigits(cnpj: string)** — `src/lib/validations.ts`
  ```
  const numbers = cnpj.replace(/\D/g, ""); if (numbers.length !== 14) return false; // Check for known invalid patterns if (/^(\d)\1+$/.test(numbers)) return false; // Calculate first check digit let sum = 0; let weight = 5; for (let i = 0; i < 12; i++) { sum += parseInt(numbers[i]) * weight; weight = weight === 2 ? 9 : weight - 1; } let remainder = sum % 11; const digit1 = remainder < 2 ? 0 : 11 - remainder; if (parseInt(numbers[12]) !== digit1) return false; // Calculate second check digit sum = …
  ```
- **computeROI(records: readonly MitigationRecord[])** — `src/lib/predictions/mitigationROI.ts`
  ```
  const map = new Map<RootCauseCategory, MitigationRecord[]>(); for (const r of records) { if (r.status !== "concluida") continue; if (r.otif_delta == null || !Number.isFinite(r.otif_delta)) continue; const list = map.get(r.category) ?? []; list.push(r); map.set(r.category, list); } const byCategory: CategoryROI[] = []; let totalDelta = 0; let totalMeasured = 0; for (const [category, list] of map.entries()) { const deltas = list.map((r) => r.otif_delta as number); const sum = deltas.reduce((a, b) …
  ```
- **scoreImpact(bucket: CategoryBucket, maxCount: number, maxHours: number)** — `src/lib/predictions/mitigationRecommender.ts`
  ```
  const safeMaxCount = Math.max(1, maxCount); const safeMaxHours = Math.max(1, maxHours); const freq = bucket.count / safeMaxCount; const sev = bucket.totalDelayHours / safeMaxHours; const score = freq * 0.7 + sev * 0.3; return Math.round(Math.min(1, Math.max(0, score)) * 100);
  ```
- **rerankByROI(suggestions: readonly MitigationSuggestion[], roi: ROIReport | null | undefined,)** — `src/lib/predictions/mitigationRecommender.ts`
  ```
  const roiByCategory = new Map<RootCauseCategory, { avgDelta: number; measured: number }>(); if (roi) { for (const c of roi.byCategory) { roiByCategory.set(c.category, { avgDelta: c.avgDelta, measured: c.measuredActions }); } } const ranked: RankedMitigation[] = suggestions.map((s) => { const hist = roiByCategory.get(s.category); let adjustment = 0; if (hist && hist.measured > 0 && Number.isFinite(hist.avgDelta)) { // Clamp delta em [-10, +10] pts OTIF → escala p/ [-30, +30] const clamped = Math. …
  ```
- **computeDrift(points: LatencyTrendPoint[])** — `src/lib/rodonaves/latencyTrend.ts`
  ```
  if (points.length < 2) return 0; const half = Math.floor(points.length / 2); const first = points.slice(0, half); const second = points.slice(half); const mean = (list: LatencyTrendPoint[]) => list.reduce((sum, p) => sum + p.avgLatencyMs, 0) / list.length; const before = mean(first); const after = mean(second); if (before <= 0) return after > 0 ? 100 : 0; return ((after - before) / before) * 100;
  ```
- **applyAlerts(previous: AlertState[], alerts: SLOAlert[],)** — `src/lib/rodonaves/sloAlerts.ts`
  ```
  const map = new Map<string, AlertState>(); for (const state of previous) { if (state?.gateway) map.set(state.gateway, state); } for (const alert of alerts) { map.set(alert.gateway, { gateway: alert.gateway, severity: alert.severity, firedAt: alert.firedAt, }); } return Array.from(map.values()).sort((a, b) => a.gateway.localeCompare(b.gateway), );
  ```
- **FretesInternos()** — `src/pages/FretesInternos.tsx`
  ```
  const qc = useQueryClient(); const [isCreateOpen, setIsCreateOpen] = useState(false); const [isEditOpen, setIsEditOpen] = useState(false); const [isViewOpen, setIsViewOpen] = useState(false); const [isDeleteOpen, setIsDeleteOpen] = useState(false); const [selected, setSelected] = useState<FreteInterno | null>(null); const [form, setForm] = useState(emptyForm); const { data: fretes = [], isLoading, error, } = useQuery({ queryKey: ["fretes-internos"], queryFn: async () => { const { data, error } = …
  ```
- **Ranking()** — `src/pages/Ranking.tsx`
  ```
  const { user } = useAuth(); useGamification(); const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("all"); const [levelFilter, setLevelFilter] = useState(""); const { data: leaderboard = [], isLoading, refetch, } = useQuery({ queryKey: ["leaderboard", period], queryFn: async () => { const { data, error } = await supabase .from("user_levels") .select( ` user_id, total_xp, level, streak_days, coins, profiles:user_id(full_name, avatar_url), rank_display:user_ranks(*) `, ) .order("tot …
  ```
- **generatePDF()** — `src/pages/RelatorioPDF.tsx`
  ```
  setGenerating(true); try { const { jsPDF: JsPDF, autoTable: autoTableFn } = await loadPdfLibs(); const doc = new JsPDF(); const { start, end } = getDateRange(); const periodoLabel = `${format(start, "dd/MM/yyyy")} a ${format(end, "dd/MM/yyyy")}`; // Header doc.setFontSize(20); doc.setTextColor(33, 33, 33); doc.text("LogiFlow — Relatório", 14, 22); doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text( `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 30, ); d …
  ```
- **generateEntregasReport(doc: PdfDoc, data: EntregaRow[], autoTableFn: AutoTableFn,)** — `src/pages/RelatorioPDF.tsx`
  ```
  doc.setFontSize(14); doc.text("Relatório de Entregas", 14, 50); const total = data.length; const entregues = data.filter( (e) => e.status === "entregue" || e.status === "finalizado", ).length; const emTransito = data.filter((e) => ["despachado", "em_transito", "saiu_entrega"].includes(e.status), ).length; const custoTotal = data.reduce((s, e) => s + (e.valor_frete || 0), 0); doc.setFontSize(10); doc.text( `Total: ${total} | Entregues: ${entregues} | Em Trânsito: ${emTransito} | Custo Total: R$ $ …
  ```
- **generateTransportadorasReport(doc: PdfDoc, data: EntregaRow[], autoTableFn: AutoTableFn,)** — `src/pages/RelatorioPDF.tsx`
  ```
  doc.setFontSize(14); doc.text("Performance de Transportadoras", 14, 50); const byTransp: Record< string, { name: string; total: number; entregues: number; custo: number } > = {}; data.forEach((e) => { const name = e.transportadora?.nome_fantasia || "Sem Transportadora"; if (!byTransp[name]) byTransp[name] = { name, total: 0, entregues: 0, custo: 0 }; byTransp[name].total++; if (e.status === "entregue" || e.status === "finalizado") byTransp[name].entregues++; byTransp[name].custo += e.valor_frete …
  ```
- **generateCustosReport(doc: PdfDoc, data: EntregaRow[], autoTableFn: AutoTableFn,)** — `src/pages/RelatorioPDF.tsx`
  ```
  doc.setFontSize(14); doc.text("Relatório de Custos Logísticos", 14, 50); const custoTotal = data.reduce((s, e) => s + (e.valor_frete || 0), 0); const comFrete = data.filter((e) => e.valor_frete && e.valor_frete > 0); const custoMedio = comFrete.length > 0 ? custoTotal / comFrete.length : 0; const maiorFrete = Math.max(...comFrete.map((e) => e.valor_frete || 0), 0); doc.setFontSize(10); doc.text( `Custo Total: R$ ${custoTotal.toFixed(2)} | Médio: R$ ${custoMedio.toFixed(2)} | Maior: R$ ${maiorFre …
  ```
- **generateSLAReport(doc: PdfDoc, data: EntregaRow[], autoTableFn: AutoTableFn,)** — `src/pages/RelatorioPDF.tsx`
  ```
  doc.setFontSize(14); doc.text("Relatório SLA / OTIF", 14, 50); const entregues = data.filter( (e) => e.status === "entregue" || e.status === "finalizado", ); const noPrazo = entregues.filter((e) => { if (!e.previsao_entrega || !e.data_entrega_efetiva) return false; return new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega); }); const otif = entregues.length > 0 ? (noPrazo.length / entregues.length) * 100 : 0; doc.setFontSize(10); doc.text( `OTIF: ${otif.toFixed(1)}% | No Prazo: ${no …
  ```
- **generateAuditoriaReport(doc: PdfDoc, data: EntregaRow[], autoTableFn: AutoTableFn,)** — `src/pages/RelatorioPDF.tsx`
  ```
  doc.setFontSize(14); doc.text("Relatório de Auditoria Diária (Compliance)", 14, 50); const isAtrasado = (e: EntregaRow) => { if (!e.previsao_entrega) return false; return ( new Date(e.previsao_entrega) < new Date() && !["entregue", "finalizado"].includes(e.status) ); }; const ocorrencias = data.filter((e) => e.status === "ocorrencia"); const atrasados = data.filter(isAtrasado); const semTransportadora = data.filter((e) => !e.transportadora_id); doc.setFontSize(10); doc.text( `Alertas Críticos: $ …
  ```
- **invalidate()** — `src/pages/Transportadoras.tsx`
  ```
  
  ```
- **validateLoginIP(email: string, ipAddress: string | null)** — `src/pages/auth/authUtils.ts`
  ```
  try { const { data, error } = await supabase.functions.invoke("validate-login", { body: { email, ip_address: ipAddress, user_agent: navigator.userAgent }, }); if (error) return { allowed: true }; return data as ValidateLoginResult; } catch { return { allowed: true }; }
  ```
- **RankingPodium({ top3 }: RankingPodiumProps)** — `src/pages/ranking/RankingPodium.tsx`
  ```
  if (top3.length === 0) return null; return ( <motion.div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-background to-muted/20 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} > <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-warning/10 blur-3xl rounded-full" /> <div className="relative flex items-end justify-center gap-4 pt-4 pb-2"> {[1, 0, 2].map((pos) => { const user = top3[pos]; if (!user) return null; const Icon = podiumIcons[pos]; r …
  ```
- **hapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'light')** — `src/utils/haptics.ts`
  ```
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) { const patterns = { light: 10, medium: 20, heavy: 40 }; navigator.vibrate(patterns[intensity]); }
  ```
- **validateContract(supabaseClient: any, entityName: string, payload: any, validator: (payload: any)** — `supabase/functions/_shared/contract-validator.ts`
  ```
  void
  ```
- **validateUUID(uuid: string)** — `supabase/functions/_shared/security.ts`
  ```
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i; return regex.test(uuid);
  ```
- **validationErrorResponse(err: ValidationError, corsHeaders: Record<string, string>)** — `supabase/functions/_shared/validate.ts`
  ```
  return new Response( JSON.stringify({ error: "Validation error", field: err.field, message: err.message }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } } );
  ```
- **generateSignature(method: string, path: string, timestamp: string, body: string = '')** — `supabase/functions/lalamove-api/index.ts`
  ```
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}` const encoder = new TextEncoder() const key = await crypto.subtle.importKey( 'raw', encoder.encode(LALAMOVE_API_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'] ) const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawSignature)) return btoa(String.fromCharCode(...new Uint8Array(signature)))
  ```
- **generateSignature(secret: string, timestamp: string, method: string, path: string, body: string = "",)** — `supabase/functions/lalamove-tracking/index.ts`
  ```
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`; const encoder = new TextEncoder(); const keyData = encoder.encode(secret); const messageData = encoder.encode(rawSignature); const key = await crypto.subtle.importKey( "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"], ); const signature = await crypto.subtle.sign("HMAC", key, messageData); // Convert to hex string return Array.from(new Uint8Array(signature)) .map((b) => b.toString(16).padStart(2, "0")) …
  ```
- **generateQuotation(p: Record<string, unknown>)** — `supabase/functions/rodonaves-api/index.ts`
  ```
  return apiMutate(QUOTATION_GATEWAY, "POST", "/api/v1/gera-cotacao", p.body);
  ```
- **generateFirstQuotation(p: Record<string, unknown>)** — `supabase/functions/rodonaves-api/index.ts`
  ```
  return apiMutate(QUOTATION_GATEWAY, "POST", "/api/v1/gera-primeira-cotacao", p.body);
  ```
- **generateDigitalCarrierQuotation(p: Record<string, unknown>)** — `supabase/functions/rodonaves-api/index.ts`
  ```
  return apiMutate(QUOTATION_GATEWAY, "POST", "/api/v1/gera-cotacao-transp-digital", p.body);
  ```
- **generateAutomaticPickup(p: Record<string, unknown>)** — `supabase/functions/rodonaves-api/index.ts`
  ```
  return apiMutate(PICKUP_GATEWAY, "POST", "/webapi/automaticpickup/generateautomaticpickup", p.body);
  ```
- **validateCustomerForQuotation(p: Record<string, unknown>)** — `supabase/functions/rodonaves-api/index.ts`
  ```
  return apiGet(SELFATTENDANCE_GATEWAY, "/webapi/customer/byvalidquotation", { TaxId: p.taxId as string, Origin: p.origin as string, });
  ```
- **generateReportData(supabase: any, reportType: string, filters: any)** — `supabase/functions/scheduled-reports/index.ts`
  ```
  const now = new Date(); const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); switch (reportType) { case 'entregas': { const { data } = await supabase .from('entregas') .select('*, transportadora:transportadoras(nome_fantasia), cliente:clientes(nome_fantasia)') .gte('created_at', startOfMonth.toISOString()) .order('created_at', { ascending: false }); const deliveries = data || []; const total = deliveries.length; const entregues = deliveries.filter((e: any) => e.status === 'entreg …
  ```

### G.4 Percentuais e multiplicadores no código

| Trecho | Arquivo |
|---|---|
| `delay: i * 0.3,` | `src/components/achievements/AchievementNotification.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/box/BoxGrid.tsx` |
| `// Variação de peso superior a 5% ou absoluta > 2kg` | `src/components/coletas/PickupConference.tsx` |
| `pesoVariacao > pesoEsperado * 0.05 \|\|` | `src/components/coletas/PickupConference.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/coletas/PickupDetailsDialog.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/common/ActivityTimeline.tsx` |
| `delay: index * 0.1,` | `src/components/dashboard/AlertsPanel.tsx` |
| `delay: idx * 0.05,` | `src/components/dashboard/FavoriteMetricsBar.tsx` |
| `transition={{ duration: 1.5, delay: idx * 0.1 }}` | `src/components/dashboard/FavoriteMetricsBar.tsx` |
| `value: `R$ ${(costSummary?.total_spent ? costSummary.total_spent * 0.05 : 0).toLocaleString("pt-BR")}`,` | `src/components/dashboard/FavoriteMetricsBar.tsx` |
| `<span>0%</span>` | `src/components/dashboard/IntelligentLogisticsWidget.tsx` |
| `<span>100%</span>` | `src/components/dashboard/IntelligentLogisticsWidget.tsx` |
| `transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}` | `src/components/dashboard/IntelligentLogisticsWidget.tsx` |
| `94.2%` | `src/components/dashboard/LogisticsMapWidget.tsx` |
| `98.8%` | `src/components/dashboard/LogisticsMapWidget.tsx` |
| `↑ 2.4% vs ontem` | `src/components/dashboard/LogisticsMapWidget.tsx` |
| `transition={{ delay: index * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}` | `src/components/dashboard/QuickActions.tsx` |
| `delay: index * 0.1,` | `src/components/dashboard/TransportadoraRanking.tsx` |
| `<span>0% Estabilidade</span>` | `src/components/dashboard/XPProgressBar.tsx` |
| `<span>100% Evolução</span>` | `src/components/dashboard/XPProgressBar.tsx` |
| `({carrierName}) está 12% abaixo da sua média mensal para este` | `src/components/freight/NegotiationAssistant.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/freight/QuotationResults.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/freight/SmartCarrierSelector.tsx` |
| `// usually resulting in ~20% lower cost for consolidated volume` | `src/components/freight/StrategySimulator.tsx` |
| `const consolidatedRate = standardRate * 0.75; // 25% discount for consolidated` | `src/components/freight/StrategySimulator.tsx` |
| `y += Math.max(lines.length * 0.45, 0.5);` | `src/components/labels/MaterialLabelPrinter.tsx` |
| `delay: i * 0.05` | `src/components/layout/MobileQuickActions.tsx` |
| `animationDelay: `${i * 0.1}s`,` | `src/components/layout/SystemPulse.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/map/AnomalyList.tsx` |
| `transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}` | `src/components/map/CinematicHUD.tsx` |
| `const midLat = originMarker.lat + latDiff / 2 + dist * 0.15;` | `src/components/map/MapboxMap.tsx` |
| `const outerRadius = (size / 2) * 0.7 * t + radius;` | `src/components/map/MapboxMap.tsx` |
| `const radius = (size / 2) * 0.3;` | `src/components/map/MapboxMap.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/onboarding/OnboardingChecklist.tsx` |
| `Todas as tabelas monitoradas estão com cache-hit ≥ 99%.` | `src/features/db-observability/components/CacheHitRatioCard.tsx` |
| `Queries com tempo médio {'>'} 50% acima do baseline diário.` | `src/features/db-observability/components/RegressionsCard.tsx` |
| `? Math.floor(data.coletasPendentes * 0.1)` | `src/hooks/analytics/useDashboardMetrics.tsx` |
| `// Abusive freight detection (>20% above state average)` | `src/hooks/logistics/useFreightIntelligence.tsx` |
| `// Estimate 30% savings from consolidation` | `src/hooks/logistics/useFreightIntelligence.tsx` |
| `const potentialSavings = totalCost * 0.3;` | `src/hooks/logistics/useFreightIntelligence.tsx` |
| `// Logic: (Price * Wp) + (Time * Wt) + (Performance * 0.1)` | `src/hooks/logistics/useFreightQuotation.tsx` |
| `const compositeScore = (normalizedPrice * priceWeight) + (normalizedTime * timeWeight) + (normalizedScore * 0.1);` | `src/hooks/logistics/useFreightQuotation.tsx` |
| `const roiScore = Math.round(normalized * 0.6 + successRate * 0.4);` | `src/lib/predictions/mitigationROI.ts` |
| `const score = freq * 0.7 + sev * 0.3;` | `src/lib/predictions/mitigationRecommender.ts` |
| `* Com meta 100% (budget zero), qualquer downtime consome 100% do orçamento.` | `src/lib/rodonaves/gatewaySLO.ts` |
| `/** Percentual de piora que caracteriza degradação. Padrão: 25%. */` | `src/lib/rodonaves/latencyTrend.ts` |
| `transition={{ delay: i * 0.02 }}` | `src/pages/CentralRastreamento.tsx` |
| `+12%` | `src/pages/Coletas.tsx` |
| `-5% REDUÇÃO` | `src/pages/Coletas.tsx` |
| `Conciliados 100%` | `src/pages/ConciliacaoAutomatica.tsx` |
| `const tolerancia = item.valor * 0.02; // 2% tolerance` | `src/pages/ConciliacaoAutomatica.tsx` |
| `94.8% OPTIMIZED` | `src/pages/ConfiguracoesFrete.tsx` |
| `transition={{ delay: i * 0.03 }}` | `src/pages/Conquistas.tsx` |
| `Bitrix24 para encontrar discrepâncias de até 50%.` | `src/pages/CotacaoFrete.tsx` |
| `// Weight: 70% Price, 30% Deadline` | `src/pages/CotacaoMultiCanal.tsx` |
| `Perf: 10%` | `src/pages/CotacaoMultiCanal.tsx` |
| `Prazo: 20%` | `src/pages/CotacaoMultiCanal.tsx` |
| `Preço: 70%` | `src/pages/CotacaoMultiCanal.tsx` |
| `a.valor! * 0.7 + (a.prazo_dias \|\| 0) * 50 * 0.3;` | `src/pages/CotacaoMultiCanal.tsx` |
| `b.valor! * 0.7 + (b.prazo_dias \|\| 0) * 50 * 0.3;` | `src/pages/CotacaoMultiCanal.tsx` |
| `Rodonaves para economia de 12%.` | `src/pages/DashboardExecutivo.tsx` |
| `+40%.` | `src/pages/InteligenciaFrete.tsx` |
| `Custo superior a 20% da média histórica` | `src/pages/InteligenciaFrete.tsx` |
| `~30% com consolidação` | `src/pages/InteligenciaFrete.tsx` |
| `transition={{ delay: colIdx * 0.1 }}` | `src/pages/KanbanEntregas.tsx` |
| `delay: i * 0.5,` | `src/pages/NotFound.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/pages/PainelOTIF.tsx` |
| `transition={{ delay: i * 0.03 }}` | `src/pages/Ranking.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/pages/Ranking.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/pages/RastreamentoRealTime.tsx` |
| `<span>Meta: 95%</span>` | `src/pages/SLADashboard.tsx` |
| `<Floating key={i} duration={3 + i * 0.4} distance={30 + i * 5}>` | `src/pages/auth/AuthHeroSection.tsx` |
| `transition={{ delay: 0.4 + i * 0.1 }}` | `src/pages/auth/AuthHeroSection.tsx` |
| `transition={{ delay: 0.8 + index * 0.15 }}` | `src/pages/auth/AuthHeroSection.tsx` |
| `transition={{ delay: 1.5 + i * 0.1 }}` | `src/pages/auth/AuthHeroSection.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/pages/auth/AuthHeroSection.tsx` |
| `transition={{ delay: i * 0.1, type: "spring" }}` | `src/pages/auth/AuthHeroSection.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/pages/cotacao-multicanal/CotacaoCarrierList.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/pages/dashboard-cotacoes/TrechoComparativo.tsx` |
| `gainNode.gain.linearRampToValueAtTime(adjustedVolume * 0.7, startTime + attack + decay);` | `src/utils/celebrationSounds.ts` |
| `playNote(880 * (1 + i * 0.15), now + i * 0.1, 0.15, 0.2, 'triangle');` | `src/utils/celebrationSounds.ts` |
| `playNote(freq, now + i * 0.08, 0.15, 0.15 + i * 0.02, 'triangle');` | `src/utils/celebrationSounds.ts` |
| `playNote(freq, startTime + i * 0.01, duration, volume);` | `src/utils/celebrationSounds.ts` |

## H. Parâmetros de negócio (constantes, prazos, limites)

### H.1 Constantes

| Constante | Valor | Arquivo |
|---|---|---|
| `ALL` | `"__all__"` | `src/components/predictions/PredictionAccuracyTimeline.tsx` |
| `BULK_BATCH_SIZE` | `200` | `src/components/transportadoras/BulkRouteImport.tsx` |
| `SIDEBAR_COOKIE_MAX_AGE` | `60 * 60 * 24 * 7` | `src/components/ui/sidebar.tsx` |
| `SIDEBAR_WIDTH` | `"16rem"` | `src/components/ui/sidebar.tsx` |
| `SIDEBAR_WIDTH_MOBILE` | `"18rem"` | `src/components/ui/sidebar.tsx` |
| `SESSION_DURATION_HOURS` | `24` | `src/hooks/auth/useSessionTimeout.ts` |
| `SESSION_WARNING_MINUTES` | `5` | `src/hooks/auth/useSessionTimeout.ts` |
| `SESSION_CHECK_INTERVAL_MS` | `60 * 1000` | `src/hooks/auth/useSessionTimeout.ts` |
| `MAX_RECENT` | `12` | `src/hooks/common/useNavigationHistory.tsx` |
| `MAX_CACHE_SIZE` | `50` | `src/hooks/data/useRealtime.tsx` |
| `TOTAL_BOXES` | `16` | `src/hooks/logistics/useBoxManagement.tsx` |
| `CACHE_TTL` | `1000 * 60 * 5` | `src/hooks/logistics/useDelayPrediction.tsx` |
| `JANELA_DIAS` | `30` | `src/hooks/logistics/useMapIntelligence.ts` |
| `PONTOS_TENDENCIA` | `10` | `src/hooks/logistics/useMapIntelligence.ts` |
| `DIA_MS` | `86_400_000` | `src/hooks/logistics/useMapIntelligence.ts` |
| `CACHE_TTL` | `1000 * 60 * 10` | `src/hooks/logistics/useSmartCarrierSelection.tsx` |
| `STOP_THRESHOLD_METERS` | `50` | `src/hooks/logistics/useTrackingAnalytics.tsx` |
| `STOP_TIME_THRESHOLD_SECONDS` | `120` | `src/hooks/logistics/useTrackingAnalytics.tsx` |
| `GLOBAL_SLO_GATEWAY` | `"*"` | `src/hooks/rodonaves/useSLOTargets.ts` |
| `MOBILE_BREAKPOINT` | `768` | `src/hooks/ui/use-mobile.tsx` |
| `TOAST_LIMIT` | `1` | `src/hooks/ui/use-toast.ts` |
| `TOAST_REMOVE_DELAY` | `5000` | `src/hooks/ui/use-toast.ts` |
| `LAT_MIN` | `-90` | `src/lib/centroDistribuicao.ts` |
| `LAT_MAX` | `90` | `src/lib/centroDistribuicao.ts` |
| `LNG_MIN` | `-180` | `src/lib/centroDistribuicao.ts` |
| `LNG_MAX` | `180` | `src/lib/centroDistribuicao.ts` |
| `MESES_HISTORICO` | `6` | `src/lib/freightForecast.ts` |
| `MESES_PROJECAO` | `3` | `src/lib/freightForecast.ts` |
| `MINIMO_MESES_REAIS` | `3` | `src/lib/freightForecast.ts` |
| `RAIO_DISPERSAO_GRAUS` | `0.3` | `src/lib/mapFallback.ts` |
| `MAX_SCENARIOS` | `20` | `src/lib/predictions/whatIfScenarios.ts` |
| `WHATIF_MAX_CAP` | `25` | `src/lib/predictions/whatIfSimulator.ts` |
| `DEFAULT_STALLED_HOURS` | `48` | `src/lib/rodonaves/freightHealth.ts` |
| `DEFAULT_COOLDOWN_MS` | `60 * 60 * 1000` | `src/lib/rodonaves/sloAlerts.ts` |
| `WINDOW_MS` | `24 * 60 * 60 * 1000` | `supabase/functions/accuracy-meta-monitor/index.ts` |
| `WINDOW_MS` | `24 * 60 * 60 * 1000` | `supabase/functions/accuracy-meta-monitor/simulator.ts` |
| `CRON_HOUR_UTC` | `8` | `supabase/functions/accuracy-meta-monitor/simulator.ts` |
| `CRON_MINUTE_UTC` | `15` | `supabase/functions/accuracy-meta-monitor/simulator.ts` |
| `WEEK_MS` | `7 * 24 * 60 * 60 * 1000` | `supabase/functions/accuracy-weekly-digest/digest.ts` |
| `CARRIER_ALL_LABEL` | `"Todas as transportadoras"` | `supabase/functions/accuracy-weekly-digest/digest.ts` |
| `RATE_LIMIT_WINDOW_MS` | `60 * 1000` | `supabase/functions/check-rate-limit/index.ts` |
| `MAX_REQUESTS_PER_WINDOW` | `100` | `supabase/functions/check-rate-limit/index.ts` |
| `BLOCK_DURATION_MS` | `15 * 60 * 1000` | `supabase/functions/check-rate-limit/index.ts` |
| `TRACKING_GATEWAY` | `"https://tracking-apigateway.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `QUOTATION_GATEWAY` | `"https://quotation-apigateway.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `DEADLINE_GATEWAY` | `"https://01wapi.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `PICKUP_GATEWAY` | `"https://pickup-apigateway.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `CUSTOMER_GATEWAY` | `"https://customer-apigateway.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `SELFATTENDANCE_GATEWAY` | `"https://01wapi.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `UNITTOCITY_GATEWAY` | `"https://unittocity-apigateway.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `PAYMENTS_GATEWAY` | `"https://payments-apigateway.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `DNE_GATEWAY` | `"https://dne-apigateway.rte.com.br"` | `supabase/functions/rodonaves-api/index.ts` |
| `DEFAULT_TIMEOUT` | `15_000` | `supabase/functions/rodonaves-api/index.ts` |

### H.2 Prazos, expirações e janelas de tempo

| Trecho | Arquivo |
|---|---|
| `gcTime: 5 * 60 * 1000,` | `src/App.tsx` |
| `window.setTimeout(hideSplash, 5000);` | `src/main.tsx` |
| `return 30 * 60 * 1000;` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `return 5 * 60 * 1000;` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `return 6 * 60 * 60 * 1000;` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `return 60 * 60 * 1000;` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/common/Breadcrumbs.tsx` |
| `setTimeout(() => { setResult(null); setProgress(0); }, 2000);` | `src/components/common/CSVImporter.tsx` |
| `(1000 * 60 * 60 * 24),` | `src/components/common/DateRangePicker.tsx` |
| `const lastMonth = subMonths(new Date(), 1);` | `src/components/common/DateRangePicker.tsx` |
| `const lastWeekEnd = endOfWeek(subDays(new Date(), 7), { locale: ptBR });` | `src/components/common/DateRangePicker.tsx` |
| `const lastWeekStart = startOfWeek(subDays(new Date(), 7), { locale: ptBR });` | `src/components/common/DateRangePicker.tsx` |
| `const start = subDays(end, 13);` | `src/components/common/DateRangePicker.tsx` |
| `const start = subDays(end, 29);` | `src/components/common/DateRangePicker.tsx` |
| `const start = subDays(end, 6);` | `src/components/common/DateRangePicker.tsx` |
| `const start = subDays(end, 89);` | `src/components/common/DateRangePicker.tsx` |
| `const yesterday = subDays(new Date(), 1);` | `src/components/common/DateRangePicker.tsx` |
| `setTimeout(() => { setFile(null); setResult(null); setSheets([]); setProgress(0); }, 2000);` | `src/components/common/ExcelImporter.tsx` |
| `const timer = setTimeout(() => setPulse(false), 2000);` | `src/components/common/RealtimeBadge.tsx` |
| `await new Promise(r => setTimeout(r, 1000));` | `src/components/dashboard/BiometricConsentModal.tsx` |
| `await new Promise(r => setTimeout(r, 2500));` | `src/components/dashboard/BiometricConsentModal.tsx` |
| `const startDate = startOfMonth(subMonths(now, 1));` | `src/components/dashboard/FavoriteMetricsBar.tsx` |
| `setTimeout(() => setIsOptimizing(false), 2000);` | `src/components/dashboard/LogisticsMapWidget.tsx` |
| `toast.promise(new Promise((r) => setTimeout(r, 2000)), {` | `src/components/dashboard/LogisticsMapWidget.tsx` |
| `rotateTimeoutId = setTimeout(() => { rotateRafId = requestAnimationFrame(rotateCamera); }, 2000);` | `src/components/map/MapboxMap.tsx` |
| `const timer = setTimeout(() => { if (window.Notification.permission === "default" && !wasDismissed) { setShowPrompt(true); } }, 3000);` | `src/components/notifications/BrowserNotificationPrompt.tsx` |
| `const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);` | `src/components/pwa/InstallPrompt.tsx` |
| `setTimeout(() => setShowPrompt(true), 5000);` | `src/components/pwa/InstallPrompt.tsx` |
| `}, 60 * 60 * 1000); // Every hour` | `src/components/pwa/UpdatePrompt.tsx` |
| `setTimeout(() => setSearching(false), 2000);` | `src/components/rodonaves/RTECustomerSync.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/security/MFAEnroll.tsx` |
| `const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);` | `src/components/security/SecurityOverviewPanel.tsx` |
| `const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);` | `src/components/security/SecurityOverviewPanel.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/security/TwoFactorSetup.tsx` |
| `const timer = setTimeout(() => setInternalState(false), 2000);` | `src/components/ui/button.tsx` |
| `setTimeout(() => setCopied(null), 2000);` | `src/features/db-observability/components/QueryDetailDialog.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/features/db-observability/hooks/useBloatHotspots.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/features/db-observability/hooks/useCacheHitRatios.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/features/db-observability/hooks/useDuplicateIndexes.ts` |
| `const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();` | `src/features/db-observability/hooks/useHealthSnapshots.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/features/db-observability/hooks/useSeqScanHotspots.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/features/db-observability/hooks/useTableCoaccess.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/features/db-observability/hooks/useTempFileStats.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/features/db-observability/hooks/useUnindexedForeignKeys.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/features/db-observability/hooks/useUnusedIndexes.ts` |
| `const startDate = dateRange?.from \|\| subMonths(new Date(), 6);` | `src/hooks/analytics/useAnalytics.tsx` |
| `(now.getTime() - created.getTime()) / (1000 * 60 * 60);` | `src/hooks/analytics/useDashboardMetrics.tsx` |
| `now.getTime() - 6 * 60 * 60 * 1000,` | `src/hooks/analytics/useDashboardMetrics.tsx` |
| `const monthDate = subMonths(now, 5 - i); // Reversed order to build chronologically` | `src/hooks/analytics/useExecutiveMetrics.tsx` |
| `(efetiva.getTime() - despacho.getTime()) / (1000 * 60 * 60 * 24),` | `src/hooks/analytics/useKPIBenchmark.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/analytics/useKPIBenchmark.tsx` |
| `expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),` | `src/hooks/auth/useDeviceSessions.ts` |
| `debounceTimer = setTimeout(handleActivity, 1000);` | `src/hooks/auth/useSessionTimeout.ts` |
| `timeout: 60000,` | `src/hooks/auth/useWebAuthn.tsx` |
| `setTimeout(() => { setStatus('idle'); setResult(null); setProgress(0); }, 2000);` | `src/hooks/common/useImportData.ts` |
| `setTimeout(() => setProgress(0), 1000);` | `src/hooks/data/useDocumentUpload.ts` |
| `gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes` | `src/hooks/data/useMemoizedQuery.ts` |
| `setTimeout(() => { setNotifications((prev) => prev.filter((n) => n.timestamp !== notification.timestamp)); }, 5000);` | `src/hooks/gamification/useAchievementNotifications.tsx` |
| `const dayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/logistics/useAccuracyMetaCycle.ts` |
| `batchTimerRef.current = setTimeout(flushLogs, 2000);` | `src/hooks/logistics/useBusinessRuleEngine.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/logistics/useCostAlerts.tsx` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/logistics/useFreightQuotation.tsx` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/logistics/useLogisticsCalendar.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/logistics/useLogisticsCalendar.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/logistics/useLogisticsCosts.tsx` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/logistics/useMelhorEnvio.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/logistics/useMelhorEnvio.tsx` |
| `staleTime: 60 * 60 * 1000,` | `src/hooks/logistics/useMelhorEnvio.tsx` |
| `refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes` | `src/hooks/logistics/useSLAAlerts.tsx` |
| `setTimeout(() => notification.close(), 30000);` | `src/hooks/logistics/useSLANotifications.tsx` |
| `}, 60 * 60 * 1000);` | `src/hooks/logistics/useSLANotifications.tsx` |
| `(now.getTime() - created.getTime()) / (1000 * 60 * 60);` | `src/hooks/logistics/useSmartAlerts.tsx` |
| `const interval = setInterval(checkCriticalDeadlines, 5 * 60 * 1000);` | `src/hooks/logistics/useSmartAlerts.tsx` |
| `(Date.now() - new Date(previsao).getTime()) / (1000 * 60 * 60 * 24),` | `src/hooks/logistics/useUnifiedTracking.tsx` |
| `setTimeout(() => notification.close(), 10000);` | `src/hooks/notifications/useSecurityPushNotifications.tsx` |
| `const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);` | `src/hooks/security/useSecurityEvents.ts` |
| `const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);` | `src/hooks/security/useSecurityEvents.ts` |
| `await new Promise(resolve => setTimeout(resolve, 2000));` | `src/hooks/security/useSelfHealing.ts` |
| `setTimeout(() => { lastScannedRef.current = ""; }, 2000);` | `src/hooks/ui/useQRScanner.tsx` |
| `DASHBOARD: 2 * 60 * 1000,` | `src/lib/queryConfig.ts` |
| `SEMI_STATIC: 3 * 60 * 1000,` | `src/lib/queryConfig.ts` |
| `SLA: 5 * 60 * 1000,` | `src/lib/queryConfig.ts` |
| `STATIC: 5 * 60 * 1000,` | `src/lib/queryConfig.ts` |
| `USER: 2 * 60 * 1000,` | `src/lib/queryConfig.ts` |
| `export const DEFAULT_COOLDOWN_MS = 60 * 60 * 1000;` | `src/lib/rodonaves/sloAlerts.ts` |
| `setTimeout(() => setCopied(null), 2000);` | `src/pages/APIDocumentation.tsx` |
| `const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `src/pages/AdminTelemetria.tsx` |
| `<Button variant="outline" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })} className="shrink-0 h-10">` | `src/pages/Analytics.tsx` |
| `from: subDays(new Date(), 30),` | `src/pages/Analytics.tsx` |
| `onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}` | `src/pages/CalendarioLogistico.tsx` |
| `onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}` | `src/pages/CalendarioLogistico.tsx` |
| `setTimeout(() => setShowConfetti(false), 5000);` | `src/pages/Clientes.tsx` |
| `const startDate = dateRange?.from \|\| subDays(new Date(), 90);` | `src/pages/CustosDashboard.tsx` |
| `from: subDays(new Date(), 90),` | `src/pages/CustosDashboard.tsx` |
| `const endLastMonth = endOfMonth(subMonths(now, 1));` | `src/pages/DashboardExecutivo.tsx` |
| `const lastMonth = startOfMonth(subMonths(now, 1));` | `src/pages/DashboardExecutivo.tsx` |
| `setTimeout(() => setShowConfetti(false), 5000);` | `src/pages/Envios.tsx` |
| `setTimeout(() => setCurrentStep(0), 5000);` | `src/pages/ImportacaoMassa.tsx` |
| `from: subDays(new Date(), 6),` | `src/pages/Index.tsx` |
| `refetchInterval: 5 * 60 * 1000,` | `src/pages/PainelSLA.tsx` |
| `start: subDays(new Date(), 6),` | `src/pages/Relatorios.tsx` |
| `setTimeout(() => { navigate("/"); }, 2000);` | `src/pages/ResetPassword.tsx` |
| `from: subDays(new Date(), 30),` | `src/pages/SLADashboard.tsx` |
| `const timeout = setTimeout(() => r('TIMEOUT'), 5000);` | `src/utils/systemTester.ts` |
| `current_date + (random() * 10 + 1)::int * interval '1 day',` | `supabase/seed.sql` |
| `current_date - (random() * 5)::int * interval '1 day',` | `supabase/seed.sql` |
| `const { timeout = 10000 } = options;` | `supabase/functions/_shared/fetch-with-timeout.ts` |
| `* await safeFetch(url, { timeout: 8000, allowedHosts: ["api.mapbox.com"] });` | `supabase/functions/_shared/safeFetch.ts` |
| `const windowStart = now.getTime() - cfg.windowHours * 60 * 60 * 1000;` | `supabase/functions/accuracy-meta-monitor/escalation.ts` |
| `Date.now() - DEFAULT_ESCALATION.windowHours * 60 * 60 * 1000,` | `supabase/functions/accuracy-meta-monitor/index.ts` |
| `const WINDOW_MS = 24 * 60 * 60 * 1000;` | `supabase/functions/accuracy-meta-monitor/index.ts` |
| `export const WINDOW_MS = 24 * 60 * 60 * 1000;` | `supabase/functions/accuracy-meta-monitor/simulator.ts` |
| `delta <= 24 * 60 * 60 * 1000 + 1,` | `supabase/functions/accuracy-meta-monitor/simulator_test.ts` |
| `export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;` | `supabase/functions/accuracy-weekly-digest/digest.ts` |
| `now.getTime() - 7 * 24 * 60 * 60 * 1000,` | `supabase/functions/accuracy-weekly-digest/index.ts` |
| `supabase.from('entregas').select('valor_frete, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),` | `supabase/functions/ai-logistics-assistant/index.ts` |
| `const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block` | `supabase/functions/check-rate-limit/index.ts` |
| `timeout: 6000,` | `supabase/functions/geocode-address/index.ts` |
| `timeout: 8000,` | `supabase/functions/geocode-address/index.ts` |
| `{ timeout: 8000, allowedHosts: ["api.openweathermap.org"] },` | `supabase/functions/get-weather-data/index.ts` |
| `await new Promise(resolve => setTimeout(resolve, 2000));` | `supabase/functions/ocr-receipt-processor/index.ts` |
| `(1000 * 60 * 60 * 24),` | `supabase/functions/predict-delays/index.ts` |
| `Date.now() - 6 * 60 * 60 * 1000,` | `supabase/functions/predict-delays/index.ts` |
| `const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();` | `supabase/functions/predict-delays/index.ts` |
| `.gte("predicted_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());` | `supabase/functions/predict-delays-scheduled/index.ts` |
| `const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();` | `supabase/functions/predict-delays-scheduled/index.ts` |
| `const DEFAULT_TIMEOUT = 15_000;` | `supabase/functions/rodonaves-api/index.ts` |
| `Date.now() - 24 * 60 * 60 * 1000,` | `supabase/functions/validate-login/index.ts` |
| `expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),` | `supabase/migrations/20251231124450_1019d14d-6c2b-4cc5-bcc3-c26c9c58a2dd.sql` |
| `expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),` | `supabase/migrations/20260317213459_b43e2938-7e00-4530-a940-3aba5c9e7b05.sql` |
| `AND created_at < now() - interval '24 hours';` | `supabase/migrations/20260519163240_a44a9ac2-837f-405f-ab86-8e651c62bd5b.sql` |
| `AND created_at < now() - interval '1 hour'` | `supabase/migrations/20260712183625_ed8a21e5-2aa1-4965-bdce-5831f0729248.sql` |
| `WHERE created_at > now() - interval '7 days'` | `supabase/migrations/20260712183625_ed8a21e5-2aa1-4965-bdce-5831f0729248.sql` |
| `EXTRACT(EPOCH FROM (created_at - (now() - interval '7 days'))) / 3600.0 AS x_hours,` | `supabase/migrations/20260712193601_8340c366-a412-4204-8577-eb6c922fe4a8.sql` |
| `WHERE created_at >= now() - interval '7 days'` | `supabase/migrations/20260712193601_8340c366-a412-4204-8577-eb6c922fe4a8.sql` |
| `WHERE r.created_at >= now() - interval '30 days'` | `supabase/migrations/20260712195313_c3bd1d37-3196-48a7-9203-a54dcef792ef.sql` |
| `AND created_at < now() - interval '1 hour'` | `supabase/migrations/20260712195636_5a4fbf15-cea4-4b1d-9ec6-b9b2131c2d15.sql` |
| `WHERE created_at > now() - interval '7 days'` | `supabase/migrations/20260712195636_5a4fbf15-cea4-4b1d-9ec6-b9b2131c2d15.sql` |
| `WHERE created_at >= now() - interval '30 days';` | `supabase/migrations/20260712195636_5a4fbf15-cea4-4b1d-9ec6-b9b2131c2d15.sql` |
| `AND created_at > now() - interval '1 hour'` | `supabase/migrations/20260712195804_b2fd8075-d6f0-43eb-a555-f5d4b4de9b44.sql` |
| `WHERE captured_at <= (v_curr.captured_at - interval '20 hours')` | `supabase/migrations/20260712195804_b2fd8075-d6f0-43eb-a555-f5d4b4de9b44.sql` |
| `AND predicted_at > now() - interval '60 days'` | `supabase/migrations/20260723132054_9de9aeb1-7fbc-40f0-8c93-e443f0eeba3e.sql` |
| `WHERE predicted_at > now() - interval '30 days'` | `supabase/migrations/20260723132054_9de9aeb1-7fbc-40f0-8c93-e443f0eeba3e.sql` |
| `WHERE predicted_at > now() - interval '30 days'` | `supabase/migrations/20260723132537_e0ef23f7-0233-426a-b712-d47b6968c957.sql` |
| `WHERE predicted_at > now() - interval '30 days'` | `supabase/migrations/20260723132902_65c49e6d-0ce3-4710-a72f-5711164da92e.sql` |
| `SELECT cron.schedule('cleanup-cron-job-run-details', '30 2 * * *', $$ DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'; $$);` | `supabase/migrations/20260901000000_cron_jobs_canonical.sql` |
| `SELECT cron.schedule('compute-db-slo-daily', '15 3 * * *', $$ SELECT public.compute_db_slo_for((now() - interval '1 day')::date); $$);` | `supabase/migrations/20260901000000_cron_jobs_canonical.sql` |
| `EXTRACT(EPOCH FROM (s.created_at - (now() - interval '7 days'))) / 3600.0 AS x_hours,` | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |
| `WHERE s.created_at >= now() - interval '7 days'` | `supabase/migrations/20261117120000_fix_rpcs_observabilidade.sql` |

### H.3 Limites de paginação

| Limite | Arquivo |
|---|---|
| 100 | `src/components/admin/TelemetryViewer.tsx` |
| 3 | `src/components/analytics/OperationalPulse.tsx` |
| 5 | `src/components/analytics/OperationalPulse.tsx` |
| 200 | `src/components/coletas/PickupDialog.tsx` |
| 500 | `src/components/coletas/PickupDialog.tsx` |
| 50 | `src/components/dashboard/SystemHealthWidget.tsx` |
| 20 | `src/components/freight/DecisionAudit.tsx` |
| 10 | `src/components/freight/FreightAudit.tsx` |
| 10 | `src/components/freight/ResponseConsole.tsx` |
| 500 | `src/components/labels/MaterialLabelPrinter.tsx` |
| 50 | `src/components/map/TacticalTerminal.tsx` |
| 1 | `src/components/security/GeoBlockingPanel.tsx` |
| 50 | `src/components/security/GeoBlockingPanel.tsx` |
| 50 | `src/components/security/LoginAttemptsLog.tsx` |
| 100 | `src/components/shipping/ExpeditionDetailsDialog.tsx` |
| 2000 | `src/features/db-observability/components/ExportHealthReportButton.tsx` |
| 1000 | `src/features/db-observability/hooks/useHealthSnapshots.ts` |
| 50 | `src/features/db-observability/hooks/useIndexProposals.ts` |
| 200 | `src/features/db-observability/hooks/useRemediationActions.ts` |
| 500 | `src/hooks/analytics/useAnalytics.tsx` |
| 1000 | `src/hooks/analytics/useDashboardData.tsx` |
| 10 | `src/hooks/analytics/useDashboardMetrics.tsx` |
| 200 | `src/hooks/analytics/useDashboardMetrics.tsx` |
| 5 | `src/hooks/analytics/useDashboardMetrics.tsx` |
| 100 | `src/hooks/analytics/useDrillDown.tsx` |
| 100 | `src/hooks/analytics/useExecutiveMetrics.tsx` |
| 1000 | `src/hooks/analytics/useExecutiveMetrics.tsx` |
| 2000 | `src/hooks/analytics/useExecutiveMetrics.tsx` |
| 500 | `src/hooks/analytics/useExecutiveMetrics.tsx` |
| 1000 | `src/hooks/analytics/useKPIBenchmark.tsx` |
| 5 | `src/hooks/common/useGlobalSearch.tsx` |
| 1 | `src/hooks/data/usePrefetch.ts` |
| 200 | `src/hooks/data/usePrefetch.ts` |
| 50 | `src/hooks/data/usePrefetch.ts` |
| 500 | `src/hooks/data/usePrefetch.ts` |
| 100 | `src/hooks/gamification/useRewardPurchases.tsx` |
| 100 | `src/hooks/integrations/useClientWebhooks.tsx` |
| 1 | `src/hooks/logistics/useAccuracyMetaCycle.ts` |
| 20 | `src/hooks/logistics/useBiometricAnomalies.ts` |
| 500 | `src/hooks/logistics/useBoxManagement.tsx` |
| 2000 | `src/hooks/logistics/useConciliacao.tsx` |
| 10 | `src/hooks/logistics/useCostAlerts.tsx` |
| 50 | `src/hooks/logistics/useCostAlerts.tsx` |
| 1000 | `src/hooks/logistics/useFreightIntelligence.tsx` |
| 2000 | `src/hooks/logistics/useLogisticsCosts.tsx` |
| 500 | `src/hooks/logistics/useSLAAlerts.tsx` |
| 50 | `src/hooks/logistics/useSLANotifications.tsx` |
| 500 | `src/hooks/logistics/useSmartAlerts.tsx` |
| 200 | `src/hooks/logistics/useUnifiedTracking.tsx` |
| 50 | `src/hooks/notifications/useNotifications.tsx` |
| 10 | `src/hooks/notifications/useSecurityPushNotifications.tsx` |
| 200 | `src/hooks/predictions/useMitigationActions.ts` |
| 2000 | `src/hooks/rodonaves/useGatewayHealth.ts` |
| 2000 | `src/hooks/rodonaves/useSLOSnapshots.ts` |
| 500 | `src/hooks/security/useRateLimitLogs.ts` |
| 500 | `src/pages/AdminTelemetria.tsx` |
| 500 | `src/pages/AprovacaoResetSenha.tsx` |
| 5000 | `src/pages/AuditTrail.tsx` |
| 1000 | `src/pages/Clientes.tsx` |
| 2000 | `src/pages/Clientes.tsx` |
| 500 | `src/pages/Coletas.tsx` |
| 2000 | `src/pages/ConciliacaoAutomatica.tsx` |
| 500 | `src/pages/ConciliacaoAutomatica.tsx` |
| 200 | `src/pages/ConfiguracoesFrete.tsx` |
| 1000 | `src/pages/DashboardExecutivo.tsx` |
| 2000 | `src/pages/DashboardExecutivo.tsx` |
| 500 | `src/pages/DashboardExecutivo.tsx` |
| 200 | `src/pages/Despachos.tsx` |
| 200 | `src/pages/Envios.tsx` |
| 500 | `src/pages/Envios.tsx` |
| 5000 | `src/pages/ExportacaoDados.tsx` |
| 1000 | `src/pages/Fornecedores.tsx` |
| 2000 | `src/pages/Fornecedores.tsx` |
| 500 | `src/pages/FretesInternos.tsx` |
| 20 | `src/pages/IntegracaoBitrix.tsx` |
| 500 | `src/pages/KanbanEntregas.tsx` |
| 1 | `src/pages/MapaRotas.tsx` |
| 50 | `src/pages/MapaRotas.tsx` |
| 50 | `src/pages/Ocorrencias.tsx` |
| 500 | `src/pages/Ocorrencias.tsx` |
| 2000 | `src/pages/PainelOTIF.tsx` |
| 500 | `src/pages/PainelSLA.tsx` |
| 100 | `src/pages/Ranking.tsx` |
| 20 | `src/pages/RastreamentoMotorista.tsx` |
| 2000 | `src/pages/RelatorioPDF.tsx` |
| 1000 | `src/pages/Relatorios.tsx` |
| 5 | `src/pages/Relatorios.tsx` |
| 5000 | `src/pages/Relatorios.tsx` |
| 200 | `src/pages/RotasTransportadoras.tsx` |
| 500 | `src/pages/Transportadoras.tsx` |
| 200 | `src/services/api/logisticsService.ts` |
| 1 | `src/utils/systemTester.ts` |
| 1 | `supabase/functions/_shared/rateLimiter.ts` |
| 500 | `supabase/functions/accuracy-weekly-digest/index.ts` |
| 10 | `supabase/functions/ai-logistics-assistant/index.ts` |
| 50 | `supabase/functions/ai-logistics-assistant/index.ts` |
| 1 | `supabase/functions/check-rate-limit/index.ts` |
| 1 | `supabase/functions/db-health-snapshot/index.ts` |
| 1 | `supabase/functions/health/index.ts` |
| 1 | `supabase/functions/health-check/index.ts` |
| 1 | `supabase/functions/ingest-biosync/index.ts` |
| 1 | `supabase/functions/nexus-webhook-receiver/index.ts` |
| 100 | `supabase/functions/predict-delays/index.ts` |
| 1 | `supabase/functions/predict-delays-scheduled/index.ts` |
| 1 | `supabase/functions/rodonaves-webhook/index.ts` |
| 500 | `supabase/functions/smart-carrier-selection/index.ts` |

## I. Regras implícitas em mensagens de erro/validação

| Mensagem | Arquivo |
|---|---|
| Root element not found | `src/main.tsx` |
|          aria-live= | `src/components/accessibility/LiveRegion.tsx` |
| useLiveRegion must be used within LiveRegionProvider | `src/components/accessibility/LiveRegion.tsx` |
| ERRO AO SALVAR CONFIGURAÇÕES | `src/components/admin/telemetry/BioSyncConfig.tsx` |
| Erro ao processar mensagem estratégica. | `src/components/ai/AIAssistant.tsx` |
| Limite de requisições atingido. | `src/components/ai/AIAssistant.tsx` |
| Stream não disponível | `src/components/ai/AIAssistant.tsx` |
|  && (                       <Input value={action.config.alert_message \|\|  | `src/components/automation/RuleEditor.tsx` |
| ; import {   Package,   AlertTriangle,   Loader2,   Weight,   Camera,   ShieldCheck,   Zap, } from  | `src/components/coletas/PickupConference.tsx` |
| Dados incompletos | `src/components/coletas/PickupConference.tsx` |
| Erro na conferência | `src/components/coletas/PickupConference.tsx` |
| Falha Crítica_NODE | `src/components/coletas/PickupDialog.tsx` |
| ; import { Progress } from  | `src/components/common/CSVImporter.tsx` |
| Erro ao ler arquivo: ${error.message} | `src/components/common/CSVImporter.tsx` |
| Erro na Importação | `src/components/common/CSVImporter.tsx` |
| useConfirm must be used within a ConfirmProvider | `src/components/common/ConfirmProvider.tsx` |
| ; import { Progress } from  | `src/components/common/ExcelImporter.tsx` |
| Erro ao importar dados para o sistema. Tente novamente. | `src/components/common/ExcelImporter.tsx` |
| Erro ao processar planilha. Verifique a estrutura do arquivo. | `src/components/common/ExcelImporter.tsx` |
| Não foi possível ler o arquivo Excel. Verifique se o formato é .xlsx ou .xls. | `src/components/common/ExcelImporter.tsx` |
| Protocolo de auto-reparo falhou. Verifique logs. | `src/components/common/RealtimeStatus.tsx` |
| Erro ao executar protocolo:  | `src/components/dashboard/LogisticsMapWidget.tsx` |
| Preencha todos os campos para auditoria | `src/components/freight/FreightAudit.tsx` |
| Preencha UF e peso | `src/components/freight/QuickQuoteWidget.tsx` |
| Preencha estado e peso | `src/components/freight/QuotationForm.tsx` |
| Erro ao normalizar: ${(error as Error).message} | `src/components/freight/ResponseConsole.tsx` |
| Informe o CNPJ | `src/components/freight/RodonavesQuotation.tsx` |
| Preencha CEP origem, destino e peso | `src/components/freight/RodonavesQuotation.tsx` |
| Preencha os CEPs | `src/components/freight/RodonavesQuotation.tsx` |
| Selecione ao menos um evento | `src/components/integrations/WebhookManager.tsx` |
| URL é obrigatória | `src/components/integrations/WebhookManager.tsx` |
| Erro ao gerar PDF | `src/components/labels/MaterialLabelPrinter.tsx` |
| Selecione ao menos uma entrega | `src/components/labels/MaterialLabelPrinter.tsx` |
| Selecione pelo menos um evento | `src/components/melhorenvio/MEWebhookPanel.tsx` |
| URL inválida | `src/components/melhorenvio/MEWebhookPanel.tsx` |
| URL é obrigatória | `src/components/melhorenvio/MEWebhookPanel.tsx` |
| Para desativar notificações, use as configurações do navegador. | `src/components/notifications/BrowserNotificationPrompt.tsx` |
| ; import { Mail, Eye, Loader2 } from  | `src/components/predictions/DigestPreviewPanel.tsx` |
| Falha ao gerar preview: ${err.message} | `src/components/predictions/DigestPreviewPanel.tsx` |
| ; import { Input } from  | `src/components/predictions/PredictionAccuracyTimeline.tsx` |
| Armazenamento local indisponível | `src/components/predictions/WhatIfPanel.tsx` |
| Adicione pelo menos um destinatário | `src/components/reports/ScheduledReportsManager.tsx` |
| Erro ao gerar relatório | `src/components/reports/ScheduledReportsManager.tsx` |
| Erro ao buscar clientes | `src/components/rodonaves/RTECustomerManager.tsx` |
| Erro ao buscar endereços | `src/components/rodonaves/RTECustomerManager.tsx` |
| Erro ao listar clientes | `src/components/rodonaves/RTECustomerManager.tsx` |
| Erro na busca completa | `src/components/rodonaves/RTECustomerManager.tsx` |
| Informe o CNPJ | `src/components/rodonaves/RTECustomerSync.tsx` |
|              className= | `src/components/rodonaves/RTEGatewayHealthPanel.tsx` |
|  className= | `src/components/rodonaves/RTEGatewaySLOPanel.tsx` |
| Informe o protocolo | `src/components/rodonaves/RTEPickupActions.tsx` |
| Informe protocolo e nova data | `src/components/rodonaves/RTEPickupActions.tsx` |
|  className= | `src/components/rodonaves/RTESLOHistoryPanel.tsx` |
| Erro ao atualizar:  | `src/components/security/GeoBlockingPanel.tsx` |
| Erro ao remover:  | `src/components/security/GeoBlockingPanel.tsx` |
| O código do país deve ter 2 caracteres | `src/components/security/GeoBlockingPanel.tsx` |
| Preencha código e nome do país | `src/components/security/GeoBlockingPanel.tsx` |
| Selecione um país | `src/components/security/GeoBlockingPanel.tsx` |
| Erro ao adicionar regra | `src/components/security/IPAccessControl.tsx` |
| Erro ao atualizar regra | `src/components/security/IPAccessControl.tsx` |
| Erro ao remover regra | `src/components/security/IPAccessControl.tsx` |
| Digite um código de 6 dígitos | `src/components/security/MFAEnroll.tsx` |
| Erro ao salvar permissões | `src/components/security/PermissionMatrix.tsx` |
| Código inválido | `src/components/security/TwoFactorSetup.tsx` |
| Erro ao configurar 2FA | `src/components/security/TwoFactorSetup.tsx` |
| Erro ao desativar 2FA | `src/components/security/TwoFactorSetup.tsx` |
| Apenas imagens (JPG, PNG) ou PDFs são permitidos | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| Comprovante enviado, mas houve erro no processamento OCR. | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| Erro ao remover comprovante | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| Falha ao gerar URL do comprovante | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| Falha no protocolo de upload:  | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| Erro ao atualizar status:  | `src/components/shipping/ExpeditionDetailsDialog.tsx` |
| Erro na importação: ${error instanceof Error ? error.message : String(error)} | `src/components/transportadoras/BulkRouteImport.tsx` |
| Nenhuma rota válida encontrada no arquivo | `src/components/transportadoras/BulkRouteImport.tsx` |
| Selecione um arquivo CSV para importar | `src/components/transportadoras/BulkRouteImport.tsx` |
| Erro ao processar resposta | `src/components/transportadoras/NormalizationMapping.tsx` |
| Insira um texto para testar | `src/components/transportadoras/NormalizationMapping.tsx` |
|  className={cn(alertVariants({ variant }), className)} {...props} /> )); Alert.displayName =  | `src/components/ui/alert.tsx` |
| useCarousel must be used within a <Carousel /> | `src/components/ui/carousel.tsx` |
| useChart must be used within a <ChartContainer /> | `src/components/ui/chart.tsx` |
| useFormField should be used within <FormField> | `src/components/ui/form.tsx` |
| ; export { Progress } from  | `src/components/ui/index.ts` |
| useSidebar must be used within a SidebarProvider. | `src/components/ui/sidebar.tsx` |
| Falha ao exportar: ${msg} | `src/features/db-observability/components/ExportHealthReportButton.tsx` |
| ; import { AlertTriangle, TrendingDown, TrendingUp } from  | `src/features/db-observability/components/HealthRegressionAlert.tsx` |
| Falha ao ${action} PID ${pid} | `src/features/db-observability/components/LongRunningQueriesCard.tsx` |
| ; import { Activity, AlertTriangle, CheckCircle2, ShieldAlert } from  | `src/features/db-observability/components/TransactionHealthCard.tsx` |
| ; import { HardDriveDownload, AlertTriangle, CheckCircle2, ShieldAlert } from  | `src/features/db-observability/components/WalHealthCard.tsx` |
| Erro: ${e.message} | `src/features/db-observability/hooks/useIndexProposals.ts` |
| Falha ao aplicar: ${e.message} | `src/features/db-observability/hooks/useIndexProposals.ts` |
| Falha ao medir: ${e.message} | `src/features/db-observability/hooks/useIndexProposals.ts` |
| Falha: ${e.message} | `src/features/db-observability/hooks/useRemediationActions.ts` |
| Falha na Simulação de Carga | `src/hooks/ai/useNexusSimulator.ts` |
| Erro ao atualizar relatório | `src/hooks/analytics/useScheduledReports.tsx` |
| Erro ao criar relatório | `src/hooks/analytics/useScheduledReports.tsx` |
| Erro ao remover relatório | `src/hooks/analytics/useScheduledReports.tsx` |
| useAuth must be used within an AuthProvider | `src/hooks/auth/useAuth.tsx` |
| Erro ao encerrar sessão | `src/hooks/auth/useDeviceSessions.ts` |
| Erro ao encerrar sessões | `src/hooks/auth/useDeviceSessions.ts` |
| User not authenticated | `src/hooks/auth/useDeviceSessions.ts` |
| Código inválido | `src/hooks/auth/useMFA.ts` |
| Código inválido. Tente novamente. | `src/hooks/auth/useMFA.ts` |
| Erro ao criar desafio de verificação | `src/hooks/auth/useMFA.ts` |
| Erro ao desativar 2FA | `src/hooks/auth/useMFA.ts` |
| Erro ao iniciar configuração do 2FA | `src/hooks/auth/useMFA.ts` |
| Erro ao atribuir role | `src/hooks/auth/useRole.ts` |
| Erro ao remover role | `src/hooks/auth/useRole.ts` |
| Autenticação cancelada | `src/hooks/auth/useWebAuthn.tsx` |
| Autenticação falhou | `src/hooks/auth/useWebAuthn.tsx` |
| Credencial não encontrada | `src/hooks/auth/useWebAuthn.tsx` |
| Erro ao registrar passkey | `src/hooks/auth/useWebAuthn.tsx` |
| Erro ao remover passkey | `src/hooks/auth/useWebAuthn.tsx` |
| Erro ao renomear passkey | `src/hooks/auth/useWebAuthn.tsx` |
| Erro de segurança. Verifique se está usando HTTPS | `src/hooks/auth/useWebAuthn.tsx` |
| Erro na autenticação biométrica | `src/hooks/auth/useWebAuthn.tsx` |
| Falha ao criar credencial | `src/hooks/auth/useWebAuthn.tsx` |
| Registro cancelado pelo usuário | `src/hooks/auth/useWebAuthn.tsx` |
| Seu dispositivo não suporta autenticação biométrica | `src/hooks/auth/useWebAuthn.tsx` |
| Você precisa estar logado para registrar uma passkey | `src/hooks/auth/useWebAuthn.tsx` |
| Erro ao atualizar | `src/hooks/common/useBulkActions.ts` |
| Erro ao excluir | `src/hooks/common/useBulkActions.ts` |
| Erro ao mover para lixeira | `src/hooks/common/useBulkActions.ts` |
| Erro ao restaurar | `src/hooks/common/useBulkActions.ts` |
| Erro: ${error.message} | `src/hooks/common/useComments.tsx` |
| Usuário não autenticado | `src/hooks/common/useComments.tsx` |
| Erro ao exportar:  | `src/hooks/common/useExport.tsx` |
| Nenhum dado para exportar | `src/hooks/common/useExport.tsx` |
| Erro ao importar: ${error instanceof Error ? error.message :  | `src/hooks/common/useImportData.ts` |
| Erro ao processar arquivo: ${error instanceof Error ? error.message :  | `src/hooks/common/useImportData.ts` |
| Nenhum dado válido para importar | `src/hooks/common/useImportData.ts` |
| ${failCount} operações falharam na sincronização | `src/hooks/common/useOnlineStatus.tsx` |
| Você está offline | `src/hooks/common/useOnlineStatus.tsx` |
| useTimezone must be used within a TimezoneProvider | `src/hooks/common/useTimezone.tsx` |
| Arquivo muito grande. Máximo: ${maxSizeMB}MB | `src/hooks/data/useDocumentUpload.ts` |
| Assinatura de arquivo inválida. O arquivo pode estar corrompido ou falsificado. | `src/hooks/data/useDocumentUpload.ts` |
| Erro ao enviar arquivo. | `src/hooks/data/useDocumentUpload.ts` |
| Erro ao remover arquivo. | `src/hooks/data/useDocumentUpload.ts` |
| Tipo de arquivo não permitido. Use PDF, JPG ou PNG. | `src/hooks/data/useDocumentUpload.ts` |
| Apenas imagens são permitidas | `src/hooks/data/useImageUpload.tsx` |
| Erro ao excluir imagem | `src/hooks/data/useImageUpload.tsx` |
| Erro no upload: ${error instanceof Error ? error.message :  | `src/hooks/data/useImageUpload.tsx` |
| Falha na Operação | `src/hooks/data/useResilientMutation.ts` |
| Erro ao remover item | `src/hooks/data/useSoftDelete.ts` |
| Erro ao restaurar item | `src/hooks/data/useSoftDelete.ts` |
| useAchievementNotifications must be used within an AchievementProvider | `src/hooks/gamification/useAchievementNotifications.tsx` |
| User not authenticated | `src/hooks/gamification/useGamification.ts` |
| Achievement not found | `src/hooks/gamification/useGamification.tsx` |
| User not logged in | `src/hooks/gamification/useGamification.tsx` |
| Erro ao atualizar no Bitrix24 | `src/hooks/integrations/useBitrixEntregaSync.tsx` |
| Erro ao sincronizar com Bitrix24 | `src/hooks/integrations/useBitrixEntregaSync.tsx` |
| Erro ao enviar WhatsApp | `src/hooks/integrations/useEvolutionWhatsApp.tsx` |
| Erro ao enviar cotação via WhatsApp | `src/hooks/integrations/useEvolutionWhatsApp.tsx` |
| Serviço WhatsApp temporariamente indisponível (Circuit Breaker) | `src/hooks/integrations/useEvolutionWhatsApp.tsx` |
| Erro no banco externo: ${e.message} | `src/hooks/integrations/useExternalDbBridge.tsx` |
| )         .eq( | `src/hooks/logistics/useAccuracyMetaCycle.ts` |
| Erro ao alocar entrega no box | `src/hooks/logistics/useBoxManagement.tsx` |
| Erro ao atualizar Cross-docking | `src/hooks/logistics/useBoxManagement.tsx` |
| Erro ao liberar box | `src/hooks/logistics/useBoxManagement.tsx` |
| ) {       const { data: userData } = await supabase.auth.getUser();       if (!userData?.user) return;       const isAlert = action.type ===  | `src/hooks/logistics/useBusinessRuleEngine.tsx` |
| ;       await supabase.from( | `src/hooks/logistics/useBusinessRuleEngine.tsx` |
| , label:  | `src/hooks/logistics/useBusinessRules.tsx` |
| Erro ao atualizar regra: ${error.message} | `src/hooks/logistics/useBusinessRules.tsx` |
| Erro ao criar regra: ${error.message} | `src/hooks/logistics/useBusinessRules.tsx` |
| Erro ao excluir regra: ${error.message} | `src/hooks/logistics/useBusinessRules.tsx` |
| Arquivo vazio | `src/hooks/logistics/useConciliacao.tsx` |
| Arquivo vazio ou formato inválido | `src/hooks/logistics/useConciliacao.tsx` |
| Erro ao importar:  | `src/hooks/logistics/useConciliacao.tsx` |
| Erro:  | `src/hooks/logistics/useConciliacao.tsx` |
| Nenhum item pendente para conciliar | `src/hooks/logistics/useConciliacao.tsx` |
| Erro ao atualizar alerta:  | `src/hooks/logistics/useCostAlerts.tsx` |
| Erro ao criar alerta:  | `src/hooks/logistics/useCostAlerts.tsx` |
| Erro ao remover alerta:  | `src/hooks/logistics/useCostAlerts.tsx` |
| Circuit Breaker: O serviço de análise preditiva está temporariamente suspenso devido a falhas recorrentes. | `src/hooks/logistics/useDelayPrediction.tsx` |
| Créditos de IA esgotados. Adicione créditos no workspace. | `src/hooks/logistics/useDelayPrediction.tsx` |
| Erro na análise: ${message} | `src/hooks/logistics/useDelayPrediction.tsx` |
| Limite de requisições excedido. Aguarde alguns minutos. | `src/hooks/logistics/useDelayPrediction.tsx` |
| Serviço de IA temporariamente indisponível (Resiliência Ativa) | `src/hooks/logistics/useDelayPrediction.tsx` |
| ⚠️ ${altos} entrega(s) com risco ALTO de atraso | `src/hooks/logistics/useDelayPrediction.tsx` |
| 🚨 ${criticos} entrega(s) com risco CRÍTICO de atraso! | `src/hooks/logistics/useDelayPrediction.tsx` |
| 🚨 Alerta Crítico: ${criticos} entregas críticas e ${altos} com alto risco de atraso! | `src/hooks/logistics/useDelayPrediction.tsx` |
| Geocodificação incompleta | `src/hooks/logistics/useDeliveryRoutes.tsx` |
| Erro ao adicionar tabela de frete:  | `src/hooks/logistics/useFreightQuotation.tsx` |
| Erro ao atualizar tabela de frete:  | `src/hooks/logistics/useFreightQuotation.tsx` |
| Erro ao remover tabela de frete:  | `src/hooks/logistics/useFreightQuotation.tsx` |
| Erro ao buscar pedido: ${e.message} | `src/hooks/logistics/useLalamoveOrders.tsx` |
| Erro ao cancelar: ${e.message} | `src/hooks/logistics/useLalamoveOrders.tsx` |
| Erro ao criar pedido: ${e.message} | `src/hooks/logistics/useLalamoveOrders.tsx` |
| Erro na cotação Lalamove: ${e.message} | `src/hooks/logistics/useLalamoveOrders.tsx` |
| Aguardando motorista aceitar o pedido... | `src/hooks/logistics/useLalamoveTracking.tsx` |
| Erro ao iniciar rastreamento | `src/hooks/logistics/useLalamoveTracking.tsx` |
| ID do pedido é obrigatório | `src/hooks/logistics/useLalamoveTracking.tsx` |
| Não foi possível obter detalhes do pedido | `src/hooks/logistics/useLalamoveTracking.tsx` |
| Erro ao criar solicitação. | `src/hooks/logistics/useLogisticaReversaReal.tsx` |
| Erro ao inserir no carrinho:  | `src/hooks/logistics/useMelhorEnvio.tsx` |
| Erro na compra:  | `src/hooks/logistics/useMelhorEnvio.tsx` |
| Erro na cotação:  | `src/hooks/logistics/useMelhorEnvio.tsx` |
| Erro:  | `src/hooks/logistics/useMelhorEnvio.tsx` |
| Melhor Envio indisponível: token não configurado no Supabase. | `src/hooks/logistics/useMelhorEnvio.tsx` |
| ${errorPrefix}: ${err.message} | `src/hooks/logistics/useRodonavesTracking.tsx` |
| Erro no rastreamento: ${err.message} | `src/hooks/logistics/useRodonavesTracking.tsx` |
| Erro no webhook: ${e.message} | `src/hooks/logistics/useRodonavesWebhook.tsx` |
| 🚨 ${alert.numero_entrega} — ${alert.previsao_atraso ?  | `src/hooks/logistics/useSLAAlerts.tsx` |
| Notificações bloqueadas | `src/hooks/logistics/useSLANotifications.tsx` |
| Erro ao analisar transportadoras | `src/hooks/logistics/useSmartCarrierSelection.tsx` |
| Erro ao processar seleção inteligente | `src/hooks/logistics/useSmartCarrierSelection.tsx` |
| Erro ao adicionar rota | `src/hooks/logistics/useTransportadoraRotas.tsx` |
| Erro ao atualizar rota | `src/hooks/logistics/useTransportadoraRotas.tsx` |
| Erro ao remover rota | `src/hooks/logistics/useTransportadoraRotas.tsx` |
| Not authenticated | `src/hooks/notifications/useNotificationPreferences.tsx` |
| Erro ao ativar notificações push | `src/hooks/notifications/usePushNotifications.tsx` |
| Erro ao desativar notificações push | `src/hooks/notifications/usePushNotifications.tsx` |
| Erro ao solicitar permissão | `src/hooks/notifications/usePushNotifications.tsx` |
| Notificações push não são suportadas | `src/hooks/notifications/usePushNotifications.tsx` |
| Notificações push não são suportadas neste navegador | `src/hooks/notifications/usePushNotifications.tsx` |
| Permissão negada. Você não receberá notificações push. | `src/hooks/notifications/usePushNotifications.tsx` |
| Permissão de notificações negada | `src/hooks/notifications/useSecurityPushNotifications.tsx` |
| Seu navegador não suporta notificações push | `src/hooks/notifications/useSecurityPushNotifications.tsx` |
| Erro ao enviar notificação WhatsApp | `src/hooks/notifications/useWhatsAppNotification.tsx` |
| Falha ao medir: ${e.message} | `src/hooks/predictions/useMitigationActions.ts` |
| Falha ao registrar: ${e.message} | `src/hooks/predictions/useMitigationActions.ts` |
| Usuário não autenticado | `src/hooks/predictions/useMitigationActions.ts` |
| ${errors} integração(ões) com erro | `src/hooks/security/useIntegrationValidation.tsx` |
| Erro ao conectar ${result.name}: ${result.message} | `src/hooks/security/useIntegrationValidation.tsx` |
| Unknown integration: ${name} | `src/hooks/security/useIntegrationValidation.tsx` |
| Erro ao bloquear IP | `src/hooks/security/useRateLimitLogs.ts` |
| Erro ao limpar logs | `src/hooks/security/useRateLimitLogs.ts` |
| Falha no Protocolo de Auto-Reparo | `src/hooks/security/useSelfHealing.ts` |
| Step not found | `src/hooks/ui/useOnboarding.tsx` |
| User not found | `src/hooks/ui/useOnboarding.tsx` |
| User or progress not found | `src/hooks/ui/useOnboarding.tsx` |
| Erro ao iniciar câmera | `src/hooks/ui/useQRScanner.tsx` |
| Permissão de câmera negada | `src/hooks/ui/useQRScanner.tsx` |
| Nome do cenário é obrigatório | `src/lib/predictions/whatIfScenarios.ts` |
| Selecione ao menos uma mitigação antes de salvar | `src/lib/predictions/whatIfScenarios.ts` |
| Título obrigatório | `src/pages/AdminADR.tsx` |
| Erro ao gerar PDF | `src/pages/AdminTelemetria.tsx` |
| Erro ao limpar dados antigos | `src/pages/AdminTelemetria.tsx` |
| Nenhum dado | `src/pages/AdminTelemetria.tsx` |
| Nenhum dado para exportar | `src/pages/AdminTelemetria.tsx` |
| Erro ao aprovar | `src/pages/AprovacaoResetSenha.tsx` |
| Erro ao rejeitar | `src/pages/AprovacaoResetSenha.tsx` |
| Erro ao exportar: ${err instanceof Error ? err.message : String(err)} | `src/pages/AuditTrail.tsx` |
| Acesso Bloqueado | `src/pages/Auth.tsx` |
| Credenciais inválidas | `src/pages/Auth.tsx` |
| Senha comprometida | `src/pages/Auth.tsx` |
| Erro ao atualizar:  | `src/pages/Clientes.tsx` |
| Erro ao cadastrar:  | `src/pages/Clientes.tsx` |
| Erro ao remover:  | `src/pages/Clientes.tsx` |
| Erro na conciliação automática | `src/pages/ConciliacaoAutomatica.tsx` |
| Nome é obrigatório | `src/pages/ConciliacaoFinanceira.tsx` |
| Erro ao salvar configurações | `src/pages/Configuracoes.tsx` |
| ; import { Card, CardContent, CardHeader, CardTitle } from  | `src/pages/CotacaoMultiCanal.tsx` |
| Busque transportadoras primeiro | `src/pages/CotacaoMultiCanal.tsx` |
| Erro ao buscar transportadoras | `src/pages/CotacaoMultiCanal.tsx` |
| Informe o peso para cotar via API | `src/pages/CotacaoMultiCanal.tsx` |
| Informe o valor | `src/pages/CotacaoMultiCanal.tsx` |
| Selecione os estados de origem e destino | `src/pages/CotacaoMultiCanal.tsx` |
| NF de Simples Remessa obrigatória antes do despacho. Emita a NF primeiro. | `src/pages/Despachos.tsx` |
| Código não encontrado: ${result.text} | `src/pages/Envios.tsx` |
| Erro:  | `src/pages/Envios.tsx` |
| Nenhum dado para exportar | `src/pages/ExportacaoDados.tsx` |
| Erro ao remover:  | `src/pages/Fornecedores.tsx` |
| Erro:  | `src/pages/Fornecedores.tsx` |
| Erro:  | `src/pages/FretesInternos.tsx` |
| Erro ao atualizar role | `src/pages/GerenciamentoUsuarios.tsx` |
| Entrega não encontrada ou já alocada | `src/pages/GestaoBox.tsx` |
| Erro ao liberar boxes | `src/pages/GestaoBox.tsx` |
| Erro na alocação inteligente | `src/pages/GestaoBox.tsx` |
| Nenhum box livre disponível | `src/pages/GestaoBox.tsx` |
| Não há boxes livres | `src/pages/GestaoBox.tsx` |
| Erro inesperado durante a importação | `src/pages/ImportacaoMassa.tsx` |
| Falha ao importar ${errorCount} registros | `src/pages/ImportacaoMassa.tsx` |
| Erro na sincronização: ${err.message} | `src/pages/IntegracaoBitrix.tsx` |
| Conflito de versão — registro alterado por outro usuário, por favor recarregue | `src/pages/KanbanEntregas.tsx` |
| Erro crítico na transição de status | `src/pages/KanbanEntregas.tsx` |
| Não autenticado | `src/pages/LojaRecompensas.tsx` |
| BIOSYNC_CRITICAL: Limite excedido! | `src/pages/MapaRotas.tsx` |
| Erro:  | `src/pages/Ocorrencias.tsx` |
| Erro:  | `src/pages/Profile.tsx` |
| Erro ao gerar PDF | `src/pages/RelatorioPDF.tsx` |
| Sem dados de performance para exportar | `src/pages/Relatorios.tsx` |
| Erro ao redefinir senha | `src/pages/ResetPassword.tsx` |
| Link inválido ou expirado | `src/pages/ResetPassword.tsx` |
| HTTP ${r.status} | `src/pages/admin/QualityGate.tsx` |
| Erro ao solicitar reset | `src/pages/auth/AuthForgotPassword.tsx` |
| ; import { PasswordStrengthIndicator } from  | `src/pages/auth/AuthFormPanel.tsx` |
| Erro ao entrar com Google | `src/pages/auth/SocialLoginButtons.tsx` |
| Circuit Breaker is OPEN. Request rejected to prevent overload. | `src/services/resilience/CircuitBreaker.ts` |
| Auditoria: ${failures.length} falhas críticas detectadas. | `src/utils/systemTester.ts` |
| Circuit Breaker [${name}] is OPEN. Refusing request. | `supabase/functions/_shared/circuitBreaker.ts` |
| FIELD_ENCRYPTION_KEY missing or too short (fail-closed) | `supabase/functions/_shared/crypto.ts` |
| Request timed out after ${timeout}ms | `supabase/functions/_shared/fetch-with-timeout.ts` |
| host ${host} | `supabase/functions/_shared/safeFetch.ts` |
| host ${host} not in allow-list | `supabase/functions/_shared/safeFetch.ts` |
| invalid URL | `supabase/functions/_shared/safeFetch.ts` |
| private IPv4 ${host} | `supabase/functions/_shared/safeFetch.ts` |
| private IPv6 ${host} | `supabase/functions/_shared/safeFetch.ts` |
| scheme ${parsed.protocol} | `supabase/functions/_shared/safeFetch.ts` |
| escalated abaixo do threshold | `supabase/functions/accuracy-meta-monitor/escalation_test.ts` |
| fuzz não gerou nenhum escalonamento | `supabase/functions/accuracy-meta-monitor/escalation_test.ts` |
| … +146 linhas — lista completa em `context.json` | |

## J. Controle de acesso no código (checagens de perfil/permissão)

| Valor comparado | Arquivo |
|---|---|
| `assistant` | `src/components/ai/AIAssistant.tsx` |
| `user` | `src/components/ai/AIAssistant.tsx` |
| `default` | `src/components/notifications/BrowserNotificationPrompt.tsx` |
| `granted` | `src/components/notifications/BrowserNotificationPrompt.tsx` |
| `unsupported` | `src/components/notifications/BrowserNotificationPrompt.tsx` |
| `denied` | `src/components/notifications/SLANotificationSettings.tsx` |
| `granted` | `src/components/notifications/SLANotificationSettings.tsx` |
| `permissionId` | `src/components/security/PermissionMatrix.tsx` |
| `role` | `src/components/security/PermissionMatrix.tsx` |
| `denied` | `src/components/security/SecurityNotificationSettings.tsx` |
| `granted` | `src/components/security/SecurityNotificationSettings.tsx` |
| `admin` | `src/hooks/auth/useAuth.tsx` |
| `permissionCode` | `src/hooks/auth/usePermissions.ts` |
| `role` | `src/hooks/auth/useRole.ts` |
| `granted` | `src/hooks/logistics/useSLANotifications.tsx` |
| `denied` | `src/hooks/notifications/useNotifications.tsx` |
| `granted` | `src/hooks/notifications/useNotifications.tsx` |
| `granted` | `src/hooks/notifications/usePushNotifications.tsx` |
| `granted` | `src/hooks/notifications/useSecurityPushNotifications.tsx` |
| `admin` | `src/pages/GerenciamentoUsuarios.tsx` |
| `authenticated` | `supabase/functions/_shared/auth.ts` |
| `service_role` | `supabase/functions/_shared/auth.ts` |
| `admin` | `supabase/functions/lgpd-erase-user/index.ts` |
| `authenticated` | `supabase/functions/log-security-event/index.ts` |
| `service_role` | `supabase/functions/predict-delays-scheduled/index.ts` |
| `service_role` | `supabase/functions/resend-email/index.ts` |

## K. Testes como especificação (365 testes em 38 arquivos — nomes completos em `context.json`)

| Arquivo | Testes | Exemplos do que o sistema DEVE fazer |
|---|---|---|
| `src/lib/rodonaves/eventCodes.test.ts` | 29 | normalizeCode · normaliza nulos e vazios · preserva subníveis decimais · mantém códigos não numéricos intactos … |
| `src/lib/predictions/rootCauseAnalyzer.test.ts` | 21 | classifyMotivo · classifica %s corretamente · retorna  · normalizeMotivos … |
| `src/lib/rodonaves/latencyTrend.test.ts` | 21 | buildLatencyTrend · retorna vazio para entrada vazia · agrupa amostras da mesma hora em um único bucket · separa buckets por hora e ordena cronologicamente … |
| `src/lib/freightForecast.test.ts` | 18 | serieHistoricaFrete · devolve vazio sem entrada · soma por mes e completa mes vazio dentro da janela com zero · nao recua alem de 6 meses mesmo com dado antigo … |
| `src/lib/rodonaves/freightHealth.test.ts` | 17 | businessDaysBetween · ignora fins de semana · ignora feriados nacionais fixos · aceita feriados customizados … |
| `src/lib/rodonaves/gatewaySLO.test.ts` | 17 | normalizeTarget · usa padrões quando ausente · limita valores fora da faixa · tolera NaN … |
| `src/lib/rodonaves/sloAlerts.test.ts` | 17 | severityForStatus · mapeia status para severidade · evaluateSLOAlerts · dispara alerta crítico sem histórico … |
| `src/lib/rodonaves/sloReport.test.ts` | 16 | buildSLOReport · retorna relatório vazio sem amostras · agrupa por dia e gateway · calcula uptime e falhas corretamente … |
| `src/lib/supabaseEnv.test.ts` | 15 | limparValorEnv · remove as aspas duplas que a Vercel gravou dentro do valor · remove aspas simples e espacos em volta · remove barra final que duplicaria a barra das edge functions … |
| `src/components/security/SecurityOverviewPanel.regression.test.ts` | 14 | SecurityOverviewPanel — score computation · baseline score is 50 with no signals and MFA disabled · MFA adds 20 points · trusted-devices ratio adds up to 10 rounded … |
| `src/lib/rodonaves/capabilities.test.ts` | 14 | matriz de capacidades · não possui ações duplicadas · todo status possui rótulo · todo gateway referenciado possui perfil de latência … |
| `src/lib/predictions/mitigationRecommender.test.ts` | 11 | scoreImpact / priorityFromScore · bucket dominante recebe score 100 · bucket vazio recebe score 0 · bordas de prioridade são estáveis … |
| `src/hooks/common/useBulkActions.test.ts` | 9 | useBulkActions — selection state · toggle adds and removes an id idempotently · selectAll captures every id; clearSelection resets to empty · useBulkActions — mutation dispatch … |
| `src/hooks/rodonaves/useGatewayHealth.test.ts` | 9 | aggregateUptime · retorna vazio para histórico vazio · calcula uptime percentual corretamente · separa métricas por gateway … |
| `src/lib/predictions/whatIfCompare.test.ts` | 9 | compareScenarios — base · calcula deltas simples e vencedor por OTIF · empate em OTIF → desempata por confiança · empate total → tie … |
| `src/lib/predictions/whatIfSimulator.test.ts` | 9 | simulateWhatIf — comportamento base · retorna projeção neutra sem seleção · usa Δ histórico quando measured>0 · usa estimativa conservadora quando sem histórico … |
| `src/lib/conciliacaoImport.test.ts` | 8 | toISODate · formats Date objects · parses Brazilian dd/MM/yyyy strings · parses ISO strings … |
| `src/lib/mapFallback.test.ts` | 8 | deslocamentoEstavel · devolve sempre o mesmo ponto para a mesma entrega · separa entregas diferentes no mesmo estado · mantem o marcador dentro do raio de dispersao … |
| `src/lib/predictions/mitigationROI.test.ts` | 8 | mitigationROI · retorna relatório vazio sem registros · ignora ações não concluídas · calcula avg/best/worst e taxa de sucesso … |
| `src/lib/predictions/whatIfScenarios.test.ts` | 8 | whatIfScenarios · retorna lista vazia quando storage está vazio ou corrompido · salva um cenário e recupera na lista · rejeita salvar sem nome ou sem seleção … |
| `tests/contracts/nexus-contracts.spec.ts` | 8 | Nexus Contract Verification Suite · Carrier Webhook Contract · should validate a perfect payload · should reject payload with invalid status … |
| `tests/security/integrations-access.spec.ts` | 8 | Integração: freight_webhooks — RLS · SELECT anônimo é vazio (secret_key protegido) · INSERT anônimo é rejeitado · Integração: bitrix_sync_config — RLS … |
| `src/lib/centroDistribuicao.test.ts` | 7 | resolverCentroDistribuicao · usa o CD padrao quando o ambiente nao define nada · usa as coordenadas configuradas quando sao validas · ignora configuracao pela metade … |
| `src/lib/formatters.parse.test.ts` | 7 | parseLocaleNumber · parses Brazilian format with thousands separator · parses US format when both separators are present · treats a lone comma as the decimal separator (BR-first) … |
| `src/lib/predictions/mitigationRerank.test.ts` | 7 | rerankByROI — comportamento base · retorna score original quando ROI é null · aplica boost para categorias com Δ OTIF positivo · penaliza categorias com Δ OTIF negativo … |
| `src/hooks/rodonaves/useSLOSnapshots.test.ts` | 6 | aggregateSnapshots · retorna vazio sem linhas · agrupa por gateway e conta dias · conta dias violados e pior P95 … |
| `tests/security/rls-access.spec.ts` | 6 | RLS · leitura anônima bloqueada em tabelas sensíveis · SELECT em ${table} retorna [] ou 401/403 · RLS · escrita anônima bloqueada em tabelas sensíveis · INSERT em ${table} é rejeitado … |
| `src/components/dashboard/alertsFilter.test.ts` | 5 | filtrarPorLimiar · nunca esconde alerta sem delta medido · aplica o limiar so a quem tem delta · mantem alerta cujo delta empata com o limiar … |
| `tests/unit/modules-integrity.spec.ts` | 5 | Freight-Quest Module Integrity · Logistics Engine · should correctly calculate delivery dates with margin · Financial Core … |
| `src/lib/validations.test.ts` | 4 | isValidEmail · mantem o veredito da implementacao anterior · trata vazio como valido (campo opcional) · responde de imediato a entrada patologica que travava a regex |
| `tests/integration/webhooks.spec.ts` | 4 | Webhook Simulation Suite (real _shared logic) · should validate carrier status updates through the production contract · should refuse events outside the contract · should reject missing required fields (production fail-closed) |
| `src/utils/systemTester.spec.ts` | 3 | System Integrity Tests · should pass all checks when system is healthy · should detect database connectivity failure |
| `tests/e2e/critical-paths.spec.ts` | 3 | Nexus Core E2E - Critical Path Validation · Complete login to dashboard and shipment creation flow · Responsiveness and Error State resilience |
| `tests/e2e/dashboard.spec.ts` | 3 | Dashboard E2E Flow · should navigate through main modules · should handle error states gracefully |
| `tests/fuzzing/edge-functions.spec.ts` | 3 | Edge Function Fuzzing Suite · should reject invalid UUIDs in payloads · should simulate malformed JSON processing |
| `tests/integration/fuzzing.spec.ts` | 3 | Edge Function Fuzzing Suite (real _shared validators) · should reject invalid UUIDs and malformed required strings · should reject malformed JSON and non-numeric required fields via production logic |
| `tests/integration/massive-simulation.spec.ts` | 3 | Massive Webhook & Edge Function Simulation (10,000 scenarios) · should exercise the real production validators across 10,000 randomized scenarios · should normalize BR and US numeric formats via the shared parser |
| `tests/load/backend-stress.spec.ts` | 2 | Load & Stress Performance Simulation · should measure response time for concurrent requests simulation |

## L. Eventos de webhook tratados (contratos com sistemas externos)

| Evento | Arquivo |
|---|---|
| `UPDATE` | `src/components/coletas/PickupDetailsDialog.tsx` |
| `messages.upsert` | `supabase/functions/nexus-webhook-receiver/index.ts` |

## M. Efeitos colaterais (e-mail, SMS, cobrança, fila — não são idempotentes por padrão)

| Chamada | Arquivo |
|---|---|
| `.add("splash-hidden"` | `src/main.tsx` |
| `invoke(` | `src/components/auth/PasswordStrengthIndicator.tsx` |
| `invoke(` | `src/components/common/RealtimeStatus.tsx` |
| `invoke(` | `src/components/dashboard/LogisticsMapWidget.tsx` |
| `invoke(` | `src/components/freight/ResponseConsole.tsx` |
| `invoke(` | `src/components/predictions/DigestPreviewPanel.tsx` |
| `notify` | `src/components/predictions/PredictionAccuracyTimeline.tsx` |
| `notify_email` | `src/components/predictions/PredictionAccuracyTimeline.tsx` |
| `notify_whatsapp` | `src/components/predictions/PredictionAccuracyTimeline.tsx` |
| `invoke(` | `src/components/rodonaves/RTECustomerManager.tsx` |
| `invoke(` | `src/components/shipping/DeliveryReceiptUpload.tsx` |
| `invoke(` | `src/components/transportadoras/NormalizationMapping.tsx` |
| `.add("dark"` | `src/features/preferences/hooks/useUserPreferences.ts` |
| `.add("font-dyslexic"` | `src/features/preferences/hooks/useUserPreferences.ts` |
| `.add("high-contrast"` | `src/features/preferences/hooks/useUserPreferences.ts` |
| `.add("reduced-motion"` | `src/features/preferences/hooks/useUserPreferences.ts` |
| `invoke(` | `src/hooks/analytics/useScheduledReports.tsx` |
| `invoke(` | `src/hooks/auth/useNewDeviceDetection.tsx` |
| `invoke(` | `src/hooks/integrations/useBitrixEntregaSync.tsx` |
| `invoke(` | `src/hooks/integrations/useClientWebhooks.tsx` |
| `invoke(` | `src/hooks/integrations/useEvolutionWhatsApp.tsx` |
| `invoke(` | `src/hooks/integrations/useExternalDbBridge.tsx` |
| `invoke(` | `src/hooks/integrations/useGeocoding.tsx` |
| `invoke(` | `src/hooks/logistics/useDelayPrediction.tsx` |
| `invoke(` | `src/hooks/logistics/useDeliveryRoutes.tsx` |
| `invoke(` | `src/hooks/logistics/useLalamoveOrders.tsx` |
| `invoke(` | `src/hooks/logistics/useLalamoveTracking.tsx` |
| `invoke(` | `src/hooks/logistics/useMelhorEnvio.tsx` |
| `notify_email` | `src/hooks/logistics/usePredictionAccuracySettings.ts` |
| `notify_whatsapp` | `src/hooks/logistics/usePredictionAccuracySettings.ts` |
| `invoke(` | `src/hooks/logistics/useRodonavesTracking.tsx` |
| `invoke(` | `src/hooks/logistics/useRodonavesWebhook.tsx` |
| `notify` | `src/hooks/logistics/useSLAAlerts.tsx` |
| `notify` | `src/hooks/logistics/useSLANotifications.tsx` |
| `notifyListeners` | `src/hooks/logistics/useSmartAlerts.tsx` |
| `invoke(` | `src/hooks/logistics/useSmartCarrierSelection.tsx` |
| `invoke(` | `src/hooks/notifications/useWhatsAppNotification.tsx` |
| `sendNotification` | `src/hooks/notifications/useWhatsAppNotification.tsx` |
| `invoke(` | `src/hooks/rodonaves/useGatewayHealth.ts` |
| `invoke(` | `src/hooks/security/useIntegrationValidation.tsx` |
| `invoke(` | `src/hooks/security/useSecurityEvents.ts` |
| `notify_email` | `src/integrations/supabase/types.ts` |
| `notify_whatsapp` | `src/integrations/supabase/types.ts` |
| `.add("outros"` | `src/lib/predictions/rootCauseAnalyzer.ts` |
| `invoke(` | `src/pages/AprovacaoResetSenha.tsx` |
| `invoke(` | `src/pages/IntegracaoBitrix.tsx` |
| `invoke(` | `src/pages/auth/authUtils.ts` |
| `invoke(` | `src/utils/systemTester.ts` |
| `invoke(` | `supabase/functions/accuracy-meta-monitor/index.ts` |
| `notify_email` | `supabase/functions/accuracy-meta-monitor/index.ts` |
| `notify_whatsapp` | `supabase/functions/accuracy-meta-monitor/index.ts` |
| `notify_email` | `supabase/functions/accuracy-meta-monitor/simulator.ts` |
| `notify_whatsapp` | `supabase/functions/accuracy-meta-monitor/simulator.ts` |
| `notify_email` | `supabase/functions/accuracy-meta-monitor/simulator_test.ts` |
| `notify_whatsapp` | `supabase/functions/accuracy-meta-monitor/simulator_test.ts` |
| `invoke(` | `supabase/functions/accuracy-weekly-digest/index.ts` |
| `notify_email` | `supabase/functions/accuracy-weekly-digest/index.ts` |
| `notify_alert` | `supabase/functions/bitrix24-integration/index.ts` |
| `notify` | `supabase/functions/ingest-biosync/index.ts` |
| `notify_alert` | `supabase/functions/ingest-biosync/index.ts` |
| `invoke(` | `supabase/functions/nexus-webhook-receiver/index.ts` |
| `invoke(` | `supabase/functions/predict-delays/index.ts` |
| `invoke(` | `supabase/functions/predict-delays-scheduled/index.ts` |
| `notify_status_change` | `supabase/functions/webhook-status/index.ts` |
| `notifying` | `supabase/functions/webhook-status/index.ts` |
| `notify_ocorrencia_trigger` | `supabase/migrations/20251220122500_notifications_table.sql` |
| `notify_on_ocorrencia` | `supabase/migrations/20251220122500_notifications_table.sql` |
| `notify_on_sla_violation` | `supabase/migrations/20251220122500_notifications_table.sql` |
| `notify` | `supabase/migrations/20251220131539_fa5f8650-9dcb-4a17-bd00-f7ee9de61e27.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20251220131539_fa5f8650-9dcb-4a17-bd00-f7ee9de61e27.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20251220131539_fa5f8650-9dcb-4a17-bd00-f7ee9de61e27.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20251220131539_fa5f8650-9dcb-4a17-bd00-f7ee9de61e27.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20251220131539_fa5f8650-9dcb-4a17-bd00-f7ee9de61e27.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20251220131539_fa5f8650-9dcb-4a17-bd00-f7ee9de61e27.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20251220140342_379b1bd3-1c54-4a5d-b031-d7c0a1e4eee7.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20251220140342_379b1bd3-1c54-4a5d-b031-d7c0a1e4eee7.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20251220140342_379b1bd3-1c54-4a5d-b031-d7c0a1e4eee7.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20251220140342_379b1bd3-1c54-4a5d-b031-d7c0a1e4eee7.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20251220140342_379b1bd3-1c54-4a5d-b031-d7c0a1e4eee7.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20251220140342_379b1bd3-1c54-4a5d-b031-d7c0a1e4eee7.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20260513190513_93f4f96d-ec2d-456b-9a12-801011104b51.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20260513190513_93f4f96d-ec2d-456b-9a12-801011104b51.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20260513190513_93f4f96d-ec2d-456b-9a12-801011104b51.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20260513190513_93f4f96d-ec2d-456b-9a12-801011104b51.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20260513190513_93f4f96d-ec2d-456b-9a12-801011104b51.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20260513190513_93f4f96d-ec2d-456b-9a12-801011104b51.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20260515144449_7b704312-b9da-4f9c-91bf-0f0e98702fec.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20260515144449_7b704312-b9da-4f9c-91bf-0f0e98702fec.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20260515144449_7b704312-b9da-4f9c-91bf-0f0e98702fec.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20260515144449_7b704312-b9da-4f9c-91bf-0f0e98702fec.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20260515144449_7b704312-b9da-4f9c-91bf-0f0e98702fec.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20260515144449_7b704312-b9da-4f9c-91bf-0f0e98702fec.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20260628122812_3664dd37-7d23-42e1-a906-e5c1c6128ba6.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20260628122812_3664dd37-7d23-42e1-a906-e5c1c6128ba6.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20260628122812_3664dd37-7d23-42e1-a906-e5c1c6128ba6.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20260628122812_3664dd37-7d23-42e1-a906-e5c1c6128ba6.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20260628122812_3664dd37-7d23-42e1-a906-e5c1c6128ba6.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20260628122812_3664dd37-7d23-42e1-a906-e5c1c6128ba6.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20260711153045_42d1824a-1b6a-485d-bb4f-0b19e2064e9b.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20260711153045_42d1824a-1b6a-485d-bb4f-0b19e2064e9b.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20260711153045_42d1824a-1b6a-485d-bb4f-0b19e2064e9b.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20260711153045_42d1824a-1b6a-485d-bb4f-0b19e2064e9b.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20260711153045_42d1824a-1b6a-485d-bb4f-0b19e2064e9b.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20260711153045_42d1824a-1b6a-485d-bb4f-0b19e2064e9b.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20260711153637_9a5686f4-685e-4db1-b3e6-012d866990bf.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20260711153637_9a5686f4-685e-4db1-b3e6-012d866990bf.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20260711153637_9a5686f4-685e-4db1-b3e6-012d866990bf.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20260711153637_9a5686f4-685e-4db1-b3e6-012d866990bf.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20260711153637_9a5686f4-685e-4db1-b3e6-012d866990bf.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20260711153637_9a5686f4-685e-4db1-b3e6-012d866990bf.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20260711183644_f0a68bec-ea27-4334-8540-2f34861aa7b1.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20260711183644_f0a68bec-ea27-4334-8540-2f34861aa7b1.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20260711183644_f0a68bec-ea27-4334-8540-2f34861aa7b1.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20260711183644_f0a68bec-ea27-4334-8540-2f34861aa7b1.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20260711183644_f0a68bec-ea27-4334-8540-2f34861aa7b1.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20260711183644_f0a68bec-ea27-4334-8540-2f34861aa7b1.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20260711192651_6b921c95-3007-4e58-b2f6-67aa43c8d7bb.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20260711192651_6b921c95-3007-4e58-b2f6-67aa43c8d7bb.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20260711192651_6b921c95-3007-4e58-b2f6-67aa43c8d7bb.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20260711192651_6b921c95-3007-4e58-b2f6-67aa43c8d7bb.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20260711192651_6b921c95-3007-4e58-b2f6-67aa43c8d7bb.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20260711192651_6b921c95-3007-4e58-b2f6-67aa43c8d7bb.sql` |
| `notify_email` | `supabase/migrations/20260723150138_12d335d9-01b2-46d8-b13a-28fc7c5b018d.sql` |
| `notify_whatsapp` | `supabase/migrations/20260723150138_12d335d9-01b2-46d8-b13a-28fc7c5b018d.sql` |
| `notify_on_ocorrencia` | `supabase/migrations/20260831120100_drop_legacy_objects_d2.sql` |
| `notify_on_sla_violation` | `supabase/migrations/20260831120100_drop_legacy_objects_d2.sql` |
| `notify_ocorrencia_trigger` | `supabase/migrations/20260901000001_remediacao_destino.sql` |
| `notify_coleta_atrasada` | `supabase/migrations/20261118220000_fix_notif_type_enum_cast.sql` |
| `notify_conquista_desbloqueada` | `supabase/migrations/20261118220000_fix_notif_type_enum_cast.sql` |
| `notify_entrega_atrasada` | `supabase/migrations/20261118220000_fix_notif_type_enum_cast.sql` |
| `notify_entrega_concluida` | `supabase/migrations/20261118220000_fix_notif_type_enum_cast.sql` |
| `notify_frete_interno_concluido` | `supabase/migrations/20261118220000_fix_notif_type_enum_cast.sql` |
| `notify_ocorrencia_registrada` | `supabase/migrations/20261118220000_fix_notif_type_enum_cast.sql` |

## N. Regras citadas em comentários do código

| Comentário | Arquivo |
|---|---|
| A regra só protege o fast-refresh do dev server; não se aplica a esta pasta. | `eslint.config.js` |
| Show prompt after a short delay if permission not granted and not dismissed | `src/components/notifications/BrowserNotificationPrompt.tsx` |
| apenas por administradores) e consumo de error budget por gateway. | `src/components/rodonaves/RTEGatewaySLOPanel.tsx` |
| Check single permission | `src/components/security/PermissionGate.tsx` |
| Check if role has permission | `src/components/security/PermissionMatrix.tsx` |
| Toggle permission | `src/components/security/PermissionMatrix.tsx` |
| Logistics & Business | `src/hooks/index.ts` |
| @description Importação de CSV e Excel com validação Zod | `src/hooks/common/useImportData.ts` |
| Includes magic-byte validation for security (Dimension 19). | `src/hooks/data/useDocumentUpload.ts` |
| Magic byte validation for basic types | `src/hooks/data/useDocumentUpload.ts` |
| pague `xp_reward`/`coins_reward` (o unico em user_achievements apenas | `src/hooks/gamification/useGamification.ts` |
| Add urgency flag based on deadline | `src/hooks/logistics/useBoxManagement.tsx` |
| Business Rule Engine — evaluates rules against entity data and executes actions. | `src/hooks/logistics/useBusinessRuleEngine.tsx` |
| Debounced Batch Logging for high-frequency rule execution | `src/hooks/logistics/useBusinessRuleEngine.tsx` |
| Rule action failed — silent fail for background processing | `src/hooks/logistics/useBusinessRuleEngine.tsx` |
| Request notification permission | `src/hooks/logistics/useSLANotifications.tsx` |
| Check current permission status | `src/hooks/logistics/useSLANotifications.tsx` |
| Request permission | `src/hooks/logistics/useSLANotifications.tsx` |
| Check coletas approaching 48h limit | `src/hooks/logistics/useSmartAlerts.tsx` |
| Request browser notification permission | `src/hooks/notifications/useNotifications.tsx` |
| Check notification permission on mount | `src/hooks/notifications/useSecurityPushNotifications.tsx` |
| Request notification permission | `src/hooks/notifications/useSecurityPushNotifications.tsx` |
| O histórico é somente leitura no cliente; a gravação ocorre no backend. | `src/hooks/rodonaves/useGatewayHealth.ts` |
| * Leitura: qualquer autenticado. Escrita: apenas administradores. | `src/hooks/rodonaves/useSLOTargets.ts` |
| Fetch rate limit logs | `src/hooks/security/useRateLimitLogs.ts` |
| Check rate limit status | `src/hooks/security/useSecurityEvents.ts` |
| Check for camera permission | `src/hooks/ui/useQRScanner.tsx` |
| `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL` porque o valor | `src/lib/supabaseEnv.ts` |
| * Painel de env nao tem validacao; o codigo precisa ter. | `src/lib/supabaseEnv.ts` |
| Custom CNPJ validation with digit verification | `src/lib/validations.ts` |
| * Implementa as três regras de negócio derivadas do mapa de EventCodes: | `src/lib/rodonaves/freightHealth.ts` |
| - ATRASADO: dias úteis decorridos desde a emissão > prazo previsto, | `src/lib/rodonaves/freightHealth.ts` |
| Guarda de segurança: no máximo 10 anos de iteração. | `src/lib/rodonaves/freightHealth.ts` |
| lançar exceção — o painel nunca deve quebrar por dado sujo do banco. | `src/lib/rodonaves/latencyTrend.ts` |
| Weight: 70% Price, 30% Deadline | `src/pages/CotacaoMultiCanal.tsx` |
| P18: o RPC update_user_streak estava retornando 403 (permissão negada | `src/services/api/authService.ts` |
| Resume if suspended (required for user interaction policy) | `src/utils/celebrationSounds.ts` |
| Aceita apenas role 'authenticated' (com sub) ou 'service_role' — o anon key é | `supabase/functions/_shared/auth.ts` |
| Logs validation attempts to the database for auditing and monitoring. | `supabase/functions/_shared/contract-validator.ts` |
| Lightweight validation helpers for edge functions (no Zod dependency in Deno). | `supabase/functions/_shared/validate.ts` |
| disparo deve escalar para WhatsApp mesmo com toggle desligado. | `supabase/functions/accuracy-meta-monitor/escalation.ts` |
| Decide se o próximo alerta para (user, carrier) deve escalar para WhatsApp | `supabase/functions/accuracy-meta-monitor/escalation.ts` |
| - Email exige formato mínimo `x@y.z`. | `supabase/functions/accuracy-meta-monitor/simulator.ts` |
| Contract Validation | `supabase/functions/carrier-webhook-receiver/index.ts` |
| Rate limit configuration | `supabase/functions/check-rate-limit/index.ts` |
| P15: smoke test — check-rate-limit | `supabase/functions/check-rate-limit/index_test.ts` |
| Persiste quando ?persist=true (cron horário) OU retorna somente snapshot atual (painel admin). | `supabase/functions/db-health-snapshot/index.ts` |
| Persist to local DB (fire-and-forget) only if not ok | `supabase/functions/external-db-bridge/index.ts` |
| Mesma base de dados (OSM), sem token e sem limite de faturamento. | `supabase/functions/geocode-address/index.ts` |
| A politica de uso do Nominatim pede no maximo 1 consulta por segundo. | `supabase/functions/geocode-address/index.ts` |
| P15: smoke test — get-mapbox-token must not leak secret token | `supabase/functions/get-mapbox-token/index_test.ts` |
| P15: smoke test — health endpoint must always respond and never leak secrets | `supabase/functions/health/index_test.ts` |
| P13: rate limit per IP (100 req/min for webhooks) | `supabase/functions/lalamove-webhook/index.ts` |
| Contract Validation | `supabase/functions/lalamove-webhook/index.ts` |
| P15: smoke test — lgpd-erase-user must require auth | `supabase/functions/lgpd-erase-user/index_test.ts` |
| Contract Validation | `supabase/functions/nexus-webhook-receiver/index.ts` |
| P15: Deno test — nexus-webhook-receiver rate limit + HMAC (when secret set) | `supabase/functions/nexus-webhook-receiver/index_test.ts` |
| 400 (contract), 401 (invalid sig if secret set), or 429 (rate limit) — never 5xx | `supabase/functions/nexus-webhook-receiver/index_test.ts` |
| Contract Validation — transportadora_id is optional (omitted for new/unsaved carriers) | `supabase/functions/normalize-freight-response/index.ts` |
| Contract Validation | `supabase/functions/ocr-receipt-processor/index.ts` |
| Consistency validation: set status only after processing | `supabase/functions/ocr-receipt-processor/index.ts` |
| Limit to 10 requests per minute | `supabase/functions/predict-delays/index.ts` |
| P15: smoke test — resend-email must never leak API key | `supabase/functions/resend-email/index_test.ts` |
| Malha indisponível não deve impedir a cotação — retorna indeterminado. | `supabase/functions/rodonaves-api/index.ts` |
| derrubar o health-check em si — são apenas logadas. | `supabase/functions/rodonaves-api/index.ts` |
| NEW: Batch by params (no date required) | `supabase/functions/rodonaves-api/index.ts` |
| P13: rate limit | `supabase/functions/rodonaves-webhook/index.ts` |
| Contract Validation | `supabase/functions/rodonaves-webhook/index.ts` |
| P11: smoke test — secure-store must require auth and never leak the FIELD_ENCRYPTION_KEY | `supabase/functions/secure-store/index_test.ts` |
| P15: smoke test — send-password-reset must not leak Resend API key | `supabase/functions/send-password-reset/index_test.ts` |
| Use ip-api.com (free, no API key required, 45 req/min limit) | `supabase/functions/validate-login/index.ts` |
| Handles notifying external clients about shipment status changes with HMAC signature validation. | `supabase/functions/webhook-status/index.ts` |
| P15: smoke test — webhook-status must not leak secrets | `supabase/functions/webhook-status/index_test.ts` |
