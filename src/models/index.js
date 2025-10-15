// SMS Gateway Database Models
const User = require('./User');
const SmsSchedulerJob = require('./SmsSchedulerJob');
const SmsHistory = require('./SmsHistory');
const Settings = require('./Settings');

// BMS Database Models
const Payment = require('./Payment');
const Contract = require('./Contract');
const Customer = require('./Customer');

module.exports = {
  // SMS Gateway Models
  User,
  SmsSchedulerJob,
  SmsHistory,
  Settings,
  
  // BMS Models
  Payment,
  Contract,
  Customer
};
