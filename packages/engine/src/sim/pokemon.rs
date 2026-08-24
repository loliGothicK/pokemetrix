#[derive(Debug, Clone, PartialEq)]
pub struct Pokemon {
    pub species_id: String,
    pub name: String,
    pub hp: i32,
    pub maxhp: i32,
    pub ability: String,
    pub item: String,
    pub nature: String,
    pub moves: Vec<String>,
    pub types: Vec<String>,
    pub fainted: bool,
    pub active: bool,
}
