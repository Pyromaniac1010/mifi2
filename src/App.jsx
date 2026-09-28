import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Flame, TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, CreditCard, Calendar, AlertTriangle, MessageCircle, Send, Settings, Home, Receipt, Sparkles, ArrowUpRight, ArrowDownRight, X, User, Moon, Sun, Check, ShoppingCart, Utensils, Car, Zap, Wifi, Tv, ShoppingBag, Heart, Film, Gift, GraduationCap, MoreHorizontal, Briefcase, Music, RefreshCw, Laptop, Store, BarChart3, List, Repeat, Clock, Bell } from 'lucide-react';
import { Lightbulb, LogOut, ArrowLeft, Route, SlidersHorizontal, Target } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import { buildForecast, costOfDecision, projectDebts } from './lib/forecast';
import { isNative, wireBackButton, styleStatusBar } from './lib/native';
import { subscribeTransactions, addTransaction, updateTransaction, deleteTransaction, subscribeDebts, addDebt, updateDebt, deleteDebt, subscribeRecurring, addRecurring, updateRecurring, deleteRecurring, subscribeMessages, addMessage, clearMessages, subscribeBudgetFolders, addBudgetFolder, updateBudgetFolder, deleteBudgetFolder, subscribeProfile, updateProfile, deleteAllUserData } from './lib/db';

const CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira' }, { code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'British Pound' },
  { code: 'GHS', name: 'Ghanaian Cedi' }, { code: 'KES', name: 'Kenyan Shilling' }, { code: 'ZAR', name: 'South African Rand' }, { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'XOF', name: 'West African CFA Franc' }, { code: 'XAF', name: 'Central African CFA Franc' }, { code: 'RWF', name: 'Rwandan Franc' }, { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'UGX', name: 'Ugandan Shilling' }, { code: 'ZMW', name: 'Zambian Kwacha' }, { code: 'MAD', name: 'Moroccan Dirham' }, { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'BWP', name: 'Botswana Pula' }, { code: 'MUR', name: 'Mauritian Rupee' }, { code: 'CAD', name: 'Canadian Dollar' }, { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' }, { code: 'INR', name: 'Indian Rupee' }, { code: 'CNY', name: 'Chinese Yuan' }, { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AED', name: 'UAE Dirham' }, { code: 'SAR', name: 'Saudi Riyal' }, { code: 'CHF', name: 'Swiss Franc' }, { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' }, { code: 'BRL', name: 'Brazilian Real' }, { code: 'MXN', name: 'Mexican Peso' }, { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' }, { code: 'DKK', name: 'Danish Krone' }, { code: 'PLN', name: 'Polish Zloty' }, { code: 'TRY', name: 'Turkish Lira' },
  { code: 'UAH', name: 'Ukrainian Hryvnia' },
];
const SYMBOLS = {
  NGN: '₦', USD: '$', EUR: '€', GBP: '£', GHS: '₵', KES: 'KSh', ZAR: 'R', EGP: 'E£',
  XOF: 'CFA', XAF: 'FCFA', RWF: 'FRw', TZS: 'TSh', UGX: 'USh', ZMW: 'ZK', MAD: 'DH', ETB: 'Br',
  BWP: 'P', MUR: '₨', CAD: 'CA$', AUD: 'A$', NZD: 'NZ$', INR: '₹', CNY: '¥', JPY: '¥',
  AED: 'د.إ', SAR: 'SR', CHF: 'CHF', SGD: 'S$', HKD: 'HK$', BRL: 'R$', MXN: 'MX$', SEK: 'kr',
  NOK: 'kr', DKK: 'kr', PLN: 'zł', TRY: '₺', UAH: '₴',
};
const FALLBACK_RATES = { USD: 1, NGN: 1600, EUR: 0.92, GBP: 0.79, GHS: 15.5, KES: 129, ZAR: 18.2, EGP: 49, XOF: 605, XAF: 605, RWF: 1300, TZS: 2600, UGX: 3750, ZMW: 26, MAD: 9.9, ETB: 120, BWP: 13.6, MUR: 46, CAD: 1.36, AUD: 1.51, NZD: 1.64, INR: 84, CNY: 7.1, JPY: 150, AED: 3.67, SAR: 3.75, CHF: 0.88, SGD: 1.34, HKD: 7.8, BRL: 5.7, MXN: 18.5, SEK: 10.6, NOK: 10.9, DKK: 6.9, PLN: 4.0, TRY: 34, UAH: 41 };

const PERSONALITIES = {
  genZ: { name: 'Gen Z Friend', emoji: '😎' }, coolUncle: { name: 'Cool Uncle', emoji: '🤙' }, harsh: { name: 'Harsh Coach', emoji: '💪' }, professional: { name: 'Advisor', emoji: '💼' },
  africanParent: { name: 'African Parent', emoji: '🩴' }, naijaHustler: { name: 'Naija Hustler', emoji: '💸' }, zen: { name: 'Zen Guru', emoji: '🧘' }, brother: { name: 'Brother', emoji: '🫂' },
};

const CAT = {
  groceries: { label: 'Groceries', icon: ShoppingCart, color: '#34d399', type: 'expense' }, dining: { label: 'Eating out', icon: Utensils, color: '#fb923c', type: 'expense' },
  transport: { label: 'Transport', icon: Car, color: '#60a5fa', type: 'expense' }, rent: { label: 'Rent & Housing', icon: Home, color: '#818cf8', type: 'expense' },
  bills: { label: 'Bills', icon: Zap, color: '#facc15', type: 'expense' }, data: { label: 'Data & Airtime', icon: Wifi, color: '#22d3ee', type: 'expense' },
  subs: { label: 'Subscriptions', icon: Tv, color: '#a78bfa', type: 'expense' }, shopping: { label: 'Shopping', icon: ShoppingBag, color: '#f472b6', type: 'expense' },
  health: { label: 'Health', icon: Heart, color: '#f87171', type: 'expense' }, fun: { label: 'Entertainment', icon: Film, color: '#e879f9', type: 'expense' },
  family: { label: 'Family & Gifts', icon: Gift, color: '#fbbf24', type: 'expense' }, education: { label: 'Education', icon: GraduationCap, color: '#2dd4bf', type: 'expense' },
  misc: { label: 'Other', icon: MoreHorizontal, color: '#94a3b8', type: 'expense' },
  salary: { label: 'Salary', icon: Briefcase, color: '#34d399', type: 'income', flow: 'active' }, freelance: { label: 'Freelance', icon: Laptop, color: '#22d3ee', type: 'income', flow: 'active' },
  business: { label: 'Business', icon: Store, color: '#818cf8', type: 'income', flow: 'active' }, invest: { label: 'Investments', icon: TrendingUp, color: '#4ade80', type: 'income', flow: 'passive' },
  royalty: { label: 'Royalties', icon: Music, color: '#c084fc', type: 'income', flow: 'passive' }, refund: { label: 'Refund', icon: RefreshCw, color: '#60a5fa', type: 'income', flow: 'active' },
  giftIn: { label: 'Gift', icon: Gift, color: '#f472b6', type: 'income', flow: 'passive' }, otherIn: { label: 'Other', icon: Wallet, color: '#94a3b8', type: 'income', flow: 'active' },
};
const catMeta = (id) => CAT[id] || CAT.misc;
const EXPENSE_CATS = Object.keys(CAT).filter(k => CAT[k].type === 'expense');
const INCOME_CATS = Object.keys(CAT).filter(k => CAT[k].type === 'income');

const THEMES = {
  dark: { name: 'dark', pageBg: 'radial-gradient(1100px 700px at 12% -8%, rgba(33,212,224,0.16), transparent 55%), radial-gradient(1000px 800px at 92% 108%, rgba(52,230,164,0.12), transparent 55%), radial-gradient(700px 700px at 50% 50%, rgba(138,108,255,0.10), transparent 60%), #04111b', headerBg: 'rgba(4,17,27,0.7)', navBg: 'rgba(4,17,27,0.85)', border: 'rgba(120,200,210,0.14)', card: { background: 'rgba(255,255,255,0.045)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(120,200,210,0.14)' }, solidPanel: { background: '#08161f', border: '1px solid rgba(33,212,224,0.18)', boxShadow: '0 18px 40px rgba(0,0,0,0.55)' }, inputBg: 'rgba(4,17,27,0.5)', inputBorder: 'rgba(120,200,210,0.18)', innerBg: 'rgba(255,255,255,0.035)', selectBg: '#08161f', textMain: '#eaf7f9', textSoft: '#cfe7ec', textMute: '#9bc1c9', textFaint: '#5d818c', accent: '#21d4e0', accentBright: '#5fe9f1', accentText: '#5fe9f1', accentBtnText: '#03121a', pos: '#34e6a4', posBright: '#5cf2bd', neg: '#ff6f86', glow: { boxShadow: '0 0 24px rgba(33,212,224,0.32)' }, barTrack: 'rgba(255,255,255,0.07)', pillBg: 'rgba(33,212,224,0.10)', pillBorder: 'rgba(33,212,224,0.28)', isDark: true },
  light: { name: 'light', pageBg: 'radial-gradient(1100px 700px at 12% -8%, rgba(13,154,166,0.10), transparent 55%), radial-gradient(1000px 800px at 92% 108%, rgba(15,157,107,0.08), transparent 55%), #eef5f5', headerBg: 'rgba(238,245,245,0.8)', navBg: 'rgba(255,255,255,0.92)', border: 'rgba(4,49,66,0.10)', card: { background: '#ffffff', border: '1px solid rgba(4,49,66,0.08)', boxShadow: '0 1px 3px rgba(4,49,66,0.06)' }, solidPanel: { background: '#ffffff', border: '1px solid rgba(4,49,66,0.12)', boxShadow: '0 18px 40px rgba(4,49,66,0.16)' }, inputBg: '#e7f0f0', inputBorder: 'rgba(4,49,66,0.14)', innerBg: '#f4f9f9', selectBg: '#ffffff', textMain: '#062231', textSoft: '#13414f', textMute: '#5a7785', textFaint: '#8aa6b0', accent: '#0e8f9b', accentBright: '#13a7b5', accentText: '#0c7e8a', accentBtnText: '#ffffff', pos: '#0f9d6b', posBright: '#12b07a', neg: '#e11d48', glow: { boxShadow: '0 4px 14px rgba(14,143,155,0.22)' }, barTrack: 'rgba(4,49,66,0.10)', pillBg: 'rgba(14,143,155,0.10)', pillBorder: 'rgba(14,143,155,0.30)', isDark: false },
};

const DAY = 86400000;

// Beta feedback lands here. Set this to the address you want it sent to.
const FEEDBACK_EMAIL = 'you@example.com';

