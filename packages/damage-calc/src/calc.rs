use wasm_bindgen::prelude::*;

use crate::types::{DamageInput, DamageOutput, Type};

// ---------------------------------------------------------------------------
// Rounding primitives
// ---------------------------------------------------------------------------

/// 32-bit register mask. The 3DS performs damage math with 32-bit registers, so
/// intermediate products wrap at 2^32 (this is real, observable behaviour).
const U32_MASK: u64 = 0xFFFF_FFFF;

/// "pokeRound": round to nearest, but round *down* on an exact .5.
///
/// Applied whenever a modifier is applied as `value * modifier / 4096`.
fn poke_round_div_4096(numerator: u64) -> u64 {
    let quotient = numerator / 4096;
    let remainder = numerator % 4096;
    // Round up only when the fractional part is strictly greater than 0.5.
    if remainder * 2 > 4096 {
        quotient + 1
    } else {
        quotient
    }
}

/// Apply a single `x / 4096` modifier to a value using pokeRounding, honouring
/// 32-bit overflow on the multiplication. The modifier is `u32` because a
/// chained modifier can exceed the `u16` range.
fn apply_modifier(value: u64, modifier: u32) -> u64 {
    let product = (value * modifier as u64) & U32_MASK;
    poke_round_div_4096(product)
}

/// Chain modifiers together using normal (round-half-up) rounding, starting from
/// 4096. Returns the combined modifier (still scaled by 4096).
fn chain_modifiers(modifiers: &[u16]) -> u32 {
    let mut combined: u64 = 4096;
    for &m in modifiers {
        // normalRound(combined * m / 4096) == (combined * m + 2048) >> 12
        combined = (combined * m as u64 + 2048) / 4096;
    }
    combined as u32
}

/// Clamp a stat/base-power to the game's [1, 65535] window (values above 65535
/// wrap via modulo 65536; values below 1 become 1).
fn clamp_stat(value: u64) -> u64 {
    let value = if value < 1 { 1 } else { value };
    if value > 65535 {
        value % 65536
    } else {
        value
    }
}

// ---------------------------------------------------------------------------
// Stat stage multipliers
// ---------------------------------------------------------------------------

/// Numerator/denominator for an Attack/Defence/Speed stat stage (-6..=6).
fn stage_fraction(stage: i8) -> (u64, u64) {
    let s = stage.clamp(-6, 6);
    if s >= 0 {
        (2 + s as u64, 2)
    } else {
        (2, 2 + (-s) as u64)
    }
}

// ---------------------------------------------------------------------------
// Type effectiveness
// ---------------------------------------------------------------------------

/// Single-matchup effectiveness, encoded as `multiplier * 100`
/// (200 = 2x, 100 = 1x, 50 = 0.5x, 0 = immune).
fn single_matchup(attack_type: Type, defend_type: Type) -> u32 {
    use Type::*;
    match (attack_type, defend_type) {
        (Fire, Grass) | (Fire, Ice) | (Fire, Bug) | (Fire, Steel) => 200,
        (Fire, Fire) | (Fire, Water) | (Fire, Rock) | (Fire, Dragon) => 50,
        (Water, Fire) | (Water, Ground) | (Water, Rock) => 200,
        (Water, Water) | (Water, Grass) | (Water, Dragon) => 50,
        (Electric, Water) | (Electric, Flying) => 200,
        (Electric, Electric) | (Electric, Grass) | (Electric, Dragon) => 50,
        (Electric, Ground) => 0,
        (Grass, Water) | (Grass, Ground) | (Grass, Rock) => 200,
        (Grass, Fire)
        | (Grass, Grass)
        | (Grass, Poison)
        | (Grass, Flying)
        | (Grass, Bug)
        | (Grass, Dragon)
        | (Grass, Steel) => 50,
        (Ice, Grass) | (Ice, Ground) | (Ice, Flying) | (Ice, Dragon) => 200,
        (Ice, Fire) | (Ice, Water) | (Ice, Ice) | (Ice, Steel) => 50,
        (Fighting, Normal)
        | (Fighting, Ice)
        | (Fighting, Rock)
        | (Fighting, Dark)
        | (Fighting, Steel) => 200,
        (Fighting, Poison)
        | (Fighting, Flying)
        | (Fighting, Psychic)
        | (Fighting, Bug)
        | (Fighting, Fairy) => 50,
        (Fighting, Ghost) => 0,
        (Poison, Grass) | (Poison, Fairy) => 200,
        (Poison, Poison) | (Poison, Ground) | (Poison, Rock) | (Poison, Ghost) => 50,
        (Poison, Steel) => 0,
        (Ground, Fire)
        | (Ground, Electric)
        | (Ground, Poison)
        | (Ground, Rock)
        | (Ground, Steel) => 200,
        (Ground, Grass) | (Ground, Bug) => 50,
        (Ground, Flying) => 0,
        (Flying, Grass) | (Flying, Fighting) | (Flying, Bug) => 200,
        (Flying, Electric) | (Flying, Rock) | (Flying, Steel) => 50,
        (Psychic, Fighting) | (Psychic, Poison) => 200,
        (Psychic, Psychic) | (Psychic, Steel) => 50,
        (Psychic, Dark) => 0,
        (Bug, Grass) | (Bug, Psychic) | (Bug, Dark) => 200,
        (Bug, Fire)
        | (Bug, Fighting)
        | (Bug, Flying)
        | (Bug, Ghost)
        | (Bug, Steel)
        | (Bug, Fairy) => 50,
        (Rock, Fire) | (Rock, Ice) | (Rock, Flying) | (Rock, Bug) => 200,
        (Rock, Fighting) | (Rock, Ground) | (Rock, Steel) => 50,
        (Ghost, Psychic) | (Ghost, Ghost) => 200,
        (Ghost, Dark) => 50,
        (Ghost, Normal) => 0,
        (Dragon, Dragon) => 200,
        (Dragon, Steel) => 50,
        (Dragon, Fairy) => 0,
        (Dark, Psychic) | (Dark, Ghost) => 200,
        (Dark, Fighting) | (Dark, Dark) | (Dark, Fairy) => 50,
        (Steel, Ice) | (Steel, Rock) | (Steel, Fairy) => 200,
        (Steel, Fire) | (Steel, Water) | (Steel, Electric) | (Steel, Steel) => 50,
        (Fairy, Fighting) | (Fairy, Dragon) | (Fairy, Dark) => 200,
        (Fairy, Fire) | (Fairy, Poison) | (Fairy, Steel) => 50,
        (Normal, Rock) | (Normal, Steel) => 50,
        (Normal, Ghost) => 0,
        _ => 100,
    }
}

