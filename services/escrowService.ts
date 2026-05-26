/**
 * Escrow Service
 * 
 * High-level orchestration service for managing challenge rewards.
 * Only this service can trigger escrow actions.
 */

import { TrustlessWorkClient } from '@/lib/escrow/trustlessWork';
import { EscrowMapper } from '@/lib/escrow/mapper';
import { Challenge } from '@/types/challenge';
import { TWCreateEscrowResponse, TWEscrowStatusResponse } from '@/lib/escrow/types';

export const EscrowService = {
  /**
   * Initializes and funds an escrow for a challenge
   */
  async createEscrowForChallenge(challenge: Challenge, recipientAddress: string): Promise<TWCreateEscrowResponse> {
    console.log(`[EscrowService] Creating escrow for challenge: ${challenge.id}`);
    
    const request = EscrowMapper.toCreateRequest(challenge, recipientAddress);
    return await TrustlessWorkClient.createEscrow(request);
  },

  /**
   * Syncs the current status of an escrow from Trustless Work
   */
  async getEscrowStatus(type: string, escrowId: string): Promise<TWEscrowStatusResponse> {
    return await TrustlessWorkClient.getStatus(type, escrowId);
  },

  /**
   * Releases rewards for a specific user after milestone completion
   */
  async releaseReward(escrowId: string, recipient: string, milestoneIndex: number): Promise<{ xdr: string }> {
    console.log(`[EscrowService] Triggering reward release for ${recipient} (Milestone ${milestoneIndex})`);
    
    return await TrustlessWorkClient.releaseFunds('multi-release', {
      escrowId,
      recipient,
      milestoneIndex
    });
  },

  /**
   * Initiates a dispute for an escrow
   */
  async disputeEscrow(escrowId: string, reason: string): Promise<{ xdr: string }> {
    console.log(`[EscrowService] Initiating dispute for escrow ${escrowId}: ${reason}`);
    
    return await TrustlessWorkClient.dispute('multi-release', escrowId, reason);
  }
};
