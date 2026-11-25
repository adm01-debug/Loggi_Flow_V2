# Contexto para agentes de IA — como ler o estado real do projeto

Automação que mantém, sozinha, um retrato do projeto sempre atualizado para qualquer agente de IA ler
**antes** de mexer em código, banco ou regra. Nada aqui é escrito à mão.

## Em uma linha

```sh
git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md
```

Sem clone (MCP ou navegador):
`https://raw.githubusercontent.com/adm01-debug/Loggi_Flow_V2/contexto/docs/contexto/00-INDEX.md`
(ou MCP do GitHub: `github_get_content` / `get_file_contents` com `ref=contexto`).

## Três fontes, cada fato com um dono

| Pasta na branch `contexto` | Produtor (na main) | Dona de quais fatos |
|---|---|---|
| `docs/contexto/codigo/` | `scripts/ai-context/gerar.mjs` | rotas, menu, módulos, componentes, hooks, edge functions, grafo de dependências, testes, scripts, CI, convenções, baseline |
| `docs/contexto/supabase/` | `scripts/supabase_snapshot/snapshot.py` | banco OFICIAL ao vivo: tabelas, colunas, RLS, constraints, índices, functions, triggers, cron, storage, lints, métricas |
| `docs/contexto/regras/` | `scripts/regras_negocio/generate.py` | o que pode e o que não pode: RLS por operação, máquinas de estado, validações, fórmulas, prazos, mensagens de erro, lacunas e as regras humanas de `manual/` |
| `docs/contexto/00-INDEX.md` | `scripts/regras_negocio/indice.py` | índice único: quem é dono de cada fato e se cada fonte está `ok`, `parcial` ou `desatualizada` |

Se duas fontes discordarem, vale a dona do fato. Tabela/coluna/política existe? → `supabase/` (migrations
do repo são histórico, não estado). Onde fica e quem chama? → `codigo/`. Pode fazer isso? → `regras/`.

## Quem roda isso

`.github/workflows/contexto-ia.yml` — um workflow, três jobs produtores independentes, um job que monta o
índice e publica. Dispara a cada push em `main` que toque `src/`, `supabase/`, os scripts das automações ou
`docs/contexto/regras/manual/`, mais um agendamento a cada 10 min (minuto 7) e `workflow_dispatch`.

- No agendamento, `codigo/` e `regras/` são puladas em segundos se a `main` não mudou desde a última
  publicação (comparação por commit nos `manifest.json`). `supabase/` sempre coleta, porque o banco muda
  sem push.
- Só há commit quando algo mudou de verdade. Quando só métricas voláteis mudam, o commit é limitado a
  1 por hora.
- Produtor que falha não derruba os outros: o job `publicar` republica as fontes que saíram e mantém as
  demais como estavam. Seções com erro aparecem em `supabase/errors.md` (gerado; nao existe no repo) e em `codigo/` → `erros_do_gerador`.
- Publica na branch gerada **`contexto`**, nunca na `main`. Não edite essa branch nem abra PR dela — o
  próximo run sobrescreve. Push com `GITHUB_TOKEN` não dispara outros workflows, e os CIs deste repo só
  escutam `main`/`master`/`develop`.

## O que ainda falta ligar

`docs/contexto/supabase/` fica **vazia** até existir o secret `SUPABASE_DB_URL` (Settings → Secrets and
variables → Actions). Até lá o job `banco` sai verde com aviso e as outras duas fontes continuam normais.
O `SUPABASE_ACCESS_TOKEN` que já existe no repo serve à Management API, não à introspecção do Postgres.
Formato exigido e por quê (session pooler, usuário `postgres`): `scripts/supabase_snapshot/README.md`.

## Enquanto isso: o banco real pelo MCP

O projeto oficial é **`jvfhclubfpxrtrrazrgr`** (`supabase/config.toml`). Numa sessão de agente com MCP,
consulte o banco pelo **`SUPABASE - LOGGI FLOW V2 - MCP`**. Confira qual MCP carregou antes de usar: há
vários Supabase quase homônimos na conta (Zapp Web V2, Gestão de Clientes, Gestão de Produtos, Promo
Finance/Supply, Fast Gravações) e nenhum deles é este banco.

Esse MCP conecta como **`postgres` com service_role e aceita DDL** — ele ignora RLS e escreve em produção:

- **Diagnóstico é somente leitura.** `db_list_tables`, `db_list_policies`, `db_describe_table`,
  `db_explain`, `db_missing_indexes`, `db_health`. Nunca um `UPDATE`/`DELETE`/`DDL` "para testar".
- **DDL/migration em produção é decisão do dono** — abra PR com a migration e chame, não aplique.
- O que o MCP responde é o estado de **agora**; o snapshot em `docs/contexto/supabase/` é o retrato
  versionado, com histórico e `CHANGELOG.md`. Quando as duas discordarem, vale o MCP (é o banco ao vivo).
- **`docs/contexto/codigo/banco.json` não é fonte de banco.** Ele sai de `scripts/ai-context/gerar.mjs`
  varrendo o código: não modela índice, trigger criado fora do repo nem DDL dinâmico, e foi dele o falso
  positivo "36 tabelas sem RLS" (ao menos 32 têm policy). Existência de tabela/coluna/policy e leitura de RLS
  saem do MCP ou de `docs/contexto/supabase/` — nunca de `codigo/banco.json`.
- Enquanto `supabase/` estiver vazia na branch (o `00-INDEX.md` diz na linha do banco se está `ok` ou
  `desatualizada`), o caminho é este: MCP para consultar, e nada de tirar conclusão de RLS do `banco.json`.

## Regras que só o negócio sabe

Escreva em `docs/contexto/regras/manual/*.md` na **main** (comece copiando
`TEMPLATE-regras-de-negocio.md` para `regras.md`). Esse texto entra na seção A de
`07-REGRAS-DE-NEGOCIO.md` com prioridade máxima e nunca é sobrescrito pelo gerador.

## Rodar local

```sh
node --test scripts/ai-context/gerar.unit.mjs
python3 scripts/regras_negocio/test_generate.py
python3 scripts/supabase_snapshot/test_snapshot.py

node scripts/ai-context/gerar.mjs --out /tmp/ctx/codigo
python3 scripts/regras_negocio/generate.py --repo . --out /tmp/ctx/regras --profile regras \
  --schema-snapshot /tmp/ctx/supabase --index-path /tmp/ctx/00-INDEX.md --no-pointer
```

Nenhum desses três precisa de rede ou credencial. Só `snapshot.py` precisa do banco.

Origem: portado de `adm01-debug/Zapp_Web_V2`; o código dos três produtores é o mesmo, sem alteração.
