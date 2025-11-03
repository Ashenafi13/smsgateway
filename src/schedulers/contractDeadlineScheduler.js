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
  start() {
    if (this.cronJob) {
      console.log('Contract deadline scheduler is already running');
      return;
    }

    // Run every day at 9:00 AM (configurable via environment)
    const cronExpression = process.env.DEADLINE_CHECK_CRON || '0 9 * * *';
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.checkContractDeadlines();
    }, {
      scheduled: false,
      timezone: 'Etc/UTC'
    });

    this.cronJob.start();
    console.log(`Contract deadline scheduler started with cron: ${cronExpression}`);
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
          await this.createConsolidatedContractReminderJob(customerGroup);
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
  async createConsolidatedContractReminderJob(customerGroup) {
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

      // Check if there's already a pending SMS job for this customer (by phone and job type)
      const existingJobs = await SmsSchedulerJob.findPendingByPhoneAndType(customerGroup.customer_phone, 'contract_reminder');
      console.log(`Found ${existingJobs.length} existing pending SMS jobs`);

      if (existingJobs.length > 0) {
        console.log(`SMS job already exists for customer ${customerGroup.customer_name}, skipping`);
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
        job_type: 'contract_reminder'
      });

      console.log(`Created SMS job ${smsJob.id} for customer ${customerGroup.customer_name} (Customer: ${customerGroup.customer_name})`);
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
