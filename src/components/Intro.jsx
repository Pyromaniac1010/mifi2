import React, { useState } from 'react';
import { Flame, TrendingUp, Route, ChevronRight } from 'lucide-react';

// Shown once, before the login screen, to anyone who has not seen it on this
// device. Four panels, because the point is to say what MiFi is for, not to
// teach the whole app. Anyone who wants to skip can, on every panel.
//
// The "seen" flag is per device and deliberately not in Firestore: someone
// who has not signed in yet has nowhere to store it, and a returning user on
// a new phone seeing it once more is not a problem worth solving.
const SEEN_KEY = 'mifi.intro.seen.v1';

export function introSeen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
export function markIntroSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode, show it again, no harm */ }
}

const PANELS = [
  {
    icon: Flame,
    title: 'Money, honestly',
    body: 'MiFi tracks what comes in, what goes out, and what you owe. No linking your bank, no permissions, nothing leaves your account. You log it, MiFi makes sense of it.',
  },
  {
    icon: TrendingUp,
    title: 'One number that matters',
    body: 'Your solvency score is how much of your monthly obligations your passive income covers. At 100% your salary stops being the thing holding you up. That is the whole goal.',
  },
  {
    icon: Route,
    title: 'See where this is going',
    body: 'Once MiFi has a few months of your real numbers it maps your next two years. When your debt clears. What a purchase actually costs you, in weeks of your life. Move a slider and watch the date move.',
  },
];

export default function Intro({ onDone }) {
  const [i, setI] = useState(0);
  const last = i === PANELS.length - 1;
  const P = PANELS[i];
  const Icon = P.icon;
  const finish = () => { markIntroSeen(); onDone(); };

  return (
    <div className="min-h-screen flex flex-col px-7 py-10" style={{
      background: 'radial-gradient(1100px 700px at 12% -8%, rgba(33,212,224,0.16), transparent 55%), radial-gradient(1000px 800px at 92% 108%, rgba(52,230,164,0.12), transparent 55%), #04111b',
      color: '#eaf7f9',
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none"><path d="M5 30 L13 14 L20 24 L27 11" stroke="#21d4e0" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M27 11 C30 8 35 8 37 5 C35 11 32 14 28 14" fill="#34e6a4" /></svg>
          <span className="text-lg font-bold tracking-tight">MiFi</span>
        </div>
        <button onClick={finish} className="text-sm font-medium px-2 py-1" style={{ color: '#9bc1c9' }}>Skip</button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-7" style={{ background: 'rgba(33,212,224,0.12)', border: '1px solid rgba(33,212,224,0.3)' }}>
          <Icon className="w-8 h-8" style={{ color: '#5fe9f1' }} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-4">{P.title}</h1>
        <p className="text-base leading-relaxed" style={{ color: '#cfe7ec' }}>{P.body}</p>
      </div>

      <div className="max-w-sm mx-auto w-full">
        <div className="flex gap-1.5 mb-5">
          {PANELS.map((_, n) => (
            <span key={n} className="h-1 rounded-full flex-1 transition-all" style={{ background: n <= i ? '#21d4e0' : 'rgba(255,255,255,0.12)' }} />
          ))}
        </div>
        <button
          onClick={() => (last ? finish() : setI(i + 1))}
          className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg,#5fe9f1,#21d4e0)', color: '#03121a', boxShadow: '0 0 24px rgba(33,212,224,0.32)' }}
        >
          {last ? 'Get started' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
