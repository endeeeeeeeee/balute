// src/services/categories.js
// CRUD y suscripción de categorías personalizadas por usuario

import { db } from './firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, setDoc, where, limit, getDocs } from 'firebase/firestore';

const path = (uid) => `users/${uid}/categories`;

// Suscripción en tiempo real a categorías del usuario, ordenadas por nombre
export function subscribeToCategories(uid, cb) {
  if (!uid) return () => { };
  const q = query(collection(db, path(uid)), orderBy('name'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(items);
    },
    (error) => {
      console.warn('[subscribeToCategories] snapshot error:', error?.code, error?.message);
      cb([]);
    }
  );
}

// Semilla opcional de categorías por defecto (idempotente sobre nombres)
export async function seedDefaultCategories(uid, names = []) {
  if (!uid || !Array.isArray(names) || names.length === 0) return;
  // Usamos setDoc con ID derivado del nombre para idempotencia simple
  for (const name of names) {
    const id = name.toLowerCase();
    await setDoc(doc(db, path(uid), id), { name });
  }
}

export function addCategory(uid, name) {
  if (!uid) throw new Error('UID requerido');
  return addDoc(collection(db, path(uid)), { name });
}

export function deleteCategory(uid, id) {
  if (!uid) throw new Error('UID requerido');
  return deleteDoc(doc(db, path(uid), id));
}

export const renameCategory = async (userId, categoryId, newName) => {
  const categoryDocRef = doc(db, `users/${userId}/categories/${categoryId}`);
  return updateDoc(categoryDocRef, { name: newName });
};

// Verificar si una categoría está siendo usada por transacciones
export const checkCategoryInUse = async (userId, categoryName) => {
  const transactionsRef = collection(db, `users/${userId}/transactions`);
  const q = query(transactionsRef, where('category', '==', categoryName), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Contar cuántas transacciones usan una categoría
export const countTransactionsWithCategory = async (userId, categoryName) => {
  const transactionsRef = collection(db, `users/${userId}/transactions`);
  const q = query(transactionsRef, where('category', '==', categoryName));
  const snapshot = await getDocs(q);
  return snapshot.size;
};
