import React, { useState, useMemo, useEffect } from 'react';
import { fetchTransactionsByDay } from '../services/firebase';

function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate(); // Firestore Timestamp
  if (ts instanceof Date) return ts;
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    // soportar epoch en ms o seg
    const ms = ts > 1e12 ? ts : ts < 1e12 ? ts * 1000 : ts;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts === 'string') {
    const s = ts.trim();
    // numérico
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      const ms = n > 1e12 ? n : n < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    // ISO u otros formatos reconocibles por Date
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

function getDayRangeFromISO(isoDate) {
  // isoDate esperado 'YYYY-MM-DD'
  if (!isoDate) return getTodayRange();
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return getTodayRange();
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end };
}

// Exportación a Excel (XLSX) con celdas reales usando import dinámico (SheetJS)
async function exportXLSX(rows, filename = 'transacciones.xlsx') {
  if (!rows || rows.length === 0) return;
  // Ordenar por fecha ascendente (sin fecha al final)
  const sorted = [...rows].sort((a, b) => {
    const da = toDate(a.timestamp);
    const db = toDate(b.timestamp);
    if (da && db) return da - db;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return 0;
  });
  const data = sorted.map((t) => ({
    Descripcion: t.description || '',
    Monto: getAmount(t), // número real para celdas numéricas
    Tipo: t.type || '',
    Categoria: t.category || '',
    Fecha: toDate(t.timestamp) || '', // Date para que Excel lo reconozca
  }));

  try {
    const XLSX = (await import('xlsx')).default || (await import('xlsx'));
    // Hoja 1: detalle de transacciones
    const ws = XLSX.utils.json_to_sheet(data, {
      cellDates: true,
      dateNF: 'yyyy-mm-dd hh:mm',
    });

    // Hoja 2: Resumen por categoría
    const byCat = {};
    for (const t of sorted) {
      const cat = (t.category || 'Otros');
      const amt = getAmount(t);
      if (!byCat[cat]) byCat[cat] = { ingresos: 0, gastos: 0 };
      if (String(t?.type || '').toLowerCase().trim() === 'ingreso') byCat[cat].ingresos += amt;
      if (String(t?.type || '').toLowerCase().trim() === 'gasto') byCat[cat].gastos += amt;
    }
    const resumenRows = Object.entries(byCat)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, v]) => ({
        Categoria: cat,
        Ingresos: Number(v.ingresos || 0),
        Gastos: Number(v.gastos || 0),
        Neto: Number((v.ingresos || 0) - (v.gastos || 0)),
      }));
    // Totales al final
    const totalIngresos = resumenRows.reduce((s, r) => s + Number(r.Ingresos || 0), 0);
    const totalGastos = resumenRows.reduce((s, r) => s + Number(r.Gastos || 0), 0);
    const totalNeto = totalIngresos - totalGastos;
    if (resumenRows.length > 0) {
      resumenRows.push({ Categoria: 'TOTAL', Ingresos: totalIngresos, Gastos: totalGastos, Neto: totalNeto });
    }
    const wsResumen = XLSX.utils.json_to_sheet(resumenRows);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    XLSX.writeFile(wb, filename);
  } catch (e) {
    // Si falla (por no estar instalado), caemos a CSV como respaldo
    console.warn('Fallo exportación XLSX, usando CSV de respaldo', e);
    exportCSV(rows, filename.replace(/\.xlsx$/i, '.csv'));
  }
}

