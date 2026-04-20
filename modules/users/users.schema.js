const Joi = require('joi');

/**
 * User Validation Schemas
 */

const userSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
  }),
  usuario: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.empty': 'El usuario es obligatorio',
    'string.alphanum': 'El usuario solo puede contener letras y números',
  }),
  email: Joi.string().email().allow(null, '').messages({
    'string.email': 'El correo electrónico debe ser válido',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es obligatoria',
  }),
  rol: Joi.string().valid('admin', 'vendedor').default('vendedor'),
  activo: Joi.boolean().default(true),
}).unknown();

const updateSchema = Joi.object({
    nombre: Joi.string().min(3).max(100),
    usuario: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email().allow(null, ''),
    password: Joi.string().min(6).allow(null, ''),
    rol: Joi.string().valid('admin', 'vendedor'),
    activo: Joi.boolean(),
}).unknown();

module.exports = {
  userSchema,
  updateSchema
};
