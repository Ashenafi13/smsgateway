const express = require('express');
const SchedulerController = require('../controllers/schedulerController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all scheduler routes
router.use(authenticateToken);

/**
 * @route   GET /api/scheduler/status
 * @desc    Get scheduler status
 * @access  Private
 */
router.get('/status', SchedulerController.getStatus);

/**
 * @route   GET /api/scheduler/statistics
 * @desc    Get execution statistics
 * @access  Private
 */
router.get('/statistics', SchedulerController.getExecutionStatistics);

/**
 * @route   POST /api/scheduler/trigger/payment-check
 * @desc    Manually trigger payment deadline check
 * @access  Private
 */
router.post('/trigger/payment-check', SchedulerController.triggerPaymentCheck);

/**
 * @route   POST /api/scheduler/trigger/contract-check
 * @desc    Manually trigger contract deadline check
 * @access  Private
 */
router.post('/trigger/contract-check', SchedulerController.triggerContractCheck);

/**
 * @route   POST /api/scheduler/trigger/payment-display-check
 * @desc    Manually trigger payment display deadline check
 * @access  Private
 */
router.post('/trigger/payment-display-check', SchedulerController.triggerPaymentDisplayCheck);

/**
 * @route   POST /api/scheduler/trigger/contract-display-check
 * @desc    Manually trigger contract display deadline check
 * @access  Private
 */
router.post('/trigger/contract-display-check', SchedulerController.triggerContractDisplayCheck);

/**
 * @route   POST /api/scheduler/trigger/sms-execution
 * @desc    Manually trigger SMS execution
 * @access  Private
 */
router.post('/trigger/sms-execution', SchedulerController.triggerSmsExecution);

/**
 * @route   POST /api/scheduler/execute-jobs
 * @desc    Execute SMS jobs by criteria
 * @access  Private
 */
router.post('/execute-jobs', SchedulerController.executeSmsJobsByCriteria);

/**
 * @route   GET /api/scheduler/clients
 * @desc    Get connected Socket.IO clients info
 * @access  Private
 */
router.get('/clients', SchedulerController.getConnectedClients);

module.exports = router;
