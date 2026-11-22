# Plano Braspress + Multitransportadora — 200 etapas

Plano para o Loggi Flow V2 aproveitar **tudo** o que a Braspress oferece e fechar os buracos das demais
transportadoras que **não** estão no plano Rodonaves (`docs/PLANO_TRANSPORTADORAS_200_ETAPAS.md`).

- **Criado em:** 2026-11-22
- **Base de código lida:** `main` em `0f06ccc`
- **Fontes:** 33 arquivos enviados (análise da API, README, INSTALL, `package.json`, `package-lock.json`,
  `tsconfig.json`, fontes `src/` e build `dist/` do MCP Braspress) + documentação oficial
  `https://api.braspress.com/home` (lida hoje) + este repositório.
- **Estado:** plano. Nenhuma etapa executada.
- **Não verificado:** chamada real à API Braspress (a tentativa de cotação de teste foi bloqueada pela
  política desta sessão) e dados de produção do banco `jvfhclubfpxrtrrazrgr` (MCP do banco não conectado).

## Marcas

| Marca | Significado |
| --- | --- |
| `[DDL]` | Mexe no banco de produção. PR fica aberta aguardando o dono. |
| `[SEGREDO]` | Credencial, secret, CI. PR fica aberta aguardando o dono. |
| `[CUSTO]` | Gera cobrança nova ou recorrente. |
| `[BRP]` | Depende de liberação/resposta da Braspress (homologação, EDI, comprovante). |
| `[CONTRATO]` | Depende de contrato/credencial com a transportadora (Correios, Jadlog, Jamef etc.). |
| `[AVALIAR]` | Valor ou risco incerto. A etapa entrega uma decisão registrada. |
| `→RTE nnn` | Reaproveita a etapa nnn do plano Rodonaves (não duplicar; fazer uma vez só). |

