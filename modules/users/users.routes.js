const express = require('express');
const controller = require('./users.controller');
const validate = require('../../middlewares/validate.middleware');
const { userSchema, updateSchema } = require('./users.schema');

const router = express.Router();

// GET /api/users - Listar todos los usuarios
router.get('/', controller.getUsers);

// POST /api/users - Crear un nuevo usuario
router.post('/', validate(userSchema), controller.createUser);

// PUT /api/users/:id - Actualizar un usuario
router.put('/:id', validate(updateSchema), controller.updateUser);

// DELETE /api/users/:id - Eliminar un usuario
router.delete('/:id', controller.deleteUser);

module.exports = router;