function convert(amount, from, to, rates) { if (from === to) return amount; if (!rates || !rates[from] || !rates[to]) return amount; return amount * (rates[to] / rates[from]); }
function symbolOf(code) { return SYMBOLS[code] || code; }
function money(amount, code, max) { const m = max ?? (Math.abs(amount) >= 1000 ? 0 : 2); const sym = SYMBOLS[code] || code; const num = new Intl.NumberFormat('en-US', { maximumFractionDigits: m, minimumFractionDigits: 0 }).format(Math.abs(amount)); const sign = amount < 0 ? '−' : ''; return sign + sym + (/[A-Za-z.]$/.test(sym) ? ' ' : '') + num; }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
const startOfDay = (ts) => { const d = new Date(ts); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
function inRange(date, r) {
  const d = new Date(date);
  if (r.type === 'all') return true;
  if (r.type === 'days') return date >= Date.now() - r.n * DAY;
  if (r.type === 'months') { const c = new Date(); c.setMonth(c.getMonth() - r.n); return date >= c.getTime(); }
  if (r.type === 'month') return d.getFullYear() === r.y && d.getMonth() === r.m;
  if (r.type === 'year') return d.getFullYear() === r.y;
  return true;
}
// next due date for a monthly template, given its anchor day-of-month
function nextDue(rec) {
  const last = new Date(rec.lastLogged);
  const d = new Date(last.getFullYear(), last.getMonth(), 1);
  d.setMonth(d.getMonth() + 1);
  const day = Math.min(rec.anchorDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
  return new Date(d.getFullYear(), d.getMonth(), day, 12).getTime();
}

export default function App() {
  const { user, loading, logout, resetPassword, reauth, reauthGoogle, deleteAccount } = useAuth();
  const [themeName, setThemeName] = useState('dark');
  const T = THEMES[themeName];
  const [base, setBase] = useState('NGN');
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [updated, setUpdated] = useState(null);
  const [view, setView] = useState('dashboard');
  const [txns, setTxns] = useState([]);
  const [recur, setRecur] = useState([]);
  const [debts, setDebts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [personality, setPersonality] = useState('genZ');
  const [strategy, setStrategy] = useState('avalanche');
  const [solvencyCap, setSolvencyCap] = useState(true);
  const [defaultView, setDefaultView] = useState('dashboard');
  const [cashBalance, setCashBalance] = useState(0);
  const [inflation, setInflation] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(0);
  const [bio, setBio] = useState('');
  const [goal, setGoal] = useState('');
  const [onboarded, setOnboarded] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const didInit = useRef(false);

  useEffect(() => { fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json()).then(d => { if (d && d.rates) { setRates(d.rates); setUpdated(d.time_last_update_utc); } }).catch(() => {}); }, []);

  useEffect(() => {
    if (!user) return;
    didInit.current = false;
    const subs = [
      subscribeTransactions(user.uid, (rows) => setTxns(rows.map(normTxn))),
      subscribeDebts(user.uid, setDebts),
      subscribeRecurring(user.uid, setRecur),
      subscribeMessages(user.uid, setMessages),
      subscribeBudgetFolders(user.uid, setFolders),
      subscribeProfile(user.uid, (p) => {
        setThemeName(p.themeName === 'light' ? 'light' : 'dark');
        setBase(p.baseCurrency || 'NGN');
        setPersonality(p.personality || 'genZ');
        setStrategy(p.debtStrategy || 'avalanche');
        setSolvencyCap(p.solvencyCap !== false);
        setDefaultView(p.defaultView || 'dashboard');
        setName(p.name || '');
        setAvatar(Number.isInteger(p.avatar) ? p.avatar : 0);
        setBio(p.bio || '');
        setGoal(p.goal || '');
        setCashBalance(Number.isFinite(p.cashBalance) ? p.cashBalance : 0);
        setInflation(Number.isFinite(p.inflation) ? p.inflation : 0);
        setOnboarded(p.onboarded === true || !!(p.name && String(p.name).trim()));
        setProfileReady(true);
        if (!didInit.current) { setView(p.defaultView || 'dashboard'); didInit.current = true; }
      }),
    ];
    return () => subs.forEach((u) => u && u());
  }, [user]);

  // Native shell wiring. No-ops on the web.
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => wireBackButton({ getView: () => viewRef.current, setView }), []);
  useEffect(() => { styleStatusBar(T.isDark); }, [T.isDark]);

  useEffect(() => {
    if (!user) return;
    let timer;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => logout(), (isNative() ? 60 : 5) * 60 * 1000); };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, [user]);

  if (loading) return (<div className="min-h-screen flex items-center justify-center text-xl font-semibold" style={{ background: '#04111b', color: '#5fe9f1' }}>Loading MiFi…</div>);
  if (!user) return <Login />;

  const uid = user.uid;
  if (!profileReady) return (<div className="min-h-screen flex items-center justify-center text-xl font-semibold" style={{ background: '#04111b', color: '#5fe9f1' }}>Loading MiFi…</div>);
  if (!onboarded) return <Onboarding T={T} uid={uid} email={user.email} />;
  const t = totals(txns, base, rates);
  const totalDebt = debts.reduce((s, d) => s + convert(d.principal, d.currency || base, base, rates), 0);
  const totalPay = debts.reduce((s, d) => s + convert(d.monthlyPayment, d.currency || base, base, rates), 0);
  const solvency = (t.expense + totalPay) > 0 ? (t.income / (t.expense + totalPay)) * 100 : 0;
  const fmt = (n) => money(n, base);
  const dueCount = recur.filter(r => nextDue(r) <= Date.now()).length;

  const logRecur = async (rec) => { const due = nextDue(rec); await addTransaction(uid, { type: rec.type, cat: rec.cat, incomeType: rec.type === 'income' ? rec.incomeType : null, amount: rec.amount, currency: rec.currency, note: rec.note, date: Math.min(due, Date.now()) }); await updateRecurring(uid, rec.id, { lastLogged: due }); };
  const skipRecur = async (rec) => { const due = nextDue(rec); await updateRecurring(uid, rec.id, { lastLogged: due }); };

  const nav = [{ id: 'dashboard', label: 'Home', icon: Home }, { id: 'transactions', label: 'Money', icon: Receipt }, { id: 'budget', label: 'Budget', icon: Lightbulb }, { id: 'debts', label: 'Debts', icon: CreditCard }, { id: 'future', label: 'Future', icon: Route }, { id: 'mi', label: 'MiFi', icon: MessageCircle }];

  return (
    <div className="min-h-screen" style={{ background: T.pageBg, color: T.textMain }}>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'radial-gradient(rgba(120,200,210,0.16) 1px, transparent 1.4px)', backgroundSize: '26px 26px', WebkitMaskImage: 'radial-gradient(800px 800px at 50% 35%, #000 0%, transparent 72%)', maskImage: 'radial-gradient(800px 800px at 50% 35%, #000 0%, transparent 72%)', opacity: T.isDark ? 0.5 : 0.35 }} />
      <header className="sticky top-0 z-40" style={{ background: T.headerBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}` }}>
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><svg width="28" height="28" viewBox="0 0 40 40" fill="none"><path d="M5 30 L13 14 L20 24 L27 11" stroke={T.accent} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: T.isDark ? 'drop-shadow(0 0 6px rgba(33,212,224,0.7))' : 'none' }} /><path d="M27 11 C30 8 35 8 37 5 C35 11 32 14 28 14" fill={T.pos} /></svg><span className="text-xl font-bold tracking-tight">MiFi</span></div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowCur(!showCur)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: T.pillBg, border: `1px solid ${T.pillBorder}` }}><span style={{ color: T.accentText }}>{symbolOf(base)}</span><span style={{ color: T.textSoft }}>{base}</span><ChevronDown className="w-4 h-4" style={{ color: T.textMute }} /></button>
              {showCur && (<>
                <div className="fixed inset-0 z-40" onClick={() => setShowCur(false)} />
                <div className="absolute right-0 mt-2 w-60 rounded-2xl overflow-hidden z-50" style={T.solidPanel}>
                  <div className="px-4 py-2.5 text-xs uppercase tracking-wider" style={{ color: T.textFaint, borderBottom: `1px solid ${T.border}` }}>Display currency</div>
                  <div className="max-h-72 overflow-y-auto">{CURRENCIES.map(c => (<button key={c.code} onClick={() => { updateProfile(uid, { baseCurrency: c.code }); setShowCur(false); }} className="w-full flex items-center justify-between px-4 py-3" style={{ background: base === c.code ? T.pillBg : 'transparent' }}><span className="flex items-center gap-2.5"><span className="w-7 font-semibold" style={{ color: T.accentText }}>{symbolOf(c.code)}</span><span className="text-sm" style={{ color: T.textSoft }}>{c.name}</span></span>{base === c.code && <Check className="w-4 h-4" style={{ color: T.accent }} />}</button>))}</div>
                </div>
              </>)}
            </div>
            <button onClick={() => setView('settings')} aria-label="Settings" className="p-2 rounded-full" style={{ background: view === 'settings' ? T.pillBg : 'transparent', color: view === 'settings' ? T.accentText : T.textMute }}><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-6 pb-28">
        {view === 'dashboard' && <Dashboard T={T} uid={uid} t={t} solvency={solvency} solvencyCap={solvencyCap} totalDebt={totalDebt} totalPay={totalPay} debts={debts} fmt={fmt} personality={personality} updated={updated} rates={rates} base={base} name={name} avatar={avatar} recur={recur} logRecur={logRecur} skipRecur={skipRecur} onNav={setView} txns={txns} />}
        {view === 'transactions' && <Money T={T} uid={uid} txns={txns} recur={recur} logRecur={logRecur} skipRecur={skipRecur} base={base} rates={rates} />}
        {view === 'budget' && <Budget T={T} uid={uid} folders={folders} txns={txns} debts={debts} base={base} rates={rates} personality={personality} />}
        {view === 'debts' && <Debts T={T} uid={uid} debts={debts} base={base} rates={rates} fmt={fmt} personality={personality} t={t} strategy={strategy} />}
        {view === 'future' && <Future T={T} uid={uid} txns={txns} debts={debts} base={base} rates={rates} personality={personality} strategy={strategy} cashBalance={cashBalance} inflation={inflation} onNav={setView} />}
        {view === 'mi' && <Mi T={T} uid={uid} t={t} totalDebt={totalDebt} fmt={fmt} personality={personality} messages={messages} base={base} rates={rates} />}
        {view === 'settings' && <SettingsView T={T} uid={uid} email={user.email} resetPassword={resetPassword} reauth={reauth} reauthGoogle={reauthGoogle} deleteAccount={deleteAccount} provider={user.providerData && user.providerData[0] ? user.providerData[0].providerId : 'password'} name={name} avatar={avatar} bio={bio} goal={goal} base={base} themeName={themeName} personality={personality} strategy={strategy} solvencyCap={solvencyCap} defaultView={defaultView} cashBalance={cashBalance} inflation={inflation} logout={logout} onClose={() => setView('dashboard')} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40" style={{ background: T.navBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-md mx-auto px-2 py-3 flex justify-between">
          {nav.map(({ id, label, icon: Icon }) => { const on = view === id; const badge = id === 'transactions' && dueCount > 0; return (<button key={id} onClick={() => setView(id)} className="flex flex-col items-center gap-1 px-1.5 py-1 relative"><div className="relative"><Icon className="w-[22px] h-[22px]" style={on ? { color: T.accent, filter: T.isDark ? 'drop-shadow(0 0 6px rgba(33,212,224,0.6))' : 'none' } : { color: T.textFaint }} />{badge && <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: T.neg, color: '#fff' }}>{dueCount}</span>}</div><span className="text-[11px] font-medium" style={{ color: on ? T.accentText : T.textFaint }}>{label}</span></button>); })}
        </div>
      </nav>
    </div>
  );
}
function totals(txns, base, rates) {
  const d0 = new Date(); const monthly = txns.filter(t => { const d = new Date(t.date); return d.getMonth() === d0.getMonth() && d.getFullYear() === d0.getFullYear(); });
  let active = 0, passive = 0, expense = 0;
  for (const t of monthly) { const v = convert(t.amount, t.currency, base, rates); if (t.type === 'income') { if (t.incomeType === 'passive') passive += v; else active += v; } else expense += v; }
  return { active, passive, income: active + passive, expense, net: active + passive - expense };
}

function MiBanner({ T, personality, text }) {
  const p = PERSONALITIES[personality];
  return (
    <div className="rounded-2xl p-5" style={{ ...T.card, ...(T.isDark ? { background: 'linear-gradient(135deg, rgba(4,17,27,0.6), rgba(4,17,27,0.5))' } : {}) }}>
      <div className="flex items-center gap-3 mb-2"><MiFiAvatar size={40} /><div><p className="font-bold" style={{ color: T.textMain }}>MiFi says</p><p className="text-xs" style={{ color: T.textMute }}>{p.name}</p></div></div>
      <p className="text-sm leading-relaxed" style={{ color: T.textSoft }}>{text}</p>
    </div>
  );
}

// Due-soon card (shared by dashboard + money)
function DueCard({ T, recur, base, rates, logRecur, skipRecur, compact }) {
  const items = recur.map(r => ({ r, due: nextDue(r) })).sort((a, b) => a.due - b.due);
  const dueNow = items.filter(i => i.due <= Date.now());
  const upcoming = items.filter(i => i.due > Date.now() && i.due <= Date.now() + 7 * DAY);
  const show = compact ? dueNow : [...dueNow, ...upcoming];
  if (show.length === 0) return null;
  const dueLabel = (due) => { const diff = Math.round((startOfDay(due) - startOfDay(Date.now())) / DAY); if (diff < 0) return `${-diff}d overdue`; if (diff === 0) return 'Due today'; if (diff === 1) return 'Due tomorrow'; return `Due in ${diff}d`; };
  return (
    <div className="rounded-2xl p-5" style={{ ...T.card, border: dueNow.length ? `1px solid ${hexA(T.neg, 0.35)}` : T.card.border }}>
      <div className="flex items-center gap-2 mb-3"><Bell className="w-4 h-4" style={{ color: dueNow.length ? T.neg : T.accent }} /><h3 className="font-semibold" style={{ color: T.textSoft }}>{compact ? 'Due now' : 'Recurring · due soon'}</h3></div>
      <div className="space-y-2">
        {show.map(({ r, due }) => { const m = catMeta(r.cat); const Icon = m.icon; const over = due <= Date.now(); return (
          <div key={r.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: T.innerBg }}>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(m.color, 0.15) }}><Icon className="w-4 h-4" style={{ color: m.color }} /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate" style={{ color: T.textSoft }}>{r.note || m.label}</p><p className="text-xs" style={{ color: over ? T.neg : T.textFaint }}>{dueLabel(due)} · {money(r.amount, r.currency, 0)}</p></div>
            {over ? (<div className="flex gap-1.5 shrink-0"><button onClick={() => logRecur(r)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: T.accent, color: T.accentBtnText }}>Log it</button><button onClick={() => skipRecur(r)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: T.inputBg, color: T.textMute }}>Skip</button></div>) : (<span className="text-xs font-medium shrink-0" style={{ color: T.textFaint }}>{money(convert(r.amount, r.currency, base, rates), base, 0)}</span>)}
          </div>); })}
      </div>
    </div>
  );
}

// ---------- MONEY ----------
function Money({ T, uid, txns, recur, logRecur, skipRecur, base, rates }) {
  const [tab, setTab] = useState('activity');
  const [range, setRange] = useState({ type: 'days', n: 30 });
  const [adding, setAdding] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [sel, setSel] = useState(() => new Set());
  const [recat, setRecat] = useState(false);
  const toggleSel = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const exitSel = () => { setSelMode(false); setSel(new Set()); setRecat(false); };
  const bulkDel = async () => { for (const id of sel) await deleteTransaction(uid, id); exitSel(); };
  const bulkRecat = async (cat) => { for (const id of sel) await updateTransaction(uid, id, { cat }); exitSel(); };
  const add = async (data) => { const { recurring, every, anchorDay, ...tx } = data; await addTransaction(uid, tx); if (recurring) await addRecurring(uid, { type: tx.type, cat: tx.cat, incomeType: tx.incomeType, amount: tx.amount, currency: tx.currency, note: tx.note, anchorDay: new Date(tx.date).getDate(), lastLogged: tx.date }); setAdding(false); };
  const del = (id) => deleteTransaction(uid, id);
  const edit = (id, data) => updateTransaction(uid, id, data);
  const filtered = txns.filter(t => inRange(t.date, range)).sort((a, b) => b.date - a.date);
  let inc = 0, exp = 0;
  for (const t of filtered) { const v = convert(t.amount, t.currency, base, rates); if (t.type === 'income') inc += v; else exp += v; }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold tracking-tight">Money</h2><div className="flex items-center gap-2">{tab === 'activity' && filtered.length > 0 && <button onClick={() => selMode ? exitSel() : setSelMode(true)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={selMode ? { background: T.pillBg, color: T.accentText, border: `1px solid ${T.pillBorder}` } : { background: T.innerBg, color: T.textMute }}>{selMode ? 'Cancel' : 'Select'}</button>}<button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: T.accent, color: T.accentBtnText, ...T.glow }}><Plus className="w-4 h-4" />Add</button></div></div>
      <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl" style={{ background: T.innerBg }}>
        {[['activity', 'Activity', List], ['summary', 'Summary', BarChart3], ['recurring', 'Recurring', Repeat]].map(([id, label, Icon]) => (<button key={id} onClick={() => { setTab(id); exitSel(); }} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all" style={tab === id ? { background: T.accent, color: T.accentBtnText } : { color: T.textMute }}><Icon className="w-4 h-4" />{label}</button>))}
      </div>

      {adding && <TxnForm T={T} base={base} onSave={add} onCancel={() => setAdding(false)} allowRecurring />}

      {tab === 'recurring' ? (
        <RecurringTab T={T} uid={uid} recur={recur} logRecur={logRecur} skipRecur={skipRecur} base={base} rates={rates} />
      ) : (<>
        <PeriodBar T={T} range={range} setRange={setRange} />
        <div className="grid grid-cols-3 gap-2">
          <MiniStat T={T} label="In" value={money(inc, base)} color={T.accentText} />
          <MiniStat T={T} label="Out" value={money(exp, base)} color={T.neg} />
          <MiniStat T={T} label="Net" value={`${inc - exp < 0 ? '−' : ''}${money(Math.abs(inc - exp), base)}`} color={inc - exp >= 0 ? T.accentText : T.neg} />
        </div>
        {tab === 'activity' && <DueCard T={T} recur={recur} base={base} rates={rates} logRecur={logRecur} skipRecur={skipRecur} compact />}
        {selMode && tab === 'activity' && (<div className="rounded-2xl p-3 space-y-2" style={T.card}><div className="flex items-center justify-between"><span className="text-sm font-semibold" style={{ color: T.textMain }}>{sel.size} selected</span><div className="flex gap-2"><button disabled={sel.size === 0} onClick={() => setRecat((r) => !r)} className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: T.pillBg, color: T.accentText }}>Recategorize</button><button disabled={sel.size === 0} onClick={bulkDel} className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: hexA(T.neg, 0.14), color: T.neg }}>Delete</button></div></div>{recat && <div className="grid grid-cols-4 gap-2 pt-1">{['groceries', 'dining', 'transport', 'rent', 'bills', 'data', 'subs', 'shopping', 'health', 'fun', 'family', 'education', 'misc'].map((id) => { const m = catMeta(id); const Icon = m.icon; return (<button key={id} onClick={() => bulkRecat(id)} className="flex flex-col items-center gap-1 py-2 rounded-xl" style={{ background: T.innerBg, border: `1px solid ${T.border}` }}><Icon className="w-5 h-5" style={{ color: m.color }} /><span className="text-[10px] leading-tight text-center px-0.5" style={{ color: T.textFaint }}>{m.label}</span></button>); })}</div>}</div>)}
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={T.card}><Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: T.textFaint }} /><p style={{ color: T.textMute }}>Nothing in this period</p></div>
        ) : tab === 'activity' ? (
          <Activity T={T} txns={filtered} base={base} rates={rates} onDel={del} onEdit={edit} selMode={selMode} sel={sel} onToggle={toggleSel} />
        ) : (
          <Summary T={T} txns={filtered} base={base} rates={rates} totalOut={exp} totalIn={inc} />
        )}
      </>)}
    </div>
  );
}

function RecurringTab({ T, uid, recur, logRecur, skipRecur, base, rates }) {
  const [adding, setAdding] = useState(false);
  const items = recur.map(r => ({ r, due: nextDue(r) })).sort((a, b) => a.due - b.due);
  const monthlyOut = recur.filter(r => r.type === 'expense').reduce((s, r) => s + convert(r.amount, r.currency, base, rates), 0);
  const monthlyIn = recur.filter(r => r.type === 'income').reduce((s, r) => s + convert(r.amount, r.currency, base, rates), 0);
  const addRec = async (data) => { await addRecurring(uid, { type: data.type, cat: data.cat, incomeType: data.incomeType, amount: data.amount, currency: data.currency, note: data.note, anchorDay: new Date(data.date).getDate(), lastLogged: data.date - 31 * DAY }); setAdding(false); };
  const delRec = (id) => deleteRecurring(uid, id);
  const dueLabel = (due) => { const diff = Math.round((startOfDay(due) - startOfDay(Date.now())) / DAY); if (diff < 0) return `${-diff}d overdue`; if (diff === 0) return 'Due today'; if (diff === 1) return 'Tomorrow'; return `In ${diff} days`; };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl p-4" style={T.card}><p className="text-xs mb-1" style={{ color: T.textFaint }}>Recurring in / mo</p><p className="font-bold tabular-nums" style={{ color: T.accentText }}>{money(monthlyIn, base)}</p></div>
        <div className="rounded-2xl p-4" style={T.card}><p className="text-xs mb-1" style={{ color: T.textFaint }}>Recurring out / mo</p><p className="font-bold tabular-nums" style={{ color: T.neg }}>{money(monthlyOut, base)}</p></div>
      </div>
      <button onClick={() => setAdding(true)} className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ background: T.pillBg, color: T.accentText, border: `1px solid ${T.pillBorder}` }}><Plus className="w-4 h-4" />New recurring item</button>
      {adding && <TxnForm T={T} base={base} onSave={addRec} onCancel={() => setAdding(false)} forceRecurring />}
      <div className="space-y-2.5">
        {items.length === 0 && <div className="rounded-2xl p-10 text-center" style={T.card}><Repeat className="w-10 h-10 mx-auto mb-3" style={{ color: T.textFaint }} /><p style={{ color: T.textMute }}>No recurring items yet</p></div>}
        {items.map(({ r, due }) => { const m = catMeta(r.cat); const Icon = m.icon; const over = due <= Date.now(); return (
          <div key={r.id} className="rounded-2xl p-4" style={T.card}>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexA(m.color, 0.15), border: `1px solid ${hexA(m.color, 0.3)}` }}><Icon className="w-5 h-5" style={{ color: m.color }} /></span>
              <div className="min-w-0 flex-1"><p className="font-semibold truncate" style={{ color: T.textSoft }}>{r.note || m.label}</p><div className="flex items-center gap-1.5 text-xs"><Repeat className="w-3 h-3" style={{ color: T.textFaint }} /><span style={{ color: T.textFaint }}>Monthly · day {r.anchorDay}</span></div></div>
              <div className="text-right shrink-0"><p className="font-bold tabular-nums" style={{ color: r.type === 'income' ? T.accentText : T.neg }}>{r.type === 'income' ? '+' : '−'}{money(r.amount, r.currency, 0)}</p><p className="text-xs" style={{ color: over ? T.neg : T.textFaint }}>{dueLabel(due)}</p></div>
            </div>
            <div className="flex gap-2 mt-3">
              {over ? (<><button onClick={() => logRecur(r)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: T.accent, color: T.accentBtnText }}>Log this period</button><button onClick={() => skipRecur(r)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: T.inputBg, color: T.textMute }}>Skip</button></>) : (<div className="flex-1 py-2 rounded-lg text-sm font-medium text-center" style={{ background: T.innerBg, color: T.textMute }}><Clock className="w-3.5 h-3.5 inline mr-1" />{dueLabel(due)}</div>)}
              <button onClick={() => delRec(r.id)} className="px-3 py-2 rounded-lg" style={{ background: hexA(T.neg, 0.1), color: T.neg }}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>); })}
      </div>
    </div>
  );
}

function PeriodBar({ T, range, setRange }) {
  const nowY = new Date().getFullYear(), nowM = new Date().getMonth();
  const presetDays = [3, 7, 30];
  const presets = [{ key: '3d', label: '3D', r: { type: 'days', n: 3 } }, { key: '7d', label: '7D', r: { type: 'days', n: 7 } }, { key: '30d', label: '30D', r: { type: 'days', n: 30 } }, { key: 'mo', label: 'Month', r: { type: 'month', y: nowY, m: nowM } }, { key: 'yr', label: 'Year', r: { type: 'year', y: nowY } }, { key: 'all', label: 'All', r: { type: 'all' } }];
  const isCustom = (range.type === 'days' && !presetDays.includes(range.n)) || range.type === 'months';
  const isActive = (p) => { if (p.r.type !== range.type) return false; if (p.r.type === 'days') return p.r.n === range.n && presetDays.includes(range.n); if (p.r.type === 'month') return p.r.m === range.m && p.r.y === range.y; if (p.r.type === 'year') return p.r.y === range.y; return true; };
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const stepMonth = (d) => { let m = range.m + d, y = range.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setRange({ type: 'month', y, m }); };
  const unit = range.type === 'months' ? 'months' : 'days';
  const setN = (val) => { const n = Math.max(1, Math.min(999, parseInt(val) || 1)); setRange({ type: unit, n }); };
  const setUnit = (u) => setRange({ type: u, n: range.n || 1 });
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {presets.map(p => (<button key={p.key} onClick={() => setRange(p.r)} className="px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap" style={isActive(p) ? { background: T.accent, color: T.accentBtnText } : { background: T.innerBg, color: T.textMute, border: `1px solid ${T.border}` }}>{p.label}</button>))}
        <button onClick={() => { if (!isCustom) setRange({ type: 'days', n: 5 }); }} className="px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap" style={isCustom ? { background: T.accent, color: T.accentBtnText } : { background: T.innerBg, color: T.textMute, border: `1px solid ${T.border}` }}>Custom</button>
      </div>
      {range.type === 'month' && (<div className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: T.innerBg }}><button onClick={() => stepMonth(-1)} className="p-1.5 rounded-lg" style={{ color: T.accentText }}><ChevronLeft className="w-5 h-5" /></button><span className="font-semibold text-sm">{months[range.m]} {range.y}</span><button onClick={() => stepMonth(1)} className="p-1.5 rounded-lg" style={{ color: T.accentText }}><ChevronRight className="w-5 h-5" /></button></div>)}
      {range.type === 'year' && (<div className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: T.innerBg }}><button onClick={() => setRange({ type: 'year', y: range.y - 1 })} className="p-1.5 rounded-lg" style={{ color: T.accentText }}><ChevronLeft className="w-5 h-5" /></button><span className="font-semibold text-sm">{range.y}</span><button onClick={() => setRange({ type: 'year', y: range.y + 1 })} className="p-1.5 rounded-lg" style={{ color: T.accentText }}><ChevronRight className="w-5 h-5" /></button></div>)}
      {isCustom && (<div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: T.innerBg }}><span className="text-sm font-medium" style={{ color: T.textMute }}>Last</span><input type="number" min="1" value={range.n} onChange={e => setN(e.target.value)} className="w-16 px-2 py-1.5 rounded-lg text-center font-semibold outline-none tabular-nums" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textMain }} /><div className="flex gap-1 ml-auto">{[['days', 'Days'], ['months', 'Months']].map(([u, label]) => (<button key={u} onClick={() => setUnit(u)} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={unit === u ? { background: T.accent, color: T.accentBtnText } : { background: T.inputBg, color: T.textMute }}>{label}</button>))}</div></div>)}
    </div>
  );
}

function MiniStat({ T, label, value, color }) { return <div className="rounded-2xl p-3" style={T.card}><p className="text-xs mb-1" style={{ color: T.textFaint }}>{label}</p><p className="font-bold tabular-nums text-sm leading-tight" style={{ color }}>{value}</p></div>; }
function dayLabel(ts) { const diff = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / DAY); if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday'; return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }); }

function Activity({ T, txns, base, rates, onDel, onEdit, selMode, sel, onToggle }) {
  const groups = []; const map = {};
  for (const t of txns) { const k = startOfDay(t.date); if (!map[k]) { map[k] = { key: k, items: [] }; groups.push(map[k]); } map[k].items.push(t); }
  return (
    <div className="space-y-4">
      {groups.map(g => { let net = 0; for (const t of g.items) { const v = convert(t.amount, t.currency, base, rates); net += t.type === 'income' ? v : -v; } return (
        <div key={g.key}>
          <div className="flex items-center justify-between px-1 mb-2"><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMute }}>{dayLabel(g.key)}</span><span className="text-xs font-semibold tabular-nums" style={{ color: net >= 0 ? T.accentText : T.neg }}>{net < 0 ? '−' : '+'}{money(Math.abs(net), base)}</span></div>
          <div className="space-y-2">{g.items.map(t => <TxnRow key={t.id} T={T} t={t} base={base} rates={rates} onDel={onDel} onEdit={onEdit} selMode={selMode} selected={sel && sel.has(t.id)} onToggle={onToggle} />)}</div>
        </div>); })}
    </div>
  );
}

function CatChip({ id, size = 42 }) { const m = catMeta(id); const Icon = m.icon; return <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: hexA(m.color, 0.15), border: `1px solid ${hexA(m.color, 0.3)}` }}><Icon className="w-5 h-5" style={{ color: m.color }} /></div>; }

function TxnRow({ T, t, base, rates, onDel, onEdit, selMode, selected, onToggle }) {
  const [editing, setEditing] = useState(false);
  if (selMode) { const inc = t.type === 'income'; return (
    <button onClick={() => onToggle(t.id)} className="w-full text-left rounded-2xl p-3 flex items-center gap-3" style={{ ...T.card, boxShadow: selected ? `0 0 0 2px ${T.accent}` : (T.card.boxShadow || 'none') }}>
      <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: selected ? T.accent : 'transparent', border: `1px solid ${selected ? T.accent : T.textFaint}` }}>{selected && <Check className="w-4 h-4" style={{ color: T.accentBtnText }} />}</span>
      <CatChip id={t.cat} size={38} />
      <div className="min-w-0 flex-1"><p className="font-semibold truncate" style={{ color: T.textSoft }}>{t.note || catMeta(t.cat).label}</p><p className="text-xs truncate" style={{ color: T.textFaint }}>{catMeta(t.cat).label}</p></div>
      <span className="font-bold tabular-nums shrink-0" style={{ color: inc ? T.accentText : T.neg }}>{inc ? '+' : '\u2212'}{money(Math.abs(convert(t.amount, t.currency, base, rates)), base)}</span>
    </button>
  ); }
  if (editing) return <TxnForm T={T} base={base} initial={t} onSave={(d) => { onEdit(t.id, d); setEditing(false); }} onDelete={() => { onDel(t.id); setEditing(false); }} onCancel={() => setEditing(false)} />;
  const inBase = convert(t.amount, t.currency, base, rates); const inc = t.type === 'income'; const m = catMeta(t.cat);
  return (
    <button onClick={() => setEditing(true)} className="w-full text-left rounded-2xl p-3 flex items-center gap-3" style={T.card}>
      <CatChip id={t.cat} />
      <div className="min-w-0 flex-1"><p className="font-semibold truncate" style={{ color: T.textSoft }}>{t.note || m.label}</p><p className="text-xs truncate" style={{ color: T.textFaint }}>{m.label}{t.incomeType ? ` · ${t.incomeType}` : ''}{(t.currency && t.currency !== base) ? ` · ${money(t.amount, t.currency)}` : ''}</p></div>
      <span className="font-bold tabular-nums shrink-0" style={{ color: inc ? T.accentText : T.neg }}>{inc ? '+' : '−'}{money(Math.abs(inBase), base)}</span>
    </button>
  );
}

function TxnForm({ T, base, initial, onSave, onDelete, onCancel, allowRecurring, forceRecurring }) {
  const [type, setType] = useState(initial?.type || 'expense');
  const [cat, setCat] = useState(initial?.cat || 'groceries');
  const [incomeType, setIncomeType] = useState(initial?.incomeType || 'active');
  const [amount, setAmount] = useState(initial?.amount || '');
  const [currency, setCurrency] = useState(initial?.currency || base);
  const [note, setNote] = useState(initial?.note || '');
  const [recurring, setRecurring] = useState(false);
  const [dateStr, setDateStr] = useState(() => { const d = new Date(initial?.date || Date.now()); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const pickType = (nt) => { setType(nt); const list = nt === 'expense' ? EXPENSE_CATS : INCOME_CATS; if (!list.includes(cat)) setCat(list[0]); };
  const pickCat = (id) => { setCat(id); const fl = catMeta(id).flow; if (fl) setIncomeType(fl); };
  const submit = () => { const v = parseFloat(amount); if (!(v > 0)) return; const [y, mo, da] = dateStr.split('-').map(Number); onSave({ type, cat, incomeType: type === 'income' ? incomeType : null, amount: v, currency, note: note.trim(), date: new Date(y, mo - 1, da, 12).getTime(), recurring: forceRecurring || recurring }); };
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ ...T.card, border: `1px solid ${T.pillBorder}` }}>
      {forceRecurring && <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.accentText }}><Repeat className="w-4 h-4" />New recurring item</div>}
      <div className="grid grid-cols-2 gap-2"><Seg T={T} active={type === 'income'} pos onClick={() => pickType('income')}>Income</Seg><Seg T={T} active={type === 'expense'} onClick={() => pickType('expense')}>Expense</Seg></div>
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: T.textMute }}>Category</p>
        <div className="grid grid-cols-4 gap-2">{cats.map(id => { const m = catMeta(id); const Icon = m.icon; const on = cat === id; return (<button key={id} onClick={() => pickCat(id)} className="flex flex-col items-center gap-1 py-2 rounded-xl" style={on ? { background: hexA(m.color, 0.16), border: `1px solid ${hexA(m.color, 0.5)}` } : { background: T.innerBg, border: `1px solid ${T.border}` }}><Icon className="w-5 h-5" style={{ color: on ? m.color : T.textMute }} /><span className="text-[10px] leading-tight text-center px-0.5" style={{ color: on ? T.textSoft : T.textFaint }}>{m.label}</span></button>); })}</div>
      </div>
      {type === 'income' && (<div className="grid grid-cols-2 gap-2"><Seg T={T} active={incomeType === 'active'} muted onClick={() => setIncomeType('active')}>Active</Seg><Seg T={T} active={incomeType === 'passive'} pos onClick={() => setIncomeType('passive')}>Passive</Seg></div>)}
      <div className="flex gap-2"><Input T={T} value={amount} onChange={setAmount} placeholder="0.00" type="number" className="flex-1" /><CurSelect T={T} value={currency} onChange={setCurrency} /></div>
      <Input T={T} value={note} onChange={setNote} placeholder="Note (optional)" />
      <div><p className="text-xs font-medium mb-1.5" style={{ color: T.textMute }}>{forceRecurring ? 'Anchor date (sets the monthly day)' : 'Date'}</p><Input T={T} value={dateStr} onChange={setDateStr} type="date" /></div>
      {allowRecurring && (
        <button onClick={() => setRecurring(!recurring)} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: T.innerBg, border: `1px solid ${recurring ? T.pillBorder : T.border}` }}>
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: recurring ? T.accentText : T.textMute }}><Repeat className="w-4 h-4" />Repeat monthly</span>
          <span className="w-10 h-6 rounded-full p-0.5 transition-all" style={{ background: recurring ? T.accent : T.barTrack }}><span className="block w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: recurring ? 'translateX(16px)' : 'none' }} /></span>
        </button>
      )}
      <div className="flex gap-2"><button onClick={submit} className="flex-1 py-2.5 rounded-xl font-semibold" style={{ background: T.accent, color: T.accentBtnText, ...T.glow }}>Save</button>{onDelete && <button onClick={onDelete} className="px-4 py-2.5 rounded-xl" style={{ background: hexA(T.neg, 0.12), color: T.neg }}><Trash2 className="w-5 h-5" /></button>}<button onClick={onCancel} className="px-5 py-2.5 rounded-xl font-medium" style={{ background: T.inputBg, color: T.textSoft }}>Cancel</button></div>
    </div>
  );
}

function Donut({ T, segments, total }) { const r = 56, c = 2 * Math.PI * r; let acc = 0; return (<svg width="150" height="150" viewBox="0 0 150 150"><g transform="rotate(-90 75 75)"><circle cx="75" cy="75" r={r} fill="none" stroke={T.barTrack} strokeWidth="18" />{segments.map((s, i) => { const frac = total > 0 ? s.value / total : 0; const dash = frac * c; const el = <circle key={i} cx="75" cy="75" r={r} fill="none" stroke={s.color} strokeWidth="18" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-acc * c} />; acc += frac; return el; })}</g></svg>); }

function Summary({ T, txns, base, rates, totalOut, totalIn }) {
  const expAgg = {}, incAgg = {};
  for (const t of txns) { const v = convert(t.amount, t.currency, base, rates); const bag = t.type === 'income' ? incAgg : expAgg; if (!bag[t.cat]) bag[t.cat] = { sum: 0, count: 0 }; bag[t.cat].sum += v; bag[t.cat].count++; }
  const expRows = Object.entries(expAgg).map(([cat, d]) => ({ cat, ...d })).sort((a, b) => b.sum - a.sum);
  const incRows = Object.entries(incAgg).map(([cat, d]) => ({ cat, ...d })).sort((a, b) => b.sum - a.sum);
  const top = expRows.slice(0, 6); const restSum = expRows.slice(6).reduce((s, r) => s + r.sum, 0);
  const segments = top.map(r => ({ color: catMeta(r.cat).color, value: r.sum })); if (restSum > 0) segments.push({ color: '#64748b', value: restSum });
  return (
    <div className="space-y-4">
      {expRows.length > 0 && (
        <div className="rounded-2xl p-5" style={T.card}>
          <h3 className="font-semibold mb-3" style={{ color: T.textSoft }}>Where it went</h3>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0" style={{ width: 150, height: 150 }}><Donut T={T} segments={segments} total={totalOut} /><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs" style={{ color: T.textFaint }}>spent</span><span className="font-bold tabular-nums text-sm" style={{ color: T.textMain }}>{money(totalOut, base)}</span></div></div>
            <div className="flex-1 space-y-1.5 min-w-0">{top.map(r => { const m = catMeta(r.cat); const pct = totalOut > 0 ? (r.sum / totalOut) * 100 : 0; return (<div key={r.cat} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} /><span className="text-xs flex-1 truncate" style={{ color: T.textMute }}>{m.label}</span><span className="text-xs font-semibold tabular-nums" style={{ color: T.textSoft }}>{pct.toFixed(0)}%</span></div>); })}{restSum > 0 && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#64748b' }} /><span className="text-xs flex-1" style={{ color: T.textMute }}>Other</span><span className="text-xs font-semibold tabular-nums" style={{ color: T.textSoft }}>{((restSum / totalOut) * 100).toFixed(0)}%</span></div>}</div>
          </div>
        </div>
      )}
      {expRows.length > 0 && <CatTable T={T} title="Spending by category" rows={expRows} total={totalOut} base={base} neg />}
      {incRows.length > 0 && <CatTable T={T} title="Income by source" rows={incRows} total={totalIn} base={base} />}
    </div>
  );
}

function CatTable({ T, title, rows, total, base, neg }) {
  return (
    <div className="rounded-2xl p-5" style={T.card}>
      <h3 className="font-semibold mb-3" style={{ color: T.textSoft }}>{title}</h3>
      <div className="flex items-center px-1 pb-2 mb-1 text-xs font-medium" style={{ color: T.textFaint, borderBottom: `1px solid ${T.border}` }}><span className="flex-1">Category</span><span className="w-20 text-right">Amount</span><span className="w-12 text-right">%</span></div>
      <div className="space-y-0.5">{rows.map(r => { const m = catMeta(r.cat); const Icon = m.icon; const pct = total > 0 ? (r.sum / total) * 100 : 0; return (<div key={r.cat} className="flex items-center py-2"><span className="flex items-center gap-2.5 flex-1 min-w-0"><span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(m.color, 0.15) }}><Icon className="w-4 h-4" style={{ color: m.color }} /></span><span className="min-w-0"><span className="text-sm font-medium block truncate" style={{ color: T.textSoft }}>{m.label}</span><span className="text-xs" style={{ color: T.textFaint }}>{r.count} {r.count === 1 ? 'item' : 'items'}</span></span></span><span className="w-20 text-right font-semibold tabular-nums text-sm" style={{ color: neg ? T.neg : T.accentText }}>{money(r.sum, base)}</span><span className="w-12 text-right tabular-nums text-sm" style={{ color: T.textMute }}>{pct.toFixed(0)}%</span></div>); })}</div>
      <div className="flex items-center pt-2 mt-1" style={{ borderTop: `1px solid ${T.border}` }}><span className="flex-1 text-sm font-semibold" style={{ color: T.textMain }}>Total</span><span className="w-20 text-right font-bold tabular-nums text-sm" style={{ color: T.textMain }}>{money(total, base)}</span><span className="w-12 text-right text-sm" style={{ color: T.textFaint }}>100%</span></div>
    </div>
  );
}

// ---------- DASHBOARD ----------
function Dashboard({ T, uid, t, solvency, solvencyCap, totalDebt, totalPay, debts, fmt, personality, updated, rates, base, name, avatar, recur, logRecur, skipRecur, onNav, txns }) {
  const insight = getMiInsight(t, totalPay, debts, personality, fmt);
  const shown = solvencyCap ? Math.min(solvency, 100) : solvency;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><p className="text-sm" style={{ color: T.textMute }}>Welcome back,</p><p className="text-xl font-bold tracking-tight">{name}</p></div><Avatar i={avatar} size={44} /></div>
      <button onClick={() => onNav('mi')} className="w-full text-left"><MiBanner T={T} personality={personality} text={insight} /><div className="flex items-center justify-end gap-1 mt-2 text-xs font-medium pr-1" style={{ color: T.accentText }}><span>Chat with MiFi</span><ChevronRight className="w-3.5 h-3.5" /></div></button>
      <DueCard T={T} recur={recur} base={base} rates={rates} logRecur={logRecur} skipRecur={skipRecur} compact />
      <div className="rounded-3xl p-6 flex flex-col items-center" style={{ ...T.card, ...(T.isDark ? { background: 'linear-gradient(160deg, rgba(4,17,27,0.5), rgba(15,23,42,0.55))' } : {}) }}>
        <div className="flex items-center gap-2 mb-1 self-start"><Flame className="w-4 h-4" style={{ color: T.accent }} /><span className="text-sm font-medium uppercase tracking-wider" style={{ color: T.textMute }}>Solvency Score</span><InfoDot T={T} text="How close your income is to covering your monthly obligations. 100% means fully covered. The long-term goal is passive income doing that job, not your salary." /></div>
        <div className="relative my-2" style={{ width: 190, height: 190 }}><Gauge value={solvency} T={T} /><div className="absolute inset-0 flex flex-col items-center justify-center"><Sprout T={T} /><span className="text-4xl font-bold tracking-tight tabular-nums" style={T.isDark ? { textShadow: '0 0 20px rgba(33,212,224,0.5)' } : {}}>{shown.toFixed(0)}<span className="text-2xl" style={{ color: T.textFaint }}>%</span></span><span className="text-xs mt-1" style={{ color: T.textFaint }}>income vs obligations</span></div></div>
        <p className="text-sm text-center" style={{ color: T.textMute }}>{solvency >= 100 ? "Your income covers this month's obligations" : `${(100 - solvency).toFixed(0)}% to fully covering this month`}</p>
      </div>
      <MCashflow T={T} txns={txns} base={base} rates={rates} />
      <div className="rounded-2xl p-5" style={T.card}><div className="flex items-center justify-between"><div><p className="text-sm mb-1" style={{ color: T.textMute }}>Net this month</p><p className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: t.net >= 0 ? T.pos : T.neg }}>{t.net < 0 ? '−' : ''}{fmt(Math.abs(t.net))}</p></div><div className="p-3 rounded-2xl" style={{ background: t.net >= 0 ? T.pillBg : hexA(T.neg, 0.1) }}>{t.net >= 0 ? <ArrowUpRight className="w-7 h-7" style={{ color: T.pos }} /> : <ArrowDownRight className="w-7 h-7" style={{ color: T.neg }} />}</div></div></div>
      <div className="grid grid-cols-3 gap-3"><Tile T={T} label="Active" value={fmt(t.active)} icon={<Wallet className="w-4 h-4" />} tint={T.textMute} /><Tile T={T} label="Passive" value={fmt(t.passive)} icon={<TrendingUp className="w-4 h-4" />} tint={T.pos} glow /><Tile T={T} label="Spent" value={fmt(t.expense)} icon={<TrendingDown className="w-4 h-4" />} tint={T.neg} /></div>
      <div className="rounded-2xl p-5" style={T.card}>
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold" style={{ color: T.textSoft }}>Debt Freedom</h3><button onClick={() => onNav('debts')} className="text-xs font-medium" style={{ color: T.accentText }}>Manage →</button></div>
        {debts.length === 0 ? <p className="text-sm" style={{ color: T.textFaint }}>No debts tracked.</p> : (<div className="space-y-3"><div className="flex gap-3"><div className="flex-1 rounded-xl p-3" style={{ background: T.innerBg }}><p className="text-xs mb-0.5" style={{ color: T.textFaint }}>Total owed</p><p className="text-lg font-bold tabular-nums">{fmt(totalDebt)}</p></div><div className="flex-1 rounded-xl p-3" style={{ background: T.innerBg }}><p className="text-xs mb-0.5" style={{ color: T.textFaint }}>Monthly</p><p className="text-lg font-bold tabular-nums">{fmt(totalPay)}</p></div></div>{debts.slice(0, 2).map(d => { const prog = d.initialPrincipal ? ((d.initialPrincipal - d.principal) / d.initialPrincipal) * 100 : 0; return (<div key={d.id}><div className="flex justify-between text-sm mb-1.5"><span style={{ color: T.textSoft }}>{d.name}</span><span style={{ color: T.textFaint }}>{d.interestRate}%</span></div><div className="h-2 rounded-full" style={{ background: T.barTrack }}><div className="h-2 rounded-full" style={{ width: `${prog}%`, background: `linear-gradient(90deg,${T.accent},${T.pos})`, boxShadow: T.isDark ? '0 0 10px rgba(33,212,224,0.5)' : 'none' }} /></div></div>); })}</div>)}
      </div>
      <p className="text-center text-xs" style={{ color: T.textFaint }}>{rates ? `Rates updated ${updated ? new Date(updated).toLocaleDateString() : 'today'} · values in ${base}` : 'Loading live exchange rates…'}</p>
    </div>
  );
}
function Tile({ T, label, value, icon, tint, glow }) { return (<div className="rounded-2xl p-3.5" style={T.card}><div className="flex items-center gap-1.5 mb-2" style={{ color: tint }}>{icon}<span className="text-xs" style={{ color: T.textFaint }}>{label}</span></div><p className="text-base font-bold tabular-nums leading-tight" style={glow && T.isDark ? { color: tint, textShadow: '0 0 12px rgba(33,212,224,0.4)' } : { color: glow ? tint : T.textSoft }}>{value}</p></div>); }
function Gauge({ value, T }) { const r = 76, c = 2 * Math.PI * r; const pct = Math.max(0, Math.min(value, 100)); const dash = (pct / 100) * c; return (<svg width="190" height="190" viewBox="0 0 190 190" className="-rotate-90"><defs><linearGradient id="gauge" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={T.accent} /><stop offset="100%" stopColor={T.pos} /></linearGradient><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><circle cx="95" cy="95" r={r} fill="none" stroke={T.barTrack} strokeWidth="13" /><circle cx="95" cy="95" r={r} fill="none" stroke="url(#gauge)" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} filter={T.isDark ? 'url(#glow)' : undefined} style={{ transition: 'stroke-dasharray 0.6s ease' }} /></svg>); }

// ---------- DEBTS ----------
function Debts({ T, uid, debts, base, rates, fmt, personality, t, strategy }) {
  const [adding, setAdding] = useState(false);
  const add = (d) => { addDebt(uid, d); setAdding(false); };
  const del = (id) => deleteDebt(uid, id);
  const edit = (id, d) => updateDebt(uid, id, d);
  const sorted = orderDebts(debts, strategy, base, rates);
  const free = freedomDate(debts, base, rates, strategy);
  const dti = analyzeDebt(debts, base, rates, t, strategy);
  const verdict = getDebtInsight(dti, fmt, personality);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight">Debt Freedom</h2><InfoDot T={T} text="Add each debt with its rate and payment. MiFi works out the real payoff date month by month, shows how much of each payment is pure interest, and orders them so you clear the expensive ones first." /></div><button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: T.accent, color: T.accentBtnText, ...T.glow }}><Plus className="w-4 h-4" />Add</button></div>
      <MiBanner T={T} personality={personality} text={verdict} />
      {debts.length > 0 && <DebtVitals T={T} dti={dti} fmt={fmt} />}
      {debts.length > 0 && free.never && (<div className="rounded-2xl p-4 flex gap-3" style={{ background: T.isDark ? 'rgba(251,191,36,0.08)' : 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}><AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#f59e0b' }} /><p className="text-sm" style={{ color: T.isDark ? 'rgba(253,230,138,0.9)' : '#92400e' }}>A payment doesn't cover its interest, so that debt won't clear at this rate. Bump the payment.</p></div>)}
      {debts.length > 0 && free.date && (<div className="rounded-2xl p-5" style={{ ...T.card, ...(T.isDark ? { background: 'linear-gradient(135deg, rgba(4,17,27,0.6), rgba(15,23,42,0.5))' } : {}) }}><div className="flex items-center gap-2 mb-1"><Calendar className="w-5 h-5" style={{ color: T.accent }} /><span className="text-sm uppercase tracking-wider" style={{ color: T.textMute }}>Freedom Date</span></div><p className="text-2xl font-bold tracking-tight" style={T.isDark ? { textShadow: '0 0 16px rgba(33,212,224,0.4)' } : {}}>{free.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p><p className="text-xs mt-1.5" style={{ color: T.textMute }}>{free.months} month{free.months === 1 ? '' : 's'} at this pace, clearing the {strategy === 'snowball' ? 'smallest balance' : 'highest rate'} first. Interest costs you {fmt(free.totalInterest)} along the way.</p></div>)}
      {adding && <DebtForm T={T} base={base} onSave={add} onCancel={() => setAdding(false)} />}
      <div className="space-y-3">{sorted.map((d, i) => <DebtCard key={d.id} T={T} d={d} rank={i + 1} base={base} rates={rates} onDel={del} onEdit={edit} />)}</div>
    </div>
  );
}

// richer debt analysis
function analyzeDebt(debts, base, rates, t, strategy) {
  const total = debts.reduce((s, d) => s + convert(d.principal, d.currency, base, rates), 0);
  const pay = debts.reduce((s, d) => s + convert(d.monthlyPayment, d.currency, base, rates), 0);
  const monthlyInterest = debts.reduce((s, d) => s + convert((d.principal * (d.interestRate / 100)) / 12, d.currency, base, rates), 0);
  const highest = debts.length ? Math.max(...debts.map(d => d.interestRate)) : 0;
  const income = t.income;
  const dtiMonths = income > 0 ? total / income : Infinity; // months of total income to clear
  const payRatio = income > 0 ? (pay / income) * 100 : 0; // % of income going to debt service
  const drowning = debts.some(d => d.monthlyPayment <= (d.principal * (d.interestRate / 100)) / 12);
  const interestShare = pay > 0 ? (monthlyInterest / pay) * 100 : 0; // how much of each payment is just interest
  // Real amortisation, the same one the Future tab uses, so the two screens
  // can never disagree about when you are debt free.
  const sched = projectDebts(debts, { base, rates, strategy });
  const count = debts.length;
  return { total, pay, highest, income, dtiMonths, payRatio, drowning, interestShare, monthlyInterest, payoffMonths: sched.debtFreeMonth || Infinity, totalInterest: sched.totalInterest, count };
}

function DebtVitals({ T, dti, fmt }) {
  const dtiPct = dti.income > 0 ? Math.min((dti.total / (dti.income * 12)) * 100, 999) : 0; // debt as % of annual income
  const dtiTone = dtiPct > 100 ? T.neg : dtiPct > 50 ? '#f59e0b' : T.accentText;
  const payTone = dti.payRatio > 36 ? T.neg : dti.payRatio > 20 ? '#f59e0b' : T.accentText;
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl p-3" style={T.card}><p className="text-xs mb-1" style={{ color: T.textFaint }}>Debt-to-income</p><p className="font-bold tabular-nums" style={{ color: dtiTone }}>{dti.income > 0 ? `${dtiPct.toFixed(0)}%` : '—'}</p><p className="text-[10px]" style={{ color: T.textFaint }}>of annual income</p></div>
      <div className="rounded-2xl p-3" style={T.card}><p className="text-xs mb-1" style={{ color: T.textFaint }}>Income to debt</p><p className="font-bold tabular-nums" style={{ color: payTone }}>{dti.income > 0 ? `${dti.payRatio.toFixed(0)}%` : '—'}</p><p className="text-[10px]" style={{ color: T.textFaint }}>goes to payments</p></div>
      <div className="rounded-2xl p-3" style={T.card}><p className="text-xs mb-1" style={{ color: T.textFaint }}>Interest drag</p><p className="font-bold tabular-nums" style={{ color: dti.interestShare > 50 ? T.neg : T.textSoft }}>{dti.interestShare.toFixed(0)}%</p><p className="text-[10px]" style={{ color: T.textFaint }}>of each payment</p></div>
    </div>
  );
}

function freedomDate(debts, base, rates, strategy) {
  const s = projectDebts(debts, { base, rates, strategy });
  if (!debts.length) return { date: null, never: false, months: null };
  if (!s.debtFreeMonth) return { date: null, never: true, months: null };
  const date = new Date(); date.setMonth(date.getMonth() + s.debtFreeMonth);
  return { date, never: false, months: s.debtFreeMonth, totalInterest: s.totalInterest };
}
function DebtForm({ T, base, initial, onSave, onCancel }) {
  const [f, setF] = useState({ name: initial?.name || '', principal: initial?.principal || '', interestRate: initial?.interestRate || '', monthlyPayment: initial?.monthlyPayment || '', currency: initial?.currency || base });
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const submit = () => { const p = parseFloat(f.principal), r = parseFloat(f.interestRate), m = parseFloat(f.monthlyPayment); if (!f.name.trim() || !(p > 0) || isNaN(r) || !(m > 0)) return; onSave({ name: f.name.trim(), principal: p, interestRate: r, monthlyPayment: m, currency: f.currency }); };
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ ...T.card, border: `1px solid ${T.pillBorder}` }}>
      <Input T={T} value={f.name} onChange={set('name')} placeholder="Debt name (e.g. Credit Card)" />
      <div className="flex gap-2"><Input T={T} value={f.principal} onChange={set('principal')} placeholder="Balance" type="number" className="flex-1" /><CurSelect T={T} value={f.currency} onChange={set('currency')} /></div>
      <Input T={T} value={f.interestRate} onChange={set('interestRate')} placeholder="Interest rate % per year" type="number" />
      <Input T={T} value={f.monthlyPayment} onChange={set('monthlyPayment')} placeholder="Monthly payment" type="number" />
      <div className="flex gap-2"><button onClick={submit} className="flex-1 py-2.5 rounded-xl font-semibold" style={{ background: T.accent, color: T.accentBtnText, ...T.glow }}>Save</button><button onClick={onCancel} className="px-5 py-2.5 rounded-xl font-medium" style={{ background: T.inputBg, color: T.textSoft }}>Cancel</button></div>
    </div>
  );
}
function DebtCard({ T, d, rank, base, rates, onDel, onEdit }) {
  const [editing, setEditing] = useState(false); const [paying, setPaying] = useState(false); const [pay, setPay] = useState('');
  if (editing) return <DebtForm T={T} base={base} initial={d} onSave={(x) => { onEdit(d.id, x); setEditing(false); }} onCancel={() => setEditing(false)} />;
  const prog = d.initialPrincipal ? ((d.initialPrincipal - d.principal) / d.initialPrincipal) * 100 : 0;
  const doPay = () => { const a = parseFloat(pay); if (!(a > 0)) return; onEdit(d.id, { principal: Math.max(0, d.principal - a) }); setPay(''); setPaying(false); };
  return (
    <div className="rounded-2xl p-5" style={T.card}>
      <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style={{ background: T.accent, color: T.accentBtnText, ...T.glow }}>{rank}</div><div><h3 className="font-bold" style={{ color: T.textMain }}>{d.name}</h3><p className="text-xs" style={{ color: T.textFaint }}>Payoff priority · {d.currency || base}</p></div></div><div className="flex gap-1"><button onClick={() => setEditing(true)} className="p-2" style={{ color: T.textFaint }}><Pencil className="w-4 h-4" /></button><button onClick={() => onDel(d.id)} className="p-2" style={{ color: T.textFaint }}><Trash2 className="w-4 h-4" /></button></div></div>
      <div className="grid grid-cols-3 gap-2 mb-4"><Mini T={T} label="Balance" value={money(d.principal, d.currency || base, 0)} color={T.textSoft} /><Mini T={T} label="Interest" value={`${d.interestRate}%`} color={T.neg} /><Mini T={T} label="Monthly" value={money(d.monthlyPayment, d.currency || base, 0)} color={T.accentText} /></div>
      <div className="flex justify-between text-xs mb-1.5"><span style={{ color: T.textMute }}>Progress</span><span className="font-semibold" style={{ color: T.accentText }}>{prog.toFixed(0)}%</span></div>
      <div className="h-2.5 rounded-full mb-4" style={{ background: T.barTrack }}><div className="h-2.5 rounded-full" style={{ width: `${prog}%`, background: `linear-gradient(90deg,${T.accent},${T.pos})`, boxShadow: T.isDark ? '0 0 10px rgba(33,212,224,0.5)' : 'none' }} /></div>
      {!paying ? (<button onClick={() => setPaying(true)} className="w-full py-2.5 rounded-xl font-semibold text-sm" style={{ background: T.pillBg, color: T.accentText, border: `1px solid ${T.pillBorder}` }}>Log Payment</button>) : (<div className="space-y-2"><Input T={T} value={pay} onChange={setPay} placeholder={`Amount in ${d.currency || base}`} type="number" /><div className="flex gap-2"><button onClick={doPay} className="flex-1 py-2.5 rounded-xl font-semibold" style={{ background: T.accent, color: T.accentBtnText, ...T.glow }}>Confirm</button><button onClick={() => setPaying(false)} className="px-5 py-2.5 rounded-xl" style={{ background: T.inputBg, color: T.textSoft }}>Cancel</button></div></div>)}
    </div>
  );
}
function Mini({ T, label, value, color }) { return <div className="rounded-xl p-2.5" style={{ background: T.innerBg }}><p className="text-xs mb-0.5" style={{ color: T.textFaint }}>{label}</p><p className="font-bold tabular-nums text-sm" style={{ color }}>{value}</p></div>; }

// ---------- MI CHAT ----------
function Mi({ T, uid, t, totalDebt, fmt, personality, messages, base, rates }) {
  const [input, setInput] = useState(''); const [showSet, setShowSet] = useState(false); const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const p = PERSONALITIES[personality];
  const send = async (text) => { const msg = (text ?? input).trim(); if (!msg) return; setInput(''); const reply = miReply(msg, t, totalDebt, personality, fmt); await addMessage(uid, { sender: 'user', text: msg }); await addMessage(uid, { sender: 'mi', text: reply }); };
  const starters = ['How am I doing?', 'Debt or savings?', 'Grow my passive income'];
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="rounded-2xl p-4 flex items-center justify-between mb-3" style={T.card}><div className="flex items-center gap-3"><MiFiAvatar size={44} /><div><div className="flex items-center gap-1.5"><h2 className="text-lg font-bold">MiFi</h2><InfoDot T={T} text="MiFi reads your real numbers, income, spending, and debt, and gives a plain-language take. Change its personality with the gear icon." /></div><p className="text-xs" style={{ color: T.textMute }}>{p.name}</p></div></div><button onClick={() => setShowSet(!showSet)} className="p-2" style={{ color: T.textMute }}>{showSet ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}</button></div>
      {showSet && (<div className="rounded-2xl p-4 mb-3 grid grid-cols-2 gap-2" style={T.card}>{Object.entries(PERSONALITIES).map(([k, v]) => (<button key={k} onClick={() => { updateProfile(uid, { personality: k }); setShowSet(false); }} className="p-3 rounded-xl text-left" style={personality === k ? { background: T.pillBg, border: `1px solid ${T.pillBorder}` } : { background: T.innerBg, border: `1px solid ${T.border}` }}><div className="text-xl mb-1">{v.emoji}</div><div className="text-sm font-medium" style={{ color: T.textSoft }}>{v.name}</div></button>))}</div>)}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 ? (<div className="text-center py-8"><div className="flex justify-center mb-3"><MiFiAvatar size={64} /></div><p className="font-bold mb-1" style={{ color: T.textMain }}>Hey, I'm MiFi 👋</p><p className="text-sm mb-5 px-6" style={{ color: T.textMute }}>Here to help you figure out how this money thing works.</p><div className="space-y-2">{starters.map(s => <button key={s} onClick={() => send(s)} className="block w-full rounded-xl p-3 text-sm text-left" style={{ ...T.card, color: T.textSoft }}>{s}</button>)}</div></div>) : messages.map(m => m.sender === 'user' ? (<div key={m.id} className="flex justify-end"><div className="max-w-[82%] p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap" style={{ background: `linear-gradient(135deg,${T.accentBright},${T.accent})`, color: T.isDark ? '#020617' : '#ffffff', borderBottomRightRadius: 4 }}>{m.text}</div></div>) : (<div key={m.id} className="flex justify-start items-end gap-2"><MiFiAvatar size={28} /><div className="max-w-[82%] p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap" style={{ ...T.card, borderBottomLeftRadius: 4, color: T.textSoft }}>{m.text}</div></div>))}
        <div ref={endRef} />
      </div>
      <div className="rounded-2xl p-2 flex gap-2" style={T.card}><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask MiFi…" className="flex-1 bg-transparent px-3 outline-none" style={{ color: T.textMain }} /><button onClick={() => send()} className="p-2.5 rounded-xl" style={{ background: T.accent, color: T.accentBtnText, ...T.glow }}><Send className="w-5 h-5" /></button></div>
    </div>
  );
}

// ---------- SETTINGS ----------
function SettingsView({ T, uid, email, resetPassword, reauth, reauthGoogle, deleteAccount, provider, name, avatar, bio, goal, base, themeName, personality, strategy, solvencyCap, defaultView, cashBalance, inflation, logout, onClose }) {
  const [nameDraft, setNameDraft] = useState(name || '');
  const [savedName, setSavedName] = useState(false);
  const [avOpen, setAvOpen] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio || '');
  const [goalDraft, setGoalDraft] = useState(goal || '');
  const [savedAbout, setSavedAbout] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [cashDraft, setCashDraft] = useState(cashBalance ? String(cashBalance) : '');
  const [savedCash, setSavedCash] = useState(false);
  const [inflDraft, setInflDraft] = useState(inflation ? String(inflation) : '');
  const [savedInfl, setSavedInfl] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState('');
  const [delConfirm, setDelConfirm] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState('');
  useEffect(() => { setNameDraft(name || ''); }, [name]);
  useEffect(() => { setBioDraft(bio || ''); setGoalDraft(goal || ''); }, [bio, goal]);
  useEffect(() => { setCashDraft(cashBalance ? String(cashBalance) : ''); }, [cashBalance]);
  useEffect(() => { setInflDraft(inflation ? String(inflation) : ''); }, [inflation]);
  const saveCash = () => { const v = parseFloat(cashDraft); updateProfile(uid, { cashBalance: Number.isFinite(v) && v >= 0 ? v : 0 }); setSavedCash(true); setTimeout(() => setSavedCash(false), 1500); };
  const saveInfl = () => { const v = parseFloat(inflDraft); updateProfile(uid, { inflation: Number.isFinite(v) && v >= 0 ? Math.min(v, 100) : 0 }); setSavedInfl(true); setTimeout(() => setSavedInfl(false), 1500); };
  const saveName = () => { updateProfile(uid, { name: nameDraft.trim() }); setSavedName(true); setTimeout(() => setSavedName(false), 1500); };
  const saveAbout = () => { updateProfile(uid, { bio: bioDraft.trim(), goal: goalDraft.trim() }); setSavedAbout(true); setTimeout(() => setSavedAbout(false), 1500); };
  const pickAvatar = (i) => updateProfile(uid, { avatar: i });
  const wipe = async () => { await clearMessages(uid); setCleared(true); setTimeout(() => setCleared(false), 1500); };
  const sendReset = async () => { try { await resetPassword(email); setResetSent(true); setTimeout(() => setResetSent(false), 2500); } catch {} };
  const doDelete = async () => { setDelErr(''); setDelBusy(true); try { if (provider === 'password') await reauth(delPw); else await reauthGoogle(); await deleteAllUserData(uid); await deleteAccount(); } catch (e) { setDelBusy(false); const code = e && e.code; setDelErr(code === 'auth/wrong-password' || code === 'auth/invalid-credential' ? 'Wrong password.' : 'Could not delete. You may need to sign out and back in first.'); } };
  const views = [['dashboard', 'Home'], ['transactions', 'Money'], ['budget', 'Budget'], ['debts', 'Debts'], ['future', 'Future'], ['mi', 'Mi']];
  const pill = (on) => on ? { background: T.pillBg, border: `1px solid ${T.pillBorder}`, color: T.accentText } : { background: T.innerBg, border: `1px solid ${T.border}`, color: T.textSoft };
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2"><button onClick={onClose} className="p-2 -ml-2 rounded-lg" style={{ color: T.textMute }}><ArrowLeft className="w-6 h-6" /></button><h2 className="text-2xl font-bold tracking-tight">Settings</h2></div>

      <Section T={T} icon={<User className="w-4 h-4" />} title="Profile">
        <div className="flex items-center gap-3 mb-4"><Avatar i={avatar} size={56} /><div><p className="font-semibold" style={{ color: T.textMain }}>{nameDraft || 'You'}</p><p className="text-xs" style={{ color: T.textFaint }}>{email}</p></div></div>
        <label className="text-xs font-medium block mb-1" style={{ color: T.textMute }}>Display name</label>
        <div className="flex gap-2"><Input T={T} value={nameDraft} onChange={setNameDraft} placeholder="Your name" /><button onClick={saveName} className="px-4 rounded-xl font-semibold shrink-0" style={{ background: T.accent, color: T.accentBtnText }}>{savedName ? <Check className="w-4 h-4" /> : 'Save'}</button></div>
        <label className="text-xs font-medium block mb-2 mt-4" style={{ color: T.textMute }}>Avatar</label>
        <PickVisual T={T} open={avOpen} onToggle={() => setAvOpen(o => !o)}
          current={<><Avatar i={avatar} size={34} /><span className="text-sm font-medium" style={{ color: T.textMain }}>Avatar {avatar + 1}</span></>}>
          <div className="grid grid-cols-4 gap-2">{AVATARS.map((_, i) => (<button key={i} onClick={() => { pickAvatar(i); setAvOpen(false); }} className="rounded-2xl p-1.5 flex items-center justify-center" style={{ background: avatar === i ? T.pillBg : T.innerBg, border: `1px solid ${avatar === i ? T.pillBorder : T.border}` }}><Avatar i={i} size={46} /></button>))}</div>
        </PickVisual>
        <label className="text-xs font-medium block mb-1 mt-4" style={{ color: T.textMute }}>Bio</label>
        <textarea value={bioDraft} onChange={e => setBioDraft(e.target.value)} rows={2} placeholder="A line about you" className="w-full px-3.5 py-2.5 rounded-xl outline-none resize-none text-sm" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textMain }} />
        <label className="text-xs font-medium block mb-1 mt-3" style={{ color: T.textMute }}>Financial goal</label>
        <div className="flex gap-2"><Input T={T} value={goalDraft} onChange={setGoalDraft} placeholder="e.g. debt-free by December" /><button onClick={saveAbout} className="px-4 rounded-xl font-semibold shrink-0" style={{ background: T.accent, color: T.accentBtnText }}>{savedAbout ? <Check className="w-4 h-4" /> : 'Save'}</button></div>
      </Section>

      <Section T={T} icon={<Wallet className="w-4 h-4" />} title="Base currency">
        <PickSelect T={T} value={base} onChange={(v) => updateProfile(uid, { baseCurrency: v })}
          options={CURRENCIES.map(c => ({ value: c.code, label: `${symbolOf(c.code)}  ${c.code} - ${c.name}` }))}
          hint="Everything is totalled and displayed in this currency. Each entry still keeps its own." />
      </Section>

      <Section T={T} icon={<Route className="w-4 h-4" />} title="Forecast">
        <label className="text-xs font-medium block mb-1" style={{ color: T.textMute }}>What is in your accounts right now</label>
        <p className="text-xs mb-2" style={{ color: T.textFaint }}>MiFi tracks money moving in and out, not what you already hold. Give it a starting balance and it can tell you your runway, how long you would last if income stopped.</p>
        <div className="flex gap-2"><Input T={T} value={cashDraft} onChange={setCashDraft} placeholder={`Balance in ${base}`} type="number" /><button onClick={saveCash} className="px-4 rounded-xl font-semibold shrink-0" style={{ background: T.accent, color: T.accentBtnText }}>{savedCash ? <Check className="w-4 h-4" /> : 'Save'}</button></div>
        <p className="text-xs mt-1.5" style={{ color: T.textFaint }}>Typed in by you, and only used for the forecast. Update it whenever you like.</p>
        <label className="text-xs font-medium block mb-1 mt-4" style={{ color: T.textMute }}>Expected yearly price rises</label>
        <p className="text-xs mb-2" style={{ color: T.textFaint }}>Left at 0, the forecast assumes today's prices hold forever, which flatters anything past about a year. Set what you expect and MiFi grows your spending by it.</p>
        <div className="flex gap-2"><Input T={T} value={inflDraft} onChange={setInflDraft} placeholder="e.g. 20 for 20% a year" type="number" /><button onClick={saveInfl} className="px-4 rounded-xl font-semibold shrink-0" style={{ background: T.accent, color: T.accentBtnText }}>{savedInfl ? <Check className="w-4 h-4" /> : 'Save'}</button></div>
      </Section>

      <Section T={T} icon={<Lightbulb className="w-4 h-4" />} title="How MiFi works">
        {[['Solvency score', 'How close your income is to covering your monthly obligations. 100% means fully covered. The long-term goal is passive income doing that job, not your salary.'], ['Transactions', 'Log income and expenses. MiFi uses them for your net, cash-flow chart, and advice. Tap Select to delete or recategorize several at once.'], ['Debts', 'Add each debt with its rate and payment. MiFi shows your payoff date, how much of each payment is interest, and which to clear first. It warns if a balance is quietly growing.'], ['Budget folders', 'Group planned spending into folders (a month, a trip, a purchase). Each folder tells you if it fits your spare money and what to commit or hold.'], ['Future', 'Projects where your current habits lead: when your debt clears, when passive income covers everything, and how long you would last if income stopped. It needs three finished months before it will draw anything, because less than that is guesswork. The what-if sliders let you test a change before you make it.'], ['MiFi advisor', 'Reads your real numbers and gives a plain-language take. Eight personalities, switched with the gear icon in the MiFi tab.'], ['Currencies', 'Set your base currency in this screen and everything converts to it. 37 supported.'], ['Your data', 'Everything is private to your account. Reset your password or delete your account and all its data below.']].map(([q, a]) => (<details key={q} className="rounded-xl mb-2" style={{ background: T.innerBg, border: `1px solid ${T.border}` }}><summary className="px-3 py-2.5 text-sm font-semibold" style={{ color: T.textSoft, cursor: 'pointer' }}>{q}</summary><p className="px-3 pb-3 text-xs leading-relaxed" style={{ color: T.textMute }}>{a}</p></details>))}
      </Section>

      <Section T={T} icon={T.isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => updateProfile(uid, { themeName: 'dark' })} className="p-4 rounded-xl flex flex-col items-center gap-2" style={pill(themeName === 'dark')}><div className="w-full h-10 rounded-lg" style={{ background: 'linear-gradient(135deg,#04111b,#0a2230)', border: '1px solid rgba(33,212,224,0.35)' }} /><span className="text-sm font-medium flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" />Dark</span></button>
          <button onClick={() => updateProfile(uid, { themeName: 'light' })} className="p-4 rounded-xl flex flex-col items-center gap-2" style={pill(themeName === 'light')}><div className="w-full h-10 rounded-lg" style={{ background: 'linear-gradient(135deg,#f3f7f6,#ffffff)', border: '1px solid rgba(4,17,27,0.25)' }} /><span className="text-sm font-medium flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" />Light</span></button>
        </div>
      </Section>

      <Section T={T} icon={<CreditCard className="w-4 h-4" />} title="Debt payoff strategy">
        <p className="text-xs mb-3" style={{ color: T.textFaint }}>Sets the order MiFi attacks your debts.</p>
        <div className="grid grid-cols-2 gap-2">{[['avalanche', 'Avalanche', 'Highest interest first'], ['snowball', 'Snowball', 'Smallest balance first']].map(([id, label, sub]) => (<button key={id} onClick={() => updateProfile(uid, { debtStrategy: id })} className="p-3 rounded-xl text-left" style={pill(strategy === id)}><div className="text-sm font-semibold" style={{ color: T.textMain }}>{label}</div><div className="text-xs mt-0.5" style={{ color: T.textFaint }}>{sub}</div></button>))}</div>
      </Section>

      <Section T={T} icon={<Sparkles className="w-4 h-4" />} title="Solvency score">
        <p className="text-xs mb-3" style={{ color: T.textFaint }}>When income more than covers obligations, cap the score or show the true coverage ratio.</p>
        <div className="grid grid-cols-2 gap-2">{[[true, 'Cap at 100%', 'Cleaner target'], [false, 'True coverage', 'e.g. 240%']].map(([val, label, sub]) => (<button key={String(val)} onClick={() => updateProfile(uid, { solvencyCap: val })} className="p-3 rounded-xl text-left" style={pill((solvencyCap !== false) === val)}><div className="text-sm font-semibold" style={{ color: T.textMain }}>{label}</div><div className="text-xs mt-0.5" style={{ color: T.textFaint }}>{sub}</div></button>))}</div>
      </Section>

      <Section T={T} icon={<Home className="w-4 h-4" />} title="Starting tab">
        <PickSelect T={T} value={defaultView} onChange={(v) => updateProfile(uid, { defaultView: v })}
          options={views.map(([id, label]) => ({ value: id, label }))}
          hint="The tab MiFi opens on." />
      </Section>

      <Section T={T} icon={<Sparkles className="w-4 h-4" />} title="Mi's personality">
        <PickSelect T={T} value={personality} onChange={(v) => updateProfile(uid, { personality: v })}
          options={Object.entries(PERSONALITIES).map(([k, v]) => ({ value: k, label: `${v.emoji}  ${v.name}` }))}
          hint="Changes how MiFi talks to you. The numbers behind the advice stay the same." />
      </Section>

      <Section T={T} icon={<MessageCircle className="w-4 h-4" />} title="Mi chat">
        <button onClick={wipe} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium" style={{ background: hexA(T.neg, 0.12), color: T.neg }}>{cleared ? <><Check className="w-4 h-4" />Cleared</> : <><Trash2 className="w-4 h-4" />Clear chat history</>}</button>
      </Section>

      <Section T={T} icon={<MessageCircle className="w-4 h-4" />} title="Feedback">
        <button onClick={() => { window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('MiFi feedback')}&body=${encodeURIComponent('What I liked:\n\nWhat confused me:\n\nOne thing I would change:\n')}`; }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium" style={{ background: T.innerBg, color: T.textSoft, border: `1px solid ${T.border}` }}><MessageCircle className="w-4 h-4" />Send feedback</button>
        <p className="text-xs mt-2" style={{ color: T.textFaint }}>Opens your email app. Tell us what worked and what did not.</p>
      </Section>

      <Section T={T} icon={<User className="w-4 h-4" />} title="Account">
        <button onClick={sendReset} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium" style={{ background: T.innerBg, color: T.textSoft, border: `1px solid ${T.border}` }}>{resetSent ? <><Check className="w-4 h-4" />Reset link sent</> : 'Send password reset email'}</button>
        <p className="text-xs mt-2" style={{ color: T.textFaint }}>We will email {email} a link to set a new password.</p>
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
          {!delOpen ? (<button onClick={() => setDelOpen(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium" style={{ background: hexA(T.neg, 0.12), color: T.neg }}><Trash2 className="w-4 h-4" />Delete account</button>) : (<div className="rounded-xl p-3 space-y-2.5" style={{ border: `1px solid ${hexA(T.neg, 0.4)}`, background: hexA(T.neg, 0.06) }}><p className="text-sm font-semibold" style={{ color: T.neg }}>This permanently deletes your account and all your data. It cannot be undone.</p>{provider === 'password' ? (<input type="password" value={delPw} onChange={e => setDelPw(e.target.value)} placeholder="Enter your password to confirm" className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textMain }} />) : (<input value={delConfirm} onChange={e => setDelConfirm(e.target.value)} placeholder="Type DELETE to confirm" className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textMain }} />)}{delErr && <p className="text-xs" style={{ color: T.neg }}>{delErr}</p>}<div className="flex gap-2"><button onClick={() => { setDelOpen(false); setDelPw(''); setDelConfirm(''); setDelErr(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: T.innerBg, color: T.textMute }}>Cancel</button><button disabled={delBusy || (provider === 'password' ? !delPw : delConfirm !== 'DELETE')} onClick={doDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40" style={{ background: T.neg, color: '#ffffff' }}>{delBusy ? 'Deleting' : 'Permanently delete'}</button></div></div>)}
        </div>
      </Section>

      <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium" style={{ background: hexA(T.neg, 0.12), color: T.neg }}><LogOut className="w-5 h-5" />Log out</button>
      <p className="text-center text-xs pt-1" style={{ color: T.textFaint }}>MiFi</p>
    </div>
  );
}
function Section({ T, icon, title, children }) { return (<div className="rounded-2xl p-5" style={T.card}><div className="flex items-center gap-2 mb-4" style={{ color: T.accent }}>{icon}<h3 className="font-semibold" style={{ color: T.textMain }}>{title}</h3></div>{children}</div>); }

