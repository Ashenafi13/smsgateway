/**
 * Test the updated Amharic contract message
 */

const SmsTemplateService = require('./src/services/smsTemplateService');

async function testUpdatedMessage() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING UPDATED AMHARIC CONTRACT MESSAGE');
  console.log('='.repeat(80) + '\n');

  try {
    const contractGroup = {
      customer_name: 'Test Customer',
      customer_name_am: 'ሙከራ ደንበኛ',
      contractCount: 2,
      totalRent: 5500,
      contracts: [
        { 
          ID: 301, 
          RoomID: 'B-201', 
          EndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), 
          RoomPrice: 2500, 
          days_to_deadline: 10 
        },
        { 
          ID: 302, 
          RoomID: 'B-202', 
          EndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
          RoomPrice: 3000, 
          days_to_deadline: 15 
        }
      ]
    };

    console.log('📝 Testing Amharic Contract Message:');
    console.log('-'.repeat(80));
    
    const amharicMsg = await SmsTemplateService.createConsolidatedContractReminderMessage(contractGroup, 'am');
    
    console.log('✅ Message Generated:');
    console.log(amharicMsg);
    console.log('');
    console.log('📊 Message Details:');
    console.log(`   Length: ${amharicMsg.length} characters`);
    console.log('');

    // Check if the message contains the correct Amharic text
    const expectedText = 'እባክዎ ውሉን ለማደስ ወይም የመውጫ ሂደቶችን ለማዘጋጀት ያግኙን።';
    if (amharicMsg.includes(expectedText)) {
      console.log('✅ CORRECT: Message contains the expected Amharic text from projectPlan.txt');
      console.log(`   "${expectedText}"`);
    } else {
      console.log('❌ ERROR: Message does NOT contain the expected Amharic text');
      console.log(`   Expected: "${expectedText}"`);
    }

    console.log('');
    console.log('-'.repeat(80));
    console.log('📝 Testing English Contract Message:');
    console.log('-'.repeat(80));
    
    const englishMsg = await SmsTemplateService.createConsolidatedContractReminderMessage(contractGroup, 'en');
    
    console.log('✅ Message Generated:');
    console.log(englishMsg);
    console.log('');
    console.log('📊 Message Details:');
    console.log(`   Length: ${englishMsg.length} characters`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testUpdatedMessage().catch(console.error);
