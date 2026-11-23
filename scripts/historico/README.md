# `scripts/historico/`

SQL ja aplicado, mantido como registro. **Nada aqui se executa.**

Os dois arquivos desta pasta sao a memoria de qual DDL rodou na origem do cutover
(`hgicfqjayrjurivtygqf`), que hoje e somente leitura. Eles trazem cabecalho
"HISTORICO - NAO REEXECUTAR" e ficam aqui, e nao na raiz de `scripts/`, para que
quem liste a pasta nao os confunda com utilitario para rodar.

Nao apague: `scripts/audit/sql.unit.mjs` roda o conteudo dos dois num Postgres
descartavel e verifica que permanecem replay-safe (`BEGIN/COMMIT` e
`CREATE OR REPLACE TRIGGER`).

- `cleanup_triggers_source.sql` - fonte: `scripts/ops/backup_origem.sh`
- `origem_remediacao_2026-08-31.sql` - remediacao aplicada em 31/08/2026
