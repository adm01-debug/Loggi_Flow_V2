# 02 — MATRIZ DE CENÁRIOS

> Auditoria somente-leitura · `main` em `d37ba30` · 2026-11-22/23

## Como esta matriz foi gerada e como ler os resultados

Os cenários **não foram improvisados**. Para cada jornada que grava dado, cruzamos quatro dimensões:

- **ator**: visitante sem login · `user` autenticado · `admin` · terceiro (webhook) · chamador interno (cron)
- **estado do dado**: vazio · um registro · muitos · no limite · inválido · duplicado · já excluído
- **entrada**: válida · vazia · enorme · malformada · com caractere especial · no valor de borda
- **condição**: duplo clique · duas abas · dois usuários ao mesmo tempo · rede caindo no meio · sessão expirada · terceiro fora do ar · reenvio · passos fora de ordem

Cada linha traz **resultado esperado**, **resultado encontrado** e a marca de método:

| Marca         | Significado                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| **EXECUTADO** | Um comando, teste ou consulta foi rodado e o resultado foi observado.                                             |
| **RASTREADO** | O caminho foi seguido lendo o código (interface → hook → chamada → backend → banco → resposta). Nenhuma execução. |

### Por que quase tudo está RASTREADO — e o que isso custa

Escrever dado nesta auditoria significaria escrever **em produção**: não existe staging, o banco é um só, e a
sessão foi declarada somente-leitura. Além disso o projeto Supabase oficial (`jvfhclubfpxrtrrazrgr`) **não
ficou acessível** (ver seção 8 de `01-INVENTARIO.md`). Logo:

- **Nenhum cenário de escrita foi executado.** Nenhum. Onde a tabela diz RASTREADO, a conclusão vem da
  leitura do código, não de um teste.
- Os únicos EXECUTADOS são os que não tocam dado: gates de qualidade, auditoria de dependências e a suíte
  de testes já existente no repositório.
- Como **100% das 61 telas e 96,6% dos arquivos de hook não têm teste** (`01-INVENTARIO.md` §11), a suíte
  existente não cobre nenhuma destas jornadas. Rodá-la não valida nenhuma linha abaixo.

Toda linha em que o encontrado difere do esperado virou achado em `03-ACHADOS.md`, com o ID na última coluna.

---

## 0. O que foi EXECUTADO (a totalidade)

Ambiente: `npm ci` rodado antes (sem isso o typecheck devolve 19.705 erros falsos — ver `01-INVENTARIO.md` §1).

| #   | Comando                                                                         | Esperado                                   | Encontrado                                                            | Método    |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- | --------- |
| E1  | `npx tsc --noEmit`                                                              | 0 erros                                    | **0 erros**, exit 0                                                   | EXECUTADO |
| E2  | `npx eslint .`                                                                  | ≤105 warnings, 0 erros                     | **105 warnings, 0 erros**                                             | EXECUTADO |
| E3  | `npm run lint:budget`                                                           | dentro do orçamento                        | OK — **105/105** warnings, 0/0 erros, 0/0 tsErrors                    | EXECUTADO |
| E4  | `npm run validate:csp`                                                          | CSP válida                                 | OK                                                                    | EXECUTADO |
| E5  | `npm run validate:no-console`                                                   | sem `console.*` cru nas edges              | OK — 107 arquivos                                                     | EXECUTADO |
| E6  | `npm run security-scan`                                                         | sem critical/high fora da allowlist        | OK **+ aviso: allowlist sem efeito para `xlsx`, `vite`, `picomatch`** | EXECUTADO |
| E7  | `npm audit --json`                                                              | sem vulnerabilidade                        | **0** (critical 0, high 0, moderate 0, low 0)                         | EXECUTADO |
| E8  | `git ls-files .env` / `git check-ignore .env`                                   | não rastreado                              | **rastreado e fora do `.gitignore`**                                  | EXECUTADO |
| E9  | Decodificar o payload das chaves de `.env` e `docs/ops/cron_jobs_origem.json`   | nenhuma chave de servidor                  | todas `"role":"anon"`                                                 | EXECUTADO |
| E10 | API do GitHub: visibilidade do repositório                                      | privado (como diz o `AGENTS.md`)           | **`"visibility":"public"`**                                           | EXECUTADO |
| E11 | Script próprio: última definição de cada uma das 119 funções SQL das migrations | todas `SECURITY DEFINER` com `search_path` | 83 com, **2 sem**, 34 não-definer                                     | EXECUTADO |

