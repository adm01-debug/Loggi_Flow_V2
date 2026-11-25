# 03 — ACHADOS

> Auditoria somente-leitura · `main` em `d37ba30` · 2026-11-22/23
> Agrupados **por causa raiz**. Um problema com dez ocorrências é **um** achado com dez locais.

> **Fechamento da auditoria · 2026-11-24 · `main` em `c7fc18ae` · banco `jvfhclubfpxrtrrazrgr`**
> Árvore da auditoria em `d37ba30` (2026-11-22/23). O estado abaixo vem de `05-PROGRESSO.md`, não da memória de quem executou.
> Contagem: **35 resolvidos / 15 parciais / 14 abertos / 1 refutado** — RESOLVIDO exige todas as etapas do achado concluídas com verificação registrada.
> **Atualização 2026-11-24 (`main` em `8406f688`): C-01 RESOLVIDO** (etapas 028-037, migrações aplicadas em produção) → **36 resolvidos / 15 parciais / 14 abertos**.

## Como ler

| Campo          | O que significa                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Confiança**  | `confirmado` = a evidência citada foi lida e confere. `HIPÓTESE — NÃO VERIFICADO` = falta a fonte que decide (quase sempre o banco ao vivo); traz o que faltou e o comando que confirma.                                           |
| **Método**     | `EXECUTADO` (rodei e vi) ou `RASTREADO` (segui pelo código). Nenhum achado abaixo foi "testado": nada que grava dado foi executado.                                                                                                |
| **Severidade** | **Crítica** = perda/vazamento de dado, falha de segurança, fluxo principal quebrado · **Alta** = função importante falha ou dá resultado errado · **Média** = funciona com defeito/fragilidade · **Baixa** = acabamento e higiene. |

### Contagem

| Severidade  | Quantidade |
| ----------- | ---------- |
| **Crítica** | **11**     |
| **Alta**    | **23**     |
| Média       | 22         |
| Baixa       | 9          |
| **Total**   | **65**     |

Os IDs são identificadores, não contagem: a numeração dentro de cada grupo não é sequencial (o grupo A
começa em A-07 porque os achados foram consolidados e reagrupados por causa raiz durante a auditoria). O que
vale é a lista de IDs, e todos os 65 estão cobertos pelo plano — a conferência está em `00-RESUMO.md`.

---

# Grupo S — Segurança (quem consegue fazer o quê)

## S-01 — O webhook do Nexus deixa de verificar assinatura quando o segredo não está configurado

- **Camada:** edge function · **Severidade:** **Crítica** · **Confiança:** defeito de código **confirmado**; o efeito em produção depende do ambiente (ver abaixo) · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/nexus-webhook-receiver/index.ts:36-44`:

```ts
// HMAC is enforced when NEXUS_WEBHOOK_SECRET is configured (fail-closed)
if (Deno.env.get("NEXUS_WEBHOOK_SECRET")) {
  if (!(await verifyWebhookHmac(raw, signature, "NEXUS_WEBHOOK_SECRET"))) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, ... });
  }
}
```

O helper compartilhado **já é fail-closed por conta própria** — `supabase/functions/_shared/webhookSignature.ts:13-17`
devolve `false` quando o segredo não existe:

```ts
const secret = Deno.env.get(secretEnvVar);
if (!secret) {
  log.error(`${secretEnvVar} missing — refusing webhook (fail-closed)`);
  return false;
}
```

O `if` externo **desfaz** essa proteção: sem o segredo no ambiente, o bloco inteiro é pulado e a requisição
segue sem verificação alguma. O comentário da linha 36 afirma "fail-closed"; o código faz o contrário.

**Causa raiz.** A função envolveu numa condicional um helper que já tratava o caso de segredo ausente —
provavelmente para "não quebrar enquanto o segredo não estivesse configurado". As outras três funções de
webhook chamam `verifyWebhookHmac` diretamente e estão corretas.

**Efeito, se o segredo não estiver setado:** qualquer pessoa na internet injeta evento, faz a função
enumerar a tabela `transportadoras` por telefone usando `service_role` (`index.ts:104-116`) e dispara
`functions.invoke('normalize-freight-response')` (`index.ts:141`, `:154`).

**Impacto no negócio.** Um estranho consegue inserir eventos falsos de transportadora e descobrir a lista de
transportadoras e seus telefones, sem senha nenhuma.

**Locais:** `supabase/functions/nexus-webhook-receiver/index.ts:37`

**Padrão de referência no próprio repo:** `supabase/functions/carrier-webhook-receiver/index.ts:90-96` —
chama `verifyWebhookHmac` direto, sem condicional.

**Nota importante para o executor:** a correção **não depende** de descobrir se o segredo está configurado.
Remover o `if` externo deixa o comportamento correto nos dois casos. Não espere a confirmação do ambiente
para corrigir — mas registre o estado do segredo, porque ele diz se houve exposição real.

→ Etapas **001**, **002**

**Estado (2026-11-24):** PARCIAL (feito 001; falta 002 — aguarda o dono).

## S-02 — `webhook-status` aceita qualquer usuário autenticado e dispara POST assinado para todos os clientes

- **Camada:** edge function · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/webhook-status/index.ts:22-26` cria o cliente com
`SUPABASE_SERVICE_ROLE_KEY` **antes** de qualquer checagem (`:29`). A autenticação aceita qualquer usuário
autenticado (`:36-45`). Em seguida a função lê `client_webhooks` **sem filtro de dono** (`:60-63`) e envia
POSTs assinados, com conteúdo vindo do corpo da requisição, para **todos** os webhooks ativos (`:68-119`).
O comentário em `:28` promete "service-role bearer or authenticated user" — o código entrega o segundo.

**Causa raiz.** Confusão entre _autenticado_ e _autorizado_: a função trata "tem sessão" como "pode operar
em nome do sistema". Não existe um `requireRole` em `_shared/auth.ts` para ela usar.

**Impacto no negócio.** Qualquer pessoa com login no sistema consegue enviar avisos falsos de mudança de
status, assinados como se fossem do sistema, para todos os clientes que recebem webhook — e listar quem são.

**Locais:** `supabase/functions/webhook-status/index.ts:22-26`, `:36-45`, `:60-63`, `:68-119`, `:174`

**Padrão de referência:** `supabase/functions/resend-email/index.ts:25-36` (exige segredo interno ou
`service_role`) e `supabase/functions/predict-delays-scheduled/index.ts:24-35`.

→ Etapas **003**, **004**, **005**

**Estado (2026-11-24):** RESOLVIDO (etapas 003, 004, 005).

## S-03 — Qualquer usuário autenticado envia WhatsApp para qualquer número

- **Camada:** edge function · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/evolution-whatsapp/index.ts:34-43` usa `requireUser`, que prova que
existe sessão válida — não que o papel pode enviar mensagem. Os campos `instance`, `phone` e `message` vêm
do corpo (`:68`), sem vínculo com o usuário nem checagem de papel.

**Causa raiz.** A mesma de S-02: falta um degrau de autorização por papel. `_shared/auth.ts` oferece
`requireUser` e `requireInternalSecret`, e **não** oferece `requireRole`.

**Impacto no negócio.** Um funcionário com o acesso mais básico manda WhatsApp para qualquer número pelo
número oficial da empresa — gasto no provedor e risco de bloqueio do número por denúncia de spam.

**Locais:** `supabase/functions/evolution-whatsapp/index.ts:34-43`, `:68`

→ Etapas **006**, **007**

**Estado (2026-11-24):** PARCIAL (feito 007; falta 006 — aguarda o dono).

## S-04 — Qualquer usuário autenticado cota na Melhor Envio, e o ambiente (produção/sandbox) vem do corpo

- **Camada:** edge function · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/melhor-envio-api/index.ts:43-49` exige apenas sessão. Pior:
`:59-61` lê `action`, `params` e **`useSandbox`** do corpo — quem chama escolhe se a operação vai para o
ambiente real ou para o de teste.

**Causa raiz.** Decisão de ambiente delegada ao cliente, em vez de ser do servidor (variável de ambiente).

**Impacto no negócio.** Qualquer pessoa com login consome a cota da conta Melhor Envio; e uma chamada pode
ir para o ambiente errado, gerando cotação ou etiqueta inválida.

**Locais:** `supabase/functions/melhor-envio-api/index.ts:43-49`, `:59-61`

→ Etapas **008**, **009**

**Estado (2026-11-24):** ABERTO (008, 009 — aguarda o dono).

## S-05 — Modo de teste dos webhooks pula o HMAC e grava de verdade

- **Camada:** edge function · **Severidade:** **Média** (sobe para **Crítica** se a variável estiver ligada em produção) · **Confiança:** **HIPÓTESE — NÃO VERIFICADO** quanto ao ambiente; o código é confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/lalamove-webhook/index.ts:52-53` e
`supabase/functions/rodonaves-webhook/index.ts:67-69`: quando `ALLOW_TEST_MODE === 'true'` está no servidor
**e** chega o header `x-test-mode: true`, a verificação HMAC é pulada e a função grava normalmente. O header
sozinho não basta — o desenho está certo nesse ponto.

**O que falta para confirmar.** O valor de `ALLOW_TEST_MODE` no ambiente de produção. Não é legível daqui.
`scripts/ops/set_missing_secrets.sh:25` diz que a variável "nao se define em producao", e
`scripts/ops/set-missing-secrets.unit.mjs:72` a **exclui** do conjunto gerenciado pelo script — ou seja, é
convenção escrita, não garantia verificada por ninguém.

**Impacto no negócio.** Se a variável estiver ligada por engano, qualquer um grava evento de rastreio falso
nas entregas mandando um header.

**Locais:** `supabase/functions/lalamove-webhook/index.ts:52-53`, `supabase/functions/rodonaves-webhook/index.ts:67-69`

→ Etapas **010**, **011**

**Estado (2026-11-24):** ABERTO (010, 011 — aguarda o dono).

## S-06 — Duas funções públicas usam `service_role` para responder a anônimos

- **Camada:** edge function · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/health/index.ts:23-31` usa `service_role` para consultar `profiles` e
listar buckets (`:48`), sem autenticação alguma. `supabase/functions/health-check/index.ts:12,24` vai além:
chama `supabase.auth.admin.listUsers({ perPage: 1 })` — API administrativa — a pedido de qualquer anônimo.

**Causa raiz.** Healthcheck implementado com a chave mais poderosa disponível em vez de uma verificação
barata que não precise de privilégio.

**Impacto no negócio.** Não há escrita nem vazamento de registro, mas qualquer um na internet faz o sistema
consultar o banco e a API de usuários repetidamente — conta como custo e serve de alavanca para derrubar o
serviço.

**Locais:** `supabase/functions/health/index.ts:23-31`, `:48`; `supabase/functions/health-check/index.ts:12`, `:24`

→ Etapas **012**, **013**, **014**

**Estado (2026-11-24):** PARCIAL (feito 012, 013; falta 014 — aguarda o dono).

## S-07 — Repositório é público, a documentação diz que é privado, e o `.env` está versionado

- **Camada:** repositório/infra · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** EXECUTADO

**Problema hoje.** A API do GitHub devolve `"visibility":"public"` para `adm01-debug/Loggi_Flow_V2`.
O `AGENTS.md` afirma, na seção de Fluxo Git: _"Repo `adm01-debug/Loggi_Flow_V2`, `main`, **privado**"_. Há
ainda um comentário em `.github/workflows/ci.yml:11` dizendo _"repo privado exige permissão explícita"_.
E `git ls-files .env` devolve `.env`: o arquivo **é rastreado** e `git check-ignore .env` não casa —
não está no `.gitignore`.

**O que foi verificado sobre as chaves (e não é o problema):** as quatro variáveis do `.env` e o JWT em
`docs/ops/cron_jobs_origem.json` têm todas `"role":"anon"`, confirmado decodificando o payload. São chaves
públicas por desenho. **Nenhum segredo de servidor foi encontrado em arquivo versionado.** Nenhum valor é
reproduzido nesta auditoria.

**Causa raiz.** A instrução que todo agente é obrigado a ler está errada sobre a característica mais
importante do repositório. Como `.env` já é rastreado, o próximo `.env` que alguém editar entra no commit
por hábito — e dessa vez pode não ser uma chave `anon`.

**Impacto no negócio.** Hoje: o código-fonte do sistema e o `VITE_MAPBOX_TOKEN` estão visíveis para qualquer
pessoa. Amanhã: o primeiro agente que seguir a instrução "é privado" e colocar uma chave de verdade no
`.env` a publica para o mundo.

**Locais:** `AGENTS.md` (seção Fluxo Git), `.github/workflows/ci.yml:11`, `.env` (rastreado), `.gitignore`

**Armadilha:** apagar o `.env` do histórico exige reescrever o histórico do repositório — **não faça isso**.
As chaves são `anon`; o ganho não paga o risco. O que resolve é: corrigir o `AGENTS.md`, pôr `.env` no
`.gitignore`, remover do índice (`git rm --cached`) e decidir conscientemente sobre a visibilidade.

→ Etapas **015**, **016**, **017**, **018**

**Estado (2026-11-24):** PARCIAL (feito 015; falta 016, 017, 018 — aguarda o dono).

## S-08 — O token do Mapbox no `.env` é dívida morta: nada no sistema o usa

- **Camada:** infra/integração · **Severidade:** **Baixa** · **Confiança:** confirmado · **Método:** EXECUTADO

> **Correção de rota, registrada por honestidade.** A primeira versão deste achado tratava
> `VITE_MAPBOX_TOKEN` como risco de custo — "token público sem restrição de domínio, qualquer site pode usar
> e a conta paga". **Está errado**, e foi derrubado na redação do plano:
> `grep -rn 'VITE_MAPBOX_TOKEN' src/ index.html` devolve **nada**. O sistema migrou para `maplibre-gl`
> (`package.json:101`) com estilos gratuitos, e `src/lib/mapStyles.ts:1-6` diz por quê: _"Estilos de mapa
> gratuitos e sem token. Substituem os estilos `mapbox://` **apos a revogacao do token herdado do
> Lovable**."_ O token já foi revogado e não é lido por ninguém.

**O que sobra, e é só higiene.** Três resíduos de uma integração encerrada: a variável no `.env`
(versionado), a edge function pública `get-mapbox-token`, e a referência em `src/lib/constants.ts:129`.

**Impacto no negócio.** Nenhum hoje. O risco é de confusão: um agente encontra `get-mapbox-token`, conclui
que o sistema usa Mapbox, e vai configurar uma conta que ninguém precisa — ou pior, usa a função como
exemplo de "como servir token pelo servidor" sem saber que ela devolve um token revogado.

**Locais:** `.env`, `supabase/functions/get-mapbox-token/`, `src/lib/constants.ts:129`

**Armadilha:** `get-mapbox-token` é uma das 25 funções com CORS `"*"` fixo (B-07). Se a decisão for removê-la,
a etapa de CORS correspondente deixa de ser necessária — resolva a remoção primeiro.

→ Etapa **019**

**Estado (2026-11-24):** ABERTO (019 — aguarda o dono).

---

# Grupo F — Fonte de verdade: o que a auditoria não pôde decidir

Este grupo existe porque o projeto Supabase oficial não ficou acessível nesta sessão e
`docs/contexto/supabase/` — a fonte que o próprio protocolo do repositório nomeia como **dona do fato**
"o que existe no banco" — nunca foi gerada. Os três achados abaixo são as consequências disso.

## F-01 — A fonte de contexto afirma que 36 tabelas estão sem RLS; ao menos 32 têm

- **Camada:** banco / ferramentas de contexto · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** EXECUTADO

> **Corrigido nas etapas 020-022** (`scripts/ai-context/gerar.mjs`): o gerador não afirma mais "sem RLS"
> nesse cenário — publica `sem_rls: 'desconhecido'`, `tabelas_rls_indeterminado` e a consulta ao catálogo que
> decide. No repositório atual: 12 partições `audit_logs_y*` indeterminadas e 0 tabelas "sem RLS" confirmadas.

