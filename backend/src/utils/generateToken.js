const jwt = require('jsonwebtoken');

/**
 * Génère un Access Token (courte durée)
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes
  );
};

/**
 * Génère un Refresh Token (longue durée)
 */
const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 jours
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};