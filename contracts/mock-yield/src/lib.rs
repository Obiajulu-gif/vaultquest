#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TotalYield,
    PoolYield(Address),
}

#[contract]
pub struct MockYield;

#[contractimpl]
impl MockYield {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalYield, &0_i128);
    }

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();
    }

    pub fn simulate_yield(env: Env, pool: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let pool_key = DataKey::PoolYield(pool.clone());
        let current_pool: i128 = env.storage().persistent().get(&pool_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&pool_key, &(current_pool + amount));

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalYield)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalYield, &(total + amount));

        env.events().publish(
            (symbol_short!("yield"), symbol_short!("simulated")),
            (pool, amount, total + amount),
        );
    }

    pub fn set_yield(env: Env, pool: Address, amount: i128) {
        Self::require_admin(&env);
        if amount < 0 {
            panic!("amount must be non-negative");
        }

        let pool_key = DataKey::PoolYield(pool.clone());
        let previous: i128 = env.storage().persistent().get(&pool_key).unwrap_or(0);
        env.storage().persistent().set(&pool_key, &amount);

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalYield)
            .unwrap_or(0);
        let adjusted = total - previous + amount;
        env.storage()
            .instance()
            .set(&DataKey::TotalYield, &adjusted);

        env.events().publish(
            (symbol_short!("yield"), symbol_short!("set")),
            (pool, previous, amount, adjusted),
        );
    }

    pub fn total_yield(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalYield)
            .unwrap_or(0)
    }

    pub fn pool_yield(env: Env, pool: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::PoolYield(pool))
            .unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, MockYieldClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, MockYield);
        let client = MockYieldClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        (env, client, admin)
    }

    #[test]
    fn test_initialize() {
        let (_env, client, _admin) = setup();
        assert_eq!(client.total_yield(), 0);
    }

    #[test]
    fn test_simulate_yield() {
        let (_env, client, _admin) = setup();
        let pool = Address::generate(&_env);
        client.simulate_yield(&pool, &1000);
        assert_eq!(client.pool_yield(&pool), 1000);
        assert_eq!(client.total_yield(), 1000);
    }

    #[test]
    fn test_multiple_simulations_accumulate() {
        let (_env, client, _admin) = setup();
        let pool = Address::generate(&_env);
        client.simulate_yield(&pool, &500);
        client.simulate_yield(&pool, &300);
        assert_eq!(client.pool_yield(&pool), 800);
        assert_eq!(client.total_yield(), 800);
    }

    #[test]
    fn test_yield_tracked_per_pool() {
        let (_env, client, _admin) = setup();
        let pool_a = Address::generate(&_env);
        let pool_b = Address::generate(&_env);
        client.simulate_yield(&pool_a, &100);
        client.simulate_yield(&pool_b, &200);
        client.simulate_yield(&pool_a, &50);
        assert_eq!(client.pool_yield(&pool_a), 150);
        assert_eq!(client.pool_yield(&pool_b), 200);
        assert_eq!(client.total_yield(), 350);
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_zero_amount_reverts() {
        let (_env, client, _admin) = setup();
        let pool = Address::generate(&_env);
        client.simulate_yield(&pool, &0);
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_negative_amount_reverts() {
        let (_env, client, _admin) = setup();
        let pool = Address::generate(&_env);
        client.simulate_yield(&pool, &(-100));
    }

    #[test]
    fn test_set_yield_overwrites() {
        let (_env, client, _admin) = setup();
        let pool = Address::generate(&_env);
        client.simulate_yield(&pool, &500);
        client.set_yield(&pool, &200);
        assert_eq!(client.pool_yield(&pool), 200);
        assert_eq!(client.total_yield(), 200);
    }

    #[test]
    fn test_set_yield_to_zero() {
        let (_env, client, _admin) = setup();
        let pool = Address::generate(&_env);
        client.simulate_yield(&pool, &500);
        client.set_yield(&pool, &0);
        assert_eq!(client.pool_yield(&pool), 0);
        assert_eq!(client.total_yield(), 0);
    }

    #[test]
    fn test_get_admin() {
        let (_env, client, admin) = setup();
        assert_eq!(client.get_admin(), admin);
    }

    #[test]
    fn test_multiple_pools_set_yield() {
        let (_env, client, _admin) = setup();
        let pool_a = Address::generate(&_env);
        let pool_b = Address::generate(&_env);
        client.set_yield(&pool_a, &100);
        client.set_yield(&pool_b, &200);
        assert_eq!(client.total_yield(), 300);
        client.set_yield(&pool_a, &50);
        assert_eq!(client.total_yield(), 250);
    }

    #[test]
    #[should_panic]
    fn test_set_yield_negative_reverts() {
        let (_env, client, _admin) = setup();
        let pool = Address::generate(&_env);
        client.set_yield(&pool, &(-1));
    }
}
