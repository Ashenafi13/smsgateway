const SmsTemplateService = require('./src/services/smsTemplateService');

async function testConsolidatedMultipleSpaces() {
  try {
    console.log('🧪 Testing Consolidated Messages with Multiple Spaces/Displays\n');
    console.log('='.repeat(80));

    // Test 1: Consolidated Payment with Multiple Spaces
    console.log('\n1️⃣  CONSOLIDATED PAYMENT MESSAGE - MULTIPLE SPACES');
    console.log('-'.repeat(80));
    
    const paymentGroupMultiple = {
      customer_id: 1,
      customer_type: 'com',
      customer_name: 'ABC Company',
      customer_name_am: 'ኤቢሲ ኩባንያ',
      customer_phone: '+251911234567',
      paymentCount: 3,
      totalAmount: 15000,
      earliestDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      payments: [
        {
          id: 1,
          room: 'Room 101',
          Room: 'Room 101',
          end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          GroundTotal: 5000,
          line_total: 5000,
          customer_name: 'ABC Company',
          customer_name_am: 'ኤቢሲ ኩባንያ'
        },
        {
          id: 2,
          room: 'Room 202',
          Room: 'Room 202',
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          GroundTotal: 5000,
          line_total: 5000,
          customer_name: 'ABC Company',
          customer_name_am: 'ኤቢሲ ኩባንያ'
        },
        {
          id: 3,
          room: 'Room 303',
          Room: 'Room 303',
          end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          GroundTotal: 5000,
          line_total: 5000,
          customer_name: 'ABC Company',
          customer_name_am: 'ኤቢሲ ኩባንያ'
        }
      ]
    };

    const consolidatedPaymentEn = await SmsTemplateService.createConsolidatedPaymentReminderMessage(paymentGroupMultiple, 'en');
    const consolidatedPaymentAm = await SmsTemplateService.createConsolidatedPaymentReminderMessage(paymentGroupMultiple, 'am');
    
    console.log(`✅ English Message (${consolidatedPaymentEn.length} chars):`);
    console.log(`   ${consolidatedPaymentEn}\n`);
    console.log(`✅ Amharic Message (${consolidatedPaymentAm.length} chars):`);
    console.log(`   ${consolidatedPaymentAm}\n`);
    
    // Check if all rooms are included
    const allRoomsIncluded = consolidatedPaymentEn.includes('Room 101') && 
                             consolidatedPaymentEn.includes('Room 202') && 
                             consolidatedPaymentEn.includes('Room 303');
    console.log(`✅ All rooms included: ${allRoomsIncluded ? 'YES ✓' : 'NO ✗'}\n`);

    // Test 2: Consolidated Contract with Multiple Spaces
    console.log('\n2️⃣  CONSOLIDATED CONTRACT MESSAGE - MULTIPLE SPACES');
    console.log('-'.repeat(80));
    
    const contractGroupMultiple = {
      customer_id: 2,
      customer_type: 'ind',
      customer_name: 'John Doe',
      customer_name_am: 'ጆን ዶ',
      customer_phone: '+251922345678',
      contractCount: 2,
      totalRent: 10000,
      earliestDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      contracts: [
        {
          ID: 1,
          id: 1,
          RoomID: 'Suite A',
          Room: 'Suite A',
          room: 'Suite A',
          EndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          RoomPrice: 5000,
          customer_name: 'John Doe',
          customer_name_am: 'ጆን ዶ'
        },
        {
          ID: 2,
          id: 2,
          RoomID: 'Suite B',
          Room: 'Suite B',
          room: 'Suite B',
          EndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          RoomPrice: 5000,
          customer_name: 'John Doe',
          customer_name_am: 'ጆን ዶ'
        }
      ]
    };

    const consolidatedContractEn = await SmsTemplateService.createConsolidatedContractReminderMessage(contractGroupMultiple, 'en');
    const consolidatedContractAm = await SmsTemplateService.createConsolidatedContractReminderMessage(contractGroupMultiple, 'am');
    
    console.log(`✅ English Message (${consolidatedContractEn.length} chars):`);
    console.log(`   ${consolidatedContractEn}\n`);
    console.log(`✅ Amharic Message (${consolidatedContractAm.length} chars):`);
    console.log(`   ${consolidatedContractAm}\n`);
    
    // Check if all rooms are included
    const allContractRoomsIncluded = consolidatedContractEn.includes('Suite A') && 
                                     consolidatedContractEn.includes('Suite B');
    console.log(`✅ All contract rooms included: ${allContractRoomsIncluded ? 'YES ✓' : 'NO ✗'}\n`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testConsolidatedMultipleSpaces();

