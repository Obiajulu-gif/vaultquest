/**
 * VaultQuest pool UI module: pool detail (#73), reward history (#75), and the
 * saved-pools watchlist (#89/#90), plus the testable contract interface + mock (#67).
 */
export * from "./contract/types";
export { createMockVaultClient, SAMPLE_ADDRESS, type MockVaultConfig } from "./contract/mockClient";
export * from "./lib/format";
export { usePoolDetail, useRewardHistory, useSavedPools, type AsyncResource, type PoolDetailResource, type SavedPoolsResource } from "./hooks";
export { RewardHistory, type RewardHistoryProps } from "./components/RewardHistory";
export { SavedPoolsWatchlist, type SavedPoolsWatchlistProps } from "./components/SavedPoolsWatchlist";
export { PoolDetail, availableActions, type PoolDetailProps } from "./components/PoolDetail";
export { OnboardingChecklist, ONBOARDING_STORAGE_KEY, type OnboardingChecklistProps } from "./components/OnboardingChecklist";
