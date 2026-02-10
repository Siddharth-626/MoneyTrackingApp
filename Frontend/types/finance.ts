export type MonthKey = `${number}-${string}`;

export type FinancialProfile = {
  initialPrincipal: number;
  principal: number;
  classRate: number;
  monthlyInterestRate: number;
  totalClasses: number;
  totalClassIncome: number;
  totalInterest: number;
  totalExpenses: number;
  createdAt: string;
  updatedAt: string;
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
  dateISO: string;
  monthKey: MonthKey;
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
  totalClasses: number;
  totalClassIncome: number;
  totalInterest: number;
  totalExpenses: number;
  netGrowth: number;
};

export type ExpenseInput = {
  amount: number;
  category: string;
  dateISO: string;
};
