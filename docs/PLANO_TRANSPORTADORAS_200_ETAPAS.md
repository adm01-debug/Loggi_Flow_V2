# Plano Transportadoras — 200 etapas (Rodonaves a fundo + multitransportadora)

Plano para o Loggi Flow V2 aproveitar **tudo** o que a Rodonaves expõe e automatizar o ciclo
cotação → coleta → rastreio → comprovante → conciliação em todas as transportadoras da operação.

- **Criado em:** 2026-11-22
- **Base de código lida:** `main` em `1e7410e`
- **Fontes:** 18 arquivos enviados (doc do MCP Rodonaves v6.9.0, auditoria de 139 endpoints, 4 análises de API,
  5 specs OpenAPI — tracking 1.27.3, quotation 1.19.10, customer 1.24.7, pickup 1.17.12, selfattendance 1.99.4 —,
  análise do portal dev.rodonaves, script Python de cotação) + o código deste repositório + 4 chamadas reais à
  API Rodonaves feitas hoje pelo MCP.
- **Estado:** plano. Nenhuma etapa executada.

## Como ler

Mesmas marcas do plano Google Maps:

| Marca       | Significado                                                                         |
| ----------- | ----------------------------------------------------------------------------------- |
| `[DDL]`     | Mexe no banco de produção. PR fica aberta aguardando o dono (regra 8 do Fluxo Git). |
| `[SEGREDO]` | Envolve credencial, secret, CI. PR fica aberta aguardando o dono.                   |
| `[CUSTO]`   | Gera cobrança nova ou recorrente.                                                   |
| `[RTE]`     | Depende de liberação de escopo pela Rodonaves (hoje HTTP 403 para `isMaster=N`).    |
| `[AVALIAR]` | Valor ou risco incerto. A etapa entrega uma decisão registrada.                     |

Regras fixas: uma etapa = uma branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>` = uma PR; tabela nova com `deleted_at`
e RLS; edge function sem `console.*`; **a API Rodonaves não tem homologação** — toda escrita (cotação com
protocolo, coleta, cliente, endereço) é produção real e nasce atrás de feature flag desligada.

---

## 1. Veredito

**O Loggi Flow V2 tem a superfície da Rodonaves, mas não o aproveitamento.** Existem 59 ações na edge
`rodonaves-api`, 15 componentes `RTE*` e 2.769 linhas em `src/lib/rodonaves/`. Porém o caminho que gera valor
está quebrado no código:

| Fluxo                          | Estado real                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Cotação (ação `quotation`)     | 🔴 Manda campos legados em português; a API responde **400** (testado hoje)                 |
| Sincronização de rastreio      | 🔴 Lê o formato antigo (`Tracking[]`/`CodigoOcorrencia`); nunca atualiza nada               |
| Rastreio unitário na tela      | 🔴 Mesmo formato antigo; os eventos não aparecem                                            |
| Autoatendimento, CEP, prazo    | 🔴 Apontam para `01wapi` (desligado em out/2025); responde **404** (testado hoje)           |
| Cobertura (malha)              | 🔴 Caminho errado; a API responde **400** (testado hoje) → cobertura sempre "indeterminada" |
| Health dos gateways            | 🟨 Funciona, mas 3 caminhos errados e selfattendance no domínio morto                       |
| Webhook Rodonaves              | ⬛ A Rodonaves não envia webhook; e o mapa de códigos marca **extravio como entregue**      |
| Persistência de CT-e e eventos | ⬛ Não existe tabela; nada é guardado                                                       |
| Automação agendada             | ⬛ Nenhum cron de rastreio, POD, alerta ou conciliação                                      |
| Frete cobrado / fatura         | ⬛ Nenhuma fonte (endpoint `orders` dá 403; portal não integrado)                           |
| Dicionário de eventos          | ⬛ `eventCodes.ts`, `freightHealth.ts`, `capabilities.ts` só são usados por testes          |

Nas outras transportadoras: **Lalamove** cota e cria pedido, mas a tabela de pedidos foi apagada; **Melhor
Envio** tem 30 ações e nenhuma automação, e não se sabe se roda em sandbox ou produção; **Total Express** tem
MCP pronto e zero integração; a escolha de transportadora (`smart-carrier-selection`) usa só tabela estática
de preço por kg, nunca cotação real.

## 2. Diagnóstico com evidência

| #   | Achado                                                                                                                                            | Evidência                                                                                                  | Verificado                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| R1  | Cotação envia `CepOrigem/CepDestino/Peso/Volumes/ValorMercadoria/CnpjRemetente`                                                                   | `supabase/functions/rodonaves-api/index.ts:724-732`                                                        | ✅ API 400: "OriginZipCode… obrigatório" |
| R2  | `sync-tracking` lê `Tracking[0].CodigoOcorrencia` (schema v1); v3 devolve `Events[]` com `EventCode/ProcedaCode`                                  | `rodonaves-api/index.ts:1625-1649`; spec tracking 1.27.3 `TrackingResponse`                                | Código + spec                            |
| R3  | `sync-tracking` busca só por NF; não usa chave NF-e, protocolo nem CT-e                                                                           | `rodonaves-api/index.ts:1622`                                                                              | Código                                   |
| R4  | Mapa de status do sync não segue Proceda (43=feriado vira "saiu para entrega")                                                                    | `rodonaves-api/index.ts:144-200`                                                                           | Código + tabela 113 códigos              |
| R5  | Autoatendimento e prazo apontam para `https://01wapi.rte.com.br`                                                                                  | `rodonaves-api/index.ts:18,21`                                                                             | ✅ 404 no legado                         |
| R6  | Endereço por CEP usa `/webapi/address/zipcode`, inexistente no spec (é `/webapi/city/zipcodeaddress`)                                             | `rodonaves-api/index.ts:324`; spec selfattendance 1.99.4                                                   | Código + spec                            |
| R7  | Malha usa `/api/v1/unittocity`; o real é `/api/v1/unittocity/getWithHallsByDestinationAddressAndCustomers` e a resposta traz `Unit`, não `UnitId` | `rodonaves-api/index.ts:394,414`                                                                           | ✅ API 400                               |
| R8  | Health de quotation e customer usa `/api/healthcheck`; o certo é `/webapi/healthcheck`                                                            | `rodonaves-api/index.ts:435,437`                                                                           | Spec                                     |
| R9  | Token guardado só 25 min e por isolado; o real dura 5 h                                                                                           | `rodonaves-api/index.ts:139`                                                                               | Doc MCP                                  |
| R10 | `rodonaves-webhook` marca códigos 80–85 como **entregue** (80 = extravio total, 81 = parcial)                                                     | `supabase/functions/rodonaves-webhook/index.ts:20`                                                         | Código + tabela oficial                  |
| R11 | A Rodonaves não oferece webhook (integração só por consulta)                                                                                      | Doc oficial (análise do portal, seção 17)                                                                  | Doc                                      |
| R12 | Tela de rastreio unitário lê `data.Tracking`                                                                                                      | `src/components/rodonaves/RTETrackingPanel.tsx:102-103`; `src/hooks/logistics/useRodonavesTracking.tsx:24` | Código                                   |
| R13 | Dicionário de eventos e saúde do frete não têm consumidor fora de testes                                                                          | `src/lib/rodonaves/eventCodes.ts`, `freightHealth.ts`, `capabilities.ts` (grep sem import)                 | Código                                   |
| R14 | Nenhum cron de rastreio/POD/conciliação; só health, purge e rollup de SLO                                                                         | `supabase/migrations/20260901000000_cron_jobs_canonical.sql`                                               | Código                                   |
| R15 | `entregas` não tem protocolo, CT-e, chave NF-e, peso, volumes, dimensões, valor NF, cubagem                                                       | `supabase/schema-catalog.json` (gerado 2026-11-17)                                                         | Catálogo                                 |
| R16 | `rastreamento_historico` exige `lalamove_order_id NOT NULL`: não cabe evento de outra transportadora                                              | `schema-catalog.json`                                                                                      | Catálogo                                 |
| R17 | Tabela `lalamove_orders` foi apagada; pedidos Lalamove não são guardados                                                                          | `supabase/migrations/20260831120100_drop_legacy_objects_d2.sql:13-15`                                      | Código                                   |
| R18 | Escolha de transportadora usa só `tabelas_frete` (preço/kg por UF)                                                                                | `supabase/functions/smart-carrier-selection/index.ts:52-90`                                                | Código                                   |
| R19 | Total Express sem integração (só existe o MCP externo)                                                                                            | grep `totalexpress` vazio em `src/` e `supabase/`                                                          | Código                                   |
| R20 | Transportadoras do seed com CNPJ falso (`12345678000102…`)                                                                                        | `supabase/seed.sql:33-38`                                                                                  | Código                                   |
| R21 | Melhor Envio: sandbox e produção coexistem; ativo depende de segredo                                                                              | `supabase/functions/melhor-envio-api/index.ts:9-10`; `ESTADO_ATUAL.md:354`                                 | Código                                   |
| R22 | Documentos enviados trazem senhas e token de deploy em texto aberto                                                                               | `RODONAVES_MCP_DOCUMENTACAO_COMPLETA.md` §3; `ANALISE_UNIFICADA` A1                                        | Doc                                      |
| R23 | Dados de produção (volume real, uso das telas) não puderam ser lidos: o MCP do banco `jvfhclubfpxrtrrazrgr` não está conectado nesta sessão       | —                                                                                                          | NÃO VERIFICADO                           |

## 3. O que a Rodonaves oferece e o que o sistema usa

