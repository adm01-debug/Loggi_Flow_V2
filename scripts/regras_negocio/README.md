# regras_negocio — regras de negócio para agentes de IA

Produtor da fonte **regras de negócio** do contexto para agentes. Lê código, migrations/`types.ts` e
`docs/contexto/regras/manual/` (texto humano) e publica, na branch derivada `contexto`:

| Arquivo                                          | Conteúdo                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`   | regras manuais · RLS por operação · constraints/CHECK/FK/colunas calculadas · triggers + `RAISE EXCEPTION` · máquinas de estado (colunas de status, mapas de transição, valores usados no código) · validações (Zod + refine, react-hook-form, inputs) · fórmulas · parâmetros e prazos · mensagens de erro · testes como especificação · eventos de webhook · efeitos colaterais |
| `docs/contexto/regras/10-ACESSO-E-SEGURANCA.md`  | perfis, matriz tabela × operação → quem pode, onde o RLS é ignorado (service_role, SECURITY DEFINER), edge functions públicas, rotas protegidas, multi-tenancy, soft delete, PII, colunas de dinheiro                                                                                                                                                                             |
| `docs/contexto/regras/11-GLOSSARIO-E-LACUNAS.md` | glossário, seed, inconsistências código × schema (NÃO VERIFICADO) e lacunas que só o dono do negócio responde                                                                                                                                                                                                                                                                     |
| `docs/contexto/regras/manifest.json`             | `gerado_em`, `commit`, `entrada`, `arquivos` — lido pelo `indice.py`                                                                                                                                                                                                                                                                                                              |
| `docs/contexto/00-INDEX.md`                      | índice único das três fontes (banco real, código, regras), gerado por `indice.py`                                                                                                                                                                                                                                                                                                 |

O que **não** é daqui (cada fato tem um dono): schema real → snapshot do banco (`docs/contexto/supabase/`,
`scripts/supabase_snapshot/`); rotas/módulos/hooks/edges/grafo → `docs/contexto/codigo/`
(`scripts/ai-context/gerar.mjs`). Tudo na branch `contexto`, job a job em `.github/workflows/contexto-ia.yml`.

## Arquivos

- `generate.py` — gerador (stdlib, ~7 s neste repo). `--profile regras` escreve só 07/10/11 (+ `context.json`, `manifest.json`); `--schema-snapshot` é a pasta do snapshot do banco que o 07/10 citam como fonte do schema real (no perfil `full`, faz o 06 apontar para ela). `--out` é relativo ao `--repo` (default `docs/contexto/regras`). `--check` não escreve nada: exit 0 = saída atual, 1 = desatualizada ou com arquivo faltando, 2 = erro de uso (`--repo` inexistente, `--out` que é arquivo). Sem `--no-pointer` ele edita `CLAUDE.md`/`AGENTS.md` — neste repo use sempre `--no-pointer`.
- `indice.py` — monta `00-INDEX.md` lendo o `manifest.json` de cada fonte (`--fonte "NOME=CAMINHO[@BRANCH]"`); fonte que vive em outra branch entra como "como ler" (git show / raw), sem inventar conteúdo. Exit 2 sem `--fonte`, com fonte malformada ou com nome repetido.
- `publish.sh` — publicação standalone (branch derivada / PR / push); **neste repo não é usado**: o job `publicar` do `contexto-ia.yml` monta a branch `contexto` e o índice. Default `MODE=branch` → publica `docs/contexto/regras` na branch `contexto` (force-push com lease, 3 tentativas), preservando `KEEP_DIRS`. Nunca escreve em `main`/`master`/`develop` nem na branch padrão do remoto, não altera `git config` e devolve o checkout como estava. `DRY_RUN=1` mostra o que iria sem enviar. Variáveis e exit codes no cabeçalho do script.

O índice distingue `ok`, `parcial` (falha de coleta ou reaproveitamento), `não verificável` (manifest/relatório ilegível, sem data de geração legível ou com data no futuro), `desatualizado` e fonte ausente.
Código/regras com commit igual ao HEAD continuam atuais apesar da idade da coleta; banco real e fontes sem commit confirmado seguem o limite de idade configurado.
As idades ("4 min atrás") contam até a data do próprio índice (cabeçalho), não até a hora da leitura; até 5 min de adiantamento entre runners vira "0 min atrás".

## Fontes SQL

Arquivos `.sql` em diretórios chamados exatamente `_foreign` ou `_superseded` são históricos:
continuam no inventário de arquivos, mas não entram na reconstrução do schema nem na extração
de regras do código. Outras pastas de migrations e fontes SQL, Prisma e tipos gerados mantêm
a seleção existente. A reconstrução é estática; só o snapshot descreve o banco em produção.

O histórico é reproduzido na ordem dos arquivos, como o Postgres faria: `CREATE TABLE IF NOT EXISTS`
em tabela que já existe é no-op; `DROP TABLE` leva políticas, triggers e índices; `ALTER TABLE` com
várias ações aplica todas; DDL literal dentro de `DO $$ … $$` (direto ou em `EXECUTE '...'`) conta;
`ALTER FUNCTION … SET search_path` e `DROP [MATERIALIZED] VIEW` são aplicados. **Limite conhecido:**
DDL montado em runtime (`EXECUTE format(...)`, laços sobre `pg_tables`) não é resolvível — neste repo
isso deixa de fora as políticas/triggers criados em laço (ex.: `audit_log_trigger`, políticas das
partições `*_y2026mNN`) e mantém listadas as que só um `DROP` dinâmico remove. Confirme no banco real.

## O que não é regra do app

Fixture de teste e script de `scripts/` não geram "inconsistência código × schema"; as mensagens de erro
deles vão para o fim da seção I (a tabela corta em 300 linhas). Coluna `estado` com cidade/CEP na tabela
(ou `origem`/`destino` no nome) é UF, não status; partição filha (`x_y2026m01`) não repete a coluna de
status da tabela-mãe. Constante só entra em H.1 com o valor inteiro (`60 * 1000`, nunca só `60`).

## Regras humanas

`docs/contexto/regras/manual/*.md` (exceto README e TEMPLATE) entram na seção A do 07 com prioridade
máxima e nunca são sobrescritos. Comece copiando `TEMPLATE-regras-de-negocio.md`
para `regras.md`. Editar `manual/` em main dispara o workflow.

## Rodar local

```bash
python3 scripts/regras_negocio/generate.py --repo . --out docs/contexto/regras --profile regras --schema-snapshot docs/contexto/supabase --no-pointer
python3 scripts/regras_negocio/indice.py --repo . --out docs/contexto/00-INDEX.md \
  --fonte "banco real=docs/contexto/supabase" --fonte "código=docs/contexto/codigo" --fonte "regras de negócio=docs/contexto/regras"
```

Ler o resultado: `git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md`.

## Testes de regressão

```sh
python3 scripts/regras_negocio/test_generate.py   # gerador: SQL, extração, CLI (33 testes)
python3 scripts/regras_negocio/test_indice.py     # índice único (18 testes)
python3 scripts/regras_negocio/test_publish.py    # publish.sh contra repositórios git locais (27 testes)
# ou tudo de uma vez, se houver pytest: uv run --with pytest python -m pytest -q scripts/regras_negocio
```

Rodam offline, em segundos, só com stdlib + git + bash; fixtures em diretório temporário. Nenhum teste
acessa banco, remoto git real ou API de LLM (`--llm` nunca é exercitado). O workflow ainda não roda
essas suítes — hoje só rodando à mão.

Origem: portado de `adm01-debug/Zapp_Web_V2` (`scripts/regras_negocio/`) e depois corrigido aqui
(parser de migrations, defaults/caminhos deste repo, índice e `publish.sh`) — já não é cópia idêntica.