/// Convert a single matchup (`*100`) to a power-of-two shift, or `None` when the
/// matchup is an immunity.
fn matchup_shift(matchup: u32) -> Option<i32> {
    match matchup {
        0 => None,
        50 => Some(-1),
        200 => Some(1),
        _ => Some(0),
    }
}

fn combined_immune(attack_type: Type, type1: Type, type2: Option<Type>) -> bool {
    single_matchup(attack_type, type1) == 0
        || type2.is_some_and(|t| single_matchup(attack_type, t) == 0)
}

fn combined_shift(attack_type: Type, type1: Type, type2: Option<Type>) -> i32 {
    let s1 = matchup_shift(single_matchup(attack_type, type1)).unwrap_or(0);
    let s2 = type2
        .and_then(|t| matchup_shift(single_matchup(attack_type, t)))
        .unwrap_or(0);
    s1 + s2
}

/// Combined type-effectiveness shift for a (possibly dual-type) defender.
/// Positive = super effective (2^n x), negative = resisted (÷2^n).
#[wasm_bindgen]
pub fn type_effectiveness_shift(att: Type, def1: Type, def2: Option<Type>) -> i32 {
    combined_shift(att, def1, def2)
}

/// Whether the move is completely ineffective against the defender.
#[wasm_bindgen]
pub fn is_immune(att: Type, def1: Type, def2: Option<Type>) -> bool {
    combined_immune(att, def1, def2)
}

// ---------------------------------------------------------------------------
// Core stat / base-damage resolution
// ---------------------------------------------------------------------------

fn resolve_base_power(input: &DamageInput) -> u64 {
    let combined = chain_modifiers(&input.bp_modifiers);
    let product = (input.base_power as u64 * combined as u64) & U32_MASK;
    clamp_stat(poke_round_div_4096(product))
}

fn resolve_attack(input: &DamageInput) -> u64 {
    // On a critical hit, negative attack boosts are ignored.
    let stage = if input.is_crit && input.attack_boost < 0 {
        0
    } else {
        input.attack_boost
    };
    let (num, den) = stage_fraction(stage);
    let boosted = input.attack as u64 * num / den; // floor
    let combined = chain_modifiers(&input.attack_modifiers);
    clamp_stat(apply_modifier(boosted, combined))
}

fn resolve_defense(input: &DamageInput) -> u64 {
    // On a critical hit, positive defence boosts are ignored.
    let stage = if input.is_crit && input.defense_boost > 0 {
        0
    } else {
        input.defense_boost
    };
    let (num, den) = stage_fraction(stage);
    let boosted = input.defense as u64 * num / den; // floor
    let combined = chain_modifiers(&input.defense_modifiers);
    clamp_stat(apply_modifier(boosted, combined))
}

