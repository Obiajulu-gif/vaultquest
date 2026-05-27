/**
 * VaultQuest pool UI module: pool detail (#73), reward history (#75), and the
 * testable contract interface + mock (#67).
 */
export * from "./contract/types";
export { createMockVaultClient, SAMPLE_ADDRESS, type MockVaultConfig } from "./contract/mockClient";
export * from "./lib/format";
export { usePoolDetail, useRewardHistory, type AsyncResource, type PoolDetailResource } from "./hooks";
export { RewardHistory, type RewardHistoryProps } from "./components/RewardHistory";
export { PoolDetail, availableActions, type PoolDetailProps } from "./components/PoolDetail";
