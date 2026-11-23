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

- [ ] **001** — Remover a condicional que desliga a verificação de assinatura do webhook do Nexus — onda 1 — Crítica
- [~] **002** — Confirmar com o dono se `NEXUS_WEBHOOK_SECRET` está configurado em produção — onda 1 — Crítica · **aguarda o dono**
- [ ] **003** — Criar `requireRole` em `_shared/auth.ts` — onda 1 — Crítica
- [ ] **004** — `webhook-status`: exigir chamador interno ou papel de admin — onda 1 — Crítica
- [ ] **005** — `webhook-status`: filtrar `client_webhooks` por dono e registrar quem disparou — onda 1 — Alta
- [~] **006** — `evolution-whatsapp`: exigir papel para enviar mensagem — onda 1 — Alta · **aguarda o dono**
- [ ] **007** — `evolution-whatsapp`: registrar quem enviou cada mensagem — onda 1 — Média
- [~] **008** — `melhor-envio-api`: o ambiente (produção/teste) passa a ser decidido pelo servidor — onda 1 — Alta · **aguarda o dono**
- [~] **009** — `melhor-envio-api`: exigir papel para cotar — onda 1 — Alta · **aguarda o dono**
- [~] **010** — Confirmar com o dono que `ALLOW_TEST_MODE` não está ligado em produção — onda 1 — Crítica (se ligado) · **aguarda o dono**
- [~] **011** — Fazer o modo de teste dos webhooks impossível de ligar por engano em produção — onda 1 — Média · **aguarda o dono**
- [ ] **012** — `health`: trocar `service_role` por uma verificação sem privilégio — onda 1 — Média
- [ ] **013** — `health-check`: parar de chamar a API administrativa de usuários e exigir sessão — onda 1 — Média
- [~] **014** — Decidir com o dono qual dos dois endpoints de saúde fica aberto e fechar o outro no `config.toml` — onda 1 — Média · **aguarda o dono**
- [ ] **015** — Tirar o `.env` do controle de versão, sem reescrever histórico — onda 1 — Alta
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

- [ ] **049** — `BulkActions`: ação destrutiva passa a pedir confirmação — onda 1 — Crítica
- [ ] **050** — Deixar cada tela escrever o texto da própria confirmação — onda 1 — Alta
- [ ] **051** — Exigir digitação para confirmar exclusão em massa de cadastro — onda 1 — Alta
- [ ] **052** — Teste do `BulkActions`: ação destrutiva não executa sem confirmação — onda 1 — Média
- [ ] **053** — `Transportadoras`: trocar exclusão real por exclusão lógica — onda 1 — Alta
- [ ] **054** — Filtrar `deleted_at IS NULL` em todas as leituras de `transportadoras` — onda 1 — Alta
- [~] **055** — Migration: acrescentar `deleted_at` a `fretes_internos` — onda 1 — Alta · **aguarda o dono**
- [~] **056** — Aplicar a migration de `deleted_at` e sincronizar os tipos — onda 1 — Alta · **aguarda o dono**
- [ ] **057** — `FretesInternos`: exclusão lógica e filtro em todas as leituras da tabela — onda 1 — Alta
- [~] **058** — Transformar a política de exclusão lógica em gate automático — onda 1 — Média · **aguarda o dono**
- [ ] **059** — Pedir confirmação ao cancelar uma logística reversa — onda 1 — Média

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
- [ ] **078** — Recusar arquivo cuja assinatura não é conhecida — onda 4 — Média
- [ ] **079** — Teste unitário da validação de assinatura de arquivo — onda 4 — Média
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
- [ ] **097** — `Despachos`: ler o erro da consulta — onda 2 — Alta
- [ ] **098** — `Despachos`: parar de dizer "Fila Limpa" quando a consulta falhou — onda 2 — Crítica
- [ ] **099** — `Envios`: erro com componente e botão de tentar de novo — onda 2 — Alta
- [ ] **100** — `Clientes`: erro com componente e botão de tentar de novo — onda 2 — Alta
- [ ] **101** — `Fornecedores`: erro com componente e botão de tentar de novo — onda 2 — Alta
- [ ] **102** — `FretesInternos`: erro com componente e botão de tentar de novo — onda 2 — Alta
- [ ] **103** — `Ocorrencias`: erro com componente e botão de tentar de novo — onda 2 — Alta

### Onda 4

- [ ] **104** — Fazer a gravação de preferências de previsão avisar quando falha — onda 4 — Alta
- [ ] **105** — Meta de acurácia e dias de alerta: parar de engolir o erro — onda 4 — Alta
- [ ] **106** — Interruptor de aviso por e-mail: parar de engolir o erro — onda 4 — Alta
- [ ] **107** — Endereço de e-mail do aviso: parar de engolir o erro — onda 4 — Alta
- [ ] **108** — Interruptor de aviso por WhatsApp: parar de engolir o erro — onda 4 — Alta
- [ ] **109** — Telefone de WhatsApp: parar de engolir o erro e fechar o achado — onda 4 — Alta
- [ ] **110** — Rodonaves: mostrar a falha da sincronização em vez de engoli-la — onda 4 — Alta
- [ ] **111** — Rodonaves: atualizar a lista de entregas depois de sincronizar — onda 4 — Alta
- [ ] **112** — Rodonaves: atualizar também as ocorrências criadas pela sincronização — onda 4 — Média
- [ ] **113** — Alertas de SLA: avisar quando a gravação da notificação falha — onda 4 — Alta
- [ ] **114** — Alertas de SLA: fazer o sino acender sem recarregar — onda 4 — Alta
- [ ] **115** — Nexus Blast: contar só as cotações que voltaram — onda 4 — Média
- [ ] **116** — Nexus Blast: dizer **quais** transportadoras falharam — onda 4 — Média
- [ ] **117** — Importação em massa: guardar a mensagem de erro de cada lote — onda 4 — Média
- [ ] **118** — Importação em massa: parar de condenar o lote inteiro por causa de uma linha — onda 4 — Média
- [ ] **119** — Importação em massa: mostrar e exportar as linhas que falharam — onda 4 — Média
- [~] **120** — Importação em massa: decidir se o histórico deve sobreviver à tela — onda 4 — Média · **aguarda o dono**
- [ ] **121** — VERIFICAR se o duplo clique cria registro duplicado (o achado é hipótese) — onda 4 — Média
- [ ] **122** — Fechar os formulários que a etapa 121 encontrou desprotegidos — onda 4 — Média

### Onda 5

- [ ] **123** — `useSLANotifications`: cancelar os cinco temporizadores de aviso e de som — onda 5 — Baixa
- [ ] **124** — `useOnboarding`: cancelar o temporizador da notificação de conquista — onda 5 — Baixa
- [ ] **125** — `useAchievementNotifications`: cancelar o auto-descarte da notificação — onda 5 — Baixa
- [ ] **126** — `useImportData`: cancelar o reset de dois segundos — onda 5 — Baixa
- [ ] **127** — `useDocumentUpload` e `useSecurityPushNotifications`: os dois últimos temporizadores — onda 5 — Baixa
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
