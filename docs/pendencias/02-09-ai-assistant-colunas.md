# 2.9 — ai-logistics-assistant seleciona colunas inexistentes

- **Problema**: `score_frete`/`score_pontualidade`/`gravidade` não existem no schema;
  tráfego/clima fixos em vez de dinâmicos.
- **Fix**: remover selects inválidos; usar inputs reais (fretes/coletas/veger_o).
- **Status**: resolvido
- **Verificado**: fix em main via #211 — selects inválidos removidos; assistente consulta
  `transportadoras(nome_fantasia)` e `ocorrencias` reais (index.ts:87-107).
