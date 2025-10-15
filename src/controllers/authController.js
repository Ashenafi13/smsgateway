const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');

class AuthController {
  // Register a new user
  static async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { fullName, username, password } = req.body;

      // Validate password strength
      const passwordValidation = AuthService.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Password validation failed',
          details: passwordValidation.errors
        });
      }

      // Register user
      const user = await AuthService.register({
        fullName,
        username,
        password
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, password } = req.body;

      // Login user
      const result = await AuthService.login({
        username,
        password
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        error: 'Login failed',
        message: error.message
      });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await AuthService.getProfile(userId);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(404).json({
        error: 'Profile not found',
        message: error.message
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const { fullName, username } = req.body;

      const updatedUser = await AuthService.updateProfile(userId, {
        fullName,
        username
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({
        error: 'Profile update failed',
        message: error.message
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Validate new password strength
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Password validation failed',
          details: passwordValidation.errors
        });
      }

      await AuthService.changePassword(userId, {
        currentPassword,
        newPassword
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        error: 'Password change failed',
        message: error.message
      });
    }
  }

  // Logout (client-side token removal, server doesn't maintain session)
  static async logout(req, res) {
    try {
      // In a JWT-based system, logout is typically handled client-side
      // by removing the token from storage
      res.json({
        success: true,
        message: 'Logout successful. Please remove the token from client storage.'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: error.message
      });
    }
  }

  // Verify token (useful for client-side token validation)
  static async verifyToken(req, res) {
    try {
      // If we reach here, the token is valid (middleware already verified it)
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        error: 'Token verification failed',
        message: error.message
      });
    }
  }
}

module.exports = AuthController;
