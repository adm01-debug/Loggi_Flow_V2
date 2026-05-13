# ADR 0004: Gestão de Estado e Validação

## Data
2026-05-13

## Status
Aceito

## Contexto
Necessidade de consistência entre os dados validados no frontend e no backend.

## Decisão
- **Zod:** Uso obrigatório de Zod para schemas de validação.
- **Shared Schemas:** Schemas localizados em `src/lib/schemas/` e referenciados nas Edge Functions via `import_map.json` para garantir que a mesma regra de validação seja aplicada em ambos os lados.
- **TypeScript Strict:** O projeto deve migrar e manter o modo `strict: true` para evitar erros de tempo de execução por valores nulos ou indefinidos.

## Consequências
- **Prós:** Redução drástica de bugs de "undefined is not a function", documentação viva via código.
- **Contras:** Maior tempo inicial de desenvolvimento para definição de interfaces e tipos.
