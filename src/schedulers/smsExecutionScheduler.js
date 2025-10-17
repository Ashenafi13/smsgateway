const cron = require('node-cron');
const { SmsSchedulerJob } = require('../models');
const SmsService = require('../services/smsService');

class SmsExecutionScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Start the SMS execution scheduler
  start() {
    if (this.cronJob) {
      console.log('SMS execution scheduler is already running');
      return;
    }

    // Run every 5 minutes (configurable via environment)
    const cronExpression = process.env.SMS_EXECUTION_CRON || '0 */5 * * * *';
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.executePendingSmsJobs();
    }, {
      scheduled: false,
      timezone: 'Etc/UTC'
    });

    this.cronJob.start();
    console.log(`SMS execution scheduler started with cron: ${cronExpression}`);
  }

  // Stop the scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('SMS execution scheduler stopped');
    }
  }

  // Execute pending SMS jobs
  async executePendingSmsJobs() {
    if (this.isRunning) {
      console.log('SMS execution is already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting SMS execution check...');

    try {
      // Get jobs that are ready to execute today
      const jobsToExecute = await SmsSchedulerJob.findJobsToExecuteToday();
      console.log(`Found ${jobsToExecute.length} SMS jobs to execute`);

      if (jobsToExecute.length === 0) {
        console.log('No SMS jobs to execute at this time');
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      for (const job of jobsToExecute) {
        try {
          await this.executeSmsJob(job);
          successCount++;
        } catch (error) {
          console.error(`Error executing SMS job ${job.id}:`, error);
          failureCount++;
        }
      }

      console.log(`SMS execution completed. Success: ${successCount}, Failures: ${failureCount}`);
    } catch (error) {
      console.error('Error during SMS execution check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Execute a single SMS job
  async executeSmsJob(job) {
    try {
      console.log(`Executing SMS job ${job.id} to ${job.phoneNumber}`);

      // Check if the job is still pending (might have been processed by another instance)
      const currentJob = await SmsSchedulerJob.findById(job.id);
      if (!currentJob || currentJob.jobStatus !== 'pending') {
        console.log(`SMS job ${job.id} is no longer pending, skipping...`);
        return;
      }

      // Check if the execution time has arrived
      const now = new Date();
      const executeDate = new Date(job.executeDate);
      
      if (executeDate > now) {
        console.log(`SMS job ${job.id} execution time has not arrived yet, skipping...`);
        return;
      }

      // Process the SMS job using the SMS service
      const result = await SmsService.processSmsJob(job.id);
      
      console.log(`SMS job ${job.id} executed successfully:`, result.message);
      return result;
    } catch (error) {
      // Update job status to failed
      try {
        await SmsSchedulerJob.updateStatus(job.id, 'failed');
        console.error(`SMS job ${job.id} marked as failed due to error:`, error.message);
      } catch (updateError) {
        console.error(`Failed to update job ${job.id} status to failed:`, updateError.message);
      }
      
      throw new Error(`Failed to execute SMS job ${job.id}: ${error.message}`);
    }
  }

  // Execute jobs by specific criteria (for manual execution)
  async executeJobsByCriteria(criteria = {}) {
    try {
      console.log('Executing SMS jobs by criteria:', criteria);

      let jobs = [];
      
      if (criteria.status) {
        jobs = await SmsSchedulerJob.findByStatus(criteria.status);
      } else if (criteria.jobId) {
        const job = await SmsSchedulerJob.findById(criteria.jobId);
        if (job) jobs = [job];
      } else {
        jobs = await SmsSchedulerJob.findJobsToExecuteToday();
      }

      // Filter by additional criteria if provided
      if (criteria.phoneNumber) {
        jobs = jobs.filter(job => job.phoneNumber === criteria.phoneNumber);
      }

      if (criteria.jobtype) {
        jobs = jobs.filter(job => job.jobtype === criteria.jobtype);
      }

      console.log(`Found ${jobs.length} jobs matching criteria`);

      let successCount = 0;
      let failureCount = 0;
      const results = [];

      for (const job of jobs) {
        try {
          const result = await this.executeSmsJob(job);
          successCount++;
          results.push({
            jobId: job.id,
            status: 'success',
            result: result
          });
        } catch (error) {
          failureCount++;
          results.push({
            jobId: job.id,
            status: 'failed',
            error: error.message
          });
        }
      }

      return {
        totalJobs: jobs.length,
        successCount,
        failureCount,
        results
      };
    } catch (error) {
      throw new Error(`Failed to execute jobs by criteria: ${error.message}`);
    }
  }

  // Manual trigger for testing
  async triggerManualExecution() {
    console.log('Manually triggering SMS execution...');
    await this.executePendingSmsJobs();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob ? this.cronJob.scheduled : false,
      cronExpression: process.env.SMS_EXECUTION_CRON || '0 */5 * * * *'
    };
  }

  // Get execution statistics
  async getExecutionStatistics() {
    try {
      const statistics = await SmsSchedulerJob.getStatistics();
      const jobsToExecuteToday = await SmsSchedulerJob.findJobsToExecuteToday();
      
      return {
        jobStatistics: statistics,
        jobsToExecuteToday: jobsToExecuteToday.length,
        schedulerStatus: this.getStatus()
      };
    } catch (error) {
      throw new Error(`Failed to get execution statistics: ${error.message}`);
    }
  }
}

module.exports = SmsExecutionScheduler;
