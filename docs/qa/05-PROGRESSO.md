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

- [ ] **020** — Gerador de contexto: parar de afirmar "sem RLS" quando o arquivo tem DDL dinâmico — onda 0 — Alta
- [ ] **021** — Separar, nos resumos gerados, "tabela sem RLS" de "não deu para saber" — onda 0 — Alta
- [ ] **022** — Teste de regressão: partição protegida por `DO $$` não pode aparecer como "sem RLS" — onda 0 — Média

### Onda 1

- [ ] **023** — Consultar o banco ao vivo e decidir o estado de RLS das três tabelas suspeitas — onda 1 — Crítica (se confirmado)
- [~] **024** — Habilitar RLS em `scheduled_reports` — onda 1 — Crítica · **aguarda o dono**
- [~] **025** — Habilitar RLS nas duas tabelas de geo-blocking, depois de conferir o caminho de escrita da tela — onda 1 — Crítica · **aguarda o dono**
- [ ] **026** — Confirmar no banco ao vivo a unicidade de `numero_coleta`, `numero_entrega` e do código de rastreio — onda 1 — Alta (se ausente)
- [~] **027** — Criar a unicidade que faltar nos números e no código de rastreio — onda 1 — Alta · **aguarda o dono**

### Onda 3

- [~] **028** — Criar no banco a função que diz se uma transição de entrega é válida — onda 3 — Crítica · **aguarda o dono**
- [~] **029** — Trigger `BEFORE UPDATE` em `entregas` recusando transição inválida — onda 3 — Crítica · **aguarda o dono**
- [~] **030** — Mesma proteção para `coletas`: função de validação e trigger — onda 3 — Crítica · **aguarda o dono**
- [~] **031** — Levar a regra "não despacha sem nota fiscal" para o banco — onda 3 — Crítica · **aguarda o dono**
- [~] **032** — Testar função, triggers e regra da NF num Postgres descartável, antes de produção — onda 3 — Crítica · **aguarda o dono**
- [~] **033** — Aplicar as migrações da máquina de estados no banco, com o dono presente — onda 3 — Crítica · **aguarda o dono**
- [ ] **034** — Extrair o mapa de transições para um módulo compartilhado, completo e testado — onda 3 — Alta
- [x] **035** — `Despachos` passa a usar o mapa compartilhado — onda 3 — Alta
- [x] **036** — `KanbanEntregas` valida a transição antes de gravar — onda 3 — Alta
- [ ] **037** — Traduzir a recusa do banco em mensagem que o operador entende — onda 3 — Média
- [ ] **038** — `CotacaoMultiCanal`: a tabela da tela passa a ler do banco, não do `useState` — onda 3 — Crítica
- [ ] **039** — Registrar a resposta da transportadora no banco, não na memória — onda 3 — Crítica
- [ ] **040** — Marcar no banco qual cotação foi a escolhida — onda 3 — Alta
- [ ] **041** — "Nexus Blast" e o envio por e-mail passam a criar a cotação no banco — onda 3 — Alta
- [ ] **042** — Mostrar carregando, erro e vazio na tela de cotação multicanal — onda 3 — Média
- [~] **043** — Decidir com o dono o que fazer com as duas telas de cotação — onda 3 — Alta · **aguarda o dono**
- [ ] **044** — `Despachos`: avisar quando o avanço de status não gravou — onda 3 — Alta
- [ ] **045** — `Despachos`: avisar quando a autorização de despacho final não gravou — onda 3 — Alta
- [ ] **046** — BOX: não registrar alocação no histórico quando a alocação não aconteceu — onda 3 — Alta
- [ ] **047** — Parar de mandar `version + 1` do navegador no Kanban — onda 3 — Média
- [ ] **048** — Extrair a checagem de conflito para um utilitário, com teste — onda 3 — Média

### Onda 1

