# Soroban Contract Specification for Drip Wave (#9)

This document specifies the Soroban contract architecture for the Drip Wave savings pool system, translating the Solidity-based Vault contract into a Soroban-native implementation. It covers the data model, storage schema, function interfaces, event strategy, and contract-level invariants.

## Overview

Drip Wave is a savings pool where participants deposit tokens for a fixed duration. At the end of the period, one winner is randomly selected to receive all accrued interest, while other participants receive their principal back. This creates an incentive for saving with a lottery element.

## Data Model

### Pool (Vault)
A pool represents a single savings vault with the following properties:
- `id`: Unique identifier (u64)
- `name`: Human-readable name (String, max 100 chars)
- `token`: Address of the token contract (Address) - supports both native XLM and SAC tokens
- `admin`: Address of the pool administrator (Address)
- `total_deposits`: Total amount deposited (i128)
- `creation_time`: Ledger timestamp when pool was created (u64)
- `duration`: Duration in seconds (u64)
- `interest_rate`: Annual interest rate in basis points (u32, e.g., 500 = 5%)
- `active`: Whether the pool is active (bool)
- `winner_selected`: Whether a winner has been chosen (bool)
- `winner`: Address of the selected winner (Option<Address>)
- `depositors`: List of participant addresses (Vec<Address>)
- `deposits`: Mapping of participant to their deposit amount (Map<Address, i128>)
- `claimable_amounts`: Mapping of participant to claimable amount after winner selection (Map<Address, i128>)

### Participant
- `address`: Participant address (Address)
- `deposit_amount`: Amount deposited (i128)
- `joined_at`: Ledger timestamp when joined (u64)

## Storage Schema

### Instance Storage
- `Admin`: Global admin address (Address)
- `PoolCount`: Total number of pools created (u64)
- `Pool(u64)`: Pool data for each pool ID

### Persistent Storage
- `Deposits(u64, Address)`: Deposit amount for participant in pool (i128)
- `Claimable(u64, Address)`: Claimable amount after winner selection (i128)
- `Depositors(u64)`: List of depositors for pool (Vec<Address>)

### Temporary Storage (if needed for optimization)
- `PendingClaims(u64, Address)`: Temporary claimable amounts during winner selection

## Function Interfaces

### Administrative Functions

#### `initialize(admin: Address)`
- Initializes the contract with the global admin.
- Requires auth from admin.
- Sets `Admin` in instance storage.
- Can only be called once.

#### `create_pool(name: String, token: Address, duration: u64, interest_rate: u32)`
- Creates a new pool.
- Requires auth from admin.
- Parameters:
  - `name`: Pool name (1-100 chars)
  - `token`: Token contract address (must be valid token)
  - `duration`: Duration in seconds (> 0)
  - `interest_rate`: Rate in basis points (> 0)
- Increments pool count and stores new pool.
- Emits `PoolCreated` event.

#### `delete_pool(pool_id: u64)`
- Deactivates a pool and refunds all participants.
- Requires auth from admin.
- Pool must be active.
- Calculates and distributes refunds (principal + accrued interest if duration passed).
- Sets pool inactive.
- Emits `PoolDeleted` event.

#### `set_admin(new_admin: Address)`
- Updates the global admin.
- Requires auth from current admin.
- Emits `AdminUpdated` event.

### Participant Functions

#### `join_pool(pool_id: u64)`
- Allows a participant to join a pool (register intent).
- Requires auth from participant.
- Pool must be active and accepting deposits.
- Cannot join if already joined.
- Stores participant data.
- Emits `ParticipantJoined` event.

#### `deposit(pool_id: u64, amount: i128)`
- Deposits tokens into a pool.
- Requires auth from depositor.
- Parameters:
  - `pool_id`: Target pool ID
  - `amount`: Amount to deposit (> 0)
- Pool must be active and within deposit period.
- Transfers tokens from depositor to contract.
- Updates pool totals and participant deposits.
- Emits `Deposited` event.

#### `withdraw(pool_id: u64)`
- Withdraws/claims funds from a pool.
- Requires auth from participant.
- Pool must be active.
- Participant must have deposit.
- If duration has passed and no winner selected, triggers winner selection.
- Transfers claimable amount to participant.
- Updates storage.
- Emits `Withdrawn` event.

