# Loggi_Flow_V2 — mapa de integração (12/11/2026)

Referência: `origin/main` em `0c0d48cc62`. Comparação por conteúdo, arquivo a arquivo. Só leitura: nada foi mesclado.

| Situação     |  Peças | Significado                                                 |
| ------------ | -----: | ----------------------------------------------------------- |
| na main      |      7 | já mesclada                                                 |
| incorporada  |      4 | conteúdo já está na main (squash/cherry-pick) — pode apagar |
| superada     |     12 | a main já tem versão mais nova dos arquivos — pode apagar   |
| **pendente** | **19** | tem conteúdo que nunca entrou na main                       |

Das pendentes: **19 trabalhos únicos** (depois de juntar 0 duplicadas e 0 contidas em outra). PRs abertos: 1.

## Trabalhos pendentes únicos (ordem sugerida: com PR primeiro, depois menores)

|   # | Peça                                                              | Onde         | PR   | Arquivos inéditos | Data       | Último commit                                                                           |
| --: | ----------------------------------------------------------------- | ------------ | ---- | ----------------: | ---------- | --------------------------------------------------------------------------------------- |
|   1 | `claude/fix-secrets-yes-ci-261112-1313`                           | github       | #140 |                 5 | 2026-11-12 | chore: baseline reflete can_approve_pull_request_reviews=true                           |
|   2 | `claude/fix-content-hash-20261107-1223`                           | github       | —    |                 1 | 2026-11-07 | fix: content_hash.sql quebrava com to_jsonb(t) inexistente e CROSS JOIN LATERAL LIMIT 0 |
|   3 | `claude/fix-manifest-summary-pgcron-20261107-1226`                | github       | —    |                 1 | 2026-11-07 | fix: manifest_summary.sql quebrava sem pg_cron instalado                                |
|   4 | `claude/fix-set-missing-secrets-guard-20261107-1424`              | github       | —    |                 1 | 2026-11-07 | fix: nao expoe o valor do segredo na mensagem do guard de placeholder                   |
|   5 | `claude/infra-gitattributes-eol-20261107-1228`                    | github       | —    |                 1 | 2026-11-07 | infra: adiciona .gitattributes com eol=lf para scripts e configs                        |
|   6 | `Github_Copilotchore-runbook-pos-deploy-functions-20261`          | github+local | —    |                 1 | 2026-11-08 | fix: corrige healthcheck JWT e logs no runbook pós-deploy                               |
|   7 | `claude_04/elegant-hopper-ffoje5`                                 | github       | —    |                 1 | 2026-11-08 | docs(agentes): atualiza contagem de required checks para 9                              |
|   8 | `dependabot/github_actions/github/codeql-action/init-4.39.3`      | github       | —    |                 1 | 2026-11-11 | chore(deps): bump github/codeql-action/init from 4.39.1 to 4.39.3                       |
|   9 | `dependabot/github_actions/peter-evans/create-pull-request-8.1.2` | github       | —    |                 1 | 2026-11-11 | chore(deps): bump peter-evans/create-pull-request from 8.1.1 to 8.1.2                   |
|  10 | `claude/seguranca-workflows-261112`                               | local        | —    |                 1 | 2026-11-12 | ci(seguranca): dependency review nos PRs                                                |
|  11 | `dependabot/npm_and_yarn/eslint-plugin-react-refresh-0.5.6`       | github       | —    |                 2 | 2026-09-16 | chore(deps-dev): bump eslint-plugin-react-refresh from 0.5.5 to 0.5.6                   |
|  12 | `dependabot/npm_and_yarn/radix-ui/react-checkbox-1.3.11`          | github       | —    |                 2 | 2026-09-16 | chore(deps): bump @radix-ui/react-checkbox from 1.3.2 to 1.3.11                         |
|  13 | `dependabot/npm_and_yarn/radix-ui/react-toggle-group-1.1.19`      | github       | —    |                 2 | 2026-09-16 | chore(deps): bump @radix-ui/react-toggle-group from 1.1.10 to 1.1.19                    |
|  14 | `dependabot/npm_and_yarn/types/node-26.5.1`                       | github       | —    |                 2 | 2026-09-16 | chore(deps-dev): bump @types/node from 26.4.0 to 26.5.1                                 |
|  15 | `dependabot/npm_and_yarn/zod-4.6.4`                               | github       | —    |                 2 | 2026-09-16 | chore(deps): bump zod from 4.5.4 to 4.6.4                                               |
|  16 | `Github_Copilotfix-seed-database-hardening`                       | github+local | —    |                 2 | 2026-11-07 | fix: torna seed-database idempotente e alinhado ao schema real                          |
|  17 | `automation/types-sync`                                           | github       | —    |                 4 | 2026-11-12 | chore(db): sincronizar artefatos com o banco [auto]                                     |
|  18 | `claude/chore-manutencao-local-261110-0831`                       | local        | —    |                 7 | 2026-11-10 | fix(manutencao): alinha scripts ao lint e à formatação locais                           |
|  19 | `contexto`                                                        | github       | —    |                25 | 2026-11-12 | chore(contexto): 2 fonte(s) regerada(s) @ main 0c0d48c [skip ci]                        |

## Arquivos disputados (mais de um trabalho pendente mexe neles — risco de conflito)

| Arquivo                              | Trabalhos |
| ------------------------------------ | --------: |
| `package-lock.json`                  |         6 |
| `package.json`                       |         6 |
| `scripts/ops/set_missing_secrets.sh` |         2 |

## Podem ser apagadas sem perda (16)

Branches cujo conteúdo já está na main ou foi superado. Lista completa em `~/.cache/mapa-integracao/Loggi_Flow_V2.json`.

- `cutover-config` (superada, github)
- `claude/auditoria-tecnica-sistema-gs1hbc` (superada, github)
- `ecc-tools/Loggi_Flow_V2-1788403262363` (superada, github)
- `fix/lockfile-sync-esbuild` (superada, github)
- `fix/security-tests-timeout` (incorporada, github)
- `Github_Copilotfase4-banca-validators-node` (superada, local)
- `Github_Copilotfix-hardening-audit-manifest-20261107-15` (superada, local)
- `Github_Copilotfix-manifest-full-guard-261107-1430` (superada, local)
- `Github_Copilotfix-validate-csp-20261107-1500` (superada, local)
- `Github_Copilotrobustez-manifest-detail-manifest` (superada, local)
- `claude/feat-port-scripts-automacao-261108-1520` (superada, github)
- `claude/chore-manutencao-261110-1226-7e5db4a5` (incorporada, local)
- `claude/chore-manutencao-local-261110-0831` (incorporada, github)
- `claude/ci-workflows-scripts-261109-2339` (superada, github)
- `claude/fix-scripts-robustez-261109-2304` (superada, github)
- `claude/chore-manutencao-261110-1226-7e5db4a5-autor` (incorporada, local)
