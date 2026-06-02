export const VAULT_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "vaultConfig",
    outputs: [
      { internalType: "uint256", name: "maxCapacity", type: "uint256" },
      { internalType: "uint256", name: "currentTotal", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAPY",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const VAULT_ADDRESS = "0x1234567890123456789012345678901234567890";
