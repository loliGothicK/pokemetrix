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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pokemon_meta_inherit() {
        // Venusaur Mega (venusaurmega) inherits types from Venusaur (Grass, Poison)
        let venusaur = get_pokemon_meta("venusaur").expect("venusaur");
        let mega = get_pokemon_meta("venusaurmega").expect("venusaurmega");

        assert_eq!(mega.type1(), venusaur.type1());
        assert_eq!(mega.type2(), venusaur.type2());
        // Status is NOT inherited for Mega Venusaur (different stats)
        assert_ne!(mega.base_stats(), venusaur.base_stats());
    }
}