// ---------- MI LOGIC ----------
function getMiInsight(t, totalPay, debts, personality, fmt) {
  if (personality === 'brother') return brotherInsight(t, totalPay, debts, fmt);
  if (t.expense > t.income) return { genZ: 'Bestie… spending more than you\'re making rn 😬 broke-era vibes, let\'s fix it ASAP.', coolUncle: 'Hey kiddo, you\'re spending more than you earn this month. Let\'s rein it in.', harsh: 'You\'re BLEEDING money. Expenses over income. FIX IT. NOW. 🔥', professional: 'Expenditure exceeds income. Immediate budget review advised.', africanParent: 'Ah-ah! You\'re spending more than you earn! 🩴 Do you think money grows on trees? Sit down and budget — today!', naijaHustler: 'Chai! Your spending don pass your income o. This one no go work — cut am sharp before e turn wahala.', zen: 'Your outflow exceeds your inflow. No judgment — only awareness. Pause, breathe, and redirect the current.' }[personality];
  const sol = (t.expense + totalPay) > 0 ? t.passive / (t.expense + totalPay) * 100 : 0;
  return { genZ: `Solid month! 💸 Passive covers ~${sol.toFixed(0)}% of your obligations. Keep stacking that freedom fr.`, coolUncle: 'Good moves this month, kiddo. Keep building that passive income and you\'ll be free before you know it. 🌟', harsh: `Passive only covers ${sol.toFixed(0)}%. Not good enough. MULTIPLY it. 💪`, professional: `Metrics stable. Solvency at ${sol.toFixed(0)}%. Continue directing surplus toward passive income.`, africanParent: 'You did okay this month — but don\'t let it enter your head. Your mates are saving and investing. Are you? Save more, my child.', naijaHustler: 'You dey try small! But no relax o, this money fit finish. Stack am, build passive income, secure your future.', zen: 'Your river flows gently — more in than out. Stay mindful; let the surplus settle into seeds, not noise.' }[personality];
}

