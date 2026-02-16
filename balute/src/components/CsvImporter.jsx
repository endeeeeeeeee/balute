// src/components/CsvImporter.jsx
import React, { useState } from 'react';
import Papa from 'papaparse';
import { getAuth } from 'firebase/auth';
import { addTransactionsBatch } from '../services/firestore';
import { categorize } from '../utils/categorize';

export default function CsvImporter() {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);

  const downloadTemplate = () => {
    // CSV optimizado para Excel (configuración regional Latam/España suele usar punto y coma)
    const headers = ['description', 'amount', 'type', 'date', 'category'];
    // Ejemplos variados cronológicamente
    const row1 = ['Compra Supermercado', '50,50', 'gasto', '2026-01-28', 'Comida'];
    const row2 = ['Sueldo Mensual', '1500,00', 'ingreso', '2026-01-30', 'Salario'];
    const row3 = ['Regalo Navidad', '100,00', 'gasto', '2026-12-24', 'Ocio'];

    // Unir con PUNTO Y COMA (;) para máxima compatibilidad con Excel en español
    const csvContent = [
      headers.join(';'),
      row1.join(';'),
      row2.join(';'),
      row3.join(';')
    ].join('\n');

    // BOM (\ufeff) es vital para que Excel abra UTF-8 correctamente (tildes, ñ)
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_transacciones.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: async (results) => {
        try {
          const auth = getAuth();
          const uid = auth.currentUser?.uid;
          if (!uid) {
            alert('Debes iniciar sesión');
            setBusy(false);
            return;
          }

          // Validación de columnas
          const required = ['description', 'amount', 'type'];
          const fields = results.meta?.fields || [];

          // Verificar si están las columnas (PapaParse suele detectar bien el delimitador, 
          // pero si falla, fields tendrá 1 solo elemento con todo junto)
          const hasHeaders = required.every((h) => fields.includes(h));

          if (!hasHeaders) {
            // Intento de ayuda: verificar si es que el delimitador falló
            if (fields.length === 1 && fields[0].includes(';')) {
              alert('Parece que el archivo usa punto y coma (;). El sistema intentó leerlo con coma. Por favor intenta guardar como "CSV (delimitado por comas)" o asegúrate que el navegador detecte bien el archivo.');
            } else {
              alert(`El CSV debe contener las columnas: description, amount, type. (Columnas detectadas: ${fields.join(', ')})`);
            }
            setBusy(false);
            return;
          }

          // Normalizar + validar filas
          const data = Array.isArray(results.data) ? results.data.filter(Boolean) : [];
          const errors = [];
          const rows = [];

          data.forEach((r, idx) => {
            const rowNum = idx + 2;
            const description = String(r.description || '').trim();
            // Soporte flexible de montos (50.00 o 50,00)
            const amountStr = String(r.amount).replace(',', '.');
            const amount = Number(amountStr);

            const typeRaw = String(r.type || '').trim().toLowerCase();
            const type = typeRaw === 'ingreso' ? 'ingreso' : typeRaw === 'gasto' ? 'gasto' : null;

            if (!description) {
              errors.push(`Fila ${rowNum}: descripción vacía`);
              return;
            }
            if (!Number.isFinite(amount)) {
              errors.push(`Fila ${rowNum}: monto inválido (${r.amount})`);
              return;
            }
            if (!type) {
              errors.push(`Fila ${rowNum}: tipo debe ser 'ingreso' o 'gasto'`);
              return;
            }

            // --- Parsing de FECHA Robusto ---
            let ts = undefined;
            let dateStr = r.date ? String(r.date).trim() : '';

            if (dateStr) {
              let parsed = new Date('Invalid');

              // Caso 1: Formato ISO (YYYY-MM-DD)
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                parsed = new Date(dateStr + 'T12:00:00'); // Mediodía para evitar rollovers por zona horaria
              }
              // Caso 2: Formato Latino (DD/MM/YYYY)
              else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                const [d, m, y] = dateStr.split('/').map(Number);
                parsed = new Date(y, m - 1, d, 12, 0, 0);
              }
              // Caso fallback: Date normal
              else {
                parsed = new Date(dateStr);
              }

              if (!isNaN(parsed.getTime())) {
                ts = parsed;
              } else {
                errors.push(`Fila ${rowNum}: fecha inválida '${dateStr}' (use AAAA-MM-DD o DD/MM/AAAA)`);
              }
            } else {
              // Si no hay fecha, se usará la fecha de carga (opcional, o undefined según lógica de backend)
              ts = new Date();
            }

            // Categoría
            const catRaw = 'category' in r ? String(r.category || '').trim() : '';
            const category = catRaw || categorize(description) || 'Otros';

            rows.push({
              description,
              amount,
              type,
              category,
              timestamp: ts,
            });
          });

          if (rows.length === 0) {
            setSummary({ count: 0, skipped: data.length, errors });
            setBusy(false);
            return;
          }

          await addTransactionsBatch(uid, rows);
          setSummary({ count: rows.length, skipped: data.length - rows.length, errors });
          e.target.value = ''; // Reset input
        } catch (err) {
          console.error(err);
          alert('Error al procesar/guardar el CSV. Revisa la consola para más detalles.');
        } finally {
          setBusy(false);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Error leyendo el archivo CSV');
        setBusy(false);
      },
    });
  };

  return (
    <div className="border border-gray-600 rounded-lg p-4 bg-gray-700/30">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-sm text-gray-300 block font-medium">Carga masiva (Excel/CSV)</span>
            <span className="text-xs text-gray-500">Soporta formato latino (;) y fechas DD/MM/AAAA</span>
          </div>
          <button
            onClick={downloadTemplate}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors shadow flex items-center gap-1"
            title="Descargar archivo de ejemplo compatible con Excel"
          >
            Bajar Plantilla
          </button>
        </div>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          disabled={busy}
          className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer"
        />

        {busy && <p className="text-sm text-yellow-400 animate-pulse">Procesando archivo...</p>}

        {summary && (
          <div className="mt-2 p-3 bg-gray-800 rounded text-sm animate-fade-in">
            <p className="text-green-400 font-medium">{summary.count} transacciones cargadas correctamente.</p>
            {typeof summary.skipped === 'number' && summary.skipped > 0 && (
              <p className="text-red-400 mt-1">{summary.skipped} filas omitidas por errores.</p>
            )}
            {Array.isArray(summary.errors) && summary.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-gray-400 hover:text-white select-none">Ver errores ({summary.errors.length})</summary>
                <div className="mt-2 text-xs bg-gray-900/50 p-2 rounded max-h-32 overflow-y-auto">
                  <ul className="list-disc pl-4 text-red-300 space-y-1">
                    {summary.errors.slice(0, 20).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {summary.errors.length > 20 && (
                      <li>… y {summary.errors.length - 20} más</li>
                    )}
                  </ul>
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
