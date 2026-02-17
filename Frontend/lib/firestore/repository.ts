import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
  where,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  ClassEntry,
  ClassEntryInput,
  CompoundingRecord,
  ExpenseInput,
  ExpenseRecord,
  FinancialProfile,
  InterestRecord,
  MonthKey,
  MonthlyLedgerRow
} from "@/types/finance";

function nowISO() {
  return new Date().toISOString();
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

function classEarningFromProfile(profile: FinancialProfile) {
  return Number(profile.classRate ?? 0);
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

function classEntriesCollection(uid: string) {
  return collection(db, "users", uid, "classEntries");
}

function classEntryRef(uid: string, dateISO: string) {
  // Use dateISO (YYYY-MM-DD) as document ID to guarantee uniqueness per day.
  return doc(db, "users", uid, "classEntries", dateISO);
}

function compoundingCollection(uid: string) {
  return collection(db, "users", uid, "compoundingHistory");
}

function interestRef(uid: string, monthKey: MonthKey) {
  return doc(db, "users", uid, "interestHistory", monthKey);
}

function toProfile(data: Record<string, unknown>): FinancialProfile {
  const goalsRaw = (data.goals as Record<string, unknown> | undefined) ?? {};
  return {
    initialPrincipal: Number(data.initialPrincipal ?? 0),
    principal: Number(data.principal ?? 0),
    classRate: Number(data.classRate ?? 500),
    monthlyInterestRate: Number(data.monthlyInterestRate ?? 0),
    perClassInterestRate: Number(data.perClassInterestRate ?? 0),
    netProfit: Number(data.netProfit ?? 0),
    goals: {
      monthlyIncomeGoal: Number(goalsRaw.monthlyIncomeGoal ?? 0)
    },
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
    perClassInterestRate: 0,
    netProfit: 0,
    goals: {
      monthlyIncomeGoal: 0
    },
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

export function subscribeToMonths(uid: string, onData: (rows: MonthlyLedgerRow[]) => void, onError: (e: Error) => void = () => {}) {
  const q = query(collection(db, "users", uid, "months"), orderBy("monthKey", "desc"));

  return onSnapshot(
    q,
    (snap) => {
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
    },
    onError
  );
}

export async function updateFinancialProfile(uid: string, updates: Partial<Pick<FinancialProfile, "principal" | "classRate" | "monthlyInterestRate">>) {
  await runTransaction(db, async (txn) => {
    const ref = profileRef(uid);
    const snap = await txn.get(ref);
    if (!snap.exists()) throw new Error("Profile not found");
    const current = toProfile(snap.data() as Record<string, unknown>);

    txn.set(ref, stripUndefined({ ...current, ...updates, updatedAt: nowISO() }));
  });
}

export async function updateFinancialProfileV2(
  uid: string,
  updates: Partial<Pick<FinancialProfile, "principal" | "classRate" | "monthlyInterestRate" | "perClassInterestRate" | "goals">>
) {
  await runTransaction(db, async (txn) => {
    const ref = profileRef(uid);
    const snap = await txn.get(ref);
    if (!snap.exists()) throw new Error("Profile not found");
    const current = toProfile(snap.data() as Record<string, unknown>);

    const mergedGoals = {
      ...current.goals,
      ...updates.goals
    };

    txn.set(
      ref,
      stripUndefined({
        ...current,
        ...updates,
        goals: mergedGoals,
        updatedAt: nowISO()
      }),
      { merge: true }
    );
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

    const currentNetProfit = Number(profile.netProfit ?? 0);

    const previousClasses = Number(monthData.classesTaken ?? 0);
    const classDelta = classesTaken - previousClasses;
    const classIncomeDelta = classDelta * classRate;
    const nextNetProfit = currentNetProfit + classIncomeDelta;
    const closingPrincipal = profile.principal + nextNetProfit;

    const updatedMonth: MonthlyLedgerRow = {
      monthKey,
      classesTaken,
      classIncome: classesTaken * classRate,
      interestApplied: Boolean(monthData.interestApplied ?? false),
      interestAmount: Number(monthData.interestAmount ?? 0),
      expenseTotal: Number(monthData.expenseTotal ?? 0),
      closingPrincipal,
      updatedAt: nowISO()
    };

    txn.set(mRef, updatedMonth, { merge: true });

    txn.set(
      pRef,
      {
        ...profile,
        netProfit: nextNetProfit,
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

    if (!pSnap.exists()) throw new Error("Profile not found");

    const profile = toProfile(pSnap.data() as Record<string, unknown>);
    const monthData = (mSnap.data() as Record<string, unknown> | undefined) ?? {};

    const currentNetProfit = Number(profile.netProfit ?? 0);

    let currentPrincipal = profile.principal;
    let currentTotalInterest = profile.totalInterest;

    // Check if interest was already applied for this month
    const alreadyApplied = Boolean(monthData.interestApplied ?? false);

    if (alreadyApplied) {
      const previousInterest = Number(monthData.interestAmount ?? 0);
      // Revert the previous interest from principal and total stats
      currentPrincipal -= previousInterest;
      currentTotalInterest -= previousInterest;
    }

    // Calculate new interest on the adjusted principal
    const interestAmount = (currentPrincipal * monthlyInterestRate) / 100;
    const newPrincipal = currentPrincipal + interestAmount;

    txn.set(
      mRef,
      {
        monthKey,
        classesTaken: Number(monthData.classesTaken ?? 0),
        classIncome: Number(monthData.classIncome ?? 0),
        interestApplied: true,
        interestAmount,
        expenseTotal: Number(monthData.expenseTotal ?? 0),
        closingPrincipal: newPrincipal + currentNetProfit,
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
        principal: newPrincipal,
        totalInterest: currentTotalInterest + interestAmount,
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
    const currentNetProfit = Number(profile.netProfit ?? 0);
    const nextNetProfit = currentNetProfit - input.amount;

    const expense = stripUndefined({
      amount: input.amount,
      category: input.category,
      customCategory: input.customCategory,
      dateISO: input.dateISO,
      monthKey,
      notes: input.notes,
      createdAt: nowISO()
    });

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
        closingPrincipal: profile.principal + nextNetProfit,
        updatedAt: nowISO()
      },
      { merge: true }
    );

    txn.set(
      pRef,
      {
        ...profile,
        netProfit: nextNetProfit,
        totalExpenses: profile.totalExpenses + input.amount,
        updatedAt: nowISO()
      },
      { merge: true }
    );
  });
}

export function subscribeToExpenses(uid: string, onData: (rows: ExpenseRecord[]) => void, onError: (e: Error) => void = () => {}) {
  const q = query(expenseCollection(uid), orderBy("dateISO", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          amount: Number(data.amount ?? 0),
          category: String(data.category ?? "Misc"),
          customCategory: data.customCategory == null ? undefined : String(data.customCategory),
          dateISO: String(data.dateISO ?? ""),
          monthKey: String(data.monthKey ?? "") as MonthKey,
          notes: data.notes == null ? undefined : String(data.notes),
          createdAt: String(data.createdAt ?? nowISO())
        } satisfies ExpenseRecord;
      });
      onData(rows);
    },
    onError
  );
}

export function subscribeToClassEntriesInRange(
  uid: string,
  startDateISO: string,
  endDateISO: string,
  onData: (rows: ClassEntry[]) => void,
  onError: (e: Error) => void = () => {}
) {
  const q = query(
    classEntriesCollection(uid),
    orderBy("dateISO", "asc"),
    where("dateISO", ">=", startDateISO),
    where("dateISO", "<=", endDateISO)
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          dateISO: String(data.dateISO ?? d.id),
          monthKey: String(data.monthKey ?? String(d.id).slice(0, 7)) as MonthKey,
          earning: Number(data.earning ?? 0),
          note: data.note == null ? undefined : String(data.note),
          createdAt: String(data.createdAt ?? nowISO()),
          updatedAt: String(data.updatedAt ?? nowISO())
        } satisfies ClassEntry;
      });
      onData(rows);
    },
    onError
  );
}