function getDebtInsight(dti, fmt, personality) {
  if (personality === 'brother') return brotherDebt(dti, fmt);
  if (dti.count === 0) return { genZ: 'No debt?! Goated 🔥 you\'re already winning. Keep it that way and put that freed-up cash to work.', coolUncle: 'Debt-free, kiddo? Proud of you. 🙌 Now don\'t go borrowing for nonsense — keep building.', harsh: 'No debt. Good. Now don\'t you DARE borrow for liabilities. Keep it clean. 💪', professional: 'No outstanding debt — an excellent position. Maintain it and deploy freed cash flow toward assets.', africanParent: 'No loan? Finally, sense! 🩴 Don\'t go and spoil it by borrowing for rubbish, you hear me?', naijaHustler: 'No debt?! Baddo! 💸 Keep am clean, put your money for where e go grow.', zen: 'You carry no debt — you are light. Protect this peace; let your wealth grow undisturbed.' }[personality];

  // pick the single most severe issue, in priority order
  if (dti.drowning) return { genZ: 'Bestie this is bad 😬 a payment doesn\'t even cover the interest — that debt is GROWING. Up the payment ASAP or it\'ll swallow you.', coolUncle: 'Real talk, champ — one of these payments isn\'t even touching the interest. That balance is climbing. Fix this now.', harsh: 'You\'re DROWNING. A payment doesn\'t even cover the interest?! That debt grows while you sleep. RAISE IT. TODAY. 🔥', professional: 'Critical: a payment is below its monthly interest accrual, so the balance compounds upward. Increase it immediately.', africanParent: 'Ehn?! You\'re paying and the debt is still growing?! 🩴 Is this a joke? Do you want to die in debt? Increase that payment now-now!', naijaHustler: 'Omo this one red o — your payment no even reach the interest, the debt dey grow! Pump am up sharp before e scatter your life.', zen: 'Notice carefully: a payment cannot hold back its own interest, so the weight grows. Act with urgency — raise it.' }[personality];

  const dtiPctAnnual = dti.income > 0 ? (dti.total / (dti.income * 12)) * 100 : 0;
  if (dti.income > 0 && dtiPctAnnual > 100) return { genZ: `Heads up — you owe ${fmt(dti.total)}, more than a whole year of your income 😳 this is a real hole. Funnel everything spare into the highest-rate one.`, coolUncle: `Champ, your debt is bigger than a full year's income (${fmt(dti.total)}). That's heavy. Let's get serious — throw every spare naira at it.`, harsh: `${fmt(dti.total)} — MORE than a year of income?! This is a crisis. No more borrowing, no luxuries. Attack it. NOW. 💪🔥`, professional: `Total debt (${fmt(dti.total)}) exceeds annual income — a leverage ratio above 100%. Aggressive deleveraging is the priority before any investing.`, africanParent: `You owe more than you earn in a WHOLE YEAR?! 🩴 ${fmt(dti.total)}! This is what borrowing for the wrong things does. No more nonsense — pay it down!`, naijaHustler: `Omo you owe ${fmt(dti.total)} — pass your whole year salary o! This na deep hole. Channel all your spare money to clear am, no dey borrow again.`, zen: `Your debt (${fmt(dti.total)}) outweighs a year of income — a heavy load. Carry it down with discipline before reaching for growth.` }[personality];

  if (dti.income > 0 && dti.payRatio > 36) return { genZ: `Yo, ${dti.payRatio.toFixed(0)}% of your income is going to debt payments 😬 that's choking your cash flow. Anything spare should attack the ${dti.highest}% one.`, coolUncle: `Kiddo, over a third of your income (${dti.payRatio.toFixed(0)}%) is going to debt. That's tight. Free yourself faster by overpaying the ${dti.highest}% debt.`, harsh: `${dti.payRatio.toFixed(0)}% of income to debt?! You\'re working for lenders, not yourself. Kill the ${dti.highest}% debt first. Move. 💪🔥`, professional: `Debt service consumes ${dti.payRatio.toFixed(0)}% of income, above the prudent ~36% threshold. Prioritize the ${dti.highest}% balance to relieve cash flow.`, africanParent: `${dti.payRatio.toFixed(0)}% of your money is going to pay debt?! 🩴 You\'re suffering to feed the bank. Borrowing for the wrong reasons, my child. Clear that ${dti.highest}% one first!`, naijaHustler: `${dti.payRatio.toFixed(0)}% of your income dey enter debt o — e dey choke you. Face that ${dti.highest}% debt, e be the one wey dey bleed you pass.`, zen: `${dti.payRatio.toFixed(0)}% of your income flows to lenders — a strong current pulling against you. Redirect it: clear the ${dti.highest}% debt first.` }[personality];

  if (dti.highest >= 20) return { genZ: `That ${dti.highest}% interest is robbing you fr 🎯 ${dti.interestShare.toFixed(0)}% of your payments is just interest. Hit the highest-rate debt first.`, coolUncle: `That ${dti.highest}% rate is no joke, kiddo — ${dti.interestShare.toFixed(0)}% of what you pay is pure interest. Hit that one hardest.`, harsh: `${dti.highest}% interest?! ${dti.interestShare.toFixed(0)}% of your payments vanish as interest. That\'s THEFT. Kill it FIRST. 💪🔥`, professional: `Your highest rate is ${dti.highest}%; ${dti.interestShare.toFixed(0)}% of payments service interest. Prioritize that balance via avalanche.`, africanParent: `${dti.highest}% interest! 🩴 ${dti.interestShare.toFixed(0)}% of your hard-earned money is just feeding the bank. Pay that one first, you hear?`, naijaHustler: `${dti.highest}% interest dey collect ${dti.interestShare.toFixed(0)}% of your payment for nothing o. Face that high-rate debt sharp sharp.`, zen: `One debt charges ${dti.highest}%; ${dti.interestShare.toFixed(0)}% of each payment dissolves into interest. Remove that weight first.` }[personality];

  return { genZ: `You\'ve got ${fmt(dti.total)} in debt — manageable. Throw extra at the highest rate and you\'ll be free in roughly ${dti.payoffMonths === Infinity ? 'a while' : dti.payoffMonths + ' months'}. 💪`, coolUncle: `${fmt(dti.total)} on the books, champ — handleable. Stay consistent and add a little extra; you\'re looking at about ${dti.payoffMonths === Infinity ? 'a while' : dti.payoffMonths + ' months'}.`, harsh: `${fmt(dti.total)} in debt. Not a crisis, but not free. Pay MORE than minimums — speed up that ${dti.payoffMonths === Infinity ? 'timeline' : dti.payoffMonths + '-month'} payoff. 💪`, professional: `Total debt ${fmt(dti.total)}; estimated ${dti.payoffMonths === Infinity ? 'indefinite' : dti.payoffMonths + '-month'} payoff at current pace. Sustainable, but additional principal shortens it materially.`, africanParent: `${fmt(dti.total)} you\'re owing — about ${dti.payoffMonths === Infinity ? 'who knows how long' : dti.payoffMonths + ' months'} to clear. 🩴 In my time we didn\'t borrow anyhow. Pay it quickly and live within your means.`, naijaHustler: `${fmt(dti.total)} debt, around ${dti.payoffMonths === Infinity ? 'long time' : dti.payoffMonths + ' months'} to clear. E no too bad — add small extra every month, you go finish am faster.`, zen: `You carry ${fmt(dti.total)} — about ${dti.payoffMonths === Infinity ? 'an open horizon' : dti.payoffMonths + ' months'} to lightness. Set it down a little more each month.` }[personality];
}

