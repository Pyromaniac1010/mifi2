import { convert } from './currency';

export function getMonthlyTransactions(transactions) {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });
}

// Totals for the current month, all converted into the chosen base currency.
// A transaction with no currency (legacy data) is treated as already in base.
export function computeTotals(transactions, base, rates) {
  const monthly = getMonthlyTransactions(transactions);
  const val = (t) => convert(t.amount, t.currency || base, base, rates);
  const activeIncome = monthly
    .filter((t) => t.type === 'income' && t.incomeType === 'active')
    .reduce((s, t) => s + val(t), 0);
  const passiveIncome = monthly
    .filter((t) => t.type === 'income' && t.incomeType === 'passive')
    .reduce((s, t) => s + val(t), 0);
  const totalExpenses = monthly
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + val(t), 0);
  const totalIncome = activeIncome + passiveIncome;
  return {
    activeIncome,
    passiveIncome,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  };
}

// Solvency = total income (active + passive) vs this month's obligations
// (expenses + debt payments). Inputs are already in base currency.
export function computeSolvency(totalIncome, totalExpenses, totalDebtPayment) {
  const obligations = totalExpenses + totalDebtPayment;
  if (obligations <= 0) return 0;
  return (totalIncome / obligations) * 100;
}

// Aggregate debt figures in base currency. Debts default to base when no
// currency is set on them.
export function computeDebtTotals(debts, base, rates) {
  const totalDebt = debts.reduce((s, d) => s + convert(d.principal, d.currency || base, base, rates), 0);
  const totalDebtPayment = debts.reduce((s, d) => s + convert(d.monthlyPayment, d.currency || base, base, rates), 0);
  return { totalDebt, totalDebtPayment };
}

// Order debts by the chosen payoff strategy.
// avalanche -> highest interest rate first. snowball -> smallest balance first
// (compared in base currency so mixed-currency debts sort correctly).
export function orderDebts(debts, strategy, base, rates) {
  const arr = [...debts];
  if (strategy === 'snowball') {
    arr.sort(
      (a, b) =>
        convert(a.principal, a.currency || base, base, rates) -
        convert(b.principal, b.currency || base, base, rates)
    );
  } else {
    arr.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
  }
  return arr;
}

export function debtProgress(debt) {
  if (!debt.initialPrincipal) return 0;
  const p = ((debt.initialPrincipal - debt.principal) / debt.initialPrincipal) * 100;
  return Math.max(0, Math.min(100, p));
}

export function computeFreedomDate(debts) {
  if (!debts.length) return { date: null, neverPayoff: false };
  let totalMonths = 0;
  let neverPayoff = false;
  for (const debt of debts) {
    const monthlyInterest = (debt.principal * (debt.interestRate / 100)) / 12;
    const principalPayment = debt.monthlyPayment - monthlyInterest;
    if (principalPayment <= 0) {
      neverPayoff = true;
      continue;
    }
    totalMonths += Math.ceil(debt.principal / principalPayment);
  }
  if (neverPayoff) return { date: null, neverPayoff: true };
  const date = new Date();
  date.setMonth(date.getMonth() + totalMonths);
  return { date, neverPayoff: false };
}
