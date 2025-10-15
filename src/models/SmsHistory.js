const { getSMSPool, sql } = require('../config/database');

class SmsHistory {
  constructor(data) {
    this.id = data.id;
    this.phoneNumber = data.phoneNumber;
    this.message = data.message;
    this.type = data.type;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Create a new SMS history record
  static async create(historyData) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('phoneNumber', sql.NVarChar(20), historyData.phoneNumber)
        .input('message', sql.NVarChar(sql.MAX), historyData.message)
        .input('type', sql.NVarChar(50), historyData.type)
        .query(`
          INSERT INTO tbls_sms_history (phoneNumber, message, type, createdAt, updatedAt)
          OUTPUT INSERTED.*
          VALUES (@phoneNumber, @message, @type, GETDATE(), GETDATE())
        `);
      
      return new SmsHistory(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error creating SMS history: ${error.message}`);
    }
  }

  // Get all SMS history
  static async findAll(limit = 100, offset = 0) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM tbls_sms_history 
          ORDER BY createdAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(history => new SmsHistory(history));
    } catch (error) {
      throw new Error(`Error fetching SMS history: ${error.message}`);
    }
  }

  // Get SMS history by type
  static async findByType(type, limit = 100, offset = 0) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('type', sql.NVarChar(50), type)
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM tbls_sms_history 
          WHERE type = @type
          ORDER BY createdAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(history => new SmsHistory(history));
    } catch (error) {
      throw new Error(`Error fetching SMS history by type: ${error.message}`);
    }
  }

  // Get SMS history by phone number
  static async findByPhoneNumber(phoneNumber, limit = 50, offset = 0) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('phoneNumber', sql.NVarChar(20), phoneNumber)
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM tbls_sms_history 
          WHERE phoneNumber = @phoneNumber
          ORDER BY createdAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(history => new SmsHistory(history));
    } catch (error) {
      throw new Error(`Error fetching SMS history by phone number: ${error.message}`);
    }
  }

  // Get SMS history by date range
  static async findByDateRange(startDate, endDate, limit = 100, offset = 0) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM tbls_sms_history 
          WHERE createdAt >= @startDate AND createdAt <= @endDate
          ORDER BY createdAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(history => new SmsHistory(history));
    } catch (error) {
      throw new Error(`Error fetching SMS history by date range: ${error.message}`);
    }
  }

  // Get SMS statistics
  static async getStatistics() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT 
          type,
          COUNT(*) as count,
          MAX(createdAt) as lastSent
        FROM tbls_sms_history 
        GROUP BY type
      `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching SMS statistics: ${error.message}`);
    }
  }

  // Get daily SMS count
  static async getDailySmsCount(days = 30) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('days', sql.Int, days)
        .query(`
          SELECT 
            CAST(createdAt AS DATE) as date,
            COUNT(*) as count
          FROM tbls_sms_history 
          WHERE createdAt >= DATEADD(day, -@days, GETDATE())
          GROUP BY CAST(createdAt AS DATE)
          ORDER BY date DESC
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching daily SMS count: ${error.message}`);
    }
  }

  // Get total SMS count
  static async getTotalCount() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query('SELECT COUNT(*) as total FROM tbls_sms_history');
      
      return result.recordset[0].total;
    } catch (error) {
      throw new Error(`Error fetching total SMS count: ${error.message}`);
    }
  }
}

module.exports = SmsHistory;
