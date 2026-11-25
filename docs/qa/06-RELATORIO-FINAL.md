# Relatório final — auditoria QA do Loggi Flow V2

> 2026-11-25 · `main` em `c0df8438b` · banco `jvfhclubfpxrtrrazrgr` · plano de 300 etapas em
> `docs/qa/` (achados em `03-ACHADOS.md`, execução em `05-PROGRESSO.md`)

## 1. Resultado em três linhas

- **271 das 300 etapas estão fechadas, 29 esperam você e nenhuma está não iniciada.** O plano deixou de ter
  trabalho de código parado: o que sobrou cabe em seis tipos de trava, e nenhum deles é "falta programar".
- **Os cinco riscos que abriam este relatório em 24/11 estão fechados.** O banco passou a recusar transição
  inválida de entrega e de coleta e a barrar despacho sem nota fiscal (triggers das etapas 028-033, aplicados
  em produção); `user_panel_preferences` existe e o `types-sync` voltou verde (etapa 222); a RLS de
  `scheduled_reports` e de geo-blocking já estava habilitada (023-025); e a consulta do Painel SLA foi medida
  em **0,12 ms**, então os três índices propostos não se pagam (228-232).
- **O que ainda não tem prova** é o que só se vê fora do repositório: duas restrições de chave no painel
  (S-05/S-08), o erro de front chegando ao Sentry (285/286) e nenhum teste de ponta a ponta rodando de verdade
  (283).

## 2. O que ainda é risco, por ordem de dano

1. **Código de rastreio sem unicidade (etapa 027).** A 026 conferiu no banco ao vivo: `numero_coleta` e
   `numero_entrega` têm `UNIQUE`; o código de rastreio, não. Dois pedidos podem carregar o mesmo código e a
   busca por rastreio devolve o pedido errado.
2. **Modo de teste e segredo de webhook só conferíveis no painel (002, 010, 011, S-05).**
   `NEXUS_WEBHOOK_SECRET` e `ALLOW_TEST_MODE` não são legíveis do repositório; com o modo de teste ligado em
   produção, um webhook de teste passa como verdadeiro.
3. **Erro de tela de usuário invisível (285/286).** Enquanto `VITE_SENTRY_DSN` não estiver confirmado no Vercel,
   falha em produção não deixa registro — foi assim que os bugs desta auditoria chegaram até você por print.
4. **Funções e buckets órfãos no ar (070, 073, 075, 076).** `reconcile_pending_freights()` não tem tabela para
   reconciliar; `ingest-biosync` inventa batimento com `Math.random()` (`index.ts:43`) e não tem chamador; dois
   buckets de foto (`comprovantes`, `entregas-fotos`) não são usados pelo código.
5. **Importação em massa sem rastro (120).** O histórico vive em `ImportacaoMassa.tsx:171` (`useState`): a tela
   fecha e some com quem importou o quê.
6. **Cotação por transportadora sem resposta gravada em produção (039, 041).** O código foi entregue na 038;
   falta credencial de transportadora para provar que `valor_cotado`/`responded_at` chegam ao banco.
7. **Agentes sem o schema real do banco (263).** Sem o secret `SUPABASE_DB_URL`, a fonte de contexto do banco
   nunca é gerada e toda tarefa nova começa supondo tabelas, RLS e funções.
8. **Produto e higiene (043, 272, 274, 016, 017, 014, 006, 008, 009).** Duas telas de cotação sem papel
   definido, dois locks de bun defasados versionados, e o repositório segue público.

## 3. As 29 decisões, por tipo de trava