| Capacidade Rodonaves                                                             | Escopo hoje (BRASILMARCAS, `isMaster=N`) | Usado no Loggi Flow      | Etapas       |
| -------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------ | ------------ |
| Simular cotação (sem protocolo)                                                  | ✅                                       | 🔴 payload errado        | 001, 037–040 |
| Gerar cotação com protocolo                                                      | ✅ (exige `OriginCityId` válido)         | 🟨 repassa body cru      | 041–044      |
| Prazo PF/PJ, cubagem, validade, distância                                        | ✅ na resposta da cotação                | ❌                       | 045–047      |
| Rastreio unitário (protocolo, NF, chave, CT-e)                                   | ✅                                       | 🔴 tela quebrada         | 005, 053     |
| Rastreio em lote / por data de ocorrência                                        | ✅                                       | 🟨 ação sem uso          | 051–056      |
| Etapas detalhadas (`StepCode`, `TypeUnity`)                                      | ✅                                       | 🟨 ação sem persistência | 057          |
| `IsCustomerPortal=false` (mostra extravio total)                                 | ✅                                       | ❌                       | 059          |
| Reagendamento de entrega (`NewDateSchedule`, `Reason`)                           | ✅ na resposta                           | ❌                       | 061          |
| NF recusada (`RefusedInvoice`)                                                   | ✅ na resposta                           | ❌                       | 062          |
| Comprovante de entrega (base64)                                                  | ✅                                       | 🟨 tela, sem guardar     | 065–068      |
| Comprovante HQ, lote, por chave, de ocorrência                                   | 403 / não testado                        | 🟨 ações existem         | 069–072, 109 |
| Pedidos com frete cobrado e vencimento (`orders`)                                | 403                                      | 🟨 ação existe           | 097, 109     |
| Coleta por protocolo, datas, reagendar, cancelar, finalizar, Express, automática | não testado em escrita / parte 403       | 🟨 ações existem         | 075–086      |
| Cliente por CNPJ, cadastro, endereço, pessoa                                     | CNPJ ✅; resto 403 ou escrita            | 🟨 tela                  | 087–090      |
| Malha (unidade, halls, IBGE)                                                     | ✅                                       | 🔴 caminho errado        | 004, 091–094 |
| Peso cubado do cliente                                                           | 403 (fallback fator 300)                 | 🟨 ação existe           | 046          |
| Autoatendimento (cotação IBGE, prazo, bots, calendário)                          | 403 em quase tudo                        | 🔴 domínio morto         | 003, 095     |
| Discovery interno (`/api/objects`)                                               | ✅                                       | ❌                       | 112          |
| PIX de frete                                                                     | 403                                      | ❌                       | 116          |
| DataStudio (lead com UTM)                                                        | 403                                      | ❌                       | 115          |
| DNE                                                                              | offline desde abr/2026                   | 🟨 fallback ViaCEP       | 093, 113     |
| Portal web (pedidos com frete, boletos, anomalias)                               | ✅ via cookie de sessão (frágil)         | ❌                       | 098–100      |
| EDI (NOTFIS, CONEMB, OCOREN, PREFAT, DOCCOB)                                     | sob contrato                             | ❌                       | 180–184      |
| Etiqueta CODE-128C                                                               | padrão público                           | ❌                       | 177–178      |

## 4. Premissas (pendentes de confirmação do dono)

| #   | Premissa assumida                                                                                                         | Etapas afetadas |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | Transportadoras principais: Rodonaves, Lalamove, Melhor Envio (Correios/Jadlog/Loggi/Azul), Total Express e frota própria | 117–152         |
| 2   | Origem padrão é a filial 207 (São Paulo); a unidade de Goiás pode virar segunda origem                                    | 043, 091, 160   |
| 3   | Toda entrega tem NF-e com chave de 44 dígitos antes do despacho                                                           | 013, 053, 182   |
| 4   | Cotação com protocolo só é gerada quando o pedido é fechado; antes disso, só simulação                                    | 041, 154        |
| 5   | Coleta Rodonaves pode ser pedida automaticamente após faturamento                                                         | 075–078         |
| 6   | O cliente final é avisado por WhatsApp nos marcos coletado, chegou na cidade, saiu, entregue                              | 165–167         |
| 7   | Comprovante e status voltam para o card do Bitrix24 (SPA EXPEDIÇÃO)                                                       | 169–171         |
| 8   | Extravio e avaria abrem processo de indenização com prazo e responsável                                                   | 063, 174        |
| 9   | Uso do portal web por cookie é aceito só como reserva temporária até liberar o escopo `orders`                            | 098–100, 109    |
| 10  | Nenhuma transportadora nova entra sem cadastro real (CNPJ verdadeiro, contato, credencial)                                | 020, 153        |

---

## Fase 1 — Correções críticas da Rodonaves (001–012)

### 001 — Cotação com o payload da API v3

- [ ] `simulateQuotation` passa a enviar `OriginZipCode`, `DestinationZipCode`, `TotalWeight`, `EletronicInvoiceValue`, `CustomerTaxIdRegistration`, `TotalPackages`, `Packs` (R1)
- [ ] Manter os nomes de entrada da ação `quotation` para não quebrar o front
- [ ] Teste com resposta gravada da API

**Pronto quando:** a ação `quotation` devolve `Value` e `DeliveryTime` em chamada real.

### 002 — Sincronização lendo `Events[]`

- [ ] `sync-tracking` usa o último evento de `Events` ordenado por `Date` (R2)
- [ ] Status derivado de `EventCode`+`ProcedaCode` pelo dicionário `eventCodes.ts` (R4, R13)
- [ ] Ocorrência gravada com código e descrição reais

**Pronto quando:** uma entrega Rodonaves em trânsito muda de status sem clique.

### 003 — Tirar o domínio `01wapi` do código

- [ ] `SELFATTENDANCE_GATEWAY` = `selfattendance-apigateway.rte.com.br`; remover `DEADLINE_GATEWAY` (R5)
- [ ] Ação `deadline` passa a usar o prazo da simulação de cotação
- [ ] Ações de autoatendimento devolvem `RTE_SCOPE_BLOCKED` explícito quando 403

**Pronto quando:** `grep 01wapi` não retorna nada em `supabase/functions`.

### 004 — Malha de atendimento no caminho certo

- [ ] Caminho `getWithHallsByDestinationAddressAndCustomers` com CEP, cidade, UF, bairro e CNPJs (R7)
- [ ] Preencher cidade/UF/bairro via `resolve-address` antes de chamar
- [ ] `checkCoverage` lê `Unit.Code` e devolve `IbgeCityCode` e halls

**Pronto quando:** `check-coverage` para 80010010 devolve `covered: true` e unidade.

### 005 — Rastreio unitário na tela

- [ ] `RTETrackingPanel` e `useRodonavesTracking` usam o tipo `TrackingResponse` do spec (R12)
- [ ] Linha do tempo com `Events` e, em aba, `trackingSteps`
- [ ] Estado vazio para resposta 204

**Pronto quando:** rastrear um protocolo real mostra todos os eventos.

### 006 — Neutralizar o webhook Rodonaves

- [ ] Remover o mapa errado (80–85 = entregue) (R10)
- [ ] Decidir: apagar a função ou mantê-la só para EDI/integrador futuro (R11)
- [ ] Registrar a decisão em ADR

**Pronto quando:** nenhum caminho do sistema marca extravio como entregue.

### 007 — Corrigir health dos gateways

- [ ] Caminhos `/webapi/healthcheck` para quotation, customer e selfattendance (R8)
- [ ] Marcar DNE como "offline conhecido" sem disparar alerta repetido
- [ ] Conferir o cron `rte-gateway-health-check` gravando o resultado correto

**Pronto quando:** o painel de SLO mostra 7/8 online, igual ao health do MCP.

### 008 — Endereço por CEP no endpoint real

- [ ] Trocar `/webapi/address/zipcode` por `/webapi/city/zipcodeaddress` (R6)
- [ ] Manter ViaCEP e BrasilAPI como reserva, com a fonte na resposta
- [ ] Cache por CEP

**Pronto quando:** `resolve-address` responde em menos de 1 s para CEP repetido.

### 009 — Token com validade real e compartilhado

- [ ] Guardar token por gateway no Redis com TTL de 4h50 (R9)
- [ ] Deduplicar pedidos simultâneos de token
- [ ] Renovar automaticamente em 401

**Pronto quando:** o log mostra no máximo um `/token` por gateway a cada 5 h.

### 010 — Erros da API traduzidos

- [ ] Ler o formato FluentValidation (`errors.{Campo}[]`) e devolver campo e mensagem
- [ ] Mapear mensagens de negócio: "Usuário não relacionado ao CNPJ", "Não localizada unidade", "Cliente destinatário não encontrado"
- [ ] Exibir no front em português claro

**Pronto quando:** uma cotação inválida mostra qual campo corrigir.

### 011 — Ações bloqueadas sinalizadas

- [ ] Tabela de escopo por ação (liberado / 403 / escrita) em `capabilities.ts`, agora consumida pelo front (R13)
- [ ] Botões de ação 403 aparecem desabilitados com o motivo
- [ ] Atualizar a tabela automaticamente quando a etapa 112 detectar liberação

**Pronto quando:** nenhum botão chama uma ação sabidamente bloqueada.

### 012 — Testes de contrato contra os specs

- [ ] Validar os bodies e respostas das ações contra os 5 specs OpenAPI versionados em `docs/integracoes/rodonaves/`
- [ ] Rodar no CI sem chamada real
- [ ] Falhar se um campo enviado não existir no spec

**Pronto quando:** reintroduzir `CepOrigem` quebra o CI.

## Fase 2 — Modelo de dados multitransportadora (013–024)

### 013 — Dados fiscais e físicos na entrega `[DDL]`

- [ ] Colunas `chave_nfe`, `valor_nf`, `peso_kg`, `volumes`, `dimensoes` (jsonb), `peso_cubado_kg`, `cnpj_destinatario` (R15)
- [ ] Validar chave NF-e (44 dígitos, dígito verificador)
- [ ] Preencher a partir do XML (etapa 182) quando houver

**Pronto quando:** toda entrega nova tem chave, peso e valor.

### 014 — Envio por transportadora `[DDL]`

- [ ] Tabela `envios_transportadora`: entrega, transportadora, protocolo, CT-e, série, chave CT-e, `bill_of_lading_id`, unidade emissora, prazo previsto, status normalizado, último evento
- [ ] Uma entrega pode ter mais de um envio (reentrega, redespacho)
- [ ] RLS e `deleted_at`

