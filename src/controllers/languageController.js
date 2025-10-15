const { Language, DefaultLanguageSetting } = require('../models');

class LanguageController {
  // Get all available languages
  static async getLanguages(req, res) {
    try {
      const languages = await Language.findAll();
      
      res.status(200).json({
        success: true,
        data: languages,
        message: 'Languages retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting languages:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get language by ID
  static async getLanguageById(req, res) {
    try {
      const { id } = req.params;
      const language = await Language.findById(parseInt(id));
      
      if (!language) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Language not found'
        });
      }

      res.status(200).json({
        success: true,
        data: language,
        message: 'Language retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting language by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Create new language
  static async createLanguage(req, res) {
    try {
      const { lang, code } = req.body;

      // Validate required fields
      if (!lang || !code) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Language name and code are required'
        });
      }

      // Check if language code already exists
      const existingLanguage = await Language.findByCode(code);
      if (existingLanguage) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Language code already exists'
        });
      }

      const language = await Language.create({ lang, code });
      
      res.status(201).json({
        success: true,
        data: language,
        message: 'Language created successfully'
      });
    } catch (error) {
      console.error('Error creating language:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Update language
  static async updateLanguage(req, res) {
    try {
      const { id } = req.params;
      const { lang, code } = req.body;

      // Validate required fields
      if (!lang || !code) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Language name and code are required'
        });
      }

      // Check if language exists
      const existingLanguage = await Language.findById(parseInt(id));
      if (!existingLanguage) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Language not found'
        });
      }

      // Check if new code conflicts with another language
      const codeConflict = await Language.findByCode(code);
      if (codeConflict && codeConflict.id !== parseInt(id)) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Language code already exists'
        });
      }

      const updatedLanguage = await Language.update(parseInt(id), { lang, code });
      
      res.status(200).json({
        success: true,
        data: updatedLanguage,
        message: 'Language updated successfully'
      });
    } catch (error) {
      console.error('Error updating language:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Delete language
  static async deleteLanguage(req, res) {
    try {
      const { id } = req.params;

      // Check if language exists
      const existingLanguage = await Language.findById(parseInt(id));
      if (!existingLanguage) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Language not found'
        });
      }

      // Check if this language is currently set as default
      const defaultLang = await DefaultLanguageSetting.getDefaultLanguage();
      if (defaultLang.default_lang === parseInt(id)) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Cannot delete the default language. Please set another language as default first.'
        });
      }

      const deleted = await Language.delete(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Language not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Language deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting language:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get current default language
  static async getDefaultLanguage(req, res) {
    try {
      const defaultLanguage = await DefaultLanguageSetting.getDefaultLanguage();
      
      res.status(200).json({
        success: true,
        data: defaultLanguage,
        message: 'Default language retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting default language:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Set default language
  static async setDefaultLanguage(req, res) {
    try {
      const { languageId } = req.body;

      // Validate required field
      if (!languageId) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Language ID is required'
        });
      }

      // Check if language exists
      const language = await Language.findById(parseInt(languageId));
      if (!language) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Language not found'
        });
      }

      const setting = await DefaultLanguageSetting.setDefaultLanguage(parseInt(languageId));
      
      res.status(200).json({
        success: true,
        data: setting,
        message: 'Default language updated successfully'
      });
    } catch (error) {
      console.error('Error setting default language:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get language settings history
  static async getLanguageHistory(req, res) {
    try {
      const history = await DefaultLanguageSetting.getHistory();
      
      res.status(200).json({
        success: true,
        data: history,
        message: 'Language settings history retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting language history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get language statistics
  static async getLanguageStatistics(req, res) {
    try {
      const languageStats = await Language.getStatistics();
      const settingStats = await DefaultLanguageSetting.getStatistics();
      
      const statistics = {
        ...languageStats,
        ...settingStats
      };
      
      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Language statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting language statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Initialize default language settings
  static async initializeDefaults(req, res) {
    try {
      await DefaultLanguageSetting.initializeDefaults();
      
      res.status(200).json({
        success: true,
        message: 'Default language settings initialized successfully'
      });
    } catch (error) {
      console.error('Error initializing defaults:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
}

module.exports = LanguageController;
