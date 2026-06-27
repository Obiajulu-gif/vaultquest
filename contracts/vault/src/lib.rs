#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol,
};

// ─────────────────────────────────────────────
// Storage key types
// ─────────────────────────────────────────────
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    IsPaused,
    Balance(Address),
    TotalDeposits,
}

// ─────────────────────────────────────────────
// Error codes
// ─────────────────────────────────────────────
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum VaultError {
    NotAdmin       = 1,
    AlreadyPaused  = 2,
    NotPaused      = 3,
    ProtocolPaused = 4,
    ZeroAmount     = 5,
    InsufficientBalance = 6,
    NotInitialized = 7,
}

impl From<VaultError> for soroban_sdk::Error {
    fn from(e: VaultError) -> Self {
        soroban_sdk::Error::from_contract_error(e as u32)
    }
}

// ─────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────
const PAUSED_TOPIC: Symbol = symbol_short!("PAUSED");
const UNPAUSED_TOPIC: Symbol = symbol_short!("UNPAUSED");
const DEPOSIT_TOPIC: Symbol = symbol_short!("DEPOSIT");
const WITHDRAW_TOPIC: Symbol = symbol_short!("WITHDRAW");
const WINNER_TOPIC: Symbol = symbol_short!("WINNER");

// ─────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────
#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    // ── Initialisation ──────────────────────
    /// Must be called once after deployment to set the admin.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialised");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::IsPaused, &false);
        env.storage().instance().set(&DataKey::TotalDeposits, &0_i128);
    }

    // ── Internal helpers ────────────────────
    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(env, VaultError::NotInitialized));
        admin.require_auth();
    }

    fn is_paused(env: &Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::IsPaused)
            .unwrap_or(false)
    }

    fn require_not_paused(env: &Env) {
        if Self::is_paused(env) {
            panic_with_error!(env, VaultError::ProtocolPaused);
        }
    }

    // ── Circuit-breaker admin functions ─────

    /// Pause the protocol.  Only callable by the admin.
    /// deposit() and draw_winner() will revert while paused.
    /// withdraw() is unaffected so users can always retrieve funds.
    pub fn pause_protocol(env: Env) {
        Self::require_admin(&env);
        if Self::is_paused(&env) {
            panic_with_error!(env, VaultError::AlreadyPaused);
        }
        env.storage().instance().set(&DataKey::IsPaused, &true);
        env.events().publish((PAUSED_TOPIC,), ());
    }

    /// Unpause the protocol.  Only callable by the admin.
    pub fn unpause_protocol(env: Env) {
        Self::require_admin(&env);
        if !Self::is_paused(&env) {
            panic_with_error!(env, VaultError::NotPaused);
        }
        env.storage().instance().set(&DataKey::IsPaused, &false);
        env.events().publish((UNPAUSED_TOPIC,), ());
    }

    /// Returns the current pause state.
    pub fn get_paused(env: Env) -> bool {
        Self::is_paused(&env)
    }

    // ── Core vault functions ─────────────────

    /// Deposit `amount` tokens into the vault.
    /// REVERTS when the protocol is paused.
    pub fn deposit(env: Env, depositor: Address, amount: i128) {
        Self::require_not_paused(&env);
        depositor.require_auth();

        if amount <= 0 {
            panic_with_error!(env, VaultError::ZeroAmount);
        }

        let key = DataKey::Balance(depositor.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(current + amount));

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalDeposits)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalDeposits, &(total + amount));

        env.events().publish((DEPOSIT_TOPIC,), (depositor, amount));
    }

    /// Withdraw `amount` tokens from the vault.
    /// ALWAYS available — intentionally NOT gated by is_paused so that
    /// users can recover their underlying deposits even during an emergency.
    pub fn withdraw(env: Env, depositor: Address, amount: i128) {
        // NOTE: no require_not_paused() call here — by design.
        depositor.require_auth();

        if amount <= 0 {
            panic_with_error!(env, VaultError::ZeroAmount);
        }

        let key = DataKey::Balance(depositor.clone());
        let current: i128 = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(0);

        if current < amount {
            panic_with_error!(env, VaultError::InsufficientBalance);
        }

        env.storage().persistent().set(&key, &(current - amount));

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalDeposits)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalDeposits, &(total - amount));

        env.events()
            .publish((WITHDRAW_TOPIC,), (depositor, amount));
    }

    /// Select a draw winner.
    /// REVERTS when the protocol is paused.
    pub fn draw_winner(env: Env, winner: Address) {
        Self::require_not_paused(&env);
        Self::require_admin(&env);
        env.events().publish((WINNER_TOPIC,), winner);
    }

    /// Read a depositor's balance.
    pub fn balance_of(env: Env, depositor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(depositor))
            .unwrap_or(0)
    }

    /// Read total deposits across all users.
    pub fn total_deposits(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalDeposits)
            .unwrap_or(0)
    }
}

