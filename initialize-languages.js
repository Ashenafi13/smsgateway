require('dotenv').config();
const { connectSMSDB } = require('./src/config/database');
const { DefaultLanguageSetting } = require('./src/models');

async function initializeLanguages() {
  try {
    console.log('=== Language Initialization Script ===\n');
    
    // Connect to SMS Gateway database
    console.log('1. Connecting to SMS Gateway database...');
    await connectSMSDB();
    console.log('✓ Database connection established\n');

    // Initialize default language settings
    console.log('2. Initializing default language settings...');
    await DefaultLanguageSetting.initializeDefaults();
    console.log('✓ Default language settings initialized\n');

    // Get current default language
    console.log('3. Checking current default language...');
    const defaultLang = await DefaultLanguageSetting.getDefaultLanguage();
    console.log(`✓ Current default language: ${defaultLang.lang} (${defaultLang.code})\n`);

    console.log('=== Language Initialization Complete ===');
    console.log('Available languages:');
    console.log('- English (en) - Default');
    console.log('- Amharic (am)');
    console.log('\nYou can now:');
    console.log('1. Use the API endpoints to manage languages');
    console.log('2. Set Amharic as default using: POST /api/language/default/set');
    console.log('3. Test the scheduler with different language settings');

  } catch (error) {
    console.error('Initialization failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the initialization
initializeLanguages();
