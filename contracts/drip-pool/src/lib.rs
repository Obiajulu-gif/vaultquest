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

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Pool,
    Participant(Address),
}

#[derive(Clone)]
#[contracttype]
pub struct Pool {
    pub admin: Address,
    pub total_drips: u64,
    pub created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct Participant {
    pub joined_at: u64,
    pub claimable: i128,
}

#[contract]
pub struct DripPool;

#[contractimpl]
impl DripPool {
    pub fn create(env: Env, admin: Address) {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Pool) {
            panic!("pool already created");
        }
        let pool = Pool {
            admin: admin.clone(),
            total_drips: 0,
            created_at: env.ledger().timestamp(),
        };
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Pool, &pool);
    }

    pub fn join(env: Env, who: Address) {
        who.require_auth();
        let key = DataKey::Participant(who.clone());
        if env.storage().persistent().has(&key) {
            panic!("already joined");
        }
        env.storage().persistent().set(
            &key,
            &Participant {
                joined_at: env.ledger().timestamp(),
                claimable: 0,
            },
        );
    }

    pub fn drip(env: Env, who: Address, amount: i128) {
        who.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let key = DataKey::Participant(who.clone());
        let mut p: Participant = env
            .storage()
            .persistent()
            .get(&key)
            .expect("not joined");
        p.claimable += amount;
        env.storage().persistent().set(&key, &p);

        let mut pool: Pool = env.storage().instance().get(&DataKey::Pool).unwrap();
        pool.total_drips += 1;
        env.storage().instance().set(&DataKey::Pool, &pool);
    }

    pub fn claim(env: Env, who: Address) -> i128 {
        who.require_auth();
        let key = DataKey::Participant(who.clone());
        let mut p: Participant = env
            .storage()
            .persistent()
            .get(&key)
            .expect("not joined");
        let amount = p.claimable;
        p.claimable = 0;
        env.storage().persistent().set(&key, &p);
        amount
    }

    pub fn withdraw(env: Env, who: Address) {
        who.require_auth();
        env.storage()
            .persistent()
            .remove(&DataKey::Participant(who));
    }

    pub fn pool(env: Env) -> Pool {
        env.storage().instance().get(&DataKey::Pool).expect("uninitialized")
    }
}

#[cfg(test)]
mod test;