**Problema hoje.** `docs/contexto/codigo/banco.json` (branch `contexto`) marca `rls: false` em 36 tabelas.
Dessas, 32 são partições mensais de `audit_logs` e `rastreamento_historico` — e o RLS **é** habilitado nelas
por DDL dinâmico, que o gerador não lê:

- `supabase/migrations/20260711185045_1705b3fd-cc2b-459f-9aa4-664dacfe7c9d.sql:1-32` — bloco `DO $$` que
  varre `pg_class` procurando partições com `NOT c.relrowsecurity` e executa
  `ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY` em cada uma, criando também as policies de
  `rastreamento_historico`.
- `supabase/migrations/20260902120000_hardening_pos_auditoria.sql:46` — a função
  `ensure_monthly_partition` passou a habilitar RLS e criar policies em toda partição futura.

O próprio gerador avisa, em `banco.json`: _"52 bloco(s) com DDL dinâmico (EXECUTE format/...) não modelado
— policies/colunas criadas dinamicamente podem faltar; confira no banco vivo"_.

**Causa raiz.** O gerador reconstrói o schema a partir do texto das migrations e não executa SQL. Toda
proteção criada por `EXECUTE format(...)` fica invisível para ele. Como o `00-INDEX.md` instrui o agente a
tratar `codigo/banco.json` como referência enquanto a fonte do banco vivo não existe, o agente recebe uma
lista de 36 "tabelas sem proteção" que é falsa em 32 casos.

**Impacto no negócio.** O próximo agente abre uma tarefa de segurança urgente para corrigir 36 tabelas que
em 32 casos já estão certas — e, pior, pode aplicar DDL em produção para "consertar" o que não está quebrado.
Esta auditoria gastou parte do tempo exatamente nisso antes de descartar.

**Locais:** `docs/contexto/codigo/banco.json` (branch `contexto`), gerado por `scripts/ai-context/gerar.mjs`;
`docs/contexto/00-INDEX.md` (a linha que manda usar a fonte inexistente)

**Armadilha:** não "corrija" o `banco.json` à mão — ele é gerado e será sobrescrito (o próprio arquivo avisa).
A correção é no gerador e/ou no aviso que ele emite.

→ Etapas **020**, **021**, **022**

**Estado (2026-11-24):** RESOLVIDO (etapas 020, 021, 022).

## F-02 — Três tabelas recebem `CREATE POLICY` e nenhuma migration habilita RLS nelas

- **Camada:** banco · **Severidade:** **Crítica** se confirmado · **Confiança:** **HIPÓTESE — NÃO VERIFICADO** · **Método:** RASTREADO

**Problema hoje.** Para `geo_blocking_rules`, `geo_blocking_settings` e `scheduled_reports`:

- existem `CREATE POLICY` — ex. `supabase/migrations/20260901000001_remediacao_destino.sql:56-70`
  (policies de admin para as duas de geo-blocking, e de dono para `scheduled_reports`);
- **não existe `CREATE TABLE`** para nenhuma das três em nenhuma migration (grep exaustivo);
- **não existe `ENABLE ROW LEVEL SECURITY`** para nenhuma das três em nenhuma migration (grep exaustivo);
- o loop dinâmico de F-01 **não** as alcança: ele filtra `relname LIKE 'rastreamento_historico_y%'` e
  `relname LIKE 'audit_logs_y%'` (`20260711185045_...sql:10`, `:28`).

No Postgres, `CREATE POLICY` numa tabela **sem** RLS habilitado é aceito e **a policy não é aplicada**. O
resultado é uma tabela aberta com aparência de protegida — o pior dos dois mundos, porque qualquer revisão
que olhe só as policies conclui que está tudo bem.

**Por que as tabelas não têm `CREATE TABLE`:** foram criadas fora das migrations (painel do Supabase ou
Lovable, de onde o repositório nasceu). Portanto o estado de RLS delas **só o banco ao vivo informa**.

**O que falta para confirmar — e como.** Consulte o catálogo direto, que é a fonte e funciona com
`service_role`:

```sql
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
       (SELECT count(*) FROM pg_policies p
         WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('geo_blocking_rules','geo_blocking_settings','scheduled_reports');
```

Existe também uma função de auditoria pronta no banco,
`supabase/migrations/20260712212132_d59626e8-c3eb-438c-b158-67882acd95e8.sql`, mas com **duas ressalvas que
custam tempo a quem não souber**: a coluna de classificação chama-se **`severity`**, não `status` (`:11`), e
a função começa com `IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION`
(`:19-21`) — chamada por um MCP com `service_role`, `auth.uid()` é nulo e ela **estoura**. Portanto:

```sql
-- só funciona numa sessão com usuário admin autenticado:
SELECT * FROM public.get_rls_audit() WHERE severity = 'critical';
```

Se ela estourar, use a consulta ao catálogo acima — é a mesma fonte (`pg_class.relrowsecurity`, `:26`).

**Impacto no negócio.** Se confirmado: `scheduled_reports` guarda os relatórios agendados por usuário (com
`user_id`), e as duas de geo-blocking guardam as regras de bloqueio por país — qualquer pessoa com login
leria e alteraria as regras de segurança e os agendamentos de todos.

**Locais:** `supabase/migrations/20260901000001_remediacao_destino.sql:56-70`,
`supabase/migrations/20260317224939_faf0aac9-4ef7-4dab-aa72-ce5ce2b627e9.sql:27-34`

**Armadilha:** **não** rode `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sem antes conferir se as policies
existentes cobrem quem precisa escrever. Habilitar RLS numa tabela cujas policies não cobrem o caminho de
escrita **quebra a funcionalidade na hora** (RLS sem policy nega tudo). A ordem correta é: consultar,
conferir as policies, só então habilitar — e é por isso que isso é uma etapa com aprovação humana.

→ Etapas **023**, **024**, **025**

**Estado (2026-11-24):** **REFUTADO** — a etapa 023 foi executada no banco ao vivo (`jvfhclubfpxrtrrazrgr`, somente leitura) e as três tabelas têm `relrowsecurity = true` com policy criada (`geo_blocking_rules` 2, `geo_blocking_settings` 2, `scheduled_reports` 4). O cenário do achado não existe; as etapas 024 e 025 são encerradas como "não se aplica". Saída literal em `05-PROGRESSO.md`, "Registro - etapas 023, 026 e 287".

## F-03 — A unicidade está garantida nos números de coleta e entrega; falta no código de rastreio reverso

- **Camada:** banco · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

> **Correção de rota, registrada por honestidade.** A primeira versão deste achado suspeitava que o número
> de coleta e o de entrega pudessem repetir sob concorrência. **A suspeita é falsa** e foi derrubada na
> redação do plano, abrindo os arquivos:
> `supabase/migrations/20251215123841_69fdc13e-5215-49b0-abfb-1c49d264c2a0.sql:48` declara
> `numero_coleta TEXT NOT NULL UNIQUE` e `:96` declara `numero_entrega TEXT NOT NULL UNIQUE`; e os geradores
> usam `nextval('coleta_seq')` / `nextval('entrega_seq')` (`:184-199`), e sequência do Postgres é segura sob
> concorrência. **Não abra etapa para isso.** Fica como exemplo do que o grupo F existe para evitar: concluir
> sobre o banco sem olhar o banco.

**O que sobra, e é real.** `logistica_reversa.codigo_rastreio_reverso` é declarado como `TEXT` puro, **sem
`UNIQUE`**, em `supabase/migrations/20260512191343_9d4eff37-8f6a-4916-8ed2-2a474def2be8.sql:10`. É um código
de rastreio — o identificador que o cliente usa para acompanhar a devolução — e nada impede que dois
registros recebam o mesmo valor.

**Causa raiz.** Coluna de identificador externo criada sem restrição de unicidade.

**O que falta para confirmar no estado real.** Se existe índice único criado fora das migrations:

```sql
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.logistica_reversa'::regclass AND contype IN ('u','p');
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'logistica_reversa';
```

**Impacto no negócio.** Duas devoluções com o mesmo código de rastreio: o cliente consulta e vê a devolução
de outra pessoa, ou a própria operação perde de vista qual é qual.

**Locais:** `supabase/migrations/20260512191343_9d4eff37-8f6a-4916-8ed2-2a474def2be8.sql:10`

**Armadilha:** antes de criar a restrição, verifique se já existem duplicatas na tabela — criar `UNIQUE`
sobre dado duplicado **falha**, e a migration quebra no meio.

→ Etapas **026**, **027**

**Estado (2026-11-24):** PARCIAL — a etapa 026 foi executada no banco ao vivo: `coletas.numero_coleta` e `entregas.numero_entrega` têm `UNIQUE` (`coletas_numero_coleta_key`, `entregas_numero_entrega_key`) e **0 duplicatas** nas três colunas. O que sobra é só o que o achado já apontava — `logistica_reversa.codigo_rastreio_reverso` segue **sem** `UNIQUE` (0 duplicatas hoje, então a etapa 027 pode ser aplicada sem risco de a migration quebrar).

---

# Grupo C — Consistência de dados e regras de negócio

## C-01 — A máquina de estados do negócio existe só na tela, e incompleta

- **Camada:** regra de negócio (front + banco) · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Três fatos, verificados um a um:

1. A única validação de transição no sistema é um objeto no front:
   `src/pages/Despachos.tsx:95-99`

   ```ts
   const validTransitions: Record<string, string> = {
     pronto_despacho: "cotacao_frete",
     cotacao_frete: "nf_emitida",
     nf_emitida: "despachado",
   };
   ```

   Ele cobre **3 saltos** de um enum `entrega_status` com **10 valores**. `aguardando_producao`,
   `em_transito`, `saiu_entrega`, `entregue`, `ocorrencia` e `finalizado` não têm transição definida nem no
   front. Para `coleta_status` (7 valores) não há objeto equivalente em lugar nenhum.

2. O banco não valida nada. Levantando todos os `CREATE TRIGGER ... ON entregas|coletas` nas migrations, os
   únicos triggers são: `update_updated_at_column`, `generate_coleta_numero` / `generate_entrega_numero`
   (ambos `BEFORE INSERT`), `audit_coletas` / `audit_entregas` e `tr_increment_version_entregas`
   (`20251215123841_...sql:175-203`, `20251220164816_audit_log_triggers.sql:20-25`,
   `20260513164426_...sql:24-29`). **Nenhum valida mudança de status.** Não há `CHECK` restringindo
   transição — um enum do Postgres aceita qualquer um dos seus valores em qualquer ordem.

3. A regra "não despacha sem nota fiscal" é só visual: `src/pages/Despachos.tsx:240` testa
   `!item.nf_remessa` na tela e impede o clique. Um `PATCH` direto na API grava igual.

E a atualização vai direto do navegador para a tabela: `src/pages/Despachos.tsx:203-208`
(`supabase.from("entregas").update({ status: nextStatus })`). Não há edge function intermediando.

**Causa raiz.** A regra de negócio mais importante do sistema — a ordem em que uma entrega caminha — nunca
foi levada para onde ela é obrigatória. Ela mora na camada que o usuário controla.

**Impacto no negócio.** Qualquer pessoa com login consegue marcar uma entrega como "entregue" sem que ela
tenha sido despachada, e sem nota fiscal emitida. Os painéis de SLA e OTIF passam a medir uma operação que
não aconteceu — e é com esses números que se cobra transportadora e se promete prazo a cliente.

**Locais:** `src/pages/Despachos.tsx:95-99`, `:203-208`, `:240`; `src/pages/KanbanEntregas.tsx:300-319`;
ausência de trigger/CHECK em `supabase/migrations/` para `coletas` e `entregas`

**Caminho recomendado (resumo; detalhe nas etapas).** A correção certa é uma função de validação no banco
mais um trigger `BEFORE UPDATE` em cada tabela, porque é a única camada que ninguém contorna. O repositório
já tem o padrão de função `SECURITY DEFINER` com `SET search_path` em 83 funções — siga-o.
**Atalho tentador a evitar:** completar o `validTransitions` do front e parar aí. Isso deixa o problema
inteiro de pé, só mais difícil de perceber, porque a tela passa a parecer consistente.

→ Etapas **028** a **037**

**Estado (2026-11-24):** RESOLVIDO (etapas 028-037). As migracoes da funcao e dos triggers
estao aplicadas em producao (runs `45382701775`, `45382772891`, `45382829524`, `45382898191`),
o `sql.unit.mjs` exercita a recusa num Postgres descartavel (29 testes) e as telas que gravam
status traduzem a recusa `23514` (`Despachos.tsx:253`, `KanbanEntregas.tsx:344`, `Envios.tsx`).
Registro completo em `05-PROGRESSO.md` ("Registro - etapas 028-033 e 037").

## C-02 — A tela de cotação multicanal não lê nem grava no banco: a negociação vive na memória do navegador

- **Camada:** interface + hook · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/pages/CotacaoMultiCanal.tsx`:

- `:57` — `const { createCotacao } = useCotacoesMulticanal();` — destrutura **só** a criação.
- `:83` — `const [cotacoes, setCotacoes] = useState<CotacaoManual[]>([]);` — é **esta** a fonte da tabela
  que a tela mostra, não a query.
- `:451-477` — `handleRegistrarResposta` faz `setCotacoes((prev) => prev.map(...))` e
  `toast.success("Resposta registrada!")`. Nenhuma chamada ao banco.

O hook `src/hooks/logistics/useCotacoesMulticanal.tsx` oferece tudo o que falta: `useQuery` em `:47`,
`createCotacao` em `:69`, `updateCotacao` em `:107`, `selectCotacao` em `:146`, exportados em `:172-184`.

**Causa raiz.** Existem **duas telas para a mesma função**, e só uma usa o hook por completo:
`src/pages/DashboardCotacoes.tsx:183-184,230` consome `updateCotacao` e `selectCotacao` corretamente e
persiste. As duas estão registradas no menu: `/cotacao-multicanal` (`src/App.tsx:153`) e
`/dashboard-cotacoes` (`src/App.tsx:154`). A tela mais nova foi construída com estado local em vez de
reusar o caminho que já existia.

> Correção de rota desta auditoria: um relatório intermediário afirmou que `updateCotacao` e `selectCotacao`
> "existem e nunca são usados". Isso é falso — `DashboardCotacoes` os usa. O achado correto é a duplicação
> de tela, não o abandono do hook. A diferença muda a correção: há um padrão a copiar dentro do repositório.

**Impacto no negócio.** O preço que a transportadora respondeu por WhatsApp ou e-mail aparece na tela e
desaparece quando a página é recarregada. A cotação vencedora nunca fica marcada como escolhida no sistema,
então não há registro de por que aquele frete foi contratado — e a negociação não entra em nenhum relatório.

**Locais:** `src/pages/CotacaoMultiCanal.tsx:57`, `:83`, `:451-477`, `:321-326`

**Padrão de referência:** `src/pages/DashboardCotacoes.tsx:183-184,230`

→ Etapas **038** a **043**

**Estado (2026-11-25):** FECHADO — 038 levou a tabela para o banco e 043 separou os papeis: `CotacaoMultiCanal` dispara e registra, `DashboardCotacoes` acompanha, e o dashboard passou a ter entrada para cotar de novo.

## C-03 — Travas de concorrência que não avisam quando bloqueiam

- **Camada:** interface + hook · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** O sistema tem controle de versão otimista na tabela `entregas`: a coluna `version` é
incrementada pelo trigger `tr_increment_version_entregas` (`20260513164426_...sql:24-29`), e os updates
filtram por ela. O mecanismo funciona. O problema é que, em 3 dos 4 locais, **ninguém olha o resultado**:

