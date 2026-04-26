"use client";

import React from 'react';
import { usePools } from '@/src/hooks/use-data-layer';

/**
 * Refactored Component: Demonstrates UI abstraction.
 * Note how the component has no knowledge of API endpoints or raw data shapes.
 */
export function PoolList() {
  // REPLACEMENT: This single line replaces useEffect, useState for data, loading, and error.
  const { data: pools, isLoading, isError, error } = usePools();

  if (isLoading) return <div className="p-4 text-white">Finding available pools...</div>;
  
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="grid gap-4">
      {pools?.map((pool) => (
        <div 
          key={pool.id} 
          className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center"
        >
          <div>
            <h3 className="text-xl font-bold text-white">{pool.name}</h3>
            <p className="text-zinc-400">TVL: {pool.tvl.toLocaleString()} {pool.tokenSymbol}</p>
          </div>
          <div className="text-right">
            <span className="text-green-400 font-mono font-bold">
              {(pool.apy * 100).toFixed(2)}% APY
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}