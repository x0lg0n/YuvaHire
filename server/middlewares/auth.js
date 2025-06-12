const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check token expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    // Set user info in request object
    req.user = {
      id: decoded.id,
      userId: decoded.id, // Add userId for compatibility
      username: decoded.username,
      role: decoded.role,
      college_name: decoded.college_name
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    // Convert single role to array for uniform handling
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Super admin has access to everything
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { authMiddleware, requireRole };

