import { useState } from 'react';
import { User, Wallet, LayoutGrid, Sparkles, LogOut, Check, ArrowLeft, CreditCard, Gauge, MessageSquare, Trash2 } from 'lucide-react';
import { updateProfile, clearMessages } from '../lib/db';
import { CURRENCIES } from '../lib/currency';
import { PERSONALITIES } from '../lib/mi';

const VIEWS = [
  ['dashboard', 'Home'],
  ['transactions', 'Money'],
  ['budget', 'Budget'],
  ['debts', 'Debts'],
  ['mi', 'Mi'],
];

export default function Settings({ uid, email, name, base, defaultCurrency, defaultView, personality, debtStrategy, solvencyCap, onClose, logout }) {
  const [nameDraft, setNameDraft] = useState(name || '');
  const [savedName, setSavedName] = useState(false);
  const [cleared, setCleared] = useState(false);

  const saveName = () => {
    updateProfile(uid, { name: nameDraft.trim() });
    setSavedName(true);
    setTimeout(() => setSavedName(false), 1500);
  };
  const clearChat = async () => {
    await clearMessages(uid);
    setCleared(true);
    setTimeout(() => setCleared(false), 1500);
  };
  const set = (field) => (e) => updateProfile(uid, { [field]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      <Section icon={<User className="w-4 h-4" />} title="Profile">
        <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
        <div className="flex gap-2">
          <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="input" placeholder="Your name" />
          <button onClick={saveName} className="px-4 rounded-lg font-medium bg-navy-600 text-white flex items-center gap-1.5 hover:bg-navy-700">
            {savedName ? <><Check className="w-4 h-4" /> Saved</> : 'Save'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Signed in as {email}</p>
      </Section>

      <Section icon={<Wallet className="w-4 h-4" />} title="Currency">
        <label className="block text-sm font-medium text-gray-700 mb-1">Base currency</label>
        <select value={base} onChange={set('baseCurrency')} className="input">
          {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1 mb-4">Everything is totalled and displayed in this currency.</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Default currency for new entries</label>
        <select value={defaultCurrency || base} onChange={set('defaultCurrency')} className="input">
          {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1">Pre-selected when you log a transaction or plan (you can still change it per entry).</p>
      </Section>

      <Section icon={<CreditCard className="w-4 h-4" />} title="Debt payoff strategy">
        <p className="text-xs text-gray-400 mb-3">Sets the order MiFi attacks your debts and what Mi recommends.</p>
        <div className="grid grid-cols-2 gap-2">
          {[['avalanche', 'Avalanche', 'Highest interest first'], ['snowball', 'Snowball', 'Smallest balance first']].map(([id, label, sub]) => {
            const on = (debtStrategy || 'avalanche') === id;
            return (
              <button key={id} onClick={() => updateProfile(uid, { debtStrategy: id })}
                className={`p-3 rounded-lg border-2 text-left ${on ? 'border-navy-600 bg-navy-50' : 'border-gray-200'}`}>
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={<Gauge className="w-4 h-4" />} title="Solvency score display">
        <p className="text-xs text-gray-400 mb-3">When your income more than covers obligations, show a capped score or the true coverage ratio.</p>
        <div className="grid grid-cols-2 gap-2">
          {[[true, 'Cap at 100%', 'Cleaner target'], [false, 'True coverage', 'e.g. 240%']].map(([val, label, sub]) => {
            const on = (solvencyCap !== false) === val;
            return (
              <button key={String(val)} onClick={() => updateProfile(uid, { solvencyCap: val })}
                className={`p-3 rounded-lg border-2 text-left ${on ? 'border-navy-600 bg-navy-50' : 'border-gray-200'}`}>
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={<LayoutGrid className="w-4 h-4" />} title="Starting tab">
        <p className="text-xs text-gray-400 mb-3">The screen MiFi opens on.</p>
        <div className="grid grid-cols-3 gap-2">
          {VIEWS.map(([id, label]) => {
            const on = (defaultView || 'dashboard') === id;
            return (
              <button key={id} onClick={() => updateProfile(uid, { defaultView: id })}
                className={`py-2 rounded-lg text-sm font-medium border-2 ${on ? 'border-navy-600 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-600'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={<Sparkles className="w-4 h-4" />} title="Mi's personality">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PERSONALITIES).map(([key, val]) => {
            const on = personality === key;
            return (
              <button key={key} onClick={() => updateProfile(uid, { personality: key })}
                className={`p-3 rounded-lg border-2 text-left ${on ? 'border-navy-600 bg-navy-50' : 'border-gray-200'}`}>
                <div className="text-2xl mb-1">{val.emoji}</div>
                <div className="text-sm font-medium text-gray-900">{val.name}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={<MessageSquare className="w-4 h-4" />} title="Mi chat">
        <p className="text-xs text-gray-400 mb-3">Wipe your conversation history with Mi. This can't be undone.</p>
        <button onClick={clearChat} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-red-600 bg-red-50 hover:bg-red-100">
          {cleared ? <><Check className="w-4 h-4" /> Cleared</> : <><Trash2 className="w-4 h-4" /> Clear chat history</>}
        </button>
      </Section>

      <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100">
        <LogOut className="w-5 h-5" /> Log out
      </button>

      <p className="text-center text-xs text-gray-400 pb-2">MiFi</p>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center gap-2 mb-4 text-navy-700">{icon}<h3 className="font-semibold text-gray-900">{title}</h3></div>
      {children}
    </div>
  );
}