- [x] **049** — `BulkActions`: ação destrutiva passa a pedir confirmação — onda 1 — Crítica
- [x] **050** — Deixar cada tela escrever o texto da própria confirmação — onda 1 — Alta
- [x] **051** — Exigir digitação para confirmar exclusão em massa de cadastro — onda 1 — Alta
- [x] **052** — Teste do `BulkActions`: ação destrutiva não executa sem confirmação — onda 1 — Média
- [x] **053** — `Transportadoras`: trocar exclusão real por exclusão lógica — onda 1 — Alta
- [x] **054** — Filtrar `deleted_at IS NULL` em todas as leituras de `transportadoras` — onda 1 — Alta
- [~] **055** — Migration: acrescentar `deleted_at` a `fretes_internos` — onda 1 — Alta · **aguarda o dono**
- [~] **056** — Aplicar a migration de `deleted_at` e sincronizar os tipos — onda 1 — Alta · **aguarda o dono**
- [ ] **057** — `FretesInternos`: exclusão lógica e filtro em todas as leituras da tabela — onda 1 — Alta
- [~] **058** — Transformar a política de exclusão lógica em gate automático — onda 1 — Média · **aguarda o dono**
- [x] **059** — Pedir confirmação ao cancelar uma logística reversa — onda 1 — Média

### Onda 8

- [~] **060** — Tirar os dois SQL históricos do lugar onde parecem tarefa pendente — onda 8 — Média · **aguarda o dono**
- [ ] **061** — Registrar, em um lugar só, qual SQL avulso já foi aplicado e onde — onda 8 — Média

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
- [~] **142** — Gate de `grep`: nenhuma chave de dedupe pode conter valor aleatório ou relógio — onda 3 — Média · **aguarda o dono**
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
- [ ] **157** — `normalize-freight-response`: trocar o `fetch` nu para `whatsapp-notification` — onda 5 — Alta
- [ ] **158** — `ingest-biosync`: trocar o `fetch` nu para `bitrix24-integration` — onda 5 — Média
- [ ] **159** — `nexus-webhook-receiver`: tempo limite nas duas chamadas internas dentro do webhook — onda 5 — **Crítica**
- [ ] **160** — `send-password-reset`: tempo limite na chamada interna — onda 5 — Alta
- [ ] **161** — `predict-delays` e `predict-delays-scheduled`: tempo limite nas chamadas internas — onda 5 — Média
- [ ] **162** — `accuracy-meta-monitor`: tempo limite nas duas chamadas internas — onda 5 — Média
- [ ] **163** — `accuracy-weekly-digest`: tempo limite na chamada interna — onda 5 — Média
- [ ] **164** — Criar `_shared/httpError.ts`: uma resposta de erro que não vaza o detalhe interno — onda 5 — Alta
- [ ] **165** — `ingest-biosync`: parar de devolver o erro do Postgres — onda 5 — Alta
- [ ] **166** — `scheduled-reports`: parar de devolver o erro do Postgres — onda 5 — Alta
- [ ] **167** — `lgpd-erase-user`: parar de devolver o erro do Postgres — onda 5 — Alta
- [ ] **168** — `execute-protocol`: parar de devolver o erro do Postgres — onda 5 — Alta
- [ ] **169** — `lalamove-api`: parar de repassar a resposta de erro da Lalamove — onda 5 — Alta
- [ ] **170** — `rodonaves-api`: parar de transformar o erro do **login** da Rodonaves em mensagem — onda 5 — **Crítica**
- [ ] **171** — `rodonaves-api`: erro genérico na resposta e detalhe só no log — onda 5 — Alta
- [ ] **172** — `resend-email`: parar de repassar o erro do provedor de e-mail — onda 5 — Alta
- [ ] **173** — `db-health-weekly-report`: parar de repassar o erro do terceiro no relatório — onda 5 — Média
- [ ] **174** — `nexus-webhook-receiver`: erro genérico na resposta ao webhook — onda 5 — Média
- [ ] **175** — `lalamove-webhook`: erro genérico na resposta ao webhook — onda 5 — Média
- [ ] **176** — `rodonaves-webhook`: erro genérico na resposta ao webhook — onda 5 — Média
- [ ] **177** — `smart-carrier-selection`: erro genérico na resposta da cotação — onda 5 — Média
- [ ] **178** — Varredura final de `error.message`: as onze funções restantes de B-06 — onda 5 — Média
- [~] **179** — `secure-store`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — **Crítica** · **aguarda o dono**
- [ ] **180** — `get-mapbox-token`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — **Crítica**
- [ ] **181** — `resend-email`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **182** — `whatsapp-notification`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **183** — `push-send`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **184** — `new-device-alert`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **185** — `send-password-reset`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **186** — `validate-login`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **187** — `log-login-attempt`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [ ] **188** — `log-security-event`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [ ] **189** — `check-password-breach`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [ ] **190** — `bitrix24-integration`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **191** — `execute-protocol`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **192** — `ingest-biosync`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **193** — `ocr-receipt-processor`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [ ] **194** — `webhook-status`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Alta
- [ ] **195** — `normalize-freight-response`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [ ] **196** — `nexus-auto-healing`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [ ] **197** — `accuracy-weekly-digest`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Baixa dentro do grupo, mas manipula dado
- [ ] **198** — `geocode-address`: trocar o CORS `*` fixo por `getCorsHeaders(req)` — onda 5 — Média
- [ ] **199** — `ingest-biosync`: deduplicar a telemetria do dispositivo — onda 5 — Média
- [ ] **200** — `push-send`: tempo limite no envio ao provedor de push — onda 5 — Média
- [ ] **201** — Corrigir o comentário de `fetch-with-timeout.ts` que promete retentativa inexistente — onda 5 — Baixa

