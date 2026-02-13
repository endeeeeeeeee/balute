// src/utils/categorize.js
export function categorize(description = '', userCategories = []) {
  const d = String(description || '').toLowerCase();

  // Normalizar categorías del usuario a minúsculas para comparación
  const userCatsLower = userCategories.map(c => String(c).toLowerCase());

  // Mapeo de palabras clave a categorías sugeridas
  const suggestions = [
    { keywords: /(comida|supermercado|restaurante|pizza|almuerzo|cena|desayuno)/i, category: 'comida' },
    { keywords: /(transporte|gasolina|uber|taxi|bus|metro)/i, category: 'transporte' },
    { keywords: /(alquiler|hipoteca|renta|arriendo)/i, category: 'vivienda' },
    { keywords: /(ocio|cine|bar|fiesta|entretenimiento)/i, category: 'ocio' },
    { keywords: /(salud|medicina|doctor|hospital|farmacia)/i, category: 'salud' },
    { keywords: /(educación|curso|libro|universidad)/i, category: 'educación' },
  ];

  // Buscar coincidencia con palabras clave
  for (const { keywords, category } of suggestions) {
    if (keywords.test(d)) {
      // Buscar si el usuario tiene una categoría similar
      const matchingUserCat = userCategories.find(uc =>
        String(uc).toLowerCase() === category
      );

      if (matchingUserCat) {
        return matchingUserCat; // Devolver con la capitalización del usuario
      }
    }
  }

  // Si no hay coincidencia, devolver 'Otros' solo si existe en las categorías del usuario
  const otrosCategory = userCategories.find(c => String(c).toLowerCase() === 'otros');
  return otrosCategory || (userCategories.length > 0 ? userCategories[0] : 'Otros');
}
