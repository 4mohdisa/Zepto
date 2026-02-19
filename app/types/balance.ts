import type { AccountType } from '@/data/account-types';

export type { AccountType };

export interface AccountBalance {
  id: number;
  user_id: string;
  account_type: AccountType;
  current_balance: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface BalanceSummary {
  account_type: AccountType;
  expected_balance: number;
  actual_balance: number;
  difference: number;
  last_updated: string;
}

export interface CreateBalanceData {
  account_type: AccountType;
  current_balance: number;
}

export interface UpdateBalanceData {
  current_balance: number;
}
