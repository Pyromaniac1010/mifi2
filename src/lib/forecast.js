// forecast.js
// Pure forecasting logic for MiFi. No React, no Firebase, no imports.
// Every function here takes data in and returns numbers out, so it can be
// tested in isolation and cannot break the live app by existing.
//
// Two rules this file follows:
// 1. The maths lives here. The wording lives in the UI. Never mix them.
// 2. Nothing is invented. If there is not enough history, it says so
//    instead of drawing a confident line through noise.

// Same conversion formula App.jsx uses, duplicated on purpose so this file
// has zero imports.
function conv(amount, from, to, rates) {
  if (!amount) return 0;
  if (from === to) return amount;
  if (!rates || !rates[from] || !rates[to]) return amount;
  return amount * (rates[to] / rates[from]);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const key = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}`;

// Recency weights. The most recent completed month counts most.
const DECAY = 0.85;
// How many completed months feed the averages.
const WINDOW = 6;
// Below this many months of real history we refuse to forecast.
const MIN_MONTHS = 3;

// ---------- history ----------

// Buckets transactions into calendar months, in base currency.
// The current calendar month is marked partial and never feeds an average,
// because a month that is four days old would drag every number down.
function bucketHistory(txns, base, rates, now) {
  const d0 = new Date(now);
  const curKey = key(d0.getFullYear(), d0.getMonth());
  const map = new Map();
  for (const t of txns) {
    const d = new Date(t.date);
    const k = key(d.getFullYear(), d.getMonth());
    if (!map.has(k)) {
      map.set(k, { key: k, y: d.getFullYear(), m: d.getMonth(), active: 0, passive: 0, expense: 0, byCat: {}, count: 0, partial: k === curKey });
    }
    const b = map.get(k);
    const v = conv(t.amount, t.currency || base, base, rates);
    b.count++;
    if (t.type === 'income') {
      if (t.incomeType === 'passive') b.passive += v; else b.active += v;
    } else {
      b.expense += v;
      const c = t.cat || 'misc';
      b.byCat[c] = (b.byCat[c] || 0) + v;
    }
  }
  return [...map.values()].sort((a, b) => (a.y - b.y) || (a.m - b.m));
}

// Weighted average of a getter across months, newest first.
function weighted(months, get) {
  let num = 0, den = 0;
  months.forEach((mo, i) => {
    const w = Math.pow(DECAY, i);
    num += get(mo) * w;
    den += w;
  });
  return den > 0 ? num / den : 0;
}

function stdev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const varc = values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (values.length - 1);
  return Math.sqrt(varc);
}

// Least squares slope, used for reporting a trend, not for projecting one.
function slope(values) {
  const n = values.length;
  if (n < 3) return 0;
  const mx = (n - 1) / 2;
  const my = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  values.forEach((v, i) => { num += (i - mx) * (v - my); den += (i - mx) * (i - mx); });
  return den > 0 ? num / den : 0;
}

// ---------- baseline ----------

export function buildBaseline({ txns = [], base = 'NGN', rates = null, now = Date.now() } = {}) {
  const all = bucketHistory(txns, base, rates, now);
  const completed = all.filter(b => !b.partial && b.count > 0);
  const partial = all.find(b => b.partial) || null;

  const recent = completed.slice(-WINDOW).reverse(); // newest first
  const monthsOfData = completed.length;

  const avgActive = weighted(recent, m => m.active);
  const avgPassive = weighted(recent, m => m.passive);
  const avgExpense = weighted(recent, m => m.expense);

  // Per category averages. A category absent in a month counts as zero for
  // that month, which is correct: they genuinely did not spend on it.
  const cats = new Set();
  recent.forEach(m => Object.keys(m.byCat).forEach(c => cats.add(c)));
  const byCat = {};
  cats.forEach(c => { byCat[c] = weighted(recent, m => m.byCat[c] || 0); });

  const nets = completed.slice(-WINDOW).map(m => m.active + m.passive - m.expense);
  const volatility = stdev(nets);

  // Reported, not projected. See the note at the top of the file.
  const passiveTrendPerMonth = slope(completed.slice(-WINDOW).map(m => m.passive));
  const expenseTrendPerMonth = slope(completed.slice(-WINDOW).map(m => m.expense));

  return {
    monthsOfData,
    ready: monthsOfData >= MIN_MONTHS,
    reason: monthsOfData >= MIN_MONTHS ? null
      : `Needs ${MIN_MONTHS} full months of history. You have ${monthsOfData}.`,
    avgActive,
    avgPassive,
    avgIncome: avgActive + avgPassive,
    avgExpense,
    byCat,
    volatility,
    passiveTrendPerMonth,
    expenseTrendPerMonth,
    completed,
    partial,
  };
}

// ---------- debts ----------

// Proper month by month amortisation. Interest first, then principal.
// rollover pushes a cleared debt's payment onto the next target, which is
// what avalanche and snowball actually mean.
function runDebts(debts, base, rates, months, { strategy = 'avalanche', extra = 0, rollover = true } = {}) {
  let live = debts.map(d => ({
    id: d.id,
    name: d.name,
    principal: conv(d.principal, d.currency || base, base, rates),
    payment: conv(d.monthlyPayment, d.currency || base, base, rates),
    rate: (d.interestRate || 0) / 100 / 12,
  })).filter(d => d.principal > 0);

  const order = () => {
    const open = live.filter(d => d.principal > 0.01);
    if (strategy === 'snowball') return [...open].sort((a, b) => a.principal - b.principal);
    return [...open].sort((a, b) => b.rate - a.rate);
  };

  const rows = [];
  let stuck = false;
  let freed = 0;

  for (let i = 1; i <= months; i++) {
    let paid = 0, interestPaid = 0;
    const open = order();
    const target = open[0] || null;

    for (const d of live) {
      if (d.principal <= 0.01) continue;
      const interest = d.principal * d.rate;
      let pay = d.payment;
      if (target && d.id === target.id) pay += extra + (rollover ? freed : 0);
      // Never pay more than what is actually owed this month.
      pay = Math.min(pay, d.principal + interest);
      const toPrincipal = pay - interest;
      if (toPrincipal <= 0) {
        // Payment does not cover interest, so the balance climbs.
        stuck = true;
        d.principal += interest - pay;
      } else {
        d.principal -= toPrincipal;
      }
      if (d.principal < 0.01) {
        d.principal = 0;
        if (rollover) freed += d.payment;
      }
      paid += pay;
      interestPaid += Math.min(interest, pay);
    }

    const remaining = live.reduce((s, d) => s + d.principal, 0);
    rows.push({ month: i, paid, interestPaid, remaining });
    if (remaining <= 0.01) {
      // Fill the rest with zeros so the array length always matches months.
      for (let j = i + 1; j <= months; j++) rows.push({ month: j, paid: 0, interestPaid: 0, remaining: 0 });
      break;
    }
  }

  const startingDebt = debts.reduce((s, d) => s + conv(d.principal, d.currency || base, base, rates), 0);
  const clearedAt = rows.findIndex(r => r.remaining <= 0.01);
  return {
    rows,
    stuck,
    // Someone with no debt has no debt-free date. Reporting month 1 here
    // would have the UI congratulate them on clearing nothing.
    debtFreeMonth: (live.length === 0 || clearedAt === -1) ? null : clearedAt + 1,
    startingDebt,
  };
}

// The debt schedule on its own, for screens that care about debt but not
// about the full forecast. Same amortisation the forecast uses, so the app
// never shows two different payoff dates for the same debts.
export function projectDebts(debts = [], { base = 'NGN', rates = null, months = 600, strategy = 'avalanche', extra = 0, rollover = true } = {}) {
  if (!debts.length) return { rows: [], stuck: false, debtFreeMonth: null, startingDebt: 0, totalInterest: 0 };
  const r = runDebts(debts, base, rates, months, { strategy, extra, rollover });
  const upto = r.debtFreeMonth || r.rows.length;
  return { ...r, totalInterest: r.rows.slice(0, upto).reduce((s, x) => s + x.interestPaid, 0) };
}

// ---------- the forecast ----------

/**
 * scenario: {
 *   catDeltas: { dining: -0.2 },   fraction, so -0.2 means cut 20 percent
 *   extraPassive: 80000,            added to monthly passive income, in base
 *   extraDebtPayment: 0,            added to the target debt each month
 *   oneOff: { amount, month }       a single purchase, month is 1 based
 * }
 */
export function buildForecast({
  txns = [], debts = [], base = 'NGN', rates = null,
  months = 24, startingCash = 0, inflation = 0, now = Date.now(),
  strategy = 'avalanche', rollover = true, scenario = null,
} = {}) {
  const b = buildBaseline({ txns, base, rates, now });
  const s = scenario || {};
  const catDeltas = s.catDeltas || {};

  if (!b.ready) {
    return { ready: false, reason: b.reason, monthsOfData: b.monthsOfData, baseline: b, months: [], milestones: {}, drift: [] };
  }

  const debt = runDebts(debts, base, rates, months, {
    strategy,
    extra: s.extraDebtPayment || 0,
    rollover,
  });

  // Scenario adjusted monthly expense, rebuilt from categories so a slider
  // on one category moves the total correctly.
  let adjExpense = 0;
  const adjByCat = {};
  Object.entries(b.byCat).forEach(([c, v]) => {
    const factor = 1 + (catDeltas[c] || 0);
    adjByCat[c] = Math.max(0, v * factor);
    adjExpense += adjByCat[c];
  });
  // Any difference between the category sum and the recorded total is
  // rounding, not a missing category, so scale to keep them consistent.
  if (adjExpense === 0 && b.avgExpense > 0) adjExpense = b.avgExpense;

  const passive = b.avgPassive + (s.extraPassive || 0);
  const active = b.avgActive;
  const income = active + passive;

  const d0 = new Date(now);
  const rows = [];
  let cash = startingCash;

  for (let i = 1; i <= months; i++) {
    const infl = Math.pow(1 + (inflation || 0) / 100, i / 12);
    const expense = adjExpense * infl;
    const dr = debt.rows[i - 1] || { paid: 0, interestPaid: 0, remaining: 0 };
    const oneOff = (s.oneOff && s.oneOff.month === i) ? (s.oneOff.amount || 0) : 0;
    const obligations = expense + dr.paid;
    const net = income - expense - dr.paid - oneOff;
    cash += net;

    const spread = b.volatility * Math.sqrt(i);
    const dt = new Date(d0.getFullYear(), d0.getMonth() + i, 1);

    rows.push({
      month: i,
      date: dt.getTime(),
      label: `${MONTH_NAMES[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`,
      income,
      active,
      passive,
      expense,
      oneOff,
      debtPaid: dr.paid,
      debtInterest: dr.interestPaid,
      debtRemaining: dr.remaining,
      obligations,
      net,
      cash,
      cashLow: cash - spread,
      cashHigh: cash + spread,
      solvencyIncome: obligations > 0 ? (income / obligations) * 100 : 0,
      solvencyPassive: obligations > 0 ? (passive / obligations) * 100 : 0,
      faded: i > 18, // beyond here the numbers are a guess, show them faded
    });
  }

  const firstSolvent = rows.find(r => r.solvencyPassive >= 100) || null;

  // Without a starting balance the cash line is change from today, not money
  // in an account, so "you go negative" would be a lie. Only call it when we
  // are actually tracking a balance.
  const tracksBalance = startingCash > 0;
  const firstNegative = tracksBalance ? (rows.find(r => r.cash < 0) || null) : null;

  // Runway only means something against a real balance the user has given us.
  const monthlyBurn = rows.length ? rows[0].obligations : 0;
  const runwayMonths = (startingCash > 0 && monthlyBurn > 0) ? startingCash / monthlyBurn : null;

  return {
    ready: true,
    reason: null,
    monthsOfData: b.monthsOfData,
    baseline: b,
    months: rows,
    // False means the cash line is change from today, not an account balance.
    // Label it that way in the UI.
    tracksBalance,
    milestones: {
      debtFreeMonth: debt.debtFreeMonth,
      debtFreeDate: debt.debtFreeMonth ? rows[debt.debtFreeMonth - 1].date : null,
      debtStuck: debt.stuck,
      startingDebt: debt.startingDebt,
      solvencyMonth: firstSolvent ? firstSolvent.month : null,
      solvencyDate: firstSolvent ? firstSolvent.date : null,
      solvencyNote: firstSolvent ? null
        : 'Passive income is held flat, so on current behaviour it never covers your obligations. Change that with the passive slider.',
      cashNegativeMonth: firstNegative ? firstNegative.month : null,
      cashNegativeNote: tracksBalance ? null
        : 'Needs a starting balance before MiFi can say when you run out.',
      runwayMonths,
      runwayNote: runwayMonths === null ? 'Needs a starting balance. MiFi tracks flows, not what is in your account.' : null,
    },
    drift: detectDrift(b),
    assumptions: {
      window: WINDOW,
      decay: DECAY,
      inflation,
      strategy,
      rollover,
      passiveHeldFlat: true,
      startingCash,
    },
  };
}

// ---------- drift ----------

// A category is drifting when the latest completed month is well above the
// three before it. Catches a creeping habit before the forecast bends.
export function detectDrift(baseline, { minRise = 0.25, minAbs = 1 } = {}) {
  const months = baseline.completed;
  if (months.length < 3) return [];
  const latest = months[months.length - 1];
  const prior = months.slice(-4, -1);
  if (!prior.length) return [];

  const out = [];
  const cats = new Set([...Object.keys(latest.byCat), ...prior.flatMap(m => Object.keys(m.byCat))]);
  cats.forEach(c => {
    const now = latest.byCat[c] || 0;
    const avg = prior.reduce((s, m) => s + (m.byCat[c] || 0), 0) / prior.length;
    if (avg <= 0 || now <= minAbs) return;
    const rise = (now - avg) / avg;
    if (rise < minRise) return;
    // Rising three months in a row is a stronger signal than one spike.
    const series = months.slice(-4).map(m => m.byCat[c] || 0);
    let consecutive = 0;
    for (let i = 1; i < series.length; i++) if (series[i] > series[i - 1]) consecutive++; else consecutive = 0;
    out.push({ cat: c, latest: now, average: avg, rise, sustained: consecutive >= 2 });
  });
  return out.sort((a, b) => (b.latest - b.average) - (a.latest - a.average));
}

// ---------- cost of a decision ----------

// What one purchase actually costs you, measured in time rather than money.
export function costOfDecision(amount, opts = {}) {
  const baseRun = buildForecast(opts);
  if (!baseRun.ready) return { ready: false, reason: baseRun.reason };

  const withIt = buildForecast({
    ...opts,
    scenario: { ...(opts.scenario || {}), oneOff: { amount, month: 1 } },
  });

  const horizon = baseRun.months.length;
  const cashBefore = baseRun.months[horizon - 1].cash;
  const cashAfter = withIt.months[horizon - 1].cash;

  return {
    ready: true,
    amount,
    cashDelta: cashAfter - cashBefore,
    // A one off does not touch the debt schedule unless it is paid from a
    // debt payment, so this is about cash position, stated plainly.
    monthsOfExpense: baseRun.months[0].expense > 0 ? amount / baseRun.months[0].expense : null,
    weeksOfNet: baseRun.months[0].net > 0 ? (amount / baseRun.months[0].net) * 4.345 : null,
    pushesCashNegative: withIt.milestones.cashNegativeMonth !== null
      && withIt.milestones.cashNegativeMonth !== baseRun.milestones.cashNegativeMonth,
  };
}

// ---------- facts for the advisor ----------

// Flat, already computed numbers. This is the object to hand to a model
// later so it phrases real figures instead of inventing them.
export function forecastFacts(f) {
  if (!f || !f.ready) return { ready: false, reason: f ? f.reason : 'No forecast' };
  const m12 = f.months[11] || f.months[f.months.length - 1];
  return {
    ready: true,
    monthsOfData: f.monthsOfData,
    monthlyIncome: Math.round(f.months[0].income),
    monthlyPassive: Math.round(f.months[0].passive),
    monthlyExpense: Math.round(f.months[0].expense),
    monthlyDebtPayment: Math.round(f.months[0].debtPaid),
    monthlyNet: Math.round(f.months[0].net),
    volatility: Math.round(f.baseline.volatility),
    solvencyNow: Math.round(f.months[0].solvencyPassive),
    solvencyIn12: Math.round(m12.solvencyPassive),
    cashIn12: Math.round(m12.cash),
    debtFreeMonth: f.milestones.debtFreeMonth,
    debtStuck: f.milestones.debtStuck,
    solvencyMonth: f.milestones.solvencyMonth,
    cashNegativeMonth: f.milestones.cashNegativeMonth,
    runwayMonths: f.milestones.runwayMonths === null ? null : Math.round(f.milestones.runwayMonths * 10) / 10,
    driftTop: f.drift.length ? f.drift[0].cat : null,
    driftRise: f.drift.length ? Math.round(f.drift[0].rise * 100) : null,
  };
}
