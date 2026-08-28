use crate::Boosts;
use derive_getters::Getters;
use typed_builder::TypedBuilder;

#[derive(Clone, Debug, PartialEq, TypedBuilder, Getters)]
pub struct SecondaryEffect {
    chance: u32,
    volatile_status: Option<crate::types::VolatileStatus>,
    status: Option<crate::types::Status>,
    boosts: Option<Boosts>,
}

#[derive(Clone, Debug, PartialEq, TypedBuilder, Getters)]
pub struct SelfEffect {
    boosts: Option<Boosts>,
}

#[derive(Clone, Debug, PartialEq, TypedBuilder, Getters)]
pub struct MoveMeta {
    base_power: u32,
    pp: u8,
    move_type: crate::types::Type,
    category: crate::types::Category,
    priority: i32,
    range: crate::types::Range,
    accuracy: Option<i32>,
    flags_protect: bool,
    flags_contact: bool,
    flags_charge: bool,
    flags_recharge: bool,
    is_punch: bool,
    is_bite: bool,
    is_sound: bool,
    is_slicing: bool,
    is_wind: bool,
    is_powder: bool,
    is_ball: bool,
    recoil: Option<(i32, i32)>,   // (numerator, denominator)
    drain: Option<(i32, i32)>,    // (numerator, denominator)
    multihit: Option<(i32, i32)>, // (min, max)
    status: Option<crate::types::Status>,
    volatile_status: Option<crate::types::VolatileStatus>,
    boosts: Option<Boosts>,
    secondary: Option<SecondaryEffect>,
    self_effect: Option<SelfEffect>,
}

data::generate_move_meta!();
