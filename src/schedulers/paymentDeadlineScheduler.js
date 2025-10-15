const cron = require('node-cron');
const { Payment, Settings, SmsSchedulerJob } = require('../models');

class PaymentDeadlineScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Start the payment deadline scheduler
  start() {
    if (this.cronJob) {
      console.log('Payment deadline scheduler is already running');
      return;
    }

    // Run every day at 9:00 AM (configurable via environment)
    const cronExpression = process.env.DEADLINE_CHECK_CRON || '0 9 * * *';
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.checkPaymentDeadlines();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.cronJob.start();
    console.log(`Payment deadline scheduler started with cron: ${cronExpression}`);
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

      // Get payments approaching deadline
      const paymentsApproachingDeadline = await Payment.findApproachingDeadline(daysToDeadline);
      console.log(`Found ${paymentsApproachingDeadline.length} payments approaching deadline`);

      // Log details of found payments
      if (paymentsApproachingDeadline.length > 0) {
        console.log('Payment details:');
        paymentsApproachingDeadline.forEach(payment => {
          console.log(`- Payment ID: ${payment.id}, Customer: ${payment.customer_name}, End Date: ${payment.end_date}, Days to deadline: ${payment.days_to_deadline}, Status: ${payment.paymentStatus}`);
        });
      }

      let jobsCreated = 0;
      let errors = 0;

      for (const payment of paymentsApproachingDeadline) {
        try {
          console.log(`Processing payment ${payment.id} for customer ${payment.customer_name}`);
          await this.createPaymentReminderJob(payment, daysToDeadline);
          jobsCreated++;
        } catch (error) {
          console.error(`Error creating SMS job for payment ${payment.id}:`, error);
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

  // Create SMS reminder job for payment
  async createPaymentReminderJob(payment, daysToDeadline) {
    try {
      // Check if customer has a valid phone number
      if (!payment.customer_phone) {
        console.log(`Skipping payment ${payment.id}: No phone number for customer ${payment.customer_name}`);
        return;
      }

      console.log(`Customer phone for payment ${payment.id}: ${payment.customer_phone}`);

      // Calculate days remaining
      const daysRemaining = Math.ceil((new Date(payment.end_date) - new Date()) / (1000 * 60 * 60 * 24));
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

      // Create SMS message
      const message = this.createPaymentReminderMessage(payment, daysRemaining);

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

  // Create payment reminder message
  createPaymentReminderMessage(payment, daysRemaining) {
    const customerName = payment.customer_name || 'Valued Customer';
    const amount = payment.GroundTotal || payment.line_total || 'N/A';
    const endDate = new Date(payment.end_date).toLocaleDateString();
    
    let urgencyText = '';
    if (daysRemaining <= 1) {
      urgencyText = daysRemaining === 0 ? 'TODAY' : 'TOMORROW';
    } else {
      urgencyText = `in ${daysRemaining} days`;
    }

    const message = `Dear ${customerName}, 

Your payment for Room ${payment.room} is due ${urgencyText} (${endDate}). 

Amount: ${amount}
Description: ${payment.description || 'Payment due'}

Please make your payment to avoid any inconvenience.

Payment ID: ${payment.id}

Thank you.`;

    return message;
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