Regras fixas: uma etapa = uma branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>` = uma PR; tabela nova com
`deleted_at` e RLS; edge function sem `console.*`; toda escrita em transportadora nasce atrás de feature flag
desligada.

---

## 1. Veredito

**O Loggi Flow V2 não usa a Braspress em nada.** A Braspress existe só como linha de demonstração no seed, com
CNPJ falso e `api_disponivel = false`. Na cotação multicanal ela cai no canal manual (e-mail/WhatsApp) e o
preço volta por texto lido por IA. Não há cotação, rastreio, ocorrência, conciliação nem automação Braspress.

| Fluxo Braspress | Estado no Loggi Flow | Evidência |
| --- | --- | --- |
| Cadastro da transportadora | ⬛ CNPJ falso `12345678000103`, sem API | `supabase/seed.sql:34` |
| Cotação via API | ⬛ Não existe; multicanal só automatiza RTE, ME, Lalamove | `src/pages/CotacaoMultiCanal.tsx:117-140` |
| Cotação manual | 🟨 Texto de e-mail/WhatsApp lido por regex ou IA (OpenAI) | `supabase/functions/normalize-freight-response/index.ts:111,119` |
| Escolha de transportadora | 🟨 Só tabela estática `tabelas_frete` | `supabase/functions/smart-carrier-selection/index.ts:52-90` |
| Rastreio | ⬛ Não existe | `grep -ri braspress src supabase/functions` vazio |
| Ocorrências / comprovante | ⬛ Não existe | idem |
| Frete cobrado / conciliação | ⬛ Não existe | idem |
| MCP Braspress | 🟥 Existe fora do repo, com credencial de produção dentro do código | seção 2 |

A API Braspress é pequena (2 serviços), mas cobre o essencial: **cotação** e **rastreio por NF ou pedido com
linha do tempo e ocorrências**. O ganho está em automatizar o que a API cobre e fechar por e-mail/EDI o que ela
não cobre (coleta, comprovante, fatura).

## 2. Auditoria do pacote MCP Braspress enviado

| # | Achado | Evidência | Gravidade |
| --- | --- | --- | --- |
| B1 | Token de **produção** fixo no código como valor padrão | `src/index.ts:42`, `src/test-integration.ts:9`, `dist/index.js:26`, `dist/test-integration.js:7` | 🔴 |
| B2 | Token e **senha decodificada** em texto aberto na documentação | `ANALISE_EXAUSTIVA_API_BRASPRESS.md:66-74`, `README.md:39` | 🔴 |
| B3 | Endpoint HTTP `/mcp` sem nenhuma autenticação: quem alcançar a porta usa a conta Braspress | `src/index.ts:542-552` | 🔴 |
| B4 | CNPJ e CEP viram `number`: zeros à esquerda somem (CEP de SP `01310100` vira `1310100`) | `src/services/braspress-client.ts:198-201,214-219` | 🔴 origem é SP |
| B5 | Health marca **online** qualquer resposta HTTP, inclusive 401 (credencial errada = verde) | `braspress-client.ts:435-449` | 🟧 |
| B6 | Validade da cotação calculada no fuso do servidor (UTC): vence 20h59 de Brasília, não 23h59 | `braspress-client.ts:239-241` | 🟧 |
| B7 | Retry com atraso fixo de 1 s, inclusive em 429, e repete POST | `braspress-client.ts:139-172`, `constants.ts:97` | 🟧 |
| B8 | Log imprime os 50 primeiros caracteres da URL do proxy (pode conter usuário:senha) | `braspress-client.ts:81` | 🟧 |
| B9 | Modo HTTP cria transporte novo por requisição e reconecta o mesmo `McpServer` | `src/index.ts:543-551` | 🟨 NÃO VERIFICADO se quebra na 2ª chamada |
| B10 | `inputSchema` da cotação é `ZodEffects` (`.refine` no objeto), não objeto simples | `src/schemas/cotacao.ts:92`, `src/index.ts:241` | 🟨 NÃO VERIFICADO se o SDK expõe os campos |
| B11 | Peso máximo aéreo (500 kg) declarado e nunca aplicado; aéreo aceita 30 t | `constants.ts:131`, `cotacao.ts:73-76` | 🟨 |
| B12 | Soma de `cubagem[].volumes` não é conferida com `volumes` | `cotacao.ts:78-85` | 🟨 |
| B13 | `BRASPRESS_BASE_URL` documentado e ignorado pelo código | `INSTALL.md:48`; `src/index.ts:40-61` | 🟨 |
| B14 | `npm run test:integration` documentado e inexistente | `INSTALL.md:20`; `package.json:10-18` | 🟨 |
| B15 | `engines.node >=18`, mas `https-proxy-agent@9`/`agent-base@9` exigem Node 20 | `package.json:43-45`; `package-lock.json:925-927,1652-1654` | 🟨 |
| B16 | Ícone compara `status === 'EM_TRANSITO'`; o formato real de `status` não está documentado | `src/index.ts:130-131` | 🟨 |
| B17 | `openWorldHint: false` em todas as tools, mas elas chamam API externa | `src/index.ts:246,297,355,407,449,493` | ⬜ |
| B18 | 3 schemas (genérico, múltiplo, filtro) sem tool que os use | `src/schemas/tracking.ts:43-100` | ⬜ |
| B19 | `dist/` igual ao `src/` (mesmo comportamento e mesmos defeitos) | `dist/*.js` | — |

## 3. O documento de análise contra a documentação oficial

| Afirmação no documento enviado | Documentação oficial | Situação |
| --- | --- | --- |
| Cotação `POST /v1/cotacao/calcular/{json\|xml}`, Basic Auth | Igual | ✅ |
| Tracking v1, v2 (grupo econômico), v3 por NF e por pedido | Igual | ✅ |
| Cotação vale até 23h59m59s do dia; tracking só 90 dias | Igual | ✅ |
| Resposta da cotação traz `validade` e `datetime` | Oficial lista só `id`, `prazo`, `totalFrete` | ❌ NÃO VERIFICADO |
| v3 traz `statusEntrega`, `destino`, `totalNf`, `fluxoAtendimento` | Oficial lista só `timeline` e `ocorrencias` a mais | ❌ NÃO VERIFICADO |
| Códigos 422 e 429, tabela de mensagens de erro | Não documentados; oficial diz que não há limite de taxa | ❌ inventado |
| Enum `StatusEntrega` (ENTREGUE, EM_TRANSITO…) | Não documentado | ❌ inventado |
| Endpoints `/filiais`, `/cobertura`, `/coleta`, `/comprovante` | Não existem na documentação | ❌ especulação |
| — (omitido no documento) | **Destinatário não cadastrado: cota por CEP, exceto FOB (tipo 2)** | ⚠️ regra real ausente |
| — (omitido no documento) | **Existe ambiente de homologação com usuário/senha próprios** | ⚠️ não usado |
| — (omitido no documento) | O exemplo oficial em curl tem JSON malformado | ⚠️ não copiar |

## 4. Matriz das transportadoras

| Transportadora | API/canal conhecido | No Loggi Flow hoje | Onde está o plano |
| --- | --- | --- | --- |
| Rodonaves | API completa (cotação, coleta, rastreio, comprovante) | 🔴 integrada e quebrada | plano RTE inteiro |
| **Braspress** | API cotação + rastreio v1/v2/v3; resto por SAC/portal | ⬛ nada | **Fases 1–9 deste plano** |
| Lalamove | API cotação/pedido/webhook | 🟨 parcial, pedidos não guardados | RTE 117–130 |
| Melhor Envio (Correios/Jadlog/Loggi/Azul via ME) | API | 🟨 30 ações, sem automação | RTE 131–142 |
| Total Express | API (MCP pronto, 11 tools) | ⬛ nada | RTE 143–152 |
| Correios (contrato direto) | API Correios: preço, prazo, rastro, pré-postagem, coleta, faturas | ⬛ seed com `api_disponivel=true` falso | Fase 10 |
| Jadlog (direto) | API cotação/pedido/rastreio | ⬛ seed | Fase 10 |
| Jamef | API cotação/rastreio `[AVALIAR]` | ⬛ seed `api_disponivel=false` | Fase 10 |
| Azul Cargo | API/portal `[AVALIAR]` | ⬛ seed | Fase 10 |
| Loggi (direto) | API Shipment/Label | ⬛ seed | Fase 10 |
| Expresso São Miguel e demais sem API | e-mail/WhatsApp/EDI | 🟨 canal manual | Fase 10 |

## 5. Premissas (confirmar)

| # | Premissa | Etapas |
| --- | --- | --- |
| P1 | O usuário de produção da API Braspress pertence à Promo Brindes (CNPJ 36.835.552/0001-67), tomador nos fretes CIF | 009, 065 |
| P2 | Matriz em SP e empresa em GO formam grupo econômico na Braspress (tracking v2) | 068, 070 |
| P3 | Origem padrão SP; GO como segunda origem | 044 |
| P4 | Braspress é usada em rodoviário; aéreo só sob demanda | 047 |
| P5 | Transportadoras "principais" = Rodonaves, Braspress, Lalamove, Melhor Envio, Total Express, Correios, Jadlog, Jamef, Azul Cargo, Loggi | Fase 10 |
| P6 | Pedido do Bitrix24 carrega NF-e com chave de 44 dígitos antes do despacho | 066 |
| P7 | Nenhuma transportadora nova entra sem CNPJ real, contato e credencial | 012, Fase 10 |

## 6. Dependências do plano Rodonaves

Estas fundações são comuns e **não** são refeitas aqui. Se ainda não existirem quando a etapa Braspress
precisar, executar a etapa RTE correspondente primeiro.

| Fundação | Etapa RTE |
| --- | --- |
| Colunas fiscais/físicas da entrega (`chave_nfe`, `peso_kg`, `dimensoes`…) | RTE 013 |
| `envios_transportadora` | RTE 014 |
| `eventos_rastreio` multi-transportadora | RTE 015 |
| `codigos_rastreio` (dicionário) | RTE 016 |
| `cotacoes_frete` completas | RTE 017 |
| `faturas_transportadora` + itens | RTE 019 |
| `codigo_integracao` em `transportadoras` | RTE 020 |
| Contrato `CarrierAdapter` + edge `carrier-gateway` | RTE 025–026 |
| Status canônico único | RTE 028 |
| Credenciais só no servidor | RTE 031 |
| `carrier_api_calls`, fila pgmq, flags | RTE 032–034 |
| Motor multicanal com cotação real | RTE 153–164 |
| WhatsApp por marco, Bitrix24, resumo diário | RTE 165–176 |

---

## Fase 1 — Segurança e credenciais (001–008)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 001 | Trocar a senha Braspress `[SEGREDO]` `[BRP]` | Pedir à filial nova senha de produção (B1, B2); invalidar a atual | A senha dos documentos responde 401 |
| 002 | Tirar o token do código do MCP | Remover o valor padrão em `index.ts:42` e `test-integration.ts:9`; falhar ao iniciar sem env | Busca pelo token antigo não acha nada no MCP |
| 003 | Limpar a documentação | Remover token e senha do README e da análise; versionar só a versão limpa | Nenhum documento contém credencial |
| 004 | Varredura de vazamento | gitleaks nos repos e no histórico onde o MCP já tenha sido commitado | Relatório sem ocorrência Braspress |
| 005 | Credencial de homologação `[BRP]` | Pedir usuário/senha de homologação (previsto na doc oficial) | Existe segredo `BRASPRESS_HML_*` |
| 006 | Segredos no Supabase `[SEGREDO]` | `BRASPRESS_USER`, `BRASPRESS_PASS`, `BRASPRESS_ENV` (hml/prd) só como secret de edge | A edge lê do env; nada no front |
| 007 | Autenticação no MCP HTTP | Bearer obrigatório em `/mcp` (B3); `/health` sem dados sensíveis | Chamada sem token recebe 401 |
| 008 | Log sem proxy nem credencial | Remover impressão da URL de proxy (B8); mascarar CNPJ em log | Log não mostra `user:senha` de proxy |

## Fase 2 — Cadastro e fundação Braspress (009–018)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 009 | Confirmar a conta `[BRP]` | Confirmar CNPJ tomador da credencial (P1) e filial de atendimento | Premissa P1 respondida |
| 010 | Cadastro real da Braspress `[DDL]` | CNPJ real, contatos, `url_rastreamento`, `api_disponivel=true`, `codigo_integracao='braspress'` (→RTE 020) | A linha de produção não tem CNPJ falso |
| 011 | Seed sem CNPJ falso | Trocar os CNPJs `1234567800010x` do seed por dados reais ou marcar como demo | `supabase/seed.sql:30-39` sem CNPJ falso |
| 012 | Contatos operacionais | SAC, WhatsApp, `ws.ocorrencias@`, filial; guardar em `transportadoras` | Tela da transportadora mostra contatos certos |
| 013 | Tabelas comuns prontas | Garantir RTE 013–017 e 019 aplicadas antes da Fase 3 `[DDL]` | Tabelas existem em produção |
| 014 | Dicionário Braspress `[DDL]` | Carregar em `codigos_rastreio` as descrições de timeline/ocorrência reais (vindas da carga 080) | Toda descrição vista tem fase canônica |
| 015 | Configuração por transportadora `[DDL]` | Em `transportadoras`: modal padrão, tipo de frete padrão, fator de cubagem, limite de peso por modal | Valores lidos do banco, não do código |
| 016 | Origens com CNPJ | Origem SP e GO com CEP e CNPJ remetente próprios (P3) | Cotação escolhe o CNPJ certo por origem |
| 017 | Feature flags Braspress | Flags: cotação, rastreio automático, aviso ao cliente, conciliação (→RTE 034) | Cada automação desliga sem deploy |
| 018 | ADR da integração | Registrar: API só cotação/rastreio; coleta, comprovante e fatura por canal manual/EDI | `docs/adr/` tem a decisão |

## Fase 3 — Adaptador Braspress no backend (019–040)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 019 | Edge `braspress-api` | Edge Deno com ações `quote`, `track_nf`, `track_pedido`, `health`; JWT obrigatório | Edge responde às 4 ações |
| 020 | Cliente HTTP enxuto | `fetch-with-timeout` + `circuitBreaker` de `_shared`, sem axios | Sem dependência nova |
| 021 | Documento como texto | CNPJ/CPF/CEP sempre string com zeros (corrige B4) | CEP `01310100` sai com 8 dígitos |
| 022 | Teste do formato aceito `[BRP]` | Em homologação, testar CEP/CNPJ como string e como número | Formato aceito registrado no ADR |
| 023 | Cubagem em metros | Converter cm do Loggi Flow para m na borda do adaptador | Teste: 67 cm vira 0,67 |
| 024 | Validação antes de chamar | CNPJ com dígito verificador, CEP 8 dígitos, soma de volumes da cubagem = total (B12) | Erro local sem gastar chamada |
| 025 | Limite por modal | Peso máximo aéreo e rodoviário vindos da etapa 015 (B11) | Aéreo acima do limite é recusado localmente |
| 026 | Regra FOB | Tipo 2 exige destinatário cadastrado; avisar antes (seção 3) | Mensagem clara antes da API recusar |
| 027 | Consignado | Tipo 3 exige `cnpjConsignado` | Teste cobre o caso |
| 028 | Retentativa correta | Backoff exponencial com jitter só em 5xx/rede; 429 respeita `Retry-After` (B7) | Teste de retry passa |
| 029 | Limite próprio de chamadas | A doc não define limite; impor teto por minuto via `rateLimiter` | Rajada não passa do teto |
| 030 | Erros traduzidos | Ler `statusCode`, `message`, `errorList`; mapear para mensagem em português | Front mostra o motivo real |
| 031 | Health verdadeiro | 401/403 = credencial com problema, não "online" (B5) | Senha errada aparece vermelha |
| 032 | Ambiente explícito | `BRASPRESS_ENV` decide credencial; resposta traz o ambiente | Tela mostra hml/prd |
| 033 | Registro de chamadas | Gravar em `carrier_api_calls` operação, status, latência (→RTE 032) | Dá para ver falhas de ontem |
| 034 | Resposta bruta guardada | `raw` jsonb em cotação e evento para auditoria | Resposta original consultável |
| 035 | Adaptador no contrato comum | Braspress implementa `quote`/`track` do `CarrierAdapter` (→RTE 025) | Suíte comum roda para Braspress |
| 036 | Normalizador de tracking | v3 → evento canônico; v1/v2 → só último status | Testes com respostas gravadas |
| 037 | Datas em America/Sao_Paulo | Parse `DD/MM/YYYY HH:mm` como horário de Brasília | Evento das 23h não muda de dia |
| 038 | Respostas gravadas | Fixtures de homologação para cotação, NF sem frete, NF entregue, erro | CI roda sem rede |
| 039 | Teste de contrato | Falhar se campo enviado não existir na doc oficial | Campo inventado quebra o CI |
| 040 | Suíte comum de adaptadores | Braspress passa nos mesmos casos das outras (→RTE 036) | Suíte verde |

## Fase 4 — Cotação Braspress (041–064)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 041 | Braspress na cotação multicanal | Chamar o adaptador ao lado de RTE/ME/Lalamove em `CotacaoMultiCanal` | Braspress aparece com preço e prazo |
| 042 | Sair do canal manual | Com API ativa, Braspress não usa mais e-mail/IA | Nenhuma cotação Braspress passa por `normalize-freight-response` |
| 043 | Cotação gravada | `cotacoes_frete` com `id` Braspress, prazo, valor, payload e resposta | Toda cotação auditável |
| 044 | Origem certa | CNPJ remetente e CEP pela origem escolhida (etapa 016) | Cotação de GO usa CNPJ de GO |
| 045 | Destinatário PF/PJ | Enviar CPF ou CNPJ do cliente do pedido | Cotação usa o documento real |
| 046 | Tipo de frete do pedido | CIF/FOB/consignado vindo do pedido, não fixo | FOB cotado como FOB |
| 047 | Modal aéreo sob demanda | Cotar aéreo quando prazo do pedido não couber no rodoviário (P4) | Opção aérea aparece quando útil |
| 048 | Cubagem dos volumes | Usar caixas cadastradas (→RTE 040) convertidas para metros | Cotação sem digitar medida |
| 049 | Peso cubado local | Calcular e mostrar peso cubado antes de cotar | Operador vê se paga volume |
| 050 | Validade correta | Validade = hoje 23h59m59s em Brasília (corrige B6) | Cotação das 21h não aparece vencida |
| 051 | Cache do dia | Mesma origem/destino/peso/cubagem/valor no mesmo dia não chama a API | Repetição vem do cache |
| 052 | Recotação no fechamento | Cotação de outro dia é refeita ao fechar o pedido | Frete fechado sempre com cotação do dia |
| 053 | Prazo em dias úteis | Previsão = data de despacho + `prazo` úteis com feriados | Data prometida bate com a Braspress |
| 054 | Cotação em lote | Vários pedidos pela fila (→RTE 033) | 50 pedidos cotados sem travar |
| 055 | Cotação na venda | Simulação rápida na tela de pedido/Bitrix | Vendedor vê frete Braspress na venda |
| 056 | Frete no card do Bitrix24 | Gravar valor e prazo escolhidos no deal | Card mostra frete Braspress |
| 057 | Comparação com tabela | Mostrar diferença entre API e `tabelas_frete` | Tabela desatualizada aparece |
| 058 | Atualizar `tabelas_frete` | Recalcular faixa Braspress a partir das cotações reais do mês | Reserva estática fica próxima do real |
| 059 | Cobertura aprendida | CEP que a API recusa vai para lista "fora da malha" com motivo | CEP recusado não é cotado de novo |
| 060 | Custo por kg e por km | Calcular a partir da cotação e da distância do mapa | Ordenar opções por custo/kg |
| 061 | Alerta de frete alto | Frete acima de X% do valor da NF | Frete desproporcional avisado antes |
| 062 | Mínimo e taxa | Detectar frete mínimo (valor fixo para pesos baixos) | Pedido pequeno mostra alternativa mais barata |
| 063 | Cotação XML desligada | Usar só JSON; remover opção XML do contrato | Nenhuma chamada XML |
| 064 | Tela de erro útil | CEP sem cobertura, CNPJ não cadastrado, FOB sem cadastro com ação sugerida | Operador sabe o próximo passo |

## Fase 5 — Rastreio Braspress automático (065–092)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 065 | Tomador certo | CIF: CNPJ da Promo; FOB: CNPJ do cliente; consignado: CNPJ do consignatário | Busca usa o CNPJ que a Braspress espera |
| 066 | NF da entrega | Número e série da NF-e (P6) ligados à entrega | Toda entrega Braspress tem NF |
| 067 | v3 como padrão | Usar `byNf` v3; v1/v2 só como reserva | Linha do tempo aparece |
| 068 | v2 grupo econômico | Para fretes de SP e GO juntos, consultar v2 quando v3 não achar (P2) | Frete da filial GO encontrado |
| 069 | Rastreio por pedido | `byNumPedido` quando a NF ainda não existir no sistema | Pedido rastreado sem NF |
| 070 | Número do pedido na Braspress | Confirmar qual número de pedido a Braspress grava (nosso, do cliente) `[BRP]` | Regra registrada |
| 071 | Cron de sincronização | A cada 30 min no horário comercial, 2 h fora | Painel mostra última sincronização |
| 072 | Fila por envio | Envios em aberto vão para a fila; lote limitado por minuto | 500 envios sem estourar a edge |
| 073 | Gravar eventos | `timeline` e `ocorrencias` em `eventos_rastreio` sem duplicar | Evento repetido não duplica |
| 074 | Último status | Atualizar fase, previsão, data de entrega e último evento no envio | Card muda sozinho |
| 075 | Conhecimento (CT-e) | Guardar `numero` do conhecimento e emissão no envio | CT-e visível na entrega |
| 076 | Uma NF, vários conhecimentos | Tratar lista `conhecimentos` com mais de um item | Redespacho não sobrescreve |
| 077 | Várias NFs, um conhecimento | Ligar o mesmo CT-e às entregas de todas as NFs | Entregas agrupadas mostram o mesmo frete |
| 078 | Janela de 90 dias | Parar de consultar após entrega + 7 dias; nunca depender da API para histórico | Sem 404 por idade |
| 079 | Fim do rastreio | Entregue, devolvido ou cancelado sai da fila | Consultas diárias caem |
| 080 | Carga inicial | Rastrear todas as entregas Braspress dos últimos 90 dias | Histórico recente no banco |
| 081 | Catálogo de descrições | Juntar descrições reais vistas e mapear para fases (etapa 014) | Nenhuma descrição sem fase |
| 082 | Descrição nova = alerta | Texto não mapeado vira pendência, não "em trânsito" | Tela de pendências lista novas |
| 083 | Previsão versus prometido | Comparar `previsaoEntrega` com prazo da cotação | Atraso previsto aparece cedo |
| 084 | Atraso real | Passou a previsão sem `dataEntrega` → atrasado | Lista de atrasados correta |
| 085 | Parado | Sem evento novo há 48 h úteis → parado | Lista de parados correta |
| 086 | Frete sem pedido | Conhecimento achado sem entrega ligada vira pendência | Nada passa despercebido |
| 087 | Rastreio na tela | `CentralRastreamento` com Braspress, fase, previsão, timeline | Ninguém abre o site da Braspress |
| 088 | Rastreio público | Página pública mostra timeline Braspress normalizada | Cliente acompanha pelo link do Loggi Flow |
| 089 | Link oficial de reserva | `url_rastreamento` Braspress na página e no WhatsApp | Link funciona |
| 090 | Botão "atualizar agora" | Rastreio unitário sob demanda com limite | Operador força atualização |
| 091 | Saúde da sincronização | Alerta se o cron falhar 2 vezes seguidas | Falha percebida em minutos |
| 092 | Métricas de prazo | % no prazo por UF, rota e mês | Painel de desempenho Braspress |

## Fase 6 — Ocorrências, comprovante e SAC (093–106)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 093 | Ocorrência automática | Evento de exceção abre registro em `ocorrencias` com tipo e prazo | Fila espelha as exceções |
| 094 | Fechar sozinho | Ocorrência fecha quando o envio volta ao normal | Sem ocorrência órfã |
| 095 | Ações por tipo | Ausente → reagendar; endereço → confirmar; recusa → devolução; avaria/extravio → indenização | Próximo passo em 1 clique |
| 096 | E-mail ao SAC | Gerar e-mail para `sac@` ou `ws.ocorrencias@` com NF, CT-e e pedido | Abertura de chamado sem digitar |
| 097 | Pedido de comprovante | Na entrega, enviar pedido de comprovante ao SAC (API não tem) | Pedido sai sozinho |
| 098 | Caixa de entrada do SAC `[AVALIAR]` | Ler respostas do SAC (Gmail/IMAP) e anexar comprovante à entrega | Comprovante chega sem download manual |
| 099 | Comprovante no Storage | Guardar arquivo e recebedor; link assinado | Entrega mostra comprovante |
| 100 | Comprovante via portal `[AVALIAR]` | Avaliar baixar do portal do cliente Braspress (login) | Decisão registrada |
| 101 | Validação do comprovante | Reaproveitar `ocr-receipt-processor` | Divergência de recebedor alerta |
| 102 | Devolução | Recusa/devolução cria `logistica_reversa` | Devolução não depende de alguém notar |
| 103 | Indenização | Extravio/avaria abre processo com valor da NF e prazo | Nenhum extravio sem pedido |
| 104 | WhatsApp operacional | Mensagem pronta para o WhatsApp da Braspress com os dados do frete | Contato em 1 clique |
| 105 | Prazo de resposta | Cronometrar resposta do SAC por ocorrência | Indicador de atendimento Braspress |
| 106 | Comprovante por API `[BRP]` | Perguntar se existe API/EDI de comprovante não documentada | Resposta registrada |

## Fase 7 — Coleta Braspress sem API (107–116)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 107 | Como a filial recebe coleta `[BRP]` | Confirmar canal (portal, e-mail, WhatsApp, janela de corte) | Regra registrada |
| 108 | Pedido de coleta gerado | Montar pedido com remetente, volumes, peso, cubagem, NF, janela | Dados completos sem digitar |
| 109 | Envio automático | Mandar por e-mail/WhatsApp ao canal da etapa 107, atrás de flag | Pedido sai sozinho após faturamento |
| 110 | Agrupar o dia | Juntar pedidos do mesmo dia numa coleta | Uma solicitação por dia |
| 111 | Confirmação | Ler resposta (e-mail/WhatsApp) e marcar coleta confirmada | Status de coleta real |
| 112 | Coleta não feita | Sem evento "coletado" até o fim do dia → alerta | Esquecimento percebido no mesmo dia |
| 113 | Calendário | Coletas Braspress no `CalendarioLogistico` | Expedição vê a semana |
| 114 | Coleta via portal `[AVALIAR]` | Avaliar automação do portal web (login) | Decisão registrada |
| 115 | API de coleta `[BRP]` | Pedir API de coleta (não documentada) | Resposta registrada |
| 116 | Etiqueta Braspress `[BRP]` | Confirmar padrão de etiqueta/código de barras exigido | Etiqueta aceita pela filial |

## Fase 8 — Financeiro e conciliação Braspress (117–128)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 117 | Frete cobrado pelo rastreio | Gravar `totalFrete` do conhecimento como valor cobrado | Cada CT-e tem valor cobrado |
| 118 | Cotado × cobrado | Comparar com a cotação do pedido; tolerância configurável | Divergência listada |
| 119 | Peso cotado × cobrado | Comparar `peso` do conhecimento com o declarado | Cubagem cobrada aparece |
| 120 | Contestação | E-mail pronto à Braspress com CT-e, cotação e diferença | Contestação em 1 clique |
| 121 | Faturas | Importar fatura (PDF/CSV) para `faturas_transportadora` | Fatura ligada aos CT-es |
| 122 | EDI de cobrança `[BRP]` `[AVALIAR]` | Pedir DOCCOB/CONEMB Proceda | Decisão registrada |
| 123 | EDI de ocorrências `[BRP]` `[AVALIAR]` | Pedir OCOREN como complemento ao polling | Decisão registrada |
| 124 | Vencimentos | Alerta de fatura a vencer | Nenhuma fatura vence sem aviso |
| 125 | Promo Finance | Exportar fatura aprovada para o financeiro | Financeiro não redigita |
| 126 | Custo por pedido | Frete real no pedido e margem após frete | Venda vê frete real |
| 127 | Painel Braspress | Gasto por mês, UF, cliente; custo/kg | Dono vê o gasto Braspress |
| 128 | Dossiê de negociação | Volume, rotas, prazo cumprido e frete médio contra RTE/outras | PDF pronto para negociar |

## Fase 9 — MCP Braspress corrigido e útil (129–142)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 129 | Repositório próprio | Versionar o MCP em `adm01-debug/braspress-mcp` sem `dist/` e sem credencial | Repo limpo no GitHub |
| 130 | Correções B4–B8 | Zeros à esquerda, health, fuso, retry, log de proxy | Testes de cada defeito passam |
| 131 | Schema da cotação | Objeto simples no `inputSchema`; regra de consignado dentro do handler (B10) | `tools/list` mostra todos os campos |
| 132 | Servidor por requisição | Modo HTTP sem estado: novo `McpServer` por chamada (B9) | 10 chamadas seguidas funcionam |
| 133 | Engine Node 20 | Ajustar `engines` (B15) | `npm ci` sem aviso |
| 134 | Scripts e docs | Criar `test:integration`, ler `BRASPRESS_BASE_URL` (B13, B14) | INSTALL funciona como escrito |
| 135 | Remover o inventado | Tirar status/ocorrências sem fonte (B16, seção 3); usar catálogo real (etapa 081) | `braspress_status_info` só com dado real |
| 136 | Rastreio em lote | Tool usando `TrackingMultiploSchema` (B18) | 10 NFs numa chamada |
| 137 | Rastreio genérico | Tool NF-ou-pedido com reserva v2 | Uma tool resolve qualquer busca |
| 138 | Tool "frete do pedido" | Consultar o Loggi Flow (envio, eventos, cotação) pelo número do pedido | Atendimento responde sem abrir sistema |
| 139 | Anotações corretas | `openWorldHint: true` (B17) | Cliente MCP trata como externo |
| 140 | Deploy | Cloudflare Worker com segredo e Bearer, igual aos MCPs RTE/Total Express `[SEGREDO]` | MCP conectado no Claude |
| 141 | Testes | Unitários com respostas gravadas; CI | CI verde |
| 142 | Observabilidade | Latência e erro por tool | Falha visível |

## Fase 10 — Demais transportadoras fora do plano RTE (143–174)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 143 | Lista oficial | Confirmar com o dono quais transportadoras estão ativas (P5) e volume de cada | Lista registrada |
| 144 | Seed real | Corrigir `api_disponivel` falsos do seed (Correios, Loggi, Azul, Jadlog) | Tela não promete API que não existe |
| 145 | Correios: contrato `[CONTRATO]` | Confirmar contrato e acesso ao CWS | Credencial existe |
| 146 | Correios: preço e prazo | Adaptador com API de preço/prazo | Correios direto na multicanal |
| 147 | Correios: pré-postagem e etiqueta | Pré-postagem com chave NF-e | Etiqueta sem passar pelo ME |
| 148 | Correios: rastro | Cron de rastreio para eventos canônicos | Envios Correios atualizam sozinhos |
| 149 | Correios: coleta | API Coleta Interativa | Coleta pedida pela tela |
| 150 | Correios: faturas | API Faturas para conciliação | Fatura Correios conferida |
| 151 | Jadlog: contrato `[CONTRATO]` | Confirmar contrato direto × via ME | Decisão registrada |
| 152 | Jadlog: cotação | Adaptador de frete | Jadlog direto cotado |
| 153 | Jadlog: pedido | Inclusão de pedido/etiqueta | Pedido sem portal |
| 154 | Jadlog: rastreio | Cron de rastreio | Atualiza sozinho |
| 155 | Jadlog: comprovante `[AVALIAR]` | Ver se API entrega POD | Decisão registrada |
| 156 | Jadlog: conciliação | Cotado × cobrado | Conferido |
| 157 | Jamef: acesso `[CONTRATO]` `[AVALIAR]` | Confirmar API e credencial | Decisão registrada |
| 158 | Jamef: cotação | Adaptador se houver API | Jamef na multicanal |
| 159 | Jamef: rastreio | Cron de rastreio | Atualiza sozinho |
| 160 | Jamef: ocorrências | Códigos no dicionário | Exceção aparece |
| 161 | Jamef: canal manual | Sem API: modelo de e-mail + leitura por IA | Cotação Jamef sem digitar |
| 162 | Azul Cargo: acesso `[CONTRATO]` `[AVALIAR]` | Confirmar API/portal | Decisão registrada |
| 163 | Azul Cargo: cotação aérea | Adaptador ou canal manual | Aéreo comparado com Braspress aéreo |
| 164 | Azul Cargo: rastreio | Cron ou leitura de e-mail | Atualiza sozinho |
| 165 | Azul Cargo: regra de uso | Urgência/distância que justificam aéreo | Motor sugere aéreo só quando vale |
| 166 | Loggi: acesso `[CONTRATO]` `[AVALIAR]` | Direto (API Shipment/Label) × via ME | Decisão registrada |
| 167 | Loggi: coleta e etiqueta | API Shipment e Label | Envio Loggi sem portal |
| 168 | Loggi: rastreio | Cron/webhook | Atualiza sozinho |
| 169 | Loggi: conciliação | Cotado × cobrado | Conferido |
| 170 | Sem API: modelo de pedido | E-mail/WhatsApp padrão por transportadora com todos os dados | Pedido sai em 1 clique |
| 171 | Sem API: leitura da resposta | Regex primeiro; IA só como reserva, provedor configurável | Cotação manual vira número |
| 172 | Sem API: rastreio por link | `url_rastreamento` com NF/CT-e na página pública | Cliente acompanha |
| 173 | Sem API: EDI `[AVALIAR]` | Receber OCOREN por e-mail/SFTP | Decisão registrada |
| 174 | Matriz viva | Tela com capacidade × transportadora (cota, coleta, rastreia, POD, fatura) | Admin vê o que cada uma faz |

## Fase 11 — Motor multicanal e automações (175–188)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 175 | Braspress no motor | `smart-carrier-selection` usa cotação real Braspress (→RTE 153) | Recomendação com preço do dia |
| 176 | Restrições Braspress | FOB sem cadastro, peso aéreo, CEP fora da malha excluem com motivo | Nenhuma recomendação inválida |
| 177 | Desempenho real | Nota usa % no prazo da Fase 5 | Nota reflete o mês |
| 178 | RTE × Braspress por rota | Comparar preço e prazo nas mesmas rotas | Sugestão por rota |
| 179 | Registro da decisão | Opções e escolha em `freight_decisions` | Economia medida |
| 180 | WhatsApp por marco | Coletado, em trânsito, saiu, entregue para Braspress (→RTE 165) | Cliente avisado sem ação |
| 181 | Aviso de atraso | Previsão estourada → mensagem com nova data | Cliente sabe antes de reclamar |
| 182 | Bitrix24 | Fase, CT-e, previsão e comprovante no card (→RTE 169–170) | Vendedor vê sem abrir o Loggi Flow |
| 183 | Resumo diário | Braspress no resumo das 8 h (→RTE 172) | Equipe começa com a lista |
| 184 | Assistente de IA | `ai-logistics-assistant` responde rastreio Braspress | Pergunta respondida com dado real |
| 185 | Regras configuráveis | Gatilhos de rastreio Braspress em `AutomacaoRegras` | Admin cria automação sem código |
| 186 | Webhook para clientes | Mudança de fase Braspress dispara `client_webhooks` | Cliente grande recebe status |
| 187 | Previsão de atraso | `predict-delays` com histórico Braspress | Atraso previsto antes do prazo |
| 188 | Simulador | "E se a Braspress subir X%" sobre o histórico | Apoio numérico para negociar |

## Fase 12 — Qualidade e entrada em produção (189–200)

| # | Etapa | O que fazer | Pronto quando |
| --- | --- | --- | --- |
| 189 | CI medido no início | Registrar estado do CI antes da primeira PR | Estado registrado |
| 190 | Testes unitários | Adaptador, normalizador, datas, validação, retry | Pisos de cobertura passam |
| 191 | Testes de contrato | Braspress em `tests/contracts/` | Mudança de formato quebra o CI |
| 192 | Ensaio em homologação | Cotação, NF sem frete, NF entregue, erro, FOB sem cadastro | Evidência anexada à PR |
| 193 | Primeiro uso em produção | Cotação e rastreio reais com pedido combinado | Evidência real |
| 194 | E2E | Cotar → escolher Braspress → rastrear → ocorrência → comprovante | Fluxo passa no Playwright |
| 195 | RLS e LGPD | Tabelas novas nos testes de RLS; comprovante com retenção | `test:rls` e `test:security` passam |
| 196 | Desempenho | Índices de envio/evento Braspress; central < 300 ms | `EXPLAIN` registrado |
| 197 | Guia de incidente | API fora, 401, cotação divergente, sincronização parada | Passo a passo testado |
| 198 | Liga por etapas | Rastreio → cotação → aviso ao cliente → coleta por e-mail → conciliação | Tudo ligado com reserva |
| 199 | Painel de automação | % entregas Braspress com NF, CT-e, comprovante, frete conferido | Dono vê o ganho |
| 200 | Revisão de 30 dias | Horas poupadas, atrasos percebidos, frete recuperado | Relatório e próximos passos |

---

## Ordem recomendada

1. **001–008 hoje**: a credencial de produção está em código e documentos.
2. **009–018**: cadastro real e fundação (com RTE 013–020 e 025–034).
3. **019–040 → 065–092**: adaptador e rastreio automático (maior ganho, só leitura).
4. **041–064**: cotação Braspress na multicanal e no motor.
5. **093–128**: ocorrências, coleta por e-mail, conciliação.
6. **129–142**: MCP corrigido (em paralelo, independe do Loggi Flow).
7. **143–174** por volume de uso de cada transportadora.
8. **175–200** acompanham tudo.

## Só o dono pode fazer

- Etapa 001: pedir nova senha à Braspress (a atual está exposta).
- Etapas 005, 070, 106, 107, 115, 116, 122, 123: perguntas/pedidos à filial Braspress.
- Confirmar as premissas P1–P7.
- Autorizar as PRs `[DDL]` e `[SEGREDO]`.
- Fase 10: confirmar contratos (Correios, Jadlog, Jamef, Azul Cargo, Loggi).
