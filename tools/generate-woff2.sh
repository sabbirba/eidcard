#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./tools/generate-woff2.sh [SOURCE_TTF] [OUT_DIR]
# Example:
#   ./tools/generate-woff2.sh "assets/Li Shamim Chitranee Unicode.ttf" assets

SRC="${1:-}"
OUT_DIR="${2:-assets}"

if [ -z "$SRC" ]; then
  echo "Usage: $0 /path/to/source.ttf [out_dir]"
  exit 1
fi

if [ ! -f "$SRC" ]; then
  echo "Source file not found: $SRC"
  exit 1
fi

if ! command -v woff2_compress >/dev/null 2>&1; then
  cat <<'EOF'
woff2_compress tool not found.

On macOS install via Homebrew:
  brew install woff2

Then re-run this script. Example:
  ./tools/generate-woff2.sh "assets/Li Shamim Chitranee Unicode.ttf" assets
EOF
  exit 2
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

cp "$SRC" "$TMPDIR/"
pushd "$TMPDIR" >/dev/null
woff2_compress "$(basename "$SRC")"
popd >/dev/null

mkdir -p "$OUT_DIR"
mv "$TMPDIR"/*.woff2 "$OUT_DIR/"

echo "Generated: $OUT_DIR/$(basename "${SRC%.*}.woff2")"
