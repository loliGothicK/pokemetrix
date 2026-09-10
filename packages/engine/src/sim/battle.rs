use pkmn_meta::types::Type;
use typed_builder::TypedBuilder;

pub use crate::sim::log::*;
pub use crate::sim::pokemon::*;
pub use crate::sim::values::*;

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
    AfterStatChange,
    EndOfTurn,
}

#[derive(TypedBuilder, Clone)]
pub struct EventContext {
    pub target: PokemonIdent,
    #[builder(default)]
    pub source: Option<PokemonIdent>,
    #[builder(default)]
    pub string_val: String,
    #[builder(default)]
    pub volatile_status_val: Option<pkmn_meta::types::VolatileStatus>,
    #[builder(default)]
    pub status_val: Option<pkmn_meta::types::Status>,
    #[builder(default)]
    pub num_val: i32,
    #[builder(default)]
    pub type_val: Option<Type>,
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

#[derive(Clone, Debug, Default)]
pub struct Side {
    pub active: Vec<Pokemon>,
    pub team: Vec<Pokemon>,
    pub tailwind: bool,
    pub tailwind_turns: u8,
    pub aurora_veil_turns: u8,
    pub reflect_turns: u8,
    pub lightscreen_turns: u8,
    pub safeguard_turns: u8,
    pub spikes: u8,
    pub toxic_spikes: u8,
    pub stealth_rock: bool,
    pub sticky_web: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TurnState {
    Ready,
    WaitingForSwitch { player: u8, pass_stats: bool },
}

#[derive(Clone, Debug)]
pub struct FutureSightAttack {
    pub target: PokemonIdent,
    pub damage: i32,
    pub turns_left: u8,
}

pub struct Battle {
    pub turn_state: TurnState,
    pub p1: Side,
    pub p2: Side,
    pub log: Vec<BattleLogEvent>,
    pub weather: Option<pkmn_meta::types::Weather>,
    pub weather_turns_left: u8,
    pub terrain: Option<pkmn_meta::types::Terrain>,
    pub terrain_turns_left: u8,
    pub trick_room: bool,
    pub magic_room_turns_left: u8,
    pub wonder_room_turns_left: u8,
    pub gravity_turns_left: u8,
    pub fairy_lock_turns: u8,
    pub global_last_move_used: Option<String>,
    pub rng_config: Option<crate::wasm_api::Config>,
    pub event_queue: std::collections::VecDeque<(EventId, EventContext)>,
    pub turn_actions: Vec<crate::sim::action::Action>,
    pub future_sight_attacks: Vec<FutureSightAttack>,
}

impl Default for Battle {
    fn default() -> Self {
        Self::new()
    }
}

impl Battle {
    pub fn get_pokemon(&self, ident: PokemonIdent) -> Option<&Pokemon> {
        if ident.player == 1 {
            self.p1.active.get(ident.slot)
        } else {
            self.p2.active.get(ident.slot)
        }
    }

    pub fn get_pokemon_mut(&mut self, ident: PokemonIdent) -> Option<&mut Pokemon> {
        if ident.player == 1 {
            self.p1.active.get_mut(ident.slot)
        } else {
            self.p2.active.get_mut(ident.slot)
        }
    }

    pub fn new() -> Self {
        Self {
            turn_state: TurnState::Ready,
            p1: Side::default(),
            p2: Side::default(),
            log: vec![],
            weather: None,
            weather_turns_left: 0,
            terrain: None,
            terrain_turns_left: 0,
            trick_room: false,
            magic_room_turns_left: 0,
            wonder_room_turns_left: 0,
            gravity_turns_left: 0,
            fairy_lock_turns: 0,
            global_last_move_used: None,
            rng_config: None,
            event_queue: std::collections::VecDeque::new(),
            turn_actions: vec![],
            future_sight_attacks: vec![],
        }
    }