/// Base damage: floor(floor(floor(2*level/5 + 2) * bp * atk / def) / 50) + 2.
fn base_damage(level: u8, base_power: u64, attack: u64, defense: u64) -> u64 {
    let level = level as u64;
    let level_factor = 2 * level / 5 + 2;
    let inner = (level_factor * base_power * attack / defense) / 50;
    inner + 2
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/// Run the full damage calculation and return all 16 rolls plus min/max.
pub fn calculate_input(input: &DamageInput) -> DamageOutput {
    // Status moves / zero-power → no damage.
    if input.base_power == 0 {
        return DamageOutput {
            rolls: vec![0; 16],
            min: 0,
            max: 0,
        };
    }

    // Type immunity short-circuits to 0 (the one-damage check does NOT apply).
    let immune = input.immune_override.unwrap_or_else(|| {
        combined_immune(input.move_type, input.defender_type1, input.defender_type2)
    });
    if immune {
        return DamageOutput {
            rolls: vec![0; 16],
            min: 0,
            max: 0,
        };
    }

    let base_power = resolve_base_power(input);
    let attack = resolve_attack(input);
    let defense = resolve_defense(input).max(1);

    let base = base_damage(input.level, base_power, attack, defense);

    // General damage modifiers that are independent of the random roll are
    // applied once, before branching into the 16 rolls.
    let mut pre = base;
    pre = apply_modifier(pre, input.spread_modifier as u32);
    pre = apply_modifier(pre, input.parental_bond_modifier as u32);
    pre = apply_modifier(pre, input.weather_modifier as u32);
    if input.is_crit {
        pre = apply_modifier(pre, input.crit_modifier as u32);
    }

    let effectiveness_shift = input.effectiveness_override.unwrap_or_else(|| {
        combined_shift(input.move_type, input.defender_type1, input.defender_type2)
    });
    let final_combined = chain_modifiers(&input.final_modifiers);

    let mut rolls: Vec<u32> = Vec::with_capacity(16);
    // Ascending: factor 15 (min) .. factor 0 (max).
    for i in 0..16u32 {
        let factor = 15 - i;
        // Random factor: floor(current * (100 - factor) / 100), 32-bit overflow.
        let after_random = ((pre * (100 - factor as u64)) & U32_MASK) / 100;
        // STAB
        let mut v = apply_modifier(after_random, input.stab_modifier as u32);
        // Type effectiveness (bit shift, not a /4096 modifier)
        v = if effectiveness_shift >= 0 {
            v << effectiveness_shift
        } else {
            v >> (-effectiveness_shift)
        };
        // Burn
        if input.is_burned && input.is_physical {
            v = apply_modifier(v, 2048);
        }
        // Final modifiers
        v = apply_modifier(v, final_combined);
        // Z-move into protect
        v = apply_modifier(v, input.protect_modifier as u32);
        // One-damage check
        if v == 0 {
            v = 1;
        }
        // 65,535 overflow check
        if v > 65535 {
            v %= 65536;
        }
        rolls.push(v as u32);
    }

    let min = *rolls.first().unwrap();
    let max = *rolls.last().unwrap();
    DamageOutput { rolls, min, max }
}

/// WASM entry point: JSON in, JSON out.
#[wasm_bindgen]
pub fn calculate(input: JsValue) -> Result<JsValue, JsValue> {
    let input: DamageInput = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&format!("invalid DamageInput: {e}")))?;
    let output = calculate_input(&input);
    serde_wasm_bindgen::to_value(&output).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{DamageInput, Type, NEUTRAL_MODIFIER};

    /// A minimal neutral input; individual tests tweak the fields they need.
    fn input(
        level: u8,
        base_power: u16,
        attack: u16,
        defense: u16,
        is_physical: bool,
        move_type: Type,
        t1: Type,
        t2: Option<Type>,
    ) -> DamageInput {
        DamageInput {
            level,
            base_power,
            bp_modifiers: vec![],
            attack,
            attack_boost: 0,
            attack_modifiers: vec![],
            defense,
            defense_boost: 0,
            defense_modifiers: vec![],
            is_physical,
            move_type,
            defender_type1: t1,
            defender_type2: t2,
            effectiveness_override: None,
            immune_override: None,
            spread_modifier: NEUTRAL_MODIFIER,
            parental_bond_modifier: NEUTRAL_MODIFIER,
            weather_modifier: NEUTRAL_MODIFIER,
            is_crit: false,
            crit_modifier: 6144,
            stab_modifier: NEUTRAL_MODIFIER,
            is_burned: false,
            final_modifiers: vec![],
            protect_modifier: NEUTRAL_MODIFIER,
        }
    }

    #[test]
    fn rounding_modes() {
        // pokeRound floors on exact .5: 118 * 3072 / 4096 = 88.5 -> 88
        assert_eq!(poke_round_div_4096(118 * 3072), 88);
        // 85 * 7301 / 4096 = 151.51 -> 152 (fraction > .5)
        assert_eq!(poke_round_div_4096(85 * 7301), 152);
    }

    #[test]
    fn chaining_examples() {
        // Final modifier chain from the dissertation: Reflect, Shadow Shield,
        // Friend Guard, Life Orb -> 1332.
        assert_eq!(chain_modifiers(&[2732, 2048, 3072, 5324]), 1332);
        // Base-power chain: Zap Plate, Helping Hand, Charge, Electric Terrain,
        // Mud Sport -> 7301.
        assert_eq!(chain_modifiers(&[4915, 6144, 8192, 6144, 1352]), 7301);
    }

    #[test]
    fn incineroar_uturn_base_damage() {
        // Floor formula example: level 50, 70 BP, 136 Atk, 100 Def -> 43.
        assert_eq!(base_damage(50, 70, 136, 100), 43);
    }

    #[test]
    fn kyogre_water_spout_vs_amoonguss() {
        // 252+ SpA Primal Kyogre (255) Water Spout (150 BP) vs 252 HP / 252+ SpD
        // Amoonguss (145 SpD), in Rain, spread move in doubles -> 84–99.
        let mut inp = input(
            50,
            150,
            255,
            145,
            false,
            Type::Water,
            Type::Grass,
            Some(Type::Poison),
        );
        inp.spread_modifier = 3072;
        inp.weather_modifier = 6144;
        inp.stab_modifier = 6144;
        let out = calculate_input(&inp);
        assert_eq!(out.min, 84);
        assert_eq!(out.max, 99);
        // Full roll set from the dissertation.
        assert_eq!(
            out.rolls,
            vec![84, 84, 85, 87, 87, 88, 90, 90, 91, 93, 93, 94, 96, 96, 97, 99]
        );
    }

    #[test]
    fn mega_rayquaza_dragon_ascent_vs_lunala() {
        // 252 Atk Life Orb Mega Rayquaza (232) Dragon Ascent (120 BP, Flying) vs
        // Shadow Shield Lunala (109 Def) through Reflect + Friend Guard -> 47–56.
        let mut inp = input(
            50,
            120,
            232,
            109,
            true,
            Type::Flying,
            Type::Psychic,
            Some(Type::Ghost),
        );
        inp.stab_modifier = 6144; // Rayquaza is Dragon/Flying
                                  // Reflect (doubles-agnostic value used in the example), Shadow Shield,
                                  // Friend Guard, Life Orb.
        inp.final_modifiers = vec![2732, 2048, 3072, 5324];
        let out = calculate_input(&inp);
        assert_eq!(out.min, 47);
        assert_eq!(out.max, 56);
        assert_eq!(
            out.rolls,
            vec![47, 48, 48, 49, 49, 50, 50, 51, 52, 52, 53, 53, 54, 54, 55, 56]
        );
    }

    #[test]
    fn immunity_deals_zero() {
        let inp = input(50, 80, 100, 100, true, Type::Normal, Type::Ghost, None);
        let out = calculate_input(&inp);
        assert_eq!(out.min, 0);
        assert_eq!(out.max, 0);
    }

    #[test]
    fn zero_power_deals_zero() {
        let inp = input(50, 0, 100, 100, true, Type::Normal, Type::Normal, None);
        let out = calculate_input(&inp);
        assert_eq!(out.max, 0);
    }

    #[test]
    fn crit_ignores_negative_attack_boost() {
        let mut inp = input(50, 80, 200, 100, true, Type::Normal, Type::Normal, None);
        inp.attack_boost = -2;
        let no_crit = calculate_input(&inp);
        inp.is_crit = true;
        inp.crit_modifier = NEUTRAL_MODIFIER; // isolate the boost-ignoring behaviour
        let crit = calculate_input(&inp);
        // Ignoring the -2 drop raises effective attack, so damage increases.
        assert!(crit.max > no_crit.max);
    }

    #[test]
    fn stage_fractions() {
        assert_eq!(stage_fraction(0), (2, 2));
        assert_eq!(stage_fraction(1), (3, 2));
        assert_eq!(stage_fraction(6), (8, 2));
        assert_eq!(stage_fraction(-1), (2, 3));
        assert_eq!(stage_fraction(-6), (2, 8));
    }
}
