const { toEthiopian, toGregorian } = require('../../converter');

class DateUtils {
  /**
   * Convert Gregorian date to Ethiopian date
   * @param {Date|string} gregorianDate - Gregorian date
   * @returns {Object} Ethiopian date object
   */
  static toEthiopianDate(gregorianDate) {
    try {
      const date = new Date(gregorianDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const day = date.getDate();

      const [ethYear, ethMonth, ethDay] = toEthiopian([year, month, day]);
      
      return {
        year: ethYear,
        month: ethMonth,
        day: ethDay,
        formatted: `${ethDay}/${ethMonth}/${ethYear}`
      };
    } catch (error) {
      console.error('Error converting to Ethiopian date:', error);
      // Fallback to Gregorian date
      const date = new Date(gregorianDate);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        formatted: date.toLocaleDateString()
      };
    }
  }

  /**
   * Convert Ethiopian date to Gregorian date
   * @param {number} year - Ethiopian year
   * @param {number} month - Ethiopian month
   * @param {number} day - Ethiopian day
   * @returns {Date} Gregorian date
   */
  static toGregorianDate(year, month, day) {
    try {
      const [gregYear, gregMonth, gregDay] = toGregorian([year, month, day]);
      return new Date(gregYear, gregMonth - 1, gregDay); // JavaScript months are 0-indexed
    } catch (error) {
      console.error('Error converting to Gregorian date:', error);
      return new Date();
    }
  }

  /**
   * Calculate days remaining until a deadline
   * @param {Date|string} endDate - The deadline date
   * @returns {number} Days remaining (negative if overdue)
   */
  static calculateDaysRemaining(endDate) {
    const today = new Date();
    const deadline = new Date(endDate);
    
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const timeDiff = deadline.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  }

  /**
   * Get urgency text based on days remaining
   * @param {number} daysRemaining - Days remaining until deadline
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Urgency text
   */
  static getUrgencyText(daysRemaining, language = 'en') {
    const texts = {
      en: {
        today: 'TODAY',
        tomorrow: 'TOMORROW',
        yesterday: 'YESTERDAY',
        overdue: 'OVERDUE',
        daysAgo: 'days ago',
        inDays: 'in',
        days: 'days'
      },
      am: {
        today: 'ዛሬ',
        tomorrow: 'ነገ',
        yesterday: 'ትናንት',
        overdue: 'ጊዜው አልፏል',
        daysAgo: 'ቀናት በፊት',
        inDays: 'በ',
        days: 'ቀናት'
      }
    };

    const t = texts[language] || texts.en;

    if (daysRemaining === 0) {
      return t.today;
    } else if (daysRemaining === 1) {
      return t.tomorrow;
    } else if (daysRemaining === -1) {
      return t.yesterday;
    } else if (daysRemaining < -1) {
      return language === 'am'
        ? `${Math.abs(daysRemaining)} ${t.daysAgo}`
        : `${Math.abs(daysRemaining)} ${t.daysAgo}`;
    } else if (daysRemaining > 1) {
      return language === 'am'
        ? `${t.inDays} ${daysRemaining} ${t.days}`
        : `${t.inDays} ${daysRemaining} ${t.days}`;
    }

    return t.overdue;
  }

  /**
   * Get detailed days remaining/expired text with explicit numbers
   * @param {number} daysRemaining - Days remaining until deadline
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Detailed days text
   */
  static getDaysRemainingText(daysRemaining, language = 'en') {
    if (language === 'am') {
      if (daysRemaining === 0) {
        return 'ዛሬ ይጠናቀቃል';
      } else if (daysRemaining === 1) {
        return '1 ቀን ቀርቷል';
      } else if (daysRemaining > 1) {
        return `${daysRemaining} ቀናት ቀርተዋል`;
      } else if (daysRemaining === -1) {
        return '1 ቀን አልፏል';
      } else if (daysRemaining < -1) {
        return `${Math.abs(daysRemaining)} ቀናት አልፈዋል`;
      }
    } else {
      if (daysRemaining === 0) {
        return 'expires today';
      } else if (daysRemaining === 1) {
        return '1 day remaining';
      } else if (daysRemaining > 1) {
        return `${daysRemaining} days remaining`;
      } else if (daysRemaining === -1) {
        return '1 day expired';
      } else if (daysRemaining < -1) {
        return `${Math.abs(daysRemaining)} days expired`;
      }
    }

    return language === 'am' ? 'ጊዜው አልፏል' : 'expired';
  }

  /**
   * Format currency in Ethiopian Birr
   * @param {number} amount - Amount to format
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Formatted currency
   */
  static formatCurrency(amount, language = 'en') {
    if (!amount || isNaN(amount)) {
      return language === 'am' ? 'መጠን አልተገለጸም' : 'Amount not specified';
    }

    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

    return language === 'am' 
      ? `${formattedAmount} ብር` 
      : `${formattedAmount} ETB`;
  }

  /**
   * Get Ethiopian month names
   * @param {string} language - Language code ('en' or 'am')
   * @returns {Array} Array of month names
   */
  static getEthiopianMonthNames(language = 'en') {
    const months = {
      en: [
        '', // Index 0 - not used
        'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
        'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
      ],
      am: [
        '', // Index 0 - not used
        'መስከረም', 'ጥቅምት', 'ሕዳር', 'ታኅሳስ', 'ጥር', 'የካቲት',
        'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
      ]
    };

    return months[language] || months.en;
  }

  /**
   * Format Ethiopian date with month name
   * @param {Object} ethDate - Ethiopian date object
   * @param {string} language - Language code ('en' or 'am')
   * @returns {string} Formatted date string
   */
  static formatEthiopianDate(ethDate, language = 'en') {
    const monthNames = this.getEthiopianMonthNames(language);
    const monthName = monthNames[ethDate.month] || ethDate.month;
    
    return language === 'am' 
      ? `${ethDate.day} ${monthName} ${ethDate.year}`
      : `${monthName} ${ethDate.day}, ${ethDate.year}`;
  }
}

module.exports = DateUtils;
