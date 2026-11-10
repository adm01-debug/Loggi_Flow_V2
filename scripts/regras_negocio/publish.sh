#!/usr/bin/env bash
# Publica a saída gerada do contexto (neste repo: docs/contexto/regras) sem nunca escrever na branch padrão.
# Uso standalone; neste repo quem publica é o job `publicar` de .github/workflows/contexto-ia.yml.
# Variáveis:
#   MODE            branch | pr | push (default: branch)
#                   branch = publica em branch derivada BRANCH_OUT (= commit de origem + 1 commit, force-push com lease),
#                            preservando as pastas de outros produtores (KEEP_DIRS) e regenerando o índice (INDEX_CMD).
#                            É o desenho para repos com main protegida e vários produtores numa branch só.
#                   pr     = abre/atualiza uma PR a partir de ai-context/sync
#                   push   = commit direto em BRANCH (cai para pr se rejeitado e gh existir); recusado quando BRANCH é
#                            main/master/develop ou a branch padrão do remoto
#   BRANCH          branch alvo de push/pr (default: branch atual)
#   OUT_DIR         pasta gerada, com o manifest.json do gerador (default: docs/contexto/regras)
#   BRANCH_OUT      branch derivada (default: contexto); nunca a branch padrão nem a de origem
#   KEEP_DIRS       pastas de outros produtores a preservar na branch derivada, separadas por espaço
#   INDEX_CMD       comando que (re)gera o índice único depois de montar a branch (opcional)
#   PUSH_URL        URL de push com token (CI com persist-credentials: false), ex.: https://x-access-token:$TOKEN@github.com/o/r.git
#   GEN_CMD         comando para regenerar após rebase (default: python3 scripts/regras_negocio/generate.py --repo . --out $OUT_DIR --profile regras --no-pointer)
#   POINTER_FILES   arquivos da raiz que o gerador também atualiza e devem ir junto (default: nenhum, porque o
#                   gerador roda com --no-pointer). Ex.: "CLAUDE.md AGENTS.md" — a versão local deles é publicada.
#   DRY_RUN=1       monta tudo e mostra o que seria publicado; não faz push nem PR
#   GIT_USER_NAME / GIT_USER_EMAIL   autor dos commits gerados (vale só para esta execução; não altera a config do repo)
# Exit: 0 = publicado ou nada a publicar; 1 = falha de publicação; 2 = uso inválido (nada foi tocado).
set -euo pipefail
OUT_DIR="${OUT_DIR:-docs/contexto/regras}"
OUT_DIR="${OUT_DIR%/}"
MODE="${MODE:-branch}"
GEN_CMD="${GEN_CMD:-python3 scripts/regras_negocio/generate.py --repo . --out $OUT_DIR --profile regras --no-pointer}"
PR_BRANCH="ai-context/sync"
MSG="chore(ai-context): atualiza contexto para agentes [skip ci]"

fail_usage() { echo "ERRO: $1 Nada foi publicado." >&2; exit 2; }

case "$MODE" in
  branch|pr|push) ;;
  *) fail_usage "MODE=$MODE inválido (use branch, pr ou push)." ;;
esac
git rev-parse --git-dir >/dev/null 2>&1 || fail_usage "o diretório atual não é um repositório git."
cd "$(git rev-parse --show-toplevel)"
BRANCH="${BRANCH:-$(git symbolic-ref -q --short HEAD || true)}"

# Branch em que este utilitário nunca escreve direto: nomes convencionais + a padrão do remoto, quando conhecida.
is_protected_branch() {
  local default_branch
  default_branch=$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null || true)
  case "$1" in ""|main|master|develop|"${default_branch#origin/}") return 0 ;; esac
  return 1
}

# A identidade vale só para os commits desta execução: `git config` aqui trocaria o autor dos commits de quem roda.
export GIT_AUTHOR_NAME="${GIT_USER_NAME:-ai-context-bot}"
export GIT_AUTHOR_EMAIL="${GIT_USER_EMAIL:-ai-context-bot@users.noreply.github.com}"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"
export HUSKY=0   # commit gerado não passa pelo lint-staged do pre-commit (mesmo que o job `publicar` do workflow faz)

