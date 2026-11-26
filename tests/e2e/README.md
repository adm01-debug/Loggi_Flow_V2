# Testes de ponta a ponta (E2E)

Suites que exercitam o produto real (`LogiFlow`) no navegador. Foram reescritas em 26/11/2026
(etapa 283 do plano de QA): ate entao as duas suites testavam um app que **nao existe**.

## Como rodar

```bash
E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e -- --project=chromium
```

- `playwright.config.ts` sobe `npm run dev -- --port 8099 --strictPort` e usa
  `baseURL=http://127.0.0.1:8099`. **Nao** rode com a porta 8080: ela e a porta padrao do
  `vite.config.ts` e, se estiver ocupada por outro projeto da mesma maquina, o
  `reuseExistingServer` faz o Playwright testar o app errado. Foi exatamente o que aconteceu antes
  (havia um WordPress de outro produto servindo a 8080 e as suites "passavam" contra ele).
  `--strictPort` faz o Vite falhar alto em vez de escolher outra porta.
- Projetos: `chromium`, `firefox`, `webkit`, `mobile-chrome`. Sem CI, so o que for pedido em
  `--project` roda.
- Relatorio HTML em `playwright-report/` (nao versionado).

## O que cada suite exige

| Suite                    | O que faz                                                                                                                                                                                                                                         | Precisa de login? |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `critical-paths.spec.ts` | `/coletas` sem sessao redireciona para `/auth` com `#login-email` visivel; login real chega na home com `#main-navigation` e sem Error Boundary; `/coletas`, `/transportadoras`, `/despachos` e `/configuracoes` abrem sem cair no Error Boundary | 2 de 3 testes     |
| `dashboard.spec.ts`      | home autenticada com titulo contendo `LogiFlow` e `#main-navigation`; rota inexistente mostra `404`; formulario de login em viewport 375x667                                                                                                      | 1 de 3 testes     |

`tests/e2e/helpers.ts` centraliza tudo: le `E2E_EMAIL`/`E2E_PASSWORD`, falha com mensagem explicita
quando faltam (`exigirCredenciais()`), faz o login de verdade (`autenticar()`) e exporta o texto do
Error Boundary (`FALHA_CRITICA`) usado no assert de "a tela nao quebrou".

Seletores usados (todos do produto, nenhum inventado): `#login-email` e `#login-password`
(`src/pages/auth/AuthFormPanel.tsx`), `#main-navigation` (`src/layouts/MainLayout.tsx` - ha dois
`<aside>` na pagina, por isso o id e obrigatorio). Titulo da home: `LogiFlow | Inteligencia
Logistica de Elite`.

## Credenciais

Usuario dedicado: **`e2e@promobrindes.com.br`** (id `012ccf44-a276-49d4-b580-72d46942308d`,
papel `user` em `public.user_roles`). As credenciais vivem **somente** nos secrets do repositorio
(`E2E_EMAIL`, `E2E_PASSWORD`) e em variavel de ambiente local. Nunca no codigo.

Rotacao de senha (a senha nunca aparece em log; o comando abaixo grava em `/tmp/e2e_pw`):

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "host=aws-0-us-east-2.pooler.supabase.com port=5432 user=postgres.jvfhclubfpxrtrrazrgr dbname=postgres sslmode=require" -c "update auth.users set encrypted_password = extensions.crypt('$PG_NOVA', extensions.gen_salt('bf')) where email = 'e2e@promobrindes.com.br';"
```

O conninfo **precisa** estar entre aspas, senao o psql ignora `user=`/`dbname=`.

Historico: a suite antiga tinha `admin@nexus.ai` com senha fixa no codigo. Essa conta nunca existiu
no banco de producao `jvfhclubfpxrtrrazrgr` - por isso o cenario de login falhava em toda execucao.

## Limpeza

A suite e somente leitura em relacao aos dados do produto (navega e verifica tela), com uma excecao
a evitar: nao exercite o botao **Nexus Blast** em producao. Ele dispara integracoes reais
(Lalamove, Rodonaves, Melhor Envio) e cria linhas em `cotacoes_multicanal`.

`cotacoes_multicanal` nao tem coluna `deleted_at`: linha de teste criada a mao sai com `delete`.

```sql
delete from public.cotacoes_multicanal where id = '<id-criado-no-teste>';
```

## Por que nao rodam na CI

`vitest.config.ts` exclui `tests/e2e` (o Playwright tem runner proprio). Um workflow dedicado
(`.github/workflows/e2e.yml`) e a etapa 283 propriamente dita: ele precisa de `E2E_EMAIL`,
`E2E_PASSWORD` e das chaves publicas do Supabase no ambiente. Como mexe em
`.github/workflows/`, entra pela regra 8 do fluxo do projeto (PR aberta aguardando autorizacao).

Nao existe staging: a suite roda contra producao. O login cria sessao e atualiza
`last_sign_in_at` do usuario `e2e@promobrindes.com.br`; nada mais e escrito.
