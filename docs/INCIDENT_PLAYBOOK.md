# 🛠️ LogiFlow Incident Playbook

Protocolos de resposta rápida para manutenção da excelência 10/10.

## 🚨 Nível 1 — Indisponibilidade Total do Sistema

1. **Verificar Status Cloud:** Checar dashboard do Supabase e Cloudflare.
2. **PWA Offline:** O sistema deve exibir o `OfflineBanner` automaticamente.
3. **Rollback de Migration:** Se falha ocorreu após deploy, executar rollback via script de contingência.
4. **Comunicação:** Disparar alerta via Slack/WhatsApp para administradores.

## 🔌 Nível 2 — Falha em Integração Externa (Lalamove/Rodonaves)

1. **Circuit Breaker:** O sistema deve abrir o circuito automaticamente após 3 falhas seguidas.
2. **Fallback Manual:** Notificar operador para realizar a cotação/despacho manualmente via portal da transportadora.
3. **Log Check:** Inspecionar `error_events` no banco para identificar se é falha de autenticação ou timeout.
4. **Resilience:** Aguardar o reset timeout (30s) para tentativa de HALF-OPEN.

## 🔑 Nível 3 — Possível Incidente de Segurança (Leaks)

1. **Regenerar Secrets:** Invalidar chaves de API do Rodonaves/Lalamove via `AdminSettings`.
2. **Password Force Reset:** Se detecção de brecha em massa, forçar logout de todas as sessões via RPC `force_logout_all`.
3. **Audit Trail Review:** Exportar logs da última hora para análise forense.

## 📉 Nível 4 — Performance Degradada

1. **Index Optimization:** Executar `EXPLAIN ANALYZE` nas queries lentas identificadas no Analytics.
2. **Partitioning Check:** Verificar se o volume de logs exige criação de novas partições mensais.
3. **Bundle Size:** Auditar se novos componentes estão impactando o LCP.

---
**Contato de Emergência:** squad-sre@logiflow.app
