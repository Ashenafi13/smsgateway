const express = require('express');

// Import route modules
const authRoutes = require('./auth');
const customerRoutes = require('./customers');
const smsRoutes = require('./sms');
const paymentDisplayRoutes = require('./paymentDisplay');
const contractDisplayRoutes = require('./contractDisplay');
const settingsRoutes = require('./settings');
const schedulerRoutes = require('./scheduler');
const languageRoutes = require('./language');
const templateRoutes = require('./template');

const router = express.Router();

// API Documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'SMS Gateway API',
    version: '1.0.0',
    description: 'SMS Gateway System for Payment and Contract Deadline Notifications',
    endpoints: {
      auth: '/api/auth',
      customers: '/api/customers',
      sms: '/api/sms',
      paymentDisplay: '/api/payment-display',
      contractDisplay: '/api/contract-display',
      settings: '/api/settings',
      scheduler: '/api/scheduler',
      language: '/api/language',
      templates: '/api/templates'
    },
    documentation: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/logout': 'Logout user',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile',
        'POST /api/auth/change-password': 'Change user password',
        'GET /api/auth/verify': 'Verify JWT token'
      },
      customers: {
        'GET /api/customers': 'Get all customers',
        'GET /api/customers/individuals': 'Get individual customers',
        'GET /api/customers/companies': 'Get company customers',
        'GET /api/customers/search': 'Search customers',
        'GET /api/customers/statistics': 'Get customer statistics',
        'GET /api/customers/upcoming-deadlines': 'Get customers with upcoming deadlines',
        'GET /api/customers/:type/:id': 'Get customer by ID and type',
        'GET /api/customers/:type/:id/payments': 'Get customer with payment history',
        'GET /api/customers/:type/:id/contracts': 'Get customer with contract history',
        'GET /api/customers/:type/:id/history': 'Get customer with full history'
      },
      sms: {
        'POST /api/sms/jobs': 'Create SMS job',
        'GET /api/sms/jobs': 'Get all SMS jobs',
        'GET /api/sms/jobs/statistics': 'Get SMS job statistics',
        'GET /api/sms/jobs/:id': 'Get SMS job by ID',
        'PUT /api/sms/jobs/:id/status': 'Update SMS job status',
        'POST /api/sms/jobs/:id/process': 'Process SMS job',
        'DELETE /api/sms/jobs/:id': 'Delete SMS job',
        'GET /api/sms/history': 'Get SMS history',
        'GET /api/sms/history/statistics': 'Get SMS history statistics',
        'GET /api/sms/history/daily-count': 'Get daily SMS count',
        'GET /api/sms/history/total-count': 'Get total SMS count'
      },
      settings: {
        'GET /api/settings': 'Get all settings',
        'PUT /api/settings': 'Update settings',
        'GET /api/settings/days-to-deadline': 'Get days to deadline setting',
        'PUT /api/settings/days-to-deadline': 'Update days to deadline setting'
      },
      scheduler: {
        'GET /api/scheduler/status': 'Get scheduler status',
        'GET /api/scheduler/statistics': 'Get execution statistics',
        'POST /api/scheduler/trigger/payment-check': 'Trigger payment deadline check',
        'POST /api/scheduler/trigger/contract-check': 'Trigger contract deadline check',
        'POST /api/scheduler/trigger/sms-execution': 'Trigger SMS execution',
        'POST /api/scheduler/execute-jobs': 'Execute SMS jobs by criteria',
        'GET /api/scheduler/clients': 'Get connected Socket.IO clients'
      },
      language: {
        'GET /api/language': 'Get all languages',
        'GET /api/language/statistics': 'Get language statistics',
        'GET /api/language/history': 'Get language settings history',
        'GET /api/language/:id': 'Get language by ID',
        'POST /api/language': 'Create new language',
        'PUT /api/language/:id': 'Update language',
        'DELETE /api/language/:id': 'Delete language',
        'GET /api/language/default/current': 'Get current default language',
        'POST /api/language/default/set': 'Set default language',
        'POST /api/language/initialize': 'Initialize default language settings'
      },
      templates: {
        'GET /api/templates': 'Get all SMS templates',
        'GET /api/templates/display': 'Get templates formatted for frontend display',
        'GET /api/templates/categories': 'Get all template categories',
        'GET /api/templates/statistics': 'Get template usage statistics',
        'GET /api/templates/:id': 'Get template by ID',
        'GET /api/templates/category/:category': 'Get templates by category',
        'POST /api/templates/:id/preview': 'Generate template preview with variables',
        'POST /api/templates/:id/use': 'Increment template usage count',
        'GET /api/templates/info': 'Get static template information'
      },
      paymentDisplay: {
        'GET /api/payment-display': 'Get all payment displays',
        'GET /api/payment-display/approaching-deadlines': 'Get payment displays approaching deadline',
        'GET /api/payment-display/approaching-deadlines/grouped': 'Get payment displays approaching deadline grouped by customer',
        'GET /api/payment-display/:id': 'Get payment display by ID',
        'GET /api/payment-display/customer/:customerType/:customerId': 'Get payment displays by customer'
      },
      contractDisplay: {
        'GET /api/contract-display': 'Get all contract displays',
        'GET /api/contract-display/approaching-deadlines': 'Get contract displays approaching deadline',
        'GET /api/contract-display/approaching-deadlines/grouped': 'Get contract displays approaching deadline grouped by customer',
        'GET /api/contract-display/:id': 'Get contract display by ID',
        'GET /api/contract-display/customer/:customerType/:customerId': 'Get contract displays by customer'
      }
    },
    socketEvents: {
      client_to_server: {
        'authenticate': 'Authenticate client with user credentials',
        'subscribe_sms_stats': 'Subscribe to SMS statistics updates',
        'subscribe_scheduler_status': 'Subscribe to scheduler status updates',
        'subscribe_sms_events': 'Subscribe to real-time SMS events',
        'unsubscribe': 'Unsubscribe from specific events',
        'get_current_stats': 'Request current statistics'
      },
      server_to_client: {
        'authenticated': 'Authentication confirmation',
        'authentication_error': 'Authentication error',
        'sms_statistics': 'SMS statistics update',
        'scheduler_status': 'Scheduler status update',
        'sms_event': 'Real-time SMS event',
        'error': 'Error message'
      }
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/sms', smsRoutes);
router.use('/payment-display', paymentDisplayRoutes);
router.use('/contract-display', contractDisplayRoutes);
router.use('/settings', settingsRoutes);
router.use('/scheduler', schedulerRoutes);
router.use('/language', languageRoutes);
router.use('/templates', templateRoutes);

module.exports = router;
