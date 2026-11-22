# Plano Google Maps Platform — 150 etapas

Plano de incorporação de **todos os produtos do Google Maps Platform** ao Loggi Flow V2, com **Mapbox como
provedor alternável** e o mapa gratuito atual (OpenStreetMap) como reserva de emergência.

- **Criado em:** 2026-11-22
- **Base de código lida:** `main` em `a1d5fb3`
- **Fontes:** `developers.google.com/maps/documentation`, `mapsplatform.google.com/maps-products`, termos de
  serviço específicos do Google Maps Platform e o código deste repositório
- **Estado:** plano. Nenhuma etapa foi executada.

## Como ler

Cada etapa tem um checklist de implementação e um critério de pronto. As marcas indicam o que trava a etapa:

| Marca       | Significado                                                                               |
| ----------- | ----------------------------------------------------------------------------------------- |
| `[DDL]`     | Mexe no banco de produção. PR fica aberta aguardando o dono (regra 8 do Fluxo Git).       |
| `[SEGREDO]` | Envolve chave, secret, CI ou CSP. PR fica aberta aguardando o dono.                       |
| `[CUSTO]`   | Gera cobrança nova ou recorrente. Precisa de aprovação antes de ligar.                    |
| `[PRÉ-GA]`  | Produto do Google em pré-lançamento, preview ou experimental. Sem SLA; pode mudar ou sumir. |
| `[AVALIAR]` | Valor logístico incerto. A etapa entrega uma decisão registrada (usar ou descartar).      |

