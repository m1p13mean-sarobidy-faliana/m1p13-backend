const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware pour protéger les routes
 * Vérifie la présence et la validité du token JWT
 */
exports.protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est dans le header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extraire le token
    token = req.headers.authorization.split(' ')[1];
  }

  // Vérifier si le token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token manquant'
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur (sans le mot de passe)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si le compte n'est pas suspendu
    if (req.user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu'
      });
    }

    next(); // Passer au middleware/controller suivant

  } catch (error) {
    console.error('Erreur vérification token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};