use wasm_bindgen::prelude::*;

use crate::types::{DamageResult, Move, MoveCategory, Stats, Type};

/// Type-effectiveness multiplier table.
/// Returns the multiplier * 100 (e.g., 200 = 2x, 50 = 0.5x, 0 = immune).
fn type_effectiveness(attack_type: Type, defend_type: Type) -> u32 {
    use Type::*;
    match (attack_type, defend_type) {
        // Fire
        (Fire, Grass) | (Fire, Ice) | (Fire, Bug) | (Fire, Steel) => 200,
        (Fire, Fire) | (Fire, Water) | (Fire, Rock) | (Fire, Dragon) => 50,
        // Water
        (Water, Fire) | (Water, Ground) | (Water, Rock) => 200,
        (Water, Water) | (Water, Grass) | (Water, Dragon) => 50,
        // Electric
        (Electric, Water) | (Electric, Flying) => 200,
        (Electric, Electric) | (Electric, Grass) | (Electric, Dragon) => 50,
        (Electric, Ground) => 0,
        // Grass
        (Grass, Water) | (Grass, Ground) | (Grass, Rock) => 200,
        (Grass, Fire) | (Grass, Grass) | (Grass, Poison) | (Grass, Flying) | (Grass, Bug) | (Grass, Dragon) | (Grass, Steel) => 50,
        // Ice
        (Ice, Grass) | (Ice, Ground) | (Ice, Flying) | (Ice, Dragon) => 200,
        (Ice, Fire) | (Ice, Water) | (Ice, Ice) | (Ice, Steel) => 50,
        // Fighting
        (Fighting, Normal) | (Fighting, Ice) | (Fighting, Rock) | (Fighting, Dark) | (Fighting, Steel) => 200,
        (Fighting, Poison) | (Fighting, Flying) | (Fighting, Psychic) | (Fighting, Bug) | (Fighting, Fairy) => 50,
        (Fighting, Ghost) => 0,
        // Poison
        (Poison, Grass) | (Poison, Fairy) => 200,
        (Poison, Poison) | (Poison, Ground) | (Poison, Rock) | (Poison, Ghost) => 50,
        (Poison, Steel) => 0,
        // Ground
        (Ground, Fire) | (Ground, Electric) | (Ground, Poison) | (Ground, Rock) | (Ground, Steel) => 200,
        (Ground, Grass) | (Ground, Bug) => 50,
        (Ground, Flying) => 0,
        // Flying
        (Flying, Grass) | (Flying, Fighting) | (Flying, Bug) => 200,
        (Flying, Electric) | (Flying, Rock) | (Flying, Steel) => 50,
        // Psychic
        (Psychic, Fighting) | (Psychic, Poison) => 200,
        (Psychic, Psychic) | (Psychic, Steel) => 50,
        (Psychic, Dark) => 0,
        // Bug
        (Bug, Grass) | (Bug, Psychic) | (Bug, Dark) => 200,
        (Bug, Fire) | (Bug, Fighting) | (Bug, Flying) | (Bug, Ghost) | (Bug, Steel) | (Bug, Fairy) => 50,
        // Rock
        (Rock, Fire) | (Rock, Ice) | (Rock, Flying) | (Rock, Bug) => 200,
        (Rock, Fighting) | (Rock, Ground) | (Rock, Steel) => 50,
        // Ghost
        (Ghost, Psychic) | (Ghost, Ghost) => 200,
        (Ghost, Dark) => 50,
        (Ghost, Normal) => 0,
        // Dragon
        (Dragon, Dragon) => 200,
        (Dragon, Steel) => 50,
        (Dragon, Fairy) => 0,
        // Dark
        (Dark, Psychic) | (Dark, Ghost) => 200,
        (Dark, Fighting) | (Dark, Dark) | (Dark, Fairy) => 50,
        // Steel
        (Steel, Ice) | (Steel, Rock) | (Steel, Fairy) => 200,
        (Steel, Fire) | (Steel, Water) | (Steel, Electric) | (Steel, Steel) => 50,
        // Fairy
        (Fairy, Fighting) | (Fairy, Dragon) | (Fairy, Dark) => 200,
        (Fairy, Fire) | (Fairy, Poison) | (Fairy, Steel) => 50,
        // Normal
        (Normal, Rock) | (Normal, Steel) => 50,
        (Normal, Ghost) => 0,
        // Default: neutral
        _ => 100,
    }
}

/// Calculate combined effectiveness for a dual-type defender.
/// Returns multiplier * 10000 to preserve two levels of 0.5x/2x multiplication.
fn combined_effectiveness(attack_type: Type, type1: Type, type2: Option<Type>) -> u64 {
    let e1 = type_effectiveness(attack_type, type1) as u64;
    let e2 = type2.map_or(100, |t| type_effectiveness(attack_type, t)) as u64;
    // (e1/100) * (e2/100) * 10000 = e1 * e2 / 100
    e1 * e2 / 100
}

