import React from 'react';

export default function BalanceCard({ balance = 0 }) {
  const signClass = balance >= 0 ? 'text-green-300' : 'text-red-300';
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="text-sm text-gray-400">Balance total</div>
      <div className={`text-3xl font-bold ${signClass}`}>${Number(balance || 0).toFixed(2)}</div>
    </div>
  );
}