| Local                                              | Usa `{count:"exact"}`? | Avisa o usuário?                                                                                                               |
| -------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/KanbanEntregas.tsx:300-319`             | **sim**                | **sim** — `if (count === 0) throw new Error("Conflito de versão — registro alterado por outro usuário, por favor recarregue")` |
| `src/pages/Despachos.tsx:203-208`                  | não                    | não — `onSuccess` mostra `Movido para X` (`:225-229`)                                                                          |
| `src/pages/Despachos.tsx:264`                      | não                    | não                                                                                                                            |
| `src/hooks/logistics/useBoxManagement.tsx:139-145` | não                    | não — e ainda grava `kanban_history` (`:148-154`) como se a alocação tivesse ocorrido                                          |

Em Supabase, `.update()` sem `{count:"exact"}` não informa quantas linhas mudaram e **não devolve erro**
quando o filtro não casa. Zero linhas afetadas é indistinguível de sucesso.

**Causa raiz.** O padrão correto foi implementado em uma tela e não foi propagado para as outras três.

**Impacto no negócio.** Dois operadores mexendo na mesma entrega: o segundo vê "Movido para Despachado",
acredita que despachou, e nada mudou. No caso do BOX, o histórico registra uma alocação que não existe —
duas mercadorias apontam para o mesmo BOX nos relatórios.

**Locais:** `src/pages/Despachos.tsx:203-208`, `:264`; `src/hooks/logistics/useBoxManagement.tsx:139-154`

**Padrão de referência:** `src/pages/KanbanEntregas.tsx:300-319`

**Armadilha:** não acrescente lógica de incremento de `version` no front. O banco já faz isso pelo trigger;
mandar `version + 1` do cliente é redundante (o `BEFORE UPDATE` sobrescreve) e dá a falsa impressão de que o
front controla a versão.

→ Etapas **044** a **048**

**Estado (2026-11-24):** RESOLVIDO (etapas 044, 048).

---

# Grupo D — Risco de perda de dado

## D-01 — Exclusão em massa executa sem perguntar; a exclusão de um registro pergunta

- **Camada:** interface · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** O componente compartilhado de ações em lote dispara a ação no clique, sem nenhuma
confirmação. `src/components/common/BulkActions.tsx:74` (caminho de até 3 ações) e `:95` (caminho do menu):

```tsx
onClick={() => action.onClick(selectedIds)}
```

A propriedade `variant: "destructive"` que as telas passam **só muda a cor do botão** — não há `AlertDialog`
em nenhum ponto do componente. Quem usa:

- `src/pages/Clientes.tsx:725-729` — `onClick: (ids) => bulkDeleteMut.mutate(ids)`
- `src/pages/Fornecedores.tsx:607-611` — mesmo padrão
- `src/pages/FretesInternos.tsx:536` — `onClick: (ids) => bulkUpdateStatus(ids, "cancelado")`

Na **mesma tela**, excluir um cliente só abre confirmação (`src/pages/Clientes.tsx:1041`).

**Causa raiz.** A confirmação foi implementada por tela, no caminho individual, e o componente comum de
ações em lote nasceu sem ela. Como o componente é compartilhado, toda tela que o adota herda o defeito.

**Impacto no negócio.** Um clique errado apaga todos os clientes selecionados de uma vez, sem pergunta e
sem como desfazer pela interface. É o caminho mais curto para perda de dado no sistema inteiro.

**Locais:** `src/components/common/BulkActions.tsx:74`, `:95`; `src/pages/Clientes.tsx:725-729`;
`src/pages/Fornecedores.tsx:607-611`; `src/pages/FretesInternos.tsx:536`

**Padrão de referência:** `src/components/freight/FreightTableManager.tsx:600,616` — usa `ConfirmDialog`
inclusive para ação em lote. Também `src/pages/Despachos.tsx:546`.

**Caminho recomendado.** Corrija no `BulkActions.tsx`: quando `action.variant === "destructive"`, passe pelo
`ConfirmDialog` antes de chamar `onClick`. Uma mudança, três telas protegidas.
**Atalho tentador a evitar:** adicionar `ConfirmDialog` em cada tela. Além de triplicar o trabalho, deixa a
próxima tela que usar o componente desprotegida de novo.

→ Etapas **049**, **050**, **051**, **052**

**Estado (2026-11-24):** RESOLVIDO (etapas 049, 050, 051, 052).

## D-02 — Dois cadastros apagam o registro de verdade, contra a política escrita do repositório

- **Camada:** interface + banco · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `docs/SOFT_DELETE_POLICY.md` define exclusão lógica por `deleted_at`. Três telas seguem;
duas não:

| Tela                                    | Como exclui                                                   |
| --------------------------------------- | ------------------------------------------------------------- |
| `src/pages/Clientes.tsx:337`            | `.update({ deleted_at: new Date().toISOString() })` — correto |
| `src/pages/Fornecedores.tsx:286`        | `.update({ deleted_at: ... })` — correto                      |
| `src/pages/Transportadoras.tsx:336-341` | **`.delete().eq("id", id)`**                                  |
| `src/pages/FretesInternos.tsx:253-257`  | **`.delete()`**                                               |

**Causa raiz.** A política existe como documento e não como mecanismo: nada no código impede um
`.delete()`. Duas telas foram escritas antes (ou à margem) da política e ninguém as alcançou.

**Impacto no negócio.** Apagar uma transportadora é definitivo. Se houver entregas, cotações ou histórico
apontando para ela, ou o banco recusa (e o usuário vê um erro técnico sem explicação) ou o vínculo some dos
relatórios. Nos outros cadastros o registro apenas fica escondido e pode voltar.

**Locais:** `src/pages/Transportadoras.tsx:336-341`, `src/pages/FretesInternos.tsx:253-257`

**Armadilha:** antes de trocar por `deleted_at`, confirme que **toda** consulta dessas duas tabelas filtra
`deleted_at IS NULL`. Trocar a exclusão sem acrescentar o filtro faz o registro "excluído" reaparecer nas
listas — um defeito pior que o atual, porque parece que a exclusão não funciona.

→ Etapas **053** a **058**

**Estado (2026-11-24):** PARCIAL (feito 053; falta 058 — aguarda o dono).

## D-03 — Cancelar uma logística reversa é um clique de menu, sem confirmação

- **Camada:** interface · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/pages/LogisticaReversa.tsx:461-471` — a mudança para `cancelado` é um
`DropdownMenuItem` igual aos outros:

```tsx
onClick={() => updateStatus.mutate({ id: item.id, status: "cancelado" })}
```

**Causa raiz.** As transições de status foram tratadas como itens equivalentes de menu; a destrutiva não
recebeu tratamento diferente.

**Impacto no negócio.** A devolução de um cliente é cancelada por engano com um clique, sem aviso.

**Locais:** `src/pages/LogisticaReversa.tsx:461-471`

**Padrão de referência:** `src/pages/Despachos.tsx:546-553`.

→ Etapa **059**

**Estado (2026-11-24):** RESOLVIDO (etapas 059).

## D-04 — Dois arquivos SQL de remediação parados na pasta, sem registro de aplicação

- **Camada:** banco/scripts · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `scripts/origem_remediacao_2026-08-31.sql` e `scripts/cleanup_triggers_source.sql` alteram
o banco e **não têm runner**: nenhum workflow e nenhum script do `package.json` os invoca. São citados apenas
em README e em `docs/agentes/banco.md`.

> **Correção de rota.** A primeira versão deste achado dizia que "nada no repositório diz se já foram
> aplicados". **Está errado**: os dois ganharam cabeçalho explícito em 2026-11-09 —
> `scripts/origem_remediacao_2026-08-31.sql:1-6` diz _"HISTÓRICO — NÃO REEXECUTAR: registro do que já foi
> aplicado"_ e registra que o arquivo foi tornado inofensivo numa reexecução acidental (`BEGIN`/`COMMIT` e
> `CREATE OR REPLACE TRIGGER`). `cleanup_triggers_source.sql:1-4` também se identifica como espelho de algo
> já aplicado. **O cuidado existe e está bem feito.**

**O que sobra, e é menor.** Dois arquivos de SQL de produção soltos na **raiz** de `scripts/` — onde todo o
resto é automação com runner —, sem um registro único que diga, para qualquer SQL pontual do repositório,
onde e quando foi aplicado.

**Causa raiz.** Falta um lugar canônico para SQL já executado, então ele fica onde foi criado.

**Impacto no negócio.** Baixo hoje, graças ao cabeçalho. O risco é o próximo SQL pontual nascer sem esse
cuidado, porque não há convenção nem lugar definido.

**Locais:** `scripts/origem_remediacao_2026-08-31.sql`, `scripts/cleanup_triggers_source.sql`

→ Etapas **060**, **061**

**Estado (2026-11-24):** ABERTO (060 — aguarda o dono; 061 — não executada).

---

# Grupo A — Funcionalidade ausente, incompleta ou fantasma

## A-07 — `Coletas` não tem editar nem excluir, e o editar já existe sem porta de entrada

- **Camada:** interface · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/components/coletas/PickupDialog.tsx:158` tem o caminho de edição pronto
(`.update(payload as ColetaUpdate)`), acionado quando o diálogo recebe um registro. Mas a página só o abre
vazio: `src/pages/Coletas.tsx:341-343`

```tsx
onClick={() => { setSelectedPickup(null); setIsDialogOpen(true); }}
```

e o clique no cartão vai para o diálogo de **detalhes**, não para o de edição (`:718-721`). Não existe
nenhuma mutation de exclusão em `Coletas.tsx`.

**Causa raiz.** A tela ficou só com o caminho de criação; o de edição foi construído e nunca ligado.

**Impacto no negócio.** Quem digita uma coleta errada não consegue corrigir nem apagar pela tela — precisa
de alguém mexendo no banco. Coletas é a porta de entrada da operação; errar ali atrapalha todo o resto.

**Locais:** `src/pages/Coletas.tsx:341-343`, `:718-721`; `src/components/coletas/PickupDialog.tsx:158`

**Caminho recomendado.** Ligar o diálogo existente (passar o registro selecionado) é uma mudança pequena e
resolve a edição. A exclusão deve ser lógica (`deleted_at`), seguindo `src/pages/Clientes.tsx:337`, com
`ConfirmDialog` — **e** com o filtro `deleted_at IS NULL` na consulta da lista, no mesmo passo (ver D-02).

→ Etapas **062** a **067**

**Estado (2026-11-24):** RESOLVIDO (etapas 062, 067).

## A-08 — "Nexus Self-Healing": uma funcionalidade que finge trabalhar

- **Camada:** hook + banco · **Severidade:** **Média** (código morto hoje; **Alta** se alguém o ligar) · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/hooks/security/useSelfHealing.ts` tem **quatro** defeitos empilhados, todos
verificados:

1. **Não é importado por nenhum arquivo** (grep de `useSelfHealing` em `src/`: só a própria definição).
2. `:17` — `await new Promise(resolve => setTimeout(resolve, 2000));` — espera dois segundos **fingindo
   trabalho**. O comentário na linha acima diz: `// 1. Simular limpeza de cache/re-sincronização`.
3. `:19` — chama `supabase.rpc('reconcile_pending_freights')`. Essa função tem `EXECUTE` **revogado de
   `authenticated`** em três migrations distintas (`20260711192237_...sql:19`,
   `20260711183644_...sql:34-35`, `20260628122741_...sql:9`). A chamada do navegador sempre falharia.
4. A função faz `UPDATE public.freights` (`20260519163240_...sql:12`) e **nenhuma migration cria a tabela
   `freights`** (grep de `CREATE TABLE.*freights`: vazio; em `types.ts` só existe a coluna `total_freights`).
   O próprio corpo da função admite: `-- Simula uma lógica de reconciliação real`.

E `:21-25` mostra `toast.success('Protocolo Self-Healing Concluído' / 'Estrutura de dados Nexus 10/10
restaurada com sucesso')` **independentemente do resultado** — o cliente Supabase não lança exceção, devolve
`{ error }`, que ninguém olha. O próprio código avisa: `// Mesmo se a RPC falhar (pode não existir ainda),
continuamos o protocolo de UI`.

Mesmo caso, mesmo padrão: `src/hooks/ai/useNexusSimulator.ts:17-20`, também não importado por ninguém.

**Causa raiz.** Duas funcionalidades construídas como demonstração visual e deixadas na árvore.

**Varredura do padrão (para o executor não procurar fantasma onde não há):** em todo o `src/` existem apenas
3 comentários admitindo simulação e 6 `setTimeout` dentro de `Promise`. Os outros quatro são legítimos:
`useDeliveryRoutes.tsx:256` e `useGeocoding.tsx:75` são limitação de taxa entre chamadas,
`CircuitBreaker.ts:39` é espera de retentativa, `BiometricConsentModal.tsx:66` é animação de consentimento.
**O problema é localizado nesses dois hooks mortos, não sistêmico.**

**Impacto no negócio.** Hoje: nada, porque não está ligado. O risco é o próximo agente encontrar um hook
chamado "self-healing", colocar um botão nele e entregar ao dono um botão que mostra "banco restaurado com
sucesso" sem ter feito nada.

**Locais:** `src/hooks/security/useSelfHealing.ts` (arquivo inteiro), `src/hooks/ai/useNexusSimulator.ts:17-20`,
`supabase/migrations/20260519163240_a44a9ac2-837f-405f-ab86-8e651c62bd5b.sql:2-26`

→ Etapas **068**, **069**, **070**

**Estado (2026-11-24):** PARCIAL (feito 068, 069; falta 070 — aguarda o dono).

## A-09 — Duas edge functions publicadas que ninguém chama

- **Camada:** edge function · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `docs/contexto/codigo/edge-functions.json` marca `orfa: true` para `ingest-biosync` e
`push-send`: nenhuma chamada do front, de outra função, de SQL ou de cron. `push-send` entrou no **último
commit da `main`** (`d37ba30`, "feat: edge push-send para envio web-push real (5.6)") e é uma das três
funções sem teste algum.

**Causa raiz.** Funcionalidade entregue pela metade: o lado servidor foi publicado, o lado que o chama não.

**Impacto no negócio.** A notificação por push foi dada como pronta e não há nada no sistema que a dispare.
E `ingest-biosync` recebe telemetria de dispositivo (dado de biometria de motorista — matéria de LGPD) numa
função que ninguém no sistema usa.

**Locais:** `supabase/functions/push-send/`, `supabase/functions/ingest-biosync/`

**Armadilha:** não apague `push-send` — é recente e provavelmente faz parte de um trabalho em andamento. A
etapa é **decidir** (ligar ou remover) com o dono, não limpar por conta própria.

→ Etapas **071**, **072**, **073**

**Estado (2026-11-24):** ABERTO (071, 072, 073 — aguarda o dono).

## A-10 — Três buckets de storage criados e nunca usados pelo código

- **Camada:** storage · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Dois buckets existem e **nenhum código os usa**: `comprovantes` e `entregas-fotos`
(`grep -rn "comprovantes\|entregas-fotos" src/` devolve vazio).

> **Correção de rota.** A primeira versão deste achado incluía `ocorrencias-fotos` como terceiro bucket sem
> uso, baseada no campo `usado_em: 0` de `docs/contexto/codigo/banco.json`. **Está errado:** o bucket é usado
> em cinco pontos — `src/pages/Ocorrencias.tsx:196`, `:780`, `:894`, além de ser o padrão em
> `src/hooks/data/useImageUpload.tsx:62` e `src/components/common/ImageUploader.tsx:21`. Mais um caso em que
> a fonte de contexto gerada discordou do código (ver F-01). **Não abra etapa para `ocorrencias-fotos`.**

E o comprovante de entrega **existe** como funcionalidade — só vai para outro bucket: `documents`
(`src/components/shipping/DeliveryReceiptUpload.tsx:55-57`, `src/pages/Envios.tsx:1173`).

**Impacto no negócio.** Menor do que parecia. O que sobra: dois buckets vazios no projeto, e a dúvida de se
o comprovante deveria estar em `documents` mesmo ou no bucket feito para ele — o que importa porque as
policies dos dois podem ser diferentes.

**Locais:** buckets no banco; ausência de uso em `src/`

→ Etapas **074**, **075**, **076**

