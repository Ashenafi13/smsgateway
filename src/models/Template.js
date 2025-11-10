const sql = require('mssql');
const { getSMSPool } = require('../config/database');

class Template {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.template_en = data.template_en;
    this.template_am = data.template_am;
    this.variables = data.variables;
    this.usage_count = data.usage_count || 0;
    this.is_active = data.is_active !== undefined ? data.is_active : 1;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Get all templates from database
  static async findAll(language = null) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request.query(`
        SELECT id, name, category, template_en, template_am, variables, usage_count, is_active, createdAt, updatedAt
        FROM tbls_templates
        WHERE is_active = 1
        ORDER BY category, id
      `);

      return result.recordset.map(template => {
        const templateObj = new Template(template);

        // If specific language requested, only return that language template
        if (language === 'en') {
          templateObj.template = templateObj.template_en;
          delete templateObj.template_am;
        } else if (language === 'am') {
          templateObj.template = templateObj.template_am;
          delete templateObj.template_en;
        }

        return templateObj;
      });
    } catch (error) {
      throw new Error(`Error fetching templates: ${error.message}`);
    }
  }

  // Get templates by category from database
  static async findByCategory(category, language = null) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request
        .input('category', sql.NVarChar(100), category)
        .query(`
          SELECT id, name, category, template_en, template_am, variables, usage_count, is_active, createdAt, updatedAt
          FROM tbls_templates
          WHERE category = @category AND is_active = 1
          ORDER BY id
        `);

      return result.recordset.map(template => {
        const templateObj = new Template(template);

        // If specific language requested, only return that language template
        if (language === 'en') {
          templateObj.template = templateObj.template_en;
          delete templateObj.template_am;
        } else if (language === 'am') {
          templateObj.template = templateObj.template_am;
          delete templateObj.template_en;
        }

        return templateObj;
      });
    } catch (error) {
      throw new Error(`Error fetching templates by category: ${error.message}`);
    }
  }

  // Get template by ID from database
  static async findById(id, language = null) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request
        .input('id', sql.Int, parseInt(id))
        .query(`
          SELECT id, name, category, template_en, template_am, variables, usage_count, is_active, createdAt, updatedAt
          FROM tbls_templates
          WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      const template = result.recordset[0];
      const templateObj = new Template(template);

      // If specific language requested, only return that language template
      if (language === 'en') {
        templateObj.template = templateObj.template_en;
        delete templateObj.template_am;
      } else if (language === 'am') {
        templateObj.template = templateObj.template_am;
        delete templateObj.template_en;
      }

      return templateObj;
    } catch (error) {
      throw new Error(`Error fetching template by ID: ${error.message}`);
    }
  }

  // Get all available categories from database
  static async getCategories() {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request.query(`
        SELECT DISTINCT category, COUNT(*) as template_count
        FROM tbls_templates
        WHERE is_active = 1
        GROUP BY category
        ORDER BY category
      `);

      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching template categories: ${error.message}`);
    }
  }

  // Get template statistics from database
  static async getStatistics() {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      const result = await request.query(`
        SELECT
          COUNT(*) as total_templates,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_templates,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_templates,
          COUNT(DISTINCT category) as total_categories,
          SUM(usage_count) as total_usage
        FROM tbls_templates
      `);

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error fetching template statistics: ${error.message}`);
    }
  }

  // Increment usage count in database
  static async incrementUsage(id) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      await request
        .input('id', sql.Int, parseInt(id))
        .query(`
          UPDATE tbls_templates
          SET usage_count = usage_count + 1, updatedAt = GETDATE()
          WHERE id = @id
        `);

      return true;
    } catch (error) {
      throw new Error(`Error incrementing template usage: ${error.message}`);
    }
  }

  // Initialize default templates (static - always available)
  static async initializeDefaults() {
    try {
      return { message: 'Static templates are always available - no initialization needed' };
    } catch (error) {
      throw new Error(`Error initializing default templates: ${error.message}`);
    }
  }

  // Update template in database
  static async update(id, updateData) {
    try {
      const pool = getSMSPool();
      const request = pool.request();

      // First, check if template exists
      const existingTemplate = await this.findById(id);
      if (!existingTemplate) {
        throw new Error(`Template with ID ${id} not found`);
      }

      // Build update query dynamically based on provided fields
      const updates = [];
      const inputs = { id: parseInt(id) };

      if (updateData.template_en !== undefined) {
        updates.push('template_en = @template_en');
        inputs.template_en = updateData.template_en;
      }

      if (updateData.template_am !== undefined) {
        updates.push('template_am = @template_am');
        inputs.template_am = updateData.template_am;
      }

      if (updateData.name !== undefined) {
        updates.push('name = @name');
        inputs.name = updateData.name;
      }

      if (updateData.category !== undefined) {
        updates.push('category = @category');
        inputs.category = updateData.category;
      }

      if (updateData.variables !== undefined) {
        updates.push('variables = @variables');
        inputs.variables = updateData.variables;
      }

      if (updateData.is_active !== undefined) {
        updates.push('is_active = @is_active');
        inputs.is_active = updateData.is_active;
      }

      if (updates.length === 0) {
        return existingTemplate;
      }

      updates.push('updatedAt = GETDATE()');

      // Build the query
      let query = `UPDATE tbls_templates SET ${updates.join(', ')} WHERE id = @id`;

      // Add inputs to request
      Object.keys(inputs).forEach(key => {
        if (key === 'id') {
          request.input(key, sql.Int, inputs[key]);
        } else if (key === 'is_active') {
          request.input(key, sql.Int, inputs[key]);
        } else {
          request.input(key, sql.NVarChar(sql.MAX), inputs[key]);
        }
      });

      await request.query(query);

      // Fetch and return updated template
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Error updating template: ${error.message}`);
    }
  }
}

module.exports = Template;
