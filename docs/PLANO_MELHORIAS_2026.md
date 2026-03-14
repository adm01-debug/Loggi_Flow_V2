# 📋 PLANO EXAUSTIVO DE MELHORIAS — LogiFlow 2026

> Última atualização: 2026-03-14 (Sprint 1 em execução)
> Status: Plano aprovado para execução sequencial

---

## 🔴 CATEGORIA 1: BUGS CRÍTICOS (Prioridade Máxima)

### ✅ 1.1 Rodonaves API — Status Inválidos no Enum (CORRIGIDO)
- **Problema**: Edge function `rodonaves-api` mapeava para `devolvido`, `coletado`, `cancelado` — valores inexistentes no enum `entrega_status`
- **Impacto**: Crash na sincronização de todas as entregas Rodonaves
- **Status**: ✅ Corrigido nesta sessão

### ✅ 1.2 Rodonaves Status Codes — Type Mismatch (CORRIGIDO)
- **Problema**: `rodonavesStatusCodes.ts` usava tipo union com valores inválidos (`pendente`, `coletado`, `devolvido`, `cancelado`)
- **Impacto**: TypeScript build errors, dados inconsistentes
- **Status**: ✅ Corrigido nesta sessão

### ✅ 1.3 Edge Functions Ausentes no config.toml (CORRIGIDO)
- **Problema**: `rodonaves-api`, `check-password-breach` e `lalamove-api` sem entrada no `config.toml`
- **Status**: ✅ Corrigido — adicionadas 3 entradas

### ~~🔲~~ 1.4 `check-password-breach` Ausente no config.toml
- **Status**: ✅ Corrigido junto com 1.3

### ✅ 1.5 RLS Policies Excessivamente Permissivas (CORRIGIDO)
- **Problema**: `alertas_custo`, `tabelas_frete`, `cotacoes_frete`, `transportadora_rotas` usavam `USING (true)` sem `TO authenticated`
- **Status**: ✅ Corrigido via migration — todas restritas para `authenticated`

### ✅ 1.6 `geo_blocked_attempts` Sem INSERT Policy (CORRIGIDO)
- **Problema**: Tabela não permitia INSERT
- **Status**: ✅ Corrigido via migration

---

## 🟠 CATEGORIA 2: INTEGRAÇÕES INCOMPLETAS

### ✅ 2.1 Rodonaves — Webhook de Notificação Automática (CORRIGIDO)
- **Problema**: Sincronização é manual (pull), não há webhook para receber atualizações em tempo real
- **Status**: ✅ Edge function `rodonaves-webhook` criada no Sprint 3

### 🔲 2.2 Rodonaves — Cotação Integrada ao Fluxo de Despacho
- **Problema**: Hook `useRodonavesTracking` tem cotação, mas não está integrado à página `CotacaoFrete`
- **Ação**: Integrar cotação Rodonaves automaticamente na tela de cotação de frete
- **Complexidade**: Média

### 🔲 2.3 Rodonaves — Prazo Integrado ao Calendário Logístico
- **Problema**: Endpoint de prazo existe mas não alimenta `CalendarioLogistico`
- **Ação**: Ao despachar via Rodonaves, calcular prazo automaticamente e adicionar ao calendário
- **Complexidade**: Média

### 🔲 2.4 Rodonaves — Comprovante de Entrega no Fluxo
- **Problema**: Endpoint existe mas não há UI para visualizar/baixar comprovantes
- **Ação**: Adicionar botão "Ver Comprovante" no detalhe da entrega quando status = entregue e transportadora = Rodonaves
- **Complexidade**: Baixa

### 🔲 2.5 Bitrix24 — Sync Bidirecional
- **Problema**: Integração é unidirecional (só lê do Bitrix24)
- **Ação**: Implementar escrita de status de volta ao CRM quando entrega é concluída
- **Complexidade**: Alta

### 🔲 2.6 Lalamove — Rastreamento Real-Time em Mapa
- **Problema**: Webhook de rastreamento existe mas dados não são exibidos no mapa em tempo real
- **Ação**: Conectar `rastreamento_historico` ao `DeliveryMap` com atualização via Realtime
- **Complexidade**: Média

### 🔲 2.7 WhatsApp — Notificações ao Cliente
- **Problema**: Regra de negócio exige notificar cliente a cada mudança de status, mas não está implementado
- **Ação**: Integrar API do WhatsApp Business (ou Twilio) para enviar mensagens automáticas
- **Complexidade**: Alta (requer API key externa)

---

## 🟡 CATEGORIA 3: FUNCIONALIDADES PENDENTES

