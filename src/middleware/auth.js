const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          fullName: user.fullName
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Middleware to check if user is admin (placeholder for future role-based access)
const requireAdmin = (req, res, next) => {
  // For now, all authenticated users are considered admins
  // This can be extended later with role-based access control
  if (!req.user) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authentication required'
    });
  }

  next();
};

// Rate limiting middleware for authentication endpoints
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    
    // Clean up old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }

    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        error: 'Too many attempts',
        message: `Too many authentication attempts. Please try again later.`,
        retryAfter: Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000)
      });
    }

    userAttempts.count++;
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  authRateLimit
};
