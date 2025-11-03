const { Template } = require('../models');
const DateUtils = require('../utils/dateUtils');

class SmsTemplateService {
  
  // Template type constants
  static TEMPLATE_TYPES = {
    PAYMENT_REMINDER: 'payment_reminder',
    PAYMENT_REMINDER_PASSED: 'payment_reminder_passed',
    CONTRACT_REMINDER: 'contract_reminder',
    CONTRACT_REMINDER_PASSED: 'contract_reminder_passed',
    PAYMENT_DISPLAY_REMINDER: 'payment_display_reminder',
    CONTRACT_DISPLAY_REMINDER: 'contract_display_reminder',
    PAYMENT_DISPLAY_CONSOLIDATED_REMINDER: 'payment_display_consolidated_reminder',
    CONTRACT_DISPLAY_CONSOLIDATED_REMINDER: 'contract_display_consolidated_reminder'
  };

  /**
   * Get template by type and language
   * @param {string} templateType - Template type from TEMPLATE_TYPES
   * @param {string} language - Language code ('en' or 'am')
   * @returns {Object} Template object
   */
  static async getTemplate(templateType, language = 'en') {
    try {
      const templates = await Template.findAll(language);

      // Map template types to template name patterns
      const templateNameMap = {
        [this.TEMPLATE_TYPES.PAYMENT_REMINDER]: 'Deadline Approaching',
        [this.TEMPLATE_TYPES.PAYMENT_REMINDER_PASSED]: 'Deadline Passed',
        [this.TEMPLATE_TYPES.CONTRACT_REMINDER]: 'Deadline Approaching',
        [this.TEMPLATE_TYPES.CONTRACT_REMINDER_PASSED]: 'Deadline Passed',
        [this.TEMPLATE_TYPES.PAYMENT_DISPLAY_REMINDER]: 'Deadline Approaching',
        [this.TEMPLATE_TYPES.CONTRACT_DISPLAY_REMINDER]: 'Deadline Approaching'
      };

      const categoryMap = {
        [this.TEMPLATE_TYPES.PAYMENT_REMINDER]: 'Payment',
        [this.TEMPLATE_TYPES.PAYMENT_REMINDER_PASSED]: 'Payment',
        [this.TEMPLATE_TYPES.CONTRACT_REMINDER]: 'Contract',
        [this.TEMPLATE_TYPES.CONTRACT_REMINDER_PASSED]: 'Contract',
        [this.TEMPLATE_TYPES.PAYMENT_DISPLAY_REMINDER]: 'PaymentDisplay',
        [this.TEMPLATE_TYPES.CONTRACT_DISPLAY_REMINDER]: 'ContractDisplay'
      };

      const category = categoryMap[templateType];
      const templateNamePattern = templateNameMap[templateType];

      if (!category) {
        throw new Error(`Unknown template type: ${templateType}`);
      }

      // Find template by category and name pattern
      const template = templates.find(t =>
        t.category === category && t.name.includes(templateNamePattern)
      );

      if (!template) {
        throw new Error(`Template not found for type: ${templateType}`);
      }

      return template;
    } catch (error) {
      console.error(`Error getting template: ${error.message}`);
      throw new Error(`Error getting template: ${error.message}`);
    }
  }

  /**
   * Create payment reminder message
   * @param {Object} payment - Payment object
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Formatted SMS message
   */
  static async createPaymentReminderMessage(payment, language = 'en') {
    try {
      // Get customer name based on language
      const customerName = language === 'am' ?
        (payment.customer_name_am || payment.customer_name || 'ደንበኛ') :
        (payment.customer_name || 'Customer');

      // Calculate days remaining/overdue
      const daysRemaining = DateUtils.calculateDaysRemaining(payment.end_date);
      const isOverdue = daysRemaining < 0;

      // Select appropriate template based on whether payment is overdue
      let templateType;
      if (isOverdue) {
        templateType = this.TEMPLATE_TYPES.PAYMENT_REMINDER_PASSED;
      } else {
        templateType = this.TEMPLATE_TYPES.PAYMENT_REMINDER;
      }

      const template = await this.getTemplate(templateType, language);

      // Format amount (original amount only, no penalty)
      const paymentAmount = payment.GroundTotal || payment.line_total || 0;
      const formattedAmount = DateUtils.formatCurrency(paymentAmount, language);

      // Format date
      const ethDate = DateUtils.toEthiopianDate(payment.end_date);
      const formattedDate = DateUtils.formatEthiopianDate(ethDate, language);

      // Get urgency text
      const urgencyText = DateUtils.getUrgencyText(daysRemaining, language);

      // Prepare variables for template replacement
      const variables = {
        customerName: customerName,
        room: payment.room || payment.Room || 'N/A',
        daysRemaining: Math.abs(daysRemaining),
        urgencyText: urgencyText,
        formattedDate: formattedDate,
        formattedAmount: formattedAmount,
        description: payment.description || (language === 'am' ? 'ክፍያ ይጠበቃል' : 'Payment due'),
        paymentId: payment.id || payment.ID || 'N/A'
      };

      // Replace variables in template
      let message = language === 'am' ? template.template_am : template.template_en;

      Object.keys(variables).forEach(key => {
        const placeholder = `{${key}}`;
        message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
      });

      return message.trim();
    } catch (error) {
      console.error(`Error creating payment reminder message: ${error.message}`);
      throw new Error(`Error creating payment reminder message: ${error.message}`);
    }
  }

