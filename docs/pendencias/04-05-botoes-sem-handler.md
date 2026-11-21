# 4.5 — Botões sem handler

- **Origem**: seção 4 (blocos) da auditoria 2026-11-20.
- **Estado real**: CONCLUÍDO via PR #256 (`daa5f481`, 2026-11-21).
- **O que foi feito**: todos os botões inventariados ganharam handler real —
  `ExpeditionDetailsDialog` "Log Detalhado" → aba histórico; `AuditTrailViewer` restaurar em massa → `upsert` do `old_data` de logs DELETE (com contagem de sucesso/falhas); `IntegracaoBitrix` "Abrir CRM" → webhook configurado; `RastreamentoPublico` "CENTRAL" → WhatsApp de suporte; `FreightTableManager` "Importar CSV" → parse/validação por linha via `onAdd`; `RotaResultsList` "Contato"/"Email" → dados reais de `transportadoras` (tipo `useTransportadoraRotas` ampliado com `email_comercial`/`contato_comercial`/`whatsapp_operacional`); `NotificationCenter`/`UserNotificationCenter` → navegação para configurações; `AlertsPanel` → `/admin/telemetria`; `PerformanceChart` refresh (spinner) e maximizar (Fullscreen API); `TelemetryViewer` chevron expande/recolhe detalhe; `LogisticaReversa` Nova Solicitação (hook `create`), filtros por status, exportar CSV e diálogo de detalhes; `MobileQuickActions` AIAssistant → Sheet real do assistente; `Configuracoes` tab ativa via `?tab=`.
- **Verificação**: `tsc --noEmit` 0 erros, warning budget 103/105, vitest 306/306, build de produção OK, CI 100% verde, merge + deploy de produção `success`.
- **Status**: CONCLUÍDO (2026-11-21)
