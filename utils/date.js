/**
 * Utilidad centralizada para manejo de fechas y zona horaria
 */

// Zona horaria por defecto (Colombia/Perú/Ecuador)
const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || 'America/Bogota';

/**
 * Retorna la fecha actual en formato YYYY-MM-DD según la zona horaria configurada
 */
exports.getToday = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE });
};

/**
 * Retorna un objeto Date ajustado a la zona horaria configurada
 */
exports.getNow = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const map = parts.reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  
  return new Date(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
};

exports.TIMEZONE = DEFAULT_TIMEZONE;
