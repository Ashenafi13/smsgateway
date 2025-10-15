const { getSMSPool, sql } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.fullName = data.fullName;
    this.username = data.username;
    this.password = data.password;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Create a new user
  static async create(userData) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('fullName', sql.NVarChar(255), userData.fullName)
        .input('username', sql.NVarChar(100), userData.username)
        .input('password', sql.NVarChar(255), userData.password)
        .query(`
          INSERT INTO tbls_users (fullName, username, password, createdAt, updatedAt)
          OUTPUT INSERTED.*
          VALUES (@fullName, @username, @password, GETDATE(), GETDATE())
        `);
      
      return new User(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('username', sql.NVarChar(100), username)
        .query('SELECT * FROM tbls_users WHERE username = @username');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new User(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('SELECT * FROM tbls_users WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new User(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Get all users
  static async findAll() {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request.query(`
        SELECT id, fullName, username, createdAt, updatedAt 
        FROM tbls_users 
        ORDER BY createdAt DESC
      `);
      
      return result.recordset.map(user => new User(user));
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Update user
  static async update(id, userData) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .input('fullName', sql.NVarChar(255), userData.fullName)
        .input('username', sql.NVarChar(100), userData.username)
        .query(`
          UPDATE tbls_users 
          SET fullName = @fullName, username = @username, updatedAt = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new User(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const pool = getSMSPool();
      const request = pool.request();
      
      const result = await request
        .input('id', sql.Int, id)
        .query('DELETE FROM tbls_users WHERE id = @id');
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
}

module.exports = User;
