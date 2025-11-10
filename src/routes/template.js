const express = require('express');
const TemplateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all template routes
router.use(authenticateToken);

// Validation middleware for template preview
const validateTemplatePreview = [
  body().custom((value, { req }) => {
    // Allow any object for variables - we'll validate specific variables in the controller
    if (typeof value !== 'object') {
      throw new Error('Request body must be an object containing template variables');
    }
    return true;
  }),
  handleValidationErrors
];

// Template display routes (for frontend)
router.get('/display', TemplateController.getTemplatesForDisplay);

// Template preview route (must come before /:id route)
router.post('/:id/preview', validateTemplatePreview, TemplateController.getTemplatePreview);

// Template usage tracking
router.post('/:id/use', TemplateController.incrementUsage);

// Template management routes
router.get('/', TemplateController.getAllTemplates);
router.get('/categories', TemplateController.getCategories);
router.get('/statistics', TemplateController.getStatistics);

// Template info route (static templates info)
router.get('/info', TemplateController.getTemplateInfo);

// Category-specific routes
router.get('/category/:category', TemplateController.getTemplatesByCategory);

// Routes with :id parameter (must come last)
router.get('/:id', TemplateController.getTemplateById);
router.put('/:id', TemplateController.updateTemplate);

module.exports = router;
