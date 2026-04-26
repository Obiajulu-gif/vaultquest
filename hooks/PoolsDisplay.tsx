"use client";

import React from 'react';
import { usePools, useUserAccount } from '@/src/hooks/queries';

interface PoolsDisplayProps {
  userAddress?: string; // Optional address to fetch user-specific data
}

/**
 * A demonstration component that fetches and displays pool data and
 * optionally user account data using the new centralized DAL hooks.
 * This replaces ad-hoc fetch calls or useEffect patterns.
 */
export function PoolsDisplay({ userAddress }: PoolsDisplayProps) {
  const { data: pools, isLoading: isLoadingPools, isError: isErrorPools, error: poolsError } = usePools();
  const { data: userAccount, isLoading: isLoadingAccount, isError: isErrorAccount, error: accountError } = useUserAccount(userAddress);

  if (isLoadingPools) {
    return <div className="text-center text-gray-400">Loading pools...</div>;
  }

  if (isErrorPools) {
    return <div className="text-center text-red-500">Error loading pools: {poolsError?.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-white">Available Prize Pools</h2>

      {userAddress && (
        <div className="mb-8 p-4 bg-[#1A0808]/70 backdrop-blur-sm rounded-xl border border-red-900/20 shadow-lg">
          <h3 className="text-xl font-semibold mb-3 text-white">Your Account Summary</h3>
          {isLoadingAccount ? (
            <p className="text-gray-400">Loading account data...</p>
          ) : isErrorAccount ? (
            <p className="text-red-500">Error loading account: {accountError?.message}</p>
          ) : userAccount ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <p><strong>Address:</strong> {userAccount.address.substring(0, 6)}...{userAccount.address.substring(userAccount.address.length - 4)}</p>
              <p><strong>Total Deposited:</strong> {userAccount.totalDeposited.toFixed(2)} {userAccount.activePools.length > 0 ? 'XLM' : ''}</p>
              <p><strong>Active Pools:</strong> {userAccount.activePools.length}</p>
              <p><strong>Pending Rewards:</strong> {userAccount.pendingRewards.toFixed(2)} XLM</p>
            </div>
          ) : (
            <p className="text-gray-400">No account data available for {userAddress}.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools && pools.length > 0 ? (
          pools.map((pool) => (
            <div key={pool.id} className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 border border-red-900/20 shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-white">{pool.name}</h3>
              <p className="text-gray-300">APY: <span className="font-semibold text-green-400">{(pool.apy * 100).toFixed(2)}%</span></p>
              <p className="text-gray-300">TVL: <span className="font-semibold">{pool.tvl.toFixed(2)} {pool.tokenSymbol}</span></p>
              <p className="text-gray-300">Participants: {pool.participantCount}</p>
              <p className="text-gray-300">Status: {pool.isActive ? 'Active' : 'Inactive'}</p>
              {pool.isActive && (
                <p className="text-gray-300">Time Left: {Math.floor(pool.remainingTimeSeconds / 3600)}h {Math.floor((pool.remainingTimeSeconds % 3600) / 60)}m</p>
              )}
              <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                View Details
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400 col-span-full">No pools available at the moment.</p>
        )}
      </div>
    </div>
  );
}