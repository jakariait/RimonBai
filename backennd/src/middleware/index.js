const errorHandler = require('./errorHandler');
const { authenticate, authorize } = require('./auth');
const upload = require('./upload');
const { validate, validateBody } = require('./validate');
const mongoSanitize = require('./mongoSanitize');
const xssProtection = require('./xssProtection');

module.exports = {
  errorHandler,
  authenticate,
  authorize,
  upload,
  validate,
  validateBody,
  mongoSanitize,
  xssProtection,
};
