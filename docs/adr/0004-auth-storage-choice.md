# ADR 0004: Escolha de Armazenamento de Sessão (Auth)

**Status:** Aceito
**Data:** 13 de Maio de 2026
**Decisor:** Claude (AI Agent)

## Contexto
O Supabase Auth utiliza por padrão `localStorage` para persistir o token JWT no navegador. A auditoria de segurança (Dimensão 2) sinalizou que esta abordagem não é 100% imune a ataques de XSS, sugerindo o uso de `CookieStorage` com flag `httpOnly`.

## Decisão
Decidimos manter o uso de `localStorage` com a configuração nativa do Supabase client, mas reforçar a segurança através de outras camadas.

## Consequências
- **Vantagem:** Compatibilidade total com o ecossistema Lovable e Supabase sem necessidade de um proxy intermediário complexo para gerenciar cookies.
- **Mitigação:** Implementamos uma **CSP (Content Security Policy) Estrita** no `index.html` para impedir a execução de scripts maliciosos (XSS) que poderiam tentar ler o `localStorage`.
- **Rastreabilidade:** Adicionamos monitoramento de "Novos Dispositivos" e logs de tentativas de login para identificar acessos suspeitos mesmo se o token for comprometido.