    /// Applies a stat change, handling abilities like Clear Body, Simple, Contrary, Defiant, etc.
    /// Returns true if the stat was successfully changed.
    pub fn apply_stat_change(
        &mut self,
        target_player: u8,
        target_slot: usize,
        stats: Vec<(Stat, i8)>,
        source_player: u8,
        source_effect: Option<&str>,
    ) {
        for (stat, amount) in stats {
            crate::sim::sections::stat::apply_stat_change(
                self,
                target_player,
                target_slot,
                stat,
                amount,
                source_player,
                source_effect,
            );
        }
    }

    pub fn process_event_queue(&mut self) {
        while let Some((event_id, mut ctx)) = self.event_queue.pop_front() {
            self.trigger_event(event_id, &mut ctx);
        }
    }

    pub fn trigger_event(&mut self, event_id: EventId, ctx: &mut EventContext) {
        // [Phase A: Snapshot Active Handlers]
        // We collect all active items and abilities to avoid borrowing `self` during execution.
        let mut active_items = vec![];
        let mut active_abilities = vec![];

        for (i, p) in self.p1.active.iter().enumerate() {
            if p.item.is_some() {
                active_items.push((PokemonIdent { player: 1, slot: i }, p.item));
            }
            if p.ability.is_some() {
                active_abilities.push((PokemonIdent { player: 1, slot: i }, p.ability.clone()));
            }
        }

        for (i, p) in self.p2.active.iter().enumerate() {
            if p.item.is_some() {
                active_items.push((PokemonIdent { player: 2, slot: i }, p.item));
            }
            if p.ability.is_some() {
                active_abilities.push((PokemonIdent { player: 2, slot: i }, p.ability.clone()));
            }
        }

        // [Phase B: Dispatch]
        for (ident, item) in active_items {
            if let Some(item_name) = item {
                crate::sim::items::execute_item(self, ident, item_name.as_ref(), &event_id, ctx);
            }
        }

        for (ident, ability) in active_abilities {
            if let Some(ability_name) = ability {
                crate::sim::abilities::execute_ability(
                    self,
                    ident,
                    ability_name.as_str(),
                    &event_id,
                    ctx,
                );
            }
        }
    }

    pub fn section_apply_added_type(&mut self, target: PokemonIdent, added_type: Type) {
        let mut ctx = EventContext::builder()
            .target(target)
            .type_val(Some(added_type))
            .build();

        self.trigger_event(EventId::BeforeApplyAddedType, &mut ctx);

        if !ctx.canceled {
            if ctx.target.player == 1 {
                if let Some(t) = self.p1.active.get_mut(ctx.target.slot) {
                    t.added_type = ctx.type_val;
                }
            } else {
                if let Some(t) = self.p2.active.get_mut(ctx.target.slot) {
                    t.added_type = ctx.type_val;
                }
            }

            self.trigger_event(EventId::AfterApplyAddedType, &mut ctx);
        }
    }

    pub fn section_apply_volatile(
        &mut self,
        target: PokemonIdent,
        volatile: pkmn_meta::types::VolatileStatus,
    ) {
        let mut ctx = EventContext::builder()
            .target(target)
            .volatile_status_val(Some(volatile))
            .build();

        self.trigger_event(EventId::BeforeApplyVolatile, &mut ctx);

        if !ctx.canceled {
            let v_val = ctx.volatile_status_val.unwrap();
            let mut applied = false;

            if ctx.target.player == 1 {
                if let Some(t) = self.p1.active.get_mut(ctx.target.slot)
                    && !t.volatile_status.contains(&v_val)
                {
                    t.volatile_status.push(v_val);
                    if v_val == pkmn_meta::types::VolatileStatus::Partiallytrapped {
                        t.partially_trapped_turns = 5;
                    }
                    applied = true;
                }
            } else {
                if let Some(t) = self.p2.active.get_mut(ctx.target.slot)
                    && !t.volatile_status.contains(&v_val)
                {
                    t.volatile_status.push(v_val);
                    if v_val == pkmn_meta::types::VolatileStatus::Partiallytrapped {
                        t.partially_trapped_turns = 5;
                    }
                    applied = true;
                }
            }

            if applied && v_val != pkmn_meta::types::VolatileStatus::Flinch {
                self.log.push(BattleLogEvent::new(BattleLog::Start {
                    target: ctx.target,
                    effect: v_val.to_string(),
                }));
            }

            self.trigger_event(EventId::AfterApplyVolatile, &mut ctx);
        }
    }

