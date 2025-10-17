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

  // SMS Sending (placeholder function)
  static async sendSms(phoneNumber, message) {
    // try {
    //   // This is a placeholder function for SMS sending
    //   // In a real implementation, this would integrate with an SMS service provider
    //   console.log(`Sending SMS to ${phoneNumber}: ${message}`);
      
    //   // Simulate SMS sending delay
    //   await new Promise(resolve => setTimeout(resolve, 1000));
      
    //   // For now, we'll just log and return success
    //   // In production, replace this with actual SMS service integration
    //   return {
    //     success: true,
    //     message: 'SMS sent successfully (simulated)',
    //     phoneNumber,
    //     sentAt: new Date()
    //   };
    // } catch (error) {
    //   throw new Error(`Failed to send SMS: ${error.message}`);
    // }

const API_KEY = "f5b64f414903104f3bc755c178cf6fd9-6ca72a9c-203e-42a0-80c8-6cf92f3dd02f"; // get from Infobip dashboard
const FROM = 'InfoSMS'; // test sender or default
const TO = phoneNumber; // e.g., +2519xxxxxxx
const BODY = message;

if(!API_KEY){ console.error('Set INFOBIP_API_KEY'); process.exit(1); }

axios.post(
  'https://e5pzqn.api.infobip.com/sms/3/messages', // example endpoint — use Infobip docs for exact URL for your region
  {
    messages: [
      { from: FROM, destinations: [{ to: TO }], content: { text: BODY} }
    ]
  },
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `App ${API_KEY}`
    }
  }
).then(r => console.log('Sent:', r.data))
 .catch(e => console.error('Error:', e.response ? e.response.data : e.message));
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
