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
import AppLayout from './components/layout/AppLayout.jsx';
import AddTransactionButton from './components/AddTransactionButton';
import Modal from './components/Modal';
import BalanceCard from './components/BalanceCard';
import WalletSelector from './components/WalletSelector';

// Servicios Firebase
import * as firebase from './services/firebase';
import { subscribeToCategories } from './services/categories';


function App() {
  // --- Estado de autenticación y billeteras ---
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]); // Array de billeteras disponibles
  const [activeWalletId, setActiveWalletId] = useState(null); // ID de billetera activa

  // Helper: ¿Puede editar la billetera activa?
  const canEdit = wallets.find(w => w.id === activeWalletId)?.isOwner ?? false;

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

        // Si el usuario NO tiene perfil, crearlo como admin
        if (!userProfile.exists()) {
          await firebase.createUserProfile(currentUser.uid, {
            role: 'admin',
            email: currentUser.email
          });
          // Las billeteras se cargarán automáticamente después
          setIsLoading(false);
          return;
        }

        // Cargar todas las billeteras disponibles (propia + compartidas)
        const availableWallets = await firebase.getAvailableWallets(currentUser.uid, currentUser.email);
        setWallets(availableWallets);

        // Establecer billetera activa (por defecto, la propia)
        if (availableWallets.length > 0) {
          setActiveWalletId(currentUser.uid); // Siempre empezar con tu billetera
        }
      } else {
        // No hay usuario logueado
        setWallets([]);
        setActiveWalletId(null);
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

    if (activeWalletId) {
      // Suscripción a transacciones
      const unsubTx = firebase.subscribeToTransactions(activeWalletId, (newTransactions) => {
        // Debug: log last transaction seen and its amount
        setTransactions(newTransactions);
        calculateBalance(newTransactions);
      });

      // Suscripción a categorías del mismo dueño
      const unsubCats = subscribeToCategories(activeWalletId, setCategories);

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
  }, [activeWalletId, calculateBalance]);

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
  const handleSignUp = async (email, password) => {
    try {
      // NUEVO MODELO: Todos los usuarios se registran como admins independientes
      // Viewers solo se crean por invitación explícita del admin
      const userCredential = await firebase.signUp(email, password);

      // Crear perfil como admin independiente
      await firebase.createUserProfile(userCredential.user.uid, {
        role: 'admin',
        email
      });

      setIsSigningUp(false);
      showNotification('¡Cuenta creada! Bienvenido a tu billetera personal.', 'success');
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
    if (!canEdit || !activeWalletId) {
      showNotification('No tienes permiso para agregar transacciones.', 'error');
      return;
    }
    try {
      // Debug: ver qué llega y cómo se parsea
      await firebase.addTransaction(activeWalletId, {
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
    if (!canEdit || !activeWalletId) {
      showNotification('No tienes permiso para eliminar transacciones.', 'error');
      return;
    }
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;

    try {
      await firebase.deleteTransaction(activeWalletId, id);
      showNotification('Transacción eliminada con éxito.', 'success');
    } catch (error) {
      console.error("Error al eliminar la transacción:", error);
      showNotification('Error al eliminar la transacción.', 'error');
    }
  };

  const handleStartEdit = (transaction) => setEditingTransaction(transaction);

  const handleUpdateTransaction = async (updatedData) => {
    if (!canEdit || !activeWalletId) {
      showNotification('No tienes permiso para editar transacciones.', 'error');
      return;
    }
    try {
      const { id, ...dataToUpdate } = updatedData;
      const parsed = { ...dataToUpdate, amount: Math.round(getAmount(dataToUpdate.amount) * 100) / 100 };
      await firebase.updateTransaction(activeWalletId, id, parsed);
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
    <AppLayout notification={notification}>
      {/* Header Responsive */}
      <header className="bg-gray-800/80 backdrop-blur-md shadow-lg sticky top-0 z-10 w-full max-w-xl mx-auto rounded-b-xl border-x border-b border-gray-700/50 mb-4">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Mis Finanzas
            </h1>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white py-1.5 px-3 rounded-full transition-all"
            >
              Salir
            </button>
          </div>

          {/* Info usuario y Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-gray-400 px-1 bg-gray-900/50 py-1 rounded-md inline-block self-start sm:self-auto">
              <span className="text-gray-500 mr-1">Usuario:</span> <span className="text-blue-300 font-medium">{user.email}</span>
            </div>
            <div className="w-full sm:w-auto">
              <WalletSelector
                wallets={wallets}
                activeWalletId={activeWalletId}
                onWalletChange={setActiveWalletId}
              />
            </div>
          </div>
        </div>
      </header>
      {/* Contenedor principal de tarjetas por pestaña */}
      {/* Contenedor principal de tarjetas por pestaña - Aumentado padding bottom */}
      <div className="w-full max-w-xl mx-auto mt-4 px-4 pb-32 md:pb-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 9rem)' }}>
        {/* Admin quick tools (arriba) */}
        {/* (El formulario se abrirá en un modal vía FAB) */}

        {/* Selector de billeteras */}
        {/* Info usuario y Selector de billeteras */}


        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl mb-6">
            <BalanceCard balance={balance} />

          </div>
        )}

        {/* Historial */}
        {tab === 'historial' && (
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl mb-6">
            <TransactionList
              transactions={transactions}
              canEdit={canEdit}
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
          onOpenSettings={canEdit ? () => setSettingsOpen(true) : undefined}
        />

        {/* FAB central para admins */}
        {canEdit && (
          <AddTransactionButton onClick={() => { setEditingTransaction(null); setTxModalOpen(true); }} />
        )}
      </div>

      {/* Drawer de ajustes solo para admin */}
      <SettingsDrawer open={settingsOpen && canEdit} onClose={() => setSettingsOpen(false)} title="Ajustes">
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
            <h4 className="font-semibold mb-2">Compartir Billetera</h4>
            <ViewerManagement userId={user?.uid} />
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