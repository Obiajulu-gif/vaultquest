import { ApiResponse, DashboardData, Pool, UserPosition, TransactionState } from './types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Generic API wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Dashboard API
export async function getDashboardData(walletAddress: string): Promise<ApiResponse<DashboardData>> {
  return apiRequest<DashboardData>(`/dashboard/summary?wallet=${walletAddress}`);
}

// Pools API
export async function getPools(): Promise<ApiResponse<Pool[]>> {
  return apiRequest<Pool[]>('/pools');
}

export async function getPool(poolId: string): Promise<ApiResponse<Pool>> {
  return apiRequest<Pool>(`/pools/${poolId}`);
}

// User Positions API
export async function getUserPositions(walletAddress: string): Promise<ApiResponse<UserPosition[]>> {
  return apiRequest<UserPosition[]>(`/positions?wallet=${walletAddress}`);
}

// Transactions API
export async function getTransactions(
  walletAddress: string,
  status?: string,
  limit = 25
): Promise<ApiResponse<TransactionState[]>> {
  const params = new URLSearchParams({
    wallet: walletAddress,
    limit: limit.toString(),
  });
  
  if (status) {
    params.append('status', status);
  }

  return apiRequest<TransactionState[]>(`/actions?${params.toString()}`);
}

export async function createTransaction(
  walletAddress: string,
  type: string,
  payload: Record<string, any>
): Promise<ApiResponse<{ id: string }>> {
  return apiRequest<{ id: string }>('/actions', {
    method: 'POST',
    body: JSON.stringify({
      wallet_address: walletAddress,
      action_type: type,
      action_payload: payload,
    }),
  });
}

export async function updateTransaction(
  transactionId: string,
  txHash: string
): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/actions/${transactionId}/submitted`, {
    method: 'PATCH',
    body: JSON.stringify({ tx_hash: txHash }),
  });
}

export async function cancelTransaction(
  transactionId: string,
  errorCode: string,
  errorDetail?: string
): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/actions/${transactionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({
      error_code: errorCode,
      error_detail: errorDetail,
    }),
  });
}

// Utility function to format API errors
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
