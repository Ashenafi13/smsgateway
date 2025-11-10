const { getSMSPool, sql } = require('../config/database');

class Settings {
  constructor(data) {
    this.id = data.id;
    this.numberOfDaysToDeadline = data.numberOfDaysToDeadline;
    this.smsApiToken = data.smsApiToken;
    this.smsShortcodeId = data.smsShortcodeId;
    this.smsCallbackUrl = data.smsCallbackUrl;
    this.schedulerStatus = data.schedulerStatus !== undefined ? data.schedulerStatus : 1; // Default to active (1)
  }

  // Get settings
  static async get() {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request.query('SELECT TOP 1 * FROM tbls_settings');

      if (result.recordset.length === 0) {
        // Create default settings if none exist
        return await this.createDefault();
      }

      return new Settings(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error fetching settings: ${error.message}`);
    }
  }

  // Create default settings
  static async createDefault() {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request
        .input('numberOfDaysToDeadline', sql.Int, 7) // Default 7 days
        .input('smsApiToken', sql.NVarChar(255), null)
        .input('smsShortcodeId', sql.NVarChar(50), null)
        .input('smsCallbackUrl', sql.NVarChar(255), null)
        .input('schedulerStatus', sql.Int, 1) // Default to active (1)
        .query(`
          INSERT INTO tbls_settings (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl, schedulerStatus)
          OUTPUT INSERTED.*
          VALUES (@numberOfDaysToDeadline, @smsApiToken, @smsShortcodeId, @smsCallbackUrl, @schedulerStatus)
        `);

      return new Settings(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error creating default settings: ${error.message}`);
    }
  }

  // Update settings
  static async update(settingsData) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      // First check if settings exist
      const existingSettings = await this.get();
      
      if (existingSettings && existingSettings.id) {
        // Update existing settings
        const result = await request
          .input('id', sql.Int, existingSettings.id)
          .input('numberOfDaysToDeadline', sql.Int, settingsData.numberOfDaysToDeadline || existingSettings.numberOfDaysToDeadline)
          .input('smsApiToken', sql.NVarChar(255), settingsData.smsApiToken !== undefined ? settingsData.smsApiToken : existingSettings.smsApiToken)
          .input('smsShortcodeId', sql.NVarChar(50), settingsData.smsShortcodeId !== undefined ? settingsData.smsShortcodeId : existingSettings.smsShortcodeId)
          .input('smsCallbackUrl', sql.NVarChar(255), settingsData.smsCallbackUrl !== undefined ? settingsData.smsCallbackUrl : existingSettings.smsCallbackUrl)
          .input('schedulerStatus', sql.Int, settingsData.schedulerStatus !== undefined ? settingsData.schedulerStatus : existingSettings.schedulerStatus)
          .query(`
            UPDATE tbls_settings
            SET numberOfDaysToDeadline = @numberOfDaysToDeadline,
                smsApiToken = @smsApiToken,
                smsShortcodeId = @smsShortcodeId,
                smsCallbackUrl = @smsCallbackUrl,
                schedulerStatus = @schedulerStatus
            OUTPUT INSERTED.*
            WHERE id = @id
          `);

        return new Settings(result.recordset[0]);
      } else {
        // Create new settings if none exist
        const result = await request
          .input('numberOfDaysToDeadline', sql.Int, settingsData.numberOfDaysToDeadline || 7)
          .input('smsApiToken', sql.NVarChar(255), settingsData.smsApiToken || null)
          .input('smsShortcodeId', sql.NVarChar(50), settingsData.smsShortcodeId || null)
          .input('smsCallbackUrl', sql.NVarChar(255), settingsData.smsCallbackUrl || null)
          .input('schedulerStatus', sql.Int, settingsData.schedulerStatus !== undefined ? settingsData.schedulerStatus : 1)
          .query(`
            INSERT INTO tbls_settings (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl, schedulerStatus)
            OUTPUT INSERTED.*
            VALUES (@numberOfDaysToDeadline, @smsApiToken, @smsShortcodeId, @smsCallbackUrl, @schedulerStatus)
          `);

        return new Settings(result.recordset[0]);
      }
    } catch (error) {
      throw new Error(`Error updating settings: ${error.message}`);
    }
  }

  // Get number of days to deadline
  static async getNumberOfDaysToDeadline() {
    try {
      const settings = await this.get();
      return settings.numberOfDaysToDeadline;
    } catch (error) {
      throw new Error(`Error getting days to deadline: ${error.message}`);
    }
  }

  // Update number of days to deadline
  static async updateNumberOfDaysToDeadline(days) {
    try {
      return await this.update({ numberOfDaysToDeadline: days });
    } catch (error) {
      throw new Error(`Error updating days to deadline: ${error.message}`);
    }
  }

  // Get scheduler settings by name
  static async getSchedulerSetting(schedulerName) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request
        .input('schedulerName', sql.NVarChar(100), schedulerName)
        .query(`
          SELECT * FROM tbls_settings_scheduler
          WHERE scheduler_name = @schedulerName
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error fetching scheduler setting: ${error.message}`);
    }
  }

  // Get all scheduler settings
  static async getAllSchedulerSettings() {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request.query(`
        SELECT * FROM tbls_settings_scheduler
        ORDER BY scheduler_name
      `);

      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching all scheduler settings: ${error.message}`);
    }
  }

  // Update scheduler setting
  static async updateSchedulerSetting(schedulerName, cronExpression, isActive = 1) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request
        .input('schedulerName', sql.NVarChar(100), schedulerName)
        .input('cronExpression', sql.NVarChar(100), cronExpression)
        .input('isActive', sql.Int, isActive)
        .query(`
          UPDATE tbls_settings_scheduler
          SET cron_expression = @cronExpression,
              is_active = @isActive,
              updatedAt = GETDATE()
          OUTPUT INSERTED.*
          WHERE scheduler_name = @schedulerName
        `);

      if (result.recordset.length === 0) {
        throw new Error(`Scheduler setting not found: ${schedulerName}`);
      }

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error updating scheduler setting: ${error.message}`);
    }
  }

  // Create scheduler setting if it doesn't exist
  static async createSchedulerSetting(schedulerName, cronExpression, isActive = 1) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request
        .input('schedulerName', sql.NVarChar(100), schedulerName)
        .input('cronExpression', sql.NVarChar(100), cronExpression)
        .input('isActive', sql.Int, isActive)
        .query(`
          INSERT INTO tbls_settings_scheduler (scheduler_name, cron_expression, is_active, createdAt, updatedAt)
          OUTPUT INSERTED.*
          VALUES (@schedulerName, @cronExpression, @isActive, GETDATE(), GETDATE())
        `);

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error creating scheduler setting: ${error.message}`);
    }
  }

  // Upsert scheduler setting (create if not exists, update if exists)
  static async upsertSchedulerSetting(schedulerName, cronExpression, isActive = 1) {
    try {
      // Try to get existing setting
      const existing = await this.getSchedulerSetting(schedulerName);

      if (existing) {
        // Update existing
        return await this.updateSchedulerSetting(schedulerName, cronExpression, isActive);
      } else {
        // Create new
        return await this.createSchedulerSetting(schedulerName, cronExpression, isActive);
      }
    } catch (error) {
      throw new Error(`Error upserting scheduler setting: ${error.message}`);
    }
  }
}

module.exports = Settings;
