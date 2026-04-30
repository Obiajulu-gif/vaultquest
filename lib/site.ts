/**
 * Centralized configuration for Drip Wave DAL.
 * Handles API URLs, Soroban Contract IDs, and Network metadata.
 */
export const siteConfig = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  SOROBAN_CONTRACT_ID: process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID || '',
  STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
  RPC_URL: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  REFETCH_INTERVAL: 10000, // 10 seconds default for polling
};