**O gate `E3` merece atenção do dono:** o orçamento está no teto exato (105 de 105). Qualquer etapa do plano
que introduza **um** aviso de lint quebra a CI e obriga o executor a sair do escopo da etapa. Ver H-10.

---

## 1. J1 — Entrar no sistema

| #   | Ator      | Estado | Entrada | Condição                                 | Esperado                                 | Encontrado                                                                                              | Método    | Achado   |
| --- | --------- | ------ | ------- | ---------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------- | -------- |
| 1.1 | visitante | —      | —       | abre rota protegida direto na URL        | redireciona para `/auth`                 | redireciona (`ProtectedRoute` → `Navigate to="/auth"`, `src/components/auth/ProtectedRoute.tsx:27`)     | RASTREADO | —        |
| 1.2 | `user`    | —      | —       | abre uma das 12 rotas de admin na URL    | redireciona para `/`                     | redireciona (`ProtectedRoute.tsx:31`, `requiredRole="admin"` em `src/App.tsx:164-175`)                  | RASTREADO | —        |
| 1.3 | `user`    | —      | —       | sessão expira com a tela aberta          | volta para `/auth`                       | `useSessionTimeout` com intervalos limpos (`src/hooks/auth/useSessionTimeout.ts:85,112-116`)            | RASTREADO | —        |
| 1.4 | visitante | —      | —       | enquanto `isLoading` do auth             | spinner, não conteúdo                    | spinner (`ProtectedRoute.tsx:17-24`)                                                                    | RASTREADO | —        |
| 1.5 | `user`    | —      | —       | **o guard do front é a única proteção?** | não: o RLS do banco tem de barrar também | guard é só UX; a proteção real depende de RLS por tabela, que **não pôde ser verificado no banco vivo** | RASTREADO | **F-02** |

> **1.5 é a linha mais importante desta matriz.** Em Supabase a autorização verdadeira é a policy de RLS; o
> `ProtectedRoute` só esconde a tela. Como o banco não ficou acessível, a auditoria **não pôde confirmar** que
> as 12 telas de admin estão protegidas no banco além da tela. Ver F-02 e a etapa 001 do plano.

## 2. J2/J3 — Criar coleta e conferir na expedição

| #   | Ator   | Estado     | Entrada                                           | Condição             | Esperado                        | Encontrado                                                                                                                                                                                                                                                     | Método    | Achado   |
| --- | ------ | ---------- | ------------------------------------------------- | -------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| 2.1 | `user` | vazio      | válida                                            | —                    | coleta criada com número gerado | `generate_coleta_numero` em `BEFORE INSERT` (`20251215123841_...sql:202`)                                                                                                                                                                                      | RASTREADO | —        |
| 2.2 | `user` | 1 registro | corrigir um campo digitado errado                 | —                    | consegue editar                 | **não há porta de entrada para edição**: o formulário só abre com `selectedPickup = null` (`src/pages/Coletas.tsx:341-343`); o clique no cartão abre detalhes (`:718-721`). O `update` existe e é inalcançável (`src/components/coletas/PickupDialog.tsx:158`) | RASTREADO | **A-07** |
| 2.3 | `user` | 1 registro | excluir coleta errada                             | —                    | consegue excluir (lógico)       | **não existe mutation de exclusão** em `Coletas.tsx`                                                                                                                                                                                                           | RASTREADO | **A-07** |
| 2.4 | `user` | 1 registro | pular de `aguardando_liberacao` para `finalizada` | passos fora de ordem | banco recusa                    | **banco aceita**: nenhum CHECK e nenhum trigger valida transição (grep exaustivo em `CREATE TRIGGER ... ON coletas`: só `updated_at`, `generate_numero`, `audit`)                                                                                              | RASTREADO | **C-01** |
| 2.5 | `user` | muitos     | abrir a lista                                     | —                    | paginação no servidor           | ver §8 (performance)                                                                                                                                                                                                                                           | RASTREADO | ver P-*  |
| 2.6 | `user` | 1 registro | duplo clique em "Salvar"                          | duplo clique         | cria uma, não duas              | **não verificado** — nenhum teste e nenhum `disabled` confirmado no caminho                                                                                                                                                                                    | RASTREADO | **R-05** |

