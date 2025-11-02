/**
 * Database migration script to add SMS settings columns to tbls_settings table
 * Run with: node migrate-sms-settings.js
 */

require('dotenv').config();
const { connectSMSDB, sql } = require('./src/config/database');

async function migrateSmsSettings() {
  console.log('=== SMS Settings Migration Script ===\n');
  
  try {
    // Connect to SMS Gateway database
    console.log('1. Connecting to SMS Gateway database...');
    const pool = await connectSMSDB();
    console.log('✓ Database connection established\n');

    // Check if table exists first
    console.log('2. Checking if tbls_settings_sms table exists...');
    const request = pool.request();

    const tableCheck = await request.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'tbls_settings_sms'
    `);

    const tableExists = tableCheck.recordset[0].count > 0;
    console.log('Table exists:', tableExists);

    if (!tableExists) {
      console.log('3. Creating tbls_settings_sms table...');
      await request.query(`
        CREATE TABLE tbls_settings_sms (
          id INT IDENTITY(1,1) PRIMARY KEY,
          numberOfDaysToDeadline INT NOT NULL DEFAULT 7,
          smsApiToken NVARCHAR(255) NULL,
          smsShortcodeId NVARCHAR(50) NULL,
          smsCallbackUrl NVARCHAR(255) NULL,
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE()
        )
      `);
      console.log('✓ Table tbls_settings_sms created successfully');

      // Insert default settings
      await request.query(`
        INSERT INTO tbls_settings_sms (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl)
        VALUES (7, NULL, NULL, NULL)
      `);
      console.log('✓ Default settings inserted');

    } else {
      console.log('✓ Table tbls_settings_sms already exists');

      // Check if columns already exist
      console.log('3. Checking existing table structure...');
      const columnCheck = await request.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'tbls_settings_sms'
        AND COLUMN_NAME IN ('smsApiToken', 'smsShortcodeId', 'smsCallbackUrl')
      `);

      const existingColumns = columnCheck.recordset.map(row => row.COLUMN_NAME);
      console.log('Existing SMS columns:', existingColumns);

      // Add missing columns
      const columnsToAdd = [
        { name: 'smsApiToken', type: 'NVARCHAR(255)', nullable: true },
        { name: 'smsShortcodeId', type: 'NVARCHAR(50)', nullable: true },
        { name: 'smsCallbackUrl', type: 'NVARCHAR(255)', nullable: true }
      ];

      let addedColumns = 0;

      for (const column of columnsToAdd) {
        if (!existingColumns.includes(column.name)) {
          console.log(`4.${addedColumns + 1}. Adding column ${column.name}...`);

          await request.query(`
            ALTER TABLE tbls_settings_sms
            ADD ${column.name} ${column.type} ${column.nullable ? 'NULL' : 'NOT NULL'}
          `);

          console.log(`✓ Column ${column.name} added successfully`);
          addedColumns++;
        } else {
          console.log(`✓ Column ${column.name} already exists`);
        }
      }

      if (addedColumns === 0) {
        console.log('\n✓ All SMS settings columns already exist. No migration needed.');
      } else {
        console.log(`\n✓ Migration completed successfully. Added ${addedColumns} columns.`);
      }
    }

    // Verify the table structure
    console.log('\n5. Verifying updated table structure...');
    const tableStructure = await request.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'tbls_settings_sms'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nCurrent tbls_settings_sms table structure:');
    console.table(tableStructure.recordset);

    console.log('\n=== Migration completed successfully! ===');

  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateSmsSettings();
}

module.exports = migrateSmsSettings;
