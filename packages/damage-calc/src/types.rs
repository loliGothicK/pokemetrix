use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Pokémon type enumeration.
///
/// `Stellar` is included for parity with modern generations but is treated as
/// neutral in the built-in type chart.
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Type {
    Normal,
    Fire,
    Water,
    Electric,
    Grass,
    Ice,
    Fighting,
    Poison,
    Ground,
    Flying,
    Psychic,
    Bug,
    Rock,
    Ghost,
    Dragon,
    Dark,
    Steel,
    Fairy,
    Stellar,
}

/// The default modifier value. Every modifier is stored as `x / 4096`, so 4096
/// represents a no-op (1.0x) multiplier.
pub const NEUTRAL_MODIFIER: u16 = 4096;

pub(crate) fn neutral_modifier() -> u16 {
    NEUTRAL_MODIFIER
}

/// Full damage calculation input.
///
/// This struct is the boundary between the data-driven modifier resolution
/// (done in TypeScript) and the faithful "formula executor" (this crate).
/// Every modifier is expected to already be resolved to its `x / 4096` value;
/// the engine only implements rounding, chaining, and the exact application
/// order described in DaWoblefet's damage dissertation.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DamageInput {
    /// Attacker level (1–100). VGC uses 50.
    pub level: u8,

    /// Starting base power, after any custom base-power resolution (e.g. Gyro
    /// Ball, Water Spout) but *before* the base-power modifier chain.
    pub base_power: u16,
    /// Base-power modifiers to chain (`x / 4096`).
    #[serde(default)]
    pub bp_modifiers: Vec<u16>,

    /// Attacker's Attack or Sp. Atk as shown on the summary screen.
    pub attack: u16,
    /// Attack stat stage (-6..=6).
    #[serde(default)]
    pub attack_boost: i8,
    /// Attack modifiers to chain (`x / 4096`).
    #[serde(default)]
    pub attack_modifiers: Vec<u16>,

    /// Defender's Defense or Sp. Def as shown on the summary screen.
    pub defense: u16,
    /// Defense stat stage (-6..=6).
    #[serde(default)]
    pub defense_boost: i8,
    /// Defense modifiers to chain (`x / 4096`).
    #[serde(default)]
    pub defense_modifiers: Vec<u16>,

    /// Whether the move uses the physical Attack stat (affects burn).
    pub is_physical: bool,

    /// The move's type (used for the built-in type effectiveness calculation).
    pub move_type: Type,
    /// Defender's primary type.
    pub defender_type1: Type,
    /// Defender's secondary type, if any.
    #[serde(default)]
    pub defender_type2: Option<Type>,
    /// Override for the type-effectiveness shift (e.g. Freeze-Dry). When set,
    /// the built-in chart is ignored.
    #[serde(default)]
    pub effectiveness_override: Option<i32>,
    /// Override for immunity (e.g. Ring Target, Scrappy).
    #[serde(default)]
    pub immune_override: Option<bool>,

    /// Spread move modifier (3072 for spread, 2048 for Battle Royal spread).
    #[serde(default = "neutral_modifier")]
    pub spread_modifier: u16,
    /// Parental Bond second-hit modifier (1024).
    #[serde(default = "neutral_modifier")]
    pub parental_bond_modifier: u16,
    /// Weather modifier (6144 boost / 2048 penalty).
    #[serde(default = "neutral_modifier")]
    pub weather_modifier: u16,

    /// Whether the move is a critical hit.
    #[serde(default)]
    pub is_crit: bool,
    /// Critical hit modifier (1.5x = 6144).
    #[serde(default = "neutral_modifier")]
    pub crit_modifier: u16,

    /// STAB modifier (6144 for STAB, 8192 for Adaptability).
    #[serde(default = "neutral_modifier")]
    pub stab_modifier: u16,

    /// Whether the attacker is burned (0.5x on physical moves).
    #[serde(default)]
    pub is_burned: bool,

    /// Final modifiers to chain (Life Orb, screens, Friend Guard, etc.).
    #[serde(default)]
    pub final_modifiers: Vec<u16>,

    /// Z-move-into-protect modifier (1024).
    #[serde(default = "neutral_modifier")]
    pub protect_modifier: u16,
}

/// Result of a damage calculation: all 16 rolls plus the extremes.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DamageOutput {
    /// All 16 possible damage rolls, ascending (index 0 = min, 15 = max).
    pub rolls: Vec<u32>,
    /// Minimum damage (random factor 15).
    pub min: u32,
    /// Maximum damage (random factor 0).
    pub max: u32,
}
