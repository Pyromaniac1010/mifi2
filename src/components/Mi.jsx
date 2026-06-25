import { useState, useRef, useEffect } from 'react';
import { Settings, Send } from 'lucide-react';
import { addMessage, setPersonality } from '../lib/db';
import { PERSONALITIES, generateMiResponse } from '../lib/mi';
import { computeTotals } from '../lib/calculations';

const STARTERS = [
  'How am I doing financially?',
  'Should I focus on debt or savings?',
  'How can I increase my passive income?',
];

export default function Mi({ uid, transactions, debts, messages, personality }) {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const endRef = useRef(null);
  const p = PERSONALITIES[personality] || PERSONALITIES.genZ;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');
    const totals = computeTotals(transactions);
    const reply = generateMiResponse(msg, { ...totals, debts }, personality);
    await addMessage(uid, { sender: 'user', text: msg });
    await addMessage(uid, { sender: 'mi', text: reply });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="bg-white rounded-t-2xl shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${p.color} p-3 rounded-full text-white text-2xl leading-none`}>{p.emoji}</div>
          <div><h2 className="text-xl font-bold text-gray-900">Mi</h2><p className="text-sm text-gray-600">{p.name}</p></div>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-100 rounded-lg"><Settings className="w-6 h-6 text-gray-600" /></button>
      </div>

      {showSettings && (
        <div className="bg-white border-b p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Choose Mi's personality</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PERSONALITIES).map(([key, val]) => (
              <button key={key} onClick={() => { setPersonality(uid, key); setShowSettings(false); }}
                className={`p-3 rounded-lg border-2 text-left ${personality === key ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                <div className="text-2xl mb-1">{val.emoji}</div>
                <div className="text-sm font-medium text-gray-900">{val.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <div className={`bg-gradient-to-r ${p.color} w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4`}>{p.emoji}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hey! I'm Mi 👋</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Your personal AI financial assistant. Ask me anything about your money.</p>
            <div className="grid gap-2 max-w-md mx-auto">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="bg-white p-3 rounded-lg shadow-sm text-left hover:shadow-md">
                  <p className="text-sm font-medium text-gray-900">{s}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl whitespace-pre-wrap ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white shadow text-gray-900 rounded-bl-none'}`}>
                {m.text}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="bg-white rounded-b-2xl shadow p-4">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Mi anything…"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700"><Send className="w-6 h-6" /></button>
        </form>
      </div>
    </div>
  );
}
