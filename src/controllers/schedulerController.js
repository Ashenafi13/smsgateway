const { 
  getSchedulerStatus, 
  triggerPaymentDeadlineCheck,
  triggerContractDeadlineCheck,
  triggerSmsExecution,
  executeSmsJobsByCriteria,
  getExecutionStatistics
} = require('../schedulers');
const { getConnectedClientsInfo } = require('../utils/socketHandlers');

class SchedulerController {
  // Get scheduler status
  static async getStatus(req, res) {
    try {
      const status = getSchedulerStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Get scheduler status error:', error);
      res.status(500).json({
        error: 'Failed to get scheduler status',
        message: error.message
      });
    }
  }

  // Get execution statistics
  static async getExecutionStatistics(req, res) {
    try {
      const statistics = await getExecutionStatistics();
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get execution statistics error:', error);
      res.status(500).json({
        error: 'Failed to get execution statistics',
        message: error.message
      });
    }
  }

  // Manually trigger payment deadline check
  static async triggerPaymentCheck(req, res) {
    try {
      await triggerPaymentDeadlineCheck();
      
      res.json({
        success: true,
        message: 'Payment deadline check triggered successfully'
      });
    } catch (error) {
      console.error('Trigger payment check error:', error);
      res.status(500).json({
        error: 'Failed to trigger payment deadline check',
        message: error.message
      });
    }
  }

  // Manually trigger contract deadline check
  static async triggerContractCheck(req, res) {
    try {
      await triggerContractDeadlineCheck();
      
      res.json({
        success: true,
        message: 'Contract deadline check triggered successfully'
      });
    } catch (error) {
      console.error('Trigger contract check error:', error);
      res.status(500).json({
        error: 'Failed to trigger contract deadline check',
        message: error.message
      });
    }
  }

  // Manually trigger SMS execution
  static async triggerSmsExecution(req, res) {
    try {
      await triggerSmsExecution();
      
      res.json({
        success: true,
        message: 'SMS execution triggered successfully'
      });
    } catch (error) {
      console.error('Trigger SMS execution error:', error);
      res.status(500).json({
        error: 'Failed to trigger SMS execution',
        message: error.message
      });
    }
  }

  // Execute SMS jobs by criteria
  static async executeSmsJobsByCriteria(req, res) {
    try {
      const criteria = req.body;
      const result = await executeSmsJobsByCriteria(criteria);
      
      res.json({
        success: true,
        message: 'SMS jobs executed by criteria',
        data: result
      });
    } catch (error) {
      console.error('Execute SMS jobs by criteria error:', error);
      res.status(500).json({
        error: 'Failed to execute SMS jobs by criteria',
        message: error.message
      });
    }
  }

  // Get connected Socket.IO clients info
  static async getConnectedClients(req, res) {
    try {
      const clients = getConnectedClientsInfo();
      
      res.json({
        success: true,
        data: {
          totalClients: clients.length,
          clients: clients
        }
      });
    } catch (error) {
      console.error('Get connected clients error:', error);
      res.status(500).json({
        error: 'Failed to get connected clients info',
        message: error.message
      });
    }
  }
}

module.exports = SchedulerController;
