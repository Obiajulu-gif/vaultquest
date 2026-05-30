declare const process: { env: Record<string, string | undefined> } | undefined;

export interface VaultNetworkConfig {
  name: "testnet" | "mainnet" | "futurenet" | "custom";
  passphrase: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
}

export interface VaultFeatureFlags {
  backendReads: boolean;
  contractFallbackReads: boolean;
  transactionPolling: boolean;
}

export interface VaultDataConfig {
  apiBaseUrl: string;
  dripPoolContractId: string;
  escrowContractId?: string;
  network: VaultNetworkConfig;
  featureFlags: VaultFeatureFlags;
}

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";
const FUTURENET_PASSPHRASE = "Test SDF Future Network ; October 2022";

function read(source: Record<string, string | undefined>, key: string, fallback = ""): string {
  return source[key]?.trim() || fallback;
}

function readBoolean(source: Record<string, string | undefined>, key: string, fallback: boolean): boolean {
  const value = source[key]?.trim().toLowerCase();
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value);
}

function inferNetworkName(passphrase: string): VaultNetworkConfig["name"] {
  if (passphrase === MAINNET_PASSPHRASE) return "mainnet";
  if (passphrase === FUTURENET_PASSPHRASE) return "futurenet";
  if (passphrase === TESTNET_PASSPHRASE) return "testnet";
  return "custom";
}

export function createVaultDataConfig(
  source: Record<string, string | undefined> = typeof process === "undefined" ? {} : process.env,
): VaultDataConfig {
  const passphrase = read(source, "NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE", read(source, "PUBLIC_SOROBAN_NETWORK_PASSPHRASE"));

  return {
    apiBaseUrl: read(source, "NEXT_PUBLIC_VAULTQUEST_API_BASE_URL", read(source, "PUBLIC_VAULTQUEST_API_BASE_URL", "/api")),
    dripPoolContractId: read(source, "NEXT_PUBLIC_DRIP_POOL_CONTRACT_ID"),
    escrowContractId: read(source, "NEXT_PUBLIC_TRUSTLESS_WORK_ESCROW_CONTRACT_ID") || undefined,
    network: {
      name: inferNetworkName(passphrase),
      passphrase,
      horizonUrl: read(source, "NEXT_PUBLIC_HORIZON_URL", read(source, "PUBLIC_HORIZON_URL")),
      sorobanRpcUrl: read(source, "NEXT_PUBLIC_SOROBAN_RPC_URL"),
    },
    featureFlags: {
      backendReads: readBoolean(source, "NEXT_PUBLIC_VAULTQUEST_BACKEND_READS", true),
      contractFallbackReads: readBoolean(source, "NEXT_PUBLIC_VAULTQUEST_CONTRACT_FALLBACK_READS", true),
      transactionPolling: readBoolean(source, "NEXT_PUBLIC_VAULTQUEST_TRANSACTION_POLLING", true),
    },
  };
}

export const defaultVaultDataConfig = createVaultDataConfig();
