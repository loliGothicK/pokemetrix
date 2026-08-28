use derive_getters::Getters;
use typed_builder::TypedBuilder;

#[derive(Clone, Debug, PartialEq, TypedBuilder, Getters)]
pub struct PokemonMeta {
    base_stats: [u32; 6],
    type1: crate::types::Type,
    type2: Option<crate::types::Type>,
    weight: u32,
}

data::generate_pokemon_meta!();
