# ADR 0007: Onboarding Automatizado e Massa de Dados

## Status
Aceito

## Contexto
Para garantir que novos desenvolvedores possam ser produtivos em menos de 4 horas e que o sistema suporte testes de carga e visualização realista de dados (Audit Dimension 4 & 7), é necessário um mecanismo robusto de "seeding".

## Decisão
Implementar um arquivo `supabase/seed.sql` exaustivo que:
1. Popula 10+ transportadoras reais com metadados de performance.
2. Cria clientes e fornecedores demo.
3. Gera 50+ entregas com status aleatórios e relacionamentos íntegros.
4. Define regras de negócio demo para testar o motor de automação.

## Consequências
- Facilita o desenvolvimento local e em ambientes de preview.
- Permite testes de estresse consistentes.
- Garante que a UI sempre tenha dados para exibição sem depender de inputs manuais.