**Pronto quando:** um protocolo Rodonaves fica guardado ligado à entrega.

### 015 — Eventos de rastreio de qualquer transportadora `[DDL]`

- [ ] Tabela `eventos_rastreio`: envio, data, código original, código normalizado, fase, descrição, motivo, nova data, fonte, `raw` jsonb
- [ ] Índice único por envio + data + código para não duplicar
- [ ] Particionar por mês, como `rastreamento_historico`

**Pronto quando:** eventos Rodonaves, Total Express e Melhor Envio convivem na mesma tabela (R16).

### 016 — Dicionário de códigos no banco `[DDL]`

- [ ] Tabela `codigos_rastreio`: transportadora, sistema (EventCode, StepCode, Proceda, próprio), código, fase, categoria, severidade
- [ ] Carga inicial: 113 códigos Proceda + StepCodes conhecidos (1, 19, 29, 43–47, 72–74, 80, 117, 158, 204–209, 217–220, 302)
- [ ] Código desconhecido entra como "novo" e gera alerta

**Pronto quando:** um código novo aparece numa tela de pendências em vez de virar "em trânsito".

### 017 — Cotações completas `[DDL]`

- [ ] `cotacoes_frete` ganha protocolo, validade, `cubado`, distância, prazo PF/PJ, unidade origem/destino, payload e resposta
- [ ] Status: simulada, gerada, convertida em coleta, expirada
- [ ] Origem da cotação (manual, automática, multicanal)

**Pronto quando:** dá para auditar qualquer cotação um mês depois.

### 018 — Coletas com vínculo à transportadora `[DDL]`

- [ ] `coletas` ganha `protocolo_cotacao`, `id_coleta_transportadora`, `janela_inicio/fim`, motorista e placa retornados
- [ ] Histórico de reagendamento e cancelamento
- [ ] Ocorrência de coleta separada da de entrega

**Pronto quando:** a coleta Rodonaves mostra motorista e veículo quando a API devolver.

### 019 — Faturas e conciliação de frete `[DDL]`

- [ ] Tabela `faturas_transportadora` (número, vencimento, valor, boleto, status) e `itens_fatura` (CT-e, valor cobrado)
- [ ] Ligar item à entrega pela chave do CT-e ou NF
- [ ] Reaproveitar `conciliacoes` existente

**Pronto quando:** cada CT-e tem valor cotado e valor cobrado lado a lado.

### 020 — Cadastro real de transportadoras `[DDL]`

- [ ] Remover CNPJs falsos do seed e conferir produção (R20)
- [ ] Rodonaves com CNPJ 44.914.992/0001-38, filial vinculada 207 e rank Diamond
- [ ] Campo `codigo_integracao` (rodonaves, lalamove, melhor_envio, total_express, frota)

**Pronto quando:** a escolha de transportadora não depende de busca por nome com `ilike`.

### 021 — Unidades e malha `[DDL]`

- [ ] Tabela `unidades_transportadora` (código, nome, sigla, cidade, IBGE)
- [ ] Tabela `malha_cep` (CEP/faixa → unidade, setor, halls, IBGE, consultado em)
- [ ] Alimentada pela etapa 091

**Pronto quando:** a cobertura de um CEP é respondida pelo banco sem chamar a API.

### 022 — Mapa CEP → CityId Rodonaves `[DDL]`

- [ ] Tabela `rte_city_ids` (CEP, CityId, cidade, UF, IBGE, fonte)
- [ ] Carregar os 670+ CEPs do mapa estático do MCP e os já descobertos (9668 SP, 8997 Rib. Preto, 3065 Curitiba)
- [ ] Atualizar a cada cotação bem-sucedida

**Pronto quando:** `gera-cotacao` nunca sai com `OriginCityId` 99999.

### 023 — Notificações enviadas `[DDL]`

- [ ] Tabela `notificacoes_envio`: envio, canal, gatilho, destinatário, status, erro
- [ ] Impedir aviso repetido do mesmo marco
- [ ] Guardar consentimento do destinatário

**Pronto quando:** dá para provar quem foi avisado e quando.

### 024 — Tipos, RLS e auditoria das tabelas novas

- [ ] Regenerar `types.ts` pelo workflow de tipos
- [ ] Policies por papel e casos em `tests/security/rls-access.spec.ts`
- [ ] Trilha em `audit_logs` para alteração manual de status

**Pronto quando:** `npm run test:rls` passa com as tabelas 013–023.

## Fase 3 — Camada única de transportadoras (025–036)

### 025 — Contrato `CarrierAdapter`

- [ ] Operações: `quote`, `book`, `pickup`, `track`, `proof`, `cancel`, `coverage`, `invoices`
- [ ] Toda resposta normalizada com `carrier`, `raw`, `fetched_at`
- [ ] Cada adaptador declara quais operações suporta

**Pronto quando:** o front não conhece mais nenhuma API de transportadora diretamente.

### 026 — Edge `carrier-gateway`

- [ ] Roteia para os adaptadores Rodonaves, Lalamove, Melhor Envio, Total Express e frota
- [ ] JWT obrigatório, rate limit e CORS restrito
- [ ] Circuit breaker por transportadora

**Pronto quando:** derrubar uma transportadora não afeta as outras.

### 027 — Adaptador Rodonaves

- [ ] Encapsula `rodonaves-api` corrigida (fase 1)
- [ ] Usa o dicionário 016 para normalizar eventos
- [ ] Fallbacks do MCP (ViaCEP, IBGE, CityId estático, fator 300) portados

**Pronto quando:** a suíte da etapa 036 passa para Rodonaves.

### 028 — Status canônico único

- [ ] Fases: cotado, coleta agendada, coletado, transferência, distribuição, no destino, em rota, entregue, ocorrência, devolvido, extraviado, cancelado
- [ ] Mapa de cada transportadora para essas fases
- [ ] Enum `entrega_status` alinhado `[DDL]`

**Pronto quando:** kanban e painéis usam as mesmas fases para todas.

### 029 — Idempotência nas escritas

- [ ] Chave de idempotência em cotação com protocolo, coleta e pedido Lalamove
- [ ] Reaproveitar `_shared/idempotency.ts`
- [ ] Repetir a chamada devolve o mesmo resultado

**Pronto quando:** clique duplo não cria duas coletas.

### 030 — Timeouts e retentativas por perfil

- [ ] Manter perfis por gateway e aplicar backoff exponencial só em 5xx e tempo esgotado
- [ ] Nunca repetir escrita sem idempotência
- [ ] Registrar latência por chamada

**Pronto quando:** a taxa de erro por instabilidade da RTE cai sem duplicar escrita.

### 031 — Credenciais por transportadora `[SEGREDO]`

- [ ] Segredos `RODONAVES_*`, `LALAMOVE_*`, `MELHOR_ENVIO_*`, `TOTAL_EXPRESS_*` só no Supabase
- [ ] Remover a coluna `transportadoras.credentials` do front (somente servidor)
- [ ] Tela mostra só "configurado / não configurado"

**Pronto quando:** nenhuma credencial chega ao navegador.

### 032 — Registro de chamadas

- [ ] Tabela `carrier_api_calls` (transportadora, operação, status, latência, erro, usuário) `[DDL]`
- [ ] Retenção de 30 dias
- [ ] Painel de erros por operação

**Pronto quando:** dá para responder "por que essa cotação falhou ontem".

### 033 — Fila de trabalhos assíncronos

- [ ] Fila (pgmq) para rastreio em massa, download de POD e conciliação `[DDL]`
- [ ] Worker agendado consome em lotes
- [ ] Reprocessamento com limite de tentativas

**Pronto quando:** sincronizar 500 envios não estoura o tempo de uma edge function.

### 034 — Feature flags por transportadora e operação

- [ ] Flag para cada escrita (coleta automática, cotação com protocolo, cadastro de cliente)
- [ ] Liberar primeiro para admin
- [ ] Desligar em um clique

**Pronto quando:** qualquer automação nova pode ser desligada sem deploy.

### 035 — Tela "Integrações de transportadoras"

- [ ] Status, escopo liberado, últimas falhas e última sincronização por transportadora
- [ ] Botão "testar conexão"
- [ ] Unificar `GestaoRodonaves`, `GestaoMelhorEnvio` e a parte de transportadoras

**Pronto quando:** o admin vê a saúde de todas as integrações em uma tela.

### 036 — Suíte comum de adaptadores

- [ ] Mesmos casos para todos: cotação OK, CEP não atendido, rastreio vazio, entrega, ocorrência
- [ ] Respostas gravadas, sem rede no CI
- [ ] Entrar no `npm run test`

**Pronto quando:** todo adaptador novo passa na suíte antes do merge.

## Fase 4 — Cotação Rodonaves completa (037–050)

### 037 — Simulação no padrão

- [ ] Usar `simula-cotacao` para qualquer cotação sem pedido fechado (premissa 4)
- [ ] Sempre enviar `Packs` e `TotalPackages` (sem eles a API recusa)
- [ ] Gravar em `cotacoes_frete` como "simulada"

**Pronto quando:** toda simulação fica registrada com valor e prazo.

### 038 — Cache de simulação

- [ ] Chave por CEP origem, CEP destino, peso, cubagem e valor NF
- [ ] Validade até `ExpirationDay` ou 10 min, o menor
- [ ] Indicar no front quando veio do cache

**Pronto quando:** a mesma simulação repetida não chama a API.

### 039 — Dimensões e cubagem no formulário

- [ ] Campos de volumes com comprimento, altura, largura e peso por pacote, em cm
- [ ] Peso cubado calculado localmente (fator do cliente ou 300)
- [ ] Alerta quando `Cubed: true` voltar ("revisar embalagem")

**Pronto quando:** o operador vê antes de fechar se está pagando volume.

### 040 — Biblioteca de embalagens

- [ ] Cadastro de caixas padrão da Promo Brindes com medidas e peso vazio `[DDL]`
- [ ] Escolher caixa preenche as dimensões
- [ ] Sugestão de caixa por quantidade de itens

