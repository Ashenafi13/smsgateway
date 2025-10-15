const express = require('express');
const router = express.Router();
const PaymentDisplayController = require('../controllers/paymentDisplayController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all payment displays with pagination
router.get('/', PaymentDisplayController.getAllPaymentDisplays);

// Get payment displays approaching deadline
router.get('/approaching-deadlines', PaymentDisplayController.getApproachingDeadlines);

// Get payment displays approaching deadline grouped by customer
router.get('/approaching-deadlines/grouped', PaymentDisplayController.getApproachingDeadlinesGrouped);

// Get payment display by ID
router.get('/:id', PaymentDisplayController.getPaymentDisplayById);

// Get payment displays by customer
router.get('/customer/:customerType/:customerId', PaymentDisplayController.getPaymentDisplaysByCustomer);

module.exports = router;