  /**
   * Create contract reminder message
   * @param {Object} contract - Contract object
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Formatted SMS message
   */
  static async createContractReminderMessage(contract, language = 'en') {
    try {
      // Get customer name based on language
      const customerName = language === 'am' ?
        (contract.customer_name_am || contract.customer_name || 'ደንበኛ') :
        (contract.customer_name || 'Customer');

      // Calculate days remaining/overdue
      const daysRemaining = DateUtils.calculateDaysRemaining(contract.EndDate);
      const isOverdue = daysRemaining < 0;

      // Select appropriate template based on whether contract is overdue
      let templateType;
      if (isOverdue) {
        templateType = this.TEMPLATE_TYPES.CONTRACT_REMINDER_PASSED;
      } else {
        templateType = this.TEMPLATE_TYPES.CONTRACT_REMINDER;
      }

      const template = await this.getTemplate(templateType, language);

      // Format amount
      const roomPrice = contract.RoomPrice || 0;
      const formattedAmount = DateUtils.formatCurrency(roomPrice, language);

      // Format date
      const ethDate = DateUtils.toEthiopianDate(contract.EndDate);
      const formattedDate = DateUtils.formatEthiopianDate(ethDate, language);

      // Get urgency text
      const urgencyText = DateUtils.getUrgencyText(daysRemaining, language);

      // Prepare variables for template replacement
      const variables = {
        customerName: customerName,
        room: contract.RoomID || contract.Room || contract.room || 'N/A',
        daysRemaining: Math.abs(daysRemaining),
        urgencyText: urgencyText,
        formattedDate: formattedDate,
        formattedAmount: formattedAmount,
        description: contract.description || (language === 'am' ? 'ውል ማደሳ ይጠበቃል' : 'Contract renewal due'),
        contractId: contract.ID || contract.id || 'N/A'
      };

      // Replace variables in template
      let message = language === 'am' ? template.template_am : template.template_en;

      Object.keys(variables).forEach(key => {
        const placeholder = `{${key}}`;
        message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
      });

      return message.trim();
    } catch (error) {
      console.error(`Error creating contract reminder message: ${error.message}`);
      throw new Error(`Error creating contract reminder message: ${error.message}`);
    }
  }

  /**
   * Create consolidated payment reminder message for multiple payments
   * Includes all spaces/displays in a single SMS message within character limits
   * @param {Object} customerGroup - Customer group with multiple payments
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Formatted SMS message
   */
  static async createConsolidatedPaymentReminderMessage(customerGroup, language = 'en') {
    try {
      // For consolidated messages, use the first payment as representative
      if (!customerGroup.payments || customerGroup.payments.length === 0) {
        throw new Error('No payments in customer group');
      }

      const firstPayment = customerGroup.payments[0];

      // Check if all payments have the same deadline
      const allSameDeadline = customerGroup.payments.every(p =>
        p.days_to_deadline === firstPayment.days_to_deadline
      );

      let roomsList;
      let hasPerSpaceDeadlines = false;

      if (allSameDeadline) {
        // All spaces have the same deadline - simple format: "Room 001, Room 002, Room 003"
        roomsList = customerGroup.payments
          .map(p => p.room || p.Room || 'N/A')
          .join(', ');
      } else {
        // Different deadlines - format with days: "Room 001 (2 days), Room 002 (1 day)"
        hasPerSpaceDeadlines = true;
        roomsList = customerGroup.payments
          .map(p => {
            const room = p.room || p.Room || 'N/A';
            const days = p.days_to_deadline;
            const dayLabel = language === 'am' ? 'ቀን' : 'day' + (days !== 1 ? 's' : '');
            return `${room} (${days} ${dayLabel})`;
          })
          .join(', ');
      }

      // If per-space deadlines, create custom message format
      if (hasPerSpaceDeadlines) {
        const customerName = language === 'am' ?
          (customerGroup.customer_name_am || customerGroup.customer_name || 'ደንበኛ') :
          (customerGroup.customer_name || 'Customer');

        if (language === 'am') {
          return `ውድ ${customerName}፣ ብቻ ለክፍል ${roomsList} ክፍያ ይጠበቃል።`;
        } else {
          return `Dear ${customerName}, payment is due for the following rooms: ${roomsList}. Thank you for your cooperation.`;
        }
      }

      // Create a payment object with consolidated info including all rooms
      const consolidatedPayment = {
        ...firstPayment,
        customer_name: customerGroup.customer_name,
        customer_name_am: customerGroup.customer_name_am,
        // Replace room with all rooms list
        room: roomsList,
        Room: roomsList,
        // Add count info to the description
        description: language === 'am' ?
          `${customerGroup.paymentCount} ክፍያዎች ይጠበቃሉ` :
          `${customerGroup.paymentCount} payments due`
      };

      // Use the standard payment reminder message template
      return await this.createPaymentReminderMessage(consolidatedPayment, language);
    } catch (error) {
      console.error(`Error creating consolidated payment reminder message: ${error.message}`);
      throw new Error(`Error creating consolidated payment reminder message: ${error.message}`);
    }
  }

