#![no_std]

//! Drip pool contract — hardened with multi-sig admin controls (#140),
//! reentrancy lock guards and lockup enforcement (#139).

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, vec, Address, Env, Vec,
};

// ── Lockup duration (ledgers, ~7 days at 5 s/ledger) ──────────────────────
const LOCKUP_LEDGERS: u32 = 120_960;
// ── Multi-sig threshold: 2-of-N ───────────────────────────────────────────
const SIG_THRESHOLD: u32 = 2;

// ── Storage keys ──────────────────────────────────────────────────────────
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Admins,          // Vec<Address> — approved signers
    Pool,
    Participant(Address),
    Locked,          // reentrancy guard
    Proposal(u32),   // pending admin proposal
    ProposalNonce,   // monotonic counter
}

// ── Errors ─────────────────────────────────────────────────────────────────
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized     = 2,
    AlreadyJoined      = 3,
    NotJoined          = 4,
    InvalidAmount      = 5,
    Locked             = 6,   // reentrancy
    LockupActive       = 7,   // withdrawal before lockup ends
    Unauthorized       = 8,   // not an approved signer
    ThresholdNotMet    = 9,   // not enough signatures
    AlreadySigned      = 10,  // signer already approved this proposal
    ProposalNotFound   = 11,
}

// ── Structs ────────────────────────────────────────────────────────────────
#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Pool {
    pub admin: Address,
    pub total_drips: u64,
    pub total_deposited: i128,
    pub created_at: u64,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Participant {
    pub joined_at: u64,
    pub deposited: i128,
    pub claimable: i128,
    pub locked_until: u32, // ledger sequence
}

/// A pending admin action that requires multi-sig approval.
#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Proposal {
    pub action: ProposalAction,
    pub approvals: Vec<Address>,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub enum ProposalAction {
    ReleaseEscrow(Address, i128), // recipient, amount
    AddAdmin(Address),
    RemoveAdmin(Address),
}

// ── Contract ───────────────────────────────────────────────────────────────
#[contract]
pub struct DripPool;

#[contractimpl]
impl DripPool {
    // ── Reentrancy helpers ─────────────────────────────────────────────────
    fn acquire_lock(env: &Env) -> Result<(), Error> {
        if env.storage().instance().get::<_, bool>(&DataKey::Locked).unwrap_or(false) {
            return Err(Error::Locked);
        }
        env.storage().instance().set(&DataKey::Locked, &true);
        Ok(())
    }

    fn release_lock(env: &Env) {
        env.storage().instance().set(&DataKey::Locked, &false);
    }

