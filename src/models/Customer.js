const { getBMSPool, sql } = require('../config/database');

class Customer {
  // Get all customers (both individual and company)
  static async findAll(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT 
            'ind' as customer_type,
            ind_id as customer_id,
            fullname as customer_name,
            phone as phone_number,
            email,
            TIN,
            Status,
            B_ID,
            phone2,
            OfficeNumber,
            FirstName,
            LastName,
            MiddelName,
            city,
            subcity,
            wereda,
            Region
          FROM individual_renters
          WHERE Status = 'begin'
          
          UNION ALL
          
          SELECT 
            'com' as customer_type,
            com_id as customer_id,
            CompanyName as customer_name,
            PhoneNumber as phone_number,
            Email as email,
            TIN,
            Status,
            B_ID,
            PhoneNumber2 as phone2,
            OfficeNumber,
            NULL as FirstName,
            NULL as LastName,
            NULL as MiddelName,
            City as city,
            SubCity as subcity,
            Woreda as wereda,
            Region
          FROM company_profile
          WHERE Status = 'begin'
          
          ORDER BY customer_name
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching customers: ${error.message}`);
    }
  }

  // Get individual customers only
  static async findIndividuals(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT 
            ind_id,
            fullname,
            nationality,
            filename,
            filepath,
            city,
            subcity,
            wereda,
            phone,
            email,
            TIN,
            Status,
            B_ID,
            phone2,
            OfficeNumber,
            FirstName,
            LastName,
            MiddelName,
            FirstNameAM,
            LastNameAM,
            MiddelNameAM,
            fullnameAM,
            Region,
            TradeNameAM,
            TradeNameEN,
            TradeType
          FROM individual_renters
          WHERE Status = 'begin'
          ORDER BY fullname
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching individual customers: ${error.message}`);
    }
  }

  // Get company customers only
  static async findCompanies(limit = 100, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT 
            com_id,
            CompanyName,
            TradeName,
            Email,
            PhoneNumber,
            WebSite,
            TradeType,
            TIN,
            Status,
            B_ID,
            PhoneNumber2,
            OfficeNumber,
            CompanyNameAM,
            TradeNameAM,
            Region,
            City,
            SubCity,
            Woreda
          FROM company_profile
          WHERE Status = 'begin'
          ORDER BY CompanyName
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching company customers: ${error.message}`);
    }
  }

  // Find customer by ID and type
  static async findByIdAndType(customerId, customerType) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      let query;
      if (customerType === 'ind') {
        query = `
          SELECT 
            'ind' as customer_type,
            ind_id as customer_id,
            fullname as customer_name,
            phone as phone_number,
            email,
            TIN,
            Status,
            B_ID,
            phone2,
            OfficeNumber,
            FirstName,
            LastName,
            MiddelName,
            city,
            subcity,
            wereda,
            Region
          FROM individual_renters
          WHERE ind_id = @customerId
        `;
      } else if (customerType === 'com') {
        query = `
          SELECT 
            'com' as customer_type,
            com_id as customer_id,
            CompanyName as customer_name,
            PhoneNumber as phone_number,
            Email as email,
            TIN,
            Status,
            B_ID,
            PhoneNumber2 as phone2,
            OfficeNumber,
            NULL as FirstName,
            NULL as LastName,
            NULL as MiddelName,
            City as city,
            SubCity as subcity,
            Woreda as wereda,
            Region
          FROM company_profile
          WHERE com_id = @customerId
        `;
      } else {
        throw new Error('Invalid customer type. Must be "ind" or "com"');
      }
      
      const result = await request
        .input('customerId', sql.Int, customerId)
        .query(query);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error finding customer: ${error.message}`);
    }
  }

  // Search customers by name or phone
  static async search(searchTerm, limit = 50, offset = 0) {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request
        .input('searchTerm', sql.NVarChar(255), `%${searchTerm}%`)
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT 
            'ind' as customer_type,
            ind_id as customer_id,
            fullname as customer_name,
            phone as phone_number,
            email,
            TIN,
            Status,
            B_ID
          FROM individual_renters
          WHERE (fullname LIKE @searchTerm OR phone LIKE @searchTerm OR email LIKE @searchTerm)
          AND Status = 'active'
          
          UNION ALL
          
          SELECT 
            'com' as customer_type,
            com_id as customer_id,
            CompanyName as customer_name,
            PhoneNumber as phone_number,
            Email as email,
            TIN,
            Status,
            B_ID
          FROM company_profile
          WHERE (CompanyName LIKE @searchTerm OR PhoneNumber LIKE @searchTerm OR Email LIKE @searchTerm)
          AND Status = 'begin'
          
          ORDER BY customer_name
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error searching customers: ${error.message}`);
    }
  }

  // Get customer statistics
  static async getStatistics() {
    try {
      const pool = getBMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT 
          'individual' as type,
          COUNT(*) as count
        FROM individual_renters
        WHERE Status = 'active'
        
        UNION ALL
        
        SELECT 
          'company' as type,
          COUNT(*) as count
        FROM company_profile
        WHERE Status = 'begin'
      `);
      
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching customer statistics: ${error.message}`);
    }
  }
}

module.exports = Customer;
