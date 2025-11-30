import React from 'react';

function ContentArea({ className = '', children }) {
  return (
    <div className={`bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg ${className}`}>
      {children}
    </div>
  );
}

export default ContentArea;
