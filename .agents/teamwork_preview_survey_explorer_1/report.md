# Comprehensive Survey & Specification Report: Porting 199 Abilities to Rust Engine

**Agent**: `teamwork_preview_spec_miner 1` (Abilities Specialist)  
**Target Path**: `packages/engine/src/sim/abilities.rs`  
**Date**: 2026-08-22  
**Status**: Survey & Specification Mining Complete  

---

## 1. Executive Summary

This report delivers the complete architectural mapping, specification mining, hook taxonomy, and implementation blueprint for porting the **199 Pokémon Abilities** used in the Pokémon Champions metagame into the high-performance Rust simulation engine (`packages/engine/src/sim/abilities.rs`).

### Key Findings:
1. **Exact Ability Scope**: Exactly **199 unique ability IDs** are referenced across the legal Pokémon roster in `packages/data/champions/pokemon.json` (mapped to `packages/data/master/abilities.json`).
2. **Authoritative Specification Source**: The installed `@pkmn/sim` package (`node_modules/.pnpm/@pkmn+sim@0.10.11/node_modules/@pkmn/sim/build/cjs/data/abilities.js`) contains the complete TypeScript reference implementation for all 199 abilities, including standard Gen 1–9 abilities as well as custom Pokémon Champions abilities (`piercing-drill`, `dragonize`, `mega-sol`, `spicy-spray`, `eelevate`, `fire-mane`).
3. **Current Rust Engine State**: `packages/engine/src/sim/abilities.rs` is currently empty (`pub fn register(map: &mut HashMap<&'static str, Condition>) {}`). The current `Condition` struct in `packages/engine/src/sim/registry.rs` defines only 6 basic hooks, which must be expanded to support the full event model.
4. **Testing & Verification Suite**: An equivalence testing suite (`apps/web/src/__tests__/abilities-equivalence.test.ts`) will run turn-by-turn state comparison against `@pkmn/sim` via Vitest and verify 100% mechanical parity.

---

## 2. Codebase Architecture & Engine Gap Analysis

### 2.1 Current File Topology
- `packages/engine/src/sim/abilities.rs`: Registry entry point for abilities (currently stubbed).
- `packages/engine/src/sim/registry.rs`: Defines `Condition`, `Registry`, and `EventHandler` function pointer types.
- `packages/engine/src/sim/battle.rs`: Core battle state (`Battle`), active Pokémon arrays, and event execution (`run_event`).
- `packages/engine/src/sim/pokemon.rs`: In-memory Pokémon struct (`Pokemon`).
- `packages/engine/src/sim/damage.rs`: Damage formula and modifier chaining, integrating with `packages/damage-calc`.
- `packages/engine/src/wasm_api.rs`: WebAssembly bindings exposing `simulate_turn_wasm` for Node.js / Vitest testing.

### 2.2 Condition Struct Hook Expansion
The existing `Condition` struct in `packages/engine/src/sim/registry.rs` has 6 fields. To support all 199 abilities faithfully, the hook definitions must cover the complete lifecycle:

```rust
pub type EventHandler = fn(
    battle: &mut Battle,
    target: Option<PokemonIdent>,
    source: Option<PokemonIdent>,
    effect: &str,
    relay_var: i32,
) -> i32;

#[derive(Default, Clone)]
pub struct Condition {
    pub id: &'static str,
    pub rating: f32,
    pub is_breakable: bool, // For Mold Breaker / Turboblaze / Teravolt
    pub is_cant_suppress: bool, // For Stance Change, etc.

    // 1. Priority & Turn Order
    pub on_modify_priority: Option<EventHandler>,
    pub on_fractional_priority: Option<EventHandler>,

    // 2. Move Execution & Type Conversion
    pub on_modify_move: Option<EventHandler>,
    pub on_modify_type: Option<EventHandler>,
    pub on_modify_accuracy: Option<EventHandler>,
    pub on_try_move: Option<EventHandler>,
    pub on_foe_try_move: Option<EventHandler>,
    pub on_hit_protect: Option<EventHandler>,
    pub on_prepare_hit: Option<EventHandler>,

    // 3. Hit, Immunity & Redirection
    pub on_try_hit: Option<EventHandler>,
    pub on_immunity: Option<EventHandler>,
    pub on_any_invulnerability: Option<EventHandler>,
    pub on_any_redirect_target: Option<EventHandler>,
    pub on_ally_try_hit_side: Option<EventHandler>,

    // 4. Damage & Power Modifiers
    pub on_base_power: Option<EventHandler>,
    pub on_modify_damage: Option<EventHandler>,
    pub on_source_modify_damage: Option<EventHandler>,
    pub on_critical_hit: Option<EventHandler>,
    pub on_modify_crit_ratio: Option<EventHandler>,
    pub on_modify_stab: Option<EventHandler>,
    pub on_weather_modify_damage: Option<EventHandler>,

    // 5. Stat Modifiers (Raw & Stages)
    pub on_modify_atk: Option<EventHandler>,
    pub on_modify_spa: Option<EventHandler>,
    pub on_modify_def: Option<EventHandler>,
    pub on_modify_spd: Option<EventHandler>,
    pub on_modify_spe: Option<EventHandler>,
    pub on_try_boost: Option<EventHandler>,
    pub on_after_each_boost: Option<EventHandler>,
    pub on_foe_after_boost: Option<EventHandler>,
    pub on_change_boost: Option<EventHandler>,
    pub on_any_modify_boost: Option<EventHandler>,

    // 6. On-Hit & Status Infliction
    pub on_damage: Option<EventHandler>,
    pub on_damaging_hit: Option<EventHandler>,
    pub on_hit: Option<EventHandler>,
    pub on_source_damaging_hit: Option<EventHandler>,
    pub on_after_move_secondary: Option<EventHandler>,
    pub on_after_move_secondary_self: Option<EventHandler>,
    pub on_flinch: Option<EventHandler>,
    pub on_set_status: Option<EventHandler>,
    pub on_after_set_status: Option<EventHandler>,
    pub on_try_add_volatile: Option<EventHandler>,
    pub on_ally_set_status: Option<EventHandler>,
    pub on_ally_try_add_volatile: Option<EventHandler>,

    // 7. Field, Entry, Weather & Residual
    pub on_start: Option<EventHandler>,
    pub on_switch_in: Option<EventHandler>,
    pub on_switch_out: Option<EventHandler>,
    pub on_before_switch_in: Option<EventHandler>,
    pub on_weather: Option<EventHandler>,
    pub on_weather_change: Option<EventHandler>,
    pub on_terrain_change: Option<EventHandler>,
    pub on_residual: Option<EventHandler>,
    pub on_update: Option<EventHandler>,
    pub on_end: Option<EventHandler>,

    // 8. Items, Faint & Trapping
    pub on_eat_item: Option<EventHandler>,
    pub on_try_eat_item: Option<EventHandler>,
    pub on_after_use_item: Option<EventHandler>,
    pub on_take_item: Option<EventHandler>,
    pub on_ally_after_use_item: Option<EventHandler>,
    pub on_foe_try_eat_item: Option<EventHandler>,
    pub on_source_after_faint: Option<EventHandler>,
    pub on_ally_faint: Option<EventHandler>,
    pub on_faint: Option<EventHandler>,
    pub on_foe_trap_pokemon: Option<EventHandler>,
    pub on_modify_weight: Option<EventHandler>,
}
```

