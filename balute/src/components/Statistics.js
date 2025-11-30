import React, { useState, useMemo } from 'react';
import StatsChart from './StatsChart';
import startOfDay from 'date-fns/startOfDay';
import startOfWeek from 'date-fns/startOfWeek';
import startOfMonth from 'date-fns/startOfMonth';
import startOfYear from 'date-fns/startOfYear';
import isWithinInterval from 'date-fns/isWithinInterval';
import format from 'date-fns/format';
import { es } from 'date-fns/locale';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import eachMonthOfInterval from 'date-fns/eachMonthOfInterval';
import lastDayOfMonth from 'date-fns/lastDayOfMonth';

const getTransactionDate = (transaction) => {
  if (!transaction || !transaction.timestamp) {
    return null;
  }
  if (typeof transaction.timestamp.toDate === 'function') {
    return transaction.timestamp.toDate();
  }
  if (transaction.timestamp instanceof Date) {
    return transaction.timestamp;
  }
  if (typeof transaction.timestamp === 'number') {
    return new Date(transaction.timestamp);
  }
  return null;
};

// Parseo robusto de montos: acepta número o string (coma o punto)
const getAmount = (tOrValue) => {
  let v = tOrValue;
  if (v && typeof v === 'object') v = v.amount;
  if (v === undefined || v === null) return 0;
  if (typeof v === 'string') v = v.replace(',', '.');
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const Statistics = ({ transactions }) => {
  const [filterType, setFilterType] = useState('all'); // 'all', 'year', 'month', 'week', 'day', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  // Nuevo: filtro por categoría ("todas" muestra todo)
  const [selectedCategory, setSelectedCategory] = useState('todas');

  // Opciones de categoría derivadas de las transacciones
  const categoryOptions = useMemo(() => {
    const set = new Set();
    (transactions || []).forEach(t => set.add(t?.category || 'Otros'));
    return ['todas', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) {
      return [];
    }

    const now = new Date();
    let startDate, endDate;

    switch (filterType) {
      case 'year':
        startDate = startOfYear(now);
        endDate = now;
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = now;
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = now;
        break;
      case 'day':
        startDate = startOfDay(now);
        endDate = now;
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          // Forzamos horario local para evitar desfase por zona horaria (YYYY-MM-DD se interpreta como UTC en algunos entornos)
          const sd = new Date(`${customStartDate}T00:00:00`);
          const ed = new Date(`${customEndDate}T23:59:59.999`);
          if (!isNaN(sd.getTime()) && !isNaN(ed.getTime())) {
            startDate = startOfDay(sd);
            endDate = ed;
            // Si el rango está invertido, lo corregimos
            if (startDate > endDate) {
              const tmp = startDate; startDate = endDate; endDate = tmp;
            }
          }
        }
        break;
      default: // 'all'
        return transactions;
    }

    if (!startDate || !endDate) {
      return [];
    }

    const timeFiltered = transactions.filter(t => {
      const transactionDate = getTransactionDate(t);
      if (!transactionDate) {
        return false;
      }
      // Seguridad: si por alguna razón el rango es inválido, excluimos
      if (startDate > endDate) return false;
      try {
        return isWithinInterval(transactionDate, { start: startDate, end: endDate });
      } catch (_) {
        return false;
      }
    });

    // Aplicar filtro por categoría si corresponde
    if (selectedCategory && selectedCategory !== 'todas') {
      return timeFiltered.filter(t => (t?.category || 'Otros') === selectedCategory);
    }
    return timeFiltered;
  }, [transactions, filterType, customStartDate, customEndDate, selectedCategory]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + getAmount(t), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + getAmount(t), 0);

    return { income, expenses };
  }, [filteredTransactions]);

  // Resumen por categoría para el período filtrado
  const byCategory = useMemo(() => {
    const acc = {};
    for (const t of filteredTransactions) {
      const cat = t.category || 'Otros';
      const amt = getAmount(t);
      if (!acc[cat]) acc[cat] = { ingresos: 0, gastos: 0 };
      if (t.type === 'ingreso') acc[cat].ingresos += amt;
      if (t.type === 'gasto') acc[cat].gastos += amt;
    }
    const rows = Object.entries(acc)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, v]) => ({
        cat,
        ingresos: getAmount(v.ingresos),
        gastos: getAmount(v.gastos),
        neto: getAmount(v.ingresos) - getAmount(v.gastos),
      }));
    const totIng = rows.reduce((s, r) => s + getAmount(r.ingresos), 0);
    const totGas = rows.reduce((s, r) => s + getAmount(r.gastos), 0);
    const totNet = totIng - totGas;
    return { rows, totIng, totGas, totNet };
  }, [filteredTransactions]);

  const chartSeries = useMemo(() => {
    const labels = [];
    const incomeData = [];
    const expenseData = [];

    if (filterType === 'year') {
      const months = eachMonthOfInterval({ start: startOfYear(new Date()), end: new Date() });
      months.forEach(month => {
        labels.push(format(month, 'MMMM', { locale: es }));
        const monthTransactions = filteredTransactions.filter(t => {
          const d = getTransactionDate(t);
          return d && format(d, 'yyyyMM') === format(month, 'yyyyMM');
        });
        incomeData.push(monthTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + getAmount(t), 0));
        expenseData.push(monthTransactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + getAmount(t), 0));
      });
    } else if (filterType === 'month') {
      const startM = startOfMonth(new Date());
      const days = eachDayOfInterval({ start: startM, end: lastDayOfMonth(new Date()) });
      days.forEach(day => {
        labels.push(format(day, 'd'));
        const dayTransactions = filteredTransactions.filter(t => {
          const d = getTransactionDate(t);
          return d && format(d, 'yyyyMMdd') === format(day, 'yyyyMMdd');
        });
        incomeData.push(dayTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + getAmount(t), 0));
        expenseData.push(dayTransactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + getAmount(t), 0));
      });
    } else if (filterType === 'week') {
      const startW = startOfWeek(new Date(), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: startW, end: new Date() });
      days.forEach(day => {
        labels.push(format(day, 'eeee', { locale: es }));
        const dayTransactions = filteredTransactions.filter(t => {
          const d = getTransactionDate(t);
          return d && format(d, 'yyyyMMdd') === format(day, 'yyyyMMdd');
        });
        incomeData.push(dayTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + Number(t.amount || 0), 0));
        expenseData.push(dayTransactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + Number(t.amount || 0), 0));
      });
    } else {
      labels.push('Estadísticas');
      incomeData.push(stats.income);
      expenseData.push(stats.expenses);
    }

    return { labels, incomeData, expenseData };
  }, [filteredTransactions, filterType, stats.income, stats.expenses]);

  const getChartTitle = () => {
    switch (filterType) {
      case 'all':
        return 'Estadísticas de todas las transacciones';
      case 'year':
        return `Estadísticas del año ${format(new Date(), 'yyyy')}`;
      case 'month':
        return `Estadísticas de ${format(new Date(), 'MMMM yyyy', { locale: es })}`;
      case 'week':
        return 'Estadísticas de esta semana';
      case 'day':
        return `Estadísticas de hoy (${format(new Date(), 'dd/MM/yyyy', { locale: es })})`;
      case 'custom':
        if (customStartDate && customEndDate) {
          // Repetimos la normalización para reflejar exactamente el rango usado
          const sd = new Date(`${customStartDate}T00:00:00`);
          const ed = new Date(`${customEndDate}T23:59:59.999`);
          if (!isNaN(sd.getTime()) && !isNaN(ed.getTime())) {
            let a = startOfDay(sd);
            let b = ed;
            if (a > b) { const tmp = a; a = b; b = tmp; }
            const formattedStart = format(a, 'dd/MM/yyyy');
            const formattedEnd = format(b, 'dd/MM/yyyy');
            return `Estadísticas del ${formattedStart} al ${formattedEnd}`;
          }
        }
        return 'Estadísticas de rango personalizado';
      default:
        return 'Estadísticas';
    }
  };

  const chartTitle = getChartTitle();

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Estadísticas</h2>

      <div className="flex flex-wrap justify-center mb-4 gap-2">
        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg transition-all duration-200 ${filterType === 'all' ? 'bg-blue-700 shadow-lg' : 'bg-blue-500 hover:bg-blue-600'}`}>Todo</button>
        <button onClick={() => setFilterType('year')} className={`px-4 py-2 rounded-lg transition-all duration-200 ${filterType === 'year' ? 'bg-blue-700 shadow-lg' : 'bg-blue-500 hover:bg-blue-600'}`}>Año</button>
        <button onClick={() => setFilterType('month')} className={`px-4 py-2 rounded-lg transition-all duration-200 ${filterType === 'month' ? 'bg-blue-700 shadow-lg' : 'bg-blue-500 hover:bg-blue-600'}`}>Mes</button>
        <button onClick={() => setFilterType('week')} className={`px-4 py-2 rounded-lg transition-all duration-200 ${filterType === 'week' ? 'bg-blue-700 shadow-lg' : 'bg-blue-500 hover:bg-blue-600'}`}>Semana</button>
        <button onClick={() => setFilterType('day')} className={`px-4 py-2 rounded-lg transition-all duration-200 ${filterType === 'day' ? 'bg-blue-700 shadow-lg' : 'bg-blue-500 hover:bg-blue-600'}`}>Día</button>
        <button onClick={() => setFilterType('custom')} className={`px-4 py-2 rounded-lg transition-all duration-200 ${filterType === 'custom' ? 'bg-blue-700 shadow-lg' : 'bg-blue-500 hover:bg-blue-600'}`}>Personalizado</button>
      </div>

      {/* Filtro por categoría */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-2 bg-gray-700/30 p-3 rounded-lg">
          <label className="text-sm text-gray-300">Categoría:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded-lg p-2 text-sm"
          >
            {categoryOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {filterType === 'custom' && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-4 bg-gray-700/30 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <label htmlFor="start-date" className="text-sm text-gray-300">Desde:</label>
            <input type="date" id="start-date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-gray-700 text-white border border-gray-600 rounded-lg p-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="end-date" className="text-sm text-gray-300">Hasta:</label>
            <input type="date" id="end-date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-gray-700 text-white border border-gray-600 rounded-lg p-2 text-sm" />
          </div>
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <div className="h-64 mb-6">
          <StatsChart
            labels={chartSeries.labels}
            incomeData={chartSeries.incomeData}
            expenseData={chartSeries.expenseData}
            title={chartTitle}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-1">Total Ingresos</p>
            <p className="text-2xl font-bold text-green-400">${stats.income.toFixed(2)}</p>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-1">Total Gastos</p>
            <p className="text-2xl font-bold text-red-400">${stats.expenses.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-700/30 rounded-lg text-center">
          <p className="text-sm text-gray-400 mb-1">Balance en este período</p>
          <p className={`text-2xl font-bold ${(stats.income - stats.expenses) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${(stats.income - stats.expenses).toFixed(2)}
          </p>
        </div>
        {/* Resumen por categoría */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Gasto/Ingreso por categoría</h3>
          {byCategory.rows.length === 0 ? (
            <p className="text-sm text-gray-400">No hay datos en este rango.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-gray-400">
                  <tr>
                    <th className="py-1 pr-4">Categoría</th>
                    <th className="py-1 pr-4">Ingresos</th>
                    <th className="py-1 pr-4">Gastos</th>
                    <th className="py-1 pr-4">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory.rows.map((r) => (
                    <tr key={r.cat} className="border-t border-gray-700">
                      <td className="py-1 pr-4">{r.cat}</td>
                      <td className="py-1 pr-4 text-green-300">{r.ingresos.toFixed(2)}</td>
                      <td className="py-1 pr-4 text-red-300">{r.gastos.toFixed(2)}</td>
                      <td className={`py-1 pr-4 ${r.neto >= 0 ? 'text-green-300' : 'text-red-300'}`}>{r.neto.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-600 font-semibold">
                    <td className="py-1 pr-4">TOTAL</td>
                    <td className="py-1 pr-4 text-green-300">{byCategory.totIng.toFixed(2)}</td>
                    <td className="py-1 pr-4 text-red-300">{byCategory.totGas.toFixed(2)}</td>
                    <td className={`py-1 pr-4 ${byCategory.totNet >= 0 ? 'text-green-300' : 'text-red-300'}`}>{byCategory.totNet.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;