**Estado (2026-11-24):** ABERTO (074, 075, 076 — aguarda o dono).

## A-11 — Dois caminhos de upload com padrões de segurança diferentes

- **Camada:** hook/serviço · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** O caminho robusto, `src/hooks/data/useDocumentUpload.ts`, valida tamanho (`:57`), tipo
MIME (`:63`) e **assinatura de arquivo** (magic bytes, `:42-51`) — é exemplar. O caminho paralelo,
`src/services/api/storageService.ts:33-48` (`uploadDocument`), **não valida nada**: usa
`file.name.split(".").pop()` como extensão (confia no nome que o cliente mandou) e sobe para o **mesmo
bucket** `documents`.

Hoje só `getSignedDocumentUrl` é importado (`src/components/shipping/DeliveryReceiptUpload.tsx:14`);
`uploadDocument` **não tem nenhum chamador** — é uma armadilha pronta para o próximo agente usar por ser a
função de nome mais óbvio.

Ressalva no caminho robusto: `useDocumentUpload.ts:49` — `if (!signatures[type]) return true;` aceita quando
o tipo não está na tabela de assinaturas. Com a lista de tipos permitidos restrita, o risco é pequeno, mas o
padrão é permissivo.

**Impacto no negócio.** Se alguém usar a função sem validação, passa a ser possível subir arquivo de qualquer
tipo e tamanho para o mesmo bucket dos documentos.

**Locais:** `src/services/api/storageService.ts:33-48`; `src/hooks/data/useDocumentUpload.ts:49`

**Padrão de referência:** `src/hooks/data/useDocumentUpload.ts:42-63`.

→ Etapas **077**, **078**, **079**

**Estado (2026-11-24):** RESOLVIDO (etapas 077, 078, 079).

## A-12 — Oito arquivos de hook que ninguém importa

- **Camada:** hooks · **Severidade:** **Baixa** · **Confiança:** confirmado (de `hooks.json`, campo `usado_por: 0`) · **Método:** RASTREADO

**Problema hoje.** `src/components/accessibility/index.ts`, `src/components/common/index.ts`,
`src/components/pwa/index.ts`, `src/hooks/ai/useNexusSimulator.ts`,
`src/hooks/gamification/useGamification.tsx`, `src/hooks/rodonaves/index.ts`,
`src/hooks/security/useSelfHealing.ts`, `src/utils/performance.ts`.

**Armadilha importante, e ela é maior do que parece.** Cinco desses são arquivos `index.ts` que apenas
reexportam (barris): "ninguém importa o barril" **não** significa que o hook está morto. Três casos
verificados, cada um diferente:

- **`useGamification`: existem DOIS arquivos** — `src/hooks/gamification/useGamification.ts` (8.975 bytes) e
  `.tsx` (9.464 bytes). Como todos os imports são sem extensão, resolvem para o **`.ts`**. Só o **`.tsx`**
  está órfão. E um comentário em `src/services/api/authService.ts:43` afirma o contrário. Remover o arquivo
  errado quebra a gamificação inteira.
- **`src/hooks/rodonaves/index.ts`** é barril morto, mas os três hooks dele estão vivos por caminho direto:
  `RTEGatewaySLOPanel.tsx:16`, `RTESLOHistoryPanel.tsx:8`, `RTEGatewayHealthPanel.tsx:9`.
- **`src/utils/performance.ts`** é o único com zero importadores — o único removível com segurança.

Os dois casos realmente mortos e confirmados são `useSelfHealing` e `useNexusSimulator` (A-08).

→ Etapas **080**, **081**

**Estado (2026-11-24):** RESOLVIDO (etapas 080, 081).

## A-13 — `_shared/service-wrapper.ts` existe e nenhuma função o usa

- **Camada:** edge function · **Severidade:** **Baixa** (mas é a causa raiz de B-02) · **Confiança:** confirmado · **Método:** EXECUTADO

**Problema hoje.** O arquivo existe (440 bytes) e `grep -rl 'service-wrapper' supabase/functions/*/index.ts`
devolve **0**. É o helper que padronizaria a resposta de erro — justamente o que 22 funções fazem à mão e
errado (B-02).

**Locais:** `supabase/functions/_shared/service-wrapper.ts`

→ Etapa **082**

**Estado (2026-11-24):** RESOLVIDO (etapas 082).

---

# Grupo R — Robustez: erros, estados e concorrência

## R-02 — A assinatura de tempo real é derrubada e reaberta a cada render, em 12 telas

- **Camada:** hook · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** O hook central `src/hooks/data/useRealtime.tsx` está escrito com cuidado: tópico único por
instância (`:94`), `removeChannel` no cleanup (`:208-213`), `clearTimeout` do retry (`:201`). O defeito não é
ausência de limpeza — é **frequência**. A cadeia de dependências:

- `:158` — `handleChange` é um `useCallback` com deps `[queryKey, queryClient, onInsert, onUpdate, onDelete, table]`
- `:214` — o `useEffect` da assinatura depende de `handleChange`

Como `queryKey`, `onInsert`, `onUpdate` e `onDelete` são passados **inline** pelos chamadores, ganham nova
identidade a cada render. `handleChange` muda, o efeito roda de novo: derruba o canal e abre outro. E como
cada evento causa `refetch` → render → novo canal → novo evento, o ciclo se alimenta.

Exemplo verificado, `src/pages/Envios.tsx:416-421`:

```tsx
useRealtime({
  table: "entregas",
  onInsert: () => refetch(),
  onUpdate: () => refetch(),
  onDelete: () => refetch(),
});
```

**Os 12 chamadores com valor inline:** `src/pages/Envios.tsx:417-420`,
`src/pages/KanbanEntregas.tsx:249-257`, `src/pages/Index.tsx:136-139` e `:140`,
`src/pages/Coletas.tsx:136`, `src/components/audit/AuditTrailViewer.tsx:75`,
`src/pages/RastreamentoMotorista.tsx:74`, `src/pages/Ranking.tsx:77`, `src/pages/SLADashboard.tsx:43`,
`src/pages/Notificacoes.tsx:88`, `src/pages/Despachos.tsx:154`, `src/pages/CustosDashboard.tsx:75`.

**Causa raiz.** A interface do hook aceita callback inline sem exigir estabilidade, e o contrato não está
documentado onde o chamador olha. Um chamador acertou por conta própria.

**Impacto no negócio.** Nas telas mais abertas do dia (Envios, Kanban, Dashboard) o sistema abre e fecha
conexão com o banco continuamente enquanto a tela fica aberta. Isso consome a cota de conexões em tempo real
do projeto — e quando ela estoura, as telas **param de atualizar sozinhas sem avisar ninguém**, o que é o
pior tipo de falha: o operador confia numa tela que parou.

**Locais:** `src/hooks/data/useRealtime.tsx:158`, `:214` + os 12 chamadores acima

**Padrão de referência:** `src/hooks/logistics/useUnifiedTracking.tsx:180-202` — handlers em `useCallback`
estáveis, passados por referência.

**Caminho recomendado.** Há duas correções e elas se complementam: (a) estabilizar dentro do hook, guardando
os callbacks em `useRef` e tirando-os das deps — resolve as 12 telas de uma vez; (b) corrigir os chamadores
para usar `useCallback`. Comece por (a), que é uma mudança num arquivo e protege quem vier depois.
**Atalho tentador a evitar:** acrescentar `eslint-disable` nas deps do efeito. **Esse atalho já foi tomado
uma vez** — `src/hooks/data/useRealtime.tsx:157` tem
`// eslint-disable-next-line react-hooks/exhaustive-deps` logo acima das deps de `handleChange`. Silenciou o
aviso e manteve o laço. Não repita.

→ Etapas **083** a **096**

**Estado (2026-11-24):** RESOLVIDO (etapas 083, 096).

## R-01 — Cinco telas mostram erro como texto solto; uma não mostra nada

- **Camada:** interface · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** O repositório tem um componente pronto, `src/components/common/EmptyState.tsx`, com
variantes `error`/`data`/`search` e botão de ação — usado corretamente em `Coletas.tsx:258`,
`KanbanEntregas.tsx:374`, `CotacaoFrete.tsx:88`, `Transportadoras.tsx:771`, `LogisticaReversa.tsx:175`.

Cinco telas ignoram o componente e mostram o erro como parágrafo, sem botão de tentar de novo:
`Envios.tsx:574`, `Clientes.tsx:413`, `Fornecedores.tsx:362`, `FretesInternos.tsx:338`,
`Ocorrencias.tsx:340` — todas no formato `<p className="text-destructive">Erro: {error.message}</p>`.

E **`Despachos` não trata erro nenhum**: `src/pages/Despachos.tsx:109-113` destrutura apenas `data`,
`isLoading` e `refetch`. Quando a consulta falha, a tela cai no estado vazio e exibe **"Fila Limpa"**
(o bloco `items.length === 0` está em `:521`; o texto, em `:525`).

**Causa raiz.** O componente comum chegou depois de algumas telas e não houve uma passada para unificar.

**Impacto no negócio.** Em Despachos, se o banco não responder, o despachante lê "Fila Limpa" e conclui que
não há nada para despachar. Mercadoria pronta deixa de sair porque a tela mentiu — e sem botão de tentar de
novo, nas outras cinco, o usuário só tem a opção de recarregar a página inteira.

**Locais:** `src/pages/Despachos.tsx:109-113`, `:521-525`; `src/pages/Envios.tsx:574`;
`src/pages/Clientes.tsx:413`; `src/pages/Fornecedores.tsx:362`; `src/pages/FretesInternos.tsx:338`;
`src/pages/Ocorrencias.tsx:340`

**Padrão de referência:** `src/components/common/EmptyState.tsx` (+ presets em `EmptyStatePresets.tsx`),
aplicado como em `src/pages/Coletas.tsx:258`.

→ Etapas **097** a **103**

**Estado (2026-11-24):** RESOLVIDO (etapas 097, 103).

## R-06 — Cinco gravações de configuração descartam o erro, e a tela mostra o contrário do banco

- **Camada:** interface + hook · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/components/predictions/PredictionAccuracyTimeline.tsx` chama `settings.save(...)` em
cinco pontos, todos com `.catch(() => undefined)`:

- `:89` — meta de acurácia e dias para alerta
- `:180` — ligar/desligar notificação por e-mail
- `:190` — endereço de e-mail
- `:202` — ligar/desligar notificação por WhatsApp
- `:212` — telefone de WhatsApp

Enquanto isso, `src/hooks/logistics/usePredictionAccuracySettings.ts:97` faz `if (error) throw error;` — o
erro **existe** e é jogado fora. O componente de interruptor já mudou de posição visualmente.

**Causa raiz.** `.catch(() => undefined)` foi usado para evitar "unhandled rejection" em vez de tratar o erro.

**Impacto no negócio.** O usuário liga "me avise por WhatsApp quando a acurácia cair", vê a chave ligada, e
nada foi salvo. Quando a acurácia cair, ninguém é avisado — e a tela continuará dizendo que o aviso está
ligado.

**Locais:** `src/components/predictions/PredictionAccuracyTimeline.tsx:89`, `:180`, `:190`, `:202`, `:212`

**Padrão de referência:** `src/hooks/logistics/useLalamoveOrders.tsx:56-57` — `onSuccess` com toast de
sucesso e `onError` com `toast.error(...)` contendo a mensagem.

→ Etapas **104** a **109**

**Estado (2026-11-24):** RESOLVIDO (etapas 104, 109).

## R-04 — Sincronização com a Rodonaves: erro invisível e lista que não atualiza

- **Camada:** hook · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/hooks/logistics/useRodonavesTracking.tsx:245-255` tem dois defeitos no mesmo
`useMutation`:

```ts
onSuccess: (data) => {
  const synced = data?.data?.synced || 0;
  toast.success(`${synced} entrega(s) atualizada(s) via Rodonaves`);
},
onError: (err: Error) => {
  // Fail silently or use internal telemetry
},
```

1. `onError` tem **corpo vazio** — a sincronização falha e nada aparece na tela.
2. `onSuccess` não invalida nada. A edge function grava em `entregas`
   (`supabase/functions/rodonaves-api/index.ts:1584`, `:1617`) e insere em `ocorrencias` (`:1632`); a tela
   lê `queryKey: ["entregas"]` (`src/pages/Envios.tsx:350`) e essa chave nunca é invalidada por esse fluxo.

Hoje o defeito 2 fica **mascarado** pelo realtime — que é exatamente o canal instável de R-02. Se o realtime
parar (e R-02 diz que ele para), o dado velho fica na tela.

**Mesma causa raiz em outro ponto:** `src/hooks/logistics/useSLAAlerts.tsx:96-119` grava em `notifications`
(`:98`) e não tem `onSuccess` nem `onError`; o sino lê `["notifications", user?.id]`
(`src/hooks/notifications/useNotifications.tsx:27`). Alerta de SLA gravado não aparece até recarregar.

**Medição do subagente (leitura direta):** 173 mutations em 59 arquivos; 17 sem invalidação, das quais **2
gravam dado** — estas duas. As outras 15 são leitura de API externa sem cache local, e **não são defeito**.

**Impacto no negócio.** O operador aperta "sincronizar", lê "12 entregas atualizadas" e a lista continua com
o status antigo — ele conclui que a transportadora não atualizou e liga para cobrar algo que já aconteceu.
Quando a sincronização falha, não aparece nada e ele acha que deu certo.

**Locais:** `src/hooks/logistics/useRodonavesTracking.tsx:248-251`, `:252-254`;
`src/hooks/logistics/useSLAAlerts.tsx:96-119`

**Padrão de referência:** `src/hooks/common/useComments.tsx:84-88`, `:103-107`.

→ Etapas **110** a **114**

**Estado (2026-11-24):** RESOLVIDO (etapas 110, 114).

## R-03 — "Nexus Blast" marca 100% mesmo com todas as transportadoras falhando

- **Camada:** interface · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/pages/CotacaoMultiCanal.tsx:321-326` — dentro do laço que cota com cada
transportadora, o `catch` só faz `console.error` e o laço segue incrementando `completed++`. A barra chega a
100% com zero cotações obtidas.

**Impacto no negócio.** O usuário dispara cotação para 10 transportadoras, vê "100% concluído" e não sabe
que 7 falharam — segue para a decisão de frete com três preços achando que tem dez.

**Locais:** `src/pages/CotacaoMultiCanal.tsx:321-326`

→ Etapas **115**, **116**

**Estado (2026-11-24):** RESOLVIDO (etapas 115, 116).

## R-07 — Importação em massa não diz quais linhas falharam, e conta o lote inteiro como erro

- **Camada:** interface · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/pages/ImportacaoMassa.tsx:154-160`:

```ts
const { error } = await supabase.from(entity).insert(batch);
if (error) {
  errorCount += batch.length;
}
```

O `error` do banco — que diz **qual** linha e **por quê** — é descartado, e o lote inteiro é contado como
erro mesmo que só uma linha seja inválida. O histórico de importações vive em `useState` (`:127`) e some ao
sair da tela.

**Impacto no negócio.** Numa planilha de 500 linhas o usuário vê "50 falharam" sem saber quais nem por quê —
não tem como corrigir e reimportar só o que faltou. Na prática ele refaz a planilha inteira ou desiste.

**Locais:** `src/pages/ImportacaoMassa.tsx:154-160`, `:127`

→ Etapas **117** a **120**

**Estado (2026-11-24):** PARCIAL (feito 117; falta 120 — aguarda o dono).

## R-05 — Nenhuma proteção verificada contra duplo clique em formulário de criação

- **Camada:** interface · **Severidade:** **Média** · **Confiança:** **HIPÓTESE — NÃO VERIFICADO** · **Método:** RASTREADO

**Problema hoje.** Esta é a hipótese mais fraca da auditoria, e a conferência feita na redação do plano a
enfraqueceu ainda mais: `disabled={...isPending}` aparece **59 vezes** em `src/`, e
`src/components/coletas/PickupDialog.tsx:463` já protege o envio. Como nenhuma tela tem teste e nada foi
executado, **não dá para afirmar nem negar** que exista um formulário desprotegido.

