use crate::sim::battle::{Battle, Stat};

pub fn run_switch_in(battle: &mut Battle, player: u8, slot: usize) {
    let ability = if player == 1 {
        battle.p1.active.get(slot).and_then(|p| p.ability.clone())
    } else {
        battle.p2.active.get(slot).and_then(|p| p.ability.clone())
    };

    let item = if player == 1 {
        battle.p1.active.get(slot).and_then(|p| p.item)
    } else {
        battle.p2.active.get(slot).and_then(|p| p.item)
    };

    if let Some(ability_id) = ability.as_ref() {
        crate::sim::abilities::on_start(
            ability_id.as_ref(),
            battle,
            crate::sim::pokemon::PokemonIdent { player, slot },
        );
    }

    if let Some(meta) = ability
        .as_ref()
        .map(|a| a.as_ref())
        .and_then(pkmn_meta::ability_meta::get_ability_meta)
    {
        if let Some(w) = meta.on_start_weather() {
            battle.weather = Some(*w);
            let item_str = item.as_ref().map(|i| i.as_ref());
            if (*w == pkmn_meta::types::Weather::Rain && item_str == Some("damprock"))
                || (*w == pkmn_meta::types::Weather::HashSunlight && item_str == Some("heatrock"))
                || (*w == pkmn_meta::types::Weather::Sandstorm && item_str == Some("smoothrock"))
                || (*w == pkmn_meta::types::Weather::Snow && item_str == Some("icyrock"))
            {
                battle.weather_turns_left = 8;
            } else {
                battle.weather_turns_left = 5;
            }
            // Emit log
            let log_weather = if *w == pkmn_meta::types::Weather::Snow {
                "Snowscape"
            } else {
                w.as_ref()
            };
            battle.log.push(crate::sim::log::BattleLogEvent::new(
                crate::sim::log::BattleLog::WeatherChange {
                    weather: log_weather.to_string(),
                    is_start: true,
                },
            ));
        }
        if let Some(t) = meta.on_start_terrain() {
            battle.terrain = Some(*t);
            if item.as_ref().map(|i| i.as_ref()) == Some("terrainextender") {
                battle.terrain_turns_left = 8;
            } else {
                battle.terrain_turns_left = 5;
            }
            battle.log.push(crate::sim::log::BattleLogEvent::new(
                crate::sim::log::BattleLog::TerrainChange {
                    terrain: t.as_ref().to_string() + "Terrain",
                    is_start: true,
                },
            ));
        }
        if let Some(drop) = meta.on_start_stat_drop_foe().as_ref() {
            let targets = if player == 1 {
                (0..std::cmp::min(2, battle.p2.active.len())).collect::<Vec<_>>()
            } else {
                (0..std::cmp::min(2, battle.p1.active.len())).collect::<Vec<_>>()
            };

            for t_slot in targets {
                let target_player = if player == 1 { 2 } else { 1 };
                let hp = if target_player == 1 {
                    battle
                        .p1
                        .active
                        .get(t_slot)
                        .map(|p| p.hp.into_inner())
                        .unwrap_or(0)
                } else {
                    battle
                        .p2
                        .active
                        .get(t_slot)
                        .map(|p| p.hp.into_inner())
                        .unwrap_or(0)
                };

                if hp > 0 {
                    battle.apply_stat_change(
                        target_player,
                        t_slot,
                        vec![(Stat::Atk, drop.atk.into_inner())],
                        player,
                        ability.as_ref().map(|a| a.as_ref()),
                    );
                }
            }
        }
        if let Some(boost) = meta.on_start_stat_boost_self().as_ref() {
            if player == 1 {
                if let Some(p) = battle.p1.active.get_mut(slot) {
                    p.boosts.atk = (p.boosts.atk.into_inner() + boost.atk.into_inner())
                        .clamp(-6, 6)
                        .into();
                }
            } else {
                if let Some(p) = battle.p2.active.get_mut(slot) {
                    p.boosts.atk = (p.boosts.atk.into_inner() + boost.atk.into_inner())
                        .clamp(-6, 6)
                        .into();
                }
            }
        }
    }
}
