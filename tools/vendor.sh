#!/bin/sh
# Copy the pinned browser/server libraries into vendor/ (PLAN.md S5, DESIGN.md
# S9.5). Needs npm and network; the result is checked in, nothing else
# touches node_modules. Re-run after changing a version below.
set -eu

PREACT=10.29.8
HTM=3.1.1
RENDER=6.8.1
FREEHAND=1.2.3

root=$(cd "$(dirname "$0")/.." && pwd)
out=$root/vendor
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$out"
cd "$tmp"

for spec in preact@$PREACT htm@$HTM preact-render-to-string@$RENDER perfect-freehand@$FREEHAND; do
  npm pack "$spec" --silent >/dev/null
done

for t in *.tgz; do
  mkdir "${t%.tgz}"
  tar xzf "$t" -C "${t%.tgz}"
done

# module file, then the only bare import ("preact") rewritten to a relative one
cp "preact-$PREACT/package/dist/preact.mjs" "$out/preact.js"
cp "preact-$PREACT/package/hooks/dist/hooks.mjs" "$out/hooks.js"
cp "htm-$HTM/package/dist/htm.mjs" "$out/htm.js"
cp "preact-render-to-string-$RENDER/package/dist/index.mjs" "$out/preact-render-to-string.js"
cp "perfect-freehand-$FREEHAND/package/dist/esm/index.mjs" "$out/perfect-freehand.js"

sed -i 's|from"preact"|from"./preact.js"|' "$out/hooks.js" "$out/preact-render-to-string.js"

cp "preact-$PREACT/package/LICENSE" "$out/LICENSE.preact"
cp "htm-$HTM/package/LICENSE" "$out/LICENSE.htm"
cp "preact-render-to-string-$RENDER/package/LICENSE" "$out/LICENSE.preact-render-to-string"
cp "perfect-freehand-$FREEHAND/package/LICENSE" "$out/LICENSE.perfect-freehand"

cat > "$out/VERSIONS" <<EOT
# package  version  licence  file  (written by tools/vendor.sh)
preact  $PREACT  MIT  preact.js  https://www.npmjs.com/package/preact/v/$PREACT
preact/hooks  $PREACT  MIT  hooks.js  https://www.npmjs.com/package/preact/v/$PREACT
htm  $HTM  Apache-2.0  htm.js  https://www.npmjs.com/package/htm/v/$HTM
preact-render-to-string  $RENDER  MIT  preact-render-to-string.js  https://www.npmjs.com/package/preact-render-to-string/v/$RENDER
perfect-freehand  $FREEHAND  MIT  perfect-freehand.js  https://www.npmjs.com/package/perfect-freehand/v/$FREEHAND
EOT