export function subscribeToClassEntries(uid: string, onData: (rows: ClassEntry[]) => void, onError: (e: Error) => void = () => {}) {
  const q = query(classEntriesCollection(uid), orderBy("dateISO", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          dateISO: String(data.dateISO ?? d.id),
          monthKey: String(data.monthKey ?? String(d.id).slice(0, 7)) as MonthKey,
          earning: Number(data.earning ?? 0),
          note: data.note == null ? undefined : String(data.note),
          createdAt: String(data.createdAt ?? nowISO()),
          updatedAt: String(data.updatedAt ?? nowISO())
        } satisfies ClassEntry;
      });
      onData(rows);
    },
    onError
  );
}

export async function toggleClassEntry(uid: string, input: ClassEntryInput) {
  const monthKey = input.dateISO.slice(0, 7) as MonthKey;

  await runTransaction(db, async (txn) => {
    const pRef = profileRef(uid);
    const mRef = monthRef(uid, monthKey);
    const cRef = classEntryRef(uid, input.dateISO);

    const pSnap = await txn.get(pRef);
    const mSnap = await txn.get(mRef);
    const cSnap = await txn.get(cRef);
    if (!pSnap.exists()) throw new Error("Profile not found");

    const profile = toProfile(pSnap.data() as Record<string, unknown>);
    const monthData = (mSnap.data() as Record<string, unknown> | undefined) ?? {};

    const currentNetProfit = Number(profile.netProfit ?? 0);
    const previousMonthClasses = Number(monthData.classesTaken ?? 0);
    const previousMonthIncome = Number(monthData.classIncome ?? 0);

    if (cSnap.exists()) {
      const existing = cSnap.data() as Record<string, unknown>;
      const earning = Number(existing.earning ?? 0);

      const nextNetProfit = currentNetProfit - earning;
      txn.delete(cRef);

      txn.set(
        mRef,
        {
          monthKey,
          classesTaken: Math.max(0, previousMonthClasses - 1),
          classIncome: Math.max(0, previousMonthIncome - earning),
          interestApplied: Boolean(monthData.interestApplied ?? false),
          interestAmount: Number(monthData.interestAmount ?? 0),
          expenseTotal: Number(monthData.expenseTotal ?? 0),
          closingPrincipal: profile.principal + nextNetProfit,
          updatedAt: nowISO()
        },
        { merge: true }
      );

      txn.set(
        pRef,
        {
          ...profile,
          netProfit: nextNetProfit,
          totalClasses: Math.max(0, profile.totalClasses - 1),
          totalClassIncome: Math.max(0, profile.totalClassIncome - earning),
          updatedAt: nowISO()
        },
        { merge: true }
      );

      return;
    }

    const earning = classEarningFromProfile(profile);
    const createdAt = nowISO();
    const entry: ClassEntry = {
      dateISO: input.dateISO,
      monthKey,
      earning,
      note: input.note,
      createdAt,
      updatedAt: createdAt
    };

    const nextNetProfit = currentNetProfit + earning;

    txn.set(cRef, stripUndefined(entry));
    txn.set(
      mRef,
      {
        monthKey,
        classesTaken: previousMonthClasses + 1,
        classIncome: previousMonthIncome + earning,
        interestApplied: Boolean(monthData.interestApplied ?? false),
        interestAmount: Number(monthData.interestAmount ?? 0),
        expenseTotal: Number(monthData.expenseTotal ?? 0),
        closingPrincipal: profile.principal + nextNetProfit,
        updatedAt: nowISO()
      },
      { merge: true }
    );

    txn.set(
      pRef,
      {
        ...profile,
        netProfit: nextNetProfit,
        totalClasses: profile.totalClasses + 1,
        totalClassIncome: profile.totalClassIncome + earning,
        updatedAt: nowISO()
      },
      { merge: true }
    );
  });
}

