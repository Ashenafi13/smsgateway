const { validationResult } = require('express-validator');
const SmsService = require('../services/smsService');
const { startAllSchedulers, stopAllSchedulers } = require('../schedulers');

class SettingsController {
  // Get settings
  static async getSettings(req, res) {
    try {
      const settings = await SmsService.getSettings();

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({
        error: 'Failed to fetch settings',
        message: error.message
      });
    }
  }

  // Update settings
  static async updateSettings(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const settings = await SmsService.updateSettings(req.body);

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: settings
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(400).json({
        error: 'Failed to update settings',
        message: error.message
      });
    }
  }

  // Get number of days to deadline
  static async getNumberOfDaysToDeadline(req, res) {
    try {
      const result = await SmsService.getNumberOfDaysToDeadline();

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get days to deadline error:', error);
      res.status(500).json({
        error: 'Failed to fetch days to deadline',
        message: error.message
      });
    }
  }

  // Update number of days to deadline
  static async updateNumberOfDaysToDeadline(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { numberOfDaysToDeadline } = req.body;
      const settings = await SmsService.updateSettings({ numberOfDaysToDeadline });

      res.json({
        success: true,
        message: 'Days to deadline updated successfully',
        data: settings
      });
    } catch (error) {
      console.error('Update days to deadline error:', error);
      res.status(400).json({
        error: 'Failed to update days to deadline',
        message: error.message
      });
    }
  }

  // Get SMS settings
  static async getSmsSettings(req, res) {
    try {
      const smsSettings = await SmsService.getSmsSettings();

      res.json({
        success: true,
        data: smsSettings
      });
    } catch (error) {
      console.error('Get SMS settings error:', error);
      res.status(500).json({
        error: 'Failed to fetch SMS settings',
        message: error.message
      });
    }
  }

  // Update SMS settings
  static async updateSmsSettings(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const smsSettings = await SmsService.updateSmsSettings(req.body);

      res.json({
        success: true,
        message: 'SMS settings updated successfully',
        data: smsSettings
      });
    } catch (error) {
      console.error('Update SMS settings error:', error);
      res.status(400).json({
        error: 'Failed to update SMS settings',
        message: error.message
      });
    }
  }

  // Get scheduler status
  static async getSchedulerStatus(req, res) {
    try {
      const schedulerStatus = await SmsService.getSchedulerStatus();

      res.json({
        success: true,
        data: schedulerStatus
      });
    } catch (error) {
      console.error('Get scheduler status error:', error);
      res.status(500).json({
        error: 'Failed to fetch scheduler status',
        message: error.message
      });
    }
  }

  // Update scheduler status
  static async updateSchedulerStatus(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { schedulerStatus } = req.body;

      // Validate scheduler status value
      if (schedulerStatus !== 0 && schedulerStatus !== 1) {
        return res.status(400).json({
          error: 'Invalid scheduler status',
          message: 'Scheduler status must be 0 (inactive) or 1 (active)'
        });
      }

      // Update settings in database
      const settings = await SmsService.updateSettings({ schedulerStatus });

      // Control schedulers based on status
      if (schedulerStatus === 1) {
        console.log('Activating schedulers...');
        startAllSchedulers();
      } else {
        console.log('Deactivating schedulers...');
        stopAllSchedulers();
      }

      res.json({
        success: true,
        message: `Scheduler ${schedulerStatus === 1 ? 'activated' : 'deactivated'} successfully`,
        data: {
          schedulerStatus: settings.schedulerStatus
        }
      });
    } catch (error) {
      console.error('Update scheduler status error:', error);
      res.status(400).json({
        error: 'Failed to update scheduler status',
        message: error.message
      });
    }
  }
}

module.exports = SettingsController;
