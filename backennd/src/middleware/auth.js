const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { ROLES_HIERARCHY, ROLES } = require('../constants');

const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const hasAccess = allowedRoles.some((role) => {
      if (role === ROLES.SUPER_ADMIN) return userRole === ROLES.SUPER_ADMIN;
      if (role === ROLES.ADMIN) return userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;
      return userRole === role;
    });

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
