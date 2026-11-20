# 2.5 — predict-delays usa profiles(phone) inexistente + fallback morto

- **Problema**: subconsulta `profiles(phone)` (coluna não existe) + fallback p/
  projeto de alias morto → coleta de tel p/ alerta de atraso pode falhar.
- **Fix**: usar rota whatsapp real (user_notification_preferences / transportadora.whatsapp).
- **Status**: pendente
