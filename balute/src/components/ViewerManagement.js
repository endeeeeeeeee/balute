import React, { useState, useEffect } from 'react';
import * as firebase from '../services/firebase';

const ViewerManagement = ({ userId, currentUserEmail }) => {
  const [viewers, setViewers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (!userId) {
      setViewers([]);
      setIsLoading(false);
      return;
    }

    const unsubscribe = firebase.subscribeToViewers(userId, (newViewers) => {
      setViewers(newViewers);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail) return;

    setIsSearching(true);
    setError(null);
    setSearchResult(null);
    setSuccessMessage(null);

    try {
      const user = await firebase.findUserByEmail(searchEmail);

      if (!user) {
        setError('No se encontró ningún usuario con ese email.');
      } else if (user.uid === userId || user.email === currentUserEmail) {
        setError('No puedes compartir tu billetera contigo mismo.');
      } else if (user.role === 'viewer' && user.ownerUid === userId) {
        setError('Este usuario ya tiene acceso a tu billetera.');
      } else {
        setSearchResult(user);
      }
    } catch (err) {
      setError('Error al buscar usuario.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShareWallet = async () => {
    if (!searchResult || !userId) return;

    try {
      await firebase.shareWalletWithUser(searchResult.uid, userId);
      setSuccessMessage(`¡Billetera compartida con ${searchResult.email}!`);
      setSearchEmail('');
      setSearchResult(null);
    } catch (err) {
      setError('Error al compartir billetera.');
      console.error(err);
    }
  };

  const handleUnshareWallet = async (viewerEmail) => {
    if (!window.confirm(`¿Dejar de compartir tu billetera con ${viewerEmail}?`)) return;

    try {
      // Buscar el usuario por email para obtener su UID
      const user = await firebase.findUserByEmail(viewerEmail);
      if (user) {
        await firebase.unshareWalletWithUser(user.uid);
        setSuccessMessage(`Dejaste de compartir tu billetera con ${viewerEmail}.`);
      }
    } catch (err) {
      setError('Error al dejar de compartir.');
      console.error(err);
    }
  };

  if (isLoading) {
    return <p className="text-gray-400">Cargando viewers...</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Compartir Billetera</h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 p-3 rounded-md mb-4">
          {successMessage}
        </div>
      )}

      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearchUser} className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Buscar usuario por email
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="flex-grow p-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {/* Resultado de búsqueda */}
      {searchResult && (
        <div className="bg-gray-700 p-4 rounded-md mb-6">
          <h3 className="font-semibold mb-2">Usuario encontrado:</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg">{searchResult.email}</p>
              <p className="text-sm text-gray-400">
                Rol actual: {searchResult.role === 'admin' ? 'Admin' : 'Viewer'}
              </p>
            </div>
            <button
              onClick={handleShareWallet}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
            >
              Compartir mi billetera
            </button>
          </div>
        </div>
      )}

      {/* Lista de viewers actuales */}
      <div>
        <h3 className="font-semibold mb-2">
          Usuarios con acceso a tu billetera ({viewers.length})
        </h3>

        {viewers.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No has compartido tu billetera con nadie aún.
          </p>
        ) : (
          <ul className="space-y-2">
            {viewers.map((viewer) => (
              <li key={viewer.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                <div>
                  <span className="font-medium">{viewer.email}</span>
                  <p className="text-xs text-gray-400">
                    Compartido el {viewer.sharedAt ? new Date(viewer.sharedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => handleUnshareWallet(viewer.email)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm"
                >
                  Dejar de compartir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-md">
        <p className="text-sm text-blue-200">
          <strong>Cómo funciona:</strong> Cuando compartes tu billetera con otro usuario,
          ellos podrán ver tus transacciones pero NO podrán editarlas ni eliminarlas.
          Ellos seguirán teniendo acceso a su propia billetera como admin.
        </p>
      </div>
    </div>
  );
};

export default ViewerManagement;
