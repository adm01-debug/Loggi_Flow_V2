# Auditoria Técnica Exaustiva — Loggi Flow V2 — 2026-09-02

> **Metodologia:** medir, não confiar. Toda afirmação cita `arquivo:linha`, objeto de banco, saída de comando
> executado nesta sessão ou resposta HTTP real. Auditoria executada sobre o commit `e671b67` (branch `main`)
> e sobre o banco **destino** `jvfhclubfpxrtrrazrgr` (Supabase Cloud, PG 17.6) via MCP.
> Protocolo: 22 dimensões (as 20 detalhadas no prompt operacional), pesos ×3/×2/×1.
>
> Auditorias anteriores usadas como hipótese (e re-testadas, nunca copiadas):
> [`ESTADO_ATUAL.md`](../../ESTADO_ATUAL.md) (16/08) e
> [`docs/audit/2026-08-31_auditoria_pos_remediacao.md`](./2026-08-31_auditoria_pos_remediacao.md).

---

## ⚠️ ALERTA PRÉVIO — risco de cutover (verificar antes de qualquer outra coisa)

O commit `e671b67` ("cutover-config: apontar app, config.toml, testes e openapi para jvfhclubfpxrtrrazrgr —
**NÃO mesclar antes da etapa 86**") **já está mesclado na `main`** (PR #36). Medido no destino agora:

- Tabelas de negócio **vazias**: `coletas`, `entregas`, `clientes`, `fornecedores`, `cotacoes_multicanal` = 0 linhas.
- Jobs de migração incremental **ainda rodando**: `migration-delta-pull`/`migration-delta-load` a cada 6h (`cron.job`).
- `.env` da `main` aponta o app para o destino.

Se o Lovable redeploya a `main` automaticamente, **produção pode estar servindo um banco sem dados de negócio**.
Não é conclusivo daqui (deploy Lovable não é auditável por MCP) — mas é a primeira coisa a confirmar.

---

## 1. INVENTÁRIO DO SISTEMA (Fase 0)

| Item            | Valor medido                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repositório     | `adm01-debug/loggi_flow_v2`, branch `main` @ `e671b67`                                                                                                                                                       |
| Stack           | React 18.3 + TypeScript 5.8 + Vite 5 + Tailwind/shadcn · Supabase (PG 17.6, Auth, Realtime, Storage, 43 Edge Functions Deno) · PWA                                                                           |
| Integrações     | Rodonaves, Lalamove, Melhor Envio, Total Express (via functions) · Bitrix24 · Evolution API (WhatsApp) · Resend · Mapbox · Gemini (IA) · Upstash Redis                                                       |
| Ambientes       | Produção (Lovable → Supabase). **Sem staging.** Cutover origem `hgicfqjayrjurivtygqf` → destino `jvfhclubfpxrtrrazrgr` em andamento                                                                          |
| Código          | 1.133 arquivos versionados · ~129k linhas TS/TSX (116k em `src/`) · 67 páginas · 62 rotas lazy (`src/App.tsx`) · 43 edge functions                                                                           |
| Banco (destino) | ~131 tabelas (100 base + partições mensais de `audit_logs` e `rastreamento_historico`) · 311 policies RLS em `public` · 530 índices · 47 triggers de `updated_at` · 28 jobs pg_cron · 66 MB · cache hit 100% |
| Migrations      | 243 arquivos em `supabase/migrations/` · 239 registradas no destino                                                                                                                                          |
| Testes          | 30 arquivos vitest (257 testes, **todos passando** em 14,3s nesta sessão) + ~34 testes Deno nas functions + 2 specs Playwright + testes de RLS                                                               |
| Último deploy   | Não auditável por MCP (Lovable auto-deploy on push). CI na `main` **vermelho** hoje (3 workflows `failure` às 13:37 de 02/09)                                                                                |

---

## 2. AS 20 DIMENSÕES

### 1. Arquitetura — **8/10** (peso ×2)

**Evidências:**

- Feature-based clara: `src/{components,hooks,pages,services,integrations,lib}` com subdomínios (`freight`, `gamification`, `rodonaves`…); `_shared/` das functions com `circuitBreaker`, `rateLimiter`, `idempotency`, `safeFetch`, `logger`, `webhookSignature` — reuso real.
- **14 ADRs** em `docs/adr/` (0001-stack a 0014-security-definer-rls-pattern) — raro em qualquer codebase.
- Camada de serviço com resiliência: `src/services/base/BaseService.ts` + `src/services/resilience/CircuitBreaker.ts`.
- 62 rotas com `React.lazy` (`src/App.tsx`) + `manualChunks` data-driven (`vite.config.ts:9-19`).
- `check-circular` (madge) no `package.json:27`.

**Gaps para 10:**

- God-pages: 18 arquivos >500 linhas, topo `src/pages/Envios.tsx` (1.240), `Transportadoras.tsx` (1.208), `Clientes.tsx` (1.101) — a regra `max-lines: 400` existe (`eslint.config.js:50`) mas como warning.
- Lógica de página misturando UI + fetch + regra em componentes gigantes.

**Ações:** extrair hooks/subcomponentes das 5 maiores páginas; promover `max-lines` a erro com ratchet.

### 2. Autenticação — **8/10** (peso ×3)

**Evidências:**

- Login com defesa em profundidade: `validate-login` com lockout exponencial por IP/24h + geo-blocking + `login_attempts`/`geo_blocked_attempts` (`supabase/functions/validate-login/index.ts:230-246`); `account_lockouts`, `known_devices` + `new-device-alert`; `check-password-breach` (HIBP); `PasswordStrengthIndicator`; `useSessionTimeout`.
- MFA WebAuthn provisionado (`webauthn_challenges`, `webauthn_credentials`).
- `secure-store` valida JWT via `getClaims` + rate limit 60/min antes de cifrar/decifrar PII (AES-GCM) — `supabase/functions/secure-store/index.ts:20-50`.
- Tokens: `localStorage` com escolha **documentada** em ADR (`docs/adr/0004-auth-storage-choice.md`).
- Bug zod@4 `.errors` das telas de auth (ESTADO_ATUAL §achado) **corrigido** — zero ocorrências de `ZodError.errors` no `src/` hoje.

**Gaps para 10:**

- `localStorage` para tokens = roubo via XSS possível (mitigado por CSP, mas CSP tem `unsafe-inline`).
- Config do GoTrue (expiração, leaked-password protection do painel) **não auditável** por MCP — confirmar no dashboard.

**Ações:** ativar proteções de senha no painel Supabase Auth; avaliar cookie storage quando sair do Lovable.

### 3. Autorização — **8/10** (peso ×3)

**Evidências:**

- **RLS habilitado em 100% das tabelas** de `public` (135/135 medidas via `pg_class.relrowsecurity`), 311 policies.
- Sem escalação de privilégio: `user_roles` só admin escreve (`has_role(auth.uid(),'admin')` em INSERT/UPDATE/DELETE), usuário só lê o próprio role. `has_role` é SECURITY DEFINER **com `search_path` fixo** — zero funções SECDEF sem `search_path` no banco inteiro (medido).
- `profiles`: SELECT próprio-ou-admin, UPDATE próprio. Escrita em `coletas`: INSERT autenticado, UPDATE/DELETE admin.
- Audit trail por trigger em tabelas críticas (24 tabelas com entradas em `audit_logs`), particionado por mês.
- `role_permissions` (30 linhas) + `permissions` = RBAC materializado em banco.

**Gaps para 10:**

- Modelo flat para leitura: 18 tabelas com `SELECT ... USING(true)` para `authenticated` — qualquer logado lê **todos** os `clientes`/`coletas`/`entregas`/`fornecedores` (PII de clientes sem granularidade por papel/campo).
- 5 tabelas legíveis por `public` (inclui **anon**): `freight_selection_rules`, `freight_integration_mappings`, `bio_sync_alert_rules`, `system_heartbeat`, `user_ranks` — regras de negócio de frete expostas sem login.
- Partição futura `audit_logs_y2027m07` com RLS on e **zero policy** (criada por `ensure_monthly_partition`, que não replica policies).
- Teste de RLS **viciado**: `tests/security/rls-access.spec.ts:12` usa anon key do projeto **antigo** (`ref: hgicfqjayrjurivtygqf` no payload do JWT) contra a URL do novo → tudo responde 401 e o teste passa sem testar nada.

**Ações:** trocar a anon key do teste; mover as 5 policies `public`→`authenticated`; corrigir `ensure_monthly_partition` para criar policies; avaliar policy por papel nas tabelas com PII.

### 4. Banco de Dados — **9/10** (peso ×2)

**Evidências:**

- Zero tabelas sem PK; zero `timestamp` sem timezone; dinheiro em `NUMERIC` (únicos floats: lat/lng/radius de `risk_zones` e métricas de ms — aceitáveis).
- Particionamento mensal de `audit_logs` e `rastreamento_historico` com `ensure_future_partitions` mensal e retenção (`drop_old_partitions`, 18 meses) via pg_cron.
- 530 índices com governança ativa: `auto_revert_ineffective_indexes` diário, `snapshot_query_baseline`, `reindex_hot_indexes` semanal, `index_proposals` com baseline/pós-aplicação.
- `pg_stat_statements` limpo: nenhuma query de aplicação lenta (as top são introspecção do próprio MCP/dashboard); cache hit 100%.
- Paridade origem↔destino auditada objeto a objeto (3.449 objetos) em `docs/audit/2026-08-31_auditoria_pos_remediacao.md` — policies 320/320 idênticas.
- `seed.sql` presente; `docs/data/dicionario.md` (dicionário de dados).

**Gaps para 10:**

- **Drift de registro:** 4 migrations do repo fora de `schema_migrations` no destino: `20240822_gamification_system` (legada) e o pacote de remediação `20260831130200` (drop do audit-trigger de `rate_limit_logs` — o trigger já não existe no destino, só falta registrar), `20260901000000_cron_jobs_canonical`, `20260901000001_remediacao_destino` (idempotentes).
- 4 FKs sem índice de cobertura: `index_proposals.proposed_by/applied_by`, `remediation_actions.applied_by`, `scheduled_reports.user_id` (baixo tráfego — menor).
- 50 de 87 FKs com `ON DELETE NO ACTION` implícito (não dá para distinguir escolha de omissão).
- Migrations sem `down` (rollback de schema é manual).

**Ações:** aplicar/registrar as 3 migrations idempotentes no destino; criar os 4 índices de FK.

### 5. CI/CD — **2/10** (peso ×1)

**Evidências (tudo reproduzido nesta sessão):**

- **`npm ci`/`npm install` falha na raiz** — ERESOLVE: `eslint@^10.9.1` (`package.json:129`) × `eslint-plugin-react-hooks@5.2.0` (peer `eslint ≤9`) e `typescript-eslint@8.38` (peer `eslint ≤9`). Todo job de CI morre na instalação.
- **Lint crasha** mesmo instalado com `--legacy-peer-deps`: `TypeError: Class extends value undefined` em `typescript-eslint/.../FlatESLint.js` (eslint 10 × typescript-eslint 8).
- **Typecheck: 9 erros** — `src/components/ui/resizable.tsx` (×6, `PanelResizeHandle` removido no react-resizable-panels 2→4), `src/components/ui/calendar.tsx` (×2) e `src/components/common/DateRangePicker.tsx` (×1, `initialFocus` removido no react-day-picker 8→10). Majors mesclados sem CI verde.
- **3 workflows `failure` na `main` hoje** (CI/CD Pipeline, Security Scan, CI Quality Gate Nexus — 02/09 13:37, via API).
- `npm audit --audit-level=high` reprova: **32 vulnerabilidades (4 críticas, 18 high)** — outra fonte de vermelho.
- Gate de bundle irreal: `ci.yml:100-105` falha se `du -sk dist/assets > 512` KB; build real = **7.744 KB** (passa nunca).
- Gate de cobertura **comentado** (`ci.yml:71-74`, só `echo`).
- Job `generate-audit-pdf` roda `md-to-pdf audit_report.md` — **arquivo não existe** no repo (e o README linka para ele).
- **`main` sem branch protection** (API retorna 404 "Branch not protected") — Dependabot com auto-merge implícito? Não: os majors foram mesclados manualmente, mas nada impede push direto.
- Pipeline bem desenhado no papel: lint+typecheck+warning-budget+testes+gitleaks+CSP guard+no-console+RLS tests+Deno smoke (`ci.yml`, `ci-nexus.yml`, `security.yml`) — o desenho vale pontos, a execução está morta desde ≥20/05 (ESTADO_ATUAL: 0 verdes em 120 execuções).

**Ações:** ver Top 10 (#1, #3, #5, #6, #10).

### 6. Data Integrity — **8/10** (peso ×3)

**Evidências:**

- Idempotência nos 4 webhooks (`carrier-webhook-receiver`, `nexus-webhook-receiver`, `lalamove-webhook`, `rodonaves-webhook` usam `_shared/idempotency.ts`) + tabelas `idempotency_keys` e `webhook_events_processed`.
- FKs com `notifications.user_id`/`scheduled_reports.user_id → auth.users` (mais estritas que a origem); NOT NULLs de remediação aplicados (`notifications`, `comments`, `fretes_internos` — migration `20260901000001`).
- Optimistic locking provisionado: `entity_versions` (migration própria) — uso no frontend não confirmado (gap).
- Audit log imutável por partição com retenção 18 meses; enum `notification_type` tipado.
- Encoding UTF-8 ponta a ponta; `pgcrypto` + vault para segredos.

**Gaps para 10:**

- `entity_versions` sem consumo visível no `src/` → conflitos de concorrência resolvidos por last-write-wins nas telas.
- Transações multi-tabela dependem de RPCs pontuais; não há padrão documentado de transação no frontend service layer.
- Integridade do **cutover** ainda em curso (delta jobs 6/6h) — dado de negócio 0 linhas no destino (ver Alerta).

**Ações:** ligar `entity_versions` nos updates de `coletas`/`entregas`; documentar padrão de RPC transacional.

### 7. Documentação — **9/10** (peso ×1)

**Evidências:** 14 ADRs; `SRE_HANDBOOK.md`; `SLO.md`; `RUNBOOK_BACKUP.md`; `RUNBOOK_DB_PERFORMANCE.md`; `DISASTER_RECOVERY.md`; `INCIDENT_RESPONSE.md`; `POSTMORTEM_TEMPLATE.md`; `LGPD_COMPLIANCE.md`; `ONBOARDING.md`; `docs/api/openapi.yaml`; dicionário de dados; `ESTADO_ATUAL(_EVIDENCIAS).md` com metodologia de evidência; `AGENTS.md` para agentes; `CONTRIBUTING.md`; auditoria de migração objeto a objeto.

**Gaps para 10:** `CHANGELOG.md` parado em 1.0.0 (21/12/2024); **LICENSE ausente** (README declara MIT); README linka `audit_report.md`/`.pdf` inexistentes; `TEMPLATE_STRUCTURE.md`/`DOCUMENTATION.md` parcialmente aspiracionais.

**Ações:** remover/corrigir links quebrados do README; adicionar LICENSE; retomar CHANGELOG (release-please resolve de graça).

### 8. Infraestrutura / DevOps — **6/10** (peso ×1)

**Evidências:** Supabase Cloud gerenciado (TLS, backups de plataforma); segredos de cron no **Vault** (`vault.decrypted_secrets` — nenhum segredo hardcoded em job); secrets de functions via env do painel; `scripts/ops/backup_origem.sh` + `set_missing_secrets.sh`; Dependabot npm+actions semanal; storage com 2 buckets **privados**.

**Gaps para 10:** sem staging (deploy é direto em produção via Lovable); IaC parcial (`config.toml` cobre functions; auth/storage config fora de versão); restore de backup **nunca testado** (RUNBOOK existe, execução não evidenciada); DR não ensaiado; sem uptime monitor externo evidenciado.

**Ações:** criar projeto staging apontado por branch `develop`; testar restore PITR 1×/trimestre e registrar no runbook.

### 9. Logging / Monitoring — **7/10** (peso ×1)

**Evidências:** logger estruturado nas functions (`_shared/logger.ts`) + gate `validate:no-console` no CI; `security_events`, `error_events`, `telemetry_logs`, `rate_limit_logs` com retenção via cron (90/30 dias); `system_heartbeat` a cada 1min; `db_health_snapshots` horário + score + `db-health-weekly-report`; `alert_slow_queries(500ms)` diário; `rte_gateway_health` a cada 15min (18k linhas).

**Gaps para 10:** **Sentry não inicializado** — `@sentry/react` instalado e CSP libera `sentry-cdn`/`sentry.io`, mas não existe `Sentry.init` em `src/` (erro de produção no front morre no `ErrorBoundary` sem telemetria externa); sem uptime externo; 2 `console.log` residuais no `src/`.

**Ações:** inicializar Sentry no `main.tsx` (DSN via env) ou remover a dependência e o CSP; plugar Better Stack/UptimeRobot no `/functions/v1/health`.

### 10. Observabilidade — **7/10** (peso ×1)

**Evidências:** SLOs definidos e **computados** (`SLO.md`, `db_slo_daily`, `rte_slo_daily_snapshots`, `rte_slo_targets`); DORA metrics UI (`src/components/admin/DORAMetrics.tsx`); baseline de queries + detecção de regressão 15/15min (`db-regression-monitor`); contract tests logados (`contract_test_logs`, 125 linhas); 19 feature flags em banco; runbooks vinculados (SRE_HANDBOOK); heartbeat e health-check functions.

**Gaps para 10:** sem tracing distribuído (front → function → DB → carrier); sem error tracking de front (Sentry, acima); métricas RED por endpoint só para RTE gateway, não para as demais integrações.

**Ações:** correlacionar `requestId` nas functions restantes (o `logger` já suporta meta); dashboards RED por function a partir de `telemetry_logs`.

### 11. Lógica de Negócio — **7/10** (peso ×1)

**Evidências:** regras versionadas em banco e configuráveis (`business_rules`, `business_rules_config` 24 linhas, `freight_selection_rules`, `rule_execution_logs`) — nada hardcoded; motor de seleção de transportadora (`smart-carrier-selection` com JWT); cálculos financeiros em `NUMERIC` + `decimal.js` no front; datas com `date-fns-tz`; edge cases testados (`formatters.parse.test.ts`, `conciliacaoImport.test.ts`).

**Gaps para 10:** state machines de `coletas`/`entregas` implícitas (status como string validada, sem tabela de transição); parte das regras de frete duplicada entre front (`ConfiguracoesFrete.tsx`, 1.070 linhas) e functions.

**Ações:** função SQL `validate_status_transition` + CHECK/trigger nas tabelas de ciclo de vida; extrair o cálculo de frete do componente para `src/lib`.

### 12. Manutenibilidade — **7/10** (peso ×1)

**Evidências:** warning budget **0/0/0** com ratchet (`.warning-budget.json`, `scripts/ratchet-warning-budget.mjs`); `unused-imports` como erro; complexidade cognitiva 15 e `max-lines` 400 como warnings (`eslint.config.js:47-50`); 18 usos de `any` em 129k linhas; 2 TODOs; madge para ciclos; débito técnico rastreado (`MELHORIAS.md`, `PLANO_MELHORIAS_2026.md`).

**Gaps para 10:** 18 arquivos >500 linhas; Dependabot atualiza mas **sem CI verde para segurar majors** (foi exatamente isso que quebrou eslint/resizable/day-picker); `tsconfig.app.json` morto com `strict:false` confunde (o typecheck usa o root `tsconfig.json` strict).

**Ações:** deletar `tsconfig.app.json`/`tsconfig.node.json` se não referenciados; política "major = PR manual com checklist de migração".

### 13. Operacionalidade — **7/10** (peso ×1)

**Evidências:** 19 feature flags em banco; circuit breaker por integração (`getCircuitBreaker('melhor-envio',...)`, `withCircuitBreaker`) = desligamento individual de integrações; degradação graciosa (fallback de cotação, `normalize-freight-response`); runbooks de incidente/backup/DB; `nexus-auto-healing` + `remediation_actions`/`mitigation_actions` auditadas; partições e retenções autônomas.

**Gaps para 10:** rollback de app depende do Lovable (não documentado passo a passo); migrations sem `down`; procedimento de hotfix não escrito; deploy irreproduzível fora do Lovable.

**Ações:** runbook "rollback em 5 minutos" (revert commit + redeploy Lovable + revert de migration modelo); testar 1×.

### 14. Performance — **8/10** (peso ×1)

**Evidências:** build de produção OK em 40,7s (rodado nesta sessão); 62 rotas lazy + `manualChunks` por vendor; PWA com precache (253 entries); `@tanstack/react-virtual` para listas; paginação server-side (`usePagination` + `.range()`); debounce em buscas; Redis (Upstash) cacheando cotações nas functions; DB: zero N+1 evidente, cache hit 100%, índices governados, views de dashboard materializadas na prática via `refresh_dashboard_views` 5/5min.

**Gaps para 10:** `vendor-mapbox` = 497KB **gzip** (estoura o `.size-limit.json` de 250KB — ferramenta configurada mas não plugada no CI); chunks >700KB minificados (aviso do Vite); Web Vitals não coletados (sem Sentry/analytics).

**Ações:** carregar mapbox só nas rotas de mapa via dynamic import do componente (já é lazy por página — validar se algum widget de dashboard puxa o chunk no load); plugar `size-limit` no CI com limites por chunk realistas.

### 15. Qualidade de Código — **7/10** (peso ×1)

**Evidências:** husky + lint-staged + commitlint (conventional commits); eslint flat config com sonarjs; zero `console.log` fora de 2 ocorrências; sem secrets no código (gitleaks no CI; `.env` commitado contém apenas anon key — pública por design — e token Mapbox de exemplo do Lovable); 257 testes verdes.

**Gaps para 10:** **lint não executa hoje** (crash eslint 10 × typescript-eslint 8); **`prettier` não está em `devDependencies`** mas `.lintstagedrc.json:3` o invoca — o pre-commit só funciona onde existe um prettier global (nesta sessão: 3.8.1 do sistema), ou seja, formatação não reproduzível e hook quebrado em máquina limpa; `.env` commitado é mau hábito mesmo sem segredo (o `.gitignore` deveria cobri-lo — `.env.example` já existe).

**Ações:** ver Top 10 #1; adicionar `prettier` aos devDeps; tirar `.env` do versionamento.

### 16. Segurança — **5/10** (peso ×3)

**Positivos (fortes):**

- RLS universal + policies auditadas com paridade; HMAC **fail-closed com comparação constant-time** nos 4 webhooks (`_shared/webhookSignature.ts`); vault para segredos de cron; gitleaks; geo-blocking + IP allowlist + lockout; LGPD operacional (`lgpd-erase-user` com JWT, `secure-store` AES-GCM p/ PII, `LGPD_COMPLIANCE.md`); CSP presente; buckets privados; `X-Frame-Options` via CSP `default-src 'self'`.

**Críticos (medidos, funções vivas no destino — HTTP 200 no ping):**

1. **`resend-email` ABERTA** — `verify_jwt=false` (`supabase/config.toml:34-35`) e zero verificação no código (56 linhas): qualquer pessoa na internet envia e-mail arbitrário (`to`, `subject`, `html`, `from`) pela conta Resend. Relay de phishing pronto.
2. **`evolution-whatsapp` ABERTA** — `config.toml:31-32`, sem auth: `send_text` para qualquer telefone com qualquer mensagem pela instância WhatsApp da empresa. Risco de banimento do número + spam.
3. **`melhor-envio-api` ABERTA** — `config.toml:49-50`, sem auth de chamador: proxy público autenticado com o token da empresa; o chamador controla `useSandbox:false` (ações de produção, inserção no carrinho/compra conforme actions expostas).
4. **`log-security-event` ABERTA** — `config.toml:37-38`: injeção de eventos falsos em `security_events` + disparo de e-mails de alerta via Resend (fadiga de alerta + spam).
5. `predict-delays-scheduled` aberta (`config.toml:12`) — qualquer um dispara o job de IA (custo Gemini/DoS leve).

- O comentário do `config.toml:18` ("auth via HMAC in-code") é **verdadeiro só para os 4 webhooks de carrier** — as 5 acima não têm HMAC nem JWT.
- **O repositório está PÚBLICO no GitHub** (`visibility: public` na API, medido em 02/09) enquanto `AGENTS.md:14` afirma "Visibilidade: privado". Todo o código interno — incluindo as functions sem auth, URLs do projeto e a lógica de negócio — está exposto e indexável; qualquer um encontra o endpoint aberto lendo o repo.
- **32 CVEs** (4 críticas: DOMPurify XSS via jspdf; jsPDF path traversal; 18 high) — `npm audit` desta sessão.
- CSP com `unsafe-inline`+`unsafe-eval` em `script-src` (`index.html:6`).
- Funções com `verify_jwt=true` aceitam o **anon key** como Bearer (comportamento padrão Supabase) — `rodonaves-api`, `lalamove-api`, `ai-logistics-assistant` etc. ficam invocáveis por qualquer portador da chave pública do bundle; o rate limit in-code (`check-rate-limit`) mitiga custo, não autoriza.

**Ações:** ver Top 10 #2 (fechar as 5 funções) e #5 (CVEs). Depois: exigir `auth.getUser()` + role nas functions de integração sensíveis; nonce no CSP quando sair do Lovable.

### 17. Testes — **6/10** (peso ×2)

**Evidências:** 257 testes / 30 arquivos vitest **passando** (14,3s, medido); ~34 `*_test.ts` Deno cobrindo as functions (smoke + secret-leak guards no `ci-nexus.yml`); thresholds de coverage 80% configurados (`vitest.config.ts:23-28`); fuzzing e carga presentes; e2e Playwright (2 specs) e fixtures (`scripts/seed-database.ts`).

**Gaps para 10:** testes de "integração"/"carga" são **simulações** (webhooks.spec = 2 testes em 4ms, stress = loop local — ESTADO_ATUAL já apontava "7 de 32 arquivos testam a si mesmos"); teste de RLS aponta o projeto novo com **chave do projeto antigo** (passa vazio — ver dimensão 3); cobertura real não medida há meses (CI morto; gate comentado); e2e não roda em CI.

**Ações:** corrigir a anon key do RLS spec; rodar `test:coverage` e ler o número real; transformar webhooks.spec em teste contra as functions reais de staging.

### 18. Tipagem / Type Safety — **7/10** (peso ×2)

**Evidências:** `strict: true` + `strictNullChecks` no `tsconfig.json` (o usado pelo `typecheck`); **18 `any`** em 129k linhas (excepcional); `no-explicit-any` como warn com budget 0; types do banco gerados (`src/integrations/supabase/types.ts`, 6.550 linhas); zod 4 em runtime nas bordas; schemas compartilhados (`src/integrations/shared/api-schemas.ts`, `functions/_shared/schemas`).

**Gaps para 10:** **9 erros de typecheck hoje** (majors de UI mesclados sem gate — ver CI/CD); `tsconfig.app.json` com `strict:false` (config morta que confunde); `supabase gen types` fora do pipeline (types.ts atualiza manualmente → risco de drift silencioso com o schema).

**Ações:** corrigir os 9 erros (API nova de `react-resizable-panels`/`react-day-picker`); job de CI que roda `gen types` e falha em diff.

### 19. Validação — **7/10** (peso ×2)

**Evidências:** zod dos dois lados (front `src/lib/validations.ts` + `@hookform/resolvers`; functions `_shared/validate.ts` + `contract-validator.ts` com `system_contract_schemas` versionados em banco); importers CSV/Excel com validação linha a linha e relatório de erros; limites e sanitização nos uploads (buckets privados); mensagens de erro por campo (pós-fix zod4).

**Gaps para 10:** validação de MIME por extensão nos importers (sem magic bytes); rate limit ausente nas funções abertas (dimensão 16); validação de transição de status não centralizada (dimensão 11).

**Ações:** magic bytes no `CSVImporter`/`ExcelImporter` (xlsx = zip `PK`); zod schema único para status transitions.

### 20. Operações (Processos) — **5/10** (peso ×1)

**Evidências:** CONTRIBUTING + conventional commits + commitlint; Dependabot semanal npm+actions; incident response + postmortem template + DR docs; backlog técnico visível (`PLANO_MELHORIAS_2026.md`).

**Gaps para 10:** **`main` sem branch protection** (push direto e merge com CI vermelho aconteceram — os majors quebrados provam); sem CODEOWNERS; sem PR template; 11 PRs do Dependabot abertos acumulando (incluindo **react-router-dom 6→7** e **coverage-v8 1→4**, majors que vão quebrar de novo se mesclados como os anteriores); processo de review inexistente (solo dev — mas o gate automatizado supre, quando verde).

**Ações:** ver Top 10 #6; fechar/agrupar os PRs de major com migração planejada; PR template com checklist de major-bump.

---

## 3. SCORECARD CONSOLIDADO

```
╔══════════════════════════════════╦═══════╦════════════════════════════════════════════════════╗
║ DIMENSÃO                         ║ NOTA  ║ GAP PRINCIPAL PARA 10/10                           ║
╠══════════════════════════════════╬═══════╬════════════════════════════════════════════════════╣
║ 1.  Arquitetura            (×2)  ║  8/10 ║ God-pages >1.000 linhas                            ║
║ 2.  Autenticação           (×3)  ║  8/10 ║ Tokens em localStorage; config GoTrue não auditada ║
║ 3.  Autorização            (×3)  ║  8/10 ║ Leitura flat p/ authenticated; 5 tabelas p/ anon;  ║
║                                  ║       ║ teste RLS com chave errada                         ║
║ 4.  Banco de Dados         (×2)  ║  9/10 ║ 3 migrations sem registro no destino               ║
║ 5.  CI/CD                  (×1)  ║  2/10 ║ npm ci quebrado → 100% vermelho desde ≥20/05       ║
║ 6.  Data Integrity         (×3)  ║  8/10 ║ entity_versions sem uso; cutover em curso          ║
║ 7.  Documentação           (×1)  ║  9/10 ║ CHANGELOG parado; LICENSE e audit_report ausentes  ║
║ 8.  Infraestrutura/DevOps  (×1)  ║  6/10 ║ Sem staging; restore nunca testado                 ║
║ 9.  Logging / Monitoring   (×1)  ║  7/10 ║ Sentry instalado mas nunca inicializado            ║
║ 10. Observabilidade        (×1)  ║  7/10 ║ Sem tracing cross-service                          ║
║ 11. Lógica de Negócio      (×1)  ║  7/10 ║ State machines implícitas                          ║
║ 12. Manutenibilidade       (×1)  ║  7/10 ║ Majors sem gate; tsconfig morto                    ║
║ 13. Operacionalidade       (×1)  ║  7/10 ║ Rollback não documentado/testado                   ║
║ 14. Performance            (×1)  ║  8/10 ║ vendor-mapbox 497KB gzip; Web Vitals não coletados ║
║ 15. Qualidade de Código    (×1)  ║  7/10 ║ Lint crashando; prettier ausente do lint-staged    ║
║ 16. Segurança              (×3)  ║  5/10 ║ 5 edge functions públicas sem auth; 32 CVEs        ║
║ 17. Testes                 (×2)  ║  6/10 ║ Integração simulada; RLS test vazio; coverage s/CI ║
║ 18. Tipagem / Type Safety  (×2)  ║  7/10 ║ 9 erros de typecheck; gen types fora do pipeline   ║
║ 19. Validação              (×2)  ║  7/10 ║ Sem magic bytes em uploads                         ║
║ 20. Operações (Processos)  (×1)  ║  5/10 ║ main sem proteção; majors mesclados no vermelho    ║
╠══════════════════════════════════╬═══════╬════════════════════════════════════════════════════╣
║ NOTA GERAL PONDERADA             ║ 7,1/10║ Σ(nota×peso)/Σpesos = 233/33                       ║
╚══════════════════════════════════╩═══════╩════════════════════════════════════════════════════╝
```

---

## 4. TOP 10 AÇÕES POR ROI (impacto ÷ esforço)

```
[P0] [SEGURANÇA] — Tornar o repositório privado
├── Impacto: Crítico (código interno + endpoints abertos expostos publicamente; AGENTS.md o declara privado)
├── Esforço: Trivial (Settings → Danger Zone → Change visibility)
├── Tipo: Processo
└── Aceite: repo inacessível sem autenticação

[P0] [SEGURANÇA] — Fechar as 5 edge functions públicas
├── Impacto: Crítico (relay de e-mail/WhatsApp/frete aberto à internet, vivo agora)
├── Esforço: Baixo (½ dia)
├── Tipo: Código
├── Arquivos: supabase/functions/{resend-email,evolution-whatsapp,melhor-envio-api,log-security-event,predict-delays-scheduled}/index.ts + supabase/config.toml
├── Como: exigir `auth.getUser()` + role (chamadas do app) ou header `x-internal-secret` (chamadas de cron/functions) no topo de cada uma; padrão já existe em webhook-status/index.ts:28-41
└── Aceite: curl sem token → 401 nas 5; fluxos do app seguem funcionando

[P0] [CI/CD] — Destravar a cadeia eslint
├── Impacto: Alto (reanima npm ci, lint e TODO o CI)
├── Esforço: Baixo (1 commit)
├── Tipo: Config
├── Arquivos: package.json (eslint ^10.9.1→^9.39.0, @eslint/js ^10.0.1→^9.x) + package-lock
├── Como: pin nos majors 9 até typescript-eslint/plugin-react-hooks suportarem eslint 10; adicionar ignore no Dependabot p/ eslint major
└── Aceite: `npm ci && npm run lint` verdes localmente

[P0] [CUTOVER] — Confirmar o que a produção está servindo
├── Impacto: Crítico se main deployada (banco sem dados de negócio)
├── Esforço: Baixo (verificação)
├── Tipo: Processo
├── Onde: Lovable (deploy atual) × destino jvfhclubfpxrtrrazrgr (coletas/entregas/clientes = 0 linhas)
└── Aceite: ou etapa 86 concluída com dados migrados, ou main revertida/deploy pinado na origem

[P1] [TIPAGEM] — Corrigir os 9 erros de typecheck
├── Impacto: Alto (job typecheck verde; UI de painéis/calendário funcional)
├── Esforço: Baixo (2 arquivos de UI + 1 componente)
├── Arquivos: src/components/ui/resizable.tsx, ui/calendar.tsx, common/DateRangePicker.tsx
└── Aceite: `npx tsc --noEmit` = 0 erros

[P1] [TESTES] — Anon key correta no teste de RLS
├── Impacto: Alto (teste de segurança volta a testar de verdade)
├── Esforço: Trivial (1 linha)
├── Arquivos: tests/security/rls-access.spec.ts:12 (e integrations-access.spec.ts se igual)
└── Aceite: teste falha se uma policy for aberta de propósito num branch de teste

[P1] [SEGURANÇA] — Zerar as 4 CVEs críticas
├── Impacto: Alto (DOMPurify XSS/jsPDF traversal em deps de runtime)
├── Esforço: Baixo-Médio (npm audit fix + bump jspdf)
├── Arquivos: package.json
└── Aceite: `npm audit --audit-level=high` = 0 high/critical

[P1] [OPERAÇÕES] — Branch protection na main
├── Impacto: Alto (impede repetir merge de major no vermelho)
├── Esforço: Baixo (config GitHub; depende dos itens acima p/ checks passarem)
├── Como: require PR + status checks (CI/CD Pipeline, Quality Gate Nexus) + linear history
└── Aceite: push direto rejeitado; merge bloqueado com check vermelho

[P2] [BANCO] — Registrar migrations pendentes + policy da partição
├── Impacto: Médio (drift zero repo↔banco; partições futuras consistentes)
├── Esforço: Baixo (as 3 são idempotentes)
├── Arquivos: supabase/migrations/20260831130200, 20260901000000, 20260901000001 + fn ensure_monthly_partition (replicar policies)
└── Aceite: schema_migrations = arquivos do repo (menos a 20240822 legada, a documentar)

[P2] [CI/CD] — Gates realistas de bundle e coverage
├── Impacto: Médio (CI que passa por mérito, não nunca)
├── Esforço: Baixo
├── Arquivos: .github/workflows/ci.yml:71-74 (coverage real via vitest thresholds) e :100-105 (du 512KB → size-limit por chunk gzip); remover job generate-audit-pdf ou criar o audit_report.md
└── Aceite: pipeline completo verde na main

[P2] [MONITORING] — Sentry.init no front (ou remoção limpa)
├── Impacto: Médio (erro de produção visível; hoje é caixa preta)
├── Esforço: Baixo
├── Arquivos: src/main.tsx (init com DSN via VITE_SENTRY_DSN), mover @sentry/react p/ dependencies
└── Aceite: erro forçado em prod aparece no Sentry
```

---

## 5. ROADMAP EM 3 ONDAS

| Onda                          | Itens                                                                                                                                                                                                                                                                                        | Resultado                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 🔴 **Quick Wins** (1–3 dias)  | Fechar 5 functions abertas · pin eslint 9 · confirmar cutover/deploy · 9 erros TS · anon key do RLS test · prettier nos devDeps · links README/LICENSE                                                                                                                                       | Superfície pública fechada; `npm ci`+lint+typecheck verdes local                   |
| 🟠 **Sprint 1** (1–2 semanas) | CVEs críticas/high · branch protection · gates realistas (coverage/bundle) · registrar 3 migrations + fix `ensure_monthly_partition` · Sentry init · triagem dos 11 PRs Dependabot (fechar majors sem plano: react-router 7, coverage-v8 4)                                                  | **CI 100% verde na main + main protegida** — a cadeia de qualidade volta a existir |
| 🟡 **Sprint 2** (2–4 semanas) | Staging (branch develop → projeto Supabase de staging) · teste de restore PITR · policies por papel nas tabelas com PII + 5 tabelas anon→authenticated · state machine de status · magic bytes em uploads · `gen types` no CI · quebrar as 3 maiores god-pages · runbook de rollback testado | Segurança fina + operação reproduzível                                             |

---

## 6. NOTA FINAL — 7,1/10

Sistema **muito acima da média** em banco de dados, documentação e engenharia de plataforma — particionamento com
retenção autônoma, 311 policies com paridade auditada, vault, SLOs computados em banco e 14 ADRs são coisa de time
grande, num projeto solo. O que derruba a nota são duas feridas concentradas e **corrigíveis em dias**: (1) cinco
edge functions públicas sem nenhuma autenticação servindo e-mail, WhatsApp e API de frete da empresa para a
internet; (2) a cadeia de qualidade morta desde maio — `npm ci` não instala, lint crasha, typecheck tem 9 erros,
e sem branch protection os majors do Dependabot continuam entrando no vermelho e criando os próximos incidentes
(o bug do zod4 nas telas de login foi exatamente isso). Fechadas as functions e reanimado o CI com main protegida,
este sistema salta para a faixa 8,5+ sem reescrever nada.

**Não auditável nesta sessão** (registrado, não pontuado): config do GoTrue no painel (MFA/leaked-password),
PITR/restore real, deploy corrente do Lovable, uptime externo.