    // ── Multi-sig helpers ──────────────────────────────────────────────────
    fn require_signer(env: &Env, signer: &Address) -> Result<(), Error> {
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Admins)
            .unwrap_or(vec![env]);
        if !admins.contains(signer) {
            return Err(Error::Unauthorized);
        }
        Ok(())
    }

    // ── Initialise ─────────────────────────────────────────────────────────
    pub fn create(env: Env, admin: Address) -> Result<(), Error> {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Pool) {
            return Err(Error::AlreadyInitialized);
        }
        let pool = Pool {
            admin: admin.clone(),
            total_drips: 0,
            total_deposited: 0,
            created_at: env.ledger().timestamp(),
        };
        // Bootstrap: first admin is the sole signer until more are added.
        let admins: Vec<Address> = vec![&env, admin.clone()];
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Admins, &admins);
        env.storage().instance().set(&DataKey::Pool, &pool);
        env.storage().instance().set(&DataKey::ProposalNonce, &0u32);
        env.events().publish(
            (symbol_short!("pool"), symbol_short!("created")),
            admin,
        );
        Ok(())
    }

    // ── Multi-sig: propose an admin action ─────────────────────────────────
    /// Any approved signer can open a proposal; they automatically cast the
    /// first approval.
    pub fn propose(env: Env, signer: Address, action: ProposalAction) -> Result<u32, Error> {
        signer.require_auth();
        Self::require_signer(&env, &signer)?;

        let nonce: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalNonce)
            .unwrap_or(0);
        let proposal = Proposal {
            action,
            approvals: vec![&env, signer],
        };
        env.storage()
            .instance()
            .set(&DataKey::Proposal(nonce), &proposal);
        env.storage()
            .instance()
            .set(&DataKey::ProposalNonce, &(nonce + 1));
        Ok(nonce)
    }

    /// Approve an existing proposal. Executes automatically when threshold met.
    pub fn approve(env: Env, signer: Address, proposal_id: u32) -> Result<bool, Error> {
        signer.require_auth();
        Self::require_signer(&env, &signer)?;

        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;

        if proposal.approvals.contains(&signer) {
            return Err(Error::AlreadySigned);
        }
        proposal.approvals.push_back(signer);

        let threshold_met = proposal.approvals.len() >= SIG_THRESHOLD;
        if threshold_met {
            Self::execute_proposal(&env, &proposal)?;
            env.storage()
                .instance()
                .remove(&DataKey::Proposal(proposal_id));
        } else {
            env.storage()
                .instance()
                .set(&DataKey::Proposal(proposal_id), &proposal);
        }
        Ok(threshold_met)
    }

    fn execute_proposal(env: &Env, proposal: &Proposal) -> Result<(), Error> {
        match proposal.action.clone() {
            ProposalAction::AddAdmin(addr) => {
                let mut admins: Vec<Address> = env
                    .storage()
                    .instance()
                    .get(&DataKey::Admins)
                    .unwrap_or(vec![env]);
                if !admins.contains(&addr) {
                    admins.push_back(addr);
                    env.storage().instance().set(&DataKey::Admins, &admins);
                }
            }
            ProposalAction::RemoveAdmin(addr) => {
                let admins: Vec<Address> = env
                    .storage()
                    .instance()
                    .get(&DataKey::Admins)
                    .unwrap_or(vec![env]);
                let mut new_admins: Vec<Address> = Vec::new(env);
                for a in admins.iter() {
                    if a != addr {
                        new_admins.push_back(a);
                    }
                }
                env.storage().instance().set(&DataKey::Admins, &new_admins);
            }
            ProposalAction::ReleaseEscrow(_recipient, _amount) => {
                // Real token transfer would go here once a token address is
                // stored in Pool. State is updated first (CEI pattern).
                let mut pool: Pool = env
                    .storage()
                    .instance()
                    .get(&DataKey::Pool)
                    .ok_or(Error::NotInitialized)?;
                pool.total_deposited = pool.total_deposited.saturating_sub(_amount);
                env.storage().instance().set(&DataKey::Pool, &pool);
                // token_client.transfer(&env.current_contract_address(), &_recipient, &_amount);
            }
        }
        Ok(())
    }

    // ── Join ───────────────────────────────────────────────────────────────
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
                deposited: 0,
                claimable: 0,
                locked_until: env.ledger().sequence() + LOCKUP_LEDGERS,
            },
        );
        env.events()
            .publish((symbol_short!("pool"), symbol_short!("joined")), who);
        Ok(())
    }

    // ── Deposit / drip ─────────────────────────────────────────────────────
    pub fn drip(env: Env, who: Address, amount: i128) -> Result<(), Error> {
        Self::deposit(env, who, amount)
    }

    pub fn deposit(env: Env, who: Address, amount: i128) -> Result<(), Error> {
        who.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // ── Checks ──
        let key = DataKey::Participant(who.clone());
        let mut p: Participant = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(Participant {
                joined_at: env.ledger().timestamp(),
                deposited: 0,
                claimable: 0,
                locked_until: env.ledger().sequence() + LOCKUP_LEDGERS,
            });

        // ── Effects ──
        p.deposited += amount;
        p.claimable += amount;
        env.storage().persistent().set(&key, &p);

        let mut pool: Pool = env
            .storage()
            .instance()
            .get(&DataKey::Pool)
            .ok_or(Error::NotInitialized)?;
        pool.total_drips += 1;
        pool.total_deposited += amount;
        env.storage().instance().set(&DataKey::Pool, &pool);

        // ── Interactions (token transfer would go here) ──
        env.events().publish(
            (symbol_short!("pool"), symbol_short!("deposit")),
            (who, amount),
        );
        Ok(())
    }

    // ── Claim ──────────────────────────────────────────────────────────────
    pub fn claim(env: Env, who: Address) -> Result<i128, Error> {
        Self::claim_reward(env, who)
    }

    pub fn claim_reward(env: Env, who: Address) -> Result<i128, Error> {
        who.require_auth();

        // ── Checks ──
        let key = DataKey::Participant(who.clone());
        let mut p: Participant = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotJoined)?;

        // ── Effects (before any interaction) ──
        let amount = p.claimable;
        p.claimable = 0;
        env.storage().persistent().set(&key, &p);

        // ── Interactions ──
        env.events().publish(
            (symbol_short!("pool"), symbol_short!("claimed")),
            (who, amount),
        );
        Ok(amount)
    }

    // ── Withdraw ───────────────────────────────────────────────────────────
    pub fn withdraw(env: Env, who: Address) -> Result<i128, Error> {
        who.require_auth();

        // ── Checks ──
        let key = DataKey::Participant(who.clone());
        let p: Participant = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotJoined)?;

        // Lockup guard (#139)
        if env.ledger().sequence() < p.locked_until {
            return Err(Error::LockupActive);
        }

        // Reentrancy lock (#139)
        Self::acquire_lock(&env)?;

        // ── Effects ──
        let amount = p.deposited;
        env.storage().persistent().remove(&key);

        // ── Interactions ──
        // token_client.transfer(&env.current_contract_address(), &who, &amount);

        Self::release_lock(&env);

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("withdrawn")),
            (who, amount),
        );
        Ok(amount)
    }

    // ── Views ──────────────────────────────────────────────────────────────
    pub fn pool(env: Env) -> Result<Pool, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Pool)
            .ok_or(Error::NotInitialized)
    }

    pub fn savings(env: Env, who: Address) -> Result<Participant, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Participant(who))
            .ok_or(Error::NotJoined)
    }

    pub fn admins(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Admins)
            .unwrap_or(vec![&env])
    }
}

#[cfg(test)]
mod test;
