import React from 'react';

export default function BudgetGauge({ spent = 0, goal = 0 }) {
  const g = Number(goal) || 0;
  const s = Math.max(0, Number(spent) || 0);
  const pct = g > 0 ? Math.min(100, Math.round((s / g) * 100)) : 0;
  const barColor = g === 0 ? 'bg-gray-600' : (pct < 80 ? 'bg-green-600' : pct < 100 ? 'bg-yellow-500' : 'bg-red-600');
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-sm text-gray-400">Gasto del mes</div>
          <div className="text-2xl font-bold">${s.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Objetivo</div>
          <div className="text-lg font-semibold">${g.toFixed(2)}</div>
        </div>
      </div>
      <div className="w-full h-3 bg-gray-700 rounded">
        <div className={`h-3 ${barColor} rounded`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-gray-400">{pct}% del objetivo</div>
    </div>
  );
}
