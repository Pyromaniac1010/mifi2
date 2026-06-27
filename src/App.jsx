import { useEffect, useRef, useState } from 'react';
import { DollarSign, Home, Receipt, CreditCard, MessageCircle, Lightbulb, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import {
  subscribeTransactions, subscribeDebts, subscribeBudget, subscribeMessages, subscribeProfile,
} from './lib/db';
import { DEFAULT_BASE } from './lib/currency';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Budget from './components/Budget';
import Debts from './components/Debts';
import Mi from './components/Mi';
import Settings from './components/Settings';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [budget, setBudget] = useState([]);
  const [messages, setMessages] = useState([]);
  const [personality, setPersonality] = useState('genZ');
  const [base, setBase] = useState(DEFAULT_BASE);
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_BASE);
  const [defaultView, setDefaultView] = useState('dashboard');
  const [debtStrategy, setDebtStrategy] = useState('avalanche');
  const [solvencyCap, setSolvencyCap] = useState(true);
  const [name, setName] = useState('');
  const [rates, setRates] = useState(null);
  const didInit = useRef(false);

  // Live exchange rates (USD-based). Falls back to no-conversion if unavailable.
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((r) => r.json())
      .then((d) => { if (d && d.rates) setRates(d.rates); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    didInit.current = false;
    const unsubs = [
      subscribeTransactions(user.uid, setTransactions),
      subscribeDebts(user.uid, setDebts),
      subscribeBudget(user.uid, setBudget),
      subscribeMessages(user.uid, setMessages),
      subscribeProfile(user.uid, (p) => {
        setPersonality(p.personality || 'genZ');
        setBase(p.baseCurrency || DEFAULT_BASE);
        setDefaultCurrency(p.defaultCurrency || p.baseCurrency || DEFAULT_BASE);
        setDefaultView(p.defaultView || 'dashboard');
        setDebtStrategy(p.debtStrategy || 'avalanche');
        setSolvencyCap(p.solvencyCap !== false);
        setName(p.name || '');
        if (!didInit.current) {
          setView(p.defaultView || 'dashboard');
          didInit.current = true;
        }
      }),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-mint-50">
        <div className="text-navy-600 text-xl font-semibold">Loading MiFi…</div>
      </div>
    );
  }

  if (!user) return <Login />;

  const nav = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Money', icon: Receipt },
    { id: 'budget', label: 'Budget', icon: Lightbulb },
    { id: 'debts', label: 'Debts', icon: CreditCard },
    { id: 'mi', label: 'Mi', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-mint-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="text-navy-600 w-7 h-7" />
            <h1 className="text-xl font-bold text-gray-900">MiFi</h1>
          </div>
          <button onClick={() => setView('settings')} aria-label="Settings"
            className={`p-2 rounded-lg hover:bg-gray-100 ${view === 'settings' ? 'text-navy-700' : 'text-gray-500'}`}>
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28">
        {view === 'dashboard' && (
          <Dashboard transactions={transactions} debts={debts} personality={personality} base={base} rates={rates} name={name} debtStrategy={debtStrategy} solvencyCap={solvencyCap} onNavigate={setView} />
        )}
        {view === 'transactions' && <Transactions uid={user.uid} transactions={transactions} base={base} rates={rates} defaultCurrency={defaultCurrency} />}
        {view === 'budget' && <Budget uid={user.uid} budget={budget} transactions={transactions} debts={debts} base={base} rates={rates} defaultCurrency={defaultCurrency} />}
        {view === 'debts' && <Debts uid={user.uid} debts={debts} base={base} rates={rates} debtStrategy={debtStrategy} />}
        {view === 'mi' && (
          <Mi uid={user.uid} transactions={transactions} debts={debts} messages={messages} personality={personality} base={base} rates={rates} debtStrategy={debtStrategy} />
        )}
        {view === 'settings' && (
          <Settings uid={user.uid} email={user.email} name={name} base={base} defaultCurrency={defaultCurrency} defaultView={defaultView} personality={personality} debtStrategy={debtStrategy} solvencyCap={solvencyCap} onClose={() => setView('dashboard')} logout={logout} />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg">
        <div className="max-w-3xl mx-auto px-2 py-2 flex justify-around">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${view === id ? 'text-navy-600' : 'text-gray-500'}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