| Tipo de trava | Etapas | O que você decide | Recomendação |
| --- | --- | --- | --- |
| **DDL em produção** (Regra 8) | 027, 070, 073, 075, 076 | Autorizar as migrations | Sim, todas: `UNIQUE` no código de rastreio, `DROP` das duas funções órfãs e dos dois buckets sem uso |
| **Secret ou painel** | 002, 010, 263, 285, 286, 295 | Confirmar o valor no painel | Comece por `SUPABASE_DB_URL` (263) e `VITE_SENTRY_DSN` (285): são os dois que devolvem capacidade ao sistema e a você |
| **CI/workflow** | 248, 255, 257, 273 | Mergear as PRs [#468](https://github.com/adm01-debug/Loggi_Flow_V2/pull/468), [#469](https://github.com/adm01-debug/Loggi_Flow_V2/pull/469), [#470](https://github.com/adm01-debug/Loggi_Flow_V2/pull/470) | Sim: nenhuma delas toca produção, só o que a CI confere |
| **Produto/integração** | 006, 008, 009, 011, 014, 016, 017, 043, 120, 272, 274 | Escolher o comportamento | Manter as duas telas de cotação com papel explícito (043), gravar a importação em `audit_logs` (120) e remover os locks de bun (272/274) |
| **Credencial de terceiro** | 039, 041 | Liberar credencial de uma transportadora | Sim: é a única forma de provar a cotação e o blast/e-mail em produção |
| **E2E** | 283 | Semear o usuário de teste | Sim: sem ele nenhum fluxo real é exercitado pela CI |

## 4. Os números

| Indicador | Valor | Fonte |
| --- | --- | --- |
| Etapas do plano | **271 concluídas · 29 esperando você · 0 não iniciadas** | `05-PROGRESSO.md` em `c0df8438b` |
| Com as 3 PRs abertas mergeadas | 275 concluídas · 25 esperando | #468 (248, 273), #469 (255), #470 (257) |
| Achados | 38 resolvidos · 16 parciais · 12 abertos (de 65) | marcadores do corpo de `03-ACHADOS.md` |
| `tsc --noEmit` | 0 erros | etapa 299 |
| Lint | **80 avisos · 0 erros** (era 105), teto cravado em 80/80 | etapa 299 + [#464](https://github.com/adm01-debug/Loggi_Flow_V2/pull/464) |
| Testes de unidade | **109 arquivos · 991 testes · 0 falha** | etapa 299 |
| Cobertura | 77,04 statements · 71,48 branches · 74,69 functions · 79,18 lines (pisos 70/67/73/72) | etapa 299 |
| RLS e segurança | 19/19 e 19/19 testes | etapa 299 |
| `.env` rastreado | 0 arquivos | etapa 299 |
| `SECURITY DEFINER` sem `search_path` | **0** | etapa 299 |
| Edge functions | 44 | `inventario/estado/edges.json` |
| Telas com rota | 61 | `inventario/estado/rotas.json` |
| Cron jobs no banco | 28 jobs, **0 com falha** na última execução | `inventario/estado/banco.json` + etapa 290 |

## 5. O que a auditoria não pôde verificar

- **As duas restrições de chave** (S-05 `ALLOW_TEST_MODE`, S-08 URL do token Mapbox): só existem no painel do
  Supabase e no do Mapbox. O código foi conferido; o valor em produção, não.
- **Fim a fim no navegador**: a etapa 283 continua aberta — nenhum fluxo foi exercitado contra o Supabase real
  nesta execução, só contra dublês.
- **Efeito em produção das correções de front**: o deploy do Vercel sobe a cada merge, mas sem Sentry (285/286)
  não há prova de que a tela corrigida se comporta como o teste diz. O commit `c0df8438b` não aparece na API de
  deployments do GitHub, então o repositório sozinho não prova qual versão está no ar.
- **Proteção de branch**: `strict = false` — CI verde numa PR antiga não prova nada sobre a `main` de hoje.
- **O banco ao vivo, só em parte**: as consultas de 2026-11-24 fecharam F-02, F-03, P-05 e P-06 e provaram que
  `webhook_failures` e `cron_job_logs` não existem; o que depende de painel (S-05, S-08) segue como hipótese.

**Aprendizado que evita a repetição:** documento sem data, sem commit e sem o nome do banco custou mais caro que
qualquer bug encontrado — foi o que fez uma auditoria inteira nascer de um `ESTADO_ATUAL.md` que descrevia um
sistema que já não existia. Por isso o inventário semanal agora datado (`inventario/estado/contagens.json`,
etapa 257) e os gates de CI passaram a conferir os fatos que os documentos afirmam (etapas 248, 255 e 273).