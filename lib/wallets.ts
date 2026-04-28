// Stellar wallet configuration and types

export type WalletType = 'xbull' | 'albedo' | 'freighter' | 'rabet' | 'ledger';

export interface WalletConfig {
  id: WalletType;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  website: string;
  downloadUrl: string;
  supportedNetworks: NetworkType[];
  isMobile: boolean;
  isHardware: boolean;
  recommended: boolean;
}

export type NetworkType = 'mainnet' | 'testnet' | 'futurenet' | 'standalone';

export interface NetworkConfig {
  id: NetworkType;
  name: string;
  displayName: string;
  passphrase: string;
  rpcUrl: string;
  horizonUrl: string;
  isTestnet: boolean;
  isSupported: boolean;
}

export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType | null;
  address: string | null;
  network: NetworkType | null;
  publicKey: string | null;
  error: string | null;
  lastConnected: number | null;
}

export interface WalletSession {
  walletType: WalletType;
  address: string;
  publicKey: string;
  network: NetworkType;
  connectedAt: number;
  expiresAt: number;
}

export interface WalletError {
  code: string;
  message: string;
  walletType?: WalletType;
  recoverable: boolean;
  action?: string;
}

// Stellar wallet configurations
export const STELLAR_WALLETS: Record<WalletType, WalletConfig> = {
  xbull: {
    id: 'xbull',
    name: 'xBull',
    displayName: 'xBull Wallet',
    description: 'Secure and user-friendly Stellar wallet for mobile and desktop',
    icon: '🚀',
    website: 'https://xbull.io',
    downloadUrl: 'https://xbull.io/download',
    supportedNetworks: ['mainnet', 'testnet'],
    isMobile: true,
    isHardware: false,
    recommended: true,
  },
  albedo: {
    id: 'albedo',
    name: 'Albedo',
    displayName: 'Albedo Wallet',
    description: 'Browser-based wallet with advanced features',
    icon: '🌟',
    website: 'https://albedo.link',
    downloadUrl: 'https://albedo.link',
    supportedNetworks: ['mainnet', 'testnet'],
    isMobile: false,
    isHardware: false,
    recommended: true,
  },
  freighter: {
    id: 'freighter',
    name: 'Freighter',
    displayName: 'Freighter Wallet',
    description: 'Popular browser extension wallet for Stellar',
    icon: '🚢',
    website: 'https://freighter.app',
    downloadUrl: 'https://freighter.app',
    supportedNetworks: ['mainnet', 'testnet'],
    isMobile: false,
    isHardware: false,
    recommended: true,
  },
  rabet: {
    id: 'rabet',
    name: 'Rabet',
    displayName: 'Rabet Wallet',
    description: 'Feature-rich wallet for Stellar ecosystem',
    icon: '🐰',
    website: 'https://rabet.io',
    downloadUrl: 'https://rabet.io',
    supportedNetworks: ['mainnet', 'testnet'],
    isMobile: false,
    isHardware: false,
    recommended: false,
  },
  ledger: {
    id: 'ledger',
    name: 'Ledger',
    displayName: 'Ledger Hardware Wallet',
    description: 'Most secure hardware wallet option',
    icon: '🔒',
    website: 'https://ledger.com',
    downloadUrl: 'https://ledger.com',
    supportedNetworks: ['mainnet', 'testnet'],
    isMobile: false,
    isHardware: true,
    recommended: false,
  },
};

// Stellar network configurations
export const STELLAR_NETWORKS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    id: 'mainnet',
    name: 'Stellar Mainnet',
    displayName: 'Stellar Mainnet',
    passphrase: 'Public Global Stellar Network ; September 2015',
    rpcUrl: 'https://rpc.mainnet.stellar.org',
    horizonUrl: 'https://horizon.stellar.org',
    isTestnet: false,
    isSupported: true,
  },
  testnet: {
    id: 'testnet',
    name: 'Stellar Testnet',
    displayName: 'Stellar Testnet',
    passphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://rpc.testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    isTestnet: true,
    isSupported: true,
  },
  futurenet: {
    id: 'futurenet',
    name: 'Stellar Futurenet',
    displayName: 'Stellar Futurenet',
    passphrase: 'Test SDF Future Network ; October 2022',
    rpcUrl: 'https://rpc.futurenet.stellar.org',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    isTestnet: true,
    isSupported: false,
  },
  standalone: {
    id: 'standalone',
    name: 'Standalone Network',
    displayName: 'Standalone Network',
    passphrase: 'Standalone Network ; February 2017',
    rpcUrl: 'http://localhost:8000',
    horizonUrl: 'http://localhost:8000',
    isTestnet: true,
    isSupported: false,
  },
};

