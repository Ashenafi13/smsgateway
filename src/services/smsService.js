const { SmsSchedulerJob, SmsHistory, Settings } = require('../models');

class SmsService {
  // SMS Scheduler Jobs
  static async createSmsJob(jobData) {
    try {
      const job = await SmsSchedulerJob.create({
        phoneNumber: jobData.phoneNumber,
        message: jobData.message,
        executeDate: jobData.executeDate || new Date(),
        jobStatus: jobData.jobStatus || 'pending',
        jobtype: jobData.jobtype || 'manual'
      });

      return job;
    } catch (error) {
      throw new Error(`Failed to create SMS job: ${error.message}`);
    }
  }

  static async getAllSmsJobs(limit = 100, offset = 0) {
    try {
      const jobs = await SmsSchedulerJob.findAll(limit, offset);
      return jobs;
    } catch (error) {
      throw new Error(`Failed to fetch SMS jobs: ${error.message}`);
    }
  }

  static async getSmsJobsByStatus(status) {
    try {
      const jobs = await SmsSchedulerJob.findByStatus(status);
      return jobs;
    } catch (error) {
      throw new Error(`Failed to fetch SMS jobs by status: ${error.message}`);
    }
  }

  static async getSmsJobById(id) {
    try {
      const job = await SmsSchedulerJob.findById(id);
      if (!job) {
        throw new Error('SMS job not found');
      }
      return job;
    } catch (error) {
      throw new Error(`Failed to fetch SMS job: ${error.message}`);
    }
  }

  static async updateSmsJobStatus(id, status) {
    try {
      const job = await SmsSchedulerJob.updateStatus(id, status);
      if (!job) {
        throw new Error('SMS job not found');
      }
      return job;
    } catch (error) {
      throw new Error(`Failed to update SMS job status: ${error.message}`);
    }
  }

  static async deleteSmsJob(id) {
    try {
      const deleted = await SmsSchedulerJob.delete(id);
      if (!deleted) {
        throw new Error('SMS job not found');
      }
      return { success: true, message: 'SMS job deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete SMS job: ${error.message}`);
    }
  }

  static async getSmsJobStatistics() {
    try {
      const statistics = await SmsSchedulerJob.getStatistics();
      
      // Transform the result into a more readable format
      const stats = {
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      };

      statistics.forEach(stat => {
        stats[stat.jobStatus] = stat.count;
        stats.total += stat.count;
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch SMS job statistics: ${error.message}`);
    }
  }

  // SMS History
  static async createSmsHistory(historyData) {
    try {
      const history = await SmsHistory.create({
        phoneNumber: historyData.phoneNumber,
        message: historyData.message,
        type: historyData.type || 'manual'
      });

      return history;
    } catch (error) {
      throw new Error(`Failed to create SMS history: ${error.message}`);
    }
  }

  static async getAllSmsHistory(limit = 100, offset = 0) {
    try {
      const history = await SmsHistory.findAll(limit, offset);
      return history;
    } catch (error) {
      throw new Error(`Failed to fetch SMS history: ${error.message}`);
    }
  }

  static async getSmsHistoryByType(type, limit = 100, offset = 0) {
    try {
      const history = await SmsHistory.findByType(type, limit, offset);
      return history;
    } catch (error) {
      throw new Error(`Failed to fetch SMS history by type: ${error.message}`);
    }
  }

  static async getSmsHistoryByPhoneNumber(phoneNumber, limit = 50, offset = 0) {
    try {
      const history = await SmsHistory.findByPhoneNumber(phoneNumber, limit, offset);
      return history;
    } catch (error) {
      throw new Error(`Failed to fetch SMS history by phone number: ${error.message}`);
    }
  }

  static async getSmsHistoryByDateRange(startDate, endDate, limit = 100, offset = 0) {
    try {
      const history = await SmsHistory.findByDateRange(startDate, endDate, limit, offset);
      return history;
    } catch (error) {
      throw new Error(`Failed to fetch SMS history by date range: ${error.message}`);
    }
  }

  static async getSmsHistoryStatistics() {
    try {
      const statistics = await SmsHistory.getStatistics();
      return statistics;
    } catch (error) {
      throw new Error(`Failed to fetch SMS history statistics: ${error.message}`);
    }
  }

  static async getDailySmsCount(days = 30) {
    try {
      const dailyCount = await SmsHistory.getDailySmsCount(days);
      return dailyCount;
    } catch (error) {
      throw new Error(`Failed to fetch daily SMS count: ${error.message}`);
    }
  }

  static async getTotalSmsCount() {
    try {
      const totalCount = await SmsHistory.getTotalCount();
      return { total: totalCount };
    } catch (error) {
      throw new Error(`Failed to fetch total SMS count: ${error.message}`);
    }
  }

  // Settings
  static async getSettings() {
    try {
      const settings = await Settings.get();
      return settings;
    } catch (error) {
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }
  }

  static async updateSettings(settingsData) {
    try {
      const settings = await Settings.update(settingsData);
      return settings;
    } catch (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }

  static async getNumberOfDaysToDeadline() {
    try {
      const days = await Settings.getNumberOfDaysToDeadline();
      return { numberOfDaysToDeadline: days };
    } catch (error) {
      throw new Error(`Failed to fetch days to deadline: ${error.message}`);
    }
  }

  // SMS Sending (placeholder function)
  static async sendSms(phoneNumber, message) {
    try {
      // This is a placeholder function for SMS sending
      // In a real implementation, this would integrate with an SMS service provider
      console.log(`Sending SMS to ${phoneNumber}: ${message}`);
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, we'll just log and return success
      // In production, replace this with actual SMS service integration
      return {
        success: true,
        message: 'SMS sent successfully (simulated)',
        phoneNumber,
        sentAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  // Process SMS job (send SMS and update status)
  static async processSmsJob(jobId) {
    try {
      const job = await SmsSchedulerJob.findById(jobId);
      if (!job) {
        throw new Error('SMS job not found');
      }

      if (job.jobStatus !== 'pending') {
        throw new Error('Job is not in pending status');
      }

      try {
        // Send SMS
        const smsResult = await this.sendSms(job.phoneNumber, job.message);
        
        // Update job status to completed
        await SmsSchedulerJob.updateStatus(jobId, 'completed');
        
        // Create SMS history record
        await SmsHistory.create({
          phoneNumber: job.phoneNumber,
          message: job.message,
          type: job.jobtype
        });

        return {
          success: true,
          message: 'SMS job processed successfully',
          smsResult
        };
      } catch (smsError) {
        // Update job status to failed
        await SmsSchedulerJob.updateStatus(jobId, 'failed');
        throw new Error(`SMS sending failed: ${smsError.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to process SMS job: ${error.message}`);
    }
  }
}

module.exports = SmsService;
