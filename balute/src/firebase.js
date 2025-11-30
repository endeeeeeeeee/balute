// src/firebase.js

// Importa las funciones necesarias del SDK de Firebase.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase que obtuviste de la consola.
// ⚠️  ADVERTENCIA: Nunca hardcodees credenciales reales en el código fuente
// Usa variables de entorno para mantener la seguridad
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializa Firebase en tu aplicación.
const app = initializeApp(firebaseConfig);

// Inicializa Firestore y obtén una referencia a la base de datos.
const db = getFirestore(app);

// Exporta la instancia de la base de datos para que puedas usarla en otros archivos.
export { db };
