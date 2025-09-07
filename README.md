# VaultQuest

VaultQuest is a no-loss prize-saving protocol where users deposit funds in prize vaults. Instead of earning traditional interest, users stand a chance to win prizes drawn from the collective yield. This innovative approach gives users potential rewards while keeping their deposited funds intact.

---

## Table of Contents

- [VaultQuest](#vaultquest)
  - [Table of Contents](#table-of-contents)
  - [How VaultQuest Works](#how-vaultquest-works)
  - [Protocol Life Cycle](#protocol-life-cycle)
  - [User Life Cycle](#user-life-cycle)
  - [Project Structure](#project-structure)
  - [Detailed Code Overview](#detailed-code-overview)
    - [VaultPage (page.js)](#vaultpage-pagejs)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running the Application](#running-the-application)
  - [Building and Deployment](#building-and-deployment)
  - [Technologies Used](#technologies-used)
  - [Contributing](#contributing)
  - [License](#license)
  - [Contact](#contact)

---

## How VaultQuest Works

VaultQuest leverages tokenized vaults built on the ERC4626 standard—a modern ERC20 implementation that standardizes yield-bearing vaults. The workflow is as follows:

1. **Deposit Funds:** Users deposit into a vault using tokens such as USDC.
2. **Yield Generation:** Deposited funds are allocated to various DeFi strategies (e.g., lending/borrowing platforms, DEX liquidity, yield farming) generating yield over time.
3. **Prize Mechanism:** Instead of traditional interest, the accumulated yield is periodically converted and awarded as prizes in regular draws.
4. **Withdrawal & Claim:** Users can withdraw their deposits at any time; winners of the draws must claim their rewards.

---

## Protocol Life Cycle

1. **Deposit:** Users select a vault and deposit their funds.
2. **Yield Accrual:** The vault invests deposits in integrated DeFi protocols, accruing yield over time.
3. **Draw & Distribution:** At regular intervals, the accrued yield is converted and randomly awarded to one or more participants.
4. **Claiming Rewards:** Winners need to claim their rewards while other users maintain control over their deposits.

---

## User Life Cycle

- **Deposit:** Initiate participation by depositing funds in your chosen vault.
- **Accrue Yield:** Let your deposit generate yield through automated DeFi strategies.
- **Win Prizes:** Periodically, a prize draw is conducted to distribute the yield.
- **Withdrawal:** At any time, you can withdraw your principal deposit.
- **Reward Claim:** If selected, claim the prize reward as part of your yield.

---

## Project Structure

```
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.js
├── tsconfig.json
├── README.md
├── app
│   └── app
│       └── vault
│           └── page.js          // The vault interface and deposit handling (see detailed code overview below)
├── components
│   ├── app
│   │   ├── AppNav.jsx
│   │   ├── CreateVaultModal.jsx
│   │   └── DepositModal.jsx
│   ├── icons
│   │   └── EthIcon.jsx
│   └── ... (additional components)
├── hooks
├── lib
├── public
│   └── images
│       ├── avax.png
│       ├── usdc.png
│       └── usdt.png
└── styles
```

- **app/**: Contains Next.js pages, including the vault interface that handles displaying vaults, deposit actions, filtering, and search.
- **components/**: Reusable UI components such as navigation, modals, and icons used throughout the VaultQuest interface.
- **hooks/** and **lib/**: Application logic and utility functions.
- **public/**: Static assets including images for Eth, USDC, and Cosmo.
- **styles/**: Global styles and component-specific styling.

---

## Detailed Code Overview

### VaultPage (page.js)

The `VaultPage` component is the primary interface where users interact with prize vaults:

- **State Management:**  
  Uses React hooks (`useState`) for handling modal visibility, selected vaults, search queries, and filtering by network.

- **Vault Data:**  
  The page initializes an array of vaults. Each vault has properties like name, network, APY, TVL, user count, and deposit history. For example, the "Prize DAI" vault includes a list of recent deposits.

- **Filtering and Search:**  
  Users have the ability to filter vaults based on the network (e.g., Cosmos) or search by name/token using controlled inputs.

- **Deposit Handling:**  
  When the "Deposit" button is clicked, the selected vault is stored and a deposit modal is shown. This modal enables users to deposit funds, which then update the vault’s balance, TVL, and deposit history.

- **UI Layout:**  
  The interface leverages Tailwind CSS for styling and lucide-react for icons. It also displays statistics such as total value locked (TVL), total users, and average APY in a tabbed section.

---

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm

### Installation

1. **Clone the Repository:**
    ```sh
    git clone https://github.com/Obiajulu-gif/vaultquest
    ```
2. **Navigate to the Project Directory:**
    ```sh
    cd vaultquest
    ```
3. **Install Dependencies:**
    ```sh
    npm install
    ```

### Running the Application

Start the Next.js development server:
```sh
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with VaultQuest.

---

## Building and Deployment

To build the project for production:
```sh
npm run build
```
Then, start the production server:
```sh
npm run start
```

---

## Technologies Used

- **Next.js:** Framework for server-rendered React applications.
- **React:** JavaScript library for building user interfaces.
- **Tailwind CSS:** Utility-first CSS framework that accelerates UI development.
- **lucide-react:** A versatile icon library integrated into the UI.
- **ERC4626:** Standard for tokenized, yield-bearing vaults.
- **DeFi Protocols:** Integration with decentralized finance strategies such as lending, liquidity provision, and yield farming.
- **Cosmo:** A decentralized blockchain platform designed for innovative decentralized applications and cross-chain integration.
- **Eth:** The native token of the Ethereum ecosystem, integrated into VaultQuest to facilitate secure and efficient operations within the decentralized network.

---

## Contributing

Contributions are always welcome! To contribute:
1. Fork the repository.
2. Create a branch for your feature or bug fix.
3. Commit your changes and open a pull request describing your modifications.
4. Follow the established style guidelines and ensure that all tests pass.

---

## License

This project is licensed under the MIT License.

---

## Contact

For any questions or inquiries, please open an issue in the repository or contact the project maintainers.

---

VaultQuest leverages advanced DeFi concepts and robust multi-chain integration—including support for Eth and Cosmo—to offer users an exciting, risk-free opportunity to earn potential rewards through participation. Enjoy exploring and contributing to VaultQuest!