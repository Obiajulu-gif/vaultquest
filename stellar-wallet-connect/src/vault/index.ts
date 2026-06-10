/**
 * VaultQuest pool UI module: pool detail (#73), reward history (#75), and the
 * saved-pools watchlist (#89/#90), plus the testable contract interface + mock (#67).
 */
export * from "./contract/types";
export { createMockVaultClient, SAMPLE_ADDRESS, type MockVaultConfig } from "./contract/mockClient";
export * from "./lib/format";
export { useAccountView, usePoolAction, usePoolDetail, usePoolDiscovery, usePrizeViews, useRewardHistory, useSavedPools, useTransactionStatus, invalidatePoolActionQueries, type AccountView, type AsyncResource, type PoolActionFlow, type PoolDetailResource, type PoolDiscoveryOptions, type PrizeViewsOptions, type SavedPoolsResource, type TransactionStatusResource } from "./hooks";
export { VaultApiClient, isTerminalTransaction, type TransactionStatus, type TransactionStatusView } from "./data/apiClient";
export { createVaultDataConfig, defaultVaultDataConfig, type VaultDataConfig, type VaultFeatureFlags, type VaultNetworkConfig } from "./data/config";
export { vaultQueryClient, useVaultQuery, type QueryState, type QueryStatus } from "./data/queryClient";
export { vaultQueryKeys, serializeQueryKey, type VaultQueryKey } from "./data/queryKeys";
export { RewardHistory, type RewardHistoryProps } from "./components/RewardHistory";
export { SavedPoolsWatchlist, type SavedPoolsWatchlistProps } from "./components/SavedPoolsWatchlist";
export { PoolDetail, availableActions, type PoolDetailProps } from "./components/PoolDetail";
export { OnboardingChecklist, ONBOARDING_STORAGE_KEY, type OnboardingChecklistProps } from "./components/OnboardingChecklist";