### Onda 6

- [ ] **202** — Criar `useServerPagination` e **definir** o contrato de paginação no servidor — onda 6 — Crítica
- [ ] **203** — Documentar o contrato de paginação e marcar `usePagination` como "só memória" — onda 6 — Alta
- [ ] **204** — `useTrackingAnalytics`: pôr teto no servidor na leitura de `rastreamento_historico` — onda 6 — Crítica
- [ ] **205** — `Analytics.tsx`: passar o intervalo de datas que a tela já tem para `useTrackingAnalytics` — onda 6 — Crítica
- [ ] **206** — `useTrackingAnalytics`: tornar a janela de datas obrigatória na assinatura — onda 6 — Alta
- [ ] **207** — `useLogisticsCalendar`: pôr teto na leitura de `coletas` — onda 6 — Alta
- [ ] **208** — `useLogisticsCalendar`: pôr teto na leitura de `entregas` — onda 6 — Alta
- [ ] **209** — `useLogisticsCalendar`: filtrar no servidor pelo mês que está na tela — onda 6 — Alta
- [ ] **210** — `useCotacoesMulticanal`: teto no servidor e colunas explícitas — onda 6 — Alta
- [~] **211** — Guard automatizado: consulta de listagem sem teto reprova a CI — onda 6 — Alta · **aguarda o dono**
- [x] **212** — `Notificacoes.tsx`: teto imediato na leitura de `notifications` — onda 6 — Alta
- [ ] **213** — `Notificacoes.tsx`: adotar `useServerPagination` como primeiro consumidor do contrato — onda 6 — Alta
- [ ] **214** — `Notificacoes.tsx`: trocar a barra de paginação em memória pela do servidor — onda 6 — Média
- [ ] **215** — `Notificacoes.tsx`: levar os filtros e a busca para o servidor — onda 6 — Alta
- [ ] **216** — `Notificacoes.tsx`: o tempo real deixa de rebaixar a lista inteira a cada aviso — onda 6 — Alta
- [ ] **217** — `useAccuracyMetaCycle`: uma única consulta a `notifications` para todas as linhas — onda 6 — Média
- [ ] **218** — `count_prediction_breach_days`: variante que responde todas as transportadoras numa chamada — onda 6 — Média
- [ ] **219** — `useKPIBenchmark`: tirar os `await` de dentro do laço — onda 6 — Média
- [ ] **220** — `useKPIBenchmark`: uma consulta por tabela cobrindo todos os períodos — onda 6 — Média
- [ ] **221** — `useExecutiveMetrics`: mesma consolidação de 18 consultas para 3 — onda 6 — Baixa
- [~] **222** — Conferir `types.ts` contra o banco ao vivo e regenerar se houver divergência — onda 6 — Média · **aguarda o dono**
- [ ] **223** — `Envios.tsx`: trocar `select("*")` por colunas explícitas em `entregas` — onda 6 — Média
- [x] **224** — `Coletas.tsx`: trocar `select("*")` por colunas explícitas em `coletas` — onda 6 — Média
- [ ] **225** — `useDrillDown`: colunas explícitas nas duas leituras — onda 6 — Baixa
- [ ] **226** — `useSLANotifications`: colunas explícitas nas duas verificações de SLA — onda 6 — Baixa
- [ ] **227** — `RelatorioPDF`, `LogisticsService` e `useCotacoesMulticanal`: os três `select("*")` restantes — onda 6 — Baixa
- [~] **228** — Censo dos índices reais de `entregas`, `coletas` e `telemetry_logs` no banco ao vivo — onda 6 — Alta · **aguarda o dono**
- [~] **229** — Provar a hipótese: `EXPLAIN (ANALYZE, BUFFERS)` da consulta do Painel SLA — onda 6 — Alta · **aguarda o dono**
- [ ] **230** — Índice para o Painel SLA: `entregas (status, previsao_entrega)` — onda 6 — Alta
- [ ] **231** — Índice parcial para a desigualdade de status do Kanban — onda 6 — Média
- [ ] **232** — Índice composto `telemetry_logs (severity, created_at DESC)` — onda 6 — Baixa
- [ ] **233** — Decidir com o dono sobre `(transportadora_id, created_at)` em `entregas` e `coletas` — onda 6 — Baixa
- [~] **234** — Censo dos cinco candidatos a índice duplicado, com uso, no banco ao vivo — onda 6 — Média · **aguarda o dono**
- [ ] **235** — Remover o duplicado de `rastreamento_historico (lalamove_order_id)` — onda 6 — Média
- [ ] **236** — Remover o duplicado de `rastreamento_historico (coleta_id)` — onda 6 — Média
- [ ] **237** — Remover o duplicado de `entregas (transportadora_id)` — onda 6 — Baixa
- [ ] **238** — Remover o duplicado de `coletas (transportadora_id)` — onda 6 — Baixa
- [ ] **239** — Decidir e remover a sobreposição em `audit_logs (table_name, record_id)` — onda 6 — Baixa
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

