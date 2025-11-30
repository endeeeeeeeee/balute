// src/components/CsvImporter.jsx
import React, { useState } from 'react';
import Papa from 'papaparse';
import { getAuth } from 'firebase/auth';
import { addTransactionsBatch } from '../services/firestore';
import { categorize } from '../utils/categorize';

export default function CsvImporter() {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const auth = getAuth();
          const uid = auth.currentUser?.uid;
          if (!uid) {
            alert('Debes iniciar sesión');
            setBusy(false);
            return;
          }

          // Validación básica de columnas (date opcional)
          const required = ['description', 'amount', 'type'];
          const fields = results.meta?.fields || [];
          const hasHeaders = required.every((h) => fields.includes(h));
          if (!hasHeaders) {
            alert('El CSV debe contener columnas: description, amount, type');
            setBusy(false);
            return;
          }

          // Normalizar + validar filas
          const data = Array.isArray(results.data) ? results.data.filter(Boolean) : [];
          const errors = [];
          const rows = [];

          data.forEach((r, idx) => {
            const rowNum = idx + 2; // asumiendo encabezado en fila 1
            const description = String(r.description || '').trim();
            const amount = Number(r.amount);
            const typeRaw = String(r.type || '').trim().toLowerCase();
            const type = typeRaw === 'ingreso' ? 'ingreso' : typeRaw === 'gasto' ? 'gasto' : null;

            if (!description) {
              errors.push(`Fila ${rowNum}: description vacío`);
              return;
            }
            if (!Number.isFinite(amount)) {
              errors.push(`Fila ${rowNum}: amount inválido`);
              return;
            }
            if (!type) {
              errors.push(`Fila ${rowNum}: type debe ser ingreso|gasto`);
              return;
            }

            // date opcional -> timestamp
            let ts = undefined;
            if ('date' in r && r.date !== undefined && r.date !== null && String(r.date).trim() !== '') {
              const parsed = new Date(r.date);
              if (!isNaN(parsed.getTime())) ts = parsed; // Firestore lo acepta y lo guarda como Timestamp
              else errors.push(`Fila ${rowNum}: date inválido (uso opcional)`);
            }

            // categoría: si viene en CSV usarla; si no, sugerir por descripción; fallback 'Otros'
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
        } catch (err) {
          console.error(err);
          alert('Error al procesar/guardar el CSV');
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
    <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
      <h3>Importar CSV de Transacciones</h3>
      <p>Columnas requeridas: description, amount, type. Opcional: date (YYYY-MM-DD o formato reconocible).</p>
      <input type="file" accept=".csv,text/csv" onChange={onFileChange} disabled={busy} />
      {busy && <p>Procesando...</p>}
      {summary && (
        <div>
          <p>{summary.count} transacciones cargadas correctamente.</p>
          {typeof summary.skipped === 'number' && summary.skipped > 0 && (
            <p>{summary.skipped} filas omitidas por errores.</p>
          )}
          {Array.isArray(summary.errors) && summary.errors.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary>Ver errores ({summary.errors.length})</summary>
              <ul style={{ marginTop: 8 }}>
                {summary.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
                {summary.errors.length > 20 && (
                  <li>… y {summary.errors.length - 20} más</li>
                )}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
