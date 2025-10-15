const cron = require('node-cron');
const { Contract, Settings, SmsSchedulerJob } = require('../models');

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
      timezone: 'UTC'
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

      // Get contracts approaching deadline
      const contractsApproachingDeadline = await Contract.findApproachingDeadline(daysToDeadline);
      console.log(`Found ${contractsApproachingDeadline.length} contracts approaching deadline`);

      let jobsCreated = 0;
      let errors = 0;

      for (const contract of contractsApproachingDeadline) {
        try {
          await this.createContractReminderJob(contract, daysToDeadline);
          jobsCreated++;
        } catch (error) {
          console.error(`Error creating SMS job for contract ${contract.ContractID}:`, error);
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

  // Create SMS reminder job for contract
  async createContractReminderJob(contract, daysToDeadline) {
    try {
      // Check if customer has a valid phone number
      if (!contract.customer_phone) {
        console.log(`Skipping contract ${contract.ContractID}: No phone number for customer`);
        return;
      }

      // Calculate days remaining
      const daysRemaining = Math.ceil((new Date(contract.EndDate) - new Date()) / (1000 * 60 * 60 * 24));
      
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

      // Create SMS message
      const message = this.createContractReminderMessage(contract, daysRemaining);

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

  // Create contract reminder message
  createContractReminderMessage(contract, daysRemaining) {
    const customerName = contract.customer_name || 'Valued Customer';
    const roomPrice = contract.RoomPrice || 'N/A';
    const endDate = new Date(contract.EndDate).toLocaleDateString();
    const startDate = new Date(contract.StartDate).toLocaleDateString();
    
    let urgencyText = '';
    if (daysRemaining <= 1) {
      urgencyText = daysRemaining === 0 ? 'TODAY' : 'TOMORROW';
    } else {
      urgencyText = `in ${daysRemaining} days`;
    }

    const message = `Dear ${customerName}, 

Your rental contract for Room ${contract.RoomID} expires ${urgencyText} (${endDate}). 

Contract Period: ${startDate} - ${endDate}
Monthly Rent: ${roomPrice}

Please contact us to renew your contract or arrange move-out procedures.

Contract ID: ${contract.ContractID}

Thank you.`;

    return message;
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
