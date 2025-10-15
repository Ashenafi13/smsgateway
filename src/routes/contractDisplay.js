const express = require('express');
const router = express.Router();
const ContractDisplayController = require('../controllers/contractDisplayController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all contract displays with pagination
router.get('/', ContractDisplayController.getAllContractDisplays);

// Get contract displays approaching deadline
router.get('/approaching-deadlines', ContractDisplayController.getApproachingDeadlines);

// Get contract displays approaching deadline grouped by customer
router.get('/approaching-deadlines/grouped', ContractDisplayController.getApproachingDeadlinesGrouped);

// Get contract display by ID
router.get('/:id', ContractDisplayController.getContractDisplayById);

// Get contract displays by customer
router.get('/customer/:customerType/:customerId', ContractDisplayController.getContractDisplaysByCustomer);

module.exports = router;