    pub fn section_take_damage(&mut self, target: PokemonIdent, damage: i32) {
        crate::sim::sections::damage::section_take_damage(self, target, damage);
    }

    pub fn section_heal(&mut self, target: PokemonIdent, heal_amount: Hp) {
        if heal_amount > 0 {
            if let Some(p) = self.get_pokemon(target)
                && p.volatile_status
                    .contains(&pkmn_meta::types::VolatileStatus::Healblock)
            {
                return;
            }
            let mut actual_heal = 0;
            if target.player == 1 {
                if let Some(t) = self.p1.active.get_mut(target.slot) {
                    let old_hp = t.hp.into_inner();
                    t.hp = std::cmp::min(
                        t.maxhp.into_inner(),
                        t.hp.into_inner() + heal_amount.into_inner(),
                    )
                    .into();
                    actual_heal = t.hp.into_inner() - old_hp;
                }
            } else {
                if let Some(t) = self.p2.active.get_mut(target.slot) {
                    let old_hp = t.hp.into_inner();
                    t.hp = std::cmp::min(
                        t.maxhp.into_inner(),
                        t.hp.into_inner() + heal_amount.into_inner(),
                    )
                    .into();
                    actual_heal = t.hp.into_inner() - old_hp;
                }
            }

            if actual_heal > 0 {
                self.log.push(BattleLogEvent::new(BattleLog::Heal {
                    target,
                    amount: actual_heal,
                }));
            }
        }
    }

    pub fn section_apply_status(
        &mut self,
        target: PokemonIdent,
        status: pkmn_meta::types::Status,
        source: Option<PokemonIdent>,
    ) {
        if let Some(src) = source
            && src != target
        {
            let target_side = if target.player == 1 {
                &self.p1
            } else {
                &self.p2
            };
            if target_side.safeguard_turns > 0 {
                self.log.push(BattleLogEvent::new(BattleLog::Text {
                    message: format!("|-activate|{}|move: Safeguard", target),
                }));
                return;
            }
        }

        let mut ctx = EventContext::builder()
            .target(target)
            .status_val(Some(status))
            .string_val(status.to_string())
            .build();

        self.trigger_event(EventId::BeforeApplyStatus, &mut ctx);

        if !ctx.canceled {
            let s_val = ctx.status_val.unwrap();
            let mut applied = false;
            if ctx.target.player == 1 {
                if let Some(t) = self.p1.active.get_mut(ctx.target.slot)
                    && t.status.is_none()
                {
                    t.status = Some(s_val);
                    applied = true;
                }
            } else {
                if let Some(t) = self.p2.active.get_mut(ctx.target.slot)
                    && t.status.is_none()
                {
                    t.status = Some(s_val);
                    applied = true;
                }
            }
            if applied {
                let status_str = match s_val {
                    pkmn_meta::types::Status::Paralysis => "par",
                    pkmn_meta::types::Status::Burn => "brn",
                    pkmn_meta::types::Status::Frozen => "frz",
                    pkmn_meta::types::Status::Sleep => "slp",
                    pkmn_meta::types::Status::Poison => "psn",
                    pkmn_meta::types::Status::Toxic => "tox",
                }
                .to_string();
                self.log.push(crate::sim::log::BattleLogEvent::new(
                    crate::sim::log::BattleLog::StatusInflicted {
                        target: ctx.target,
                        status: status_str,
                    },
                ));
            }

            self.trigger_event(EventId::AfterApplyStatus, &mut ctx);
        }
    }

