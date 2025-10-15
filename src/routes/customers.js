const express = require('express');
const CustomerController = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/auth');
const { customerValidation, paginationValidation } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all customer routes
router.use(authenticateToken);

/**
 * @route   GET /api/customers
 * @desc    Get all customers (both individual and company)
 * @access  Private
 */
router.get('/', paginationValidation, CustomerController.getAllCustomers);

/**
 * @route   GET /api/customers/individuals
 * @desc    Get individual customers only
 * @access  Private
 */
router.get('/individuals', paginationValidation, CustomerController.getIndividualCustomers);

/**
 * @route   GET /api/customers/companies
 * @desc    Get company customers only
 * @access  Private
 */
router.get('/companies', paginationValidation, CustomerController.getCompanyCustomers);

/**
 * @route   GET /api/customers/search
 * @desc    Search customers by name, phone, or email
 * @access  Private
 */
router.get('/search', customerValidation.search, CustomerController.searchCustomers);

/**
 * @route   GET /api/customers/statistics
 * @desc    Get customer statistics
 * @access  Private
 */
router.get('/statistics', CustomerController.getCustomerStatistics);

/**
 * @route   GET /api/customers/upcoming-deadlines
 * @desc    Get customers with upcoming payment or contract deadlines
 * @access  Private
 */
router.get('/upcoming-deadlines', CustomerController.getCustomersWithUpcomingDeadlines);

/**
 * @route   GET /api/customers/:type/:id
 * @desc    Get customer by ID and type
 * @access  Private
 */
router.get('/:type/:id', customerValidation.getById, CustomerController.getCustomerById);

/**
 * @route   GET /api/customers/:type/:id/payments
 * @desc    Get customer with payment history
 * @access  Private
 */
router.get('/:type/:id/payments', customerValidation.getById, CustomerController.getCustomerWithPayments);

/**
 * @route   GET /api/customers/:type/:id/contracts
 * @desc    Get customer with contract history
 * @access  Private
 */
router.get('/:type/:id/contracts', customerValidation.getById, CustomerController.getCustomerWithContracts);

/**
 * @route   GET /api/customers/:type/:id/history
 * @desc    Get customer with full history (payments and contracts)
 * @access  Private
 */
router.get('/:type/:id/history', customerValidation.getById, CustomerController.getCustomerWithFullHistory);

module.exports = router;
