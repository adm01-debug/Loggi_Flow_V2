# 2.7 — FretesInternos consulta deleted_at em fretes_internos (sem coluna)

- **Problema**: `.is('deleted_at', null)` em tabela sem coluna deleted_at.
- **Fix**: remover filtro inválido; usar soft delete real se houver (validar).
- **Status**: achado — sem migration de deleted_at, tratar como achado
