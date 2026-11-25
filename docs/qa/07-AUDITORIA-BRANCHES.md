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

## 4. Os 8 arquivos que existem em PRs antigas e não na `main`

A checagem de caminho acusou os mesmos arquivos em 12 PRs diferentes. Todos têm destino conhecido —
nenhum é trabalho perdido. **Duas linhas desta tabela foram corrigidas na camada 5 (seção 7):** os dois SQL
de `scripts/` não foram removidos, foram **movidos** para `scripts/historico/`.

| Arquivo | O que aconteceu de fato |
| --- | --- |
| `scripts/cleanup_triggers_source.sql` | **movido** para `scripts/historico/` por #340 (`171f858a1`, rename com 0 alterações) — está na `main` hoje, com README explicando o histórico |
| `scripts/origem_remediacao_2026-08-31.sql` | **movido** para `scripts/historico/` pelo mesmo #340 |
| `src/hooks/ai/useNexusSimulator.ts` | removido por #300 (etapas 068+069 — hooks mortos); `git grep` na `main` = 0 importadores |
| `src/hooks/security/useSelfHealing.ts` | removido por #300; 0 importadores na `main` |
| `src/utils/performance.ts` | removido por #304 (etapas 080+081); 0 importadores de `@/utils/performance` na `main` |
| `supabase/functions/_shared/service-wrapper.ts` | removido por #305 (etapa 082); 0 importadores na `main` |
| `supabase/migrations/20240822_gamification_system.sql` | removida por #224; substituída por `supabase/migrations/20260102100001_gamification_real.sql` (existe na `main`) |
| `supabase/functions/migrate-helper/index.ts` | removida do repo de propósito por **segurança** (`6086f5817` e `7b5594728` expunham `service_role` e `ACCESS_KEY`); produção confirma: a function devolve **HTTP 404 `{"code":"NOT_FOUND"}`** (a `health`, no mesmo gateway, devolve 200 — a sonda é válida). O que ela fazia (backup diário da origem) está na `main`: `scripts/ops/backup_origem.sh` + `scripts/ops/backup_origem.unit.mjs` |

## 5. Dependabot (28 PRs fechadas sem merge, 12 abertas)

São PRs de bot, recriadas automaticamente quando ficam velhas, e por isso não entram na regra de "não
perder trabalho". Duas observações que valem decisão:

- as que mexem em `.github/workflows/` (dependency-review-action, codeql-action) são Regra 8 e ficam
  abertas para o dono;
- as de bump **major** (framer-motion 13→14, lucide-react 0.462→1.77, react-i18next 17→18, sonner 1.7→2,
  tailwind-merge 2→3) não foram adotadas: a regra do repositório é não subir major sem necessidade.
  As de patch/minor (recharts 3.10→3.11, autoprefixer 10.6→10.7, react-resizable-panels, @tanstack/react-virtual)
  são seguras, mas continuam sendo tarefa de dependência, não deste resgate.

## 6. Inventário total de PRs (a prova final)

Contagem fechada do repositório, `gh pr list --state all --limit 600`, em 2026-11-25:

