const express = require('express');
const router = express.Router();
const LanguageController = require('../controllers/languageController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');

// Validation middleware
const validateLanguage = [
  body('lang')
    .notEmpty()
    .withMessage('Language name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Language name must be between 2 and 50 characters'),
  body('code')
    .notEmpty()
    .withMessage('Language code is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Language code must be between 2 and 10 characters')
    .matches(/^[a-z]{2,10}$/)
    .withMessage('Language code must contain only lowercase letters'),
  handleValidationErrors
];

const validateDefaultLanguage = [
  body('languageId')
    .notEmpty()
    .withMessage('Language ID is required')
    .isInt({ min: 1 })
    .withMessage('Language ID must be a positive integer'),
  handleValidationErrors
];

// Default language settings routes (must come before /:id routes)
router.get('/default/current', authenticateToken, LanguageController.getDefaultLanguage);
router.post('/default/set', authenticateToken, validateDefaultLanguage, LanguageController.setDefaultLanguage);

// Initialization route (for setup)
router.post('/initialize', authenticateToken, LanguageController.initializeDefaults);

// Language management routes
router.get('/', authenticateToken, LanguageController.getLanguages);
router.get('/statistics', authenticateToken, LanguageController.getLanguageStatistics);
router.get('/history', authenticateToken, LanguageController.getLanguageHistory);
router.post('/', authenticateToken, validateLanguage, LanguageController.createLanguage);

// Routes with :id parameter (must come last)
router.get('/:id', authenticateToken, LanguageController.getLanguageById);
router.put('/:id', authenticateToken, validateLanguage, LanguageController.updateLanguage);
router.delete('/:id', authenticateToken, LanguageController.deleteLanguage);

module.exports = router;
