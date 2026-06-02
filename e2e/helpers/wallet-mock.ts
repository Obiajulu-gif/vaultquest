import { Page } from '@playwright/test';

export async function injectMockWallet(page: Page, address: string = '0x1234567890123456789012345678901234567890') {
  await page.addInitScript((mockAddress) => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
          return [mockAddress];
        }
        if (method === 'eth_chainId') {
          return '0xa869'; // Fuji testnet
        }
        if (method === 'eth_sendTransaction') {
          return '0xmocktxhash1234567890abcdef1234567890abcdef1234567890abcdef123456';
        }
        if (method === 'wallet_switchEthereumChain') {
          return null; // success
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
    };
  }, address);
}
