/**
 * Test for per-space deadline display in consolidated messages
 */

const SmsTemplateService = require('./src/services/smsTemplateService');

// Test Case 1: Same deadline for all spaces
const sameDeadlineGroup = {
  customer_id: 1,
  customer_type: 'ind',
  customer_name: 'Test Customer',
  customer_name_am: 'ሙከራ ደንበኛ',
  customer_phone: '+251911234567',
  contractCount: 3,
  totalRent: 15000,
  contracts: [
    {
      ContractID: 1,
      RoomID: '006',
      Room: '006',
      room: '006',
      RoomPrice: 5000,
      EndDate: '2025-12-15',
      days_to_deadline: 2,
      customer_name: 'Test Customer',
      customer_name_am: 'ሙከራ ደንበኛ'
    },
    {
      ContractID: 2,
      RoomID: '007',
      Room: '007',
      room: '007',
      RoomPrice: 5000,
      EndDate: '2025-12-15',
      days_to_deadline: 2,
      customer_name: 'Test Customer',
      customer_name_am: 'ሙከራ ደንበኛ'
    },
    {
      ContractID: 3,
      RoomID: '008',
      Room: '008',
      room: '008',
      RoomPrice: 5000,
      EndDate: '2025-12-15',
      days_to_deadline: 2,
      customer_name: 'Test Customer',
      customer_name_am: 'ሙከራ ደንበኛ'
    }
  ]
};

// Test Case 2: Different deadlines for spaces
const differentDeadlineGroup = {
  customer_id: 2,
  customer_type: 'ind',
  customer_name: 'Another Customer',
  customer_name_am: 'ሌላ ደንበኛ',
  customer_phone: '+251922345678',
  contractCount: 2,
  totalRent: 10000,
  contracts: [
    {
      ContractID: 4,
      RoomID: '006',
      Room: '006',
      room: '006',
      RoomPrice: 5000,
      EndDate: '2025-12-15',
      days_to_deadline: 2,
      customer_name: 'Another Customer',
      customer_name_am: 'ሌላ ደንበኛ'
    },
    {
      ContractID: 5,
      RoomID: '008',
      Room: '008',
      room: '008',
      RoomPrice: 5000,
      EndDate: '2025-12-16',
      days_to_deadline: 1,
      customer_name: 'Another Customer',
      customer_name_am: 'ሌላ ደንበኛ'
    }
  ]
};

async function runTests() {
  console.log('='.repeat(80));
  console.log('Test: Per-Space Deadline Display in Consolidated Messages');
  console.log('='.repeat(80));

  try {
    // Test 1: Same deadline
    console.log('\n' + '-'.repeat(80));
    console.log('Test 1: Same Deadline for All Spaces');
    console.log('-'.repeat(80));
    
    const sameDeadlineAm = await SmsTemplateService.createConsolidatedContractReminderMessage(sameDeadlineGroup, 'am');
    const sameDeadlineEn = await SmsTemplateService.createConsolidatedContractReminderMessage(sameDeadlineGroup, 'en');
    
    console.log('\nAmharic Message:');
    console.log(sameDeadlineAm);
    console.log('\nEnglish Message:');
    console.log(sameDeadlineEn);
    
    const test1Pass = sameDeadlineAm.includes('006') && sameDeadlineAm.includes('007') && sameDeadlineAm.includes('008') &&
                      !sameDeadlineAm.includes('(2 ቀን)'); // Should NOT have per-space deadline
    console.log(`\n✅ Test 1: ${test1Pass ? 'PASS' : 'FAIL'} - All spaces shown without individual deadlines`);

    // Test 2: Different deadlines
    console.log('\n' + '-'.repeat(80));
    console.log('Test 2: Different Deadlines for Spaces');
    console.log('-'.repeat(80));
    
    const diffDeadlineAm = await SmsTemplateService.createConsolidatedContractReminderMessage(differentDeadlineGroup, 'am');
    const diffDeadlineEn = await SmsTemplateService.createConsolidatedContractReminderMessage(differentDeadlineGroup, 'en');
    
    console.log('\nAmharic Message:');
    console.log(diffDeadlineAm);
    console.log('\nEnglish Message:');
    console.log(diffDeadlineEn);
    
    const test2Pass = diffDeadlineAm.includes('006') && diffDeadlineAm.includes('008') &&
                      diffDeadlineAm.includes('(2 ቀን)') && diffDeadlineAm.includes('(1 ቀን)');
    console.log(`\n✅ Test 2: ${test2Pass ? 'PASS' : 'FAIL'} - Each space shown with its own deadline`);

    // Summary
    console.log('\n' + '='.repeat(80));
    if (test1Pass && test2Pass) {
      console.log('✅ ALL TESTS PASSED');
    } else {
      console.log('❌ SOME TESTS FAILED');
      process.exit(1);
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

runTests();

