# Plano de UX de navegação — 200 etapas

Análise de Product Design sobre a navegação do Loggi Flow V2: botão Voltar, histórico, trilha, modais,
fluxos de várias etapas, feedback, teclado, celular, endereço compartilhável, inclusão e medição. Plano em
11 fases e 200 etapas, cada uma com evidência no código.

- **Criado em:** 2026-11-22
- **Base de código lida:** `main` em `87fd515`
- **Método:** auditoria em nove dimensões (shell, botão Voltar, modais, fluxos, feedback, teclado, celular,
  endereço, métricas) e verificação adversarial de cada achado, relendo o arquivo citado: **89 confirmados,
  37 parciais (linha ou contagem corrigida neste texto), 0 refutados**. O apêndice A lista os achados que
  mudam a prioridade das etapas.
- **Estado:** plano. Nenhuma etapa executada.
- **Não verificado:** comportamento em aparelho real (iOS, Android, tablet), medições de contraste com
  ferramenta, teste com usuário. Contagens vêm de `grep` no commit base.

## Marcas

| Marca | Significado |
| --- | --- |
| `[DONO]` | Decisão ou ação que só o dono toma (política, usuário de teste, roteiro com operadores). |
| `[DDL]` | Mexe no banco de produção. PR fica aberta aguardando o dono. |
| `[AVALIAR]` | Valor ou risco incerto; a etapa entrega uma decisão registrada. |

