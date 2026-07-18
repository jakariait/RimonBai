const xss = require('xss');

function sanitizeValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(item => sanitizeValue(item));
  if (typeof value === 'object') {
    const sanitized = {};
    for (const key of Object.keys(value)) {
      sanitized[xss(key)] = sanitizeValue(value[key]);
    }
    return sanitized;
  }
  return value;
}

function xssProtection(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key]);
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeValue(req.params[key]);
    }
  }
  next();
}

module.exports = xssProtection;