**Pronto quando:** cotar um pedido recorrente não exige digitar medidas.

### 041 — Cotação com protocolo no fechamento

- [ ] `gera-cotacao` disparada quando a entrega é confirmada (premissa 4)
- [ ] Campos obrigatórios: CNPJ destinatário, contato, telefone
- [ ] Guardar `ProtocolNumber` no envio

**Pronto quando:** todo pedido fechado tem protocolo Rodonaves.

### 042 — `OriginCityId` e `DestinationCityId` resolvidos

- [ ] Resolver pelo cache 022, depois pela malha (004), depois pelo mapa estático
- [ ] Bloquear envio com 99999 (bug conhecido da API)
- [ ] Registrar CEP sem CityId para tratamento

**Pronto quando:** zero erros "unidade que atenda a cidade 99999".

### 043 — Origem configurável

- [ ] Origem padrão filial 207 / CEP da Promo Brindes
- [ ] Segunda origem (Goiás) selecionável (premissa 2)
- [ ] CNPJ remetente por origem

**Pronto quando:** dá para cotar saindo de cada origem cadastrada.

### 044 — Atualizar contato e NF-e da cotação

- [ ] `atualiza-contato-cotacao` quando o contato mudar no pedido
- [ ] `atualiza-nfe-cotacao` assim que a NF-e for emitida
- [ ] Erro tratado se a cotação expirou

**Pronto quando:** a cotação na RTE tem a chave da NF-e do pedido.

### 045 — Prazo PF/PJ e validade

- [ ] Mostrar prazo total = `DeliveryTime` + acréscimo PF ou PJ conforme destinatário
- [ ] Mostrar validade da cotação e avisar 2 dias antes de vencer
- [ ] Recotar automaticamente cotação vencida não usada

**Pronto quando:** a previsão mostrada ao cliente considera PF/PJ.

### 046 — Fator de cubagem do cliente `[RTE]`

- [ ] Chamar `peso-cubado`; em 403 usar 300 e marcar "fator padrão"
- [ ] Reconsultar semanalmente para detectar liberação
- [ ] Guardar o fator em `transportadoras`

**Pronto quando:** o cálculo local usa o fator real assim que liberado.

### 047 — Distância e custo por km

- [ ] Guardar `Distance` da resposta
- [ ] Custo por km e por kg nas telas de cotação e relatório
- [ ] Comparar com as outras transportadoras (fase 14)

**Pronto quando:** dá para ordenar cotações por custo por km.

### 048 — Cobertura antes de cotar

- [ ] Chamar a cobertura (etapa 092) antes da simulação
- [ ] CEP não atendido (ex.: Rio de Janeiro, Campinas nos testes) sai direto para outra transportadora
- [ ] Explicar ao operador

**Pronto quando:** nenhuma cotação Rodonaves é tentada para CEP fora da malha.

### 049 — Cotação Transportadora Digital `[AVALIAR]`

- [ ] Testar `gera-cotacao-transp-digital` com `SkipRegistration` (hoje 500)
- [ ] Se funcionar, usar para destinatário PF sem cadastro
- [ ] Senão, registrar e reportar à RTE (etapa 114)

**Pronto quando:** existe decisão registrada.

### 050 — Cotação em lote

- [ ] Cotar vários pedidos de uma vez (CSV ou seleção no kanban)
- [ ] Execução pela fila 033
- [ ] Exportar resultado

**Pronto quando:** 50 pedidos são cotados sem travar a tela.

## Fase 5 — Rastreio Rodonaves automatizado (051–064)

### 051 — Cron de sincronização

- [ ] A cada 30 min em horário comercial e 1 h fora dele (R14)
- [ ] Usa `tracking/batch` por janelas de 1 dia para não truncar
- [ ] Grava em `eventos_rastreio` e atualiza `envios_transportadora`

**Pronto quando:** o cron roda e o painel mostra a última sincronização.

### 052 — Janelas e paginação seguras

- [ ] Janela diária com `AmountByPage` pequeno; dividir quando a resposta vier cortada
- [ ] Detectar paginação que repete registros (bug relatado) e parar
- [ ] Log de quantos fretes por janela

**Pronto quando:** a soma por janela bate com o total do período.

### 053 — Busca pela chave da NF-e

- [ ] Rastreio unitário por `InvoiceKey`, depois protocolo, depois CT-e, depois NF (R3)
- [ ] Guardar o identificador que funcionou
- [ ] Entregas sem nenhum identificador vão para pendência

**Pronto quando:** o rastreio não depende do número da NF sozinho.

### 054 — Descoberta de fretes não cadastrados

- [ ] Todo CT-e do lote sem entrega vinculada vira pendência "frete sem pedido"
- [ ] Sugerir vínculo por NF e destinatário
- [ ] Relatório diário

**Pronto quando:** nenhum frete Rodonaves passa despercebido.

### 055 — Varredura por data de ocorrência

- [ ] Rodar `batchByOccurrenceDate` diariamente para pegar evento novo em frete antigo
- [ ] Reprocessar só os envios afetados
- [ ] Complementa o cron 051

**Pronto quando:** um reagendamento em frete do mês passado aparece no mesmo dia.

### 056 — Carga histórica

- [ ] Varrer desde out/2022 em janelas mensais pela fila
- [ ] Respeitar limite de chamadas
- [ ] Relatório de quantos CT-es foram importados

**Pronto quando:** o histórico completo está no banco para os painéis.

### 057 — Etapas detalhadas

- [ ] Buscar `trackingSteps` só para envios com mudança ou em exceção
- [ ] Guardar `StepCode`, `TypeUnity` (CTC, FRQ) e unidade
- [ ] Não misturar com `EventCode` na mesma regra

**Pronto quando:** o detalhe do envio mostra a rota entre unidades.

### 058 — Fim do rastreio

- [ ] Parar de consultar envio entregue há 7 dias, devolvido ou cancelado
- [ ] Reabrir se surgir evento pela etapa 055
- [ ] Reduz chamadas

**Pronto quando:** o volume de consultas por dia cai sem perder evento.

### 059 — Ver extravio total

- [ ] Sempre consultar com `IsCustomerPortal=false`
- [ ] Teste garantindo o parâmetro
- [ ] Ocorrência 80 vira alerta crítico

**Pronto quando:** um extravio total nunca fica oculto.

### 060 — Atraso calculado em dias úteis

- [ ] Prazo = emissão + `ExpectedDeliveryDays` úteis, com feriados nacionais e do destino `[DDL]`
- [ ] Marcar atrasado quando passar sem entrega
- [ ] Alimentar `predict-delays`

**Pronto quando:** o atraso bate com o critério da Rodonaves.

### 061 — Reagendamento de entrega

- [ ] Ler `NewDateSchedule` e `Reason` dos eventos
- [ ] Atualizar a previsão da entrega e registrar o motivo
- [ ] Avisar o cliente (etapa 166)

**Pronto quando:** nova data aparece no pedido sem digitação.

### 062 — NF recusada

- [ ] Ler `RefusedInvoice` e abrir ocorrência de recusa por NF
- [ ] Iniciar o fluxo de devolução (etapa 173)
- [ ] Avisar o vendedor

**Pronto quando:** recusa gera tarefa no mesmo ciclo da sincronização.

### 063 — Detector de exceções

- [ ] Regras do MCP: só 204 há mais de 7 dias, sem evento há 48 h, 72/73 extravio, 29 após extravio (suspeito), 19/117 reentrega
- [ ] Classificação parado, atrasado, extravio, ocorrência
- [ ] Usar `freightHealth.ts` existente (R13)

**Pronto quando:** cada envio problemático tem uma classificação visível.

### 064 — Central de rastreamento Rodonaves

- [ ] `CentralRastreamento` mostra envios RTE com fase, previsão, último evento e exceção
- [ ] Filtros por fase, destinatário, UF e unidade
- [ ] Linha do tempo no detalhe

**Pronto quando:** ninguém precisa abrir o portal da Rodonaves para acompanhar.

## Fase 6 — Comprovante e ocorrências (065–074)

### 065 — Baixar comprovante na entrega

- [ ] Ao detectar entrega (EventCode 6/1 ou StepCode 1), baixar `deliveryreceipt`
- [ ] Converter base64 em JPG e salvar no Storage
- [ ] Preencher `comprovante_entrega_url` e `recebedor`

**Pronto quando:** toda entrega Rodonaves tem comprovante em até 1 h.

### 066 — Comprovante bloqueado

- [ ] Ler `IsDeliveryReceiptBlocked`
- [ ] Tentar de novo diariamente por 7 dias
- [ ] Pendência visível após o prazo

**Pronto quando:** comprovante ausente tem motivo e prazo.

### 067 — Validação do comprovante

- [ ] Reaproveitar `ocr-receipt-processor` para ler nome, data e assinatura
- [ ] Comparar com o recebedor do evento
- [ ] Gravar em `delivery_receipt_audit`

**Pronto quando:** divergência de recebedor gera alerta.

### 068 — Comprovante para o cliente

- [ ] Link assinado na página pública de rastreio
- [ ] Envio por WhatsApp sob pedido
- [ ] Prazo de expiração do link

**Pronto quando:** o cliente baixa o comprovante sem pedir ao atendimento.

### 069 — Comprovante em alta qualidade `[RTE]`

- [ ] Tentar `withoutImageCompression`; em 403 manter o comprimido
- [ ] Usar só para disputa e auditoria
- [ ] Reconsultar quando liberado

**Pronto quando:** existe caminho para HQ assim que a RTE liberar.

### 070 — Comprovantes em lote `[RTE]`

- [ ] `batchdeliveryreceiptsbyprotocols`; em 403 baixar individualmente em paralelo limitado (5)
- [ ] `receipt-key-list` (ZIP no S3) quando liberado
- [ ] Usar na carga histórica

**Pronto quando:** baixar 100 comprovantes leva minutos, não horas.

