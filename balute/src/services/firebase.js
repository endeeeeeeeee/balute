import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, getDoc, where, getDocs, deleteDoc, updateDoc, limit, startAfter, initializeFirestore, persistentLocalCache, persistentMultipleTabManager
} from 'firebase/firestore';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from 'firebase/auth';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializa Firebase y exporta las instancias con la configuración de persistencia correcta para evitar warnings
const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);

// --- SERVICIOS DE AUTENTICACIÓN ---

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logOut = () => {
  return signOut(auth);
};

// --- SERVICIOS DE FIRESTORE ---

// Obtener datos del usuario (rol)
export const getUserProfile = (uid) => {
  const userDocRef = doc(db, `users/${uid}`);
  return getDoc(userDocRef);
};

// Crear el perfil de un usuario nuevo
export const createUserProfile = (uid, data) => {
  const userDocRef = doc(db, `users/${uid}`);
  return setDoc(userDocRef, data);
};

// Actualizar (merge) el perfil de usuario
export const updateUserProfile = (uid, data) => {
  const userDocRef = doc(db, `users/${uid}`);
  return setDoc(userDocRef, data, { merge: true });
};

// ELIMINADO: getAdminEmail() - Ya no se usa colección adminEmails

// ELIMINADO: getFirstAdminUid() - Causaba bug donde todos veían datos del primer admin


// ELIMINADO: isViewer() - Viewers ya no se auto-registran, solo por invitación

// Obtener datos de un viewer (para encontrar su adminUid)
// getViewerData eliminado (no usado). La fuente de verdad es viewers/{email}

// Suscribirse a las actualizaciones de transacciones (para carga inicial en tiempo real)
export const subscribeToTransactions = (userId, callback) => {
  if (!userId) return () => { }; // Si no hay userId, no hacer nada
  const transactionsPath = `users/${userId}/transactions`;
  // Escuchar todas las transacciones ordenadas por fecha (sin límite)
  const q = query(collection(db, transactionsPath), orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const newTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(newTransactions);
  });
};

// **NUEVA FUNCIÓN** para paginación y filtrado por fecha
export const fetchTransactionsByDay = async (userId, startDate, endDate, pageLimit, lastDoc = null) => {
  if (!userId) {
    return { items: [], nextCursor: null };
  }

  const transactionsPath = `users/${userId}/transactions`;
  const transactionsRef = collection(db, transactionsPath);

  // Construimos la consulta base
  const queryConstraints = [
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    orderBy('timestamp', 'desc'),
    limit(pageLimit)
  ];

  // Añadimos el cursor para paginación si existe
  if (lastDoc) {
    queryConstraints.push(startAfter(lastDoc));
  }

  const q = query(transactionsRef, ...queryConstraints);

  try {
    const documentSnapshots = await getDocs(q);

    const items = documentSnapshots.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    // El nuevo cursor será el último documento de esta página
    const nextCursor = documentSnapshots.docs.length === pageLimit
      ? documentSnapshots.docs[documentSnapshots.docs.length - 1]
      : null;

    return { items, nextCursor };
  } catch (error) {
    console.error("Error fetching transactions by day:", error);
    return { items: [], nextCursor: null };
  }
};


// Agregar una nueva transacción
export const addTransaction = (userId, transactionData) => {
  const transactionsPath = `users/${userId}/transactions`;
  return addDoc(collection(db, transactionsPath), transactionData);
};

// Borrar una transacción
export const deleteTransaction = (userId, transactionId) => {
  const transactionDocRef = doc(db, `users/${userId}/transactions/${transactionId}`);
  return deleteDoc(transactionDocRef);
};

// Actualizar una transacción
export const updateTransaction = (userId, transactionId, data) => {
  const transactionDocRef = doc(db, `users/${userId}/transactions/${transactionId}`);
  return updateDoc(transactionDocRef, data);
};

// --- GESTIÓN DE VIEWERS ---

// Suscribirse a viewers del admin actual (filtrado por ownerUid)
export const subscribeToViewers = (adminUid, callback) => {
  if (!adminUid) {
    callback([]);
    return () => { };
  }

  const viewersRef = collection(db, 'viewers');
  // Filtrar solo viewers cuyo ownerUid coincida con el admin actual
  const q = query(viewersRef, where('ownerUid', '==', adminUid), orderBy('email'));

  return onSnapshot(q, (snapshot) => {
    const viewers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(viewers);
  });
};

export const addViewer = async (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) throw new Error('Email vacío');
  const ref = doc(db, 'viewers', normalized);
  // merge:true evita duplicados si existe y permite actualizar
  const ownerUid = auth?.currentUser?.uid || null;
  await setDoc(ref, { email: normalized, ownerUid }, { merge: true });
  return { id: normalized };
};

