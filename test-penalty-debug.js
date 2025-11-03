require('dotenv').config();
const { PenalityPeriod } = require('./src/models');
const PenaltyService = require('./src/services/penaltyService');
const DateUtils = require('./src/utils/dateUtils');
const { connectBMSDB } = require('./src/config/database');

async function testPenaltyCalculation() {
  try {
    console.log('================================================================================');
    console.log('PENALTY CALCULATION DEBUG TEST');
    console.log('================================================================================\n');

    // Connect to BMS database
    console.log('Connecting to BMS database...');
    await connectBMSDB();
    console.log('✅ Connected to BMS database\n');

    // Test 1: Get all penalty periods
    console.log('1. FETCHING ALL PENALTY PERIODS FROM DATABASE');
    console.log('-'.repeat(80));
    const allPeriods = await PenalityPeriod.findAll();
    console.log(`Found ${allPeriods.length} penalty periods:\n`);
    
    allPeriods.forEach((period, index) => {
      console.log(`Period ${index + 1}:`);
      console.log(`  ID: ${period.ID}`);
      console.log(`  Period: ${period.Period}`);
      console.log(`  StartPeriod: ${period.StartPeriod}`);
      console.log(`  EndPeriod: ${period.EndPeriod}`);
      console.log(`  AmountPerMonth: ${period.AmountPerMonth}`);
      console.log(`  AmountPerDays: ${period.AmountPerDays}`);
      console.log(`  AmountPersentagePerMonth: ${period.AmountPersentagePerMonth}`);
      console.log(`  AmountPersentagePerDay: ${period.AmountPersentagePerDay}`);
      console.log('');
    });

    // Test 2: Test penalty calculation for different overdue days
    console.log('\n2. TESTING PENALTY CALCULATION FOR DIFFERENT OVERDUE DAYS');
    console.log('-'.repeat(80));
    
    const testCases = [
      { paymentAmount: 3000.02, overdueDays: 1, description: '1 day overdue' },
      { paymentAmount: 3000.02, overdueDays: 5, description: '5 days overdue' },
      { paymentAmount: 3000.02, overdueDays: 10, description: '10 days overdue' },
      { paymentAmount: 3000.02, overdueDays: 30, description: '30 days overdue' },
      { paymentAmount: 3000.02, overdueDays: 60, description: '60 days overdue' },
      { paymentAmount: 5000, overdueDays: 2, description: '5000 ETB, 2 days overdue' }
    ];

    for (const testCase of testCases) {
      console.log(`\nTest: ${testCase.description}`);
      console.log(`  Payment Amount: ${testCase.paymentAmount} ብር`);
      console.log(`  Overdue Days: ${testCase.overdueDays}`);
      
      // Find penalty period
      const penaltyPeriod = await PenalityPeriod.findByOverdueDays(testCase.overdueDays);
      if (penaltyPeriod) {
        console.log(`  Penalty Period Found: ${penaltyPeriod.Period}`);
        console.log(`  AmountPercentagePerDay: ${penaltyPeriod.AmountPersentagePerDay}%`);
      } else {
        console.log(`  ⚠️  NO PENALTY PERIOD FOUND`);
      }
      
      // Calculate penalty
      const penaltyDetails = await PenalityPeriod.calculatePenaltyWithDetails(
        testCase.paymentAmount,
        testCase.overdueDays
      );
      
      console.log(`  Penalty Amount: ${penaltyDetails.penaltyAmount} ብር`);
      console.log(`  Total Amount: ${penaltyDetails.totalAmount} ብር`);
      console.log(`  Formula: (${testCase.paymentAmount} × ${penaltyDetails.penaltyPercentagePerDay}% / 100) × ${testCase.overdueDays} = ${penaltyDetails.penaltyAmount}`);
    }

    // Test 3: Test with actual payment object
    console.log('\n\n3. TESTING WITH ACTUAL PAYMENT OBJECT');
    console.log('-'.repeat(80));
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2); // 2 days ago
    
    const testPayment = {
      id: 'TEST-001',
      GroundTotal: 3000.02,
      end_date: pastDate,
      customer_name: 'Test Customer',
      customer_name_am: 'ሙከራ ደንበኛ',
      room: '006'
    };

    console.log(`\nPayment Details:`);
    console.log(`  ID: ${testPayment.id}`);
    console.log(`  Amount: ${testPayment.GroundTotal} ብር`);
    console.log(`  End Date: ${testPayment.end_date.toISOString().split('T')[0]}`);
    console.log(`  Today: ${new Date().toISOString().split('T')[0]}`);

    const overdueDays = PenaltyService.calculateOverdueDays(testPayment.end_date);
    console.log(`  Overdue Days: ${overdueDays}`);

    const penaltyResult = await PenaltyService.calculatePaymentPenalty(testPayment);
    console.log(`\nPenalty Calculation Result:`);
    console.log(`  Original Amount: ${penaltyResult.originalAmount} ብር`);
    console.log(`  Penalty Amount: ${penaltyResult.penaltyAmount} ብር`);
    console.log(`  Total Amount: ${penaltyResult.totalAmount} ብር`);
    console.log(`  Days Overdue: ${penaltyResult.daysOverdue}`);
    console.log(`  Has Penalty: ${penaltyResult.hasPenalty}`);

    console.log('\n================================================================================');
    console.log('✅ PENALTY DEBUG TEST COMPLETED');
    console.log('================================================================================\n');

  } catch (error) {
    console.error('❌ Error during penalty debug test:', error);
  }
}

testPenaltyCalculation();