## 3. J4 — Cotar frete

| #   | Ator                      | Estado             | Entrada                                          | Condição                            | Esperado                                     | Encontrado                                                                                                                                                          | Método    | Achado   |
| --- | ------------------------- | ------------------ | ------------------------------------------------ | ----------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| 3.1 | `user`                    | vazio              | CEP válido                                       | —                                   | cotação volta e é salva                      | `/cotacao-frete` grava (`CotacaoFrete`), mas `/cotacao-multicanal` **não**                                                                                          | RASTREADO | **C-02** |
| 3.2 | `user`                    | 1 cotação pendente | registrar o preço que a transportadora respondeu | recarregar a página depois          | preço persiste                               | **perde tudo**: `handleRegistrarResposta` só faz `setCotacoes(...)` + toast (`src/pages/CotacaoMultiCanal.tsx:451-477`); a tabela da tela vem de `useState` (`:83`) | RASTREADO | **C-02** |
| 3.3 | `user`                    | 10 transportadoras | disparar "Nexus Blast"                           | **7 terceiros fora do ar**          | mostra quantas falharam                      | **mostra 100% concluído**: `catch` só faz `console.error` e o laço segue com `completed++` (`src/pages/CotacaoMultiCanal.tsx:321-326`)                              | RASTREADO | **R-03** |
| 3.4 | `user`                    | —                  | `useSandbox: true` no corpo da requisição        | chamada forjada pelo navegador      | servidor decide o ambiente                   | **o servidor decide**: `melhor-envio-api/ambiente.ts` lê `MELHOR_ENVIO_SANDBOX` (padrão produção); `useSandbox` do corpo é ignorado com log (etapa 008)                                                                                       | RASTREADO | **S-04** |
| 3.5 | `user` (papel mais baixo) | —                  | —                                                | —                                   | só quem tem papel para isso cota em produção | **qualquer autenticado cota**: `requireUser` prova sessão, não papel (`melhor-envio-api/index.ts:43-49`)                                                            | RASTREADO | **S-04** |
| 3.6 | `user`                    | —                  | —                                                | **terceiro não responde (pendura)** | timeout e erro claro                         | ver §9 (robustez das edges)                                                                                                                                         | RASTREADO | ver B-*  |

## 4. J5 — Despachar entrega

