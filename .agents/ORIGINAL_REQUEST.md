# Original User Request

## 2026-08-22T17:35:35Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval.
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Use a very large team of agents.

Port the complete set of 199 Abilities, 148 Items, and all Volatile/Secondary Move Effects from the `@pkmn/sim` TypeScript codebase into the Rust engine (`packages/engine/src/sim/*.rs`). Use a very large team of agents. The goal is to perfectly replicate the Showdown VGC mechanics so that the Minimax solver can generate accurate `TsumeData` (game trees) for puzzle generation.

Working directory: d:\workspace\pokemetrix
Integrity mode: demo

## Requirements

### R1. Port Abilities
Implement the 199 unique abilities in `packages/engine/src/sim/abilities.rs` using the `Condition` struct hooks (e.g., `on_modify_priority`, `on_base_power`). Reference the core logic directly from `@pkmn/sim`.

### R2. Port Items
Implement the 148 unique items in `packages/engine/src/sim/items.rs` using the `Condition` struct hooks. 

### R3. Port Move Volatiles
Implement move secondary effects and volatiles (e.g., Protect, Substitute, Encore, Trick Room, Tailwind) in `packages/engine/src/sim/moves_effects.rs`.

## Verification Resources
- The project already has a Vitest equivalence testing suite set up in `apps/web/src/__tests__/`.
- You can run the tests by delegating execution via Node/pnpm (e.g., `cd apps/web && npx vitest run src/__tests__/items-equivalence.test.ts`).

## Acceptance Criteria

### Testing & Equivalence
- [ ] The `items-equivalence.test.ts` suite passes with 0 errors.
- [ ] The `abilities-equivalence.test.ts` suite passes with 0 errors.
- [ ] The `moves-equivalence.test.ts` suite passes with 0 errors.
- [ ] The engine correctly compiles to WASM without warnings (`cargo check -p engine`).
