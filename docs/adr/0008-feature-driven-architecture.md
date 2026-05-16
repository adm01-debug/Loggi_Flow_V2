# ADR 0008: Arquitetura Baseada em Features (Feature-Driven Architecture)

## Data
2026-05-16

## Status
Aceito

## Contexto
À medida que o LogiFlow cresce, a estrutura de diretórios baseada apenas em tipos (components, hooks, pages) torna-se difícil de escalar e manter devido ao alto acoplamento entre domínios.

## Decisão
Adotar uma arquitetura baseada em **Features**, onde cada domínio funcional do sistema (ex: `analytics`, `auth`, `logistics`) possui seu próprio diretório em `src/features/`.

Cada feature deve conter:
- `components/`: Componentes específicos do domínio.
- `hooks/`: Lógica de estado e hooks específicos.
- `services/`: Chamadas de API e integrações.
- `types/`: Definições de tipos.
- `index.ts`: Ponto de entrada (Public API) da feature.

Componentes globais e reutilizáveis permanecem em `src/components/common`.

## Consequências
- **Prós:** Baixo acoplamento, alta coesão, facilidade para refatoração e testes, carregamento tardio (lazy loading) mais eficiente.
- **Contras:** Leve aumento na complexidade de navegação de arquivos inicialmente.
