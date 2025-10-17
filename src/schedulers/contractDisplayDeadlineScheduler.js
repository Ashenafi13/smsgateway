const cron = require('node-cron');
const { ContractDisplay, Settings, SmsSchedulerJob, DefaultLanguageSetting } = require('../models');
const DateUtils = require('../utils/dateUtils');

class ContractDisplayDeadlineScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Start the contract display deadline scheduler
  start() {
    if (this.cronJob) {
      console.log('Contract display deadline scheduler is already running');
      return;
    }

    // Run every 30 seconds for testing (configurable via environment)
    const cronExpression = process.env.DEADLINE_CHECK_CRON || '*/30 * * * * *';
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.checkContractDisplayDeadlines();
    }, {
      scheduled: false,
      timezone: 'Etc/UTC'
    });

    this.cronJob.start();
    console.log(`Contract display deadline scheduler started with cron: ${cronExpression}`);
  }

  // Stop the scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Contract display deadline scheduler stopped');
    }
  }

  // Check for contract display deadlines and create SMS jobs
  async checkContractDisplayDeadlines() {
    if (this.isRunning) {
      console.log('Contract display deadline check is already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting contract display deadline check...');

    try {
      // Get the number of days to deadline from settings
      const daysToDeadline = await Settings.getNumberOfDaysToDeadline();
      console.log(`Checking for contract displays expiring within ${daysToDeadline} days`);

      // Get contract displays approaching deadline grouped by customer
      const customerGroups = await ContractDisplay.findApproachingDeadlineGroupedByCustomer(daysToDeadline);
      console.log(`Found ${customerGroups.length} customers with approaching contract display deadlines`);

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
          console.log(`Processing consolidated reminder for customer ${customerGroup.customer_name} (${customerGroup.contractCount} contract displays)`);
          await this.createConsolidatedContractDisplayReminderJob(customerGroup);
          jobsCreated++;
        } catch (error) {
          console.error(`Error creating consolidated SMS job for customer ${customerGroup.customer_name}:`, error);
          errors++;
        }
      }

      console.log(`Contract display deadline check completed. Jobs created: ${jobsCreated}, Errors: ${errors}`);
    } catch (error) {
      console.error('Error during contract display deadline check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Create consolidated SMS reminder job for multiple contract displays from same customer
  async createConsolidatedContractDisplayReminderJob(customerGroup) {
    try {
      // Check if customer has a valid phone number
      if (!customerGroup.customer_phone) {
        console.log(`Customer ${customerGroup.customer_name} has no phone number, skipping SMS`);
        return;
      }

      console.log(`Customer phone for ${customerGroup.customer_name}: ${customerGroup.customer_phone}`);
      console.log(`Days remaining for earliest contract display: ${customerGroup.earliestDaysToDeadline}`);
      console.log(`Customer ID: ${customerGroup.customer_id}, Customer Type: ${customerGroup.customer_type}`);

      // Validate customer data before proceeding
      if (!customerGroup.customer_id || !customerGroup.customer_type) {
        console.log(`❌ Invalid customer data for ${customerGroup.customer_name}: ID=${customerGroup.customer_id}, Type=${customerGroup.customer_type}`);
        return;
      }

      // Check if there's already a pending SMS job for this customer (by phone and job type)
      const existingJobs = await SmsSchedulerJob.findPendingByPhoneAndType(customerGroup.customer_phone, 'contract_display_reminder');
      console.log(`Found ${existingJobs.length} existing pending SMS jobs`);

      if (existingJobs.length > 0) {
        console.log(`SMS job already exists for customer ${customerGroup.customer_name}, skipping`);
        return;
      }

      // Get default language
      const defaultLanguageCode = await DefaultLanguageSetting.getDefaultLanguageCode();

      // Create consolidated SMS message
      const message = ContractDisplayDeadlineScheduler.createConsolidatedContractDisplayReminderMessage(customerGroup, defaultLanguageCode);

      // Calculate execution date (send reminder immediately for now)
      const executeDate = new Date();

      // Create SMS job with consolidated contract display info
      const smsJob = await SmsSchedulerJob.create({
        phone_number: customerGroup.customer_phone,
        message: message,
        execute_date: executeDate,
        status: 'pending',
        job_type: 'contract_display_reminder'
      });

      console.log(`Created SMS job ${smsJob.id} for customer ${customerGroup.customer_name}`);
    } catch (error) {
      console.error(`Error creating consolidated SMS job for customer ${customerGroup.customer_name}:`, error);
      throw error;
    }
  }

  // Create consolidated contract display reminder message for multiple contracts
  static createConsolidatedContractDisplayReminderMessage(customerGroup, language = 'en') {
    // Use language-specific customer name
    let customerName;
    if (language === 'am') {
      customerName = customerGroup.customer_name_am || customerGroup.customer_name || 'ውድ ደንበኛ';
    } else {
      customerName = customerGroup.customer_name || 'Valued Customer';
    }

    // Format total rent in Ethiopian Birr
    const formattedTotalRent = DateUtils.formatCurrency(customerGroup.totalRent, language);

    let message;
    if (language === 'am') {
      // Amharic message for multiple contract displays
      let contractDetails = '';
      customerGroup.contracts.forEach((contract, index) => {
        const contractRent = DateUtils.formatCurrency(contract.RoomPrice || 0, language);
        const contractEthDate = DateUtils.toEthiopianDate(contract.EndDate);
        const contractFormattedDate = DateUtils.formatEthiopianDate(contractEthDate, language);
        const daysRemainingText = DateUtils.getDaysRemainingText(contract.days_to_deadline, language);

        contractDetails += `${index + 1}. ክፍል ${contract.RoomID}: ${contractRent} - ${daysRemainingText} (${contractFormattedDate})\n`;
      });

      message = `ውድ ${customerName}፣

እርስዎ ${customerGroup.contractCount} የኪራይ ውል(ዎች) አሉዎት ፡

${contractDetails}
ጠቅላላ ወርሃዊ ኪራይ: ${formattedTotalRent}

ውሉን ለማደስ ወይም የመውጫ ሂደቶችን ለማዘጋጀት እባክዎ ያግኙን።

እናመሰግናለን።`;
    } else {
      // English message for multiple contract displays
      let contractDetails = '';
      customerGroup.contracts.forEach((contract, index) => {
        const contractRent = DateUtils.formatCurrency(contract.RoomPrice || 0, language);
        const contractEthDate = DateUtils.toEthiopianDate(contract.EndDate);
        const contractFormattedDate = DateUtils.formatEthiopianDate(contractEthDate, language);
        const daysRemainingText = DateUtils.getDaysRemainingText(contract.days_to_deadline, language);

        contractDetails += `${index + 1}. Room ${contract.RoomID}: ${contractRent} - ${daysRemainingText} (${contractFormattedDate})\n`;
      });

      message = `Dear ${customerName},

You have ${customerGroup.contractCount} rental contract(s) expiring (Building Display Space):

${contractDetails}
Total Monthly Rent: ${formattedTotalRent}

Please contact us to renew your contracts or arrange move-out procedures.

Thank you.`;
    }

    return message;
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('Manually triggering contract display deadline check...');
    await this.checkContractDisplayDeadlines();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob ? this.cronJob.scheduled : false,
      cronExpression: process.env.CONTRACT_DISPLAY_DEADLINE_CHECK_CRON || '*/30 * * * * *'
    };
  }
}

module.exports = ContractDisplayDeadlineScheduler;