**O que falta para confirmar.** Abrir cada formulário de criação e conferir o `disabled` do botão durante a
mutação, ou rodar o cenário num ambiente de preview. **Se nada se confirmar, a etapa 121 deve encerrar este
achado como improcedente e registrar isso** — é um resultado legítimo.

**Impacto no negócio, se confirmado.** Coleta ou entrega duplicada por clique duplo — e, como F-03 mostra
que a unicidade do número não pôde ser confirmada, as duas podem até receber o mesmo número.

→ Etapas **121**, **122**

**Estado (2026-11-24):** RESOLVIDO (etapas 121, 122).

## R-08 — Dez temporizadores sem cancelamento no desmonte

- **Camada:** hooks · **Severidade:** **Baixa** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `setTimeout` criado dentro de callback (não de `useEffect`), sem referência nem limpeza:
`src/hooks/gamification/useAchievementNotifications.tsx:42-44`, `src/hooks/common/useImportData.ts:189-193`,
`src/hooks/ui/useOnboarding.tsx:190-200`, `src/hooks/data/useDocumentUpload.ts:111`,
`src/hooks/logistics/useSLANotifications.tsx:66`, `:97`, `:101`, `:105`, `:115`,
`src/hooks/notifications/useSecurityPushNotifications.tsx:111`.

**Nota de contraste:** **todos** os `setInterval` do repositório têm `clearInterval`. O problema é só com
`setTimeout` em callback.

**Impacto no negócio.** Ruído: aviso no console e, no onboarding, notificação de conquista aparecendo fora de
hora. Não perde dado nem vaza conexão.

**Padrão de referência:** `src/hooks/system/useNexusHealth.ts:82-89` (limpa timeout e interval no mesmo
`return`) e `src/hooks/logistics/useBusinessRuleEngine.tsx:33-34` (timer em `ref`, limpo antes de reagendar).

→ Etapas **123** a **127**

**Estado (2026-11-24):** RESOLVIDO (etapas 123, 127).

## R-09 — Quatro canais de tempo real com nome fixo global

- **Camada:** hooks · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/hooks/logistics/useBoxManagement.tsx:87` (`"box-realtime"`),
`src/hooks/logistics/useMapWeatherSync.ts:49` (`'risk-zones-changes'`),
`src/hooks/logistics/useSmartAlerts.tsx:170` (`"nexus-tactical-realtime-alerts"`),
`src/hooks/system/useNexusHealth.ts:24` (`"nexus-latency-probe"`).

O próprio repositório documenta o risco em `src/hooks/data/useRealtime.tsx:24` — _"com o mesmo tópico fazem
`.on()` após `.subscribe()` e estouram a página"_ — e o resolve com `topicRef = useRef(hookInstanceId())`
(`:94`). Esses quatro hooks não seguem.

**Impacto no negócio.** Se a mesma tela aparecer duas vezes (duas abas, ou dois componentes montados), uma
das duas para de receber atualização em silêncio.

**Padrão de referência:** `src/features/db-observability/hooks/useDbRegressionAlerts.ts:16-50` — canal
nomeado por `user.id`.

→ Etapas **128** a **131**

**Estado (2026-11-24):** RESOLVIDO (etapas 128, 131).

---

# Grupo B — Backend: robustez das edge functions

> **Correção de premissa, registrada para o executor.** Esta auditoria partiu da suspeita de que muitas
> funções chamariam terceiros sem tempo limite. **Está errado.** Existe `supabase/functions/_shared/safeFetch.ts`
> que embute `fetchWithTimeout` (10 s por padrão, `:107-110`) **e** disjuntor por host (`:111`), e as **36
> chamadas a API de terceiro** (Resend, Lalamove, Rodonaves, Melhor Envio, Bitrix24, Evolution, Mapbox,
> ViaCEP, OpenWeather, Google AI, HIBP, Slack) passam por ele. `grep 'fetch(' ` nos `index.ts` devolve 2
> ocorrências, nenhuma para terceiro externo. **Não abra etapa para isso.** O problema de disponibilidade é
> real, mas é outro: está em B-05.

## B-01 — Dois webhooks de transportadora deduplicam de forma não atômica, e marcam depois de gravar

- **Camada:** edge function · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Existe o helper correto: `supabase/functions/_shared/idempotency.ts:30`
(`claimIdempotencyKey`) grava primeiro e trata a violação de unicidade (`23505`) como duplicata — atômico.
Dois dos quatro webhooks o usam. Os outros dois reimplementaram à mão, e de um jeito que não funciona sob
concorrência:

`supabase/functions/lalamove-webhook/index.ts:101-114` — consulta antes:

```ts
const { data: existingEvent } = await supabase
  .from('webhook_events_processed')
  .select('id').eq('event_id', finalEventId).eq('provider', 'lalamove').maybeSingle();
if (existingEvent) { return ... 'Already processed' }
```

e só grava o marcador em `:189`, **depois** dos inserts de negócio (`:122`, `:145`, `:159`, `:178`).
`supabase/functions/rodonaves-webhook/index.ts:128-135` (consulta) e `:214-215` (marcador, após o insert de
`ocorrencias` em `:202`) seguem o mesmo desenho.

A tabela **tem** `UNIQUE(event_id, provider)`
(`supabase/migrations/20260513164426_aecb90e0-5d51-4f64-aca7-ac57c61139af.sql:44`), mas a restrição só é
exercida no fim e o erro desse insert não é verificado. Em dois envios simultâneos do mesmo evento, as duas
execuções passam pela consulta, as duas gravam os dados de negócio, e uma falha calada no marcador.

**Causa raiz.** Padrão "consulta e depois grava" (TOCTOU) em vez de "grava primeiro e trata o conflito" — e o
marcador no fim em vez do começo.

**Impacto no negócio.** Transportadora reenvia evento quando a resposta demora — é o comportamento normal
delas. Quando isso acontece, o histórico de rastreamento e as ocorrências da entrega são gravados **duas
vezes**. O cliente vê o mesmo evento repetido no rastreio, e os indicadores de ocorrência contam dobrado.

**Locais:** `supabase/functions/lalamove-webhook/index.ts:101-114`, `:189-190`;
`supabase/functions/rodonaves-webhook/index.ts:128-135`, `:214-215`

**Padrão de referência:** `supabase/functions/carrier-webhook-receiver/index.ts:128-135`.

→ Etapas **132** a **137**

**Estado (2026-11-24):** RESOLVIDO (etapas 132, 137).

## B-02 — Chave de deduplicação com valor de reserva que anula a própria deduplicação

- **Camada:** edge function · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Quando o evento não traz identificador, cada função inventa uma chave — e três das quatro
inventam uma que não serve:

| Função                                      | Chave de reserva                                                 | Efeito                                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `lalamove-webhook/index.ts:97`              | `eventId \|\| data?.orderId \|\| crypto.randomUUID()`            | aleatória → **a deduplicação nunca acerta**                                                                    |
| `nexus-webhook-receiver/index.ts:80`        | `...:${Date.now()}`                                              | sempre nova → **nunca acerta** (apesar de usar o helper correto)                                               |
| `carrier-webhook-receiver/index.ts:126-132` | `${carrier_id}:${event_type}:${timestamp ?? ""}`                 | sem `timestamp`, fica **estável demais** → o segundo evento legítimo do mesmo tipo é descartado como duplicata |
| `rodonaves-webhook/index.ts:124-127`        | `nf_numero\|codigo_rastreamento` + `status_code` + `data_evento` | **correto** — é o padrão a copiar                                                                              |

**Causa raiz.** `crypto.randomUUID()` e `Date.now()` foram usados para "garantir que a chave existe", quando
o que a chave precisa é ser **a mesma** para o mesmo evento.

**Impacto no negócio.** Dois extremos ruins: em dois webhooks a proteção contra evento repetido é decorativa;
no terceiro ela pode **engolir um evento verdadeiro** — uma mudança de status real que nunca aparece no
rastreio do cliente.

**Locais:** `supabase/functions/lalamove-webhook/index.ts:97`,
`supabase/functions/nexus-webhook-receiver/index.ts:80`,
`supabase/functions/carrier-webhook-receiver/index.ts:126-132`

**Padrão de referência:** `supabase/functions/rodonaves-webhook/index.ts:124-127`.

→ Etapas **138** a **142**

**Estado (2026-11-24):** PARCIAL (feito 138; falta 142 — aguarda o dono).

## B-03 — `scheduled-reports` deixa o cliente gravar qualquer coluna da tabela

- **Camada:** edge function · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/scheduled-reports/index.ts:28` lê `reportData` do corpo e `:38` o
espalha direto no insert:

```ts
const { action, reportId, reportData } = await req.json();
...
.insert([{ ...reportData, user_id: userId }])
```

Não há lista de campos permitidos. Qualquer coluna de `scheduled_reports` é gravável por quem chama,
inclusive colunas que a interface nunca mostra. O mesmo em `:50` para `update`.

**Crédito onde é devido (e armadilha para o executor):** o `user_id` **está correto** — vem de
`auth.claims.sub` (`:25`), com comentário explícito _"IDOR: userId vem das claims, nunca do body (etapa
011)"_, e o `update` filtra por `user_id` (`:53`). Já houve uma correção de segurança aqui. **Não desfaça
isso.** O que falta é só a lista de campos permitidos.

**Impacto no negócio.** Quem tem login consegue gravar campos do agendamento de relatório que ninguém
revisa — incluindo qualquer coluna de controle que a tabela tenha.

**Locais:** `supabase/functions/scheduled-reports/index.ts:28`, `:38`, `:50`

**Padrão de referência:** `supabase/functions/external-db-bridge/index.ts:4` com
`requireString`/`requireEnum` de `_shared/validate.ts`.

→ Etapas **143**, **144**, **145**

**Estado (2026-11-24):** RESOLVIDO (etapas 143, 144, 145).

## B-04 — Validação de entrada existe como helper e é usada por 8 de 32 funções

- **Camada:** edge function · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/_shared/validate.ts` oferece `requireString`, `requireNumber`,
`requireEnum` e `validationErrorResponse`. **32 das 44** funções fazem parse do corpo; **8** usam o helper.
Não há `zod` em nenhuma função. Casos com consequência direta:

- `smart-carrier-selection/index.ts:13` — `peso_kg` entra no cálculo de frete sem checagem de tipo; texto
  percorre a conta
- `webhook-status/index.ts:47` → `:51-58` — desestrutura `data` sem verificar que existe; um corpo
  `{"action":"notify_status_change"}` sem `data` quebra com erro 500
- `ingest-biosync/index.ts:21` → `:34` — `heart_rate` comparado com limite sem ser número
- `lalamove-api/index.ts:78-81` — `body.path` e `body.method` decidem o roteamento interno sem `requireEnum`
- `resend-email/index.ts:43` → `:45-57` — `to`, `subject` e `html` vão para o provedor sem validação de
  formato nem tamanho
- também: `melhor-envio-api/index.ts:59`, `lalamove-tracking/index.ts:91`,
  `ai-logistics-assistant/index.ts:71`, `evolution-whatsapp/index.ts:62`, `ocr-receipt-processor/index.ts:23`

**Impacto no negócio.** Requisição malformada vira erro 500 em vez de "o campo peso está inválido". Para quem
usa o sistema, é a diferença entre corrigir sozinho e abrir chamado.

**Locais:** os citados acima

**Padrão de referência:** `supabase/functions/external-db-bridge/index.ts:4`.

→ Etapas **146** a **155**

**Estado (2026-11-24):** RESOLVIDO (etapas 146, 155).

## B-05 — Chamadas internas entre funções sem tempo limite, inclusive dentro do webhook

- **Camada:** edge function · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Duas formas, nenhuma protegida:

`fetch` nu para o próprio gateway de funções (em Deno, `fetch` sem sinal **não tem tempo limite**):
`supabase/functions/normalize-freight-response/index.ts:195` (chama `whatsapp-notification`),
`supabase/functions/ingest-biosync/index.ts:65` (chama `bitrix24-integration`).

`supabase.functions.invoke()`, que faz HTTP real e não aceita tempo limite — e o disjuntor do `safeFetch`
não cobre esse caminho: `nexus-webhook-receiver/index.ts:141` e `:154`, `send-password-reset/index.ts:151`,
`predict-delays/index.ts:354`, `predict-delays-scheduled/index.ts:70`,
`accuracy-meta-monitor/index.ts:196` e `:215`, `accuracy-weekly-digest/index.ts:179`.

**O caso que mais importa:** `nexus-webhook-receiver:141,154` está **dentro do caminho do webhook**. Se a
função de normalização travar, a resposta à transportadora demora, a transportadora reenvia — e o reenvio cai
direto em B-01 e B-02, duplicando dado.

**Causa raiz.** `fetch-with-timeout.ts` existe mas não é aplicado às chamadas internas; e nenhuma função do
repositório faz isso corretamente hoje, então não há exemplo a copiar.

**Impacto no negócio.** Uma função lenta prende a outra; no caminho do webhook, isso vira evento de
rastreamento duplicado no pedido do cliente.

**Locais:** os 9 pontos citados acima

**Nota de ordem:** corrija **B-01 e B-02 antes** deste. Tempo limite sem idempotência correta aumenta a
chance de reenvio e, portanto, de duplicação.

→ Etapas **156** a **163**

**Estado (2026-11-24):** RESOLVIDO (etapas 156, 163).

## B-06 — Vinte e duas funções devolvem a mensagem de erro interna ao cliente

- **Camada:** edge function · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Não há envoltório padrão de erro em uso — `_shared/service-wrapper.ts` existe e **nenhuma
função o importa** (A-13). Cada `catch` monta a própria resposta e **22 das 44** ecoam `error.message`:

`resend-email:69` · `whatsapp-notification:318` · `bitrix24-integration:398` · `get-weather-data:42` ·
`nexus-webhook-receiver:165` · `lalamove-api:169` · `health-check:51` · `lalamove-webhook:201` ·
`ocr-receipt-processor:82` · `rodonaves-webhook:231` · `smart-carrier-selection:242` · `predict-delays:389` ·
`rodonaves-api:1714` · `nexus-auto-healing:110` · `new-device-alert:202` · `execute-protocol:59` ·
`check-rate-limit:144` · `lgpd-erase-user:102` · `normalize-freight-response:217` ·
`accuracy-weekly-digest:237` · `ingest-biosync:92` · `scheduled-reports:127`

Onde isso vaza desenho interno de verdade: nas funções que fazem `throw error` do erro do PostgREST
(`ingest-biosync:50`, `scheduled-reports:42`, `lgpd-erase-user`, `execute-protocol`), a mensagem do Postgres
chega ao cliente — **nome de tabela, nome de coluna, nome de restrição e texto de policy de RLS**.

**Ponto limpo, registrado para não virar etapa:** `grep '.stack'` nos `index.ts` devolve **zero**. Não há
vazamento de pilha de execução.

**Agravante — resposta do terceiro repassada:** `lalamove-api/index.ts:53,58` devolve `details: errorText`;
`rodonaves-api/index.ts:130-134`, `:189`, `:222`, `:637` transformam o corpo de erro da transportadora em
`RTEError.message`, devolvido em `:1710-1714`. O pior é `:130`: é a resposta do **login** na Rodonaves — se a
API devolver eco de credencial ou da URL com chave na mensagem, isso sai no corpo HTTP.
Também `db-health-weekly-report/index.ts:225-226` e `resend-email/index.ts:60-61`.

**Impacto no negócio.** Quem chama a API descobre o desenho interno do banco lendo mensagens de erro — é o
primeiro passo de quem procura por onde entrar. E mensagem de erro de parceiro, que pode conter credencial,
chega a quem chamou.

**Locais:** os 22 pontos acima + `lalamove-api/index.ts:53,58`, `rodonaves-api/index.ts:130-134,189,222,637,1710-1714`

**Padrão de referência:** `supabase/functions/external-db-bridge/index.ts:367-375` — erro de validação vira
resposta estruturada, qualquer outro vira `{"error":"INTERNAL_ERROR"}` com o detalhe apenas no log. Também
corretos: `secure-store/index.ts:91`, `carrier-webhook-receiver/index.ts:221-227`. São **3 de 44**.

→ Etapas **164** a **178**

**Estado (2026-11-24):** RESOLVIDO (etapas 164, 178).

## B-07 — Vinte e cinco funções fixam `Access-Control-Allow-Origin: "*"` e ignoram a lista de origens

- **Camada:** edge function · **Severidade:** **Alta** (para as 20 que manipulam dado); **Baixa** para as outras 5 · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/_shared/cors.ts:30-45` resolve a origem contra `ALLOWED_ORIGINS` e só
cai em `*` quando a variável não está configurada. **16 das 44** funções o importam. Outras **25** escrevem
`"*"` fixo no próprio arquivo, ignorando `ALLOWED_ORIGINS` por completo:

