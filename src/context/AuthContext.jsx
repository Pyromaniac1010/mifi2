import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isNative } from '../lib/native';
import { nativeGoogleSignIn, nativeGoogleReauth, nativeSignOut } from '../lib/googleAuth';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoading(false);
  }), []);
  const value = {
    user,
    loading,
    login: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    signup: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),
    // The popup works in a browser. In the app it is blocked by Google, so
    // the native account picker is used instead.
    loginWithGoogle: () => (isNative() ? nativeGoogleSignIn() : signInWithPopup(auth, new GoogleAuthProvider())),
    logout: async () => { await nativeSignOut(); return signOut(auth); },
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    reauth: (pw) => reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, pw)),
    reauthGoogle: () => (isNative() ? nativeGoogleReauth() : reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider())),
    deleteAccount: () => deleteUser(auth.currentUser),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
