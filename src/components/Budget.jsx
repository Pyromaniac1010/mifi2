import { useState } from 'react';
import { Plus, Trash2, Pencil, Lightbulb, ArrowRight, Pause, Play } from 'lucide-react';
import { addBudgetItem, updateBudgetItem, deleteBudgetItem, addTransaction } from '../lib/db';
import { computeTotals, computeDebtTotals } from '../lib/calculations';
import { CURRENCIES, convert, money } from '../lib/currency';

// --- natural-language parsing ---
const CATEGORY_HINTS = [
  [['grocery', 'groceries', 'market', 'foodstuff'], 'Groceries'],
  [['restaurant', 'dinner', 'lunch', 'brunch', 'eat out', 'eating out', 'takeout'], 'Dining'],
  [['rent', 'apartment', 'housing', 'flat'], 'Rent'],
  [['flight', 'trip', 'travel', 'fuel', 'uber', 'bolt', 'transport', 'fare', 'ride'], 'Transport'],
  [['electricity', 'power', 'utility', 'bill', 'bills'], 'Bills'],
  [['data', 'airtime', 'internet', 'wifi'], 'Data'],
  [['subscription', 'spotify', 'netflix', 'renewal'], 'Subscriptions'],
  [['laptop', 'macbook', 'phone', 'iphone', 'headphone', 'sneaker', 'shoe', 'gadget', 'watch', 'camera', 'clothes', 'buy', 'shopping'], 'Shopping'],
  [['gym', 'hospital', 'pharmacy', 'medical', 'dentist', 'health', 'clinic'], 'Health'],
  [['cinema', 'movie', 'game', 'concert', 'party', 'show'], 'Entertainment'],
  [['gift', 'birthday', 'wedding', 'family'], 'Family & Gifts'],
  [['course', 'school', 'tuition', 'book', 'class', 'degree'], 'Education'],
];
const CURRENCY_HINTS = [
  [/[$]|\busd\b|dollar/i, 'USD'],
  [/[£]|\bgbp\b|pound/i, 'GBP'],
  [/[€]|\beur\b|euro/i, 'EUR'],
  [/₦|\bngn\b|naira/i, 'NGN'],
  [/\bghs\b|cedi/i, 'GHS'],
  [/\bkes\b|shilling/i, 'KES'],
  [/\bzar\b|rand/i, 'ZAR'],
  [/\bcad\b/i, 'CAD'],
];
function guessCategory(text) {
  const lc = ' ' + text.toLowerCase() + ' ';
  for (const [words, cat] of CATEGORY_HINTS) if (words.some((w) => lc.includes(w))) return cat;
  return '';
}
function parsePlan(text, base) {
  const raw = text.trim();
  let currency = base;
  for (const [re, code] of CURRENCY_HINTS) { if (re.test(raw)) { currency = code; break; } }
  let max = null;
  let m;
  const re = /(?:₦|\$|£|€)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m|thousand|million)?/gi;
  while ((m = re.exec(raw)) !== null) {
    if (!m[1]) continue;
    let n = parseFloat(m[1].replace(/,/g, ''));
    if (isNaN(n)) continue;
    const suf = (m[2] || '').toLowerCase();
    if (suf === 'k' || suf === 'thousand') n *= 1e3;
    else if (suf === 'm' || suf === 'million') n *= 1e6;
    if (max === null || n > max) max = n;
  }
  return { description: raw, amount: max ?? 0, currency, category: guessCategory(raw) };
}