### ✅ 3.1 E-mail Transacional com Resend (CORRIGIDO)
- **Problema**: Resend API key existe nos secrets mas nenhuma função de envio está implementada
- **Status**: ✅ Edge function `send-email` criada no Sprint 2

### ✅ 3.2 Import CSV/Excel Real (CORRIGIDO)
- **Problema**: Importadores existem no frontend mas não estão conectados às tabelas
- **Status**: ✅ CSVImporter conectado à página de Clientes com schema validado

### 🔲 3.3 Upload de Comprovantes/NFs
- **Problema**: Campos `comprovante_entrega_url` e `nf_remessa_url` existem na tabela mas upload não está implementado
- **Ação**: Configurar Supabase Storage bucket e implementar upload nas telas de entrega/coleta
- **Complexidade**: Média

### ✅ 3.4 Loja de Recompensas Funcional (CORRIGIDO)
- **Problema**: Tabelas `reward_items` e `reward_purchases` existem, página existe, mas compra não debita coins
- **Status**: ✅ Função `purchase_reward` criada (transação atômica), página conectada a dados reais

### ✅ 3.5 Relatórios Agendados — Envio Real (CORRIGIDO)
- **Problema**: Agendamento salva no banco mas não há cron/scheduler para enviar
- **Status**: ✅ Edge function `scheduled-reports` reescrita com geração de dados e envio via email

### 🔲 3.6 Rastreamento Público Funcional
- **Problema**: Página `/rastrear` existe mas não consulta dados reais
- **Ação**: Implementar busca por código de rastreamento sem autenticação
- **Complexidade**: Baixa

### 🔲 3.7 Validação de CNPJ com Dígitos Verificadores
- **Problema**: Campos CNPJ aceitam qualquer valor sem validação de dígitos
- **Ação**: Adicionar função de validação de CNPJ em `lib/validations.ts`
- **Complexidade**: Baixa

---

## 🔵 CATEGORIA 4: PERFORMANCE & ESCALABILIDADE

### 🔲 4.1 Virtual Scrolling para Listas Grandes
- **Problema**: Tabelas com 300+ registros renderizam tudo no DOM
- **Ação**: Implementar `@tanstack/react-virtual` nas DataTables principais
- **Complexidade**: Média

### 🔲 4.2 Índices de Banco de Dados
- **Problema**: Queries frequentes (entregas por status, coletas por data) sem índices otimizados
- **Ação**: Criar migration com índices para:
  - `entregas(status, created_at)`
  - `coletas(status, data_prevista_coleta)`
  - `ocorrencias(entrega_id, created_at)`
  - `notifications(user_id, read, created_at)`
- **Complexidade**: Baixa

### ✅ 4.3 Stale Time Padronizado (CORRIGIDO)
- **Problema**: Alguns hooks usam `staleTime: 0`, outros `30000`, sem padrão
- **Status**: ✅ `lib/queryConfig.ts` criado com constantes centralizadas (STATIC/DASHBOARD/DYNAMIC/REALTIME), Dashboard e Notifications atualizados

### 🔲 4.4 Prefetch de Rotas Frequentes
- **Problema**: Navegação entre páginas sempre recarrega dados
- **Ação**: Implementar prefetch no hover dos links do sidebar
- **Complexidade**: Baixa

### 🔲 4.5 Service Worker — Cache de Assets
- **Problema**: `sw.js` existe mas cache strategy pode ser melhorada
- **Ação**: Implementar stale-while-revalidate para API calls e cache-first para assets
- **Complexidade**: Média

---

## 🟣 CATEGORIA 5: UX & ACESSIBILIDADE

### ✅ 5.1 Mobile Responsiveness — Tabelas (CORRIGIDO)
- **Problema**: DataTables em telas < 768px têm overflow horizontal
- **Status**: ✅ Componente `MobileCardView` criado para uso em todas as páginas de listagem

### 🔲 5.2 Keyboard Navigation Completa
- **Problema**: Alguns modais e dropdowns não são acessíveis via teclado
- **Ação**: Audit de acessibilidade com `FocusTrap` em todos os modais
- **Complexidade**: Baixa

### 🔲 5.3 Dark Mode — Contraste
- **Problema**: Alguns componentes podem ter contraste insuficiente no dark mode
- **Ação**: Audit de WCAG AA compliance em todos os tokens de cor
- **Complexidade**: Baixa

### 🔲 5.4 Feedback Visual em Ações Longas
- **Problema**: Sync Rodonaves, import de dados, etc. não mostram progresso
- **Ação**: Implementar progress bar com estimativa de tempo
- **Complexidade**: Média

