# Auditoria de branches e PRs — recuperar antes de fechar

> 2026-11-25 · `main` em `6e3fe4c4c` · escopo: 18 branches locais, 15 branches remotas, 48 PRs fechadas
> sem merge e 0 stashes · pergunta que este documento responde: **algum trabalho de agente ficou fora
> da `main` e pode ser perdido ao apagar a branch?**

Resposta: **não.** Tudo que passou por branch ou PR neste repositório está na `main`, foi substituído
por uma versão posterior, ou é artefato de bot/geração. A única exceção é a PR #477, que está aberta e
intocada (DDL esperando o dono). Este documento registra a prova de cada caso, porque "não existe" só
vale com evidência.

## 1. Como a prova foi feita

Quatro testes independentes, do mais barato ao mais rigoroso:

1. **Linha a linha:** para cada branch/PR, extraí as linhas *adicionadas* em `git diff` e procurei cada
   uma (≥ 18 caracteres, comparadas com `strip()`) na versão daquele arquivo na `main`. Linha ausente
   = candidata a perda.
2. **Arquivo por arquivo:** para cada arquivo de código (`src/`, `supabase/`, `scripts/`, `tests/`) da
   branch, verifiquei se o *caminho* existe na `main`. Caminho ausente = módulo/tela/função que nunca
   entrou.
3. **Semântico:** quando os testes 1 e 2 acusavam diferença, normalizei os dois textos (removendo todo
   espaço em branco, vírgulas e trocando `"` por `'`) e comparei. Se o normalizado é igual, a diferença
   é **formatação**, não comportamento.
4. **Reverse-apply:** `git apply --check --reverse` do patch da branch sobre a `main`. **Este teste foi
   descartado como prova**: em arquivo quente (como `docs/qa/05-PROGRESSO.md`) ele falha só porque a
   `main` andou depois, gerando falso negativo em 17 de 18 branches. Fica registrado para ninguém
   repetir o erro.

## 2. Veredito das branches locais