export async function clearAllClassData(uid: string) {
  const pRef = profileRef(uid);
  const classSnap = await getDocs(classEntriesCollection(uid));

  const classDocs = classSnap.docs;
  if (classDocs.length === 0) return;

  const profileSnap = await getDoc(pRef);
  if (!profileSnap.exists()) throw new Error("Profile not found");

  const profile = toProfile(profileSnap.data() as Record<string, unknown>);

  const monthAgg = new Map<MonthKey, { count: number; earning: number }>();
  let totalRemovedEarning = 0;

  for (const d of classDocs) {
    const data = d.data() as Record<string, unknown>;
    const dateISO = String(data.dateISO ?? d.id);
    const monthKey = String(data.monthKey ?? dateISO.slice(0, 7)) as MonthKey;
    const earning = Number(data.earning ?? 0);

    totalRemovedEarning += earning;
    const current = monthAgg.get(monthKey) ?? { count: 0, earning: 0 };
    monthAgg.set(monthKey, {
      count: current.count + 1,
      earning: current.earning + earning
    });
  }

  const monthsSnap = await getDocs(collection(db, "users", uid, "months"));
  const monthsByKey = new Map<string, Record<string, unknown>>();
  for (const m of monthsSnap.docs) {
    monthsByKey.set(m.id, m.data() as Record<string, unknown>);
  }

  const totalOps = classDocs.length + monthAgg.size + 1;
  if (totalOps > 450) {
    throw new Error("Too many class records to clear in one operation. Please clear in smaller batches.");
  }

  const nextNetProfit = Number(profile.netProfit ?? 0) - totalRemovedEarning;
  const nextTotalClasses = Math.max(0, Number(profile.totalClasses ?? 0) - classDocs.length);
  const nextTotalClassIncome = Math.max(0, Number(profile.totalClassIncome ?? 0) - totalRemovedEarning);

  const batch = writeBatch(db);
  for (const d of classDocs) {
    batch.delete(d.ref);
  }

  for (const [monthKey, removed] of monthAgg.entries()) {
    const monthData = monthsByKey.get(monthKey) ?? {};
    const mRef = monthRef(uid, monthKey);

    batch.set(
      mRef,
      {
        monthKey,
        classesTaken: Math.max(0, Number(monthData.classesTaken ?? 0) - removed.count),
        classIncome: Math.max(0, Number(monthData.classIncome ?? 0) - removed.earning),
        interestApplied: Boolean(monthData.interestApplied ?? false),
        interestAmount: Number(monthData.interestAmount ?? 0),
        expenseTotal: Number(monthData.expenseTotal ?? 0),
        closingPrincipal: profile.principal + nextNetProfit,
        updatedAt: nowISO()
      },
      { merge: true }
    );
  }

  batch.set(
    pRef,
    {
      ...profile,
      netProfit: nextNetProfit,
      totalClasses: nextTotalClasses,
      totalClassIncome: nextTotalClassIncome,
      updatedAt: nowISO()
    },
    { merge: true }
  );

  await batch.commit();
}