### 🔲 5.5 Onboarding Interativo
- **Problema**: Wizard existe mas não guia o usuário pela primeira entrega/coleta
- **Ação**: Criar tour guiado que acompanha o primeiro fluxo completo
- **Complexidade**: Alta

---

## 🟢 CATEGORIA 6: QUALIDADE DE CÓDIGO

### 🔲 6.1 Testes E2E
- **Problema**: Zero testes end-to-end; só unit tests básicos
- **Ação**: Implementar testes E2E para fluxos críticos:
  - Login → Dashboard → Criar entrega → Despachar → Rastrear
  - Cotação de frete → Seleção de transportadora → Despacho
- **Complexidade**: Alta

### 🔲 6.2 Cobertura de Testes > 30%
- **Problema**: Cobertura atual ~5% (8 arquivos de teste)
- **Ação**: Adicionar testes unitários para todos os hooks de negócio
- **Complexidade**: Alta

### ✅ 6.3 Error Boundaries Granulares (CORRIGIDO)
- **Problema**: Um erro em um widget do dashboard derruba toda a página
- **Status**: ✅ `WidgetErrorBoundary` criado e aplicado em todos os 10 widgets do Dashboard

### 🔲 6.4 Documentação de API Pública
- **Problema**: Página `/api-docs` existe mas pode estar desatualizada
- **Ação**: Auto-gerar docs a partir dos endpoints reais
- **Complexidade**: Média

### 🔲 6.5 Hooks Mock vs Real — Migração Completa
- **Problema**: Hooks mock (`useAnalytics`, `useDashboardMetrics`, etc.) coexistem com hooks reais
- **Ação**: Substituir imports dos mock pelos reais em todas as páginas, ou criar adapter pattern
- **Complexidade**: Média

---

## 🔶 CATEGORIA 7: SEGURANÇA

### 🔲 7.1 Rate Limiting em Edge Functions
- **Problema**: Edge functions `public-api`, `rodonaves-api` não têm rate limiting
- **Ação**: Implementar rate limiting usando `check-rate-limit` function
- **Complexidade**: Média

### 🔲 7.2 Validação de Input nas Edge Functions
- **Problema**: Inputs de edge functions não são validados (ex: `nfNumero` pode ser qualquer string)
- **Ação**: Adicionar validação com schema (Zod) em todas as edge functions
- **Complexidade**: Média

### 🔲 7.3 Audit Trail para Operações Sensíveis
- **Problema**: Deleções de transportadoras, alterações de preço não geram audit log
- **Ação**: Implementar trigger automático de audit para tabelas sensíveis
- **Complexidade**: Média

### 🔲 7.4 CORS Restritivo em Produção
- **Problema**: Todas as edge functions usam `Access-Control-Allow-Origin: *`
- **Ação**: Restringir para domínio(s) de produção
- **Complexidade**: Baixa

---

## 📊 RESUMO QUANTITATIVO

| Categoria | Total Items | Críticos | Corrigidos |
|-----------|-------------|----------|------------|
| 1. Bugs Críticos | 6 | 6 | 2 |
| 2. Integrações | 7 | 3 | 0 |
| 3. Funcionalidades | 7 | 2 | 0 |
| 4. Performance | 5 | 1 | 0 |
| 5. UX/Acessibilidade | 5 | 0 | 0 |
| 6. Qualidade | 5 | 1 | 0 |
| 7. Segurança | 4 | 2 | 0 |
| **TOTAL** | **39** | **15** | **2** |

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

### Sprint 1 — Fundação (Críticos)
1. ~~Fix enum Rodonaves~~ ✅
2. Adicionar `rodonaves-api` e `check-password-breach` ao config.toml
3. Corrigir RLS policies permissivas
4. Validação de CNPJ
5. Rate limiting nas edge functions

### Sprint 2 — Integrações Core
6. Comprovante de entrega Rodonaves na UI
7. Cotação Rodonaves integrada ao despacho
8. Prazo Rodonaves no calendário
9. Rastreamento público funcional
10. Upload de comprovantes (Storage)

### Sprint 3 — Automação
11. E-mail transacional com Resend
12. Relatórios agendados (envio real)
13. Loja de recompensas funcional
14. Import CSV/Excel conectado
15. Webhook Rodonaves

### Sprint 4 — Performance & UX
16. Índices de banco
17. Stale time padronizado
18. Virtual scrolling
19. Mobile card views
20. Error boundaries granulares

### Sprint 5 — Qualidade & Segurança
21. Testes E2E
22. Cobertura > 30%
23. Audit triggers automáticos
24. CORS restritivo
25. Migração hooks mock → real

---

**Nota**: Este plano substitui o anterior em `docs/MELHORIAS.md`. Cada item deve ser implementado com excelência antes de avançar ao próximo.
