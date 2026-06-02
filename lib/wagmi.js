import { http, fallback } from "wagmi";
import { avalanche, avalancheFuji } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

/** Chains VaultQuest supports for EVM wallet flows (wagmi). */
export const SUPPORTED_CHAINS = [avalanche, avalancheFuji];

export const wagmiConfig = getDefaultConfig({
  appName: "VaultQuest",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.startsWith("YOUR_")
      ? "00000000000000000000000000000000"
      : process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000",
  chains: SUPPORTED_CHAINS,
  transports: {
    [avalanche.id]: fallback([
      http("https://api.avax.network/ext/bc/C/rpc", { retryCount: 3, retryDelay: 1000, timeout: 10000 }),
      http("https://avalanche-c-chain.publicnode.com", { retryCount: 3, retryDelay: 1000, timeout: 10000 })
    ]),
    [avalancheFuji.id]: fallback([
      http("https://api.avax-test.network/ext/bc/C/rpc", { retryCount: 3, retryDelay: 1000, timeout: 10000 }),
      http("https://avalanche-fuji-c-chain.publicnode.com", { retryCount: 3, retryDelay: 1000, timeout: 10000 })
    ]),
  },
  ssr: true,
});

export const DEFAULT_CHAIN = avalancheFuji;
