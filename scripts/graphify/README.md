# scripts/graphify — grafo de código (graphify)

Grafo de dependências/chamadas do repo, para o agente perguntar "quem chama isso?" antes de sair grepando.

## Como gerar

```sh
npm ci              # instala o husky (script prepare)
npm run graph:setup # instala o graphify e gera graphify-out/
```

Precisa de `uv` (recomendado) ou `pipx`. Versão fixada em `GRAPHIFY_VERSION` dentro do `setup.sh` — essa
linha é a **fonte única** da versão: `.claude/hooks/session-start.sh` lê o número dela com `sed`, então não
mude o formato da linha.

O `setup.sh` acha a raiz do repo pelo próprio caminho, então funciona de qualquer pasta. Se o `graphify`
já está na versão fixada ele não reinstala (rodar de novo não precisa de rede nem de `uv`/`pipx`); depois
confere o husky (`core.hooksPath`), instala os hooks e roda `graphify update .`. Falha de instalação ou
husky ausente para o script antes de tocar em hook ou grafo.

Teste do `setup.sh` (offline; `uv`, `pipx`, `graphify` e `husky` são stubs, nada é instalado):

```sh
node --test scripts/graphify/setup.unit.mjs
```

## Como usar

```sh
graphify query "quem chama useGamification?"
graphify path "src/pages/Coletas.tsx" "supabase/functions/lalamove-api"
graphify explain "cotação de frete"
graphify update .   # só AST, sem custo de API — rode depois de alterar código
```

`graphify-out/GRAPH_REPORT.md` é relatório de revisão ampla, não leitura de rotina. Frescura: compare
`git rev-parse --short HEAD` com a linha "Built from commit" do report.

## O que fica fora do Git

`graphify-out/` e os hooks que o `graphify hook install` grava (`.husky/post-commit`,
`.husky/post-checkout`) estão no `.gitignore`: eles carregam o caminho do Python da máquina. Cada clone
gera o seu.

## Em sessão de nuvem

`.claude/hooks/session-start.sh` instala o graphify e gera o grafo em segundo plano quando
`CLAUDE_CODE_REMOTE=true` (log em `graphify-out/.session-start.log`, lock para não rodar duas vezes, pula se
o grafo já é do commit atual). Os hooks `PreToolUse` de `.claude/settings.json` chamam `graphify hook-guard`
e saem em silêncio onde o binário não existe — nenhum deles é obrigatório para trabalhar no repo.

## O que NÃO entra no grafo

`.graphifyignore` tira `.env*`, chaves, `dist/`, `coverage/`, lockfiles e os dumps/manifestos grandes de
auditoria — ruído que polui a busca e, no caso de segredo, nem deveria passar perto de ferramenta externa.