| #   | Ator              | Estado                    | Entrada                                               | Condição                  | Esperado                                | Encontrado                                                                                                                                  | Método    | Achado         |
| --- | ----------------- | ------------------------- | ----------------------------------------------------- | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------- |
| 4.1 | `user`            | 1 entrega em `nf_emitida` | mover para `despachado`                               | —                         | muda e registra histórico               | muda (`src/pages/Despachos.tsx:203-223`)                                                                                                    | RASTREADO | —              |
| 4.2 | `user`            | 1 entrega                 | mover sem NF de remessa                               | —                         | bloqueia                                | **bloqueia só na tela** (`Despachos.tsx:240`); o banco aceita                                                                               | RASTREADO | **C-01**       |
| 4.3 | `user`            | 1 entrega                 | mover de `aguardando_producao` direto para `entregue` | passos fora de ordem      | recusa                                  | **aceita** — nenhum trigger/CHECK; e `validTransitions` (`Despachos.tsx:95-99`) cobre só 3 dos 10 estados                                   | RASTREADO | **C-01**       |
| 4.4 | **dois usuários** | mesma entrega             | ambos movem ao mesmo tempo                            | dois usuários simultâneos | o segundo recebe "conflito de versão"   | **o segundo vê "Movido para X" e nada muda**: update com `.eq("version", ...)` sem `{count:"exact"}` (`Despachos.tsx:203-208` e `:264`)     | RASTREADO | **C-03**       |
| 4.5 | **duas abas**     | mesma entrega             | alocar BOX nas duas                                   | duas abas                 | a segunda falha visivelmente            | **a segunda falha em silêncio e ainda grava `kanban_history`** como se tivesse alocado (`src/hooks/logistics/useBoxManagement.tsx:139-154`) | RASTREADO | **C-03**       |
| 4.6 | dois usuários     | mesma entrega             | mover no Kanban                                       | dois usuários simultâneos | conflito avisado                        | **correto aqui**: `{count:"exact"}` + `if (count === 0) throw` (`src/pages/KanbanEntregas.tsx:300-319`) — é o padrão a copiar               | RASTREADO | — (referência) |
| 4.7 | `user`            | muitos                    | abrir a fila                                          | **banco fora do ar**      | mensagem de erro com "tentar novamente" | **mostra "Fila Limpa"**: o `useQuery` não destrutura `error` (`Despachos.tsx:109-113`) e o vazio é o que aparece (`:521`)                   | RASTREADO | **R-01**       |
| 4.8 | `user`            | —                         | —                                                     | tela aberta por minutos   | uma assinatura realtime estável         | **assinatura é derrubada e reaberta a cada render** (`Despachos.tsx:154` passa handler inline; `src/hooks/data/useRealtime.tsx:158,214`)    | RASTREADO | **R-02**       |

## 5. J6/J7 — Rastrear e tratar ocorrência (entrada por webhook)

| #   | Ator                        | Estado                 | Entrada                                            | Condição                                       | Esperado                     | Encontrado                                                                                                                                                                      | Método    | Achado   |
| --- | --------------------------- | ---------------------- | -------------------------------------------------- | ---------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| 5.1 | terceiro (Lalamove)         | —                      | payload válido + assinatura correta                | —                                              | aceita e grava               | aceita após HMAC em tempo constante (`lalamove-webhook/index.ts:63-72`, `_shared/webhookSignature.ts:38-43`)                                                                    | RASTREADO | —        |
| 5.2 | **qualquer um na internet** | —                      | payload válido **sem assinatura**                  | —                                              | 401                          | 401 (`webhookSignature.ts:13-21` é fail-closed)                                                                                                                                 | RASTREADO | —        |
| 5.3 | **qualquer um na internet** | —                      | payload sem assinatura em `nexus-webhook-receiver` | **`NEXUS_WEBHOOK_SECRET` ausente no ambiente** | 401                          | **ACEITA E PROCESSA**: a verificação está dentro de `if (Deno.env.get("NEXUS_WEBHOOK_SECRET"))` (`nexus-webhook-receiver/index.ts:37`); sem o segredo, o bloco é pulado inteiro | RASTREADO | **S-01** |
| 5.4 | **qualquer um na internet** | —                      | header `x-test-mode: true`                         | **`ALLOW_TEST_MODE=true` no ambiente**         | 401                          | pula o HMAC e **grava de verdade** (`lalamove-webhook/index.ts:52-53`, `rodonaves-webhook/index.ts:67-69`)                                                                      | RASTREADO | **S-05** |
| 5.5 | terceiro                    | 1 evento já processado | **o mesmo evento de novo**                         | reenvio                                        | ignora (idempotente)         | ver §9                                                                                                                                                                          | RASTREADO | ver B-*  |
| 5.6 | `user`                      | —                      | corpo arbitrário em `webhook-status`               | —                                              | só chamador interno          | **qualquer autenticado** dispara POST assinado para **todos** os `client_webhooks` ativos, sem filtro de dono (`webhook-status/index.ts:36-45`, `:60-63`, `:68-119`)            | RASTREADO | **S-02** |
| 5.7 | `user`                      | —                      | sincronizar com a Rodonaves                        | **a chamada falha**                            | erro visível                 | **nada aparece**: `onError` com corpo vazio e comentário "Fail silently" (`src/hooks/logistics/useRodonavesTracking.tsx:252-254`)                                               | RASTREADO | **R-04** |
| 5.8 | `user`                      | —                      | sincronizar com a Rodonaves                        | sucesso                                        | a lista de entregas atualiza | **mostra "12 entregas atualizadas" e a lista fica velha**: sem `invalidateQueries` (`useRodonavesTracking.tsx:248-251`); `src/pages/Envios.tsx:350` lê `["entregas"]`           | RASTREADO | **R-04** |

