const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
  generateAccessToken, 
  generateRefreshToken 
} = require('../utils/generateToken');
const { isValidEmail, isStrongPassword, isValidPhone } = require('../utils/validators');
const { sendEmail, getVerificationEmailTemplate, getPasswordResetTemplate, getMFACodeTemplate } = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Inscription
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, phone } = req.body;

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
      first_name,
      last_name,
      role: role || 'CUSTOMER',
      phone,
      status: role === 'SHOP_MANAGER' ? 'WAITING' : 'VALID'
    });

    // Générer et stocker le token de vérification (24h)
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

      user.verificationToken = verificationTokenHash;
      user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify-email/${verificationToken}`;
      const emailContent = getVerificationEmailTemplate(verificationLink);
      try {
        const sendResult = await sendEmail(user.email, 'Vérifiez votre adresse email', emailContent);
        if (sendResult && sendResult.previewUrl) {
          console.info('Verification email preview:', sendResult.previewUrl);
        }
      } catch (emailError) {
        console.error('Erreur envoi email vérification:', emailError);
      }
    } catch (tokErr) {
      console.error('Erreur génération token vérification:', tokErr);
    }

    // Ne pas retourner les tokens - ils seront générés après vérification d'email
    res.status(201).json({
      success: true,
      message: 'Inscription réussie. Veuillez vérifier votre email pour confirmer votre adresse.',
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

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu'
      });
    }

    if (user.status === 'WAITING' && user.role === 'SHOP_MANAGER') {
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
          first_name: user.first_name,
          last_name: user.last_name,
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

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu'
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
        first_name: user.first_name || user.firstName,
        last_name: user.last_name || user.lastName,
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
// @desc    Update Profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, address } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (phone !== undefined) {
      if (phone && !isValidPhone(phone)) {
        return res.status(422).json({ success: false, message: 'Numéro de téléphone invalide' });
      }
      user.phone = phone;
    }
    if (address !== undefined) user.address = address;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour',
      data: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
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

    // Générer les tokens après vérification d'email
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Email vérifié avec succès',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Erreur verify email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// @desc    Login with MFA
// @route   POST /api/auth/login-mfa
// @access  Public
exports.loginMFA = async (req, res) => {
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

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu'
      });
    }

    if (user.status === 'WAITING' && user.role === 'SHOP_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte boutique est en attente de validation'
      });
    }

    // Generate 6-digit MFA code
    const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
    const mfaCodeHash = crypto.createHash('sha256').update(mfaCode).digest('hex');

    user.mfaCode = mfaCodeHash;
    user.mfaCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send MFA code email
    const emailContent = getMFACodeTemplate(mfaCode);
    try {
      const sendResult = await sendEmail(user.email, 'Votre code de vérification', emailContent);
      if (sendResult && sendResult.previewUrl) {
        console.info('MFA code email preview:', sendResult.previewUrl);
      }
    } catch (emailError) {
      console.error('Erreur envoi email MFA:', emailError);
    }

    // Return temporary session ID (could use sessionID or userId)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    res.status(200).json({
      success: true,
      message: 'Code de vérification envoyé à votre email',
      data: {
        user_id: user._id // À utiliser pour vérifier le code MFA
      }
    });

  } catch (error) {
    console.error('Erreur login MFA:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// @desc    Verify MFA Code
// @route   POST /api/auth/verify-mfa-code
// @access  Public
exports.verifyMFACode = async (req, res) => {
  try {
    const { user_id, code } = req.body;

    if (!user_id || !code) {
      return res.status(401).json({
        success: false,
        message: 'ID utilisateur et code requis'
      });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    const mfaCodeHash = crypto.createHash('sha256').update(code).digest('hex');

    if (!user.mfaCode || user.mfaCode !== mfaCodeHash) {
      return res.status(401).json({
        success: false,
        message: 'Code invalide'
      });
    }

    if (new Date() > user.mfaCodeExpires) {
      return res.status(401).json({
        success: false,
        message: 'Code expiré'
      });
    }

    // Clear MFA code
    user.mfaCode = undefined;
    user.mfaCodeExpires = undefined;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Authentification MFA réussie',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: user.status,
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    console.error('Erreur vérification MFA:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};