### View Functions

#### `get_pool(pool_id: u64) -> PoolData`
- Returns pool information.
- No auth required.

#### `get_deposit(pool_id: u64, participant: Address) -> i128`
- Returns deposit amount for participant.
- No auth required.

#### `get_claimable(pool_id: u64, participant: Address) -> i128`
- Returns claimable amount (after winner selection).
- No auth required.

#### `get_depositors(pool_id: u64) -> Vec<Address>`
- Returns list of depositors.
- No auth required.

#### `is_winner_selected(pool_id: u64) -> bool`
- Checks if winner has been selected.
- No auth required.

#### `get_winner(pool_id: u64) -> Option<Address>`
- Returns the winner address if selected.
- No auth required.

## Events

### `PoolCreated`
- `pool_id: u64`
- `name: String`
- `token: Address`
- `duration: u64`
- `interest_rate: u32`
- `created_at: u64`

### `ParticipantJoined`
- `pool_id: u64`
- `participant: Address`
- `joined_at: u64`

### `Deposited`
- `pool_id: u64`
- `participant: Address`
- `amount: i128`

### `WinnerSelected`
- `pool_id: u64`
- `winner: Address`
- `total_interest: i128`

### `Withdrawn`
- `pool_id: u64`
- `participant: Address`
- `amount: i128`

### `PoolDeleted`
- `pool_id: u64`

### `AdminUpdated`
- `old_admin: Address`
- `new_admin: Address`

## Errors

### Contract-level Errors
- `AlreadyInitialized`: Contract already initialized
- `Unauthorized`: Caller not authorized
- `PoolNotFound`: Pool does not exist
- `PoolInactive`: Pool is not active
- `InvalidAmount`: Amount must be positive
- `InvalidDuration`: Duration must be positive
- `InvalidInterestRate`: Interest rate must be positive
- `DepositPeriodEnded`: Cannot deposit after duration
- `NoDeposit`: Participant has no deposit
- `WinnerAlreadySelected`: Winner already chosen
- `InsufficientFunds`: Contract has insufficient funds
- `TransferFailed`: Token transfer failed

## Invariants

### Pool Invariants
- Total deposits = sum of all participant deposits
- Winner selection only occurs once per pool
- Only active pools accept deposits
- Deposits only allowed during duration period
- Winner receives principal + total interest
- Non-winners receive only principal
- Interest calculation: (deposit * rate * duration) / (10000 * 365*24*3600)

### Participant Invariants
- Cannot deposit 0 amount
- Cannot join inactive pool
- Cannot withdraw without deposit
- Claimable amounts set correctly after winner selection
- Funds transferred match claimable amounts

### Contract Invariants
- Only admin can create/delete pools
- Token transfers use Soroban token interface
- Random winner selection uses env.prng() for fairness
- Storage consistency maintained across operations

## Assumptions

### Token Interface
- Assumes standard Soroban token contract interface (balance, transfer, etc.)
- Supports both native XLM (address 0) and SAC tokens
- Contract must have sufficient token balance for payouts

### Time and Randomness
- Uses ledger timestamp for time-based logic
- Winner selection uses env.prng().gen_range() for pseudo-random selection
- Duration in seconds, converted to ledger time

### Network Configuration
- No network-specific assumptions beyond Soroban compatibility
- Contract deployable on any Soroban-enabled network

### Upgradability
- Contract is not upgradable by design
- Admin can create new pools but cannot modify existing ones
- Delete pool refunds all participants

## Implementation Notes

- Use persistent storage for participant data (deposits, claimable amounts)
- Use instance storage for pool metadata
- Winner selection triggered lazily on first withdrawal after duration
- Interest calculated per participant based on individual deposit * rate * duration
- Total interest = sum of individual interests, awarded to winner
- Error handling follows Soroban panic-with-message pattern
- Events emitted for all state changes for off-chain indexing</content>
<parameter name="filePath">c:\Users\USER\OneDrive\Desktop\drip\vaultquest\contracts\docs\SOROBAN_CONTRACT_SPEC.md