import React, { useState, useEffect, useMemo } from 'react';
import { categorize } from '../utils/categorize';

const TransactionForm = ({ onAddTransaction, onUpdateTransaction, transactionToEdit, onCancelEdit, categories = [] }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('gasto');
  const [category, setCategory] = useState('Otros');
  const [categoryTouched, setCategoryTouched] = useState(false);

  const isEditMode = !!transactionToEdit;

  useEffect(() => {
    if (isEditMode) {
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount ?? ''));
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category || 'Otros');
      setCategoryTouched(false);
    } else {
      // Limpia el formulario si salimos del modo edición (ej. al cancelar)
      setDescription('');
      setAmount('');
      setType('gasto');
      setCategory('Otros');
      setCategoryTouched(false);
    }
  }, [transactionToEdit, isEditMode]);

  // Autosugerir categoría a partir de la descripción si el usuario no la cambió manualmente
  useEffect(() => {
    if (!categoryTouched) {
      const suggested = categorize(description || '', categories);
      // Solo autoasigna si la categoría actual es vacía u 'Otros'
      if (!category || category === 'Otros') {
        setCategory(suggested || 'Otros');
      }
    }
  }, [description, categoryTouched, category, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditMode) {
      onUpdateTransaction({ id: transactionToEdit.id, description, amount, type, category: category || 'Otros' });
    } else {
      onAddTransaction({ description, amount, type, category: category || 'Otros' });
      // Limpia el formulario después de agregar
      setDescription('');
      setAmount('');
      setType('gasto');
      setCategory('Otros');
      setCategoryTouched(false);
    }
  };

  // Opciones de categorías: dinámicas + 'Otros' como fallback + categoría actual si está editando
  const categoryOptions = useMemo(() => {
    const allCats = new Set([...(categories || []), 'Otros']);

    // Si estamos editando, agregar la categoría actual aunque esté borrada
    if (transactionToEdit?.category) {
      allCats.add(transactionToEdit.category);
    }

    return Array.from(allCats)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categories, transactionToEdit]);

  return (
    <form className="flex flex-col gap-4 p-4 bg-gray-700/50 rounded-lg mb-4">
      <h3 className="text-xl font-semibold text-center text-white">
        {isEditMode ? 'Editar Transacción' : 'Agregar Nueva Transacción'}
      </h3>
      <input
        type="text"
        id="description"
        name="description"
        autoComplete="off"
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />
      <input
        type="text"
        id="amount"
        name="amount"
        autoComplete="off"
        placeholder="Monto"
        value={amount}
        inputMode="decimal"
        step="0.01"
        min="0"
        pattern="[0-9]*[.,]?[0-9]{0,2}"
        onChange={(e) => {
          let v = e.target.value;
          v = String(v).replace(/[^0-9.,]/g, '');
          const hasComma = v.includes(',');
          const hasDot = v.includes('.');
          if (hasComma && hasDot) {
            const first = Math.min(v.indexOf(','), v.indexOf('.'));
            const sep = v[first];
            v = v.replace(/[.,]/g, '');
            v = v.slice(0, first) + sep + v.slice(first);
          } else {
            v = v.replace(/([.,])(.*)\1+/g, '$1$2');
          }
          setAmount(v);
        }}
        className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />
      <select
        id="category"
        name="category"
        value={category}
        onChange={(e) => { setCategory(e.target.value); setCategoryTouched(true); }}
        className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
        required
      >
        {categoryOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <select
        id="type"
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
      >
        <option value="gasto">Gasto</option>
        <option value="ingreso">Ingreso</option>
      </select>
      <div className="flex gap-4 pb-2">
        {isEditMode && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 p-3 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-400 transition-colors active:scale-95 touch-manipulation"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 p-3 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-400 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation shadow-lg"
          style={{ minHeight: '48px' }}
        >
          {isEditMode ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;