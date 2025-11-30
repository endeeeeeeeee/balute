import React from 'react';

export default function SettingsDrawer({ open, onClose, children, title = 'Ajustes' }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-gray-800 text-white shadow-2xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-700" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-56px)]">
          {children}
        </div>
      </aside>
    </div>
  );
}