| Branch | Commit | Veredito | Prova |
| --- | --- | --- | --- |
| `claude/chore-censo-indices-e-tabelas-orfas-261125-1221` | `78f142f78` | incorporada (#476 → `0fc31cce0`) | 0 linha faltando, 0 arquivo ausente |
| `claude/chore-contexto-snapshot-unico-261124-1810` | `14c5e9e55` | incorporada (#455) | 0 / 0 |
| `claude/chore-fechamento-295-e-secret-dburl-261125-1212` | `acff46caf` | incorporada (#475 → `d4536a181`) | 0 / 0 |
| `claude/chore-ratchet-avisos-80-261125-1148` | `938c0ffe6` | incorporada | 0 / 0; teto 80 está em `.warning-budget.json` |
| `claude/docs-relatorio-final-atualizado-261125-1231` | `c406c9a07` | incorporada (#478 → `6e3fe4c4c`) | 0 / 0 |
| `claude/fix-rls-leitura-anon-261124-1756` | `580df2889` | incorporada (#454) | 0 / 0 |
| `claude/chore-etapa299-fecha-261125-0900` | `789f9f7ed` | incorporada | só a tabela de contadores `263/37`, superada por `278/22` |
| `claude/chore-levantamento-uso-13-etapas-261125-1200` | `3dd4ef284` | incorporada | texto antigo de 070/073/075/076; na `main` 070 está `[x]` e as outras três `[~]` com o texto novo |
| `claude/ci-fatos-agents-md-261125-1500` | `60e309f0e` | incorporada | `AGENTS.md` dizia 259 migrations; hoje diz 262 (gate confere contra o disco) |
| `claude/ci-gates-doc-raiz-261125-1400` | `a3b5d19c3` | incorporada | contadores `273/27`; os dois gates rodam na CI |
| `claude/cron-falha-visivel-261125-1310` | `3e2dafff0` | incorporada | contadores `271/29` |
| `claude/docs-indices-fecha-058-265-261125-1300` | `8e7022a2b` | incorporada | 058, 240 e 265 estão `[x]` na `main` |
| `claude/feat-etapa289-tela-falhas-261125-1130` | `2e020c647` | incorporada | contadores `262/38`; a tela das falhas está na `main` |
| `claude/fix-ddl-rastreio-e-rpc-orfa-261125-1540` | `24686e180` | incorporada (#473) | migration aplicada; 027 e 070 hoje são `[x]` |
| `claude/inventario-contagens-261125-1243` | `0f3292aa8` | incorporada | contadores `275/25` |
| `claude/relatorio-final-261125-1310` | `66882ae42` | obsoleta | relatório `271/29` substituído pelo `278/22` da #478 |
| `claude/chore-manutencao-261125-0817-ddfe2515` | `8ec2f5ccf` | obsoleta | **formatação pura**: nos 3 arquivos, o texto normalizado é idêntico ao da `main` (aspas duplas, vírgula final, quebra de import). Prettier não roda em script nenhum nem na CI, então não há ganho |
| `claude/chore-drop-4-indices-redundantes-261125-1222` | `e2625acb3` | **aberta** | PR #477 — DDL esperando o dono; única branch preservada |

Branches remotas: as 15 são a união das anteriores com três origens de máquina — `automation/types-sync`
(bot de sincronização do schema, commit recriado a cada execução), `contexto` (snapshot gerado pelo
workflow, 1 commit sem merge-base, por desenho) e 10 do dependabot. Nenhuma guarda trabalho humano.
`automation/types-sync` foi conferida: o único commit "à frente" é diff de docs antigas, o conteúdo novo
dele já entrou pela #474.

## 3. Veredito das 20 PRs fechadas sem merge (fora do dependabot)

| PR | Assunto | Veredito e prova |
| --- | --- | --- |
| #437 | pisos de cobertura | incorporada: as 4 linhas de `vitest.config.ts` estão na `main` (0 faltando); `coverage/**` era artefato gerado e não entrou |
| #337 | marca 015 e 054 | incorporada: as duas estão `[x]`; só a tabela de doc mudou |
| #336 | exclusão em massa com confirmação | incorporada: `src/components/common/BulkActions.tsx` com `confirmTyping`, teste e uso em Clientes/Fornecedores |
| #335 | marca 7 etapas da onda 1 | incorporada: as 7 estão `[x]` |
| #334 | marca 062-067 | incorporada: as 6 estão `[x]` |
| #333 | 099-103, erro com botão de tentar de novo | incorporada: 0 linha de código faltando; as 5 etapas estão `[x]` |
| #332 | 097-098, Despachos lê o erro | incorporada: 0 linha faltando |
| #181 | realtime com topic único | incorporada: 0 linha faltando |
| #135 | manutenção (formatação) | obsoleta: formatação; e o `DORAMetrics.tsx` da PR é menor que o da `main` (3.030 vs 7.081 caracteres normalizados — a `main` ganhou `useGlobalHealthScore`) |
| #122 | teste de gate | descartável: PR de teste ("apenas supabase"), uma linha em `supabase/config.toml` |
| #107 | severidade do ruleset React Compiler | incorporada: `$comment` do `.warning-budget.json` evoluiu para o teto 80; Tooltip e `handleBarClick` estão na `main` |
| #106 | tipos do Recharts v3 | incorporada: mesmas duas linhas do #107 presentes |
| #105 | ressincroniza lockfile | obsoleta: o lockfile foi regerado depois (esbuild/vitest mudaram de novo) |
| #102 | seed idempotente | incorporada: `scripts/seed-database.ts` na `main` tem `--dry-run` e `--confirmar-producao` (981 linhas, maior que a PR) |
| #98 | runbook pós-deploy | incorporada: a `main` cita "(recuperado da PR #98)" no PASSO 0 e no 4.5, e tem o bloco de ROLLBACK |
| #94 | guard de placeholders | incorporada: `eh_placeholder()` e `recusar_arquivo_versionavel()` estão em `scripts/ops/set_missing_secrets.sh` |
| #92 | ratchet do warning budget | incorporada: 0 linha faltando |
| #88 | `.gitattributes` eol=lf | incorporada: a `main` tem `* text=auto eol=lf` e regra por extensão |
| #87 | manifest_summary sem pg_cron | incorporada: `to_regclass('cron.job')` guarda o bloco em `scripts/audit/manifest_summary.sql` |
| #86 | content_hash quebrado | incorporada: `to_jsonb(t)` só aparece dentro do SQL dinâmico, onde `t` é o alias da tabela; o `CROSS JOIN LATERAL ... LIMIT 0` sumiu |

## 4. Os 7 arquivos que existem em PRs antigas e não na `main`

A checagem de caminho acusou os mesmos 7 arquivos em 12 PRs diferentes. Todos foram **removidos de
propósito** por etapas posteriores — nenhum é trabalho perdido:

| Arquivo | Quem removeu |
| --- | --- |
| `scripts/cleanup_triggers_source.sql` | #340 (etapa 060 — SQL histórico sai da raiz de scripts) |
| `scripts/origem_remediacao_2026-08-31.sql` | #340 |
| `src/hooks/ai/useNexusSimulator.ts` | #300 (etapas 068+069 — hooks mortos) |
| `src/hooks/security/useSelfHealing.ts` | #300 |
| `src/utils/performance.ts` | #304 (etapas 080+081) |
| `supabase/functions/_shared/service-wrapper.ts` | #305 (etapa 082 — sem importador) |
| `supabase/migrations/20240822_gamification_system.sql` | #224 (migration legada), substituída por `supabase/migrations/20260102100001_gamification_real.sql` |

## 5. Dependabot (28 PRs fechadas sem merge, 12 abertas)

São PRs de bot, recriadas automaticamente quando ficam velhas, e por isso não entram na regra de "não
perder trabalho". Duas observações que valem decisão:

- as que mexem em `.github/workflows/` (dependency-review-action, codeql-action) são Regra 8 e ficam
  abertas para o dono;
- as de bump **major** (framer-motion 13→14, lucide-react 0.462→1.77, react-i18next 17→18, sonner 1.7→2,
  tailwind-merge 2→3) não foram adotadas: a regra do repositório é não subir major sem necessidade.
  As de patch/minor (recharts 3.10→3.11, autoprefixer 10.6→10.7, react-resizable-panels, @tanstack/react-virtual)
  são seguras, mas continuam sendo tarefa de dependência, não deste resgate.

## 6. O que fica aberto

- **#477** — 4 índices redundantes em `entregas`/`coletas`; branch `claude/chore-drop-4-indices-redundantes-261125-1222`
  preservada, migration e rollback testados em banco descartável, nada aplicado em produção.
- As 22 etapas `[~]` do plano continuam sendo decisão do dono, não trabalho de agente interrompido.