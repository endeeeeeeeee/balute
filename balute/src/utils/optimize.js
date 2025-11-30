// src/utils/optimize.js
// Optimización simple en cliente (sin solver):
// - Asegura mínimo en Comida = 200
// - Asegura máximo en Ocio = 150
// - Reduce 10% categorías no básicas para minimizar total

export function optimizeBudget(transactions) {
  const gastosPorCategoria = (transactions || [])
    .filter((t) => t?.type === 'gasto')
    .reduce((acc, t) => {
      const cat = t.category || 'Otros';
      const amount = Number(t.amount || 0);
      acc[cat] = (acc[cat] || 0) + amount;
      return acc;
    }, {});

  // Copia para no mutar el original
  const result = { ...gastosPorCategoria };

  // Reglas simples
  if (Object.prototype.hasOwnProperty.call(result, 'Comida') && result.Comida < 200) {
    result.Comida = 200;
  }
  if (Object.prototype.hasOwnProperty.call(result, 'Ocio') && result.Ocio > 150) {
    result.Ocio = 150;
  }

  // Reducir 10% resto (excepto básicas específicas)
  const basic = new Set(['Comida']);
  Object.keys(result).forEach((cat) => {
    if (!basic.has(cat) && cat !== 'Ocio') {
      result[cat] = Math.max(0, result[cat] * 0.9);
    }
  });

  const objective = Object.values(result).reduce((a, b) => a + b, 0);
  return { status: 'success', objective_value: objective, optimized_gastos: result };
}
