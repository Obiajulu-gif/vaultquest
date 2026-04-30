/**
 * Centralized configuration for Drip Wave.
 * Exports contract IDs, API endpoints, and network metadata from environment variables.
 */
export const CONTRACT_IDS = {
  DRIP_WAVE: process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID || 'CD...placeholder',
};

export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  ACCOUNT_DATA: (address: string) => `${API_ENDPOINTS.BASE_URL}/accounts/${address}`,
  POOLS: `${API_ENDPOINTS.BASE_URL}/pools`,
  TRANSACTIONS: (id: string) => `${API_ENDPOINTS.BASE_URL}/actions/${id}`,
};

export const NETWORK_DETAILS = {
  NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
  RPC_URL: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
};