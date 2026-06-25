import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, query, orderBy,
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

export function subscribeMessages(uid, cb) {
  const q = query(col(uid, 'messages'), orderBy('ts', 'asc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export const addMessage = (uid, data) =>
  addDoc(col(uid, 'messages'), { ...data, ts: Date.now() });

export function subscribeProfile(uid, cb) {
  return onSnapshot(doc(db, 'users', uid), (snap) => cb(snap.exists() ? snap.data() : {}));
}
export const setPersonality = (uid, personality) =>
  setDoc(doc(db, 'users', uid), { personality }, { merge: true });
