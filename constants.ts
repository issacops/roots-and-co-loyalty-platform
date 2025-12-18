import { Role, Tier, User, FamilyGroup, Wallet, Transaction, TransactionCategory, TransactionType } from './types';

// Business Logic Configuration
export const TIER_THRESHOLDS = {
  [Tier.MEMBER]: 0,
  [Tier.GOLD]: 10000,
  [Tier.PLATINUM]: 50000,
};

export const TIER_REWARDS = {
  [Tier.MEMBER]: 0.02,   // 2%
  [Tier.GOLD]: 0.05,     // 5%
  [Tier.PLATINUM]: 0.08, // 8%
};

// Initial Mock Data
export const INITIAL_FAMILIES: FamilyGroup[] = [
  {
    id: 'fam-1',
    headUserId: 'user-1',
    familyName: 'The Menon Family',
  }
];

export const INITIAL_USERS: User[] = [
  // Family Head (Patient)
  {
    id: 'user-1',
    mobile: '9876543210',
    name: 'Rohan Menon',
    role: Role.PATIENT,
    familyGroupId: 'fam-1',
    lifetimeSpend: 42000,
    currentTier: Tier.GOLD,
    joinedAt: '2023-01-15T10:00:00Z',
  },
  // Family Member (Patient - Spouse)
  {
    id: 'user-2',
    mobile: '9876543211',
    name: 'Anjali Menon',
    role: Role.PATIENT,
    familyGroupId: 'fam-1',
    lifetimeSpend: 5000,
    currentTier: Tier.MEMBER,
    joinedAt: '2023-02-20T14:00:00Z',
  },
  // Doctor (Admin)
  {
    id: 'doc-1',
    mobile: 'admin',
    name: 'Dr. Bastin Cherian',
    role: Role.ADMIN,
    lifetimeSpend: 0,
    currentTier: Tier.MEMBER,
    joinedAt: '2022-11-01T09:00:00Z',
  },
  // Doctor (Partner)
  {
    id: 'doc-2',
    mobile: 'admin2',
    name: 'Dr. Alda Davis',
    role: Role.ADMIN,
    lifetimeSpend: 0,
    currentTier: Tier.MEMBER,
    joinedAt: '2023-01-01T09:00:00Z',
  }
];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'wallet-1',
    userId: 'user-1', // Head of household holds the wallet
    balance: 2400,
    lastTransactionAt: '2023-10-05T16:30:00Z',
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    walletId: 'wallet-1',
    amountPaid: 15000,
    pointsEarned: 750, // 5% of 15000 (Gold)
    category: TransactionCategory.GENERAL,
    type: TransactionType.EARN,
    date: '2023-09-01T10:00:00Z',
    description: 'Root Canal Treatment',
  },
  {
    id: 'tx-2',
    walletId: 'wallet-1',
    amountPaid: 27000,
    pointsEarned: 1350,
    category: TransactionCategory.COSMETIC, // Earn points on cosmetic too
    type: TransactionType.EARN,
    date: '2023-10-05T16:30:00Z',
    description: 'Invisalign Installment 1',
  }
];
