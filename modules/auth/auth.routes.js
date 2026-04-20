const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const rateLimit = require('express-rate-limit');

// Configurar limitador para evitar ataques de fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos de bloqueo
  max: 5, // Limita cada IP a 5 peticiones por `window` (aquí, por 15 minutos)
  message: {
    status: 'error',
    message: 'Demasiados intentos de inicio de sesión. Por seguridad, intente nuevamente después de 15 minutos.'
  },
  standardHeaders: true, // Devuelve información de bloqueo en las cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*`
});

// POST /api/auth/login
router.post('/login', loginLimiter, authController.login);

module.exports = router;
