# 2.10 — kanban_history embed `action_by_user:profiles(display_name, avatar_url)`

- **Problema**: profiles não tem `display_name`; action_by é FK→auth.users.
- **Fix**: usar email/full_name real ou auth.users name; validar coluna de timestamp.
- **Status**: pendente
