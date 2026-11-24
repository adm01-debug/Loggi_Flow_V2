# 05 — PROGRESSO

> Arquivo de trabalho do agente executor. **Marque cada etapa aqui ao concluí-la** — é o último item do
> checklist de todas as 300 etapas, e é o único lugar que diz onde a execução parou.
>
> Plano: `04-PLANO.md` · Achados: `03-ACHADOS.md` · Base: `main` em `d37ba30` (2026-11-22/23)

## Como marcar

- `[x]` — etapa **concluída**: mudança aplicada **e** verificação executada, com a evidência anotada na
  seção "Registro de execução" no fim deste arquivo. Sem evidência, não marque.
- `[~]` — etapa **aberta aguardando o dono**: é uma das 64 marcadas com aprovação humana, a PR está aberta e
  o dono foi avisado.
- `[!]` — etapa **bloqueada**: o código já não corresponde ao descrito (regra 2), ou falta acesso (banco,
  segredo, painel). Anote o motivo no registro e **siga para a próxima etapa independente**.
- `[ ]` — ainda não começou.

## Antes da etapa 001

- [ ] `npm ci` rodado neste clone (sem isso o typecheck devolve 19.705 erros falsos)
- [ ] **Etapas 267, 268 e 269 executadas** — são elas que abrem margem no orçamento de avisos de lint, que
      está no teto exato (105/105). Sem isso, a primeira etapa que gerar um aviso reprova a CI
- [ ] Li as "cinco coisas que você precisa saber" em `04-PLANO.md`
- [ ] Conferi que são **10** os checks obrigatórios, não 9

---

## Etapas

### Onda 1

- [x] **001** — Remover a condicional que desliga a verificação de assinatura do webhook do Nexus — onda 1 — Crítica
- [~] **002** — Confirmar com o dono se `NEXUS_WEBHOOK_SECRET` está configurado em produção — onda 1 — Crítica · **aguarda o dono**
- [x] **003** — Criar `requireRole` em `_shared/auth.ts` — onda 1 — Crítica
- [x] **004** — `webhook-status`: exigir chamador interno ou papel de admin — onda 1 — Crítica
- [x] **005** — `webhook-status`: filtrar `client_webhooks` por dono e registrar quem disparou — onda 1 — Alta
- [~] **006** — `evolution-whatsapp`: exigir papel para enviar mensagem — onda 1 — Alta · **aguarda o dono**
- [x] **007** — `evolution-whatsapp`: registrar quem enviou cada mensagem — onda 1 — Média
- [~] **008** — `melhor-envio-api`: o ambiente (produção/teste) passa a ser decidido pelo servidor — onda 1 — Alta · **aguarda o dono**
- [~] **009** — `melhor-envio-api`: exigir papel para cotar — onda 1 — Alta · **aguarda o dono**
- [~] **010** — Confirmar com o dono que `ALLOW_TEST_MODE` não está ligado em produção — onda 1 — Crítica (se ligado) · **aguarda o dono**
- [~] **011** — Fazer o modo de teste dos webhooks impossível de ligar por engano em produção — onda 1 — Média · **aguarda o dono**
- [x] **012** — `health`: trocar `service_role` por uma verificação sem privilégio — onda 1 — Média
- [x] **013** — `health-check`: parar de chamar a API administrativa de usuários e exigir sessão — onda 1 — Média
- [~] **014** — Decidir com o dono qual dos dois endpoints de saúde fica aberto e fechar o outro no `config.toml` — onda 1 — Média · **aguarda o dono**
- [x] **015** — Tirar o `.env` do controle de versão, sem reescrever histórico — onda 1 — Alta
- [~] **016** — Corrigir o `AGENTS.md` e o comentário da CI que afirmam que o repositório é privado — onda 1 — Alta · **aguarda o dono**
- [~] **017** — Levar ao dono a decisão sobre a visibilidade do repositório — onda 1 — Alta · **aguarda o dono**
- [~] **018** — Transformar "não commite `.env`" em teste automático — onda 1 — Média · **aguarda o dono**
- [~] **019** — Mapbox: confirmar a restrição do token e remover a variável que ninguém mais usa — onda 1 — Média · **aguarda o dono**

### Onda 0

- [x] **020** — Gerador de contexto: parar de afirmar "sem RLS" quando o arquivo tem DDL dinâmico — onda 0 — Alta
- [x] **021** — Separar, nos resumos gerados, "tabela sem RLS" de "não deu para saber" — onda 0 — Alta
- [x] **022** — Teste de regressão: partição protegida por `DO $$` não pode aparecer como "sem RLS" — onda 0 — Média

### Onda 1

- [x] **023** — Consultar o banco ao vivo e decidir o estado de RLS das três tabelas suspeitas — onda 1 — Crítica (se confirmado) — **F-02 refutado**
- [x] **024** — Habilitar RLS em `scheduled_reports` — onda 1 — Crítica · **não se aplica: já habilitado (etapa 023)**
- [x] **025** — Habilitar RLS nas duas tabelas de geo-blocking, depois de conferir o caminho de escrita da tela — onda 1 — Crítica · **não se aplica: já habilitado (etapa 023)**
- [x] **026** — Confirmar no banco ao vivo a unicidade de `numero_coleta`, `numero_entrega` e do código de rastreio — onda 1 — Alta (se ausente) — **UNIQUE presente nos números; ausente no código de rastreio**
- [~] **027** — Criar a unicidade que faltar nos números e no código de rastreio — onda 1 — Alta · **aguarda o dono**

### Onda 3

- [x] **028** — Criar no banco a função que diz se uma transição de entrega é válida — onda 3 — Crítica · **aplicada** (`20261124090000_fn_valida_transicao_entrega.sql`, run `45382701775`)
- [x] **029** — Trigger `BEFORE UPDATE` em `entregas` recusando transição inválida — onda 3 — Crítica · **aplicado** (`20261124090100_...`, run `45382772891`; trigger `a_valida_transicao_entregas` no catálogo)
- [x] **030** — Mesma proteção para `coletas`: função de validação e trigger — onda 3 — Crítica · **aplicado** (`20261124090200_...`, run `45382829524`; trigger `a_valida_transicao_coletas`)
- [x] **031** — Levar a regra "não despacha sem nota fiscal" para o banco — onda 3 — Crítica · **aplicado** (`20261124090300_trigger_entrega_nf_obrigatoria.sql`, run `45382898191`)
- [x] **032** — Testar função, triggers e regra da NF num Postgres descartável, antes de produção — onda 3 — Crítica · `node --test scripts/audit/sql.unit.mjs` → **29 testes, 0 falhas, 0 pulados**
- [x] **033** — Aplicar as migrações da máquina de estados no banco, com o dono presente — onda 3 — Crítica · **4 despachos de `aplicar-migration.yml`, todos `success`**; catálogo do banco regenerado na PR #419
- [x] **034** — Extrair o mapa de transições para um módulo compartilhado, completo e testado — onda 3 — Alta
- [x] **035** — `Despachos` passa a usar o mapa compartilhado — onda 3 — Alta
- [x] **036** — `KanbanEntregas` valida a transição antes de gravar — onda 3 — Alta
- [x] **037** — Traduzir a recusa do banco em mensagem que o operador entende — onda 3 — Média · **fechada depois da 033**: contrato `23514` vivo no banco e `mensagemRecusaTransicao` ligada em `Despachos.tsx:253`, `KanbanEntregas.tsx:344` e `Envios.tsx` (#420); 19 casos em `src/lib/statusTransitions.test.ts`
- [x] **038** — `CotacaoMultiCanal`: a tabela da tela passa a ler do banco, não do `useState` — onda 3 — Crítica
- [~] **039** — Registrar a resposta da transportadora no banco, não na memória — onda 3 — Crítica — **código no PR da 038; aguarda verificação em runtime (registrar resposta e conferir `valor_cotado`/`responded_at` no banco)**
- [x] **040** — Marcar no banco qual cotação foi a escolhida — onda 3 — Alta
- [~] **041** — "Nexus Blast" e o envio por e-mail passam a criar a cotação no banco — onda 3 — Alta — **código já entregue na 038; verificação em runtime depende de credencial de transportadora (dono)**
- [x] **042** — Mostrar carregando, erro e vazio na tela de cotação multicanal — onda 3 — Média
- [~] **043** — Decidir com o dono o que fazer com as duas telas de cotação — onda 3 — Alta · **aguarda o dono**
- [x] **044** — `Despachos`: avisar quando o avanço de status não gravou — onda 3 — Alta
- [x] **045** — `Despachos`: avisar quando a autorização de despacho final não gravou — onda 3 — Alta
- [x] **046** — BOX: não registrar alocação no histórico quando a alocação não aconteceu — onda 3 — Alta
- [x] **047** — Parar de mandar `version + 1` do navegador no Kanban — onda 3 — Média
- [x] **048** — Extrair a checagem de conflito para um utilitário, com teste — onda 3 — Média

### Onda 1

- [x] **049** — `BulkActions`: ação destrutiva passa a pedir confirmação — onda 1 — Crítica
- [x] **050** — Deixar cada tela escrever o texto da própria confirmação — onda 1 — Alta
- [x] **051** — Exigir digitação para confirmar exclusão em massa de cadastro — onda 1 — Alta
- [x] **052** — Teste do `BulkActions`: ação destrutiva não executa sem confirmação — onda 1 — Média
- [x] **053** — `Transportadoras`: trocar exclusão real por exclusão lógica — onda 1 — Alta
- [x] **054** — Filtrar `deleted_at IS NULL` em todas as leituras de `transportadoras` — onda 1 — Alta
- [x] **055** — Migration: acrescentar `deleted_at` a `fretes_internos` — onda 1 — Alta · **aplicada** em 2026-11-24
- [x] **056** — Aplicar a migration de `deleted_at` e sincronizar os tipos — onda 1 — Alta · **tipos sincronizados** (#426)
- [x] **057** — `FretesInternos`: exclusão lógica e filtro em todas as leituras da tabela — onda 1 — Alta · #427
- [~] **058** — Transformar a política de exclusão lógica em gate automático — onda 1 — Média · **aguarda o dono**
- [x] **059** — Pedir confirmação ao cancelar uma logística reversa — onda 1 — Média

### Onda 8

- [x] **060** — Tirar os dois SQL históricos do lugar onde parecem tarefa pendente — onda 8 — Média · implementada e mergeada em `171f858a` (#340)
- [x] **061** — Registrar, em um lugar só, qual SQL avulso já foi aplicado e onde — onda 8 — Média

### Onda 2

- [x] **062** — Abrir o diálogo de edição de coleta a partir do cartão — onda 2 — Alta
- [x] **063** — Ação "Editar" dentro do diálogo de detalhes da coleta — onda 2 — Média
- [x] **064** — Resincronizar "reversa" e "urgente" quando o diálogo recebe uma coleta — onda 2 — Alta
- [x] **065** — Criar a mutation de exclusão lógica de coleta — onda 2 — Alta
- [x] **066** — Ligar a exclusão de coleta na interface, com confirmação — onda 2 — Alta
- [x] **067** — Conferir que toda consulta de Coletas ignora registro excluído — onda 2 — Alta

### Onda 4

- [x] **068** — Remover o hook `useSelfHealing` — onda 4 — Média
- [x] **069** — Remover o hook `useNexusSimulator` — onda 4 — Média
- [~] **070** — Decidir o destino da RPC `reconcile_pending_freights` e da tabela que ela não tem — onda 4 — Média · **aguarda o dono**
- [~] **071** — Levar ao dono a decisão sobre `push-send` — onda 4 — Média · **aguarda o dono**
- [~] **072** — Executar a decisão sobre `push-send` — onda 4 — Média · **aguarda o dono**
- [~] **073** — `ingest-biosync`: decidir o destino de uma função que recebe dado de biometria e ninguém usa — onda 4 — Média · **aguarda o dono**
- [~] **074** — Levantar o uso real dos três buckets antes de qualquer decisão — onda 4 — Média · **aguarda o dono**
- [~] **075** — `comprovantes`: um caminho só para o comprovante de entrega — onda 4 — Média · **aguarda o dono**
- [~] **076** — `entregas-fotos`: ligar a foto de entrega ou remover o bucket — onda 4 — Média · **aguarda o dono**
- [x] **077** — Remover `uploadDocument` de `storageService.ts` — onda 4 — Média
- [x] **078** — Recusar arquivo cuja assinatura não é conhecida — onda 4 — Média
- [x] **079** — Teste unitário da validação de assinatura de arquivo — onda 4 — Média
- [x] **080** — Provar, arquivo por arquivo, quais dos oito "hooks sem importador" estão realmente mortos — onda 4 — Baixa
  <!-- Veredictos (261123):
                      1. components/accessibility/index.ts — VIVO por caminho direto (SkipLinks, LiveRegionProvider, ReducedMotionProvider importados em MainLayout.tsx:13, LazyProviders.tsx:8-9)
                      2. components/common/index.ts — VIVO (barril; exports EmptyState, ConfirmDialog, Pagination… em uso por caminhos diretos)
                      3. components/pwa/index.ts — VIVO por caminho direto (OfflineBanner, InstallPrompt, UpdatePrompt em MainLayout.tsx:14,47,52)
                      4. hooks/gamification/useGamification.ts — VIVO (importado por GamificationPanel, LevelUpModal, AppSidebar, Header, FavoriteMetricsBar via caminho sem extensão)
                         hooks/gamification/useGamification.tsx — INDEFINIDO: 349 linhas vs .ts 259, implementações divergem; comentário P18 em authService.ts:43 indica .tsx como schema em uso; aguarda decisão do dono
                      5. hooks/rodonaves/index.ts — VIVO por caminho direto (useSLOTargets, useSLOSnapshots, useGatewayHealth importados em RTEGateway* panels)
                      6. hooks/ai/useNexusSimulator.ts — REMOVIDO em etapa 069 (PR #300)
                      7. hooks/security/useSelfHealing.ts — REMOVIDO em etapa 068 (PR #300)
                      8. utils/performance.ts — MORTO: useRenderingMonitor e measureAction sem nenhum importador (grep -rn "useRenderingMonitor\|measureAction" src/ → vazio) -->
- [x] **081** — Remover só o que a etapa 080 provou morto — onda 4 — Baixa
  <!-- Removido: src/utils/performance.ts (useRenderingMonitor + measureAction, zero importadores) -->
- [x] **082** — Remover `_shared/service-wrapper.ts`, que nenhuma função usa — onda 4 — Baixa

### Onda 2

- [x] **083** — Estabilizar os callbacks dentro de `useRealtime` (corrige as 12 telas de uma vez) — onda 2 — Crítica
- [x] **084** — `Envios`: callbacks de tempo real estáveis — onda 2 — Crítica
- [x] **085** — `KanbanEntregas`: callbacks de tempo real estáveis — onda 2 — Crítica
- [x] **086** — `Index` (painel): estabilizar a primeira assinatura, de `entregas` — onda 2 — Crítica
- [x] **087** — `Index` (painel): estabilizar a segunda assinatura, de `coletas` — onda 2 — Crítica
- [x] **088** — `Coletas`: estabilizar a chave da assinatura — onda 2 — Crítica
- [x] **089** — `AuditTrailViewer`: callback de tempo real estável — onda 2 — Alta
- [x] **090** — `RastreamentoMotorista`: callback de tempo real estável — onda 2 — Alta
- [x] **091** — `Ranking`: callback de tempo real estável — onda 2 — Média
- [x] **092** — `SLADashboard`: callbacks de tempo real estáveis — onda 2 — Alta
- [x] **093** — `Notificacoes`: callbacks de tempo real estáveis — onda 2 — Alta
- [x] **094** — `Despachos`: callbacks de tempo real estáveis — onda 2 — Crítica
- [x] **095** — `CustosDashboard`: estabilizar `handleRefetch` — onda 2 — Média
- [x] **096** — Escrever o contrato no alto de `useRealtime` e varrer os chamadores — onda 2 — Crítica
- [x] **097** — `Despachos`: ler o erro da consulta — onda 2 — Alta
- [x] **098** — `Despachos`: parar de dizer "Fila Limpa" quando a consulta falhou — onda 2 — Crítica
- [x] **099** — `Envios`: erro com componente e botão de tentar de novo — onda 2 — Alta
- [x] **100** — `Clientes`: erro com componente e botão de tentar de novo — onda 2 — Alta
- [x] **101** — `Fornecedores`: erro com componente e botão de tentar de novo — onda 2 — Alta
- [x] **102** — `FretesInternos`: erro com componente e botão de tentar de novo — onda 2 — Alta
- [x] **103** — `Ocorrencias`: erro com componente e botão de tentar de novo — onda 2 — Alta

### Onda 4

- [x] **104** — Fazer a gravação de preferências de previsão avisar quando falha — onda 4 — Alta
- [x] **105** — Meta de acurácia e dias de alerta: parar de engolir o erro — onda 4 — Alta
- [x] **106** — Interruptor de aviso por e-mail: parar de engolir o erro — onda 4 — Alta
- [x] **107** — Endereço de e-mail do aviso: parar de engolir o erro — onda 4 — Alta
- [x] **108** — Interruptor de aviso por WhatsApp: parar de engolir o erro — onda 4 — Alta
- [x] **109** — Telefone de WhatsApp: parar de engolir o erro e fechar o achado — onda 4 — Alta
- [x] **110** — Rodonaves: mostrar a falha da sincronização em vez de engoli-la — onda 4 — Alta
- [x] **111** — Rodonaves: atualizar a lista de entregas depois de sincronizar — onda 4 — Alta
- [x] **112** — Rodonaves: atualizar também as ocorrências criadas pela sincronização — onda 4 — Média
- [x] **113** — Alertas de SLA: avisar quando a gravação da notificação falha — onda 4 — Alta
- [x] **114** — Alertas de SLA: fazer o sino acender sem recarregar — onda 4 — Alta
- [x] **115** — Nexus Blast: contar só as cotações que voltaram — onda 4 — Média
- [x] **116** — Nexus Blast: dizer **quais** transportadoras falharam — onda 4 — Média
- [x] **117** — Importação em massa: guardar a mensagem de erro de cada lote — onda 4 — Média
- [x] **118** — Importação em massa: parar de condenar o lote inteiro por causa de uma linha — onda 4 — Média
- [x] **119** — Importação em massa: mostrar e exportar as linhas que falharam — onda 4 — Média
- [~] **120** — Importação em massa: decidir se o histórico deve sobreviver à tela — onda 4 — Média · **aguarda o dono**
- [x] **121** — VERIFICAR se o duplo clique cria registro duplicado (o achado é hipótese) — onda 4 — Média
- [x] **122** — Fechar os formulários que a etapa 121 encontrou desprotegidos — onda 4 — Média

### Onda 5

- [x] **123** — `useSLANotifications`: cancelar os cinco temporizadores de aviso e de som — onda 5 — Baixa
- [x] **124** — `useOnboarding`: cancelar o temporizador da notificação de conquista — onda 5 — Baixa
- [x] **125** — `useAchievementNotifications`: cancelar o auto-descarte da notificação — onda 5 — Baixa
- [x] **126** — `useImportData`: cancelar o reset de dois segundos — onda 5 — Baixa
- [x] **127** — `useDocumentUpload` e `useSecurityPushNotifications`: os dois últimos temporizadores — onda 5 — Baixa
- [x] **128** — `useBoxManagement`: canal de tempo real com nome único — onda 5 — Média
- [x] **129** — `useMapWeatherSync`: canal de zonas de risco com nome único — onda 5 — Média
- [x] **130** — `useSmartAlerts`: canal de alertas táticos com nome único — onda 5 — Média
- [x] **131** — `useNexusHealth`: canal da sonda de latência com nome único, e fim do achado — onda 5 — Média

### Onda 3

- [x] **132** — Confirmar no banco ao vivo que a unicidade da tabela de marcador existe — onda 3 — Crítica
- [x] **133** — `lalamove-webhook`: trocar "consulta e depois grava" por "grava primeiro e trata o conflito" — onda 3 — Crítica
- [x] **134** — `lalamove-webhook`: remover a gravação tardia do marcador — onda 3 — Alta
- [x] **135** — `rodonaves-webhook`: trocar "consulta e depois grava" por "grava primeiro e trata o conflito" — onda 3 — Crítica
- [x] **136** — `rodonaves-webhook`: remover a gravação tardia do marcador — onda 3 — Alta
- [x] **137** — Teste automatizado: o mesmo evento enviado duas vezes grava o dado de negócio uma vez — onda 3 — Alta
- [x] **138** — Criar `buildEventKey` em `_shared/idempotency.ts`, copiando a chave da Rodonaves — onda 3 — Alta
- [x] **139** — `lalamove-webhook`: eliminar o `crypto.randomUUID()` da chave de dedupe — onda 3 — Alta
- [x] **140** — `nexus-webhook-receiver`: eliminar o `Date.now()` da chave de dedupe — onda 3 — Alta
- [x] **141** — `carrier-webhook-receiver`: chave estável demais está engolindo evento verdadeiro — onda 3 — Alta
- [x] **142** — Gate de `grep`: nenhuma chave de dedupe pode conter valor aleatório ou relógio — onda 3 — Média · gate `npm run validate:dedupe-keys` criado (PR #439); **não ligado à CI por decisão da própria etapa**
- [x] **143** — `scheduled-reports`: lista de campos permitidos no `insert` — onda 3 — Crítica
- [x] **144** — `scheduled-reports`: a mesma lista de campos permitidos no `update` — onda 3 — Crítica
- [x] **145** — `scheduled-reports`: validar `action` e `reportId`, e testar o descarte de campo não permitido — onda 3 — Alta

### Onda 5

- [x] **146** — `smart-carrier-selection`: validar `peso_kg` e os números do cálculo de frete — onda 5 — Alta
- [x] **147** — `webhook-status`: exigir `data` antes de desestruturar — onda 5 — Alta
- [x] **148** — `ingest-biosync`: validar `heart_rate` como número antes de comparar com o limite — onda 5 — Alta
- [x] **149** — `lalamove-api`: `path` e `method` do corpo decidem o roteamento sem `requireEnum` — onda 5 — Alta
- [x] **150** — `resend-email`: validar `to`, `subject` e `html` antes de entregar ao provedor — onda 5 — Alta
- [x] **151** — `melhor-envio-api`: validar o corpo da cotação — onda 5 — Média
- [x] **152** — `lalamove-tracking`: validar o identificador de rastreio — onda 5 — Média
- [x] **153** — `ai-logistics-assistant`: validar e limitar o texto que vai para o modelo — onda 5 — Média
- [x] **154** — `evolution-whatsapp`: validar `instance`, `phone` e `message` — onda 5 — Alta
- [x] **155** — `ocr-receipt-processor`: validar a entrada do comprovante — onda 5 — Média
- [x] **156** — Criar `_shared/invokeFunction.ts`: chamada entre funções com tempo limite — onda 5 — Alta
- [x] **157** — `normalize-freight-response`: trocar o `fetch` nu para `whatsapp-notification` — onda 5 — Alta
- [x] **158** — `ingest-biosync`: trocar o `fetch` nu para `bitrix24-integration` — onda 5 — Média
- [x] **159** — `nexus-webhook-receiver`: tempo limite nas duas chamadas internas dentro do webhook — onda 5 — **Crítica**
- [x] **160** — `send-password-reset`: tempo limite na chamada interna — onda 5 — Alta
- [x] **161** — `predict-delays` e `predict-delays-scheduled`: tempo limite nas chamadas internas — onda 5 — Média
- [x] **162** — `accuracy-meta-monitor`: tempo limite nas duas chamadas internas — onda 5 — Média
- [x] **163** — `accuracy-weekly-digest`: tempo limite na chamada interna — onda 5 — Média
- [x] **164** — Criar `_shared/httpError.ts`: uma resposta de erro que não vaza o detalhe interno — onda 5 — Alta
- [x] **165** — `ingest-biosync`: parar de devolver o erro do Postgres — onda 5 — Alta
- [x] **166** — `scheduled-reports`: parar de devolver o erro do Postgres — onda 5 — Alta
- [x] **167** — `lgpd-erase-user`: parar de devolver o erro do Postgres — onda 5 — Alta
- [x] **168** — `execute-protocol`: parar de devolver o erro do Postgres — onda 5 — Alta
- [x] **169** — `lalamove-api`: parar de repassar a resposta de erro da Lalamove — onda 5 — Alta
- [x] **170** — `rodonaves-api`: parar de transformar o erro do **login** da Rodonaves em mensagem — onda 5 — **Crítica**
- [x] **171** — `rodonaves-api`: erro genérico na resposta e detalhe só no log — onda 5 — Alta
- [x] **172** — `resend-email`: parar de repassar o erro do provedor de e-mail — onda 5 — Alta
- [x] **173** — `db-health-weekly-report`: parar de repassar o erro do terceiro no relatório — onda 5 — Média
- [x] **174** — `nexus-webhook-receiver`: erro genérico na resposta ao webhook — onda 5 — Média
- [x] **175** — `lalamove-webhook`: erro genérico na resposta ao webhook — onda 5 — Média
- [x] **176** — `rodonaves-webhook`: erro genérico na resposta ao webhook — onda 5 — Média
- [x] **177** — `smart-carrier-selection`: erro genérico na resposta da cotação — onda 5 — Média
- [x] **178** — Varredura final de `error.message`: as onze funções restantes de B-06 — onda 5 — Média
- [x] **179** — `secure-store`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — **Crítica**
- [x] **180** — `get-mapbox-token`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — **Crítica**
- [x] **181** — `resend-email`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **182** — `whatsapp-notification`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **183** — `push-send`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **184** — `new-device-alert`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **185** — `send-password-reset`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **186** — `validate-login`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **187** — `log-login-attempt`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [x] **188** — `log-security-event`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [x] **189** — `check-password-breach`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [x] **190** — `bitrix24-integration`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **191** — `execute-protocol`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **192** — `ingest-biosync`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **193** — `ocr-receipt-processor`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [x] **194** — `webhook-status`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [x] **195** — `normalize-freight-response`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [x] **196** — `nexus-auto-healing`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [x] **197** — `accuracy-weekly-digest`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Baixa dentro do grupo, mas manipula dado
- [x] **198** — `geocode-address`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [x] **199** — `ingest-biosync`: deduplicar a telemetria do dispositivo — onda 5 — Média
- [x] **200** — `push-send`: tempo limite no envio ao provedor de push — onda 5 — Média
- [x] **201** — Corrigir o comentário de `fetch-with-timeout.ts` que promete retentativa inexistente — onda 5 — Baixa

### Onda 6

- [x] **202** — Criar `useServerPagination` e **definir** o contrato de paginação no servidor — onda 6 — Crítica
- [x] **203** — Documentar o contrato de paginação e marcar `usePagination` como "só memória" — onda 6 — Alta
- [x] **204** — `useTrackingAnalytics`: pôr teto no servidor na leitura de `rastreamento_historico` — onda 6 — Crítica
- [x] **205** — `Analytics.tsx`: passar o intervalo de datas que a tela já tem para `useTrackingAnalytics` — onda 6 — Crítica
- [x] **206** — `useTrackingAnalytics`: tornar a janela de datas obrigatória na assinatura — onda 6 — Alta
- [x] **207** — `useLogisticsCalendar`: pôr teto na leitura de `coletas` — onda 6 — Alta
- [x] **208** — `useLogisticsCalendar`: pôr teto na leitura de `entregas` — onda 6 — Alta
- [x] **209** — `useLogisticsCalendar`: filtrar no servidor pelo mês que está na tela — onda 6 — Alta
- [x] **210** — `useCotacoesMulticanal`: teto no servidor e colunas explícitas — onda 6 — Alta
- [x] **211** — Guard automatizado: consulta de listagem sem teto reprova a CI — onda 6 — Alta
- [x] **212** — `Notificacoes.tsx`: teto imediato na leitura de `notifications` — onda 6 — Alta
- [x] **213** — `Notificacoes.tsx`: adotar `useServerPagination` como primeiro consumidor do contrato — onda 6 — Alta
- [x] **214** — `Notificacoes.tsx`: trocar a barra de paginação em memória pela do servidor — onda 6 — Média
- [x] **215** — `Notificacoes.tsx`: levar os filtros e a busca para o servidor — onda 6 — Alta
- [x] **216** — `Notificacoes.tsx`: o tempo real deixa de rebaixar a lista inteira a cada aviso — onda 6 — Alta
- [x] **217** — `useAccuracyMetaCycle`: uma única consulta a `notifications` para todas as linhas — onda 6 — Média
- [ ] **218** — `count_prediction_breach_days`: variante que responde todas as transportadoras numa chamada — onda 6 — Média
- [x] **219** — `useKPIBenchmark`: tirar os `await` de dentro do laço — onda 6 — Média
- [x] **220** — `useKPIBenchmark`: uma consulta por tabela cobrindo todos os períodos — onda 6 — Média
- [x] **221** — `useExecutiveMetrics`: mesma consolidação de 18 consultas para 3 — onda 6 — Baixa
- [x] **222** — Conferir `types.ts` contra o banco ao vivo e regenerar se houver divergência — onda 6 — Média · migration `20261121153649_user_panel_preferences` aplicada (run `45382402621`) e `types.ts` regenerado pelo `types-sync` (#419) - A-04 fechado
- [x] **223** — `Envios.tsx`: trocar `select("*")` por colunas explícitas em `entregas` — onda 6 — Média
- [x] **224** — `Coletas.tsx`: trocar `select("*")` por colunas explícitas em `coletas` — onda 6 — Média
- [x] **225** — `useDrillDown`: colunas explícitas nas duas leituras — onda 6 — Baixa
- [x] **226** — `useSLANotifications`: colunas explícitas nas duas verificações de SLA — onda 6 — Baixa
- [x] **227** — `RelatorioPDF`, `LogisticsService` e `useCotacoesMulticanal`: os três `select("*")` restantes — onda 6 — Baixa · **parcial**: `LogisticsService.getDeliveries` sem chamador, ver A-05
- [x] **228** — Censo dos índices reais de `entregas`, `coletas` e `telemetry_logs` no banco ao vivo — onda 6 — Alta · censo registrado
- [x] **229** — Provar a hipótese: `EXPLAIN (ANALYZE, BUFFERS)` da consulta do Painel SLA — onda 6 — Alta · medido: 0,12 ms
- [x] **230** — Índice para o Painel SLA: `entregas (status, previsao_entrega)` — onda 6 — Alta · **não criar**: já existe equivalente melhor
- [x] **231** — Índice parcial para a desigualdade de status do Kanban — onda 6 — Média · **não criar**: `idx_entregas_active` já entrega a ordem
- [x] **232** — Índice composto `telemetry_logs (severity, created_at DESC)` — onda 6 — Baixa · **medido, não compensa** (0,7 ms)
- [x] **233** — Decidir com o dono sobre `(transportadora_id, created_at)` em `entregas` e `coletas` — onda 6 — Baixa · **medido, não compensa**
- [x] **234** — Censo dos cinco candidatos a índice duplicado, com uso, no banco ao vivo — onda 6 — Média · censo registrado
- [x] **235** — Remover o duplicado de `rastreamento_historico (lalamove_order_id)` — onda 6 — Média · **já removido** pela dedupe de agosto
- [x] **236** — Remover o duplicado de `rastreamento_historico (coleta_id)` — onda 6 — Média · **já removido** pela dedupe de agosto
- [~] **237** — Remover o duplicado de `entregas (transportadora_id)` — onda 6 — Baixa · #428 **aguarda o dono** (DDL)
- [~] **238** — Remover o duplicado de `coletas (transportadora_id)` — onda 6 — Baixa · #428 **aguarda o dono** (DDL)
- [~] **239** — Decidir e remover a sobreposição em `audit_logs (table_name, record_id)` — onda 6 — Baixa · #428 **aguarda o dono** (DDL)
- [~] **240** — Fechar o ciclo: registrar que índice se confere no banco, e conferir que nada regrediu — onda 6 — Alta · **aguarda o dono**

### Onda 8

- [x] **241** — Pôr aviso de obsolescência no alto de `ESTADO_ATUAL.md`, dizendo qual banco ele descreve — onda 8 — Crítica
- [x] **242** — Corrigir no corpo de `ESTADO_ATUAL.md` as três afirmações refutadas por medição — onda 8 — Crítica
- [x] **243** — Avisar e corrigir `ESTADO_ATUAL_EVIDENCIAS.md`: banco medido e contagem de migrations — onda 8 — Alta
- [x] **244** — Pôr aviso de obsolescência e nota de método no alto de `DOCUMENTATION.md` — onda 8 — Alta
- [x] **245** — Corrigir os 29 caminhos de hook citados em `DOCUMENTATION.md` — onda 8 — Alta
- [x] **246** — Marcar em `DOCUMENTATION.md` os 10 componentes que não existem — onda 8 — Alta
- [x] **247** — Corrigir a seção de internacionalização de `DOCUMENTATION.md` — onda 8 — Média
- [~] **248** — Criar verificação automática dos caminhos citados na documentação — onda 8 — Média · **aguarda o dono**

### Onda 0

- [x] **249** — `AGENTS.md`: corrigir a regra de merge para 10 required checks e nomear o décimo — onda 0 — Alta (Regra 8: merge aguarda o dono — PR #329)
- [x] **250** — `AGENTS.md`: dizer que o repositório é público — onda 0 — Alta (Regra 8: merge aguarda o dono — PR #329)
- [x] **251** — `AGENTS.md`: o deploy de edge function é automático em merge para `main` — onda 0 — Alta (Regra 8: merge aguarda o dono — PR #329)

### Onda 8

- [x] **252** — `AGENTS.md`: corrigir a contagem de migrations de 244 para a contagem real — onda 8 — Baixa
- [x] **253** — `AGENTS.md`: corrigir o nome do workflow de contexto (`contexto.yml` → `contexto-ia.yml`) — onda 8 — Baixa
- [x] **254** — Propagar as correções de H-03 para `docs/agentes/github-ci.md` e `docs/agentes/deploy.md` — onda 8 — Média (Regra 8: merge aguarda o dono — PR #329)
- [~] **255** — Fazer a CI conferir os fatos verificáveis que o `AGENTS.md` afirma — onda 8 — Média · **aguarda o dono**
- [x] **256** — `docs/prod-readiness.md`: corrigir as duas contagens de paridade que caducaram — onda 8 — Alta
- [~] **257** — Fazer o inventário semanal recontar a paridade e datar o `prod-readiness` — onda 8 — Média · **aguarda o dono**
- [x] **258** — Rebaixar o enquadramento de "perfeição 10/10" nos dois documentos que o declaram — onda 8 — Média
- [x] **259** — `docs/MELHORIAS.md`: corrigir o hook que nunca existiu e a contagem de edge functions — onda 8 — Média
- [x] **260** — `docs/PLANO_MELHORIAS_2026.md`: corrigir a árvore de hooks que cita `useAnalyticsReal` — onda 8 — Baixa
- [x] **261** — `TEMPLATE_STRUCTURE.md`: parar de ensinar hook na raiz de `src/hooks/` — onda 8 — Baixa
- [x] **262** — `PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md`: corrigir "43 edge functions" para 44 — onda 8 — Baixa
- [~] **263** — Pedir ao dono o secret `SUPABASE_DB_URL`, sem o qual a fonte de contexto do banco nunca é gerada — onda 8 — Alta · **aguarda o dono**
- [x] **264** — Rodar o produtor do contexto de banco e confirmar que `docs/contexto/supabase/` foi publicado — onda 8 — Alta · **553 arquivos publicados**
- [~] **265** — Dizer ao agente o que fazer quando a fonte do banco não existir — onda 8 — Alta · **plano B escrito nos 3 arquivos; altera protocolo, aguarda o dono**
- [~] **266** — Fazer a ausência do snapshot do banco parar de sair verde em silêncio — onda 8 — Média · **aguarda o dono**

### Onda 0

- [x] **267** — **FAÇA ISTO PRIMEIRO (1/3)** — abrir margem no orçamento de lint: `SortIcon` nas três telas de cadastro — onda 0 — Alta (destrava o plano)
- [x] **268** — **FAÇA ISTO PRIMEIRO (2/3)** — usar o `SortIcon` compartilhado nas outras sete telas — onda 0 — Alta (destrava o plano)
- [x] **269** — **FAÇA ISTO PRIMEIRO (3/3)** — pagar os seis avisos do Dashboard Executivo e registrar a margem reservada — onda 0 — Alta (destrava o plano)

### Onda 8

- [~] **270** — Remover as três entradas obsoletas da allowlist de vulnerabilidades — onda 8 — Baixa · **aguarda o dono**
- [x] **271** — Remover o arquivo `x` vazio versionado na raiz — onda 8 — Baixa
- [~] **272** — Decidir com o dono o destino de `bun.lock` e `bun.lockb` — onda 8 — Baixa · **aguarda o dono**
- [~] **273** — Barrar arquivo acidental na raiz antes do merge — onda 8 — Baixa · **aguarda o dono**
- [~] **274** — Tirar do `AGENTS.md` e do `types-sync.yml` a menção aos locks de bun — onda 8 — Baixa · **aguarda o dono**
- [x] **275** — Criar a base de teste de hook e de tela que hoje não existe — onda 8 — Alta · **já estava na `main` (`src/test/`), smoke e testes de referência verdes**
- [x] **276** — Teste da validação de transição de status (trava a correção de C-01) — onda 8 — Crítica
- [x] **277** — Teste da checagem de `count` no controle de concorrência (trava a correção de C-03) — onda 8 — Alta · **`useBoxManagement.test.ts` com 3 casos verdes; sem o guard o caso de conflito falha**
- [x] **278** — Teste da confirmação em exclusão em massa (trava a correção de D-01) — onda 8 — Crítica
- [x] **279** — Teste do fail-closed de assinatura de webhook (trava a correção de S-01) — onda 8 — Crítica
- [x] **280** — Teste da idempotência atômica dos webhooks (trava a correção de B-01) — onda 8 — Crítica
- [x] **281** — Teste do caminho de criar coleta — onda 8 — Alta
- [x] **282** — Teste do caminho de mover entrega de status — onda 8 — Alta
- [~] **283** — Resolver o usuário semeado do `tests/e2e/` e dizer por que ele não roda na CI — onda 8 — Média · **aguarda o dono**
- [~] **284** — Subir os pisos de cobertura para travar o que as etapas 275-282 conquistaram — onda 8 — Média · **PR #442 aberta; aguarda o dono** (altera limiar de gate da CI)
- [~] **285** — Confirmar com o dono se `VITE_SENTRY_DSN` está configurado no Vercel — onda 8 — Média · **aguarda o dono**
- [~] **286** — Provar que um erro de front chega ao Sentry — onda 8 — Média · **aguarda o dono**
- [x] **287** — Verificar no banco ao vivo se `webhook_failures` e `cron_job_logs` existem — onda 8 — Média — **nenhuma das duas existe**
- [~] **288** — Dar destino persistente à falha de webhook de entrada — onda 8 — Média · **aguarda o dono**
- [ ] **289** — Mostrar as falhas de webhook numa tela que já existe — onda 8 — Média
- [~] **290** — Tornar visível a falha de cron, e decidir o destino das tabelas mortas — onda 8 — Média · **aguarda o dono**

### Onda 7

- [x] **291** — `MapboxMap`: parar de interpolar dado de rastreamento dentro de `innerHTML` — onda 7 — Média
- [x] **292** — `MapboxMap`: escapar o texto dos balões do mapa — onda 7 — Média
- [x] **293** — Pôr `rel="noopener noreferrer"` nos quatro links externos que só têm `noreferrer` — onda 7 — Baixa
- [x] **294** — Fazer o lint cobrar link externo e `innerHTML` interpolado — onda 7 — Baixa

### Onda 8

- [~] **295** — Fechar no banco ao vivo os seis achados marcados HIPÓTESE — onda 8 — Alta — **F-02, F-03, P-05 e P-06 fechados com consulta ao banco ao vivo (2026-11-24); S-05 e S-08 dependem do painel, aguardam o dono**
- [x] **296** — Regerar a branch `contexto` para que as fontes reflitam o código corrigido — onda 8 — Média · **regerada em 2026-11-24** (run `45410194923`)
- [x] **297** — Atualizar `03-ACHADOS.md` e `05-PROGRESSO.md` com o estado final de cada achado — onda 8 — Alta
- [x] **298** — Reler o plano inteiro e registrar o que ficou sem etapa executada — onda 8 — Alta
- [~] **299** — Rodar a bateria completa de gates e comparar com os números do começo — onda 8 — Alta · **bateria inteira rodada em 2026-11-24 sobre a `main` (`e42bbf85`); nada piorou, lint caiu de 105 para 80; falta o `lint:budget:ratchet`, que a própria etapa proíbe com PR pendente de merge**
- [x] **300** — Relatório final de uma página para o dono — onda 8 — Alta

---

## Achados novos encontrados durante a execução

Problema novo **não se corrige na hora** (regra 4). Anote aqui, com `arquivo:linha`, e siga a etapa em curso.

| #    | Achado                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Onde (arquivo:linha)                                                                                                                     | Encontrado na etapa | Gravidade estimada |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------ |
| A-01 | **Resolvido na etapa 220**: a consulta de `ocorrencias` do benchmark de KPI nao tinha teto, ao contrario das de `entregas`/`coletas` (`.limit(1000)`); mes com muitas ocorrencias baixava a tabela inteira                                                                                                                                                                                                                                                                       | `src/hooks/analytics/useKPIBenchmark.tsx:67-71`                                                                                          | 219 -> 220          | Baixa              |
| A-02 | O teto de 6000 do benchmark de KPI e **unico para os seis meses**: se a soma dos seis passar de 6000 linhas, o PostgREST corta sem ordem definida e qualquer mes pode perder registros (antes o corte era de 1000 **por mes**)                                                                                                                                                                                                                                                   | `src/hooks/analytics/useKPIBenchmark.tsx:44,49-71`                                                                                       | 220                 | Media              |
| A-03 | O teto unico para os seis meses tambem vale para as metricas executivas (6000/6000/3000): se a soma dos seis meses passar disso, o PostgREST corta sem ordem definida e qualquer mes pode perder registros (antes o corte era por mes -- 1000/1000/500)                                                                                                                                                                                                                          | `src/hooks/analytics/useExecutiveMetrics.tsx:55,62,68`                                                                                   | 221                 | Media              |
| A-04 | **RESOLVIDO na etapa 222**: a migration `20261121153649` da #248 foi aplicada em produção (run `45382402621`) e o `types.ts` deixou de ser editado à mão - passou a ser regenerado pelo `types-sync`, que voltou verde (PR #419). Achado original: **produção não tinha `public.user_panel_preferences`**: a migration `20261121153649` da #248 nunca foi aplicada (último dispatch do `aplicar-migration.yml` é de 20/11, anterior ao arquivo) e o `types.ts` foi editado à mão. Efeito: `useSLAMetas` lança erro ao ler e `PainelSLA.tsx:242-244` mostra `toast.success` incondicional sem persistir nada - o usuário vê "salvo" e as metas de SLA não são gravadas. É também a causa do `types-sync` vermelho desde 23/11 (Gate 1) | `src/hooks/sla/useSLAMetas.ts:31-36`, `src/pages/PainelSLA.tsx:242-244`, `supabase/migrations/20261121153649_user_panel_preferences.sql` | 222                 | **Alta**           |
| A-05 | `LogisticsService.getDeliveries` (`src/features/logistics/services/LogisticsService.ts:8`) mantém `select('*')` porque **não tem chamador**: a classe não é importada em nenhum arquivo de `src/`. Cortar colunas de código morto não economiza banda; o que resolve é apagar ou usar o serviço                                                                                                                                                                                  | `src/features/logistics/services/LogisticsService.ts:5-14`                                                                               | 227                 | Baixa              |

| A-06 | As mutacoes de status vivem duplicadas por tela (`Despachos.tsx` e `KanbanEntregas.tsx`), sem hook comum: regra nova de transicao precisa ser aplicada duas vezes | `src/pages/Despachos.tsx:216-320`, `src/pages/KanbanEntregas.tsx:328` | 282 | Media |
| A-07 | **Mitigado pelo banco na etapa 031** (a tela continua sem aviso previo): o trigger `a_valida_transicao_entregas` recusa `despachado` sem `nf_remessa`, entao o caminho do Kanban nao grava mais estado invalido - o operador recebe a mensagem do banco pelo `onError` de `KanbanEntregas.tsx:344`. `KanbanEntregas.tsx` move entrega para `despachado` sem exigir `nf_remessa` e sem confirmacao; `Despachos.tsx` exige as duas coisas | `src/pages/KanbanEntregas.tsx:328`, `src/pages/Despachos.tsx:256-274` | 282 | **Alta** |
| A-08 | O dialogo do despacho final diz "esta acao e irreversivel", mas `despachado` ainda aceita `em_transito`: o texto promete mais do que a maquina de estados permite | `src/lib/statusTransitions.ts:17`, `src/pages/Despachos.tsx:596-607` | 282 | Baixa |

**Consolidacao (2026-11-24).** Fechamento da tabela: **A-01 resolvido** na etapa 220 e **A-04 resolvido** na
etapa 222 (migration `20261121153649` aplicada em producao e `types.ts` regenerado pelo `types-sync`, que
voltou verde); **A-02, A-03, A-05, A-06 e A-08 seguem abertos** e sao o insumo da proxima auditoria -
nenhum foi corrigido por conta propria (regra 4). **A-07 esta mitigado pelo banco desde a etapa 031** (o
trigger recusa despacho sem NF, mesmo pelo Kanban), mas a tela ainda nao avisa antes de tentar.
Ordem de dano para quem pegar: **A-08**, **A-02/A-03** (teto unico de 6000 linhas cobrindo seis meses),
**A-06** (mutacao de status duplicada por tela) e **A-05** (servico de logistica sem chamador).
Notas de etapa que citam "achado novo" sem passar por esta tabela continuam validas no texto
original; esta tabela e a lista canonica.

## Etapas que não correspondiam mais ao código

Quando a evidência da etapa já não bate (regra 2), registre aqui em vez de adaptar a etapa por conta própria.

| Etapa | O que o plano dizia | O que o código mostra hoje | Decisão |
| ----- | ------------------- | -------------------------- | ------- |
|       |                     |                            |         |

## Verificações de ambiente e de segredo

Resultados das etapas que só confirmam estado. **Nunca escreva o valor de um segredo — só "configurado" ou
"ausente".**

| Etapa | O que foi verificado                                                           | Resultado | Data | Quem confirmou |
| ----- | ------------------------------------------------------------------------------ | --------- | ---- | -------------- |
| 002   | `NEXUS_WEBHOOK_SECRET` existe nas edge functions                               |           |      |                |
| 010   | `ALLOW_TEST_MODE` presente em produção                                         |           |      |                |
| 023   | RLS real de `geo_blocking_rules`, `geo_blocking_settings`, `scheduled_reports` | `relrowsecurity = true` nas três (2, 2 e 4 policies) — F-02 refutado | 2026-11-24 | agente (SQL read-only no `jvfhclubfpxrtrrazrgr`) |
| 026   | `UNIQUE` em `logistica_reversa.codigo_rastreio_reverso`                        | ausente (`coletas.numero_coleta` e `entregas.numero_entrega` com `UNIQUE`, 0 duplicatas) | 2026-11-24 | agente (SQL read-only no `jvfhclubfpxrtrrazrgr`) |
| 285   | `VITE_SENTRY_DSN` configurado no Vercel                                        |           |      |                |
| 287   | `webhook_failures` e `cron_job_logs` existem no banco                           | não existem (`to_regclass` = `null`; `webhook_deliveries` existe) | 2026-11-24 | agente (SQL read-only no `jvfhclubfpxrtrrazrgr`) |
| 295   | Reconferência de F-02, F-03, P-05, P-06, S-05, S-08 no banco ao vivo           | F-02 refutado e F-03 resolvida nos números (etapas 023/026) | 2026-11-24 | agente (SQL read-only no `jvfhclubfpxrtrrazrgr`) |

## Registro de execução

### Registro - etapas 275 e 277 (2026-11-24) - o caminho de conflito do BOX passa a ter teste

**275 - a base de teste ja existia na `main`.** `src/test/renderWithQuery.tsx` (`renderHookWithQuery` com
`QueryClientProvider` e `retry: false`), `src/test/supabaseMock.ts` (duplo encadeavel que devolve
`{ data, error, count }`) e `src/test/testInfra.smoke.test.ts`. A verificacao da etapa rodou assim:

```
npx vitest run src/test/testInfra.smoke.test.ts src/hooks/logistics/useRuleTriggers.test.tsx \
  src/hooks/common/useBulkActions.test.ts
-> Test Files 3 passed (3) - Tests 14 passed (14)
```

**277 - o teste que faltava.** Arquivo novo `src/hooks/logistics/useBoxManagement.test.ts`, cobrindo a
mutacao de alocacao de BOX onde ela mora (`src/hooks/logistics/useBoxManagement.tsx:145-164`), com duplo
proprio do Supabase para controlar `count`, `error` e o `insert` de `kanban_history`:

| caso | duplo devolve | esperado |
| --- | --- | --- |
| versao casou | `{ count: 1, error: null }` | aloca com `{ count: "exact" }`, grava `kanban_history` com `notes = "Alocado ao BOX 03"` e anuncia sucesso |
| registro alterado por outro usuario | `{ count: 0, error: null }` | rejeita com `Conflito de versao`, **nao** grava `kanban_history` e **nao** anuncia sucesso |
| erro do banco | `{ error: { message: "permission denied..." } }` | rejeita com o motivo do banco e nao grava historico |

```
npx vitest run src/hooks/logistics/useBoxManagement.test.ts
-> Test Files 1 passed (1) - Tests 3 passed (3)
```

**Prova negativa (o teste mede algo):** com `assertAtualizou(count)` comentado em
`useBoxManagement.tsx:152`, o caso de `count 0` **falha**:
`AssertionError: promise resolved "undefined" instead of rejecting` (1 failed | 2 passed). Arquivo de
producao restaurado em seguida (`git diff` vazio).

**Lint e orcamento:** `npx eslint` no arquivo novo -> sem saida (limpo); `npm run lint:budget` ->
`ESLint warnings 80 / 86`, `ESLint errors 0 / 0`, `TypeScript errors 0 / 0`, `All checks within budget`.

**Despachos:** o outro lado da 277 ja estava coberto por `src/pages/Despachos.test.tsx` (casos `count 1`,
`count 0` e erro do banco). A mutacao daquela tela vive na propria pagina, nao em hook.

### Registro - etapas 023, 026 e 287 (2026-11-24) - o banco ao vivo responde: RLS já estava ligado, os números são únicos e as tabelas de log não existem

**Banco consultado:** `jvfhclubfpxrtrrazrgr` (o de produção). **Método:** SQL **somente leitura** pelo
endpoint de consulta do Supabase Management API (`POST /v1/projects/jvfhclubfpxrtrrazrgr/database/query`),
com o token da CLI já autenticada nesta máquina — a consulta de identificação devolveu
`current_database() = postgres`. Nenhum `ALTER`, `CREATE` ou `DROP` foi enviado. **Data:** 2026-11-24.

**Etapa 023 — F-02 refutado.** Consulta ao catálogo (`pg_class` + `pg_policies`, a mesma fonte que o
`get_rls_audit` usa):

| tabela                  | `relrowsecurity` | `relforcerowsecurity` | policies |
| ----------------------- | ---------------- | --------------------- | -------- |
| `geo_blocking_rules`    | `true`           | `false`               | 2        |
| `geo_blocking_settings` | `true`           | `false`               | 2        |
| `scheduled_reports`     | `true`           | `false`               | 4        |

As três têm RLS **habilitado** e policy criada. O cenário do achado — `CREATE POLICY` numa tabela sem RLS,
aceito pelo Postgres e **não aplicado** — não existe no banco de hoje. F-02 é **refutado**, e as etapas
**024** e **025** são encerradas como "não se aplica": não há RLS para habilitar. As policies que o
repositório declara (`20260901000001_remediacao_destino.sql:56-70` e
`20260317224939_faf0aac9-...sql:27-34`) estão de fato ativas.

```sql
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
       (SELECT count(*) FROM pg_policies p
         WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('geo_blocking_rules','geo_blocking_settings','scheduled_reports');
```

**Etapa 026 — a unicidade existe onde importava.** `pg_constraint` (`contype IN ('u','p')`), `pg_indexes`
com `indexdef ILIKE '%unique%'` e a contagem de duplicatas:

| coluna                                      | `UNIQUE` no banco | duplicatas hoje |
| ------------------------------------------- | ----------------- | --------------- |
| `coletas.numero_coleta`                     | **presente** (`coletas_numero_coleta_key`) | 0 |
| `entregas.numero_entrega`                   | **presente** (`entregas_numero_entrega_key`) | 0 |
| `logistica_reversa.codigo_rastreio_reverso` | **ausente** | 0 |

A suspeita original de F-03 nos números está derrubada **no banco**, não só na leitura das migrations: as
duas restrições existem e não há uma linha repetida. O que sobra é o que o achado já apontava — o código de
rastreio da logística reversa não tem restrição nenhuma. A **etapa 027** continua com trabalho real (criar a
`UNIQUE`), e agora pode ser aplicada sem o risco de a migration quebrar por dado duplicado: as três
contagens vieram **0**.

**Etapa 287 — as duas tabelas não existem.** `to_regclass('public.webhook_failures')` e
`to_regclass('public.cron_job_logs')` devolveram `null`; `to_regclass('public.webhook_deliveries')` devolveu
a própria tabela. Ou seja, **não** há tabela morta a decidir: o que falta é criar o destino da falha de
entrada (etapa 288), que é DDL e é decisão do dono. O lado de saída de webhook tem onde gravar; o de
entrada, não.

### Registro - etapas 279 e 280 (2026-11-26) - os dois caminhos críticos de webhook ganham teste

**Como rodar** (o `vitest.config.ts` cobre `src/**` e `tests/**`; `supabase/functions/**` só roda no `deno test`):
`deno test -A supabase/functions/_shared/webhookSignature.test.ts supabase/functions/_shared/idempotency.test.ts`.

| etapa | arquivo novo                                  | o que trava                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 279   | `_shared/webhookSignature.test.ts` (6 testes) | Segredo ausente → `false` mesmo com assinatura plausível (é o que o `if (Deno.env.get(...))` removido na etapa 001 tornava inútil); assinatura errada/trocada/curta → `false`; assinatura correta → `true`. Mais duas varreduras de fonte: nenhum receptor condiciona `verifyWebhookHmac` à existência do segredo, e o bypass de test-mode exige `ALLOW_TEST_MODE='true'` (S-05). |
| 280   | `_shared/idempotency.test.ts` (5 testes)      | `insert` bem-sucedido → primeira vez, com POST em `idempotency_keys` (o helper grava, não consulta); `23505` → duplicata sem erro; erro 500 → não é confundido com duplicata e não lança (fail-open); chave sem identificador não ganha valor de reserva (B-02).                                                                                                                  |

**Verificado.** `deno test -A` nos dois arquivos → **11/11** (saída registrada no corpo da PR). HMAC calculado de
verdade com `crypto.subtle`, sem mockar `verifyWebhookHmac`; o duplo de banco é um servidor HTTP local que
responde `23505`/500 — nenhum arquivo de produção foi tocado.

### Registro - etapas 020, 021 e 022 (2026-11-26) - o gerador de contexto para de afirmar "sem RLS" no que ele não viu

**O defeito.** `scripts/ai-context/gerar.mjs` marcava `sem_rls: true` em toda tabela cujo `CREATE TABLE` não
trouxesse `ENABLE ROW LEVEL SECURITY` literal. Partição mensal ligada dentro de `DO $$` cai nessa regra — no
repositório real eram 12 (`audit_logs_y2026m01`…`m12`), e o achado F-01 mostra que o caso já mordeu 32 tabelas.

| etapa | o que mudou                                                                                                                                                                                                                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 020   | `sem_rls` passa a ter três estados: `true` (nada liga RLS para a tabela), `'desconhecido'` (bloco dinâmico do conjunto liga RLS sobre nome calculado — `public.%I`/`LIKE 'x_y%'` — e alcança a tabela) e `false` (ENABLE literal). Campo irmão `rls_indeterminado: true` para quem filtra por booleano. Parser de statements intocado. |
| 021   | `ferramentas.json → permissoes` e `baseline.json → alertas` publicam `tabelas_sem_rls` (só confirmadas) **e** `tabelas_rls_indeterminado`, mais `tabelas_rls_indeterminado_como_decidir` com a consulta ao catálogo que resolve no banco vivo. O array `banco.avisos` ganhou a contagem das indeterminadas.                            |
| 022   | `scripts/ai-context/gerar.unit.mjs`: caso novo com partição protegida por `DO $$` — exige `'desconhecido'` na partição, `true` na tabela comum, e ausência da partição em `tabelas_sem_rls` nos dois resumos.                                                                                                                          |

**Verificado.** `node --test scripts/ai-context/gerar.unit.mjs` → **39/39** (a asserção antiga de
`payments.sem_rls === true` continua valendo: aquele bloco dinâmico cria policy, não liga RLS). Gerador rodado
no repositório real: **12 indeterminadas** (`audit_logs_y*`), **0** "sem RLS" confirmadas, 52 blocos de DDL
dinâmico sinalizados. `npm run automation:test` → **103/103**.

### Registro - etapas 267, 268, 269, 276 e 278 (2026-11-26) - contabilidade do orçamento de lint e dos testes que travam as correções

**267, 268 e 269 já estavam feitas — o checklist é que ficou para trás.** A prova está no próprio
`.warning-budget.json`, campo `$comment`, com data de **2026-11-23**: "etapas 267-269 de `docs/qa/04-PLANO.md`
pagaram 29 avisos `react-hooks/static-components` (`SortIcon` extraído para `src/components/common/SortIcon.tsx`

- `GrowthIndicator`/`KPIStatus`/`DeltaIconDisplay` movidos a nível de módulo); teto baixado de 105 para 86,
  com ~10 de margem reservada".

| etapa | evidência verificada agora                                                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 267   | `src/components/common/SortIcon.tsx` existe; `grep -rn "const SortIcon" src/` só encontra `src/components/ui/table.tsx` e `src/pages/Ranking.tsx` — **nenhuma** das dez telas listadas no plano   |
| 268   | idem para as sete telas da etapa (Transportadoras, Envios, Ocorrencias, AlertasCusto, LojaRecompensas, AuditTrailViewer, FreightTableManager)                                                     |
| 269   | `node -e "require('./.warning-budget.json')"` → `lintWarnings 86`, `lintErrors 0`, `tsErrors 0`; contagem real medida por `eslint -f json` = **80 avisos**, ou seja **6 de margem** contra o teto |

**276 fechada.** `npx vitest run src/lib/statusTransitions.test.ts` → **19 testes verdes** (9 do mapa de
transições + 10 da recusa traduzida, estes da etapa 037). Cobre os saltos válidos, os inválidos e o estado final.

**278 fechada.** `npx vitest run src/components/common/BulkActions.test.tsx` → **3 testes verdes**, incluindo
"nao executa a acao ao clicar no botao: apenas abre a confirmacao" e "nao confirma enquanto a palavra exigida
nao for digitada". `src/components/common/BulkActions.tsx` importa `ConfirmDialog` e desvia a ação destrutiva
por `if (action.variant === "destructive")` antes de chamar `onClick`.

**Ainda pendente neste bloco.** **277** pede um teste de hook provando que `kanban_history` não é gravado
quando `count === 0`: hoje existe só `src/lib/conflitoVersao.test.ts` (o `throw` da etapa 048), sem o
mock de Supabase no nível do hook. **275 e 277** seguem abertas (279 e 280
fecharam na etapa seguinte deste bloco; 281 e 282 fecharam em `Registro - etapas 281 e 282`).

**NÃO VERIFICADO.** Nada aqui depende de sessão autenticada: as cinco etapas foram conferidas por leitura de
arquivo e por execução de teste local. O que **não** foi feito é o teste de duas abas das etapas 044-048,
registrado na PR #410.

### Registro - etapas 044 a 048 (2026-11-26) - o "salvou?" do travamento otimista em um lugar só

**044, 045, 046 e 047 já estavam no código, só a contabilidade estava atrasada.** Conferido por leitura do
`main` em `044af364`:

| etapa | arquivo                                    | evidência                                                                                                                                                                                             |
| ----- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 044   | `src/pages/Despachos.tsx`                  | `:222` `{ count: "exact" }` e `:226` `if (count === 0) throw` **antes** do `onStatusChange` (`:231`) e do insert em `kanban_history`                                                                  |
| 045   | `src/pages/Despachos.tsx`                  | `:286` `{ count: "exact" }` e `:291` `if (count === 0) throw` antes do histórico do despacho final                                                                                                    |
| 046   | `src/hooks/logistics/useBoxManagement.tsx` | `{ count: "exact" }` no `.update` e `if (count === 0) throw` **antes** do insert em `kanban_history`, que agora também confere `histError` (`console.warn`), como nos outros pontos                   |
| 047   | `src/pages/KanbanEntregas.tsx`             | `version` aparece só como parâmetro (`:298`), no `select` (`:278`), no filtro `.eq("version", version)` (`:330`) e em `version: item.version` (`:365`) — **não** há `version: version + 1` no payload |

**045 — decisão sobre o texto.** O plano sugeria uma frase mais específica para o despacho final ("nada foi
despachado"). Mantida a frase canônica de conflito de versão: o caminho já mostra toast de **erro** (não o de
sucesso), não grava `kanban_history` e a etapa 048 centraliza exatamente essa mensagem — trocar o texto agora
e voltar atrás na 048 seria churn.

**048 fechada.** A sequência `{ count: "exact" }` → `if (count === 0)` → `throw` estava copiada em quatro
pontos e a mensagem em quatro literais. Agora mora em `src/lib/conflitoVersao.ts`:

- `MENSAGEM_CONFLITO_VERSAO` — a mesma frase que já está em produção, sem mudança de texto;
- `assertAtualizou(count)` — lança quando `count === 0`; `null`/`undefined` (update sem `{ count: "exact" }`)
  não lança, porque aí a informação não existe;
- exportado pelo barrel `src/lib/index.ts`;
- `src/lib/conflitoVersao.test.ts` cobre `0`, `1`, `null` e `undefined`.

As quatro cópias foram substituídas: duas em `src/pages/Despachos.tsx`, uma em `src/pages/KanbanEntregas.tsx`
e uma em `src/hooks/logistics/useBoxManagement.tsx`. `grep -rn 'count === 0'` nos três arquivos → nenhuma
ocorrência restante. Nada de wrapper em volta do `supabase.from().update()`: a consulta continua à vista em
cada chamador.

**NÃO VERIFICADO (runtime).** Os testes de duas abas (avançar a mesma entrega nas duas, alocar o mesmo BOX
duas vezes) exigem sessão autenticada na aplicação — não foram executados nesta sessão. A evidência desta PR
é leitura de código, `tsc`, `eslint`, `vitest` do novo teste, `lint:budget` e `build`.

### Registro - etapas 040, 041 e 042 (2026-11-26) - escolher a cotação, gravar o disparo e mostrar carregando/erro/vazio

**040 fechada.** A tabela de resultados ganhou a ação **Escolher** nas linhas `respondido`, ligada a
`selectCotacao` do hook (`useCotacoesMulticanal`), que grava `status = 'selecionado'` na linha do banco. Antes só
existia o toast "Cotação selecionada!" no card de recomendação, sem chamada de banco — a escolha se perdia ao
recarregar. Junto veio a correção que a etapa exigia: a lista `respondidas` filtrava apenas `status === "respondido"`,
então **no instante em que a linha virava `selecionado` ela saía da lista** e `melhorCotacao`, `savings`,
`averageValue` e `currentStep` voltavam ao estado anterior (a tela "esquecia" a escolha recém-feita). O filtro passou
a aceitar `respondido` **ou** `selecionado` (`src/pages/CotacaoMultiCanal.tsx`).

**041 verificada, sem código novo.** A criação no banco já havia sido fechada na 038: `grep -n 'setCotacoes\|addCotacao'`
em `src/pages/CotacaoMultiCanal.tsx` não retorna nada, e todos os caminhos de criação passam pelo hook —
`createCotacao.mutate` em `:164`, `:336` (`registrarCotacaoPendente`), `:451`, `:474` e `createCotacao.mutateAsync`
em `:423` (caminho da API, com `await` dentro do laço do Blast, então falha de criação não derruba o lote).
O que **não** foi tocado de propósito: a contagem de sucesso do Blast usa `mutate` (sem `await`) nos caminhos de
WhatsApp/e-mail, então uma falha de insert ali não entra em `falhas` — é o achado **R-03**, com etapa própria.

**042 fechada.** A tela não distinguia "carregando", "falhou" e "não há nada": durante o carregamento inicial a área
de resultados simplesmente não existia e, com a query em erro, o operador via a tela vazia como se não houvesse
cotação. Agora: `SkeletonTable` enquanto `isLoading && cotacoes.length === 0`, card de erro com `error.message` e
botão **Tentar novamente** (`void refetchCotacoes()`) quando a query falha, e `EmptyState` explicando o próximo passo
("busque rotas e dispare uma cotação") quando a leitura terminou sem nenhuma cotação.

**NÃO VERIFICADO (runtime).** Escolher uma cotação e conferir `status = 'selecionado'` no banco exige sessão
autenticada com credencial de transportadora; a evidência desta PR é leitura de código, `tsc`, `eslint`, `vitest`
(6 casos em `CotacaoResultsTable.test.tsx`), `lint:budget` e `build`.

### Registro - etapa 037 (2026-11-26) - a recusa de transição vira frase de operação, e a 034 fecha a contabilidade

**034 marcada como concluída (atraso de checklist).** O módulo `src/lib/statusTransitions.ts`, o teste
`src/lib/statusTransitions.test.ts` (9 casos) e a exportação pelo barrel `src/lib/index.ts:78-84` entraram no **#311**;
só a marcação neste arquivo ficou para trás. Nada de código mudou na etapa 034 agora.

**037 (código pronto, verificação de runtime bloqueada).** As telas mostravam o texto cru do `RAISE EXCEPTION` do banco:
`Despachos.tsx` em duas mutations (`:251` avanço de coluna, `:311` autorização do despacho final) e `KanbanEntregas.tsx`
(`:341`, no `description` do toast). O operador lia `Transição de status inválida: pronto_despacho -> entregue` e não sabia
o que fazer.

| ponto          | antes                        | depois                                                                                                                                                                                                                                           |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| reconhecimento | nenhum                       | `reconhecerRecusaTransicao(error, tipo)`: decide pelo **SQLSTATE `23514`** (constante `ERRCODE_TRANSICAO_INVALIDA`, o mesmo que as etapas 029/030 mandam o banco usar) e usa a mensagem só para extrair os dois status envolvidos                |
| frase          | texto do banco               | `mensagemRecusaTransicao(error, tipo)`: "Esta entrega está em "Pronto para Despacho" e não pode ir para "Entregue". O próximo passo é "Cotação de Frete"." — com bifurcação lista as duas opções e, em estado terminal, diz que o fluxo terminou |
| rótulos        | nenhum no módulo             | `ROTULOS_ENTREGA` (10) e `ROTULOS_COLETA` (7), completos em relação ao enum, para a frase não citar `cotacao_frete`                                                                                                                              |
| outros erros   | `toast.error(error.message)` | **inalterado**: a função devolve `null` e a tela cai no `error.message` de sempre (inclusive `23514` de outra CHECK constraint e o "Conflito de versão" do travamento otimista)                                                                  |

**Por que só três `onError`:** `Despachos.tsx` tem exatamente duas mutations e ambas mudam status; `KanbanEntregas.tsx` tem
uma. Upload, exclusão e filtros não foram tocados.

**Evidência (no worktree da branch, sobre `b4d25562`):**

- `npx vitest run src/lib/statusTransitions.test.ts` → **19 testes verdes** (9 herdados + 10 novos: rótulos completos,
  4 casos de reconhecimento/ignorância, 4 frases - passo único, bifurcação, estado terminal, `null` para os demais erros).
- `npm run typecheck` → limpo; `npx eslint` nos 4 arquivos → **0 problemas**.
- `npm run lint:budget` → **80/86 avisos**, idêntico ao `main` medido em `b4d25562` (**0 aviso novo**).
- `npm run test:coverage` → **97 arquivos** verdes; `npm run build` → ok.

**NÃO VERIFICADO:** o texto novo **não** foi visto em tela, porque a recusa ainda não existe no banco — as etapas 028-033
(função, triggers das duas tabelas e a migração aplicada) estão em `[~]` aguardando o dono. Enquanto a 033 não for aplicada,
nenhum caminho de produção dispara esta frase; o que está provado aqui é a unidade (teste) do reconhecimento e da frase.
Prova em runtime depois da 033: provocar uma transição inválida em `Despachos` e no Kanban e colar o texto exibido.

### Registro - etapas 038 e 039 (2026-11-26) - a tela de cotação multicanal passa a ler e a gravar no banco

**038 fechada.** `src/pages/CotacaoMultiCanal.tsx` mantinha `const [cotacoes, setCotacoes] = useState<CotacaoManual[]>([])`
(`:100`) espelhando em memória a **mesma** cotação que `createCotacao.mutate`/`mutateAsync` já gravava: duas fontes para o
mesmo dado, e a cópia local era a que a tabela mostrava. A cópia morreu; a tela agora lê `cotacoes` do hook
`useCotacoesMulticanal` (query com `.limit(200)`, `refetchInterval` de 30s e join `transportadora:transportadoras`).

| ponto                                                                                                              | antes                                                                                                          | depois                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tabela                                                                                                             | `useState<CotacaoManual[]>` local, alimentado por 7 chamadas de `addCotacao` (preço/status inventados na tela) | `cotacoes` do hook, direto da linha do banco                                                                                                                                          |
| `handleSearch`                                                                                                     | `setCotacoes([])`                                                                                              | `void refetchCotacoes()`                                                                                                                                                              |
| 4 pontos que já gravavam (`registrarCotacaoPendente`, `handleCotarAPI`, `handleCotarWhatsApp`, `handleCotarEmail`) | gravavam no banco **e** criavam linha local duplicada                                                          | só a gravação; as `observacoes` que existiam apenas na cópia local ("WhatsApp enviado", "Email enviado", "Nexus Blast: Aguardando RPA/WhatsApp") entraram no `createCotacao`          |
| tipo                                                                                                               | `CotacaoManual` local (`valor`, `transportadora_nome`, `observacoes` obrigatório)                              | `CotacaoMulticanal` do hook (`valor_cotado`, `transportadora.nome_fantasia`, `observacoes` anulável); `CotacaoResultsTable` passou a receber esse tipo e ganhou o badge "Selecionada" |

**039 (código no mesmo PR, aguarda verificação em runtime).** `handleRegistrarResposta` fazia
`setCotacoes(prev => prev.map(...))` + `toast.success("Resposta registrada!")` sem tocar no banco: o operador lia
"registrado" e o valor morria no reload. Agora chama `updateCotacao.mutate({ id, valor_cotado, prazo_dias, observacoes,
status: "respondido" })` - o hook preenche `responded_at`, invalida a query e emite o único toast da ação (o toast local
saiu). A tela passa a identificar a linha pelo **`id`** da cotação (o estado local antigo só tinha `transportadora_id`):
clicar "Registrar" na tabela abre o diálogo já amarrado àquela linha. Onde o plano manda não decidir por conta própria -
**duas ou mais cotações pendentes para a mesma transportadora** - a lista de transportadoras recusa e orienta a registrar
pela linha desejada na tabela, em vez de escolher a primeira.

**Cotações de API externa (Rodonaves, Melhor Envio, Lalamove):** eram as únicas linhas sem gravação nenhuma, com
`transportadora_id` fictício (`"rodonaves-id"`, `me-<id>`, `"lalamove-id"`) - impossíveis de persistir na coluna
`transportadora_id UUID NOT NULL REFERENCES transportadoras(id)`
(`supabase/migrations/20260317213459_b43e2938...sql:5`). Agora a cotação é gravada quando o provedor corresponde a uma
transportadora cadastrada na busca; quando não corresponde, **não** entra no banco e o operador recebe um aviso dizendo
qual cotação e qual valor não foram registrados (antes essa cotação aparecia e desaparecia no reload sem deixar rastro).

**Consequência assumida:** a tabela lista as cotações do usuário (teto de 200 do hook), não apenas as da busca atual.
Filtrar por trecho/período é regra de negócio e ficou fora desta etapa.

**Evidência (no worktree da branch):**

- `grep -n "setCotacoes\|addCotacao\|crypto.randomUUID" src/pages/CotacaoMultiCanal.tsx` → **vazio** (as duas fontes acabaram).
- `grep -n "setCotacoes\|updateCotacao" src/pages/CotacaoMultiCanal.tsx` → só `updateCotacao.mutate` em `handleRegistrarResposta`.
- `npx tsc --noEmit -p tsconfig.app.json` → limpo; `npx eslint` nos 2 arquivos → 0 erros.
- `npm run lint:budget` → **77/86 avisos** (idêntico ao `main`; a memoização de `respondidas` foi ajustada para não subir o teto).
- `npx vitest run` → 96 arquivos / 811 testes verdes, + `src/pages/cotacao-multicanal/CotacaoResultsTable.test.tsx` (4 casos novos: nome do join, `valor_cotado`, `id` correto no `onRegistrar`, badge "Selecionada").

**NÃO VERIFICADO:** o comportamento em runtime **não** foi exercitado - não há credencial/serviço de banco nesta sessão,
então não registrei resposta de cotação real nem conferi `valor_cotado`/`responded_at` na linha de `cotacoes_multicanal`,
e não há medição de tela publicada. Falta: registrar uma resposta em produção, recarregar e conferir a linha; e confirmar o
deploy após o merge.

### Registro - etapas 223 a 227 (2026-11-25) - os cinco pontos de colunas explícitas já estavam no main

As cinco etapas da onda 6 que trocam `select("*")` por colunas explícitas **já estavam implementadas no
`main`** por PRs anteriores; nenhuma exigiu código novo. O trabalho foi verificar uma por uma contra a lista
real de colunas de `types.ts` e contra o consumo da tela, e registrar a evidência.

| etapa | arquivo                                                                                   | commit que entregou           | verificação feita                                                                                                                                                                                                                                                                                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 223   | `src/pages/Envios.tsx:351-362`                                                            | `cb64f276` (#315)             | 15 colunas e os dois joins explícitos; `.is("deleted_at")` e `.limit(500)` intactos. Cruzamento das 33 colunas de `entregas` com o arquivo: 18 nomes aparecem, e os 3 que ficam fora do `select` (`cliente_id`, `transportadora_id`, `deleted_at`) são campo do formulário de criação (`:437,441`) e filtro da consulta (`:360`), nunca leitura de linha. **Zero coluna usada e não selecionada.** |
| 224   | `src/pages/Coletas.tsx:148-161`                                                           | `8acf1702`                    | 22 das 31 colunas; `fornecedores!fk_coletas_fornecedor` e `transportadoras!fk_coletas_transportadora` preservados; `.limit(500)` em `:161`. Único nome fora do `select` é `deleted_at`, usado como filtro em `:159`.                                                                                                                                                                               |
| 225   | `src/hooks/analytics/useDrillDown.tsx:69,88,107`                                          | `d199a88c` (#316)             | três leituras explícitas (coletas, entregas e fretes_internos) com `.limit(100)` em `:82,101,112`; o mapeamento de `:128-137` lê `numero_coleta`/`numero_entrega`/`destino`, `status`, `created_at` e `endereco_coleta`/`endereco_entrega` - tudo selecionado - e `DrillDownModal.tsx:132-154` renderiza apenas `id`, `numero`, `status`, `created_at` e `endereco`.                               |
| 226   | `src/hooks/logistics/useSLANotifications.tsx:313,327`                                     | `786f725e` (#317)             | `id, numero_entrega, status, previsao_entrega` e `id, numero_coleta, status, data_prevista_coleta`; cobrem o que `checkEntregaSLA` (`:206-218`) e `checkColetaSLA` (`:232-236`) leem. `setInterval` e `lastCheckedAt` intocados.                                                                                                                                                                   |
| 227   | `src/pages/RelatorioPDF.tsx:92-97`, `src/hooks/logistics/useCotacoesMulticanal.tsx:53-66` | `de6487e4`, `45be2b3d` (#397) | explícitos, com `.limit(2000)` (`:100`) e `.is("deleted_at")` intactos.                                                                                                                                                                                                                                                                                                                            |

**O único ponto que sobrou é justamente o que o plano manda não mexer:** `src/features/logistics/services/LogisticsService.ts:8`
continua com `select('*')`, mas `getDeliveries` **não tem chamador** - a classe inteira não é importada em
nenhum ponto de `src/` (`grep -rn 'LogisticsService' src/` só acha a própria definição). O plano diz, nesse
caso, não inventar lista de colunas e anotar o código morto: registrado como **A-05**.

**NÃO VERIFICADO:** o tamanho em KB das respostas antes/depois (exige `/envios` e `/coletas` em produção com
a aba Rede), a geração de um PDF real e o disparo de um alerta de SLA com previsão no passado. Sem essas
medições a evidência é de código, não de comportamento - nada foi deployado nesta sessão.

### Registro - etapa 222 (2026-11-25) - types.ts contra o banco: a drift é de UMA tabela que não existe em produção

**222 fica ABERTA** - a correção é DDL em produção (Regra 8). Sem MCP do Supabase nesta sessão, a prova
saiu dos próprios artefatos do `types-sync`:

- `gh run list --workflow types-sync.yml`: o último **sucesso** é do cron de 2026-11-23T05:51; no mesmo dia
  há **duas falhas** por push (11:04 e 13:58), a run `45189263904`.
- Nessa run o job "Gates e PR de sincronização" para em `Gate 1 falhou: novos erros de TypeScript
introduzidos pelo novo types.ts`, todos em `src/hooks/sla/useSLAMetas.ts` (`:31,33,50,51,53-57,89,91,96`),
  incluindo `"user_panel_preferences" is not assignable ...` e `'sla_critico_horas' does not exist`: o
  candidato gerado do banco vivo **não tem** a tabela que o `types.ts` commitado tem (`:5403-5428`).
- A mesma run registra `Drift: types=true, catalogo=false, manifesto=false`. `supabase/schema-catalog.json` e
  `supabase/schema-manifest.json` foram gerados do banco vivo nessa run (e são byte-idênticos aos commitados,
  conferido nas etapas 132-137) e têm **zero** ocorrências de `user_panel_preferences`, contra 14 e 67 de
  `user_notification_preferences`. Se a tabela existisse em produção, o manifesto a listaria. **Produção não
  tem `public.user_panel_preferences`.**
- `git log -S'user_panel_preferences' -- src/integrations/supabase/types.ts` devolve um único commit,
  `c565d8cf` (PR #248) - o mesmo que criou `supabase/migrations/20261121153649_user_panel_preferences.sql`.
  A PR **editou o `types.ts` à mão**, exatamente o que o plano proíbe num arquivo gerado, e é por isso que a
  drift aparece sem que o `types-sync` jamais tenha rodado com sucesso depois.
- O último dispatch de `.github/workflows/aplicar-migration.yml` foi em 2026-11-20T18:06, **antes** de a
  migration existir (arquivo de 21/11 15:36, merge em 23/11). A migration nunca foi aplicada.

**Correção de uma leitura anterior:** o registro das etapas 132-137 diz que a run 45189263904 acusa a tabela
"presente em produção e ausente no arquivo commitado". É o contrário - ela está no arquivo commitado e falta
em produção, coerente com `types=true` e catálogo/manifesto idênticos. O texto original ficou com nota
apontando para este registro.

**Impacto em produção:** `PainelSLA.tsx:96` consome `useSLAMetas()`; `useSLAMetas.ts:31-36` faz
`.from("user_panel_preferences")` e lança o erro (`:36`), sem fallback. Pior: `PainelSLA.tsx:242-244` chama
`saveMetas(draftMetas)` e mostra `toast.success("Metas de SLA atualizadas")` **sem condição**, enquanto
`saveError` (`useSLAMetas.ts:119`) não é consumido em nenhum ponto da página - o usuário vê "salvo" e nada é
persistido. Registrado como **A-04**.

**Compatibilidade migration x types.ts:** conferi coluna por coluna. A migration cria `id`, `user_id`,
`sla_critico_horas`, `sla_alto_horas`, `sla_medio_horas`, `sla_meta_on_time_pct`, `created_at` e
`updated_at`, que é exatamente o `Row` de `types.ts:5403-5412`. Aplicar a migration resolve a drift sem
tocar no arquivo gerado. Resíduo esperado: a tabela nova nasce com os GRANTs padrão do Supabase, então
`scripts/db-audit/grants-baseline.json` pode acusar diferença e precisar de regeneração (mudança de repo,
não de banco).

**Nada foi alterado nesta etapa:** nem `types.ts` (gerado), nem a migration, nem o workflow. A correção é
disparar `aplicar-migration.yml` com `arquivo=supabase/migrations/20261121153649_user_panel_preferences.sql`
e `confirmacao=APLICAR` (exige o secret `DESTINO_URL` e o environment `banco-leitura`) - Regra 8.

### Registro - etapa 221 (2026-11-25) - metrica executiva passa de 18 consultas para 3

**Causa:** identica a da 220 no hook gemeo (`src/hooks/analytics/useExecutiveMetrics.tsx`). O bloco `trends`
pedia a mesma tabela seis vezes, mudando so o intervalo de `created_at`, e os seis intervalos sao contiguos; o
agrupamento por mes estava no laco do cliente. Achado P-03.

**Entrega:** as 18 consultas viraram **3**, uma por tabela (`:45-69`), com a mesma forma que a 220 deixou no
`useKPIBenchmark`: janela unica de `startOfMonth(subMonths(now, 5))` ate `endOfMonth(now)`, `agruparPorMes` com
`Record<string, T[]>` + `forEach` (`:72-84`) e a chave local `format(new Date(linha.created_at), "yyyy-MM")`.
`created_at` entrou no `select` das tres, porque passou a ser lido no cliente. Tetos escalados na proporcao que o
plano exige -- `entregas` e `coletas` 1000/mes -> 6000, `ocorrencias` 500/mes -> 3000 (`:55,62,68`). Nao houve
extracao de hook compartilhado (o plano veta: refatoracao nao pedida, dois arquivos por vez); os dois hooks ficam
com o mesmo desenho, lado a lado. OTIF (`:91-102`), custo de frete (`:103-106`) e a ordem cronologica dos seis
meses (`subMonths(now, periodsBack - 1 - i)`) continuam como estavam. As outras duas consultas do arquivo
(`carrierOtif`, `avgCollectionTime`) nao foram tocadas.

**Mudanca visivel, deliberada:** o teto de `ocorrencias` por mes era 500 e agora e 3000 para os seis meses. Num
mes com mais de 500 ocorrencias a tela passa a mostrar a contagem real (ate 3000) em vez do 500 cortado -- mesmo
efeito que a 220 teve em `entregas`/`coletas`, e o que o plano pediu ao mandar escalar a proporcao.

**Verificacao:** spec `tests/contracts/executive-metrics-consulta-unica.spec.ts` (7 casos) sobre
`tests/contracts/executive-metrics-fixtures.ts` (servidor de mentira que filtra por intervalo como o PostgREST,
projeta so as colunas pedidas e aplica o `limit` de verdade, mais o **espelho do codigo anterior** de `trends`
na `4f18e691`). Casos: 3 consultas, uma por tabela; janela unica de seis meses, `created_at` no select das tres e
tetos 6000/6000/3000; **os seis meses identicos ao codigo anterior, campo por campo**, num cenario com as duas
bordas do mes (23:30 do ultimo dia -- que em UTC cai no mes seguinte -- e 00:30 do primeiro dia), linha deletada,
uma ocorrencia deletada (que o codigo antigo **nao** filtra, e continua nao filtrando) e linhas fora da janela em
cada ponta; o mesmo com 70 linhas espalhadas por oito meses; ordem cronologica com rotulo `MMM/yy`; 9000
ocorrencias no mes corrente viram 3000 (o teto corta); ausencia de laco `for`, de `monthsPromises` e de
`.limit(1000)` no bloco, com exatamente 3 `.from("...")`, e as outras duas consultas do arquivo intactas.
Valores do mes corrente no cenario de bordas conferidos a mao: 5 entregas, 3 entregas/finalizadas com 2 no prazo
(OTIF 66,7%), 3 coletas, 4 ocorrencias e frete 660.
`npx tsc --noEmit` 0 erros; `npx eslint` nos tres arquivos 0 avisos / 0 erros; `npx vitest run` **812/812** em 96
arquivos; o spec tambem passa com `TZ=UTC`.
**Prova por mutacao: 9/9 capturadas** (teto fixo em 1000; `created_at` fora do select de entregas; janela
comecando um mes antes; chave do mes em UTC em vez de local; baldes de coletas lendo ocorrencias; filtro de
deletadas fora de entregas; teto de ocorrencias em 6000; formula do OTIF sobre todas as entregas em vez das
entregues; meses em ordem invertida).

**Nao verificado:** o volume real por mes no banco (a consulta do plano pede credencial de Supabase, que esta
sessao nao tem) e a contagem de requisicoes na aba Rede do `/dashboard` executivo, que so da para medir depois do
deploy. Por isso o risco do teto unico segue anotado como A-03.

### Registro - etapa 220 (2026-11-25) - benchmark de KPI passa de 18 consultas para 3

**Causa:** mesma raiz da 219, um degrau abaixo. Mesmo em paralelo, o hook pedia a **mesma tabela seis vezes**,
mudando so o intervalo de `created_at` -- e os seis intervalos sao contiguos. O agrupamento por mes estava no
laco do cliente em vez de na consulta. Achado P-03.

**Entrega:** as 18 consultas viraram **3**, uma por tabela (`src/hooks/analytics/useKPIBenchmark.tsx:49-71`).
Cada uma cobre a janela inteira, de `startOfMonth(subMonths(new Date(), periodsBack - 1))` ate
`endOfMonth(new Date())`, e o mes de cada linha sai de `format(new Date(linha.created_at), "yyyy-MM")` no
cliente, num `Record<string, T[]>` montado com `forEach` (`:75-87`) -- o mesmo desenho de
`src/hooks/logistics/useTrackingAnalytics.tsx:138-141`. A chave e **local**, exatamente o criterio que o servidor
ja usava (`startOfMonth`/`endOfMonth`), entao os seis pontos nao se deslocam. Teto ajustado para
`periodsBack * 1000` (6000) nas tres (`:44`), mantendo a proporcao do que o codigo pedia antes (1000 por mes), e
`created_at` entrou no `select` das tres porque passou a ser lido no cliente. Nenhum calculo, filtro de status ou
formula foi tocado; `periods.sort` continua garantindo a ordem do grafico.

**Verificacao:** spec `tests/contracts/kpi-benchmark-consulta-unica.spec.ts` (8 casos) sobre
`tests/contracts/kpi-benchmark-fixtures.ts`, que traz um servidor de mentira (filtra por intervalo como o
PostgREST, projeta so as colunas pedidas e aplica o `limit` de verdade) e o **espelho do codigo anterior**
(`df6b3e2e`) para comparar os seis pontos. Casos: 3 consultas, uma por tabela; janela unica e teto 6000 nas tres;
`ocorrencias` tambem com teto (A-01 resolvido); **os seis pontos identicos ao algoritmo anterior, campo por
campo**, num cenario com as bordas do mes (23:30 do ultimo dia e 00:30 do primeiro dia -- no fuso do Brasil esses
dois caem em meses UTC diferentes do mes local); linhas fora da janela e uma linha deletada; o mesmo com 40 linhas
espalhadas por oito meses; ordenacao ascendente; ausencia de laco com `await` e de `.limit(1000)`, com exatamente
3 `.from("...")` e 3 `.limit(teto)`; formulas e comparacao entre os dois ultimos periodos intactas.
Os valores do mes corrente no cenario de bordas foram conferidos a mao: 5 entregas, 2 no prazo (SLA 40%), frete
660, custo medio 132, 2 ocorrencias (taxa 40%), tempo medio 7/3 dias.
**Prova por mutacao: 9/9 capturadas** (teto fixo em 1000; `created_at` fora do select; janela comecando um mes
antes; agrupamento por mes UTC em vez de local; baldes de entregas e coletas trocados; filtro de deletados fora;
teto fora de `ocorrencias`; `sort` removido; formula do SLA alterada).

**Substitui:** o guard da etapa 219 (`tests/contracts/kpi-benchmark-paralelo.spec.ts`, 9 casos) foi removido --
ele provava a forma que deixou de existir (`Promise.all` por mes). O achado P-03 continua coberto, agora pela prova
mais forte: 3 consultas medidas no cliente falso e igualdade numerica contra o codigo anterior.

**Verificado:** `npx tsc --noEmit` 0 erros; `npx eslint .` 77 avisos / 0 erros (o mesmo numero do `main`, sem
gastar orcamento); `npx vitest run` 804/804 em 95 arquivos; `grep -c 'from("entregas")\|from("coletas")\|from("ocorrencias")'`
no hook = **3**, o esperado do plano.

**Nao verificado:** o volume real de linhas por mes no banco (a consulta do plano
`SELECT date_trunc('month', created_at) ... FROM entregas` exige credencial de Supabase, que esta sessao nao tem)
-- e por isso o risco do teto unico segue aberto em A-02; e a contagem de requisicoes na aba Rede do `/analytics`,
que so pode ser medida depois do deploy.

### Registro - etapa 219 (2026-11-25) - meses do benchmark de KPI deixam de ser consultados em serie

**Causa:** `useKPIBenchmark` abria `for (let i = 0; i < periodsBack; i++)` e dentro dele fazia **tres `await` em
sequencia** (`entregas`, `coletas`, `ocorrencias`). Com o padrao `periodsBack = 6` eram **18 idas ao banco uma
depois da outra** antes de a tela aparecer: a espera era a soma das 18, nao a maior delas. Achado P-03. Os seis
meses nao dependem um do outro.

**Entrega:** o `for` virou `Array.from({ length: periodsBack }).map(async (_, i) => ...)` envolvido em
`Promise.all`, e as tres consultas do mes viraram um `Promise.all` proprio com desestruturacao de tupla — a mesma
forma do arquivo gemeo `src/hooks/analytics/useExecutiveMetrics.tsx:40-55`. **Nenhum calculo mudou** (guias
`docs/qa/04-PLANO.md`): os filtros de status, `custoTotal`, `slaRate`, `ocorrenciaRate`, `tempoMedioEntrega` e a
comparacao entre os dois ultimos periodos ficaram linha a linha iguais; `periods.push({...})` virou `return {...}`
dentro do callback e o `sort` por periodo (que ja existia) garante a ordem final, entao o grafico nao inverte. O
`.limit(1000)` de `entregas` e `coletas` foi preservado (remover recriaria P-01) e o `Promise.all` nao introduz
erro novo: as consultas ja ignoravam `error` (so desestruturavam `data`).

**Limpado de passagem (a mudanca obrigou):** o `/* eslint-disable sonarjs/cognitive-complexity */` do topo virou
diretiva nao usada -- a complexidade caiu ao sair do laco -- e foi removido; com isso o arquivo continua com 0
avisos, sem gastar orcamento de lint.

**Verificacao:** spec novo `tests/contracts/kpi-benchmark-paralelo.spec.ts`, 9 casos: ausencia de `for (` e de
`periodsBack; i++`; `Array.from({ length: periodsBack })` com `.map(async (_, i) =>`; **exatamente dois**
`Promise.all` (meses e tabelas); as tres tabelas dentro do `Promise.all` interno, na ordem entregas -> coletas ->
ocorrencias e **sem `await supabase`** entre elas; dois `.limit(1000)`; `periods.sort` por periodo presente;
`return {` no lugar de `periods.push(` com `period`/`periodLabel`; os filtros de status e as formulas de taxa
comparados sem depender de quebra de linha; comparacao dos dois ultimos periodos intacta. **Prova por mutacao:
10/10 capturadas** (meses fixos em 1; sem o `Promise.all` externo; teto trocado; teto adicionado em
`ocorrencias`; `sort` removido; formula do SLA alterada; volta do `push`; comparacao com 3 periodos; `await`
solto na primeira consulta; `periodLabel` removido). `npx tsc --noEmit` 0 erros; `npx eslint` do arquivo 0
problemas; `npx prettier --write` aplicado (o repo nao tem gate de formatacao).

**Nao verificado:** a cascata de requisicoes em paralelo no `/analytics` e a igualdade dos numeros na tela exigem
navegador com sessao real (sem credencial nesta sessao). A prova aqui e estrutural, com a comparacao dos calculos
por contrato.

**Registrado (nao corrigido):** a consulta de `ocorrencias` (`:65-69`) segue **sem teto**, ao contrario das duas
outras -- anotado como A-01 em "Achados novos", fora do escopo desta etapa.

**Risco assumido:** 18 consultas simultaneas em vez de sequenciais elevam o pico no banco por alguns milissegundos;
com teto de 1000 por consulta (e sem teto na de ocorrencias, A-01) isso foi considerado aceitavel para a tela de
analytics.

### Registro - etapa 216 (2026-11-25) - tempo real de notificacoes deixa de recarregar a cada aviso

**Causa:** a tela registrava `useRealtime({ table: "notifications", onInsert/onUpdate/onDelete: () => refetch() })`.
Achado P-02. Cada notificacao nova, cada marcacao de lida e cada exclusao recarregava a listagem; depois da etapa
213 a recarga rebaixa uma pagina em vez da tabela inteira, mas em rajada continua linear: um disparo em lote de 30
avisos gerava 30 requisicoes. Pior, `onUpdate: () => refetch()` fechava um laco com as proprias mutacoes da tela --
marcar como lida grava (`update` de `read`), o tempo real avisa, a pagina rebaixa.

**Entrega:** o tratamento saiu da tela para `src/hooks/data/useNotificacoesRealtime.ts` (novo; manter as ~60 linhas
no arquivo da tela estouraria o orcamento de 400 linhas do `max-lines`). O contrato do `useRealtime` **nao** foi
tocado -- 12 telas dependem dele e o defeito dele e de outro achado (R-02); a assinatura continua ativa (remover o
tempo real e deixar so o polling resolveria o custo destruindo a funcionalidade).

- `onInsert`/`onDelete` mudam o conjunto (a linha entra ou sai): acumulam numa janela de **400 ms**
  (`clearTimeout` + `setTimeout`) e disparam **uma** invalidacao ao fim dela. Uma rajada vira uma requisicao.
- `onUpdate` nao recarrega: o payload do tempo real traz a linha (`{ old, new }` -- `onUpdate?: (payload: { old: T;
new: T }) => void` em `useRealtime.tsx`), entao a alteracao e aplicada no cache da pagina onde a linha esta, por
  `setQueriesData` na chave `["notifications"]` e troca por `id`. Duas armadilhas tratadas: (a) essa chave tambem
  casa com a entrada de contagem (`["notifications","stats",userId]`), que **nao tem** `data` -- sem o guard
  `Array.isArray(atual.data)` a contagem do cabecalho viraria uma pagina de linhas; (b) com filtro ou busca ativos
  a linha pode **sair** do conjunto (filtro "nao lidas" + linha marcada como lida), e so a recarga responde certo
  -- nesse caso o hook cai na recarga agrupada.
- Cleanup no unmount (`clearTimeout`) para nao invalidar depois da tela sair. A tela nao passa `queryKey` ao tempo
  real de proposito: aquela invalidacao, dentro do hook, e imediata e a rajada voltaria a ser uma requisicao por
  aviso. As mutacoes da propria tela (`markReadMut`, `markAllReadMut`, `deleteMut`) continuam invalidando.

**Verificacao:** spec novo `tests/contracts/notificacoes-realtime-agrupado.spec.ts`, 11 casos: tela sem `refetch` e
sem import direto do `useRealtime`; contrato `{ old, new }` no hook do tempo real (evidencia da decisao do
`setQueriesData`); janela entre 300 e 500 ms e usada como argumento do agendamento; `clearTimeout` antes de
reagendar; **uma** invalidacao e dentro da janela; duas saidas de `clearTimeout` (reagendamento e unmount);
`setQueriesData` na chave e troca por `id`; guard do `data`; saida por filtro ativo antes do caminho pontual;
`filtroAtivo` vindo dos tres filtros da consulta; `insert`/`delete` no caminho agrupado e `update` no pontual.
**Prova por mutacao: 11/11 capturadas** (recarga direta sem janela, sem `clearTimeout`, janela de 1500 ms, sem a
saida por filtro, sem o guard, `insert` pelo caminho pontual, tela sem tempo real, tela passando `queryKey`,
`filtroAtivo` fixo, troca por `id` removida, contrato do `useRealtime` sem a linha). `npx tsc --noEmit` 0 erros;
`npx eslint .` 77 avisos / 0 erros (orcamento 86, sem aviso novo -- a tela ficou em 363 linhas).

**Nao verificado:** o teste de duas abas do plano (criar notificacao numa aba e ver aparecer na outra em ate 1 s)
exige navegador e sessao real; nao ha credencial nesta sessao. A prova aqui e estrutural (contrato por mutacao).

**Fora do escopo (registrado):** o defeito R-02 do `useRealtime` (assinatura derrubada e reaberta a cada render, em
12 telas) segue aberto -- a etapa 216 nao o toca.

### Registro - etapa 217 (2026-11-25) - uma consulta a `notifications` (achado P-03)

**Causa:** `useAccuracyMetaCycle` montava `Promise.all(rows.map(...))` e dentro do laco consultava
`notifications` **uma vez por transportadora configurada** (`.eq("user_id")` + `.gte("created_at")` +
`.contains("metadata", { source, carrier })` + `.limit(1)`). Com 10 transportadoras, 10 consultas quase
identicas, diferindo so no `carrier` -- que vive dentro de um `jsonb`, e por isso o autor pediu um valor por vez.

**Entrega:** antes do laco, **uma** consulta a `notifications` com so a parte comum do filtro
(`.select("metadata")`, `.eq("user_id", uid)`, `.gte("created_at", dayAgoIso)`,
`.contains("metadata", { source: "accuracy-meta-monitor" })`, `.order("created_at", desc)`, `.limit(500)`); o
`carrier` de cada linha vira um `Set` em memoria e o laco passou a fazer `carriersNotificados.has(...)`. O
`.limit(1)` do laco saiu e o teto passou a ser do conjunto -- com ordem, porque teto sobre conjunto sem ordem
corta de forma nao deterministica. **Atalho evitado:** um `.or(...)` com um `contains` por transportadora
estouraria o limite de tamanho de URL do PostgREST (414) justamente para quem tem muitas configuracoes.

**Semantica preservada:** a chave do `Set` e o `carrier` gravado pelo monitor (`?? null` quando ausente) e a
consulta usa `s.transportadora ?? "__all__"` -- exatamente o que o `.contains({ carrier })` antigo comparava, dos
dois lados. So o `select` mudou de `id` para `metadata` (a linha inteira era payload morto: so o `carrier` e
usado). A logica de `status` (`ok`/`warming`/`pending`/`notified`), a janela de 24 h, a chamada
`supabase.rpc("count_prediction_breach_days", ...)` (etapa 218, DDL) e o `staleTime`/`refetchInterval` de 60 s
ficaram intactos.

**Verificacao:** spec de contrato novo `tests/contracts/accuracy-meta-consulta-unica.spec.ts` (9 casos): zero
`from("notifications")` e zero `.limit(1)` dentro do `rows.map`; a consulta agregada antes do laco com os tres
filtros e o teto **depois** da ordem; continuam duas consultas no arquivo (a agregada e a do ultimo alerta, com
`maybeSingle`); o `Set` montado com `meta?.carrier ?? null` e consultado com `s.transportadora ?? "__all__"`;
nenhum `contains` com `carrier`; a `rpc` intacta (`_target`/`_carrier`); o bloco de `status` comparado **byte a
byte**. **8 mutacoes** -- consulta de volta dentro do laco, sem teto, teto sem ordem, `select("id")`, chave nula
virando `"__all__"` na leitura, chave de busca sem o mapeamento, `>=` virando `>` no status e `_carrier: null` na
rpc -- falham **2/1/1/1/1/1/1/1**; versao correta 9/9. Suite completa **768/768** (92 arquivos), `tsc --noEmit` 0,
`eslint .` **77 avisos / 0 erros** (orcamento 86).

**Achado nao corrigido aqui (fora do escopo):** o monitor grava o alerta "todas as transportadoras" ora como
`carrier: "__all__"`, ora como `carrier: null` (ver `accuracy-meta-monitor/index.ts:93-95` e
`escalation.ts:58`, que tratam os dois como variantes da mesma coisa). O hook compara so com `"__all__"`, entao
uma notificacao gravada com `carrier: null` nao conta como "ja notificado" nesta tela. Isso **e** o comportamento
anterior -- foi preservado de proposito, porque mexer nele muda o `status` que decide se o usuario recebe alerta
-- e virou item de proximos passos.

**Nao verificado:** o numero de consultas no navegador real e a contagem de linhas em 24 h por usuario (sem
credencial nesta sessao). A aba Rede com o hook ativo deve mostrar 1 requisicao a `notifications`, nao N.

### Registro - etapas 213, 214 e 215 (2026-11-25) - paginacao, filtro e busca no servidor (notificacoes)

**Causa:** `Notificacoes.tsx` baixava ate 200 notificacoes (o `.limit(200)` da etapa 212) e resolvia o resto no
cliente: `useFilters` varria titulo e mensagem em memoria a cada tecla, `usePagination` recortava 15 por pagina e
`stats` contava `list.length`. Tres consequencias: (a) `useServerPagination`, o contrato da onda 6, estava escrito
e **sem nenhum consumidor** -- nada provava que ele funciona; (b) "X de Y" mentia para quem tem mais de 200
notificacoes, porque Y travava em 200 e as paginas seguintes vinham do array ja baixado; (c) busca e filtro eram
O(n) no cliente.

**Entrega (as tres etapas em uma PR):** as tres mexem no mesmo arquivo, entao separa-las deixaria a tela num
estado intermediario inconsistente (pagina do servidor com filtro em memoria). A consulta saiu da tela para
`src/hooks/data/useNotificacoesPage.ts` (novo): `.select(<7 colunas>, { count: "exact" })` -> `.eq("user_id")` ->
`eq("type")` / `eq("read")` quando o filtro nao e `all` -> `.or(title.ilike.%x%,message.ilike.%x%)` ->
`.order("created_at", desc)` -> `.order("id", desc)` -> `.range(from, to)`. Sem `.limit()`: junto de `.range()`
ele corta a faixa e a ultima pagina vem vazia. O desempate por `id` e obrigatorio -- `created_at` repete em
disparo em lote e ordem instavel faz o `.range()` repetir ou pular linha entre paginas. O termo digitado passa por
`replace(/[%,()]/g, "")` antes de entrar no `or`, porque esses caracteres sao sintaxe do PostgREST. Os filtros
entraram na `queryKey` (`["notifications", userId, { tipo, leitura, busca }]`), entao trocar filtro volta para a
pagina 1 -- regra 3 do contrato, sem codigo extra. Busca com `useDebounce(..., 350)`. `stats` deixou de derivar da
lista: sao duas consultas `head: true` (contagem exata, sem trazer linha). A `Pagination` recebe
`totalItems={pagination.total}` e a faixa exibida e calculada do total do servidor.

**Corrigido de passagem (a mudanca obrigou):** o seletor "Tipo" oferecia `coleta` e `entrega`, chaves de
`typeConfig` que **nao existem** no enum `notification_type` do banco (`info|success|warning|error|achievement`,
conferido em `types.ts` -- o tsc acusou TS2345). Com o filtro em memoria isso devolvia lista vazia; mandado ao
PostgREST viraria **400 e tela de erro**. As opcoes passaram a vir de `TIPOS_NOTIFICACAO` (o enum). `typeConfig`
ficou intacto para os icones.

**Verificacao:** spec novo `tests/contracts/notificacoes-paginacao-servidor.spec.ts`, 17 casos: count exato;
`.range` presente e `.limit` ausente no hook inteiro; os dois `.order` na ordem certa e antes do recorte; os tres
filtros na cadeia; `ilike` em `title`/`message`; limpeza do termo; filtros na `queryKey`; `enabled: !!userId`;
duas consultas `head: true`; tela sem `usePagination`/`useFilters`/`filteredData`; debounce alimentando a
consulta; `useSelection(rows)`; `totalItems` do servidor (e nunca `rows.length`); faixa calculada; vazio e
paginacao so depois de `isLoading` cair; limpar filtros zerando a busca; opcoes do seletor vindas do enum.
**10 mutacoes** -- sem `count`, sem desempate por `id`, `.limit(200)` de volta, filtro de tipo fora da cadeia,
filtros fora da `queryKey`, busca sem debounce, `totalItems={rows.length}`, `useSelection` com outro conjunto,
paginacao visivel antes de `isLoading` cair e termo sem limpeza -- falham **1 caso cada**; versao correta 17/17.
Suite completa **776/776** (92 arquivos), `tsc --noEmit` 0, `eslint .` **77 avisos / 0 erros** (orcamento 86; a
tela caiu de 399 para 370 linhas e saiu do aviso `max-lines`), `validate:query-limits` **0 nova(s)** -- as duas
consultas de contagem so passam porque o guard da etapa 211 reconhece `head: true` como nao-listagem (ajuste
incluido na PR #398).

**Nao verificado:** comportamento visual da paginacao depois do deploy e quantas notificacoes os usuarios reais
tem no banco (sem credencial nesta sessao). `read_at`, `action_url` e `metadata` seguem sem uso na tela -- fora do
escopo destas etapas.

### Registro - etapa 210 (2026-11-25) - achados P-01 e P-04 (cotacoes multicanal)

**Causa:** `useCotacoesMulticanal` fazia `.select("*, transportadora:transportadoras(...)")` +
`.order("created_at", { ascending: false })` **sem teto**, e a consulta tem `refetchInterval: 30000`
(`:66`, polling porque a tabela saiu do Realtime por seguranca). A pior combinacao de P-01: a unica leitura sem
teto que tambem se repete sozinha -- a tabela inteira, com join e 23 colunas, era rebaixada **120 vezes por
hora** por usuario com a tela aberta. Somava-se P-04: `select("*")` trazia as 23 colunas e a tela le 11.

**Entrega:** duas mudancas na mesma consulta. (1) `.limit(200)` depois do `.order(...)` -- 200 e o teto que
`useUnifiedTracking.tsx:138,167` usa para leitura operacional recorrente e cotacao e fluxo de curto prazo.
(2) o `*` virou a lista explicita das **11 colunas que a tela realmente le** (`id`, `canal`, `status`,
`origem_estado`, `destino_estado`, `valor_cotado`, `prazo_dias`, `expires_at`, `retry_count`, `workflow_logs`,
`normalization_data`), com o join `transportadora:transportadoras (id, nome_fantasia, razao_social,
score_performance)` intacto. `refetchInterval: 30000` preservado (o plano proibe mexer) e as mutacoes
(`createCotacao`/`updateCotacao`/`selectCotacao`) intactas -- a de criacao segue com `*`, mas tem
`.single()`, entao nao e listagem. O tipo `CotacaoMulticanal` **nao** foi alterado: o `as` de `:63` continua
compilando porque o tipo completo e atribuivel ao objeto reduzido.

**Verificacao:** spec de contrato novo `tests/contracts/cotacoes-multicanal-teto.spec.ts` (6 casos). O caso
central extrai da **tela** (`DashboardCotacoes.tsx`) todo campo lido via `cotacao.`/`c.`/`selectedCotacao.` e
exige **igualdade exata** com a lista de colunas do select -- nem a menos (vira `undefined` silencioso) nem a
mais (payload de volta). Ha guarda contra passar por vacuidade (>= 6 campos) e um caso que confirma que as 11
colunas descartadas (`user_id`, `transportadora_id`, `origem_cidade`, `destino_cidade`, `peso_kg`, `volumes`,
`valor_mercadoria`, `observacoes`, `responded_at`, `created_at`, `updated_at`) continuam sem leitura na tela.
8 mutacoes -- sem `.limit`, `.limit(5000)`, `*` de volta, remover `retry_count` do select, colocar `peso_kg` de
volta no select, a tela passar a ler `cotacao.peso_kg`, `refetchInterval` para 60000 e tirar o join da
transportadora -- falham **1/1/2/1/1/2/1/2**; a versao correta passa 6/6. `eslint` limpo, `tsc` 0.

**Nao verificado:** o tamanho em KB da resposta antes/depois (o plano pede) e o numero real de cotacoes no
banco -- sem credencial de banco e sem deploy nesta sessao. Nao ha filtro de periodo nesta tela, entao 200 e o
limite escolhido: cotacoes alem das 200 mais recentes nao aparecem no painel.

### Registro - etapa 209 (2026-11-25) - achado P-01 (recorte pelo mes exibido)

**Causa:** depois das etapas 207 e 208 as duas consultas tinham teto, mas continuavam pedindo ao banco todas as
coletas e entregas com data prevista -- passadas e futuras -- e o calendario descartava no cliente tudo que nao
era do mes exibido. O teto tinha virado corte arbitrario: navegando para o mes seguinte, as linhas podiam nao
estar entre as 500 que vieram. A raiz e que `CalendarFilters` nao tinha o mes: a tela sabia qual estava
exibindo, o hook nao.

**Entrega:** `CalendarFilters` ganhou `from: Date` e `to: Date` **obrigatorios**; as duas consultas ganharam
`.gte(<coluna>, from.toISOString())` / `.lte(<coluna>, to.toISOString())` (`data_prevista_coleta` e
`previsao_entrega` sao `timestamptz`, conferido nas migrations, entao ISO com offset e a forma correta) e a
chave de cache passou a ser `['logistics-calendar', filters, from.toISOString(), to.toISOString()]` -- trocar
de mes muda a consulta, logo tem que mudar o cache. `CalendarioLogistico.tsx` (unico chamador) passa
`startOfMonth(currentMonth)` / `endOfMonth(currentMonth)` do `date-fns`, que a propria tela ja importava. Os
`.limit(500)` das etapas 207 e 208 **permanecem**, agora como rede contra intervalo absurdo e nao como corte
do mes. Filtros condicionais de status/transportadora intactos.

**Verificacao:** spec de contrato novo `tests/contracts/calendar-filtro-mes.spec.ts` (6 casos). O primeiro faz
**prova de tipo** checada por `tsc --noEmit`: removidas as diretivas `@ts-expect-error`, o tsc acusa
`TS2741: Property 'to' is missing in type '{ status: never[]; transportadoraId: null; type: "all"; from: Date; }'`
e o mesmo para `from` -- o tipo e que trava o esquecimento, nao o aviso. 6 mutacoes: remover o `.gte` de
coletas, trocar a coluna do `.lte`, tirar `from`/`to` da chave de cache, a tela passar `currentMonth` cru em vez
do intervalo do mes, devolver o bloco de entregas ao formato da 208 e tirar `from`/`to` do tipo (esta ultima
pega pelo tsc, nao pelo vitest) -- todas capturadas; versao correta 6/6.

**Observado (risco do plano conferido):** `defaultOptions.queries.staleTime = 60 * 1000` e
`gcTime = 5 * 60 * 1000` em `src/App.tsx:81-88`. Voltar a um mes ja visitado dentro de 60 s reaproveita o
cache, entao "varrer" meses nao dispara consulta repetida para o mesmo mes. Navegar para um mes novo passa a
disparar **uma** consulta por mes (antes era uma so para o ano inteiro) -- em troca, cada resposta e muito
menor. A tela so navega mes a mes (`addMonths`/`subMonths`), nao tem visao anual; se ganhar, o teto de 500
volta a cortar e isso deve ser resolvido la, nao aumentando o teto em silencio.

**Nao verificado:** o numero real de linhas por mes no banco e o efeito "antes/depois" na tela -- sem
credencial de banco e sem deploy nesta sessao.

### Registro - etapa 208 (2026-11-25) - achado P-01 (teto na leitura de entregas)

**Causa:** mesma da etapa 207, no bloco gemeo. `src/hooks/logistics/useLogisticsCalendar.tsx` montava
`entregasQuery` com `.select(...)` + `.not('previsao_entrega', 'is', null)` e **nenhum teto**; os filtros de
status e transportadora tambem sao condicionais, e `entregas` e uma das tabelas mais movimentadas do sistema.
Calendario aberto em "entregas" ou "todos" sem filtro baixava a tabela inteira, com joins de `transportadoras`
e `clientes`.

**Entrega:** espelho exato da 207 -- `.order('previsao_entrega', { ascending: true })` + `.limit(500)`,
incondicional e colado ao `.not('previsao_entrega', 'is', null)`, antes dos filtros opcionais. Ordem antes do
corte pelo mesmo motivo: sem ordenacao, as 500 linhas que sobram sao arbitrarias e o calendario esconde meses
inteiros. Filtros condicionais intactos; bloco de `coletas` (etapa 207) confirmado sem alteracao pela propria
regressao do spec.

**Verificacao:** spec de contrato novo `tests/contracts/calendar-teto-entregas.spec.ts` (6 casos), com o helper
`bloco(nome)` reaproveitado para coletas e entregas -- o 6o caso guarda explicitamente contra regressao do teto
de coletas. 7 mutacoes -- remover `.limit(500)` de entregas, remover `.order(...)`, trocar para `.limit(5000)`,
inverter para `ascending: false`, mover o teto para depois dos filtros condicionais, remover o
`.not('previsao_entrega')` e remover o teto de coletas -- falham **4/1/3/1/1/1/1**; a versao correta passa 6/6.

**Nao verificado:** o numero real de linhas de `entregas` no banco e o efeito "antes/depois" na tela -- sem
credencial de banco e sem deploy nesta sessao.

### Registro - etapa 207 (2026-11-25) - achado P-01 (teto na leitura de coletas)

**Causa:** `src/hooks/logistics/useLogisticsCalendar.tsx` montava a consulta de `coletas` com
`.select(...)` + `.not('data_prevista_coleta', 'is', null)` e **nenhum teto**. Os dois filtros existentes sao
opcionais (`if (filters.status.length > 0)` / `if (filters.transportadoraId)`), e o unico filtro garantido --
"data prevista nao nula" -- nao limita nada: com o calendario aberto sem filtro de status/transportadora a tela
baixa a tabela inteira de coletas.

**Entrega:** teto de **500** (o mesmo ja adotado em `Coletas.tsx:122`, `Envios.tsx:353` e
`KanbanEntregas.tsx:268`) + `.order('data_prevista_coleta', { ascending: true })` **antes** do corte. A ordem
e parte do fix, nao enfeite: cortar sem ordenar devolve 500 linhas arbitrarias e o calendario perde justamente
os meses que seriam exibidos. O teto ficou **incondicional**, colado ao `.not(...)` e portanto antes de qualquer
filtro opcional -- se estivesse depois, uma tela filtrada continuaria sem teto. Filtros condicionais de status e
transportadora intactos; o bloco de `entregas` do mesmo arquivo **nao** foi tocado (e a etapa 208).

**Verificacao:** spec de contrato novo `tests/contracts/calendar-teto-coletas.spec.ts` (5 casos), que amarra o
teto, a ordem-antes-do-corte, o valor de 500 usado no repositorio, a posicao incondicional do corte (indice do
`.limit(` menor que o do primeiro `if (filters.status.length > 0)`) e a integridade dos filtros condicionais.
6 mutacoes -- remover `.limit(500)`, remover `.order(...)`, trocar para `.limit(5000)`, inverter para
`ascending: false`, mover o teto para depois dos filtros condicionais e remover o `.not('data_prevista_coleta')`
-- falham **4/1/3/1/1/1**; a versao correta passa 5/5. `eslint` limpo nos dois arquivos, `tsc --noEmit` 0,
`lint:budget` 77/86 com 0 erros, suite **741/741** (88 arquivos).

**Nao verificado:** o numero real de linhas de `coletas` no banco e o efeito "antes/depois" na tela -- sem
credencial de banco e sem deploy nesta sessao.

### Registro - etapa 206 (2026-11-25) - achado P-01 (janela de datas obrigatoria no hook)

**Causa:** a assinatura `(dateFrom?: Date, dateTo?: Date)` mantinha vivo o caminho sem filtro: qualquer tela nova
que chamasse o hook sem argumentos voltaria a varrer `rastreamento_historico`, e o typecheck aprovaria. Foi
exatamente o que aconteceu em `Analytics.tsx:71`, corrigido so na etapa 205 — parametro opcional e o defeito, a
etapa 205 tratou o sintoma.

**Entrega:** `useTrackingAnalytics({ from, to }: TrackingDateRange)` -- janela obrigatoria com **tipo
exportado**. Os dois filtros foram para a cadeia do servidor (`.gte('recorded_at', from.toISOString())` /
`.lte('recorded_at', to.toISOString())`), sem `if`, e a `queryKey` passou a usar `from.toISOString()` /
`to.toISOString()`. O teto de 5000 da etapa 204 **permanece**: janela de data nao substitui teto, porque um
intervalo largo ainda traz milhares de linhas. Unico chamador adaptado: `Analytics.tsx` monta `trackingRange`
(com fallback de ultimos 30 dias quando o seletor esta vazio) e o repassa. Nao foi usado `console.warn` como
guarda -- `npm run validate:no-console` existe justamente porque console nao e mecanismo de controle; o guarda
agora e o tipo.

**Verificacao:** `grep -rn 'useTrackingAnalytics' src/` confirma `Analytics.tsx` como unico chamador (o
`hooks/index.ts:126` e so re-export). Spec de contrato novo `tests/contracts/tracking-janela-obrigatoria.spec.ts`
(6 casos), com **prova de tipo** checada por `tsc --noEmit`: `@ts-expect-error` em
`TrackingDateRange = { from: new Date(0) }` -- removida a diretiva, o tsc acusa
`TS2741: Property 'to' is missing in type '{ from: Date; }'`. 7 mutacoes (`Partial<TrackingDateRange>`, sem
filtro de inicio, sem filtro de fim, sem teto, chamador sem a janela, janela ignorando o periodo escolhido e fim
sem fallback) falham **1/1/1/3/2/1/2**; o spec da etapa 205 foi adaptado a nova forma (passa a observar o bloco
`trackingRange`) e a versao correta passa 16/16 nos tres specs. `eslint` limpo nos 4 arquivos, `tsc` 0,
`lint:budget` 77/86 com 0 erros, suite **736/736** (87 arquivos).

### Registro - etapa 205 (2026-11-25) - achado P-01 (`Analytics.tsx` nao passava o periodo)

**Causa:** `src/pages/Analytics.tsx:71` chamava `useTrackingAnalytics()` **sem argumento**, embora a tela ja
mantivesse o `dateRange` no estado (`:60-63`, padrao ultimos 30 dias) e ja o repassasse corretamente para
`useAnalytics` tres linhas acima (`:65-69`). Como `dateFrom`/`dateTo` sao opcionais na assinatura
(`useTrackingAnalytics.tsx:117`), o esquecimento nao dava erro de compilacao nem aviso de lint — era invisivel,
e a consulta mais cara da tela continuava sem filtro.

**Entrega:** so a linha `:71`, com os mesmos fallbacks do `useAnalytics` logo acima:
`useTrackingAnalytics(dateRange?.from, dateRange?.to || dateRange?.from)`. O `queryKey` do hook ja inclui
`dateFrom?.toISOString()`/`dateTo?.toISOString()`, entao o cache invalida sozinho quando o usuario troca o
periodo — nada a acrescentar. Nao foi colocado periodo padrao dentro do hook (duas fontes de verdade para o
periodo fariam o grafico ignorar o seletor); nem tocado `useAnalytics`/`useKPIBenchmark` (219/220); nem a
assinatura do hook (etapa 206).

**Verificacao:** spec de contrato novo `tests/contracts/analytics-janela-tracking.spec.ts` (4 casos: nao chama
sem argumentos, passa o inicio, usa o inicio como fim quando so ha uma ponta, pagina segue como fonte do
periodo). 4 mutacoes — voltar a chamada vazia, passar so o inicio, tirar o fallback do fim e passar
`new Date()` fixo — falham **3/1/1/3**; a versao correta passa 4/4. `eslint` limpo nos dois arquivos, `tsc` 0,
`lint:budget` 77/86 com 0 erros, suite **724/724** (85 arquivos). Diff: 4 insercoes, 1 delecao.
**Nao verificado:** os "valores antes/depois" do bloco de rastreio que o plano sugere anotar — exigem runtime
com dado real (sem credencial de banco e sem deploy desta branch nesta sessao).

### Registro - etapa 204 (2026-11-25) - achado P-01 (`useTrackingAnalytics` sem teto)

**Causa:** `src/hooks/logistics/useTrackingAnalytics.tsx:122-124` montava
`.from('rastreamento_historico').select('*').order('recorded_at', { ascending: true })` sem `.limit()` e sem
`.range()`. Os filtros de data de `:127-132` sao condicionais e o unico chamador, `src/pages/Analytics.tsx:71`,
chama `useTrackingAnalytics()` **sem argumentos** — os dois `if` nunca entravam, e `/analytics` baixava
`rastreamento_historico` inteira. E a tabela de maior crescimento do sistema (uma linha por consulta de rastreio,
com 18 particoes mensais) e era a unica leitura do repositorio sem nenhum teto.

**Entrega:** `.limit(TRACKING_POINTS_LIMIT)` com `TRACKING_POINTS_LIMIT = 5000` — mesmo valor ja usado em
`ExportacaoDados.tsx`/`AuditTrail.tsx`, nenhum numero novo. A ordem no servidor virou `ascending: false`
**antes** do corte: com `ascending: true` o teto guardaria os 5000 pontos **mais antigos** da tabela, e a tela
mostraria metricas plausiveis e erradas — pior que lentidao. O cliente reinverte com
`const orderedPoints = [...(data || [])].reverse()` antes do agrupamento por `lalamove_order_id`; o `reverse` e
sobre uma copia, entao o array do react-query nao e mutado. Nao foi para 500: o agrupamento corta ordens no meio
e produz metrica errada em silencio. A janela de data obrigatoria fica nas etapas 205/206.

**Verificacao:** spec de contrato novo `tests/contracts/tracking-teto-5000.spec.ts` (5 casos) amarrando a cadeia
do servidor, o valor do teto, a ordem-antes-do-corte e a reinversao. 6 mutacoes — ordem crescente e sem teto,
teto 500, sem reinversao, `reverse` mutando o array do cliente, `.range()` no lugar do teto e `forEach` no array
nao reinvertido — falham **2/2/1/1/2/1**; a versao correta passa 5/5. `eslint` limpo nos dois arquivos, `tsc` 0,
`lint:budget` 77/86 com 0 erros, suite **725/725** (85 arquivos). Diff: 11 insercoes, 2 delecoes.
**Nao verificado:** a contagem real de linhas de `rastreamento_historico` ("pontos registrados" antes/depois,
como o plano sugere) — nao ha credencial de banco nesta sessao.

### Registro - etapa 203 (2026-11-25) - achado P-01 (contrato de paginacao documentado)

**Causa:** `src/hooks/common/usePagination.ts` nao dizia em nenhum lugar que pagina **em memoria** — o nome
sugere paginacao e a linha 57 e `data.slice(startIndex, endIndex)`. Foi assim que `src/pages/Notificacoes.tsx:105`
chamou `usePagination(filteredData, { initialPageSize: 15 })` **depois** de baixar a tabela inteira (P-02): o
desenvolvedor acreditou que estava paginando. Ate a etapa 202 o repositorio tambem nao tinha a peca certa, e sem
um lugar que diga "qual hook para qual caso" o proximo agente repete a escolha errada.

**Entrega (so documentacao e um comentario de cabecalho, nenhuma mudanca de codigo):**

1. `docs/agentes/mapa-repo.md` ganhou a subsecao **"Listagens: teto e paginacao"**, com as tres decisoes na
   ordem — lista curta de dominio fechado (leitura inteira; `usePagination` se a tela paginar), lista longa que
   a tela so exibe (teto com `.limit()`, referencia `useNotifications.tsx:35`), e lista longa que o usuario
   navega pagina por pagina (`useServerPagination`, com `.range(from, to)` e `count: "exact"`) — mais as cinco
   regras do hook e a deixa explicita de que `usePagination` recorta array ja carregado.
2. `src/hooks/common/usePagination.ts` ganhou **duas linhas de comentario** no topo dizendo que o recorte e em
   memoria e apontando para `useServerPagination` quando os dados vierem do banco. O codigo nao foi tocado: 20
   arquivos dependem da assinatura atual, e renomear o hook seria churn sem beneficio.
3. `- [x] **203**` no checklist.

**Verificacao:** `node scripts/ci/check-claude-md-integrity.mjs` OK (8 secoes; 66677 bytes contra base de 65418 —
o acrescimo e a subsecao nova); `grep -n 'useServerPagination' docs/agentes/mapa-repo.md
src/hooks/common/usePagination.ts` devolve as ocorrencias esperadas; `eslint` limpo; `tsc` 0; suite **711/711**
(so comentario e markdown, nenhum caminho de execucao alterado). Diff: 43 insercoes, 1 delecao (a linha do checklist).

### Registro - etapa 202 (2026-11-25) - achado P-01 (`useServerPagination`)

**Causa:** nao havia paginacao no servidor em nenhum ponto do front — `grep -rn '.range(' src/` devolvia zero. O
que existia era `src/hooks/common/usePagination.ts:57` (`data.slice(startIndex, endIndex)`), recorte **em
memoria**: a lista inteira ja tinha sido baixada. Sem a peca certa, cada tela de lista longa ou baixava tudo
(P-01/P-02) ou inventava um `.limit()` proprio — dai as 16 listagens com limite ad-hoc (1 a 5000) e 5 sem teto.

**Entrega:** `src/hooks/common/useServerPagination.ts`, arquivo **novo**, sem consumidor nesta etapa (nenhuma
tela convertida, `usePagination.ts` intacto — 20 arquivos dependem dele). O contrato esta fechado no topo do
arquivo porque as etapas 203, 209 e 211+ o citam:

1. pagina vira faixa: `from = (page - 1) * pageSize`, `to = from + pageSize - 1`, e o consumidor chama
   `.range(from, to)` — nunca com `.limit()`;
2. total vem do servidor (`{ count: "exact" }`), nao de `rows.length`;
3. a `queryKey` inclui base de filtros, pagina e `pageSize`; **trocar filtro volta para a pagina 1**;
4. `placeholderData` mantem as linhas anteriores na troca (para o indicador use `isFetching`, nao `isLoading`);
5. ordenacao estavel e do consumidor (`.order(...)` com desempate), porque `.range()` sem ordem deterministica
   repete e some linhas entre paginas.

A forma de retorno espelha `usePagination` (`currentPage`, `pageSize`, `totalPages`, `setPage`, `nextPage`,
`prevPage`, `setPageSize`) para a barra de paginacao nao ser reescrita quando as telas trocarem de hook.

**Decisoes de desenho:** a pagina fica **ancorada na base de filtros** em que foi escolhida — trocar filtro faz a
pagina efetiva voltar a 1 sem `useEffect` e sem `setState` durante a renderizacao (regra 3); `setPage` sofre
clamp em `[1, totalPages]` e valor nao finito vira pagina 1; `resultado.error` do cliente de dados e **lancado**
para o react-query, porque o Supabase o devolve em vez de lancar. Quando o servidor nao informa `count`, `total`
e a faixa ja conhecida e libera uma pagina adiante enquanto a atual vier cheia — melhor que dizer "1 de 1" e
travar a navegacao numa lista que continua.

**Spec:** `src/hooks/common/useServerPagination.test.ts`, **9 casos**: faixa da pagina 1 (0..9) e da pagina 2
(10..19); `total`/`totalPages` de `count` (25 -> 3 paginas) e nao de `rows.length`; clamp de `setPage(99)`,
`setPage(0)` e `setPage(NaN)`; `setPageSize` voltando a pagina 1 com a faixa nova; troca de filtro voltando a
pagina 1; erro do cliente virando `isError` com lista vazia; sem `count`, avanco enquanto a pagina vier cheia e
parada na parcial; `initialPage`.

**Verificacao:** prova por mutacao A-G -> 8/2/1/1/1/1/1 falhas (faixa errada, `total` de `rows.length`, sem
clamp, `setPageSize` mantendo a pagina, sem reset de filtro, erro nao lancado, `totalPages` sem `count`),
restaurado 9/9; `eslint` limpo nos dois arquivos novos; `tsc` 0; `lint:budget` 77/86 (nenhum aviso novo);
suite **711/711**; `grep -rn '.range(' src/` agora devolve ocorrencias (o exemplo de uso no comentario do hook).
Sem consumidor, nao ha mudanca de comportamento nas telas — reversao por `git revert`.

### Registro - etapa 201 (2026-11-25) - achado B-10 (`fetch-with-timeout`)

**Causa:** o cabecalho de `_shared/fetch-with-timeout.ts` afirmava "built-in timeout and retry logic". O corpo
(`:5-28`) tem só tempo limite: `AbortController`, `setTimeout`, `AbortError` virando erro de tempo limite.
Nenhuma das 44 funcoes do repositorio faz retentativa com espera progressiva. Comentario que promete o que o
codigo nao faz e pior que silencio: o proximo agente le "tem retry", confia, e deixa de implementar onde
precisaria. A segunda linha citava "Dimension 19: Availability (Audit 10/10)", mesma familia de afirmacao sem
lastro (H-05).

**Correcao:** **apenas comentario** — o corpo nao foi tocado, porque este helper e consumido por
`_shared/safeFetch.ts:107-110`, que atende as **36 chamadas a terceiro** do repositorio (Resend, Lalamove,
Rodonaves, Melhor Envio, Bitrix24, Evolution, Mapbox, ViaCEP, OpenWeather, Google AI, HIBP, Slack). Diff: 1
insercao e 2 remocoes, so o bloco de abertura, que passou a dizer "per-request timeout (default 10s); it does
NOT retry".

**Retentativa nao foi implementada**, de proposito: com a idempotencia de B-01/B-02, cada nova tentativa grava
o evento de novo. A ordem e idempotencia primeiro, e so depois **avaliar** retentativa — decisao do dono, fora
desta etapa. Nenhum ponto concreto do repositorio foi identificado como carente de retentativa.

**Spec:** `tests/contracts/fetch-with-timeout-comentario.spec.ts`, 4 casos, que amarram texto e codigo: o
comentario nao promete retentativa; o tempo limite declarado (10 s) bate com o `options` do codigo (10000 ms);
sem "Audit 10/10"/"Dimension 19"; e o corpo nao faz segunda tentativa (uma unica chamada a `fetch`).

**Verificacao:** prova por mutacao A-E -> 3/1/1/2/2 falhas, restaurado 4/4; `deno check` 0 erros; `deno lint`
limpo; `deno fmt --check` acusa o mesmo arquivo antes e depois (aspas simples herdadas em `:22`, baseline de
`origin/main` falha igual); `tsc` 0; `lint:budget` ok; suite **704/704**. Merge republica as funcoes que
importam o helper — deploy conferido depois.

### Registro - etapa 200 (2026-11-25) - achado B-09 (`push-send`)

**Causa:** `webpush.sendNotification` (`:160`) fala com FCM/APNs por conta propria e **nao passa por `safeFetch`
nem por `fetch-with-timeout.ts`**, entao o envio nao tinha tempo limite nenhum. Provedor lento prendia o laco
por inscricao (`:158`) e o **lote inteiro** morria no limite de execucao da funcao — o `catch` por inscricao que
ja existia nunca chegava a agir.

**Correcao:** a propria biblioteca aceita o tempo limite — conferido na fonte antes de escolher:
`web-push@3.6.7`, `src/web-push-lib.js:222` (`if (typeof options.timeout === 'number') timeout = options.timeout;`),
aplicado ao request HTTPS em `:356-357` e com o socket destruido no evento `timeout` em `:395-397`. Entao o
terceiro argumento passou a ser `{ timeout: PUSH_TIMEOUT_MS }` com **`PUSH_TIMEOUT_MS = 10000`**, o mesmo valor de
`_shared/fetch-with-timeout.ts:9` (ha um caso de teste que amarra os dois para nao divergirem depois).
`Promise.race` resolveria o laco mas **nao** aborta a conexao: a requisicao seguiria viva contra o provedor. A
opcao nativa aborta de verdade.

**Estouro = falha da inscricao, nunca do lote:** `isPushTimeout` (sem `statusCode` e com `ETIMEDOUT` ou
`/timeout/i` na mensagem) marca o erro e ele entra na lista `errors` que ja existia como `"timeout"`; o laco
segue com as outras inscricoes. **Nao ha retentativa** — B-10 e explicito e, aqui, cada reenvio e uma
notificacao repetida no celular do usuario. Tempo limite **nao** apaga inscricao: o `delete` em
`push_subscriptions` continua preso apenas ao 404/410 do provedor, porque lentidao nao e inscricao invalida.
Rate limit, leitura das inscricoes e o formato da resposta (`sent`/`failed`/`errors`) nao foram tocados.

**Teste novo:** `tests/contracts/push-send-timeout.spec.ts` (**7 casos**) — tempo limite explicito em cada envio;
mesmo valor do helper compartilhado; estouro virando `"timeout"` na lista de erros sem derrubar o lote; a
classificacao sem confundir com resposta do provedor; `delete` preso a 404/410; uma unica chamada de
`sendNotification` (sem retentativa); resposta do lote intacta.

**Verificado de verdade:**

- Prova por mutacao (A-E): A sem `options.timeout` -> **1** falha; B valor 30 s divergente do helper -> **2**;
  C estouro nao virando `"timeout"` -> **1**; D retentativa no envio -> **1**; E sem a guarda de `statusCode` ->
  **1**. Restaurado -> **7/7**.
- `deno check` **0 erros** (igual ao baseline); `deno lint` **3 = 3**; `deno fmt --check` acusa **3 linhas antes e
  3 depois** (as herdadas de `:183-185`).
- `tsc --noEmit` 0; `npm run lint:budget` **ok** (77/86 avisos, 0 erros); suite **707/707** (82 arquivos).
- O proprio gate de avisos pegou uma assercao generica no spec novo (`sonarjs/prefer-specific-assertions`
  exigindo `toHaveLength` em vez de `.length` + `toBe`) — corrigida antes do commit; nao foi para o CI.

**Dependencia registrada na PR:** o tempo tipico de resposta de FCM/APNs nao esta medido (sem secret VAPID real
no ambiente de teste), entao os 10 s vieram do padrao ja usado no repositorio; se o provedor costumar demorar
mais, o lote passa a reportar falhas que antes "funcionavam devagar" e o numero precisa subir.

### Registro - etapa 199 (2026-11-25) - achado B-08 (`ingest-biosync`)

**Causa:** `ingest-biosync:39-50` inseria em `bio_sync_telemetry` (e `:63` em `nexus_tactical_logs`, `:72` no
Bitrix24) **sem chave de evento**. O dispositivo de biometria reenvia a leitura quando perde a resposta: o
mesmo batimento virava duas linhas e o alerta disparava de novo para o mesmo motorista.

**Correcao:** `claimIdempotencyKey` de `_shared/idempotency.ts:28`, reivindicado depois do parse e **antes** de
qualquer efeito. A chave vem de `buildEventKey` com `["biosync", vehicle_id, driver_id, identidade]`:
`eventTime` (o `event_time`/`timestamp` que o **corpo** traz) ou, quando o dispositivo nao manda horario,
`sha256-<hash canonico do corpo>` de `bodyHash` (etapa 138). Relogio do servidor (`new Date()`) nao entra — e
exatamente o defeito de B-02, o horario de recebimento muda a cada reenvio e a dedupe nunca casa. Duplicata
responde **200** `{ success: true, duplicate: true }`, como `carrier-webhook-receiver`, para o dispositivo nao
ficar reenviando. O valor medido **nao** entra em texto claro na chave (LGPD): quando aparece, vai dentro do
hash.

**Um detalhe que o desenho ingenuo erraria:** passar o corpo apenas como `fallbackBody` do `buildEventKey` nao
funciona aqui — o fallback so age quando **nenhuma** parte tem valor, e `vehicle_id`/`driver_id` sao
obrigatorios (`parse.ts`), logo ele nunca seria usado: toda leitura daquele motorista viraria duplicata da
primeira. Por isso o hash entra como **parte** da chave e so no lugar do horario ausente.

**Teste novo:** `tests/contracts/ingest-biosync-dedupe.spec.ts` (**7 casos**) — helper compartilhado em vez de
dedupe caseiro; chave com identificadores estaveis e horario do evento (e sem `new Date`); sem horario cai no
hash do corpo, com reenvio casando e batimento diferente nao casando; reivindicacao **antes** da telemetria, do
log tatico e do Bitrix24; duplicata em 200; nenhum valor medido em texto claro na chave; telemetria continua
gravada e devolvida.

**Spec herdado ajustado:** `ingest-biosync-input.spec.ts:99` fixava o literal
`parseBioSyncInput((await req.json())`; o corpo agora vive em `body` (o hash precisa dele) — as duas assercoes
passaram a `parseBioSyncInput(body)` e a comparacao de ordem (parse antes dos limiares) continua igual. A tabela
de `tests/contracts/cors-onda5.spec.ts` foi de **2 para 4** respostas em `ingest-biosync`: as duas novas (400 e
200-duplicata) tambem levam CORS resolvido.

**Verificado de verdade:**

- Prova por mutacao (A-E): A claim removida -> **2** falhas; B claim depois do insert -> **2**; C relogio do
  servidor na chave -> **2**; D valor medido em texto claro -> **2**; E duplicata com 409 -> **1**. Restaurado
  -> **7/7**.
- `deno check` nesta funcao **0 erros** (igual ao baseline); `deno lint` **4 = 4** problemas herdados
  (`no-import-prefix` dos imports remotos, mesmos arquivos e locais); `deno fmt --check` acusa **7 linhas antes
  e 7 depois** — nenhuma violacao nova.
- `tsc --noEmit` 0; `npm run lint:budget` **ok**; suite **700/700** (80 arquivos).

**Nao coberto (segue em aberto):** a restricao unica que impediria duplicata por corrida simultanea nasce de
`idempotency_keys`, nao de `bio_sync_telemetry` — nao foi preciso DDL.

### Registro - fechamento do achado B-07 (2026-11-25) - 5 funcoes sem etapa no plano

**Causa:** o B-07 lista **25** funcoes com o curinga e as etapas 179-198 cobrem 20. As outras cinco — `health`,
`rodonaves-webhook`, `carrier-webhook-receiver`, `nexus-webhook-receiver`, `get-weather-data` — **nao tinham
etapa** no `04-PLANO.md` e continuavam respondendo `Access-Control-Allow-Origin: *`. Sem elas o achado seguia
aberto mesmo com as 20 etapas concluidas.

**Correcao (mesma receita das 179-198, so nestes 5 arquivos):** import de `getCorsHeaders`, remocao do bloco
literal, `const headers = getCorsHeaders(req)` antes do preflight e a troca da constante no resto do handler.
**+47 -64**. Nenhuma linha de regra de negocio mudou.

**Specs herdados ajustados:** `nexus-webhook-receiver-erro-generico.spec.ts:29` e
`rodonaves-webhook-erro-generico.spec.ts:27` asseguravam por texto
`internalErrorResponse(error, corsHeaders, ...)` e passaram a exigir `headers`. Em `nexus-webhook-receiver` sao
**13 respostas** e so **7** com CORS (as outras sao internas), por isso a tabela do spec novo guarda
`{ respostas, comHeaders }` por funcao em vez de um numero unico.

**Teste novo:** `tests/contracts/cors-restantes.spec.ts` (**22 casos**) — 20 por funcao (nenhum literal
`Access-Control-Allow-*`, helper em vez da constante, helper antes do `OPTIONS`, contagem exata) + o preflight
respondendo com `{ headers }` + varredura agregada de curinga.

**Verificado de verdade:**

- Prova por mutacao (A-E): A `health` revertido ao original -> **4** falhas; B curinga literal de volta numa
  resposta -> **1**; C uma resposta perde o CORS -> **2**; D helper calculado depois do `OPTIONS` -> **1**;
  E a constante antiga volta -> **1**. Restaurado -> **22/22**.
- `deno check`: `carrier-webhook-receiver` **1** e `nexus-webhook-receiver` **2** erros, **identicos ao
  baseline** de `origin/main`; `deno lint` **17 = 17**; `deno fmt --check` acusa **os mesmos 5 arquivos** antes
  e depois.
- `tsc --noEmit` 0; `npm run lint:budget` **ok**; suite **693/693** (80 arquivos) depois do rebase na `main` que
  ja contem a #384.

**Estado do achado:** com as 20 etapas + estas 5, **nenhuma das 25 funcoes do B-07 fixa o curinga**.
`melhor-envio-api` e `rodonaves-api` nunca estiveram erradas — ja resolviam pela origem numa constante local
com o mesmo nome.

### Registro - etapas 180 a 198 (2026-11-25) - achado B-07 (onda 5 de CORS)

**Causa:** dezenove edge functions escreviam `Access-Control-Allow-Origin: *` a mao num bloco `const
corsHeaders = {...}` no topo do arquivo. Com o curinga, **qualquer pagina da internet** pode chamar a funcao
com a sessao do visitante logado e **ler a resposta** — inclusive as que devolvem dado de usuario
(`get-mapbox-token` entregava o token do Mapbox; `send-password-reset`, `validate-login`, `log-login-attempt`,
`check-password-breach` e `new-device-alert` trafegam e-mail, IP e resultado de login).

**Por que uma PR unica para as 19 etapas:** e a **mesma causa raiz**, a **mesma receita** e nenhuma das 19 se
sobrepoe a outra em arquivo. Uma PR por etapa custaria 19 filas de CI e 19 rebases concorrentes entre si, sem
ganho de seguranca — o defeito so deixa de existir quando todas param de responder o curinga.

**Correcao (so os 19 arquivos listados nas etapas):** cada arquivo passou a importar `getCorsHeaders` de
`../_shared/cors.ts`, o bloco literal foi removido e o handler calcula `const headers = getCorsHeaders(req)`
**antes** do preflight. Total: **118 respostas** — **99** espalham `...headers` e as **19** do `OPTIONS` usam
`{ headers }`. Em `accuracy-weekly-digest` o helper tambem entrou no `handlePreview(req)`, que responde por
conta propria; em `new-device-alert` o alvo foi o `handler`, que e o que o `serve` recebe. Nenhuma linha de
regra de negocio mudou: o diff e o import, a linha do helper e a troca da constante pelos cabecalhos
resolvidos. `_shared/cors.ts` **nao** foi tocado (16 funcoes dependem dele).

**Specs herdados ajustados (sem isso a suite quebrava):** oito specs de contrato asseguram por texto o corpo
do `catch` e das respostas de validacao dessas funcoes; **10 assercoes** esperavam `corsHeaders` e passaram a
esperar `headers` (a unica que exigia o literal `"Access-Control-Allow-Origin": "*"` virou a exigencia do
contrato novo, `const headers = getCorsHeaders(req);`). Nada de comportamento foi afrouxado — a assercao
continua apontando para o mesmo ponto do codigo.

**Teste novo:** `tests/contracts/cors-onda5.spec.ts` (**78 casos**) — por funcao: nenhum literal
`Access-Control-Allow-*`; o helper em vez da constante; helper **antes** do `OPTIONS`; contagem exata de
respostas e de `...headers`. Mais dois casos de varredura: o preflight responde com `{ headers }` (e nunca
`...headers`) e nenhuma das 19 ficou com curinga em qualquer cabecalho.

**Verificado de verdade:**

- Prova por mutacao (A-G): A `get-mapbox-token` revertido ao original -> **4** falhas; B curinga literal de
  volta numa resposta -> **3**; C uma resposta perde o CORS -> **1**; D helper calculado depois do `OPTIONS`
  -> **2**; E a constante antiga volta numa resposta -> **2**; F helper nao usado -> **2**; G tres respostas
  sem CORS -> **1**. Restaurado -> **78/78**.
- `deno check` nas 19: **16 erros somados, identicos ao baseline** medido funcao por funcao em `origin/main`;
  `deno lint` **43 problemas / 19 arquivos**, igual ao baseline; `deno fmt --check` acusa **os mesmos 17
  arquivos herdados** antes e depois — nenhum arquivo entrou ou saiu da lista do `fmt`.
- `tsc --noEmit` 0; `npm run lint:budget` **ok** (0/0); suite **671/671** (79 arquivos) depois do rebase na
  179: 586 da base, +78 deste spec e +7 do spec da 179.

**Fechamento da etapa 179 (mesma PR anterior):** o deploy subiu (`deploy-functions.yml` **completed success**)
e o teste pos-deploy foi feito no proprio `secure-store` por HTTP real:
`OPTIONS` com `Origin: https://exemplo-malicioso.test` devolveu
`access-control-allow-origin: https://logiflow-nexus.lovable.app` — a origem maliciosa **nao** recebe a si
mesma, logo o navegador dela nao casa. O bloqueio esta valendo em producao.

**Fechado em seguida:** `health`, `rodonaves-webhook`, `carrier-webhook-receiver`,
`nexus-webhook-receiver` e `get-weather-data` nao tinham etapa no `04-PLANO.md`; a PR seguinte fechou as cinco
(ver registro do fechamento do B-07, acima). `melhor-envio-api` e `rodonaves-api` ja resolviam pela
origem (usam `getCorsHeaders(req)` numa constante local de mesmo nome) — o nome engana, o comportamento esta
certo.

**Proximo:** etapa 199 — `ingest-biosync`: deduplicar a telemetria do dispositivo (feita na PR seguinte).

### Registro - etapa 179 (2026-11-25) - achado B-07 (`secure-store`)

**Causa:** `supabase/functions/secure-store/index.ts:9-13` escrevia `Access-Control-Allow-Origin: *` a mao. E a
funcao que **cifra e decifra PII**: com `*`, qualquer pagina da internet fazia a requisicao com a sessao do
visitante logado e **lia a resposta** (o `decrypt` devolve o texto claro). Era a mais grave das 25.

**Correcao (so o arquivo da etapa):** `:8` passa a importar `getCorsHeaders` de `../_shared/cors.ts`, o bloco
literal de `:9-13` saiu e o `serve` calcula `const headers = getCorsHeaders(req)` **antes** do preflight. As
**10 respostas** usam os cabecalhos resolvidos (o `OPTIONS` com `{ headers }`, as outras nove com `...headers`).
`_shared/cors.ts`, o `checkRateLimit` (429 com `Retry-After`), a autenticacao por Bearer e o `catch` de padrao
B-06 (`internal_error` 500, com log da causa) ficaram intactos.

**A confirmacao que a etapa exigia — feita por HTTP real, nao por leitura:** `OPTIONS` na edge `health-check`
(que ja usa o helper) com `Origin: https://exemplo-malicioso.test` devolveu
`access-control-allow-origin: https://logiflow-nexus.lovable.app` e `vary: Origin`; com
`Origin: https://loggi-flow-v2.vercel.app` devolveu **o mesmo valor**. Ou seja: `ALLOWED_ORIGINS` **esta
configurado** (nao e `*`, nao esta vazio) e a origem do app na allowlist e `https://logiflow-nexus.lovable.app`.
A origem maliciosa recebe o fallback `list[0]`, que o navegador **nao** casa — o bloqueio e real.

**Achado colateral (nao corrigido aqui):** `https://loggi-flow-v2.vercel.app` **nao** esta na lista e recebe o
mesmo fallback — se ainda existir preview/deploy do Vercel servindo o app, ele ja esta bloqueado hoje nas 16
funcoes que usam o helper. Incluir esse dominio e mudanca de variavel de ambiente (Regra 8), fora desta etapa.

**Verificado de verdade:**

- `tests/contracts/secure-store-cors.spec.ts` (7 casos): nenhum literal `Access-Control-*` nem `"*"` no arquivo;
  `getCorsHeaders(req)` antes do `OPTIONS`; contagem exata de 10 respostas / 9 `...headers`; 429 com
  `Retry-After` e CORS; rate limit e auth antes de `req.json()`; `catch` B-06 intacto e sem `plaintext`.
- Prova por mutacao (A-F): A volta o `*` literal -> 3 falhas; B usa cabecalho estatico -> 3; C chama o helper
  sem `req` -> 2; D `OPTIONS` sem cabecalhos -> 1; E resolve a origem depois do preflight -> 2; F `catch`
  responde 200 -> 1. Restaurado -> 7/7.
- `deno check` **2 erros, os mesmos 2 do baseline** (`origin/main`); `deno lint` limpo; `deno fmt --check`:
  o unico diff sao as duas linhas herdadas (`:5` ordem de import, `:55` quebra de linha) — **nenhuma linha
  desta etapa** aparece no diff do `fmt`.
- `tsc --noEmit` 0; `npm run lint:budget` **ok** (o spec novo caiu em `sonarjs/prefer-specific-assertions` e os
  dois `expect(...).toBe(n)` viraram `toHaveLength`, antes do commit); suite **593/593**.

**NAO EXECUTADO ainda:** o teste pos-deploy no proprio `secure-store` (origem maliciosa nao deve receber
`Access-Control-Allow-Origin`) — depende do deploy desta PR; sera rodado e anotado no fechamento.

**Proximo:** etapa 180 — `external-db-bridge`, mesma receita (a fila 180-198 depende desta).

### Registro - etapa 178 (2026-11-25) - achado B-06 (varredura final das onze)

**Causa:** doze respostas de erro em onze funcoes ainda devolviam a mensagem interna: `whatsapp-notification`
(`:318`), `bitrix24-integration` (`:398`), `get-weather-data` (`:42`), `health-check` (`:70`),
`ocr-receipt-processor` (`:86`), `predict-delays` (`:396`), `nexus-auto-healing` (`:110`), `new-device-alert`
(`:202`), `check-rate-limit` (`:144`), `normalize-freight-response` (`:226`), `accuracy-weekly-digest`
(`:228` e o `nErr` de `:82`). Nove delas expunham o texto do Postgres/terceiro cru (nome de tabela, coluna,
policy, mensagem do provedor) a quem chamasse a funcao. O `accuracy-weekly-digest` tinha **dois** pontos: alem
do `catch` final, o `if (nErr)` da leitura de `notifications` devolvia `nErr.message` com 500.

**Correcao (uma linha por funcao, 12 linhas no total):** a mensagem passou a ser a mesma do helper da etapa 164
(`"INTERNAL_ERROR"`); nada mais mudou. **O status HTTP de cada funcao foi preservado**: 500 em sete, **503** no
`health-check` (o monitor le o status) e **400** em `get-weather-data`, `ocr-receipt-processor` e
`nexus-auto-healing`. Tambem foram preservadas as chaves de estado que quem chama ja le:
`success: false` (`whatsapp-notification`, `bitrix24-integration`, `predict-delays`), `ok: false`
(`accuracy-weekly-digest`) e `status: "unhealthy"` (`health-check`).

**Por que nao `internalErrorResponse` em todas:** o helper fixa **500** e o corpo `{"error":"INTERNAL_ERROR"}`.
Aplicado nas onze, ele mudaria o status de quatro funcoes (o 503 do monitor e os tres 400 de validacao) e
apagaria as chaves de estado — as duas coisas que a etapa proibe. Onde o corpo era so o erro e o status 500, o
resultado e byte a byte o mesmo do helper.

**O detalhe nao se perdeu:** tres funcoes nao registravam nada no `catch` e ganharam log (o `whatsapp` e o
`predict-delays` e o `new-device-alert` ja logavam):
`log.error("Weather lookup failed:", { error: error instanceof Error ? error.message : String(error) })`
(`get-weather-data`, que tambem passou a importar `_shared/logger.ts`), o mesmo para
`nexus-auto-healing` (`"Auto-healing request failed:"`) e `ocr-receipt-processor` (`"OCR processing failed:"`,
depois do ramo de `ValidationError`, que continua respondendo 400 com o campo).

**Quem via o detalhe:** quem chamasse as funcoes direto (curl, script, outra edge). Nos tres consumidores de UI
conferidos — `src/hooks/notifications/useWhatsAppNotification.tsx:32`,
`src/components/shipping/DeliveryReceiptUpload.tsx:112` e
`src/components/predictions/DigestPreviewPanel.tsx:32` — a tela depende do erro **HTTP** do `functions.invoke`
(toast fixo), nao do texto do corpo; nenhuma tela muda.

**Verificado de verdade:**

- `tests/contracts/erro-generico-varredura.spec.ts` (17 casos, um por funcao + logs + chaves de estado) —
  **17/17**. O caso de varredura percorre **todo** `JSON.stringify(...)` dos onze arquivos e falha se algum
  trecho ainda carregar `.message`: foi ele que achou o segundo ponto do `accuracy-weekly-digest` (`:82`), que
  o plano nao listava.
- Prova por mutacao (A-O, cada uma derruba exatamente 1 caso): A-F volta a mensagem em `whatsapp`,
  `bitrix24`, `predict-delays`, `health-check`, `new-device-alert`, `check-rate-limit` -> 1 falha cada;
  G-L idem em `normalize-freight-response`, `accuracy` (catch e `nErr`), `ocr`, `nexus`, `get-weather` -> 1
  cada; M-O remove o log novo de `ocr`, `nexus` e `get-weather` -> 1 cada. Restaurado -> 17/17.
- `deno check`: **0 erro nas 11** funcoes, igual ao baseline (medido funcao por funcao contra
  `origin/main`); `deno lint`: limpo nas 11; `deno fmt --check`: **identico ao baseline** (os tres logs novos
  foram reescritos no formato do `fmt`; o diff restante e herdado, ja presente antes da etapa).
- `tsc --noEmit` 0; `npm run lint:budget` ok; suite **586/586** depois do rebase em `main` (`f48a57a9`).

**NAO EXECUTADO:** derrubar o Postgres/terceiro de verdade para ver o 500/503/400 na resposta — exigiria
quebrar tabela ou credencial em producao; o caminho esta coberto pelas mutacoes acima.

**Proximo:** etapa 179 — primeira da fila de CORS `*` (aprovacao do dono).

### Registro - etapa 177 (2026-11-25) - achado B-06 (`smart-carrier-selection`)

**Causa:** o `catch` montava a resposta a mao com `{ error: "Internal Server Error", message: error.message }` e
status 500. A funcao le `freight_selection_rules` e `tabelas_frete` (com o join em `transportadoras`), e o
`throw tabelasError` de `:84-95` mandava o erro cru do PostgREST para esse catch — nome de tabela, de coluna e
texto de policy no corpo da resposta de quem pediu a cotacao.

**Correcao (so o arquivo da etapa):**

- `:7` — import de `internalErrorResponse` de `_shared/httpError.ts` (etapa 164).
- `:242-247` — o ramo `ValidationError` -> `validationErrorResponse` (400 com o campo, etapa 146) continua
  **antes**; o resto virou `return internalErrorResponse(error, corsHeaders, "smart-carrier-selection")`: 500
  `{"error":"INTERNAL_ERROR"}`, sem mensagem interna e sem stack. O `log({ level: LogLevel.ERROR, message: ...,
meta: { error: error.message } })` foi mantido — o detalhe continua no log.
- **Nao tocado:** a regra de escolha e os pesos default (`price_weight: 0.5`, `time_weight: 0.3`,
  `performance_weight: 0.2`, `max_sla_days: 15`) e o caminho de sucesso `{ success: true, recommendations }`.

**Por que nao devolver "nenhuma transportadora encontrada":** confundiria falha de sistema com resultado vazio
e o operador veria a tela errada. O 500 continua 500.

**Quem via o detalhe:** quem chamasse a funcao direto (curl/script). O unico consumidor no front e
`src/hooks/logistics/useSmartCarrierSelection.tsx:57`, que em falha HTTP mostra o toast fixo "Erro ao analisar
transportadoras" e usa `error.message` do `supabase.functions.invoke` (mensagem do proprio supabase-js), nao o
corpo; em resposta 200 de negocio usa `data.message`. Ou seja: a tela nao muda, e o detalhe do banco sai do
corpo publico.

**Verificado de verdade:** `tests/contracts/smart-carrier-selection-erro-generico.spec.ts` (7 casos) — 7/7; o
spec anterior `smart-carrier-selection-input.spec.ts` segue verde. Prova por mutacao: A volta a ecoar
`error.message` na resposta -> 3 falhas; B 500 escrito na mao -> 2; C 200 no catch -> 3; D remove o ramo de
`ValidationError` -> 1; E troca `parseSmartSelectionInput` por `JSON.parse` -> 1; F muda `price_weight` -> 1;
G devolve `success: true` no catch -> 3; restaurado -> 7/7. `deno check` 2 contra baseline 3 (a resposta antiga
tinha um `TS18046` proprio, removido junto); `deno lint` 11 = baseline 11; `deno fmt --check` 1 = baseline 1
(diff herdado nos imports/indentacao). `tsc` 0; `lint:budget` ok; suite 561 testes. Verificacao pedida pelo
plano (`grep -n 'error.message|internalErrorResponse'`): executada — `error.message` so na meta do log e o
`internalErrorResponse` no `catch`. Falha de banco real: NAO EXECUTADO (exigiria derrubar tabela em producao)
— RASTREADO pelo codigo.

### Registro - etapa 176 (2026-11-25) - achado B-06 (`rodonaves-webhook`)

**Causa:** duas portas abertas no mesmo arquivo. (1) `:213` fazia `throw updateError`, o erro cru do PostgREST do
`update` de `entregas` — nome de tabela, de coluna e texto de policy. (2) o `catch` devolvia
`{"error": error.message}` com 500, entao esse texto e o do `throw findError` de `:140` (select de `entregas`)
chegavam inteiros para quem chama o webhook da Rodonaves.

**Correcao (so o arquivo da etapa):**

- `:6` — import de `internalErrorResponse` de `_shared/httpError.ts` (etapa 164).
- `:213-220` — o erro do `update` passou a ser registrado no log
  (`log.error("[rodonaves-webhook] Falha ao atualizar a entrega:", { entrega_id, code: updateError.code, message: updateError.message })`)
  e o `throw` virou mensagem fixa `"Falha ao atualizar a entrega"`. Continua **falhando** de proposito: se
  atualizar a entrega nao funcionou, a Rodonaves precisa reenviar o evento.
- `:240-245` — o `catch` registra o detalhe so no log e responde
  `internalErrorResponse(error, corsHeaders, "rodonaves-webhook")`: 500 `{"error":"INTERNAL_ERROR"}`, sem
  mensagem interna e sem stack.
- **Nao tocado:** a chave de dedupe e o marcador `:170-198` (etapas 135/136, padrao de referencia de B-02), o
  HMAC `:63-77` (401), o rate limit `:42-55` (429) e o `insert` em `ocorrencias` de `:217` (achado novo).

**Quem via o detalhe:** o emissor do webhook (Rodonaves) e qualquer um que interceptasse a resposta; nenhuma
tela do app le esse texto. O detalhe completo agora fica no log da edge.

**Achados novos (anotados, nao corrigidos):** (1) o `insert` em `ocorrencias` de `:217` nao verifica erro;
(2) `:140` ainda faz `throw findError` cru — sem vazamento depois desta etapa, porque o `catch` e generico.

**Verificado de verdade:** `tests/contracts/rodonaves-webhook-erro-generico.spec.ts` (8 casos) — 8/8. Prova por
mutacao: A volta a ecoar `error.message` no catch -> 2 falhas; B 500 escrito na mao -> 1; C 200 no catch -> 2;
D objeto `error` como meta do log -> 1; E `throw updateError` de volta -> 2; F remove o `code` do log -> 1;
G segredo do HMAC trocado -> 1; H nome do rate limit trocado -> 1; restaurado -> 8/8. `deno check` 0 =
baseline 0; `deno lint` 3 = baseline 3; `deno fmt --check` 1 = baseline 1 (diff herdado nas linhas 22-30).
`tsc` 0; `lint:budget` ok; suite 555 testes. Verificacao pedida pelo plano (`grep -n 'error.message\|
internalErrorResponse\|throw updateError'`): executada — nao ha `throw updateError`, `error.message` aparece so
dentro das metas de `log.error` e o `internalErrorResponse` esta no `catch`. Webhook real da Rodonaves: NAO
EXECUTADO (exigiria a origem configurada com o segredo real) — RASTREADO pelo codigo.

### Registro - etapa 175 (2026-11-25) - achado B-06 (`lalamove-webhook`)

**Causa:** o `catch` de `lalamove-webhook` devolvia `{"error": error.message}` com status 500. A funcao grava
em `webhook_events_processed` e `rastreamento_historico`, entao o erro do Postgres descrevia **essas tabelas**
(nome de coluna, texto de policy, dica de SQL) para quem conseguisse chamar o webhook.

**Correcao (so o arquivo da etapa):**

- `:5` — import de `internalErrorResponse` de `_shared/httpError.ts` (etapa 164).
- `:229-233` — o `catch` registra o detalhe so no log
  (`log.error('[lalamove-webhook] Webhook processing error:', { message: error instanceof Error ? error.message : String(error) })`)
  e responde `internalErrorResponse(error, corsHeaders, 'lalamove-webhook')`: 500 com
  `{"error":"INTERNAL_ERROR"}`, sem mensagem interna e sem stack. O 500 se mantem de proposito — a Lalamove
  reenvia o evento em falha; 2xx perderia a atualizacao de rastreio.
- **Nao tocado:** o rate limit `:41-48` (429), o HMAC `:64-73` (401, etapa 009), o contrato `:76-93`
  (etapa 009), o marcador de idempotencia `:124-151` (etapas 133/134) e a chave `:101-121` (etapa 139).

**Quem via o detalhe:** o emissor do webhook (Lalamove) e qualquer um que interceptasse a resposta; nenhuma
tela do app le esse texto. O detalhe completo agora fica no log da edge.

**Achado novo (anotado, nao corrigido):** os `insert` de negocio em `:156-201` (`rastreamento_historico`,
`coletas`, `rastreamento_alertas`) nao verificam erro — so o primeiro loga (`:166`). Etapa futura: tratar falha
de gravacao como falha.

**Verificado de verdade:** `tests/contracts/lalamove-webhook-erro-generico.spec.ts` (7 casos) — 7/7. Prova por
mutacao: A volta a ecoar `error.message` -> 2 falhas; B 500 escrito na mao no lugar de `internalErrorResponse`
-> 1; C 200 no catch -> 2; D objeto `error` como meta do log -> 1; E segredo do HMAC trocado -> 1; F chave de
idempotencia nao-deterministica -> 1; G limite de rate limit elevado -> 1; restaurado -> 7/7. `deno check` 0 =
baseline 0; `deno lint` 3 = baseline 3; `deno fmt --check` 1 = baseline 1 (diff herdado nas linhas 12-20).
`tsc` 0; `lint:budget` ok; suite 547 testes. Verificacao pedida pelo plano (`grep -n 'error.message\|
internalErrorResponse'`): executada — a unica ocorrencia de `error.message` e `:231`, dentro da meta do
`log.error`; a resposta de erro nao carrega nada das tabelas. Webhook real com payload invalido: NAO EXECUTADO
(exigiria a origem Lalamove configurada) — RASTREADO pelo codigo.

### Registro - etapa 174 (2026-11-25) - achado B-06 (`nexus-webhook-receiver`)

**Causa:** o `catch` de `nexus-webhook-receiver` (recebe webhooks do Nexus e repassa para
`external-db-bridge`/`nexus-normalizer`) devolvia `JSON.stringify({ success: false, error: error.message })` com
status 400. `error.message` podia carregar detalhe do PostgREST/terceiro — nome de tabela/coluna, dica de SQL,
trecho de payload com PII do cliente — e esse texto ia no corpo da resposta HTTP entregue ao emissor do webhook.

**Correcao (so o arquivo da etapa):**

- `:10` — import de `internalErrorResponse` de `_shared/httpError.ts` (etapa 164).
- `:200-205` — o `catch` passou a registrar o detalhe **apenas** no log
  (`log.error('[nexus-webhook-receiver] Webhook processing error:', { message: error instanceof Error ? error.message : String(error) })`)
  e a devolver `internalErrorResponse(error, corsHeaders, "nexus-webhook-receiver")`: 500 com
  `{"error":"INTERNAL_ERROR"}`, sem mensagem interna e sem stack. O 500 (e nao 200) e proposital — o emissor
  do webhook precisa saber que falhou para reenviar; devolver 200 perderia o evento.
- **Nao tocado:** o HMAC `:40-45` (401), o rate limit `:29-35` (429), `buildEventKey`/`claimIdempotencyKey`
  `:83-108` (dedupe, etapa 199) e os dois `invokeFunction` com `timeoutMs: NORMALIZE_TIMEOUT_MS`.

**Quem via o detalhe:** o emissor externo do webhook (sistema Nexus) e qualquer um que interceptasse a
resposta; nenhuma tela do app le esse texto. O detalhe completo agora fica no log da edge.

**Verificado de verdade:** `tests/contracts/nexus-webhook-receiver-erro-generico.spec.ts` (7 casos) — 7/7; os
specs existentes da funcao (`nexus-webhook-normalizacao.spec.ts`, `nexus-contracts.spec.ts`, `index_test.ts`)
continuam verdes. Prova por mutacao: A volta a ecoar `error.message` na resposta -> 2 falhas; B devolve 500
escrito na mao no lugar de `internalErrorResponse` -> 1; C devolve 200 no catch -> 2; D passa o objeto `error`
como meta do log -> 1; E troca o segredo do HMAC -> 1; F quebra a chave de dedupe -> 1; G sobe o limite de rate
limit -> 1; restaurado -> 7/7. `deno check` 2 = baseline 2; `deno lint` 3 = baseline 3; `deno fmt --check` =
baseline (diff herdado nas linhas 15-20 de CORS, nenhuma linha alterada). `tsc` 0; `lint:budget` ok; suite 540
testes (533 da base + 7 novos). Verificacao pedida pelo plano (`grep -n 'error.message'` + `sed` do catch):
executada — a unica ocorrencia restante e `:202`, dentro da meta do `log.error`; a resposta de erro nao carrega
nada do terceiro. Webhook real do Nexus: NAO EXECUTADO (exigiria origem externa configurada) — RASTREADO pelo
codigo.

### Registro - etapa 173 (2026-11-25) - achado B-06 (`db-health-weekly-report`)

**Causa:** `db-health-weekly-report` montava `throw new Error("Resend error [<status>]: <corpo do provedor>")` e o
`catch` devolvia `{ ok: false, error: msg }` ao chamador. A funcao roda por `pg_cron`
(`supabase/migrations/20260901000000_cron_jobs_canonical.sql:67`), entao esse corpo ia para a resposta do request
do cron (registrada em `net._http_response`) — fora do perimetro da funcao, carregando destinatarios, dominio de
envio e id da chave do provedor.

**Correcao (so o arquivo da etapa):**

- `:226-233` — a resposta do provedor passou a ir **apenas** para o log, com o status HTTP e corte de 500 chars
  (`log.error("[db-health-weekly-report] Provedor recusou o envio:", { status: response.status, body: (await response.text()).slice(0, 500) })`),
  e o erro lancado virou mensagem fixa `"Falha ao enviar o relatorio pelo provedor"`.
- `:240-242` — o `catch` passou a devolver `internalErrorResponse(err, corsHeaders, "db-health-weekly-report")`
  (etapa 164): 500 generico, sem mensagem interna e sem stack.
- `:4-5` — imports de `log` (`_shared/logger.ts`) e `internalErrorResponse` (`_shared/httpError.ts`).
- **Nao tocado:** a funcao continua **sem CORS** (chamada por agendamento; ponto limpo em B-07, como a etapa
  exige), o conteudo do relatorio (`buildHtml`), a periodicidade (`0 8 * * 1`), o guard de `RESEND_API_KEY` e o
  caminho de sucesso (`{ ok: true, sent, resend_id }`).

**Quem via o detalhe:** nenhuma tela — o unico chamador e o agendador (`net.http_post` do cron); o texto do
provedor aparecia no corpo da resposta HTTP que o cron grava. O detalhe completo agora esta no log da edge.

**Verificado de verdade:** `tests/contracts/db-health-weekly-report-erro-provedor.spec.ts` (7 casos) — 7/7.
Prova por mutacao: A volta a `Resend error [status]: corpo` -> 1 falha; B remove o `log.error` -> 1; C tira o
`status` do log -> 1; D volta a `{ ok: false, error: err.message }` no catch -> 2; E tira o `slice(0, 500)` -> 1;
F mexe no caminho de sucesso -> 1; restaurado -> 7/7. `deno check` 0 = baseline 0; `deno lint` 2 = baseline 2
(`no-import-prefix` dos `npm:` das linhas 1-2, herdado); `deno fmt --check` igual ao baseline (diff herdado nas
ternarias). `tsc` 0; `lint:budget` sem erro, dentro do orcamento; suite 71 arquivos / 534 testes. Verificacao
pedida pelo plano (`sed -n '220,230p'`): executada — o `if (!response.ok)` nao tem mais `errBody` e o corpo do
parceiro so aparece dentro do `log.error`. Execucao real do cron com falha do provedor: NAO EXECUTADO (exigiria
forcar falha do Resend em producao) — rastreado pelo contrato do codigo.

### Registro - etapa 172 (2026-11-25) - achado B-06 (`resend-email`)

**Causa:** `resend-email` fazia `throw new Error(data.error.message || "Failed to send email")` com o corpo de
erro do Resend e devolvia `error.message` no `catch`. A resposta de erro do provedor pode conter o endereco de
destino, o dominio de envio e o id da chave usada — tudo isso saia no corpo da resposta desta funcao (que
tambem servia de detalhe para `accuracy-weekly-digest`/`accuracy-meta-monitor` em `results[].detail`).

**Correcao (so o arquivo da etapa):**

- `:59-66` — a resposta do provedor passou a ir **apenas** para o log, com o status HTTP e corte de 500 chars
  (`log.error("[resend-email] Provedor recusou o envio:", { status: response.status, body: JSON.stringify(data).slice(0, 500) })`),
  e o erro lancado virou mensagem fixa `"Falha ao enviar o e-mail pelo provedor"`. Nao ha id de tentativa do
  provedor na resposta.
- `:73-76` — o `catch` passou a devolver `internalErrorResponse(error, corsHeaders, "resend-email")` (etapa 164):
  500 generico, sem mensagem interna e sem stack. O ramo `ValidationError` -> 422 (etapa 150) continua antes.
- **Nao tocado:** o bloco de auth `:20-31` (padrao correto citado na etapa 004), a validacao de
  `to`/`subject`/`html`/`from` (etapa 150), o CORS `*` (etapa 181) e o caminho de sucesso
  (`{ success: true, id: data.id }` do proprio Resend no envio bem-sucedido).

**Quem via o detalhe:** os tres chamadores sao edge functions internas
(`send-password-reset:156`, `accuracy-weekly-digest:184`, `accuracy-meta-monitor:201`); nenhuma tela mostra o
texto do provedor. `send-password-reset` ja registra o motivo no log e segue; o digest passa a registrar
`reason` generico. O detalhe completo agora esta no log da edge.

**Verificado de verdade:** `tests/contracts/resend-email-erro-provedor.spec.ts` (6 casos) — 6/6; o contrato da
etapa 150 continua 7/7 (13/13 juntos). Prova por mutacao: A volta a ecoar `data.error.message` -> 1 falha; B
remove o `log.error` -> 1; C remove o `slice(0, 500)` -> 1; D volta a `error: error.message` no catch -> 2; E
remove o ramo de `ValidationError` -> 2; F altera o caminho de sucesso -> 1; restaurado -> 6/6. `deno check` 0
(baseline 1); `deno lint` 1 = baseline 1; `deno fmt --check` = baseline 1 (import da linha 4, herdado). `tsc` 0;
`lint:budget` 77/86; suite 71 arquivos / 533 testes. Verificacao pedida pelo plano (`grep -n 'error.message\|
internalErrorResponse'` + `sed -n '55,72p'`): executada — nao ha mais `error.message` no arquivo e o
`internalErrorResponse` esta em `:76`; a resposta de erro nao carrega nada do provedor. Envio real para dominio
invalido: NAO EXECUTADO (exigiria gastar envio em producao) — RASTREADO pelo codigo.

### Registro - etapa 171 (2026-11-25) - achado B-06 (`rodonaves-api`, demais pontos)

**Causa:** a mesma da etapa 170 nos outros pontos do arquivo: `apiGet` (`:193-200`), `apiMutate` (`:226-233`) e
`getDeliveryReceiptByProtocols` (`:641-644`) transformavam o corpo de erro da Rodonaves em mensagem de
excecao, e o handler (`:1715-1726`) devolvia essa mensagem em `error`. Somando o `catch` generico, o corpo cru
do parceiro saia na resposta HTTP das acoes de rastreio, cotacao, comprovantes e cliente.

**Correcao (so o arquivo da etapa):**

- `apiGet`/`apiMutate` — o corpo virou `body` local e vai **apenas** para o log, com `gateway`, `path`, o metodo
  (`method` no `apiMutate`), o status do parceiro e corte de 500 chars; o `RTEError` lancado usa mensagem fixa
  (`GET <path> failed` / `<method> <path> failed`), sem status nem corpo do parceiro. `classifyStatus` decidia o
  codigo; o mapeamento para o status HTTP do front (`403`/`504`/`422`/`502`) ficou igual.
- `getDeliveryReceiptByProtocols` — o corpo tambem foi para o log e o erro virou
  `throw new Error("Falha ao buscar comprovantes por protocolos")`.
- Handler — a resposta do tipo `RTEError` passou a usar o mapa `MENSAGEM_POR_CODIGO` (texto em portugues
  escolhido pelo **codigo que nos lancamos**: `RTE_AUTH_FAILED`, `RTE_SCOPE_BLOCKED`, `RTE_TIMEOUT`,
  `RTE_BAD_REQUEST`, `RTE_UPSTREAM_ERROR`), em vez de `error.message`. O `catch` inesperado passou a devolver
  `internalErrorResponse(error, corsHeaders, "rodonaves-api")` (etapa 164) — some o `error.message` e o corpo de 500.
- **Nao tocado:** fluxo de token/cache, disjuntor, `buildQS`, o roteamento por `action`, o ramo
  `ValidationError` -> 422 e a tela de sincronizacao da Rodonaves (R-04 tem etapa propria).

**Efeito no front:** `grep -rn 'rodonaves-api' src/` encontra 4 chamadores
(`useRodonavesTracking.tsx:96`, `RTECustomerManager.tsx:165`, `useGatewayHealth.ts:154`,
`useIntegrationValidation.tsx:80`). Os tres primeiros mostram `data.error` em `toast.error`/mensagem de erro:
antes aparecia o texto do parceiro, agora aparece o texto generico em portugues. `code` e `gateway` continuam
na resposta, entao quem quiser detalhe tem o codigo; o detalhe completo esta no log da edge.

**Verificado de verdade:** `tests/contracts/rodonaves-api-erro-generico.spec.ts` (7 casos) — 7/7; o spec da
etapa 170 continua 5/5 (12/12 juntos). Prova por mutacao: A/B/C voltam a interpolar o corpo do parceiro -> 2
falhas cada; D volta a devolver `error.message` -> 1; E volta ao corpo de erro cru no `catch` -> 1; F troca um
texto do mapa -> 1; restaurado -> 7/7. `deno check` 4 (baseline 6: os dois `log.error` com string melhoraram);
`deno lint` 2 = baseline 2; `deno fmt --check` = baseline 1 (diffs herdados, nenhum nas linhas novas). `tsc` 0;
`lint:budget` 77/86; suite 70 arquivos / 527 testes. Verificacao pedida pelo plano (`grep -rn 'rodonaves-api'
src/` + `sed -n '1705,1720p'`): executada — a resposta de erro nao carrega texto do parceiro. Erro de cotacao
forcado em runtime: NAO EXECUTADO (exigiria chamada real ao parceiro) — RASTREADO pelo codigo.

### Registro - etapa 170 (2026-11-25) - achado B-06 (`rodonaves-api`, login)

**Causa:** `:130-134` promovia o corpo de erro do **login** da Rodonaves a mensagem de excecao:
`throw new RTEError(`Auth failed [${response.status}]: ${text}`, ...)`. Esse `message` atravessa ate
`:1710-1714`, que devolve `error: error.message` ao chamador — ou seja, status HTTP do parceiro, corpo cru
(possivel eco de credencial ou URL com chave) e texto do RTE saiam no corpo da resposta HTTP desta funcao. E o
pior ponto de B-06 do arquivo: e o login, exatamente onde a resposta do parceiro costuma trazer credencial.

**Correcao (so o arquivo da etapa):**

- `:129-143` — o corpo e o status do parceiro passaram a ir **apenas** para o log
  (`log.error("[rodonaves-api] Falha no login na RTE:", { gateway, status: response.status, body: text.slice(0, 500) })`,
  corte de 500 chars) e o `throw` usa mensagem fixa `"Falha de autenticacao na transportadora"`, sem
  interpolar nada do parceiro. `code` (`RTE_AUTH_FAILED`), `httpStatus` (502) e `gateway` continuam iguais, e
  a resposta ao chamador mantem o mesmo formato (`success: false`, `code`, `gateway`, `error`).
- **Nao tocado:** o resto do arquivo — `:189`, `:222`, `:637` e `:1710-1714` sao a etapa **171**; o fluxo de
  obtencao/renovacao de token, o cache (`tokenCache`, 290 min) e a exigencia de credencial ficaram intactos.
  Nenhuma filtragem por palavra-chave no corpo do parceiro: ele simplesmente nao e repassado.

**Verificado de verdade:** `tests/contracts/rodonaves-api-auth-erro.spec.ts` (5 casos) — 5/5. Prova por
mutacao: A volta a interpolar status+corpo -> 3 falhas; B remove o `log.error` -> 2; C remove o
`slice(0, 500)` -> 1; D troca o codigo para `RTE_UPSTREAM_ERROR` -> 1; E quebra o cache do token -> 1;
restaurado -> 5/5. `deno check` 6 = baseline 6; `deno lint` 1 = baseline 1; `deno fmt --check` = baseline
(1 arquivo, diff herdado nas ternarias de `:1710-1714`). `tsc` 0; `lint:budget` 77/86; suite 68 arquivos / 515
testes. Verificacao pedida pelo plano (`sed -n '125,140p'`): executada — a mensagem lancada nao interpola
nada do parceiro e o corpo aparece so no `log.error`. Deploy: EXECUTADO (Edge Functions sobe no merge).
Falha de login forcada: nao executada (exigiria mexer em credencial de producao) — RASTREADO pelo codigo.

### Registro - etapa 169 (2026-11-25) - achado B-06 (`lalamove-api`)

**Causa:** a funcao repassava o corpo de erro **do parceiro** ao chamador: `:60` devolvia
`details: errorText` (o texto cru da Lalamove) junto com o status, e o `catch` de `:173` devolvia
`error.message`. O conteudo do erro do parceiro nao e controlado por este repositorio — pode ecoar cabecalho,
URL com chave ou credencial — e as quatro rotas devolviam `JSON.stringify(result)`, entao o `details` saia
tambem em `create_order`, `get_order` e `cancel_order`, nao so na cotacao.

**Correcao (so o arquivo da etapa):**

- `:54-61` — o `errorText` passou a ir **apenas** para o log, com o status HTTP do parceiro:
  `log.error('Lalamove upstream error', { status: response.status, errorText: errorText.slice(0, 500) })`
  (corte de 500 chars para nao virar log gigante). A resposta 4xx virou
  `{ error: true, status, message: 'Transportadora recusou a solicitacao' }` — sem `details`.
- `catch` — `error: error.message` virou `error: isBreaker ? 'Transportadora indisponivel' : 'Falha ao
chamar a transportadora'`, mantendo `circuitOpen` e o status 503/500. O ramo `ValidationError` -> 422
  continua igual (a etapa 149 depende dele).
- **Nao tocado:** `safeFetch` (tempo limite e disjuntor), `lalamoveBreaker`, a assinatura HMAC, o
  `throw new Error('Lalamove Server Error: ...')` que dispara o disjuntor em 5xx e o roteamento por
  `parseLalamoveRoute` (etapa 149). Nenhuma filtragem por palavra-chave no texto do parceiro — ele nao e
  repassado.

**Quem consumia o detalhe:** nao ha consumidor. O unico chamador e `useLalamoveOrders.tsx`, que so faz
`if (error) throw error` e mostra `toast.error` generico; ninguem le `details`. O detalhe agora esta no log da
edge (Supabase Logs / `function_edge_logs`).

**Verificado de verdade:** `tests/contracts/lalamove-api-upstream-erro.spec.ts` (5 casos) — 5/5. Prova por
mutacao: A devolve `details: errorText` de novo -> 1 falha; B remove o log do corpo do parceiro -> 2; C `catch`
volta a ecoar `error.message` -> 1; D log sem o status do parceiro -> 1; E remove o `throw` que dispara o
disjuntor em 5xx -> 1; restaurado 5/5. `deno check` 8 erro <= baseline 9 (nenhum novo; o `log.error` foi usado
no lugar de `log({ level: 'ERROR' })` de proposito, porque o literal de `level` nao e atribuivel a `LogLevel`
— erro ja existente em `:110`), `deno lint` 5 = baseline, `deno fmt --check` 1 = baseline; `tsc` 0;
`lint:budget` 77/86 com 0 erros; suite 67 arquivos / 510 testes. Verificacao do plano: `grep -n
'errorText|error.message|internalErrorResponse'` retorna `errorText` so na leitura (`:55`) e no log (`:61`), e
`error.message` so no log do `catch` (`:182`).

**Nao verificado:** erro real do parceiro em producao (a Lalamove de producao exige credencial real; as
chaves atuais sao de sandbox e nao foram validadas nesta sessao).

**Fora de escopo (registrado, nao tocado):** CORS `*` de `_shared/cors.ts` (etapa 191); o log do `catch`
continua registrando `error.message` (nao vai para a resposta); erros de tipo herdados do arquivo
(`e` unknown em `:110`, `LogLevel`).

### Registro - etapa 168 (2026-11-25) - achado B-06 (`execute-protocol`)

**Causa:** o `catch` de `:59` devolvia `{ error: error.message }` com 400 e o `:53` fazia `throw error` do
PostgREST. A funcao executa protocolo de automacao sobre tabelas internas, entao o texto do erro descrevia o
modelo de dados interno (tabela, coluna, restricao) para quem chamasse — o oposto do que a etapa pede.

**Correcao (so o arquivo da etapa):**

- `:53` — `if (error) throw error;` virou `log.error("[execute-protocol] Falha ao executar protocolo:",
{ protocol_name, code: error.code, message: error.message })` + `throw new Error("Falha ao executar
protocolo")`. O log carrega o **nome do protocolo**, que e o que o chamador usa para corrigir; a tabela
  interna nao vaza.
- `:59` `catch` — `return internalErrorResponse(error, corsHeaders, "execute-protocol")`: erro de banco vira 500
  `{"error":"INTERNAL_ERROR"}`, sem texto do Postgres e sem `stack`.
- `if (!vehicle_id || !protocol_name)` — responde 400 explicito com
  `{ "error": "vehicle_id and protocol_name are required" }`. Antes era `throw` que o `catch` convertia em 400
  com a mesma mensagem; status preservado, sem regressao.
- **Nao tocado:** `auth.getUser` + 401/403, `supabase.rpc("execute_nexus_protocol", ...)`, a resposta de sucesso
  e o CORS `*` de `:5` (etapa 191). Nada do comportamento de execucao do protocolo mudou (A-08 "Nexus
  Self-Healing").

**Verificado de verdade:** `tests/contracts/execute-protocol-erro-interno.spec.ts` (5 casos) — 5/5. Prova por
mutacao: A `catch` volta a ecoar `error.message` -> 1 falha; B log sem `protocol_name` -> 1; C volta a lancar o
erro cru -> 1; D volta ao `throw` no payload obrigatorio -> 1; E `details` no log -> 2; restaurado 5/5.
`deno check` 0 erro (baseline 1), `deno lint` 2 = baseline, `deno fmt --check` 0 = baseline; `tsc` 0;
`lint:budget` 77/86 com 0 erros; suite 67 arquivos / 510 testes. Verificacao do plano:
`grep -n 'error.message|internalErrorResponse'` retorna o import (`:3`), a linha do log (`:66`) e o `return` do
helper (`:76`) — nenhuma resposta com texto do Postgres.

**Nao verificado:** chamada real com protocolo inexistente contra producao (exige JWT valido e usuario
autenticado); a resposta generica e o log sao o mesmo caminho ja verificado nas etapas 164-167.

**Fora de escopo (registrado, nao tocado):** CORS `*` (`:5`, etapa 191); contrato `protocol_id` +
`confirm: z.literal(true)` das etapas 072/101; ausencia de log estruturado nos caminhos de sucesso (auditoria
10.9).

### Registro - etapa 167 (2026-11-25) - achado B-06 (`lgpd-erase-user`)

**Causa:** o `catch` de `:102` devolvia `{ error: error.message }` com 400. Numa rotina de apagamento de dado
pessoal isso e o pior caso de vazamento: o texto do PostgREST lista a tabela e a chave estrangeira que ainda
guardam dado do titular — instrucao pronta para quem tentar burlar o apagamento. Pior: o erro vinha com status
400, entao um erro de servidor parecia culpa de quem chamou.

**Correcao (so o arquivo da etapa):**

- `:63` perfil — `throw profileError` virou `log.error("[lgpd-erase-user] Falha ao apagar perfil:",
{ step: "profiles.delete", code, message })` + `throw new Error("Falha ao apagar perfil")`.
- `:68` auth — mesmo padrao com `step: "auth.users.delete"`.
- `:92` auditoria — mesmo padrao com `step: "audit_logs.insert"`.
- `:102` `catch` — `return internalErrorResponse(error, corsHeaders, "lgpd-erase-user")`: erro de banco vira 500
  `{"error":"INTERNAL_ERROR"}`, sem texto do Postgres e sem `stack`.
- `if (!userId)` — agora responde 400 com `{ "error": "User ID is required" }` explicito. Antes era um `throw`
  que o `catch` transformava em 400 com a mesma mensagem; mantido o status, sem regressao para o chamador.
- **Nada da rotina mudou**: ordem `profiles` -> `auth.users` -> `audit_logs`, `.eq("id", userId)`, o insert de
  auditoria e a politica de `deleted_at` (`docs/SOFT_DELETE_POLICY.md`) ficaram intactos. Nenhum dado pessoal no
  log: so o passo, o `code` e a `message` do Postgres; nunca `details`/`hint` (que carregam valores de chave).

**Verificado de verdade:** `tests/contracts/lgpd-erase-user-erro-interno.spec.ts` (6 casos) — 6/6. Prova por
mutacao: A `catch` volta a ecoar `error.message` -> 1 falha; B log sem `step` -> 1; C volta a lancar
`profileError` cru -> 1; D `.eq("id", "x")` (alvo do titular) -> 1; E `details` no log -> 1; restaurado 6/6.
`deno check` 0 erro (baseline tinha 1 — o `error.message` do `catch` era o proprio erro de tipo), `deno lint` 2
= baseline, `deno fmt --check` 1 = baseline; `tsc` 0; `lint:budget` 77/86 com 0 erros; suite 66 arquivos / 505
testes. Verificacao do plano executada: `grep -n 'error.message|internalErrorResponse'` no arquivo retorna so o
import (`:4`) e o `return` do helper (`:133`) — nenhum `error.message` em resposta.

**Nao verificado:** apagamento real contra producao (apaga conta de verdade e e irreversivel). Nao ha chamador
em `src/`, entao o caminho so e exercitado por chamada manual autenticada de admin.

**Fora de escopo (registrado, nao tocado):** contrato `user_id` uuid + `confirm: z.literal(true)` previsto nas
etapas 072/101 do `PLANO_FRONTEND_CONTRATOS` (a funcao ainda le `userId` do corpo); CORS `*`; falta de log
estruturado nos passos de sucesso (auditoria 10.9).

### Registro - etapa 166 (2026-11-25) - achado B-06 (`scheduled-reports`)

**Causa:** o insert de `:57-63` fazia `throw error` do PostgREST e o `catch` devolvia
`error: error instanceof Error ? error.message : "Unknown error"` com 500 — o chamador recebia nome de tabela,
de coluna e de restricao de `scheduled_reports`. Um erro de coluna inexistente virava um mapa das colunas
reais para quem estivesse testando.

**Correcao (so o arquivo da etapa):**

- `:63` — `throw error` virou `log.error("[Scheduled Reports] Falha ao criar relatorio:", { code, message })` +
  `throw new Error("Falha ao criar relatorio")`.
- `catch` (`:156` no original) — virou `return internalErrorResponse(error, corsHeaders, "scheduled-reports")`.
  O 422 do `ValidationError` (payload invalido) continua igual, agora vindo do helper; o resto vira 500 com
  `{"error":"INTERNAL_ERROR"}`, sem `error.code` de Postgres ("23505/23503/42703" dizem ao chamador qual
  restricao e coluna existem).
- `user_id` das claims (`auth.claims.sub`) e o filtro `.eq("user_id", userId)` **nao foram tocados** (IDOR).

**Verificado de verdade:** `tests/contracts/scheduled-reports-erro-interno.spec.ts` 6/6 + spec da etapa 143-145
ajustado (a assercao que exigia `validationErrorResponse` no `catch` passou a exigir o helper). Prova por
mutacao: A catch volta a ecoar `error.message` -> 1 falha; B volta a lancar o erro cru -> 1; C log sem detalhe ->
1; D catch devolve `error.code` -> 1; E monta o 500 a mao sem o helper -> 1; restaurado 6/6. `deno check` 0 =
baseline, `deno lint` 14 = baseline, `deno fmt --check` 1 = baseline; `tsc` 0; `lint:budget` 77/86 com 0 erros;
suite 64 arquivos / 493 testes. O hook `useScheduledReports` so mostra toast generico, nao le o corpo do erro —
a troca de formato nao muda a tela.

**Nao verificado:** corpo causando erro de banco contra producao (exige chamada autenticada; o formato de 500 e
o mesmo helper ja verificado na etapa 164).

**Fora de escopo (registrado, nao tocado):** os outros tres `throw error` do arquivo (update `:83`, delete `:97`,
list `:110`) — ja passam pelo helper e nao devolvem texto do Postgres, mas mantem o erro cru no `throw`; CORS
`*`; `gen_random_uuid`/DDL.

### Registro - etapa 165 (2026-11-25) - achado B-06 (`ingest-biosync`)

**Causa:** `index.ts:50` fazia `throw error` do PostgREST e o `catch` de `:92` devolvia
`JSON.stringify({ error: error.message })` com status 400 — o chamador recebia nome de tabela, de coluna e de
restricao de `bio_sync_telemetry`.

**Correcao (so o arquivo da etapa):**

- `:50` — o `throw error` virou `log.error("[ingest-biosync] Falha ao gravar telemetria:", { code, message })` +
  `throw new Error("Falha ao gravar telemetria")`. O log leva **apenas** `code` e `message` do Postgres — sem
  `details`/`hint` e sem batimento, `driver_id` ou `vehicle_id` (LGPD).
- `:92` — o `catch` inteiro virou `return internalErrorResponse(error, corsHeaders, "ingest-biosync")`; o 422 do
  `ValidationError` continua igual, agora vindo do helper da etapa 164. Erro de banco passa de 400 para 500 com
  `{"error":"INTERNAL_ERROR"}`.
- Nenhum campo `details` "para depuracao" foi criado.

**Verificado de verdade:** `tests/contracts/ingest-biosync-erro-interno.spec.ts` 6/6 + o spec da etapa 148 ajustado
(a assercao que exigia `validationErrorResponse` no `catch` passou a exigir o helper). Prova por mutacao: A catch
devolve `error.message` -> 1 falha; B volta a lancar o erro cru -> 1; C log leva o batimento -> 1; D catch sem o
helper -> 1; E sem log do detalhe -> 2; restaurado 6/6. `deno check` 0 (herdava 1, foi corrigido por tabela);
`deno lint` 2 = baseline; `deno fmt --check` 1 = baseline; `tsc` 0; `npm run lint:budget` 77/86, 0 erros; suite 63
arquivos / 488 testes.

**Nao verificado:** erro de banco forcado contra producao (exige chamada autenticada com `vehicle_id` invalido;
o padrao de resposta e o mesmo do helper ja verificado na etapa 164).

**Fora de escopo (registrado, nao tocado):** CORS `*` (etapa 192), dedupe (etapa 199), texto do log em
`nexus_tactical_logs` que carrega BPM e `vehicle_id`.

### Registro - etapa 164 (2026-11-25) - achado B-06 (`_shared/httpError.ts`)

**Causa:** nao havia envoltorio padrao de erro; cada funcao montava o `catch` a mao e o caminho mais curto era
devolver `error.message`. Nas funcoes que fazem `throw` do erro do PostgREST (`ingest-biosync:50`,
`scheduled-reports:42`, `lgpd-erase-user`, `execute-protocol`) quem chamou recebe nome de tabela, de coluna, de
restricao e texto de policy de RLS.

**Correcao:** `supabase/functions/_shared/httpError.ts` (arquivo novo, ninguem importa ainda — sem efeito em
producao ate a etapa 165):

- `internalErrorResponse(err, headers, tag)` — `ValidationError` continua virando 422 com o campo violado
  (`validationErrorResponse` de `_shared/validate.ts`), e o resto vira `{"error":"INTERNAL_ERROR"}` com 500.
- O detalhe vai **so** para o log (`log.error("[tag] Error:", { error: String(err) })`), sem `stack`, copiando o
  padrao ja correto de `external-db-bridge:367-375`, `secure-store:91`, `carrier-webhook-receiver:221-227`.
- `Content-Type: application/json` sobrescrito, headers do chamador preservados.
- `_shared/service-wrapper.ts` **nao** foi tocado (nenhuma funcao o importa; decisao fica na onda de higiene) e
  `_shared/validate.ts` tambem nao.

**Verificado de verdade:** `tests/contracts/http-error.spec.ts` 5/5 (500 sem texto do Postgres, log com a tag e o
detalhe, sem pilha na resposta, headers preservados, `ValidationError` -> 422 sem log de erro). Prova por mutacao:
A corpo devolve o erro cru -> 1 falha; B sem ramo de `ValidationError` -> 1; C sem `log.error` -> 1; D devolve a
pilha -> 2; E sem `Content-Type` -> 1; restaurado 5/5. `deno fmt --check` / `deno check` / `deno lint` limpos no
arquivo novo; `tsc` 0 erros; `npm run lint:budget` 77/86 com 0 erros; suite 62 arquivos / 482 testes verdes.

**Nao verificado:** consumo real pelas funcoes da faixa 165-178 (etapa seguinte).

**Fora de escopo (registrado, nao tocado):** adocao do helper nas 22 funcoes que montam o `catch` a mao
(etapas 165+); destino de `_shared/service-wrapper.ts`; CORS `*`.

### Registro - etapa 163 (2026-11-25) - achado B-05 (`accuracy-weekly-digest`)

**Causa:** `index.ts:179` chamava `supabase.functions.invoke("resend-email", ...)` **dentro do laço de destinatários**
do digest semanal. `functions.invoke` não aceita tempo limite: um `resend-email` lento prendia a função por
destinatário e o resumo do disparo (`results`) só voltava no fim. O erro ia para `detail: eErr.message` — mensagem
crua do provedor, que ainda voltava no corpo da resposta.

**Correção:** o envio passou a usar `invokeFunction("resend-email", { to, subject, html }, { timeoutMs:
DIGEST_EMAIL_TIMEOUT_MS })` com 10 s (`:27`), mesmo corpo. Como o helper não lança, o `try/catch` saiu: quando
`!envio.ok` o resultado é `{ status: "error", detail: envio.reason }` (`:192`) e o caminho de sucesso
(`status: "sent"` + insert em `notifications`) ficou idêntico.

**Mudança de comportamento:** o campo `detail` dos erros deixa de carregar a mensagem crua do provedor e passa a
trazer o motivo curto (`timeout`, `http_error`, ...); o `catch (e)` interno deixa de existir e uma falha nunca
interrompe o laço — os demais destinatários seguem recebendo.

**Evidência:** `grep -n 'functions.invoke' supabase/functions/accuracy-weekly-digest/index.ts` -> nenhum;
`invokeFunction` importado em `:11`, usado em `:183` com `timeoutMs` em `:186`. Spec
`tests/contracts/accuracy-weekly-digest-timeout.spec.ts` (5 casos); mutações A-E (voltar o `functions.invoke`, tirar o
`timeoutMs`, trocar `envio.reason`, `if (false)` no lugar de `!envio.ok`, mudar a constante) quebram de 1 a 4 testes
cada, restaurado 5/5. `deno check` 0, `deno lint` 2 e `deno fmt --check` 1 — todos iguais ao baseline da `main`
(reprovacao de formato herdada). `tsc --noEmit` 0; `lint:budget` 77/86 avisos, 0 erros; `npx eslint` no spec limpo;
suite 61 arquivos; cobertura 76,23 / 73,6 / 78,19 / 78,46.

**NAO VERIFICADO:** disparo real do digest com o provedor de e-mail lento (exige os segredos reais).

**Fora de escopo (registrado, nao tocado):** `nErr.message` cru (`:82` e `:170`) e o `catch (err)` final
(`:226-240`) devolvendo `error.message` — familia `_shared/httpError` (etapas 164+); CORS `*`.

### Registro - etapa 162 (2026-11-25) - achado B-05 (`accuracy-meta-monitor`)

**Causa:** `index.ts:196` (e-mail) e `:215` (WhatsApp) chamavam `supabase.functions.invoke(...)` dentro do laço de
avaliação do monitor diário de meta de acurácia. `functions.invoke` não aceita tempo limite: um `resend-email` ou
`whatsapp-notification` lento segurava o monitor inteiro — que roda uma vez por dia e, se estourar o tempo da função,
não avalia ninguém. Cada envio já vinha embrulhado em `try/catch` que gravava `throw:<mensagem crua>`.

**Correção:** as duas chamadas passaram a usar `invokeFunction` (etapa 156) com `timeoutMs: DISPATCH_TIMEOUT_MS` de
10 s (`:13`), corpo idêntico (`to`/`subject`/`html` no e-mail; `action`/`template`/`phone`/`variables` no WhatsApp).
Como o helper nunca lança, os dois `try/catch` saíram: o resultado vai para `dispatched.email` (`:209`) e
`dispatched.whatsapp` (`:233`) com o mesmo formato de antes (`"ok"`, `"ok:escalated"` ou `error:<motivo>`), agora com o
**motivo curto** do helper (`timeout`, `http_error`, ...) em vez da mensagem crua — melhor no `metadata.channels` da
notificação e no log `external channels dispatched`.

**Mudança de comportamento:** o monitor segue avaliando os demais usuários mesmo se um envio falhar (antes também
seguia, mas sem limite de tempo); o marcador `throw:` deixa de existir em `metadata.channels` — falha passa a ser
sempre `error:<motivo>`.

**Evidência:** `grep -n 'functions.invoke' supabase/functions/accuracy-meta-monitor/index.ts` -> nenhum;
`invokeFunction` importado em `:8`, usado em `:200` e `:217`, ambos com `{ timeoutMs: DISPATCH_TIMEOUT_MS }`. Spec
`tests/contracts/accuracy-meta-monitor-timeout.spec.ts` (5 casos); mutações A-E (voltar o `functions.invoke`, tirar o
`timeoutMs` do e-mail, tirar o do WhatsApp, trocar `envioWhatsapp.reason`, mudar a constante) quebram de 1 a 2 testes
cada, restaurado 5/5. `deno check` 0 (igual ao baseline); `deno lint` 2 (igual ao baseline); `deno fmt --check` já
reprovava no baseline (import longo, `.select` e o ternário de `carrierVariants`) e as linhas novas não aparecem no
diff de formatação.

**NAO VERIFICADO:** execução real do monitor com o provedor de e-mail/WhatsApp lento (exige os segredos reais).

**Fora de escopo (registrado, não tocado):** o `catch` final (`:286-291`) devolve `error.message` cru ao chamador —
família `_shared/httpError` (etapas 164+); CORS `*`.

### Registro - etapa 161 (2026-11-25) - achado B-05 (`predict-delays` e `predict-delays-scheduled`)

**Causa:** duas chamadas internas sem tempo limite.

- `predict-delays/index.ts:354` — `supabase.functions.invoke("whatsapp-notification", ...)` **dentro de dois laços**
  (uma chamada por previsão crítica x destinatário). Sem tempo limite, um `whatsapp-notification` lento segurava a
  resposta do `predict-delays` inteiro, e esse aviso é o que leva à operação a entrega em atraso.
- `predict-delays-scheduled/index.ts:70` — `supabase.functions.invoke("predict-delays", { body: {} })`, disparado
  pelo cron `predict-delays-every-30min` (`*/30 * * * *`). O `throw predErr` (`:75`) estourava o handler: a execução
  morria em 500 sem deixar no log o motivo nem a quantidade de falhas.

**Correção:**

- `predict-delays`: `invokeFunction("whatsapp-notification", { action: "send_delay_alert", phone, entrega_id,
coleta_id, variables })` com o tempo limite **padrão do helper (10 s)** e corpo idêntico ao anterior. Como são N x M
  envios, cada falha soma em `falhasAlerta` (`:370`) e, no fim, um único `log("WARN", "Delay alerts not delivered", {
falhas: falhasAlerta })` (`:375`) resume — sem um log por destinatário e sem `throw` novo.
- `predict-delays-scheduled`: `invokeFunction("predict-delays", {}, { timeoutMs: PREDICT_TIMEOUT_MS })` com **30 s**
  (`:11`) — folgado porque ninguém espera a resposta (é cron a cada 30 min), mas finito, e menor que o intervalo do
  cron, então uma execução travada não se empilha com a próxima. Quando `!predResp.ok` (`:81`), `log("ERROR", ...,
{ reason, status, falhas: 1 })` e resposta **500 estruturada** `{ success: false, reason }` — a falha passa a ficar
  registrada, que era justamente o que o `throw` cru perdia.

**Mudança de comportamento:** `predict-delays` continua respondendo 200 mesmo se nenhum aviso sair (`falhas > 0` fica
só no log) — as previsões são o produto da função e o aviso é efeito colateral. A resposta da `predict-delays-scheduled`
em falha passa a ser `{ success: false, reason }` em vez do erro cru do `functions.invoke`; o corpo de sucesso não mudou.

**Auth intocada:** o bloco `requireInternalSecret`/`requireUser` (`predict-delays-scheduled/index.ts:24-35`) é o padrão
correto do projeto e não foi alterado.

**Evidência:** `grep -n 'functions\.invoke' supabase/functions/predict-delays/index.ts
supabase/functions/predict-delays-scheduled/index.ts` -> nenhum resultado; `invokeFunction` importado em `:9` e `:7`
e usado em `:357` e `:75`, este com `timeoutMs`. Teste `tests/contracts/predict-delays-timeout.spec.ts` (5 casos);
mutações A-E (voltar o `functions.invoke`, tirar `falhas: 1`, tirar o `timeoutMs`, `if (false)` no contador, remover o
`log("WARN")`) quebram de 1 a 2 testes cada e restauram 5/5. `deno check` 2 e 1, `deno lint` 21 e 2 — iguais ao
baseline; `deno fmt --check` limpo nos dois arquivos; `tsc --noEmit` 0; `lint:budget` 77/86 avisos, 0 erros.

**NAO VERIFICADO:** execução real do cron com o `whatsapp-notification` lento (exige o gateway EVO e um alerta crítico
de verdade em produção).

**Fora de escopo (registrado, não tocado):** `error.message` cru (`predict-delays:389`, etapa 178); a janela de
idempotência de 2 min e a leitura de `prevKeys` da agendada; CORS `*`.

### Registro - etapa 160 (2026-11-25) - achado B-05 (`send-password-reset`)

**Causa:** `index.ts:151` chamava `supabaseAdmin.functions.invoke("resend-email", ...)` **dentro do caminho da
tela**: `functions.invoke` nao aceita tempo limite e, se o envio travasse, a funcao esperava, devolvia 500 e o admin
(quem aprova na tela `AprovacaoResetSenha.tsx`) ficava preso na tela com erro.

**Correcao:** o envio passou a usar `invokeFunction` (etapa 156) com `timeoutMs: SEND_EMAIL_TIMEOUT_MS` (5 s, `:7`),
com o **mesmo corpo** (`to`, `subject`, `html` — o `body:` de dentro do `{ }` era so o formato do
`functions.invoke`, o payload continua identico). Quando o envio falha (`!envio.ok`, `:169`), um
`log.error` registra `{ reason }` e o fluxo **segue**: a tela recebe a resposta generica de sucesso
(`{ success: true, message: "Password reset email sent" }`, inalterada) e nenhum `throw` novo e lancado.

**Mudanca de comportamento:** falha ou demora no envio nao bloqueia mais a aprovacao — a solicitacao passa para
`approved` (`:174-183`) e o admin ve o mesmo toast de sucesso. O motivo fica so no log (`Error sending reset
email: { reason }`). A tela nao revela se o e-mail existe nem se o envio funcionou.

**Trade-off registrado:** o admin perde o sinal visual de falha do envio. Nao ha coluna de status do envio na
tabela `password_reset_requests`; enquanto isso existir so no log, uma falha de e-mail e silenciosa para quem
aprova. Melhoria fora do escopo desta etapa.

**Evidencia:** `grep -n 'functions.invoke|invokeFunction' supabase/functions/send-password-reset/index.ts` ->
nenhum `functions.invoke`; `invokeFunction` importado em `:4`, usado em `:155` com `timeoutMs` em `:164`.

**NAO VERIFICADO:** tempo real de resposta da tela e a linha de log em producao (exige pedir uma redefinicao com
segredo/ambiente reais).

**Fora de escopo (registrado, nao tocado):** CORS `*` (`:6`, etapa 185); geracao do link via
`auth.admin.generateLink`; atualizacao de `password_reset_requests`.### Registro - etapa 159 (2026-11-25) - achado B-05 (`nexus-webhook-receiver`)

**Causa:** `index.ts:141` e `:154` chamavam `supabaseClient.functions.invoke('normalize-freight-response', ...)`
**dentro do caminho do webhook**, e o resultado ia na resposta à transportadora. `functions.invoke` não aceita tempo
limite: se a normalização travasse, a resposta demorava, a transportadora reenviava — e o reenvio caía em B-01/B-02,
duplicando dado.

**Correção:** as duas chamadas passaram a usar `invokeFunction` (etapa 156) com `timeoutMs: NORMALIZE_TIMEOUT_MS`
(5 s, `:11`) — 5 s porque do outro lado está a transportadora esperando. O corpo enviado é o mesmo
(`{ text, transportadora_id, cotacao_id }`). Quando a chamada falha (`!normalizacao.ok`, `:171` e `:190`), um
`log.warn` registra `{ reason }` e a resposta segue **200** com o campo nulo: `normalization: null` no evento do
WhatsApp (`:176`) e `data: null` no webhook genérico (`:194`). Nenhum `throw` novo.

**Pré-requisito confirmado:** a idempotência das etapas 138-140 está aplicada — `claimIdempotencyKey` em `:105`,
**antes** das chamadas internas (há teste guardando essa ordem). Responder rápido só é seguro porque o evento já foi
reivindicado.

**Mudança de comportamento:** a resposta ao Nexus pode vir sem o resultado da normalização (campo nulo) quando o
gateway demora mais de 5 s. A normalização continua acontecendo do outro lado, de forma assíncrona; quem consome a
resposta precisa tolerar `null` nesse campo.

**Evidência:** `grep -n 'functions.invoke|invokeFunction' supabase/functions/nexus-webhook-receiver/index.ts` ->
nenhum `functions.invoke`; `invokeFunction` importado em `:9` e usado em `:165` e `:184`, ambos com `timeoutMs`.

**NAO VERIFICADO:** latência real de ponta a ponta com um evento do Nexus em produção (exige o segredo do webhook).

**Fora de escopo (registrado, não tocado):** `error.message` cru (`:202`, etapa 174); HMAC (`:36-44`, etapa 001);
chave determinística (`:80`/`:105`, etapa 140); CORS `*` (é webhook servidor-a-servidor).

### Registro - etapa 158 (2026-11-25) - achado B-05 (`ingest-biosync`)

**Causa:** `index.ts:65` chamava `${SUPABASE_URL}/functions/v1/bitrix24-integration` com `fetch` **nu**, dentro do
caminho do alerta **critico** de batimento (`if (severity === "crit")`, `:63`). Em Deno, `fetch` sem sinal nao tem
tempo limite: com o Bitrix lento, o alerta critico (e a resposta inteira da funcao) ficava preso esperando o CRM.

**Correcao:** o aviso passou a usar `invokeFunction("bitrix24-integration", { action: "notify_alert", deal_data:
{ ... } })` (etapa 156), com o **mesmo corpo**. O resultado e tratado sem alterar a resposta: se `!aviso.ok`, um
`log.error` registra `aviso.reason` e a funcao segue — a telemetria e o log tatico (`:38-48`, `:55`) ja foram
gravados antes e o alerta ao motorista **nao** depende do CRM. Nenhum `throw` novo; o `try/catch` que ja existia
continua envolvendo a chamada.

**Mudanca de comportamento:** o envio ao CRM e abandonado em **10 s** em caso de travamento, contado em log, em
vez de prender o caminho critico.

**Evidencia:** `grep -n 'fetch(\|invokeFunction' supabase/functions/ingest-biosync/index.ts` -> nenhum `fetch(`
nu; `invokeFunction` importado em `:4` e usado em `:68`; `aviso.reason` em `:78-79` (`index.ts:65` antes).

**NAO VERIFICADO:** o comportamento em runtime com um payload `crit` real e o Bitrix lento (exige segredo de
producao; so o contrato foi exercitado por teste).

**Fora de escopo (registrado, nao tocado):** `error.message` cru (`:92`, etapa 165), CORS `*` (`:6`, etapa 192),
dedupe (`:38-48`, etapa 199).

### Registro - etapa 157 (2026-11-25) - achado B-05 (`normalize-freight-response`)

**Causa:** `index.ts:195` chamava `${supabaseUrl}/functions/v1/whatsapp-notification` com `fetch` **nu** dentro do
laço por usuário a notificar (`:192-194`). Em Deno, `fetch` sem sinal não tem tempo limite: um único usuário com
envio travado prendia o laço inteiro, a função morria pelo limite de execução e **ninguém** recebia o alerta de falha
de normalização — justamente o alerta que existe para avisar de um erro.

**Correção:** o bloco passou a usar `invokeFunction("whatsapp-notification", { ... })` (etapa 156), com o **mesmo
corpo** (`action: "send_normalization_alert"`, `phone`, `variables.transportadora: "Nexus Engine"`,
`cotacao_id: "Internal"`). A falha é tratada **por usuário**: `if (!envio.ok) { falhas += 1; log.warn(...) }` e o
laço continua; ao final, um único `log.warn` com `{ falhas, total }` quando houve falha. Nenhum `throw` novo, nenhum
`Promise.all` (o problema era tempo limite, não paralelismo). O `continue` mantém o comportamento anterior de pular
usuário sem telefone.

**Mudança de comportamento:** envio interno travado é abandonado em **10 s** e contado como falha, em vez de
pendurar o laço; os demais usuários continuam sendo avisados na mesma execução.

**Fora de escopo (registrado, não tocado):** `error.message` cru (`:217`, B-06/etapa 178); CORS `*` (`:10`, etapa
195); montagem de `phoneByUser` (`:188-191`) e o conteúdo da mensagem; os demais `supabase.functions.invoke()` do
repositório são as etapas 159-163.

**Evidência:**

- `tests/contracts/normalize-freight-alerta-interno.spec.ts` (novo, 4 casos): nenhum `await fetch(` no arquivo e
  `invokeFunction("whatsapp-notification"` no lugar; mensagem e variáveis preservadas; falha por usuário contada
  (`if (!envio.ok) { falhas += 1;`) com `reason` no log e sem `throw`; resumo `if (falhas > 0)` com `total`.
  É teste de contrato de fonte (o `index.ts` importa `esm.sh`, que o vitest não carrega) — mesmo precedente das
  etapas 146-155.
- Mutação A — ramo de falha desligado (`if (false)`): 1/4 falha. B — log sem `reason`: 1/4. C — nome da função
  interno errado: 1/4. D — `fetch` cru de volta: 1/4. Restaurado: 4/4.
- `npx vitest run --coverage`: **56 arquivos / 455 testes, todos verdes**; totais 76,23 / 73,6 / 78,19 / 78,46.
- `deno check` 1 erro = **baseline 1** (herdado, B-06); `deno lint` 6 = baseline 6 (4 `no-import-prefix` + 2 `any`,
  herdados); `deno fmt --check` limpo; `npx tsc --noEmit` 0; `npm run lint:budget` OK (77/86).
- `grep -n 'fetch(' .../index.ts` → nenhuma ocorrência; `grep -n invokeFunction` → `:8` (import) e `:197`.
- **NÃO VERIFICADO:** o alerta real em produção (exige uma normalização que falhe e usuário com WhatsApp ligado).
  Depois do deploy, o log deve mostrar `invokeFunction: ok` com `durationMs` por usuário.

### Registro - etapa 156 (2026-11-25) - achado B-05 (`_shared/invokeFunction.ts`)

**Causa:** o repositório não tinha nenhuma chamada entre funções com prazo. O caminho `supabase.functions.invoke()`
(`nexus-webhook-receiver:141`/`:154`, `send-password-reset:151`, `predict-delays:354`,
`predict-delays-scheduled:70`, `accuracy-meta-monitor:196`/`:215`, `accuracy-weekly-digest:179`) faz HTTP real e
**não aceita** `signal`, e os `fetch` nus para o próprio gateway (`normalize-freight-response:195`,
`ingest-biosync:65`) em Deno **não têm tempo limite**. Se a função chamada trava (provedor externo lento, cold
start, laço), a chamadora fica pendurada até o limite da plataforma — a escrita de negócio do webhook nunca
conclui e o evento é reprocessado.

**Correção:** `_shared/invokeFunction.ts` novo, sem retentativa (B-10 diz que retentativa só entra depois):
`invokeFunction(name, body?, { timeoutMs })` monta `${SUPABASE_URL}/functions/v1/${name}` (barra final da env
aparada), manda `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}` e `Content-Type: application/json` via
`fetchWithTimeout` com padrão de **10 s** (mesmo teto de `safeFetch.ts:107-110`), e **nunca lança**: devolve
`{ ok: true, status, data }` ou `{ ok: false, reason: "config" | "timeout" | "network" | "http", status?, error, data? }`.
Nome de função é validado contra `^[a-z0-9][a-z0-9-]{0,62}$` (fecha `../`, `/` e maiúsculas na URL do gateway) e a
configuração ausente vira `reason: "config"` sem requisição. Duração e nome vão para o log em sucesso e em falha.

**Desvio consciente:** `fetchWithTimeout` **não** foi alterado (o comentário dele é a etapa 201) e `safeFetch`
também não — ele bloqueia destino interno por desenho e recusaria a URL do próprio projeto. O tempo limite é
detectado pela mensagem `timed out after` que `fetch-with-timeout.ts:20` emite, porque aquele helper lança `Error`
comum em vez de `AbortError`. `Deno` é lido via `globalThis` para o módulo continuar importável no vitest.

**Mudança de comportamento:** nenhuma hoje — arquivo novo, ninguém o consome ainda (as etapas 157-163 trocam as
chamadas uma a uma). Merge publica em produção sem efeito até a 157.

**Fora de escopo (registrado, não tocado):** nenhuma retentativa, disjuntor ou fila (B-10); as 36 chamadas a
terceiros continuam em `safeFetch`; os `supabase.functions.invoke()` antigos só saem nas etapas 159-163.

**Evidência:**

- `tests/contracts/invoke-function-timeout.spec.ts` (novo, 8 casos): URL e cabeçalhos corretos com token de serviço,
  corpo serializado e `signal` presente; barra final da env não duplica `//`; 500 → `ok:false`/`reason:"http"` com o
  corpo; tempo limite real (fetch respeitando o abort, `timeoutMs: 20`) → `reason:"timeout"` **sem lançar**; erro de
  conexão → `reason:"network"`; nome inválido (`""`, `Funcao`, `../admin`, `a/b`, `nome_com_underscore`) →
  `reason:"config"` e fetch nunca chamado; env ausente → `reason:"config"`; 204 sem corpo → `data: null`.
- Mutação A — sem `timeout` na chamada: 1/8 falha. B — tempo limite classificado como `network`: 1/8. C — sem
  validação de nome: 1/8. D — sem `Authorization`: 1/8. Restaurado: 8/8.
- `npx vitest run --coverage`: **54 arquivos / 441 testes, todos verdes**; totais 76,09 / 73,49 / 77,97 / 78,31
  (antes: 75,82/73,45/78,3/77,96).
- `deno check` do arquivo: 0 erros; `deno lint` limpo; `deno fmt --check` limpo; `npx tsc --noEmit` 0;
  `npm run lint:budget` OK (77/86).
- **NÃO VERIFICADO:** chamada real entre funções em produção (exige deploy e um consumidor — etapa 157). Depois do
  deploy, o log de qualquer função que use o helper deve mostrar `invokeFunction: ok` com `durationMs`.

### Registro - etapa 155 (2026-11-24) - achado B-04 (`ocr-receipt-processor`)

**Causa:** `index.ts:23` (`const body = await req.json()`) alimentava `validateContract` (`:26`), que validava
`storage_path`/`delivery_id` apenas como _texto com tamanho mínimo_, e desestruturava o mesmo corpo **cru** para
`:48` (`supabaseAdmin.storage.from("documents").download(storage_path)`) e para os filtros `:73-74`
(`.eq("delivery_id", ...)` / `.eq("storage_path", ...)`). Resultado: um chamador autenticado conseguia baixar
**qualquer objeto do bucket `documents`** (contratos, anexos de outra entrega) só enviando outro caminho, e ler o
registro de `delivery_receipts` de entrega alheia. O `minLength` não impedia travessia (`receipts/../x`) nem
caminho absoluto.

**Correção:** `parse.ts` novo com `parseReceiptRequest`, chamado no `index.ts` antes de qualquer leitura:
`STORAGE_PATH_PATTERN` (`^receipts/[A-Za-z0-9][A-Za-z0-9._-]{0,200}$`, fecha `../`, subpasta e qualquer prefixo
externo — o único chamador grava em `receipts/<entrega>_<timestamp>.<ext>`) com `MAX_STORAGE_PATH_LENGTH = 300`, e
`DELIVERY_ID_PATTERN` (`^[A-Za-z0-9][A-Za-z0-9_-]{9,63}$`, formato do uuid usado no app) com teto próprio. O
validador passado ao `validateContract` chama o mesmo parse, então o contrato registrado e a execução usam a mesma
regra; `download`, log e os dois `.eq()` passam a usar `storagePath`/`deliveryId` validados. O `catch` devolve
**422** via `validationErrorResponse` antes do 400 genérico de `error.message`.

**Mudança de comportamento:** caminho fora de `receipts/`, com travessia, subpasta, absoluto ou acima de 300
caracteres → **422** `{ error, field: "storage_path" }`; `delivery_id` vazio/curto/fora do formato → **422**
`field: "delivery_id"`. Chamador conferido: `DeliveryReceiptUpload.tsx:53-54` monta
`receipts/${entregaId}_${Date.now()}.${ext}` (uuid + timestamp) e envia em `:110-113` — continua aceito, nenhuma
extensão é restringida (`heic`, `jpeg`, `png`, `webp`, `pdf` passam).

**Fora de escopo (registrado, não tocado):** `error.message` cru na resposta (`:81-82`, B-06/etapa 178); CORS `*`
(`:8`, etapa 193); unificação dos dois caminhos de upload (A-11); o OCR em si continua não implementado (a função
só registra o upload e marca para revisão manual).

**Evidência:**

- `tests/contracts/ocr-receipt-entrada.spec.ts` (novo, 10 casos): caminho real do componente aceito; `heic`/`jpeg`/
  `png`/`webp` aceitos; `../fora.pdf`, `documents/outro.pdf`, `/etc/passwd`, `receipts`, vazio e só espaços
  recusados; `receipts/../secret.pdf`, `receipts/sub/arquivo.pdf` e `receipts/<uuid>/x.pdf` recusados; caminho acima
  do teto recusado citando `300`; `delivery_id` nulo/vazio/curto/com espaço/numérico recusado e uuid/texto longo
  aceitos; corpo não-objeto recusado; e o contrato da edge (usa `parseReceiptRequest(body)`, não desestrutura o corpo
  cru, `download` recebe `storagePath`, `catch` responde 422 antes do `error.message`).
- Mutação A — sem `pattern` no `storage_path`: 2/10 falham. B — sem `pattern` no `delivery_id`: 1/10. C — edge usa o
  corpo cru em vez do parse: 1/10. D — `catch` sem o ramo 422: 1/10. Restaurado: 10/10.
- `npx vitest run --coverage`: **53 arquivos / 431 testes, todos verdes**; `ocr-receipt-processor/parse.ts`
  **100/100/100/100**; totais 75,82 / 73,45 / 78,3 / 77,96 (antes: 76/73,59/78,47/78,15).
- `deno check` 0 = baseline 0; `deno lint` 6 = baseline 6 (4 `no-import-prefix`, `any` em `:81`, `fileData` não
  usado), **0** no `parse.ts`; `deno fmt --check` limpo no `parse.ts`; `npx tsc --noEmit` 0; `npm run lint:budget`
  OK (77/86).
- **NÃO VERIFICADO:** upload + OCR reais (exigem sessão autenticada e o bucket `documents` populado) e o 422 em
  produção. Depois do deploy, `POST /functions/v1/ocr-receipt-processor` com
  `{"storage_path":"receipts/../x.pdf","delivery_id":"8f14e45f-ceea-467a-9c1e-1c2b3d4e5f60"}` deve devolver 422
  com `field: "storage_path"` e **nenhum** `storage.objects` baixado no log.

### Registro - etapa 154 (2026-11-25) - achado B-04 (`evolution-whatsapp`)

**Causa:** `index.ts:62` (`const body = await req.json()`) e `:68` (`const { instance, phone, message } = data`)
usavam os campos **sem validação**, com um guard só de falsy (`:69-81`). `instance` era interpolada na URL da
Evolution (`:88` `/message/sendText/${instance}`, e `:212` `/instance/connectionState/${instance}` sem guard
nenhum), ou seja **qualquer texto escolhia qual conexão de WhatsApp da empresa falava com o cliente**; `phone`
ia como `phone.replace(/\D/g, "")` (`:97`), então `"abc"` ou `"123"` viravam número inválido e o erro só aparecia
no parceiro; `message` sem teto inflava a requisição. `send_cotacao` (`:129-158`) repetia o mesmo padrão.

**Correção:** `parse.ts` novo (puro) com `parseInstance`, `parsePhone`, `parseSendTextRequest`,
`parseCotacaoRequest` e `parseStatusRequest`, usados nas três ações:

- `instance` numa **lista fechada** montada no topo do `index.ts` (`ALLOWED_INSTANCES`): `EVOLUTION_ALLOWED_INSTANCES`
  (separado por vírgula) + `EVOLUTION_INSTANCE_NAME` (a conexão que `whatsapp-notification/index.ts:37-38` já usa)
  ou `"PRINCIPAL"`, com `pattern` `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` para barrar `/` e `..` na URL;
- `phone` em **E.164 com DDI** (`^\+?\d{12,15}$`), sem normalização "no melhor esforço" (o plano pede recusar, não
  adivinhar); a linha `phone.replace(/\D/g, "")` continua, agora sobre um número já validado;
- `message` com teto de **4096 caracteres** (limite de texto do WhatsApp) e os campos opcionais da cotação com
  **200 cada** (`optionalString` do `_shared` não aceita `maxLength` — helper local, sem tocar em `_shared`);
- `ValidationError` devolve **400** `{success:false, error, field}` antes do `log("ERROR", …)`.

**Mudança de comportamento:** telefone sem DDI (ex.: `11999999999`), com máscara, `instance` fora da lista e
mensagem acima de 4096 passam a receber 400 **sem** chamar a Evolution. O único chamador de código é o hook
`useEvolutionWhatsApp` (`src/hooks/integrations/useEvolutionWhatsApp.tsx:25/43/60`), que é exportado em
`src/hooks/index.ts:135` mas **não é usado por nenhuma página/componente** (grep em `src/`) — nada na UI quebra.

**Atenção do dono (configuração):** se a conexão real da empresa não se chamar `PRINCIPAL` nem estiver em
`EVOLUTION_INSTANCE_NAME`, é preciso definir `EVOLUTION_ALLOWED_INSTANCES` nos secrets da Edge Function; sem isso os
envios dessa conexão passam a receber 400. O bloco de auth (`:34-43`, etapa 006) e o rate limit **não foram tocados**.

**Evidência:**

- `tests/contracts/evolution-whatsapp-envio.spec.ts` (novo, 12 casos): envio do hook aceito; `5511999999999` aceito;
  `123`, `(11) 99999-9999`, `11999999999` e `+551199999999999999` recusados em `phone`; `instance` fora da lista
  recusada citando `PRINCIPAL, SUPORTE`; `instance` vazia/`../../admin`/número recusadas; corpo não-objeto recusado;
  mensagem só de espaços e 4097 recusadas; cotação só com `instance`+`phone`; opcionais preservados e
  `valor_mercadoria` de 201 recusado; `check_status` exigindo instance da lista; e o contrato da edge (três parses,
  sem `} = data;` nem `!instance || !phone`, lista fechada e 400 com `field` antes do `log`).
- Mutação A — `PHONE_PATTERN` virado `/^.*$/`: 1/12 falha. B — item fora da lista aceito: 1/12. C — `message` sem
  `maxLength`: 1/12. D — `catch` sem o ramo 400: 1/12. Restaurado: 12/12.
- `npx vitest run --coverage`: **53 arquivos / 433 testes, todos verdes**; `evolution-whatsapp/parse.ts`
  100/100/100/100; totais 76 / 73,59 / 78,47 / 78,15 (antes: 75,57/73,22/77,89/77,69).
- `deno check`: **1 erro = baseline 1** (`log("ERROR", …)` fora do tipo `LogLevel` em `:249`, herdado — B-06);
  `deno lint`: 5 = baseline 5 (**0** no `parse.ts`; os 5 são 4 `no-import-prefix` e `transportadora` não usado,
  todos pré-existentes); `deno fmt --check` limpo no `parse.ts`; `npx tsc --noEmit` 0; `npm run lint:budget` OK.
- **NÃO VERIFICADO:** envio real pela Evolution (exige `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` de produção) e o 400 em
  produção. Depois do deploy, `{"action":"send_text","data":{"instance":"PRINCIPAL","phone":"123","message":"oi"}}`
  com JWT válido deve devolver 400 `field: "phone"` **sem** chamada a `EVOLUTION_API_URL` no log.

### Registro - etapa 153 (2026-11-24) - achado B-04 (`ai-logistics-assistant`)

**Causa:** `index.ts:70` (`const body = await req.json()`) despejava o corpo em `:71` (`body.message || body.prompt`),
`:72` (`body.conversationHistory || []`) e `:73` (`body.stream || false`) **sem validar tipo nem tamanho**; o único
guard era `!message` → 400 (`:75-86`). A pergunta ia inteira para o Gemini: um texto de megabytes (ou um
`conversationHistory` gigante) virava uma requisição paga ao provedor, e `conversationHistory` não-lista quebrava
o spread `...conversationHistory.slice(-10)` com 500 genérico. `stream` string (`"false"`) é _truthy_ e ligava SSE,
mudando o formato da resposta.

**Correção:** `parse.ts` novo com `parseAssistantRequest`, chamado em `index.ts:74`. Limites: pergunta
**4000 caracteres** (`MAX_MESSAGE_LENGTH`, cobre qualquer pergunta real de logística e limita o custo por
requisição), histórico no máximo **10 itens** (o mesmo corte que o `index.ts` já aplicava com `.slice(-10)`, logo
nenhuma conversa legítima é recusada) e **8000 caracteres por item** (respostas em Markdown); `role` restrito a
`user`/`assistant`/`system` via `requireEnum`; `stream` **estritamente booleano**. Erro nomeia campo e índice
(`conversationHistory[2].role`). Pergunta vazia mantém a resposta em português que o app exibe
("Por favor, envie uma mensagem."), e o `catch` (`index.ts:239-252`) devolve **400**
`{ success: false, message, field }` antes do log e do 500 genérico.

**Desvio consciente:** **400**, não 422 como as etapas 146-152, porque `index.test.ts` (teste Deno da própria
função) exige exatamente 400 com `message === "Por favor, envie uma mensagem."` para corpo vazio — contrato próprio
da função. `validationErrorResponse` (422) não é usado aqui de propósito. Módulo puro `parse.ts` porque `index.ts`
importa `deno.land`/`esm.sh` e o vitest não carrega o módulo (mesmo precedente das etapas 146-152).

**Mudança de comportamento:** pergunta acima de 4000 caracteres, histórico com mais de 10 itens ou com item sem
`role`/`content` válidos e `stream` não-booleano passam a receber 400 **antes** de gastar requisição no provedor.
Único chamador é `AIAssistant.tsx:85-95`, que já manda `conversationHistory: history.slice(-10)` e
`stream: true` (booleano) — nenhum caminho do app quebra. O campo de entrada (`:350`) não tem `maxLength` e o
`!resp.ok` (`:96-101`) só diferencia 429, então o teto aparece para o usuário como o erro genérico já existente
(mensagem específica na UI ficou fora de escopo, registrada abaixo).

**Fora de escopo (registrado, não tocado):** rate limit (`:41-58`), auth por claim (`:60-68`), `safeFetch`, prompt
e temperatura; `userId` (`:71`) continua sem uso (`deno lint`, herdado — B-06/etapa 169); a UI não exibe o motivo
do 400.

**Evidência:**

- `tests/contracts/ai-logistics-assistant-texto.spec.ts` (novo, 13 casos): pedido mínimo vira `{message, [], false}`;
  espaços aparados; alias `prompt` preservado; corpo vazio/nulo/lista/texto recusado com a mensagem PT-BR; teto exato
  aceito e 4001 recusado citando `4000`; `stream` `true`/`false` aceitos e `"true"` recusado; histórico não-lista e
  com 11 itens recusados; `role` inválido → `conversationHistory[0].role`; conteúdo de 8001 → `[0].content`; histórico
  válido normalizado; e o contrato da edge (usa `parseAssistantRequest`, não lê `body.message`/`body.stream`, e o
  `catch` responde 400 com `field` antes do `log.error`).
- Mutação A — teto da pergunta removido: 1/13 falha. B — `stream` sem checagem de tipo: 1/13. C — `catch` sem o ramo
  400: 1/13. D — `role` sem `requireEnum`: 1/13. Restaurado: 13/13.
- `npx vitest run --coverage`: **51 arquivos / 412 testes, todos verdes**; `ai-logistics-assistant/parse.ts`
  96,55 stmts / 96,15 branch / 100 funcs (linha 69 = `throw error` do rethrow, inalcançável porque os helpers só
  lançam `ValidationError`); totais 75,57 / 73,22 / 77,89 / 77,69 (antes: 75,29/72,8/77,83/77,42).
- `deno check`: **0 erros = baseline 0**; `deno lint`: 6 = baseline 6, **0** no `parse.ts`; `deno fmt --check` limpo no
  `parse.ts`; `npx tsc --noEmit` 0; `npm run lint:budget` OK.
- **NÃO VERIFICADO:** chamada real ao Gemini (exige `GOOGLE_API_KEY` do dono) e o 400 em produção. Depois do deploy,
  `POST /functions/v1/ai-logistics-assistant` com `{"message":"a".repeat(4001)}` e JWT válido deve devolver 400 com
  `field: "message"` **sem** `generativelanguage.googleapis.com` no log.

### Registro - etapa 152 (2026-11-24) - achado B-04 (`lalamove-tracking`)

**Causa:** `index.ts:91` desestruturava `orderId` e `driverId` do corpo e usava os dois **sem tipo nem formato**
em `:117` (`/v3/orders/${orderId}`) e `:131` (`/v3/orders/${orderId}/drivers/${driverId}`). O `orderId` vem da
rota do app (`/rastreamento/:id`), ou seja, de entrada do usuário: barra, `?`, espaço ou `../` alteravam o caminho
assinado enviado à Lalamove. O `driverId` tinha guarda de presença (`:126`, 400), mas nenhuma de formato.

**Correção:** `parse.ts` novo com `parseOrderId`/`parseDriverId` sobre `ID_FORMAT`
(`^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`, o mesmo formato que a etapa 149 já adota para o `orderId` do parceiro) via
`requireString` com `pattern` e `maxLength = 64`, e corpo que não é objeto tratado como identificador ausente.
A validação acontece **dentro de cada ação** que usa o pedido (`:104`, `:130-131`) — a ação `test`, usada pelo
healthcheck `useIntegrationValidation.tsx:24`, não pede identificador e continua respondendo `{status:"ok"}`. O
`catch` devolve **422** com `validationErrorResponse` (`:163-165`). A desestruturação de `:91` perdeu `orderId` e
`driverId` (agora validados por ação) e o `log.info` de `:95` deixou de registrar o identificador do cliente.

**Mudança de comportamento:** ação de rastreio sem `orderId`, ou com identificador fora do formato/teto, passa a
receber 422 com o nome do campo em vez de mandar caminho arbitrário ao parceiro; `getDriverLocation` sem
`driverId` sai de 400 para 422 (padrão das etapas 146-151). Nenhum chamador real quebra: os dois usos em
`useLalamoveTracking.tsx:267-269` e `:305-311` mandam o `orderId`/`driverId` que vieram da Lalamove, e o
healthcheck manda só `{action:'test'}`.

**Escopo restrito:** nada foi acrescentado ao `safeFetch` (tempo limite e disjuntor já resolvidos) nem às
chamadas do parceiro. O atalho "aceitar lista de identificadores" ficou de fora, como o plano manda — é decisão
do dono e etapa própria.

**Desvio consciente:** 400 do plano → **422** (`validationErrorResponse`), igual às etapas 146-151. Módulo puro
`parse.ts` porque `index.ts:2` importa `deno.land` e o vitest não carrega o módulo (`external-db-bridge/index.ts:4`
é o precedente citado no plano). `_shared/validate.ts` não foi alterado.

**Fora de escopo (registrado, não tocado):** `body.action` lido antes de checar o tipo do corpo (`:92`) e
`error.message` repassado ao cliente no catch (`:169`) são B-06 (etapas 165/172); `useSandbox = true` por padrão
mantém o rastreio em sandbox (etapa 008, dona).

**Evidência:**

- `tests/contracts/lalamove-tracking-id.spec.ts` (novo, 9 casos): `orderId` numérico e com hífen/`_` aceitos; sem
  `orderId` → campo `orderId`; `../orders/1`, `1/2`, `1?x=1`, `1 2`, `.1` → campo `orderId`; 65 caracteres →
  campo `orderId` (64 aceitos); sem `driverId` → campo `driverId`; `drv/1` e `drv 1` → campo `driverId`; corpo
  `undefined`/array/string → campo do identificador; e o contrato da edge (as **duas** ações com pedido passam pelo
  parse, nenhum `body.orderId`, guarda antiga de 400 removida, 422 no catch).
- Mutação A — `pattern` do identificador removido: 1/9 falha. B — `getOrderDetails` usando `body.orderId` cru:
  1/9 (o teste conta as duas chamadas do parse). C — `driverId` sem parse: 1/9. Restaurado: 9/9.
- `npx vitest run --coverage`: **51 arquivos / 408 testes, todos verdes**; `lalamove-tracking/parse.ts`
  100/100/100/100; totais 75,29 / 72,8 / 77,83 / 77,42 (antes: 75,18/72,67/77,65/77,3).
- `deno check`: **1 erro = 1 do baseline** (`log("ERROR", ...)` fora do tipo `LogLevel`, linha +1). `deno lint`:
  3 = baseline 3, **0** no `parse.ts`; `deno fmt --check` limpo no `parse.ts`; `npx tsc --noEmit` 0;
  `npx eslint` no teste 0; `npm run lint:budget` OK (77/86 avisos).
- **NÃO VERIFICADO:** rastreio real no parceiro e o 422 em produção — exige `LALAMOVE_API_KEY`/`_SECRET` e conta
  Lalamove. Depois do deploy: `{"action":"getOrderDetails"}` deve devolver 422 com `field: "orderId"`.

---

### Registro - etapa 151 (2026-11-24) - achado B-04 (`melhor-envio-api`) (2026-11-24) - achado B-04 (`melhor-envio-api`)

**Causa:** `index.ts:59` (`const body = await req.json()`) e `:60` (`const { action, params, useSandbox = true }`)
entregavam `params` cru ao `case "calcularFrete"` (`:77`), que montava a chave de cache
(`me_quote_${btoa(JSON.stringify(params))}`, `:79`) e o corpo enviado a `/me/shipment/calculate` (`:96`) **sem
validar CEP, peso, dimensões e valor declarado**. `requireString`/`requireNumber` não existiam no arquivo: CEP
fora do formato, peso ausente ou `NaN` viravam requisição inválida à conta Melhor Envio da empresa (erro do
parceiro repassado ao painel) e a chave de cache aceitava qualquer corpo, inclusive lixo.

**Correção:** `parse.ts` novo com `parseMelhorEnvioQuote`, chamado **só** no `case "calcularFrete"` (`:79`):
`requireString` com `pattern` de 8 dígitos sobre os CEPs **normalizados** (`"20040-020"` e número viram
`"20040020"`) e erro nomeando o campo (`from.postal_code`/`to.postal_code`); `requireNumber` com `min`/`max`
para as dimensões (1-500 cm), o peso (0,001-1000 kg), o valor declarado (0-1.000.000) e a quantidade (1-999);
`products` (ou o alias `volumes`) obrigatório, não vazio e com no máximo 50 itens; erro de item nomeia o índice
(`products[0].weight`); campos extras do volume (por exemplo `id`) são preservados. O corpo enviado (`:96`) e a
chave de cache (`:79`) passaram a usar o objeto normalizado, e `ValidationError` devolve **422** com
`validationErrorResponse` no topo do `catch` (`:347-349`), antes do 500 genérico.

**Escopo restrito (como o plano pede):** validação **por caminho**, só no `case` da cotação. Validar tudo de uma
vez no alto do arquivo exigiria campo que os outros `case` não usam (o atalho que o plano marca como "tentador a
evitar"). `useSandbox` (`:60`) e o bloco de auth (`:43-49`) **não foram tocados** — etapas 008/009 aguardam o dono.
Os demais `case` (carrinho, etiquetas, lojas) seguem como estavam.

**Mudança de comportamento:** cotação sem CEP, com CEP que não tem 8 dígitos, sem volumes, com lista vazia, com
mais de 50 volumes ou com peso/dimensão fora da faixa passa a receber 422 com o nome do campo, **sem** gastar
requisição no parceiro. Nenhum caminho do app quebra: o único chamador é `MECotacaoPanel.tsx:95-101` (via
`useMelhorEnvio.tsx:123-132`), que já limpa o CEP (`:92-93`), desabilita o botão fora de 8 dígitos (`:242-244`) e
manda `products` com `width`/`height`/`length`/`weight`/`insurance_value`/`quantity` (`:51-59`). Remover todos os
volumes (possível em `:83-84`) passa a devolver 422 em vez do erro do parceiro — o painel já exibe "Erro na
cotação" nos dois casos.

**Desvio consciente:** 400 do plano → **422** (`validationErrorResponse`), igual às etapas 146-150. Módulo puro
`parse.ts` porque `index.ts:1-6` importa `esm.sh`/`deno.land` e o vitest não carrega o módulo — mesmo precedente
citado no plano (`external-db-bridge/index.ts:4`). `_shared/validate.ts` não foi alterado.

**Fora de escopo (registrado, não tocado):** `catch (e) {}` vazio (`:109`), `no-case-declarations` (`:174`,
`:182`), `data.error`/`details` repassados ao cliente (`:340-341`) e `error.message` no catch (`:350`) são B-06
(etapas 165/172); o alias `volumes` é validado mas continua indo com o nome antigo ao parceiro; `useSandbox = true`
por padrão mantém a cotação em sandbox (etapa 008, dona).

**Evidência:**

- `tests/contracts/melhor-envio-cotacao.spec.ts` (novo, 11 casos): payload real do painel normaliza
  `"20040-020"` → `"20040020"` e preserva `options`; sem CEP de destino → campo `to.postal_code`; CEP de 7 dígitos
  → campo `from.postal_code`; sem volumes → campo `volumes` (alias de `useMelhorEnvio.tsx:128`); lista vazia e
  lista com 51 volumes → campo `products`; produto sem peso → `products[0].weight`; `width: 0` →
  `products[0].width`; `insurance_value`/`quantity` ausentes assumem 0 e 1; `params` não-objeto → campo `params`;
  e o contrato da edge (parse no `case`, corpo do `/me/shipment/calculate` vindo do objeto validado, 422 no catch).
- Mutação A — `pattern` do CEP trocado por `/^\d*$/`: 1/11 falha. B — peso sem `requireNumber`: 1/11. C — edge
  usando `params` cru no lugar do parse: 1/11. Restaurado: 11/11.
- `npx vitest run --coverage`: **50 arquivos / 399 testes, todos verdes**; `melhor-envio-api/parse.ts`
  97,14 stmts / 96,55 branch / 100 funcs (linha 67 = `throw error` do rethrow, inalcançável porque os helpers só
  lançam `ValidationError`); totais 75,18 / 72,67 / 77,65 / 77,3 (antes: 74,69/72,02/77,28/76,77).
- `deno check`: **4 erros = 4 do baseline** (mesmos textos: `level: 'WARN'`/`'ERROR'` fora do tipo `LogLevel` e
  `e.message` em `unknown`; linhas +3 pelo import novo). `deno lint`: 6 = baseline 6, **0** no `parse.ts`;
  `deno fmt --check` limpo no `parse.ts`; `npx tsc --noEmit` 0; `npx eslint` no teste 0; `npm run lint:budget` OK
  (77/86 avisos).
- **NÃO VERIFICADO:** cotação real no parceiro e o 422 em produção — exige `MELHOR_ENVIO_TOKEN` e conta Melhor
  Envio. Depois do deploy: `{"action":"calcularFrete","params":{"from":{"postal_code":"01310100"}}}` deve
  devolver 422 com `field: "to.postal_code"`.

---

### Registro - etapa 150 (2026-11-24) - achado B-04 (`resend-email`) (2026-11-24) - achado B-04 (`resend-email`)

**Causa:** `index.ts:43` lia o corpo e `:45-57` mandava `to`, `subject` e `html` ao provedor **sem formato nem
teto de tamanho**. Endereço malformado virava erro do Resend (requisição já paga) devolvido ao cliente como
`data.error.message` (`:60-61`), e corpo/subject sem limite virava cobrança e risco de bloqueio da conta. O
`from` opcional ia cru para o JSON do provedor (`:52`), aceitando quebra de linha.

**Correção:** `parse.ts` novo com `parseEmailRequest`: `to` aceita string **ou lista** (o tipo antigo
`string | string[]` foi preservado — os três chamadores mandam string) e cada destinatário passa pelo formato
`EMAIL` com teto de 320 caracteres e limite de `MAX_RECIPIENTS = 50` por chamada; `subject` até
`MAX_SUBJECT_LENGTH = 200`; `html` até `MAX_HTML_LENGTH = 100_000` (teto escolhido aqui, ~100 KB — o maior
e-mail real do repositório é o digest semanal da `accuracy-weekly-digest`, poucos KB); `from` opcional passa a
exigir "Nome <email>" ou e-mail puro, sem `\r`/`\n` (injeção de cabeçalho). O `index.ts` chama o parse em
`:38-40` **antes** do `safeFetch` (`:42`), manda `to` já normalizado (`:50`) e devolve **422** no `catch`
(`:65-67`), antes do 500 genérico. O bloco de auth `:25-36` (`requireInternalSecret`/`service_role`, padrão
correto citado na etapa 004) e o `safeFetch` não foram tocados.

**Mudança de comportamento:** e-mail malformado, assunto/corpo vazio ou acima do teto passa a ser recusado com
422 **sem** gastar requisição no Resend. Nenhum chamador real quebra: `accuracy-weekly-digest:178-183`,
`send-password-reset:150-160` e `accuracy-meta-monitor:196-203` mandam string em `to`, assunto fixo/título e
HTML de até alguns KB, sem `from` (`grep` em `supabase/functions/*/index.ts`). `Array.isArray(to) ? to : [to]`
saiu do corpo do envio porque o parse já devolve lista.

**Desvio consciente (módulo puro `parse.ts`):** `index.ts:1` importa de `deno.land` e o vitest não carrega o
módulo. Mesmo precedente de `external-db-bridge/index.ts:4` (citado no plano) e das etapas 143-149.
`_shared/validate.ts` não foi alterado. 400 do plano → **422** (`validationErrorResponse`), igual às etapas
146-149.

**Fora de escopo (registrado, não tocado):** repasse de `data.error.message` (`:59-60`) e `error.message` no
catch (`:73`) são B-06/etapa 172; CORS `*` é a etapa 181.

**Evidência:**

- `tests/contracts/resend-email-contrato.spec.ts` (novo, 7 casos): os três campos como os chamadores enviam;
  lista preservada; 15 entradas inválidas em `to` (sem arroba, `a@b`, espaço, `@b.com`, `a@.com`, número,
  lista com item ruim, lista vazia, 51 destinatários) → campo `to`; assunto vazio/201 caracteres → campo
  `subject` (200 aceitos); corpo vazio/100.001 caracteres → campo `html` (100.000 aceitos); `from` com nome ok,
  e-mail puro ok, inválido e com `\r\n` → campo `from`; e o contrato da edge (parse antes do `safeFetch`, sem
  `Array.isArray(to)`, bloco de auth intacto, `422`).
- Mutação A — formato de e-mail não conferido: 1/7 falha. B — teto do assunto removido: 1/7. C — teto do corpo
  removido: 1/7. D — padrão do remetente removido: 1/7. E — edge sem `parseEmailRequest`: 1/7. Restaurado: 7/7.
- `npx vitest run --coverage`: **49 arquivos / 388 testes, todos verdes**; `resend-email/parse.ts`
  100/100/100/100; totais 74,69 stmts / 72,02 branch / 77,28 funcs / 76,77 linhas (antes: 74,28/71,49/77,09/76,34).
- `deno check`: **0 erros** (arquivo já era limpo no baseline — 0 antes, 0 depois); `deno lint`: 1 no `index.ts`
  (= baseline) e **0** no `parse.ts`; `deno fmt` limpo no `parse.ts`; `npx tsc --noEmit` 0; `npx eslint` no teste
  0; `npm run lint:budget` OK (77/86 avisos).
- **NÃO VERIFICADO:** envio real e ausência de requisição ao Resend com `to` inválido — exige `RESEND_API_KEY`
  real e conta no provedor. Depois do deploy: mandar `{"to":"semarroba"}` e conferir 422 + nenhuma linha nova no
  painel do Resend.

---

### Registro - etapa 149 (2026-11-24) - achado B-04 (`lalamove-api`)

**Causa:** `index.ts:78-81` montava `routePath`/`routeMethod` do corpo e roteava por **substring**
(`pathParts.includes('quotations' | 'orders' | 'cancel')`, `:84`, `:131`, `:141`, `:151`). Qualquer corpo que
contivesse a palavra escolhia o verbo HTTP e o caminho usados na conta Lalamove da empresa, e o caminho chegava
montado à chamada real (`/v3/orders/${orderId}`, com `orderId` extraído do próprio corpo, `:142`/`:152`) — na
prática um proxy aberto para a API do parceiro, limitado só pelo que a Lalamove aceitasse. `body.path || ''`
(`:79`) ainda transformava corpo sem `path` em string vazia, que caía no `404` no fim.

**Correção:** `parse.ts` novo com `parseLalamoveRoute`, que valida `method` com `requireEnum` sobre
`ALLOWED_METHODS` (`GET`/`POST`/`PUT`) e `path` contra a **lista fechada** `ALLOWED_PATHS`
(`/quotations`, `/orders`, `/orders/{id}`, `/orders/{id}/cancel`), reconstruindo o caminho de destino no servidor
(`upstreamPath`) — nada do corpo é concatenado na URL. O identificador do pedido passa por
`ORDER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/` (`..`, `?`, `%2F`, espaço e id longo são recusados) e o par
verbo+caminho é conferido (`POST` só em `/quotations` e `/orders`, `GET` em `/orders/{id}`, `PUT` em
`/orders/{id}/cancel`). `path` precisa começar com `/`; barra final, espaços e prefixo `/v3` são tolerados sem
abrir caminho novo. O `index.ts` passou a rotear por `parsed.route` (`:84`, `:130`, `:139`, `:148`), a resposta
`404 Route not found` ficou sem o `path` cru e `ValidationError` devolve **422** no `catch` (`:168-170`).

**Lista de rotas conferida contra o chamador real:** `src/hooks/logistics/useLalamoveOrders.tsx` envia
exatamente `/quotations`+`POST` (`:29`), `/orders`+`POST` (`:46`), `/orders/{id}`+`GET` (`:63`) e
`/orders/{id}/cancel`+`PUT` (`:78`). `grep -rn "lalamove-api" src/ supabase/ scripts/` não achou outro chamador
(`lalamove-tracking/index.ts:104/136` só usa o nome no disjuntor). As quatro rotas estão na lista, então **nenhuma
tela quebra**.

**Mudança de comportamento:** caminho fora da lista deixou de ser "rota desconhecida" com `404` por substring e
passou a **422** com o campo nomeado (`path` ou `method`), que é o 400 pedido no plano, no mesmo desvio consciente
das etapas 146-148 (`validationErrorResponse`). Barra final/espaços/`/v3` seguem aceitos; verbo errado para rota
válida agora é recusa explícita em vez de cair em outro ramo.

**Desvio consciente (módulo puro `parse.ts`):** `index.ts:1-6` importa de `deno.land` e o vitest não carrega o
módulo. Mesmo precedente de `external-db-bridge/index.ts:8` (`ALLOWED_ACTIONS`/`ALLOWED_TABLES`, citado no plano),
`scheduled-reports/fields.ts` (143-145), `smart-carrier-selection/parse.ts` (146), `webhook-status/parse.ts`
(147) e `ingest-biosync/parse.ts` (148). `_shared/validate.ts` não foi alterado; `safeFetch`/disjuntor
(`_shared/safeFetch.ts:65`) não foram tocados.

**Fora de escopo (registrado, não tocado):** `details: errorText` (`:53`/`:58`) e `error.message` no `catch`
(`:170`/`:173`) são B-06/etapa 169; CORS inline é etapa 192.

**Evidência:**

- `tests/contracts/lalamove-api-route.spec.ts` (novo, 8 casos): as 4 rotas reais com `upstreamPath` montado;
  tolerância a barra final/espaços/`/v3`; verbo errado em rota válida → campo `method` (4 combinações); verbo fora
  da lista/ausente (`DELETE`, `get`, `42`) → campo `method`; 15 caminhos fora da lista → campo `path` (inclui
  `/qualquer`, `/orders/{id}/track`, `/v2/orders`, `?query`, `..`, `quotations` sem barra); 7 identificadores
  inválidos → campo `path`; lista publicada no módulo; e o contrato da edge (roteia por `route`, sem
  `pathParts`/`routePath`/`routeMethod`, com `422`).
- Mutação A — conferência de verbo desativada: **1 de 8** falha. Mutação B — `ORDER_ID` afrouxado para
  `/.+/`: **1 de 8** falha. Mutação C — edge sem `parseLalamoveRoute`: **1 de 8** falha (contrato). Restaurado:
  8/8.
- `npx vitest run --coverage`: **48 arquivos / 381 testes, todos verdes**; `lalamove-api/parse.ts`
  100/100/100/100; totais 74,28 stmts / 71,49 branch / 77,09 funcs / 76,34 linhas (antes: 73,61/70,57/76,83/75,64).
- `deno check`: **6 erros, idênticos ao baseline** no mesmo arquivo (mesmos 6 textos, linhas deslocadas +2/+4);
  `deno lint`: 5 no `index.ts` (= baseline) e **0** no `parse.ts`; `deno fmt` limpo no `parse.ts`;
  `npx tsc --noEmit` 0; `npx eslint` no teste 0; `npm run lint:budget` OK (77/86 avisos).
- **NÃO VERIFICADO:** chamada real à Lalamove com `path` fora da lista devolvendo 422 em produção — exige
  secrets/`LALAMOVE_API_KEY` reais; depois do deploy é só repetir o corpo de teste e registrar a resposta.

---

### Registro - etapa 148 (2026-11-24) - achado B-04 (`ingest-biosync`)

**Causa:** `index.ts:21` desestruturava o corpo cru e `:33-35` comparava `heart_rate` com os limiares que decidem
o alerta de emergência do motorista. Em JS a comparação aceita **texto**: `"200" >= 120` é `true` (alerta com
tipo errado) e `"abc" >= 120` é `false` — o alerta crítico ficava **silenciado** por um batimento inválido, e
`Number("")` é `0`, então campo vazio também não alertava. O valor cru seguia para o `insert` (`:43`) como
`heart_rate ?? null`.

**Correção:** o corpo passa a ser interpretado por `parseBioSyncInput` (`parse.ts:19`): `driver_id` e `vehicle_id`
obrigatórios (`requireString`), `heart_rate` por `requireNumber(..., { min: 20, max: 300 })` — a faixa recusa
`""`/`true`/`[]`/`null`/`19`/`301`, que a coerção de `Number()` transformaria em 0/1 — e `fatigue_index`
opcional com padrão `"LOW"` (`optionalString`). O `insert` (`:46-47`) grava os valores **validados** e o
`catch` devolve **422** via `validationErrorResponse` (`:94-96`) antes do 500 genérico. As comparações de
severidade (`:37-38`) não foram tocadas: agora recebem sempre número.

**Mudança de comportamento:** `driver_id` e `heart_rate` passaram de "aceita qualquer coisa" para obrigatórios.
Justificativa no schema: `bio_sync_telemetry` declara `driver_id`, `vehicle_id` e `heart_rate` como **NOT NULL**
(`src/integrations/supabase/types.ts:1014-1016`), então payload sem eles já falhava no banco — agora falha antes,
com 422 e o campo nomeado, em vez de 500. O comentário antigo `// sem leitura = null` (`:43`) descrevia um
caminho que o schema nunca permitiu persistir.

**Desvio consciente (módulo puro `parse.ts`):** `index.ts:1` importa de `deno.land` e o vitest não carrega o
módulo; sem extrair o parse não haveria teste executável. Mesmo precedente de `scheduled-reports/fields.ts`
(143-145), `smart-carrier-selection/parse.ts` (146) e `webhook-status/parse.ts` (147). `_shared/validate.ts` não
foi alterado.

**LGPD:** o batimento **não** foi adicionado a nenhum log novo — `log.info`/`log.error` existentes ficaram como
estavam. Fora de escopo (registrado): `:94` ainda devolve `error.message` cru (etapa 165), o `fetch` para Bitrix24
(`:65` e `:80`) segue sem timeout (etapa 158) e o CORS é o cabeçalho inline (etapa 192).

**Quem chama, conferido:** nenhum chamador em `src/`, `supabase/functions/` ou `scripts/` (achado A-09 já
registrava a função como publicada e sem uso), então não há chamada legítima que passe a ser recusada.

**Evidência:**

- `tests/contracts/ingest-biosync-input.spec.ts` (novo, 8 casos): leitura válida preservada; limites 20 e 300
  aceitos; `"abc"` → campo `heart_rate`; ausente/`null`/`""`/espaços/`true`/`[]`/`{}`/`19`/`301`/`-5` → campo
  `heart_rate`; `"150"` (texto numérico) vira `150`; `driver_id`/`vehicle_id` ausentes/vazios/número/lista →
  campo nomeado; `fatigue_index` ausente/vazio → `"LOW"` e `7` → erro; e o contrato da edge (parse antes da
  comparação, sem `?? null`/`|| "LOW"`, com `validationErrorResponse`).
- Mutação 1 — `requireNumber(...)` trocado por `Number(body.heart_rate)`: **2 de 8** casos falham (o de texto e o
  de faixa). Mutação 2 — `index.ts` voltando a desestruturar `await req.json()`: **1 de 8** falha (contrato).
  Restaurado: 8/8.
- `npx vitest run --coverage`: **46 arquivos / 363 testes, todos verdes**; `ingest-biosync/parse.ts`
  100/100/100/100; totais 73,61 stmts / 70,57 branch / 76,83 funcs / 75,64 linhas (antes: 73,59/70,51/76,77/75,62).
- `deno check supabase/functions/ingest-biosync/index.ts`: **2 erros, idênticos ao baseline** (`log.error(..., e)`
  em `:84` e `error.message` em `:98`); `deno lint`: 2 no `index.ts` (= baseline, `no-import-prefix`) e **0** no
  `parse.ts`; `deno fmt --check parse.ts` limpo; `npx tsc --noEmit` 0 erros; `npx eslint` no teste 0 erros;
  `npm run lint:budget` OK.
- **NÃO VERIFICADO:** requisição real contra a função publicada e linha gravada em `bio_sync_telemetry` — exige
  secrets/projeto remoto, fora desta sessão (código e teste cobrem o caminho até o `insert`).

---

### Registro - etapa 147 (2026-11-23) - achado B-04 (`webhook-status`)

**Causa:** `index.ts:43` lia o corpo e `:46-52` desestruturava `data` sem verificar que existisse — corpo sem
`data` devolvia **500**. Pior: `new_status` ausente fazia `wh.events.includes(undefined)` (`:60`) nunca casar
webhook nenhum, então a função respondia `success: true, processed: 0` sem notificar ninguém: erro silencioso.

**Correção:** o corpo passou a ser interpretado por `parseWebhookStatusInput` (`parse.ts:28`), que valida
`action` com `requireEnum` sobre `ALLOWED_ACTIONS` (`notify_status_change`, `list_webhooks`) e, só para
`notify_status_change`, exige `data` como objeto (`requireRecord`) com `entrega_id` e `new_status` obrigatórios
(`requireString`) e `old_status`/`numero_entrega`/`codigo_rastreamento` opcionais (`optionalString`). O retorno é
uma união discriminada por `action`, e o `switch` passou a usar `parsed.action`/`parsed.data` (`:45-56`); o
`record_id` da auditoria (`:186`) e `new_data.new_status` (`:187`) passaram a usar os valores **validados**, não
mais `data.*` cru. `ValidationError` devolve 422 no `catch` (`:204-206`), antes do log e do 500. HMAC de saída
(`:93-124`), bloco de auth (`:28-40`) e CORS não foram tocados.

**Mudança de comportamento:** ação desconhecida/ausente passou de `default: 400 "Action not implemented"` para
**422** com o campo `action` nomeado. O `default` foi removido por ficar inalcançável. É o contrato já previsto em
`docs/PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md:271` ("ação inválida recebe 422").

**Desvio consciente (módulo puro `parse.ts`):** `index.ts:2` importa de `esm.sh` e o vitest não carrega o
módulo; sem extrair o parse não haveria teste executável. Mesmo precedente de `scheduled-reports/fields.ts`
(143-145) e `smart-carrier-selection/parse.ts` (146). `_shared/validate.ts` não foi alterado — o
`requireRecord` local vive em `parse.ts:50`.

**Quem chama, conferido:** `src/hooks/integrations/useClientWebhooks.tsx:106` invoca a função enviando só
`{ webhookId }`, sem `action` — **já falhava antes** (400 "Action not implemented: undefined") e agora recebe 422;
é bug do hook, registrado em `docs/PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md:271`, fora do escopo desta etapa.
Nenhum trigger ou outra edge chama `notify_status_change` hoje (grep em `src/`, `supabase/`, sem resultado
além do próprio arquivo), então não há chamada legítima que passe a ser recusada.

**Evidência:**

- `tests/contracts/webhook-status-input.spec.ts` (novo, 10 casos): `data` completo preservado; corpo sem
  `data` → campo `data` (era o 500); `data` nulo/lista/texto/número/booleano → campo `data`; `entrega_id`
  ausente ou vazio → campo `entrega_id`; `new_status` ausente/vazio/espaçado/número/objeto/lista → campo
  `new_status`; opcionais continuam opcionais; espaços normalizados; `action` ausente/nula/vazia/"xpto"/"Notify"/
  número/lista → campo `action`; `list_webhooks` sem `data`; e o último caso lê a fonte da edge e afirma
  `parseWebhookStatusInput` antes do `switch`, `= parsed.data`, `validationErrorResponse` no catch e ausência de
  `} = data;`.
- Prova de regressão por mutação, duas: com `data` virando `body["data"] ?? {}` (o atalho que a etapa manda
  evitar) falham **2 de 10**; com `index.ts` voltando a `const { action, data } = await req.json()` falha
  **1 de 10**. Restaurado, 10/10.
- `npx vitest run --coverage` (branch rebaseada na main `ca15101a`, já com a 146): **46 arquivos / 365 testes,
  todos passando** (exit 0); `webhook-status/parse.ts` com 100/100/100/100; cobertura total subiu de
  73,59/70,51/76,77/75,62 para **73,76/70,71/76,9/75,79**.
- `deno check`: 2 erros, **exatamente os mesmos de `origin/main`** (`log.error(..., err)` e
  `log.error(..., error)` recebendo `unknown` — herdados, em `:139`/`:207`); `deno lint`: `index.ts` = 2 =
  baseline, `parse.ts` = 0; `deno fmt --check` de `parse.ts` limpo (`index.ts` não foi reformatado, para não
  gerar churn).
- `npx tsc --noEmit` 0; `eslint` do teste novo 0; `npm run lint:budget` = "All checks within budget" (78/86).

**NÃO VERIFICADO:** requisição real sem `data` depois do deploy (exige `x-internal-secret` ou sessão admin) e o
disparo ponta a ponta para um webhook de cliente real; e o hook do front continua enviando corpo sem `action`
(bug de outra etapa, não regressão desta).

### Registro - etapa 146 (2026-11-23) - achado B-04 (`smart-carrier-selection`)

**Causa:** `index.ts:13` desestruturava o corpo direto (`const { estado_destino, peso_kg, ... } = await req.json()`),
sem checagem de tipo. `peso_kg` em texto entrava na conta de frete (`index.ts:56-215`) e devolvia cotação sem
sentido ou `NaN` propagado, sem erro de cliente.

**Correção:** o parse passou a ser validado antes de qualquer cálculo (`index.ts:15-17`), por
`parseSmartSelectionInput` (`parse.ts:23`): `estado_destino` é UF de 2 letras (obrigatória, normalizada para
maiúscula — `requireString` com `minLength/maxLength: 2` e `pattern`), `peso_kg` é número com `min: 0`
(`requireNumber`, que rejeita `NaN` e texto), e `urgencia`/`tipo_carga` continuam opcionais
(`optionalString`). `ValidationError` devolve 422 estruturado (`index.ts:238-240`) antes do log e do 500.
Nenhuma mudança em `_shared/validate.ts`.

**Desvio consciente (400 do plano → 422):** o plano esperava "400 com a mensagem do campo"; o próprio plano
manda usar `validationErrorResponse`, que responde **422** (`_shared/validate.ts:59-64`) — mesma escolha da
etapa 133. É erro de cliente com o campo nomeado, não 500.

**Desvio consciente (módulo puro `parse.ts`):** a validação ficou em `parse.ts` (módulo puro, sem import remoto)
em vez de inline em `index.ts`, porque `index.ts:3` importa de `esm.sh` e o vitest não carrega o módulo — sem
isso não haveria teste executável. Mesmo precedente de `scheduled-reports/fields.ts` (etapas 143-145),
`accuracy-weekly-digest/digest.ts` e `accuracy-meta-monitor/escalation.ts`.

**Endurecimento além do texto do plano:** `Number(null)`, `Number("")` e `Number([]`) valem 0, então
`requireNumber` sozinho aceitaria esses valores como peso zero — cotação errada em silêncio, exatamente o
"atalho tentador a evitar" citado na etapa. `requirePesoKg` (`parse.ts:37`) rejeita qualquer coisa que não seja
número ou string numérica não vazia. `true`, `null`, `""`, `{}` e `[]` passam a dar 422.

**Quem chama, conferido antes de mexer (risco citado na etapa):** `src/hooks/logistics/useSmartCarrierSelection.tsx:57`
invoca a função; `:31`/`:32` tipam `estado_destino: string` e `peso_kg: number`;
`src/components/freight/SmartCarrierSelector.tsx:93` bloqueia envio sem destino/peso e `:99` envia
`parseFloat(formData.peso_kg)`; `src/hooks/logistics/useQuotationFlow.tsx:121` e `:137` repassam números. Nenhum
chamador envia peso em texto, então não há chamada legítima que passe a ser recusada.

**Evidência:**

- `tests/contracts/smart-carrier-selection-input.spec.ts` (novo, 8 casos): UF normalizada; peso `0` aceito como
  limite válido; `"abc"` recusado; `undefined`/`null`/`""`/`"   "`/`[]`/`{}`/`true`/`-1` recusados; UF ausente,
  curta, longa, vazia ou não alfabética recusada; opcionais preservados e tipo errado recusado; só os 4 campos do
  contrato saem do parse; e o último caso lê a fonte da edge e afirma validação antes da consulta a
  `tabelas_frete` e `validationErrorResponse` no catch.
- Prova de que o teste pega a regressão, duas mutações: com `peso_kg` voltando a
  `Number(body["peso_kg"]) || 0` falham 2 de 8 casos; com `index.ts` voltando a desestruturar o corpo cru falha
  1 de 8. Restaurado, 8/8.
- `npx vitest run --coverage`: **45 arquivos / 355 testes, todos passando** (exit 0); `parse.ts` com
  100/100/100/100; cobertura total subiu de 73,22/70,06/76,63/75,28 para **73,59/70,51/76,77/75,62**.
- `deno check` = 3 erros, os mesmos herdados de `origin/main` (`userId` em `:39` e `error.message` em
  `:246`/`:251` — este último é B-06/etapa 177 e **não** foi tocado); `deno lint` do diretório = 13 problemas
  (`index.ts` = 11, o baseline; `parse.ts` = 0); `deno fmt --check` de `parse.ts` limpo — `index.ts` **não** foi
  reformatado, para não gerar churn.
- `npx tsc --noEmit` 0; `eslint` do teste novo 0; `npm run lint:budget` = "All checks within budget".

**NÃO VERIFICADO:** a requisição real com `{"peso_kg":"abc"}` depois do deploy (exige `authenticated`/`anon` key
com a sessão válida — não disponível nesta sessão); e a cotação ponta a ponta pela interface.

### Registro - etapas 143 a 145 (2026-11-23) - achados B-03/B-04 (`scheduled-reports`)

**Causa:** o corpo da requisição era espalhado direto no banco — `.insert([{ ...reportData, user_id: userId }])`
e `.update(reportData)` —, então qualquer coluna de `scheduled_reports` era gravável por quem chama. `action` e
`reportId` vinham do corpo sem checagem: corpo sem eles caía em 500 em vez de erro de cliente.

**Correção:** o payload passou a ser montado campo por campo, com allowlist (`name`, `report_type`,
`frequency`, `day_of_week`, `day_of_month`, `time_of_day`, `recipients`, `filters`, `is_active` — espelho das
colunas graváveis de `src/integrations/supabase/types.ts`). `id`, `user_id` e timestamps são descartados mesmo
que venham no corpo; `user_id` continua vindo de `auth.claims.sub` (`index.ts:34-35`). `action` fora da
allowlist devolve 400 antes do `switch` (`index.ts:43-50`); `reportId` é obrigatório em `update`/`delete`
(`index.ts:70` e `:90`); payload inválido devolve 422 estruturado via `validationErrorResponse`
(`index.ts:159`), nunca 500.

**Desvio consciente da 144:** a montagem ficou em `supabase/functions/scheduled-reports/fields.ts` (módulo puro,
sem import remoto) em vez de função local em `index.ts`. Motivo: `index.ts:2` importa de `esm.sh`, então o
vitest não consegue carregar o módulo; com a função inline, a exigência da 145 ("teste que prove o descarte do
campo") seria impossível de cumprir como teste executável. Precedente no repo: `accuracy-weekly-digest/digest.ts`
e `accuracy-meta-monitor/escalation.ts` importados pelo próprio `index.ts` de cada function. Não é arquivo em
`_shared/`, que é o que a etapa pede para evitar.

**Desvio consciente da 145:** `action` é validada por `isAllowedAction` (`fields.ts:27`) com **400**, e não por
`requireEnum` (que devolveria 422): a própria etapa exige "400, não 500" para ação desconhecida. `requireString`
sobre `reportId` é usado exatamente onde o caminho exige. `report_type` fica como string validada (o gerador tem
`default` seguro em `index.ts:304`); `frequency` é enum fechado, porque valor inválido ali faz o agendamento
nunca rodar.

**Evidência:**

- `tests/contracts/scheduled-reports-fields.spec.ts` (novo, 7 casos): allowlist descarta `user_id`, `id`,
  `created_at`, `last_sent_at`, `next_send_at` e campo arbitrário; update parcial não sobrescreve campo ausente;
  `frequency`, `day_of_week`, `day_of_month`, `time_of_day`, `recipients`, `filters` e `is_active` inválidos
  lançam `ValidationError` com o campo culpado; `create` exige `name`+`report_type`; `isAllowedAction` recusa
  `"xpto"`, `""`, `undefined`, número e array; e o último caso lê a fonte da edge e afirma `insert`/`update`
  validados, `status: 400` e `validationErrorResponse` no catch.
- Prova de que o teste pega a regressão: com o `index.ts` de `origin/main` o caso de fonte falha (1/7); com
  `buildReportFields` voltando a copiar o corpo cru (`{ ...fonte }`) o caso da allowlist falha (1/7). Restaurado,
  7/7.
- `npx vitest run --coverage`: **44 arquivos / 347 testes, todos passando** (exit 0); `fields.ts` com 100% de
  statements/linhas e 97,91% de branches; cobertura total subiu de 72,06/67,84/75,94/74,06 para
  **73,22/70,06/76,63/75,28**.
- `deno check` limpo nos dois arquivos; `deno lint` de `index.ts` = 14 problemas, exatamente o baseline de
  `origin/main` com o mesmo `package.json` (nenhum novo); `fields.ts` com 0; `deno fmt --check` de `fields.ts`
  limpo.
- `npx tsc --noEmit` 0; `eslint` do teste novo 0; `npm run lint:budget` = "All checks within budget";
  `npm run automation:test` = fail 0.
- `supabase/functions/scheduled-reports/index.test.ts` (Deno) **já estava quebrado em `origin/main`**: os
  `Deno.env.set` rodam depois do `import` de `index.ts`, então `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
  chegam `undefined` e 3 dos 4 casos dão 500. Confirmado rodando o mesmo arquivo contra `origin/main` — mesmas 3
  falhas, antes e depois desta mudança. Não é executado pela CI (o glob é `**/index_test.ts`, não casa com
  `index.test.ts`, e o passo termina em `|| true`).
- A verificação sugerida pela 145 (`npx vitest run supabase/functions/scheduled-reports`) não acha teste nenhum:
  o `include` do vitest cobre `src/**` e `tests/**`. O comando usado foi
  `npx vitest run tests/contracts/scheduled-reports-fields.spec.ts`.

**NÃO VERIFICADO:** criar/editar um agendamento pela interface e conferir a linha gravada, depois do deploy da
edge — não há acesso a banco nesta sessão.

### Registro - etapas 138 a 141 (2026-11-23) - achado B-02

**Causa raiz (comum às três):** não existia lugar único para responder "qual é a chave deste evento",
então cada webhook decidia sozinho — e três dos quatro decidiam errado. `lalamove-webhook/index.ts:97`
usava `crypto.randomUUID()` e `nexus-webhook-receiver/index.ts:78` usava `Date.now()`: nos dois a chave é
nova a cada reenvio, então a dedupe **nunca** acerta. `carrier-webhook-receiver/index.ts:130-132` errava ao
contrário: com `?? ""` no lugar do `timestamp`, a chave virava `carrier_id:event_type:` — a mesma para todos
os eventos daquele tipo — e o segundo evento legítimo era descartado como duplicata, sumindo do rastreio do
cliente. Só `rodonaves-webhook` estava correto.

**138 — `supabase/functions/_shared/eventKey.ts` (arquivo novo) + reexport em `_shared/idempotency.ts`.**
`buildEventKey(provider, parts, fallbackBody?)` (`:55-69`) recebe os identificadores **na ordem**, descarta
vazio/nulo/espaço em branco (`normalizePart`, `:17`), junta com `-` e devolve `{ provider, id, key }` — ou
`null` quando nada identifica o evento, que é o sinal para o chamador recusar com 400 em vez de inventar
valor. Último recurso para payload sem campo estável: `bodyHash` (`:34`), SHA-256 do **JSON canônico**
(chaves ordenadas, `canonicalJson`, `:24`) — determinístico, ao contrário do `randomUUID()`. O hash é
usado só quando `parts` não tem nenhum valor; não passou a existir fallback aleatório, que é justamente o
atalho que anula a dedupe.

**Desvio consciente da etapa 138 (por favor leia).** O plano manda acrescentar a função a
`supabase/functions/_shared/idempotency.ts`. Pus a **implementação** num módulo novo e puro,
`_shared/eventKey.ts`, e o `idempotency.ts` só a reexporta (`export { bodyHash, buildEventKey } from
"./eventKey.ts"`, última linha). Motivo único: `idempotency.ts:3` importa `@supabase/supabase-js` de
`https://esm.sh`, e o vitest do repositório não carrega dependência `https:` — por isso os testes de
`tests/integration/*.spec.ts` só importam módulos puros de `_shared` (`validate.ts`, `number.ts`). Com a
implementação no mesmo arquivo do import remoto, a etapa 138 não teria teste executável na CI. Os três
webhooks importam de `../_shared/idempotency.ts`, como o plano descreve, e `claimIdempotencyKey` (`:28-61`)
não foi tocado — o helper continua fail-open de propósito.

**139 — `lalamove-webhook/index.ts`.** Import de `bodyHash`/`buildEventKey` e de `redact`; a linha
`finalEventId = eventId || data?.orderId || crypto.randomUUID()` virou `buildEventKey('lalamove', ...)`
seguido de `const finalEventId = eventKey.id;`. `eventId` isolado é o identificador forte; sem ele entra
`orderId` **+ `status` + momento do próprio evento** (`data.timestamp`, e o hash de `data` quando o evento
não traz timestamp). O `status` entra porque duas mudanças de status do **mesmo** pedido são dois eventos
legítimos — chave só com `orderId` engoliria a segunda (o mesmo defeito da 141). `eventType` **não** entra
como discriminador sozinho: é campo obrigatório do contrato, então usá-lo geraria uma chave única para todo
evento do tipo. Sem `eventId` e sem `orderId` a resposta é **400** com erro genérico, e o payload vai para o
log via `redact(webhookData)`. O bloco de idempotência da etapa 133 (`:127-150`) não foi tocado.

**140 — `nexus-webhook-receiver/index.ts`.** A chave deixou de terminar em `:${Date.now()}`. Agora usa os
identificadores reais do payload: `data.key.id` (id da mensagem no Evolution API), `event_id`, `id`,
`carrier_id`, `cotacao_id`, `data.key.remoteJid` e `text`; `body` entra como hash de último recurso. O
`provider` passado ao helper continua sendo `nexus:<event|source>`, então a chave final ficou
`nexus:messages.upsert:<id>`. HMAC (`:36-42`) e os `functions.invoke` (`:162`/`:175`) não foram tocados.

**141 — `carrier-webhook-receiver/index.ts`.** A chave `${carrier_id}:${event_type}:${timestamp ?? ""}` virou
`buildEventKey` com provider `carrier:<carrier_id>`, identificador ? [identificador] : [payload.event_type,
payload.timestamp || await bodyHash(payload)], payload)`. Com `event_id`/`id`a chave é o identificador; sem
ele,`event_type`ainda entra, mas o componente que discriminava vazio passa a ser **o hash do corpo** —
dois payloads diferentes do mesmo tipo geram chaves diferentes e dois payloads idênticos continuam
deduplicando. Nada mais na função mudou: o padrão de referência de erro sem vazamento e o`mapCarrierStatus`
estão intocados.

**Validação (executada nesta sessão).** `deno check` nos 4 arquivos + o novo: **3 erros herdados antes e
depois**, lista idêntica linha a linha (2 chamadas `log.info(msg, redact(x))` com `unknown` e
`rl.retryAfter` do `rateLimiter`), zero erro novo; `deno lint` idem aos da main; `tsc -p tsconfig.app.json`
0; `eslint` 0; `npm run lint:budget` OK (0 erros, dentro do budget); **`npm run automation:test` 103/103**
(obrigatório porque o teste novo vive em `tests/`); `vitest run --coverage` **43 arquivos, 0 falha**, e a
cobertura **subiu** em relação à linha de base (72.06 / 67.84 / 75.94 / 74.06 contra 71.65 / 67.41 / 75.29 /
73.67) — `eventKey.ts` 95,83% de linhas. O teste novo (`tests/contracts/event-key.spec.ts`) tem 7 casos:
mesma entrada → mesma chave; vazio/nulo/espaço → `null`; sem identificador → `sha256-<32 hex>` determinístico
e ordem de chaves do corpo irrelevante; corpo diferente → chave diferente; e três contratos na fonte (zero
`randomUUID` no lalamove, zero `Date.now()` no nexus, ausência do `?? ""` no carrier). Provado que ele pega
regressão: com as três edges revertidas para a `main`, **3 dos 7 casos falham**; restauradas, 7/7 passam.

**NÃO VERIFICADO.** Comportamento ponta a ponta nos provedores: nenhuma das três transportadoras foi
acionada com payload real (os secrets de produção não estão disponíveis nesta sessão), então não confirmei
com envio real que o reenvio cai na dedupe nem que a Lalamove responde 400 sem identificador. Não há
staging. Também não medi nos logs quantos eventos o lalamove recebia sem `eventId`/`orderId` nem quantos do
carrier vinham sem `timestamp` — números que o plano pede para registrar: como os payloads são gravados
brutos em `webhook_events_processed.payload`, dá para contar depois do deploy. E a **142** (gate de `grep`
em `scripts/ci/`) continua `[~]`, aguardando o dono: toca `scripts/` e a automação da CI.

### Registro - etapas 132 a 137 (2026-11-23) - achado B-01

**132 - a unicidade existe no banco ao vivo.** Sem MCP do Supabase nesta sessão, a prova veio do próprio
repositório: a run `45189263904` do `types-sync` executou o job "Ler banco oficial e gerar candidatos"
contra a produção em 2026-11-23T14:07Z, e o `schema-manifest.json` gerado nessa run saiu **idêntico byte a
byte** ao commitado - sha256 `5575176495c7d31a7ed5277ea9e80ea16840fe679af86041dc5d3cc557103a8c` (o
`schema-catalog.json` também: `fef0bfe4baba70df133966e3063675edf9ab24a519c461b5f62ea98a0d9b1527`). Nomes
reais das restrições de unicidade, lidos de `constraints` **e** `indexes` do manifesto:

| tabela                     | restrição                                        | colunas                |
| -------------------------- | ------------------------------------------------ | ---------------------- |
| `webhook_events_processed` | `webhook_events_processed_event_id_provider_key` | `(event_id, provider)` |
| `idempotency_keys`         | `idempotency_keys_idempotency_key_key`           | `(idempotency_key)`    |

As duas tabelas têm também a `_pkey` respectiva, e `service_role` tem `DELETE` concedido em
`webhook_events_processed` (`relation_grants`), então o código das etapas 133-136 não precisa de DDL.

**133 e 134 - `lalamove-webhook` (`supabase/functions/lalamove-webhook/index.ts`).** A consulta prévia
(`select ... maybeSingle()`) deu lugar ao insert do marcador em `:105-124`, antes do `switch` (`:126`), com
`23505` devolvendo `{ success: true, duplicate: true }` (`:114`) e qualquer outro erro virando log e
seguindo (`:120-123`), igual a `_shared/idempotency.ts:30`. O bloco "Mark as processed" do fim foi apagado;
o `webhook_events_processed` aparece **uma vez** no arquivo. Resposta de sucesso em `:198` inalterada.

**135 e 136 - `rodonaves-webhook` (`supabase/functions/rodonaves-webhook/index.ts`).** A consulta prévia
saiu; o insert do marcador ficou em `:172-200`, com `23505` em `:181`. **Desvio consciente do texto da
etapa 135:** o plano manda gravar no lugar da consulta (`:128-135` antigos), mas ali o marcador passaria a
engolir dois caminhos que hoje não gravam nada e continuam reprocessáveis - `Entrega não encontrada`
(`:144`, 404) e `Status code não mapeado` (`:160`). Gravar antes deles transformaria um evento sem entrega
ainda cadastrada em "Already processed" para sempre. O marcador ficou imediatamente antes do primeiro write
de negócio (`Update entrega`, `:201`; `.update(updateData)` em `:210`; insert em `ocorrencias` em `:217`),
que fecha a janela TOCTOU do mesmo jeito e preserva as duas saídas. O teste da etapa 137 trava essa ordem.
Bloco "Mark as processed" apagado; `webhook_events_processed` aparece **uma vez**; `event_id` continua na
resposta de sucesso (`:233`).

**137 - `tests/contracts/webhook-idempotencia.spec.ts` (novo).** As duas edges chamam `serve()` no topo do
módulo e não exportam handler, então importar o `index.ts` num teste não é viável sem refatorar - o plano
manda não refatorar nessa etapa e entregar o alcançável. O teste verifica a fonte, que é exatamente o que a
regressão mudaria: (a) o marcador aparece antes do primeiro write de negócio; (b) `23505` e
`duplicate: true` existem; (c) não há consulta prévia (`existingEvent`, `.maybeSingle()`) nem gravação
tardia (`Mark as processed`), e o marcador é gravado uma única vez; (d) no `rodonaves-webhook` o marcador
fica depois da saída `Entrega não encontrada`. 7 testes. **Prova de que o teste pega a regressão:** com as
duas edges revertidas para o `main` (`git checkout origin/main -- ...`) ele falha 5 de 7.

**Verificação executada:** `deno check` nas duas edges, 0 erros; `deno lint` nas duas, 6 problemas - os
mesmos 6 do `main` (conferido revertendo os arquivos); `tsc --noEmit -p tsconfig.app.json`, 0;
`eslint` nos arquivos tocados, 0 erros (`supabase/functions` é ignorado pelo eslint do repo, por isso o
`deno check`); `npm run lint:budget` OK (77/86 avisos, 0/0 erros); `vitest run --coverage` 42 arquivos /
333 testes passando (eram 41/326), cobertura 71.65 / 67.41 / 75.29 / 73.67, idêntica a baseline.

**NÃO VERIFICADO:** entrega real de webhook em produção depois do deploy - a confirmação de deploy e de
comportamento fica para depois do merge. Não houve teste contra o banco ao vivo.

**Achados novos (não corrigidos):**

- `src/integrations/supabase/types.ts` está atrás do banco: a run 45189263904 do `types-sync` acusa
  `user_panel_preferences` (metas de SLA da #248) presente em produção e ausente no arquivo commitado, o
  que derruba o gate de TypeScript do próprio `types-sync` desde 2026-11-23. Drift de tipos, não de
  restrições. **[Corrigido na etapa 222: a direção estava invertida - a tabela está no arquivo
  commitado e falta em produção. Ver "Registro - etapa 222".]**
- O teste da 137 depende de `serve()` continuar inline nas duas edges; se alguém exportar o handler, o
  teste vira redundante e deve ser trocado por teste de unidade com cliente simulado.

### Registro - etapas 128 a 131 (2026-11-23) - achado R-09

**Decisão de nome, comum às quatro:** criei `src/lib/realtimeChannel.ts:12`
(`uniqueChannelName(base)` devolve `base-<timestamp base36>-<contador do módulo>`) e usei **sufixo por
instância nas quatro**, não `user.id`. Motivo: o caso que o achado descreve é _duas montagens do mesmo
usuário_ (duas abas, dois componentes, widget mais página) e nome por usuário não separa isso. O helper
evita copiar o contador em quatro arquivos e não depende de `crypto` (ausente em parte dos ambientes de
teste). No lugar do `useRef` do padrão de `useRealtime.tsx:94` usei `useState(() => ...)`: o inicializador
preguiçoso roda uma vez por instância, então o nome é estável entre renders - que é o que o plano exige
do `ref` - e não cai na regra de escrita de `ref` durante o render.

**128 - `useBoxManagement` (`src/hooks/logistics/useBoxManagement.tsx`).** `canalBoxes` (`:87`), aplicado no
`.channel()` de `:92`, deps `[refetch, canalBoxes]` (`:105`). O `removeChannel` já existia no `return` -
conferido antes de mexer, como o plano pede.

**129 - `useMapWeatherSync` (`src/hooks/logistics/useMapWeatherSync.ts`).** `canalZonas` (`:47`), aplicado em
`:54`, deps `[]` → `[canalZonas]` (`:63`) - só a dependência nova, que é estável; `fetchRiskZones`
continua fora das deps, como estava (não mexi para não reproduzir o R-02 aqui). O filtro do
`postgres_changes` e a chamada `fetchRiskZones()` estão intactos.

**130 - `useSmartAlerts` (`src/hooks/logistics/useSmartAlerts.tsx`).** `canalTatico` (`:170-172`), aplicado em
`:177`, deps `[canalTatico]` (`:203`). `removeChannel` já existia. `addAlert` e a classificação
`crit`/`warning` intocados; o `setInterval` de `:163-165` continua com o `clearInterval` dele.

**131 - `useNexusHealth` (`src/hooks/system/useNexusHealth.ts`).** Nome único **por medição**:
`measureLatency` chama `uniqueChannelName("nexus-latency-probe")` dentro da própria função (`:27`) e o
contador do módulo garante sufixo novo a cada chamada - não foi preciso mudar a assinatura nem passar
sufixo por argumento. Os **dois** caminhos de saída removem o canal: o timeout de 4 s (`:29`) e o
`SUBSCRIBED` (`:37`), então não há vazamento por medição (o risco que o plano aponta). O `useEffect` de
`:81-89`, que é o padrão de referência do R-08, **não foi tocado**.

#### Varredura de fechamento do R-09 (exigida pela etapa 131)

`grep -rn 'supabase.channel(\|\.channel(' src/ | grep -v '\${'`, sem `*.test.*`: os **4 canais do R-09**
agora passam por `uniqueChannelName`. Sobraram **6 nomes fixos**, todos fora do escopo do achado (o achado
nomeia hooks; estes são componentes, página e utilitário):

| Arquivo                                         | Nome fixo             | Risco                                        |
| ----------------------------------------------- | --------------------- | -------------------------------------------- |
| `src/components/map/TacticalTerminal.tsx:49`    | `tactical-logs`       | **colide** com `MapaRotas.tsx:139`           |
| `src/pages/MapaRotas.tsx:139`                   | `tactical-logs`       | mesmo tópico do terminal tático              |
| `src/components/common/RealtimeStatus.tsx:25`   | `system-health-check` | um por app - benigno                         |
| `src/components/common/RealtimeBadge.tsx:22`    | `presence-health`     | um por app - benigno                         |
| `src/components/freight/ResponseConsole.tsx:35` | `raw_responses`       | duas telas abertas → a segunda perde eventos |
| `src/utils/systemTester.ts:37`                  | `health-ping`         | roda uma vez no auto-teste - benigno         |

**Achado novo R-09b:** `TacticalTerminal.tsx:49` e `MapaRotas.tsx:139` assinam **o mesmo tópico**,
`tactical-logs`. Com as duas telas montadas, a segunda faz `.on()` depois do `.subscribe()` da primeira -
exatamente o estouro que `useRealtime.tsx:22-24` documenta. Não corrigido: são componentes e a etapa 131
manda registrar, não consertar.

**Validação:** `tsc --noEmit` 0 erros; `eslint` nos 5 arquivos 0 erros e **1 aviso herdado**
(`react-hooks/set-state-in-effect` em `useMapWeatherSync`, o mesmo que `origin/main` já tinha - conferido
com `git stash`); `prettier --check` limpo no arquivo novo e em `useSmartAlerts.tsx` (que era limpo na main;
`useBoxManagement.tsx` e `useMapWeatherSync.ts` já estavam fora do padrão na main, não rodei `--write`
para não reformatar alheio); `vitest run --coverage` 41 arquivos / 326 testes passando, cobertura idêntica
à linha de base. **NÃO VERIFICADO** o comportamento em tempo real (duas abas recebendo o mesmo evento):
exige projeto Supabase com Realtime habilitado e duas sessões simultâneas; não há staging.

### Registro - etapas 123 a 127 (2026-11-23) - achado R-08

**123 - `useSLANotifications` (`src/hooks/logistics/useSLANotifications.tsx`).** As duas funções
de módulo passaram a devolver o cancelamento em vez de deixar o temporizador solto:
`showBrowserNotification` (`:42`) devolve `() => { clearTimeout(autoCloseTimer); notification.close(); }`
e `playAlertSound` (`:83`) devolve `cancelar`, que limpa os temporizadores e chama `encerrarSom()`.
`encerrarSom` (`:99`) **fecha o `AudioContext`** - é a armadilha que o plano aponta: cancelar só o
timeout que fecharia o contexto o deixaria aberto; e é idempotente (flag `encerrado`), então
cancelar no desmonte não estoura quando o som já terminou. O hook guarda cada cancelamento em
`cancelamentosRef` (`:161`) e o `useEffect` de `:164-170` cancela tudo no desmonte.
Frequência, ganho e durações do oscilador (880/660/880, ganho 0,3 / 523, ganho 0,2; 150, 300,
450 e 200 ms) estão **inalterados**.

**124 - `useOnboarding` (`src/hooks/ui/useOnboarding.tsx`).** `achievementTimerRef` (`:84`),
cancelado antes de reagendar (`:198`) e no cleanup do `useEffect` (`:87-91`). O atraso de 2 s
continua lá - ele existe para a conquista não competir com o `toast.success` de XP.

**125 - `useAchievementNotifications` (`src/hooks/gamification/useAchievementNotifications.tsx`).**
Lista `dismissTimersRef` (`:29`) com cleanup no desmonte (`:32-38`): lista, e não um timer só,
porque cada conquista agenda o seu próprio descarte. `dismissNotification` continua removendo por
`id` (`:59`) e o timer por `timestamp` (`:54`) - os dois critérios **não foram unificados**, como o
plano manda; a divergência fica registrada abaixo.

**126 - `useImportData` (`src/hooks/common/useImportData.ts`).** `resetTimerRef` (`:52`), cancelado
antes de reagendar (`:197`) - duas importações seguidas não zeram mais o progresso da segunda - e
no cleanup (`:55-59`). **Dependência que o plano mandou conferir:** o
`grep -rn "useImportData" src/` dá **uma única ocorrência, o reexport em `src/hooks/index.ts:18`**.
Nenhuma tela usa este hook hoje, então não existe teste real possível em tela - o hook está morto
na árvore (achado abaixo).

**127 - `useDocumentUpload` e `useSecurityPushNotifications`.** `progressResetTimerRef`
(`src/hooks/data/useDocumentUpload.ts:25`) cancelado antes de reagendar (`:109`) e no cleanup
(`:28-32`); `autoCloseTimersRef` (`src/hooks/notifications/useSecurityPushNotifications.tsx:21`) em
lista, com cleanup (`:24-30`). O `catch` de `useSecurityPushNotifications.tsx:123` e a condição
`event.severity !== 'critical'` de `:120` ficaram **intactos**: aviso crítico continua sem fechar
sozinho.

#### Varredura de fechamento do R-08 (exigida pela etapa 127)

`grep -rn "setTimeout(" src/ --include=*.ts --include=*.tsx`, sem `*.test.*`: **49 arquivos e 66
chamadas**. Os 10 do R-08 são 10 dessas 66, e agora estão cancelados.

| Grupo                                                                                                  | Arquivos | Chamadas | Situação                                                                                          |
| ------------------------------------------------------------------------------------------------------ | -------- | -------- | ------------------------------------------------------------------------------------------------- |
| Os 10 timers do R-08 (cancelados neste lote)                                                           | 6        | 10       | `[x]`                                                                                             |
| Hooks com `clearTimeout` + `use-toast.ts` (timer no `Map toastTimeouts`)                               | 8        | 11       | corretos                                                                                          |
| Legítimos do A-08 em hooks (`useDeliveryRoutes.tsx:256`, `useGeocoding.tsx:75`)                        | 2        | 2        | legítimos                                                                                         |
| `useQRScanner.tsx`                                                                                     | 1        | 2        | `:136` benigno (só ref) · `:213` → R-08b                                                          |
| **Total em `src/hooks/`**                                                                              | **17**   | **25**   | conferido                                                                                         |
| **Fora de `src/hooks/`** (30 componentes/telas + `main.tsx` + `CircuitBreaker.ts` + `systemTester.ts`) | **32**   | **41**   | só `CircuitBreaker.ts:39` e `BiometricConsentModal.tsx:66` são legítimos do A-08; o resto → R-08b |

O achado R-08, que é **de hooks**, fecha aqui: nenhum hook de `src/hooks/` cria `setTimeout`
em callback sem referência e sem `clearTimeout`, exceto os dois legítimos que o A-08 nomeia.

**Achados novos (não corrigidos, fora do escopo do R-08):**

- **R-08b** - fora de `src/hooks/` sobraram **39 chamadas em 30 arquivos** de componentes e telas com
  o mesmo formato do R-08 (timeout criado dentro de callback, sem referência). Muitas são
  inofensivas (`setCopied(false)`, esconder confete), mas mexem em estado de tela depois de a tela
  sair: `src/pages/Envios.tsx:454` e `:551`, `src/pages/ImportacaoMassa.tsx:243` (`setCurrentStep(0)`),
  `src/pages/Clientes.tsx:295` e `src/main.tsx:59`/`:63` (splash). Mais `useQRScanner.tsx:213` (`setTimeout(startScanning, 100)` dentro de
  `switchCamera`, que chama `getUserMedia` se a tela saiu no meio).
- **Hook morto** - `useImportData` não é consumido por nenhuma tela (só reexport em
  `src/hooks/index.ts:18`). O bug que a etapa 126 corrige não tem como aparecer hoje.
- **Critério divergente em `useAchievementNotifications`** - descarte automático por `timestamp`
  (`:54`) e `dismissNotification` por `id` (`:59`). Não unificado por decisão do plano.

**Validação:** `tsc --noEmit` 0 erros; `eslint` nos 6 arquivos 0 erros e **2 avisos herdados**
(`react-hooks/set-state-in-effect` em `useSLANotifications` e `useSecurityPushNotifications` - as
mesmas duas ocorrências já existem em `origin/main`, só mudaram de linha); `vitest run
--coverage` 41 arquivos / 326 testes passando, cobertura 71,65 st / 67,41 br / 75,29 fn / 73,67 li,
idêntica à linha de base. **NÃO VERIFICADO** o comportamento em runtime: os 6 arquivos estavam
fora do padrão do `prettier` já em `origin/main` (`prettier --check` reprova os 6 na main), por isso
não rodei `--write` - não haveria como separar reformatação de mudança no diff; e som de alerta
de SLA e notificação de conquista exigem browser com permissão de notificação e áudio.

### Registro - etapas 121 e 122 (2026-11-23) - achado R-05

**121 - verificação, sem mudança de código.** A lista saiu do grep que o próprio
plano indica (`grep -rln "createMut\|createMutation" src/pages/ src/components/`) mais o
`PickupDialog` que ele nomeia. Resultado: **1 formulário de criação desprotegido em 6**, o
`AdminADR`. A hipótese R-05 não cai inteira, mas quase: o padrão `disabled={...isPending}` é
de fato o da casa.

| Tela / formulário                 | Evidência                                                                                           | Protegido? |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ---------- |
| `PickupDialog` (criar coleta)     | `src/components/coletas/PickupDialog.tsx:69` (`loading`) e `:468` (`disabled={loading}`)            | sim        |
| `Envios` (criar entrega)          | `src/pages/Envios.tsx:1117` (`disabled={!form.endereco_entrega \|\| createMut.isPending}`)          | sim        |
| `Clientes` (criar)                | `src/pages/Clientes.tsx:921-924` (+ `:927` com `Loader2`)                                           | sim        |
| `Clientes` (editar)               | `src/pages/Clientes.tsx:948-951`                                                                    | sim        |
| `Fornecedores` (criar)            | `src/pages/Fornecedores.tsx:780-783`                                                                | sim        |
| `Fornecedores` (editar)           | `src/pages/Fornecedores.tsx:806-809`                                                                | sim        |
| `FretesInternos` (criar)          | `src/pages/FretesInternos.tsx:702-703`                                                              | sim        |
| `FretesInternos` (editar)         | `src/pages/FretesInternos.tsx:729-730`                                                              | sim        |
| `Ocorrencias` (criar)             | `src/pages/Ocorrencias.tsx:788` (+ `:775` com `uploading`)                                          | sim        |
| `Ocorrencias` (editar)            | `src/pages/Ocorrencias.tsx:910`                                                                     | sim        |
| **`AdminADR` (criar ADR)**        | `src/pages/AdminADR.tsx:247` — só `disabled={!newAdr.title \|\| !newAdr.decision}`, sem `isPending` | **não**    |
| `Coletas` (excluir)               | `src/components/common/ConfirmDialog.tsx:87` (`disabled={isLoading \|\| !canConfirm}`)              | sim        |
| `Despachos` (despachar/confirmar) | `src/pages/Despachos.tsx:552` e `:604` via `ConfirmDialog`                                          | sim        |

**NÃO VERIFICADO:** o teste de duplo clique no navegador com dado real e a consulta
`select count(*), numero_coleta ... having count(*) > 1` que o plano pede. Não há staging: o teste
criaria registro em produção. O que está acima é leitura de código, com arquivo e linha.
O achado R-05 **não** foi corrigido em `docs/qa/03-ACHADOS.md` porque a hipótese não caiu —
ela ficou parcialmente confirmada (1 tela real).

**122 - fechado o único formulário desprotegido.** `src/pages/AdminADR.tsx:247` passou a
`disabled={!newAdr.title || !newAdr.decision || createMutation.isPending}` e o ícone virou `Loader2`
girando enquanto grava (`:251-255`), igual ao padrão de `src/pages/Envios.tsx:1119-1121`. O caminho de
erro reabilita sozinho: `isPending` do React Query volta a `false` no `onError` (`:86-92`), então o
usuário não fica travado depois de uma falha. Nenhum outro formulário foi tocado.

**Achado novo registrado (não corrigido).** O botão de excluir ADR (`src/pages/AdminADR.tsx:283`,
`onClick={() => deleteMutation.mutate(adr.id)}`) não tem confirmação nem `isPending` — clique
duplo no ícone de lixeira dispara dois deletes. Fora do escopo da 122 (que só cobre formulário de
envio nomeado pela 121); entra em "Próximos passos".

**Verificação**

- `grep -rn "disabled={.*isPending\|disabled={loading"` nos arquivos da tabela → todos os envios com o
  `disabled` ligado ao estado da gravação
- `npx tsc --noEmit` → 0
- `npx eslint src/pages/AdminADR.tsx` → 0 erros, 0 avisos
- `npx vitest run --coverage` → 41 arquivos, 326 testes, cobertura igual à baseline da `main`

### Registro - etapas 115 a 119 (2026-11-23) - achado R-07

**115/116 - Nexus Blast parou de contar sucesso como andamento.** O laço em
`src/pages/CotacaoMultiCanal.tsx` usava um contador único (`completed`) que subia mesmo quando o
`catch` engolia o erro: a barra chegava a 100% e o toast dizia "concluído" com zero cotações
obtidas. Agora `completed` continua alimentando a barra e `succeeded` (`:355`) conta só o que voltou; a
falha é empilhada com transportadora e mensagem (`:361`) e o desfecho virou `success`/`error`/`warning`
sempre dizendo "N de M responderam" (`notificarFimDoBlast`, `:56`, chamada em `:373`). A lista das que
falharam aparece na tela logo depois de `CotacaoResultsTable` (`:959`). Nada foi persistido: a tela não
grava falha no banco (achado C-02). As três ramificações de canal saíram para
`registrarCotacaoPendente`/`cotarOuRegistrar` (`:308`) para o `handleNexusBlast` voltar ao limite de
complexidade cognitiva do lint.

**117/118/119 - Importação em massa parou de condenar 50 linhas por causa de 1.** Em
`src/pages/ImportacaoMassa.tsx` o `if (error)` somava `errorCount += batch.length` e descartava o motivo.
Agora o lote que falha é reprocessado linha a linha (`inserirLoteIndividualmente`, `:147`, chamada em
`:207`), porque o Postgres aborta a instrução inteira na primeira violação — nenhuma
linha do lote entrou, então reprocessar é seguro. O caminho feliz continua um `insert` de 50 e o
`batchSize = 50` não mudou. Cada falha guarda posição e motivo (`:161`), e o motivo é só
o `message` do PostgREST (`motivoDoErro`, `:137`) — nunca o `details`, que carrega os valores da linha
(LGPD); violação de unicidade (`23505`) vira texto legível. O resultado aparece na tela (50
primeiras) com o botão "Baixar CSV das falhas" (`:502`), usando o `exportToCSV` que já existia em
`src/hooks/common/useExport.tsx` — nenhum `Blob` novo foi escrito.

**Achado C-03 (limitação registrada, não corrigida).** O número exibido é a
posição do registro entre os **válidos** enviados, não a linha da planilha.
`ImportResult.success` (`src/lib/csvImporter.ts:8-27`, `src/components/common/CSVImporter.tsx:34-52`) já
descarta as linhas que não passam no zod e não preserva o `row`; como a etapa proíbe tocar nesses
arquivos e proíbe guardar o conteúdo das linhas (LGPD), a linha exata do arquivo só volta se uma
etapa futura propagar `row` até `onImport`. A tela diz isso em texto, para não entregar um
número errado ao usuário.

**Verificação**

- `npx tsc --noEmit` → 0
- `npx eslint src/pages/ImportacaoMassa.tsx src/pages/CotacaoMultiCanal.tsx` → 0 erros, 0 avisos
- `npx prettier --check` nos dois arquivos → limpo
- `npx vitest run --coverage` → 41 arquivos, 326 testes, `71.65 st / 67.41 br / 75.29 fn / 73.67 li`,
  igual à baseline da `main`, sem `ERROR` de threshold
- NÃO VERIFICADO: teste real de importação com planilha de 10 linhas boas + 1 ruim (o plano pede)
  — exige dado em produção e não há staging; a lógica de reprocessamento foi lida
  e tipada, mas não executada contra o banco

### Registro - etapas 104 a 114 (2026-11-23) - achados R-06 e R-02

**Padrão corrigido:** `.catch(() => undefined)` fazia a tela mostrar o contrário do banco. A
varredura de fechamento da etapa 109 (`grep -rn 'catch(() => undefined)' src/`) voltou **vazia** —
não sobrou nenhuma ocorrência no repositório.

**104** — `usePredictionAccuracySettings.ts`: o corpo do `save` foi para um `try/catch` que avisa
(`toast.error("Não foi possível salvar: " + mensagem)`) e **relança**, preservando o contrato — quem
já tratava continua tratando. O `qc.setQueryData` continua só no caminho de sucesso.

**105 a 109** — `PredictionAccuracyTimeline.tsx`: as cinco chamadas viraram `void settings.save(...)`.
Com o aviso saindo de dentro do hook, não há mais erro engolido. Os dois `Switch` seguem controlados
pelo servidor (`settings.data?.notify_email ?? false` e `?? notify_whatsapp`), então a tela continua
fiel ao banco nos dois sentidos — conferido, não alterado. Os campos de e-mail e telefone usam
`defaultValue` e **não** voltam ao valor do servidor quando a gravação falha: fragilidade real,
anotada em "Achados novos", fora do escopo desta etapa.

**110 a 112** — `useRodonavesTracking.tsx`: o `onError` do `syncMutation` tinha corpo vazio
(`// Fail silently or use internal telemetry`) e agora avisa
(`Falha ao sincronizar com Rodonaves: ${err.message}`), com o comentário antigo removido. O
encerramento do `toast.loading` já estava certo nos dois caminhos de `syncAll`, conferido e não
alterado. O `onSuccess` passou a invalidar as duas chaves que a edge function realmente escreve:
`["entregas"]` (`src/pages/Envios.tsx:348`) e `["ocorrencias"]` (`src/pages/Ocorrencias.tsx:134`) —
ambas lidas da fonte, não deduzidas.

**113 e 114** — `useSLAAlerts.tsx`: a mutation `createNotification` não tinha `onSuccess` nem
`onError`. Como ela é disparada por efeito, e não por clique, o aviso foi posto no **lote**
(`Promise.allSettled` + um único `toast.error` quando alguma gravação falha), para não entupir a tela
com um toast por alerta crítico; e o `onSuccess` invalida `["notifications", user?.id]`, a chave
exata do sino (`src/hooks/notifications/useNotifications.tsx:27`), fazendo o alerta aparecer sem
recarregar a página.

**Verificação**

- `npx tsc --noEmit` -> 0 erros
- `npx vitest run --coverage` -> 40 arquivos, All files 71.53 st / 67.34 br / 75.14 fn / 73.58 li, sem `ERROR: Coverage`
- `npx eslint` nos 4 arquivos -> 0 erros, 1 aviso **herdado** (`PredictionAccuracyTimeline.tsx:82`, `react-hooks/set-state-in-effect`; linhas idênticas na `main`)
- `grep -rn 'catch(() => undefined)' src/` -> vazio

### Registro - etapas 078 e 079 (2026-11-23) - achado A-11

**078 - conferida no código, não reimplementada.** A inversão do fallback já estava em
`src/hooks/data/useDocumentUpload.ts:49` desde a PR #303 (`773d0457`), que entrou na `main`
sem marcar a etapa no progresso. Conferido: `if (!signatures[type]) return false;` e o default
de `allowedTypes` (`:19`) cobre exatamente PDF, JPEG, PNG e WEBP — os quatro tipos da tabela
de assinaturas. Nenhum tipo legítimo passou a ser recusado.

**079 - extraída a função pura e testada.** A regra vivia dentro do hook e dependia de
`FileReader`, o que impedia teste isolado. Ficou em `src/lib/fileSignature.ts` (`SIGNATURES` +
`matchesMagicBytes(header, type)`), com o hook importando dela (`useDocumentUpload.ts:3`).
Mesma lógica, sem mudança de comportamento.

**Verificação**

- `npx vitest run src/lib/fileSignature.test.ts` -> 3/3 (PDF válido aceito; PNG com cabeçalho de JPEG recusado; tipo fora da tabela recusado)
- `npx vitest run --coverage` -> 41 arquivos, All files 71.65 st / 67.41 br / 75.29 fn / 73.67 li, sem `ERROR: Coverage`; `fileSignature.ts` 100% nas quatro métricas
- `npx tsc --noEmit` -> 0 erros
- `npx eslint` nos 3 arquivos -> 0 erros, 0 avisos

**Desvio consciente do plano:** a etapa 079 pedia a função pura "no mesmo arquivo". Foi
tentado assim primeiro e reprovou: importar `useDocumentUpload.ts` no teste joga o hook inteiro
no denominador de cobertura (`coverage.all` está desligado) e derruba o global para
68.8 statements / 70.46 lines / 65.59 branches. Mover para `src/lib/` mantém a regra testada
e o ratchet intacto.

### Registro - etapa 059 (2026-11-24)

Cancelar uma logistica reversa era um `DropdownMenuItem` igual aos outros, so com
`text-red-500`: a devolucao do cliente era cancelada por engano em um clique, sem aviso.

Aplicado o desenho de `Despachos.tsx`, que e o padrao da casa para acao irreversivel
em linha de tabela:

- `cancelItem` guarda o item pendente (`src/pages/LogisticaReversa.tsx:72`)
- o item de menu so seleciona (`:659-662`), nao chama mais `updateStatus.mutate`
- `ConfirmDialog` renderizado **fora** do `DropdownMenuContent`, no fim do componente
  (`:663-681`), com `type="danger"` e descricao nomeando o codigo de rastreio reverso
- `isLoading={updateStatus.isPending}` e `onSettled` limpando o estado

Os outros itens do menu (Recebido, Em Transito) seguem sem confirmacao de proposito:
sao transicoes normais, e atrito indiscriminado faz o operador parar de ler.

**Verificacao**

- `npx tsc --noEmit` -> 0 erros
- `npx eslint src/pages/LogisticaReversa.tsx` -> 0 erros, 0 avisos
- `grep` confirma `ConfirmDialog` importado (`:4`) e o menu sem `updateStatus.mutate`
- `git diff --numstat` == `git diff -w --numstat` (23/6, sem churn)

### Registro - etapas 097-098 (2026-11-23) - achado R-01

`src/pages/Despachos.tsx` desestruturava so `data`, `isLoading` e `refetch` do
`useQuery`; o `error` e o `isError` eram descartados, entao a tela nao tinha como saber
que a consulta falhou e caia no bloco `items.length === 0`, exibindo **"Fila Limpa"**
mesmo com a malha quebrada.

- **097** - `isError` e `error` acrescentados a desestruturacao
- **098** - `if (isError)` com `EmptyState variant="error"` e botao "Tentar novamente"
  chamando `refetch()`, colocado antes do `return` principal; o import do `EmptyState`
  foi acrescentado. O "Fila Limpa" continua existindo para fila realmente vazia, que
  segue sendo informacao util. O ternario `isLoading` nao foi tocado.

Feitas juntas, como o plano manda: 097 sozinha deixaria `isError` e `error` declarados e
nao usados, o que o ESLint reprova. A primeira tentativa foi um ternario encadeado
(`isLoading ? ... : isError ? ... : ...`), que gerou um aviso novo de
`sonarjs/no-nested-conditional` (78/86) - por isso a versao final usa if-chain.

**Verificacao**

- `npx tsc --noEmit` -> 0 erros
- `npx eslint src/pages/Despachos.tsx` -> 0 erros, 0 avisos
- `npm run lint:budget` -> 77/86 avisos (sem aviso novo)
- `npx vitest run src/pages/ src/lib/` -> 239 testes passando
- Diff: 18 linhas em um arquivo, nenhuma linha de churn

### Registro - etapas 099-103 (2026-11-23) - achado R-01

As cinco telas ja tinham um bloco `if (error)`, mas todas com o mesmo desenho ruim:
um `AlertCircle` solto e `<p className="text-destructive">Erro: {error.message}</p>`, sem
contexto e **sem botao de tentar de novo**. Quem batia em erro so podia recarregar a
pagina inteira, o que perde filtro e estado da tela.

Trocado pelo desenho de `Coletas.tsx:288-303`: `EmptyState variant="error"` com titulo
especifico de cada tela e `action={{ label: "Tentar novamente", onClick: () => refetch() }}`.

| Etapa | Tela           | Titulo                           | `refetch`    |
| ----- | -------------- | -------------------------------- | ------------ |
| 099   | Envios         | Erro ao carregar entregas        | ja existia   |
| 100   | Clientes       | Erro ao carregar clientes        | acrescentado |
| 101   | Fornecedores   | Erro ao carregar fornecedores    | acrescentado |
| 102   | FretesInternos | Erro ao carregar fretes internos | acrescentado |
| 103   | Ocorrencias    | Erro ao carregar ocorrencias     | acrescentado |

Quatro das cinco nao desestruturavam `refetch`, que e o que o botao precisa - por isso o
botao nao podia ter sido ligado antes. O `AlertCircle` ficou orfao em quatro arquivos
assim que o paragrafo saiu; removido do import do `lucide-react` para nao gastar o
orcamento de avisos. Em `Ocorrencias` o icone continua em uso na lista de tipos de
ocorrencia, entao o import ficou.

Nada de `window.location.reload()` no botao, como o plano alerta: recarrega a aplicacao
inteira e esconde que a falha era de uma consulta so.

**Verificacao**

- `npx tsc --noEmit` -> 0 erros
- `npx eslint <as cinco>` -> 0 erros, 6 avisos (exatamente o baseline da main)
- `npm run lint:budget` -> 77/86
- `grep 'text-destructive">Erro'` nas cinco telas -> 0. Os 22 restantes estao em
  `src/features/db-observability/` e no `ErrorBoundary`, contexto diferente, fora do escopo
- Diff: 59 insercoes, 19 remocoes, sem churn (`--numstat` igual a `-w --numstat`)

### Registro - etapas 062-067 (2026-11-23) - edicao e exclusao de coleta

Estas seis etapas vieram implementadas de sessao anterior e ficaram sem marcacao. Conferi
cada uma contra o codigo real antes de marcar, em vez de confiar no registro:

| Etapa | Onde esta a prova                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 062   | `Coletas.tsx:853-866` - botao `Pencil` no cartao com `e.stopPropagation()`, `setSelectedPickup(c)` e `setIsDialogOpen(true)`                           |
| 063   | `Coletas.tsx:951-955` - `onEdit` no `PickupDetailsDialog` fechando detalhes antes de abrir edicao                                                      |
| 064   | `PickupDialog.tsx:102-103` - `setIsReverse`/`setIsUrgent` dentro do `useEffect`, e `:119-120` zerando no ramo de criacao                               |
| 065   | `Coletas.tsx:122-136` - `deleteColetaMut` com `.update({ deleted_at })`, nunca `.delete()`                                                             |
| 066   | `Coletas.tsx:867-879` (botao `Trash2` com `stopPropagation`) e `:925-937` (`ConfirmDialog` com `isLoading`)                                            |
| 067   | `Coletas.tsx:159` - `.is("deleted_at", null)` na consulta da lista; a exportacao CSV de `:364` usa o array `coletas` ja filtrado, nao consulta de novo |

**Ponto verificado na 067:** `PickupConference.tsx:73` faz `.update()`, nao `.select()`, e
`PickupDetailsDialog.tsx:115` idem - nenhum dos dois lista coletas, entao nao precisam do
filtro. As consultas a `coletas` fora deste escopo (`Relatorios`, `PainelSLA`,
`DashboardExecutivo`, `RastreamentoMotorista`, `Ocorrencias`, `Fornecedores` e os hooks de
analytics) tem filtro proprio em 15 dos casos; as que faltam sao do achado D-02 e ficam
registradas para a etapa do proprio achado, como o plano manda - nao mexi em hook
compartilhado aqui.

Nenhuma alteracao de codigo nesta rodada: as seis ja estavam na `main`.

### Registro - etapas 001, 003, 004, 005, 007, 012 e 013 (2026-11-23) - onda 1 de seguranca

Sete etapas da onda 1 de seguranca ja estavam implementadas e sem marcacao. Conferi uma a
uma contra o codigo antes de marcar:

| Etapa | Prova no codigo                                                                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001   | `nexus-webhook-receiver/index.ts:36-37` - o HMAC e sempre exigido e `verifyWebhookHmac` devolve `false` quando o segredo nao existe (fail-closed). Nao ha condicional desligando a verificacao |
| 003   | `_shared/auth.ts:69` - `export async function requireRole(`                                                                                                                                    |
| 004   | `webhook-status/index.ts:29-31` - aceita `x-internal-secret` ou papel `admin`, e recusa o resto                                                                                                |
| 005   | `webhook-status/index.ts:184-185` - o dispatch consulta `client_webhooks` filtrando por `created_by` do chamador quando ele e usuario; `:161` grava `user_id` em auditoria                     |
| 007   | `evolution-whatsapp/index.ts:118` - `user_id: auth.claims.sub` na mensagem enviada                                                                                                             |
| 012   | `health/index.ts:22` - usa `anon_key` de proposito, porque `health` e publica (`verify_jwt=false`); nao expoe `service_role`                                                                   |
| 013   | `health-check/index.ts:32` - checa o Auth por `/auth/v1/health`, nao pela API administrativa de usuarios                                                                                       |

**Observacao da 005:** quando o chamador e interno (`x-internal-secret`), `callerSub` e
`undefined` e a consulta nao filtra por dono - o que e o comportamento correto para o
disparo feito pelo proprio banco, que precisa alcancar os webhooks de todos os clientes.
O filtro existe para a leitura feita por usuario.

Nenhuma alteracao de codigo nesta rodada: as sete ja estavam na `main`.

### Registro - etapas 049-053 (2026-11-23) - exclusao em massa pede confirmacao

049, 050 e 053 ja estavam na `main`. Faltava ligar o que ja existia:

**051 (implementada agora).** `ConfirmDialog` ja tinha a prop `requireTyping`, mas o
`BulkActions` nao repassava e nenhuma tela pedia digitacao. Acrescentei o campo
`confirmTyping` a interface `BulkAction` e a passagem `requireTyping={pendingAction?.confirmTyping}`
no dialogo. Clientes e Fornecedores passam a exigir digitar **EXCLUIR** para liberar a
exclusao em massa - sao os dois cadastros que apagam de verdade. FretesInternos ficou de
fora de proposito: ali a acao e "cancelar", nao apagar.

Efeito no negocio: um "sim/nao" distraido nao mais apaga uma carteira inteira de clientes.

**052 (implementada agora).** Novo `src/components/common/BulkActions.test.tsx`, sem
dependencia nova - `@testing-library/user-event` nao esta instalado e o AGENTS.md so
permite dependencia nova se indispensavel, entao o teste usa `fireEvent` da
`@testing-library/react`, que ja esta na base.

Tres casos: acao destrutiva nao executa ao clicar (so abre a confirmacao); o confirmar
fica bloqueado ate a palavra ser digitada; acao nao destrutiva executa direto.

**O teste prova a regressao:** com o `BulkActions.tsx` da `main` (sem o repasse do
`requireTyping`) o caso do bloqueio falha - 1 falha de 3. Com a mudanca, 3 de 3 passam.

**Verificacao**

- `npx tsc --noEmit` -> 0 erros
- `npx eslint <os quatro arquivos>` -> 0 erros, 4 avisos (baseline)
- `npm run lint:budget` -> 77/86
- `npx vitest run src/components/common/BulkActions.test.tsx` -> 3 testes
- Diff: 8 linhas em tres arquivos existentes, mais um arquivo de teste novo

### Registro - etapas 015 e 054 (2026-11-24)

**015 - `.env` fora do controle de versao.** Ja estava correto: `git ls-files` lista
apenas `.env.example`; `.env`, `.env.local` e `.env.*.local` estao no `.gitignore`.
Nenhum arquivo alterado, historico nao reescrito.

**054 - filtro `deleted_at` nas leituras de `transportadoras`.** Auditado consulta por
consulta, nao por contagem de linha. Todas as leituras filtram:

| Arquivo                   | Onde       |
| ------------------------- | ---------- |
| `Transportadoras.tsx`     | `:206-208` |
| `ConfiguracoesFrete.tsx`  | `:171-173` |
| `ExportacaoDados.tsx`     | `:86-88`   |
| `Envios.tsx`              | `:386-388` |
| `usePrefetch.ts`          | `:60-62`   |
| `useDashboardMetrics.tsx` | `:331-335` |
| `useExecutiveMetrics.tsx` | `:111-113` |
| `useGlobalSearch.tsx`     | `:129-131` |
| `PickupDialog.tsx`        | `:132-134` |

As consultas sem o filtro sao `.insert()` e `.update()` (`Transportadoras.tsx:269`,
`:303`, `:337`, `:366`; `ConfiguracoesFrete.tsx:187`) - ali o filtro nao se aplica,
porque escrever precisa achar o registro pelo `id`, inclusive para desfaze-lo.

Nenhuma alteracao de codigo: as duas etapas ja estavam atendidas.

Uma linha por etapa concluída. A coluna **Evidência** é o que diferencia etapa concluída de etapa
"deveria funcionar": cole o comando e o resultado, ou a consulta e o retorno.

| Etapa | PR  | Mergeada? | Deploy confirmado? | Evidência da verificação |
| ----- | --- | --------- | ------------------ | ------------------------ |
|       |     |           |                    |                          |


### Registro - ondas 1 e 6: DDL aplicada, tipos sincronizados e censo de índices (2026-11-24)

Banco consultado ao vivo pelo Management API do Supabase, ref **jvfhclubfpxrtrrazrgr**, em 2026-11-24.

**055/056 - `fretes_internos.deleted_at`.** A migration `20261124130000_fretes_internos_deleted_at.sql`
foi aplicada pelo `aplicar-migration.yml` (run `45405557509`, `success`) e conferida no banco:

```
information_schema.columns -> column_name=deleted_at, data_type=timestamp with time zone, is_nullable=YES
supabase_migrations.schema_migrations -> 20261124130000_fretes_internos_deleted_at.sql
```

O `types-sync` rodou no mesmo push e abriu a **#426** com `deleted_at: string | null` no bloco
`fretes_internos` de `src/integrations/supabase/types.ts`, mais `supabase/schema-catalog.json` e
`schema-manifest.json`; mergeada em `fb0f0ef1`. O `types.ts` nunca foi editado a mao.

**057 - exclusao logica em `FretesInternos`.** #427, mergeada em `b721b85d`. O `.delete()` de
`:254-258` virou `.update({ deleted_at })`; o filtro `.is("deleted_at", null)` entrou na lista da tela,
no editar, no mudar-status, no bulk e nas tres leituras externas (`useDrillDown.tsx`,
`ExportacaoDados.tsx`, `Relatorios.tsx`). RLS conferido: o UPDATE de `fretes_internos` ja era
`has_role(uid,'admin')`, o mesmo gate do DELETE substituido, entao nenhuma permissao nova foi aberta.

**264 - contexto de banco publicado.** O job `banco` do `contexto-ia.yml` nao rodava porque o DSN era
lido de `secrets.SUPABASE_DB_URL`, que nao existe; o DSN real esta em `secrets.DESTINO_URL` do
environment `banco-leitura` (#425). Prova nesta sessao: `workflow_dispatch` (run `45405526573`,
`success`) e

```
git ls-tree -r --name-only origin/contexto docs/contexto/supabase/ | wc -l  ->  553
```

Antes eram **0** arquivos: a branch `contexto` publicava codigo e regras, nunca o schema do banco.

#### Etapa 228 - censo dos indices reais (saida de `pg_indexes`, resumida)

| Tabela | Indices hoje | Observacao que muda o plano |
| --- | --- | --- |
| `entregas` | 20 | ja existem `idx_entregas_previsao_active (previsao_entrega) WHERE status NOT IN ('entregue','finalizado') AND deleted_at IS NULL` e `idx_entregas_active (created_at DESC) WHERE deleted_at IS NULL` |
| `coletas` | 14 | `idx_coletas_status_data (status, data_prevista_coleta DESC)` ja cobre o Painel SLA de coletas |
| `telemetry_logs` | 5 | `severity` e `created_at` separados, sem composto; 394 linhas, 712 kB |

**Tamanho das tabelas** (`pg_stat_user_tables`): `entregas` **0 linhas** (heap 0 bytes), `coletas`
**0 linhas**, `telemetry_logs` 394 linhas/520 kB, `query_telemetry` 0 linhas. Nao ha staging: e o banco de
producao, e ele esta vazio de entregas e coletas hoje.

#### Etapa 229 - `EXPLAIN (ANALYZE, BUFFERS)` das consultas reais

| Consulta | Plano medido | Tempo |
| --- | --- | --- |
| Painel SLA (entregas) | `Seq Scan` + `Sort` | **0,123 ms** |
| Painel SLA (coletas) | `Seq Scan` + `Sort` | **0,103 ms** |
| Kanban de entregas | `Seq Scan` + `Sort` | **0,117 ms** |
| `telemetry_logs WHERE severity='error'` | `Index Scan using idx_telemetry_logs_severity` + `Sort` | **0,701 ms** |

O `Seq Scan` nao e o defeito que P-05 descreveu: e o planejador descartando indice em tabela de **0
linhas**. Num banco assim, nenhum dos tres indices das etapas 230-232 tem ganho medivel - e o proprio plano
diz que a medicao e o criterio.

#### Veredito por etapa (o criterio do plano, aplicado)

| Etapa | Veredito | Por que |
| --- | --- | --- |
| 230 | **nao criar** | `idx_entregas_previsao_active` ja entrega o `ORDER BY previsao_entrega` sem `Sort` para o mesmo filtro: e melhor que o `(status, previsao_entrega)` proposto, que ainda exigiria `Sort` |
| 231 | **nao criar** | `idx_entregas_active (created_at DESC) WHERE deleted_at IS NULL` ja cobre a ordenacao do Kanban; o parcial proposto so acrescenta o predicado de status, e o ganho nao e medivel com 0 linhas |
| 232 | **medido, nao compensa** | 0,701 ms com 394 linhas; `telemetry_logs` e tabela de escrita intensa e o teto das telas e 100/500 - o custo de escrita supera o ganho |
| 233 | **medido, nao compensa** | `idx_entregas_transportadora_id` ja e o indice mais usado de `entregas` (343 `idx_scan`), e o drill-down tem teto 100 |

Reavaliar 230/231/233 quando `entregas` e `coletas` passarem de ~50 mil linhas: a decisao de hoje e sobre o
banco de hoje, e o numero que muda a resposta e a contagem de linhas.

#### Etapa 234 - censo dos cinco candidatos a duplicado

| # | Tabela (coluna) | Existe hoje | `idx_scan` | Constraint? | Fica |
| --- | --- | --- | --- | --- | --- |
| 1 | `rastreamento_historico (lalamove_order_id)` | **so um** (`idx_rastreamento_lalamove_order`) | - | - | nada a fazer: o duplicado ja foi removido em `20260831130000` |
| 2 | `rastreamento_historico (coleta_id)` | **so um** (`idx_rastreamento_historico_coleta_id`) | - | FK aponta para `coletas_pkey` | nada a fazer: idem |
| 3 | `entregas (transportadora_id)` | os dois: `idx_entregas_transportadora` (parcial) e `idx_entregas_transportadora_id` | **0** x **343** | nao | sai o parcial - #428 |
| 4 | `coletas (transportadora_id)` | os dois: `idx_coletas_transportadora` (parcial) e `idx_coletas_transportadora_id` | 0 x 0 | nao | sai o parcial - #428 |
| 5 | `audit_logs (table_name, record_id)` | `idx_audit_logs_table_record` **nao existe**; `idx_audit_logs_record_id_table` e prefixo de `idx_audit_logs_record_composite` | 2 x 0 | nao | sai o prefixo - #428 |

`AuditTrail.tsx:30` ordena por `created_at` sem filtrar por `record_id` nem `table_name`; as buscas do par
sao atendidas pelo composto `(record_id, table_name, created_at DESC)`, que e o que sustenta a decisao da 239.
Os tres `DROP` estao na **#428**, aberta: sao DDL em producao e aguardam o dono.

---

## Resumo do andamento

Atualize ao fim de cada sessão de trabalho.

|                         | Quantidade |
| ----------------------- | ---------- |
| Concluídas `[x]`        | 252         |
| Aguardando o dono `[~]` | 46         |
| Bloqueadas `[!]`        | 0          |
| Não iniciadas `[ ]`     | 2          |
| **Total**               | **300**    |

**Última etapa trabalhada:** 142 · **Data:** 2026-11-25 · **Próxima etapa independente:** 018 (teste automático de `.env` na CI, PR #438 aberta) e 266 (snapshot do banco sem saída verde em silêncio)
automático da política de exclusão lógica; a 057 já entrou). A **027** (`logistica_reversa.codigo_rastreio_reverso`
sem `UNIQUE`) segue como DDL dependente do dono, e a **#428** espera o ok para os três `DROP INDEX`.

### Registro - etapas 068-096 (2026-11-23)

**068/069/077/082** - ja estavam feitas na `main` antes desta sessao. Evidencia: `grep -rn
"useSelfHealing|useNexusSimulator|uploadDocument|service-wrapper" src/ supabase/functions/`
nao retorna nenhuma ocorrencia em codigo (so mencoes em `docs/qa/`).

**083** - ja estava na `main` no commit base `d37ba30`: `cbRef` em `useRealtime.tsx:99-101`
com `useEffect` sem array de dependencias, `handleChange` lendo `cbRef.current` com deps
`[queryClient, table, debouncedInvalidate]`, e o `eslint-disable` que existia na linha 157
removido.

**084-095** - 11 arquivos, 12 chamadas de `useRealtime` corrigidas:

| Etapa | Arquivo                                     | Mudanca                                                                                                                                       |
| ----- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 084   | `src/pages/Envios.tsx`                      | `onEntregaRealtime` em `useCallback`                                                                                                          |
| 085   | `src/pages/KanbanEntregas.tsx`              | `onEntregaKanban` em `useCallback`                                                                                                            |
| 086   | `src/pages/Index.tsx`                       | `DASHBOARD_ENTREGAS_QUERY_KEY` constante de modulo                                                                                            |
| 087   | `src/pages/Index.tsx`                       | `DASHBOARD_COLETAS_QUERY_KEY` constante de modulo                                                                                             |
| 088   | `src/pages/Coletas.tsx`                     | `COLETAS_QUERY_KEY` constante de modulo                                                                                                       |
| 089   | `src/components/audit/AuditTrailViewer.tsx` | `onAuditLogInsert` em `useCallback`                                                                                                           |
| 090   | `src/pages/RastreamentoMotorista.tsx`       | `onColetaTracking` em `useCallback`                                                                                                           |
| 091   | `src/pages/Ranking.tsx`                     | `onLevelChange` em `useCallback`                                                                                                              |
| 092   | `src/pages/SLADashboard.tsx`                | `onEntregaChange` em `useCallback`                                                                                                            |
| 093   | `src/pages/Notificacoes.tsx`                | `onNotificationChange` em `useCallback`                                                                                                       |
| 094   | `src/pages/Despachos.tsx`                   | `onEntregaNova` e `onEntregaAtualizada` separados; o som (`playNotification`) fica no de insert, para nao tocar duas vezes se o canal reabrir |
| 095   | `src/pages/CustosDashboard.tsx`             | `handleRefetch` era arrow recriada a cada render; virou `useCallback` com deps `[startDate, endDate]`                                         |

**096** - bloco `CONTRATO DE ESTABILIDADE:` acima de `export function useRealtime`
explicando que o hook absorve a instabilidade via `cbRef`, mas o chamador paga render extra
e o `queryKey` literal nunca casa por identidade. Varredura: 14 chamadores de `useRealtime(`
em `src/` - os 12 acima mais 2 em `src/hooks/logistics/useUnifiedTracking.tsx:194,199` que ja
eram corretos e servem de exemplo no comentario. Nenhum arrow inline restante.

**Verificacao executada**

- `npm run typecheck` -> 0 erros
- `npm run lint:budget` -> 77/86 avisos (a main estava em 86/86: estas etapas liberaram 9 de margem), 0 erros
- `npx vitest run src/hooks/ src/pages/ src/lib/` -> 261 testes passando
- `git diff -w --stat` conferido arquivo por arquivo: nenhuma linha de churn cosmetico

**Achado novo (nao corrigido - fora do escopo destas etapas)**
`useMultiTableRealtime` (mesmo arquivo, a partir de `useRealtime.tsx:222`) ainda tem
`eslint-disable` nas dependencias do efeito e dispara o aviso `refs during render` na
linha 234. A etapa 083 proibe tocar nele; fica registrado para etapa futura.

---

### Registro - etapas 281 e 282 (2026-11-24) - testes de criar coleta e de mover status

**281 - criar coleta.** O plano (`04-PLANO.md:11341`) supunha um *hook* de coletas; ele nao existe: a
escrita mora no dialogo, `src/components/coletas/PickupDialog.tsx:162`
(`supabase.from("coletas").insert(...)`). Caminho real conferido por leitura antes de escrever o teste.

Criado `src/components/coletas/PickupDialog.test.tsx` (7 casos):

| Caso                            | O que prova                                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada valida                  | 1 insert com `numero_coleta`, `endereco_coleta`, `status: "aguardando_liberacao"`, `qtd_volumes: 0`, flags em `false`, toast "Protocolo Injetado" e `onSuccess`    |
| Campo obrigatorio vazio         | 0 insert, 0 toast, 0 `onSuccess` - a validacao segura a escrita                                                                                                    |
| Erro do banco (`permission denied`) | toast `variant: "destructive"` com o motivo do banco e o dialogo permanece aberto                                                                              |
| Duplo envio (3 cliques)         | 1 insert (R-05)                                                                                                                                                    |
| Reversa + Urgente               | `is_reverse` e `is_urgent` em `true` no payload, `observacoes` prefixado com `[LOGISTICA_REVERSA]`                                                                 |
| Inbound depois de Reversa       | `is_reverse: false` no payload                                                                                                                                     |
| CANCELAR_LOG                    | avisa o pai para fechar e nao escreve nada                                                                                                                         |

**282 - mover entrega de status.** `count: "exact"` ja estava nas duas telas: `Despachos.tsx:223` e `:284`,
`KanbanEntregas.tsx:328` - etapas 044-048 cumpridas. As mutacoes seguem **separadas por tela** (nao ha hook
comum): o plano mandava registrar isso em vez de duplicar teste - registrado.

Criado `src/pages/Despachos.test.tsx` (12 casos), renderizando a pagina com o `supabase` dublado.

A mutacao:

| Caso                               | O que prova                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transicao permitida com `count: 1` | 1 update com `{ status: "cotacao_frete" }` e `{ count: "exact" }`, `onStatusChange` avisado, toast "Movido para ..." e a fila recarregada (2 leituras)        |
| Sem destino unico (`despachado`)   | nao existe botao PROSSEGUIR e nenhum update sai                                                                                                             |
| `count: 0`                         | recusa com a mensagem de registro alterado por outro usuario, **sem** toast de sucesso, **sem** `onStatusChange` e **sem** gravar `kanban_history`            |
| Erro do banco                      | a mutacao rejeita e o motivo do banco chega ao usuario                                                                                                      |

A tela em volta (segundo bloco): Sincronizar recarrega a fila; evento de tempo real de insert toca o aviso e
recarrega, o de update recarrega sem tocar som; clique no cartao abre os detalhes (som de navegacao) e o
aviso de status recarrega; cartao mostra box e tags; erro de leitura mostra o estado de erro e "Tentar
novamente" refaz a consulta.

O despacho final (terceiro bloco) e a unica saida que passa por confirmacao na tela: `nf_emitida` tem
`despachado` como destino unico (`src/lib/statusTransitions.ts:16`), e `moveToNext` (`:268`) chama
`setConfirmItem(item)` em vez de mover direto.

| Caso                                  | O que prova                                                                                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NF de simples remessa ausente         | toast "NF de Simples Remessa obrigatoria", nenhum update e o dialogo de confirmacao nao abre                                                                |
| Confirmacao autorizada                | o dialogo abre com o item, so o "autorizar" dispara a escrita: 1 update com `status: "despachado"` e `{ count: "exact" }`, `onStatusChange`, `kanban_history` (from `nf_emitida` -> `despachado`, notes "Despacho final autorizado"), toast de sucesso e fila recarregada |
| Confirmacao com `count: 0`            | recusa com a mensagem de registro alterado por outro usuario e nenhum toast de sucesso                                                                      |

O caso `count: 0` cobre a mesma trava que a etapa 277 pede em nivel de hook, so que pela tela; **277 segue
aberta** porque o Kanban nao foi exercitado.

**Por que existem os segundos blocos (cobertura).** Importar `Despachos.tsx` e `PickupDialog.tsx` coloca os
dois no denominador da cobertura global (`vitest.config.ts`, piso de 73% em funcoes):

| Momento                                           | Funcoes |
| ------------------------------------------------- | ------- |
| Sem os dois arquivos (base da `main`)             | 73.40%  |
| So com os 8 testes de mutacao/criacao             | 71.75%  |
| Com os caminhos de tela cobertos (16 testes)      | 73.84%  |
| Com o despacho final coberto (19 testes)          | 74.43%  |

A segunda linha foi o que reprovou `Unit & Integration Tests` e `quality-gate` na primeira rodada da PR. O
piso nao foi mexido: o que subiu foi a cobertura real de `Despachos.tsx` (18/31 -> 31/31 funcoes) e de
`PickupDialog.tsx` (4/14 -> 10/14).

**Verificacao executada**

- `npx vitest run src/pages/Despachos.test.tsx src/components/coletas/PickupDialog.test.tsx` -> 2 arquivos, 19 testes, 0 falhas
- `npm run test:coverage` -> `All files 76.21 li / 70.19 br / 74.43 fn / 78.25 st`, exit 0 (100 arquivos, 0 falhas);
  `Despachos.tsx` em 92.38 li / 75.71 br / 100 fn / 100 st, `PickupDialog.tsx` em 75.4 li / 66.17 br / 57.14 fn / 74.13 st
- `npm run typecheck` -> 0 erros
- `npx eslint src/pages/Despachos.test.tsx src/components/coletas/PickupDialog.test.tsx` -> 0 problemas

**Nao verificado.** Nenhuma chamada real ao Supabase: os dois testes rodam contra dublo. O `count: 0` de
verdade depende do gatilho de versao no banco.

**Achados (vão para `03-ACHADOS.md` na etapa 297, nenhum corrigido aqui - fora do escopo).**

1. As mutacoes de status estao duplicadas por tela (`Despachos.tsx` e `KanbanEntregas.tsx`), sem hook comum:
   qualquer regra nova de transicao precisa ser aplicada duas vezes.
2. `moveToNext` (`Despachos.tsx:256-274`) mistura tres desfechos no mesmo handler: muda direto quando ha destino
   unico, abre confirmacao quando o destino e `despachado`, e recusa por toast quando falta `nf_remessa`. Os tres
   estao cobertos aqui. Mas a trava de NF e a confirmacao existem **so nessa tela**: `KanbanEntregas.tsx` nao
   menciona `nf_remessa` fora da lista de colunas lidas (`:71`) e do select (`:279`), e nao importa
   `ConfirmDialog` - mover para `despachado` pelo Kanban (`:328`) nao exige NF de simples remessa nem pede
   autorizacao. Divergencia entre as duas telas, para decisao do dono (etapa 283/297).
3. O despacho final pede "esta acao e irreversivel" no texto, mas o status `despachado` ainda aceita
   `em_transito` (`statusTransitions.ts:17`): o texto do dialogo promete mais do que o banco garante.

## O que sobrou (etapa 298) - medido em 2026-11-24, `main` em `c7fc18ae`

Travessia de 001 a 300 contra este arquivo: **219 concluidas**, **61 parciais**, **20 nao iniciadas**
(219 + 61 + 20 = 300; nenhuma etapa sem marca). Achado por achado, o estado final esta em `03-ACHADOS.md`
(35 resolvidos / 15 parciais / 15 abertos).

### Esperando o dono (61 etapas `[~]`)

| Assunto                                                      | Etapas                                                                                                                              | O que trava                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Banco: DDL, RLS, unicidade e indices                         | 024, 025, 027-033, 037, 055, 056, 058, 222, 228, 229, 234, 240, 263, 265, 266, 290, 295                                              | nada disso roda sem sua autorizacao (regra 8)                                  |
| Segredo e ambiente de producao                               | 002, 010, 011, 014, 019, 270, 285, 286                                                                                                | confirmar o estado do segredo, ou remover o que ficou obsoleto                 |
| Decisao de negocio (o que existe e o que morre)               | 006, 008, 009, 016, 017, 018, 039, 041, 043, 060, 070-076, 120, 142, 211, 248, 255, 257, 272, 273, 274, 283, 288                       | escolher entre corrigir, remover ou aceitar                                    |
| Fechamento do proprio plano                                  | 284, 299                                                                                                                              | pisos de cobertura e bateria final de gates: os dois mexem em gate de CI       |

### Aberta por falta de acesso ao banco (13)

023, 026, 230, 231, 232, 233, 235, 236, 237, 238, 239, 264, 287 - todas exigem consulta ao banco ao vivo para
decidir (RLS real, unicidade, uso de indice, existencia de tabela). Nenhuma e codigo pronto esperando merge.

### Nao executada (7)

- **057, 061** - dependem da decisao de 056 e 060 (exclusao logica de `fretes_internos` e o registro unico de
  SQL avulso).
- **218** - a variante da RPC so faz sentido depois de decidir o destino da `reconcile_pending_freights` (070).
- **264, 265** - bloqueadas pelo secret `SUPABASE_DB_URL` (263).
- **275** - base de teste de hook e de tela: a unica etapa de codigo que ainda nao comecou.
- **277** - teste do `count` fora da tela: a versao de tela esta coberta desde a 282, falta a de hook.
- **289, 296** - mostrar as falhas de webhook numa tela e regerar a branch `contexto`; as duas dependem das
  tabelas do banco que ninguem conseguiu confirmar (287) e do snapshot (263).

### PRs abertas (2, nenhuma mergeavel sem voce)

| PR                                                    | Assunto                                                              | Por que espera                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| [#398](https://github.com/adm01-debug/Loggi_Flow_V2/pull/398) | guard de CI para consulta de listagem sem teto (etapa 211)           | mexe em workflow (regra 8)                        |

---

### Registro - etapas 297, 298 e 300 (2026-11-24) - fechamento da documentacao do QA

**297 - estado final de cada achado.** Nao reescrevi nenhum achado: cada um dos 65 blocos de
`03-ACHADOS.md` ganhou uma unica linha `**Estado (2026-11-24):**` logo depois do `-> Etapas`, e o topo do
arquivo ganhou o bloco de fechamento (data, commit da `main`, banco e a contagem). A classificacao nao veio
da memoria: um script cruzou o campo `-> Etapas NNN` de cada achado com as marcas de `05-PROGRESSO.md` -
`RESOLVIDO` somente quando **todas** as etapas do achado estao `[x]`.

| Resultado | Achados | IDs |
| --- | --- | --- |
| RESOLVIDO | 35 | S-02, F-01, C-03, D-01, D-03, A-07, A-11, A-12, A-13, R-01 a R-06 (exceto R-07), R-08, R-09, B-01, B-03 a B-10, P-02, P-03, H-01, H-05, H-06, H-07, H-08, H-10, H-15 |
| PARCIAL | 15 | S-01, S-03, S-06, S-07, C-02, D-02, A-08, R-07, B-02, P-01, P-04, H-02, H-03, H-04, H-12 |
| ABERTO | 15 | S-04, S-05, S-08, F-02, F-03, C-01, D-04, A-09, A-10, P-05, P-06, H-09, H-11, H-13, H-14 |

Verificacao da etapa (esperado: os dois numeros iguais): `grep -c '^## [A-Z]-[0-9]'` = **65** e
`grep -c '^\*\*Estado ('` = **65**. Nenhum achado ficou sem fechamento e nenhum recebeu dois.

Tambem consolidei a secao "Achados novos": A-06, A-07 e A-08 entraram na tabela (achados das etapas 281/282)
e um paragrafo novo diz quais dos oito seguem abertos e em que ordem de dano.

**298 - o que sobrou.** Secao nova no fim deste arquivo, com as tres listas que o plano pede (esperando o
dono, aberta por falta de acesso, nao executada) e as 2 PRs abertas agrupadas por assunto. A travessia
001-300 fechou **219 + 61 + 20**. Nenhuma PR foi mergeada nesta etapa e nenhum codigo foi tocado.

**300 - relatorio de uma pagina.** `docs/qa/06-RELATORIO-FINAL.md`, datado, com o commit da `main` e o nome
do banco no alto.

**Verificacao executada**

- `grep -c '^## [A-Z]-[0-9]' docs/qa/03-ACHADOS.md` -> 65; `grep -c '^\*\*Estado (' docs/qa/03-ACHADOS.md` -> 65
- `grep -c '^- [x]' docs/qa/05-PROGRESSO.md` -> 219; `- [ ]` -> 20; `- [~]` -> 61
- `wc -l docs/qa/06-RELATORIO-FINAL.md` -> dentro da faixa de uma pagina
- `grep -n 'jvfhclubfpxrtrrazrgr' docs/qa/06-RELATORIO-FINAL.md` -> presente

**Nao verificado.** Nenhuma das 13 etapas que dependem do banco ao vivo foi executada: o estado delas e
"aberta por falta de acesso", nao "correta". Nada aqui foi validado contra producao.

---

### Registro - etapas 062 e 063 (2026-11-24) - ja estavam na main

As duas estavam implementadas e nao marcadas. A marcacao faltando fazia o caminho
parecer trabalho perdido de outro agente.

**062 - abrir a edicao pelo cartao.** `src/pages/Coletas.tsx:851-864`: botao `Pencil`
com `e.stopPropagation()` (necessario, porque o `onClick` do `Card` em `:752-756` abre
os detalhes), chamando `setSelectedPickup(c)` e depois `setIsDialogOpen(true)`. O
`<PickupDialog>` em `:938-943` ja recebia `pickup={selectedPickup}` - essa linha nao
faltava. O `onClick` do cartao continua abrindo **detalhes**, como a etapa exige: as
duas portas existem.

**063 - editar de dentro dos detalhes.** `src/pages/Coletas.tsx:951-955`: o
`PickupDetailsDialog` recebe `onEdit`, que fecha os detalhes, seleciona o item e abre o
dialogo de edicao.

Nenhuma alteracao de codigo nas duas.

**Verificacao**
- `grep -n 'setSelectedPickup(c)' -A2 src/pages/Coletas.tsx` -> os tres pontos
  (`:754` detalhes, `:860` edicao, `:953` onEdit) chamam `setSelectedPickup` antes de
  abrir o dialogo correspondente
- `grep -n 'pickup={selectedPickup}' src/pages/Coletas.tsx` -> `:942` (PickupDialog) e
  `:948` (PickupDetailsDialog)

### Registro - etapa 061 (2026-11-24)

Depois da 060 os dois SQL historicos estao no lugar certo, mas a informacao de **o que foi
aplicado, quando e em qual projeto** continuava dispersa entre o cabecalho de cada arquivo,
uma linha de `banco.md` e uma de `scripts/audit/README.md`. Sem um lugar unico, um agente
encontra "remediacao" e conclui que e pendente.

Acrescentada a `docs/agentes/banco.md` - o documento que o `AGENTS.md` manda ler antes de
qualquer SQL, migration ou deploy - uma secao "SQL avulso ja aplicado", com tabela de
caminho, data, projeto e situacao, mais a frase que fecha a duvida para o futuro: DDL novo
vai para `supabase/migrations/`, nunca como script avulso.

Nao foi criado documento novo de proposito: o repositorio ja tem documentacao que contradiz
documentacao, e a informacao tem de entrar onde o protocolo ja obriga a olhar.

As linhas de `banco.md:32-41` sobre os projetos que nao sao o destino ficaram intactas - sao
a protecao contra escrever no banco errado.

**Verificacao**
- `node scripts/ci/check-claude-md-integrity.mjs` -> exit 0
- `grep -n 'historico/\|nao reexecutar' -i docs/agentes/banco.md` -> os dois arquivos listados
  (`:50-51`) com data, projeto e marca de nao reexecutar

### Registro - etapa 060 (2026-11-24) - implementada e mergeada (#340)

Dois `.sql` pontuais de agosto/2026 estavam soltos na raiz de `scripts/`, entre
utilitarios que sao para rodar. Alteram banco, nao tem runner, e o aviso de
"HISTORICO - NAO REEXECUTAR" so aparecia para quem abrisse o arquivo - a listagem
da pasta dizia o contrario.

Movidos com `git mv` (historico preservado) para `scripts/historico/`, com
`README.md` curto declarando que ali so entra SQL ja aplicado e que nada ali se executa.

Os tres pontos de referencia atualizados:

- `scripts/audit/sql.unit.mjs:26-27` (constantes `cleanup` e `remediacao`)
- `scripts/audit/README.md:58`
- `docs/agentes/banco.md:35`

Conteudo SQL **nao** foi tocado - a revisao de 2026-11-09 ja os deixou replay-safe,
e qualquer edicao invalidaria os testes que verificam o conteudo.

**Verificacao**
- `node --test scripts/audit/sql.unit.mjs` -> **28 testes, 0 falhas, 0 pulados**; o
  Postgres descartavel subiu e os dois arquivos foram executados de verdade no novo caminho
- `npm run automation:test` -> **103 testes, 0 falhas**
- `node scripts/ci/check-claude-md-integrity.mjs` -> exit 0
- `grep` nao encontra nenhuma referencia apontando para a raiz de `scripts/`

### Registro - etapas 028-033 e 037 (2026-11-24) - maquina de estados viva no banco (PR #417 e #420)

As etapas 028-031 estavam escritas na tela desde a 034-036 (mapa compartilhado, `Despachos` e
`KanbanEntregas` validando antes de gravar), mas a camada que ninguem contorna - o banco - continuava
aceitando qualquer valor do enum em qualquer ordem. Quatro migrations fecham isso, e a 033 as levou para
producao.

- `20261124090000_fn_valida_transicao_entrega.sql` - funcao pura `fn_valida_transicao_entrega(p_de, p_para)`
  com o mapa explicito de saltos validos de entrega
- `20261124090100_trigger_valida_transicao_entrega.sql` - trigger `BEFORE UPDATE OF status` em `entregas`
- `20261124090200_fn_valida_transicao_coleta.sql` - mesma protecao para `coletas` (funcao + trigger)
- `20261124090300_trigger_entrega_nf_obrigatoria.sql` - `CREATE OR REPLACE` da funcao de trigger
  acrescentando a trava de NF

Codigo na PR #417 (squash `dc3aa718`); aplicacao pela etapa 033 em 4 despachos do `aplicar-migration.yml`
(runs `45382701775`, `45382772891`, `45382829524`, `45382898191`, todos `success`). O workflow exige o
arquivo dentro de `supabase/migrations/` **presente na main** - por isso a ordem foi mergear e depois
aplicar.

Por que o trigger se chama `a_valida_transicao_*`: triggers `BEFORE` rodam em ordem alfabetica, e o nome
ganha de `audit_entregas` e `tr_increment_version_entregas`. Tentativa recusada nao chega a virar linha de
auditoria nem incrementa `version`. O SQLSTATE e `23514`, com a mensagem
`Transicao de status invalida: X -> Y` - o contrato que a tela ja sabia traduzir desde a 037.

Risco assumido e registrado: o mapa do front (`TRANSICOES_ENTREGA`) e **mais estreito** que o do banco. O
banco aceita tambem os saltos que o despacho e o rastreio realmente usam (`despachado`/`em_transito` ->
`entregue`, `despachado` -> `saiu_entrega`|`ocorrencia`, `saiu_entrega` -> `em_transito`, `ocorrencia` ->
`em_transito`|`entregue`). Se o banco usasse o mapa do front, "Confirmar Entrega" em `Envios.tsx:954`
passaria a falhar. O comentario de `src/lib/statusTransitions.ts:8-13` foi corrigido para dizer isso.

A 037 so podia fechar depois da 033: sem o banco emitindo `23514`, a mensagem de recusa nunca aparecia. As
telas que gravam status e tratam a recusa ficaram `Despachos.tsx:253`, `KanbanEntregas.tsx:344` e
`Envios.tsx` (menu da linha ganhou `onError` e a acao em massa passou a traduzir a recusa, PR #420). O
motor de regra de negocio (`useBusinessRuleEngine.tsx:117-131`) passou a registrar `console.warn` quando o
banco recusa, em vez de engolir o erro - antes uma transicao recusada nao deixava rastro nenhum.

Rollback pronto: `supabase/rollbacks/20261124091000_rollback_maquina_estados.sql` (dropa 2 triggers e 4
funcoes). Para usar, copiar para `supabase/migrations/` e despachar o mesmo workflow.

**Verificacao**
- `aplicar-migration.yml` 4x -> os 4 runs `success` (ids acima)
- catalogo gerado do banco (`supabase/schema-catalog.json`, PR #419) tem as 6 rotinas novas:
  `fn_valida_transicao_entrega`, `fn_tr_valida_transicao_entrega`, `a_valida_transicao_entregas`,
  `fn_valida_transicao_coleta`, `fn_tr_valida_transicao_coleta`, `a_valida_transicao_coletas`
- `node --test scripts/audit/sql.unit.mjs` (com `PG_BINDIR` no Postgres 16) -> **29 testes, 0 falhas,
  0 pulados**; entre eles "maquina de estados (028-031): transicao valida passa; salto invalido e despacho
  sem NF sao recusados"
- `npx vitest run src/lib/statusTransitions.test.ts` -> **19 testes passando**
- `node scripts/automation.mjs test` -> **103 testes, 0 falhas**
- `npx tsc --noEmit` -> exit 0 (worktree da PR #420); CI da #420 com 17 checks verdes

Uma linha por etapa concluída. A coluna **Evidência** é o que diferencia etapa concluída de etapa
"deveria funcionar": cole o comando e o resultado, ou a consulta e o retorno.

| Etapa | PR  | Mergeada? | Deploy confirmado? | Evidência da verificação |
| ----- | --- | --------- | ------------------ | ------------------------ |
|       |     |           |                    |                          |

---



## Registro da etapa 296 - branch contexto regerada (2026-11-24)

Depois de ~300 etapas as três fontes da branch `contexto` descreviam uma árvore que já não existia — e são
a primeira coisa que qualquer agente lê. A regeração foi disparada por `workflow_dispatch` sobre a `main`
`e65af9d8`, com os **três** produtores verdes no run `45410194923`:

| Job | Estado |
| --- | --- |
| Produtor `codigo/` (`gerar.mjs`) | success |
| Produtor `regras/` (`generate.py`) | success |
| Produtor `supabase/` (`snapshot.py`) | success |
| Índice único + branch `contexto` | success |

Commit publicado: `2026-11-24T14:09:53+00:00` — `chore(contexto): 3 fonte(s) regerada(s) @ main e65af9d [skip ci]`.

**Verificação**
- `git show origin/contexto:docs/contexto/00-INDEX.md | sed -n '1,16p'` -> cabeçalho
  `Gerado automaticamente por indice.py · 2026-11-24 14:09 UTC · HEAD e65af9d8af`, e a linha do banco real
  agora `ok · 0 min atrás` (antes: "ainda não gerado"); código `ok · 1 min atrás`, regras `ok · 0 min atrás`
- `docs/contexto/supabase/errors.md` -> `_nenhum_`; `docs/contexto/codigo/erros_do_gerador` não trouxe erro
- `docs/contexto/codigo/testes.json` -> `total: 201` (`contrato 57`, `unit 137`, `e2e 2`, `pytest 5`), com
  `cobertura_por_arquivo` e `sem_teste` — reflete as etapas 275-282, não os "61 de 61 sem teste" da versão velha
- `docs/contexto/supabase/tables/public/fretes_internos.md:32` -> coluna 16 `deleted_at |
  timestamp with time zone | sim`: o snapshot enxerga a DDL da etapa 056
- `git ls-tree -r --name-only origin/contexto docs/contexto/supabase/ | wc -l` -> **553** arquivos
- o job do banco saiu **verde com dados**, não verde com aviso: o secret `SUPABASE_DB_URL` existe (etapa 263
  resolvida na prática)

**Achado novo, sem conserto nesta etapa (mudança de automação exige o dono):** o produtor do snapshot grava
6 migrations com extensão dobrada — `docs/contexto/supabase/migrations/20261124090000_fn_valida_transicao_entrega.sql.sql`
e outras cinco. São exatamente as migrations aplicadas pelo `aplicar-migration.yml`, cujo registro no ledger
guarda o nome com `.sql` e o produtor acrescenta `.sql` de novo. O conteúdo está correto; só o nome mente.


## Registro da etapa 295 — os seis achados HIPÓTESE, medidos no banco ao vivo

Consultas feitas em **2026-11-24** contra o projeto `jvfhclubfpxrtrrazrgr` pela Management API
(`/database/query`), **somente leitura** — nenhum `CREATE`, `ALTER` ou `DROP`.

- **F-02 — REFUTADO.** As três tabelas têm RLS ligado: `pg_class.relrowsecurity = true` em
  `geo_blocking_rules` (2 policies), `geo_blocking_settings` (2) e `scheduled_reports` (4). Varrendo `public`
  inteiro: **130 tabelas, 130 com RLS**, **0** com policy e sem RLS e **0** com RLS ligado e sem policy. O
  padrão que a auditoria suspeitou não existe em nenhuma tabela hoje. Nota: a consulta do plano
  (`SELECT * FROM get_rls_audit() WHERE status='critical'`) não roda em dois pontos — a função **não tem**
  coluna `status` (a coluna é `severity`) e ela recusa papéis sem admin (`Access denied: admin role required`
  para o papel da Management API), então esse caminho nunca teria fechado o achado.
- **F-03 — CONFIRMADO para os números, REFUTADO para o rastreio.** `coletas_numero_coleta_key UNIQUE
  (numero_coleta)` e `entregas_numero_entrega_key UNIQUE (numero_entrega)` existem, e as duas colunas são
  `NOT NULL` — logo a geração por trigger `BEFORE INSERT` não tem como duplicar. Já `codigo_rastreamento` é
  `NULL`-ável e tem apenas dois índices btree **parciais e não únicos**
  (`idx_entregas_rastreamento`, `idx_entregas_codigo_rastreamento`): nada no banco impede dois fretes com o
  mesmo código. Achado novo, **não corrigido aqui** (medir, não consertar) — candidato a etapa própria.
- **P-05 — CONFIRMADO (inventário).** `pg_indexes` em 2026-11-24: **coletas 14**, **entregas 21**,
  `telemetry_logs` 5 índices, incluindo as constraints `_pkey` e `_numero_*_key`.
- **P-06 — CONFIRMADO com ressalva.** Os três pares que a **#428** remove continuam no banco e a definição
  confirma a redundância: `idx_entregas_transportadora`/`idx_coletas_transportadora` são parciais sobre a
  mesma coluna de `*_transportadora_id`, e `idx_audit_logs_record_id_table` é prefixo de
  `idx_audit_logs_record_composite`. Sobram, fora do escopo da #428, quatro candidatos com a definição
  conferida: `idx_entregas_status` (prefixo de `idx_entregas_status_created_at`), `idx_entregas_status_active`
  (prefixo de `idx_entregas_status_composite`), `idx_coletas_status_active` (prefixo de
  `idx_coletas_status_created_at`) e o par `idx_entregas_rastreamento` × `idx_entregas_codigo_rastreamento`
  (mesma coluna, predicados diferentes). **Não** são redundantes, apesar da aparência: os dois índices de
  `audit_logs` por `record_id` (`_record_id_created` × `_record_composite`) servem consultas diferentes.
  Ressalva que impede conclusão por `idx_scan`: as 20 entradas com `idx_scan = 0` incluem tabelas com
  **0 linha** (`entregas`, `coletas`, `rastreamento_historico`, `audit_logs`; só `telemetry_logs` tem 394),
  então o contador mede ausência de uso, não desuso.
- **S-05 — SEGUE ABERTO (dono).** `ALLOW_TEST_MODE` nas edge functions de produção só é legível no painel do
  Supabase; a etapa 010 já pede a mesma confirmação.
- **S-08 — SEGUE ABERTO (dono).** Restrição de URL do token `VITE_MAPBOX_TOKEN` só existe no painel do Mapbox;
  a etapa 019 já pede a mesma confirmação.


## Registro da etapa 299 — bateria completa de gates: início × fim

Medido em **2026-11-24** sobre a `main` (`e42bbf85`), em worktree limpo com `node_modules` do checkout. A coluna
"início" é a `02-CENARIOS.md` §0 (E1–E11).

| # | Gate | Início (02-CENARIOS §0) | Fim (medido hoje) | Diferença |
| --- | --- | --- | --- | --- |
| E1 | `npx tsc --noEmit` | 0 erros | **0 erros**, exit 0 | igual |
| E2 | `npx eslint .` | 105 avisos, 0 erros | **80 avisos, 0 erros** | **−25 avisos** |
| E3 | `npm run lint:budget` | 105/105 (no teto exato) | **80 / 86**, 0/0 erros | −25 avisos + 6 de margem |
| E4 | `npm run validate:csp` | OK | **OK** | igual |
| E5 | `npm run validate:no-console` | OK, 107 arquivos | **OK, 120 arquivos** | +13 arquivos cobertos |
| E6 | `npm run security-scan` | OK + aviso de allowlist (`xlsx`, `vite`, `picomatch`) | **OK + o mesmo aviso** | igual — etapa 270 pendente |
| E7 | `npm audit --json` | 0 em todas as severidades | **0** (critical 0, high 0, moderate 0, low 0) | igual |
| E8 | `git ls-files .env` / `check-ignore` | rastreado e fora do `.gitignore` | **não rastreado e ignorado** | **corrigido** |
| E9 | chaves em arquivo versionado | todas `"role":"anon"` | `docs/ops/cron_jobs_origem.json` **não contém chave nenhuma** | não se aplica mais |
| E10 | visibilidade do repositório | `public` | **`public`** | igual — etapas 016/017 aguardam o dono |
| E11 | funções SQL | 119 nas migrations: 83 definer com `search_path`, 2 sem, 34 não-definer | **117 no catálogo: 102 definer, 102 com `search_path`, 0 sem**, 15 invoker | **0 definer sem `search_path`** |

Gates que o plano acrescentou depois da linha de base:

| Gate | Resultado |
| --- | --- |
| `npm run test:rls` | 19 testes, 2 arquivos, todos passando |
| `npm run test:security` | 19 testes, 2 arquivos, todos passando |
| `npx vitest run` | **101 arquivos, 852 testes, 0 falha** (28 s) |
| `npx vitest run --coverage` | statements **75,9** · branches **69,93** · functions **73,55** · lines **78,05** contra os pisos 70/67/73/72 |

**Nenhuma linha piorou.** Duas não chegaram ao esperado, e não por regressão: E6 continua com o aviso de
allowlist sem efeito porque a etapa 270 (que remove as três entradas) ainda não foi executada; E10 continua
público porque a visibilidade é decisão do dono (etapas 016/017). Na E11 a contagem caiu de 119 para 117 porque
o número de partida saiu das migrations (última definição de cada nome) e o de hoje sai do catálogo vivo — o dado
que importa é que **não sobrou nenhuma `SECURITY DEFINER` sem `search_path`**.

**`lint:budget:ratchet` NÃO foi rodado, de propósito.** A etapa manda rodar só quando nenhuma etapa estiver
pendente de merge, e hoje há cinco PRs abertas (#428, #430, #431, #433, #434). Cravar o teto em 80 agora faria a
próxima PR do plano reprovar por um aviso novo — é exatamente o H-10. Quando o lote mergear, o ratchet leva o
teto de 86 para 80.

**Ressalva para a etapa 284:** `functions` está em 73,55 contra piso 73 — 0,55 ponto de folga. Subir esse piso
exige folga maior, senão qualquer arquivo novo sem teste derruba a suíte.

## Registro da etapa 265 - plano B da fonte do banco (2026-11-25)

`AGENTS.md` manda ler `docs/contexto/supabase/` como item 2, mas não dizia o que fazer quando a pasta não
está lá. O caminho que sobrava era `docs/contexto/codigo/banco.json`, que é a origem do falso positivo de
F-01 ("36 tabelas sem RLS" quando ao menos 32 têm, por DDL dinâmico): o produtor de código varre o código
que fala de banco, não o banco, e não modela índice, trigger criado fora do repo nem DDL dinâmico.

Os três arquivos do protocolo agora trazem o fallback explícito:

- `AGENTS.md` (seção `## Banco`): plano B no MCP `SUPABASE - LOGGI FLOW V2 - MCP`, só leitura, e a ressalva
  de que `codigo/banco.json` não serve como fonte de RLS nem de existência de objeto; a idade de cada fonte
  no `00-INDEX.md` diz se dá para confiar nela.
- `docs/agentes/banco.md`: seção nova `## Fonte de contexto do banco (branch contexto)`, com o plano B, a
  regra de prevalência (MCP > retrato versionado > nada) e o aviso do `banco.json`.
- `docs/agentes/contexto-ia.md`: o mesmo no bloco "Enquanto isso: o banco real pelo MCP".

Correção de fato encontrada no caminho, no mesmo arquivo: `docs/agentes/banco.md` dizia **duas vezes** que
"não existe workflow de apply" de DDL. Existe e é o usado nesta sessão — `.github/workflows/aplicar-migration.yml`
(`workflow_dispatch`, inputs `arquivo` + `confirmacao=APLICAR`, `--single-transaction`, registro no ledger).
As duas linhas foram corrigidas, com a nota de que `CONCURRENTLY` não roda dentro da transação do workflow.
Um agente que acreditasse na versão antiga aplicaria DDL à mão pelo MCP, que é exatamente o que a regra 1 da
ordem de migration proíbe.

**Evidência**
- `node scripts/ci/check-claude-md-integrity.mjs` -> `AGENTS.md OK: 8 secoes presentes; conjunto com
  docs/agentes/: 73305 bytes (base HEAD: 70840 bytes em 10 arquivos, cada um >= 50% do tamanho na base)` /
  `exit=0`
- `grep -n "banco.json" AGENTS.md docs/agentes/banco.md docs/agentes/contexto-ia.md` -> 5 ocorrências, todas
  com a ressalva (AGENTS.md:97, banco.md:93, contexto-ia.md:66,69,71)

## Registro da etapa 142 — gate contra chave de dedupe aleatória (2026-11-25)

**O que mudou.** `scripts/ci/check-dedupe-keys.mjs` varre `supabase/functions/**/index.ts` e reprova
(exit 1) quando um nome com `event_id`/`eventId`/`event_key`/`idempot*` é seguido de `:` ou `=` e, na mesma
expressão, chama `crypto.randomUUID(` ou `Date.now(`. Comentários são mascarados antes da busca; `Date.now()`
em `startedAt`/`expiresAt`/`timestamp` e o `crypto.randomUUID()` do `Request-ID` de `lalamove-tracking`
seguem válidos — o alvo é estreito de propósito, proibir a chamada no repositório inteiro viraria ruído.
Exit 2 quando `supabase/functions/` não existe ou nenhum `index.ts` foi lido (nada validado ≠ verde).

**Arquivos:** `scripts/ci/check-dedupe-keys.mjs` (novo), `scripts/ci/check-dedupe-keys.unit.mjs` (novo, 12
casos), `scripts/ci/README.md` (seção nova), `package.json` (`validate:dedupe-keys`) e
`scripts/automation.config.json` (2 registros `legacy`, de 92 para 94).

**Evidência**
- `node scripts/ci/check-dedupe-keys.mjs` -> `OK: 44 arquivos index.ts conferidos; nenhuma chave com
  crypto.randomUUID() ou Date.now().` / `exit=0`
- prova no defeito real: `buildEventKey('lalamove', [...partesEvento, crypto.randomUUID()])` reintroduzido
  em `supabase/functions/lalamove-webhook/index.ts:111` -> `::error::Chave de dedupe construida com valor
  aleatorio ou relogio: supabase/functions/lalamove-webhook/index.ts:111 ...` / `exit=1`; arquivo restaurado,
  `git status --porcelain supabase/` vazio e gate de volta a `exit=0`
- `node --test scripts/ci/check-dedupe-keys.unit.mjs` -> `pass 12`, `fail 0`
- `npm run automation:test` -> `pass 103`, `fail 0`
- `npx eslint scripts/ci/check-dedupe-keys.mjs scripts/ci/check-dedupe-keys.unit.mjs` -> `exit=0`

**Sugestão registrada (não executada nesta etapa, por decisão da própria 142):** ligar
`npm run validate:dedupe-keys` a um job da CI — o lugar natural é o `quality-gate` do
`.github/workflows/ci-nexus.yml`, ao lado de `validate:query-limits` — o que exige o ok do dono.

**Decisão:** o gate **não** foi ligado a nenhum workflow (a etapa 142 proíbe mexer na CI e a escolha de
required check é do dono); entra como `npm run validate:dedupe-keys`, mergeável sem alterar comportamento
de CI. PR #439.

## Registro - correcao de contagem e status da 060 (2026-11-25)

A etapa **060** estava **implementada e mergeada** em `171f858a` (#340) desde 24/11 - `scripts/historico/`
existe com os dois SQL, `scripts/audit/sql.unit.mjs:26-27`, `scripts/audit/README.md:58` e
`docs/agentes/banco.md:35` ja apontam para o caminho novo, e `scripts/*.sql` nao existe. Mesmo assim a
linha de status continuava `[~] aguarda o dono` e o #340 seguia listado como PR aberta em "O que sobrou".

Corrigido aqui: linha 060 -> `[x]`, linha do #340 removida da tabela de PRs pendentes, e contagem do
resumo recalculada pelo padrao `- [x|~|!| ] **NNN**` sobre as 300 etapas: **252 `[x]` / 46 `[~]` / 0 `[!]` /
2 `[ ]`** (as duas nao iniciadas de verdade sao 218, que tem PR #433 aberta, e 289, bloqueada pela 288).

Conferido tambem que o resumo contava `[ ]` como 3 - o arquivo tem 6 linhas `- [ ]`, mas 4 sao itens do
checklist de retomada, nao etapas; com o padrao estrito o total fecha em 300.

## Registro da etapa 284 — pisos de cobertura subidos (2026-11-24)

**Medição (a spec pede medir depois das etapas 275-282 mergeadas, na suíte inteira):** duas rodadas
completas de `npm run test:coverage` sem nenhuma mudança de teste, as duas com os mesmos números — 101
arquivos, 852 testes, `All files` `75.9 st / 69.93 br / 73.55 fn / 78.05 li`. Estável, então o piso pode
subir. A medição foi feita sobre `37295911`; conferido que `git diff --stat 37295911 origin/main -- src
vitest.config.ts` é **vazio**, ou seja, nada que a cobertura mede mudou até a `6da5dec3` — os números
seguem válidos e a CI da PR roda o mesmo `test:coverage` sobre a main atual.

| Piso | Antes | Medido | Medido − 1 | Agora |
| --- | --- | --- | --- | --- |
| statements | 70 | 75.9 | 74.9 | **74** |
| branches | 67 | 69.93 | 68.93 | **68** |
| functions | 73 | 73.55 | 72.55 | **73** (não mexe) |
| lines | 72 | 78.05 | 77.05 | **77** |

`functions` é a exceção: a fórmula (medido − 1 = 72.55) cairia **abaixo** do piso atual e o comentário
do próprio arquivo proíbe descer sem aprovação. Fica em 73, com o comentário do bloco dizendo isso — é
a única margem apertada (0,55 ponto) e a próxima etapa que mexer ali precisa medir de novo.

**Mudança:** só o bloco `coverage.thresholds` e o comentário dele em `vitest.config.ts`. `include`,
`exclude`, `environment`, `setupFiles`, `testTimeout` e `hookTimeout` intactos, como a spec exige.

**Enforcement:** o job de testes do `ci.yml` roda `npm run test:coverage` — os pisos derrubam a CI de
verdade, não são só um número no arquivo.

**Evidência**
- `npm run test:coverage` (duas execuções) -> 101 arquivos, 852 testes, 0 falha; `All files 75.9 /
  69.93 / 73.55 / 78.05`; `grep -c "does not meet"` = 0 com os pisos novos
- `npx tsc --noEmit` e `npm run lint:budget` -> sem mudança (nenhum arquivo de código tocado, só config)
- CI da PR: job de testes roda o mesmo `test:coverage` com os pisos novos

**Por que a PR foi recriada:** a primeira branch desta etapa (`5d913c89`) commitou junto o relatório
gerado por `npm run test:coverage` — 112 arquivos em `coverage/` (HTML/JSON do relatório). Eles não têm
relação com o gate e só poluem a revisão, então ficaram de fora da PR nova.

**Estado:** PR aberta, **não mergeada** — a spec marca "precisa de aprovação humana antes do merge" e o
piso é limiar de gate da CI. Reverter = `git revert` (uma linha por piso).
