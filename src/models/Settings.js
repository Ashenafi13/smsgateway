const { getSMSPool, sql } = require('../config/database');

class Settings {
  constructor(data) {
    this.id = data.id;
    this.numberOfDaysToDeadline = data.numberOfDaysToDeadline;
    this.smsApiToken = data.smsApiToken;
    this.smsShortcodeId = data.smsShortcodeId;
    this.smsCallbackUrl = data.smsCallbackUrl;
  }

  // Get settings
  static async get() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query('SELECT TOP 1 * FROM tbls_settings_sms');
      
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
        .query(`
          INSERT INTO tbls_settings_sms (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl)
          OUTPUT INSERTED.*
          VALUES (@numberOfDaysToDeadline, @smsApiToken, @smsShortcodeId, @smsCallbackUrl)
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
          .query(`
            UPDATE tbls_settings_sms
            SET numberOfDaysToDeadline = @numberOfDaysToDeadline,
                smsApiToken = @smsApiToken,
                smsShortcodeId = @smsShortcodeId,
                smsCallbackUrl = @smsCallbackUrl
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
          .query(`
            INSERT INTO tbls_settings_sms (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl)
            OUTPUT INSERTED.*
            VALUES (@numberOfDaysToDeadline, @smsApiToken, @smsShortcodeId, @smsCallbackUrl)
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
}

module.exports = Settings;
