export enum Role {
  PATIENT = 'PATIENT',
  ADMIN = 'ADMIN', // Doctor/Receptionist
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum Tier {
  MEMBER = 'MEMBER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export enum TransactionCategory {
  GENERAL = 'GENERAL',
  COSMETIC = 'COSMETIC',
  HYGIENE = 'HYGIENE'
}

export enum TransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM'
}

export interface User {
  id: string;
  mobile: string;
  name: string;
  role: Role;
  familyGroupId?: string;
  lifetimeSpend: number;
  currentTier: Tier;
  joinedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number; // Cosmetic Credit
  lastTransactionAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  amountPaid: number;
  pointsEarned: number; // Positive for earn, negative for redeem
  category: TransactionCategory;
  type: TransactionType;
  date: string;
  description: string;
}

export interface FamilyGroup {
  id: string;
  headUserId: string;
  familyName: string;
}

// UI State Types
export type ViewMode = 'MOBILE_PATIENT' | 'DESKTOP_KIOSK';

export interface AppState {
  users: User[];
  wallets: Wallet[];
  transactions: Transaction[];
  familyGroups: FamilyGroup[];
  currentUser: User | null;
}
