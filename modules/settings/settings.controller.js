const service = require('./settings.service');
const response = require('../../utils/response');

exports.getConfig = async (req, res, next) => {
  try {
    const config = await service.getConfig();
    response.success(res, 'Configuración obtenida correctamente', config);
  } catch (error) {
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const { meta } = req.body;
    await service.updateGoal(meta);
    response.success(res, 'Meta mensual actualizada');
  } catch (error) {
    next(error);
  }
};
