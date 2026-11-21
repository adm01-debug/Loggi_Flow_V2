# 3.19 — "Cotar via API" não chama API real

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: `handleCotarAPI` em `src/pages/CotacaoMultiCanal.tsx:331-372` calcula
  `valorCalculado = taxa_fixa + preco_por_kg * peso` localmente e insere em `cotacoes_multicanal`
  com `canal:"api"` e observação "Cotação via Nexus Blast (API)" — **nenhuma chamada de rede/edge**.
- **Estado real**: NÃO IMPLEMENTADO (simulação). Sem pressão do item para "API" — a cotação é
  persistida e exibida, mas o rótulo "API" é falso.
- **Camadas**: front (`CotacaoMultiCanal.tsx`), possível edge `nexus-api` inexistente.
- **Regras de negócio**: `_regras-de-negocio.md` (cotações persistidas em `cotacoes_multicanal`).
- **Raio de impacto**: `DashboardCotacoes` (3.20) lê a mesma tabela.
- **Aceite**: "Cotar via API" dispara um request a uma edge/API de verdade OU rótulo deixa de
  afirmar "API" quando é cálculo local. Decisão de negócio: se não há API agregadora contratada,
  renomear UX ("Cotar padrão") mantendo o cálculo atual é a opção sem custo.
- **Status**: CONCLUÍDO em 2026-11-20 (PR #226) e refinado em 2026-11-21 (PR #252).
- **Resolução**: `handleCotarAPI` agora grava `status:"pendente"` com observação "Cotação via
  Nexus Blast (API) — aguardando resposta da transportadora" em vez de `"respondido"` calculado
  localmente (mesmo comportamento no estado local via `addCotacao`). A resposta real continua
  entrando pelo fluxo existente (`handleRespond`/Registrar Resposta). Nenhuma migration necessária.
- **Refino (PR #252)**: Select "Estratégia Nexus" agora é controlado (`value`/`onValueChange`) e os pesos dos badges/árvore "Melhor Custo-Benefício" usam a tabela real `freight_selection_rules` (Normal 70/20/10, Urgente 20/60/20, Evento 40/40/20) via `STRATEGY_WEIGHTS`; comentário falso "automation would trigger here" removido.
- **Evidência**: `npm run typecheck` limpo; eslint 0 erros; PR mergeada sem bloqueio.
