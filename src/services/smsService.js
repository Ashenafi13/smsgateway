const { SmsSchedulerJob, SmsHistory, Settings, DefaultLanguageSetting } = require('../models');
const DateUtils = require('../utils/dateUtils');
const axios = require('axios');
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

  
  // SMS Settings
  static async getSmsSettings() {
    try {
      const settings = await Settings.get();
      return {
        smsApiToken: settings.smsApiToken ? '***' + settings.smsApiToken.slice(-4) : null, // Mask token for security
        smsShortcodeId: settings.smsShortcodeId,
        smsCallbackUrl: settings.smsCallbackUrl
      };
    } catch (error) {
      throw new Error(`Failed to fetch SMS settings: ${error.message}`);
    }
  }

  static async updateSmsSettings(smsSettingsData) {
    try {
      const settings = await Settings.update(smsSettingsData);
      return {
        smsApiToken: settings.smsApiToken ? '***' + settings.smsApiToken.slice(-4) : null, // Mask token for security
        smsShortcodeId: settings.smsShortcodeId,
        smsCallbackUrl: settings.smsCallbackUrl
      };
    } catch (error) {
      throw new Error(`Failed to update SMS settings: ${error.message}`);
    }
  }
  
  // Scheduler Status
  static async getSchedulerStatus() {
    try {
      const settings = await Settings.get();
      console.log('Scheduler status:', settings.schedulerStatus);
      return {
        schedulerStatus: settings.schedulerStatus,
        isActive: settings.schedulerStatus,
        statusLabel: settings.schedulerStatus ? 'ACTIVE' : 'INACTIVE'
      };
    } catch (error) {
      throw new Error(`Failed to fetch scheduler status: ${error.message}`);
    }
  }

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
  // SMS Sending using GeezSMS API
  static async sendSms(phoneNumber, message) {
    try {
      // Get SMS settings from database
      const settings = await Settings.get();

      if (!settings.smsApiToken) {
        throw new Error('SMS API token not configured. Please configure SMS settings first.');
      }

      // Prepare form data for GeezSMS API
      const formData = new URLSearchParams();
      formData.append('token', settings.smsApiToken);
      formData.append('phone', phoneNumber);
      formData.append('msg', message);

      // Add optional parameters if configured
      if (settings.smsShortcodeId) {
        formData.append('shortcode_id', settings.smsShortcodeId);
      }

      if (settings.smsCallbackUrl) {
        formData.append('callback', settings.smsCallbackUrl);
      }

      // Send SMS using GeezSMS API
      const response = await axios.post(
        'https://api.geezsms.com/api/v1/sms/send',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      // Check if the request was successful
      if (response.status === 200) {
        console.log('SMS sent successfully:', response.data);
        return {
          success: true,
          message: 'SMS sent successfully',
          phoneNumber,
          sentAt: new Date(),
          response: response.data
        };
      } else {
        throw new Error(`SMS API returned status ${response.status}: ${response.data}`);
      }

    } catch (error) {
      console.error('SMS sending error:', error);

      // Handle axios errors
      if (error.response) {
        throw new Error(`SMS API error: ${error.response.status} - ${error.response.data || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('SMS API request failed: No response received');
      } else {
        throw new Error(`Failed to send SMS: ${error.message}`);
      }
    }
  }
  // Helper method to create localized payment reminder message
  static async createPaymentReminderMessage(payment, language = null) {
    try {
      // Get default language if not specified
      const languageCode = language || await DefaultLanguageSetting.getDefaultLanguageCode();

      // Calculate days remaining
      const daysRemaining = DateUtils.calculateDaysRemaining(payment.end_date);

      // Use language-specific customer name
      let customerName;
      if (languageCode === 'am') {
        customerName = payment.customer_name_am || payment.customer_name || 'ውድ ደንበኛ';
      } else {
        customerName = payment.customer_name || 'Valued Customer';
      }
      const amount = payment.GroundTotal || payment.line_total || 0;

      // Format currency in Ethiopian Birr
      const formattedAmount = DateUtils.formatCurrency(amount, languageCode);

      // Convert end date to Ethiopian calendar
      const ethDate = DateUtils.toEthiopianDate(payment.end_date);
      const formattedDate = DateUtils.formatEthiopianDate(ethDate, languageCode);

      // Get urgency text based on days remaining
      const urgencyText = DateUtils.getUrgencyText(daysRemaining, languageCode);

      let message;
      if (languageCode === 'am') {
        message = `ውድ ${customerName}፣

የእርስዎ የክፍል ${payment.room} ክፍያ ${urgencyText} (${formattedDate}) ይጠበቃል።

መጠን: ${formattedAmount}
መግለጫ: ${payment.description || 'ክፍያ ይጠበቃል'}



የክፍያ መለያ: ${payment.id}

እናመሰግናለን።`;
      } else {
        message = `Dear ${customerName},

Your payment for Room ${payment.room} is due ${urgencyText} (${formattedDate}).

Amount: ${formattedAmount}
Description: ${payment.description || 'Payment due'}

Please make your payment to avoid any inconvenience.

Payment ID: ${payment.id}

Thank you.`;
      }

      return message;
    } catch (error) {
      throw new Error(`Failed to create payment reminder message: ${error.message}`);
    }
  }

  // Helper method to create localized contract reminder message
  static async createContractReminderMessage(contract, language = null) {
    try {
      // Get default language if not specified
      const languageCode = language || await DefaultLanguageSetting.getDefaultLanguageCode();

      // Calculate days remaining
      const daysRemaining = DateUtils.calculateDaysRemaining(contract.EndDate);

      // Use language-specific customer name
      let customerName;
      if (languageCode === 'am') {
        customerName = contract.customer_name_am || contract.customer_name || 'ውድ ደንበኛ';
      } else {
        customerName = contract.customer_name || 'Valued Customer';
      }
      const roomPrice = contract.RoomPrice || 0;

      // Format currency in Ethiopian Birr
      const formattedPrice = DateUtils.formatCurrency(roomPrice, languageCode);

      // Convert dates to Ethiopian calendar
      const ethEndDate = DateUtils.toEthiopianDate(contract.EndDate);
      const ethStartDate = DateUtils.toEthiopianDate(contract.StartDate);
      const formattedEndDate = DateUtils.formatEthiopianDate(ethEndDate, languageCode);
      const formattedStartDate = DateUtils.formatEthiopianDate(ethStartDate, languageCode);

      // Get urgency text based on days remaining
      const urgencyText = DateUtils.getUrgencyText(daysRemaining, languageCode);

      let message;
      if (languageCode === 'am') {
        message = `ውድ ${customerName}፣

የእርስዎ የክፍል ${contract.RoomID} ኪራይ ውል ${urgencyText} (${formattedEndDate}) ይጠናቀቃል።

የውል ጊዜ: ${formattedStartDate} - ${formattedEndDate}
ወርሃዊ ኪራይ: ${formattedPrice}

ውልዎን ለማደስ ወይም የመውጫ ሂደቶችን ለማዘጋጀት እባክዎን ያግኙን።

የውል መለያ: ${contract.ContractID}

እናመሰግናለን።`;
      } else {
        message = `Dear ${customerName},

Your rental contract for Room ${contract.RoomID} expires ${urgencyText} (${formattedEndDate}).

Contract Period: ${formattedStartDate} - ${formattedEndDate}
Monthly Rent: ${formattedPrice}

Please contact us to renew your contract or arrange move-out procedures.

Contract ID: ${contract.ContractID}

Thank you.`;
      }

      return message;
    } catch (error) {
      throw new Error(`Failed to create contract reminder message: ${error.message}`);
    }
  }
}

module.exports = SmsService;
