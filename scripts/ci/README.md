# scripts/ci — guardas do CI

## `check-claude-md-integrity.mjs`

Impede que as instruções para agentes sejam apagadas ou esvaziadas por uma sessão paralela (vários agentes
escrevem neste repo ao mesmo tempo; `github_push_files` sobrescreve arquivo inteiro).

Verifica, nesta ordem:

1. `AGENTS.md` existe;
2. os 8 cabeçalhos obrigatórios estão presentes **como cabeçalho, em início de linha** (citar `## Postura`
   numa frase ou rebaixar para `### Postura` não conta): `## Postura`, `## Bugs e funcionalidades`,
   `## Comunicação`, `## Fluxo Git`, `## Banco`, `## Serviços`, `## Stack e comandos`,
   `## Grafo de código`;
3. o conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` não encolheu mais de **30%** em bytes contra a
   base;
4. nenhum arquivo vigiado (o `AGENTS.md` e cada `docs/agentes/*.md` que exista na base) sumiu ou encolheu
   mais de **50%** — o limiar do conjunto sozinho não pega o esvaziamento de um arquivo só;
5. `CLAUDE.md` existe e importa `@AGENTS.md` — sem essa linha os agentes Claude não carregam regra nenhuma.

`docs/agentes/` é lido com subpastas, e nomes com espaço ou acento são vigiados. O guard confere sempre o
repositório em que o script está, qualquer que seja o diretório de onde for chamado.

`CLAUDE.md` conta no total, mas não é vigiado por tamanho: por design ele é só `@AGENTS.md`.

### Como rodar

```sh
# local, comparando com o HEAD
node scripts/ci/check-claude-md-integrity.mjs

# como no CI, comparando com a main remota
git fetch --no-tags --depth=1 origin main
CLAUDE_MD_BASE=FETCH_HEAD node scripts/ci/check-claude-md-integrity.mjs
```

Sem dependências (Node puro). No CI roda no job `Agents Docs Integrity` do `.github/workflows/ci.yml`.

### Quando ele falha de verdade

- Você reescreveu o `AGENTS.md` e removeu uma seção obrigatória → devolva o cabeçalho (a seção pode ser
  curta, mas tem de existir).
- Você está **movendo** conteúdo de `AGENTS.md` para `docs/agentes/` → o conjunto é medido junto, então
  mover não dispara; só dispara se o total realmente encolher.
- Encolhimento legítimo e desejado (limpeza grande aprovada pelo dono) → faça em PR própria, com o motivo no
  corpo, e o dono decide; não contorne o guard.

## `check-dedupe-keys.mjs` — chave de dedupe sem valor aleatório nem relógio

Impede que volte o achado **B-02** da etapa 142: a chave do evento construída com `crypto.randomUUID()`
ou `Date.now()` faz cada entrega repetida parecer evento novo — a dedupe nunca casa e o webhook
reprocessa. Varre `supabase/functions/**/index.ts` e reprova quando um nome que contenha
`event_id`/`eventId`/`event_key`/`idempot*` aparece seguido de `:` ou `=` e, na mesma expressão (até o
`;` ou 300 caracteres), chama `crypto.randomUUID(` ou `Date.now(`.

Comentários são mascarados antes da busca (um `// antes era Date.now()` não reprova código limpo) e o
alvo é estreito de propósito: `Date.now()` em `startedAt`/`expiresAt`/`timestamp` e o `crypto.randomUUID()`
do `Request-ID` de `lalamove-tracking` continuam válidos. Proibir a chamada no repositório inteiro viraria
ruído e alguém desligaria o gate.

```sh
npm run validate:dedupe-keys                            # confere o repositório em que o script está
node scripts/ci/check-dedupe-keys.mjs --root .          # mesmo efeito, raiz explícita
node --test scripts/ci/check-dedupe-keys.unit.mjs
```

Exit: `0` limpo (imprime quantos `index.ts` conferiu); `1` com uma linha `::error::` por ocorrência;
`2` em uso inválido, `supabase/functions/` ausente ou nenhum `index.ts` encontrado — falha do próprio
gate, nunca verde falso.

**Ainda não está ligado a nenhum workflow**: a etapa 142 proíbe mexer na CI (é decisão do dono). A
sugestão registrada em `docs/qa/05-PROGRESSO.md` é ligá-lo a um job, como `validate:query-limits` no
`quality-gate` do `ci-nexus.yml`.

### Quando ele falha

- Você montou a chave com campo instável → use o id do provedor ou o hash do corpo
  (`_shared/idempotency.ts`, `buildEventKey`/`bodyHash`).
- É falso positivo (o nome não é chave de dedupe, ou a chamada é de outro campo) → o achado é **um
  nome** com `idempot`/`event_key` no meio; renomeie a variável ou abra discussão no PR em vez de afrouxar
  o padrão.

## `check-env-not-tracked.mjs` — arquivo de ambiente fora do git

Impede que o `.env` volte para o índice do git (etapa 018 do plano QA, achado **S-07**). O `gitleaks` procura
*padrão de segredo* no diff: um `.env` só com a chave `anon` passa limpo — foi assim que o arquivo ficou
meses no repositório. Este gate olha o **nome**: reprova qualquer caminho de `git ls-files` cujo nome comece
com `.env` e não seja `.env.example`. Olha o índice, não o disco: `.env` na máquina de quem desenvolve,
ignorado pelo git, não reprova.

Sem dependências (Node puro). No CI roda no job `Security Scan` do `.github/workflows/ci.yml`, ao lado do
`audit-gate.mjs` e do gitleaks.

### Como rodar

```sh
node scripts/ci/check-env-not-tracked.mjs             # confere o repositório em que o script está
node scripts/ci/check-env-not-tracked.mjs --root .    # mesmo efeito, raiz explícita
node --test scripts/ci/check-env-not-tracked.unit.mjs
```

Exit: `0` limpo (imprime quantos caminhos conferiu); `1` com uma linha `::error::` por arquivo rastreado;
`2` quando não conseguiu ler o índice (fora de um repositório git, `git` fora do PATH) — falha do próprio
gate, não verde falso.

### Quando ele falha

- Alguém rodou `git add -A`, `git add -f .env` ou o arquivo entrou por engano → `git rm --cached .env`,
  confirme o `.gitignore` e mande o segredo para o painel de variáveis (Supabase/Vercel). **Se o arquivo
  chegou a ser commitado, o valor dentro dele está comprometido: rotacione a chave** — tirar do índice não
  apaga o histórico.
- Arquivo novo legítimo chamado `.env.algo` → não existe exceção por nome além de `.env.example`; use outro
  nome (`env.algo`, `*.example`) em vez de afrouxar o gate.

## `github-settings-guard.mjs` — perímetro do GitHub contra o baseline

Compara branch protection da `main`, visibilidade e opções de merge do repo, permissões do Actions, rulesets e
environments com `github-settings-baseline.json` (o estado canônico de `docs/agentes/github-ci.md`). Roda no
`settings-guard.yml` (diário, 07:15 UTC).

- **Divergência** → exit 1, issue `[settings-guard] perimeter regression detected` aberta ou comentada (dedupe de
  6 h por causa) e tentativa de restaurar `strict` e `allow_auto_merge` para o valor do baseline.
- **Ponto cego** (o token não tem escopo para ler) → exit 0 com `::warning::` e a mesma issue (dedupe de 7 dias).
  Com só o `GITHUB_TOKEN`, branch protection, merge, Actions e environments ficam cegos; o secret
  `SETTINGS_GUARD_TOKEN` (PAT fine-grained com `administration:read`, no environment `perimetro-leitura`) fecha isso.
- **Erro** (token recusado, rate limit, 5xx depois de 3 tentativas, baseline inválido) → exit 1, sem virar ponto cego.
- "Branch not protected" é divergência, não ponto cego. Environments com os prefixos de
  `environments_vercel_managed` podem aparecer ou sumir sem alarme.

```sh
# local, só leitura: não restaura nada e não mexe em issue
GITHUB_TOKEN=<token> node scripts/ci/github-settings-guard.mjs --dry-run
node scripts/ci/github-settings-guard.mjs --help
```

Variáveis: `GITHUB_TOKEN` (obrigatória), `ADMIN_READ_TOKEN` (o PAT; vazio = usa o `GITHUB_TOKEN`),
`GITHUB_REPOSITORY`, `PERIMETER_SNAPSHOT_PATH`, `SETTINGS_GUARD_AUTOR`. **Sem `--dry-run` o script escreve no
GitHub** (issue e, se o token permitir, PATCH de restauração).

Mudou uma configuração de propósito? Atualize `github-settings-baseline.json` **e** a tabela de
`docs/agentes/github-ci.md` no mesmo PR. Chaves opcionais do baseline: `repo`, `allow_deletions`,
`required_pull_request_reviews` (`null` = nenhum review obrigatório; número = aprovações), `workflow_permissions`,
`rulesets_count`, `security_and_analysis`, `selected_actions_*`. Chave de topo desconhecida gera `::warning::`.

## `typecheck-ratchet.mjs` — catraca de erros de tipo

Roda `tsc -b --force` e compara com `typecheck-baseline.json`: falha (exit 1) só se aparecer erro **novo**; exit 2
é falha do próprio ratchet (baseline ilegível, TypeScript não instalado, tsc sem saída reconhecível). É o Gate 1
do `types-sync.yml`. O baseline deste repo é **zero** ocorrências, igual a `tsErrors: 0` do `.warning-budget.json`;
`npm run typecheck` checa o mesmo projeto.

```sh
node scripts/ci/typecheck-ratchet.mjs                    # compara (precisa de node_modules)
node scripts/ci/typecheck-ratchet.mjs --update-baseline  # regrava o baseline
```

`--update-baseline` que **aumenta** a contagem imprime `ATENCAO` e exige decisão do dono; quando erros somem, o
script avisa para rodar `--update-baseline` e a catraca descer. O `tsconfig.tsbuildinfo` que o `tsc -b` cria é
apagado ao final. Opções de teste: `--output <saida-do-tsc.txt>`, `--baseline <arquivo>`, `--root <dir>`.

## `install-postgresql-client.sh` e `install-pgbouncer.sh`

Garantem `psql` e `pgbouncer` no runner Ubuntu do `types-sync.yml`. Se o binário já existe **e roda**, só mostram a
versão; senão instalam com `sudo apt-get` usando apenas a fonte oficial do Ubuntu (repositórios de terceiros do
runner ficam fora). Qualquer falha do apt, ou binário ausente depois da instalação, sai com erro. Não rode fora de
um runner: precisam de `sudo`.

## `fila-merge.mjs` — fila de merge serial

Usado por `.github/workflows/auto-update-pr-branch.yml`. Decide qual PR com auto-merge é a próxima a ter a
branch atualizada com a `main` (uma por vez, FIFO pela hora em que o auto-merge foi ligado). **Só lê**
(`gh pr list`, `gh api .../compare`); quem chama o `update-branch` é o passo seguinte do workflow.

```sh
GITHUB_REPOSITORY=dono/repo GH_TOKEN=... node scripts/ci/fila-merge.mjs                 # grava pr= e fila= em $GITHUB_OUTPUT
GITHUB_REPOSITORY=dono/repo GH_TOKEN=... node scripts/ci/fila-merge.mjs --confirmar 12 --recusadas "9 10"
node scripts/ci/fila-merge.mjs --help
```

- Lê os checks obrigatórios e o `strict` de `scripts/ci/github-settings-baseline.json`.
- **Com `strict=false` no baseline (estado atual deste repo) a fila fica desligada**: PR atrasada mergeia sem
  atualizar, então o script não chama o `gh`, não grava `pr=` e o resumo diz "Fila desligada". Volta a
  funcionar sozinho quando o baseline passar a `strict: true`.
- Fora da fila: draft, sem auto-merge, base diferente de `main`, conflito (`DIRTY`), fork atrasada, check
  obrigatório falhando.
- Exit: `0` decisão tomada (inclusive "ninguém"); `2` uso inválido ou `GITHUB_REPOSITORY` ausente; `3`
  `--confirmar` negado. Falha do `gh` (401/403/404/429/5xx, JSON inválido, `gh` fora do PATH) **não** derruba
  o job: ninguém é atualizado, sai `::warning::` e o Job Summary traz o motivo.

## `branch-podaveis.mjs` — comando de poda de branches

Usado por `.github/workflows/branch-hygiene-audit.yml`. **Nunca apaga nada**: escreve, em markdown, o bloco
`git push origin --delete <branch>` para o dono revisar e rodar.

```sh
node scripts/ci/branch-podaveis.mjs --equivalentes eq.tsv --prs prs.json --protegidas prot.txt --limite-prs 500
```

- `eq.tsv`: `<branch>\t<epoch do último commit>` por linha; `prs.json`: `gh pr list --json headRefName` (aceita
  `baseRefName`: a base de uma PR aberta também fica); `prot.txt`: uma branch protegida por linha.
- Entra no comando só a branch patch-equivalente à `main`, com último commit há mais de 7 dias, sem PR aberta,
  não protegida e com nome só de `[A-Za-z0-9._/-]`.
- `main`, `master`, `develop` e `contexto` **nunca** entram (`SEMPRE_FORA`), mesmo sem proteção cadastrada.
- Qualquer entrada ilegível, lista de PRs cheia até o limite ou `--limite-prs` inválido → "Comando não
  gerado" + `::warning::`. Sempre exit `0`.

## `actions-kpi.mjs` — KPI semanal do GitHub Actions

Usado por `branch-hygiene-audit.yml`. Lista os runs da janela, soma por workflow (runs, cancelados, falhas,
minutos) e monta o ranking dos 5 jobs mais lentos. **Escreve no GitHub**: cria ou atualiza a issue aberta
`[kpi-actions] Semana de AAAA-MM-DD` (etiqueta `kpi-actions`) — precisa de `issues: write`.

```sh
GITHUB_REPOSITORY=dono/repo GH_TOKEN=... JANELA_DIAS=7 node scripts/ci/actions-kpi.mjs
```

- Env: `GITHUB_REPOSITORY`, `GH_TOKEN` (ou `GITHUB_TOKEN`), `JANELA_DIAS` (padrão 7; inválido → exit `2`),
  `GITHUB_API_URL` (opcional), `GITHUB_STEP_SUMMARY` (opcional).
- A duração é `updated_at - run_started_at`; a janela é em instante absoluto (UTC), não em dia de calendário.
- Os jobs são consultados só nos 50 runs mais longos da janela (1 requisição por run); quando a amostra é
  menor que o total, o corpo diz isso. Run cujo endpoint de jobs falha é pulado com `::warning::`.
- Exit: `0` publicado; `1` erro da API (a mensagem traz o status e o texto do GitHub); `2` env faltando ou
  inválido. Não há dry-run: para testar sem escrever, aponte `GITHUB_API_URL` para um servidor local (é o que
  o teste faz).

## `sla-code-scanning.mjs` — SLA dos alertas de code scanning

Usado por `branch-hygiene-audit.yml`. Lê do stdin o JSON de alertas abertos e escreve o relatório em markdown.

```sh
gh api --paginate --slurp "repos/$REPO/code-scanning/alerts?state=open&per_page=100" | jq 'add' \
  | node scripts/ci/sla-code-scanning.mjs
```

- SLA: `high`/`critical` → 14 dias; `medium`/`low` → 30 dias, contados em dias inteiros desde `created_at`.
  Alerta sem `created_at` válido conta como violação.
- Exit `1` quando há violação (uma linha `::error::` por alerta); `0` nos demais casos.
- Entrada que não é lista (403/404 da API — o caso de repo privado sem code scanning habilitado —, JSON
  inválido, stdin vazio) → exit `0`, `::warning::` e relatório "Não foi possível consultar os alertas".

## `bump-toolchain.mjs` — versões novas da toolchain

Usado por `branch-hygiene-audit.yml`. Compara as versões pinadas em `.github/toolchain.json` (`bun`, `deno`,
`supabase-cli`, `playwright`, `actionlint-version`) com a última release de cada projeto no GitHub. **Só lê e
relata** — apesar do nome, não altera o `toolchain.json`, não abre PR nem issue.

```sh
GH_TOKEN=... node scripts/ci/bump-toolchain.mjs      # sem token consulta anônimo (60 req/h)
```

Sempre exit `0`: `toolchain.json` ausente ou inválido vira `::warning::`; consulta que falha aparece em "Não
foi possível verificar", e o ✅ só cita as ferramentas realmente comparadas.

## `scripts/lib/seguranca-processo.mjs` — utilidades compartilhadas

Importado por `scripts/ci` e `scripts/db-audit`. `resolverExecutavel(cmd)` devolve o caminho absoluto do
binário pelo PATH (pula diretório e arquivo sem bit de execução); `resolverCaminhoPermitido(valor, rótulo)`
lança quando o caminho — seguidos os links, inclusive link cujo alvo ainda não existe — sai do repositório ou
do diretório temporário; `executadoDiretamente(import.meta.url)` diz se o módulo é o ponto de entrada (vale
com checkout atrás de link simbólico e em caminho com espaço ou acento).

## `validate-query-limits.mjs` — teto nas consultas de listagem

Impede que volte o achado **P-01** do plano QA: uma listagem que busca a tabela inteira
(`supabase.from(<tabela>).select(...)` sem teto). O repositório já tem 16 listagens certas com tetos entre 1
e 5000 e ainda 61 cadeias sem teto nenhum — a regra existia só na cabeça de quem revisa.

Varre `src/` (ignora `*.test.*`, `*.spec.*`, `*.d.ts`), encontra cada `.from(<tabela>)` cuja cadeia tem
`.select` e considera **com teto** quando a cadeia termina em `.limit(`, `.range(`, `.single(` ou
`.maybeSingle(`, quando a consulta so pede contagem (`head: true`, o servidor nao devolve linha), **ou** quando o teto entra depois na variável que recebeu a consulta
(`let query = supabase.from(...); ... await query.order(...).limit(500)`), padrão legítimo de
`useSecurityEvents.ts` e `useConciliacao.tsx`. A busca do teto adiado é sintática, com janela de 2000
caracteres: um `.limit()` de outro fluxo, mais adiante no arquivo, não conta.

Duas listas de exceção ficam em `scripts/ci/query-limits.allowlist.json`:

- `tabelas` — domínio pequeno, sem teto **de propósito**, cada uma com o motivo numa linha
  (`transportadoras`, `clientes`, `fornecedores`, `permissions`, `achievements`, `reward_items`,
  `feature_flags`, `tabelas_frete`, `transportadora_rotas`).
- `baseline` — dívida congelada por par `arquivo:tabela`, no formato da catraca de avisos e da catraca de
  tipos: a contagem pode ficar igual ou cair, nunca subir. Consulta nova sem teto em arquivo já listado
  reprova, porque a contagem do par sobe.

### Como rodar

```sh
npm run validate:query-limits              # falha (saída 1) se aparecer dívida nova
npm run validate:query-limits -- --warn     # mesmo relatório, saída 0 (primeiro ciclo, sem bloquear PR)
npm run validate:query-limits -- --json     # relatório estruturado
npm run validate:query-limits -- --update-baseline   # regrava a dívida congelada (catraca)
node --test scripts/ci/validate-query-limits.unit.mjs
```

`--root <raiz>` e `--allowlist <arquivo>` trocam o repositório e a allowlist (usados pelos testes com
repositório sintético). Sem `src/` o script reprova em vez de dar verde falso.

### Quando ele falha

- Você escreveu listagem nova sem teto → acrescente `.limit(<n>)` **depois** do `.order()` (ordering antes do
  corte; cortar sem ordenar devolve linhas arbitrárias) ou pagine com `.range()`.
- A tabela é de domínio pequeno e o teto não faz sentido → declare em `tabelas`, com o motivo.
- Você **consertou** uma dívida congelada → rode `--update-baseline` no mesmo commit para apertar a catraca; a
  saída normal já avisa quando uma entrada do baseline deixou de existir.

No CI roda no job `quality-gate` do `.github/workflows/ci-nexus.yml`, logo depois de `validate:no-console`.

## Testes

`node:test`, offline, sem credencial: `gh` falso no PATH, `fetch` trocado via `--import`, servidor HTTP local,
repositórios git sintéticos, `tsc` falso e stubs de `sudo`/`apt-get`. Um arquivo `<script>.unit.mjs` por script.
Nenhum workflow os roda ainda.

```sh
node --test scripts/ci/*.unit.mjs scripts/lib/*.unit.mjs
```
