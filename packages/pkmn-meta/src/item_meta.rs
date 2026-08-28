use derive_getters::Getters;
use typed_builder::TypedBuilder;

#[derive(Clone, Debug, PartialEq, Getters, TypedBuilder)]
pub struct ItemMeta {
    #[builder(default)]
    is_choice_scarf: bool,
    #[builder(default = false)]
    is_choice_band: bool,
    #[builder(default = false)]
    is_choice_specs: bool,
    #[builder(default = false)]
    is_life_orb: bool,
    #[builder(default)]
    is_expert_belt: bool,
    #[builder(default)]
    is_muscle_band: bool,
    #[builder(default)]
    is_wise_glasses: bool,
    #[builder(default)]
    is_speed_drop: bool,
    #[builder(setter(!strip_option), default)]
    type_boost: Option<(crate::types::Type, f32)>,
    #[builder(setter(!strip_option), default)]
    type_resist_berry: Option<crate::types::Type>,
}

data::generate_item_meta!();
