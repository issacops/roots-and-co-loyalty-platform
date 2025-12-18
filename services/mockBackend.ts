import { 
  User, Wallet, Transaction, Tier, Role, 
  TransactionType, TransactionCategory, 
  FamilyGroup 
} from '../types';
import { TIER_THRESHOLDS, TIER_REWARDS } from '../constants';

export class MockBackendService {
  private users: User[];
  private wallets: Wallet[];
  private transactions: Transaction[];
  private familyGroups: FamilyGroup[];

  constructor(
    users: User[],
    wallets: Wallet[],
    transactions: Transaction[],
    familyGroups: FamilyGroup[]
  ) {
    this.users = [...users];
    this.wallets = [...wallets];
    this.transactions = [...transactions];
    this.familyGroups = [...familyGroups];
  }

  // Helper to find wallet for a user (handles family logic)
  private getEffectiveWallet(userId: string): Wallet | undefined {
    const user = this.users.find(u => u.id === userId);
    if (!user) return undefined;

    let targetUserId = userId;
    
    // If family member, find head
    if (user.familyGroupId) {
      const family = this.familyGroups.find(f => f.id === user.familyGroupId);
      if (family) {
        targetUserId = family.headUserId;
      }
    }

    return this.wallets.find(w => w.userId === targetUserId);
  }

  // Helper to find head user for a user (handles family logic for tier calc)
  private getHeadUser(userId: string): User | undefined {
     const user = this.users.find(u => u.id === userId);
     if (!user) return undefined;
     
     if (user.familyGroupId) {
       const family = this.familyGroups.find(f => f.id === user.familyGroupId);
       if (family) {
         return this.users.find(u => u.id === family.headUserId);
       }
     }
     return user;
  }

