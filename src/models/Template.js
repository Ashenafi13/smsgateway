class Template {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.template_en = data.template_en;
    this.template_am = data.template_am;
    this.variables = data.variables;
    this.usage_count = data.usage_count || 0;
  }

  // Static templates from the existing code
  static getStaticTemplates() {
    return [
      {
        id: 1,
        name: 'Payment Reminder',
        category: 'Payment',
        template_en: `Dear {customerName},

Your payment for Room {room} is due {urgencyText} ({formattedDate}).

Amount: {formattedAmount}
Description: {description}

Please make your payment to avoid any inconvenience.

Payment ID: {paymentId}

Thank you.`,
        template_am: `ውድ {customerName}፣

የእርስዎ የክፍል {room} ክፍያ {urgencyText} ({formattedDate}) ይጠበቃል።

መጠን: {formattedAmount}
መግለጫ: {description}



የክፍያ መለያ: {paymentId}

እናመሰግናለን።`,
        variables: 'customerName,room,urgencyText,formattedDate,formattedAmount,description,paymentId',
        usage_count: 0
      },
      {
        id: 2,
        name: 'Contract Reminder',
        category: 'Contract',
        template_en: `Dear {customerName},

Your contract for Room {room} is due {urgencyText} ({formattedDate}).

Amount: {formattedAmount}
Description: {description}

Please renew your contract to avoid any inconvenience.

Contract ID: {contractId}

Thank you.`,
        template_am: `ውድ {customerName}፣

የእርስዎ የክፍል {room} ውል {urgencyText} ({formattedDate}) ይጠናቀቃል።

መጠን: {formattedAmount}
መግለጫ: {description}

እባክዎ ውልዎን ያድሱ።

የውል መለያ: {contractId}

እናመሰግናለን።`,
        variables: 'customerName,room,urgencyText,formattedDate,formattedAmount,description,contractId',
        usage_count: 0
      },
      {
        id: 3,
        name: 'Payment Display Reminder',
        category: 'PaymentDisplay',
        template_en: `Dear {customerName},

Your building display space payment for Room {room} is due {urgencyText} ({formattedDate}).

Amount: {formattedAmount}
Description: {description}

Please make your payment to avoid any inconvenience.

Payment ID: {paymentId}

Thank you.`,
        template_am: `ውድ {customerName}፣

የእርስዎ የህንፃ ማሳያ ቦታ የክፍል {room} ክፍያ {urgencyText} ({formattedDate}) ይጠበቃል።

መጠን: {formattedAmount}
መግለጫ: {description}



የክፍያ መለያ: {paymentId}

እናመሰግናለን።`,
        variables: 'customerName,room,urgencyText,formattedDate,formattedAmount,description,paymentId',
        usage_count: 0
      },
      {
        id: 4,
        name: 'Contract Display Reminder',
        category: 'ContractDisplay',
        template_en: `Dear {customerName},

Your building display space contract for Room {room} is due {urgencyText} ({formattedDate}).

Amount: {formattedAmount}
Description: {description}

Please renew your contract to avoid any inconvenience.

Contract ID: {contractId}

Thank you.`,
        template_am: `ውድ {customerName}፣

የእርስዎ የህንፃ ማሳያ ቦታ የክፍል {room} ውል {urgencyText} ({formattedDate}) ይጠናቀቃል።

መጠን: {formattedAmount}
መግለጫ: {description}

እባክዎ ውልዎን ያድሱ።

የውል መለያ: {contractId}

እናመሰግናለን።`,
        variables: 'customerName,room,urgencyText,formattedDate,formattedAmount,description,contractId',
        usage_count: 0
      }
    ];
  }

  // Get all templates
  static async findAll(language = null) {
    try {
      const templates = this.getStaticTemplates();

      return templates.map(template => {
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

  // Get templates by category
  static async findByCategory(category, language = null) {
    try {
      const templates = this.getStaticTemplates();
      const filteredTemplates = templates.filter(template => template.category === category);

      return filteredTemplates.map(template => {
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

  // Get template by ID
  static async findById(id, language = null) {
    try {
      const templates = this.getStaticTemplates();
      const template = templates.find(t => t.id === parseInt(id));

      if (!template) {
        return null;
      }

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

  // Get all available categories
  static async getCategories() {
    try {
      const templates = this.getStaticTemplates();
      const categoryMap = {};

      templates.forEach(template => {
        if (!categoryMap[template.category]) {
          categoryMap[template.category] = 0;
        }
        categoryMap[template.category]++;
      });

      return Object.keys(categoryMap).map(category => ({
        category,
        template_count: categoryMap[category]
      })).sort((a, b) => a.category.localeCompare(b.category));
    } catch (error) {
      throw new Error(`Error fetching template categories: ${error.message}`);
    }
  }

  // Get template statistics
  static async getStatistics() {
    try {
      const templates = this.getStaticTemplates();
      const categories = new Set(templates.map(t => t.category));
      const totalUsage = templates.reduce((sum, t) => sum + t.usage_count, 0);

      return {
        total_templates: templates.length,
        active_templates: templates.length,
        inactive_templates: 0,
        total_categories: categories.size,
        total_usage: totalUsage
      };
    } catch (error) {
      throw new Error(`Error fetching template statistics: ${error.message}`);
    }
  }

  // Increment usage count (static - no persistence)
  static async incrementUsage(id) {
    try {
      // For static templates, we just return success
      // In a real implementation, you might want to store usage in memory or logs
      console.log(`Template ${id} usage incremented`);
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
}

module.exports = Template;
