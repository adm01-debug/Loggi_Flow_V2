# 🚒 LOGIFLOW SRE & ON-CALL HANDBOOK

## 📊 SLOs (Service Level Objectives)
- **Uptime:** 99.9% (mensal)
- **Latência P95:** < 800ms para requisições de cotação
- **Erro Rate:** < 0.5% (excluindo 4xx do cliente)
- **MTTR (Mean Time To Recovery):** < 2 horas para SEV-1

## 🚨 MATRIZ DE SEVERIDADE
| Nível | Descrição | Impacto | Resposta |
|---|---|---|---|
| **SEV-1** | Sistema inoperante | Bloqueio total de vendas/entregas | Imediata (24/7) |
| **SEV-2** | Integração falhando | Lalamove ou Rodonaves fora | 30 min (Horário comercial) |
| **SEV-3** | Bug visual / UX | Inconveniência sem perda de dados | Próxima sprint |

## 📞 ESCALONAMENTO
1. **L1 (Suporte):** Monitoramento via UptimeRobot/Sentry.
2. **L2 (Dev On-Call):** Debugging e hotfix.
3. **L3 (SRE/Arquiteto):** Infraestrutura e Banco de Dados.

## 🔄 POST-MORTEM POLICY
Todo incidente SEV-1 ou SEV-2 exige um post-mortem blameless em até 48h.
Template em: `docs/POSTMORTEM_TEMPLATE.md`.
