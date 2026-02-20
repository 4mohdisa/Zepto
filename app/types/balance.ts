import type { AccountType } from '@/data/account-types';

export type { AccountType };

export interface AccountBalance {
  id: number;
  user_id: string;
  account_type: AccountType;
  current_balance: number;
  effective_date: string;  // Date from which this balance is valid
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

export interface CurrentBalanceSummary {
  account_type: AccountType;
  starting_balance: number;      // Balance as of effective_date
  effective_date: string;        // Date from which balance is valid
  income_after: number;          // Income transactions after effective_date
  expenses_after: number;        // Expense transactions after effective_date
  current_balance: number;       // Calculated: starting + income - expenses
}

export interface CreateBalanceData {
  account_type: AccountType;
  current_balance: number;
  effective_date?: string;  // Optional, defaults to today
}

export interface UpdateBalanceData {
  current_balance: number;
  effective_date?: string;
}
