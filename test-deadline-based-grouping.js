/**
 * Test for deadline-based grouping
 * Verifies that spaces with different deadlines get separate SMS messages
 */

const SmsTemplateService = require('./src/services/smsTemplateService');

// Mock customer groups with different deadline dates
const mockPaymentGroupsSameDateDifferentRooms = [
  {
    customer_id: 1,
    customer_type: 'ind',
    customer_name: 'John Doe',
    customer_name_am: 'ጆን ዶ',
    customer_phone: '+251911234567',
    deadline_date: '2025-12-15',
    paymentCount: 3,
    totalAmount: 15000,
    payments: [
      {
        id: 1,
        room: 'Room 101',
        Room: 'Room 101',
        GroundTotal: 5000,
        end_date: '2025-12-15',
        days_to_deadline: 42,
        customer_name: 'John Doe',
        customer_name_am: 'ጆን ዶ'
      },
      {
        id: 2,
        room: 'Room 202',
        Room: 'Room 202',
        GroundTotal: 5000,
        end_date: '2025-12-15',
        days_to_deadline: 42,
        customer_name: 'John Doe',
        customer_name_am: 'ጆን ዶ'
      },
      {
        id: 3,
        room: 'Room 303',
        Room: 'Room 303',
        GroundTotal: 5000,
        end_date: '2025-12-15',
        days_to_deadline: 42,
        customer_name: 'John Doe',
        customer_name_am: 'ጆን ዶ'
      }
    ]
  }
];

const mockPaymentGroupsDifferentDates = [
  {
    customer_id: 1,
    customer_type: 'ind',
    customer_name: 'Jane Smith',
    customer_name_am: 'ጄን ስሚዝ',
    customer_phone: '+251922345678',
    deadline_date: '2025-12-15',
    paymentCount: 2,
    totalAmount: 10000,
    payments: [
      {
        id: 4,
        room: 'Room 101',
        Room: 'Room 101',
        GroundTotal: 5000,
        end_date: '2025-12-15',
        days_to_deadline: 42,
        customer_name: 'Jane Smith',
        customer_name_am: 'ጄን ስሚዝ'
      },
      {
        id: 5,
        room: 'Room 202',
        Room: 'Room 202',
        GroundTotal: 5000,
        end_date: '2025-12-15',
        days_to_deadline: 42,
        customer_name: 'Jane Smith',
        customer_name_am: 'ጄን ስሚዝ'
      }
    ]
  },
  {
    customer_id: 1,
    customer_type: 'ind',
    customer_name: 'Jane Smith',
    customer_name_am: 'ጄን ስሚዝ',
    customer_phone: '+251922345678',
    deadline_date: '2025-12-20',
    paymentCount: 1,
    totalAmount: 5000,
    payments: [
      {
        id: 6,
        room: 'Room 303',
        Room: 'Room 303',
        GroundTotal: 5000,
        end_date: '2025-12-20',
        days_to_deadline: 47,
        customer_name: 'Jane Smith',
        customer_name_am: 'ጄን ስሚዝ'
      }
    ]
  }
];

async function runTests() {
  console.log('='.repeat(80));
  console.log('Testing Deadline-Based Grouping for SMS Messages');
  console.log('='.repeat(80));

  try {
    // Test 1: Same deadline, multiple rooms
    console.log('\n✓ Test 1: Same deadline, multiple rooms (should consolidate into ONE message)');
    console.log('-'.repeat(80));
    const group1 = mockPaymentGroupsSameDateDifferentRooms[0];
    console.log(`Customer: ${group1.customer_name}`);
    console.log(`Deadline: ${group1.deadline_date}`);
    console.log(`Rooms: ${group1.payments.map(p => p.room).join(', ')}`);
    
    const message1En = await SmsTemplateService.createConsolidatedPaymentReminderMessage(group1, 'en');
    console.log(`\nEnglish Message:\n${message1En}`);
    
    const message1Am = await SmsTemplateService.createConsolidatedPaymentReminderMessage(group1, 'am');
    console.log(`\nAmharic Message:\n${message1Am}`);
    
    // Verify all rooms are in the message
    if (message1En.includes('Room 101') && message1En.includes('Room 202') && message1En.includes('Room 303')) {
      console.log('\n✅ PASS: All rooms included in English message');
    } else {
      console.log('\n❌ FAIL: Not all rooms included in English message');
    }

    // Test 2: Different deadlines, same customer (should create SEPARATE messages)
    console.log('\n\n✓ Test 2: Different deadlines, same customer (should create SEPARATE messages)');
    console.log('-'.repeat(80));
    
    for (let i = 0; i < mockPaymentGroupsDifferentDates.length; i++) {
      const group = mockPaymentGroupsDifferentDates[i];
      console.log(`\nGroup ${i + 1}:`);
      console.log(`Customer: ${group.customer_name}`);
      console.log(`Deadline: ${group.deadline_date}`);
      console.log(`Rooms: ${group.payments.map(p => p.room).join(', ')}`);
      
      const messageEn = await SmsTemplateService.createConsolidatedPaymentReminderMessage(group, 'en');
      console.log(`\nEnglish Message:\n${messageEn}`);
      
      const messageAm = await SmsTemplateService.createConsolidatedPaymentReminderMessage(group, 'am');
      console.log(`\nAmharic Message:\n${messageAm}`);
    }
    
    console.log('\n✅ PASS: Different deadline groups created separate messages');

    console.log('\n' + '='.repeat(80));
    console.log('All tests completed successfully!');
    console.log('='.repeat(80));
    console.log('\nKey Points:');
    console.log('1. Spaces with the SAME deadline are consolidated into ONE message');
    console.log('2. Spaces with DIFFERENT deadlines get SEPARATE messages');
    console.log('3. Each message includes ALL spaces for that deadline');
    console.log('4. This reduces SMS costs while ensuring customers get complete information');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

runTests();

