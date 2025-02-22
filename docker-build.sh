#!/bin/bash

set -euo pipefail

rm -rf dist node_modules
mkdir -p dist node_modules
docker build --iidfile=node_modules/docker-iid .
cat node_modules/docker-iid
docker run -ti --rm --user $(id -u):$(id -g) -v $PWD:/data $(cat node_modules/docker-iid) \
       bash -c "cd /data && /pnpm/pnpm install && node_modules/.bin/vite build"
