/**
 * Standard utility for API responses
 */
exports.success = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

exports.error = (res, message, statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
  });
};
