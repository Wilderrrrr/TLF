const express = require('express');
const controller = require('./clients.controller');
const validate = require('../../middlewares/validate.middleware');
const { clientSchema, updateSchema } = require('./clients.schema');

const router = express.Router();

// GET /api/clients - Listar todos los clientes
router.get('/', controller.getClients);

// GET /api/clients/:id - Obtener un cliente por ID
router.get('/:id', controller.getClientById);

// POST /api/clients - Crear un nuevo cliente
router.post('/', validate(clientSchema), controller.createClient);

// PUT /api/clients/:id - Actualizar un cliente
router.put('/:id', validate(updateSchema), controller.updateClient);

// DELETE /api/clients/:id - Eliminar un cliente
router.delete('/:id', controller.deleteClient);

module.exports = router;
