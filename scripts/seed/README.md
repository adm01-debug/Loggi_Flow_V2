# scripts/seed — teste do seed do banco

O seed em si é `scripts/seed-database.ts` (`npm run seed`); fica na raiz de `scripts/` por histórico. Aqui
mora o teste dele.

## O que o seed faz

Grava, com a **service role key**, dados fictícios para desenvolvimento, demo e para o usuário de teste do
E2E: 4 usuários (`admin@loggiflow.com.br` + `user1..3`), 10 clientes, 10 fornecedores, 8 transportadoras,
12 coletas, 15 entregas, ocorrências, cotações, conquistas, recompensas, conciliações, notificações e
placeholders de segurança (18 tabelas).

- **Só acrescenta o que falta.** Cada linha tem chave fixa (CNPJ `99.xxx.xxx/0001-00`, `SEED-COL-001`,
  `SEED-ENT-001`, `code`, `name`…) e só entra se ainda não existir. Nada é apagado; linha existente não é
  alterada — exceto `profiles`, `user_roles` e `user_levels` dos 4 usuários de seed (upsert).
- **Sem transação** (PostgREST): se falhar no meio, o que entrou fica. Corrija e rode de novo.
- **Qualquer erro encerra com código 1** dizendo a tabela; o resumo final traz a contagem real
  (`novo(s)` / `já existia(m)`).

## Como rodar

```sh
npm run seed -- --dry-run                      # mostra o plano; não exige chave e não faz requisição
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed
```

| Variável                                | Uso                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `SUPABASE_URL` (ou `VITE_SUPABASE_URL`) | banco de destino. **Não há padrão**; se as duas existirem e forem diferentes, o seed recusa |
| `SUPABASE_SERVICE_ROLE_KEY`             | chave admin — só em variável de ambiente local, nunca em arquivo versionado                 |
| `SEED_PASSWORD`                         | senha dos usuários de seed (padrão de desenvolvimento: a que está no script)                |
| `SEED_TIMEOUT_MS`                       | limite por requisição (padrão 30000)                                                        |

### Produção

Não existe staging: o banco oficial `jvfhclubfpxrtrrazrgr` é produção. Apontado para ele, o seed só roda com
`--confirmar-producao` **e** `SEED_PASSWORD` própria (a senha padrão está no repositório e criaria um admin
de senha conhecida). `hgicfqjayrjurivtygqf` (origem do cutover) é sempre recusado.

```sh
SUPABASE_URL=https://jvfhclubfpxrtrrazrgr.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
  SEED_PASSWORD='...' npm run seed -- --confirmar-producao
```

Isso grava clientes, entregas e usuários fictícios no banco real — é decisão do dono.

## Teste

```sh
node --test scripts/seed/seed-database.unit.mjs
```

Roda o seed como subprocesso contra um servidor HTTP local que imita GoTrue admin + PostgREST e recusa o
que o banco recusaria, usando `src/integrations/supabase/types.ts` como schema (tabela/coluna inexistente,
coluna obrigatória ausente, enum inválido) mais as UNIQUE/CHECK das migrations (`ON CONFLICT` sem UNIQUE,
CHECK violado, FK). Todo subprocesso sobe com uma sentinela que bloqueia e anota `fetch` para fora de
`127.0.0.1` — o teste nunca toca em banco real, nem quando exercita a URL de produção.

`SEED_SCRIPT=caminho/outro-seed.ts node --test ...` roda a mesma bateria contra outra versão do seed.

Sem secrets. O que o teste **não** cobre: constraints que só existem no banco ao vivo (as UNIQUE/CHECK da
fixture vêm de `supabase/migrations/`, que é histórico) — em especial o vocabulário de
`geo_blocking_rules.rule_type`, que não está em nenhuma migration; por isso essa tabela é a última a ser
semeada.
