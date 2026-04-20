const service = require('./products.service');
const response = require('../../utils/response');

/**
 * Product Controller Layer
 */

exports.createProduct = async (req, res, next) => {
  try {
    const { nombre, precio } = req.body;
    if (!nombre) return response.error(res, 'El nombre del producto es obligatorio', 400);
    if (!precio || isNaN(parseFloat(precio))) return response.error(res, 'El precio debe ser un número válido', 400);

    const product = await service.create(req.body);
    response.success(res, 'Producto creado correctamente', product, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { nombre, precio } = req.body;
    if (!nombre) return response.error(res, 'El nombre del producto es obligatorio', 400);
    if (!precio || isNaN(parseFloat(precio))) return response.error(res, 'El precio debe ser un número válido', 400);

    const product = await service.update(req.params.id, req.body);
    response.success(res, 'Producto actualizado correctamente', product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    response.success(res, 'Producto eliminado correctamente');
  } catch (error) {
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await service.getAll();
    response.success(res, 'Productos obtenidos correctamente', products);
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await service.getById(req.params.id);
    if (!product) return response.error(res, 'Producto no encontrado', 404);
    response.success(res, 'Producto obtenido correctamente', product);
  } catch (error) {
    next(error);
  }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const products = await service.getLowStock();
    response.success(res, 'Alertas de stock bajo obtenidas', products);
  } catch (error) {
    next(error);
  }
};
