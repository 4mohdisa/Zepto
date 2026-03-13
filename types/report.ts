export type ReportType = 'financial_summary';
export type ReportStatus = 'pending' | 'completed' | 'failed';
export type ReportPeriodType = 'month' | 'quarter' | 'year' | 'custom';

export interface ReportFilters {
  accountType?: string;
  categories?: number[];
  merchants?: string[];
  [key: string]: any;
}

export interface ReportSummary {
  income: number;
  expenses: number;
  netBalance: number;
  savingsRate: number;
  totalBalance: number;
  transactionCount: number;
}

export interface AccountBalanceSnapshot {
  account_type: string;
  current_balance: number;
}

export interface CategorySnapshot {
  name: string;
  total: number;
  percentage?: number;
}

export interface MerchantSnapshot {
  id: string;
  name: string;
  total: number;
  transactionCount: number;
}

export interface RecurringSnapshot {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  type: string;
}

export interface TransactionSnapshot {
  id: number;
  name: string;
  amount: number;
  date: string;
  type: string;
  category_name?: string;
}

export interface MonthComparison {
  currentIncome: number;
  previousIncome: number;
  incomeChange: number;
  incomeChangePercent: number;
  currentExpenses: number;
  previousExpenses: number;
  expensesChange: number;
  expensesChangePercent: number;
  currentNetBalance: number;
  previousNetBalance: number;
  netBalanceChange: number;
  netBalanceChangePercent: number;
}

export interface ReportInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
}

export interface ReportSnapshot {
  period: string;
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  summary: ReportSummary;
  balancesByAccount: AccountBalanceSnapshot[];
  topCategories: CategorySnapshot[];
  topMerchants: MerchantSnapshot[];
  recurringCommitments: RecurringSnapshot[];
  largestExpenses: TransactionSnapshot[];
  largestTransactions: TransactionSnapshot[];
  comparison?: MonthComparison;
  insights: ReportInsight[];
  generatedAt: string;
}

export interface Report {
  id: string;
  user_id: string;
  name: string;
  report_type: ReportType;
  status: ReportStatus;
  period_type: ReportPeriodType;
  date_from: string;
  date_to: string;
  filters_json: ReportFilters;
  summary_json: ReportSummary;
  snapshot_json: ReportSnapshot;
  insights_json: ReportInsight[];
  generated_at: string;
  created_at: string;
  updated_at: string;
  last_exported_at?: string;
  export_count: number;
}

export interface CreateReportInput {
  name?: string;
  reportType?: ReportType;
  periodType: ReportPeriodType;
  dateFrom: string;
  dateTo: string;
  filters?: ReportFilters;
}

export interface GenerateReportResult {
  success: boolean;
  report?: Report;
  error?: string;
}