`check-password-breach:6` · `resend-email:6` · `carrier-webhook-receiver:56` · `geocode-address:6` ·
`whatsapp-notification:7` · `log-security-event:9` · `bitrix24-integration:7` · `validate-login:7` ·
`get-weather-data:6` · `nexus-webhook-receiver:11` · `send-password-reset:6` · `ocr-receipt-processor:8` ·
`rodonaves-webhook:10` · `push-send:12` · `nexus-auto-healing:6` · `new-device-alert:8` ·
`execute-protocol:5` · `log-login-attempt:6` · `health:5` · `normalize-freight-response:10` ·
`webhook-status:7` · `accuracy-weekly-digest:19` · `secure-store:10` · `get-mapbox-token:4` ·
`ingest-biosync:6`

**Prioridade dentro do grupo.** Não são iguais:

- **Manipulam dado ou têm efeito real (20):** `secure-store` (guarda segredo) e `get-mapbox-token` (entrega
  token) são os mais graves — qualquer página na internet faz a requisição usando a sessão do visitante e lê
  a resposta. Depois: `resend-email`, `whatsapp-notification`, `push-send`, `new-device-alert`,
  `send-password-reset`, `validate-login`, `log-login-attempt`, `log-security-event`,
  `check-password-breach`, `bitrix24-integration`, `execute-protocol`, `ingest-biosync` (biometria de
  motorista — matéria de LGPD), `ocr-receipt-processor`, `webhook-status`, `normalize-freight-response`,
  `nexus-auto-healing`, `accuracy-weekly-digest`, `geocode-address`.
- **Webhook servidor-a-servidor — `*` é irrelevante, navegador não chama (3):**
  `carrier-webhook-receiver`, `rodonaves-webhook`, `nexus-webhook-receiver`. O controle real é o HMAC.
  **Não gaste etapa com estas três.**
- **Healthcheck sem dado (2):** `health`, `get-weather-data`.

**Ponto limpo:** **todas as 44** tratam `OPTIONS` (preflight). E as 3 funções sem CORS nenhum
(`db-health-snapshot`, `db-health-weekly-report`, `db-regression-monitor`) são chamadas por agendamento —
não é defeito.

**Impacto no negócio.** Um site qualquer pode chamar essas funções pelo navegador de quem está logado no
sistema e ler o retorno — inclusive o que guarda segredo e o que entrega o token do mapa.

**Padrão de referência:** `supabase/functions/external-db-bridge/index.ts:2` → `getCorsHeaders(req)`.

→ Etapas **179** a **198**

**Estado (2026-11-24):** RESOLVIDO (etapas 179, 198).

## B-08 — `ingest-biosync` grava telemetria de dispositivo sem nenhuma deduplicação

- **Camada:** edge function · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/ingest-biosync/index.ts:21` faz o parse e `:38-48` insere em
`bio_sync_telemetry`, mais `:55` em `nexus_tactical_logs` — sem `idempotency.ts`, sem `upsert`, sem chave
única. É, além disso, uma das duas funções que ninguém chama (A-09).

**Impacto no negócio.** Reenvio do mesmo dado de batimento duplica a telemetria e dispara alerta repetido
para o mesmo motorista.

**Locais:** `supabase/functions/ingest-biosync/index.ts:21`, `:38-48`, `:55`

→ Etapa **199**

**Estado (2026-11-24):** RESOLVIDO (etapas 199).

## B-09 — `push-send` chama o provedor de push sem tempo limite nem disjuntor

- **Camada:** edge function · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/push-send/index.ts:7`, `:160` — usa `webpush.sendNotification` da
biblioteca, que fala com FCM/APNs internamente e não passa por `safeFetch`.

**Impacto no negócio.** Lentidão do Google ou da Apple trava o envio do lote de notificações.

→ Etapa **200**

**Estado (2026-11-24):** RESOLVIDO (etapas 200).

## B-10 — Comentário promete retentativa que o código não tem

- **Camada:** edge function · **Severidade:** **Baixa** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `supabase/functions/_shared/fetch-with-timeout.ts:3` diz, em comentário, que o helper tem
"retry logic". O código (`:5-28`) implementa **só** tempo limite. Nenhuma das 44 funções faz retentativa com
espera progressiva.

**Causa raiz.** Comentário desatualizado — e o pior tipo, porque o próximo agente lê "tem retry" e não
implementa onde precisa.

**Nota de ordem, importante:** **não implemente retentativa agora.** Com a idempotência quebrada de B-01 e
B-02, retentativa só multiplica a duplicação. A ordem correta é: B-01, B-02, e só então avaliar retentativa.
A etapa aqui é **corrigir o comentário**, não acrescentar a funcionalidade.

**Locais:** `supabase/functions/_shared/fetch-with-timeout.ts:3`

→ Etapa **201**

**Estado (2026-11-24):** RESOLVIDO (etapas 201).

---

# Grupo P — Performance

## P-01 — Cinco leituras que baixam a tabela inteira, sem teto nenhum

- **Camada:** hook/interface + banco · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Cinco consultas de listagem sem `.limit()` e sem `.range()`, em tabelas que crescem sem
parar:

| Local                                              | Tabela                   | Agravante                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/hooks/logistics/useTrackingAnalytics.tsx:123` | `rastreamento_historico` | `select('*')`; o filtro de data é **opcional** e o único chamador, `src/pages/Analytics.tsx:71`, chama `useTrackingAnalytics()` **sem argumentos** → nenhuma data, nenhum teto |
| `src/hooks/logistics/useLogisticsCalendar.tsx:36`  | `coletas`                | só filtra `data_prevista_coleta` não nula; com joins de transportadora/fornecedor                                                                                              |
| `src/hooks/logistics/useLogisticsCalendar.tsx:98`  | `entregas`               | idem para `previsao_entrega`                                                                                                                                                   |
| `src/hooks/logistics/useCotacoesMulticanal.tsx:51` | `cotacoes_multicanal`    | `select("*")` + join **e `refetchInterval: 30000`** (`:67`) — rebaixa tudo a cada 30 segundos                                                                                  |
| `src/pages/Notificacoes.tsx:79`                    | `notifications`          | **o pior caso** — ver P-02                                                                                                                                                     |

`rastreamento_historico` é a tabela de maior crescimento do sistema (uma linha por consulta de rastreio),
e é justamente a que a tela de Analytics baixa inteira.

**Causa raiz.** Nenhuma consulta do front usa paginação no servidor: `grep -rn '\.range(' src/` devolve
**zero**. `src/hooks/common/usePagination.ts:57` é `data.slice(...)` em memória, usado por 18 telas. O teto
por `.limit()` foi aplicado caso a caso (e **na maioria está presente** — ver abaixo), mas não existe um
padrão que force isso.

**Impacto no negócio.** A tela de Analytics e o Calendário Logístico ficam mais lentos a cada semana de
operação e um dia travam o navegador de quem abrir — sem aviso, e primeiro nos computadores mais fracos.

**Crédito e armadilha (para o executor não "consertar" o que está certo):** a maioria das listagens **já tem
teto no servidor** e **não deve ser mexida**: `Envios.tsx:353` (500), `Coletas.tsx:122` (500),
`Ocorrencias.tsx:137` (500), `KanbanEntregas.tsx:268` (500), `PainelSLA.tsx:155,182` (500),
`ExportacaoDados.tsx:110` (5000), `RelatorioPDF.tsx:91` (2000), `useConciliacao.tsx:123` (2000),
`AuditTrail.tsx:30` (5000), `AdminTelemetria.tsx:51` (500), `TelemetryViewer.tsx:45` (100),
`useUnifiedTracking.tsx:138,167` (200), `useDrillDown.tsx:67,82` (100), `useGlobalSearch.tsx:57,76` (5),
`useSecurityEvents.ts:33-57` (100), `useAccuracyMetaCycle.ts:62` (1). Também foram avaliadas e **descartadas**
as leituras de registro único e as de domínio pequeno (`transportadoras`, `clientes`, `fornecedores`,
`permissions`, `achievements`, `reward_items`, `feature_flags`, `tabelas_frete`, `transportadora_rotas`).

**Padrão de referência:** para o **teto**, `src/hooks/notifications/useNotifications.tsx:35` (`.limit(50)`
com filtro por `user_id`). Para **paginação no servidor não existe padrão no repositório** — a primeira etapa
que a implementar define o padrão, e por isso deve ser feita com cuidado e citada nas seguintes.

→ Etapas **202** a **211**

**Estado (2026-11-24):** PARCIAL (feito 202; falta 211 — aguarda o dono).

## P-02 — Notificações baixa o histórico inteiro e pagina no navegador, e o tempo real rebaixa tudo a cada aviso

- **Camada:** interface + hook · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/pages/Notificacoes.tsx:79` — `.select("*").eq("user_id", user.id).order("created_at",
{ascending:false})`, sem teto. Depois, `:105` — `usePagination(filteredData, { initialPageSize: 15 })`, que
corta 15 por página **em memória**. Paginar no cliente depois de baixar tudo não economiza nada; só esconde
o custo. E `:88-93` registra `useRealtime` chamando `refetch()` em todo insert/update/delete — a tabela
inteira é rebaixada **a cada notificação nova**.

O contraste está no mesmo repositório: `src/hooks/notifications/useNotifications.tsx:35` faz a mesma leitura
**com** `.limit(50)`. O teto existe no hook e falta na página.

**Impacto no negócio.** Quem usa o sistema todo dia acumula notificações; em alguns meses, abrir a tela de
notificações passa a demorar — e cada aviso novo que chega recarrega a lista inteira.

**Locais:** `src/pages/Notificacoes.tsx:79`, `:88-93`, `:105`

→ Etapas **212** a **216**

**Estado (2026-11-24):** RESOLVIDO (etapas 212, 216).

## P-03 — Consulta por item de lista em três hooks de indicadores

- **Camada:** hook · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.**

- `src/hooks/logistics/useAccuracyMetaCycle.ts:55` — `rows.map(async (s) => ...)` com **2 consultas por
  linha**: `supabase.rpc("count_prediction_breach_days")` (`:57`) e `.from("notifications")` (`:62`).
- `src/hooks/analytics/useKPIBenchmark.tsx:41` — `for (let i = 0; i < periodsBack; i++)` com 3 consultas
  dentro (`:47` entregas, `:57` coletas, `:68` ocorrencias), **em sequência** (`await` dentro do laço). Com
  `periodsBack = 6` são **18 idas ao banco uma após a outra** antes de a tela aparecer.
- `src/hooks/analytics/useExecutiveMetrics.tsx:40` — mesmas 18 consultas, mas em paralelo
  (`Promise.all`). Severidade **Baixa**; agregável numa consulta com agrupamento no servidor.

**Armadilha:** não confunda com os laços que **não** consultam por item. `useComments.tsx:46` e
`ExpeditionDetailsDialog.tsx:117` montam um conjunto de ids e fazem **uma** consulta com `in(...)` — é o
padrão **correto** e deve ser copiado, não mexido. Também descartados: `NexusCoverageMap.tsx:55`,
`useSLANotifications.tsx:283,299`, `useCostAlerts.tsx:201`.

**Impacto no negócio.** O painel de indicadores demora visivelmente para abrir, e a espera cresce com o
número de períodos comparados.

→ Etapas **217** a **221**

**Estado (2026-11-24):** RESOLVIDO (etapas 217, 221).

## P-04 — `select("*")` em tabelas largas

- **Camada:** hook/interface · **Severidade:** **Média** (onde há teto) · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Contagem de colunas em `src/integrations/supabase/types.ts`: `entregas` **33**,
`coletas` **31**, `cotacoes_multicanal` **23**.

- `entregas`: `src/pages/Envios.tsx:353` (+2 joins, teto 500), `useDrillDown.tsx:82` (100),
  `RelatorioPDF.tsx:91` (2000), `useSLANotifications.tsx:277` (50),
  `src/features/logistics/services/LogisticsService.ts:8`
- `coletas`: `src/pages/Coletas.tsx:122` (+2 joins, 500), `useDrillDown.tsx:67` (100),
  `useSLANotifications.tsx:291` (50)
- `cotacoes_multicanal`: `useCotacoesMulticanal.tsx:51` (**sem teto** — é o mesmo caso de P-01)

**Descartadas por serem estreitas (≤13 colunas), avaliadas explicitamente:** `audit_logs`, `notifications`,
`ocorrencias`, `telemetry_logs`, `query_telemetry`, `fretes_internos`.

**Correção de rota:** uma versão anterior deste achado afirmava que `rastreamento_historico` não aparecia
em `types.ts`. **Está errado** — aparece em `src/integrations/supabase/types.ts:3541`, com 13 colunas, mais
as partições a partir de `:3594`. Sendo estreita, `select('*')` nela não é problema de largura; o problema
dela é a ausência de teto (P-01).

**Impacto no negócio.** Onde há teto, o custo é banda e serialização de colunas nunca mostradas na tela
(inclusive campos `jsonb`) — mais lento para quem usa 4G ou internet ruim.

→ Etapas **222** a **227**

**Estado (2026-11-24):** PARCIAL (feito 227; falta 222 — aguarda o dono).

## P-05 — Dois filtros muito usados sem índice que sirva

- **Camada:** banco · **Severidade:** **Alta** · **Confiança:** **HIPÓTESE — NÃO VERIFICADO contra o banco ao vivo** · **Método:** RASTREADO

**Problema hoje.** Cruzando os filtros reais das listagens com os `CREATE INDEX` das migrations:

1. **`entregas (status, previsao_entrega)` não existe.** `src/pages/PainelSLA.tsx:155` filtra
   `in("status", [despachado, em_transito, saiu_entrega])` + `not("previsao_entrega","is",null)` e **ordena
   por `previsao_entrega`**. Existe `idx_entregas_status_created (status, created_at DESC)`
   (`20260314175252_...sql:3`) — a ordenação é por outra coluna, então o banco ordena em memória. Existe
   `idx_entregas_previsao ON (previsao_entrega) WHERE data_entrega_efetiva IS NULL`
   (`20260711183937_...sql:5`) — mas o predicado parcial **não aparece na consulta**, logo o planejador não
   pode usá-lo. E o Painel SLA recarrega a cada 5 minutos (`PainelSLA.tsx:170`).
2. **Desigualdade de status sem índice parcial.** `src/pages/KanbanEntregas.tsx:268` usa
   `.not("status","eq","finalizado")` e `src/hooks/logistics/useDeliveryRoutes.tsx:157` usa
   `not('status','in',(...))`. Índice de igualdade não serve para desigualdade, e não há índice parcial do
   tipo `WHERE status <> 'finalizado' AND deleted_at IS NULL`.

Menores, também sem índice composto: `telemetry_logs (severity, created_at DESC)` (existem os dois
separados, `20260512162404_...sql:46-47`) e `entregas/coletas (transportadora_id, created_at)` (existem
`(transportadora_id, status)`, `20260711194640_...sql:4,20`) — este último com teto de 100, impacto pequeno.

