"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  WalletType, 
  NetworkType, 
  WalletConnectionState, 
  WalletSession, 
  WalletError,
  WalletConnectionStatus,
  SESSION_CONFIG,
  getWalletConfig,
  getNetworkConfig,
  isWalletSupported,
  isNetworkSupported,
  validateStellarAddress,
  getWalletError,
  formatWalletAddress
} from '@/lib/wallets';

// Mock wallet providers (in a real implementation, these would be actual wallet SDKs)
interface WalletProvider {
  isConnected(): Promise<boolean>;
  connect(): Promise<{ address: string; publicKey: string; network: NetworkType }>;
  disconnect(): Promise<void>;
  getNetwork(): Promise<NetworkType>;
  switchNetwork(network: NetworkType): Promise<void>;
  signTransaction(transaction: any): Promise<any>;
}

// Mock wallet implementations
const mockWalletProviders: Record<WalletType, WalletProvider> = {
  xbull: {
    isConnected: async () => false,
    connect: async () => {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        address: 'GBXK7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        publicKey: 'GBXK7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        network: 'mainnet'
      };
    },
    disconnect: async () => {},
    getNetwork: async () => 'mainnet',
    switchNetwork: async () => {},
    signTransaction: async (tx) => tx,
  },
  albedo: {
    isConnected: async () => false,
    connect: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        address: 'GALB7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        publicKey: 'GALB7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        network: 'mainnet'
      };
    },
    disconnect: async () => {},
    getNetwork: async () => 'mainnet',
    switchNetwork: async () => {},
    signTransaction: async (tx) => tx,
  },
  freighter: {
    isConnected: async () => false,
    connect: async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return {
        address: 'GFRG7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        publicKey: 'GFRG7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        network: 'mainnet'
      };
    },
    disconnect: async () => {},
    getNetwork: async () => 'mainnet',
    switchNetwork: async () => {},
    signTransaction: async (tx) => tx,
  },
  rabet: {
    isConnected: async () => false,
    connect: async () => {
      await new Promise(resolve => setTimeout(resolve, 900));
      return {
        address: 'GRBT7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        publicKey: 'GRBT7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        network: 'mainnet'
      };
    },
    disconnect: async () => {},
    getNetwork: async () => 'mainnet',
    switchNetwork: async () => {},
    signTransaction: async (tx) => tx,
  },
  ledger: {
    isConnected: async () => false,
    connect: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        address: 'GLDG7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        publicKey: 'GLDG7E4ZJ6J3A3P5K5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B5B',
        network: 'mainnet'
      };
    },
    disconnect: async () => {},
    getNetwork: async () => 'mainnet',
    switchNetwork: async () => {},
    signTransaction: async (tx) => tx,
  },
};

