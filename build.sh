#!/bin/bash
set -e

[[ -d dist ]] && rm -r dist

mkdir dist

npm install
npx -y update-browserslist-db@latest
[[ -d build ]] && rm -r build
npm run build
mv build/* dist/
