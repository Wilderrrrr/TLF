const service = require('./finance.service');
const response = require('../../utils/response');

/**
 * Finance Controller Layer
 */

exports.createMovement = async (req, res, next) => {
  try {
    const movement = await service.create(req.body);
    response.success(res, 'Movimiento registrado correctamente', movement, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateMovement = async (req, res, next) => {
  try {
    const movement = await service.update(req.params.id, req.body);
    response.success(res, 'Movimiento actualizado correctamente', movement);
  } catch (error) {
    next(error);
  }
};

exports.deleteMovement = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    response.success(res, 'Movimiento eliminado correctamente');
  } catch (error) {
    next(error);
  }
};

exports.getMovements = async (req, res, next) => {
  try {
    const movements = await service.getAllMovements();
    response.success(res, 'Movimientos obtenidos correctamente', movements);
  } catch (error) {
    next(error);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await service.getSummary();
    response.success(res, 'Resumen diario obtenido correctamente', summary);
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await service.getPeriodicStats();
    response.success(res, 'Estadísticas periódicas obtenidas correctamente', stats);
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const days = req.query.days || 30;
    const analytics = await service.getDashboardAnalytics(days);
    response.success(res, 'Analíticas del dashboard obtenidas correctamente', analytics);
  } catch (error) {
    next(error);
  }
};