export async function updateClassEntryNote(uid: string, dateISO: string, note: string) {
  await runTransaction(db, async (txn) => {
    const ref = classEntryRef(uid, dateISO);
    const snap = await txn.get(ref);
    if (!snap.exists()) throw new Error("Class entry not found");
    const current = snap.data() as Record<string, unknown>;

    txn.set(
      ref,
      {
        ...current,
        note,
        updatedAt: nowISO()
      },
      { merge: true }
    );
  });
}

export async function addNetProfitToPrincipal(uid: string) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const monthKey = todayISO.slice(0, 7) as MonthKey;

  await runTransaction(db, async (txn) => {
    const pRef = profileRef(uid);
    const mRef = monthRef(uid, monthKey);
    const cRef = doc(compoundingCollection(uid));

    const pSnap = await txn.get(pRef);
    const mSnap = await txn.get(mRef);
    if (!pSnap.exists()) throw new Error("Profile not found");

    const profile = toProfile(pSnap.data() as Record<string, unknown>);
    const monthData = (mSnap.data() as Record<string, unknown> | undefined) ?? {};

    const amount = Number(profile.netProfit ?? 0);
    if (amount <= 0) throw new Error("No net profit to compound");

    const newPrincipal = profile.principal + amount;

    txn.set(
      pRef,
      {
        ...profile,
        principal: newPrincipal,
        netProfit: 0,
        updatedAt: nowISO()
      },
      { merge: true }
    );

    txn.set(
      mRef,
      {
        monthKey,
        classesTaken: Number(monthData.classesTaken ?? 0),
        classIncome: Number(monthData.classIncome ?? 0),
        interestApplied: Boolean(monthData.interestApplied ?? false),
        interestAmount: Number(monthData.interestAmount ?? 0),
        expenseTotal: Number(monthData.expenseTotal ?? 0),
        closingPrincipal: newPrincipal,
        updatedAt: nowISO()
      },
      { merge: true }
    );

    const record: Omit<CompoundingRecord, "id"> = {
      dateISO: todayISO,
      amountAdded: amount,
      createdAt: nowISO()
    };
    txn.set(cRef, record);
  });
}

export function subscribeToCompoundingHistory(uid: string, onData: (rows: CompoundingRecord[]) => void, onError: (e: Error) => void = () => {}) {
  const q = query(compoundingCollection(uid), orderBy("createdAt", "desc"), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          dateISO: String(data.dateISO ?? ""),
          amountAdded: Number(data.amountAdded ?? 0),
          createdAt: String(data.createdAt ?? nowISO())
        } satisfies CompoundingRecord;
      });
      onData(rows);
    },
    onError
  );
}
