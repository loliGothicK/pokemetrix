// Auto-generated via data crate

#[derive(Clone, Debug)]
pub struct AbilityMeta {
    pub on_start_weather: Option<&'static str>,
    pub on_start_terrain: Option<&'static str>,
    pub on_start_stat_drop_foe: Option<crate::wasm_api::Boosts>,
    pub on_start_stat_boost_self: Option<crate::wasm_api::Boosts>,

    pub immune_to_type: Option<damage_calc::types::Type>,
    pub immune_to_status: Option<&'static str>,

    pub ignore_foe_stat_changes: bool,
    pub is_magic_guard: bool,

    pub attack_type_boost: Option<(damage_calc::types::Type, f32)>, // e.g., Flash Fire boosts Fire by 1.5x
}

data::generate_ability_meta!();