PUSH_ERR=$(mktemp)
RESTORE_REF=""
OURS=""
cleanup() {
  rm -f "$PUSH_ERR"
  if [ -n "$RESTORE_REF" ]; then
    git checkout -q "$RESTORE_REF" 2>/dev/null || true   # sempre volta para a branch de origem, mesmo em erro
    if [ -n "$OURS" ]; then
      # devolve a saída gerada ao checkout como estava (fora do índice): ela só é versionada na branch derivada
      git checkout -q "$OURS" -- "$OUT_DIR" 2>/dev/null && git reset -q -- "$OUT_DIR" 2>/dev/null || true
    fi
  fi
}
trap cleanup EXIT

# URL de push pode carregar token: nunca ecoar credencial.
show_push_error() { sed -E 's#(https?://)[^/@[:space:]]+@#\1***@#g' "$PUSH_ERR" >&2; }

stage() {
  local f
  git add -f -A "$OUT_DIR"   # -f: a saída gerada pode estar no .gitignore da branch padrão (versionada só na branch derivada)
  for f in ${POINTER_FILES:-}; do if [ -f "$f" ]; then git add "$f"; fi; done
}

assert_no_foreign_staged_changes() {
  local path
  while IFS= read -r -d '' path; do
    case " ${POINTER_FILES:-} " in *" $path "*) continue ;; esac
    case "$path" in
      "$OUT_DIR"|"$OUT_DIR"/*) ;;
      *)
        echo "ERRO: há alteração staged fora da saída gerada: $path. Nada foi publicado." >&2
        return 1
        ;;
    esac
  done < <(git diff --cached --name-only -z)
}

# Sem a saída do gerador não há o que publicar — e publicar a pasta vazia apagaria a publicação anterior.
if [ ! -f "$OUT_DIR/manifest.json" ]; then
  echo "ERRO: $OUT_DIR/manifest.json não existe — rode o gerador antes ($GEN_CMD). Nada foi publicado." >&2; exit 1
fi
assert_no_foreign_staged_changes
if [ "$MODE" = "branch" ]; then
  # Branch derivada = commit de origem + 1 commit. Nunca toca a branch de origem: trabalha em HEAD destacado.
  BRANCH_OUT="${BRANCH_OUT:-contexto}"
  SRC=$(git rev-parse HEAD)
  SRC_REF=$(git symbolic-ref -q --short HEAD || echo "$SRC")
  if is_protected_branch "$BRANCH_OUT" || [ "$BRANCH_OUT" = "$SRC_REF" ]; then
    fail_usage "BRANCH_OUT=$BRANCH_OUT é branch padrão/de origem; a branch derivada é sobrescrita com force-push."
  fi
  RESTORE_REF="$SRC_REF"
  git checkout -q --detach "$SRC"
  stage
  git commit -q -m "$MSG" --allow-empty
  OURS=$(git rev-parse HEAD)
  REMOTE="${PUSH_URL:-origin}"   # lê e escreve pelo mesmo caminho: com persist-credentials: false só a URL com token enxerga repo privado
  for attempt in 1 2 3; do
    # FETCH_HEAD, não origin/$BRANCH_OUT: em clone --single-branch (ou CI raso) a ref de rastreio não existe.
    OLD=""
    if git fetch -q "$REMOTE" "refs/heads/$BRANCH_OUT" 2>"$PUSH_ERR"; then
      OLD=$(git rev-parse FETCH_HEAD)
    elif git ls-remote --exit-code --heads "$REMOTE" "$BRANCH_OUT" >/dev/null 2>&1 || [ "$?" != 2 ]; then
      # só "a branch ainda não existe" (ls-remote = 2) é primeira publicação; falha de rede/credencial não pode
      # virar publicação do zero, que apagaria as pastas dos outros produtores
      echo "ERRO: não foi possível ler $BRANCH_OUT no remoto:" >&2; show_push_error; exit 1
    fi
    git checkout -q --detach "$SRC"
    if [ -n "$OLD" ]; then
      for d in ${KEEP_DIRS:-}; do   # saídas dos outros produtores
        if git cat-file -e "$OLD:$d" 2>/dev/null; then git checkout -q "$OLD" -- "$d"; fi
      done
    fi
    git checkout -q "$OURS" -- "$OUT_DIR"                                                          # a nossa saída
    for f in ${POINTER_FILES:-}; do if git cat-file -e "$OURS:$f" 2>/dev/null; then git checkout -q "$OURS" -- "$f"; fi; done
    if [ -n "${INDEX_CMD:-}" ]; then
      if ! ( eval "$INDEX_CMD" ); then echo "ERRO: INDEX_CMD falhou. Nada foi publicado." >&2; exit 1; fi
      git add -A "$(dirname "$OUT_DIR")"
    fi
    git add -f -A "$OUT_DIR"
    for d in ${KEEP_DIRS:-}; do if [ -e "$d" ]; then git add -f -A "$d"; fi; done
    if [ -n "$OLD" ] && git diff --quiet --cached "$OLD" -- && [ "$(git rev-parse -q --verify "$OLD^" 2>/dev/null || true)" = "$SRC" ]; then
      echo "branch $BRANCH_OUT já reflete este estado — nada a publicar"; exit 0
    fi
    git commit -q -m "$MSG"
    if [ "${DRY_RUN:-0}" = 1 ]; then
      echo "DRY_RUN: publicaria $(git rev-parse --short HEAD) em $BRANCH_OUT (hoje: ${OLD:-inexistente}); arquivos:"
      git diff --stat "${OLD:-$(git hash-object -t tree /dev/null)}" HEAD -- "$OUT_DIR" ${KEEP_DIRS:-} | tail -n 20
      exit 0
    fi
    # Lease no commit que acabamos de ler: se outro produtor publicou nesse meio-tempo, o push falha em vez de
    # apagar a pasta dele, e a branch é remontada sobre o estado novo.
    if git push -q "--force-with-lease=refs/heads/$BRANCH_OUT:$OLD" "$REMOTE" "HEAD:refs/heads/$BRANCH_OUT" 2>"$PUSH_ERR"; then
      echo "publicado em $BRANCH_OUT ($(git rev-parse --short HEAD) = $SRC_REF + 1 commit)"
      exit 0
    fi
    echo "push em $BRANCH_OUT falhou (tentativa $attempt de 3):" >&2; show_push_error
  done
  echo "ERRO: não foi possível publicar em $BRANCH_OUT após 3 tentativas. A branch remota não foi alterada por este script." >&2
  exit 1
fi

if git check-ignore -q "$OUT_DIR"; then
  echo "ERRO: $OUT_DIR está no .gitignore — os docs nunca seriam commitados em $BRANCH. Remova a regra ou use MODE=branch." >&2; exit 1
fi
if [ -z "$BRANCH" ]; then
  fail_usage "HEAD destacado: informe BRANCH para MODE=$MODE."
fi
if [ "$MODE" = "push" ] && is_protected_branch "$BRANCH"; then
  fail_usage "MODE=push não escreve em $BRANCH (branch padrão/protegida); use MODE=branch (branch derivada) ou MODE=pr."
fi
stage
if git diff --cached --quiet; then
  echo "docs já atualizados — nada a commitar"; exit 0
fi
if [ "${DRY_RUN:-0}" = 1 ]; then
  echo "DRY_RUN: commitaria em $BRANCH (MODE=$MODE):"; git diff --cached --stat | tail -n 20
  git reset -q -- "$OUT_DIR" ${POINTER_FILES:-}
  exit 0
fi
git commit -q -m "$MSG"

# O SHA muda no rebase, mas estes metadados de autoria são preservados. Eles
# distinguem o commit gerado do novo topo da origem quando o rebase descarta
# nossa alteração por ela já ter sido aplicada por outro produtor.
remember_generated_head() {
  GENERATED_COMMIT=$(git rev-parse HEAD)
  GENERATED_AUTHOR_EMAIL=$(git show -s --format=%ae HEAD)
  GENERATED_AUTHOR_DATE=$(git show -s --format=%aI HEAD)
}

generated_commit_is_head() {
  [ "$(git show -s --format=%B HEAD)" = "$MSG" ] &&
    [ "$(git show -s --format=%ae HEAD)" = "$GENERATED_AUTHOR_EMAIL" ] &&
    [ "$(git show -s --format=%aI HEAD)" = "$GENERATED_AUTHOR_DATE" ]
}

generated_output_conflict_is_recoverable() {
  local conflicted=0 path
  [ "$(git rev-parse -q --verify REBASE_HEAD 2>/dev/null || true)" = "$GENERATED_COMMIT" ] || return 1
  while IFS= read -r -d '' path; do
    conflicted=1
    case "$path" in
      "$OUT_DIR"|"$OUT_DIR"/*) ;;
      *) return 1 ;;
    esac
  done < <(git diff --name-only --diff-filter=U -z)
  [ "$conflicted" = 1 ]
}

discard_generated_output_commit() {
  local path
  local -a generated_paths=()
  while IFS= read -r -d '' path; do
    case "$path" in "$OUT_DIR"|"$OUT_DIR"/*) generated_paths+=("$path");; esac
  done < <(git diff-tree --no-commit-id --name-only -z -r "$GENERATED_COMMIT")
  git reset -q --mixed "$GENERATED_COMMIT^"
  for path in "${generated_paths[@]}"; do
    if git cat-file -e "HEAD:$path" 2>/dev/null; then
      git restore --source=HEAD --staged --worktree -- "$path"
    else
      rm -f -- "$path"
    fi
  done
}

remember_generated_head

if [ "$MODE" = "push" ]; then
  for attempt in 1 2 3; do
    if git push -q origin "HEAD:refs/heads/$BRANCH" 2>"$PUSH_ERR"; then
      echo "contexto publicado em $(git rev-parse --short HEAD) ($BRANCH)"; exit 0
    fi
    if grep -qiE "protected|GH006|pre-receive|required status|review|rule" "$PUSH_ERR"; then
      echo "push rejeitado por proteção de branch:"; show_push_error
      MODE="pr"; break
    fi
    echo "push falhou (tentativa $attempt) — sincronizando com origin/$BRANCH e regenerando"
    git fetch -q origin "$BRANCH"
    # Reaplica somente o commit gerado sobre a origem. --autostash preserva alterações
    # locais rastreadas; arquivos não rastreados permanecem intocados. Nunca use reset
    # destrutivo aqui: este utilitário também pode ser executado fora de um runner efêmero.
    if ! git rebase --autostash "origin/$BRANCH"; then
      if generated_output_conflict_is_recoverable; then
        git rebase --abort >/dev/null 2>&1 || true
        discard_generated_output_commit
        if ! git rebase --autostash "origin/$BRANCH"; then
          git rebase --abort >/dev/null 2>&1 || true
          echo "ERRO: não foi possível preservar os commits locais antes de regenerar." >&2
          exit 1
        fi
      else
        git rebase --abort >/dev/null 2>&1 || true
        echo "ERRO: conflito fora da saída gerada; o checkout local foi preservado." >&2
        exit 1
      fi
    fi
    # Um rebase bem-sucedido troca o SHA do commit sobrevivente mesmo quando a
    # regeneração seguinte não cria diff. Não atualize a identidade se ele foi
    # descartado: nesse caso HEAD pertence à origem ou ao usuário.
    if generated_commit_is_head; then remember_generated_head; fi
    if ! ( eval "$GEN_CMD --force" ); then
      echo "ERRO: GEN_CMD falhou ao regenerar após o rebase ($GEN_CMD --force). Nada foi publicado; o commit local foi mantido." >&2
      exit 1
    fi
    stage
    if ! git diff --cached --quiet; then
      if generated_commit_is_head; then
        git commit -q --amend --no-edit
      else
        # O rebase pode descartar o commit gerado como patch equivalente. Nesse
        # caso HEAD pertence à origem (ou ao usuário) e jamais deve ser emendado.
        git commit -q -m "$MSG"
      fi
      remember_generated_head
    fi
  done
  if [ "$MODE" != "pr" ]; then
    echo "ERRO: não foi possível publicar após 3 tentativas" >&2; show_push_error; exit 1
  fi
fi

# ---- modo PR (branch protegida ou MODE=pr)
if ! command -v gh >/dev/null; then
  echo "ERRO: branch protegida e gh CLI ausente — não há como abrir PR" >&2; exit 1
fi
git push -q --force origin "HEAD:refs/heads/$PR_BRANCH"
if gh pr list --head "$PR_BRANCH" --base "$BRANCH" --state open --json number -q '.[0].number' | grep -q .; then
  echo "PR existente atualizada (branch $PR_BRANCH)"
else
  gh pr create --base "$BRANCH" --head "$PR_BRANCH" --title "chore(ai-context): atualiza contexto para agentes" \
    --body "Atualização automática de \`$OUT_DIR\` pelo AI Context Sync. Mergeie para manter os agentes com contexto atual." >/dev/null
  echo "PR aberta (branch $PR_BRANCH → $BRANCH)"
fi
