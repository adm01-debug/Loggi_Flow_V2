# 2.8 — Ranking com embed/user_levels inválido e período não tratado

- **Problema**: consulta usa relations/cols não existentes e período fixo; conquistas
  mostram 0.
- **Fix**: realinhar a query Ranking às views/tabelas reais; tratar período.
- **Status**: resolvido
- **Verificado**: Fix PR #212: Ranking usa RPC get_leaderboard (full_name/avatar/achievements reais) + user_levels.rank_display p/ badge; período monthly/weekly filtra por last_activity_date no front. typecheck/eslint/build verdes.
