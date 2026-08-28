use deriving_via::DerivingVia;
use std::cmp::Ordering;
use std::ops::{Add, Div, Mul, Sub};

#[derive(DerivingVia)]
#[deriving(Copy, Debug, From, IntoInner, Serialize(via: i32), Deserialize(via: i32), Eq, Ord)]
pub struct Hp(i32);

impl From<MaxHp> for Hp {
    fn from(value: MaxHp) -> Self {
        Hp(value.0)
    }
}

impl Add<i32> for Hp {
    type Output = Hp;
    fn add(self, rhs: i32) -> Self::Output {
        Hp(self.0 + rhs)
    }
}

impl Sub<i32> for Hp {
    type Output = Hp;
    fn sub(self, rhs: i32) -> Self::Output {
        Hp(self.0 - rhs)
    }
}

impl Mul<i32> for Hp {
    type Output = Hp;
    fn mul(self, rhs: i32) -> Self::Output {
        Hp(self.0 * rhs)
    }
}

impl Div<i32> for Hp {
    type Output = Hp;
    fn div(self, rhs: i32) -> Self::Output {
        Hp(self.0 / rhs)
    }
}

impl PartialEq<i32> for Hp {
    fn eq(&self, other: &i32) -> bool {
        self.0 == *other
    }
}

impl PartialOrd<i32> for Hp {
    fn partial_cmp(&self, other: &i32) -> Option<Ordering> {
        self.0.partial_cmp(other)
    }
}

#[derive(DerivingVia)]
#[deriving(Copy, Debug, From, IntoInner, Serialize(via: i32), Deserialize(via: i32), Eq, Ord)]
pub struct MaxHp(i32);

impl Div<i32> for MaxHp {
    type Output = MaxHp;
    fn div(self, rhs: i32) -> Self::Output {
        MaxHp(self.0 / rhs)
    }
}

impl PartialEq<Hp> for MaxHp {
    fn eq(&self, other: &Hp) -> bool {
        self.0 == other.0
    }
}

impl PartialOrd<Hp> for MaxHp {
    fn partial_cmp(&self, other: &Hp) -> Option<Ordering> {
        self.0.partial_cmp(&other.0)
    }
}

impl PartialEq<MaxHp> for Hp {
    fn eq(&self, other: &MaxHp) -> bool {
        self.0 == other.0
    }
}

impl PartialOrd<MaxHp> for Hp {
    fn partial_cmp(&self, other: &MaxHp) -> Option<Ordering> {
        self.0.partial_cmp(&other.0)
    }
}

#[inline]
pub fn apply_stat_boost(stat: i32, stage: i8) -> i32 {
    let stage = stage.clamp(-6, 6) as i32;
    if stage >= 0 {
        stat * (2 + stage) / 2
    } else {
        stat * 2 / (2 - stage)
    }
}

macro_rules! impl_stat_wrapper {
    ($t:ident, $boost_t:ident) => {
        #[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, DerivingVia)]
        #[deriving(From, IntoInner)]
        pub struct $t(i32);

        impl $t {
            pub fn apply_boost(self, boost: pkmn_meta::$boost_t) -> Self {
                Self(apply_stat_boost(self.into_inner(), boost.into_inner()))
            }
            pub fn poke_mul(self, modifier: f32) -> Self {
                let mod_val = (modifier * 4096.0).trunc() as u32;
                Self(damage_calc::poke_round_div_4096(self.0 as u64 * mod_val as u64) as i32)
            }
        }
        impl std::ops::Mul<f32> for $t {
            type Output = Self;
            fn mul(self, rhs: f32) -> Self::Output {
                self.poke_mul(rhs)
            }
        }
        impl std::ops::Div<i32> for $t {
            type Output = Self;
            fn div(self, rhs: i32) -> Self::Output {
                Self(self.0 / rhs)
            }
        }
    };
}

impl_stat_wrapper!(Speed, Spe);
impl_stat_wrapper!(Attack, Atk);
impl_stat_wrapper!(Defense, Def);
impl_stat_wrapper!(SpecialAttack, Spa);
impl_stat_wrapper!(SpecialDefense, Apd);

#[derive(DerivingVia)]
#[deriving(Clone, Debug, Display(via: String), From, IntoInner, Serialize, Deserialize, PartialEq)]
pub struct Ability(String);

#[derive(DerivingVia)]
#[deriving(Copy, Debug, From, IntoInner, Serialize, Deserialize, PartialEq)]
pub struct Weight(u32);
