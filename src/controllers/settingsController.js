const { validationResult } = require('express-validator');
const SmsService = require('../services/smsService');

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
}

module.exports = SettingsController;
