require('dotenv').config();
const { connectBMSDB, connectSMSDB } = require('./src/config/database');
const Payment = require('./src/models/Payment');
const Settings = require('./src/models/Settings');
const SmsSchedulerJob = require('./src/models/SmsSchedulerJob');

async function testScheduler() {
  try {
    console.log('=== SMS Gateway Scheduler Test ===\n');
    
    // Connect to databases
    console.log('1. Connecting to databases...');
    await connectBMSDB();
    await connectSMSDB();
    console.log('✓ Database connections established\n');

    // Get current settings
    console.log('2. Getting current settings...');
    const daysToDeadline = await Settings.getNumberOfDaysToDeadline();
    console.log(`✓ Days to deadline setting: ${daysToDeadline}\n`);

    // Test payment deadline detection
    console.log('3. Testing payment deadline detection...');
    console.log(`Looking for payments due within ${daysToDeadline} days (including overdue)...`);
    
    const paymentsApproachingDeadline = await Payment.findApproachingDeadline(daysToDeadline);
    console.log(`✓ Found ${paymentsApproachingDeadline.length} payments approaching deadline\n`);

    if (paymentsApproachingDeadline.length > 0) {
      console.log('Payment Details:');
      console.log('================');
      paymentsApproachingDeadline.forEach((payment, index) => {
        const endDate = new Date(payment.end_date);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        console.log(`${index + 1}. Payment ID: ${payment.id}`);
        console.log(`   Customer: ${payment.customer_name || 'Unknown'}`);
        console.log(`   Phone: ${payment.customer_phone || 'No phone'}`);
        console.log(`   End Date: ${payment.end_date}`);
        console.log(`   Days to deadline: ${payment.days_to_deadline || daysRemaining}`);
        console.log(`   Payment Status: ${payment.paymentStatus || 'Not set'}`);
        console.log(`   Customer Type: ${payment.customer_type}`);
        console.log(`   Paid By: ${payment.paid_by}`);
        console.log('   ---');
      });
      console.log();
    }

    // Check existing SMS jobs
    console.log('4. Checking existing SMS jobs...');
    const existingJobs = await SmsSchedulerJob.findByStatus('pending');
    console.log(`✓ Found ${existingJobs.length} pending SMS jobs\n`);

    if (existingJobs.length > 0) {
      console.log('Existing SMS Jobs:');
      console.log('==================');
      existingJobs.forEach((job, index) => {
        console.log(`${index + 1}. Job ID: ${job.id}`);
        console.log(`   Phone: ${job.phoneNumber}`);
        console.log(`   Type: ${job.jobtype}`);
        console.log(`   Status: ${job.jobStatus}`);
        console.log(`   Execute Date: ${job.executeDate}`);
        console.log(`   Message: ${job.message.substring(0, 100)}...`);
        console.log('   ---');
      });
      console.log();
    }

    // Test specific payment query
    console.log('5. Testing specific payment query...');
    console.log('Checking for payments with end_date = 2025-10-12...');
    
    const { getBMSPool, sql } = require('./src/config/database');
    const pool = getBMSPool();
    const request = pool.request();
    
    const specificResult = await request.query(`
      SELECT 
        p.*,
        CASE 
          WHEN p.customer_type = 'com' THEN cp.CompanyName
          WHEN p.customer_type = 'ind' THEN ir.fullname
          ELSE 'Unknown'
        END as customer_name,
        CASE 
          WHEN p.customer_type = 'com' THEN cp.PhoneNumber
          WHEN p.customer_type = 'ind' THEN ir.phone
          ELSE NULL
        END as customer_phone,
        DATEDIFF(day, GETDATE(), p.end_date) as days_to_deadline
      FROM payment p
      LEFT JOIN company_profile cp ON p.customer_type = 'com' AND p.paid_by = cp.com_id
      LEFT JOIN individual_renters ir ON p.customer_type = 'ind' AND p.paid_by = ir.ind_id
      WHERE p.end_date = '2025-10-12'
    `);

    console.log(`✓ Found ${specificResult.recordset.length} payments with end_date = 2025-10-12`);
    
    if (specificResult.recordset.length > 0) {
      console.log('\nSpecific Payment Details:');
      console.log('=========================');
      specificResult.recordset.forEach((payment, index) => {
        console.log(`${index + 1}. Payment ID: ${payment.id}`);
        console.log(`   Customer: ${payment.customer_name || 'Unknown'}`);
        console.log(`   Phone: ${payment.customer_phone || 'No phone'}`);
        console.log(`   Customer Type: ${payment.customer_type}`);
        console.log(`   Paid By: ${payment.paid_by}`);
        console.log(`   Payment Status: ${payment.paymentStatus || 'Not set'}`);
        console.log(`   Start Date: ${payment.start_date}`);
        console.log(`   End Date: ${payment.end_date}`);
        console.log(`   Days to deadline: ${payment.days_to_deadline}`);
        console.log('   ---');
      });
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testScheduler();
