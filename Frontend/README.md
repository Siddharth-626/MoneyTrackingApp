# Money Tracking App (Next.js + Firebase)

Production-grade personal finance tracker for principal lending, class income, monthly compound interest, and expenses.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Firebase Auth (Google OAuth)
- Firestore

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and set Firebase values.
3. Start development server:
   ```bash
   npm run dev
   ```
4. Deploy Firestore rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## Firestore Schema

- `users/{uid}/profile/main`
  - `initialPrincipal: number`
  - `principal: number`
  - `classRate: number`
  - `monthlyInterestRate: number`
  - `totalClasses: number`
  - `totalClassIncome: number`
  - `totalInterest: number`
  - `totalExpenses: number`
  - `createdAt: string`
  - `updatedAt: string`

- `users/{uid}/months/{YYYY-MM}`
  - `monthKey: string`
  - `classesTaken: number`
  - `classIncome: number`
  - `interestApplied: boolean`
  - `interestAmount: number`
  - `expenseTotal: number`
  - `closingPrincipal: number`
  - `updatedAt: string`

- `users/{uid}/expenses/{expenseId}`
  - `amount: number`
  - `category: string`
  - `dateISO: string`
  - `monthKey: string`
  - `createdAt: string`
  - `createdAtServer: timestamp`

- `users/{uid}/interestHistory/{YYYY-MM}`
  - `monthKey: string`
  - `interestAmount: number`
  - `rateApplied: number`
  - `appliedAt: string`

## Business Rules
- Class income updates are incremental and editable per month via transactions.
- Monthly interest can only be applied once per month.
- Expenses are append-only and auditable.
- User data is isolated by uid path and security rules.

## Folder Structure
- `app/` routes (`signin`, `dashboard`, `monthly`)
- `components/` auth, dashboard, monthly UI
- `contexts/` auth session provider
- `hooks/` state + Firestore subscription hooks
- `lib/firebase/` Firebase bootstrap/auth helpers
- `lib/firestore/` transaction-safe repository
- `lib/finance/` calculations/service exports
- `types/` domain types
