const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
  generateAccessToken, 
  generateRefreshToken 
} = require('../utils/generateToken');
const { isValidEmail, isStrongPassword, isValidPhone } = require('../utils/validators');
const { sendEmail, getVerificationEmailTemplate, getPasswordResetTemplate } = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Inscription
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(422).json({
        success: false,
        message: 'Email invalide'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(422).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères, incluant lettres et chiffres'
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(422).json({
        success: false,
        message: 'Numéro de téléphone invalide'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'customer',
      phone,
      status: role === 'shop_manager' ? 'pending' : 'active'
    });

    // Générer les 2 tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'inscription' 
    });
  }
};

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(422).json({
        success: false,
        message: 'Email invalide'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ 
        success: false,
        message: 'Votre compte a été suspendu' 
      });
    }

    if (user.status === 'payment_required') {
      return res.status(402).json({
        success: false,
        message: 'Paiement requis pour activer votre compte'
      });
    }

    if (user.status === 'pending' && user.role === 'shop_manager') {
      return res.status(403).json({ 
        success: false,
        message: 'Votre compte boutique est en attente de validation' 
      });
    }

    // Générer les 2 tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la connexion' 
    });
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public (mais nécessite un refresh token valide)
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Vérifier si le refresh token est fourni
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token manquant'
      });
    }

    // Vérifier et décoder le refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu'
      });
    }

    if (user.status === 'payment_required') {
      return res.status(402).json({
        success: false,
        message: 'Paiement requis pour activer votre compte'
      });
    }

    // Générer un nouveau access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    // Optionnel : Générer aussi un nouveau refresh token
    const newRefreshToken = generateRefreshToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken // Optionnel
      }
    });

  } catch (error) {
    console.error('Erreur refresh token:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};
// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Logout is typically handled client-side by removing tokens
    // Server-side can also invalidate token if using token blacklist (optional)
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'Email requis'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(422).json({
        success: false,
        message: 'Email invalide'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message: 'Si cet email existe, vous recevrez un email de réinitialisation'
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailContent = getPasswordResetTemplate(resetLink);
    
    try {
      await sendEmail(user.email, 'Réinitialisation de votre mot de passe', emailContent);
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save();
      console.error('Erreur envoi email reset:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Si cet email existe, vous recevrez un email de réinitialisation'
    });

  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de réinitialisation manquant'
      });
    }

    if (!password || !confirmPassword) {
      return res.status(401).json({
        success: false,
        message: 'Nouveau mot de passe requis'
      });
    }

    if (password !== confirmPassword) {
      return res.status(422).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(422).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères, incluant lettres et chiffres'
      });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// @desc    Verify Email
// @route   POST /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de vérification manquant'
      });
    }

    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      verificationToken: verificationTokenHash,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email vérifié avec succès'
    });

  } catch (error) {
    console.error('Erreur verify email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};