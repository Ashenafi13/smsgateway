// Export all middleware
const { authenticateToken, optionalAuth, requireAdmin, authRateLimit } = require('./auth');
const { errorHandler, notFound } = require('./errorHandler');
const { 
  authValidation, 
  smsValidation, 
  settingsValidation, 
  customerValidation, 
  paginationValidation, 
  dateRangeValidation 
} = require('./validation');

module.exports = {
  // Authentication middleware
  authenticateToken,
  optionalAuth,
  requireAdmin,
  authRateLimit,
  
  // Error handling middleware
  errorHandler,
  notFound,
  
  // Validation middleware
  authValidation,
  smsValidation,
  settingsValidation,
  customerValidation,
  paginationValidation,
  dateRangeValidation
};
