// Auto-generated via data crate

#[derive(Clone, Debug)]
pub struct ItemMeta {
    pub is_choice_scarf: bool,
    pub is_life_orb: bool,
    pub is_expert_belt: bool,
    pub is_muscle_band: bool,
    pub is_wise_glasses: bool,
    pub is_speed_drop: bool,
    pub type_boost: Option<(damage_calc::types::Type, f32)>,
    pub type_resist_berry: Option<damage_calc::types::Type>,
}

data::generate_item_meta!();
