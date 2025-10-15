const express = require('express');
const SettingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');
const { settingsValidation } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all settings routes
router.use(authenticateToken);

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Private
 */
router.get('/', SettingsController.getSettings);

/**
 * @route   PUT /api/settings
 * @desc    Update settings
 * @access  Private
 */
router.put('/', settingsValidation.update, SettingsController.updateSettings);

/**
 * @route   GET /api/settings/days-to-deadline
 * @desc    Get number of days to deadline setting
 * @access  Private
 */
router.get('/days-to-deadline', SettingsController.getNumberOfDaysToDeadline);

/**
 * @route   PUT /api/settings/days-to-deadline
 * @desc    Update number of days to deadline setting
 * @access  Private
 */
router.put('/days-to-deadline', settingsValidation.update, SettingsController.updateNumberOfDaysToDeadline);

module.exports = router;
