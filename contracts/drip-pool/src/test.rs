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
fn create_twice_fails() {
    let (_env, client, admin) = setup();
    client.create(&admin);
    let res = client.try_create(&admin);
    assert_eq!(res, Err(Ok(Error::AlreadyInitialized)));
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
fn double_join_fails() {
    let (env, client, admin) = setup();
    client.create(&admin);
    let alice = Address::generate(&env);
    client.join(&alice);
    let res = client.try_join(&alice);
    assert_eq!(res, Err(Ok(Error::AlreadyJoined)));
}

#[test]
fn drip_zero_amount_fails() {
    let (env, client, admin) = setup();
    client.create(&admin);
    let alice = Address::generate(&env);
    client.join(&alice);
    let res = client.try_drip(&alice, &0);
    assert_eq!(res, Err(Ok(Error::InvalidAmount)));
}

#[test]
fn drip_without_join_fails() {
    let (env, client, admin) = setup();
    client.create(&admin);
    let alice = Address::generate(&env);
    let res = client.try_drip(&alice, &10);
    assert_eq!(res, Err(Ok(Error::NotJoined)));
}

#[test]
fn withdraw_without_join_fails() {
    let (env, client, admin) = setup();
    client.create(&admin);
    let alice = Address::generate(&env);
    let res = client.try_withdraw(&alice);
    assert_eq!(res, Err(Ok(Error::NotJoined)));
}

#[test]
fn pool_uninitialized_fails() {
    let (_env, client, _admin) = setup();
    let res = client.try_pool();
    assert_eq!(res, Err(Ok(Error::NotInitialized)));
}
