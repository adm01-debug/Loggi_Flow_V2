# Regras de negócio — Loggi Flow V2

> Extraídas de código/banco em main @ 190f724e (2026-11-20) e da auditoria
> `docs/audit/2026-11-20_funcionalidades_nao_implementadas.md`. Cada regra cita a evidência.

## Entidades e ciclo de vida

- **Entregas** (`entregas`): status com transição via Kanban; cadastro por OCR,
  Lalamove, webhooks de transportadora. Evidência: `src/components/kanban/*`,
  `supabase/functions/ocr-receipt-processor`, `lalamove-api`, `carrier-webhook-receiver`.
- **Coletas** (`coletas`): `data_prevista_coleta`/`data_efetiva_coleta`; transição p/ `em_transito`
  registra `data_efetiva_coleta` (front). Evidência: `PickupDetailsDialog.tsx:83,94`,
  migration `20251215123841_...:55`.
- **Fretes internos** (`fretes_internos`): sem coluna `deleted_at`; soft delete não existe.
  Evidência: item 2.7 (removido filtro inválido), `src/pages/FretesInternos.tsx`.

## Notificações

- Preferências em `user_notification_preferences` (`notifications_whatsapp`, `notifications_sla`,
  `notifications_email` etc.); telefone em `prediction_accuracy_settings.whatsapp_phone`.
  Evidência: `predict-delays/index.ts:314-343`.
- Envio via edge function `whatsapp-notification` (`action: send_delay_alert`).

## Gamificação

- XP concedido via RPC `add_user_xp` (grant a autenticated pelo migration `20261120120000`).
  Evidência: item 2.13; `useGamification.ts:159`, `useOnboarding.tsx:148`.
- Ranking via RPC `get_leaderboard` + `user_levels.rank_display`. Evidência: item 2.8.
- `user_achievements` usa `achievement_id` (FK). Evidência: item 9.15 legada removida (#224).

## Integrações

- **Rodonaves**: clientes via actions `customer-search|full|list|taxid|id`, `address-list`,
  `address-create`; wrapper `{ success, data }`; CNPJ remetente default via secret
  `RODONAVES_CNPJ_REMETENTE`. Evidência: itens 2.11 e 2.15.
- **Bitrix24**: action `test-connection` tratada. Evidência: item 2.12.
- **Webhooks**: `webhook_deliveries(id, webhook_id, event_type, payload, response_status,
success, error_message, created_at)` — sem coluna `metadata`. Evidência: item 2.14.

## Segurança / acesso

- MFA: obrigatório no login (PR #209). Passkeys/permissões são cadastro sem efeito real (7.2/7.3).
  Evidência: `src/pages/Auth.tsx`, `src/components/auth/ProtectedRoute.tsx`.
- RLS por tabela; `user_ranks` legível por anon (7.16).

> Conforme itens novos forem verificados, adicione regras aqui (sempre com evidência).