## 6. J8 — Avisar o cliente

| #   | Ator                      | Estado | Entrada                               | Condição             | Esperado                              | Encontrado                                                                                                                                                                                                                              | Método    | Achado         |
| --- | ------------------------- | ------ | ------------------------------------- | -------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------- |
| 6.1 | `user` (papel mais baixo) | —      | número de telefone qualquer           | —                    | só quem tem papel envia               | **qualquer autenticado envia WhatsApp para qualquer número** (`evolution-whatsapp/index.ts:34-43`, `:68`)                                                                                                                               | RASTREADO | **S-03**       |
| 6.2 | visitante                 | —      | —                                     | —                    | 401                                   | 401 (`requireUser` rejeita `anon`, `_shared/auth.ts:54-59`)                                                                                                                                                                             | RASTREADO | —              |
| 6.3 | `user`                    | —      | —                                     | —                    | não consegue mandar e-mail arbitrário | correto: `resend-email` exige segredo interno ou `service_role` (`resend-email/index.ts:25-36`)                                                                                                                                         | RASTREADO | — (referência) |
| 6.4 | `user`                    | —      | configurar alerta por e-mail/WhatsApp | **a gravação falha** | erro visível, switch volta            | **o switch fica ligado e nada foi salvo**: `.catch(() => undefined)` em 5 pontos (`src/components/predictions/PredictionAccuracyTimeline.tsx:89,180,190,202,212`) enquanto o `save` faz `throw` (`usePredictionAccuracySettings.ts:97`) | RASTREADO | **R-06**       |

## 7. J9/J13 — Cadastros e administração

| #   | Ator   | Estado                               | Entrada                                                    | Condição                      | Esperado                                | Encontrado                                                                                                                                                                                    | Método    | Achado   |
| --- | ------ | ------------------------------------ | ---------------------------------------------------------- | ----------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| 7.1 | `user` | muitos                               | selecionar vários clientes e clicar "Excluir Selecionados" | —                             | **pergunta antes**                      | **apaga direto, sem perguntar**: `BulkActions.tsx:74` e `:95` chamam `action.onClick(selectedIds)` no clique; `variant:"destructive"` só muda a cor                                           | RASTREADO | **D-01** |
| 7.2 | `user` | 1 cliente                            | excluir um só                                              | —                             | pergunta                                | pergunta (`src/pages/Clientes.tsx:1041`) — a inconsistência com 7.1 é o achado                                                                                                                | RASTREADO | **D-01** |
| 7.3 | `user` | 1 transportadora com histórico       | excluir                                                    | —                             | exclusão lógica (`deleted_at`)          | **apaga de verdade**: `.delete().eq("id", id)` (`src/pages/Transportadoras.tsx:336-341`); `FretesInternos.tsx:253-257` idem. Contraste correto em `Clientes.tsx:337` / `Fornecedores.tsx:286` | RASTREADO | **D-02** |
| 7.4 | `user` | 1 logística reversa                  | cancelar                                                   | —                             | pergunta                                | **um clique no menu, sem aviso** (`src/pages/LogisticaReversa.tsx:461-471`)                                                                                                                   | RASTREADO | **D-03** |
| 7.5 | `user` | planilha de 500 linhas, 50 inválidas | importar em massa                                          | entrada parcialmente inválida | diz **quais** linhas falharam e por quê | diz só o número, e conta o **lote inteiro** como erro, descartando a mensagem do banco (`src/pages/ImportacaoMassa.tsx:154-160`); o histórico vive em `useState` (`:127`)                     | RASTREADO | **R-07** |
| 7.6 | `user` | —                                    | excluído e recriado com o mesmo documento                  | já excluído                   | não duplica                             | **não verificado** — depende de UNIQUE no banco, que não pôde ser checado no banco vivo                                                                                                       | RASTREADO | **F-03** |

