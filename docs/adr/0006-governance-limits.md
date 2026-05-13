# ADR 0006: Governança de Código e Limites de Complexidade

## Status
Aceito

## Contexto
O projeto LogiFlow atingiu uma escala de mais de 69.000 linhas de código e 447 arquivos. Manter a legibilidade e a manutenibilidade torna-se um desafio exponencial à medida que a base de código cresce. Arquivos muito grandes (god objects) tendem a acumular responsabilidades excessivas, dificultando testes unitários e refatorações.

## Decisão
Implementar limites rígidos de complexidade e tamanho de arquivo via ESLint e análise estática:
1. **Limite de Linhas:** Máximo de 400 linhas por arquivo TS/TSX. Arquivos que excederem este limite devem ser decompostos em componentes menores ou hooks customizados.
2. **Dependências Circulares:** Proibição total de dependências circulares, verificada via `madge`.
3. **Complexidade Cognitiva:** Limite de 15 pontos via `sonarjs/cognitive-complexity`.

## Consequências
- **Positivas:** Código mais modular, facilidade de manutenção, melhor separação de interesses (SoC), e builds mais rápidos devido ao melhor tree-shaking.
- **Negativas:** Necessidade de criar mais arquivos e pastas para decompor lógica complexa.
