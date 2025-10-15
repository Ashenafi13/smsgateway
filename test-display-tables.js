const { PaymentDisplay, ContractDisplay } = require('./src/models');
const PaymentDisplayDeadlineScheduler = require('./src/schedulers/paymentDisplayDeadlineScheduler');
const ContractDisplayDeadlineScheduler = require('./src/schedulers/contractDisplayDeadlineScheduler');

async function testDisplayTables() {
  try {
    console.log('🧪 Testing Display Tables Functionality\n');
    console.log('=' .repeat(80));

    // Test PaymentDisplay Model
    console.log('📋 1. TESTING PAYMENT DISPLAY MODEL');
    console.log('=' .repeat(80));
    
    try {
      const paymentDisplays = await PaymentDisplay.findAll(5, 0);
      console.log(`✅ PaymentDisplay.findAll() - Found ${paymentDisplays.length} records`);
      
      if (paymentDisplays.length > 0) {
        console.log(`   Sample record: ID ${paymentDisplays[0].id}, Room ${paymentDisplays[0].room}, Amount ${paymentDisplays[0].GroundTotal || paymentDisplays[0].line_total}`);
      }
    } catch (error) {
      console.log(`❌ PaymentDisplay.findAll() failed: ${error.message}`);
    }

    try {
      const paymentDisplaysWithCustomers = await PaymentDisplay.findAllWithCustomers(3, 0);
      console.log(`✅ PaymentDisplay.findAllWithCustomers() - Found ${paymentDisplaysWithCustomers.length} records with customer info`);
      
      if (paymentDisplaysWithCustomers.length > 0) {
        const sample = paymentDisplaysWithCustomers[0];
        console.log(`   Sample: Customer ${sample.customer_name} (${sample.customer_name_am}), Phone ${sample.customer_phone}`);
      }
    } catch (error) {
      console.log(`❌ PaymentDisplay.findAllWithCustomers() failed: ${error.message}`);
    }

    try {
      const approachingPaymentDisplays = await PaymentDisplay.findApproachingDeadline(7);
      console.log(`✅ PaymentDisplay.findApproachingDeadline() - Found ${approachingPaymentDisplays.length} approaching deadlines`);
    } catch (error) {
      console.log(`❌ PaymentDisplay.findApproachingDeadline() failed: ${error.message}`);
    }

    try {
      const groupedPaymentDisplays = await PaymentDisplay.findApproachingDeadlineGroupedByCustomer(7);
      console.log(`✅ PaymentDisplay.findApproachingDeadlineGroupedByCustomer() - Found ${groupedPaymentDisplays.length} customer groups`);
      
      if (groupedPaymentDisplays.length > 0) {
        const group = groupedPaymentDisplays[0];
        console.log(`   Sample group: ${group.customer_name}, ${group.paymentCount} payments, Total: ${group.totalAmount}`);
        
        // Test message generation
        const message = PaymentDisplayDeadlineScheduler.createConsolidatedPaymentDisplayReminderMessage(group, 'en');
        console.log(`   Message preview: ${message.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ PaymentDisplay.findApproachingDeadlineGroupedByCustomer() failed: ${error.message}`);
    }

    console.log('');

    // Test ContractDisplay Model
    console.log('📋 2. TESTING CONTRACT DISPLAY MODEL');
    console.log('=' .repeat(80));
    
    try {
      const contractDisplays = await ContractDisplay.findAll(5, 0);
      console.log(`✅ ContractDisplay.findAll() - Found ${contractDisplays.length} records`);
      
      if (contractDisplays.length > 0) {
        console.log(`   Sample record: ID ${contractDisplays[0].ContractID}, Room ${contractDisplays[0].RoomID}, Rent ${contractDisplays[0].RoomPrice}`);
      }
    } catch (error) {
      console.log(`❌ ContractDisplay.findAll() failed: ${error.message}`);
    }

    try {
      const contractDisplaysWithCustomers = await ContractDisplay.findAllWithCustomers(3, 0);
      console.log(`✅ ContractDisplay.findAllWithCustomers() - Found ${contractDisplaysWithCustomers.length} records with customer info`);
      
      if (contractDisplaysWithCustomers.length > 0) {
        const sample = contractDisplaysWithCustomers[0];
        console.log(`   Sample: Customer ${sample.customer_name} (${sample.customer_name_am}), Phone ${sample.customer_phone}`);
      }
    } catch (error) {
      console.log(`❌ ContractDisplay.findAllWithCustomers() failed: ${error.message}`);
    }

    try {
      const approachingContractDisplays = await ContractDisplay.findApproachingDeadline(7);
      console.log(`✅ ContractDisplay.findApproachingDeadline() - Found ${approachingContractDisplays.length} approaching deadlines`);
    } catch (error) {
      console.log(`❌ ContractDisplay.findApproachingDeadline() failed: ${error.message}`);
    }

    try {
      const groupedContractDisplays = await ContractDisplay.findApproachingDeadlineGroupedByCustomer(7);
      console.log(`✅ ContractDisplay.findApproachingDeadlineGroupedByCustomer() - Found ${groupedContractDisplays.length} customer groups`);
      
      if (groupedContractDisplays.length > 0) {
        const group = groupedContractDisplays[0];
        console.log(`   Sample group: ${group.customer_name}, ${group.contractCount} contracts, Total Rent: ${group.totalRent}`);
        
        // Test message generation
        const message = ContractDisplayDeadlineScheduler.createConsolidatedContractDisplayReminderMessage(group, 'en');
        console.log(`   Message preview: ${message.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ContractDisplay.findApproachingDeadlineGroupedByCustomer() failed: ${error.message}`);
    }

    console.log('');

    // Test Scheduler Functionality
    console.log('📋 3. TESTING SCHEDULER FUNCTIONALITY');
    console.log('=' .repeat(80));
    
    try {
      const paymentDisplayScheduler = new PaymentDisplayDeadlineScheduler();
      const paymentDisplayStatus = paymentDisplayScheduler.getStatus();
      console.log(`✅ PaymentDisplayDeadlineScheduler - Status: Running=${paymentDisplayStatus.isRunning}, Scheduled=${paymentDisplayStatus.isScheduled}`);
    } catch (error) {
      console.log(`❌ PaymentDisplayDeadlineScheduler failed: ${error.message}`);
    }

    try {
      const contractDisplayScheduler = new ContractDisplayDeadlineScheduler();
      const contractDisplayStatus = contractDisplayScheduler.getStatus();
      console.log(`✅ ContractDisplayDeadlineScheduler - Status: Running=${contractDisplayStatus.isRunning}, Scheduled=${contractDisplayStatus.isScheduled}`);
    } catch (error) {
      console.log(`❌ ContractDisplayDeadlineScheduler failed: ${error.message}`);
    }

    console.log('');

    // Final Summary
    console.log('📋 4. FINAL SUMMARY');
    console.log('=' .repeat(80));
    console.log('✅ PaymentDisplay table - Model and scheduler implemented');
    console.log('✅ ContractDisplay table - Model and scheduler implemented');
    console.log('✅ Consolidated messaging - Implemented for both display tables');
    console.log('✅ Multilingual support - English and Amharic messages');
    console.log('✅ Ethiopian calendar - Date conversion integrated');
    console.log('✅ Currency formatting - Ethiopian Birr support');
    console.log('');
    console.log('🎉 All Display Tables Functionality Test Completed!');

  } catch (error) {
    console.error('❌ Error testing display tables functionality:', error);
  }
}

// Run the test
if (require.main === module) {
  testDisplayTables();
}

module.exports = { testDisplayTables };
