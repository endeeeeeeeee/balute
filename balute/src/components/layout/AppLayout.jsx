import React from 'react';
import Notification from '../Notification';

function AppLayout({ notification, children }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-0 md:p-6 font-sans">
      {/* Notificaciones */}
      <div className="w-full max-w-xl">
        <Notification notification={notification} />
      </div>

      {/* Contenido principal */}
      {children}
    </div>
  );
}

export default AppLayout;
