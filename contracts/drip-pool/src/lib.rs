#![no_std]

//! Drip pool contract scaffold (#26, #27).
//!
//! This is the placeholder skeleton that the issues from the contract
//! backlog (#10, #11, #12) will fill in. It exists today so:
//!
//! - The integration harness in `tests/lifecycle.rs` has a real `wasm32`
//!   target to compile and exercise.
//! - Issue #27 has a measurable baseline cost profile via the
//!   `scripts/measure_costs.sh` runner — the numbers in
//!   `docs/CONTRACT_COSTS.md` move as the real implementation lands.
//!
//! The public API mirrors the lifecycle that the issue acceptance
//! criteria require: `create`, `join`, `drip`, `claim`, `withdraw`. Each
//! is intentionally minimal — enough to prove the harness wires up
//! end-to-end without prejudging the eventual storage layout.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Pool,
    Participant(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AlreadyJoined = 3,
    NotJoined = 4,
    InvalidAmount = 5,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Pool {
    pub admin: Address,
    pub total_drips: u64,
    pub created_at: u64,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Participant {
    pub joined_at: u64,
    pub claimable: i128,
}

#[contract]
pub struct DripPool;

#[contractimpl]
impl DripPool {
    pub fn create(env: Env, admin: Address) -> Result<(), Error> {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Pool) {
            return Err(Error::AlreadyInitialized);
        }
        let pool = Pool {
            admin: admin.clone(),
            total_drips: 0,
            created_at: env.ledger().timestamp(),
        };
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Pool, &pool);

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("created")),
            admin,
        );
        Ok(())
    }

    pub fn join(env: Env, who: Address) -> Result<(), Error> {
        who.require_auth();
        let key = DataKey::Participant(who.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyJoined);
        }
        env.storage().persistent().set(
            &key,
            &Participant {
                joined_at: env.ledger().timestamp(),
                claimable: 0,
            },
        );

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("joined")),
            who,
        );
        Ok(())
    }

    pub fn drip(env: Env, who: Address, amount: i128) -> Result<(), Error> {
        who.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let key = DataKey::Participant(who.clone());
        let mut p: Participant = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotJoined)?;
        
        p.claimable += amount;
        env.storage().persistent().set(&key, &p);

        let mut pool: Pool = env
            .storage()
            .instance()
            .get(&DataKey::Pool)
            .ok_or(Error::NotInitialized)?;
        
        pool.total_drips += 1;
        env.storage().instance().set(&DataKey::Pool, &pool);

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("dripped")),
            (who, amount),
        );
        Ok(())
    }

    pub fn claim(env: Env, who: Address) -> Result<i128, Error> {
        who.require_auth();
        let key = DataKey::Participant(who.clone());
        let mut p: Participant = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotJoined)?;
        
        let amount = p.claimable;
        p.claimable = 0;
        env.storage().persistent().set(&key, &p);

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("claimed")),
            (who, amount),
        );
        Ok(amount)
    }

    pub fn withdraw(env: Env, who: Address) -> Result<(), Error> {
        who.require_auth();
        let key = DataKey::Participant(who.clone());
        if !env.storage().persistent().has(&key) {
            return Err(Error::NotJoined);
        }
        env.storage().persistent().remove(&key);

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("withdrawn")),
            who,
        );
        Ok(())
    }

    pub fn pool(env: Env) -> Result<Pool, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Pool)
            .ok_or(Error::NotInitialized)
    }
}

#[cfg(test)]
mod test;
