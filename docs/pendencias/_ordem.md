# Ordem de execução — backlog pendencias Loggi Flow V2

Fonte: docs/audit/2026-11-20_funcionalidades_nao_implementadas.md (PR #206).
Estado do main auditado: 08d5a138 (após merges #206-#210, 2026-11-20).

## Fase A — Itens QUEBRADOS (seção 2) que alteram dado/mentem ao usuário

Feitos via #207/#208: 2.1, 2.2, 2.3, 2.4.
Já corrigidos em main (verificação nov/20): 2.13 (grants reconsiderados), 2.15 (cnpjDefault).
Pendentes (esta sessão, branch fix-rotos-2):

- 2.5 profiles.phone → whatsapp (transportadora/whatsapp) — alerta de atraso
- 2.6 nexus-auto-healing coluna data_coleta_efetiva
- 2.8 Ranking embed + período + conquistas
- 2.9 ai-assistant colunas inexistentes (score_frete/pontualidade/gravidade)
- 2.10 kanban_history embed display_name
- 2.12 bitrix test-connection
- 2.14 webhook_deliveries metadata inexistente
- 2.16 MissionDetail integracoes_bitrix
  Notas: 2.7 (fretes_internos deleted_at) — sem migration de deleted_at, tratar como achado.

## Fase B — Simulações exibidas como dado real (seção 3)

## Fase C — Botões/telas sem efeito (seção 4)

## Fase D — Integrações parciais (seção 5)

## Fase E — Automação (seção 6)

## Fase F — Segurança (seção 7: MFA feito nº209, restante)

## Fase G — Gamificação (seção 8)

## Fase H — Banco (seção 9)

## Fase I — Observabilidade (seção 10)

## Fase J — Qualidade/CI (seção 11)

## Fase K — Docs (seção 12/13: nº210 feito, morto)
