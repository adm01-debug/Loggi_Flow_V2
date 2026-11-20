# 2.8 — Ranking com embed/user_levels inválido e período não tratado

- **Problema**: consulta usa relations/cols não existentes e período fixo; conquistas
  mostram 0.
- **Fix**: realinhar a query Ranking às views/tabelas reais; tratar período.
- **Status**: pendente de re-auditoria + verificação runtime (sem acesso DB)
