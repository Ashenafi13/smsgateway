const { getBMSPool, sql } = require('../config/database');

class PaymentDisplay {
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

  // Get all payment displays
  static async findAll(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM paymentDisplay 
          ORDER BY paid_date DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(payment => new PaymentDisplay(payment));
    } catch (error) {
      throw new Error(`Error fetching payment displays: ${error.message}`);
    }
  }

  // Get payment displays with customer details
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
              WHEN p.customer_type = 'com' THEN cp.CompanyNameAM
              WHEN p.customer_type = 'ind' THEN ir.fullnameAM
              ELSE 'Unknown'
            END as customer_name_am,
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
          FROM paymentDisplay p
          LEFT JOIN company_profile cp ON p.customer_type = 'com' AND p.paid_by = cp.com_id
          LEFT JOIN individual_renters ir ON p.customer_type = 'ind' AND p.paid_by = ir.ind_id
          ORDER BY p.paid_date DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching payment displays with customers: ${error.message}`);
    }
  }

  // Get payment displays approaching deadline (including overdue)
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
              WHEN p.customer_type = 'com' THEN cp.CompanyNameAM
              WHEN p.customer_type = 'ind' THEN ir.fullnameAM
              ELSE 'Unknown'
            END as customer_name_am,
            CASE
              WHEN p.customer_type = 'com' THEN cp.PhoneNumber
              WHEN p.customer_type = 'ind' THEN ir.phone
              ELSE NULL
            END as customer_phone,
            p.customer_type,
            DATEDIFF(day, GETDATE(), p.end_date) as days_to_deadline
          FROM paymentDisplay p
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
      throw new Error(`Error fetching payment displays approaching deadline: ${error.message}`);
    }
  }

  // Get payment displays approaching deadline grouped by customer (paid_by)
  static async findApproachingDeadlineGroupedByCustomer(daysToDeadline) {
    try {
      const payments = await this.findApproachingDeadline(daysToDeadline);
      
      // Group payments by customer (paid_by + customer_type)
      const groupedPayments = {};
      
      payments.forEach(payment => {
        const customerKey = `${payment.customer_type}_${payment.paid_by}`;
        
        if (!groupedPayments[customerKey]) {
          groupedPayments[customerKey] = {
            customer_id: payment.paid_by,
            customer_type: payment.customer_type,
            customer_name: payment.customer_name,
            customer_name_am: payment.customer_name_am,
            customer_phone: payment.customer_phone,
            payments: []
          };
        }
        
        groupedPayments[customerKey].payments.push(payment);
      });
      
      // Convert to array and sort by earliest deadline
      return Object.values(groupedPayments).map(group => {
        // Sort payments within each group by deadline
        group.payments.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
        
        // Add summary information
        group.totalAmount = group.payments.reduce((sum, p) => sum + (p.GroundTotal || p.line_total || 0), 0);
        group.paymentCount = group.payments.length;
        group.earliestDeadline = group.payments[0].end_date;
        group.earliestDaysToDeadline = group.payments[0].days_to_deadline;
        
        return group;
      }).sort((a, b) => new Date(a.earliestDeadline) - new Date(b.earliestDeadline));
      
    } catch (error) {
      console.error('Error fetching grouped approaching deadline payment displays:', error);
      throw new Error(`Error fetching grouped approaching deadline payment displays: ${error.message}`);
    }
  }

  // Get payment display by ID
  static async findById(id) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('SELECT * FROM paymentDisplay WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new PaymentDisplay(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error fetching payment display by ID: ${error.message}`);
    }
  }

  // Get payment displays by customer
  static async findByCustomer(customerId, customerType) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('customerId', sql.Int, customerId)
        .input('customerType', sql.NVarChar(10), customerType)
        .query(`
          SELECT * FROM paymentDisplay 
          WHERE paid_by = @customerId AND customer_type = @customerType
          ORDER BY paid_date DESC
        `);
      
      return result.recordset.map(payment => new PaymentDisplay(payment));
    } catch (error) {
      throw new Error(`Error fetching payment displays by customer: ${error.message}`);
    }
  }
}

module.exports = PaymentDisplay;
