/**
 * Test for per-space deadline display in consolidated payment messages
 */

const SmsTemplateService = require('./src/services/smsTemplateService');

// Test Case 1: Same deadline for all payments
const sameDeadlinePaymentGroup = {
  customer_id: 1,
  customer_type: 'ind',
  customer_name: 'Test Customer',
  customer_name_am: 'ሙከራ ደንበኛ',
  customer_phone: '+251911234567',
  paymentCount: 3,
  totalAmount: 15000,
  payments: [
    {
      id: 1,
      room: '006',
      Room: '006',
      GroundTotal: 5000,
      end_date: '2025-12-15',
      days_to_deadline: 2,
      customer_name: 'Test Customer',
      customer_name_am: 'ሙከራ ደንበኛ'
    },
    {
      id: 2,
      room: '007',
      Room: '007',
      GroundTotal: 5000,
      end_date: '2025-12-15',
      days_to_deadline: 2,
      customer_name: 'Test Customer',
      customer_name_am: 'ሙከራ ደንበኛ'
    },
    {
      id: 3,
      room: '008',
      Room: '008',
      GroundTotal: 5000,
      end_date: '2025-12-15',
      days_to_deadline: 2,
      customer_name: 'Test Customer',
      customer_name_am: 'ሙከራ ደንበኛ'
    }
  ]
};

// Test Case 2: Different deadlines for payments
const differentDeadlinePaymentGroup = {
  customer_id: 2,
  customer_type: 'ind',
  customer_name: 'Another Customer',
  customer_name_am: 'ሌላ ደንበኛ',
  customer_phone: '+251922345678',
  paymentCount: 2,
  totalAmount: 10000,
  payments: [
    {
      id: 4,
      room: '006',
      Room: '006',
      GroundTotal: 5000,
      end_date: '2025-12-15',
      days_to_deadline: 2,
      customer_name: 'Another Customer',
      customer_name_am: 'ሌላ ደንበኛ'
    },
    {
      id: 5,
      room: '008',
      Room: '008',
      GroundTotal: 5000,
      end_date: '2025-12-16',
      days_to_deadline: 1,
      customer_name: 'Another Customer',
      customer_name_am: 'ሌላ ደንበኛ'
    }
  ]
};

async function runTests() {
  console.log('='.repeat(80));
  console.log('Test: Per-Space Deadline Display in Consolidated Payment Messages');
  console.log('='.repeat(80));

  try {
    // Test 1: Same deadline
    console.log('\n' + '-'.repeat(80));
    console.log('Test 1: Same Deadline for All Payments');
    console.log('-'.repeat(80));
    
    const sameDeadlineAm = await SmsTemplateService.createConsolidatedPaymentReminderMessage(sameDeadlinePaymentGroup, 'am');
    const sameDeadlineEn = await SmsTemplateService.createConsolidatedPaymentReminderMessage(sameDeadlinePaymentGroup, 'en');
    
    console.log('\nAmharic Message:');
    console.log(sameDeadlineAm);
    console.log('\nEnglish Message:');
    console.log(sameDeadlineEn);
    
    const test1Pass = sameDeadlineAm.includes('006') && sameDeadlineAm.includes('007') && sameDeadlineAm.includes('008') &&
                      !sameDeadlineAm.includes('(2 ቀን)'); // Should NOT have per-space deadline
    console.log(`\n✅ Test 1: ${test1Pass ? 'PASS' : 'FAIL'} - All spaces shown without individual deadlines`);

    // Test 2: Different deadlines
    console.log('\n' + '-'.repeat(80));
    console.log('Test 2: Different Deadlines for Payments');
    console.log('-'.repeat(80));
    
    const diffDeadlineAm = await SmsTemplateService.createConsolidatedPaymentReminderMessage(differentDeadlinePaymentGroup, 'am');
    const diffDeadlineEn = await SmsTemplateService.createConsolidatedPaymentReminderMessage(differentDeadlinePaymentGroup, 'en');
    
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

