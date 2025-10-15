const { getSMSPool, sql } = require('../config/database');

class SmsSchedulerJob {
  constructor(data) {
    this.id = data.id;
    this.phoneNumber = data.phoneNumber;
    this.message = data.message;
    this.executeDate = data.executeDate;
    this.jobStatus = data.jobStatus;
    this.jobtype = data.jobtype;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Create a new SMS job
  static async create(jobData) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      // Support both legacy format (phoneNumber, executeDate, jobStatus, jobtype)
      // and new scheduler format (phone_number, execute_date, status, job_type)
      const phoneNumber = jobData.phoneNumber || jobData.phone_number;
      const executeDate = jobData.executeDate || jobData.execute_date;
      const jobStatus = jobData.jobStatus || jobData.status || 'pending';
      const jobtype = jobData.jobtype || jobData.job_type;

      const result = await request
        .input('phoneNumber', sql.NVarChar(20), phoneNumber)
        .input('message', sql.NVarChar(sql.MAX), jobData.message)
        .input('executeDate', sql.DateTime, executeDate)
        .input('jobStatus', sql.NVarChar(20), jobStatus)
        .input('jobtype', sql.NVarChar(50), jobtype)
        .query(`
          INSERT INTO tbls_sms_scheduler_jobs (phoneNumber, message, executeDate, jobStatus, jobtype, createdAt, updatedAt)
          OUTPUT INSERTED.*
          VALUES (@phoneNumber, @message, @executeDate, @jobStatus, @jobtype, GETDATE(), GETDATE())
        `);

      return new SmsSchedulerJob(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error creating SMS job: ${error.message}`);
    }
  }

  // Get all SMS jobs
  static async findAll(limit = 100, offset = 0) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM tbls_sms_scheduler_jobs 
          ORDER BY createdAt DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(job => new SmsSchedulerJob(job));
    } catch (error) {
      throw new Error(`Error fetching SMS jobs: ${error.message}`);
    }
  }

  // Get jobs by status
  static async findByStatus(status) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('status', sql.NVarChar(20), status)
        .query('SELECT * FROM tbls_sms_scheduler_jobs WHERE jobStatus = @status ORDER BY executeDate ASC');
      
      return result.recordset.map(job => new SmsSchedulerJob(job));
    } catch (error) {
      throw new Error(`Error fetching SMS jobs by status: ${error.message}`);
    }
  }

  // Get jobs to execute today
  static async findJobsToExecuteToday() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT * FROM tbls_sms_scheduler_jobs 
        WHERE CAST(executeDate AS DATE) = CAST(GETDATE() AS DATE) 
        AND jobStatus = 'pending'
        ORDER BY executeDate ASC
      `);
      
      return result.recordset.map(job => new SmsSchedulerJob(job));
    } catch (error) {
      throw new Error(`Error fetching jobs to execute today: ${error.message}`);
    }
  }

  // Update job status
  static async updateStatus(id, status) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .input('status', sql.NVarChar(20), status)
        .query(`
          UPDATE tbls_sms_scheduler_jobs 
          SET jobStatus = @status, updatedAt = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new SmsSchedulerJob(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error updating job status: ${error.message}`);
    }
  }

  // Get job by ID
  static async findById(id) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('SELECT * FROM tbls_sms_scheduler_jobs WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new SmsSchedulerJob(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding job by ID: ${error.message}`);
    }
  }

  // Delete job
  static async delete(id) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('DELETE FROM tbls_sms_scheduler_jobs WHERE id = @id');
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      throw new Error(`Error deleting job: ${error.message}`);
    }
  }

  // Get job statistics
  static async getStatistics() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT 
          jobStatus,
          COUNT(*) as count
        FROM tbls_sms_scheduler_jobs 
        GROUP BY jobStatus
      `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching job statistics: ${error.message}`);
    }
  }

  // Find pending SMS jobs for a specific phone number and job type
  static async findPendingByPhoneAndType(phoneNumber, jobType) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request
        .input('phoneNumber', sql.NVarChar(20), phoneNumber)
        .input('jobType', sql.NVarChar(50), jobType)
        .query(`
          SELECT * FROM tbls_sms_scheduler_jobs
          WHERE phoneNumber = @phoneNumber
          AND jobtype = @jobType
          AND jobStatus = 'pending'
          ORDER BY createdAt DESC
        `);

      return result.recordset.map(job => new SmsSchedulerJob(job));
    } catch (error) {
      throw new Error(`Error fetching pending jobs for phone and type: ${error.message}`);
    }
  }
}

module.exports = SmsSchedulerJob;
