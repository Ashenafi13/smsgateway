/**
 * Database migration script to add SMS tracking fields
 * Adds fields to track:
 * 1. SMS sent before deadline
 * 2. SMS sent after deadline
 * 3. Scheduler time settings
 * Run with: node migrate-sms-tracking.js
 */

require('dotenv').config();
const { connectSMSDB, sql } = require('./src/config/database');

async function migrateSmsTracking() {
  console.log('=== SMS Tracking & Scheduler Settings Migration ===\n');
  
  try {
    // Connect to SMS Gateway database
    console.log('1. Connecting to SMS Gateway database...');
    const pool = await connectSMSDB();
    console.log('✓ Database connection established\n');

    const request = pool.request();

    // Step 1: Add SMS tracking columns to tbls_sms_scheduler_jobs
    console.log('2. Checking tbls_sms_scheduler_jobs table structure...');
    const jobsTableCheck = await request.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'tbls_sms_scheduler_jobs'
      AND COLUMN_NAME IN ('sms_type', 'customer_id', 'customer_type')
    `);

    const existingJobsColumns = jobsTableCheck.recordset.map(row => row.COLUMN_NAME);
    console.log('Existing tracking columns:', existingJobsColumns);

    // Add missing columns to tbls_sms_scheduler_jobs
    const jobsColumnsToAdd = [
      { name: 'sms_type', type: 'NVARCHAR(50)', nullable: true, description: 'before_deadline or after_deadline' },
      { name: 'customer_id', type: 'INT', nullable: true, description: 'Customer ID for tracking' },
      { name: 'customer_type', type: 'NVARCHAR(10)', nullable: true, description: 'com or ind' }
    ];

    let addedJobsColumns = 0;
    for (const column of jobsColumnsToAdd) {
      if (!existingJobsColumns.includes(column.name)) {
        console.log(`   Adding column ${column.name} to tbls_sms_scheduler_jobs...`);
        await request.query(`
          ALTER TABLE tbls_sms_scheduler_jobs 
          ADD ${column.name} ${column.type} ${column.nullable ? 'NULL' : 'NOT NULL'}
        `);
        console.log(`   ✓ Column ${column.name} added`);
        addedJobsColumns++;
      }
    }

    // Step 2: Create tbls_settings_scheduler table
    console.log('\n3. Checking if tbls_settings_scheduler table exists...');
    const schedulerTableCheck = await request.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'tbls_settings_scheduler'
    `);

    const schedulerTableExists = schedulerTableCheck.recordset[0].count > 0;

    if (!schedulerTableExists) {
      console.log('   Creating tbls_settings_scheduler table...');
      await request.query(`
        CREATE TABLE tbls_settings_scheduler (
          id INT IDENTITY(1,1) PRIMARY KEY,
          scheduler_name NVARCHAR(100) NOT NULL UNIQUE,
          cron_expression NVARCHAR(100) NOT NULL,
          description NVARCHAR(255) NULL,
          is_active INT NOT NULL DEFAULT 1,
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE()
        )
      `);
      console.log('   ✓ Table tbls_settings_scheduler created successfully');

      // Insert default scheduler settings
      console.log('   Inserting default scheduler settings...');
      await request.query(`
        INSERT INTO tbls_settings_scheduler (scheduler_name, cron_expression, description, is_active)
        VALUES 
          ('payment_deadline_check', '0 9 * * *', 'Check payment deadlines daily at 9 AM', 1),
          ('contract_deadline_check', '0 9 * * *', 'Check contract deadlines daily at 9 AM', 1),
          ('sms_execution', '0 */5 * * * *', 'Execute pending SMS jobs every 5 minutes', 1),
          ('payment_display_deadline_check', '*/30 * * * * *', 'Check payment display deadlines every 30 seconds', 1),
          ('contract_display_deadline_check', '*/30 * * * * *', 'Check contract display deadlines every 30 seconds', 1)
      `);
      console.log('   ✓ Default scheduler settings inserted');
    } else {
      console.log('   ✓ Table tbls_settings_scheduler already exists');
    }

    // Step 3: Verify the changes
    console.log('\n4. Verifying updated table structures...');
    
    const jobsStructure = await request.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'tbls_sms_scheduler_jobs'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nCurrent tbls_sms_scheduler_jobs structure:');
    console.table(jobsStructure.recordset);

    const schedulerStructure = await request.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'tbls_settings_scheduler'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nCurrent tbls_settings_scheduler structure:');
    console.table(schedulerStructure.recordset);

    console.log('\n=== Migration completed successfully! ===');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSmsTracking();

