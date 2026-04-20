const service = require('./users.service');
const response = require('../../utils/response');

/**
 * Users Controller Layer
 */

exports.getUsers = async (req, res, next) => {
  try {
    const users = await service.getAllUsers();
    response.success(res, 'Usuarios obtenidos correctamente', users);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await service.createUser(req.body);
    response.success(res, 'Usuario creado correctamente', user, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await service.updateUser(req.params.id, req.body);
    response.success(res, 'Usuario actualizado correctamente', user);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await service.removeUser(req.params.id);
    response.success(res, 'Usuario eliminado correctamente');
  } catch (error) {
    next(error);
  }
};
