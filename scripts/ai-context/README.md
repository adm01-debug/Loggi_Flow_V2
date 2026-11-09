# ai-context — contexto de código para agentes de IA

**O que faz:** `gerar.mjs` lê o repositório (zero dependências, Node ≥ 18) e escreve 15 JSONs + `INDEX.md` + `manifest.json`
com rotas, menu, módulos, componentes, hooks, edge functions, banco (migrations/types), testes, CI, scripts,
convenções e baseline. Genérico: React/Next/Vue/Svelte/Nuxt/Remix/Astro, Express/Hono/Fastify/Nest,
FastAPI/Flask/Django, Supabase/Prisma/Drizzle/TypeORM/SQL. Saída determinística (só `manifest.json` tem data).

**Como rodar:** `node scripts/ai-context/gerar.mjs [--root|--repo <dir>] [--out <dir>] [--quiet] [--help]`
(padrão de saída `inventario/ia`, ou `ai-context.config.json → out`, ou env `AI_CONTEXT_DIR`).
`--out` relativo é resolvido a partir da raiz (`--root`), não do diretório atual; `--k=valor` também vale.

**Código de saída:** `0` = contexto escrito (seção que falhou, arquivo/pasta sem permissão de leitura e
`ai-context.config.json` inválido **não** derrubam o run: ficam em `manifest.json → erros`,
`baseline.json → erros_do_gerador` e no aviso do topo do `INDEX.md`); `2` = erro de uso (flag desconhecida,
valor ausente, raiz que não é diretório) — nada é escrito; `1` = falha inesperada (ex.: sem permissão de
escrita na pasta de saída).

**Testes:** `node --test scripts/ai-context/gerar.unit.mjs` (fixtures mínimas, ~6 s, é o que a CI roda antes de
gerar) e `node scripts/ai-context/cenarios.mjs [--only <trecho>] [--keep]` (237 repositórios sintéticos +
fuzz, ~50 s). Os dois rodam offline e limpam o que criam em `os.tmpdir()`.

**Config opcional** (`ai-context.config.json` na raiz): `out`, `skipDirs`, `srcDirs`, `menuFiles`,
`routeFiles`, `aliases`, `typesFile`, `maxFileMB`, `publicacao` (texto do rodapé do `INDEX.md` dizendo
onde o contexto é publicado neste repo; env `AI_CONTEXT_PUBLICACAO` tem precedência). Chave com tipo
errado é ignorada e registrada em `erros`.

**Neste repo:** o workflow `.github/workflows/contexto-ia.yml` roda o gerador a cada push em `main` e a cada
10 min e publica em `docs/contexto/codigo/` na branch `contexto` (índice único em `docs/contexto/00-INDEX.md`).

**Determinismo:** o mesmo commit gera os mesmos bytes, qualquer que seja o cwd, o locale (`LC_ALL`) ou a
ordem do filesystem; só `manifest.json → gerado_em` muda. As janelas de 7/30/90 dias do `baseline.json`
contam a partir da data do HEAD (não do relógio) e dependem da profundidade do clone (`fetch-depth`).

**Secrets:** nenhum (lê só arquivos do repo e `git log`).

## Alcance dos alertas

- O schema reconstruído ignora os diretórios `_foreign/` e `_superseded/`: são histórico, não migrations
  vigentes. Os demais SQLs e diretórios de migrations continuam sendo considerados.
- Alertas de tabela/RPC/edge inexistente e o mapa de chamadores da aplicação excluem testes, stories e
  raízes de ferramentas/documentação (`scripts/`, `bin/`, `tools/`, `.github/`, `docs/`, `inventario/`,
  `analise/`, `examples/`, `samples/`, inclusive sob pacotes de monorepo). Esses arquivos continuam nos
  inventários próprios. Uma raiz desse tipo que contenha aplicação pode ser declarada em `srcDirs`.
- A mesma régua vale para os fatos "da aplicação": rotas HTTP de backend, hooks, feature flags, papéis,
  hosts externos, canais realtime, uso de bucket e tabelas vindas de ORM (Drizzle/TypeORM/modelos Python)
  só contam em código de aplicação. Fixture dentro de `scripts/` ou de um `*.unit.mjs` não vira rota nem
  tabela.
- Teste é o que casa `*.test|spec|e2e|contract|unit|fixture.*`, `*_test.ts` (padrão Deno), `test_*.py`,
  `*_test.py` ou mora em `__tests__/`, `tests/`, `fixtures/`, `e2e/`. Teste não entra em `arquivos`,
  `linhas` nem `env` da edge function; conta em `testes`.
- `rotas.json → protegida` olha o que **envolve** a tela (`<ProtectedRoute><X/></ProtectedRoute>`), um
  guarda sozinho como `element` (com ou sem `path`) e a herança do pai. A tela não se protege pelo nome:
  `<Auth/>` é a página de login. É leitura estática do roteador — a checagem real é do componente-guarda e
  da RLS. O catch-all `path="*"` sai normalizado como `/*`.
- `edge-functions.json → env` é o que os arquivos da função leem com `Deno.env.get('X')`;
  `env_via_shared` é o que os helpers importados de fora da pasta (`_shared/`) leem. Só nomes, nunca
  valores; `Deno.env.get(variavel)` (nome dinâmico) não é resolvido.
- `supabase.storage.from('x')` é bucket, não tabela. Função, view e enum fora de `public` saem como
  `schema.nome`. `cron_jobs → chama_edge` vale para a última definição do job.
- `scripts.json → workflows` lista os workflows cujo YAML cita o caminho do script fora de comentário
  (`node x`, `psql -f x`, `./x`); script chamado só por `npm run` aparece em `npm_scripts`.
  `ferramentas.json → workflows[].permissoes` traz só o bloco `permissions:` do topo, não o de cada job.
- `stack.gerenciador_pacotes`: com mais de um lockfile vale `package.json → packageManager` e, sem ele, o
  gerenciador que os workflows instalam (`npm ci`, `bun install`…).
- As relações são extraídas estaticamente: referência encontrada não prova execução; ausência de
  chamador no mapa não prova que uma edge não tenha consumidor externo. Marcador de pendência
  (`TODO`/`FIXME`/`HACK`/`XXX`) só conta dentro de comentário.
