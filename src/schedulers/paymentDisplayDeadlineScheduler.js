const cron = require('node-cron');
const { PaymentDisplay, Settings, SmsSchedulerJob, DefaultLanguageSetting } = require('../models');
const DateUtils = require('../utils/dateUtils');

class PaymentDisplayDeadlineScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Start the payment display deadline scheduler
  start() {
    if (this.cronJob) {
      console.log('Payment display deadline scheduler is already running');
      return;
    }

    // Run every 30 seconds for testing (configurable via environment)
    const cronExpression = process.env.DEADLINE_CHECK_CRON || '*/30 * * * * *';
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.checkPaymentDisplayDeadlines();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.cronJob.start();
    console.log(`Payment display deadline scheduler started with cron: ${cronExpression}`);
  }

  // Stop the scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Payment display deadline scheduler stopped');
    }
  }

  // Check for payment display deadlines and create SMS jobs
  async checkPaymentDisplayDeadlines() {
    if (this.isRunning) {
      console.log('Payment display deadline check is already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting payment display deadline check...');

    try {
      // Get the number of days to deadline from settings
      const daysToDeadline = await Settings.getNumberOfDaysToDeadline();
      console.log(`Checking for payment displays due within ${daysToDeadline} days`);

      // Get payment displays approaching deadline grouped by customer
      const customerGroups = await PaymentDisplay.findApproachingDeadlineGroupedByCustomer(daysToDeadline);
      console.log(`Found ${customerGroups.length} customers with approaching payment display deadlines`);

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
          console.log(`Processing consolidated reminder for customer ${customerGroup.customer_name} (${customerGroup.paymentCount} payment displays)`);
          await this.createConsolidatedPaymentDisplayReminderJob(customerGroup);
          jobsCreated++;
        } catch (error) {
          console.error(`Error creating consolidated SMS job for customer ${customerGroup.customer_name}:`, error);
          errors++;
        }
      }

      console.log(`Payment display deadline check completed. Jobs created: ${jobsCreated}, Errors: ${errors}`);
    } catch (error) {
      console.error('Error during payment display deadline check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Create consolidated SMS reminder job for multiple payment displays from same customer
  async createConsolidatedPaymentDisplayReminderJob(customerGroup) {
    try {
      // Check if customer has a valid phone number
      if (!customerGroup.customer_phone) {
        console.log(`Customer ${customerGroup.customer_name} has no phone number, skipping SMS`);
        return;
      }

      console.log(`Customer phone for ${customerGroup.customer_name}: ${customerGroup.customer_phone}`);
      console.log(`Days remaining for earliest payment display: ${customerGroup.earliestDaysToDeadline}`);
      console.log(`Customer ID: ${customerGroup.customer_id}, Customer Type: ${customerGroup.customer_type}`);

      // Validate customer data before proceeding
      if (!customerGroup.customer_id || !customerGroup.customer_type) {
        console.log(`❌ Invalid customer data for ${customerGroup.customer_name}: ID=${customerGroup.customer_id}, Type=${customerGroup.customer_type}`);
        return;
      }

      // Check if there's already a pending SMS job for this customer (by phone and job type)
      const existingJobs = await SmsSchedulerJob.findPendingByPhoneAndType(customerGroup.customer_phone, 'payment_display_reminder');
      console.log(`Found ${existingJobs.length} existing pending SMS jobs`);

      if (existingJobs.length > 0) {
        console.log(`SMS job already exists for customer ${customerGroup.customer_name}, skipping`);
        return;
      }

      // Get default language
      const defaultLanguageCode = await DefaultLanguageSetting.getDefaultLanguageCode();

      // Create consolidated SMS message
      const message = PaymentDisplayDeadlineScheduler.createConsolidatedPaymentDisplayReminderMessage(customerGroup, defaultLanguageCode);

      // Calculate execution date (send reminder immediately for now)
      const executeDate = new Date();

      // Create SMS job with consolidated payment display info
      const smsJob = await SmsSchedulerJob.create({
        phone_number: customerGroup.customer_phone,
        message: message,
        execute_date: executeDate,
        status: 'pending',
        job_type: 'payment_display_reminder'
      });

      console.log(`Created SMS job ${smsJob.id} for customer ${customerGroup.customer_name}`);
    } catch (error) {
      console.error(`Error creating consolidated SMS job for customer ${customerGroup.customer_name}:`, error);
      throw error;
    }
  }

  // Create consolidated payment display reminder message for multiple payments
  static createConsolidatedPaymentDisplayReminderMessage(customerGroup, language = 'en') {
    // Use language-specific customer name
    let customerName;
    if (language === 'am') {
      customerName = customerGroup.customer_name_am || customerGroup.customer_name || 'ውድ ደንበኛ';
    } else {
      customerName = customerGroup.customer_name || 'Valued Customer';
    }

    // Format total amount in Ethiopian Birr
    const formattedTotalAmount = DateUtils.formatCurrency(customerGroup.totalAmount, language);

    let message;
    if (language === 'am') {
      // Amharic message for multiple payment displays
      let paymentDetails = '';
      customerGroup.payments.forEach((payment, index) => {
        const paymentAmount = DateUtils.formatCurrency(payment.GroundTotal || payment.line_total || 0, language);
        const paymentEthDate = DateUtils.toEthiopianDate(payment.end_date);
        const paymentFormattedDate = DateUtils.formatEthiopianDate(paymentEthDate, language);
        const daysRemainingText = DateUtils.getDaysRemainingText(payment.days_to_deadline, language);

        paymentDetails += `${index + 1}. ክፍል ${payment.room}: ${paymentAmount} - ${daysRemainingText} (${paymentFormattedDate})\n`;
      });

      message = `ውድ ${customerName}፣

እርስዎ ${customerGroup.paymentCount} የክፍያ ግዴታዎች አሉዎት ፡

${paymentDetails}
ጠቅላላ መጠን: ${formattedTotalAmount}


እናመሰግናለን።`;
    } else {
      // English message for multiple payment displays
      let paymentDetails = '';
      customerGroup.payments.forEach((payment, index) => {
        const paymentAmount = DateUtils.formatCurrency(payment.GroundTotal || payment.line_total || 0, language);
        const paymentEthDate = DateUtils.toEthiopianDate(payment.end_date);
        const paymentFormattedDate = DateUtils.formatEthiopianDate(paymentEthDate, language);
        const daysRemainingText = DateUtils.getDaysRemainingText(payment.days_to_deadline, language);

        paymentDetails += `${index + 1}. Room ${payment.room}: ${paymentAmount} - ${daysRemainingText} (${paymentFormattedDate})\n`;
      });

      message = `Dear ${customerName},

You have ${customerGroup.paymentCount} payment(s) due:

${paymentDetails}
Total Amount: ${formattedTotalAmount}

Please make your payments to avoid any inconvenience.

Thank you.`;
    }

    return message;
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('Manually triggering payment display deadline check...');
    await this.checkPaymentDisplayDeadlines();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob ? this.cronJob.scheduled : false,
      cronExpression: process.env.PAYMENT_DISPLAY_DEADLINE_CHECK_CRON || '*/30 * * * * *'
    };
  }
}

module.exports = PaymentDisplayDeadlineScheduler;
