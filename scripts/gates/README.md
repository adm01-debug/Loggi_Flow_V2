# scripts/gates — testes dos gates da raiz de `scripts/`

Os gates antigos ficam soltos na raiz de `scripts/` por histórico; os testes deles moram aqui para não
somar mais arquivo solto lá.

| Teste                              | Gate                                  | Quem roda o gate                                                          |
| ---------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| `validate-csp.unit.mjs`            | `scripts/validate-csp.mjs`            | `npm run validate:csp`, `prebuild` (todo build do Vercel), `ci-nexus.yml` |
| `validate-no-console.unit.mjs`     | `scripts/validate-no-console.mjs`     | `npm run validate:no-console`, `ci-nexus.yml`                             |
| `audit-gate.unit.mjs`              | `scripts/audit-gate.mjs`              | `npm run security-scan`, `ci.yml`, `security.yml`, `ci-nexus.yml`         |
| `check-warning-budget.unit.mjs`    | `scripts/check-warning-budget.mjs`    | `npm run lint:budget`, `ci.yml`                                           |
| `ratchet-warning-budget.unit.mjs`  | `scripts/ratchet-warning-budget.mjs`  | `npm run lint:budget:ratchet` (manual)                                    |
| `generate-quality-report.unit.mjs` | `scripts/generate-quality-report.mjs` | `npm run quality:report` (manual)                                         |

## Como rodar

```sh
node --test scripts/gates/*.unit.mjs
```

Offline, sem credencial, alguns segundos. Não usa secret nenhum.

## Como funcionam

Cada gate resolve a raiz do repo pelo próprio caminho (`scripts/..`). O teste copia o gate para
`<tmp>/scripts/`, monta um repo sintético em `<tmp>` e roda o gate como subprocesso — o repo real não é
lido nem escrito (as exceções são dois testes de fumaça que rodam `validate-csp` e `validate-no-console`
no repo de verdade, só leitura). `npm` e `npx` viram stubs de shell em `<tmp>/bin` (`helpers.mjs`): o
teste dita a saída e o exit code do `npm audit`, do ESLint e do `tsc`. Por isso precisam de `/bin/sh`
(Linux/macOS).

Mudou um gate → rode o teste dele e acrescente o caso que faltava. Gate que passa com entrada quebrada
(arquivo ausente, JSON inválido, ferramenta que não rodou) é bug: o caso entra aqui como "falha fechado".