## 8. Performance (J2, J5, J6, J11)

| #   | Cenário                                                 | Esperado                         | Encontrado                                                                              | Método    | Achado   |
| --- | ------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- | --------- | -------- |
| 8.1 | abrir listagem com muitos registros                     | paginação no servidor (`.range`) | ver `03-ACHADOS.md`, grupo **P**                                                        | RASTREADO | **P-\*** |
| 8.2 | `audit_logs` / `rastreamento_historico` crescem por mês | partição + retenção              | partições existem e há `ensure_future_partitions` e `nexus_partition_retention` no cron | RASTREADO | —        |
| 8.3 | filtro/ordenação frequente                              | índice presente                  | ver grupo **P**                                                                         | RASTREADO | **P-\*** |

## 9. Robustez das edge functions (todas as jornadas que falam com terceiro)

| #   | Cenário               | Esperado               | Encontrado      | Método    | Achado   |
| --- | --------------------- | ---------------------- | --------------- | --------- | -------- |
| 9.1 | terceiro não responde | timeout e erro tratado | ver grupo **B** | RASTREADO | **B-\*** |
| 9.2 | webhook reenviado     | idempotente            | ver grupo **B** | RASTREADO | **B-\*** |
| 9.3 | corpo malformado      | 4xx claro, sem stack   | ver grupo **B** | RASTREADO | **B-\*** |

---

## 10. Cenários que NÃO foi possível avaliar (e o que cada um exige)

Esta lista é parte do resultado. Sem ela a matriz pareceria mais completa do que é.

| Cenário                                                                 | Por que não                                                       | O que resolveria                                                                                                             |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Qualquer escrita real (criar coleta, mover status, importar, excluir)   | somente-leitura + produção sem staging                            | ambiente de preview com banco próprio; ou executar as etapas do plano com o dono acompanhando                                |
| RLS por tabela e por operação **como está em produção**                 | banco oficial inacessível; `docs/contexto/supabase/` nunca gerado | Consulta a `pg_class.relrowsecurity` no banco vivo (ver F-02 — a função `get_rls_audit()` existe, mas exige sessão de admin) |
| Valor real de `NEXUS_WEBHOOK_SECRET` e `ALLOW_TEST_MODE` em produção    | segredos de edge function não são legíveis daqui                  | painel do Supabase → Edge Functions → Secrets                                                                                |
| Policies antigas do bucket `documents` ainda existirem                  | só o banco diz quais policies estão ativas                        | `SELECT polname, qual FROM pg_policies WHERE tablename='objects';`                                                           |
| Versão das edge functions realmente publicada                           | deploy não deixa rastro verificável no repo                       | painel do Supabase → Edge Functions → histórico de deploy                                                                    |
| Comportamento em celular, acessibilidade com leitor de tela, Lighthouse | exige navegador contra a aplicação publicada                      | Playwright contra `https://loggi-flow-v2.vercel.app` (há Chromium no ambiente, mas isso testaria **produção**)               |
| `tests/e2e/`                                                            | exige usuário semeado; não roda na CI                             | semear usuário de teste e ligar o job                                                                                        |
