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
    }
}
