# Regras de domínio que o código não deixa óbvio — referência para agentes

Ler antes de mexer em coleta, entrega, frete, gamificação, papéis de usuário ou CSP.

## Papéis

- O enum real é **`app_role: 'admin' | 'user'`** (`src/integrations/supabase/types.ts`, enum
  `app_role`). Textos antigos (inclusive `docs/adr/0014`) citam `moderator` — **não existe** no banco.
  Não escreva policy, UI ou teste contando com um terceiro papel.
- Toda policy que discrimina papel chama `public.has_role(auth.uid(), 'admin')` (`SECURITY DEFINER`) —
  detalhe e armadilhas em `docs/agentes/banco.md`.

## Máquinas de estado (enums do banco — mudar o enum é migration)

| Entidade | Estados |
|---|---|
| **Coleta** (`coleta_status`) | `aguardando_liberacao` → `solicitada` → `em_transito` → `chegou_expedicao` → `conferencia_ok` \| `divergencia` → `finalizada` |
| **Coleta** (`coleta_tipo`) | `lalamove` \| `transportadora` — o tipo decide qual integração é chamada |
| **Entrega** (`entrega_status`) | `aguardando_producao` → `pronto_despacho` → `cotacao_frete` → `nf_emitida` → `despachado` → `em_transito` → `saiu_entrega` → `entregue` → `finalizado`, com `ocorrencia` como desvio |
| **Frete interno** (`frete_interno_status`) | `pendente` \| `em_transito` \| `entregue` \| `atrasado` \| `cancelado` |
| **Tipo de frete** (`frete_tipo`) | `cif` \| `fob` \| `cortesia` |
| **Notificação** (`notification_type`) | `info` \| `success` \| `warning` \| `error` \| `achievement` |

Status novo = migration no enum + ajuste em **todo** lugar que faz `switch`/mapa de cor/label. Status fora
do enum não falha no front, falha no `INSERT` — e o erro aparece como "não salvou" sem explicação.

## Exclusão e concorrência

- **Nada é apagado de verdade:** coluna `deleted_at` + hook `useSoftDelete` (`docs/SOFT_DELETE_POLICY.md`).
  Query nova em tabela com histórico **filtra `deleted_at IS NULL`**; esquecer isso faz registro excluído
  reaparecer em lista, KPI e export.
- **Edição concorrente** usa `entity_versions` (migration `20241231000001_entity_versions.sql`): quem salva
  manda a versão que leu. Ignorar isso volta a permitir sobrescrever alteração de outro usuário.

## Gamificação

- `user_levels.nexus_score` é `numeric(5,2)` com `CHECK` de **0 a 100** (migration
  `20260813120000_add_nexus_score_to_user_levels.sql`) — valor fora da faixa é erro de banco, não de UI.
- **Armadilha real:** existem dois arquivos com o mesmo export —
  `src/hooks/gamification/useGamification.ts` (badges, tiers, presentes de tarefa) e
  `.../useGamification.tsx` (níveis, `xpForLevel`, `calculateLevel`, conquistas). Os imports no código são
  extensionless (`@/hooks/gamification/useGamification`), e a resolução do Vite pega o **`.ts`** — o `.tsx`
  fica inacessível por esses imports. Antes de "corrigir" um bug de XP, confirme **qual** dos dois está
  realmente em uso no caminho que você está lendo.
- Flags `VITE_ENABLE_GAMIFICATION`, `VITE_ENABLE_LALAMOVE`, `VITE_ENABLE_BITRIX24_SYNC` existem no Vercel:
  feature desligada por flag não é feature quebrada.

## Dados mockados ainda existem

`docs/MIGRATION-GUIDE.md` mapeia pares `useX` (mock) → `useXReal` (Supabase): `useAnalytics`,
`useDashboardMetrics`, `useSLAMetrics`, `useLogisticsCosts`, `useGamification`, `useLalamoveTracking`,
`useBitrix24`. Antes de debugar número errado em dashboard, **confira se a tela está consumindo o hook
`Real`** — número de mock não tem bug, tem mock.

## Segurança que o CI cobra

- **CSP:** a meta no `index.html` precisa manter `style-src https://fonts.googleapis.com`,
  `font-src https://fonts.gstatic.com`, `connect-src 'self' https://*.supabase.co`,
  `img-src … https://api.mapbox.com`, `worker-src 'self' blob:` — `scripts/validate-csp.mjs` roda no
  `prebuild` e no CI. Domínio novo no front = atualizar a CSP no mesmo PR, ou o build cai.
- **Log de edge function:** nenhum `console.*` cru (`npm run validate:no-console`) — use `_shared/logger.ts`,
  que já evita PII.
- **Criptografia de campo** (`_shared/crypto.ts`) é fail-closed: sem `FIELD_ENCRYPTION_KEY` (≥32 chars) a
  function **lança**, não degrada.
- **LGPD:** apagar usuário é pela function `lgpd-erase-user` (`docs/LGPD_COMPLIANCE.md`), nunca `DELETE`
  direto em `auth.users` ou nas tabelas de perfil.

## Fixtures e ambientes

Não há staging: `tests/security/*.spec.ts` e `tests/contracts/` batem no **PostgREST de produção** com a
anon key e esperam bloqueio/contrato. `tests/e2e/` (Playwright) espera usuário de teste semeado no ambiente
alvo — por isso o E2E é `workflow_dispatch` e não gate. Semente: `npm run seed`
(`scripts/seed-database.ts`, exige `SUPABASE_SERVICE_ROLE_KEY` **local**, nunca commitado).
