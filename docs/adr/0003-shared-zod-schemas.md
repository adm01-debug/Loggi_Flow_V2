---
name: ADR 0003: Validação Runtime e Schemas Compartilhados
description: Uso de Zod para garantir que dados externos e internos sigam contratos rigorosos em ambos os lados da stack.
date: 2026-05-13
---

## Contexto
A validação no backend era muitas vezes manual ou inexistente, enquanto o frontend já utilizava Zod para formulários.

## Decisão
1. Criado diretório `src/lib/schemas/` para definições de contratos de dados (Address, Carrier, Delivery).
2. Implementado `import_map.json` nas Edge Functions para permitir a importação desses mesmos schemas no Deno.
3. Padronizado o uso de Zod em novas Edge Functions e refatorações.

## Consequências
- Fim de erros silenciosos em respostas de APIs de terceiros.
- Sincronização automática de regras de validação (ex: regex de CNPJ) entre o formulário do usuário e o banco de dados.