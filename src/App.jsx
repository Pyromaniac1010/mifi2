import { useEffect, useState } from 'react';
import { DollarSign, Home, Receipt, CreditCard, MessageCircle, Menu, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import {
  subscribeTransactions, subscribeDebts, subscribeMessages, subscribeProfile,
} from './lib/db';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Debts from './components/Debts';
import Mi from './components/Mi';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [personality, setPersonality] = useState('genZ');

  useEffect(() => {
    if (!user) return;
    const unsubs = [
      subscribeTransactions(user.uid, setTransactions),
      subscribeDebts(user.uid, setDebts),
      subscribeMessages(user.uid, setMessages),
      subscribeProfile(user.uid, (p) => setPersonality(p.personality || 'genZ')),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-indigo-600 text-xl font-semibold">Loading MiFi…</div>
      </div>
    );
  }

  if (!user) return <Login />;

  const nav = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'debts', label: 'Debts', icon: CreditCard },
    { id: 'mi', label: 'Mi', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="text-indigo-600 w-7 h-7" />
            <h1 className="text-xl font-bold text-gray-900">MiFi</h1>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="bg-white border-t">
            <div className="max-w-3xl mx-auto px-4 py-2">
              <p className="px-2 py-2 text-sm text-gray-500 truncate">{user.email}</p>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full text-left px-2 py-3 rounded-lg text-red-600 font-medium hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28">
        {view === 'dashboard' && (
          <Dashboard transactions={transactions} debts={debts} personality={personality} onNavigate={setView} />
        )}
        {view === 'transactions' && <Transactions uid={user.uid} transactions={transactions} />}
        {view === 'debts' && <Debts uid={user.uid} debts={debts} />}
        {view === 'mi' && (
          <Mi uid={user.uid} transactions={transactions} debts={debts} messages={messages} personality={personality} />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-2 flex justify-around">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg ${view === id ? 'text-indigo-600' : 'text-gray-500'}`}
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