// Wallet error codes and messages
export const WALLET_ERRORS = {
  WALLET_NOT_INSTALLED: {
    code: 'WALLET_NOT_INSTALLED',
    message: 'Wallet is not installed',
    recoverable: true,
    action: 'install_wallet',
  },
  WALLET_LOCKED: {
    code: 'WALLET_LOCKED',
    message: 'Wallet is locked. Please unlock your wallet.',
    recoverable: true,
    action: 'unlock_wallet',
  },
  WALLET_NO_PERMISSIONS: {
    code: 'WALLET_NO_PERMISSIONS',
    message: 'Please grant permission to connect to your wallet.',
    recoverable: true,
    action: 'grant_permissions',
  },
  WALLET_CONNECTION_FAILED: {
    code: 'WALLET_CONNECTION_FAILED',
    message: 'Failed to connect to wallet. Please try again.',
    recoverable: true,
    action: 'retry_connection',
  },
  WALLET_DISCONNECTED: {
    code: 'WALLET_DISCONNECTED',
    message: 'Wallet was disconnected.',
    recoverable: true,
    action: 'reconnect_wallet',
  },
  NETWORK_NOT_SUPPORTED: {
    code: 'NETWORK_NOT_SUPPORTED',
    message: 'Current network is not supported. Please switch to a supported network.',
    recoverable: true,
    action: 'switch_network',
  },
  NETWORK_MISMATCH: {
    code: 'NETWORK_MISMATCH',
    message: 'Network mismatch. Please switch to the correct network.',
    recoverable: true,
    action: 'switch_network',
  },
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Session expired. Please reconnect your wallet.',
    recoverable: true,
    action: 'reconnect_wallet',
  },
  INVALID_ADDRESS: {
    code: 'INVALID_ADDRESS',
    message: 'Invalid wallet address.',
    recoverable: false,
    action: null,
  },
  TRANSACTION_FAILED: {
    code: 'TRANSACTION_FAILED',
    message: 'Transaction failed. Please try again.',
    recoverable: true,
    action: 'retry_transaction',
  },
  INSUFFICIENT_FUNDS: {
    code: 'INSUFFICIENT_FUNDS',
    message: 'Insufficient funds for this transaction.',
    recoverable: false,
    action: null,
  },
} as const;

// Wallet connection status
export enum WalletConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting',
}

// Session management constants
export const SESSION_CONFIG = {
  STORAGE_KEY: 'dripwave_wallet_session',
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 1000, // 1 second
} as const;

// Helper functions
export const getWalletConfig = (walletType: WalletType): WalletConfig => {
  return STELLAR_WALLETS[walletType];
};

export const getNetworkConfig = (networkType: NetworkType): NetworkConfig => {
  return STELLAR_NETWORKS[networkType];
};

export const isWalletSupported = (walletType: string): walletType is WalletType => {
  return Object.keys(STELLAR_WALLETS).includes(walletType);
};

export const isNetworkSupported = (networkType: string): networkType is NetworkType => {
  return Object.keys(STELLAR_NETWORKS).includes(networkType);
};

export const getRecommendedWallets = (): WalletConfig[] => {
  return Object.values(STELLAR_WALLETS).filter(wallet => wallet.recommended);
};

export const getMobileWallets = (): WalletConfig[] => {
  return Object.values(STELLAR_WALLETS).filter(wallet => wallet.isMobile);
};

export const getHardwareWallets = (): WalletConfig[] => {
  return Object.values(STELLAR_WALLETS).filter(wallet => wallet.isHardware);
};

export const getSupportedNetworks = (): NetworkConfig[] => {
  return Object.values(STELLAR_NETWORKS).filter(network => network.isSupported);
};

export const formatWalletAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
};

export const validateStellarAddress = (address: string): boolean => {
  // Basic Stellar address validation (starts with 'G' and is 56 characters)
  return /^G[A-Z0-9]{55}$/.test(address);
};

export const getWalletError = (code: keyof typeof WALLET_ERRORS, walletType?: WalletType): WalletError => {
  const error = WALLET_ERRORS[code];
  return {
    ...error,
    walletType,
  };
};

// Copy and branding constants
export const WALLET_COPY = {
  CONNECT_WALLET: 'Connect Wallet',
  CONNECTING: 'Connecting...',
  CONNECTED: 'Connected',
  DISCONNECT: 'Disconnect',
  SWITCH_WALLET: 'Switch Wallet',
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  SELECT_WALLET: 'Select your wallet',
  NO_WALLET_INSTALLED: 'No wallet installed',
  INSTALL_WALLET: 'Install Wallet',
  RECONNECT_WALLET: 'Reconnect Wallet',
  UNSUPPORTED_NETWORK: 'Unsupported Network',
  SWITCH_NETWORK: 'Switch Network',
  SESSION_EXPIRED: 'Session Expired',
  WALLET_SESSION: 'Wallet Session',
  LAST_CONNECTED: 'Last connected',
  NETWORK: 'Network',
  ADDRESS: 'Address',
  BALANCE: 'Balance',
  TRANSACTIONS: 'Transactions',
} as const;

export const STELLAR_COPY = {
  NETWORK_NAME: 'Stellar',
  MAINNET: 'Stellar Mainnet',
  TESTNET: 'Stellar Testnet',
  FUTURENET: 'Stellar Futurenet',
  STANDALONE: 'Standalone Network',
  LUMENS: 'Lumens (XLM)',
  STELLAR_ADDRESS: 'Stellar Address',
  PUBLIC_KEY: 'Public Key',
  SECRET_KEY: 'Secret Key',
  MEMO: 'Memo',
  TRANSACTION_FEE: 'Transaction Fee',
  BASE_RESERVE: 'Base Reserve',
} as const;
