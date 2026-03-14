# ANÁLISE TÉCNICA DEFINITIVA — API RODONAVES TRANSPORTES
## Introspecção Profunda via Swagger + ReadMe.io API Registry

**Método:** Extração direta de specs OpenAPI de 3 gateways em produção + 5 specs do ReadMe.io API Registry
**Specs extraídos:** 5 APIs completas (~200KB de specs JSON puros)

---
## NÚMEROS FINAIS CONSOLIDADOS

| Métrica | Documentação Pública | Realidade Extraída | Delta |
|---------|---------------------|-------------------|-------|
| APIs descobertas | 7 gateways | **5 APIs + SelfAttendance oculta** | +1 API inteira |
| Endpoints | 23 | **~70+ endpoints únicos** | +47 ocultos |
| Schemas/Models | ~5 mencionados | **56+ schemas completos** | +51 |
| Campos mapeados | ~40 | **900+ campos** | +860 |
| Enums | 0 documentados | **5 enums** (CustomersType, TypePerson, PickupServiceType, RegisterSource, Severity) | +5 |
| Cancelamento de coleta | "Não disponível" | **EXISTE: POST /api/v1/pickup/cancelpickupbyprotocol** | CORRIGIDO |
| Códigos IBGE | Não mencionado | **Suportado via SelfAttendance (OriginCodeIBGE)** | NOVO |
| API para BOTs | Não existe | **tracking-steps-bot, tracking-last-steps-bot** | NOVO |

---
## DESCOBERTAS CRÍTICAS DE ALTO IMPACTO

### 1. CANCELAMENTO DE COLETA EXISTE (contradiz documentação)
```
POST /api/v1/pickup/cancelpickupbyprotocol?protocol={id}
```
A documentação oficial e o fórum da comunidade dizem: "Não existe endpoint para cancelamento de coleta via API."
**FALSO.** O endpoint existe no gateway de Pickup (Rodonaves.Pickup.AutomaticPickup v1.17.12.0).

### 2. REAGENDAMENTO DE COLETA EXISTE
```
PUT /api/v1/pickup/updatepickupdatebyprotocol?protocol={id}&pickupDate={datetime}
```
Permite alterar a data de coleta programada via API.

### 3. CONSULTA DE DATAS DISPONÍVEIS PARA COLETA
```
GET /api/v1/pickup/getavaliablepickupdate?protocol={id}
GET /api/v1/pickup/getavaliablepickupdatebyparms?OriginUnit=X&PersonId=Y&Cep=Z&...
```
Retorna `PickupAvailableResponse`: calendário da unidade, flag de disponibilidade, flag de coleta já agendada.

### 4. API SelfAttendance — API INTEIRA NÃO DOCUMENTADA (20 endpoints)
Rodonaves.SelfAttendance v1.99.4.0 — API completa para autoatendimento com:
- Cotação com **código IBGE** (não precisa do CityId RTE!)
- Endpoints de **BOT** para rastreio (tracking-steps-bot, tracking-last-steps-bot)
- Busca de cidades por **nome + UF** (não apenas por CEP)
- Busca de **endereço completo** por CEP (rua, bairro, cidade, UF)
- Calendário de **unidade por protocolo** (datas e horários disponíveis)
- Consulta de **dados da unidade** Rodonaves (telefone, etc)
- API de **registro de objetos** (admin/sistema)
- Coleta simplificada via TMS
- 3 variações de cotação (standard, nova, simulação)

### 5. TRANSPORTADORA DIGITAL — API SEPARADA
```
POST /api/v1/gera-cotacao-transp-digital
PUT  /api/v1/atualiza-nfe-cotacao
```
CreateDigitalCarrierQuotationRequest com 20 campos, incluindo `Protocol` (reusar cotação), `InvoiceKey`, e `SkipRegistration`.

### 6. FATOR DE CUBAGEM POR CLIENTE
```
GET /api/v1/peso-cubado?taxIdRegistration={cnpj}&companyId={id}
```
Retorna o fator de cubagem específico do cliente — essencial para cálculo de peso cubado correto.

### 7. DataStudio/CRM COMPLETO (83 campos)
`UnitDataStudioRequest` com campos de UTM tracking, LGPD, agendamento, múltiplos destinos, protocolo de cotação/coleta.

---

## INVENTÁRIO COMPLETO DE ENDPOINTS POR GATEWAY

### TRACKING GATEWAY (v1.27.3.0) — 20 endpoints

