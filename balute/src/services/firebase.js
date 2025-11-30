import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, getDoc, where, getDocs, deleteDoc, updateDoc, limit, startAfter
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

// Inicializa Firebase y exporta las instancias
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
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

// Obtener el email del admin
export const getAdminEmail = async () => {
  const adminCollectionRef = collection(db, 'adminEmails'); // tu colección correcta
  const snapshot = await getDocs(adminCollectionRef);
  if (!snapshot.empty) {
    return snapshot.docs[0].data().email.trim(); // trim() elimina espacios extra
  }
  console.error("Documento de administrador no encontrado.");
  return null;
};

// Devuelve el UID del primer admin (asumiendo 1 admin) tomando el id del doc en adminEmails
export const getFirstAdminUid = async () => {
  try {
    const adminCollectionRef = collection(db, 'adminEmails');
    const snapshot = await getDocs(adminCollectionRef);
    if (!snapshot.empty) {
      // Los docs tienen id = adminUid según tu estructura
      return snapshot.docs[0].id;
    }
  } catch (e) {
    console.warn('getFirstAdminUid error', e);
  }
  return null;
};


// Verificar si un email es de un viewer
export const isViewer = async (email) => {
  if (!email) return false;
  const normalized = String(email).trim().toLowerCase();
  try {
    const ref = collection(db, 'viewers');
    const q1 = query(ref, where('email', '==', normalized), limit(1));
    const s1 = await getDocs(q1);
    if (!s1.empty) return true;
    // también permitir doc id = email
    const d1 = await getDoc(doc(db, 'viewers', normalized));
    if (d1.exists()) return true;
  } catch (e) {
    console.warn('isViewer: error consultando viewers', e);
  }
  return false;
};

// Obtener datos de un viewer (para encontrar su adminUid)
// getViewerData eliminado (no usado). La fuente de verdad es viewers/{email}

// Suscribirse a las actualizaciones de transacciones (para carga inicial en tiempo real)
export const subscribeToTransactions = (userId, callback) => {
  if (!userId) return () => {}; // Si no hay userId, no hacer nada
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

export const subscribeToViewers = (callback) => {
  const viewersRef = collection(db, 'viewers');
  const q = query(viewersRef, orderBy('email'));

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