Regras fixas: uma etapa = uma branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>` = uma PR; diff mínimo; nada de
refatorar o que não foi pedido; antes da PR `npx eslint`, `npm run typecheck` e `npx vitest run` no que foi
tocado.

---

## 1. Veredito

A navegação não é ruim por falta de peças — é ruim por excesso delas sem dono. O app **já tem** trilha,
restauração de rolagem, barra de carregamento, atalhos de teclado, busca global, barra inferior no celular,
links de atalho, painel de preferências de acessibilidade e canal de telemetria. O que falta é um lugar único
que decida cada coisa. Hoje:

- **Quatro controles de Voltar** podem aparecer ao mesmo tempo, e o atalho Alt+← está registrado em dois
  lugares, voltando duas páginas de uma vez.
- **Dois diálogos de busca** estão montados juntos, ambos escutando Ctrl+K.
- **Dois mapas de nome de rota**, um deles nunca lido, deixam ~18 telas mostrando o endereço cru como título.
- **O mesmo destino tem nomes diferentes** no menu, na barra inferior e na trilha; um destino aparece duas
  vezes no menu.
- **Nada do estado da tela vai para o endereço**: filtro, aba e registro aberto não sobrevivem a um Voltar,
  a um F5 nem a um link enviado para o colega.
- **O celular é um segundo cidadão**: ~33 telas não têm entrada na barra inferior, o componente que
  transforma tabela em cartão não é usado por ninguém e 13 telas mostram tabela crua.

| Área | Estado | Evidência-chave |
| --- | --- | --- |
| Botão Voltar | 🟥 Quatro controles, dois atalhos somados, critério frágil | `Header.tsx:100-118`, `MainLayout.tsx:96`, `MobileBottomNav.tsx:128-165`, `RastreamentoRealTime.tsx:270-277`, `useKeyboardShortcuts.ts:69` |
| Histórico | 🟥 Sete instâncias do mesmo hook, cada uma com sua pilha, todas gravando `page_view` | `useNavigationHistory.tsx:66,109-121`; chamadas em `App.tsx:111`, `Header.tsx:38`, `Breadcrumbs.tsx:137`, `PageBackButton.tsx:19`, `PageTransition.tsx:36`, `RecentlyVisited.tsx:17`, `MobileBottomNav.tsx:109` |
| Registro de rotas | 🟥 Não existe: menu, barra inferior, trilha e títulos têm listas próprias | `AppSidebar.tsx:84-201` (54 rotas), `MobileBottomNav.tsx:44-101` (21), `useNavigationHistory.tsx:13-54` (39), `Breadcrumbs.tsx:34-79` (44, morto) |
| Shell | 🟨 Monta por página e remonta a cada rota | `App.tsx:116`, `grep -rl "<MainLayout" src/pages` = 55 |
| Páginas fora do shell | 🟥 Duas telas protegidas sem menu, trilha ou Voltar | `PainelSLA.tsx:297`, `ExportacaoDados.tsx:292` |
| Trilha | 🟨 Pai aponta para página irmã e o último item é um histórico | `Breadcrumbs.tsx:82-129` |
| Modais | 🟥 53 telas com diálogo, nenhuma no endereço; 5 sem título acessível | `grep -rl DialogContent` = 53; `OnboardingWizard`, `WelcomeModal`, `LevelUpModal`, `ImageUploader`, `command.tsx` |
| Confirmação | 🟥 `ConfirmProvider` pronto com zero uso; 12 exclusões em páginas | `src/components/common/ConfirmProvider.tsx` |
| Fluxos multi-etapa | 🟨 Componente de etapas usado por 2 telas, 11 controlando passo à mão, nenhum rascunho | `CotacaoMultiCanal.tsx:62-81` (19 estados soltos) |
| Feedback | 🟨 Dois sistemas de aviso (133 × 19), 83 mensagens "Erro ao…", nenhuma ação otimista | `grep onMutate src` = 0 |
| Teclado e busca | 🟥 Duas buscas, atalho dispara ao digitar | `GlobalSearch.tsx:41-47`, `SearchCommand.tsx:34-42`, `useKeyboardShortcuts.ts:30-60` |
| Celular | 🟥 Tabela crua em 13 telas, componente responsivo sem uso, dois `useIsMobile` divergentes | `hooks/ui/use-mobile.tsx` (767px) vs `hooks/common/useMediaQuery.ts` (768px) |
| Endereço | 🟥 6 usos de parâmetros em 3 telas; 286 abas, 7 controladas; login sempre volta à raiz | `grep useSearchParams src` = 6; `ProtectedRoute.tsx` sem destino guardado |
| Inclusão | 🟨 Preferências completas, sem efeito no shell | `src/features/preferences/types/index.ts` |
| Medição | 🟨 Canal de telemetria existe, só mede desempenho | `src/hooks/analytics/useTelemetry.ts`, `usePerformanceMonitor.ts` |

## 2. Problemas priorizados (impacto × esforço)

| # | Problema | Impacto | Esforço | Etapa |
| --- | --- | --- | --- | --- |
| P1 | Alt+← volta duas páginas (atalho duplicado) | Alto | Baixo | 023 |
| P2 | Depois do login, Voltar cai na tela de login | Alto | Baixo | 024 |
| P3 | Ctrl+K abre duas buscas sobrepostas | Alto | Baixo | 131 |
| P4 | Atalho dispara enquanto o usuário digita e troca de tela | Alto | Baixo | 132 |
| P5 | Duas telas protegidas sem menu, trilha ou Voltar | Alto | Baixo | 011 |
| P6 | ~18 telas com o endereço cru como título | Alto | Médio | 005, 006 |
| P7 | Até sete registros de `page_view` por navegação | Alto | Médio | 013, 014 |
| P8 | Quatro controles de Voltar na mesma tela | Alto | Médio | 025–027 |
| P9 | Item de admin visível para quem não é admin, com salto mudo | Alto | Médio | 018, 019 |
| P10 | Filtro, aba e página perdidos ao voltar ou recarregar | Alto | Alto | 169–176 |
| P11 | Registro aberto não tem endereço (não dá link) | Alto | Alto | 063–070 |
| P12 | Exclusão sem confirmação padronizada e sem desfazer | Alto | Médio | 071–073 |
| P13 | ~33 telas sem entrada no celular | Médio | Médio | 004 |
| P14 | Tabela crua em 13 telas no celular | Médio | Médio | 150–152 |
| P15 | Fluxo longo sem rascunho: fechar a aba perde tudo | Médio | Alto | 090–093 |
| P16 | Mensagem de erro que não diz o que fazer | Médio | Médio | 108–110 |
| P17 | Trilha com pai errado e histórico embutido | Médio | Médio | 045–048 |
| P18 | Preferências de acessibilidade sem efeito no menu | Médio | Baixo | 187–190 |
| P19 | Gesto de borda competindo com o gesto nativo | Médio | Baixo | 028, 162 |
| P20 | Nenhuma métrica de navegação para saber onde trava | Médio | Médio | 194–196 |

## 3. Sugestões detalhadas

As 200 etapas trazem a lista completa; abaixo as seis decisões que organizam todas as outras.

### 3.1 Registro único de rotas

- **Descrição.** Um arquivo descreve cada rota: endereço, nome, seção, ícone, pai, se é de admin e se aparece
  no celular. Menu, barra inferior, trilha, título da aba, busca e botão Voltar passam a ler dele. Hoje essas
  seis superfícies têm listas próprias que já divergem entre si.
- **Exemplo prático.** `src/lib/routes.ts` com `{ path: "/painel-sla", label: "Metas de SLA", section: "visao-geral", parent: "/", requiresAdmin: false, mobile: true }`; `AppSidebar`, `MobileBottomNav`, `Breadcrumbs` e o provedor de navegação recebem a lista por `import`.
- **Benefícios.** Rota nova aparece em todas as superfícies de uma vez; acaba o título com endereço cru; o
  mesmo destino deixa de ter três nomes; item sem permissão deixa de ser oferecido.
- **Referência.** Material Design 3, navegação e hierarquia (`m3.material.io/foundations/layout/understanding-layout`).

### 3.2 Um Voltar por viewport, com destino previsível

- **Descrição.** No computador, o Voltar vive no cabeçalho; no celular, na barra inferior. A decisão de para
  onde ir usa a pilha interna do app e, na falta dela, o pai declarado na rota — nunca `window.history.length`,
  que conta páginas de fora do app.
- **Exemplo prático.** `goBack()` no provedor: se houver tela anterior do app, voltar uma; senão, ir ao pai da
  rota atual; na raiz, desabilitar. O botão duplicado do conteúdo (`MainLayout.tsx:96`) sai, e o atalho fica
  registrado em um só lugar.
- **Benefícios.** Fim do "Voltar que volta duas telas" e do "Voltar que sai do sistema"; quem abre um link
  direto consegue subir um nível.
- **Referência.** Apple Human Interface Guidelines, navegação hierárquica (`developer.apple.com/design/human-interface-guidelines/navigation-and-search`).

### 3.3 O endereço guarda o que a tela mostra

- **Descrição.** Filtro, busca, página, ordenação, aba e registro aberto entram no endereço. Hoje seis usos de
  parâmetros em três telas: o operador perde o filtro ao voltar e não consegue mandar "esta tela" para o colega.
- **Exemplo prático.** `useUrlState("status", "pendente")` nas listagens e `?dialog=editar&id=…` nos modais;
  entrega, coleta e ocorrência ganham rota própria, como já existe para rastreio.
- **Benefícios.** Voltar devolve a mesma lista; F5 não zera o trabalho; link compartilhado abre a mesma visão;
  o histórico do navegador passa a ter sentido.
- **Referência.** Nielsen Norman Group, visibilidade do estado do sistema e controle do usuário.

### 3.4 Nada irreversível sem confirmação, nada confirmado sem desfazer

- **Descrição.** Um único caminho de confirmação (o `ConfirmProvider` que já existe e ninguém usa), com o nome
  do registro na pergunta. Como a exclusão é lógica, o aviso de sucesso oferece desfazer.
- **Exemplo prático.** `await confirm({ title: "Excluir o cliente Promobrindes?", description: "O cadastro sai das listas e pode ser restaurado em 30 dias.", confirmText: "Excluir cliente" })`; o aviso traz "Desfazer" por 10 segundos.
- **Benefícios.** Clique errado deixa de custar dado; a pergunta diz o que será afetado; o texto do botão diz a
  ação, não "Confirmar".
- **Referência.** Material Design 3, diálogos e ações destrutivas.

### 3.5 Fluxo longo que sobrevive à interrupção

- **Descrição.** Os oito fluxos de várias etapas passam a mostrar progresso, validar por etapa, permitir voltar
  sem perder dado e guardar rascunho com retomada explícita.
- **Exemplo prático.** A cotação multicanal (19 campos em estados separados hoje) passa a um estado de fluxo
  único, salvo ao sair; ao reabrir, "Continuar de onde parou" ou "Começar de novo".
- **Benefícios.** Operação interrompida por ligação ou queda de sinal não recomeça; erro no meio não zera o
  que já estava pronto.
- **Referência.** Material Design 3, fluxos com etapas e salvamento de progresso.

### 3.6 Medir a navegação no canal que já existe

- **Descrição.** O app já grava telemetria em banco e tem painel administrativo. Falta registrar navegação:
  troca de tela, uso do Voltar e por qual caminho, busca, menu, abandono por etapa, erro por campo.
- **Exemplo prático.** O provedor de navegação chama `logTelemetry({ category: "nav_back", metadata: { from, to, origem: "header" } })`; o painel mostra uso do Voltar por tela e abandono por etapa, separando celular e computador.
- **Benefícios.** As próximas decisões de navegação saem de dado, não de opinião; dá para comparar antes e
  depois de cada fase.
- **Referência.** Nielsen Norman Group, métricas de usabilidade (taxa de conclusão, tempo de tarefa, erro).

## 4. Riscos

| Risco | Onde | Mitigação |
| --- | --- | --- |
| Tirar o remount por rota expõe estado que hoje é limpo por acidente | 012 | Fazer junto com a migração para rota de layout, em lotes de 10 telas, testando as principais |
| Mover as 55 páginas para uma rota de layout é um diff grande | 008–010 | Três lotes, cada um com sua PR; nenhum lote mistura outra mudança |
| Colocar filtro no endereço muda links e favoritos existentes | 169–176 | Parâmetro ausente mantém o padrão atual; nada quebra sem parâmetro |
| Dar rota a entidade (entrega, coleta) exige permissão por registro | 068–070 | Conferir regras de acesso por linha antes de expor o endereço |
| Rascunho de fluxo pode guardar dado pessoal no navegador | 090–092 | Rascunho sem documento nem telefone em armazenamento local; o resto fica no banco |
| Rotação liberada no tablet pode quebrar telas pensadas em retrato | 156 | Revisar as cinco telas de campo antes de publicar |
| Telemetria de navegação aumenta escrita no banco | 194 | Um registro por navegação (hoje são até sete), com amostragem se o volume crescer |

## 5. Premissas (confirmar)

- P1 — A navegação fica em português; nomes como "Audit Trail" e "Nexus" podem ser traduzidos ou mantidos como marca, à escolha do dono.
- P2 — Entrega, coleta e ocorrência podem ter endereço próprio compartilhável entre usuários com permissão.
- P3 — O dono autoriza criar uma conta de teste no ambiente de produção; a criação em si é execução minha, via MCP.
- P4 — Cinco operadores reais podem participar de uma rodada de revisão ao fim do plano.
- P5 — O painel administrativo de telemetria é o lugar certo para as métricas de navegação, sem ferramenta nova.

---

## Fase 1 — Fundação: registro único de rotas e shell que não remonta (001–020)

Sem esta fase, toda melhoria de navegação é aplicada em quatro lugares diferentes e some a cada clique.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 001 | Registro único de rotas | `src/lib/routes.ts`: uma entrada por rota com `path`, `label`, `section`, `icon`, `requiresAdmin`, `mobile`, `parent`, `description`. Fonte de verdade para App, sidebar, bottom nav, breadcrumb, header, busca e título | O arquivo cobre as 61 rotas de `src/App.tsx:119-181` |
| 002 | Rotas geradas do registro | `src/App.tsx` monta `<Route>` a partir do registro (mantendo o `lazy` por página) em vez de 61 blocos manuais | Rota nova exige mudar só `routes.ts` |
| 003 | Sidebar gerada do registro | `AppSidebar.tsx:84-201` passa a renderizar as seções do registro; some a lista manual de 55 itens | Item só aparece se existir no registro |
| 004 | Bottom nav gerada do registro | `MobileBottomNav.tsx:44-101` (4 na barra + 17 no painel "Mais" = 21 rotas) passa a usar o registro com filtro `mobile`/`requiresAdmin`; a sidebar expõe 54 rotas | Nenhuma rota fica inacessível no celular (hoje ~33 ficam) |
| 005 | Um label por rota | Apagar `routeLabels` de `useNavigationHistory.tsx:13-54` (39 entradas, o mapa vivo) e o de `Breadcrumbs.tsx:34-79` (44 entradas, nunca lido); todos leem `routes.ts` | `grep -rn "routeLabels" src` só acha `routes.ts` |
| 006 | Labels das rotas faltantes | Cobrir as rotas sem label — `/painel-sla` (`App.tsx:156`), `/exportacao` (`:177`), `/config-frete` (`:176`), `/webhooks` (`:171`), `/logistica-reversa` (`:148`), `/cotacao-multicanal` (`:153`), `/api-docs` (`:165`), `/rate-limit` (`:169`), `/rastreamento/:id` (`:163`) e as demais fora das 39 do mapa — hoje `/painel-sla` vira o título "PAINEL-SLA" | Nenhum breadcrumb ou título mostra slug cru |
| 007 | Rota com parâmetro legível | `/rastreamento/:id` → label "Rastreamento" + código curto, não o UUID | Breadcrumb da página de rastreio mostra o código da entrega |
| 008 | Layout route única | `MainLayout` vira rota pai com `<Outlet/>`; as 55 páginas param de importar `MainLayout` (lote 1: 15 páginas) | Sidebar e header montam uma vez só |
| 009 | Layout route — lote 2 | 20 páginas seguintes | — |
| 010 | Layout route — lote 3 | 20 páginas restantes | `grep -rl "<MainLayout" src/pages` vazio |
| 011 | Páginas órfãs no shell | `PainelSLA.tsx:297` e `ExportacaoDados.tsx:292` renderizam sem sidebar, header, breadcrumb ou Voltar (o mesmo nos retornos de carregamento, `:279` e `:274`): envolver em `<MainLayout>` agora, como as outras 55 — sem esperar a rota de layout das etapas 008–010, que as absorve depois | As duas ganham o shell e nenhum "beco sem saída" permanece |
| 012 | Fim do remount por rota | Remover `key={location.pathname}` (`App.tsx:116`), que hoje remonta o shell inteiro e zera `collapsed` e `openSection` da sidebar (`AppSidebar.tsx:203,220`); se precisar de animação de troca, aplicá-la ao conteúdo | Estado do shell sobrevive à navegação |
| 013 | Histórico em provider único | `useNavigationHistory` é chamado em 7 lugares (`App.tsx:111`, `Header.tsx:38`, `MobileBottomNav.tsx:109`, `PageBackButton.tsx:19`, `Breadcrumbs.tsx:137`, `RecentlyVisited.tsx:17`, `PageTransition.tsx:36`) e cada instância tem sua própria pilha e seu próprio `directionRef` (`:66,:68`); virar `NavigationProvider` montado uma vez, com os demais consumindo o contexto | Todas as superfícies leem o mesmo histórico |
| 014 | Um `page_view` por navegação | O `insert` em `security_events` (`useNavigationHistory.tsx:109-121`, dentro do efeito que começa em `:70`) roda em cada instância montada, multiplicando registros por navegação; mover para o provider | Uma linha por navegação, conferida por query |
| 015 | Estado da sidebar persistente | `AppSidebar.tsx:203` usa `useState(false)`; persistir (ou adotar o `SidebarProvider` de `ui/sidebar.tsx`, que já traz cookie `sidebar:state` e atalho Ctrl+B em `:21,:26` e hoje só é re-exportado pelo barril, sem nenhum consumidor) | Recarregar mantém a sidebar como o usuário deixou |
| 016 | Título da aba por rota | Só 2 páginas setam `document.title`; o provider passa a definir `"<label> · Loggi Flow"` a partir do registro | Histórico e abas do navegador ficam legíveis |
| 017 | Item ativo e seção aberta | Seção da sidebar abre conforme a rota atual (acordeão exclusivo hoje fecha o contexto); `aria-current="page"` no item ativo em desktop e mobile | Usuário vê onde está nas duas superfícies |
| 018 | Itens sem permissão não aparecem | Filtrar por `requiresAdmin` (hoje `/seguranca` na bottom nav e "Auditoria Nexus" na sidebar aparecem para todos e levam a redirect mudo) | Usuário comum não vê link que não pode abrir |
| 019 | Redirect sem permissão explicado | `ProtectedRoute.tsx:29-31` troca o `<Navigate to="/" replace>` silencioso por página 403 com explicação e dois caminhos (voltar / ir ao início) | Admin ausente vê motivo, não um salto inexplicado |
| 020 | Duplicatas e nomes divergentes | `/audit-trail` está em duas seções (`AppSidebar.tsx:163` e `:194`); "Coletas Compras" vs "Coletas", "Executivo" vs "Dashboard Executivo", "Dashboard SLA" vs "Painel SLA" | Um destino, um nome, em todas as superfícies |

## Fase 2 — Botão Voltar: um padrão, comportamento previsível (021–044)

Hoje há quatro controles de voltar simultâneos, dois atalhos Alt+← somados e `window.history.length` como critério.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 021 | Decisão registrada | ADR `docs/adr/0016-navegacao-voltar.md`: desktop = Voltar no header (sempre visível, desabilitado só na raiz); mobile = slot fixo na bottom nav + gesto nativo; nunca dois no mesmo viewport | Dono aprova o padrão |
| 022 | `goBack` confiável | No provider: usa a pilha interna do app; sem entrada anterior, vai para o `fallbackPath` da rota (pai no registro) ou `/`; nunca `window.history.length > 2` (`useNavigationHistory.tsx:134`, repetido em `useKeyboardShortcuts.ts:69`) | Deep link direto + Voltar leva ao pai, não para fora do app |
| 023 | Um atalho Alt+← | Remover o listener de `Header.tsx:44-52` e deixar só `useKeyboardShortcuts.ts:66-73`, que segue com a lógica atual; ligá-lo ao `goBack` do provedor é a etapa 022, não condição desta | Alt+← volta uma página, não duas |
| 024 | Login sem armadilha | `Auth.tsx:68,142,148,189` usa `navigate("/")` sem `replace`, deixando `/auth` no histórico | Depois de entrar, Voltar não cai na tela de login |
| 025 | Voltar do header | Único controle no desktop: ícone `ArrowLeft`, `aria-label` dinâmico ("Voltar para Envios"), tooltip com o destino, nunca escondido | Posição fixa em todas as 61 rotas |
| 026 | `PageBackButton` resolvido | Ou vira `hidden md:flex` sem duplicar o header, ou é removido; a prop `fallbackPath` declarada e nunca lida (`PageBackButton.tsx:8`) passa a funcionar | Um só Voltar por viewport |
| 027 | Voltar no mobile | Bottom nav mantém "Início" fixo e o Voltar sai do slot rotativo (hoje "Início" desaparece fora da raiz, `MobileBottomNav.tsx:150-165`) | Usuário sempre acha o início no celular |
| 028 | Gesto de borda | `useTouchGestures.ts:33-37` dispara `navigate(-1)` na faixa 0–40px, a mesma do gesto nativo, protegido apenas por `pathname !== "/"` (`:34`): usar `goBack` com fallback, desligar onde o gesto nativo já existe e tirar `location` das dependências (`:50`), que hoje reinscreve os ouvintes a cada rota | Um swipe = um voltar |
| 029 | Voltar no 404 | `NotFound.tsx:119-127` usa `navigate(-1)` cru, que não faz nada em acesso direto: usar `goBack`, oferecer início e busca | 404 nunca fica sem saída |
| 030 | Voltar no ErrorBoundary | `ErrorBoundary.tsx:40-45` faz `history.back()` + reset em 100ms e pode voltar ao próprio erro; checar histórico e cair em `/` | "Voltar ao Seguro" nunca repete a tela quebrada |
| 031 | Ícone e texto padronizados | `ArrowLeft` para rota (`PageBackButton.tsx:40`, `Header.tsx:112`, `MobileBottomNav.tsx:151`, `NotFound.tsx:125`), `ChevronLeft` só para passo de wizard (hoje em `ErrorBoundary.tsx:93` e `OnboardingWizard.tsx:349`); texto "Voltar para <destino>" legível (hoje há "Voltar para Central_Node", `RastreamentoRealTime.tsx:251`) | Nenhuma variação fora do padrão |
| 032 | Voltar em páginas de detalhe | Páginas com pai claro (`/rastreamento/:id`, `admin/*`, `conciliacao/*`, `cotacao-multicanal/*`, `dashboard-cotacoes/*`) declaram `parent` no registro e o Voltar usa esse destino | Voltar leva ao pai, não a uma tela aleatória |
| 033 | Voltar com filtro preservado | Voltar para uma listagem restaura filtro, página e ordenação (depende da Fase 9) | Volta para a mesma linha que o usuário estava vendo |
| 034 | Voltar de wizard | Dentro de fluxo multi-etapa, Voltar recua uma etapa, não sai do fluxo; sair pede confirmação (Fase 5) | Nenhum passo perdido por engano |
| 035 | Voltar fecha modal | Com o estado do modal na URL (Fase 4), Voltar fecha o modal em vez de sair da página | Voltar com modal aberto nunca "pula" a tela |
| 036 | Direção da animação | `PageTransition.tsx:36-39` lê `direction`, mas sua instância do hook tem `directionRef` próprio (`useNavigationHistory.tsx:68,144`) e recebe sempre `"none"`; com o provider (013), a animação passa a seguir ir/voltar | Transição comunica o sentido da navegação |
| 037 | Estado desabilitado coerente | Hoje `PageBackButton.tsx:21` retorna `null` quando não pode voltar e `Header.tsx:105` renderiza o botão desabilitado com `opacity-30`; um só comportamento | Não há botão fantasma em nenhuma tela |
| 038 | Voltar após salvar | Depois de salvar, ir para a listagem com `replace`, para o Voltar não reabrir o formulário enviado | Voltar após salvar não ressubmete nem confunde |
| 039 | Voltar na busca | Resultado da busca abre o destino e o Voltar retorna à tela de origem, não à busca vazia | Fluxo de busca sem loop |
| 040 | Voltar em links externos | `window.open` para etiqueta, comprovante e rastreio do parceiro em nova aba (com `noopener`), para o contexto não ser perdido | Nenhum link externo rouba a aba do app |
| 041 | Voltar no rastreio público | `/rastrear` (rota pública) oferece retorno coerente para quem não está logado | Cliente final não fica preso na tela |
| 042 | Voltar com sessão expirada | `SessionTimeoutWarning` guarda a rota atual; após reautenticar, volta para onde estava | Expirar a sessão não joga o usuário para o início |
| 043 | Testes do Voltar | `src/components/layout/__tests__`: Alt+← volta uma vez; deep link + Voltar vai ao pai; raiz desabilita; modal fecha antes de sair | Suíte cobre os 4 cenários |
| 044 | E2E do Voltar | Playwright: login → listagem → detalhe → Voltar → mesma linha e filtro; mobile: swipe e bottom nav | Cenário verde em chromium e mobile |
## Fase 3 — Histórico, breadcrumbs e orientação (045–062)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 045 | Breadcrumb hierárquico de verdade | `Breadcrumbs.tsx:82-129` define pai apontando para página irmã (Operações → `/envios`, Financeiro → `/custos`, Gamificação → `/ranking`); passar a usar `section` e `parent` do registro | Trilha reflete a estrutura do menu |
| 046 | Seção sem link falso | Crumb de seção vira texto (ou link para um hub real, se existir) em vez de apontar para uma das páginas da seção | Clicar na trilha nunca leva a lugar inesperado |
| 047 | Categorias alinhadas à sidebar | Divergências como `/central-rastreamento` em "Operações" no breadcrumb e "Rede Logística" na sidebar desaparecem com o registro único | Mesma hierarquia nas duas superfícies |
| 048 | Histórico fora do breadcrumb | Hoje o último item do breadcrumb é um dropdown de histórico, concorrendo com o do header e com `RecentlyVisited`; deixar a trilha só como trilha | Breadcrumb mostra onde o usuário está, não onde esteve |
| 049 | Um só lugar para "visitados recentemente" | Consolidar o dropdown do header, o do breadcrumb e `RecentlyVisited.tsx` numa fonte do provider, com limite e deduplicação | Uma lista, coerente em qualquer tela |
| 050 | Histórico que sobrevive a recarga | `recentPages` persistido por usuário, limpo no `signOut` (hoje fica no `localStorage` após sair) | Trocar de usuário não herda histórico alheio |
| 051 | Breadcrumb no mobile | Trilha compacta (último pai + atual) em vez de esconder; sem quebra de linha em 360px | Em celular o usuário sabe em que ramo está |
| 052 | "Voltar ao topo" que aparece | `ScrollToTop.tsx:11,23` escuta `window.scrollY` e rola `window`, mas o contêiner rolável é `<main id="main-content">` (`MainLayout.tsx:85-86`): o botão **nunca aparece** hoje. Passar a observar o elemento certo | Botão surge após rolar a listagem e leva ao topo |
| 053 | Posição de scroll por rota | `ScrollRestoration` guarda a posição num `Map` em memória e compara com um `useRef` que o remount por rota (`App.tsx:116`) já recria com a rota nova: a posição **nunca é salva**. Corrigir junto com a etapa 012 e persistir por sessão | Voltar para uma lista longa retoma a posição |
| 054 | Foco anunciado na troca de rota | A restauração foca o primeiro `h1` (`ScrollRestoration.tsx`), mas muitas páginas não têm `h1` visível: garantir `h1` por página via `PageHeader` (hoje em 3 páginas) | Leitor de tela anuncia a tela nova em todas as rotas |
| 055 | `PageHeader` em todas as páginas | Componente único com título, descrição, ações e slot de breadcrumb; adotado em lote (20 páginas) | Cabeçalho igual em toda a aplicação |
| 056 | `PageHeader` — lote 2 | 20 páginas seguintes | — |
| 057 | `PageHeader` — lote 3 | Páginas restantes; `document.title` sai do mesmo título | 61/61 rotas com cabeçalho e título coerentes |
| 058 | Landmarks sem duplicação | `MainLayout.tsx:73-79` tem `<aside>` envolvendo outro `<aside>` (`AppSidebar.tsx:233`, fecha em `:559`); a `<nav aria-label="Navegação breadcrumb">` do layout envolve outra `nav aria-label="Breadcrumb"` (`Breadcrumbs.tsx:169-174`); e `AppSidebar.tsx:322` tem `nav` sem nome | Um landmark por região, com nome único |
| 059 | Skip link que funciona | O terceiro link aponta para `id="search"` (`SkipLinks.tsx:11`), que não existe em nenhum elemento, e a função falha em silêncio; dar o id ao campo de busca do header ou remover o link | Os três atalhos levam a destinos reais |
| 060 | Skip link com link real | `SkipLinks.tsx:28-46` usa `<Button onClick>` com `getElementById`/`scrollIntoView` em vez de `<a href="#id">`: trocar por âncora real, que o leitor de tela anuncia como atalho | Tab inicial oferece atalho navegável por teclado |
| 061 | Mapa do site | Página `/mapa` (ou painel) gerada do registro, com busca e agrupamento: saída para quem se perdeu e inventário para o time | Usuário encontra qualquer tela em um lugar |
| 062 | Estado vazio que ensina o caminho | `EmptyState`/`EmptyStatePresets` com ação primária e link para a tela relacionada nas 10 listagens principais | Tela vazia sempre oferece o próximo passo |
## Fase 4 — Modais, painéis e ações irreversíveis (063–084)

Hoje o app tem 53 arquivos com `Dialog`, nenhum estado de modal na URL, 1 única rota com parâmetro (`/rastreamento/:id`), e um `ConfirmProvider` pronto que ninguém usa.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 063 | Regra escrita: modal ou rota | ADR: modal só para tarefa curta (confirmar, editar um campo, filtrar); tudo que se compartilha, imprime ou dura mais que um minuto vira rota | Dono aprova o critério |
| 064 | Modal no endereço | `useDialogParam('novo-cliente')`: abrir grava `?dialog=`, fechar remove; Voltar fecha o modal e Atualizar reabre | Padrão disponível para as 53 telas |
| 065 | Modais principais no endereço — lote 1 | Clientes, Fornecedores, Transportadoras (criar e editar) | Link de "editar cliente X" pode ser colado no chat |
| 066 | Lote 2 | Envios, Coletas, Ocorrências | — |
| 067 | Lote 3 | Fretes internos, Configurações de frete, Melhor Envio | — |
| 068 | Detalhe de entrega com rota | Entrega passa a ter `/entregas/:id` (hoje só existe `/rastreamento/:id`): compartilhável, indexável no histórico, com Voltar para a listagem | Operador manda o link da entrega para o cliente |
| 069 | Detalhe de coleta com rota | `/coletas/:id` nos mesmos termos | — |
| 070 | Detalhe de ocorrência com rota | `/ocorrencias/:id` nos mesmos termos | — |
| 071 | Confirmação única | `ConfirmProvider` existe completo (inclui exigir digitação e contagem regressiva) mas **não está montado** em `App.tsx:186-205`, e `useConfirm` lança exceção sem ele (`ConfirmProvider.tsx:188`): montar o provedor e adotá-lo como único caminho | Primeiro uso de `useConfirm` funciona; `AlertDialog` solto sai dos 16 arquivos |
| 072 | Toda exclusão confirma | Hoje excluem em um clique, sem nenhum diálogo: `AlertasCusto.tsx:549`, `Notificacoes.tsx:353`, `ConfiguracoesFrete.tsx:967`, `WebhookManager.tsx:92`, `ScheduledReportsManager.tsx:339`, `AdminADR.tsx:283` (exclusão física) e a ação em lote de `Notificacoes.tsx:282` (`.delete().in(...)`, `:170-178`). Todas passam pelo `useConfirm`, com o nome do registro no texto | Nenhuma exclusão em um clique |
| 073 | Exclusão com desfazer `[AVALIAR]` | Onde a exclusão é lógica (`deleted_at`), o aviso de sucesso oferece "Desfazer" por 10 segundos. Levantar e decidir caso a caso as exclusões físicas: notificações (`Notificacoes.tsx:143-179`), decisões de arquitetura (`AdminADR.tsx:99-105`), alertas de custo (`useCostAlerts.tsx:273`), regras de frete (`ConfiguracoesFrete.tsx:139-145`), webhooks de cliente (`useClientWebhooks.tsx:92-95`) e relatórios agendados (`scheduled-reports/index.ts:55`) — cada uma vira exclusão lógica (pede coluna nova, decisão do dono) ou fica só com a confirmação da 072, registrado na tabela do plano | Cada exclusão tem destino escrito: desfazer ou confirmação, nada implícito |
| 074 | Ações em lote conferem | `BulkActions` mostra quantos e quais registros serão afetados antes de executar | "Excluir 37 selecionados" diz o que são |
| 075 | Saída protegida | `useConfirmExit` só registra `beforeunload` (F5 e fechar aba); o trecho de navegação interna é um comentário vazio (`useConfirmExit.ts:21-26`), então clicar no menu descarta o formulário em silêncio. Implementar o bloqueio de navegação interna — e `useBlocker` **não serve** enquanto o app usa `BrowserRouter` (`App.tsx:193`), que não é roteador de dados: ou migrar para `createBrowserRouter` (decisão de arquitetura, `[AVALIAR]`) ou interceptar na saída, cobrindo também os `NavLink` do menu (`AppSidebar.tsx:371,418`) e da barra inferior, não só as chamadas a `navigate` | Clicar no menu ou na barra inferior com formulário sujo pergunta antes |
| 076 | Esc e clique fora conscientes | Não existe **nenhum** `onEscapeKeyDown`/`onInteractOutside`/`onPointerDownOutside` no `src` inteiro: todo modal de formulário descarta o preenchido em silêncio (ex.: `Clientes.tsx:916-941`, `PickupDialog.tsx:201,456`). Formulário sujo passa a pedir confirmação; leitura fecha direto | Ninguém perde um formulário por um clique no fundo |
| 077 | Modal com nome acessível | 5 `DialogContent` sem `DialogTitle` (entre eles `OnboardingWizard`, `WelcomeModal`, `LevelUpModal`, `ImageUploader`): título visível ou `VisuallyHidden` | Radix para de avisar e o leitor de tela anuncia o diálogo |
| 078 | Sem modal sobre modal | Mapear os casos de diálogo aninhado e trocar por etapa dentro do mesmo painel | Nenhuma pilha de dois modais |
| 079 | Painel de detalhe no lugar de modal grande | `DetailSheet` (existe, sem uso) para visualizações longas, com largura confortável e scroll interno | Detalhe deixa de caber mal num modal central |
| 080 | Modal utilizável no celular | Diálogos em tela cheia abaixo de `sm`, com cabeçalho fixo, rodapé de ações sempre visível e scroll interno | Ações não ficam fora da tela no celular |
| 081 | Foco e retorno | Foco inicial no primeiro campo (não no botão de fechar) e retorno ao gatilho ao fechar | Teclado volta de onde saiu |
| 082 | Ações destrutivas distinguíveis | Botão destrutivo com rótulo que diz a ação ("Excluir cliente"), nunca só "Confirmar"; ação primária à direita, consistente | Usuário lê o que vai acontecer antes de clicar |
| 083 | Erro dentro do modal | Falha de salvamento aparece no próprio modal, preservando o que foi digitado, em vez de só um toast que desaparece | Nenhum formulário perdido por erro de rede |
| 084 | Testes de modal | Voltar fecha; Atualizar reabre; Esc com dados pede confirmação; foco retorna ao gatilho | Quatro casos verdes nas telas do lote 1 |
## Fase 5 — Fluxos de várias etapas, rascunho e retomada (085–106)

O app tem `Stepper` e `StepProgress`, usados por duas páginas (`CotacaoMultiCanal`, `ImportacaoMassa`), enquanto 11 arquivos controlam etapas com `useState` solto e nenhum fluxo salva rascunho.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 085 | Inventário dos fluxos | Mapear os fluxos de mais de uma etapa (cotação multicanal, importação em massa, coleta, conferência de coleta, onboarding, MFA, reset de senha, conciliação) com etapas, campos e saídas | Documento com os 8 fluxos e seus passos |
| 086 | Um componente de etapas | Padronizar em `Stepper`: numeração, etapa atual, etapas concluídas, clique para voltar a etapa anterior | Os 8 fluxos usam o mesmo componente |
| 087 | Progresso sempre visível | Cada fluxo mostra "etapa 2 de 4" e o que falta, inclusive no celular | Usuário sabe quanto falta antes de começar |
| 088 | Validação por etapa | Avançar valida apenas a etapa atual e mostra o erro no campo, não um toast genérico ao final | Erro aparece onde o usuário pode corrigir |
| 089 | Voltar sem perder dados | Voltar uma etapa preserva o que foi digitado; os 19 campos de `CotacaoMultiCanal` (`useState` individual) passam para um estado de fluxo único | Ir e voltar entre etapas não apaga nada |
| 090 | Rascunho da cotação | Estado da cotação salvo em armazenamento que sobrevive ao fechamento da aba (local, por usuário, com validade e limpeza no logout; `sessionStorage` morre com a aba e não serve) e no banco para o que já foi enviado, com retomada ao reabrir | Fechar a aba e voltar depois recupera a cotação |
| 091 | Rascunho da coleta | Mesmo tratamento para o agendamento de coleta, sem guardar documento nem telefone no navegador | Rascunho volta sem levar dado pessoal para o aparelho |
| 092 | Rascunho da importação | Arquivo e mapeamento de colunas preservados entre etapas e entre sessões | Importação de 2.000 linhas não recomeça do zero |
| 093 | Retomada explícita | Ao reabrir um fluxo com rascunho: "Continuar de onde parou" ou "Começar de novo", nunca restaurar em silêncio | Usuário escolhe, não é surpreendido |
| 094 | Sair pede confirmação | Qualquer navegação para fora de um fluxo com dados pede confirmação, usando o mesmo `useConfirm` | Nenhum fluxo abandonado por clique no menu |
| 095 | Falha no meio do fluxo | Erro em uma etapa mantém as anteriores concluídas e oferece repetir só a que falhou (hoje `CotacaoMultiCanal` só mostra `toast.error`) | Falha de rede não zera o progresso |
| 096 | Progresso de operação longa | Disparo multicanal e importação mostram progresso real por item, com contagem de sucesso e falha, e permitem acompanhar sem travar a tela | Operação de 50 itens é acompanhável |
| 097 | Operação longa cancelável | Cancelar interrompe o que ainda não foi enviado e informa o que já saiu | Usuário interrompe sem medo |
| 098 | Resultado ao concluir | Tela de conclusão com o que foi criado, link para o registro e próxima ação sugerida, em vez de só voltar para a lista | Fim do fluxo tem destino claro |
| 099 | Conclusão sem reenvio | Após concluir, navegar com `replace` e invalidar as queries afetadas | Voltar não reenvia o formulário |
| 100 | Conferência de coleta no celular | `PickupConference` revisada para uso em pé, com alvos grandes e leitura de QR sem sair do fluxo | Conferência feita no pátio sem travar |
| 101 | Onboarding retomável | `OnboardingWizard`/`OnboardingChecklist` guardam a etapa por usuário e podem ser retomados do checklist | Usuário novo volta para onde parou |
| 102 | Onboarding dispensável | Fechar o onboarding é possível e lembrado; o checklist segue acessível no menu | Ninguém fica preso no tour |
| 103 | MFA com saída segura | `MFAEnroll` avisa o que acontece se sair no meio e oferece reiniciar | Nenhuma conta meio configurada por engano |
| 104 | Reset de senha coerente | `/aprovacao-reset-senha` e as telas de recuperação seguem o mesmo padrão de etapas e Voltar | Fluxo de senha igual ao resto do app |
| 105 | Conciliação com rascunho real | O status "rascunho" de conciliação ganha retomada na interface (hoje só existe no dado) | Conciliação longa é feita em duas sessões |
| 106 | Testes dos fluxos | Para cada fluxo: avançar, voltar sem perder dado, sair com confirmação, retomar rascunho | Quatro casos por fluxo, verdes |
## Fase 6 — Feedback visual, transições e estados (107–130)

O app já tem `GlobalLoadingBar`, `ScrollRestoration`, `PageTransition` e `EmptyState` (31 páginas). O que falta é coerência: dois sistemas de aviso (133 importações de um, 19 de outro), 268 avisos de erro — 83 começando com "Erro" sem dizer o quê —, `Skeleton` em 4 páginas e nenhuma atualização otimista.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 107 | Um sistema de aviso | Migrar os 19 usos do aviso antigo para o atual e remover o segundo `Toaster` de `App.tsx:191`; um lugar define posição, duração e estilo | Dois avisos nunca mais aparecem empilhados |
| 108 | Mensagem de erro que informa | Catálogo de mensagens: o que falhou, por que e o que fazer; substitui os 83 "Erro ao..." sem detalhe, começando pelas 10 telas mais usadas | Usuário sabe se deve tentar de novo ou chamar suporte |
| 109 | Mensagem de erro — lote 2 | Demais telas e hooks | Nenhum aviso de uma palavra |
| 110 | Erro de rede diferenciado | Sem conexão, tempo esgotado e erro do servidor têm mensagens e ações distintas (tentar de novo, aguardar, avisar suporte) | Queda de rede deixa de parecer bug do sistema |
| 111 | Erro com identificador | Falha inesperada mostra um código curto que também vai para o monitoramento, para o suporte achar o caso | Suporte localiza o erro pelo código que o usuário leu |
| 112 | Componente de erro de tela | Criar `ErrorState` (hoje não existe) com título, explicação, "tentar de novo" e caminho alternativo | Disponível para as 30 páginas sem estado de erro |
| 113 | Estado de erro nas listagens | Adotar nas 10 listagens principais | Tela com falha mostra o que houve e o botão de repetir |
| 114 | Estado de carregamento igual | `Skeleton` com a forma do conteúdo real (tabela, cartão, gráfico) nas 20 telas mais lentas; nunca a tela saltar do vazio para o cheio | Sem "pisca" na entrada das telas |
| 115 | Carregamento de ação | Botão que dispara requisição mostra pendência e bloqueia duplo clique em todos os formulários | Nenhum envio duplicado por clique ansioso |
| 116 | Atualização otimista nas ações rápidas | Hoje não há nenhuma (`onMutate` não aparece no código): aplicar em marcar como lido, favoritar, mudar status no kanban, com reversão em caso de falha | Ação rápida responde na hora |
| 117 | Confirmação visível do que mudou | Após salvar, destacar a linha alterada na lista por alguns segundos, em vez de só um aviso que passa | Usuário vê o efeito, não só a mensagem |
| 118 | Transição coerente | `PageTransition` está em 4 páginas e não produz animação nenhuma: o `AnimatePresence mode="wait"` (`PageTransition.tsx:63`) nunca vê a saída porque a árvore é descartada pelo `key` de `App.tsx:116`. Decidir: animar no lugar certo (após a etapa 012) ou remover o componente | Navegação tem o mesmo ritmo, ou nenhuma animação fingida |
| 119 | Movimento respeita a preferência | `ReducedMotion.tsx:59-62` grava `data-reduce-motion` no documento e **nada lê**: não há `@media (prefers-reduced-motion)` em `src/index.css` nem consumidor do dado. Criar a regra de CSS e ligar as animações a ela | Transições e brilhos param com a preferência do sistema |
| 120 | Uma barra de navegação, honesta | São **duas** ao mesmo tempo: `NavigationProgressBar` (`App.tsx:194`) e `GlobalLoadingBar` (`MainLayout.tsx:68`), ambas com progresso falso por temporizador (150 ms e 500 ms). Manter uma e ligá-la ao carregamento real da rota e dos dados | Uma barra, aparecendo quando há espera de verdade |
| 121 | Anúncio da troca de tela | `useRouteAnnouncer` (`LiveRegion.tsx:72`) existe e não tem consumidor; e o foco que `ScrollRestoration` manda para o `h1` é buscado antes do conteúdo lazy resolver. Ligar o anunciador ao provedor de navegação e focar após a resolução | Leitor de tela anuncia a tela nova em todas as rotas |
| 122 | Volta ao topo previsível | Entrar numa tela nova começa no topo; voltar retoma a posição anterior (regra única, sem salto duplo) | Nenhuma tela abre no meio sem motivo |
| 123 | Aviso de offline útil | `OfflineBanner` informa o que ainda funciona e o que está em fila (apoiado na fila de operações pendentes) | Usuário em área sem sinal sabe o que esperar |
| 124 | Fila de pendências visível | Tela ou painel que mostra operações aguardando conexão, com reenviar e descartar | Nada fica "salvo" sem o usuário saber |
| 125 | Atualização de versão discreta | `UpdatePrompt` avisa que há versão nova sem interromper a tarefa, e aplica no próximo momento seguro | Atualização não derruba formulário aberto |
| 126 | Convite para instalar no momento certo | `InstallPrompt` só após uso recorrente, dispensável e lembrado | Nenhum convite no primeiro minuto |
| 127 | Alvos e foco visíveis | Contorno de foco visível em todos os controles de navegação (menu, Voltar, trilha, bottom nav), inclusive em fundo escuro | Navegação por teclado é visível em qualquer tema |
| 128 | Resposta ao toque | Retorno visual imediato em item de menu, linha de tabela e botão no celular (sem esperar a rota trocar) | Toque nunca parece ignorado |
| 129 | Contraste nos elementos de navegação | Revisar os textos minúsculos e os cinzas de baixo contraste usados na trilha, no menu e nos rótulos da bottom nav | Elementos de navegação passam na verificação de contraste |
| 130 | Testes de estado | Para as 10 telas principais: carregando, vazio, erro e cheio renderizam o componente certo | Quatro estados verdes por tela |
## Fase 7 — Teclado, busca e atalhos (131–148)

Hoje existem dois diálogos de busca montados ao mesmo tempo, ambos escutando Ctrl+K, e os atalhos globais disparam mesmo quando o usuário está digitando.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 131 | Uma busca só | `GlobalSearch` (`Header.tsx:172`) e `SearchCommand` (`MainLayout.tsx:125`) são dois diálogos sobre o mesmo `useGlobalSearch`, ambos registrando Ctrl+K (`GlobalSearch.tsx:43`, `SearchCommand.tsx:36`); pior, `SearchCommand` também renderiza um **botão de busca em fluxo** (`:64-73`) no fim do shell, solto na tela. Manter um, remover o outro | Ctrl+K abre uma busca e não há botão órfão na página |
| 132 | Atalho não dispara ao digitar | `useKeyboardShortcut` (`useKeyboardShortcuts.ts:30-60`) não checa o elemento em foco: Alt+N dentro de um campo de texto navega e perde o que foi escrito; ignorar quando o foco está em campo editável | Digitar nunca leva o usuário para outra tela |
| 133 | Atalhos documentados e visíveis | `KeyboardShortcutsHelp` abre por atalho descoberto (hoje a lista vive em `shortcutsList`, `useKeyboardShortcuts.ts:12-19`), com os atalhos reais, incluindo Voltar e busca | Usuário descobre os atalhos sem ler código |
| 134 | Alt+→ coerente | Hoje `navigate(1)` avança no histórico sem checar se há para onde; usar a pilha do provider e desabilitar quando não houver | Avançar nunca é um atalho morto |
| 135 | Busca que abre o registro | A busca encontra a entrega certa e navega para a **lista inteira**: `useGlobalSearch.tsx:283-334` devolve `url: "/envios"` sem id, e o `?highlight=` que `GlobalSearch.tsx:88` monta não é lido em lugar nenhum. Resultado passa a abrir o registro (depende das rotas das etapas 068–070) | Achar pelo número leva ao registro, não à lista |
| 136 | Busca que encontra telas | Além de registros, a busca lista rotas do registro (Fase 1), com seção e permissão respeitadas | "Onde configuro frete?" resolve na busca |
| 137 | Busca no celular e no tablet | O gatilho do cabeçalho é `hidden lg:block` (`Header.tsx:170`), então abaixo de 1024px o único acesso é o botão solto que `SearchCommand` monta no fim do shell (`MainLayout.tsx:120-126`, `SearchCommand.tsx:64-73`) — existe, mas fora de lugar. Ao consolidar a busca (131), substituir esse acesso por um gatilho na barra inferior ou no cabeçalho | Busca alcançável no celular, em lugar previsível |
| 138 | Ações rápidas na busca | Comandos como "nova coleta" e "novo despacho" aparecem na busca, aproveitando o que `GlobalSearch` já faz com tema e sair; e corrigir o filtro do `cmdk`, que refaz a busca pelo título (`SearchCommand.tsx:109`) e esconde o que foi achado por endereço ou código de rastreio | Um lugar para ir a qualquer tela ou ação, sem perder resultado |
| 139 | Navegação por teclado no menu | Setas percorrem itens, Enter abre, Esc fecha seção; foco não escapa para o conteúdo no meio da lista | Menu operável sem mouse |
| 140 | Ordem de tabulação do shell | Sequência: atalhos, menu, busca, cabeçalho, conteúdo; sem armadilha de foco na sidebar colapsada | Tab percorre a tela na ordem visual |
| 141 | Foco visível no escuro | Contorno de foco com contraste suficiente nos dois temas, em menu, trilha, barra inferior e botões de ação | Foco nunca desaparece no fundo escuro |
| 142 | Atalhos sem conflito com o navegador | Revisar Alt+←/→ (navegação nativa) e Ctrl+K (barra de busca em alguns navegadores): documentar a escolha e evitar sequestro silencioso | Nenhum atalho do navegador é quebrado sem aviso |
| 143 | Atalho para o conteúdo | Atalho (e skip link) que leva direto ao conteúdo principal, com foco real no `main` | Teclado pula o menu em um comando |
| 144 | Tabela navegável por teclado | Setas entre linhas, Enter abre o detalhe, Espaço seleciona nas listagens principais | Operador trabalha a fila sem mouse |
| 145 | Atalho de ação na tabela | Em listagem: tecla para novo registro, para exportar e para filtrar, exibidos na ajuda de atalhos | Tarefas repetitivas ficam mais rápidas |
| 146 | Leitor de tela nas listagens | Cabeçalhos associados, contagem de resultados anunciada e mudança de página informada | Lista é compreensível sem ver a tela |
| 147 | Diálogos sem armadilha | Foco preso ao diálogo enquanto aberto, Esc previsível e retorno ao gatilho (complementa a Fase 4) | Teclado nunca fica solto atrás do modal |
| 148 | Testes de teclado | Ctrl+K abre uma busca; Alt+N em campo de texto não navega; Tab segue a ordem; Esc fecha | Quatro casos verdes |
## Fase 8 — Celular, tablet e gestos (149–168)

A barra inferior já trata a área segura do aparelho, mas `ResponsiveTable` (o componente que transforma tabela em cartão) tem **zero** importadores, 13 páginas usam tabela crua e há dois `useIsMobile` com limites diferentes.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 149 | Um só `useIsMobile` | Existem dois: `hooks/ui/use-mobile.tsx` (limite 767px) e `hooks/common/useMediaQuery.ts` (limite 768px), usados por arquivos diferentes; manter um e ajustar o limite ao Tailwind | Nenhuma tela se comporta como celular e desktop ao mesmo tempo |
| 150 | Tabela vira cartão no celular | `ResponsiveTable` existe, já trata o celular (`:47`) e só é citado pelo próprio barril; 38 arquivos montam tabela crua. Adotar nas listagens principais (lote 1: Central de Rastreamento, Dashboard de Cotações, Painel OTIF) | Tabela deixa de exigir rolagem lateral no celular |
| 151 | Tabela vira cartão — lote 2 | Conciliação, Logística Reversa, Exportação, Gerenciamento de Usuários | — |
| 152 | Tabela vira cartão — lote 3 | Demais telas com tabela crua (38 arquivos no total, 13 deles em `src/pages`), a começar por `GerenciamentoUsuarios.tsx:338-346`, com 6 colunas | Nenhuma tabela crua em tela pequena |
| 153 | Coluna essencial primeiro | Em cartão, mostrar o que decide a ação (código, cliente, status, prazo) e esconder o resto atrás de "ver detalhes" | Operador decide sem abrir o registro |
| 154 | Teclado numérico certo | `inputMode` aparece em 2 lugares no `src` inteiro; CNPJ, CEP e telefone são texto livre em `Clientes.tsx:439-441,482-484,513-516` e `Fornecedores.tsx:388-390,431-433,462-465`, abrindo teclado alfabético no celular | Cadastro no celular abre o teclado certo |
| 155 | Alvos de toque adequados | Revisar botões de ícone e linhas clicáveis para o mínimo de 44px em telas de toque | Nenhum alvo pequeno nas telas de campo |
| 156 | Rotação liberada | O manifesto fixa `portrait-primary`; um sistema com tabelas e mapas precisa de paisagem no tablet | Tablet em paisagem usa a tela inteira |
| 157 | Barra inferior com destino coerente | Itens vindos do registro (Fase 1), com rótulo curto, ícone consistente e indicação da tela atual | Usuário sabe onde está na barra |
| 158 | Barra inferior sem cobrir conteúdo | Conferir o espaçamento inferior nas 13 telas com tabela e nos formulários longos | Nenhum botão fica atrás da barra |
| 159 | Ações rápidas revistas | O botão flutuante não cobre ação da tela nem a barra; some ao rolar para baixo e volta ao subir | Botão flutuante deixa de atrapalhar |
| 160 | Formulário longo no celular | Rodapé de ação fixo, rolagem para o campo com erro e teclado que não cobre o campo ativo | Cadastro no celular é concluído sem zoom |
| 161 | Mapa utilizável no celular | Altura adequada, gesto de arrastar que não conflita com a rolagem da página, controles ao alcance do polegar | Mapa deixa de prender a rolagem |
| 162 | Gesto nativo respeitado e mapa livre | Onde o sistema já tem gesto de voltar, não registrar o próprio (etapa 028); e aplicar o `data-no-swipe` que o hook já verifica (`useTouchGestures.ts:13`) e **nenhum elemento usa**, no mapa de `RastreamentoMotorista.tsx:190` e nos mapas de telas internas — na raiz o gesto não navega, por causa da guarda `pathname !== "/"` (`useTouchGestures.ts:34`), então o mapa do painel inicial não é afetado | Um gesto, um voltar; arrastar o mapa de uma tela interna não navega |
| 163 | Gesto para abrir o menu | Deslizar da borda esquerda abre o menu no celular, com a mesma animação do botão | Menu alcançável com uma mão |
| 164 | Rolagem com puxar para atualizar | Nas listagens em celular, puxar para baixo recarrega a consulta e mostra o estado de atualização | Operador atualiza a fila sem procurar botão |
| 165 | Tablet com layout próprio | Entre 769px e 1024px, sidebar em modo ícone e tabela com menos colunas, em vez de herdar o desktop | Tablet deixa de ser um desktop apertado |
| 166 | Leitura de QR sem sair do fluxo | A leitura abre sobre a tela atual e devolve o resultado ao formulário, sem trocar de rota | Conferência não perde o contexto |
| 167 | Teste em aparelho real | Roteiro em celular e tablet (iOS e Android) para os cinco fluxos de campo: coleta, conferência, rastreio, ocorrência e cotação | Roteiro executado com achados registrados |
| 168 | Testes automáticos de viewport | Playwright em 360px (barra inferior visível, menu lateral oculto), 768px e 1280px (menu lateral visível, barra inferior oculta — o corte é `md`, `MobileBottomNav.tsx:119`): em todas, nenhuma rolagem lateral e um Voltar alcançável | Três larguras verdes |
## Fase 9 — Endereço, link direto e várias abas (169–186)

Quase nada do estado da tela está no endereço: 6 usos de parâmetros de URL em 3 páginas, 286 conjuntos de abas com apenas 7 controlados, e o login sempre devolve para a raiz.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 169 | Regra do que vai para o endereço | Filtro, busca, página, ordenação, aba e modal vão para a URL; rascunho de formulário não | Critério escrito e seguido pelos lotes seguintes |
| 170 | Ferramenta de estado na URL | `useUrlState(chave, padrão)` que lê e grava parâmetros sem recarregar nem sujar o histórico (um registro por mudança relevante) | Disponível para as listagens |
| 171 | Filtros no endereço — lote 1 | Envios, Coletas, Ocorrências | Operador manda "a fila de hoje filtrada" por link |
| 172 | Filtros no endereço — lote 2 | Clientes, Fornecedores, Transportadoras | — |
| 173 | Filtros no endereço — lote 3 | Central de Rastreamento, Dashboard de Cotações, Conciliação, Painel OTIF | — |
| 174 | Página e ordenação no endereço | Paginação e ordenação das listagens entram na URL, junto com a Fase 7 do plano anterior (paginação no servidor) | Voltar para uma lista mantém página e ordem |
| 175 | Abas no endereço | Das 286 instâncias de abas, apenas 7 são controladas; migrar as abas das telas principais para `?tab=` | Link abre direto na aba certa |
| 176 | Período no endereço | Seletor de datas dos painéis grava o período na URL | Relatório pode ser compartilhado com o mesmo período |
| 177 | Login devolve ao destino | `ProtectedRoute` não guarda a rota pretendida e `Auth` sempre manda para `/`: gravar o destino e voltar a ele após entrar | Link recebido por e-mail abre a tela certa depois do login |
| 178 | Sessão expirada retoma | `useSessionTimeout.ts:74-76` chama `signOut()` direto quando expira, e o diálogo só existe para o aviso prévio (`SessionTimeoutWarning.tsx:17`): guardar rota e parâmetros, avisar e, ao reautenticar, voltar para onde estava | Expirar não custa o trabalho em andamento |
| 179 | Sessão sincronizada entre abas | Sair em uma aba reflete nas outras (hoje não há `BroadcastChannel` nem escuta de armazenamento) | Sair em uma aba não deixa outra "logada" |
| 180 | Dados frescos ao voltar para a aba | Ao reativar a aba, revalidar o que é sensível a tempo (fila, rastreio, alertas), sem recarregar tudo | Aba esquecida aberta não mostra dado velho |
| 181 | Uma tarefa por aba sem conflito | Duas abas no mesmo registro: avisar quando o dado mudou por outra sessão antes de sobrescrever | Operador não sobrescreve o colega sem saber |
| 182 | 404 que ajuda | A tela de 404 (`NotFound.tsx:112-128`) ganha busca e os destinos mais usados, além de início e Voltar com fallback | Endereço errado vira um caminho, não um beco |
| 183 | Redirecionamentos antigos | Mapa de endereços descontinuados (a começar por `/dashboard`) para as rotas atuais | Link antigo não cai em 404 |
| 184 | Endereços legíveis | Revisar nomes de rota misturando português e inglês (`/despachos`, `/kanban-entregas`, `/audit-trail`, `/db-health`), com redirecionamento do antigo | Endereço diz o que a tela faz |
| 185 | Compartilhar a tela atual | Ação "copiar link desta visão" nas listagens e painéis, incluindo filtros aplicados | Operação combina pelo link, não por descrição |
| 186 | Testes de link direto | Para 10 telas: abrir com parâmetros, atualizar, voltar e avançar mantêm o mesmo estado | Dez casos verdes |
## Fase 10 — Inclusão e preferências que valem para a navegação (187–193)

Existe um painel de preferências completo (densidade, tema, alto contraste, movimento reduzido, tamanho de fonte, fonte para dislexia, idioma), aplicado pelo layout e editável em Configurações. O que falta é essas escolhas valerem nos elementos de navegação.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 187 | Tamanho de fonte vale no shell | As quatro opções de tamanho (`AccessibilitySettings.fontSize`) afetam menu, trilha, barra inferior e cabeçalho, sem cortar texto nem quebrar o layout | Com fonte grande, todo rótulo de navegação continua legível |
| 188 | Alto contraste no shell | A opção de alto contraste muda de verdade os elementos de navegação (hoje o tema de alto contraste tem tokens contraditórios) | Menu e trilha passam na verificação de contraste nos dois temas |
| 189 | Movimento reduzido no shell | A opção de reduzir movimento desliga transições de página, animações de menu, botão flutuante e brilho da barra de carregamento | Nenhum movimento involuntário para quem pediu menos |
| 190 | Densidade aplicada ao menu | As três densidades valem para menu, barra inferior e cabeçalho, não só para tabelas | Operador com tela pequena cabe mais itens |
| 191 | Preferências alcançáveis | O painel só existe dentro de Configurações; levar as opções de acessibilidade também para o menu do usuário no cabeçalho | Ajuste de acessibilidade em dois cliques |
| 192 | Preferências por usuário, não por navegador | Garantir que as escolhas acompanham a conta (e não só o aparelho), com padrão vindo do sistema operacional | Trocar de máquina mantém a configuração |
| 193 | Idioma coerente | A preferência de idioma existe no tipo, mas a interface tem jargão em inglês misturado (nomes de tela, "Audit Trail", "Nexus", "Tactical"): decidir a língua da navegação e aplicar | Usuário não encontra duas línguas na mesma tela |

## Fase 11 — Métricas, validação e iteração (194–200)

Há um canal de telemetria pronto (`useTelemetry` gravando em `telemetry_logs`, com painel administrativo e visualizador), usado hoje para desempenho. É onde as métricas de navegação devem entrar, em vez de uma ferramenta nova.

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 194 | Eventos de navegação | Registrar, pelo provedor: troca de tela, uso do Voltar (e por qual caminho: cabeçalho, barra inferior, gesto, atalho), busca (termo, nº de resultados, escolha), menu e item escolhido — hoje `trackEvent` não existe no `src` e nada disso é medido | Painel mostra por onde as pessoas navegam |
| 195 | Indicadores definidos | Definir e calcular: uso do Voltar por tela, abandono por etapa nos 8 fluxos, tempo até a primeira ação, repetição de clique no mesmo elemento, erro de formulário por campo, conclusão por fluxo | Seis indicadores com consulta pronta |
| 196 | Navegação sai de `security_events` | A navegação é gravada na tabela de eventos de segurança (`useNavigationHistory.tsx:106-120`, severidade baixa), e o painel lê os 200 últimos registros da mesma tabela (`SecurityEventsPanel.tsx:36`; 100 é só o padrão do hook, `useSecurityEvents.ts:57`): o `page_view` empurra os eventos reais para fora da tela. Navegação passa para `telemetry_logs`, e o painel administrativo mostra os indicadores por semana, separando celular e computador | Painel de segurança volta a mostrar segurança; navegação tem painel próprio |
| 197 | Medida antes de mudar | A linha de base exige a etapa 194 primeiro: hoje só existe `page_view` (`useNavigationHistory.tsx:106-121`), que não conta uso do Voltar nem abandono por etapa. Sequência: instrumentar (194), deixar rodar uma semana, registrar os números das telas mais usadas e só então aplicar as fases 1 a 9 | Linha de base registrada com data, já com os eventos novos |
| 198 | Comparação por versão | Como o deploy é contínuo, marcar cada etapa entregue no painel e comparar a semana anterior com a seguinte | Cada fase tem efeito medido, não suposto |
| 199 | Escuta do usuário | Canal curto dentro do app ("algo confuso nesta tela?") que grava a tela, a rota e o comentário no mesmo canal de telemetria | Operação reclama na hora, com contexto |
| 200 | Rodada de revisão | Após as fases, roteiro com cinco operadores reais (três no celular) nos fluxos de coleta, cotação e ocorrência; achados viram a próxima lista de etapas | Relatório com os cinco testes e a lista seguinte |

---

## Ordem recomendada

1. **P1 a P5 primeiro** (etapas 023, 024, 131, 132, 011): cinco correções pequenas que resolvem irritação diária.
2. **001–020**: registro de rotas e shell persistente — base de quase tudo o que vem depois.
3. **021–044**: o Voltar fica previsível.
4. **045–062**: trilha, histórico e orientação.
5. **063–084 e 169–186** juntos: modal e filtro no endereço são a mesma conversa.
6. **085–106**: fluxos longos, onde está o maior desperdício de retrabalho.
7. **107–130 e 149–168**: feedback e celular, em paralelo.
8. **131–148 e 187–193**: teclado e inclusão.
9. **194 e 197 antes de tudo**: instrumentar a navegação e deixar rodar uma semana para ter linha de base; o resto da medição (195, 196, 198–200) acompanha as fases.

## Só o dono pode fazer

- Confirmar as premissas P1–P5.
- Decidir os `[AVALIAR]`: 001 (formato do registro), 156 (rotação no tablet), 184 (renomear endereços), 193 (língua da navegação).
- Aprovar a telemetria de navegação (194) e o painel (196).
- Autorizar a conta de teste usada em 167 e 168 (a criação é execução minha) e convocar os cinco operadores (200).

---

## Apêndice A — achados verificados que mudam a prioridade

Auditoria em nove dimensões, cada achado relido no arquivo citado por um verificador independente instruído a
refutá-lo: **89 confirmados, 37 parciais, 0 refutados**. Abaixo os que não são "melhoria de experiência", e sim
função que não funciona — a razão de várias etapas acima terem subido de prioridade.

### A.1 Recursos que existem e nunca funcionaram

| Achado | Evidência | Efeito hoje | Etapa |
| --- | --- | --- | --- |
| "Voltar ao topo" nunca aparece | `ScrollToTop.tsx:11,23` lê `window.scrollY` e rola `window`; quem rola é `<main id="main-content">` (`MainLayout.tsx:85-86`) | Botão invisível em toda listagem longa | 052 |
| Posição de rolagem nunca é salva | `ScrollRestoration` compara com um `useRef` que o remount por rota (`App.tsx:116`) já recria com a rota nova | Voltar sempre abre no topo | 053, 012 |
| Transição de página não anima | `AnimatePresence mode="wait"` (`PageTransition.tsx:63`) nunca vê a saída, descartada pelo mesmo `key` | Quatro páginas carregam um componente sem efeito | 118 |
| "Reduzir movimento" é lido e descartado | `ReducedMotion.tsx:59-62` grava `data-reduce-motion`; não há `@media (prefers-reduced-motion)` em `src/index.css` nem consumidor | A preferência de acessibilidade não faz nada | 119 |
| Anúncio de rota sem consumidor | `useRouteAnnouncer` (`LiveRegion.tsx:72`) não é chamado em lugar nenhum | Leitor de tela não sabe que a tela mudou | 121 |
| Confirmação central nunca montada | `ConfirmProvider.tsx:188` lança exceção sem o provedor, ausente de `App.tsx:186-205` | 190 linhas prontas, inutilizáveis | 071 |
| Tabela responsiva sem uso | `ResponsiveTable.tsx:47` trata o celular; só o próprio barril a cita, e 38 arquivos montam tabela crua | Operação no celular rola tabela de lado | 150–152 |
| Escape do gesto sem uso | `useTouchGestures.ts:13` verifica `data-no-swipe`; nenhum elemento tem o atributo | Arrastar o mapa de uma tela interna dispara o voltar (na raiz, não, pela guarda de `:34`) | 162 |
| Destaque de resultado sem leitor | `GlobalSearch.tsx:88` monta `?highlight=<id>`; nada lê esse parâmetro | Busca acha o registro e abre a lista inteira | 135 |
| Etapa de despacho da cotação nunca é desenhada | `CotacaoFrete.tsx:195,246` chama `selectAndAdvance`, que guarda a escolha e muda o passo para "despachar" (`useQuotationFlow.tsx:226-229`), mas a tela não renderiza esse passo (`grep despachar src/pages/CotacaoFrete.tsx` vazio) | "Selecionar" guarda a escolha e a tela não avança | 085–089, 098 |
| Guarda de saída só no F5 | `useConfirmExit.ts:21-26` tem comentário vazio no lugar do bloqueio de rota | Clicar no menu descarta o formulário | 075 |

### A.2 Caminhos que enganam o usuário

| Achado | Evidência | Efeito hoje | Etapa |
| --- | --- | --- | --- |
| Onboarding abre em "concluído" para quem nunca começou | `useOnboarding.tsx:222` faz `progress?.completed_at !== null`, que é verdadeiro quando não há progresso | Usuário novo vê o tour como terminado | 101 |
| Botões do onboarding não abrem o assistente | `useOnboarding.tsx:83` guarda `showWizard` em `useState` de hook comum; progresso e diálogo são instâncias diferentes | "Configurar módulo seguinte" não faz nada | 101, 013 |
| Disparo multicanal diz "concluído" mesmo falhando tudo | `CotacaoMultiCanal.tsx:321` engole o erro no laço, `:327` conta como feito e `:332` avisa sucesso | Operador acredita em cotação que não saiu | 095, 096 |
| Cotações automáticas falham caladas e o carregamento acaba antes | `CotacaoMultiCanal.tsx:172,215,242` descartam o erro; `:256` desliga o indicador sem esperar as promessas | Tela parece pronta com dados faltando | 095 |
| Nova busca apaga as cotações já obtidas | `CotacaoMultiCanal.tsx:106-107` limpa os resultados dentro de `handleSearch`, sem aviso nem volta | Trabalho de coleta de preços perdido num clique | 089, 094 |
| Sessão expira e derruba sem diálogo | `useSessionTimeout.ts:74-76` chama `signOut()`; o aviso prévio é a única tela (`SessionTimeoutWarning.tsx:17`) | Formulário aberto vira tela de login | 178 |
| Exclusão física em um clique | `Notificacoes.tsx:282` dispara `.delete().in(...)` em lote (`:170-178`); `AdminADR.tsx:283` idem para um registro | Dado apagado sem pergunta nem desfazer | 072, 073 |
| Botão de busca solto no fim da página | `SearchCommand.tsx:64-73` renderiza um botão em fluxo, montado em `MainLayout.tsx:125` | Campo de busca órfão abaixo do conteúdo | 131 |
| Duas barras de progresso, ambas fingidas | `NavigationProgressBar` (`App.tsx:194`) e `GlobalLoadingBar` (`MainLayout.tsx:68`), com temporizadores de 150 ms e 500 ms | Progresso que não representa carregamento | 120 |
| Dois avisos no mesmo canto | `App.tsx:191-192` monta os dois sistemas; o painel do Radix usa a mesma posição do outro (`ui/toast.tsx:17`) | Mensagens empilhadas e inconsistentes | 107 |
| Primeira abertura de cada tela pisca tela cheia | O único limite de suspensão é `App.tsx:195`, com reserva de altura total, e o layout está dentro de cada página: enquanto o pedaço da rota não chega, menu e cabeçalho desaparecem (voltar a uma rota já carregada não suspende) | Primeira visita a cada tela perde o shell | 008–012, 114 |
| Navegação polui a tabela de segurança | `useNavigationHistory.tsx:106-120` grava `page_view` em `security_events`; o painel pede os 200 últimos da mesma tabela (`SecurityEventsPanel.tsx:36`) | Evento real de segurança sai da tela | 196, 014 |
| Filtro sempre em memória | `useFilters.ts:43` e `usePagination.ts:45` nascem em `useState`; 16 telas dependem deles | Voltar e recarregar zeram o trabalho | 169–174 |
| Atalho dispara dentro do campo | `useKeyboardShortcuts.ts:38-55` não olha o elemento em foco | Alt+N no meio de um cadastro troca de tela | 132 |
