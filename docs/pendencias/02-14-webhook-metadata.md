# 2.14 — webhook-status insere `metadata` não existente em webhook_deliveries

- **Problema**: insert em webhook_deliveries usa coluna `metadata` que não existe
  (colunas: id/webhook_id/event_type/payload/response_status/success/error_message/created_at).
- **Fix**: remover metadata do insert.
- **Status**: pendente
