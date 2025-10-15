const { getBMSPool, sql } = require('../config/database');

class Payment {
  constructor(data) {
    this.id = data.id;
    this.paid_by = data.paid_by;
    this.room = data.room;
    this.description = data.description;
    this.price = data.price;
    this.line_total = data.line_total;
    this.customer_type = data.customer_type;
    this.paid_date = data.paid_date;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.mystatus = data.mystatus;
    this.payment_Method = data.payment_Method;
    this.check_number = data.check_number;
    this.FSNo = data.FSNo;
    this.paymentStatus = data.paymentStatus;
    this.B_ID = data.B_ID;
    this.nofif_status = data.nofif_status;
    this.PaymentTerm = data.PaymentTerm;
    this.calender = data.calender;
    this.SubTotal = data.SubTotal;
    this.Vat = data.Vat;
    this.GroundTotal = data.GroundTotal;
    this.TotalWithWord = data.TotalWithWord;
    this.Discount = data.Discount;
    this.ETStartDate = data.ETStartDate;
    this.ETEndDate = data.ETEndDate;
  }

  // Get all payments
  static async findAll(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM payment 
          ORDER BY paid_date DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(payment => new Payment(payment));
    } catch (error) {
      throw new Error(`Error fetching payments: ${error.message}`);
    }
  }

  // Get payments with customer details
  static async findAllWithCustomers(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT 
            p.*,
            CASE 
              WHEN p.customer_type = 'com' THEN cp.CompanyName
              WHEN p.customer_type = 'ind' THEN ir.fullname
              ELSE 'Unknown'
            END as customer_name,
            CASE 
              WHEN p.customer_type = 'com' THEN cp.PhoneNumber
              WHEN p.customer_type = 'ind' THEN ir.phone
              ELSE NULL
            END as customer_phone,
            CASE 
              WHEN p.customer_type = 'com' THEN cp.Email
              WHEN p.customer_type = 'ind' THEN ir.email
              ELSE NULL
            END as customer_email
          FROM payment p
          LEFT JOIN company_profile cp ON p.customer_type = 'com' AND p.paid_by = cp.com_id
          LEFT JOIN individual_renters ir ON p.customer_type = 'ind' AND p.paid_by = ir.ind_id
          ORDER BY p.paid_date DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching payments with customers: ${error.message}`);
    }
  }

  // Get payments approaching deadline (including overdue)
  static async findApproachingDeadline(daysToDeadline) {
    try {
      const pool = getBMSPool();
      const request = pool.request();

      const result = await request
        .input('daysToDeadline', sql.Int, daysToDeadline)
        .query(`
          SELECT
            p.*,
            CASE
              WHEN p.customer_type = 'com' THEN cp.CompanyName
              WHEN p.customer_type = 'ind' THEN ir.fullname
              ELSE 'Unknown'
            END as customer_name,
            CASE
              WHEN p.customer_type = 'com' THEN cp.PhoneNumber
              WHEN p.customer_type = 'ind' THEN ir.phone
              ELSE NULL
            END as customer_phone,
            DATEDIFF(day, GETDATE(), p.end_date) as days_to_deadline
          FROM payment p
          LEFT JOIN company_profile cp ON p.customer_type = 'com' AND p.paid_by = cp.com_id
          LEFT JOIN individual_renters ir ON p.customer_type = 'ind' AND p.paid_by = ir.ind_id
          WHERE p.end_date IS NOT NULL
          AND (
            -- Approaching deadline (within specified days)
            (DATEDIFF(day, GETDATE(), p.end_date) <= @daysToDeadline AND DATEDIFF(day, GETDATE(), p.end_date) >= 0)
            OR
            -- Overdue payments (past deadline but within grace period)
            (DATEDIFF(day, GETDATE(), p.end_date) < 0 AND DATEDIFF(day, GETDATE(), p.end_date) >= -@daysToDeadline)
          )
          AND (p.paymentStatus IS NULL OR p.paymentStatus != 'completed')
          ORDER BY p.end_date ASC
        `);

      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching payments approaching deadline: ${error.message}`);
    }
  }

  // Get payment by ID
  static async findById(id) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('SELECT * FROM payment WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new Payment(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding payment by ID: ${error.message}`);
    }
  }

  // Get payments by customer
  static async findByCustomer(customerId, customerType) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('customerId', sql.Int, customerId)
        .input('customerType', sql.NVarChar(10), customerType)
        .query(`
          SELECT * FROM payment 
          WHERE paid_by = @customerId AND customer_type = @customerType
          ORDER BY paid_date DESC
        `);
      
      return result.recordset.map(payment => new Payment(payment));
    } catch (error) {
      throw new Error(`Error fetching payments by customer: ${error.message}`);
    }
  }
}

module.exports = Payment;
