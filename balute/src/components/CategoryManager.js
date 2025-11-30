// src/components/CategoryManager.js
import React, { useEffect, useState } from 'react';
import { subscribeToCategories, addCategory, deleteCategory, renameCategory } from '../services/categories';
import { getAuth } from 'firebase/auth';

const DEFAULT_SET = ['Comida', 'Transporte', 'Vivienda', 'Salud', 'Educación', 'Ocio', 'Otros'];

export default function CategoryManager() {
  const [uid, setUid] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const u = auth.currentUser?.uid || null;
    setUid(u);
    if (!u) return;
    const unsub = subscribeToCategories(u, setCategories);
    return () => unsub();
  }, []);

  const onAdd = async () => {
    const name = newCat.trim();
    if (!uid || !name) return;
    await addCategory(uid, name);
    setNewCat('');
  };

  const onDelete = async (id) => {
    if (!uid) return;
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    await deleteCategory(uid, id);
  };

  const onStartEdit = (id, name) => { setEditingId(id); setEditingName(name); };
  const onCancelEdit = () => { setEditingId(null); setEditingName(''); };
  const onSaveEdit = async () => {
    const name = editingName.trim();
    if (!uid || !editingId || !name) return;
    await renameCategory(uid, editingId, name);
    onCancelEdit();
  };

  const names = categories.map(c => c.name);
  const showDefaultHint = names.length === 0;

  return (
    <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
      <h2 className="text-xl font-semibold mb-4">Categorías</h2>
      {showDefaultHint && (
        <p className="text-sm text-gray-400 mb-2">No tienes categorías aún. Puedes agregarlas aquí. Sugeridas: {DEFAULT_SET.join(', ')}.</p>
      )}

      <div className="flex gap-2 mb-4">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Nueva categoría"
          className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600"
        />
        <button onClick={onAdd} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">Agregar</button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2 bg-gray-700/40 p-2 rounded">
            {editingId === c.id ? (
              <>
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
                <button onClick={onSaveEdit} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm">Guardar</button>
                <button onClick={onCancelEdit} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1">{c.name}</span>
                <button onClick={() => onStartEdit(c.id, c.name)} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-sm">Renombrar</button>
                <button onClick={() => onDelete(c.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm">Eliminar</button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-gray-400">Aún no hay categorías.</p>
        )}
      </div>
    </div>
  );
}