- [~] **249** — `AGENTS.md`: corrigir a regra de merge para 10 required checks e nomear o décimo — onda 0 — Alta · **aguarda o dono**
- [~] **250** — `AGENTS.md`: dizer que o repositório é público — onda 0 — Alta · **aguarda o dono**
- [~] **251** — `AGENTS.md`: o deploy de edge function é automático em merge para `main` — onda 0 — Alta · **aguarda o dono**

### Onda 8

- [ ] **252** — `AGENTS.md`: corrigir a contagem de migrations de 244 para a contagem real — onda 8 — Baixa
- [ ] **253** — `AGENTS.md`: corrigir o nome do workflow de contexto (`contexto.yml` → `contexto-ia.yml`) — onda 8 — Baixa
- [~] **254** — Propagar as correções de H-03 para `docs/agentes/github-ci.md` e `docs/agentes/deploy.md` — onda 8 — Média · **aguarda o dono**
- [~] **255** — Fazer a CI conferir os fatos verificáveis que o `AGENTS.md` afirma — onda 8 — Média · **aguarda o dono**
- [x] **256** — `docs/prod-readiness.md`: corrigir as duas contagens de paridade que caducaram — onda 8 — Alta
- [~] **257** — Fazer o inventário semanal recontar a paridade e datar o `prod-readiness` — onda 8 — Média · **aguarda o dono**
- [x] **258** — Rebaixar o enquadramento de "perfeição 10/10" nos dois documentos que o declaram — onda 8 — Média
- [x] **259** — `docs/MELHORIAS.md`: corrigir o hook que nunca existiu e a contagem de edge functions — onda 8 — Média
- [x] **260** — `docs/PLANO_MELHORIAS_2026.md`: corrigir a árvore de hooks que cita `useAnalyticsReal` — onda 8 — Baixa
- [x] **261** — `TEMPLATE_STRUCTURE.md`: parar de ensinar hook na raiz de `src/hooks/` — onda 8 — Baixa
- [x] **262** — `PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md`: corrigir "43 edge functions" para 44 — onda 8 — Baixa
- [~] **263** — Pedir ao dono o secret `SUPABASE_DB_URL`, sem o qual a fonte de contexto do banco nunca é gerada — onda 8 — Alta · **aguarda o dono**
- [ ] **264** — Rodar o produtor do contexto de banco e confirmar que `docs/contexto/supabase/` foi publicado — onda 8 — Alta
- [~] **265** — Dizer ao agente o que fazer quando a fonte do banco não existir — onda 8 — Alta · **aguarda o dono**
- [~] **266** — Fazer a ausência do snapshot do banco parar de sair verde em silêncio — onda 8 — Média · **aguarda o dono**

### Onda 0

