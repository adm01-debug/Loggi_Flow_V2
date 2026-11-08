# scripts/ci — guardas do CI

## `check-claude-md-integrity.mjs`

Impede que as instruções para agentes sejam apagadas ou esvaziadas por uma sessão paralela (vários agentes
escrevem neste repo ao mesmo tempo; `github_push_files` sobrescreve arquivo inteiro).

Verifica, nesta ordem:

1. `AGENTS.md` existe;
2. os 8 cabeçalhos obrigatórios estão presentes: `## Postura`, `## Bugs e funcionalidades`,
   `## Comunicação`, `## Fluxo Git`, `## Banco`, `## Serviços`, `## Stack e comandos`,
   `## Grafo de código`;
3. o conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` não encolheu mais de **30%** em bytes contra a
   base;
4. nenhum arquivo vigiado (o `AGENTS.md` e cada `docs/agentes/*.md` que exista na base) sumiu ou encolheu
   mais de **50%** — o limiar do conjunto sozinho não pega o esvaziamento de um arquivo só.

`CLAUDE.md` conta no total, mas não é vigiado individualmente: por design ele é só `@AGENTS.md`.

### Como rodar

```sh
# local, comparando com o HEAD
node scripts/ci/check-claude-md-integrity.mjs

# como no CI, comparando com a main remota
git fetch --no-tags --depth=1 origin main
CLAUDE_MD_BASE=FETCH_HEAD node scripts/ci/check-claude-md-integrity.mjs
```

Sem dependências (Node puro). No CI roda no job `Agents Docs Integrity` do `.github/workflows/ci.yml`.

### Quando ele falha de verdade

- Você reescreveu o `AGENTS.md` e removeu uma seção obrigatória → devolva o cabeçalho (a seção pode ser
  curta, mas tem de existir).
- Você está **movendo** conteúdo de `AGENTS.md` para `docs/agentes/` → o conjunto é medido junto, então
  mover não dispara; só dispara se o total realmente encolher.
- Encolhimento legítimo e desejado (limpeza grande aprovada pelo dono) → faça em PR própria, com o motivo no
  corpo, e o dono decide; não contorne o guard.
