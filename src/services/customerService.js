const { Customer, Payment, Contract } = require('../models');

class CustomerService {
  // Get all customers with pagination
  static async getAllCustomers(limit = 100, offset = 0) {
    try {
      const customers = await Customer.findAll(limit, offset);
      return customers;
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  // Get individual customers only
  static async getIndividualCustomers(limit = 100, offset = 0) {
    try {
      const customers = await Customer.findIndividuals(limit, offset);
      return customers;
    } catch (error) {
      throw new Error(`Failed to fetch individual customers: ${error.message}`);
    }
  }

  // Get company customers only
  static async getCompanyCustomers(limit = 100, offset = 0) {
    try {
      const customers = await Customer.findCompanies(limit, offset);
      return customers;
    } catch (error) {
      throw new Error(`Failed to fetch company customers: ${error.message}`);
    }
  }

  // Get customer by ID and type
  static async getCustomerById(customerId, customerType) {
    try {
      const customer = await Customer.findByIdAndType(customerId, customerType);
      if (!customer) {
        throw new Error('Customer not found');
      }
      return customer;
    } catch (error) {
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
  }

  // Search customers
  static async searchCustomers(searchTerm, limit = 50, offset = 0) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters long');
      }
      
      const customers = await Customer.search(searchTerm.trim(), limit, offset);
      return customers;
    } catch (error) {
      throw new Error(`Failed to search customers: ${error.message}`);
    }
  }

  // Get customer with payment history
  static async getCustomerWithPayments(customerId, customerType, limit = 50, offset = 0) {
    try {
      const customer = await Customer.findByIdAndType(customerId, customerType);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const payments = await Payment.findByCustomer(customerId, customerType);
      
      return {
        customer,
        payments,
        paymentCount: payments.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch customer with payments: ${error.message}`);
    }
  }

  // Get customer with contract history
  static async getCustomerWithContracts(customerId, customerType, limit = 50, offset = 0) {
    try {
      const customer = await Customer.findByIdAndType(customerId, customerType);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const contracts = await Contract.findByCustomer(customerId, customerType);
      
      return {
        customer,
        contracts,
        contractCount: contracts.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch customer with contracts: ${error.message}`);
    }
  }

  // Get customer with full history (payments and contracts)
  static async getCustomerWithFullHistory(customerId, customerType) {
    try {
      const customer = await Customer.findByIdAndType(customerId, customerType);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const [payments, contracts] = await Promise.all([
        Payment.findByCustomer(customerId, customerType),
        Contract.findByCustomer(customerId, customerType)
      ]);
      
      return {
        customer,
        payments,
        contracts,
        paymentCount: payments.length,
        contractCount: contracts.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch customer with full history: ${error.message}`);
    }
  }

  // Get customer statistics
  static async getCustomerStatistics() {
    try {
      const statistics = await Customer.getStatistics();
      
      // Transform the result into a more readable format
      const stats = {
        total: 0,
        individual: 0,
        company: 0
      };

      statistics.forEach(stat => {
        if (stat.type === 'individual') {
          stats.individual = stat.count;
        } else if (stat.type === 'company') {
          stats.company = stat.count;
        }
        stats.total += stat.count;
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch customer statistics: ${error.message}`);
    }
  }

  // Get customers with upcoming payment deadlines
  static async getCustomersWithUpcomingPaymentDeadlines(daysToDeadline = 7) {
    try {
      const paymentsApproachingDeadline = await Payment.findApproachingDeadline(daysToDeadline);
      
      return paymentsApproachingDeadline.map(payment => ({
        customer_id: payment.paid_by,
        customer_type: payment.customer_type,
        customer_name: payment.customer_name,
        customer_phone: payment.customer_phone,
        payment_id: payment.id,
        room: payment.room,
        description: payment.description,
        end_date: payment.end_date,
        amount: payment.GroundTotal || payment.line_total,
        days_remaining: Math.ceil((new Date(payment.end_date) - new Date()) / (1000 * 60 * 60 * 24))
      }));
    } catch (error) {
      throw new Error(`Failed to fetch customers with upcoming payment deadlines: ${error.message}`);
    }
  }

  // Get customers with upcoming contract deadlines
  static async getCustomersWithUpcomingContractDeadlines(daysToDeadline = 7) {
    try {
      const contractsApproachingDeadline = await Contract.findApproachingDeadline(daysToDeadline);
      
      return contractsApproachingDeadline.map(contract => ({
        customer_id: contract.customer_id,
        customer_type: contract.CustomerType,
        customer_name: contract.customer_name,
        customer_phone: contract.customer_phone,
        contract_id: contract.ContractID,
        room_id: contract.RoomID,
        start_date: contract.StartDate,
        end_date: contract.EndDate,
        room_price: contract.RoomPrice,
        days_remaining: Math.ceil((new Date(contract.EndDate) - new Date()) / (1000 * 60 * 60 * 24))
      }));
    } catch (error) {
      throw new Error(`Failed to fetch customers with upcoming contract deadlines: ${error.message}`);
    }
  }
}

module.exports = CustomerService;