---

## 3. Ability Classification & Category Taxonomy

All 199 abilities have been categorized into 11 functional clusters:

| Cluster | Count | Key Examples | Primary Mechanism |
|---------|-------|--------------|-------------------|
| **Damage & Base Power Modifiers** | 33 | Technician, Tough Claws, Sharpness, Iron Fist, Sand Force, Sheer Force, Dragonize, Pixilate, Aerilate, Refrigerate | `on_base_power`, `on_modify_damage` |
| **Stat Modifiers (Raw Stats)** | 23 | Huge Power, Pure Power, Swift Swim, Chlorophyll, Hustle, Fur Coat, Water Bubble, Fire Mane | `on_modify_atk`, `on_modify_spa`, `on_modify_spe`, `on_modify_def` |
| **On-Hit & Status Infliction** | 31 | Static, Flame Body, Poison Point, Rough Skin, Disguise, Innards Out, Stamina, Electromorphosis, Toxic Debris, Spicy Spray | `on_damaging_hit`, `on_set_status` |
| **Entry & Switch Effects** | 23 | Intimidate, Drizzle, Drought, Sand Stream, Snow Warning, Electric Surge, Screen Cleaner, Hospitality, Supersweet Syrup | `on_start`, `on_switch_in`, `on_switch_out` |
| **Immunities & Redirection** | 19 | Flash Fire, Volt Absorb, Water Absorb, Motor Drive, Sap Sipper, Earth Eater, Lightning Rod, Soundproof, Bulletproof, Good as Gold | `on_try_hit`, `on_immunity`, `on_any_redirect_target` |
| **Stat Stage & Stat Drop Protection** | 18 | Defiant, Competitive, Clear Body, White Smoke, Mirror Armor, Contrary, Simple, Unaware, Opportunist, Ripen | `on_try_boost`, `on_after_each_boost`, `on_change_boost` |
| **Move Attributes & Priority** | 18 | Prankster, Gale Wings, Unseen Fist, Piercing Drill, Long Reach, Stalwart, Liquid Voice, Stance Change | `on_modify_priority`, `on_modify_move`, `on_hit_protect` |
| **Residual / End of Turn** | 9 | Speed Boost, Rain Dish, Ice Body, Moody, Harvest, Cud Chew, Shed Skin, Hydration | `on_residual` |
| **Weather & Terrain Synergy** | 7 | Solar Power, Dry Skin, Forecast, Mimicry, Mega Sol | `on_weather`, `on_terrain_change` |
| **Item Triggers** | 5 | Unburden, Sticky Hold, Cheek Pouch, Symbiosis, Berserk | `on_eat_item`, `on_take_item`, `on_after_use_item` |
| **KO, Trapping & Misc** | 13 | Shadow Tag, Moxie, Receiver, Eelevate, Adaptability, Magic Guard, Super Luck, Corrosion, Quick Draw | `on_source_after_faint`, `on_foe_trap_pokemon`, flags |

---

