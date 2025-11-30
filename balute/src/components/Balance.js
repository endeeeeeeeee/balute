import React from 'react';

const Balance = ({ balance }) => {
  const balanceColor = balance >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <h2 className="text-2xl font-semibold text-center mb-4">
      Balance Total: <span className={balanceColor}>${balance.toFixed(2)}</span>
    </h2>
  );
};

export default Balance;