function miReply(q, t, totalDebt, personality, fmt) {
  if (personality === 'brother') return brotherReply(q, t, totalDebt, fmt);
  const ql = q.toLowerCase(); const net = t.net;
  if (ql.includes('how') && (ql.includes('doing') || ql.includes('am i'))) {
    const sol = t.expense > 0 ? t.passive / t.expense * 100 : 0;
    if (net >= 0) return { genZ: `Pretty good rn! 💸 You're up ${fmt(net)} this month. But passive only covers ~${sol.toFixed(0)}% of your spending, so you're still leaning on that salary. Build those side hustles fr 📈`, coolUncle: `Not bad, kiddo! ${fmt(net)} surplus. You're still trading time for most of it though — let's grow that passive income. 🎉`, harsh: `${fmt(net)} positive. Don't celebrate — passive covers ${sol.toFixed(0)}%. Should be 100%+. MULTIPLY it. 💪🔥`, professional: `Surplus of ${fmt(net)} this month. Solvency ~${sol.toFixed(0)}%, indicating active-income dependence. Direct surplus toward passive streams.`, africanParent: `Hmm, you have ${fmt(net)} surplus — good. But passive income covers only ${sol.toFixed(0)}% of your spending. Your mates are buying land while you feel among. Save more!`, naijaHustler: `You dey hold ${fmt(net)} extra — nice one! But na salary still dey carry you (${sol.toFixed(0)}% passive). Build side hustle make money enter while you sleep.`, zen: `You hold a surplus of ${fmt(net)}. Good. Yet you lean on one current — passive covers only ${sol.toFixed(0)}%. Cultivate other streams, slowly.` }[personality];
    return { genZ: `Oof, down ${fmt(Math.abs(net))} this month 😬 broke-era energy. Trim expenses or stack income, ASAP. You got this 💪`, coolUncle: `Red by ${fmt(Math.abs(net))}, champ. Not sustainable but fixable — tighten up and maybe a side gig.`, harsh: `BLEEDING ${fmt(Math.abs(net))}! Cut the excuses and the expenses. DO BETTER. 😤`, professional: `Deficit of ${fmt(Math.abs(net))}. Audit expenses, diversify income, build a buffer.`, africanParent: `You're spending more than you earn?! 🩴 Is this what we sent you to school for? Sit down. Cut this nonsense. Now.`, naijaHustler: `Omo you dey run red by ${fmt(Math.abs(net))}. No be small thing o. Tighten up, find extra hustle, balance your table.`, zen: `You spend beyond what you earn — a deficit of ${fmt(Math.abs(net))}. Breathe. This is information, not failure. Trim with intention.` }[personality];
  }
  if (ql.includes('debt') || ql.includes('saving')) {
    if (totalDebt > 0) return { genZ: `You've got ${fmt(totalDebt)} in debt — kill that first, bestie 🎯 highest interest first, then we stack savings. Trust the process 💯`, coolUncle: `That ${fmt(totalDebt)} works against you daily, kiddo. Avalanche method — highest interest first. Then build wealth. 🙌`, harsh: `${fmt(totalDebt)} in DEBT. Forget savings — ATTACK it. Highest interest first. Execute. 💪🔥`, professional: `Carrying ${fmt(totalDebt)}. Prioritize elimination via avalanche (highest APR first), minimums elsewhere.`, africanParent: `You're owing ${fmt(totalDebt)}? 🩴 A person with debt does not sleep well. Pay it first — that is how we did it — then you save.`, naijaHustler: `That ${fmt(totalDebt)} debt dey collect interest like say na your papa get am. Kill am first, then save small small.`, zen: `Release the ${fmt(totalDebt)} debt first — it drains energy each month. Then, calmly, let savings gather like still water.` }[personality];
    return { genZ: `Debt-free?! Goated 🔥 build a 3–6 month emergency fund, then invest in stuff that pays you while you sleep 💰`, coolUncle: `No debt — love it! 🎉 Safety net of 3–6 months, then invest steadily. Consistency wins.`, harsh: `No debt? Good. Build a 6-month buffer then invest AGGRESSIVELY. Idle cash loses. 📈`, professional: `Debt-free confirmed. Establish a 3–6 month reserve, then diversified index investing.`, africanParent: `No debt? Finally you're using your head! 🩴 Now build small savings for emergency, then don't go and borrow rubbish again.`, naijaHustler: `No debt?! Baddo! 💸 Build emergency money first, then put the rest where e go grow. Hustle smart.`, zen: `No debt — you are unburdened. Build a quiet reserve, then let your wealth grow patiently, like a tree.` }[personality];
  }
  if (ql.includes('passive') || ql.includes('income') || ql.includes('hustle')) {
    return { genZ: `Passive income 🚀 start with skills (freelance → systematize), digital products, content that pays forever, dividends. Money while you're at brunch 💸`, coolUncle: `Passive buys back your time, kiddo. Turn a skill into a product, add dividend payers, scale slowly. 🏗️`, harsh: `Stop trading hours for dollars 💪 monetize skills, invest for dividends, BUILD assets. No excuses. MOVE. 🔥`, professional: `Ranked: dividend-growth investing, digital products, REITs, automated businesses. Allocate 20–30% of surplus; compounding compounds.`, africanParent: `Passive income? Yes! Money that works while you sleep — that is wisdom. Plant something today so tomorrow you eat, my child.`, naijaHustler: `Passive income na the real gist 🚀 sell digital products, collect dividend, content wey go dey pay. Make money work for you.`, zen: `Passive income is water that flows without effort. Plant a source today; tend it; one day it nourishes you while you rest.` }[personality];
  }
  return { genZ: `Didn't catch that bestie! Ask about your finances, debt, or passive income 💰✨`, coolUncle: `Not sure what you mean, champ — ask about money, debt, or building wealth. 🤙`, harsh: `Be specific! Finances, debt, income strategy. GET TO THE POINT. 💪`, professional: `Please specify: financial status, debt strategy, or passive-income development.`, africanParent: `Speak clearly, my child. Ask me about your money, your debt, or your spending. I am watching. 🩴`, naijaHustler: `Talk wetin dey your mind, my guy — money, debt, or how to stack passive income. Make we run am.`, zen: `Be still, and ask clearly — about your finances, your debt, or income that flows on its own.` }[personality];
}

