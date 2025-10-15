const { getSMSPool, sql } = require('../config/database');

class Language {
  constructor(data) {
    this.id = data.id;
    this.lang = data.lang;
    this.code = data.code;
  }

  // Get all languages
  static async findAll() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT id, lang, code 
        FROM tbls_language 
        ORDER BY id
      `);
      
      return result.recordset.map(language => new Language(language));
    } catch (error) {
      throw new Error(`Error fetching languages: ${error.message}`);
    }
  }

  // Get language by ID
  static async findById(id) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('SELECT id, lang, code FROM tbls_language WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new Language(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding language by ID: ${error.message}`);
    }
  }

  // Get language by code
  static async findByCode(code) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('code', sql.NVarChar(10), code)
        .query('SELECT id, lang, code FROM tbls_language WHERE code = @code');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new Language(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding language by code: ${error.message}`);
    }
  }

  // Create new language
  static async create(languageData) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('lang', sql.NVarChar(50), languageData.lang)
        .input('code', sql.NVarChar(10), languageData.code)
        .query(`
          INSERT INTO tbls_language (lang, code)
          OUTPUT INSERTED.*
          VALUES (@lang, @code)
        `);
      
      return new Language(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error creating language: ${error.message}`);
    }
  }

  // Update language
  static async update(id, languageData) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .input('lang', sql.NVarChar(50), languageData.lang)
        .input('code', sql.NVarChar(10), languageData.code)
        .query(`
          UPDATE tbls_language 
          SET lang = @lang, code = @code
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new Language(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error updating language: ${error.message}`);
    }
  }

  // Delete language
  static async delete(id) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('DELETE FROM tbls_language WHERE id = @id');
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      throw new Error(`Error deleting language: ${error.message}`);
    }
  }

  // Check if language exists
  static async exists(code) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('code', sql.NVarChar(10), code)
        .query('SELECT COUNT(*) as count FROM tbls_language WHERE code = @code');
      
      return result.recordset[0].count > 0;
    } catch (error) {
      throw new Error(`Error checking if language exists: ${error.message}`);
    }
  }

  // Get language statistics
  static async getStatistics() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT 
          COUNT(*) as total_languages,
          (SELECT COUNT(*) FROM tbls_language WHERE code = 'en') as english_available,
          (SELECT COUNT(*) FROM tbls_language WHERE code = 'am') as amharic_available
        FROM tbls_language
      `);
      
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error getting language statistics: ${error.message}`);
    }
  }
}

module.exports = Language;
