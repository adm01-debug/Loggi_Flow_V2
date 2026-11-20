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
- **Status**: inventariado (aguarda decisão/código).
