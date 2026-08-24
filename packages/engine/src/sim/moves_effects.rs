#[derive(Default)]
pub struct MoveEffect {
    pub name: String,
    pub has_on_modify_priority: bool,
    pub has_on_modify_atk: bool,
    pub has_on_modify_def: bool,
    pub has_on_modify_spa: bool,
    pub has_on_modify_spd: bool,
    pub has_on_base_power: bool,
}

pub fn get_move_effect(id: &str) -> Option<MoveEffect> {
    match id {
        "solarbeam" => Some(MoveEffect {
            name: "Solar Beam".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "facade" => Some(MoveEffect {
            name: "Facade".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "knockoff" => Some(MoveEffect {
            name: "Knock Off".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "venoshock" => Some(MoveEffect {
            name: "Venoshock".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "retaliate" => Some(MoveEffect {
            name: "Retaliate".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "solarblade" => Some(MoveEffect {
            name: "Solar Blade".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "gravapple" => Some(MoveEffect {
            name: "Grav Apple".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "expandingforce" => Some(MoveEffect {
            name: "Expanding Force".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "mistyexplosion" => Some(MoveEffect {
            name: "Misty Explosion".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "grassyglide" => Some(MoveEffect {
            name: "Grassy Glide".to_string(),
            has_on_modify_priority: true,
            ..Default::default()
        }),
        "lashout" => Some(MoveEffect {
            name: "Lash Out".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "barbbarrage" => Some(MoveEffect {
            name: "Barb Barrage".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        "ficklebeam" => Some(MoveEffect {
            name: "Fickle Beam".to_string(),
            has_on_base_power: true,
            ..Default::default()
        }),
        _ => None,
    }
}
