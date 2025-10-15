const { Payment, DefaultLanguageSetting } = require('./src/models');
const PaymentDeadlineScheduler = require('./src/schedulers/paymentDeadlineScheduler');
const DateUtils = require('./src/utils/dateUtils');

async function testConsolidatedPayments() {
  try {
    console.log('🧪 Testing Consolidated Payment Messages\n');

    // Test the grouped payment functionality
    console.log('1. Testing Payment Grouping by Customer...');
    const daysToDeadline = 3;
    const customerGroups = await Payment.findApproachingDeadlineGroupedByCustomer(daysToDeadline);
    
    console.log(`Found ${customerGroups.length} customer groups with approaching deadlines:\n`);

    for (const group of customerGroups) {
      console.log(`📋 Customer Group:`);
      console.log(`   Customer: ${group.customer_name} (${group.customer_name_am})`);
      console.log(`   Type: ${group.customer_type}`);
      console.log(`   Phone: ${group.customer_phone}`);
      console.log(`   Payment Count: ${group.paymentCount}`);
      console.log(`   Total Amount: ${group.totalAmount}`);
      console.log(`   Earliest Deadline: ${group.earliestDeadline}`);
      console.log(`   Days to Earliest Deadline: ${group.earliestDaysToDeadline}`);
      
      console.log(`   Individual Payments:`);
      group.payments.forEach((payment, index) => {
        console.log(`     ${index + 1}. Payment ID: ${payment.id}, Room: ${payment.room}, Amount: ${payment.GroundTotal || payment.line_total}, End Date: ${payment.end_date}, Days: ${payment.days_to_deadline}`);
      });
      console.log('');
    }

    // Test message generation for both languages
    if (customerGroups.length > 0) {
      const testGroup = customerGroups[0];
      
      console.log('2. Testing Consolidated Message Generation...\n');
      
      // Test English message
      console.log('📧 English Consolidated Message:');
      console.log('=' .repeat(50));
      const englishMessage = PaymentDeadlineScheduler.createConsolidatedPaymentReminderMessage(testGroup, 'en');
      console.log(englishMessage);
      console.log('=' .repeat(50));
      console.log('');
      
      // Test Amharic message
      console.log('📧 Amharic Consolidated Message:');
      console.log('=' .repeat(50));
      const amharicMessage = PaymentDeadlineScheduler.createConsolidatedPaymentReminderMessage(testGroup, 'am');
      console.log(amharicMessage);
      console.log('=' .repeat(50));
      console.log('');
    }

    // Test individual vs consolidated comparison
    if (customerGroups.length > 0) {
      const testGroup = customerGroups[0];
      
      console.log('3. Comparison: Individual vs Consolidated Messages...\n');
      
      console.log('📧 OLD WAY - Individual Messages:');
      console.log('-' .repeat(30));
      testGroup.payments.forEach((payment, index) => {
        const individualMessage = PaymentDeadlineScheduler.createPaymentReminderMessage(payment, payment.days_to_deadline, 'en');
        console.log(`Message ${index + 1} for Payment ${payment.id}:`);
        console.log(individualMessage);
        console.log('-' .repeat(30));
      });
      
      console.log('\n📧 NEW WAY - Consolidated Message:');
      console.log('-' .repeat(30));
      const consolidatedMessage = PaymentDeadlineScheduler.createConsolidatedPaymentReminderMessage(testGroup, 'en');
      console.log(consolidatedMessage);
      console.log('-' .repeat(30));
      
      console.log(`\n💡 Benefits:`);
      console.log(`   - Reduced from ${testGroup.paymentCount} SMS to 1 SMS`);
      console.log(`   - Customer gets complete overview in one message`);
      console.log(`   - Reduced SMS costs and customer annoyance`);
    }

    console.log('\n✅ Consolidated Payment Test Completed!');

  } catch (error) {
    console.error('❌ Error testing consolidated payments:', error);
  }
}

// Helper function to format sample data
function formatSampleData() {
  console.log('📊 Sample Data Structure:');
  console.log(`
Customer Group Object:
{
  customer_id: "123",
  customer_type: "com",
  customer_name: "Yifat Trading Plc",
  customer_name_am: "ይፋት ትሬዲንግ ፒኤልሲ",
  customer_phone: "+251911595699",
  payments: [
    {
      id: 5811,
      room: "ሕ4-408",
      GroundTotal: 1000,
      end_date: "2025-10-12",
      days_to_deadline: -3
    },
    {
      id: 5812,
      room: "ሕ4-409", 
      GroundTotal: 1500,
      end_date: "2025-10-15",
      days_to_deadline: 0
    }
  ],
  paymentCount: 2,
  totalAmount: 2500,
  earliestDeadline: "2025-10-12",
  earliestDaysToDeadline: -3
}
  `);
}

// Run the test
if (require.main === module) {
  formatSampleData();
  testConsolidatedPayments();
}

module.exports = { testConsolidatedPayments };
