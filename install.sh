#!/usr/bin/env bash
set -euo pipefail

# Install the frontend-design-skills agent skill.
#
# Local install:
#   ./install.sh --project [target-dir]   copy into <target>/.opencode/skills
#   ./install.sh --global                 copy into ~/.config/opencode/skills
#   ./install.sh --link --project [dir]   symlink instead of copy
#
# Remote install through the Skills CLI:
#   ./install.sh --remote                 npx skills add <repo> --skill <name>
#   ./install.sh --remote --global        install for the current user
#   ./install.sh --remote --agent opencode --agent claude-code
#   ./install.sh --list                   list the skills published by this repo
#
# Environment overrides:
#   FDS_REPO    repository URL (default: https://github.com/rafidone/frontend-design-skills)
#   FDS_SKILL   skill name     (default: frontend-design-skills)
#   FDS_AGENT   default agent  (default: opencode)
#
# The default project target is the current directory.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="${FDS_SKILL:-frontend-design-skills}"
REPO_URL="${FDS_REPO:-https://github.com/rafidone/frontend-design-skills}"
SKILL_SRC="$ROOT/skills/$SKILL_NAME"

MODE="copy"
SCOPE=""
TARGET=""
REMOTE="0"
LIST="0"
declare -a AGENTS=()

usage() {
  sed -n '3,23p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
}

require_node() {
  if command -v node >/dev/null 2>&1; then
    NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
    if ((NODE_MAJOR < 22)); then
      echo "install: Node 22 or newer is required (found $(node -v))" >&2
      exit 1
    fi
  else
    echo "install: Node 22 or newer is required" >&2
    exit 1
  fi
}

while (($#)); do
  case "$1" in
    --project)
      SCOPE="project"; shift
      if [[ $# -gt 0 && "$1" != --* ]]; then TARGET="$1"; shift; fi
      ;;
    --global) SCOPE="global"; shift ;;
    --link) MODE="link"; shift ;;
    --remote) REMOTE="1"; shift ;;
    --list) LIST="1"; shift ;;
    --agent)
      shift
      [[ $# -gt 0 && "$1" != --* ]] || { echo "install: --agent needs a value" >&2; usage; }
      AGENTS+=("$1"); shift
      ;;
    -h|--help) usage ;;
    *) echo "install: unknown option $1" >&2; usage ;;
  esac
done

require_node

# ---------------------------------------------------------------------------
# Remote install / discovery through the Skills CLI.
# ---------------------------------------------------------------------------
if [[ "$REMOTE" == "1" || "$LIST" == "1" ]]; then
  command -v npx >/dev/null 2>&1 || { echo "install: npx is required for --remote/--list" >&2; exit 1; }

  ARGS=(skills add "$REPO_URL")

  if [[ "$LIST" == "1" ]]; then
    exec npx -y "${ARGS[@]}" --list
  fi

  ARGS+=(--skill "$SKILL_NAME")
  if ((${#AGENTS[@]} == 0)); then
    AGENTS=("${FDS_AGENT:-opencode}")
  fi
  for agent in "${AGENTS[@]}"; do ARGS+=(--agent "$agent"); done
  [[ "$SCOPE" == "global" ]] && ARGS+=(--global)
  ARGS+=(-y)

  echo "install: npx ${ARGS[*]}"
  exec npx -y "${ARGS[@]}"
fi

# ---------------------------------------------------------------------------
# Local install from this checkout.
# ---------------------------------------------------------------------------
[[ -n "$SCOPE" ]] || usage
[[ -d "$SKILL_SRC" ]] || { echo "install: skill source missing: $SKILL_SRC" >&2; exit 1; }

if [[ "$SCOPE" == "global" ]]; then
  DEST_ROOT="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills"
else
  TARGET="${TARGET:-$PWD}"
  TARGET="$(cd "$TARGET" && pwd)"
  DEST_ROOT="$TARGET/.opencode/skills"
fi

DEST="$DEST_ROOT/$SKILL_NAME"
mkdir -p "$DEST_ROOT"

if [[ -e "$DEST" || -L "$DEST" ]]; then
  if [[ "$MODE" == "link" && -L "$DEST" ]]; then
    rm -f "$DEST"
  else
    echo "install: destination already exists: $DEST" >&2
    echo "install: remove it first, or use --link after removing the old copy." >&2
    exit 1
  fi
fi

if [[ "$MODE" == "link" ]]; then
  ln -s "$SKILL_SRC" "$DEST"
  echo "linked $DEST -> $SKILL_SRC"
else
  mkdir -p "$DEST"
  tar -C "$SKILL_SRC" --exclude='.frontend-design-skills' -cf - . | tar -C "$DEST" -xf -
  echo "installed $DEST"
fi

node "$DEST/scripts/doctor.mjs" || true
echo
echo "Invoke in OpenCode with: @$SKILL_NAME"
echo "Or load it by ID: $SKILL_NAME"
echo "Remote install: npx -y skills add $REPO_URL --skill $SKILL_NAME -a opencode"
