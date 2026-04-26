//! End-to-end lifecycle harness (#26).
//!
//! Exercises every public method against a registered contract instance
//! so the integration test workflow has a real fixture to anchor on.
//! As issues #10 / #11 / #12 fill in real semantics, additional cases
//! land here and stay reproducible across runs.

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env};

fn setup() -> (Env, DripPoolClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register_contract(None, DripPool);
    let client = DripPoolClient::new(&env, &id);
    let admin = Address::generate(&env);
    (env, client, admin)
}

#[test]
fn create_initialises_pool() {
    let (_env, client, admin) = setup();
    client.create(&admin);
    let pool = client.pool();
    assert_eq!(pool.admin, admin);
    assert_eq!(pool.total_drips, 0);
}

#[test]
#[should_panic(expected = "pool already created")]
fn create_twice_panics() {
    let (_env, client, admin) = setup();
    client.create(&admin);
    client.create(&admin);
}

#[test]
fn full_lifecycle_create_join_drip_claim_withdraw() {
    let (env, client, admin) = setup();
    client.create(&admin);

    let alice = Address::generate(&env);
    client.join(&alice);
    client.drip(&alice, &10);
    client.drip(&alice, &5);

    let pool = client.pool();
    assert_eq!(pool.total_drips, 2);

    let claimed = client.claim(&alice);
    assert_eq!(claimed, 15);

    let claimed_again = client.claim(&alice);
    assert_eq!(claimed_again, 0);

    client.withdraw(&alice);
}

#[test]
#[should_panic(expected = "already joined")]
fn double_join_panics() {
    let (env, client, admin) = setup();
    client.create(&admin);
    let alice = Address::generate(&env);
    client.join(&alice);
    client.join(&alice);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn drip_zero_amount_panics() {
    let (env, client, admin) = setup();
    client.create(&admin);
    let alice = Address::generate(&env);
    client.join(&alice);
    client.drip(&alice, &0);
}

#[test]
#[should_panic(expected = "not joined")]
fn drip_without_join_panics() {
    let (env, client, admin) = setup();
    client.create(&admin);
    let alice = Address::generate(&env);
    client.drip(&alice, &10);
}
