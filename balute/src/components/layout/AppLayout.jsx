import React from 'react';
import Notification from '../Notification';

function AppLayout({ title = 'Control de Finanzas', notification, onSignOut, children }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-6 font-sans">
      {/* Notificaciones */}
      <div className="w-full max-w-lg">
        <Notification notification={notification} />
      </div>

      {/* Encabezado */}
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-blue-400">{title}</h1>
          {onSignOut && (
            <button onClick={onSignOut} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Cerrar Sesión
            </button>
          )}
        </div>
        {/* Slot inicial opcional para children que quieran estar arriba */}
      </div>

      {/* Contenido principal */}
      {children}
    </div>
  );
}

export default AppLayout;
