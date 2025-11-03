/**
 * Debug test to see what's happening with grouping
 */

const SmsTemplateService = require('./src/services/smsTemplateService');

// Mock contract groups with multiple contracts
const mockContractGroups = [
  {
    customer_id: 1,
    customer_type: 'ind',
    customer_name: 'Test Customer',
    customer_name_am: 'ሙከራ ደንበኛ',
    customer_phone: '+251911234567',
    deadline_date: '2025-12-15',
    contractCount: 3,
    totalRent: 15000,
    earliestDaysToDeadline: 42,
    contracts: [
      {
        ContractID: 1,
        RoomID: '006',
        Room: '006',
        room: '006',
        RoomPrice: 5000,
        EndDate: '2025-12-15',
        days_to_deadline: 42,
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
        days_to_deadline: 42,
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
        days_to_deadline: 42,
        customer_name: 'Test Customer',
        customer_name_am: 'ሙከራ ደንበኛ'
      }
    ]
  }
];

async function runDebugTest() {
  console.log('='.repeat(80));
  console.log('Debug Test: Checking Consolidated Message Creation');
  console.log('='.repeat(80));

  try {
    const group = mockContractGroups[0];
    
    console.log('\nInput Group:');
    console.log(`- Customer: ${group.customer_name}`);
    console.log(`- Contract Count: ${group.contractCount}`);
    console.log(`- Contracts:`, group.contracts.map(c => ({ RoomID: c.RoomID, ContractID: c.ContractID })));

    console.log('\n' + '-'.repeat(80));
    console.log('Creating Amharic Message...');
    console.log('-'.repeat(80));
    
    const messageAm = await SmsTemplateService.createConsolidatedContractReminderMessage(group, 'am');
    
    console.log('\nGenerated Amharic Message:');
    console.log(messageAm);
    
    console.log('\n' + '-'.repeat(80));
    console.log('Creating English Message...');
    console.log('-'.repeat(80));
    
    const messageEn = await SmsTemplateService.createConsolidatedContractReminderMessage(group, 'en');
    
    console.log('\nGenerated English Message:');
    console.log(messageEn);

    // Check if all rooms are in the message
    const allRoomsInAm = messageAm.includes('006') && messageAm.includes('007') && messageAm.includes('008');
    const allRoomsInEn = messageEn.includes('006') && messageEn.includes('007') && messageEn.includes('008');

    console.log('\n' + '='.repeat(80));
    if (allRoomsInAm && allRoomsInEn) {
      console.log('✅ SUCCESS: All rooms are included in both messages');
    } else {
      console.log('❌ FAILURE: Not all rooms are included');
      console.log(`  - Amharic has all rooms: ${allRoomsInAm}`);
      console.log(`  - English has all rooms: ${allRoomsInEn}`);
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

runDebugTest();

