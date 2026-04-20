const express = require('express');
const controller = require('./finance.controller');
const validate = require('../../middlewares/validate.middleware');
const { movimientoSchema } = require('./finance.schema');

const router = express.Router();

// GET /api/finance - Listar todos los movimientos
router.get('/', controller.getMovements);

// GET /api/finance/summary - Resumen por días
router.get('/summary', controller.getSummary);

// GET /api/finance/analytics - Analíticas para gráficas
router.get('/analytics', controller.getAnalytics);

// GET /api/finance/stats - Estadísticas semanales/mensuales
router.get('/stats', controller.getStats);

// POST /api/finance - Registrar movimiento (venta o gasto)
router.post('/', validate(movimientoSchema), controller.createMovement);

// PUT /api/finance/:id - Actualizar movimiento
router.put('/:id', validate(movimientoSchema), controller.updateMovement);

// DELETE /api/finance/:id - Eliminar movimiento
router.delete('/:id', controller.deleteMovement);

module.exports = router;