### 071 — Comprovante de ocorrência `[RTE]`

- [ ] `occurrencereceipt` por `BillOfLadingId` + código, com `RemoveImageUrlExpire=true`
- [ ] Anexar a imagem à ocorrência
- [ ] Hoje 403: deixar pronto atrás de flag

**Pronto quando:** ocorrência com foto da RTE é anexada sem download manual.

### 072 — Informação do destino `[RTE]`

- [ ] `deliveryInformation` (unidade, recebedor, estado); em 403 derivar dos steps
- [ ] Mostrar unidade de destino no detalhe
- [ ] Reconsultar quando liberado

**Pronto quando:** a unidade que entrega aparece no detalhe.

### 073 — Ocorrência automática

- [ ] Todo evento classificado como exceção abre registro em `ocorrencias` com tipo, responsável e prazo
- [ ] Fechar automaticamente quando o envio voltar ao fluxo normal
- [ ] Sem duplicidade por evento

**Pronto quando:** a fila de ocorrências reflete exatamente as exceções da RTE.

### 074 — Ações sugeridas por ocorrência

- [ ] Endereço não localizado → pedir confirmação ao cliente
- [ ] Destinatário ausente → reagendar; recusa → devolução; extravio → indenização
- [ ] Botão de ação dentro da ocorrência

**Pronto quando:** cada tipo de ocorrência tem o próximo passo em um clique.

## Fase 7 — Coleta Rodonaves (075–086)

### 075 — Datas disponíveis antes de agendar

- [ ] `getavaliablepickupdate` por protocolo; mostrar calendário e janela
- [ ] Usar `hasScheduledPickup` para evitar coleta duplicada
- [ ] Em 403, propor próximo dia útil e avisar

**Pronto quando:** o operador escolhe uma data que a unidade aceita.

### 076 — Coleta por protocolo de cotação

- [ ] `pickupbyquotationprotocol` com data, tipo de serviço e comentário
- [ ] Gravar id da coleta e protocolo em `coletas`
- [ ] Flag desligada até o primeiro teste controlado (sem homologação)

**Pronto quando:** uma coleta real é criada a partir do pedido.

### 077 — Coleta automática pós-faturamento

- [ ] Ao vincular a NF-e (etapa 044), agendar coleta para a próxima data disponível (premissa 5)
- [ ] Agrupar pedidos do mesmo dia em uma coleta
- [ ] Aprovação do operador opcional por configuração

**Pronto quando:** pedidos faturados até X h saem com coleta marcada sem clique.

### 078 — Coleta manual completa

- [ ] `POST /pickup` com remetente, tomador, endereço, contato, volumes
- [ ] Validação local dos obrigatórios ("O tomador é obrigatório" etc.)
- [ ] Usar quando não houver cotação

**Pronto quando:** dá para pedir coleta avulsa pela tela.

### 079 — Consultar coleta

- [ ] `getpickupbyprotocol` e `pickup/{id}` no cron da coleta
- [ ] Mostrar motorista, placa, setor, horário limite e tipo de baixa
- [ ] Atualizar status da coleta

**Pronto quando:** o operador sabe quem vem buscar.

### 080 — Reagendar coleta `[RTE]`

- [ ] `updatepickupdatebyprotocol` (hoje 403)
- [ ] Histórico do reagendamento
- [ ] Avisar expedição

**Pronto quando:** reagendamento sai pela tela assim que liberado.

### 081 — Cancelar coleta `[RTE]`

- [ ] `cancelpickupbyprotocol` (existe, hoje 401)
- [ ] Confirmação dupla e motivo obrigatório
- [ ] Estado cancelado em `coletas`

**Pronto quando:** cancelamento não exige ligação à filial.

### 082 — Ocorrência e finalização de coleta

- [ ] `pickupreschedulingorfinalizingoccurrence` com motivo de baixa
- [ ] Usar quando a coleta não aconteceu
- [ ] Gerar nova coleta automaticamente se configurado

**Pronto quando:** coleta frustrada vira nova coleta sem retrabalho.

### 083 — Reenvio Rodonaves Express `[AVALIAR]`

- [ ] Entender quando `resendrodonavesexpresspickup` se aplica
- [ ] Expor só se houver contrato Express
- [ ] Registrar decisão

**Pronto quando:** existe decisão registrada.

### 084 — Coleta automática Intelipost `[AVALIAR]`

- [ ] Avaliar `generateautomaticpickup` (pedidos, volumes, notas) sem usar Intelipost
- [ ] Teste controlado com a RTE
- [ ] Se aceito, substitui a etapa 077 para lotes

**Pronto quando:** existe decisão registrada.

### 085 — Alerta de coleta não realizada

- [ ] Coleta do dia sem evento "recebida" (204/0) até o fim do expediente → alerta
- [ ] Ligar ao WhatsApp operacional da transportadora
- [ ] Indicador no painel

**Pronto quando:** coleta esquecida é percebida no mesmo dia.

### 086 — Agenda de coletas

- [ ] `CalendarioLogistico` mostra coletas de todas as transportadoras
- [ ] Arrastar para reagendar (onde a API permitir)
- [ ] Capacidade de doca por dia

**Pronto quando:** a expedição planeja a semana em uma tela.

## Fase 8 — Clientes, endereços e malha (087–096)

### 087 — Destinatário cadastrado na RTE

- [ ] Antes de gerar cotação, `getbytaxidregistration` do destinatário
- [ ] Conferir CNPJ exato (a API casa por sufixo)
- [ ] Guardar id do cliente RTE

**Pronto quando:** "Cliente destinatário não encontrado" deixa de acontecer.

### 088 — Cadastro automático de destinatário

- [ ] `savecustomer` com dados do cliente do Loggi Flow quando não existir
- [ ] Flag desligada até teste
- [ ] Log do cadastro

**Pronto quando:** cliente novo é cadastrado na RTE sem intervenção.

### 089 — Dados da própria conta

- [ ] Mostrar rank (Diamond), filial vinculada (207 Vila Guilherme), status comercial e os dois cadastros (companyId 1 e 22)
- [ ] Atualizar semanalmente
- [ ] Avisar se rank ou filial mudar

**Pronto quando:** a tela de integração mostra a situação da conta.

### 090 — Endereços e pessoa `[RTE]`

- [ ] CRUD de endereço (COBRC, ENTRG, FISCO) e `person` atrás de flag
- [ ] Leitura de endereços (403) com reserva no cadastro local
- [ ] Usar só para corrigir endereço de entrega recorrente

**Pronto quando:** endereço de entrega corrigido aqui pode ir para a RTE.

### 091 — Malha completa

- [ ] Consultar `unittocity` por CEP de destino e gravar em `malha_cep`
- [ ] Guardar unidade, setor, halls e IBGE
- [ ] Revalidar a cada 90 dias

**Pronto quando:** cobertura e unidade vêm do banco em milissegundos.

### 092 — Cobertura no cadastro do cliente

- [ ] Ao salvar cliente, marcar "atendido pela Rodonaves" e unidade
- [ ] Usar na escolha de transportadora
- [ ] Lista de clientes fora da malha

**Pronto quando:** o vendedor sabe na venda se a RTE atende.

### 093 — Estados com cobertura

- [ ] Carregar a lista de estados e cidades atendidas (portal ou malha)
- [ ] Bloquear UF fora da malha na cotação RTE
- [ ] Revisar mensalmente

**Pronto quando:** a cotação RTE não é oferecida para UF não atendida.

### 094 — Rota interna e prazo realista

- [ ] Número de halls e hubs (ex.: D48) como fator de prazo
- [ ] Média real de dias por rota a partir do histórico
- [ ] Comparar com o prazo cotado

**Pronto quando:** a previsão usa o desempenho real da rota.

### 095 — Autoatendimento `[RTE]`

- [ ] Cotação com IBGE, prazo por cidade, rastreio para bot, calendário da unidade
- [ ] Hoje 403: manter atrás de flag e consultar mensalmente
- [ ] Usar o rastreio de bot no atendimento por WhatsApp quando liberado

**Pronto quando:** cada ação é ligada assim que a RTE liberar.

### 096 — Unidade mais próxima para retirada

- [ ] Mostrar unidade de destino e endereço para "cliente retira" (StepCode 29)
- [ ] Mensagem ao cliente com endereço da filial
- [ ] Usar em logística reversa

**Pronto quando:** o cliente sabe onde retirar.

## Fase 9 — Financeiro e auditoria (097–108)

### 097 — Pedidos com frete cobrado `[RTE]`

- [ ] `orders/ordersbydaterangepagination` com `CustomerType` (0–7)
- [ ] Gravar valor do CT-e, vencimento, fatura e chave
- [ ] Hoje 403: pedido de liberação (etapa 109)

**Pronto quando:** o frete cobrado chega pela API oficial.

### 098 — Reserva pelo portal `[AVALIAR]` `[SEGREDO]`

- [ ] Avaliar o uso de cookie do portal (Minhas Encomendas, Faturas) como ponte até a etapa 097 (premissa 9)
- [ ] Riscos: WAF, sessão de 8 h, termos de uso
- [ ] Decisão em ADR; se aprovado, só leitura e com prazo para desligar

**Pronto quando:** existe decisão registrada.

### 099 — Faturas e boletos

- [ ] Importar faturas (API quando liberada; portal se aprovado; senão upload de PDF/CSV)
- [ ] Ligar boleto ao CT-e e à entrega
- [ ] Alerta de vencimento

**Pronto quando:** nenhuma fatura vence sem aviso.

### 100 — Anomalias de frete

- [ ] Frete acima de X% do valor da NF (ex.: NF R$ 5 com frete R$ 96,89)
- [ ] Limite configurável por tipo de pedido (amostra, brinde)
- [ ] Relatório mensal

**Pronto quando:** frete desproporcional aparece antes de pagar.

### 101 — Cotado × cobrado

- [ ] Comparar valor e peso cotados com os cobrados por CT-e
- [ ] Diferença acima da tolerância vira contestação
- [ ] Painel por mês

