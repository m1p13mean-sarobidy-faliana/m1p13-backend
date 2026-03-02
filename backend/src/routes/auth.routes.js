const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  loginMFA,
  verifyMFACode,
  updateProfile
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/login-mfa', loginMFA);
router.post('/verify-mfa-code', verifyMFACode);
router.post('/refresh-token', refreshToken); // Public mais nécessite refresh token
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-email/:token', verifyEmail);

// Routes protégées
router.get('/whoami', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

module.exports = router;