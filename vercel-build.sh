#!/bin/bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
export PATH="/rust/bin:$PATH"
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -y
pnpm build:wasm && pnpm build:app