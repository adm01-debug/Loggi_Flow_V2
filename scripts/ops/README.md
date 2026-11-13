# scripts/ops — operação

> **Quirk conhecido — `RESEND_API_KEY`:** o endpoint `GET /v1/projects/{ref}/secrets` da Management API tem cache/CDN e pode devolver o hash antigo mesmo depois de um `secrets set` aceito (201). **Não use o GET para validar segredo** aqui; a fonte de verdade é o comportamento da function — envio real de e-mail gera `resend_id` novo no Resend. (Visto em 2026-11-13: hash antigo `e7b8df57...` no GET, porém envio real `01a1d643-...` com a chave nova.)

| Arquivo                    | O que é                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `backup_origem.sh`         | backup diário (`pg_dump -Fc`) do banco de **origem** (Lovable Cloud `hgicfqjayrjurivtygqf`, somente leitura) até o descomissionamento |
| `set_missing_secrets.sh`   | catálogo dos nomes de secret que as edge functions leem + envio dos que faltam (dry-run por padrão)                                   |
| `pos_deploy_functions.sql` | runbook pós-deploy das 5 functions fechadas (só comentários; nada executa)                                                            |

## backup_origem.sh

Roda todo dia no container `claude-code` da VPS, com `/bin/sh`. Só lê a origem. Grava
`origem-AAAA-MM-DD.dump` + `MANIFEST.txt` (sha256; conferir com `sha256sum -c --ignore-missing MANIFEST.txt` —
o MANIFEST é histórico e guarda também as linhas dos dumps que a rotação já apagou) e rotaciona:
ficam os 7 dumps mais recentes e os 4 domingos mais recentes; nunca apaga o dump do dia nem arquivo fora
do padrão `origem-AAAA-MM-DD.dump`.

O dump é escrito em `origem-AAAA-MM-DD.dump.partial` e só ganha o nome final se o `pg_dump` terminar bem:
falha no meio sai com exit 1, não deixa dump truncado, não mexe no `MANIFEST.txt` e não rotaciona.

Segredo: a senha vive só no pgpass (`host:port:db:user:senha`, modo `0600`), fora do repo — nunca em
argumento, env ou log.

| Env                 | Default (VPS)                             | Para quê                         |
| ------------------- | ----------------------------------------- | -------------------------------- |
| `BACKUP_PGPASSFILE` | `/workspace/.secrets/loggi-origem.pgpass` | pgpass da origem                 |
| `BACKUP_DIR`        | `/workspace/backups/loggi-flow-v2`        | pasta de destino                 |
| `PG_DUMP`           | `/usr/lib/postgresql/17/bin/pg_dump`      | binário (versão ≥ a do servidor) |

Teste (offline; `pg_dump` e `date` são stubs, nunca conecta em banco):

```sh
node --test scripts/ops/backup_origem.unit.mjs
```

## set_missing_secrets.sh

Os valores **nunca** ficam no script: vêm de um arquivo `NOME=valor` fora do git (`--env-file`) ou, sem ele,
das variáveis de ambiente de mesmo nome. Sem `--apply` nada é enviado.

```sh
sh scripts/ops/set_missing_secrets.sh --modelo > ~/loggi-secrets.env    # gera o arquivo para preencher
sh scripts/ops/set_missing_secrets.sh --env-file ~/loggi-secrets.env    # mostra o que seria enviado (só nomes)
export SUPABASE_ACCESS_TOKEN=sbp_... && sh scripts/ops/set_missing_secrets.sh --env-file ~/loggi-secrets.env --apply
sh scripts/ops/set_missing_secrets.sh --list                            # só os nomes esperados
```

Só vai para a CLI o que tem valor real (vazio, `<entre_sinais>` ou contendo "placeholder" fica de fora e é
listado); nome desconhecido no arquivo aborta; arquivo dentro de repositório git e não ignorado é recusado;
`FIELD_ENCRYPTION_KEY` com menos de 32 caracteres é recusada. Uma única chamada `supabase secrets set` no
projeto `jvfhclubfpxrtrrazrgr`. Saída: 0 ok, 1 falha, 2 uso incorreto. Secret usado: `SUPABASE_ACCESS_TOKEN`
(só com `--apply`).

## pos_deploy_functions.sql

Passos: conferir o vault sem mostrar valor → copiar `internal_fn_secret` do vault para a env
`INTERNAL_FN_SECRET` (via arquivo temporário + `set_missing_secrets.sh`) → publicar pelo workflow
`deploy-functions.yml` → validar com request real. Mudou a auth de uma das 5 functions? Atualize o runbook:
o teste confere cada afirmação contra `supabase/functions/` e `supabase/config.toml`.

Testes (offline; `supabase`, `psql` e o servidor HTTP são falsos):

```sh
node --test scripts/ops/set-missing-secrets.unit.mjs scripts/ops/pos-deploy-functions.unit.mjs
```
