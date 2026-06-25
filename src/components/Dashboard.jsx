import { DollarSign, TrendingUp, TrendingDown, Target, ChevronRight, CreditCard, Plus, Sparkles } from 'lucide-react';
import { computeTotals, computeSolvency, debtProgress } from '../lib/calculations';
import { getMiInsight } from '../lib/mi';

export default function Dashboard({ transactions, debts, personality, onNavigate }) {
  const { activeIncome, passiveIncome, totalIncome, totalExpenses, netBalance } = computeTotals(transactions);
  const totalDebt = debts.reduce((s, d) => s + d.principal, 0);
  const totalDebtPayment = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const solvency = computeSolvency(passiveIncome, totalExpenses, totalDebtPayment);
  const insight = getMiInsight(totalIncome, totalExpenses, debts, personality);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Financial Solvency Score</h2>
          <Target className="w-6 h-6" />
        </div>
        <div className="text-4xl font-bold mb-2">{solvency.toFixed(1)}%</div>
        <div className="w-full bg-white/20 rounded-full h-3 mb-3">
          <div className="bg-white rounded-full h-3 transition-all duration-500" style={{ width: `${Math.min(solvency, 100)}%` }} />
        </div>
        <p className="text-sm opacity-90">
          {solvency >= 100 ? "🎉 You're financially solvent!" : `${(100 - solvency).toFixed(0)}% away from full solvency`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat title="Active Income" value={activeIncome} icon={<TrendingUp className="w-5 h-5 text-green-600" />} />
        <Stat title="Passive Income" value={passiveIncome} icon={<DollarSign className="w-5 h-5 text-purple-600" />} />
        <Stat title="Expenses" value={totalExpenses} icon={<TrendingDown className="w-5 h-5 text-red-600" />} />
      </div>

      <div className={`rounded-2xl p-6 shadow-lg ${netBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Monthly Net Balance</p>
            <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netBalance < 0 ? '-' : ''}${Math.abs(netBalance).toFixed(2)}
            </p>
          </div>
          <div className={`p-3 rounded-full ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            {netBalance >= 0 ? <TrendingUp className="w-7 h-7 text-green-600" /> : <TrendingDown className="w-7 h-7 text-red-600" />}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Debt Freedom Progress</h2>
          <button onClick={() => onNavigate('debts')} className="text-indigo-600 flex items-center gap-1 text-sm font-medium">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {debts.length === 0 ? (
          <div className="text-center py-6">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No debts tracked yet</p>
            <button onClick={() => onNavigate('debts')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium">
              Add your first debt
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Debt</p>
                <p className="text-2xl font-bold text-gray-900">${totalDebt.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                <p className="text-2xl font-bold text-gray-900">${totalDebtPayment.toFixed(2)}</p>
              </div>
            </div>
            {debts.slice(0, 3).map((d) => (
              <div key={d.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{d.name}</h3>
                  <span className="text-sm font-medium text-indigo-600">{d.interestRate}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">${d.principal.toFixed(2)} remaining</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 rounded-full h-2" style={{ width: `${debtProgress(d)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => onNavigate('mi')}
        className="w-full text-left bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:scale-[1.01] transition-transform">
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
          className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-8 h-8" /><span className="font-semibold">Add Transaction</span>
        </button>
        <button onClick={() => onNavigate('debts')}
          className="bg-purple-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:bg-purple-700">
          <CreditCard className="w-8 h-8" /><span className="font-semibold">Manage Debts</span>
        </button>
      </div>
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>{icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">${value.toFixed(2)}</p>
      <p className="text-xs text-gray-500 mt-1">this month</p>
    </div>
  );
}
