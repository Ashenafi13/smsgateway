const { validationResult } = require('express-validator');
const SmsService = require('../services/smsService');
const { Settings } = require('../models');
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
       console.log('Scheduler status:', schedulerStatus);
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

  // Get all scheduler settings
  static async getAllSchedulerSettings(req, res) {
    try {
      const schedulerSettings = await Settings.getAllSchedulerSettings();

      res.json({
        success: true,
        data: schedulerSettings,
        message: 'Scheduler settings retrieved successfully'
      });
    } catch (error) {
      console.error('Get all scheduler settings error:', error);
      res.status(500).json({
        error: 'Failed to fetch scheduler settings',
        message: error.message
      });
    }
  }

  // Get specific scheduler setting
  static async getSchedulerSetting(req, res) {
    try {
      const { schedulerName } = req.params;
      const schedulerSetting = await Settings.getSchedulerSetting(schedulerName);

      if (!schedulerSetting) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Scheduler setting '${schedulerName}' not found`
        });
      }

      res.json({
        success: true,
        data: schedulerSetting,
        message: 'Scheduler setting retrieved successfully'
      });
    } catch (error) {
      console.error('Get scheduler setting error:', error);
      res.status(500).json({
        error: 'Failed to fetch scheduler setting',
        message: error.message
      });
    }
  }

  // Update scheduler setting
  static async updateSchedulerSetting(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { schedulerName } = req.params;
      const { cronExpression, isActive } = req.body;

      // Validate required fields
      if (!cronExpression) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'cronExpression is required'
        });
      }

      // Upsert scheduler setting (create if not exists, update if exists)
      const updatedSetting = await Settings.upsertSchedulerSetting(
        schedulerName,
        cronExpression,
        isActive !== undefined ? isActive : 1
      );

      res.json({
        success: true,
        data: updatedSetting,
        message: 'Scheduler setting updated successfully'
      });
    } catch (error) {
      console.error('Update scheduler setting error:', error);
      res.status(400).json({
        error: 'Failed to update scheduler setting',
        message: error.message
      });
    }
  }
}

module.exports = SettingsController;
