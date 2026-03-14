# 📋 PLANO EXAUSTIVO DE MELHORIAS — LogiFlow 2026

> Última atualização: 2026-03-14 (Sprint 6 concluído)
> Status: 27/39 itens concluídos

---

## 🔴 CATEGORIA 1: BUGS CRÍTICOS — ✅ COMPLETO
- ✅ 1.1 Rodonaves API — Status Inválidos no Enum
- ✅ 1.2 Rodonaves Status Codes — Type Mismatch
- ✅ 1.3 Edge Functions Ausentes no config.toml
- ✅ 1.4 `check-password-breach` Ausente no config.toml
- ✅ 1.5 RLS Policies Excessivamente Permissivas
- ✅ 1.6 `geo_blocked_attempts` Sem INSERT Policy

---

## 🟠 CATEGORIA 2: INTEGRAÇÕES INCOMPLETAS
- ✅ 2.1 Rodonaves — Webhook de Notificação Automática
- ✅ 2.4 Rodonaves — Comprovante de Entrega no Fluxo
- 🔲 2.2 Rodonaves — Cotação Integrada ao Fluxo de Despacho
- 🔲 2.3 Rodonaves — Prazo Integrado ao Calendário Logístico
- 🔲 2.5 Bitrix24 — Sync Bidirecional
- 🔲 2.6 Lalamove — Rastreamento Real-Time em Mapa
- 🔲 2.7 WhatsApp — Notificações ao Cliente

---

## 🟡 CATEGORIA 3: FUNCIONALIDADES PENDENTES
- ✅ 3.1 E-mail Transacional com Resend
- ✅ 3.2 Import CSV/Excel Real
- ✅ 3.3 Upload de Comprovantes/NFs — Storage bucket `documents` + `DocumentUploadField` + integrado em Envios
- ✅ 3.4 Loja de Recompensas Funcional
- ✅ 3.5 Relatórios Agendados — Envio Real
- ✅ 3.6 Rastreamento Público Funcional
- 🔲 3.7 Validação de CNPJ com Dígitos Verificadores

---

## 🔵 CATEGORIA 4: PERFORMANCE & ESCALABILIDADE
- ✅ 4.1 Virtual Scrolling — `useVirtualTable` hook + `@tanstack/react-virtual` instalado
- ✅ 4.2 Índices de Banco de Dados
- ✅ 4.3 Stale Time Padronizado
- ✅ 4.4 Prefetch de Rotas Frequentes — `usePrefetch` hook integrado no AppSidebar
- ✅ 4.5 Service Worker — Cache melhorado (cache-first assets, stale-while-revalidate API, network-first HTML)
- ✅ 5.1 Mobile Responsiveness — Tabelas
- ✅ 6.3 Error Boundaries Granulares

---

## 🟣 CATEGORIA 5: UX & ACESSIBILIDADE
- 🔲 5.2 Keyboard Navigation Completa
- 🔲 5.3 Dark Mode — Contraste
- 🔲 5.4 Feedback Visual em Ações Longas
- 🔲 5.5 Onboarding Interativo

---

## 🟢 CATEGORIA 6: QUALIDADE DE CÓDIGO
- 🔲 6.1 Testes E2E
- 🔲 6.2 Cobertura de Testes > 30%
- 🔲 6.4 Documentação de API Pública
- 🔲 6.5 Hooks Mock vs Real — Migração Completa

---

## 🔶 CATEGORIA 7: SEGURANÇA — ✅ COMPLETO
- ✅ 7.1 Rate Limiting em Edge Functions
- ✅ 7.2 Validação de Input nas Edge Functions
- ✅ 7.3 Audit Trail para Operações Sensíveis
- ✅ 7.4 CORS Restritivo em Produção

---

## 📊 RESUMO

| Categoria | Total | Feitos |
|-----------|-------|--------|
| 1. Bugs Críticos | 6 | 6 |
| 2. Integrações | 7 | 2 |
| 3. Funcionalidades | 7 | 6 |
| 4. Performance | 7 | 7 |
| 7. Segurança | 4 | 4 |
| 5. UX | 4 | 0 |
| 6. Qualidade | 4 | 0 |
| **TOTAL** | **39** | **25** |

### Pendentes (14 itens)
- 5 integrações avançadas (Bitrix bidirecional, Lalamove mapa, WhatsApp, Rodonaves cotação/prazo)
- 4 UX (keyboard nav, dark mode audit, progress bars, onboarding tour)
- 4 qualidade (E2E, cobertura, docs API, hooks migration)
- 1 funcionalidade (CNPJ validação)
