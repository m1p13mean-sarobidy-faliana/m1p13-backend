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
  verifyEmail
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken); // Public mais nécessite refresh token
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-email/:token', verifyEmail);

// Routes protégées
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;