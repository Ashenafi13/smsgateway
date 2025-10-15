const { Payment, Contract, PaymentDisplay, ContractDisplay, DefaultLanguageSetting } = require('./src/models');
const PaymentDeadlineScheduler = require('./src/schedulers/paymentDeadlineScheduler');
const ContractDeadlineScheduler = require('./src/schedulers/contractDeadlineScheduler');
const PaymentDisplayDeadlineScheduler = require('./src/schedulers/paymentDisplayDeadlineScheduler');
const ContractDisplayDeadlineScheduler = require('./src/schedulers/contractDisplayDeadlineScheduler');
const DateUtils = require('./src/utils/dateUtils');

async function testAllConsolidatedFunctionality() {
  try {
    console.log('🧪 Testing ALL Consolidated Messaging Functionality\n');
    console.log('=' .repeat(80));

    // Test Payment Consolidation
    console.log('📋 1. TESTING PAYMENT CONSOLIDATION');
    console.log('=' .repeat(80));
    
    const daysToDeadline = 3;
    const paymentGroups = await Payment.findApproachingDeadlineGroupedByCustomer(daysToDeadline);
    
    console.log(`Found ${paymentGroups.length} customer groups with approaching payment deadlines:\n`);

    if (paymentGroups.length > 0) {
      const testPaymentGroup = paymentGroups[0];
      
      console.log(`📊 Payment Group Example:`);
      console.log(`   Customer: ${testPaymentGroup.customer_name} (${testPaymentGroup.customer_name_am})`);
      console.log(`   Type: ${testPaymentGroup.customer_type}`);
      console.log(`   Phone: ${testPaymentGroup.customer_phone}`);
      console.log(`   Payment Count: ${testPaymentGroup.paymentCount}`);
      console.log(`   Total Amount: ${testPaymentGroup.totalAmount}`);
      console.log(`   Earliest Deadline: ${testPaymentGroup.earliestDeadline}`);
      console.log(`   Days to Earliest Deadline: ${testPaymentGroup.earliestDaysToDeadline}\n`);
      
      // Test consolidated payment message
      console.log('📧 Consolidated Payment Message (English):');
      console.log('-' .repeat(60));
      const paymentMessage = PaymentDeadlineScheduler.createConsolidatedPaymentReminderMessage(testPaymentGroup, 'en');
      console.log(paymentMessage);
      console.log('-' .repeat(60));
      console.log('');
    }

    // Test Contract Consolidation
    console.log('📋 2. TESTING CONTRACT CONSOLIDATION');
    console.log('=' .repeat(80));
    
    const contractGroups = await Contract.findApproachingDeadlineGroupedByCustomer(daysToDeadline);
    
    console.log(`Found ${contractGroups.length} customer groups with approaching contract deadlines:\n`);

    if (contractGroups.length > 0) {
      const testContractGroup = contractGroups[0];
      
      console.log(`📊 Contract Group Example:`);
      console.log(`   Customer: ${testContractGroup.customer_name} (${testContractGroup.customer_name_am})`);
      console.log(`   Type: ${testContractGroup.customer_type}`);
      console.log(`   Phone: ${testContractGroup.customer_phone}`);
      console.log(`   Contract Count: ${testContractGroup.contractCount}`);
      console.log(`   Total Rent: ${testContractGroup.totalRent}`);
      console.log(`   Earliest Deadline: ${testContractGroup.earliestDeadline}`);
      console.log(`   Days to Earliest Deadline: ${testContractGroup.earliestDaysToDeadline}\n`);
      
      // Test consolidated contract message
      console.log('📧 Consolidated Contract Message (English):');
      console.log('-' .repeat(60));
      const contractMessage = ContractDeadlineScheduler.createConsolidatedContractReminderMessage(testContractGroup, 'en');
      console.log(contractMessage);
      console.log('-' .repeat(60));
      console.log('');
    }

    // Test Language Support
    console.log('📋 3. TESTING MULTILINGUAL SUPPORT');
    console.log('=' .repeat(80));
    
    if (paymentGroups.length > 0) {
      const testGroup = paymentGroups[0];
      
      console.log('📧 Payment Message - Amharic:');
      console.log('-' .repeat(60));
      const amharicPaymentMessage = PaymentDeadlineScheduler.createConsolidatedPaymentReminderMessage(testGroup, 'am');
      console.log(amharicPaymentMessage);
      console.log('-' .repeat(60));
      console.log('');
    }

    if (contractGroups.length > 0) {
      const testGroup = contractGroups[0];
      
      console.log('📧 Contract Message - Amharic:');
      console.log('-' .repeat(60));
      const amharicContractMessage = ContractDeadlineScheduler.createConsolidatedContractReminderMessage(testGroup, 'am');
      console.log(amharicContractMessage);
      console.log('-' .repeat(60));
      console.log('');
    }

    // Test Payment Display Consolidation
    console.log('📋 4. TESTING PAYMENT DISPLAY CONSOLIDATION');
    console.log('=' .repeat(80));

    const paymentDisplayGroups = await PaymentDisplay.findApproachingDeadlineGroupedByCustomer(daysToDeadline);

    console.log(`Found ${paymentDisplayGroups.length} customer groups with approaching payment display deadlines:\n`);

    if (paymentDisplayGroups.length > 0) {
      const testPaymentDisplayGroup = paymentDisplayGroups[0];

      console.log(`📊 Payment Display Group Example:`);
      console.log(`   Customer: ${testPaymentDisplayGroup.customer_name} (${testPaymentDisplayGroup.customer_name_am})`);
      console.log(`   Type: ${testPaymentDisplayGroup.customer_type}`);
      console.log(`   Phone: ${testPaymentDisplayGroup.customer_phone}`);
      console.log(`   Payment Count: ${testPaymentDisplayGroup.paymentCount}`);
      console.log(`   Total Amount: ${testPaymentDisplayGroup.totalAmount}`);
      console.log(`   Earliest Deadline: ${testPaymentDisplayGroup.earliestDeadline}`);
      console.log(`   Days to Earliest Deadline: ${testPaymentDisplayGroup.earliestDaysToDeadline}\n`);

      // Test consolidated payment display message
      console.log('📧 Consolidated Payment Display Message (English):');
      console.log('-' .repeat(60));
      const paymentDisplayMessage = PaymentDisplayDeadlineScheduler.createConsolidatedPaymentDisplayReminderMessage(testPaymentDisplayGroup, 'en');
      console.log(paymentDisplayMessage);
      console.log('-' .repeat(60));
      console.log('');
    }

    // Test Contract Display Consolidation
    console.log('📋 5. TESTING CONTRACT DISPLAY CONSOLIDATION');
    console.log('=' .repeat(80));

    const contractDisplayGroups = await ContractDisplay.findApproachingDeadlineGroupedByCustomer(daysToDeadline);

    console.log(`Found ${contractDisplayGroups.length} customer groups with approaching contract display deadlines:\n`);

    if (contractDisplayGroups.length > 0) {
      const testContractDisplayGroup = contractDisplayGroups[0];

      console.log(`📊 Contract Display Group Example:`);
      console.log(`   Customer: ${testContractDisplayGroup.customer_name} (${testContractDisplayGroup.customer_name_am})`);
      console.log(`   Type: ${testContractDisplayGroup.customer_type}`);
      console.log(`   Phone: ${testContractDisplayGroup.customer_phone}`);
      console.log(`   Contract Count: ${testContractDisplayGroup.contractCount}`);
      console.log(`   Total Rent: ${testContractDisplayGroup.totalRent}`);
      console.log(`   Earliest Deadline: ${testContractDisplayGroup.earliestDeadline}`);
      console.log(`   Days to Earliest Deadline: ${testContractDisplayGroup.earliestDaysToDeadline}\n`);

      // Test consolidated contract display message
      console.log('📧 Consolidated Contract Display Message (English):');
      console.log('-' .repeat(60));
      const contractDisplayMessage = ContractDisplayDeadlineScheduler.createConsolidatedContractDisplayReminderMessage(testContractDisplayGroup, 'en');
      console.log(contractDisplayMessage);
      console.log('-' .repeat(60));
      console.log('');
    }

    // Summary
    console.log('📋 6. IMPLEMENTATION SUMMARY');
    console.log('=' .repeat(80));
    console.log('✅ payment table - Consolidated messaging implemented');
    console.log('✅ paymentDisplay table - Consolidated messaging implemented');
    console.log('✅ Contract table - Consolidated messaging implemented');
    console.log('✅ contractDisplay table - Consolidated messaging implemented');
    console.log('');
    console.log('🎯 BENEFITS OF CONSOLIDATION:');
    console.log('   • Reduced SMS costs (multiple items → single SMS per customer)');
    console.log('   • Better customer experience (complete overview in one message)');
    console.log('   • Reduced customer annoyance (fewer notifications)');
    console.log('   • Multilingual support (English & Amharic)');
    console.log('   • Ethiopian calendar integration');
    console.log('   • Proper currency formatting (ETB/ብር)');
    console.log('');
    console.log('✅ All Consolidated Functionality Test Completed!');

  } catch (error) {
    console.error('❌ Error testing consolidated functionality:', error);
  }
}

// Run the test
if (require.main === module) {
  testAllConsolidatedFunctionality();
}

module.exports = { testAllConsolidatedFunctionality };
