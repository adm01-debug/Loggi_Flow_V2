# 04 — PLANO DE CORREÇÃO EM 300 ETAPAS

> Gerado por auditoria somente-leitura em 2026-11-22/23, sobre `main` em **`d37ba30`**.
> **Estado: plano. Nenhuma etapa executada.**
> Achados e evidências: `03-ACHADOS.md` · Inventário e cobertura: `01-INVENTARIO.md` ·
> Cenários: `02-CENARIOS.md` · Marcação de progresso: `05-PROGRESSO.md`

---

# Instruções para o agente executor

Você não participou da auditoria e não verá a conversa que a gerou. **Tudo o que você precisa está nos
arquivos desta pasta.** Leia esta seção inteira antes da etapa 001.

## As sete regras

1. **Uma etapa por vez, na ordem, respeitando as dependências.** Cada etapa em sua própria branch e sua
   própria PR, seguindo a convenção do repositório:
   `claude/<fix|feat|chore|ci|docs>-<slug>-<AAMMDD-HHMM>`.
2. **Antes de mudar qualquer coisa, releia a evidência da etapa no código atual.** O plano foi escrito sobre
   `d37ba30`. Se o código já não corresponde ao descrito — porque outro agente mexeu, ou porque a etapa já
   foi feita — **pare, registre em `05-PROGRESSO.md` o que encontrou, e siga para a próxima etapa
   independente.** Não adapte a etapa por conta própria.
3. **Corrija a causa raiz com a menor mudança possível.** Não refatore, não renomeie, não "melhore" e não
   comente o que a etapa não pede. O campo **Não tocar / armadilhas** de cada etapa existe para isso — leia-o.
4. **Problema novo encontrado no caminho não é corrigido na hora.** Vira anotação em `05-PROGRESSO.md`, na
   seção "Achados novos". Resista: a maior causa de plano abandonado é a etapa que virou faxina.
5. **Etapa marcada "Precisa de aprovação humana: sim" fica com a PR aberta, aguardando o dono.** Não mergeie.
   Siga para a próxima etapa independente. Isso vale para toda DDL/migration em produção, CI/workflows,
   segredos, infraestrutura, deleção de dado, mudança de arquitetura ou de custo.
6. **Uma etapa só é concluída com a verificação executada e a evidência anotada.** "Deveria funcionar" não
   conclui etapa. Se não conseguiu executar a verificação, a etapa fica **aberta** e o motivo vai no
   progresso.
7. **Nunca afirme "testado" para o que foi apenas lido.** O plano distingue EXECUTADO de RASTREADO; mantenha
   essa distinção nas suas anotações e nos corpos de PR.

## Antes da etapa 001: cinco coisas que você precisa saber

Estas não são opinião — são condições do terreno, medidas na auditoria. Ignorá-las faz o plano travar.

**1. Rode `npm ci` antes de qualquer gate.** Num clone sem `node_modules`, `npx tsc --noEmit` devolve
**19.705 erros** `TS2307: Cannot find module`. São falsos: com as dependências instaladas o typecheck dá
**0 erros**. Se você vir dezenas de milhares de erros, o problema é o ambiente, não o código.

**2. O orçamento de avisos de lint está no teto exato (105/105).** O check "Warning Budget Gate" é
obrigatório para merge. Qualquer etapa que introduza **um** aviso novo reprova a CI. **Faça as etapas
267, 268 e 269 antes de tudo** — elas abrem margem pagando avisos triviais, sem precisar de decisão do dono.
Não suba o orçamento: isso exige aprovação e esconde dívida nova dentro da velha.

**3. São 10 required checks, não 9.** O `AGENTS.md` diz 9; a API do GitHub e
`scripts/ci/github-settings-baseline.json:22-33` dizem 10. O décimo é **"Contratos da automação local"**.
Confira os dez antes de mergear. E `strict = false`: uma PR atrasada da `main` mergeia mesmo assim, então se
a `main` mexeu no que você tocou, atualize a branch antes.

**4. Merge em `main` que toca `supabase/functions/**` publica a função em produção na hora.**
`.github/workflows/deploy-functions.yml:9-13` dispara em `push` para `main` com esse caminho. O `AGENTS.md`
afirma que o deploy é manual — **está errado** (H-03). Toda etapa de edge function é, na prática, um deploy.

**5. O banco ao vivo não foi auditado.** O projeto Supabase `jvfhclubfpxrtrrazrgr` não ficou acessível na
sessão da auditoria, e `docs/contexto/supabase/` — a fonte que o protocolo do repositório nomeia como dona do
fato "o que existe no banco" — **nunca foi gerada** (H-09). Logo: **toda etapa de banco começa consultando o
banco**, nunca as migrations. As 248 migrations são histórico. O achado P-06 é a prova do custo de esquecer
isso: 7 de 12 "índices duplicados" já tinham sido removidos três meses antes.

## Como ler uma etapa

- **Problema hoje** traz `arquivo:linha`. Abra esse arquivo nessa linha **antes** de mudar (regra 2).
- **Caminho recomendado** é o campo mais importante. Ele diz por onde começar, **que padrão já existente no
  repositório copiar** (com o arquivo de referência) e **que atalho tentador evitar**. Quem escreveu viu o
  código; você não vai ver o que ele viu. Siga o padrão citado em vez de inventar outro.
- **Não tocar / armadilhas** lista o que parece relacionado e vai quebrar se você mexer.
- **Como verificar** é um comando, consulta ou requisição concreta, com o resultado esperado. É isso que
  conclui a etapa.

## Ondas

A ordem das etapas segue estas ondas. Dentro de cada uma, respeite as dependências declaradas.

| Onda  | Tema                                                     | Etapas                            |
| ----- | -------------------------------------------------------- | --------------------------------- |
| **0** | **Destravar a execução** (fazer primeiro, fora de ordem) | 267-269, e leia 020-022 e 249-255 |
| 1     | Segurança e risco de perda de dado                       | 001-061                           |
| 2     | Fluxos principais quebrados                              | 062-067, 083-103                  |
| 3     | Integridade de dados e regras de negócio                 | 028-048, 132-145                  |
| 4     | Funcionalidades incompletas                              | 068-082, 104-122                  |
| 5     | Robustez: erros, estados, concorrência                   | 123-131, 146-201                  |
| 6     | Performance                                              | 202-240                           |
| 7     | Experiência de uso e consistência                        | 097-120 (parte), 291-294          |
| 8     | Higiene: código morto, CI, observabilidade, documentação | 241-290, 295-300                  |

> As faixas se sobrepõem porque a numeração agrupa por **causa raiz** (para o executor corrigir tudo de um
> defeito de uma vez) e a onda classifica por **urgência**. Quando houver conflito, a coluna
> "Onda / Severidade" da própria etapa decide.

## Convenções dos campos

- **Precisa de aprovação humana: sim** → PR aberta, sem merge, e avise o dono. Nunca mergeie estas.
- Onde a etapa diz "confirme no banco antes", a consulta faz parte da etapa. Se não tiver acesso ao banco,
  a etapa fica **aberta** com esse motivo no progresso — não prossiga por suposição.
- Toda etapa de edge function precisa, além do merge, da confirmação do deploy (ver "5 coisas", item 4).

---

# ETAPAS

## Onda 1 — Segurança e risco de perda de dado (001-061)

### Etapa 001 — Remover a condicional que desliga a verificação de assinatura do webhook do Nexus

**Onda / Severidade / Camada:** 1 / Crítica / edge function
**Achados resolvidos:** S-01
**Problema hoje:** `supabase/functions/nexus-webhook-receiver/index.ts:37` envolve a verificação HMAC em
`if (Deno.env.get("NEXUS_WEBHOOK_SECRET")) { ... }`. Sem o segredo no ambiente, o bloco é pulado e a
requisição segue **sem verificação alguma**. O comentário em `:36` afirma "fail-closed"; o código faz o
oposto.
**Causa raiz:** condicional externa anulando um helper que já trata o caso de segredo ausente
(`_shared/webhookSignature.ts:13-17` devolve `false` quando não há segredo).
**Caminho recomendado:** remova o `if` externo e chame `verifyWebhookHmac` direto, exatamente como
`supabase/functions/carrier-webhook-receiver/index.ts:90-96` faz. Corrija também o comentário da linha 36
para descrever o que o código passa a fazer. **Atalho tentador a evitar:** "primeiro descobrir se o segredo
está configurado em produção, para não quebrar o webhook". Não espere por isso — se o segredo não estiver
setado, o webhook **tem** de recusar; é essa a correção. Confirmar o segredo é a etapa 002, e é independente.
**Arquivos e objetos a tocar:** `supabase/functions/nexus-webhook-receiver/index.ts` (apenas o bloco 36-44)
**Não tocar / armadilhas:** não altere `_shared/webhookSignature.ts` — ele já está correto e é usado pelos
outros 3 webhooks. Não mexa nos outros webhooks nesta etapa. Lembre que merge nesta pasta **publica em
produção** na hora.
**Depende de:** — · **Libera:** 002
**Risco e como reverter:** se `NEXUS_WEBHOOK_SECRET` não estiver configurado, o webhook passa a devolver 401
— que é o comportamento correto, mas interrompe o fluxo que hoje passa sem assinatura. Reverter = `git revert`
da PR. Por isso a etapa 002 vem logo atrás.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -A6 'const signature = req.headers.get' supabase/functions/nexus-webhook-receiver/index.ts
```

Esperado: a chamada a `verifyWebhookHmac` **sem** `if (Deno.env.get(...))` em volta, retornando 401 quando
falha. Depois do merge, confirme o deploy da função no painel do Supabase e registre o horário.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 002 — Confirmar com o dono se `NEXUS_WEBHOOK_SECRET` está configurado em produção

**Onda / Severidade / Camada:** 1 / Crítica / infraestrutura
**Achados resolvidos:** S-01
**Problema hoje:** o valor do segredo não é legível a partir do repositório. Se ele **não** estava
configurado, o webhook esteve aberto na internet e é preciso avaliar se houve evento injetado.
**Causa raiz:** segredo de edge function não auditável pelo código.
**Caminho recomendado:** peça ao dono para conferir no painel do Supabase (Edge Functions → Secrets) se
`NEXUS_WEBHOOK_SECRET` existe. Se **não** existir: além de criar, consulte `transportadoras` e as tabelas que
a função escreve procurando registros de origem suspeita no período. Registre o resultado em
`05-PROGRESSO.md`. Se existir: registre isso, e o risco de S-01 fica como "não explorado".
**Arquivos e objetos a tocar:** nenhum (etapa de verificação e registro)
**Não tocar / armadilhas:** não escreva o valor do segredo em arquivo, commit, PR ou anotação — apenas
"configurado" / "ausente".
**Depende de:** 001 · **Libera:** —
**Risco e como reverter:** nenhum (somente leitura)
**Precisa de aprovação humana antes do merge:** sim (envolve segredo e decisão sobre exposição)
**Como verificar:** anotação em `05-PROGRESSO.md` dizendo "configurado" ou "ausente", com a data e quem
confirmou.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 003 — Criar `requireRole` em `_shared/auth.ts`

**Onda / Severidade / Camada:** 1 / Crítica / edge function
**Achados resolvidos:** S-02, S-03, S-04
**Problema hoje:** `_shared/auth.ts` oferece `requireUser` (prova que existe sessão) e
`requireInternalSecret`, e **não** oferece checagem de papel. Por isso três funções tratam "autenticado" como
"autorizado": `webhook-status/index.ts:36-45`, `evolution-whatsapp/index.ts:34-43`,
`melhor-envio-api/index.ts:43-49`.
**Causa raiz:** falta o degrau de autorização por papel no helper compartilhado.
**Caminho recomendado:** acrescente `requireRole(req, roles: string[])` em `_shared/auth.ts`, reaproveitando
`requireUser` para validar o token e consultando o papel do usuário do mesmo jeito que o resto do sistema
(`user_roles` + a função `has_role`, padrão do ADR `docs/adr/0014-security-definer-rls-pattern.md`). Devolva o
mesmo formato de retorno que `requireUser` usa (`{ ok, claims }` / `{ ok: false }`) para que as funções
chamem igual. **Atalho tentador a evitar:** ler o papel de um campo do JWT. O papel vive em `user_roles`, não
no token; confiar no token é reabrir o problema em outro lugar.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/auth.ts` (acréscimo apenas)
**Não tocar / armadilhas:** não altere `requireUser` nem `requireInternalSecret` — 12+ funções dependem
deles, e `log-security-event/index.ts:64-66` e `predict-delays-scheduled/index.ts:24-35` são os padrões
corretos do repositório. Acrescente, não modifique.
**Depende de:** — · **Libera:** 004, 005, 006, 007, 008, 009
**Risco e como reverter:** baixo (código novo, ninguém usa ainda). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run supabase/functions/_shared/ 2>&1 | tail -20
grep -n 'export async function requireRole' supabase/functions/_shared/auth.ts
```

Esperado: a função existe e os testes de `_shared` continuam passando. Acrescente um teste do caminho de
rejeição (papel errado → `ok: false`).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 004 — `webhook-status`: exigir chamador interno ou papel de admin

**Onda / Severidade / Camada:** 1 / Crítica / edge function
**Achados resolvidos:** S-02
**Problema hoje:** `supabase/functions/webhook-status/index.ts:36-45` aceita **qualquer** usuário
autenticado; em seguida a função envia POSTs assinados, com conteúdo vindo do corpo, para **todos** os
`client_webhooks` ativos (`:68-119`). O comentário em `:28` promete "service-role bearer or authenticated
user".
**Causa raiz:** confusão entre autenticado e autorizado (ver etapa 003).
**Caminho recomendado:** troque a checagem por `requireInternalSecret(req) || requireRole(req, ['admin'])`,
no mesmo desenho de `supabase/functions/resend-email/index.ts:25-36` e
`predict-delays-scheduled/index.ts:24-35`. Corrija o comentário da linha 28 para refletir a regra real.
**Atalho tentador a evitar:** apenas filtrar `client_webhooks` por dono. O problema não é só **quais**
webhooks ele alcança — é que ele não deveria poder disparar notificação de status nenhuma.
**Arquivos e objetos a tocar:** `supabase/functions/webhook-status/index.ts` (bloco de auth `:28-45` e o
comentário)
**Não tocar / armadilhas:** o HMAC em `:89-105` **assina a saída** enviada ao cliente externo — não é
autenticação de entrada; não mexa nele. Se o front chama esta função, a mudança vai quebrar essa chamada:
procure `webhook-status` em `src/` **antes** e registre o que achar (se houver uso no front, a etapa 005
cobre).
**Depende de:** 003 · **Libera:** 005
**Risco e como reverter:** quem hoje chama a função com sessão comum passa a receber 401. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'webhook-status' src/ | head
sed -n '25,50p' supabase/functions/webhook-status/index.ts
```

Esperado: a função rejeita sessão comum; o grep mostra se e onde o front a chama. Após o deploy, uma chamada
com token de usuário comum deve devolver 401 e com segredo interno deve funcionar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 005 — `webhook-status`: filtrar `client_webhooks` por dono e registrar quem disparou

**Onda / Severidade / Camada:** 1 / Alta / edge function
**Achados resolvidos:** S-02
**Problema hoje:** `supabase/functions/webhook-status/index.ts:60-63` lê `client_webhooks` **sem filtro de
dono** e `:174` lista todos. Mesmo com a etapa 004 limitando quem chama, a função continua operando sobre o
conjunto inteiro sem deixar rastro de quem disparou.
**Causa raiz:** consulta sem escopo, feita com `service_role` (que ignora RLS).
**Caminho recomendado:** inclua na consulta o filtro de dono/escopo que a tabela oferecer (confira as colunas
reais de `client_webhooks` em `src/integrations/supabase/types.ts` antes de escolher) e grave um registro de
auditoria com o `sub` do token do chamador, no mesmo padrão de
`supabase/functions/log-security-event/index.ts:64-66`, que força `user_id = auth.claims.sub`.
**Atalho tentador a evitar:** confiar num `client_id` vindo do corpo. Use o token.
**Arquivos e objetos a tocar:** `supabase/functions/webhook-status/index.ts` (`:60-63` e `:174`)
**Não tocar / armadilhas:** se `client_webhooks` **não** tiver coluna de dono, a correção muda de forma — aí
registre isso no progresso e deixe a PR aberta para o dono decidir (passa a ser mudança de modelo de dados).
**Depende de:** 004 · **Libera:** —
**Risco e como reverter:** a função pode passar a notificar menos webhooks do que hoje — que é o objetivo.
`git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'client_webhooks' supabase/functions/webhook-status/index.ts
grep -n 'client_webhooks' -A25 src/integrations/supabase/types.ts | head -30
```

Esperado: toda consulta a `client_webhooks` tem filtro de escopo, e existe uma gravação de auditoria com o
`sub` do token.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 006 — `evolution-whatsapp`: exigir papel para enviar mensagem

**Onda / Severidade / Camada:** 1 / Alta / edge function
**Achados resolvidos:** S-03
**Problema hoje:** `supabase/functions/evolution-whatsapp/index.ts:34-43` usa `requireUser`; `:68` lê
`instance`, `phone` e `message` do corpo. Qualquer usuário autenticado envia WhatsApp para qualquer número
pelo número oficial da empresa.
**Causa raiz:** ver etapa 003.
**Caminho recomendado:** troque `requireUser` por `requireRole(req, [...])` com os papéis que o dono
autorizar — com `app_role` sendo `{admin, user}`, a decisão prática é "só admin" ou "user também". **Deixe a
escolha para o dono na PR**, implementando com uma constante no alto do arquivo para ficar fácil de mudar.
Mantenha o rate limit que já existe. **Atalho tentador a evitar:** validar o `phone` contra uma lista de
clientes. Resolve um caso e não o problema — o gasto e o risco de bloqueio do número continuam para qualquer
número da lista.
**Arquivos e objetos a tocar:** `supabase/functions/evolution-whatsapp/index.ts` (bloco de auth `:34-43`)
**Não tocar / armadilhas:** não mexa no rate limit nem na chamada à Evolution (`safeFetch` já cuida de tempo
limite e disjuntor). Se o front chama esta função numa tela usada por `user` comum, a mudança quebra essa
tela: procure em `src/` antes e registre.
**Depende de:** 003 · **Libera:** 007
**Risco e como reverter:** usuários comuns podem perder uma função que hoje usam. Por isso a decisão de papel
é do dono. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (define quem pode falar com o cliente pelo WhatsApp da empresa)
**Como verificar:**

```bash
grep -rn 'evolution-whatsapp' src/ | head
grep -n 'requireRole\|requireUser' supabase/functions/evolution-whatsapp/index.ts
```

Esperado: a função exige papel; o grep mostra quais telas a chamam (para o dono decidir com informação).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 007 — `evolution-whatsapp`: registrar quem enviou cada mensagem

**Onda / Severidade / Camada:** 1 / Média / edge function
**Achados resolvidos:** S-03
**Problema hoje:** não há registro de qual usuário disparou cada envio, então não é possível responder "quem
mandou esta mensagem" depois do fato.
**Causa raiz:** envio sem trilha de auditoria.
**Caminho recomendado:** grave um registro com `auth.claims.sub`, o número de destino e o horário, seguindo
`supabase/functions/log-security-event/index.ts:64-66` (que força o `user_id` do token). Use uma tabela de
auditoria que já exista — confira em `src/integrations/supabase/types.ts` antes de propor tabela nova; se não
houver lugar adequado, **não crie tabela nesta etapa**: registre no progresso e deixe para o dono decidir.
**Arquivos e objetos a tocar:** `supabase/functions/evolution-whatsapp/index.ts`
**Não tocar / armadilhas:** não grave o conteúdo da mensagem se ela puder conter dado pessoal do cliente além
do telefone — isso é matéria de LGPD (ver `docs/LGPD_COMPLIANCE.md`). Registre destino e autor, não o texto.
**Depende de:** 006 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:** após o deploy, um envio deve produzir uma linha de auditoria com o `sub` do token.
Consulte a tabela escolhida e registre o resultado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 008 — `melhor-envio-api`: o ambiente (produção/teste) passa a ser decidido pelo servidor

**Onda / Severidade / Camada:** 1 / Alta / edge function
**Achados resolvidos:** S-04
**Problema hoje:** `supabase/functions/melhor-envio-api/index.ts:59-61` lê `useSandbox` do **corpo da
requisição**. Quem chama escolhe se a operação vai para o ambiente real ou o de teste.
**Causa raiz:** decisão de ambiente delegada ao cliente.
**Caminho recomendado:** ignore `useSandbox` do corpo e leia de uma variável de ambiente da função (por
exemplo `MELHOR_ENVIO_SANDBOX`), com o padrão sendo **produção**. Mantenha o campo aceito no corpo por
compatibilidade, mas **sem efeito**, e registre em log quando ele vier (ajuda a achar quem ainda manda).
**Atalho tentador a evitar:** remover o campo de uma vez. Se alguma tela o envia, você quebra a chamada sem
saber; ignorar com log descobre os chamadores sem derrubar nada.
**Arquivos e objetos a tocar:** `supabase/functions/melhor-envio-api/index.ts` (`:59-61` e onde `useSandbox`
é usado adiante)
**Não tocar / armadilhas:** o arquivo tem ~355 linhas e vários `case`; a auditoria leu só o bloco de auth e o
primeiro `case`. **Releia onde `useSandbox` é consumido** antes de mudar — pode haver mais de um ponto.
**Depende de:** — · **Libera:** 009
**Risco e como reverter:** se hoje alguém usa o modo de teste pelo corpo, passa a bater em produção. Por isso
o padrão deve ser decidido com o dono. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (envolve a conta de produção de um terceiro e custo)
**Como verificar:**

```bash
grep -n 'useSandbox\|SANDBOX' supabase/functions/melhor-envio-api/index.ts
grep -rn 'useSandbox' src/ | head
```

Esperado: nenhum caminho de decisão usa o valor do corpo; a variável de ambiente é a fonte.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 009 — `melhor-envio-api`: exigir papel para cotar

**Onda / Severidade / Camada:** 1 / Alta / edge function
**Achados resolvidos:** S-04
**Problema hoje:** `supabase/functions/melhor-envio-api/index.ts:43-49` exige apenas sessão; qualquer
autenticado consome a cota da conta Melhor Envio.
**Causa raiz:** ver etapa 003.
**Caminho recomendado:** `requireRole` com os papéis que o dono definir, mesmo desenho da etapa 006.
Mantenha o rate limit existente.
**Arquivos e objetos a tocar:** `supabase/functions/melhor-envio-api/index.ts` (bloco de auth `:43-49`)
**Não tocar / armadilhas:** cotar frete é uma função de operação, provavelmente usada por `user` comum — se o
dono restringir a admin, telas de cotação param para o resto da equipe. Leve essa informação na PR: liste
quais telas chamam a função (`grep -rn 'melhor-envio-api' src/`).
**Depende de:** 003, 008 · **Libera:** —
**Risco e como reverter:** pode tirar a cotação de quem precisa. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (decide quem pode cotar frete)
**Como verificar:** `grep -n 'requireRole' supabase/functions/melhor-envio-api/index.ts` e, após o deploy,
chamada com papel não autorizado devolvendo 401/403.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 010 — Confirmar com o dono que `ALLOW_TEST_MODE` não está ligado em produção

**Onda / Severidade / Camada:** 1 / Crítica (se ligado) / infraestrutura
**Achados resolvidos:** S-05
**Problema hoje:** `supabase/functions/lalamove-webhook/index.ts:52-53` e
`supabase/functions/rodonaves-webhook/index.ts:67-69` pulam a verificação HMAC quando
`ALLOW_TEST_MODE === 'true'` está no servidor **e** chega o header `x-test-mode: true` — e então **gravam de
verdade**. `scripts/ops/set_missing_secrets.sh:25` diz que a variável "nao se define em producao", e
`scripts/ops/set-missing-secrets.unit.mjs:72` a **exclui** do conjunto gerenciado: é convenção, não garantia.
**Causa raiz:** variável de bypass sem verificação automática.
**Caminho recomendado:** peça ao dono para conferir no painel do Supabase se `ALLOW_TEST_MODE` existe nas
funções. Registre em `05-PROGRESSO.md`. Se estiver `true`, isso é incidente: peça remoção imediata e
consulte `rastreamento_historico` e `ocorrencias` procurando registros sem origem confirmada no período.
**Arquivos e objetos a tocar:** nenhum (verificação)
**Não tocar / armadilhas:** não remova o mecanismo de teste nesta etapa — a etapa 011 cuida de torná-lo
seguro por construção.
**Depende de:** — · **Libera:** 011
**Risco e como reverter:** nenhum (leitura)
**Precisa de aprovação humana antes do merge:** sim (segredo/ambiente)
**Como verificar:** anotação em `05-PROGRESSO.md` com "ausente" ou "presente/valor booleano", data e quem
confirmou.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 011 — Fazer o modo de teste dos webhooks impossível de ligar por engano em produção

**Onda / Severidade / Camada:** 1 / Média / edge function
**Achados resolvidos:** S-05
**Problema hoje:** o bypass depende de uma variável de ambiente que ninguém verifica automaticamente (ver
etapa 010).
**Causa raiz:** controle por convenção em vez de mecanismo.
**Caminho recomendado:** acrescente ao script que já existe (`scripts/ops/set-missing-secrets.unit.mjs`, que
hoje **exclui** `ALLOW_TEST_MODE` em `:72`) uma verificação que **falhe** se a variável estiver presente no
ambiente de produção — transformando a convenção escrita em teste automático. Em seguida, nas duas funções,
exija também que o modo de teste só valha quando a assinatura estiver ausente **e** o payload traga uma marca
explícita de teste, para que um header solto não baste. **Atalho tentador a evitar:** remover o modo de teste
por completo. Ele existe para o desenvolvimento dos webhooks; removê-lo empurra o próximo agente a testar
direto em produção.
**Arquivos e objetos a tocar:** `scripts/ops/set-missing-secrets.unit.mjs`,
`supabase/functions/lalamove-webhook/index.ts:52-53`, `supabase/functions/rodonaves-webhook/index.ts:67-69`
**Não tocar / armadilhas:** não altere `_shared/webhookSignature.ts`. Mexer em `scripts/` toca o check
"Contratos da automação local" — rode `npm run automation:test` antes de abrir a PR.
**Depende de:** 010 · **Libera:** —
**Risco e como reverter:** o desenvolvimento dos webhooks fica mais chato. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (toca scripts de CI/segredos)
**Como verificar:**

```bash
npm run automation:test 2>&1 | tail -20
node --test scripts/ops/set-missing-secrets.unit.mjs 2>&1 | tail -20
```

Esperado: o novo teste reprova quando `ALLOW_TEST_MODE` está presente e aprova quando ausente.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 012 — `health`: trocar `service_role` por uma verificação sem privilégio

**Onda / Severidade / Camada:** 1 / Média / edge function
**Achados resolvidos:** S-06
**Problema hoje:** `supabase/functions/health/index.ts:23` cria o cliente com
`SUPABASE_SERVICE_ROLE_KEY` (o comentário na própria linha diz "Use service role for internal health") e
depois consulta `profiles` (`:26-31`) e lista todos os buckets de storage (`:48`). A função é pública
(`supabase/config.toml:48-49` → `verify_jwt = false`), então qualquer pessoa na internet faz o sistema rodar
essas duas consultas com a chave mais poderosa que existe, quantas vezes quiser.
**Causa raiz:** healthcheck escrito com a chave de administrador porque era a mais fácil de usar, não porque
a verificação precise de privilégio.
**Caminho recomendado:** mantenha a função **pública** (há monitoramento externo apontado para ela —
`docs/DISASTER_RECOVERY.md:14`) e troque a chave: crie o cliente com `SUPABASE_ANON_KEY`, como
`supabase/functions/get-weather-data/index.ts` e `supabase/functions/secure-store/index.ts` já fazem. Troque
a consulta a `profiles` por uma que não dependa de RLS nem exponha tabela de negócio (um `select` em algo
público, ou simplesmente medir a latência do próprio endpoint REST). Remova o bloco de storage (`:46-51`):
listar buckets não diz nada sobre saúde e é a chamada mais privilegiada do arquivo. O bloco de auth (`:38-44`)
chama `getSession()` sem sessão e sempre devolve `healthy` — substitua por nada ou por um `fetch` ao
`/auth/v1/health`, que é o que `tests/security/rls-access.spec.ts:27` usa.
**Atalho tentador a evitar:** deixar o `service_role` e só pôr um rate limit em cima. O rate limit atrasa o
abuso; a chave continua sendo usada para responder a anônimos, e qualquer erro futuro no arquivo passa a ter
privilégio total. O que resolve é tirar a chave.
**Arquivos e objetos a tocar:** `supabase/functions/health/index.ts` (`:23`, `:26-31`, `:38-44`, `:46-51`)
**Não tocar / armadilhas:** não mude `supabase/config.toml` nesta etapa (é a etapa 014) — se você ligar
`verify_jwt` aqui, derruba o monitoramento externo sem aviso. O formato da resposta JSON é consumido por
quem monitora: **mantenha as chaves `status`, `checks` e os nomes de cada check**, mesmo que um deles saia.
Merge nesta pasta publica a função em produção na hora.
**Depende de:** — · **Libera:** 014
**Risco e como reverter:** se a nova consulta falhar por RLS, o endpoint passa a responder `unhealthy` e o
monitoramento alarma sem haver incidente. Teste a consulta escolhida com a chave `anon` antes do merge.
Reverter = `git revert` da PR.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'SERVICE_ROLE\|listBuckets\|ANON_KEY' supabase/functions/health/index.ts
```

Esperado: nenhuma ocorrência de `SERVICE_ROLE` nem de `listBuckets`; `ANON_KEY` presente. Depois do deploy,
`curl -s "$SUPABASE_URL/functions/v1/health"` sem nenhum header de autorização deve devolver `200` com
`status: "healthy"`. Registre a resposta.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 013 — `health-check`: parar de chamar a API administrativa de usuários e exigir sessão

**Onda / Severidade / Camada:** 1 / Média / edge function
**Achados resolvidos:** S-06
**Problema hoje:** `supabase/functions/health-check/index.ts:12` monta o cliente com
`SUPABASE_SERVICE_ROLE_KEY` e `:24` chama `supabase.auth.admin.listUsers({ perPage: 1 })` — API de
administração de usuários — a pedido de qualquer anônimo, porque `supabase/config.toml:51-52` deixa
`verify_jwt = false`. `:21` ainda lista todos os buckets.
**Causa raiz:** a mesma da etapa 012, agravada por usar a API de admin como "prova" de que o auth está vivo.
**Caminho recomendado:** esta função, diferente da `health`, **só é chamada por quem já tem sessão**:
`src/hooks/system/useNexusHealth.ts:68` e `src/utils/systemTester.ts:29` a invocam por
`supabase.functions.invoke`, que envia o JWT do usuário. Então: (1) acrescente `requireUser(req)` no início,
no mesmo desenho de `supabase/functions/scheduled-reports/index.ts:17`, devolvendo 401 quando não houver
sessão; (2) troque `auth.admin.listUsers` por um `fetch` ao `/auth/v1/health` (padrão já usado em
`tests/security/integrations-access.spec.ts:25`); (3) troque `storage.listBuckets()` (`:21`) por uma leitura
de um bucket específico que o app realmente usa, ou remova o check.
**Atalho tentador a evitar:** manter o `listUsers` e apenas limitar a 1 registro, como está. O problema não é
o volume devolvido — é que um endpoint sem autenticação alcança a API de administração do projeto. Reduzir o
`perPage` não muda nada disso.
**Arquivos e objetos a tocar:** `supabase/functions/health-check/index.ts` (`:12`, `:21`, `:24`, e o bloco de
entrada do `serve` para incluir o `requireUser`)
**Não tocar / armadilhas:** não altere `_shared/circuitBreaker.ts` nem `_shared/auth.ts`. O objeto `results`
(`:26-31`) é lido por `src/components/layout/SystemPulse.tsx` e por `src/hooks/system/useNexusHealth.ts` —
**mantenha os nomes `database`, `storage`, `auth` e `timestamp`**, ou essas duas telas param de mostrar
estado. Mexer em `supabase/config.toml` é a etapa 014.
**Depende de:** — · **Libera:** 014
**Risco e como reverter:** se alguma sondagem externa estiver apontada para `health-check` (e não para
`health`), ela passa a receber 401. É exatamente o que a etapa 014 confirma com o dono. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'admin.listUsers\|requireUser\|SERVICE_ROLE' supabase/functions/health-check/index.ts
grep -rn 'health-check' src/ | grep invoke
```

Esperado: nenhuma chamada a `admin.listUsers`; `requireUser` presente. Depois do deploy, `curl` sem
`Authorization` devolve 401 e a tela `SystemPulse` continua mostrando os três checks. Registre as duas
evidências.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 014 — Decidir com o dono qual dos dois endpoints de saúde fica aberto e fechar o outro no `config.toml`

**Onda / Severidade / Camada:** 1 / Média / infraestrutura
**Achados resolvidos:** S-06
**Problema hoje:** `supabase/config.toml:48-52` declara `verify_jwt = false` para **as duas** funções
(`health` e `health-check`). Duas portas abertas para a mesma informação, e nenhum documento diz qual delas
o monitoramento externo usa: `docs/DISASTER_RECOVERY.md:14` cita `/functions/v1/health`,
`docs/audit/2026-09-02_auditoria_tecnica_22_dimensoes.md:176` sugere plugar Better Stack/UptimeRobot nesse
mesmo caminho — mas nenhuma das duas afirmações foi confirmada no painel.
**Causa raiz:** duas implementações de healthcheck nasceram em momentos diferentes e as duas ficaram
públicas, sem decisão de qual é a oficial.
**Caminho recomendado:** pergunte ao dono se existe monitoramento externo (Better Stack, UptimeRobot,
Vercel, qualquer um) e **para qual URL** ele aponta. Com a resposta: a função apontada fica
`verify_jwt = false` (e é a corrigida na etapa 012); a outra passa a `verify_jwt = true`, que é o padrão do
resto do arquivo. Se **não houver** monitoramento externo, feche as duas — a `health-check` já é usada só
com sessão (etapa 013) e a `health` passa a ser chamada com o token de serviço por quem for sondar depois.
Registre em `05-PROGRESSO.md` qual é a oficial, para o próximo agente não reabrir a porta.
**Atalho tentador a evitar:** fechar as duas sem perguntar, "porque fechado é mais seguro". Se há sondagem
externa apontada para lá, você cria um alarme falso permanente de indisponibilidade — e a reação natural de
quem receber o alarme é reabrir tudo.
**Arquivos e objetos a tocar:** `supabase/config.toml` (`:48-52`), `docs/DISASTER_RECOVERY.md:14` (ajustar
para o endpoint que ficou oficial)
**Não tocar / armadilhas:** não mexa nos outros blocos `[functions.*]` do `config.toml` — há 44 funções e
`verify_jwt = false` é legítimo onde a auth está no código (HMAC ou `x-internal-secret`). Mudar
`verify_jwt` só tem efeito no próximo deploy da função: confirme o deploy depois do merge.
**Depende de:** 012, 013 · **Libera:** —
**Risco e como reverter:** fechar o endpoint errado derruba o monitoramento. `git revert` e novo deploy.
**Precisa de aprovação humana antes do merge:** sim (decide o que fica exposto na internet e pode derrubar
monitoramento externo)
**Como verificar:**

```bash
sed -n '45,55p' supabase/config.toml
```

Esperado: exatamente um dos dois blocos com `verify_jwt = false`, e `05-PROGRESSO.md` dizendo qual, por quê e
quem confirmou. Depois do deploy, `curl` sem header no endpoint fechado devolve 401 e no aberto devolve 200.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 015 — Tirar o `.env` do controle de versão, sem reescrever histórico

**Onda / Severidade / Camada:** 1 / Alta / repositório
**Achados resolvidos:** S-07
**Problema hoje:** `git ls-files` devolve `.env` — o arquivo **é rastreado** — e `.gitignore` não tem
nenhuma linha que case com ele (`grep -n env .gitignore` não devolve nada). Hoje o conteúdo são quatro
variáveis com chave `anon` e o `VITE_MAPBOX_TOKEN`, todas públicas por desenho. O risco não é o conteúdo de
hoje: é que o próximo agente que editar `.env` vai commitar por hábito, e aí pode não ser uma chave `anon`.
**Causa raiz:** o arquivo entrou no primeiro commit e nunca saiu; sem linha no `.gitignore`, o git continua
oferecendo ele em todo `git add`.
**Caminho recomendado:** três comandos, nesta ordem: acrescente `.env` ao `.gitignore` (deixe
`!.env.example` explícito, porque o exemplo **deve** continuar versionado); rode `git rm --cached .env`
(remove do índice, mantém o arquivo no disco de quem já tem o clone); commite as duas coisas juntas. Confira
em seguida que `git check-ignore .env` casa e que `.env.example` continua rastreado.
**Atalho tentador a evitar:** limpar o `.env` do histórico com `git filter-repo`, BFG ou rebase interativo.
O achado S-07 é explícito: as chaves são `anon`, o ganho não paga o risco, e reescrever o histórico de um
repositório com PRs abertas e uma branch gerada (`contexto`) quebra todas elas de uma vez. Não faça.
**Arquivos e objetos a tocar:** `.gitignore`, remoção de `.env` do índice
**Não tocar / armadilhas:** **não apague o arquivo do disco** — o `npm run dev` local depende dele; é
`--cached`, não `-f`. Não toque em `.env.example`: ele é a documentação das variáveis esperadas. Confira se
algum workflow lê `.env` do checkout antes de mergear (`grep -rn '\.env' .github/workflows/`) — se algum
ler, a etapa muda de forma e vira decisão do dono.
**Depende de:** — · **Libera:** 018
**Risco e como reverter:** um clone novo deixa de vir com `.env` e quem for rodar local precisa copiar de
`.env.example`. Reverter = `git revert` (o arquivo volta ao índice).
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
git ls-files | grep -x '.env'; echo "rastreado=$?"
git check-ignore -v .env
git ls-files | grep -x '.env.example'
```

Esperado: o primeiro comando não devolve nada (`rastreado=1`), o segundo mostra a regra do `.gitignore` que
casou, o terceiro ainda devolve `.env.example`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 016 — Corrigir o `AGENTS.md` e o comentário da CI que afirmam que o repositório é privado

**Onda / Severidade / Camada:** 1 / Alta / documentação + CI
**Achados resolvidos:** S-07
**Problema hoje:** `AGENTS.md:52` afirma, na seção Fluxo Git: "Repo `adm01-debug/Loggi_Flow_V2`, `main`,
**privado**". A API do GitHub devolve `"visibility":"public"`. `.github/workflows/ci.yml:11` repete a
suposição no comentário: "gitleaks lê os commits do PR (repo privado exige permissão explícita)". É a
instrução que **todo** agente é obrigado a ler, errada sobre a característica mais importante do repositório.
**Causa raiz:** afirmação escrita uma vez e nunca reconferida; nada no repositório compara o texto com a
realidade.
**Caminho recomendado:** confirme a visibilidade **agora**, pela API, e escreva o que ela devolver — não o
que você espera. Com `público`: corrija `AGENTS.md:52` para "**público** — nada de segredo em arquivo
versionado, nem em exemplo" e ajuste o comentário de `.github/workflows/ci.yml:11` para dizer por que a
permissão está lá no caso público. Como você está mexendo em `AGENTS.md`, rode
`node scripts/ci/check-claude-md-integrity.mjs` antes de abrir a PR — é um dos checks obrigatórios
("Agents Docs Integrity"). Se a etapa 017 mudar a visibilidade para privado, esta etapa é refeita; por isso
as duas são separadas e esta vem primeiro: corrige o texto para a realidade de hoje.
**Atalho tentador a evitar:** esperar a decisão da etapa 017 para só então escrever o `AGENTS.md`. Enquanto
o texto diz "privado" e o repositório é público, cada agente que passar por aqui age com a premissa errada.
Documentar a realidade de hoje é mais urgente que a decisão de amanhã.
**Arquivos e objetos a tocar:** `AGENTS.md:52`, `.github/workflows/ci.yml:11` (apenas o comentário)
**Não tocar / armadilhas:** não mude nenhum `step`, `permissions` ou gatilho do `ci.yml` — só o texto do
comentário. Qualquer alteração de conteúdo em `AGENTS.md` fora da linha 52 faz o check de integridade exigir
atualização dos documentos de `docs/agentes/`; mantenha o diff em uma linha.
**Depende de:** — · **Libera:** 017
**Risco e como reverter:** nenhum risco técnico. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (toca um arquivo de workflow da CI)
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs
grep -n 'privado\|público\|publico' AGENTS.md .github/workflows/ci.yml
```

Esperado: o check de integridade passa e nenhuma das duas linhas afirma mais algo diferente do que a API
devolve. Registre no progresso a saída da API que embasou o texto.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 017 — Levar ao dono a decisão sobre a visibilidade do repositório

**Onda / Severidade / Camada:** 1 / Alta / infraestrutura
**Achados resolvidos:** S-07
**Problema hoje:** o código-fonte inteiro do sistema está visível para qualquer pessoa, incluindo o conteúdo
do `.env` rastreado. Nenhum segredo de servidor foi encontrado em arquivo versionado (a auditoria decodificou
os JWTs: todos `"role":"anon"`), então **não há incidente**. Mas a decisão "público ou privado" nunca foi
tomada de propósito: ela foi herdada do Lovable, onde o repositório nasceu.
**Causa raiz:** configuração de plataforma herdada, nunca revisada.
**Caminho recomendado:** apresente ao dono os dois lados em uma linha cada e deixe a escolha com ele.
Público: qualquer pessoa lê o código e as regras de negócio; em troca, workflows e Dependabot/CodeQL de
graça. Privado: o código fecha; em troca, `.github/workflows/ci.yml:11` e outros pontos que hoje dependem de
permissões públicas podem precisar de ajuste, e Actions em repositório privado consome minutos da conta.
Se o dono escolher privado, faça a mudança pela API/painel, refaça a etapa 016 com o texto correto, e
**confira os 10 required checks** na primeira PR seguinte: branch protection e checks obrigatórios se
comportam diferente nos dois modos.
**Atalho tentador a evitar:** mudar para privado por conta própria "porque é mais seguro". Fechar o
repositório muda custo de Actions, quebra links que o dono possa ter compartilhado e pode derrubar checks
obrigatórios no meio do plano. É decisão de negócio, não de engenharia.
**Arquivos e objetos a tocar:** nenhum (decisão e registro); se o dono mudar, o reflexo é em `AGENTS.md:52`
**Não tocar / armadilhas:** não toque em branch protection, rulesets ou
`scripts/ci/github-settings-baseline.json` nesta etapa — se a visibilidade mudar, o guard de settings
(`.github/workflows/settings-guard.yml`) é que dirá o que divergiu, e isso é uma etapa própria.
**Depende de:** 016 · **Libera:** —
**Risco e como reverter:** mudar a visibilidade é reversível no painel, mas um repositório que ficou público
não "desfica" — o que já foi clonado, já foi. Trate como mudança de via única e registre a data.
**Precisa de aprovação humana antes do merge:** sim (infraestrutura, custo e exposição de código)
**Como verificar:** anotação em `05-PROGRESSO.md` com a decisão ("segue público" ou "passou a privado em
DD/MM, por X"), quem decidiu, e a saída da consulta de visibilidade depois da mudança.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 018 — Transformar "não commite `.env`" em teste automático

**Onda / Severidade / Camada:** 1 / Média / CI
**Achados resolvidos:** S-07
**Problema hoje:** depois da etapa 015 o `.env` sai do índice, mas nada impede que o próximo
`git add -A` de um agente apressado o traga de volta — é exatamente assim que ele entrou. A regra existe como
frase no `AGENTS.md`, não como mecanismo.
**Causa raiz:** controle por convenção em vez de gate.
**Caminho recomendado:** acrescente a verificação ao conjunto de contratos que já roda na CI, no mesmo
desenho dos gates que existem em `scripts/ci/` (ver `scripts/ci/check-claude-md-integrity.mjs`, que é
chamado por um required check). A verificação é curta: falhar se `git ls-files` devolver qualquer caminho que
case com `.env` e não seja `.env.example`. Registre o script em `scripts/automation.config.json` como os
outros estão (ver as entradas em `:119-142`) e rode `npm run automation:test` antes de abrir a PR — mexer em
`scripts/` aciona o required check "Contratos da automação local".
**Atalho tentador a evitar:** confiar no `gitleaks` que já roda no `ci.yml`. Ele procura **padrões de
segredo** no diff; um `.env` com chave `anon` passa limpo — e foi justamente por isso que o arquivo ficou
três meses no repositório sem ninguém notar. O gate tem de olhar o **nome do arquivo**, não o conteúdo.
**Arquivos e objetos a tocar:** novo script em `scripts/ci/`, `scripts/automation.config.json`, e o
workflow que executa os gates de `scripts/ci/`
**Não tocar / armadilhas:** não acrescente o gate ao `pre-commit` do `.husky/` — o hook roda
`lint-staged` e mudar isso afeta a máquina de quem commita, não a CI. Não reutilize o job do `gitleaks`:
misturar os dois faz o motivo da falha ficar ilegível.
**Depende de:** 015 · **Libera:** —
**Risco e como reverter:** um gate novo pode reprovar PRs de outros agentes que estejam com `.env` no
staging — que é o objetivo. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (acrescenta gate à CI)
**Como verificar:**

```bash
npm run automation:test 2>&1 | tail -20
node <caminho-do-novo-gate>; echo "exit=$?"
git add -f .env && node <caminho-do-novo-gate>; echo "exit=$?"; git restore --staged .env
```

Esperado: `exit=0` com a árvore limpa e `exit` diferente de zero quando o `.env` está no índice. Desfaça o
`git add -f` do teste.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 019 — Mapbox: confirmar a restrição do token e remover a variável que ninguém mais usa

**Onda / Severidade / Camada:** 1 / Média / infraestrutura + integração
**Achados resolvidos:** S-08
**Problema hoje:** `VITE_MAPBOX_TOKEN` está no `.env` versionado de um repositório público e, por ser
`VITE_`, vai para o pacote do navegador. Só que — **e isto a auditoria não tinha verificado** —
`grep -rn VITE_MAPBOX src/ index.html` **não devolve nada**: nenhum arquivo do front lê essa variável. Os
mapas hoje usam `maplibre-gl` com estilos gratuitos e sem token: `src/lib/mapStyles.ts:1-20`, cujo próprio
comentário na linha 5 diz "Substituem os estilos `mapbox://` apos a revogacao do token herdado do Lovable".
Sobraram: a variável no `.env` e no `.env.example:23`, a edge function
`supabase/functions/get-mapbox-token/index.ts` (que serve a variável de servidor `MAPBOX_PUBLIC_TOKEN`, sem
nenhuma autenticação) e a rota declarada em `src/lib/constants.ts:129` e `src/pages/APIDocumentation.tsx:60`.
**Causa raiz:** a troca para `maplibre-gl` com estilos sem token foi feita, e a configuração antiga ficou —
inclusive uma edge function pública que entrega um token a quem pedir.
**Caminho recomendado:** comece confirmando, com o dono, se a conta Mapbox ainda existe e se o token tem
restrição de URL no painel (não é legível daqui). Em paralelo, prove no código que ninguém usa: rode os
greps do campo de verificação. Com as duas respostas: se o token não é usado por nada, remova
`VITE_MAPBOX_TOKEN` do `.env.example:23`, remova a entrada `get_mapbox_token` de `src/lib/constants.ts:129`
e o verbete de `src/pages/APIDocumentation.tsx:60`, e deixe a **remoção da edge function** e a revogação do
token no painel como decisão registrada do dono. Se ainda houver uso que você não achou, então a correção é
restringir o token por URL no painel e servir pelo caminho de servidor que já existe.
**Atalho tentador a evitar:** apagar a edge function `get-mapbox-token` direto, "já que ninguém chama". Ela
é citada na documentação de API da própria tela (`APIDocumentation.tsx:60`) e pode estar em uso por algum
consumidor externo que o repositório não conhece. Remover função publicada é deploy destrutivo: proponha,
não execute.
**Arquivos e objetos a tocar:** `.env.example:23`, `src/lib/constants.ts:129`,
`src/pages/APIDocumentation.tsx:60`; a remoção de `supabase/functions/get-mapbox-token/` fica proposta na PR,
não aplicada
**Não tocar / armadilhas:** **não toque em `src/lib/mapStyles.ts` nem em `src/components/map/MapboxMap.tsx`**
— o componente ainda se chama `MapboxMap` mas não usa Mapbox; renomear é churn e quebra 2 telas
(`src/pages/RastreamentoRealTime.tsx:487`, `src/pages/MapaRotas.tsx:24`). Não mexa no `.env` (etapa 015).
**Depende de:** — · **Libera:** —
**Risco e como reverter:** se algum caminho não mapeado depender da variável, o mapa dessa tela quebra. Os
greps da verificação são a prova; rode-os antes. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (envolve conta de terceiro, custo e possível revogação
de token em produção)
**Como verificar:**

```bash
grep -rn 'VITE_MAPBOX' src/ index.html; echo "usos_no_front=$?"
grep -rn 'get-mapbox-token\|get_mapbox_token' src/ | grep -v APIDocumentation
```

Esperado: `usos_no_front=1` (nenhuma ocorrência) e nenhum chamador real da edge function. Registre em
`05-PROGRESSO.md` a resposta do dono sobre a restrição de URL no painel do Mapbox.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 020 — Gerador de contexto: parar de afirmar "sem RLS" quando o arquivo tem DDL dinâmico

**Onda / Severidade / Camada:** 0 / Alta / ferramentas de contexto
**Achados resolvidos:** F-01
**Problema hoje:** `scripts/ai-context/gerar.mjs:509` cria toda tabela com `rls: false` e só vira `true` se o
texto literal `ENABLE ROW LEVEL SECURITY` aparecer (`:560`). Na linha `:638`, o campo publicado é
`sem_rls: !t.rls && ...` — uma **afirmação** de que a tabela não tem proteção. Mas o próprio gerador sabe que
não pode afirmar isso: na linha `:536` ele conta cada bloco com `EXECUTE format(...)` em
`banco.ddl_dinamico` e o `banco.json` sai com o aviso de que 52 blocos não foram modelados. O resultado é a
lista de 36 tabelas "sem RLS" que é falsa em 32 casos — todas partições de `audit_logs` e
`rastreamento_historico`, cujo RLS é habilitado pelo loop `DO $$` de
`supabase/migrations/20260711185045_1705b3fd-cc2b-459f-9aa4-664dacfe7c9d.sql:1-32`.
**Causa raiz:** o gerador reconstrói o schema a partir do texto e não executa SQL; mesmo assim publica um
booleano de duas faces ("tem" / "não tem") para um fato que ele só conhece em parte.
**Caminho recomendado:** troque o booleano por três estados no campo publicado: `sem_rls: true` só quando a
migration que criou a tabela não tem DDL dinâmico nenhum; `sem_rls: "desconhecido"` (ou um campo irmão
`rls_indeterminado: true`) quando houver bloco dinâmico no conjunto analisado; `false` quando houver
`ENABLE` literal. O sinal já está contado em `banco.ddl_dinamico` (`:536`) — o que falta é **não** concluir
na ausência de evidência. Mantenha a chave `sem_rls` existindo, com o mesmo nome, para não quebrar os dois
consumidores (`:724` e `:865`), que a etapa 021 trata.
**Atalho tentador a evitar:** "corrigir" o `banco.json` à mão, ou acrescentar uma lista de exceções com os
nomes das 32 partições. O arquivo é gerado e será sobrescrito na próxima execução de
`.github/workflows/contexto-ia.yml` — o próprio arquivo avisa isso no topo. E a lista de exceções envelhece:
a função `ensure_monthly_partition` (`supabase/migrations/20260902120000_hardening_pos_auditoria.sql:24-29`)
cria partição nova todo mês.
**Arquivos e objetos a tocar:** `scripts/ai-context/gerar.mjs` (`:509`, `:638`; leitura de `:536`)
**Não tocar / armadilhas:** não altere o parser de statements (`:536-561`) tentando interpretar
`EXECUTE format(...)` — é o caminho que gasta a sessão inteira e dá um parser pela metade. O objetivo da
etapa é o gerador **deixar de afirmar**, não passar a entender SQL dinâmico. Não edite a branch `contexto`
nem abra PR dela.
**Depende de:** — · **Libera:** 021, 022
**Risco e como reverter:** baixo (o arquivo gerado muda de forma; nada em produção depende dele). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
node --test scripts/ai-context/gerar.unit.mjs 2>&1 | tail -20
grep -n 'sem_rls' scripts/ai-context/gerar.mjs
```

Esperado: os testes existentes continuam passando (atenção à assertiva de `gerar.unit.mjs:209`, que espera
`sem_rls === true` para uma tabela sem DDL dinâmico — esse caso **deve** continuar `true`) e `sem_rls` passa
a ter o terceiro estado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 021 — Separar, nos resumos gerados, "tabela sem RLS" de "não deu para saber"

**Onda / Severidade / Camada:** 0 / Alta / ferramentas de contexto
**Achados resolvidos:** F-01
**Problema hoje:** `scripts/ai-context/gerar.mjs:724` e `:865` publicam uma única lista,
`tabelas_sem_rls`, filtrando por `t.sem_rls`. É essa lista — e não o `banco.json` inteiro — que um agente lê
primeiro, e é dela que sai a leitura "36 tabelas desprotegidas". Com o terceiro estado da etapa 020, a lista
passaria a incluir silenciosamente os indeterminados ou a excluí-los sem dizer nada; nenhuma das duas serve.
**Causa raiz:** o resumo foi desenhado quando o campo tinha duas faces.
**Caminho recomendado:** nos dois pontos (`:724` e `:865`), publique **duas** listas: `tabelas_sem_rls`
(apenas as confirmadas) e `tabelas_rls_indeterminado` (as que dependem de DDL dinâmico), e inclua na
segunda, no próprio texto, a consulta que decide — `SELECT * FROM public.get_rls_audit()` ou a leitura direta
de `pg_class.relrowsecurity` (ver etapa 023, que explica por que às vezes só a segunda funciona). Acrescente
ao array `avisos` (`:631`) a contagem das indeterminadas, para o aviso deixar de ser genérico e passar a
dizer **quantas e quais**.
**Atalho tentador a evitar:** só renomear a lista para `tabelas_rls_desconhecido` e pronto. Aí o agente
perde a lista das que realmente estão sem RLS — e essas existem: a assertiva de
`scripts/ai-context/gerar.unit.mjs:209` cobre exatamente esse caso. As duas informações são úteis e
diferentes; publique as duas.
**Arquivos e objetos a tocar:** `scripts/ai-context/gerar.mjs` (`:631`, `:724`, `:865`)
**Não tocar / armadilhas:** os dois pontos (`:724` e `:865`) alimentam arquivos diferentes do contexto —
mude **os dois**, ou um resumo contradiz o outro, que é pior que o estado atual. Não mexa em
`scripts/regras_negocio/indice.py` nesta etapa (o `00-INDEX.md` é assunto de outro achado).
**Depende de:** 020 · **Libera:** 022
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
node --test scripts/ai-context/gerar.unit.mjs 2>&1 | tail -20
grep -n 'tabelas_sem_rls\|tabelas_rls_indeterminado' scripts/ai-context/gerar.mjs
```

Esperado: as duas chaves aparecem nos dois pontos e os testes passam. Rode o gerador numa saída temporária e
confirme que nenhuma partição `audit_logs_y*` ou `rastreamento_historico_y*` aparece em `tabelas_sem_rls`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 022 — Teste de regressão: partição protegida por `DO $$` não pode aparecer como "sem RLS"

**Onda / Severidade / Camada:** 0 / Média / ferramentas de contexto
**Achados resolvidos:** F-01
**Problema hoje:** `scripts/ai-context/gerar.unit.mjs` já cobre o caso de DDL dinâmico em parte — `:201`
verifica que o aviso é emitido e `:203` que `rls` fica `true` quando o `ENABLE` está dentro de um `DO $$`
literal — mas **não** há teste para o caso que gerou o achado: tabela cujo `ENABLE` só existe dentro de um
`EXECUTE format(...)`. Sem esse teste, a correção das etapas 020 e 021 volta atrás na primeira refatoração do
parser.
**Causa raiz:** o conjunto de testes do gerador não tem um caso que imite o loop de partições das migrations
reais.
**Caminho recomendado:** acrescente um caso à fixture de `gerar.unit.mjs` com uma migration que (1) cria uma
tabela, (2) habilita RLS nela **somente** por `EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL
SECURITY', ...)` dentro de um `DO $$` — copie a forma do loop real de
`supabase/migrations/20260711185045_1705b3fd-cc2b-459f-9aa4-664dacfe7c9d.sql:1-32`. Afirme que essa tabela
**não** aparece em `tabelas_sem_rls` e **sim** em `tabelas_rls_indeterminado`. Mantenha intacta a assertiva
de `:209` (`payments.sem_rls === true`): ela é o outro lado do mesmo contrato.
**Atalho tentador a evitar:** testar só o booleano `rls` da tabela. O que o agente lê é a **lista do
resumo**; é nela que a afirmação errada aparece. O teste tem de olhar `tabelas_sem_rls`, não só
`banco.tabelas[x].rls`.
**Arquivos e objetos a tocar:** `scripts/ai-context/gerar.unit.mjs` (fixture e novo caso)
**Não tocar / armadilhas:** não altere as assertivas existentes para fazer o novo caso passar — se alguma
delas quebrar, é a etapa 020/021 que está errada, não o teste antigo. Mexer em `scripts/` aciona o required
check "Contratos da automação local": rode `npm run automation:test` antes da PR.
**Depende de:** 020, 021 · **Libera:** —
**Risco e como reverter:** nenhum (só teste). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
node --test scripts/ai-context/gerar.unit.mjs 2>&1 | tail -20
npm run automation:test 2>&1 | tail -10
```

Esperado: todos os casos passam, incluindo o novo. Confirme também que, revertendo mentalmente a etapa 020
(ou com `git stash` dela), o novo teste **reprova** — um teste que passa nas duas versões não protege nada.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 023 — Consultar o banco ao vivo e decidir o estado de RLS das três tabelas suspeitas

**Onda / Severidade / Camada:** 1 / Crítica (se confirmado) / banco
**Achados resolvidos:** F-02
**Problema hoje:** `geo_blocking_rules`, `geo_blocking_settings` e `scheduled_reports` recebem
`CREATE POLICY` (`supabase/migrations/20260901000001_remediacao_destino.sql:56-70`,
`supabase/migrations/20260317224939_faf0aac9-4ef7-4dab-aa72-ce5ce2b627e9.sql:27-34`) e **nenhuma migration**
as cria nem habilita RLS nelas. No Postgres, policy em tabela sem RLS é aceita e **não** é aplicada: a tabela
fica aberta com aparência de protegida. Como as três nasceram fora das migrations (painel ou Lovable), só o
banco ao vivo informa o estado real — e o banco ao vivo não foi auditado.
**Causa raiz:** tabelas criadas fora do fluxo de migration; o repositório não tem como saber o estado delas.
**Caminho recomendado:** **comece pelo banco, nunca pelas migrations.** Pelo MCP
`SUPABASE - LOGGI FLOW V2 - MCP` (confirme que foi este que carregou — há vários Supabase quase homônimos na
conta), rode a consulta direta ao catálogo, que funciona com `service_role`:

```sql
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
       (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) AS policies
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('geo_blocking_rules','geo_blocking_settings','scheduled_reports');
```

Rode **também** `SELECT * FROM public.get_rls_audit() WHERE severity = 'critical';` para ter o retrato
completo do banco — mas sabendo de duas coisas que o achado não traz: a coluna chama-se **`severity`**, não
`status` (`supabase/migrations/20260712212132_d59626e8-c3eb-438c-b158-67882acd95e8.sql:11`), e a função
começa com `IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION` (`:19-21`) — pelo MCP,
`auth.uid()` é nulo e ela **estoura**. Se estourar, use a consulta ao catálogo acima, que é a mesma fonte
(`pg_class.relrowsecurity`, `:26`). Registre em `05-PROGRESSO.md` as três linhas devolvidas, literalmente.
**Atalho tentador a evitar:** concluir pelo `banco.json` ou pelas migrations que as três estão sem RLS e
partir para o `ALTER TABLE`. Foi exatamente esse atalho que produziu o achado F-01 (36 tabelas "sem RLS",
32 falsas) e o P-06 (7 de 12 "índices duplicados" já removidos meses antes). Migration é histórico; o estado
é o banco.
**Arquivos e objetos a tocar:** nenhum (etapa de leitura e registro)
**Não tocar / armadilhas:** **somente leitura.** Não rode `ALTER TABLE` nesta etapa, mesmo que o resultado
seja `relrowsecurity = false` — habilitar RLS sem conferir se as policies cobrem o caminho de escrita quebra
a funcionalidade na hora (RLS sem policy que cubra nega tudo). Não escreva nada no projeto
`hgicfqjayrjurivtygqf` (origem, somente leitura) nem em `uwbpzfcysppwikfpnzok` (ref morto).
**Depende de:** — · **Libera:** 024, 025
**Risco e como reverter:** nenhum (leitura)
**Precisa de aprovação humana antes do merge:** não
**Como verificar:** a saída das duas consultas colada em `05-PROGRESSO.md`, com data, nome do MCP usado e o
`project_ref` confirmado (`jvfhclubfpxrtrrazrgr`). Se `relrowsecurity` vier `true` nas três, F-02 cai e as
etapas 024 e 025 são encerradas como "não se aplica" — registre isso também.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 024 — Habilitar RLS em `scheduled_reports`

**Onda / Severidade / Camada:** 1 / Crítica / banco
**Achados resolvidos:** F-02
**Problema hoje:** se a etapa 023 confirmar `relrowsecurity = false`, qualquer pessoa com login lê e altera
os relatórios agendados de **todos** os usuários, apesar das quatro policies por dono que existem
(`supabase/migrations/20260901000001_remediacao_destino.sql:64-70`: SELECT, INSERT, UPDATE e DELETE, todas
com `auth.uid() = user_id`).
**Causa raiz:** tabela criada fora das migrations; o `ENABLE ROW LEVEL SECURITY` nunca foi executado.
**Caminho recomendado:** esta é a mais segura das três, e por isso vem primeiro: o único código que escreve
na tabela é `supabase/functions/scheduled-reports/index.ts` (`:37`, `:50`, `:65`, `:78`), e ele usa
`SUPABASE_SERVICE_ROLE_KEY` (`:10`, `:29`) — `service_role` **ignora RLS**, então ligar RLS não quebra a
edge function. Confirme que não há leitura direta do front (`grep -rn 'scheduled_reports' src/` devolve só
`types.ts`). Então: (1) confira na saída da etapa 023 que as quatro policies existem no banco, não só na
migration; (2) crie um arquivo em `supabase/migrations/` com `ALTER TABLE public.scheduled_reports ENABLE ROW
LEVEL SECURITY;`, seguindo a forma dos arquivos recentes (cabeçalho explicando o porquê, como
`supabase/migrations/20260902120000_hardening_pos_auditoria.sql:1-10`); (3) abra a PR e **pare** — a
aplicação no banco é a etapa seguinte do fluxo do dono, pelo
`.github/workflows/aplicar-migration.yml` (`workflow_dispatch`, exige digitar `APLICAR`, roda em transação
com `ON_ERROR_STOP=1`).
**Atalho tentador a evitar:** rodar o `ALTER TABLE` pelo MCP "porque é uma linha só". O MCP aceita DDL e não
deixa rastro no ledger `supabase_migrations.schema_migrations`: o banco muda, o repositório não sabe, e o
próximo `types-sync` ou a próxima auditoria encontram divergência sem explicação. O caminho é arquivo → PR →
`aplicar-migration.yml`.
**Arquivos e objetos a tocar:** um novo arquivo em `supabase/migrations/`
**Não tocar / armadilhas:** não toque nas policies existentes — elas já estão corretas e o
`DROP POLICY IF EXISTS` que as acompanha nas migrations é replay-safe. Não habilite RLS nas tabelas de
geo-blocking no mesmo arquivo: elas têm escrita a partir do front e são a etapa 025, com risco diferente.
**Depende de:** 023 · **Libera:** —
**Risco e como reverter:** se alguma policy esperada não existir no banco, a tabela fica inacessível pela
Data API para usuários comuns (a edge function continua funcionando). Reverter = `ALTER TABLE ... DISABLE ROW
LEVEL SECURITY` aplicado pelo mesmo workflow, com nova migration.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção)
**Como verificar:** depois de o dono aplicar, repita a consulta da etapa 023 e confirme
`relrowsecurity = true` com `policies = 4`. Em seguida, uma leitura de `scheduled_reports` com o token de um
usuário comum deve devolver **somente** as linhas dele, e um agendamento criado pela tela deve continuar
funcionando. Registre as duas evidências.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 025 — Habilitar RLS nas duas tabelas de geo-blocking, depois de conferir o caminho de escrita da tela

**Onda / Severidade / Camada:** 1 / Crítica / banco
**Achados resolvidos:** F-02
**Problema hoje:** se a etapa 023 confirmar `relrowsecurity = false`, qualquer pessoa com login lê e
**altera as regras de bloqueio por país** — a configuração de segurança do próprio sistema. As policies
existem (`supabase/migrations/20260901000001_remediacao_destino.sql:56-63`: uma `FOR ALL` e uma `FOR SELECT`,
ambas exigindo `has_role(auth.uid(), 'admin')`) e não estão sendo aplicadas.
**Causa raiz:** a mesma da etapa 024.
**Caminho recomendado:** aqui o risco é real, porque a escrita vem do **front**, não de uma edge function:
`src/components/security/GeoBlockingPanel.tsx:63` faz `update` e `:66` faz `insert` em
`geo_blocking_settings`, com a sessão do usuário — ou seja, sujeitos a RLS no instante em que você ligar.
Antes de escrever a migration, confirme três coisas: (1) na saída da etapa 023, que as policies existem no
banco; (2) que a policy `FOR ALL` cobre INSERT — no Postgres, `FOR ALL` com `USING` e sem `WITH CHECK` usa a
expressão do `USING` também como check, mas **confirme com `pg_policies.with_check`**, não pela leitura da
migration; (3) que quem usa essa tela tem papel `admin` (`src/hooks/auth/useAuth.tsx` e a função
`has_role`, padrão do `docs/adr/0014-security-definer-rls-pattern.md`). Só então crie a migration com os dois
`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, abra a PR e deixe a aplicação para o dono pelo
`.github/workflows/aplicar-migration.yml`.
**Atalho tentador a evitar:** habilitar RLS nas duas junto com `scheduled_reports`, num arquivo só. O risco é
diferente: `scheduled_reports` só é escrita por `service_role` e nada quebra; aqui, se a policy não cobrir o
INSERT da linha `:66`, o painel de geo-blocking para de salvar **na hora**, e para um admin — a pessoa com
menos tolerância a tela quebrada. Uma migration por risco.
**Arquivos e objetos a tocar:** um novo arquivo em `supabase/migrations/`
**Não tocar / armadilhas:** não reescreva as policies para "garantir" a cobertura antes de ler
`pg_policies`: policy sobrescrita errada é como se perde o acesso do admin à própria tela de segurança. Se a
conferência mostrar que falta `WITH CHECK` no INSERT, **isso é outra etapa** — registre em
`05-PROGRESSO.md` na seção "Achados novos" e deixe a PR aberta explicando.
**Depende de:** 023 · **Libera:** —
**Risco e como reverter:** painel de geo-blocking pode parar de salvar. Reverter = nova migration com
`DISABLE ROW LEVEL SECURITY`, aplicada pelo mesmo workflow. Teste o salvamento imediatamente após a
aplicação, com o dono presente.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção, e pode derrubar a tela de segurança)
**Como verificar:** depois de o dono aplicar: a consulta da etapa 023 devolve `relrowsecurity = true` para as
duas; um usuário **sem** papel admin não lê nenhuma linha das duas tabelas; e, logado como admin,
salvar uma alteração em `GeoBlockingPanel` (`src/components/security/GeoBlockingPanel.tsx:63`) continua
funcionando. Registre as três evidências — a terceira é a que importa.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 026 — Confirmar no banco ao vivo a unicidade de `numero_coleta`, `numero_entrega` e do código de rastreio

**Onda / Severidade / Camada:** 1 / Alta (se ausente) / banco
**Achados resolvidos:** F-03
**Problema hoje:** os números são preenchidos por trigger `BEFORE INSERT`
(`supabase/migrations/20251215123841_69fdc13e-5215-49b0-abfb-1c49d264c2a0.sql:202-203`) e ninguém confirmou
que a coluna tem `UNIQUE` no banco de hoje. Duas coletas com o mesmo número só aparecem semanas depois, na
conferência, e não há como desfazer sem decidir qual registro vale. **Duas correções de rota que esta etapa
precisa carregar:** (a) as migrations **declaram** `numero_coleta TEXT NOT NULL UNIQUE` (`:48`) e
`numero_entrega TEXT NOT NULL UNIQUE` (`:96`) — então a hipótese de F-03 é mais fraca do que parecia, e o
que falta é confirmar no banco, não criar do zero; (b) o gerador **não** lê o último número: as funções
`generate_coleta_numero` e `generate_entrega_numero` (`:184-199`) usam `nextval('coleta_seq')` /
`nextval('entrega_seq')`, e sequência do Postgres é segura sob concorrência — o cenário "dois inserts leem o
mesmo último número" não se aplica. O risco que resta é diferente e menor: a `UNIQUE` pode ter sido perdida
se a tabela foi recriada fora das migrations.
**Causa raiz:** o repositório não tem retrato do banco ao vivo (H-09), então nem o que as migrations
declaram pode ser afirmado como estado atual.
**Caminho recomendado:** **comece pelo banco.** Pelo MCP `SUPABASE - LOGGI FLOW V2 - MCP`:

```sql
SELECT conrelid::regclass AS tabela, conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('public.coletas'::regclass,'public.entregas'::regclass,'public.logistica_reversa'::regclass)
  AND contype IN ('u','p');

SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename IN ('coletas','entregas','logistica_reversa')
  AND indexdef ILIKE '%unique%';
```

A terceira tabela entra porque o "código de rastreio" do achado é
`logistica_reversa.codigo_rastreio_reverso`, declarado como `TEXT` **sem** `UNIQUE` em
`supabase/migrations/20260512191343_9d4eff37-8f6a-4916-8ed2-2a474def2be8.sql:10`. Rode também, para medir se
já houve duplicata:
`SELECT numero_coleta, count(*) FROM coletas GROUP BY 1 HAVING count(*) > 1;` (e o equivalente para
`entregas` e para `codigo_rastreio_reverso`). Registre tudo em `05-PROGRESSO.md`.
**Atalho tentador a evitar:** aceitar o `UNIQUE` das linhas `:48` e `:96` como prova e encerrar. As 244
migrations são histórico, e o achado P-06 mostra o custo: 7 de 12 "índices duplicados" do relatório já tinham
sido removidos três meses antes. Uma consulta ao banco custa um minuto.
**Arquivos e objetos a tocar:** nenhum (leitura e registro)
**Não tocar / armadilhas:** somente leitura; não crie índice nesta etapa. Se a consulta de duplicatas
devolver linhas, **não apague nada** — qual registro vale é decisão do dono, e isso é achado novo para
`05-PROGRESSO.md`.
**Depende de:** — · **Libera:** 027
**Risco e como reverter:** nenhum (leitura)
**Precisa de aprovação humana antes do merge:** não
**Como verificar:** a saída das quatro consultas em `05-PROGRESSO.md`, dizendo, para cada uma das três
colunas: `UNIQUE presente` ou `ausente`, e `0 duplicatas` ou a contagem. Sem essa anotação a etapa 027 não
começa.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 027 — Criar a unicidade que faltar nos números e no código de rastreio

**Onda / Severidade / Camada:** 1 / Alta / banco
**Achados resolvidos:** F-03
**Problema hoje:** o que a etapa 026 apontar como ausente. Pelo que as migrations mostram, o candidato certo
é `logistica_reversa.codigo_rastreio_reverso`
(`supabase/migrations/20260512191343_9d4eff37-8f6a-4916-8ed2-2a474def2be8.sql:10`, `TEXT` sem restrição):
é digitado à mão, então é o mais fácil de repetir — dois registros de devolução com o mesmo código fazem o
rastreamento apontar para o lugar errado.
**Causa raiz:** coluna de identificador externo criada sem restrição de unicidade.
**Caminho recomendado:** só entre nesta etapa com a anotação da 026 em mãos, e **só crie o que ela apontou
como ausente**. Escreva um arquivo em `supabase/migrations/` com, para cada coluna faltante, um índice
único **parcial**, não um `ALTER TABLE ... ADD CONSTRAINT UNIQUE`: nas tabelas com exclusão lógica
(`coletas` e `entregas` têm `deleted_at` — confirme em `src/integrations/supabase/types.ts`) a forma correta
é `CREATE UNIQUE INDEX ... ON public.<t> (<col>) WHERE deleted_at IS NULL`, senão um registro excluído
logicamente bloqueia a reutilização do número para sempre; em `codigo_rastreio_reverso`, que aceita nulo, é
`WHERE codigo_rastreio_reverso IS NOT NULL`. Use `CREATE UNIQUE INDEX` (não `CONCURRENTLY`: o
`.github/workflows/aplicar-migration.yml` roda em transação e `CONCURRENTLY` não é permitido dentro de uma).
Abra a PR e deixe a aplicação para o dono, pelo mesmo workflow.
**Atalho tentador a evitar:** criar o índice antes de limpar as duplicatas que a etapa 026 contou. A criação
do índice único **falha** se houver duplicata, e dentro de uma transação isso aborta a migration inteira —
você descobre o problema pelo log de um workflow, não pela consulta. Se a 026 contou duplicatas, esta etapa
fica **aberta** até o dono decidir qual registro vale.
**Arquivos e objetos a tocar:** um novo arquivo em `supabase/migrations/`
**Não tocar / armadilhas:** não toque nas funções `generate_coleta_numero` / `generate_entrega_numero`
(`20251215123841_...sql:184-199`) nem nas sequências `coleta_seq` / `entrega_seq` (`:180-181`) — elas estão
corretas, e mexer em sequência em produção é o caminho mais curto para número repetido de verdade. Não
acrescente `UNIQUE` em `coletas`/`entregas` se a 026 mostrar que já existe: índice duplicado é exatamente o
achado P-06.
**Depende de:** 026 · **Libera:** —
**Risco e como reverter:** a criação pode falhar por duplicata (a transação aborta e nada muda — risco
baixo) e, depois de criada, um fluxo que hoje grava código repetido passa a receber erro do banco. Reverter =
`DROP INDEX` por nova migration.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção, cria índice/constraint)
**Como verificar:** depois de o dono aplicar, repita as consultas da etapa 026 e confirme o índice presente
em `pg_indexes`. Então tente, pelo MCP, inserir um `codigo_rastreio_reverso` repetido numa linha de teste e
confirme que o banco recusa — e **apague a linha de teste**. Registre a mensagem de erro do banco.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 028 — Criar no banco a função que diz se uma transição de entrega é válida

**Onda / Severidade / Camada:** 3 / Crítica / banco
**Achados resolvidos:** C-01
**Problema hoje:** a única validação de ordem de status do sistema é um objeto de 3 linhas no front
(`src/pages/Despachos.tsx:95-99`), cobrindo 3 saltos de um enum com 10 valores. O banco não valida nada: um
`PATCH` direto na API grava `entregue` numa entrega que nunca foi despachada.
**Causa raiz:** a regra de negócio mais importante do sistema nunca foi levada para a única camada que o
usuário não controla.
**Caminho recomendado:** escreva uma migration criando `public.validar_transicao_entrega(p_de
entrega_status, p_para entrega_status) RETURNS boolean`, `LANGUAGE plpgsql`, `IMMUTABLE`, `SECURITY DEFINER`
e `SET search_path TO 'public', 'pg_catalog'` — exatamente o padrão das 83 funções do repositório; copie a
forma de `supabase/migrations/20260902120000_hardening_pos_auditoria.sql:24-29`. O mapa completo, pelos 10
valores do enum (`src/integrations/supabase/types.ts:6427-6437`): `aguardando_producao` →
`pronto_despacho`; `pronto_despacho` → `cotacao_frete`; `cotacao_frete` → `nf_emitida`; `nf_emitida` →
`despachado`; `despachado` → `em_transito`; `em_transito` → `saiu_entrega`; `saiu_entrega` → `entregue` ou
`ocorrencia`; `entregue` → `finalizado`; `ocorrencia` → `em_transito`, `entregue` ou `finalizado`;
`finalizado` → nada. Valide a lista com o dono antes de abrir a PR — é regra de negócio, não de engenharia —
e aceite `p_de = p_para` como válido (um update que não muda status não é transição). Nesta etapa **só a
função**: nenhum trigger ainda, ninguém chama, nada quebra.
**Atalho tentador a evitar:** completar o `validTransitions` do front e parar aí. A tela passa a parecer
consistente e o problema inteiro fica de pé, só mais difícil de perceber — qualquer requisição fora da tela
continua gravando o que quiser. O front é a etapa 034; a camada que resolve é esta.
**Arquivos e objetos a tocar:** um novo arquivo em `supabase/migrations/`
**Não tocar / armadilhas:** não crie o trigger no mesmo arquivo (é a etapa 029) — a função sozinha é
inofensiva e pode ser aplicada e conferida sem risco; o trigger é que muda comportamento. Não use
`CHECK constraint`: um `CHECK` vê só a linha nova, não a antiga, então não consegue expressar "de X para Y".
**Depende de:** — · **Libera:** 029, 030, 031, 032
**Risco e como reverter:** nenhum enquanto nada chamar a função. Reverter = `DROP FUNCTION` por nova
migration.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção e definição de regra de negócio)
**Como verificar:** depois de o dono aplicar (`.github/workflows/aplicar-migration.yml`), pelo MCP:
`SELECT public.validar_transicao_entrega('nf_emitida','despachado') AS deve_ser_true,
public.validar_transicao_entrega('pronto_despacho','entregue') AS deve_ser_false;`
Esperado: `true` e `false`. Cole a saída no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 029 — Trigger `BEFORE UPDATE` em `entregas` recusando transição inválida

**Onda / Severidade / Camada:** 3 / Crítica / banco
**Achados resolvidos:** C-01
**Problema hoje:** levantando todos os `CREATE TRIGGER ... ON entregas` nas migrations, existem
`update_updated_at_column` (`20251215123841_...sql:177`), `generate_entrega_numero`
(`:203`, `BEFORE INSERT`), `audit_entregas` (`20251220164816_audit_log_triggers.sql:20-25`) e
`tr_increment_version_entregas` (`20260513164426_...sql:24-29`). **Nenhum valida mudança de status.**
**Causa raiz:** a função de validação (etapa 028) não tem quem a chame.
**Caminho recomendado:** migration com uma função de trigger (`RETURNS trigger`, mesmo padrão
`SECURITY DEFINER` + `SET search_path`) que, quando `NEW.status IS DISTINCT FROM OLD.status`, chama
`public.validar_transicao_entrega(OLD.status, NEW.status)` e, se vier `false`, faz
`RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status USING ERRCODE = '23514'` —
a mensagem chega ao front pelo `error.message` do supabase-js, que é como as telas já mostram erro
(`src/pages/Despachos.tsx:231`). Registre o trigger como `BEFORE UPDATE OF status ON public.entregas FOR EACH
ROW`. Use `OF status` para o trigger não disparar em update de outras colunas.
**Atalho tentador a evitar:** criar o trigger como `AFTER UPDATE`. `AFTER` já gravou: você consegue abortar a
transação, mas perde a chance de dar mensagem antes do efeito e passa a competir com
`tr_increment_version_entregas`, que também é `BEFORE`. Ordem de triggers no Postgres é alfabética por
nome — **nomeie o seu para rodar antes** dos de auditoria, ou a auditoria registra tentativa inválida como
se fosse mudança.
**Arquivos e objetos a tocar:** um novo arquivo em `supabase/migrations/`
**Não tocar / armadilhas:** **não mexa** em `tr_increment_version_entregas` — ele é a base do travamento
otimista das etapas 044-048; se você alterá-lo, quebra as duas correções ao mesmo tempo. Não mexa nos
triggers de auditoria. Depois de aplicado, `src/pages/KanbanEntregas.tsx:300-319` passa a poder receber erro
do banco em movimentações que hoje passam — é o que a etapa 036 trata.
**Depende de:** 028 · **Libera:** 032, 033, 037
**Risco e como reverter:** **alto**: se o mapa da etapa 028 estiver incompleto, operações legítimas passam a
falhar em produção na hora da aplicação. Por isso a etapa 032 (teste offline) vem antes da aplicação, e a 033
é a aplicação acompanhada. Reverter = `DROP TRIGGER` por nova migration.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção, cria trigger que pode bloquear
operação)
**Como verificar:** no Postgres descartável da etapa 032, não em produção. Depois da etapa 033, confirme no
banco: `SELECT tgname FROM pg_trigger WHERE tgrelid='public.entregas'::regclass AND NOT tgisinternal;`
Esperado: o novo trigger listado junto dos quatro já existentes.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 030 — Mesma proteção para `coletas`: função de validação e trigger

**Onda / Severidade / Camada:** 3 / Crítica / banco
**Achados resolvidos:** C-01
**Problema hoje:** para `coleta_status` **não existe objeto de transições em lugar nenhum** — nem no front.
O enum tem 7 valores (`src/integrations/supabase/types.ts:6418-6425`): `aguardando_liberacao`, `solicitada`,
`em_transito`, `chegou_expedicao`, `conferencia_ok`, `divergencia`, `finalizada`. Qualquer um pode ser
gravado em qualquer ordem, inclusive pela tela.
**Causa raiz:** a mesma de C-01; coletas nunca tiveram nem a validação de tela.
**Caminho recomendado:** repita o desenho das etapas 028 e 029 em um único arquivo, porque aqui não há front
a quebrar: `public.validar_transicao_coleta(p_de coleta_status, p_para coleta_status)` mais o trigger
`BEFORE UPDATE OF status ON public.coletas`. Mapa sugerido, a validar com o dono: `aguardando_liberacao` →
`solicitada`; `solicitada` → `em_transito`; `em_transito` → `chegou_expedicao`; `chegou_expedicao` →
`conferencia_ok` ou `divergencia`; `conferencia_ok` → `finalizada`; `divergencia` → `conferencia_ok` ou
`finalizada`; `finalizada` → nada. Como em 028, aceite `p_de = p_para`.
**Atalho tentador a evitar:** reaproveitar a função de entregas com `text` em vez do tipo enum, para servir
às duas tabelas. Perde a checagem de tipo do Postgres — um valor inexistente passa pela função e só estoura
na gravação, com mensagem que não explica nada. Duas funções, uma por enum.
**Arquivos e objetos a tocar:** um novo arquivo em `supabase/migrations/`
**Não tocar / armadilhas:** `coletas` também tem `generate_coleta_numero` (`BEFORE INSERT`),
`update_coletas_updated_at` e `audit_coletas` — não toque em nenhum. Vale a mesma observação de ordem
alfabética de nome da etapa 029. Atenção: `src/pages/Coletas.tsx` não tem tela de edição com porta de
entrada (achado A-07), então o caminho que grava status de coleta pode estar em hook ou edge function —
rode `grep -rn 'coleta_status\|from("coletas")' src/ supabase/functions/` e registre quem grava, **antes**
de aplicar.
**Depende de:** 028 · **Libera:** 032, 033
**Risco e como reverter:** alto, igual à 029, com o agravante de que ninguém mapeou os gravadores de status
de coleta. O grep acima é parte da etapa. Reverter = `DROP TRIGGER` e `DROP FUNCTION` por nova migration.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção, cria trigger que pode bloquear
operação)
**Como verificar:** no Postgres descartável (etapa 032). Depois da aplicação:
`SELECT tgname FROM pg_trigger WHERE tgrelid='public.coletas'::regclass AND NOT tgisinternal;`
Esperado: o novo trigger presente. Registre também a lista de gravadores encontrada no grep.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 031 — Levar a regra "não despacha sem nota fiscal" para o banco

**Onda / Severidade / Camada:** 3 / Crítica / banco
**Achados resolvidos:** C-01
**Problema hoje:** a regra existe **só como aparência**: `src/pages/Despachos.tsx:240` testa
`!item.nf_remessa` e mostra "NF de Simples Remessa obrigatória antes do despacho", impedindo o clique. Um
`PATCH` direto na API, ou qualquer outra tela, grava `despachado` sem NF. E é essa data que alimenta os
painéis de SLA e OTIF.
**Causa raiz:** regra de negócio implementada na camada que o usuário controla.
**Caminho recomendado:** acrescente a condição ao trigger de `entregas` da etapa 029 (mesma função de
trigger, uma cláusula a mais) ou crie um `CHECK` com `NOT VALID`. Prefira o trigger: ele já está lá, a
mensagem de erro fica no mesmo formato, e a regra depende do **par** (status novo = `despachado` E
`nf_remessa` nulo/vazio), que é exatamente o que um trigger expressa bem. Confirme antes, pelo banco, o nome
e o tipo real da coluna (`src/integrations/supabase/types.ts`, bloco `entregas`) — o front usa
`item.nf_remessa`, e vazio-string é tão inválido quanto nulo: teste os dois
(`coalesce(NEW.nf_remessa,'') = ''`).
**Atalho tentador a evitar:** criar um `CHECK (status <> 'despachado' OR nf_remessa IS NOT NULL)` **sem**
`NOT VALID`. O Postgres valida a constraint contra as linhas existentes na criação, e se houver **uma**
entrega já despachada sem NF no histórico — o que é bem provável, já que a regra nunca foi aplicada — a
migration falha e aborta tudo. Se for de `CHECK`, tem de ser `NOT VALID`; e aí ele não vale para o passado,
só para o futuro, o que é o que se quer.
**Arquivos e objetos a tocar:** um novo arquivo em `supabase/migrations/` (altera a função de trigger criada
na etapa 029)
**Não tocar / armadilhas:** antes de aplicar, **conte o passivo**:
`SELECT count(*) FROM entregas WHERE status IN ('despachado','em_transito','saiu_entrega','entregue',
'finalizado') AND coalesce(nf_remessa,'') = '';` — se der mais que zero, essas entregas existem e qualquer
update futuro nelas vai bater na regra. Isso é informação para o dono, não motivo para desistir. Não
"corrija" esses registros.
**Depende de:** 029 · **Libera:** 032, 033
**Risco e como reverter:** entregas já despachadas sem NF passam a travar em updates seguintes. A contagem
acima mede o tamanho disso antes. Reverter = nova migration restaurando a função de trigger anterior.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção e regra que pode travar operação em
andamento)
**Como verificar:** no Postgres descartável (etapa 032): um update para `despachado` com `nf_remessa` nulo
deve ser recusado, e com NF preenchida deve passar. Em produção, depois da etapa 033, repita com uma entrega
de teste e **desfaça**. Registre a mensagem de erro e a contagem do passivo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 032 — Testar função, triggers e regra da NF num Postgres descartável, antes de produção

**Onda / Severidade / Camada:** 3 / Crítica / banco (teste)
**Achados resolvidos:** C-01
**Problema hoje:** as etapas 028-031 criam DDL que pode travar operação legítima em produção, e o
repositório **não tem staging**. Aplicar direto e descobrir pelo suporte é o pior caminho possível.
**Causa raiz:** DDL sem ambiente de ensaio.
**Caminho recomendado:** o repositório já tem o ensaio pronto, e quase ninguém sabe:
`scripts/audit/sql.unit.mjs` roda SQL de verdade num Postgres **descartável**, subindo um cluster temporário
com `initdb`/`pg_ctl` (ou usando `AUDIT_TEST_PG_URL`), com fixture que imita o Supabase — roles, schemas
`auth`/`storage`/`supabase_migrations`, `cron.job` de mentira (ver o cabeçalho do arquivo, `:1-11`, e os
caminhos em `:22-28`). Acrescente um caso no mesmo formato dos que já existem (`:377` e `:397` são os dois
modelos) que: cria as tabelas mínimas com os enums, aplica as migrations das etapas 028-031 e afirma, com
`assert`, que cada transição do mapa passa, que `pronto_despacho → entregue` é recusada, que
`despachado` sem NF é recusada e que um update que **não** muda status continua passando. Registre o caso em
`scripts/automation.config.json` como os outros (`:139-140`) e rode `npm run automation:test`.
**Atalho tentador a evitar:** testar as transições "no banco mesmo, numa linha de teste, e apagar depois".
É produção: um `RAISE EXCEPTION` dentro de um trigger recém-criado pode abortar transações de usuários reais
que estiverem no meio de uma movimentação, e a linha de teste deixa rastro em `audit_logs` e
`kanban_history`. O ensaio é offline.
**Arquivos e objetos a tocar:** `scripts/audit/sql.unit.mjs` (novo caso), `scripts/automation.config.json`
**Não tocar / armadilhas:** não altere os casos existentes de `sql.unit.mjs` nem a fixture compartilhada —
acrescente. Os testes se **pulam** quando não há Postgres disponível e dizem por quê (`:10`): se forem
pulados, a etapa **não** está concluída; é preciso `PG_BINDIR` ou `AUDIT_TEST_PG_URL`.
**Depende de:** 029, 030, 031 · **Libera:** 033
**Risco e como reverter:** nenhum (teste offline). `git revert`.
**Precisa de aprovação humana antes do merge:** sim (toca scripts da automação local, que é required check)
**Como verificar:**

```bash
node --test scripts/audit/sql.unit.mjs 2>&1 | tail -30
npm run automation:test 2>&1 | tail -10
```

Esperado: o novo caso **executado** (não pulado) e passando. Cole no progresso a linha que mostra o caso
rodando.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 033 — Aplicar as migrações da máquina de estados no banco, com o dono presente

**Onda / Severidade / Camada:** 3 / Crítica / banco
**Achados resolvidos:** C-01
**Problema hoje:** as migrations das etapas 028-031 existem como arquivo e PR; enquanto não forem aplicadas,
o banco continua aceitando qualquer ordem de status. Arquivo em `supabase/migrations/` **não** muda nada no
banco — é a confusão mais comum neste repositório, e é a causa dos achados F-01 e P-06.
**Causa raiz:** não há staging; a aplicação é um ato manual e deliberado.
**Caminho recomendado:** com os testes da etapa 032 verdes, chame o dono e aplique **uma migration por vez**,
na ordem 028 → 029 → 030 → 031, pelo `.github/workflows/aplicar-migration.yml` (`workflow_dispatch`, informa
o caminho do arquivo e exige digitar `APLICAR`; roda em transação com `ON_ERROR_STOP=1`). Depois de **cada**
aplicação, faça um teste de fumaça real: mova uma entrega pela tela `Despachos` (`/despachos`) um passo
legítimo e confirme que funciona; tente, pelo MCP, um salto inválido numa linha de teste e confirme a recusa.
Em seguida rode o `types-sync` (`.github/workflows/types-sync.yml`) para `src/integrations/supabase/types.ts`
refletir as novas funções. Registre horário e saída de cada passo em `05-PROGRESSO.md`.
**Atalho tentador a evitar:** aplicar as quatro de uma vez "para economizar janela". Se a operação travar,
você não sabe qual das quatro foi, e o rollback vira investigação. Uma por vez, com teste de fumaça entre
elas.
**Arquivos e objetos a tocar:** nenhum (execução e registro); o `types-sync` pode abrir PR própria em
`src/integrations/supabase/types.ts`
**Não tocar / armadilhas:** o `aplicar-migration.yml` roda em transação — **não** inclua
`CREATE INDEX CONCURRENTLY` em nenhuma das migrations desta etapa. Depois da aplicação, qualquer tela que
grave status pode começar a mostrar erro do banco: as etapas 034-037 existem para isso, e é melhor
executá-las **antes** desta se a janela permitir.
**Depende de:** 032 · **Libera:** 037
**Risco e como reverter:** o maior do lote. Se uma operação legítima travar, reverter é uma migration nova
com `DROP TRIGGER` aplicada pelo mesmo workflow — tenha o arquivo de rollback **escrito e na PR antes de
aplicar**, não depois.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção, executada pelo dono)
**Como verificar:** para cada migration: a saída do workflow, mais `SELECT tgname FROM pg_trigger WHERE
tgrelid IN ('public.entregas'::regclass,'public.coletas'::regclass) AND NOT tgisinternal;` listando os novos
triggers, mais o resultado do teste de fumaça pela tela. Três evidências por migration.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 034 — Extrair o mapa de transições para um módulo compartilhado, completo e testado

**Onda / Severidade / Camada:** 3 / Alta / interface
**Achados resolvidos:** C-01
**Problema hoje:** o mapa vive dentro de uma tela, como `Record<string, string>` com 3 entradas
(`src/pages/Despachos.tsx:95-99`), e é usado em três pontos do mesmo arquivo (`:200`, `:237`, `:501`). Nenhuma
outra tela tem acesso a ele, e `coleta_status` não tem equivalente em lugar nenhum.
**Causa raiz:** regra duplicável escrita dentro do componente que primeiro precisou dela.
**Caminho recomendado:** crie `src/lib/statusTransitions.ts` exportando dois mapas tipados —
`TRANSICOES_ENTREGA: Record<EntregaStatus, EntregaStatus[]>` e `TRANSICOES_COLETA` — mais um
`podeTransicionar(de, para)`. Use os tipos de `src/integrations/supabase/types.ts` (`Database["public"]
["Enums"]["entrega_status"]`), não `string`: assim o TypeScript reclama se o enum do banco ganhar um valor e
o mapa não. O conteúdo é **o mesmo** aprovado nas etapas 028 e 030 — se divergir, a tela oferece um botão que
o banco recusa. Acrescente `src/lib/statusTransitions.test.ts` no padrão dos testes irmãos
(`src/lib/validations.test.ts`, `src/lib/formatters.parse.test.ts`), afirmando que todo valor do enum é chave
do mapa (é esse teste que pega o enum novo) e que `pronto_despacho → entregue` é inválido. Exporte pelo
barrel `src/lib/index.ts`, como os outros módulos.
**Atalho tentador a evitar:** manter `Record<string, string>` (um destino só por status). O enum tem
bifurcações reais — de `saiu_entrega` dá para ir a `entregue` **ou** `ocorrencia` — e um mapa de destino único
não as expressa: foi por isso que o mapa original só cobriu o trecho linear. Array de destinos desde o
começo.
**Arquivos e objetos a tocar:** novo `src/lib/statusTransitions.ts`, novo
`src/lib/statusTransitions.test.ts`, `src/lib/index.ts` (apenas a linha de export)
**Não tocar / armadilhas:** não mexa em `src/pages/Despachos.tsx` nesta etapa (é a 035): o módulo nasce sem
consumidor, de propósito, para a PR ser pequena e o teste ser a única prova necessária. Lembre do
**orçamento de lint em 105/105**: arquivo novo com um `any` ou um import não usado reprova a CI.
**Depende de:** — · **Libera:** 035, 036
**Risco e como reverter:** nenhum (código novo sem consumidor). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/lib/statusTransitions.test.ts
npx eslint src/lib/statusTransitions.ts src/lib/statusTransitions.test.ts
npm run typecheck
```

Esperado: testes verdes, zero aviso novo no eslint, 0 erro de tipo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 035 — `Despachos` passa a usar o mapa compartilhado

**Onda / Severidade / Camada:** 3 / Alta / interface
**Achados resolvidos:** C-01
**Problema hoje:** `src/pages/Despachos.tsx:95-99` define o mapa local e o consulta em `:200` (dentro da
mutation), `:237` (antes de abrir a confirmação) e `:501` (para decidir se mostra o botão de avançar). Quem
estiver em `aguardando_producao`, `em_transito`, `saiu_entrega`, `entregue`, `ocorrencia` ou `finalizado`
simplesmente não tem botão — a tela não erra, ela **omite**.
**Causa raiz:** mapa incompleto embutido na tela.
**Caminho recomendado:** apague o objeto `:95-99`, importe `TRANSICOES_ENTREGA` / `podeTransicionar` de
`@/lib/statusTransitions` e ajuste os três pontos de uso. Nos dois primeiros (`:200` e `:237`) o código pega
`validTransitions[item.status]` como string única; com array, pegue o primeiro destino quando houver só um e
**não** ofereça avanço automático quando houver bifurcação (de `saiu_entrega` há dois destinos: quem decide é
o operador, não o botão). Em `:501`, mostre o botão quando houver exatamente um destino. Mantenha intacta a
regra da NF de `:240-246`: ela continua útil como aviso antecipado, mesmo com a etapa 031 no banco.
**Atalho tentador a evitar:** montar na tela um `select` com todos os destinos possíveis para cobrir as
bifurcações. Isso é funcionalidade nova, não correção, e `KanbanEntregas` já é a tela de movimentação livre.
Esta etapa só troca a fonte do mapa; o que a tela oferece hoje continua sendo o mesmo conjunto de ações.
**Arquivos e objetos a tocar:** `src/pages/Despachos.tsx` (`:95-99`, `:200`, `:237`, `:501` e a linha de
import)
**Não tocar / armadilhas:** não toque em `statusConfig` (`:60-93`) — é só rótulo, cor e ícone, e `:227` o usa
para a mensagem de sucesso; mexer ali quebra a exibição de todas as colunas. Não altere as mutations
(`:198-230` e `:256-270`): a correção de concorrência delas é das etapas 044 e 045, e misturar as duas numa
PR torna impossível revisar qualquer uma.
**Depende de:** 034 · **Libera:** 037
**Risco e como reverter:** se o mapa novo divergir do antigo em algum dos 3 saltos atuais, o botão de avançar
muda de comportamento numa tela de uso diário. Compare os 3 pares antigos com o mapa novo antes do merge.
`git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'validTransitions\|statusTransitions\|podeTransicionar' src/pages/Despachos.tsx
npm run typecheck && npx eslint src/pages/Despachos.tsx
```

Esperado: nenhuma definição local de `validTransitions`, import do módulo presente. Na aplicação publicada,
mover uma entrega de `nf_emitida` para `despachado` continua funcionando — registre o resultado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 036 — `KanbanEntregas` valida a transição antes de gravar

**Onda / Severidade / Camada:** 3 / Alta / interface
**Achados resolvidos:** C-01
**Problema hoje:** `src/pages/KanbanEntregas.tsx:297-319` grava o `status` que a coluna de destino do arrastar
determinar, **sem nenhuma validação de ordem** — arrastar de `pronto_despacho` direto para `entregue` grava,
e o bloco `:303-311` ainda preenche `data_entrega_efetiva` como se a entrega tivesse ocorrido. É a mesma tela
que faz a verificação de concorrência certa; a de ordem, não faz.
**Causa raiz:** a validação de transição nunca existiu fora de `Despachos`.
**Caminho recomendado:** antes do `update` (`:297`), chame `podeTransicionar(statusAtual, status)` de
`@/lib/statusTransitions` e, se for inválida, recuse com `toast.error` nomeando os dois status — no mesmo
formato da mensagem de conflito de versão que a tela já usa (`:320-323`), que é um bom modelo de aviso
acionável. Para isso a mutation precisa receber o status de origem: ela já recebe `id` e `version`
(`:290-296`), então acrescente `statusAtual` ao mesmo objeto, pego do card arrastado. Se a etapa 033 já tiver
sido aplicada, o banco também recusa — e aí esta etapa é o que transforma um erro técnico de trigger em um
aviso legível.
**Atalho tentador a evitar:** bloquear o arrastar na interface, desabilitando as colunas inválidas como
destino. Parece mais elegante, mas é mudança de comportamento de um componente de arrastar-e-soltar com
estado próprio — risco alto, diff grande, e não protege o caminho do teclado nem o de uma requisição direta.
Valide na mutation: um ponto, uma linha.
**Arquivos e objetos a tocar:** `src/pages/KanbanEntregas.tsx` (assinatura da mutation `:290-296` e início do
`mutationFn`)
**Não tocar / armadilhas:** **não toque** no bloco `{ count: "exact" }` / `if (count === 0)` (`:297`,
`:317-323`): é o padrão de referência que as etapas 044-046 vão copiar para as outras telas. O
`version: version + 1` da linha `:301` é um defeito separado — é a etapa 047; não o corrija aqui.
**Depende de:** 034 · **Libera:** 037
**Risco e como reverter:** movimentações que hoje passam podem passar a ser recusadas na tela. Se o mapa da
etapa 034 estiver certo, é exatamente o objetivo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'podeTransicionar\|count: "exact"' src/pages/KanbanEntregas.tsx
npm run typecheck && npx eslint src/pages/KanbanEntregas.tsx
```

Esperado: a validação presente **e** o bloco de `count` intacto. Na aplicação publicada, arrastar de
`pronto_despacho` para `entregue` deve mostrar aviso e não gravar; um passo legítimo deve continuar
funcionando. Registre os dois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 037 — Traduzir a recusa do banco em mensagem que o operador entende

**Onda / Severidade / Camada:** 3 / Média / interface
**Achados resolvidos:** C-01
**Problema hoje:** depois da etapa 033, uma transição inválida vinda de qualquer caminho passa a receber o
texto do `RAISE EXCEPTION` do trigger. As telas mostram esse texto cru: `src/pages/Despachos.tsx:231`
(`onError: (error: Error) => toast.error(error.message)`) e `src/pages/KanbanEntregas.tsx` no mesmo desenho.
O operador vê uma mensagem de banco de dados e não sabe o que fazer.
**Causa raiz:** erro de regra de negócio tratado como erro genérico.
**Caminho recomendado:** acrescente ao módulo `src/lib/statusTransitions.ts` (etapa 034) uma função que
reconheça a recusa de transição pela mensagem/código do erro (use o `ERRCODE` definido na etapa 029, não o
texto — texto muda) e devolva uma frase de operação: "Esta entrega está em _X_; o próximo passo é _Y_".
Use-a no `onError` das duas telas. Siga o tom das mensagens que já funcionam bem no repositório:
`src/pages/KanbanEntregas.tsx:321-323` ("Conflito de versão — registro alterado por outro usuário, por favor
recarregue") diz o que houve **e** o que fazer.
**Atalho tentador a evitar:** esconder o erro atrás de uma mensagem genérica ("Não foi possível atualizar").
O operador fica sem saber se foi regra, permissão ou rede, e abre chamado. A mensagem tem de nomear o estado
atual e o próximo passo — essa informação está no mapa da etapa 034, de graça.
**Arquivos e objetos a tocar:** `src/lib/statusTransitions.ts` (acréscimo),
`src/lib/statusTransitions.test.ts` (caso novo), `src/pages/Despachos.tsx:231`,
`src/pages/KanbanEntregas.tsx` (o `onError` da mutation de status)
**Não tocar / armadilhas:** não altere o comportamento de erro de outras mutations das mesmas telas (upload,
exclusão, filtros) — só o `onError` da mutation de status. Não troque `toast.error` por outro mecanismo: o
achado R-01 trata de telas que mostram erro como texto solto, e mudar o mecanismo aqui atravessa aquele
achado.
**Depende de:** 033, 035, 036 · **Libera:** —
**Risco e como reverter:** baixo (apresentação). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/lib/statusTransitions.test.ts
grep -n 'onError' src/pages/Despachos.tsx src/pages/KanbanEntregas.tsx
```

Esperado: o teste da tradução passa. Na aplicação publicada, provoque uma transição inválida e confirme que
o aviso nomeia o status atual e o próximo passo, sem jargão de banco. Cole o texto exibido no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 038 — `CotacaoMultiCanal`: a tabela da tela passa a ler do banco, não do `useState`

**Onda / Severidade / Camada:** 3 / Crítica / interface
**Achados resolvidos:** C-02
**Problema hoje:** `src/pages/CotacaoMultiCanal.tsx:83` declara
`const [cotacoes, setCotacoes] = useState<CotacaoManual[]>([])` e **é esse array** que alimenta a tabela e os
cálculos da tela (`:478-485` deriva `respondidas` e `melhorCotacao` dele). O hook que sabe ler do banco é
importado em `:57`, mas só `createCotacao` é destruturado. Resultado: tudo o que a tela mostra desaparece no
recarregamento da página.
**Causa raiz:** a tela foi construída com estado local em vez de reusar o caminho que já existia; duas telas
fazem a mesma função e só a outra persiste.
**Caminho recomendado:** o padrão a copiar está no repositório, na tela irmã:
`src/pages/DashboardCotacoes.tsx:175-185` destrutura `cotacoes`, `ativas`, `pendentes`, `respondidas`,
`expiradas`, `isLoading`, `error`, `refetch`, `updateCotacao` e `selectCotacao` do mesmo hook. Faça igual em
`:57`: passe a destruturar `cotacoes` (e as derivadas que a tela usar) e **apague o `useState` de `:83`**.
O hook já traz a query com `useQuery` (`src/hooks/logistics/useCotacoesMulticanal.tsx:47-66`), com
`refetchInterval: 30000` e join em `transportadoras`. Ajuste os pontos que liam o estado local para ler da
query; o tipo muda de `CotacaoManual` (local, em `./cotacao-multicanal/types`) para `CotacaoMulticanal` (o do
banco) — é o TypeScript que vai apontar cada ponto a ajustar, use-o como lista de tarefas.
**Atalho tentador a evitar:** manter o `useState` e só "sincronizar" com a query num `useEffect`. Duas fontes
para o mesmo dado é o defeito, não a solução: o `useEffect` sobrescreve o que o usuário acabou de digitar a
cada poll de 30 segundos, e o bug fica intermitente — muito pior de diagnosticar que o atual.
**Arquivos e objetos a tocar:** `src/pages/CotacaoMultiCanal.tsx` (`:57`, `:83` e os pontos que o typecheck
apontar)
**Não tocar / armadilhas:** não altere `src/hooks/logistics/useCotacoesMulticanal.tsx` — ele está completo e
correto, e `DashboardCotacoes` depende dele. Não mexa em `./cotacao-multicanal/types`: outros arquivos da
pasta podem usar `CotacaoManual`. Os `setCotacoes` de `:300-320` e `:440-449` são as etapas 041 e 039 — nesta
etapa, se precisar, deixe-os compilando contra o novo tipo e corrija o comportamento depois.
**Depende de:** — · **Libera:** 039, 040, 041, 042
**Risco e como reverter:** a tela é usada para negociar frete; se a query vier vazia (RLS, filtro), o
operador vê uma tela em branco onde antes via o que digitou na sessão. Confira com dados reais antes do
merge. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'useState<CotacaoManual\|useCotacoesMulticanal()' src/pages/CotacaoMultiCanal.tsx
npm run typecheck && npx eslint src/pages/CotacaoMultiCanal.tsx
```

Esperado: nenhum `useState` de lista de cotações; a destruturação do hook trazendo `cotacoes`. Na aplicação
publicada, abrir `/cotacao-multicanal` mostra as cotações que existem no banco (as mesmas de
`/dashboard-cotacoes`) e **continuam lá depois de recarregar**. Registre as duas telas lado a lado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 039 — Registrar a resposta da transportadora no banco, não na memória

**Onda / Severidade / Camada:** 3 / Crítica / interface
**Achados resolvidos:** C-02
**Problema hoje:** `src/pages/CotacaoMultiCanal.tsx:452-477` — `handleRegistrarResposta` faz
`setCotacoes((prev) => prev.map(...))` e `toast.success("Resposta registrada!")`. **Nenhuma chamada ao
banco.** O preço que a transportadora respondeu por WhatsApp ou e-mail aparece na tela, o usuário recebe a
confirmação de que foi registrado, e o dado morre no recarregamento.
**Causa raiz:** a mutation de atualização existe no hook e nunca foi ligada nesta tela.
**Caminho recomendado:** o padrão está em `src/pages/DashboardCotacoes.tsx:228-238`: `handleRespond` chama
`updateCotacao.mutate({ id, valor_cotado, prazo_dias, observacoes, status: "respondido" })` e o hook cuida do
resto — `src/hooks/logistics/useCotacoesMulticanal.tsx:107-143` monta o `update`, preenche
`responded_at` automaticamente quando o status é `respondido` (`:127-129`), invalida a query e mostra o toast
(`:141-142`). Faça igual: destruture `updateCotacao` do hook e troque o corpo de `handleRegistrarResposta`
pela chamada. **Remova o `toast.success` local** (`:467`) — o hook já emite o seu, e dois toasts para a mesma
ação é o tipo de ruído que faz o operador deixar de ler os avisos. A limpeza dos campos do diálogo
(`:468-473`) continua.
**Atalho tentador a evitar:** chamar `supabase.from("cotacoes_multicanal").update(...)` direto na tela. O
hook já resolve três coisas que você teria de repetir: o `responded_at`, a invalidação da query (sem ela a
tabela não atualiza) e o tratamento de erro. Repetir isso na tela é como as duas telas divergiram.
**Arquivos e objetos a tocar:** `src/pages/CotacaoMultiCanal.tsx` (`:57` para destruturar `updateCotacao`,
`:452-477`)
**Não tocar / armadilhas:** a tela identifica a cotação por `transportadora_id` + `status === "pendente"`
(`:455-458`), porque o estado local não tinha `id`. O `updateCotacao` do hook exige o **`id`** da linha: pegue
o `id` da cotação selecionada vinda da query (etapa 038). Se houver mais de uma cotação pendente para a mesma
transportadora, a escolha de qual atualizar é decisão de negócio — pergunte ao dono em vez de pegar a
primeira.
**Depende de:** 038 · **Libera:** 040
**Risco e como reverter:** se o `id` estiver errado, a tela atualiza a cotação errada — pior que não
atualizar. Teste com duas transportadoras diferentes antes do merge. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'setCotacoes\|updateCotacao' src/pages/CotacaoMultiCanal.tsx
```

Esperado: `handleRegistrarResposta` sem `setCotacoes`, com `updateCotacao.mutate`. Na aplicação publicada:
registre uma resposta, recarregue a página e confirme que o valor continua lá; depois confirme pelo MCP que a
linha em `cotacoes_multicanal` tem `valor_cotado` e `responded_at` preenchidos. Cole a linha no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 040 — Marcar no banco qual cotação foi a escolhida

**Onda / Severidade / Camada:** 3 / Alta / interface
**Achados resolvidos:** C-02
**Problema hoje:** `src/pages/CotacaoMultiCanal.tsx:478-485` calcula `melhorCotacao` como a de menor valor
entre as respondidas, e mostra na tela. Esse cálculo é **só visual**: nada marca a cotação como escolhida no
banco. Não existe registro de por que aquele frete foi contratado — e a negociação não entra em nenhum
relatório.
**Causa raiz:** a mutation `selectCotacao` existe no hook e esta tela não a usa.
**Caminho recomendado:** `src/hooks/logistics/useCotacoesMulticanal.tsx:146-170` tem `selectCotacao`, que
grava `status: "selecionado"` e invalida a query; `src/pages/DashboardCotacoes.tsx:184` já a consome. Nesta
tela, acrescente a ação explícita de escolher: um botão na linha (ou na cotação destacada como melhor) que
chame `selectCotacao.mutate(id)`. Mantenha o cálculo de `melhorCotacao` como **sugestão** — a escolha é do
operador, que pode preferir prazo a preço; o que falta é gravar a decisão, não automatizá-la.
**Atalho tentador a evitar:** marcar automaticamente a de menor valor como selecionada quando todas
responderem. Isso inventa uma regra de negócio que ninguém pediu e grava uma decisão de contratação sem
humano — e o próprio repositório mostra que o critério é composto, não só preço: há pesos de preço, prazo e
desempenho em `src/pages/CotacaoMultiCanal.tsx:86-90`, espelhando `freight_selection_rules`.
**Arquivos e objetos a tocar:** `src/pages/CotacaoMultiCanal.tsx` (`:57` para destruturar `selectCotacao`, o
bloco que exibe `melhorCotacao` e a ação nova)
**Não tocar / armadilhas:** não toque em `STRATEGY_WEIGHTS` (`:86-90`) nem no seletor de estratégia Nexus —
o comentário em `:85-86` avisa que os valores espelham a migration `20260517131144` e que mudar ali deixa a
interface divergente do banco. Não mude o `status` para nenhum valor fora dos que o hook já usa
(`pendente`, `respondido`, `expirado`, `selecionado`, conforme `:160-170`).
**Depende de:** 039 · **Libera:** —
**Risco e como reverter:** baixo (ação nova). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'selectCotacao' src/pages/CotacaoMultiCanal.tsx
```

Esperado: a mutation sendo chamada pela ação de escolha. Na aplicação publicada, escolher uma cotação e
confirmar pelo MCP que a linha ficou com `status = 'selecionado'`; recarregar a tela e ver a marcação
mantida. Cole a linha no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 041 — "Nexus Blast" e o envio por e-mail passam a criar a cotação no banco

**Onda / Severidade / Camada:** 3 / Alta / interface
**Achados resolvidos:** C-02
**Problema hoje:** os dois caminhos que disparam cotação em massa empurram o resultado para o array local:
`src/pages/CotacaoMultiCanal.tsx:311-319` (dentro do laço do Blast, com
`observacoes: "Nexus Blast: Email Automático Enviado"`) e `:440-449` (envio individual por e-mail, com
`observacoes: "Email enviado"`). Quando o Blast termina e mostra 100%, nenhuma das cotações disparadas existe
no banco — então a resposta que chegar depois não tem onde ser registrada.
**Causa raiz:** o mesmo estado local da etapa 038, no caminho de criação.
**Caminho recomendado:** `createCotacao` **já está destruturado** em `:57` e é a única parte do hook que a
tela usa — o que falta é chamá-la nesses dois pontos em vez do `setCotacoes`. O hook
(`src/hooks/logistics/useCotacoesMulticanal.tsx:69-105`) recebe `transportadora_id`, `canal`, origem,
destino, peso, volumes e valor, e invalida a query no sucesso. No laço do Blast, chame uma vez por
transportadora, dentro do mesmo `try` que já existe (`:321-326` captura e registra o erro por
transportadora) — assim uma falha de criação não derruba o lote. Não remova o `console.error` de `:322`:
ele é o único rastro de quem falhou.
**Atalho tentador a evitar:** chamar `createCotacao` para as N transportadoras em paralelo com
`Promise.all`. O laço atual é sequencial de propósito (ele atualiza `blastProgress` a cada item, `:327-328`);
em paralelo, você perde o progresso, estoura o rate limit das integrações e, se uma falhar, não sabe qual.
Mantenha sequencial.
**Arquivos e objetos a tocar:** `src/pages/CotacaoMultiCanal.tsx` (`:311-319`, `:440-449`)
**Não tocar / armadilhas:** o achado R-03 diz que o Blast marca 100% mesmo com todas as transportadoras
falhando — **esse é outro achado e outra etapa**; não conserte o cálculo de progresso aqui. Não toque nas
chamadas às integrações (`rodonaves`, `melhorEnvio`, `lalamove`, declaradas em `:58-60`). Lembre que
`createCotacao` é assíncrona: dentro do laço, `await`.
**Depende de:** 038 · **Libera:** —
**Risco e como reverter:** o Blast passa a gravar N linhas por execução, onde hoje grava zero — volume novo
numa tabela de produção. Rode primeiro com uma transportadora só e confira a linha criada. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'setCotacoes\|createCotacao' src/pages/CotacaoMultiCanal.tsx
```

Esperado: nenhum `setCotacoes` restante no arquivo; `createCotacao` nos dois caminhos. Na aplicação
publicada, dispare um Blast para **uma** transportadora e confirme pelo MCP que existe a linha correspondente
em `cotacoes_multicanal` com `status = 'pendente'`. Cole a linha no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 042 — Mostrar carregando, erro e vazio na tela de cotação multicanal

**Onda / Severidade / Camada:** 3 / Média / interface
**Achados resolvidos:** C-02
**Problema hoje:** com o estado local (`:83`), a tela nunca teve o que mostrar enquanto carrega nem quando a
leitura falha — o array começa vazio e "vazio" era o estado normal. Depois da etapa 038 ela passa a depender
de uma query de rede, e sem esses estados o operador não distingue "ainda carregando", "deu erro" e "não há
cotação", que exigem reações diferentes.
**Causa raiz:** tela construída sobre estado local, sem os estados de uma leitura remota.
**Caminho recomendado:** o hook já expõe `isLoading`, `error` e `refetch`
(`src/hooks/logistics/useCotacoesMulticanal.tsx:172-184`). Destrutura os três e trate os três, copiando o que
a tela irmã faz: `src/pages/DashboardCotacoes.tsx:175-185` os consome. Para o esqueleto de carregamento use
o componente que o repositório já tem (`SkeletonTable`, como em `src/pages/Clientes.tsx:735`); para o erro,
uma mensagem com botão que chama `refetch`; para o vazio, uma frase que diga o próximo passo ("nenhuma
cotação aberta — busque rotas e dispare uma cotação").
**Atalho tentador a evitar:** tratar só o `isLoading` e deixar o `error` de fora, "porque raramente falha".
Falha de leitura com array vazio é indistinguível de "não há cotação": o operador conclui que não há
negociação em aberto e dispara tudo de novo, criando duplicata. O `error` é o estado mais importante dos
três.
**Arquivos e objetos a tocar:** `src/pages/CotacaoMultiCanal.tsx` (`:57` e o bloco de renderização da tabela)
**Não tocar / armadilhas:** o achado R-01 trata de cinco telas que mostram erro como texto solto — **não**
inclua outras telas nesta etapa. Não crie componente novo de estado vazio: use os de
`src/components/common/` que já existem.
**Depende de:** 038 · **Libera:** —
**Risco e como reverter:** baixo (apresentação). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'isLoading\|error\|refetch\|SkeletonTable' src/pages/CotacaoMultiCanal.tsx
npx eslint src/pages/CotacaoMultiCanal.tsx
```

Esperado: os três estados tratados. Na aplicação publicada, simule falha (bloqueie a requisição no
navegador) e confirme que aparece a mensagem de erro com o botão de tentar de novo, não uma tabela vazia.
Registre a captura ou o texto exibido.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 043 — Decidir com o dono o que fazer com as duas telas de cotação

**Onda / Severidade / Camada:** 3 / Alta / arquitetura
**Achados resolvidos:** C-02
**Problema hoje:** há **duas telas para a mesma função**, as duas no menu:
`/cotacao-multicanal` (`src/App.tsx:153`) e `/dashboard-cotacoes` (`src/App.tsx:154`). Elas leem a mesma
tabela pelo mesmo hook e, depois das etapas 038-042, fazem quase a mesma coisa. Duas telas para a mesma
função é como esta divergência nasceu: a mais nova foi escrita do zero em vez de reusar o caminho existente,
e é previsível que a próxima correção seja aplicada só em uma delas.
**Causa raiz:** duplicação de tela, não abandono de hook. (Esta é a correção de rota registrada no achado
C-02: um relatório intermediário dizia que `updateCotacao` e `selectCotacao` "existem e nunca são usados";
é falso — `DashboardCotacoes` os usa.)
**Caminho recomendado:** só entre nesta etapa com 038-042 concluídas, porque é o que torna a comparação
honesta. Leve ao dono o que cada tela faz hoje, em uma linha cada: `CotacaoMultiCanal` é a tela de
**disparar** (busca de rotas, Nexus Blast, cobertura, envio por canal); `DashboardCotacoes` é a tela de
**acompanhar** (abas por situação, filtro por canal, agrupamento por trecho, registro de resposta, logs).
Duas saídas defensáveis: (a) manter as duas, com divisão explícita de papel — disparar x acompanhar — e
remover de cada uma o que é do outro papel; (b) juntar em uma, aposentando a rota perdedora. Em qualquer
caso, **remover rota e entrada de menu é mudança que o dono aprova**: pode haver link salvo, atalho ou
treinamento apontando para lá. Registre a decisão em `05-PROGRESSO.md`.
**Atalho tentador a evitar:** apagar uma das telas por conta própria "porque é duplicada". Uma delas tem
funcionalidade que a outra não tem (cobertura, Blast, logs de workflow); apagar a errada tira capacidade de
operação, e isso só aparece na primeira semana de uso. Proponha, não execute.
**Arquivos e objetos a tocar:** nenhum nesta etapa (decisão e registro). O reflexo, se houver, é em
`src/App.tsx:153-154` e no menu, em etapa própria.
**Não tocar / armadilhas:** não remova nenhuma rota de `src/App.tsx` nem entrada de menu sem a decisão
registrada. Se o dono escolher juntar, a migração das funcionalidades da tela aposentada é trabalho novo:
liste em ordem, com arquivos, em `05-PROGRESSO.md`, em vez de começar e deixar pela metade.
**Depende de:** 038, 039, 040, 041, 042 · **Libera:** —
**Risco e como reverter:** nenhum (etapa de decisão)
**Precisa de aprovação humana antes do merge:** sim (mudança de arquitetura e remoção de tela/rota)
**Como verificar:** anotação em `05-PROGRESSO.md` com a decisão ("mantém as duas, papéis X e Y" ou "junta em
Z, aposenta W em etapa própria"), quem decidiu e a data, mais a lista do que falta se a escolha for juntar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 044 — `Despachos`: avisar quando o avanço de status não gravou

**Onda / Severidade / Camada:** 3 / Alta / interface
**Achados resolvidos:** C-03
**Problema hoje:** `src/pages/Despachos.tsx:199-208` faz
`.update({ status: nextStatus }).eq("id", item.id).eq("version", item.version)` — filtra pela versão, o que é
correto — mas **sem `{ count: "exact" }`**. Em Supabase, `.update()` sem `count` não informa quantas linhas
mudaram e **não devolve erro** quando o filtro não casa: zero linhas afetadas é indistinguível de sucesso.
Então `:225-229` mostra "Movido para Despachado" e `:210-221` ainda grava uma linha em `kanban_history`
registrando uma transição que não aconteceu.
**Causa raiz:** o padrão correto foi implementado em uma tela e não foi propagado para as outras três.
**Caminho recomendado:** copie o padrão de `src/pages/KanbanEntregas.tsx:297-323`, que já faz certo:
`{ count: "exact" }` como segundo argumento do `.update()` e, logo depois do `if (error) throw error`,
`if (count === 0) throw new Error("Conflito de versão — registro alterado por outro usuário, por favor
recarregue")`. Ponha a checagem **antes** do `onStatusChange` (`:210`) e antes do insert em `kanban_history`
(`:212-221`), para que nada seja registrado quando a gravação não ocorreu. O `onError` da mutation
(`:231`) já mostra `error.message`, então a mensagem chega à tela sem mais nada.
**Atalho tentador a evitar:** acrescentar `.select()` ao final para "ver se voltou algo". Funciona por
acidente e muda o contrato da chamada (passa a trazer a linha inteira pela rede, e com RLS a resposta pode
vir vazia por outro motivo). O recurso feito para isso é `{ count: "exact" }` — e é o que a tela irmã usa.
**Arquivos e objetos a tocar:** `src/pages/Despachos.tsx` (`:199-221`)
**Não tocar / armadilhas:** **não acrescente `version: item.version + 1` ao payload.** O banco já
incrementa pelo trigger `tr_increment_version_entregas`
(`supabase/migrations/20260513164426_...sql:24-29`); mandar do cliente é redundante (o `BEFORE UPDATE`
sobrescreve) e dá a falsa impressão de que o front controla a versão. Não toque na mutation de `:256-270`
(etapa 045) nem na regra da NF (`:237-246`).
**Depende de:** — · **Libera:** 048
**Risco e como reverter:** movimentações que hoje "dão certo" silenciosamente passam a mostrar erro — é o
objetivo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'count: "exact"\|count === 0' src/pages/Despachos.tsx
npm run typecheck && npx eslint src/pages/Despachos.tsx
```

Esperado: as duas construções presentes na mutation de avanço. Teste real: abra a mesma entrega em duas
abas, avance na primeira, depois avance na segunda — a segunda deve mostrar a mensagem de conflito e
**não** gravar em `kanban_history`. Confirme pelo MCP que não há linha nova. Registre as duas evidências.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 045 — `Despachos`: avisar quando a autorização de despacho final não gravou

**Onda / Severidade / Camada:** 3 / Alta / interface
**Achados resolvidos:** C-03
**Problema hoje:** `src/pages/Despachos.tsx:257-266` é o mesmo defeito da etapa 044 no caminho mais caro da
tela: o despacho final, que grava `status: "despachado"` **e** `data_despacho`. Sem `{ count: "exact" }`,
o operador vê a confirmação, acredita que autorizou a saída do material, e o registro pode não ter mudado.
Em seguida `:269-278` grava "Despacho final autorizado" em `kanban_history`.
**Causa raiz:** a mesma da etapa 044, em outra mutation do mesmo arquivo.
**Caminho recomendado:** mesma correção da etapa 044, mesma referência
(`src/pages/KanbanEntregas.tsx:297-323`): `{ count: "exact" }`, `if (count === 0) throw`, antes do
`onStatusChange` (`:268`) e do insert em `kanban_history`. Aqui a mensagem merece ser mais específica: este
é o passo que o `ConfirmDialog` de `:546-553` chama de "irreversível", então o aviso deve dizer que **nada
foi despachado** e que é preciso recarregar e conferir — se o operador achar que despachou e não despachou, a
mercadoria fica parada sem ninguém saber.
**Atalho tentador a evitar:** juntar esta correção com a da etapa 044 numa PR só, "porque é o mesmo
arquivo e a mesma linha de código". São dois caminhos com consequências diferentes: se o padrão escolhido
estiver errado, você descobre nas duas mutations ao mesmo tempo e tem de reverter o despacho final junto. Uma
mutation por PR.
**Arquivos e objetos a tocar:** `src/pages/Despachos.tsx` (`:257-278`)
**Não tocar / armadilhas:** a mesma armadilha da 044 — **não** mande `version` incrementada do cliente. Não
toque em `data_despacho`: a data é gravada pelo front hoje e mudar isso para o banco é outra decisão. Não
mexa no `ConfirmDialog` de `:546-553`; ele é o padrão de referência que a etapa 059 vai copiar.
**Depende de:** — · **Libera:** 048
**Risco e como reverter:** igual à 044. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '255,280p' src/pages/Despachos.tsx
```

Esperado: `{ count: "exact" }` e a checagem de `count === 0` antes de qualquer efeito colateral. Teste em
duas abas, como na etapa 044, no caminho do despacho final. Registre a mensagem exibida e a ausência de
linha nova em `kanban_history`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 046 — BOX: não registrar alocação no histórico quando a alocação não aconteceu

**Onda / Severidade / Camada:** 3 / Alta / hook
**Achados resolvidos:** C-03
**Problema hoje:** `src/hooks/logistics/useBoxManagement.tsx:139-145` faz
`.update({ box_alocado: boxId }).eq("id", deliveryId).eq("version", version)` sem
`{ count: "exact" }` e, em seguida, `:147-154` grava em `kanban_history` "Alocado ao BOX NN" **sem nem
checar erro** (não há `if (error)` nesse insert). O `onSuccess` (`:156-160`) mostra "Entrega alocada no BOX
NN". É o pior dos três casos: duas mercadorias passam a apontar para o mesmo BOX nos relatórios, porque o
histórico afirma uma alocação que o registro não tem.
**Causa raiz:** a mesma de 044/045, agravada por gravar histórico sem conferir o resultado da operação
principal.
**Caminho recomendado:** mesma correção, mesma referência (`src/pages/KanbanEntregas.tsx:297-323`):
`{ count: "exact" }` no `.update()` de `:139`, e `if (count === 0) throw new Error(...)` **antes** do insert
em `kanban_history` de `:147`. Aproveite para checar o erro desse insert: os outros pontos do repositório que
gravam `kanban_history` o fazem com `if (histError) console.warn(...)`
(`src/pages/Despachos.tsx:221`) — siga esse mesmo tratamento, que é deliberadamente tolerante (histórico não
deve derrubar a operação) mas deixa rastro.
**Atalho tentador a evitar:** mover o insert do histórico para dentro de um `try/catch` e seguir em frente
sem checar o `count` do update. O histórico não é o problema: o problema é que a alocação pode não ter
ocorrido. Primeiro o `count`, depois o histórico.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useBoxManagement.tsx` (`:139-154`)
**Não tocar / armadilhas:** não mexa na leitura de `:133-137` (o `select("status")` que alimenta
`from_status`/`to_status` do histórico) — é outra consulta e outro assunto. **Não** mande `version`
incrementada; o trigger cuida. Este hook é usado por tela(s) de BOX: rode
`grep -rn 'useBoxManagement' src/` e confira que o `onError` da chamadora mostra a mensagem, senão o aviso
morre no console.
**Depende de:** — · **Libera:** 048
**Risco e como reverter:** alocações que hoje passam silenciosamente passam a avisar. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'count: "exact"\|count === 0\|kanban_history' src/hooks/logistics/useBoxManagement.tsx
grep -rn 'useBoxManagement' src/ | grep -v useBoxManagement.tsx
```

Esperado: a checagem presente antes do insert, e a lista de telas que usam o hook. Teste em duas abas: aloque
o mesmo BOX duas vezes e confirme que a segunda avisa e **não** cria linha em `kanban_history`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 047 — Parar de mandar `version + 1` do navegador no Kanban

**Onda / Severidade / Camada:** 3 / Média / interface
**Achados resolvidos:** C-03
**Problema hoje:** `src/pages/KanbanEntregas.tsx:301` inclui `version: version + 1` no payload do update. A
tela é o padrão de referência de C-03 por causa do `{ count: "exact" }` e do `if (count === 0)` — mas
**esta linha é o defeito que o próprio achado manda não copiar**. O banco já incrementa a versão pelo trigger
`tr_increment_version_entregas` (`supabase/migrations/20260513164426_...sql:24-29`), que é `BEFORE UPDATE` e
sobrescreve o que vier do cliente. Hoje é inofensivo; o problema é que ela ensina errado: quem copiar a tela
(etapas 044-046) vai levar a linha junto e acreditar que o front controla a versão.
**Causa raiz:** incremento de versão duplicado entre front e trigger.
**Caminho recomendado:** remova `version: version + 1` do objeto de update (`:301`), mantendo o
`.eq("version", version)` do filtro (`:314`) — é o filtro que faz o travamento otimista, não o payload.
Confira no banco, antes, que o trigger existe mesmo:
`SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.entregas'::regclass AND NOT tgisinternal;` deve listar
`tr_increment_version_entregas`. Se **não** listar, a correção é oposta (o front é o único incrementando) e a
etapa muda de forma: pare, registre em `05-PROGRESSO.md` e avise o dono.
**Atalho tentador a evitar:** deixar a linha "porque funciona e não custa nada". É o mecanismo de
concorrência de toda a tabela `entregas`: duas fontes incrementando a mesma coluna é exatamente o tipo de
ambiguidade que produz o bug que ninguém reproduz. E a linha é copiada junto quando alguém usa esta tela como
modelo — o que as etapas 044-046 mandam fazer.
**Arquivos e objetos a tocar:** `src/pages/KanbanEntregas.tsx` (`:301`)
**Não tocar / armadilhas:** **não toque** no `.eq("version", version)` de `:314`, no
`{ count: "exact" }` de `:312` nem no `if (count === 0)` de `:317-323`. Também não mexa nos blocos
condicionais de `data_entrega_efetiva` e `data_despacho` (`:303-311`). O diff desta etapa é **uma linha**.
**Depende de:** — · **Libera:** 048
**Risco e como reverter:** se o trigger não existir no banco (verificação acima), a versão deixa de ser
incrementada e o travamento otimista para de funcionar em todas as telas. É por isso que a consulta vem
primeiro. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'version' src/pages/KanbanEntregas.tsx | sed -n '1,20p'
```

Esperado: `version` aparece no filtro e nos parâmetros da mutation, **não** no objeto de update. Pelo MCP,
confirme que o trigger existe e que, depois de uma movimentação pela tela, a coluna `version` da entrega
subiu em 1. Cole as duas saídas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 048 — Extrair a checagem de conflito para um utilitário, com teste

**Onda / Severidade / Camada:** 3 / Média / interface
**Achados resolvidos:** C-03
**Problema hoje:** depois das etapas 044-046, a mesma sequência (`{ count: "exact" }` → `if (count === 0)`
→ `throw` com a mesma frase) existe copiada em quatro lugares:
`src/pages/KanbanEntregas.tsx:312-323`, `src/pages/Despachos.tsx` (duas mutations) e
`src/hooks/logistics/useBoxManagement.tsx`. A causa raiz do achado C-03 é precisamente que o padrão correto
**não foi propagado** — e cópia manual é como ele deixou de ser propagado na primeira vez. A quinta tela que
atualizar `entregas` vai nascer sem ele.
**Causa raiz:** padrão de correção sem lugar único onde morar.
**Caminho recomendado:** faça **depois** de 044-047 estarem mergeadas, com o padrão já estabilizado, para não
desenhar o utilitário por suposição. Crie em `src/lib/` uma função pequena — do tipo
`assertAtualizou(count: number | null): void`, que lança o erro com a mensagem única de conflito (a de
`src/pages/KanbanEntregas.tsx:321-323`, que já é boa: diz o que houve e o que fazer) — com teste irmão no
padrão de `src/lib/validations.test.ts`, cobrindo `count === 0`, `count === 1` e `count === null`. Troque as
quatro cópias pela chamada. Exporte pelo barrel `src/lib/index.ts`, como os outros.
**Atalho tentador a evitar:** criar um wrapper genérico em volta do `supabase.from().update()` para
"garantir que ninguém esqueça". Isso é camada nova de abstração sobre o cliente do Supabase: toca todas as
telas, dificulta a leitura do que a consulta faz e vira dívida nova. O utilitário que resolve é a função de
três linhas que verifica o `count`; quem chama continua escrevendo a consulta à vista.
**Arquivos e objetos a tocar:** novo arquivo em `src/lib/` e seu teste, `src/lib/index.ts`,
`src/pages/KanbanEntregas.tsx`, `src/pages/Despachos.tsx`,
`src/hooks/logistics/useBoxManagement.tsx` (apenas as linhas da checagem)
**Não tocar / armadilhas:** não altere a mensagem de conflito ao centralizar — ela já está em produção e os
operadores a conhecem; mudar texto aqui é churn. Não inclua nesta etapa nenhum outro ponto que faça
`.update()` sem `count`: fora das quatro listadas, é achado novo para `05-PROGRESSO.md`. Lembre do orçamento
de lint em 105/105.
**Depende de:** 044, 045, 046, 047 · **Libera:** —
**Risco e como reverter:** baixo (refatoração de quatro pontos já corrigidos e testados). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/lib/<nome-do-teste>
grep -rn 'count === 0' src/pages/Despachos.tsx src/pages/KanbanEntregas.tsx src/hooks/logistics/useBoxManagement.tsx
npm run typecheck && npm run lint:budget
```

Esperado: o teste passa, nenhuma das três telas tem mais a comparação copiada (todas chamam o utilitário), e
o orçamento de lint não subiu. Teste de duas abas em uma das telas, para confirmar que o comportamento é o
mesmo de antes da refatoração.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 049 — `BulkActions`: ação destrutiva passa a pedir confirmação

**Onda / Severidade / Camada:** 1 / Crítica / interface
**Achados resolvidos:** D-01
**Problema hoje:** `src/components/common/BulkActions.tsx:74` (caminho de até 3 ações) e `:93` (caminho do
menu, quando há mais de 3) disparam `action.onClick(selectedIds)` **no clique**, sem nenhuma confirmação.
A propriedade `variant: "destructive"` que as telas passam só muda a cor do botão (`:67-69`) e a cor do item
de menu (`:96-99`): não há `AlertDialog` em nenhum ponto do arquivo. Três telas herdam isso, e numa delas
(`src/pages/Clientes.tsx:1041`) excluir **um** cliente abre confirmação — excluir vinte, não.
**Causa raiz:** a confirmação foi implementada por tela, no caminho individual; o componente comum de ações
em lote nasceu sem ela, e toda tela que o adota herda o defeito.
**Caminho recomendado:** corrija **no componente**, não nas telas: quando `action.variant ===
"destructive"`, o clique passa a abrir um `ConfirmDialog` e só chama `action.onClick(selectedIds)` no
`onConfirm`. O componente já existe e é o padrão do repositório:
`src/components/common/ConfirmDialog.tsx` (props `open`, `onOpenChange`, `title`, `description`,
`confirmText`, `type`, `onConfirm`). O exemplo mais próximo é
`src/components/freight/FreightTableManager.tsx:610-618`, que usa `ConfirmDialog` para **ação em lote**, com
o título dizendo a quantidade (`Excluir ${bulkDeleteIds?.length || 0} tabelas?`). Guarde num `useState` a
ação pendente, renderize um `ConfirmDialog` no fim do componente e use `type="danger"`. Ações não
destrutivas continuam disparando direto — nada muda para elas.
**Atalho tentador a evitar:** adicionar `ConfirmDialog` em cada tela que usa o componente. Além de triplicar
o trabalho (`Clientes`, `Fornecedores`, `FretesInternos`), deixa a **próxima** tela que adotar `BulkActions`
desprotegida de novo — que é exatamente como chegamos aqui. Uma mudança, três telas protegidas.
**Arquivos e objetos a tocar:** `src/components/common/BulkActions.tsx` (`:74`, `:93`, mais o estado e o
diálogo)
**Não tocar / armadilhas:** não mude a **interface** `BulkAction` (`:13-19`) nesta etapa — acrescentar campos
é a etapa 050; aqui o texto da confirmação é genérico e derivado do `action.label` e da quantidade. Não
altere as três telas chamadoras. Não mexa no caminho do `DropdownMenu` além da chamada: o
`DropdownMenuSeparator` condicional de `:89-91` tem lógica própria.
**Depende de:** — · **Libera:** 050, 051, 052
**Risco e como reverter:** ações em lote passam a exigir um clique a mais — é o objetivo. Se o `ConfirmDialog`
for renderizado dentro do `DropdownMenuContent`, ele fecha junto com o menu e nunca aparece: renderize **fora**
do dropdown. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'ConfirmDialog\|onClick={() => action.onClick' src/components/common/BulkActions.tsx
npx eslint src/components/common/BulkActions.tsx && npm run typecheck
```

Esperado: nenhuma chamada direta a `action.onClick` no clique de ação destrutiva; `ConfirmDialog` importado e
renderizado. Na aplicação publicada, em `/clientes`: selecione 2 clientes, clique em "Excluir Selecionados"
e confirme que **aparece o diálogo** e que cancelar não exclui nada. Registre os dois resultados.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 050 — Deixar cada tela escrever o texto da própria confirmação

**Onda / Severidade / Camada:** 1 / Alta / interface
**Achados resolvidos:** D-01
**Problema hoje:** com a etapa 049, o texto da confirmação é genérico e derivado do `label`. Mas as três
ações destrutivas têm consequências bem diferentes: `src/pages/Clientes.tsx:725-729` e
`src/pages/Fornecedores.tsx:607-611` **excluem cadastro**; `src/pages/FretesInternos.tsx:532-537` muda status
para `cancelado`. Uma confirmação que diz a mesma coisa nos três casos ensina o operador a clicar sem ler.
**Causa raiz:** o contrato do componente não tem onde a tela declarar o que a ação faz.
**Caminho recomendado:** acrescente à interface `BulkAction`
(`src/components/common/BulkActions.tsx:13-19`) dois campos **opcionais**: `confirmTitle?: string` e
`confirmDescription?: (count: number) => string` (ou `string`, se preferir simples). Use-os no
`ConfirmDialog` da etapa 049, com o texto genérico como padrão quando não vierem. Depois preencha nas três
telas, no tom do que o repositório já escreve bem — compare com
`src/components/freight/FreightTableManager.tsx:599` ("Esta ação não pode ser desfeita...") e com
`src/pages/Clientes.tsx:1045-1048`, a confirmação individual da mesma tela, que nomeia o registro. Para
`FretesInternos`, o texto deve dizer que **cancela** os fretes selecionados, não que exclui.
**Atalho tentador a evitar:** tornar os campos obrigatórios na interface. Isso quebra o build de qualquer
outra tela que use `BulkActions` hoje ou amanhã, e transforma uma melhoria de texto em obstáculo — o
resultado prático é alguém tipar `confirmTitle: ""` para compilar. Opcional com bom padrão.
**Arquivos e objetos a tocar:** `src/components/common/BulkActions.tsx` (interface `:13-19` e o uso no
diálogo), `src/pages/Clientes.tsx:725-729`, `src/pages/Fornecedores.tsx:607-611`,
`src/pages/FretesInternos.tsx:532-537`
**Não tocar / armadilhas:** não altere os `onClick` das três telas (`bulkDeleteMut.mutate(ids)` e
`bulkUpdateStatus(ids, "cancelado")`) — só acrescente os campos de texto. Não toque na ação **não**
destrutiva de `FretesInternos` (`:526-530`, "entregue"): ela não deve ganhar confirmação.
**Depende de:** 049 · **Libera:** 051
**Risco e como reverter:** baixo (texto). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'confirmTitle\|confirmDescription' src/components/common/BulkActions.tsx src/pages/Clientes.tsx src/pages/Fornecedores.tsx src/pages/FretesInternos.tsx
npm run typecheck
```

Esperado: os campos definidos no componente e preenchidos nas três telas. Na aplicação publicada, confirme
que o texto de `/fretes-internos` fala de **cancelamento** e o de `/clientes` fala de **exclusão**.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 051 — Exigir digitação para confirmar exclusão em massa de cadastro

**Onda / Severidade / Camada:** 1 / Alta / interface
**Achados resolvidos:** D-01
**Problema hoje:** mesmo com a etapa 049, um diálogo de "sim/não" na exclusão de **todos os clientes
selecionados** tem o mesmo custo de clique que confirmar qualquer outra coisa. O achado D-01 chama isso de "o
caminho mais curto para perda de dado no sistema inteiro", e não há como desfazer pela interface.
**Causa raiz:** atrito igual para ações de consequência muito diferente.
**Caminho recomendado:** `src/components/common/ConfirmDialog.tsx` **já tem** o recurso: a prop
`requireTyping?: string` (`:31`) só habilita o botão quando o texto digitado é igual ao valor passado
(`:52`, `canConfirm`), e o campo é limpo quando o diálogo fecha (`:48-50`). Exponha isso em `BulkActions`
como um campo opcional da ação (`requireTyping?: string`, no desenho da etapa 050) e ligue-o **somente** nas
duas exclusões de cadastro: `src/pages/Clientes.tsx:725-729` e `src/pages/Fornecedores.tsx:607-611`. Use uma
palavra curta e previsível (`EXCLUIR`), não o nome da entidade — que muda de registro para registro. Use
também `type="critical"` (o `ConfirmType` existe em `:18-19`) para a aparência acompanhar a gravidade.
**Atalho tentador a evitar:** exigir digitação em toda ação destrutiva, incluindo o cancelamento de fretes
em `FretesInternos`. Atrito indiscriminado é tratado como ruído: o operador decora a palavra e digita sem
ler, e aí você perdeu o atrito também na exclusão. Reserve a digitação para o que não dá para desfazer.
**Arquivos e objetos a tocar:** `src/components/common/BulkActions.tsx` (campo novo e passagem para o
diálogo), `src/pages/Clientes.tsx:725-729`, `src/pages/Fornecedores.tsx:607-611`
**Não tocar / armadilhas:** **não mexa** em `src/components/common/ConfirmDialog.tsx` — o recurso já está
pronto e é usado por outros pontos; alterá-lo afeta todas as confirmações do sistema. Não ligue `requireTyping`
na confirmação individual de `src/pages/Clientes.tsx:1041` (um registro): aquele caminho já tem atrito
adequado, e mudar o que funciona é churn.
**Depende de:** 050 · **Libera:** 052
**Risco e como reverter:** exclusão em massa fica mais lenta de propósito. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'requireTyping' src/components/common/BulkActions.tsx src/pages/Clientes.tsx src/pages/Fornecedores.tsx src/components/common/ConfirmDialog.tsx
```

Esperado: `requireTyping` definido no `ConfirmDialog` (inalterado), exposto no `BulkActions` e usado nas duas
telas de cadastro — e **ausente** em `FretesInternos`. Na aplicação publicada, confirme que o botão de
exclusão fica desabilitado até a palavra ser digitada corretamente.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 052 — Teste do `BulkActions`: ação destrutiva não executa sem confirmação

**Onda / Severidade / Camada:** 1 / Média / interface (teste)
**Achados resolvidos:** D-01
**Problema hoje:** a proteção das etapas 049-051 vive num componente compartilhado por três telas e nenhuma
delas tem teste (achado H-13: nenhuma tela tem teste). A primeira refatoração que mexer no fluxo de clique do
`BulkActions` desfaz a correção sem que nada reprove — e o defeito volta em três telas de uma vez.
**Causa raiz:** componente de risco alto sem rede de proteção.
**Caminho recomendado:** o repositório **tem** o ferramental: `@testing-library/react` está nas dependências
e `src/hooks/logistics/useRuleTriggers.test.tsx` é o exemplo funcionando (vitest + `jsdom`, configurado em
`vitest.config.ts:8-10`). Crie `src/components/common/BulkActions.test.tsx` com três casos: (1) ação
**não** destrutiva — clicar chama `onClick` com os `selectedIds` imediatamente; (2) ação destrutiva —
clicar **não** chama `onClick`, e o diálogo aparece; (3) confirmar no diálogo chama `onClick` **uma vez** com
os `selectedIds` corretos. Use `vi.fn()` para o `onClick`, como o teste de referência faz com
`evaluateRulesMock`. Se as etapas 050/051 estiverem feitas, acrescente um caso para `requireTyping`:
confirmar sem digitar não chama `onClick`.
**Atalho tentador a evitar:** testar a tela `Clientes` inteira em vez do componente. A tela puxa
autenticação, TanStack Query, Supabase e meia dúzia de hooks; o teste fica lento, frágil e, quando quebrar,
não dirá que foi a confirmação. Teste o componente, que recebe tudo por prop — é a razão de ele existir.
**Arquivos e objetos a tocar:** novo `src/components/common/BulkActions.test.tsx`
**Não tocar / armadilhas:** não acrescente dependência nova (AGENTS.md: dependência nova só se
indispensável) — `@testing-library/react` e `jsdom` já estão lá. Atenção ao caminho do `DropdownMenu`
(mais de 3 ações): o menu do Radix só renderiza o conteúdo depois de aberto, então teste primeiro o caminho de
até 3 ações (`:66-78`), que é o que as três telas usam.
**Depende de:** 049 · **Libera:** —
**Risco e como reverter:** nenhum (só teste). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/components/common/BulkActions.test.tsx
npx eslint src/components/common/BulkActions.test.tsx && npm run lint:budget
```

Esperado: os casos passam. Confirme também que, desfazendo a etapa 049 (com `git stash`), o caso (2)
**reprova** — teste que passa nas duas versões não protege nada.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 053 — `Transportadoras`: trocar exclusão real por exclusão lógica

**Onda / Severidade / Camada:** 1 / Alta / interface
**Achados resolvidos:** D-02
**Problema hoje:** `src/pages/Transportadoras.tsx:337-342` faz
`.from("transportadoras").delete().eq("id", id)` — apaga o registro de verdade, contra
`docs/SOFT_DELETE_POLICY.md`, que define exclusão lógica por `deleted_at`. Se houver entregas, cotações ou
histórico apontando para a transportadora, ou o banco recusa (e o usuário vê um erro técnico sem explicação)
ou o vínculo some dos relatórios. Nos outros cadastros o registro só fica escondido e pode voltar.
**Causa raiz:** a política existe como documento e não como mecanismo; nada no código impede um `.delete()`.
**Caminho recomendado:** duas boas notícias que o achado não traz, confirmadas: a coluna **existe** —
`transportadoras` tem `deleted_at` em `src/integrations/supabase/types.ts` (bloco `transportadoras`) — e a
consulta principal da própria tela **já filtra**: `src/pages/Transportadoras.tsx:210` tem
`.is("deleted_at", null)`. Então aqui é só trocar a operação: siga o padrão das telas que já fazem certo,
`src/pages/Clientes.tsx:337` e `src/pages/Fornecedores.tsx:286`, ambas
`.update({ deleted_at: new Date().toISOString() }).eq("id", id)`. Mantenha o `onSuccess`/`onError` e o
`invalidate()` como estão (`:345-356`).
**Atalho tentador a evitar:** trocar por `deleted_at` e parar aí, sem a auditoria de filtros da etapa 054.
O achado é explícito: trocar a exclusão sem acrescentar o filtro faz o registro "excluído" **reaparecer** nas
listas — um defeito pior que o atual, porque parece que a exclusão não funciona. A tela principal já filtra;
os outros onze arquivos que leem a tabela, não se sabe.
**Arquivos e objetos a tocar:** `src/pages/Transportadoras.tsx` (`:336-343`)
**Não tocar / armadilhas:** não toque no `bulkHomologarMut` (`:366-372`), que faz `.update({ homologada })
.in("id", ids)` — é outra operação. Não acrescente filtro em nenhum outro arquivo nesta etapa (é a 054), para
o diff ficar revisável. Confirme no banco, antes, que a coluna existe de fato:
`SELECT column_name FROM information_schema.columns WHERE table_name='transportadoras' AND
column_name='deleted_at';` — `types.ts` é gerado e pode estar atrasado.
**Depende de:** — · **Libera:** 054
**Risco e como reverter:** a transportadora "excluída" continua no banco e pode reaparecer em telas sem
filtro até a etapa 054 — risco conhecido e contido, porque hoje o `.delete()` pode estar falhando em
silêncio por restrição de chave estrangeira. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n '.delete()\|deleted_at' src/pages/Transportadoras.tsx
```

Esperado: nenhum `.delete()` no arquivo; o `update` com `deleted_at` presente. Na aplicação publicada,
exclua uma transportadora de teste, confirme que sai da lista e que a linha **continua** no banco com
`deleted_at` preenchido (consulta pelo MCP). Cole a linha no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 054 — Filtrar `deleted_at IS NULL` em todas as leituras de `transportadoras`

**Onda / Severidade / Camada:** 1 / Alta / interface + hooks
**Achados resolvidos:** D-02
**Problema hoje:** `transportadoras` é lida em **12 arquivos** fora da própria tela —
`src/components/coletas/PickupDialog.tsx`, `src/hooks/common/useGlobalSearch.tsx`,
`src/hooks/logistics/useCostAlerts.tsx`, `src/hooks/logistics/useFreightQuotation.tsx`,
`src/hooks/data/usePrefetch.ts`, `src/hooks/analytics/useDashboardMetrics.tsx`,
`src/hooks/analytics/useExecutiveMetrics.tsx`, `src/pages/Envios.tsx`,
`src/pages/ConfiguracoesFrete.tsx`, `src/pages/ExportacaoDados.tsx`,
`src/pages/RotasTransportadoras.tsx` — e não há garantia de que filtrem `deleted_at`. Depois da etapa 053 a
transportadora excluída passa a existir no banco: onde faltar o filtro, ela reaparece em seletor de
cotação, busca global, métricas e exportação.
**Causa raiz:** a política de exclusão lógica nunca foi aplicada ponto a ponto.
**Caminho recomendado:** levante os pontos exatos com o grep do campo de verificação e acrescente
`.is("deleted_at", null)` onde faltar, exatamente como `src/pages/Transportadoras.tsx:210` e
`src/pages/Clientes.tsx` fazem nas suas consultas. Decida caso a caso com um critério simples: **leitura que
oferece a transportadora como escolha** (seletores, busca, cotação, rotas) filtra sempre; **leitura
histórica** (métricas de meses passados, exportação de período fechado) pode precisar incluir as excluídas
para o passado não mudar — nesses casos, mantenha sem filtro e **deixe um comentário de uma linha dizendo por
quê**, senão o próximo agente "corrige" e os relatórios históricos mudam.
**Atalho tentador a evitar:** criar um hook ou wrapper "transportadorasAtivas" e trocar as 12 chamadas. É
camada nova, diff grande e atravessa o achado A-12 (oito arquivos de hook que ninguém importa — o repositório
já tem abstração sobrando). Acrescente o filtro onde a consulta está.
**Arquivos e objetos a tocar:** os arquivos que o grep apontar sem filtro, entre os 12 listados (apenas as
linhas de consulta)
**Não tocar / armadilhas:** não mexa em edge functions nesta etapa — elas usam `service_role` e têm regras
próprias; registre em `05-PROGRESSO.md` se encontrar alguma lendo a tabela. Não altere a forma da consulta
(colunas, `order`, `limit`): só acrescente o filtro. Se algum ponto usar `select("*")` em tabela larga, isso é
o achado P-04 — não o conserte aqui.
**Depende de:** 053 · **Libera:** —
**Risco e como reverter:** acrescentar filtro onde não devia faz dado histórico desaparecer de relatório —
por isso o critério e o comentário. Confira um relatório antes e depois. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'from("transportadoras")' -A4 src/ | grep -B2 -A2 'select' | head -60
grep -rln 'from("transportadoras")' src/ | wc -l
```

Esperado: toda leitura que oferece escolha com `.is("deleted_at", null)`; as sem filtro, com comentário
explicando. Na aplicação publicada, com uma transportadora excluída logicamente, confirme que ela **não**
aparece no seletor de cotação nem na busca global. Registre os dois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 055 — Migration: acrescentar `deleted_at` a `fretes_internos`

**Onda / Severidade / Camada:** 1 / Alta / banco
**Achados resolvidos:** D-02
**Problema hoje:** `src/pages/FretesInternos.tsx:254-258` faz `.from("fretes_internos").delete()`. A correção
natural seria trocar por `deleted_at` como em `Clientes` e `Fornecedores` — só que **a coluna não existe**:
das tabelas do sistema, apenas `clientes`, `coletas`, `entregas`, `fornecedores` e `transportadoras` têm
`deleted_at` (conferido em `src/integrations/supabase/types.ts`). Sem a coluna, não há exclusão lógica
possível, e é por isso que esta etapa precede a correção da tela.
**Causa raiz:** `docs/SOFT_DELETE_POLICY.md` foi escrito depois de `fretes_internos` existir, e a tabela
nunca foi alcançada.
**Caminho recomendado:** **comece pelo banco**, não pelo `types.ts` (que é gerado e pode estar atrasado):
`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND
table_name='fretes_internos';` — se `deleted_at` já estiver lá, esta etapa é encerrada como "não se aplica" e
a 057 segue direto. Se não: escreva um arquivo em `supabase/migrations/` com
`ALTER TABLE public.fretes_internos ADD COLUMN IF NOT EXISTS deleted_at timestamptz;`, copiando a forma das
colunas equivalentes nas outras cinco tabelas (confira o tipo real de uma delas no banco antes, para não
divergir: `timestamp with time zone` vs `timestamptz` é o mesmo tipo, mas siga a grafia usada). Cabeçalho
explicando o porquê, como `supabase/migrations/20260902120000_hardening_pos_auditoria.sql:1-10`. Abra a PR e
pare: a aplicação é a etapa 056.
**Atalho tentador a evitar:** acrescentar também um índice parcial `WHERE deleted_at IS NULL` "já que estamos
aqui". O achado P-05 trata de filtros sem índice e o P-06 de índices duplicados — índice é decisão medida,
com `pg_stat_user_indexes` na mão, não brinde de migration. Uma coluna, uma migration.
**Arquivos e objetos a tocar:** um novo arquivo em `supabase/migrations/`
**Não tocar / armadilhas:** não acrescente `NOT NULL` nem `DEFAULT now()` — `deleted_at` **tem** de aceitar
nulo (nulo = não excluído), e um default preencheria tudo como excluído. Não mexa nas policies de RLS da
tabela: se houver policy de `DELETE`, ela continua válida e é assunto de outra etapa.
**Depende de:** — · **Libera:** 056
**Risco e como reverter:** `ADD COLUMN` nulo é das operações mais baratas do Postgres (não reescreve a
tabela). Reverter = `DROP COLUMN` por nova migration — mas só antes de a tela começar a usar.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção)
**Como verificar:** depois de o dono aplicar (etapa 056), a consulta ao `information_schema` acima deve
listar `deleted_at`. Registre a saída antes e depois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 056 — Aplicar a migration de `deleted_at` e sincronizar os tipos

**Onda / Severidade / Camada:** 1 / Alta / banco
**Achados resolvidos:** D-02
**Problema hoje:** a migration da etapa 055 é arquivo; enquanto não for aplicada, a coluna não existe e a
etapa 057 não compila (`src/integrations/supabase/types.ts` não conhece `deleted_at` em
`fretes_internos`, então `.update({ deleted_at })` é erro de tipo). Essa dependência é a razão de esta etapa
existir separada.
**Causa raiz:** não há staging; aplicar é ato manual, e o `types.ts` é gerado a partir do banco.
**Caminho recomendado:** com o dono, aplique pelo `.github/workflows/aplicar-migration.yml`
(`workflow_dispatch`, informa o caminho da migration e exige digitar `APLICAR`; roda em transação com
`ON_ERROR_STOP=1`). Em seguida rode o `.github/workflows/types-sync.yml` para regenerar
`src/integrations/supabase/types.ts` — é esse workflow que existe justamente porque o `types.ts` divergia do
schema real (ver o cabeçalho de `aplicar-migration.yml:1-6`). Confirme que o bloco `fretes_internos` do
`types.ts` passou a ter `deleted_at` nas três faces (`Row`, `Insert`, `Update`) e que o `npm run typecheck`
segue em 0 erro.
**Atalho tentador a evitar:** editar `src/integrations/supabase/types.ts` à mão para "adiantar" a etapa 057.
O arquivo é gerado: a próxima execução do `types-sync` sobrescreve, e se o banco não tiver a coluna você
ganha um código que compila e falha em produção. Aplique no banco e gere.
**Arquivos e objetos a tocar:** nenhum à mão; `src/integrations/supabase/types.ts` é atualizado pelo workflow
(pode vir em PR própria)
**Não tocar / armadilhas:** rode `npm ci` antes de qualquer `npx tsc --noEmit` local: num clone sem
`node_modules` o typecheck devolve ~19.705 erros `TS2307` falsos. Se o `types-sync` abrir PR com mais
mudanças que a coluna nova, **pare e leia** — é sinal de que o banco divergiu do repositório em outros
pontos, e isso é achado novo para `05-PROGRESSO.md`.
**Depende de:** 055 · **Libera:** 057
**Risco e como reverter:** se a aplicação falhar, nada muda (transação). Se o `types-sync` trouxer
divergência grande, não mergeie: registre.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção, executada pelo dono)
**Como verificar:**

```bash
grep -n 'fretes_internos' -A20 src/integrations/supabase/types.ts | grep -n 'deleted_at'
npm run typecheck
```

Esperado: `deleted_at` presente no bloco `fretes_internos` e 0 erro de tipo. Mais a saída do workflow de
aplicação, com horário, no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 057 — `FretesInternos`: exclusão lógica e filtro em todas as leituras da tabela

**Onda / Severidade / Camada:** 1 / Alta / interface
**Achados resolvidos:** D-02
**Problema hoje:** `src/pages/FretesInternos.tsx:254-258` apaga o frete de verdade
(`.from("fretes_internos").delete().eq("id", id)`), e **nenhuma** das leituras da tabela filtra exclusão
lógica — porque até a etapa 055 não havia o que filtrar. Os pontos são `:167` (lista da tela), `:231`,
`:277`, `:290`, mais três fora da tela: `src/hooks/analytics/useDrillDown.tsx:98`,
`src/pages/ExportacaoDados.tsx:179` e `src/pages/Relatorios.tsx:130`.
**Causa raiz:** a mesma de D-02; aqui faltava a coluna, resolvida nas etapas 055-056.
**Caminho recomendado:** com a coluna no banco e nos tipos, faça as duas metades **na mesma PR** — e aqui,
diferente da etapa 053, é obrigatório, porque a tabela não tem nenhum filtro hoje e meia correção fica
visivelmente quebrada. (1) Troque o `.delete()` de `:254-258` por
`.update({ deleted_at: new Date().toISOString() })`, no padrão de `src/pages/Clientes.tsx:337` e
`src/pages/Fornecedores.tsx:286`. (2) Acrescente `.is("deleted_at", null)` nas quatro leituras da tela e nos
três pontos externos, com o mesmo critério da etapa 054: leitura operacional filtra; leitura histórica
(`Relatorios`, `ExportacaoDados` de período fechado) pode manter, com comentário de uma linha dizendo por quê.
**Atalho tentador a evitar:** começar pela tela e deixar `useDrillDown`, `ExportacaoDados` e `Relatorios`
"para depois". São exatamente os pontos onde o frete apagado reaparece como número — e número errado em
relatório é o tipo de defeito que ninguém atribui a uma exclusão de três semanas atrás.
**Arquivos e objetos a tocar:** `src/pages/FretesInternos.tsx` (`:167`, `:231`, `:254-258`, `:277`, `:290`),
`src/hooks/analytics/useDrillDown.tsx:98`, `src/pages/ExportacaoDados.tsx:179`,
`src/pages/Relatorios.tsx:130`
**Não tocar / armadilhas:** não toque no `bulkUpdateStatus(ids, "cancelado")` (`:532-537`) — cancelar não é
excluir, e a confirmação dele é a etapa 050. Não altere o `insert` de `:201`. Se alguma das três leituras
externas agregar (soma, contagem), confira o número antes e depois do filtro: a diferença é exatamente o
passivo de fretes já apagados — que não existe mais, porque o `.delete()` antigo os removeu de verdade.
**Depende de:** 056 · **Libera:** 058
**Risco e como reverter:** se o filtro entrar numa agregação histórica que não devia, relatórios mudam de
valor. Compare um relatório antes e depois. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n '.delete()\|deleted_at' src/pages/FretesInternos.tsx
grep -rn 'from("fretes_internos")' -A3 src/hooks/analytics/useDrillDown.tsx src/pages/ExportacaoDados.tsx src/pages/Relatorios.tsx
```

Esperado: nenhum `.delete()`; `deleted_at` no update e nos filtros operacionais. Na aplicação publicada,
exclua um frete de teste, confirme que sai da lista, que a linha continua no banco com `deleted_at` e que ele
**não** aparece no drill-down. Registre as três evidências.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 058 — Transformar a política de exclusão lógica em gate automático

**Onda / Severidade / Camada:** 1 / Média / CI
**Achados resolvidos:** D-02
**Problema hoje:** a causa raiz de D-02, com todas as palavras do achado: "a política existe como documento e
não como mecanismo: nada no código impede um `.delete()`". Depois das etapas 053-057 as duas telas estão
corretas — e a terceira tela que alguém escrever amanhã nasce errada do mesmo jeito, porque
`docs/SOFT_DELETE_POLICY.md` continua sendo apenas um texto que ninguém é obrigado a ler.
**Causa raiz:** controle por convenção em vez de gate.
**Caminho recomendado:** acrescente um gate no padrão dos que já existem em `scripts/ci/` (veja
`scripts/ci/check-claude-md-integrity.mjs`, chamado por required check, e os validadores
`npm run validate:csp` / `npm run validate:no-console` em `package.json`): falhar quando `src/` tiver
`.delete()` numa chamada `supabase.from("<tabela>")` cuja tabela esteja na lista das que têm `deleted_at` —
hoje `clientes`, `coletas`, `entregas`, `fornecedores`, `transportadoras` e, após a etapa 056,
`fretes_internos`. Derive a lista do `src/integrations/supabase/types.ts` em vez de fixá-la no script: assim
a próxima tabela que ganhar `deleted_at` entra sozinha. Registre o script em
`scripts/automation.config.json` como os outros (`:119-142`), ponha no mesmo workflow dos demais
validadores, e rode `npm run automation:test` antes da PR.
**Atalho tentador a evitar:** uma regra de ESLint com `no-restricted-syntax` em cima de `.delete()`. Ela não
sabe de qual tabela é a chamada, então ou reprova exclusões legítimas (tabelas sem `deleted_at` existem e
muitas), ou exige `eslint-disable` espalhado — e cada `disable` é um convite a ignorar. Além disso, aviso novo
de lint com o orçamento em 105/105 reprova a CI por outro motivo. Gate próprio, mensagem clara.
**Arquivos e objetos a tocar:** novo script em `scripts/ci/`, `scripts/automation.config.json`,
`package.json` (o script npm), o workflow que roda os validadores
**Não tocar / armadilhas:** não inclua `supabase/functions/` no escopo: edge functions usam `service_role` e
há casos legítimos de `.delete()` (limpeza, idempotência). Não toque no `.husky/pre-commit` (roda
`lint-staged`). Mexer em `scripts/` aciona o required check "Contratos da automação local"; mexer em workflow
é o que torna esta etapa de aprovação do dono.
**Depende de:** 053, 057 · **Libera:** —
**Risco e como reverter:** o gate pode reprovar PRs de outros agentes com `.delete()` nessas tabelas — que é
o objetivo. Se der falso positivo (uma chamada em string montada, por exemplo), ajuste o padrão em vez de
afrouxar o gate. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (acrescenta gate à CI e toca workflow)
**Como verificar:**

```bash
npm run automation:test 2>&1 | tail -20
node <caminho-do-novo-gate>; echo "exit=$?"
```

Esperado: `exit=0` com a árvore como está depois das etapas 053-057. Então reintroduza temporariamente um
`.delete()` em `src/pages/Transportadoras.tsx`, rode o gate, confirme `exit` diferente de zero, e
**desfaça** (`git checkout -- src/pages/Transportadoras.tsx`). Cole as duas saídas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 059 — Pedir confirmação ao cancelar uma logística reversa

**Onda / Severidade / Camada:** 1 / Média / interface
**Achados resolvidos:** D-03
**Problema hoje:** `src/pages/LogisticaReversa.tsx:462-472` — a mudança para `cancelado` é um
`DropdownMenuItem` igual aos outros itens do menu (`Recebido`, `:447-461`), só com a classe
`text-red-500`: `onClick={() => updateStatus.mutate({ id: item.id, status: "cancelado" })}`. A devolução de
um cliente é cancelada por engano com um clique, sem aviso.
**Causa raiz:** as transições de status foram tratadas como itens equivalentes de menu; a destrutiva não
recebeu tratamento diferente.
**Caminho recomendado:** copie o desenho de `src/pages/Despachos.tsx:546-553`, que é o padrão da casa para
ação irreversível em linha de tabela: um `useState` guarda o item pendente (lá é `confirmItem`), o item de
menu só **seleciona** (`setConfirmItem(item)`), e um `ConfirmDialog` renderizado no fim da tela chama a
mutation no `onConfirm`. Use `type="danger"` e um texto que nomeie a devolução — se a linha tiver número,
código de rastreio ou cliente, ponha na descrição, como `Despachos.tsx:550` faz com `numero_entrega`. O
`DropdownMenuSeparator` que já existe em `:461` mantém a separação visual.
**Atalho tentador a evitar:** usar `window.confirm`. É duas linhas e funciona, mas quebra a aparência da
aplicação, não é estilizável, não dá para exigir digitação e já existe `ConfirmDialog` usado em dezenas de
pontos. Coerência aqui é barata.
**Arquivos e objetos a tocar:** `src/pages/LogisticaReversa.tsx` (`:462-472`, mais o estado e o
`ConfirmDialog` no fim do componente)
**Não tocar / armadilhas:** o `ConfirmDialog` **não pode** ficar dentro do `DropdownMenuContent`
(`:425-474`): o menu desmonta o conteúdo ao fechar e o diálogo nunca aparece — renderize fora, no nível do
retorno do componente, como em `Despachos.tsx`. Não acrescente confirmação aos outros itens do menu
(`:447-461` e anteriores): eles são transições normais, e atrito indiscriminado faz o operador parar de ler.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** cancelar passa a exigir um clique a mais. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'ConfirmDialog\|cancelado' src/pages/LogisticaReversa.tsx
npx eslint src/pages/LogisticaReversa.tsx && npm run typecheck
```

Esperado: `ConfirmDialog` importado e renderizado fora do dropdown; o item de menu não chama mais
`updateStatus.mutate` direto. Na aplicação publicada, clique em "Cancelar" numa devolução de teste, confirme
que o diálogo aparece, cancele o diálogo e verifique pelo MCP que o status **não** mudou. Registre as duas
evidências.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 060 — Tirar os dois SQL históricos do lugar onde parecem tarefa pendente

**Onda / Severidade / Camada:** 8 / Média / scripts
**Achados resolvidos:** D-04
**Problema hoje:** `scripts/origem_remediacao_2026-08-31.sql` e `scripts/cleanup_triggers_source.sql` alteram
banco, não têm runner (nenhum workflow e nenhum script do `package.json` os invoca) e estão soltos na **raiz
de `scripts/`**, entre utilitários que são para rodar. O `AGENTS.md` manda que automação viva em
`scripts/<nome>/` com README — esses dois violam a convenção justamente por não serem automação.
**Correção de rota que esta etapa precisa carregar:** o achado diz que "nada no repositório diz se já foram
aplicados"; isso **mudou**. Os dois arquivos ganharam cabeçalho em 2026-11-09 dizendo
"HISTÓRICO — NÃO REEXECUTAR", com data de aplicação na origem e nota de que a origem é somente leitura desde o
cutover (`scripts/origem_remediacao_2026-08-31.sql:1-6`,
`scripts/cleanup_triggers_source.sql:7-12`). O que resta do defeito é a **localização**: um agente que liste
`scripts/` vê dois `.sql` chamados "remediação" e "cleanup" ao lado de ferramentas executáveis, e só descobre
que são histórico se abrir o arquivo.
**Causa raiz:** SQL pontual de agosto/2026 deixado na raiz de `scripts/`, sem pasta que declare sua natureza
— o aviso está dentro do arquivo, e a listagem da pasta diz o contrário.
**Caminho recomendado:** mova os dois para uma pasta cujo nome diga o que são — `scripts/historico/` — com um
`README.md` curto na pasta (a convenção do `AGENTS.md`: automação em `scripts/<nome>/` com README) dizendo
numa frase que ali só entra SQL já aplicado, mantido como registro, e que nada ali se executa. Atualize os
**três** pontos que citam os caminhos: `scripts/audit/sql.unit.mjs:26-27` (as constantes `cleanup` e
`remediacao`, que resolvem `../cleanup_triggers_source.sql` e `../origem_remediacao_2026-08-31.sql`),
`scripts/audit/README.md:58` e `docs/agentes/banco.md:35`. Use `git mv` para o histórico do arquivo seguir.
**Atalho tentador a evitar:** apagar os dois arquivos, "já que são histórico e ninguém executa". Eles são
cobertos por testes que rodam SQL de verdade (`scripts/audit/sql.unit.mjs:377` e `:397` verificam o conteúdo
deles num Postgres descartável) e são a única memória de qual DDL foi aplicado na origem do cutover. Apagar
quebra a suíte e perde o registro.
**Arquivos e objetos a tocar:** `git mv` dos dois `.sql` para `scripts/historico/`, novo
`scripts/historico/README.md`, `scripts/audit/sql.unit.mjs:26-27`, `scripts/audit/README.md:58`,
`docs/agentes/banco.md:35`
**Não tocar / armadilhas:** **não altere o conteúdo SQL** dos dois arquivos — a revisão de 2026-11-09 já os
deixou replay-safe (`BEGIN/COMMIT` e `CREATE OR REPLACE TRIGGER`) e qualquer edição invalida os testes que
verificam o conteúdo. Mexer em `docs/agentes/` exige
`node scripts/ci/check-claude-md-integrity.mjs`; mexer em `scripts/` aciona o required check "Contratos da
automação local".
**Depende de:** — · **Libera:** 061
**Risco e como reverter:** se um dos três pontos de referência ficar com o caminho antigo, a suíte de SQL
falha — é por isso que a verificação roda os testes, não só o grep. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (toca scripts cobertos por required check)
**Como verificar:**

```bash
node --test scripts/audit/sql.unit.mjs 2>&1 | tail -20
npm run automation:test 2>&1 | tail -10
node scripts/ci/check-claude-md-integrity.mjs
grep -rn 'origem_remediacao\|cleanup_triggers_source' scripts/ docs/ --include='*.mjs' --include='*.md'
```

Esperado: a suíte de SQL passa (**executada**, não pulada — ela se pula sem Postgres disponível e diz por
quê), o check de integridade passa, e nenhuma referência aponta para a raiz de `scripts/`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 061 — Registrar, em um lugar só, qual SQL avulso já foi aplicado e onde

**Onda / Severidade / Camada:** 8 / Média / documentação
**Achados resolvidos:** D-04
**Problema hoje:** depois da etapa 060 os dois arquivos estão no lugar certo, mas a informação de **o que foi
aplicado, quando e em qual projeto** continua dispersa: no cabeçalho de cada arquivo, numa linha de
`docs/agentes/banco.md:35` e numa de `scripts/audit/README.md:58`. Não há um lugar onde o agente olhe e saiba
se existe DDL avulso pendente. O impacto é o do achado: um agente encontra um arquivo chamado "remediação",
conclui que é pendente e roda em produção pela segunda vez.
**Causa raiz:** o repositório tem ledger para migrations (`supabase_migrations.schema_migrations`) e nenhum
para o SQL que foi aplicado fora delas.
**Caminho recomendado:** acrescente a `docs/agentes/banco.md` — o documento que o `AGENTS.md` manda ler
**antes** de qualquer SQL, migration ou deploy — uma tabela curta de "SQL avulso já aplicado", com uma linha
por arquivo: caminho, data de aplicação, **projeto** (`hgicfqjayrjurivtygqf` = origem, somente leitura desde
o cutover) e "não reexecutar". Os dados estão nos cabeçalhos dos próprios arquivos
(`scripts/historico/origem_remediacao_2026-08-31.sql:1-6` e
`scripts/historico/cleanup_triggers_source.sql:7-12` após a etapa 060); não invente nada que não esteja lá.
Acrescente também a frase que fecha a dúvida para o futuro: DDL novo vai para `supabase/migrations/` e é
aplicado pelo `.github/workflows/aplicar-migration.yml` — nunca como script avulso.
**Atalho tentador a evitar:** criar um documento novo (`docs/ops/SQL_APLICADO.md` ou parecido). O repositório
já sofre de documentação que contradiz documentação — são onze achados no grupo H, incluindo
`ESTADO_ATUAL.md` descrevendo o banco errado e `DOCUMENTATION.md` com 29 caminhos inexistentes. A informação
tem de entrar onde o protocolo **já obriga** a olhar, que é `docs/agentes/banco.md`.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md` (acréscimo de uma tabela curta e uma frase)
**Não tocar / armadilhas:** não mexa em `AGENTS.md` nesta etapa (ele já aponta para
`docs/agentes/banco.md`); não toque nas linhas de `banco.md` sobre os projetos que não são o destino
(`:32-41`) — elas estão corretas e são a proteção contra escrever no banco errado. Qualquer alteração em
`docs/agentes/` exige `node scripts/ci/check-claude-md-integrity.mjs` antes da PR — é o required check
"Agents Docs Integrity".
**Depende de:** 060 · **Libera:** —
**Risco e como reverter:** nenhum risco técnico. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs
grep -n 'historico/\|não reexecutar\|nao reexecutar' -i docs/agentes/banco.md
```

Esperado: o check de integridade passa e `banco.md` lista os dois arquivos com data, projeto e a marca de
não reexecutar. Teste de leitura: abra `docs/agentes/banco.md` como se fosse a primeira vez e confirme que,
só com ele, você saberia que não há SQL avulso pendente. Registre a conclusão no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

## Onda 2 e seguintes — interface, hooks e robustez (062-131)

### Etapa 062 — Abrir o diálogo de edição de coleta a partir do cartão

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** A-07
**Problema hoje:** `src/components/coletas/PickupDialog.tsx:158` já faz `.update(payload as ColetaUpdate)` quando recebe `pickup?.id`, e `:92-100` já preenche o formulário com o registro. Mas a tela nunca passa registro: `src/pages/Coletas.tsx:341-343` abre o diálogo com `setSelectedPickup(null)`, e o clique no cartão (`:718-721`) leva ao diálogo de **detalhes**, não ao de edição. O caminho de edição existe e não tem porta de entrada.
**Causa raiz:** a tela ficou só com o caminho de criação; o de edição foi construído e nunca ligado.
**Caminho recomendado:** comece lendo `src/pages/Coletas.tsx:103-140` para ver que `selectedPickup` e `isDialogOpen` já existem — não crie estado novo. Acrescente no cartão (`:718-721`) um botão/ícone "Editar" que faça `setSelectedPickup(c); setIsDialogOpen(true);` e **pare a propagação do clique** (`e.stopPropagation()`), porque o `onClick` do `Card` abre os detalhes. Confirme que o `<PickupDialog>` renderizado na tela recebe `pickup={selectedPickup}` — se hoje não recebe, essa é a linha que falta. Use o mesmo desenho de botão de ação sobre item que `src/pages/Clientes.tsx` usa nos seus cartões, para não inventar estilo novo. **Atalho tentador a evitar:** trocar o `onClick` do cartão de "detalhes" para "edição". Isso resolve a edição e tira dos operadores a tela de detalhes, que é o uso mais comum; as duas portas têm de existir (a de detalhes é a etapa 063).
**Arquivos e objetos a tocar:** `src/pages/Coletas.tsx` (cartão em `:718-721` e a renderização do `PickupDialog`)
**Não tocar / armadilhas:** não altere `PickupDialog.tsx` nesta etapa — ele já trata os dois modos. Não mexa no `PickupDetailsDialog` (`Coletas.tsx:872`). Com o modo edição ligado, os interruptores "reversa" e "urgente" vão aparecer errados — isso é a etapa 064, não corrija aqui.
**Depende de:** — · **Libera:** 063, 064
**Risco e como reverter:** baixo; só acrescenta um caminho. `git revert` da PR.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "PickupDialog" src/pages/Coletas.tsx
grep -n "setSelectedPickup" src/pages/Coletas.tsx
```

Esperado: existe um ponto que chama `setSelectedPickup(c)` **antes** de `setIsDialogOpen(true)`, e o `<PickupDialog>` recebe `pickup={selectedPickup}`. Na aplicação: abrir uma coleta pelo novo botão deve mostrar o formulário **preenchido** e o título "Injeção Atualizada" no sucesso (`PickupDialog.tsx:178`).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 063 — Ação "Editar" dentro do diálogo de detalhes da coleta

**Onda / Severidade / Camada:** 2 / Média / interface
**Achados resolvidos:** A-07
**Problema hoje:** o clique no cartão abre `PickupDetailsDialog` (`src/pages/Coletas.tsx:872`). Quem já está olhando os detalhes de uma coleta errada não tem como corrigi-la dali: precisa fechar, achar o botão do cartão e abrir outro diálogo.
**Causa raiz:** a tela de detalhes foi construída como somente-leitura.
**Caminho recomendado:** no `PickupDetailsDialog`, acrescente um botão "Editar" que chame um `onEdit?: (c: Coleta) => void` recebido por prop; em `Coletas.tsx:872`, passe `onEdit={(c) => { setIsDetailsOpen(false); setSelectedPickup(c); setIsDialogOpen(true); }}`. Fechar os detalhes antes de abrir a edição evita dois `Dialog` empilhados (o `Dialog` do shadcn trava o foco e dois abertos ao mesmo tempo prendem o teclado). **Atalho tentador a evitar:** transformar o diálogo de detalhes em formulário editável. Isso duplica o formulário do `PickupDialog` e cria dois lugares para manter.
**Arquivos e objetos a tocar:** `src/components/coletas/PickupDetailsDialog.tsx` (prop nova + botão), `src/pages/Coletas.tsx:872`
**Não tocar / armadilhas:** a prop tem de ser opcional para não quebrar outro uso do componente — confira com `grep -rn "PickupDetailsDialog" src/` antes.
**Depende de:** 062 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "PickupDetailsDialog" src/
grep -n "onEdit" src/components/coletas/PickupDetailsDialog.tsx src/pages/Coletas.tsx
```

Esperado: um único chamador, com `onEdit` ligado. Na aplicação: abrir detalhes → "Editar" fecha os detalhes e abre o formulário preenchido.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 064 — Resincronizar "reversa" e "urgente" quando o diálogo recebe uma coleta

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** A-07
**Problema hoje:** `src/components/coletas/PickupDialog.tsx:72-73` inicializa `isReverse` e `isUrgent` com `useState(pickup?.is_reverse || false)` — valor lido **só na montagem**. O `useEffect` de `:92-100` chama `reset(...)` para os campos do formulário e **não** atualiza esses dois estados. Como o diálogo fica montado, editar uma coleta reversa/urgente mostra os dois marcadores desligados e o submit grava `is_reverse: false` (`:147-148`), rebaixando o registro.
**Causa raiz:** dois campos vivem em `useState` fora do `react-hook-form`, e só o formulário é resincronizado.
**Caminho recomendado:** dentro do `useEffect` que já existe em `:92`, no ramo `if (pickup)`, acrescente `setIsReverse(pickup.is_reverse ?? false)` e `setIsUrgent(pickup.is_urgent ?? false)`; no ramo `else` (criação), volte os dois para `false`. É o mesmo lugar onde o `reset` já acontece — nenhum efeito novo. **Atalho tentador a evitar:** mover os dois campos para dentro do `react-hook-form`. É mais "certo" e mexe nos botões de `:220-238` e no `payload` de `:147-148`; é refatoração, não a correção, e esta etapa precisa ser pequena para ser revertida sozinha.
**Arquivos e objetos a tocar:** `src/components/coletas/PickupDialog.tsx` (apenas o `useEffect` de `:92-100`)
**Não tocar / armadilhas:** não toque no `reset()` nem no gerador de `numero_coleta` do ramo de criação (`:103-105`) — ele usa `window.crypto` de propósito. Não mexa no `payload` de `:135-151`.
**Depende de:** 062 · **Libera:** —
**Risco e como reverter:** baixo e localizado. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '90,110p' src/components/coletas/PickupDialog.tsx
```

Esperado: o ramo `if (pickup)` ajusta os dois estados. Na aplicação: editar uma coleta com `is_reverse = true` deve abrir com "reversa" marcado, e salvar sem alterar nada deve manter `is_reverse = true` no banco (consulte a linha depois de salvar).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 065 — Criar a mutation de exclusão lógica de coleta

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** A-07, D-02 (parcial)
**Problema hoje:** não existe nenhuma mutation de exclusão em `src/pages/Coletas.tsx`. Coleta digitada errada só sai do sistema com alguém mexendo no banco.
**Causa raiz:** tela entregue sem o caminho de exclusão.
**Caminho recomendado:** copie o padrão já existente e correto de `src/pages/Clientes.tsx:333-348`: `useMutation` cujo `mutationFn` faz `.update({ deleted_at: new Date().toISOString() }).eq("id", id)` sobre `coletas`, com `if (error) throw error;`, e `onSuccess` invalidando `["coletas-list"]` (a chave real da consulta, `Coletas.tsx:119`) mais `toast.success(...)`, e `onError: (e) => toast.error("Erro ao remover: " + e.message)`. Nesta etapa **só a mutation** — a porta na interface é a etapa 066, para que a PR possa ser verificada por tipo e lint sem mudança visual. **Atalho tentador a evitar:** `.delete()`. A política do repositório é exclusão lógica por `deleted_at` (`docs/SOFT_DELETE_POLICY.md`), e dois cadastros já a violam (D-02) — não acrescente um terceiro.
**Arquivos e objetos a tocar:** `src/pages/Coletas.tsx` (acréscimo de uma `useMutation`)
**Não tocar / armadilhas:** confirme que a tabela `coletas` **tem** a coluna `deleted_at` em `src/integrations/supabase/types.ts` antes de escrever (a consulta da lista já filtra por ela em `:126`, o que é forte indício, mas confirme). Se não tiver, pare: passa a ser migration e decisão do dono. Não toque na consulta da lista aqui.
**Depende de:** — · **Libera:** 066
**Risco e como reverter:** nenhum enquanto ninguém chama a mutation. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "deleted_at" src/pages/Coletas.tsx
grep -n "deleted_at" -B3 -A8 src/integrations/supabase/types.ts | grep -n "coletas" | head
npx tsc --noEmit 2>&1 | tail -5
```

Esperado: a mutation existe, usa `update` com `deleted_at` e invalida `["coletas-list"]`; typecheck em 0 erros.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 066 — Ligar a exclusão de coleta na interface, com confirmação

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** A-07, D-01 (padrão)
**Problema hoje:** depois da etapa 065 a exclusão existe e não tem botão. E o repositório já erra nos dois sentidos em outras telas: exclusão em massa sem perguntar e exclusão de um registro perguntando (D-01).
**Causa raiz:** falta a porta de entrada.
**Caminho recomendado:** acrescente a ação "Excluir" no mesmo lugar onde a etapa 062 pôs "Editar" (cartão, com `stopPropagation`), guardando o registro em um estado `pickupToDelete`. Para a confirmação, use o `ConfirmDialog` já usado nesta base em `src/pages/Despachos.tsx:546` — mesmas props (`open`, `onOpenChange`, `title`, `description`, `onConfirm`, `isLoading`), com `isLoading={deleteMut.isPending}`, que também resolve o duplo clique. O componente vem de `src/components/common/ConfirmDialog` (exportado no barril `src/components/common/index.ts`). O texto da descrição deve dizer o número da coleta e que ela vai para a lixeira (é lógica, não definitiva). **Atalho tentador a evitar:** `window.confirm`. Existe componente próprio, com estado de carregando; `window.confirm` trava a aba e não mostra o que está sendo excluído.
**Arquivos e objetos a tocar:** `src/pages/Coletas.tsx` (ação no cartão, estado do registro a excluir, `<ConfirmDialog>`)
**Não tocar / armadilhas:** não acrescente exclusão em massa nesta etapa (é outro achado, D-01). Garanta que o botão fique fora do `onClick` do cartão, senão excluir abre os detalhes ao mesmo tempo.
**Depende de:** 065 · **Libera:** 067
**Risco e como reverter:** a tela passa a poder excluir — é o objetivo; a exclusão é lógica e reversível no banco (`deleted_at = null`). `git revert` da PR.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "ConfirmDialog" src/pages/Coletas.tsx
```

Esperado: um `<ConfirmDialog>` ligado à mutation da 065. Na aplicação: excluir uma coleta de teste faz a linha sair da lista e, no banco, `deleted_at` fica preenchido (`select id, deleted_at from coletas where id = '<id>'`). Registre o id usado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 067 — Conferir que toda consulta de Coletas ignora registro excluído

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** A-07, D-02 (parcial)
**Problema hoje:** a consulta da lista já filtra (`src/pages/Coletas.tsx:126` — `.is("deleted_at", null)`), mas a tela tem outros consumidores de `coletas` (cartões de indicador, exportação CSV em `:330-332`, conferência em `src/components/coletas/PickupConference.tsx`). Se algum deles não filtrar, a coleta "excluída" na etapa 066 reaparece em um canto da tela — pior que não ter exclusão.
**Causa raiz:** filtro de exclusão lógica aplicado consulta por consulta, sem garantia central.
**Caminho recomendado:** liste todas as consultas a `coletas` do fluxo da tela e acrescente `.is("deleted_at", null)` nas que faltarem, copiando a forma exata da linha `:126`. A exportação CSV usa o array `coletas` já filtrado — confirme isso em vez de mexer nela. Se encontrar consulta a `coletas` em hook compartilhado, **não** altere o hook aqui: anote em `05-PROGRESSO.md` e deixe para a etapa do achado D-02, porque mudar hook compartilhado afeta telas fora deste escopo. **Atalho tentador a evitar:** resolver isso com uma `view` no banco. É DDL, é decisão do dono e não cabe nesta etapa.
**Arquivos e objetos a tocar:** `src/pages/Coletas.tsx`, `src/components/coletas/PickupConference.tsx` (só se a conferência consultar `coletas` sem o filtro)
**Não tocar / armadilhas:** não remova o `.limit(500)` de `:128` — é o teto que segura a consulta (ver P-01). Não mexa em RLS.
**Depende de:** 066 · **Libera:** —
**Risco e como reverter:** baixo; só restringe o que já deveria estar restrito. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'from("coletas")' src/pages/Coletas.tsx src/components/coletas/ | wc -l
grep -rn -A6 'from("coletas")' src/pages/Coletas.tsx src/components/coletas/ | grep -c 'deleted_at'
```

Esperado: os dois números iguais (toda consulta a `coletas` neste escopo tem o filtro). Na aplicação: a coleta excluída na etapa 066 não aparece na lista, nos contadores nem no CSV exportado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 068 — Remover o hook `useSelfHealing`

**Onda / Severidade / Camada:** 4 / Média / hook
**Achados resolvidos:** A-08, A-12 (parcial)
**Problema hoje:** `src/hooks/security/useSelfHealing.ts` espera 2 s fingindo trabalho (`:17`), chama uma RPC cujo `EXECUTE` foi revogado de `authenticated` em três migrations, e mostra `toast.success('Protocolo Self-Healing Concluído' / 'Estrutura de dados Nexus 10/10 restaurada com sucesso')` (`:21-25`) **independentemente do resultado**. Nenhum arquivo o importa.
**Causa raiz:** demonstração visual deixada na árvore.
**Caminho recomendado:** antes de apagar, prove que está morto pelo caminho direto, não pelo barril: `grep -rn "useSelfHealing" src/ supabase/ tests/`. Se a única ocorrência for a própria definição (e um eventual `export *` em `src/hooks/index.ts`), apague o arquivo e, se existir, a linha de reexport. Uma PR só para isso, com o corpo citando as três migrations que revogam o `EXECUTE` — é essa evidência que impede o próximo agente de "consertar" o hook em vez de removê-lo. **Atalho tentador a evitar:** manter o arquivo e só trocar o `toast.success` por tratamento de erro. Seria dar manutenção a uma funcionalidade que ninguém chama e que depende de uma tabela (`freights`) que nenhuma migration cria.
**Arquivos e objetos a tocar:** `src/hooks/security/useSelfHealing.ts` (remoção), `src/hooks/index.ts` (só se houver reexport)
**Não tocar / armadilhas:** não apague a RPC `reconcile_pending_freights` nem nada em `supabase/migrations/` — isso é a etapa 070 e precisa do dono. Não toque em `src/hooks/security/` além deste arquivo.
**Depende de:** — · **Libera:** 070
**Risco e como reverter:** se algum import escapar, o build quebra na hora — o typecheck pega. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "useSelfHealing" src/ supabase/ tests/ ; echo "saida vazia = morto"
npm run typecheck 2>&1 | tail -5
npm run build 2>&1 | tail -5
```

Esperado: grep vazio depois da remoção, typecheck em 0 erros e build concluído.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 069 — Remover o hook `useNexusSimulator`

**Onda / Severidade / Camada:** 4 / Média / hook
**Achados resolvidos:** A-08, A-12 (parcial)
**Problema hoje:** `src/hooks/ai/useNexusSimulator.ts:17-20` repete o padrão da etapa 068 — espera simulada dentro de `Promise` e sucesso anunciado sem olhar o resultado — e também não é importado por ninguém.
**Causa raiz:** a mesma da 068.
**Caminho recomendado:** mesmo procedimento da etapa 068, em PR separada: provar com `grep -rn "useNexusSimulator" src/ supabase/ tests/`, apagar o arquivo e o eventual reexport. Separar as duas PRs importa porque, se uma delas revelar um import escondido, você reverte só aquela. **Atalho tentador a evitar:** juntar 068 e 069 numa PR "limpeza de hooks mortos". A varredura do achado A-08 mostra que **só** esses dois são simulação; uma PR de "limpeza" convida a levar outros arquivos no caminho.
**Arquivos e objetos a tocar:** `src/hooks/ai/useNexusSimulator.ts` (remoção), `src/hooks/index.ts` (só se houver reexport)
**Não tocar / armadilhas:** os outros quatro `setTimeout` dentro de `Promise` do repositório são legítimos — `useDeliveryRoutes.tsx:256` e `useGeocoding.tsx:75` (limite de taxa), `CircuitBreaker.ts:39` (espera de retentativa), `BiometricConsentModal.tsx:66` (animação). Não encoste neles.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** igual à 068. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "useNexusSimulator" src/ supabase/ tests/ ; echo "saida vazia = morto"
npm run typecheck 2>&1 | tail -5
```

Esperado: grep vazio e typecheck em 0 erros.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 070 — Decidir o destino da RPC `reconcile_pending_freights` e da tabela que ela não tem

**Onda / Severidade / Camada:** 4 / Média / banco
**Achados resolvidos:** A-08
**Problema hoje:** a função existe no banco e faz `UPDATE public.freights` (`supabase/migrations/20260519163240_a44a9ac2-837f-405f-ab86-8e651c62bd5b.sql:12`), **nenhuma migration cria a tabela `freights`** (grep de `CREATE TABLE.*freights` devolve vazio; em `types.ts` só existe a coluna `total_freights`), e o próprio corpo admite `-- Simula uma lógica de reconciliação real`. O `EXECUTE` já foi revogado de `authenticated` em três migrations.
**Causa raiz:** função de demonstração publicada no banco e nunca removida.
**Caminho recomendado:** **comece pelo banco ao vivo, não pelas migrations** (as 244 são histórico): consulte se a função e a tabela existem hoje — `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname='public' and p.proname='reconcile_pending_freights';` e `select to_regclass('public.freights');`. Com o resultado em mãos, apresente ao dono as duas saídas: (a) remover a função por migration, se a tabela não existir e nada a chame; (b) mantê-la, se o dono souber de um uso administrativo. Escreva o arquivo em `supabase/migrations/` com o `DROP FUNCTION IF EXISTS`, abra a PR e **não mergeie**. **Atalho tentador a evitar:** rodar o `DROP` direto pelo MCP porque "é só uma função simulada". O MCP conecta com `service_role` e aceita DDL; DDL em produção é decisão do dono, e não há staging.
**Arquivos e objetos a tocar:** um arquivo novo em `supabase/migrations/` (apenas se a decisão for remover)
**Não tocar / armadilhas:** não tente criar a tabela `freights` para "fazer a função funcionar" — ninguém definiu esse modelo de dados. Não mexa nas três migrations que revogaram o `EXECUTE`: elas são o histórico que justifica a decisão.
**Depende de:** 068 · **Libera:** —
**Risco e como reverter:** remover função que alguém chame por fora quebraria esse uso — é por isso que a consulta ao banco vem antes e a decisão é do dono. Reverter = migration inversa recriando a função a partir do arquivo histórico.
**Precisa de aprovação humana antes do merge:** sim (DDL em produção)
**Como verificar:** a saída das duas consultas acima registrada em `05-PROGRESSO.md`, com data, e o link da PR aberta. Se a decisão for remover, após o merge pelo dono, a primeira consulta deve voltar vazia.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 071 — Levar ao dono a decisão sobre `push-send`

**Onda / Severidade / Camada:** 4 / Média / edge function
**Achados resolvidos:** A-09
**Problema hoje:** `docs/contexto/codigo/edge-functions.json` marca `orfa: true` para `push-send`: nenhuma chamada do front, de outra função, de SQL ou de cron. A função entrou no **último commit da `main`** (`d37ba30`, "feat: edge push-send para envio web-push real (5.6)") e tem só `index.ts`, sem teste. A notificação por push foi dada como pronta e nada no sistema a dispara.
**Causa raiz:** funcionalidade entregue pela metade — o lado servidor publicado, o lado que o chama não.
**Caminho recomendado:** levante a informação antes de perguntar, para a pergunta ser decidível em uma linha: (1) `grep -rn "push-send" src/ supabase/ .github/ scripts/` para confirmar que não há chamador; (2) leia `supabase/functions/push-send/index.ts` e anote o que ela espera no corpo e qual tabela de inscrições usa (há `public.push_subscriptions` no banco); (3) consulte quantas inscrições existem hoje nessa tabela. Com isso, apresente ao dono: ligar (etapa 072 implementa o chamador) ou remover. Registre a resposta em `05-PROGRESSO.md`. **Atalho tentador a evitar:** apagar a função por estar órfã. Ela é de ontem e provavelmente é trabalho em andamento de outra pessoa; apagar trabalho recente de terceiro é o pior erro possível aqui.
**Arquivos e objetos a tocar:** nenhum (levantamento e registro)
**Não tocar / armadilhas:** não altere `supabase/functions/push-send/index.ts` nesta etapa. Lembre que **merge em `main` tocando `supabase/functions/**` publica a função na hora** (`.github/workflows/deploy-functions.yml:9-13`).
**Depende de:** — · **Libera:** 072
**Risco e como reverter:** nenhum (somente leitura)
**Precisa de aprovação humana antes do merge:** sim (decisão de arquitetura e de escopo de entrega)
**Como verificar:**

```bash
grep -rn "push-send" src/ supabase/ .github/ scripts/ | grep -v "supabase/functions/push-send/"
```

Esperado: saída vazia (confirma a orfandade) e uma anotação em `05-PROGRESSO.md` com a decisão do dono: "ligar" ou "remover", com data.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 072 — Executar a decisão sobre `push-send`

**Onda / Severidade / Camada:** 4 / Média / edge function + hook
**Achados resolvidos:** A-09
**Problema hoje:** enquanto a decisão da etapa 071 não é executada, existe uma função publicada que ninguém chama — e a notificação por push continua sem acontecer.
**Causa raiz:** ver etapa 071.
**Caminho recomendado:** **se a decisão foi ligar**: o chamador deve ficar onde a notificação nasce, não numa tela. Siga o padrão de invocação já usado no repositório — `supabase.functions.invoke("<nome>", { body })` como em `src/hooks/notifications/useSecurityPushNotifications.tsx` (que já lida com permissão de notificação do navegador) — e ligue o envio ao mesmo ponto que já grava em `notifications`, para não criar um segundo conceito de "aviso". Confira que o registro de inscrição (`push_subscriptions`) é gravado em algum lugar: sem inscrição, a função não tem a quem enviar, e aí a etapa fica **aberta** com esse motivo. **Se a decisão foi remover**: apague a pasta inteira `supabase/functions/push-send/` em uma PR só disso e deixe para o dono mergear. **Atalho tentador a evitar:** chamar a função direto de um `useEffect` de tela. A notificação passa a depender de alguém estar com aquela tela aberta — exatamente o defeito que o achado descreve, invertido.
**Arquivos e objetos a tocar:** no caminho "ligar": o hook/serviço que dispara a notificação (um arquivo em `src/hooks/notifications/`); no caminho "remover": `supabase/functions/push-send/` (remoção)
**Não tocar / armadilhas:** não crie tabela nova para inscrições se `push_subscriptions` já existir. Não mexa em `verify_jwt` em `supabase/config.toml` sem decisão explícita — a função sem entrada em `config.toml` exige JWT por padrão, e é isso que você quer.
**Depende de:** 071 · **Libera:** —
**Risco e como reverter:** no caminho "ligar", começa a sair notificação de verdade para os inscritos — teste com a sua própria inscrição antes. `git revert` da PR; no caminho "remover", a função sai do ar no merge.
**Precisa de aprovação humana antes do merge:** sim, se a decisão foi remover (apaga uma função publicada); não, se foi apenas ligar o chamador no front
**Como verificar:**

```bash
grep -rn "push-send" src/ | head
```

Esperado, no caminho "ligar": existe exatamente um ponto de invocação, e um disparo real produz uma notificação recebida no seu navegador (registre o horário e o retorno da função nos logs do Supabase). No caminho "remover": a pasta não existe mais e `supabase functions list` (pelo MCP/painel) não traz `push-send`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 073 — `ingest-biosync`: decidir o destino de uma função que recebe dado de biometria e ninguém usa

**Onda / Severidade / Camada:** 4 / Média / edge function
**Achados resolvidos:** A-09
**Problema hoje:** `supabase/functions/ingest-biosync/` está publicada, marcada `orfa: true` em `docs/contexto/codigo/edge-functions.json`, e recebe telemetria de dispositivo (biometria de motorista — matéria de LGPD). Nenhum chamador no front, em outra função, em SQL ou em cron. Ela não aparece em `supabase/config.toml`.
**Causa raiz:** porta de entrada de dado pessoal aberta sem consumidor.
**Caminho recomendado:** levante e leve ao dono, nesta ordem: (1) `grep -rn "ingest-biosync" src/ supabase/ .github/ scripts/` para confirmar a orfandade; (2) leia `supabase/functions/ingest-biosync/index.ts` e anote em que tabela ela grava; (3) **consulte o banco ao vivo** para ver se há linhas nessa tabela — se houver, já entrou dado por essa porta e isso muda a conversa (vira registro de incidente de privacidade, não limpeza); (4) confirme que ela não está em `supabase/config.toml`, o que significa `verify_jwt` ligado por padrão (é a proteção que existe hoje — registre isso). Apresente: remover, ou manter com consumidor definido e base legal registrada em `docs/LGPD_COMPLIANCE.md`. **Atalho tentador a evitar:** deixar como está porque "exige JWT, então está seguro". O problema não é só autenticação: é dado de biometria sendo aceito sem finalidade declarada nem ninguém que o leia.
**Arquivos e objetos a tocar:** nenhum nesta etapa (levantamento e registro); a remoção, se decidida, vai em PR própria
**Não tocar / armadilhas:** `ingest-biosync` **tem** teste (`index_test.ts`) — se a decisão for remover, o teste vai com ela. Não apague linhas da tabela de telemetria: deleção de dado é decisão do dono. A deduplicação ausente nessa função é outro achado (B-08) e não se corrige aqui.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** nenhum nesta etapa (leitura). A remoção, se vier, tira a função do ar no merge.
**Precisa de aprovação humana antes do merge:** sim (dado pessoal, LGPD, remoção de função publicada)
**Como verificar:**

```bash
grep -rn "ingest-biosync" src/ supabase/ .github/ scripts/ | grep -v "supabase/functions/ingest-biosync/"
grep -n "ingest-biosync" supabase/config.toml ; echo "vazio = verify_jwt padrao (ligado)"
```

Esperado: nenhum chamador; e, em `05-PROGRESSO.md`, a contagem de linhas da tabela de telemetria no banco ao vivo, com data, mais a decisão do dono.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 074 — Levantar o uso real dos três buckets antes de qualquer decisão

**Onda / Severidade / Camada:** 4 / Média / storage
**Achados resolvidos:** A-10
**Problema hoje:** o achado A-10 diz, a partir de `docs/contexto/codigo/banco.json` (campo `buckets`, na branch `contexto`), que `comprovantes`, `entregas-fotos` e `ocorrencias-fotos` têm **0 usos**. **Isso está errado para `ocorrencias-fotos`:** o código usa esse bucket em `src/pages/Ocorrencias.tsx:196` (`useImageUpload("ocorrencias-fotos")`), `:780` e `:894` (`<ImageUploader bucket="ocorrencias-fotos">`), e ele é o padrão em `src/hooks/data/useImageUpload.tsx:62` e `src/components/common/ImageUploader.tsx:21`. Começar a limpeza por essa fonte apagaria um bucket em uso.
**Causa raiz:** a fonte gerada para agentes conta o uso de outra forma e divergiu da realidade (mesma família de problema de H-09).
**Caminho recomendado:** produza a tabela de verdade, com três colunas por bucket — referência no código, existência no banco e quantidade de objetos: (1) código, `grep -rn "comprovantes\|entregas-fotos\|ocorrencias-fotos" src/`; (2) banco ao vivo, `select id, name, public from storage.buckets order by name;`; (3) conteúdo, `select bucket_id, count(*) from storage.objects group by 1 order by 1;`. Registre o resultado em `05-PROGRESSO.md` e **corrija o achado A-10 em `docs/qa/03-ACHADOS.md`** no mesmo PR, porque a regra do repositório é consertar a documentação que divergiu junto com o fix. Só depois disso as etapas 075 e 076 fazem sentido. **Atalho tentador a evitar:** confiar no `orfa`/`0 usos` da fonte gerada. Ela é um índice, não a verdade; a verdade é o banco e o `grep`.
**Arquivos e objetos a tocar:** `docs/qa/03-ACHADOS.md` (correção do texto de A-10) e `05-PROGRESSO.md`
**Não tocar / armadilhas:** não apague bucket nenhum nesta etapa. Não edite a branch `contexto` — ela é gerada por automação (`.github/workflows/contexto.yml`).
**Depende de:** — · **Libera:** 075, 076
**Risco e como reverter:** nenhum (leitura + documentação)
**Precisa de aprovação humana antes do merge:** sim (a decisão que esta etapa instrui envolve storage e possível deleção de dado)
**Como verificar:**

```bash
grep -rn "ocorrencias-fotos\|entregas-fotos\|comprovantes" src/ | grep -v "^docs" | head -20
```

Esperado: o levantamento registrado mostra `ocorrencias-fotos` **em uso** (ao menos 5 pontos no código) e diz, para `comprovantes` e `entregas-fotos`, se existem no banco e quantos objetos têm.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 075 — `comprovantes`: um caminho só para o comprovante de entrega

**Onda / Severidade / Camada:** 4 / Média / storage
**Achados resolvidos:** A-10
**Problema hoje:** existe um bucket `comprovantes` sem uso, e o comprovante de entrega real vai para o bucket `documents`: `src/pages/Envios.tsx:1173` usa `folder={`entregas/${sel.id}/comprovantes`}` e `src/components/shipping/DeliveryReceiptUpload.tsx:55-57` sobe para `.from("documents")`. Ou seja: há um bucket dedicado vazio e uma pasta com o mesmo nome dentro de outro bucket. Quem vier depois escolhe errado.
**Causa raiz:** dois desenhos de armazenamento para a mesma prova, nenhum dos dois declarado como o oficial.
**Caminho recomendado:** apresente ao dono a recomendação já com a razão técnica: **ficar com `documents`** e remover o bucket `comprovantes`. O motivo é verificável: `documents` já é privado (comentado em `DeliveryReceiptUpload.tsx:73`, migration `20260314181509`), já tem o caminho de upload validado (`src/hooks/data/useDocumentUpload.ts:42-63`, com tamanho, MIME e assinatura de arquivo) e já guarda o comprovante de hoje; o bucket `comprovantes` teria de receber políticas e validação do zero. Se o dono aprovar, a remoção do bucket vai em migration (`supabase/migrations/`), com a contagem de objetos da etapa 074 citada na PR provando que está vazio. Em seguida (ou no mesmo PR), registre a escolha em uma linha no `README` de `docs/agentes/` que trate de upload, para a decisão não se perder. **Atalho tentador a evitar:** passar o comprovante para o bucket `comprovantes` "porque o nome combina". Isso significa migrar os arquivos existentes e recriar políticas de RLS de storage — muito mais risco do que o problema que resolve.
**Arquivos e objetos a tocar:** uma migration nova em `supabase/migrations/` (remoção do bucket), se aprovado; `docs/agentes/integracoes.md` ou o doc de upload correspondente (uma linha)
**Não tocar / armadilhas:** **só remova bucket com 0 objetos** — se a etapa 074 achou objetos, pare e registre: passa a ser deleção de dado. Não mexa em `DeliveryReceiptUpload.tsx` nem em `Envios.tsx:1173`: o caminho que já funciona não é o problema.
**Depende de:** 074 · **Libera:** —
**Risco e como reverter:** remover bucket é irreversível quanto ao conteúdo; com 0 objetos, o risco é só recriar o bucket por migration se alguém o quiser depois.
**Precisa de aprovação humana antes do merge:** sim (infraestrutura de storage e possível deleção de dado)
**Como verificar:**

```bash
grep -rn 'from("documents")' src/ | head
```

Esperado: o comprovante continua subindo para `documents`; após o merge pelo dono, `select id from storage.buckets where id = 'comprovantes';` volta vazio.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 076 — `entregas-fotos`: ligar a foto de entrega ou remover o bucket

**Onda / Severidade / Camada:** 4 / Média / storage + interface
**Achados resolvidos:** A-10
**Problema hoje:** não existe no código nenhuma referência a `entregas-fotos` (confirmado no levantamento da etapa 074) — nenhuma tela guarda foto de entrega, embora foto de entrega seja uma das provas que a operação precisa quando o cliente reclama.
**Causa raiz:** estrutura criada antes da tela que a usaria.
**Caminho recomendado:** esta é decisão de negócio e a pergunta ao dono tem de ser curta: "foto de entrega é prova que vocês precisam guardar?". Se **sim**, a implementação já tem molde pronto nesta base: `src/pages/Ocorrencias.tsx:780` monta `<ImageUploader bucket="ocorrencias-fotos" ...>` e `src/hooks/data/useImageUpload.tsx` já redimensiona a imagem, sobe e lida com bucket privado — copie exatamente esse par, trocando o bucket por `entregas-fotos`, na tela de detalhes da entrega (onde `Envios.tsx:1165-1175` já grava `comprovante_entrega_url`), e grave a URL numa coluna da entrega (confirme em `src/integrations/supabase/types.ts` se já existe coluna para isso; **se não existir, pare** — passa a ser migration e volta ao dono). Se **não**, remova o bucket por migration, citando a contagem 0 da etapa 074. **Atalho tentador a evitar:** guardar a foto no bucket `documents` para não precisar decidir. Foto de entrega e documento têm volume, retenção e regra de acesso diferentes; misturar agora é o que cria o próximo achado.
**Arquivos e objetos a tocar:** no caminho "sim": `src/pages/Envios.tsx` (campo novo no detalhe da entrega) e nada mais; no caminho "não": uma migration nova em `supabase/migrations/`
**Não tocar / armadilhas:** não altere o padrão de bucket em `src/hooks/data/useImageUpload.tsx:62` nem em `src/components/common/ImageUploader.tsx:21` — `ocorrencias-fotos` como padrão é o que faz a tela de Ocorrências funcionar hoje; passe o bucket por prop.
**Depende de:** 074 · **Libera:** —
**Risco e como reverter:** no caminho "sim", uma tela passa a gravar arquivo — teste com uma entrega de teste e confira o objeto no bucket. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (define se a empresa passa a guardar foto de entrega — custo de armazenamento e retenção — ou remove infraestrutura)
**Como verificar:**

```bash
grep -rn "entregas-fotos" src/ supabase/migrations/ | head
```

Esperado, no caminho "sim": a tela sobe uma foto e `select count(*) from storage.objects where bucket_id = 'entregas-fotos';` passa de 0 para 1 no teste (registre o caminho do objeto). No caminho "não": o bucket não aparece mais em `storage.buckets`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 077 — Remover `uploadDocument` de `storageService.ts`

**Onda / Severidade / Camada:** 4 / Média / serviço
**Achados resolvidos:** A-11
**Problema hoje:** `src/services/api/storageService.ts:33-48` (`uploadDocument`) sobe arquivo para o bucket `documents` **sem validar nada**: usa `file.name.split(".").pop()` como extensão (confia no nome que o cliente mandou), não checa tamanho, MIME nem assinatura. Ela **não tem nenhum chamador** — do arquivo, só `getSignedDocumentUrl` é importado (`src/components/shipping/DeliveryReceiptUpload.tsx:14`). É uma armadilha pronta: é a função com o nome mais óbvio para quem procurar "upload de documento".
**Causa raiz:** dois caminhos de upload para o mesmo bucket, um deles sem as validações do outro.
**Caminho recomendado:** confirme a ausência de chamador (`grep -rn "uploadDocument" src/ tests/`) e apague a função, mantendo `getSignedDocumentUrl` e o resto do arquivo intactos. No corpo da PR, aponte o caminho que fica: `src/hooks/data/useDocumentUpload.ts` (tamanho em `:57`, MIME em `:63`, assinatura em `:42-51`). **Atalho tentador a evitar:** acrescentar validação a `uploadDocument` em vez de removê-la. Passariam a existir dois validadores para manter, e o próximo agente escolheria pelo nome, não pela qualidade.
**Arquivos e objetos a tocar:** `src/services/api/storageService.ts` (remoção da função `uploadDocument` e de imports que fiquem órfãos)
**Não tocar / armadilhas:** `getSignedDocumentUrl` **é** usado — não remova; é ele que `DeliveryReceiptUpload.tsx:14` importa. Note que `getSignedAvatarUrl` no mesmo arquivo aponta para o bucket `avatars` (`:27-28`): não confunda os dois ao editar.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** se houver chamador escondido, o typecheck quebra na hora. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "uploadDocument" src/ tests/ ; echo "saida vazia = removida e sem chamador"
npm run typecheck 2>&1 | tail -5
```

Esperado: grep vazio, typecheck em 0 erros, e `getSignedDocumentUrl` ainda exportado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 078 — Recusar arquivo cuja assinatura não é conhecida

**Onda / Severidade / Camada:** 4 / Média / hook
**Achados resolvidos:** A-11
**Problema hoje:** `src/hooks/data/useDocumentUpload.ts:49` — `if (!signatures[type]) return true; // Fallback if type not in list`. O caminho robusto, que valida tamanho, MIME e magic bytes, **aceita** quando o tipo declarado não está na tabela de assinaturas. Com a lista de tipos permitidos restrita o risco é pequeno, mas o padrão é permissivo: quem ampliar `allowedTypes` amanhã ganha um furo sem perceber.
**Causa raiz:** valor de reserva permissivo numa função de validação.
**Caminho recomendado:** inverta o padrão: `return false` quando o tipo não estiver em `signatures`, e troque o comentário para dizer que tipo sem assinatura conhecida é recusado. Antes de mudar, leia `:62-66` e confirme quais tipos `allowedTypes` aceita por padrão — a tabela de `:41-46` cobre PDF, PNG, JPEG e WEBP; se o padrão de `allowedTypes` incluir algum tipo fora dessa tabela, o upload desse tipo passa a falhar, e aí a correção certa é **acrescentar a assinatura dele** na tabela, não manter o `return true`. **Atalho tentador a evitar:** inverter o retorno sem conferir `allowedTypes`. Dá tudo certo no typecheck e quebra silenciosamente o upload de um tipo que a operação usa.
**Arquivos e objetos a tocar:** `src/hooks/data/useDocumentUpload.ts` (apenas `:49` e, se necessário, a tabela de `:41-46`)
**Não tocar / armadilhas:** não altere a ordem das validações (`:56-70`): tamanho e MIME antes de ler os bytes é o que evita ler arquivo gigante. Não mexa no `setTimeout` de `:111` — é a etapa 127.
**Depende de:** — · **Libera:** 079
**Risco e como reverter:** um tipo de arquivo legítimo pode passar a ser recusado — por isso a conferência de `allowedTypes` faz parte da etapa. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '40,52p' src/hooks/data/useDocumentUpload.ts
sed -n '56,70p' src/hooks/data/useDocumentUpload.ts
```

Esperado: `return false` no caminho de tipo desconhecido, e todos os tipos de `allowedTypes` presentes na tabela de assinaturas. Na aplicação: subir um PDF válido continua funcionando; renomear um `.txt` para `.pdf` é recusado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 079 — Teste unitário da validação de assinatura de arquivo

**Onda / Severidade / Camada:** 4 / Média / teste
**Achados resolvidos:** A-11
**Problema hoje:** a única validação de conteúdo de arquivo do sistema vive em `src/hooks/data/useDocumentUpload.ts:42-51` e não tem teste. Depois da etapa 078, nada impede que alguém reponha o `return true` por parecer "mais tolerante" — foi assim que ele chegou ali.
**Causa raiz:** regra de segurança sem teste que a defenda.
**Caminho recomendado:** a função de magic bytes hoje está **dentro** do hook e usa `FileReader`, o que a torna difícil de testar isolada. O menor caminho é extrair só ela para uma função pura exportada no mesmo arquivo (recebendo o cabeçalho hexadecimal já lido e o `type`, devolvendo boolean) e testar essa função; o hook continua chamando-a. Escreva o teste ao lado, no padrão dos testes que já existem no repositório (por exemplo `src/hooks/rodonaves/useGatewayHealth.test.ts`), cobrindo: PDF válido aceito, PNG com cabeçalho de JPEG recusado, tipo fora da tabela recusado (a regra da etapa 078). Rode com `npx vitest run <caminho do teste>`, nunca a suíte inteira. **Atalho tentador a evitar:** testar o hook todo com mock de `FileReader` e de `supabase.storage`. Custa muito, quebra a cada mudança de UI e não protege a regra que importa.
**Arquivos e objetos a tocar:** `src/hooks/data/useDocumentUpload.ts` (extração mínima, mesma lógica), `src/hooks/data/useDocumentUpload.test.ts` (novo)
**Não tocar / armadilhas:** a extração não deve mudar comportamento nenhum — se o teste da etapa 078 passar antes e depois, está certo. Não mexa na leitura de `file.slice(0, 4)` (`:37`): é ela que garante que só 4 bytes são lidos.
**Depende de:** 078 · **Libera:** —
**Risco e como reverter:** baixo; é teste mais extração sem mudança de comportamento. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/hooks/data/useDocumentUpload.test.ts 2>&1 | tail -15
```

Esperado: três casos passando, inclusive o de tipo fora da tabela sendo recusado. Registre a saída.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 080 — Provar, arquivo por arquivo, quais dos oito "hooks sem importador" estão realmente mortos

**Onda / Severidade / Camada:** 4 / Baixa / hooks
**Achados resolvidos:** A-12
**Problema hoje:** `hooks.json` marca `usado_por: 0` para oito arquivos: `src/components/accessibility/index.ts`, `src/components/common/index.ts`, `src/components/pwa/index.ts`, `src/hooks/ai/useNexusSimulator.ts`, `src/hooks/gamification/useGamification.tsx`, `src/hooks/rodonaves/index.ts`, `src/hooks/security/useSelfHealing.ts`, `src/utils/performance.ts`. **Cinco são barris `index.ts`**, e "ninguém importa o barril" não quer dizer que o conteúdo está morto — ele pode ser importado pelo caminho direto. Dois exemplos já confirmados: os três hooks de `src/hooks/rodonaves/` **são** usados por caminho direto (`src/components/rodonaves/RTEGatewaySLOPanel.tsx:16`, `RTESLOHistoryPanel.tsx:8`, `RTEGatewayHealthPanel.tsx:9`), e `useGamification` é importado em pelo menos nove arquivos (`src/pages/Ranking.tsx:22`, `src/components/layout/Header.tsx:17`, `src/hooks/ui/useOnboarding.tsx:5`, entre outros).
**Causa raiz:** a métrica da fonte gerada conta importadores do arquivo, não do símbolo.
**Caminho recomendado:** esta etapa **não remove nada** — produz a prova. Para cada um dos oito, rode as duas buscas que decidem: a do arquivo (`grep -rn "<caminho sem extensão>" src/`) e a dos símbolos que ele exporta (`grep -rn "<NomeExportado>" src/`). Há uma armadilha específica e grave em `useGamification`: existem **dois** arquivos, `src/hooks/gamification/useGamification.ts` e `useGamification.tsx`; todos os imports são `from "@/hooks/gamification/useGamification"` **sem extensão**, e a resolução do TypeScript/Vite escolhe `.ts`. Só o `.tsx` está órfão — e, para piorar, um comentário em `src/services/api/authService.ts:43` afirma que o schema em uso é "pelo `useGamification.tsx`". Compare os dois arquivos antes de concluir qualquer coisa: se as implementações divergirem, o comentário pode indicar que o `.tsx` é a versão certa e o `.ts` é a sobra — e aí a decisão é do dono, não sua. Registre o veredicto de cada um dos oito em `05-PROGRESSO.md`, em uma linha: "morto" / "vivo por caminho direto" / "indefinido, chamar o dono". **Atalho tentador a evitar:** apagar os barris porque "não têm importador". `src/components/common/index.ts` exporta 30 componentes em uso (`EmptyState`, `ConfirmDialog`, `Pagination`…); apagá-lo não quebra o build hoje, mas tira o ponto de entrada que as etapas 097-103 vão usar.
**Arquivos e objetos a tocar:** nenhum código; `05-PROGRESSO.md` (registro dos oito veredictos)
**Não tocar / armadilhas:** `useNexusSimulator` e `useSelfHealing` já são tratados nas etapas 069 e 068 — não os inclua numa remoção aqui. Não edite a branch `contexto` nem `hooks.json`.
**Depende de:** — · **Libera:** 081
**Risco e como reverter:** nenhum (leitura)
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "hooks/rodonaves" src/ | grep -v "hooks/rodonaves/index.ts"
grep -rln "useGamification" src/ | grep -v "^src/hooks/gamification/"
diff <(sed -n '1,40p' src/hooks/gamification/useGamification.ts) <(sed -n '1,40p' src/hooks/gamification/useGamification.tsx) | head -20
```

Esperado: a tabela dos oito veredictos registrada, com o comando que a sustenta ao lado de cada um.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 081 — Remover só o que a etapa 080 provou morto

**Onda / Severidade / Camada:** 4 / Baixa / hooks
**Achados resolvidos:** A-12
**Problema hoje:** depois da etapa 080, o único candidato confirmado sem nenhum importador nem símbolo em uso é `src/utils/performance.ts` (`useRenderingMonitor` e `measureAction`, zero importadores; o arquivo ainda carrega um `console.warn` e um `console.log`). Os barris continuam servindo de ponto de entrada, e `useGamification.tsx` depende do veredicto da 080.
**Causa raiz:** código deixado para trás.
**Caminho recomendado:** apague **um arquivo por PR**, começando por `src/utils/performance.ts`, e cada PR citando no corpo a prova produzida na etapa 080. Para `useGamification.tsx`, só prossiga se a 080 concluiu "morto"; se concluiu "indefinido", deixe a PR aberta para o dono com a comparação dos dois arquivos no corpo — apagar a versão errada de um hook usado em nove telas é estrago grande para uma etapa de higiene. Não toque nos cinco barris. **Atalho tentador a evitar:** uma PR "remove 8 arquivos mortos". Foi essa generalização que gerou o achado; a remoção precisa ser granular para poder ser revertida sozinha.
**Arquivos e objetos a tocar:** `src/utils/performance.ts` (remoção); `src/hooks/gamification/useGamification.tsx` (remoção **condicionada** ao veredicto da 080)
**Não tocar / armadilhas:** não apague `src/components/accessibility/index.ts`, `src/components/common/index.ts`, `src/components/pwa/index.ts` nem `src/hooks/rodonaves/index.ts`. Se remover `useGamification.tsx`, confira depois que `src/hooks/index.ts:80` (`export * from './gamification/useGamification'`) continua resolvendo — ele passa a apontar para o `.ts`.
**Depende de:** 080 · **Libera:** —
**Risco e como reverter:** remoção de arquivo quebra o build na hora se houver import — o typecheck e o build pegam. `git revert`.
**Precisa de aprovação humana antes do merge:** não (exceto o caso `useGamification.tsx` com veredicto "indefinido", que fica aberto para o dono)
**Como verificar:**

```bash
npm run typecheck 2>&1 | tail -5
npm run build 2>&1 | tail -5
npm run lint:budget 2>&1 | tail -10
```

Esperado: typecheck em 0 erros, build concluído e o orçamento de avisos **igual ou menor** que antes (remover `src/utils/performance.ts` tende a baixá-lo, o que ajuda as outras etapas).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 082 — Remover `_shared/service-wrapper.ts`, que nenhuma função usa

**Onda / Severidade / Camada:** 4 / Baixa / edge function
**Achados resolvidos:** A-13
**Problema hoje:** `supabase/functions/_shared/service-wrapper.ts` existe (440 bytes) e `grep -rl 'service-wrapper' supabase/functions/*/index.ts` devolve **0**. O arquivo exporta `handleExternalCall`, que apenas envolve `getCircuitBreaker(serviceName).execute(call)` e registra o erro — e esse disjuntor já é aplicado de verdade por `supabase/functions/_shared/safeFetch.ts`, por onde passam as 36 chamadas a terceiros. Além de morto, o arquivo usa `any` e lê `error.message` sem checar tipo, então serve de molde ruim para quem o encontrar.
**Causa raiz:** helper criado antes de `safeFetch` e nunca adotado nem removido.
**Caminho recomendado:** confirme a orfandade incluindo os `_shared` entre si (`grep -rn "service-wrapper" supabase/`) e apague o arquivo, em PR só disso. No corpo da PR, diga onde o padrão real vive — `safeFetch.ts:107-111` (tempo limite de 10 s e disjuntor por host) — para que ninguém recrie o wrapper. A padronização da **resposta de erro** das funções, que este arquivo não fazia, é tratada nas etapas do achado B-06; cite isso na PR para não parecer que você está removendo a solução de um problema aberto. **Atalho tentador a evitar:** adotar o wrapper nas 22 funções "já que ele existe". Ele não resolve o que elas erram (devolver mensagem interna ao cliente) e acrescentaria uma segunda camada de disjuntor sobre a de `safeFetch`.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/service-wrapper.ts` (remoção)
**Não tocar / armadilhas:** não toque em `_shared/safeFetch.ts`, `_shared/circuitBreaker.ts` nem `_shared/logger.ts` — os dois últimos são importados pelo arquivo que sai, mas têm outros usuários. Lembre: merge em `main` tocando `supabase/functions/**` dispara `deploy-functions.yml` e publica as funções; confirme o resultado do workflow depois do merge.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo (0 importadores). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "service-wrapper" supabase/ ; echo "saida vazia = removido e sem importador"
npx vitest run supabase/functions/_shared/ 2>&1 | tail -15
```

Esperado: grep vazio e os testes de `_shared` passando como antes. Depois do merge, o workflow de deploy verde.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 083 — Estabilizar os callbacks dentro de `useRealtime` (corrige as 12 telas de uma vez)

**Onda / Severidade / Camada:** 2 / Crítica / hook
**Achados resolvidos:** R-02
**Problema hoje:** `src/hooks/data/useRealtime.tsx:124` declara `handleChange` como `useCallback` com deps `[queryKey, queryClient, onInsert, onUpdate, onDelete, table]` (`:158`), e o `useEffect` da assinatura depende de `handleChange` (`:214`). Como os chamadores passam `queryKey` e os três callbacks **inline**, todos ganham identidade nova a cada render: `handleChange` muda, o efeito roda de novo, derruba o canal (`removeChannel`) e abre outro. Cada evento causa `refetch` → render → canal novo → evento, e o ciclo se alimenta. Pior: a linha `:157` já tem `// eslint-disable-next-line react-hooks/exhaustive-deps` — o atalho que silencia o aviso já foi tomado e é parte do que esconde o defeito.
**Causa raiz:** a interface do hook aceita callback inline sem exigir estabilidade, e as deps do efeito carregam essa instabilidade até a assinatura do canal.
**Caminho recomendado:** o padrão a copiar está **no próprio arquivo**, duas vezes: `topicRef = useRef(hookInstanceId())` (`:94`) e `debouncedInvalidate = useRef(debounce(...)).current` (`:99-122`) — coisas que precisam sobreviver aos renders já moram em `ref` aqui. Faça o mesmo com o que vem de fora: guarde `onInsert`, `onUpdate`, `onDelete` e `queryKey` num `useRef` atualizado em todo render (`useEffect(() => { cbRef.current = { onInsert, onUpdate, onDelete, queryKey }; })`, sem array de deps), e dentro de `handleChange` leia sempre `cbRef.current`. Com isso, `handleChange` passa a ter deps só de valores estáveis (`queryClient`, `table`) e o efeito de `:214` deixa de rodar a cada render. Para `queryKey`, que é array literal, o `ref` resolve o mesmo problema — não tente comparar por valor. Confirme ao final que o `eslint-disable` de `:157` pode **sair**: se a regra ficar satisfeita sozinha, a dívida foi paga; se ainda apontar algo, é sinal de que sobrou dependência instável. **Atalho tentador a evitar:** acrescentar mais um `eslint-disable` nas deps do efeito de `:214`. Silencia o aviso e mantém o laço aberto — é exatamente o estado atual, só mais escondido.
**Arquivos e objetos a tocar:** `src/hooks/data/useRealtime.tsx` (`handleChange` em `:124-158` e as deps do efeito em `:214`)
**Não tocar / armadilhas:** não mexa em `topicRef` (`:94`), no registro de tópicos (`:25-29`), no `releaseChannelTopic` do cleanup nem na lógica de retentativa com recuo exponencial (`:186-200`) — essa parte está correta e é o que impede colisão de tópicos. Há um segundo hook no mesmo arquivo, `useMultiTableRealtime` (a partir de `:222`): **não** o altere nesta etapa; se ele tiver o mesmo defeito, registre em "Achados novos". E não mude a assinatura pública do hook: as 12 telas têm de continuar compilando sem alteração.
**Depende de:** — · **Libera:** 084, 085, 086, 087, 088, 089, 090, 091, 092, 093, 094, 095, 096
**Risco e como reverter:** o risco real é o inverso do atual: um `ref` lido no lugar errado pode fazer o handler chamar uma versão velha do callback (fechamento preso em dado antigo). Como o `ref` é atualizado em todo render, isso não acontece — mas valide na tela de Envios antes de mergear. `git revert` da PR devolve o comportamento de hoje.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '120,165p' src/hooks/data/useRealtime.tsx
sed -n '205,220p' src/hooks/data/useRealtime.tsx
npx eslint src/hooks/data/useRealtime.tsx
npx vitest run src/hooks/data/ 2>&1 | tail -15
```

Esperado: as deps de `handleChange` sem `onInsert`/`onUpdate`/`onDelete`/`queryKey`, as deps do efeito sem `handleChange` instável, e o ESLint limpo. **A verificação que conclui a etapa é no navegador:** abra `/envios`, abra o painel de rede filtrando por `websocket` (ou a aba Console) e confirme que, enquanto a tela fica aberta e recebe eventos, **não** há abertura e fechamento repetida de canal. Registre o antes e o depois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

> **Leia antes das etapas 084 a 095.** A etapa 083 corrige a causa raiz dentro do hook e, sozinha, protege as 12 telas. As etapas seguintes corrigem **o lado do chamador** — passar callbacks estáveis, como `src/hooks/logistics/useUnifiedTracking.tsx:180-202` já faz (`useCallback` com deps do `refetch`, passados por referência). Se, ao abrir cada tela, a verificação da 083 mostrar que o canal já está estável, **a etapa vira verificação, não mudança**: registre em `05-PROGRESSO.md` "estável após 083, nenhuma alteração necessária" com a evidência, e siga. Corrija o chamador quando (a) a 083 não pôde ser feita ou foi revertida, (b) a tela ainda mostrar reassinatura, ou (c) o chamador tiver outro defeito próprio apontado na etapa. O valor de corrigir o chamador mesmo com a 083 feita é não voltar a depender de um único arquivo — mas isso não justifica uma PR por tela se nada mudar: nesse caso, prefira registrar e seguir.

### Etapa 084 — `Envios`: callbacks de tempo real estáveis

**Onda / Severidade / Camada:** 2 / Crítica / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/Envios.tsx:417-422` passa três arrow functions inline (`onInsert: () => refetch()`, `onUpdate`, `onDelete`), todas com identidade nova a cada render. É a tela mais aberta do dia e o exemplo citado no achado.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** copie o desenho de `src/hooks/logistics/useUnifiedTracking.tsx:183-191`: declare **um** `const onEntregaChange = useCallback(() => { refetch(); }, [refetch]);` acima da chamada e passe-o nas três props. Um único callback para os três eventos é suficiente aqui porque os três fazem a mesma coisa — e é assim que o arquivo de referência faz. Confirme que `refetch` vem do `useQuery` desta tela (`:350` é a consulta de `["entregas"]`): o `refetch` do TanStack Query é estável, então o `useCallback` não se recria. **Atalho tentador a evitar:** envolver `refetch` em `useMemo` ou criar três `useCallback` iguais. Um só, com dep `[refetch]`, resolve.
**Arquivos e objetos a tocar:** `src/pages/Envios.tsx` (o bloco `:417-422` e a declaração do callback acima dele)
**Não tocar / armadilhas:** não altere a consulta de `:350` nem o `queryKey` dela. Esta tela também é alvo da etapa 099 (erro como texto solto) — não junte as duas coisas na mesma PR.
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '405,425p' src/pages/Envios.tsx
npx eslint src/pages/Envios.tsx
```

Esperado: nenhuma arrow inline nas props do `useRealtime`. No navegador, em `/envios`: uma alteração em `entregas` atualiza a lista e o canal continua o mesmo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 085 — `KanbanEntregas`: callbacks de tempo real estáveis

**Onda / Severidade / Camada:** 2 / Crítica / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/KanbanEntregas.tsx:249-257` passa três arrows inline que chamam `queryClient.invalidateQueries({ queryKey: ["kanban-entregas"] })` — identidade nova a cada render, e o array `["kanban-entregas"]` recriado três vezes.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** um `const onEntregaChange = useCallback(() => { queryClient.invalidateQueries({ queryKey: ["kanban-entregas"] }); }, [queryClient]);` acima da chamada, passado nas três props — `queryClient` é estável (vem de `useQueryClient`), então o callback nasce uma vez. Mesmo desenho de `useUnifiedTracking.tsx:183-191`. **Atalho tentador a evitar:** trocar a invalidação por `refetch()` "para ficar igual à Envios". O Kanban invalida por chave de propósito (há mais de um consumidor dessa chave); mudar isso é alterar comportamento numa etapa que deveria só estabilizar.
**Arquivos e objetos a tocar:** `src/pages/KanbanEntregas.tsx` (`:249-257` e a declaração acima)
**Não tocar / armadilhas:** o arrastar-e-soltar do Kanban depende da invalidação dessa mesma chave; confirme que o arrastar continua refletindo na tela depois da mudança.
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '240,262p' src/pages/KanbanEntregas.tsx
npx eslint src/pages/KanbanEntregas.tsx
```

Esperado: props recebendo uma referência estável. No navegador, em `/kanban-entregas`: mover um cartão continua funcionando e o canal não é reaberto.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 086 — `Index` (painel): estabilizar a primeira assinatura, de `entregas`

**Onda / Severidade / Camada:** 2 / Crítica / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/Index.tsx:136-139` chama `useRealtime({ table: "entregas", queryKey: ["dashboard-metrics", "recent-alerts"] })`. Não há callback aqui, mas o **`queryKey` é um array literal**: identidade nova a cada render, e é dep de `handleChange` (`useRealtime.tsx:158`). O painel é a tela de abertura do sistema, logo é onde o laço roda mais.
**Causa raiz:** ver etapa 083 — `queryKey` inline também instabiliza.
**Caminho recomendado:** declare a chave **fora do componente**, no topo do módulo (`const DASHBOARD_RT_KEY = ["dashboard-metrics", "recent-alerts"] as const;`) e passe a constante. Constante de módulo é mais simples que `useMemo` e nunca se recria; é o jeito mais barato de estabilizar um array literal. **Atalho tentador a evitar:** `useMemo(() => [...], [])`. Funciona, mas acrescenta hook e dependência vazia onde uma constante de módulo resolve — e a constante documenta que a chave é fixa.
**Arquivos e objetos a tocar:** `src/pages/Index.tsx` (`:136-139` e uma constante no topo do arquivo)
**Não tocar / armadilhas:** essas duas chaves (`dashboard-metrics`, `recent-alerts`) também são invalidadas **de dentro** do hook (`useRealtime.tsx:138-144`, para as tabelas `entregas`, `coletas`, `ocorrencias`, `ai_delay_predictions`) — não "simplifique" removendo o `queryKey` da chamada achando que o hook já cuida: o caminho de dentro é um `debounce` adicional, não substituto. A segunda chamada, de `:140`, é a etapa 087.
**Depende de:** 083 · **Libera:** 087
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '130,145p' src/pages/Index.tsx
```

Esperado: a chamada de `entregas` recebe uma constante, não um literal. No navegador, na página inicial: os indicadores continuam atualizando após uma alteração em `entregas`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 087 — `Index` (painel): estabilizar a segunda assinatura, de `coletas`

**Onda / Severidade / Camada:** 2 / Crítica / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/Index.tsx:140` chama `useRealtime({ table: "coletas", queryKey: ["dashboard-metrics"] })` — segundo array literal na mesma tela, com o mesmo efeito da etapa 086. São duas assinaturas simultâneas no painel, então o laço dobra.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** mesma solução da 086, numa segunda constante de módulo (`const DASHBOARD_COLETAS_RT_KEY = ["dashboard-metrics"] as const;`). Fazer em PR separada da 086 mantém cada mudança verificável sozinha e permite reverter uma sem a outra. **Atalho tentador a evitar:** reaproveitar a constante da etapa 086 (`["dashboard-metrics", "recent-alerts"]`) nesta chamada. Mudaria o que é invalidado quando uma coleta muda — hoje só `dashboard-metrics`; é mudança de comportamento disfarçada de limpeza.
**Arquivos e objetos a tocar:** `src/pages/Index.tsx` (`:140` e uma constante no topo)
**Não tocar / armadilhas:** o painel usa `useGamification` (`src/pages/Index.tsx` aparece como consumidor em `rotas.json`) e vários hooks de indicador; não encoste neles.
**Depende de:** 086 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "useRealtime" src/pages/Index.tsx
```

Esperado: as duas chamadas recebendo constantes. No navegador: criar uma coleta atualiza os indicadores do painel.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 088 — `Coletas`: estabilizar a chave da assinatura

**Onda / Severidade / Camada:** 2 / Crítica / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/Coletas.tsx:136` chama `useRealtime({ table: "coletas", queryKey: ["coletas-list"] })` com array literal — mesma instabilidade das etapas 086 e 087.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** declare `const COLETAS_QUERY_KEY = ["coletas-list"] as const;` no topo do módulo e use a **mesma constante** nos dois lugares: no `queryKey` do `useQuery` (`:119`) e na chamada do `useRealtime` (`:136`). Aqui o ganho é duplo: estabiliza e elimina a chance de as duas strings divergirem — que é o tipo de erro que faz a tela parar de atualizar sem ninguém entender. **Atalho tentador a evitar:** estabilizar só a chamada do `useRealtime` e deixar o literal no `useQuery`. Funciona, mas perde o motivo principal de usar constante aqui.
**Arquivos e objetos a tocar:** `src/pages/Coletas.tsx` (`:119`, `:136` e a constante no topo)
**Não tocar / armadilhas:** se as etapas 065-067 (exclusão de coleta) já estiverem feitas, elas invalidam `["coletas-list"]`: use a constante lá também, no mesmo PR, **só** se o arquivo já tiver essa invalidação; não crie nada novo. Não mexa no `.limit(500)` nem no filtro `deleted_at` da consulta.
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "coletas-list" src/pages/Coletas.tsx
```

Esperado: nenhuma ocorrência do literal `["coletas-list"]` fora da constante. No navegador, em `/coletas`: criar uma coleta em outra aba faz a lista atualizar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 089 — `AuditTrailViewer`: callback de tempo real estável

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/components/audit/AuditTrailViewer.tsx:75` — `useRealtime({ table: "audit_logs", onInsert: () => refetch() })`, arrow inline. Este é componente, não página: pode ser montado dentro de outra tela, e aí a reassinatura acontece junto com os renders do pai.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** `const onAuditInsert = useCallback(() => { refetch(); }, [refetch]);` acima da chamada, passado em `onInsert` — padrão de `useUnifiedTracking.tsx:183-186`. **Atalho tentador a evitar:** passar `refetch` direto como `onInsert`. Parece equivalente e não é: o hook chama o callback com o payload da linha alterada (`useRealtime.tsx:148`), e `refetch` do TanStack Query interpreta o primeiro argumento como opções. Envolva num callback que ignore o argumento.
**Arquivos e objetos a tocar:** `src/components/audit/AuditTrailViewer.tsx` (`:75` e a declaração acima)
**Não tocar / armadilhas:** não altere o `useFilters` de `:77-82` nem a exportação do componente.
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '70,80p' src/components/audit/AuditTrailViewer.tsx
npx eslint src/components/audit/AuditTrailViewer.tsx
```

Esperado: `onInsert` recebendo referência estável. Na tela que monta o visualizador de auditoria, um registro novo aparece sem recarregar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 090 — `RastreamentoMotorista`: callback de tempo real estável

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/RastreamentoMotorista.tsx:74` — `useRealtime({ table: "coletas", onUpdate: () => refetchOrders() })`, arrow inline. Agrava o caso: logo abaixo, `:76-82`, há um `setInterval` de 10 s que chama `refetchDriverLocation()` e um `eslint-disable` nas deps (`:81`), então a tela já renderiza em ciclo curto — e cada render reassina o canal.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** `const onColetaUpdate = useCallback(() => { refetchOrders(); }, [refetchOrders]);` e passe em `onUpdate`. **Não** toque no `setInterval` nem no `eslint-disable` de `:81` nesta etapa — o `clearInterval` existe (`:79`), então não é o achado R-08; se achar que as deps do efeito estão erradas, anote em "Achados novos". **Atalho tentador a evitar:** aproveitar que a tela está aberta para "arrumar as deps" do efeito de `:76-82`. É outra mudança, com outro risco (o intervalo pode passar a se recriar), e some dentro desta PR.
**Arquivos e objetos a tocar:** `src/pages/RastreamentoMotorista.tsx` (`:74` e a declaração acima)
**Não tocar / armadilhas:** `refetchOrders` e `refetchDriverLocation` vêm de hooks diferentes — confirme qual é qual antes de pôr na dep.
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '70,84p' src/pages/RastreamentoMotorista.tsx
npx eslint src/pages/RastreamentoMotorista.tsx
```

Esperado: `onUpdate` com referência estável e o efeito de `:76-82` inalterado. Na tela, com rastreamento ligado, a lista de coletas reflete uma alteração sem recarregar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 091 — `Ranking`: callback de tempo real estável

**Onda / Severidade / Camada:** 2 / Média / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/Ranking.tsx:77` — `useRealtime({ table: "user_levels", onUpdate: () => refetch() })`, arrow inline.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** `const onLevelUpdate = useCallback(() => { refetch(); }, [refetch]);` passado em `onUpdate`, padrão de `useUnifiedTracking.tsx:183-186`. **Atalho tentador a evitar:** desligar o tempo real desta tela "porque ranking não é crítico". Reduz o sintoma de uma tela e deixa a causa; e o ranking atualizando ao vivo é parte do que a gamificação promete.
**Arquivos e objetos a tocar:** `src/pages/Ranking.tsx` (`:77` e a declaração acima)
**Não tocar / armadilhas:** esta tela também chama `useGamification()` (`:56`) — não mexa nisso, e lembre que `useGamification` é assunto das etapas 080-081 (não remova nada daqui).
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '72,80p' src/pages/Ranking.tsx
npx eslint src/pages/Ranking.tsx
```

Esperado: referência estável em `onUpdate`. Na tela `/ranking`, uma alteração em `user_levels` reordena a lista sem recarregar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 092 — `SLADashboard`: callbacks de tempo real estáveis

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/SLADashboard.tsx:43-47` passa `onInsert: () => refetch()` e `onUpdate: () => refetch()` inline.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** um `useCallback` só, usado nas duas props, com dep `[refetch]` — padrão de `useUnifiedTracking.tsx:183-191`. **Atalho tentador a evitar:** acrescentar `onDelete` "para ficar completo". Esta tela não precisa reagir a exclusão; acrescentar comportamento numa etapa de estabilização é como o escopo cresce.
**Arquivos e objetos a tocar:** `src/pages/SLADashboard.tsx` (`:43-47` e a declaração acima)
**Não tocar / armadilhas:** o painel de SLA consome métricas de hook próprio (`:49` usa `metrics || {...}`); não toque nos valores de reserva.
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '38,50p' src/pages/SLADashboard.tsx
npx eslint src/pages/SLADashboard.tsx
```

Esperado: as duas props com a mesma referência estável. Na tela, uma entrega nova entra nos números sem recarregar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 093 — `Notificacoes`: callbacks de tempo real estáveis

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/Notificacoes.tsx:88-93` passa `onInsert`, `onUpdate` e `onDelete` inline, cada um chamando `refetch()`. Esta tela é a que mais sofre com o laço: cada notificação nova dispara `refetch` → render → canal novo, e o achado P-02 mostra que ela já baixa o histórico inteiro a cada vez.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** um `useCallback` com dep `[refetch]` nas três props, padrão de `useUnifiedTracking.tsx:183-191`. **Atalho tentador a evitar:** mexer na consulta para "aproveitar e paginar no servidor". Isso é o achado P-02 e tem etapa própria; aqui a mudança é só a estabilidade do canal, para que a correção de P-02 depois seja medível.
**Arquivos e objetos a tocar:** `src/pages/Notificacoes.tsx` (`:88-93` e a declaração acima)
**Não tocar / armadilhas:** não altere o filtro de `:95-96` (`customFiltered`) nem a consulta da lista.
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '84,96p' src/pages/Notificacoes.tsx
npx eslint src/pages/Notificacoes.tsx
```

Esperado: três props com referência estável. No navegador, em `/notificacoes`: com várias notificações chegando, o canal não é reaberto a cada uma.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 094 — `Despachos`: callbacks de tempo real estáveis

**Onda / Severidade / Camada:** 2 / Crítica / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/Despachos.tsx:154` abre `useRealtime({ table: "entregas", onInsert: ..., onUpdate: ... })` com arrows inline que, além de `refetch()`, tocam som (`playNotification()`, de `useAudioFeedback`). Som dentro de callback instável significa que um mesmo evento pode tocar duas vezes se o canal for reaberto no meio.
**Causa raiz:** ver etapa 083.
**Caminho recomendado:** declare os callbacks com `useCallback`, com deps `[refetch, playNotification]` (e os outros sons que o bloco usar) — confira em `:107` quais funções de som a tela desestrutura. Padrão: `useUnifiedTracking.tsx:183-191`. **Atalho tentador a evitar:** tirar o som para "simplificar". O som é o aviso que o despachante usa; a etapa é estabilizar, não reduzir funcionalidade.
**Arquivos e objetos a tocar:** `src/pages/Despachos.tsx` (o bloco a partir de `:154` e as declarações acima)
**Não tocar / armadilhas:** confirme que `playNotification` é estável — se vier de `useAudioFeedback` como função recriada a cada render, o `useCallback` não resolve nada e você precisa de um `ref` (ou de incluir a função num `ref` como a 083 faz). **Verifique isso antes de declarar a etapa concluída.** Esta tela também é alvo das etapas 097 e 098 (erro não tratado) — PRs separadas.
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '150,175p' src/pages/Despachos.tsx
grep -n "useAudioFeedback" src/pages/Despachos.tsx src/hooks/notifications/useAudioFeedback.tsx
npx eslint src/pages/Despachos.tsx
```

Esperado: callbacks estáveis e a origem de `playNotification` conferida. Na tela `/despachos`: um despacho novo toca o som **uma** vez e a fila atualiza.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 095 — `CustosDashboard`: estabilizar `handleRefetch`

**Onda / Severidade / Camada:** 2 / Média / interface
**Achados resolvidos:** R-02
**Problema hoje:** `src/pages/CustosDashboard.tsx:75` passa `onUpdate: handleRefetch` — parece correto, mas `handleRefetch` é declarado na linha de cima, `:74`, como `const handleRefetch = () => setDateRange({ from: startDate, to: endDate });`: função recriada a cada render, com o mesmo efeito de uma arrow inline. É o caso mais fácil de passar batido numa revisão.
**Causa raiz:** ver etapa 083 — nome de variável não garante estabilidade.
**Caminho recomendado:** envolva em `useCallback` com deps `[startDate, endDate]`, mantendo o corpo idêntico. Note que o mesmo `handleRefetch` é usado no botão "Atualizar" (`:169`), então não mude o comportamento. **Atalho tentador a evitar:** trocar a implementação por um `refetch()` do hook de custos. O botão hoje reaplica o intervalo de datas de propósito (`setDateRange`), o que força o hook a recarregar com o período atual; `refetch` puro pode não ter o mesmo efeito.
**Arquivos e objetos a tocar:** `src/pages/CustosDashboard.tsx` (`:74`)
**Não tocar / armadilhas:** `startDate` e `endDate` vêm do intervalo de datas da tela — se forem objetos `Date` recriados a cada render, o `useCallback` continua instável; nesse caso, use as versões em texto (ISO) como deps ou memoize o intervalo. **Confira antes de concluir.**
**Depende de:** 083 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '60,80p' src/pages/CustosDashboard.tsx
npx eslint src/pages/CustosDashboard.tsx
```

Esperado: `handleRefetch` em `useCallback` com deps estáveis, e o botão "Atualizar" (`:169`) funcionando igual. Na tela `/custos-dashboard`: alterar uma entrega atualiza os números, sem reabrir o canal.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 096 — Escrever o contrato no alto de `useRealtime` e varrer os chamadores

**Onda / Severidade / Camada:** 2 / Crítica / hook
**Achados resolvidos:** R-02
**Problema hoje:** o achado diz, com razão, que "a interface do hook aceita callback inline sem exigir estabilidade, e o contrato não está documentado onde o chamador olha". Mesmo com as etapas 083-095 feitas, o próximo chamador repete o padrão: o arquivo explica o cuidado com **tópico** (`src/hooks/data/useRealtime.tsx:22-24`) e nada sobre **estabilidade de callback**.
**Causa raiz:** regra aprendida no código e não escrita onde se lê antes de usar.
**Caminho recomendado:** acrescente, logo acima de `export function useRealtime` (`:79`), um comentário curto no mesmo tom dos que já existem no arquivo: que `queryKey`, `onInsert`, `onUpdate` e `onDelete` devem ser referências estáveis (constante de módulo ou `useCallback`), apontando `src/hooks/logistics/useUnifiedTracking.tsx:180-202` como exemplo e explicando em uma linha o que acontece quando não são. Depois, feche a etapa com a varredura que prova que não sobrou chamador instável: liste todos os `useRealtime(` de `src/` e confira um por um contra as etapas 084-095. Se aparecer um chamador que não está na lista do achado (arquivo novo desde `d37ba30`), **não corrija aqui**: registre em "Achados novos" no progresso. **Atalho tentador a evitar:** criar uma regra de ESLint própria para isso. Custo alto, risco de falso positivo em toda a base, e o gate de avisos está no teto — o comentário mais a varredura resolvem com diff mínimo.
**Arquivos e objetos a tocar:** `src/hooks/data/useRealtime.tsx` (apenas comentário acima de `:79`)
**Não tocar / armadilhas:** não mude a assinatura nem os tipos de `UseRealtimeOptions` para "forçar" estabilidade por tipo — não há como expressar isso em TypeScript sem atrito, e mudaria a interface de 12 telas.
**Depende de:** 083, 084, 085, 086, 087, 088, 089, 090, 091, 092, 093, 094, 095 · **Libera:** —
**Risco e como reverter:** nenhum (comentário). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "useRealtime(" src/ | grep -v "src/hooks/data/useRealtime.tsx"
grep -rn -A6 "useRealtime({" src/ | grep -n "() =>" | head
sed -n '70,82p' src/hooks/data/useRealtime.tsx
```

Esperado: a primeira lista com 12 chamadas conhecidas (ou as sobrantes registradas como achado novo); a segunda **sem** arrow inline dentro de `useRealtime({ ... })`; e o contrato escrito acima de `:79`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 097 — `Despachos`: ler o erro da consulta

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-01
**Problema hoje:** `src/pages/Despachos.tsx:109-113` desestrutura apenas `data`, `isLoading` e `refetch` do `useQuery`. O `error` e o `isError` existem no retorno e são jogados fora — por isso a tela não tem como saber que a consulta falhou. A consulta tem `if (error) throw error;` dentro da `queryFn` (`:131`), então o erro **chega** ao TanStack Query; ninguém o lê.
**Causa raiz:** retorno do `useQuery` desestruturado pela metade.
**Caminho recomendado:** acrescente `isError` e `error` à desestruturação de `:109-113`, exatamente como `src/pages/Coletas.tsx:112-118` faz (`data`, `isLoading`, `isError`, `error`, `refetch`). **Só isso nesta etapa** — nenhuma mudança visual. A PR fica com diff de duas linhas e pode ser verificada por typecheck; o uso do erro na tela é a etapa 098, que precisa ser revertível sozinha porque mexe no que o despachante vê. **Atalho tentador a evitar:** já emendar o `EmptyState` aqui. Duas mudanças numa PR, em uma tela crítica de operação, é o que torna a reversão cara.
**Arquivos e objetos a tocar:** `src/pages/Despachos.tsx` (`:109-113`)
**Não tocar / armadilhas:** o ESLint pode reclamar de variável declarada e não usada entre esta etapa e a 098 — se reclamar, **faça as duas etapas em sequência no mesmo dia** e cite isso na PR; não acrescente `eslint-disable`, e lembre que o orçamento de avisos está no teto (105/105), então um aviso novo reprova a CI.
**Depende de:** — · **Libera:** 098
**Risco e como reverter:** nenhum comportamento muda. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '107,116p' src/pages/Despachos.tsx
npx eslint src/pages/Despachos.tsx
npm run lint:budget 2>&1 | tail -5
```

Esperado: `isError` e `error` presentes na desestruturação; ESLint sem erro e o orçamento de avisos não subiu.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 098 — `Despachos`: parar de dizer "Fila Limpa" quando a consulta falhou

**Onda / Severidade / Camada:** 2 / Crítica / interface
**Achados resolvidos:** R-01
**Problema hoje:** quando a consulta falha, `despachos` fica com o valor de reserva `[]` (`src/pages/Despachos.tsx:110`), cada coluna cai no bloco `{items.length === 0 && (...)}` (`:521-529`) e a tela exibe **"Fila Limpa"** (`:525`). O despachante lê que não há nada para despachar e mercadoria pronta deixa de sair — a tela mente com confiança.
**Causa raiz:** estado vazio e estado de falha representados pela mesma tela.
**Caminho recomendado:** com `isError` disponível (etapa 097), mostre o erro **antes** de renderizar as colunas, no mesmo desenho que `src/pages/Coletas.tsx:253-268` usa: um `if (isError) return (<MainLayout> ... <EmptyState variant="error" title="..." description={error?.message || "..."} action={{ label: "Tentar de novo", onClick: () => refetch() }} /> ... </MainLayout>);`. O componente vem de `src/components/common/EmptyState.tsx` (variante `error` já definida em `:27`) — **o arquivo não o importa hoje**, acrescente o import. O `refetch` já está desestruturado em `:111`. Mantenha o "Fila Limpa" para o caso de fila realmente vazia: é informação útil quando é verdade. **Atalho tentador a evitar:** trocar o texto de "Fila Limpa" para algo ambíguo como "Sem itens no momento". Não resolve: o despachante continua sem saber que o sistema falhou, e perde-se a informação boa do caso vazio.
**Arquivos e objetos a tocar:** `src/pages/Despachos.tsx` (import do `EmptyState` e um bloco `if (isError)` antes do retorno principal)
**Não tocar / armadilhas:** o retorno de carregamento (`isLoading`) já existe — ponha o `isError` depois dele, na mesma ordem de `Coletas.tsx` (carregando → erro → conteúdo), senão a tela pisca o erro durante o primeiro carregamento. Não mexa no `ConfirmDialog` de `:546` nem no `ExpeditionDetailsDialog` de `:536`.
**Depende de:** 097 · **Libera:** —
**Risco e como reverter:** se o `isError` for avaliado antes do `isLoading`, a tela mostra erro por um instante em todo carregamento — por isso a ordem está na etapa. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "EmptyState\|isError" src/pages/Despachos.tsx
```

Esperado: import presente e um bloco `isError` antes do conteúdo. **Teste real:** com a aplicação aberta em `/despachos`, corte a rede (modo offline do navegador) e recarregue — a tela deve mostrar o erro com botão "Tentar de novo", **nunca** "Fila Limpa". Religue a rede e confirme que o botão recarrega a fila. Registre o resultado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 099 — `Envios`: erro com componente e botão de tentar de novo

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-01
**Problema hoje:** `src/pages/Envios.tsx:574` mostra `<p className="text-destructive">Erro: {error.message}</p>` — parágrafo solto, sem ícone, sem contexto e **sem botão de tentar de novo**. O usuário só pode recarregar a página inteira. Envios é a tela mais usada do dia.
**Causa raiz:** o componente comum chegou depois desta tela e não houve passada para unificar.
**Caminho recomendado:** troque o bloco pelo mesmo desenho de `src/pages/Coletas.tsx:253-268`: `EmptyState` com `variant="error"`, `title` dizendo o que falhou ("Erro ao carregar entregas"), `description={error?.message || "..."}` e `action={{ label: "Tentar de novo", onClick: () => refetch() }}`. Esta tela **já tem** `refetch` disponível (é usada em `:1171`), então o botão é ligável sem mudar a consulta. Acrescente o import de `EmptyState` — o arquivo não o importa hoje. **Atalho tentador a evitar:** usar `EmptyStatePresets.Error` (`src/components/common/EmptyStatePresets.tsx:21-23`) sem passar `title`. O preset diz "Algo deu errado" e não identifica a tela; prefira o `EmptyState` direto com título específico, como Coletas faz. O preset serve quando não há nada específico a dizer.
**Arquivos e objetos a tocar:** `src/pages/Envios.tsx` (`:574` e o import)
**Não tocar / armadilhas:** confirme que o `error` desestruturado nesta tela é o da consulta principal de `["entregas"]` (`:350`) e não de outra; o arquivo é grande e tem mais de uma consulta. Esta tela também é alvo da etapa 084 — PRs separadas.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo e visual. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "text-destructive\">Erro\|EmptyState" src/pages/Envios.tsx
```

Esperado: a linha do parágrafo não existe mais e o `EmptyState` aparece. Com a rede cortada, `/envios` mostra o erro com botão que funciona ao religar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 100 — `Clientes`: erro com componente e botão de tentar de novo

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-01
**Problema hoje:** `src/pages/Clientes.tsx:408-415` mostra um `AlertCircle` solto e `<p className="text-destructive">Erro: {error.message}</p>`, sem ação. E, ao contrário de Envios, **esta tela não desestrutura `refetch`** do `useQuery` (`grep -c refetch src/pages/Clientes.tsx` devolve 0) — o botão de tentar de novo não tem o que chamar ainda.
**Causa raiz:** ver etapa 099.
**Caminho recomendado:** duas linhas, nesta ordem: (1) acrescente `refetch` à desestruturação do `useQuery` da lista de clientes; (2) troque o bloco de `:408-415` pelo `EmptyState` no desenho de `src/pages/Coletas.tsx:253-268`, com `action={{ label: "Tentar de novo", onClick: () => refetch() }}`. O `AlertCircle` importado pode ficar órfão — se ficar, remova o import para não gerar aviso de lint (o orçamento está no teto). **Atalho tentador a evitar:** `onClick: () => window.location.reload()`. Recarrega tudo, perde filtros e estado da tela, e esconde que o problema era só uma consulta.
**Arquivos e objetos a tocar:** `src/pages/Clientes.tsx` (desestruturação do `useQuery`, bloco `:408-415`, imports)
**Não tocar / armadilhas:** esta tela tem as mutations de exclusão lógica que servem de referência para a etapa 065 (`:333-348`) — não encoste nelas. Confira se `AlertCircle` é usado em outro ponto antes de remover o import.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "refetch\|EmptyState\|text-destructive" src/pages/Clientes.tsx
npx eslint src/pages/Clientes.tsx
```

Esperado: `refetch` desestruturado, `EmptyState` no lugar do parágrafo, ESLint limpo. Com a rede cortada, `/clientes` mostra o erro e o botão recarrega a lista ao religar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 101 — `Fornecedores`: erro com componente e botão de tentar de novo

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-01
**Problema hoje:** `src/pages/Fornecedores.tsx:362` — `<p className="text-destructive">Erro: {error.message}</p>`, sem ação, e a tela também **não** desestrutura `refetch`.
**Causa raiz:** ver etapa 099.
**Caminho recomendado:** idêntico à etapa 100: acrescente `refetch` à desestruturação, troque o parágrafo pelo `EmptyState` no desenho de `src/pages/Coletas.tsx:253-268`, com título específico ("Erro ao carregar fornecedores") e botão ligado a `refetch`. Faça em PR própria mesmo sendo igual: telas diferentes, reversões diferentes. **Atalho tentador a evitar:** criar um componente novo do tipo `<ScreenError />` para as cinco telas. Parece economia e é mudança de arquitetura de interface no meio de uma onda de correção; o `EmptyState` já é esse componente, e as cinco etapas existem para convergir **para ele**.
**Arquivos e objetos a tocar:** `src/pages/Fornecedores.tsx` (desestruturação, bloco `:362`, imports)
**Não tocar / armadilhas:** este cadastro é um dos dois que apagam o registro de verdade (D-02) — não toque na exclusão aqui; tem etapa própria.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "refetch\|EmptyState\|text-destructive" src/pages/Fornecedores.tsx
npx eslint src/pages/Fornecedores.tsx
```

Esperado: o mesmo da etapa 100, nesta tela.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 102 — `FretesInternos`: erro com componente e botão de tentar de novo

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-01
**Problema hoje:** `src/pages/FretesInternos.tsx:338` — mesmo parágrafo solto, sem ação; a tela também não desestrutura `refetch`.
**Causa raiz:** ver etapa 099.
**Caminho recomendado:** mesmo procedimento das etapas 100 e 101, com título "Erro ao carregar fretes internos". Antes de ligar o botão, confirme **qual** consulta é a principal da tela: se houver mais de um `useQuery`, o `refetch` do botão deve ser o da lista que a tela mostra — ligar no errado dá um botão que não conserta nada, que é pior que não ter botão. **Atalho tentador a evitar:** chamar `queryClient.invalidateQueries()` sem chave para "atualizar tudo". Invalida a aplicação inteira e dispara um bando de consultas; use o `refetch` da consulta que falhou.
**Arquivos e objetos a tocar:** `src/pages/FretesInternos.tsx` (desestruturação, bloco `:338`, imports)
**Não tocar / armadilhas:** o arquivo tem `createMut`/mutations de criação — alvo possível da etapa 122 (duplo clique). Não misture.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "useQuery\|refetch\|EmptyState\|text-destructive" src/pages/FretesInternos.tsx | head -20
npx eslint src/pages/FretesInternos.tsx
```

Esperado: o botão ligado ao `refetch` da consulta principal, confirmado pelo número da linha da consulta na anotação de progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 103 — `Ocorrencias`: erro com componente e botão de tentar de novo

**Onda / Severidade / Camada:** 2 / Alta / interface
**Achados resolvidos:** R-01
**Problema hoje:** `src/pages/Ocorrencias.tsx:340` — último dos cinco parágrafos soltos (`<p className="text-destructive">Erro: {error.message}</p>`), sem ação; a tela não desestrutura `refetch`.
**Causa raiz:** ver etapa 099.
**Caminho recomendado:** mesmo procedimento, título "Erro ao carregar ocorrências". Esta é a última das cinco telas: feche a etapa com a varredura que prova que o padrão sumiu da base — `grep -rn 'text-destructive">Erro' src/` deve voltar vazio. Se aparecer uma sexta tela (arquivo novo desde `d37ba30`), **não corrija aqui**: registre em "Achados novos". **Atalho tentador a evitar:** deixar esta tela por último e nunca fazer. Ocorrência é onde o cliente reclama; é a tela onde o operador menos pode achar que "não há nada" quando na verdade a consulta falhou.
**Arquivos e objetos a tocar:** `src/pages/Ocorrencias.tsx` (desestruturação, bloco `:340`, imports)
**Não tocar / armadilhas:** esta tela usa `useImageUpload("ocorrencias-fotos")` (`:196`) e dois `<ImageUploader bucket="ocorrencias-fotos">` (`:780`, `:894`) — é a prova de que o bucket está em uso (ver etapa 074). Não mexa nessas linhas.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'text-destructive">Erro' src/ ; echo "saida vazia = padrao eliminado das 5 telas"
npx eslint src/pages/Ocorrencias.tsx
```

Esperado: grep vazio. Com a rede cortada, `/ocorrencias` mostra o erro com botão que funciona ao religar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 104 — Fazer a gravação de preferências de previsão avisar quando falha

**Onda / Severidade / Camada:** 4 / Alta / hook
**Achados resolvidos:** R-06
**Problema hoje:** `src/hooks/logistics/usePredictionAccuracySettings.ts:97` faz `if (error) throw error;` e, logo abaixo, `qc.setQueryData(keyFor(carrier), next)` — ou seja, o hook **lança** o erro e quem chama o descarta (as cinco chamadas da etapa 105-109). Não existe um ponto único onde a falha vire aviso: hoje a responsabilidade está toda no componente, e o componente não a cumpre.
**Causa raiz:** gravação que lança sem nenhum tratamento próprio, deixando o aviso ao cuidado de cinco chamadores diferentes.
**Caminho recomendado:** acrescente o aviso **dentro** do `save`, no padrão do repositório para mutations — `src/hooks/logistics/useLalamoveOrders.tsx:56-57` (`onSuccess` com toast e `onError` com `toast.error(...)` contendo a mensagem). Como `save` é um `useCallback` e não um `useMutation`, o equivalente é envolver o corpo em `try/catch`: no `catch`, `toast.error('Não foi possível salvar: ' + (e as Error).message)` e **relançar** (`throw`), para que quem já trata continue podendo tratar. Importante: o `qc.setQueryData(...)` de `:98` só deve rodar no caminho de sucesso — como hoje ele vem depois do `throw`, isso já está correto; confirme que a sua mudança não o move para antes. Com isso, as cinco etapas seguintes ficam pequenas e seguras: elas só removem o `.catch(() => undefined)` que engole o erro. **Atalho tentador a evitar:** trocar `throw` por `return false` e mandar o componente conferir o retorno. Muda a interface do hook e obriga a mexer nos cinco pontos com lógica nova; o `try/catch` com relançamento não muda contrato nenhum.
**Arquivos e objetos a tocar:** `src/hooks/logistics/usePredictionAccuracySettings.ts` (o corpo de `save`, por volta de `:85-100`)
**Não tocar / armadilhas:** não remova o `throw` — a etapa 105 depende de o erro continuar subindo para o `await`/`catch` do componente. Não mexa no `onConflict: "user_id,transportadora"` (`:95`): é o que faz a gravação ser upsert por usuário e transportadora.
**Depende de:** — · **Libera:** 105, 106, 107, 108, 109
**Risco e como reverter:** passa a aparecer um aviso de erro que hoje não aparece — é o objetivo. Se a gravação falhar com frequência por outro motivo, o aviso vai expor isso (anote como achado novo, não silencie). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '60,100p' src/hooks/logistics/usePredictionAccuracySettings.ts
npx eslint src/hooks/logistics/usePredictionAccuracySettings.ts
```

Esperado: `try/catch` com `toast.error` e `throw` no `catch`, e o `setQueryData` só no sucesso. **Teste real:** com a rede cortada, mexer num campo da tela de previsões deve mostrar o aviso de erro.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 105 — Meta de acurácia e dias de alerta: parar de engolir o erro

**Onda / Severidade / Camada:** 4 / Alta / interface
**Achados resolvidos:** R-06
**Problema hoje:** `src/components/predictions/PredictionAccuracyTimeline.tsx:89` — `settings.save({ target_pct: targetInput, consecutive_days_alert: daysInput }).catch(() => undefined);` dentro de um `useDebouncedEffect` (`:86-93`). O usuário muda a meta, o campo fica com o valor novo na tela e, se a gravação falhar, nada é dito — a tela passa a mostrar o contrário do banco.
**Causa raiz:** `.catch(() => undefined)` usado para evitar "unhandled rejection" em vez de tratar o erro.
**Caminho recomendado:** com a etapa 104 feita, o aviso já sai de dentro do hook; aqui basta **remover** o `.catch(() => undefined)` e deixar a chamada como `void settings.save({...});` — o `void` documenta que a promessa é intencionalmente não aguardada e evita aviso do ESLint, sem engolir nada (o `toast.error` da 104 já cuida). Se preferir manter o `catch`, ele tem de **mostrar** o erro, nunca devolver `undefined`. **Atalho tentador a evitar:** reverter o campo na tela para o valor antigo quando falhar. É o comportamento mais "certo" e exige guardar o valor anterior em estado — mudança maior que o escopo; o aviso já impede o usuário de acreditar que salvou.
**Arquivos e objetos a tocar:** `src/components/predictions/PredictionAccuracyTimeline.tsx` (`:89`)
**Não tocar / armadilhas:** o `useDebouncedEffect` de 600 ms (`:86-93`) existe para não gravar a cada tecla — não mexa no tempo nem nas deps. A condição `if (targetInput !== target || daysInput !== consecutiveAlert)` evita gravação redundante: mantenha.
**Depende de:** 104 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '85,95p' src/components/predictions/PredictionAccuracyTimeline.tsx
npx eslint src/components/predictions/PredictionAccuracyTimeline.tsx
```

Esperado: nenhum `.catch(() => undefined)` nesta linha; ESLint limpo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 106 — Interruptor de aviso por e-mail: parar de engolir o erro

**Onda / Severidade / Camada:** 4 / Alta / interface
**Achados resolvidos:** R-06
**Problema hoje:** `src/components/predictions/PredictionAccuracyTimeline.tsx:180` — `onCheckedChange={(v) => settings.save({ notify_email: v }).catch(() => undefined)}`. O `Switch` é controlado por `settings.data?.notify_email` (`:179`), então, se a gravação falhar, o interruptor **volta sozinho** na próxima leitura — mas sem nenhuma explicação, e no intervalo o usuário vê "ligado".
**Causa raiz:** ver etapa 105.
**Caminho recomendado:** mesma mudança da etapa 105 nesta linha. Aproveite para conferir, **sem alterar**, se o `Switch` reflete o dado do servidor ou um estado local: ele usa `settings.data?.notify_email ?? false`, o que é o desenho certo (a tela segue o banco). Registre essa observação na PR — é a prova de que, com o aviso ligado, o usuário passa a ter informação correta nos dois sentidos. **Atalho tentador a evitar:** transformar o `Switch` em componente de estado local para "responder mais rápido". Isso é o que cria a divergência que o achado descreve.
**Arquivos e objetos a tocar:** `src/components/predictions/PredictionAccuracyTimeline.tsx` (`:180`)
**Não tocar / armadilhas:** o `<Input>` de e-mail logo abaixo tem `disabled={!(settings.data?.notify_email ?? false)}` (`:194`): se você mexer no controle do interruptor, o campo de e-mail trava. Não mexa.
**Depende de:** 104 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '175,185p' src/components/predictions/PredictionAccuracyTimeline.tsx
```

Esperado: sem `.catch(() => undefined)`. **Teste real:** com a rede cortada, ligar o interruptor mostra o aviso de erro.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 107 — Endereço de e-mail do aviso: parar de engolir o erro

**Onda / Severidade / Camada:** 4 / Alta / interface
**Achados resolvidos:** R-06
**Problema hoje:** `src/components/predictions/PredictionAccuracyTimeline.tsx:190` — dentro do `onBlur` do campo de e-mail (`:187-193`), `settings.save({ email: v }).catch(() => undefined);`. O campo usa `defaultValue` (`:186`), não `value`: ele **não** volta ao valor do servidor quando a gravação falha. O usuário digita o e-mail, sai do campo, o e-mail continua escrito na tela e nunca foi salvo.
**Causa raiz:** ver etapa 105, agravada por campo não controlado.
**Caminho recomendado:** remova o `.catch(() => undefined)` como nas etapas anteriores. O campo não controlado é uma fragilidade real, mas **não a corrija aqui**: trocar `defaultValue` por `value` muda o comportamento de digitação do campo e pede teste próprio; registre em "Achados novos" com esta linha como evidência. **Atalho tentador a evitar:** limpar o campo no erro. Apaga o que o usuário escreveu — pior que o problema.
**Arquivos e objetos a tocar:** `src/components/predictions/PredictionAccuracyTimeline.tsx` (`:190`)
**Não tocar / armadilhas:** a condição `if (v !== (settings.data?.email ?? null))` (`:189`) evita gravar quando nada mudou; mantenha. O `.trim() || null` de `:188` transforma vazio em `null` de propósito.
**Depende de:** 104 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '184,196p' src/components/predictions/PredictionAccuracyTimeline.tsx
```

Esperado: sem `.catch(() => undefined)`, e a anotação do campo não controlado registrada no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 108 — Interruptor de aviso por WhatsApp: parar de engolir o erro

**Onda / Severidade / Camada:** 4 / Alta / interface
**Achados resolvidos:** R-06
**Problema hoje:** `src/components/predictions/PredictionAccuracyTimeline.tsx:202` — `onCheckedChange={(v) => settings.save({ notify_whatsapp: v }).catch(() => undefined)}`. É o caso exato do impacto descrito no achado: o usuário liga "me avise por WhatsApp quando a acurácia cair", vê a chave ligada, nada foi salvo, e quando a acurácia cair ninguém é avisado.
**Causa raiz:** ver etapa 105.
**Caminho recomendado:** mesma mudança das etapas 105-107 nesta linha. **Atalho tentador a evitar:** tratar este como "o importante" e deixar os outros quatro. Os cinco são a mesma falha; resolver um e deixar quatro é a receita para o próximo agente achar que o padrão `.catch(() => undefined)` é aceito nesta base.
**Arquivos e objetos a tocar:** `src/components/predictions/PredictionAccuracyTimeline.tsx` (`:202`)
**Não tocar / armadilhas:** não ligue o envio de WhatsApp em si — o envio passa por `evolution-whatsapp`, que tem etapas de autorização próprias (006, 007) e cujo acesso pode mudar. Aqui é só a preferência.
**Depende de:** 104 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '197,207p' src/components/predictions/PredictionAccuracyTimeline.tsx
```

Esperado: sem `.catch(() => undefined)`. Com a rede cortada, ligar o interruptor mostra o aviso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 109 — Telefone de WhatsApp: parar de engolir o erro e fechar o achado

**Onda / Severidade / Camada:** 4 / Alta / interface
**Achados resolvidos:** R-06
**Problema hoje:** `src/components/predictions/PredictionAccuracyTimeline.tsx:212` — último dos cinco: `settings.save({ whatsapp_phone: v }).catch(() => undefined);` no `onBlur` do campo de telefone (`:209-215`), também com `defaultValue` (`:208`).
**Causa raiz:** ver etapa 105.
**Caminho recomendado:** mesma mudança e, por ser a última, feche o achado com a varredura: `grep -rn 'catch(() => undefined)' src/` deve voltar vazio **neste arquivo**; se aparecer em outro arquivo, **não corrija aqui** — registre em "Achados novos" com o caminho, porque o achado R-06 cobre só este componente e qualquer outra ocorrência não foi auditada. **Atalho tentador a evitar:** sair corrigindo todo `.catch(() => undefined)` que a varredura encontrar. Em algum lugar pode ser intencional e correto; cada um precisa ser lido antes.
**Arquivos e objetos a tocar:** `src/components/predictions/PredictionAccuracyTimeline.tsx` (`:212`)
**Não tocar / armadilhas:** o campo é `type="tel"` e grava o texto cru; não acrescente máscara ou validação de telefone aqui — é outra mudança.
**Depende de:** 104 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'catch(() => undefined)' src/components/predictions/PredictionAccuracyTimeline.tsx ; echo "vazio = os 5 resolvidos"
grep -rn 'catch(() => undefined)' src/ | head
```

Esperado: nenhuma ocorrência no componente; as demais, se houver, registradas como achado novo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 110 — Rodonaves: mostrar a falha da sincronização em vez de engoli-la

**Onda / Severidade / Camada:** 4 / Alta / hook
**Achados resolvidos:** R-04
**Problema hoje:** `src/hooks/logistics/useRodonavesTracking.tsx:252-254` — o `onError` do `syncMutation` tem **corpo vazio**, com o comentário `// Fail silently or use internal telemetry`. A sincronização com a transportadora falha e nada aparece na tela; o operador conclui que deu certo.
**Causa raiz:** tratamento de erro declarado e deixado em branco.
**Caminho recomendado:** preencha o `onError` no padrão do repositório — `src/hooks/common/useComments.tsx:91-93` e `src/hooks/logistics/useLalamoveOrders.tsx:57`: `onError: (err: Error) => { toast.error(\`Falha ao sincronizar com Rodonaves: ${err.message}\`); }`. Remova o comentário que descreve o comportamento antigo. Atenção ao contexto: `syncAll` (`:257-260`) abre um `toast.loading("Sincronizando com Rodonaves...")`e chama`mutateAsync`dentro de`try`— confirme como esse`loading`é encerrado no caminho de erro, para o usuário não ficar com "Sincronizando..." eterno junto com a mensagem de falha; se o`toast.dismiss`só acontecer no sucesso, corrija isso **nesta mesma etapa** (é a mesma falha, mesmo fluxo). **Atalho tentador a evitar:** mandar o erro só para a telemetria/Sentry, como o comentário sugere. Telemetria é para quem desenvolve; quem apertou o botão precisa saber na hora.
**Arquivos e objetos a tocar:**`src/hooks/logistics/useRodonavesTracking.tsx` (`:252-254`e, se necessário, o encerramento do toast em`:257-265`)
**Não tocar / armadilhas:** o arquivo tem muitas mutations criadas por `useRodonavesMutation` (`:235-242`) — não mexa nelas; a etapa é só o `syncMutation`. Não altere `invokeRodonaves`.
**Depende de:** — · **Libera:** 111
**Risco e como reverter:** passa a aparecer erro onde hoje não aparece — é o objetivo; pode revelar que a sincronização falha mais do que se imaginava (anote, não silencie). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '244,268p' src/hooks/logistics/useRodonavesTracking.tsx
npx eslint src/hooks/logistics/useRodonavesTracking.tsx
```

Esperado: `onError` com `toast.error` e a mensagem do erro. **Teste real:** dispare a sincronização com a rede cortada — deve aparecer a mensagem de falha e o "Sincronizando..." deve sumir.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 111 — Rodonaves: atualizar a lista de entregas depois de sincronizar

**Onda / Severidade / Camada:** 4 / Alta / hook
**Achados resolvidos:** R-04
**Problema hoje:** `src/hooks/logistics/useRodonavesTracking.tsx:248-251` — o `onSuccess` mostra `${synced} entrega(s) atualizada(s) via Rodonaves` e **não invalida nada**. A edge function grava em `entregas` (`supabase/functions/rodonaves-api/index.ts:1584`, `:1617`), e a tela lê `queryKey: ["entregas"]` (`src/pages/Envios.tsx:350`) — chave que esse fluxo nunca invalida. O operador lê "12 entregas atualizadas", a lista continua com o status antigo e ele liga para a transportadora cobrar algo que já aconteceu. Hoje isso fica **mascarado** pelo tempo real, que é justamente o canal instável de R-02: quando ele para, o dado velho fica na tela.
**Causa raiz:** gravação feita no servidor sem invalidar o cache do cliente.
**Caminho recomendado:** copie `src/hooks/common/useComments.tsx:86-89`: pegue o `queryClient` com `useQueryClient()` (confirme se o hook já o tem; se não, acrescente o import e a chamada no topo do hook) e, no `onSuccess`, antes do toast, `queryClient.invalidateQueries({ queryKey: ["entregas"] })`. Mantenha o toast como está. **Atalho tentador a evitar:** `queryClient.invalidateQueries()` sem chave. Invalida a aplicação inteira e dispara dezenas de consultas numa base que já tem leituras pesadas (P-01); invalide a chave que a função realmente afeta.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useRodonavesTracking.tsx` (`:248-251` e, se faltar, o `useQueryClient` no topo)
**Não tocar / armadilhas:** confirme a chave exata lendo `src/pages/Envios.tsx:350` — se a tela usar chave composta (com filtros), invalidar `["entregas"]` ainda funciona por prefixo, mas registre o que você viu. Não confie no tempo real para suprir a invalidação: é exatamente o que mascara o defeito hoje.
**Depende de:** 110 · **Libera:** 112
**Risco e como reverter:** uma consulta a mais depois de cada sincronização; desprezível. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "useQueryClient\|invalidateQueries" src/hooks/logistics/useRodonavesTracking.tsx
sed -n '345,355p' src/pages/Envios.tsx
```

Esperado: `invalidateQueries` com `["entregas"]` no `onSuccess`. **Teste real:** em `/envios`, dispare a sincronização e confirme que a lista reflete o novo status **sem** recarregar a página e **com** o tempo real desligado (basta recarregar depois de parar o canal, ou observar a aba de rede: deve haver uma consulta nova a `entregas` logo após o sucesso).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 112 — Rodonaves: atualizar também as ocorrências criadas pela sincronização

**Onda / Severidade / Camada:** 4 / Média / hook
**Achados resolvidos:** R-04
**Problema hoje:** além de `entregas`, a mesma edge function **insere em `ocorrencias`** (`supabase/functions/rodonaves-api/index.ts:1632`). Com a etapa 111, a lista de entregas atualiza; a tela de ocorrências continua desatualizada até alguém recarregar — e ocorrência é o que o cliente reclama.
**Causa raiz:** a mesma da etapa 111, numa segunda tabela.
**Caminho recomendado:** acrescente a segunda invalidação no mesmo `onSuccess`, usando a chave real da tela de ocorrências — **leia `src/pages/Ocorrencias.tsx` e copie a chave do `useQuery` de lá**, não invente `["ocorrencias"]` por dedução. Se a tela usar chave composta, invalide pelo prefixo. Mesma forma de `useComments.tsx:86-89`. **Atalho tentador a evitar:** juntar esta invalidação na PR da etapa 111. Separadas, se uma das chaves estiver errada você descobre qual sem reverter as duas.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useRodonavesTracking.tsx` (`onSuccess` do `syncMutation`)
**Não tocar / armadilhas:** não acrescente invalidação de chaves "por garantia" (painel, indicadores). Só as duas tabelas que a função comprovadamente escreve — `entregas` e `ocorrencias`, com as linhas da edge function citadas na PR.
**Depende de:** 111 · **Libera:** —
**Risco e como reverter:** desprezível. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "invalidateQueries" src/hooks/logistics/useRodonavesTracking.tsx
grep -n "queryKey" src/pages/Ocorrencias.tsx | head -5
```

Esperado: duas invalidações, com as chaves conferidas nas telas. **Teste real:** uma sincronização que gere ocorrência nova faz a tela `/ocorrencias` mostrá-la sem recarregar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 113 — Alertas de SLA: avisar quando a gravação da notificação falha

**Onda / Severidade / Camada:** 4 / Alta / hook
**Achados resolvidos:** R-04
**Problema hoje:** `src/hooks/logistics/useSLAAlerts.tsx:96-119` — a mutation `createNotification` insere em `notifications` com `if (error) throw error;` (`:118`) e **não tem `onError` nem `onSuccess`**. Quando a gravação falha, o alerta de SLA simplesmente não existe e ninguém fica sabendo: nem o usuário, nem o log.
**Causa raiz:** mutation escrita só com o caminho feliz.
**Caminho recomendado:** acrescente `onError` no padrão de `src/hooks/common/useComments.tsx:91-93`. Aqui há um cuidado que não existe nas outras etapas: esta mutation é disparada **automaticamente** a partir de um efeito ("Send alerts for critical items (once per session)", `:121-122`), não por clique — um `toast.error` para cada alerta crítico que falhar pode encher a tela. O desenho certo é avisar **uma vez**, com mensagem genérica ("Não foi possível registrar alertas de SLA"), e não por item. Leia o efeito de `:121` antes de escolher onde pôr o aviso: se ele dispara em laço, o aviso vai no laço inteiro, não dentro do `onError` de cada chamada. **Atalho tentador a evitar:** deixar sem aviso "porque é automático". É o alerta de prazo estourado: falhar em silêncio aqui significa entrega atrasada sem ninguém avisado.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useSLAAlerts.tsx` (`:96-119` e o efeito de disparo a partir de `:121`)
**Não tocar / armadilhas:** não altere o conteúdo da notificação (`:99-117`) — o `metadata.event = "sla_alert"` é lido por outros pontos. Não mude o `user_id: user?.id || ""`: se esse valor vazio for um problema, é achado novo, anote.
**Depende de:** — · **Libera:** 114
**Risco e como reverter:** risco de ruído se o aviso for por item — por isso a leitura do efeito faz parte da etapa. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '95,135p' src/hooks/logistics/useSLAAlerts.tsx
npx eslint src/hooks/logistics/useSLAAlerts.tsx
```

Esperado: `onError` presente e o aviso emitido **uma vez** por rodada, não por alerta. Registre quantos alertas críticos havia no teste e quantos avisos apareceram.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 114 — Alertas de SLA: fazer o sino acender sem recarregar

**Onda / Severidade / Camada:** 4 / Alta / hook
**Achados resolvidos:** R-04
**Problema hoje:** `src/hooks/logistics/useSLAAlerts.tsx:96-119` grava em `notifications` e não invalida nada; o sino lê `queryKey: ["notifications", user?.id]` (`src/hooks/notifications/useNotifications.tsx:27`). Alerta de SLA gravado **não aparece** até o usuário recarregar a página — e o mesmo arquivo do sino já invalida essa chave corretamente em três mutations próprias (`useNotifications.tsx:54`, `:70`, `:84`), o que mostra que o padrão existe e só não foi aplicado aqui.
**Causa raiz:** ver etapa 111 — gravação sem invalidação do cache.
**Caminho recomendado:** acrescente `onSuccess` à mutation com `queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] })`, **a chave exata** de `useNotifications.tsx:27` (incluindo o `user?.id`; invalidar só `["notifications"]` também pega por prefixo, mas use a forma que o arquivo do sino já usa, para ficar igual). Pegue o `queryClient` com `useQueryClient()` se o hook ainda não o tiver. Padrão: `useComments.tsx:86-89` e as próprias linhas `:54`, `:70`, `:84` do sino. **Atalho tentador a evitar:** confiar no tempo real do sino. Se houver assinatura de `notifications`, ela é um dos canais instáveis de R-02 — a invalidação explícita é o que garante o aviso.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useSLAAlerts.tsx` (`onSuccess` da mutation e, se faltar, `useQueryClient` no topo)
**Não tocar / armadilhas:** não toque em `src/hooks/notifications/useNotifications.tsx` — ele já está certo e é a referência. Confirme que `user` está disponível neste hook (ele já usa `user?.id` em `:99`), para a chave sair idêntica.
**Depende de:** 113 · **Libera:** —
**Risco e como reverter:** desprezível. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "invalidateQueries\|useQueryClient" src/hooks/logistics/useSLAAlerts.tsx
sed -n '25,30p' src/hooks/notifications/useNotifications.tsx
```

Esperado: a mesma chave dos dois lados. **Teste real:** force um alerta crítico de SLA e confirme que o contador do sino sobe **sem** recarregar a página; registre o horário e o id da notificação criada.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 115 — Nexus Blast: contar só as cotações que voltaram

**Onda / Severidade / Camada:** 4 / Média / interface
**Achados resolvidos:** R-03
**Problema hoje:** `src/pages/CotacaoMultiCanal.tsx:321-326` — dentro do laço que cota com cada transportadora, o `catch` faz só `console.error(...)` e o laço segue para `completed++` (`:327`) e `setBlastProgress(Math.round((completed / total) * 100))` (`:328`). A barra chega a 100% com zero cotações obtidas, e o final ainda diz `toast.success("Nexus Blast concluído!...")` (`:331-333`) independentemente do resultado.
**Causa raiz:** contador de progresso que mede tentativas, não sucessos, e mensagem final que não olha o resultado.
**Caminho recomendado:** separe os dois números: mantenha `completed` como "quantas transportadoras já foram tentadas" (é o que a barra de progresso deve mostrar — a barra mede andamento, e está certa) e acrescente `succeeded` e `failed`, incrementados no fim do `try` e dentro do `catch`. Troque o toast final por uma mensagem que use esses números: sucesso quando `failed === 0`, e `toast.warning`/`toast.error` quando houver falhas, dizendo quantas de quantas deram certo. Guarde as falhas numa lista (nome da transportadora + mensagem) — a etapa 116 usa essa lista. **Atalho tentador a evitar:** fazer a barra parar antes de 100% quando há falha. A barra indica andamento e tem de chegar ao fim; o que precisa mudar é a **mensagem**, não a barra.
**Arquivos e objetos a tocar:** `src/pages/CotacaoMultiCanal.tsx` (o laço em torno de `:300-333`)
**Não tocar / armadilhas:** o `catch` cobre dois caminhos diferentes no laço (transportadora com API e transportadora por e-mail, `:290-320`) — confirme os dois antes de contar, para não marcar como falha o envio de e-mail que deu certo. Não remova o `console.error`: ele é a única pista hoje (e `validate:no-console` vale para edge functions, não para `src/`).
**Depende de:** — · **Libera:** 116
**Risco e como reverter:** o usuário passa a ver aviso de falha onde antes via sucesso — é o objetivo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '280,335p' src/pages/CotacaoMultiCanal.tsx
npx eslint src/pages/CotacaoMultiCanal.tsx
```

Esperado: contadores separados e mensagem final condicionada ao resultado. **Teste real:** dispare o blast com a rede cortada — a barra chega a 100% e a mensagem final diz que **nenhuma** cotação voltou.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 116 — Nexus Blast: dizer **quais** transportadoras falharam

**Onda / Severidade / Camada:** 4 / Média / interface
**Achados resolvidos:** R-03
**Problema hoje:** mesmo com a contagem da etapa 115, o usuário saberá que 7 de 10 falharam e não **quais**. Ele segue para a decisão de frete sem saber se a transportadora que faltou é a mais barata ou a irrelevante.
**Causa raiz:** o erro por transportadora morre no `console.error`.
**Caminho recomendado:** use a lista de falhas montada na etapa 115 para mostrá-las na própria tela, junto dos resultados — a tela já exibe as cotações obtidas, então acrescente as falhas no mesmo lugar, com o nome da transportadora e o motivo resumido. Se a tela tiver um componente de lista de resultados, acrescente uma seção; se não, use `EmptyState` não serve aqui (não é estado vazio) — prefira um bloco simples com os nomes, no estilo visual que o arquivo já usa. **Atalho tentador a evitar:** só pôr os nomes no `toast`. O toast some em segundos e o usuário está no meio de uma decisão de frete que leva minutos; a informação precisa ficar na tela.
**Arquivos e objetos a tocar:** `src/pages/CotacaoMultiCanal.tsx` (estado da lista de falhas e o trecho que renderiza os resultados)
**Não tocar / armadilhas:** o achado C-02 diz que esta tela **não lê nem grava no banco** — a negociação vive na memória do navegador. Portanto a lista de falhas também some ao recarregar, e isso é esperado nesta etapa; **não** tente persistir nada aqui: a persistência da cotação é outro achado, com decisão de modelo de dados.
**Depende de:** 115 · **Libera:** —
**Risco e como reverter:** visual, baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "falha\|failed\|erro" src/pages/CotacaoMultiCanal.tsx | head -20
```

Esperado: a lista de falhas renderizada. **Teste real:** com uma transportadora configurada com credencial inválida (ou a rede cortada), o blast termina mostrando o nome dela entre as que falharam.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 117 — Importação em massa: guardar a mensagem de erro de cada lote

**Onda / Severidade / Camada:** 4 / Média / interface
**Achados resolvidos:** R-07
**Problema hoje:** `src/pages/ImportacaoMassa.tsx:153-158` — `const { error } = await supabase.from(entity).insert(batch as never[]); if (error) { errorCount += batch.length; }`. O `error` do banco, que diz **qual** linha e **por quê** (o PostgREST devolve `message`, `details` e `hint`), é descartado na hora.
**Causa raiz:** erro capturado e não guardado.
**Caminho recomendado:** no `if (error)`, antes de somar o contador, empilhe o erro numa lista local do laço: o índice do lote (`i`), o intervalo de linhas (`i+1` a `i+batch.length`) e `error.message` mais `error.details`. Nesta etapa **só guardar e contar** — nenhuma mudança visual, para a PR ser pequena e verificável por typecheck. A exibição é a etapa 119 e a contagem por linha é a 118. **Atalho tentador a evitar:** mostrar `error.message` cru num toast aqui. A mensagem do PostgREST é técnica ("duplicate key value violates unique constraint…") e, sem o número da linha, não ajuda quem vai corrigir a planilha — a etapa 119 trata disso.
**Arquivos e objetos a tocar:** `src/pages/ImportacaoMassa.tsx` (dentro do laço, por volta de `:151-162`)
**Não tocar / armadilhas:** não mude o `batchSize = 50` (`:148`) nem o cálculo de progresso (`:160-161`). Não registre o **conteúdo** das linhas no erro guardado: a planilha pode ter dado pessoal de cliente (LGPD) — guarde números de linha e a mensagem, não os valores.
**Depende de:** — · **Libera:** 118, 119
**Risco e como reverter:** nenhum comportamento muda. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '145,170p' src/pages/ImportacaoMassa.tsx
npx eslint src/pages/ImportacaoMassa.tsx
```

Esperado: a lista de erros sendo preenchida e nenhuma mudança na tela.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 118 — Importação em massa: parar de condenar o lote inteiro por causa de uma linha

**Onda / Severidade / Camada:** 4 / Média / interface
**Achados resolvidos:** R-07
**Problema hoje:** `src/pages/ImportacaoMassa.tsx:156` — `errorCount += batch.length;`. Como o `insert` é de 50 linhas de uma vez e o Postgres aborta a instrução inteira na primeira violação, **uma** linha inválida marca 50 como erro. Numa planilha de 500 linhas com 1 erro, o usuário lê "50 falharam" e refaz a planilha inteira.
**Causa raiz:** inserção em lote sem caminho de reprocessamento individual.
**Caminho recomendado:** quando o lote falhar — **e só então** — reprocesse aquele lote linha a linha, somando `successCount` e `errorCount` de verdade e guardando, por linha que falhar, o número da linha e a mensagem (a lista da etapa 117). O caminho feliz continua rápido (um `insert` de 50); o caminho de erro fica mais lento e **correto**, que é o que importa quando já deu errado. Mantenha o `batchSize = 50`. **Atalho tentador a evitar:** inserir sempre linha a linha "para simplificar". Uma planilha de 5.000 linhas viraria 5.000 requisições; o lote existe por um motivo.
**Arquivos e objetos a tocar:** `src/pages/ImportacaoMassa.tsx` (o bloco `if (error)` do laço)
**Não tocar / armadilhas:** o número da linha mostrado ao usuário tem de ser o da **planilha** (incluindo o cabeçalho, se houver), não o índice do array — confira como `data` é montado antes de chegar aqui, senão você entrega um número que não bate com o arquivo dele e piora a situação. Não reordene `data`.
**Depende de:** 117 · **Libera:** 119
**Risco e como reverter:** importação com muitos erros fica mais lenta; aceitável. Risco real: inserir duas vezes a mesma linha se o reprocessamento não pular as que já entraram — como o lote inteiro foi abortado pelo Postgres, **nenhuma** linha do lote entrou, então reprocessar o lote todo é seguro; confirme isso na sua implementação. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '145,175p' src/pages/ImportacaoMassa.tsx
```

Esperado: reprocessamento individual só no caminho de erro. **Teste real:** importe uma planilha de teste com 10 linhas boas e 1 ruim num mesmo lote — o resultado tem de ser 10 sucessos e 1 erro, não 11 erros. Registre os números.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 119 — Importação em massa: mostrar e exportar as linhas que falharam

**Onda / Severidade / Camada:** 4 / Média / interface
**Achados resolvidos:** R-07
**Problema hoje:** mesmo com as etapas 117 e 118, o usuário vê só números. Ele precisa saber **quais** linhas corrigir para reimportar só o que faltou — hoje ele refaz a planilha inteira ou desiste.
**Causa raiz:** resultado da importação resumido a dois contadores.
**Caminho recomendado:** na etapa final da importação (passo "Finalizado", `:136`), liste as linhas que falharam com número e motivo, e ofereça um botão para baixar essa lista em CSV. **Reaproveite o que já existe**: `src/hooks/common/useExport.tsx` (`exportToCSV`) é usado em `src/pages/Coletas.tsx:330-332` e resolve o download sem código novo. Limite a lista exibida na tela (por exemplo as 50 primeiras) e mande todas no CSV, senão uma planilha ruim de 5.000 linhas trava a tela. **Atalho tentador a evitar:** gerar o CSV à mão com `Blob` e `URL.createObjectURL`. Já existe utilitário no repositório; escrever outro cria dois jeitos de exportar.
**Arquivos e objetos a tocar:** `src/pages/ImportacaoMassa.tsx` (tela do passo final + botão de exportar)
**Não tocar / armadilhas:** o CSV de falhas **não** deve conter os dados das linhas (LGPD) — só número da linha e motivo, como a etapa 117 definiu. Não altere `useExport.tsx`.
**Depende de:** 117, 118 · **Libera:** —
**Risco e como reverter:** visual. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "useExport\|exportToCSV" src/pages/ImportacaoMassa.tsx
```

Esperado: a lista na tela e o botão de download funcionando. **Teste real:** com a planilha da etapa 118, baixar o CSV e conferir que ele traz a linha errada e o motivo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 120 — Importação em massa: decidir se o histórico deve sobreviver à tela

**Onda / Severidade / Camada:** 4 / Média / banco + interface
**Achados resolvidos:** R-07
**Problema hoje:** `src/pages/ImportacaoMassa.tsx:127` — `const [history, setHistory] = useState<ImportStats[]>([]);`. O histórico de importações vive em estado de componente: sai da tela, some. Ninguém consegue responder depois "o que foi importado ontem e quantas linhas falharam".
**Causa raiz:** histórico tratado como estado de interface, não como registro da operação.
**Caminho recomendado:** esta etapa **começa perguntando**, porque a correção certa é uma tabela nova e isso é decisão do dono. Leve a pergunta decidida: "o histórico de importações precisa ficar guardado?" — com o custo (uma tabela pequena, com RLS no padrão `SECURITY DEFINER` do ADR `docs/adr/0014-security-definer-rls-pattern.md`) e o ganho (auditoria de quem importou o quê). **Antes de propor a tabela, consulte o banco ao vivo**: pode já existir uma tabela de importações ou de auditoria onde esse registro caiba (`select table_name from information_schema.tables where table_schema='public' and table_name ilike '%import%';`) — se existir, use-a e a etapa deixa de ter DDL. Se o dono aprovar a tabela nova, escreva a migration em `supabase/migrations/`, abra a PR e **não mergeie**. Se o dono disser que não precisa, registre isso em `05-PROGRESSO.md` e feche a etapa sem mudança — é um resultado válido. **Atalho tentador a evitar:** guardar o histórico em `localStorage`. Fica no navegador de uma pessoa, não é auditoria, e dá a falsa impressão de que o problema foi resolvido.
**Arquivos e objetos a tocar:** uma migration nova em `supabase/migrations/` e `src/pages/ImportacaoMassa.tsx` (gravação e leitura), **apenas** se aprovado
**Não tocar / armadilhas:** não crie tabela sem RLS — toda tabela nova neste banco precisa de RLS no padrão do ADR 0014, e há achado aberto (F-02) sobre tabelas que receberam política sem ter RLS habilitado. Não há staging: a migration vai direto para produção quando o dono mergear.
**Depende de:** 119 · **Libera:** —
**Risco e como reverter:** DDL em produção; reverter exige migration inversa. Por isso a PR fica aberta.
**Precisa de aprovação humana antes do merge:** sim (DDL/migration em produção e custo de armazenamento)
**Como verificar:** a consulta ao banco registrada em `05-PROGRESSO.md` (existe tabela adequada? sim/não), a decisão do dono com data, e o link da PR. Se implementado: uma importação de teste grava uma linha, e a tela mostra o histórico depois de recarregar a página.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 121 — VERIFICAR se o duplo clique cria registro duplicado (o achado é hipótese)

**Onda / Severidade / Camada:** 4 / Média / interface
**Achados resolvidos:** R-05
**Problema hoje:** o achado R-05 é **HIPÓTESE — NÃO VERIFICADO**: a auditoria não encontrou um padrão consistente de `disabled={mutation.isPending}` nos formulários de criação, mas nada foi executado, então **não se pode afirmar** que o duplo clique duplica. Há evidência nos dois sentidos: `grep -rn "disabled={.*isPending" src/ | wc -l` devolve **59** ocorrências (o padrão existe e é usado), e o `PickupDialog` protege o envio com `disabled={loading}` (`src/components/coletas/PickupDialog.tsx:463`, com `loading` em `:69`). Esta etapa **não muda código**: ela decide se a 122 existe.
**Causa raiz:** a verificar.
**Caminho recomendado:** monte a lista dos formulários de criação e verifique um por um, do mais crítico para o menos: comece por `src/components/coletas/PickupDialog.tsx` (coleta) e pelas telas que têm mutation de criação — `src/pages/Envios.tsx`, `src/pages/Clientes.tsx`, `src/pages/Fornecedores.tsx`, `src/pages/FretesInternos.tsx`, `src/pages/Ocorrencias.tsx`, `src/pages/AdminADR.tsx` (saída de `grep -rln "createMut\|createMutation" src/pages/ src/components/`). Para cada um, responda duas coisas com o número da linha: (a) o botão de envio tem `disabled` ligado ao estado da mutação? (b) o `onSubmit` tem guarda contra reentrada? Depois **confirme no navegador** nos dois ou três mais críticos: clique duas vezes rápido no botão e consulte o banco para ver se nasceram dois registros (`select count(*), numero_coleta from coletas where created_at > now() - interval '2 minutes' group by 2 having count(*) > 1;`). Registre a tabela "tela → protegido/desprotegido → evidência" em `05-PROGRESSO.md`. Se **todos** estiverem protegidos, escreva isso e **corrija o achado R-05 em `docs/qa/03-ACHADOS.md`** no mesmo PR, marcando-o como não confirmado. **Atalho tentador a evitar:** sair acrescentando `disabled={...isPending}` em todo formulário "já que não custa nada". Custa: mexe em dezenas de arquivos sem defeito provado, infla o diff e pode desabilitar botão que depende de outro estado.
**Arquivos e objetos a tocar:** nenhum código; `05-PROGRESSO.md` e, se a hipótese cair, `docs/qa/03-ACHADOS.md`
**Não tocar / armadilhas:** faça o teste de duplo clique com **dado de teste identificável** (nome com prefixo "TESTE-"), e apague/marque depois — você vai estar criando registros em produção, já que não há staging. F-03 diz que a unicidade de número de coleta/entrega não pôde ser confirmada, então duas criações podem até receber o mesmo número: é exatamente isso que você quer observar.
**Depende de:** — · **Libera:** 122
**Risco e como reverter:** cria registros de teste em produção — use prefixo identificável e remova (exclusão lógica) ao final; registre os ids.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "disabled={.*isPending\|disabled={loading" src/pages/ src/components/ | wc -l
grep -rln "createMut\|createMutation" src/pages/ src/components/
```

Esperado: a tabela "tela → protegido/desprotegido → arquivo:linha" registrada, mais o resultado do teste de duplo clique nas telas críticas, com os ids criados.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 122 — Fechar os formulários que a etapa 121 encontrou desprotegidos

**Onda / Severidade / Camada:** 4 / Média / interface
**Achados resolvidos:** R-05
**Problema hoje:** depende do resultado da etapa 121. **Se a 121 concluiu que todos estão protegidos, esta etapa não existe**: marque-a como "não aplicável" no progresso, com a referência à verificação, e siga. Execute-a apenas para os formulários que a 121 listou como desprotegidos, com `arquivo:linha`.
**Causa raiz:** botão de envio que continua clicável enquanto a gravação está em andamento.
**Caminho recomendado:** para cada formulário desprotegido, o padrão já é o da casa e aparece 59 vezes na base: `disabled={mutation.isPending}` no botão de envio, com o mesmo indicador visual que `src/components/coletas/PickupDialog.tsx:463-467` usa (`disabled={loading}` + `Loader2` girando). Onde o envio não for `useMutation` e sim função `async` com estado próprio, use o estado que já existir (como o `loading` do `PickupDialog`), não crie outro. **Uma PR por formulário**, cada uma citando a evidência da 121. **Atalho tentador a evitar:** resolver com "debounce" no clique. Esconde o segundo clique por tempo em vez de amarrar ao estado real da gravação; se a gravação demorar mais que o tempo escolhido, o problema volta.
**Arquivos e objetos a tocar:** só os formulários nomeados pela etapa 121
**Não tocar / armadilhas:** não desabilite o botão por um estado que nunca volta a `false` em caso de erro — confira que o `finally`/`onSettled` reabilita, senão o usuário fica travado depois de uma falha (que é pior que o duplo clique). Teste o caminho de erro, não só o de sucesso.
**Depende de:** 121 · **Libera:** —
**Risco e como reverter:** baixo, se o caminho de erro reabilitar o botão. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "disabled={.*isPending\|disabled={loading" <arquivos listados na etapa 121>
```

Esperado: cada formulário corrigido com o `disabled` ligado ao estado da gravação. **Teste real:** repetir o duplo clique da etapa 121 na mesma tela e confirmar que nasce **um** registro; e forçar um erro para confirmar que o botão volta a funcionar.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 123 — `useSLANotifications`: cancelar os cinco temporizadores de aviso e de som

**Onda / Severidade / Camada:** 5 / Baixa / hook
**Achados resolvidos:** R-08
**Problema hoje:** cinco `setTimeout` sem referência nem cancelamento, em duas funções de módulo do arquivo `src/hooks/logistics/useSLANotifications.tsx`: `:66` (`setTimeout(() => notification.close(), 30000)`, dentro de `showBrowserNotification`, que vai de `:42` a `:72`) e `:97`, `:101`, `:105`, `:115` (a sequência que muda a frequência do oscilador e depois o para, dentro de `playAlertSound`, `:80-123`). O hook `useSLANotifications` (`:125`) chama `playAlertSound` em `:243`. Se o usuário sair da tela no meio, os temporizadores continuam e o som/aviso acontece fora de hora.
**Causa raiz:** temporizadores criados em funções soltas, sem dono que os cancele.
**Caminho recomendado:** **atenção, o padrão de referência não se aplica direto aqui**, e é por isso que esta etapa é a primeira do grupo: `src/hooks/system/useNexusHealth.ts:82-89` limpa timeout e interval no `return` de um `useEffect`, mas estes cinco temporizadores nascem em **funções de módulo**, fora de qualquer hook — não há `useEffect` onde pendurar o cleanup. O caminho correto é o segundo padrão citado no achado, `src/hooks/logistics/useBusinessRuleEngine.tsx:31-33`: o timer vive num `ref` e é cancelado antes de reagendar. Aplicado aqui: faça `showBrowserNotification` e `playAlertSound` **devolverem** os ids criados (ou um `cancel()`), e no hook `useSLANotifications` guarde-os num `useRef` de lista, cancelando todos num `useEffect(() => () => { ... }, [])` no desmonte. Comece por `playAlertSound`, que é a sequência de quatro e a que mais incomoda (som fora de hora). **Atalho tentador a evitar:** transformar as duas funções de módulo em hooks para "poder usar `useEffect`". Mexeria em `:243` e em todo o fluxo de alerta — muito mais que o problema, que o próprio achado classifica como ruído.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useSLANotifications.tsx` (`showBrowserNotification` em `:42-72`, `playAlertSound` em `:80-123`, e o hook em `:125` para o cleanup)
**Não tocar / armadilhas:** não mexa na frequência, no ganho nem na duração do oscilador (`:95-121`) — é o som que a operação reconhece. O `AudioContext` é fechado em `:105-106` e `:115-116`: se você cancelar o timeout que fecha, o contexto fica aberto — o `cancel()` precisa **fechar** o contexto, não só cancelar o timer. Esta é a parte da etapa que exige cuidado de verdade.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** se o cancelamento fechar o `AudioContext` no meio de um alerta legítimo, o som corta. Teste ouvindo um alerta completo antes de mergear. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '42,72p' src/hooks/logistics/useSLANotifications.tsx
sed -n '80,125p' src/hooks/logistics/useSLANotifications.tsx
npx eslint src/hooks/logistics/useSLANotifications.tsx
```

Esperado: nenhum `setTimeout` sem id guardado, e um cleanup no hook. **Teste real:** dispare um alerta crítico e saia da tela imediatamente — o som não deve continuar nem aparecer aviso depois; e um alerta ouvido até o fim deve soar completo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 124 — `useOnboarding`: cancelar o temporizador da notificação de conquista

**Onda / Severidade / Camada:** 5 / Baixa / hook
**Achados resolvidos:** R-08
**Problema hoje:** `src/hooks/ui/useOnboarding.tsx:190-200` — `setTimeout(() => { showAchievementNotification({...}) }, 2000)` dentro de um callback, sem referência nem cancelamento. É o caso que o achado cita como visível: o usuário termina o onboarding, sai da tela, e dois segundos depois a notificação de conquista aparece fora de hora.
**Causa raiz:** ver etapa 123.
**Caminho recomendado:** aqui o padrão de referência **se aplica direto**: `src/hooks/logistics/useBusinessRuleEngine.tsx:31-33` guarda o timer num `useRef` e cancela antes de reagendar; e `src/hooks/system/useNexusHealth.ts:82-89` mostra o `clearTimeout` no `return` do efeito. Faça os dois: um `achievementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)`, atribua o `setTimeout` a ele (cancelando o anterior antes), e acrescente um `useEffect(() => () => { if (achievementTimerRef.current) clearTimeout(achievementTimerRef.current); }, [])` no hook. **Atalho tentador a evitar:** remover o atraso de 2 s e chamar a notificação na hora. O atraso existe para a conquista não competir com o `toast.success` de XP que vem logo depois (`:203-205`); tirar isso muda a experiência.
**Arquivos e objetos a tocar:** `src/hooks/ui/useOnboarding.tsx` (`:190-200`, mais o `ref` e o efeito de cleanup)
**Não tocar / armadilhas:** o hook importa `useGamification` (`:5`, `:80`) — assunto das etapas 080-081; não encoste. Não mexa no `toast.success` de `:203`.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '185,208p' src/hooks/ui/useOnboarding.tsx
npx eslint src/hooks/ui/useOnboarding.tsx
```

Esperado: o timer num `ref` e cancelado no desmonte. **Teste real:** conclua o onboarding e troque de tela imediatamente — a notificação de conquista **não** deve aparecer depois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 125 — `useAchievementNotifications`: cancelar o auto-descarte da notificação

**Onda / Severidade / Camada:** 5 / Baixa / hook
**Achados resolvidos:** R-08
**Problema hoje:** `src/hooks/gamification/useAchievementNotifications.tsx:42-44` — `setTimeout(() => { setNotifications((prev) => prev.filter(...)) }, 5000)` dentro do callback que mostra a conquista. Chamar `setNotifications` depois do desmonte é o que produz o aviso no console que o achado menciona.
**Causa raiz:** ver etapa 123.
**Caminho recomendado:** mesmo desenho da etapa 124: lista de timers num `useRef`, cada `setTimeout` registrado nela, e um `useEffect` de cleanup no desmonte cancelando todos — lista, e não um timer só, porque várias conquistas podem ser mostradas em sequência e cada uma agenda o seu próprio descarte. Padrão: `useBusinessRuleEngine.tsx:31-33` (timer em `ref`) somado ao `return` de cleanup de `useNexusHealth.ts:85-88`. **Atalho tentador a evitar:** trocar o auto-descarte por uma biblioteca de toast com duração. O componente de notificação de conquista é próprio (tem raridade, XP, moedas); substituí-lo é refatoração de interface, não cancelamento de timer.
**Arquivos e objetos a tocar:** `src/hooks/gamification/useAchievementNotifications.tsx` (`:42-44`, mais o `ref` e o efeito)
**Não tocar / armadilhas:** `dismissNotification` (`:47-49`) já remove por `id`, enquanto o timer remove por `timestamp` (`:43`) — não "unifique" os dois critérios nesta etapa; só cancele o timer. Se achar que o critério divergente é um defeito, anote em "Achados novos".
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '35,52p' src/hooks/gamification/useAchievementNotifications.tsx
npx eslint src/hooks/gamification/useAchievementNotifications.tsx
```

Esperado: timers guardados e cancelados no desmonte. **Teste real:** com o console aberto, dispare uma conquista e troque de tela antes dos 5 s — nenhum aviso de atualização de estado após desmonte.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 126 — `useImportData`: cancelar o reset de dois segundos

**Onda / Severidade / Camada:** 5 / Baixa / hook
**Achados resolvidos:** R-08
**Problema hoje:** `src/hooks/common/useImportData.ts:189-193` — depois de uma importação bem-sucedida, `setTimeout(() => { setStatus('idle'); setResult(null); setProgress(0); }, 2000)`, sem referência nem cancelamento. Três atualizações de estado agendadas que podem rodar com o componente já desmontado.
**Causa raiz:** ver etapa 123.
**Caminho recomendado:** timer num `useRef`, cancelado antes de reagendar e no cleanup de um `useEffect` do hook — padrão `useBusinessRuleEngine.tsx:31-33` + `useNexusHealth.ts:85-88`. Cancelar antes de reagendar importa aqui: duas importações em sequência agendariam dois resets, e o primeiro zeraria o progresso da segunda. **Atalho tentador a evitar:** resetar na hora, sem atraso. Os 2 s existem para o usuário ler a mensagem de sucesso (`:186`) antes de a tela limpar.
**Arquivos e objetos a tocar:** `src/hooks/common/useImportData.ts` (`:189-193`, mais o `ref` e o efeito de cleanup)
**Não tocar / armadilhas:** não toque no `catch` de `:194-196` nem no `toast.error` dele. Confirme se este hook é usado pela tela da etapa 117 (`ImportacaoMassa`) ou por outra — `grep -rn "useImportData" src/` — e cite na PR, porque o teste real tem de ser feito na tela que o usa.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '183,198p' src/hooks/common/useImportData.ts
grep -rn "useImportData" src/ | grep -v "src/hooks/common/useImportData.ts"
npx eslint src/hooks/common/useImportData.ts
```

Esperado: timer em `ref`, cancelado nos dois pontos. **Teste real:** importe e saia da tela antes dos 2 s, com o console aberto — sem aviso de estado após desmonte.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 127 — `useDocumentUpload` e `useSecurityPushNotifications`: os dois últimos temporizadores

**Onda / Severidade / Camada:** 5 / Baixa / hooks
**Achados resolvidos:** R-08
**Problema hoje:** dois `setTimeout` de uma linha, da mesma forma, fechando a lista dos dez: `src/hooks/data/useDocumentUpload.ts:111` — `setTimeout(() => setProgress(0), 1000)` no `finally` do upload; e `src/hooks/notifications/useSecurityPushNotifications.tsx:111` — `setTimeout(() => notification.close(), 10000)` para fechar aviso não crítico. Vão juntos porque são idênticos em forma e risco (uma linha, sem estado compartilhado), e separá-los daria duas PRs de três linhas cada.
**Causa raiz:** ver etapa 123.
**Caminho recomendado:** em `useDocumentUpload.ts:111`, timer num `useRef` cancelado no cleanup de um `useEffect` do hook (padrão `useNexusHealth.ts:85-88`), cancelando também antes de reagendar — dois uploads seguidos agendariam dois resets de progresso. Em `useSecurityPushNotifications.tsx:111`, o mesmo, com uma lista em `ref` (pode haver vários avisos abertos); note que o `catch` logo abaixo (`:113-115`) engole erro de notificação de propósito, com comentário explicando — **não** mexa nisso, é outro assunto. Feche a etapa com a varredura que prova que o achado R-08 acabou: liste os `setTimeout` de `src/` e confira que os que sobraram são os quatro legítimos nomeados no achado A-08 (`useDeliveryRoutes.tsx:256`, `useGeocoding.tsx:75`, `CircuitBreaker.ts:39`, `BiometricConsentModal.tsx:66`) mais os que já têm `clearTimeout`. **Atalho tentador a evitar:** sair pondo `clearTimeout` em todo `setTimeout` que a varredura mostrar. O achado é específico: `setTimeout` criado **dentro de callback**, sem referência; os de `useEffect` com cleanup já estão corretos e todos os `setInterval` do repositório já têm `clearInterval`.
**Arquivos e objetos a tocar:** `src/hooks/data/useDocumentUpload.ts` (`:111` + `ref` e efeito), `src/hooks/notifications/useSecurityPushNotifications.tsx` (`:111` + `ref` e efeito)
**Não tocar / armadilhas:** em `useDocumentUpload.ts`, não mexa na validação de `:42-63` (etapas 078 e 079) nem no `catch` de `:105-108`. Em `useSecurityPushNotifications.tsx`, não mexa no `window.location.href = '/seguranca'` de `:105` nem na condição `event.severity !== 'critical'` de `:110`: aviso crítico **não** deve fechar sozinho.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '105,118p' src/hooks/data/useDocumentUpload.ts
sed -n '105,118p' src/hooks/notifications/useSecurityPushNotifications.tsx
grep -rn "setTimeout" src/hooks/ | grep -v clearTimeout
```

Esperado: os dois temporizadores com id guardado, e a lista final contendo apenas os casos legítimos, nomeados na anotação de progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 128 — `useBoxManagement`: canal de tempo real com nome único

**Onda / Severidade / Camada:** 5 / Média / hook
**Achados resolvidos:** R-09
**Problema hoje:** `src/hooks/logistics/useBoxManagement.tsx:87` — `supabase.channel("box-realtime")`, nome fixo global. O próprio repositório documenta o risco em `src/hooks/data/useRealtime.tsx:22-24`: _"O supabase-js reusa o canal pelo 'topic': dois hooks ouvindo a mesma tabela com o mesmo tópico fazem `.on()` após `.subscribe()` e estouram a página"_ — e resolve com `topicRef = useRef(hookInstanceId())` (`:94`). Se a tela de boxes aparecer duas vezes (duas abas, ou dois componentes montados), uma das duas para de receber atualização em silêncio.
**Causa raiz:** nome de canal fixo em vez de único por instância.
**Caminho recomendado:** o padrão mais simples e já usado nesta base é nomear por usuário, como `src/features/db-observability/hooks/useDbRegressionAlerts.ts:17` faz (`` `db-regression-alerts-${user.id}` ``) — este hook já tem `user?.id` disponível (usa em `:81`, `enabled: !!user?.id`), então use `` `box-realtime-${user.id}` ``. Isso resolve o caso de dois usuários; **para duas montagens do mesmo usuário**, que é o caso descrito no achado, o nome por usuário não basta: aí o padrão é o de `useRealtime.tsx:94`, um sufixo único por instância guardado em `useRef`. Escolha pelo que a tela faz: se o componente pode aparecer duas vezes na mesma sessão, use o sufixo por instância; se não, o `user.id` basta. Diga na PR qual escolheu e por quê. **Atalho tentador a evitar:** trocar este `useEffect` inteiro pelo hook `useRealtime`. É a solução "certa" no longo prazo e é mudança de arquitetura no meio de uma correção de nome de canal — e o `useRealtime` só acabou de ser estabilizado (etapa 083).
**Arquivos e objetos a tocar:** `src/hooks/logistics/useBoxManagement.tsx` (`:85-96`)
**Não tocar / armadilhas:** confirme que existe `supabase.removeChannel` no `return` deste `useEffect` — se **não** existir, acrescente, porque nome único sem remoção no desmonte vaza um canal por montagem, trocando um problema por outro. Não altere o filtro do `postgres_changes` (`:89-91`) nem o `refetch()`.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '84,100p' src/hooks/logistics/useBoxManagement.tsx
```

Esperado: nome de canal com sufixo único e `removeChannel` no cleanup. **Teste real:** abra a tela de boxes em **duas abas** e altere uma entrega — as duas abas devem atualizar. Registre o resultado (hoje, uma delas não atualiza).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 129 — `useMapWeatherSync`: canal de zonas de risco com nome único

**Onda / Severidade / Camada:** 5 / Média / hook
**Achados resolvidos:** R-09
**Problema hoje:** `src/hooks/logistics/useMapWeatherSync.ts:49` — `supabase.channel('risk-zones-changes')`, nome fixo global, num `useEffect` com deps `[]` (`:58`). O cleanup remove o canal (`:55-57`), o que está correto; o problema é só o nome.
**Causa raiz:** ver etapa 128.
**Caminho recomendado:** mesma decisão da etapa 128, com uma diferença importante: este hook **não** tem `user` à mão (o efeito roda com deps vazias e só chama `fetchRiskZones`), então o caminho barato é o sufixo único por instância, no padrão de `src/hooks/data/useRealtime.tsx:94` — um `useRef` com um identificador gerado na montagem, usado no nome do canal. Não introduza `useAuth` só para compor o nome: acrescentaria dependência de autenticação a um hook que hoje não a tem. **Atalho tentador a evitar:** usar `Math.random()` direto no nome, sem `ref`. A cada render nasceria um nome novo; o `ref` é o que garante um nome por instância, estável entre renders.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useMapWeatherSync.ts` (`:44-58`)
**Não tocar / armadilhas:** o efeito tem deps `[]` e chama `fetchRiskZones` definido acima — não "arrume" as deps nesta etapa (pode recriar a assinatura a cada render e você acabaria reproduzindo R-02 aqui). Se achar que as deps estão erradas, anote em "Achados novos".
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '42,60p' src/hooks/logistics/useMapWeatherSync.ts
```

Esperado: nome com sufixo de instância, `removeChannel` mantido e deps do efeito inalteradas. **Teste real:** abra em duas abas a tela que usa o mapa e insira uma zona de risco — as duas devem reagir.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 130 — `useSmartAlerts`: canal de alertas táticos com nome único

**Onda / Severidade / Camada:** 5 / Média / hook
**Achados resolvidos:** R-09
**Problema hoje:** `src/hooks/logistics/useSmartAlerts.tsx:170` — `supabase.channel("nexus-tactical-realtime-alerts")`, nome fixo global, ouvindo `INSERT` em `nexus_tactical_logs` (`:173`). Alerta tático é aviso de urgência: perder metade deles em silêncio porque a tela está aberta duas vezes é o pior caso do grupo.
**Causa raiz:** ver etapa 128.
**Caminho recomendado:** mesma decisão das etapas 128 e 129. Veja antes se o hook tem `user` disponível (`grep -n "useAuth\|user" src/hooks/logistics/useSmartAlerts.tsx | head`): se tiver, nomeie por `user.id` como `useDbRegressionAlerts.ts:17`; se não, sufixo por instância no padrão de `useRealtime.tsx:94`. Confirme que há `removeChannel` no cleanup deste efeito. **Atalho tentador a evitar:** deduplicar os alertas no `addAlert` para "compensar" o canal duplicado. Trata o sintoma errado: o problema não é alerta repetido, é alerta **que não chega** na segunda instância.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useSmartAlerts.tsx` (o `useEffect` a partir de `:168`)
**Não tocar / armadilhas:** logo acima, `:163-165`, há um `setInterval` com `clearInterval` correto — não encoste. Não altere o `addAlert` nem a classificação `crit`/aviso de `:183-184`.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '166,195p' src/hooks/logistics/useSmartAlerts.tsx
grep -n "removeChannel" src/hooks/logistics/useSmartAlerts.tsx
```

Esperado: nome único e `removeChannel` presente. **Teste real:** com a tela aberta em duas abas, insira um registro em `nexus_tactical_logs` e confirme que **as duas** mostram o alerta.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 131 — `useNexusHealth`: canal da sonda de latência com nome único, e fim do achado

**Onda / Severidade / Camada:** 5 / Média / hook
**Achados resolvidos:** R-09
**Problema hoje:** `src/hooks/system/useNexusHealth.ts:24` — `supabase.channel("nexus-latency-probe")`, dentro de `measureLatency()` (`:21-32`), uma função de módulo que mede o tempo de ida e volta assinando um canal. Este é o caso mais sensível dos quatro: a sonda roda **repetidamente** (o efeito de `:81-89` agenda `refresh` num `setInterval`), e duas instâncias do hook — ou duas abas — competem pelo mesmo nome de canal, de modo que a **medição de latência fica errada** e é ela que alimenta o indicador de saúde do sistema. Ou seja, o painel que deveria avisar que algo está ruim é o que mede errado.
**Causa raiz:** ver etapa 128, agravada por repetição.
**Caminho recomendado:** como a sonda cria um canal novo a cada medição e o descarta (`:25-28` tem `removeChannel` no timeout), o nome precisa ser único **por medição**, não por instância: componha com um contador/identificador no momento da chamada, no espírito de `hookInstanceId()` de `useRealtime.tsx:33-40` (que existe exatamente para isso e já evita reusar id ainda registrado). O mais simples e suficiente: receber um sufixo como argumento de `measureLatency(suffix)` e passar um id de instância guardado em `useRef` no hook, mais um contador de medição. Confirme que **todo** caminho de saída remove o canal — o timeout de `:25-28` remove, mas verifique também o caminho de sucesso do `subscribe`, senão você passa a vazar um canal por medição, que com `setInterval` vira muitos. **Esta é a última etapa de R-09:** feche com a varredura `grep -rn 'supabase.channel(' src/ | grep -v '\${'` para confirmar que não sobrou nome fixo; se aparecer um canal novo (arquivo criado depois de `d37ba30`), registre em "Achados novos", não corrija aqui. **Atalho tentador a evitar:** medir latência com `fetch` a um endpoint em vez de canal. Mudaria o que a métrica significa (hoje ela mede o canal de tempo real de propósito, como o comentário de `:18-19` diz).
**Arquivos e objetos a tocar:** `src/hooks/system/useNexusHealth.ts` (`measureLatency` em `:21-32` e o ponto que a chama)
**Não tocar / armadilhas:** não toque no `useEffect` de `:81-89` — ele é o **padrão de referência** do achado R-08 (limpa `timeout` e `interval` no mesmo `return`) e as etapas 123-127 citam essas linhas; alterá-lo invalidaria a referência. Não mude o tempo limite de 4 s (`:30`) nem o `resolve(null)`: devolver `null` quando não há medição confiável é o comportamento correto.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** se o canal deixar de ser removido em algum caminho, a sonda vaza conexões — justamente a cota que R-02 ameaça. Verifique os dois caminhos antes de mergear. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '18,40p' src/hooks/system/useNexusHealth.ts
grep -rn "supabase.channel(" src/ | grep -v '\${'
npx eslint src/hooks/system/useNexusHealth.ts
```

Esperado: nome de canal composto, `removeChannel` em todos os caminhos, e a segunda busca sem nome fixo (fora de `useRealtime.tsx`, que já compõe o tópico). **Teste real:** abra o painel de saúde em duas abas e confirme que **as duas** mostram latência numérica (não `null`/indisponível) ao mesmo tempo; registre os dois valores.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

## Onda 3 e 5 — backend: integridade e robustez das edge functions (132-201)

### Etapa 132 — Confirmar no banco ao vivo que a unicidade da tabela de marcador existe

**Onda / Severidade / Camada:** 3 / Crítica / banco
**Achados resolvidos:** B-01
**Problema hoje:** o desenho atômico de B-01 depende de uma restrição `UNIQUE` que **só foi vista em
migration**, não no banco. `supabase/migrations/20260513164426_aecb90e0-5d51-4f64-aca7-ac57c61139af.sql:44`
declara `UNIQUE(event_id, provider)` em `webhook_events_processed`, e
`supabase/migrations/20260513192119_576f26e1-4fc3-45a6-8d21-fee1ab0d3360.sql:79` cria
`public.idempotency_keys` (a tabela que `_shared/idempotency.ts:30` usa). As 248 migrations são histórico; o
estado real é o banco.
**Causa raiz:** não há fonte gerada para o fato "o que existe no banco" (H-09), então a restrição nunca foi
confirmada.
**Caminho recomendado:** pelo MCP `SUPABASE - LOGGI FLOW V2 - MCP` (projeto `jvfhclubfpxrtrrazrgr`), consulte
`pg_constraint`/`pg_indexes` para as duas tabelas e registre em `05-PROGRESSO.md` o nome exato da restrição
de unicidade de cada uma. **Atalho tentador a evitar:** assumir que a migration foi aplicada e partir para a
etapa 133. Sem a restrição, "grava primeiro e trata 23505" nunca levanta 23505: a duplicação deixa de ser
detectada **e** o código novo parece correto. O achado P-06 é a prova do custo de confiar em migration.
**Arquivos e objetos a tocar:** nenhum (consulta e registro). Se a restrição **não** existir, crie a
migration em `supabase/migrations/` e **deixe a PR aberta para o dono** — é DDL em produção.
**Não tocar / armadilhas:** é leitura; nenhum `DROP`, nenhum `ALTER` sem a PR do dono. Note também que
`_shared/idempotency.ts:30` é **fail-open** por desenho (erro de infraestrutura → processa): se a tabela não
existir, nada falha e tudo é processado em silêncio.
**Depende de:** — · **Libera:** 133, 134, 135, 136, 137, 138, 199
**Risco e como reverter:** nenhum na consulta. A migration (se necessária) reverte por `DROP CONSTRAINT`, mas
só com o dono.
**Precisa de aprovação humana antes do merge:** não para a consulta; **sim** se a etapa virar migration
**Como verificar:**

```sql
select conname, contype, pg_get_constraintdef(oid)
from pg_constraint
where conrelid in ('public.webhook_events_processed'::regclass, 'public.idempotency_keys'::regclass);
```

Esperado: uma restrição única cobrindo `(event_id, provider)` e outra cobrindo a chave de
`idempotency_keys`. Anote os nomes em `05-PROGRESSO.md` — as etapas 133-136 citam o código `23505` e
precisam saber que ele vai ocorrer.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 133 — `lalamove-webhook`: trocar "consulta e depois grava" por "grava primeiro e trata o conflito"

**Onda / Severidade / Camada:** 3 / Crítica / edge function
**Achados resolvidos:** B-01
**Problema hoje:** `supabase/functions/lalamove-webhook/index.ts:101-114` consulta
`webhook_events_processed` por `event_id` + `provider` e devolve "Already processed" se achar. Entre a
consulta e os inserts de negócio (`:122`, `:145`, `:159`, `:178`) não há nada que impeça uma segunda execução
simultânea de passar pela mesma consulta vazia.
**Causa raiz:** TOCTOU — a janela entre ler e gravar não é protegida, apesar de a tabela ter `UNIQUE`.
**Caminho recomendado:** mova a gravação do marcador para **antes** do `switch`, no lugar onde hoje está a
consulta, e trate a violação de unicidade como duplicata. Copie a lógica de
`supabase/functions/_shared/idempotency.ts:30` (insert → se `error.code === "23505"`, devolve duplicata → se
outro erro, loga e segue), e o formato de resposta de
`supabase/functions/carrier-webhook-receiver/index.ts:128-135`. Mantenha a tabela
`webhook_events_processed` e o campo `payload`: ela guarda o corpo do evento, que serve de auditoria.
**Atalho tentador a evitar:** trocar tudo por `claimIdempotencyKey` direto. Esse helper grava em
**outra** tabela (`idempotency_keys`) e **sem** o `payload`; os eventos já marcados em
`webhook_events_processed` passariam a ser considerados novos, e você perderia o corpo guardado. O padrão a
copiar é a _lógica_, não a chamada.
**Arquivos e objetos a tocar:** `supabase/functions/lalamove-webhook/index.ts` (apenas o bloco `:101-114`)
**Não tocar / armadilhas:** não altere `_shared/idempotency.ts` — dois webhooks dependem dele. Não mexa nos
inserts de negócio nesta etapa. A remoção do marcador do fim (`:189-190`) é a etapa 134: nesta etapa o
marcador fica gravado duas vezes, e a segunda falha calada — é por isso que 134 vem imediatamente atrás.
**Depende de:** 132 · **Libera:** 134, 137
**Risco e como reverter:** se a restrição única não existir no banco (etapa 132), o 23505 nunca ocorre e a
dedupe continua falhando sob concorrência — sem piorar o que já existe. `git revert` da PR. Merge nesta pasta
**publica a função em produção na hora** (`.github/workflows/deploy-functions.yml:9-13`).
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '95,125p' supabase/functions/lalamove-webhook/index.ts
grep -n "23505" supabase/functions/lalamove-webhook/index.ts
```

Esperado: nenhum `.select('id')` de verificação prévia; um `insert` do marcador antes do `switch`, com
tratamento de `23505` devolvendo duplicata. Depois do merge, confirme o deploy da função (painel do Supabase
→ Edge Functions, horário da última publicação) e registre o horário em `05-PROGRESSO.md`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 134 — `lalamove-webhook`: remover a gravação tardia do marcador

**Onda / Severidade / Camada:** 3 / Alta / edge function
**Achados resolvidos:** B-01
**Problema hoje:** `supabase/functions/lalamove-webhook/index.ts:189-190` grava o marcador **depois** dos
inserts de negócio, e o resultado desse insert não é verificado (`await supabase.from(...).insert({...})` sem
checar `error`). Com a etapa 133 aplicada, essa gravação passa a ser a segunda, e falha sempre — calada.
**Causa raiz:** marcador no fim do processamento, herdado do desenho antigo.
**Caminho recomendado:** apague o bloco de "Mark as processed" (`:188-192`). Se quiser manter registro de
conclusão, faça um `update` do marcador já gravado (por exemplo um `processed_at`) **somente se a coluna
existir** — confira as colunas reais de `webhook_events_processed` em `src/integrations/supabase/types.ts`
antes. **Atalho tentador a evitar:** manter o insert do fim "por segurança". Ele não protege nada: ou o
marcador já existe (e o insert falha), ou a restrição não existe (e o insert duplica a linha).
**Arquivos e objetos a tocar:** `supabase/functions/lalamove-webhook/index.ts` (bloco `:188-192`)
**Não tocar / armadilhas:** não acrescente coluna à tabela nesta etapa — isso é DDL e exige o dono. Se não
houver coluna de conclusão, apenas remova o insert.
**Depende de:** 133 · **Libera:** 137
**Risco e como reverter:** baixo; remove código que já não tem efeito útil. `git revert`. Merge publica em
produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "Mark as processed" supabase/functions/lalamove-webhook/index.ts
grep -c "webhook_events_processed" supabase/functions/lalamove-webhook/index.ts
```

Esperado: nenhuma ocorrência de "Mark as processed"; `webhook_events_processed` aparece **uma vez** (a
gravação inicial da etapa 133). Confirme o deploy depois do merge e registre o horário.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 135 — `rodonaves-webhook`: trocar "consulta e depois grava" por "grava primeiro e trata o conflito"

**Onda / Severidade / Camada:** 3 / Crítica / edge function
**Achados resolvidos:** B-01
**Problema hoje:** `supabase/functions/rodonaves-webhook/index.ts:128-135` consulta
`webhook_events_processed` antes de processar; os inserts de negócio vêm depois (o `insert` em `ocorrencias`
em `:202`), e o marcador só em `:214-215`. Mesmo desenho de `lalamove-webhook`, mesmo efeito: dois envios
simultâneos do mesmo evento gravam ocorrência duas vezes.
**Causa raiz:** TOCTOU, idêntica à etapa 133.
**Caminho recomendado:** mesma mudança da etapa 133, no mesmo lugar: substitua a consulta `:128-135` pela
gravação do marcador com tratamento de `23505`, seguindo a lógica de `_shared/idempotency.ts:30` e a resposta
de `carrier-webhook-receiver/index.ts:128-135`. **Faça esta etapa depois da 133 e copie o que ficou lá** —
os dois webhooks devem ficar com o mesmo desenho, para que o próximo leitor reconheça o padrão.
**Atalho tentador a evitar:** mudar a chave de dedupe na mesma PR. A chave da Rodonaves (`:124-127`) é a
**correta** do repositório e serve de referência para B-02 — não encoste nela aqui.
**Arquivos e objetos a tocar:** `supabase/functions/rodonaves-webhook/index.ts` (apenas `:128-135`)
**Não tocar / armadilhas:** não toque em `:124-127` (chave boa), nem no bloco de HMAC/`ALLOW_TEST_MODE`
(`:67-69`, etapas 010 e 011). A remoção do marcador tardio é a etapa 136.
**Depende de:** 132, 133 · **Libera:** 136, 137
**Risco e como reverter:** igual à etapa 133. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '120,145p' supabase/functions/rodonaves-webhook/index.ts
grep -n "23505" supabase/functions/rodonaves-webhook/index.ts
```

Esperado: nenhuma consulta prévia; insert do marcador antes do processamento, com `23505` tratado como
duplicata. Confirme o deploy depois do merge e registre o horário.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 136 — `rodonaves-webhook`: remover a gravação tardia do marcador

**Onda / Severidade / Camada:** 3 / Alta / edge function
**Achados resolvidos:** B-01
**Problema hoje:** `supabase/functions/rodonaves-webhook/index.ts:214-215` grava o marcador depois do
`update` da entrega (`:196`) e do insert de `ocorrencias` (`:202`), sem verificar o erro do insert.
**Causa raiz:** marcador no fim, herdado do desenho antigo.
**Caminho recomendado:** apague o bloco "Mark as processed" (`:213-218`), igual à etapa 134. Mantenha o campo
`event_id` na resposta de sucesso (`:224-229`) — ele é útil no suporte e não depende do insert removido.
**Atalho tentador a evitar:** aproveitar a PR para checar o erro do `insert` em `ocorrencias` (`:202`). É
defeito real, mas é outra causa raiz: anote em "Achados novos" no progresso.
**Arquivos e objetos a tocar:** `supabase/functions/rodonaves-webhook/index.ts` (bloco `:213-218`)
**Não tocar / armadilhas:** o `if (updateError) throw updateError` em `:198` vaza mensagem do Postgres — isso
é B-06 e tem etapa própria (176). Não resolva aqui.
**Depende de:** 135 · **Libera:** 137
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "Mark as processed" supabase/functions/rodonaves-webhook/index.ts
grep -c "webhook_events_processed" supabase/functions/rodonaves-webhook/index.ts
```

Esperado: nenhuma ocorrência de "Mark as processed"; `webhook_events_processed` aparece **uma vez**. Confirme
o deploy depois do merge e registre o horário.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 137 — Teste automatizado: o mesmo evento enviado duas vezes grava o dado de negócio uma vez

**Onda / Severidade / Camada:** 3 / Alta / teste
**Achados resolvidos:** B-01
**Problema hoje:** não há teste que prove a dedupe dos webhooks. Sem ele, a próxima mudança no fluxo
reintroduz o defeito sem a CI notar — foi exatamente assim que o desenho TOCTOU sobreviveu em dois arquivos.
**Causa raiz:** ausência de cobertura no ponto de idempotência.
**Caminho recomendado:** acrescente um teste `vitest` que simule o cliente Supabase (sem rede) e verifique
duas coisas, para cada um dos dois webhooks: (a) o marcador é gravado **antes** de qualquer insert de
negócio; (b) quando o insert do marcador devolve `{ code: "23505" }`, a função responde duplicata e **não**
executa insert de negócio nenhum. Procure um teste de edge function já existente em
`supabase/functions/**/*.test.ts` ou `tests/` e siga a forma dele. **Atalho tentador a evitar:** teste que
chama a função de verdade contra o banco de produção. Não há staging; o teste é de unidade, com cliente
simulado.
**Arquivos e objetos a tocar:** um arquivo de teste novo ao lado de cada função, ou um arquivo único
cobrindo os dois webhooks
**Não tocar / armadilhas:** não altere os `index.ts` nesta etapa. Se a função não for testável sem refatorar
(serve() inline sem exportar o handler), **não refatore**: registre o limite em `05-PROGRESSO.md` e entregue
o teste do que for alcançável (por exemplo um teste do helper e um gate de `grep`).
**Depende de:** 133, 134, 135, 136 · **Libera:** —
**Risco e como reverter:** nenhum em produção (só teste). Cuidado com o orçamento de lint: 105/105 (ver
"5 coisas", item 2).
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run supabase/functions 2>&1 | tail -20
npm run lint:budget
```

Esperado: o novo teste passa, e falha se você reverter a etapa 133 localmente (teste isso — um teste que
passa dos dois jeitos não prova nada).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 138 — Criar `buildEventKey` em `_shared/idempotency.ts`, copiando a chave da Rodonaves

**Onda / Severidade / Camada:** 3 / Alta / edge function
**Achados resolvidos:** B-02
**Problema hoje:** cada webhook inventa a chave de dedupe no próprio arquivo, e três das quatro inventam uma
que não serve (`lalamove-webhook/index.ts:97` com `crypto.randomUUID()`,
`nexus-webhook-receiver/index.ts:80` com `Date.now()`, `carrier-webhook-receiver/index.ts:126-132` estável
demais). Só `rodonaves-webhook/index.ts:124-127` está correto.
**Causa raiz:** não existe lugar comum para "como se calcula a chave de um evento", então cada função decide
sozinha — e decide errado.
**Caminho recomendado:** acrescente a `supabase/functions/_shared/idempotency.ts` uma função
`buildEventKey(provider, parts)` que receba os campos identificadores do evento **em ordem**, descarte os
vazios, junte com `-`, e **lance erro (ou devolva `null`) quando nenhum campo identificador existir** — em
vez de inventar valor. O modelo do que é uma boa chave é `rodonaves-webhook/index.ts:124-127`:
identificador do documento (`nf_numero` ou `codigo_rastreamento`) + `status_code` + `data_evento`. Acrescente
também, como último recurso para payloads sem nenhum campo estável, um `hash` do corpo (SHA-256 do JSON
canônico) — determinístico, ao contrário de `randomUUID()`. **Atalho tentador a evitar:** manter um fallback
aleatório "para a chave nunca faltar". É esse fallback que anula a dedupe: a chave precisa ser **a mesma**
para o mesmo evento, e, se não puder ser, o certo é recusar o evento (400) e registrar.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/idempotency.ts` (acréscimo apenas)
**Não tocar / armadilhas:** **não modifique** `claimIdempotencyKey` (`:30`) — `carrier-webhook-receiver` e
`nexus-webhook-receiver` dependem dele hoje. Acrescente, não altere. Note que o helper é fail-open de
propósito; não "conserte" isso aqui.
**Depende de:** 132 · **Libera:** 139, 140, 141, 142, 199
**Risco e como reverter:** baixo (código novo, ninguém usa ainda). `git revert`. Merge publica em produção na
hora, mas sem efeito até a etapa 139.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'export function buildEventKey\|export async function buildEventKey' supabase/functions/_shared/idempotency.ts
npx vitest run supabase/functions/_shared 2>&1 | tail -20
```

Esperado: a função existe, os testes de `_shared` continuam passando, e há teste novo cobrindo "mesmo evento
→ mesma chave" e "nenhum identificador → erro/null". Confirme o deploy depois do merge.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 139 — `lalamove-webhook`: eliminar o `crypto.randomUUID()` da chave de dedupe

**Onda / Severidade / Camada:** 3 / Alta / edge function
**Achados resolvidos:** B-02
**Problema hoje:** `supabase/functions/lalamove-webhook/index.ts:97` monta
`eventId || data?.orderId || crypto.randomUUID()`. Quando a Lalamove não manda `eventId` nem `orderId`, a
chave é aleatória: a dedupe **nunca** acerta, e todo reenvio é processado como evento novo.
**Causa raiz:** valor de reserva aleatório usado para garantir que a chave exista.
**Caminho recomendado:** troque por `buildEventKey` (etapa 138) com os campos estáveis do payload da
Lalamove, na ordem: `eventId`, depois `orderId` + `eventType` + `timestamp` do próprio evento. Se nenhum
existir, responda **400** com um erro genérico e registre o payload em log — não invente chave.
**Atalho tentador a evitar:** usar `Date.now()` ou o horário de recebimento para "completar" a chave. É o
mesmo defeito de `nexus-webhook-receiver:80` (etapa 140): o horário do servidor muda a cada reenvio.
**Arquivos e objetos a tocar:** `supabase/functions/lalamove-webhook/index.ts` (`:97` e a validação logo
acima, se precisar recusar)
**Não tocar / armadilhas:** o `timestamp` que serve é o **do evento**, dentro de `data` — não o de
recebimento. Se o payload da Lalamove não tiver nada estável, o 400 é a resposta certa: a transportadora vai
reenviar, e aí cai na dedupe das etapas 133-134. Não mexa no bloco de idempotência que a etapa 133 deixou.
**Depende de:** 133, 138 · **Libera:** 142
**Risco e como reverter:** eventos sem nenhum identificador passam a ser recusados com 400 — hoje são
aceitos e duplicados. É a correção, mas muda o que a transportadora vê: registre no corpo da PR quantos
eventos assim apareceram nos logs. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'randomUUID' supabase/functions/lalamove-webhook/index.ts
sed -n '90,105p' supabase/functions/lalamove-webhook/index.ts
```

Esperado: zero ocorrências de `randomUUID`; a chave vem de `buildEventKey`. Depois do deploy, dois envios
idênticos do mesmo evento devem produzir uma única linha em `webhook_events_processed` (consulte pelo
`event_id`) e um único registro de rastreamento.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 140 — `nexus-webhook-receiver`: eliminar o `Date.now()` da chave de dedupe

**Onda / Severidade / Camada:** 3 / Alta / edge function
**Achados resolvidos:** B-02
**Problema hoje:** `supabase/functions/nexus-webhook-receiver/index.ts:80` acrescenta `:${Date.now()}` à
chave. A função usa o helper correto (`claimIdempotencyKey`), mas a chave é nova em cada requisição: a
proteção é decorativa.
**Causa raiz:** valor de reserva baseado no relógio do servidor.
**Caminho recomendado:** troque por `buildEventKey` (etapa 138) com os campos do payload do Nexus que
identificam o evento (origem/`source`, identificador da transportadora, identificador da cotação e o texto
recebido — confira os campos reais lendo `:60-90` antes). Se nada identificar o evento, use o hash do corpo
que a etapa 138 oferece. **Atalho tentador a evitar:** manter `Date.now()` arredondado para o minuto ou a
hora. Parece determinístico e não é: um reenvio na virada do minuto escapa, e dois eventos legítimos no mesmo
minuto colidem — você troca um defeito por dois.
**Arquivos e objetos a tocar:** `supabase/functions/nexus-webhook-receiver/index.ts` (`:80`)
**Não tocar / armadilhas:** não toque no bloco de HMAC `:36-44` — é a etapa 001, e pode já ter sido feita.
Não toque nos `functions.invoke` de `:141` e `:154` — são a etapa 159.
**Depende de:** 138 · **Libera:** 142
**Risco e como reverter:** a partir daqui reenvios legítimos do mesmo evento passam a ser descartados — é o
objetivo. Se a chave ficar estável demais (dois eventos verdadeiros iguais em todos os campos), um evento
real pode ser engolido: por isso inclua o hash do corpo, que distingue payloads diferentes. `git revert`.
Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Date.now()' supabase/functions/nexus-webhook-receiver/index.ts
sed -n '70,90p' supabase/functions/nexus-webhook-receiver/index.ts
```

Esperado: nenhum `Date.now()` dentro da construção da chave; `buildEventKey` no lugar. Depois do deploy,
reenvie o mesmo payload duas vezes e confirme que a segunda resposta indica duplicata.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 141 — `carrier-webhook-receiver`: chave estável demais está engolindo evento verdadeiro

**Onda / Severidade / Camada:** 3 / Alta / edge function
**Achados resolvidos:** B-02
**Problema hoje:** `supabase/functions/carrier-webhook-receiver/index.ts:126-132` monta
`${carrier_id}:${event_type}:${timestamp ?? ""}`. Quando a transportadora não manda `timestamp`, a chave vira
`transportadora:tipo:` — a **mesma** para todos os eventos daquele tipo. O segundo evento legítimo é
descartado como duplicata, e a mudança de status real nunca aparece no rastreio do cliente. É o inverso de
B-02 nos outros dois webhooks, e é pior: aqui some dado verdadeiro.
**Causa raiz:** campo opcional usado como discriminador, com `?? ""` em vez de um discriminador alternativo.
**Caminho recomendado:** troque a construção por `buildEventKey` (etapa 138) e, quando `timestamp` faltar,
use o **hash do corpo** como último componente, em vez de string vazia. Assim dois payloads diferentes do
mesmo tipo geram chaves diferentes, e dois payloads idênticos continuam deduplicando. **Atalho tentador a
evitar:** acrescentar `Date.now()` para "destravar" os eventos engolidos. Resolve o sintoma e reintroduz o
defeito da etapa 140 nesta função, que hoje é uma das duas corretas no uso do helper.
**Arquivos e objetos a tocar:** `supabase/functions/carrier-webhook-receiver/index.ts` (apenas `:126-132`)
**Não tocar / armadilhas:** esta função é o **padrão de referência** de B-01 (`:128-135`) e de erro sem
vazamento (`:221-227`). Não reorganize nada além da construção da chave — outras etapas citam essas linhas.
**Depende de:** 138 · **Libera:** 142
**Risco e como reverter:** eventos que hoje são descartados passam a ser processados. Se havia duplicação
real sendo contida por acidente, ela aparece: confirme nos logs quantos eventos vinham sem `timestamp` antes
de mergear, e registre no corpo da PR. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '124,140p' supabase/functions/carrier-webhook-receiver/index.ts
```

Esperado: a chave não contém mais `?? ""`; sem `timestamp`, entra o hash do corpo. Depois do deploy, dois
eventos **diferentes** do mesmo tipo e da mesma transportadora devem ser processados os dois (consulte
`idempotency_keys` pelos dois valores de chave).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 142 — Gate de `grep`: nenhuma chave de dedupe pode conter valor aleatório ou relógio

**Onda / Severidade / Camada:** 3 / Média / CI
**Achados resolvidos:** B-02
**Problema hoje:** depois das etapas 139-141 nada impede que o próximo agente volte a escrever
`crypto.randomUUID()` ou `Date.now()` dentro da construção de uma chave de evento. Foi assim que o defeito
chegou a três funções de quatro.
**Causa raiz:** convenção sem mecanismo (o mesmo padrão de H-03 e da etapa 011).
**Caminho recomendado:** acrescente um script em `scripts/ci/` (pasta com README — **leia antes**) que falhe
quando `crypto.randomUUID()` ou `Date.now()` apareçam na mesma expressão de uma variável cujo nome contenha
`eventId`/`event_key`/`idempot`, nos `supabase/functions/**/index.ts`. Siga a forma de um validador que já
existe (`npm run validate:no-console` e `npm run validate:csp` apontam para os scripts equivalentes; copie o
que estiver mais simples). Ligue-o a um `npm run` novo e cite-o no `package.json`. **Atalho tentador a
evitar:** proibir `Date.now()` no repositório inteiro. Ele é legítimo em log, métrica e tempo limite; a
proibição ampla vira ruído e alguém desliga o gate.
**Arquivos e objetos a tocar:** `scripts/ci/<novo>.mjs`, `package.json` (um script novo)
**Não tocar / armadilhas:** mexer em `scripts/` dispara o check obrigatório "Contratos da automação local" —
rode `npm run automation:test` antes de abrir a PR. **Não** acrescente o gate ao workflow de CI nesta etapa:
isso é mudança de CI e exige o dono; deixe-o como `npm run` chamável e registre a sugestão no progresso.
**Depende de:** 139, 140, 141 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (toca `scripts/` e a automação da CI)
**Como verificar:**

```bash
npm run automation:test 2>&1 | tail -20
node scripts/ci/<novo>.mjs; echo "saida=$?"
```

Esperado: saída 0 no código atual; saída diferente de 0 se você reintroduzir `crypto.randomUUID()` em
`lalamove-webhook/index.ts:97` localmente (teste isso e desfaça).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 143 — `scheduled-reports`: lista de campos permitidos no `insert`

**Onda / Severidade / Camada:** 3 / Crítica / edge function
**Achados resolvidos:** B-03
**Problema hoje:** `supabase/functions/scheduled-reports/index.ts:28` lê `reportData` do corpo e `:38` o
espalha no insert (`.insert([{ ...reportData, user_id: userId }])`). Sem lista de campos permitidos,
**qualquer** coluna de `scheduled_reports` é gravável por quem chama — inclusive colunas que a interface
nunca mostra.
**Causa raiz:** _mass assignment_ — espalhar o corpo da requisição direto no insert.
**Caminho recomendado:** monte o objeto do insert campo por campo, com `requireString`/`requireEnum`/
`requireNumber` de `_shared/validate.ts`, exatamente como `external-db-bridge/index.ts:4` importa e usa.
Leia as colunas reais de `scheduled_reports` em `src/integrations/supabase/types.ts` e permita **apenas** as
que a interface preenche. Trate `ValidationError` devolvendo `validationErrorResponse` (padrão de
`external-db-bridge/index.ts:367-375`). **Atalho tentador a evitar:** uma lista de campos **proibidos**
(blocklist). Toda coluna nova entra gravável por padrão; é a lista de permitidos que envelhece bem.
**Arquivos e objetos a tocar:** `supabase/functions/scheduled-reports/index.ts` (`:28` e `:38`)
**Não tocar / armadilhas:** **não desfaça** o `user_id` vindo de `auth.claims.sub` (`:25`) nem o comentário
que explica por quê — já houve uma correção de IDOR aqui (etapa 011 antiga). O `user_id` **nunca** vem do
corpo, mesmo que ele apareça na sua lista de permitidos: exclua-o explicitamente.
**Depende de:** — · **Libera:** 144, 145
**Risco e como reverter:** se a interface mandar um campo que você não permitiu, ele deixa de ser salvo em
silêncio. Antes de mergear, procure quem chama (`grep -rn 'scheduled-reports' src/`) e confira os campos que
o front envia. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'scheduled-reports' src/ | head
sed -n '20,45p' supabase/functions/scheduled-reports/index.ts
```

Esperado: nenhum `...reportData` no insert; campos nomeados um a um; `user_id` do token. Depois do deploy,
crie um agendamento pela interface e confirme que ele aparece completo; e envie uma coluna fora da lista e
confirme que ela foi ignorada.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 144 — `scheduled-reports`: a mesma lista de campos permitidos no `update`

**Onda / Severidade / Camada:** 3 / Crítica / edge function
**Achados resolvidos:** B-03
**Problema hoje:** `supabase/functions/scheduled-reports/index.ts:50` repete o espalhamento de `reportData`
no `update`. O filtro por `user_id` (`:53`) impede mexer no agendamento de outro usuário, mas não impede
gravar qualquer coluna do **próprio** agendamento.
**Causa raiz:** a mesma da etapa 143, no segundo caminho.
**Caminho recomendado:** reutilize a função de validação/montagem que a etapa 143 criou — uma só, chamada
nos dois lugares. Se na etapa 143 você escreveu a montagem inline, extraia agora para uma função local no
mesmo arquivo (não crie arquivo novo em `_shared/` para um único consumidor). **Atalho tentador a evitar:**
copiar e colar a lista. Duas listas divergem na primeira coluna nova; é assim que o defeito voltaria só no
`update`.
**Arquivos e objetos a tocar:** `supabase/functions/scheduled-reports/index.ts` (`:50` e a função de
montagem)
**Não tocar / armadilhas:** mantenha o filtro `.eq('user_id', userId)` em `:53` — é a proteção de IDOR que já
existe. No `update`, campos ausentes devem ser **ignorados**, não sobrescritos com vazio.
**Depende de:** 143 · **Libera:** 145
**Risco e como reverter:** edição de agendamento pode perder campos que a interface manda e você não
permitiu. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'reportData' supabase/functions/scheduled-reports/index.ts
```

Esperado: `reportData` só aparece como entrada da função de validação, nunca espalhado em `insert`/`update`.
Depois do deploy, edite um agendamento pela interface e confirme que a mudança persiste.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 145 — `scheduled-reports`: validar `action` e `reportId`, e testar o descarte de campo não permitido

**Onda / Severidade / Camada:** 3 / Alta / edge function
**Achados resolvidos:** B-03, B-04
**Problema hoje:** `supabase/functions/scheduled-reports/index.ts:28` desestrutura `action` e `reportId` do
corpo sem nenhuma checagem. `action` decide o caminho da função e `reportId` vai para a consulta; um corpo
sem eles cai em erro 500 em vez de "campo inválido".
**Causa raiz:** parse do corpo sem validação (o mesmo de B-04, aqui no arquivo que a etapa 143 já tocou).
**Caminho recomendado:** `requireEnum(body, "action", ALLOWED_ACTIONS)` e `requireString(body, "reportId")`
onde o caminho exigir, com a constante de ações no alto do arquivo — exatamente o desenho de
`external-db-bridge/index.ts:8` (`ALLOWED_ACTIONS`). Em seguida, acrescente um teste `vitest` que prove:
(a) campo fora da lista de permitidos não chega ao insert; (b) `action` desconhecida devolve 400, não 500.
**Atalho tentador a evitar:** validar com `if (!action) return 400` à mão em cada caminho. O helper já
devolve a mensagem por campo e a resposta estruturada; validação manual espalhada é o que produziu B-04.
**Arquivos e objetos a tocar:** `supabase/functions/scheduled-reports/index.ts`, um arquivo de teste novo
**Não tocar / armadilhas:** não altere `_shared/validate.ts` — 8 funções já o usam. Cuidado com o orçamento
de lint (105/105).
**Depende de:** 143, 144 · **Libera:** —
**Risco e como reverter:** chamadas que hoje passam com corpo incompleto passam a receber 400. `git revert`.
Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run supabase/functions/scheduled-reports 2>&1 | tail -20
grep -n 'requireEnum\|requireString' supabase/functions/scheduled-reports/index.ts
```

Esperado: os dois helpers em uso, o teste novo passando, e um corpo `{"action":"xpto"}` devolvendo 400 com
mensagem por campo (teste depois do deploy com uma requisição real e registre a resposta).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 146 — `smart-carrier-selection`: validar `peso_kg` e os números do cálculo de frete

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/smart-carrier-selection/index.ts:13` faz o parse do corpo e `peso_kg`
entra no cálculo de frete **sem checagem de tipo**: texto percorre a conta. O resultado é uma cotação com
valor sem sentido, ou `NaN` propagado, em vez de "o campo peso está inválido".
**Causa raiz:** parse do corpo sem validação. O helper existe (`_shared/validate.ts`) e é usado por 8 das 32
funções que fazem parse; esta é uma das 24 que não usam.
**Caminho recomendado:** importe `requireNumber`, `requireString`, `ValidationError` e
`validationErrorResponse` como `external-db-bridge/index.ts:4` faz, e valide `peso_kg` com
`requireNumber(body, "peso_kg", { min: 0 })` — `requireNumber` já rejeita `NaN`
(`_shared/validate.ts`, bloco de `requireNumber`). Valide no mesmo lugar os outros campos numéricos e de
origem/destino que o cálculo consome. No `catch`, devolva `validationErrorResponse(err, headers)` para
`ValidationError`, como `external-db-bridge/index.ts:367-375`. **Atalho tentador a evitar:** `Number(x) || 0`
para "garantir número". Zero é um peso válido na conta e some o erro: a cotação sai errada em silêncio, que é
pior do que o 500 de hoje.
**Arquivos e objetos a tocar:** `supabase/functions/smart-carrier-selection/index.ts` (`:13` e o `catch`)
**Não tocar / armadilhas:** não altere `_shared/validate.ts`. O `error.message` devolvido em `:242` é B-06 e
tem etapa própria (177) — não resolva aqui, só garanta que o `ValidationError` sai antes do `catch` genérico.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** chamadas que hoje passam com peso em texto passam a receber 400. Procure quem
chama (`grep -rn 'smart-carrier-selection' src/`) e confira o tipo que o front envia antes de mergear.
`git revert`. Merge publica a função em produção na hora
(`.github/workflows/deploy-functions.yml:9-13`).
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'requireNumber\|validationErrorResponse' supabase/functions/smart-carrier-selection/index.ts
grep -rn 'smart-carrier-selection' src/ | head
```

Esperado: os helpers em uso. Depois do deploy, um corpo com `"peso_kg":"abc"` deve devolver 400 com a
mensagem do campo, não 500 — faça a requisição e registre a resposta em `05-PROGRESSO.md`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 147 — `webhook-status`: exigir `data` antes de desestruturar

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/webhook-status/index.ts:47` lê o corpo e `:51-58` desestrutura `data`
sem verificar que existe. Um corpo `{"action":"notify_status_change"}` sem `data` quebra com **erro 500**.
**Causa raiz:** parse do corpo sem validação.
**Caminho recomendado:** valide `action` com `requireEnum` (lista de ações no alto do arquivo) e, para cada
ação, os campos de `data` que ela usa, com `requireString`/`requireNumber` — padrão de
`external-db-bridge/index.ts:4` e `:8`. Devolva `validationErrorResponse` no `catch` para `ValidationError`
(`external-db-bridge/index.ts:367-375`). **Atalho tentador a evitar:** `const { x } = data ?? {}`. Some o
500 e a função segue adiante disparando notificação com campo vazio para todos os `client_webhooks` — erro
silencioso pior que o erro visível.
**Arquivos e objetos a tocar:** `supabase/functions/webhook-status/index.ts` (`:47` e `:51-58`)
**Não tocar / armadilhas:** o HMAC em `:89-105` **assina a saída** para o cliente externo; não é
autenticação de entrada e não se mexe. O bloco de auth `:28-45` é das etapas 004 e 005 — pode já ter mudado;
releia antes. O CORS `*` de `:7` é a etapa 194.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** chamadas com corpo incompleto passam a receber 400. `git revert`. Merge publica em
produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '45,60p' supabase/functions/webhook-status/index.ts
```

Esperado: `action` validada por `requireEnum` e nenhum acesso a `data.*` antes da validação. Depois do
deploy, um corpo sem `data` deve devolver 400; registre a resposta.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 148 — `ingest-biosync`: validar `heart_rate` como número antes de comparar com o limite

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/ingest-biosync/index.ts:21` faz o parse e `:34` compara `heart_rate`
com o limite **sem garantir que é número**. Em JavaScript, a comparação com texto decide o alerta de
emergência do motorista: `"200" > 150` é verdadeiro, `"abc" > 150` é falso. O alerta crítico depende disso.
**Causa raiz:** parse do corpo sem validação, num campo que decide um alerta.
**Caminho recomendado:** `requireNumber(body, "heart_rate", { min: 20, max: 300 })` e
`requireString(body, "vehicle_id")` (ou o identificador real — confira `:21-35` antes), com o import de
`_shared/validate.ts` no modelo de `external-db-bridge/index.ts:4`. Valor fora da faixa fisiológica é dado
inválido de sensor: recuse com 400 em vez de gerar alerta. **Atalho tentador a evitar:** `Number(heart_rate)`
sem faixa. `Number("")` é 0 e passa pela comparação sem disparar nada — o alerta deixa de existir em
silêncio para um sensor que manda campo vazio.
**Arquivos e objetos a tocar:** `supabase/functions/ingest-biosync/index.ts` (`:21` e `:34`)
**Não tocar / armadilhas:** esta função trata **biometria de motorista** — matéria de LGPD
(`docs/LGPD_COMPLIANCE.md`): não acrescente o valor do batimento a log novo. Não mexa no `fetch` nu de `:65`
(etapa 158), nem no `throw error` de `:50` e no `error.message` de `:92` (etapa 165), nem no CORS de `:6`
(etapa 192), nem na dedupe ausente (etapa 199). A função também é uma das duas que ninguém chama (A-09) —
isso não a dispensa: ela está publicada e aberta.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** payloads de sensor malformados passam a ser recusados. `git revert`. Merge publica
em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '18,40p' supabase/functions/ingest-biosync/index.ts
```

Esperado: `heart_rate` é número validado antes de qualquer comparação. Depois do deploy, um corpo com
`"heart_rate":"abc"` deve devolver 400 e **não** gravar telemetria — confirme consultando
`bio_sync_telemetry` pelo horário.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 149 — `lalamove-api`: `path` e `method` do corpo decidem o roteamento sem `requireEnum`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/lalamove-api/index.ts:78-81` usa `body.path` e `body.method` para
montar a chamada à Lalamove. Sem lista de valores permitidos, quem chama escolhe o caminho e o verbo HTTP que
a função vai usar na conta da empresa.
**Causa raiz:** parse do corpo sem validação, em campos que são roteamento — efetivamente um proxy aberto
para a API do parceiro, limitado só pelo que a Lalamove aceitar.
**Caminho recomendado:** `requireEnum(body, "method", ["GET","POST"] as const)` e uma **lista de caminhos
permitidos** (`ALLOWED_PATHS`) no alto do arquivo, validada com `requireEnum` — exatamente o desenho de
`external-db-bridge/index.ts:8` (`ALLOWED_ACTIONS`/`ALLOWED_TABLES`), que é a função do repositório que já
resolveu esse problema. Se o caminho precisar de parte variável (um id), aceite um **nome de operação** e
monte o caminho no servidor; nunca concatene o que veio do corpo. **Atalho tentador a evitar:** validar o
`path` com expressão regular do tipo "começa com `/v3/`". Parâmetros de consulta, `..` e caminhos novos da
API passam; a lista fechada é o que fecha.
**Arquivos e objetos a tocar:** `supabase/functions/lalamove-api/index.ts` (`:78-81` e a constante nova)
**Não tocar / armadilhas:** não mexa na chamada à Lalamove em si — ela passa por `safeFetch`, que já embute
tempo limite e disjuntor (`_shared/safeFetch.ts:65`). **Não** abra etapa de tempo limite aqui. O
`details: errorText` de `:53` e `:58` e o `error.message` de `:169` são B-06, etapa 169.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** se alguma tela usa um caminho que você não listou, ela quebra com 400. Levante os
caminhos realmente usados antes (`grep -rn "lalamove-api" src/` e os logs da função) e inclua todos na lista;
registre a lista no corpo da PR. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'lalamove-api' src/ | head
sed -n '70,90p' supabase/functions/lalamove-api/index.ts
```

Esperado: `method` e `path` validados contra listas fechadas. Depois do deploy, um corpo com
`"path":"/qualquer"` deve devolver 400; registre a resposta.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 150 — `resend-email`: validar `to`, `subject` e `html` antes de entregar ao provedor

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/resend-email/index.ts:43` lê o corpo e `:45-57` passa `to`, `subject`
e `html` ao provedor **sem validação de formato nem de tamanho**. Endereço malformado vira erro do Resend
devolvido ao cliente; corpo gigante vira cobrança e possível bloqueio da conta.
**Causa raiz:** parse do corpo sem validação, num caminho que gasta dinheiro e reputação de domínio.
**Caminho recomendado:** `requireString(body, "to", { pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, maxLength: 320 })`,
`requireString(body, "subject", { maxLength: 200 })` e `requireString(body, "html", { maxLength: ... })` com
um teto que o dono aceite — `requireString` já aceita `pattern`, `minLength` e `maxLength`
(`_shared/validate.ts`, bloco de `requireString`). Import no modelo de `external-db-bridge/index.ts:4`; no
`catch`, `validationErrorResponse` antes do erro genérico. **Atalho tentador a evitar:** confiar na validação
do Resend. O erro dele volta para o cliente com o texto do provedor (é o agravante de B-06,
`resend-email/index.ts:60-61`), e a requisição já foi paga.
**Arquivos e objetos a tocar:** `supabase/functions/resend-email/index.ts` (`:43` e `:45-57`)
**Não tocar / armadilhas:** não mexa no bloco de auth `:25-36` — é um dos **padrões corretos** do repositório
(citado na etapa 004). A chamada ao Resend passa por `safeFetch`: não acrescente tempo limite. O
`error.message` de `:69` e o repasse de `:60-61` são B-06, etapa 172; o CORS `*` de `:6` é a etapa 181.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** e-mails com destinatário em formato incomum (vários endereços num campo, por
exemplo) passam a ser recusados — confira se alguma tela manda lista em `to` antes de escolher o padrão.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'resend-email' src/ | head
grep -n 'requireString' supabase/functions/resend-email/index.ts
```

Esperado: os três campos validados. Depois do deploy, `"to":"semarroba"` deve devolver 400 **sem** chamar o
provedor (confira nos logs da função que não houve requisição ao Resend).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 151 — `melhor-envio-api`: validar o corpo da cotação

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/melhor-envio-api/index.ts:59` faz o parse do corpo e segue para os
`case` sem validar os campos de cotação (CEPs, peso, dimensões, valor declarado).
**Causa raiz:** parse do corpo sem validação.
**Caminho recomendado:** valide por caminho, dentro de cada `case`, com `requireString` (CEP com `pattern` de
8 dígitos) e `requireNumber` (peso e dimensões com `min`), importando como `external-db-bridge/index.ts:4`.
Devolva `validationErrorResponse` para `ValidationError`. **Atalho tentador a evitar:** validar tudo de uma
vez no alto do arquivo, para todos os `case`. Os `case` pedem campos diferentes; a validação única exige
campo que um deles não usa e quebra o caminho que funcionava.
**Arquivos e objetos a tocar:** `supabase/functions/melhor-envio-api/index.ts` (`:59` e os `case` tocados)
**Não tocar / armadilhas:** o arquivo tem ~355 linhas e vários `case`, e a auditoria leu só o bloco de auth e
o primeiro `case` — **releia o arquivo inteiro antes**. Não toque em `useSandbox` (`:59-61`, etapa 008) nem
no bloco de auth `:43-49` (etapa 009): as duas etapas podem já ter mudado essas linhas e **exigem o dono**.
Se as etapas 008/009 ainda estiverem abertas, faça a sua mudança sem encostar nessas linhas.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** cotações com campo faltando passam a receber 400 em vez de erro do parceiro.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'case \|requireString\|requireNumber' supabase/functions/melhor-envio-api/index.ts | head -30
```

Esperado: cada `case` tocado valida os campos que usa. Depois do deploy, uma cotação sem CEP de destino deve
devolver 400 com o nome do campo; registre a resposta.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 152 — `lalamove-tracking`: validar o identificador de rastreio

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/lalamove-tracking/index.ts:91` faz o parse do corpo e usa o
identificador do pedido sem validar tipo nem formato.
**Causa raiz:** parse do corpo sem validação.
**Caminho recomendado:** `requireString` para o identificador, com `maxLength` e, se o formato da Lalamove
for conhecido, `pattern`; import no modelo de `external-db-bridge/index.ts:4`, e
`validationErrorResponse` no `catch`. **Atalho tentador a evitar:** aceitar um array de identificadores "já
que dá no mesmo". Muda o contrato da função e o custo da chamada ao parceiro; se o lote for necessário, é
decisão do dono e etapa própria.
**Arquivos e objetos a tocar:** `supabase/functions/lalamove-tracking/index.ts` (`:91`)
**Não tocar / armadilhas:** a chamada à Lalamove passa por `safeFetch` (tempo limite e disjuntor já
resolvidos) — não acrescente nada ali.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** chamadas sem o identificador passam a receber 400. `git revert`. Merge publica em
produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '85,100p' supabase/functions/lalamove-tracking/index.ts
```

Esperado: o identificador validado antes do uso. Depois do deploy, corpo vazio deve devolver 400; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 153 — `ai-logistics-assistant`: validar e limitar o texto que vai para o modelo

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/ai-logistics-assistant/index.ts:71` faz o parse do corpo e manda o
conteúdo adiante sem validar tipo nem tamanho. Prompt sem teto é custo direto por token e caminho fácil para
esgotar a cota da conta.
**Causa raiz:** parse do corpo sem validação, num caminho que custa dinheiro por requisição.
**Caminho recomendado:** `requireString` no campo de texto com `maxLength` acordado (comece conservador e
registre o número no corpo da PR, para o dono ajustar), e `requireEnum` em qualquer campo que escolha modo ou
modelo. Import no modelo de `external-db-bridge/index.ts:4`. **Atalho tentador a evitar:** cortar o texto
silenciosamente com `slice`. A resposta sai truncada e ninguém sabe por quê; o 400 com o limite no erro é
honesto e barato.
**Arquivos e objetos a tocar:** `supabase/functions/ai-logistics-assistant/index.ts` (`:71`)
**Não tocar / armadilhas:** a chamada ao provedor de IA passa por `safeFetch` — não acrescente tempo limite.
Se existir rate limit no arquivo, mantenha-o.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** perguntas longas passam a ser recusadas; o teto é escolha de custo. `git revert`.
Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não (mas registre o teto escolhido na PR, porque é custo)
**Como verificar:**

```bash
grep -n 'requireString\|maxLength' supabase/functions/ai-logistics-assistant/index.ts
```

Esperado: o campo de texto validado com teto. Depois do deploy, um texto acima do teto deve devolver 400 com
o limite na mensagem; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 154 — `evolution-whatsapp`: validar `instance`, `phone` e `message`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/evolution-whatsapp/index.ts:62` lê o corpo e `:68` usa `instance`,
`phone` e `message` sem validação. Telefone em formato errado vira erro do provedor; `instance` livre escolhe
qual conexão de WhatsApp da empresa será usada.
**Causa raiz:** parse do corpo sem validação, num caminho que fala com o cliente pelo número oficial.
**Caminho recomendado:** `requireEnum(body, "instance", INSTANCIAS_PERMITIDAS)` com a lista no alto do
arquivo (desenho de `external-db-bridge/index.ts:8`), `requireString(body, "phone", { pattern: ... })` com o
formato E.164 que a Evolution espera, e `requireString(body, "message", { maxLength: ... })`. Import no
modelo de `external-db-bridge/index.ts:4`. **Atalho tentador a evitar:** normalizar o telefone "no melhor
esforço" (tirar caracteres, acrescentar DDI). Mensagem entregue ao número errado é pior que mensagem
recusada; recuse e deixe o chamador corrigir.
**Arquivos e objetos a tocar:** `supabase/functions/evolution-whatsapp/index.ts` (`:62` e `:68`)
**Não tocar / armadilhas:** não mexa no bloco de auth `:34-43` — é a etapa 006 e **exige o dono**; se ela
ainda estiver aberta, não encoste nessas linhas. Mantenha o rate limit. A chamada à Evolution passa por
`safeFetch`.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** envios com telefone fora do formato passam a ser recusados. `git revert`. Merge
publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '58,75p' supabase/functions/evolution-whatsapp/index.ts
grep -rn 'evolution-whatsapp' src/ | head
```

Esperado: os três campos validados e `instance` numa lista fechada. Depois do deploy, `"phone":"123"` deve
devolver 400 **sem** chamar a Evolution (confirme nos logs); registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 155 — `ocr-receipt-processor`: validar a entrada do comprovante

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-04
**Problema hoje:** `supabase/functions/ocr-receipt-processor/index.ts:23` faz o parse do corpo e segue sem
validar o que recebeu (caminho/identificador do arquivo ou conteúdo em base64, conforme o desenho real —
releia `:20-40`).
**Causa raiz:** parse do corpo sem validação, num caminho que lê arquivo e chama serviço de OCR.
**Caminho recomendado:** `requireString` no identificador do arquivo e `requireEnum` em qualquer campo de
tipo/modo; se a função aceita conteúdo embutido, imponha `maxLength` — o teto de tamanho é a proteção que
falta. Import no modelo de `external-db-bridge/index.ts:4`, `validationErrorResponse` no `catch`.
**Atalho tentador a evitar:** aceitar uma URL arbitrária para o arquivo. Isso é SSRF; se o desenho atual já
aceita URL, **não a valide com regex** — registre em `05-PROGRESSO.md` como achado novo e use `safeFetch`
(`_shared/safeFetch.ts:65`), que já bloqueia destino interno, em etapa própria com o dono.
**Arquivos e objetos a tocar:** `supabase/functions/ocr-receipt-processor/index.ts` (`:23`)
**Não tocar / armadilhas:** o `error.message` de `:82` é B-06 (etapa 178) e o CORS `*` de `:8` é a etapa 193.
Esta função também é citada em A-11 (dois caminhos de upload com padrões diferentes) — não unifique upload
aqui.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** chamadas incompletas passam a receber 400. `git revert`. Merge publica em produção
na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '18,40p' supabase/functions/ocr-receipt-processor/index.ts
```

Esperado: entrada validada antes de qualquer leitura de arquivo. Depois do deploy, corpo vazio deve devolver
400; registre a resposta.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 156 — Criar `_shared/invokeFunction.ts`: chamada entre funções com tempo limite

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-05
**Problema hoje:** as chamadas de função para função não têm tempo limite nenhum, de duas formas:
`fetch` nu para o próprio gateway (`normalize-freight-response/index.ts:195`,
`ingest-biosync/index.ts:65`) — em Deno, `fetch` sem sinal **não tem tempo limite** — e
`supabase.functions.invoke()`, que faz HTTP real e **não aceita** tempo limite
(`nexus-webhook-receiver/index.ts:141` e `:154`, `send-password-reset/index.ts:151`,
`predict-delays/index.ts:354`, `predict-delays-scheduled/index.ts:70`,
`accuracy-meta-monitor/index.ts:196` e `:215`, `accuracy-weekly-digest/index.ts:179`).
**Causa raiz:** `_shared/fetch-with-timeout.ts` existe e não é aplicado ao caminho interno; nenhuma função do
repositório faz isso hoje, então **não há exemplo a copiar** — é por isso que esta etapa cria o exemplo.
**Ordem, não negocie:** faça as etapas **132-141 (B-01 e B-02) antes** desta faixa. Tempo limite faz a
chamada interna ser abandonada e reenviada; sem a idempotência atômica e a chave determinística no lugar, o
reenvio duplica dado. A correção certa na ordem errada piora o sistema.
**Caminho recomendado:** crie `supabase/functions/_shared/invokeFunction.ts` com uma função
`invokeFunction(name, body, opts?)` que monte `${SUPABASE_URL}/functions/v1/${name}`, mande
`Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}` e `Content-Type: application/json`, e use
`fetchWithTimeout` de `_shared/fetch-with-timeout.ts:5` com padrão de 10 s — o mesmo padrão que
`_shared/safeFetch.ts` usa para terceiros (`:107-110`). Devolva um resultado explícito
(`{ ok, status, data }` ou `{ ok: false, reason: "timeout" }`), **sem lançar**, para que o chamador decida.
Registre em log o nome da função chamada e a duração. **Atalho tentador a evitar:** acrescentar retentativa
agora. Com ou sem B-01 resolvido, retentativa aqui multiplica a chamada interna; B-10 diz explicitamente que
retentativa só entra depois, e não é esta faixa. **Segundo atalho a evitar:** envolver
`supabase.functions.invoke()` numa corrida com `setTimeout`. A requisição HTTP continua aberta do outro lado;
você só deixa de esperar. Troque o `invoke` por este helper.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/invokeFunction.ts` (arquivo novo)
**Não tocar / armadilhas:** **não** use `safeFetch` para o gateway próprio — ele bloqueia destino interno por
desenho (proteção de SSRF) e vai recusar a URL do próprio projeto; é por isso que esta etapa existe em vez de
reaproveitá-lo. Não altere `_shared/fetch-with-timeout.ts` (o comentário dele é a etapa 201). Não altere
`_shared/safeFetch.ts` — as 36 chamadas a terceiros dependem dele e **já têm tempo limite e disjuntor**.
**Depende de:** 133, 134, 135, 136, 139, 140, 141 · **Libera:** 157, 158, 159, 160, 161, 162, 163
**Risco e como reverter:** baixo (código novo, ninguém usa ainda). `git revert`. Merge publica em produção na
hora (`.github/workflows/deploy-functions.yml:9-13`), sem efeito até a etapa 157.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'export async function invokeFunction' supabase/functions/_shared/invokeFunction.ts
grep -n 'fetchWithTimeout' supabase/functions/_shared/invokeFunction.ts
npx vitest run supabase/functions/_shared 2>&1 | tail -20
```

Esperado: o helper existe, usa `fetchWithTimeout`, e há teste cobrindo "estourou o tempo limite → devolve
`ok: false`, não lança". Confirme o deploy depois do merge.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 157 — `normalize-freight-response`: trocar o `fetch` nu para `whatsapp-notification`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-05
**Problema hoje:** `supabase/functions/normalize-freight-response/index.ts:195` chama
`${supabaseUrl}/functions/v1/whatsapp-notification` com `fetch` nu, dentro de um laço por usuário a notificar
(`:192-194`). Sem tempo limite, **um** usuário com envio travado prende o laço inteiro e a função morre por
limite de execução — ninguém é notificado.
**Causa raiz:** `fetch` sem sinal de aborto.
**Caminho recomendado:** troque por `invokeFunction` (etapa 156), mantendo exatamente o mesmo corpo e os
mesmos cabeçalhos que já estão em `:195-205`. Como está dentro de um laço, trate a falha **por usuário**:
conte quantos falharam, registre em log e siga o laço — não interrompa os outros envios.
**Atalho tentador a evitar:** `Promise.all` em todos os usuários "para ser mais rápido". Muda o
comportamento sob carga e dispara N chamadas simultâneas à função de WhatsApp; o problema desta etapa é
tempo limite, não paralelismo.
**Arquivos e objetos a tocar:** `supabase/functions/normalize-freight-response/index.ts` (`:195` e o
tratamento do erro no laço)
**Não tocar / armadilhas:** não mexa na montagem de `phoneByUser` (`:188-191`) nem no conteúdo da mensagem. O
`error.message` de `:217` é B-06 (etapa 178) e o CORS `*` de `:10` é a etapa 195.
**Depende de:** 156 · **Libera:** —
**Risco e como reverter:** envios lentos passam a ser abandonados em 10 s e contados como falha — é o
objetivo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'fetch(' supabase/functions/normalize-freight-response/index.ts
grep -n 'invokeFunction' supabase/functions/normalize-freight-response/index.ts
```

Esperado: nenhum `fetch(` nu no arquivo; `invokeFunction` no lugar. Depois do deploy, dispare uma
normalização e confirme nos logs a linha com a duração da chamada interna; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 158 — `ingest-biosync`: trocar o `fetch` nu para `bitrix24-integration`

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-05
**Problema hoje:** `supabase/functions/ingest-biosync/index.ts:65` chama
`${SUPABASE_URL}/functions/v1/bitrix24-integration` com `fetch` nu, no caminho do alerta **crítico** de
batimento (`:63`, `if (severity === "crit")`). Se o Bitrix estiver lento, o alerta crítico fica preso
esperando o CRM.
**Causa raiz:** `fetch` sem sinal de aborto.
**Caminho recomendado:** troque por `invokeFunction` (etapa 156), mantendo o mesmo corpo (`action`,
`deal_data`). O alerta ao motorista **não pode** depender do CRM: a gravação da telemetria e do log tático
(`:38-48`, `:55`) já aconteceu antes; portanto, falha ou tempo limite aqui deve apenas registrar em log e
**não** mudar a resposta da função. **Atalho tentador a evitar:** `await` sem tratamento "porque é só
notificação". É o `await` que prende o caminho crítico; trate o resultado e siga.
**Arquivos e objetos a tocar:** `supabase/functions/ingest-biosync/index.ts` (`:65` e o `catch` em volta)
**Não tocar / armadilhas:** não mexa na gravação de telemetria (`:38-48`) nem no log tático (`:55`) — a
dedupe desses inserts é a etapa 199. Validação de `heart_rate` é a etapa 148; `error.message` de `:92` é a
etapa 165; CORS `*` de `:6` é a etapa 192. Biometria é matéria de LGPD: não acrescente o valor do batimento a
log novo.
**Depende de:** 156 · **Libera:** —
**Risco e como reverter:** o alerta ao CRM pode ser abandonado em 10 s — e o alerta ao motorista deixa de
depender dele. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'fetch(\|invokeFunction' supabase/functions/ingest-biosync/index.ts
```

Esperado: nenhum `fetch(` nu; `invokeFunction` no lugar, com o resultado tratado sem alterar a resposta.
Depois do deploy, envie um payload `crit` e confirme nos logs a duração da chamada interna.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 159 — `nexus-webhook-receiver`: tempo limite nas duas chamadas internas dentro do webhook

**Onda / Severidade / Camada:** 5 / **Crítica** / edge function
**Achados resolvidos:** B-05
**Problema hoje:** `supabase/functions/nexus-webhook-receiver/index.ts:141` e `:154` chamam
`supabaseClient.functions.invoke('normalize-freight-response', ...)` **dentro do caminho do webhook**, e o
resultado (`normalizationResponse.data`) vai na resposta à transportadora (`:145-147`, `:157`). Se a
normalização travar, a resposta demora, a transportadora reenvia — e o reenvio cai direto em B-01 e B-02,
duplicando dado. É o ponto que mais importa de todo o B-05.
**Causa raiz:** `functions.invoke` não aceita tempo limite, e o caminho do webhook espera por ele.
**Caminho recomendado:** troque os dois `invoke` por `invokeFunction` (etapa 156) com tempo limite curto
(5 s é razoável aqui, porque do outro lado está a transportadora esperando) e, em caso de tempo limite,
responda **200 com `{ normalization: null }`** e registre em log: o evento **já foi reivindicado** pela
idempotência (etapas 138-140), então responder rápido é seguro e evita o reenvio. **Atalho tentador a
evitar:** manter o `await` e aumentar o limite de execução da função. Isso prende o webhook por mais tempo e
aumenta a janela de reenvio — o inverso do que se quer.
**Arquivos e objetos a tocar:** `supabase/functions/nexus-webhook-receiver/index.ts` (`:141` e `:154`, e as
respostas que usam `normalizationResponse.data`)
**Não tocar / armadilhas:** **confirme antes** que as etapas 138-140 estão aplicadas: sem a chave
determinística, responder rápido só acelera a duplicação. Não toque no HMAC `:36-44` (etapa 001) nem na
chave `:80` (etapa 140). O `error.message` de `:165` é a etapa 174; o CORS `*` de `:11` **não** tem etapa —
é webhook servidor-a-servidor, `*` é irrelevante ali.
**Depende de:** 140, 156 · **Libera:** —
**Risco e como reverter:** a resposta ao Nexus pode passar a vir sem o resultado da normalização. Confirme
com quem consome essa resposta (a normalização continua acontecendo do outro lado, de forma assíncrona) e
registre no corpo da PR. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'functions.invoke\|invokeFunction' supabase/functions/nexus-webhook-receiver/index.ts
```

Esperado: nenhum `functions.invoke`; `invokeFunction` com tempo limite nas duas chamadas. Depois do deploy,
dispare um evento e meça o tempo de resposta do webhook (`curl -w '%{time_total}'`): deve ficar abaixo do
tempo limite escolhido mesmo quando a normalização demora. Registre o número.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 160 — `send-password-reset`: tempo limite na chamada interna

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-05
**Problema hoje:** `supabase/functions/send-password-reset/index.ts:151` usa `functions.invoke` sem tempo
limite. Quem pediu a redefinição de senha fica esperando a função chamada; se ela travar, a tela do usuário
trava com ela.
**Causa raiz:** `functions.invoke` sem tempo limite, num caminho com pessoa esperando na frente da tela.
**Caminho recomendado:** troque por `invokeFunction` (etapa 156) com tempo limite curto e devolva à tela uma
resposta genérica de sucesso independentemente do resultado do envio — o padrão correto para redefinição de
senha, que **não** deve revelar se o e-mail existe nem se o envio funcionou. Registre a falha em log.
**Atalho tentador a evitar:** devolver à tela o erro do envio. Vira oráculo de existência de conta.
**Arquivos e objetos a tocar:** `supabase/functions/send-password-reset/index.ts` (`:151`)
**Não tocar / armadilhas:** este arquivo cita o ref morto `uwbpzfcysppwikfpnzok` (dívida registrada no
`AGENTS.md`) — **não** aproveite a PR para trocar o ref; é outra causa raiz e tem etapa própria na onda de
higiene. CORS `*` de `:6` é a etapa 185.
**Depende de:** 156 · **Libera:** —
**Risco e como reverter:** envio lento passa a ser abandonado; a tela continua recebendo sucesso.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'functions.invoke\|invokeFunction' supabase/functions/send-password-reset/index.ts
```

Esperado: `invokeFunction` com tempo limite; resposta à tela sem detalhe do envio. Depois do deploy, peça uma
redefinição e confirme o tempo de resposta e a linha de log; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 161 — `predict-delays` e `predict-delays-scheduled`: tempo limite nas chamadas internas

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-05
**Problema hoje:** `supabase/functions/predict-delays/index.ts:354` e
`supabase/functions/predict-delays-scheduled/index.ts:70` usam `functions.invoke` sem tempo limite. A versão
agendada roda sozinha: se a chamada travar, a execução agendada consome o limite de tempo e morre sem
registrar resultado — ninguém percebe, porque não há tela esperando.
**Causa raiz:** `functions.invoke` sem tempo limite.
**Caminho recomendado:** troque as duas por `invokeFunction` (etapa 156). Na versão agendada, registre em log
o resultado (sucesso, falha, tempo limite) **com contagem**, para que a execução deixe rastro do que não deu
certo. As duas funções mudam juntas porque é o mesmo par de chamadas e o mesmo desenho; são duas linhas.
**Atalho tentador a evitar:** mexer no modelo de previsão ou na consulta que alimenta o cálculo. Não é esta
etapa.
**Arquivos e objetos a tocar:** `supabase/functions/predict-delays/index.ts` (`:354`),
`supabase/functions/predict-delays-scheduled/index.ts` (`:70`)
**Não tocar / armadilhas:** o bloco de auth de `predict-delays-scheduled/index.ts:24-35` é um dos **padrões
corretos** do repositório (citado nas etapas 003 e 004) — não encoste nele. O `error.message` de
`predict-delays:389` é B-06 (etapa 178).
**Depende de:** 156 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'functions.invoke\|invokeFunction' supabase/functions/predict-delays/index.ts supabase/functions/predict-delays-scheduled/index.ts
```

Esperado: nenhum `functions.invoke` nos dois arquivos. Depois do deploy, dispare a função agendada e confirme
no log a linha de contagem; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 162 — `accuracy-meta-monitor`: tempo limite nas duas chamadas internas

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-05
**Problema hoje:** `supabase/functions/accuracy-meta-monitor/index.ts:196` e `:215` usam `functions.invoke`
sem tempo limite, em função de monitoramento que roda por agendamento. Monitor que trava é monitor que
deixa de avisar — e o silêncio parece "tudo bem".
**Causa raiz:** `functions.invoke` sem tempo limite.
**Caminho recomendado:** troque as duas por `invokeFunction` (etapa 156), com tempo limite, e faça cada
chamada registrar seu resultado separadamente, para que a segunda rode mesmo se a primeira estourar.
**Atalho tentador a evitar:** envolver as duas num só `try` com `await` sequencial sem tratamento. Uma falha
mata a outra verificação e o monitor fica cego pela metade.
**Arquivos e objetos a tocar:** `supabase/functions/accuracy-meta-monitor/index.ts` (`:196` e `:215`)
**Não tocar / armadilhas:** não mude o que a função monitora nem os limiares.
**Depende de:** 156 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'functions.invoke\|invokeFunction' supabase/functions/accuracy-meta-monitor/index.ts
```

Esperado: as duas chamadas com tempo limite e resultados registrados em separado. Depois do deploy, dispare a
função e confirme as duas linhas de log; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 163 — `accuracy-weekly-digest`: tempo limite na chamada interna

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-05
**Problema hoje:** `supabase/functions/accuracy-weekly-digest/index.ts:179` usa `functions.invoke` sem tempo
limite. O resumo semanal é enviado por agendamento: se a chamada travar, a semana passa sem resumo e sem
aviso de que faltou.
**Causa raiz:** `functions.invoke` sem tempo limite.
**Caminho recomendado:** troque por `invokeFunction` (etapa 156) e registre em log o resultado, nomeando a
semana a que o resumo se refere, para que a falta fique rastreável depois do fato.
**Atalho tentador a evitar:** reenviar na hora quando falhar. Retentativa só entra depois de B-01/B-02 (ver
B-10 e a etapa 201); aqui, registre a falha e deixe a próxima execução cuidar.
**Arquivos e objetos a tocar:** `supabase/functions/accuracy-weekly-digest/index.ts` (`:179`)
**Não tocar / armadilhas:** o `error.message` de `:237` é B-06 (etapa 178) e o CORS `*` de `:19` é a etapa
197 — etapas próprias, não resolva aqui.
**Depende de:** 156 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'functions.invoke\|invokeFunction' supabase/functions/accuracy-weekly-digest/index.ts
```

Esperado: `invokeFunction` com tempo limite e log do resultado. Depois do deploy, dispare a função e confirme
a linha de log; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 164 — Criar `_shared/httpError.ts`: uma resposta de erro que não vaza o detalhe interno

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-06
**Problema hoje:** não há envoltório padrão de erro em uso, e **22 das 44** funções montam o `catch` à mão
ecoando `error.message` ao cliente. Nas que fazem `throw` do erro do PostgREST
(`ingest-biosync/index.ts:50`, `scheduled-reports/index.ts:42`, `lgpd-erase-user`, `execute-protocol`), o
texto do Postgres chega ao chamador: **nome de tabela, nome de coluna, nome de restrição e texto de policy de
RLS**.
**Causa raiz:** cada função resolve o `catch` sozinha, e o que está mais à mão é devolver a mensagem.
**Caminho recomendado:** crie `supabase/functions/_shared/httpError.ts` com uma função
`internalErrorResponse(err, headers, tag)` que **loga** o detalhe (`log.error` de `_shared/logger.ts`, com o
`tag` da função) e **devolve** `{"error":"INTERNAL_ERROR"}` com status 500 — exatamente o que
`external-db-bridge/index.ts:367-375` faz, que é o padrão do repositório; outros dois corretos:
`secure-store/index.ts:91` e `carrier-webhook-receiver/index.ts:221-227`. Deixe o helper tratar
`ValidationError` devolvendo `validationErrorResponse` antes do genérico, para que as funções da faixa 146-155
usem um só `catch`. **Atalho tentador a evitar:** adotar `_shared/service-wrapper.ts`. Ele existe e
**nenhuma função o importa** (A-13); adotá-lo significa reescrever o `serve()` de 22 funções, o que é
reescrita, não correção. O destino do service-wrapper é decidido na onda de higiene — aqui não se encosta
nele. **Segundo atalho a evitar:** devolver "um resumo" do erro do banco. Qualquer fragmento do texto do
Postgres carrega nome de objeto; a mensagem para o cliente é genérica e o detalhe fica no log.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/httpError.ts` (arquivo novo)
**Não tocar / armadilhas:** não altere `_shared/validate.ts` (8 funções o usam) nem
`_shared/service-wrapper.ts`. Note que `grep '.stack'` nos `index.ts` devolve **zero** hoje — não introduza
pilha de execução em resposta nenhuma, nem em log de produção.
**Depende de:** — · **Libera:** 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178
**Risco e como reverter:** baixo (código novo, ninguém usa ainda). `git revert`. Merge publica em produção na
hora (`.github/workflows/deploy-functions.yml:9-13`), sem efeito até a etapa 165.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'export function internalErrorResponse' supabase/functions/_shared/httpError.ts
npx vitest run supabase/functions/_shared 2>&1 | tail -20
```

Esperado: o helper existe, com teste provando que a resposta **não** contém o texto do erro de entrada e que
o `log.error` recebeu o detalhe. Confirme o deploy depois do merge.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 165 — `ingest-biosync`: parar de devolver o erro do Postgres

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/ingest-biosync/index.ts:50` faz `throw` do erro do PostgREST e `:92`
devolve `error.message` ao chamador. Como a função grava em `bio_sync_telemetry` (`:38-48`) e
`nexus_tactical_logs` (`:55`), o que sai na resposta é o texto do Postgres com nome de tabela, de coluna e de
restrição.
**Causa raiz:** `catch` que ecoa a mensagem, sobre um `throw` de erro do banco.
**Caminho recomendado:** troque o `catch` de `:92` por `internalErrorResponse(err, headers, "ingest-biosync")`
(etapa 164) e, em `:50`, troque o `throw error` por um `throw` de erro **próprio** com mensagem interna
(o detalhe do Postgres vai para o `log.error`, não para o lançamento). Modelo:
`carrier-webhook-receiver/index.ts:221-227`.
**Atalho tentador a evitar:** manter um campo `details` "só para depuração". Em produção não existe "só para
depuração": o campo vai para quem chamou.
**Arquivos e objetos a tocar:** `supabase/functions/ingest-biosync/index.ts` (`:50` e `:92`)
**Não tocar / armadilhas:** biometria de motorista é matéria de LGPD (`docs/LGPD_COMPLIANCE.md`): ao mandar o
detalhe para o log, **não** inclua o valor do batimento nem identificador pessoal. Etapas vizinhas neste
arquivo: 148 (validação), 158 (tempo limite), 192 (CORS), 199 (dedupe) — uma PR por etapa.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** quem depende da mensagem para depurar perde o detalhe na resposta e passa a lê-lo
no log. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse' supabase/functions/ingest-biosync/index.ts
```

Esperado: nenhum `error.message` em corpo de resposta. Depois do deploy, force um erro de banco (por exemplo
um `vehicle_id` que viole a restrição) e confirme que a resposta é `{"error":"INTERNAL_ERROR"}` e que o
detalhe aparece no log; registre as duas evidências.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 166 — `scheduled-reports`: parar de devolver o erro do Postgres

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/scheduled-reports/index.ts:42` faz `throw` do erro do PostgREST
(logo depois do insert de `:38`) e `:127` devolve `error.message`. Com o insert espalhando o corpo do cliente
(B-03), o erro de coluna inexistente vira um mapa das colunas reais da tabela para quem está testando.
**Causa raiz:** `catch` que ecoa a mensagem.
**Caminho recomendado:** `internalErrorResponse(err, headers, "scheduled-reports")` (etapa 164) no `catch` de
`:127`, e erro próprio no `throw` de `:42`. Se as etapas 143-145 já estiverem aplicadas, o `catch` já trata
`ValidationError` — garanta que o erro de validação continue devolvendo 400 com o nome do campo, e **só** o
resto virar `INTERNAL_ERROR`.
**Atalho tentador a evitar:** devolver o `error.code` do Postgres "porque é só um código". `23505`, `23503` e
`42703` dizem ao chamador se a coluna existe e qual restrição ela tem.
**Arquivos e objetos a tocar:** `supabase/functions/scheduled-reports/index.ts` (`:42` e `:127`)
**Não tocar / armadilhas:** **não desfaça** o `user_id` vindo de `auth.claims.sub` (`:25`) nem o filtro
`.eq('user_id', userId)` de `:53`.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse' supabase/functions/scheduled-reports/index.ts
```

Esperado: nenhum `error.message` em resposta. Depois do deploy, envie um corpo que cause erro de banco e
confirme `{"error":"INTERNAL_ERROR"}` na resposta e o detalhe no log; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 167 — `lgpd-erase-user`: parar de devolver o erro do Postgres

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/lgpd-erase-user/index.ts:102` devolve `error.message` ao chamador, e a
função faz `throw` de erros do PostgREST. É a função de **apagamento de dado pessoal**: a mensagem do Postgres
lista as tabelas e as chaves estrangeiras que guardam dado do titular — o oposto do que uma rotina de LGPD
deve expor.
**Causa raiz:** `catch` que ecoa a mensagem.
**Caminho recomendado:** `internalErrorResponse(err, headers, "lgpd-erase-user")` (etapa 164). O log precisa
dizer **em qual passo** o apagamento parou (a rotina toca várias tabelas) sem repetir o texto do Postgres no
corpo da resposta; devolva ao chamador apenas "falhou" com um identificador de correlação, se já houver um no
arquivo. **Atalho tentador a evitar:** mudar a ordem dos apagamentos ou acrescentar `cascade` para "resolver
de uma vez". Deleção de dado é decisão do dono e esta etapa é só sobre a mensagem.
**Arquivos e objetos a tocar:** `supabase/functions/lgpd-erase-user/index.ts` (`:102` e os `throw` do
caminho)
**Não tocar / armadilhas:** não altere nada do que a função apaga nem a política de exclusão lógica por
`deleted_at` (`docs/SOFT_DELETE_POLICY.md`). Não registre em log o dado pessoal apagado — só o identificador
do titular e o passo.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse' supabase/functions/lgpd-erase-user/index.ts
```

Esperado: nenhum `error.message` em resposta. Depois do deploy, confirme no log que uma falha simulada
registra o passo; registre a evidência (sem dado pessoal na anotação).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 168 — `execute-protocol`: parar de devolver o erro do Postgres

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/execute-protocol/index.ts:59` devolve `error.message`, e a função faz
`throw` de erros do PostgREST. Como ela executa protocolo de automação sobre tabelas internas, a mensagem
descreve o modelo de dados dessas tabelas para quem chamar.
**Causa raiz:** `catch` que ecoa a mensagem.
**Caminho recomendado:** `internalErrorResponse(err, headers, "execute-protocol")` (etapa 164), com o detalhe
no log e o nome do protocolo que falhou. **Atalho tentador a evitar:** devolver o nome da tabela "para o
chamador saber o que corrigir". Quem chama corrige pelo nome do protocolo, não pelo nome da tabela.
**Arquivos e objetos a tocar:** `supabase/functions/execute-protocol/index.ts` (`:59` e os `throw` do
caminho)
**Não tocar / armadilhas:** o CORS `*` de `:5` é a etapa 191. Esta função é citada em A-08 ("Nexus
Self-Healing") — **não** mexa no que ela faz ou deixa de fazer aqui.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse' supabase/functions/execute-protocol/index.ts
```

Esperado: nenhum `error.message` em resposta. Depois do deploy, chame com um protocolo inexistente e confirme
a resposta genérica e o log com o nome do protocolo; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 169 — `lalamove-api`: parar de repassar a resposta de erro da Lalamove

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/lalamove-api/index.ts:53` e `:58` devolvem `details: errorText` — o
corpo de erro **do parceiro** — e `:169` devolve `error.message`. O que a Lalamove escreve no erro não é
controlado por este repositório: pode conter eco de cabeçalho, de URL com chave ou de credencial.
**Causa raiz:** resposta de terceiro repassada ao cliente como detalhe de erro.
**Caminho recomendado:** registre `errorText` no log (`log.error` com o `tag` da função e o status HTTP do
parceiro) e devolva ao chamador apenas um erro genérico com o **status** traduzido — por exemplo
"transportadora recusou a solicitação" para 4xx e "transportadora indisponível" para 5xx — usando
`internalErrorResponse` (etapa 164) para o caso não tratado. Modelo de resposta limpa:
`secure-store/index.ts:91`. **Atalho tentador a evitar:** filtrar o `errorText` procurando palavras como
"token" ou "key". Você não controla o formato do parceiro; a lista de palavras sempre fica atrás. Não
repasse.
**Arquivos e objetos a tocar:** `supabase/functions/lalamove-api/index.ts` (`:53`, `:58`, `:169`)
**Não tocar / armadilhas:** não mexa na chamada à Lalamove — `safeFetch` já cuida de tempo limite e
disjuntor (`_shared/safeFetch.ts:65`). A validação de `path`/`method` de `:78-81` é a etapa 149.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** quem usa o `details` para depurar passa a depender do log. Avise no corpo da PR
onde o detalhe passou a aparecer. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'errorText\|error.message\|internalErrorResponse' supabase/functions/lalamove-api/index.ts
```

Esperado: `errorText` aparece **apenas** em chamada de log. Depois do deploy, force um erro do parceiro (por
exemplo um id inexistente) e confirme que a resposta não traz texto da Lalamove e que o log traz; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 170 — `rodonaves-api`: parar de transformar o erro do **login** da Rodonaves em mensagem

**Onda / Severidade / Camada:** 5 / **Crítica** / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/rodonaves-api/index.ts:130-134` transforma o corpo de erro da
Rodonaves em `RTEError.message`, e esse erro sobe até `:1710-1714`, que o devolve ao chamador. A linha `:130`
é a resposta do **login** na Rodonaves: se a API devolver eco de credencial, ou a URL com chave na mensagem,
isso sai no corpo HTTP para quem chamou. É o pior ponto de B-06 e vai primeiro, antes do resto do arquivo.
**Causa raiz:** corpo de erro de autenticação de terceiro promovido a mensagem de exceção.
**Caminho recomendado:** em `:130-134`, **pare de ler o corpo para a mensagem**: registre o status HTTP e o
corpo em `log.error` e lance um erro com mensagem fixa (por exemplo `"RTE_AUTH_FAILED"`), sem interpolar nada
do parceiro. O chamador já traduz exceção em resposta; com a mensagem fixa, nada do parceiro atravessa.
**Atalho tentador a evitar:** mascarar só a parte que "parece" credencial. Formato de terceiro muda sem
aviso; a mensagem fixa é o que garante.
**Arquivos e objetos a tocar:** `supabase/functions/rodonaves-api/index.ts` (apenas `:130-134`)
**Não tocar / armadilhas:** o arquivo tem ~1.700 linhas; **não** aproveite a PR para os outros pontos
(`:189`, `:222`, `:637`, `:1710-1714`) — são a etapa 171, e PR pequena aqui é o que permite revisar este
ponto com atenção. Não mexa no fluxo de obtenção/renovação de token nem no cache dele.
**Depende de:** 164 · **Libera:** 171
**Risco e como reverter:** quem depura o login da Rodonaves passa a precisar do log. `git revert`. Merge
publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '125,140p' supabase/functions/rodonaves-api/index.ts
```

Esperado: nenhuma interpolação de corpo de resposta na mensagem do erro lançado em `:130-134`; o corpo
aparece só em `log.error`. Depois do deploy, force uma falha de login (credencial inválida em ambiente de
teste, **sem** alterar o segredo de produção) ou confirme pela leitura do código e registre o método usado —
se não puder forçar, anote como RASTREADO, não EXECUTADO.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 171 — `rodonaves-api`: erro genérico na resposta e detalhe só no log

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/rodonaves-api/index.ts:189`, `:222` e `:637` também transformam corpo
de erro da transportadora em `RTEError.message`, e `:1710-1714` devolve essa mensagem ao chamador.
**Causa raiz:** a mesma da etapa 170, nos demais pontos do arquivo.
**Caminho recomendado:** repita nos três pontos o desenho que você deixou na etapa 170 (log do corpo +
mensagem fixa por tipo de falha, por exemplo `"RTE_QUOTE_FAILED"`), e em `:1710-1714` troque a devolução da
mensagem por `internalErrorResponse(err, headers, "rodonaves-api")` (etapa 164), mapeando os códigos fixos
para mensagens em português que o front possa mostrar. **Atalho tentador a evitar:** criar um dicionário de
tradução do texto da Rodonaves para português. Você passa a depender do texto do parceiro; depende do
**código** que você mesmo lançou.
**Arquivos e objetos a tocar:** `supabase/functions/rodonaves-api/index.ts` (`:189`, `:222`, `:637`,
`:1710-1714`)
**Não tocar / armadilhas:** arquivo de ~1.700 linhas: **releia cada ponto antes** e confirme que a etapa 170
já está aplicada em `:130-134`. R-04 (erro invisível na sincronização com a Rodonaves) tem etapa própria —
não mexa na tela nesta PR. Se o front hoje mostra a mensagem do parceiro, a mudança muda o texto na tela:
verifique `grep -rn 'rodonaves-api' src/` e registre no corpo da PR.
**Depende de:** 164, 170 · **Libera:** —
**Risco e como reverter:** telas que mostram a mensagem do parceiro passam a mostrar o texto genérico.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'rodonaves-api' src/ | head
sed -n '1705,1720p' supabase/functions/rodonaves-api/index.ts
```

Esperado: a resposta de erro não contém texto do parceiro. Depois do deploy, force um erro de cotação e
compare resposta (genérica) com log (detalhada); registre as duas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 172 — `resend-email`: parar de repassar o erro do provedor de e-mail

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/resend-email/index.ts:60-61` repassa a resposta de erro do Resend e
`:69` devolve `error.message`. O erro do provedor pode conter o endereço de destino, o id da chave usada e o
domínio de envio.
**Causa raiz:** resposta de terceiro repassada como detalhe de erro.
**Caminho recomendado:** registre a resposta do Resend em `log.error` com o status, e devolva ao chamador
apenas "não foi possível enviar o e-mail", usando `internalErrorResponse` (etapa 164) no `catch` de `:69`.
**Atalho tentador a evitar:** devolver o `id` da tentativa do provedor "para rastrear". O identificador do
provedor pertence ao log; para o chamador, use um identificador seu, se precisar.
**Arquivos e objetos a tocar:** `supabase/functions/resend-email/index.ts` (`:60-61` e `:69`)
**Não tocar / armadilhas:** não mexa no bloco de auth `:25-36` — é **padrão correto** citado na etapa 004. A
validação de `to`/`subject`/`html` é a etapa 150 e o CORS `*` de `:6` é a etapa 181.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse' supabase/functions/resend-email/index.ts
sed -n '55,72p' supabase/functions/resend-email/index.ts
```

Esperado: nada do corpo do Resend na resposta. Depois do deploy, envie para um domínio inválido e confirme a
resposta genérica e o detalhe no log; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 173 — `db-health-weekly-report`: parar de repassar o erro do terceiro no relatório

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/db-health-weekly-report/index.ts:225-226` repassa a resposta de erro
do terceiro (envio do relatório). A função roda por agendamento e não tem CORS (o que é correto, por
desenho), mas o corpo de erro do parceiro vai para onde o relatório for entregue.
**Causa raiz:** resposta de terceiro usada como detalhe de erro.
**Caminho recomendado:** registre a resposta em `log.error` e devolva/registre no relatório apenas "falha no
envio" com o status HTTP. Use `internalErrorResponse` (etapa 164) no `catch`, se houver um.
**Atalho tentador a evitar:** acrescentar o corpo do erro ao conteúdo do relatório "porque é interno". O
relatório vai para canal de mensagem (Slack/e-mail) e sai do perímetro da função.
**Arquivos e objetos a tocar:** `supabase/functions/db-health-weekly-report/index.ts` (`:225-226`)
**Não tocar / armadilhas:** **não** acrescente CORS a esta função — ela é chamada por agendamento e a
ausência de CORS é registrada como ponto limpo em B-07. Não mude o conteúdo nem a periodicidade do relatório.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '220,230p' supabase/functions/db-health-weekly-report/index.ts
```

Esperado: o corpo de erro do terceiro aparece só em log. Depois do deploy, aguarde (ou dispare) uma execução
e confirme o conteúdo entregue; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 174 — `nexus-webhook-receiver`: erro genérico na resposta ao webhook

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/nexus-webhook-receiver/index.ts:165` devolve `error.message` na
resposta ao chamador do webhook.
**Causa raiz:** `catch` que ecoa a mensagem.
**Caminho recomendado:** `internalErrorResponse(err, headers, "nexus-webhook-receiver")` (etapa 164), no
mesmo desenho de `carrier-webhook-receiver/index.ts:221-227` — que é o outro webhook e já faz isso certo.
Mantenha o status 500 para falha real: a origem **precisa** reenviar nesse caso, e com B-01/B-02 corrigidos o
reenvio é seguro. **Atalho tentador a evitar:** devolver 200 em erro "para a transportadora não reenviar".
Isso descarta evento de verdade em silêncio.
**Arquivos e objetos a tocar:** `supabase/functions/nexus-webhook-receiver/index.ts` (`:165`)
**Não tocar / armadilhas:** não toque no HMAC `:36-44` (etapa 001), na chave `:80` (etapa 140) nem nos
`invoke` de `:141`/`:154` (etapa 159).
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse' supabase/functions/nexus-webhook-receiver/index.ts
```

Esperado: nenhum `error.message` em resposta. Depois do deploy, envie um payload que cause erro e confirme
resposta genérica com 500 e detalhe no log; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 175 — `lalamove-webhook`: erro genérico na resposta ao webhook

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/lalamove-webhook/index.ts:201` devolve `error.message` com status 500.
Como a função grava em tabelas de rastreamento, o erro do Postgres descreve essas tabelas para quem puder
chamar o webhook.
**Causa raiz:** `catch` que ecoa a mensagem.
**Caminho recomendado:** `internalErrorResponse(err, headers, "lalamove-webhook")` (etapa 164), mantendo o
status 500 (ver o raciocínio da etapa 174). Modelo:
`carrier-webhook-receiver/index.ts:221-227`.
**Atalho tentador a evitar:** aproveitar a PR para checar os erros dos inserts de negócio (`:122`, `:145`,
`:159`, `:178`), que hoje não são verificados. É defeito real: anote em "Achados novos" no progresso.
**Arquivos e objetos a tocar:** `supabase/functions/lalamove-webhook/index.ts` (apenas o `catch` em `:199-204`)
**Não tocar / armadilhas:** confirme antes se as etapas 133, 134 e 139 já mudaram este arquivo — releia o
`catch` atual. Não mexa no bloco de idempotência nem na chave.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse' supabase/functions/lalamove-webhook/index.ts
```

Esperado: nenhum `error.message` em resposta. Depois do deploy, confirme com um payload inválido; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 176 — `rodonaves-webhook`: erro genérico na resposta ao webhook

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/rodonaves-webhook/index.ts:231` devolve `error.message` com status
500, e o `throw updateError` de `:198` manda para lá o erro cru do PostgREST do `update` da entrega — nome de
tabela, de coluna e texto de policy.
**Causa raiz:** `catch` que ecoa a mensagem, sobre um `throw` de erro do banco.
**Caminho recomendado:** `internalErrorResponse(err, headers, "rodonaves-webhook")` (etapa 164) no `catch`, e
em `:198` troque `throw updateError` por um `throw` de erro próprio com o detalhe mandado ao `log.error`.
Mantenha o status 500. **Atalho tentador a evitar:** trocar o `throw` por um `return` de sucesso para
"simplificar". Falha de atualização da entrega **precisa** ser falha, ou a transportadora nunca reenvia.
**Arquivos e objetos a tocar:** `supabase/functions/rodonaves-webhook/index.ts` (`:198` e o `catch` em
`:228-234`)
**Não tocar / armadilhas:** não toque na chave de dedupe `:124-127` (é o padrão de referência de B-02) nem no
bloco que as etapas 135/136 mudaram. O `insert` em `ocorrencias` de `:202` sem checagem de erro é achado novo
— anote, não corrija.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse\|throw updateError' supabase/functions/rodonaves-webhook/index.ts
```

Esperado: nenhum `error.message` em resposta e nenhum `throw` de erro do PostgREST. Depois do deploy,
confirme com um payload cuja entrega não exista; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 177 — `smart-carrier-selection`: erro genérico na resposta da cotação

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-06
**Problema hoje:** `supabase/functions/smart-carrier-selection/index.ts:242` devolve `error.message`. A
função lê tabelas de transportadora e de tarifa; o erro descreve esse modelo para quem chamar.
**Causa raiz:** `catch` que ecoa a mensagem.
**Caminho recomendado:** `internalErrorResponse(err, headers, "smart-carrier-selection")` (etapa 164),
tratando `ValidationError` antes (se a etapa 146 já estiver aplicada, ela já deixou esse caminho pronto — use
o mesmo `catch`). **Atalho tentador a evitar:** devolver "nenhuma transportadora encontrada" para qualquer
erro. Confunde falha de sistema com resultado vazio, e o front mostra a coisa errada ao operador.
**Arquivos e objetos a tocar:** `supabase/functions/smart-carrier-selection/index.ts` (`:242`)
**Não tocar / armadilhas:** não mude a regra de escolha de transportadora nem os pesos do cálculo —
`docs/agentes/regras-dominio.md` cobre isso e é matéria de negócio.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'error.message\|internalErrorResponse' supabase/functions/smart-carrier-selection/index.ts
```

Esperado: nenhum `error.message` em resposta, e erro de validação continuando a devolver 400 com o campo.
Depois do deploy, confirme com um corpo que cause falha de banco; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 178 — Varredura final de `error.message`: as onze funções restantes de B-06

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-06
**Problema hoje:** depois das etapas 165-177, continuam ecoando `error.message` ao cliente:
`whatsapp-notification:318` · `bitrix24-integration:398` · `get-weather-data:42` · `health-check:51` ·
`ocr-receipt-processor:82` · `predict-delays:389` · `nexus-auto-healing:110` · `new-device-alert:202` ·
`check-rate-limit:144` · `normalize-freight-response:217` · `accuracy-weekly-digest:237`. São as de menor
exposição de modelo de dados — por isso vêm por último —, mas são 11 das 22 do achado.
**Causa raiz:** a mesma de todas: `catch` montado à mão em cada função.
**Caminho recomendado:** aplique `internalErrorResponse` (etapa 164) nos onze pontos, **uma linha por
arquivo**, sem tocar em mais nada em nenhum deles. Esta é a única etapa do lote que agrupa funções, e só
porque a mudança é idêntica e mecânica; se qualquer arquivo exigir mais do que trocar o `catch`, **pare
nesse arquivo**, registre em `05-PROGRESSO.md` e siga com os outros. **Atalho tentador a evitar:** aproveitar
a varredura para padronizar o resto do `catch` (log, status, formato de resposta) nos onze. É aí que uma PR
mecânica vira reescrita de onze funções e deixa de ser revisável.
**Arquivos e objetos a tocar:** os onze `index.ts` citados, apenas na linha indicada de cada um
**Não tocar / armadilhas:** `check-rate-limit` e `health-check` são chamadas por outras funções e por
monitoramento: mantenha o **status HTTP** de cada resposta como está hoje, só troque o corpo. Em
`normalize-freight-response` e `accuracy-weekly-digest`, confirme antes se as etapas 157 e 163 já mudaram o
arquivo. `get-weather-data` e `health` não entram em B-07 (não manipulam dado), mas entram aqui.
**Depende de:** 164 · **Libera:** —
**Risco e como reverter:** onze funções publicadas de uma vez; se alguma resposta era consumida pelo front
como texto, a tela passa a mostrar a mensagem genérica. Rode `grep -rn '<nome-da-funcao>' src/` para cada uma
antes e registre no corpo da PR. `git revert`. Merge publica as onze em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'error.message' supabase/functions/*/index.ts | grep -v '_shared' | grep -v 'log\.'
```

Esperado: **zero** ocorrências de `error.message` dentro de corpo de resposta em todas as 44 funções (as que
sobrarem devem estar em chamada de `log.`). Confirme o deploy das onze e registre o horário.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 179 — `secure-store`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / **Crítica** / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/secure-store/index.ts:10` escreve
`"Access-Control-Allow-Origin": "*"` no próprio arquivo, ignorando `ALLOWED_ORIGINS`. Esta é a função que
**guarda segredo**: com `*`, qualquer página da internet faz a requisição usando a sessão do visitante que
está logado no sistema e **lê a resposta**. É a mais grave das 25 e vai primeiro.
**Causa raiz:** cabeçalho de CORS escrito à mão em cada função, em vez do helper que resolve a origem.
`supabase/functions/_shared/cors.ts:30-45` existe e é importado por 16 das 44.
**Caminho recomendado:** importe `getCorsHeaders` de `../_shared/cors.ts` exatamente como
`supabase/functions/external-db-bridge/index.ts:2` faz, calcule `const headers = getCorsHeaders(req)` no topo
do `serve`, e use `headers` em **todas** as respostas — inclusive no preflight `OPTIONS` e nos caminhos de
erro. **Antes de mergear, confirme com o dono que `ALLOWED_ORIGINS` está configurado nas edge functions**:
`_shared/cors.ts:33-35` devolve `*` quando a lista contém `*`, e `:45` cai em `list[0] || "*"` quando a
variável está vazia — sem a variável, a troca não muda nada. Essa confirmação é parte desta etapa e é o que a
torna de aprovação humana. **Atalho tentador a evitar:** usar a constante `corsHeaders` exportada em
`_shared/cors.ts:24-27`. Ela é estática (`allowedOrigins()[0]`), não olha a origem da requisição e existe só
por compatibilidade com as funções antigas; quem precisa de mais de uma origem (produção e pré-visualização
do Vercel) fica travado nela.
**Arquivos e objetos a tocar:** `supabase/functions/secure-store/index.ts` (`:10` e as respostas)
**Não tocar / armadilhas:** **não** altere `_shared/cors.ts` — 16 funções dependem dele. Não toque no
`catch` de `:91`: ele é um dos três **padrões corretos** de erro sem vazamento, citado em B-06. Todas as 44
funções já tratam `OPTIONS`: mantenha o bloco, só troque os cabeçalhos.
**Depende de:** — · **Libera:** 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194,
195, 196, 197, 198
**Risco e como reverter:** se `ALLOWED_ORIGINS` não listar a origem real do front, **a tela quebra** com erro
de CORS. Confirme a lista antes e teste o front depois do deploy. `git revert`. Merge publica em produção na
hora (`.github/workflows/deploy-functions.yml:9-13`).
**Precisa de aprovação humana antes do merge:** sim (depende de confirmar a variável de ambiente
`ALLOWED_ORIGINS`, e um valor errado derruba o front)
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/secure-store/index.ts
```

Esperado: nenhum `"*"` literal; `getCorsHeaders(req)` em todas as respostas. Depois do deploy, uma
requisição com `Origin: https://exemplo-malicioso.test` deve voltar **sem** `Access-Control-Allow-Origin`
para essa origem, e o front em `https://loggi-flow-v2.vercel.app` deve continuar funcionando — teste os dois
e registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 180 — `get-mapbox-token`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / **Crítica** / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/get-mapbox-token/index.ts:4` fixa `"*"`. A função **entrega o token do
Mapbox**: com `*`, qualquer página pega o token usando a sessão do visitante e passa a consumir a cota da
conta (S-08 registra que o token não tem restrição de domínio verificada).
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** igual à etapa 179 — `getCorsHeaders(req)` no modelo de
`external-db-bridge/index.ts:2`, em todas as respostas. Repita aqui exatamente o que ficou na 179, para que
as duas funções mais sensíveis tenham o mesmo desenho. **Atalho tentador a evitar:** restringir o CORS e
considerar S-08 resolvido. CORS não protege o token depois de entregue; a restrição de domínio no painel do
Mapbox é etapa própria, de infraestrutura.
**Arquivos e objetos a tocar:** `supabase/functions/get-mapbox-token/index.ts` (`:4` e as respostas)
**Não tocar / armadilhas:** não altere `_shared/cors.ts`. O token é `VITE_`-público por desenho do front —
**não** o remova nem mude a forma de entrega nesta etapa.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** se a lista de origens estiver incompleta, o mapa para de carregar no front.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não (a confirmação de `ALLOWED_ORIGINS` é a etapa 179)
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/get-mapbox-token/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, abra uma tela com mapa no front e confirme que carrega;
teste também uma origem estranha e confirme a recusa. Registre as duas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 181 — `resend-email`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/resend-email/index.ts:6` fixa `"*"`. Com `*`, uma página qualquer
dispara envio de e-mail pela conta da empresa usando a sessão de quem está logado.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas, inclusive o preflight e os caminhos de erro. **Atalho tentador a evitar:** usar a constante
estática `corsHeaders` de `_shared/cors.ts:24-27` (ver etapa 179).
**Arquivos e objetos a tocar:** `supabase/functions/resend-email/index.ts` (`:6` e as respostas)
**Não tocar / armadilhas:** não mexa no bloco de auth `:25-36` (padrão correto, citado na etapa 004). Se as
etapas 150 e 172 já mudaram o arquivo, releia antes.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** telas que enviam e-mail quebram se a origem não estiver na lista. `git revert`.
Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/resend-email/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, envie um e-mail pela tela que usa a função e confirme;
registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 182 — `whatsapp-notification`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/whatsapp-notification/index.ts:7` fixa `"*"`. Com `*`, uma página
qualquer manda WhatsApp pelo número oficial da empresa usando a sessão do visitante.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** deixar `*` "porque a função já exige autenticação". Exatamente o
oposto: é a sessão do visitante autenticado que a página de fora usa — autenticação não substitui CORS.
**Arquivos e objetos a tocar:** `supabase/functions/whatsapp-notification/index.ts` (`:7` e as respostas)
**Não tocar / armadilhas:** esta função é chamada **por outra função** (`normalize-freight-response:195`,
etapa 157): chamada servidor-a-servidor não manda `Origin` e continua funcionando — mas confirme que a
resposta do preflight não é exigida nesse caminho. O `error.message` de `:318` é a etapa 178.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** telas de notificação quebram se a origem não estiver na lista. `git revert`. Merge
publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/whatsapp-notification/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, dispare uma notificação pelo front **e** uma normalização
(que chama esta função de servidor), confirmando que os dois caminhos seguem funcionando; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 183 — `push-send`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/push-send/index.ts:12` fixa `"*"`. Com `*`, uma página qualquer dispara
notificação push para os dispositivos inscritos — inclusive com `topic: "all"`, que a própria função aceita
(`:1-2`).
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** restringir só o caminho `topic: "all"`. O envio dirigido também
incomoda o usuário e gasta cota; o controle é de origem, não de alvo.
**Arquivos e objetos a tocar:** `supabase/functions/push-send/index.ts` (`:11-15` e as respostas)
**Não tocar / armadilhas:** não mexa no rate limit (`checkRateLimit`, importado em `:9`) nem na chamada
`webpush.sendNotification` de `:160` — o tempo limite dela é a etapa 200.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** o botão de teste de push no front quebra se a origem não estiver na lista.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/push-send/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, envie um push pelo front e confirme o recebimento;
registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 184 — `new-device-alert`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/new-device-alert/index.ts:8` fixa `"*"`. É a função que avisa o usuário
sobre acesso de dispositivo novo: com `*`, uma página de fora consegue disparar — ou provocar — esse aviso
usando a sessão do visitante, o que serve de isca para phishing ("confirme seu acesso").
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** nenhuma exceção "porque é alerta de segurança". Função de segurança
disparável de fora é ferramenta de engenharia social.
**Arquivos e objetos a tocar:** `supabase/functions/new-device-alert/index.ts` (`:8` e as respostas)
**Não tocar / armadilhas:** não mude o conteúdo do alerta nem o canal de envio. O `error.message` de `:202` é
a etapa 178.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** o aviso para de ser disparado pelo front se a origem não estiver na lista.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/new-device-alert/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, faça um login de dispositivo novo e confirme que o aviso
chega; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 185 — `send-password-reset`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/send-password-reset/index.ts:6` fixa `"*"`. Com `*`, qualquer página
dispara redefinição de senha para um e-mail escolhido por ela, pelo domínio da empresa.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas — inclusive na resposta genérica de sucesso. **Atalho tentador a evitar:** confiar no rate limit
como substituto. Ele limita volume, não origem: um pedido por vítima já basta.
**Arquivos e objetos a tocar:** `supabase/functions/send-password-reset/index.ts` (`:6` e as respostas)
**Não tocar / armadilhas:** este arquivo cita o ref morto `uwbpzfcysppwikfpnzok` — **não** troque o ref aqui
(dívida com etapa própria). O `functions.invoke` de `:151` é a etapa 160.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** a tela de "esqueci minha senha" quebra se a origem não estiver na lista — teste
**essa tela** especificamente depois do deploy, porque ela é usada por quem não está logado. `git revert`.
Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/send-password-reset/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, peça uma redefinição pela tela pública e confirme que
funciona; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 186 — `validate-login`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/validate-login/index.ts:7` fixa `"*"`. Com `*`, uma página de fora
testa credenciais contra esta função e **lê a resposta** — é um oráculo de login servido pelo próprio
sistema.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** manter `*` porque "a função é chamada antes do login e não tem
sessão". Falta de sessão não é falta de risco: aqui o valor para quem ataca é justamente **ler a resposta**
de outra origem.
**Arquivos e objetos a tocar:** `supabase/functions/validate-login/index.ts` (`:7` e as respostas)
**Não tocar / armadilhas:** esta função é usada na tela de login, por usuário **não** autenticado: a origem
do front precisa estar em `ALLOWED_ORIGINS`, incluindo a origem de pré-visualização se o time usa. Não mexa
na lógica de validação.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** **a tela de login quebra** se a lista estiver incompleta — é o maior risco de
front de toda a faixa. Teste o login logo depois do deploy. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/validate-login/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, faça um login completo em
`https://loggi-flow-v2.vercel.app` e registre o resultado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 187 — `log-login-attempt`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/log-login-attempt/index.ts:6` fixa `"*"`. Com `*`, qualquer página
escreve registros de tentativa de login — polui a trilha de auditoria e pode disparar bloqueio por tentativa
indevida contra um usuário legítimo.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** "é só log, não vale a etapa". Log de segurança envenenado é pior que
log ausente: decisões de bloqueio saem dele.
**Arquivos e objetos a tocar:** `supabase/functions/log-login-attempt/index.ts` (`:6` e as respostas)
**Não tocar / armadilhas:** é chamada na tela de login (sem sessão): a origem do front precisa estar na
lista. Não mude o que é gravado.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** o registro para de ser gravado pelo front se a origem não estiver na lista — e a
falha é silenciosa para o usuário. Teste o login depois do deploy. `git revert`. Merge publica em produção na
hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/log-login-attempt/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, faça um login e confirme que a tentativa foi registrada
(consulte a tabela de tentativas pelo horário); registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 188 — `log-security-event`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/log-security-event/index.ts:9` fixa `"*"`. Com `*`, qualquer página
insere eventos na trilha de segurança usando a sessão do visitante.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** mexer no `user_id` forçado a partir das claims em `:64-66`. Isso é
**padrão correto** do repositório, citado nas etapas 003, 005 e 007 — não encoste.
**Arquivos e objetos a tocar:** `supabase/functions/log-security-event/index.ts` (`:9` e as respostas)
**Não tocar / armadilhas:** `:64-66` (o `user_id` das claims) fica como está. Não mude o conjunto de eventos
aceitos.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** o front deixa de registrar evento se a origem não estiver na lista. `git revert`.
Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/log-security-event/index.ts
```

Esperado: nenhum `"*"` literal e `:64-66` intacto. Depois do deploy, provoque um evento pelo front e confirme
a gravação; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 189 — `check-password-breach`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/check-password-breach/index.ts:6` fixa `"*"`. Com `*`, qualquer página
usa esta função como serviço gratuito de consulta de senha vazada, gastando a cota da conta e usando o
sistema como intermediário para testar senhas de terceiros.
**Causa raiz:** cabeçalho de CORS escrito à mão, em vez do helper que resolve a origem
(`_shared/cors.ts:30-45`, importado por 16 das 44 funções).
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas, inclusive o preflight e os caminhos de erro. **Atalho tentador a evitar:** usar a constante
estática `corsHeaders` de `_shared/cors.ts:24-27` — ela não olha a origem da requisição (ver etapa 179).
**Arquivos e objetos a tocar:** `supabase/functions/check-password-breach/index.ts` (`:6` e as respostas)
**Não tocar / armadilhas:** a chamada ao HIBP passa por `safeFetch` (`_shared/safeFetch.ts:65`), com tempo
limite e disjuntor — não acrescente nada ali. A função é usada na tela de cadastro/troca de senha, que pode
ser acessada **sem** sessão: a origem do front precisa estar em `ALLOWED_ORIGINS`.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** a verificação de senha vazada para de funcionar no front se a origem não estiver na
lista, e a tela de cadastro pode travar. Teste o cadastro depois do deploy. `git revert`. Merge publica em
produção na hora (`.github/workflows/deploy-functions.yml:9-13`).
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/check-password-breach/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, troque uma senha pelo front e confirme que a verificação
responde; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 190 — `bitrix24-integration`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/bitrix24-integration/index.ts:7` fixa `"*"`. Com `*`, uma página de
fora cria ou altera registro no CRM da empresa usando a sessão do visitante logado.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** manter `*` porque a função também é chamada de servidor
(`ingest-biosync/index.ts:65`, etapa 158). Chamada servidor-a-servidor **não manda `Origin`** e não é afetada
pela restrição; não há conflito.
**Arquivos e objetos a tocar:** `supabase/functions/bitrix24-integration/index.ts` (`:7` e as respostas)
**Não tocar / armadilhas:** a chamada ao Bitrix24 passa por `safeFetch` — não acrescente tempo limite. O
`error.message` de `:398` é a etapa 178.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** telas que criam negócio no CRM quebram se a origem não estiver na lista.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/bitrix24-integration/index.ts
grep -rn 'bitrix24-integration' src/ | head
```

Esperado: nenhum `"*"` literal. Depois do deploy, dispare a integração pelo front **e** confirme que o
caminho servidor-a-servidor (alerta crítico do `ingest-biosync`) continua funcionando; registre os dois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 191 — `execute-protocol`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/execute-protocol/index.ts:5` fixa `"*"`. É a função que **executa
protocolo de automação** sobre tabelas internas: com `*`, uma página de fora dispara essa execução usando a
sessão do visitante.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** concluir que a função é inofensiva porque A-08 mostra que o
"Nexus Self-Healing" finge trabalhar. Fingir trabalhar não é não fazer nada: ela grava e executa; e se A-08
for corrigido depois, o `*` passa a valer sobre uma função que age de verdade.
**Arquivos e objetos a tocar:** `supabase/functions/execute-protocol/index.ts` (`:5` e as respostas)
**Não tocar / armadilhas:** não mude o que a função executa (A-08 tem etapas próprias). O `error.message` de
`:59` é a etapa 168.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** a tela de protocolos quebra se a origem não estiver na lista. `git revert`. Merge
publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/execute-protocol/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, execute um protocolo pelo front e confirme; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 192 — `ingest-biosync`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/ingest-biosync/index.ts:6` fixa `"*"`. A função recebe **biometria de
motorista** (batimento cardíaco) e grava em `bio_sync_telemetry`: com `*`, qualquer página injeta telemetria
usando a sessão do visitante. Dado de saúde é matéria de LGPD (`docs/LGPD_COMPLIANCE.md`).
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. Se o dispositivo que alimenta esta função não for um navegador, a origem correta é **nenhuma** —
nesse caso `getCorsHeaders` já resolve, porque chamada sem `Origin` não é bloqueada por CORS. **Atalho
tentador a evitar:** deixar `*` "porque o dispositivo embarcado pode precisar". Dispositivo embarcado não faz
preflight nem respeita CORS; quem é limitado por `*` é só o navegador — e é exatamente dele que vem o risco.
**Arquivos e objetos a tocar:** `supabase/functions/ingest-biosync/index.ts` (`:6` e as respostas)
**Não tocar / armadilhas:** etapas vizinhas neste arquivo: 148 (validação), 158 (tempo limite), 165 (erro),
199 (dedupe) — uma PR por etapa, releia o arquivo antes. A função é uma das duas que ninguém chama (A-09),
mas está publicada e aberta: isso não dispensa a correção.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** baixo no front (nenhuma tela a chama hoje — confirme com
`grep -rn 'ingest-biosync' src/`). `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/ingest-biosync/index.ts
grep -rn 'ingest-biosync' src/ | head
```

Esperado: nenhum `"*"` literal; o grep em `src/` confirma que nenhuma tela depende dela. Depois do deploy,
uma requisição com `Origin` estranha deve voltar sem autorização para essa origem; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 193 — `ocr-receipt-processor`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/ocr-receipt-processor/index.ts:8` fixa `"*"`. Com `*`, uma página de
fora manda comprovante para processamento usando a sessão do visitante — e consome a cota do serviço de OCR.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** mexer no caminho de upload para "padronizar junto". A-11 registra
que há dois caminhos de upload com padrões de segurança diferentes, e isso tem etapa própria.
**Arquivos e objetos a tocar:** `supabase/functions/ocr-receipt-processor/index.ts` (`:8` e as respostas)
**Não tocar / armadilhas:** a validação de entrada é a etapa 155 e o `error.message` de `:82` é a etapa 178.
A tela de comprovante usa a função: confirme a origem antes.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** a tela de comprovante quebra se a origem não estiver na lista. `git revert`. Merge
publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/ocr-receipt-processor/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, processe um comprovante pelo front e confirme; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 194 — `webhook-status`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Alta / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/webhook-status/index.ts:7` fixa `"*"`. A função dispara POSTs
assinados para os `client_webhooks` com conteúdo vindo do corpo: com `*`, uma página de fora provoca esse
disparo usando a sessão do visitante.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** considerar o problema resolvido pelas etapas 004 e 005 (que exigem
papel ou segredo interno). Papel resolve **quem** pode chamar; CORS resolve **de onde** o navegador do
autorizado pode ser usado para chamar. São camadas diferentes e as duas faltam.
**Arquivos e objetos a tocar:** `supabase/functions/webhook-status/index.ts` (`:7` e as respostas)
**Não tocar / armadilhas:** não toque no HMAC de `:89-105` (assina a **saída** ao cliente externo, não é
autenticação de entrada), nem no bloco de auth `:28-45` (etapas 004 e 005, que **exigem o dono** e podem
estar abertas). Validação do corpo é a etapa 147.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** se o front chama a função, a tela quebra com origem fora da lista — rode
`grep -rn 'webhook-status' src/` antes. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/webhook-status/index.ts
grep -rn 'webhook-status' src/ | head
```

Esperado: nenhum `"*"` literal; o grep mostra se e onde o front a chama. Depois do deploy, confirme o
caminho que existir; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 195 — `normalize-freight-response`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/normalize-freight-response/index.ts:10` fixa `"*"`. A função grava
cotação normalizada e dispara notificação de WhatsApp (`:195`): com `*`, uma página de fora injeta
normalização usando a sessão do visitante.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** deixar `*` porque quem chama é o `nexus-webhook-receiver`
(`:141`, `:154`). Essa chamada é servidor-a-servidor, não manda `Origin` e segue funcionando.
**Arquivos e objetos a tocar:** `supabase/functions/normalize-freight-response/index.ts` (`:10` e as
respostas)
**Não tocar / armadilhas:** o `fetch` nu de `:195` é a etapa 157 e o `error.message` de `:217` é a etapa 178 —
confirme se já mudaram o arquivo antes de editar.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** a tela de cotação multicanal (C-02) pode chamar a função: confirme com
`grep -rn 'normalize-freight-response' src/` antes. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/normalize-freight-response/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, dispare uma normalização pelo caminho do webhook e, se
houver, pela tela; registre os dois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 196 — `nexus-auto-healing`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/nexus-auto-healing/index.ts:6` fixa `"*"`. A função executa rotina de
correção automática: com `*`, uma página de fora a dispara usando a sessão do visitante.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** tratar como irrelevante por causa de A-08 (a funcionalidade finge
trabalhar). Mesmo raciocínio da etapa 191: ela grava, e o `*` continuaria valendo depois de A-08 ser
corrigido.
**Arquivos e objetos a tocar:** `supabase/functions/nexus-auto-healing/index.ts` (`:6` e as respostas)
**Não tocar / armadilhas:** não mude o que a rotina faz. O `error.message` de `:110` é a etapa 178.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** o painel que dispara a rotina quebra se a origem não estiver na lista.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/nexus-auto-healing/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, dispare a rotina pelo front e confirme; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 197 — `accuracy-weekly-digest`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Baixa dentro do grupo, mas manipula dado / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/accuracy-weekly-digest/index.ts:19` fixa `"*"`. A função monta e envia
o resumo semanal: com `*`, uma página de fora provoca o envio fora de hora usando a sessão do visitante.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. **Atalho tentador a evitar:** remover o CORS por completo "já que ela roda por agendamento". As
três funções de agendamento que não têm CORS (`db-health-snapshot`, `db-health-weekly-report`,
`db-regression-monitor`) são assim porque **ninguém** as chama pelo navegador; esta tem CORS porque é
disparável pelo front. Se a conclusão for que não deve ser, isso é mudança de desenho e vai para o dono, não
para esta etapa.
**Arquivos e objetos a tocar:** `supabase/functions/accuracy-weekly-digest/index.ts` (`:19` e as respostas)
**Não tocar / armadilhas:** o `functions.invoke` de `:179` é a etapa 163 e o `error.message` de `:237` é a
etapa 178.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** baixo. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/accuracy-weekly-digest/index.ts
```

Esperado: nenhum `"*"` literal. Depois do deploy, dispare o resumo (pelo front, se houver botão; ou pelo
agendamento) e confirme que chegou; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 198 — `geocode-address`: trocar o CORS `*` fixo por `getCorsHeaders(req)`

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-07
**Problema hoje:** `supabase/functions/geocode-address/index.ts:6` fixa `"*"`. Com `*`, qualquer página usa a
função como serviço gratuito de geocodificação, consumindo a cota paga da conta (Mapbox/ViaCEP) pela sessão
do visitante. É a última das 20 que manipulam dado — e fecha B-07.
**Causa raiz:** cabeçalho de CORS escrito à mão.
**Caminho recomendado:** `getCorsHeaders(req)` no modelo de `external-db-bridge/index.ts:2`, em todas as
respostas. Depois desta etapa, rode a verificação de fechamento abaixo: ela prova que as 20 saíram e que as
5 que ficaram são exatamente as que o achado isenta. **Atalho tentador a evitar:** aproveitar a PR para
"terminar o serviço" nas 5 restantes (`carrier-webhook-receiver`, `rodonaves-webhook`,
`nexus-webhook-receiver`, `health`, `get-weather-data`). As três primeiras são webhooks
servidor-a-servidor — navegador não as chama, o controle real é o HMAC — e as outras duas são healthcheck sem
dado. B-07 **não** pede etapa para elas; mexer ali é churn e arrisca o caminho das transportadoras.
**Arquivos e objetos a tocar:** `supabase/functions/geocode-address/index.ts` (`:6` e as respostas)
**Não tocar / armadilhas:** a chamada ao serviço de geocodificação passa por `safeFetch` — não acrescente
tempo limite.
**Depende de:** 179 · **Libera:** —
**Risco e como reverter:** telas com campo de endereço quebram se a origem não estiver na lista.
`git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'Access-Control-Allow-Origin\|getCorsHeaders' supabase/functions/geocode-address/index.ts
grep -rln '"Access-Control-Allow-Origin": "\*"' supabase/functions/*/index.ts
```

Esperado: no primeiro comando, nenhum `"*"` literal. No segundo, **no máximo 5 arquivos**, e exatamente
estes: `carrier-webhook-receiver`, `rodonaves-webhook`, `nexus-webhook-receiver`, `health`,
`get-weather-data`. Qualquer outro nome na lista é etapa de B-07 que ficou para trás — registre no progresso.
Depois do deploy, preencha um endereço pelo front e confirme a geocodificação; registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 199 — `ingest-biosync`: deduplicar a telemetria do dispositivo

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-08
**Problema hoje:** `supabase/functions/ingest-biosync/index.ts:21` faz o parse e `:38-48` insere em
`bio_sync_telemetry`, mais `:55` em `nexus_tactical_logs` — **sem** `idempotency.ts`, sem `upsert` e sem
chave única. O reenvio do mesmo dado de batimento duplica a telemetria e dispara alerta repetido para o mesmo
motorista.
**Causa raiz:** gravação de telemetria sem chave de evento; nenhuma proteção contra reenvio.
**Caminho recomendado:** use `claimIdempotencyKey` de `_shared/idempotency.ts:30` — aqui ele **serve
diretamente**, porque não existe tabela de marcador própria nesta função (ao contrário dos webhooks das
etapas 133-136, que já tinham `webhook_events_processed`). A chave vem de `buildEventKey` (etapa 138) com os
campos estáveis do payload, no desenho de `rodonaves-webhook/index.ts:124-127`: identificador do dispositivo
ou do veículo + o horário **do evento** (`event_time` que vier no corpo) + o valor medido. Se o payload não
trouxer horário do evento, use o hash do corpo que a etapa 138 oferece. Duplicata → responda 200 com
`duplicate: true`, como `carrier-webhook-receiver/index.ts:128-135`. **Atalho tentador a evitar:** usar
`new Date().toISOString()` do servidor na chave — é o que a função já faz para `event_time` em `:60`, e é
exatamente o defeito de B-02 (`nexus-webhook-receiver:80`): o horário de recebimento muda em cada reenvio e
anula a dedupe. **Segundo atalho a evitar:** `upsert` sem restrição única no banco. Sem a restrição, `upsert`
insere igual; se você concluir que a tabela precisa de chave única, isso é DDL — PR aberta para o dono.
**Arquivos e objetos a tocar:** `supabase/functions/ingest-biosync/index.ts` (antes de `:38`, a reivindicação
da chave)
**Não tocar / armadilhas:** confirme na etapa 132 que `idempotency_keys` existe no banco ao vivo e tem a
restrição única — `claimIdempotencyKey` é **fail-open** por desenho (erro de infraestrutura → processa), logo
uma tabela ausente não quebra nada e a dedupe simplesmente não acontece, em silêncio. Biometria é matéria de
LGPD (`docs/LGPD_COMPLIANCE.md`): a chave pode conter identificador de dispositivo, **não** dado de saúde em
texto claro — se usar o valor medido, use-o dentro do hash. Etapas vizinhas: 148, 158, 165, 192.
**Depende de:** 132, 138 · **Libera:** —
**Risco e como reverter:** telemetria legítima com dois registros idênticos no mesmo instante passa a ser
contada uma vez. Se o dispositivo mede mais de uma vez por segundo, inclua um contador do payload na chave —
confirme a frequência real nos dados antes. `git revert`. Merge publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não (sim, se a conclusão for que a tabela precisa de chave
única nova — aí é DDL)
**Como verificar:**

```bash
grep -n 'claimIdempotencyKey\|buildEventKey' supabase/functions/ingest-biosync/index.ts
```

Esperado: a chave é reivindicada **antes** do insert de `:38-48`. Depois do deploy, envie o mesmo payload
duas vezes e confirme: a segunda resposta indica duplicata, e `bio_sync_telemetry` tem **uma** linha nova
(consulte pelo horário). Registre a contagem antes e depois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 200 — `push-send`: tempo limite no envio ao provedor de push

**Onda / Severidade / Camada:** 5 / Média / edge function
**Achados resolvidos:** B-09
**Problema hoje:** `supabase/functions/push-send/index.ts:7` importa `web-push` e `:160` chama
`webpush.sendNotification` dentro do laço por inscrição (`:158`). A biblioteca fala com FCM/APNs
internamente e **não passa por `safeFetch`**, então não há tempo limite nem disjuntor: lentidão do Google ou
da Apple prende o laço e o lote inteiro de notificações morre no limite de execução da função.
**Causa raiz:** biblioteca de terceiro que faz a requisição por conta própria, fora do caminho onde o
repositório já resolveu tempo limite.
**Caminho recomendado:** envolva cada `sendNotification` numa corrida com tempo limite
(`Promise.race` contra um temporizador, ou `AbortSignal.timeout` se a versão da biblioteca aceitar opção de
sinal — confira a assinatura de `web-push@3.6.7` antes), com o mesmo padrão de 10 s que
`_shared/fetch-with-timeout.ts:5` e `_shared/safeFetch.ts:107-110` usam, e conte o estouro como falha **da
inscrição**, não do lote: o arquivo já trata falha por inscrição sem derrubar o lote (`:1-4` e o `catch` de
`:168`), então acrescente `timeout` à lista de `errors` que já existe em `:155`. **Atalho tentador a
evitar:** retentativa do envio que estourou. B-10 é explícito: retentativa só depois de B-01 e B-02, e aqui
cada reenvio é uma notificação repetida no celular do usuário. **Segundo atalho a evitar:** trocar a
biblioteca por chamadas diretas ao FCM com `safeFetch`. É reescrita do envio (VAPID, cifragem do payload),
não correção de tempo limite.
**Arquivos e objetos a tocar:** `supabase/functions/push-send/index.ts` (o laço em `:158-170`)
**Não tocar / armadilhas:** não mexa no rate limit (`checkRateLimit`, `:9`) nem na leitura das inscrições. Não
remova inscrição por tempo limite — tempo limite **não** é inscrição inválida; só o 404/410 do provedor é, e
esse tratamento, se existir, fica como está. O CORS `*` de `:12` é a etapa 183.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** envios lentos passam a ser abandonados em 10 s e contados como falha. Se o
provedor costuma demorar mais que isso, o lote passa a reportar falhas que antes "funcionavam devagar" —
confira a duração típica nos logs antes de escolher o número e registre-o no corpo da PR. `git revert`. Merge
publica em produção na hora.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'sendNotification\|Promise.race\|timeout' supabase/functions/push-send/index.ts
```

Esperado: cada envio com tempo limite e o estouro contado em `errors` como `timeout`. Depois do deploy,
envie um lote real e confirme na resposta os contadores `sent`/`failed` (`:153-154`) e, no log, a duração;
registre.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 201 — Corrigir o comentário de `fetch-with-timeout.ts` que promete retentativa inexistente

**Onda / Severidade / Camada:** 5 / Baixa / edge function
**Achados resolvidos:** B-10
**Problema hoje:** `supabase/functions/_shared/fetch-with-timeout.ts:3` diz, em comentário, que o helper tem
"retry logic". O código (`:5-28`) implementa **só** tempo limite: um `AbortController`, um `setTimeout` e a
tradução do `AbortError` em erro de tempo limite. Nenhuma das 44 funções faz retentativa com espera
progressiva.
**Causa raiz:** comentário desatualizado — e o pior tipo, porque o próximo agente lê "tem retry", confia, e
deixa de implementar onde precisaria.
**Caminho recomendado:** edite **o comentário**, não o código: troque a frase da linha 3 por uma que
descreva o que existe ("tempo limite por requisição, padrão 10 s; **não** faz retentativa"). Aproveite para
tirar da linha 4 a referência a "Audit 10/10", que é do mesmo lote de afirmação sem lastro (H-05). Duas
linhas de diff, nada mais. **Atalho tentador a evitar — leia isto antes de qualquer coisa:** implementar a
retentativa "já que o comentário promete". **Não implemente.** Com a idempotência quebrada de B-01 e B-02,
retentativa multiplica a duplicação: cada nova tentativa é um evento gravado de novo. A ordem correta é
B-01, B-02, e só então **avaliar** retentativa — avaliação que é decisão do dono, não desta etapa. Se você
acha que falta retentativa em algum ponto concreto, registre em `05-PROGRESSO.md`, na seção "Achados novos",
e siga.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/fetch-with-timeout.ts` (apenas as linhas 1-4, o
bloco de comentário)
**Não tocar / armadilhas:** **não** altere `:5-28`. Este helper é usado por `_shared/safeFetch.ts`
(`:107-110`), que atende as **36 chamadas a terceiro** do repositório — qualquer mudança de comportamento
aqui atinge Resend, Lalamove, Rodonaves, Melhor Envio, Bitrix24, Evolution, Mapbox, ViaCEP, OpenWeather,
Google AI, HIBP e Slack de uma vez. E lembre da correção de premissa registrada no alto do Grupo B: **não
faltam tempos limite nas chamadas a terceiro** — `safeFetch` já embute tempo limite e disjuntor. O que falta
é nas chamadas internas, e isso é B-05 (etapas 156-163).
**Depende de:** — · **Libera:** —
**Risco e como reverter:** nenhum em produção: é comentário. Ainda assim, merge nesta pasta **republica** as
funções que importam o arquivo — confirme o deploy. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '1,6p' supabase/functions/_shared/fetch-with-timeout.ts
git diff --stat
grep -rn 'retry' supabase/functions/_shared/fetch-with-timeout.ts
```

Esperado: o comentário descreve apenas tempo limite; o diff tem **somente** linhas de comentário; `grep
'retry'` não devolve promessa nenhuma. Confirme o deploy depois do merge e registre o horário.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

## Onda 6 — performance (202-240)

### Etapa 202 — Criar `useServerPagination` e **definir** o contrato de paginação no servidor

**Onda / Severidade / Camada:** 6 / Crítica / hook
**Achados resolvidos:** P-01 (habilita P-02)
**Problema hoje:** não existe paginação no servidor em nenhum ponto do front: `grep -rn '\.range(' src/`
devolve **zero** (conferido hoje). O que existe é `src/hooks/common/usePagination.ts:57`
(`return data.slice(startIndex, endIndex)`) — recorte **em memória**, usado por 20 arquivos. Ele só
funciona depois de a lista inteira ter sido baixada, então não resolve as leituras sem teto de P-01 e P-02.
**Causa raiz:** falta a peça. Sem um hook de paginação no servidor, cada tela que precisa de lista longa só
tem dois caminhos: baixar tudo, ou inventar um recorte próprio. Por isso o repositório tem 16 listagens com
`.limit()` ad-hoc (números de 1 a 5000, sem critério comum) e 5 sem teto nenhum.
**Caminho recomendado:** crie `src/hooks/common/useServerPagination.ts`. **Esta etapa define o padrão do
repositório** — as etapas 213 e seguintes vão citá-la, então o contrato precisa estar fechado aqui, não
depois. Copie a _forma_ de `src/hooks/common/usePagination.ts` (nomes de retorno `currentPage`, `pageSize`,
`totalPages`, `setPage`, `nextPage`, `prevPage`, `setPageSize`) para que as telas que hoje usam o hook em
memória troquem de hook sem reescrever a barra de paginação. O que muda é de onde vêm os dados.

Contrato a implementar e documentar no topo do arquivo:

```ts
// Entrada
useServerPagination<T>(
  queryKeyBase: readonly unknown[],   // sem a página; a página e o pageSize são anexados pelo hook
  fetchPage: (args: { from: number; to: number }) => Promise<{
    data: T[] | null;
    count: number | null;             // total no servidor, vindo de { count: "exact" }
    error: unknown;
  }>,
  options?: { initialPage?: number; pageSize?: number; enabled?: boolean },
): {
  rows: T[];                          // só a página atual
  total: number;                      // total no servidor (não rows.length)
  currentPage: number;
  pageSize: number;
  totalPages: number;                 // Math.max(1, Math.ceil(total / pageSize))
  setPage: (p: number) => void;       // com clamp em [1, totalPages]
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (n: number) => void;   // volta para a página 1
  isLoading: boolean; isError: boolean; error: unknown;
}
```

Regras do contrato, que valem para todo consumidor:

1. **A página vira faixa:** `from = (page - 1) * pageSize`, `to = from + pageSize - 1`, e o consumidor chama
   `.range(from, to)`. Nunca `.limit()` junto com `.range()`.
2. **O total vem do servidor**, via `select(colunas, { count: "exact" })` → `count`. `rows.length` é o
   tamanho da página, não o total; quem usar `rows.length` para "X de Y" mostra número errado.
3. **A `queryKey` inclui página, `pageSize` e todos os filtros.** Trocar filtro **reseta para a página 1** —
   senão o usuário fica numa página que já não existe e vê lista vazia.
4. **Usar `placeholderData` (manter os dados anteriores) ao trocar de página**, para a tabela não piscar.
5. **Ordenação é obrigatória e estável** (`order` por coluna única ou com `id` como desempate). `.range()`
   sem ordenação determinística repete e some linhas entre páginas — este é o erro clássico.

**Atalho tentador a evitar:** "aproveitar o `usePagination` que já existe e só trocar o `slice` por um
`range` lá dentro". Não faça: 20 arquivos dependem da assinatura atual (`usePagination(array, opções)`) e
todos passam um array já carregado. Mudar aquele hook quebra 20 telas de uma vez. Crie um hook novo ao lado;
o antigo continua válido para listas curtas que já vêm inteiras.
**Arquivos e objetos a tocar:** `src/hooks/common/useServerPagination.ts` (arquivo novo) e seu teste
`src/hooks/common/useServerPagination.test.ts` (novo)
**Não tocar / armadilhas:** **não altere `src/hooks/common/usePagination.ts`** — 20 arquivos o importam.
Não converta nenhuma tela nesta etapa: aqui só nasce o hook. E não mexa nas ~16 listagens que **já têm teto**
e estão corretas: `Envios.tsx:353` (500), `Coletas.tsx:122` (500), `Ocorrencias.tsx:137` (500),
`KanbanEntregas.tsx:268` (500), `PainelSLA.tsx:155,182` (500), `ExportacaoDados.tsx:110` (5000),
`RelatorioPDF.tsx:91` (2000), `useConciliacao.tsx:123` (2000), `AuditTrail.tsx:30` (5000),
`AdminTelemetria.tsx:51` (500), `TelemetryViewer.tsx:45` (100), `useUnifiedTracking.tsx:138,167` (200),
`useDrillDown.tsx:67,82` (100), `useGlobalSearch.tsx:57,76` (5), `useSecurityEvents.ts:33-57` (100),
`useAccuracyMetaCycle.ts:62` (1).
**Depende de:** — · **Libera:** 203, 209, 211, 213, 214, 215
**Risco e como reverter:** nenhum para o comportamento atual (código novo, sem consumidor). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/hooks/common/useServerPagination.test.ts 2>&1 | tail -20
npx eslint src/hooks/common/useServerPagination.ts src/hooks/common/useServerPagination.test.ts
npm run typecheck 2>&1 | tail -5
```

Esperado: testes passando para (a) `from`/`to` calculados certo na página 1, 2 e na última; (b) `totalPages`
derivado de `count` e não de `rows.length`; (c) `setPage` fora da faixa sofrendo clamp; (d) `setPageSize`
voltando para a página 1. E `grep -rn '\.range(' src/` passa de 0 para ≥1 ocorrência.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 203 — Documentar o contrato de paginação e marcar `usePagination` como "só memória"

**Onda / Severidade / Camada:** 6 / Alta / documentação
**Achados resolvidos:** P-01
**Problema hoje:** `src/hooks/common/usePagination.ts` não diz em nenhum lugar que ele pagina **em memória**.
O nome sugere paginação; `:57` é `data.slice(...)`. Foi assim que `src/pages/Notificacoes.tsx:105` acabou
chamando `usePagination(filteredData, { initialPageSize: 15 })` depois de baixar a tabela inteira (P-02): o
desenvolvedor acreditou que estava paginando.
**Causa raiz:** o repositório tem a peça errada bem nomeada e, até a etapa 202, não tinha a peça certa. Sem
um documento que diga "qual hook para qual caso", o próximo agente repete a escolha.
**Caminho recomendado:** acrescente a `docs/agentes/mapa-repo.md` uma subseção curta "Listagens: teto e
paginação" com três decisões, na ordem: (1) lista curta de domínio fechado (`transportadoras`, `clientes`,
`feature_flags`) → leitura inteira, sem teto, e `usePagination` em memória se a tela precisar paginar;
(2) lista longa que a tela só exibe → `.limit()` no servidor, com o padrão
`src/hooks/notifications/useNotifications.tsx:35` (`.limit(50)` + `.eq("user_id", ...)`); (3) lista longa que
o usuário navega página por página → `useServerPagination` da etapa 202, com o contrato das 5 regras. Depois
acrescente um comentário de duas linhas no topo de `src/hooks/common/usePagination.ts` dizendo que ele
**recorta um array já carregado** e apontando para `useServerPagination` quando os dados vierem do banco.
**Atalho tentador a evitar:** renomear `usePagination` para `useClientPagination` "para ficar claro". São 20
arquivos importando; o churn é grande, o benefício é cosmético, e a regra do repositório proíbe rename não
pedido. Um comentário no topo resolve.
**Arquivos e objetos a tocar:** `docs/agentes/mapa-repo.md` (acréscimo de uma subseção),
`src/hooks/common/usePagination.ts` (apenas um comentário de cabeçalho — **nenhuma mudança de código**)
**Não tocar / armadilhas:** mexer em `docs/agentes/` dispara o check obrigatório **"Agents Docs Integrity"**:
rode `node scripts/ci/check-claude-md-integrity.mjs` antes de abrir a PR. Não altere a lógica de
`usePagination.ts` — só o comentário; qualquer mudança de código ali é a armadilha da etapa 202.
**Depende de:** 202 · **Libera:** 211
**Risco e como reverter:** nenhum (documentação e comentário). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs
grep -n 'useServerPagination' docs/agentes/mapa-repo.md src/hooks/common/usePagination.ts
```

Esperado: o check de integridade passa e as três decisões aparecem no documento, cada uma com o arquivo de
referência citado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 204 — `useTrackingAnalytics`: pôr teto no servidor na leitura de `rastreamento_historico`

**Onda / Severidade / Camada:** 6 / Crítica / hook
**Achados resolvidos:** P-01
**Problema hoje:** `src/hooks/logistics/useTrackingAnalytics.tsx:122-124` faz
`.from('rastreamento_historico').select('*').order('recorded_at', { ascending: true })` — sem `.limit()`, sem
`.range()`. Os filtros de data em `:127-132` são condicionais (`if (dateFrom)` / `if (dateTo)`), e o único
chamador, `src/pages/Analytics.tsx:71`, chama `useTrackingAnalytics()` **sem argumento algum**. Resultado:
a tela de Analytics baixa a tabela inteira.
**Causa raiz:** `rastreamento_historico` é a tabela de maior crescimento do sistema — uma linha por consulta
de rastreio, com 18 partições mensais no banco. É exatamente a tabela que não pode ser lida sem teto, e é a
única leitura do repositório que não tem nenhum.
**Caminho recomendado:** acrescente `.limit(5000)` logo depois do `.order(...)`, copiando a forma de
`src/hooks/notifications/useNotifications.tsx:35`. 5000 é o teto que o repositório já usa para leituras
analíticas grandes (`ExportacaoDados.tsx:110`, `AuditTrail.tsx:30`), então não é número novo. Ordene por
`recorded_at` **descendente** antes de cortar e inverta no cliente: com `ascending: true` + `.limit()` você
fica com os pontos **mais antigos** da tabela, que é o oposto do que a tela quer mostrar. Esta é a parte que
engana. Se preferir manter a ordem crescente no retorno, faça o `.reverse()` no array depois do fetch, antes
do agrupamento de `:138`. **Atalho tentador a evitar:** "colocar um teto baixo, tipo 500, para ficar rápido".
O hook agrupa os pontos por `lalamove_order_id` e calcula paradas e tempos; um teto baixo corta ordens no
meio e produz métrica **errada** em silêncio — pior que lento. 5000 com janela de data (etapas 205 e 206) é o
desenho; o teto sozinho é só a rede de segurança.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useTrackingAnalytics.tsx` (apenas o bloco `:122-135`)
**Não tocar / armadilhas:** não mexa nas funções de cálculo acima (`:1-115`) — elas recebem os pontos já
agrupados e não têm defeito. E não mexa nas ~16 listagens que já têm teto: `Envios.tsx:353` (500),
`Coletas.tsx:122` (500), `Ocorrencias.tsx:137` (500), `KanbanEntregas.tsx:268` (500),
`PainelSLA.tsx:155,182` (500), `ExportacaoDados.tsx:110` (5000), `RelatorioPDF.tsx:91` (2000),
`useConciliacao.tsx:123` (2000), `AuditTrail.tsx:30` (5000), `AdminTelemetria.tsx:51` (500),
`TelemetryViewer.tsx:45` (100), `useUnifiedTracking.tsx:138,167` (200), `useDrillDown.tsx:67,82` (100),
`useGlobalSearch.tsx:57,76` (5), `useSecurityEvents.ts:33-57` (100), `useAccuracyMetaCycle.ts:62` (1).
**Depende de:** — · **Libera:** 205, 206
**Risco e como reverter:** se a tela hoje depende de ver mais de 5000 pontos, o número exibido muda. Por isso
registre na PR os valores de "pontos registrados" antes e depois. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -A14 "from('rastreamento_historico')" src/hooks/logistics/useTrackingAnalytics.tsx
npx eslint src/hooks/logistics/useTrackingAnalytics.tsx && npm run typecheck 2>&1 | tail -3
```

Esperado: `.limit(5000)` presente e a ordem no servidor coerente com o que o cliente consome. Depois do
deploy, abra `/analytics` com a aba Rede do navegador aberta e confirme que a resposta de
`rastreamento_historico` não passa de 5000 linhas; registre o tamanho em KB antes e depois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 205 — `Analytics.tsx`: passar o intervalo de datas que a tela já tem para `useTrackingAnalytics`

**Onda / Severidade / Camada:** 6 / Crítica / interface
**Achados resolvidos:** P-01
**Problema hoje:** `src/pages/Analytics.tsx:60-63` mantém um `dateRange` no estado (padrão: últimos 30 dias)
e `:65-69` o repassa corretamente para `useAnalytics(...)`. Mas `:71` chama `useTrackingAnalytics()` **sem
nenhum argumento** — o hook aceita `(dateFrom?, dateTo?)` e recebe `undefined`. A tela tem o filtro na mão e
não o usa para a consulta mais cara que ela faz.
**Causa raiz:** parâmetro opcional. Como `dateFrom`/`dateTo` são opcionais na assinatura
(`useTrackingAnalytics.tsx:117`), esquecer de passá-los não dá erro de compilação nem aviso de lint. O
esquecimento é invisível.
**Caminho recomendado:** troque `:71` por uma chamada que passa o intervalo **exatamente como `:65-69` já
faz para `useAnalytics`** — mesmo `dateRange ? { ... } : undefined`, mesmos fallbacks `dateRange.from!` e
`dateRange.to || dateRange.from!`. Esse trecho é o padrão de referência e está logo acima, no mesmo arquivo:
copie a forma, não invente outra. Confira que `queryKey` do hook (`useTrackingAnalytics.tsx:120`) já inclui
`dateFrom?.toISOString()` e `dateTo?.toISOString()` — inclui, então o cache invalida sozinho quando o
usuário muda o filtro; não há nada a acrescentar ali. **Atalho tentador a evitar:** passar `new Date()` ou
um intervalo fixo "de 30 dias" dentro do hook como valor padrão. Isso deixa a tela e o hook com duas fontes
de verdade para o período: o usuário muda o seletor, o gráfico de rastreio não muda, e ninguém entende por
quê. O período é decisão da tela.
**Arquivos e objetos a tocar:** `src/pages/Analytics.tsx` (apenas a linha `:71`)
**Não tocar / armadilhas:** não mexa em `useAnalytics` nem em `useKPIBenchmark` (`:70`) — `useKPIBenchmark`
tem o próprio defeito e é tratado nas etapas 219 e 220; misturar os dois nesta PR tira a atomicidade. Não
mexa na assinatura do hook aqui: isso é a etapa 206.
**Depende de:** 204 · **Libera:** 206
**Risco e como reverter:** os números do bloco de rastreio na tela de Analytics passam a refletir só o
período selecionado — é a correção, mas é mudança visível. Anote na PR os valores antes e depois. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'useTrackingAnalytics' src/pages/Analytics.tsx
```

Esperado: a chamada passa `from` e `to`. Depois do deploy, abra `/analytics`, mude o seletor de período e
confirme na aba Rede que sai uma **nova** requisição a `rastreamento_historico` com `recorded_at=gte...` e
`recorded_at=lte...` na URL.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 206 — `useTrackingAnalytics`: tornar a janela de datas obrigatória na assinatura

**Onda / Severidade / Camada:** 6 / Alta / hook
**Achados resolvidos:** P-01
**Problema hoje:** mesmo depois das etapas 204 e 205, a assinatura
`src/hooks/logistics/useTrackingAnalytics.tsx:117` segue sendo `(dateFrom?: Date, dateTo?: Date)` e os
filtros em `:127-132` seguem condicionais. Qualquer tela nova que chame o hook sem argumentos volta a varrer
a tabela — e o typecheck aprova.
**Causa raiz:** é o mesmo defeito de desenho da etapa 205, só que na outra ponta. Enquanto o parâmetro for
opcional, o caminho sem filtro existe e vai ser usado de novo.
**Caminho recomendado:** troque os dois parâmetros opcionais por um único obrigatório
`{ from: Date; to: Date }`, aplique os dois filtros sem `if` e ajuste `queryKey` para
`['tracking-analytics', user?.id, range.from.toISOString(), range.to.toISOString()]`. Depois atualize o
único chamador (`src/pages/Analytics.tsx:71`, já corrigido na etapa 205) para a nova forma. O typecheck
passa a ser o guarda: chamar sem janela deixa de compilar. **Atalho tentador a evitar:** manter o parâmetro
opcional e só acrescentar um `console.warn` quando vier `undefined`. Aviso em console não impede nada, e
`npm run validate:no-console` existe neste repositório justamente porque `console` não é mecanismo de
controle. O mecanismo aqui é o tipo.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useTrackingAnalytics.tsx` (`:117`, `:120`, `:127-132`),
`src/pages/Analytics.tsx` (`:71`, adaptando ao novo formato)
**Não tocar / armadilhas:** confirme com `grep -rn 'useTrackingAnalytics' src/` que **Analytics.tsx é o
único chamador** antes de mudar a assinatura — a auditoria viu um só, mas releia (regra 2). O teto de 5000
da etapa 204 **permanece**: janela de data não substitui teto, porque um intervalo largo ainda traz milhões
de linhas. Não remova o `.limit()`.
**Depende de:** 204, 205 · **Libera:** 211
**Risco e como reverter:** se houver outro chamador que a auditoria não viu, ele deixa de compilar — o que é
bom, mas precisa ser adaptado na mesma PR. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'useTrackingAnalytics' src/
npm run typecheck 2>&1 | tail -5
npx eslint src/hooks/logistics/useTrackingAnalytics.tsx src/pages/Analytics.tsx
```

Esperado: `0 erros` no typecheck, todos os chamadores passando a janela, e nenhum `if (dateFrom)` restante
no hook.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 207 — `useLogisticsCalendar`: pôr teto na leitura de `coletas`

**Onda / Severidade / Camada:** 6 / Alta / hook
**Achados resolvidos:** P-01
**Problema hoje:** `src/hooks/logistics/useLogisticsCalendar.tsx:35-47` monta `coletasQuery` com
`.not('data_prevista_coleta', 'is', null)` e **nenhum teto**. Os filtros de status (`:49-57`) e de
transportadora (`:59-61`) são condicionais e podem não vir. O `await coletasQuery` em `:63` traz, no pior
caso, toda a tabela de coletas com dois joins (`transportadoras`, `fornecedores`).
**Causa raiz:** o único filtro garantido é "a data prevista não é nula" — que não limita nada: quase toda
coleta tem data prevista. O recorte que o Calendário Logístico realmente precisa (o mês que está na tela)
não chega ao servidor.
**Caminho recomendado:** acrescente `.limit(500)` na `coletasQuery`, antes do `await` de `:63`. 500 é o teto
que o repositório usa para listagens operacionais (`Coletas.tsx:122`, `Envios.tsx:353`,
`KanbanEntregas.tsx:268`), então é o número consistente; o padrão de forma é
`src/hooks/notifications/useNotifications.tsx:35`. Acrescente também um `.order('data_prevista_coleta', {
ascending: true })` antes do teto: hoje a consulta não ordena, e cortar sem ordenar devolve 500 linhas
arbitrárias — o calendário mostraria um mês cheio e o seguinte vazio, sem motivo aparente. Essa ordem é o
detalhe que faz o teto ser seguro em vez de confuso. **Atalho tentador a evitar:** limitar pelo `filters` que
o hook já recebe, "porque a tela sempre manda status". Não sempre: `:49` é `if (filters.status.length > 0)`.
Teto incondicional primeiro; o recorte por mês é a etapa 209.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useLogisticsCalendar.tsx` (apenas `:35-63`)
**Não tocar / armadilhas:** não toque no bloco de `entregas` (`:93` em diante) nesta etapa — é a 208, e são
PRs separadas. Não mexa na interface `ColetaRaw` (`:65-75`) nem no `forEach` que monta os eventos
(`:77-91`): a lista de colunas do `select` continua a mesma. E não mexa nas ~16 listagens que já têm teto:
`Envios.tsx:353` (500), `Coletas.tsx:122` (500), `Ocorrencias.tsx:137` (500), `KanbanEntregas.tsx:268` (500),
`PainelSLA.tsx:155,182` (500), `ExportacaoDados.tsx:110` (5000), `RelatorioPDF.tsx:91` (2000),
`useConciliacao.tsx:123` (2000), `AuditTrail.tsx:30` (5000), `AdminTelemetria.tsx:51` (500),
`TelemetryViewer.tsx:45` (100), `useUnifiedTracking.tsx:138,167` (200), `useDrillDown.tsx:67,82` (100),
`useGlobalSearch.tsx:57,76` (5), `useSecurityEvents.ts:33-57` (100), `useAccuracyMetaCycle.ts:62` (1).
**Depende de:** — · **Libera:** 209
**Risco e como reverter:** com mais de 500 coletas futuras cadastradas, o calendário passa a esconder as
mais distantes até a etapa 209 entrar. Diga isso na PR. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -B2 -A4 'await coletasQuery' src/hooks/logistics/useLogisticsCalendar.tsx
npx eslint src/hooks/logistics/useLogisticsCalendar.tsx
```

Esperado: `.order('data_prevista_coleta', ...)` e `.limit(500)` presentes na consulta de coletas. Depois do
deploy, abra o Calendário Logístico e confirme na aba Rede que a resposta de `coletas` traz no máximo 500
linhas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 208 — `useLogisticsCalendar`: pôr teto na leitura de `entregas`

**Onda / Severidade / Camada:** 6 / Alta / hook
**Achados resolvidos:** P-01
**Problema hoje:** `src/hooks/logistics/useLogisticsCalendar.tsx:94-105` repete o desenho da consulta de
coletas para `entregas`: `.not('previsao_entrega', 'is', null)`, joins de `transportadoras` e `clientes`, e
nenhum teto. `entregas` é uma das duas tabelas mais movimentadas do sistema.
**Causa raiz:** mesma da etapa 207 — o único filtro garantido não limita nada. Os dois blocos foram escritos
em paralelo, com o mesmo defeito, e por isso recebem a mesma correção em etapas gêmeas.
**Caminho recomendado:** faça aqui **exatamente** o que a etapa 207 fez no bloco de coletas: acrescente
`.order('previsao_entrega', { ascending: true })` e `.limit(500)` na `entregasQuery`. O arquivo de referência
mais próximo é a própria etapa 207, já mergeada neste arquivo — abra o bloco de coletas e espelhe.
Secundariamente, `src/hooks/notifications/useNotifications.tsx:35` para a forma do teto. **Atalho tentador a
evitar:** "fazer os dois blocos na mesma PR, é o mesmo código". A regra do repositório é uma etapa por PR, e
aqui ela tem razão prática: se o teto quebrar a exibição de um dos dois tipos de evento, com PRs separadas
você reverte só o que quebrou.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useLogisticsCalendar.tsx` (apenas o bloco de `entregas`)
**Não tocar / armadilhas:** não altere o bloco de coletas (já tratado na 207) nem o `events.push(...)` que
monta o retorno. Confirme com `git log -1 --stat src/hooks/logistics/useLogisticsCalendar.tsx` que a etapa
207 já está na `main` antes de começar — `strict = false` na proteção de branch deixa mergear PR atrasada, e
duas PRs no mesmo arquivo dão conflito. E não mexa nas ~16 listagens que já têm teto (lista na etapa 207).
**Depende de:** 207 · **Libera:** 209
**Risco e como reverter:** com mais de 500 entregas com previsão futura, o calendário esconde as mais
distantes até a etapa 209. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -B2 -A4 'await entregasQuery' src/hooks/logistics/useLogisticsCalendar.tsx
npx eslint src/hooks/logistics/useLogisticsCalendar.tsx
```

Esperado: `.order('previsao_entrega', ...)` e `.limit(500)` na consulta de entregas, e o bloco de coletas
inalterado em relação à etapa 207 (confira com `git diff`).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 209 — `useLogisticsCalendar`: filtrar no servidor pelo mês que está na tela

**Onda / Severidade / Camada:** 6 / Alta / hook + interface
**Achados resolvidos:** P-01
**Problema hoje:** depois das etapas 207 e 208 as duas consultas têm teto, mas continuam pedindo ao banco
**todas** as coletas e entregas com data prevista — passadas e futuras — e o calendário descarta no cliente
tudo que não é do mês exibido. O teto virou um corte arbitrário: o usuário navega para o mês seguinte e as
linhas podem não estar nos 500 que vieram.
**Causa raiz:** `useLogisticsCalendar(filters)` (`:27`) recebe tipo, status e transportadora, mas **não
recebe o mês**. A tela sabe qual mês está mostrando; o hook não.
**Caminho recomendado:** acrescente ao tipo `CalendarFilters` dois campos obrigatórios `from: Date` e
`to: Date`, aplique `.gte('data_prevista_coleta', from).lte('data_prevista_coleta', to)` no bloco de coletas
e `.gte('previsao_entrega', from).lte('previsao_entrega', to)` no de entregas, e inclua os dois na
`queryKey` de `:29` (hoje é `['logistics-calendar', filters]` — como `filters` é o objeto inteiro, os novos
campos entram sozinhos; **confirme isso** em vez de supor). Depois passe o intervalo do mês exibido na tela
que consome o hook (`grep -rn 'useLogisticsCalendar' src/` para achá-la). Para derivar o intervalo use
`startOfMonth`/`endOfMonth` do `date-fns`, como `src/hooks/analytics/useKPIBenchmark.tsx:43-44` já faz — é a
forma usada no repositório, não traga outra biblioteca de data. **Atalho tentador a evitar:** usar
`useServerPagination` (etapa 202) aqui. Calendário não é lista paginada: o recorte natural é o período, não a
página. Paginar um calendário deixa o mês incompleto, que é o defeito que esta etapa fecha.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useLogisticsCalendar.tsx` (tipo `CalendarFilters`,
`queryKey` e as duas consultas) e a tela que o chama
**Não tocar / armadilhas:** mantenha os `.limit(500)` das etapas 207 e 208 — com o mês como filtro eles
param de cortar na prática, mas seguem sendo a rede contra um intervalo absurdo. Se a tela permitir visão
anual, o teto volta a cortar: diga isso na PR em vez de aumentá-lo em silêncio. E ao mudar o tipo
`CalendarFilters`, releia **todos** os chamadores: campo obrigatório novo quebra o typecheck de quem não
passar.
**Depende de:** 202, 207, 208 · **Libera:** 211
**Risco e como reverter:** navegar entre meses passa a disparar uma consulta nova por mês (antes era uma só).
Em troca, cada consulta é muito menor. Se o usuário "varrer" os meses rápido, confira que o `staleTime` do
TanStack Query evita repetição — mencione o valor observado na PR. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'gte(\|lte(\|CalendarFilters' src/hooks/logistics/useLogisticsCalendar.tsx
grep -rn 'useLogisticsCalendar' src/
npm run typecheck 2>&1 | tail -3
```

Esperado: as duas consultas com `gte`/`lte` de período, todos os chamadores passando `from`/`to`, typecheck
em 0 erros. Depois do deploy, abra o Calendário, troque de mês e confirme na aba Rede que a URL da consulta
muda junto com o mês.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 210 — `useCotacoesMulticanal`: teto no servidor e colunas explícitas

**Onda / Severidade / Camada:** 6 / Alta / hook
**Achados resolvidos:** P-01, P-04
**Problema hoje:** `src/hooks/logistics/useCotacoesMulticanal.tsx:50-60` faz
`.from("cotacoes_multicanal").select("*, transportadora:transportadoras(...)")` e
`.order("created_at", { ascending: false })` — sem teto. E `:66` tem
`refetchInterval: 30000`: a tabela inteira, com join, é rebaixada **a cada 30 segundos** enquanto a tela
estiver aberta. `cotacoes_multicanal` tem **23 colunas** (`src/integrations/supabase/types.ts`), e o
`select("*")` traz todas.
**Causa raiz:** o comentário de `:66` explica o polling ("table removed from Realtime for security"), o que é
uma decisão válida — mas polling sobre consulta sem teto multiplica o custo por 120 vezes por hora, por
usuário com a tela aberta. É a pior combinação de P-01: a única leitura sem teto que também se repete sozinha.
**Caminho recomendado:** duas mudanças na mesma consulta, nesta ordem. (1) `.limit(200)` depois do
`.order(...)`, na forma de `src/hooks/notifications/useNotifications.tsx:35`; 200 é o teto que
`useUnifiedTracking.tsx:138,167` usa para leitura operacional recorrente, e cotação é um fluxo de curto
prazo — ninguém negocia a cotação de três meses atrás. (2) troque o `*` pela lista das colunas que a tela
realmente lê: abra o componente que consome o hook, liste os campos usados e escreva só esses, mantendo o
join `transportadora:transportadoras (id, nome_fantasia, razao_social, score_performance)` como está. O
padrão de colunas explícitas com join está em `src/pages/PainelSLA.tsx:156-160`. **Atalho tentador a
evitar:** subir o `refetchInterval` para "aliviar o banco". Isso troca um problema de custo por um de
frescor numa tela de negociação, e o dono não pediu. O teto e as colunas resolvem o custo sem mexer no
comportamento que alguém decidiu de propósito.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useCotacoesMulticanal.tsx` (apenas `:50-60`)
**Não tocar / armadilhas:** **não remova nem altere `refetchInterval: 30000` (`:66`)** e não tente religar o
realtime desta tabela — o comentário diz que ela foi tirada do Realtime por segurança; reverter isso é
decisão do dono, não desta etapa. Não mexa nas mutações (`createCotacao` em `:69` e seguintes). O tipo
`CotacaoMulticanal` do `as` em `:63` pode exigir ajuste se você restringir colunas: se exigir, **restrinja
menos** em vez de alterar o tipo. E não mexa nas ~16 listagens que já têm teto (lista na etapa 207).
**Depende de:** — · **Libera:** 211, 227
**Risco e como reverter:** cotações além das 200 mais recentes deixam de aparecer. Se a tela tiver filtro de
período, confirme que ele vai ao servidor; se não tiver, diga na PR que esse é o limite escolhido.
`git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -A14 'from("cotacoes_multicanal")' src/hooks/logistics/useCotacoesMulticanal.tsx
npm run typecheck 2>&1 | tail -3
```

Esperado: `.limit(200)` presente, nenhum `select("*"` no arquivo, `refetchInterval: 30000` intacto. Depois do
deploy, deixe a tela aberta 2 minutos e confirme na aba Rede 4 requisições, cada uma com no máximo 200
linhas; registre o tamanho em KB antes e depois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 211 — Guard automatizado: consulta de listagem sem teto reprova a CI

**Onda / Severidade / Camada:** 6 / Alta / CI
**Achados resolvidos:** P-01
**Problema hoje:** as etapas 204 a 210 consertam cinco consultas, e nada impede a sexta. O repositório já
mostrou que o teto é aplicado "caso a caso": 16 listagens têm, 5 não tinham, com tetos entre 1 e 5000 e
nenhum critério comum. Sem verificação automática, a dívida volta na próxima funcionalidade.
**Causa raiz:** regra que existe só na cabeça de quem revisa. O repositório já resolve esse tipo de problema
com script: `npm run validate:no-console` e `npm run validate:csp` são exatamente isso.
**Caminho recomendado:** escreva `scripts/ci/validate-query-limits.mjs` seguindo o desenho dos validadores
que já existem — leia primeiro `package.json` para ver como `validate:no-console` e `validate:csp` são
invocados, e o README da pasta `scripts/` antes de alterar qualquer coisa ali (é regra do `AGENTS.md`). O
script percorre `src/`, encontra cada cadeia `supabase.from(<tabela>)...select(` e reprova quando a cadeia
não contém `.limit(`, `.range(`, `.single(` ou `.maybeSingle(`. Acrescente uma **allowlist explícita** num
JSON ao lado, com as tabelas de domínio pequeno que P-01 avaliou e descartou de propósito —
`transportadoras`, `clientes`, `fornecedores`, `permissions`, `achievements`, `reward_items`,
`feature_flags`, `tabelas_frete`, `transportadora_rotas` — cada entrada com o motivo numa linha. Ligue o
script em `package.json` como `validate:query-limits` e registre-o no workflow de CI. **Atalho tentador a
evitar:** escrever uma regra de ESLint personalizada. Tentador e errado agora: o orçamento de avisos está em
105/105 e um aviso novo reprova a CI (o plano manda fazer as etapas 267-269 antes de tudo justamente por
isso); além disso regra ESLint sobre cadeia de métodos é frágil. Script dedicado falha com mensagem clara,
sem tocar no orçamento.
**Arquivos e objetos a tocar:** `scripts/ci/validate-query-limits.mjs` (novo), o JSON de allowlist ao lado,
`package.json` (um script novo), e o workflow de CI que roda os validadores
**Não tocar / armadilhas:** o script **não pode** acusar as ~16 listagens corretas — rode-o contra a `main`
antes de ligar na CI e confirme saída limpa para: `Envios.tsx:353` (500), `Coletas.tsx:122` (500),
`Ocorrencias.tsx:137` (500), `KanbanEntregas.tsx:268` (500), `PainelSLA.tsx:155,182` (500),
`ExportacaoDados.tsx:110` (5000), `RelatorioPDF.tsx:91` (2000), `useConciliacao.tsx:123` (2000),
`AuditTrail.tsx:30` (5000), `AdminTelemetria.tsx:51` (500), `TelemetryViewer.tsx:45` (100),
`useUnifiedTracking.tsx:138,167` (200), `useDrillDown.tsx:67,82` (100), `useGlobalSearch.tsx:57,76` (5),
`useSecurityEvents.ts:33-57` (100), `useAccuracyMetaCycle.ts:62` (1). Qualquer falso positivo nessa lista
significa que o script está errado, não o código. Mexer em `scripts/` dispara o check **"Contratos da
automação local"**: rode `npm run automation:test`. Mexer em workflow exige aprovação do dono.
**Depende de:** 202, 203, 204, 206, 207, 208, 209, 210 · **Libera:** —
**Risco e como reverter:** um falso positivo trava toda PR do repositório. Mitigação: na primeira PR ligue o
script em modo **aviso** (saída 0 com relatório) e só na PR seguinte transforme em falha, depois de ver um
ciclo limpo. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (altera CI/workflows)
**Como verificar:**

```bash
node scripts/ci/validate-query-limits.mjs
npm run automation:test 2>&1 | tail -20
git stash list >/dev/null && sed -i 's/\.limit(500);/;/' src/pages/Envios.tsx && node scripts/ci/validate-query-limits.mjs; git checkout -- src/pages/Envios.tsx
```

Esperado: saída limpa na `main` corrigida; e, no teste de sabotagem acima (remover um teto de propósito e
restaurar em seguida), o script **reprova** apontando arquivo e linha.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 212 — `Notificacoes.tsx`: teto imediato na leitura de `notifications`

**Onda / Severidade / Camada:** 6 / Alta / interface
**Achados resolvidos:** P-02
**Problema hoje:** `src/pages/Notificacoes.tsx:78-82` faz
`.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false })` — sem
teto. O contraste está no mesmo repositório: `src/hooks/notifications/useNotifications.tsx:31-35` faz a
**mesma** leitura, com o **mesmo** filtro, e termina em `.limit(50)`. O teto existe no hook e falta na página.
**Causa raiz:** a página não usa o hook. Reescreveu a consulta à mão e, ao reescrever, perdeu o teto.
**Caminho recomendado:** acrescente `.limit(200)` depois do `.order(...)` de `:82`. Esta é a etapa de
mitigação de uma linha: entra hoje, protege o usuário enquanto as etapas 213 a 215 montam a paginação no
servidor. Use 200 e não 50: a tela de notificações permite navegar o histórico (`:105` pagina de 15 em 15),
então cortar em 50 reduziria de visível a ~3 páginas. O arquivo de referência é
`src/hooks/notifications/useNotifications.tsx:35` — copie a posição do `.limit()` na cadeia, depois do
`.order()`. **Atalho tentador a evitar:** trocar a consulta da página pelo hook `useNotifications` "para
reaproveitar". Parece a correção limpa e não é: o hook devolve 50 fixos, sem paginação, e a página precisa de
navegação por histórico, seleção múltipla (`:107`) e filtros próprios (`:95-101`). A convergência dos dois
caminhos é decisão maior, que o plano não pede.
**Arquivos e objetos a tocar:** `src/pages/Notificacoes.tsx` (apenas a cadeia de `:78-82`)
**Não tocar / armadilhas:** não toque no `useRealtime` de `:88-93` (é a etapa 216), nem no `usePagination` de
`:105` (etapa 214), nem nas mutações de marcar como lido (`:109` em diante). **Não altere
`src/hooks/notifications/useNotifications.tsx`** — ele está correto e é o padrão de referência de teto para
todo o repositório; se você o mexer, as etapas 204, 207, 208, 210 e 212 perdem a referência.
**Depende de:** — · **Libera:** 213
**Risco e como reverter:** usuário com mais de 200 notificações para de ver as mais antigas até a etapa 213
entrar. É uma perda temporária de alcance em troca de uma tela que abre. Diga isso na PR. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -A8 'from("notifications")' src/pages/Notificacoes.tsx | head -20
npx eslint src/pages/Notificacoes.tsx
```

Esperado: `.limit(200)` na consulta de leitura da página. Depois do deploy, abra `/notificacoes` com a aba
Rede aberta e confirme no máximo 200 linhas na resposta; registre o tamanho em KB antes e depois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 213 — `Notificacoes.tsx`: adotar `useServerPagination` como primeiro consumidor do contrato

**Onda / Severidade / Camada:** 6 / Alta / interface
**Achados resolvidos:** P-02, P-01
**Problema hoje:** mesmo com o teto da etapa 212, a página baixa 200 linhas para mostrar 15 (`:105`,
`initialPageSize: 15`). O recorte continua sendo `data.slice(...)` em memória
(`src/hooks/common/usePagination.ts:57`), e quem tem histórico longo não alcança o resto.
**Causa raiz:** paginação no cliente depois de baixar tudo não economiza nada; só esconde o custo. Até a
etapa 202, o repositório não tinha alternativa — `grep -rn '\.range(' src/` era zero.
**Caminho recomendado:** **esta é a primeira tela a usar o contrato definido na etapa 202** — leia o
cabeçalho de `src/hooks/common/useServerPagination.ts` antes de escrever uma linha, e siga as 5 regras dele
à risca, porque as telas seguintes vão copiar desta. Substitua a `useQuery` de `:70-85` por uma chamada a
`useServerPagination`, passando: `queryKeyBase` com `["notifications", user.id]`; e uma `fetchPage` que faz
`.from("notifications").select("<colunas>", { count: "exact" }).eq("user_id", user.id).order("created_at",
{ ascending: false }).order("id", { ascending: false }).range(from, to)`. Os dois pontos que não podem faltar:
(a) `{ count: "exact" }` — é de onde vem o total, e sem ele a barra de paginação mostra número errado;
(b) o **segundo `order` por `id`** — `created_at` pode repetir entre notificações criadas no mesmo instante
por um disparo em lote, e `.range()` sobre ordem não determinística repete e perde linhas entre páginas.
Esse é o erro que só aparece em produção. **Atalho tentador a evitar:** manter o `usePagination` em memória
"só para a barra de navegação" e alimentá-lo com as linhas da página. Ele recalcula `totalPages` a partir de
`data.length` (`usePagination.ts:49`), que agora é 15: a barra mostraria "1 página" para sempre. A troca é
do hook inteiro, não só da consulta — e é a etapa 214.
**Arquivos e objetos a tocar:** `src/pages/Notificacoes.tsx` (o bloco de `useQuery` em `:70-85`)
**Não tocar / armadilhas:** o `.limit(200)` da etapa 212 **sai** nesta etapa: `.limit()` junto com `.range()`
é proibido pelo contrato (regra 1) e dá resultado imprevisível. Não mexa no `useRealtime` (`:88-93`, etapa 216) nem nos filtros (`:95-104`, etapa 215) — a página fica _temporariamente inconsistente_ entre esta etapa
e a 215, porque os filtros ainda rodam no cliente sobre a página atual; declare isso na PR e faça a 214 e a
215 na sequência, sem deixar a tela nesse estado.
**Depende de:** 202, 212 · **Libera:** 214, 215, 216
**Risco e como reverter:** é a mudança mais delicada deste lote — paginação no servidor errada _some_ com
dados sem avisar. Teste navegando até a última página e voltando, conferindo que nenhuma notificação aparece
duas vezes nem desaparece. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'useServerPagination\|count: "exact"\|\.range(\|\.limit(' src/pages/Notificacoes.tsx
npm run typecheck 2>&1 | tail -3
```

Esperado: `useServerPagination`, `count: "exact"` e `.range(` presentes; **nenhum** `.limit(` restante no
arquivo. Depois do deploy, na aba Rede: cada troca de página dispara **uma** requisição, com
`Range: <from>-<to>` no cabeçalho e no máximo 15 linhas na resposta.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 214 — `Notificacoes.tsx`: trocar a barra de paginação em memória pela do servidor

**Onda / Severidade / Camada:** 6 / Média / interface
**Achados resolvidos:** P-02
**Problema hoje:** `src/pages/Notificacoes.tsx:105` ainda chama
`usePagination(filteredData, { initialPageSize: 15 })`, e `:107` alimenta `useSelection` com
`pagination.paginatedData`. Depois da etapa 213 os dados já vêm paginados do servidor, então esse segundo
recorte corta 15 de 15 — e `totalPages`, derivado de `data.length` (`usePagination.ts:49`), passa a valer 1.
A barra de navegação mente.
**Causa raiz:** dois mecanismos de paginação empilhados. O de memória precisa sair.
**Caminho recomendado:** remova o `usePagination` de `:105` e passe a usar os campos que
`useServerPagination` devolve (`rows`, `total`, `currentPage`, `totalPages`, `setPage`, `nextPage`,
`prevPage`, `setPageSize`). O contrato da etapa 202 manteve **os mesmos nomes** de retorno de
`usePagination.ts` exatamente para que o componente de barra de paginação não precise mudar: confira isso
antes de reescrever JSX. Troque `pagination.paginatedData` por `rows` em `:107` (`useSelection`) e no
`map` da tabela. O "X de Y" da tela passa a usar `total` (do servidor), nunca `rows.length` — regra 2 do
contrato. **Atalho tentador a evitar:** derivar `total` de `rows.length` "porque está ali". É o erro que o
contrato nomeia: `rows.length` é 15 em toda página, e o rodapé passa a dizer "15 de 15" para sempre.
**Arquivos e objetos a tocar:** `src/pages/Notificacoes.tsx` (`:105`, `:107`, o JSX da tabela e o rodapé de
paginação)
**Não tocar / armadilhas:** **não altere `src/hooks/common/usePagination.ts`** — 20 arquivos o importam e as
outras 19 telas continuam usando-o corretamente. Esta etapa só para de importá-lo **nesta página**. Confira
que `useSelection` (`:107`) continua recebendo as linhas visíveis: se receber o conjunto errado, "selecionar
todos" passa a marcar o que não está na tela — e as ações em massa de notificação agem sobre ids que o
usuário não viu.
**Depende de:** 213 · **Libera:** 215
**Risco e como reverter:** erro aqui afeta seleção múltipla e ações em massa. Teste "selecionar todos" em
duas páginas diferentes e confirme que a contagem bate com as linhas visíveis. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'usePagination\|paginatedData\|rows.length\|total' src/pages/Notificacoes.tsx
npx eslint src/pages/Notificacoes.tsx && npm run typecheck 2>&1 | tail -3
```

Esperado: nenhum `usePagination` nem `paginatedData` no arquivo; o rodapé usando `total`. Depois do deploy,
com um usuário que tenha mais de 15 notificações: o rodapé mostra o total real e a navegação alcança a
última página.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 215 — `Notificacoes.tsx`: levar os filtros e a busca para o servidor

**Onda / Severidade / Camada:** 6 / Alta / interface
**Achados resolvidos:** P-02
**Problema hoje:** `src/pages/Notificacoes.tsx:95-101` filtra tipo e lido/não lido com `list.filter(...)` em
memória, e `:103-104` aplica `useFilters(customFiltered, filterConfig)` para a busca textual — também em
memória. Depois da etapa 213 isso roda sobre **a página atual**: o usuário filtra por "não lidas", vê 2
resultados, e as outras 40 não lidas estão em páginas que o filtro nunca viu. Paginação no servidor com
filtro no cliente não é uma otimização incompleta — é uma tela que **mente**.
**Causa raiz:** ordem natural de quem converte uma tela: trocar a consulta primeiro e o filtro depois. Entre
as duas coisas a tela fica errada, e é por isso que esta etapa não pode ficar para depois.
**Caminho recomendado:** mova os três filtros para a `fetchPage` da etapa 213, dentro da mesma cadeia:
`typeFilter !== "all"` → `.eq("type", typeFilter)`; `readFilter` → `.eq("read", true)` ou `.eq("read",
false)`; busca textual → `.ilike("title", `%${termo}%`)` (ou a coluna que `filterConfig` usa hoje — abra
`filterConfig` e confira **quais** campos ele varre antes de escolher). Inclua os três valores na
`queryKeyBase`, e garanta que trocar qualquer filtro **volta para a página 1** — regra 3 do contrato da
etapa 202; se `useServerPagination` ainda não faz esse reset sozinho, faça-o aqui e anote na PR que o
contrato precisa absorvê-lo. Para a busca, aplique um atraso (debounce) antes de disparar a consulta: sem
isso, cada tecla é uma ida ao banco. **Atalho tentador a evitar:** manter o filtro no cliente "porque a
busca em memória é instantânea". Instantânea e errada: ela só enxerga 15 linhas. Se a velocidade da digitação
preocupar, o remédio é o atraso na busca, não filtrar o conjunto errado.
**Arquivos e objetos a tocar:** `src/pages/Notificacoes.tsx` (`:95-104` e a `fetchPage` criada na etapa 213)
**Não tocar / armadilhas:** não altere `src/hooks/common/useFilters.ts` — outras telas o usam sobre listas
que vêm inteiras, onde ele está correto; esta página simplesmente para de usá-lo. Confirme que as colunas que
você vai filtrar **existem** em `notifications` (`src/integrations/supabase/types.ts`, bloco
`notifications`) antes de escrever `.eq(...)`: nome de coluna errado no PostgREST volta como erro 400 em
produção, não como erro de compilação.
**Depende de:** 213, 214 · **Libera:** 216
**Risco e como reverter:** filtro no servidor com coluna errada quebra a tela inteira (400). Teste as seis
combinações (3 tipos × 2 estados de leitura) antes de mergear. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'useFilters\|typeFilter\|readFilter\|ilike' src/pages/Notificacoes.tsx
npm run typecheck 2>&1 | tail -3
```

Esperado: os filtros aparecem na cadeia da consulta, não em `.filter(` de array. Depois do deploy, com um
usuário que tenha não lidas em mais de uma página: filtrar por "não lidas" traz **todas**, o rodapé mostra o
total correto, e trocar o filtro volta para a página 1.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 216 — `Notificacoes.tsx`: o tempo real deixa de rebaixar a lista inteira a cada aviso

**Onda / Severidade / Camada:** 6 / Alta / interface
**Achados resolvidos:** P-02
**Problema hoje:** `src/pages/Notificacoes.tsx:88-93` registra `useRealtime({ table: "notifications",
onInsert: () => refetch(), onUpdate: () => refetch(), onDelete: () => refetch() })`. Cada notificação nova,
cada marcação de lida e cada exclusão dispara um `refetch()` da consulta de listagem. Antes da etapa 212 isso
rebaixava a tabela inteira; depois da 213, rebaixa a página atual — mas em rajada: um disparo em lote de 30
notificações gera 30 `refetch()`.
**Causa raiz:** o aviso de tempo real é tratado como "recarregue tudo" em vez de "algo mudou". E
`onUpdate: () => refetch()` cria um laço com as próprias mutações da página: marcar como lido grava, o
realtime avisa, a página rebaixa.
**Caminho recomendado:** troque os três `refetch()` por uma invalidação com agrupamento: acumule os eventos
numa janela curta (300-500 ms) e dispare **uma** invalidação do `queryKey` da listagem ao fim dela. Para
`onUpdate`, prefira atualizar a linha no cache do TanStack Query a partir do payload do evento, em vez de
refazer a consulta — é um `setQueryData` na linha com aquele `id`. Antes de escolher a forma, leia
`src/hooks/common/useRealtime` (ou o caminho que `grep -rn "useRealtime" src/hooks/` apontar) e confirme se
o payload do evento traz a linha; se não trouxer, fique na invalidação agrupada e diga isso na PR.
**Importante:** o achado R-02 descreve um defeito **diferente** e maior no mesmo hook — a assinatura de tempo
real é derrubada e reaberta a cada render, em 12 telas. Se a etapa de R-02 já tiver sido feita, o hook pode
ter mudado: releia (regra 2). Se **não** tiver, não a faça aqui. **Atalho tentador a evitar:** remover o
tempo real da tela e deixar só o polling. Notificação é o caso em que o tempo real tem valor real para quem
usa, e remover resolve o custo destruindo a funcionalidade.
**Arquivos e objetos a tocar:** `src/pages/Notificacoes.tsx` (apenas `:88-93`)
**Não tocar / armadilhas:** **não altere o hook `useRealtime`** — 12 telas dependem dele e o defeito dele é
de outro achado (R-02); mexer aqui mistura dois lotes e dois riscos. Não remova a assinatura. Confirme que
marcar uma notificação como lida continua atualizando a tela (o caminho que você vai mudar é o mesmo que
hoje faz isso funcionar por acidente).
**Depende de:** 213, 215 · **Libera:** —
**Risco e como reverter:** se a invalidação agrupada estiver errada, a tela para de atualizar sozinha — falha
silenciosa. Teste com duas abas abertas: crie uma notificação numa e confirme que aparece na outra em até 1
segundo. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -A8 'useRealtime' src/pages/Notificacoes.tsx
npx eslint src/pages/Notificacoes.tsx
```

Esperado: nenhum `refetch()` direto nos três callbacks. Depois do deploy, com a aba Rede aberta, dispare 5
notificações em sequência e confirme **1 ou 2** requisições de listagem, não 5.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 217 — `useAccuracyMetaCycle`: uma única consulta a `notifications` para todas as linhas

**Onda / Severidade / Camada:** 6 / Média / hook
**Achados resolvidos:** P-03
**Problema hoje:** `src/hooks/logistics/useAccuracyMetaCycle.ts:54-55` faz
`await Promise.all(rows.map(async (s) => ...))`, e dentro do laço `:61-70` consulta `notifications` **uma
vez por transportadora configurada** — com `.eq("user_id", uid)`, `.gte("created_at", dayAgoIso)`,
`.contains("metadata", { source: "accuracy-meta-monitor", carrier: ... })` e `.limit(1)`. Com 10
transportadoras configuradas, são 10 consultas quase idênticas, diferindo só no `carrier` do `metadata`.
**Causa raiz:** o filtro que varia está dentro de um `jsonb` (`metadata.carrier`), e o autor não viu como
pedir vários valores de uma vez — então pediu um por vez.
**Caminho recomendado:** **o padrão correto está no repositório e deve ser copiado:**
`src/hooks/common/useComments.tsx:46-51` monta `const userIds = [...new Set(...)]` e faz **uma** consulta com
`.in("id", userIds)`; `src/components/shipping/ExpeditionDetailsDialog.tsx:116-125` faz o mesmo com
`Array.from(new Set(...))`. Aplique a mesma forma: antes do laço, faça **uma** consulta a `notifications`
com `.eq("user_id", uid)`, `.gte("created_at", dayAgoIso)` e
`.contains("metadata", { source: "accuracy-meta-monitor" })` — só a parte **comum** do filtro, sem o
`carrier` — selecionando `id, metadata`. Monte um `Set` dos `carrier` encontrados e, dentro do laço, troque a
consulta por uma consulta ao `Set` em memória. O `.limit(1)` sai e entra um teto do conjunto (ex.: 500), já
que agora é uma leitura só. **Atalho tentador a evitar:** montar um `.or(...)` com um `contains` por
transportadora. Fica uma string gigante, difícil de ler, e o PostgREST tem limite de tamanho de URL — com
muitas transportadoras a requisição passa a falhar por 414, em produção, só para quem tem muitas
configurações. O `Set` em memória não tem esse teto.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useAccuracyMetaCycle.ts` (`:54-80`)
**Não tocar / armadilhas:** **não toque na chamada `supabase.rpc("count_prediction_breach_days", ...)` de
`:57`** — é a etapa 218 e envolve DDL. Esta etapa remove **uma** das duas consultas por linha; a outra fica
para depois. Mantenha a lógica de `status` (`:74-79`: `ok` / `warming` / `pending` / `notified`) byte a byte:
ela decide se o usuário recebe alerta, e mudar o resultado dela é mudar comportamento de negócio.
**Depende de:** — · **Libera:** 218
**Risco e como reverter:** se o `Set` for montado com a chave errada (`carrier` nulo vira `"__all__"` em
`:67` — preste atenção nesse caso), o hook passa a dizer "não notificado" para quem foi notificado, e o
alerta repete. Teste com uma configuração de `transportadora: null`. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'from("notifications")\|new Set\|contains(' src/hooks/logistics/useAccuracyMetaCycle.ts
npx vitest run src/hooks/logistics/ 2>&1 | tail -20
```

Esperado: **uma só** `from("notifications")` no arquivo, fora do `rows.map`. Depois do deploy, com a aba Rede
aberta na tela que usa o hook: 1 requisição a `notifications`, não N.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 218 — `count_prediction_breach_days`: variante que responde todas as transportadoras numa chamada

**Onda / Severidade / Camada:** 6 / Média / banco + hook
**Achados resolvidos:** P-03
**Problema hoje:** `src/hooks/logistics/useAccuracyMetaCycle.ts:57-60` chama
`supabase.rpc("count_prediction_breach_days", { _target, _carrier })` **uma vez por transportadora
configurada**, dentro do `rows.map` de `:55`. Depois da etapa 217 essa é a última consulta por item do hook.
**Causa raiz:** a função SQL responde para **uma** transportadora. Para responder N, o front chama N vezes.
**Caminho recomendado:** comece **lendo a definição real da função no banco ao vivo** — não nas migrations,
que são histórico (as 248 do repositório não descrevem o estado atual):

```sql
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'count_prediction_breach_days';
```

Com a definição em mãos, escreva uma migration que **acrescenta** `count_prediction_breach_days_bulk(_pairs
jsonb)` — recebendo os pares `(carrier, target)` e devolvendo uma linha por par — sem alterar a função
existente. Mantenha `SECURITY DEFINER` e `search_path` exatamente como a função atual os tem (padrão do
repositório: `docs/adr/0014-security-definer-rls-pattern.md`), e os mesmos `GRANT`. Depois troque as N
chamadas do hook por uma. **Atalho tentador a evitar:** usar `CREATE OR REPLACE` na função que já existe para
mudar a assinatura. Duas razões: `docs/agentes/banco.md:46-47` manda que mudança de contrato de função usada
pelo front só venha **depois** do deploy do código; e entre o apply e o deploy a tela quebra. Função nova ao
lado remove a janela de quebra, e a antiga pode ser removida numa etapa futura, se alguém quiser.
**Arquivos e objetos a tocar:** `supabase/migrations/<timestamp>_count_prediction_breach_days_bulk.sql`
(novo; use **slug**, nunca reaproveite timestamp — `docs/agentes/banco.md:51-54`),
`src/hooks/logistics/useAccuracyMetaCycle.ts` (`:55-60`)
**Não tocar / armadilhas:** não altere nem remova `count_prediction_breach_days` — pode haver outro chamador
(`grep -rn 'count_prediction_breach_days' src/ supabase/` antes). **Migrations são histórico, não estado:**
leia a função no banco, como acima. Atenção à ordem obrigatória de `docs/agentes/banco.md:45-47`: arquivo →
PR → merge → deploy do código → apply no banco. Como a função é nova e ninguém a chama até o deploy, a ordem
aqui é segura; inverter já não seria. Nota: `docs/agentes/banco.md:48-49` afirma que "não existe workflow de
apply", mas `.github/workflows/aplicar-migration.yml` existe (dispatch manual, exige digitar `APLICAR`,
roda em transação) — corrija essa linha do documento na mesma PR, como o `AGENTS.md` manda.
**Depende de:** 217 · **Libera:** —
**Risco e como reverter:** DDL em produção. A função nova não afeta nada até o front chamá-la; reverter =
`git revert` do código e `DROP FUNCTION` da variante nova, que ninguém mais usa.
**Precisa de aprovação humana antes do merge:** **sim** — cria objeto no banco de produção. **A PR fica
aberta, com a migration pronta e a consulta de leitura da função já executada e anexada**, aguardando o dono.
**Como verificar:**

```sql
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND proname LIKE 'count_prediction_breach_days%';
```

Esperado: as **duas** funções listadas depois do apply. No front,
`grep -n 'rpc("count_prediction_breach_days' src/hooks/logistics/useAccuracyMetaCycle.ts` mostra **uma**
chamada, fora do laço, e os valores de `breach_days` por transportadora batem com os de antes (compare lado a
lado e anexe à PR). Sem acesso ao banco, a etapa fica **aberta** com esse motivo no progresso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 219 — `useKPIBenchmark`: tirar os `await` de dentro do laço

**Onda / Severidade / Camada:** 6 / Média / hook
**Achados resolvidos:** P-03
**Problema hoje:** `src/hooks/analytics/useKPIBenchmark.tsx:41` abre
`for (let i = 0; i < periodsBack; i++)` e dentro dele faz três `await` **em sequência**: `:47` (`entregas`),
`:57` (`coletas`), `:68` (`ocorrencias`). Com o padrão `periodsBack = 6` (`:34`) são **18 idas ao banco uma
após a outra** antes de a tela aparecer. A espera é a soma das 18, não a maior delas.
**Causa raiz:** `await` dentro de laço serializa o que é independente — os seis meses não dependem um do
outro.
**Caminho recomendado:** **o padrão correto está no arquivo gêmeo:**
`src/hooks/analytics/useExecutiveMetrics.tsx:40-47` resolve o mesmo problema com
`Array.from({ length: 6 }).map(async (_, i) => ...)` e `Promise.all` em volta das três consultas do mês.
Copie essa forma aqui: troque o `for` por `Array.from({ length: periodsBack }).map(async (_, i) => ...)`,
envolva as três consultas do mês em `Promise.all` e o conjunto dos meses em outro `Promise.all`. O cálculo
de métricas de `:76` em diante continua igual, só passa a rodar dentro da função do `map`. Isso leva o tempo
de 18 consultas em série para ~1 rodada em paralelo. **Atalho tentador a evitar:** já partir para a consulta
única agregada. Ela é a correção melhor e é a etapa 220 — mas muda os números calculados, e por isso precisa
ser verificada contra os valores atuais. Esta etapa é mudança de forma, com resultado **idêntico**: entra
rápido, com risco quase nulo, e deixa a tela utilizável enquanto a 220 é feita com cuidado.
**Arquivos e objetos a tocar:** `src/hooks/analytics/useKPIBenchmark.tsx` (apenas a estrutura do laço,
`:39-41` e o fechamento)
**Não tocar / armadilhas:** **não altere nenhum cálculo** (`:76` em diante) nem os `.limit(1000)` de `:55` e
`:65` — eles são teto correto e removê-los recria P-01 noutro lugar. Atenção à **ordem** do resultado: o
`for` empilha `periods.push(...)` de `i = 0` (mês atual) para trás; `Promise.all` sobre `map` preserva a
ordem dos índices, mas confira que o array final sai na mesma ordem de antes — se o gráfico inverter, é isso.
Note que a consulta de `ocorrencias` (`:68-72`) **não tem teto**, ao contrário das outras duas: não é escopo
desta etapa, anote em "Achados novos" do progresso.
**Depende de:** — · **Libera:** 220
**Risco e como reverter:** 18 consultas simultâneas em vez de sequenciais aumentam o pico de carga no banco.
Com teto de 1000 por consulta é aceitável, mas registre na PR. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'for (let i\|Promise.all\|Array.from' src/hooks/analytics/useKPIBenchmark.tsx
npx vitest run src/hooks/analytics/ 2>&1 | tail -20
```

Esperado: nenhum `for` com `await` dentro. Depois do deploy, abra `/analytics` com a aba Rede aberta: as
requisições de `entregas`/`coletas`/`ocorrencias` saem **em paralelo** (barras sobrepostas na cascata, não em
escada) e os números na tela são **iguais** aos de antes — anexe a comparação à PR.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 220 — `useKPIBenchmark`: uma consulta por tabela cobrindo todos os períodos

**Onda / Severidade / Camada:** 6 / Média / hook
**Achados resolvidos:** P-03
**Problema hoje:** mesmo em paralelo (etapa 219), `src/hooks/analytics/useKPIBenchmark.tsx` faz 18 consultas
para montar 6 pontos de um gráfico. Cada uma pede a mesma tabela, com as mesmas colunas, variando só o
intervalo de `created_at` — e os seis intervalos são contíguos.
**Causa raiz:** o agrupamento por mês está no laço do cliente, e não na consulta. O repositório já sabe
agrupar no cliente depois de **uma** leitura: é o mesmo raciocínio de `useComments.tsx:46`.
**Caminho recomendado:** troque as 18 consultas por **3** — uma por tabela — com um único intervalo que vai
de `startOfMonth(subMonths(new Date(), periodsBack - 1))` até `endOfMonth(new Date())`, e agrupe por mês no
cliente. A forma de montar o agrupamento tem referência no repositório:
`src/hooks/logistics/useTrackingAnalytics.tsx:138-141` monta
`const groupedByOrder: Record<string, TrackingPoint[]> = {}` com um `forEach` e acumula — copie esse desenho,
trocando a chave por `format(new Date(row.created_at), "yyyy-MM")`. Mantenha as mesmas colunas no `select` e
ajuste o teto: três consultas de seis meses precisam de mais que 1000 — use 6000 (`periodsBack * 1000`), para
que o teto continue proporcional ao que o código pedia antes. **Atalho tentador a evitar:** mover a
agregação para o banco com uma view ou uma função SQL. É a solução mais rápida em execução e a mais cara
agora: exige DDL em produção, aprovação do dono, e um novo objeto para manter. Com teto e agrupamento no
cliente o ganho já é de 18 consultas para 3, sem tocar no banco. Se depois disso ainda estiver lento, aí vale
propor a agregação no servidor como etapa nova.
**Arquivos e objetos a tocar:** `src/hooks/analytics/useKPIBenchmark.tsx` (as três consultas e o agrupamento)
**Não tocar / armadilhas:** o risco desta etapa é **número errado**, não lentidão. O corte por mês tem de
usar o mesmo critério de antes: `:43-44` usa `startOfMonth(date)` / `endOfMonth(date)` sobre
`subMonths(new Date(), i)` e filtra `created_at` — se você agrupar por outro campo de data, ou por fuso
diferente, os meses mudam de valor em silêncio. Compare os seis pontos antes e depois, um por um, e anexe à
PR. Não mexa em `useExecutiveMetrics` aqui (é a 221) nem nos cálculos de OTIF e prazo.
**Depende de:** 219 · **Libera:** 221
**Risco e como reverter:** se o teto de 6000 for atingido num mês muito movimentado, os meses mais antigos
perdem linhas e o gráfico mente. Confira o volume real antes: `SELECT date_trunc('month', created_at) m,
count(*) FROM entregas WHERE deleted_at IS NULL GROUP BY 1 ORDER BY 1 DESC LIMIT 6;`. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -c 'from("entregas")\|from("coletas")\|from("ocorrencias")' src/hooks/analytics/useKPIBenchmark.tsx
npx vitest run src/hooks/analytics/ 2>&1 | tail -20
```

Esperado: **3** consultas no arquivo. Depois do deploy, na aba Rede: 3 requisições (antes 18), e os seis
pontos do gráfico **idênticos** aos registrados na etapa 219 — a comparação lado a lado é a evidência que
conclui a etapa.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 221 — `useExecutiveMetrics`: mesma consolidação de 18 consultas para 3

**Onda / Severidade / Camada:** 6 / Baixa / hook
**Achados resolvidos:** P-03
**Problema hoje:** `src/hooks/analytics/useExecutiveMetrics.tsx:40-47` faz as mesmas 18 consultas de
`useKPIBenchmark`, mas já em paralelo (`Array.from({ length: 6 }).map` + `Promise.all`). Severidade **baixa**:
o usuário não espera 18 vezes, espera uma. O custo que sobra é no banco — 18 planos de consulta e 18 varreduras
para montar 6 pontos.
**Causa raiz:** idêntica à da etapa 220 — o agrupamento por mês está no laço do cliente.
**Caminho recomendado:** repita aqui **exatamente** o que a etapa 220 fez em `useKPIBenchmark`: um intervalo
de 6 meses, três consultas, agrupamento por `yyyy-MM` no cliente. O arquivo de referência agora é o
`useKPIBenchmark.tsx` já corrigido — abra-o e espelhe, inclusive o teto proporcional (`6 * 1000`). Os dois
hooks vão ficar com a mesma forma, o que é bom: o próximo agente que abrir qualquer um dos dois encontra o
mesmo desenho. **Atalho tentador a evitar:** extrair um hook compartilhado entre os dois para "não repetir
código". É refatoração não pedida, toca dois arquivos de uma vez e, se a abstração sair errada, quebra duas
telas. Se a duplicação incomodar depois, vira etapa própria.
**Arquivos e objetos a tocar:** `src/hooks/analytics/useExecutiveMetrics.tsx` (apenas o bloco `trends`,
`:35-95`)
**Não tocar / armadilhas:** os tetos atuais são **diferentes** por tabela: `entregas` 1000 (`:54`), `coletas`
1000 (`:61`), `ocorrencias` **500** (`:68`). Preserve essa proporção ao escalar (6000 / 6000 / 3000), senão
você muda o número que a tela mostra. Não altere o cálculo de OTIF (`:74-84`) nem o de custo de frete
(`:85-89`). E confira se há outras `useQuery` no arquivo além de `trends` — a auditoria leu `:25-95`; releia
o resto antes de mexer (regra 2).
**Depende de:** 220 · **Libera:** —
**Risco e como reverter:** mesmo risco de número errado da etapa 220, com menos urgência. Compare os seis
meses antes e depois. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -c 'from("entregas")\|from("coletas")\|from("ocorrencias")' src/hooks/analytics/useExecutiveMetrics.tsx
npx vitest run src/hooks/analytics/ 2>&1 | tail -20
```

Esperado: **3** consultas no bloco `trends`. Depois do deploy, na aba Rede: 3 requisições, e os valores de
`otif`, `custoFrete`, `entregas`, `coletas` e `ocorrencias` por mês iguais aos de antes.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 222 — Conferir `types.ts` contra o banco ao vivo e regenerar se houver divergência

**Onda / Severidade / Camada:** 6 / Média / tipos + banco
**Achados resolvidos:** P-04
**Problema hoje:** as etapas 223 a 227 trocam `select("*")` por listas de colunas, e a única fonte que o
executor tem para saber **quais colunas existem** é `src/integrations/supabase/types.ts` (6612 linhas,
arquivo gerado). Se ele estiver defasado em relação ao banco, as listas nascem erradas e o erro só aparece em
produção, como 400 do PostgREST.
**Correção a um ponto do achado:** P-04 afirma que `rastreamento_historico` **não aparece** como bloco `Row`
em `types.ts`. **Isso é falso** — conferido hoje: o bloco está em `src/integrations/supabase/types.ts:3541`,
com 13 colunas, e as 18 partições mensais aparecem logo abaixo (`:3594` em diante). A premissa do achado não
se confirma; o que **permanece** válido é a necessidade de provar que o arquivo gerado bate com o banco antes
de usá-lo como fonte, e isso é o que esta etapa faz. Registre a correção em `05-PROGRESSO.md`.
**Causa raiz:** `types.ts` é gerado por introspecção do banco; entre duas gerações ele é uma foto antiga.
Nada no fluxo de uma PR comum garante que a foto é de hoje.
**Caminho recomendado:** **não gere nada à mão e não edite `types.ts`** (`docs/agentes/banco.md:62-63`:
arquivo gerado, não editar). O repositório já tem a ferramenta e a automação: o script é
`scripts/db-audit/gen-types.sh` (leia o cabeçalho `:1-20` e `scripts/db-audit/README.md:57-62` antes de
rodar — ele exige `DESTINO_URL` e sobe um proxy local para não expor a credencial), e o workflow é
`.github/workflows/types-sync.yml`, que roda semanalmente e em `push` na `main` e **abre PR quando acha
divergência**. Comece pelo caminho mais barato: veja se o `types-sync` rodou e o que ele disse
(`gh run list --workflow types-sync.yml --limit 5`, e procure PR em `automation/types-sync` ou issue
`[types-sync]`). Se houver PR aberta dele, ela **é** a resposta: a divergência existe e está descrita ali.
Se não houver nada e você quiser a prova fresca, dispare o workflow (`workflow_dispatch`) em vez de rodar o
script localmente — o workflow tem o segredo, você não. **Atalho tentador a evitar:** editar `types.ts` à mão
para "só acrescentar a coluna que falta". O arquivo é sobrescrito na próxima geração, a edição desaparece, e
no meio do caminho o typecheck aprova código que o banco recusa.
**Arquivos e objetos a tocar:** nenhum, se o `types-sync` já disser que está sincronizado (etapa de
verificação e registro). Se houver divergência: `src/integrations/supabase/types.ts`, **apenas** pela saída
do gerador.
**Não tocar / armadilhas:** não rode `supabase gen types` direto nem com `--local`: `--local` introspecta só
o que está em `supabase/migrations/` e **não enxerga o banco oficial** (`gen-types.sh:11-12`), o que
produziria exatamente a foto errada que esta etapa quer evitar. Não aponte para
`hgicfqjayrjurivtygqf` (Lovable Cloud) nem para `uwbpzfcysppwikfpnzok` (ref morto) — o banco oficial é
`jvfhclubfpxrtrrazrgr`. Mexer em `scripts/db-audit/` dispara o `types-sync` em `push` na `main`.
**Depende de:** — · **Libera:** 223, 224, 225, 226, 227
**Risco e como reverter:** se `types.ts` for regenerado e o schema real tiver mudado, o typecheck pode passar
a reprovar código que hoje compila — o que é a informação correta chegando, não uma quebra. Nesse caso, pare
e registre: adaptar o front a um schema que mudou é escopo maior que esta etapa. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (leitura do banco de produção e uso do segredo
`DESTINO_URL`; o dono dispara o workflow)
**Como verificar:**

```bash
gh run list --workflow types-sync.yml --limit 5
gh pr list --head automation/types-sync
grep -n 'rastreamento_historico: {' src/integrations/supabase/types.ts
```

Esperado: a última execução do `types-sync` **verde e recente**, sem PR de divergência aberta — essa é a
evidência de que `types.ts` descreve o banco. Anote a data da execução em `05-PROGRESSO.md`. Se o workflow
nunca rodou ou falhou, a etapa fica **aberta** com esse motivo, e as etapas 223 a 227 só prosseguem
conferindo cada coluna contra `types.ts` **e** declarando na PR que a fonte não foi validada.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 223 — `Envios.tsx`: trocar `select("*")` por colunas explícitas em `entregas`

**Onda / Severidade / Camada:** 6 / Média / interface
**Achados resolvidos:** P-04
**Problema hoje:** `src/pages/Envios.tsx:352-359` faz
`.select("*, cliente:clientes(id, razao_social, nome_fantasia), transportadora:transportadoras(id,
nome_fantasia)")` com `.limit(500)`. `entregas` tem **33 colunas** (conferido em
`src/integrations/supabase/types.ts`), e os joins estão corretos — pedem só o que usam. O `*` não: traz as 33,
incluindo campos `jsonb`, para uma tabela que mostra talvez 10.
**Causa raiz:** `select("*")` é o padrão de quem escreve rápido e o teto já existe, então o custo não aparece
como lentidão de banco — aparece como banda. Quem usa 4G ou internet ruim paga 500 linhas × 33 colunas a cada
abertura da tela.
**Caminho recomendado:** liste as colunas que a tela realmente consome. Ache-as pelo tipo: `Entrega` (o `as`
de `:361`) e os campos usados no JSX e nos filtros da página. **O padrão de referência de colunas explícitas
com join está em `src/pages/PainelSLA.tsx:155-160`** — mesma tabela `entregas`, mesma forma de join
(`transportadora:transportadoras (nome_fantasia)`), com a lista de colunas em texto multilinha. Copie esse
formato. Mantenha `id` sempre (chave das ações), e mantenha `version` se a tela tiver trava de concorrência
(`KanbanEntregas.tsx:272` pede `version` por isso). Não mexa nos joins — já estão explícitos. **Atalho
tentador a evitar:** listar as 33 colunas "para não arriscar". Isso não economiza nada e dá a impressão de ter
sido feito. Liste o que a tela usa; se faltar algo, o typecheck do tipo `Entrega` acusa antes do deploy.
**Arquivos e objetos a tocar:** `src/pages/Envios.tsx` (apenas a cadeia `:352-361`)
**Não tocar / armadilhas:** **não remova o `.limit(500)` de `:359` nem o `.is("deleted_at", null)` de
`:356`** — o teto está correto (P-01 o lista entre os 16 que não devem ser mexidos) e o filtro de exclusão
lógica é política do repositório (`docs/SOFT_DELETE_POLICY.md`). Se o tipo `Entrega` exigir campos que a tela
não mostra, **inclua-os**: ajustar o tipo é mudança maior e fora do escopo. Confira as colunas em `types.ts`
(bloco `entregas`), não de memória — nome de coluna errado vira 400 em produção, não erro de compilação.
**Depende de:** 222 · **Libera:** —
**Risco e como reverter:** coluna que faltou aparece como `undefined` na tela — campo vazio, sem erro. Teste
a tela de ponta a ponta: lista, filtros, abertura do detalhe e cada ação do menu de linha. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -A10 'from("entregas")' src/pages/Envios.tsx | head -16
npm run typecheck 2>&1 | tail -3
```

Esperado: nenhum `select("*` na consulta de `entregas` da página, `.limit(500)` intacto. Depois do deploy,
abra `/envios` com a aba Rede aberta e registre o tamanho em KB da resposta antes e depois — essa diferença
é a evidência da etapa.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 224 — `Coletas.tsx`: trocar `select("*")` por colunas explícitas em `coletas`

**Onda / Severidade / Camada:** 6 / Média / interface
**Achados resolvidos:** P-04
**Problema hoje:** `src/pages/Coletas.tsx:121-128` faz
`.select("*, fornecedores!fk_coletas_fornecedor(razao_social, nome_fantasia),
transportadoras!fk_coletas_transportadora(nome_fantasia)")` com `.limit(500)`. `coletas` tem **31 colunas**.
Mesmo caso da etapa 223, na tela gêmea.
**Causa raiz:** idêntica à da etapa 223. As duas telas foram escritas com o mesmo desenho e carregam o mesmo
excesso.
**Caminho recomendado:** repita o que a etapa 223 fez em `Envios.tsx`, agora com o tipo `Coleta` (o `as
unknown as Coleta[]` de `:131`) como guia das colunas. **Dois arquivos de referência úteis:** a própria
`Envios.tsx` já corrigida, e `src/hooks/logistics/useLogisticsCalendar.tsx:35-46`, que lê `coletas` com
colunas explícitas **e** os mesmos joins nomeados (`transportadoras!fk_coletas_transportadora`,
`fornecedores!fk_coletas_fornecedor`) — útil porque mostra a sintaxe do join por nome de chave estrangeira
já funcionando nesta tabela. Preserve os dois `!fk_...` exatamente como estão: eles existem porque há mais de
um caminho de relacionamento, e tirá-los dá erro de ambiguidade no PostgREST. **Atalho tentador a evitar:**
copiar a lista de colunas de `Envios.tsx`. São tabelas diferentes (`numero_coleta` e
`data_prevista_coleta` contra `numero_entrega` e `previsao_entrega`); a lista precisa vir do que **esta** tela
usa.
**Arquivos e objetos a tocar:** `src/pages/Coletas.tsx` (apenas a cadeia `:121-131`)
**Não tocar / armadilhas:** não remova `.limit(500)` (`:128`) nem `.is("deleted_at", null)` (`:126`). Não
toque nos nomes `!fk_coletas_fornecedor` / `!fk_coletas_transportadora`. O achado A-07 registra que `Coletas`
**não tem editar nem excluir** e que o editar existe sem porta de entrada — não é desta etapa; se topar com
isso, anote em "Achados novos" e siga.
**Depende de:** 222 · **Libera:** —
**Risco e como reverter:** mesmo risco de campo vazio silencioso da etapa 223. Teste lista, filtros e
detalhe. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n -A10 'from("coletas")' src/pages/Coletas.tsx | head -16
npm run typecheck 2>&1 | tail -3
```

Esperado: nenhum `select("*` na consulta de `coletas` da página; joins e teto intactos. Registre o tamanho
em KB da resposta antes e depois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 225 — `useDrillDown`: colunas explícitas nas duas leituras

**Onda / Severidade / Camada:** 6 / Baixa / hook
**Achados resolvidos:** P-04
**Problema hoje:** `src/hooks/analytics/useDrillDown.tsx:67` faz
`supabase.from("coletas").select("*").is("deleted_at", null)` e `:80-84` faz o mesmo para `entregas`; as duas
terminam em `.limit(100)` (`:77` e a linha equivalente do bloco de entregas). São 31 e 33 colunas para um
painel de detalhamento.
**Causa raiz:** o hook devolve `Record<string, unknown>[]` (`:64`, `rawItems`) — não há tipo que force a
lista de colunas, então `*` é o caminho sem atrito.
**Caminho recomendado:** descubra o que o consumidor realmente exibe antes de escrever a lista: siga de
`rawItems` até o retorno do hook e até a tela que o usa (`grep -rn 'useDrillDown' src/`) e liste só esses
campos. Como o tipo é `Record<string, unknown>`, **o typecheck não vai te proteger aqui** — ao contrário das
etapas 223 e 224. Por isso a verificação desta etapa é visual, na tela. Use o formato de colunas de
`src/pages/PainelSLA.tsx:155-160`. **Atalho tentador a evitar:** tipar `rawItems` corretamente "de passagem".
É melhoria real e é churn não pedido: mexeria no contrato do hook e no consumidor, numa etapa cujo objetivo é
cortar colunas. Anote em "Achados novos" se quiser propô-la.
**Arquivos e objetos a tocar:** `src/hooks/analytics/useDrillDown.tsx` (os dois `select("*")`, `:67` e `:80-84`)
**Não tocar / armadilhas:** não remova os `.limit(100)` — P-01 os lista entre os tetos corretos. Não mexa nos
filtros condicionais de data (`:68-69`) nem no de transportadora (`:70-74`). O hook tem dois caminhos
(`params.category === "coletas"` e `"entregas"`) com colunas **diferentes**; não use a mesma lista nos dois.
Depois de cortar colunas, confira que nenhum campo acessado adiante no hook (fora do `if`) sumiu.
**Depende de:** 222 · **Libera:** —
**Risco e como reverter:** sem typecheck de rede de segurança, coluna que faltou aparece como célula vazia no
painel de detalhamento. Abra o painel por **cada** categoria e compare com a versão anterior. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'select("\*")' src/hooks/analytics/useDrillDown.tsx
grep -rn 'useDrillDown' src/
```

Esperado: zero `select("*")` no arquivo. Depois do deploy, abra o detalhamento de coletas e o de entregas e
confirme, campo a campo, que a tela mostra o mesmo de antes — a comparação é a evidência.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 226 — `useSLANotifications`: colunas explícitas nas duas verificações de SLA

**Onda / Severidade / Camada:** 6 / Baixa / hook
**Achados resolvidos:** P-04
**Problema hoje:** `src/hooks/logistics/useSLANotifications.tsx:276-280` faz
`.from('entregas').select('*').gt('updated_at', lastCheckedAt).limit(50)` e `:290-294` o mesmo para
`coletas`. As duas rodam **dentro de um `setInterval`** (`:274`), ou seja, a cada ciclo do temporizador — 33
e 31 colunas repetidamente, para alimentar duas funções que usam poucos campos.
**Causa raiz:** leitura periódica com `*`. O custo não é por chamada, é por hora.
**Caminho recomendado:** aqui a lista de colunas tem fonte exata e pequena: as funções
`checkEntregaSLA` e `checkColetaSLA` (chamadas em `:285` e `:299`, com os tipos extraídos via
`Parameters<typeof checkEntregaSLA>[0]`). Abra cada uma, liste os campos que ela lê, e peça só esses — mais
`id` e o que `handleSLAAlert` usa (`alert.numero` sugere `numero_entrega` / `numero_coleta`). O `Parameters<>`
é uma vantagem: se você cortar um campo que a função usa, **o typecheck reprova**. Deixe que ele guie.
Formato: `src/pages/PainelSLA.tsx:155-160`. **Atalho tentador a evitar:** aumentar o intervalo do
`setInterval` para "chamar menos". Isso atrasa o alerta de SLA, que é o produto desta tela; a correção é
pedir menos dado por chamada, não avisar mais tarde.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useSLANotifications.tsx` (`:276-280` e `:290-294`)
**Não tocar / armadilhas:** **não altere o `setInterval` de `:274`** nem o período dele, e não mexa em
`lastCheckedAt` (`:272`) — é o que impede reprocessar as mesmas linhas. Mantenha os `.limit(50)`. O achado
R-08 registra **dez temporizadores sem cancelamento no desmonte** e este arquivo é candidato: **não conserte
isso aqui** — é outro achado, outra etapa; anote em "Achados novos" se confirmar. As duas funções de check
(`checkEntregaSLA` / `checkColetaSLA`) não devem ser alteradas: elas são a especificação das colunas, não o
alvo.
**Depende de:** 222 · **Libera:** —
**Risco e como reverter:** se faltar um campo, o cálculo de SLA passa a não detectar atraso — falha
silenciosa num alerta. O `Parameters<>` protege contra isso; confirme com typecheck limpo **e** com um teste
manual: crie uma entrega com previsão no passado e confirme que o alerta dispara. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "select('\*')" src/hooks/logistics/useSLANotifications.tsx
npm run typecheck 2>&1 | tail -3
npx vitest run src/hooks/logistics/ 2>&1 | tail -20
```

Esperado: zero `select('*')` no arquivo e typecheck em 0 erros (é ele que prova que as colunas bastam para
`checkEntregaSLA` e `checkColetaSLA`).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 227 — `RelatorioPDF`, `LogisticsService` e `useCotacoesMulticanal`: os três `select("*")` restantes

**Onda / Severidade / Camada:** 6 / Baixa / interface + serviço
**Achados resolvidos:** P-04
**Problema hoje:** três pontos sobraram depois das etapas 223 a 226.
`src/pages/RelatorioPDF.tsx:90-98`: `.select("*, transportadora:transportadoras(nome_fantasia),
cliente:clientes(razao_social)")` com `.limit(2000)` — 33 colunas × 2000 linhas para gerar um PDF.
`src/features/logistics/services/LogisticsService.ts:8`:
`supabase.from('entregas').select('*').limit(limit)`, com `limit` padrão 100.
`src/hooks/logistics/useCotacoesMulticanal.tsx:51`: `cotacoes_multicanal` (23 colunas) com `select("*")` —
**se a etapa 210 já foi feita, este ponto já está resolvido**; confirme antes (regra 2) e, se estiver, reduza
o escopo desta etapa aos dois primeiros e diga isso na PR.
**Causa raiz:** a mesma dos cinco pontos anteriores. Estes são os de menor impacto, agrupados porque a
mudança é mecânica e idêntica.
**Caminho recomendado:** comece pelo `RelatorioPDF.tsx`, que é o maior volume: as colunas vêm do que o
gerador de PDF imprime — siga o `data` até a montagem do documento e liste só os campos impressos. Em
`LogisticsService.ts:8`, procure os chamadores primeiro (`grep -rn 'getDeliveries' src/`): se forem poucos e
usarem poucos campos, liste-os; **se não houver chamador**, não invente lista — anote em "Achados novos"
(A-12 já registra 8 arquivos de hook que ninguém importa; código morto é outro grupo) e deixe o método como
está. Formato de referência, nos três casos: `src/pages/PainelSLA.tsx:155-160`. **Atalho tentador a evitar:**
abrir uma PR só para os três. O `RelatorioPDF` é o único com volume que importa; se os outros dois forem
triviais ou duvidosos, prefira entregar o primeiro e registrar os outros — etapa pela metade declarada vale
mais que três mudanças sem verificação.
**Arquivos e objetos a tocar:** `src/pages/RelatorioPDF.tsx` (`:90-98`),
`src/features/logistics/services/LogisticsService.ts` (`:8`), e `src/hooks/logistics/useCotacoesMulticanal.tsx`
(`:51`) **somente se a etapa 210 não tiver resolvido**
**Não tocar / armadilhas:** não remova `.limit(2000)` (`RelatorioPDF`), `.is("deleted_at", null)` (`:95`), nem
o parâmetro `limit` de `getDeliveries`. Em `LogisticsService.ts`, não mexa em `BaseService.call(...)` nem na
categoria de erro (`:11`) — é o envelope de erro do serviço, usado por outros métodos. Em
`useCotacoesMulticanal`, valem as mesmas armadilhas da etapa 210: `refetchInterval: 30000` (`:66`) fica, e o
realtime da tabela não se religa.
**Depende de:** 210, 222 · **Libera:** —
**Risco e como reverter:** no PDF, coluna que faltou sai como campo vazio no documento entregue ao cliente —
é o pior lugar para falha silenciosa. Gere um PDF antes e um depois e compare página por página. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'select("\*"\|select('"'"'\*'"'"'' src/pages/RelatorioPDF.tsx src/features/logistics/services/LogisticsService.ts src/hooks/logistics/useCotacoesMulticanal.tsx
grep -rn 'getDeliveries' src/
```

Esperado: zero `select("*")` nos arquivos tocados. Depois do deploy, gere um relatório em PDF e compare com
um gerado antes da mudança — a comparação anexada à PR é a evidência que conclui a etapa.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 228 — Censo dos índices reais de `entregas`, `coletas` e `telemetry_logs` no banco ao vivo

**Onda / Severidade / Camada:** 6 / Alta / banco
**Achados resolvidos:** P-05 (base de 229 a 233)
**Problema hoje:** P-05 é marcado **HIPÓTESE — NÃO VERIFICADO contra o banco ao vivo**. Ele foi montado
cruzando os filtros das telas com os `CREATE INDEX` das **migrations**, e migrations são histórico, não
estado. O achado P-06 é a prova do custo de confundir os dois: uma varredura pelas migrations apontou 12
pares de índices duplicados, e **7 já tinham sido removidos** três meses antes pela migration
`supabase/migrations/20260831130000_index_dedupe_and_realtime.sql`, cujo cabeçalho (`:1`) diz literalmente
"Aplicado no destino e na origem". Criar índice com base nessa leitura é criar índice que talvez já exista —
ou que falta por outro motivo.
**Causa raiz:** o repositório não tem fonte confiável do estado do banco. `docs/contexto/supabase/` — que o
protocolo nomeia como dona do fato "o que existe no banco" — **nunca foi gerada** (H-09). São 248 migrations
e nenhum inventário.
**Caminho recomendado:** **nada de DDL nesta etapa. Só leitura, e só no banco ao vivo
`jvfhclubfpxrtrrazrgr`**, pelo MCP `SUPABASE - LOGGI FLOW V2 - MCP` (confirme qual MCP carregou: há vários
Supabase quase homônimos na conta). Rode as três consultas abaixo e cole a saída inteira em
`05-PROGRESSO.md` — ela é o insumo das etapas 229 a 233 e de nada mais serve se ficar só no chat.

```sql
-- 1. Quais índices existem de fato
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('entregas','coletas','telemetry_logs')
ORDER BY tablename, indexname;

-- 2. Quais estão sendo usados (e quanto)
SELECT relname AS tabela, indexrelname AS indice, idx_scan, idx_tup_read, idx_tup_fetch,
       pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('entregas','coletas','telemetry_logs')
ORDER BY idx_scan ASC, tabela;

-- 3. Tamanho das tabelas, para saber se o índice vale o custo de escrita
SELECT relname, n_live_tup, pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND relname IN ('entregas','coletas','telemetry_logs');
```

Com a saída na mão, marque em `05-PROGRESSO.md`, para cada um dos cinco índices que P-05 propõe (etapas 230 a
233): **já existe** / **não existe** / **existe parecido mas com predicado ou ordem diferente**. Os três
índices que P-05 cita como "existentes" precisam de atenção especial, porque dois deles vêm de migrations e
um **foi removido** pela migration de dedupe: `idx_entregas_status_created`
(`20260314175252_...sql:3`) está na lista de `DROP` de `20260831130000_...sql:23` — então, se P-05 raciocinou
em cima dele, o raciocínio pode estar errado na base. Confirme. **Atalho tentador a evitar:** `grep` nas
migrations para "adiantar o censo". É literalmente o método que produziu os 7 falsos positivos de P-06.
**Arquivos e objetos a tocar:** nenhum (etapa de leitura e registro em `05-PROGRESSO.md`)
**Não tocar / armadilhas:** o MCP conecta com `service_role` e **aceita DDL** — diagnóstico é só leitura; não
rode `CREATE`, `DROP` nem `ALTER` aqui. **Não escreva** em `hgicfqjayrjurivtygqf` (Lovable Cloud, só
referência de paridade) nem em `uwbpzfcysppwikfpnzok` (ref morto). `idx_scan = 0` **não** basta para condenar
um índice: pode ser índice de constraint, ou de consulta rara mas crítica, ou as estatísticas podem ter sido
zeradas — registre o número, não a conclusão.
**Depende de:** — · **Libera:** 229, 230, 231, 232, 233
**Risco e como reverter:** nenhum (somente leitura). Se o banco não estiver acessível, a etapa fica **aberta**
com esse motivo no progresso, e as etapas 230 a 233 **não começam**.
**Precisa de aprovação humana antes do merge:** sim (leitura do banco de produção; o resultado do censo é o
que o dono precisa ver antes de autorizar qualquer DDL das etapas 230 a 233)
**Como verificar:** `05-PROGRESSO.md` contém a saída das três consultas, com data e o ref do projeto
(`jvfhclubfpxrtrrazrgr`) anotados, e a tabela de três colunas (índice proposto / situação real / decisão).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 229 — Provar a hipótese: `EXPLAIN (ANALYZE, BUFFERS)` da consulta do Painel SLA

**Onda / Severidade / Camada:** 6 / Alta / banco
**Achados resolvidos:** P-05
**Problema hoje:** P-05 afirma que o banco **ordena em memória** a consulta de
`src/pages/PainelSLA.tsx:154-168` — `.in("status", ["despachado","em_transito","saiu_entrega"])` +
`.not("previsao_entrega","is",null)` + `.order("previsao_entrega", { ascending: true })` + `.limit(500)`,
com `refetchInterval` de 5 minutos (`:170`). É um raciocínio sobre nome de índice, não uma medição. Criar
índice sem medir é criar índice no escuro: índice custa em **toda** gravação da tabela, e `entregas` é uma
das duas mais movimentadas.
**Causa raiz:** a auditoria não teve o banco. A prova é barata e ninguém a fez.
**Caminho recomendado:** rode no banco ao vivo, somente leitura, a consulta **como o PostgREST a monta** —
mesmos filtros, mesma ordem, mesmo teto:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, numero_entrega, status, previsao_entrega
FROM public.entregas
WHERE deleted_at IS NULL
  AND status IN ('despachado','em_transito','saiu_entrega')
  AND previsao_entrega IS NOT NULL
ORDER BY previsao_entrega ASC
LIMIT 500;
```

Cole o plano inteiro em `05-PROGRESSO.md` e leia três coisas: (a) aparece **`Sort`** com `Sort Method:` —
e se for `external merge Disk`, a hipótese está confirmada e é pior do que P-05 diz; (b) aparece
`Seq Scan on entregas` ou um `Index Scan`, e de qual índice; (c) o `actual time` total. **Só crie índice se
o plano mostrar o `Sort` ou a varredura sequencial.** Se o plano já estiver usando índice e o tempo for
baixo, P-05 item 1 **cai** — registre "hipótese não confirmada" e **pule a etapa 230**. Repita o mesmo
`EXPLAIN` para o Kanban, que é o item 2 de P-05
(`src/pages/KanbanEntregas.tsx:267-279`: `deleted_at IS NULL` + `status <> 'finalizado'` +
`ORDER BY created_at DESC LIMIT 500`). **Atalho tentador a evitar:** rodar `EXPLAIN` sem `ANALYZE` "para não
executar nada". Sem `ANALYZE` você vê a estimativa do planejador, não o que acontece — e é justamente a
diferença entre estimativa e realidade que decide se o índice resolve. `EXPLAIN ANALYZE` de um `SELECT` não
escreve nada.
**Arquivos e objetos a tocar:** nenhum (medição e registro)
**Não tocar / armadilhas:** não rode `ANALYZE` (o comando de estatísticas, sem `EXPLAIN`) nem `VACUUM` —
`VACUUM` não roda em transação (`docs/agentes/banco.md:60-61`) e nada disso foi pedido. Rode num horário de
baixo movimento: o `LIMIT 500` torna a consulta barata, mas é produção e não há staging. Use o ref correto,
`jvfhclubfpxrtrrazrgr`.
**Depende de:** 228 · **Libera:** 230, 231
**Risco e como reverter:** nenhum (leitura). Sem acesso ao banco, a etapa fica **aberta** e as 230 e 231 não
começam.
**Precisa de aprovação humana antes do merge:** sim (consulta no banco de produção; o plano medido é o que
justifica, ao dono, o DDL das etapas 230 e 231)
**Como verificar:** `05-PROGRESSO.md` tem os dois planos completos, com data, e uma linha de veredito por
item: "confirmado — `Sort` / `Seq Scan` presente, Xms" ou "não confirmado — índice Y já atende, Xms".
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 230 — Índice para o Painel SLA: `entregas (status, previsao_entrega)`

**Onda / Severidade / Camada:** 6 / Alta / banco (DDL)
**Achados resolvidos:** P-05 item 1
**Problema hoje:** o Painel SLA — a tela que diz quais entregas estão atrasadas — recarrega a cada 5 minutos
(`src/pages/PainelSLA.tsx:170`) fazendo o banco filtrar por `status` e ordenar por `previsao_entrega`
(`:160-167`). P-05 aponta que nenhum índice serve: `idx_entregas_status_created` é `(status, created_at
DESC)` — ordena por outra coluna; e `idx_entregas_previsao` é parcial
`WHERE data_entrega_efetiva IS NULL` — predicado que **não aparece** na consulta, logo o planejador não pode
usá-lo. **Não execute esta etapa sem a confirmação da etapa 229:** se o plano medido não mostrou `Sort` nem
varredura sequencial, esta etapa não deve existir.
**Causa raiz:** os dois índices existentes cobrem metade do padrão de acesso cada um. Falta o que cobre o
filtro **e** a ordenação.
**Caminho recomendado:** escreva a migration com o índice que espelha a consulta real, na ordem que ela
pede — filtro primeiro, ordenação depois, e o predicado parcial **igual ao filtro que a consulta sempre tem**:

```sql
CREATE INDEX IF NOT EXISTS idx_entregas_status_previsao
  ON public.entregas (status, previsao_entrega)
  WHERE deleted_at IS NULL;
```

O predicado `WHERE deleted_at IS NULL` é seguro porque **toda** consulta de listagem de `entregas` o inclui
(`PainelSLA.tsx:161`, `Envios.tsx:356`, `KanbanEntregas.tsx:277`) — é política do repositório, exclusão é
lógica por `deleted_at` (`docs/SOFT_DELETE_POLICY.md`). É exatamente o erro oposto ao de
`idx_entregas_previsao`, cujo predicado não casa com nada. Nomeie seguindo o padrão do repositório
(`idx_<tabela>_<colunas>`) e **confirme na saída da etapa 228 que esse nome não está em uso**. O arquivo vai
em `supabase/migrations/<timestamp novo>_idx_entregas_status_previsao.sql`, com **slug** e timestamp novo
(`docs/agentes/banco.md:51-54`), e um comentário de uma linha dizendo qual consulta ele atende.
**Atalho tentador a evitar:** `CREATE INDEX CONCURRENTLY`. Parece a escolha responsável — não bloqueia
escrita — mas **não roda dentro de transação** (`docs/agentes/banco.md:60-61`), e
`.github/workflows/aplicar-migration.yml:5` aplica a migration **em transação** com `ON_ERROR_STOP=1`: a
migration falharia. Para `CONCURRENTLY` o caminho é o dono rodar no SQL Editor. Escreva `CREATE INDEX`
simples, e **diga na PR** qual dos dois caminhos o dono escolhe, com o tempo de bloqueio esperado (função do
tamanho de `entregas`, que a consulta 3 da etapa 228 mediu).
**Arquivos e objetos a tocar:** `supabase/migrations/<timestamp>_idx_entregas_status_previsao.sql` (novo)
**Não tocar / armadilhas:** **não remova `idx_entregas_previsao` nem `idx_entregas_status_created` nesta
etapa** — remover índice é decisão separada, com censo de uso próprio (é o desenho das etapas 234 a 239), e
`idx_entregas_status_created` pode já não existir (a migration de dedupe `20260831130000_...sql:23` o
derruba). Uma etapa cria; outra remove. **Migrations são histórico:** o nome do índice a criar sai da etapa
228, nunca de `grep` nas migrations. Não há staging: o apply é em produção.
**Depende de:** 228, 229 · **Libera:** 233
**Risco e como reverter:** `CREATE INDEX` sem `CONCURRENTLY` bloqueia escrita em `entregas` durante a
construção — minutos, numa tabela grande, com a operação parada. Por isso o dono decide a janela. Reverter =
`DROP INDEX idx_entregas_status_previsao;`, que é instantâneo e sem perda de dado.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção. **A PR fica aberta, com a
migration pronta, o plano da etapa 229 anexado e o tamanho da tabela informado**, aguardando o dono. Não
mergeie; siga para a próxima etapa independente.
**Como verificar:**

```sql
-- depois do apply
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename='entregas' AND indexname='idx_entregas_status_previsao';

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, numero_entrega, status, previsao_entrega FROM public.entregas
WHERE deleted_at IS NULL AND status IN ('despachado','em_transito','saiu_entrega')
  AND previsao_entrega IS NOT NULL
ORDER BY previsao_entrega ASC LIMIT 500;
```

Esperado: o índice listado, e no novo plano **nenhum nó `Sort`**, um `Index Scan using
idx_entregas_status_previsao`, e `actual time` menor que o medido na etapa 229 — a comparação dos dois planos
é a evidência que conclui a etapa. Sem acesso ao banco, a etapa fica **aberta** com esse motivo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 231 — Índice parcial para a desigualdade de status do Kanban

**Onda / Severidade / Camada:** 6 / Média / banco (DDL)
**Achados resolvidos:** P-05 item 2
**Problema hoje:** `src/pages/KanbanEntregas.tsx:277-279` filtra `.is("deleted_at", null)` +
`.not("status","eq","finalizado")` e ordena por `created_at DESC`, com `.limit(500)`. Índice de igualdade em
`status` não serve para desigualdade, e P-05 aponta que não existe índice parcial do tipo
`WHERE status <> 'finalizado' AND deleted_at IS NULL`. `src/hooks/logistics/useDeliveryRoutes.tsx:157` tem o
mesmo padrão com outro conjunto — `.not('status','in','("entregue","finalizado")')` — e, note, **sem teto
nenhum** nem ordenação coberta.
**Causa raiz:** "tudo que não está finalizado" é o filtro natural de um Kanban, e é o pior formato para
indexar por igualdade. O remédio é índice parcial com o predicado **idêntico** ao da consulta.
**Caminho recomendado:** o ponto que decide esta etapa é que **os dois predicados são diferentes**: o Kanban
exclui só `finalizado`, o `useDeliveryRoutes` exclui `entregue` **e** `finalizado`. Um índice parcial só é
usado quando o planejador prova que o predicado da consulta implica o do índice. Então: um índice com
`WHERE status <> 'finalizado'` serve ao Kanban e **também** ao `useDeliveryRoutes` (que é mais restritivo);
o inverso não vale. Escreva um só, pelo predicado mais largo:

```sql
CREATE INDEX IF NOT EXISTS idx_entregas_ativas_created
  ON public.entregas (created_at DESC)
  WHERE deleted_at IS NULL AND status <> 'finalizado';
```

Antes de escrever, confirme na saída da etapa 228 que não existe índice equivalente com outro nome, e rode o
`EXPLAIN ANALYZE` do Kanban (etapa 229) para ter o antes. **Atalho tentador a evitar:** alinhar os dois
pontos do front para o mesmo conjunto de status "para um índice servir aos dois". Isso muda regra de negócio —
quais entregas aparecem no mapa de rotas — e não é decisão de etapa de performance. Se o predicado largo não
servir ao `useDeliveryRoutes` no plano medido, **registre isso** e deixe-o para uma etapa própria; não mexa
no conjunto de status.
**Arquivos e objetos a tocar:** `supabase/migrations/<timestamp>_idx_entregas_ativas_created.sql` (novo)
**Não tocar / armadilhas:** não altere `KanbanEntregas.tsx` nem `useDeliveryRoutes.tsx` nesta etapa — é DDL,
só. **A falta de teto em `useDeliveryRoutes.tsx:157-158` é achado real e não está entre os cinco de P-01:**
anote em "Achados novos" do progresso; índice não substitui teto. Vale tudo o que a etapa 230 diz sobre
`CONCURRENTLY` e sobre o apply em transação (`aplicar-migration.yml:5`). O nome do índice sai da etapa 228,
não das migrations.
**Depende de:** 228, 229 · **Libera:** 233
**Risco e como reverter:** índice parcial com predicado que não casa com nenhuma consulta é custo puro — paga
em toda escrita e nunca é usado. É o defeito de `idx_entregas_previsao`, que esta etapa não deve repetir: a
verificação abaixo existe para provar que o índice é **usado**. Reverter = `DROP INDEX
idx_entregas_ativas_created;`.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção. **PR aberta com a migration
pronta e os planos antes/depois**, aguardando o dono.
**Como verificar:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, numero_entrega, status, created_at FROM public.entregas
WHERE deleted_at IS NULL AND status <> 'finalizado'
ORDER BY created_at DESC LIMIT 500;

SELECT indexrelname, idx_scan FROM pg_stat_user_indexes
WHERE schemaname='public' AND indexrelname='idx_entregas_ativas_created';
```

Esperado: `Index Scan using idx_entregas_ativas_created`, sem `Sort`; e, 24 horas depois do apply,
`idx_scan > 0` — é esse segundo número que prova que o índice serve a alguém de verdade. Anote os dois.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 232 — Índice composto `telemetry_logs (severity, created_at DESC)`

**Onda / Severidade / Camada:** 6 / Baixa / banco (DDL)
**Achados resolvidos:** P-05 (item menor)
**Problema hoje:** P-05 registra que `telemetry_logs` tem os dois índices **separados** (`severity` e
`created_at`), criados em `20260512162404_...sql:46-47`, e **nenhum composto**. As telas que consomem
telemetria filtram por severidade e ordenam por data (`AdminTelemetria.tsx:51`, teto 500;
`TelemetryViewer.tsx:45`, teto 100). Dois índices separados em `AND` levam o planejador a um `BitmapAnd` ou a
escolher um só e filtrar o resto — e a ordenação continua custando `Sort`.
**Causa raiz:** índices criados por coluna, não por padrão de acesso.
**Caminho recomendado:** só faça esta etapa se a etapa 228 confirmar que os dois índices separados existem e
que não há composto, **e** se o `EXPLAIN ANALYZE` da consulta real mostrar `Sort` ou `BitmapAnd`. Se o tempo
medido já for de milissegundos, **não crie o índice** — `telemetry_logs` é tabela de escrita intensa (é
telemetria) e cada índice é pago em toda inserção; aqui o teto das telas é 500 e 100, então o ganho de leitura
é pequeno e o custo de escrita é real. Registre "não compensa" e feche a etapa; essa também é uma conclusão
válida. Se compensar:

```sql
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_severity_created
  ON public.telemetry_logs (severity, created_at DESC);
```

E então proponha, **em etapa separada**, remover o índice de `severity` sozinho, que passa a ser prefixo
redundante do composto — com o censo de uso da etapa 234 como método. **Atalho tentador a evitar:** criar o
composto **e** remover o índice de `severity` na mesma migration. Se o composto não for adotado pelo
planejador, você fica sem os dois. Criar primeiro, medir, remover depois.
**Arquivos e objetos a tocar:** `supabase/migrations/<timestamp>_idx_telemetry_logs_severity_created.sql`
(novo), **ou nenhum**, se a medição disser que não compensa
**Não tocar / armadilhas:** não remova nenhum índice aqui. Confirme o nome real da coluna de severidade em
`src/integrations/supabase/types.ts` (bloco `telemetry_logs`) e na saída da etapa 228 — a auditoria leu
`severity` nas migrations, e migration é histórico. Se `telemetry_logs` for particionada, valem as mesmas
regras da etapa 235: `CONCURRENTLY` não é suportado em tabela particionada.
**Depende de:** 228 · **Libera:** 233
**Risco e como reverter:** índice novo numa tabela de escrita intensa pesa em toda inserção de telemetria.
Meça `n_live_tup` e a taxa de inserção antes (consulta 3 da etapa 228). `DROP INDEX
idx_telemetry_logs_severity_created;`.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção, com custo de escrita contínuo.
**PR aberta com a migration e a medição anexada**, aguardando o dono.
**Como verificar:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.telemetry_logs WHERE severity = 'error'
ORDER BY created_at DESC LIMIT 500;
```

Esperado, se o índice foi criado: `Index Scan using idx_telemetry_logs_severity_created`, sem `Sort` nem
`BitmapAnd`, com `actual time` menor que o antes. Se a decisão foi **não criar**, a evidência é o plano
"antes" com tempo baixo, registrado em `05-PROGRESSO.md` com o veredito "não compensa".
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 233 — Decidir com o dono sobre `(transportadora_id, created_at)` em `entregas` e `coletas`

**Onda / Severidade / Camada:** 6 / Baixa / banco (DDL)
**Achados resolvidos:** P-05 (item menor) — fecha o grupo
**Problema hoje:** P-05 registra que existem `(transportadora_id, status)` em `entregas` e `coletas`
(`20260711194640_...sql:4,20`) e **não** existe `(transportadora_id, created_at)`, que é o que
`src/hooks/analytics/useDrillDown.tsx:70-77` pede quando filtra por transportadora e ordena por
`created_at DESC`. O próprio achado qualifica: **teto de 100, impacto pequeno**.
**Causa raiz:** mesma da etapa 232 — índice por coluna de um caso, não pelo padrão de acesso de outro.
**Caminho recomendado:** **a resposta correta desta etapa pode ser "não fazer"**, e ela existe para que essa
decisão seja tomada e registrada, em vez de ficar pendurada. Rode o `EXPLAIN ANALYZE` do caminho do
`useDrillDown` com filtro de transportadora e teto 100. Com `LIMIT 100`, é muito provável que o índice
`(transportadora_id, status)` já sirva de ponto de partida e o tempo seja irrelevante. Se for o caso,
escreva em `05-PROGRESSO.md`: "P-05 item menor — medido, não compensa; dois índices novos em tabelas de
escrita intensa para uma consulta de 100 linhas" e **feche a etapa sem DDL**. Só proponha a migration se a
medição mostrar tempo que incomoda. Leve ao dono o trade-off em uma linha: dois índices novos nas duas
tabelas mais movimentadas do sistema, pagos em toda gravação, para acelerar um painel de detalhamento de 100
linhas. **Atalho tentador a evitar:** criar os dois índices "porque o achado listou". O achado listou **e
qualificou como impacto pequeno**; executar sem medir é o que enche um banco de índices que ninguém usa — e o
achado P-06 mostra que esse repositório já passou por isso.
**Arquivos e objetos a tocar:** nenhum, se a decisão for não fazer (registro em `05-PROGRESSO.md`). Se for
fazer: `supabase/migrations/<timestamp>_idx_transportadora_created.sql` (novo, os dois índices no mesmo
arquivo, já que a decisão é uma)
**Não tocar / armadilhas:** **não remova** `(transportadora_id, status)` de nenhuma das duas tabelas — não é
prefixo nem sufixo do índice proposto, e serve a outra consulta. Se decidir criar, vale tudo o que a etapa
230 diz sobre `CONCURRENTLY` e sobre o apply em transação. Não aproveite esta etapa para "revisar os índices
em geral": o censo é a etapa 234 e a remoção é 235 a 239.
**Depende de:** 228, 230, 231, 232 · **Libera:** —
**Risco e como reverter:** o risco real desta etapa é criar custo de escrita permanente por um ganho de
leitura que ninguém mede. Por isso o caminho recomendado começa pela medição e admite "não fazer" como
conclusão. `DROP INDEX` dos dois, se criados.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção nas duas tabelas mais
movimentadas. **Se houver migration, a PR fica aberta com a medição anexada e o trade-off escrito em uma
linha**, aguardando o dono.
**Como verificar:** `05-PROGRESSO.md` tem o plano medido do caminho do `useDrillDown` com filtro de
transportadora e **um veredito explícito**: "criado, plano antes/depois anexado" ou "medido, não compensa —
não criado", com data. Etapa sem veredito não está concluída.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 234 — Censo dos cinco candidatos a índice duplicado, com uso, no banco ao vivo

**Onda / Severidade / Camada:** 6 / Média / banco
**Achados resolvidos:** P-06 (base de 235 a 239)
**Problema hoje:** P-06 é marcado **HIPÓTESE — NÃO VERIFICADO**, e é o achado que existe para ensinar o
método. Uma varredura pelos `CREATE INDEX` das migrations aponta **12** pares/trios de índices duplicados; a
realidade é outra: a migration `supabase/migrations/20260831130000_index_dedupe_and_realtime.sql`, cujo
cabeçalho (`:1`) diz "Plano v2 etapas 13-16, 18-20 (2026-08-31). **Aplicado no destino e na origem**", já
removeu **7 deles** — `brin_audit_logs_created_at` e `idx_audit_logs_created_at_brin` (`:3-4`),
`gin_audit_logs_new_data` (`:5`), `idx_rastreamento_coleta` e `idx_rastreamento_order` (`:9-10`),
`idx_coletas_fornecedor` (`:14`), `idx_entregas_cliente` (`:22`), `idx_entregas_status_created` (`:23`),
`idx_ocorrencias_coleta` e `idx_ocorrencias_entrega` (`:27-28`). Sobram **cinco** candidatos, nenhum com
`DROP INDEX` em migration alguma. Agir pela lista de 12 seria rodar 7 `DROP` inúteis — e descobrir isso só
depois.
**Causa raiz:** as 248 migrations do repositório são **histórico, não estado**. O estado real é o banco ao
vivo. E `docs/contexto/supabase/`, a fonte que o protocolo nomeia como dona desse fato, nunca foi gerada
(H-09).
**Caminho recomendado:** **nenhum `DROP` nesta etapa.** Rode no banco ao vivo (`jvfhclubfpxrtrrazrgr`, MCP
`SUPABASE - LOGGI FLOW V2 - MCP`) as consultas abaixo e cole a saída inteira em `05-PROGRESSO.md`:

```sql
-- 1. O que existe de fato
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('rastreamento_historico','entregas','coletas','audit_logs')
ORDER BY tablename, indexname;

-- 2. Quem usa, quanto, e quanto pesa
SELECT relname AS tabela, indexrelname AS indice, idx_scan, idx_tup_read,
       pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('rastreamento_historico','entregas','coletas','audit_logs')
ORDER BY tabela, idx_scan ASC;

-- 3. Índices que sustentam constraint (NUNCA remover por "duplicidade")
SELECT conname, conrelid::regclass AS tabela, conindid::regclass AS indice, contype
FROM pg_constraint
WHERE conrelid::regclass::text IN ('entregas','coletas','audit_logs','rastreamento_historico')
  AND conindid <> 0;
```

Monte em `05-PROGRESSO.md` uma tabela com uma linha por candidato: nome, existe hoje (sim/não), `idx_scan`,
tamanho, sustenta constraint (sim/não), e **qual dos dois fica**. Os cinco candidatos, para conferir nome a
nome: (1) `idx_rastreamento_historico_order` × `idx_rastreamento_lalamove_order`
(`rastreamento_historico(lalamove_order_id)`); (2) `idx_rastreamento_historico_coleta` ×
`idx_rastreamento_historico_coleta_id` (`rastreamento_historico(coleta_id)`); (3)
`idx_entregas_transportadora` × `idx_entregas_transportadora_id`; (4) `idx_coletas_transportadora` ×
`idx_coletas_transportadora_id`; (5) `idx_audit_logs_table_record (table_name, record_id)` ×
`idx_audit_logs_record_id_table (record_id, table_name)`. **Atalho tentador a evitar:** `grep "CREATE INDEX"`
nas migrations para montar a lista. É exatamente o método que produziu os 7 falsos positivos deste achado. A
lista acima já é o resultado de alguém ter feito isso e conferido depois; o que falta é o banco.
**Arquivos e objetos a tocar:** nenhum (leitura e registro em `05-PROGRESSO.md`)
**Não tocar / armadilhas:** o MCP aceita DDL — **não rode `DROP` aqui**. `idx_scan = 0` não é licença para
remover: pode ser índice de constraint (consulta 3), ou de consulta rara e crítica, ou as estatísticas podem
ter sido zeradas num restart — registre o número, decida na etapa própria. `rastreamento_historico` é
**particionada** (18 partições mensais, visíveis em `src/integrations/supabase/types.ts:3594` em diante): os
índices aparecem no pai **e** em cada partição, então a saída da consulta 1 vai ser longa — não confunda
índice de partição com duplicata. Não escreva em `hgicfqjayrjurivtygqf` nem em `uwbpzfcysppwikfpnzok`.
**Depende de:** — · **Libera:** 235, 236, 237, 238, 239, 240
**Risco e como reverter:** nenhum (leitura). Sem acesso ao banco, a etapa fica **aberta** com esse motivo e
as etapas 235 a 239 **não começam** — o plano é explícito: não prossiga por suposição.
**Precisa de aprovação humana antes do merge:** sim (leitura do banco de produção; o censo é o que o dono
precisa ver antes de autorizar os `DROP` das etapas 235 a 239)
**Como verificar:** `05-PROGRESSO.md` tem a saída das três consultas, com data e o ref `jvfhclubfpxrtrrazrgr`,
e a tabela de cinco linhas com a decisão por candidato. Para cada candidato que **não existir** no banco,
anote "já removido — nenhuma etapa necessária" e cancele a etapa correspondente.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 235 — Remover o duplicado de `rastreamento_historico (lalamove_order_id)`

**Onda / Severidade / Camada:** 6 / Média / banco (DDL)
**Achados resolvidos:** P-06 candidato 1
**Problema hoje:** dois índices sobre a mesma coluna de `rastreamento_historico`:
`idx_rastreamento_historico_order` (`20251215184000_...sql:18`) e `idx_rastreamento_lalamove_order`
(`20260513191342_...sql:52`). Este é o par que **dói mais**: `rastreamento_historico` recebe uma linha por
consulta de rastreio — é a tabela de maior crescimento do sistema — e cada índice redundante é pago em
**toda** gravação, nas 18 partições.
**Causa raiz:** o mesmo índice criado duas vezes com nomes diferentes, em migrations sete meses apartadas.
Ninguém conferiu o que já existia — o mesmo defeito de método que P-06 denuncia.
**Caminho recomendado:** **comece pela tabela que a etapa 234 produziu**, não pelas migrations. Se os dois
existirem, decida qual fica pelo critério já usado pelo repositório na migration de dedupe
(`20260831130000_...sql:9-10`, que removeu `idx_rastreamento_order` e manteve
`idx_rastreamento_lalamove_order`): **fica o nome canônico que a dedupe anterior preservou** — ou seja,
`idx_rastreamento_lalamove_order` — e sai `idx_rastreamento_historico_order`. Seguir o mesmo critério da
migration anterior é importante: mantém o banco com um padrão de nomes, em vez de dois. Confirme os `idx_scan`
dos dois na etapa 234 e anexe-os à PR. A migration:

```sql
DROP INDEX IF EXISTS public.idx_rastreamento_historico_order;
```

**Atalho tentador a evitar:** `DROP INDEX CONCURRENTLY`. Além de não rodar em transação — e
`.github/workflows/aplicar-migration.yml:5` aplica em transação —, `CONCURRENTLY` **não é suportado em tabela
particionada**, e esta é. `DROP INDEX` simples sobre o índice do pai **cascateia** nas 18 partições e é
rápido, porque não reescreve dado.
**Arquivos e objetos a tocar:**
`supabase/migrations/<timestamp>_drop_idx_rastreamento_historico_order.sql` (novo, slug e timestamp novo)
**Não tocar / armadilhas:** **não remova os dois.** A coluna `lalamove_order_id` é usada pelo agrupamento de
`src/hooks/logistics/useTrackingAnalytics.tsx:140` e P-05 lista `rastreamento_historico (lalamove_order_id)`
entre os filtros **cobertos** — ficar sem índice ali é regressão séria. Confirme na consulta 3 da etapa 234
que nenhum dos dois sustenta constraint. Se a etapa 234 mostrar que `idx_rastreamento_historico_order` **já
não existe**, não escreva migration: anote "já removido" e feche a etapa. Um `DROP` por PR: não junte os
cinco candidatos.
**Depende de:** 234 · **Libera:** 240
**Risco e como reverter:** se você remover o índice **errado** (o que o planejador usa), as consultas de
rastreio ficam lentas na hora. Reverter = recriar: `CREATE INDEX idx_rastreamento_historico_order ON
public.rastreamento_historico (lalamove_order_id);` — mas a recriação numa tabela desse tamanho é caro, e é
por isso que a decisão vem do censo e não do palpite. Anexe o `indexdef` de ambos à PR, para que a recriação
seja literal.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção. **A PR fica aberta, com a
migration pronta e a tabela do censo (etapa 234) anexada**, aguardando o dono. Não mergeie.
**Como verificar:**

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname='public' AND tablename='rastreamento_historico'
  AND indexname IN ('idx_rastreamento_historico_order','idx_rastreamento_lalamove_order');

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.rastreamento_historico
WHERE lalamove_order_id = '<um id real do censo>' ORDER BY recorded_at ASC;
```

Esperado: **um só** índice listado, e o `EXPLAIN` usando `Index Scan using idx_rastreamento_lalamove_order`
— não `Seq Scan`. Esse segundo ponto é o que prova que o índice que ficou é o que serve. Sem acesso ao banco,
a etapa fica **aberta**.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 236 — Remover o duplicado de `rastreamento_historico (coleta_id)`

**Onda / Severidade / Camada:** 6 / Média / banco (DDL)
**Achados resolvidos:** P-06 candidato 2
**Problema hoje:** `idx_rastreamento_historico_coleta` (`20251215184000_...sql:19`) e
`idx_rastreamento_historico_coleta_id` (`20260711194400_...sql:49`) cobrem a mesma coluna. Mesmo custo do
candidato 1: tabela de maior crescimento, 18 partições, índice redundante pago em toda inserção.
**Causa raiz:** idêntica à da etapa 235.
**Caminho recomendado:** repita o desenho da etapa 235 — censo primeiro (etapa 234), critério de nome
depois. Aqui o critério tem indicação forte no repositório: a migration de dedupe
`20260831130000_...sql:9` removeu `idx_rastreamento_coleta` com o comentário "dup de
`idx_rastreamento_historico_coleta_id`", declarando **qual é o canônico**. Então fica
`idx_rastreamento_historico_coleta_id` e sai `idx_rastreamento_historico_coleta`. O arquivo de referência
desta etapa é a própria migration de dedupe: abra-a e siga o critério que ela já fixou, em vez de escolher
por conta própria.

```sql
DROP INDEX IF EXISTS public.idx_rastreamento_historico_coleta;
```

**Atalho tentador a evitar:** `DROP INDEX CONCURRENTLY` — não roda em transação e não é suportado em tabela
particionada (ver etapa 235). E não escolha "o mais antigo fica": nomes canônicos deste banco foram fixados
pela dedupe de agosto, não pela data de criação.
**Arquivos e objetos a tocar:**
`supabase/migrations/<timestamp>_drop_idx_rastreamento_historico_coleta.sql` (novo)
**Não tocar / armadilhas:** cuidado com a semelhança dos nomes — `..._coleta` sai, `..._coleta_id` fica.
Um caractere de diferença, e trocar os dois derruba o índice que o banco usa. Copie os nomes da saída da
etapa 234, não digite de memória. Confirme que nenhum dos dois sustenta chave estrangeira (consulta 3 da
etapa 234): `coleta_id` tem FK (`rastreamento_historico_coleta_id_fkey`, visível em
`src/integrations/supabase/types.ts:3586`), e índice de FK não se remove sem conferir. Um `DROP` por PR.
**Depende de:** 234, 235 · **Libera:** 240
**Risco e como reverter:** remover o índice que a FK usa degrada as verificações de integridade e qualquer
`DELETE` em `coletas`. Reverter = recriar pelo `indexdef` anexado à PR.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção. **PR aberta com a migration e o
censo anexados**, aguardando o dono.
**Como verificar:**

```sql
SELECT indexname FROM pg_indexes WHERE schemaname='public'
  AND tablename='rastreamento_historico' AND indexname LIKE '%coleta%';
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.rastreamento_historico WHERE coleta_id = '<um id real do censo>';
```

Esperado: um só índice de `coleta_id` no pai, e `Index Scan using idx_rastreamento_historico_coleta_id`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 237 — Remover o duplicado de `entregas (transportadora_id)`

**Onda / Severidade / Camada:** 6 / Baixa / banco (DDL)
**Achados resolvidos:** P-06 candidato 3
**Problema hoje:** `idx_entregas_transportadora` (`20260515144557_...sql:27`) e
`idx_entregas_transportadora_id` (`20260711194400_...sql:18`) cobrem a mesma coluna de `entregas` — uma das
duas tabelas mais movimentadas do sistema. Impacto menor que os dois primeiros candidatos, porque `entregas`
cresce mais devagar que `rastreamento_historico`, mas o índice redundante é pago em toda gravação.
**Causa raiz:** mesma. Duas migrations de maio e julho criaram o mesmo índice com sufixo diferente.
**Caminho recomendado:** censo (etapa 234) primeiro. O critério de nome, aqui, segue o padrão que a dedupe de
agosto usou nas outras tabelas: **fica o nome com o sufixo `_id`, que é o que a migration de julho
(`20260711194400_...sql`) padronizou** para a família de índices de chave estrangeira. Então sai
`idx_entregas_transportadora`. Confira os `idx_scan` dos dois antes: se o **antigo** for o que o planejador
usa (o que acontece quando ele é o primeiro na ordem de escolha), remova-o de todo modo — o planejador
migra para o que ficar, com o mesmo plano —, mas registre os dois números na PR para que a comparação de
depois tenha base.

```sql
DROP INDEX IF EXISTS public.idx_entregas_transportadora;
```

**Atalho tentador a evitar:** remover também `(transportadora_id, status)` (`20260711194640_...sql:4`)
"porque já cobre `transportadora_id`". Tecnicamente um índice composto **serve** como prefixo, mas: (a) ele é
maior, então uma busca só por `transportadora_id` fica mais caro; (b) a etapa 233 está avaliando justamente
índices de `transportadora_id`, e as duas decisões se atropelariam. Uma coluna, um par, uma PR.
**Arquivos e objetos a tocar:** `supabase/migrations/<timestamp>_drop_idx_entregas_transportadora.sql` (novo)
**Não tocar / armadilhas:** `entregas` **não** é particionada (ao contrário de `rastreamento_historico`), mas
`CONCURRENTLY` continua fora: não roda em transação, e `aplicar-migration.yml:5` aplica em transação. Não
remova `(transportadora_id, status)`. Confirme na consulta 3 da etapa 234 se algum dos dois sustenta FK. Se a
etapa 234 disser que `idx_entregas_transportadora` já não existe, anote "já removido" e feche.
**Depende de:** 234 · **Libera:** 240
**Risco e como reverter:** baixo. `CREATE INDEX idx_entregas_transportadora ON public.entregas
(transportadora_id);` recria — anexe o `indexdef` exato do censo à PR, porque o original pode ter predicado
ou ordem que esta linha não reproduz.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção. **PR aberta com a migration e o
censo**, aguardando o dono.
**Como verificar:**

```sql
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public'
  AND tablename='entregas' AND indexdef LIKE '%transportadora_id%';
```

Esperado: `idx_entregas_transportadora` ausente, `idx_entregas_transportadora_id` presente, e
`(transportadora_id, status)` intacto. Depois, com a tela de Envios filtrada por transportadora, confirme
tempo de resposta igual ao de antes.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 238 — Remover o duplicado de `coletas (transportadora_id)`

**Onda / Severidade / Camada:** 6 / Baixa / banco (DDL)
**Achados resolvidos:** P-06 candidato 4
**Problema hoje:** `idx_coletas_transportadora` (`20260515144557_...sql:29`) e
`idx_coletas_transportadora_id` (`20260515142608_...sql:41`) cobrem a mesma coluna de `coletas`. Note a
particularidade: as duas migrations são **do mesmo dia**, com cerca de 20 minutos de diferença — os dois
índices nasceram na mesma sessão de trabalho, um sem saber do outro.
**Causa raiz:** mesma, e com a prova no timestamp: duas migrations do mesmo dia criando o mesmo índice.
**Caminho recomendado:** espelhe a etapa 237, trocando `entregas` por `coletas`: censo primeiro, fica o nome
com sufixo `_id`, sai `idx_coletas_transportadora`. O arquivo de referência é a etapa 237 já mergeada — abra
a migration dela e copie a forma, inclusive o comentário de uma linha dizendo qual par foi deduplicado e com
qual critério. Esse comentário importa: é o que impede que o próximo agente ache que o índice sumiu por
acidente.

```sql
DROP INDEX IF EXISTS public.idx_coletas_transportadora;
```

**Atalho tentador a evitar:** juntar esta etapa com a 237 numa migration só, "porque é o mesmo par em duas
tabelas". Tentador e contra a regra: uma mudança atômica por PR, e se um dos dois `DROP` degradar alguma
consulta você quer reverter só ele.
**Arquivos e objetos a tocar:** `supabase/migrations/<timestamp>_drop_idx_coletas_transportadora.sql` (novo)
**Não tocar / armadilhas:** **atenção especial a esta tabela:** a migration de dedupe de agosto já removeu
vários índices de `coletas` — `idx_coletas_fornecedor` (`20260831130000_...sql:14`), `idx_coletas_prevista`
(`:15`), `idx_coletas_status` (`:16`). Então o estado de `coletas` é o mais distante das migrations de todo o
banco: **confie só no censo da etapa 234**. Não remova `(transportadora_id, status)`
(`20260711194640_...sql:20`). Vale tudo o que a etapa 237 diz sobre `CONCURRENTLY`. Se a etapa 234 disser que
`idx_coletas_transportadora` já não existe, anote "já removido" e feche a etapa — e isso será o oitavo falso
positivo deste achado, o que vale registrar.
**Depende de:** 234, 237 · **Libera:** 240
**Risco e como reverter:** baixo. Recriar pelo `indexdef` exato anexado à PR.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção. **PR aberta com a migration e o
censo**, aguardando o dono.
**Como verificar:**

```sql
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public'
  AND tablename='coletas' AND indexdef LIKE '%transportadora_id%';
```

Esperado: `idx_coletas_transportadora` ausente, `idx_coletas_transportadora_id` presente,
`(transportadora_id, status)` intacto. Depois, com a tela de Coletas filtrada por transportadora, tempo de
resposta igual ao de antes.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 239 — Decidir e remover a sobreposição em `audit_logs (table_name, record_id)`

**Onda / Severidade / Camada:** 6 / Baixa / banco (DDL)
**Achados resolvidos:** P-06 candidato 5
**Problema hoje:** três índices se sobrepõem em `audit_logs`: `idx_audit_logs_table_record (table_name,
record_id)` (`20260314181126_...sql:19`), `idx_audit_logs_record_id_table (record_id, table_name)`
(`20260513192805_...sql:2`) e `idx_audit_logs_record_id_created` (`20260513193049_...sql:3`). P-06 registra
que **o terceiro já atende as consultas reais do front**. Este é o candidato mais delicado dos cinco: os dois
primeiros têm as **mesmas colunas em ordem invertida**, o que não é duplicata exata — cada ordem serve a um
padrão de busca diferente, e qual deles o front usa é questão de fato, não de leitura de migration.
**Causa raiz:** três tentativas de indexar o mesmo acesso, em três meses, sem ninguém medir qual era usado.
**Caminho recomendado:** esta etapa é **medição antes de decisão**, e pode terminar em "não remover". Com o
censo da etapa 234 em mãos, compare os `idx_scan` dos três e cruze com o que o front realmente consulta:
`src/pages/AuditTrail.tsx:30` (teto 5000) é o consumidor principal — abra-o e veja se ele filtra por
`record_id` sozinho, por `table_name` sozinho, ou pelos dois. P-05 já registra que
`audit_logs (created_at DESC)` e `(record_id, created_at DESC)` estão entre os filtros **cobertos**, o que
reforça que `idx_audit_logs_record_id_created` é o que trabalha. Decida assim: remova **o índice com
`idx_scan` zero ou muito baixo cujo padrão de colunas já esteja coberto por outro**, um por vez, e **nunca
dois na mesma PR**. Se os três tiverem uso, não remova nada — registre "três índices com uso medido, nenhuma
remoção segura" e feche a etapa. `audit_logs` é **particionada** (13 partições, conforme o cabeçalho da
dedupe em `20260831130000_...sql:2`), então um `DROP` no pai cascateia. **Atalho tentador a evitar:** assumir
que `(table_name, record_id)` e `(record_id, table_name)` são a mesma coisa porque têm as mesmas colunas. Não
são: um índice composto só serve a busca que usa a **primeira** coluna, ou ambas. Remover o errado tira o
índice de quem busca por `table_name` sem `record_id`.
**Arquivos e objetos a tocar:** `supabase/migrations/<timestamp>_drop_idx_audit_logs_<o escolhido>.sql`
(novo), **ou nenhum**, se a medição disser que não há remoção segura
**Não tocar / armadilhas:** **não remova `idx_audit_logs_record_id_created`** — P-06 diz explicitamente que
ele atende as consultas reais, e P-05 o lista entre os filtros cobertos. A dedupe de agosto já removeu dois
índices de prefixo em `audit_logs` (`idx_audit_logs_record_id` e `idx_audit_logs_table_name`,
`20260831130000_...sql:6-7`): o estado desta tabela está longe das migrations, e só o censo vale. `audit_logs`
é registro de auditoria — ficar sem índice ali não perde dado, mas pode deixar uma consulta de investigação
lenta no pior momento. Na dúvida, não remova.
**Depende de:** 234 · **Libera:** 240
**Risco e como reverter:** remover a ordem errada degrada a busca por `table_name`. Recriar pelo `indexdef`
do censo — mas `audit_logs` particionada com 13 partições torna a recriação demorada, o que é mais um motivo
para não remover sem medição.
**Precisa de aprovação humana antes do merge:** **sim** — DDL em produção numa tabela de auditoria. **Se
houver migration, a PR fica aberta com o censo e os três `idx_scan` anexados, e a justificativa de qual sai
em uma linha**, aguardando o dono.
**Como verificar:**

```sql
SELECT indexrelname, idx_scan FROM pg_stat_user_indexes
WHERE schemaname='public' AND relname='audit_logs' AND indexrelname LIKE 'idx_audit_logs%';
```

Esperado: o índice escolhido ausente, os demais presentes, e — 24 horas depois do apply — `idx_scan`
crescendo em `idx_audit_logs_record_id_created`, provando que as consultas migraram em vez de passar a varrer
a tabela. Se a decisão foi **não remover**, a evidência é a tabela dos três `idx_scan` com o veredito escrito.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 240 — Fechar o ciclo: registrar que índice se confere no banco, e conferir que nada regrediu

**Onda / Severidade / Camada:** 6 / Alta / documentação + banco
**Achados resolvidos:** P-06 (a lição de método), fecha o grupo P
**Problema hoje:** P-06 existe porque alguém montou uma lista de 12 índices duplicados lendo `CREATE INDEX`
nas migrations, e 7 já tinham sido removidos três meses antes
(`20260831130000_index_dedupe_and_realtime.sql`, aplicada em produção). O erro vai se repetir: nada no
repositório impede o próximo agente de fazer a mesma coisa. `docs/agentes/banco.md:56-58` já diz "migration é
histórico, não estado" — em termos gerais, sem o caso concreto que torna a regra memorável, e sem a consulta
pronta. E `docs/contexto/supabase/`, a fonte que o protocolo nomeia como dona desse fato, nunca foi gerada
(H-09), então quem obedecer o protocolo não encontra nada.
**Causa raiz:** a regra existe como princípio e não como procedimento. Falta o "faça assim" com a consulta
colada e o exemplo do que acontece quando não se faz.
**Caminho recomendado:** duas coisas, nesta ordem. (1) Acrescente a `docs/agentes/banco.md`, na seção
"Regras de migration", uma subseção curta **"Índices: confira no banco, não nas migrations"** com: as duas
consultas das etapas 228 e 234 prontas para copiar (`pg_indexes` e `pg_stat_user_indexes`), a regra de que
`idx_scan = 0` não condena um índice sozinho, a nota de que `CREATE/DROP INDEX CONCURRENTLY` não roda no
`aplicar-migration.yml` (que aplica em transação, `:5`) nem em tabela particionada, e **o caso P-06 em uma
linha**: "em 2026-11, 7 de 12 'duplicados' lidos nas migrations já tinham sido removidos". É o caso concreto
que faz a regra pegar. Corrija também, na mesma PR, a linha `:48-49` que afirma que "não existe workflow de
apply": `.github/workflows/aplicar-migration.yml` existe. (2) Rode a consulta de censo da etapa 234 **de
novo**, depois de todos os `DROP` das etapas 235 a 239 terem sido aplicados, e compare com a saída original:
é a prova de que saiu o que devia sair e nada mais. **Atalho tentador a evitar:** gerar
`docs/contexto/supabase/` nesta etapa "para resolver o H-09 de uma vez". É achado de outro grupo, com
automação própria (`.github/workflows/contexto-ia.yml`) e escopo bem maior; misturar os dois faz esta etapa
não ser concluída.
**Arquivos e objetos a tocar:** `docs/agentes/banco.md` (uma subseção nova na seção "Regras de migration" e
a correção de `:48-49`), `05-PROGRESSO.md` (o censo final)
**Não tocar / armadilhas:** mexer em `docs/agentes/` dispara o check obrigatório **"Agents Docs Integrity"**:
rode `node scripts/ci/check-claude-md-integrity.mjs` antes de abrir a PR. Não reescreva a seção "Regras de
migration" — **acrescente**; as sete regras existentes estão corretas e outros agentes as citam por número.
Não toque na branch `contexto`: ela é gerada por automação e o `AGENTS.md` proíbe editá-la ou abrir PR dela.
**Depende de:** 234, 235, 236, 237, 238, 239 · **Libera:** —
**Risco e como reverter:** nenhum para o sistema (documentação e leitura). O risco é de conteúdo: se a
subseção descrever um procedimento que não funciona, o próximo agente segue o errado — então cole as
consultas **que você mesmo executou** nas etapas 228 e 234, com a saída que elas deram, não uma versão
"melhorada" que você não rodou.
**Precisa de aprovação humana antes do merge:** sim (o censo final é leitura do banco de produção e é o
fechamento que o dono precisa ver; a parte de documentação pode ir no mesmo PR)
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs
grep -n 'pg_indexes\|pg_stat_user_indexes\|aplicar-migration' docs/agentes/banco.md
```

E no banco:

```sql
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('rastreamento_historico','entregas','coletas','audit_logs','telemetry_logs')
ORDER BY tablename, indexname;
```

Esperado: o check de integridade passa; as duas consultas aparecem no documento; e o censo final difere do
original da etapa 234 **exatamente** nos índices que as etapas 230 a 239 criaram ou removeram — nem um a mais,
nem um a menos. Cole a comparação em `05-PROGRESSO.md`: é ela que conclui o grupo P.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

## Onda 8 — higiene, CI, observabilidade e fechamento (241-300)

### Etapa 241 — Pôr aviso de obsolescência no alto de `ESTADO_ATUAL.md`, dizendo qual banco ele descreve

**Onda / Severidade / Camada:** 8 / Crítica / documentação
**Achados resolvidos:** H-01
**Problema hoje:** `ESTADO_ATUAL.md:3` diz "Auditoria de estado executada em **16/08/2026** sobre o commit
`513ab5a`" e nada mais no arquivo avisa que o retrato caducou. O arquivo tem o nome mais convidativo do
repositório (57 KB) e descreve o projeto Supabase `hgicfqjayrjurivtygqf` (declarado em
`ESTADO_ATUAL_EVIDENCIAS.md:4`), que o `AGENTS.md:84-86` classifica como **"não escrever"** — não é o banco
de produção.
**Causa raiz:** retrato de um momento com nome de estado presente, sem prazo de validade nem identificação
do banco medido.
**Caminho recomendado:** acrescente, **logo depois da linha 1** (título), um bloco de citação de 5 a 8
linhas com, nesta ordem: (a) a palavra **HISTÓRICO**; (b) a data da medição (16/08/2026) e o commit
(`513ab5a`); (c) **qual banco** foi medido (`hgicfqjayrjurivtygqf` — Lovable Cloud, não é produção; o banco
oficial é `jvfhclubfpxrtrrazrgr`); (d) que três afirmações centrais já foram refutadas e estão corrigidas na
etapa 242; (e) o ponteiro para o retrato mais recente (`docs/prod-readiness.md`) e para esta auditoria
(`docs/qa/03-ACHADOS.md`). Copie a forma do aviso que o próprio repositório já usa em `docs/MELHORIAS.md:3`
(bloco `> **ATENCAO**: ...` com a fonte autoritativa nomeada) — é o padrão interno para documento que pode
enganar. **Atalho tentador a evitar:** apagar ou mover o arquivo. São 98 KB de evidência do cutover, com
`arquivo:linha` que ainda explica decisões; o problema é a ausência de prazo de validade, não o conteúdo.
**Arquivos e objetos a tocar:** `ESTADO_ATUAL.md` (inserção de bloco após a linha 1)
**Não tocar / armadilhas:** não altere nenhum número do corpo nesta etapa (é a 242) nem o link para
`ESTADO_ATUAL_EVIDENCIAS.md` em `:8`. Não renomeie o arquivo: `ESTADO_ATUAL_EVIDENCIAS.md:3` aponta para
ele por nome, e `git log` mostra referências em PRs antigas.
**Depende de:** — · **Libera:** 242, 243
**Risco e como reverter:** nenhum risco funcional (documentação). `git revert` da PR.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '1,12p' ESTADO_ATUAL.md
grep -c 'hgicfqjayrjurivtygqf\|jvfhclubfpxrtrrazrgr' ESTADO_ATUAL.md
```

Esperado: o bloco aparece antes de qualquer tabela, nomeia os dois refs de banco e a data; o `grep` devolve
no mínimo 2.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 242 — Corrigir no corpo de `ESTADO_ATUAL.md` as três afirmações refutadas por medição

**Onda / Severidade / Camada:** 8 / Crítica / documentação
**Achados resolvidos:** H-01
**Problema hoje:** a tabela do veredito manda consertar o que já está verde:
`ESTADO_ATUAL.md:24` — "🔴 **Typecheck — 21 erros** — o orçamento exige 0" (hoje `npx tsc --noEmit` → **0
erros**, exit 0); `:25` — "🔴 **Lint — não executa: crash de configuração**" (hoje `npx eslint .` roda e
devolve **105 avisos, 0 erros**, dentro do orçamento). `:26` ainda afirma que `npm ci` falha com ERESOLVE.
**Causa raiz:** linha de diagnóstico sem marca de validade dentro de um documento sem validade.
**Caminho recomendado:** **não reescreva a tabela.** Em cada uma das três linhas, mantenha o texto original e
acrescente ao final da célula "Situação medida" um sufixo curto no formato
`— ⚠️ superado em 2026-11-23: <valor medido> (ver docs/qa/02-CENARIOS.md §0, E1/E2/E3)`. Assim o documento
continua legível como histórico e deixa de dar ordem errada. Os valores medidos estão em
`docs/qa/02-CENARIOS.md` seção 0, linhas E1, E2 e E3 — use exatamente aqueles números, não remeça.
**Atalho tentador a evitar:** rodar os gates de novo e colar números novos sem citar a fonte. Se você rodar,
cite o comando e a data da sua execução; se não rodar, cite a seção 0. Nunca escreva um número sem dizer de
onde veio.
**Arquivos e objetos a tocar:** `ESTADO_ATUAL.md:24`, `:25`, `:26`
**Não tocar / armadilhas:** o bloco imediatamente abaixo da tabela (`:28` em diante) explica que "o bloco
vermelho tem duas idades" — ele continua válido como raciocínio; não o apague. Não toque nas linhas de
Frontend/rotas (61 rotas, confirmado em `docs/prod-readiness.md:9`) nem em Banco.
**Depende de:** 241 · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '20,28p' ESTADO_ATUAL.md
npx tsc --noEmit; echo "exit=$?"
npm run lint:budget
```

Esperado: as três linhas trazem o sufixo "superado"; o typecheck sai 0/exit 0 e o orçamento passa — provando
que o texto corrigido é o verdadeiro.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 243 — Avisar e corrigir `ESTADO_ATUAL_EVIDENCIAS.md`: banco medido e contagem de migrations

**Onda / Severidade / Camada:** 8 / Alta / documentação
**Achados resolvidos:** H-01
**Problema hoje:** `ESTADO_ATUAL_EVIDENCIAS.md:4` declara o projeto Supabase `hgicfqjayrjurivtygqf` como
base de todas as evidências, e `:19` conta `supabase/migrations/*.sql` = **230**. Hoje
`ls supabase/migrations/*.sql | wc -l` devolve **248**.
**Causa raiz:** a mesma da 241 — anexo de evidência sem prazo de validade.
**Caminho recomendado:** repita a forma do bloco da etapa 241 depois da linha 1 (mesmo texto, adaptado ao
anexo), e na linha `:19` mantenha o 230 acrescentando `(em 16/08/2026; 248 em 2026-11-23)`. No bloco, diga
explicitamente a frase que mais importa para o próximo agente: **as evidências deste anexo foram colhidas no
banco `hgicfqjayrjurivtygqf`, onde agentes não podem escrever; o banco oficial é `jvfhclubfpxrtrrazrgr`**.
**Atalho tentador a evitar:** recontar e atualizar as 20 linhas da tabela de cobertura. Vira retrato novo
dentro de documento histórico e caduca igual em três meses — corrija só a linha citada no achado e deixe o
aviso fazer o resto.
**Arquivos e objetos a tocar:** `ESTADO_ATUAL_EVIDENCIAS.md` (bloco após a linha 1 e a linha `:19`)
**Não tocar / armadilhas:** não mexa nas demais linhas da tabela `§1 RECONTAGEM DE COBERTURA`; elas não
foram remedidas por esta auditoria e trocá-las por chute é pior que deixá-las datadas.
**Depende de:** 241 · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '1,12p' ESTADO_ATUAL_EVIDENCIAS.md; sed -n '19p' ESTADO_ATUAL_EVIDENCIAS.md
ls supabase/migrations/*.sql | wc -l
```

Esperado: bloco presente nomeando os dois bancos; a linha 19 traz os dois números; o `ls` devolve 248 (ou o
número do dia, que deve bater com o que você escreveu).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 244 — Pôr aviso de obsolescência e nota de método no alto de `DOCUMENTATION.md`

**Onda / Severidade / Camada:** 8 / Alta / documentação
**Achados resolvidos:** H-02
**Problema hoje:** `DOCUMENTATION.md` (31 KB, 739 linhas) abre em `:3` com "Levantamento completo de
funcionalidades e ferramentas" e nada avisa que a árvore descrita é anterior à reorganização de hooks por
domínio (ADR 0008). Resultado: 29 caminhos errados e 10 componentes inexistentes passam por verdade.
**Causa raiz:** documento de arquitetura sem data e sem commit-base, desatualizado por uma reorganização de
pastas que ninguém propagou.
**Caminho recomendado:** acrescente após `:3` um bloco com: (a) **sem data de origem confirmada**; (b) a
árvore de `src/hooks/` foi reorganizada por domínio pelo ADR `docs/adr/0008-*` e **os caminhos citados neste
arquivo podem estar na pasta errada**; (c) a fonte autoritativa de "onde uma coisa vive" é
`docs/contexto/codigo/INDEX.md` na branch `contexto` (como manda `docs/contexto/00-INDEX.md`); (d) os erros
já mapeados estão em `docs/qa/03-ACHADOS.md` H-02 e nas etapas 245-247. Use a forma de `docs/MELHORIAS.md:3`.
**Atalho tentador a evitar:** apagar o arquivo porque "está errado". São 739 linhas que mapeiam
funcionalidade a biblioteca — informação que não existe em outro lugar do repositório. Corrija o que está
errado (245-247) e avise sobre o resto.
**Arquivos e objetos a tocar:** `DOCUMENTATION.md` (inserção após a linha 3)
**Não tocar / armadilhas:** não mexa no índice (`:10` em diante) — as âncoras `#-segurança--autenticação`
dependem dos títulos atuais; mudar título quebra o índice.
**Depende de:** — · **Libera:** 245, 246, 247, 248
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '1,14p' DOCUMENTATION.md
```

Esperado: o bloco aparece antes do índice e nomeia o ADR 0008 e `docs/contexto/codigo/INDEX.md`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 245 — Corrigir os 29 caminhos de hook citados em `DOCUMENTATION.md`

**Onda / Severidade / Camada:** 8 / Alta / documentação
**Achados resolvidos:** H-02
**Problema hoje:** `DOCUMENTATION.md:34` cita `src/hooks/useAuth.tsx`; o arquivo está em
`src/hooks/auth/useAuth.tsx`. São **29 linhas** com o mesmo defeito (`useGamification`, `useDebounce`,
`useAuditLogs`, `useDashboardMetrics`, `useDrillDown`, `useExport`, `useBoxManagement`,
`useFreightQuotation`, `useConciliacao`, `useNotifications`, `usePushNotifications`, `useGeocoding`,
`useKPIBenchmark`, `useCostAlerts`, `useLogisticsCosts`, `useLogisticsCalendar`, entre outros).
**Causa raiz:** os hooks foram movidos para subpastas de domínio (ADR 0008) e o documento ficou na árvore
antiga.
**Caminho recomendado:** **não corrija à mão, uma a uma** — é onde se erra. Gere a lista real primeiro e
conserte a partir dela:

```bash
grep -oE 'src/hooks/[A-Za-z0-9_/.-]+' DOCUMENTATION.md | sort -u > /tmp/citados.txt
while read -r p; do [ -e "$p" ] || echo "QUEBRADO $p -> $(find src/hooks -name "$(basename "$p")" -printf '%p\n' | head -1)"; done < /tmp/citados.txt
```

Esse laço imprime, para cada caminho quebrado, o destino real. Aplique as substituições com `sed` por
caminho exato (`sed -i 's#src/hooks/useAuth.tsx#src/hooks/auth/useAuth.tsx#g' DOCUMENTATION.md`) e rode o
laço de novo até sair vazio. Onde o `find` não achar nada, **não invente caminho**: marque a linha com
`(não localizado em 2026-11-23)` — pode ser um dos casos da etapa 246.
**Atalho tentador a evitar:** `sed` genérico do tipo `s#src/hooks/#src/hooks/common/#g`. Os hooks estão
espalhados por `auth/`, `common/`, `data/`, `analytics/`, `logistics/`, `ui/`, `integrations/`,
`rodonaves/` — um prefixo único troca 29 erros por 29 erros diferentes.
**Arquivos e objetos a tocar:** `DOCUMENTATION.md` (apenas as células de "Arquivos Principais")
**Não tocar / armadilhas:** não mova nem renomeie nenhum arquivo de `src/hooks/` para fazer o documento
ficar certo. O documento está errado, não a árvore. Nenhuma linha de `src/` deve aparecer no diff desta PR.
**Depende de:** 244 · **Libera:** 248
**Risco e como reverter:** nenhum risco funcional. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -oE 'src/hooks/[A-Za-z0-9_/.-]+' DOCUMENTATION.md | sort -u | while read -r p; do [ -e "$p" ] || echo "AINDA QUEBRADO: $p"; done
git diff --stat
```

Esperado: nenhuma linha "AINDA QUEBRADO" (ou só as marcadas como não localizadas) e o `--stat` mostrando
**só** `DOCUMENTATION.md`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 246 — Marcar em `DOCUMENTATION.md` os 10 componentes que não existem

**Onda / Severidade / Camada:** 8 / Alta / documentação
**Achados resolvidos:** H-02
**Problema hoje:** dez componentes citados não existem em lugar nenhum da árvore: `DeliveryMap.tsx`
(`:212`), `DriverTrackingMap.tsx` (`:213`), `TrackingHeatmap.tsx` (`:217`), `MonthlyComparisonChart.tsx`
(`:134`), `RegionHeatmap.tsx` (`:138`), `DemandForecastChart.tsx` (`:139`),
`TransportadoraComparisonChart.tsx` (`:140`), `KPIBenchmarkDashboard.tsx` (`:137`), `XPProgressCard.tsx`
(`:83`), `PushNotificationSettings.tsx` (`:244`).
**Causa raiz:** o documento descreve um plano (ou uma versão anterior) como se fosse o presente.
**Caminho recomendado:** confirme cada um antes de marcar — `find src -name '<Nome>.tsx'` — e **só então**
troque a célula do arquivo por `❌ não existe (verificado em 2026-11-23)`, mantendo a descrição da
funcionalidade na linha. Se o `find` achar um componente de nome diferente que faz a mesma coisa (por
exemplo um mapa em `src/components/map/`), escreva o caminho real em vez do `❌`: é a informação que impede
a duplicação. **Atalho tentador a evitar:** criar o componente que falta "para a documentação ficar
verdadeira". Isso é funcionalidade nova, fora do escopo deste plano, e cria exatamente o código duplicado
que o achado descreve.
**Arquivos e objetos a tocar:** `DOCUMENTATION.md` (as 10 linhas citadas)
**Não tocar / armadilhas:** `src/components/map/MapboxMap.tsx` existe e é o mapa real — não o renomeie para
`DeliveryMap.tsx`. As etapas 291-292 mexem nesse arquivo; conflito de PR se você o tocar aqui.
**Depende de:** 244 · **Libera:** 248
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
for c in DeliveryMap DriverTrackingMap TrackingHeatmap MonthlyComparisonChart RegionHeatmap DemandForecastChart TransportadoraComparisonChart KPIBenchmarkDashboard XPProgressCard PushNotificationSettings; do printf '%s: ' "$c"; find src -name "$c.tsx" | head -1; echo; done
```

Esperado: nenhum caminho impresso (confirmando a ausência) e as 10 linhas do documento marcadas de acordo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 247 — Corrigir a seção de internacionalização de `DOCUMENTATION.md`

**Onda / Severidade / Camada:** 8 / Média / documentação
**Achados resolvidos:** H-02
**Problema hoje:** `DOCUMENTATION.md:499` diz "**i18n (custom)** | `src/i18n/index.ts`,
`src/i18n/locales/`" e `:505` desenha uma árvore `src/i18n/` com `index.ts` e `locales/*.json`. Nada disso
existe: o arquivo é `src/i18n.ts` (verificado: `ls src/i18n*` devolve só `src/i18n.ts`) e a biblioteca não é
própria — `package.json` traz `i18next@^26.2.0` e `react-i18next@^17.0.13`, e `src/main.tsx:6` importa
`"./i18n"`.
**Causa raiz:** descrição escrita a partir de uma estrutura planejada, nunca conferida contra a árvore.
**Caminho recomendado:** troque a célula "Ferramenta/Biblioteca" de `:499` por `i18next + react-i18next` com
as versões lidas do `package.json` no dia, e a célula de arquivos por `src/i18n.ts`. Substitua o bloco de
árvore de `:505` pelo conteúdo real: abra `src/i18n.ts` e descreva de onde vêm os idiomas (recursos inline
ou import) — **leia antes de escrever**. Confirme também a linha vizinha `useTimezone` (`:500`) com
`find src -name 'useTimezone.tsx'`, porque ela é citada como `src/hooks/useTimezone.tsx` e cai no mesmo
defeito da etapa 245. **Atalho tentador a evitar:** criar a pasta `src/i18n/` com `index.ts` e `locales/`
para casar com o documento. É refatoração não pedida, mexe no boot da aplicação (`src/main.tsx:6`) e nada
exige.
**Arquivos e objetos a tocar:** `DOCUMENTATION.md:499-510`
**Não tocar / armadilhas:** não toque em `src/i18n.ts` nem em `src/main.tsx`. Se as versões do
`package.json` divergirem do que você escrever, o documento volta a mentir — cite a versão com a data.
**Depende de:** 244 · **Libera:** 248
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
ls src/i18n*; grep -n '"i18next"\|"react-i18next"' package.json; sed -n '495,512p' DOCUMENTATION.md
```

Esperado: a seção cita `src/i18n.ts`, `i18next` e `react-i18next` com as versões que o `grep` mostrar, e não
há mais menção a `src/i18n/index.ts` nem a `src/i18n/locales/`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 248 — Criar verificação automática dos caminhos citados na documentação

**Onda / Severidade / Camada:** 8 / Média / CI
**Achados resolvidos:** H-02, H-07
**Problema hoje:** nada no repositório reprova um documento que cita `src/...` inexistente. Foi assim que
`DOCUMENTATION.md` acumulou 29 caminhos errados e 10 componentes fantasma sem ninguém notar, e é assim que
voltará a acumular depois das etapas 245-247.
**Causa raiz:** a correção de documentação não tem gate; só a existência de `AGENTS.md` tem
(`scripts/ci/check-claude-md-integrity.mjs`).
**Caminho recomendado:** crie `scripts/ci/check-doc-paths.mjs` seguindo o desenho de
`scripts/ci/check-claude-md-integrity.mjs` (ESM, `process.chdir` para a raiz do repo a partir de
`import.meta.url`, saída com `exit 1` e mensagem única por falha). Regra: para um conjunto **declarado** de
documentos (comece por `DOCUMENTATION.md`, `AGENTS.md`, `docs/agentes/*.md`), extraia ocorrências de
`src/...`, `supabase/...` e `scripts/...` dentro de crases e reprove as que não existem no disco. Permita
isenção explícita por marca na própria linha (por exemplo `❌ não existe`), que é o que as etapas 246 e 261
produzem — sem isso o gate reprova a correção que acabou de ser feita. Acrescente o script a
`package.json` como `validate:doc-paths` e **só então** pendure-o num job. **Atalho tentador a evitar:**
varrer `docs/**` inteiro de uma vez. Há dezenas de documentos históricos (`docs/PERFEICAO_10_10.md`,
`docs/MELHORIAS.md`, os seis `docs/PLANO_*_ETAPAS.md`) cheios de caminhos planejados; o gate nasceria
vermelho e seria desligado na semana seguinte. Lista declarada, crescendo uma entrada por vez.
**Arquivos e objetos a tocar:** `scripts/ci/check-doc-paths.mjs` (novo), `package.json` (um script),
o workflow que hospedar o job
**Não tocar / armadilhas:** mexer em `scripts/` aciona o required check **"Contratos da automação local"** —
rode `npm run automation:test` antes de abrir a PR. Mexer em workflow é mudança de CI: **PR fica aberta para
o dono**. E lembre que são **10** required checks, não 9 (ver etapa 249): acrescentar um job novo à proteção
de branch é decisão do dono, não sua — proponha o job e deixe a inclusão como required para ele decidir.
**Depende de:** 245, 246, 247 · **Libera:** 261
**Risco e como reverter:** um gate novo mal calibrado trava todas as PRs seguintes. Mitigação: rode o script
local contra a `main` e mostre a saída limpa no corpo da PR antes de propor o job. Reverter = `git revert` +
remoção do job.
**Precisa de aprovação humana antes do merge:** sim (cria gate de CI e toca workflow)
**Como verificar:**

```bash
node scripts/ci/check-doc-paths.mjs; echo "exit=$?"
npm run automation:test 2>&1 | tail -20
```

Esperado: `exit=0` na árvore corrigida; e, inserindo de propósito um `src/hooks/naoExiste.ts` num dos
documentos da lista, `exit=1` com a linha apontada. Registre as duas execuções.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 249 — `AGENTS.md`: corrigir a regra de merge para 10 required checks e nomear o décimo

**Onda / Severidade / Camada:** 0 / Alta / documentação-CI
**Achados resolvidos:** H-03 (item 1)
**Problema hoje:** `AGENTS.md:63` diz que a PR pode ser mergeada com "os **9 required checks** verdes". São
**10**: `scripts/ci/github-settings-baseline.json:22-33` lista `Security Scan`, `Lint`, `Type Check`,
`Warning Budget Gate`, `Unit & Integration Tests`, `Build Artifact`, `quality-gate`, `Security Audits`,
`Agents Docs Integrity` e **`Contratos da automação local`** — e a API do GitHub confirma os mesmos dez. Com
`strict = false` (`:16` do mesmo arquivo), nada impede o agente de contar nove verdes, ver o décimo
pendente e mergear.
**Causa raiz:** o décimo check foi acrescentado ao repositório e a regra escrita não acompanhou.
**Caminho recomendado:** na linha 63, troque "9" por "10" e **liste os dez nomes** entre parênteses, na
ordem do baseline, porque é a contagem que falha, não o número: um agente que vê a lista confere item a
item. Aproveite para citar o arquivo que é a fonte (`scripts/ci/github-settings-baseline.json:22-33`), de
modo que a próxima divergência seja verificável sem a API. **Atalho tentador a evitar:** trocar só o dígito.
"10 required checks" sem a lista deixa o agente adivinhando qual é o décimo — e o décimo
(`Contratos da automação local`) é justamente o que dispara quando se mexe em `scripts/`, que é onde várias
etapas deste plano mexem.
**Arquivos e objetos a tocar:** `AGENTS.md:63` (seção "Fluxo Git")
**Não tocar / armadilhas:** `AGENTS.md` é protegido pelo required check **"Agents Docs Integrity"**
(`node scripts/ci/check-claude-md-integrity.mjs`): ele exige que os oito títulos `## Postura`,
`## Bugs e funcionalidades`, `## Comunicação`, `## Fluxo Git`, `## Banco`, `## Serviços`,
`## Stack e comandos`, `## Grafo de código` continuem existindo, que `CLAUDE.md` continue com `@AGENTS.md`,
e que o arquivo não encolha mais de 50%. **Rode o script antes de abrir a PR.** Não reescreva a seção: uma
linha.
**Depende de:** — · **Libera:** 254, 255
**Risco e como reverter:** nenhum risco funcional; risco de regra errada se você errar a lista. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (altera a regra de merge do repositório)
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
sed -n '60,66p' AGENTS.md
node -e "console.log(require('./scripts/ci/github-settings-baseline.json').branch_protection_main.required_status_checks.length)"
```

Esperado: `exit=0`; a linha 63 diz 10 e lista os dez; o `node -e` imprime `10` — e os dois nomes batem.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 250 — `AGENTS.md`: dizer que o repositório é público

**Onda / Severidade / Camada:** 0 / Alta / documentação-segurança
**Achados resolvidos:** H-03 (item 2), S-07
**Problema hoje:** `AGENTS.md:52` afirma "Repo `adm01-debug/Loggi_Flow_V2`, `main`, **privado**". A API do
GitHub devolve `"visibility":"public"` (medido: `docs/qa/02-CENARIOS.md` §0, linha E10). O agente que
acredita no "privado" trata o repositório como ambiente fechado — e `.env` está versionado e fora do
`.gitignore` (E8), com valores reais.
**Causa raiz:** a visibilidade mudou (ou nunca foi o que o documento diz) e a regra escrita não acompanhou.
**Caminho recomendado:** troque `**privado**` por `**público**` e acrescente, na mesma linha, a consequência
operacional em meia frase: _tudo que entrar no repositório é publicado — inclusive `.env`_. O objetivo da
etapa não é o adjetivo, é o comportamento que ele induz. Cite como verificar (`gh repo view --json visibility`)
para que a próxima divergência seja checável. **Atalho tentador a evitar:** pedir ao dono para tornar o
repositório privado nesta etapa. Mudar visibilidade é decisão de arquitetura/custo do dono e tem efeito em
Actions, forks e links já compartilhados; isso é matéria de S-07 (etapas 020-022), não daqui. Aqui o
documento passa a dizer a verdade.
**Arquivos e objetos a tocar:** `AGENTS.md:52`
**Não tocar / armadilhas:** mesma armadilha da etapa 249 ("Agents Docs Integrity" — rode o script). Não
toque no `.env` nem no `.gitignore` nesta etapa: é S-07, e mexer aqui causa conflito com as etapas 020-022.
**Depende de:** — · **Libera:** 254
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (afirmação de postura de segurança do repositório)
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
gh repo view adm01-debug/Loggi_Flow_V2 --json visibility
sed -n '52p' AGENTS.md
```

Esperado: `exit=0`; a API responde `public`; a linha 52 diz público. Se a API responder `private`, **pare**:
a realidade mudou desde a auditoria — registre em `05-PROGRESSO.md` e não altere o documento.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 251 — `AGENTS.md`: o deploy de edge function é automático em merge para `main`

**Onda / Severidade / Camada:** 0 / Alta / documentação-CI
**Achados resolvidos:** H-03 (item 3)
**Problema hoje:** `AGENTS.md:90-92` diz "deploy **manual** pelo `deploy-functions.yml`
(`workflow_dispatch`, exige o secret `SUPABASE_ACCESS_TOKEN`); nunca `supabase functions deploy` direto".
O workflow tem **os dois** gatilhos: `.github/workflows/deploy-functions.yml:9-13` é
`on: push: branches: [main], paths: ['supabase/functions/**']`, e o comentário do próprio arquivo (`:4`)
diz "Deploy automatico em merge para a main". Ou seja: **mergear uma PR que toque `supabase/functions/**`
publica a função em produção na hora**, e o agente que leu "manual" não confere o deploy.
**Causa raiz:** o gatilho de `push` foi acrescentado ao workflow e a regra escrita ficou na versão anterior.
**Caminho recomendado:** reescreva as duas linhas para: deploy **automático** em merge para `main` quando o
diff toca `supabase/functions/**`, **mais** `workflow_dispatch` para disparo manual (inclusive de uma única
função, pelo input `only`); mantenha a frase "nunca `supabase functions deploy` direto" e mantenha a
exigência do secret. Acrescente a consequência: **toda PR de edge function é um deploy — confirme o run do
`deploy-functions.yml` depois do merge e registre o horário.** É esta frase que muda o comportamento.
**Atalho tentador a evitar:** remover o gatilho de `push` do workflow para fazer o documento ficar certo.
Isso é mudança de CI com efeito em produção (funções deixariam de ser publicadas e ninguém notaria), e não
é o que o achado pede.
**Arquivos e objetos a tocar:** `AGENTS.md:90-92`
**Não tocar / armadilhas:** não altere `.github/workflows/deploy-functions.yml`. Mesma armadilha do
"Agents Docs Integrity" das etapas 249-250.
**Depende de:** — · **Libera:** 254
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (altera a regra de deploy em produção escrita para agentes)
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
sed -n '8,14p' .github/workflows/deploy-functions.yml
sed -n '89,93p' AGENTS.md
```

Esperado: `exit=0`; o workflow mostra `push`+`paths`+`workflow_dispatch`; o `AGENTS.md` descreve exatamente
isso.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 252 — `AGENTS.md`: corrigir a contagem de migrations de 244 para a contagem real

**Onda / Severidade / Camada:** 8 / Baixa / documentação
**Achados resolvidos:** H-03 (item 4)
**Problema hoje:** `AGENTS.md:82` diz "As **244 migrations** do repo são histórico".
`ls supabase/migrations/*.sql | wc -l` devolve **248**.
**Causa raiz:** número absoluto escrito à mão num arquivo que cresce a cada migration.
**Caminho recomendado:** em vez de trocar 244 por 248 (que caduca na próxima migration), reescreva a frase
sem o número fixo: "As migrations do repo (hoje **248**; confira com
`ls supabase/migrations/*.sql | wc -l`) são histórico; o estado real é o banco ao vivo". O valor fica como
referência datada e o comando fica como fonte. Esse é o padrão que o próprio `AGENTS.md` usa em outros
pontos ao citar scripts verificáveis. **Atalho tentador a evitar:** apagar o número. A frase perde a força
de "são muitas e são histórico", que é o que impede o agente de ler migration como estado.
**Arquivos e objetos a tocar:** `AGENTS.md:82`
**Não tocar / armadilhas:** não toque na frase seguinte sobre a fonte `supabase/` da branch `contexto` — ela
é objeto das etapas 263-266 e geraria conflito. Mesma armadilha do "Agents Docs Integrity".
**Depende de:** — · **Libera:** 255
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
ls supabase/migrations/*.sql | wc -l; sed -n '82p' AGENTS.md
```

Esperado: `exit=0` e o número da linha 82 igual ao do `wc -l`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 253 — `AGENTS.md`: corrigir o nome do workflow de contexto (`contexto.yml` → `contexto-ia.yml`)

**Onda / Severidade / Camada:** 8 / Baixa / documentação
**Achados resolvidos:** H-03 (item 5)
**Problema hoje:** `AGENTS.md:103` manda ler o contexto gerado por "`.github/workflows/contexto.yml`". O
arquivo não existe: `ls .github/workflows/` lista **`contexto-ia.yml`**. Um agente que tente abrir o
workflow citado conclui que a automação não existe.
**Causa raiz:** o workflow foi renomeado e a referência ficou.
**Caminho recomendado:** troque o nome na linha 103. Em seguida, **procure a mesma referência errada no
resto do repositório** antes de fechar a etapa — `grep -rn "workflows/contexto.yml" . --exclude-dir=node_modules
--exclude-dir=.git` — porque `docs/agentes/contexto-ia.md` e `docs/agentes/mapa-repo.md` citam a mesma
automação e podem repetir o erro. Corrija todas as ocorrências na mesma PR: é o mesmo defeito, não é churn.
**Atalho tentador a evitar:** criar um `contexto.yml` que chame o `contexto-ia.yml` para "não quebrar o
link". Workflow novo é mudança de CI por um erro de digitação em documento.
**Arquivos e objetos a tocar:** `AGENTS.md:103` e as ocorrências que o `grep` mostrar em `docs/agentes/`
**Não tocar / armadilhas:** se a correção entrar em `docs/agentes/*.md`, o required check
**"Agents Docs Integrity"** também vigia esses arquivos (cada um deve continuar com ≥50% do tamanho da
base) — rode `node scripts/ci/check-claude-md-integrity.mjs` antes da PR. Não edite a branch `contexto`
(ver etapa 265).
**Depende de:** — · **Libera:** 254
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "workflows/contexto\.yml" . --exclude-dir=node_modules --exclude-dir=.git || echo "nenhuma ocorrência"
ls .github/workflows/contexto-ia.yml
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
```

Esperado: "nenhuma ocorrência", o arquivo existe, `exit=0`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 254 — Propagar as correções de H-03 para `docs/agentes/github-ci.md` e `docs/agentes/deploy.md`

**Onda / Severidade / Camada:** 8 / Média / documentação-CI
**Achados resolvidos:** H-03
**Problema hoje:** `AGENTS.md:50` manda "detalhe em `docs/agentes/github-ci.md`" e `:88` manda ler
`docs/agentes/deploy.md` ao confirmar deploy. Depois das etapas 249-253 o `AGENTS.md` diz 10 checks, repo
público e deploy automático — e os documentos de detalhe, que são onde o agente vai buscar o "como", podem
continuar dizendo o contrário. Divergência entre regra e detalhe é pior que o erro original: o agente
escolhe o que lhe convém.
**Causa raiz:** regra e detalhe mantidos em arquivos diferentes, sem verificação de coerência.
**Caminho recomendado:** leia os dois arquivos e corrija **apenas** as afirmações que as etapas 249-253
tornaram divergentes: número e nomes dos required checks, `strict=false`, visibilidade do repositório,
gatilho do `deploy-functions.yml`. Para cada correção, cite a fonte no próprio texto
(`scripts/ci/github-settings-baseline.json:22-33` para os checks,
`.github/workflows/deploy-functions.yml:9-13` para o deploy). Comece rodando
`grep -n "9 required\|privado\|manual\|workflow_dispatch\|strict" docs/agentes/github-ci.md docs/agentes/deploy.md`
para achar os pontos sem ler 2 arquivos inteiros. **Atalho tentador a evitar:** reescrever os dois
documentos "de uma vez, já que estou aqui". Eles têm conteúdo correto e extenso; o required check
"Agents Docs Integrity" reprova encolhimento acima de 50% por arquivo, e o dono não pediu reescrita.
**Arquivos e objetos a tocar:** `docs/agentes/github-ci.md`, `docs/agentes/deploy.md` (apenas as linhas
divergentes)
**Não tocar / armadilhas:** não toque nos outros quatro `docs/agentes/*.md` (`banco.md`,
`integracoes.md`, `mapa-repo.md`, `regras-dominio.md`) a menos que o `grep` mostre a mesma divergência —
e, se mostrar, corrija e diga no corpo da PR. Rode
`node scripts/ci/check-claude-md-integrity.mjs` antes da PR.
**Depende de:** 249, 250, 251, 253 · **Libera:** 255
**Risco e como reverter:** nenhum risco funcional. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (documentação de CI/deploy para agentes)
**Como verificar:**

```bash
grep -n "required\|privado\|público\|automático\|workflow_dispatch" docs/agentes/github-ci.md docs/agentes/deploy.md
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
```

Esperado: nenhuma linha dizendo 9 checks, repo privado ou deploy só manual; `exit=0`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 255 — Fazer a CI conferir os fatos verificáveis que o `AGENTS.md` afirma

**Onda / Severidade / Camada:** 8 / Média / CI
**Achados resolvidos:** H-03
**Problema hoje:** as cinco divergências de H-03 existiram por meses porque **nada as mede**. O check
`Agents Docs Integrity` (`scripts/ci/check-claude-md-integrity.mjs`) verifica só que o arquivo existe, tem
os oito títulos obrigatórios e não encolheu — não verifica se o que está escrito é verdade. Já existe o
baseline de settings (`scripts/ci/github-settings-baseline.json`) e já existe
`.github/workflows/settings-guard.yml`, então metade do mecanismo está pronta.
**Causa raiz:** integridade verificada, veracidade não.
**Caminho recomendado:** acrescente ao `check-claude-md-integrity.mjs` (ou a um script irmão em
`scripts/ci/`, se preferir não inflar o existente) três conferências **locais, sem rede**: (1) o número de
required checks citado no `AGENTS.md` é igual a
`required_status_checks.length` de `scripts/ci/github-settings-baseline.json`; (2) a contagem de migrations
citada é igual a `ls supabase/migrations/*.sql | wc -l`; (3) todo caminho de workflow citado no `AGENTS.md`
existe em `.github/workflows/`. Siga o estilo do arquivo atual: uma função por conferência, mensagem única e
acionável, `exit 1` na primeira falha. **Atalho tentador a evitar:** chamar a API do GitHub dentro do gate.
O check roda em toda PR, inclusive de fora; depender de rede e de token o deixa intermitente e ele será
desligado. Compare com o baseline versionado — quem cuida de o baseline refletir o GitHub é o
`settings-guard.yml`, que já existe.
**Arquivos e objetos a tocar:** `scripts/ci/check-claude-md-integrity.mjs` (acréscimo) ou novo script em
`scripts/ci/`, e `package.json` se criar script npm
**Não tocar / armadilhas:** não altere as conferências que já existem (títulos obrigatórios, limiar de
encolhimento de 30%/50%, exigência de `@AGENTS.md` no `CLAUDE.md`) — são o que impede outra sessão de
esvaziar as regras. Mexer em `scripts/` aciona **"Contratos da automação local"**: rode
`npm run automation:test`. E atenção à ordem: esta etapa só passa **depois** das 249 e 252, senão o gate
nasce vermelho na própria `main`.
**Depende de:** 249, 252, 253, 254 · **Libera:** —
**Risco e como reverter:** gate novo pode travar PRs (inclusive as deste plano) se uma conferência estiver
errada. Mitigação: rode o script contra a `main` já corrigida e cole a saída no corpo da PR. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (toca script de CI usado por required check)
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
npm run automation:test 2>&1 | tail -20
```

Esperado: `exit=0` na árvore corrigida e `exit=1` se você trocar temporariamente o "10" do `AGENTS.md` por
"9" (faça o teste, desfaça e registre as duas saídas).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 256 — `docs/prod-readiness.md`: corrigir as duas contagens de paridade que caducaram

**Onda / Severidade / Camada:** 8 / Alta / documentação
**Achados resolvidos:** H-04
**Problema hoje:** o documento mais recente e mais confiável do repositório (`:3` — "Fechamento: 2026-11-14
· main `fee186d3`") afirma paridade que já não existe: `:25` — "`GET /functions` → 43 ACTIVE; local **44
dirs**; diff API↔local = **0**", quando `ls -d supabase/functions/*/ | wc -l` devolve **45** (44 funções +
`_shared`), porque `push-send/` entrou em 2026-11-22 (`d37ba30`); e `:31` — "**OK** migrations banco 243 =
repo 243 (0 de diferença)", quando o repo tem **248**.
**Causa raiz:** retrato de paridade sem mecanismo que o invalide quando a árvore muda.
**Caminho recomendado:** mantenha a estrutura e o verbo do documento (que é bom: cada item tem prova de
comando) e faça duas coisas em cada linha: rebaixe o selo de `**OK**` para `**CADUCO (2026-11-23)**` e
escreva o número de hoje ao lado do número antigo, com o comando que o produziu. **Não escreva "diff = 0"
sem ter medido:** o valor do lado da API (quantas funções estão ACTIVE em produção) só o painel do Supabase
ou a Management API informa, e isso não é legível do repositório — então escreva o lado local e marque o
lado da API como **não verificado nesta etapa**, apontando a etapa 257. **Atalho tentador a evitar:**
atualizar os números para "43 → 44" e devolver o selo `OK`. Se você não consultou a API, a paridade continua
desconhecida; `OK` sem medição é exatamente o defeito que o achado descreve.
**Arquivos e objetos a tocar:** `docs/prod-readiness.md:25`, `:31`
**Não tocar / armadilhas:** `:9` ("61 rotas") foi reconferido e **está correto**
(`grep -c "path=" src/App.tsx` = 61) — não mexa. Não toque nas seções de workflows e crons: não foram
remedidas.
**Depende de:** — · **Libera:** 257
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
ls -d supabase/functions/*/ | wc -l; ls supabase/migrations/*.sql | wc -l
grep -c 'path=' src/App.tsx
sed -n '23,33p' docs/prod-readiness.md
```

Esperado: 45 diretórios, 248 migrations, 61 rotas; as duas linhas corrigidas citam esses números e o selo
caduco.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 257 — Fazer o inventário semanal recontar a paridade e datar o `prod-readiness`

**Onda / Severidade / Camada:** 8 / Média / CI
**Achados resolvidos:** H-04
**Problema hoje:** a paridade do `docs/prod-readiness.md` é medida à mão numa sessão e envelhece em
silêncio — foi assim que "diff = 0" sobreviveu à entrada de `push-send/` e a cinco migrations. Existe o
workflow `.github/workflows/inventario-estado-semanal.yml`, que já roda sozinho e já produz inventário: é o
lugar natural para a recontagem.
**Causa raiz:** afirmação de paridade sem produtor automático.
**Caminho recomendado:** **leia o workflow antes de propor qualquer coisa** e veja o que ele já publica
(pode ser que boa parte da recontagem exista). Acrescente ao que ele gera três números locais e baratos:
diretórios em `supabase/functions/` (menos `_shared`), arquivos em `supabase/migrations/`, e rotas em
`src/App.tsx`; e faça o relatório dizer a data da coleta. Se a comparação com produção (API de functions e
migrations do banco) exigir `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_URL`, **não** a implemente aqui: declare a
dependência e deixe para depois das etapas 263-266, que é onde o segredo do banco é tratado.
**Atalho tentador a evitar:** criar um workflow novo para isso. Já são 17 em `.github/workflows/`; um
produtor a mais para três contagens é custo recorrente de CI sem dono.
**Arquivos e objetos a tocar:** `.github/workflows/inventario-estado-semanal.yml` e/ou o script que ele
chama (confira qual é antes)
**Não tocar / armadilhas:** mexer em workflow é mudança de CI → **PR fica aberta para o dono**. Se o script
chamado estiver em `scripts/`, o required check **"Contratos da automação local"** entra em jogo: rode
`npm run automation:test`. Não faça o job escrever em `main` sem o dono aprovar o padrão de commit
automático.
**Depende de:** 256 · **Libera:** —
**Risco e como reverter:** job que falha pinta a CI de vermelho semanalmente. Teste a lógica localmente e
cole a saída na PR. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (workflow/CI)
**Como verificar:** rode localmente os comandos que o job passa a executar e cole a saída; depois do merge,
dispare o workflow uma vez (`workflow_dispatch`, se houver) e confirme no run que as três contagens saem
corretas e datadas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 258 — Rebaixar o enquadramento de "perfeição 10/10" nos dois documentos que o declaram

**Onda / Severidade / Camada:** 8 / Média / documentação
**Achados resolvidos:** H-05
**Problema hoje:** `docs/PERFEICAO_10_10.md:3` declara "Estado de **Perfeição Técnica Absoluta (10/10)**
atingido, sustentado e blindado end-to-end em todas as camadas" (o documento data de 2026-07-12, `:57`), e
`docs/RELATORIO_PERFEICAO_FINAL.md:3` fala de "estado de arte definitivo", sem data nenhuma. As afirmações
**concretas** dos dois se sustentam (a rota `/admin/db-health` existe em `src/App.tsx:174`, as RPCs
`get_top_queries_fast` e `get_cron_jobs_status` existem, o `RUNBOOK_DB_PERFORMANCE.md` e os ADRs 0009-0014
existem) — nenhuma foi refutada. O problema é só o enquadramento: "perfeição absoluta" convive com
`.warning-budget.json` em 105 avisos, cujo próprio `$comment` diz que a dívida está _"congelada, não paga"_.
**Causa raiz:** documento de celebração de sprint com nome e tom de certificado permanente.
**Caminho recomendado:** uma inserção em cada arquivo, depois do título: declare (a) a data do fechamento
(2026-07-12 no primeiro; "sem data declarada" no segundo), (b) que o documento descreve **o que foi
entregue naquelas sprints**, não o estado presente, (c) uma linha de contraponto verificável — "em
2026-11-23 o orçamento de avisos de lint estava em 105/105 e a auditoria `docs/qa/` registrou 15 achados de
higiene" — e (d) o ponteiro para `docs/qa/03-ACHADOS.md`. Mantenha o corpo intacto: ele é o registro do que
foi feito. **Atalho tentador a evitar:** auditar as 33 sprints do documento para marcar item por item. Nada
foi refutado; o que engana é o título e a primeira linha, e é só isso que esta etapa resolve.
**Arquivos e objetos a tocar:** `docs/PERFEICAO_10_10.md` (após o título), `docs/RELATORIO_PERFEICAO_FINAL.md`
(após o título)
**Não tocar / armadilhas:** não apague nem renomeie os arquivos, e não altere `.warning-budget.json` aqui —
quem mexe nele são as etapas 267-269 e a 299; alterar nas duas pontas gera conflito.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
sed -n '1,10p' docs/PERFEICAO_10_10.md; sed -n '1,10p' docs/RELATORIO_PERFEICAO_FINAL.md
node -e "console.log(require('./.warning-budget.json').lintWarnings)"
```

Esperado: os dois arquivos abrem com o bloco de enquadramento e a data; o número do orçamento citado no
bloco bate com o do arquivo no dia em que você escreveu.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 259 — `docs/MELHORIAS.md`: corrigir o hook que nunca existiu e a contagem de edge functions

**Onda / Severidade / Camada:** 8 / Média / documentação
**Achados resolvidos:** H-06
**Problema hoje:** o arquivo abre com o aviso certo (`:3` — "**ATENCAO**: este documento pode descrever
funcionalidades NAO implementadas"), mas quem chega por busca cai no meio e lê erro verificável:
`:25` — a tabela "Hooks Reais Implementados" diz `useAnalytics → **useAnalyticsReal**`, e
`grep -rn "useAnalyticsReal" src/` devolve **zero**; o hook real é `src/hooks/analytics/useAnalytics.tsx`.
E `:14` diz "Edge Functions | 1"; são **44** (45 diretórios, um é `_shared`).
**Causa raiz:** o aviso de validade protege quem entra pelo começo; não protege a tabela.
**Caminho recomendado:** corrija as duas linhas no lugar: em `:25`, substitua `useAnalyticsReal` pelo
caminho real `src/hooks/analytics/useAnalytics.tsx` com a marca `(corrigido 2026-11-23; `useAnalyticsReal`
nunca existiu)`; em `:14`, troque `1` por `44` com o comando que mede
(`ls -d supabase/functions/*/ | wc -l` menos `_shared`). Depois, **rode o mesmo `grep` para os outros nomes
da coluna "Real"** da tabela de `:20-30` — se um deles também não existir, corrija na mesma PR: é o mesmo
defeito. **Atalho tentador a evitar:** confiar no aviso do alto e não corrigir ("já está marcado como
possivelmente errado"). O aviso diz "pode estar errado"; o achado diz "está errado nesta linha". Deixar é
escolher que o próximo agente procure um hook que não existe.
**Arquivos e objetos a tocar:** `docs/MELHORIAS.md:14`, `:25` (e as demais linhas da tabela que o `grep`
reprovar)
**Não tocar / armadilhas:** não remova o bloco `ATENCAO` de `:3` nem o ponteiro para
`docs/audit/2026-11-20_funcionalidades_nao_implementadas.md` — é a fonte autoritativa declarada. Não toque
em `src/`.
**Depende de:** — · **Libera:** 260
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn "useAnalyticsReal" src/ docs/MELHORIAS.md || echo "sem ocorrência em src/"
ls -d supabase/functions/*/ | wc -l; sed -n '14p;25p' docs/MELHORIAS.md
```

Esperado: nenhuma ocorrência de `useAnalyticsReal` em `src/`; a linha 25 cita o hook real; a linha 14 cita
44 e o comando.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 260 — `docs/PLANO_MELHORIAS_2026.md`: corrigir a árvore de hooks que cita `useAnalyticsReal`

**Onda / Severidade / Camada:** 8 / Baixa / documentação
**Achados resolvidos:** H-06
**Problema hoje:** o arquivo também abre com o aviso correto (`:3`) e logo abaixo diz
"Status: 39/39 itens concluídos ✅" (`:6`), com uma árvore de arquivos em `:65` que lista
`useAnalyticsReal.tsx` — arquivo que não existe (mesma prova da etapa 259). Um agente que leia a árvore
conclui que o hook foi entregue e procura onde ele está.
**Causa raiz:** a mesma da 259; o erro foi copiado entre os dois documentos.
**Caminho recomendado:** corrija a entrada da árvore para o caminho real
(`src/hooks/analytics/useAnalytics.tsx`) e acrescente ao lado do "39/39 itens concluídos" de `:6` a data da
última atualização que o próprio arquivo declara (`:5` — 2026-03-14) mais a marca de que o número **não foi
reconferido** nesta auditoria. Depois rode
`grep -oE "use[A-Za-z]+\.tsx?" docs/PLANO_MELHORIAS_2026.md | sort -u` e confira cada nome com
`find src -name "<nome>"`; corrija as que não existirem e deixe a lista das não localizadas no corpo da PR.
**Atalho tentador a evitar:** mudar "39/39 concluídos" para outro número. Você não mediu os 39 itens; o
honesto é datar e marcar como não reconferido, igual fazem os seis `docs/PLANO_*_ETAPAS.md`, que são o bom
padrão do repositório (H-08).
**Arquivos e objetos a tocar:** `docs/PLANO_MELHORIAS_2026.md:6`, `:65` (e as demais linhas de árvore que o
`grep` reprovar)
**Não tocar / armadilhas:** não remova o bloco `ATENCAO` de `:3`. Não toque em `src/`.
**Depende de:** 259 · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n "useAnalyticsReal" docs/PLANO_MELHORIAS_2026.md || echo "corrigido"
sed -n '5,7p;63,67p' docs/PLANO_MELHORIAS_2026.md
```

Esperado: nenhuma ocorrência de `useAnalyticsReal`; o cabeçalho traz data e a marca de não reconferido.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 261 — `TEMPLATE_STRUCTURE.md`: parar de ensinar hook na raiz de `src/hooks/`

**Onda / Severidade / Camada:** 8 / Baixa / documentação
**Achados resolvidos:** H-07
**Problema hoje:** `TEMPLATE_STRUCTURE.md` (35 KB, 1421 linhas) é guia para **criar um projeto novo**, não
descrição deste — e manda criar `src/hooks/usePagination.ts` (`:658`), `useFilters.ts` (`:708`),
`useSorting.ts` (`:749`), `useDebounce.ts` (`:805`), `useLocalStorage.ts` (`:827`) e `useAuth.tsx` (`:873`)
**na raiz** de `src/hooks/`. Isso contraria o ADR 0008, que organiza hooks por domínio — e é onde os
arquivos de verdade estão: `src/hooks/common/useDebounce.ts`, `src/hooks/auth/useAuth.tsx`. Um agente que
siga o template cria hook na raiz e quebra a convenção.
**Causa raiz:** template escrito antes do ADR 0008 e nunca reconciliado.
**Caminho recomendado:** duas mudanças pequenas. (1) Um bloco após o título dizendo, em uma frase, que este
arquivo é **molde para projeto novo**, que **neste repositório** vale o ADR 0008 (hooks por domínio), e
apontando `docs/adr/0008-*`. (2) Nos seis títulos de seção citados, troque o caminho pelo caminho por
domínio (`### src/hooks/common/usePagination.ts` e assim por diante), escolhendo o domínio pelo que já
existe na árvore — confira com `ls src/hooks/` antes de escolher, não adivinhe. **Atalho tentador a evitar:**
corrigir só o bloco do alto e deixar os seis títulos. Quem usa um template de 1421 linhas copia a seção, não
o preâmbulo.
**Arquivos e objetos a tocar:** `TEMPLATE_STRUCTURE.md` (bloco após o título e os seis títulos de seção)
**Não tocar / armadilhas:** não altere o **código de exemplo** dentro dos blocos ` ```typescript `;
ele não precisa casar com o deste repositório. Se a etapa 248 já estiver valendo, os caminhos de exemplo
deste arquivo podem reprovar o novo gate — por isso 248 declara isenção por marca e este arquivo **não**
deve entrar na lista declarada do gate (é molde, não descrição).
**Depende de:** — · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
ls src/hooks/
grep -n "^### src/hooks/" TEMPLATE_STRUCTURE.md
sed -n '1,10p' TEMPLATE_STRUCTURE.md
```

Esperado: nenhum título `### src/hooks/<arquivo>` direto na raiz (todos com subpasta de domínio) e o bloco
de enquadramento citando o ADR 0008.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 262 — `PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md`: corrigir "43 edge functions" para 44

**Onda / Severidade / Camada:** 8 / Baixa / documentação
**Achados resolvidos:** H-08
**Problema hoje:** `docs/PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md:3` diz "43 edge functions e webhooks". São
**44** (`ls -d supabase/functions/*/ | wc -l` = 45, menos `_shared`). É a **única** imprecisão dos seis
`docs/PLANO_*_ETAPAS.md` — eles declaram commit-base, método, "Estado: plano. Nenhuma etapa executada" e uma
seção "Não verificado", e são o bom padrão do repositório.
**Causa raiz:** contagem feita antes da entrada de `push-send/` (2026-11-22, `d37ba30`); o plano tem base
`b9ee6d1` (`:10`).
**Caminho recomendado:** troque 43 por 44 **sem** apagar a base de código declarada: escreva
"44 edge functions (43 na base `b9ee6d1` deste plano; `push-send` entrou em `d37ba30`)". O plano é um
documento datado e honesto — a correção deve preservar essa honestidade, não fingir que o número sempre foi 44. **Atalho tentador a evitar:** revisar as 190 etapas do plano procurando outras contagens. O achado H-08
diz explicitamente que os seis planos são honestos e **não** são o problema; auditar 190 etapas é o tipo de
etapa que vira faxina e abandona o plano (regra 4 das instruções ao executor).
**Arquivos e objetos a tocar:** `docs/PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md:3`
**Não tocar / armadilhas:** não mexa nos outros cinco `docs/PLANO_*_ETAPAS.md` — foram conferidos e estão
corretos. Não altere as linhas `:10` (base de código) nem `:13` (Estado: plano) nem `:14` (Não verificado).
**Depende de:** — · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
ls -d supabase/functions/*/ | grep -vc '_shared/'
sed -n '1,6p' docs/PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md
```

Esperado: o `grep -vc` devolve 44 e a linha 3 diz 44, mantendo a menção à base `b9ee6d1`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 263 — Pedir ao dono o secret `SUPABASE_DB_URL`, sem o qual a fonte de contexto do banco nunca é gerada

**Onda / Severidade / Camada:** 8 / Alta / infraestrutura
**Achados resolvidos:** H-09
**Problema hoje:** `docs/contexto/00-INDEX.md` (branch `contexto`) manda, na "Ordem de leitura antes de
qualquer tarefa", consultar o **banco real** como item 2 — e a linha desse item diz
`docs/contexto/supabase/` **"(ainda não existe — o produtor não rodou)"**, estado **"ainda não gerado"**.
Confirmado: `git ls-tree -r origin/contexto -- docs/contexto` lista só `codigo/` e `regras/`. A causa está
escrita no próprio repositório: `scripts/supabase_snapshot/README.md` — _"**Precisa do secret
`SUPABASE_DB_URL`, que ainda não existe.** Enquanto ele não for criado, o job `banco` do `contexto-ia.yml`
sai **verde com aviso** e a pasta `docs/contexto/supabase/` fica vazia"_ — e o workflow faz exatamente isso
em `.github/workflows/contexto-ia.yml:237-243`. O `SUPABASE_ACCESS_TOKEN` que já existe serve à Management
API, **não** à introspecção do Postgres.
**Causa raiz:** o produtor da fonte "banco" depende de um secret que nunca foi criado, e falha em silêncio
verde.
**Caminho recomendado:** peça ao dono para criar o secret de Actions `SUPABASE_DB_URL` com a string de
conexão do projeto **oficial** `jvfhclubfpxrtrrazrgr` (Supabase → Project Settings → Database → Connection
string; preferir o usuário de menor privilégio que consiga ler os catálogos, como manda
`scripts/supabase_snapshot/README.md` — **leia o README inteiro antes de pedir**, ele diz qual conexão o
coletor espera). Explique ao dono, em uma linha, o que isso compra: todo agente passa a ter o estado real do
banco antes de agir, que é a camada onde errar custa mais. **Atalho tentador a evitar:** gerar o snapshot da
sua máquina e commitar na branch `contexto`. Essa branch é gerada por automação e **não se edita à mão**
(ver etapa 265); um snapshot commitado a mão vira a mentira mais convincente do repositório, porque está no
lugar certo.
**Arquivos e objetos a tocar:** nenhum (etapa de verificação e registro)
**Não tocar / armadilhas:** **nunca** escreva o valor da string de conexão em arquivo, commit, PR ou
anotação — a senha do banco está dentro dela. Registre apenas "criado" / "ausente", data e quem confirmou.
O workflow já tem guarda contra segredo vazado na saída (`:247-252`); não a desligue.
**Depende de:** — · **Libera:** 264, 266
**Risco e como reverter:** nenhum (não há mudança de código). O risco é do lado do dono: uma string de
conexão em secret de Actions fica disponível a workflows do repositório, que é **público** (etapa 250) —
diga isso a ele explicitamente, e que o usuário do banco deve ser de leitura.
**Precisa de aprovação humana antes do merge:** sim (segredo e acesso ao banco de produção)
**Como verificar:** anotação em `05-PROGRESSO.md` dizendo "criado" ou "ausente", com data e quem confirmou,
e o nome exato do secret (`SUPABASE_DB_URL`). Se criado, confirme a existência sem ler o valor:

```bash
gh secret list --repo adm01-debug/Loggi_Flow_V2 | grep SUPABASE_DB_URL
```

Esperado: a linha do secret aparece (o valor nunca é exibido).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 264 — Rodar o produtor do contexto de banco e confirmar que `docs/contexto/supabase/` foi publicado

**Onda / Severidade / Camada:** 8 / Alta / ferramentas de contexto
**Achados resolvidos:** H-09
**Problema hoje:** mesmo com o secret criado, a pasta só aparece quando o job `banco` roda e publica. O
workflow roda a cada hora no minuto 7 (`.github/workflows/contexto-ia.yml`, `schedule: '7 * * * *'`) e em
push na `main` que toque os caminhos declarados — e só comita quando algo muda. Até a primeira coleta
concluir, a fonte dona do fato "banco" continua inexistente e o protocolo continua apontando para o vazio.
**Causa raiz:** produtor nunca executado com sucesso.
**Caminho recomendado:** dispare o workflow manualmente (`workflow_dispatch`) e acompanhe o job `banco`.
Atenção ao desenho que já está no código: **no dispatch manual, a ausência do secret faz o job falhar de
propósito** (`:242` — `if [ "$EVENTO" = "workflow_dispatch" ]; then exit 1; fi`), justamente para a pessoa
ver — então o dispatch é o teste certo. Depois do run verde, confirme o conteúdo publicado e leia
`manifest.json` (campos `gerado_em`, `erros`, `carried`) e `errors.md`, como manda
`scripts/supabase_snapshot/README.md`: **uma coleta recente pode ser parcial**, e coleta parcial anunciada
como completa recria o problema de F-01. Registre em `05-PROGRESSO.md` a data da coleta e se houve erro.
**Atalho tentador a evitar:** ligar `PGDUMP`/`GEN_TYPES`. O README explica por que estão desligados — o
runner do GitHub tem `pg_dump` 16 e o projeto roda PG 17; ligar quebra o job.
**Arquivos e objetos a tocar:** nenhum (execução e registro)
**Não tocar / armadilhas:** não edite a branch `contexto` nem abra PR dela. Se o job falhar por permissão do
usuário do banco, **pare** e registre o erro exato — não contorne trocando para um usuário mais poderoso
sem o dono.
**Depende de:** 263 · **Libera:** 265, 295
**Risco e como reverter:** o job pode expor dados do banco na branch pública — mas a guarda de segredo do
workflow (`:247-252`) já cobre credenciais. Se a saída trouxer dado sensível além de esquema, **avise o dono
antes de qualquer coisa**.
**Precisa de aprovação humana antes do merge:** não (mas depende da 263, que é do dono)
**Como verificar:**

```bash
git fetch origin contexto
git ls-tree -r --name-only origin/contexto -- docs/contexto/supabase | head
git show origin/contexto:docs/contexto/supabase/manifest.json | head -30
git show origin/contexto:docs/contexto/00-INDEX.md | sed -n '1,20p'
```

Esperado: a pasta existe com `README.md`, `tables/`, `lints.md` e `manifest.json`; o `manifest.json` traz
`gerado_em` recente e `erros` vazio; e a linha do "banco real" no `00-INDEX.md` deixou de dizer
"ainda não gerado".
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 265 — Dizer ao agente o que fazer quando a fonte do banco não existir

**Onda / Severidade / Camada:** 8 / Alta / documentação-protocolo
**Achados resolvidos:** H-09
**Problema hoje:** o protocolo manda ler `docs/contexto/supabase/` como item 2 e **não diz o que fazer
quando essa pasta não está lá**. O resultado, medido nesta auditoria, é o agente voltar para
`docs/contexto/codigo/banco.json`, que é exatamente onde está o falso positivo de F-01 ("36 tabelas sem
RLS", quando ao menos 32 têm). `AGENTS.md:82-83` também cita "a fonte `supabase/` da branch `contexto`" como
se ela existisse.
**Causa raiz:** protocolo sem caminho alternativo declarado para a fonte mais importante.
**Caminho recomendado:** acrescente ao `AGENTS.md`, na seção **Banco**, uma frase de fallback explícita:
_se `docs/contexto/supabase/` não existir ou o `manifest.json` acusar erro, **consulte o banco pelo MCP
`SUPABASE - LOGGI FLOW V2 - MCP`** (somente leitura para diagnóstico) e **não** use
`docs/contexto/codigo/banco.json` como fonte de RLS ou de existência de objeto — ele não modela índice nem
DDL dinâmico_. Repita o mesmo em `docs/agentes/contexto-ia.md` e `docs/agentes/banco.md`, que são os
detalhes citados pelo `AGENTS.md`. Esta etapa vale **mesmo que a 264 tenha dado certo**: a pasta pode voltar
a ficar velha (o próprio `00-INDEX.md` publica a idade de cada fonte). **Atalho tentador a evitar:** tirar o
item 2 da ordem de leitura "porque não existe". A fonte é a certa; o que falta é o plano B.
**Arquivos e objetos a tocar:** `AGENTS.md` (seção `## Banco`), `docs/agentes/contexto-ia.md`,
`docs/agentes/banco.md`
**Não tocar / armadilhas:** o required check **"Agents Docs Integrity"** vigia `AGENTS.md` **e cada**
`docs/agentes/*.md` (≥50% do tamanho da base por arquivo, oito títulos obrigatórios no `AGENTS.md`,
`@AGENTS.md` dentro do `CLAUDE.md`) — rode `node scripts/ci/check-claude-md-integrity.mjs` antes da PR.
**Não edite a branch `contexto` e não abra PR dela**: ela é regerada por
`.github/workflows/contexto-ia.yml` e qualquer edição manual é sobrescrita (ou, pior, sobrevive e passa a
mentir). O texto do `00-INDEX.md` vem de `scripts/regras_negocio/indice.py`; se quiser mudar o que o índice
diz, mude o produtor, não o produto — e isso é mudança de automação, com aprovação do dono.
**Depende de:** 264 · **Libera:** —
**Risco e como reverter:** nenhum risco funcional. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (altera regra de protocolo no `AGENTS.md` e em `docs/agentes/`)
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
grep -n "banco.json\|MCP\|fallback\|não existir" AGENTS.md docs/agentes/banco.md docs/agentes/contexto-ia.md | head -20
```

Esperado: `exit=0` e, nos três arquivos, a instrução de fallback citando o MCP do banco e a ressalva sobre
`banco.json`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 266 — Fazer a ausência do snapshot do banco parar de sair verde em silêncio

**Onda / Severidade / Camada:** 8 / Média / CI
**Achados resolvidos:** H-09
**Problema hoje:** `.github/workflows/contexto-ia.yml:237-243` trata a ausência de `SUPABASE_DB_URL` como
aviso: imprime `::warning::`, marca `SNAPSHOT_SKIPPED=1` e **sai 0** no agendamento (falha só no
`workflow_dispatch`). O comentário do topo do arquivo (`:9`) declara isso como "nao-e-bug". A decisão é
defensável — 144 runs/dia de vermelho não ajudam ninguém —, mas o efeito observado é que a fonte mais
importante ficou meses sem existir e **nenhum sinal chegou a ninguém**: o próprio arquivo diz, em `:5`,
que o workflow "avisa: ninguem".
**Causa raiz:** falha silenciosa por desenho, sem nenhum canal de aviso de longa duração.
**Caminho recomendado:** **não** troque o `exit 0` por `exit 1` no agendamento — isso só troca silêncio por
ruído diário. Em vez disso, torne o estado visível onde o agente já é obrigado a olhar: faça o passo de
publicação escrever, quando `SNAPSHOT_SKIPPED=1`, um `docs/contexto/supabase/README.md` mínimo na branch
`contexto` dizendo **"fonte ausente: falta o secret `SUPABASE_DB_URL` — ver scripts/supabase_snapshot/README.md"**
com a data, de modo que o `00-INDEX.md` (montado por `scripts/regras_negocio/indice.py` a partir dos
manifests) passe a mostrar a causa em vez de só "ainda não gerado". Se isso exigir mudar o produtor do
índice, **pare e proponha ao dono** em vez de inventar formato: o índice tem contrato com os manifests.
Alternativa aceitável e mais simples: manter o aviso e fazer o job falhar **uma vez por dia** (no primeiro
run do dia), não a cada 10 minutos. Escolha uma das duas e justifique na PR.
**Atalho tentador a evitar:** trocar o `exit 0` por `exit 1` no agendamento. São 144 runs por dia; uma CI
vermelha todo dia por um estado conhecido é desligada ou ignorada em uma semana, e o silêncio volta — só que
agora com um workflow quebrado por cima.
**Arquivos e objetos a tocar:** `.github/workflows/contexto-ia.yml` (passo "Gerar supabase/" e o passo de
publicação) e, se necessário, `scripts/supabase_snapshot/README.md`
**Não tocar / armadilhas:** não remova a guarda de segredo (`:247-252`) nem o `if: env.SNAPSHOT_SKIPPED != '1'`
que a condiciona. Não mexa nos jobs `codigo/` e `regras/`: eles funcionam e publicam. Mexer em workflow é
mudança de CI → **PR fica aberta para o dono**. Se tocar `scripts/`, o required check
**"Contratos da automação local"** entra: rode `npm run automation:test`.
**Depende de:** 263 · **Libera:** —
**Risco e como reverter:** um erro aqui pode derrubar o workflow que alimenta as três fontes de contexto de
todos os agentes. Faça a mudança no menor escopo possível, dispare uma vez e confira o run antes de pedir
merge. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (workflow/CI)
**Como verificar:** dispare o workflow com o secret ausente e confirme que o estado aparece onde o protocolo
manda ler:

```bash
git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md | grep -i "banco real" -A2
```

Esperado: a linha do banco real deixa de dizer apenas "ainda não gerado" e passa a dizer a causa e a data.
Registre também o link do run.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 267 — **FAÇA ISTO PRIMEIRO (1/3)** — abrir margem no orçamento de lint: `SortIcon` nas três telas de cadastro

**Onda / Severidade / Camada:** 0 / Alta (destrava o plano) / interface
**Achados resolvidos:** H-10
**Problema hoje:** `npm run lint:budget` devolve `[OK] ESLint warnings 105 / 105` — **no teto exato** — e o
check "Warning Budget Gate" é um dos 10 required. Qualquer etapa deste plano que introduza **um** aviso
reprova a CI e empurra o executor para fora do escopo. **Esta etapa e as 268-269 vêm antes de todas as
outras**, inclusive das de segurança: sem margem, a primeira etapa que gerar um aviso trava o plano e o dono
recebe um pedido de decisão no meio da execução.
O aviso mais repetido e mais barato de pagar é `react-hooks/static-components`: um componente definido
dentro do componente pai, recriado a cada render. O caso canônico é o `SortIcon`, declarado dentro da página
e usado três vezes: `src/pages/Clientes.tsx:398` (definição) usado em `:696`, `:704`, `:712`;
`src/pages/Fornecedores.tsx:579`, `:587`, `:595`; `src/pages/FretesInternos.tsx:498`, `:506`, `:514`. São
**9 avisos** só nessas três telas.
**Causa raiz:** o ícone de ordenação fecha sobre `getSortDirection` do escopo da página, então foi declarado
dentro dela.
**Caminho recomendado:** crie **um** componente de módulo em `src/components/common/SortIcon.tsx` que receba
a direção já resolvida por propriedade — `{ dir }: { dir: "asc" | "desc" | null }` — e devolva
`ArrowUpDown` / `ChevronUp` / `ChevronDown` exatamente como o corpo atual de `Clientes.tsx:398-406` faz. Nas
três páginas, apague a definição local e troque cada uso por `<SortIcon dir={getSortDirection("<campo>")} />`.
A direção continua sendo calculada pela página; só a renderização sai de lá. Confira que `getSortDirection`
tem a mesma assinatura nas três (ele vem do mesmo hook de ordenação) antes de generalizar.
**Atalho tentador a evitar:** silenciar com `// eslint-disable-next-line react-hooks/static-components`. O
aviso continua pago mas a dívida fica, e o próximo agente copia o `disable`. Igualmente tentador e igualmente
errado: **subir o orçamento**. O `AGENTS.md:67-69` exige decisão do dono para subir, e subir esconde dívida
nova dentro da velha.
**Arquivos e objetos a tocar:** `src/components/common/SortIcon.tsx` (novo), `src/pages/Clientes.tsx`,
`src/pages/Fornecedores.tsx`, `src/pages/FretesInternos.tsx`
**Não tocar / armadilhas:** **não** mexa no `FormFields` dessas mesmas páginas (`Clientes.tsx:921`, `:948`;
`Fornecedores.tsx:780`, `:806`; `FretesInternos.tsx:694`, `:721`), que também é `static-components`: ele
fecha sobre o estado do formulário e hoistá-lo muda o ciclo de vida do formulário — é mudança de
comportamento, não pagamento de aviso. **E não rode `npm run lint:budget:ratchet` nesta etapa**: o ratchet
baixa o orçamento até o número atual, o que devolve você ao teto e destrói a margem que acabou de criar. A
margem é consumida pelas etapas seguintes e o ratchet final é a etapa 299. Essas três páginas também são
tocadas pelas etapas de D-01 (049-052) e D-02 (053-058) — **faça esta antes delas** para não conflitar.
**Depende de:** — · **Libera:** 268, e toda etapa que possa gerar aviso (ou seja, o plano inteiro)
**Risco e como reverter:** risco visual nas três listagens (ícone de ordenação). `git revert` da PR.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx eslint src/pages/Clientes.tsx src/pages/Fornecedores.tsx src/pages/FretesInternos.tsx src/components/common/SortIcon.tsx
npm run lint:budget
npx tsc --noEmit; echo "exit=$?"
```

Esperado: nenhum `react-hooks/static-components` nos arquivos listados; o orçamento continua `[OK]` e o
total de avisos cai de 105 para **96**; typecheck 0. Registre o número exato — ele é a prova da margem.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 268 — **FAÇA ISTO PRIMEIRO (2/3)** — usar o `SortIcon` compartilhado nas outras sete telas

**Onda / Severidade / Camada:** 0 / Alta (destrava o plano) / interface
**Achados resolvidos:** H-10
**Problema hoje:** o mesmo `SortIcon` local está repetido em sete outros arquivos, somando **14 avisos**
`react-hooks/static-components`: `src/pages/Transportadoras.tsx:985`, `:993`;
`src/pages/Envios.tsx:744`, `:752`; `src/pages/Ocorrencias.tsx:511`, `:519`;
`src/pages/AlertasCusto.tsx:429`, `:437`; `src/pages/LojaRecompensas.tsx:325`, `:333`;
`src/components/audit/AuditTrailViewer.tsx:226`, `:234`;
`src/components/freight/FreightTableManager.tsx:489`, `:497`.
**Causa raiz:** o mesmo componente foi copiado tela a tela em vez de extraído.
**Caminho recomendado:** reuse o `src/components/common/SortIcon.tsx` criado na etapa 267 — não crie um
segundo. Em cada arquivo: apague a definição local, importe o compartilhado, troque os usos por
`dir={getSortDirection("<campo>")}`. Faça **um arquivo por vez** e rode o `eslint` daquele arquivo antes de
passar ao próximo; se em algum deles a função de direção tiver outro nome ou outro retorno (por exemplo
devolver `"ASC"` maiúsculo), **adapte na chamada, não no componente** — o componente compartilhado tem um
contrato só. **Atalho tentador a evitar:** mudar a propriedade do componente compartilhado para `field` e
fazê-lo buscar a direção de um contexto novo. Isso é arquitetura nova para pagar aviso de lint; a
propriedade resolvida mantém o componente burro e reutilizável.
**Arquivos e objetos a tocar:** os sete arquivos citados
**Não tocar / armadilhas:** não mexa nos `FormFields` de `Transportadoras.tsx:875` e `:1238` (mesma razão da
etapa 267). `FreightTableManager.tsx` é padrão de referência de D-01 (`:600`, `:616`, `ConfirmDialog`) e
`AuditTrailViewer.tsx` aparece em outros achados — toque **só** o `SortIcon`. **Não rode o ratchet aqui**
(ver etapa 267).
**Depende de:** 267 · **Libera:** 269
**Risco e como reverter:** risco visual em sete telas. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx eslint src/pages/Transportadoras.tsx src/pages/Envios.tsx src/pages/Ocorrencias.tsx src/pages/AlertasCusto.tsx src/pages/LojaRecompensas.tsx src/components/audit/AuditTrailViewer.tsx src/components/freight/FreightTableManager.tsx
npm run lint:budget
grep -rn "const SortIcon" src/ | grep -v 'src/components/common/SortIcon.tsx' || echo "nenhuma definição local restante"
```

Esperado: nenhum `static-components` nesses arquivos; total de avisos cai de 96 para **82**; nenhuma
definição local de `SortIcon` fora do componente compartilhado.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 269 — **FAÇA ISTO PRIMEIRO (3/3)** — pagar os seis avisos do Dashboard Executivo e registrar a margem reservada

**Onda / Severidade / Camada:** 0 / Alta (destrava o plano) / interface + CI
**Achados resolvidos:** H-10
**Problema hoje:** faltam seis avisos `react-hooks/static-components` fáceis: `src/pages/DashboardExecutivo.tsx`
define e usa `KPIStatus` (`:527`, `:555`, `:573`) e `GrowthIndicator` (`:541`, `:619`) dentro da página, e
`src/components/predictions/MitigationHistoryPanel.tsx:176` usa um `DeltaIcon` local. São componentes
puramente apresentativos — recebem valor e devolvem marcação.
E falta **baixar o orçamento**, que é o que o `AGENTS.md:67-69` pede e autoriza sem o dono: depois das
etapas 267-269 o repositório fica com ~**76 avisos reais** contra um teto de **105**.
**Causa raiz:** componentes de apresentação declarados dentro da página (mesmo defeito das 267-268) e
orçamento congelado no teto, sem margem declarada para trabalho novo.
**Caminho recomendado:** duas partes. (1) Mova `KPIStatus` e `GrowthIndicator` para o nível de módulo no
próprio `DashboardExecutivo.tsx` (acima do componente da página), passando por propriedade tudo que eles
leem hoje do escopo (`kpis.otifRate`, `kpis.targetOtif`, `kpis.freteGrowth`, `kpis.entregasGrowth` já são
passados; confirme se não há mais nada). Faça o mesmo com o `DeltaIcon` de `MitigationHistoryPanel.tsx`. Se
algum deles usar hook, **não** mova — hoistar componente que chama hook muda a ordem de hooks; registre no
progresso e deixe o aviso. (2) **Baixe o orçamento**, deixando margem: meça os avisos reais, e escreva em
`.warning-budget.json` o valor **medido + 10** (se a medição der 76, escreva `"lintWarnings": 86`), nunca
mais que 105. Baixar é bem-vindo e não precisa do dono; **subir exige decisão dele** e esconderia dívida
nova dentro da velha — se em algum momento você precisar subir, **pare e chame o dono**. Registre no campo
`$comment` a frase: _"2026-11-23: etapas 267-269 de `docs/qa/04-PLANO.md` pagaram N avisos
`react-hooks/static-components`; teto baixado de 105 para M, com ~10 de margem reservada para a execução do
plano. O ratchet final (teto = contagem real) é a etapa 299."_ `lintErrors` e `tsErrors` continuam 0.
**Atalho tentador a evitar:** rodar `npm run lint:budget:ratchet` **agora**. O script baixa o teto até a
contagem exata do momento (`scripts/ratchet-warning-budget.mjs`), ou seja, devolve você a 76/76 — teto outra
vez, com a dívida paga e **zero** margem, que é o pior dos dois mundos. Use o ratchet no fim (etapa 299),
quando não houver mais etapa para gerar aviso.
**Arquivos e objetos a tocar:** `src/pages/DashboardExecutivo.tsx`,
`src/components/predictions/MitigationHistoryPanel.tsx`, `.warning-budget.json` (só o `$comment`)
**Não tocar / armadilhas:** `lintErrors` e `tsErrors` continuam **0** — não os altere em nenhuma hipótese;
não toque em `scripts/check-warning-budget.mjs` nem em `scripts/ratchet-warning-budget.mjs`; não toque em
`eslint.config.js` (rebaixar regra a `off` é esconder dívida, e o `$comment` do orçamento registra que o
rebaixamento a _warning_ foi uma decisão anterior documentada). `.warning-budget.json` é lido pelo required
check "Warning Budget Gate" — um JSON inválido reprova toda PR do repositório; valide com
`node -e "require('./.warning-budget.json')"`.
**Depende de:** 268 · **Libera:** todo o resto do plano
**Risco e como reverter:** risco visual no Dashboard Executivo. `git revert`.
**Precisa de aprovação humana antes do merge:** não (baixar o teto é autorizado pelo `AGENTS.md:67-69`; se
em algum momento a correção exigir **subir** o teto, **pare** e chame o dono)
**Como verificar:**

```bash
npx eslint src/pages/DashboardExecutivo.tsx src/components/predictions/MitigationHistoryPanel.tsx
npm run lint:budget
npx eslint . -f json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log('avisos reais:',JSON.parse(s).reduce((a,f)=>a+f.messages.filter(m=>m.severity===1).length,0)))"
node -e "const b=require('./.warning-budget.json');console.log(b.lintWarnings,b.lintErrors,b.tsErrors)"
```

Esperado: `[OK]` no gate; "avisos reais" por volta de **76**; `lintWarnings` baixado para ~**86** (medido+10)
e `0 0` nos outros dois. Anote em `05-PROGRESSO.md` os dois números — teto e contagem real. **A diferença
entre eles é a margem de execução do plano; não a gaste em refatoração não pedida.**
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 270 — Remover as três entradas obsoletas da allowlist de vulnerabilidades

**Onda / Severidade / Camada:** 8 / Baixa / CI
**Achados resolvidos:** H-11
**Problema hoje:** `npm run security-scan` passa **e avisa**: `⚠️ Allowlist sem efeito para: xlsx, vite,
picomatch — remova a entrada em scripts/audit-gate.mjs`. A allowlist está em `scripts/audit-gate.mjs:19`
(`const ALLOWLIST = new Set(["xlsx", "vite", "picomatch"]);`) e o aviso é emitido em `:118`. Hoje
`npm audit --json` devolve **zero** vulnerabilidades em todas as severidades — as três entradas perdoam algo
que já não existe. Uma allowlist obsoleta pode, no futuro, perdoar uma vulnerabilidade **nova** nesses
mesmos pacotes sem ninguém notar.
**Causa raiz:** advisories resolvidos a montante (upgrade de dependência) sem a limpeza correspondente da
isenção.
**Caminho recomendado:** rode `npm audit --json` **primeiro** e confirme o zero no seu dia — se houver
vulnerabilidade, pare: o cenário mudou e a entrada pode estar ativa de novo. Confirmado o zero, remova os
três nomes do `Set` em `:19`, deixando `new Set([])`. **Preserve os comentários `:6-18`** (que explicam o
caso de `xlsx` fora do registro npm, as CVEs de dev-server do `vite` e a cadeia de 31 pacotes que puxa
`picomatch`) convertendo-os em um bloco de histórico, com a data da remoção: eles são a memória de por que a
isenção existiu e serão necessários se o advisory voltar. **Atalho tentador a evitar:** apagar os
comentários junto. O custo de reconstruir essa análise é alto, e o próximo agente que vir o gate vermelho
em `picomatch` vai precisar exatamente dela.
**Arquivos e objetos a tocar:** `scripts/audit-gate.mjs` (linha 19 e o bloco de comentários 6-18)
**Não tocar / armadilhas:** não mexa na lógica de `rootsOf`/`justifications` (`:64-97`) — ela resolve
advisory transitivo e é o que faz o gate funcionar; mexer ali sem advisory ativo para testar é mudança cega.
Mexer em `scripts/` aciona o required check **"Contratos da automação local"**: rode
`npm run automation:test`.
**Depende de:** — · **Libera:** —
**Risco e como reverter:** se um advisory voltar nesses pacotes, o gate passa a reprovar PRs — que é o
comportamento desejado, mas pode travar o plano. Por isso guarde os comentários: reintroduzir a entrada é
uma linha. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (altera gate de segurança da CI)
**Como verificar:**

```bash
npm audit --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).metadata.vulnerabilities))"
npm run security-scan
npm run automation:test 2>&1 | tail -20
```

Esperado: todas as severidades em 0; o `security-scan` passa **sem** o aviso de allowlist sem efeito; os
testes de automação passam.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 271 — Remover o arquivo `x` vazio versionado na raiz

**Onda / Severidade / Camada:** 8 / Baixa / repositório
**Achados resolvidos:** H-12
**Problema hoje:** `git ls-files` lista um arquivo chamado `x` na raiz; `wc -c x` devolve **0 bytes**. Ele
entrou no commit `0f32426` ("fix: torna mapa de rotas e rastreamento em tempo real honestos (#242)"),
claramente sobra de um redirecionamento de shell. Além do lixo, é sinal de que **nenhum gate de PR barra
arquivo acidental** (ver etapa 273).
**Causa raiz:** `> x` num comando, seguido de `git add` amplo.
**Caminho recomendado:** apague o arquivo no commit da branch. Antes, confirme que ninguém o referencia:
`grep -rn "\bx\b" --include='*.json' --include='*.yml' --include='*.mjs' . --exclude-dir=node_modules --exclude-dir=.git`
é ruidoso demais para servir; o que vale é conferir que ele está vazio e que nenhum script o abre pelo nome
(`grep -rn "'x'\|\"x\"" scripts/ .github/ | grep -i "readFile\|open\|cat"`). Com 0 bytes e nenhuma
referência, a remoção é segura. Pela regra de escrita do repositório, use o MCP
**`GITHUB - MCP - FOREVER`** (`github_push_files` aceita `files` + `delete` no mesmo commit) na branch que
**você** criou. **Atalho tentador a evitar:** aproveitar a PR para "limpar a raiz" de outros arquivos. O
achado foi explícito: `git ls-files` filtrado por `.bak|.orig|.rej|.tmp|.log|.DS_Store|.swp|~` devolve
**apenas** `x`; o resto da raiz é configuração legítima.
**Arquivos e objetos a tocar:** `x` (remoção)
**Não tocar / armadilhas:** não toque em `bun.lock`/`bun.lockb` nesta etapa (é a 272, e é decisão do dono).
Não mexa no `.gitignore` aqui.
**Depende de:** — · **Libera:** 273
**Risco e como reverter:** nenhum (arquivo vazio). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
git ls-files | grep -x 'x' || echo "removido"
test -e x && echo "AINDA EXISTE" || echo "ausente no disco"
```

Esperado: "removido" e "ausente no disco".
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 272 — Decidir com o dono o destino de `bun.lock` e `bun.lockb`

**Onda / Severidade / Camada:** 8 / Baixa / repositório
**Achados resolvidos:** H-12
**Problema hoje:** `bun.lock` (423 KB) e `bun.lockb` (199 KB) estão versionados e **nenhum workflow usa
bun**: o único "bun" real em `.github/workflows/` é um comentário em `types-sync.yml:366` dizendo que _"o
bun.lock deste repo esta defasado do package.json"_. A CI usa npm (`npm ci`, `package-lock.json`, Node 20),
como o próprio `AGENTS.md:86-88` afirma. São 622 KB de arquivos de dependências que **mentem**, prontos para
um agente tomar como fonte e resolver versão errada.
**Causa raiz:** o repositório nasceu no Lovable com bun e migrou para npm sem remover os locks antigos.
**Caminho recomendado:** **não decida sozinho** — remover arquivo de lock é decisão de ferramenta do dono, e
alguém pode usar `bun install` localmente. Leve a ele as três informações e uma recomendação: (a) nenhum
workflow os usa; (b) o `types-sync.yml:366` registra que estão defasados; (c) o `AGENTS.md` já diz para não
tratá-los como fonte. Recomende a remoção dos dois e a inclusão de `bun.lock`/`bun.lockb` no `.gitignore`,
para não voltarem. Se o dono quiser manter, a alternativa é regenerá-los junto com o `package-lock.json` —
mas isso cria uma segunda fonte de verdade para sempre, e é bom dizer isso. Deixe a PR **aberta** com a
remoção pronta e a justificativa no corpo. **Atalho tentador a evitar:** rodar `bun install` para
"atualizar" os locks. Isso introduz resolução de dependências diferente da do `package-lock.json` e pode
mudar o que o build empacota.
**Arquivos e objetos a tocar:** `bun.lock`, `bun.lockb` (remoção), `.gitignore` (duas linhas)
**Não tocar / armadilhas:** **não** toque em `package-lock.json` — é a fonte da CI (`npm ci`). Não altere o
comentário de `types-sync.yml:366` nesta etapa; ele deixa de fazer sentido depois da remoção e é a etapa
274 que o resolve junto com o `AGENTS.md`.
**Depende de:** — · **Libera:** 274
**Risco e como reverter:** quem usa bun localmente perde o lock e passa a resolver versões por conta. É
exatamente por isso que a decisão é do dono. `git revert` restaura os dois arquivos.
**Precisa de aprovação humana antes do merge:** sim (deleção de arquivo de dependências e mudança de
ferramenta)
**Como verificar:**

```bash
grep -rn "bun" .github/workflows/ package.json | grep -v ubuntu
git ls-files | grep -E '^bun\.lock'
```

Esperado: a única menção a bun é o comentário de `types-sync.yml:366`; depois do merge aprovado, o
`git ls-files` não lista mais os dois arquivos e `npm ci && npm run build` continua funcionando (registre a
saída).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 273 — Barrar arquivo acidental na raiz antes do merge

**Onda / Severidade / Camada:** 8 / Baixa / CI
**Achados resolvidos:** H-12
**Problema hoje:** um arquivo chamado `x`, vazio, atravessou PR, 10 required checks e merge em `main`
(commit `0f32426`) sem ninguém notar. Não há nenhuma verificação que recuse arquivo não declarado na raiz.
**Causa raiz:** ausência de lista do que pode existir na raiz.
**Caminho recomendado:** **a forma mais barata primeiro**: acrescente ao `.gitignore` os padrões óbvios
(`*.bak`, `*.orig`, `*.rej`, `*.tmp`, `*.log`) se ainda não estiverem, e veja se isso já resolve — o
`.gitignore` atual já cobre `*.sw?`, `__pycache__/` e outros, então siga o estilo e a organização por
comentário de seção que ele usa. Só depois considere o gate: um script `scripts/ci/check-root-files.mjs`
com **lista de permissão** dos arquivos de raiz (hoje: configurações legítimas) que reprove qualquer novo,
no estilo de `scripts/ci/check-claude-md-integrity.mjs` (ESM, `process.chdir` pela URL do módulo, mensagem
única, `exit 1`). Gere a lista inicial com `git ls-files --no-recurse` (ou `git ls-files | grep -v /`) e
**revise-a item a item** antes de versionar. **Atalho tentador a evitar:** um gate que reprove por extensão
desconhecida. A raiz deste repositório tem dezenas de arquivos de configuração legítimos
(`.warning-budget.json`, `components.json`, `eslint.config.js`, `playwright.config.ts`, `vitest.config.ts`,
`tsconfig*.json`…); lista de permissão explícita é a única forma que não gera falso positivo semanal.
**Arquivos e objetos a tocar:** `.gitignore` e, se o dono aprovar o gate,
`scripts/ci/check-root-files.mjs` (novo) + `package.json` + o workflow que o hospedar
**Não tocar / armadilhas:** não remova linhas existentes do `.gitignore` — várias são comentadas e
explicam decisões (`graphify-out/`, `.husky/post-commit`, `/.tools/...`). Mexer em `scripts/` aciona
**"Contratos da automação local"** (`npm run automation:test`); mexer em workflow é CI → PR aberta para o
dono. Rode a etapa **depois** da 271 e da 272, senão a lista de permissão nasce com `x` e os locks de bun
dentro dela.
**Depende de:** 271, 272 · **Libera:** —
**Risco e como reverter:** gate novo pode reprovar PRs legítimas que criem arquivo de raiz. Mitigação: a
mensagem de falha deve dizer **como** declarar o arquivo novo na lista. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (cria gate de CI / toca workflow)
**Como verificar:**

```bash
node scripts/ci/check-root-files.mjs; echo "exit=$?"
: > zz-teste-acidental && node scripts/ci/check-root-files.mjs; echo "exit=$?"; rm -f zz-teste-acidental
npm run automation:test 2>&1 | tail -20
```

Esperado: `exit=0` na árvore limpa, `exit=1` com o arquivo acidental presente (e a mensagem citando o nome),
`exit=0` de novo após remover. Registre as três saídas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 274 — Tirar do `AGENTS.md` e do `types-sync.yml` a menção aos locks de bun

**Onda / Severidade / Camada:** 8 / Baixa / documentação
**Achados resolvidos:** H-12
**Problema hoje:** `AGENTS.md:86-88` diz "`bun.lock` e `bun.lockb` existem no repo e **não** são usados por
nenhum workflow — não os trate como fonte". A frase está **correta hoje** e passa a estar **errada** no
instante em que a etapa 272 for aprovada e mergeada: o agente vai procurar arquivos que não existem e ficar
em dúvida sobre qual é a fonte. O mesmo vale para o comentário de
`.github/workflows/types-sync.yml:366`, que explica usar npm porque "o bun.lock deste repo esta defasado".
**Causa raiz:** regra escrita descrevendo um estado transitório.
**Caminho recomendado:** **só execute esta etapa depois que a 272 estiver mergeada** — se o dono decidir
manter os locks, esta etapa não existe (registre isso em `05-PROGRESSO.md` e siga adiante). Com a remoção
feita: no `AGENTS.md`, troque a frase por uma afirmação simples e durável — _"**npm** é o gerenciador: `npm
ci`, `package-lock.json`, Node 20. Não existe outro arquivo de lock no repositório."_; no
`types-sync.yml:366`, reduza o comentário a "npm, como o resto da CI" sem a justificativa que deixou de
existir. **Atalho tentador a evitar:** deixar a frase antiga "por segurança". Documentação que fala de
arquivo inexistente é o defeito central do grupo H inteiro — não crie um caso novo.
**Arquivos e objetos a tocar:** `AGENTS.md:86-88`, `.github/workflows/types-sync.yml:366`
**Não tocar / armadilhas:** o required check **"Agents Docs Integrity"** vigia o `AGENTS.md` (oito títulos
obrigatórios, limiar de encolhimento) — rode `node scripts/ci/check-claude-md-integrity.mjs`; como você está
**removendo** texto, confira o limiar com atenção. Tocar um workflow faz desta uma mudança de CI → **PR
aberta para o dono** (e ele já estará envolvido pela 272). Não mexa em mais nada do `types-sync.yml`.
**Depende de:** 272 · **Libera:** —
**Risco e como reverter:** nenhum risco funcional (comentário e documento). `git revert`.
**Precisa de aprovação humana antes do merge:** sim (toca `AGENTS.md` e workflow)
**Como verificar:**

```bash
node scripts/ci/check-claude-md-integrity.mjs; echo "exit=$?"
grep -rn "bun" AGENTS.md .github/workflows/ | grep -v ubuntu || echo "nenhuma menção restante"
git ls-files | grep -E '^bun\.lock' || echo "locks ausentes"
```

Esperado: `exit=0`, nenhuma menção a bun fora de "ubuntu", e os locks já ausentes (prova de que a 272 foi
mergeada antes).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 275 — Criar a base de teste de hook e de tela que hoje não existe

**Onda / Severidade / Camada:** 8 / Alta / testes
**Achados resolvidos:** H-13
**Problema hoje:** `docs/contexto/codigo/testes.json` (campo `sem_teste`) registra **61 de 61 telas** sem
teste (100%) e **172 de 178 arquivos de hook** sem teste (96,6%). Os 130 arquivos de teste existentes se
concentram em utilitários (`src/lib/**`, 28 arquivos de teste dentro de `src/`) e nas suítes de
`tests/{contracts,fuzzing,integration,load,security,unit}`. Consequência: `npx vitest run` dá confiança
sobre utilitário e **nenhuma** sobre criar coleta, mover status ou cotar frete — e é por isso que toda etapa
deste plano traz comando de verificação em vez de "rode os testes". Falta a peça comum: um jeito de
renderizar hook que usa TanStack Query e um jeito de simular `supabase.from(...)`.
**Causa raiz:** não há utilitário de teste compartilhado, então cada teste de hook custa escrever a
infraestrutura de novo — e ninguém escreve.
**Caminho recomendado:** crie dois arquivos pequenos em `src/test/` (pasta que já existe e já é excluída da
cobertura em `vitest.config.ts`): (1) `src/test/renderWithQuery.tsx`, exportando um wrapper com
`QueryClientProvider` e um `QueryClient` novo por teste com `retry: false` — é o que falta para `renderHook`
funcionar com os hooks de dados; (2) `src/test/supabaseMock.ts`, um duplo encadeável que responda a
`from().select().eq().order()` e devolva `{ data, error, count }` controlados pelo teste, para ser usado com
`vi.mock("@/integrations/supabase/client", ...)`. **Copie o estilo que já funciona no repositório:**
`src/hooks/logistics/useRuleTriggers.test.tsx` (usa `renderHook` + `vi.mock` de dependência por caminho
`@/...`) e `src/hooks/common/useBulkActions.test.ts`; e respeite o `src/test/setup.ts`, que já instala
`matchMedia`, `IntersectionObserver` e `ResizeObserver` e roda `cleanup()` após cada teste.
**Atalho tentador a evitar:** instalar MSW ou qualquer biblioteca nova de mock de rede. O `AGENTS.md`
restringe dependência nova ao indispensável; os hooks chamam o cliente Supabase, não `fetch` — mockar o
cliente é mais direto e mais fiel.
**Arquivos e objetos a tocar:** `src/test/renderWithQuery.tsx` (novo), `src/test/supabaseMock.ts` (novo)
**Não tocar / armadilhas:** não altere `src/test/setup.ts` (vale para a suíte inteira, 130 arquivos) nem
`vitest.config.ts` nesta etapa — os pisos de cobertura são mexidos só na etapa 284. Cuidado com a contagem de
avisos: arquivos novos entram no `eslint .`; se o duplo do Supabase exigir `any`, prefira `unknown` com
conversão explícita, porque `@typescript-eslint/no-explicit-any` é um dos avisos do orçamento.
**Depende de:** 269 · **Libera:** 276, 277, 278, 280, 281, 282
**Risco e como reverter:** nenhum risco em produção (só arquivos de teste). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/hooks/logistics/useRuleTriggers.test.tsx src/hooks/common/useBulkActions.test.ts 2>&1 | tail -15
npx eslint src/test/renderWithQuery.tsx src/test/supabaseMock.ts
npm run lint:budget
```

Esperado: os testes existentes continuam passando (prova de que o `setup.ts` não foi afetado), os dois
arquivos novos passam no lint e o orçamento continua `[OK]`. Escreva um teste mínimo de fumaça usando as
duas peças e mostre-o verde.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 276 — Teste da validação de transição de status (trava a correção de C-01)

**Onda / Severidade / Camada:** 8 / Crítica / testes
**Achados resolvidos:** H-13, C-01
**Problema hoje:** a única validação de transição do sistema é um objeto no front com **3 saltos** para um
enum de **10 valores** (`src/pages/Despachos.tsx:95-99`), e nada no banco valida mudança de status (C-01).
As etapas 028-037 levam essa regra para o banco. Sem teste, a primeira PR que mexer em status derruba a
correção e ninguém percebe: hoje **nenhuma** das 61 telas tem teste.
**Causa raiz:** regra de negócio sem especificação executável.
**Caminho recomendado:** teste **a tabela de transições, não a tela**. As etapas de C-01 extraem a regra para
um módulo compartilhado; escreva `src/lib/<modulo-de-transicoes>.test.ts` cobrindo quatro famílias de caso,
uma asserção por caso: (a) cada transição **permitida** do fluxo real
(`aguardando_producao → pronto_despacho → cotacao_frete → nf_emitida → despachado → em_transito →
saiu_entrega → entregue → finalizado`) devolve válido; (b) **salto** (`pronto_despacho → entregue`) devolve
inválido; (c) **retrocesso** (`entregue → despachado`) devolve inválido; (d) o caso que o negócio mais
teme — `nf_emitida → despachado` **sem** `nf_remessa` — devolve inválido, porque hoje essa regra só existe
como `!item.nf_remessa` na tela (`Despachos.tsx:240`) e um `PATCH` direto grava igual. Repita a estrutura
para `coleta_status` (7 valores), que hoje **não tem objeto equivalente em lugar nenhum**. Use
`describe`/`it.each` e nomes de teste em português, como os testes existentes
(`src/lib/validations.test.ts` é o padrão mais próximo).
**Atalho tentador a evitar:** testar a tela `Despachos.tsx` com `render` e cliques. A tela é a camada que o
usuário controla e que o achado diz ser insuficiente; teste a regra onde ela passa a morar. E **não** teste
o trigger do banco a partir do vitest: isso exige banco ao vivo (ver etapa 283).
**Arquivos e objetos a tocar:** `src/lib/<modulo-de-transicoes>.test.ts` (novo; o nome exato é o do módulo
criado nas etapas 028-037)
**Não tocar / armadilhas:** se as etapas 028-037 **ainda não** foram executadas, não há módulo para testar:
**pare, registre em `05-PROGRESSO.md` e volte a esta etapa depois** (regra 2 das instruções ao executor).
Não altere `src/pages/Despachos.tsx` aqui. Confirme os valores reais do enum em
`src/integrations/supabase/types.ts` antes de escrever a lista — inventar valor de enum produz teste verde
que não prova nada.
**Depende de:** 275, 028-037 · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/lib/ 2>&1 | tail -20
```

Esperado: os casos novos passam; e, invertendo de propósito uma asserção (salto passando a "válido"), o
teste **falha** — faça esse teste negativo e registre as duas saídas. Sem isso você não sabe se o teste
mede algo.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 277 — Teste da checagem de `count` no controle de concorrência (trava a correção de C-03)

**Onda / Severidade / Camada:** 8 / Alta / testes
**Achados resolvidos:** H-13, C-03
**Problema hoje:** em Supabase, `.update()` **sem** `{ count: "exact" }` não informa quantas linhas mudaram
e não devolve erro quando o filtro de versão não casa: zero linhas é indistinguível de sucesso. Hoje só
`src/pages/KanbanEntregas.tsx:300-319` confere (`if (count === 0) throw new Error("Conflito de versão...")`);
`src/pages/Despachos.tsx:203-208`, `:264` e `src/hooks/logistics/useBoxManagement.tsx:139-145` não conferem —
e o do BOX ainda grava `kanban_history` (`:148-154`) como se a alocação tivesse ocorrido. As etapas 044-048
propagam o padrão. Sem teste, a propagação regride na primeira refatoração.
**Causa raiz:** o caminho de conflito nunca foi exercitado — é justamente o caminho que não acontece no uso
normal.
**Caminho recomendado:** escreva o teste onde a regra mora depois da correção. Para
`useBoxManagement`, crie `src/hooks/logistics/useBoxManagement.test.ts` com o duplo da etapa 275 e **dois**
casos: (a) o duplo devolve `{ count: 1, error: null }` → a mutação resolve e `kanban_history` **é** gravado;
(b) o duplo devolve `{ count: 0, error: null }` → a mutação **rejeita** com a mensagem de conflito e
`kanban_history` **não é** gravado (asserção sobre o espião de `insert`, não só sobre o erro — é esse o dano
descrito no achado). Para `Despachos.tsx`, se a correção de 044-048 extrair a mutação para hook, teste o
hook do mesmo jeito; se ela ficar na página, teste a função de mutação exportada e **registre no progresso**
que a tela em si segue sem teste. **Atalho tentador a evitar:** afirmar o conflito mandando `version + 1` do
front no teste. O achado é explícito: o banco incrementa `version` pelo trigger
`tr_increment_version_entregas`; mandar versão do cliente é redundante e dá a falsa impressão de que o front
controla a versão.
**Arquivos e objetos a tocar:** `src/hooks/logistics/useBoxManagement.test.ts` (novo) e o teste do caminho
de `Despachos`, conforme a forma que 044-048 deixaram
**Não tocar / armadilhas:** não altere o código de produção nesta etapa; se o teste revelar que a correção
de 044-048 está incompleta, **registre como achado novo** em `05-PROGRESSO.md` e não conserte aqui (regra 4).
Não toque em `src/pages/KanbanEntregas.tsx`, que é o padrão de referência.
**Depende de:** 275, 044-048 · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/hooks/logistics/ 2>&1 | tail -20
```

Esperado: os dois casos passam, inclusive a asserção de que `kanban_history` não é gravado quando
`count === 0`. Registre a saída.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 278 — Teste da confirmação em exclusão em massa (trava a correção de D-01)

**Onda / Severidade / Camada:** 8 / Crítica / testes
**Achados resolvidos:** H-13, D-01
**Problema hoje:** `src/components/common/BulkActions.tsx:74` e `:95` disparam `action.onClick(selectedIds)`
no clique, sem confirmação; `variant: "destructive"` só muda a cor do botão. Três telas herdam o defeito
(`Clientes.tsx:725-729`, `Fornecedores.tsx:607-611`, `FretesInternos.tsx:536`) — é o caminho mais curto para
perda de dado no sistema. As etapas 049-052 põem o `ConfirmDialog` dentro do componente compartilhado. Como
é **um** componente protegendo **três** telas, um teste aqui vale por três.
**Causa raiz:** componente compartilhado nasceu sem o passo de confirmação e nada verifica isso.
**Caminho recomendado:** crie `src/components/common/BulkActions.test.tsx` com `render` +
`@testing-library/user-event` (já disponível, usado em `src/components/security/SecurityOverviewPanel.regression.test.ts`)
e três casos: (a) ação `variant: "destructive"` → clicar **abre o diálogo** e `onClick` **não** foi chamado;
(b) confirmar no diálogo → `onClick` chamado **uma vez**, com exatamente os `selectedIds` passados;
(c) cancelar → `onClick` **nunca** chamado. Cubra os **dois** caminhos do componente, porque o achado cita
os dois: o de até 3 ações (`:74`) e o do menu (`:95`). Faça também um caso (d) com ação **não** destrutiva,
para garantir que a confirmação não foi imposta a todas (regressão provável da correção).
**Atalho tentador a evitar:** testar isso pela tela `Clientes.tsx`. Além de muito mais custoso (a página
monta hooks de dados, layout e paginação), deixa as outras duas telas sem cobertura — e a próxima tela que
adotar o componente também. Teste o componente.
**Arquivos e objetos a tocar:** `src/components/common/BulkActions.test.tsx` (novo)
**Não tocar / armadilhas:** se as etapas 049-052 não foram feitas, o caso (a) **falha de propósito** — não
"ajuste" o teste para passar: pare, registre e volte depois. Não toque em
`src/components/freight/FreightTableManager.tsx` (`:600`, `:616`), que é o padrão de referência de
`ConfirmDialog`.
**Depende de:** 275, 049-052 · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run src/components/common/BulkActions.test.tsx 2>&1 | tail -20
```

Esperado: os quatro casos passam. Registre a saída e, no corpo da PR, diga explicitamente que o teste cobre
os dois caminhos (`:74` e `:95`).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 279 — Teste do fail-closed de assinatura de webhook (trava a correção de S-01)

**Onda / Severidade / Camada:** 8 / Crítica / testes
**Achados resolvidos:** H-13, S-01, S-05
**Problema hoje:** `supabase/functions/nexus-webhook-receiver/index.ts:37` envolvia a verificação HMAC em
`if (Deno.env.get("NEXUS_WEBHOOK_SECRET")) { ... }` — sem o segredo, o bloco era pulado e a requisição
seguia sem verificação alguma. A etapa 001 remove o `if`. Nada no repositório testa esse caminho: das 44
edge functions, só **3** têm teste (`scheduled-reports`, `ai-logistics-assistant`, `_shared/circuitBreaker`).
E merge em `supabase/functions/**` **publica em produção na hora** (H-03, etapa 251) — regressão aqui é
regressão em produção no mesmo minuto.
**Causa raiz:** o caminho de rejeição nunca foi exercitado; só o caminho feliz.
**Caminho recomendado:** teste primeiro o helper, que é compartilhado pelos 4 webhooks e não depende de
servidor: crie `supabase/functions/_shared/webhookSignature.test.ts` com três casos — segredo **ausente**
devolve `false` (é a garantia que o `if` removido tornava inútil, e já é o comportamento de `:13-17`);
assinatura **errada** devolve `false`; assinatura **correta** devolve `true`. Depois, no estilo de
`supabase/functions/scheduled-reports/index.test.ts` (`Deno.test`, `Deno.env.set`, `stub(globalThis,"fetch")`),
acrescente um teste de `nexus-webhook-receiver` que chame o `handler` com header de assinatura ausente e
espere **401**. Acrescente ainda o caso de S-05 nos dois webhooks de bypass: com `ALLOW_TEST_MODE` **não**
definido e header `x-test-mode: true`, a função deve **rejeitar** (`lalamove-webhook/index.ts:52-53`,
`rodonaves-webhook/index.ts:67-69`).
**Atalho tentador a evitar:** mockar `verifyWebhookHmac` no teste da função. Isso testa o `if` e não a
verificação — exatamente o erro que criou S-01. Use HMAC de verdade, com segredo de teste.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/webhookSignature.test.ts` (novo) e o teste do
receptor, no padrão Deno já existente
**Não tocar / armadilhas:** `_shared/webhookSignature.ts` **já está correto** e é usado pelos outros 3
webhooks — não o altere para facilitar o teste. Note que os testes de edge function do repositório são
`Deno.test` e o `vitest.config.ts` inclui `src/**` e `tests/**` — então `supabase/functions/**` **não** é
coletado pelo vitest: diga no corpo da PR como o teste é executado (`deno test`) e registre a saída, senão
ele nasce sem ninguém para rodá-lo.
**Depende de:** 001 · **Libera:** 280
**Risco e como reverter:** nenhum em produção (arquivos de teste). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
deno test -A supabase/functions/_shared/webhookSignature.test.ts 2>&1 | tail -20
grep -n 'verifyWebhookHmac' -A6 supabase/functions/nexus-webhook-receiver/index.ts
```

Esperado: os três casos do helper passam; o `grep` confirma a chamada **sem** `if (Deno.env.get(...))` em
volta. Se `deno` não estiver disponível no ambiente, a etapa fica **aberta** com esse motivo no progresso —
não troque a suíte de ferramenta por conta própria.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 280 — Teste da idempotência atômica dos webhooks (trava a correção de B-01)

**Onda / Severidade / Camada:** 8 / Crítica / testes
**Achados resolvidos:** H-13, B-01, B-02
**Problema hoje:** `supabase/functions/_shared/idempotency.ts:30` (`claimIdempotencyKey`) grava primeiro e
trata violação de unicidade (`23505`) como duplicata — atômico e correto. Dois webhooks o usam; os outros
dois reimplementaram "consulta e depois grava": `lalamove-webhook/index.ts:101-114` consulta e só marca em
`:189`, **depois** dos inserts de negócio (`:122`, `:145`, `:159`, `:178`); `rodonaves-webhook/index.ts:128-135`
e `:214-215` repetem o desenho. As etapas 132-137 trocam pelo helper. Transportadora reenviar evento é
comportamento **normal** dela — este é o caminho que mais vai acontecer e o que menos tem teste.
**Causa raiz:** TOCTOU no lugar de "grava primeiro e trata o conflito", sem teste do reenvio.
**Caminho recomendado:** teste o helper e o reenvio. (1) `supabase/functions/_shared/idempotency.test.ts`:
duplo do cliente que devolve `{ error: { code: "23505" } }` no `insert` → `claimIdempotencyKey` conclui
"duplicata" **sem** erro; `insert` bem-sucedido → "primeira vez"; erro **diferente** de `23505` →
propaga (não engole). (2) No teste do `lalamove-webhook` (padrão Deno da etapa 279), chame o `handler`
**duas vezes** com o mesmo `event_id` e assine as duas: a segunda deve responder "já processado" e **não**
chamar os inserts de negócio — conte as chamadas do duplo, não só o status da resposta, porque o dano do
achado é o **insert duplicado**, não a resposta. Cubra também B-02: `event_id` ausente **não** deve cair num
valor de reserva que anule a deduplicação.
**Atalho tentador a evitar:** testar com dois `await` em sequência e chamar isso de concorrência. A garantia
real é a restrição `UNIQUE(event_id, provider)`
(`supabase/migrations/20260513164426_...sql:44`) e o tratamento do `23505`; é isso que o teste deve
asseverar. Concorrência de verdade não se prova em vitest/deno test.
**Arquivos e objetos a tocar:** `supabase/functions/_shared/idempotency.test.ts` (novo) e o teste do
`lalamove-webhook`
**Não tocar / armadilhas:** não altere `_shared/idempotency.ts` — ele é o padrão correto. Não mexa em
`carrier-webhook-receiver/index.ts:128-135`, que é a referência. Mesma ressalva da etapa 279 sobre
`supabase/functions/**` não ser coletado pelo vitest.
**Depende de:** 279, 132-137 · **Libera:** —
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
deno test -A supabase/functions/_shared/idempotency.test.ts 2>&1 | tail -20
grep -n 'claimIdempotencyKey' supabase/functions/lalamove-webhook/index.ts supabase/functions/rodonaves-webhook/index.ts
```

Esperado: os casos do helper passam e o `grep` mostra os dois webhooks usando o helper (prova de que
132-137 foram feitas). Registre as saídas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 281 — Teste do caminho de criar coleta

**Onda / Severidade / Camada:** 8 / Alta / testes
**Achados resolvidos:** H-13
**Problema hoje:** criar coleta é a primeira jornada de negócio do sistema e **não tem um único teste** —
nem da tela (`/coletas`), nem do hook. `docs/qa/02-CENARIOS.md` registra que **nenhum cenário de escrita foi
executado** na auditoria, então o que se sabe desse caminho vem de leitura de código. Some-se R-05 (nenhuma
proteção verificada contra duplo clique em formulário de criação) e F-03 (a unicidade de `numero_coleta`,
gerado por trigger `BEFORE INSERT`, não pôde ser confirmada).
**Causa raiz:** a jornada principal nunca teve especificação executável.
**Caminho recomendado:** teste o **hook de coletas**, não a página — é onde a gravação mora e é o que outras
telas reusam. Crie o teste ao lado do hook (confirme o caminho real com
`ls src/hooks/*/ | grep -i coleta` antes; não adivinhe) usando `renderWithQuery` e o duplo da etapa 275, com
quatro casos: (a) **entrada válida** → `insert` chamado uma vez, com os campos obrigatórios, e cache
invalidado; (b) **campo obrigatório ausente** → rejeita **antes** de chamar o `insert` (se a validação não
existir, o teste revela isso: registre como achado novo, não conserte aqui); (c) **erro do banco**
(`{ error: { message } }`) → a mutação rejeita e o estado de erro fica disponível para a tela (é o que R-01
cobra); (d) **duplo envio** → o segundo disparo enquanto o primeiro está pendente **não** gera um segundo
`insert` (conte as chamadas do duplo). O caso (d) é o teste de R-05 e é o mais valioso: duplo clique em
criação é o defeito mais comum em formulário sem trava.
**Atalho tentador a evitar:** escrever teste de ponta a ponta com o Playwright para isso. O e2e precisa de
usuário semeado e não roda na CI (etapa 283); o que protege a correção em toda PR é o teste de unidade do
hook.
**Arquivos e objetos a tocar:** o arquivo de teste ao lado do hook de coletas (novo)
**Não tocar / armadilhas:** **não** teste a geração de `numero_coleta`: ela é feita por trigger no banco
(`20251215123841_...sql:202-203`) e um duplo não a exercita; a unicidade é F-03 e é verificada no banco
(etapa 295). Não altere o hook nesta etapa.
**Depende de:** 275 · **Libera:** 284
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
ls src/hooks/*/ | grep -i coleta
npx vitest run <caminho-do-teste-criado> 2>&1 | tail -20
```

Esperado: os quatro casos passam (ou o (b)/(d) falha e você registrou o achado novo em vez de "ajustar" o
teste). Registre a saída e diga quais casos passaram e quais revelaram lacuna.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 282 — Teste do caminho de mover entrega de status

**Onda / Severidade / Camada:** 8 / Alta / testes
**Achados resolvidos:** H-13, C-01, C-03
**Problema hoje:** mover entrega é a segunda jornada principal e acontece em duas telas com desenhos
diferentes: `src/pages/KanbanEntregas.tsx:300-319` (confere `count`, avisa o usuário — padrão correto) e
`src/pages/Despachos.tsx:203-208` (não confere, e `onSuccess` mostra "Movido para X" em `:225-229` mesmo com
zero linhas afetadas). A atualização vai **direto do navegador para a tabela**, sem edge function
intermediando. Nenhuma das duas telas tem teste.
**Causa raiz:** dois caminhos para a mesma operação, sem especificação que diga qual é o certo.
**Caminho recomendado:** depois das etapas de C-01 (028-037) e C-03 (044-048), escreva o teste da mutação de
status com quatro casos, usando o duplo da etapa 275: (a) transição **permitida** com `count: 1` → sucesso e
cache invalidado; (b) transição **proibida** → rejeita **sem** chamar o `update` (prova de que a validação
da etapa 276 está no caminho, não só no objeto); (c) `count: 0` → rejeita com a mensagem de conflito de
versão, **e a tela não mostra sucesso** (asserte que o retorno é erro, não que o toast apareceu); (d) erro
do banco → estado de erro disponível. Teste no mesmo lugar em que a correção deixou a mutação; se C-01 e
C-03 a extraíram para hook compartilhado entre Kanban e Despachos, **um** teste cobre as duas telas — e
dizer isso no corpo da PR é o que mostra o valor da correção.
**Atalho tentador a evitar:** escrever dois testes, um por tela, copiando o mesmo corpo. Se as duas telas
ainda têm mutações separadas depois de 044-048, isso é achado novo (a correção não unificou) — registre em
`05-PROGRESSO.md` em vez de duplicar o teste.
**Arquivos e objetos a tocar:** o arquivo de teste do hook/módulo de mutação de status (novo)
**Não tocar / armadilhas:** não toque em `KanbanEntregas.tsx` (padrão de referência) nem em `Despachos.tsx`.
Confirme os valores do enum `entrega_status` em `src/integrations/supabase/types.ts` antes de escrever os
casos.
**Depende de:** 275, 276, 277 · **Libera:** 284
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx vitest run <caminho-do-teste-criado> 2>&1 | tail -20
grep -n 'count: "exact"\|count:"exact"' src/pages/Despachos.tsx src/pages/KanbanEntregas.tsx
```

Esperado: os quatro casos passam e o `grep` mostra `count: "exact"` nos dois lugares (prova de que 044-048
foram feitas). Registre as saídas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 283 — Resolver o usuário semeado do `tests/e2e/` e dizer por que ele não roda na CI

**Onda / Severidade / Camada:** 8 / Média / testes + infraestrutura
**Achados resolvidos:** H-13
**Problema hoje:** existem duas suítes de ponta a ponta — `tests/e2e/critical-paths.spec.ts` e
`tests/e2e/dashboard.spec.ts` — e **elas não rodam na CI**: `npm run test:e2e` é `playwright test`, o
`playwright.config.ts` sobe `npm run dev` em `http://localhost:8080`, e os cenários exigem **usuário
semeado** com login válido. O `vitest.config.ts` exclui `tests/e2e` de propósito. Resultado: duas suítes
versionadas que ninguém executa, e **nenhuma** jornada de negócio verificada de ponta a ponta. Pior: não há
staging — semear usuário significa escrever **no banco de produção** `jvfhclubfpxrtrrazrgr`.
**Causa raiz:** suíte de ponta a ponta sem ambiente nem dado de teste definidos.
**Caminho recomendado:** separe o que é decisão do dono do que é trabalho seu. (1) **Documente o estado
real** em `tests/e2e/README.md` (novo): quais credenciais e quais registros as duas suítes exigem (leia os
dois arquivos e liste o que eles procuram em tela), que elas **não** fazem parte dos 10 required checks, e
qual comando as roda localmente. Essa parte não depende de ninguém e já tira as suítes do limbo. (2) **Leve
ao dono a decisão** de como semear: existe `scripts/seed-database.ts` no repositório — leia-o e diga se
serve, o que ele escreve e em qual banco; proponha um usuário de teste dedicado, de papel `user`, com prefixo
reconhecível nos registros (por exemplo `E2E-`) e exclusão lógica por `deleted_at` ao final, respeitando
`docs/SOFT_DELETE_POLICY.md`. **Não semeie nada sem aprovação**: é escrita em produção. (3) Só depois,
e só se o dono aprovar, proponha o job de CI. **Atalho tentador a evitar:** apagar `tests/e2e/` porque "não
roda". São os únicos testes que exercitam o produto como o usuário o usa, e o custo de reescrevê-los depois
é muito maior que o de documentá-los agora.
**Arquivos e objetos a tocar:** `tests/e2e/README.md` (novo); a proposta de semeadura no corpo da PR; nada
em `scripts/` sem aprovação
**Não tocar / armadilhas:** **não execute** `scripts/seed-database.ts` contra produção para "ver o que
acontece" — leia-o. Não altere `playwright.config.ts` nem `vitest.config.ts` nesta etapa. Lembre que
`tests/e2e/critical-paths.spec.ts:17` é a origem do aviso `sonarjs/super-linear-regex` do orçamento de lint:
se você mexer no arquivo, confira `npm run lint:budget`.
**Depende de:** — · **Libera:** 284
**Risco e como reverter:** o risco está na semeadura, não na documentação — e por isso a semeadura fica com
o dono. Reverter = `git revert`.
**Precisa de aprovação humana antes do merge:** sim (semear usuário é escrita em produção; não há staging)
**Como verificar:**

```bash
sed -n '1,40p' tests/e2e/critical-paths.spec.ts
grep -rn "e2e\|playwright" .github/workflows/ || echo "nenhum workflow roda e2e — confirmado"
```

Esperado: o `grep` confirma que nenhum workflow roda a suíte (é a afirmação central do achado), e o README
novo descreve exatamente o que falta para rodá-la. Registre a decisão do dono sobre a semeadura em
`05-PROGRESSO.md`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 284 — Subir os pisos de cobertura para travar o que as etapas 275-282 conquistaram

**Onda / Severidade / Camada:** 8 / Média / CI
**Achados resolvidos:** H-13
**Problema hoje:** `vitest.config.ts` fixa os pisos de cobertura medidos em 2026-09-03 (`lines: 72`,
`functions: 73`, `branches: 67`, `statements: 70`), com o comentário "Ratchet: ... Só sobe conforme a dívida
é paga; nunca desça sem aprovação em review". As etapas 275-282 acrescentam testes de hook e de componente
pela primeira vez — se os pisos ficarem onde estão, a próxima PR pode apagar esses testes e a cobertura
voltar ao chão sem nenhum sinal.
**Causa raiz:** piso de cobertura não atualizado após ganho real.
**Caminho recomendado:** meça **depois** de 275-282 mergeadas, com `npm run test:coverage`, e suba os quatro
pisos para o valor medido **menos 1 ponto** de folga (a cobertura oscila com a ordem de arquivos e com o
`v8`). Escreva no comentário do bloco a data da nova medição e as etapas que a produziram, no mesmo estilo
do comentário atual — ele é a razão pela qual esse mecanismo sobreviveu. Rode a suíte **inteira** uma vez
para medir (`npm run test:coverage`), não um subconjunto: piso calculado sobre parte da suíte reprova a CI
na primeira PR. **Atalho tentador a evitar:** subir os pisos "para um número redondo" (80/80/75/75). Piso
acima da cobertura real reprova **todas** as PRs seguintes e será baixado por quem estiver com pressa —
destruindo o mecanismo. Suba para o medido, com um ponto de folga.
**Arquivos e objetos a tocar:** `vitest.config.ts` (apenas o bloco `coverage.thresholds` e seu comentário)
**Não tocar / armadilhas:** não altere `include`/`exclude`, `environment`, `setupFiles`, `testTimeout` nem
`hookTimeout` — eles estão calibrados (o comentário explica o `testTimeout: 10000` por causa do cold-start
de edge function de ~8s). Não abaixe nenhum piso: o comentário do próprio arquivo diz que descer exige
aprovação. Esta etapa toca configuração de gate de CI.
**Depende de:** 275, 276, 277, 278, 281, 282 · **Libera:** 299
**Risco e como reverter:** piso mal medido reprova todas as PRs seguintes do plano. Mitigação: cole a saída
de `npm run test:coverage` no corpo da PR, com os quatro números medidos ao lado dos quatro propostos.
`git revert`.
**Precisa de aprovação humana antes do merge:** sim (altera limiar de gate de CI)
**Como verificar:**

```bash
npm run test:coverage 2>&1 | tail -25
node -e "console.log(require('fs').readFileSync('vitest.config.ts','utf8').match(/thresholds[\s\S]{0,160}/)[0])"
```

Esperado: a suíte passa com os pisos novos; os quatro números do arquivo são iguais ao medido menos 1. Rode
uma segunda vez para confirmar que a medição é estável antes de pedir merge.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 285 — Confirmar com o dono se `VITE_SENTRY_DSN` está configurado no Vercel

**Onda / Severidade / Camada:** 8 / Média / infraestrutura
**Achados resolvidos:** H-14
**Problema hoje:** `src/main.tsx:10-17` faz a coisa certa — `const sentryDsn = import.meta.env.VITE_SENTRY_DSN;`
e `if (sentryDsn) { Sentry.init({ dsn: sentryDsn, environment: import.meta.env.MODE, tracesSampleRate: 0.1 }) }`.
O código é condicional ao DSN **de propósito**, então **sem DSN não há captura nenhuma** e **nada no
repositório indica o problema**: o código está correto. As duas barreiras de erro existem
(`src/main.tsx:5,47-49` na raiz e `src/App.tsx:10,187,206` na árvore de rotas, com uma interna em `:197-199`),
mas se o Sentry não está inicializado, elas mostram a tela de erro e **ninguém é avisado**.
**Causa raiz:** variável de ambiente de front, configurada fora do repositório, sem verificação.
**Caminho recomendado:** peça ao dono para conferir em Vercel → projeto `loggi-flow-v2` (team `juca1`) →
Settings → Environment Variables se existe `VITE_SENTRY_DSN` no ambiente **Production**, e registre
"configurado" ou "ausente" em `05-PROGRESSO.md` com data e quem confirmou. Lembre-o do que o próprio
`AGENTS.md:86-88` diz: `VITE_*` **vai para o pacote do navegador e é público** — um DSN de Sentry é
projetado para isso (é uma chave de ingestão pública), então não há problema em configurá-lo ali; o que
**não** pode ir para o Vercel é segredo de servidor. Se estiver ausente, a decisão de criar a conta/projeto
no Sentry e o custo são do dono. **Atalho tentador a evitar:** deduzir que está configurado porque o
`@sentry/react` está no `package.json` e o código chama `Sentry.init`. O código é condicional; a presença da
biblioteca não prova nada.
**Arquivos e objetos a tocar:** nenhum (verificação e registro)
**Não tocar / armadilhas:** não escreva o valor do DSN em arquivo, commit ou anotação — registre só
"configurado"/"ausente". Não altere `src/main.tsx`: o padrão condicional está certo e é o que permite rodar
local sem Sentry.
**Depende de:** — · **Libera:** 286
**Risco e como reverter:** nenhum (leitura)
**Precisa de aprovação humana antes do merge:** sim (variável de ambiente de produção e possível custo de
serviço)
**Como verificar:** anotação em `05-PROGRESSO.md` com "configurado" ou "ausente", data e autor. Se você tiver
acesso de leitura ao Vercel pelo MCP, confirme pela lista de variáveis do projeto (sem decifrar o valor) e
cole o nome da variável e o ambiente.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 286 — Provar que um erro de front chega ao Sentry

**Onda / Severidade / Camada:** 8 / Média / observabilidade
**Achados resolvidos:** H-14
**Problema hoje:** mesmo com o DSN configurado, ninguém nunca verificou que um erro real chega ao painel. A
cadeia tem três pontos onde pode se romper sem avisar: a variável não entrar no build
(`VITE_*` é lida em tempo de build, não de execução — se foi adicionada **depois** do último deploy, o
pacote em produção não a tem), a CSP bloquear o envio (`index.html` tem CSP validada por
`npm run validate:csp` — se o domínio de ingestão do Sentry não estiver liberado, o envio morre no
navegador), e a barreira de erro capturar a exceção sem reportá-la.
**Causa raiz:** cadeia de observabilidade nunca exercitada ponta a ponta.
**Caminho recomendado:** com a confirmação da etapa 285, dispare **um** erro controlado em produção e
confirme a chegada. O caminho mais honesto e menos invasivo: use a rota já existente de diagnóstico de
qualidade (`/admin/quality-gate`, `src/App.tsx`) **sem alterá-la**, abra o navegador no site publicado
(`https://loggi-flow-v2.vercel.app/`) e execute `Sentry.captureMessage` pelo console — não é código novo no
repositório. Se o ambiente não permitir, a alternativa é uma rota de diagnóstico **restrita a admin** que
chame `Sentry.captureException(new Error("diagnostico-sentry"))`; nesse caso é código novo, e vale marcar
como mudança de arquitetura pequena. Confirme também, na aba de rede do navegador, que o POST de ingestão
**não** foi bloqueado pela CSP; se foi, o conserto é liberar o domínio de ingestão em `index.html` — o que
exige rodar `npm run validate:csp` e **é mudança de CSP, portanto decisão do dono** (ver
`docs/agentes/regras-dominio.md`). Registre o `event_id` ou o horário do evento no painel em
`05-PROGRESSO.md`.
**Atalho tentador a evitar:** forçar um erro quebrando uma tela de propósito em produção (por exemplo
mergeando um `throw` temporário). Isso é incidente provocado em sistema que a operação usa.
**Arquivos e objetos a tocar:** preferencialmente nenhum; `index.html` **apenas** se a CSP bloquear e o dono
aprovar
**Não tocar / armadilhas:** mexer em `index.html` obriga `npm run validate:csp` antes da PR
(`AGENTS.md`, seção "Bugs e funcionalidades") e é decisão do dono. Não baixe `tracesSampleRate` nem mexa em
`Sentry.init`.
**Depende de:** 285 · **Libera:** —
**Risco e como reverter:** um evento de diagnóstico no painel do Sentry (ruído mínimo, e desejável). Se
mexer na CSP, o risco é bloquear recurso legítimo: `git revert` + `npm run validate:csp`.
**Precisa de aprovação humana antes do merge:** sim (toca ambiente de produção e, possivelmente, a CSP)
**Como verificar:** o evento aparece no painel do Sentry com `environment=production`, e o horário/`event_id`
está anotado em `05-PROGRESSO.md`. Se **não** aparecer, a etapa fica **aberta** com o ponto exato onde a
cadeia se rompeu (build, CSP ou barreira de erro) — esse diagnóstico é o resultado válido da etapa.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 287 — Verificar no banco ao vivo se `webhook_failures` e `cron_job_logs` existem

**Onda / Severidade / Camada:** 8 / Média / banco (somente leitura)
**Achados resolvidos:** H-14
**Problema hoje:** procurando `webhook_failures` e `cron_job_logs` na árvore inteira (`supabase/`, `src/`,
migrations e documentação): **zero ocorrências**. Não é o caso de "grava e ninguém lê" — **nenhuma função
escreve e nenhuma tela lê**. Se essas tabelas existirem no banco ao vivo, são tabelas mortas; se não
existirem, falha de webhook e falha de cron simplesmente não têm destino. Com **4 webhooks** e **28 cron
jobs** ativos, é bastante coisa acontecendo sem lugar para olhar. Antes de criar qualquer coisa, é preciso
saber o que já existe: o repositório **tem** `webhook_deliveries` (escrita por
`supabase/functions/webhook-status/index.ts`, lida por `src/hooks/integrations/useClientWebhooks.tsx`, com
as colunas `success`, `response_status`, `error_message`) e **tem** `error_events` (escrita por
`src/hooks/analytics/useTelemetry.ts` e `src/components/common/WidgetErrorBoundary.tsx`).
**Causa raiz:** dois nomes de tabela citados em discussões antigas sem nunca terem entrado no código.
**Caminho recomendado:** consulte o banco **oficial** `jvfhclubfpxrtrrazrgr` pelo MCP
**`SUPABASE - LOGGI FLOW V2 - MCP`** (confira qual MCP carregou: há vários Supabase quase homônimos na
conta) e responda três perguntas, nesta ordem: (1) as duas tabelas existem? (2) se existem, têm linhas e de
quando é a mais recente? (3) quais tabelas de registro **existem e são usadas** hoje
(`webhook_deliveries`, `error_events`, `telemetry_logs`, `system_integrity_logs`, `rate_limit_logs`,
`nexus_tactical_logs`)?

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('webhook_failures','cron_job_logs','webhook_deliveries','error_events');
SELECT relname, n_live_tup FROM pg_stat_user_tables
WHERE relname IN ('webhook_failures','cron_job_logs','webhook_deliveries','error_events') ORDER BY relname;
```

Registre as respostas em `05-PROGRESSO.md`. **Atalho tentador a evitar:** criar as duas tabelas porque "o
nome faz sentido". Já existe `webhook_deliveries` com exatamente as colunas necessárias — criar tabela nova
é DDL em produção (decisão do dono) e provavelmente duplicação.
**Arquivos e objetos a tocar:** nenhum (consulta e registro)
**Não tocar / armadilhas:** **somente leitura**. O MCP do banco conecta com `service_role` e **aceita DDL** —
não rode nenhum `CREATE`, `ALTER` ou `DROP` aqui, nem para "testar". Se as tabelas existirem e estiverem
mortas, **não as apague**: deleção é decisão do dono, e vai para a 290 como recomendação.
**Depende de:** — · **Libera:** 288, 289, 290
**Risco e como reverter:** nenhum (leitura)
**Precisa de aprovação humana antes do merge:** não (consulta); a **decisão** sobre o que fazer com o
resultado é do dono
**Como verificar:** as duas consultas executadas, com a saída colada em `05-PROGRESSO.md`, mais a frase de
conclusão: "falha de webhook de entrada tem/não tem destino em tabela hoje".
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 288 — Dar destino persistente à falha de webhook de entrada

**Onda / Severidade / Camada:** 8 / Média / edge function
**Achados resolvidos:** H-14
**Problema hoje:** quando um dos quatro webhooks de entrada falha, o único registro é o log da função:
`supabase/functions/lalamove-webhook/index.ts:199-205` faz
`log.error('Webhook processing error', { error: error.message })` e devolve 500 — e
`_shared/logger.ts` só chama `console.error` com um JSON. `rodonaves-webhook/index.ts:229`,
`carrier-webhook-receiver/index.ts:221` e `nexus-webhook-receiver/index.ts:162` seguem o mesmo desenho. O log
da função some em poucos dias e ninguém o lê. A falha de webhook **de saída** (para cliente) tem destino:
`webhook_deliveries`, escrita por `webhook-status/index.ts`. A de **entrada** não tem.
**Causa raiz:** o caminho de erro foi tratado como resposta HTTP, não como evento a registrar.
**Caminho recomendado:** use o que já existe. Confirmada pela etapa 287 a tabela adequada (a candidata mais
provável é `webhook_deliveries`, se ela aceitar registro de entrada, ou a tabela de registro que a consulta
apontar), acrescente no `catch` de **uma** função primeiro — comece pelo `carrier-webhook-receiver`, que é o
padrão de referência do repositório — uma gravação com: provedor, `event_id` (quando houver), status da
resposta, mensagem de erro e horário. Siga o padrão de gravação que o repositório já usa para auditoria:
`supabase/functions/log-security-event/index.ts:64-66`. **Grave de forma que a gravação não possa derrubar o
webhook**: envolva em `try/catch` próprio e mantenha o 500 original. Só depois de a primeira função estar em
produção e verificada, repita nas outras três (uma PR por função, porque **cada merge publica em produção na
hora** — H-03/etapa 251). Se a etapa 287 concluir que **não existe** tabela adequada, **pare**: criar tabela
é DDL em produção, decisão do dono — escreva a proposta (nome, colunas, RLS no padrão `SECURITY DEFINER` do
ADR 0014, retenção) e deixe a PR aberta. **Atalho tentador a evitar:** redirecionar o erro para o Sentry do
front. Sentry está no navegador (`src/main.tsx`); edge function não passa por lá.
**Arquivos e objetos a tocar:** `supabase/functions/carrier-webhook-receiver/index.ts` (apenas o `catch`) na
primeira PR
**Não tocar / armadilhas:** não registre o corpo inteiro do webhook se ele puder conter dado pessoal do
cliente — é matéria de LGPD (`docs/LGPD_COMPLIANCE.md`); grave identificador, provedor e erro, e use o
`redact` que `_shared/logger.ts` já exporta e que `rodonaves-webhook` já importa. Não altere
`_shared/logger.ts` (usado por todas as funções). Merge aqui **é deploy**: confirme o run do
`deploy-functions.yml` e registre o horário.
**Depende de:** 287 · **Libera:** 289
**Risco e como reverter:** uma gravação mal feita no `catch` pode transformar erro tratado em erro
não tratado. Por isso o `try/catch` próprio e uma função por vez. `git revert` + confirmar o redeploy.
**Precisa de aprovação humana antes do merge:** sim (grava em tabela de produção e, se faltar tabela, exige
DDL)
**Como verificar:**

```bash
grep -n -A12 'catch (error' supabase/functions/carrier-webhook-receiver/index.ts
```

Esperado: o `catch` grava o registro e **mantém** o 500. Depois do deploy, provoque uma falha controlada
(requisição com corpo malformado e assinatura válida) e confirme **uma** linha nova na tabela, com a consulta
colada em `05-PROGRESSO.md`.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 289 — Mostrar as falhas de webhook numa tela que já existe

**Onda / Severidade / Camada:** 8 / Média / interface
**Achados resolvidos:** H-14
**Problema hoje:** registrar sem mostrar não resolve o problema do achado ("o que existe e o que ninguém
vê"). A rota `/webhooks` já existe (`docs/prod-readiness.md:9` lista as 61 rotas) e o hook
`src/hooks/integrations/useClientWebhooks.tsx` já lê `webhook_deliveries` — ou seja, a tela que mostra
entrega de webhook **existe** e hoje cobre só o lado de saída.
**Causa raiz:** falta de superfície de leitura para o registro de entrada.
**Caminho recomendado:** leia `src/hooks/integrations/useClientWebhooks.tsx` e a tela de `/webhooks` **antes
de escrever qualquer coisa**, e acrescente a menor coisa útil: uma lista das últimas falhas (filtro
`success = false`, ordenado por `created_at DESC`, com **teto explícito** de linhas), com provedor, horário,
status e mensagem. Respeite três regras que o resto deste plano cobra: teto na consulta (P-01 — cinco
leituras do sistema baixam a tabela inteira; não crie a sexta), estados de erro/carregando/vazio visíveis
(R-01 — cinco telas mostram erro como texto solto; siga o padrão correto, não esse), e assinatura de tempo
real estável se você usar realtime (R-02/R-09 — 12 telas derrubam e reabrem o canal a cada render e 4 usam
nome fixo global; **prefira não usar realtime aqui**: uma lista de falhas atualizada ao abrir resolve).
**Atalho tentador a evitar:** criar uma tela nova de observabilidade. O sistema já tem 61 rotas e
`/admin/db-health`, `/admin/telemetria` e `/webhooks`; uma rota a mais é funcionalidade nova fora do escopo
do achado — e "funcionalidade pronta" neste repositório exige rota, entrada no menu, papéis e estados
(`AGENTS.md`), o que é bem mais do que esta etapa deve custar.
**Arquivos e objetos a tocar:** `src/hooks/integrations/useClientWebhooks.tsx` (acréscimo de consulta) e a
tela de `/webhooks`
**Não tocar / armadilhas:** não mexa na parte da tela que administra `client_webhooks` (as etapas 004-005
tocam `webhook-status`, que escreve nessa tabela — conflito de PR). Cuide do orçamento de lint: tela nova
costuma gerar `react-hooks/set-state-in-effect`, o aviso mais comum do repositório — rode
`npm run lint:budget` antes da PR e gaste no máximo o que a margem da etapa 269 permite.
**Depende de:** 288 · **Libera:** —
**Risco e como reverter:** baixo (leitura). `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
npx eslint src/hooks/integrations/useClientWebhooks.tsx; npm run lint:budget
grep -n 'limit(' src/hooks/integrations/useClientWebhooks.tsx
```

Esperado: a consulta nova tem `.limit(...)` explícito; lint e orçamento `[OK]`. Depois do deploy, abra
`/webhooks`, confirme que a falha provocada na etapa 288 aparece na lista e registre o horário.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 290 — Tornar visível a falha de cron, e decidir o destino das tabelas mortas

**Onda / Severidade / Camada:** 8 / Média / interface + banco
**Achados resolvidos:** H-14
**Problema hoje:** são **28 cron jobs** ativos e nenhuma tabela de registro de execução no repositório
(`cron_job_logs` não existe em lugar nenhum da árvore). O que existe é a RPC `get_cron_jobs_status`, já
consumida por `src/features/db-observability/hooks/useCronJobs.ts:11` e exibida em `/admin/db-health`
(`src/App.tsx:174`) — construída nas sprints do `docs/PERFEICAO_10_10.md`. Ou seja: há um lugar para olhar,
e o que falta é ele dizer **o que deu errado** em vez de só listar os jobs. E, se a etapa 287 encontrou
`webhook_failures`/`cron_job_logs` existindo e vazias no banco, sobra decidir o que fazer com elas.
**Causa raiz:** estado de cron exposto como lista, sem destaque de falha nem retenção de histórico.
**Caminho recomendado:** duas partes, nesta ordem. (1) **Leia o retorno real da RPC** antes de mudar a tela:
chame `get_cron_jobs_status` pelo MCP do banco e veja quais campos ela devolve (última execução, status,
mensagem). Se ela já traz o status da última execução, a mudança é só de apresentação: destacar na
`/admin/db-health` os jobs cuja última execução falhou ou cuja última execução é mais antiga que o intervalo
esperado — o caso que o `ESTADO_ATUAL.md` registrou como "heartbeat parado há ~3 meses". Se a RPC **não**
traz status, **pare**: alterar a RPC é DDL em produção, decisão do dono — escreva a proposta e deixe a PR
aberta. (2) Com o resultado da etapa 287 na mão, leve ao dono uma recomendação de uma linha sobre
`webhook_failures` e `cron_job_logs`: se existem e estão vazias e sem uso, recomende remoção (reduz o
"parece protegido/parece registrado" que engana a próxima auditoria) — **e não as remova você**.
**Atalho tentador a evitar:** criar uma tabela de histórico de cron e um job para alimentá-la. É DDL,
retenção e custo recorrente; o `pg_cron` já guarda histórico próprio e a RPC já foi construída para ler o
estado — use o que existe antes de propor estrutura nova.
**Arquivos e objetos a tocar:** `src/features/db-observability/hooks/useCronJobs.ts` e a tela de
`/admin/db-health` (apresentação); nenhum arquivo SQL sem aprovação
**Não tocar / armadilhas:** **nenhum DDL** nesta etapa (sem `CREATE`, `ALTER` ou `DROP`), nem para tabela
vazia: `AGENTS.md` exige decisão do dono para DDL em produção e **não há staging**. Não toque nas outras
RPCs de saúde (`get_global_health_score_fast`, `get_health_anomalies_fast`, `persist_db_health_snapshot`) —
elas são o conjunto citado pelos documentos de perfeição e funcionam.
**Depende de:** 287 · **Libera:** 295
**Risco e como reverter:** baixo na parte de apresentação. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (envolve possível DDL e deleção de tabela)
**Como verificar:**

```bash
sed -n '1,25p' src/features/db-observability/hooks/useCronJobs.ts
```

Mais a chamada da RPC pelo MCP do banco, com a saída colada em `05-PROGRESSO.md`. Esperado: a tela destaca
job com falha ou atrasado, e o progresso registra quantos dos 28 jobs estavam nessa condição no dia — esse
número é o resultado de negócio da etapa.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 291 — `MapboxMap`: parar de interpolar dado de rastreamento dentro de `innerHTML`

**Onda / Severidade / Camada:** 7 / Média / interface
**Achados resolvidos:** H-15
**Problema hoje:** `src/components/map/MapboxMap.tsx:469` monta o marcador de caminhão com
`el.innerHTML = \`<svg ... stroke="${mk.isAnomaly ? "#ef4444" : color}" ... style="transform: rotate(${mk.heading || 0}deg)">...\``.
`mk.heading`é declarado`heading?: number` (`:19`) mas **vem de dado de rastreamento**, que pode chegar por
webhook de transportadora — ou seja, de fora. `color`vem de`mk.color || "#3b82f6"` (`:457`), também de
dado. Um valor malformado injeta marcação na página do mapa.
**Nota de releitura (regra 2):** o achado cita `:440`e`:469`. Reconferido linha a linha: **`:440`é
estático** (SVG literal do marcador de origem, sem interpolação) e **não é problema**; quem interpola é`:469`. As interpolações em `setHTML` (`:446-447`e`:488`) são tratadas na etapa 292.
**Causa raiz:** marcação montada por concatenação de texto em vez de API de DOM.
**Caminho recomendado:** troque a construção por nós de DOM, mantendo o mesmo desenho visual: crie o `svg`e
os`path`/`circle`com`document.createElementNS("http://www.w3.org/2000/svg", ...)`e defina`stroke`/`transform`por`setAttribute`, **ou** mantenha o `innerHTML`com o SVG **literal** (sem
interpolação) e aplique as duas partes variáveis depois, por`el.querySelector("svg")`: `setAttribute("stroke", ...)`e`style.transform = \`rotate(${Number(mk.heading) || 0}deg)\``. A segunda forma é o diff menor e é a
recomendada. Em qualquer caso, **force o tipo**: `Number(mk.heading) || 0` para o ângulo e, para a cor,
valide contra o formato esperado (`/^#[0-9a-f]{3,8}$/i`) caindo no padrão `#3b82f6`quando não casar — o
arquivo já usa`color`em`style.cssText`em vários pontos, então a validação protege mais de uma linha.
**Atalho tentador a evitar:**`DOMPurify`ou biblioteca de sanitização. Dependência nova para dois valores
que são um número e uma cor;`AGENTS.md`restringe dependência nova ao indispensável.
**Arquivos e objetos a tocar:**`src/components/map/MapboxMap.tsx`(bloco`:459-470`)
**Não tocar / armadilhas:** **não** altere `src/components/ui/chart.tsx:70`, que usa
`dangerouslySetInnerHTML`para variáveis de CSS: é código do shadcn, foi avaliado e **descartado** como
achado. Não toque em`:440`(estático). Este arquivo é grande e o mapa é tela sensível — confira
visualmente que o caminhão continua girando conforme o`heading`depois da mudança.
**Depende de:** — · **Libera:** 292
**Risco e como reverter:** risco visual no mapa (ícone sem rotação ou sem cor).`git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'innerHTML' src/components/map/MapboxMap.tsx
npx eslint src/components/map/MapboxMap.tsx; npx tsc --noEmit; echo "exit=$?"
```

Esperado: nenhuma ocorrência de `innerHTML` com `${`; lint limpo e typecheck 0. Abra o mapa com um
`heading` de teste e confirme a rotação — registre que a verificação foi visual (RASTREADO, não EXECUTADO,
se você não conseguiu abrir a tela).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 292 — `MapboxMap`: escapar o texto dos balões do mapa

**Onda / Severidade / Camada:** 7 / Média / interface
**Achados resolvidos:** H-15
**Problema hoje:** dois `setHTML` interpolam dado dentro de marcação:
`src/components/map/MapboxMap.tsx:446-447` — `.setHTML(\`<div style="...">${originMarker.label || "Nexus CD Central"}</div>\`)`—
e`:488`em diante, o balão do marcador de entrega, que interpola`color`em cinco atributos de estilo,`mk.label || mk.id`no texto e aceita **marcação inteira vinda de fora** por`mk.popupHTML ||` (`:489`).
`label`e`id`descrevem a entrega;`popupHTML`é uma porta aberta por desenho.
**Causa raiz:** balão montado por concatenação de texto, com um parâmetro que aceita HTML cru.
**Caminho recomendado:** escape o **texto** e mantenha a estrutura. Crie um`escapeHtml` pequeno e local no
arquivo (`&`, `<`, `>`, `"`, `'`) — ou use-o de `src/lib/`se já existir algo equivalente (confira com`grep -rn "escapeHtml\|escapeHTML" src/lib/`antes de escrever o seu) — e aplique em`originMarker.label`,
`mk.label`e`mk.id`. Reaproveite a validação de cor da etapa 291 para os atributos de estilo. Sobre
`mk.popupHTML`: **não o remova nesta etapa** — descubra primeiro quem o usa
(`grep -rn "popupHTML" src/`); se ninguém o passa, a remoção é trivial e fecha a porta; se alguém passa,
registre em `05-PROGRESSO.md`como achado para o dono decidir, porque remover quebraria essa tela.
**Atalho tentador a evitar:** reescrever os dois balões como componentes React. O MapLibre renderiza o
conteúdo do balão fora da árvore do React; fazer isso certo é mudança de arquitetura do mapa, não correção
de interpolação.
**Arquivos e objetos a tocar:**`src/components/map/MapboxMap.tsx` (`:446-447`, `:484-500`)
**Não tocar / armadilhas:** não altere a aparência dos balões (o estilo inline é longo e intencional) — só
o tratamento dos valores. Não toque em `src/components/ui/chart.tsx`(descartado como achado). Confirme no
navegador que os dois balões continuam abrindo: um`escapeHtml`aplicado no lugar errado produz balão com`&lt;div&gt;`visível.
**Depende de:** 291 · **Libera:** 293
**Risco e como reverter:** risco visual nos balões do mapa.`git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -n 'setHTML' -A3 src/components/map/MapboxMap.tsx
grep -rn 'popupHTML' src/ | grep -v 'MapboxMap.tsx'
npx tsc --noEmit; echo "exit=$?"
```

Esperado: todo valor interpolado nos `setHTML` passa por `escapeHtml` (ou pela validação de cor); o segundo
`grep` mostra quem passa `popupHTML` (ou nada, e você registra isso); typecheck 0.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 293 — Pôr `rel="noopener noreferrer"` nos quatro links externos que só têm `noreferrer`

**Onda / Severidade / Camada:** 7 / Baixa / interface
**Achados resolvidos:** H-15
**Problema hoje:** quatro links abrem em nova aba com apenas `rel="noreferrer"`:
`src/components/rodonaves/RTEDeliveryReceipts.tsx:48`,
`src/components/shipping/DeliveryReceiptUpload.tsx:179` e `:192`, e
`src/pages/RastreamentoPublico.tsx:427`. Nos três primeiros o `href` é uma URL de comprovante vinda de dado
(`inner.Url || inner.url`, `preview`); no último é `tracking.comprovante_entrega_url`, exibido em **página
pública** de rastreamento.
**Nota de releitura (regra 2):** os outros dois `target="_blank"` do repositório **já estão corretos** —
`src/components/admin/TelemetryViewer.tsx:236` e `src/components/common/DocumentUploadField.tsx:74` têm
`rel="noopener noreferrer"`. São estes dois os padrões de referência; não os altere. Registre também, com
honestidade, que `rel="noreferrer"` **já implica** `noopener` nos navegadores atuais: o ganho aqui é
explicitude e consistência, não fechar um buraco aberto — é por isso que a severidade é baixa.
**Causa raiz:** atributo escrito por hábito, sem padrão único no repositório.
**Caminho recomendado:** troque `rel="noreferrer"` por `rel="noopener noreferrer"` nos quatro pontos,
copiando a forma exata dos dois arquivos corretos. É um diff de quatro linhas — resista a tocar em mais
nada nesses arquivos. **Atalho tentador a evitar:** trocar os `<a target="_blank">` por uma função
`window.open`. Perde comportamento de navegador (abrir em nova janela, copiar link) e é mudança de
interação, não de segurança.
**Arquivos e objetos a tocar:** `src/components/rodonaves/RTEDeliveryReceipts.tsx:48`,
`src/components/shipping/DeliveryReceiptUpload.tsx:179`, `:192`,
`src/pages/RastreamentoPublico.tsx:427`
**Não tocar / armadilhas:** não altere os `href` nem a lógica de upload/preview de comprovante
(`DeliveryReceiptUpload.tsx` é tocado por outros achados do grupo A — A-11, dois caminhos de upload com
padrões de segurança diferentes); **só** o atributo `rel`. `RastreamentoPublico.tsx` é tela **pública**:
qualquer mudança além do `rel` precisa de atenção redobrada.
**Depende de:** — · **Libera:** 294
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -rn 'target="_blank"' -A2 src/ | grep -B2 'rel=' | grep -c 'noopener'
grep -rn 'rel="noreferrer"' src/ || echo "nenhum link só com noreferrer"
```

Esperado: a segunda linha imprime "nenhum link só com noreferrer"; a primeira conta 6 (os 4 corrigidos + os
2 que já estavam certos).
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 294 — Fazer o lint cobrar link externo e `innerHTML` interpolado

**Onda / Severidade / Camada:** 7 / Baixa / CI
**Achados resolvidos:** H-15
**Problema hoje:** as etapas 291-293 corrigem seis pontos, e nada impede que o sétimo entre na semana
seguinte — foi assim que quatro links e duas interpolações coexistiram com dois exemplos corretos no mesmo
repositório.
**Causa raiz:** convenção sem regra.
**Caminho recomendado:** ligue, em `eslint.config.js`, as duas regras que já vêm dos plugins instalados (o
projeto usa `eslint-plugin-react-hooks` 7, `typescript-eslint` e `sonarjs` — confira o que está disponível
antes de escolher o nome exato): a de link externo com `target="_blank"` sem `rel` seguro e, se existir no
conjunto instalado, a que proíbe atribuição a `innerHTML`. Ligue como **`error`**, não `warning`: regra nova
em `warning` consome o orçamento de avisos da etapa 269 e o `lintErrors: 0` do
`.warning-budget.json` garante que, como `error`, ela trava a PR que violar — que é o objetivo. Para isso,
rode `npx eslint .` **antes** de abrir a PR: se a regra acusar violação fora dos seis pontos corrigidos, a
etapa muda de tamanho — **pare, registre em `05-PROGRESSO.md` e leve o número ao dono** em vez de ligar a
regra e deixar a `main` vermelha. **Atalho tentador a evitar:** ligar como `warning` "para não travar nada".
O orçamento está em 105 e o teto foi baixado na etapa 269 com margem contada; aviso novo consome margem do
plano e, pior, nunca é pago.
**Arquivos e objetos a tocar:** `eslint.config.js`
**Não tocar / armadilhas:** `eslint.config.js` é a configuração do required check **"Lint"** e do
**"Warning Budget Gate"** — um erro aqui reprova **todas** as PRs do repositório. Não rebaixe nem desligue
nenhuma regra existente: o `$comment` de `.warning-budget.json` registra que os 97 avisos do React Compiler
foram rebaixados a _warning_ por decisão anterior documentada; mexer nisso é decisão do dono. Rode
`npm run lint:budget` depois da mudança e confirme que `lintErrors` continua **0**.
**Depende de:** 291, 292, 293 · **Libera:** —
**Risco e como reverter:** alto se mal feito (trava todas as PRs). Mitigação: cole no corpo da PR a saída de
`npx eslint .` mostrando 0 erros com a regra ligada. `git revert`.
**Precisa de aprovação humana antes do merge:** sim (altera configuração de gate de CI)
**Como verificar:**

```bash
npx eslint . 2>&1 | tail -5
npm run lint:budget
```

Esperado: 0 erros com a regra ligada e o orçamento `[OK]`; e, inserindo de propósito um
`<a target="_blank">` sem `rel`, o `eslint` **falha** com erro. Faça o teste negativo, desfaça e registre as
duas saídas.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 295 — Fechar no banco ao vivo os seis achados marcados HIPÓTESE

**Onda / Severidade / Camada:** 8 / Alta / banco (somente leitura) + infraestrutura
**Achados resolvidos:** F-02, F-03, P-05, P-06, S-05, S-08 (fechamento)
**Problema hoje:** seis achados desta auditoria estão marcados **HIPÓTESE — NÃO VERIFICADO**, porque o
projeto Supabase oficial `jvfhclubfpxrtrrazrgr` não ficou acessível na sessão e
`docs/contexto/supabase/` nunca foi gerada (H-09). Enquanto ficarem abertos, cada um é uma dúvida que o
próximo agente vai reabrir do zero. São eles, com a consulta que fecha cada um:

- **F-02** (crítico se confirmado) — `geo_blocking_rules`, `geo_blocking_settings` e `scheduled_reports`
  têm `CREATE POLICY` e **nenhuma** migration com `ENABLE ROW LEVEL SECURITY`. No Postgres, policy em tabela
  sem RLS **não é aplicada**: tabela aberta com aparência de protegida.
  `SELECT * FROM public.get_rls_audit() WHERE status = 'critical';`
- **F-03** — unicidade de `coletas.numero_coleta`, `entregas.numero_entrega` e do código de rastreio, que
  são gerados por trigger `BEFORE INSERT` (`20251215123841_...sql:202-203`).
  `SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid IN ('public.coletas'::regclass,'public.entregas'::regclass) AND contype IN ('u','p');`
- **P-05** — quais índices existem de fato:
  `SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('entregas','coletas','telemetry_logs');`
- **P-06** — os cinco candidatos a índice duplicado que sobraram, mais o uso real:
  `SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('rastreamento_historico','entregas','coletas','audit_logs') ORDER BY tablename, indexname;`
  e `pg_stat_user_indexes` para `idx_scan`.
- **S-05** — se `ALLOW_TEST_MODE` existe nas edge functions em produção (painel do Supabase; não é legível
  do repositório). Já é a etapa 010; aqui é só o **fechamento** do registro.
- **S-08** — se o token `VITE_MAPBOX_TOKEN` tem restrição de URL no painel do Mapbox. Já é a etapa 019;
  aqui é só o fechamento.
  **Causa raiz:** a fonte dona do fato "banco" não existia quando a auditoria foi feita.
  **Caminho recomendado:** faça nesta ordem, e **só leitura**. (1) Se a etapa 264 deu certo, comece lendo
  `docs/contexto/supabase/` (incluindo `lints.md`, que o README manda ler **antes** de mexer em RLS, funções
  ou índices) — é mais barato e já é a fonte oficial. (2) Para o que a fonte não responder, consulte o banco
  pelo MCP **`SUPABASE - LOGGI FLOW V2 - MCP`**, confirmando que foi **esse** que carregou (há vários Supabase
  quase homônimos na conta, e `hgicfqjayrjurivtygqf` é **proibido para escrita**). (3) Para S-05 e S-08, peça
  ao dono — não são legíveis de nenhuma consulta. (4) Para cada um dos seis, escreva em `05-PROGRESSO.md` uma
  linha no formato `<ID> — CONFIRMADO | REFUTADO | SEGUE ABERTO — <evidência: saída da consulta ou quem
confirmou> — <data>`. **Atalho tentador a evitar:** corrigir o que a consulta revelar, na mesma etapa.
  `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` numa tabela cujas policies não cobrem o caminho de escrita
  **quebra a funcionalidade na hora** (RLS sem policy nega tudo), e `DROP INDEX` a partir da leitura de
  migration é exatamente o erro que P-06 documenta — 7 de 12 "duplicados" já tinham sido removidos três meses
  antes. Aqui você **mede**; corrigir é das etapas 023-027 e 234-240, e cada uma delas é decisão do dono.
  **Arquivos e objetos a tocar:** `docs/qa/05-PROGRESSO.md` (registro)
  **Não tocar / armadilhas:** o MCP do banco conecta com `service_role` e **aceita DDL** — nenhum `CREATE`,
  `ALTER` ou `DROP` nesta etapa. **Não escreva** em `hgicfqjayrjurivtygqf`. Não anote valor de segredo
  nenhum: para S-05 e S-08 registre apenas "presente/ausente" e "restrito/sem restrição".
  **Depende de:** 264, 010, 019, 290 · **Libera:** 297, 298
  **Risco e como reverter:** nenhum (leitura). O risco é de interpretação: se a consulta vier parcial (o
  `manifest.json` do snapshot informa `erros` e `carried`), marque "SEGUE ABERTO" em vez de concluir.
  **Precisa de aprovação humana antes do merge:** sim (envolve segredo de produção e painel de terceiro, e o
  resultado pode disparar decisão de DDL)
  **Como verificar:** as seis linhas de fechamento em `05-PROGRESSO.md`, cada uma com a saída da consulta (ou
  o nome de quem confirmou) e a data. Qualquer uma sem evidência colada conta como **não fechada**.
  **Checklist de conclusão:**
- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 296 — Regerar a branch `contexto` para que as fontes reflitam o código corrigido

**Onda / Severidade / Camada:** 8 / Média / ferramentas de contexto
**Achados resolvidos:** H-09 (fechamento), F-01
**Problema hoje:** as três fontes da branch `contexto` são a primeira coisa que qualquer agente lê
(`AGENTS.md` manda `git show origin/contexto:docs/contexto/00-INDEX.md` **antes** do README). Depois de
~300 etapas, `codigo/` descreve rotas, hooks, edge functions, grafo e **testes** de uma árvore que já não
existe: `testes.json` ainda diria 61 de 61 telas sem teste (as etapas 275-282 mudaram isso),
`edge-functions.json` ainda refletiria o estado anterior às correções, e `banco.json` continuaria com o
falso positivo de F-01 ("36 tabelas sem RLS", quando ao menos 32 têm, por DDL dinâmico em
`20260711185045_...sql:1-32`).
**Causa raiz:** fontes geradas por automação que só publica quando disparada, e o plano mexeu em quase tudo
que elas descrevem.
**Caminho recomendado:** dispare `.github/workflows/contexto-ia.yml` por `workflow_dispatch` **depois** que
a última etapa de código estiver mergeada, e confira os **três** produtores no run: `codigo/`
(`scripts/ai-context/gerar.mjs`), `supabase/` (`scripts/supabase_snapshot/`) e `regras/`
(`scripts/regras_negocio/`) — mais o índice (`scripts/regras_negocio/indice.py`). Depois, **leia o
resultado** e confirme três coisas que importam ao próximo agente: (a) `00-INDEX.md` não diz mais
"ainda não gerado" na linha do banco real; (b) `codigo/testes.json` reflete os testes novos; (c) a idade de
cada fonte no `00-INDEX.md` é de minutos, não de meses. Se o produtor de código acusar falha, ela estará em
`codigo/erros_do_gerador`; a do banco, em `supabase/errors.md` — **leia os dois** antes de declarar sucesso,
porque o workflow publica o que conseguiu e mantém o resto da versão anterior. **Atalho tentador a evitar:**
corrigir à mão qualquer arquivo da branch `contexto`, inclusive o `banco.json` com o falso positivo de F-01.
A branch é **gerada**: edição manual é sobrescrita na próxima publicação ou, pior, sobrevive e passa a ser a
mentira mais convincente do repositório, porque está exatamente no lugar que o protocolo manda ler. Se
`banco.json` continuar errado, o conserto é no produtor (`scripts/ai-context/`) e isso é mudança de
automação, com aprovação do dono.
**Arquivos e objetos a tocar:** nenhum (execução e verificação). **Não abra PR da branch `contexto`.**
**Não tocar / armadilhas:** não edite a branch `contexto`; não ligue `PGDUMP`/`GEN_TYPES` (o README do
snapshot explica: `pg_dump` 16 no runner contra PG 17). Se o job do banco ainda sair "verde com aviso", o
secret da etapa 263 não existe — registre e siga.
**Depende de:** 263, 264, 266, e todas as etapas de código do plano · **Libera:** 297, 298
**Risco e como reverter:** o workflow é a fonte de contexto de todos os agentes; um run falho deixa as
fontes velhas (estado atual), não corrompidas. Se ele falhar, registre o link do run e o erro exato.
**Precisa de aprovação humana antes do merge:** não (disparo de workflow existente, sem alteração)
**Como verificar:**

```bash
git fetch origin contexto
git show origin/contexto:docs/contexto/00-INDEX.md | sed -n '1,16p'
git show origin/contexto:docs/contexto/codigo/testes.json | head -20
git log -1 --format='%cI %s' origin/contexto
```

Esperado: cabeçalho do índice com a data de hoje e o HEAD atual; a linha do banco real sem "ainda não
gerado"; `testes.json` com as telas/hooks que ganharam teste; o último commit da branch de minutos atrás.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 297 — Atualizar `03-ACHADOS.md` e `05-PROGRESSO.md` com o estado final de cada achado

**Onda / Severidade / Camada:** 8 / Alta / documentação
**Achados resolvidos:** todos (registro)
**Problema hoje:** `docs/qa/03-ACHADOS.md` descreve o sistema em **`d47ba30`/2026-11-22-23** e diz, em cada
achado, "Problema hoje". Depois da execução, boa parte desses "hoje" é passado — e o grupo H inteiro existe
justamente porque **documento que descreve estado antigo como presente faz o próximo agente estragar
produção**. Se este plano terminar sem fechar os próprios achados, ele se torna o próximo `ESTADO_ATUAL.md`.
**Causa raiz:** relatório de auditoria sem estado de execução.
**Caminho recomendado:** não reescreva os achados — **marque-os**. Para cada um dos achados dos grupos S, F,
C, D, A, R, B, P e H, acrescente ao final do bloco (depois da linha `→ Etapas ...`) uma linha única no
formato `**Estado (AAAA-MM-DD):** RESOLVIDO (etapas X, Y) | PARCIAL (feito X; falta Y, por <motivo>) |
ABERTO (<motivo>) | REFUTADO (<evidência>)`, e nada mais. A fonte dessas linhas é `05-PROGRESSO.md`, não
sua memória: um achado só é RESOLVIDO se **todas** as etapas que o resolvem estiverem marcadas concluídas
com verificação executada (regra 6). Acrescente ainda, no alto do arquivo (depois do bloco "Como ler"), um
bloco de três linhas: data do fechamento, commit da `main`, e a contagem
`N resolvidos / N parciais / N abertos / N refutados`. Em `05-PROGRESSO.md`, consolide a seção
"Achados novos" — tudo que apareceu no caminho e **não** foi corrigido (regra 4) — porque é o insumo da
próxima auditoria. **Atalho tentador a evitar:** marcar como RESOLVIDO o que foi mergeado mas não
verificado. "Pronto" neste repositório é PR mergeada **+ deploy confirmado + comportamento verificado**
(`AGENTS.md`); e `strict = false` significa que CI verde numa PR antiga não prova nada sobre a `main` de
hoje. Sem evidência, escreva PARCIAL e diga onde parou.
**Arquivos e objetos a tocar:** `docs/qa/03-ACHADOS.md` (uma linha por achado + bloco de contagem no alto),
`docs/qa/05-PROGRESSO.md`
**Não tocar / armadilhas:** **não apague nem edite** o texto original dos achados, as evidências
`arquivo:linha` ou a seção "Achados descartados (e por quê)" — ela existe para o próximo executor **não**
abrir etapa sobre eles, e é das partes mais valiosas do documento. Não mexa em `01-INVENTARIO.md` nem em
`02-CENARIOS.md`: os números deles são o ponto de partida e a etapa 299 os usa como base de comparação.
**Depende de:** 295, 296, e todas as etapas executadas · **Libera:** 298, 300
**Risco e como reverter:** nenhum risco funcional. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -c '^## [A-Z]-[0-9]' docs/qa/03-ACHADOS.md
grep -c '^\*\*Estado (' docs/qa/03-ACHADOS.md
```

Esperado: os dois números **iguais** — todo achado tem exatamente uma linha de estado. Qualquer diferença é
achado sem fechamento, e a etapa não está concluída.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 298 — Reler o plano inteiro e registrar o que ficou sem etapa executada

**Onda / Severidade / Camada:** 8 / Alta / documentação
**Achados resolvidos:** todos (auditoria da própria execução)
**Problema hoje:** o plano tem **300 etapas** e muitas ficam **abertas por desenho**: as 36 (ou quantas
forem) marcadas "Precisa de aprovação humana: sim" esperam o dono; as que dependem do banco ficam abertas se
o acesso faltou (convenção declarada nas "Instruções para o agente executor"); e qualquer etapa cuja
verificação não foi executada fica aberta pela regra 6. Sem uma passada final, ninguém sabe **quais** e, pior,
um achado pode ter todas as suas etapas abertas e ninguém notar — foi exatamente o que aconteceu com a fonte
de contexto do banco (H-09), que ficou meses "pendente" sem ninguém perceber.
**Causa raiz:** plano longo sem conferência de cobertura no fim.
**Caminho recomendado:** faça a travessia em três voltas, e **anote antes de concluir qualquer coisa**.
(1) **Etapa por etapa, 001 a 300**: cada uma tem marca em `05-PROGRESSO.md`? As que não têm são o primeiro
achado desta etapa. (2) **Achado por achado**: cruze o campo `→ Etapas NNN` de cada achado de
`03-ACHADOS.md` com as etapas concluídas; todo achado com **zero** etapas concluídas vai para uma lista
destacada — é o caso mais caro, porque significa que o defeito segue de pé e o relatório poderia sugerir o
contrário. (3) **PRs abertas**: liste as que estão esperando o dono, com link e o motivo exato da espera
(`gh pr list --state open` ou `github_graphql` pelo MCP), e agrupe por assunto (DDL, CI/workflow, segredo,
deleção de dado, decisão de negócio) — uma lista por assunto é decidível; uma lista de 30 PRs soltas não é.
Escreva o resultado numa seção nova de `05-PROGRESSO.md` chamada "O que sobrou", com três listas:
**esperando o dono**, **aberta por falta de acesso**, **não executada (e por quê)**. **Atalho tentador a
evitar:** executar as etapas que faltaram ao encontrá-las. Esta etapa **mede**; executar aqui estoura o
escopo, e as que faltaram quase sempre faltaram por um motivo que não mudou (aprovação, acesso ao banco,
decisão de negócio).
**Arquivos e objetos a tocar:** `docs/qa/05-PROGRESSO.md` (seção "O que sobrou")
**Não tocar / armadilhas:** não mergeie nenhuma PR aberta nesta etapa, nem as que "parecem óbvias": elas
estão abertas porque alguma etapa disse "não mergeie" (regra 5). Não altere `03-ACHADOS.md` aqui (é a 297) —
duas etapas escrevendo no mesmo arquivo geram conflito.
**Depende de:** 297 · **Libera:** 299, 300
**Risco e como reverter:** nenhum. `git revert`.
**Precisa de aprovação humana antes do merge:** não
**Como verificar:**

```bash
grep -c '^### Etapa ' docs/qa/04-PLANO.md
gh pr list --repo adm01-debug/Loggi_Flow_V2 --state open --json number,title,createdAt | head -40
```

Esperado: a primeira contagem é 300 (ou o total real do plano) e, para cada uma, há marca correspondente em
`05-PROGRESSO.md`; a lista de PRs abertas bate, item a item, com a lista "esperando o dono". Diferença entre
as duas é falha desta etapa, não do plano.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 299 — Rodar a bateria completa de gates e comparar com os números do começo

**Onda / Severidade / Camada:** 8 / Alta / CI
**Achados resolvidos:** H-10 (fechamento), H-11, H-13 (fechamento)
**Problema hoje:** os números de partida estão medidos e guardados em `docs/qa/02-CENARIOS.md` **seção 0**
(E1 a E11): typecheck **0 erros**; `eslint .` **105 avisos, 0 erros**; `lint:budget` **105/105**;
`validate:csp` OK; `validate:no-console` OK em 107 arquivos; `security-scan` OK **+ aviso de allowlist sem
efeito para `xlsx`, `vite`, `picomatch`**; `npm audit` **0** em todas as severidades; `.env` **rastreado e
fora do `.gitignore`**; chaves em arquivo versionado todas `"role":"anon"`; repositório **público**; 119
funções SQL com **83** `SECURITY DEFINER` com `search_path`, **2 sem**, 34 não-definer. Sem repetir a mesma
bateria no fim, não há como dizer se o plano melhorou algo — e é a única coisa que o dono pode conferir
sozinho.
**Causa raiz:** execução longa sem medição de saída comparável à de entrada.
**Caminho recomendado:** rode **`npm ci` primeiro** (sem `node_modules`, `npx tsc --noEmit` devolve 19.705
erros falsos `TS2307` — está nas "cinco coisas" das instruções ao executor). Depois, na ordem, e **cole a
saída de cada um**:

```bash
npx tsc --noEmit; echo "exit=$?"
npx eslint . 2>&1 | tail -3
npm run lint:budget
npm run validate:csp
npm run validate:no-console
npm run security-scan
npm audit --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).metadata.vulnerabilities))"
npm run test:rls
npm run test:security
npx vitest run 2>&1 | tail -15
npm run test:coverage 2>&1 | tail -10
git ls-files .env; git check-ignore .env || echo ".env NAO ignorado"
```

Monte uma tabela em `05-PROGRESSO.md` com três colunas — **início (02-CENARIOS §0) · fim (medido hoje) ·
diferença** — uma linha por gate, e escreva uma frase por linha que **piorou**. Só então, e só se nenhuma
etapa estiver pendente de merge, rode `npm run lint:budget:ratchet` para travar o ganho de lint (teto =
contagem real, encerrando a margem reservada na etapa 269) e registre o número final. **Atalho tentador a
evitar:** rodar só os gates que você espera verdes. A bateria vale pela comparação completa; omitir o
`test:rls` ou o `audit` por "ser demorado" transforma o relatório final em opinião.
**Arquivos e objetos a tocar:** `docs/qa/05-PROGRESSO.md` (tabela de comparação), `.warning-budget.json`
(apenas o ratchet final)
**Não tocar / armadilhas:** **não** rode o ratchet se alguma etapa de código ainda estiver por mergear — o
teto ficaria colado na contagem e a próxima PR do plano reprovaria (é exatamente a situação que H-10
descreve). Se algum gate ficar vermelho, **não conserte aqui**: registre e abra `fix:` em branch nova
(`AGENTS.md`). E lembre: `npx vitest run` roda a suíte inteira e é longo — reserve tempo em vez de
interrompê-lo e anotar "não rodou".
**Depende de:** 284, 294, 298, e todas as etapas de código mergeadas · **Libera:** 300
**Risco e como reverter:** o ratchet pode travar o orçamento num número que a próxima PR não alcança; é o
objetivo, mas avise no corpo da PR. `git revert` devolve o teto anterior.
**Precisa de aprovação humana antes do merge:** sim (altera `.warning-budget.json`, que é gate de CI)
**Como verificar:** a tabela início/fim/diferença em `05-PROGRESSO.md`, com as 11 linhas de `02-CENARIOS`
§0 cobertas e a saída de cada comando colada. Esperado, no mínimo: typecheck segue **0**; `lintErrors`
segue **0**; avisos **menores** que 105; `security-scan` **sem** o aviso de allowlist (etapa 270);
cobertura ≥ os pisos da etapa 284.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso

### Etapa 300 — Relatório final de uma página para o dono

**Onda / Severidade / Camada:** 8 / Alta / comunicação
**Achados resolvidos:** —
**Problema hoje:** o dono **não é dev** e decide negócio (`AGENTS.md`, seção Postura). Ao fim de 300 etapas
ele precisa de uma página que responda quatro perguntas, e nada mais: **o que deixou de ser risco**, **o que
ainda é**, **o que depende de uma decisão dele** e **quanto custa não decidir**. Hoje essa informação está
espalhada por `03-ACHADOS.md` (1853 linhas), `05-PROGRESSO.md` e dezenas de PRs.
**Causa raiz:** resultado técnico sem tradução para decisão de negócio.
**Caminho recomendado:** escreva `docs/qa/06-RELATORIO-FINAL.md`, **uma página**, nesta ordem e sem
introdução, recapitulação ou cortesia (`AGENTS.md`, seção Comunicação): (1) **Três linhas de resultado** —
quantos achados resolvidos de quantos, e os dois ou três de maior efeito no negócio, ditos em efeito, não em
técnica (exemplo: _"exclusão em massa de clientes passou a pedir confirmação — era o caminho mais curto para
perda de dado"_, não _"ConfirmDialog em BulkActions.tsx"_). (2) **O que ainda é risco**, por ordem de dano,
com uma frase cada e o ID do achado. (3) **Decisões esperando o dono** — a lista da etapa 298, agrupada por
assunto, cada item com o link da PR, o que muda e **o que acontece se nada for decidido**; é a seção mais
importante da página. (4) **Os números**, só a linha que muda decisão: a tabela da etapa 299 resumida a
três ou quatro linhas. (5) **O que a auditoria não pôde verificar**, com o motivo (banco ao vivo, painéis de
terceiro, ausência de staging) — seguindo o padrão honesto dos seis `docs/PLANO_*_ETAPAS.md`, que declaram
"Não verificado" explicitamente (H-08). Feche com o aprendizado operacional em uma linha, porque é o que
evita a repetição: _documentação errada neste repositório é instrução errada — um documento sem data, sem
commit e sem o nome do banco custou mais que qualquer bug encontrado_ (H-01 a H-09).
**Atalho tentador a evitar:** anexar a lista das 300 etapas. O dono não revisa diff nem executa passo manual
(`AGENTS.md`); etapa é unidade de trabalho do agente, não informação de decisão. Igualmente a evitar:
declarar "sistema 100% corrigido" — é o erro de enquadramento de `docs/PERFEICAO_10_10.md` (H-05), e esta
auditoria nasceu de documentos assim.
**Arquivos e objetos a tocar:** `docs/qa/06-RELATORIO-FINAL.md` (novo)
**Não tocar / armadilhas:** o arquivo deve **datar-se** e citar o commit da `main` no alto, mais o banco a
que se refere (`jvfhclubfpxrtrrazrgr`) — exatamente o que faltava no `ESTADO_ATUAL.md` e gerou o achado mais
caro do grupo H. Não repita números sem fonte: cada um cita a etapa ou o arquivo que o mediu. Se você não
executou a bateria da etapa 299, **não escreva número nenhum** — escreva que não foi medido.
**Depende de:** 297, 298, 299 · **Libera:** —
**Risco e como reverter:** nenhum risco funcional; o risco é de enquadramento (relatório otimista faz o dono
parar de olhar o que ficou aberto). `git revert`.
**Precisa de aprovação humana antes do merge:** não (é entrega **para** o dono; ele lê, não aprova)
**Como verificar:**

```bash
wc -l docs/qa/06-RELATORIO-FINAL.md
grep -n 'jvfhclubfpxrtrrazrgr' docs/qa/06-RELATORIO-FINAL.md
grep -c 'https://github.com/adm01-debug/Loggi_Flow_V2/pull/' docs/qa/06-RELATORIO-FINAL.md
```

Esperado: cabe em uma página (ordem de 60 a 90 linhas); nomeia o banco e a data; e há um link de PR para
cada decisão listada na seção 3. Feche a execução do plano com o link do relatório e o estado: quantos
achados resolvidos, quantos abertos, quantas PRs esperando o dono.
**Checklist de conclusão:**

- [ ] mudança aplicada só nos arquivos listados
- [ ] typecheck, lint e testes dos arquivos tocados passam
- [ ] verificação acima executada, com a evidência registrada
- [ ] deploy confirmado, quando se aplica
- [ ] etapa marcada no arquivo de progresso