export const removeViewer = (id) => {
  const viewerDocRef = doc(db, 'viewers', id);
  return deleteDoc(viewerDocRef);
};

// Obtener ownerUid de un viewer por email (normaliza ID y también prueba por query)
export const getViewerOwnerUidByEmail = async (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;
  try {
    // Intento 1: documento con ID = email
    const d1 = await getDoc(doc(db, 'viewers', normalized));
    if (d1.exists()) {
      return d1.data()?.ownerUid || null;
    }
    // Intento 2: búsqueda por campo email
    const ref = collection(db, 'viewers');
    const q1 = query(ref, where('email', '==', normalized), limit(1));
    const s1 = await getDocs(q1);
    if (!s1.empty) {
      return s1.docs[0]?.data()?.ownerUid || null;
    }
  } catch (e) {
    console.warn('getViewerOwnerUidByEmail error', e);
  }
  return null;
};

// Obtener todas las billeteras disponibles para un usuario (propia + compartidas)
export const getAvailableWallets = async (userUid, userEmail) => {
  const wallets = [];

  try {
    // 1. Siempre agregar billetera propia
    const userDoc = await getDoc(doc(db, `users/${userUid}`));
    if (userDoc.exists()) {
      wallets.push({
        id: userUid,
        name: 'Mi Billetera',
        ownerEmail: userEmail,
        isOwner: true
      });
    }

    // 2. Buscar billeteras compartidas (donde soy viewer)
    const viewersRef = collection(db, 'viewers');
    const normalized = String(userEmail).trim().toLowerCase();
    const q = query(viewersRef, where('email', '==', normalized));
    const snapshot = await getDocs(q);

    for (const viewerDoc of snapshot.docs) {
      const data = viewerDoc.data();
      const ownerUid = data.ownerUid;

      // Obtener info del dueño
      const ownerDoc = await getDoc(doc(db, `users/${ownerUid}`));
      if (ownerDoc.exists()) {
        const ownerData = ownerDoc.data();
        wallets.push({
          id: ownerUid,
          name: `Billetera de ${ownerData.email || 'Usuario'}`,
          ownerEmail: ownerData.email,
          isOwner: false
        });
      }
    }



    return wallets;
  } catch (error) {
    console.error('Error obteniendo billeteras:', error);
    return wallets; // Retornar al menos la billetera propia
  }
};

// --- NUEVAS FUNCIONES PARA SISTEMA MODERNO DE VIEWERS ---

// Buscar usuario por email (para verificar si existe antes de compartir)
export const findUserByEmail = async (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalized), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      return {
        uid: userDoc.id,
        ...userDoc.data()
      };
    }
  } catch (e) {
    console.warn('findUserByEmail error', e);
  }
  return null;
};

// Compartir billetera con otro usuario (convertirlo en viewer)
export const shareWalletWithUser = async (targetUserUid, ownerUid) => {

  if (!targetUserUid || !ownerUid) {
    throw new Error('Se requieren targetUserUid y ownerUid');
  }

  try {
    // Obtener email del usuario objetivo
    const targetUserDoc = await getDoc(doc(db, `users/${targetUserUid}`));

    if (!targetUserDoc.exists()) {
      throw new Error('Usuario objetivo no encontrado');
    }

    const targetEmail = targetUserDoc.data().email;

    // Crear entrada en viewers
    const normalized = String(targetEmail).trim().toLowerCase();
    await setDoc(doc(db, 'viewers', normalized), {
      email: normalized,
      ownerUid: ownerUid,
      sharedAt: new Date()
    });

    // NOTA: No actualizamos el documento del usuario aquí porque no tenemos permisos.
    // El usuario detectará automáticamente que es viewer cuando inicie sesión
    // al verificar la colección viewers en getViewerOwnerUidByEmail()

    return { success: true };
  } catch (error) {
    console.error('Error en shareWalletWithUser:', error);
    throw error;
  }
};

// Dejar de compartir billetera (revertir viewer a admin)
export const unshareWalletWithUser = async (targetUserUid) => {

  if (!targetUserUid) {
    throw new Error('Se requiere targetUserUid');
  }

  try {
    // Obtener email del usuario
    const targetUserDoc = await getDoc(doc(db, `users/${targetUserUid}`));
    if (!targetUserDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const targetEmail = targetUserDoc.data().email;
    const normalized = String(targetEmail).trim().toLowerCase();

    // Eliminar de viewers
    await deleteDoc(doc(db, 'viewers', normalized));

    // NOTA: No actualizamos el documento del usuario aquí porque no tenemos permisos.
    // El usuario volverá a ser admin automáticamente cuando inicie sesión
    // al no encontrar su email en la colección viewers

    return { success: true };
  } catch (error) {
    console.error('Error en unshareWalletWithUser:', error);
    throw error;
  }
};
