const { ContractDisplay } = require('../models');

class ContractDisplayController {
  // Get all contract displays with pagination
  static async getAllContractDisplays(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const contractDisplays = await ContractDisplay.findAllWithCustomers(parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: contractDisplays,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching contract displays:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contract displays',
        details: error.message
      });
    }
  }

  // Get contract display by ID
  static async getContractDisplayById(req, res) {
    try {
      const { id } = req.params;
      const contractDisplay = await ContractDisplay.findById(id);

      if (!contractDisplay) {
        return res.status(404).json({
          success: false,
          error: 'Contract display not found'
        });
      }

      res.json({
        success: true,
        data: contractDisplay
      });
    } catch (error) {
      console.error('Error fetching contract display:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contract display',
        details: error.message
      });
    }
  }

  // Get contract displays by customer
  static async getContractDisplaysByCustomer(req, res) {
    try {
      const { customerId, customerType } = req.params;
      const contractDisplays = await ContractDisplay.findByCustomer(customerId, customerType);

      res.json({
        success: true,
        data: contractDisplays,
        count: contractDisplays.length
      });
    } catch (error) {
      console.error('Error fetching contract displays by customer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contract displays by customer',
        details: error.message
      });
    }
  }

  // Get contract displays approaching deadline
  static async getApproachingDeadlines(req, res) {
    try {
      const { days = 3 } = req.query;
      const contractDisplays = await ContractDisplay.findApproachingDeadline(parseInt(days));

      res.json({
        success: true,
        data: contractDisplays,
        count: contractDisplays.length,
        daysToDeadline: parseInt(days)
      });
    } catch (error) {
      console.error('Error fetching approaching contract display deadlines:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch approaching contract display deadlines',
        details: error.message
      });
    }
  }

  // Get contract displays approaching deadline grouped by customer
  static async getApproachingDeadlinesGrouped(req, res) {
    try {
      const { days = 3 } = req.query;
      const customerGroups = await ContractDisplay.findApproachingDeadlineGroupedByCustomer(parseInt(days));

      res.json({
        success: true,
        data: customerGroups,
        count: customerGroups.length,
        daysToDeadline: parseInt(days),
        summary: {
          totalCustomers: customerGroups.length,
          totalContracts: customerGroups.reduce((sum, group) => sum + group.contractCount, 0),
          totalRent: customerGroups.reduce((sum, group) => sum + group.totalRent, 0)
        }
      });
    } catch (error) {
      console.error('Error fetching grouped approaching contract display deadlines:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch grouped approaching contract display deadlines',
        details: error.message
      });
    }
  }
}

module.exports = ContractDisplayController;
