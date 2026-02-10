import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ExpenseInput, ExpenseRecord, FinancialProfile, InterestRecord, MonthKey, MonthlyLedgerRow } from "@/types/finance";

function nowISO() {
  return new Date().toISOString();
}

function profileRef(uid: string) {
  return doc(db, "users", uid, "profile", "main");
}

function monthRef(uid: string, monthKey: MonthKey) {
  return doc(db, "users", uid, "months", monthKey);
}

function expenseCollection(uid: string) {
  return collection(db, "users", uid, "expenses");
}

function interestRef(uid: string, monthKey: MonthKey) {
  return doc(db, "users", uid, "interestHistory", monthKey);
}

function toProfile(data: Record<string, unknown>): FinancialProfile {
  return {
    initialPrincipal: Number(data.initialPrincipal ?? 0),
    principal: Number(data.principal ?? 0),
    classRate: Number(data.classRate ?? 500),
    monthlyInterestRate: Number(data.monthlyInterestRate ?? 0),
    totalClasses: Number(data.totalClasses ?? 0),
    totalClassIncome: Number(data.totalClassIncome ?? 0),
    totalInterest: Number(data.totalInterest ?? 0),
    totalExpenses: Number(data.totalExpenses ?? 0),
    createdAt: String(data.createdAt ?? nowISO()),
    updatedAt: String(data.updatedAt ?? nowISO())
  };
}

export async function ensureUserProfile(uid: string) {
  const ref = profileRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const createdAt = nowISO();
  const seed: FinancialProfile = {
    initialPrincipal: 40000,
    principal: 40000,
    classRate: 500,
    monthlyInterestRate: 0,
    totalClasses: 0,
    totalClassIncome: 0,
    totalInterest: 0,
    totalExpenses: 0,
    createdAt,
    updatedAt: createdAt
  };

  await setDoc(ref, seed);
}

export function subscribeToProfile(uid: string, onData: (profile: FinancialProfile) => void, onError: (e: Error) => void) {
  return onSnapshot(
    profileRef(uid),
    (snap) => {
      const data = snap.data();
      if (!data) return;
      onData(toProfile(data as Record<string, unknown>));
    },
    onError
  );
}

export function subscribeToMonths(uid: string, onData: (rows: MonthlyLedgerRow[]) => void) {
  const q = query(collection(db, "users", uid, "months"), orderBy("monthKey", "desc"));

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        monthKey: String(d.monthKey ?? docSnap.id) as MonthKey,
        classesTaken: Number(d.classesTaken ?? 0),
        classIncome: Number(d.classIncome ?? 0),
        interestApplied: Boolean(d.interestApplied ?? false),
        interestAmount: Number(d.interestAmount ?? 0),
        expenseTotal: Number(d.expenseTotal ?? 0),
        closingPrincipal: Number(d.closingPrincipal ?? 0),
        updatedAt: String(d.updatedAt ?? nowISO())
      } satisfies MonthlyLedgerRow;
    });

    onData(rows);
  });
}

export async function updateFinancialProfile(uid: string, updates: Partial<Pick<FinancialProfile, "principal" | "classRate" | "monthlyInterestRate">>) {
  await runTransaction(db, async (txn) => {
    const ref = profileRef(uid);
    const snap = await txn.get(ref);
    if (!snap.exists()) throw new Error("Profile not found");
    const current = toProfile(snap.data() as Record<string, unknown>);

    txn.set(ref, { ...current, ...updates, updatedAt: nowISO() });
  });
}

export async function setMonthlyClasses(uid: string, monthKey: MonthKey, classesTaken: number, classRate: number) {
  if (classesTaken < 0) throw new Error("Classes cannot be negative");

  await runTransaction(db, async (txn) => {
    const pRef = profileRef(uid);
    const mRef = monthRef(uid, monthKey);

    const pSnap = await txn.get(pRef);
    const mSnap = await txn.get(mRef);

    if (!pSnap.exists()) throw new Error("Profile not found");

    const profile = toProfile(pSnap.data() as Record<string, unknown>);
    const monthData = (mSnap.data() as Record<string, unknown> | undefined) ?? {};

    const previousClasses = Number(monthData.classesTaken ?? 0);
    const classDelta = classesTaken - previousClasses;
    const classIncomeDelta = classDelta * classRate;
    const principal = profile.principal + classIncomeDelta;

    const updatedMonth: MonthlyLedgerRow = {
      monthKey,
      classesTaken,
      classIncome: classesTaken * classRate,
      interestApplied: Boolean(monthData.interestApplied ?? false),
      interestAmount: Number(monthData.interestAmount ?? 0),
      expenseTotal: Number(monthData.expenseTotal ?? 0),
      closingPrincipal: principal,
      updatedAt: nowISO()
    };

    txn.set(mRef, updatedMonth, { merge: true });

    txn.set(
      pRef,
      {
        ...profile,
        principal,
        totalClasses: profile.totalClasses + classDelta,
        totalClassIncome: profile.totalClassIncome + classIncomeDelta,
        updatedAt: nowISO()
      },
      { merge: true }
    );
  });
}

