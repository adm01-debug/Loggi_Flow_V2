# 🚑 Plano de Resposta a Incidentes (IRP)

Este documento define os procedimentos de resposta para falhas críticas no LogiFlow.

## 📊 Matriz de Severidade

| SEV | Descrição | SLA de Resposta |
|-----|-----------|-----------------|
| SEV-1 | Sistema fora do ar ou perda massiva de dados | 15 min |
| SEV-2 | Funcionalidade core impactada (ex: cotação indisponível) | 1 hora |
| SEV-3 | Bug não impeditivo ou erro visual | 24 horas |

## 🛠️ Escalabilidade de Resposta

1. **Detecção:** Via Sentry, UptimeRobot ou alertas de telemetria.
2. **Triagem:** Identificar se a falha é Cloud (Supabase/Lovable) ou Integração (Terceiros).
3. **Contenção:** Ativar Feature Flags ou modo de contingência manual.
4. **Resolução:** Deploy de correção ou restauração de backup.
5. **Comunicação:** Notificar stakeholders via canal `#logiflow-incidentes`.

## 🔄 Fluxo de On-Call
Atualmente operado sob modelo SRE (Site Reliability Engineering) pelo time de infraestrutura.
- **Lead SRE:** Claude AI Assistant
- **Fallback:** Squad Operacional
