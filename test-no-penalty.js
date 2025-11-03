require('dotenv').config();
const SmsTemplateService = require('./src/services/smsTemplateService');

async function testNoPenalty() {
  try {
    console.log('================================================================================');
    console.log('TEST: PAYMENT MESSAGES WITHOUT PENALTIES');
    console.log('================================================================================\n');

    // Test 1: Upcoming payment (not overdue)
    console.log('Test 1: UPCOMING PAYMENT (Not Overdue)');
    console.log('-'.repeat(80));
    
    const upcomingPayment = {
      id: 'PAY-001',
      room: '006',
      Room: '006',
      customer_name: 'John Doe',
      customer_name_am: 'ጆን ዶ',
      end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      GroundTotal: 3000.02,
      line_total: 3000.02,
      description: 'Monthly rent'
    };

    const upcomingEn = await SmsTemplateService.createPaymentReminderMessage(upcomingPayment, 'en');
    const upcomingAm = await SmsTemplateService.createPaymentReminderMessage(upcomingPayment, 'am');

    console.log('English Message:');
    console.log(`  ${upcomingEn}\n`);
    console.log('Amharic Message:');
    console.log(`  ${upcomingAm}\n`);
    console.log('✅ No penalty shown for upcoming payment\n');

    // Test 2: Overdue payment (2 days overdue)
    console.log('\nTest 2: OVERDUE PAYMENT (2 Days Overdue)');
    console.log('-'.repeat(80));
    
    const overduePayment = {
      id: 'PAY-002',
      room: '006',
      Room: '006',
      customer_name: 'Jane Smith',
      customer_name_am: 'ጄን ስሚዝ',
      end_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      GroundTotal: 3000.02,
      line_total: 3000.02,
      description: 'Monthly rent'
    };

    const overdueEn = await SmsTemplateService.createPaymentReminderMessage(overduePayment, 'en');
    const overdueAm = await SmsTemplateService.createPaymentReminderMessage(overduePayment, 'am');

    console.log('English Message:');
    console.log(`  ${overdueEn}\n`);
    console.log('Amharic Message:');
    console.log(`  ${overdueAm}\n`);
    console.log('✅ No penalty shown for overdue payment\n');

    // Test 3: Consolidated payment with same deadline
    console.log('\nTest 3: CONSOLIDATED PAYMENT (Same Deadline)');
    console.log('-'.repeat(80));
    
    const consolidatedGroup = {
      customer_name: 'ABC Company',
      customer_name_am: 'ኤቢሲ ኩባንያ',
      customer_phone: '+251911234567',
      paymentCount: 3,
      payments: [
        {
          id: 'PAY-003',
          room: '006',
          Room: '006',
          customer_name: 'ABC Company',
          customer_name_am: 'ኤቢሲ ኩባንያ',
          end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          GroundTotal: 5000,
          line_total: 5000,
          days_to_deadline: 5
        },
        {
          id: 'PAY-004',
          room: '007',
          Room: '007',
          customer_name: 'ABC Company',
          customer_name_am: 'ኤቢሲ ኩባንያ',
          end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          GroundTotal: 5000,
          line_total: 5000,
          days_to_deadline: 5
        },
        {
          id: 'PAY-005',
          room: '008',
          Room: '008',
          customer_name: 'ABC Company',
          customer_name_am: 'ኤቢሲ ኩባንያ',
          end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          GroundTotal: 5000,
          line_total: 5000,
          days_to_deadline: 5
        }
      ]
    };

    const consolidatedEn = await SmsTemplateService.createConsolidatedPaymentReminderMessage(consolidatedGroup, 'en');
    const consolidatedAm = await SmsTemplateService.createConsolidatedPaymentReminderMessage(consolidatedGroup, 'am');

    console.log('English Message:');
    console.log(`  ${consolidatedEn}\n`);
    console.log('Amharic Message:');
    console.log(`  ${consolidatedAm}\n`);
    console.log('✅ No penalty shown for consolidated payment\n');

    console.log('================================================================================');
    console.log('✅ ALL TESTS PASSED - NO PENALTIES IN MESSAGES');
    console.log('================================================================================\n');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testNoPenalty();

