import React from 'react';

export default function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-[95%] max-w-lg bg-gray-800 text-white rounded-lg shadow-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title || ''}</h3>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white px-2 py-1 rounded"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
