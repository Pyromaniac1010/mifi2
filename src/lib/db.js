import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, query, orderBy, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

const col = (uid, name) => collection(db, 'users', uid, name);
const ref = (uid, name, id) => doc(db, 'users', uid, name, id);

// --- Transactions ---
export function subscribeTransactions(uid, cb) {
  const q = query(col(uid, 'transactions'), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addTransaction = (uid, data) =>
  addDoc(col(uid, 'transactions'), { ...data, date: data.date ?? Date.now() });
export const updateTransaction = (uid, id, data) => updateDoc(ref(uid, 'transactions', id), data);
export const deleteTransaction = (uid, id) => deleteDoc(ref(uid, 'transactions', id));

// --- Debts ---
export function subscribeDebts(uid, cb) {
  const q = query(col(uid, 'debts'), orderBy('interestRate', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addDebt = (uid, data) => addDoc(col(uid, 'debts'), { ...data, initialPrincipal: data.principal });
export const updateDebt = (uid, id, data) => updateDoc(ref(uid, 'debts', id), data);
export const deleteDebt = (uid, id) => deleteDoc(ref(uid, 'debts', id));

// --- Recurring templates (users/{uid}/recurring) ---
export function subscribeRecurring(uid, cb) {
  return onSnapshot(col(uid, 'recurring'), (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addRecurring = (uid, data) => addDoc(col(uid, 'recurring'), { ...data, every: 'month' });
export const updateRecurring = (uid, id, data) => updateDoc(ref(uid, 'recurring', id), data);
export const deleteRecurring = (uid, id) => deleteDoc(ref(uid, 'recurring', id));

// --- Budget (planned/ideated expenses) ---
export function subscribeBudget(uid, cb) {
  return onSnapshot(col(uid, 'budget'), (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addBudgetItem = (uid, data) => addDoc(col(uid, 'budget'), { ...data, date: Date.now() });
export const updateBudgetItem = (uid, id, data) => updateDoc(ref(uid, 'budget', id), data);
export const deleteBudgetItem = (uid, id) => deleteDoc(ref(uid, 'budget', id));

// --- Mi chat messages ---
export function subscribeMessages(uid, cb) {
  const q = query(col(uid, 'messages'), orderBy('ts', 'asc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addMessage = (uid, data) => addDoc(col(uid, 'messages'), { ...data, ts: Date.now() });
export async function clearMessages(uid) {
  const snap = await getDocs(col(uid, 'messages'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

// --- Profile (users/{uid} doc): name, baseCurrency, defaultCurrency, defaultView,
//     personality, themeName, debtStrategy, solvencyCap ---
export function subscribeProfile(uid, cb) {
  return onSnapshot(doc(db, 'users', uid), (snap) => cb(snap.exists() ? snap.data() : {}));
}
export const updateProfile = (uid, data) => setDoc(doc(db, 'users', uid), data, { merge: true });
