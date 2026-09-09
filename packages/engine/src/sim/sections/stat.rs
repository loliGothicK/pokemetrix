use crate::sim::battle::{
    Battle, BattleLog, BattleLogEvent, EventContext, EventId, PokemonIdent, Stat,
};
use crate::wasm_api::Boosts;

/// Applies a stat change, handling abilities like Clear Body, Simple, Contrary, Defiant, etc.
/// Returns true if the stat was successfully changed.
pub fn apply_stat_change(
    battle: &mut Battle,
    target_player: u8,
    target_slot: usize,
    stat: Stat,
    mut amount: i8,
    source_player: u8,
    source_effect: Option<&str>,
) -> bool {
    // Check if target is alive
    let target = if target_player == 1 {
        battle.p1.active.get(target_slot)
    } else {
        battle.p2.active.get(target_slot)
    };
    if target.is_none() || target.unwrap().hp == 0 {
        return false;
    }

    // Extract target's ability
    let target_ability = if target_player == 1 {
        battle
            .p1
            .active
            .get(target_slot)
            .and_then(|p| p.ability.clone())
    } else {
        battle
            .p2
            .active
            .get(target_slot)
            .and_then(|p| p.ability.clone())
    };

    // Execute Condition Hooks
    let mut immune = false;
    if let Some(ability) = &target_ability {
        let ability_id = ability.as_ref();
        let target_ident = PokemonIdent {
            player: target_player,
            slot: target_slot,
        };
        let source_ident = PokemonIdent {
            player: source_player,
            slot: 0,
        };
        amount = crate::sim::abilities::on_modify_boost(
            ability_id,
            battle,
            target_ident,
            stat,
            amount,
            source_effect,
        );
        if !crate::sim::abilities::on_try_boost(
            ability_id,
            battle,
            target_ident,
            source_ident,
            stat,
            amount,
            source_effect,
        ) {
            immune = true;
        }
    }

    if immune {
        return false;
    }

    // Apply the change
    let mut actual_change = 0;
    let mut success = false;

    let apply_to_boosts = |boosts: &mut Boosts, stat: Stat, amt: i8| -> (bool, i8) {
        let old_val = match stat {
            Stat::Atk => boosts.atk.into_inner(),
            Stat::Def => boosts.def.into_inner(),
            Stat::Spa => boosts.spa.into_inner(),
            Stat::Spd => boosts.spd.into_inner(),
            Stat::Spe => boosts.spe.into_inner(),
            Stat::Accuracy => boosts.accuracy.into_inner(),
            Stat::Evasion => boosts.evasion.into_inner(),
        };
        let new_val = (old_val + amt).clamp(-6, 6);
        match stat {
            Stat::Atk => boosts.atk = new_val.into(),
            Stat::Def => boosts.def = new_val.into(),
            Stat::Spa => boosts.spa = new_val.into(),
            Stat::Spd => boosts.spd = new_val.into(),
            Stat::Spe => boosts.spe = new_val.into(),
            Stat::Accuracy => boosts.accuracy = new_val.into(),
            Stat::Evasion => boosts.evasion = new_val.into(),
        }
        (new_val != old_val, new_val - old_val)
    };

    if target_player == 1 {
        if let Some(p) = battle.p1.active.get_mut(target_slot) {
            let res = apply_to_boosts(&mut p.boosts, stat, amount);
            success = res.0;
            actual_change = res.1;
            if actual_change > 0 {
                p.turn_state.stats_raised = true;
            }
        }
    } else {
        if let Some(p) = battle.p2.active.get_mut(target_slot) {
            let res = apply_to_boosts(&mut p.boosts, stat, amount);
            success = res.0;
            actual_change = res.1;
            if actual_change > 0 {
                p.turn_state.stats_raised = true;
            }
        }
    }

    if success {
        battle.log.push(BattleLogEvent::new(BattleLog::StatChange {
            target: PokemonIdent {
                player: target_player,
                slot: target_slot,
            },
            stat: match stat {
                Stat::Atk => "atk".to_string(),
                Stat::Def => "def".to_string(),
                Stat::Spa => "spa".to_string(),
                Stat::Spd => "spd".to_string(),
                Stat::Spe => "spe".to_string(),
                Stat::Accuracy => "accuracy".to_string(),
                Stat::Evasion => "evasion".to_string(),
            },
            amount: actual_change as i32,
        }));

        battle.event_queue.push_back((
            EventId::AfterStatChange,
            EventContext::builder()
                .target(PokemonIdent {
                    player: target_player,
                    slot: target_slot,
                })
                .source(Some(PokemonIdent {
                    player: source_player,
                    slot: 0,
                }))
                .num_val(actual_change as i32)
                .string_val(match stat {
                    Stat::Atk => "atk".to_string(),
                    Stat::Def => "def".to_string(),
                    Stat::Spa => "spa".to_string(),
                    Stat::Spd => "spd".to_string(),
                    Stat::Spe => "spe".to_string(),
                    Stat::Accuracy => "accuracy".to_string(),
                    Stat::Evasion => "evasion".to_string(),
                })
                .build(),
        ));
    }

    battle.process_event_queue();

    success
}
