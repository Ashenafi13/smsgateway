const { getBMSPool } = require('../config/database');
const sql = require('mssql');

class PenalityPeriod {
  constructor(data) {
    this.ID = data.ID;
    this.Period = data.Period;
    this.StartPeriod = data.StartPeriod;
    this.EndPeriod = data.EndPeriod;
    this.AmountPerMonth = data.AmountPerMonth;
    this.AmountPerDays = data.AmountPerDays;
    this.AmountPersentagePerMonth = data.AmountPersentagePerMonth;
    this.AmountPersentagePerDay = data.AmountPersentagePerDay;
  }

  // Get all penalty periods
  static async findAll() {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT TOP (1000) [ID]
              ,[Period]
              ,[StartPeriod]
              ,[EndPeriod]
              ,[AmountPerMonth]
              ,[AmountPerDays]
              ,[AmountPersentagePerMonth]
              ,[AmountPersentagePerDay]
          FROM [BMS].[dbo].[PenalityPeriod]
          ORDER BY StartPeriod ASC
      `);
      
      return result.recordset.map(period => new PenalityPeriod(period));
    } catch (error) {
      throw new Error(`Error fetching penalty periods: ${error.message}`);
    }
  }

  // Get penalty period by ID
  static async findById(id) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query(`
          SELECT [ID]
                ,[Period]
                ,[StartPeriod]
                ,[EndPeriod]
                ,[AmountPerMonth]
                ,[AmountPerDays]
                ,[AmountPersentagePerMonth]
                ,[AmountPersentagePerDay]
            FROM [BMS].[dbo].[PenalityPeriod]
            WHERE ID = @id
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new PenalityPeriod(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding penalty period by ID: ${error.message}`);
    }
  }

  // Get penalty period for specific number of overdue days
  static async findByOverdueDays(overdueDays) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('overdueDays', sql.Int, Math.abs(overdueDays))
        .query(`
          SELECT TOP 1 [ID]
                ,[Period]
                ,[StartPeriod]
                ,[EndPeriod]
                ,[AmountPerMonth]
                ,[AmountPerDays]
                ,[AmountPersentagePerMonth]
                ,[AmountPersentagePerDay]
            FROM [BMS].[dbo].[PenalityPeriod]
            WHERE @overdueDays >= StartPeriod 
            AND (@overdueDays <= EndPeriod OR EndPeriod IS NULL)
            ORDER BY StartPeriod ASC
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new PenalityPeriod(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding penalty period for overdue days: ${error.message}`);
    }
  }

  // Calculate penalty amount for a payment
  static async calculatePenalty(paymentAmount, overdueDays) {
    try {
      if (overdueDays <= 0) {
        return 0; // No penalty for payments that are not overdue
      }

      const penaltyPeriod = await this.findByOverdueDays(overdueDays);
      
      if (!penaltyPeriod) {
        console.warn(`No penalty period found for ${overdueDays} overdue days`);
        return 0;
      }

      // Calculate penalty using AmountPersentagePerDay
      const penaltyPercentagePerDay = penaltyPeriod.AmountPersentagePerDay || 0;
      const penaltyAmount = (paymentAmount * penaltyPercentagePerDay / 100) * overdueDays;
      
      return Math.round(penaltyAmount * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error(`Error calculating penalty: ${error.message}`);
      throw new Error(`Error calculating penalty: ${error.message}`);
    }
  }

  // Calculate penalty with detailed breakdown
  static async calculatePenaltyWithDetails(paymentAmount, overdueDays) {
    try {
      if (overdueDays <= 0) {
        return {
          penaltyAmount: 0,
          totalAmount: paymentAmount,
          overdueDays: 0,
          penaltyPercentagePerDay: 0,
          penaltyPeriod: null
        };
      }

      const penaltyPeriod = await this.findByOverdueDays(overdueDays);
      
      if (!penaltyPeriod) {
        return {
          penaltyAmount: 0,
          totalAmount: paymentAmount,
          overdueDays: overdueDays,
          penaltyPercentagePerDay: 0,
          penaltyPeriod: null
        };
      }

      const penaltyPercentagePerDay = penaltyPeriod.AmountPersentagePerDay || 0;
      const penaltyAmount = (paymentAmount * penaltyPercentagePerDay / 100) * overdueDays;
      const roundedPenaltyAmount = Math.round(penaltyAmount * 100) / 100;
      
      return {
        penaltyAmount: roundedPenaltyAmount,
        totalAmount: paymentAmount + roundedPenaltyAmount,
        overdueDays: overdueDays,
        penaltyPercentagePerDay: penaltyPercentagePerDay,
        penaltyPeriod: penaltyPeriod
      };
    } catch (error) {
      console.error(`Error calculating penalty with details: ${error.message}`);
      throw new Error(`Error calculating penalty with details: ${error.message}`);
    }
  }
}

module.exports = PenalityPeriod;
