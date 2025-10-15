const { validationResult } = require('express-validator');
const CustomerService = require('../services/customerService');

class CustomerController {
  // Get all customers
  static async getAllCustomers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const customers = await CustomerService.getAllCustomers(limit, offset);

      res.json({
        success: true,
        data: customers,
        pagination: {
          limit,
          offset,
          count: customers.length
        }
      });
    } catch (error) {
      console.error('Get all customers error:', error);
      res.status(500).json({
        error: 'Failed to fetch customers',
        message: error.message
      });
    }
  }

  // Get individual customers only
  static async getIndividualCustomers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const customers = await CustomerService.getIndividualCustomers(limit, offset);

      res.json({
        success: true,
        data: customers,
        pagination: {
          limit,
          offset,
          count: customers.length
        }
      });
    } catch (error) {
      console.error('Get individual customers error:', error);
      res.status(500).json({
        error: 'Failed to fetch individual customers',
        message: error.message
      });
    }
  }

  // Get company customers only
  static async getCompanyCustomers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const customers = await CustomerService.getCompanyCustomers(limit, offset);

      res.json({
        success: true,
        data: customers,
        pagination: {
          limit,
          offset,
          count: customers.length
        }
      });
    } catch (error) {
      console.error('Get company customers error:', error);
      res.status(500).json({
        error: 'Failed to fetch company customers',
        message: error.message
      });
    }
  }

  // Get customer by ID and type
  static async getCustomerById(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id, type } = req.params;
      const customer = await CustomerService.getCustomerById(parseInt(id), type);

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error('Get customer by ID error:', error);
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          error: 'Customer not found',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to fetch customer',
        message: error.message
      });
    }
  }

  // Search customers
  static async searchCustomers(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const searchTerm = req.query.q;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      if (!searchTerm) {
        return res.status(400).json({
          error: 'Search term required',
          message: 'Please provide a search term using the "q" parameter'
        });
      }

      const customers = await CustomerService.searchCustomers(searchTerm, limit, offset);

      res.json({
        success: true,
        data: customers,
        pagination: {
          limit,
          offset,
          count: customers.length
        },
        searchTerm
      });
    } catch (error) {
      console.error('Search customers error:', error);
      res.status(400).json({
        error: 'Search failed',
        message: error.message
      });
    }
  }

  // Get customer with payment history
  static async getCustomerWithPayments(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id, type } = req.params;
      const result = await CustomerService.getCustomerWithPayments(parseInt(id), type);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get customer with payments error:', error);
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          error: 'Customer not found',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to fetch customer with payments',
        message: error.message
      });
    }
  }

  // Get customer with contract history
  static async getCustomerWithContracts(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id, type } = req.params;
      const result = await CustomerService.getCustomerWithContracts(parseInt(id), type);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get customer with contracts error:', error);
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          error: 'Customer not found',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to fetch customer with contracts',
        message: error.message
      });
    }
  }

  // Get customer with full history
  static async getCustomerWithFullHistory(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id, type } = req.params;
      const result = await CustomerService.getCustomerWithFullHistory(parseInt(id), type);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get customer with full history error:', error);
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          error: 'Customer not found',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to fetch customer with full history',
        message: error.message
      });
    }
  }

  // Get customer statistics
  static async getCustomerStatistics(req, res) {
    try {
      const statistics = await CustomerService.getCustomerStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get customer statistics error:', error);
      res.status(500).json({
        error: 'Failed to fetch customer statistics',
        message: error.message
      });
    }
  }

  // Get customers with upcoming deadlines
  static async getCustomersWithUpcomingDeadlines(req, res) {
    try {
      const daysToDeadline = parseInt(req.query.days) || 7;
      const type = req.query.type; // 'payment', 'contract', or undefined for both

      let result = {};

      if (!type || type === 'payment') {
        result.paymentDeadlines = await CustomerService.getCustomersWithUpcomingPaymentDeadlines(daysToDeadline);
      }

      if (!type || type === 'contract') {
        result.contractDeadlines = await CustomerService.getCustomersWithUpcomingContractDeadlines(daysToDeadline);
      }

      res.json({
        success: true,
        data: result,
        daysToDeadline
      });
    } catch (error) {
      console.error('Get customers with upcoming deadlines error:', error);
      res.status(500).json({
        error: 'Failed to fetch customers with upcoming deadlines',
        message: error.message
      });
    }
  }
}

module.exports = CustomerController;
