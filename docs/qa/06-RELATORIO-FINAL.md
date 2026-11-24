# Relatório final — auditoria QA do Loggi Flow V2

> 2026-11-24 · `main` em `c7fc18ae` · banco `jvfhclubfpxrtrrazrgr` · plano de 300 etapas em
> `docs/qa/` (achados em `03-ACHADOS.md`, execução em `05-PROGRESSO.md`)

## 1. Resultado em três linhas

- **35 dos 65 achados estão fechados** (todos os que dependiam só de código): a exclusão em massa de clientes
  passou a pedir confirmação — era o caminho mais curto para perda de dado sem volta; o webhook parou de
  aceitar requisição sem assinatura quando o segredo falta, e passou a ser idempotente (o mesmo evento
  repetido não gera pedido dobrado); e-mail e logs pararam de carregar dado pessoal do cliente.
- **As duas ações mais usadas na operação ficaram com teste:** criar coleta e mudar entrega de status — se
  alguém quebrar uma delas, a CI avisa antes de chegar em produção.
- **15 achados estão parciais e 15 abertos**, e todos os 30 travam no mesmo lugar: **o banco ao vivo** e as
  decisões desta página.

## 2. O que ainda é risco, por ordem de dano

1. **C-01 — transição inválida de entrega só é barrada na tela.** Webhook, RPC ou script movem a entrega para
   qualquer status; o banco não recusa. É o risco de dado corrompido mais provável hoje.
2. **F-02 — RLS incompleto em `scheduled_reports` e nas tabelas de geo-blocking.** Qualquer usuário
   autenticado alcança dado que não deveria gerenciar.
3. **A-04 — produção não tem `public.user_panel_preferences`.** O Painel SLA mostra "salvo" e não grava nada:
   o usuário acredita que a meta está configurada quando não está. É também a causa do CI `types-sync`
   vermelho desde 23/11.
4. **A-07 — o Kanban despacha sem nota fiscal.** A trava de NF de simples remessa existe só na tela de
   Despachos; pelo Kanban a entrega vai para `despachado` sem NF e sem confirmação.
5. **P-05/P-06 — índices e duplicados nunca conferidos no banco.** A consulta do Painel SLA pode estar
   varrendo tudo; não há perda de dado, há lentidão e piora com o volume.
6. **H-09/H-13 — o contexto do banco nunca foi gerado** (falta `SUPABASE_DB_URL`): qualquer agente novo
   trabalha às cegas sobre o schema real, que é exatamente a origem do achado mais caro da auditoria.
7. **F-03/P-05 — funções, RPCs e tabelas que ninguém usa continuam no ar** (`push-send`, `ingest-biosync`,
   buckets de foto): superfície de ataque mantida sem função de negócio.

## 3. Decisões esperando você

| Decisão | O que muda no negócio | O que acontece se nada for decidido | Onde |
| --- | --- | --- | --- |
| Autorizar as migrações da máquina de estados (função + triggers de entrega e coleta, e a regra "não despacha sem NF" no banco) | O banco passa a recusar transição inválida, venha de onde vier | O risco 1 e o 4 continuam abertos; qualquer integração nova pode corromper o histórico | etapas 028-033 |
| Autorizar RLS em `scheduled_reports` e geo-blocking | Fecha o vazamento para usuário autenticado | Relatórios agendados e regras de bloqueio seguem expostos | etapas 024-025 |
| Aplicar a migration de `user_panel_preferences` (#248) | O Painel SLA volta a gravar meta e o `types-sync` volta a ficar verde | O usuário continua vendo "salvo" sem persistir | `supabase/migrations/20261121153649_user_panel_preferences.sql` |
| Autorizar os índices e remover os duplicados | Consulta do Painel SLA para de varrer a tabela inteira | Lentidão cresce com o volume, sem aviso | etapas 228-240 |
| Configurar `SUPABASE_DB_URL` (secret) e habilitar o snapshot | Agentes passam a ler o schema real em vez de supor | Toda próxima tarefa começa sem fonte de verdade do banco | etapa 263 |
| Escolher o destino de `push-send`, `ingest-biosync` e dos buckets de foto | Reduz o que pode ser abusado sem uso real | Funções e buckets esquecidos seguem disponíveis | etapas 070-076 |
| Confirmar `VITE_SENTRY_DSN` no Vercel | Erro de front deixa de ser invisível | Falha em tela de usuário não gera nenhum registro | etapas 285-286 |
| Mergear as 2 PRs abertas | [#398](https://github.com/adm01-debug/Loggi_Flow_V2/pull/398) trava consulta sem teto na CI; [#340](https://github.com/adm01-debug/Loggi_Flow_V2/pull/340) tira SQL histórico da raiz | A CI segue aceitando consulta sem teto, e os dois SQL continuam parecendo tarefa pendente | #398, #340 |

## 4. Os números

| Indicador | Valor | Fonte |
| --- | --- | --- |
| Etapas do plano | 219 concluídas · 61 esperando você · 20 não iniciadas | `05-PROGRESSO.md`, etapa 298 |
| Achados | 35 resolvidos · 15 parciais · 15 abertos (de 65) | `03-ACHADOS.md`, etapa 297 |
| Cobertura de teste | 76,21% linhas · 74,43% funções (piso 72/73) | [`#415`](https://github.com/adm01-debug/Loggi_Flow_V2/pull/415) |
| Testes de `scripts/` que falhavam sempre | 5 corrigidos — a CI deixou de ter um job vermelho permanente | [`#414`](https://github.com/adm01-debug/Loggi_Flow_V2/pull/414) |

## 5. O que a auditoria não pôde verificar

- **O banco ao vivo**: 13 etapas (RLS real, unicidade de `numero_coleta`/`numero_entrega`, uso de índices,
  existência de `webhook_failures`/`cron_job_logs`) nunca rodaram — sem essas respostas, os achados F-02,
  C-01 e P-05/P-06 ficam como hipótese, não como diagnóstico fechado.
- **Fim a fim no navegador**: a etapa 283 (usuário semeado do `tests/e2e/`) continua aberta; nenhum fluxo foi
  exercitado contra o Supabase real nesta execução, só contra dublês.
- **Efeito em produção das correções de front**: o deploy do Vercel sobe a cada merge, mas não há monitoramento
  de erro (285/286) para provar que a tela corrigida se comporta como o teste diz.
- **Proteção de branch**: `strict = false` — CI verde numa PR antiga não prova nada sobre a `main` de hoje.

**Aprendizado que evita a repetição:** documento sem data, sem commit e sem o nome do banco custou mais caro
que qualquer bug encontrado — foi o que fez uma auditoria inteira nascer de um `ESTADO_ATUAL.md` que descrevia
um sistema que já não existia.