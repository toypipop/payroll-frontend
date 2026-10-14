#!/bin/sh
set -eu
# Patch npm's bundled tools independently of the application dependency lockfile.
npm install --global --ignore-scripts npm@12.2.0
cli_dir="$(npm root --global)/npm"
cli_dir=$(cd "$cli_dir" && pwd -P)
case "$cli_dir" in */node_modules/npm) ;; *) echo 'Unexpected npm installation path.' >&2; exit 1;; esac
patch_dir=$(mktemp -d /tmp/npm-bundle-patches.XXXXXXXX)
case "$patch_dir" in /tmp/npm-bundle-patches.*) ;; *) exit 1;; esac
trap 'rm -rf -- "$patch_dir"' EXIT
# npm's published manifest contains unpublished development workspaces, so do not
# install inside it. Resolve the compatible patch packages in a clean directory.
npm install --prefix "$patch_dir" --no-save --ignore-scripts --omit=dev --no-package-lock \
  brace-expansion@5.0.12 ip-address@10.7.1 undici@6.28.1 postcss-selector-parser@7.1.6
for source in "$patch_dir"/node_modules/*; do
  name=${source##*/}
  case "$name" in brace-expansion|balanced-match|ip-address|undici|postcss-selector-parser|cssesc|util-deprecate) ;; *) echo 'Unexpected patch dependency; review it before installing.' >&2; exit 1;; esac
  target="$cli_dir/node_modules/$name"
  case "$target" in "$cli_dir"/node_modules/*) ;; *) exit 1;; esac
  rm -rf -- "$target"
  cp -R "$source" "$target"
done
node -e 'const fs=require("fs");const root=process.argv[1];for(const [name,version] of Object.entries({"brace-expansion":"5.0.12","ip-address":"10.7.1","undici":"6.28.1","postcss-selector-parser":"7.1.6"})){if(JSON.parse(fs.readFileSync(root+"/node_modules/"+name+"/package.json")).version!==version)process.exit(1)}' "$cli_dir"
npm --version
