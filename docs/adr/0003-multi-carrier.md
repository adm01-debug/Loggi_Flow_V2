# ADR 0003: Arquitetura Multi-Transportadora

## Status
Aceito

## Contexto
Necessidade de suportar múltiplos provedores logísticos (Lalamove, Rodonaves, Melhor Envio) com APIs distintas.

## Decisão
- **Service Pattern:** Criar serviços isolados em `src/integrations/`.
- **Hooks de Abstração:** Utilizar hooks como `useCarrierRates` para abstrair a complexidade da transportadora para a UI.
- **Normalização:** Converter payloads de APIs externas para uma interface interna comum de 'Entrega' e 'Cotação'.

## Consequências
- Facilidade para adicionar novas transportadoras.
- UI desacoplada das implementações específicas das APIs.
