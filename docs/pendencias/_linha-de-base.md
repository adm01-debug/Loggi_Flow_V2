# Linha de base de regressão — Loggi Flow V2

> Captura em main @ 08d5a138 (2026-11-20), após merges #206-#210.
> Piso: nada abaixo disso pode piorar.

## Build/typecheck

- `npm run typecheck` (`tsc --noEmit`): 0 erros (exit 0) — executado em 2026-11-20.

## Inventário do que funciona (fluxos críticos)

- Login e auth (incl. MFA ex: #209), Kanban de entregas, Coletas, Fretes internos,
  Relatórios, Configurações, Ranking, Assistente IA, webhooks p/ clientes, Lalamove,
  Rodonaves, Melhor Envio, Bitrix24, LGPD erase (#208), OCR de comprovante (#207).

## Erros herdados conhecidos (baseline)

- Documentados em docs/audit/2026-11-20 (seções 2-16) e a cada item abaixo.
