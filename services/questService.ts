/**
 * Quest Service
 * 
 * Orchestration layer for Savings Quests.
 * Manages the full lifecycle: Creation, Enrollment, Tracking, and Completion.
 */

import { Quest, QuestStatus, UserQuestParticipation } from '@/types/quest';
import * as SavingsLib from '@/lib/savings/lifecycle';

// Mock DB for demonstration
let quests: Quest[] = [
  {
    id: 'q_1',
    title: '30-Day Savings Sprint',
    description: 'Save daily for 30 days to earn a shared USDC reward pool. Discipline is the key to financial freedom.',
    sponsorAddress: 'GB...SPONSOR',
    rewardAmount: 500,
    rewardToken: 'USDC',
    status: 'ACTIVE',
    escrowId: 'tw_escrow_1',
    escrowStatus: 'FUNDED',
    milestones: [
      { id: 'ms_1', description: 'Week 1 Goal', targetAmount: 50, deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, isCompleted: false },
      { id: 'ms_2', description: 'Week 2 Goal', targetAmount: 100, deadline: Date.now() + 14 * 24 * 60 * 60 * 1000, isCompleted: false }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'q_2',
    title: 'Student Saver Quest',
    description: 'A special quest for students to build their first emergency fund. Sponsored by TrustQuest Education.',
    sponsorAddress: 'GB...EDU',
    rewardAmount: 250,
    rewardToken: 'XLM',
    status: 'ACTIVE',
    escrowId: 'tw_escrow_2',
    escrowStatus: 'FUNDED',
    milestones: [
      { id: 'ms_3', description: 'Initial Deposit', targetAmount: 10, deadline: Date.now() + 2 * 24 * 60 * 60 * 1000, isCompleted: false },
      { id: 'ms_4', description: 'Halfway Mark', targetAmount: 50, deadline: Date.now() + 15 * 24 * 60 * 60 * 1000, isCompleted: false }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];
let participations: UserQuestParticipation[] = [];

/**
 * Creates a new savings quest and initializes its escrow
 */
export async function createChallenge(
  title: string, 
  description: string, 
  sponsorAddress: string, 
  rewardAmount: number,
  rewardToken: string,
  milestoneTargets: number[],
  escrowId?: string
): Promise<Quest> {
  
  // 1. Initialize Quest Object
  const newQuest: Quest = {
    id: `q_${Date.now()}`,
    title,
    description,
    sponsorAddress,
    rewardAmount,
    rewardToken,
    status: escrowId ? 'ACTIVE' : 'DRAFT',
    escrowId,
    escrowStatus: escrowId ? 'FUNDED' : 'PENDING',
    milestones: milestoneTargets.map((target, index) => ({
      id: `ms_${index}`,
      description: `Save ${target} ${rewardToken}`,
      targetAmount: target,
      deadline: Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000,
      isCompleted: false
    })),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  quests.push(newQuest);
  return newQuest;
}

/**
 * Fetches all available quests
 */
export function getAllChallenges(): Quest[] {
  return quests;
}

/**
 * Joins a user to a quest
 */
export async function joinChallenge(questId: string, userAddress: string): Promise<UserQuestParticipation> {
  const quest = quests.find(q => q.id === questId);
  if (!quest) throw new Error('Quest not found');
  
  if (!SavingsLib.canJoinQuest(quest, 0)) { // 0 is mock count
    throw new Error('Quest is not joinable at this time');
  }

  const participation = SavingsLib.initializeParticipation(quest, userAddress);
  const existing = participations.find(p => p.questId === questId && p.userAddress === userAddress);
  if (existing) return existing;

  participations.push(participation);
  
  return participation;
}

/**
 * Updates progress for a user's quest
 */
export async function updateProgress(questId: string, userAddress: string, newBalance: number): Promise<UserQuestParticipation> {
  const pIdx = participations.findIndex(p => p.questId === questId && p.userAddress === userAddress);
  if (pIdx === -1) throw new Error('Participation not found');

  // For demo, we just update the balance directly
  participations[pIdx].currentBalance = newBalance;
  participations[pIdx].updatedAt = Date.now(); // Note: adding updatedAt to UserQuestParticipation if needed or just updating balance
  
  return participations[pIdx];
}
