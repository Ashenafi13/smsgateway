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
  // Updated to remove amount/money information while keeping character limits
  // English: 159 chars, Amharic: 69 chars
  static getStaticTemplates() {
    return [
      {
        id: 1,
        name: 'Payment Reminder - Deadline Approaching',
        category: 'Payment',
        template_en: `Dear {customerName}, your rent for Room {room} is due in {daysRemaining} days. Please arrange payment. Thank you.`,
        template_am: `ውድ {customerName}፣ ለክፍል {room} ክፍያ {daysRemaining} ቀን ቀረው። እባክዎ ይከፍሉ።`,
        variables: 'customerName,room,daysRemaining,paymentId',
        usage_count: 0
      },
      {
        id: 2,
        name: 'Payment Reminder - Deadline Approaching (Alternative)',
        category: 'Payment',
        template_en: `Reminder: Your rent for Room {room} is due in {daysRemaining} days. Please make payment at your earliest convenience.`,
        template_am: `ማስታወሻ: ለክፍል {room} ክፍያ {daysRemaining} ቀን ቀረው። እባክዎ ይከፍሉ።`,
        variables: 'customerName,room,daysRemaining,paymentId',
        usage_count: 0
      },
      {
        id: 3,
        name: 'Payment Reminder - Deadline Passed',
        category: 'Payment',
        template_en: `URGENT: Your rent for Room {room} is overdue. Please contact us immediately to settle your account.`,
        template_am: `ወሳኝ: ለክፍል {room} ክፍያ ያመለጠ። እባክዎ ወዲያውኑ ያነጋግሩን።`,
        variables: 'customerName,room,paymentId',
        usage_count: 0
      },
      {
        id: 4,
        name: 'Payment Reminder - Deadline Passed (Alternative)',
        category: 'Payment',
        template_en: `ACTION REQUIRED: Your payment for Room {room} is past due. Please settle immediately to avoid penalties.`,
        template_am: `ተግባር ያስፈልጋል: ለክፍል {room} ክፍያ ያመለጠ። ወዲያውኑ ይከፍሉ።`,
        variables: 'customerName,room,paymentId',
        usage_count: 0
      },
      {
        id: 5,
        name: 'Contract Reminder - Deadline Approaching',
        category: 'Contract',
        template_en: `Dear {customerName}, your lease for Room {room} expires in {daysRemaining} days. Please contact us to discuss renewal.`,
        template_am: `ውድ {customerName}፣ የክፍል {room} ውል {daysRemaining} ቀን ያበቃል። እባክዎ ያድሱ።`,
        variables: 'customerName,room,daysRemaining,contractId',
        usage_count: 0
      },
      {
        id: 6,
        name: 'Contract Reminder - Deadline Approaching (Alternative)',
        category: 'Contract',
        template_en: `Reminder: Your lease for Room {room} will expire in {daysRemaining} days. Please contact us to renew your contract.`,
        template_am: `ማስታወሻ: የክፍል {room} ውል {daysRemaining} ቀን ያበቃል። እባክዎ ያድሱ።`,
        variables: 'customerName,room,daysRemaining,contractId',
        usage_count: 0
      },
      {
        id: 7,
        name: 'Contract Reminder - Deadline Passed',
        category: 'Contract',
        template_en: `URGENT: Your lease for Room {room} has expired. Please contact our office immediately to resolve this matter.`,
        template_am: `ወሳኝ: የክፍል {room} ውል ጊዜው አልፏል። እባክዎ ወዲያውኑ ያነጋግሩን።`,
        variables: 'customerName,room,contractId',
        usage_count: 0
      },
      {
        id: 8,
        name: 'Contract Reminder - Deadline Passed (Alternative)',
        category: 'Contract',
        template_en: `ACTION REQUIRED: Your lease for Room {room} has expired. Please visit our office to discuss your status.`,
        template_am: `ተግባር ያስፈልጋል: የክፍል {room} ውል ጊዜው አልፏል። እባክዎ ቢሮ ይምጡ።`,
        variables: 'customerName,room,contractId',
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
