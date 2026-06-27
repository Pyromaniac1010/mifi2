import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, query, orderBy, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

const col = (uid, name) => collection(db, 'users', uid, name);
const ref = (uid, name, id) => doc(db, 'users', uid, name, id);

export function subscribeTransactions(uid, cb) {
  const q = query(col(uid, 'transactions'), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addTransaction = (uid, data) =>
  addDoc(col(uid, 'transactions'), { ...data, date: Date.now() });
export const updateTransaction = (uid, id, data) =>
  updateDoc(ref(uid, 'transactions', id), data);
export const deleteTransaction = (uid, id) =>
  deleteDoc(ref(uid, 'transactions', id));

export function subscribeDebts(uid, cb) {
  const q = query(col(uid, 'debts'), orderBy('interestRate', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addDebt = (uid, data) =>
  addDoc(col(uid, 'debts'), { ...data, initialPrincipal: data.principal });
export const updateDebt = (uid, id, data) =>
  updateDoc(ref(uid, 'debts', id), data);
export const deleteDebt = (uid, id) =>
  deleteDoc(ref(uid, 'debts', id));

// --- Budget (ideated / planned expenses) ---
// Lives at users/{uid}/budget. status is 'considering' or 'onhold'.
// Each item carries its own currency, like transactions.
export function subscribeBudget(uid, cb) {
  const q = query(col(uid, 'budget'), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addBudgetItem = (uid, data) =>
  addDoc(col(uid, 'budget'), { ...data, date: Date.now() });
export const updateBudgetItem = (uid, id, data) =>
  updateDoc(ref(uid, 'budget', id), data);
export const deleteBudgetItem = (uid, id) =>
  deleteDoc(ref(uid, 'budget', id));

export function subscribeMessages(uid, cb) {
  const q = query(col(uid, 'messages'), orderBy('ts', 'asc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addMessage = (uid, data) =>
  addDoc(col(uid, 'messages'), { ...data, ts: Date.now() });
// Delete every message in the user's Mi chat history.
export async function clearMessages(uid) {
  const snap = await getDocs(col(uid, 'messages'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export function subscribeProfile(uid, cb) {
  return onSnapshot(doc(db, 'users', uid), (snap) => cb(snap.exists() ? snap.data() : {}));
}
export const setPersonality = (uid, personality) =>
  setDoc(doc(db, 'users', uid), { personality }, { merge: true });
export const setBaseCurrency = (uid, baseCurrency) =>
  setDoc(doc(db, 'users', uid), { baseCurrency }, { merge: true });
// Merge any set of profile settings (name, defaultCurrency, defaultView, personality, baseCurrency).
export const updateProfile = (uid, data) =>
  setDoc(doc(db, 'users', uid), data, { merge: true });