- [ ] **267** — **FAÇA ISTO PRIMEIRO (1/3)** — abrir margem no orçamento de lint: `SortIcon` nas três telas de cadastro — onda 0 — Alta (destrava o plano)
- [ ] **268** — **FAÇA ISTO PRIMEIRO (2/3)** — usar o `SortIcon` compartilhado nas outras sete telas — onda 0 — Alta (destrava o plano)
- [ ] **269** — **FAÇA ISTO PRIMEIRO (3/3)** — pagar os seis avisos do Dashboard Executivo e registrar a margem reservada — onda 0 — Alta (destrava o plano)

### Onda 8

- [~] **270** — Remover as três entradas obsoletas da allowlist de vulnerabilidades — onda 8 — Baixa · **aguarda o dono**
- [x] **271** — Remover o arquivo `x` vazio versionado na raiz — onda 8 — Baixa
- [~] **272** — Decidir com o dono o destino de `bun.lock` e `bun.lockb` — onda 8 — Baixa · **aguarda o dono**
- [~] **273** — Barrar arquivo acidental na raiz antes do merge — onda 8 — Baixa · **aguarda o dono**
- [~] **274** — Tirar do `AGENTS.md` e do `types-sync.yml` a menção aos locks de bun — onda 8 — Baixa · **aguarda o dono**
- [ ] **275** — Criar a base de teste de hook e de tela que hoje não existe — onda 8 — Alta
- [ ] **276** — Teste da validação de transição de status (trava a correção de C-01) — onda 8 — Crítica
- [ ] **277** — Teste da checagem de `count` no controle de concorrência (trava a correção de C-03) — onda 8 — Alta
- [ ] **278** — Teste da confirmação em exclusão em massa (trava a correção de D-01) — onda 8 — Crítica
- [ ] **279** — Teste do fail-closed de assinatura de webhook (trava a correção de S-01) — onda 8 — Crítica
- [ ] **280** — Teste da idempotência atômica dos webhooks (trava a correção de B-01) — onda 8 — Crítica
- [ ] **281** — Teste do caminho de criar coleta — onda 8 — Alta
- [ ] **282** — Teste do caminho de mover entrega de status — onda 8 — Alta
- [~] **283** — Resolver o usuário semeado do `tests/e2e/` e dizer por que ele não roda na CI — onda 8 — Média · **aguarda o dono**
- [~] **284** — Subir os pisos de cobertura para travar o que as etapas 275-282 conquistaram — onda 8 — Média · **aguarda o dono**
- [~] **285** — Confirmar com o dono se `VITE_SENTRY_DSN` está configurado no Vercel — onda 8 — Média · **aguarda o dono**
- [~] **286** — Provar que um erro de front chega ao Sentry — onda 8 — Média · **aguarda o dono**
- [ ] **287** — Verificar no banco ao vivo se `webhook_failures` e `cron_job_logs` existem — onda 8 — Média
- [~] **288** — Dar destino persistente à falha de webhook de entrada — onda 8 — Média · **aguarda o dono**
- [ ] **289** — Mostrar as falhas de webhook numa tela que já existe — onda 8 — Média
- [~] **290** — Tornar visível a falha de cron, e decidir o destino das tabelas mortas — onda 8 — Média · **aguarda o dono**

### Onda 7

- [x] **291** — `MapboxMap`: parar de interpolar dado de rastreamento dentro de `innerHTML` — onda 7 — Média
- [x] **292** — `MapboxMap`: escapar o texto dos balões do mapa — onda 7 — Média
- [x] **293** — Pôr `rel="noopener noreferrer"` nos quatro links externos que só têm `noreferrer` — onda 7 — Baixa
- [x] **294** — Fazer o lint cobrar link externo e `innerHTML` interpolado — onda 7 — Baixa

### Onda 8

- [~] **295** — Fechar no banco ao vivo os seis achados marcados HIPÓTESE — onda 8 — Alta · **aguarda o dono**
- [ ] **296** — Regerar a branch `contexto` para que as fontes reflitam o código corrigido — onda 8 — Média
- [ ] **297** — Atualizar `03-ACHADOS.md` e `05-PROGRESSO.md` com o estado final de cada achado — onda 8 — Alta
- [ ] **298** — Reler o plano inteiro e registrar o que ficou sem etapa executada — onda 8 — Alta
- [~] **299** — Rodar a bateria completa de gates e comparar com os números do começo — onda 8 — Alta · **aguarda o dono**
- [ ] **300** — Relatório final de uma página para o dono — onda 8 — Alta

