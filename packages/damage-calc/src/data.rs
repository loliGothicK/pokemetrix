use std::sync::OnceLock;

pub fn get_parsed_pokemon() -> &'static serde_json::Value {
    static POKEMON: OnceLock<serde_json::Value> = OnceLock::new();
    POKEMON.get_or_init(|| {
        serde_json::from_str(include_str!("../../data/champions/pokemon.json")).unwrap()
    })
}

pub fn get_parsed_moves() -> &'static serde_json::Value {
    static MOVES: OnceLock<serde_json::Value> = OnceLock::new();
    MOVES.get_or_init(|| {
        serde_json::from_str(include_str!("../../data/champions/moves.json")).unwrap()
    })
}

pub fn get_parsed_items() -> &'static serde_json::Value {
    static ITEMS: OnceLock<serde_json::Value> = OnceLock::new();
    ITEMS.get_or_init(|| {
        serde_json::from_str(include_str!("../../data/champions/items.json")).unwrap()
    })
}