export default function Budget({ uid, budget, transactions, debts, base, rates, defaultCurrency }) {
  const [draft, setDraft] = useState('');
  const [editId, setEditId] = useState(null);

  const { totalIncome, totalExpenses } = computeTotals(transactions, base, rates);
  const { totalDebtPayment } = computeDebtTotals(debts, base, rates);
  const spare = totalIncome - totalExpenses - totalDebtPayment;

  const inBase = (b) => convert(b.amount, b.currency || base, base, rates);
  const considering = budget.filter((b) => b.status !== 'onhold');
  const onhold = budget.filter((b) => b.status === 'onhold');
  const sum = (arr) => arr.reduce((s, b) => s + inBase(b), 0);
  const consideringTotal = sum(considering);
  const onholdTotal = sum(onhold);
  const afterCommit = spare - consideringTotal;

  const add = async () => {
    const text = draft.trim();
    if (!text) return;
    const p = parsePlan(text, defaultCurrency || base);
    await addBudgetItem(uid, { description: p.description, amount: p.amount, currency: p.currency, category: p.category, status: 'considering' });
    setDraft('');
  };
  const commit = async (b) => {
    if (!(b.amount > 0)) return;
    await addTransaction(uid, { type: 'expense', incomeType: null, category: b.category || b.description, amount: b.amount, currency: b.currency || base });
    await deleteBudgetItem(uid, b.id);
  };
  const toggleHold = (b) => updateBudgetItem(uid, b.id, { status: b.status === 'onhold' ? 'considering' : 'onhold' });

  const renderItem = (b) =>
    editId === b.id ? (
      <Editor key={b.id} uid={uid} b={b} base={base} onDone={() => setEditId(null)} />
    ) : (
      <PlanRow key={b.id} b={b} base={base} amountInBase={inBase(b)} spare={spare} onCommit={() => commit(b)} onHold={() => toggleHold(b)} onEdit={() => setEditId(b.id)} onDelete={() => deleteBudgetItem(uid, b.id)} />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-7 h-7 text-navy-600" />
        <h2 className="text-2xl font-bold text-gray-900">Budget</h2>
      </div>
      <p className="text-gray-600 text-sm">
        Jot down what you <span className="font-semibold text-gray-900">might</span> spend. Commit it when you can afford to, or keep it on hold.
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
        <label className="block text-sm font-medium text-gray-700">Describe a potential expense</label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } }}
          rows={2}
          placeholder="e.g. Maybe a new laptop around $800, or studio gear ₦300k next month"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          className="w-full bg-navy-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-navy-700 disabled:opacity-60"
        >
          <Plus className="w-5 h-5" /> Add to plan
        </button>
      </div>

      <div className="bg-gradient-to-r from-navy-600 to-mint-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold opacity-90">Spare this month</span>
          <span className="text-2xl font-bold">{spare < 0 ? '-' : ''}{money(Math.abs(spare), base)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/15 rounded-lg p-3">
            <p className="text-xs opacity-80 mb-0.5">Considering</p>
            <p className="font-bold">{money(consideringTotal, base)}</p>
          </div>
          <div className="bg-white/15 rounded-lg p-3">
            <p className="text-xs opacity-80 mb-0.5">On hold</p>
            <p className="font-bold">{money(onholdTotal, base)}</p>
          </div>
        </div>
        <p className="text-sm opacity-90">
          {consideringTotal === 0
            ? "Nothing you're actively considering yet."
            : afterCommit >= 0
              ? `Committing everything you're considering still leaves ${money(afterCommit, base)} this month.`
              : `Committing it all goes ${money(Math.abs(afterCommit), base)} past your spare — keep the lower-priority ones on hold.`}
        </p>
      </div>

      {budget.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow">
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No plans yet. Jot down something you might spend on.</p>
        </div>
      ) : (
        <>
          {considering.length > 0 && (
            <Section title="Considering" total={consideringTotal} base={base}>
              {considering.map(renderItem)}
            </Section>
          )}
          {onhold.length > 0 && (
            <Section title="On hold" total={onholdTotal} base={base}>
              {onhold.map(renderItem)}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, total, base, children }) {
  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
        <span className="text-xs font-semibold text-gray-500">{money(total, base)}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PlanRow({ b, base, amountInBase, spare, onCommit, onHold, onEdit, onDelete }) {
  const hasAmount = b.amount > 0;
  const within = hasAmount && amountInBase <= Math.max(0, spare);
  const held = b.status === 'onhold';
  const itemCurrency = b.currency || base;
  const showOriginal = itemCurrency !== base;
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 leading-snug">{b.description}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-lg font-bold text-gray-900">{hasAmount ? money(amountInBase, base) : 'Set amount'}</span>
            {hasAmount && showOriginal && <span className="text-xs text-gray-500">· {money(b.amount, itemCurrency)}</span>}
            {b.category && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{b.category}</span>}
            {hasAmount && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${within ? 'bg-mint-100 text-mint-700' : 'bg-amber-100 text-amber-700'}`}>
                {within ? 'within reach' : 'over spare'}
              </span>
            )}
          </div>
        </div>
        <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0"><Trash2 className="w-5 h-5" /></button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onCommit}
          disabled={!hasAmount}
          className="flex-1 bg-navy-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 hover:bg-navy-700 disabled:opacity-50"
        >
          <ArrowRight className="w-4 h-4" /> Commit as expense
        </button>
        <button onClick={onHold} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center gap-1.5">
          {held ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Hold</>}
        </button>
        <button onClick={onEdit} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg"><Pencil className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function Editor({ uid, b, base, onDone }) {
  const [description, setDescription] = useState(b.description);
  const [amount, setAmount] = useState(b.amount || '');
  const [currency, setCurrency] = useState(b.currency || base);
  const [category, setCategory] = useState(b.category || '');

  const save = async () => {
    const value = parseFloat(amount);
    await updateBudgetItem(uid, b.id, {
      description: description.trim() || b.description,
      amount: isNaN(value) ? 0 : value,
      currency,
      category: category.trim(),
    });
    onDone();
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow border-2 border-navy-500 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What is it?</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 font-medium text-gray-700 h-[42px]">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" placeholder="e.g. Shopping" />
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 bg-mint-600 text-white py-2 rounded-lg font-medium">Save</button>
        <button onClick={onDone} className="px-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
      </div>
    </div>
  );
}
