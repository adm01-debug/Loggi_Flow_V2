# Testes de ponta a ponta (E2E)

Duas suítes versionadas que exercitam o produto como o usuário o usa. **Nenhuma das duas roda na
CI** — e isso é deliberado, não esquecimento. Este arquivo registra o estado real para que elas
saiam do limbo (etapa 283 do plano de QA).

## Como rodar

```bash
npm run test:e2e -- --project=chromium
```

`playwright.config.ts` sobe `npm run dev` em `http://localhost:8080` (`baseURL` das duas suítes), roda
também em `firefox`, `webkit` e `mobile-chrome`, e gera relatório HTML.

## O que cada suíte exige

| Suíte | O que procura em tela | Precisa de login? |
| --- | --- | --- |
| `critical-paths.spec.ts` | login → `/dashboard` → texto "Visão Geral" → navega por Coletas, Fretes, Analytics e Configurações sem cair no Error Boundary; depois viewport 375×667 em `/dashboard` exigindo `nav` visível | **Sim** |
| `dashboard.spec.ts` | `<h1>` ou `.logo-text` na home, clica nos itens de menu que estiverem visíveis e valida que `/invalid-route-nexus` mostra "não encontrada", "erro" ou "404" | Não |

## Credenciais

O cenário de login usa um **usuário semeado**. As credenciais vêm de variável de ambiente;
sem elas o cenário é **pulado** com mensagem explícita:

```bash
E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e -- --project=chromium
```

Antes, o arquivo trazia `admin@nexus.ai` e a senha fixos no código. Essa conta **não existe** no
banco de produção `jvfhclubfpxrtrrazrgr` (consulta a `auth.users` em 25/11/2026: 7 contas, nenhuma
com esse e-mail), então o cenário falhava sempre que a tela de login aparecia.

As contas de teste que existem hoje em produção foram criadas em 18/11/2026 por
`scripts/seed-database.ts`: `admin@loggiflow.com.br` (papéis `admin,user`, último login 19/11/2026)
e `user1@loggiflow.com.br` a `user3@loggiflow.com.br` (papel `user`). A senha **não** está no
repositório: o script usa `SEED_PASSWORD` quando definida, e é ela que vale — a senha padrão
do script foi conferida contra o hash bcrypt guardado em `auth.users` e **não** confere. Quem precisa
rodar a suíte pede a senha a quem executou o seed.

## Por que não rodam na CI

- `vitest.config.ts` exclui `tests/e2e` de propósito — o Playwright tem runner próprio.
- Nenhum workflow chama `npm run test:e2e` e os 10 required checks não incluem estas suítes. Um
  workflow `e2e.yml` existiu e foi removido de propósito (PR #223) por não haver usuário semeado
  nem ambiente de teste.
- Não existe staging: rodar contra produção autentica em produção. A suíte é
  somente leitura (navegação e asserts), mas o login cria sessão e atualiza `last_sign_in_at`.
- `AGENTS.md` já documenta `npm run test:e2e` como execução manual.

## Semear dados de teste

`scripts/seed-database.ts` é idempotente, só acrescenta o que falta, aceita `--dry-run` (imprime o
plano sem fazer nenhuma requisição) e exige `--confirmar-producao` quando a URL é a de
produção. Usa service role key e escreve empresas, transportadoras, cotações, usuários
e veículos fictícios; nada é apagado.

Proposta de usuário dedicado de E2E — depende de aprovação do dono, porque é escrita em
produção: criar `e2e@loggiflow.com.br` com papel `user`, registros prefixados `E2E-` e remoção
lógica por `deleted_at` ao final, conforme `docs/SOFT_DELETE_POLICY.md`. Só depois disso faz sentido um
job de CI — e criar workflow é decisão do dono (Regra 8).
