const PaymentDeadlineScheduler = require('./paymentDeadlineScheduler');
const ContractDeadlineScheduler = require('./contractDeadlineScheduler');
const PaymentDisplayDeadlineScheduler = require('./paymentDisplayDeadlineScheduler');
const ContractDisplayDeadlineScheduler = require('./contractDisplayDeadlineScheduler');
const SmsExecutionScheduler = require('./smsExecutionScheduler');
const Settings = require('../models/Settings');

// Scheduler instances
let paymentScheduler = null;
let contractScheduler = null;
let paymentDisplayScheduler = null;
let contractDisplayScheduler = null;
let smsExecutionScheduler = null;

// Initialize all schedulers
async function initializeSchedulers() {
  try {
    console.log('Initializing schedulers...');

    // Get scheduler status from database
    let schedulerStatus = 1; // Default to active
    try {
      const settings = await Settings.get();
      schedulerStatus = settings.schedulerStatus !== undefined ? settings.schedulerStatus : 1;
      console.log(`Scheduler status from database: ${schedulerStatus === 1 ? 'ACTIVE' : 'INACTIVE'}`);
    } catch (error) {
      console.warn('Could not fetch scheduler status from database, defaulting to active:', error.message);
    }

    // Only start schedulers if status is 1 (active)
    if (schedulerStatus === 1) {
      // Initialize Payment Deadline Scheduler
      paymentScheduler = new PaymentDeadlineScheduler();
      paymentScheduler.start();

      // Initialize Contract Deadline Scheduler
      contractScheduler = new ContractDeadlineScheduler();
      contractScheduler.start();

      // Initialize Payment Display Deadline Scheduler
      paymentDisplayScheduler = new PaymentDisplayDeadlineScheduler();
      paymentDisplayScheduler.start();

      // Initialize Contract Display Deadline Scheduler
      contractDisplayScheduler = new ContractDisplayDeadlineScheduler();
      contractDisplayScheduler.start();

      // Initialize SMS Execution Scheduler
      smsExecutionScheduler = new SmsExecutionScheduler();
      smsExecutionScheduler.start();

      console.log('All schedulers initialized successfully');
    } else {
      console.log('Schedulers are disabled (status = 0). Initializing but not starting...');
      // Initialize but don't start
      paymentScheduler = new PaymentDeadlineScheduler();
      contractScheduler = new ContractDeadlineScheduler();
      paymentDisplayScheduler = new PaymentDisplayDeadlineScheduler();
      contractDisplayScheduler = new ContractDisplayDeadlineScheduler();
      smsExecutionScheduler = new SmsExecutionScheduler();
    }
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

    if (paymentDisplayScheduler) {
      paymentDisplayScheduler.stop();
      paymentDisplayScheduler = null;
    }

    if (contractDisplayScheduler) {
      contractDisplayScheduler.stop();
      contractDisplayScheduler = null;
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
    paymentDisplayScheduler,
    contractDisplayScheduler,
    smsExecutionScheduler
  };
}

// Get scheduler status
function getSchedulerStatus() {
  return {
    payment: paymentScheduler ? paymentScheduler.getStatus() : { isRunning: false, isScheduled: false },
    contract: contractScheduler ? contractScheduler.getStatus() : { isRunning: false, isScheduled: false },
    paymentDisplay: paymentDisplayScheduler ? paymentDisplayScheduler.getStatus() : { isRunning: false, isScheduled: false },
    contractDisplay: contractDisplayScheduler ? contractDisplayScheduler.getStatus() : { isRunning: false, isScheduled: false },
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

async function triggerPaymentDisplayDeadlineCheck() {
  if (!paymentDisplayScheduler) {
    throw new Error('Payment display scheduler not initialized');
  }
  return await paymentDisplayScheduler.triggerManualCheck();
}

async function triggerContractDisplayDeadlineCheck() {
  if (!contractDisplayScheduler) {
    throw new Error('Contract display scheduler not initialized');
  }
  return await contractDisplayScheduler.triggerManualCheck();
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

// Start all schedulers
function startAllSchedulers() {
  try {
    console.log('Starting all schedulers...');

    if (paymentScheduler && !paymentScheduler.cronJob) {
      paymentScheduler.start();
    }
    if (contractScheduler && !contractScheduler.cronJob) {
      contractScheduler.start();
    }
    if (paymentDisplayScheduler && !paymentDisplayScheduler.cronJob) {
      paymentDisplayScheduler.start();
    }
    if (contractDisplayScheduler && !contractDisplayScheduler.cronJob) {
      contractDisplayScheduler.start();
    }
    if (smsExecutionScheduler && !smsExecutionScheduler.cronJob) {
      smsExecutionScheduler.start();
    }

    console.log('All schedulers started successfully');
  } catch (error) {
    console.error('Error starting schedulers:', error);
    throw error;
  }
}

// Stop all schedulers
function stopAllSchedulers() {
  try {
    console.log('Stopping all schedulers...');

    if (paymentScheduler) {
      paymentScheduler.stop();
    }
    if (contractScheduler) {
      contractScheduler.stop();
    }
    if (paymentDisplayScheduler) {
      paymentDisplayScheduler.stop();
    }
    if (contractDisplayScheduler) {
      contractDisplayScheduler.stop();
    }
    if (smsExecutionScheduler) {
      smsExecutionScheduler.stop();
    }

    console.log('All schedulers stopped successfully');
  } catch (error) {
    console.error('Error stopping schedulers:', error);
    throw error;
  }
}

module.exports = {
  initializeSchedulers,
  stopSchedulers,
  getSchedulers,
  getSchedulerStatus,
  triggerPaymentDeadlineCheck,
  triggerContractDeadlineCheck,
  triggerPaymentDisplayDeadlineCheck,
  triggerContractDisplayDeadlineCheck,
  triggerSmsExecution,
  executeSmsJobsByCriteria,
  getExecutionStatistics,
  startAllSchedulers,
  stopAllSchedulers
};