/// Core damage formula (Generation 9 standard).
///
/// damage = floor(floor(floor(2 * level / 5 + 2) * power * atk / def) / 50 + 2)
///          * modifier
fn base_damage(level: u8, power: u16, attack: u16, defense: u16) -> u32 {
    let level = level as u32;
    let power = power as u32;
    let atk = attack as u32;
    let def = defense as u32;

    ((2 * level / 5 + 2) * power * atk / def) / 50 + 2
}

/// Calculate damage range for a given attacker, defender, and move.
///
/// # Arguments
/// * `attacker_level` - Attacker's level (1–100).
/// * `attacker_stats` - Attacker's stats.
/// * `attacker_type` - Primary type of the attacker (for STAB check).
/// * `defender_stats` - Defender's stats.
/// * `defender_type1` - Defender's primary type.
/// * `defender_type2` - Defender's secondary type (`None` if single-type).
/// * `mv` - The move being used.
#[wasm_bindgen]
pub fn calculate_damage(
    attacker_level: u8,
    attacker_stats: &Stats,
    attacker_type: Type,
    defender_stats: &Stats,
    defender_type1: Type,
    defender_type2: Option<Type>,
    mv: &Move,
) -> DamageResult {
    if mv.power == 0 {
        return DamageResult::new(0, 0);
    }

    let (atk, def) = match mv.category {
        MoveCategory::Physical => (attacker_stats.attack, defender_stats.defense),
        MoveCategory::Special => (attacker_stats.sp_attack, defender_stats.sp_defense),
        MoveCategory::Status => return DamageResult::new(0, 0),
    };

    let base = base_damage(attacker_level, mv.power, atk, def);

    // STAB (Same-Type Attack Bonus): 1.5x
    let stab = if mv.move_type == attacker_type { 150u32 } else { 100u32 };

    // Type effectiveness (scaled by 10000)
    let effectiveness = combined_effectiveness(mv.move_type, defender_type1, defender_type2);

    // Random roll: 85–100 (represented as 85..=100 out of 100)
    // min = roll 85, max = roll 100
    let apply_modifiers = |roll: u32| -> u32 {
        // base * roll / 100 * stab / 100 * effectiveness / 10000
        // Use u64 to avoid overflow
        let v = base as u64;
        let v = v * roll as u64 / 100;
        let v = v * stab as u64 / 100;
        let v = v * effectiveness / 10000;
        v as u32
    };

    DamageResult::new(apply_modifiers(85), apply_modifiers(100))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{MoveCategory, Stats, Move, Type};

    fn base_stats() -> Stats {
        Stats::new(100, 100, 100, 100, 100, 100)
    }

    #[test]
    fn neutral_damage_is_nonzero() {
        let atk = base_stats();
        let def = base_stats();
        let mv = Move::new(80, MoveCategory::Physical, Type::Normal);
        let result = calculate_damage(50, &atk, Type::Normal, &def, Type::Normal, None, &mv);
        assert!(result.min > 0);
        assert!(result.max >= result.min);
    }

    #[test]
    fn stab_increases_damage() {
        let atk = base_stats();
        let def = base_stats();
        let mv_no_stab = Move::new(80, MoveCategory::Physical, Type::Normal);
        let mv_stab = Move::new(80, MoveCategory::Physical, Type::Fire);
        let no_stab = calculate_damage(50, &atk, Type::Fire, &def, Type::Normal, None, &mv_no_stab);
        let stab = calculate_damage(50, &atk, Type::Fire, &def, Type::Normal, None, &mv_stab);
        assert!(stab.max > no_stab.max);
    }

    #[test]
    fn super_effective_doubles_damage() {
        let atk = base_stats();
        let def = base_stats();
        let mv_neutral = Move::new(80, MoveCategory::Physical, Type::Normal);
        let mv_super = Move::new(80, MoveCategory::Physical, Type::Fire);
        let neutral = calculate_damage(50, &atk, Type::Normal, &def, Type::Normal, None, &mv_neutral);
        let super_eff = calculate_damage(50, &atk, Type::Normal, &def, Type::Grass, None, &mv_super);
        // 2x effective → roughly double damage
        assert!(super_eff.max > neutral.max);
    }

    #[test]
    fn immune_type_deals_zero_damage() {
        let atk = base_stats();
        let def = base_stats();
        let mv = Move::new(80, MoveCategory::Physical, Type::Normal);
        let result = calculate_damage(50, &atk, Type::Normal, &def, Type::Ghost, None, &mv);
        assert_eq!(result.min, 0);
        assert_eq!(result.max, 0);
    }

    #[test]
    fn status_move_deals_zero_damage() {
        let atk = base_stats();
        let def = base_stats();
        let mv = Move::new(0, MoveCategory::Status, Type::Normal);
        let result = calculate_damage(50, &atk, Type::Normal, &def, Type::Normal, None, &mv);
        assert_eq!(result.min, 0);
        assert_eq!(result.max, 0);
    }

    #[test]
    fn min_is_less_than_or_equal_to_max() {
        let atk = base_stats();
        let def = base_stats();
        let mv = Move::new(100, MoveCategory::Special, Type::Water);
        let result = calculate_damage(100, &atk, Type::Water, &def, Type::Fire, None, &mv);
        assert!(result.min <= result.max);
    }
}
