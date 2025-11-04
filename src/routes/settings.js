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

/**
 * @route   GET /api/settings/sms
 * @desc    Get SMS settings
 * @access  Private
 */
router.get('/sms', SettingsController.getSmsSettings);

/**
 * @route   PUT /api/settings/sms
 * @desc    Update SMS settings
 * @access  Private
 */
router.put('/sms', settingsValidation.update, SettingsController.updateSmsSettings);

/**
 * @route   GET /api/settings/scheduler/status
 * @desc    Get scheduler status
 * @access  Private
 */
router.get('/scheduler/status', SettingsController.getSchedulerStatus);

/**
 * @route   PUT /api/settings/scheduler/status
 * @desc    Update scheduler status (0 = inactive, 1 = active)
 * @access  Private
 */
router.put('/scheduler/status', settingsValidation.update, SettingsController.updateSchedulerStatus);

module.exports = router;
