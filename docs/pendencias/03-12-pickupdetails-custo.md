# 3.12 — PickupDetailsDialog custo fixo

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/components/coletas/PickupDetailsDialog.tsx` custo "estimado" por fórmula fixa (`peso*1.5 + (lalamove?25:15)`) e docs GE inexistentes (Nota_Fiscal.pdf/Romaneio_Grid.xlsx).
- **Resolução**: custo exibido a partir de `custo_estimado`/`custo_real` reais da tabela `coletas` (preferindo o real); sem valor → `—`. GED_Nexus trocado por empty-state honesto (não há tabela de documentos no schema).
- **Evidência**: PR #237 (`df04cb6c`) — CI verde e deploy em produção "Deployment has completed".
- **Status**: CONCLUÍDO
