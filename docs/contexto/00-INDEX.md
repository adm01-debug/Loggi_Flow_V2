# CONTEXTO PARA AGENTES DE IA — ÍNDICE ÚNICO

> Gerado automaticamente por indice.py · 2026-11-27 00:37 UTC · HEAD `285036298f` · Não edite à mão.

Um sistema, três fontes de verdade, três produtores independentes. **Leia este arquivo e vá direto à fonte certa.** Cada fato tem um dono: se duas fontes discordarem, vale o dono.

## Onde está cada coisa

| Preciso de… | Fonte (dona do fato) | Onde ler | Estado |
|---|---|---|---|
| Regras que não podem ser quebradas: RLS por operação, estados e transições, validações, fórmulas, prazos, erros de negócio, testes como especificação, inconsistências código×schema (NÃO VERIFICADO) e regras humanas (`manual/`) | **regras de negócio** | `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` | ok · 2 min atrás |
| Tabelas, colunas, RLS/políticas, funções, triggers, cron, storage, lints — **como está em produção agora** | **banco real** | `docs/contexto/supabase/README.md` | ok · 0 min atrás |
| Rotas, telas, módulos, hooks, edge functions, grafo de dependências, testes, scripts, convenções | **código** | `docs/contexto/codigo/INDEX.md` | ok · 0 min atrás |

_As idades da coluna Estado contam até a data deste índice (cabeçalho), não até agora._

## Ordem de leitura antes de qualquer tarefa ou planejamento

1. **regras de negócio** — Qualquer mudança de comportamento · Antes de criar status/valor/validação · Antes de planejar.
2. **banco real** — Vou tocar tabela/coluna/política/função SQL · Quero saber se algo existe de verdade no banco.
3. **código** — Vou mexer em tela/rota/hook/edge · Preciso saber onde uma coisa vive e quem a usa.

## Regras do protocolo

- Tabela/coluna/política existe? → **banco real**. Migrations do repo são histórico, não estado.
- Onde fica, quem chama, o que importa o quê? → **código**.
- Pode fazer isso? Qual estado vem depois? Qual o limite? → **regras de negócio** (inclui `manual/`, escrito por humanos, prioridade máxima).
- Item listado como **NÃO VERIFICADO** ou **inconsistência** em qualquer fonte: confirme na fonte dona antes de assumir.
- Nada aqui é editado à mão. Para registrar uma regra que só o negócio sabe, escreva em `manual/` da fonte de regras.

<details><summary>Arquivos de <b>banco real</b> (`docs/contexto/supabase/`)</summary>

