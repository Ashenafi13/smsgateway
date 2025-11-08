const cron = require('node-cron');
const { Payment, Settings, SmsSchedulerJob, DefaultLanguageSetting } = require('../models');
const DateUtils = require('../utils/dateUtils');
const SmsTemplateService = require('../services/smsTemplateService');
const PenaltyService = require('../services/penaltyService');

class PaymentDeadlineScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Start the payment deadline scheduler
  async start() {
    if (this.cronJob) {
      console.log('Payment deadline scheduler is already running');
      return;
    }

    try {
      // Try to get cron expression from database first
      let cronExpression = process.env.DEADLINE_CHECK_CRON || '0 9 * * *';

      try {
        const schedulerSetting = await Settings.getSchedulerSetting('payment_deadline_check');
        if (schedulerSetting && schedulerSetting.cron_expression) {
          cronExpression = schedulerSetting.cron_expression;
          console.log(`Loaded payment deadline scheduler cron from database: ${cronExpression}`);
        }
      } catch (error) {
        console.warn('Could not load scheduler settings from database, using environment variable:', error.message);
      }

      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.checkPaymentDeadlines();
      }, {
        scheduled: false,
        timezone: 'Etc/UTC'
      });

      this.cronJob.start();
      console.log(`Payment deadline scheduler started with cron: ${cronExpression}`);
    } catch (error) {
      console.error('Error starting payment deadline scheduler:', error);
      throw error;
    }
  }

  // Stop the scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Payment deadline scheduler stopped');
    }
  }

  // Check for payment deadlines and create SMS jobs
  async checkPaymentDeadlines() {
    if (this.isRunning) {
      console.log('Payment deadline check is already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting payment deadline check...');

    try {
      // Get the number of days to deadline from settings
      const daysToDeadline = await Settings.getNumberOfDaysToDeadline();
      console.log(`Checking for payments due within ${daysToDeadline} days`);

      // Get payments approaching deadline grouped by customer AND deadline date
      // Spaces with same deadline are consolidated into ONE message
      // Spaces with different deadlines get SEPARATE messages
      const customerGroups = await Payment.findApproachingDeadlineGroupedByCustomerAndDate(daysToDeadline);
      console.log(`Found ${customerGroups.length} payment deadline groups (customer + date combinations)`);

      // Log details of found customer groups
      if (customerGroups.length > 0) {
        console.log('Customer Group details:');
        customerGroups.forEach(group => {
          console.log(`- Customer: ${group.customer_name}, Type: ${group.customer_type}, Payment Count: ${group.paymentCount}, Total Amount: ${group.totalAmount}, Earliest Deadline: ${group.earliestDeadline}`);
          group.payments.forEach(payment => {
            console.log(`  * Payment ID: ${payment.id}, Room: ${payment.room}, Amount: ${payment.GroundTotal || payment.line_total}, End Date: ${payment.end_date}, Days: ${payment.days_to_deadline}`);
          });
        });
      }

      let jobsCreated = 0;
      let errors = 0;

      for (const customerGroup of customerGroups) {
        try {
          console.log(`Processing consolidated reminder for customer ${customerGroup.customer_name} (${customerGroup.paymentCount} payments)`);
          await this.createConsolidatedPaymentReminderJob(customerGroup, daysToDeadline);
          jobsCreated++;
        } catch (error) {
          console.error(`Error creating consolidated SMS job for customer ${customerGroup.customer_name}:`, error);
          errors++;
        }
      }

      console.log(`Payment deadline check completed. Jobs created: ${jobsCreated}, Errors: ${errors}`);
    } catch (error) {
      console.error('Error during payment deadline check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Create consolidated SMS reminder job for multiple payments from same customer
  async createConsolidatedPaymentReminderJob(customerGroup, daysToDeadline) {
    try {
      // Check if customer has a valid phone number
      if (!customerGroup.customer_phone) {
        console.log(`Customer ${customerGroup.customer_name} has no phone number, skipping SMS`);
        return;
      }

      console.log(`Customer phone for ${customerGroup.customer_name}: ${customerGroup.customer_phone}`);
      console.log(`Days remaining for earliest payment: ${customerGroup.earliestDaysToDeadline}`);
      console.log(`Customer ID: ${customerGroup.customer_id}, Customer Type: ${customerGroup.customer_type}`);

      // Validate customer data before proceeding
      if (!customerGroup.customer_id || !customerGroup.customer_type) {
        console.log(`❌ Invalid customer data for ${customerGroup.customer_name}: ID=${customerGroup.customer_id}, Type=${customerGroup.customer_type}`);
        return;
      }

      // Determine SMS type based on days to deadline
      // BEFORE deadline: days_to_deadline == daysToDeadline (exactly at threshold)
      // AFTER deadline: days_to_deadline < 0 (past deadline)
      let smsType;

      if (customerGroup.earliestDaysToDeadline === daysToDeadline) {
        // Exactly at the threshold - send BEFORE deadline SMS
        smsType = 'before_deadline';
        console.log(`SMS Type: ${smsType} (days remaining = ${daysToDeadline})`);
      } else if (customerGroup.earliestDaysToDeadline < 0) {
        // Past deadline - send AFTER deadline SMS
        smsType = 'after_deadline';
        console.log(`SMS Type: ${smsType} (days overdue = ${Math.abs(customerGroup.earliestDaysToDeadline)})`);
      } else {
        // Within the range but not at exact threshold - skip for now
        console.log(`Days remaining (${customerGroup.earliestDaysToDeadline}) is not at threshold (${daysToDeadline}) or overdue, skipping`);
        return;
      }

      // Check if SMS has already been sent for this customer with this type
      const alreadySent = await SmsSchedulerJob.hasSentSmsForCustomer(
        customerGroup.customer_id,
        customerGroup.customer_type,
        'payment_reminder',
        smsType
      );

      if (alreadySent) {
        console.log(`SMS (${smsType}) already sent for customer ${customerGroup.customer_name}, skipping`);
        return;
      }

      // Get default language
      const defaultLanguageCode = await DefaultLanguageSetting.getDefaultLanguageCode();

      // Create consolidated SMS message using the centralized template service
      const message = await SmsTemplateService.createConsolidatedPaymentReminderMessage(customerGroup, defaultLanguageCode);

      // Calculate execution date (send reminder immediately for now)
      const executeDate = new Date();

      // Create SMS job with consolidated payment info
      const smsJob = await SmsSchedulerJob.create({
        phone_number: customerGroup.customer_phone,
        message: message,
        execute_date: executeDate,
        status: 'pending',
        job_type: 'payment_reminder',
        sms_type: smsType,
        customer_id: customerGroup.customer_id,
        customer_type: customerGroup.customer_type
      });

      console.log(`Created SMS job ${smsJob.id} for customer ${customerGroup.customer_name} (Type: ${smsType})`);
    } catch (error) {
      console.error(`Error creating consolidated SMS job for customer ${customerGroup.customer_name}:`, error);
      throw error;
    }
  }

  // Create SMS reminder job for payment (legacy method - kept for compatibility)
  async createPaymentReminderJob(payment, daysToDeadline) {
    try {
      // Check if customer has a valid phone number
      if (!payment.customer_phone) {
        console.log(`Skipping payment ${payment.id}: No phone number for customer ${payment.customer_name}`);
        return;
      }

      console.log(`Customer phone for payment ${payment.id}: ${payment.customer_phone}`);

      // Calculate days remaining using DateUtils
      const daysRemaining = DateUtils.calculateDaysRemaining(payment.end_date);
      console.log(`Days remaining for payment ${payment.id}: ${daysRemaining}`);

      // Check if we already created a job for this payment recently
      const existingJobs = await SmsSchedulerJob.findByStatus('pending');
      console.log(`Found ${existingJobs.length} existing pending SMS jobs`);

      const existingJob = existingJobs.find(job =>
        job.phoneNumber === payment.customer_phone &&
        job.jobtype === 'payment_reminder' &&
        job.message.includes(`Payment ID: ${payment.id}`)
      );

      if (existingJob) {
        console.log(`SMS job already exists for payment ${payment.id} (Job ID: ${existingJob.id}), skipping...`);
        return;
      }

      // Get default language
      const defaultLanguageCode = await DefaultLanguageSetting.getDefaultLanguageCode();

      // Create SMS message using the centralized template service
      const message = await SmsTemplateService.createPaymentReminderMessage(payment, defaultLanguageCode);

      // Calculate execution date (send reminder immediately for now)
      const executeDate = new Date();

      // Create SMS job
      const smsJob = await SmsSchedulerJob.create({
        phoneNumber: payment.customer_phone,
        message: message,
        executeDate: executeDate,
        jobStatus: 'pending',
        jobtype: 'payment_reminder'
      });

      console.log(`Created SMS job ${smsJob.id} for payment ${payment.id} (Customer: ${payment.customer_name})`);
      return smsJob;
    } catch (error) {
      throw new Error(`Failed to create payment reminder job: ${error.message}`);
    }
  }

  // Legacy method - now using centralized SmsTemplateService
  // This method is kept for backward compatibility but delegates to the new service
  static async createPaymentReminderMessage(payment, daysRemaining, language = 'en') {
    return await SmsTemplateService.createPaymentReminderMessage(payment, language);
  }

  // Create consolidated payment reminder message for multiple payments
  static async createConsolidatedPaymentReminderMessage(customerGroup, language = 'en') {
    return await SmsTemplateService.createConsolidatedPaymentReminderMessage(customerGroup, language);
  }



  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('Manually triggering payment deadline check...');
    await this.checkPaymentDeadlines();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob ? this.cronJob.scheduled : false,
      cronExpression: process.env.DEADLINE_CHECK_CRON || '0 9 * * *'
    };
  }
}

module.exports = PaymentDeadlineScheduler;