**Filtros que **estão** cobertos (avaliados, sem achado — não mexer):** `deleted_at` + `created_at` em
entregas/coletas, `coletas (status, data_prevista_coleta DESC)`, `notifications (user_id, created_at DESC)`,
`cotacoes_multicanal (created_at DESC)`, `ocorrencias (created_at)`, `audit_logs (created_at DESC)` e
`(record_id, created_at DESC)`, `query_telemetry (created_at)`, `rastreamento_historico (recorded_at)` e
`(lalamove_order_id)`.

**O que falta para confirmar.** O estado real dos índices em produção. Antes de criar qualquer índice:

```sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('entregas','coletas','telemetry_logs');
```

**Impacto no negócio.** O Painel SLA — a tela que diz quais entregas estão atrasadas — recarrega a cada 5
minutos fazendo o banco ordenar a lista inteira em memória.

→ Etapas **228** a **233**

**Estado (2026-11-24):** ABERTO (228 — aguarda o dono; 233 — não executada).

## P-06 — Índices duplicados: a maior parte **já foi removida**; sobram cinco candidatos

- **Camada:** banco · **Severidade:** **Média** · **Confiança:** **HIPÓTESE — NÃO VERIFICADO** · **Método:** RASTREADO

**Este achado é, antes de tudo, um aviso de método.** Uma varredura só pelos `CREATE INDEX` das migrations
aponta **12 pares/trios** de índices duplicados. Está errado: a migration
`supabase/migrations/20260831130000_index_dedupe_and_realtime.sql` — cujo cabeçalho diz _"Plano v2 etapas
13-16, 18-20 (2026-08-31). **Aplicado no destino e na origem**"_ — já removeu a maioria deles:

| Índice                                                         | Situação                 |
| -------------------------------------------------------------- | ------------------------ |
| `idx_entregas_status_created`                                  | **removido** (`:23`)     |
| `idx_entregas_cliente`                                         | **removido** (`:22`)     |
| `idx_coletas_fornecedor`                                       | **removido** (`:14`)     |
| `idx_ocorrencias_entrega`, `idx_ocorrencias_coleta`            | **removidos** (`:27-28`) |
| `brin_audit_logs_created_at`, `idx_audit_logs_created_at_brin` | **removidos** (`:3-4`)   |
| `gin_audit_logs_new_data`                                      | **removido** (`:5`)      |
| `idx_rastreamento_coleta`, `idx_rastreamento_order`            | **removidos** (`:9-10`)  |

**Sobram cinco candidatos**, nenhum com `DROP INDEX` em migration alguma (verificado nome a nome):

1. `rastreamento_historico (lalamove_order_id)` — `idx_rastreamento_historico_order`
   (`20251215184000_...sql:18`) e `idx_rastreamento_lalamove_order` (`20260513191342_...sql:52`)
2. `rastreamento_historico (coleta_id)` — `idx_rastreamento_historico_coleta`
   (`20251215184000_...sql:19`) e `idx_rastreamento_historico_coleta_id` (`20260711194400_...sql:49`)
3. `entregas (transportadora_id)` — `idx_entregas_transportadora` (`20260515144557_...sql:27`) e
   `idx_entregas_transportadora_id` (`20260711194400_...sql:18`)
4. `coletas (transportadora_id)` — `idx_coletas_transportadora` (`20260515144557_...sql:29`) e
   `idx_coletas_transportadora_id` (`20260515142608_...sql:41`)
5. `audit_logs` — `idx_audit_logs_table_record (table_name, record_id)` (`20260314181126_...sql:19`) e
   `idx_audit_logs_record_id_table (record_id, table_name)` (`20260513192805_...sql:2`), sendo que
   `idx_audit_logs_record_id_created` (`20260513193049_...sql:3`) já atende as consultas reais do front

Os dois primeiros doem mais: `rastreamento_historico` recebe uma linha por consulta de rastreio, e cada
índice redundante é pago em **toda** gravação.

**O que falta para confirmar.** Quais desses existem de fato hoje:

```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename IN ('rastreamento_historico','entregas','coletas','audit_logs')
ORDER BY tablename, indexname;
```

**Armadilha central:** **nunca** rode `DROP INDEX` a partir da leitura das migrations. Elas são histórico, e
este achado é a prova — 7 de 12 "duplicados" já tinham sido removidos há três meses. Confirme no banco, e
confirme também o uso (`pg_stat_user_indexes`) antes de remover.

→ Etapas **234** a **240**

**Estado (2026-11-24):** ABERTO (234, 240 — aguarda o dono).

---

# Grupo H — Higiene, CI e documentação que engana

> Num repositório mantido só por agentes de IA, que são **obrigados** a ler a documentação antes de agir,
> documento errado não é ruído: é instrução errada que faz o próximo agente estragar produção. Por isso este
> grupo tem severidade alta em alguns itens — ao contrário do que "documentação" normalmente sugere.

## H-01 — `ESTADO_ATUAL.md` descreve o banco errado, de três meses atrás, e manda consertar o que já está certo

- **Camada:** documentação · **Severidade:** **Crítica** · **Confiança:** confirmado · **Método:** EXECUTADO

**Problema hoje.** `ESTADO_ATUAL.md` (57 KB) e `ESTADO_ATUAL_EVIDENCIAS.md` (40 KB) — 98 KB de diagnóstico:

- `ESTADO_ATUAL.md:3` — "executada em **16/08/2026** sobre o commit `513ab5a`"
- `ESTADO_ATUAL_EVIDENCIAS.md:3` — "projeto Supabase **`hgicfqjayrjurivtygqf`**" — que o próprio `AGENTS.md`
  classifica como _"**Não escrever** … Lovable Cloud, origem do cutover — só referência de paridade"_. **É o
  banco que não é produção.**

Três afirmações centrais, refutadas por medição nesta sessão:

| Afirmação                                           | Onde                            | Realidade (medida)                                             |
| --------------------------------------------------- | ------------------------------- | -------------------------------------------------------------- |
| "🔴 **Typecheck — 21 erros** — o orçamento exige 0" | `ESTADO_ATUAL.md:24`            | `npx tsc --noEmit` → **0 erros**, exit 0                       |
| "🔴 **Lint — não executa: crash de configuração**"  | `ESTADO_ATUAL.md:25`            | `npx eslint .` → roda, **105 warnings, 0 erros**; orçamento OK |
| "`supabase/migrations/*.sql` \| **230**"            | `ESTADO_ATUAL_EVIDENCIAS.md:19` | **248**                                                        |

**Causa raiz.** Um retrato de um momento ficou na raiz do repositório com nome de estado presente
("ESTADO_ATUAL"), sem aviso de validade e apontando para o banco errado.

**Impacto no negócio.** O arquivo com o nome mais convidativo do repositório manda o próximo agente gastar
tempo consertando lint e typecheck que já estão verdes, num banco onde ele não tem permissão para escrever.
É o documento mais caro do repositório, medido em trabalho desperdiçado.

**Locais:** `ESTADO_ATUAL.md:3`, `:24`, `:25`; `ESTADO_ATUAL_EVIDENCIAS.md:3`, `:19`

**Armadilha:** não apague. São 98 KB de evidência histórica que pode ser útil para entender o cutover. O que
resolve é um aviso no alto, com data, commit, **qual banco** e o que já não vale.

→ Etapas **241**, **242**, **243**

**Estado (2026-11-24):** RESOLVIDO (etapas 241, 242, 243).

## H-02 — `DOCUMENTATION.md` cita 29 caminhos errados e 10 componentes que não existem

- **Camada:** documentação · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `DOCUMENTATION.md` (31 KB) descreve a árvore antes da reorganização de hooks por domínio
(ADR 0008):

- `:34` diz `src/hooks/useAuth.tsx`; o arquivo está em `src/hooks/auth/useAuth.tsx`. **Mais 28 linhas com o
  mesmo erro** (`useGamification`, `useDebounce`, `useAuditLogs`, `useDashboardMetrics`, `useDrillDown`,
  `useExport`, `useBoxManagement`, `useFreightQuotation`, `useConciliacao`, `useNotifications`,
  `usePushNotifications`, `useGeocoding`, `useKPIBenchmark`, `useCostAlerts`, `useLogisticsCosts`,
  `useLogisticsCalendar`, entre outros).
- **Dez componentes citados que não existem em lugar nenhum:** `DeliveryMap.tsx` (`:212`),
  `DriverTrackingMap.tsx` (`:213`), `TrackingHeatmap.tsx` (`:217`), `MonthlyComparisonChart.tsx` (`:134`),
  `RegionHeatmap.tsx` (`:138`), `DemandForecastChart.tsx` (`:139`),
  `TransportadoraComparisonChart.tsx` (`:140`), `KPIBenchmarkDashboard.tsx` (`:137`),
  `XPProgressCard.tsx` (`:83`), `PushNotificationSettings.tsx` (`:244`).
- `:499`, `:505` — "i18n (custom) \| `src/i18n/index.ts`, `src/i18n/locales/`". `src/i18n/` não existe (é o
  arquivo `src/i18n.ts`), e a biblioteca não é própria: `package.json:94,111` traz `i18next@^26.2.0` e
  `react-i18next@^17.0.13`.

**Impacto no negócio.** O agente procura o componente citado, não encontra, conclui que a funcionalidade não
existe — e **cria um segundo componente duplicado ao lado**. É assim que nasce a duplicação que depois
ninguém sabe qual é a boa.

→ Etapas **244** a **248**

**Estado (2026-11-24):** PARCIAL (feito 244; falta 248 — aguarda o dono).

## H-03 — `AGENTS.md` erra em quatro pontos, um deles é a regra de merge

- **Camada:** documentação/CI · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** EXECUTADO

**Problema hoje.** Quatro divergências entre o `AGENTS.md` e a realidade medida:

| #   | `AGENTS.md` diz                                                                          | Realidade                          | Como foi verificado                                                                                                                                 | Gravidade                            |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | "**9 required checks** verdes"                                                           | **10**                             | API do GitHub (`required_status_checks.contexts`) e `scripts/ci/github-settings-baseline.json:22-33`. O décimo é **"Contratos da automação local"** | **a mais grave: é a regra de merge** |
| 2   | repo "**privado**"                                                                       | **público**                        | API do GitHub: `"visibility":"public"`                                                                                                              | ver S-07                             |
| 3   | edge functions com "deploy **manual** pelo `deploy-functions.yml` (`workflow_dispatch`)" | **automático** em push para `main` | `.github/workflows/deploy-functions.yml:9-13`: `on: push: branches: [main], paths: ['supabase/functions/**']`                                       | **alta**                             |
| 4   | "as **244 migrations**"                                                                  | **248**                            | `ls supabase/migrations/*.sql \| wc -l`                                                                                                             | baixa                                |
| 5   | workflow "`.github/workflows/contexto.yml`"                                              | o arquivo é `contexto-ia.yml`      | `ls .github/workflows/`                                                                                                                             | baixa                                |

**Sobre o item 1.** O agente conta nove verdes, vê o décimo pendente, conclui que o conjunto está completo e
mergeia. Com `strict = false` (confirmado na API), nada o impede.

**Sobre o item 3.** O agente mergeia uma PR que toca `supabase/functions/**` acreditando que **nada** foi
para produção, e não confere o deploy. Na verdade a função já está publicada. O `AGENTS.md` ainda reforça
"nunca `supabase functions deploy` direto", o que faz o agente acreditar que o caminho é controlado.

**Confirmados e corretos (não mexer):** "44 edge functions" (45 diretórios, um é `_shared`);
`lintWarnings: 105`, `lintErrors: 0`, `tsErrors: 0`; "não existe hook `commit-msg`" (`.husky/` só tem
`pre-commit`); todos os arquivos citados existem (`scripts/ops/set_missing_secrets.sh`,
`docs/adr/0014-security-definer-rls-pattern.md`, `docs/SOFT_DELETE_POLICY.md`, os 6 `docs/agentes/*.md`);
todos os scripts npm citados existem; `bun.lock`/`bun.lockb` realmente não são usados por workflow nenhum.

**Locais:** `AGENTS.md` (seções Fluxo Git, Serviços, Banco); `.github/workflows/deploy-functions.yml:9-13`;
`scripts/ci/github-settings-baseline.json:22-33`

**Armadilha:** `AGENTS.md` é protegido pelo check "Agents Docs Integrity"
(`node scripts/ci/check-claude-md-integrity.mjs`). Rode esse script depois de editar, ou a CI barra.

→ Etapas **249** a **255**

**Estado (2026-11-24):** PARCIAL (feito 249; falta 255 — aguarda o dono).

## H-04 — `docs/prod-readiness.md` afirma paridade que já não existe

- **Camada:** documentação · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `docs/prod-readiness.md:3` — "Fechamento: 2026-11-14 · main `fee186d3`". É o documento
mais recente e mais confiável do repositório, e duas contagens já caducaram:

- `:25` — "`GET /functions` → 43 ACTIVE; local **44 dirs**; diff API↔local = **0**". Hoje são **45**
  diretórios (44 funções + `_shared`): `push-send/` entrou em 2026-11-22 (`d37ba30`). O "diff = 0" não vale.
- `:31` — "**OK** migrations banco 243 = repo 243 (0 de diferença)". O repo tem **248**.

**Confirmado e correto:** `:9` "61 rotas" — `grep -c "path=" src/App.tsx` = 61.

**Impacto no negócio.** Um agente lê "paridade entre repositório e produção: zero diferença", mergeia
confiando nisso, e a produção está três funções e cinco migrations atrás.

→ Etapas **256**, **257**

**Estado (2026-11-24):** PARCIAL (feito 256; falta 257 — aguarda o dono).

## H-05 — Dois documentos declaram "perfeição 10/10" enquanto a dívida está congelada

- **Camada:** documentação · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `docs/PERFEICAO_10_10.md:1` — "Estado de **Perfeição Técnica Absoluta (10/10)** atingido,
sustentado e blindado end-to-end" (`:57`: "2026-07-12"). Mais `docs/RELATORIO_PERFEICAO_FINAL.md`, sem data.

**Em favor dos documentos:** as afirmações **concretas** deles se sustentam — a rota `/admin/db-health`
existe (`src/App.tsx:174`), as RPCs `get_top_queries_fast` e `get_cron_jobs_status` existem, o
`RUNBOOK_DB_PERFORMANCE.md` e os ADRs 0009-0014 existem. **Nenhuma foi refutada.** O problema é só o
enquadramento: "perfeição absoluta" convive com `.warning-budget.json` em 105 avisos, cujo próprio
comentário chama a dívida de _"congelada, não paga"_.

**Impacto no negócio.** Documento que diz "está perfeito" desencoraja o próximo agente de olhar o que está
pendente — e é justamente o que esta auditoria encontrou.

→ Etapa **258**

**Estado (2026-11-24):** RESOLVIDO (etapas 258).

## H-06 — `docs/MELHORIAS.md` e `PLANO_MELHORIAS_2026.md`: o aviso está no alto, o erro está no meio

- **Camada:** documentação · **Severidade:** **Média** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** Ambos abrem com _"**ATENCAO**: este documento pode descrever funcionalidades NAO
implementadas"_ (`docs/MELHORIAS.md:3`, `docs/PLANO_MELHORIAS_2026.md:3`) — o cuidado existe. Mas o conteúdo
tem erro verificável: a tabela "Hooks Reais Implementados" de `docs/MELHORIAS.md` diz
"useAnalytics → **useAnalyticsReal**", e `grep -rn "useAnalyticsReal" src/` devolve **zero** — esse hook
nunca existiu; o real é `src/hooks/analytics/useAnalytics.tsx`. E `:14` diz "Edge Functions | 1"; são 44.

**Causa raiz.** O aviso de validade salva quem abre o arquivo pelo começo; quem chega por busca cai direto na
tabela errada.

→ Etapas **259**, **260**

