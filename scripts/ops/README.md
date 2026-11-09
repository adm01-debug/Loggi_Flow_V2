# scripts/ops — operação

| Arquivo                    | O que é                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `backup_origem.sh`         | backup diário (`pg_dump -Fc`) do banco de **origem** (Lovable Cloud `hgicfqjayrjurivtygqf`, somente leitura) até o descomissionamento |
| `set_missing_secrets.sh`   | secrets de edge function ainda por preencher — ver o cabeçalho do arquivo                                                             |
| `pos_deploy_functions.sql` | runbook pós-deploy das edge functions — ver o cabeçalho do arquivo                                                                    |

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