export async function applyMonthlyInterest(uid: string, monthKey: MonthKey, monthlyInterestRate: number) {
  await runTransaction(db, async (txn) => {
    const pRef = profileRef(uid);
    const mRef = monthRef(uid, monthKey);
    const iRef = interestRef(uid, monthKey);

    const pSnap = await txn.get(pRef);
    const mSnap = await txn.get(mRef);
    const iSnap = await txn.get(iRef);

    if (!pSnap.exists()) throw new Error("Profile not found");
    if (iSnap.exists()) throw new Error(`Interest already applied for ${monthKey}`);

    const profile = toProfile(pSnap.data() as Record<string, unknown>);
    const monthData = (mSnap.data() as Record<string, unknown> | undefined) ?? {};

    if (Boolean(monthData.interestApplied ?? false)) {
      throw new Error(`Interest already applied for ${monthKey}`);
    }

    const interestAmount = (profile.principal * monthlyInterestRate) / 100;
    const principal = profile.principal + interestAmount;

    txn.set(
      mRef,
      {
        monthKey,
        classesTaken: Number(monthData.classesTaken ?? 0),
        classIncome: Number(monthData.classIncome ?? 0),
        interestApplied: true,
        interestAmount,
        expenseTotal: Number(monthData.expenseTotal ?? 0),
        closingPrincipal: principal,
        updatedAt: nowISO()
      },
      { merge: true }
    );

    const interestRecord: InterestRecord = {
      monthKey,
      interestAmount,
      appliedAt: nowISO(),
      rateApplied: monthlyInterestRate
    };
    txn.set(iRef, interestRecord);

    txn.set(
      pRef,
      {
        ...profile,
        principal,
        totalInterest: profile.totalInterest + interestAmount,
        updatedAt: nowISO()
      },
      { merge: true }
    );
  });
}

export async function addExpense(uid: string, input: ExpenseInput) {
  if (input.amount <= 0) throw new Error("Expense amount must be positive");

  const monthKey = input.dateISO.slice(0, 7) as MonthKey;

  await runTransaction(db, async (txn) => {
    const pRef = profileRef(uid);
    const mRef = monthRef(uid, monthKey);
    const eRef = doc(expenseCollection(uid));

    const pSnap = await txn.get(pRef);
    const mSnap = await txn.get(mRef);
    if (!pSnap.exists()) throw new Error("Profile not found");

    const profile = toProfile(pSnap.data() as Record<string, unknown>);
    const monthData = (mSnap.data() as Record<string, unknown> | undefined) ?? {};
    const principal = profile.principal - input.amount;

    const expense: Omit<ExpenseRecord, "id"> = {
      amount: input.amount,
      category: input.category,
      dateISO: input.dateISO,
      monthKey,
      createdAt: nowISO()
    };

    txn.set(eRef, {
      ...expense,
      createdAtServer: serverTimestamp()
    });

    txn.set(
      mRef,
      {
        monthKey,
        classesTaken: Number(monthData.classesTaken ?? 0),
        classIncome: Number(monthData.classIncome ?? 0),
        interestApplied: Boolean(monthData.interestApplied ?? false),
        interestAmount: Number(monthData.interestAmount ?? 0),
        expenseTotal: Number(monthData.expenseTotal ?? 0) + input.amount,
        closingPrincipal: principal,
        updatedAt: nowISO()
      },
      { merge: true }
    );

    txn.set(
      pRef,
      {
        ...profile,
        principal,
        totalExpenses: profile.totalExpenses + input.amount,
        updatedAt: nowISO()
      },
      { merge: true }
    );
  });
}
