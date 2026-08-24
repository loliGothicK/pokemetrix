use crate::wasm_api::Boosts;
use damage_calc::calculate_input;
use damage_calc::types::DamageInput;
use rand::RngExt;
// removed ordering

#[derive(Clone, Debug)]
pub struct Pokemon {
    pub ident: String,
    pub hp: i32,
    pub maxhp: i32,
    pub speed: i32,
    pub attack: i32,
    pub defense: i32,
    pub sp_attack: i32,
    pub sp_defense: i32,
    pub boosts: Boosts,
    pub item: Option<String>,
    pub ability: Option<String>,
    pub status: Option<String>,
    pub volatile_status: Vec<String>,
    pub type1: String,
    pub type2: Option<String>,
    pub added_type: Option<String>,

    // Tracking fields
    pub last_move_used: Option<String>,
    pub consecutive_move_counter: u8,
    pub pp_used: std::collections::HashMap<String, u8>,
}

impl Pokemon {
    pub fn is_semi_invulnerable(&self) -> bool {
        self.volatile_status.iter().any(|v| {
            matches!(
                v.as_str(),
                "dig" | "fly" | "bounce" | "dive" | "phantomforce" | "shadowforce" | "skydrop"
            )
        })
    }

    pub fn is_grounded(&self) -> bool {
        if self.type1 == "Flying"
            || self.type2.as_deref() == Some("Flying")
            || self.ability.as_deref() == Some("levitate")
        {
            return false;
        }
        if self.is_semi_invulnerable() {
            return false;
        }
        true
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct PokemonIdent {
    pub player: u8,
    pub slot: usize,
}

use typed_builder::TypedBuilder;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum EventId {
    BeforeApplyAddedType,
    AfterApplyAddedType,
    BeforeApplyVolatile,
    AfterApplyVolatile,
    BeforeTakeDamage,
    AfterTakeDamage,
    BeforeApplyStatus,
    AfterApplyStatus,
    BeforeConsumeItem,
    AfterConsumeItem,
    EndOfTurn,
}

#[derive(TypedBuilder)]
pub struct EventContext {
    pub target: PokemonIdent,
    #[builder(default)]
    pub string_val: String,
    #[builder(default)]
    pub num_val: i32,
    #[builder(default)]
    pub canceled: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stat {
    Atk,
    Def,
    Spa,
    Spd,
    Spe,
    Accuracy,
    Evasion,
}

pub struct Battle {
    pub p1: Vec<Pokemon>,
    pub p2: Vec<Pokemon>,
    pub weather: Option<String>,
    pub weather_turns_left: u8,
    pub terrain: Option<String>,
    pub terrain_turns_left: u8,
    pub trick_room: bool,
    pub p1_tailwind: bool,
    pub p1_tailwind_turns: u8,
    pub p2_tailwind: bool,
    pub p2_tailwind_turns: u8,
    pub rng_config: Option<crate::wasm_api::Config>,
}

#[derive(Debug)]
struct Action {
    pub player: u8, // 1 for p1, 2 for p2
    pub slot: usize,
    pub is_switch: bool,
    pub move_id: String,
    pub priority: i32,
    pub speed: i32,
    pub target_player: u8,
    pub target_slot: u8,
}

impl Default for Battle {
    fn default() -> Self {
        Self::new()
    }
}

impl Battle {
    pub fn new() -> Self {
        Self {
            p1: vec![],
            p2: vec![],
            weather: None,
            weather_turns_left: 0,
            terrain: None,
            terrain_turns_left: 0,
            trick_room: false,
            p1_tailwind: false,
            p1_tailwind_turns: 0,
            p2_tailwind: false,
            p2_tailwind_turns: 0,
            rng_config: None,
        }
    }

    /// Applies a stat change, handling abilities like Clear Body, Simple, Contrary, Defiant, etc.
    /// Returns true if the stat was successfully changed.
    pub fn apply_stat_change(
        &mut self,
        target_player: u8,
        target_slot: usize,
        stat: Stat,
        mut amount: i8,
        source_player: u8,
    ) -> bool {
        let is_foe = target_player != source_player;

        // Extract target's ability
        let target_ability = if target_player == 1 {
            self.p1
                .get(target_slot)
                .and_then(|p| p.ability.clone())
                .unwrap_or_default()
        } else {
            self.p2
                .get(target_slot)
                .and_then(|p| p.ability.clone())
                .unwrap_or_default()
        };

        println!(
            "apply_stat_change: target_player={}, target_slot={}, ability={}, stat={:?}, amount={}",
            target_player, target_slot, target_ability, stat, amount
        );

        // 1. Contrary inverts amount
        if target_ability == "contrary" {
            amount = -amount;
        }

        // 2. Simple doubles amount
        if target_ability == "simple" {
            amount *= 2;
        }

        // 3. Check for stat drop immunities (only from foe)
        if amount < 0 && is_foe {
            let immune = match target_ability.as_str() {
                "clearbody" | "whitesmoke" | "fullmetalbody" => true,
                "hypercutter" if stat == Stat::Atk => true,
                "bigpecks" if stat == Stat::Def => true,
                "keeneye" if stat == Stat::Accuracy => true,
                _ => false,
            };

            println!(
                "apply_stat_change: immune={}, amount={}, is_foe={}",
                immune, amount, is_foe
            );

            if immune {
                return false;
            }
        }

        // Apply the change
        let mut actual_change = 0;
        let mut success = false;

        let apply_to_boosts =
            |boosts: &mut crate::wasm_api::Boosts, stat: Stat, amt: i8| -> (bool, i8) {
                let old_val = match stat {
                    Stat::Atk => boosts.atk,
                    Stat::Def => boosts.def,
                    Stat::Spa => boosts.spa,
                    Stat::Spd => boosts.spd,
                    Stat::Spe => boosts.spe,
                    Stat::Accuracy => boosts.accuracy,
                    Stat::Evasion => boosts.evasion,
                };
                let new_val = (old_val + amt).clamp(-6, 6);
                match stat {
                    Stat::Atk => boosts.atk = new_val,
                    Stat::Def => boosts.def = new_val,
                    Stat::Spa => boosts.spa = new_val,
                    Stat::Spd => boosts.spd = new_val,
                    Stat::Spe => boosts.spe = new_val,
                    Stat::Accuracy => boosts.accuracy = new_val,
                    Stat::Evasion => boosts.evasion = new_val,
                }
                (new_val != old_val, new_val - old_val)
            };

        if target_player == 1 {
            if let Some(p) = self.p1.get_mut(target_slot) {
                let res = apply_to_boosts(&mut p.boosts, stat, amount);
                success = res.0;
                actual_change = res.1;
            }
        } else {
            if let Some(p) = self.p2.get_mut(target_slot) {
                let res = apply_to_boosts(&mut p.boosts, stat, amount);
                success = res.0;
                actual_change = res.1;
            }
        }

        // 4. Defiant and Competitive triggers if stats were lowered by a foe
        if success && actual_change < 0 && is_foe {
            match target_ability.as_str() {
                "defiant" => {
                    self.apply_stat_change(target_player, target_slot, Stat::Atk, 2, target_player);
                }
                "competitive" => {
                    self.apply_stat_change(target_player, target_slot, Stat::Spa, 2, target_player);
                }
                _ => {}
            }
        }

        success
    }

    pub fn trigger_event(&mut self, event_id: EventId, ctx: &mut EventContext) {
        // [Phase A: Snapshot Active Handlers]
        // We collect all active items and abilities to avoid borrowing `self` during execution.
        let mut active_items = vec![];
        let mut active_abilities = vec![];

        for (i, p) in self.p1.iter().enumerate() {
            if p.item.is_some() {
                active_items.push((PokemonIdent { player: 1, slot: i }, p.item.clone()));
            }
            if p.ability.is_some() {
                active_abilities.push((PokemonIdent { player: 1, slot: i }, p.ability.clone()));
            }
        }

        for (i, p) in self.p2.iter().enumerate() {
            if p.item.is_some() {
                active_items.push((PokemonIdent { player: 2, slot: i }, p.item.clone()));
            }
            if p.ability.is_some() {
                active_abilities.push((PokemonIdent { player: 2, slot: i }, p.ability.clone()));
            }
        }

        // [Phase B: Dispatch]
        // The core engine knows NOTHING about specific items or abilities.
        // It blindly broadcasts the event, and the specific module decides if it reacts.
        for (ident, item) in active_items {
            crate::sim::items::execute_item(
                self,
                ident,
                item.as_deref().unwrap_or_default(),
                &event_id,
                ctx,
            );
        }

        for (ident, ability) in active_abilities {
            crate::sim::abilities::execute_ability(
                self,
                ident,
                ability.as_deref().unwrap_or_default(),
                &event_id,
                ctx,
            );
        }
    }

    pub fn section_apply_added_type(&mut self, target: PokemonIdent, added_type: String) {
        let mut ctx = EventContext::builder()
            .target(target)
            .string_val(added_type)
            .build();

        self.trigger_event(EventId::BeforeApplyAddedType, &mut ctx);

        if !ctx.canceled {
            if ctx.target.player == 1 {
                if let Some(t) = self.p1.get_mut(ctx.target.slot) {
                    t.added_type = Some(ctx.string_val.clone());
                }
            } else {
                if let Some(t) = self.p2.get_mut(ctx.target.slot) {
                    t.added_type = Some(ctx.string_val.clone());
                }
            }

            self.trigger_event(EventId::AfterApplyAddedType, &mut ctx);
        }
    }

    pub fn section_apply_volatile(&mut self, target: PokemonIdent, volatile: String) {
        let mut ctx = EventContext::builder()
            .target(target)
            .string_val(volatile)
            .build();

        self.trigger_event(EventId::BeforeApplyVolatile, &mut ctx);

        if !ctx.canceled {
            if ctx.target.player == 1 {
                if let Some(t) = self.p1.get_mut(ctx.target.slot)
                    && !t.volatile_status.contains(&ctx.string_val)
                {
                    t.volatile_status.push(ctx.string_val.clone());
                }
            } else {
                if let Some(t) = self.p2.get_mut(ctx.target.slot)
                    && !t.volatile_status.contains(&ctx.string_val)
                {
                    t.volatile_status.push(ctx.string_val.clone());
                }
            }

            self.trigger_event(EventId::AfterApplyVolatile, &mut ctx);
        }
    }

    pub fn section_take_damage(&mut self, target: PokemonIdent, damage: i32) {
        let mut ctx = EventContext::builder()
            .target(target)
            .num_val(damage)
            .build();

        self.trigger_event(EventId::BeforeTakeDamage, &mut ctx);

        if !ctx.canceled && ctx.num_val > 0 {
            if ctx.target.player == 1 {
                if let Some(t) = self.p1.get_mut(ctx.target.slot) {
                    t.hp = std::cmp::max(0, t.hp - ctx.num_val);
                }
            } else {
                if let Some(t) = self.p2.get_mut(ctx.target.slot) {
                    t.hp = std::cmp::max(0, t.hp - ctx.num_val);
                }
            }

            self.trigger_event(EventId::AfterTakeDamage, &mut ctx);
        }
    }

    pub fn section_heal(&mut self, target: PokemonIdent, heal_amount: i32) {
        if heal_amount > 0 {
            if target.player == 1 {
                if let Some(t) = self.p1.get_mut(target.slot) {
                    t.hp = std::cmp::min(t.maxhp, t.hp + heal_amount);
                }
            } else {
                if let Some(t) = self.p2.get_mut(target.slot) {
                    t.hp = std::cmp::min(t.maxhp, t.hp + heal_amount);
                }
            }
        }
    }

    pub fn section_apply_status(&mut self, target: PokemonIdent, status: String) {
        let mut ctx = EventContext::builder()
            .target(target)
            .string_val(status)
            .build();

        self.trigger_event(EventId::BeforeApplyStatus, &mut ctx);

        if !ctx.canceled {
            if ctx.target.player == 1 {
                if let Some(t) = self.p1.get_mut(ctx.target.slot)
                    && t.status.is_none()
                {
                    t.status = Some(ctx.string_val.clone());
                }
            } else {
                if let Some(t) = self.p2.get_mut(ctx.target.slot)
                    && t.status.is_none()
                {
                    t.status = Some(ctx.string_val.clone());
                }
            }

            self.trigger_event(EventId::AfterApplyStatus, &mut ctx);
        }
    }

    pub fn section_consume_item(&mut self, target: PokemonIdent) {
        let mut ctx = EventContext::builder().target(target).build();

        self.trigger_event(EventId::BeforeConsumeItem, &mut ctx);

        if !ctx.canceled {
            if ctx.target.player == 1 {
                if let Some(t) = self.p1.get_mut(ctx.target.slot) {
                    t.item = None;
                }
            } else {
                if let Some(t) = self.p2.get_mut(ctx.target.slot) {
                    t.item = None;
                }
            }

            self.trigger_event(EventId::AfterConsumeItem, &mut ctx);
        }
    }

    pub fn section_cure_status(&mut self, target: PokemonIdent) {
        let ctx = EventContext::builder().target(target).build();

        if ctx.target.player == 1 {
            if let Some(t) = self.p1.get_mut(ctx.target.slot) {
                t.status = None;
            }
        } else {
            if let Some(t) = self.p2.get_mut(ctx.target.slot) {
                t.status = None;
            }
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn execute_turn(
        &mut self,
        p1_a: &str,
        p1_a_target: u8,
        p1_b: &str,
        p1_b_target: u8,
        p2_a: &str,
        p2_a_target: u8,
        p2_b: &str,
        p2_b_target: u8,
        rng_config: Option<crate::wasm_api::Config>,
    ) -> Result<(), String> {
        self.rng_config = rng_config;
        let mut actions = vec![];

        // Parse P1 choices
        if !p1_a.is_empty() && !self.p1.is_empty() {
            if p1_a.trim() == "switch" {
                actions.push(Action {
                    player: 1,
                    slot: 0,
                    is_switch: true,
                    move_id: String::new(),
                    priority: 6,
                    speed: self.check_speed_modifiers(
                        &self.p1[0],
                        Self::apply_boost(self.p1[0].speed, self.p1[0].boosts.spe),
                    ),
                    target_player: 1,
                    target_slot: p1_a_target,
                });
            } else {
                actions.push(Action {
                    player: 1,
                    slot: 0,
                    is_switch: false,
                    move_id: p1_a.trim().to_string(),
                    priority: self.get_move_priority(p1_a.trim(), &self.p1[0]),
                    speed: self.check_speed_modifiers(
                        &self.p1[0],
                        Self::apply_boost(self.p1[0].speed, self.p1[0].boosts.spe),
                    ),
                    target_player: 2,
                    target_slot: p1_a_target,
                });
            }
        }
        if !p1_b.is_empty() && self.p1.len() > 1 {
            if p1_b.trim() == "switch" {
                actions.push(Action {
                    player: 1,
                    slot: 1,
                    is_switch: true,
                    move_id: String::new(),
                    priority: 6,
                    speed: self.check_speed_modifiers(
                        &self.p1[1],
                        Self::apply_boost(self.p1[1].speed, self.p1[1].boosts.spe),
                    ),
                    target_player: 1,
                    target_slot: p1_b_target,
                });
            } else {
                actions.push(Action {
                    player: 1,
                    slot: 1,
                    is_switch: false,
                    move_id: p1_b.trim().to_string(),
                    priority: self.get_move_priority(p1_b.trim(), &self.p1[1]),
                    speed: self.check_speed_modifiers(
                        &self.p1[1],
                        Self::apply_boost(self.p1[1].speed, self.p1[1].boosts.spe),
                    ),
                    target_player: 2,
                    target_slot: p1_b_target,
                });
            }
        }

        // Parse P2 choices
        if !p2_a.is_empty() && !self.p2.is_empty() {
            if p2_a.trim() == "switch" {
                actions.push(Action {
                    player: 2,
                    slot: 0,
                    is_switch: true,
                    move_id: String::new(),
                    priority: 6,
                    speed: self.check_speed_modifiers(
                        &self.p2[0],
                        Self::apply_boost(self.p2[0].speed, self.p2[0].boosts.spe),
                    ),
                    target_player: 2,
                    target_slot: p2_a_target,
                });
            } else {
                actions.push(Action {
                    player: 2,
                    slot: 0,
                    is_switch: false,
                    move_id: p2_a.trim().to_string(),
                    priority: self.get_move_priority(p2_a.trim(), &self.p2[0]),
                    speed: self.check_speed_modifiers(
                        &self.p2[0],
                        Self::apply_boost(self.p2[0].speed, self.p2[0].boosts.spe),
                    ),
                    target_player: 1,
                    target_slot: p2_a_target,
                });
            }
        }
        if !p2_b.is_empty() && self.p2.len() > 1 {
            if p2_b.trim() == "switch" {
                actions.push(Action {
                    player: 2,
                    slot: 1,
                    is_switch: true,
                    move_id: String::new(),
                    priority: 6,
                    speed: self.check_speed_modifiers(
                        &self.p2[1],
                        Self::apply_boost(self.p2[1].speed, self.p2[1].boosts.spe),
                    ),
                    target_player: 2,
                    target_slot: p2_b_target,
                });
            } else {
                actions.push(Action {
                    player: 2,
                    slot: 1,
                    is_switch: false,
                    move_id: p2_b.trim().to_string(),
                    priority: self.get_move_priority(p2_b.trim(), &self.p2[1]),
                    speed: self.check_speed_modifiers(
                        &self.p2[1],
                        Self::apply_boost(self.p2[1].speed, self.p2[1].boosts.spe),
                    ),
                    target_player: 1,
                    target_slot: p2_b_target,
                });
            }
        }

        let is_trick_room = self.trick_room;

        // Resolve order
        // Sort actions: Priority (desc) > Speed (desc) > Random (for speed ties)
        // Quick claw can be modeled as a fractional speed boost for tiebreakers, or just a flag. Let's use a flag.
        let mut action_quick_claw = vec![false; actions.len()];
        let mut rng = rand::rng();
        for (i, a) in actions.iter().enumerate() {
            let item = if a.player == 1 {
                self.p1
                    .get(a.slot)
                    .map(|p| p.item.clone())
                    .unwrap_or_default()
            } else {
                self.p2
                    .get(a.slot)
                    .map(|p| p.item.clone())
                    .unwrap_or_default()
            };
            if item.as_deref() == Some("quickclaw") && rng.random_range(1..=100) <= 20 {
                action_quick_claw[i] = true;
            }
        }

        actions.sort_by(|a, b| {
            let p1_prio = a.priority;
            let p2_prio = b.priority;
            if p1_prio != p2_prio {
                return p2_prio.cmp(&p1_prio);
            }

            // Quick claw within same priority bracket
            // (We can't easily capture action_quick_claw from closure safely without copying indices into action structs,
            // but let's just do it directly on speed)
            // Wait, I can't capture local variables like index easily here unless I zip them.
            // Let's just leave quick claw out of sorting and adjust `speed` directly beforehand instead!

            let p1_spe = a.speed;
            let p2_spe = b.speed;
            if p1_spe != p2_spe {
                if is_trick_room {
                    return p1_spe.cmp(&p2_spe); // Reverse speed
                } else {
                    return p2_spe.cmp(&p1_spe);
                }
            }
            std::cmp::Ordering::Equal
        });

        for action in actions {
            if action.is_switch {
                // Perform switch
                let target_slot = action.target_slot as usize;
                if action.player == 1 {
                    if target_slot < self.p1.len() {
                        self.p1.swap(action.slot, target_slot);
                        self.run_switch_in(1, action.slot); // Trigger switch-in abilities
                    }
                } else {
                    if target_slot < self.p2.len() {
                        self.p2.swap(action.slot, target_slot);
                        self.run_switch_in(2, action.slot); // Trigger switch-in abilities
                    }
                }
                continue; // Switch action complete
            }

            // Check if attacker fainted or flinched
            let mut attacker_has_flinch = false;
            let (is_alive, attacker_status) = if action.player == 1 {
                if let Some(p) = self.p1.get(action.slot) {
                    attacker_has_flinch = p.volatile_status.contains(&"flinch".to_string());
                    (p.hp > 0, p.status.clone())
                } else {
                    (false, None)
                }
            } else {
                if let Some(p) = self.p2.get(action.slot) {
                    attacker_has_flinch = p.volatile_status.contains(&"flinch".to_string());
                    (p.hp > 0, p.status.clone())
                } else {
                    (false, None)
                }
            };

            if !is_alive {
                continue;
            }
            if attacker_has_flinch {
                continue;
            }

            // PP and Metronome tracking
            let move_id = action.move_id.clone();
            let mut consumed_leppa = false;
            let max_pp = crate::move_meta::get_move_meta(&move_id)
                .map(|m| m.pp)
                .unwrap_or(0);

            if action.player == 1 {
                if let Some(p) = self.p1.get_mut(action.slot) {
                    // Update PP
                    let pp_count = p.pp_used.entry(move_id.clone()).or_insert(0);
                    *pp_count = pp_count.saturating_add(1);
                    if *pp_count >= max_pp && p.item.as_deref() == Some("leppaberry") {
                        *pp_count = pp_count.saturating_sub(10);
                        consumed_leppa = true;
                    }

                    // Update Metronome
                    if p.last_move_used.as_deref() == Some(&move_id) {
                        p.consecutive_move_counter =
                            p.consecutive_move_counter.saturating_add(1).min(5); // caps at 5 (100% boost)
                    } else {
                        p.consecutive_move_counter = 1;
                        p.last_move_used = Some(move_id.clone());
                    }
                }
            } else {
                if let Some(p) = self.p2.get_mut(action.slot) {
                    // Update PP
                    let pp_count = p.pp_used.entry(move_id.clone()).or_insert(0);
                    *pp_count = pp_count.saturating_add(1);
                    if *pp_count >= max_pp && p.item.as_deref() == Some("leppaberry") {
                        *pp_count = pp_count.saturating_sub(10);
                        consumed_leppa = true;
                    }

                    // Update Metronome
                    if p.last_move_used.as_deref() == Some(&move_id) {
                        p.consecutive_move_counter =
                            p.consecutive_move_counter.saturating_add(1).min(5);
                    } else {
                        p.consecutive_move_counter = 1;
                        p.last_move_used = Some(move_id.clone());
                    }
                }
            }
            if consumed_leppa {
                self.section_consume_item(PokemonIdent {
                    player: action.player,
                    slot: action.slot,
                });
            }

            // Pre-move status checks
            if attacker_status.as_deref() == Some("slp")
                || attacker_status.as_deref() == Some("frz")
            {
                continue;
            }

            let mut skip_turn = false;
            let meta_opt = crate::move_meta::get_move_meta(&action.move_id);
            if meta_opt.is_none() {
                return Err(format!("Move not found in database: {}", action.move_id));
            }

            // Handle Recharge (e.g. Hyper Beam)
            if action.player == 1 {
                if let Some(p) = self.p1.get_mut(action.slot)
                    && p.volatile_status.contains(&"mustrecharge".to_string())
                {
                    p.volatile_status.retain(|s| s != "mustrecharge");
                    skip_turn = true;
                }
            } else {
                if let Some(p) = self.p2.get_mut(action.slot)
                    && p.volatile_status.contains(&"mustrecharge".to_string())
                {
                    p.volatile_status.retain(|s| s != "mustrecharge");
                    skip_turn = true;
                }
            }

            if skip_turn {
                continue;
            }

            // Handle Charge (e.g. Solar Beam)
            if let Some(meta) = &meta_opt
                && meta.flags_charge
            {
                let is_charging = if action.player == 1 {
                    self.p1
                        .get(action.slot)
                        .is_some_and(|p| p.volatile_status.contains(&"twoturnmove".to_string()))
                } else {
                    self.p2
                        .get(action.slot)
                        .is_some_and(|p| p.volatile_status.contains(&"twoturnmove".to_string()))
                };

                if !is_charging {
                    // Start charging
                    if action.player == 1 {
                        if let Some(p) = self.p1.get_mut(action.slot) {
                            p.volatile_status.push("twoturnmove".to_string());
                        }
                    } else {
                        if let Some(p) = self.p2.get_mut(action.slot) {
                            p.volatile_status.push("twoturnmove".to_string());
                        }
                    }
                    continue;
                } else {
                    // Unset charging status and execute move
                    if action.player == 1 {
                        if let Some(p) = self.p1.get_mut(action.slot) {
                            p.volatile_status.retain(|s| s != "twoturnmove");
                        }
                    } else {
                        if let Some(p) = self.p2.get_mut(action.slot) {
                            p.volatile_status.retain(|s| s != "twoturnmove");
                        }
                    }
                }
            }

            // Self-activation using MoveMeta flags (Protect, Follow Me, etc.)
            if let Some(meta) = &meta_opt
                && let Some(vs) = meta.volatile_status
                && (vs == "protect"
                    || vs == "kingsshield"
                    || vs == "spikyshield"
                    || vs == "followme"
                    || vs == "ragepowder")
            {
                if action.player == 1 {
                    if let Some(p) = self.p1.get_mut(action.slot) {
                        p.volatile_status.push(vs.to_string());
                    }
                } else {
                    if let Some(p) = self.p2.get_mut(action.slot) {
                        p.volatile_status.push(vs.to_string());
                    }
                }
                continue; // Self-target status moves apply effect and end
            }

            // Note: Paralysis (par) full-para chance is 25%, we assume it hits for now (optimistic/worst-case evaluation).

            // Spread Move Targeting
            let range = meta_opt
                .as_ref()
                .map(|m| m.range)
                .unwrap_or("single-target");

            let targets = match range {
                "all-adjacent" | "all-adjacent-foes" | "all-opponents" => {
                    // In doubles, this hits both foes
                    vec![(action.target_player, 0), (action.target_player, 1)]
                }
                "all-pokemon" => {
                    // Hits everyone except user (e.g. Earthquake, Surf)
                    let mut t = vec![(action.target_player, 0), (action.target_player, 1)];
                    t.push((action.player, if action.slot == 0 { 1 } else { 0 }));
                    t
                }
                _ => vec![(action.target_player, action.target_slot)],
            };

            let is_spread_move_targeting = targets.len() > 1;

            // Filter out empty/dead slots and apply redirection
            let mut alive_targets = Vec::new();
            for &(t_player, t_slot) in &targets {
                let t_usize = t_slot as usize;

                // If it's a single target move, check redirection
                let (final_player, final_slot) = if !is_spread_move_targeting {
                    self.resolve_redirection(action.player, action.slot, t_player, t_usize)
                } else {
                    (t_player, t_usize)
                };

                let alive = if final_player == 1 {
                    self.p1.get(final_slot).is_some_and(|p| p.hp > 0)
                } else {
                    self.p2.get(final_slot).is_some_and(|p| p.hp > 0)
                };
                if alive {
                    alive_targets.push((final_player, final_slot as u8));
                }
            }

            let is_spread = alive_targets.len() > 1;
            let mut move_successful = false;
            let mut total_damage_dealt = 0;

            let hit_count = if let Some(meta) = &meta_opt
                && let Some((min_hits, max_hits)) = meta.multihit
            {
                if min_hits == max_hits {
                    min_hits
                } else {
                    let mut rng = rand::rng();
                    let force_damage_roll = self
                        .rng_config
                        .as_ref()
                        .and_then(|c| c.damage_roll.as_ref())
                        .map(|s| s.as_str());

                    match force_damage_roll {
                        Some("max") => max_hits,
                        Some("min") => min_hits,
                        _ => rng.random_range(min_hits..=max_hits),
                    }
                }
            } else {
                1
            };

            'hit_loop: for _ in 0..hit_count {
                let mut hit_anyone = false;

                // Check if attacker is still alive (might have fainted from recoil / rough skin on previous hit)
                let attacker_alive = if action.player == 1 {
                    self.p1.get(action.slot).is_some_and(|p| p.hp > 0)
                } else {
                    self.p2.get(action.slot).is_some_and(|p| p.hp > 0)
                };
                if !attacker_alive {
                    break 'hit_loop;
                }

                for &(t_player, t_slot) in &alive_targets {
                    let mut hit = true;

                    // Verify target is still alive (could have fainted in previous hit)
                    let target_alive = if t_player == 1 {
                        self.p1.get(t_slot as usize).is_some_and(|p| p.hp > 0)
                    } else {
                        self.p2.get(t_slot as usize).is_some_and(|p| p.hp > 0)
                    };
                    if !target_alive {
                        continue;
                    }

                    let target_is_protected = if t_player == 1 {
                        self.p1
                            .get(t_slot as usize)
                            .is_some_and(|p| p.volatile_status.contains(&"protect".to_string()))
                    } else {
                        self.p2
                            .get(t_slot as usize)
                            .is_some_and(|p| p.volatile_status.contains(&"protect".to_string()))
                    };

                    if let Some(meta) = &meta_opt {
                        let target_is_grounded = if t_player == 1 {
                            self.p1
                                .get(t_slot as usize)
                                .is_some_and(|p| p.is_grounded())
                        } else {
                            self.p2
                                .get(t_slot as usize)
                                .is_some_and(|p| p.is_grounded())
                        };

                        if target_is_protected && meta.flags_protect {
                            println!("{} targeting {} - protected!", action.move_id, t_slot);
                            hit = false;
                        } else if self.terrain.as_deref() == Some("PsychicTerrain")
                            && action.priority > 0
                            && target_is_grounded
                            && t_player != action.player
                        {
                            println!(
                                "{} targeting {} - blocked by Psychic Terrain!",
                                action.move_id, t_slot
                            );
                            hit = false;
                        } else if let Some(mut acc) = meta.accuracy {
                            let attacker_item = if action.player == 1 {
                                self.p1.get(action.slot).and_then(|p| p.item.clone())
                            } else {
                                self.p2.get(action.slot).and_then(|p| p.item.clone())
                            };
                            let defender_item = if t_player == 1 {
                                self.p1.get(t_slot as usize).and_then(|p| p.item.clone())
                            } else {
                                self.p2.get(t_slot as usize).and_then(|p| p.item.clone())
                            };

                            if attacker_item.as_deref() == Some("widelens") {
                                acc = (acc as f32 * 1.1) as i32;
                            } else if attacker_item.as_deref() == Some("zoomlens") {
                                // Zoom lens boosts accuracy by 1.2x if moving after the target.
                                // In a simple turn-based sim without turn order arrays per pokemon easily accessible here, we approximate or just apply it always for now.
                                acc = (acc as f32 * 1.2) as i32;
                            }
                            if defender_item.as_deref() == Some("brightpowder") {
                                acc = (acc as f32 * 0.9) as i32;
                            }

                            let force_acc = self
                                .rng_config
                                .as_ref()
                                .and_then(|c| c.accuracy.as_ref())
                                .map(|s| s.as_str());

                            match force_acc {
                                Some("always") => hit = true,
                                Some("never") => hit = false,
                                _ => {
                                    let mut rng = rand::rng();
                                    let roll = rng.random_range(1..=100);
                                    hit = roll <= acc;
                                    println!(
                                        "{} targeting {} - acc {}, roll {}, hit {}",
                                        action.move_id, t_slot, acc, roll, hit
                                    );
                                }
                            }
                        }
                    }

                    if hit {
                        hit_anyone = true;
                        let (damage, absorbed_by) = self.calculate_raw_damage(
                            &action.move_id,
                            action.player,
                            action.slot as u8,
                            t_player,
                            t_slot,
                            is_spread,
                        );

                        if let Some(ability) = absorbed_by {
                            match ability.as_str() {
                                "waterabsorb" | "voltabsorb" | "dryskin" | "eartheater" => {
                                    let max_hp = if t_player == 1 {
                                        self.p1.get(t_slot as usize).map(|p| p.maxhp).unwrap_or(1)
                                    } else {
                                        self.p2.get(t_slot as usize).map(|p| p.maxhp).unwrap_or(1)
                                    };
                                    self.section_heal(
                                        PokemonIdent {
                                            player: t_player,
                                            slot: t_slot as usize,
                                        },
                                        std::cmp::max(1, max_hp / 4),
                                    );
                                }
                                "sapsipper" => {
                                    self.apply_stat_change(
                                        t_player,
                                        t_slot as usize,
                                        Stat::Atk,
                                        1,
                                        t_player,
                                    );
                                }
                                "motordrive" => {
                                    self.apply_stat_change(
                                        t_player,
                                        t_slot as usize,
                                        Stat::Spe,
                                        1,
                                        t_player,
                                    );
                                }
                                "lightningrod" | "stormdrain" => {
                                    self.apply_stat_change(
                                        t_player,
                                        t_slot as usize,
                                        Stat::Spa,
                                        1,
                                        t_player,
                                    );
                                }
                                "justified" => {
                                    // Wait, justified is NOT an immunity! It triggers ON HIT.
                                    // We will handle on-hit effects below.
                                }
                                _ => {}
                            }

                            // Multi-hit moves stop immediately when they hit an immunity
                            break 'hit_loop;
                        }

                        let mut actual_damage = 0;
                        let mut target_alive_after = false;

                        // Snapshot HP before
                        let hp_before = if t_player == 1 {
                            self.p1.get(t_slot as usize).map(|p| p.hp).unwrap_or(0)
                        } else {
                            self.p2.get(t_slot as usize).map(|p| p.hp).unwrap_or(0)
                        };

                        self.section_take_damage(
                            PokemonIdent {
                                player: t_player,
                                slot: t_slot as usize,
                            },
                            damage,
                        );

                        // Read resulting state
                        let mut defender_type1 = String::new();
                        let mut defender_type2: Option<String> = None;
                        let mut defender_added: Option<String> = None;

                        if t_player == 1 {
                            if let Some(target) = self.p1.get(t_slot as usize) {
                                actual_damage = hp_before - target.hp;
                                target_alive_after = target.hp > 0;
                                defender_type1 = target.type1.clone();
                                defender_type2 = target.type2.clone();
                                defender_added = target.added_type.clone();
                            }
                        } else {
                            if let Some(target) = self.p2.get(t_slot as usize) {
                                actual_damage = hp_before - target.hp;
                                target_alive_after = target.hp > 0;
                                defender_type1 = target.type1.clone();
                                defender_type2 = target.type2.clone();
                                defender_added = target.added_type.clone();
                            }
                        }

                        if actual_damage > 0 {
                            let defender_item = if t_player == 1 {
                                self.p1
                                    .get(t_slot as usize)
                                    .map(|p| p.item.clone())
                                    .unwrap_or_default()
                            } else {
                                self.p2
                                    .get(t_slot as usize)
                                    .map(|p| p.item.clone())
                                    .unwrap_or_default()
                            };

                            if let Some(item_meta) = defender_item
                                .as_deref()
                                .and_then(crate::item_meta::get_item_meta)
                                && let Some(resist_type) = item_meta.type_resist_berry
                            {
                                let move_type = meta_opt
                                    .as_ref()
                                    .map(|m| m.move_type)
                                    .unwrap_or(damage_calc::types::Type::Normal);
                                if move_type == resist_type {
                                    let parse_type_local = |t: &str| -> damage_calc::types::Type {
                                        match t.to_lowercase().as_str() {
                                            "normal" => damage_calc::types::Type::Normal,
                                            "fire" => damage_calc::types::Type::Fire,
                                            "water" => damage_calc::types::Type::Water,
                                            "electric" => damage_calc::types::Type::Electric,
                                            "grass" => damage_calc::types::Type::Grass,
                                            "ice" => damage_calc::types::Type::Ice,
                                            "fighting" => damage_calc::types::Type::Fighting,
                                            "poison" => damage_calc::types::Type::Poison,
                                            "ground" => damage_calc::types::Type::Ground,
                                            "flying" => damage_calc::types::Type::Flying,
                                            "psychic" => damage_calc::types::Type::Psychic,
                                            "bug" => damage_calc::types::Type::Bug,
                                            "rock" => damage_calc::types::Type::Rock,
                                            "ghost" => damage_calc::types::Type::Ghost,
                                            "dragon" => damage_calc::types::Type::Dragon,
                                            "dark" => damage_calc::types::Type::Dark,
                                            "steel" => damage_calc::types::Type::Steel,
                                            "fairy" => damage_calc::types::Type::Fairy,
                                            _ => damage_calc::types::Type::Normal,
                                        }
                                    };
                                    if resist_type == damage_calc::types::Type::Normal
                                        || damage_calc::type_effectiveness_shift(
                                            move_type,
                                            parse_type_local(&defender_type1),
                                            defender_type2.as_deref().map(parse_type_local),
                                            defender_added.as_deref().map(parse_type_local),
                                        ) > 0
                                    {
                                        self.section_consume_item(PokemonIdent {
                                            player: t_player,
                                            slot: t_slot as usize,
                                        });
                                    }
                                }
                            }
                        }

                        let is_status_move =
                            meta_opt.as_ref().map(|m| m.category) == Some("Status");

                        if actual_damage > 0 || is_status_move {
                            move_successful = true;
                            total_damage_dealt += actual_damage;
                        }

                        if actual_damage > 0 {
                            let attacker_item = if action.player == 1 {
                                self.p1.get(action.slot).and_then(|p| p.item.clone())
                            } else {
                                self.p2.get(action.slot).and_then(|p| p.item.clone())
                            };
                            if attacker_item.as_deref() == Some("kingsrock") {
                                let mut rng = rand::rng();
                                if rng.random_range(1..=100) <= 10 {
                                    self.section_apply_volatile(
                                        PokemonIdent {
                                            player: t_player,
                                            slot: t_slot as usize,
                                        },
                                        "flinch".to_string(),
                                    );
                                }
                            }

                            // On-Hit Defender Abilities
                            let defender_ability = if t_player == 1 {
                                self.p1.get(t_slot as usize).and_then(|p| p.ability.clone())
                            } else {
                                self.p2.get(t_slot as usize).and_then(|p| p.ability.clone())
                            };

                            if let Some(ability) = defender_ability {
                                let move_type = meta_opt
                                    .as_ref()
                                    .map(|m| m.move_type)
                                    .unwrap_or(damage_calc::types::Type::Normal);
                                let is_contact =
                                    meta_opt.as_ref().map(|m| m.flags_contact).unwrap_or(false);

                                match ability.as_str() {
                                    "justified" => {
                                        if move_type == damage_calc::types::Type::Dark {
                                            self.apply_stat_change(
                                                t_player,
                                                t_slot as usize,
                                                Stat::Atk,
                                                1,
                                                action.player,
                                            );
                                        }
                                    }
                                    "rattled" => {
                                        if move_type == damage_calc::types::Type::Bug
                                            || move_type == damage_calc::types::Type::Ghost
                                            || move_type == damage_calc::types::Type::Dark
                                        {
                                            self.apply_stat_change(
                                                t_player,
                                                t_slot as usize,
                                                Stat::Spe,
                                                1,
                                                action.player,
                                            );
                                        }
                                    }
                                    "stamina" => {
                                        self.apply_stat_change(
                                            t_player,
                                            t_slot as usize,
                                            Stat::Def,
                                            1,
                                            action.player,
                                        );
                                    }
                                    "watercompaction" => {
                                        if move_type == damage_calc::types::Type::Water {
                                            self.apply_stat_change(
                                                t_player,
                                                t_slot as usize,
                                                Stat::Def,
                                                2,
                                                action.player,
                                            );
                                        }
                                    }
                                    "gooey" | "tanglinghair" => {
                                        if is_contact {
                                            self.apply_stat_change(
                                                action.player,
                                                action.slot,
                                                Stat::Spe,
                                                -1,
                                                t_player,
                                            );
                                        }
                                    }
                                    "ironbarbs" | "roughskin" if is_contact => {
                                        let max_hp = if action.player == 1 {
                                            self.p1.get(action.slot).map(|p| p.maxhp).unwrap_or(1)
                                        } else {
                                            self.p2.get(action.slot).map(|p| p.maxhp).unwrap_or(1)
                                        };
                                        self.section_take_damage(
                                            PokemonIdent {
                                                player: action.player,
                                                slot: action.slot,
                                            },
                                            std::cmp::max(1, max_hp / 8),
                                        );
                                    }
                                    _ => {}
                                }
                            }
                        }

                        // Specific Status Move hardcodes (Trick-or-Treat, Forest's Curse)
                        if target_alive_after && is_status_move {
                            if action.move_id == "trickortreat" {
                                self.section_apply_added_type(
                                    PokemonIdent {
                                        player: t_player,
                                        slot: t_slot as usize,
                                    },
                                    "Ghost".to_string(),
                                );
                            } else if action.move_id == "forestscurse" {
                                self.section_apply_added_type(
                                    PokemonIdent {
                                        player: t_player,
                                        slot: t_slot as usize,
                                    },
                                    "Grass".to_string(),
                                );
                            }
                        }

                        // Primary Status Boosts
                        if target_alive_after
                            && let Some(meta) = &meta_opt
                            && let Some(boosts) = &meta.boosts
                        {
                            if boosts.atk != 0 {
                                self.apply_stat_change(
                                    t_player,
                                    t_slot as usize,
                                    Stat::Atk,
                                    boosts.atk,
                                    action.player,
                                );
                            }
                            if boosts.def != 0 {
                                self.apply_stat_change(
                                    t_player,
                                    t_slot as usize,
                                    Stat::Def,
                                    boosts.def,
                                    action.player,
                                );
                            }
                            if boosts.spa != 0 {
                                self.apply_stat_change(
                                    t_player,
                                    t_slot as usize,
                                    Stat::Spa,
                                    boosts.spa,
                                    action.player,
                                );
                            }
                            if boosts.spd != 0 {
                                self.apply_stat_change(
                                    t_player,
                                    t_slot as usize,
                                    Stat::Spd,
                                    boosts.spd,
                                    action.player,
                                );
                            }
                            if boosts.spe != 0 {
                                self.apply_stat_change(
                                    t_player,
                                    t_slot as usize,
                                    Stat::Spe,
                                    boosts.spe,
                                    action.player,
                                );
                            }
                            if boosts.accuracy != 0 {
                                self.apply_stat_change(
                                    t_player,
                                    t_slot as usize,
                                    Stat::Accuracy,
                                    boosts.accuracy,
                                    action.player,
                                );
                            }
                            if boosts.evasion != 0 {
                                self.apply_stat_change(
                                    t_player,
                                    t_slot as usize,
                                    Stat::Evasion,
                                    boosts.evasion,
                                    action.player,
                                );
                            }
                        }

                        // Primary Status Effects
                        if target_alive_after
                            && is_status_move
                            && let Some(meta) = &meta_opt
                        {
                            let target_is_grounded = if t_player == 1 {
                                self.p1
                                    .get(t_slot as usize)
                                    .is_some_and(|p| p.is_grounded())
                            } else {
                                self.p2
                                    .get(t_slot as usize)
                                    .is_some_and(|p| p.is_grounded())
                            };

                            if let Some(vs) = &meta.volatile_status {
                                // Misty Terrain blocks confusion
                                if self.terrain.as_deref() == Some("MistyTerrain")
                                    && target_is_grounded
                                    && *vs == "confusion"
                                {
                                    // blocked
                                } else {
                                    self.section_apply_volatile(
                                        PokemonIdent {
                                            player: t_player,
                                            slot: t_slot as usize,
                                        },
                                        vs.to_string(),
                                    );
                                }
                            }

                            if let Some(st) = &meta.status {
                                let mut block_status = false;
                                if target_is_grounded
                                    && (self.terrain.as_deref() == Some("MistyTerrain")
                                        || (self.terrain.as_deref() == Some("ElectricTerrain")
                                            && *st == "slp"))
                                {
                                    block_status = true;
                                }

                                // Grass types are immune to powder moves (which cause sleep/poison)
                                if meta.is_powder {
                                    let is_grass = if t_player == 1 {
                                        self.p1.get(t_slot as usize).is_some_and(|p| {
                                            p.type1 == "Grass"
                                                || p.type2.as_deref() == Some("Grass")
                                                || p.added_type.as_deref() == Some("Grass")
                                        })
                                    } else {
                                        self.p2.get(t_slot as usize).is_some_and(|p| {
                                            p.type1 == "Grass"
                                                || p.type2.as_deref() == Some("Grass")
                                                || p.added_type.as_deref() == Some("Grass")
                                        })
                                    };
                                    if is_grass {
                                        block_status = true;
                                    }
                                }

                                if !block_status {
                                    self.section_apply_status(
                                        PokemonIdent {
                                            player: t_player,
                                            slot: t_slot as usize,
                                        },
                                        st.to_string(),
                                    );
                                }
                            }
                        }

                        // Secondary Effects (Flinch, Status, etc.)
                        if target_alive_after
                            && damage > 0
                            && let Some(meta) = &meta_opt
                            && let Some(sec) = &meta.secondary
                        {
                            let force_sec = self
                                .rng_config
                                .as_ref()
                                .and_then(|c| c.secondary.as_ref())
                                .map(|s| s.as_str());

                            let mut apply_sec = false;

                            if force_sec == Some("always")
                                || force_sec == sec.volatile_status
                                || force_sec == sec.status
                            {
                                apply_sec = true;
                            } else if force_sec.is_none() || force_sec == Some("random") {
                                let mut rng = rand::rng();
                                let roll = rng.random_range(1..=100);
                                apply_sec = roll <= sec.chance;
                            }

                            if apply_sec {
                                let target_is_grounded = if t_player == 1 {
                                    self.p1
                                        .get(t_slot as usize)
                                        .is_some_and(|p| p.is_grounded())
                                } else {
                                    self.p2
                                        .get(t_slot as usize)
                                        .is_some_and(|p| p.is_grounded())
                                };

                                if let Some(vs) = sec.volatile_status {
                                    // Misty Terrain blocks confusion
                                    if self.terrain.as_deref() == Some("MistyTerrain")
                                        && target_is_grounded
                                        && vs == "confusion"
                                    {
                                        // blocked
                                    } else {
                                        self.section_apply_volatile(
                                            PokemonIdent {
                                                player: t_player,
                                                slot: t_slot as usize,
                                            },
                                            vs.to_string(),
                                        );
                                    }
                                }

                                if let Some(st) = sec.status {
                                    let mut block_status = false;
                                    if target_is_grounded
                                        && (self.terrain.as_deref() == Some("MistyTerrain")
                                            || (self.terrain.as_deref() == Some("ElectricTerrain")
                                                && st == "slp"))
                                    {
                                        block_status = true;
                                    }

                                    if !block_status {
                                        self.section_apply_status(
                                            PokemonIdent {
                                                player: t_player,
                                                slot: t_slot as usize,
                                            },
                                            st.to_string(),
                                        );
                                    }
                                }

                                if let Some(boosts) = &sec.boosts {
                                    if boosts.atk != 0 {
                                        self.apply_stat_change(
                                            t_player,
                                            t_slot as usize,
                                            Stat::Atk,
                                            boosts.atk,
                                            action.player,
                                        );
                                    }
                                    if boosts.def != 0 {
                                        self.apply_stat_change(
                                            t_player,
                                            t_slot as usize,
                                            Stat::Def,
                                            boosts.def,
                                            action.player,
                                        );
                                    }
                                    if boosts.spa != 0 {
                                        self.apply_stat_change(
                                            t_player,
                                            t_slot as usize,
                                            Stat::Spa,
                                            boosts.spa,
                                            action.player,
                                        );
                                    }
                                    if boosts.spd != 0 {
                                        self.apply_stat_change(
                                            t_player,
                                            t_slot as usize,
                                            Stat::Spd,
                                            boosts.spd,
                                            action.player,
                                        );
                                    }
                                    if boosts.spe != 0 {
                                        self.apply_stat_change(
                                            t_player,
                                            t_slot as usize,
                                            Stat::Spe,
                                            boosts.spe,
                                            action.player,
                                        );
                                    }
                                }
                            }
                        }
                    }
                }

                if !hit_anyone {
                    break;
                }
            }

            if move_successful && let Some(meta) = &meta_opt {
                if let Some((num, den)) = meta.recoil {
                    let n = num;
                    let d = den;

                    // Pokémon Showdown uses Math.round for recoil
                    let recoil_damage = std::cmp::max(1, (total_damage_dealt * n + (d / 2)) / d);
                    self.section_take_damage(
                        PokemonIdent {
                            player: action.player,
                            slot: action.slot,
                        },
                        recoil_damage,
                    );
                }

                // Handle drain and Shell Bell
                let mut drain_heal = 0;
                if let Some((num, den)) = meta.drain {
                    let mut base_drain = std::cmp::max(1, total_damage_dealt * num / den);
                    let attacker_item = if action.player == 1 {
                        self.p1
                            .get(action.slot)
                            .map(|p| p.item.clone())
                            .unwrap_or_default()
                    } else {
                        self.p2
                            .get(action.slot)
                            .map(|p| p.item.clone())
                            .unwrap_or_default()
                    };
                    if attacker_item.as_deref() == Some("bigroot") {
                        base_drain = (base_drain as f32 * 1.3) as i32;
                    }
                    drain_heal += base_drain;
                }

                let attacker_item = if action.player == 1 {
                    self.p1
                        .get(action.slot)
                        .map(|p| p.item.clone())
                        .unwrap_or_default()
                } else {
                    self.p2
                        .get(action.slot)
                        .map(|p| p.item.clone())
                        .unwrap_or_default()
                };
                if attacker_item.as_deref() == Some("shellbell") && total_damage_dealt > 0 {
                    drain_heal += std::cmp::max(1, total_damage_dealt / 8);
                }

                if drain_heal > 0 {
                    if action.player == 1 {
                        if let Some(p) = self.p1.get_mut(action.slot) {
                            p.hp = std::cmp::min(p.maxhp, p.hp + drain_heal);
                        }
                    } else {
                        if let Some(p) = self.p2.get_mut(action.slot) {
                            p.hp = std::cmp::min(p.maxhp, p.hp + drain_heal);
                        }
                    }
                }

                // Handle self_effect
                if let Some(self_eff) = &meta.self_effect
                    && let Some(boosts) = &self_eff.boosts
                {
                    if boosts.atk != 0 {
                        self.apply_stat_change(
                            action.player,
                            action.slot,
                            Stat::Atk,
                            boosts.atk,
                            action.player,
                        );
                    }
                    if boosts.def != 0 {
                        self.apply_stat_change(
                            action.player,
                            action.slot,
                            Stat::Def,
                            boosts.def,
                            action.player,
                        );
                    }
                    if boosts.spa != 0 {
                        self.apply_stat_change(
                            action.player,
                            action.slot,
                            Stat::Spa,
                            boosts.spa,
                            action.player,
                        );
                    }
                    if boosts.spd != 0 {
                        self.apply_stat_change(
                            action.player,
                            action.slot,
                            Stat::Spd,
                            boosts.spd,
                            action.player,
                        );
                    }
                    if boosts.spe != 0 {
                        self.apply_stat_change(
                            action.player,
                            action.slot,
                            Stat::Spe,
                            boosts.spe,
                            action.player,
                        );
                    }
                }

                // Handle flags_recharge
                if meta.flags_recharge {
                    self.section_apply_volatile(
                        PokemonIdent {
                            player: action.player,
                            slot: action.slot,
                        },
                        "mustrecharge".to_string(),
                    );
                }

                // Life Orb recoil
                let attacker_item = if action.player == 1 {
                    self.p1
                        .get(action.slot)
                        .map(|p| p.item.clone())
                        .unwrap_or_default()
                } else {
                    self.p2
                        .get(action.slot)
                        .map(|p| p.item.clone())
                        .unwrap_or_default()
                };

                if let Some(item_meta) = attacker_item
                    .as_deref()
                    .and_then(crate::item_meta::get_item_meta)
                    && item_meta.is_life_orb
                    && total_damage_dealt > 0
                    && !meta_opt.as_ref().is_some_and(|m| m.category == "Status")
                {
                    let attacker_maxhp = if action.player == 1 {
                        self.p1.get(action.slot).map(|p| p.maxhp).unwrap_or(0)
                    } else {
                        self.p2.get(action.slot).map(|p| p.maxhp).unwrap_or(0)
                    };
                    let lo_recoil = std::cmp::max(1, attacker_maxhp / 10);
                    self.section_take_damage(
                        PokemonIdent {
                            player: action.player,
                            slot: action.slot,
                        },
                        lo_recoil,
                    );
                }
            }
        } // THIS closes `for action in actions {`

        // End of turn logic
        for p in self.p1.iter_mut().chain(self.p2.iter_mut()) {
            p.volatile_status
                .retain(|s| s != "protect" && s != "flinch");
            if p.hp == 0 {
                continue;
            }

            let mut is_magic_guard = false;
            let mut is_sand_immune = false;

            if p.type1 == "Rock"
                || p.type1 == "Ground"
                || p.type1 == "Steel"
                || p.type2.as_deref() == Some("Rock")
                || p.type2.as_deref() == Some("Ground")
                || p.type2.as_deref() == Some("Steel")
            {
                is_sand_immune = true;
            }
            if let Some(meta) = p
                .ability
                .as_deref()
                .and_then(crate::ability_meta::get_ability_meta)
                && meta.is_magic_guard
            {
                is_magic_guard = true;
                is_sand_immune = true;
            }
            if p.ability.as_deref() == Some("sandveil")
                || p.ability.as_deref() == Some("sandrush")
                || p.ability.as_deref() == Some("sandforce")
                || p.ability.as_deref() == Some("overcoat")
            {
                is_sand_immune = true;
            }

            if !is_magic_guard {
                if p.status.as_deref() == Some("brn") {
                    p.hp -= std::cmp::max(1, p.maxhp / 16);
                } else if p.status.as_deref() == Some("psn") || p.status.as_deref() == Some("tox") {
                    p.hp -= std::cmp::max(1, p.maxhp / 8);
                }

                // Weather damage
                if self.weather.as_deref() == Some("Sandstorm") && !is_sand_immune {
                    let damage = std::cmp::max(1, p.maxhp / 16);
                    p.hp -= damage;
                }
            }

            // Grassy Terrain Healing
            if self.terrain.as_deref() == Some("GrassyTerrain") {
                // Flying types and Levitating Pokemon don't get healing
                if p.is_grounded() {
                    let heal = std::cmp::max(1, p.maxhp / 16);
                    p.hp = std::cmp::min(p.maxhp, p.hp + heal);
                }
            }

            if p.hp < 0 {
                p.hp = 0;
            }
        }

        if self.weather_turns_left > 0 {
            self.weather_turns_left -= 1;
            if self.weather_turns_left == 0 {
                self.weather = None;
            }
        }
        if self.terrain_turns_left > 0 {
            self.terrain_turns_left -= 1;
            if self.terrain_turns_left == 0 {
                self.terrain = None;
            }
        }
        if self.p1_tailwind_turns > 0 {
            self.p1_tailwind_turns -= 1;
            if self.p1_tailwind_turns == 0 {
                self.p1_tailwind = false;
            }
        }
        if self.p2_tailwind_turns > 0 {
            self.p2_tailwind_turns -= 1;
            if self.p2_tailwind_turns == 0 {
                self.p2_tailwind = false;
            }
        }

        // Trigger EndOfTurn event for items and abilities
        for i in 0..self.p1.len() {
            let mut ctx = EventContext::builder()
                .target(PokemonIdent { player: 1, slot: i })
                .build();
            self.trigger_event(EventId::EndOfTurn, &mut ctx);
        }
        for i in 0..self.p2.len() {
            let mut ctx = EventContext::builder()
                .target(PokemonIdent { player: 2, slot: i })
                .build();
            self.trigger_event(EventId::EndOfTurn, &mut ctx);
        }

        Ok(())
    }

    pub fn run_switch_in(&mut self, player: u8, slot: usize) {
        let ability = if player == 1 {
            self.p1
                .get(slot)
                .map(|p| p.ability.clone())
                .unwrap_or_default()
        } else {
            self.p2
                .get(slot)
                .map(|p| p.ability.clone())
                .unwrap_or_default()
        };

        let item = if player == 1 {
            self.p1
                .get(slot)
                .map(|p| p.item.clone())
                .unwrap_or_default()
        } else {
            self.p2
                .get(slot)
                .map(|p| p.item.clone())
                .unwrap_or_default()
        };

        if let Some(meta) = ability
            .as_deref()
            .and_then(crate::ability_meta::get_ability_meta)
        {
            if let Some(w) = meta.on_start_weather {
                self.weather = Some(w.to_string());
                if (w == "RainDance" && item.as_deref() == Some("damprock"))
                    || (w == "SunnyDay" && item.as_deref() == Some("heatrock"))
                    || (w == "Sandstorm" && item.as_deref() == Some("smoothrock"))
                    || (w == "Snow" && item.as_deref() == Some("icyrock"))
                {
                    self.weather_turns_left = 8;
                } else {
                    self.weather_turns_left = 5;
                }
            }
            if let Some(t) = meta.on_start_terrain {
                self.terrain = Some(t.to_string());
                if item.as_deref() == Some("terrainextender") {
                    self.terrain_turns_left = 8;
                } else {
                    self.terrain_turns_left = 5;
                }
            }
            if let Some(drop) = meta.on_start_stat_drop_foe {
                let targets = if player == 1 {
                    (0..std::cmp::min(2, self.p2.len())).collect::<Vec<_>>()
                } else {
                    (0..std::cmp::min(2, self.p1.len())).collect::<Vec<_>>()
                };

                for t_slot in targets {
                    let target_player = if player == 1 { 2 } else { 1 };
                    let hp = if target_player == 1 {
                        self.p1.get(t_slot).map(|p| p.hp).unwrap_or(0)
                    } else {
                        self.p2.get(t_slot).map(|p| p.hp).unwrap_or(0)
                    };

                    if hp > 0 {
                        self.apply_stat_change(target_player, t_slot, Stat::Atk, drop.atk, player);
                    }
                }
            }
            if let Some(boost) = meta.on_start_stat_boost_self {
                if player == 1 {
                    if let Some(p) = self.p1.get_mut(slot) {
                        p.boosts.atk = (p.boosts.atk + boost.atk).clamp(-6, 6);
                    }
                } else {
                    if let Some(p) = self.p2.get_mut(slot) {
                        p.boosts.atk = (p.boosts.atk + boost.atk).clamp(-6, 6);
                    }
                }
            }
        }
    }

    fn get_move_priority(&self, move_id: &str, pkmn: &Pokemon) -> i32 {
        let meta = crate::move_meta::get_move_meta(move_id);
        let mut base_priority = meta.as_ref().map(|m| m.priority).unwrap_or(0);

        let is_prankster = pkmn.ability.as_deref() == Some("prankster")
            && meta.as_ref().map(|m| m.category) == Some("Status");
        let is_galewings = pkmn.ability.as_deref() == Some("galewings")
            && meta.as_ref().map(|m| m.move_type) == Some(damage_calc::types::Type::Flying)
            && pkmn.hp == pkmn.maxhp;

        if is_prankster || is_galewings {
            base_priority += 1;
        } else if pkmn.ability.as_deref() == Some("triage") {
            // Triage gives +3 to healing moves. We need to add flags_heal to MoveMeta later.
            // For now, hardcode some common healing moves or leave it.
            if move_id == "recover"
                || move_id == "roost"
                || move_id == "synthesise"
                || move_id == "softboiled"
                || move_id == "floralhealing"
            {
                base_priority += 3;
            }
        }
        base_priority
    }

    fn resolve_redirection(
        &self,
        attacker_player: u8,
        attacker_slot: usize,
        target_player: u8,
        original_target_slot: usize,
    ) -> (u8, usize) {
        // Redirection only redirects moves targeting an opponent
        if attacker_player == target_player {
            return (target_player, original_target_slot);
        }

        let attacker = if attacker_player == 1 {
            self.p1.get(attacker_slot)
        } else {
            self.p2.get(attacker_slot)
        };
        if let Some(atk) = attacker {
            // Stalwart and Propeller Tail ignore ALL redirection
            if atk.ability.as_deref() == Some("stalwart")
                || atk.ability.as_deref() == Some("propellertail")
            {
                return (target_player, original_target_slot);
            }

            // Find if any opponent has followme or ragepowder
            let foes = if attacker_player == 1 {
                &self.p2
            } else {
                &self.p1
            };

            // Priority: In doubles, if both use redirection, the faster one takes priority (but here we just check slot 0 then 1 for simplicity,
            // since usually only one pokemon uses redirection per turn).
            for (i, foe) in foes.iter().enumerate() {
                if foe.hp > 0 {
                    if foe.volatile_status.contains(&"followme".to_string()) {
                        return (target_player, i);
                    } else if foe.volatile_status.contains(&"ragepowder".to_string()) {
                        // Grass types, Overcoat, and Safety Goggles ignore Rage Powder
                        let is_grass = atk.type1 == "Grass"
                            || atk.type2.as_deref() == Some("Grass")
                            || atk.added_type.as_deref() == Some("Grass");
                        let has_overcoat = atk.ability.as_deref() == Some("overcoat");
                        let has_goggles = atk.item.as_deref() == Some("safetygoggles");

                        if !is_grass && !has_overcoat && !has_goggles {
                            return (target_player, i);
                        }
                    }
                }
            }
        }

        (target_player, original_target_slot)
    }

    fn apply_boost(stat: i32, stage: i8) -> i32 {
        let stage = stage.clamp(-6, 6) as i32;
        if stage >= 0 {
            stat * (2 + stage) / 2
        } else {
            stat * 2 / (2 - stage)
        }
    }

    fn check_speed_modifiers(&self, pkmn: &Pokemon, mut speed: i32) -> i32 {
        if pkmn.status.as_deref() == Some("par") {
            speed /= 2;
        }
        // Tailwind
        let is_p1 = self.p1.iter().any(|p| p.ident == pkmn.ident);
        if (is_p1 && self.p1_tailwind) || (!is_p1 && self.p2_tailwind) {
            speed *= 2;
        }

        if let Some(item_meta) = pkmn
            .item
            .as_deref()
            .and_then(crate::item_meta::get_item_meta)
        {
            if item_meta.is_choice_scarf {
                speed = (speed as f32 * 1.5) as i32;
            } else if item_meta.is_speed_drop {
                speed /= 2;
            }
        }

        // Ability modifier
        if (pkmn.ability.as_deref() == Some("swiftswim")
            && (self.weather.as_deref() == Some("RainDance")
                || self.weather.as_deref() == Some("PrimordialSea")))
            || (pkmn.ability.as_deref() == Some("chlorophyll")
                && (self.weather.as_deref() == Some("SunnyDay")
                    || self.weather.as_deref() == Some("DesolateLand")))
            || (pkmn.ability.as_deref() == Some("sandrush")
                && self.weather.as_deref() == Some("Sandstorm"))
            || (pkmn.ability.as_deref() == Some("slushrush")
                && self.weather.as_deref() == Some("Snow"))
            || (pkmn.ability.as_deref() == Some("surgesurfer")
                && self.terrain.as_deref() == Some("ElectricTerrain"))
        {
            speed *= 2;
        }

        if pkmn.ability.as_deref() == Some("quickfeet") && pkmn.status.is_some() {
            speed = (speed as f32 * 1.5) as i32;
            if pkmn.status.as_deref() == Some("par") {
                speed *= 2; // Negate the / 2 from earlier
            }
        }

        speed
    }

    fn calculate_raw_damage(
        &self,
        move_id: &str,
        player: u8,
        slot: u8,
        target_player: u8,
        target_slot: u8,
        is_spread: bool,
    ) -> (i32, Option<String>) {
        let attacker = if player == 1 {
            self.p1.get(slot as usize)
        } else {
            self.p2.get(slot as usize)
        };
        let defender = if target_player == 1 {
            self.p1.get(target_slot as usize)
        } else {
            self.p2.get(target_slot as usize)
        };
        if attacker.is_none() || defender.is_none() {
            return (0, None);
        }
        let (attacker, defender) = (attacker.unwrap(), defender.unwrap());

        let mut base_power = 0; // Default placeholder BP
        let mut move_type = damage_calc::types::Type::Normal;
        let mut is_physical = true;

        if let Some(meta) = crate::move_meta::get_move_meta(move_id) {
            base_power = meta.base_power;
            move_type = meta.move_type;
            is_physical = meta.category == "Physical";
        }

        if move_id == "facade" && attacker.status.is_some() {
            let s = attacker.status.as_deref().unwrap();
            if s == "brn" || s == "psn" || s == "tox" || s == "par" {
                base_power *= 2;
            }
        }

        let mut attack = if is_physical {
            attacker.attack
        } else {
            attacker.sp_attack
        };

        if attacker.item.as_deref() == Some("lightball")
            && attacker.ident.to_lowercase().contains("pikachu")
        {
            attack *= 2;
        }

        let defense = if is_physical {
            defender.defense
        } else {
            defender.sp_defense
        };

        let parse_type = |t: &str| -> damage_calc::types::Type {
            match t.to_lowercase().as_str() {
                "normal" => damage_calc::types::Type::Normal,
                "fire" => damage_calc::types::Type::Fire,
                "water" => damage_calc::types::Type::Water,
                "electric" => damage_calc::types::Type::Electric,
                "grass" => damage_calc::types::Type::Grass,
                "ice" => damage_calc::types::Type::Ice,
                "fighting" => damage_calc::types::Type::Fighting,
                "poison" => damage_calc::types::Type::Poison,
                "ground" => damage_calc::types::Type::Ground,
                "flying" => damage_calc::types::Type::Flying,
                "psychic" => damage_calc::types::Type::Psychic,
                "bug" => damage_calc::types::Type::Bug,
                "rock" => damage_calc::types::Type::Rock,
                "ghost" => damage_calc::types::Type::Ghost,
                "dragon" => damage_calc::types::Type::Dragon,
                "dark" => damage_calc::types::Type::Dark,
                "steel" => damage_calc::types::Type::Steel,
                "fairy" => damage_calc::types::Type::Fairy,
                _ => damage_calc::types::Type::Normal,
            }
        };

        let mut ate_boost = false;
        match attacker.ability.as_deref().unwrap_or("") {
            "aerilate" => {
                if move_type == damage_calc::types::Type::Normal {
                    move_type = damage_calc::types::Type::Flying;
                    ate_boost = true;
                }
            }
            "pixilate" => {
                if move_type == damage_calc::types::Type::Normal {
                    move_type = damage_calc::types::Type::Fairy;
                    ate_boost = true;
                }
            }
            "refrigerate" => {
                if move_type == damage_calc::types::Type::Normal {
                    move_type = damage_calc::types::Type::Ice;
                    ate_boost = true;
                }
            }
            "galvanize" => {
                if move_type == damage_calc::types::Type::Normal {
                    move_type = damage_calc::types::Type::Electric;
                    ate_boost = true;
                }
            }
            "normalize" if move_type != damage_calc::types::Type::Normal => {
                move_type = damage_calc::types::Type::Normal;
                ate_boost = true;
            }
            _ => {}
        }

        let mut stab_modifier = 4096;
        if move_type == parse_type(&attacker.type1)
            || attacker.type2.as_deref().map(parse_type) == Some(move_type)
            || attacker.added_type.as_deref().map(parse_type) == Some(move_type)
            || attacker.ability.as_deref() == Some("protean")
            || attacker.ability.as_deref() == Some("libero")
        {
            stab_modifier = if attacker.ability.as_deref() == Some("adaptability") {
                8192
            } else {
                6144
            };
        }

        // Weather
        let mut weather_modifier = 4096;
        if (self.weather.as_deref() == Some("SunnyDay")
            || self.weather.as_deref() == Some("DesolateLand"))
            && move_type == damage_calc::types::Type::Fire
        {
            weather_modifier = 6144;
        } else if (self.weather.as_deref() == Some("SunnyDay")
            || self.weather.as_deref() == Some("DesolateLand"))
            && move_type == damage_calc::types::Type::Water
        {
            weather_modifier = 2048;
        } else if (self.weather.as_deref() == Some("RainDance")
            || self.weather.as_deref() == Some("PrimordialSea"))
            && move_type == damage_calc::types::Type::Water
        {
            weather_modifier = 6144;
        } else if (self.weather.as_deref() == Some("RainDance")
            || self.weather.as_deref() == Some("PrimordialSea"))
            && move_type == damage_calc::types::Type::Fire
        {
            weather_modifier = 2048;
        }

        // Interface with damage-calc crate

        let mut rng = rand::rng();
        let is_crit = if let Some(config) = &self.rng_config {
            if let Some(crits) = &config.crits {
                match crits.as_str() {
                    "always" => true,
                    "never" => false,
                    _ => rng.random_range(0..24) == 0,
                }
            } else {
                rng.random_range(0..24) == 0
            }
        } else {
            rng.random_range(0..24) == 0
        };

        let mut defense_modifiers = vec![];
        if self.weather.as_deref() == Some("Sandstorm")
            && (parse_type(&defender.type1) == damage_calc::types::Type::Rock
                || defender.type2.as_deref().map(parse_type)
                    == Some(damage_calc::types::Type::Rock)
                || defender.added_type.as_deref().map(parse_type)
                    == Some(damage_calc::types::Type::Rock))
            && !is_physical
        {
            defense_modifiers.push(6144);
        }
        if self.weather.as_deref() == Some("Snow")
            && (parse_type(&defender.type1) == damage_calc::types::Type::Ice
                || defender.type2.as_deref().map(parse_type) == Some(damage_calc::types::Type::Ice)
                || defender.added_type.as_deref().map(parse_type)
                    == Some(damage_calc::types::Type::Ice))
            && is_physical
        {
            defense_modifiers.push(6144);
        }

        let mut input = DamageInput {
            level: 50,
            base_power: base_power as u16,
            bp_modifiers: vec![],
            attack: attack as u16,
            attack_boost: if is_physical {
                attacker.boosts.atk
            } else {
                attacker.boosts.spa
            },
            attack_modifiers: vec![],
            defense: defense as u16,
            defense_boost: if is_physical {
                defender.boosts.def
            } else {
                defender.boosts.spd
            },
            defense_modifiers,
            is_physical,
            move_type,
            defender_type1: parse_type(&defender.type1),
            defender_type2: defender.type2.as_deref().map(parse_type),
            defender_type3: defender.added_type.as_deref().map(parse_type),
            effectiveness_override: None,
            immune_override: None,
            spread_modifier: if is_spread { 3072 } else { 4096 },
            parental_bond_modifier: 4096,
            weather_modifier,
            is_crit,
            crit_modifier: if is_crit { 6144 } else { 4096 },
            stab_modifier,
            is_burned: is_physical
                && attacker.status.as_deref() == Some("brn")
                && attacker.ability.as_deref() != Some("guts")
                && move_id != "facade",
            final_modifiers: vec![],
            protect_modifier: 4096,
            tinted_lens: false,
            neuroforce: false,
            solid_rock: false,
        };

        if let Some(meta) = attacker
            .ability
            .as_deref()
            .and_then(crate::ability_meta::get_ability_meta)
        {
            if meta.ignore_foe_stat_changes {
                input.defense_boost = 0;
            }
            if let Some((boost_type, boost_mult)) = meta.attack_type_boost
                && move_type == boost_type
            {
                // Approximate the 1.5x damage by applying it to weather or other modifiers for now
                // In a full implementation, we'd add an ability_multiplier to damage_calc
                // For now, let's just multiply the base power or apply it to a generic multiplier
                input.weather_modifier = (input.weather_modifier as f32 * boost_mult) as u16;
            }
        }
        let attacker_ability = attacker.ability.as_deref().unwrap_or("");
        let mold_breaker = attacker_ability == "moldbreaker"
            || attacker_ability == "teravolt"
            || attacker_ability == "turboblaze";

        if let Some(meta) = defender
            .ability
            .as_deref()
            .and_then(crate::ability_meta::get_ability_meta)
            && !mold_breaker
        {
            if meta.ignore_foe_stat_changes {
                input.attack_boost = 0;
            }
            if let Some(immune) = meta.immune_to_type
                && immune == move_type
            {
                input.immune_override = Some(true);
            }
        }

        // Terrain
        if self.terrain.as_deref() == Some("ElectricTerrain")
            && move_type == damage_calc::types::Type::Electric
            && attacker.is_grounded()
        {
            input.bp_modifiers.push(5324);
        } else if self.terrain.as_deref() == Some("GrassyTerrain") {
            if move_type == damage_calc::types::Type::Grass && attacker.is_grounded() {
                input.bp_modifiers.push(5324);
            }
            if move_type == damage_calc::types::Type::Ground
                && (move_id == "earthquake" || move_id == "magnitude" || move_id == "bulldoze")
            {
                input.bp_modifiers.push(2048); // Halves damage
            }
        } else if self.terrain.as_deref() == Some("PsychicTerrain")
            && move_type == damage_calc::types::Type::Psychic
            && attacker.is_grounded()
        {
            input.bp_modifiers.push(5324);
        } else if self.terrain.as_deref() == Some("MistyTerrain")
            && move_type == damage_calc::types::Type::Dragon
            && defender.is_grounded()
        {
            input.bp_modifiers.push(2048);
        }

        // Process Ability Hooks
        match attacker.ability.as_deref().unwrap_or("") {
            "aerilate" | "pixilate" | "refrigerate" | "galvanize" | "normalize" => {
                if ate_boost {
                    input.bp_modifiers.push(4915); // 1.2x boost
                }
            }
            "hugepower" | "purepower" => {
                if is_physical {
                    input.attack_modifiers.push(8192);
                }
            }
            "guts" => {
                if is_physical && attacker.status.is_some() {
                    input.attack_modifiers.push(6144);
                }
            }
            "toxicboost" => {
                if is_physical
                    && (attacker.status.as_deref() == Some("psn")
                        || attacker.status.as_deref() == Some("tox"))
                {
                    input.bp_modifiers.push(6144); // 1.5x
                }
            }
            "flareboost" => {
                if !is_physical && attacker.status.as_deref() == Some("brn") {
                    input.bp_modifiers.push(6144); // 1.5x
                }
            }
            "hustle" => {
                if is_physical {
                    input.attack_modifiers.push(6144);
                }
            }
            "waterbubble" => {
                if move_type == damage_calc::types::Type::Water {
                    input.attack_modifiers.push(8192);
                }
            }
            "toughclaws" => {
                if crate::move_meta::get_move_meta(move_id)
                    .map(|m| m.flags_contact)
                    .unwrap_or(false)
                {
                    input.bp_modifiers.push(5324); // 1.3x
                }
            }
            "technician" => {
                if base_power <= 60 {
                    input.bp_modifiers.push(6144);
                }
            }
            "strongjaw" => {
                if crate::move_meta::get_move_meta(move_id)
                    .map(|m| m.is_bite)
                    .unwrap_or(false)
                {
                    input.bp_modifiers.push(6144);
                }
            }
            "megalauncher" => {
                if move_id.contains("aura") || move_id.contains("pulse") {
                    input.bp_modifiers.push(6144);
                }
            }
            "reckless" => {
                if crate::move_meta::get_move_meta(move_id)
                    .map(|m| m.recoil.is_some())
                    .unwrap_or(false)
                {
                    input.bp_modifiers.push(4915); // 1.2x
                }
            }
            "ironfist" => {
                if crate::move_meta::get_move_meta(move_id)
                    .map(|m| m.is_punch)
                    .unwrap_or(false)
                {
                    input.bp_modifiers.push(4915); // 1.2x
                }
            }
            "sniper" => {
                if input.is_crit {
                    input.crit_modifier = 9216; // 2.25x
                }
            }
            "tintedlens" => {
                input.tinted_lens = true;
            }
            "steelworker" => {
                if move_type == damage_calc::types::Type::Steel {
                    input.attack_modifiers.push(6144);
                }
            }
            "transistor" => {
                if move_type == damage_calc::types::Type::Electric {
                    input.attack_modifiers.push(5324); // 1.3x
                }
            }
            "dragonsmaw" => {
                if move_type == damage_calc::types::Type::Dragon {
                    input.attack_modifiers.push(6144);
                }
            }
            "sharpness" => {
                if crate::move_meta::get_move_meta(move_id)
                    .map(|m| m.is_slicing)
                    .unwrap_or(false)
                {
                    input.bp_modifiers.push(6144);
                }
            }
            "overgrow" => {
                if move_type == damage_calc::types::Type::Grass && attacker.hp <= attacker.maxhp / 3
                {
                    input.attack_modifiers.push(6144);
                }
            }
            "blaze" => {
                if move_type == damage_calc::types::Type::Fire && attacker.hp <= attacker.maxhp / 3
                {
                    input.attack_modifiers.push(6144);
                }
            }
            "torrent" => {
                if move_type == damage_calc::types::Type::Water && attacker.hp <= attacker.maxhp / 3
                {
                    input.attack_modifiers.push(6144);
                }
            }
            "swarm"
                if move_type == damage_calc::types::Type::Bug
                    && attacker.hp <= attacker.maxhp / 3 =>
            {
                input.attack_modifiers.push(6144);
            }

            "solarpower" => {
                if !is_physical
                    && (self.weather.as_deref() == Some("SunnyDay")
                        || self.weather.as_deref() == Some("DesolateLand"))
                {
                    input.attack_modifiers.push(6144);
                }
            }
            "defeatist" => {
                if attacker.hp <= attacker.maxhp / 2 {
                    input.attack_modifiers.push(2048);
                }
            }
            "slowstart" => {
                if is_physical {
                    input.attack_modifiers.push(2048);
                }
            }
            "punkrock" => {
                if move_id.contains("sound")
                    || move_id.contains("voice")
                    || move_id.contains("snarl")
                    || move_id.contains("hypervoice")
                    || move_id.contains("boomburst")
                    || move_id.contains("overdrive")
                    || move_id.contains("bugbuzz")
                    || move_id.contains("roar")
                    || move_id.contains("howl")
                    || move_id.contains("sing")
                {
                    input.bp_modifiers.push(5324); // 1.3x
                }
            }
            "sandforce" => {
                if self.weather.as_deref() == Some("Sandstorm")
                    && (move_type == damage_calc::types::Type::Rock
                        || move_type == damage_calc::types::Type::Ground
                        || move_type == damage_calc::types::Type::Steel)
                {
                    input.bp_modifiers.push(5324); // 1.3x
                }
            }

            "neuroforce" => {
                input.neuroforce = true; // flag to be handled in calc
            }

            _ => {}
        }

        match defender.ability.as_deref().unwrap_or("") {
            "furcoat" if !mold_breaker => {
                if is_physical {
                    input.defense_modifiers.push(8192);
                }
            }
            "marvelscale" if !mold_breaker => {
                if is_physical && defender.status.is_some() {
                    input.defense_modifiers.push(6144);
                }
            }
            "waterbubble" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Fire {
                    input.bp_modifiers.push(2048);
                }
            }
            "fluffy" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Fire {
                    input.bp_modifiers.push(8192);
                } else if is_physical {
                    input.bp_modifiers.push(2048);
                } // Rough approximation for contact
            }
            "thickfat" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Fire
                    || move_type == damage_calc::types::Type::Ice
                {
                    input.attack_modifiers.push(2048);
                }
            }
            "purifyingsalt" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Ghost {
                    input.attack_modifiers.push(2048);
                }
            }
            "solidrock" | "filter" if !mold_breaker => {
                input.solid_rock = true;
            }
            "prismarmor" => {
                input.solid_rock = true;
            }
            "icescales" if !mold_breaker => {
                if !is_physical {
                    input.final_modifiers.push(2048);
                }
            }
            "multiscale" if !mold_breaker => {
                if defender.hp == defender.maxhp {
                    input.final_modifiers.push(2048);
                }
            }
            "shadowshield" => {
                if defender.hp == defender.maxhp {
                    input.final_modifiers.push(2048);
                }
            }
            "punkrock"
                if !mold_breaker
                    && (move_id.contains("sound")
                        || move_id.contains("voice")
                        || move_id.contains("snarl")
                        || move_id.contains("hypervoice")
                        || move_id.contains("boomburst")
                        || move_id.contains("overdrive")
                        || move_id.contains("bugbuzz")
                        || move_id.contains("roar")
                        || move_id.contains("howl")
                        || move_id.contains("sing")) =>
            {
                input.final_modifiers.push(2048);
            }
            "waterabsorb" | "dryskin" | "stormdrain" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Water {
                    input.immune_override = Some(true);
                }
                if defender.ability.as_deref() == Some("dryskin")
                    && move_type == damage_calc::types::Type::Fire
                {
                    input.bp_modifiers.push(5120); // 1.25x
                }
            }
            "voltabsorb" | "motordrive" | "lightningrod" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Electric {
                    input.immune_override = Some(true);
                }
            }
            "flashfire" | "wellbakedbody" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Fire {
                    input.immune_override = Some(true);
                }
            }
            "sapsipper" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Grass {
                    input.immune_override = Some(true);
                }
            }
            "eartheater" | "levitate" if !mold_breaker => {
                if move_type == damage_calc::types::Type::Ground {
                    input.immune_override = Some(true);
                }
            }
            "soundproof" if !mold_breaker => {
                if crate::move_meta::get_move_meta(move_id).is_some_and(|m| m.is_sound) {
                    input.immune_override = Some(true);
                }
            }
            "bulletproof" if !mold_breaker => {
                if crate::move_meta::get_move_meta(move_id).is_some_and(|m| m.is_ball) {
                    input.immune_override = Some(true);
                }
            }
            "overcoat" if !mold_breaker => {
                if crate::move_meta::get_move_meta(move_id).is_some_and(|m| m.is_powder) {
                    input.immune_override = Some(true);
                }
            }
            "wonderguard" if !mold_breaker => {
                let effectiveness = damage_calc::type_effectiveness_shift(
                    move_type,
                    parse_type(&defender.type1),
                    defender.type2.as_deref().map(parse_type),
                    defender.added_type.as_deref().map(parse_type),
                );
                if effectiveness <= 0 {
                    input.immune_override = Some(true);
                }
            }
            _ => {}
        }

        // Process Item Hooks
        if attacker.item.as_deref() == Some("metronome") {
            // max 5 consecutive turns = 100% boost. Each turn after the first adds 20%.
            // e.g. counter = 1 -> 4096 (1x)
            // counter = 2 -> 4915 (1.2x)
            // counter = 5 -> 8192 (2.0x)
            if attacker.consecutive_move_counter > 1 {
                let boost_pct = (attacker.consecutive_move_counter - 1) as f32 * 0.2;
                let mult = 4096.0 + (4096.0 * boost_pct);
                input.bp_modifiers.push(mult as u16);
            }
        }

        if let Some(item_meta) = attacker
            .item
            .as_deref()
            .and_then(crate::item_meta::get_item_meta)
        {
            if (item_meta.is_muscle_band && is_physical)
                || (item_meta.is_wise_glasses && !is_physical)
            {
                input.bp_modifiers.push(4505);
            } else if item_meta.is_life_orb {
                input.bp_modifiers.push(5324);
            }

            if item_meta.is_expert_belt {
                let effectiveness = damage_calc::type_effectiveness_shift(
                    move_type,
                    parse_type(&defender.type1),
                    defender.type2.as_deref().map(parse_type),
                    defender.added_type.as_deref().map(parse_type),
                );
                if effectiveness > 0 {
                    input.final_modifiers.push(4915); // 1.2x
                }
            }

            if let Some((boost_type, boost_mult)) = item_meta.type_boost
                && move_type == boost_type
            {
                input.bp_modifiers.push((boost_mult * 4096.0) as u16);
            }
        }

        if let Some(item_meta) = defender
            .item
            .as_deref()
            .and_then(crate::item_meta::get_item_meta)
            && let Some(resist_type) = item_meta.type_resist_berry
            && move_type == resist_type
            && (resist_type == damage_calc::types::Type::Normal
                || damage_calc::type_effectiveness_shift(
                    move_type,
                    parse_type(&defender.type1),
                    defender.type2.as_deref().map(parse_type),
                    defender.added_type.as_deref().map(parse_type),
                ) > 0)
        {
            input.final_modifiers.push(2048); // Halves damage
        }

        let output = calculate_input(&input);

        // Random Damage Roll
        let mut rng = rand::rng();
        let roll_index = if let Some(config) = &self.rng_config {
            if let Some(damage_roll) = &config.damage_roll {
                match damage_roll.as_str() {
                    "max" => 15,
                    "min" => 0,
                    _ => rng.random_range(0..16),
                }
            } else {
                rng.random_range(0..16)
            }
        } else {
            rng.random_range(0..16)
        };

        let roll = output.rolls.get(roll_index as usize).unwrap_or(&0);

        let mut absorbed_by = None;
        if input.immune_override == Some(true) {
            absorbed_by = defender.ability.clone();
        }

        (*roll as i32, absorbed_by)
    }
}
