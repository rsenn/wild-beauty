#!/bin/sh
# Copy the pinned browser/server libraries into vendor/ (PLAN.md S5, DESIGN.md
# S9.5). Needs npm and network; the result is checked in, nothing else
# touches node_modules. Re-run after changing a version below.
set -eu

PREACT=10.29.8
HTM=3.1.1
RENDER=6.8.1
FREEHAND=1.2.3
BEZIER=6.1.4
THREE=0.186.1

root=$(cd "$(dirname "$0")/.." && pwd)
out=$root/vendor
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$out"
cd "$tmp"

for spec in preact@$PREACT htm@$HTM preact-render-to-string@$RENDER perfect-freehand@$FREEHAND bezier-js@$BEZIER three@$THREE; do
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

# bezier-js ships ES modules in src/ (dist/ is an IIFE): keep its three files
mkdir -p "$out/bezier-js"
cp "bezier-js-$BEZIER/package/src/"*.js "$out/bezier-js/"

# three.js (lazy-loaded by the 3D gallery only). The package ships the builds
# unminified, so minify them here (bun, which the project already needs); the pointer
# lock add-on's bare "three" import is made relative
mkdir -p "$out/three"
for f in three.core three.module; do
  bun build --no-bundle --minify "three-$THREE/package/build/$f.js" --outfile "$out/three/$f.js" >/dev/null
done
cp "three-$THREE/package/examples/jsm/controls/PointerLockControls.js" "$out/three/PointerLockControls.js"
sed -i "s|from 'three'|from './three.module.js'|" "$out/three/PointerLockControls.js"
cp "three-$THREE/package/LICENSE" "$out/LICENSE.three"

sed -i 's|from"preact"|from"./preact.js"|' "$out/hooks.js" "$out/preact-render-to-string.js"

cp "preact-$PREACT/package/LICENSE" "$out/LICENSE.preact"
cp "htm-$HTM/package/LICENSE" "$out/LICENSE.htm"
cp "preact-render-to-string-$RENDER/package/LICENSE" "$out/LICENSE.preact-render-to-string"
cp "perfect-freehand-$FREEHAND/package/LICENSE" "$out/LICENSE.perfect-freehand"
# the npm package carries no LICENSE file, only the README statement
printf 'bezier-js %s is MIT licensed (package README, "License"):\nhttps://github.com/Pomax/bezierjs/blob/master/LICENSE\n' "$BEZIER" > "$out/LICENSE.bezier-js"

cat > "$out/VERSIONS" <<EOT
# package  version  licence  file  (written by tools/vendor.sh)
preact  $PREACT  MIT  preact.js  https://www.npmjs.com/package/preact/v/$PREACT
preact/hooks  $PREACT  MIT  hooks.js  https://www.npmjs.com/package/preact/v/$PREACT
htm  $HTM  Apache-2.0  htm.js  https://www.npmjs.com/package/htm/v/$HTM
preact-render-to-string  $RENDER  MIT  preact-render-to-string.js  https://www.npmjs.com/package/preact-render-to-string/v/$RENDER
perfect-freehand  $FREEHAND  MIT  perfect-freehand.js  https://www.npmjs.com/package/perfect-freehand/v/$FREEHAND
bezier-js  $BEZIER  MIT  bezier-js/bezier.js  https://www.npmjs.com/package/bezier-js/v/$BEZIER
three  $THREE  MIT  three/three.module.js  https://www.npmjs.com/package/three/v/$THREE
EOT
