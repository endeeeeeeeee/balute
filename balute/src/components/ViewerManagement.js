import React, { useState, useEffect } from 'react';
import * as firebase from '../services/firebase';

const ViewerManagement = () => {
  const [viewers, setViewers] = useState([]);
  const [newViewerEmail, setNewViewerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = firebase.subscribeToViewers((newViewers) => {
      setViewers(newViewers);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddViewer = async (e) => {
    e.preventDefault();
    if (!newViewerEmail) return;
    setError(null);

    try {
      await firebase.addViewer(newViewerEmail);
      setNewViewerEmail('');
    } catch (err) {
      setError('Error al agregar el viewer.');
      console.error(err);
    }
  };

  const handleRemoveViewer = async (viewerId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este viewer?')) return;

    try {
      await firebase.removeViewer(viewerId);
    } catch (err) {
      setError('Error al eliminar el viewer.');
      console.error(err);
    }
  };

  if (isLoading) {
    return <p>Cargando viewers...</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Gestionar Viewers</h2>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleAddViewer} className="flex mb-4">
        <input
          type="email"
          value={newViewerEmail}
          onChange={(e) => setNewViewerEmail(e.target.value)}
          placeholder="Email del nuevo viewer"
          className="flex-grow p-2 rounded-l-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md">
          Agregar
        </button>
      </form>

      <ul className="space-y-2">
        {viewers.map((viewer) => (
          <li key={viewer.id} className="flex justify-between items-center bg-gray-700 p-2 rounded-md">
            <span>{viewer.email}</span>
            <button
              onClick={() => handleRemoveViewer(viewer.id)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-md"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewerManagement;
