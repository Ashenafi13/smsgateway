const { PenalityPeriod } = require('../models');
const DateUtils = require('../utils/dateUtils');

class PenaltyService {
  
  /**
   * Calculate penalty for a single payment
   * @param {Object} payment - Payment object with amount and end_date
   * @returns {Object} Penalty calculation details
   */
  static async calculatePaymentPenalty(payment) {
    try {
      const paymentAmount = payment.GroundTotal || payment.line_total || 0;
      const daysOverdue = this.calculateOverdueDays(payment.end_date);
      
      if (daysOverdue <= 0) {
        return {
          originalAmount: paymentAmount,
          penaltyAmount: 0,
          totalAmount: paymentAmount,
          daysOverdue: 0,
          hasPenalty: false,
          penaltyDetails: null
        };
      }

      const penaltyDetails = await PenalityPeriod.calculatePenaltyWithDetails(paymentAmount, daysOverdue);
      
      return {
        originalAmount: paymentAmount,
        penaltyAmount: penaltyDetails.penaltyAmount,
        totalAmount: penaltyDetails.totalAmount,
        daysOverdue: daysOverdue,
        hasPenalty: penaltyDetails.penaltyAmount > 0,
        penaltyDetails: penaltyDetails
      };
    } catch (error) {
      console.error(`Error calculating payment penalty: ${error.message}`);
      throw new Error(`Error calculating payment penalty: ${error.message}`);
    }
  }

  /**
   * Calculate penalties for multiple payments
   * @param {Array} payments - Array of payment objects
   * @returns {Array} Array of penalty calculation results
   */
  static async calculateMultiplePaymentPenalties(payments) {
    try {
      const penaltyCalculations = [];
      
      for (const payment of payments) {
        const penaltyResult = await this.calculatePaymentPenalty(payment);
        penaltyCalculations.push({
          paymentId: payment.id,
          ...penaltyResult
        });
      }
      
      return penaltyCalculations;
    } catch (error) {
      console.error(`Error calculating multiple payment penalties: ${error.message}`);
      throw new Error(`Error calculating multiple payment penalties: ${error.message}`);
    }
  }

  /**
   * Calculate overdue days for a payment
   * @param {Date|string} endDate - Payment end date
   * @returns {number} Number of days overdue (negative if not overdue)
   */
  static calculateOverdueDays(endDate) {
    try {
      const today = new Date();
      const deadline = new Date(endDate);
      
      // Reset time to start of day for accurate day calculation
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);
      
      const timeDiff = today.getTime() - deadline.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return daysDiff; // Positive if overdue, negative if not due yet
    } catch (error) {
      console.error(`Error calculating overdue days: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get penalty summary for a customer's payments
   * @param {Array} payments - Customer's payments
   * @returns {Object} Summary of penalties
   */
  static async getCustomerPenaltySummary(payments) {
    try {
      const penaltyCalculations = await this.calculateMultiplePaymentPenalties(payments);
      
      const summary = {
        totalPayments: payments.length,
        overduePayments: 0,
        totalOriginalAmount: 0,
        totalPenaltyAmount: 0,
        totalAmountWithPenalties: 0,
        paymentsWithPenalties: []
      };

      penaltyCalculations.forEach(calc => {
        summary.totalOriginalAmount += calc.originalAmount;
        summary.totalPenaltyAmount += calc.penaltyAmount;
        summary.totalAmountWithPenalties += calc.totalAmount;
        
        if (calc.hasPenalty) {
          summary.overduePayments++;
          summary.paymentsWithPenalties.push(calc);
        }
      });

      return summary;
    } catch (error) {
      console.error(`Error getting customer penalty summary: ${error.message}`);
      throw new Error(`Error getting customer penalty summary: ${error.message}`);
    }
  }

  /**
   * Format penalty amount for display
   * @param {number} amount - Penalty amount
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Formatted penalty amount
   */
  static formatPenaltyAmount(amount, language = 'en') {
    try {
      return DateUtils.formatCurrency(amount, language);
    } catch (error) {
      console.error(`Error formatting penalty amount: ${error.message}`);
      return language === 'am' ? `${amount} ብር` : `${amount} Birr`;
    }
  }

  /**
   * Get penalty text for SMS messages
   * @param {Object} penaltyResult - Result from calculatePaymentPenalty
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Penalty text for SMS
   */
  static getPenaltyText(penaltyResult, language = 'en') {
    try {
      if (!penaltyResult.hasPenalty) {
        return '';
      }

      const formattedPenalty = this.formatPenaltyAmount(penaltyResult.penaltyAmount, language);
      const formattedTotal = this.formatPenaltyAmount(penaltyResult.totalAmount, language);
      
      if (language === 'am') {
        return `+ ${formattedPenalty} ቅጣት። ጠቅላላ: ${formattedTotal}`;
      } else {
        return `+ ${formattedPenalty} penalty. Total: ${formattedTotal}`;
      }
    } catch (error) {
      console.error(`Error getting penalty text: ${error.message}`);
      return '';
    }
  }

  /**
   * Check if a payment is overdue
   * @param {Date|string} endDate - Payment end date
   * @returns {boolean} True if payment is overdue
   */
  static isPaymentOverdue(endDate) {
    try {
      return this.calculateOverdueDays(endDate) > 0;
    } catch (error) {
      console.error(`Error checking if payment is overdue: ${error.message}`);
      return false;
    }
  }

  /**
   * Get all penalty periods for reference
   * @returns {Array} Array of penalty periods
   */
  static async getAllPenaltyPeriods() {
    try {
      return await PenalityPeriod.findAll();
    } catch (error) {
      console.error(`Error getting penalty periods: ${error.message}`);
      throw new Error(`Error getting penalty periods: ${error.message}`);
    }
  }
}

module.exports = PenaltyService;