  // CORE LOGIC: Add New Patient
  public addPatient(name: string, mobile: string): { success: boolean; message: string; user?: User; updatedData?: any } {
    if (this.users.find(u => u.mobile === mobile)) {
      return { success: false, message: 'Patient with this mobile number already exists.' };
    }

    const newUserId = `user-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name,
      mobile,
      role: Role.PATIENT,
      lifetimeSpend: 0,
      currentTier: Tier.MEMBER,
      joinedAt: new Date().toISOString(),
    };

    const newWallet: Wallet = {
      id: `wallet-${Date.now()}`,
      userId: newUserId,
      balance: 0,
      lastTransactionAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.wallets.push(newWallet);

    return {
      success: true,
      message: 'Patient registered successfully.',
      user: newUser,
      updatedData: this.getData()
    };
  }

  // CORE LOGIC: Process a transaction
  public processTransaction(
    patientId: string, 
    amount: number, 
    category: TransactionCategory,
    type: TransactionType
  ): { success: boolean; message: string; updatedData?: any } {
    
    const user = this.users.find(u => u.id === patientId);
    if (!user) return { success: false, message: 'User not found' };

    const headUser = this.getHeadUser(patientId);
    if (!headUser) return { success: false, message: 'Family head not found' };

    const wallet = this.getEffectiveWallet(patientId);
    if (!wallet) return { success: false, message: 'Wallet not found' };

    // 1. Handle Spend & Tier Upgrade (Only on EARN, or does redemption count as spend? Usually REDEEM does NOT count as spend).
    // The brief says "Spend to unlock status based on Lifetime Spend". 
    // Usually 'Amount Paid' is what counts.
    
    let pointsChange = 0;
    
    if (type === TransactionType.EARN) {
      // Logic A: Update Lifetime Spend of the HEAD USER (Family Pooling)
      // Even if child spends, the Head gets the credit for Tier Status
      headUser.lifetimeSpend += amount;
      
      // Also update individual spend just for record keeping (optional, but good for analytics)
      if (user.id !== headUser.id) {
          user.lifetimeSpend += amount;
      }

      // Logic B: Check Tier Upgrade
      let newTier = headUser.currentTier;
      if (headUser.lifetimeSpend > TIER_THRESHOLDS[Tier.PLATINUM]) {
        newTier = Tier.PLATINUM;
      } else if (headUser.lifetimeSpend > TIER_THRESHOLDS[Tier.GOLD]) {
        newTier = Tier.GOLD;
      }

      if (newTier !== headUser.currentTier) {
        // In a real app, trigger a notification/email here
        headUser.currentTier = newTier;
      }

      // Logic C: Calculate Points
      const rewardRate = TIER_REWARDS[headUser.currentTier];
      pointsChange = Math.floor(amount * rewardRate);

      // Credit Wallet
      wallet.balance += pointsChange;
      
    } else if (type === TransactionType.REDEEM) {
      // Logic D: Cosmetic Lock Check
      if (category !== TransactionCategory.COSMETIC) {
        return { success: false, message: 'Points can only be redeemed for Cosmetic treatments.' };
      }

      if (wallet.balance < amount) {
        return { success: false, message: 'Insufficient points balance.' };
      }

      pointsChange = -amount; // Deduct points
      wallet.balance -= amount;
      
      // Note: Redemption usually doesn't increase lifetime spend.
    }

    wallet.lastTransactionAt = new Date().toISOString();

    // Create Transaction Record
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      walletId: wallet.id,
      amountPaid: type === TransactionType.EARN ? amount : 0,
      pointsEarned: pointsChange,
      category,
      type,
      date: new Date().toISOString(),
      description: `${category} - ${type === TransactionType.EARN ? 'Treatment' : 'Redemption'}`
    };

    this.transactions.unshift(newTx); // Add to top

    return {
      success: true,
      message: type === TransactionType.EARN 
        ? `Processed ₹${amount}. Earned ${pointsChange} pts.` 
        : `Redeemed ${Math.abs(pointsChange)} pts successfully.`,
      updatedData: {
        users: [...this.users],
        wallets: [...this.wallets],
        transactions: [...this.transactions]
      }
    };
  }

  // CORE LOGIC: Link Family Member
  public linkFamilyMember(headUserId: string, memberMobile: string): { success: boolean; message: string; updatedData?: any } {
    const headUser = this.users.find(u => u.id === headUserId);
    const memberUser = this.users.find(u => u.mobile === memberMobile);

    if (!headUser) return { success: false, message: 'Head user not found' };
    if (!memberUser) return { success: false, message: 'Member user not found' };
    if (headUser.id === memberUser.id) return { success: false, message: 'Cannot link user to themselves' };
    if (memberUser.familyGroupId) return { success: false, message: 'User is already part of a family group' };

    // 1. Ensure Head has a Family Group
    let groupId = headUser.familyGroupId;
    if (!groupId) {
        groupId = `fam-${Date.now()}`;
        const newGroup: FamilyGroup = {
            id: groupId,
            headUserId: headUser.id,
            familyName: `${headUser.name.split(' ')[1] || headUser.name}'s Family`
        };
        this.familyGroups.push(newGroup);
        headUser.familyGroupId = groupId;
    }

    // 2. Link Member
    memberUser.familyGroupId = groupId;

    // 3. Merge Wallets
    // Find member's personal wallet (if any) and merge into head's wallet
    const headWallet = this.getEffectiveWallet(headUser.id);
    const memberWallet = this.wallets.find(w => w.userId === memberUser.id);

    // If member has a separate wallet and it's not the same as head's (just in case), merge it
    if (headWallet && memberWallet && headWallet.id !== memberWallet.id) {
        const pointsToTransfer = memberWallet.balance;
        
        // Transfer points
        headWallet.balance += pointsToTransfer;
        memberWallet.balance = 0; // Drain member wallet
        
        // Migrate History: Move all past transactions from member wallet to head wallet
        // so the history is unified in the family view.
        this.transactions.forEach(t => {
            if (t.walletId === memberWallet.id) {
                t.walletId = headWallet.id;
                // Optionally tag them to know they came from merge, but keeping it clean is usually better
            }
        });

        // Record transfer transaction (Optional: purely informational since we moved history)
        if (pointsToTransfer > 0) {
           const transferTx: Transaction = {
               id: `tx-merge-${Date.now()}`,
               walletId: headWallet.id,
               amountPaid: 0,
               pointsEarned: 0, // 0 because we moved the actual earning transactions
               category: TransactionCategory.GENERAL,
               type: TransactionType.EARN,
               date: new Date().toISOString(),
               description: `Family Linked: ${memberUser.name} joined`
           };
           this.transactions.unshift(transferTx);
        }
    }

    // 4. Merge Spend for Tier Status
    // "Spend from children contributes to the Head’s lifetime_spend"
    // We add the member's existing lifetime spend to the head's accumulation immediately
    headUser.lifetimeSpend += memberUser.lifetimeSpend;

    // Check for Tier Upgrade after merge
    let newTier = headUser.currentTier;
    if (headUser.lifetimeSpend > TIER_THRESHOLDS[Tier.PLATINUM]) newTier = Tier.PLATINUM;
    else if (headUser.lifetimeSpend > TIER_THRESHOLDS[Tier.GOLD]) newTier = Tier.GOLD;
    headUser.currentTier = newTier;

    return {
        success: true,
        message: `${memberUser.name} linked to family successfully. Points & History merged.`,
        updatedData: this.getData()
    };
  }

  public getData() {
    return {
      users: this.users,
      wallets: this.wallets,
      transactions: this.transactions,
      familyGroups: this.familyGroups
    };
  }

  public getDashboardStats() {
    const totalLiability = this.wallets.reduce((acc, w) => acc + w.balance, 0);
    const totalRevenue = this.transactions
        .filter(t => t.type === TransactionType.EARN)
        .reduce((acc, t) => acc + t.amountPaid, 0);

    const nextTierCandidates = this.users.filter(u => {
      // Simple logic: within 10% of next tier
      let nextThreshold = 0;
      if (u.currentTier === Tier.MEMBER) nextThreshold = TIER_THRESHOLDS[Tier.GOLD];
      else if (u.currentTier === Tier.GOLD) nextThreshold = TIER_THRESHOLDS[Tier.PLATINUM];
      else return false;

      const remaining = nextThreshold - u.lifetimeSpend;
      return remaining > 0 && remaining <= (nextThreshold * 0.1);
    });

    return {
      totalLiability,
      totalRevenue,
      upgradingSoon: nextTierCandidates.length
    };
  }
}