const { Template, PenalityPeriod } = require('../models');
const PenaltyService = require('../services/penaltyService');

class TemplateController {
  // Get all templates
  static async getAllTemplates(req, res) {
    try {
      const language = req.query.language; // 'en', 'am', or null for both
      const templates = await Template.findAll(language);
      
      res.status(200).json({
        success: true,
        data: templates,
        message: 'Templates retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get templates by category
  static async getTemplatesByCategory(req, res) {
    try {
      const { category } = req.params;
      const language = req.query.language; // 'en', 'am', or null for both
      
      const templates = await Template.findByCategory(category, language);
      
      res.status(200).json({
        success: true,
        data: templates,
        message: `Templates for category '${category}' retrieved successfully`
      });
    } catch (error) {
      console.error('Error getting templates by category:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get template by ID
  static async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const language = req.query.language; // 'en', 'am', or null for both
      
      const template = await Template.findById(parseInt(id), language);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Template not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: template,
        message: 'Template retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting template by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get all template categories
  static async getCategories(req, res) {
    try {
      const categories = await Template.getCategories();
      
      res.status(200).json({
        success: true,
        data: categories,
        message: 'Template categories retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting template categories:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get template statistics
  static async getStatistics(req, res) {
    try {
      const statistics = await Template.getStatistics();
      
      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Template statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting template statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Increment template usage count
  static async incrementUsage(req, res) {
    try {
      const { id } = req.params;
      
      // Check if template exists
      const template = await Template.findById(parseInt(id));
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Template not found'
        });
      }
      
      await Template.incrementUsage(parseInt(id));
      
      res.status(200).json({
        success: true,
        message: 'Template usage count incremented successfully'
      });
    } catch (error) {
      console.error('Error incrementing template usage:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get template info (static templates are always available)
  static async getTemplateInfo(req, res) {
    try {
      const result = await Template.initializeDefaults();

      res.status(200).json({
        success: true,
        message: result.message,
        info: 'These are static templates extracted from the existing SMS service code'
      });
    } catch (error) {
      console.error('Error getting template info:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get templates formatted for frontend display (like the image you showed)
  static async getTemplatesForDisplay(req, res) {
    try {
      const language = req.query.language || 'en'; // Default to English
      const templates = await Template.findAll();
      
      // Format templates for frontend display
      const formattedTemplates = templates.map(template => {
        const templateText = language === 'am' ? template.template_am : template.template_en;
        
        return {
          id: template.id,
          name: template.name,
          category: template.category,
          template: templateText,
          variables: template.variables ? template.variables.split(',') : [],
          usage_count: template.usage_count,
          categoryTag: template.category // For the tag display like "Rent", "Maintenance", etc.
        };
      });
      
      // Group by category for better organization
      const groupedTemplates = formattedTemplates.reduce((acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
      }, {});
      
      res.status(200).json({
        success: true,
        data: {
          templates: formattedTemplates,
          grouped: groupedTemplates,
          language: language
        },
        message: 'Templates formatted for display retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting templates for display:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get template with variable placeholders replaced (for preview)
  static async getTemplatePreview(req, res) {
    try {
      const { id } = req.params;
      const language = req.query.language || 'en';
      const variables = req.body || {}; // Variables to replace in template
      
      const template = await Template.findById(parseInt(id), language);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Template not found'
        });
      }
      
      let templateText = language === 'am' ? template.template_am : template.template_en;
      
      // Replace variables in template
      if (template.variables && Object.keys(variables).length > 0) {
        const templateVars = template.variables.split(',');
        templateVars.forEach(variable => {
          const varName = variable.trim();
          if (variables[varName]) {
            templateText = templateText.replace(new RegExp(`{${varName}}`, 'g'), variables[varName]);
          }
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          id: template.id,
          name: template.name,
          category: template.category,
          original_template: language === 'am' ? template.template_am : template.template_en,
          preview_text: templateText,
          variables_used: variables,
          language: language
        },
        message: 'Template preview generated successfully'
      });
    } catch (error) {
      console.error('Error generating template preview:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Get penalty periods information
  static async getPenaltyPeriods(req, res) {
    try {
      const penaltyPeriods = await PenaltyService.getAllPenaltyPeriods();

      res.status(200).json({
        success: true,
        data: penaltyPeriods,
        message: 'Penalty periods retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting penalty periods:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Update template
  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { template_en, template_am, name, category } = req.body;

      // Validate required fields
      if (!template_en && !template_am) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'At least one template (template_en or template_am) is required'
        });
      }

      // Check if template exists
      const template = await Template.findById(parseInt(id));
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Template not found'
        });
      }

      // Update template
      const updatedTemplate = await Template.update(parseInt(id), {
        template_en,
        template_am,
        name,
        category
      });

      res.status(200).json({
        success: true,
        data: updatedTemplate,
        message: 'Template updated successfully'
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Calculate penalty for a payment amount and overdue days
  static async calculatePenalty(req, res) {
    try {
      const { paymentAmount, overdueDays } = req.body;

      if (!paymentAmount || overdueDays === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'paymentAmount and overdueDays are required'
        });
      }

      const penaltyDetails = await PenalityPeriod.calculatePenaltyWithDetails(
        parseFloat(paymentAmount),
        parseInt(overdueDays)
      );

      res.status(200).json({
        success: true,
        data: penaltyDetails,
        message: 'Penalty calculated successfully'
      });
    } catch (error) {
      console.error('Error calculating penalty:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
}

module.exports = TemplateController;
