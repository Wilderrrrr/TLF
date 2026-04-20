const Joi = require('joi');

/**
 * Client Validation Schemas
 */

const clientSchema = Joi.object({
  nombre: Joi.string().min(3).max(150).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
  }),
  documento: Joi.string().min(5).max(50).allow(null, '').messages({
    'string.min': 'El documento debe tener al menos 5 caracteres',
  }),
  telefono: Joi.string().allow(null, '').max(20),
  deuda: Joi.number().min(0).default(0),
  notas: Joi.string().allow(null, ''),
  activo: Joi.boolean().default(true),
}).unknown();

const updateSchema = Joi.object({
  nombre: Joi.string().min(3).max(150),
  documento: Joi.string().min(5).max(50).allow(null, ''),
  telefono: Joi.string().allow(null, '').max(20),
  deuda: Joi.number().min(0),
  notas: Joi.string().allow(null, ''),
  activo: Joi.boolean(),
}).unknown();

module.exports = {
  clientSchema,
  updateSchema
};