**Pronto quando:** cada divergência tem valor e evidência.

### 102 — Conferência de peso

- [ ] Peso declarado × peso cubado × peso faturado
- [ ] Apontar embalagens que geram cubagem
- [ ] Sugerir caixa melhor (etapa 040)

**Pronto quando:** dá para ver quanto a cubagem custa por mês.

### 103 — Contestação de frete

- [ ] Gerar e-mail/ticket para a RTE com CT-e, cotação e evidências
- [ ] Prazo e status da contestação
- [ ] Valor recuperado no painel

**Pronto quando:** contestação sai do sistema em um clique.

### 104 — Integração com o financeiro

- [ ] Exportar faturas aprovadas para o Promo Finance
- [ ] Centro de custo por pedido
- [ ] Rateio de frete por item

**Pronto quando:** o financeiro não redigita fatura de frete.

### 105 — Custo de frete por pedido e cliente

- [ ] Frete real lançado no pedido
- [ ] Margem após frete
- [ ] Ranking de clientes por custo logístico

**Pronto quando:** a venda vê o frete real do pedido.

### 106 — Painel financeiro de frete

- [ ] Gasto por transportadora, UF, cliente, mês
- [ ] Custo por kg, por km e por pedido
- [ ] Integração com `CustosDashboard` e `AlertasCusto`

**Pronto quando:** o dono vê o gasto de frete do mês por transportadora.

### 107 — Relatório para renegociação

- [ ] Volume, concentração (ex.: cooperativas), UFs, prazo cumprido e frete médio
- [ ] Comparar com outras transportadoras na mesma rota
- [ ] Exportar PDF

**Pronto quando:** existe um dossiê pronto para negociar tabela.

### 108 — PREFAT e DOCCOB `[RTE]` `[AVALIAR]`

- [ ] Avaliar EDI de pré-fatura e cobrança como alternativa ao `orders`
- [ ] Ver etapas 180–184
- [ ] Decidir junto com a etapa 109

**Pronto quando:** existe decisão registrada.

## Fase 10 — Escopo e relacionamento com a Rodonaves (109–116)

### 109 — Pedido formal de liberação de escopo `[RTE]`

- [ ] Enviar pedido com: `orders`, `peso-cubado`, `deliveryInformation`, `batchpaginationbyparms`, comprovante HQ/lote/por chave, `occurrencereceipt`, reagendar/cancelar coleta, `getavaliablepickupdate`, `webapi/city/*`, `webapi/unit/v1`
- [ ] Justificativa de uso por endpoint
- [ ] Acompanhar resposta

**Pronto quando:** existe protocolo de solicitação com a RTE.

### 110 — Matriz de escopo viva

- [ ] Teste diário leve (1 chamada) em cada endpoint bloqueado
- [ ] Atualizar `capabilities.ts` e a tela 035
- [ ] Alertar quando um 403 virar 200

**Pronto quando:** liberação da RTE é percebida no mesmo dia.

### 111 — Contato técnico e comercial

- [ ] Registrar gerente de conta, suporte técnico e canal da comunidade dev
- [ ] SLA de resposta esperado
- [ ] Em `docs/agentes/integracoes.md`

**Pronto quando:** qualquer agente sabe a quem escalar.

### 112 — Descoberta semanal de endpoints

- [ ] Cron semanal em `/api/objects` do autoatendimento
- [ ] Comparar com o retrato anterior e listar novos/removidos
- [ ] Notificar admin

**Pronto quando:** endpoint novo da RTE vira alerta antes da documentação oficial.

### 113 — Monitor do DNE

- [ ] Health diário do DNE
- [ ] Quando voltar, usar para CEP → CityId oficial
- [ ] Manter ViaCEP como reserva

**Pronto quando:** a volta do DNE é detectada sozinha.

### 114 — Relato de bugs à RTE

- [ ] `gera-primeira-cotacao` 500 (`SetSenderCustomerAsync` linha 106), `transp-digital` 500, `OriginCityId` 99999, pickup 500 (`Rodonaves.Pickup.xml` ausente, visto hoje)
- [ ] Enviar com trace e exemplo
- [ ] Acompanhar correção

**Pronto quando:** cada bug tem chamado aberto.

### 115 — DataStudio `[RTE]` `[AVALIAR]`

- [ ] Avaliar se o lead com UTM serve para a Promo Brindes
- [ ] Provável descarte
- [ ] Registrar decisão

**Pronto quando:** existe decisão registrada.

### 116 — PIX de frete `[RTE]` `[AVALIAR]`

- [ ] Avaliar pagar frete FOB/avulso por PIX (cobrança, QR, status)
- [ ] Custo do contrato
- [ ] Decidir

**Pronto quando:** existe decisão registrada.

## Fase 11 — Lalamove (117–130)

### 117 — Recriar o registro de pedidos `[DDL]`

- [ ] Pedidos Lalamove passam a ser `envios_transportadora` (R17)
- [ ] Guardar `quotationId`, `orderId`, preço detalhado, serviço, paradas
- [ ] Migrar o que estiver só em `rastreamento_historico`

**Pronto quando:** todo pedido Lalamove fica guardado com preço.

### 118 — Adaptador Lalamove

- [ ] `lalamove-api` e `lalamove-tracking` dentro do contrato 025
- [ ] Status Lalamove mapeados para as fases canônicas
- [ ] Testes da suíte 036

**Pronto quando:** Lalamove aparece igual às outras na central.

### 119 — Cotação com coordenada confirmada

- [ ] Cotar só com endereço validado (plano Maps, etapa 091)
- [ ] Mostrar os pontos enviados antes de confirmar
- [ ] Validade da cotação tratada

**Pronto quando:** nenhuma cotação Lalamove sai com coordenada aproximada.

### 120 — Escolha de veículo

- [ ] Sugerir moto, carro, van ou caminhão pelo peso e volume
- [ ] Cotar mais de um tipo em paralelo
- [ ] Mostrar diferença de preço

**Pronto quando:** o operador vê a opção mais barata que cabe a carga.

### 121 — Pedido a partir da cotação

- [ ] Criar pedido com contato do remetente e destinatário
- [ ] Idempotência (etapa 029)
- [ ] Gravar `orderId` na coleta/entrega

**Pronto quando:** um pedido Lalamove sai sem copiar dados.

### 122 — Pedido agendado

- [ ] Usar agendamento da Lalamove para coleta em horário futuro
- [ ] Respeitar janela do cliente
- [ ] Lembrete antes do horário

**Pronto quando:** dá para marcar Lalamove para amanhã.

### 123 — Várias paradas

- [ ] Pedido com múltiplas entregas na mesma rota
- [ ] Ordem das paradas otimizada (plano Maps)
- [ ] Rateio do preço por entrega

**Pronto quando:** um roteiro de 3 entregas sai em um pedido.

### 124 — Webhook com todos os status

- [ ] Tratar atribuição de motorista, coleta, entrega, cancelamento, mudança de preço
- [ ] Assinatura validada e idempotência (já existe)
- [ ] Gravar em `eventos_rastreio`

**Pronto quando:** cada status do webhook muda a entrega.

### 125 — Motorista e posição

- [ ] Nome, placa e telefone do motorista na coleta
- [ ] Posição em tempo real no mapa e na página pública
- [ ] Parar de consultar após entrega

**Pronto quando:** o cliente vê o motorista chegando.

### 126 — Comprovante Lalamove

- [ ] Foto/assinatura de entrega no Storage
- [ ] Preencher recebedor e comprovante
- [ ] Mesmo fluxo da etapa 065

**Pronto quando:** entrega Lalamove tem comprovante guardado.

### 127 — Cancelamento e reatribuição

- [ ] Cancelar pela tela com motivo
- [ ] Detectar motorista que demora a aceitar e recotar
- [ ] Custo de cancelamento registrado

**Pronto quando:** pedido travado é tratado sem ligar para a Lalamove.

### 128 — Gorjeta e acréscimos

- [ ] Registrar acréscimos de prioridade e espera
- [ ] Somar ao custo real
- [ ] Relatório por mês

**Pronto quando:** o custo Lalamove do mês bate com a fatura.

### 129 — Conciliação Lalamove

- [ ] Importar extrato/fatura
- [ ] Comparar cotado × cobrado por pedido
- [ ] Contestação

**Pronto quando:** cada pedido tem valor final conferido.

### 130 — Regra de uso Lalamove

- [ ] Quando usar: urgente, mesma cidade, até X kg (configurável)
- [ ] Entrar no motor da fase 14
- [ ] Registrar decisões

**Pronto quando:** o sistema sugere Lalamove só onde faz sentido.

## Fase 12 — Melhor Envio (131–142)

### 131 — Produção ou sandbox `[SEGREDO]`

- [ ] Confirmar qual ambiente está ativo (R21) e fixar por variável explícita
- [ ] Tela mostra o ambiente
- [ ] Teste de conexão por ambiente

**Pronto quando:** não há dúvida de onde as etiquetas são compradas.

### 132 — Adaptador Melhor Envio

- [ ] `melhor-envio-api` dentro do contrato 025
- [ ] Cada serviço (Correios PAC/SEDEX, Jadlog, Loggi, Azul) vira opção de cotação
- [ ] Suíte 036

**Pronto quando:** as transportadoras do Melhor Envio aparecem no multicanal.

### 133 — Cotação com dimensões reais

- [ ] Mesmas caixas da etapa 040
- [ ] Seguro pelo valor da NF
- [ ] Filtrar serviços fora do prazo do pedido

**Pronto quando:** a cotação ME usa as mesmas medidas da RTE.

### 134 — Carrinho, compra e etiqueta automáticos

- [ ] Após escolher, inserir no carrinho, comprar e gerar etiqueta
- [ ] Idempotência e flag
- [ ] Guardar id da etiqueta e rastreio

**Pronto quando:** pedido escolhido no ME sai com etiqueta sem passos manuais.

### 135 — Etiqueta impressa na expedição

- [ ] PDF de etiquetas em lote
- [ ] Integração com impressora térmica (ZPL) `[AVALIAR]`
- [ ] Etiqueta vinculada ao volume

