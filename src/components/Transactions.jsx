import { useState } from 'react';
import { Plus, Trash2, Pencil, Receipt } from 'lucide-react';
import { addTransaction, updateTransaction, deleteTransaction } from '../lib/db';

export default function Transactions({ uid, transactions }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <button onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <Plus className="w-5 h-5" /> Add
        </button>
      </div>

      {showAdd && <AddForm uid={uid} onDone={() => setShowAdd(false)} />}

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          transactions.map((t) => <Row key={t.id} uid={uid} t={t} />)
        )}
      </div>
    </div>
  );
}

function AddForm({ uid, onDone }) {
  const [type, setType] = useState('expense');
  const [incomeType, setIncomeType] = useState('active');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!category.trim() || !(value > 0)) return;
    setBusy(true);
    try {
      await addTransaction(uid, {
        type,
        incomeType: type === 'income' ? incomeType : null,
        category: category.trim(),
        amount: value,
      });
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl p-6 shadow-lg space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Add Transaction</h3>
      <Toggle value={type} onChange={setType}
        options={[['income', 'Income', 'bg-green-600'], ['expense', 'Expense', 'bg-red-600']]} />
      {type === 'income' && (
        <Toggle value={incomeType} onChange={setIncomeType}
          options={[['active', 'Active (Salary)', 'bg-indigo-600'], ['passive', 'Passive/Digital', 'bg-purple-600']]} />
      )}
      <Field label="Category"><input value={category} onChange={(e) => setCategory(e.target.value)} className="input" placeholder="e.g., Groceries, Freelance" /></Field>
      <Field label="Amount"><input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0.00" /></Field>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium disabled:opacity-60">Add</button>
        <button type="button" onClick={onDone} className="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
      </div>
    </form>
  );
}

function Row({ uid, t }) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(t.category);
  const [amount, setAmount] = useState(t.amount);
  const [type, setType] = useState(t.type);
  const [incomeType, setIncomeType] = useState(t.incomeType || 'active');

  const save = async () => {
    const value = parseFloat(amount);
    if (!category.trim() || !(value > 0)) return;
    await updateTransaction(uid, t.id, {
      category: category.trim(),
      amount: value,
      type,
      incomeType: type === 'income' ? incomeType : null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl p-4 shadow border-2 border-indigo-500 space-y-3">
        <Field label="Category"><input value={category} onChange={(e) => setCategory(e.target.value)} className="input" /></Field>
        <Field label="Amount"><input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" /></Field>
        <Toggle value={type} onChange={setType}
          options={[['income', 'Income', 'bg-green-600'], ['expense', 'Expense', 'bg-red-600']]} />
        {type === 'income' && (
          <Toggle value={incomeType} onChange={setIncomeType}
            options={[['active', 'Active', 'bg-indigo-600'], ['passive', 'Passive', 'bg-purple-600']]} />
        )}
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium">Save</button>
          <button onClick={() => setEditing(false)} className="px-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 truncate">{t.category}</span>
          {t.incomeType && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${t.incomeType === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
              {t.incomeType}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-lg font-bold mr-1 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
        </span>
        <button onClick={() => setEditing(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-5 h-5" /></button>
        <button onClick={() => deleteTransaction(uid, t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (<div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>);
}

function Toggle({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(([val, label, active]) => (
        <button key={val} type="button" onClick={() => onChange(val)}
          className={`py-2 px-3 rounded-lg font-medium text-sm ${value === val ? `${active} text-white` : 'bg-gray-100 text-gray-700'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
