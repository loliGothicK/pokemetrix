use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Pokémon type enumeration.
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
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
}

/// Base stats of a Pokémon.
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stats {
    pub hp: u16,
    pub attack: u16,
    pub defense: u16,
    pub sp_attack: u16,
    pub sp_defense: u16,
    pub speed: u16,
}

#[wasm_bindgen]
impl Stats {
    #[wasm_bindgen(constructor)]
    pub fn new(hp: u16, attack: u16, defense: u16, sp_attack: u16, sp_defense: u16, speed: u16) -> Stats {
        Stats { hp, attack, defense, sp_attack, sp_defense, speed }
    }
}

/// Move category.
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MoveCategory {
    Physical,
    Special,
    Status,
}

/// A move used in damage calculation.
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Move {
    pub power: u16,
    pub category: MoveCategory,
    pub move_type: Type,
}

#[wasm_bindgen]
impl Move {
    #[wasm_bindgen(constructor)]
    pub fn new(power: u16, category: MoveCategory, move_type: Type) -> Move {
        Move { power, category, move_type }
    }
}

/// Result of a damage calculation.
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DamageResult {
    /// Minimum damage (with 0.85 roll).
    pub min: u32,
    /// Maximum damage (with 1.00 roll).
    pub max: u32,
}

#[wasm_bindgen]
impl DamageResult {
    #[wasm_bindgen(constructor)]
    pub fn new(min: u32, max: u32) -> DamageResult {
        DamageResult { min, max }
    }
}
