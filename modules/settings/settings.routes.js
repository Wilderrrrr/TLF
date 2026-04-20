const express = require('express');
const router = express.Router();
const controller = require('./settings.controller');

// GET /api/settings - Obtener toda la configuración
router.get('/', controller.getConfig);

// POST /api/settings/goal - Actualizar meta mensual
router.post('/goal', controller.updateGoal);

// POST /api/settings/fixed-expenses - Agregar gasto fijo
router.post('/fixed-expenses', controller.addFixedExpense);

// DELETE /api/settings/fixed-expenses/:id - Eliminar gasto fijo
router.delete('/fixed-expenses/:id', controller.deleteFixedExpense);

module.exports = router;
