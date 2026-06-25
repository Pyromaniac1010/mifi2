import { useState } from 'react';
import { Plus, Trash2, Pencil, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { addDebt, updateDebt, deleteDebt } from '../lib/db';
import { computeFreedomDate, debtProgress } from '../lib/calculations';

export default function Debts({ uid, debts }) {
  const [showAdd, setShowAdd] = useState(false);
  const freedom = computeFreedomDate(debts);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Debt Freedom</h2>
        <button onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <Plus className="w-5 h-5" /> Add
        </button>
      </div>

      {debts.length > 0 && freedom.neverPayoff && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            At least one debt's monthly payment doesn't cover its interest, so it won't be paid off at the current rate. Increase the payment to see a freedom date.
          </p>
        </div>
      )}

      {debts.length > 0 && freedom.date && (
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1"><Calendar className="w-6 h-6" /><h3 className="text-lg font-semibold">Estimated Freedom Date</h3></div>
          <p className="text-3xl font-bold">{freedom.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      )}

      {showAdd && <AddForm uid={uid} onDone={() => setShowAdd(false)} />}

      <div className="space-y-3">
        {debts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No debts tracked yet</p>
          </div>
        ) : (
          debts.map((d, i) => <Card key={d.id} uid={uid} d={d} rank={i + 1} />)
        )}
      </div>
    </div>
  );
}

function AddForm({ uid, onDone }) {
  const [f, setF] = useState({ name: '', principal: '', interestRate: '', monthlyPayment: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const principal = parseFloat(f.principal);
    const interestRate = parseFloat(f.interestRate);
    const monthlyPayment = parseFloat(f.monthlyPayment);
    if (!f.name.trim() || !(principal > 0) || isNaN(interestRate) || !(monthlyPayment > 0)) return;
    setBusy(true);
    try {
      await addDebt(uid, { name: f.name.trim(), principal, interestRate, monthlyPayment });
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl p-6 shadow-lg space-y-3">
      <h3 className="text-lg font-bold text-gray-900">Add Debt</h3>
      <Field label="Debt name"><input value={f.name} onChange={set('name')} className="input" placeholder="e.g., Credit Card" /></Field>
      <Field label="Principal (current balance)"><input type="number" step="0.01" min="0" value={f.principal} onChange={set('principal')} className="input" placeholder="0.00" /></Field>
      <Field label="Interest rate (% per year)"><input type="number" step="0.01" min="0" value={f.interestRate} onChange={set('interestRate')} className="input" placeholder="e.g., 18.5" /></Field>
      <Field label="Monthly payment"><input type="number" step="0.01" min="0" value={f.monthlyPayment} onChange={set('monthlyPayment')} className="input" placeholder="0.00" /></Field>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium disabled:opacity-60">Add</button>
        <button type="button" onClick={onDone} className="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
      </div>
    </form>
  );
}

function Card({ uid, d, rank }) {
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [f, setF] = useState({ name: d.name, principal: d.principal, interestRate: d.interestRate, monthlyPayment: d.monthlyPayment });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    const principal = parseFloat(f.principal);
    const interestRate = parseFloat(f.interestRate);
    const monthlyPayment = parseFloat(f.monthlyPayment);
    if (!f.name.trim() || !(principal >= 0) || isNaN(interestRate) || !(monthlyPayment > 0)) return;
    await updateDebt(uid, d.id, { name: f.name.trim(), principal, interestRate, monthlyPayment });
    setEditing(false);
  };

  const pay = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!(amt > 0)) return;
    await updateDebt(uid, d.id, { principal: Math.max(0, d.principal - amt) });
    setPayAmount(''); setPaying(false);
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-indigo-500 space-y-3">
        <h3 className="font-bold text-gray-900">Edit Debt</h3>
        <Field label="Debt name"><input value={f.name} onChange={set('name')} className="input" /></Field>
        <Field label="Principal"><input type="number" step="0.01" min="0" value={f.principal} onChange={set('principal')} className="input" /></Field>
        <Field label="Interest rate (%)"><input type="number" step="0.01" min="0" value={f.interestRate} onChange={set('interestRate')} className="input" /></Field>
        <Field label="Monthly payment"><input type="number" step="0.01" min="0" value={f.monthlyPayment} onChange={set('monthlyPayment')} className="input" /></Field>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium">Save</button>
          <button onClick={() => setEditing(false)} className="px-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-indigo-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{rank}</div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{d.name}</h3>
            <p className="text-sm text-gray-500">Avalanche priority #{rank}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-5 h-5" /></button>
          <button onClick={() => deleteDebt(uid, d.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Box label="Principal" value={`$${d.principal.toFixed(0)}`} bg="bg-gray-50" text="text-gray-900" />
        <Box label="Interest" value={`${d.interestRate}%`} bg="bg-red-50" text="text-red-600" />
        <Box label="Monthly" value={`$${d.monthlyPayment.toFixed(0)}`} bg="bg-blue-50" text="text-blue-600" />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-indigo-600">{debtProgress(d).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full h-3" style={{ width: `${debtProgress(d)}%` }} />
        </div>
      </div>

      {!paying ? (
        <button onClick={() => setPaying(true)} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">Log Payment</button>
      ) : (
        <form onSubmit={pay} className="space-y-2">
          <input type="number" step="0.01" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input" placeholder="Payment amount" autoFocus />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium">Confirm</button>
            <button type="button" onClick={() => setPaying(false)} className="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (<div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>);
}
function Box({ label, value, bg, text }) {
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-lg font-bold ${text}`}>{value}</p>
    </div>
  );
}