| # | Método | Endpoint | Documentado? | Função |
|---|--------|----------|:---:|--------|
| 1 | `POST` | `/token` | ✅ | Autenticação |
| 2 | `GET` | `/api/v1/tracking` | ✅ | Rastreio unitário (6 params: TaxId, Invoice, InvoiceKey, Protocol, CTeNumber, IsCustomerPortal) |
| 3 | `GET` | `/api/v1/tracking/batch` | ✅ | Rastreio em lote (7 params incl. OperationType, Page, AmountByPage) |
| 4 | `GET` | `/api/v1/tracking/batchPagination` | ✅ | Rastreio lote paginado (retorna amountPages, totalRegisters) |
| 5 | `GET` | `/api/v1/tracking/batchpaginationbyparms` | 🔴 | Rastreio por parâmetros múltiplos sem exigir datas |
| 6 | `GET` | `/api/v1/tracking/trackingSteps` | ✅ | Steps do rastreio (6 params, retorna stepCode, typeUnity) |
| 7 | `GET` | `/api/v1/tracking/batchByOccurrenceDate` | ✅ | Rastreio por data de ocorrência |
| 8 | `GET` | `/api/v1/deliveryreceipt` | ✅ | Comprovante de entrega (5 params incl. InvoiceKey, CTeNumber) |
| 9 | `GET` | `/api/v1/deliveryreceipt/withoutImageCompression` | 🔴 | Comprovante SEM compressão (alta qualidade) |
| 10 | `GET` | `/api/v1/deliveryreceipt/deliveryInformation` | ✅ | Info destino (receiverName, stateDelivery) |
| 11 | `POST` | `/api/v1/deliveryreceipt/receipt-key-list` | ✅ | Comprovantes em lote (retorna URL S3 zipada) |
| 12 | `GET` | `/api/v1/deliveryreceipt/batchdeliveryreceiptsbyprotocols` | 🔴 | Batch por array de protocolos |
| 13 | `GET` | `/api/v1/occurrencereceipt` | 🔴 | Comprovante de ocorrência unitário |
| 14 | `GET` | `/api/v1/occurrencereceipt/list` | 🔴 | Lista comprovantes de ocorrência por CT-e |
| 15 | `GET` | `/api/v1/occurrencereceipt/imageurl` | 🔴 | URL imagem ocorrência (RemoveImageUrlExpire!) |
| 16 | `GET` | `/api/v1/orders/ordersbydaterangepagination` | 🔴 | Pedidos paginados (25+ campos, CustomerType enum 0-7) |
| 17 | `GET` | `/api/healthcheck` | 🔴 | Health check |
| 18 | `GET` | `/configuration` | 🔴 | Ocelot config (GET) |
| 19 | `POST` | `/configuration` | 🔴 | Ocelot config (POST) |
| 20 | `DELETE` | `/outputcache/{region}` | 🔴 | Limpar cache por região |

### QUOTATION GATEWAY (v1.19.10.0) — 12 endpoints

| # | Método | Endpoint | Documentado? | Função |
|---|--------|----------|:---:|--------|
| 1 | `POST` | `/token` | ✅ | Autenticação |
| 2 | `POST` | `/api/v1/gera-cotacao` | ✅ | Gerar cotação (19 campos, 10 required) |
| 3 | `POST` | `/api/v1/simula-cotacao` | 🔴 | Simular cotação (11 campos, não exige ContactName) |
| 4 | `POST` | `/api/v1/gera-primeira-cotacao` | 🔴 | Gerar primeira cotação |
| 5 | `PUT` | `/api/v1/atualiza-contato-cotacao` | 🔴 | Atualizar contato pós-cotação (ProtocolNumber, endereço) |
| 6 | `POST` | `/api/v1/gera-cotacao-transp-digital` | 🔴 | Cotação Transportadora Digital (20 campos, InvoiceKey) |
| 7 | `PUT` | `/api/v1/atualiza-nfe-cotacao` | 🔴 | Atualizar chave NF-e de cotação |
| 8 | `GET` | `/api/v1/peso-cubado` | 🔴 | Fator de cubagem do cliente |
| 9 | `GET` | `/webapi/v1/unitdatastudio` | 🔴 | Buscar lead DataStudio |
| 10 | `PUT` | `/webapi/v1/unitdatastudio` | 🔴 | Atualizar lead DataStudio |
| 11 | `POST` | `/webapi/v1/unitdatastudio` | 🔴 | Inserir lead DataStudio (83 campos!) |
| 12 | `GET` | `/webapi/healthcheck` | 🔴 | Health check |

### CUSTOMER GATEWAY (v1.24.7.0) — 16 endpoints

