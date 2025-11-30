import React, { useState, useEffect, useRef, useCallback } from 'react';

// Componentes
import LoginForm from './components/LoginForm';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import ViewerManagement from './components/ViewerManagement';
import Statistics from './components/Statistics';
import NavBar from './components/NavBar';
import SettingsDrawer from './components/SettingsDrawer';
import CategoryManager from './components/CategoryManager';
import CsvImporter from './components/CsvImporter.jsx';
import BudgetGauge from './components/BudgetGauge';
import AppLayout from './components/layout/AppLayout.jsx';
import AddTransactionButton from './components/AddTransactionButton';
import Modal from './components/Modal';
import BalanceCard from './components/BalanceCard';

// Servicios Firebase
import * as firebase from './services/firebase';
import { subscribeToCategories } from './services/categories';


function App() {
  // --- Estados ---
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [dataOwnerId, setDataOwnerId] = useState(null); // NUEVO: ID del dueño de los datos a mostrar
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [categories, setCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [editingTransaction, setEditingTransaction] = useState(null);



  // UI State (tabs/settings)
  const [tab, setTab] = useState('dashboard'); // dashboard | historial | stats | opt
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState(0);

  const [txModalOpen, setTxModalOpen] = useState(false);

  // --- Ref para cancelar listener ---
  const unsubscribeTransactionsRef = useRef(null);

  // --- Autenticación, roles y resolución del dueño de los datos ---
  useEffect(() => {

    const unsubscribeAuth = firebase.onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      setIsLoading(true); // Empezamos a cargar

      if (currentUser) {
        const userProfile = await firebase.getUserProfile(currentUser.uid);
        const fetchedRole = userProfile.exists() ? userProfile.data().role?.toLowerCase() : null;
        setRole(fetchedRole);

        if (fetchedRole === 'admin') {
          // Si es admin, el dueño de los datos es él mismo
          setDataOwnerId(currentUser.uid);
        } else if (fetchedRole === 'viewer') {
          // Si es viewer, intentamos usar ownerUid del perfil; si falta, reparamos desde viewers/{email}
          let ownerUid = userProfile.data()?.ownerUid || null;
          if (!ownerUid) {
            const email = userProfile.data()?.email || currentUser.email;
            try {
              let foundOwner = await firebase.getViewerOwnerUidByEmail(email);
              if (!foundOwner) {
                // Fallback: primer admin conocido
                foundOwner = await firebase.getFirstAdminUid();
              }
              if (foundOwner) {
                await firebase.updateUserProfile(currentUser.uid, { ownerUid: foundOwner });
                ownerUid = foundOwner;
              }
            } catch (e) {
              console.warn('No se pudo reparar ownerUid del viewer', e);
            }
          }
          if (ownerUid) setDataOwnerId(String(ownerUid));
          else {
            showNotification('Error: Falta ownerUid en el perfil del viewer.', 'error');
            setDataOwnerId(null);
          }
        } else {
          // Rol no reconocido o sin rol
          setDataOwnerId(null);
        }
      } else {
        // No hay usuario logueado
        setRole(null);
        setDataOwnerId(null);
      }
      setIsLoading(false); // Terminamos de cargar
    });

    return () => unsubscribeAuth();
  }, []);


  // --- Escucha transacciones y categorías en tiempo real ---
  // (movido más abajo para que calculateBalance ya esté definido)

  // --- Funciones auxiliares ---
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  // Parseo robusto de montos: acepta número o string (con coma o punto)
  const getAmount = useCallback((tOrValue) => {
    let v = tOrValue;
    if (v && typeof v === 'object') v = v.amount; // soporte objeto transacción
    if (v === undefined || v === null) return 0;
    let s = String(v).trim();
    // Normaliza: quitar espacios, cambiar coma por punto, eliminar caracteres no numéricos
    s = s.replace(/\s+/g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
    // Mantener solo un punto decimal
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) {
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    }
    let n = Number(s);
    if (!Number.isFinite(n)) return 0;
    // Siempre guardar como valor positivo; el signo lo define type (ingreso/gasto)
    n = Math.abs(n);
    return n;
  }, []);

  const calculateBalance = useCallback((txns) => {
    const total = txns.reduce((sum, t) => {
      const amt = getAmount(t);
      if (String(t?.type || '').toLowerCase().trim() === 'ingreso') return sum + amt;
      if (String(t?.type || '').toLowerCase().trim() === 'gasto') return sum - amt;
      return sum;
    }, 0);
    setBalance(total);
  }, [getAmount]);

  // --- Escucha transacciones y categorías en tiempo real ---
  useEffect(() => {
    // Si ya hay una suscripción, la cancelamos primero
    if (unsubscribeTransactionsRef.current) {
      unsubscribeTransactionsRef.current();
    }

    if (dataOwnerId) {
      // Suscripción a transacciones
      const unsubTx = firebase.subscribeToTransactions(dataOwnerId, (newTransactions) => {
        // Debug: log last transaction seen and its amount
        if (newTransactions && newTransactions.length > 0) {
          const last = newTransactions[0];
          console.debug('[SNAPSHOT] last tx', { id: last.id, amount: last.amount, type: last.type, desc: last.description });
        }
        setTransactions(newTransactions);
        calculateBalance(newTransactions);
      });

      // Suscripción a categorías del mismo dueño
      const unsubCats = subscribeToCategories(dataOwnerId, setCategories);

      // Guardar limpieza combinada
      unsubscribeTransactionsRef.current = () => {
        if (typeof unsubTx === 'function') unsubTx();
        if (typeof unsubCats === 'function') unsubCats();
      };
    } else {
      // Si no hay dueño de los datos, limpiamos
      setTransactions([]);
      setBalance(0);
      setCategories([]);
    }

    return () => {
      if (unsubscribeTransactionsRef.current) {
        unsubscribeTransactionsRef.current();
        unsubscribeTransactionsRef.current = null;
      }
    };
  }, [dataOwnerId, calculateBalance]);

  const toDateSafe = (ts) => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (typeof ts?.toDate === 'function') return ts.toDate(); // Firestore Timestamp
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  };

  const totalSpentThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return transactions
      .filter(t => {
        if (t.type !== 'gasto') return false;
        const d = toDateSafe(t.timestamp);
        return d && d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((acc, t) => acc + getAmount(t), 0);
  };

  // --- Manejo de autenticación ---
  // --- Manejo de autenticación ---
  const handleSignUp = async (email, password) => {
    try {
      // Lógica Multi-Usuario:
      // 1. Si está en la lista de viewers, es viewer.
      // 2. Si no, es un nuevo Admin (crea su propia cuenta).
      let newRole = 'admin';
      if (await firebase.isViewer(email)) {
        newRole = 'viewer';
      }

      const userCredential = await firebase.signUp(email, password);

      if (newRole === 'viewer') {
        let ownerUid = await firebase.getViewerOwnerUidByEmail(email);
        if (!ownerUid) {
          // Fallback: si no está en viewers, usar el primer admin registrado
          ownerUid = await firebase.getFirstAdminUid();
        }
        if (!ownerUid) {
          showNotification('Error: No se pudo asignar owner al viewer. Contacta al administrador.', 'error');
          return;
        }
        await firebase.createUserProfile(userCredential.user.uid, { role: newRole, email, ownerUid });
      } else {
        // Nuevo Admin: crea su perfil independiente
        await firebase.createUserProfile(userCredential.user.uid, { role: newRole, email });
      }

      setIsSigningUp(false);
      showNotification(`¡Registro exitoso! Bienvenido a tu cuenta (${newRole}).`, 'success');
    } catch (error) {
      console.error("Error al registrarse:", error);
      showNotification(`Error al registrarse: ${error.message}`, 'error');
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      await firebase.signIn(email, password);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      showNotification(`Error al iniciar sesión: ${error.message}`, 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await firebase.logOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      showNotification('Error al cerrar sesión.', 'error');
    }
  };

  // --- Manejo de transacciones ---
  const handleAddTransaction = async (transactionData) => {
    if (role !== 'admin' || !dataOwnerId) {
      showNotification('No tienes permiso para agregar transacciones.', 'error');
      return;
    }
    try {
      // Debug: ver qué llega y cómo se parsea
      console.debug('[ADD] raw amount=', transactionData.amount, 'parsed=', getAmount(transactionData.amount));
      await firebase.addTransaction(dataOwnerId, {
        ...transactionData,
        amount: Math.round(getAmount(transactionData.amount) * 100) / 100,
        timestamp: new Date(),
      });
      showNotification('Transacción agregada con éxito', 'success');
    } catch (e) {
      console.error("Error al agregar documento: ", e);
      showNotification('Hubo un error al guardar la transacción.', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (role !== 'admin' || !dataOwnerId) {
      showNotification('No tienes permiso para eliminar transacciones.', 'error');
      return;
    }
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;

    try {
      await firebase.deleteTransaction(dataOwnerId, id);
      showNotification('Transacción eliminada con éxito.', 'success');
    } catch (error) {
      console.error("Error al eliminar la transacción:", error);
      showNotification('Error al eliminar la transacción.', 'error');
    }
  };

  const handleStartEdit = (transaction) => setEditingTransaction(transaction);

  const handleUpdateTransaction = async (updatedData) => {
    if (role !== 'admin' || !dataOwnerId) {
      showNotification('No tienes permiso para editar transacciones.', 'error');
      return;
    }
    try {
      const { id, ...dataToUpdate } = updatedData;
      console.debug('[UPDATE] raw amount=', dataToUpdate.amount, 'parsed=', getAmount(dataToUpdate.amount));
      const parsed = { ...dataToUpdate, amount: Math.round(getAmount(dataToUpdate.amount) * 100) / 100 };
      await firebase.updateTransaction(dataOwnerId, id, parsed);
      showNotification('Transacción actualizada con éxito.', 'success');
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error al actualizar la transacción:", error);
      showNotification('Error al actualizar la transacción.', 'error');
    }
  };



  // --- Renderizado ---
  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-900 text-white text-2xl">Cargando...</div>;

  if (!user) return (
    <LoginForm
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      isSigningUp={isSigningUp}
      setIsSigningUp={setIsSigningUp}
      notification={notification}
    />
  );

  return (
    <AppLayout title="Control de Finanzas" notification={notification} onSignOut={handleSignOut}>
      {/* Contenedor principal de tarjetas por pestaña */}
      <div className="w-full max-w-lg pb-28 md:pb-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 7rem)' }}>
        {/* Admin quick tools (arriba) */}
        {/* (El formulario se abrirá en un modal vía FAB) */}

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl mb-6">
            <BalanceCard balance={balance} />
            <div className="mt-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-sm text-gray-400 md:order-1 md:mr-2">Meta mensual</label>
                <input
                  type="number"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(Number(e.target.value) || 0)}
                  placeholder="Objetivo mensual ($)"
                  className="w-full md:flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </div>
              <BudgetGauge spent={totalSpentThisMonth()} goal={monthlyGoal} />
            </div>
          </div>
        )}

        {/* Historial */}
        {tab === 'historial' && (
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl mb-6">
            <TransactionList
              transactions={transactions}
              role={role}
              onDelete={handleDeleteTransaction}
              onEdit={(tx) => { handleStartEdit(tx); setTxModalOpen(true); }}
            />
          </div>
        )}

        {/* Estadísticas completas con filtros y resumen por categoría */}
        {tab === 'stats' && (
          <Statistics transactions={transactions} />
        )}



        {/* Barra de navegación inferior */}
        <NavBar
          tab={tab}
          onChange={setTab}
          onOpenSettings={role === 'admin' ? () => setSettingsOpen(true) : undefined}
        />

        {/* FAB central para admins */}
        {role === 'admin' && (
          <AddTransactionButton onClick={() => { setEditingTransaction(null); setTxModalOpen(true); }} />
        )}
      </div>

      {/* Drawer de ajustes solo para admin */}
      <SettingsDrawer open={settingsOpen && role === 'admin'} onClose={() => setSettingsOpen(false)} title="Ajustes">
        <div className="space-y-6">
          <div className="hidden md:block">
            <h4 className="font-semibold mb-2">Importar CSV</h4>
            <CsvImporter />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Categorías</h4>
            <CategoryManager />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Gestión de espectadores</h4>
            <ViewerManagement />
          </div>
        </div>
      </SettingsDrawer>

      {/* Modal para agregar/editar transacciones */}
      <Modal open={txModalOpen} onClose={() => setTxModalOpen(false)} title={editingTransaction ? 'Editar transacción' : 'Nueva transacción'}>
        <TransactionForm
          onAddTransaction={async (data) => { await handleAddTransaction(data); setTxModalOpen(false); }}
          onUpdateTransaction={async (data) => { await handleUpdateTransaction(data); setTxModalOpen(false); }}
          transactionToEdit={editingTransaction}
          onCancelEdit={() => { setEditingTransaction(null); setTxModalOpen(false); }}
          categories={(categories || []).map(c => c.name)}
        />
      </Modal>
    </AppLayout>
  );

}

export default App;