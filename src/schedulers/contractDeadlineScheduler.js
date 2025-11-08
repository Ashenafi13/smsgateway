const cron = require('node-cron');
const { Contract, Settings, SmsSchedulerJob, DefaultLanguageSetting } = require('../models');
const DateUtils = require('../utils/dateUtils');
const SmsTemplateService = require('../services/smsTemplateService');

class ContractDeadlineScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Start the contract deadline scheduler
  async start() {
    if (this.cronJob) {
      console.log('Contract deadline scheduler is already running');
      return;
    }

    try {
      // Try to get cron expression from database first
      let cronExpression = process.env.DEADLINE_CHECK_CRON || '0 9 * * *';

      try {
        const schedulerSetting = await Settings.getSchedulerSetting('contract_deadline_check');
        if (schedulerSetting && schedulerSetting.cron_expression) {
          cronExpression = schedulerSetting.cron_expression;
          console.log(`Loaded contract deadline scheduler cron from database: ${cronExpression}`);
        }
      } catch (error) {
        console.warn('Could not load scheduler settings from database, using environment variable:', error.message);
      }

      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.checkContractDeadlines();
      }, {
        scheduled: false,
        timezone: 'Etc/UTC'
      });

      this.cronJob.start();
      console.log(`Contract deadline scheduler started with cron: ${cronExpression}`);
    } catch (error) {
      console.error('Error starting contract deadline scheduler:', error);
      throw error;
    }
  }

  // Stop the scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Contract deadline scheduler stopped');
    }
  }

  // Check for contract deadlines and create SMS jobs
  async checkContractDeadlines() {
    if (this.isRunning) {
      console.log('Contract deadline check is already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting contract deadline check...');

    try {
      // Get the number of days to deadline from settings
      const daysToDeadline = await Settings.getNumberOfDaysToDeadline();
      console.log(`Checking for contracts expiring within ${daysToDeadline} days`);

      // Get contracts approaching deadline grouped by customer
      // All spaces for a customer are consolidated into ONE message
      const customerGroups = await Contract.findApproachingDeadlineGroupedByCustomer(daysToDeadline);
      console.log(`Found ${customerGroups.length} customers with approaching contract deadlines`);

      // Log details of found customer groups
      if (customerGroups.length > 0) {
        console.log('Customer Group details:');
        customerGroups.forEach(group => {
          console.log(`- Customer: ${group.customer_name}, Type: ${group.customer_type}, Contract Count: ${group.contractCount}, Total Rent: ${group.totalRent}, Earliest Deadline: ${group.earliestDeadline}`);
          group.contracts.forEach(contract => {
            console.log(`  * Contract ID: ${contract.ContractID}, Room: ${contract.RoomID}, Rent: ${contract.RoomPrice}, End Date: ${contract.EndDate}, Days: ${contract.days_to_deadline}`);
          });
        });
      }

      let jobsCreated = 0;
      let errors = 0;

      for (const customerGroup of customerGroups) {
        try {
          console.log(`Processing consolidated reminder for customer ${customerGroup.customer_name} (${customerGroup.contractCount} contracts)`);
          await this.createConsolidatedContractReminderJob(customerGroup, daysToDeadline);
          jobsCreated++;
        } catch (error) {
          console.error(`Error creating consolidated SMS job for customer ${customerGroup.customer_name}:`, error);
          errors++;
        }
      }

      console.log(`Contract deadline check completed. Jobs created: ${jobsCreated}, Errors: ${errors}`);
    } catch (error) {
      console.error('Error during contract deadline check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Create consolidated SMS reminder job for multiple contracts from same customer
  async createConsolidatedContractReminderJob(customerGroup, daysToDeadline) {
    try {
      // Check if customer has a valid phone number
      if (!customerGroup.customer_phone) {
        console.log(`Customer ${customerGroup.customer_name} has no phone number, skipping SMS`);
        return;
      }

      console.log(`Customer phone for ${customerGroup.customer_name}: ${customerGroup.customer_phone}`);
      console.log(`Days remaining for earliest contract: ${customerGroup.earliestDaysToDeadline}`);
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
        'contract_reminder',
        smsType
      );

      if (alreadySent) {
        console.log(`SMS (${smsType}) already sent for customer ${customerGroup.customer_name}, skipping`);
        return;
      }

      // Get default language
      const defaultLanguageCode = await DefaultLanguageSetting.getDefaultLanguageCode();

      // Create consolidated SMS message using the centralized template service
      const message = await SmsTemplateService.createConsolidatedContractReminderMessage(customerGroup, defaultLanguageCode);

      // Calculate execution date (send reminder immediately for now)
      const executeDate = new Date();

      // Create SMS job with consolidated contract info
      const smsJob = await SmsSchedulerJob.create({
        phone_number: customerGroup.customer_phone,
        message: message,
        execute_date: executeDate,
        status: 'pending',
        job_type: 'contract_reminder',
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

  // Create SMS reminder job for contract (legacy method - kept for compatibility)
  async createContractReminderJob(contract, daysToDeadline) {
    try {
      // Check if customer has a valid phone number
      if (!contract.customer_phone) {
        console.log(`Skipping contract ${contract.ContractID}: No phone number for customer`);
        return;
      }

      // Calculate days remaining using DateUtils
      const daysRemaining = DateUtils.calculateDaysRemaining(contract.EndDate);
      
      // Check if we already created a job for this contract recently
      const existingJobs = await SmsSchedulerJob.findByStatus('pending');
      const existingJob = existingJobs.find(job => 
        job.phoneNumber === contract.customer_phone &&
        job.jobtype === 'contract_reminder' &&
        job.message.includes(`Contract ID: ${contract.ContractID}`)
      );

      if (existingJob) {
        console.log(`SMS job already exists for contract ${contract.ContractID}, skipping...`);
        return;
      }

      // Get default language
      const defaultLanguageCode = await DefaultLanguageSetting.getDefaultLanguageCode();

      // Create SMS message using the centralized template service
      const message = await SmsTemplateService.createContractReminderMessage(contract, defaultLanguageCode);

      // Calculate execution date (send reminder immediately for now)
      const executeDate = new Date();

      // Create SMS job
      const smsJob = await SmsSchedulerJob.create({
        phoneNumber: contract.customer_phone,
        message: message,
        executeDate: executeDate,
        jobStatus: 'pending',
        jobtype: 'contract_reminder'
      });

      console.log(`Created SMS job ${smsJob.id} for contract ${contract.ContractID} (Customer: ${contract.customer_name})`);
      return smsJob;
    } catch (error) {
      throw new Error(`Failed to create contract reminder job: ${error.message}`);
    }
  }

  // Legacy method - now using centralized SmsTemplateService
  // This method is kept for backward compatibility but delegates to the new service
  static async createContractReminderMessage(contract, daysRemaining, language = 'en') {
    return await SmsTemplateService.createContractReminderMessage(contract, language);
  }

  // Create consolidated contract reminder message for multiple contracts
  static async createConsolidatedContractReminderMessage(customerGroup, language = 'en') {
    return await SmsTemplateService.createConsolidatedContractReminderMessage(customerGroup, language);
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('Manually triggering contract deadline check...');
    await this.checkContractDeadlines();
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

module.exports = ContractDeadlineScheduler;
