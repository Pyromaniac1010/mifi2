import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function prettyError(code) {
  const map = {
    'auth/invalid-email': 'That email address looks off.',
    'auth/user-not-found': 'No account with that email.',
    'auth/wrong-password': 'Wrong password.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'That email already has an account. Try signing in.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
    'auth/too-many-requests': 'Too many tries. Wait a moment and retry.',
  };
  return map[code] || 'Something went wrong. Try again.';
}

export default function Login() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(null);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    try {
      if (mode === 'signin') await login(email.trim(), password);
      else await signup(email.trim(), password);
    } catch (e) {
      setError(prettyError(e?.code));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(''); setBusy(true);
    try { await loginWithGoogle(); }
    catch (e) { setError(prettyError(e?.code)); }
    finally { setBusy(false); }
  };

  const accent = '#21d4e0', accentBright = '#5fe9f1', pos = '#34e6a4';
  const textMain = '#eaf7f9', textMute = '#9bc1c9', textFaint = '#5d818c';
  const inputBg = 'rgba(4,17,27,0.5)', inputBorder = 'rgba(120,200,210,0.18)';
  const pageBg = 'radial-gradient(1100px 700px at 12% -8%, rgba(33,212,224,0.16), transparent 55%), radial-gradient(1000px 800px at 92% 108%, rgba(52,230,164,0.12), transparent 55%), radial-gradient(700px 700px at 50% 50%, rgba(138,108,255,0.10), transparent 60%), #04111b';
  const card = { background: 'rgba(8,22,31,0.66)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(33,212,224,0.16)', boxShadow: '0 24px 60px rgba(0,0,0,0.55)' };
  const field = (name) => ({ background: inputBg, border: `1px solid ${focused === name ? accent : inputBorder}`, color: textMain, boxShadow: focused === name ? '0 0 0 3px rgba(33,212,224,0.15)' : 'none', transition: 'border-color .15s, box-shadow .15s' });

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative" style={{ background: pageBg, color: textMain }}>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'radial-gradient(rgba(120,200,210,0.16) 1px, transparent 1.4px)', backgroundSize: '26px 26px', WebkitMaskImage: 'radial-gradient(820px 820px at 50% 42%, #000 0%, transparent 72%)', maskImage: 'radial-gradient(820px 820px at 50% 42%, #000 0%, transparent 72%)', opacity: 0.5 }} />

      <div className="w-full max-w-sm rounded-3xl p-7 relative" style={{ ...card, zIndex: 1 }}>
        <div className="flex flex-col items-center mb-7">
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(140deg,#21d4e0,#0b8f9b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 26px rgba(33,212,224,0.45)', marginBottom: 14 }}>
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none"><path d="M6 30 L13 15 L20 24 L27 12" stroke="#03121a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M27 12 C30 9 35 9 37 6 C35 12 32 15 28 15" fill="#eafff6" /></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MiFi</h1>
          <p className="text-sm mt-1" style={{ color: textMute }}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5 px-1" style={{ color: textMute }}>Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="you@example.com" autoComplete="email"
              className="w-full px-4 py-3 rounded-xl outline-none" style={field('email')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 px-1" style={{ color: textMute }}>Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={mode === 'signin' ? 'Your password' : 'At least 6 characters'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="w-full px-4 py-3 rounded-xl outline-none" style={field('password')}
            />
          </div>

          {error && <p className="text-sm px-1" style={{ color: '#ff6f86' }}>{error}</p>}

          <button
            onClick={submit} disabled={busy}
            className="w-full py-3 rounded-xl font-semibold transition-opacity disabled:opacity-60"
            style={{ background: `linear-gradient(135deg,${accentBright},${accent})`, color: '#03121a', boxShadow: '0 0 24px rgba(33,212,224,0.32)' }}
          >
            {busy ? 'Just a sec\u2026' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1" style={{ background: inputBorder }} />
            <span className="text-xs" style={{ color: textFaint }}>or</span>
            <div className="h-px flex-1" style={{ background: inputBorder }} />
          </div>

          <button
            onClick={google} disabled={busy}
            className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textMain }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.45 14.97.5 12 .5A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 4.75z"/></svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: textMute }}>
          {mode === 'signin' ? "No account yet? " : 'Already have one? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="font-semibold" style={{ color: accentBright }}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