**Pronto quando:** a expedição imprime todas as etiquetas do dia de uma vez.

### 136 — Rastreio Melhor Envio

- [ ] Webhook do Melhor Envio, se disponível; senão cron com `rastrearEnvios`
- [ ] Eventos em `eventos_rastreio`
- [ ] Fases canônicas

**Pronto quando:** envios ME atualizam sozinhos.

### 137 — Saldo

- [ ] Consultar saldo antes de comprar
- [ ] Alerta abaixo de um mínimo
- [ ] Bloquear compra sem saldo com mensagem clara

**Pronto quando:** compra nunca falha por saldo sem aviso prévio.

### 138 — Cancelamento de etiqueta

- [ ] Verificar se pode cancelar e cancelar pela tela
- [ ] Estorno registrado
- [ ] Prazo de cancelamento visível

**Pronto quando:** etiqueta errada é cancelada sem entrar no site.

### 139 — Logística reversa ME

- [ ] Gerar etiqueta reversa a partir de `logistica_reversa`
- [ ] Enviar link ao cliente
- [ ] Rastrear a volta

**Pronto quando:** devolução sai com etiqueta em um clique.

### 140 — Agências para postagem

- [ ] Listar agências próximas à origem
- [ ] Escolher agência padrão por serviço
- [ ] Mostrar na etiqueta

**Pronto quando:** a expedição sabe onde postar.

### 141 — NF-e na etiqueta

- [ ] Enviar chave NF-e na compra (exigência dos Correios para PJ)
- [ ] Bloquear compra sem chave
- [ ] Teste

**Pronto quando:** nenhuma postagem PJ sai sem NF-e.

### 142 — Conciliação ME

- [ ] Extrato de compras e estornos
- [ ] Ligar ao pedido
- [ ] Diferenças de peso cobradas

**Pronto quando:** o gasto ME do mês bate com o extrato.

## Fase 13 — Total Express (143–152)

### 143 — Credenciais e contrato `[SEGREDO]`

- [ ] Confirmar contrato e credenciais de produção (R19)
- [ ] Guardar como segredo do Supabase
- [ ] Cadastro real da transportadora (etapa 020)

**Pronto quando:** a conexão de teste responde.

### 144 — Adaptador Total Express

- [ ] Nova edge com as operações do MCP: calcular frete, cotação completa, previsão, coleta, rastreio, rastreio por CPF, validar CEP
- [ ] Contrato 025 e suíte 036
- [ ] Logs padrão

**Pronto quando:** Total Express aparece no multicanal.

### 145 — Validar CEP e previsão

- [ ] Cobertura por CEP antes de cotar
- [ ] Prazo pela previsão de entrega
- [ ] Cache por CEP

**Pronto quando:** CEP não atendido não é cotado.

### 146 — Cotação e simulação de custo

- [ ] Cotação completa com peso, dimensões e valor
- [ ] Simulação de custo para comparação
- [ ] Gravar em `cotacoes_frete`

**Pronto quando:** Total Express entra na comparação de preço.

### 147 — Registrar coleta

- [ ] Coleta pela API com volumes e NF-e
- [ ] Idempotência e flag
- [ ] Guardar código do pedido

**Pronto quando:** coleta Total Express sai pela tela.

### 148 — Rastreio Total Express

- [ ] Cron de rastreio
- [ ] Tabela de status da Total Express mapeada para fases canônicas
- [ ] Eventos em `eventos_rastreio`

**Pronto quando:** envios Total Express atualizam sozinhos.

### 149 — Link de rastreio ao cliente

- [ ] Usar o link oficial na mensagem e na página pública
- [ ] Rastreio por CPF para atendimento
- [ ] Teste

**Pronto quando:** o cliente recebe o link correto.

### 150 — Ocorrências Total Express

- [ ] Códigos de exceção para o dicionário 016
- [ ] Abertura automática de ocorrência
- [ ] Ações sugeridas

**Pronto quando:** exceção TEX aparece como as da RTE.

### 151 — Comprovante Total Express `[AVALIAR]`

- [ ] Verificar se a API oferece comprovante
- [ ] Se sim, mesmo fluxo da 065
- [ ] Registrar decisão

**Pronto quando:** existe decisão registrada.

### 152 — Conciliação Total Express

- [ ] Importar fatura
- [ ] Cotado × cobrado
- [ ] Contestação

**Pronto quando:** o gasto TEX do mês está conferido.

## Fase 14 — Motor de decisão multicanal (153–164)

### 153 — Cotação real em paralelo

- [ ] `smart-carrier-selection` chama as cotações reais das transportadoras ativas (R18)
- [ ] Tempo máximo por transportadora; quem não responder fica de fora com motivo
- [ ] `tabelas_frete` só como reserva

**Pronto quando:** a recomendação usa preço real do dia.

### 154 — Simulação na venda, protocolo no fechamento

- [ ] Na venda: simulações, sem protocolo
- [ ] No fechamento: cotação definitiva só da escolhida
- [ ] Nada de protocolo desperdiçado

**Pronto quando:** a RTE só recebe cotação com protocolo de pedido fechado.

### 155 — Pontuação custo × prazo × desempenho

- [ ] Peso configurável por regra (`freight_selection_rules`)
- [ ] Desempenho = % no prazo e taxa de exceção reais da fase 5
- [ ] Explicação da nota

**Pronto quando:** a escolha explica por que a transportadora venceu.

### 156 — Restrições duras

- [ ] Peso máximo, valor de NF máximo, dimensões, PF/PJ, cobertura, prazo do cliente
- [ ] Transportadora que viola fica de fora com motivo
- [ ] Teste por restrição

**Pronto quando:** nenhuma recomendação viola restrição cadastrada.

### 157 — Regra por cliente e por produto

- [ ] Cliente com transportadora preferida ou proibida
- [ ] Produto frágil ou volumoso com regra própria
- [ ] Tela de regras

**Pronto quando:** preferências dos clientes grandes são respeitadas sozinhas.

### 158 — Registro da decisão

- [ ] Gravar opções, notas e escolha em `freight_decisions`
- [ ] Quem trocou a escolha e por quê
- [ ] Relatório de economia

**Pronto quando:** dá para medir quanto a escolha automática economizou.

### 159 — Tela de cotação multicanal

- [ ] `CotacaoMultiCanal` com todas as transportadoras, preço, prazo, custo/km, nota
- [ ] Escolher e seguir para coleta/etiqueta no mesmo fluxo
- [ ] Estados de erro por transportadora

**Pronto quando:** cotar e despachar acontece em uma tela.

### 160 — Várias origens

- [ ] Cotar de cada origem cadastrada (SP, GO)
- [ ] Sugerir de onde despachar
- [ ] Respeitar estoque da origem (se houver dado)

**Pronto quando:** o sistema indica a melhor origem por pedido.

### 161 — Frota própria no motor

- [ ] Custo por km da frota (plano Maps) como opção
- [ ] Capacidade do dia
- [ ] Comparar com Lalamove na mesma cidade

**Pronto quando:** a frota própria compete na recomendação.

### 162 — Aprendizado com o histórico

- [ ] Prazo real médio por transportadora × rota
- [ ] Ajustar a previsão da cotação pelo histórico
- [ ] Mostrar "prazo prometido × prazo real"

**Pronto quando:** a nota de prazo usa dados reais.

### 163 — Ranking de transportadoras

- [ ] `carrier_rankings` alimentado pelos envios reais
- [ ] Por mês, rota e UF
- [ ] Usado na nota

**Pronto quando:** o ranking reflete o mês corrente.

### 164 — Simulador de cenários

- [ ] "E se a RTE subir 10%?" sobre o histórico
- [ ] Impacto em custo e prazo
- [ ] Exportar

**Pronto quando:** existe apoio numérico para negociação.

## Fase 15 — Automações e comunicação (165–176)

### 165 — WhatsApp por marco

- [ ] Coletado, chegou na cidade, saiu para entrega, entregue (premissa 6)
- [ ] Templates por transportadora com link de rastreio
- [ ] Via `evolution-whatsapp`, registrando em `notificacoes_envio`

**Pronto quando:** o cliente recebe os 4 avisos sem ação humana.

### 166 — Aviso de atraso e reagendamento

- [ ] Atraso previsto ou novo prazo → mensagem com nova data
- [ ] Limite de mensagens por envio
- [ ] Preferência de canal do cliente

**Pronto quando:** atraso chega ao cliente antes da reclamação.

### 167 — Confirmação de endereço e presença

- [ ] Ocorrência de endereço/ausência → mensagem pedindo confirmação
- [ ] Resposta do cliente vira ação (reentrega, novo endereço)
- [ ] Registro

**Pronto quando:** reentrega é agendada pelo próprio cliente.

### 168 — Atendimento por bot

- [ ] Cliente pergunta "cadê meu pedido" e recebe status por CNPJ/NF
- [ ] Usar o rastreio normalizado
- [ ] Encaminhar a humano em exceção

**Pronto quando:** consultas simples de rastreio são respondidas sem atendente.

### 169 — Status no Bitrix24

- [ ] Mudança de fase move o card do SPA EXPEDIÇÃO (premissa 7)
- [ ] Campos: transportadora, protocolo, previsão, último evento
- [ ] Via `bitrix24-integration`

**Pronto quando:** o vendedor vê o status no Bitrix sem abrir o Loggi Flow.

### 170 — Comprovante no Bitrix24

- [ ] Anexar o JPG do comprovante ao card
- [ ] Mover para "Entregue"
- [ ] Avisar o vendedor

**Pronto quando:** comprovante aparece no card em até 1 h da entrega.

### 171 — Pedido do Bitrix vira entrega

- [ ] Deal ganho com NF cria entrega e dispara cotação
- [ ] Evitar duplicidade
- [ ] Log de sincronização

**Pronto quando:** pedido fechado no Bitrix entra no Loggi Flow sozinho.

### 172 — Resumo diário

