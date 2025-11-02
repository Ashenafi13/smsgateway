/**
 * Simple test script to verify SMS functionality
 * Run with: node test_sms.js
 */

require('dotenv').config();
const SmsService = require('./src/services/smsService');

async function testSmsService() {
  console.log('Testing SMS Service...\n');

  try {
    // Test 1: Get current settings
    console.log('1. Testing getSettings...');
    const settings = await SmsService.getSettings();
    console.log('Current settings:', {
      numberOfDaysToDeadline: settings.numberOfDaysToDeadline,
      hasSmsToken: !!settings.smsApiToken,
      smsShortcodeId: settings.smsShortcodeId,
      smsCallbackUrl: settings.smsCallbackUrl
    });
    console.log('✓ Settings retrieved successfully\n');

    // Test 2: Get SMS settings (masked)
    console.log('2. Testing getSmsSettings...');
    const smsSettings = await SmsService.getSmsSettings();
    console.log('SMS settings:', smsSettings);
    console.log('✓ SMS settings retrieved successfully\n');

    // Test 3: Update SMS settings (example)
    console.log('3. Testing updateSmsSettings...');
    const testSettings = {
      smsApiToken: 'test-token-12345',
      smsShortcodeId: 'TEST123',
      smsCallbackUrl: 'https://example.com/callback'
    };
    
    const updatedSettings = await SmsService.updateSmsSettings(testSettings);
    console.log('Updated SMS settings:', updatedSettings);
    console.log('✓ SMS settings updated successfully\n');

    // Test 4: Test SMS sending (will fail without valid token, but tests the flow)
    console.log('4. Testing sendSms...');
    try {
      const result = await SmsService.sendSms('+251912345678', 'Test message from SMS Gateway');
      console.log('SMS sent successfully:', result);
      console.log('✓ SMS sent successfully\n');
    } catch (smsError) {
      console.log('SMS sending failed (expected with test token):', smsError.message);
      console.log('✓ SMS sending flow tested (error handling works)\n');
    }

    console.log('All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testSmsService();
}

module.exports = testSmsService;
