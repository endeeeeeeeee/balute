// src/utils/categorize.js
export function categorize(description = '') {
  const d = String(description || '').toLowerCase();
  if (/(comida|supermercado|restaurante)/.test(d)) return 'Comida';
  if (/(transporte|gasolina|uber)/.test(d)) return 'Transporte';
  if (/(alquiler|hipoteca)/.test(d)) return 'Vivienda';
  if (/(ocio|cine|bar)/.test(d)) return 'Ocio';
  return 'Otros';
}
