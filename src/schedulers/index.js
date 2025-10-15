const PaymentDeadlineScheduler = require('./paymentDeadlineScheduler');
const ContractDeadlineScheduler = require('./contractDeadlineScheduler');
const SmsExecutionScheduler = require('./smsExecutionScheduler');

// Scheduler instances
let paymentScheduler = null;
let contractScheduler = null;
let smsExecutionScheduler = null;

// Initialize all schedulers
function initializeSchedulers() {
  try {
    console.log('Initializing schedulers...');

    // Initialize Payment Deadline Scheduler
    paymentScheduler = new PaymentDeadlineScheduler();
    paymentScheduler.start();

    // Initialize Contract Deadline Scheduler
    contractScheduler = new ContractDeadlineScheduler();
    contractScheduler.start();

    // Initialize SMS Execution Scheduler
    smsExecutionScheduler = new SmsExecutionScheduler();
    smsExecutionScheduler.start();

    console.log('All schedulers initialized successfully');
  } catch (error) {
    console.error('Error initializing schedulers:', error);
    throw error;
  }
}

// Stop all schedulers
function stopSchedulers() {
  try {
    console.log('Stopping schedulers...');

    if (paymentScheduler) {
      paymentScheduler.stop();
      paymentScheduler = null;
    }

    if (contractScheduler) {
      contractScheduler.stop();
      contractScheduler = null;
    }

    if (smsExecutionScheduler) {
      smsExecutionScheduler.stop();
      smsExecutionScheduler = null;
    }

    console.log('All schedulers stopped successfully');
  } catch (error) {
    console.error('Error stopping schedulers:', error);
    throw error;
  }
}

// Get all scheduler instances
function getSchedulers() {
  return {
    paymentScheduler,
    contractScheduler,
    smsExecutionScheduler
  };
}

// Get scheduler status
function getSchedulerStatus() {
  return {
    payment: paymentScheduler ? paymentScheduler.getStatus() : { isRunning: false, isScheduled: false },
    contract: contractScheduler ? contractScheduler.getStatus() : { isRunning: false, isScheduled: false },
    smsExecution: smsExecutionScheduler ? smsExecutionScheduler.getStatus() : { isRunning: false, isScheduled: false }
  };
}

// Manual triggers for testing
async function triggerPaymentDeadlineCheck() {
  if (!paymentScheduler) {
    throw new Error('Payment scheduler not initialized');
  }
  return await paymentScheduler.triggerManualCheck();
}

async function triggerContractDeadlineCheck() {
  if (!contractScheduler) {
    throw new Error('Contract scheduler not initialized');
  }
  return await contractScheduler.triggerManualCheck();
}

async function triggerSmsExecution() {
  if (!smsExecutionScheduler) {
    throw new Error('SMS execution scheduler not initialized');
  }
  return await smsExecutionScheduler.triggerManualExecution();
}

// Execute SMS jobs by criteria
async function executeSmsJobsByCriteria(criteria) {
  if (!smsExecutionScheduler) {
    throw new Error('SMS execution scheduler not initialized');
  }
  return await smsExecutionScheduler.executeJobsByCriteria(criteria);
}

// Get execution statistics
async function getExecutionStatistics() {
  if (!smsExecutionScheduler) {
    throw new Error('SMS execution scheduler not initialized');
  }
  return await smsExecutionScheduler.getExecutionStatistics();
}

module.exports = {
  initializeSchedulers,
  stopSchedulers,
  getSchedulers,
  getSchedulerStatus,
  triggerPaymentDeadlineCheck,
  triggerContractDeadlineCheck,
  triggerSmsExecution,
  executeSmsJobsByCriteria,
  getExecutionStatistics
};
