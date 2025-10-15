const { getBMSPool, sql } = require('../config/database');

class Contract {
  constructor(data) {
    this.ContractID = data.ContractID;
    this.RoomID = data.RoomID;
    this.StartDate = data.StartDate;
    this.EndDate = data.EndDate;
    this.customer_id = data.customer_id;
    this.CustomerType = data.CustomerType;
    this.RoomPrice = data.RoomPrice;
    this.ContractDate = data.ContractDate;
    this.ContractStatus = data.ContractStatus;
    this.NotifStatus = data.NotifStatus;
    this.B_ID = data.B_ID;
    this.ReserveMoney = data.ReserveMoney;
    this.FirstPayment = data.FirstPayment;
    this.PaymentTerms = data.PaymentTerms;
    this.calender = data.calender;
    this.CovertedGCStartDate = data.CovertedGCStartDate;
    this.CovertedGCEndDate = data.CovertedGCEndDate;
    this.Reason = data.Reason;
    this.isFirstTime = data.isFirstTime;
    this.leftMonths = data.leftMonths;
    this.leftDays = data.leftDays;
    this.paymentStartDate = data.paymentStartDate;
    this.noDatePeid = data.noDatePeid;
    this.PaymentType = data.PaymentType;
    this.noDay = data.noDay;
    this.isUpdatedContract = data.isUpdatedContract;
  }

  // Get all contracts
  static async findAll(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM Contract 
          ORDER BY ContractDate DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(contract => new Contract(contract));
    } catch (error) {
      throw new Error(`Error fetching contracts: ${error.message}`);
    }
  }

  // Get contracts with customer details
  static async findAllWithCustomers(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT 
            c.*,
            CASE 
              WHEN c.CustomerType = 'com' THEN cp.CompanyName
              WHEN c.CustomerType = 'ind' THEN ir.fullname
              ELSE 'Unknown'
            END as customer_name,
            CASE 
              WHEN c.CustomerType = 'com' THEN cp.PhoneNumber
              WHEN c.CustomerType = 'ind' THEN ir.phone
              ELSE NULL
            END as customer_phone,
            CASE 
              WHEN c.CustomerType = 'com' THEN cp.Email
              WHEN c.CustomerType = 'ind' THEN ir.email
              ELSE NULL
            END as customer_email
          FROM Contract c
          LEFT JOIN company_profile cp ON c.CustomerType = 'com' AND c.customer_id = cp.com_id
          LEFT JOIN individual_renters ir ON c.CustomerType = 'ind' AND c.customer_id = ir.ind_id
          ORDER BY c.ContractDate DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching contracts with customers: ${error.message}`);
    }
  }

  // Get contracts approaching deadline (including overdue)
  static async findApproachingDeadline(daysToDeadline) {
    try {
      const pool = getBMSPool();
      const request = pool.request();

      const result = await request
        .input('daysToDeadline', sql.Int, daysToDeadline)
        .query(`
          SELECT
            c.*,
            CASE
              WHEN c.CustomerType = 'com' THEN cp.CompanyName
              WHEN c.CustomerType = 'ind' THEN ir.fullname
              ELSE 'Unknown'
            END as customer_name,
            CASE
              WHEN c.CustomerType = 'com' THEN cp.PhoneNumber
              WHEN c.CustomerType = 'ind' THEN ir.phone
              ELSE NULL
            END as customer_phone,
            DATEDIFF(day, GETDATE(), c.EndDate) as days_to_deadline
          FROM Contract c
          LEFT JOIN company_profile cp ON c.CustomerType = 'com' AND c.customer_id = cp.com_id
          LEFT JOIN individual_renters ir ON c.CustomerType = 'ind' AND c.customer_id = ir.ind_id
          WHERE c.EndDate IS NOT NULL
          AND (
            -- Approaching deadline (within specified days)
            (DATEDIFF(day, GETDATE(), c.EndDate) <= @daysToDeadline AND DATEDIFF(day, GETDATE(), c.EndDate) >= 0)
            OR
            -- Overdue contracts (past deadline but within grace period)
            (DATEDIFF(day, GETDATE(), c.EndDate) < 0 AND DATEDIFF(day, GETDATE(), c.EndDate) >= -@daysToDeadline)
          )
          AND (c.ContractStatus IS NULL OR c.ContractStatus = 'active')
          ORDER BY c.EndDate ASC
        `);

      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching contracts approaching deadline: ${error.message}`);
    }
  }

  // Get contract by ID
  static async findById(id) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('SELECT * FROM Contract WHERE ContractID = @id');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new Contract(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding contract by ID: ${error.message}`);
    }
  }

  // Get contracts by customer
  static async findByCustomer(customerId, customerType) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('customerId', sql.Int, customerId)
        .input('customerType', sql.NVarChar(10), customerType)
        .query(`
          SELECT * FROM Contract 
          WHERE customer_id = @customerId AND CustomerType = @customerType
          ORDER BY ContractDate DESC
        `);
      
      return result.recordset.map(contract => new Contract(contract));
    } catch (error) {
      throw new Error(`Error fetching contracts by customer: ${error.message}`);
    }
  }

  // Get active contracts
  static async findActive() {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT * FROM Contract 
        WHERE ContractStatus = 'active'
        AND EndDate >= GETDATE()
        ORDER BY EndDate ASC
      `);
      
      return result.recordset.map(contract => new Contract(contract));
    } catch (error) {
      throw new Error(`Error fetching active contracts: ${error.message}`);
    }
  }
}

module.exports = Contract;
