const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken, authRateLimit } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit(5, 15 * 60 * 1000)); // 5 attempts per 15 minutes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authValidation.register, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authValidation.login, AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, authValidation.updateProfile, AuthController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticateToken, authValidation.changePassword, AuthController.changePassword);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
router.get('/verify', authenticateToken, AuthController.verifyToken);

module.exports = router;
