const service = require('./clients.service');

/**
 * Clients Controller
 */

exports.getClients = async (req, res, next) => {
  try {
    const clients = await service.getAll();
    res.json({
      status: 'success',
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

exports.getClientById = async (req, res, next) => {
  try {
    const client = await service.getById(req.params.id);
    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Cliente no encontrado'
      });
    }
    res.json({
      status: 'success',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

exports.createClient = async (req, res, next) => {
  try {
    const client = await service.create(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Cliente creado con éxito',
      data: client
    });
  } catch (error) {
    // Manejar error de documento duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un cliente con ese documento'
      });
    }
    next(error);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const client = await service.update(req.params.id, req.body);
    res.json({
      status: 'success',
      message: 'Cliente actualizado con éxito',
      data: client
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe otro cliente con ese documento'
      });
    }
    next(error);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({
      status: 'success',
      message: 'Cliente eliminado con éxito'
    });
  } catch (error) {
    next(error);
  }
};
