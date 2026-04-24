/**
 * formatters.js
 * Utilidades centralizadas para el formateo de datos en toda la aplicación.
 * Mantiene el principio DRY y asegura una consistencia visual perfecta.
 */

/**
 * Formatea un número o string numérico agregando puntos como separadores de miles (ej: 1.000.000)
 * Maneja de forma segura valores nulos, indefinidos y no-numéricos (NaN).
 * 
 * @param {string|number} val - El valor a formatear.
 * @returns {string} El valor formateado con separadores de miles.
 */
export const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return '0';
  
  const num = Number(val);
  if (isNaN(num)) return '0';

  return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
