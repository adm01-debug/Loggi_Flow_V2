# 📋 Documentação Técnica - Loggi-Flow

> Levantamento completo de funcionalidades e ferramentas utilizadas no sistema de gestão logística com gamificação.

> **ATENCAO**: este documento **nao tem data de origem confirmada** e descreve uma arvore anterior a
> reorganizacao de hooks por dominio (ADR `docs/adr/0008-*`). **Os caminhos de `src/hooks/` citados aqui
> podem estar na pasta errada.** A fonte autoritativa de "onde uma coisa vive" e
> `docs/contexto/codigo/INDEX.md` na branch `contexto`, como manda `docs/contexto/00-INDEX.md`.
> Os erros ja mapeados estao em `docs/qa/03-ACHADOS.md` (H-02) e nas etapas 245-247 do plano de QA. Para o
> estado real do sistema, use `docs/prod-readiness.md`.

**Stack Principal:** React 18 + TypeScript + Vite + Supabase + Tailwind CSS + Shadcn/UI

---

## 📑 Índice

1. [Segurança & Autenticação](#-segurança--autenticação)
2. [Gamificação](#-gamificação)
3. [Analytics & Relatórios](#-analytics--relatórios)
4. [Gestão Logística](#-gestão-logística)
5. [Rastreamento & Mapas](#️-rastreamento--mapas)
6. [Notificações](#-notificações)
7. [Inteligência Artificial](#-inteligência-artificial)
8. [UI/UX Components](#-uiux-components)
9. [PWA & Mobile](#-pwa--mobile)
10. [Automação & Integrações](#-automação--integrações)
11. [Onboarding](#-onboarding)
12. [Dashboard Personalizado](#️-dashboard-personalizado)
13. [Internacionalização](#-internacionalização)
14. [Cadastros](#-cadastros)
15. [Testes](#-testes)
16. [Dependências Principais](#-dependências-principais)

---

## 🔐 Segurança & Autenticação

| Funcionalidade                     | Ferramenta/Biblioteca     | Arquivos Principais                                                                     | Descrição                                           |
| ---------------------------------- | ------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Autenticação (Login/Signup)**    | Supabase Auth             | `src/hooks/auth/useAuth.tsx`, `src/pages/Auth.tsx`                                      | Sistema completo de login/registro com validação    |
| **Autenticação 2FA (TOTP)**        | Supabase MFA API          | `src/components/security/TwoFactorSetup.tsx`                                            | Autenticação de dois fatores via app authenticator  |
| **Controle de Acesso por IP**      | Supabase Edge Functions   | `supabase/functions/validate-login/`, `src/components/security/IPAccessControl.tsx`     | Whitelist/Blacklist de IPs com padrões wildcard     |
| **Log de Tentativas de Login**     | Supabase Edge Functions   | `supabase/functions/log-login-attempt/`, `src/components/security/LoginAttemptsLog.tsx` | Registro de todas as tentativas com IP e user-agent |
| **Reset de Senha com Aprovação**   | Supabase Edge Functions   | `supabase/functions/send-password-reset/`, `src/pages/AprovacaoResetSenha.tsx`          | Fluxo de aprovação por gestor antes do reset        |
| **Rotas Protegidas**               | React Router + Context    | `src/components/auth/ProtectedRoute.tsx`                                                | Proteção de rotas por autenticação e roles          |
| **Controle de Roles (Admin/User)** | Supabase RLS + has_role() | Tabela `user_roles`, função `has_role()`                                                | Sistema de permissões com enum app_role             |
| **Audit Trail**                    | Supabase + React Query    | `src/hooks/security/useAuditLogs.tsx`, `src/components/audit/AuditTrailViewer.tsx`      | Logs de todas as ações do sistema                   |

### Implementação de Roles (Padrão Seguro)

```sql
-- Enum para roles
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Tabela de roles separada (NUNCA no profiles)
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

-- Função security definer para evitar recursão RLS
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;
```

---

## 🎮 Gamificação

| Funcionalidade                  | Ferramenta/Biblioteca          | Arquivos Principais                                                                                                                     | Descrição                                      |
| ------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Sistema de XP e Níveis**      | Supabase + React Query         | `src/hooks/gamification/useGamification.ts`, `src/components/gamification/`                                                            | XP progressivo com cálculo de nível automático |
| **Conquistas/Achievements**     | Supabase + Framer Motion       | `src/components/achievements/`, `src/hooks/gamification/useAchievementNotifications.tsx`                                                | Badges desbloqueáveis por ações                |
| **Loja de Recompensas**         | Supabase + React Query         | `src/pages/LojaRecompensas.tsx`                                                                                                         | Troca de moedas por itens                      |
| **Ranking de Usuários**         | Supabase RPC (get_leaderboard) | `src/pages/Ranking.tsx`, `src/components/dashboard/TransportadoraRanking.tsx`                                                           | Leaderboard com filtros de período             |
| **Streak de Dias Consecutivos** | Supabase (user_levels)         | `src/hooks/gamification/useGamification.ts`                                                                                            | Contador de dias consecutivos de atividade     |
| **Barra de Progresso XP**       | Framer Motion                  | `src/components/dashboard/XPProgressBar.tsx`, `src/components/gamification/❌ XPProgressCard.tsx nao existe (verificado em 2026-11-23)` | Animação de progresso para próximo nível       |
| **Notificações de Conquistas**  | Framer Motion + Sonner         | `src/components/achievements/AchievementNotification.tsx`, `AchievementUnlockModal.tsx`                                                 | Modal animado ao desbloquear conquista         |

### Tabelas de Gamificação

```sql
-- Níveis do usuário
create table public.user_levels (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    level integer default 1,
    current_xp integer default 0,
    total_xp integer default 0,
    coins integer default 0,
    streak_days integer default 0,
    last_activity_date date
);

-- Conquistas disponíveis
create table public.achievements (
    id uuid primary key default gen_random_uuid(),
    code text not null,
    name text not null,
    description text not null,
    icon text default 'Trophy',
    xp_reward integer default 50,
    coins_reward integer default 10,
    rarity text default 'common', -- common, rare, epic, legendary
    category text default 'general',
    requirement_type text not null,
    requirement_value integer default 1
);

-- Conquistas desbloqueadas
create table public.user_achievements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    achievement_id uuid references achievements(id),
    unlocked_at timestamptz default now()
);
```

---

## 📊 Analytics & Relatórios

| Funcionalidade                    | Ferramenta/Biblioteca   | Arquivos Principais                                                                                                                      | Descrição                        |
| --------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Dashboard com Gráficos**        | Recharts                | `src/components/dashboard/PerformanceChart.tsx`                                                                                          | Gráficos de linha, barra, área   |
| **Métricas em Tempo Real**        | Supabase Realtime       | `src/hooks/analytics/useDashboardMetrics.tsx`                                                                                            | Atualização automática de KPIs   |
| **Drill-Down Interativo**         | Recharts + Dialog       | `src/components/analytics/DrillDownModal.tsx`, `src/hooks/analytics/useDrillDown.tsx`                                                    | Clique em gráfico para detalhes  |
| **Comparativo Mensal**            | Recharts                | `src/components/analytics/❌ MonthlyComparisonChart.tsx nao existe (verificado em 2026-11-23)`                                           | Período vs período anterior      |
| **Relatórios Agendados**          | Supabase Edge Functions | `supabase/functions/scheduled-reports/`, `src/components/reports/ScheduledReportsManager.tsx`                                            | Envio automático por email       |
| **Exportação CSV/JSON/Excel**     | jsPDF + xlsx            | `src/hooks/common/useExport.tsx`, `src/components/common/ExportButton.tsx`                                                               | Múltiplos formatos de exportação |
| **KPI Benchmark**                 | Supabase + Recharts     | `src/components/analytics/❌ KPIBenchmarkDashboard.tsx nao existe (verificado em 2026-11-23)`, `src/hooks/analytics/useKPIBenchmark.tsx` | Comparação com metas             |
| **Heatmap por Região**            | Recharts                | `src/components/analytics/❌ RegionHeatmap.tsx nao existe (verificado em 2026-11-23)`                                                    | Visualização geográfica de dados |
| **Previsão de Demanda**           | Recharts                | `src/components/analytics/❌ DemandForecastChart.tsx nao existe (verificado em 2026-11-23)`                                              | Projeção baseada em histórico    |
| **Comparação de Transportadoras** | Recharts                | `src/components/analytics/❌ TransportadoraComparisonChart.tsx nao existe (verificado em 2026-11-23)`                                    | Performance side-by-side         |

### Hook de Exportação

```typescript
// src/hooks/common/useExport.tsx
export function useExport() {
  const exportToCSV = (data: any[], filename: string) => {
    /* ... */
  };
  const exportToJSON = (data: any[], filename: string) => {
    /* ... */
  };
  const exportToExcel = (data: any[], filename: string) => {
    /* ... */
  };
  const exportToPDF = (data: any[], filename: string, columns: string[]) => {
    /* ... */
  };

  return { exportToCSV, exportToJSON, exportToExcel, exportToPDF };
}
```

---

## 📦 Gestão Logística

| Funcionalidade                | Ferramenta/Biblioteca  | Arquivos Principais                                                                 | Descrição                             |
| ----------------------------- | ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| **Gestão de Coletas**         | Supabase + React Query | `src/pages/Coletas.tsx`                                                             | CRUD completo com status workflow     |
| **Gestão de Envios/Entregas** | Supabase + React Query | `src/pages/Envios.tsx`                                                              | Controle de entregas com rastreamento |
| **Gestão de Ocorrências**     | Supabase + React Query | `src/pages/Ocorrencias.tsx`                                                         | Registro de problemas com fotos       |
| **Fretes Internos**           | Supabase + React Query | `src/pages/FretesInternos.tsx`                                                      | Movimentações entre unidades          |
| **Despachos (Kanban)**        | @dnd-kit               | `src/pages/Despachos.tsx`                                                           | Board drag-and-drop por status        |
| **Gestão de Box**             | Supabase + React Query | `src/pages/GestaoBox.tsx`, `src/hooks/logistics/useBoxManagement.tsx`               | Controle de espaço físico             |
| **Cotação de Frete**          | Supabase + React Query | `src/pages/CotacaoFrete.tsx`, `src/hooks/logistics/useFreightQuotation.tsx`         | Comparação de preços                  |
| **Calendário Logístico**      | Supabase + React Query | `src/pages/CalendarioLogistico.tsx`, `src/hooks/logistics/useLogisticsCalendar.tsx` | Visualização de eventos               |
| **Alertas de Custo**          | Supabase + React Query | `src/pages/AlertasCusto.tsx`, `src/hooks/logistics/useCostAlerts.tsx`               | Limites e notificações                |
| **Dashboard de Custos**       | Supabase + Recharts    | `src/pages/CustosDashboard.tsx`, `src/hooks/logistics/useLogisticsCosts.tsx`        | Análise financeira                    |
| **Conciliação Financeira**    | Supabase + xlsx        | `src/pages/ConciliacaoFinanceira.tsx`, `src/hooks/logistics/useConciliacao.tsx`     | Importação e matching                 |

### Status Workflows (Enums)

```sql
-- Status de coleta
create type public.coleta_status as enum (
    'aguardando_liberacao',
    'solicitada',
    'em_transito',
    'chegou_expedicao',
    'conferencia_ok',
    'divergencia',
    'finalizada'
);

-- Status de entrega
create type public.entrega_status as enum (
    'aguardando_producao',
    'pronto_despacho',
    'cotacao_frete',
    'nf_emitida',
    'despachado',
    'em_transito',
    'saiu_entrega',
    'entregue',
    'ocorrencia',
    'finalizado'
);

-- Tipo de frete
create type public.frete_tipo as enum ('cif', 'fob', 'cortesia');
```

---

## 🗺️ Rastreamento & Mapas

| Funcionalidade                | Ferramenta/Biblioteca   | Arquivos Principais                                                                                                             | Descrição                         |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Mapa de Entregas**          | Mapbox GL               | `src/components/map/❌ DeliveryMap.tsx nao existe (verificado em 2026-11-23)`                                                   | Visualização de pontos de entrega |
| **Rastreamento de Motorista** | Mapbox GL + Supabase    | `src/components/tracking/❌ DriverTrackingMap.tsx nao existe (verificado em 2026-11-23)`, `src/pages/RastreamentoMotorista.tsx` | Tracking em tempo real            |
| **Rastreamento Público**      | Mapbox GL               | `src/pages/RastreamentoPublico.tsx`                                                                                             | Link compartilhável para cliente  |
| **Mapa de Rotas**             | Mapbox GL               | `src/pages/MapaRotas.tsx`                                                                                                       | Visualização de rotas             |
| **Geocoding de Endereços**    | Supabase Edge Functions | `supabase/functions/geocode-address/`, `src/hooks/integrations/useGeocoding.tsx`                                                | Conversão endereço → coordenadas  |
| **Heatmap de Rastreamento**   | Mapbox GL               | `src/components/tracking/❌ TrackingHeatmap.tsx nao existe (verificado em 2026-11-23)`                                          | Densidade de entregas             |
| **Integração Lalamove**       | Supabase Edge Functions | `supabase/functions/lalamove-tracking/`, `supabase/functions/lalamove-webhook/`                                                 | API de entregas rápidas           |

### Configuração Mapbox

```typescript
// Obter token via Edge Function
const { data } = await supabase.functions.invoke("get-mapbox-token");

// Inicializar mapa
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = data.token;
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-46.6333, -23.5505], // São Paulo
  zoom: 12,
});
```

---

## 🔔 Notificações

| Funcionalidade              | Ferramenta/Biblioteca  | Arquivos Principais                                                                                                                                      | Descrição                      |
| --------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Sistema de Notificações** | Supabase Realtime      | `src/hooks/notifications/useNotifications.tsx`, `src/components/notifications/NotificationCenter.tsx`                                                    | Central de notificações in-app |
| **Push Notifications**      | Web Push API           | `src/hooks/notifications/usePushNotifications.tsx`, `src/components/notifications/❌ PushNotificationSettings.tsx nao existe (verificado em 2026-11-23)` | Notificações do navegador      |
| **Notificações de SLA**     | Supabase + React Query | `src/hooks/logistics/useSLANotifications.tsx`, `src/components/notifications/SLANotificationSettings.tsx`                                                | Alertas de prazos              |
| **Notificações de Atraso**  | Supabase + React Query | `src/hooks/useDelayNotifications.tsx (nao localizado em 2026-11-23)`                                                                                     | Alertas preditivos             |
| **Toast Notifications**     | Sonner                 | `src/components/ui/sonner.tsx`, `src/hooks/ui/use-toast.ts`                                                                           | Feedback visual instantâneo    |
| **Alertas Inteligentes**    | Supabase + React Query | `src/hooks/logistics/useSmartAlerts.tsx`, `src/components/dashboard/AlertsPanel.tsx`                                                                     | Alertas baseados em regras     |

### Tipos de Notificação

```sql
create type public.notification_type as enum (
    'info',
    'success',
    'warning',
    'error',
    'achievement'
);

create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    type notification_type default 'info',
    title text not null,
    message text not null,
    action_url text,
    read boolean default false,
    read_at timestamptz,
    metadata jsonb default '{}',
    created_at timestamptz default now()
);
```

---

## 🤖 Inteligência Artificial

| Funcionalidade                            | Ferramenta/Biblioteca   | Arquivos Principais                                                                              | Descrição                         |
| ----------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------- |
| **Assistente de IA**                      | Supabase Edge Functions | `supabase/functions/ai-logistics-assistant/`, `src/components/ai/AIAssistant.tsx`                | Chat com contexto logístico       |
| **Previsão de Atrasos**                   | Supabase Edge Functions | `supabase/functions/predict-delays/`, `src/components/predictions/DelayPredictionPanel.tsx`      | ML para prever problemas          |
| **Seleção Inteligente de Transportadora** | Supabase Edge Functions | `supabase/functions/smart-carrier-selection/`, `src/components/freight/SmartCarrierSelector.tsx` | Recomendação baseada em histórico |

### Edge Function de IA (Exemplo)

```typescript
// supabase/functions/ai-logistics-assistant/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const { message, context } = await req.json();

  // Usar Lovable AI ou OpenAI
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em logística...",
        },
        { role: "user", content: message },
      ],
    }),
  });

  return new Response(JSON.stringify(await response.json()));
});
```

---

## 🎨 UI/UX Components

| Funcionalidade             | Ferramenta/Biblioteca       | Arquivos Principais                                                                                                | Descrição                    |
| -------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| **Design System**          | Tailwind CSS + Shadcn/UI    | `src/index.css`, `tailwind.config.ts`, `src/components/ui/`                                                        | Tokens CSS customizados      |
| **Animações**              | Framer Motion               | `src/components/ui/micro-interactions.tsx`                                                                         | Transições suaves            |
| **Dark Mode**              | next-themes                 | `src/components/layout/Header.tsx`                                                                                 | Toggle claro/escuro          |
| **Tabelas de Dados**       | Shadcn/UI Table             | `src/components/common/ResponsiveTable.tsx`                                                                              | Tabela com sorting/filtering |
| **Paginação**              | React + Supabase            | `src/hooks/common/usePagination.ts`, `src/components/common/Pagination.tsx`                                        | Navegação de páginas         |
| **Filtros Dinâmicos**      | React + Supabase            | `src/hooks/common/useFilters.ts`, `src/components/common/FilterBar.tsx`                                            | Filtros multi-campo          |
| **Ordenação Multi-coluna** | React + Supabase            | `src/hooks/common/useSorting.ts`                                                                                   | Sort por múltiplas colunas   |
| **Ações em Lote**          | React + Supabase            | `src/components/common/BulkActions.tsx`                                                                            | Seleção múltipla + ações     |
| **Date Range Picker**      | react-day-picker + date-fns | `src/components/common/DateRangePicker.tsx`                                                                        | Seletor de período           |
| **Upload de Imagens**      | Supabase Storage            | `src/hooks/data/useImageUpload.tsx`, `src/components/common/ImageUploader.tsx`                                     | Upload com preview           |
| **Comentários**            | Supabase Realtime           | `src/hooks/common/useComments.tsx`, `src/components/common/CommentSection.tsx`                                     | Sistema de comentários       |
| **Menções @usuário**       | Supabase + React            | `src/hooks/useMentions.tsx (nao localizado em 2026-11-23)`, `src/components/common/CommentSection.tsx` | Autocomplete de usuários     |
| **Timeline/Histórico**     | Supabase + React Query      | `src/hooks/security/useEntityHistory.tsx`, `src/components/common/Timeline.tsx`                                    | Histórico de alterações      |
| **Skeleton Loading**       | Shadcn/UI                   | `src/components/ui/skeleton.tsx`, `src/components/ui/skeletons.tsx`                                                | Placeholders animados        |
| **Command Palette (⌘K)**   | cmdk                        | `src/components/common/SearchCommand.tsx`                                                                          | Busca global rápida          |
| **Atalhos de Teclado**     | React Hooks                 | `src/hooks/common/useKeyboardShortcuts.ts`, `src/components/common/KeyboardShortcutsHelp.tsx`                      | Hotkeys customizáveis        |
| **Tooltips**               | Radix UI                    | `src/components/onboarding/OnboardingTooltip.tsx`, `src/components/ui/tooltip.tsx`                                        | Dicas contextuais            |
| **Dialogs/Modals**         | Radix UI                    | `src/components/ui/dialog.tsx`, `src/components/common/ConfirmDialog.tsx`                                          | Modais acessíveis            |
| **Sheets (Side Panel)**    | Radix UI + Vaul             | `src/components/ui/sheet.tsx`, `src/components/common/DetailSheet.tsx`                                             | Painéis laterais             |
| **Sidebar Responsiva**     | Radix UI                    | `src/components/ui/sidebar.tsx`, `src/components/layout/AppSidebar.tsx`                                            | Menu colapsável              |
| **Carrossel**              | embla-carousel-react        | `src/components/ui/carousel.tsx`                                                                                   | Slider de conteúdo           |
| **Formulários**            | react-hook-form + zod       | `src/hooks/useForm.tsx (nao localizado em 2026-11-23)`, `src/components/ui/form.tsx`                               | Validação tipada             |
| **Input OTP**              | input-otp                   | `src/components/ui/input-otp.tsx`                                                                                  | Campos de código             |
| **Resizable Panels**       | react-resizable-panels      | `src/components/ui/resizable.tsx`                                                                                  | Painéis ajustáveis           |

### Hook de Paginação

```typescript
// src/hooks/common/usePagination.ts
export function usePagination(initialPage = 1, initialPageSize = 10) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const offset = (page - 1) * pageSize;

  const goToPage = (newPage: number) => setPage(newPage);
  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));

  return { page, pageSize, offset, setPageSize, goToPage, nextPage, prevPage };
}
```

### Hook de Filtros

```typescript
// src/hooks/common/useFilters.ts
export function useFilters<T extends Record<string, any>>(initialFilters: T) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = (key: keyof T, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(initialFilters);

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== "" && v !== null,
  ).length;

  return { filters, updateFilter, clearFilters, activeFiltersCount };
}
```

---

## 📱 PWA & Mobile

| Funcionalidade                | Ferramenta/Biblioteca | Arquivos Principais                                                          | Descrição           |
| ----------------------------- | --------------------- | ---------------------------------------------------------------------------- | ------------------- |
| **PWA (Progressive Web App)** | Service Worker        | `public/sw.js`, `public/manifest.json`                                       | Instalável como app |
| **Modo Offline**              | Service Worker        | `public/offline.html`, `src/hooks/common/useOnlineStatus.tsx`                | Cache de recursos   |
| **Scanner QR/Barcode**        | Web APIs              | `src/hooks/ui/useQRScanner.tsx`, `src/components/scanner/QRScannerModal.tsx` | Câmera para leitura |
| **Detecção Mobile**           | React Hooks           | `src/hooks/ui/use-mobile.tsx`, `src/hooks/common/useMediaQuery.ts`           | Responsividade      |

### Manifest PWA

```json
{
  "name": "Loggi-Flow",
  "short_name": "LoggiFlow",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ]
}
```

---

## 🔧 Automação & Integrações

| Funcionalidade                        | Ferramenta/Biblioteca   | Arquivos Principais                                                                                    | Descrição                |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| **Regras de Negócio (Se X, então Y)** | Supabase + React Query  | `src/hooks/logistics/useBusinessRules.tsx`, `src/components/automation/BusinessRulesManager.tsx`       | Automação configurável   |
| **Integração Bitrix24**               | Supabase Edge Functions | `supabase/functions/bitrix24-integration/`, `src/hooks/useBitrix24.tsx (nao localizado em 2026-11-23)` | CRM sync                 |
| **Integração n8n**                    | Supabase Edge Functions | `docs/pendencias/01-06-n8n-integration.md` (function nao existe), `src/hooks/useN8n.tsx (nao localizado em 2026-11-23)`           | Workflows externos       |
| **API Pública**                       | Supabase Edge Functions | `docs/pendencias/01-07-public-api.md` (function nao existe)                                                                       | Endpoints para terceiros |
| **Webhooks Lalamove**                 | Supabase Edge Functions | `supabase/functions/lalamove-webhook/`                                                                 | Receber eventos externos |

### Estrutura de Regras de Negócio

```sql
create table public.business_rules (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    entity_type text not null, -- 'coleta', 'entrega', etc.
    trigger_event text not null, -- 'on_create', 'on_update', 'on_status_change'
    conditions jsonb default '[]', -- [{ field, operator, value }]
    actions jsonb default '[]', -- [{ type, params }]
    priority integer default 0,
    is_active boolean default true,
    created_by uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

---

## 📝 Onboarding

| Funcionalidade             | Ferramenta/Biblioteca     | Arquivos Principais                                | Descrição              |
| -------------------------- | ------------------------- | -------------------------------------------------- | ---------------------- |
| **Wizard de Configuração** | Framer Motion + Shadcn/UI | `src/components/onboarding/OnboardingWizard.tsx`   | Setup inicial guiado   |
| **Checklist Gamificado**   | Supabase + React Query    | `src/hooks/ui/useOnboarding.tsx`                   | Progresso com XP       |
| **Tooltips Contextuais**   | Radix UI                  | `src/components/onboarding/OnboardingTooltip.tsx`  | Dicas em elementos     |
| **Barra de Progresso**     | Framer Motion             | `src/components/onboarding/OnboardingProgress.tsx` | Visualização de etapas |

### Tabela de Onboarding

```sql
create table public.user_onboarding (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    current_step integer default 0,
    completed_steps text[] default '{}',
    xp_earned integer default 0,
    completed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

---

## 🛠️ Dashboard Personalizado

| Funcionalidade            | Ferramenta/Biblioteca   | Arquivos Principais                                                                              | Descrição           |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------- |
| **Widgets Drag-and-Drop** | @dnd-kit                | `src/components/dashboard/DraggableDashboard.tsx`, `src/hooks/analytics/useDashboardWidgets.tsx` | Reorganização livre |
| **Métricas Favoritas**    | Supabase + LocalStorage | `src/hooks/analytics/useFavoriteMetrics.tsx`, `src/components/dashboard/FavoriteMetricsBar.tsx`  | KPIs fixados        |
| **Widget Picker**         | Shadcn/UI               | `src/components/dashboard/WidgetPicker.tsx`                                                      | Seleção de widgets  |
| **Quick Actions**         | React                   | `src/components/dashboard/QuickActions.tsx`                                                      | Atalhos rápidos     |

### Hook de Widgets

```typescript
// src/hooks/analytics/useDashboardWidgets.tsx
export function useDashboardWidgets() {
  const [widgets, setWidgets] = useLocalStorage(
    "dashboard-widgets",
    defaultWidgets,
  );

  const addWidget = (widget: Widget) => {
    /* ... */
  };
  const removeWidget = (id: string) => {
    /* ... */
  };
  const reorderWidgets = (activeId: string, overId: string) => {
    /* ... */
  };

  return { widgets, addWidget, removeWidget, reorderWidgets };
}
```

---

## 🌐 Internacionalização

| Funcionalidade           | Ferramenta/Biblioteca                                                                                                        | Arquivos Principais                | Descrição                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| **Suporte Multi-idioma** | i18next ^26.2.0 + react-i18next ^17.0.13 + i18next-browser-languagedetector ^8.2.1 (versões do `package.json` em 2026-11-23) | `src/i18n.ts`                      | PT-BR como `fallbackLng`; recursos inline, um idioma só hoje |
| **Fuso Horário**         | date-fns-tz ^3.2.0                                                                                                           | `src/hooks/common/useTimezone.tsx` | Conversão de horários                                        |

### Estrutura de Locales

```
src/
└── i18n.ts        # init do i18next + recursos inline (pt-BR)
```

O arquivo real é **um só**: `src/i18n.ts` na raiz de `src/` (importado em `src/main.tsx:6`). Não existe pasta `i18n` dentro de `src/`, nem arquivos `locales/*.json`. Os textos vivem em `resources` inline e só `pt-BR` está carregado; `fallbackLng` também é `pt-BR`. A tabela acima falava de PT-BR, EN e ES: **só PT-BR existe hoje**.

---

## 📚 Cadastros

| Funcionalidade                | Ferramenta/Biblioteca  | Arquivos Principais                                                                    | Descrição               |
| ----------------------------- | ---------------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| **Clientes**                  | Supabase + React Query | `src/pages/Clientes.tsx`                                                               | CRUD de clientes        |
| **Fornecedores**              | Supabase + React Query | `src/pages/Fornecedores.tsx`                                                           | CRUD de fornecedores    |
| **Transportadoras**           | Supabase + React Query | `src/pages/Transportadoras.tsx`                                                        | CRUD de transportadoras |
| **Rotas de Transportadoras**  | Supabase + React Query | `src/pages/RotasTransportadoras.tsx`, `src/hooks/logistics/useTransportadoraRotas.tsx` | Gestão de rotas         |
| **Perfil de Usuário**         | Supabase + React Query | `src/pages/Profile.tsx`                                                                | Dados do usuário        |
| **Gerenciamento de Usuários** | Supabase + React Query | `src/pages/GerenciamentoUsuarios.tsx`                                                  | Admin de usuários       |

---

## 🧪 Testes

| Funcionalidade       | Ferramenta/Biblioteca    | Arquivos Principais             | Descrição               |
| -------------------- | ------------------------ | ------------------------------- | ----------------------- |
| **Testes Unitários** | Vitest + Testing Library | `src/test/`, `vitest.config.ts` | Testes de hooks e utils |
| **CI/CD**            | GitHub Actions           | `.github/workflows/ci.yml`      | Pipeline automatizado   |

### Configuração Vitest

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

## 📦 Dependências Principais

### Core

| Pacote           | Versão  | Uso              |
| ---------------- | ------- | ---------------- |
| react            | ^18.3.1 | Framework UI     |
| react-dom        | ^18.3.1 | Renderização DOM |
| react-router-dom | ^6.30.1 | Roteamento SPA   |
| typescript       | (dev)   | Tipagem estática |
| vite             | (dev)   | Build tool       |

### Backend & State

| Pacote                | Versão  | Uso                  |
| --------------------- | ------- | -------------------- |
| @supabase/supabase-js | ^2.87.1 | Cliente Supabase     |
| @tanstack/react-query | ^5.83.0 | Cache e state server |

### UI Components

| Pacote                   | Versão  | Uso                      |
| ------------------------ | ------- | ------------------------ |
| tailwindcss              | (dev)   | Utility-first CSS        |
| tailwind-merge           | ^2.6.0  | Merge de classes         |
| tailwindcss-animate      | ^1.0.7  | Animações Tailwind       |
| class-variance-authority | ^0.7.1  | Variantes de componentes |
| clsx                     | ^2.1.1  | Concatenação de classes  |
| @radix-ui/*              | various | Primitivos acessíveis    |
| cmdk                     | ^1.1.1  | Command palette          |
| sonner                   | ^1.7.4  | Toast notifications      |
| vaul                     | ^0.9.9  | Drawer component         |

### Animações & Interações

| Pacote             | Versão    | Uso               |
| ------------------ | --------- | ----------------- |
| framer-motion      | ^12.23.26 | Animações React   |
| @dnd-kit/core      | ^6.3.1    | Drag and drop     |
| @dnd-kit/sortable  | ^10.0.0   | Listas ordenáveis |
| @dnd-kit/utilities | ^3.2.2    | Utilitários DnD   |

### Formulários & Validação

| Pacote              | Versão   | Uso                    |
| ------------------- | -------- | ---------------------- |
| react-hook-form     | ^7.61.1  | Gerenciamento de forms |
| @hookform/resolvers | ^3.10.0  | Resolvers de validação |
| zod                 | ^3.25.76 | Schema validation      |
| input-otp           | ^1.4.2   | Campos OTP             |

### Gráficos & Visualização

| Pacote    | Versão  | Uso               |
| --------- | ------- | ----------------- |
| recharts  | ^2.15.4 | Gráficos React    |
| mapbox-gl | ^3.17.0 | Mapas interativos |

### Datas & Tempo

| Pacote           | Versão  | Uso                  |
| ---------------- | ------- | -------------------- |
| date-fns         | ^3.6.0  | Manipulação de datas |
| date-fns-tz      | ^3.2.0  | Fusos horários       |
| react-day-picker | ^8.10.1 | Calendário picker    |

### Exportação

| Pacote          | Versão  | Uso              |
| --------------- | ------- | ---------------- |
| jspdf           | ^3.0.4  | Geração de PDFs  |
| jspdf-autotable | ^5.0.2  | Tabelas em PDF   |
| xlsx            | ^0.18.5 | Exportação Excel |

### Outros

| Pacote                 | Versão   | Uso                   |
| ---------------------- | -------- | --------------------- |
| lucide-react           | ^0.462.0 | Ícones                |
| next-themes            | ^0.3.0   | Dark mode             |
| react-markdown         | ^10.1.0  | Renderização Markdown |
| react-resizable-panels | ^2.1.9   | Painéis ajustáveis    |
| embla-carousel-react   | ^8.6.0   | Carrossel             |

### Testes

| Pacote                    | Versão  | Uso               |
| ------------------------- | ------- | ----------------- |
| vitest                    | ^4.0.16 | Test runner       |
| @testing-library/react    | ^16.3.1 | Testing utilities |
| @testing-library/jest-dom | ^6.9.1  | DOM matchers      |

---

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── achievements/     # Conquistas e badges
│   ├── ai/              # Assistente IA
│   ├── analytics/       # Gráficos e análises
│   ├── audit/           # Logs de auditoria
│   ├── auth/            # Autenticação
│   ├── automation/      # Regras de negócio
│   ├── box/             # Gestão de box
│   ├── common/          # Componentes reutilizáveis
│   ├── dashboard/       # Widgets do dashboard
│   ├── freight/         # Cotação de frete
│   ├── gamification/    # XP e níveis
│   ├── layout/          # Layout principal
│   ├── map/             # Mapas
│   ├── mentions/        # Sistema de menções
│   ├── notifications/   # Centro de notificações
│   ├── onboarding/      # Wizard inicial
│   ├── predictions/     # Previsões IA
│   ├── reports/         # Relatórios
│   ├── scanner/         # QR/Barcode
│   ├── search/          # Busca global
│   ├── security/        # 2FA, IP control
│   ├── tracking/        # Rastreamento
│   ├── transportadoras/ # Rotas
│   └── ui/              # Shadcn components
├── hooks/               # Custom hooks (48+)
├── i18n/                # Internacionalização
├── integrations/
│   └── supabase/        # Cliente Supabase
├── lib/                 # Utilitários
├── pages/               # Páginas (30+)
├── test/                # Testes
└── utils/               # Helpers

supabase/
├── config.toml          # Configuração
├── functions/           # Edge Functions (10+)
└── migrations/          # Migrações SQL

public/
├── icons/               # Ícones PWA
├── manifest.json        # PWA manifest
├── sw.js                # Service Worker
└── offline.html         # Página offline
```

---

## 🔑 Variáveis de Ambiente

```env
# Supabase (auto-configurado pelo Lovable Cloud)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx

# Mapbox (secrets no Supabase)
MAPBOX_ACCESS_TOKEN=pk.xxx

# OpenAI (secrets no Supabase)
OPENAI_API_KEY=sk-xxx

# Lalamove (secrets no Supabase)
LALAMOVE_API_KEY=xxx
LALAMOVE_API_SECRET=xxx
```

---

## 📝 Notas Finais

- **Total de Funcionalidades:** 100+
- **Total de Hooks Customizados:** 48+
- **Total de Páginas:** 30+
- **Total de Edge Functions:** 10+
- **Tabelas no Banco:** 25+

Este documento serve como referência completa para replicar padrões e funcionalidades em novos projetos.

---

_Última atualização: Dezembro 2024_