---

## Achados novos encontrados durante a execução

Problema novo **não se corrige na hora** (regra 4). Anote aqui, com `arquivo:linha`, e siga a etapa em curso.

| #   | Achado | Onde (arquivo:linha) | Encontrado na etapa | Gravidade estimada |
| --- | ------ | -------------------- | ------------------- | ------------------ |
|     |        |                      |                     |                    |

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
| 023   | RLS real de `geo_blocking_rules`, `geo_blocking_settings`, `scheduled_reports` |           |      |                |
| 026   | `UNIQUE` em `logistica_reversa.codigo_rastreio_reverso`                        |           |      |                |
| 285   | `VITE_SENTRY_DSN` configurado no Vercel                                        |           |      |                |
| 295   | Reconferência de F-02, F-03, P-05, P-06, S-05, S-08 no banco ao vivo           |           |      |                |

## Registro de execução

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
`storage_path`/`delivery_id` apenas como *texto com tamanho mínimo*, e desestruturava o mesmo corpo **cru** para
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
o spread `...conversationHistory.slice(-10)` com 500 genérico. `stream` string (`"false"`) é *truthy* e ligava SSE,
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
payload.timestamp || await bodyHash(payload)], payload)`. Com `event_id`/`id` a chave é o identificador; sem
ele, `event_type` ainda entra, mas o componente que discriminava vazio passa a ser **o hash do corpo** —
dois payloads diferentes do mesmo tipo geram chaves diferentes e dois payloads idênticos continuam
deduplicando. Nada mais na função mudou: o padrão de referência de erro sem vazamento e o `mapCarrierStatus`
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

| tabela | restrição | colunas |
|---|---|---|
| `webhook_events_processed` | `webhook_events_processed_event_id_provider_key` | `(event_id, provider)` |
| `idempotency_keys` | `idempotency_keys_idempotency_key_key` | `(idempotency_key)` |

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
  restrições.
- O teste da 137 depende de `serve()` continuar inline nas duas edges; se alguém exportar o handler, o
  teste vira redundante e deve ser trocado por teste de unidade com cliente simulado.

### Registro - etapas 128 a 131 (2026-11-23) - achado R-09

**Decisão de nome, comum às quatro:** criei `src/lib/realtimeChannel.ts:12`
(`uniqueChannelName(base)` devolve `base-<timestamp base36>-<contador do módulo>`) e usei **sufixo por
instância nas quatro**, não `user.id`. Motivo: o caso que o achado descreve é *duas montagens do mesmo
usuário* (duas abas, dois componentes, widget mais página) e nome por usuário não separa isso. O helper
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

| Arquivo | Nome fixo | Risco |
| --- | --- | --- |
| `src/components/map/TacticalTerminal.tsx:49` | `tactical-logs` | **colide** com `MapaRotas.tsx:139` |
| `src/pages/MapaRotas.tsx:139` | `tactical-logs` | mesmo tópico do terminal tático |
| `src/components/common/RealtimeStatus.tsx:25` | `system-health-check` | um por app - benigno |
| `src/components/common/RealtimeBadge.tsx:22` | `presence-health` | um por app - benigno |
| `src/components/freight/ResponseConsole.tsx:35` | `raw_responses` | duas telas abertas → a segunda perde eventos |
| `src/utils/systemTester.ts:37` | `health-ping` | roda uma vez no auto-teste - benigno |

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

| Grupo | Arquivos | Chamadas | Situação |
| --- | --- | --- | --- |
| Os 10 timers do R-08 (cancelados neste lote) | 6 | 10 | `[x]` |
| Hooks com `clearTimeout` + `use-toast.ts` (timer no `Map toastTimeouts`) | 8 | 11 | corretos |
| Legítimos do A-08 em hooks (`useDeliveryRoutes.tsx:256`, `useGeocoding.tsx:75`) | 2 | 2 | legítimos |
| `useQRScanner.tsx` | 1 | 2 | `:136` benigno (só ref) · `:213` → R-08b |
| **Total em `src/hooks/`** | **17** | **25** | conferido |
| **Fora de `src/hooks/`** (30 componentes/telas + `main.tsx` + `CircuitBreaker.ts` + `systemTester.ts`) | **32** | **41** | só `CircuitBreaker.ts:39` e `BiometricConsentModal.tsx:66` são legítimos do A-08; o resto → R-08b |

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

| Tela / formulário | Evidência | Protegido? |
| --- | --- | --- |
| `PickupDialog` (criar coleta) | `src/components/coletas/PickupDialog.tsx:69` (`loading`) e `:468` (`disabled={loading}`) | sim |
| `Envios` (criar entrega) | `src/pages/Envios.tsx:1117` (`disabled={!form.endereco_entrega \|\| createMut.isPending}`) | sim |
| `Clientes` (criar) | `src/pages/Clientes.tsx:921-924` (+ `:927` com `Loader2`) | sim |
| `Clientes` (editar) | `src/pages/Clientes.tsx:948-951` | sim |
| `Fornecedores` (criar) | `src/pages/Fornecedores.tsx:780-783` | sim |
| `Fornecedores` (editar) | `src/pages/Fornecedores.tsx:806-809` | sim |
| `FretesInternos` (criar) | `src/pages/FretesInternos.tsx:702-703` | sim |
| `FretesInternos` (editar) | `src/pages/FretesInternos.tsx:729-730` | sim |
| `Ocorrencias` (criar) | `src/pages/Ocorrencias.tsx:788` (+ `:775` com `uploading`) | sim |
| `Ocorrencias` (editar) | `src/pages/Ocorrencias.tsx:910` | sim |
| **`AdminADR` (criar ADR)** | `src/pages/AdminADR.tsx:247` — só `disabled={!newAdr.title \|\| !newAdr.decision}`, sem `isPending` | **não** |
| `Coletas` (excluir) | `src/components/common/ConfirmDialog.tsx:87` (`disabled={isLoading \|\| !canConfirm}`) | sim |
| `Despachos` (despachar/confirmar) | `src/pages/Despachos.tsx:552` e `:604` via `ConfirmDialog` | sim |

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

| Etapa | Tela | Titulo | `refetch` |
| --- | --- | --- | --- |
| 099 | Envios | Erro ao carregar entregas | ja existia |
| 100 | Clientes | Erro ao carregar clientes | acrescentado |
| 101 | Fornecedores | Erro ao carregar fornecedores | acrescentado |
| 102 | FretesInternos | Erro ao carregar fretes internos | acrescentado |
| 103 | Ocorrencias | Erro ao carregar ocorrencias | acrescentado |

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

| Etapa | Onde esta a prova |
| --- | --- |
| 062 | `Coletas.tsx:853-866` - botao `Pencil` no cartao com `e.stopPropagation()`, `setSelectedPickup(c)` e `setIsDialogOpen(true)` |
| 063 | `Coletas.tsx:951-955` - `onEdit` no `PickupDetailsDialog` fechando detalhes antes de abrir edicao |
| 064 | `PickupDialog.tsx:102-103` - `setIsReverse`/`setIsUrgent` dentro do `useEffect`, e `:119-120` zerando no ramo de criacao |
| 065 | `Coletas.tsx:122-136` - `deleteColetaMut` com `.update({ deleted_at })`, nunca `.delete()` |
| 066 | `Coletas.tsx:867-879` (botao `Trash2` com `stopPropagation`) e `:925-937` (`ConfirmDialog` com `isLoading`) |
| 067 | `Coletas.tsx:159` - `.is("deleted_at", null)` na consulta da lista; a exportacao CSV de `:364` usa o array `coletas` ja filtrado, nao consulta de novo |

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

| Etapa | Prova no codigo |
| --- | --- |
| 001 | `nexus-webhook-receiver/index.ts:36-37` - o HMAC e sempre exigido e `verifyWebhookHmac` devolve `false` quando o segredo nao existe (fail-closed). Nao ha condicional desligando a verificacao |
| 003 | `_shared/auth.ts:69` - `export async function requireRole(` |
| 004 | `webhook-status/index.ts:29-31` - aceita `x-internal-secret` ou papel `admin`, e recusa o resto |
| 005 | `webhook-status/index.ts:184-185` - o dispatch consulta `client_webhooks` filtrando por `created_by` do chamador quando ele e usuario; `:161` grava `user_id` em auditoria |
| 007 | `evolution-whatsapp/index.ts:118` - `user_id: auth.claims.sub` na mensagem enviada |
| 012 | `health/index.ts:22` - usa `anon_key` de proposito, porque `health` e publica (`verify_jwt=false`); nao expoe `service_role` |
| 013 | `health-check/index.ts:32` - checa o Auth por `/auth/v1/health`, nao pela API administrativa de usuarios |

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

| Arquivo | Onde |
| --- | --- |
| `Transportadoras.tsx` | `:206-208` |
| `ConfiguracoesFrete.tsx` | `:171-173` |
| `ExportacaoDados.tsx` | `:86-88` |
| `Envios.tsx` | `:386-388` |
| `usePrefetch.ts` | `:60-62` |
| `useDashboardMetrics.tsx` | `:331-335` |
| `useExecutiveMetrics.tsx` | `:111-113` |
| `useGlobalSearch.tsx` | `:129-131` |
| `PickupDialog.tsx` | `:132-134` |

As consultas sem o filtro sao `.insert()` e `.update()` (`Transportadoras.tsx:269`,
`:303`, `:337`, `:366`; `ConfiguracoesFrete.tsx:187`) - ali o filtro nao se aplica,
porque escrever precisa achar o registro pelo `id`, inclusive para desfaze-lo.

Nenhuma alteracao de codigo: as duas etapas ja estavam atendidas.

Uma linha por etapa concluída. A coluna **Evidência** é o que diferencia etapa concluída de etapa
"deveria funcionar": cole o comando e o resultado, ou a consulta e o retorno.

| Etapa | PR  | Mergeada? | Deploy confirmado? | Evidência da verificação |
| ----- | --- | --------- | ------------------ | ------------------------ |
|       |     |           |                    |                          |

---

## Resumo do andamento

Atualize ao fim de cada sessão de trabalho.

|                         | Quantidade |
| ----------------------- | ---------- |
| Concluídas `[x]`        | 0          |
| Aguardando o dono `[~]` | 0          |
| Bloqueadas `[!]`        | 0          |
| Não iniciadas `[ ]`     | 300        |
| **Total**               | **300**    |

**Última etapa trabalhada:** — · **Data:** — · **Próxima etapa independente:** 267


### Registro - etapas 068-096 (2026-11-23)

**068/069/077/082** - ja estavam feitas na `main` antes desta sessao. Evidencia: `grep -rn
"useSelfHealing|useNexusSimulator|uploadDocument|service-wrapper" src/ supabase/functions/`
nao retorna nenhuma ocorrencia em codigo (so mencoes em `docs/qa/`).

**083** - ja estava na `main` no commit base `d37ba30`: `cbRef` em `useRealtime.tsx:99-101`
com `useEffect` sem array de dependencias, `handleChange` lendo `cbRef.current` com deps
`[queryClient, table, debouncedInvalidate]`, e o `eslint-disable` que existia na linha 157
removido.

**084-095** - 11 arquivos, 12 chamadas de `useRealtime` corrigidas:

| Etapa | Arquivo | Mudanca |
|---|---|---|
| 084 | `src/pages/Envios.tsx` | `onEntregaRealtime` em `useCallback` |
| 085 | `src/pages/KanbanEntregas.tsx` | `onEntregaKanban` em `useCallback` |
| 086 | `src/pages/Index.tsx` | `DASHBOARD_ENTREGAS_QUERY_KEY` constante de modulo |
| 087 | `src/pages/Index.tsx` | `DASHBOARD_COLETAS_QUERY_KEY` constante de modulo |
| 088 | `src/pages/Coletas.tsx` | `COLETAS_QUERY_KEY` constante de modulo |
| 089 | `src/components/audit/AuditTrailViewer.tsx` | `onAuditLogInsert` em `useCallback` |
| 090 | `src/pages/RastreamentoMotorista.tsx` | `onColetaTracking` em `useCallback` |
| 091 | `src/pages/Ranking.tsx` | `onLevelChange` em `useCallback` |
| 092 | `src/pages/SLADashboard.tsx` | `onEntregaChange` em `useCallback` |
| 093 | `src/pages/Notificacoes.tsx` | `onNotificationChange` em `useCallback` |
| 094 | `src/pages/Despachos.tsx` | `onEntregaNova` e `onEntregaAtualizada` separados; o som (`playNotification`) fica no de insert, para nao tocar duas vezes se o canal reabrir |
| 095 | `src/pages/CustosDashboard.tsx` | `handleRefetch` era arrow recriada a cada render; virou `useCallback` com deps `[startDate, endDate]` |

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