export function useWalletConnection() {
  const [state, setState] = useState<WalletConnectionState>({
    isConnected: false,
    isConnecting: false,
    walletType: null,
    address: null,
    network: null,
    publicKey: null,
    error: null,
    lastConnected: null,
  });

  const [status, setStatus] = useState<WalletConnectionStatus>(WalletConnectionStatus.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved session on mount
  useEffect(() => {
    loadSavedSession();
  }, []);

  // Auto-reconnect logic
  useEffect(() => {
    if (state.walletType && state.address && !state.isConnected && !state.isConnecting) {
      if (reconnectAttempts < SESSION_CONFIG.RECONNECT_ATTEMPTS) {
        attemptReconnect();
      }
    }
  }, [state.walletType, state.address, state.isConnected, state.isConnecting, reconnectAttempts]);

  // Save session when connection state changes
  useEffect(() => {
    if (state.isConnected && state.walletType && state.address && state.network) {
      saveSession({
        walletType: state.walletType,
        address: state.address,
        publicKey: state.publicKey!,
        network: state.network,
        connectedAt: Date.now(),
        expiresAt: Date.now() + SESSION_CONFIG.SESSION_DURATION,
      });
    } else if (!state.isConnected) {
      clearSession();
    }
  }, [state]);

  const loadSavedSession = useCallback(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
      if (savedSession) {
        const session: WalletSession = JSON.parse(savedSession);
        
        // Check if session is still valid
        if (Date.now() < session.expiresAt) {
          setState(prev => ({
            ...prev,
            walletType: session.walletType,
            address: session.address,
            publicKey: session.publicKey,
            network: session.network,
            lastConnected: session.connectedAt,
          }));
          setStatus(WalletConnectionStatus.RECONNECTING);
        } else {
          clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to load saved session:', error);
      clearSession();
    }
  }, []);

  const saveSession = useCallback((session: WalletSession) => {
    try {
      localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  const connect = useCallback(async (walletType: WalletType): Promise<boolean> => {
    if (!isWalletSupported(walletType)) {
      const error = getWalletError('WALLET_NOT_INSTALLED', walletType);
      setState(prev => ({ ...prev, error: error.message }));
      setStatus(WalletConnectionStatus.ERROR);
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null 
    }));
    setStatus(WalletConnectionStatus.CONNECTING);

    try {
      const provider = mockWalletProviders[walletType];
      
      // Check if wallet is available (in real implementation, this would check if the wallet is installed)
      const isAvailable = await provider.isConnected();
      
      // Connect to wallet
      const connection = await provider.connect();
      
      // Validate address
      if (!validateStellarAddress(connection.address)) {
        const error = getWalletError('INVALID_ADDRESS', walletType);
        setState(prev => ({ 
          ...prev, 
          isConnecting: false, 
          error: error.message 
        }));
        setStatus(WalletConnectionStatus.ERROR);
        return false;
      }

      // Validate network
      if (!isNetworkSupported(connection.network)) {
        const error = getWalletError('NETWORK_NOT_SUPPORTED', walletType);
        setState(prev => ({ 
          ...prev, 
          isConnecting: false, 
          error: error.message 
        }));
        setStatus(WalletConnectionStatus.ERROR);
        return false;
      }

      // Success
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        walletType,
        address: connection.address,
        publicKey: connection.publicKey,
        network: connection.network,
        error: null,
        lastConnected: Date.now(),
      }));
      setStatus(WalletConnectionStatus.CONNECTED);
      setReconnectAttempts(0);

      return true;

    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      let errorCode: keyof typeof WALLET_ERRORS = 'WALLET_CONNECTION_FAILED';
      if (error instanceof Error) {
        if (error.message.includes('locked')) {
          errorCode = 'WALLET_LOCKED';
        } else if (error.message.includes('permission')) {
          errorCode = 'WALLET_NO_PERMISSIONS';
        }
      }

      const walletError = getWalletError(errorCode, walletType);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: walletError.message 
      }));
      setStatus(WalletConnectionStatus.ERROR);

      return false;
    }
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      if (state.walletType && mockWalletProviders[state.walletType]) {
        await mockWalletProviders[state.walletType].disconnect();
      }
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
    }

    setState({
      isConnected: false,
      isConnecting: false,
      walletType: null,
      address: null,
      network: null,
      publicKey: null,
      error: null,
      lastConnected: null,
    });
    setStatus(WalletConnectionStatus.DISCONNECTED);
    setReconnectAttempts(0);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [state.walletType]);

  const switchNetwork = useCallback(async (network: NetworkType): Promise<boolean> => {
    if (!state.isConnected || !state.walletType) {
      return false;
    }

    if (!isNetworkSupported(network)) {
      const error = getWalletError('NETWORK_NOT_SUPPORTED', state.walletType);
      setState(prev => ({ ...prev, error: error.message }));
      return false;
    }

    try {
      const provider = mockWalletProviders[state.walletType];
      await provider.switchNetwork(network);
      
      setState(prev => ({ ...prev, network }));
      return true;

    } catch (error) {
      console.error('Network switch failed:', error);
      const walletError = getWalletError('NETWORK_MISMATCH', state.walletType);
      setState(prev => ({ ...prev, error: walletError.message }));
      return false;
    }
  }, [state.isConnected, state.walletType]);

  const attemptReconnect = useCallback(() => {
    if (!state.walletType) return;

    setStatus(WalletConnectionStatus.RECONNECTING);
    setReconnectAttempts(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(async () => {
      const success = await connect(state.walletType!);
      if (!success && reconnectAttempts < SESSION_CONFIG.RECONNECT_ATTEMPTS - 1) {
        // Try again after delay
        setTimeout(() => attemptReconnect(), SESSION_CONFIG.RECONNECT_DELAY * (reconnectAttempts + 1));
      } else if (!success) {
        // Max attempts reached, show session expired error
        const error = getWalletError('SESSION_EXPIRED', state.walletType!);
        setState(prev => ({ ...prev, error: error.message }));
        setStatus(WalletConnectionStatus.ERROR);
      }
    }, SESSION_CONFIG.RECONNECT_DELAY);
  }, [state.walletType, reconnectAttempts, connect]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    if (status === WalletConnectionStatus.ERROR) {
      setStatus(state.isConnected ? WalletConnectionStatus.CONNECTED : WalletConnectionStatus.DISCONNECTED);
    }
  }, [status, state.isConnected]);

  const refreshConnection = useCallback(async (): Promise<boolean> => {
    if (!state.walletType) return false;
    
    setReconnectAttempts(0);
    return await connect(state.walletType);
  }, [state.walletType, connect]);

  // Computed values
  const walletConfig = state.walletType ? getWalletConfig(state.walletType) : null;
  const networkConfig = state.network ? getNetworkConfig(state.network) : null;
  const formattedAddress = state.address ? formatWalletAddress(state.address) : '';
  const isReconnecting = status === WalletConnectionStatus.RECONNECTING;
  const canRetry = status === WalletConnectionStatus.ERROR && reconnectAttempts < SESSION_CONFIG.RECONNECT_ATTEMPTS;

  return {
    // State
    state,
    status,
    reconnectAttempts,
    
    // Computed values
    walletConfig,
    networkConfig,
    formattedAddress,
    isReconnecting,
    canRetry,
    
    // Actions
    connect,
    disconnect,
    switchNetwork,
    clearError,
    refreshConnection,
    
    // Helpers
    isWalletSupported,
    isNetworkSupported,
    validateStellarAddress,
  };
}
