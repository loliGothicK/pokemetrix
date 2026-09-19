data::generate_regulation_meta!();

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_regulation_mc_archaludon_move_removals() {
        // Archaludon in M-A and M-B should have Mirror Coat (243) and Metal Burst (368)
        assert!(is_move_allowed("archaludon", 243, Regulation::MA));
        assert!(is_move_allowed("archaludon", 368, Regulation::MA));
        assert!(is_move_allowed("archaludon", 243, Regulation::MB));
        assert!(is_move_allowed("archaludon", 368, Regulation::MB));

        // In M-C, Archaludon loses Mirror Coat (243) and Metal Burst (368)
        assert!(!is_move_allowed("archaludon", 243, Regulation::MC));
        assert!(!is_move_allowed("archaludon", 368, Regulation::MC));

        // Other moves (e.g. Draco Meteor: 434 or Flash Cannon: 430) should remain allowed
        let mc_moves = get_pokemon_moves("archaludon", Regulation::MC).expect("archaludon moves");
        assert!(!mc_moves.contains(&243));
        assert!(!mc_moves.contains(&368));
    }

    #[test]
    fn test_regulation_mc_politoed_move_removals() {
        // Politoed in M-A and M-B should have Pound (1)
        assert!(is_move_allowed("politoed", 1, Regulation::MA));
        assert!(is_move_allowed("politoed", 1, Regulation::MB));

        // In M-C, Politoed loses Pound (1)
        assert!(!is_move_allowed("politoed", 1, Regulation::MC));

        let mc_moves = get_pokemon_moves("politoed", Regulation::MC).expect("politoed moves");
        assert!(!mc_moves.contains(&1));
    }

    #[test]
    fn test_is_pokemon_allowed() {
        assert!(is_pokemon_allowed("archaludon", Regulation::MA));
        assert!(is_pokemon_allowed("archaludon", Regulation::MB));
        assert!(is_pokemon_allowed("archaludon", Regulation::MC));

        // Metagross (id: 376) is introduced in M-B
        assert!(!is_pokemon_allowed("metagross", Regulation::MA));
        assert!(is_pokemon_allowed("metagross", Regulation::MB));
        assert!(is_pokemon_allowed("metagross", Regulation::MC));

        // Baxcalibur (id: 998), Rillaboom (id: 812), Farfetch'd (id: 83), Salamence (id: 373) introduced in M-C
        assert!(!is_pokemon_allowed("baxcalibur", Regulation::MA));
        assert!(!is_pokemon_allowed("baxcalibur", Regulation::MB));
        assert!(is_pokemon_allowed("baxcalibur", Regulation::MC));

        assert!(!is_pokemon_allowed("rillaboom", Regulation::MA));
        assert!(!is_pokemon_allowed("rillaboom", Regulation::MB));
        assert!(is_pokemon_allowed("rillaboom", Regulation::MC));

        assert!(!is_pokemon_allowed("farfetchd", Regulation::MA));
        assert!(!is_pokemon_allowed("farfetchd", Regulation::MB));
        assert!(is_pokemon_allowed("farfetchd", Regulation::MC));

        assert!(!is_pokemon_allowed("salamence", Regulation::MA));
        assert!(!is_pokemon_allowed("salamence", Regulation::MB));
        assert!(is_pokemon_allowed("salamence", Regulation::MC));
    }

    #[test]
    fn test_regulation_mc_slash_move_additions() {
        // Slash: 163
        // Charizard should NOT have Slash in M-A or M-B, but should have it in M-C
        assert!(!is_move_allowed("charizard", 163, Regulation::MA));
        assert!(!is_move_allowed("charizard", 163, Regulation::MB));
        assert!(is_move_allowed("charizard", 163, Regulation::MC));

        // Mega forms should also have Slash in M-C
        assert!(is_move_allowed("charizardmegax", 163, Regulation::MC));
        assert!(is_move_allowed("charizardmegay", 163, Regulation::MC));

        // Archaludon should have Slash in M-C along with its removals
        assert!(!is_move_allowed("archaludon", 163, Regulation::MA));
        assert!(!is_move_allowed("archaludon", 163, Regulation::MB));
        assert!(is_move_allowed("archaludon", 163, Regulation::MC));

        // Garchomp, Weavile, Kingambit should have Slash in M-C
        assert!(is_move_allowed("garchomp", 163, Regulation::MC));
        assert!(is_move_allowed("garchompmega", 163, Regulation::MC));
        assert!(is_move_allowed("garchompmegaz", 163, Regulation::MC));
        assert!(is_move_allowed("weavile", 163, Regulation::MC));
        assert!(is_move_allowed("kingambit", 163, Regulation::MC));
    }
}
