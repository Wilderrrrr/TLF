const express = require('express');
const router = express.Router();
const controller = require('./settings.controller');

// GET /api/settings - Obtener toda la configuración
router.get('/', controller.getConfig);

// POST /api/settings/goal - Actualizar meta mensual
router.post('/goal', controller.updateGoal);

module.exports = router;
