import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password);
    } catch (err) {
      setError(prettyError(err.code) || err.message);
    } finally { setBusy(false); }
  };

  const google = async () => {
    setError('');
    try { await loginWithGoogle(); }
    catch (err) { setError(prettyError(err.code) || err.message); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <DollarSign className="text-indigo-600 w-10 h-10" />
          <h1 className="text-3xl font-bold text-gray-900">MiFi</h1>
        </div>
        <p className="text-center text-gray-600 mb-6">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>

        {error && <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg p-3">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="At least 6 characters" />
          </div>
          <button type="submit" disabled={busy}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-gray-400 text-sm">
          <div className="h-px bg-gray-200 flex-1" /> or <div className="h-px bg-gray-200 flex-1" />
        </div>

        <button onClick={google}
          className="w-full border border-gray-300 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="text-indigo-600 font-medium">
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

function prettyError(code) {
  return {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  }[code];
}
