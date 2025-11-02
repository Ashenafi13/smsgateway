/**
 * SMS Service Usage Example
 * This file demonstrates how to use the updated SMS service with GeezSMS API
 */

require('dotenv').config();
const SmsService = require('./src/services/smsService');

async function demonstrateSmsUsage() {
  console.log('=== SMS Service Usage Example ===\n');

  try {
    // Step 1: Configure SMS Settings
    console.log('1. Configuring SMS Settings...');
    
    const smsConfig = {
      smsApiToken: 'your-actual-geezsms-api-token', // Replace with your actual token
      smsShortcodeId: 'YOUR_SHORTCODE', // Optional: Replace with your shortcode
      smsCallbackUrl: 'https://your-domain.com/sms-callback' // Optional: Replace with your callback URL
    };

    const updatedSettings = await SmsService.updateSmsSettings(smsConfig);
    console.log('✓ SMS settings configured:', updatedSettings);
    console.log();

    // Step 2: Get current SMS settings (masked for security)
    console.log('2. Retrieving current SMS settings...');
    const currentSettings = await SmsService.getSmsSettings();
    console.log('✓ Current SMS settings:', currentSettings);
    console.log();

    // Step 3: Send a test SMS
    console.log('3. Sending test SMS...');
    const testPhoneNumber = '+251912345678'; // Replace with actual phone number
    const testMessage = 'Hello! This is a test message from SMS Gateway using GeezSMS API.';

    try {
      const smsResult = await SmsService.sendSms(testPhoneNumber, testMessage);
      console.log('✓ SMS sent successfully:', smsResult);
    } catch (smsError) {
      console.log('✗ SMS sending failed:', smsError.message);
      console.log('Note: This is expected if using a test token or invalid phone number');
    }
    console.log();

    // Step 4: Create and process an SMS job
    console.log('4. Creating and processing SMS job...');
    
    const jobData = {
      phoneNumber: testPhoneNumber,
      message: 'This is a scheduled SMS message.',
      executeDate: new Date(),
      jobtype: 'manual'
    };

    const smsJob = await SmsService.createSmsJob(jobData);
    console.log('✓ SMS job created:', {
      id: smsJob.id,
      phoneNumber: smsJob.phoneNumber,
      jobStatus: smsJob.jobStatus,
      executeDate: smsJob.executeDate
    });

    // Process the job
    try {
      const processResult = await SmsService.processSmsJob(smsJob.id);
      console.log('✓ SMS job processed successfully:', processResult);
    } catch (processError) {
      console.log('✗ SMS job processing failed:', processError.message);
      console.log('Note: This is expected if SMS API credentials are not valid');
    }
    console.log();

    // Step 5: Get SMS statistics
    console.log('5. Getting SMS statistics...');
    const stats = await SmsService.getSmsJobStatistics();
    console.log('✓ SMS job statistics:', stats);

    const historyStats = await SmsService.getSmsHistoryStatistics();
    console.log('✓ SMS history statistics:', historyStats);
    console.log();

    // Step 6: Demonstrate payment reminder message creation
    console.log('6. Creating payment reminder message...');
    const samplePayment = {
      id: 'PAY001',
      room: '101',
      customer_name: 'John Doe',
      customer_name_am: 'ጆን ዶ',
      GroundTotal: 5000,
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      description: 'Monthly rent payment'
    };

    const paymentMessageEn = await SmsService.createPaymentReminderMessage(samplePayment, 'en');
    console.log('✓ Payment reminder (English):\n', paymentMessageEn);

    const paymentMessageAm = await SmsService.createPaymentReminderMessage(samplePayment, 'am');
    console.log('✓ Payment reminder (Amharic):\n', paymentMessageAm);
    console.log();

    console.log('=== SMS Service demonstration completed! ===');
    console.log('\nNext steps:');
    console.log('1. Replace the test API token with your actual GeezSMS API token');
    console.log('2. Update phone numbers to valid Ethiopian phone numbers');
    console.log('3. Configure your callback URL if you need delivery notifications');
    console.log('4. Test with real SMS sending in your environment');

  } catch (error) {
    console.error('Demonstration failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// API Usage Examples for different scenarios
function showApiExamples() {
  console.log('\n=== API Usage Examples ===\n');

  console.log('1. Configure SMS Settings via API:');
  console.log('PUT /api/settings/sms');
  console.log('Content-Type: application/json');
  console.log('Authorization: Bearer <your-jwt-token>');
  console.log(JSON.stringify({
    smsApiToken: 'your-geezsms-api-token',
    smsShortcodeId: 'YOUR_SHORTCODE',
    smsCallbackUrl: 'https://your-domain.com/callback'
  }, null, 2));
  console.log();

  console.log('2. Get SMS Settings:');
  console.log('GET /api/settings/sms');
  console.log('Authorization: Bearer <your-jwt-token>');
  console.log();

  console.log('3. Send SMS via Job Creation:');
  console.log('POST /api/sms/jobs');
  console.log('Content-Type: application/json');
  console.log('Authorization: Bearer <your-jwt-token>');
  console.log(JSON.stringify({
    phoneNumber: '+251912345678',
    message: 'Your payment is due soon. Please make payment to avoid inconvenience.',
    executeDate: new Date().toISOString(),
    jobtype: 'payment_reminder'
  }, null, 2));
  console.log();

  console.log('4. Process SMS Job:');
  console.log('POST /api/sms/jobs/:jobId/process');
  console.log('Authorization: Bearer <your-jwt-token>');
  console.log();
}

// Run the demonstration
if (require.main === module) {
  demonstrateSmsUsage().then(() => {
    showApiExamples();
  });
}

module.exports = { demonstrateSmsUsage, showApiExamples };
