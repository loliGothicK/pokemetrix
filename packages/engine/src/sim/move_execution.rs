use crate::sim::battle::{Battle, BattleLog, BattleLogEvent, PokemonIdent, Stat};
use pkmn_meta::types::Type;
use rand::RngExt;

struct HitResult {
    damage_dealt: i32,
    hit_anyone: bool,
    immune_stop: bool,
}

impl Battle {
    pub fn execute_move(&mut self, action: &crate::sim::action::MoveAction) -> Result<(), String> {
        let mut action = action.clone();
        let mut from_move = None;

        // Encore override
        if let Some(p) = self.get_pokemon(PokemonIdent {
            player: action.player,
            slot: action.slot,
        }) && p
            .volatile_status
            .contains(&pkmn_meta::types::VolatileStatus::Encore)
            && let Some(encored) = &p.encored_move
        {
            action.move_id = encored.clone();
        }

        // Copycat
        if action.move_id == "copycat" {
            self.log.push(BattleLogEvent::new(BattleLog::MoveUsed {
                attacker: PokemonIdent {
                    player: action.player,
                    slot: action.slot,
                },
                move_id: "copycat".to_string(),
                from_move: None,
                target: Some(PokemonIdent {
                    player: action.player,
                    slot: action.slot,
                }),
            }));

            if let Some(last_move) = &self.global_last_move_used {
                action.move_id = last_move.clone();
                from_move = Some("copycat".to_string());
            } else {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: PokemonIdent {
                        player: action.player,
                        slot: action.slot,
                    },
                }));
                return Ok(());
            }
        }

        if !self.try_move(&action) {
            return Ok(());
        }

        let meta_opt = pkmn_meta::move_meta::get_move_meta(&action.move_id);
        if meta_opt.is_none() {
            return Err(format!("Move not found in database: {}", action.move_id));
        }

        let range = meta_opt
            .as_ref()
            .map(|m| m.range())
            .unwrap_or(&pkmn_meta::types::Range::SingleTarget);

        let log_target = match range {
            pkmn_meta::types::Range::Self_
            | pkmn_meta::types::Range::AllOpponents
            | pkmn_meta::types::Range::AllPokemon => None,
            _ => Some(PokemonIdent {
                player: action.target_player,
                slot: action.target_slot.into(),
            }),
        };

        self.log.push(BattleLogEvent::new(BattleLog::MoveUsed {
            attacker: PokemonIdent {
                player: action.player,
                slot: action.slot,
            },
            move_id: action.move_id.clone(),
            target: log_target,
            from_move: from_move.clone(),
        }));

        let attacker_ident = PokemonIdent {
            player: action.player,
            slot: action.slot,
        };
        let attacker_status = self.get_pokemon(attacker_ident).and_then(|p| p.status);

        if (action.move_id == "sleeptalk" || action.move_id == "snore")
            && attacker_status.as_ref().map(|s| s.as_ref()) != Some("slp")
        {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }

        if (action.move_id == "fakeout" || action.move_id == "firstimpression")
            && let Some(p) = self.get_pokemon(attacker_ident)
            && p.active_turns > 0
        {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }

        if action.move_id == "bellydrum"
            && let Some(p) = self.get_pokemon(attacker_ident)
            && (p.hp.into_inner() <= p.maxhp.into_inner() / 2 || p.boosts.atk == 6.into())
        {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }

        if action.move_id == "suckerpunch" {
            let target_ident = PokemonIdent {
                player: action.target_player,
                slot: action.target_slot.into(),
            };
            let target_will_attack = self.turn_actions.iter().any(|a| {
                if let crate::sim::action::Action::Move(m) = a
                    && m.player == target_ident.player
                    && m.slot == target_ident.slot
                    && let Some(target_meta) = pkmn_meta::move_meta::get_move_meta(&m.move_id)
                {
                    *target_meta.category() != pkmn_meta::types::Category::Status
                } else {
                    false
                }
            });
            if !target_will_attack {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: attacker_ident,
                }));
                return Ok(());
            }
        }

        if action.move_id == "upperhand" {
            let target_ident = PokemonIdent {
                player: action.target_player,
                slot: action.target_slot.into(),
            };
            let target_will_priority_attack = self.turn_actions.iter().any(|a| {
                if let crate::sim::action::Action::Move(m) = a
                    && m.player == target_ident.player
                    && m.slot == target_ident.slot
                    && let Some(target_meta) = pkmn_meta::move_meta::get_move_meta(&m.move_id)
                {
                    *target_meta.category() != pkmn_meta::types::Category::Status && m.priority > 0
                } else {
                    false
                }
            });
            if !target_will_priority_attack {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: attacker_ident,
                }));
                return Ok(());
            }
        }

        if action.move_id == "steelroller" && self.terrain.is_none() {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }

        if action.move_id == "stuffcheeks" {
            let has_berry = self
                .get_pokemon(attacker_ident)
                .and_then(|p| p.item.as_ref())
                .is_some_and(|item| item.as_ref().ends_with("berry"));
            if !has_berry {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: attacker_ident,
                }));
                return Ok(());
            }
        }

        if action.move_id == "shedtail" {
            let has_switch = if action.player == 1 {
                self.p1.team.iter().any(|p| p.hp > 0)
            } else {
                self.p2.team.iter().any(|p| p.hp > 0)
            };
            let hp = self
                .get_pokemon(attacker_ident)
                .map(|p| p.hp.into_inner())
                .unwrap_or(0);
            let maxhp = self
                .get_pokemon(attacker_ident)
                .map(|p| p.maxhp.into_inner())
                .unwrap_or(1);
            if !has_switch || hp <= (maxhp + 1) / 2 {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: attacker_ident,
                }));
                return Ok(());
            }
        }

        if let Some(p) = self.get_pokemon(attacker_ident)
            && p.volatile_status
                .contains(&pkmn_meta::types::VolatileStatus::Throatchop)
            && let Some(meta) = pkmn_meta::move_meta::get_move_meta(&action.move_id)
            && *meta.is_sound()
        {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }

        if action.move_id == "electricterrain"
            && self.terrain == Some(pkmn_meta::types::Terrain::Electric)
        {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }
        if action.move_id == "grassyterrain"
            && self.terrain == Some(pkmn_meta::types::Terrain::Grassy)
        {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }
        if action.move_id == "mistyterrain"
            && self.terrain == Some(pkmn_meta::types::Terrain::Misty)
        {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }
        if action.move_id == "psychicterrain"
            && self.terrain == Some(pkmn_meta::types::Terrain::Psychic)
        {
            self.log.push(BattleLogEvent::new(BattleLog::Fail {
                target: attacker_ident,
            }));
            return Ok(());
        }

        if action.move_id == "clangoroussoul"
            && let Some(p) = self.get_pokemon(attacker_ident)
        {
            let cost = std::cmp::max(1, p.maxhp.into_inner() * 33 / 100);
            if p.hp.into_inner() <= cost
                || (p.boosts.atk == 6.into()
                    && p.boosts.def == 6.into()
                    && p.boosts.spa == 6.into()
                    && p.boosts.spd == 6.into()
                    && p.boosts.spe == 6.into())
            {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: attacker_ident,
                }));
                return Ok(());
            }
        }

        if let Some(meta) = &meta_opt
            && let Some(vs) = meta.volatile_status()
            && (*vs == pkmn_meta::types::VolatileStatus::Protect
                || *vs == pkmn_meta::types::VolatileStatus::Kingsshield
                || *vs == pkmn_meta::types::VolatileStatus::Spikyshield
                || *vs == pkmn_meta::types::VolatileStatus::Banefulbunker
                || *vs == pkmn_meta::types::VolatileStatus::Followme
                || *vs == pkmn_meta::types::VolatileStatus::Ragepowder)
        {
            if let Some(p) = self.get_pokemon_mut(attacker_ident) {
                p.volatile_status.push(*vs);
            }
            return Ok(());
        }

        if let Some(meta) = &meta_opt
            && *meta.flags_charge()
        {
            let is_charging = self.get_pokemon(attacker_ident).is_some_and(|p| {
                p.volatile_status
                    .contains(&pkmn_meta::types::VolatileStatus::Twoturnmove)
            });

            let is_sun = self.weather == Some(pkmn_meta::types::Weather::HashSunlight)
                || self.weather == Some(pkmn_meta::types::Weather::ExtremelyHarshSunlight);
            let skip_charge = (action.move_id == "electroshot"
                && (self.weather == Some(pkmn_meta::types::Weather::Rain)
                    || self.weather == Some(pkmn_meta::types::Weather::HeavyRain)))
                || ((action.move_id == "solarbeam" || action.move_id == "solarblade") && is_sun);

            if !is_charging && !skip_charge {
                if let Some(p) = self.get_pokemon_mut(attacker_ident) {
                    p.volatile_status
                        .push(pkmn_meta::types::VolatileStatus::Twoturnmove);

                    if let Ok(specific_volatile) = std::str::FromStr::from_str(&action.move_id) {
                        p.volatile_status.push(specific_volatile);
                    }
                }
                self.log.push(BattleLogEvent::new(BattleLog::Prepare {
                    target: attacker_ident,
                    move_id: action.move_id.clone(),
                }));

                if action.move_id == "electroshot" || action.move_id == "meteorbeam" {
                    self.apply_stat_change(action.player, action.slot, Stat::Spa, 1, action.player);
                }

                return Ok(());
            } else {
                if action.move_id == "electroshot" && skip_charge {
                    self.apply_stat_change(action.player, action.slot, Stat::Spa, 1, action.player);
                }

                if let Some(p) = self.get_pokemon_mut(attacker_ident) {
                    p.volatile_status
                        .retain(|s| s != &pkmn_meta::types::VolatileStatus::Twoturnmove);

                    if let Ok(specific_volatile) = std::str::FromStr::from_str(&action.move_id) {
                        p.volatile_status.retain(|s| s != &specific_volatile);
                    }
                }
            }
        }

        let alive_targets = self.get_move_targets(&action);

        if action.move_id == "allyswitch" {
            let side = if action.player == 1 {
                &mut self.p1
            } else {
                &mut self.p2
            };
            if side.active.len() == 2
                && side.active[0].hp.into_inner() > 0
                && side.active[1].hp.into_inner() > 0
            {
                side.active.swap(0, 1);
                let t_ident = PokemonIdent {
                    player: action.player,
                    slot: 0,
                };
                self.log.push(BattleLogEvent::new(BattleLog::Swap {
                    target: t_ident,
                    target_slot: 1,
                }));

                for a in &mut self.turn_actions {
                    match a {
                        crate::sim::action::Action::Move(m) => {
                            if m.player == action.player {
                                if m.slot == 0 {
                                    m.slot = 1;
                                } else if m.slot == 1 {
                                    m.slot = 0;
                                }
                            }
                        }
                        crate::sim::action::Action::Switch(s) => {
                            if s.player == action.player {
                                if s.slot == 0 {
                                    s.slot = 1;
                                } else if s.slot == 1 {
                                    s.slot = 0;
                                }
                            }
                        }
                    }
                }
            } else {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: attacker_ident,
                }));
            }
            return Ok(());
        }

        if action.move_id == "auroraveil" {
            let is_snow = self.weather == Some(pkmn_meta::types::Weather::Snow)
                || self.weather == Some(pkmn_meta::types::Weather::Snow)
                || self.weather == Some(pkmn_meta::types::Weather::Snow)
                || self.weather == Some(pkmn_meta::types::Weather::Snow);
            if !is_snow {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: attacker_ident,
                }));
                return Ok(());
            } else {
                if action.player == 1 {
                    self.p1.aurora_veil_turns = 5;
                } else {
                    self.p2.aurora_veil_turns = 5;
                }
                return Ok(());
            }
        }

        let is_spread = alive_targets.len() > 1;
        let mut move_successful = false;
        let mut total_damage_dealt = 0;

        let mut hit_count = if let Some(meta) = &meta_opt
            && let Some((min_hits, max_hits)) = meta.multihit()
        {
            if min_hits == max_hits {
                *min_hits
            } else {
                let mut rng = rand::rng();
                let force_damage_roll = self
                    .rng_config
                    .as_ref()
                    .and_then(|c| c.damage_roll.as_ref())
                    .map(|s| s.as_str());

                match force_damage_roll {
                    Some("max") => *max_hits,
                    Some("min") => *min_hits,
                    _ => rng.random_range(*min_hits..=*max_hits),
                }
            }
        } else {
            1
        };

        if action.move_id == "beatup" {
            let (active, benched) = if action.player == 1 {
                (&self.p1.active, &self.p1.team)
            } else {
                (&self.p2.active, &self.p2.team)
            };
            let mut count = 0;
            for p in active {
                if p.hp > 0 && p.status.is_none() {
                    count += 1;
                }
            }
            for p in benched {
                if p.hp > 0 && p.status.is_none() {
                    count += 1;
                }
            }
            hit_count = count;
        }

        let mut fainted_targets = std::collections::HashSet::new();

        'hit_loop: for hit_idx in 0..hit_count {
            if !self.get_pokemon(attacker_ident).is_some_and(|p| p.hp > 0) {
                break 'hit_loop;
            }

            let mut hit_anyone_this_turn = false;

            let mut current_targets = alive_targets.clone();

            if action.move_id == "dragondarts" {
                // Determine valid targets for dragon darts
                let is_valid =
                    |t_player: u8, t_slot: usize, battle: &crate::sim::battle::Battle| -> bool {
                        if let Some(p) = battle.get_pokemon(crate::sim::battle::PokemonIdent {
                            player: t_player,
                            slot: t_slot,
                        }) {
                            if p.hp.into_inner() == 0 {
                                return false;
                            }
                            let is_fairy = p.type1 == pkmn_meta::types::Type::Fairy
                                || p.type2 == Some(pkmn_meta::types::Type::Fairy)
                                || p.added_type == Some(pkmn_meta::types::Type::Fairy);
                            if is_fairy {
                                return false;
                            }
                            let protecting = p
                                .volatile_status
                                .contains(&pkmn_meta::types::VolatileStatus::Protect)
                                || p.volatile_status
                                    .contains(&pkmn_meta::types::VolatileStatus::Spikyshield)
                                || p.volatile_status
                                    .contains(&pkmn_meta::types::VolatileStatus::Banefulbunker)
                                || p.volatile_status
                                    .contains(&pkmn_meta::types::VolatileStatus::Kingsshield);
                            if protecting {
                                return false;
                            }
                            true
                        } else {
                            false
                        }
                    };

                let t_player = action.target_player;
                let t_slot = action.target_slot as usize;
                let ally_slot = if t_slot == 0 { 1 } else { 0 };

                let target_valid = is_valid(t_player, t_slot, self);
                let ally_valid = is_valid(t_player, ally_slot, self);

                let is_doubles = self.p1.active.len() > 1 || self.p2.active.len() > 1;

                if is_doubles {
                    // Check redirection first
                    let (r_player, r_slot) =
                        self.resolve_redirection(action.player, action.slot, t_player, t_slot);
                    if r_slot != t_slot {
                        // Redirection active: BOTH hits go to redirector
                        current_targets = vec![(r_player, r_slot)];
                    } else if target_valid && ally_valid {
                        if hit_idx == 0 {
                            current_targets = vec![(t_player, t_slot)];
                        } else {
                            current_targets = vec![(t_player, ally_slot)];
                        }
                    } else if target_valid {
                        current_targets = vec![(t_player, t_slot)];
                    } else if ally_valid {
                        current_targets = vec![(t_player, ally_slot)];
                    } else {
                        current_targets = vec![(t_player, t_slot)];
                    }
                }
            }

            for &(t_player, t_slot) in &current_targets {
                let res =
                    self.execute_move_hit(&action, t_player, t_slot, is_spread, hit_idx as u32);
                if res.hit_anyone {
                    hit_anyone_this_turn = true;
                    move_successful = true;
                }
                total_damage_dealt += res.damage_dealt;

                if res.immune_stop {
                    break 'hit_loop;
                }
            }

            for &(t_player, t_slot) in &alive_targets {
                let target_ident = PokemonIdent {
                    player: t_player,
                    slot: t_slot,
                };
                if !fainted_targets.contains(&target_ident)
                    && !self.get_pokemon(target_ident).is_some_and(|p| p.hp > 0)
                {
                    self.log.push(BattleLogEvent::new(BattleLog::Faint {
                        target: target_ident,
                    }));
                    fainted_targets.insert(target_ident);

                    // Destiny Bond check
                    if self.get_pokemon(target_ident).is_some_and(|p| {
                        p.volatile_status
                            .contains(&pkmn_meta::types::VolatileStatus::Destinybond)
                    }) && let Some(attacker) = self.get_pokemon_mut(attacker_ident)
                        && attacker.hp.into_inner() > 0
                    {
                        attacker.hp = 0.into();
                        self.log.push(BattleLogEvent::new(BattleLog::Activate {
                            target: target_ident,
                            effect: "move: Destiny Bond".to_string(),
                        }));
                        self.log.push(BattleLogEvent::new(BattleLog::Faint {
                            target: attacker_ident,
                        }));
                    }
                }
            }

            if !hit_anyone_this_turn {
                break 'hit_loop;
            }
        }

        if action.move_id == "explosion"
            || action.move_id == "selfdestruct"
            || action.move_id == "mistyexplosion"
            || (action.move_id == "memento" && move_successful)
        {
            if let Some(p) = self.get_pokemon_mut(attacker_ident)
                && p.hp.into_inner() > 0
            {
                p.hp = 0.into();
            }
            self.log.push(BattleLogEvent::new(BattleLog::Faint {
                target: attacker_ident,
            }));
        }

        if !move_successful
            && ["axekick", "highjumpkick", "jumpkick", "supercellslam"]
                .contains(&action.move_id.as_str())
        {
            let attacker_maxhp = self
                .get_pokemon(attacker_ident)
                .map(|p| p.maxhp.into_inner())
                .unwrap_or(1);
            let crash_damage = std::cmp::max(1, attacker_maxhp / 2);
            self.section_take_damage(attacker_ident, crash_damage);
            self.log.push(BattleLogEvent::new(BattleLog::Damage {
                target: attacker_ident,
                damage: crash_damage,
                is_crit: false,
                effectiveness: 0,
                absorbed: false,
                from_effect: None,
            }));
        }

        if action.move_id == "steelbeam"
            && let Some(p) = self.get_pokemon(attacker_ident)
            && p.hp.into_inner() > 0
        {
            let attacker_maxhp = p.maxhp.into_inner();
            let recoil_damage = std::cmp::max(1, (attacker_maxhp + 1) / 2);
            self.section_take_damage(attacker_ident, recoil_damage);
            self.log.push(BattleLogEvent::new(BattleLog::Damage {
                target: attacker_ident,
                damage: recoil_damage,
                is_crit: false,
                effectiveness: 0,
                absorbed: false,
                from_effect: Some("Steel Beam".to_string()),
            }));
            if let Some(p) = self.get_pokemon(attacker_ident)
                && p.hp.into_inner() == 0
            {
                self.log.push(BattleLogEvent::new(BattleLog::Faint {
                    target: attacker_ident,
                }));
            }
        }

        if move_successful && let Some(meta) = &meta_opt {
            let attacker_item = self.get_pokemon(attacker_ident).and_then(|p| p.item);

            crate::sim::moves::handle_move_self_effect(
                self,
                &action.move_id,
                action.player,
                action.slot,
                (*meta.range() == pkmn_meta::types::Range::Self_)
                    .then(|| meta.volatile_status().as_ref().copied())
                    .flatten(),
            );

            // SIDE CONDITIONS
            let turns = if attacker_item
                .as_ref()
                .is_some_and(|i| i.as_ref().replace("-", "") == "lightclay")
            {
                8
            } else {
                5
            };
            if action.move_id == "reflect" {
                if action.player == 1 {
                    self.p1.reflect_turns = turns;
                } else {
                    self.p2.reflect_turns = turns;
                }
                self.log.push(BattleLogEvent::new(BattleLog::SideStart {
                    player: action.player,
                    effect: "Reflect".to_string(),
                }));
            }
            if action.move_id == "lightscreen" {
                if action.player == 1 {
                    self.p1.lightscreen_turns = turns;
                } else {
                    self.p2.lightscreen_turns = turns;
                }
                self.log.push(BattleLogEvent::new(BattleLog::SideStart {
                    player: action.player,
                    effect: "Light Screen".to_string(),
                }));
            }
            if action.move_id == "auroraveil"
                && self.weather == Some(pkmn_meta::types::Weather::Snow)
            {
                if action.player == 1 {
                    self.p1.aurora_veil_turns = turns;
                } else {
                    self.p2.aurora_veil_turns = turns;
                }
                self.log.push(BattleLogEvent::new(BattleLog::SideStart {
                    player: action.player,
                    effect: "Aurora Veil".to_string(),
                }));
            }
            if action.move_id == "safeguard" {
                if action.player == 1 {
                    self.p1.safeguard_turns = 5;
                } else {
                    self.p2.safeguard_turns = 5;
                }
                self.log.push(BattleLogEvent::new(BattleLog::SideStart {
                    player: action.player,
                    effect: "Safeguard".to_string(),
                }));
            }
            if action.move_id == "tailwind" {
                if action.player == 1 {
                    self.p1.tailwind = true;
                    self.p1.tailwind_turns = 4;
                } else {
                    self.p2.tailwind = true;
                    self.p2.tailwind_turns = 4;
                }
                self.log.push(BattleLogEvent::new(BattleLog::SideStart {
                    player: action.player,
                    effect: "move: Tailwind".to_string(),
                }));
            }

            let mut move_type = *meta.move_type();
            if let Some(attacker) = self.get_pokemon(attacker_ident)
                && attacker
                    .volatile_status
                    .contains(&pkmn_meta::types::VolatileStatus::Electrify)
            {
                move_type = pkmn_meta::types::Type::Electric;
            }
            if let Some(attacker) = self.get_pokemon(attacker_ident)
                && let Some(ability_id) = attacker.ability.as_ref()
                && let Some(ability) = crate::sim::abilities::get_ability(ability_id)
                && ability.has_on_modify_type
                && let Some(new_type) = crate::sim::abilities::on_modify_type(ability_id, move_type)
            {
                move_type = new_type;
            }

            if move_type == pkmn_meta::types::Type::Electric
                && action.move_id != "charge"
                && let Some(p) = self.get_pokemon_mut(attacker_ident)
            {
                p.volatile_status
                    .retain(|s| s != &pkmn_meta::types::VolatileStatus::Charge);
            }

            if let Some(self_eff) = meta.self_effect().as_ref()
                && let Some(boosts) = self_eff.boosts().as_ref()
            {
                let stats = [
                    (Stat::Atk, boosts.atk.into_inner()),
                    (Stat::Def, boosts.def.into_inner()),
                    (Stat::Spa, boosts.spa.into_inner()),
                    (Stat::Spd, boosts.spd.into_inner()),
                    (Stat::Spe, boosts.spe.into_inner()),
                    (Stat::Accuracy, boosts.accuracy.into_inner()),
                    (Stat::Evasion, boosts.evasion.into_inner()),
                ];
                for (stat, amount) in stats {
                    let amount = if action.move_id == "makeitrain" && stat == Stat::Spa {
                        -2
                    } else {
                        amount
                    };
                    if amount != 0 {
                        self.apply_stat_change(
                            action.player,
                            action.slot,
                            stat,
                            amount,
                            action.player,
                        );
                    }
                }
            }

            if *meta.flags_recharge() {
                self.section_apply_volatile(
                    attacker_ident,
                    pkmn_meta::types::VolatileStatus::Mustrecharge,
                );
            }

            if let Some(item_meta) = attacker_item
                .as_ref()
                .and_then(pkmn_meta::item_meta::get_item_meta)
                && *item_meta.is_life_orb()
                && total_damage_dealt > 0
                && !meta_opt
                    .as_ref()
                    .is_some_and(|m| *m.category() == pkmn_meta::types::Category::Status)
            {
                let attacker_maxhp = self
                    .get_pokemon(attacker_ident)
                    .map(|p| p.maxhp.into_inner())
                    .unwrap_or(0);
                let lo_recoil = std::cmp::max(1, attacker_maxhp / 10);
                self.section_take_damage(attacker_ident, lo_recoil);
                self.log.push(BattleLogEvent::new(BattleLog::Damage {
                    target: attacker_ident,
                    damage: lo_recoil,
                    is_crit: false,
                    effectiveness: 0,
                    absorbed: false,
                    from_effect: Some("item: Life Orb".to_string()),
                }));
                if self.get_pokemon(attacker_ident).is_some_and(|p| p.hp == 0) {
                    self.log.push(BattleLogEvent::new(BattleLog::Faint {
                        target: attacker_ident,
                    }));
                }
            }

            if attacker_item == Some(pkmn_meta::types::ItemId::ShellBell)
                && total_damage_dealt > 0
                && !meta_opt
                    .as_ref()
                    .is_some_and(|m| *m.category() == pkmn_meta::types::Category::Status)
            {
                let heal_amount = std::cmp::max(1, total_damage_dealt / 8);
                if let Some(p) = self.get_pokemon_mut(attacker_ident) {
                    let old_hp = p.hp.into_inner();
                    if old_hp < p.maxhp.into_inner() {
                        p.hp = std::cmp::min(p.maxhp.into_inner(), p.hp.into_inner() + heal_amount)
                            .into();
                        self.log.push(BattleLogEvent::new(BattleLog::Heal {
                            target: attacker_ident,
                            amount: heal_amount,
                        }));
                    }
                }
            }

            if action.move_id == "batonpass"
                || action.move_id == "shedtail"
                || ((action.move_id == "flipturn"
                    || action.move_id == "uturn"
                    || action.move_id == "voltswitch")
                    && if action.player == 1 {
                        self.p1.team.iter().any(|p| p.hp > 0)
                    } else {
                        self.p2.team.iter().any(|p| p.hp > 0)
                    })
            {
                self.turn_state = crate::sim::battle::TurnState::WaitingForSwitch {
                    player: action.player,
                    pass_stats: action.move_id == "batonpass",
                };
            }
        }
        if move_successful {
            self.global_last_move_used = Some(action.move_id.clone());
        }

        // Trigger White Herb for any active Pokémon with stat drops
        for player in 1..=2 {
            for slot in 0..2 {
                crate::sim::items::check_white_herb(self, PokemonIdent { player, slot });
            }
        }

        Ok(())
    }

    fn try_move(&mut self, action: &crate::sim::action::MoveAction) -> bool {
        let attacker_ident = PokemonIdent {
            player: action.player,
            slot: action.slot,
        };
        let (is_alive, attacker_has_flinch, attacker_status) =
            if let Some(p) = self.get_pokemon(attacker_ident) {
                (
                    p.hp > 0,
                    p.volatile_status
                        .contains(&pkmn_meta::types::VolatileStatus::Flinch),
                    p.status,
                )
            } else {
                (false, false, None)
            };

        if !is_alive {
            return false;
        }

        if attacker_has_flinch {
            self.log.push(BattleLogEvent::new(BattleLog::Cant {
                target: attacker_ident,
                reason: "flinch".to_string(),
                move_id: None,
            }));
            return false;
        }

        if let Some(p) = self.get_pokemon(attacker_ident) {
            let is_status = pkmn_meta::move_meta::get_move_meta(&action.move_id)
                .map(|m| *m.category() == pkmn_meta::types::Category::Status)
                .unwrap_or(false);
            if is_status
                && p.volatile_status
                    .contains(&pkmn_meta::types::VolatileStatus::Taunt)
            {
                self.log.push(BattleLogEvent::new(BattleLog::Cant {
                    target: attacker_ident,
                    reason: "Taunt".to_string(),
                    move_id: Some(action.move_id.clone()),
                }));
                return false;
            }
            if p.disabled_move.as_ref() == Some(&action.move_id) {
                self.log.push(BattleLogEvent::new(BattleLog::Cant {
                    target: attacker_ident,
                    reason: "Disable".to_string(),
                    move_id: Some(action.move_id.clone()),
                }));
                return false;
            }
            if action.move_id == "focuspunch" && !p.turn_state.damage_taken_from.is_empty() {
                self.log.push(BattleLogEvent::new(BattleLog::Cant {
                    target: attacker_ident,
                    reason: "Focus Punch".to_string(),
                    move_id: Some("Focus Punch".to_string()),
                }));
                return false;
            }
            if self.gravity_turns_left > 0
                && [
                    "bounce",
                    "fly",
                    "flyingpress",
                    "highjumpkick",
                    "jumpkick",
                    "magnetrise",
                    "splash",
                ]
                .contains(&action.move_id.as_str())
            {
                self.log.push(BattleLogEvent::new(BattleLog::Cant {
                    target: attacker_ident,
                    reason: "gravity".to_string(),
                    move_id: Some(action.move_id.clone()),
                }));
                return false;
            }
        }

        let move_id = action.move_id.clone();
        let mut consumed_leppa = false;
        let max_pp = pkmn_meta::move_meta::get_move_meta(&move_id)
            .map(|m| *m.pp())
            .unwrap_or(0);

        if let Some(p) = self.get_pokemon_mut(attacker_ident) {
            let pp_count = p.pp_used.entry(move_id.clone()).or_insert(0);
            *pp_count = pp_count.saturating_add(1);
            if *pp_count >= max_pp && p.item.as_ref().map(|x| x.as_ref()) == Some("leppaberry") {
                *pp_count = pp_count.saturating_sub(10);
                consumed_leppa = true;
                p.item = None;
            }

            if p.last_move_used.as_deref() == Some(move_id.as_str()) {
                p.consecutive_move_counter = p.consecutive_move_counter.saturating_add(1).min(5);
            } else {
                p.consecutive_move_counter = 1;
                p.last_move_used = Some(move_id.clone());
            }
        }

        if consumed_leppa {
            self.section_consume_item(attacker_ident);
        }

        if attacker_status.as_ref().map(|s| s.as_ref()) == Some("slp") {
            if move_id != "sleeptalk" && move_id != "snore" {
                return false;
            }
        } else if attacker_status.as_ref().map(|s| s.as_ref()) == Some("frz") {
            return false;
        }

        let mut skip_turn = false;

        if let Some(p) = self.get_pokemon_mut(attacker_ident)
            && p.volatile_status
                .contains(&pkmn_meta::types::VolatileStatus::Mustrecharge)
        {
            p.volatile_status
                .retain(|s| s != &pkmn_meta::types::VolatileStatus::Mustrecharge);
            skip_turn = true;
        }

        let mut max_roll = false;
        if let Some(config) = &self.rng_config {
            max_roll = config.damage_roll.as_deref() == Some("max");
        }
        let hits_self = max_roll || rand::rng().random_range(1..=3) == 1;

        if let Some(p) = self.get_pokemon_mut(attacker_ident)
            && p.volatile_status
                .contains(&pkmn_meta::types::VolatileStatus::Confusion)
            && hits_self
        {
            let attack = p.attack.apply_boost(p.boosts.atk).into_inner();
            let defense = p.defense.apply_boost(p.boosts.def).into_inner();
            let damage = (((2 * 50 / 5 + 2) * 40 * attack) / defense) / 50 + 2;

            let final_damage = if max_roll {
                (damage * 100) / 100
            } else {
                (damage * rand::rng().random_range(85..=100)) / 100
            };

            self.section_take_damage(attacker_ident, final_damage);
            self.log.push(BattleLogEvent::new(BattleLog::Damage {
                target: attacker_ident,
                damage: final_damage,
                is_crit: false,
                effectiveness: 0,
                absorbed: false,
                from_effect: None,
            }));
            skip_turn = true;
        }

        if skip_turn {
            return false;
        }

        true
    }

    fn get_move_targets(&self, action: &crate::sim::action::MoveAction) -> Vec<(u8, usize)> {
        let meta_opt = pkmn_meta::move_meta::get_move_meta(&action.move_id);
        let range = meta_opt
            .as_ref()
            .map(|m| m.range())
            .unwrap_or(&pkmn_meta::types::Range::SingleTarget);

        let mut range = *range;
        if action.move_id == "expandingforce"
            && self.terrain == Some(pkmn_meta::types::Terrain::Psychic)
            && self
                .get_pokemon(PokemonIdent {
                    player: action.player,
                    slot: action.slot,
                })
                .is_some_and(|p| p.is_grounded())
        {
            range = pkmn_meta::types::Range::AllOpponents;
        }
        if action.move_id == "mistyexplosion" {
            range = pkmn_meta::types::Range::AllPokemon;
        } else if action.move_id == "mountaingale" || action.move_id == "psyshieldbash" {
            range = pkmn_meta::types::Range::SingleTarget;
        }

        let targets = match range {
            pkmn_meta::types::Range::Self_ => vec![(action.player, action.slot)],
            pkmn_meta::types::Range::AllOpponents => {
                vec![(action.target_player, 0), (action.target_player, 1)]
            }
            pkmn_meta::types::Range::AllPokemon => {
                vec![
                    (action.player, if action.slot == 0 { 1 } else { 0 }),
                    (action.target_player, 0),
                    (action.target_player, 1),
                ]
            }
            pkmn_meta::types::Range::UserSSide | pkmn_meta::types::Range::AllAllies => {
                let active_len = if action.player == 1 {
                    self.p1.active.len()
                } else {
                    self.p2.active.len()
                };
                (0..active_len).map(|slot| (action.player, slot)).collect()
            }
            pkmn_meta::types::Range::SingleAlly => {
                vec![(action.target_player, action.target_slot.into())]
            }
            pkmn_meta::types::Range::RandomOpponent => {
                let opponent_active_len = if action.target_player == 1 {
                    self.p1.active.len()
                } else {
                    self.p2.active.len()
                };
                let target_slot = if opponent_active_len > 1 { 1 } else { 0 };
                vec![(action.target_player, target_slot)]
            }
            _ => vec![(action.target_player, action.target_slot.into())],
        };

        let is_spread_move_targeting = targets.len() > 1;
        let mut alive_targets = Vec::new();

        for &(t_player, t_slot) in &targets {
            let (final_player, final_slot) = if !is_spread_move_targeting {
                self.resolve_redirection(action.player, action.slot, t_player, t_slot)
            } else {
                (t_player, t_slot)
            };

            if self
                .get_pokemon(PokemonIdent {
                    player: final_player,
                    slot: final_slot,
                })
                .is_some_and(|p| p.hp > 0)
            {
                alive_targets.push((final_player, final_slot));
            }
        }

        alive_targets
    }

    fn execute_move_hit(
        &mut self,
        action: &crate::sim::action::MoveAction,
        t_player: u8,
        t_slot: usize,
        is_spread: bool,
        hit_index: u32,
    ) -> HitResult {
        let attacker_ident = PokemonIdent {
            player: action.player,
            slot: action.slot,
        };
        let target_ident = PokemonIdent {
            player: t_player,
            slot: t_slot,
        };

        let target_alive = self.get_pokemon(target_ident).is_some_and(|p| p.hp > 0);
        if !target_alive {
            return HitResult {
                damage_dealt: 0,
                hit_anyone: false,
                immune_stop: false,
            };
        }

        let mut target_is_protected = false;
        let mut target_protection_vs = None;

        if let Some(p) = self.get_pokemon(target_ident) {
            for vs in [
                pkmn_meta::types::VolatileStatus::Protect,
                pkmn_meta::types::VolatileStatus::Kingsshield,
                pkmn_meta::types::VolatileStatus::Spikyshield,
                pkmn_meta::types::VolatileStatus::Banefulbunker,
            ] {
                if p.volatile_status.contains(&vs) {
                    target_is_protected = true;
                    target_protection_vs = Some(vs);
                    break;
                }
            }
        }

        let target_is_grounded = self
            .get_pokemon(target_ident)
            .is_some_and(|p| p.is_grounded());
        let meta_opt = pkmn_meta::move_meta::get_move_meta(&action.move_id);

        if let Some(meta) = &meta_opt {
            if target_is_protected && *meta.flags_protect() {
                let effect_str = match target_protection_vs {
                    Some(pkmn_meta::types::VolatileStatus::Kingsshield) => "move: King's Shield",
                    Some(pkmn_meta::types::VolatileStatus::Spikyshield) => "move: Spiky Shield",
                    Some(pkmn_meta::types::VolatileStatus::Banefulbunker) => "move: Baneful Bunker",
                    _ => "move: Protect",
                };

                self.log.push(BattleLogEvent::new(BattleLog::Activate {
                    target: target_ident,
                    effect: effect_str.to_string(),
                }));

                if *meta.flags_contact()
                    && let Some(pkmn_meta::types::VolatileStatus::Banefulbunker) =
                        target_protection_vs
                    && let Some(p) = self.get_pokemon_mut(attacker_ident)
                    && p.status.is_none()
                    && p.type1 != pkmn_meta::types::Type::Poison
                    && p.type2 != Some(pkmn_meta::types::Type::Poison)
                    && p.type1 != pkmn_meta::types::Type::Steel
                    && p.type2 != Some(pkmn_meta::types::Type::Steel)
                {
                    p.status = Some(pkmn_meta::types::Status::Poison);
                    self.log
                        .push(BattleLogEvent::new(BattleLog::StatusInflicted {
                            target: attacker_ident,
                            status: "psn".to_string(),
                        }));
                }
                if *meta.flags_contact()
                    && let Some(pkmn_meta::types::VolatileStatus::Spikyshield) =
                        target_protection_vs
                    && let Some(p) = self.get_pokemon_mut(attacker_ident)
                    && p.hp.into_inner() > 0
                {
                    let maxhp = p.maxhp.into_inner();
                    let dmg = std::cmp::max(1, maxhp / 8);
                    self.section_take_damage(attacker_ident, dmg);
                    self.log.push(BattleLogEvent::new(BattleLog::Damage {
                        target: attacker_ident,
                        damage: dmg,
                        is_crit: false,
                        effectiveness: 0,
                        absorbed: false,
                        from_effect: Some("Spiky Shield".to_string()),
                    }));
                    if let Some(p) = self.get_pokemon(attacker_ident)
                        && p.hp.into_inner() == 0
                    {
                        self.log.push(BattleLogEvent::new(BattleLog::Faint {
                            target: attacker_ident,
                        }));
                    }
                }

                return HitResult {
                    damage_dealt: 0,
                    hit_anyone: false,
                    immune_stop: false,
                };
            } else if self.terrain == Some(pkmn_meta::types::Terrain::Psychic)
                && action.priority > 0
                && target_is_grounded
                && t_player != action.player
            {
                return HitResult {
                    damage_dealt: 0,
                    hit_anyone: false,
                    immune_stop: false,
                };
            }
        }

        let mut hit = true;
        let mut flung_item = None;
        if action.move_id == "fling"
            && let Some(attacker) = self.get_pokemon_mut(attacker_ident)
        {
            if let Some(item) = attacker.item.take() {
                flung_item = Some(item);
                self.log.push(BattleLogEvent::new(BattleLog::Text {
                    message: format!("|-enditem|{}|{}|[from] move: Fling", attacker_ident, item),
                }));
            } else {
                hit = false;
            }
        }
        if let Some(p) = self.get_pokemon(target_ident) {
            let mut is_invuln = false;
            let attacker_ability = self
                .get_pokemon(attacker_ident)
                .and_then(|a| a.ability.as_ref().map(|a| a.as_str()));
            let defender_ability = p.ability.as_ref().map(|a| a.as_str());
            let mut ignore_invuln = false;

            if attacker_ability == Some("noguard") || defender_ability == Some("noguard") {
                ignore_invuln = true;
            }

            if !ignore_invuln
                && p.volatile_status
                    .contains(&pkmn_meta::types::VolatileStatus::Twoturnmove)
            {
                is_invuln = true;
            }

            if is_invuln {
                hit = false;
            }
        }

        if hit
            && let Some(meta) = &meta_opt
            && let Some(mut acc) = *meta.accuracy()
        {
            let attacker_item = self.get_pokemon(attacker_ident).and_then(|p| p.item);
            let defender_item = self.get_pokemon(target_ident).and_then(|p| p.item);

            if attacker_item.as_ref().map(|a| a.as_ref()) == Some("widelens") {
                acc = (acc as f32 * 1.1) as i32;
            } else if attacker_item.as_ref().map(|a| a.as_ref()) == Some("zoomlens") {
                acc = (acc as f32 * 1.2) as i32;
            }
            if defender_item.as_ref().map(|a| a.as_ref()) == Some("brightpowder") {
                acc = (acc as f32 * 0.9) as i32;
            }

            let force_acc = self
                .rng_config
                .as_ref()
                .and_then(|c| c.accuracy.as_ref())
                .map(|s| s.as_str());

            // Weather bypasses
            let mut bypass = false;
            if action.move_id == "blizzard" && self.weather == Some(pkmn_meta::types::Weather::Snow)
            {
                bypass = true;
            }
            if (action.move_id == "thunder" || action.move_id == "hurricane")
                && self.weather == Some(pkmn_meta::types::Weather::Rain)
            {
                bypass = true;
            }

            if bypass {
                hit = true;
            } else {
                match force_acc {
                    Some("hit") | Some("always") => hit = true,
                    Some("miss") | Some("never") => hit = false,
                    _ => {
                        let is_ohko = matches!(
                            action.move_id.as_str(),
                            "fissure" | "guillotine" | "horndrill" | "sheercold"
                        );
                        let mut base_acc = acc as f64;
                        if is_ohko {
                            base_acc = 30.0;
                            if action.move_id == "sheercold" {
                                let attacker = self.get_pokemon(attacker_ident).unwrap();
                                if attacker.type1 != pkmn_meta::types::Type::Ice
                                    && attacker.type2 != Some(pkmn_meta::types::Type::Ice)
                                {
                                    base_acc = 20.0;
                                }
                            }
                        }

                        let attacker_boosts = self
                            .get_pokemon(attacker_ident)
                            .map(|p| p.boosts.clone())
                            .unwrap_or_default();
                        let defender_boosts = self
                            .get_pokemon(target_ident)
                            .map(|p| p.boosts.clone())
                            .unwrap_or_default();

                        let acc_stage = attacker_boosts.accuracy.into_inner().clamp(-6, 6);
                        let mut eva_stage = defender_boosts.evasion.into_inner().clamp(-6, 6);
                        if action.move_id == "darkestlariat"
                            || action.move_id == "sacredsword"
                            || action.move_id == "chipaway"
                        {
                            eva_stage = 0;
                        }
                        let total_stage = (acc_stage - eva_stage).clamp(-6, 6);

                        let modifier = if is_ohko {
                            1.0 // Bypasses accuracy modifiers
                        } else if total_stage >= 0 {
                            (3.0 + total_stage as f64) / 3.0
                        } else {
                            3.0 / (3.0 - total_stage as f64)
                        };

                        let mut final_acc = (base_acc * modifier) as i32;
                        if !is_ohko {
                            let attacker_item =
                                self.get_pokemon(attacker_ident).and_then(|p| p.item);
                            let defender_item = self.get_pokemon(target_ident).and_then(|p| p.item);

                            if attacker_item == Some(pkmn_meta::types::ItemId::WideLens) {
                                final_acc = ((final_acc * 4505) + 2047) / 4096;
                            }
                            if attacker_item == Some(pkmn_meta::types::ItemId::ZoomLens) {
                                let target_acted = self
                                    .get_pokemon(target_ident)
                                    .is_some_and(|p| p.turn_state.acted_this_turn);
                                if target_acted {
                                    final_acc = ((final_acc * 4915) + 2047) / 4096;
                                }
                            }
                            if defender_item == Some(pkmn_meta::types::ItemId::BrightPowder) {
                                final_acc = ((final_acc * 3686) + 2047) / 4096;
                            }
                        }

                        let mut rng = rand::rng();
                        let roll = rng.random_range(1..=100);
                        hit = roll <= final_acc;
                    }
                }
            }
        }

        if hit && action.move_id == "poltergeist" {
            let target_item = self.get_pokemon(target_ident).and_then(|p| p.item);
            let Some(item_id) = target_item else {
                self.log.push(BattleLogEvent::new(BattleLog::Fail {
                    target: attacker_ident,
                }));
                return HitResult {
                    damage_dealt: 0,
                    hit_anyone: false,
                    immune_stop: false,
                };
            };
            {
                let item_str = item_id.to_string();
                let item_name = if item_str == "sitrus-berry" {
                    "Sitrus-berry".to_string()
                } else if item_str == "leftovers" {
                    "Leftovers".to_string()
                } else {
                    item_str
                };
                self.log.push(BattleLogEvent::new(BattleLog::Text {
                    message: format!(
                        "|-activate|{}|move: Poltergeist|{}",
                        target_ident, item_name
                    ),
                }));
            }
        }

        if !hit {
            self.log.push(BattleLogEvent::new(BattleLog::Miss {
                attacker: attacker_ident,
                target: target_ident,
            }));
            return HitResult {
                damage_dealt: 0,
                hit_anyone: false,
                immune_stop: false,
            };
        }

        let (mut damage, absorbed_by, is_crit) = self.calculate_raw_damage(
            &action.move_id,
            action.player,
            action.slot as u8,
            t_player,
            t_slot as u8,
            is_spread,
            hit_index,
        );

        let is_status_move = meta_opt.as_ref().is_some_and(|m| {
            *m.category() == pkmn_meta::types::Category::Status && action.move_id != "sheercold"
        }) || action.move_id == "shedtail"
            || action.move_id == "spicyextract";

        let defender_type1 = self
            .get_pokemon(target_ident)
            .map(|p| p.type1)
            .unwrap_or(pkmn_meta::types::Type::Normal);
        let defender_type2 = self.get_pokemon(target_ident).and_then(|p| p.type2);
        let defender_added = self.get_pokemon(target_ident).and_then(|p| p.added_type);

        let mut move_type = meta_opt
            .as_ref()
            .map(|m| *m.move_type())
            .unwrap_or(pkmn_meta::types::Type::Normal);

        if action.move_id == "terrainpulse"
            && self
                .get_pokemon(attacker_ident)
                .is_some_and(|p| p.is_grounded())
            && let Some(terrain) = self.terrain
        {
            move_type = match terrain {
                pkmn_meta::types::Terrain::Electric => pkmn_meta::types::Type::Electric,
                pkmn_meta::types::Terrain::Grassy => pkmn_meta::types::Type::Grass,
                pkmn_meta::types::Terrain::Misty => pkmn_meta::types::Type::Fairy,
                pkmn_meta::types::Terrain::Psychic => pkmn_meta::types::Type::Psychic,
            };
        }

        if let Some(attacker) = self.get_pokemon(attacker_ident)
            && attacker
                .volatile_status
                .contains(&pkmn_meta::types::VolatileStatus::Electrify)
        {
            move_type = pkmn_meta::types::Type::Electric;
        }

        let attacker_ability_id = self
            .get_pokemon(attacker_ident)
            .and_then(|p| p.ability.as_ref());

        if let Some(ability_id) = &attacker_ability_id
            && let Some(ability) = crate::sim::abilities::get_ability(ability_id)
            && ability.has_on_modify_type
            && let Some(new_type) = crate::sim::abilities::on_modify_type(ability_id, move_type)
        {
            move_type = new_type;
        }

        let mut effectiveness = damage_calc::type_effectiveness_shift(
            move_type,
            defender_type1,
            defender_type2,
            defender_added,
        );

        if action.move_id == "flyingpress" {
            let mut shift = effectiveness;
            let types = [Some(defender_type1), defender_type2, defender_added];
            for t in types.into_iter().flatten() {
                if damage_calc::is_immune(pkmn_meta::types::Type::Flying, t, None, None) {
                    shift = -999;
                } else {
                    shift += damage_calc::type_effectiveness_shift(
                        pkmn_meta::types::Type::Flying,
                        t,
                        None,
                        None,
                    );
                }
            }
            if shift > -900 {
                effectiveness = shift;
            } else {
                // Actually Flying Press deals neutral to Ghost instead of immune if they are Flying/Fighting?
                // Wait, Flying is immune? No type is immune to Flying!
                // Fighting is immune on Ghost! The move is Fighting type!
                // The base `move_type` is Fighting. So it already calculates immune to Ghost!
            }
        }
        if action.move_id == "freezedry" {
            let mut shift = 0;
            let mut immune = false;
            let types = [Some(defender_type1), defender_type2, defender_added];
            for t in types.into_iter().flatten() {
                if t == Type::Water {
                    shift += 1;
                } else {
                    if damage_calc::is_immune(move_type, t, None, None) {
                        immune = true;
                    } else {
                        shift += damage_calc::type_effectiveness_shift(move_type, t, None, None);
                    }
                }
            }
            if !immune {
                effectiveness = shift;
            }
        } else if move_type == pkmn_meta::types::Type::Ground
            && (self.gravity_turns_left > 0
                || self
                    .get_pokemon(target_ident)
                    .is_some_and(|p| p.is_grounded()))
        {
            let def_poke = self.get_pokemon(target_ident);
            let def_has_flying = defender_type1 == pkmn_meta::types::Type::Flying
                || defender_type2 == Some(pkmn_meta::types::Type::Flying)
                || defender_added == Some(pkmn_meta::types::Type::Flying);
            let has_iron_ball =
                def_poke.is_some_and(|p| p.item == Some(pkmn_meta::types::ItemId::IronBall));
            if has_iron_ball && def_has_flying && self.gravity_turns_left == 0 {
                effectiveness = 0;
            } else {
                let mut shift = 0;
                let mut immune = false;
                let types = [Some(defender_type1), defender_type2, defender_added];
                for t in types.into_iter().flatten() {
                    if t == pkmn_meta::types::Type::Flying {
                        shift += 0;
                    } else if damage_calc::is_immune(move_type, t, None, None) {
                        immune = true;
                    } else {
                        shift += damage_calc::type_effectiveness_shift(move_type, t, None, None);
                    }
                }
                if !immune {
                    effectiveness = shift;
                }
            }
        }
        let mut is_crit = is_crit;

        if action.move_id == "finalgambit" {
            let hp = self
                .get_pokemon(attacker_ident)
                .map(|p| p.hp.into_inner())
                .unwrap_or(0);
            damage = hp;
            effectiveness = 0;
            is_crit = false;
        }

        if action.move_id == "seismictoss"
            || action.move_id == "nightshade"
            || action.move_id == "superfang"
        {
            effectiveness = 0;
        }

        let mut is_immune = !is_status_move
            && damage_calc::is_immune(move_type, defender_type1, defender_type2, defender_added);

        let attacker_ability = self
            .get_pokemon(attacker_ident)
            .and_then(|p| p.ability.as_ref().map(|a| a.as_str()));

        if is_status_move
            && attacker_ability == Some("prankster")
            && t_player != action.player
            && (defender_type1 == pkmn_meta::types::Type::Dark
                || defender_type2 == Some(pkmn_meta::types::Type::Dark)
                || defender_added == Some(pkmn_meta::types::Type::Dark))
        {
            is_immune = true;
        }

        if move_type == pkmn_meta::types::Type::Ground
            && (self.gravity_turns_left > 0
                || self
                    .get_pokemon(target_ident)
                    .is_some_and(|p| p.is_grounded()))
            && (defender_type1 == pkmn_meta::types::Type::Flying
                || defender_type2 == Some(pkmn_meta::types::Type::Flying)
                || defender_added == Some(pkmn_meta::types::Type::Flying))
        {
            // Grounded defender nullifies Flying's Ground immunity
            is_immune = false;
        }

        let is_ohko = matches!(
            action.move_id.as_str(),
            "fissure" | "guillotine" | "horndrill" | "sheercold"
        );
        if is_ohko {
            let defender_ability = self
                .get_pokemon(target_ident)
                .and_then(|p| p.ability.clone());
            if defender_ability.as_ref().map(|a| a.as_str()) == Some("sturdy") {
                is_immune = true;
            }
        }

        if action.move_id == "endeavor" {
            let attacker_hp = self
                .get_pokemon(attacker_ident)
                .map(|p| p.hp.into_inner())
                .unwrap_or(0);
            let defender_hp = self
                .get_pokemon(target_ident)
                .map(|p| p.hp.into_inner())
                .unwrap_or(0);
            if attacker_hp < defender_hp {
                damage = defender_hp - attacker_hp;
                effectiveness = 0;
                is_crit = false;
            } else {
                is_immune = true;
            }
        }

        if let Some(ability) = absorbed_by {
            let mut effect_applied = false;
            match ability.as_str() {
                "voltabsorb" | "waterabsorb" | "eartheater" => {
                    let (hp, maxhp) = self
                        .get_pokemon(target_ident)
                        .map(|p| (p.hp.into_inner(), p.maxhp.into_inner()))
                        .unwrap_or((0, 0));
                    if hp < maxhp {
                        let heal_amt = std::cmp::max(1, maxhp / 4);
                        self.section_heal(target_ident, heal_amt.into());
                        effect_applied = true;
                    }
                }
                "lightningrod" | "stormdrain" => {
                    let can_boost = self
                        .get_pokemon(target_ident)
                        .is_some_and(|p| p.boosts.spa < 6.into());
                    if can_boost {
                        self.apply_stat_change(t_player, t_slot, Stat::Spa, 1, t_player);
                        effect_applied = true;
                    }
                }
                "sapsipper" => {
                    let can_boost = self
                        .get_pokemon(target_ident)
                        .is_some_and(|p| p.boosts.atk < 6.into());
                    if can_boost {
                        self.apply_stat_change(t_player, t_slot, Stat::Atk, 1, t_player);
                        effect_applied = true;
                    }
                }
                _ => {}
            }

            if !effect_applied {
                self.log.push(BattleLogEvent::new(BattleLog::Immune {
                    target: target_ident,
                }));
            }
            let immune_stop = !is_spread;
            return HitResult {
                damage_dealt: 0,
                hit_anyone: false,
                immune_stop,
            };
        } else if is_immune {
            self.log.push(BattleLogEvent::new(BattleLog::Immune {
                target: target_ident,
            }));
            let immune_stop = !is_spread;
            return HitResult {
                damage_dealt: 0,
                hit_anyone: false,
                immune_stop,
            };
        }

        let hp_before = self
            .get_pokemon(target_ident)
            .map(|p| p.hp.into_inner())
            .unwrap_or(0);

        if action.move_id == "futuresight" && damage > 0 {
            self.future_sight_attacks
                .push(crate::sim::battle::FutureSightAttack {
                    target: target_ident,
                    damage,
                    turns_left: 2,
                });
            return HitResult {
                damage_dealt: 0,
                hit_anyone: true,
                immune_stop: false,
            };
        }

        self.section_take_damage(target_ident, damage);

        let hp_after = self
            .get_pokemon(target_ident)
            .map(|p| p.hp.into_inner())
            .unwrap_or(0);
        let actual_damage = hp_before - hp_after;

        if !is_status_move {
            self.log.push(BattleLogEvent::new(BattleLog::Damage {
                target: target_ident,
                from_effect: None,
                damage,
                is_crit,
                effectiveness,
                absorbed: false,
            }));
            if is_ohko && hp_after == 0 {
                self.log.push(BattleLogEvent::new(BattleLog::Ohko));
            }
            if action.move_id == "finalgambit" {
                let hp = self
                    .get_pokemon(attacker_ident)
                    .map(|p| p.hp.into_inner())
                    .unwrap_or(0);
                self.section_take_damage(attacker_ident, hp);
                self.log.push(BattleLogEvent::new(BattleLog::Faint {
                    target: attacker_ident,
                }));
            }
        }

        if (actual_damage > 0 || is_status_move)
            && let Some(meta) = &meta_opt
        {
            if action.move_id == "quiverdance" {
                self.apply_stat_change(t_player, t_slot, Stat::Spa, 1, action.player);
                self.apply_stat_change(t_player, t_slot, Stat::Spd, 1, action.player);
                self.apply_stat_change(t_player, t_slot, Stat::Spe, 1, action.player);
            } else if action.move_id == "noretreat" {
                self.apply_stat_change(t_player, t_slot, Stat::Atk, 1, action.player);
                self.apply_stat_change(t_player, t_slot, Stat::Def, 1, action.player);
                self.apply_stat_change(t_player, t_slot, Stat::Spa, 1, action.player);
                self.apply_stat_change(t_player, t_slot, Stat::Spd, 1, action.player);
                self.apply_stat_change(t_player, t_slot, Stat::Spe, 1, action.player);
            }
            if let Some(boosts) = meta.boosts().as_ref() {
                let stats = [
                    (Stat::Atk, boosts.atk.into_inner()),
                    (Stat::Def, boosts.def.into_inner()),
                    (Stat::Spa, boosts.spa.into_inner()),
                    (Stat::Spd, boosts.spd.into_inner()),
                    (Stat::Spe, boosts.spe.into_inner()),
                    (Stat::Accuracy, boosts.accuracy.into_inner()),
                    (Stat::Evasion, boosts.evasion.into_inner()),
                ];
                for (stat, amount) in stats {
                    if amount != 0 {
                        self.apply_stat_change(t_player, t_slot, stat, amount, action.player);
                    }
                }
            }

            if let Some(status) = meta.status().as_ref()
                && action.move_id != "toxic"
            {
                self.section_apply_status(target_ident, *status, Some(attacker_ident));
            }
            if let Some(volatile) = meta.volatile_status().as_ref()
                && *meta.range() != pkmn_meta::types::Range::Self_
            {
                if *volatile == pkmn_meta::types::VolatileStatus::Attract {
                    self.log.push(BattleLogEvent::new(BattleLog::Immune {
                        target: target_ident,
                    }));
                } else {
                    self.section_apply_volatile(target_ident, *volatile);
                }
            }
        }

        if actual_damage > 0 {
            if let Some(p) = self.get_pokemon_mut(target_ident) {
                p.turn_state.damage_taken_from.push((
                    action.player,
                    action.slot as u8,
                    actual_damage,
                    meta_opt
                        .as_ref()
                        .map(|m| *m.category())
                        .unwrap_or(pkmn_meta::types::Category::Status),
                ));
            }

            if let Some(meta) = &meta_opt {
                if let Some((num, den)) = meta.recoil() {
                    let n = *num;
                    let d = *den;
                    let recoil_damage = std::cmp::max(1, (actual_damage * n + (d / 2)) / d);
                    self.section_take_damage(attacker_ident, recoil_damage);
                    self.log.push(BattleLogEvent::new(BattleLog::Damage {
                        target: attacker_ident,
                        damage: recoil_damage,
                        is_crit: false,
                        effectiveness: 0,
                        absorbed: false,
                        from_effect: None,
                    }));
                }

                let attacker_item = self.get_pokemon(attacker_ident).and_then(|p| p.item);
                let mut drain_heal = 0;

                if let Some((num, den)) = meta.drain() {
                    let mut base_drain = std::cmp::max(
                        1,
                        ((actual_damage * (*num)) as f32 / (*den) as f32).round() as i32,
                    );
                    if attacker_item == Some(pkmn_meta::types::ItemId::BigRoot) {
                        base_drain = (base_drain as f32 * 1.3).floor() as i32; // Not sure if floor or round? Usually Big Root is (drain * 5324 / 4096)
                    }
                    drain_heal += base_drain;
                }

                if drain_heal > 0
                    && let Some(p) = self.get_pokemon_mut(attacker_ident)
                {
                    let old_hp = p.hp.into_inner();
                    if old_hp < p.maxhp.into_inner() {
                        p.hp = std::cmp::min(p.maxhp.into_inner(), p.hp.into_inner() + drain_heal)
                            .into();
                        self.log.push(BattleLogEvent::new(BattleLog::Heal {
                            target: attacker_ident,
                            amount: drain_heal,
                        }));
                    }
                }
            }

            let defender_item = self.get_pokemon(target_ident).and_then(|p| p.item);
            if let Some(item_meta) = defender_item
                .as_ref()
                .and_then(pkmn_meta::item_meta::get_item_meta)
                && let Some(resist_type) = item_meta.type_resist_berry()
                && move_type == *resist_type
                && (*resist_type == Type::Normal || effectiveness > 0)
            {
                self.section_consume_item(target_ident);
            }
        }

        if actual_damage > 0 {
            let attacker_item = self.get_pokemon(attacker_ident).and_then(|p| p.item);
            if attacker_item == Some(pkmn_meta::types::ItemId::KingsRock) {
                let trigger = if let Some(config) = &self.rng_config
                    && let Some(sec_config) = &config.secondary
                {
                    match sec_config.as_str() {
                        "always" => true,
                        "never" => false,
                        _ => true,
                    }
                } else {
                    let mut rng = rand::rng();
                    rng.random_range(1..=100) <= 10
                };
                if trigger {
                    self.section_apply_volatile(
                        target_ident,
                        pkmn_meta::types::VolatileStatus::Flinch,
                    );
                }
            }

            let defender_ability = self
                .get_pokemon(target_ident)
                .and_then(|p| p.ability.clone());

            let is_contact = meta_opt
                .as_ref()
                .map(|m| *m.flags_contact())
                .unwrap_or(false);

            if is_contact
                && let Some(defender) = self.get_pokemon(target_ident)
                && defender
                    .volatile_status
                    .contains(&pkmn_meta::types::VolatileStatus::Beakblast)
            {
                self.section_apply_status(attacker_ident, pkmn_meta::types::Status::Burn, None);
            }

            if let Some(ability) = defender_ability {
                match ability.as_str() {
                    "ironbarbs" | "roughskin" => {
                        if is_contact {
                            let maxhp = self
                                .get_pokemon(attacker_ident)
                                .map(|p| p.maxhp.into_inner())
                                .unwrap_or(0);
                            let dmg = std::cmp::max(1, maxhp / 8);
                            self.section_take_damage(attacker_ident, dmg);
                            self.log.push(BattleLogEvent::new(BattleLog::Damage {
                                target: attacker_ident,
                                damage: dmg,
                                is_crit: false,
                                effectiveness: 0,
                                absorbed: false,
                                from_effect: None,
                            }));
                            if self.get_pokemon(attacker_ident).is_some_and(|p| p.hp == 0) {
                                self.log.push(BattleLogEvent::new(BattleLog::Faint {
                                    target: attacker_ident,
                                }));
                            }
                        }
                    }
                    "effectspore" => {
                        if is_contact {
                            let status = match 1 {
                                1 => pkmn_meta::types::Status::Paralysis,
                                2 => pkmn_meta::types::Status::Poison,
                                _ => pkmn_meta::types::Status::Sleep,
                            };
                            self.section_apply_status(attacker_ident, status, None);
                        }
                    }
                    "static" => {
                        if is_contact {
                            self.section_apply_status(
                                attacker_ident,
                                pkmn_meta::types::Status::Paralysis,
                                None,
                            );
                        }
                    }
                    "flamebody" if is_contact => {
                        self.section_apply_status(
                            attacker_ident,
                            pkmn_meta::types::Status::Burn,
                            None,
                        );
                    }
                    _ => {}
                }
            }

            if let Some(meta) = &meta_opt
                && let Some(sec) = meta.secondary().as_ref()
            {
                let mut trigger = false;
                if let Some(config) = &self.rng_config
                    && let Some(sec_config) = &config.secondary
                {
                    match sec_config.as_str() {
                        "always" => trigger = true,
                        "never" => trigger = false,
                        _ => trigger = true,
                    }
                }
                if trigger {
                    if action.move_id == "alluringvoice" {
                        let stats_raised = self
                            .get_pokemon(target_ident)
                            .map(|p| p.turn_state.stats_raised)
                            .unwrap_or(false);
                        if stats_raised {
                            self.section_apply_volatile(
                                target_ident,
                                pkmn_meta::types::VolatileStatus::Confusion,
                            );
                        }
                    }
                    if action.move_id == "burningjealousy" {
                        let stats_raised = self
                            .get_pokemon(target_ident)
                            .map(|p| p.turn_state.stats_raised)
                            .unwrap_or(false);
                        if stats_raised {
                            self.section_apply_status(
                                target_ident,
                                pkmn_meta::types::Status::Burn,
                                Some(attacker_ident),
                            );
                        }
                    }
                    if let Some(boosts) = sec.boosts().as_ref() {
                        let stats = [
                            (Stat::Atk, boosts.atk.into_inner()),
                            (Stat::Def, boosts.def.into_inner()),
                            (Stat::Spa, boosts.spa.into_inner()),
                            (Stat::Spd, boosts.spd.into_inner()),
                            (Stat::Spe, boosts.spe.into_inner()),
                            (Stat::Accuracy, boosts.accuracy.into_inner()),
                            (Stat::Evasion, boosts.evasion.into_inner()),
                        ];
                        for (stat, amount) in stats {
                            if amount != 0 {
                                self.apply_stat_change(
                                    t_player,
                                    t_slot,
                                    stat,
                                    amount,
                                    action.player,
                                );
                            }
                        }
                    }

                    if let Some(status) = sec.status().as_ref() {
                        self.section_apply_status(target_ident, *status, Some(attacker_ident));
                    }
                    if let Some(volatile) = sec.volatile_status().as_ref() {
                        self.section_apply_volatile(target_ident, *volatile);
                    }

                    if meta.secondary().is_some() {
                        crate::sim::moves::handle_user_secondary_effect(
                            self,
                            &action.move_id,
                            action.player,
                            action.slot,
                        );
                    }
                    if action.move_id == "dire-claw" || action.move_id == "direclaw" {
                        let mut rng = rand::rng();
                        use rand::RngExt;
                        let r = rng.random_range(0..3);
                        let status = match r {
                            0 => pkmn_meta::types::Status::Poison,
                            1 => pkmn_meta::types::Status::Paralysis,
                            _ => pkmn_meta::types::Status::Sleep,
                        };
                        self.section_apply_status(target_ident, status, Some(attacker_ident));
                    }
                    if action.move_id == "tri-attack" || action.move_id == "triattack" {
                        let mut rng = rand::rng();
                        use rand::RngExt;
                        let r = rng.random_range(0..3);
                        let status = match r {
                            0 => pkmn_meta::types::Status::Burn,
                            1 => pkmn_meta::types::Status::Paralysis,
                            _ => pkmn_meta::types::Status::Frozen,
                        };
                        self.section_apply_status(target_ident, status, Some(attacker_ident));
                    }
                }
            }
        }

        crate::sim::moves::handle_move_target_effect(
            self,
            &action.move_id,
            t_player,
            t_slot,
            action.player,
            action.slot,
            flung_item,
        );

        if actual_damage > 0
            && (action.move_id == "thief"
                || action.move_id == "covet"
                || action.move_id == "knockoff")
        {
            let mut stolen = None;
            if let Some(target) = self.get_pokemon_mut(target_ident)
                && target.item.is_some()
            {
                stolen = target.item.take();
            }
            if let Some(item_id) = stolen {
                let disp_name = if item_id.to_string() == "leftovers" {
                    "Leftovers".to_string()
                } else {
                    item_id.to_string()
                };

                if let Some(attacker) = self.get_pokemon_mut(attacker_ident) {
                    if action.move_id == "knockoff" {
                        self.log.push(BattleLogEvent::new(BattleLog::EndItem {
                            target: target_ident,
                            item: disp_name,
                        }));
                    } else if attacker.item.is_none() {
                        attacker.item = Some(item_id);
                        self.log.push(BattleLogEvent::new(BattleLog::EndItemSilent {
                            target: target_ident,
                            item: disp_name.clone(),
                            from_move: {
                                let mut m = action.move_id.clone();
                                m[..1].make_ascii_uppercase();
                                m
                            },
                            of: attacker_ident,
                        }));
                        self.log.push(BattleLogEvent::new(BattleLog::Item {
                            target: attacker_ident,
                            item: disp_name,
                            from_move: {
                                let mut m = action.move_id.clone();
                                m[..1].make_ascii_uppercase();
                                m
                            },
                            of: target_ident,
                        }));
                    } else {
                        if let Some(target) = self.get_pokemon_mut(target_ident) {
                            target.item = Some(item_id);
                        }
                    }
                }
            }
        }

        HitResult {
            damage_dealt: actual_damage,
            hit_anyone: true,
            immune_stop: false,
        }
    }

    fn resolve_redirection(
        &self,
        attacker_player: u8,
        attacker_slot: usize,
        target_player: u8,
        original_target_slot: usize,
    ) -> (u8, usize) {
        if attacker_player == target_player {
            return (target_player, original_target_slot);
        }

        if let Some(atk) = self.get_pokemon(PokemonIdent {
            player: attacker_player,
            slot: attacker_slot,
        }) {
            if atk.ability.as_ref().map(|x| x.as_ref()) == Some("stalwart")
                || atk.ability.as_ref().map(|x| x.as_ref()) == Some("propellertail")
            {
                return (target_player, original_target_slot);
            }

            for i in 0..2 {
                if let Some(foe) = self.get_pokemon(PokemonIdent {
                    player: target_player,
                    slot: i,
                }) && foe.hp.into_inner() > 0
                {
                    if foe
                        .volatile_status
                        .contains(&pkmn_meta::types::VolatileStatus::Followme)
                    {
                        return (target_player, i);
                    } else if foe
                        .volatile_status
                        .contains(&pkmn_meta::types::VolatileStatus::Ragepowder)
                    {
                        let is_grass = atk.type1 == Type::Grass
                            || atk.type2 == Some(Type::Grass)
                            || atk.added_type == Some(Type::Grass);
                        let has_overcoat =
                            atk.ability.as_ref().map(|x| x.as_ref()) == Some("overcoat");
                        let has_goggles =
                            atk.item.as_ref().map(|x| x.as_ref()) == Some("safetygoggles");

                        if !is_grass && !has_overcoat && !has_goggles {
                            return (target_player, i);
                        }
                    }
                }
            }
        }

        (target_player, original_target_slot)
    }

    #[allow(clippy::too_many_arguments)]
    fn calculate_raw_damage(
        &self,
        move_id: &str,
        player: u8,
        slot: u8,
        target_player: u8,
        target_slot: u8,
        is_spread: bool,
        hit_index: u32,
    ) -> (i32, Option<String>, bool) {
        crate::sim::damage_evaluator::DamageEvaluator::new(self).evaluate(
            move_id,
            player,
            slot,
            target_player,
            target_slot,
            is_spread,
            hit_index,
        )
    }
}
