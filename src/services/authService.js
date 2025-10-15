const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  // Register a new user
  static async register(userData) {
    try {
      const { fullName, username, password } = userData;

      // Check if user already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await User.create({
        fullName,
        username,
        password: hashedPassword
      });

      // Remove password from response
      const userResponse = {
        id: newUser.id,
        fullName: newUser.fullName,
        username: newUser.username,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };

      return userResponse;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Login user
  static async login(credentials) {
    try {
      const { username, password } = credentials;

      // Find user by username
      const user = await User.findByUsername(username);
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid username or password');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Return user data and token
      const userResponse = {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return {
        user: userResponse,
        token
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Generate JWT token
  static generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      fullName: user.fullName
    };

    const options = {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'sms-gateway'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Get user profile
  static async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove password from response
      const userResponse = {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return userResponse;
    } catch (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    try {
      const { fullName, username } = updateData;

      // Check if username is being changed and if it already exists
      if (username) {
        const existingUser = await User.findByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Username already exists');
        }
      }

      // Update user
      const updatedUser = await User.update(userId, {
        fullName,
        username
      });

      if (!updatedUser) {
        throw new Error('User not found');
      }

      // Remove password from response
      const userResponse = {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

      return userResponse;
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  // Change password
  static async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password in database (this would require a new method in User model)
      // For now, we'll throw an error indicating this feature needs implementation
      throw new Error('Password change feature needs to be implemented in User model');
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Validate password strength
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = AuthService;