// ─────────────────────────────────────────────
// Unit tests
// ─────────────────────────────────────────────
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, VaultContractClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, VaultContract);
        let client = VaultContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        client.initialize(&admin);
        (env, client, admin, user)
    }

    // ── pause_protocol access control ────────

    #[test]
    fn test_admin_can_pause() {
        let (_env, client, _admin, _user) = setup();
        client.pause_protocol();
        assert!(client.get_paused());
    }

    #[test]
    #[should_panic]
    fn test_non_admin_cannot_pause() {
        let (env, client, _admin, _user) = setup();
        // Remove mock auths so the non-admin call fails auth check.
        // In practice the require_auth() on the admin address will panic.
        env.set_auths(&[]);
        client.pause_protocol();
    }

    #[test]
    #[should_panic(expected = "AlreadyPaused")]
    fn test_double_pause_reverts() {
        let (_env, client, _admin, _user) = setup();
        client.pause_protocol();
        client.pause_protocol(); // should panic
    }

    // ── unpause_protocol access control ──────

    #[test]
    fn test_admin_can_unpause() {
        let (_env, client, _admin, _user) = setup();
        client.pause_protocol();
        client.unpause_protocol();
        assert!(!client.get_paused());
    }

    #[test]
    #[should_panic(expected = "NotPaused")]
    fn test_unpause_when_not_paused_reverts() {
        let (_env, client, _admin, _user) = setup();
        client.unpause_protocol(); // should panic — never paused
    }

    // ── deposit gated by pause ────────────────

    #[test]
    fn test_deposit_works_when_not_paused() {
        let (_env, client, _admin, user) = setup();
        client.deposit(&user, &100);
        assert_eq!(client.balance_of(&user), 100);
    }

    #[test]
    #[should_panic(expected = "ProtocolPaused")]
    fn test_deposit_reverts_when_paused() {
        let (_env, client, _admin, user) = setup();
        client.pause_protocol();
        client.deposit(&user, &100); // should panic
    }

    // ── withdraw NOT gated by pause ───────────

    #[test]
    fn test_withdraw_works_when_paused() {
        let (_env, client, _admin, user) = setup();
        client.deposit(&user, &100);
        client.pause_protocol();
        // withdraw must succeed even while paused
        client.withdraw(&user, &100);
        assert_eq!(client.balance_of(&user), 0);
    }

    #[test]
    fn test_withdraw_works_when_not_paused() {
        let (_env, client, _admin, user) = setup();
        client.deposit(&user, &200);
        client.withdraw(&user, &50);
        assert_eq!(client.balance_of(&user), 150);
    }

    #[test]
    #[should_panic(expected = "InsufficientBalance")]
    fn test_withdraw_more_than_balance_reverts() {
        let (_env, client, _admin, user) = setup();
        client.deposit(&user, &50);
        client.withdraw(&user, &100); // should panic
    }

    // ── draw_winner gated by pause ────────────

    #[test]
    fn test_draw_winner_works_when_not_paused() {
        let (_env, client, _admin, user) = setup();
        client.draw_winner(&user); // no panic expected
    }

    #[test]
    #[should_panic(expected = "ProtocolPaused")]
    fn test_draw_winner_reverts_when_paused() {
        let (_env, client, _admin, user) = setup();
        client.pause_protocol();
        client.draw_winner(&user); // should panic
    }

    // ── total_deposits accounting ─────────────

    #[test]
    fn test_total_deposits_tracks_correctly() {
        let (_env, client, _admin, user) = setup();
        client.deposit(&user, &300);
        assert_eq!(client.total_deposits(), 300);
        client.withdraw(&user, &100);
        assert_eq!(client.total_deposits(), 200);
    }
}
