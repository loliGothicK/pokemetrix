// Auto-generated structures with macro include for match logic

#[derive(Clone, Debug)]
pub struct SecondaryEffect {
    pub chance: u32,
    pub volatile_status: Option<&'static str>,
    pub status: Option<&'static str>,
    pub boosts: Option<crate::wasm_api::Boosts>,
}

#[derive(Clone, Debug)]
pub struct SelfEffect {
    pub boosts: Option<crate::wasm_api::Boosts>,
}

#[derive(Clone, Debug)]
pub struct MoveMeta {
    pub base_power: u32,
    pub pp: u8,
    pub move_type: damage_calc::types::Type,
    pub category: &'static str,
    pub priority: i32,
    pub range: &'static str,
    pub accuracy: Option<i32>,
    pub flags_protect: bool,
    pub flags_contact: bool,
    pub flags_charge: bool,
    pub flags_recharge: bool,
    pub is_punch: bool,
    pub is_bite: bool,
    pub is_sound: bool,
    pub is_slicing: bool,
    pub is_wind: bool,
    pub is_powder: bool,
    pub is_ball: bool,
    pub recoil: Option<(i32, i32)>,   // (numerator, denominator)
    pub drain: Option<(i32, i32)>,    // (numerator, denominator)
    pub multihit: Option<(i32, i32)>, // (min, max)
    pub status: Option<&'static str>,
    pub volatile_status: Option<&'static str>,
    pub boosts: Option<crate::wasm_api::Boosts>,
    pub secondary: Option<SecondaryEffect>,
    pub self_effect: Option<SelfEffect>,
}

data::generate_move_meta!();
