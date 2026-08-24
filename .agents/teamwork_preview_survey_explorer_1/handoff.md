# Handoff Report: Survey & Specification Mining for 199 Abilities Port

**Agent**: `teamwork_preview_spec_miner 1` (Abilities Specialist)  
**Target Path**: `packages/engine/src/sim/abilities.rs`  
**Working Directory**: `d:\workspace\pokemetrix\.agents\teamwork_preview_survey_explorer_1`  
**Date**: 2026-08-22  
**Handoff Type**: Hard (Survey & Specification Mining Complete)  

---

## 1. Observation

1. **Abilities Count & Identification**:
   - `packages/data/champions/pokemon.json`: Contains the legal Pokémon pool for Pokémon Champions format. By extracting all `abilities` arrays across the entire roster and cross-referencing `packages/data/master/abilities.json`, exactly **199 unique ability IDs** are used.
   - IDs span from `id: 1` (`stench`) to `id: 313` (`fire-mane`).
   - Custom Pokémon Champions abilities: `id: 308` (`piercing-drill`), `id: 309` (`dragonize`), `id: 310` (`mega-sol`), `id: 311` (`spicy-spray`), `id: 312` (`eelevate`), and `id: 313` (`fire-mane`).

2. **Authoritative Specification Source**:
   - `node_modules/.pnpm/@pkmn+sim@0.10.11/node_modules/@pkmn/sim/build/cjs/data/abilities.js`: Contains full TypeScript definitions, event callbacks, rating, flags, and mechanics for all 199 abilities (including the custom ones).
   - `apps/web/public/locales/en/translation.json` & `apps/web/public/locales/ja/translation.json`: Contain full English and Japanese localization names and description effects.

3. **Current Rust Engine Architecture**:
   - `packages/engine/src/sim/abilities.rs`: Currently an empty stub:
     ```rust
     use std::collections::HashMap;
     use super::registry::Condition;
     pub fn register(map: &mut HashMap<&'static str, Condition>) {}
     ```
   - `packages/engine/src/sim/registry.rs`: Currently defines `Condition` with only 6 event hooks:
     `on_modify_priority`, `on_try_move`, `on_try_hit`, `on_base_power`, `on_damage`, `on_residual`.
   - `packages/engine/Cargo.toml` & `packages/Cargo.toml`: Rust workspace includes `engine`, `damage-calc`, and `data` crates. `cargo check --manifest-path packages/Cargo.toml -p engine` compiles cleanly with 14 warnings (unused stub arguments).

4. **Testing Suite**:
   - `ORIGINAL_REQUEST.md`: Requires `apps/web/src/__tests__/abilities-equivalence.test.ts` to pass with 0 errors.
   - `apps/web/src/__tests__/engine-equivalence.test.ts`: Currently holds a placeholder dummy test.

---

## 2. Logic Chain

1. **Domain Boundary Mapping**:
   - Because Pokémon Champions is exclusively a 2v2 (Double Battle / VGC) format based on Gen 9 mechanics with custom elements, the simulation engine must faithfully mirror Showdown's event loop and exact modifier chaining rules (DaWoblefet's damage dissertation / `@pkmn/sim`).
   - All 199 abilities referenced in `packages/data/champions/pokemon.json` are present in `@pkmn/sim/build/cjs/data/abilities.js`.

2. **Condition Hook Expansion**:
   - The current 6-hook `Condition` struct is insufficient to handle entry effects (`on_start`), on-hit contact punishes (`on_damaging_hit`), stat modifiers (`on_modify_atk`, `on_modify_spa`, `on_modify_spe`, `on_modify_def`), stat drops (`on_try_boost`, `on_after_each_boost`), type modifiers (`on_modify_type`), and item triggers (`on_eat_item`).
   - Expanding `Condition` to include 40+ dedicated function pointer hooks (or generic event handlers with priority dispatch) provides zero-overhead Rust function dispatching matching `@pkmn/sim`'s event architecture.

3. **Classification & Implementation Phasing**:
   - Categorizing the 199 abilities into 11 clusters allows parallel or incremental implementation:
     - 33 Damage & Base Power Modifiers
     - 23 Raw Stat Modifiers
     - 31 On-Hit & Status Infliction Triggers
     - 23 Entry & Switch Effects
     - 19 Immunities, Absorptions & Redirections
     - 18 Stat Stage & Drop Protection
     - 18 Move Attributes & Priority Modifiers
     - 9 Residual / End-of-Turn Effects
     - 7 Weather & Terrain Synergies
     - 5 Item Triggers
     - 13 KO, Trapping & Miscellaneous

---

## 3. Caveats

1. **Move Volatiles and Item Dependencies**: Certain abilities interact with move volatile conditions (e.g. `Protect`, `Substitute`, `Taunt`, `Encore`, `Trick Room`, `Tailwind`) or items (e.g. `Unburden`, `Ripen`, `Cheek Pouch`). Full end-to-end integration tests depend on items (`packages/engine/src/sim/items.rs`) and move volatiles (`packages/engine/src/sim/moves_effects.rs`) being implemented concurrently.
2. **Double Battle Specifics**: Abilities like `Lightning Rod`, `Storm Drain`, `Friend Guard`, `Symbiosis`, `Telepathy`, `Receiver`, `Hospitality`, `Plus`, `Minus` interact with adjacent allies and require multi-target side scanning.

---

## 4. Conclusion

The specification mining and architecture survey for porting the **199 Abilities** into `packages/engine/src/sim/abilities.rs` is **100% complete**. All 199 abilities have been enumerated, cataloged, categorized, and cross-referenced with `@pkmn/sim` and the Champions data files. The complete report is stored at `d:\workspace\pokemetrix\.agents\teamwork_preview_survey_explorer_1\report.md`.

The implementation team can immediately begin the 8-phase implementation roadmap upon orchestrator dispatch.

---

## 5. Verification Method

1. **Verify Ability Scope**:
   - Inspect `d:\workspace\pokemetrix\.agents\teamwork_preview_survey_explorer_1\report.md` Section 3 & "Features Discovered" table (contains all 199 numbered abilities).
2. **Verify Engine Compilation**:
   - Run `cargo check --manifest-path packages/Cargo.toml -p engine`.
3. **Verify TypeScript Data Match**:
   - Inspect `packages/data/champions/pokemon.json` and `node_modules/.pnpm/@pkmn+sim@0.10.11/node_modules/@pkmn/sim/build/cjs/data/abilities.js`.