function Input({ T, value, onChange, placeholder, type = 'text', className = '' }) { return <input type={type} step="0.01" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`px-4 py-3 rounded-xl outline-none w-full ${className}`} style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textMain }} />; }
function CurSelect({ T, value, onChange }) { return (<select value={value} onChange={e => onChange(e.target.value)} className="px-3 py-3 rounded-xl outline-none font-medium" style={{ background: T.selectBg, border: `1px solid ${T.inputBorder}`, color: T.textMain }}>{CURRENCIES.map(c => <option key={c.code} value={c.code} style={{ background: T.selectBg, color: T.textMain }}>{c.code}</option>)}</select>); }
function Seg({ T, active, pos, muted, onClick, children }) { const col = pos ? T.accent : muted ? T.textMute : T.neg; return <button onClick={onClick} className="py-2.5 rounded-xl text-sm font-semibold transition-all" style={active ? { background: pos ? T.pillBg : muted ? (T.isDark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.1)') : hexA(T.neg, 0.13), color: col, border: `1px solid ${col}66` } : { background: T.innerBg, color: T.textFaint, border: `1px solid ${T.border}` }}>{children}</button>; }


// ---------- legacy-data + helpers (added for live wiring) ----------
function legacyCat(t) {
  if (t.cat) return t.cat;
  const str = (t.category || '').toLowerCase();
  const map = { salary: 'salary', freelance: 'freelance', business: 'business', invest: 'invest', investment: 'invest', dividend: 'invest', royalty: 'royalty', royalties: 'royalty', refund: 'refund', grocer: 'groceries', groceries: 'groceries', food: 'dining', dining: 'dining', restaurant: 'dining', transport: 'transport', uber: 'transport', bolt: 'transport', fuel: 'transport', rent: 'rent', housing: 'rent', bill: 'bills', electric: 'bills', data: 'data', airtime: 'data', internet: 'data', subscription: 'subs', subs: 'subs', netflix: 'subs', spotify: 'subs', shopping: 'shopping', clothes: 'shopping', health: 'health', pharmacy: 'health', medical: 'health', entertainment: 'fun', movie: 'fun', cinema: 'fun', family: 'family', education: 'education', school: 'education', tuition: 'education' };
  for (const k in map) if (str.includes(k)) return map[k];
  if (str.includes('gift')) return t.type === 'income' ? 'giftIn' : 'family';
  return t.type === 'income' ? 'otherIn' : 'misc';
}
function normTxn(t) { return { ...t, cat: t.cat || legacyCat(t), note: t.note || (t.cat ? '' : (t.category || '')) }; }
function orderDebts(debts, strategy, base, rates) {
  const arr = [...debts];
  if (strategy === 'snowball') arr.sort((a, b) => convert(a.principal, a.currency || base, base, rates) - convert(b.principal, b.currency || base, base, rates));
  else arr.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
  return arr;
}
function parsePlan(text, base) {
  const raw = (text || '').trim();
  let currency = base;
  const codeMatch = raw.match(/\b(NGN|USD|EUR|GBP|GHS|KES|ZAR|CAD)\b/i);
  if (codeMatch) currency = codeMatch[1].toUpperCase();
  const numMatch = raw.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*([km])?/i);
  let amount = 0;
  if (numMatch) { amount = parseFloat(numMatch[1]); const suf = (numMatch[2] || '').toLowerCase(); if (suf === 'k') amount *= 1000; if (suf === 'm') amount *= 1000000; }
  let description = raw.replace(/\b(NGN|USD|EUR|GBP|GHS|KES|ZAR|CAD)\b/ig, '').replace(/[\d.,]+\s*[km]?/i, '').replace(/\b(on|for|a|an|the|to|buy|get|spend|plan)\b/ig, ' ').replace(/\s+/g, ' ').trim();
  if (!description) description = 'Planned expense';
  description = description.charAt(0).toUpperCase() + description.slice(1);
  const cat = legacyCat({ category: description, type: 'expense' });
  return { description, amount, currency, cat };
}

// ---------- BUDGET ----------
function Budget({ T, uid, folders, txns, debts, base, rates, personality }) {
  const [openId, setOpenId] = useState(null);
  const [newFolder, setNewFolder] = useState('');
  const [newKind, setNewKind] = useState('name');
  const [itemText, setItemText] = useState('');
  const [iSelMode, setISelMode] = useState(false);
  const [iSel, setISel] = useState(() => new Set());
  const [iRecat, setIRecat] = useState(false);
  const t = totals(txns, base, rates);
  const totalPay = debts.reduce((s, d) => s + convert(d.monthlyPayment, d.currency || base, base, rates), 0);
  const spare = t.income - t.expense - totalPay;
  const open = folders.find(f => f.id === openId);
  const RISK = { low: { c: T.pos, label: 'Low risk' }, medium: { c: '#f5b14c', label: 'Tight' }, high: { c: T.neg, label: 'Over budget' } };

  const addFolder = async () => { const name = newFolder.trim(); if (!name) return; setNewFolder(''); await addBudgetFolder(uid, { name, kind: newKind, items: [] }); };
  const delFolder = async (id) => { setOpenId(null); await deleteBudgetFolder(uid, id); };
  const addItem = async (fid) => { if (!itemText.trim()) return; const p = parsePlan(itemText, base); const f = folders.find(x => x.id === fid); if (!f) return; const item = { id: 'i' + Date.now(), description: p.description, amount: p.amount, currency: p.currency, cat: p.cat, status: 'considering' }; setItemText(''); await updateBudgetFolder(uid, fid, { items: [item, ...(f.items || [])] }); };
  const toggleItem = async (fid, iid) => { const f = folders.find(x => x.id === fid); if (!f) return; await updateBudgetFolder(uid, fid, { items: (f.items || []).map(i => i.id === iid ? { ...i, status: i.status === 'onhold' ? 'considering' : 'onhold' } : i) }); };
  const delItem = async (fid, iid) => { const f = folders.find(x => x.id === fid); if (!f) return; await updateBudgetFolder(uid, fid, { items: (f.items || []).filter(i => i.id !== iid) }); };
  const commitItem = async (fid, it) => { await addTransaction(uid, { type: 'expense', incomeType: null, cat: it.cat || 'misc', amount: it.amount, currency: it.currency || base, note: it.description, date: Date.now() }); await delItem(fid, it.id); };
  const toggleISel = (id) => setISel((sset) => { const n = new Set(sset); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const exitISel = () => { setISelMode(false); setISel(new Set()); setIRecat(false); };
  const bulkDelItems = async () => { if (!open) return; await updateBudgetFolder(uid, open.id, { items: (open.items || []).filter(i => !iSel.has(i.id)) }); exitISel(); };
  const bulkRecatItems = async (cat) => { if (!open) return; await updateBudgetFolder(uid, open.id, { items: (open.items || []).map(i => iSel.has(i.id) ? { ...i, cat } : i) }); exitISel(); };
  const bulkHoldItems = async () => { if (!open) return; await updateBudgetFolder(uid, open.id, { items: (open.items || []).map(i => iSel.has(i.id) ? { ...i, status: 'onhold' } : i) }); exitISel(); };

  if (open) {
    const ft = folderTotals(open, base, rates);
    const risk = folderRisk(open, spare, base, rates);
    const advice = folderAdvice(open, spare, base, rates, personality);
    const KindIcon = open.kind === 'time' ? Calendar : Briefcase;
    const items = open.items || [];
    return (
      <div className="space-y-4">
        <button onClick={() => { setOpenId(null); exitISel(); }} className="flex items-center gap-1 text-sm font-medium" style={{ color: T.textMute }}><ChevronLeft className="w-4 h-4" />All folders</button>
        <div className="rounded-3xl p-6" style={{ ...T.card, ...(T.isDark ? { background: 'linear-gradient(160deg, rgba(33,212,224,0.10), rgba(4,17,27,0.4))' } : {}) }}>
          <div className="flex items-center gap-2 mb-1" style={{ color: T.textMute }}><KindIcon className="w-4 h-4" /><span className="text-xs uppercase tracking-wider">{open.kind === 'time' ? 'Time based' : 'Name based'}</span></div>
          <h2 className="text-2xl font-bold tracking-tight">{open.name}</h2>
          <div className="flex items-end justify-between mt-3">
            <div><p className="text-xs" style={{ color: T.textFaint }}>Planned</p><p className="text-3xl font-bold tabular-nums" style={{ color: T.textMain }}>{money(ft.considering, base, 0)}</p></div>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: hexA(RISK[risk].c, 0.15), color: RISK[risk].c }}>{RISK[risk].label}</span>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex gap-3" style={T.card}><div className="shrink-0 mt-0.5"><MiFiAvatar size={34} /></div><div><p className="text-xs font-semibold mb-1" style={{ color: T.accentText }}>MiFi</p><p className="text-sm leading-relaxed" style={{ color: T.textSoft }}>{advice}</p></div></div>
        {items.length > 0 && (<div className="flex items-center justify-between"><button onClick={() => iSelMode ? exitISel() : setISelMode(true)} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={iSelMode ? { background: T.pillBg, color: T.accentText, border: `1px solid ${T.pillBorder}` } : { background: T.innerBg, color: T.textMute }}>{iSelMode ? 'Cancel' : 'Select'}</button>{iSelMode && <span className="text-sm font-semibold" style={{ color: T.textMain }}>{iSel.size} selected</span>}</div>)}
        {iSelMode && iSel.size > 0 && (<div className="rounded-2xl p-3 space-y-2" style={T.card}><div className="flex gap-2"><button onClick={() => setIRecat(r => !r)} className="flex-1 py-1.5 rounded-lg text-sm font-semibold" style={{ background: T.pillBg, color: T.accentText }}>Recategorize</button><button onClick={bulkHoldItems} className="flex-1 py-1.5 rounded-lg text-sm font-semibold" style={{ background: T.innerBg, color: T.textMute }}>Hold</button><button onClick={bulkDelItems} className="flex-1 py-1.5 rounded-lg text-sm font-semibold" style={{ background: hexA(T.neg, 0.14), color: T.neg }}>Delete</button></div>{iRecat && <div className="grid grid-cols-4 gap-2">{['groceries', 'dining', 'transport', 'rent', 'bills', 'data', 'subs', 'shopping', 'health', 'fun', 'family', 'education', 'misc'].map(id => { const m = catMeta(id); const Icon = m.icon; return (<button key={id} onClick={() => bulkRecatItems(id)} className="flex flex-col items-center gap-1 py-2 rounded-xl" style={{ background: T.innerBg, border: `1px solid ${T.border}` }}><Icon className="w-5 h-5" style={{ color: m.color }} /><span className="text-[10px] leading-tight text-center px-0.5" style={{ color: T.textFaint }}>{m.label}</span></button>); })}</div>}</div>)}
        {!iSelMode && (<div className="rounded-2xl p-2 flex gap-2" style={T.card}><input value={itemText} onChange={e => setItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(open.id)} placeholder="Add an expense, e.g. flight home 95k" className="flex-1 bg-transparent px-3 outline-none" style={{ color: T.textMain }} /><button onClick={() => addItem(open.id)} className="p-2.5 rounded-xl" style={{ background: T.accent, color: T.accentBtnText }}><Plus className="w-5 h-5" /></button></div>)}
        <div className="space-y-3">{items.length === 0 ? (<p className="text-center text-sm py-6" style={{ color: T.textFaint }}>No expenses in this folder yet.</p>) : items.map(it => { const m = catMeta(it.cat); const Icon = m.icon; const onHold = it.status === 'onhold'; if (iSelMode) { const on = iSel.has(it.id); return (<button key={it.id} onClick={() => toggleISel(it.id)} className="w-full text-left rounded-2xl p-3 flex items-center gap-3" style={{ ...T.card, opacity: onHold ? 0.6 : 1, boxShadow: on ? `0 0 0 2px ${T.accent}` : (T.card.boxShadow || 'none') }}><span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? T.accent : 'transparent', border: `1px solid ${on ? T.accent : T.textFaint}` }}>{on && <Check className="w-4 h-4" style={{ color: T.accentBtnText }} />}</span><span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexA(m.color, 0.15) }}><Icon className="w-5 h-5" style={{ color: m.color }} /></span><div className="flex-1" style={{ minWidth: 0 }}><p className="font-semibold truncate" style={{ color: T.textSoft }}>{it.description}</p><p className="text-xs" style={{ color: T.textFaint }}>{money(it.amount, it.currency || base, 0)}{onHold ? ' \u00b7 on hold' : ''}</p></div></button>); } return (
          <div key={it.id} className="rounded-2xl p-4" style={{ ...T.card, opacity: onHold ? 0.6 : 1 }}>
            <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexA(m.color, 0.15) }}><Icon className="w-5 h-5" style={{ color: m.color }} /></span><div className="flex-1" style={{ minWidth: 0 }}><p className="font-semibold truncate" style={{ color: T.textSoft }}>{it.description}</p><p className="text-xs" style={{ color: T.textFaint }}>{money(it.amount, it.currency || base, 0)}{(it.currency || base) !== base ? ` \u00b7 ${money(convert(it.amount, it.currency || base, base, rates), base, 0)}` : ''}{onHold ? ' \u00b7 on hold' : ''}</p></div></div>
            <div className="flex gap-2 mt-3"><button onClick={() => commitItem(open.id, it)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: T.accent, color: T.accentBtnText }}>Commit as expense</button><button onClick={() => toggleItem(open.id, it.id)} className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: T.innerBg, color: T.textMute }}>{onHold ? 'Reconsider' : 'Hold'}</button><button onClick={() => delItem(open.id, it.id)} className="px-3 py-2 rounded-lg" style={{ background: hexA(T.neg, 0.1), color: T.neg }}><Trash2 className="w-4 h-4" /></button></div>
          </div>); })}</div>
        <button onClick={() => delFolder(open.id)} className="w-full py-2.5 rounded-xl text-sm font-medium" style={{ background: hexA(T.neg, 0.1), color: T.neg }}>Delete folder</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight">Budget</h2><InfoDot T={T} text="Group planned spending into folders like a month, a trip, or a purchase. Each folder tells you whether it fits your spare money this month and what to commit first." /></div>
      <div className="rounded-3xl p-6" style={{ ...T.card, ...(T.isDark ? { background: 'linear-gradient(160deg, rgba(33,212,224,0.10), rgba(4,17,27,0.4))' } : {}) }}>
        <p className="text-sm mb-1" style={{ color: T.textMute }}>Spare this month</p>
        <p className="text-4xl font-bold tracking-tight tabular-nums" style={{ color: spare >= 0 ? T.pos : T.neg }}>{spare < 0 ? '\u2212' : ''}{money(Math.abs(spare), base)}</p>
        <p className="text-xs mt-2" style={{ color: T.textFaint }}>After income, spending, and debt payments. Folders draw from this.</p>
      </div>
      <div className="rounded-2xl p-3 space-y-2" style={T.card}>
        <div className="flex gap-2"><input value={newFolder} onChange={e => setNewFolder(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFolder()} placeholder="New folder, e.g. December or Studio gear" className="flex-1 bg-transparent px-2 outline-none text-sm" style={{ color: T.textMain }} /><button onClick={addFolder} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: T.accent, color: T.accentBtnText }}>Add</button></div>
        <div className="flex gap-2">{[['name', 'Name based', Briefcase], ['time', 'Time based', Calendar]].map(([k, label, Icon]) => (<button key={k} onClick={() => setNewKind(k)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={newKind === k ? { background: T.pillBg, border: `1px solid ${T.pillBorder}`, color: T.accentText } : { background: T.innerBg, border: `1px solid ${T.border}`, color: T.textMute }}><Icon className="w-3.5 h-3.5" />{label}</button>))}</div>
      </div>
      {folders.length === 0 ? (<div className="rounded-2xl p-10 text-center" style={T.card}><Lightbulb className="w-10 h-10 mx-auto mb-3" style={{ color: T.textFaint }} /><p style={{ color: T.textMute }}>No folders yet. Create one for a month or a goal.</p></div>) : (<div className="space-y-3">{folders.map(f => { const ft = folderTotals(f, base, rates); const risk = folderRisk(f, spare, base, rates); const KindIcon = f.kind === 'time' ? Calendar : Briefcase; const count = (f.items || []).length; return (
        <button key={f.id} onClick={() => setOpenId(f.id)} className="w-full text-left rounded-2xl p-4" style={T.card}>
          <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.pillBg }}><KindIcon className="w-4 h-4" style={{ color: T.accentText }} /></span><div><p className="font-semibold" style={{ color: T.textMain }}>{f.name}</p><p className="text-xs" style={{ color: T.textFaint }}>{count} item{count === 1 ? '' : 's'}</p></div></div><div className="text-right"><p className="font-bold tabular-nums" style={{ color: T.textMain }}>{money(ft.considering, base, 0)}</p><span className="text-xs font-semibold" style={{ color: RISK[risk].c }}>{RISK[risk].label}</span></div></div>
          <p className="text-xs leading-relaxed" style={{ color: T.textMute }}>{folderAdvice(f, spare, base, rates, personality)}</p>
        </button>); })}</div>)}
    </div>
  );
}

