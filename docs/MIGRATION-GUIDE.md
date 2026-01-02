# 🚀 Guia de Migração Mock → Produção

## 📋 Visão Geral

Este guia documenta o processo de migração dos hooks com dados mockados para hooks com dados reais do Supabase, Bitrix24 e Lalamove.

## 🔄 Mapeamento Mock → Real

| Hook Mock | Hook Real | Fonte de Dados |
|-----------|-----------|----------------|
| `useAnalytics` | `useAnalyticsReal` | Supabase (entregas) |
| `useDashboardMetrics` | `useDashboardMetricsReal` | Supabase (entregas, coletas, ocorrencias) |
| `useSLAMetrics` | `useSLAMetricsReal` | Supabase (entregas + transportadoras) |
| `useLogisticsCosts` | `useLogisticsCostsReal` | Supabase (entregas + custos) |
| `useGamification` | `useGamificationReal` | Supabase (user_gamification, achievements) |
| `useLalamoveTracking` | `useLalamoveTrackingReal` | API Lalamove + Supabase (cache) |
| `useBitrix24` | `useBitrix24Real` | API Bitrix24 REST |

## 🛠️ Como Migrar

### Passo 1: Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Preencher com valores reais
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_BITRIX24_WEBHOOK=https://promobrindes.bitrix24.com.br/rest/1/xxx/
```

### Passo 2: Executar Migrations

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref your-project-id

# Aplicar migrations
supabase db push
```

### Passo 3: Substituir Imports

```tsx
// ANTES (Mock)
import { useAnalytics } from '@/hooks';

// DEPOIS (Real)
import { useAnalyticsReal as useAnalytics } from '@/hooks';
```

### Passo 4: Testar em Ambiente de Dev

```bash
npm run dev
# Verificar console para erros
# Testar cada funcionalidade
```

## 📊 Migrations Necessárias

| Migration | Descrição | Status |
|-----------|-----------|--------|
| `gamification_real.sql` | Tabelas de gamificação | ✅ |
| `lalamove_orders.sql` | Tabelas de pedidos Lalamove | ✅ |
| `saved_filters.sql` | Filtros salvos | ✅ |
| `entity_versions.sql` | Versionamento | ✅ |
| `activity_logs.sql` | Logs de atividade | ✅ |

## 🔐 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave anônima Supabase |
| `VITE_BITRIX24_WEBHOOK` | ✅ | Webhook Bitrix24 |
| `LALAMOVE_API_KEY` | ⚠️ | Chave API Lalamove |
| `LALAMOVE_API_SECRET` | ⚠️ | Secret API Lalamove |

## 🧪 Checklist de Validação

- [ ] Supabase conectado e autenticação funcionando
- [ ] Dashboard carregando dados reais
- [ ] Métricas de SLA calculando corretamente
- [ ] Custos logísticos com valores reais
- [ ] Gamificação persistindo XP e conquistas
- [ ] Lalamove criando e rastreando pedidos
- [ ] Bitrix24 sincronizando SPAs

## ⚠️ Troubleshooting

### Erro: "Supabase connection failed"
```bash
# Verificar URL e chave
echo $VITE_SUPABASE_URL
# Testar conexão
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_URL/rest/v1/"
```

### Erro: "Bitrix24 401 Unauthorized"
```bash
# Verificar se webhook está ativo
# Gerar novo token em Bitrix24 > Configurações > REST API
```

### Erro: "Lalamove signature invalid"
```bash
# Verificar timezone do servidor
# API key e secret devem ser do ambiente correto (sandbox vs prod)
```

## 📈 Performance

Para grandes volumes de dados:

1. **Paginação**: Use `usePagination` hook
2. **Cache**: TanStack Query já faz cache automático
3. **Índices**: Verificar índices no Supabase
4. **Edge Functions**: Para operações pesadas

## 🔗 Links Úteis

- [Supabase Docs](https://supabase.com/docs)
- [Bitrix24 REST API](https://training.bitrix24.com/rest_help/)
- [Lalamove API](https://developers.lalamove.com/)
- [TanStack Query](https://tanstack.com/query/latest)
