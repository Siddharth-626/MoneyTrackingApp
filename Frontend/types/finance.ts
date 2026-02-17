export type MonthKey = `${number}-${string}`;

export type FinancialProfile = {
  initialPrincipal: number;
  principal: number;
  classRate: number;
  monthlyInterestRate: number;
  /** Interest rate per class (%) used for auto-calculated earnings. */
  perClassInterestRate?: number;
  /** Net profit bucket (earnings - expenses) that can be compounded into principal. */
  netProfit?: number;
  goals?: {
    monthlyIncomeGoal?: number;
  };
  totalClasses: number;
  totalClassIncome: number;
  totalInterest: number;
  totalExpenses: number;
  createdAt: string;
  updatedAt: string;
};

export type ClassEntry = {
  /** YYYY-MM-DD */
  dateISO: string;
  monthKey: MonthKey;
  earning: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type CompoundingRecord = {
  id: string;
  dateISO: string;
  amountAdded: number;
  createdAt: string;
};

export type MonthlyLedgerRow = {
  monthKey: MonthKey;
  classesTaken: number;
  classIncome: number;
  interestApplied: boolean;
  interestAmount: number;
  expenseTotal: number;
  closingPrincipal: number;
  updatedAt: string;
};

export type ExpenseRecord = {
  id: string;
  amount: number;
  category: string;
  customCategory?: string;
  dateISO: string;
  monthKey: MonthKey;
  notes?: string;
  createdAt: string;
};

export type InterestRecord = {
  monthKey: MonthKey;
  interestAmount: number;
  appliedAt: string;
  rateApplied: number;
};

export type DashboardMetrics = {
  currentPrincipal: number;
  netProfit: number;
  totalValue: number;
  totalClasses: number;
  totalClassIncome: number;
  totalInterest: number;
  totalExpenses: number;
  totalEarnings: number;
  netGrowth: number;
  roiPct: number;
};

export type ExpenseInput = {
  amount: number;
  category: string;
  customCategory?: string;
  dateISO: string;
  notes?: string;
};

export type ClassEntryInput = {
  dateISO: string;
  note?: string;
};
