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
        name: 'Payment Reminder - Deadline Approaching',
        category: 'Payment',
        template_en: `Dear Customer, a friendly reminder that the rent of {formattedAmount} for Room ID: {room} is due in {daysRemaining} days. Thank you for your cooperation.`,
        template_am: `ውድ ደንበኛችን፣ ለክፍል {room} የ{formattedAmount} ክፍያ {daysRemaining} ቀን ቀረው።`,
        variables: 'customerName,room,daysRemaining,formattedAmount,description,paymentId',
        usage_count: 0
      },
      {
        id: 2,
        name: 'Payment Reminder - Deadline Approaching (Alternative)',
        category: 'Payment',
        template_en: `Dear {customerName}, your payment of {formattedAmount} for Space ID: {room} is approaching its due date in {daysRemaining} days. Please plan your payment accordingly.`,
        template_am: `ውድ ደንበኛችን፣ የክፍል {room} የኪራይ ክፍያ ሊጠናቀቅ {daysRemaining} ቀን ቀርቶታል።`,
        variables: 'customerName,room,daysRemaining,formattedAmount,description,paymentId',
        usage_count: 0
      },
      {
        id: 3,
        name: 'Payment Reminder - Deadline Passed',
        category: 'Payment',
        template_en: `Dear Customer, your rent for Room ID: {room} is past due. Please immediately pay the outstanding balance of {formattedAmount}.`,
        template_am: `ውድ ደንበኛችን፣ የክፍል {room} ክፍያዎ አልፏል። {formattedAmount} ይከፍሉ።`,
        variables: 'customerName,room,formattedAmount,paymentId',
        usage_count: 0
      },
      {
        id: 4,
        name: 'Payment Reminder - Deadline Passed (Alternative)',
        category: 'Payment',
        template_en: `URGENT: For Space ID: {room}, your payment is overdue. Please immediately pay the outstanding balance of {formattedAmount}.`,
        template_am: `ውድ ደንበኛችን፣ ለክፍል {room} ያመለጠ ክፍያ {formattedAmount} ይከፍሉ።`,
        variables: 'customerName,room,formattedAmount,paymentId',
        usage_count: 0
      },
      {
        id: 5,
        name: 'Contract Reminder - Deadline Approaching',
        category: 'Contract',
        template_en: `Dear Customer, this is a reminder that your rental contract for Room ID: {room} will expire in {daysRemaining} days. Please contact us to discuss renewal.`,
        template_am: `ውድ ደንበኛችን፣ የክፍል {room} ውልዎ ሊጠናቀቅ {daysRemaining} ቀን ብቻ ቀርቷል።`,
        variables: 'customerName,room,daysRemaining,formattedAmount,description,contractId',
        usage_count: 0
      },
      {
        id: 6,
        name: 'Contract Reminder - Deadline Approaching (Alternative)',
        category: 'Contract',
        template_en: `Dear {customerName}, your lease for Space ID: {room} is set to expire in {daysRemaining} days. We hope you choose to stay with us! Please let us know your plans.`,
        template_am: `ውድ ደንበኛችን፣ የክፍል {room} ውል በ{daysRemaining} ቀን ያበቃል። እባክዎ ያድሱ።`,
        variables: 'customerName,room,daysRemaining,formattedAmount,description,contractId',
        usage_count: 0
      },
      {
        id: 7,
        name: 'Contract Reminder - Deadline Passed',
        category: 'Contract',
        template_en: `Dear Customer, your rental contract for Space ID: {room} has expired. To avoid any issues, please contact our office immediately to resolve this matter.`,
        template_am: `ውድ ደንበኛችን፣ የክፍል {room} ውልዎ ጊዜው አልፏል። እባክዎ ያነጋግሩን።`,
        variables: 'customerName,room,formattedAmount,description,contractId',
        usage_count: 0
      },
      {
        id: 8,
        name: 'Contract Reminder - Deadline Passed (Alternative)',
        category: 'Contract',
        template_en: `IMPORTANT: For Room ID: {room}, your lease has expired. Please visit the management office at your earliest convenience to discuss your status.`,
        template_am: `ውድ ደንበኛችን፣ የክፍል {room} ውልዎ ስላበቃ እባክዎ ቢሮ ይምጡ።`,
        variables: 'customerName,room,formattedAmount,description,contractId',
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
