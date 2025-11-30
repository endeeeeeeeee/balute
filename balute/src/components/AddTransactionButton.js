import React from 'react';

export default function AddTransactionButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full shadow-lg px-6 py-3 text-white font-bold text-base transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
        disabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
      }`}
      aria-label="Agregar nueva transacción"
      title="Agregar nueva transacción"
    >
      + Agregar
    </button>
  );
}
