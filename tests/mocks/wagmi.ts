import { vi } from 'vitest';

export const mockWagmiHooks = {
  useAccount: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
    status: 'connected',
  })),
  useConnect: vi.fn(() => ({
    connect: vi.fn(),
    connectors: [],
    status: 'idle',
  })),
  useDisconnect: vi.fn(() => ({
    disconnect: vi.fn(),
  })),
  useChainId: vi.fn(() => 43113),
};

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>();
  return {
    ...actual,
    useAccount: () => mockWagmiHooks.useAccount(),
    useConnect: () => mockWagmiHooks.useConnect(),
    useDisconnect: () => mockWagmiHooks.useDisconnect(),
    useChainId: () => mockWagmiHooks.useChainId(),
  };
});