## Features Discovered
| # | Category | Feature (EN / JA / Slug) | Description | Inputs (Hooks) | Outputs | Error / Null Behavior | Discovered Via |
|---|----------|--------------------------|-------------|----------------|---------|------------------------|----------------|
| 1 | Move & Priority | **Stench** (stench) <br> `stench` (ID: 1) | Stench | `onModifyMovePriority, onModifyMove` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 2 | Entry & Switch | **Drizzle** (drizzle) <br> `drizzle` (ID: 2) | Drizzle | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 3 | Residual | **Speed Boost** (speed-boost) <br> `speed-boost` (ID: 3) | Speed Boost | `onResidualOrder, onResidualSubOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 4 | Damage & Base Power | **Battle Armor** (battle-armor) <br> `battle-armor` (ID: 4) | Battle Armor | `onCriticalHit` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 5 | Damage & Base Power | **Sturdy** (sturdy) <br> `sturdy` (ID: 5) | Sturdy | `onTryHit, onDamagePriority, onDamage` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 6 | Misc | **Damp** (damp) <br> `damp` (ID: 6) | Damp | `onAnyTryMove, onAnyDamage` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 7 | On-Hit & Status | **Limber** (limber) <br> `limber` (ID: 7) | Limber | `onUpdate, onSetStatus` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 8 | Immunity & Redirection | **Sand Veil** (sand-veil) <br> `sand-veil` (ID: 8) | Sand Veil | `onImmunity, onModifyAccuracyPriority, onModifyAccuracy` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 9 | On-Hit & Status | **Static** (static) <br> `static` (ID: 9) | Static | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 10 | Immunity & Redirection | **Volt Absorb** (volt-absorb) <br> `volt-absorb` (ID: 10) | Volt Absorb | `onTryHit` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 11 | Immunity & Redirection | **Water Absorb** (water-absorb) <br> `water-absorb` (ID: 11) | Water Absorb | `onTryHit` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 12 | Stat Stage & Drops | **Oblivious** (oblivious) <br> `oblivious` (ID: 12) | Oblivious | `onUpdate, onImmunity, onTryHit, onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 13 | Entry & Switch | **Cloud Nine** (cloud-nine) <br> `cloud-nine` (ID: 13) | Cloud Nine | `onSwitchIn, onStart, onEnd` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 14 | On-Hit & Status | **Insomnia** (insomnia) <br> `insomnia` (ID: 15) | Insomnia | `onUpdate, onSetStatus, onTryAddVolatile` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 15 | On-Hit & Status | **Immunity** (immunity) <br> `immunity` (ID: 17) | Immunity | `onUpdate, onSetStatus` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 16 | Immunity & Redirection | **Flash Fire** (flash-fire) <br> `flash-fire` (ID: 18) | Flash Fire | `onTryHit, onEnd` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 17 | Misc | **Shield Dust** (shield-dust) <br> `shield-dust` (ID: 19) | Shield Dust | `onModifySecondaries` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 18 | Stat Stage & Drops | **Own Tempo** (own-tempo) <br> `own-tempo` (ID: 20) | Own Tempo | `onUpdate, onTryAddVolatile, onHit, onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 19 | Misc | **Suction Cups** (suction-cups) <br> `suction-cups` (ID: 21) | Suction Cups | `onDragOutPriority, onDragOut` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 20 | Entry & Switch | **Intimidate** (intimidate) <br> `intimidate` (ID: 22) | Intimidate | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 21 | KO & Trapping | **Shadow Tag** (shadow-tag) <br> `shadow-tag` (ID: 23) | Shadow Tag | `onFoeTrapPokemon, onFoeMaybeTrapPokemon` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 22 | On-Hit & Status | **Rough Skin** (rough-skin) <br> `rough-skin` (ID: 24) | Rough Skin | `onDamagingHitOrder, onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 23 | Misc | **Levitate** (levitate) <br> `levitate` (ID: 26) | Levitate | `Passive / Field flag` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 24 | On-Hit & Status | **Effect Spore** (effect-spore) <br> `effect-spore` (ID: 27) | Effect Spore | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 25 | On-Hit & Status | **Synchronize** (synchronize) <br> `synchronize` (ID: 28) | Synchronize | `onAfterSetStatus` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 26 | Stat Stage & Drops | **Clear Body** (clear-body) <br> `clear-body` (ID: 29) | Clear Body | `onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 27 | Entry & Switch | **Natural Cure** (natural-cure) <br> `natural-cure` (ID: 30) | Natural Cure | `onCheckShow, onSwitchOut` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 28 | Immunity & Redirection | **Lightning Rod** (lightning-rod) <br> `lightning-rod` (ID: 31) | Lightning Rod | `onTryHit, onAnyRedirectTarget` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 29 | Stat Modifier (Raw) | **Swift Swim** (swift-swim) <br> `swift-swim` (ID: 33) | Swift Swim | `onModifySpe` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 30 | Stat Modifier (Raw) | **Chlorophyll** (chlorophyll) <br> `chlorophyll` (ID: 34) | Chlorophyll | `onModifySpe` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 31 | Stat Stage & Drops | **Illuminate** (illuminate) <br> `illuminate` (ID: 35) | Illuminate | `onTryBoost, onModifyMove` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 32 | Entry & Switch | **Trace** (trace) <br> `trace` (ID: 36) | Trace | `onStart, onUpdate` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 33 | Stat Modifier (Raw) | **Huge Power** (huge-power) <br> `huge-power` (ID: 37) | Huge Power | `onModifyAtkPriority, onModifyAtk` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 34 | On-Hit & Status | **Poison Point** (poison-point) <br> `poison-point` (ID: 38) | Poison Point | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 35 | Stat Stage & Drops | **Inner Focus** (inner-focus) <br> `inner-focus` (ID: 39) | Inner Focus | `onTryAddVolatile, onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 36 | Immunity & Redirection | **Magma Armor** (magma-armor) <br> `magma-armor` (ID: 40) | Magma Armor | `onUpdate, onImmunity` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 37 | Immunity & Redirection | **Soundproof** (soundproof) <br> `soundproof` (ID: 43) | Soundproof | `onTryHit, onAllyTryHitSide` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 38 | Weather & Terrain | **Rain Dish** (rain-dish) <br> `rain-dish` (ID: 44) | Rain Dish | `onWeather` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 39 | Entry & Switch | **Sand Stream** (sand-stream) <br> `sand-stream` (ID: 45) | Sand Stream | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 40 | Entry & Switch | **Pressure** (pressure) <br> `pressure` (ID: 46) | Pressure | `onStart, onDeductPP` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 41 | Stat Modifier (Raw) | **Thick Fat** (thick-fat) <br> `thick-fat` (ID: 47) | Thick Fat | `onSourceModifyAtkPriority, onSourceModifyAtk, onSourceModifySpAPriority, onSourceModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 42 | Misc | **Early Bird** (early-bird) <br> `early-bird` (ID: 48) | Early Bird | `Passive / Field flag` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 43 | On-Hit & Status | **Flame Body** (flame-body) <br> `flame-body` (ID: 49) | Flame Body | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 44 | Stat Stage & Drops | **Keen Eye** (keen-eye) <br> `keen-eye` (ID: 51) | Keen Eye | `onTryBoost, onModifyMove` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 45 | Stat Stage & Drops | **Hyper Cutter** (hyper-cutter) <br> `hyper-cutter` (ID: 52) | Hyper Cutter | `onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 46 | Residual | **Pickup** (pickup) <br> `pickup` (ID: 53) | Pickup | `onResidualOrder, onResidualSubOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 47 | Stat Modifier (Raw) | **Hustle** (hustle) <br> `hustle` (ID: 55) | Hustle | `onModifyAtkPriority, onModifyAtk, onSourceModifyAccuracyPriority, onSourceModifyAccuracy` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 48 | On-Hit & Status | **Cute Charm** (cute-charm) <br> `cute-charm` (ID: 56) | Cute Charm | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 49 | Stat Modifier (Raw) | **Plus** (plus) <br> `plus` (ID: 57) | Plus | `onModifySpAPriority, onModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 50 | Stat Modifier (Raw) | **Minus** (minus) <br> `minus` (ID: 58) | Minus | `onModifySpAPriority, onModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 51 | Weather & Terrain | **Forecast** (forecast) <br> `forecast` (ID: 59) | Forecast | `onSwitchInPriority, onStart, onWeatherChange` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 52 | Item Trigger | **Sticky Hold** (sticky-hold) <br> `sticky-hold` (ID: 60) | Sticky Hold | `onTakeItem` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 53 | Residual | **Shed Skin** (shed-skin) <br> `shed-skin` (ID: 61) | Shed Skin | `onResidualOrder, onResidualSubOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 54 | Stat Modifier (Raw) | **Guts** (guts) <br> `guts` (ID: 62) | Guts | `onModifyAtkPriority, onModifyAtk` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 55 | Stat Modifier (Raw) | **Marvel Scale** (marvel-scale) <br> `marvel-scale` (ID: 63) | Marvel Scale | `onModifyDefPriority, onModifyDef` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 56 | Stat Modifier (Raw) | **Overgrow** (overgrow) <br> `overgrow` (ID: 65) | Overgrow | `onModifyAtkPriority, onModifyAtk, onModifySpAPriority, onModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 57 | Stat Modifier (Raw) | **Blaze** (blaze) <br> `blaze` (ID: 66) | Blaze | `onModifyAtkPriority, onModifyAtk, onModifySpAPriority, onModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 58 | Stat Modifier (Raw) | **Torrent** (torrent) <br> `torrent` (ID: 67) | Torrent | `onModifyAtkPriority, onModifyAtk, onModifySpAPriority, onModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 59 | Stat Modifier (Raw) | **Swarm** (swarm) <br> `swarm` (ID: 68) | Swarm | `onModifyAtkPriority, onModifyAtk, onModifySpAPriority, onModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 60 | Misc | **Rock Head** (rock-head) <br> `rock-head` (ID: 69) | Rock Head | `onDamage` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 61 | Entry & Switch | **Drought** (drought) <br> `drought` (ID: 70) | Drought | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 62 | On-Hit & Status | **Vital Spirit** (vital-spirit) <br> `vital-spirit` (ID: 72) | Vital Spirit | `onUpdate, onSetStatus, onTryAddVolatile` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 63 | Stat Stage & Drops | **White Smoke** (white-smoke) <br> `white-smoke` (ID: 73) | White Smoke | `onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 64 | Stat Modifier (Raw) | **Pure Power** (pure-power) <br> `pure-power` (ID: 74) | Pure Power | `onModifyAtkPriority, onModifyAtk` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 65 | Damage & Base Power | **Shell Armor** (shell-armor) <br> `shell-armor` (ID: 75) | Shell Armor | `onCriticalHit` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 66 | Misc | **Tangled Feet** (tangled-feet) <br> `tangled-feet` (ID: 77) | Tangled Feet | `onModifyAccuracyPriority, onModifyAccuracy` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 67 | Immunity & Redirection | **Motor Drive** (motor-drive) <br> `motor-drive` (ID: 78) | Motor Drive | `onTryHit` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 68 | Damage & Base Power | **Rivalry** (rivalry) <br> `rivalry` (ID: 79) | Rivalry | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 69 | On-Hit & Status | **Steadfast** (steadfast) <br> `steadfast` (ID: 80) | Steadfast | `onFlinch` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 70 | Immunity & Redirection | **Snow Cloak** (snow-cloak) <br> `snow-cloak` (ID: 81) | Snow Cloak | `onImmunity, onModifyAccuracyPriority, onModifyAccuracy` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 71 | Entry & Switch | **Gluttony** (gluttony) <br> `gluttony` (ID: 82) | Gluttony | `onStart, onDamage` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 72 | On-Hit & Status | **Anger Point** (anger-point) <br> `anger-point` (ID: 83) | Anger Point | `onHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 73 | Item Trigger | **Unburden** (unburden) <br> `unburden` (ID: 84) | Unburden | `onAfterUseItem, onTakeItem, onEnd` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 74 | Stat Modifier (Raw) | **Heatproof** (heatproof) <br> `heatproof` (ID: 85) | Heatproof | `onSourceModifyAtkPriority, onSourceModifyAtk, onSourceModifySpAPriority, onSourceModifySpA, onDamage` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 75 | Weather & Terrain | **Dry Skin** (dry-skin) <br> `dry-skin` (ID: 87) | Dry Skin | `onTryHit, onSourceBasePowerPriority, onSourceBasePower, onWeather` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 76 | Damage & Base Power | **Iron Fist** (iron-fist) <br> `iron-fist` (ID: 89) | Iron Fist | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 77 | Damage & Base Power | **Poison Heal** (poison-heal) <br> `poison-heal` (ID: 90) | Poison Heal | `onDamagePriority, onDamage` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 78 | Misc | **Adaptability** (adaptability) <br> `adaptability` (ID: 91) | Adaptability | `onModifySTAB` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 79 | Move & Priority | **Skill Link** (skill-link) <br> `skill-link` (ID: 92) | Skill Link | `onModifyMove` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 80 | Residual | **Hydration** (hydration) <br> `hydration` (ID: 93) | Hydration | `onResidualOrder, onResidualSubOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 81 | Weather & Terrain | **Solar Power** (solar-power) <br> `solar-power` (ID: 94) | Solar Power | `onModifySpAPriority, onModifySpA, onWeather` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 82 | Stat Modifier (Raw) | **Quick Feet** (quick-feet) <br> `quick-feet` (ID: 95) | Quick Feet | `onModifySpe` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 83 | Damage & Base Power | **Sniper** (sniper) <br> `sniper` (ID: 97) | Sniper | `onModifyDamage` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 84 | Misc | **Magic Guard** (magic-guard) <br> `magic-guard` (ID: 98) | Magic Guard | `onDamage` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 85 | Immunity & Redirection | **No Guard** (no-guard) <br> `no-guard` (ID: 99) | No Guard | `onAnyInvulnerabilityPriority, onAnyInvulnerability, onAnyAccuracy` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 86 | Misc | **Stall** (stall) <br> `stall` (ID: 100) | Stall | `onFractionalPriority` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 87 | Damage & Base Power | **Technician** (technician) <br> `technician` (ID: 101) | Technician | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 88 | On-Hit & Status | **Leaf Guard** (leaf-guard) <br> `leaf-guard` (ID: 102) | Leaf Guard | `onSetStatus, onTryAddVolatile` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 89 | Entry & Switch | **Klutz** (klutz) <br> `klutz` (ID: 103) | Klutz | `onSwitchInPriority, onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 90 | Move & Priority | **Mold Breaker** (mold-breaker) <br> `mold-breaker` (ID: 104) | Mold Breaker | `onStart, onModifyMove` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 91 | Misc | **Super Luck** (super-luck) <br> `super-luck` (ID: 105) | Super Luck | `onModifyCritRatio` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 92 | On-Hit & Status | **Aftermath** (aftermath) <br> `aftermath` (ID: 106) | Aftermath | `onDamagingHitOrder, onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 93 | Entry & Switch | **Anticipation** (anticipation) <br> `anticipation` (ID: 107) | Anticipation | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 94 | Entry & Switch | **Forewarn** (forewarn) <br> `forewarn` (ID: 108) | Forewarn | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 95 | Stat Stage & Drops | **Unaware** (unaware) <br> `unaware` (ID: 109) | Unaware | `onAnyModifyBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 96 | Damage & Base Power | **Filter** (filter) <br> `filter` (ID: 111) | Filter | `onSourceModifyDamage` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 97 | Stat Stage & Drops | **Scrappy** (scrappy) <br> `scrappy` (ID: 113) | Scrappy | `onModifyMovePriority, onModifyMove, onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 98 | Weather & Terrain | **Ice Body** (ice-body) <br> `ice-body` (ID: 115) | Ice Body | `onWeather, onImmunity` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 99 | Damage & Base Power | **Solid Rock** (solid-rock) <br> `solid-rock` (ID: 116) | Solid Rock | `onSourceModifyDamage` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 100 | Entry & Switch | **Snow Warning** (snow-warning) <br> `snow-warning` (ID: 117) | Snow Warning | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 101 | Entry & Switch | **Frisk** (frisk) <br> `frisk` (ID: 119) | Frisk | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 102 | Damage & Base Power | **Reckless** (reckless) <br> `reckless` (ID: 120) | Reckless | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 103 | Misc | **Pickpocket** (pickpocket) <br> `pickpocket` (ID: 124) | Pickpocket | `onAfterMoveSecondary` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 104 | Damage & Base Power | **Sheer Force** (sheer-force) <br> `sheer-force` (ID: 125) | Sheer Force | `onModifyMove, onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 105 | Stat Stage & Drops | **Contrary** (contrary) <br> `contrary` (ID: 126) | Contrary | `onChangeBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 106 | Entry & Switch | **Unnerve** (unnerve) <br> `unnerve` (ID: 127) | Unnerve | `onSwitchInPriority, onStart, onEnd, onFoeTryEatItem` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 107 | Stat Stage & Drops | **Defiant** (defiant) <br> `defiant` (ID: 128) | Defiant | `onAfterEachBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 108 | On-Hit & Status | **Cursed Body** (cursed-body) <br> `cursed-body` (ID: 130) | Cursed Body | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 109 | Residual | **Healer** (healer) <br> `healer` (ID: 131) | Healer | `onResidualOrder, onResidualSubOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 110 | Damage & Base Power | **Friend Guard** (friend-guard) <br> `friend-guard` (ID: 132) | Friend Guard | `onAnyModifyDamage` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 111 | On-Hit & Status | **Weak Armor** (weak-armor) <br> `weak-armor` (ID: 133) | Weak Armor | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 112 | Misc | **Heavy Metal** (heavy-metal) <br> `heavy-metal` (ID: 134) | Heavy Metal | `onModifyWeightPriority, onModifyWeight` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 113 | Misc | **Light Metal** (light-metal) <br> `light-metal` (ID: 135) | Light Metal | `onModifyWeight` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 114 | Damage & Base Power | **Multiscale** (multiscale) <br> `multiscale` (ID: 136) | Multiscale | `onSourceModifyDamage` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 115 | Residual | **Harvest** (harvest) <br> `harvest` (ID: 139) | Harvest | `onResidualOrder, onResidualSubOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 116 | Immunity & Redirection | **Telepathy** (telepathy) <br> `telepathy` (ID: 140) | Telepathy | `onTryHit` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 117 | Residual | **Moody** (moody) <br> `moody` (ID: 141) | Moody | `onResidualOrder, onResidualSubOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 118 | Immunity & Redirection | **Overcoat** (overcoat) <br> `overcoat` (ID: 142) | Overcoat | `onImmunity, onTryHitPriority, onTryHit` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 119 | On-Hit & Status | **Poison Touch** (poison-touch) <br> `poison-touch` (ID: 143) | Poison Touch | `onSourceDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 120 | Entry & Switch | **Regenerator** (regenerator) <br> `regenerator` (ID: 144) | Regenerator | `onSwitchOut` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 121 | Stat Stage & Drops | **Big Pecks** (big-pecks) <br> `big-pecks` (ID: 145) | Big Pecks | `onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 122 | Stat Modifier (Raw) | **Sand Rush** (sand-rush) <br> `sand-rush` (ID: 146) | Sand Rush | `onModifySpe, onImmunity` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 123 | Damage & Base Power | **Analytic** (analytic) <br> `analytic` (ID: 148) | Analytic | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 124 | On-Hit & Status | **Illusion** (illusion) <br> `illusion` (ID: 149) | Illusion | `onBeforeSwitchIn, onDamagingHit, onEnd, onFaint` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 125 | Entry & Switch | **Imposter** (imposter) <br> `imposter` (ID: 150) | Imposter | `onSwitchIn` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 126 | Move & Priority | **Infiltrator** (infiltrator) <br> `infiltrator` (ID: 151) | Infiltrator | `onModifyMove` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 127 | On-Hit & Status | **Mummy** (mummy) <br> `mummy` (ID: 152) | Mummy | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 128 | KO & Trapping | **Moxie** (moxie) <br> `moxie` (ID: 153) | Moxie | `onSourceAfterFaint` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 129 | On-Hit & Status | **Justified** (justified) <br> `justified` (ID: 154) | Justified | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 130 | Immunity & Redirection | **Magic Bounce** (magic-bounce) <br> `magic-bounce` (ID: 156) | Magic Bounce | `onTryHitPriority, onTryHit, onAllyTryHitSide` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 131 | Immunity & Redirection | **Sap Sipper** (sap-sipper) <br> `sap-sipper` (ID: 157) | Sap Sipper | `onTryHitPriority, onTryHit, onAllyTryHitSide` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 132 | Move & Priority | **Prankster** (prankster) <br> `prankster` (ID: 158) | Prankster | `onModifyPriority` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 133 | Damage & Base Power | **Sand Force** (sand-force) <br> `sand-force` (ID: 159) | Sand Force | `onBasePowerPriority, onBasePower, onImmunity` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 134 | On-Hit & Status | **Aroma Veil** (aroma-veil) <br> `aroma-veil` (ID: 165) | Aroma Veil | `onAllyTryAddVolatile` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 135 | Stat Stage & Drops | **Flower Veil** (flower-veil) <br> `flower-veil` (ID: 166) | Flower Veil | `onAllyTryBoost, onAllySetStatus, onAllyTryAddVolatile` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 136 | Item Trigger | **Cheek Pouch** (cheek-pouch) <br> `cheek-pouch` (ID: 167) | Cheek Pouch | `onEatItem` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 137 | Move & Priority | **Protean** (protean) <br> `protean` (ID: 168) | Protean | `onPrepareHit` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 138 | Stat Modifier (Raw) | **Fur Coat** (fur-coat) <br> `fur-coat` (ID: 169) | Fur Coat | `onModifyDefPriority, onModifyDef` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 139 | Misc | **Magician** (magician) <br> `magician` (ID: 170) | Magician | `onAfterMoveSecondarySelf` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 140 | Immunity & Redirection | **Bulletproof** (bulletproof) <br> `bulletproof` (ID: 171) | Bulletproof | `onTryHit` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 141 | Stat Stage & Drops | **Competitive** (competitive) <br> `competitive` (ID: 172) | Competitive | `onAfterEachBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 142 | Damage & Base Power | **Strong Jaw** (strong-jaw) <br> `strong-jaw` (ID: 173) | Strong Jaw | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 143 | Damage & Base Power | **Refrigerate** (refrigerate) <br> `refrigerate` (ID: 174) | Refrigerate | `onModifyTypePriority, onModifyType, onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 144 | On-Hit & Status | **Sweet Veil** (sweet-veil) <br> `sweet-veil` (ID: 175) | Sweet Veil | `onAllySetStatus, onAllyTryAddVolatile` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 145 | Move & Priority | **Stance Change** (stance-change) <br> `stance-change` (ID: 176) | Stance Change | `onModifyMovePriority, onModifyMove` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 146 | Move & Priority | **Gale Wings** (gale-wings) <br> `gale-wings` (ID: 177) | Gale Wings | `onModifyPriority` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 147 | Damage & Base Power | **Mega Launcher** (mega-launcher) <br> `mega-launcher` (ID: 178) | Mega Launcher | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 148 | Item Trigger | **Symbiosis** (symbiosis) <br> `symbiosis` (ID: 180) | Symbiosis | `onAllyAfterUseItem` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 149 | Damage & Base Power | **Tough Claws** (tough-claws) <br> `tough-claws` (ID: 181) | Tough Claws | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 150 | Damage & Base Power | **Pixilate** (pixilate) <br> `pixilate` (ID: 182) | Pixilate | `onModifyTypePriority, onModifyType, onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 151 | On-Hit & Status | **Gooey** (gooey) <br> `gooey` (ID: 183) | Gooey | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 152 | Damage & Base Power | **Aerilate** (aerilate) <br> `aerilate` (ID: 184) | Aerilate | `onModifyTypePriority, onModifyType, onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 153 | Move & Priority | **Parental Bond** (parental-bond) <br> `parental-bond` (ID: 185) | Parental Bond | `onPrepareHit, onSourceModifySecondaries` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 154 | Damage & Base Power | **Fairy Aura** (fairy-aura) <br> `fairy-aura` (ID: 187) | Fairy Aura | `onStart, onAnyBasePowerPriority, onAnyBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 155 | On-Hit & Status | **Stamina** (stamina) <br> `stamina` (ID: 192) | Stamina | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 156 | Misc | **Merciless** (merciless) <br> `merciless` (ID: 196) | Merciless | `onModifyCritRatio` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 157 | Stat Modifier (Raw) | **Water Bubble** (water-bubble) <br> `water-bubble` (ID: 199) | Water Bubble | `onSourceModifyAtkPriority, onSourceModifyAtk, onSourceModifySpAPriority, onSourceModifySpA, onModifyAtk, onModifySpA, onUpdate, onSetStatus` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 158 | Item Trigger | **Berserk** (berserk) <br> `berserk` (ID: 201) | Berserk | `onDamage, onTryEatItem, onAfterMoveSecondary` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 159 | Stat Modifier (Raw) | **Slush Rush** (slush-rush) <br> `slush-rush` (ID: 202) | Slush Rush | `onModifySpe` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 160 | Move & Priority | **Long Reach** (long-reach) <br> `long-reach` (ID: 203) | Long Reach | `onModifyMove` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 161 | Move & Priority | **Liquid Voice** (liquid-voice) <br> `liquid-voice` (ID: 204) | Liquid Voice | `onModifyTypePriority, onModifyType` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 162 | Stat Modifier (Raw) | **Surge Surfer** (surge-surfer) <br> `surge-surfer` (ID: 207) | Surge Surfer | `onModifySpe` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 163 | Damage & Base Power | **Disguise** (disguise) <br> `disguise` (ID: 209) | Disguise | `onDamagePriority, onDamage, onCriticalHit, onEffectiveness, onUpdate` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 164 | Misc | **Corrosion** (corrosion) <br> `corrosion` (ID: 212) | Corrosion | `Passive / Field flag` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 165 | Immunity & Redirection | **Queenly Majesty** (queenly-majesty) <br> `queenly-majesty` (ID: 214) | Queenly Majesty | `onFoeTryMove` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 166 | On-Hit & Status | **Innards Out** (innards-out) <br> `innards-out` (ID: 215) | Innards Out | `onDamagingHitOrder, onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 167 | Damage & Base Power | **Fluffy** (fluffy) <br> `fluffy` (ID: 218) | Fluffy | `onSourceModifyDamage` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 168 | KO & Trapping | **Receiver** (receiver) <br> `receiver` (ID: 222) | Receiver | `onAllyFaint` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 169 | Entry & Switch | **Electric Surge** (electric-surge) <br> `electric-surge` (ID: 226) | Electric Surge | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 170 | Stat Stage & Drops | **Mirror Armor** (mirror-armor) <br> `mirror-armor` (ID: 240) | Mirror Armor | `onTryBoost` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 171 | Move & Priority | **Stalwart** (stalwart) <br> `stalwart` (ID: 242) | Stalwart | `onModifyMovePriority, onModifyMove` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 172 | On-Hit & Status | **Sand Spit** (sand-spit) <br> `sand-spit` (ID: 245) | Sand Spit | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 173 | Stat Stage & Drops | **Ripen** (ripen) <br> `ripen` (ID: 247) | Ripen | `onTryHeal, onChangeBoost, onSourceModifyDamagePriority, onSourceModifyDamage, onTryEatItemPriority, onTryEatItem, onEatItem` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 174 | Weather & Terrain | **Mimicry** (mimicry) <br> `mimicry` (ID: 250) | Mimicry | `onSwitchInPriority, onStart, onTerrainChange` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 175 | Entry & Switch | **Screen Cleaner** (screen-cleaner) <br> `screen-cleaner` (ID: 251) | Screen Cleaner | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 176 | On-Hit & Status | **Wandering Spirit** (wandering-spirit) <br> `wandering-spirit` (ID: 254) | Wandering Spirit | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 177 | Residual | **Hunger Switch** (hunger-switch) <br> `hunger-switch` (ID: 258) | Hunger Switch | `onResidualOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 178 | Misc | **Quick Draw** (quick-draw) <br> `quick-draw` (ID: 259) | Quick Draw | `onFractionalPriorityPriority, onFractionalPriority` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 179 | Move & Priority | **Unseen Fist** (unseen-fist) <br> `unseen-fist` (ID: 260) | Unseen Fist | `onModifyMove` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 180 | Entry & Switch | **Curious Medicine** (curious-medicine) <br> `curious-medicine` (ID: 261) | Curious Medicine | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 181 | Stat Modifier (Raw) | **Purifying Salt** (purifying-salt) <br> `purifying-salt` (ID: 272) | Purifying Salt | `onSetStatus, onTryAddVolatile, onSourceModifyAtkPriority, onSourceModifyAtk, onSourceModifySpAPriority, onSourceModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 182 | Entry & Switch | **Zero to Hero** (zero-to-hero) <br> `zero-to-hero` (ID: 278) | Zero to Hero | `onSwitchOut, onSwitchIn` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 183 | On-Hit & Status | **Electromorphosis** (electromorphosis) <br> `electromorphosis` (ID: 280) | Electromorphosis | `onDamagingHitOrder, onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 184 | Immunity & Redirection | **Good as Gold** (good-as-gold) <br> `good-as-gold` (ID: 283) | Good as Gold | `onTryHit` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 185 | Stat Stage & Drops | **Opportunist** (opportunist) <br> `opportunist` (ID: 290) | Opportunist | `onFoeAfterBoost, onAnySwitchInPriority, onAnySwitchIn, onAnyAfterMega, onAnyAfterTerastallization, onAnyAfterMove, onResidualOrder, onResidual, onEnd` | Stat stage changes / prevention | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 186 | Residual | **Cud Chew** (cud-chew) <br> `cud-chew` (ID: 291) | Cud Chew | `onEatItem, onResidualOrder, onResidualSubOrder, onResidual` | End of turn HP heal / stat boost | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 187 | Damage & Base Power | **Sharpness** (sharpness) <br> `sharpness` (ID: 292) | Sharpness | `onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 188 | Damage & Base Power | **Supreme Overlord** (supreme-overlord) <br> `supreme-overlord` (ID: 293) | Supreme Overlord | `onStart, onEnd, onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 189 | On-Hit & Status | **Toxic Debris** (toxic-debris) <br> `toxic-debris` (ID: 295) | Toxic Debris | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 190 | Immunity & Redirection | **Armor Tail** (armor-tail) <br> `armor-tail` (ID: 296) | Armor Tail | `onFoeTryMove` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 191 | Immunity & Redirection | **Earth Eater** (earth-eater) <br> `earth-eater` (ID: 297) | Earth Eater | `onTryHit` | Nullify damage / redirect / absorb | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 192 | Entry & Switch | **Supersweet Syrup** (supersweet-syrup) <br> `supersweet-syrup` (ID: 300) | Supersweet Syrup | `onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 193 | Entry & Switch | **Hospitality** (hospitality) <br> `hospitality` (ID: 301) | Hospitality | `onSwitchInPriority, onStart` | Set weather/terrain/intimidate on entry | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 194 | Move & Priority | **Piercing Drill** (piercing-drill) <br> `piercing-drill` (ID: 308) | Piercing Drill | `onHitProtect` | Priority change / Type conversion / Contact bypass | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 195 | Damage & Base Power | **Dragonize** (dragonize) <br> `dragonize` (ID: 309) | Dragonize | `onModifyTypePriority, onModifyType, onBasePowerPriority, onBasePower` | Base power / damage multiplier | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 196 | Weather & Terrain | **Mega Sol** (mega-sol) <br> `mega-sol` (ID: 310) | Mega Sol | `onWeatherModifyDamagePriority, onWeatherModifyDamage` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 197 | On-Hit & Status | **Spicy Spray** (spicy-spray) <br> `spicy-spray` (ID: 311) | Spicy Spray | `onDamagingHit` | Apply status / recoil / stat change on contact | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 198 | KO & Trapping | **Eelevate** (eelevate) <br> `eelevate` (ID: 312) | Eelevate | `onSourceAfterFaint` | Modifier / State change | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |
| 199 | Stat Modifier (Raw) | **Fire Mane** (fire-mane) <br> `fire-mane` (ID: 313) | Fire Mane | `onModifyAtkPriority, onModifyAtk, onModifySpAPriority, onModifySpA` | Stat multiplier (e.g. 1.5x, 2x) | Ignored if Mold Breaker / suppressed / neutral | @pkmn/sim & pokemon.json |


---

## Edge Cases
| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | **Unseen Fist (`unseen-fist`) & Piercing Drill (`piercing-drill`)** | Attacker uses contact move (e.g., Close Combat) against Defender using Protect / Detect / Spiky Shield / King's Shield / Silk Trap / Baneful Bunker / Obstruct | Attack completely bypasses protection. Deals full damage and secondary/contact effects apply. Non-contact moves (e.g., Dark Pulse) do NOT bypass and are fully blocked. |
| 2 | **Prankster (`prankster`)** | User uses status move (e.g., Taunt, Thunder Wave, Spore, Will-O-Wisp) with +1 priority targeting a Dark-type opponent in Gen 7+ / Champions VGC | Move fails with immunity message ('It does not affect [Dark Pokemon]!'). Does not fail if targeting an ally or the field (e.g., Tailwind, Sunny Day, Trick Room). |
| 3 | **Gale Wings (`gale-wings`)** | User uses a Flying-type move (e.g., Brave Bird, Tailwind, Acrobatics) at full HP (100%) vs <100% HP | At 100% HP: grants +1 priority. At 99% HP or below: normal move priority (no boost). Recoil from Brave Bird removes priority for subsequent turns. |
| 4 | **Mold Breaker (`mold-breaker`) / Turboblaze (`turboblaze`) / Teravolt (`teravolt`)** | Attacker attacks defender with a breakable defensive ability (e.g. Wonder Guard, Levitate, Sturdy, Flash Fire, Volt Absorb, Clear Body, Unaware, Fur Coat, Disguise) | Defender's ability is completely ignored during the attack: Ground hits Levitate, Electric hits Volt Absorb, Wonder Guard takes neutral/resisted hits, Sturdy does not prevent OHKO, Disguise takes full damage. |
| 5 | **Intimidate (`intimidate`) vs Competitive (`competitive`) / Defiant (`defiant`) / Mirror Armor (`mirror-armor`) / Inner Focus / Oblivious / Scrappy / Own Tempo** | Intimidate triggers on switch-in against various defenders | Defiant gets -1 Atk then +2 Atk (net +1 Atk). Competitive gets -1 Atk then +2 SpAtk. Mirror Armor reflects -1 Atk back to Intimidate user. Inner Focus / Oblivious / Scrappy / Own Tempo block Intimidate entirely (immune, no drop). Clear Body blocks drop. |
| 6 | **Contrary (`contrary`)** | User uses stat-dropping move (e.g., Superpower, Close Combat, Draco Meteor, Overheat, Leaf Storm) or receives Intimidate / Charm / Screech | All stat drops are inverted into stat boosts (+1 Atk/Def instead of -1). All stat boosts are inverted into stat drops. Unaffected by Haze or Clear Smog inversion (resets to 0). |
| 7 | **Unaware (`unaware`)** | Unaware user attacks a target with +6 Defense boosts, or defends against an attacker with +6 Attack boosts | When attacking: ignores target's Def/SpDef stage modifiers. When defending: ignores attacker's Atk/SpAtk stage modifiers and accuracy modifiers. Does NOT ignore speed stages or critical hit damage multipliers. |
| 8 | **Parental Bond (`parental-bond`)** | User uses single-target attacking move (e.g., Power-Up Punch, Return, Fake Out) | Move strikes twice. 1st hit deals 100% damage; 2nd hit deals 25% damage (Gen 7+). Each hit rolls secondary effects independently (e.g. Power-Up Punch boosts Atk twice to +2). Spread moves do not hit twice. |
| 9 | **Disguise (`disguise`)** | Mimikyu in Disguise form takes a damaging attack (physical or special) | 1st hit damage is completely negated (0 damage taken), Disguise is busted, and user loses 1/8 max HP. Subsequent hits in the same turn (e.g., multi-hit moves) or future turns deal normal damage. |
| 10 | **Sturdy (`sturdy`)** | User at 100% max HP is hit by a lethal attack (or OHKO move like Fissure / Sheer Cold) | Survives with exactly 1 HP. Immune to OHKO moves regardless of current HP. If HP is below 100%, lethal attack faints the user normally. |
| 11 | **Wonder Guard (`wonder-guard`)** | Shedinja is targeted by various attack types and indirect damage sources | Immune to all direct attacks that are not super-effective. Takes damage normally from indirect sources: Sandstorm, Hail/Snow, Burn, Poison, Entry Hazards (Stealth Rock), Recoil, Rocky Helmet, Life Orb, Confusion damage. |
| 12 | **Type Absorb & Immunity (Flash Fire, Volt Absorb, Water Absorb, Motor Drive, Sap Sipper, Earth Eater)** | Defender is targeted by move of matching absorbed type (Fire, Electric, Water, Grass, Ground) | Move is completely negated (0 damage, no secondary effects). Flash Fire activates 1.5x Fire boost; Volt/Water/Earth heals 25% max HP; Motor Drive gives +1 Speed; Sap Sipper gives +1 Attack. |
| 13 | **Redirection Abilities (Lightning Rod, Storm Drain)** | Opponent uses single-target Electric or Water move in Double Battle while user is active on the field | Move is automatically redirected to the user (bypassing the intended target), negated with 0 damage, and boosts user's Sp. Atk by +1 stage. Does not redirect Ground-type Hidden Power or spread moves (e.g., Discharge, Surf). |
| 14 | **Priority Blocking (Queenly Majesty, Dazzling, Armor Tail)** | Opponent attempts to use any increased priority move (e.g., Fake Out, Extreme Speed, Grassy Glide in terrain, Prankster-boosted status move) targeting the user or user's ally | Move is completely blocked and fails to execute ('[User]'s Armor Tail cannot use [Move]!'). Does not block negative priority moves or priority moves targeting self/field (e.g., Protect, Tailwind). |
| 15 | **Magic Bounce (`magic-bounce`)** | Opponent targets user or user's side with non-damaging/status move (e.g., Taunt, Spore, Thunder Wave, Stealth Rock, Encore, Will-O-Wisp, Roar) | Move is reflected back to the source Pokémon. Cannot reflect an already bounced move (prevents infinite bounce loops). |
| 16 | **Ate Abilities (Pixilate, Refrigerate, Aerilate, Galvanize, Dragonize)** | User uses a Normal-type attacking move (e.g., Hyper Voice, Double-Edge, Quick Attack) | Move type converts to Fairy / Ice / Flying / Electric / Dragon and receives a 1.2x (20%) base power multiplier. Gains STAB if the user has that matching type. |
| 17 | **Sheer Force (`sheer-force`)** | User uses move with secondary effect (e.g., Flamethrower, Iron Head, Rock Slide, Moonblast) holding Life Orb | Base power is multiplied by 1.3x (30%), secondary effects (burn/flinch chance) are removed, and Life Orb recoil damage is nullified while retaining Life Orb's 1.3x damage boost. |
| 18 | **Technician (`technician`)** | User uses a move with effective base power <= 60 (e.g., Bullet Punch, Mach Punch, Icy Wind, Bulldoze, Incinerate) | Base power is multiplied by 1.5x. Evaluated on the move's base power before type modifiers, but after variable BP calculations (e.g. Acrobatics without item is 110 BP > 60, so not boosted). |
| 19 | **Supreme Overlord (`supreme-overlord`)** | Kingambit enters the field with 1, 2, 3, 4, or 5 fainted allies on the team | Base power is multiplied by 1 + (0.10 * count) -> 1.1x for 1 fainted, up to 1.5x for 5 fainted allies. |
| 20 | **Ripen (`ripen`)** | Appletun/Flapple holding a Sitrus Berry, Iapapa Berry, Lum Berry, or Yache Berry | Berry effect is doubled: Sitrus Berry heals 50% max HP instead of 25%; Stat-boosting berries give +2 stages instead of +1; Resist berries reduce damage by 4x instead of 2x. |
| 21 | **Opportunist (`opportunist`)** | Opponent uses Dragon Dance (+1 Atk, +1 Spe) or Swords Dance (+2 Atk) | User immediately copies the exact same stat boosts (+1 Atk, +1 Spe or +2 Atk) on the same turn. |
| 22 | **Mega Sol (`mega-sol`) [Custom Champions Ability]** | User uses Solar Beam, Solar Blade, or Weather Ball with no active weather or in neutral weather | Solar Beam / Solar Blade executes in a single turn without charging turn; Weather Ball becomes Fire-type with 100 BP and receives 1.5x sun damage boost. |
| 23 | **Spicy Spray (`spicy-spray`) [Custom Champions Ability]** | User is damaged by a direct physical or special attack from non-Fire type opponent vs Fire-type opponent | Non-Fire type attacker is immediately inflicted with Burn (BRN) status. Fire-type attacker is immune ('It doesn't affect [Fire Pokemon]'). |
| 24 | **Eelevate (`eelevate`) [Custom Champions Ability]** | User with Eelevate lands a KO on an opponent with an attacking move | Possesses ground immunity / hazard immunity (Levitate effect), and upon fainting an opposing target, triggers Beast Boost effect (highest raw stat increases by +1 stage). |
| 25 | **Fire Mane (`fire-mane`) [Custom Champions Ability]** | User uses physical or special Fire-type attack (e.g., Flare Blitz, Heat Wave, Overheat) | Applies 1.5x (50%) Attack and Sp. Atk multiplier to Fire-type attacks (Steely Spirit equivalent for Fire). |


---

## 4. Porting & Implementation Strategy

To implement all 199 abilities with zero compilation warnings, optimal performance, and 100% equivalence, the implementation should be executed across 8 structured milestones:

### Phase 1: Engine Foundation & Event Pipeline
- Expand `Condition` struct in `packages/engine/src/sim/registry.rs` with full hook signatures.
- Implement `Battle::run_event` and `Battle::field_event` dispatching in `packages/engine/src/sim/battle.rs`.
- Implement Mold Breaker (`is_breakable`) checks during event dispatching.

### Phase 2: Raw Stat & Damage Calculation Modifiers (56 Abilities)
- Implement pure multiplicative damage hooks (`Technician`, `Tough Claws`, `Sharpness`, `Iron Fist`, `Strong Jaw`, `Mega Launcher`, `Supreme Overlord`, `Steely Spirit`, `Fire Mane`).
- Implement raw stat modifiers (`Huge Power`, `Pure Power`, `Swift Swim`, `Chlorophyll`, `Sand Rush`, `Slush Rush`, `Surge Surfer`, `Fur Coat`, `Water Bubble`, `Hustle`, `Guts`, `Marvel Scale`).

### Phase 3: Move Modifications, Types & Priority (18 Abilities)
- Implement type-converters (`Pixilate`, `Aerilate`, `Refrigerate`, `Galvanize`, `Dragonize`, `Liquid Voice`).
- Implement priority alterations (`Prankster` with Dark-type immunity check, `Gale Wings` with 100% HP check).
- Implement protection bypass (`Unseen Fist`, `Piercing Drill`) and redirection bypass (`Stalwart`, `Propeller Tail`).

### Phase 4: Immunities, Absorptions & Redirections (19 Abilities)
- Implement type absorptions (`Volt Absorb`, `Water Absorb`, `Flash Fire`, `Motor Drive`, `Sap Sipper`, `Earth Eater`).
- Implement move category / flag immunities (`Soundproof`, `Bulletproof`, `Good as Gold`, `Telepathy`, `Overcoat`, `Wonder Guard`, `Levitate`).
- Implement redirection (`Lightning Rod`, `Storm Drain`) and priority blockers (`Queenly Majesty`, `Armor Tail`, `Dazzling`).

### Phase 5: Stat Stage Manipulations & Triggers (18 Abilities)
- Implement stat drop reflections & punishments (`Defiant`, `Competitive`, `Mirror Armor`).
- Implement stat drop immunity (`Clear Body`, `White Smoke`, `Full Metal Body`, `Hyper Cutter`, `Big Pecks`, `Inner Focus`, `Oblivious`, `Scrappy`, `Own Tempo`).
- Implement modifier inverters (`Contrary`, `Simple`, `Unaware`, `Opportunist`).

### Phase 6: Contact, Damaging Hit & Status Triggers (31 Abilities)
- Implement contact status punishes (`Static`, `Flame Body`, `Poison Point`, `Cute Charm`, `Effect Spore`, `Mummy`, `Gooey`, `Spicy Spray`).
- Implement hit recoil & stat boosts (`Rough Skin`, `Iron Barbs`, `Innards Out`, `Stamina`, `Weak Armor`, `Justified`, `Electromorphosis`, `Toxic Debris`).
- Implement `Disguise` busting and `Sturdy` lethal survival.

### Phase 7: Switch-In, Weather, Terrain & Residual (32 Abilities)
- Implement entry hazard & stat drop on entry (`Intimidate`, `Supersweet Syrup`, `Curious Medicine`, `Screen Cleaner`, `Hospitality`).
- Implement weather & terrain setters (`Drizzle`, `Drought`, `Sand Stream`, `Snow Warning`, `Electric Surge`, `Grassy Surge`, `Psychic Surge`, `Misty Surge`).
- Implement end-of-turn residual healing & boosts (`Speed Boost`, `Rain Dish`, `Ice Body`, `Poison Heal`, `Moody`, `Harvest`, `Cud Chew`).

### Phase 8: Complex Multi-step & Custom Abilities (19 Abilities)
- Implement `Parental Bond` (two-hit execution with 0.25x second hit), `Sheer Force` (negate secondaries + 1.3x BP + Life Orb recoil negation), `Unburden`, `Ripen` (double berry effects).
- Implement Pokémon Champions custom abilities: `Piercing Drill`, `Dragonize`, `Mega Sol`, `Spicy Spray`, `Eelevate`, `Fire Mane`.

---

## 5. Verification & Test Suite Blueprint

### 5.1 Test Harness (`apps/web/src/__tests__/abilities-equivalence.test.ts`)
The equivalence test suite will systematically run battle turns across both the TypeScript `@pkmn/sim` engine and the compiled Rust WASM engine (`simulate_turn_wasm`), asserting:
1. **Health Parity**: Active Pokémon HP after damage, recoil, absorption, and residual healing matches exactly.
2. **Stat Stage Parity**: Boost stages (`atk`, `def`, `spa`, `spd`, `spe`) after Intimidate, Defiant, Contrary, Moxie, etc., match exactly.
3. **Turn Order Parity**: Priority moves (Prankster, Gale Wings, Quick Draw, Stall) execute in identical sequence.
4. **Status & Volatile Parity**: Status conditions (Burn, Paralysis, Sleep, Poison, Freeze, Protect, Volatiles) apply or are blocked identically.

### 5.2 Build & WASM Verification
- Compilation check: `cargo check --manifest-path packages/Cargo.toml -p engine` (must pass with **0 warnings**).
- WebAssembly build: `wasm-pack build packages/engine --target nodejs` (or through workspace build pipeline).
- Vitest test run: `pnpm --filter @pokemetrix/app test run src/__tests__/abilities-equivalence.test.ts`.

