#!/usr/bin/env bash
# Instala o graphify (grafo de conhecimento do código) e o configura neste clone.
# Uso: npm run graph:setup   (Linux, macOS ou WSL; precisa de uv ou pipx)
set -euo pipefail

GRAPHIFY_VERSION="${GRAPHIFY_VERSION:-0.9.68}"
PKG="graphifyy[sql]==${GRAPHIFY_VERSION}"

# Raiz a partir do próprio script, não do cwd: em `cd "$(git rev-parse --show-toplevel)"` a falha do
# git não aborta (set -e não vale para $(...) em argumento) e `cd ""` deixava o resto rodar na pasta
# corrente — ou no repo errado, se o cwd fosse outro clone.
RAIZ="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)" || {
  echo "graphify: scripts/graphify/setup.sh precisa estar dentro de um clone git do repo." >&2
  exit 1
}
cd "$RAIZ"

# Já está na versão fixada: não reinstala (mesmo critério do session-start.sh) — rodar de novo
# não depende de rede nem de uv/pipx.
if ! graphify --version 2>/dev/null | grep -qx "graphify ${GRAPHIFY_VERSION}"; then
  if command -v uv >/dev/null 2>&1; then
    uv tool install --force "$PKG"
  elif command -v pipx >/dev/null 2>&1; then
    pipx install --force "$PKG"
  else
    echo "graphify: instale o uv (curl -LsSf https://astral.sh/uv/install.sh | sh)" >&2
    echo "          ou o pipx (sudo apt install pipx) e rode de novo." >&2
    exit 1
  fi

  case ":$PATH:" in
    *":$HOME/.local/bin:"*) ;;
    *) echo "graphify: ~/.local/bin fora do PATH; rode uv tool update-shell (ou pipx ensurepath) e abra outro terminal." >&2
       export PATH="$HOME/.local/bin:$PATH" ;;
  esac
fi
graphify --version

# O husky (script "prepare" do npm install) aponta core.hooksPath para .husky/_; sem isso o git
# ignora os hooks que o graphify grava em .husky/.
if [[ "$(git rev-parse --git-path hooks)" != ".husky/_" ]]; then
  if [[ -x node_modules/.bin/husky ]]; then
    node_modules/.bin/husky
  else
    echo "graphify: rode npm ci antes (instala o husky) e depois npm run graph:setup." >&2
    exit 1
  fi
fi

# post-commit/post-checkout em .husky/ (rebuild em background) + merge driver do graph.json.
graphify hook install

PYTHONHASHSEED=0 graphify update .
