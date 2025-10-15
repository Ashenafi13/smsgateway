const { validationResult } = require('express-validator');
const SmsService = require('../services/smsService');

class SmsController {
  // SMS Scheduler Jobs
  static async createSmsJob(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const job = await SmsService.createSmsJob(req.body);

      res.status(201).json({
        success: true,
        message: 'SMS job created successfully',
        data: job
      });
    } catch (error) {
      console.error('Create SMS job error:', error);
      res.status(400).json({
        error: 'Failed to create SMS job',
        message: error.message
      });
    }
  }

  static async getAllSmsJobs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const status = req.query.status;

      let jobs;
      if (status) {
        jobs = await SmsService.getSmsJobsByStatus(status);
      } else {
        jobs = await SmsService.getAllSmsJobs(limit, offset);
      }

      res.json({
        success: true,
        data: jobs,
        pagination: {
          limit,
          offset,
          count: jobs.length
        }
      });
    } catch (error) {
      console.error('Get SMS jobs error:', error);
      res.status(500).json({
        error: 'Failed to fetch SMS jobs',
        message: error.message
      });
    }
  }

  static async getSmsJobById(req, res) {
    try {
      const { id } = req.params;
      const job = await SmsService.getSmsJobById(parseInt(id));

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error('Get SMS job by ID error:', error);
      if (error.message === 'SMS job not found') {
        return res.status(404).json({
          error: 'SMS job not found',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to fetch SMS job',
        message: error.message
      });
    }
  }

  static async updateSmsJobStatus(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { status } = req.body;

      const job = await SmsService.updateSmsJobStatus(parseInt(id), status);

      res.json({
        success: true,
        message: 'SMS job status updated successfully',
        data: job
      });
    } catch (error) {
      console.error('Update SMS job status error:', error);
      if (error.message === 'SMS job not found') {
        return res.status(404).json({
          error: 'SMS job not found',
          message: error.message
        });
      }
      res.status(400).json({
        error: 'Failed to update SMS job status',
        message: error.message
      });
    }
  }

  static async deleteSmsJob(req, res) {
    try {
      const { id } = req.params;
      const result = await SmsService.deleteSmsJob(parseInt(id));

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete SMS job error:', error);
      if (error.message === 'SMS job not found') {
        return res.status(404).json({
          error: 'SMS job not found',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to delete SMS job',
        message: error.message
      });
    }
  }

  static async getSmsJobStatistics(req, res) {
    try {
      const statistics = await SmsService.getSmsJobStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get SMS job statistics error:', error);
      res.status(500).json({
        error: 'Failed to fetch SMS job statistics',
        message: error.message
      });
    }
  }

  static async processSmsJob(req, res) {
    try {
      const { id } = req.params;
      const result = await SmsService.processSmsJob(parseInt(id));

      res.json({
        success: true,
        message: result.message,
        data: result.smsResult
      });
    } catch (error) {
      console.error('Process SMS job error:', error);
      res.status(400).json({
        error: 'Failed to process SMS job',
        message: error.message
      });
    }
  }

  // SMS History
  static async getAllSmsHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const type = req.query.type;
      const phoneNumber = req.query.phoneNumber;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      let history;

      if (phoneNumber) {
        history = await SmsService.getSmsHistoryByPhoneNumber(phoneNumber, limit, offset);
      } else if (type) {
        history = await SmsService.getSmsHistoryByType(type, limit, offset);
      } else if (startDate && endDate) {
        history = await SmsService.getSmsHistoryByDateRange(new Date(startDate), new Date(endDate), limit, offset);
      } else {
        history = await SmsService.getAllSmsHistory(limit, offset);
      }

      res.json({
        success: true,
        data: history,
        pagination: {
          limit,
          offset,
          count: history.length
        }
      });
    } catch (error) {
      console.error('Get SMS history error:', error);
      res.status(500).json({
        error: 'Failed to fetch SMS history',
        message: error.message
      });
    }
  }

  static async getSmsHistoryStatistics(req, res) {
    try {
      const statistics = await SmsService.getSmsHistoryStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get SMS history statistics error:', error);
      res.status(500).json({
        error: 'Failed to fetch SMS history statistics',
        message: error.message
      });
    }
  }

  static async getDailySmsCount(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const dailyCount = await SmsService.getDailySmsCount(days);

      res.json({
        success: true,
        data: dailyCount,
        days
      });
    } catch (error) {
      console.error('Get daily SMS count error:', error);
      res.status(500).json({
        error: 'Failed to fetch daily SMS count',
        message: error.message
      });
    }
  }

  static async getTotalSmsCount(req, res) {
    try {
      const totalCount = await SmsService.getTotalSmsCount();

      res.json({
        success: true,
        data: totalCount
      });
    } catch (error) {
      console.error('Get total SMS count error:', error);
      res.status(500).json({
        error: 'Failed to fetch total SMS count',
        message: error.message
      });
    }
  }
}

module.exports = SmsController;