    pub fn section_consume_item(&mut self, target: PokemonIdent) {
        let mut ctx = EventContext::builder().target(target).build();

        self.trigger_event(EventId::BeforeConsumeItem, &mut ctx);

        if !ctx.canceled {
            let mut was_berry = false;
            let mut consumed_item = None;

            if ctx.target.player == 1 {
                if let Some(t) = self.p1.active.get_mut(ctx.target.slot) {
                    if let Some(i) = &t.item {
                        was_berry = i.as_ref().ends_with("berry");
                        consumed_item = Some(*i);
                    }
                    t.item = None;
                    if was_berry {
                        t.eaten_berry = true;
                    }
                }
            } else {
                if let Some(t) = self.p2.active.get_mut(ctx.target.slot) {
                    if let Some(i) = &t.item {
                        was_berry = i.as_ref().ends_with("berry");
                        consumed_item = Some(*i);
                    }
                    t.item = None;
                    if was_berry {
                        t.eaten_berry = true;
                    }
                }
            }

            if let Some(item_id) = consumed_item {
                self.log.push(BattleLogEvent::new(BattleLog::EndItem {
                    target: ctx.target,
                    item: item_id.as_ref().to_string(),
                }));
            }

            self.trigger_event(EventId::AfterConsumeItem, &mut ctx);
        }
    }

    pub fn section_cure_status(&mut self, target: PokemonIdent) {
        let ctx = EventContext::builder().target(target).build();

        if ctx.target.player == 1 {
            if let Some(t) = self.p1.active.get_mut(ctx.target.slot) {
                t.status = None;
            }
        } else {
            if let Some(t) = self.p2.active.get_mut(ctx.target.slot) {
                t.status = None;
            }
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn execute_turn(
        &mut self,
        p1_a: &str,
        p1_a_target: i8,
        p1_b: &str,
        p1_b_target: i8,
        p2_a: &str,
        p2_a_target: i8,
        p2_b: &str,
        p2_b_target: i8,
        rng_config: Option<crate::wasm_api::Config>,
    ) -> Result<(), String> {
        crate::sim::turn::execute_turn(
            self,
            p1_a,
            p1_a_target,
            p1_b,
            p1_b_target,
            p2_a,
            p2_a_target,
            p2_b,
            p2_b_target,
            rng_config,
        )
    }
    pub fn get_active_weather(&self) -> Option<pkmn_meta::types::Weather> {
        crate::sim::sections::field::get_active_weather(self)
    }

    pub fn force_switch_random(&mut self, target: PokemonIdent) {
        let (active, team) = if target.player == 1 {
            (&mut self.p1.active, &mut self.p1.team)
        } else {
            (&mut self.p2.active, &mut self.p2.team)
        };

        // Find available bench pokemon
        let mut available: Vec<usize> = Vec::new();
        for (i, p) in team.iter().enumerate() {
            if p.hp.into_inner() > 0 {
                available.push(i);
            }
        }

        if available.is_empty() {
            return; // Cannot force switch if bench is empty or fainted
        }

        // In Pokemon, roar/whirlwind etc. are random, but we will just pick the first available for simplicity,
        // since showdown's RNG is hard to sync exactly and tests use deterministic 1-bench setups.
        // Wait, actually, let's use the battle RNG to pick one.
        use rand::RngExt;
        let bench_idx = if available.len() > 1 {
            let mut rng = rand::rng();
            available[rng.random_range(0..available.len())]
        } else {
            available[0]
        };

        std::mem::swap(&mut active[target.slot], &mut team[bench_idx]);
        let prefix = if target.player == 1 { "p1" } else { "p2" };
        active[target.slot].ident =
            format!("{}{}", prefix, if target.slot == 0 { "a" } else { "b" });

        self.log
            .push(BattleLogEvent::new(BattleLog::Drag { target }));

        self.run_switch_in(target.player, target.slot);
    }

    pub fn run_switch_in(&mut self, player: u8, slot: usize) {
        crate::sim::sections::switch::run_switch_in(self, player, slot);
    }
    pub fn check_speed_modifiers(
        &self,
        pkmn: &Pokemon,
        speed: crate::sim::values::Speed,
    ) -> crate::sim::values::Speed {
        crate::sim::turn_order::TurnOrderResolver::new(self).check_speed_modifiers(pkmn, speed)
    }
}