- `docs/contexto/supabase/CHANGELOG.md`
- `docs/contexto/supabase/README.md`
- `docs/contexto/supabase/auth.md`
- `docs/contexto/supabase/cron-runs.md`
- `docs/contexto/supabase/cron.md`
- `docs/contexto/supabase/edge-functions.md`
- `docs/contexto/supabase/errors.md`
- `docs/contexto/supabase/extensions.md`
- `docs/contexto/supabase/foreign-servers.md`
- `docs/contexto/supabase/functions.md`
- `docs/contexto/supabase/grants.md`
- `docs/contexto/supabase/indexes.md`
- `docs/contexto/supabase/lints.md`
- `docs/contexto/supabase/manifest.json`
- `docs/contexto/supabase/migrations.md`
- `docs/contexto/supabase/policies.md`
- `docs/contexto/supabase/project-config.md`
- `docs/contexto/supabase/queues.md`
- `docs/contexto/supabase/realtime.md`
- `docs/contexto/supabase/relationships.md`
- `docs/contexto/supabase/roles.md`
- `docs/contexto/supabase/schemas.md`
- `docs/contexto/supabase/sequences.md`
- `docs/contexto/supabase/snapshot.json`
- `docs/contexto/supabase/stats.json`
- `docs/contexto/supabase/stats.md`
- `docs/contexto/supabase/storage.md`
- `docs/contexto/supabase/tables.md`
- `docs/contexto/supabase/tables/_supabase_internal_triggers.md`
- `docs/contexto/supabase/tables/audit_tmp/cfg.md`
- `docs/contexto/supabase/tables/audit_tmp/job_test.md`
- `docs/contexto/supabase/tables/audit_tmp/load_log.md`
- `docs/contexto/supabase/tables/audit_tmp/manifest.md`
- `docs/contexto/supabase/tables/audit_tmp/req.md`
- `docs/contexto/supabase/tables/audit_tmp/seed_backup.md`
- `docs/contexto/supabase/tables/audit_tmp/sql.md`
- `docs/contexto/supabase/tables/internal/query_baseline.md`
- `docs/contexto/supabase/tables/public/achievements.md`
- `docs/contexto/supabase/tables/public/ai_chat_messages.md`
- `docs/contexto/supabase/tables/public/ai_delay_predictions.md`
- `docs/contexto/supabase/tables/public/alertas_custo.md`
- `docs/contexto/supabase/tables/public/architecture_decisions.md`
- `docs/contexto/supabase/tables/public/audit_logs.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2026m07.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2026m08.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2026m09.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2026m10.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2026m11.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2026m12.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2027m01.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2027m02.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2027m03.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2027m04.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2027m05.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2027m06.md`
- `docs/contexto/supabase/tables/public/audit_logs_y2027m07.md`
- `docs/contexto/supabase/tables/public/automation_audit_logs.md`
- `docs/contexto/supabase/tables/public/bio_sync_alert_rules.md`
- `docs/contexto/supabase/tables/public/bio_sync_telemetry.md`
- `docs/contexto/supabase/tables/public/bitrix_sync_config.md`
- `docs/contexto/supabase/tables/public/bitrix_sync_logs.md`
- `docs/contexto/supabase/tables/public/business_rules.md`
- `docs/contexto/supabase/tables/public/business_rules_config.md`
- `docs/contexto/supabase/tables/public/carrier_rankings.md`
- `docs/contexto/supabase/tables/public/client_webhooks.md`
- `docs/contexto/supabase/tables/public/clientes.md`
- `docs/contexto/supabase/tables/public/coletas.md`
- `docs/contexto/supabase/tables/public/comments.md`
- `docs/contexto/supabase/tables/public/conciliacao_itens_importados.md`
- `docs/contexto/supabase/tables/public/conciliacoes.md`
- `docs/contexto/supabase/tables/public/contract_test_logs.md`
- `docs/contexto/supabase/tables/public/cotacoes_frete.md`
- `docs/contexto/supabase/tables/public/cotacoes_multicanal.md`
- `docs/contexto/supabase/tables/public/db_health_score_history.md`
- `docs/contexto/supabase/tables/public/db_health_snapshots.md`
- `docs/contexto/supabase/tables/public/db_slo_daily.md`
- `docs/contexto/supabase/tables/public/delay_predictions_history.md`
- `docs/contexto/supabase/tables/public/delivery_receipt_audit.md`
- `docs/contexto/supabase/tables/public/entregas.md`
- `docs/contexto/supabase/tables/public/error_events.md`
- … +88

</details>

<details><summary>Arquivos de <b>código</b> (`docs/contexto/codigo/`)</summary>

- `docs/contexto/codigo/GRAPH_REPORT.md`
- `docs/contexto/codigo/INDEX.md`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/manifest.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`

</details>

<details><summary>Arquivos de <b>regras de negócio</b> (`docs/contexto/regras/`)</summary>

- `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`
- `docs/contexto/regras/10-ACESSO-E-SEGURANCA.md`
- `docs/contexto/regras/11-GLOSSARIO-E-LACUNAS.md`
- `docs/contexto/regras/context.json`
- `docs/contexto/regras/manifest.json`
- `docs/contexto/regras/manual/README.md`
- `docs/contexto/regras/manual/TEMPLATE-regras-de-negocio.md`

</details>
