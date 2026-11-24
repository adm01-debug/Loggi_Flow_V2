# Política de Soft Delete — LogiFlow

## 📝 Visão Geral
O LogiFlow utiliza a estratégia de **Soft Delete** (Exclusão Lógica) para garantir a integridade referencial e possibilitar a recuperação de dados em caso de exclusão acidental.

## 🛠️ Implementação Técnica
Todas as tabelas que exigem histórico ou possuem relacionamentos complexos utilizam a coluna `deleted_at` (TIMESTAMP WITH TIME ZONE).

### Hook de Consumo
O hook `useSoftDelete` deve ser utilizado no frontend para gerenciar as exclusões.

```typescript
const { softDelete } = useSoftDelete('minha_tabela');
```

## 📋 Tabelas com Soft Delete
| Tabela | Motivo |
| --- | --- |
| `entregas` | Necessário manter histórico de fretes para auditoria financeira. |
| `coletas` | Histórico de coleta e vínculo com a entrega gerada. |
| `clientes` | Cadastro referenciado por entregas e coletas. |
| `fornecedores` | Cadastro referenciado por pagamentos e lançamentos. |
| `transportadoras` | Não podem ser excluídas fisicamente se houverem entregas vinculadas. |
| `fretes_internos` | Histórico de custo interno por período. |

A lista acima é derivada de `src/integrations/supabase/types.ts` (tabela com `deleted_at` na `Row`) e é
verificada por `npm run validate:soft-delete` (`scripts/ci/check-soft-delete.mjs`), que roda na CI em
`.github/workflows/ci-nexus.yml`: `.delete()` em qualquer uma dessas tabelas dentro de `src/` reprova a PR.

## 🔍 Regras de Consulta
1.  **Views:** Todas as tabelas com soft delete devem ter uma view `v_active_<tabela>` que filtra `deleted_at IS NULL`.
2.  **RLS:** As políticas de RLS devem, por padrão, filtrar registros onde `deleted_at` não é nulo para usuários não-administradores.

## ♻️ Purge Policy
Registros com `deleted_at` superior a **365 dias** são elegíveis para exclusão física via job de manutenção mensal, desde que não haja impedimento legal ou financeiro.
