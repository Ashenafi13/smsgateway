const express = require('express');
const SmsController = require('../controllers/smsController');
const { authenticateToken } = require('../middleware/auth');
const { smsValidation, paginationValidation, dateRangeValidation } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all SMS routes
router.use(authenticateToken);

// SMS Scheduler Jobs Routes

/**
 * @route   POST /api/sms/jobs
 * @desc    Create a new SMS job
 * @access  Private
 */
router.post('/jobs', smsValidation.createJob, SmsController.createSmsJob);

/**
 * @route   GET /api/sms/jobs
 * @desc    Get all SMS jobs (with optional status filter)
 * @access  Private
 */
router.get('/jobs', paginationValidation, SmsController.getAllSmsJobs);

/**
 * @route   GET /api/sms/jobs/statistics
 * @desc    Get SMS job statistics
 * @access  Private
 */
router.get('/jobs/statistics', SmsController.getSmsJobStatistics);

/**
 * @route   GET /api/sms/jobs/:id
 * @desc    Get SMS job by ID
 * @access  Private
 */
router.get('/jobs/:id', SmsController.getSmsJobById);

/**
 * @route   PUT /api/sms/jobs/:id/status
 * @desc    Update SMS job status
 * @access  Private
 */
router.put('/jobs/:id/status', smsValidation.updateJobStatus, SmsController.updateSmsJobStatus);

/**
 * @route   POST /api/sms/jobs/:id/process
 * @desc    Process SMS job (send SMS and update status)
 * @access  Private
 */
router.post('/jobs/:id/process', SmsController.processSmsJob);

/**
 * @route   DELETE /api/sms/jobs/:id
 * @desc    Delete SMS job
 * @access  Private
 */
router.delete('/jobs/:id', SmsController.deleteSmsJob);

// SMS History Routes

/**
 * @route   GET /api/sms/history
 * @desc    Get SMS history (with optional filters)
 * @access  Private
 */
router.get('/history', [...paginationValidation, ...dateRangeValidation], SmsController.getAllSmsHistory);

/**
 * @route   GET /api/sms/history/statistics
 * @desc    Get SMS history statistics
 * @access  Private
 */
router.get('/history/statistics', SmsController.getSmsHistoryStatistics);

/**
 * @route   GET /api/sms/history/daily-count
 * @desc    Get daily SMS count
 * @access  Private
 */
router.get('/history/daily-count', SmsController.getDailySmsCount);

/**
 * @route   GET /api/sms/history/total-count
 * @desc    Get total SMS count
 * @access  Private
 */
router.get('/history/total-count', SmsController.getTotalSmsCount);

module.exports = router;
