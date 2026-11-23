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
- [ ] **128** — `useBoxManagement`: canal de tempo real com nome único — onda 5 — Média
- [ ] **129** — `useMapWeatherSync`: canal de zonas de risco com nome único — onda 5 — Média
- [ ] **130** — `useSmartAlerts`: canal de alertas táticos com nome único — onda 5 — Média
- [ ] **131** — `useNexusHealth`: canal da sonda de latência com nome único, e fim do achado — onda 5 — Média

### Onda 3

- [ ] **132** — Confirmar no banco ao vivo que a unicidade da tabela de marcador existe — onda 3 — Crítica
- [ ] **133** — `lalamove-webhook`: trocar "consulta e depois grava" por "grava primeiro e trata o conflito" — onda 3 — Crítica
- [ ] **134** — `lalamove-webhook`: remover a gravação tardia do marcador — onda 3 — Alta
- [ ] **135** — `rodonaves-webhook`: trocar "consulta e depois grava" por "grava primeiro e trata o conflito" — onda 3 — Crítica
- [ ] **136** — `rodonaves-webhook`: remover a gravação tardia do marcador — onda 3 — Alta
- [ ] **137** — Teste automatizado: o mesmo evento enviado duas vezes grava o dado de negócio uma vez — onda 3 — Alta
- [ ] **138** — Criar `buildEventKey` em `_shared/idempotency.ts`, copiando a chave da Rodonaves — onda 3 — Alta
- [ ] **139** — `lalamove-webhook`: eliminar o `crypto.randomUUID()` da chave de dedupe — onda 3 — Alta
- [ ] **140** — `nexus-webhook-receiver`: eliminar o `Date.now()` da chave de dedupe — onda 3 — Alta
- [ ] **141** — `carrier-webhook-receiver`: chave estável demais está engolindo evento verdadeiro — onda 3 — Alta
- [~] **142** — Gate de `grep`: nenhuma chave de dedupe pode conter valor aleatório ou relógio — onda 3 — Média · **aguarda o dono**
- [ ] **143** — `scheduled-reports`: lista de campos permitidos no `insert` — onda 3 — Crítica
- [ ] **144** — `scheduled-reports`: a mesma lista de campos permitidos no `update` — onda 3 — Crítica
- [ ] **145** — `scheduled-reports`: validar `action` e `reportId`, e testar o descarte de campo não permitido — onda 3 — Alta

### Onda 5

- [ ] **146** — `smart-carrier-selection`: validar `peso_kg` e os números do cálculo de frete — onda 5 — Alta
- [ ] **147** — `webhook-status`: exigir `data` antes de desestruturar — onda 5 — Alta
- [ ] **148** — `ingest-biosync`: validar `heart_rate` como número antes de comparar com o limite — onda 5 — Alta
- [ ] **149** — `lalamove-api`: `path` e `method` do corpo decidem o roteamento sem `requireEnum` — onda 5 — Alta
- [ ] **150** — `resend-email`: validar `to`, `subject` e `html` antes de entregar ao provedor — onda 5 — Alta
- [ ] **151** — `melhor-envio-api`: validar o corpo da cotação — onda 5 — Média
- [ ] **152** — `lalamove-tracking`: validar o identificador de rastreio — onda 5 — Média
- [ ] **153** — `ai-logistics-assistant`: validar e limitar o texto que vai para o modelo — onda 5 — Média
- [ ] **154** — `evolution-whatsapp`: validar `instance`, `phone` e `message` — onda 5 — Alta
- [ ] **155** — `ocr-receipt-processor`: validar a entrada do comprovante — onda 5 — Média
- [ ] **156** — Criar `_shared/invokeFunction.ts`: chamada entre funções com tempo limite — onda 5 — Alta
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
