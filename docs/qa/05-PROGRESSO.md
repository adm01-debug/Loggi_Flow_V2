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
  `internalErrorResponse(error, corsHeaders, "rodonaves-api")` (etapa 164) — some o `error.message` e o corpo de
  500.
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