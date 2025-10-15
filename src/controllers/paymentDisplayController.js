const { PaymentDisplay } = require('../models');

class PaymentDisplayController {
  // Get all payment displays with pagination
  static async getAllPaymentDisplays(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const paymentDisplays = await PaymentDisplay.findAllWithCustomers(parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: paymentDisplays,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching payment displays:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment displays',
        details: error.message
      });
    }
  }

  // Get payment display by ID
  static async getPaymentDisplayById(req, res) {
    try {
      const { id } = req.params;
      const paymentDisplay = await PaymentDisplay.findById(id);

      if (!paymentDisplay) {
        return res.status(404).json({
          success: false,
          error: 'Payment display not found'
        });
      }

      res.json({
        success: true,
        data: paymentDisplay
      });
    } catch (error) {
      console.error('Error fetching payment display:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment display',
        details: error.message
      });
    }
  }

  // Get payment displays by customer
  static async getPaymentDisplaysByCustomer(req, res) {
    try {
      const { customerId, customerType } = req.params;
      const paymentDisplays = await PaymentDisplay.findByCustomer(customerId, customerType);

      res.json({
        success: true,
        data: paymentDisplays,
        count: paymentDisplays.length
      });
    } catch (error) {
      console.error('Error fetching payment displays by customer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment displays by customer',
        details: error.message
      });
    }
  }

  // Get payment displays approaching deadline
  static async getApproachingDeadlines(req, res) {
    try {
      const { days = 3 } = req.query;
      const paymentDisplays = await PaymentDisplay.findApproachingDeadline(parseInt(days));

      res.json({
        success: true,
        data: paymentDisplays,
        count: paymentDisplays.length,
        daysToDeadline: parseInt(days)
      });
    } catch (error) {
      console.error('Error fetching approaching payment display deadlines:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch approaching payment display deadlines',
        details: error.message
      });
    }
  }

  // Get payment displays approaching deadline grouped by customer
  static async getApproachingDeadlinesGrouped(req, res) {
    try {
      const { days = 3 } = req.query;
      const customerGroups = await PaymentDisplay.findApproachingDeadlineGroupedByCustomer(parseInt(days));

      res.json({
        success: true,
        data: customerGroups,
        count: customerGroups.length,
        daysToDeadline: parseInt(days),
        summary: {
          totalCustomers: customerGroups.length,
          totalPayments: customerGroups.reduce((sum, group) => sum + group.paymentCount, 0),
          totalAmount: customerGroups.reduce((sum, group) => sum + group.totalAmount, 0)
        }
      });
    } catch (error) {
      console.error('Error fetching grouped approaching payment display deadlines:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch grouped approaching payment display deadlines',
        details: error.message
      });
    }
  }
}

module.exports = PaymentDisplayController;
