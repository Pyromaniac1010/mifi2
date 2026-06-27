import { DollarSign, TrendingUp, TrendingDown, Target, ChevronRight, CreditCard, Plus, Sparkles } from 'lucide-react';
import { computeTotals, computeSolvency, computeDebtTotals, debtProgress, orderDebts } from '../lib/calculations';
import { convert, money } from '../lib/currency';
import { getMiInsight } from '../lib/mi';

export default function Dashboard({ transactions, debts, personality, base, rates, name, debtStrategy, solvencyCap, onNavigate }) {
  const { activeIncome, passiveIncome, totalIncome, totalExpenses, netBalance } = computeTotals(transactions, base, rates);
  const { totalDebt, totalDebtPayment } = computeDebtTotals(debts, base, rates);
  const solvency = computeSolvency(totalIncome, totalExpenses, totalDebtPayment);
  const shownSolvency = solvencyCap ? Math.min(solvency, 100) : solvency;
  const insight = getMiInsight(totalIncome, totalExpenses, debts, personality, base, rates, debtStrategy);
  const topDebts = orderDebts(debts, debtStrategy, base, rates).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="text-xl font-bold text-navy-700">{name || 'there'}</p>
        </div>
        <button onClick={() => onNavigate('settings')} className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg bg-navy-50 text-navy-700 border border-navy-100">
          {(name || 'U').charAt(0).toUpperCase()}
        </button>
      </div>

      <div className="bg-gradient-to-r from-navy-600 to-mint-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Financial Solvency Score</h2>
          <Target className="w-6 h-6" />
        </div>
        <div className="text-4xl font-bold mb-1">{shownSolvency.toFixed(1)}%</div>
        <p className="text-xs opacity-75 mb-3">income vs obligations · in {base}{!solvencyCap && solvency > 100 ? ' · true coverage' : ''}</p>
        <div className="w-full bg-white/20 rounded-full h-3 mb-3">
          <div className="bg-white rounded-full h-3 transition-all duration-500" style={{ width: `${Math.min(solvency, 100)}%` }} />
        </div>
        <p className="text-sm opacity-90">
          {solvency >= 100 ? "Your income covers this month's obligations." : "Your obligations are outpacing your income this month."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat title="Active Income" value={activeIncome} base={base} icon={<TrendingUp className="w-5 h-5 text-mint-600" />} />
        <Stat title="Passive Income" value={passiveIncome} base={base} icon={<DollarSign className="w-5 h-5 text-mint-600" />} />
        <Stat title="Expenses" value={totalExpenses} base={base} icon={<TrendingDown className="w-5 h-5 text-red-600" />} />
      </div>

      <div className={`rounded-2xl p-6 shadow-lg ${netBalance >= 0 ? 'bg-mint-50' : 'bg-red-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Monthly Net Balance</p>
            <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-mint-600' : 'text-red-600'}`}>
              {netBalance < 0 ? '-' : ''}{money(Math.abs(netBalance), base)}
            </p>
          </div>
          <div className={`p-3 rounded-full ${netBalance >= 0 ? 'bg-mint-100' : 'bg-red-100'}`}>
            {netBalance >= 0 ? <TrendingUp className="w-7 h-7 text-mint-600" /> : <TrendingDown className="w-7 h-7 text-red-600" />}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Debt Freedom Progress</h2>
          <button onClick={() => onNavigate('debts')} className="text-navy-600 flex items-center gap-1 text-sm font-medium">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {debts.length === 0 ? (
          <div className="text-center py-6">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No debts tracked yet</p>
            <button onClick={() => onNavigate('debts')} className="bg-navy-600 text-white px-6 py-2 rounded-lg font-medium">
              Add your first debt
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Debt</p>
                <p className="text-2xl font-bold text-gray-900">{money(totalDebt, base)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                <p className="text-2xl font-bold text-gray-900">{money(totalDebtPayment, base)}</p>
              </div>
            </div>
            {topDebts.map((d) => (
              <div key={d.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{d.name}</h3>
                  <span className="text-sm font-medium text-navy-600">{d.interestRate}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{money(convert(d.principal, d.currency || base, base, rates), base)} remaining</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-navy-600 rounded-full h-2" style={{ width: `${debtProgress(d)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => onNavigate('mi')}
        className="w-full text-left bg-gradient-to-r from-mint-600 to-navy-600 rounded-2xl p-6 text-white shadow-lg hover:scale-[1.01] transition-transform">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 p-3 rounded-full"><Sparkles className="w-6 h-6" /></div>
          <div>
            <h3 className="text-lg font-bold">Mi says…</h3>
            <p className="text-sm opacity-90">Your AI financial assistant</p>
          </div>
        </div>
        <p className="text-white/90 leading-relaxed">{insight}</p>
        <div className="flex items-center gap-2 mt-4 text-sm font-medium">
          <span>Chat with Mi</span><ChevronRight className="w-4 h-4" />
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate('transactions')}
          className="bg-navy-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:bg-navy-700">
          <Plus className="w-8 h-8" /><span className="font-semibold">Add Transaction</span>
        </button>
        <button onClick={() => onNavigate('debts')}
          className="bg-mint-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:bg-mint-700">
          <CreditCard className="w-8 h-8" /><span className="font-semibold">Manage Debts</span>
        </button>
      </div>
    </div>
  );
}

function Stat({ title, value, base, icon }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>{icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{money(value, base)}</p>
      <p className="text-xs text-gray-500 mt-1">this month</p>
    </div>
  );
}
