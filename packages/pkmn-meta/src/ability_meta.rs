use crate::Boosts;
use derive_getters::Getters;
use typed_builder::TypedBuilder;

#[derive(Clone, Debug, PartialEq, TypedBuilder, Getters)]
pub struct AbilityMeta {
    on_start_weather: Option<crate::types::Weather>,
    on_start_terrain: Option<crate::types::Terrain>,
    on_start_stat_drop_foe: Option<Boosts>,
    on_start_stat_boost_self: Option<Boosts>,

    immune_to_type: Option<crate::types::Type>,
    immune_to_status: Option<&'static str>,

    ignore_foe_stat_changes: bool,
    is_magic_guard: bool,

    attack_type_boost: Option<(crate::types::Type, f32)>, // e.g., Flash Fire boosts Fire by 1.5x
}

data::generate_ability_meta!();