| # | Método | Endpoint | Documentado? | Função |
|---|--------|----------|:---:|--------|
| 1 | `POST` | `/token` | ✅ | Autenticação |
| 2 | `POST` | `/api/v1/customer/savecustomer` | ✅ | Cadastrar cliente (12 campos, 10 required) |
| 3 | `GET` | `/api/v1/customer/{id}` | 🔴 | Buscar cliente por ID (23+ campos response) |
| 4 | `GET` | `/api/v1/customer` | 🔴 | Listar clientes por data alteração (paginado) |
| 5 | `GET` | `/api/v1/customer/getbytaxidregistration` | 🔴 | Buscar por CNPJ/CPF (paginado) |
| 6 | `GET` | `/api/v1/customer/getbydescription` | 🔴 | Buscar por nome/razão social (simples) |
| 7 | `GET` | `/api/v1/customer/getfullbydescription` | 🔴 | Buscar por nome (completo) |
| 8 | `GET` | `/api/v1/address/getbytaxidregistration/{taxid}` | 🔴 | Listar endereços por CNPJ |
| 9 | `POST` | `/api/v1/address` | 🔴 | Inserir endereço (23 campos, tipos COBRC/ENTRG/FISCO) |
| 10 | `PUT` | `/api/v1/address` | 🔴 | Atualizar endereço |
| 11 | `DELETE` | `/api/v1/address/{id}` | 🔴 | Deletar endereço |
| 12 | `PUT` | `/api/v1/person` | 🔴 | Atualizar pessoa (CNPJ, IE, Nome Fantasia, CNAE) |
| 13 | `GET` | `/webapi/healthcheck` | 🔴 | Health check |
| 14 | `GET` | `/configuration` | 🔴 | Ocelot config |
| 15 | `POST` | `/configuration` | 🔴 | Ocelot config |
| 16 | `DELETE` | `/outputcache/{region}` | 🔴 | Limpar cache |

### PICKUP GATEWAY (v1.17.12.0) — 13 endpoints

| # | Método | Endpoint | Documentado? | Função |
|---|--------|----------|:---:|--------|
| 1 | `POST` | `/token` | ✅ | Autenticação |
| 2 | `GET` | `/api/v1/pickup/{id}` | ✅ | Buscar coleta por ID (21 campos response) |
| 3 | `POST` | `/api/v1/pickup` | ✅ | Criar coleta (14 campos) |
| 4 | `POST` | `/api/v1/pickup/pickupbyquotationprotocol` | ✅ | Criar coleta por protocolo |
| 5 | `GET` | `/api/v1/pickup/getavaliablepickupdate` | 🔴 | Consultar datas disponíveis por protocolo |
| 6 | `GET` | `/api/v1/pickup/getavaliablepickupdatebyparms` | 🔴 | Datas disponíveis por endereço (9 params) |
| 7 | `GET` | `/api/v1/pickup/getpickupbyprotocol` | 🔴 | Buscar coleta por protocolo |
| 8 | `PUT` | `/api/v1/pickup/updatepickupdatebyprotocol` | 🔴 | REAGENDAR coleta (protocol + pickupDate) |
| 9 | `POST` | `/api/v1/pickup/cancelpickupbyprotocol` | 🔴 | CANCELAR coleta (contradiz doc oficial!) |
| 10 | `POST` | `/api/v1/pickup/resendrodonavesexpresspickup` | 🔴 | Reenviar coleta Rodonaves Express |
| 11 | `POST` | `/api/v1/pickup/pickupreschedulingorfinalizingoccurrence` | 🔴 | Reagendar ou finalizar ocorrência |
| 12 | `POST` | `/webapi/automaticpickup/generateautomaticpickup` | 🔴 | Gerar coleta automática (Intelipost) |
| 13 | `GET` | `/api/healthcheck` | 🔴 | Health check |

### SELFATTENDANCE API (v1.99.4.0) — 20 endpoints — API INTEIRA NÃO DOCUMENTADA

| # | Método | Endpoint | Função |
|---|--------|----------|--------|
| 1 | `POST` | `/token` | Autenticação |
| 2 | `GET` | `/webapi/city/description` | Buscar cidades por nome + UF |
| 3 | `GET` | `/webapi/city/zipcode` | Buscar cidade por CEP |
| 4 | `GET` | `/webapi/city/zipcodeaddress` | CEP → endereço completo (rua, bairro, cidade) |
| 5 | `GET` | `/webapi/customer/byvalidquotation` | Validar cliente para cotação (TaxId + Origin) |
| 6 | `GET` | `/webapi/deliveryreceipt` | Comprovante de entrega |
| 7 | `GET` | `/webapi/deliveryreceipt/deliveryInformation` | Info destino |
| 8 | `POST` | `/webapi/deliverytime` | Calcular prazo de entrega |
| 9 | `POST` | `/webapi/pickup/tms` | Inserir coleta via TMS |
| 10 | `POST` | `/webapi/quotation` | Cotação rodoviário |
| 11 | `POST` | `/webapi/quotation/nova-cotacao` | Cotação nova (variação) |
| 12 | `POST` | `/webapi/quotation/simula-cotacao` | Simulação de cotação |
| 13 | `POST` | `/api/objects/register` | Registrar objetos (admin) |
| 14 | `GET` | `/api/objects` | Listar objetos registrados |
| 15 | `GET` | `/api/objects/uncreated` | Listar objetos não criados |
| 16 | `GET` | `/webapi/tracking/v1/tracking-steps-bot` | Steps rastreio para BOT |
| 17 | `GET` | `/webapi/tracking/v1/tracking-last-steps-bot` | Último step para BOT |
| 18 | `GET` | `/webapi/unit/v1` | Dados da unidade Rodonaves |
| 19 | `GET` | `/webapi/unit/v1/calenderunitbyprotocol` | Calendário da unidade por protocolo |
| 20 | `GET` | `/webapi/healthcheck` | Health check |

