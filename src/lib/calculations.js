export function getMonthlyTransactions(transactions) {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });
}

export function computeTotals(transactions) {
  const monthly = getMonthlyTransactions(transactions);
  const activeIncome = monthly
    .filter((t) => t.type === 'income' && t.incomeType === 'active')
    .reduce((s, t) => s + t.amount, 0);
  const passiveIncome = monthly
    .filter((t) => t.type === 'income' && t.incomeType === 'passive')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthly
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = activeIncome + passiveIncome;
  return {
    activeIncome,
    passiveIncome,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  };
}

export function computeSolvency(passiveIncome, totalExpenses, totalDebtPayment) {
  const obligations = totalExpenses + totalDebtPayment;
  if (obligations <= 0) return 0;
  return (passiveIncome / obligations) * 100;
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