// ===== logo-skin signature + MiFi avatar + Brother voice =====
function Sprout({ T }) {
  return (<svg width="30" height="30" viewBox="0 0 40 40" fill="none" style={{ marginBottom: 2, filter: T.isDark ? 'drop-shadow(0 0 8px rgba(52,230,164,0.6))' : 'none' }}>
    <path d="M20 34 C20 24 20 18 20 12" stroke={T.pos} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M20 22 C9 20 3 12 4 3 C14 4 19 12 20 22" fill={T.pos} opacity="0.85" />
    <path d="M20 17 C29 15 35 8 34 0 C25 1 21 8 20 18" fill={T.posBright} opacity="0.9" />
  </svg>);
}
function MCashflow({ T, txns, base, rates }) {
  const W = 320, H = 96, PAD = 6, buckets = 8;
  const now = Date.now(), span = 30 * DAY, start = now - span;
  const arr = new Array(buckets).fill(0);
  txns.forEach(t => { if (t.date < start) return; const idx = Math.min(buckets - 1, Math.max(0, Math.floor((t.date - start) / (span / buckets)))); arr[idx] += (t.type === 'income' ? 1 : -1) * convert(t.amount, t.currency, base, rates); });
  const net = arr.reduce((a, v) => a + v, 0);
  const max = Math.max(...arr, 1), min = Math.min(...arr, 0), range = (max - min) || 1;
  const pts = arr.map((v, i) => { const x = PAD + (i / (buckets - 1)) * (W - 2 * PAD); const y = (H - PAD) - ((v - min) / range) * (H - 2 * PAD); return [x, y]; });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[buckets - 1][0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z`;
  const last = pts[buckets - 1];
  return (
    <div className="rounded-2xl p-5" style={T.card}>
      <div className="flex items-baseline justify-between">
        <div><div className="font-semibold" style={{ color: T.textMain }}>Cash flow</div><div className="text-xs" style={{ color: T.textFaint }}>Last 30 days</div></div>
        <div className="font-bold tabular-nums" style={{ fontSize: 20, color: net >= 0 ? T.posBright : T.neg }}>{net < 0 ? '\u2212' : '+'}{money(Math.abs(net), base, 0)}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 108, marginTop: 6, display: 'block' }}>
        <defs>
          <linearGradient id="cfline" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={T.accent} /><stop offset="100%" stopColor={T.pos} /></linearGradient>
          <linearGradient id="cfarea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity="0.20" /><stop offset="100%" stopColor={T.accent} stopOpacity="0" /></linearGradient>
        </defs>
        <path d={area} fill="url(#cfarea)" />
        <path d={line} fill="none" stroke="url(#cfline)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: T.isDark ? 'drop-shadow(0 0 6px rgba(33,212,224,0.5))' : 'none' }} />
        <g transform={`translate(${last[0].toFixed(1)} ${last[1].toFixed(1)})`}><circle r="3.6" fill={T.posBright} /><path d="M2 -2 C7 -5 11 -5 14 -10 C9 -9 5 -7 2 -4" fill={T.pos} /></g>
      </svg>
    </div>
  );
}
function MiFiAvatar({ size = 40 }) {
  const s = size;
  return (<div style={{ width: s, height: s, borderRadius: s * 0.32, background: 'linear-gradient(140deg,#21d4e0,#0b8f9b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 14px rgba(33,212,224,0.4)' }}>
    <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 40 40" fill="none"><path d="M6 30 L13 15 L20 24 L27 12" stroke="#03121a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M27 12 C30 9 35 9 37 6 C35 12 32 15 28 15" fill="#eafff6" /></svg>
  </div>);
}
function brotherInsight(t, totalPay, debts, fmt) {
  if (t.expense > t.income) return `Bro, real talk, you are spending more than you are bringing in this month. I am not here to judge, I am here to help. Let us trim a couple of things and get you back in the green.`;
  const sol = (t.expense + totalPay) > 0 ? t.passive / (t.expense + totalPay) * 100 : 0;
  return `Proud of you, bro. Solid month, and your passive income already covers about ${sol.toFixed(0)}% of your obligations. Keep stacking those streams and you will be free before you know it. I got you.`;
}
function brotherDebt(dti, fmt) {
  if (dti.count === 0) return `No debt, bro? That is real freedom and I am happy for you. Keep it clean and let us put that free cash to work.`;
  if (dti.drowning) return `Bro, hear me, one of these payments is not even covering the interest, so the balance is growing while you sleep. We raise it now. You are not alone in this, but we move today.`;
  const dtiPctAnnual = dti.income > 0 ? (dti.total / (dti.income * 12)) * 100 : 0;
  if (dti.income > 0 && dtiPctAnnual > 100) return `Straight up, bro, you owe ${fmt(dti.total)}, more than a full year of income. It is a deep hole but we climb out together. Every spare naira goes at the highest-rate one, starting now.`;
  if (dti.income > 0 && dti.payRatio > 36) return `Bro, ${dti.payRatio.toFixed(0)}% of your income is going to debt, that is choking you. Let us free you up by hammering the ${dti.highest}% debt first. I will keep you honest.`;
  if (dti.highest >= 20) return `That ${dti.highest}% interest is eating you alive, bro, ${dti.interestShare.toFixed(0)}% of every payment is just interest. Hit that one first and we cut the bleeding.`;
  return `You have got ${fmt(dti.total)} on you, bro, that is handleable. Pay a little over the minimum and you are free in about ${dti.payoffMonths === Infinity ? 'a while' : dti.payoffMonths + ' months'}. I am with you the whole way.`;
}
function brotherReply(q, t, totalDebt, fmt) {
  const ql = q.toLowerCase(); const net = t.net;
  if (ql.includes('how') && (ql.includes('doing') || ql.includes('am i'))) {
    const sol = t.expense > 0 ? t.passive / t.expense * 100 : 0;
    if (net >= 0) return `You are up ${fmt(net)} this month, bro, respect. You are still leaning on that salary though (passive covers ~${sol.toFixed(0)}%). Let us build something on the side that pays you. I have got ideas.`;
    return `Bro, you are down ${fmt(Math.abs(net))} this month. It happens, but we do not let it ride. Let us trim a little and find some extra income. We fix this together.`;
  }
  if (ql.includes('debt') || ql.includes('saving')) {
    if (totalDebt > 0) return `Listen bro, kill that ${fmt(totalDebt)} debt first. Highest interest first, then we stack savings. One step at a time, I am with you.`;
    return `Debt-free, bro? That is huge. Now build a 3 to 6 month cushion, then we start investing so your money works while you rest.`;
  }
  if (ql.includes('passive') || ql.includes('income') || ql.includes('hustle')) {
    return `Passive income is how you buy your time back, bro. Turn a skill into a product, add some dividend payers, build content that keeps paying. Start small, stay steady, I will keep you on track.`;
  }
  return `I did not fully catch that, bro. Ask me about your money, your debt, or building income, and I will break it down for you.`;
}


// ===== budget folder helpers =====
const NEED_CATS = ['rent', 'bills', 'data', 'transport', 'groceries', 'health', 'education', 'family'];
// Spending you cannot meaningfully dial down month to month. Kept out of the
// forecast's what-if sliders, because pretending otherwise is fantasy.
const FIXED_CATS = ['rent', 'health', 'education'];
function folderTotals(folder, base, rates) {
  let total = 0, considering = 0;
  (folder.items || []).forEach(it => { const v = convert(it.amount, it.currency || base, base, rates); total += v; if (it.status !== 'onhold') considering += v; });
  return { total, considering };
}
function folderRisk(folder, spare, base, rates) {
  const { considering } = folderTotals(folder, base, rates);
  if (spare <= 0) return considering > 0 ? 'high' : 'low';
  if (considering > spare) return 'high';
  if (considering > spare * 0.6) return 'medium';
  return 'low';
}
function folderAdvice(folder, spare, base, rates, personality) {
  const items = (folder.items || []).filter(i => i.status !== 'onhold');
  if (items.length === 0) return 'Nothing active here yet. Add what you are weighing up and I will tell you what to prioritise.';
  const { considering } = folderTotals(folder, base, rates);
  const val = (i) => convert(i.amount, i.currency || base, base, rates);
  const needs = items.filter(i => NEED_CATS.includes(i.cat));
  const wants = items.filter(i => !NEED_CATS.includes(i.cat)).sort((a, b) => val(b) - val(a));
  const opener = { genZ: 'Real talk,', coolUncle: 'Listen,', harsh: 'No excuses,', professional: 'Assessment:', africanParent: 'My child,', naijaHustler: 'Oya listen,', zen: 'Breathe.', brother: 'Bro,' }[personality] || '';
  const needNames = needs.map(i => i.description).join(', ');
  if (spare > 0 && considering > spare) {
    const over = considering - spare; const cut = wants[0];
    return `${opener} this folder is ${money(considering, base, 0)}, which is ${money(over, base, 0)} more than your ${money(spare, base, 0)} spare this month. ${needs.length ? `Commit the essentials first (${needNames}). ` : ''}${cut ? `Hold ${cut.description} for now, it is the biggest stretch.` : 'Trim the largest item to stay safe.'}`;
  }
  return `${opener} this fits inside your ${money(spare, base, 0)} spare this month. ${needs.length ? `Commit ${needNames} first, ` : ''}${wants.length ? `then ${wants[0].description} if you still feel good about it.` : 'you are in good shape.'}`;
}


function Onboarding({ T, uid, email }) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [cur, setCur] = useState('NGN');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);
  const fs = { background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textMain };
  const lab = { color: T.textMute };
  const submit = async () => { if (!name.trim() || !country.trim()) return; setBusy(true); try { await updateProfile(uid, { name: name.trim(), country: country.trim(), baseCurrency: cur, phone: phone.trim(), dob, onboarded: true }); } catch { setBusy(false); } };
  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: T.pageBg, color: T.textMain }}>
      <div className="w-full max-w-sm rounded-3xl p-7" style={T.solidPanel}>
        <div className="flex flex-col items-center mb-6"><MiFiAvatar size={56} /><h1 className="text-xl font-bold mt-3">Welcome to MiFi</h1><p className="text-sm mt-1 text-center" style={{ color: T.textMute }}>A few quick details to set you up.</p></div>
        <div className="space-y-3">
          <div><label className="text-xs font-medium block mb-1" style={lab}>Your name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Akin" className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm" style={fs} /></div>
          <div><label className="text-xs font-medium block mb-1" style={lab}>Country</label><input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Nigeria" className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm" style={fs} /></div>
          <div><label className="text-xs font-medium block mb-1" style={lab}>Base currency</label><select value={cur} onChange={e => setCur(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm" style={fs}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}</select></div>
          <div><label className="text-xs font-medium block mb-1" style={lab}>Phone (optional)</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm" style={fs} /></div>
          <div><label className="text-xs font-medium block mb-1" style={lab}>Date of birth (optional)</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm" style={fs} /></div>
          <button onClick={submit} disabled={busy || !name.trim() || !country.trim()} className="w-full py-3 rounded-xl font-semibold disabled:opacity-50" style={{ background: `linear-gradient(135deg,${T.accentBright},${T.accent})`, color: T.accentBtnText, ...T.glow }}>{busy ? 'Setting up' : 'Get started'}</button>
        </div>
      </div>
    </div>
  );
}

// ===== avatars =====
// Abstract marks rather than faces. Faces drawn in SVG age badly and never
// quite look like anyone; these read cleanly at 28px and at 56px, and sit
// properly next to the app's glass and neon.
const AVATARS = [
  { id: 'arc',    bg: ['#21d4e0', '#0b6d8f'], ink: '#eafaff' },
  { id: 'orbit',  bg: ['#34e6a4', '#0c7f63'], ink: '#eafff6' },
  { id: 'prism',  bg: ['#8a6cff', '#4321a8'], ink: '#f2ecff' },
  { id: 'wave',   bg: ['#ff9f43', '#c2410c'], ink: '#fff4e8' },
  { id: 'bloom',  bg: ['#ff6f96', '#a01046'], ink: '#ffeef3' },
  { id: 'stack',  bg: ['#3ba9ff', '#1e3a8a'], ink: '#e9f4ff' },
  { id: 'grid',   bg: ['#ffd23f', '#a16207'], ink: '#fffaec' },
  { id: 'eclipse',bg: ['#c084fc', '#6b21a8'], ink: '#f9f0ff' },
];
function avatarMark(a) {
  const k = a.ink;
  switch (a.id) {
    case 'arc': return (<g fill="none" stroke={k} strokeLinecap="round">
      <path d="M22 54 A18 18 0 0 1 58 54" strokeWidth="5" opacity="0.95" />
      <path d="M32 54 A8 8 0 0 1 48 54" strokeWidth="5" opacity="0.55" />
      <circle cx="40" cy="26" r="3.6" fill={k} stroke="none" /></g>);
    case 'orbit': return (<g>
      <circle cx="40" cy="40" r="19" fill="none" stroke={k} strokeWidth="4" opacity="0.4" />
      <circle cx="40" cy="40" r="8.5" fill={k} />
      <circle cx="40" cy="21" r="4.6" fill={k} /></g>);
    case 'prism': return (<g>
      <path d="M40 20 L59 52 H21 Z" fill="none" stroke={k} strokeWidth="4.5" strokeLinejoin="round" opacity="0.92" />
      <path d="M40 34 L49 52 H31 Z" fill={k} opacity="0.55" /></g>);
    case 'wave': return (<g fill="none" stroke={k} strokeWidth="4.6" strokeLinecap="round">
      <path d="M18 34 Q29 24 40 34 T62 34" opacity="0.5" />
      <path d="M18 46 Q29 36 40 46 T62 46" opacity="0.95" /></g>);
    case 'bloom': return (<g fill={k}>
      <circle cx="40" cy="28" r="9" opacity="0.95" />
      <circle cx="29" cy="47" r="9" opacity="0.62" />
      <circle cx="51" cy="47" r="9" opacity="0.62" /></g>);
    case 'stack': return (<g fill={k}>
      <rect x="22" y="44" width="36" height="7" rx="3.5" opacity="0.95" />
      <rect x="27" y="33" width="26" height="7" rx="3.5" opacity="0.68" />
      <rect x="32" y="22" width="16" height="7" rx="3.5" opacity="0.42" /></g>);
    case 'grid': return (<g fill={k}>
      {[26, 40, 54].map((y, r) => [26, 40, 54].map((x, c) => (
        <circle key={`${r}${c}`} cx={x} cy={y} r={5 - Math.abs(r - 1) * 1.1} opacity={0.95 - (r + c) * 0.1} />)))}</g>);
    case 'eclipse': return (<g>
      <circle cx="34" cy="40" r="17" fill={k} opacity="0.95" />
      <circle cx="48" cy="40" r="17" fill={a.bg[1]} opacity="0.85" /></g>);
    default: return null;
  }
}
function Avatar({ i, size = 56 }) {
  const a = AVATARS[i % AVATARS.length];
  const gid = 'av' + a.id;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ display: 'block', borderRadius: '50%', flexShrink: 0 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={a.bg[0]} /><stop offset="100%" stopColor={a.bg[1]} /></linearGradient>
        <clipPath id={gid + 'c'}><circle cx="40" cy="40" r="40" /></clipPath>
      </defs>
      <g clipPath={`url(#${gid}c)`}>
        <rect width="80" height="80" fill={`url(#${gid})`} />
        <circle cx="16" cy="14" r="26" fill="#ffffff" opacity="0.10" />
        {avatarMark(a)}
      </g>
    </svg>
  );
}

// ===== inline info tooltip =====
function InfoDot({ T, text }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o); }} aria-label="What is this?" style={{ width: 18, height: 18, borderRadius: 9, border: `1px solid ${T.textFaint}`, color: T.textFaint, fontSize: 11, fontWeight: 700, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontFamily: 'Georgia, serif', flexShrink: 0 }}>i</button>
      {open && (<>
        <div onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
        <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ position: 'absolute', top: 24, left: 0, zIndex: 41, width: 224, ...T.solidPanel, color: T.textSoft }}>{text}</div>
      </>)}
    </span>
  );
}

// ===== compact settings controls =====
// A labelled native select. Native is deliberate: on a phone it opens the
// system wheel, which is faster to scan than a wall of buttons.
function PickSelect({ T, value, onChange, options, hint }) {
  return (
    <>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3.5 py-3 rounded-xl outline-none text-sm font-medium appearance-none" style={{ background: T.selectBg, border: `1px solid ${T.inputBorder}`, color: T.textMain, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.textMute)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 40 }}>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: T.selectBg, color: T.textMain }}>{o.label}</option>)}
      </select>
      {hint && <p className="text-xs mt-2" style={{ color: T.textFaint }}>{hint}</p>}
    </>
  );
}

// A picker that has to stay visual, so it collapses to the current choice
// and opens a grid on tap.
function PickVisual({ T, open, onToggle, current, children }) {
  return (
    <>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: T.selectBg, border: `1px solid ${T.inputBorder}` }}>
        {current}
        <ChevronDown className="w-4 h-4 ml-auto shrink-0" style={{ color: T.textMute, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </>
  );
}


