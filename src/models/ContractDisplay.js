const { getBMSPool, sql } = require('../config/database');

class ContractDisplay {
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
    this.isFirstTime = data.isFirstTime;
    this.leftMonths = data.leftMonths;
    this.leftDays = data.leftDays;
    this.paymentStartDate = data.paymentStartDate;
    this.noDatePeid = data.noDatePeid;
    this.PaymentType = data.PaymentType;
    this.noDay = data.noDay;
    this.isUpdatedContract = data.isUpdatedContract;
  }

  // Get all contract displays
  static async findAll(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT * FROM ContractDisplay 
          ORDER BY ContractDate DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset.map(contract => new ContractDisplay(contract));
    } catch (error) {
      throw new Error(`Error fetching contract displays: ${error.message}`);
    }
  }

  // Get contract displays with customer details
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
              WHEN c.CustomerType = 'com' THEN cp.CompanyNameAM
              WHEN c.CustomerType = 'ind' THEN ir.fullnameAM
              ELSE 'Unknown'
            END as customer_name_am,
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
          FROM ContractDisplay c
          LEFT JOIN company_profile cp ON c.CustomerType = 'com' AND c.customer_id = cp.com_id
          LEFT JOIN individual_renters ir ON c.CustomerType = 'ind' AND c.customer_id = ir.ind_id
          ORDER BY c.ContractDate DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching contract displays with customers: ${error.message}`);
    }
  }

  // Get contract displays approaching deadline (including overdue)
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
              WHEN c.CustomerType = 'com' THEN cp.CompanyNameAM
              WHEN c.CustomerType = 'ind' THEN ir.fullnameAM
              ELSE 'Unknown'
            END as customer_name_am,
            CASE
              WHEN c.CustomerType = 'com' THEN cp.PhoneNumber
              WHEN c.CustomerType = 'ind' THEN ir.phone
              ELSE NULL
            END as customer_phone,
            c.CustomerType as customer_type,
            DATEDIFF(day, GETDATE(), c.EndDate) as days_to_deadline
          FROM ContractDisplay c
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
      throw new Error(`Error fetching contract displays approaching deadline: ${error.message}`);
    }
  }

  // Get contract displays approaching deadline grouped by customer (customer_id)
  static async findApproachingDeadlineGroupedByCustomer(daysToDeadline) {
    try {
      const contracts = await this.findApproachingDeadline(daysToDeadline);

      // Group contracts by customer (customer_id + CustomerType)
      const groupedContracts = {};

      contracts.forEach(contract => {
        const customerKey = `${contract.customer_type}_${contract.customer_id}`;

        if (!groupedContracts[customerKey]) {
          groupedContracts[customerKey] = {
            customer_id: contract.customer_id,
            customer_type: contract.customer_type,
            customer_name: contract.customer_name,
            customer_name_am: contract.customer_name_am,
            customer_phone: contract.customer_phone,
            contracts: []
          };
        }

        groupedContracts[customerKey].contracts.push(contract);
      });

      // Convert to array and sort by earliest deadline
      return Object.values(groupedContracts).map(group => {
        // Sort contracts within each group by deadline
        group.contracts.sort((a, b) => new Date(a.EndDate) - new Date(b.EndDate));

        // Add summary information
        group.totalRent = group.contracts.reduce((sum, c) => sum + (c.RoomPrice || 0), 0);
        group.contractCount = group.contracts.length;
        group.earliestDeadline = group.contracts[0].EndDate;
        group.earliestDaysToDeadline = group.contracts[0].days_to_deadline;

        return group;
      }).sort((a, b) => new Date(a.earliestDeadline) - new Date(b.earliestDeadline));

    } catch (error) {
      console.error('Error fetching grouped approaching deadline contract displays:', error);
      throw new Error(`Error fetching grouped approaching deadline contract displays: ${error.message}`);
    }
  }

  // Get contract displays approaching deadline grouped by customer AND deadline date
  // This ensures spaces with different deadlines get separate SMS messages
  static async findApproachingDeadlineGroupedByCustomerAndDate(daysToDeadline) {
    try {
      const contracts = await this.findApproachingDeadline(daysToDeadline);

      // Group contracts by customer (customer_id + CustomerType) AND deadline date
      const groupedContracts = {};

      contracts.forEach(contract => {
        // Normalize the date to YYYY-MM-DD format for consistent grouping
        const dateStr = new Date(contract.EndDate).toISOString().split('T')[0];
        const groupKey = `${contract.customer_type}_${contract.customer_id}_${dateStr}`;

        if (!groupedContracts[groupKey]) {
          groupedContracts[groupKey] = {
            customer_id: contract.customer_id,
            customer_type: contract.customer_type,
            customer_name: contract.customer_name,
            customer_name_am: contract.customer_name_am,
            customer_phone: contract.customer_phone,
            deadline_date: contract.EndDate,
            contracts: []
          };
        }

        groupedContracts[groupKey].contracts.push(contract);
      });

      // Convert to array and sort by deadline date
      return Object.values(groupedContracts).map(group => {
        // Add summary information
        group.totalRent = group.contracts.reduce((sum, c) => sum + (c.RoomPrice || 0), 0);
        group.contractCount = group.contracts.length;
        group.earliestDeadline = group.deadline_date;
        group.earliestDaysToDeadline = group.contracts[0].days_to_deadline;

        return group;
      }).sort((a, b) => new Date(a.earliestDeadline) - new Date(b.earliestDeadline));

    } catch (error) {
      console.error('Error fetching grouped approaching deadline contract displays by date:', error);
      throw new Error(`Error fetching grouped approaching deadline contract displays by date: ${error.message}`);
    }
  }

  // Get contract display by ID
  static async findById(id) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('SELECT * FROM ContractDisplay WHERE ContractID = @id');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new ContractDisplay(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error fetching contract display by ID: ${error.message}`);
    }
  }

  // Get contract displays by customer
  static async findByCustomer(customerId, customerType) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('customerId', sql.Int, customerId)
        .input('customerType', sql.NVarChar(10), customerType)
        .query(`
          SELECT * FROM ContractDisplay 
          WHERE customer_id = @customerId AND CustomerType = @customerType
          ORDER BY ContractDate DESC
        `);
      
      return result.recordset.map(contract => new ContractDisplay(contract));
    } catch (error) {
      throw new Error(`Error fetching contract displays by customer: ${error.message}`);
    }
  }
}

module.exports = ContractDisplay;