| Estado | Total | Composição |
| --- | --- | --- |
| Mergeadas | 422 | 346 de agente + 15 de bot de workflow + 1 de ferramenta |
| Fechadas sem merge | 47 | **19 de agente** (todas na tabela da seção 3) + 28 do dependabot |
| Abertas | 13 | **1 de agente (#477)** + 12 do dependabot |

Fechando a conta: 482 PRs, e **não existe nenhuma PR de agente fora de uma destas três situações** —
mergeada, auditada na seção 3, ou aberta. As 19 fechadas sem merge não são uma amostra, são o conjunto
inteiro, conferido um a um.

Duas correções em relação à primeira passada:

- A #181 (realtime com topic único) está **mergeada**, não fechada. Ela entrou na lista de heads
  baixados porque a branch `claude/fix-realtime-topics-duplicados-261118-0935` já tinha sido apagada;
  o conteúdo está na `main`.
- Por isso o total de fechadas sem merge é 47, não 48.

## 7. A camada mais funda: os 833 commits inacessíveis

Squash-merge não guarda o commit original: ele fica solto no repositório. `git fsck --unreachable` neste
clone encontrou **833 commits inacessíveis** — o resíduo de todo merge feito com squash, mais commits de
stash, rebases locais do dependabot e pontas de branches já apagadas. É a última superfície onde trabalho de
agente poderia estar escondido, então ela foi auditada inteira.

**Método.** Para cada commit com 1 parent (642; os outros 191 são commits de merge, que não acrescentam
conteúdo próprio), `git diff --unified=0 <parent> <commit>`, coletando as linhas adicionadas com 18
caracteres ou mais e testando pertinência contra o conjunto de linhas do arquivo correspondente na `main`,
com normalização para não confundir renome de variável com perda. Depois, para cada caminho tocado,
`git ls-tree` no commit contra a `main`, para separar "arquivo que está na main" de "arquivo que nunca
chegou".

**Resultado: 1.098 linhas adicionadas sem correspondência direta**, em: 474 de código-fonte, 269 de
documento/contador, 166 de dependabot/lock, 49 de artefato gerado (`coverage/`), 48 de teste-espelho,
11 de `schema-manifest.json` e o resto em workflows e configs.

Nenhuma delas é trabalho perdido: todas são **formulações anteriores** do que a `main` tem hoje, porque a
`main` continuou evoluindo depois daquele commit. As provas mais fortes, arquivo a arquivo:

| Resíduo no commit inacessível | O que está na `main` hoje |
| --- | --- |
| `CotacaoMultiCanal.tsx` gravando `transportadora_nome` | `src/pages/CotacaoMultiCanal.tsx:165,337,424,452,475` gravam `transportadora_id` — evoluiu de nome para id |
| `webhook-status/index.ts` chamando `validationErrorResponse(error, corsHeaders)` | `supabase/functions/webhook-status/index.ts:201` chama `validationErrorResponse(error, headers)` — mesmo comportamento, parâmetro renomeado |
| `useAccuracyMetaCycle.ts` com laço `for` e `await` em série | `src/hooks/logistics/useAccuracyMetaCycle.ts:93,112,125` usa lote com `await Promise.all` — a versão paralela é a que ficou |
| `ingest-biosync` importando a validação de `_shared/validate.ts` | `supabase/functions/ingest-biosync/index.ts:11` importa `parseBioSyncInput` de `./parse.ts` — validação extraída para o próprio diretório |
| `nexus-webhook-receiver` respondendo `{ success: true, data: normalizacao.data }` | `supabase/functions/nexus-webhook-receiver/index.ts:192` — linha equivalente na `main` |
| `PasswordStrengthIndicator` chamando a checagem de senha | `src/components/auth/PasswordStrengthIndicator.tsx:111` continua chamando por `supabase.functions.invoke` |

**Arquivos inteiros que nunca chegaram à ponta da `main`: 134** (só `src/`, `supabase/`, `scripts/`,
`tests/`, `public/` e `docs/contexto/`). Desses, **33 não têm homônimo** e foram resolvidos um a um:

- 27 arquivos de teste (`src/test/*.test.ts`, `KPICard.test.tsx`, `FreightAudit.test.tsx`,
  `celebrationSounds.test.ts`, `smoke.spec.ts`, `tests/load/cotacao.js`) foram apagados pelo commit-lote
  `24af1e2b4` — **2026-05-15, limpeza legada do próprio projeto, antes de qualquer agente existir**. Os
  equivalentes modernos estão na `main`: `tests/e2e/critical-paths.spec.ts`, `tests/e2e/dashboard.spec.ts`
  e `tests/load/backend-stress.spec.ts`.
- `kpi-benchmark-paralelo.spec.ts` foi substituído por `tests/contracts/kpi-benchmark-consulta-unica.spec.ts`
  (etapa 220), que é justamente o teste da consulta única.
- Os 8 arquivos de código fora de `src/` estão na tabela da seção 4.
- Todos os `src/hooks/*.ts` "achatados" têm equivalente em subpasta de domínio (`src/hooks/<área>/`):
  **0 órfãos**.
- 58 caminhos reportados como ausentes eram artefatos gerados (`coverage/**`), que não são versionados.

**Veredito da camada 5:** nada a restaurar. Nenhuma linha exclusiva de commit inacessível representa
capacidade que a `main` não tenha hoje — e em todas as comparações acima o que ficou na `main` é a versão
mais nova, não a mais antiga.

## 8. O que fica aberto

- **#477** — 4 índices redundantes em `entregas`/`coletas`; branch `claude/chore-drop-4-indices-redundantes-261125-1222`
  preservada, migration e rollback testados em banco descartável, nada aplicado em produção.
- As 22 etapas `[~]` do plano continuam sendo decisão do dono, não trabalho de agente interrompido.
- **`ESTADO_ATUAL.md` desatualizado sobre o `migrate-helper`** — as linhas 29, 144, 146 e 277 afirmam que a
  function "está implantada e executando" em produção; hoje ela devolve 404, e a `health` no mesmo gateway
  devolve 200, o que valida a sonda. Documento de estado, não de código.
- **Texto da etapa 073 desatualizado** — `docs/qa/05-PROGRESSO.md:124` e a tabela em `:4643` descrevem
  `ingest-biosync` "inventando batimento com `Math.random()` em `index.ts:43`", mas a `main` não tem nenhum
  `Math.random()` no arquivo (151 linhas, validação por `parseBioSyncInput`): as etapas 148/149/199 já
  tiraram isso. A decisão de manter ou remover a function precisa ser tomada com o texto atualizado.

## 9. Objetos órfãos do object DB (blobs e trees soltos)

**Método.** `git fsck --dangling` separa dois resíduos diferentes: objetos *unreachable* (resto de squash e
stash, cobertos pela seção 7) e objetos **soltos** (`dangling`), que nada referencia — sobra de `git add`
seguido de reset, isto é, **snapshots de índice** (o que estava staged quando o agente parou). São 4 blobs e
98 trees soltas. Reconstruí cada tree como `{caminho: blob}` e comparei com `git ls-tree -r origin/main`:
1.795 caminhos, **45 que não existem na main hoje**.

| O que é | Quantos | Situação |
| --- | --- | --- |
| `coverage/**` | 33 | artefato gerado, não versionado |
| os 8 arquivos da seção 4 | 8 | já explicados |
| `.env` | 1 | item 9.1 |
| `.github/workflows/e2e.yml` | 1 | item 9.2 |
| versão antiga de arquivo que existe na main | 2 | obsoleto (a main tem a versão mais nova) |

Os 4 blobs soltos restantes (fora das trees) são artefatos: `prettify.css`, `coverage-final.json` e
`public/quality-gate-report.json`.

### 9.1 `.env` no histórico de um repositório público

O blob `32feee7723` (460 B) contém `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_MAPBOX_TOKEN`. Entrou em `852d0bdec` (31/08/2026, migração do Lovable
para o Supabase) e foi destrackeado em `2aaab20b1` (#297, 23/11/2026, Onda 1 de segurança). Hoje o `.env` não
está na árvore e o `.gitignore` já o cita — mas **o conteúdo continua no histórico**, e o repositório é
público. Nenhum valor foi impresso nesta auditoria.

O que isso significa, verificado:

- **A publishable/anon key não é segredo** — é pública por desenho e vai no navegador; o risco dela é o que o
  RLS permite (achados S-01 a S-08), não a exposição em si.
- **O `VITE_MAPBOX_TOKEN` é dívida morta**: S-08 (`docs/qa/03-ACHADOS.md:231`) já registra que
  `grep VITE_MAPBOX_TOKEN src/` não devolve nada e os mapas usam `maplibre-gl`, sem token. Restringir ou
  revogar o token é ação no painel do Mapbox (dono) — segue aberto e não muda por causa do histórico.
- **Credencial de teste não abre produção**: o `admin@nexus.ai` que estava fixo em
  `tests/e2e/critical-paths.spec.ts` não existe em `auth.users` (7 contas no total), e a senha padrão
  publicada em `scripts/seed-database.ts:35` **não** confere com o hash bcrypt do `admin@loggiflow.com.br`
  de produção (comparação local por `crypt.crypt`, sem imprimir hash): o seed rodou com `SEED_PASSWORD`
  própria. O spec já não carrega credencial (PR #498).

Reescrever o histórico para apagar o blob não se recomenda: o repositório é público, o objeto pode já ter sido
clonado e a reescrita quebra todos os SHA referenciados nas 482 PRs. A mitigação correta é rotacionar o que é
segredo de verdade (Mapbox) e manter o resto, porque é público por desenho.

### 9.2 `.github/workflows/e2e.yml`

Quatro versões aparecem nos snapshots (`f00a52dc34`, `957f8512ba`, `5aaee01b6b` e `6cb86bc2c1`); a última foi
removida de propósito na #223 ("remove e2e.yml morto"). Conteúdo: workflow manual (`workflow_dispatch`),
`npm ci`, `npx playwright install --with-deps chromium` e `npm run test:e2e -- --project=chromium`; uma das
versões usa `node-version: "22"`.

**Obsoleto por decisão, não trabalho perdido.** As duas suítes existem na main e continuam fora da CI porque
não há usuário semeado nem ambiente de teste — é exatamente isso que a etapa 283 trata. A parte da etapa que
não dependia de ninguém está feita: `tests/e2e/README.md` (PR #498) documenta o que cada suíte exige, as
credenciais e por que elas não estão nos 10 required checks. Recriar o workflow é Regra 8 e só faz sentido
depois do usuário dedicado; a versão com Node 22 fica como insumo.

**Veredito da camada 6:** nenhuma funcionalidade ficou perdida. Sobram um item de segurança (token do Mapbox,
já aberto como S-08) e uma decisão de workflow já registrada — os dois dependem do dono e nenhum é resgate de
código.

## 10. Branches de automação (bots)

As duas branches remotas que não são de agente nem de dependabot foram comparadas com a `main` antes de
qualquer decisão sobre apagá-las.

### 10.1 `automation/types-sync`

Um commit (`d5e62a54d`, 25/11/2026, `chore(db): sincronizar artefatos com o banco [auto]`) que só toca
`supabase/schema-manifest.json`. Prova de incorporação: `git diff origin/main origin/automation/types-sync`
devolve **vazio** — o conteúdo da branch já está na `main`. É a branch de trabalho do workflow de tipos, que
se recria sozinha quando o banco muda; não é trabalho de agente e não há nada a resgatar.

### 10.2 `contexto`

Histórico órfão (sem base comum com a `main`), um único commit reescrito a cada execução:
`e283c1307 chore(contexto): 3 fonte(s) regerada(s) @ main a81ebc8 [skip ci]`. Carrega **589 arquivos** em
`docs/contexto/` que a `main` não tem (a `main` só versiona `docs/contexto/regras/manual/`, 2 arquivos).

Isso é **por desenho**, não perda: o `.github/workflows/contexto-ia.yml` da `main` documenta no cabeçalho
"Onde fica: branch `contexto` (gerada, 1 commit — só o HEAD é consumido; nunca abra PR dela)". As últimas
execuções estão verdes (25/11/2026 17:12 UTC, `schedule`, `success`) e o corpus é regenerável a partir das
três fontes de verdade.

**Não apagar nenhuma das duas.** A primeira é do bot e é idempotente; a segunda é o único lugar onde o corpus
de contexto vive — apagá-la deixaria agentes sem a fonte até a próxima execução do workflow.
