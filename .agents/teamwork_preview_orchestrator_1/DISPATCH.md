## 2026-08-22T17:36:03Z
Port the complete set of 199 Abilities, 148 Items, and all Volatile/Secondary Move Effects from the `@pkmn/sim` TypeScript codebase into the Rust engine (`packages/engine/src/sim/*.rs`).
- R1. Port Abilities in `packages/engine/src/sim/abilities.rs`
- R2. Port Items in `packages/engine/src/sim/items.rs`
- R3. Port Move Volatiles in `packages/engine/src/sim/moves_effects.rs`

Equivalence & Acceptance:
- `items-equivalence.test.ts` passes with 0 errors
- `abilities-equivalence.test.ts` passes with 0 errors
- `moves-equivalence.test.ts` passes with 0 errors
- Engine compiles to WASM without warnings (`cargo check -p engine`)
- Full compliance with all project rules and zero error policy (`pnpm typecheck`, `pnpm build`, `pnpm test`).
