use crate::sim::abilities::get_ability;
use crate::sim::items::get_item;
use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Tsify)]
pub struct ConditionJs {
    pub name: String,
    pub has_on_modify_priority: bool,
    pub has_on_modify_atk: bool,
    pub has_on_modify_def: bool,
    pub has_on_modify_spa: bool,
    pub has_on_modify_spd: bool,
    pub has_on_base_power: bool,
    pub boosts_spa: Option<i32>,
}

#[derive(Serialize, Deserialize)]
pub struct PokemonState {
    pub species: String,
    pub ability: Option<String>,
    pub item: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct BattleState {
    pub p1: PokemonState,
    pub p2: PokemonState,
}

#[wasm_bindgen]
pub fn check_ability(id: &str) -> Option<tsify::Ts<ConditionJs>> {
    if let Some(cond) = get_ability(id) {
        let js = ConditionJs {
            name: cond.name,
            has_on_modify_priority: cond.on_modify_priority.is_some(),
            has_on_modify_atk: cond.on_modify_atk.is_some(),
            has_on_modify_def: cond.on_modify_def.is_some(),
            has_on_modify_spa: cond.on_modify_spa.is_some(),
            has_on_modify_spd: cond.on_modify_spd.is_some(),
            has_on_base_power: cond.on_base_power.is_some(),
            boosts_spa: cond.boosts_spa,
        };
        Some(tsify::Ts::from_rust(&js).unwrap())
    } else {
        None
    }
}

#[wasm_bindgen]
pub fn check_item(id: &str) -> Option<tsify::Ts<ConditionJs>> {
    if let Some(cond) = get_item(id) {
        let js = ConditionJs {
            name: cond.name,
            has_on_modify_priority: cond.on_modify_priority.is_some(),
            has_on_modify_atk: cond.on_modify_atk.is_some(),
            has_on_modify_def: cond.on_modify_def.is_some(),
            has_on_modify_spa: cond.on_modify_spa.is_some(),
            has_on_modify_spd: cond.on_modify_spd.is_some(),
            has_on_base_power: cond.on_base_power.is_some(),
            boosts_spa: cond.boosts_spa,
        };
        Some(tsify::Ts::from_rust(&js).unwrap())
    } else {
        None
    }
}
use crate::sim::moves_effects::get_move_effect;

#[wasm_bindgen]
pub fn check_move_effect(id: &str) -> Option<tsify::Ts<ConditionJs>> {
    if let Some(cond) = get_move_effect(id) {
        let js = ConditionJs {
            name: cond.name,
            has_on_modify_priority: cond.has_on_modify_priority,
            has_on_modify_atk: cond.has_on_modify_atk,
            has_on_modify_def: cond.has_on_modify_def,
            has_on_modify_spa: cond.has_on_modify_spa,
            has_on_modify_spd: cond.has_on_modify_spd,
            has_on_base_power: cond.has_on_base_power,
            boosts_spa: None,
        };
        Some(tsify::Ts::from_rust(&js).unwrap())
    } else {
        None
    }
}
#[derive(Serialize, Deserialize, Tsify, Clone, Debug, Default)]
pub struct Boosts {
    pub atk: i8,
    pub def: i8,
    pub spa: i8,
    pub spd: i8,
    pub spe: i8,
    #[serde(default)]
    pub accuracy: i8,
    #[serde(default)]
    pub evasion: i8,
}

#[derive(Serialize, Deserialize, Tsify)]
pub struct PokemonData {
    pub ident: String,
    pub hp: i32,
    pub maxhp: i32,
    pub speed: i32,
    pub attack: i32,
    pub defense: i32,
    pub sp_attack: i32,
    pub sp_defense: i32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub item: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ability: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    pub type1: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub type2: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub added_type: Option<String>,
    #[serde(default)]
    pub boosts: Boosts,
    #[serde(default)]
    pub volatile_status: Vec<String>,

