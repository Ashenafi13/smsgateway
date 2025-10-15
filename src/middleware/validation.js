const { body, query, param } = require('express-validator');

// Authentication validation rules
const authValidation = {
  // Register validation
  register: [
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Full name must be between 2 and 255 characters'),
    
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Username must be between 3 and 100 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],

  // Login validation
  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Update profile validation
  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Full name must be between 2 and 255 characters'),
    
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Username must be between 3 and 100 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
  ],

  // Change password validation
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
  ]
};

// SMS validation rules
const smsValidation = {
  // Create SMS job validation
  createJob: [
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message must not exceed 1000 characters'),
    
    body('executeDate')
      .optional()
      .isISO8601()
      .withMessage('Execute date must be a valid date'),
    
    body('jobtype')
      .optional()
      .trim()
      .isIn(['payment_reminder', 'contract_reminder', 'manual'])
      .withMessage('Job type must be payment_reminder, contract_reminder, or manual')
  ],

  // Update job status validation
  updateJobStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Job ID must be a positive integer'),
    
    body('status')
      .trim()
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'completed', 'failed', 'cancelled'])
      .withMessage('Status must be pending, completed, failed, or cancelled')
  ]
};

// Settings validation rules
const settingsValidation = {
  // Update settings validation
  update: [
    body('numberOfDaysToDeadline')
      .isInt({ min: 1, max: 365 })
      .withMessage('Number of days to deadline must be between 1 and 365')
  ]
};

// Customer validation rules
const customerValidation = {
  // Search customers validation
  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters long'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],

  // Get customer by ID validation
  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Customer ID must be a positive integer'),
    
    param('type')
      .isIn(['ind', 'com'])
      .withMessage('Customer type must be "ind" or "com"')
  ]
};

// Pagination validation rules
const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

// Date range validation rules
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

module.exports = {
  authValidation,
  smsValidation,
  settingsValidation,
  customerValidation,
  paginationValidation,
  dateRangeValidation
};