---
## TODOS OS ENUMS DESCOBERTOS

| Enum | Valores | Significado Decodificado |
|------|---------|-------------------------|
| `CustomersTypeEnum` | 0-7 | 0=Todos, 1=Remetente, 2=Destinatário, 3=Tomador, 4=Expedidor, 5=Recebedor, 6=Expedidor+Remetente, 7=Destinatário+Recebedor |
| `TypePersonEnum` | 0-3 | 0=?, 1=Jurídica, 2=Física, 3=Estrangeiro |
| `PickupServiceTypEnum` | 0-3 | Tipos de serviço de coleta |
| `RegisterSourceEnum` | 0-7 | Origem do cadastro (Portal, API, TMS, etc.) |
| `Address.type` | str | COBRC=Cobrança, ENTRG=Entrega, FISCO=Fiscal |
| `taxpayerType` | str | CI=Contribuinte, IC=Isento, NC=Não Contribuinte |
| `establishmentType` | 1-7 | 1=Transporte, 2=Industrial, 3=Comercial, 4=Comunicação, 5=Energia, 6=Rural, 7=Outros |
| `taxpayerClassificationSystem` | 0-3 | 0=Normal, 1=Outros, 2=Simples Nacional, 3=Lucro Presumido |
| `fiscalStatus` | str | ATVRF=Ativo, INARF=Inativo |
| `customerClassification` | str | EMG=Empresa, EPP=Pequeno Porte, ESTRA=Estrangeiro, ME=Micro, PF=PF |
| `Severity` (ValidationFailure) | int | Níveis de severidade de erro |

---
## ARQUITETURA INTERNA

| Componente | Tecnologia |
|------------|-----------|
| Backend | ASP.NET Core |
| API Gateway | Ocelot (FileRoute, FileConfiguration, QoS, RateLimit, Cache) |
| Auth Controller | `Rodonaves.Framework.Web.Security.Controllers.TokenEndpointController` |
| Login BLL | `Rodonaves.Framework.Bll.LoginBLL.LoginAsync` |
| Exception | `Rodonaves.Framework.Bll.Infra.BusinessException` |
| JWT Issuer | `rteframework` |
| Armazenamento POD | AWS S3 (URLs pré-assinadas com expiração opcional) |
| Cache | OutputCache com regiões |
| Integração | Intelipost (AutomaticPickup com `intelipostShipmentListId`, `intelipostTrackingCode`) |
| CRM/Leads | DataStudio (83 campos, UTM tracking, LGPD compliance) |
| BOT API | SelfAttendance (tracking-steps-bot, tracking-last-steps-bot) |
| Validation | FluentValidation (`ValidationResult`, `ValidationFailure` com `Severity`, `ErrorCode`, `ResourceName`) |

## SWAGGER UI PÚBLICO POR GATEWAY

| Gateway | Swagger | Spec JSON | Tamanho | Versão |
|---------|---------|-----------|---------|--------|
| Tracking | `/swagger/index.html` | `/tracking-api.tracking/docs/v1/swagger.json` | 69KB | 1.27.3.0 |
| Customer | `/swagger/index.html` | `/customer-api.customer/docs/v1/swagger.json` | 64KB | 1.24.7.0 |
| Quotation | `/swagger/index.html` | `/quotation-api.quotation/docs/v1/swagger.json` | 33KB | 1.19.10.0 |
| Pickup | `/swagger/index.html` | `/pickup-api-automaticpickup.pickup/docs/v1/swagger.json` | 51KB | 1.17.12.0 |
| SelfAttendance | — | ReadMe.io Registry `1mld74kq6wk7n4` | 21KB | 1.99.4.0 |

---
*Todas as informações extraídas diretamente dos specs OpenAPI em produção e do ReadMe.io API Registry.*
*5 specs JSON brutos entregues como arquivos separados para integração direta.*