- [ ] Às 8 h: envios de hoje, atrasados, parados, exceções, coletas do dia
- [ ] Por WhatsApp/e-mail para a expedição
- [ ] Usa `scheduled-reports`

**Pronto quando:** a equipe começa o dia com a lista pronta.

### 173 — Devolução automática

- [ ] Recusa ou devolução (25, 100–103) cria registro em `logistica_reversa`
- [ ] Avisar comercial e financeiro
- [ ] Acompanhar a volta

**Pronto quando:** devolução não depende de alguém notar.

### 174 — Indenização

- [ ] Extravio/avaria abre processo com prazo, valor da NF e documentos (premissa 8)
- [ ] Checklist e status
- [ ] Valor recuperado no painel

**Pronto quando:** nenhum extravio fica sem pedido de indenização.

### 175 — Regras de automação configuráveis

- [ ] `AutomacaoRegras` com gatilhos de rastreio (fase, código, atraso)
- [ ] Ações: avisar, criar tarefa, mudar status, chamar webhook
- [ ] Execução registrada em `rule_execution_logs`

**Pronto quando:** o admin cria uma automação nova sem código.

### 176 — Webhook para clientes

- [ ] `client_webhooks` dispara a cada mudança de fase
- [ ] Assinatura HMAC
- [ ] Reenvio com histórico

**Pronto quando:** um cliente grande recebe o status no sistema dele.

## Fase 16 — Etiquetas, EDI e documentos (177–186)

### 177 — Etiqueta Rodonaves CODE-128C

- [ ] Gerar etiqueta no padrão (tipo doc, cód. remetente, nº doc 11, volume 4, setor 5, filial 4, CIF/FOB)
- [ ] Código do remetente fornecido pela RTE
- [ ] Altura mínima 2 cm

**Pronto quando:** a etiqueta é lida pelo coletor da RTE.

### 178 — Setor e filial pelo CEP

- [ ] Preencher setor e filial a partir de `malha_cep`
- [ ] Zeros à esquerda conforme padrão
- [ ] Teste com etiquetas homologadas

**Pronto quando:** etiqueta sai completa sem digitação.

### 179 — Homologação da etiqueta `[RTE]`

- [ ] Enviar amostras para homologação
- [ ] Registrar aprovação
- [ ] Só então usar em produção

**Pronto quando:** a RTE aprova o modelo.

### 180 — EDI NOTFIS `[RTE]` `[AVALIAR]`

- [ ] Gerar NOTFIS Proceda 3.0 com as NF-es do dia
- [ ] Envio por SFTP ou e-mail conforme a RTE
- [ ] Reduz digitação no CT-e

**Pronto quando:** existe decisão e, se sim, envio diário automático.

### 181 — EDI OCOREN `[RTE]` `[AVALIAR]`

- [ ] Receber ocorrências por arquivo como alternativa ao polling
- [ ] Parser para `eventos_rastreio`
- [ ] Comparar latência com a API

**Pronto quando:** existe decisão registrada.

### 182 — Leitura do XML da NF-e

- [ ] Upload ou captura do XML preenche chave, valor, peso, volumes e destinatário
- [ ] Validar com a entrega
- [ ] Alimenta cotação, etiqueta e EDI

**Pronto quando:** nenhuma entrega com XML exige digitação de dados fiscais.

### 183 — EDI CONEMB `[RTE]` `[AVALIAR]`

- [ ] Receber CT-es emitidos com valor e composição do frete
- [ ] Alternativa ao `orders` 403
- [ ] Alimenta conciliação

**Pronto quando:** existe decisão registrada.

### 184 — EDI DOCCOB/PREFAT `[RTE]` `[AVALIAR]`

- [ ] Cobrança e pré-fatura por arquivo
- [ ] Alimenta `faturas_transportadora`
- [ ] Decidir junto com 108

**Pronto quando:** existe decisão registrada.

### 185 — XML do CT-e

- [ ] Guardar XML/chave do CT-e quando disponível
- [ ] Conferir valor, peso e tomador
- [ ] Base para contestação

**Pronto quando:** CT-e fica arquivado junto da entrega.

### 186 — Pacote de documentos do envio

- [ ] NF-e, CT-e, etiqueta, comprovante e ocorrências em um lugar
- [ ] Download em ZIP
- [ ] Retenção conforme exigência fiscal

**Pronto quando:** auditoria pede um envio e tudo sai em um arquivo.

## Fase 17 — Qualidade, segurança e entrada em produção (187–200)

### 187 — Trocar credenciais expostas `[SEGREDO]`

- [ ] Os documentos enviados trazem senha da API, senha do portal, token de deploy Cloudflare e credencial Evolution em texto aberto (R22)
- [ ] Trocar todas e revogar o token Cloudflare
- [ ] Varrer repositórios com gitleaks

**Pronto quando:** as credenciais dos documentos não funcionam mais.

### 188 — Documentação sem segredos

- [ ] Guardar os documentos da RTE em `docs/integracoes/rodonaves/` sem credenciais
- [ ] Specs OpenAPI versionados
- [ ] Índice com data de cada fonte

**Pronto quando:** qualquer agente acha a referência da RTE no repositório.

### 189 — Pipeline verde antes de tudo

- [ ] Conferir o estado atual do CI (vermelho em ago/2026 segundo `ESTADO_ATUAL.md`)
- [ ] Nenhuma etapa deste plano é mergeada com CI vermelho causado por ela
- [ ] Registrar o estado no início

**Pronto quando:** o estado do CI está medido no início da execução.

### 190 — Testes unitários dos adaptadores

- [ ] Normalizadores, dicionário, detector de exceções, cálculo de dias úteis
- [ ] Respostas gravadas
- [ ] Pisos de cobertura do CI

**Pronto quando:** os checks obrigatórios passam.

### 191 — Testes de contrato

- [ ] Specs da RTE (etapa 012) e contratos das demais em `tests/contracts/`
- [ ] Registrar em `system_contract_schemas`
- [ ] Falhar em mudança de formato

**Pronto quando:** mudança de formato de transportadora é pega no CI.

### 192 — Teste controlado em produção

- [ ] Roteiro: simular, gerar cotação, coleta, rastrear, comprovante, cancelar — com pedido real combinado
- [ ] Usuário de teste padrão
- [ ] Evidência anexada à PR

**Pronto quando:** o ciclo completo roda uma vez com evidência real.

### 193 — Testes ponta a ponta

- [ ] Playwright: cotação multicanal, despacho, central de rastreio, ocorrência, comprovante
- [ ] Por `workflow_dispatch`
- [ ] Sem escrita real (mocks no servidor)

**Pronto quando:** os 5 fluxos passam.

### 194 — Observabilidade por transportadora

- [ ] Latência, erro e escopo por operação (estende o SLO RTE existente)
- [ ] Alertas de falha de sincronização
- [ ] Erros no Sentry com transportadora e operação

**Pronto quando:** falha de sincronização gera alerta em minutos.

### 195 — Painel de cobertura de dados

- [ ] % de entregas com protocolo, com chave NF-e, com comprovante, com frete cobrado
- [ ] Por transportadora
- [ ] Meta por indicador

**Pronto quando:** o dono vê o quanto do ciclo está automatizado.

### 196 — RLS e LGPD

- [ ] Tabelas novas nos testes de RLS
- [ ] Dados do destinatário e comprovantes com retenção definida
- [ ] Incluir em `lgpd-erase-user`

**Pronto quando:** `npm run test:rls` e `test:security` passam.

### 197 — Desempenho

- [ ] Índices para central de rastreio e conciliação
- [ ] Consultas da central abaixo de 300 ms
- [ ] `EXPLAIN` registrado

**Pronto quando:** a central abre rápido com o histórico completo.

### 198 — Guia de incidente

- [ ] Transportadora fora do ar, 403 novo, token inválido, cotação divergente, sincronização parada
- [ ] Passos de desligar flag e operar manualmente
- [ ] Em `docs/INCIDENT_PLAYBOOK.md`

**Pronto quando:** cada cenário tem passo a passo testado.

### 199 — Entrada em produção por etapas

- [ ] Ordem: leitura (rastreio, comprovante) → simulação → cotação com protocolo → coleta automática → cadastro automático
- [ ] Cada passo por flag, admin primeiro
- [ ] Critério de volta atrás por métrica

**Pronto quando:** todas as automações estão ligadas com reserva testada.

### 200 — Revisão de 30 dias

- [ ] Comparar: horas manuais, atrasos percebidos, frete contestado e recuperado, % automatizado
- [ ] Atualizar `ESTADO_ATUAL.md` e a matriz de escopo
- [ ] Reavaliar os itens `[AVALIAR]` e `[RTE]`

**Pronto quando:** existe relatório de 30 dias com ganhos e próximas decisões.

---

## Ordem recomendada de execução

1. **Fase 1 imediatamente** (001–012): sem isso, cotação, rastreio e cobertura Rodonaves continuam quebrados.
2. **Fase 10, etapa 109** no mesmo dia: o pedido de escopo à RTE leva semanas; quanto antes, melhor.
3. **Fases 2 e 3**: dados e contrato único sustentam todo o resto.
4. **Fases 5 e 6**: rastreio e comprovante automáticos são o maior ganho de tempo, só com escopo já liberado.
5. **Fase 4 e 14**: cotação real e escolha automática.
6. **Fases 7, 11, 12, 13**: coleta e as demais transportadoras, por volume de uso.
7. **Fases 9, 15, 16**: dinheiro, comunicação e documentos.
8. **Fase 17** acompanha tudo; 187 e 189 antes de qualquer outra.

## Itens que dependem só do dono

- Responder as 10 premissas.
- Etapa 187: trocar as credenciais expostas nos documentos.
- Aprovar o envio do pedido de escopo (109) e as decisões `[AVALIAR]` (portal por cookie, EDI, PIX, Express).
- Autorizar as PRs `[DDL]` e `[SEGREDO]`, uma por vez.
- Combinar com a RTE o primeiro teste de coleta real (etapa 192), já que não há homologação.
