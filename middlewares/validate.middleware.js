/**
 * Generic Joi Validation Middleware
 */
module.exports = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      error.isJoi = true; // Marcamos para el error.middleware
      return next(error);
    }

    next();
  };
};
