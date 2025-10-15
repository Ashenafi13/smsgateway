// SMS Gateway Database Models
const User = require('./User');
const SmsSchedulerJob = require('./SmsSchedulerJob');
const SmsHistory = require('./SmsHistory');
const Settings = require('./Settings');
const Language = require('./Language');
const DefaultLanguageSetting = require('./DefaultLanguageSetting');
const Template = require('./Template');

// BMS Database Models
const Payment = require('./Payment');
const Contract = require('./Contract');
const PaymentDisplay = require('./PaymentDisplay');
const ContractDisplay = require('./ContractDisplay');
const Customer = require('./Customer');

module.exports = {
  // SMS Gateway Models
  User,
  SmsSchedulerJob,
  SmsHistory,
  Settings,
  Language,
  DefaultLanguageSetting,
  Template,

  // BMS Models
  Payment,
  Contract,
  PaymentDisplay,
  ContractDisplay,
  Customer
};