// ---------- FUTURE (forecast map) ----------
function Future({ T, uid, txns, debts, base, rates, personality, strategy, cashBalance, inflation, onNav }) {
  const [horizon, setHorizon] = useState(24);
  const [mode, setMode] = useState('cash');
  const [cuts, setCuts] = useState({});          // { cat: percentCut }
  const [extraPassive, setExtraPassive] = useState('');
  const [extraDebt, setExtraDebt] = useState('');
  const [askAmount, setAskAmount] = useState('');

  const num = (s) => { const v = parseFloat(s); return Number.isFinite(v) && v > 0 ? v : 0; };
  const catDeltas = {};
  Object.entries(cuts).forEach(([c, pct]) => { if (pct) catDeltas[c] = -pct / 100; });
  const scenario = { catDeltas, extraPassive: num(extraPassive), extraDebtPayment: num(extraDebt) };
  const touched = Object.keys(catDeltas).length > 0 || scenario.extraPassive > 0 || scenario.extraDebtPayment > 0;

  const opts = { txns, debts, base, rates, months: horizon, startingCash: cashBalance || 0, inflation: inflation || 0, strategy };
  const plain = useMemo(() => buildForecast(opts), [txns, debts, base, rates, horizon, cashBalance, inflation, strategy]);
  const f = useMemo(() => buildForecast({ ...opts, scenario }), [txns, debts, base, rates, horizon, cashBalance, inflation, strategy, JSON.stringify(scenario)]);
  const cost = useMemo(() => (num(askAmount) > 0 ? costOfDecision(num(askAmount), { ...opts, scenario }) : null), [askAmount, txns, debts, base, rates, horizon, cashBalance, inflation, strategy, JSON.stringify(scenario)]);

  const fmt = (n) => money(n, base);

  if (!f.ready) {
    const have = f.monthsOfData || 0;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight">Future</h2><InfoDot T={T} text="Where your current behaviour leads, month by month. Built from your finished months only, so it needs three of them before it will draw anything. Move the what-if sliders to see how a change plays out." /></div>
        <div className="rounded-3xl p-6 text-center" style={T.card}>
          <Route className="w-10 h-10 mx-auto mb-3" style={{ color: T.textFaint }} />
          <p className="font-bold mb-1" style={{ color: T.textMain }}>Not enough history yet</p>
          <p className="text-sm mb-4" style={{ color: T.textMute }}>MiFi needs three full months of logged activity before it will draw your future. Anything less and the line would be a guess dressed up as a forecast.</p>
          <div className="flex justify-center gap-2 mb-4">{[0, 1, 2].map(i => (<span key={i} className="w-12 h-1.5 rounded-full" style={{ background: i < have ? T.accent : T.barTrack }} />))}</div>
          <p className="text-xs mb-4" style={{ color: T.textFaint }}>{have} of 3 months. The month you are in does not count until it ends.</p>
          <button onClick={() => onNav('transactions')} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: T.accent, color: T.accentBtnText, ...T.glow }}>Log transactions</button>
        </div>
      </div>
    );
  }

  const m0 = f.months[0];
  const last = f.months[f.months.length - 1];
  // Only offer sliders on spending you could actually change this month.
  // Suggesting someone cut their rent by 40% is not advice, it is noise.
  const ranked = Object.entries(f.baseline.byCat).sort((a, b) => b[1] - a[1]);
  const flexible = ranked.filter(([c]) => !FIXED_CATS.includes(c));
  const topCats = (flexible.length ? flexible : ranked).slice(0, 3);
  const monthLabel = (mo) => (mo ? f.months[mo - 1].label : null);
  const reset = () => { setCuts({}); setExtraPassive(''); setExtraDebt(''); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight">Future</h2><InfoDot T={T} text="Where your current behaviour leads, month by month. Built from your finished months only, so it needs three of them before it will draw anything. Move the what-if sliders to see how a change plays out." /></div>
        <div className="flex gap-1">{[12, 24, 36].map(h => (<button key={h} onClick={() => setHorizon(h)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={horizon === h ? { background: T.accent, color: T.accentBtnText } : { background: T.innerBg, color: T.textMute }}>{h}m</button>))}</div>
      </div>

      <MiBanner T={T} personality={personality} text={forecastHeadline(f, fmt, personality)} />

      <div className="grid grid-cols-3 gap-2">
        <FutureTile T={T} label="Debt free" value={f.milestones.startingDebt <= 0 ? 'Already' : (f.milestones.debtStuck ? 'Never' : (monthLabel(f.milestones.debtFreeMonth) || `${horizon}m+`))} sub={f.milestones.startingDebt <= 0 ? 'nothing owed' : (f.milestones.debtStuck ? 'payment too low' : 'at this pace')} tone={f.milestones.debtStuck ? T.neg : (f.milestones.startingDebt <= 0 ? T.pos : T.accentText)} />
        <FutureTile T={T} label="Self funding" value={monthLabel(f.milestones.solvencyMonth) || 'Not yet'} sub={f.milestones.solvencyMonth ? 'passive covers all' : 'needs more passive'} tone={f.milestones.solvencyMonth ? T.pos : T.textMute} />
        <FutureTile T={T} label="Runway" value={f.milestones.runwayMonths === null ? 'Set it' : `${f.milestones.runwayMonths.toFixed(1)}m`} sub={f.milestones.runwayMonths === null ? 'add a balance' : 'if income stopped'} tone={f.milestones.runwayMonths === null ? T.textFaint : (f.milestones.runwayMonths < 3 ? T.neg : T.accentText)} />
      </div>

      {f.milestones.runwayMonths === null && (
        <button onClick={() => onNav('settings')} className="w-full rounded-2xl p-4 text-left flex items-center gap-3" style={{ ...T.card, border: `1px solid ${T.pillBorder}` }}>
          <Target className="w-5 h-5 shrink-0" style={{ color: T.accent }} />
          <span className="flex-1"><span className="block text-sm font-semibold" style={{ color: T.textMain }}>Tell MiFi what you actually have</span><span className="block text-xs" style={{ color: T.textMute }}>It tracks money moving, not money sitting. One number in Settings unlocks runway and a real balance line.</span></span>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: T.textFaint }} />
        </button>
      )}

      <div className="rounded-2xl p-5" style={T.card}>
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl mb-4" style={{ background: T.innerBg }}>
          {[['cash', f.tracksBalance ? 'Balance' : 'Saved up'], ['solvency', 'Solvency'], ['debt', 'Debt']].map(([id, label]) => (<button key={id} onClick={() => setMode(id)} className="py-2 rounded-xl text-xs font-semibold" style={mode === id ? { background: T.accent, color: T.accentBtnText } : { color: T.textMute }}>{label}</button>))}
        </div>
        <FutureChart T={T} months={f.months} mode={mode} base={base} tracksBalance={f.tracksBalance} />
        <p className="text-xs mt-3 leading-relaxed" style={{ color: T.textFaint }}>
          {mode === 'cash' && (f.tracksBalance ? 'Your balance as it moves. The shaded band is how far off this could run, based on how much your months actually vary.' : 'How much you pile up from today. This is not your balance, MiFi does not know it yet. The band is your month to month variation.')}
          {mode === 'solvency' && 'How much of your monthly obligations your passive income covers. 100% is the goal, because that is the month your salary stops being the thing holding you up.'}
          {mode === 'debt' && 'What you still owe, month by month, with interest properly accounted for.'}
        </p>
      </div>

      <div className="rounded-2xl p-5" style={T.card}>
        <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" style={{ color: T.accent }} /><h3 className="font-semibold" style={{ color: T.textMain }}>What if</h3></div>{touched && <button onClick={reset} className="text-xs font-medium" style={{ color: T.accentText }}>Reset</button>}</div>
        <p className="text-xs mb-4" style={{ color: T.textFaint }}>Move these and the map above redraws. Nothing here is saved, it is just you thinking out loud.</p>

        {topCats.map(([cat, avg]) => { const m = catMeta(cat); const pct = cuts[cat] || 0; return (
          <div key={cat} className="mb-4">
            <div className="flex items-center justify-between mb-1.5"><span className="flex items-center gap-2 text-sm font-medium" style={{ color: T.textSoft }}><m.icon className="w-4 h-4" style={{ color: m.color }} />Spend less on {m.label.toLowerCase()}</span><span className="text-xs font-semibold tabular-nums" style={{ color: pct ? T.pos : T.textFaint }}>{pct ? `−${pct}%` : `${money(avg, base, 0)}/mo`}</span></div>
            <input type="range" min="0" max="50" step="5" value={pct} onChange={e => setCuts({ ...cuts, [cat]: parseInt(e.target.value) })} className="w-full" style={{ accentColor: T.accent }} />
            {pct > 0 && <p className="text-xs mt-1" style={{ color: T.pos }}>Frees {money(avg * pct / 100, base, 0)} a month</p>}
          </div>); })}

        <label className="text-xs font-medium block mb-1.5 mt-5" style={{ color: T.textMute }}>Add passive income a month</label>
        <Input T={T} value={extraPassive} onChange={setExtraPassive} placeholder={`e.g. 80000 in ${base}`} type="number" />
        <label className="text-xs font-medium block mb-1.5 mt-3" style={{ color: T.textMute }}>Put extra on your debt a month</label>
        <Input T={T} value={extraDebt} onChange={setExtraDebt} placeholder={`e.g. 25000 in ${base}`} type="number" />

        {touched && <ScenarioDelta T={T} plain={plain} scenario={f} fmt={fmt} monthLabel={monthLabel} horizon={horizon} />}
      </div>

      <div className="rounded-2xl p-5" style={T.card}>
        <div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4" style={{ color: T.accent }} /><h3 className="font-semibold" style={{ color: T.textMain }}>What would this cost me</h3></div>
        <p className="text-xs mb-3" style={{ color: T.textFaint }}>Thinking about buying something. Put the price in and MiFi tells you what it really costs you, in time.</p>
        <Input T={T} value={askAmount} onChange={setAskAmount} placeholder={`Amount in ${base}`} type="number" />
        {cost && cost.ready && (
          <div className="rounded-xl p-4 mt-3" style={{ background: T.innerBg }}>
            <p className="text-sm leading-relaxed" style={{ color: T.textSoft }}>
              {money(num(askAmount), base, 0)} is <span style={{ color: T.accentText, fontWeight: 600 }}>{cost.monthsOfExpense ? `${cost.monthsOfExpense.toFixed(1)} months` : 'a chunk'}</span> of everything you normally spend
              {cost.weeksOfNet ? <>, and it takes <span style={{ color: T.accentText, fontWeight: 600 }}>{cost.weeksOfNet.toFixed(1)} weeks</span> of what you keep to earn back</> : null}.
            </p>
            {cost.pushesCashNegative && <p className="text-sm mt-2 font-semibold" style={{ color: T.neg }}>It also runs you out of money before the end of this forecast. Do not do this one.</p>}
            {!cost.pushesCashNegative && cost.weeksOfNet === null && <p className="text-sm mt-2" style={{ color: T.neg }}>You are not keeping anything most months, so this comes out of savings or debt.</p>}
          </div>
        )}
      </div>

      {f.drift.length > 0 && (
        <div className="rounded-2xl p-5" style={{ ...T.card, border: `1px solid ${hexA('#f59e0b', 0.3)}` }}>
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} /><h3 className="font-semibold" style={{ color: T.textMain }}>Creeping up</h3></div>
          <div className="space-y-2.5">{f.drift.slice(0, 3).map(d => { const m = catMeta(d.cat); const Icon = m.icon; return (
            <div key={d.cat} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: T.innerBg }}>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(m.color, 0.15) }}><Icon className="w-4 h-4" style={{ color: m.color }} /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium" style={{ color: T.textSoft }}>{m.label} is up {(d.rise * 100).toFixed(0)}%</p><p className="text-xs" style={{ color: T.textFaint }}>{money(d.latest, base, 0)} last month against {money(d.average, base, 0)} usual{d.sustained ? ', rising three months straight' : ''}</p></div>
            </div>); })}</div>
        </div>
      )}

      <div className="rounded-2xl p-5" style={T.card}>
        <h3 className="font-semibold mb-2" style={{ color: T.textSoft }}>What this is built on</h3>
        <ul className="text-xs space-y-1.5 leading-relaxed" style={{ color: T.textMute }}>
          <li>Your last {Math.min(f.monthsOfData, 6)} finished months, with recent ones counting for more.</li>
          <li>The month you are in is ignored until it ends, so a half-logged month cannot drag the numbers down.</li>
          <li>Passive income is held flat. MiFi will not pretend it grows on its own. Move the slider to see what happens if you build it.</li>
          <li>{inflation > 0 ? `Your spending grows ${inflation}% a year, as you set in Settings.` : 'Prices are assumed to hold steady, which flatters anything past about a year. Set an expected rate in Settings.'}</li>
          <li>Anything past month 18 is faded on purpose. It is a direction, not a date.</li>
        </ul>
      </div>
    </div>
  );
}

function FutureTile({ T, label, value, sub, tone }) {
  return (<div className="rounded-2xl p-3" style={T.card}><p className="text-xs mb-1" style={{ color: T.textFaint }}>{label}</p><p className="font-bold tabular-nums text-sm leading-tight" style={{ color: tone }}>{value}</p><p className="text-[10px] mt-0.5 leading-tight" style={{ color: T.textFaint }}>{sub}</p></div>);
}

function ScenarioDelta({ T, plain, scenario, fmt, monthLabel, horizon }) {
  const a = plain.months[plain.months.length - 1].cash;
  const b = scenario.months[scenario.months.length - 1].cash;
  const diff = b - a;
  const dA = plain.milestones.debtFreeMonth, dB = scenario.milestones.debtFreeMonth;
  const sA = plain.milestones.solvencyMonth, sB = scenario.milestones.solvencyMonth;
  const lines = [];
  if (Math.abs(diff) > 1) lines.push(`${diff > 0 ? 'Puts' : 'Costs'} you ${fmt(Math.abs(diff))} more over ${horizon} months.`);
  if (dB && dA && dB < dA) lines.push(`Debt free ${dA - dB} month${dA - dB === 1 ? '' : 's'} sooner, ${monthLabel(dB)} instead of ${monthLabel(dA)}.`);
  if (dB && !dA) lines.push(`Clears your debt by ${monthLabel(dB)}. On your current pace it does not clear inside ${horizon} months.`);
  if (sB && !sA) lines.push(`Passive income finally covers everything by ${monthLabel(sB)}.`);
  if (sB && sA && sB < sA) lines.push(`Fully covered ${sA - sB} month${sA - sB === 1 ? '' : 's'} sooner.`);
  if (!lines.length) return null;
  return (<div className="rounded-xl p-3.5 mt-4" style={{ background: hexA(T.pos, 0.1), border: `1px solid ${hexA(T.pos, 0.3)}` }}><p className="text-xs font-semibold mb-1" style={{ color: T.pos }}>If you did this</p>{lines.map((l, i) => <p key={i} className="text-sm leading-relaxed" style={{ color: T.textSoft }}>{l}</p>)}</div>);
}

function FutureChart({ T, months, mode, base, tracksBalance }) {
  const W = 320, H = 132, PL = 4, PR = 4, PT = 10, PB = 16;
  const pick = (m) => mode === 'cash' ? m.cash : mode === 'solvency' ? Math.min(m.solvencyPassive, 200) : m.debtRemaining;
  const vals = months.map(pick);
  const lows = mode === 'cash' ? months.map(m => m.cashLow) : vals;
  const highs = mode === 'cash' ? months.map(m => m.cashHigh) : vals;
  let lo = Math.min(...lows, mode === 'solvency' ? 0 : 0);
  let hi = Math.max(...highs, mode === 'solvency' ? 100 : 1);
  if (hi === lo) hi = lo + 1;
  const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
  const X = (i) => PL + (i / Math.max(1, months.length - 1)) * (W - PL - PR);
  const Y = (v) => (H - PB) - ((v - lo) / (hi - lo)) * (H - PT - PB);
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const cone = mode === 'cash'
    ? `${path(highs)} ${lows.map((v, i) => `L${X(lows.length - 1 - i).toFixed(1)} ${Y(lows[lows.length - 1 - i]).toFixed(1)}`).join(' ')} Z`
    : null;
  const zeroY = (lo < 0 && hi > 0) ? Y(0) : null;
  const goalY = (mode === 'solvency' && hi >= 100 && lo <= 100) ? Y(100) : null;
  const fadeFrom = months.findIndex(m => m.faded);
  const endV = vals[vals.length - 1];
  const label = mode === 'solvency' ? `${endV.toFixed(0)}%` : money(endV, base, 0);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 148, display: 'block' }}>
        <defs>
          <linearGradient id="fline" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={T.accent} /><stop offset="100%" stopColor={mode === 'debt' ? T.neg : T.pos} /></linearGradient>
          <linearGradient id="fcone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity="0.22" /><stop offset="100%" stopColor={T.accent} stopOpacity="0.04" /></linearGradient>
          <linearGradient id="ffade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={T.isDark ? '#04111b' : '#eef5f5'} stopOpacity="0" /><stop offset="100%" stopColor={T.isDark ? '#04111b' : '#eef5f5'} stopOpacity="0.62" /></linearGradient>
        </defs>
        {cone && <path d={cone} fill="url(#fcone)" />}
        {zeroY !== null && <line x1={PL} y1={zeroY} x2={W - PR} y2={zeroY} stroke={T.neg} strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />}
        {goalY !== null && <line x1={PL} y1={goalY} x2={W - PR} y2={goalY} stroke={T.pos} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />}
        <path d={path(vals)} fill="none" stroke="url(#fline)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: T.isDark ? 'drop-shadow(0 0 5px rgba(33,212,224,0.45))' : 'none' }} />
        {fadeFrom > 0 && <rect x={X(fadeFrom)} y="0" width={W - X(fadeFrom)} height={H} fill="url(#ffade)" />}
        <circle cx={X(vals.length - 1)} cy={Y(endV)} r="3.4" fill={mode === 'debt' ? T.neg : T.posBright} opacity={fadeFrom > 0 ? 0.55 : 1} />
      </svg>
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[10px]" style={{ color: T.textFaint }}>{months[0].label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: mode === 'debt' ? T.neg : T.posBright }}>{label}</span>
        <span className="text-[10px]" style={{ color: T.textFaint }}>{months[months.length - 1].label}</span>
      </div>
    </div>
  );
}

function forecastHeadline(f, fmt, personality) {
  const opener = { genZ: 'Okay so,', coolUncle: 'Here is the picture, kiddo.', harsh: 'Look at this.', professional: 'Forecast:', africanParent: 'My child,', naijaHustler: 'Oya check am,', zen: 'Look gently at this.', brother: 'Bro,' }[personality] || '';
  const m0 = f.months[0];
  const mo = (n) => (n ? f.months[n - 1].label : null);
  if (f.milestones.debtStuck) return `${opener} one of your debt payments does not even cover its own interest, so that balance climbs every month no matter what else you do. Nothing else on this screen matters until you raise it.`;
  if (f.milestones.cashNegativeMonth) return `${opener} at this pace your money runs out around ${mo(f.milestones.cashNegativeMonth)}. That is the thing to fix. Try the sliders below and watch that date move.`;
  if (m0.net < 0) return `${opener} you are spending ${fmt(Math.abs(m0.net))} more than you bring in each month, so the line below only goes one way. Cutting one of the categories below is the fastest fix.`;
  const bits = [];
  if (f.milestones.debtFreeMonth) bits.push(`your debt clears around ${mo(f.milestones.debtFreeMonth)}`);
  if (f.milestones.solvencyMonth) bits.push(`passive income covers everything by ${mo(f.milestones.solvencyMonth)}`);
  if (bits.length) return `${opener} keep doing exactly what you are doing and ${bits.join(', and ')}. Keeping ${fmt(m0.net)} a month is what gets you there.`;
  return `${opener} you keep about ${fmt(m0.net)} a month, which is solid. But passive income is only covering ${m0.solvencyPassive.toFixed(0)}% of your obligations and it is flat, so on current behaviour it never catches up. The passive slider below is the one that changes your life, not the spending ones.`;
}

// Exported for render tests only. Not used by the app.
export const __test = { Future, THEMES, SettingsView, Dashboard, Budget, Debts, Avatar };
