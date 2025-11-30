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
        <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">
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

          <button
            type="submit"
            className="p-3 rounded-lg bg-blue-500 text-gray-900 font-semibold hover:bg-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {isSigningUp ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
          <p className="text-center text-sm text-gray-400 mt-2">
            {isSigningUp ? (
              <span>
                ¿Ya tienes una cuenta?{' '}
                <span
                  className="text-blue-400 cursor-pointer hover:underline"
                  onClick={() => setIsSigningUp(false)}
                >
                  Inicia sesión aquí
                </span>
              </span>
            ) : (
              <span>
                ¿No tienes una cuenta?{' '}
                <span
                  className="text-blue-400 cursor-pointer hover:underline"
                  onClick={() => setIsSigningUp(true)}
                >
                  Regístrate aquí
                </span>
              </span>
            )}
          </p>
        </form>
        <Notification notification={notification} />
      </div>
    </div>
  );
};

export default LoginForm;
