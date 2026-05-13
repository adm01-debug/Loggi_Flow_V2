# ADR 0005: Observabilidade e Resiliência

## Data
2026-05-13

## Status
Aceito

## Contexto
Sistemas logísticos operam 24/7 e requerem detecção rápida de falhas.

## Decisão
- **Sentry:** Monitoramento centralizado de erros no frontend e backend.
- **Structured Logging:** Logs em formato JSON com IDs de correlação (`x-request-id`) para rastrear fluxos completos.
- **Health Checks:** Endpoints dedicados para monitoramento de uptime de serviços e conexões de banco de dados.
- **Feature Flags:** Tabela no banco de dados para controle remoto de funcionalidades sem necessidade de novo deploy.

## Consequências
- **Prós:** MTTR (Mean Time To Repair) reduzido, capacidade de rollback de funcionalidades em tempo real.
- **Contras:** Custo operacional levemente maior para manutenção das ferramentas de monitoramento.
