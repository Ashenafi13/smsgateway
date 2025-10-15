const sql = require('mssql');

// BMS Database Configuration
const bmsConfig = {
  server: process.env.BMS_DB_SERVER,
  database: process.env.BMS_DB_DATABASE,
  user: process.env.BMS_DB_USER,
  password: process.env.BMS_DB_PASSWORD,
  port: parseInt(process.env.BMS_DB_PORT) || 1433,
  options: {
    encrypt: process.env.BMS_DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.BMS_DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// SMS Gateway Database Configuration
const smsConfig = {
  server: process.env.SMS_DB_SERVER,
  database: process.env.SMS_DB_DATABASE,
  user: process.env.SMS_DB_USER,
  password: process.env.SMS_DB_PASSWORD,
  options: {
    encrypt: process.env.SMS_DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.SMS_DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Connection pools
let bmsPool = null;
let smsPool = null;

// Connect to BMS Database
async function connectBMSDB() {
  try {
    if (bmsPool) {
      return bmsPool;
    }
    
    bmsPool = await sql.connect(bmsConfig);
    console.log('Connected to BMS database successfully');
    return bmsPool;
  } catch (error) {
    console.error('Error connecting to BMS database:', error);
    throw error;
  }
}

// Connect to SMS Gateway Database
async function connectSMSDB() {
  try {
    if (smsPool) {
      return smsPool;
    }
    
    smsPool = new sql.ConnectionPool(smsConfig);
    await smsPool.connect();
    console.log('Connected to SMS Gateway database successfully');
    return smsPool;
  } catch (error) {
    console.error('Error connecting to SMS Gateway database:', error);
    throw error;
  }
}

// Get BMS Database Pool
function getBMSPool() {
  if (!bmsPool) {
    throw new Error('BMS database not connected. Call connectBMSDB() first.');
  }
  return bmsPool;
}

// Get SMS Database Pool
function getSMSPool() {
  if (!smsPool) {
    throw new Error('SMS database not connected. Call connectSMSDB() first.');
  }
  return smsPool;
}

// Close all connections
async function closeConnections() {
  try {
    if (bmsPool) {
      await bmsPool.close();
      bmsPool = null;
      console.log('BMS database connection closed');
    }
    
    if (smsPool) {
      await smsPool.close();
      smsPool = null;
      console.log('SMS database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}

module.exports = {
  connectBMSDB,
  connectSMSDB,
  getBMSPool,
  getSMSPool,
  closeConnections,
  sql
};