  /**
   * Create consolidated contract reminder message for multiple contracts
   * Includes all spaces/displays in a single SMS message within character limits
   * @param {Object} customerGroup - Customer group with multiple contracts
   * @param {string} language - Language code ('en' or 'am')
   * @returns {Promise<string>} - Formatted SMS message
   */
  static async createConsolidatedContractReminderMessage(customerGroup, language = 'en') {
    try {
      // For consolidated messages, use the first contract as representative
      if (!customerGroup.contracts || customerGroup.contracts.length === 0) {
        throw new Error('No contracts in customer group');
      }

      const firstContract = customerGroup.contracts[0];

      // Check if all contracts have the same deadline
      const allSameDeadline = customerGroup.contracts.every(c =>
        c.days_to_deadline === firstContract.days_to_deadline
      );

      let roomsList;
      let hasPerSpaceDeadlines = false;

      if (allSameDeadline) {
        // All spaces have the same deadline - simple format: "Room 001, Room 002, Room 003"
        roomsList = customerGroup.contracts
          .map(c => c.RoomID || c.Room || c.room || 'N/A')
          .join(', ');
      } else {
        // Different deadlines - format with days: "Room 001 (2 days), Room 002 (1 day)"
        hasPerSpaceDeadlines = true;
        roomsList = customerGroup.contracts
          .map(c => {
            const room = c.RoomID || c.Room || c.room || 'N/A';
            const days = c.days_to_deadline;
            const dayLabel = language === 'am' ? 'ቀን' : 'day' + (days !== 1 ? 's' : '');
            return `${room} (${days} ${dayLabel})`;
          })
          .join(', ');
      }

      // If per-space deadlines, create custom message format
      if (hasPerSpaceDeadlines) {
        const customerName = language === 'am' ?
          (customerGroup.customer_name_am || customerGroup.customer_name || 'ደንበኛ') :
          (customerGroup.customer_name || 'Customer');

        if (language === 'am') {
          return `ውድ ${customerName}፣ ብቻ የክፍል ${roomsList} ውልዎ ሊጠናቀቅ ቀርቷል።`;
        } else {
          return `Dear ${customerName}, only the following rooms have expiring contracts: ${roomsList}. Please contact us to discuss renewal.`;
        }
      }

      // Create a contract object with consolidated info including all rooms
      const consolidatedContract = {
        ...firstContract,
        customer_name: customerGroup.customer_name,
        customer_name_am: customerGroup.customer_name_am,
        // Replace room with all rooms list
        RoomID: roomsList,
        Room: roomsList,
        room: roomsList,
        // Add count info to the description
        description: language === 'am' ?
          `${customerGroup.contractCount} ውሎች ሊጠናቀቁ ነው` :
          `${customerGroup.contractCount} contracts expiring`
      };

      // Use the standard contract reminder message template
      return await this.createContractReminderMessage(consolidatedContract, language);
    } catch (error) {
      console.error('Error creating consolidated contract reminder message:', error.message);
      throw new Error(`Error creating consolidated contract reminder message: ${error.message}`);
    }
  }

  /**
   * Get all available templates
   * @param {string} language - Language code ('en' or 'am')
   * @returns {Array} Array of templates
   */
  static async getAllTemplates(language = null) {
    try {
      return await Template.findAll(language);
    } catch (error) {
      console.error(`Error getting all templates: ${error.message}`);
      throw new Error(`Error getting all templates: ${error.message}`);
    }
  }
}

module.exports = SmsTemplateService;