Regras fixas de toda etapa: uma etapa = uma branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>` = uma PR; papéis
são só `admin` e `user` (`docs/agentes/regras-dominio.md`); tabela nova tem `deleted_at`, RLS no padrão
`SECURITY DEFINER` e filtro `deleted_at IS NULL`; domínio novo no front entra na CSP no mesmo PR; edge
function não usa `console.*` cru; não há staging, então tudo nasce atrás de feature flag desligada.

## Premissas de negócio (pendentes de confirmação do dono)

As 20 perguntas de regra de negócio ainda não foram respondidas. O plano assume o que segue; cada premissa
errada muda as etapas indicadas.

| #   | Premissa assumida                                                                    | Etapas afetadas |
| --- | ------------------------------------------------------------------------------------ | --------------- |
| 1   | Há vários pontos de origem (CDs, unidades, gravadores), cadastráveis                 | 021, 023, 130   |
| 2   | Volume mensal desconhecido; dimensionamento sai da etapa 010                         | 005, 010, 030   |
| 3   | Frete interno usa veículo próprio e deve ter custo por km + pedágio                  | 024, 096        |
| 4   | Endereço não validado gera alerta, não bloqueia o despacho                           | 033, 034, 039   |
| 5   | Endereço corrigido aqui não volta para o Bitrix24                                    | 039             |
| 6   | Autocomplete em cliente, fornecedor, coleta e entrega                                | 035–037         |
| 7   | Existe necessidade de roteiro com várias paradas                                     | 071–080         |
| 8   | Coleta em fornecedor e entrega em cliente podem ir no mesmo roteiro                  | 075             |
| 9   | Frota mista (moto, carro, van); respeitar horário do cliente e capacidade de peso    | 065, 073, 074   |
| 10  | Motorista próprio usa celular; página web do motorista antes de app nativo           | 081–087         |
| 11  | Rastreamento público com mapa e ETA só para Lalamove e frota própria                 | 101, 102        |
| 12  | Cliente é avisado por WhatsApp em atraso previsto e na chegada                       | 107, 120        |
| 13  | Não há regra de distância para modal hoje; será criada e configurável                | 092, 093        |
| 14  | Existe área de entrega própria/mesmo dia a definir por tempo de deslocamento         | 094, 095        |
| 15  | Teto mensal: alerta em 80%, troca automática de provedor em 100%                     | 005, 017        |
| 16  | Só `admin` troca o provedor; a troca é do pacote inteiro (mapa + endereço + rota)    | 012, 014, 018   |
| 17  | O mapa gratuito atual continua como reserva de emergência                            | 019, 060, 149   |
| 18  | Não há conta Google Cloud com faturamento nem conta Mapbox ativa                     | 001, 051        |
| 19  | Poucos usuários internos de mapa por dia (dezenas, não milhares)                     | 010             |
| 20  | Coordenadas do Google são revalidadas a cada 30 dias, de forma automática            | 025, 027        |

## Diagnóstico que originou o plano

| #   | Achado                                                                                                    | Evidência                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| D1  | Google Maps não está integrado; só há a variável de exemplo                                               | `.env.example` (`VITE_GOOGLE_MAPS_API_KEY`); nenhuma ocorrência em `src/` ou `supabase/`       |
| D2  | Mapbox não está em uso; o componente `MapboxMap` roda MapLibre com Carto/ESRI                             | `src/lib/mapStyles.ts:3-19`; `src/components/map/MapboxMap.tsx:3`                              |
| D3  | `ESTADO_ATUAL.md` marca Mapbox como ✅                                                                    | `ESTADO_ATUAL.md:358`                                                                          |
| D4  | Geocodificação usa Nominatim público + ViaCEP + Photon, 1 consulta por segundo                            | `supabase/functions/geocode-address/index.ts:41-125`                                           |
| D5  | "Confiança" do endereço é a popularidade do lugar, não a precisão                                         | `supabase/functions/geocode-address/index.ts:67`                                               |
| D6  | Geocodificação em lote é disparada pelo navegador de quem abre o mapa                                     | `src/hooks/logistics/useDeliveryRoutes.tsx:187-215`                                            |
| D7  | Entrega sem coordenada é desenhada no centro do estado, espalhada em até ~16 km                           | `src/lib/mapFallback.ts:11-12`; `src/hooks/logistics/useDeliveryRoutes.tsx:39-68`              |
| D8  | Rotas são arcos de 3 pontos; "desvio por risco" é deslocamento visual                                     | `src/components/map/MapboxMap.tsx:551-590`                                                     |
| D9  | Botão de trânsito procura camadas `traffic` que o estilo Carto não traz (não verificado em tela)          | `src/components/map/MapboxMap.tsx:237-250`                                                     |
| D10 | Origem fixa no centro de São Paulo; `entregas` não tem campo de origem                                    | `src/lib/centroDistribuicao.ts:4-17`                                                           |
| D11 | Só `entregas`, `rastreamento_historico` e `risk_zones` têm coordenadas                                    | `src/integrations/supabase/types.ts`                                                           |
| D12 | Cotação Lalamove exige lat/lng por parada                                                                 | `supabase/functions/lalamove-api/index.ts:104-106`; `src/pages/CotacaoMultiCanal.tsx:150`      |
| D13 | Escolha de transportadora decide por estado + peso                                                        | `supabase/functions/smart-carrier-selection/index.ts:13,68`                                    |
| D14 | Previsão de atraso lista "distância" como fator sem ter o dado                                            | `supabase/functions/predict-delays/index.ts:200`                                               |
| D15 | CEP é consultado no ViaCEP direto do navegador, domínio ausente da CSP (não verificado em produção)       | `src/components/melhorenvio/MECepAutoFill.tsx:27`; `index.html:6`                              |
| D16 | `.env` commitado em repositório público, com `VITE_MAPBOX_TOKEN`                                          | `.env` na raiz                                                                                 |
| D17 | Rastreamento de motorista só cobre coleta Lalamove; direção do veículo fixa em 45°                        | `src/pages/RastreamentoMotorista.tsx:60-66`; `src/pages/RastreamentoRealTime.tsx:164`          |
| D18 | Popup do mapa recebe HTML montado com texto do banco sem escape                                           | `src/pages/RastreamentoRealTime.tsx:136-146`; `src/components/map/MapboxMap.tsx:446`           |
| D19 | `geocode-address` e `get-mapbox-token` respondem com CORS `*`; o código não valida usuário                | `supabase/functions/geocode-address/index.ts:5-9`                                              |

## Regras de licença e custo que moldam a arquitetura

1. **Conteúdo do Google não pode ser exibido em mapa de outro fornecedor.** Os termos específicos da
   Geocoding API e da Distance Matrix API proíbem o uso com mapa não-Google. Por isso a troca de provedor é
   do **pacote inteiro**, e cada coordenada guardada registra de qual provedor veio.
2. **Latitude e longitude do Google ficam em cache por no máximo 30 dias corridos.** O `place_id` pode ser
   guardado sem prazo. O plano guarda `place_id` e revalida as coordenadas.
3. **Franquia gratuita do Google é mensal e por produto:** 10 mil chamadas nos SKUs Essentials, 5 mil nos
   Pro e 1 mil nos Enterprise (tabela oficial de categorias de preço).
4. **Preços de referência por mil chamadas, a conferir na tabela oficial antes de ligar cada produto**
   (fonte: comparativos de terceiros de 2026): carga de mapa dinâmico US$ 7; geocodificação US$ 5; validação
   de endereço US$ 17; rota Essentials US$ 5; rota Pro (com trânsito) US$ 10.
5. **Mapbox, referência de terceiros:** 50 mil cargas de mapa, 100 mil geocodificações temporárias e 100
   mil rotas grátis por mês; geocodificação para guardar no banco custa US$ 5 por mil, sem franquia.

---

## Fase 1 — Fundação, contas e segurança (001–010)

### 001 — Criar o projeto no Google Cloud com faturamento `[CUSTO]` `[SEGREDO]`

- [ ] Criar projeto dedicado `loggi-flow-maps` e vincular conta de faturamento
- [ ] Registrar dono, forma de pagamento e contato de cobrança em `docs/agentes/integracoes.md`
- [ ] Confirmar se a conta é faturada no Brasil e em qual moeda

**Pronto quando:** o console do projeto mostra faturamento ativo e o responsável está documentado.

### 002 — Ativar as APIs por lote

- [ ] Lote A (fases 4–7): Maps JavaScript, Geocoding, Address Validation, Places (New), Routes
- [ ] Lote B (fases 8–11): Route Optimization, Roads, Geolocation, Time Zone, Static Maps, Street View Static, Embed
- [ ] Lote C (fases 12–14): Weather, Air Quality, Elevation, Datasets, Places Aggregate, Map Tiles, Aerial View
- [ ] Deixar desativado tudo que não tem etapa em execução

**Pronto quando:** a lista de APIs ativas bate com a fase em andamento.

### 003 — Criar chaves separadas por uso `[SEGREDO]`

- [ ] Chave de navegador: só Maps JavaScript e Places, restrita por referenciador ao domínio de produção e previews do Vercel
- [ ] Chave de servidor: só APIs web service, usada pelas edge functions
- [ ] Chave da página pública de rastreamento, com cota própria (etapa 102)
- [ ] Nenhuma chave sem restrição de API

**Pronto quando:** cada chave falha fora do seu domínio ou API em teste real.

### 004 — Guardar segredos nos serviços certos `[SEGREDO]`

- [ ] `GOOGLE_MAPS_SERVER_KEY` nos secrets do Supabase
- [ ] `VITE_GOOGLE_MAPS_API_KEY` e `VITE_GOOGLE_MAPS_MAP_ID` no Vercel
- [ ] Atualizar `.env.example` só com nomes, sem valores

**Pronto quando:** nenhuma chave aparece em código, commit ou resposta de agente.

### 005 — Cotas e alertas de orçamento `[CUSTO]`

- [ ] Definir cota diária por API no console (teto duro)
- [ ] Criar orçamento mensal com alertas em 50%, 80% e 100%
- [ ] Encaminhar o alerta para o canal de notificações do sistema

**Pronto quando:** um teste de estouro de cota retorna erro controlado e dispara o alerta.

### 006 — Tirar o `.env` do repositório público `[SEGREDO]`

- [ ] Remover `.env` do versionamento e confirmar o `.gitignore`
- [ ] Gerar token Mapbox novo restrito por URL e revogar o antigo (D16)
- [ ] Confirmar regra do gitleaks cobrindo chaves Google e Mapbox

**Pronto quando:** `git ls-files .env` não retorna nada e o token antigo responde 401.

### 007 — Atualizar a CSP `[SEGREDO]`

- [ ] Incluir domínios do Google Maps e do Mapbox em `script-src`, `connect-src`, `img-src`, `style-src`, `font-src`
- [ ] Resolver o ViaCEP (D15): liberar o domínio ou mover a consulta para o servidor (etapa 038)
- [ ] Ajustar `scripts/validate-csp.mjs` e rodar `npm run validate:csp`

**Pronto quando:** o build passa e o console do navegador não mostra bloqueio de CSP nas telas de mapa.

### 008 — Registrar a arquitetura em ADR

- [ ] ADR "Provedores de mapa alternáveis" com as regras de licença 1 e 2
- [ ] Registrar por que a troca é do pacote inteiro e não por função
- [ ] Listar o que é proibido: resultado Google em mapa Mapbox ou MapLibre

**Pronto quando:** o ADR está em `docs/adr/` e é citado no contrato da etapa 011.

### 009 — Corrigir a documentação desatualizada

- [ ] Corrigir `ESTADO_ATUAL.md:358` (D3) e a linha de "Mapa de rotas"
- [ ] Atualizar a seção "Mapas e endereço" de `docs/agentes/integracoes.md`
- [ ] Rodar `node scripts/ci/check-claude-md-integrity.mjs`

**Pronto quando:** a documentação descreve o estado real: MapLibre + OSM, sem Google e sem Mapbox.

### 010 — Simular volume e escolher o modelo de cobrança `[CUSTO]`

- [ ] Medir no banco: entregas, coletas e fretes internos por mês; usuários que abrem telas de mapa
- [ ] Estimar chamadas por SKU e comparar pagamento por uso com os planos de assinatura
- [ ] Entregar tabela "custo mensal previsto" para Google, Mapbox e OSM

**Pronto quando:** o dono aprova um teto mensal em reais com base em números do próprio banco.

## Fase 2 — Camada de provedor alternável (011–020)

### 011 — Definir o contrato único de provedor

- [ ] Criar `src/lib/maps/` com tipos para geocodificar, validar endereço, rota, matriz, roteirização e mapa
- [ ] Todo resultado carrega `provedor`, `obtido_em` e `expira_em`
- [ ] Nenhuma tela chama Google ou Mapbox direto; só o contrato

**Pronto quando:** `tsc --noEmit` passa e o contrato tem teste de tipos.

### 012 — Tabela de configuração do provedor `[DDL]`

- [ ] Tabela `map_provider_settings`: provedor ativo, teto mensal, modo de reserva, quem alterou
- [ ] RLS: leitura para autenticados, escrita só `has_role(auth.uid(), 'admin')`
- [ ] Trilha em `audit_logs` a cada troca

**Pronto quando:** usuário `user` não consegue alterar e a troca aparece na auditoria.

### 013 — Hook `useMapProvider`

- [ ] Ler a configuração com React Query e assinar mudanças em tempo real
- [ ] Trocar de provedor sem recarregar a página
- [ ] Estado de erro e de carregamento explícitos

**Pronto quando:** dois navegadores abertos refletem a troca em segundos.

### 014 — Tela "Provedor de mapas" em Configurações

- [ ] Seletor Google / Mapbox / OpenStreetMap, visível só para `admin`
- [ ] Mostrar gasto do mês, franquia restante e botão "testar conexão" por provedor
- [ ] Confirmar a troca informando o que será revalidado

**Pronto quando:** o admin troca o provedor pela interface e o teste de conexão responde.

### 015 — Edge function `maps-gateway` `[SEGREDO]`

- [ ] Uma função roteia para Google, Mapbox ou OSM conforme a configuração
- [ ] Exigir JWT válido e aplicar `check-rate-limit` (corrige D19)
- [ ] CORS restrito à origem da aplicação; logs por `_shared/logger.ts`
- [ ] `geocode-address` vira adaptador OSM dentro do gateway

**Pronto quando:** chamada sem token recebe 401 e chamada válida devolve o mesmo formato nos três provedores.

### 016 — Medidor de uso por SKU `[DDL]`

- [ ] Tabela `map_usage_events`: provedor, SKU, tela, usuário, custo estimado
- [ ] O gateway grava um evento por chamada cobrada
- [ ] Visão agregada por dia e por mês

**Pronto quando:** o total do mês no sistema bate com o relatório de faturamento do Google com erro menor que 5%.

### 017 — Guarda de custo automática `[CUSTO]`

- [ ] Em 80% do teto: notificação para admins
- [ ] Em 100%: troca automática para o provedor de reserva (premissa 15)
- [ ] Registrar a troca automática na auditoria com o motivo

**Pronto quando:** um teste com teto artificial baixo dispara alerta e troca.

### 018 — Guarda de licença

- [ ] O contrato recusa desenhar dado de origem Google em mapa não-Google
- [ ] Ao trocar de provedor, coordenadas de origem Google são marcadas para nova geocodificação
- [ ] Teste automatizado cobrindo a recusa

**Pronto quando:** o teste falha se alguém misturar provedores.

### 019 — Componente `MapCanvas` com três adaptadores

- [ ] Extrair de `MapboxMap.tsx` a interface de props e criar adaptadores Google, Mapbox e MapLibre
- [ ] Manter o export `MapboxMap` como apelido para não quebrar as 6 telas que o importam
- [ ] Carregar cada biblioteca só quando o provedor estiver ativo

**Pronto quando:** `MapaRotas`, `RastreamentoRealTime`, `LogisticsMapWidget` e `NexusCoverageMap` renderizam nos três provedores.

### 020 — Suíte de contrato dos adaptadores

- [ ] A mesma suíte roda contra Google, Mapbox e OSM com respostas gravadas
- [ ] Cobrir endereço inexistente, cota estourada e tempo esgotado
- [ ] Entrar no `npm run test`

**Pronto quando:** os três adaptadores passam na mesma suíte.

## Fase 3 — Modelo de dados geográfico (021–030)

### 021 — Cadastro de pontos de origem `[DDL]`

- [ ] Tabela `locais_operacao`: nome, tipo (CD, unidade, gravador), endereço, coordenadas, horário
- [ ] Tela de cadastro em Configurações
- [ ] Substituir `VITE_CD_ORIGEM_LAT/LNG` pela origem cadastrada (D10)

**Pronto quando:** o mapa parte do endereço real de despacho, não do centro de São Paulo.

### 022 — Coordenadas em clientes e fornecedores `[DDL]`

- [ ] Colunas `latitude`, `longitude`, `place_id`, `geo_provedor`, `geo_precisao`, `geocoded_at`, `geo_expira_em`
- [ ] Índices para busca por proximidade
- [ ] Formulários exibem o selo de precisão (etapa 034)

**Pronto quando:** cliente e fornecedor têm localização própria, reaproveitada por entrega e coleta.

### 023 — Coordenadas em coletas e origem em entregas `[DDL]`

- [ ] `coletas`: colunas geográficas equivalentes às da etapa 022
- [ ] `entregas`: `origem_local_id` apontando para `locais_operacao`
- [ ] Preencher a origem das entregas existentes com o local padrão

**Pronto quando:** toda entrega e toda coleta têm origem e destino localizáveis.

### 024 — Distância e custo em fretes internos `[DDL]`

- [ ] Trocar texto livre por referência a `locais_operacao`, mantendo o texto antigo
- [ ] Colunas `distancia_km`, `duracao_min`, `pedagio`, `custo_calculado`
- [ ] Migrar os registros existentes sem perder histórico

**Pronto quando:** um frete interno novo mostra km, tempo e custo sem digitação.

### 025 — Cache de geocodificação com validade `[DDL]`

- [ ] Tabela `geo_cache` por endereço normalizado + provedor
- [ ] Validade de 30 dias para origem Google; `place_id` sem prazo
- [ ] O gateway consulta o cache antes de cobrar uma chamada

**Pronto quando:** repetir o mesmo endereço não gera nova cobrança dentro do prazo.

### 026 — Suporte espacial no banco `[DDL]`

- [ ] Verificar e habilitar a extensão PostGIS
- [ ] Colunas `geography` geradas a partir de lat/lng e índices GiST
- [ ] Função "pontos dentro de um raio" com `SECURITY DEFINER`

**Pronto quando:** a consulta de proximidade usa índice (conferido com `EXPLAIN`).

### 027 — Revalidação automática das coordenadas

- [ ] Rotina agendada revalida pelo `place_id` o que vence nos próximos dias
- [ ] Limite diário de revalidações para não estourar cota
- [ ] Coordenada vencida e não revalidada deixa de ser exibida

**Pronto quando:** não existe coordenada de origem Google com mais de 30 dias no banco.

### 028 — RLS e exclusão lógica nas tabelas novas

- [ ] Policies por papel em todas as tabelas das etapas 012, 016, 021 e 025
- [ ] `deleted_at` e hook `useSoftDelete`
- [ ] Casos novos em `tests/security/rls-access.spec.ts`

**Pronto quando:** `npm run test:rls` passa com as tabelas novas.

### 029 — Sincronizar `types.ts` sem conflito

- [ ] Conferir PRs abertas que tocam `types.ts` e migrations antes de cada PR desta fase
- [ ] Usar o workflow `types-sync` em vez de editar à mão quando possível
- [ ] Uma migration por PR

**Pronto quando:** nenhuma PR desta fase conflita com PR de outro agente.

### 030 — Geocodificar a base existente `[CUSTO]`

- [ ] Contar endereços sem coordenada em clientes, fornecedores, coletas e entregas ativas
- [ ] Rodar em lotes no servidor, dentro da franquia mensal, com relatório de falhas
- [ ] Remover a geocodificação disparada pelo navegador (D6)

**Pronto quando:** o percentual de registros ativos com coordenada real está medido e publicado.

## Fase 4 — Endereços (031–040)

### 031 — Geocoding API no gateway

- [ ] Geocodificação direta restrita ao Brasil, com componentes de CEP, cidade e UF
- [ ] Guardar `place_id` e o tipo de precisão devolvido
- [ ] Reserva: Mapbox e depois OSM

**Pronto quando:** um conjunto de 100 endereços reais tem taxa de acerto medida contra o Nominatim atual.

### 032 — Geocodificação reversa

- [ ] Clique no mapa devolve endereço formatado
- [ ] Usar para corrigir pino manualmente em cliente, coleta e entrega
- [ ] Correção manual vira dado do usuário, sem prazo de validade

**Pronto quando:** o operador arrasta o pino e o endereço é atualizado.

### 033 — Address Validation API `[CUSTO]`

- [ ] Validar ao salvar cliente, fornecedor, coleta e entrega
- [ ] Guardar veredito, granularidade e componentes corrigidos
- [ ] Respeitar o prazo de cache previsto nos termos da API

**Pronto quando:** endereço com número inexistente é sinalizado antes do despacho.

### 034 — Selo de confiança do endereço

- [ ] Três níveis visíveis: confirmado, aproximado, não localizado
- [ ] Substituir o campo `confidence` atual (D5)
- [ ] Alerta no despacho de entrega com endereço não confirmado (premissa 4)

**Pronto quando:** o operador vê o nível de confiança em lista, detalhe e mapa.

### 035 — Autocomplete de endereço (Places API nova)

- [ ] Sugestões enquanto digita, restritas ao Brasil
- [ ] Uso de token de sessão para cobrança por sessão
- [ ] Aplicar em cliente, fornecedor, coleta e entrega (premissa 6)

**Pronto quando:** o endereço é escolhido em poucos toques e chega estruturado ao banco.

### 036 — Places UI Kit e componente web de autocomplete

- [ ] Avaliar o componente pronto contra o campo próprio da etapa 035
- [ ] Adotar onde reduzir código sem perder o visual do sistema
- [ ] Garantir estados de erro, vazio e carregamento

**Pronto quando:** existe um único componente de endereço reutilizado em todos os formulários.

### 037 — Place Details para preencher o cadastro

- [ ] Pedir só os campos necessários (máscara de campos) para ficar no SKU mais barato
- [ ] Preencher logradouro, número, bairro, cidade, UF e CEP
- [ ] Salvar `place_id`

**Pronto quando:** escolher uma sugestão preenche o formulário inteiro.

### 038 — Consulta de CEP pelo servidor

- [ ] Mover a chamada ao ViaCEP de `MECepAutoFill` e `RTECepAutoFill` para o gateway (D15)
- [ ] Cruzar o resultado com a validação de endereço
- [ ] Cache por CEP

**Pronto quando:** o preenchimento por CEP funciona em produção sem erro de CSP.

### 039 — Fila de endereços problemáticos

- [ ] Tela listando registros não localizados ou aproximados
- [ ] Ação de corrigir com autocomplete ou pino manual
- [ ] Indicador de pendências no painel

**Pronto quando:** existe um lugar único para zerar endereços ruins.

### 040 — Fim do pino falso

- [ ] Remover o desenho no centro do estado (D7) do mapa operacional
- [ ] Entregas sem localização vão para a lista "sem localização", com contagem visível
- [ ] Manter `mapFallback.ts` só se a etapa 122 usar agregação por UF

**Pronto quando:** todo pino no mapa corresponde a um endereço localizado.

## Fase 5 — Mapa do Google (041–050)

### 041 — Maps JavaScript API

- [ ] Adaptador Google do `MapCanvas`, com carregamento sob demanda
- [ ] Controles equivalentes aos atuais: zoom, tela cheia, escala
- [ ] Cada abertura de mapa registrada no medidor (etapa 016)

**Pronto quando:** `/mapa-rotas` abre no Google com os mesmos marcadores de hoje.

### 042 — Estilo de mapa na nuvem

- [ ] Criar Map IDs para tema escuro e claro alinhados ao sistema
- [ ] Trocar tema sem recarregar
- [ ] Ocultar pontos de interesse irrelevantes para logística

**Pronto quando:** o mapa segue o tema do sistema nos dois modos.

### 043 — Marcadores avançados

- [ ] Tipos caminhão, entrega, coleta e origem com cor por status
- [ ] Rotação pelo rumo real do veículo
- [ ] Acessibilidade: rótulo e foco por teclado

**Pronto quando:** os quatro tipos atuais de `MapMarker` têm equivalente no Google.

### 044 — Agrupamento de marcadores

- [ ] Agrupar por nível de zoom, com contagem
- [ ] Cor do grupo pelo pior status dentro dele
- [ ] Testar com o maior volume real de entregas ativas

**Pronto quando:** o mapa segue fluido com todas as entregas ativas.

### 045 — Trânsito real

- [ ] Ligar a camada de trânsito do Google no botão existente (D9)
- [ ] Esconder o botão nos provedores sem trânsito
- [ ] Legenda de cores

**Pronto quando:** o botão mostra congestionamento real.

### 046 — Rotas reais e popups seguros

- [ ] Desenhar a geometria devolvida pela Routes API em vez dos arcos (D8)
- [ ] Popups montados com texto escapado, sem HTML vindo do banco (D18)
- [ ] Remover o "desvio por risco" visual até existir rota alternativa real (etapa 066)

**Pronto quando:** a linha no mapa segue as ruas e um endereço com `<script>` aparece como texto.

### 047 — Street View no detalhe

- [ ] Panorama do destino no detalhe de entrega e de coleta
- [ ] Mensagem clara quando não houver imagem no local
- [ ] Carregar só ao abrir a aba, para não cobrar à toa

**Pronto quando:** o operador confere a fachada antes de despachar.

### 048 — Componentes web do Maps

- [ ] Usar `gmp-map` em telas simples, começando pelo widget do painel
- [ ] Comparar tamanho de bundle com o adaptador completo
- [ ] Manter fallback para os outros provedores

**Pronto quando:** o widget do painel carrega mais leve que hoje.

### 049 — Mapas 3D e blocos 3D fotorrealistas `[CUSTO]` `[AVALIAR]`

- [ ] Protótipo do "modo drone" com 3D real no lugar da câmera giratória atual
- [ ] Conferir cobertura 3D nas cidades de operação
- [ ] Decidir manter, restringir a admins ou descartar

**Pronto quando:** existe decisão registrada com custo por abertura.

### 050 — Map Tiles API `[AVALIAR]`

- [ ] Testar blocos 2D e de Street View do Google em renderizador próprio
- [ ] Verificar exigências de atribuição e sessão
- [ ] Decidir se compensa frente ao Maps JavaScript

**Pronto quando:** existe decisão registrada sobre usar ou não a Map Tiles API.

## Fase 6 — Paridade com Mapbox (051–060)

### 051 — Conta e token Mapbox `[CUSTO]` `[SEGREDO]`

- [ ] Conta com faturamento, token público restrito por URL e token de servidor
- [ ] `MAPBOX_PUBLIC_TOKEN` e token secreto nos secrets corretos
- [ ] Alerta de uso configurado

**Pronto quando:** o token só funciona no domínio do sistema.

### 052 — Adaptador de mapa Mapbox

- [ ] Decidir entre Mapbox GL JS (dependência nova, cobra por carga) e MapLibre com estilos Mapbox
- [ ] Avisar na PR a dependência nova, se houver
- [ ] Paridade de marcadores, agrupamento e rotas

**Pronto quando:** as telas de mapa abrem no Mapbox com o mesmo comportamento.

### 053 — Geocodificação Mapbox

- [ ] Separar uso temporário (não guarda) de permanente (guarda e paga)
- [ ] O gateway escolhe o modo conforme o destino do dado
- [ ] Custo de cada modo no medidor

**Pronto quando:** nada é gravado no banco vindo do modo temporário.

### 054 — Rotas Mapbox (Directions)

- [ ] Rota com distância, duração e geometria no formato do contrato
- [ ] Perfil com trânsito quando disponível
- [ ] Mesmos testes da etapa 061

**Pronto quando:** a mesma entrega mostra rota nos dois provedores.

### 055 — Matriz Mapbox

- [ ] Matriz origem × destino no formato do contrato
- [ ] Respeitar o limite de elementos por chamada
- [ ] Divisão automática em blocos

**Pronto quando:** a etapa 068 funciona com Mapbox ativo.

### 056 — Otimização Mapbox

- [ ] Mapear o que a API de otimização do Mapbox cobre frente ao Route Optimization do Google
- [ ] Registrar as restrições sem equivalente
- [ ] A tela de roteiro informa o que fica indisponível no Mapbox

**Pronto quando:** existe tabela de equivalência publicada na tela de provedor.

### 057 — Isócronas Mapbox

- [ ] Área alcançável por tempo no formato do contrato
- [ ] Usar como alternativa enquanto a Isochrones do Google estiver em pré-lançamento
- [ ] Mesmos testes da etapa 094

**Pronto quando:** a área de mesmo dia aparece com Mapbox ativo.

### 058 — Ajuste de trajeto Mapbox (Map Matching)

- [ ] Equivalente ao Roads do Google para corrigir pontos de GPS
- [ ] Mesmo formato de saída da etapa 083
- [ ] Limite de pontos por chamada tratado

**Pronto quando:** o trajeto do motorista segue as ruas nos dois provedores.

### 059 — Estilos e trânsito Mapbox

- [ ] Estilos escuro e claro equivalentes aos Map IDs do Google
- [ ] Camada de trânsito do Mapbox no mesmo botão
- [ ] Atribuição correta exibida

**Pronto quando:** a aparência é equivalente ao trocar de provedor.

### 060 — Teste de troca a quente

- [ ] Roteiro de teste: Google → Mapbox → OSM → Google com o sistema em uso
- [ ] Conferir que nenhuma coordenada de um provedor aparece no mapa do outro
- [ ] Publicar a matriz de paridade por funcionalidade

**Pronto quando:** a troca completa leva menos de um minuto e nenhuma tela quebra.

## Fase 7 — Rotas, distância e ETA (061–070)

### 061 — Routes API no gateway

- [ ] `computeRoutes` com máscara de campos mínima
- [ ] Erros tratados: sem rota, cota, tempo esgotado
- [ ] Resposta no formato do contrato

**Pronto quando:** uma entrega real devolve distância, duração e geometria.

### 062 — Política de trânsito por caso de uso `[CUSTO]`

- [ ] Sem trânsito (mais barato) para relatório e cotação de longa distância
- [ ] Com trânsito para saída no dia e rastreamento ao vivo
- [ ] Regra configurável na tela de provedor

**Pronto quando:** cada tela usa o nível de rota previsto e o custo aparece separado.

### 063 — Distância, duração e ETA na entrega `[DDL]`

- [ ] Colunas `distancia_km`, `duracao_min`, `eta_calculado_em` em `entregas`
- [ ] Calcular no despacho e recalcular em mudança de status
- [ ] Exibir ETA em lista, kanban e detalhe

**Pronto quando:** toda entrega despachada tem previsão baseada em rota.

### 064 — Pedágio

- [ ] Pedir cálculo de pedágio na rota e **verificar a cobertura no Brasil** com rotas reais
- [ ] Se não houver cobertura, permitir tabela manual por trecho
- [ ] Somar pedágio ao custo do frete interno

**Pronto quando:** está documentado se o Google devolve pedágio para as rotas da operação.

### 065 — Rota de moto

- [ ] Modo de duas rodas para entregas de motoboy e Lalamove moto
- [ ] Comparar tempo com o modo carro nas mesmas rotas
- [ ] Escolha automática pelo tipo de veículo

**Pronto quando:** a previsão de motoboy usa o modo correto.

### 066 — Rotas alternativas e rota econômica

- [ ] Pedir alternativas e exibir a comparação de tempo e distância
- [ ] Rota de menor consumo por tipo de motor
- [ ] Registrar qual rota foi escolhida

**Pronto quando:** o operador vê e escolhe entre rotas reais.

### 067 — Várias paradas em ordem ótima simples

- [ ] Paradas intermediárias com otimização de ordem da própria Routes API
- [ ] Respeitar o limite de paradas por chamada
- [ ] Usar para roteiros pequenos, sem janelas nem capacidade

**Pronto quando:** um roteiro de poucas paradas sai ordenado sem usar o produto Enterprise.

### 068 — Matriz de rotas

- [ ] `computeRouteMatrix` entre origens e destinos
- [ ] Dividir em blocos dentro do limite de elementos
- [ ] Cobrança contada por elemento no medidor

**Pronto quando:** a matriz alimenta as etapas 092 e 130.

### 069 — Cache de rotas

- [ ] Cache por par de `place_id` e faixa de horário
- [ ] Prazos conforme os termos do provedor
- [ ] Invalidação ao mudar endereço

**Pronto quando:** recalcular a mesma rota no mesmo período não cobra de novo.

### 070 — `MapaRotas` com dados reais

- [ ] Trocar os arcos por rotas reais
- [ ] Incluir km e tempo nas exportações CSV e PDF
- [ ] Remover rótulos que sugerem telemetria inexistente

**Pronto quando:** a tela e as exportações mostram distância e tempo reais.

## Fase 8 — Roteirização (071–080)

### 071 — Modelo de frota e roteiro `[DDL]`

- [ ] Tabelas `veiculos` (tipo, capacidade, custo por km e hora, turno), `roteiros`, `roteiro_paradas`
- [ ] Vínculo com entregas, coletas e fretes internos
- [ ] Status do roteiro e de cada parada

**Pronto quando:** dá para cadastrar um veículo e montar um roteiro vazio.

### 072 — Route Optimization para um veículo `[CUSTO]`

- [ ] `OptimizeTours` com um veículo e as paradas do dia
- [ ] Gravar ordem, horários previstos e paradas não atendidas
- [ ] Mostrar o motivo de cada parada fora do roteiro

**Pronto quando:** um roteiro real sai ordenado com horário por parada.

### 073 — Janelas de horário

- [ ] Normalizar `clientes.horario_entrega` para faixas estruturadas `[DDL]`
- [ ] Enviar as janelas como restrição
- [ ] Alertar janela impossível antes de otimizar

**Pronto quando:** nenhuma parada é planejada fora do horário do cliente.

### 074 — Capacidade

- [ ] Peso e, quando houver, volume por entrega
- [ ] Limite por veículo como restrição
- [ ] Aviso de carga que não cabe em nenhum veículo

**Pronto quando:** o roteiro não excede a capacidade cadastrada.

### 075 — Coleta e entrega no mesmo roteiro

- [ ] Modelar retirada no fornecedor e entrega no cliente como um par com ordem obrigatória
- [ ] Liberar capacidade após cada entrega
- [ ] Refletir os estados de `coleta_status` e `entrega_status`

**Pronto quando:** um veículo retira no gravador e entrega no cliente na ordem certa.

### 076 — Vários veículos `[CUSTO]`

- [ ] Distribuir paradas entre veículos (SKU Enterprise)
- [ ] Balancear carga e jornada
- [ ] Comparar custo total com o roteiro manual

**Pronto quando:** dois ou mais veículos recebem roteiros sem sobreposição.

### 077 — Custos e penalidades

- [ ] Custo por km e por hora de cada veículo
- [ ] Penalidade por entrega não atendida e por atraso, por prioridade
- [ ] Mostrar o custo estimado do roteiro

**Pronto quando:** mudar a penalidade muda o roteiro de forma explicável.

### 078 — Tela "Planejar roteiro do dia"

- [ ] Selecionar paradas, veículos e origem; otimizar; ver no mapa e em lista
- [ ] Arrastar para reordenar, travar parada e reotimizar o restante
- [ ] Estados de erro, carregamento e vazio; publicar para o motorista

**Pronto quando:** o planejamento do dia é feito em uma tela, do início à publicação.

### 079 — Reotimização durante o dia

- [ ] Reotimizar ao surgir ocorrência, cancelamento ou parada nova
- [ ] Manter fixas as paradas já concluídas
- [ ] Avisar o motorista da mudança

**Pronto quando:** uma ocorrência gera novo roteiro sem refazer o que já foi entregue.

### 080 — Volumes grandes e planejado × realizado

- [ ] Usar o método assíncrono para pedidos grandes ou demorados
- [ ] Guardar o plano para comparar com o trajeto real
- [ ] Relatório de aderência ao roteiro

**Pronto quando:** existe relatório planejado × realizado por roteiro.

## Fase 9 — Rastreamento e motorista (081–090)

### 081 — Página do motorista com GPS

- [ ] Página PWA para motorista próprio, com consentimento explícito de localização
- [ ] Enviar posição em intervalo configurável para `rastreamento_historico`
- [ ] Fila local quando ficar sem sinal

**Pronto quando:** um celular real aparece no mapa do operador (corrige D17).

### 082 — Geolocation API

- [ ] Localização aproximada por torres e Wi-Fi quando o GPS falhar
- [ ] Marcar a posição como aproximada, com raio de incerteza
- [ ] Não usar para comprovante de entrega

**Pronto quando:** o veículo não some do mapa em área sem GPS.

### 083 — Roads API e rumo real

- [ ] Ajustar os pontos de GPS às vias
- [ ] Calcular o rumo a partir do trajeto, no lugar dos 45° fixos
- [ ] Consultar limite de velocidade onde houver dado, verificando a cobertura no Brasil

**Pronto quando:** o trajeto desenhado segue as ruas e o ícone aponta na direção certa.

### 084 — Serviços de mobilidade e rastreamento de ativos `[AVALIAR]` `[CUSTO]`

- [ ] Estudar a solução de transporte e logística e a de rastreamento de recursos do Google
- [ ] Comparar com a solução própria das etapas 081–083
- [ ] Decidir com base no tamanho da frota

**Pronto quando:** existe decisão registrada em ADR.

### 085 — Abrir navegação no celular

- [ ] Botão que abre Google Maps com a parada via Maps URLs
- [ ] Opção de abrir no Waze
- [ ] Sequência "próxima parada" a partir do roteiro

**Pronto quando:** o motorista inicia a navegação com um toque.

### 086 — Navigation Connect `[PRÉ-GA]` `[AVALIAR]`

- [ ] Verificar disponibilidade no Brasil e condições de acesso
- [ ] Protótipo recebendo dados de viagem do Google Maps ou Waze
- [ ] Decidir se substitui o envio próprio de posição

**Pronto quando:** existe decisão registrada; nada de produção depende de produto em preview.

### 087 — App nativo: Navigation SDK e SDKs móveis `[CUSTO]` `[AVALIAR]`

- [ ] Avaliar Navigation SDK, Maps SDK e Places SDK para Android e iOS, incluindo Maps 3D
- [ ] Avaliar Flutter e React Native contra a página web atual
- [ ] Decidir se o volume de motoristas justifica app nativo

**Pronto quando:** ADR define web ou nativo, com custo e prazo.

### 088 — Cerca de chegada

- [ ] Detectar entrada no raio do destino pelo banco (PostGIS)
- [ ] Propor a mudança de status para confirmação do motorista
- [ ] Registrar hora de chegada e de saída

**Pronto quando:** a chegada é registrada sem digitação.

### 089 — Comprovante de entrega com localização

- [ ] Gravar coordenada, hora e precisão junto ao comprovante
- [ ] Endereço por geocodificação reversa e miniatura de mapa
- [ ] Alertar comprovante feito longe do destino

**Pronto quando:** cada comprovante mostra onde foi feito.

### 090 — Time Zone API

- [ ] Fuso do destino para previsão e janela de entrega em estados com fuso diferente
- [ ] Guardar o fuso no cadastro
- [ ] Corrigir a exibição de horários previstos

**Pronto quando:** o horário previsto aparece no fuso do destino.

## Fase 10 — Cotação e decisão de modal (091–100)

### 091 — Coordenadas validadas na cotação Lalamove

- [ ] Cotação só com endereço confirmado ou pino ajustado (D12)
- [ ] Mostrar no mapa os pontos enviados à Lalamove antes de confirmar
- [ ] Bloquear cotação com endereço não localizado

**Pronto quando:** nenhuma cotação Lalamove sai com coordenada aproximada.

### 092 — Escolha de transportadora com distância real

- [ ] `smart-carrier-selection` recebe CEP, distância e tempo, além de estado e peso (D13)
- [ ] Usar `transportadora_rotas` por faixa de CEP
- [ ] Explicar a decisão ao operador

**Pronto quando:** a recomendação muda entre dois destinos do mesmo estado com distâncias diferentes.

### 093 — Regras de modal por distância `[DDL]`

- [ ] Campos de distância e tempo máximos em `freight_selection_rules`
- [ ] Tela para o admin definir "até X km vai de motoboy"
- [ ] Registro em `freight_decisions`

**Pronto quando:** a regra de distância é configurável sem código.

### 094 — Área de mesmo dia com Isochrones `[PRÉ-GA]`

- [ ] Polígono de alcance por tempo a partir de cada origem
- [ ] Informar na cotação se o destino está dentro
- [ ] Alternativa pelo Mapbox (etapa 057) enquanto o produto for pré-lançamento

**Pronto quando:** a cotação informa se o destino cabe na entrega no mesmo dia.

### 095 — Mapa de cobertura real

- [ ] `NexusCoverageMap` desenhando a cobertura a partir de `transportadora_rotas`
- [ ] Sobrepor área própria e área das transportadoras
- [ ] Destacar regiões sem cobertura

**Pronto quando:** o mapa responde "quem atende este CEP".

### 096 — Custo do frete interno

- [ ] Distância e tempo pela rota real
- [ ] Custo por km + pedágio + hora, com valores configuráveis
- [ ] Mostrar na lista e nos relatórios de custo

**Pronto quando:** cada frete interno tem custo calculado.

### 097 — Cotação multicanal com km e tempo

- [ ] Exibir distância, tempo e custo por km ao lado de cada preço
- [ ] Ordenar por custo por km
- [ ] Gravar em `cotacoes_multicanal`

**Pronto quando:** o operador compara preço e distância na mesma tela.

### 098 — Auditoria de frete pela distância

- [ ] Cruzar o frete cobrado com a distância na conciliação
- [ ] Sinalizar cobrança fora da faixa esperada
- [ ] Relatório por transportadora

**Pronto quando:** a conciliação aponta fretes fora do padrão.

### 099 — Unidades de transportadora próximas

- [ ] Busca por texto e por proximidade para achar a unidade mais próxima de um endereço
- [ ] Cruzar com as unidades da Rodonaves já integradas
- [ ] Usar em retirada na transportadora e logística reversa

**Pronto quando:** o sistema sugere a unidade mais próxima do destinatário.

### 100 — Horário de funcionamento do destino `[CUSTO]`

- [ ] Consultar o horário do local para destinos comerciais
- [ ] Alertar entrega prevista com o local fechado
- [ ] Limitar aos campos necessários para controlar custo

**Pronto quando:** existe alerta antes de despachar para local fechado.

## Fase 11 — Portal público e comunicação (101–110)

### 101 — Rastreamento público com mapa e ETA

- [ ] Mapa e previsão em `RastreamentoPublico` para Lalamove e frota própria (premissa 11)
- [ ] Mostrar só o necessário: posição aproximada e previsão
- [ ] Ocultar a posição fora do trecho de entrega

**Pronto quando:** o cliente final vê a previsão ao vivo sem login.

### 102 — Proteção da página pública `[SEGREDO]` `[CUSTO]`

- [ ] Chave e cota próprias
- [ ] Limite por link e por IP
- [ ] Mapa estático como padrão, interativo sob clique

**Pronto quando:** um robô acessando a página não gera cobrança relevante.

### 103 — Mapa estático em mensagens e PDF

- [ ] Imagem da rota ou do destino pela Static Maps
- [ ] URL assinada no servidor, sem expor a chave
- [ ] Usar em e-mail e nos relatórios

**Pronto quando:** e-mail e PDF trazem o mapa sem depender de JavaScript.

### 104 — Fachada do destino

- [ ] Imagem do local pela Street View Static no detalhe e na folha do motorista
- [ ] Verificar se há imagem antes de cobrar a chamada
- [ ] Texto alternativo quando não houver

**Pronto quando:** o motorista reconhece o local antes de chegar.

### 105 — Maps Embed

- [ ] Mapa incorporado em páginas simples, sem JavaScript próprio
- [ ] Usar onde só é preciso mostrar um ponto
- [ ] Conferir CSP e atribuição

**Pronto quando:** existe ao menos uma página servida por Embed, com custo medido.

### 106 — Aerial View `[AVALIAR]`

- [ ] Verificar cobertura nas cidades de operação
- [ ] Protótipo de vídeo aéreo para destinos de difícil acesso
- [ ] Decidir utilidade real

**Pronto quando:** existe decisão registrada com exemplos reais.

### 107 — ETA e chegada por WhatsApp

- [ ] Mensagens de "saiu para entrega", "atraso previsto" e "chegando" pelo `evolution-whatsapp`
- [ ] Link para a página pública
- [ ] Preferência do cliente e limite de mensagens

**Pronto quando:** o cliente recebe aviso com previsão baseada em rota.

### 108 — Confirmação de endereço pelo cliente

- [ ] Link para o cliente confirmar ou ajustar o pino antes do despacho
- [ ] A confirmação vira dado do cliente, sem prazo de validade
- [ ] Registro de quem confirmou e quando

**Pronto quando:** endereço duvidoso pode ser resolvido pelo próprio destinatário.

### 109 — Relatórios com mapa

- [ ] Mapa estático da rota no `RelatorioPDF` e nos relatórios agendados
- [ ] Legenda com km, tempo e paradas
- [ ] Limite de imagens por relatório

**Pronto quando:** o relatório impresso mostra o trajeto.

### 110 — Fotos do local `[CUSTO]` `[AVALIAR]`

- [ ] Avaliar Place Photos no cartão do destino
- [ ] Comparar utilidade com a fachada da etapa 104
- [ ] Decidir pelo custo Enterprise

**Pronto quando:** existe decisão registrada.

## Fase 12 — Ambiente e risco de rota (111–120)

### 111 — Weather API

- [ ] Verificar cobertura e dados para o Brasil
- [ ] Comparar com o OpenWeather usado em `_shared/weather.ts`
- [ ] Trocar só se houver ganho de precisão ou custo

**Pronto quando:** existe decisão com comparação lado a lado.

### 112 — Camada de clima real no mapa

- [ ] Substituir a camada de clima montada dentro do componente (`MapboxMap.tsx:257-300`) por dado real
- [ ] Mostrar condição atual e previsão nas regiões das entregas
- [ ] Respeitar o prazo de cache do provedor

**Pronto quando:** o botão de clima mostra dado real.

### 113 — Zonas de risco com dados reais

- [ ] Alimentar `risk_zones` com clima severo e congestionamento
- [ ] Origem e validade em cada zona
- [ ] Remover zonas vencidas

**Pronto quando:** toda zona de risco tem fonte e prazo.

### 114 — Air Quality API `[AVALIAR]`

- [ ] Avaliar uso para fumaça de queimadas em corredores rodoviários
- [ ] Conferir os usos permitidos nos termos da API
- [ ] Decidir usar ou descartar

**Pronto quando:** existe decisão registrada.

### 115 — Pollen API `[AVALIAR]`

- [ ] Verificar cobertura no Brasil
- [ ] Buscar um caso de uso logístico real
- [ ] Registrar o descarte se não houver

**Pronto quando:** existe decisão registrada; descarte provável.

### 116 — Elevation API

- [ ] Perfil de elevação para trechos de serra e carga pesada
- [ ] Usar como fator na previsão de tempo
- [ ] Avaliar relevo 3D no mapa

**Pronto quando:** rotas com serra têm o fator de relevo registrado.

### 117 — Solar API `[AVALIAR]`

- [ ] Fora do escopo logístico; avaliar só para o telhado dos CDs
- [ ] Conferir cobertura nos endereços
- [ ] Registrar a decisão em ADR

**Pronto quando:** existe decisão registrada; descarte provável dentro deste sistema.

### 118 — Insights de gestão de vias `[AVALIAR]` `[CUSTO]`

- [ ] Estudar os dados de tráfego via BigQuery
- [ ] Verificar disponibilidade e custo no Brasil
- [ ] Decidir pelo volume de rotas recorrentes

**Pronto quando:** existe decisão registrada.

### 119 — Previsão de atraso com fatores reais

- [ ] `predict-delays` recebe distância, tempo com trânsito, clima e relevo (D14)
- [ ] Medir a precisão antes e depois nas visões `v_prediction_accuracy*`
- [ ] Manter os nomes de fatores já usados

**Pronto quando:** a precisão medida melhora ou a mudança é revertida.

### 120 — Alertas de risco na rota

- [ ] Cruzar zonas de risco com as rotas ativas
- [ ] Notificar operador e, conforme preferência, o cliente
- [ ] Evitar alertas repetidos

**Pronto quando:** uma entrega cuja rota cruza zona de risco gera um alerta único.

## Fase 13 — Análise geográfica e conjuntos de dados (121–130)

### 121 — Maps Datasets API

- [ ] Subir polígonos próprios: áreas de entrega, faixas de CEP, regiões de transportadora
- [ ] Versionar e atualizar pelo servidor
- [ ] Usar nas etapas 095 e 122

**Pronto quando:** as áreas da operação são camadas reutilizáveis.

### 122 — Estilo orientado por dados

- [ ] Colorir municípios e estados por volume, SLA e custo
- [ ] Substituir o agrupamento por centro de estado
- [ ] Legenda e filtro por período

**Pronto quando:** o mapa mostra desempenho por região real.

### 123 — Mapas de calor

- [ ] Calor de entregas, ocorrências e atrasos
- [ ] Filtros por período, transportadora e status
- [ ] Dados agregados no banco

**Pronto quando:** o gestor enxerga onde se concentram os problemas.

### 124 — Places Aggregate API `[CUSTO]`

- [ ] Contagem de estabelecimentos por área e tipo
- [ ] Usar em estudo de cobertura e prospecção
- [ ] Limitar a consultas sob demanda

**Pronto quando:** existe um relatório de densidade por área.

### 125 — Places Insights `[AVALIAR]` `[CUSTO]`

- [ ] Avaliar o cruzamento de dados próprios com pontos de interesse no BigQuery
- [ ] Verificar disponibilidade no Brasil
- [ ] Decidir com base no caso de uso da etapa 130

**Pronto quando:** existe decisão registrada.

### 126 — Population Dynamics Insights `[AVALIAR]`

- [ ] Avaliar uso em previsão de demanda regional
- [ ] Verificar disponibilidade e condições de acesso
- [ ] Registrar a decisão

**Pronto quando:** existe decisão registrada.

### 127 — Street View Insights e imagens aéreas `[AVALIAR]`

- [ ] Avaliar Street View Insights, insights e modelos aéreos e de satélite, e embeddings de satélite
- [ ] Buscar caso de uso logístico concreto
- [ ] Registrar a decisão

**Pronto quando:** existe decisão registrada; descarte provável.

### 128 — Google Earth e Earth Engine

- [ ] Projeto colaborativo no Earth com CDs, áreas e corredores
- [ ] Exportar as camadas do sistema para o projeto
- [ ] Avaliar o Earth Engine só se surgir análise em larga escala

**Pronto quando:** o planejamento de malha tem um projeto compartilhado.

### 129 — Painéis por geografia

- [ ] OTIF e SLA por município e por faixa de distância
- [ ] Custo por km por região e transportadora
- [ ] Integração com `PainelOTIF` e `PainelSLA`

**Pronto quando:** os painéis respondem "onde" além de "quanto".

### 130 — Estudo de localização de CD

- [ ] Matriz entre origens candidatas e a base de destinos
- [ ] Custo e tempo médios por cenário
- [ ] Relatório comparando os pontos de origem

**Pronto quando:** existe um relatório indicando de onde é mais barato despachar para cada região.

## Fase 14 — Recursos de IA do Maps (131–140)

### 131 — Grounding with Google Maps no assistente

- [ ] `ai-logistics-assistant` fundamenta respostas sobre locais em dados do Maps
- [ ] Exibir a fonte conforme as regras de atribuição
- [ ] Custo no medidor

**Pronto quando:** o assistente responde sobre um endereço com dado atual e fonte.

### 132 — Ferramentas de agente do Maps via MCP

- [ ] Conectar as ferramentas de agente do Maps aos agentes internos
- [ ] Restringir ao que tem etapa correspondente
- [ ] Registrar o uso

**Pronto quando:** um agente consulta rota e lugar por MCP.

### 133 — Code Assist do Maps no desenvolvimento

- [ ] Configurar o servidor MCP de Code Assist para os agentes que mexem neste repositório
- [ ] Documentar em `docs/agentes/`
- [ ] Rodar a verificação de integridade

**Pronto quando:** os agentes consultam a documentação oficial atual ao escrever código de mapa.

### 134 — Habilidades de agente do Maps

- [ ] Incorporar as boas práticas oficiais às instruções dos agentes
- [ ] Incluir as regras de licença 1 e 2
- [ ] Manter o `AGENTS.md` dentro do limite verificado no CI

**Pronto quando:** as instruções dos agentes cobrem mapa, custo e licença.

### 135 — Kit de interface agêntica `[PRÉ-GA]` `[AVALIAR]`

- [ ] Protótipo de mapa interativo dentro do chat do assistente
- [ ] Sem dependência em fluxo de produção
- [ ] Decidir após o protótipo

**Pronto quando:** existe decisão registrada.

### 136 — Token de visualização de dados agênticos `[PRÉ-GA]` `[AVALIAR]`

- [ ] Verificar o acesso ao pré-lançamento
- [ ] Testar elementos do Places UI Kit em respostas do assistente
- [ ] Registrar a decisão

**Pronto quando:** existe decisão registrada.

### 137 — Agente de otimização de rotas e AI Studio

- [ ] Prototipar no AI Studio a montagem de roteiro por linguagem natural
- [ ] Comparar com a tela da etapa 078
- [ ] Levar à produção só o que superar a tela

**Pronto quando:** existe um protótipo avaliado.

### 138 — Agente de estilo de mapa

- [ ] Gerar variações dos estilos da etapa 042
- [ ] Validar contraste e legibilidade
- [ ] Publicar o escolhido como Map ID

**Pronto quando:** os estilos finais estão publicados.

### 139 — Resumos por IA de lugares `[CUSTO]`

- [ ] Resumo do local e da área no cartão do destino
- [ ] Verificar disponibilidade em português e no Brasil
- [ ] Exibir como informação de apoio, com a fonte

**Pronto quando:** existe decisão de uso com custo por consulta.

### 140 — Maps Imagery Grounding `[PRÉ-GA]`

- [ ] Registrar como indisponível (prévia privada)
- [ ] Reavaliar na revisão da etapa 150
- [ ] Nenhuma dependência criada

**Pronto quando:** o item consta no ADR como "aguardando disponibilidade".

## Fase 15 — Qualidade, segurança e entrada em produção (141–150)

### 141 — Testes unitários

- [ ] Adaptadores, gateway, guardas de custo e de licença
- [ ] Respostas simuladas, sem chamada real no CI
- [ ] Manter os pisos de cobertura do `ci.yml`

**Pronto quando:** os 10 checks obrigatórios passam.

### 142 — Testes de contrato do gateway

- [ ] Casos em `tests/contracts/` para cada operação
- [ ] Registrar em `system_contract_schemas`
- [ ] Falhar quando o formato de um provedor mudar

**Pronto quando:** mudança de formato em provedor é pega em teste.

### 143 — Testes ponta a ponta

- [ ] Fluxos Playwright: cadastrar endereço, ver no mapa, roteirizar, rastrear, trocar provedor
- [ ] Usar o usuário de teste padrão
- [ ] Rodar por `workflow_dispatch`

**Pronto quando:** os cinco fluxos passam em produção com o usuário de teste.

### 144 — Observabilidade e painel de custo

- [ ] Erros de mapa no Sentry com provedor e SKU
- [ ] Painel de gasto por provedor, SKU e tela
- [ ] Alertas de latência e taxa de erro do gateway

**Pronto quando:** o dono vê, por tela, quanto cada funcionalidade de mapa custou no mês.

### 145 — Revisão de segurança

- [ ] Testes de RLS, limite de requisições e CORS do gateway
- [ ] Teste de injeção nos popups (D18)
- [ ] Conferir restrições de chave em produção

**Pronto quando:** `npm run test:security` passa com os casos novos.

### 146 — LGPD da localização do motorista

- [ ] Base legal, finalidade e prazo de retenção em `docs/LGPD_COMPLIANCE.md`
- [ ] Coleta só durante o roteiro, com consentimento
- [ ] Incluir os dados novos em `lgpd-erase-user`

**Pronto quando:** a localização de motorista tem prazo de retenção aplicado no banco.

### 147 — Desempenho

- [ ] Carregamento sob demanda por provedor
- [ ] Manter o teto de 8 MB em `dist/assets`
- [ ] Medir o tempo de abertura das telas de mapa antes e depois

**Pronto quando:** o build passa no teto e o tempo de abertura não piora.

### 148 — Guia de incidente

- [ ] Procedimentos: provedor fora do ar, cota estourada, chave vazada, cobrança inesperada
- [ ] Passo de troca manual de provedor
- [ ] Incluir em `docs/INCIDENT_PLAYBOOK.md`

**Pronto quando:** existe passo a passo testado para cada cenário.

### 149 — Entrada em produção por etapas

- [ ] Ligar por feature flag: admins, depois todos
- [ ] Manter OSM como reserva; aposentar o Nominatim público como fonte principal
- [ ] Critério de volta atrás definido por métrica

**Pronto quando:** o Google está ativo para todos, com a reserva testada.

### 150 — Revisão pós-implantação

- [ ] Comparar custo real com o previsto na etapa 010
- [ ] Medir precisão de endereço, ETA e aderência a roteiro
- [ ] Atualizar `ESTADO_ATUAL.md` e reavaliar os itens `[PRÉ-GA]` e `[AVALIAR]`

**Pronto quando:** existe relatório de 30 dias com custo, ganhos e próximas decisões.

---

## Cobertura: cada produto do Google e sua etapa

| Categoria    | Produto                                                                 | Etapas             |
| ------------ | ----------------------------------------------------------------------- | ------------------ |
| Maps         | Maps JavaScript API                                                     | 041–046            |
| Maps         | Estilo na nuvem, marcadores avançados, componentes web                  | 042, 043, 048      |
| Maps         | Street View dinâmico                                                    | 047                |
| Maps         | Maps 3D e blocos 3D fotorrealistas                                      | 049                |
| Maps         | Map Tiles API                                                           | 050                |
| Maps         | Maps Static, Street View Static, Maps Embed, Maps URLs                  | 103, 104, 105, 085 |
| Maps         | Aerial View, Elevation                                                  | 106, 116           |
| Maps         | SDKs Android, iOS, Flutter e Maps 3D móvel                              | 087                |
| Routes       | Routes API (rotas e matriz)                                             | 061–070            |
| Routes       | Route Optimization                                                      | 072–080            |
| Routes       | Roads                                                                   | 083                |
| Routes       | Navigation SDK, Navigation para Flutter e React Native                  | 087                |
| Routes       | Navigation Connect                                                      | 086                |
| Places       | Places API nova: autocomplete, detalhes, busca por texto e proximidade  | 035, 037, 099, 100 |
| Places       | Places UI Kit, biblioteca Places e SDKs móveis                          | 036, 087           |
| Places       | Geocoding, Address Validation                                           | 031–034            |
| Places       | Geolocation, Time Zone                                                  | 082, 090           |
| Places       | Places Aggregate, Isochrones, Place Photos                              | 124, 094, 110      |
| Ambiente     | Weather, Air Quality, Pollen, Solar                                     | 111, 114, 115, 117 |
| Dados        | Maps Datasets e estilo orientado por dados                              | 121, 122           |
| Dados        | Places Insights, Population Dynamics, Street View Insights, satélite    | 125, 126, 127      |
| Dados        | Roads Management Insights, Google Earth, Earth Engine                   | 118, 128           |
| IA           | Grounding, ferramentas de agente (MCP), Code Assist, habilidades        | 131–134            |
| IA           | Kit agêntico, token de visualização, AI Studio, agentes de rota e estilo | 135–138            |
| IA           | Resumos por IA, Imagery Grounding                                       | 139, 140           |
| Mobilidade   | Transporte e logística, rastreamento de recursos                        | 084                |

## Ordem recomendada de execução

1. **Fases 1 a 4** primeiro: sem chave, camada de provedor, colunas geográficas e endereço confiável, nada
   do resto se sustenta.
2. **Fases 5 e 7** em seguida: mapa real e distância real resolvem D8, D9, D13 e D14.
3. **Fase 10** logo depois: é onde a distância vira dinheiro (cotação, modal, frete interno).
4. **Fases 8 e 9** quando as premissas 7 a 10 forem confirmadas.
5. **Fase 6** em paralelo à fase 5, para a troca de provedor nascer junto.
6. **Fases 11 a 14** por valor, começando pelas etapas sem marca `[AVALIAR]`.
7. **Fase 15** acompanha todas; as etapas 149 e 150 fecham.

## Itens que dependem só do dono

- Responder as 20 premissas da tabela inicial.
- Aprovar o teto mensal (etapa 010) e cada etapa `[CUSTO]`.
- Autorizar as migrations `[DDL]` e as mudanças `[SEGREDO]`, uma PR por vez.
