const response = require('../utils/response');

/**
 * Global Error Middleware
 */
module.exports = (err, req, res, next) => {
  console.error('🔥 [Error Middleware]:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  // Si es un error de Joi (validación)
  if (err.isJoi) {
    return response.error(res, 'Error de validación', 400, err.details);
  }

  // Si es un error de MySQL (duplicados, etc)
  if (err.code === 'ER_DUP_ENTRY') {
    return response.error(res, 'El registro ya existe', 400);
  }

  response.error(res, message, statusCode, err);
};
