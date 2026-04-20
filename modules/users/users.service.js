const model = require('./users.model');
const bcrypt = require('bcryptjs');

/**
 * Users Business Logic Layer
 */

exports.getAllUsers = async () => {
  return await model.findAll();
};

exports.createUser = async (userData) => {
  // Verificar si el usuario ya existe
  const existingUser = await model.findByUsername(userData.usuario);
  if (existingUser) {
    const error = new Error('El nombre de usuario ya está en uso');
    error.statusCode = 400;
    throw error;
  }

  // Encriptar contraseña
  const salt = await bcrypt.genSalt(10);
  userData.password = await bcrypt.hash(userData.password, salt);

  return await model.create(userData);
};

exports.updateUser = async (id, userData) => {
  const existing = await model.findById(id);
  if (!existing) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Si hay nueva contraseña, encriptarla
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  } else {
      delete userData.password; // No sobreescribir con null/vacio
  }

  return await model.update(id, userData);
};

exports.removeUser = async (id) => {
  // No permitir borrar al admin principal (id: 1 o usuario: admin)
  const user = await model.findById(id);
  if (user && user.usuario === 'admin') {
      const error = new Error('No se puede eliminar al administrador principal');
      error.statusCode = 400;
      throw error;
  }
  return await model.remove(id);
};
