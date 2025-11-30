import React, { useState, useEffect } from 'react';
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
      const suggested = categorize(description || '');
      // Solo autoasigna si la categoría actual es vacía u 'Otros'
      if (!category || category === 'Otros') {
        setCategory(suggested || 'Otros');
      }
    }
  }, [description, categoryTouched, category]);

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

  // Opciones de categorías: dinámicas + 'Otros' como fallback
  const categoryOptions = Array.from(new Set([...(categories || []), 'Otros']))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-gray-700/50 rounded-lg">
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
          // Permitir sólo dígitos, coma y punto
          v = String(v).replace(/[^0-9.,]/g, '');
          // Cambiar comas por punto y mantener un único separador decimal
          const hasComma = v.includes(',');
          const hasDot = v.includes('.');
          // Si tiene ambos, unificamos al primero que aparezca
          if (hasComma && hasDot) {
            const first = Math.min(v.indexOf(','), v.indexOf('.'));
            const sep = v[first];
            v = v.replace(/[.,]/g, '');
            v = v.slice(0, first) + sep + v.slice(first);
          } else {
            // Mantener un solo separador
            v = v.replace(/([.,])(.*)\1+/g, '$1$2');
          }
          // No limitar aquí; se redondea a 2 decimales al guardar
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
      <div className="flex gap-4">
        {isEditMode && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 p-3 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="flex-1 p-3 rounded-lg bg-blue-500 text-gray-900 font-semibold hover:bg-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {isEditMode ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;