**Estado (2026-11-24):** RESOLVIDO (etapas 259, 260).

## H-07 — `TEMPLATE_STRUCTURE.md` ensina a violar a convenção do próprio repositório

- **Camada:** documentação · **Severidade:** **Baixa** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `TEMPLATE_STRUCTURE.md` (35 KB) é guia para criar um projeto novo, não descrição deste. Só
que manda criar `src/hooks/usePagination.ts`, `useFilters.ts`, `useSorting.ts`, `useDebounce.ts`,
`useLocalStorage.ts`, `useAuth.tsx` **na raiz** de `src/hooks/` (`:658`, `:708`, `:749`, `:805`, `:827`,
`:873`) — contrariando o ADR 0008, que organiza por domínio (e é onde os arquivos realmente estão:
`src/hooks/common/useDebounce.ts`, `src/hooks/auth/useAuth.tsx`).

**Impacto no negócio.** Um agente que siga o template cria hook na raiz e quebra a convenção do repositório.

→ Etapa **261**

**Estado (2026-11-24):** RESOLVIDO (etapas 261).

## H-08 — Imprecisão menor nos planos de etapas

- **Camada:** documentação · **Severidade:** **Baixa** · **Confiança:** confirmado · **Método:** RASTREADO

**Nota de crédito, importante para não gerar trabalho inútil:** os seis `docs/PLANO_*_ETAPAS.md` **são
honestos** e não são o problema. Todos declaram commit-base, método e, explicitamente, _"**Estado:** plano.
Nenhuma etapa executada"_, além de uma seção "Não verificado" (`PLANO_BRASPRESS...:11-13`,
`PLANO_TRANSPORTADORAS...:12`, `PLANO_UX_NAVEGACAO...:13`, `PLANO_GOOGLE_MAPS...:11`,
`PLANO_FRONTEND_CONTRATOS...:14`). **Este plano de QA deve seguir esse padrão.**

A única imprecisão: `PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md:3` diz "43 edge functions"; hoje são 44.

→ Etapa **262**

**Estado (2026-11-24):** RESOLVIDO (etapas 262).

## H-09 — A fonte que o protocolo manda ler como dona do fato "banco" nunca foi gerada

- **Camada:** ferramentas de contexto · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** EXECUTADO

**Problema hoje.** `docs/contexto/00-INDEX.md` (branch `contexto`) define três fontes com um dono cada, e
manda, na "Ordem de leitura antes de qualquer tarefa", consultar o **banco real** como item 2. Na própria
tabela do arquivo, a linha desse item diz: `docs/contexto/supabase/` — **"(ainda não existe — o produtor não
rodou)"**, estado **"ainda não gerado"**.

Confirmado: `git ls-tree -r origin/contexto -- docs/contexto` lista `codigo/` e `regras/`; **não há
`supabase/`**.

**Causa raiz — e ela está documentada no próprio repositório.** O produtor existe; o que falta é o segredo
que ele precisa. `.github/workflows/contexto-ia.yml:237-243`:

```bash
if [ -z "${SUPABASE_DB_URL:-}" ]; then
  # Sem o secret nao ha o que coletar. No agendamento sai verde com aviso para nao pintar
  # 144 runs/dia de vermelho; no dispatch manual falha para a pessoa ver.
  echo "::warning::Secret SUPABASE_DB_URL nao definido - snapshot pulado (...)"
```

Ou seja: sem o segredo `SUPABASE_DB_URL`, o job **sai verde com um aviso** no agendamento. A decisão de não
pintar 144 execuções de vermelho é defensável; o efeito colateral é que a fonte nunca é gerada e **ninguém
fica sabendo**. Ver também `scripts/supabase_snapshot/README.md`.

**Impacto no negócio.** Todo agente que seguir o protocolo do repositório — como esta auditoria seguiu — cai
num vazio justamente na camada mais perigosa de errar. E, sem essa fonte, o agente volta para
`codigo/banco.json`, que é exatamente onde está o falso positivo de F-01.

**Locais:** `docs/contexto/00-INDEX.md` (branch `contexto`), ausência de `docs/contexto/supabase/`,
`.github/workflows/contexto-ia.yml:237-243`, `scripts/supabase_snapshot/README.md`

→ Etapas **263** a **266**

**Estado (2026-11-24):** ABERTO (263, 266 — aguarda o dono).

## H-10 — Orçamento de avisos de lint no teto exato: a próxima etapa que gerar um aviso quebra a CI

- **Camada:** CI · **Severidade:** **Alta** (para a execução deste plano) · **Confiança:** confirmado · **Método:** EXECUTADO

**Problema hoje.** `npm run lint:budget` devolve:

```
[OK] ESLint warnings         105 / 105
[OK] ESLint errors             0 / 0
[OK] TypeScript errors         0 / 0
```

Está **no teto exato**. O check "Warning Budget Gate" é obrigatório para merge. Logo, qualquer etapa que
introduza **um** aviso de lint reprova a CI, e o executor fica entre duas coisas que o plano proíbe: sair do
escopo para refatorar código alheio, ou pedir aumento do orçamento (que o `AGENTS.md` diz exigir decisão do
dono).

**Causa raiz.** O orçamento foi elevado a 105 em 2026-11-08 para congelar a dívida existente, sem deixar
margem para trabalho novo.

**Impacto no negócio.** Sem resolver isto antes, o plano de 300 etapas trava na primeira etapa que gerar um
aviso — e o dono recebe um pedido de decisão no meio da execução, não no começo.

**Locais:** `.warning-budget.json`, `scripts/check-warning-budget.mjs`, `.github/workflows/ci.yml:52-64`

**Caminho recomendado.** Abaixar o número antes de começar, pagando avisos **triviais** com
`npm run lint:budget:ratchet` (o repositório já oferece essa ferramenta e diz que baixar é bem-vindo). Isso
cria margem sem pedir nada ao dono. **Atalho tentador a evitar:** subir o orçamento — isso exige decisão do
dono e esconde dívida nova no meio da velha.

→ Etapas **267**, **268**, **269**

**Estado (2026-11-24):** RESOLVIDO (etapas 267, 268, 269).

## H-11 — Allowlist de vulnerabilidades com três entradas obsoletas

- **Camada:** CI · **Severidade:** **Baixa** · **Confiança:** confirmado · **Método:** EXECUTADO

**Problema hoje.** `npm run security-scan` passa, **e avisa**: `⚠️ Allowlist sem efeito para: xlsx, vite,
picomatch — remova a entrada em scripts/audit-gate.mjs`. Confirmado: `npm audit --json` devolve **zero**
vulnerabilidades em qualquer severidade. As três entradas perdoam algo que já não existe.

**Impacto no negócio.** Uma allowlist com entradas obsoletas pode, no futuro, perdoar uma vulnerabilidade
nova nesses mesmos pacotes sem ninguém notar.

**Locais:** `scripts/audit-gate.mjs`

→ Etapa **270**

**Estado (2026-11-24):** ABERTO (270 — aguarda o dono).

## H-12 — Arquivos versionados que não deveriam estar lá

- **Camada:** repositório · **Severidade:** **Baixa** (`.env` é tratado em S-07) · **Confiança:** confirmado · **Método:** EXECUTADO

**Problema hoje.**

- **Arquivo `x` vazio na raiz**, versionado. `git ls-files` lista `x`; `wc -c x` = **0 bytes**. Entrou no
  commit `0f32426`, claramente sobra de redirecionamento de shell. Sinaliza que nenhum gate de PR barra
  arquivo acidental.
- **`bun.lock` (423 KB) + `bun.lockb` (199 KB)** versionados, e **nenhum workflow usa bun** (o único `bun`
  real em `.github/workflows/` é um comentário em `types-sync.yml:366` dizendo que o lock está defasado do
  `package.json`). São dois arquivos de dependências que mentem, prontos para um agente tomar como fonte.
- Fora isso, `git ls-files` filtrado por `.bak|.orig|.rej|.tmp|.log|.DS_Store|.swp|~` devolve apenas `x`. O
  resto da raiz é configuração legítima.

→ Etapas **271** a **274**

**Estado (2026-11-24):** PARCIAL (feito 271; falta 274 — aguarda o dono).

## H-13 — Nenhuma tela tem teste, e 96,6% dos arquivos de hook também não

- **Camada:** testes · **Severidade:** **Alta** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** De `docs/contexto/codigo/testes.json` (campo `sem_teste`): **61 de 61 telas** sem teste
(100%), **172 de 178 arquivos de hook** sem teste (96,6%), 3 de 44 edge functions, 5 serviços. Há 130
arquivos de teste — 122 unitários, 2 fim-a-fim, 1 de contrato, 5 pytest — concentrados em utilitários e
funções de borda.

Consequência direta para este plano: **a suíte existente não cobre nenhuma das jornadas de negócio**. Rodar
`npx vitest run` dá confiança sobre utilitários, não sobre criar coleta, mover status ou cotar frete. E
`tests/e2e/` precisa de usuário semeado e por isso não roda na CI.

**Impacto no negócio.** Toda correção deste plano vai ser verificada manualmente ou não vai ser verificada. É
a razão pela qual cada etapa adiante traz um comando concreto de verificação em vez de "rode os testes".

→ Etapas **275** a **284**

**Estado (2026-11-24):** ABERTO (275 — não executada; 284 — aguarda o dono).

## H-14 — Observabilidade: o que existe e o que ninguém vê

- **Camada:** observabilidade · **Severidade:** **Média** · **Confiança:** parcialmente **HIPÓTESE** (o DSN do Vercel segue não verificado) · **Método:** RASTREADO

**O que está certo (não mexer):**

- Sentry inicializado e condicionado ao DSN: `src/main.tsx:10-18` — `if (sentryDsn) { Sentry.init({...
tracesSampleRate: 0.1 }) }`.
- Barreira de erro em duas camadas: `src/main.tsx:5,47-49` (raiz) e `src/App.tsx:10,187,206` (árvore de
  rotas), com uma segunda interna em `:197-199`.

**O que falta confirmar.** Se `VITE_SENTRY_DSN` está configurado no Vercel. Sem DSN, **não há captura
nenhuma** — e o código está correto, então não há nada no repositório que indique o problema.

**O que não existe.** Procurando `webhook_failures` e `cron_job_logs` na árvore inteira (`supabase/`, `src/`,
migrations e docs): **zero ocorrências**. Não é o caso de "grava e ninguém lê" — nenhuma função escreve e
nenhuma tela lê. Se essas tabelas existem no banco ao vivo, são tabelas mortas. **Conferido no banco (etapa 287, 2026-11-24): não existem** — `to_regclass` devolve `null` para as duas, e `webhook_deliveries` (o lado de saída) existe. Falha de webhook e falha de
cron, portanto, não têm destino verificável no repositório — e com 28 cron jobs e 4 webhooks ativos, é
bastante coisa acontecendo sem lugar para olhar.

→ Etapas **285** a **290**

**Estado (2026-11-24):** ABERTO (285, 288, 289 e 290 — aguarda o dono). A etapa 287 foi executada e **confirma no banco**: `webhook_failures` e `cron_job_logs` não existem (`to_regclass` = `null`), enquanto `webhook_deliveries` existe. Portanto não há "tabela morta" a decidir — falta criar o destino da falha de **entrada**, que é DDL.

## H-15 — Dois pontos de `innerHTML` com interpolação, e links externos sem `noopener`

- **Camada:** interface · **Severidade:** **Média** / **Baixa** · **Confiança:** confirmado · **Método:** RASTREADO

**Problema hoje.** `src/components/map/MapboxMap.tsx:469` monta o marcador do mapa com `el.innerHTML`
interpolando `color` e `mk.heading` dentro de um SVG. `heading` é dado de rastreamento, que pode chegar por
webhook de transportadora — ou seja, de fora. Os `setHTML` de `:446-447` e `:488` seguem o mesmo caminho.

> **Correção de rota.** A primeira versão deste achado citava `:440` como ponto de interpolação. **Não é** —
> `:440` é uma atribuição de SVG **estático**. Quem interpola é `:469`. E os 4 `target="_blank"` **já têm**
> `rel="noreferrer"`, que nos navegadores atuais implica `noopener`: `TelemetryViewer.tsx:236` e
> `DocumentUploadField.tsx:74` estão corretos e servem de padrão. O ganho ali é de explicitude, não é buraco
> aberto — trate como Baixa de verdade.

**Avaliados e descartados (não são achado):** `src/components/ui/chart.tsx:70` usa
`dangerouslySetInnerHTML` para variáveis de CSS — é código do shadcn, não mexer. Não há `eval` nem
`new Function` em `src/`. Nenhum token ou segredo em `localStorage` (os 49 usos são preferências de
interface).

**Impacto no negócio.** Um valor malformado vindo da transportadora pode injetar marcação na página do mapa.

**Locais:** `src/components/map/MapboxMap.tsx:469`, `:446-447`, `:488`

→ Etapas **291** a **294**

**Estado (2026-11-24):** RESOLVIDO (etapas 291, 294).

---

# Achados descartados (e por quê)

Esta seção existe para o executor **não** abrir etapa sobre eles. Cada um pareceu um problema e não é:

| Suspeita                                                                 | Por que foi descartada                                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| "36 tabelas sem RLS"                                                     | 32 são partições com RLS habilitado por DDL dinâmico (`20260711185045_...sql:1-32`). Ver F-01.                  |
| "12 índices duplicados"                                                  | 7 já removidos por `20260831130000_index_dedupe_and_realtime.sql`, aplicada em produção. Sobram 5. Ver P-06.    |
| "11 funções chamam terceiro sem tempo limite"                            | Falso: `_shared/safeFetch.ts` embute timeout + disjuntor, e as 36 chamadas externas passam por ele.             |
| "17 páginas sem rota"                                                    | São subcomponentes em `src/pages/<area>/`, não telas. As 61 telas têm rota.                                     |
| "`src/hooks/auth/useAuth.ts` não existe"                                 | É `.tsx`. O import está correto.                                                                                |
| "`updateCotacao`/`selectCotacao` nunca são usados"                       | São usados por `DashboardCotacoes.tsx:183-184,230`. O achado real é a duplicação de tela (C-02).                |
| "Guard de rota não checa papel"                                          | Checa: `ProtectedRoute.tsx:31` + `requiredRole="admin"` em 12 rotas.                                            |
| "Chaves de servidor versionadas"                                         | Todas as chaves em arquivo versionado são `"role":"anon"`, verificado decodificando o payload.                  |
| "`.env` tem valores vazios"                                              | Falso: tem valores reais (210 caracteres na chave publicável, 91 no token Mapbox).                              |
| "Vulnerabilidades em dependências"                                       | `npm audit` → 0 em todas as severidades.                                                                        |
| "`setTimeout` simulando trabalho é sistêmico"                            | Localizado em 2 hooks mortos (A-08). Os outros 4 são limitação de taxa e espera de retentativa, legítimos.      |
| "Laços com consulta por item em `useComments`/`ExpeditionDetailsDialog`" | Montam conjunto de ids e fazem **uma** consulta `in(...)` — padrão correto.                                     |
| "Vazamento de pilha de execução nas edges"                               | `grep '.stack'` → zero.                                                                                         |
| "Preflight CORS ausente"                                                 | Todas as 44 tratam `OPTIONS`.                                                                                   |
| "`setInterval` sem limpeza"                                              | Todos os `setInterval` do repositório têm `clearInterval`. O problema é só com `setTimeout` em callback (R-08). |
| "Planos `docs/PLANO_*_ETAPAS.md` descrevem o que não existe"             | São honestos: declaram "nenhuma etapa executada" e trazem seção "Não verificado".                               |
| "`scheduled-reports` tem falha de IDOR"                                  | Já corrigido: `user_id` vem de `auth.claims.sub` (`:25`). Falta só a lista de campos permitidos (B-03).         |
| "`get_rls_audit` não existe"                                             | Existe, em `20260712212132_...sql` — é a ferramenta de verificação de F-02.                                     |
