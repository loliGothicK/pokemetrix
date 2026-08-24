# Handoff Report: Items Specification Survey (148 Champions Items)

**Agent**: teamwork_preview_survey_explorer_2 (Spec Miner 2)  
**Parent**: 6b9bbfbd-ba4e-4bf2-a413-67eae4d47c37 (parent)  
**Date**: 2026-08-23  
**Deliverable**: `d:\workspace\pokemetrix\.agents\teamwork_preview_survey_explorer_2\report.md`

---

## 1. Observation

1. **Items Definition Source**:
   - `packages/data/champions/items.json`: Exactly 148 items listed for the Pokémon Champions metagame.
   - Reference implementation in `@pkmn/sim` (`apps/web/node_modules/@pkmn/sim/build/cjs/data/items.js`): All 148 items exist in Showdown with 100% parity.
   - Breakdown of 148 items:
     - 75 Mega Stones (`mega-evolution` category)
     - 28 Berries (`berry` category: 18 Type-resist, 7 Status-cure, 2 HP-heal, 1 PP-restore)
     - 45 Held Items (`held-item` category: 18 Type-power boosters, 2 Category boosters, 3 Stat/Choice items, 3 Survival/Damage modifiers, 3 Recovery items, 4 Accuracy/Crit items, 2 Herbs, 5 Field extenders, 3 Utility items)

2. **Current Rust Engine State**:
   - `packages/engine/src/sim/items.rs`: Currently an empty stub `pub fn register(map: &mut HashMap<&'static str, Condition>) {}`.
   - `packages/engine/src/sim/registry.rs`: `Condition` struct currently defines only 6 event hooks (`on_modify_priority`, `on_try_move`, `on_try_hit`, `on_base_power`, `on_damage`, `on_residual`).
   - `packages/engine/src/sim/battle.rs`: Contains stub `run_event` dispatcher returning `relay_var`.
   - `packages/engine/src/wasm_api.rs`: Contains stub `simulate_turn_wasm`.
   - `cargo check -p engine`: Currently compiles with 14 compiler warnings (unused imports and variables in stubs).

3. **Equivalence Testing Setup**:
   - `apps/web/src/__tests__/engine-equivalence.test.ts`: Placeholder test in place.
   - `apps/web/src/utils/tsumeEngine.ts`: Full integration with `@pkmn/sim` Battle simulation.
   - Requirement `items-equivalence.test.ts`: Target Vitest suite to verify full parity between `@pkmn/sim` and the Rust WASM engine across all 148 items.

---

## 2. Logic Chain

1. **Item Universe Scope**:
   From `packages/data/champions/items.json`, the metagame restricts items strictly to 148 items. All 148 items were cross-referenced against `@pkmn/sim` and mapped into functional categories with their exact Showdown triggers, modifiers, and priority values.

2. **Condition Hook Requirements**:
   To faithfully execute all 148 items in the Rust engine, the `Condition` struct in `packages/engine/src/sim/registry.rs` must be expanded from 6 hooks to support:
   - `on_base_power` (18 Type boosters + Muscle Band + Wise Glasses)
   - `on_modify_damage` (Life Orb 1.3x, Expert Belt 1.2x)
   - `on_source_modify_damage` (18 Type-resist berries 0.5x)
   - `on_damage` (Focus Sash 1 HP survive, Focus Band 10% survive)
   - `on_residual` (Leftovers 1/16 HP heal)
   - `on_update` & `on_eat` (Berries HP/Status/PP triggers, Mental Herb)
   - `on_take_item` (75 Mega Stones knock-off/theft immunity)
   - `on_modify_spe` (Choice Scarf 1.5x, Iron Ball 0.5x)
   - `on_modify_atk` / `on_modify_spa` (Light Ball 2.0x Pikachu)
   - `on_modify_accuracy` / `on_source_modify_accuracy` (Bright Powder, Wide Lens, Zoom Lens)
   - `on_modify_crit_ratio` (Scope Lens +1)
   - `on_after_move_secondary_self` (Life Orb recoil 10% max HP, Shell Bell heal 1/8 damage)
   - `on_start` / `on_modify_move` (Choice Scarf choicelock, King's Rock 10% flinch)
   - `on_try_heal` (Big Root +30% drain heal)
   - Weather / Screen extension parameters (Damp Rock, Heat Rock, Icy Rock, Smooth Rock, Light Clay extending turns 5 -> 8).

3. **Implementation Grouping**:
   The 148 items can be ported in 3 logical batches:
   - Batch 1: Mega Stones (75 items) — Uniform `on_take_item` handler and mega form mapping.
   - Batch 2: Berries (28 items) — 18 type-resist berries (`on_source_modify_damage`), status berries, heal berries.
   - Batch 3: Held Items (45 items) — Type boosters, choice/stat items, survival/recovery, herbs, extenders.

---

## 3. Caveats

- **RNG Determinism in Tsume**: Items with probabilistic behavior (`focus-band` 10%, `quick-claw` 20%, `kings-rock` 10% flinch) must follow worst-case / deterministic branch evaluation in puzzle search, matching `TsumeEngine` RNG control.
- **Form Change Mechanism**: Mega Evolution requires coordinating item checks with battle state transformation (altering base stats, types, ability upon mega evolution).
- **Damage Modifiers**: Damage calculation multipliers in Rust must use 4096-based integer math (`pokeRound`) matching `packages/damage-calc/src/calc.rs` and Showdown `chainModify` (e.g. 4915/4096 for 1.2x, 5324/4096 for 1.3x).

---

## 4. Conclusion

The specification for all 148 items in Pokémon Champions is completely mapped and verified against `@pkmn/sim`. Full implementation in `packages/engine/src/sim/items.rs` is unblocked and ready for the implementation phase once the `Condition` struct in `registry.rs` is expanded with the requisite hook signatures.

The detailed catalog of all 148 items, edge cases, and equivalence criteria has been documented in `d:\workspace\pokemetrix\.agents\teamwork_preview_survey_explorer_2\report.md`.

---

## 5. Verification Method

To verify the survey findings:
1. View the complete 148-item catalog and specification in `d:\workspace\pokemetrix\.agents\teamwork_preview_survey_explorer_2\report.md`.
2. Inspect item definitions in `packages/data/champions/items.json` and `@pkmn/sim` (`apps/web/node_modules/@pkmn/sim/build/cjs/data/items.js`).
3. Verify engine buildability with `cargo check -p engine`.
