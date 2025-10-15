const { getSMSPool, sql } = require('../config/database');

class DefaultLanguageSetting {
  constructor(data) {
    this.id = data.id;
    this.default_lang = data.default_lang;
  }

  // Get current default language setting
  static async getDefaultLanguage() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT TOP 1 dls.id, dls.default_lang, l.lang, l.code
        FROM tbls_default_lang_setting dls
        LEFT JOIN tbls_language l ON dls.default_lang = l.id
        ORDER BY dls.id DESC
      `);
      
      if (result.recordset.length === 0) {
        // Return default English if no setting exists
        return {
          id: null,
          default_lang: 1,
          lang: 'English',
          code: 'en'
        };
      }
      
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error getting default language: ${error.message}`);
    }
  }

  // Set default language
  static async setDefaultLanguage(languageId) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      // First, verify the language exists
      const languageCheck = await request
        .input('languageId', sql.Int, languageId)
        .query('SELECT id FROM tbls_language WHERE id = @languageId');
      
      if (languageCheck.recordset.length === 0) {
        throw new Error('Language not found');
      }

      // Check if a default language setting already exists
      const existingResult = await request.query(`
        SELECT TOP 1 id FROM tbls_default_lang_setting ORDER BY id DESC
      `);

      let result;
      if (existingResult.recordset.length > 0) {
        // Update existing setting
        result = await request
          .input('id', sql.Int, existingResult.recordset[0].id)
          .input('defaultLang', sql.Int, languageId)
          .query(`
            UPDATE tbls_default_lang_setting 
            SET default_lang = @defaultLang
            OUTPUT INSERTED.*
            WHERE id = @id
          `);
      } else {
        // Create new setting
        result = await request
          .input('defaultLang', sql.Int, languageId)
          .query(`
            INSERT INTO tbls_default_lang_setting (default_lang)
            OUTPUT INSERTED.*
            VALUES (@defaultLang)
          `);
      }
      
      return new DefaultLanguageSetting(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error setting default language: ${error.message}`);
    }
  }

  // Get all language settings history
  static async getHistory() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT 
          dls.id, 
          dls.default_lang,
          l.lang,
          l.code
        FROM tbls_default_lang_setting dls
        LEFT JOIN tbls_language l ON dls.default_lang = l.id
        ORDER BY dls.id DESC
      `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error getting language settings history: ${error.message}`);
    }
  }

  // Get default language code (helper method)
  static async getDefaultLanguageCode() {
    try {
      const defaultLang = await this.getDefaultLanguage();
      return defaultLang.code || 'en';
    } catch (error) {
      console.error('Error getting default language code:', error);
      return 'en'; // Fallback to English
    }
  }

  // Initialize default language settings (for setup)
  static async initializeDefaults() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      // Check if languages exist, if not create them
      const languagesExist = await request.query(`
        SELECT COUNT(*) as count FROM tbls_language
      `);

      if (languagesExist.recordset[0].count === 0) {
        // Create default languages
        await request.query(`
          INSERT INTO tbls_language (lang, code) VALUES 
          ('English', 'en'),
          ('Amharic', 'am')
        `);
        console.log('Default languages created');
      }

      // Check if default language setting exists
      const settingExists = await request.query(`
        SELECT COUNT(*) as count FROM tbls_default_lang_setting
      `);

      if (settingExists.recordset[0].count === 0) {
        // Set English as default
        await request.query(`
          INSERT INTO tbls_default_lang_setting (default_lang) VALUES (1)
        `);
        console.log('Default language setting initialized to English');
      }

      return true;
    } catch (error) {
      throw new Error(`Error initializing default language settings: ${error.message}`);
    }
  }

  // Get language statistics
  static async getStatistics() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT 
          (SELECT COUNT(*) FROM tbls_default_lang_setting) as total_settings,
          (SELECT TOP 1 l.lang FROM tbls_default_lang_setting dls 
           LEFT JOIN tbls_language l ON dls.default_lang = l.id 
           ORDER BY dls.id DESC) as current_default_language,
          (SELECT TOP 1 l.code FROM tbls_default_lang_setting dls 
           LEFT JOIN tbls_language l ON dls.default_lang = l.id 
           ORDER BY dls.id DESC) as current_default_code
      `);
      
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error getting language setting statistics: ${error.message}`);
    }
  }
}

module.exports = DefaultLanguageSetting;