    // Tracking fields
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_move_used: Option<String>,
    #[serde(default)]
    pub consecutive_move_counter: u8,
    #[serde(default)]
    pub pp_used: std::collections::HashMap<String, u8>,
}

#[derive(Serialize, Deserialize, Tsify)]
pub struct FullBattleState {
    pub p1: Vec<PokemonData>,
    pub p2: Vec<PokemonData>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub weather: Option<String>,
    #[serde(default)]
    #[tsify(optional)]
    pub weather_turns_left: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub terrain: Option<String>,
    #[serde(default)]
    #[tsify(optional)]
    pub terrain_turns_left: u8,
    #[serde(default)]
    #[tsify(optional)]
    pub trick_room: bool,
    #[serde(default)]
    #[tsify(optional)]
    pub p1_tailwind: bool,
    #[serde(default)]
    #[tsify(optional)]
    pub p2_tailwind: bool,
}

#[derive(Serialize, Deserialize, Tsify)]
pub struct TurnActions {
    pub p1a: String,
    pub p1a_target: u8,
    pub p1b: String,
    pub p1b_target: u8,
    pub p2a: String,
    pub p2a_target: u8,
    pub p2b: String,
    pub p2b_target: u8,
}

#[derive(Deserialize, Tsify)]
pub struct Config {
    #[serde(default)]
    #[tsify(optional, type = "'min' | 'max'")]
    pub damage_roll: Option<String>,
    #[serde(default)]
    #[tsify(optional, type = "'always' | 'never'")]
    pub crits: Option<String>,
    #[serde(default)]
    #[tsify(optional, type = "'always' | 'never'")]
    pub accuracy: Option<String>,
    #[serde(default)]
    #[tsify(optional)]
    pub secondary: Option<String>,
}

#[wasm_bindgen]
pub fn run_turn(
    state: tsify::Ts<FullBattleState>,
    actions: tsify::Ts<TurnActions>,
    config: Option<tsify::Ts<Config>>,
) -> Result<tsify::Ts<FullBattleState>, wasm_bindgen::JsError> {
    let state = state.to_rust()?;
    let actions = actions.to_rust()?;
    let config = match config {
        Some(c) => Some(c.to_rust()?),
        None => None,
    };

    use crate::sim::battle::{Battle, Pokemon};

    let mut battle = Battle::new();
    battle.weather = state.weather.clone().filter(|s| !s.is_empty());
    battle.weather_turns_left = state.weather_turns_left;
    battle.terrain = state.terrain.clone().filter(|s| !s.is_empty());
    battle.terrain_turns_left = state.terrain_turns_left;
    battle.trick_room = state.trick_room;
    battle.p1_tailwind = state.p1_tailwind;
    battle.p2_tailwind = state.p2_tailwind;

    for p in state.p1 {
        battle.p1.push(Pokemon {
            ident: p.ident.clone(),
            hp: p.hp,
            maxhp: p.maxhp,
            speed: p.speed,
            attack: p.attack,
            defense: p.defense,
            sp_attack: p.sp_attack,
            sp_defense: p.sp_defense,
            item: p.item.clone().filter(|s| !s.is_empty()),
            ability: p.ability.clone().filter(|s| !s.is_empty()),
            status: p.status.clone().filter(|s| !s.is_empty()),
            type1: p.type1.clone(),
            type2: p.type2.clone().filter(|s| !s.is_empty()),
            added_type: p.added_type.clone().filter(|s| !s.is_empty()),
            boosts: p.boosts.clone(),
            volatile_status: p.volatile_status.clone(),
            last_move_used: p.last_move_used.clone(),
            consecutive_move_counter: p.consecutive_move_counter,
            pp_used: p.pp_used.clone(),
        });
    }
    for p in state.p2 {
        battle.p2.push(Pokemon {
            ident: p.ident.clone(),
            hp: p.hp,
            maxhp: p.maxhp,
            speed: p.speed,
            attack: p.attack,
            defense: p.defense,
            sp_attack: p.sp_attack,
            sp_defense: p.sp_defense,
            item: p.item.clone().filter(|s| !s.is_empty()),
            ability: p.ability.clone().filter(|s| !s.is_empty()),
            status: p.status.clone().filter(|s| !s.is_empty()),
            type1: p.type1.clone(),
            type2: p.type2.clone().filter(|s| !s.is_empty()),
            added_type: p.added_type.clone().filter(|s| !s.is_empty()),
            boosts: p.boosts.clone(),
            volatile_status: p.volatile_status.clone(),
            last_move_used: p.last_move_used.clone(),
            consecutive_move_counter: p.consecutive_move_counter,
            pp_used: p.pp_used.clone(),
        });
    }

    battle
        .execute_turn(
            &actions.p1a,
            actions.p1a_target,
            &actions.p1b,
            actions.p1b_target,
            &actions.p2a,
            actions.p2a_target,
            &actions.p2b,
            actions.p2b_target,
            config,
        )
        .map_err(|e| wasm_bindgen::JsError::new(&e))?;

    let mut result = FullBattleState {
        p1: vec![],
        p2: vec![],
        weather: battle.weather.clone(),
        weather_turns_left: battle.weather_turns_left,
        terrain: battle.terrain.clone(),
        terrain_turns_left: battle.terrain_turns_left,
        trick_room: battle.trick_room,
        p1_tailwind: battle.p1_tailwind,
        p2_tailwind: battle.p2_tailwind,
    };
    for p in battle.p1 {
        result.p1.push(PokemonData {
            ident: p.ident,
            hp: p.hp,
            maxhp: p.maxhp,
            speed: p.speed,
            attack: p.attack,
            defense: p.defense,
            sp_attack: p.sp_attack,
            sp_defense: p.sp_defense,
            item: p.item.clone(),
            ability: p.ability.clone(),
            status: p.status.clone(),
            type1: p.type1.clone(),
            type2: p.type2.clone(),
            added_type: p.added_type.clone(),
            boosts: p.boosts.clone(),
            volatile_status: p.volatile_status.clone(),
            last_move_used: p.last_move_used.clone(),
            consecutive_move_counter: p.consecutive_move_counter,
            pp_used: p.pp_used.clone(),
        });
    }
    for p in &battle.p2 {
        result.p2.push(PokemonData {
            ident: p.ident.clone(),
            hp: p.hp,
            maxhp: p.maxhp,
            speed: p.speed,
            attack: p.attack,
            defense: p.defense,
            sp_attack: p.sp_attack,
            sp_defense: p.sp_defense,
            item: p.item.clone(),
            ability: p.ability.clone(),
            status: p.status.clone(),
            type1: p.type1.clone(),
            type2: p.type2.clone(),
            added_type: p.added_type.clone(),
            boosts: p.boosts.clone(),
            volatile_status: p.volatile_status.clone(),
            last_move_used: p.last_move_used.clone(),
            consecutive_move_counter: p.consecutive_move_counter,
            pp_used: p.pp_used.clone(),
        });
    }

    Ok(tsify::Ts::from_rust(&result)?)
}
