const Joi = require('joi');

const dateUtils = require('../../utils/date');

/**
 * Finance Validation Schemas
 */

const movimientoSchema = Joi.object({
  tipo: Joi.string().valid('venta', 'gasto', 'abono').required().messages({
    'any.only': 'El tipo debe ser "venta", "gasto" o "abono"',
    'any.required': 'El tipo es obligatorio',
  }),
  monto: Joi.number().positive().required().messages({
    'number.base': 'El monto debe ser un número',
    'number.positive': 'El monto debe ser mayor a 0',
    'any.required': 'El monto es obligatorio',
  }),
  descripcion: Joi.string().max(255).allow('').messages({
    'string.max': 'La descripción no puede pasar los 255 caracteres',
  }),
  fecha: Joi.date().iso().default(() => dateUtils.getToday()).messages({
    'date.format': 'La fecha debe tener un formato válido (YYYY-MM-DD)',
  }),
  cliente_id: Joi.number().allow(null).optional(),
  metodo_pago: Joi.string().valid('Efectivo', 'Transferencia').default('Efectivo').messages({
    'any.only': 'El método de pago debe ser "Efectivo" o "Transferencia"',
  }),
  productos: Joi.array().items(Joi.object({
    id: Joi.number().required(),
    nombre: Joi.string().required(),
    precio: Joi.number().required(),
    cantidad: Joi.number().min(1).required(),
  }).unknown()).optional(),
}).unknown();

module.exports = {
  movimientoSchema,
};
