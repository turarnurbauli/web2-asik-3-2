const User = require('../models/User');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

async function attachUserIfExists(req, _res, next) {
  if (!req.session.user) {
    req.user = null;
    return next();
  }
  req.user = req.session.user;
  next();
}

function enforceOwnershipOrAdmin(getResourceOwnerId) {
  return async (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = req.session.user;
    try {
      const ownerId = await getResourceOwnerId(req);
      if (!ownerId) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (user.role === 'admin' || ownerId.toString() === user.id) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

module.exports = {
  requireAuth,
  requireRole,
  attachUserIfExists,
  enforceOwnershipOrAdmin
};

