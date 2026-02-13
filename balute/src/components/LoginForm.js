import React, { useState } from 'react';
import Notification from './Notification';

const LoginForm = ({ onSignIn, onSignUp, isSigningUp, setIsSigningUp, notification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSigningUp) {
      onSignUp(email, password);
    } else {
      onSignIn(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h1 className={`text-3xl font-bold text-center mb-6 
          ${isSigningUp ? 'text-emerald-400' : 'text-blue-400'}`}>
          {isSigningUp ? 'Registrarse' : 'Iniciar Sesión'}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <div className="flex flex-col gap-3 mt-2">
            <button
              type="submit"
              className={`p-3 rounded-lg font-bold text-white transition-colors focus:outline-none focus:ring-2 shadow-lg touch-manipulation
                ${isSigningUp
                  ? 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-400'
                }`}
              style={{ minHeight: '48px' }}
            >
              {isSigningUp ? 'Crear Cuenta' : 'Entrar'}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-600"></div>
              <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">O</span>
              <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <button
              type="button"
              onClick={() => setIsSigningUp(!isSigningUp)}
              className="p-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 border border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              {isSigningUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Nuevo aquí? Regístrate'}
            </button>
          </div>
        </form>
        <Notification notification={notification} />
      </div>
    </div>
  );
};

export default LoginForm;
