# Stellar Wallet Connect

A plug-and-play wallet connection module for Stellar/Soroban applications.

## Features
- Modular wallet connection using `@creit.tech/stellar-wallets-kit`.
- Automated account funding checks.
- Nanostores for state management.
- Ready-to-use Astro and React components.

## Installation

1. Copy the `stellar-wallet-connect` folder to your project root.
2. Install the necessary dependencies:
   ```bash
   npm install @creit.tech/stellar-wallets-kit nanostores @nanostores/react react react-dom
   ```

## Configuration

The module uses environment variables for network configuration. Ensure your `.env` file contains:

```env
PUBLIC_SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
PUBLIC_HORIZON_URL="https://horizon-testnet.stellar.org"
```

The wallet module now validates required environment configuration at startup and fails loudly if values are missing, invalid, or still set to placeholder values.
## Usage

### In Astro

Import and use the `ConnectWallet` component:

```astro
---
import ConnectWallet from "../stellar-wallet-connect/src/components/ConnectWallet.astro";
---

<nav>
  <ConnectWallet />
</nav>
```

### In React

You can use the stores and services directly:

```tsx
import { useStore } from '@nanostores/react';
import { connectedPublicKey } from './stellar-wallet-connect/src/core/store';

function Profile() {
  const $publicKey = useStore(connectedPublicKey);
  return <div>{$publicKey ? `Connected: ${$publicKey}` : 'Not connected'}</div>;
}
```

---

## AI Implementation Prompt

If you are using an AI assistant to integrate this into a new project, use the following prompt:

> "I have a standalone wallet connection module in `./stellar-wallet-connect`. Please integrate it into my project. 
> 1. Use `stellar-wallet-connect/src/components/ConnectWallet.astro` as the main connection button in my navbar.
> 2. Ensure `nanostores` and `@creit.tech/stellar-wallets-kit` are installed.
> 3. Map the environment variables `PUBLIC_SOROBAN_NETWORK_PASSPHRASE` and `PUBLIC_HORIZON_URL` to the project's config.
> 4. Initialize the connection on page load using `initializeConnection` from `stellar-wallet-connect/src/core/walletService.ts`."
