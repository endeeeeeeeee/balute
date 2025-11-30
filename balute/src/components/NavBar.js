import React from 'react';

export default function NavBar({ tab, onChange, onOpenSettings, showOptimize }) {
  const Item = ({ id, label }) => (
    <button
      onClick={() => onChange(id)}
      className={`flex-1 shrink-0 py-2 px-3 text-sm font-semibold rounded ${tab === id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
        }`}
      aria-current={tab === id ? 'page' : undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed bottom-0 md:static md:mb-4 left-0 right-0 z-30">
      <div className="mx-auto max-w-lg md:max-w-none md:w-full p-3 md:p-0 overflow-x-auto">
        <div className="flex gap-2 bg-gray-800 md:bg-transparent rounded-t md:rounded-none shadow-md md:shadow-none whitespace-nowrap pr-4">
          <Item id="dashboard" label="Balance" />
          <Item id="historial" label="Historial" />
          <Item id="stats" label="Estadísticas" />
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="shrink-0 py-2 px-3 text-sm font-semibold rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              aria-label="Abrir ajustes"
            >
              Ajustes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