// Obtiene el monto soportando variantes: amount, amount23 y cadenas con coma decimal
function getAmount(t) {
  let v = t?.amount;
  if (v === undefined || v === null) v = t?.amount23; // fallback común en docs manuales
  if (typeof v === 'string') v = v.replace(',', '.');
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

//

function formatISODate(d) {
  try {
    return d ? d.toISOString() : '';
  } catch {
    return '';
  }
}

function exportCSV(rows, filename = 'transacciones.csv') {
  if (!rows || rows.length === 0) return;
  // Delimitador ';' mejora la apertura en Excel (config regional ES)
  const DELIM = ';';
  const headers = ['description', 'amount', 'type', 'category', 'timestamp'];
  // Ordenar por fecha ascendente (sin fecha al final)
  const sorted = [...rows].sort((a, b) => {
    const da = toDate(a.timestamp);
    const db = toDate(b.timestamp);
    if (da && db) return da - db;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return 0;
  });

  const csv = [headers.join(DELIM)]
    .concat(
      sorted.map((t) => {
        const d = toDate(t.timestamp);
        const values = [
          (t.description || '').replaceAll('"', '""'),
          getAmount(t).toFixed(2),
          t.type || '',
          t.category || '',
          formatISODate(d),
        ];
        // CSV escape with quotes
        return values.map((v) => `"${String(v)}"`).join(DELIM);
      })
    )
    .join('\n');

  // BOM UTF-8 para que Excel reconozca correctamente acentos y separación
  const bom = '\ufeff';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

//

// (helpers de semana/mes eliminados por no usarse en esta vista)

function filterByDateRange(transactions, start, end) {
  return (transactions || []).filter((t) => {
    const d = toDate(t.timestamp);
    if (!d) return false; // sólo con fecha válida
    return d >= start && d <= end;
  });
}

const PAGE_SIZE = 50;

const TransactionList = ({ transactions, role, onDelete, onEdit, userId, useServerPagination = false, pageSize = PAGE_SIZE }) => {
  // Fecha seleccionada (por defecto hoy)
  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const { start, end } = useMemo(() => getDayRangeFromISO(selectedDate), [selectedDate]);

  // Client mode (fallback if not using server mode)
  const filtered = useMemo(() => {
    if (useServerPagination) return [];
    const list = transactions || [];
    return filterByDateRange(list, start, end);
  }, [transactions, start, end, useServerPagination]);

  const [visible, setVisible] = useState(pageSize);
  const hasMoreClient = (filtered?.length || 0) > visible;
  const clientItems = useMemo(() => (filtered || []).slice(0, visible), [filtered, visible]);

  // Server pagination state
  const [remoteItems, setRemoteItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMoreRemote, setHasMoreRemote] = useState(false);

  // Reset and first fetch when date changes or userId changes in server mode
  useEffect(() => {
    if (!useServerPagination) return;
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { items, nextCursor } = await fetchTransactionsByDay(userId, start, end, pageSize, null);
        if (cancelled) return;
        setRemoteItems(items);
        setCursor(nextCursor);
        setHasMoreRemote(!!nextCursor);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [useServerPagination, userId, start, end, pageSize]);

  const loadMoreRemote = async () => {
    if (!useServerPagination || !userId || !cursor) return;
    setLoading(true);
    try {
      const { items, nextCursor } = await fetchTransactionsByDay(userId, start, end, pageSize, cursor);
      setRemoteItems(prev => prev.concat(items));
      setCursor(nextCursor);
      setHasMoreRemote(!!nextCursor);
    } finally {
      setLoading(false);
    }
  };

  const items = useServerPagination ? remoteItems : clientItems;
  const hasMore = useServerPagination ? hasMoreRemote : hasMoreClient;



  // --- Helpers de rango para mes y semana basados en selectedDate ---
  function getMonthRangeFromISO(iso) {
    const [y, m] = iso.split('-').map(Number);
    const start = new Date(y, (m || 1) - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, (m || 1), 0, 23, 59, 59, 999); // día 0 del mes siguiente => último día del mes
    return { start, end };
  }

  function getWeekRangeFromISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const base = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
    const day = base.getDay(); // 0=Dom ... 1=Lun
    const diffToMonday = (day + 6) % 7; // cuantos días retroceder para llegar a lunes
    const start = new Date(base);
    start.setDate(base.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }

  // Obtiene todas las transacciones entre start y end (soporta server/client)
  const fetchAllInRange = async (start, end) => {
    if (!useServerPagination) {
      return filterByDateRange(transactions || [], start, end);
    }
    if (!userId) return [];
    let all = [];
    let next = null;
    do {
      const { items, nextCursor } = await fetchTransactionsByDay(userId, start, end, 500, next);
      all = all.concat(items);
      next = nextCursor;
    } while (next);
    return all;
  };



  return (
    <div>
      {/* Filtro por fecha específica */}
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-300">Fecha seleccionada:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setVisible(PAGE_SIZE); }}
            className="p-1 rounded bg-gray-700 text-white border border-gray-600 text-xs"
            aria-label="Seleccionar fecha base"
          />
        </div>


        <div className="bg-gray-700/30 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="text-sm text-gray-300 font-semibold">Exportar Reportes</div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={async () => {
                const { start, end } = getWeekRangeFromISO(selectedDate);
                const all = await fetchAllInRange(start, end);
                await exportXLSX(all, `reporte_semana_${selectedDate}.xlsx`);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow transition-colors flex items-center gap-2"
              title="Descargar reporte completo de la semana (Detalle + Resumen)"
            >
              Exportar Semana
            </button>
            <button
              onClick={async () => {
                const { start, end } = getMonthRangeFromISO(selectedDate);
                const all = await fetchAllInRange(start, end);
                await exportXLSX(all, `reporte_mes_${selectedDate.slice(0, 7)}.xlsx`);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow transition-colors flex items-center gap-2"
              title="Descargar reporte completo del mes (Detalle + Resumen)"
            >
              Exportar Mes
            </button>
          </div>
        </div>

        <div className="h-64 overflow-y-auto pr-2">
          {items.length > 0 ? (
            items.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex justify-between items-center p-3 my-2 rounded-lg shadow-md 
              ${transaction.type === 'ingreso' ? 'bg-green-700/70' : 'bg-red-700/70'}`}
              >
                <div className="flex-grow">
                  <span className="font-medium text-lg">{transaction.description}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">
                    {String(transaction?.type || '').toLowerCase().trim() === 'gasto' && '-'}
                    ${getAmount(transaction).toFixed(2)}
                  </span>
                  {role === 'admin' && (
                    <>
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs transition-colors"
                        aria-label={`Eliminar ${transaction.description}`}
                      >
                        Borrar
                      </button>
                      <button
                        onClick={() => onEdit(transaction)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-xs transition-colors"
                        aria-label={`Editar ${transaction.description}`}
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">No hay transacciones todavía.</p>
          )}
        </div>
        {useServerPagination && loading && (
          <div className="mt-2 text-center text-xs text-gray-400">Cargando…</div>
        )}
        {hasMore && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => {
                if (useServerPagination) loadMoreRemote();
                else setVisible((v) => v + pageSize);
              }}
              className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded text-xs"
            >
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;