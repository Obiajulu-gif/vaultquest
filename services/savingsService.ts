/**
 * Savings Service
 * 
 * Orchestrates savings tracking and milestone updates.
 */

import * as Tracker from '@/lib/savings/tracker';
import * as Milestones from '@/lib/savings/milestones';
import * as Eligibility from '@/lib/savings/eligibility';
import { Quest, UserQuestParticipation } from '@/types/quest';
import { EscrowService } from '@/services/escrowService';

export const SavingsService = {
  /**
   * Tracks a new deposit and updates participation state
   */
  async trackDeposit(quest: Quest, participation: UserQuestParticipation, amount: number): Promise<UserQuestParticipation> {
    // 1. Update balance
    participation.currentBalance = Tracker.calculateCurrentBalance(participation, amount);
    
    // 2. Update streak
    participation.streakDays = Tracker.updateStreak(participation, amount);
    participation.lastDepositAt = Date.now();

    // 3. Check for milestone completion
    quest.milestones.forEach(async (milestone, index) => {
      const isMet = Milestones.verifyMilestone(milestone, participation.currentBalance);
      const prog = participation.milestoneProgress[index];
      
      if (isMet && !prog.completedAt) {
        prog.completedAt = Date.now();
        console.log(`[SavingsService] Milestone ${milestone.id} unlocked!`);
        
        // 4. Trigger reward release if this was a milestone release escrow
        if (quest.escrowId) {
          try {
            await EscrowService.releaseReward(quest.escrowId, participation.userAddress, index);
          } catch (error) {
            console.error('Failed to trigger reward release:', error);
          }
        }
      }
    });

    // 5. Update final eligibility
    participation.isEligibleForReward = Eligibility.checkRewardEligibility(quest, participation);

    return participation;
  }
};
