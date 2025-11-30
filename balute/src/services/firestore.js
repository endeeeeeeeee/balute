// src/services/firestore.js
// Utilidades para escribir y leer transacciones en Firestore desde el frontend

import { getFirestore, writeBatch, doc, serverTimestamp, collection, getDocs } from 'firebase/firestore';

/**
 * Escribe en batch una lista de transacciones bajo users/{uid}/transactions
 * rows: Array<{ description, amount, type, category? }>
 */
export async function addTransactionsBatch(uid, rows) {
  if (!uid) throw new Error('UID requerido');
  if (!Array.isArray(rows)) throw new Error('rows debe ser un array');

  const db = getFirestore();
  const batch = writeBatch(db);

  rows.forEach((r) => {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const ref = doc(db, 'users', uid, 'transactions', id);
    batch.set(ref, {
      description: String(r.description || ''),
      amount: Number(r.amount || 0),
      type: r.type === 'ingreso' ? 'ingreso' : 'gasto',
      category: r.category || 'Otros',
      // Si viene un timestamp (Date o Timestamp), úsalo; si no, serverTimestamp()
      timestamp: r.timestamp || serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Lee todas las transacciones del usuario actual.
 */
export async function fetchUserTransactions(uid) {
  if (!uid) throw new Error('UID requerido');
  const db = getFirestore();
  const snap = await getDocs(collection(db, 'users', uid, 'transactions'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
