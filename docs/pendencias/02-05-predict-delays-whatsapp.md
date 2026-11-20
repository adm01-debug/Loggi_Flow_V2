# 2.5 — predict-delays usa profiles(phone) inexistente + fallback morto

- **Problema**: subconsulta `profiles(phone)` (coluna não existe) + fallback p/
  projeto de alias morto → coleta de tel p/ alerta de atraso pode falhar.
- **Fix**: usar rota whatsapp real (user_notification_preferences / transportadora.whatsapp).
- **Status**: resolvido
- **Verificado**: fix em main via #211 (merged 2026-11-20).
  - `predict-delays/index.ts:314-343`: consulta `user_notification_preferences`
    (`notifications_whatsapp`+`notifications_sla`) e `prediction_accuracy_settings`
    (`whatsapp_phone`+`notify_whatsapp`), sem `profiles(phone)`.
  - Envio real via `supabase.functions.invoke("whatsapp-notification", { action:"send_delay_alert" })`.
  - typecheck/eslint/build verdes na PR; CI main verde pós-merge (#224).
