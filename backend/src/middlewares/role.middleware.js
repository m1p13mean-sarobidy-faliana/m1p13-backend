/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param  {...String} roles - Rôles autorisés (ex: 'admin', 'shop', 'buyer')
 * @returns Middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié - Veuillez vous connecter'
      });
    }

    // Vérifier si le rôle de l'utilisateur est autorisé
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé - Rôle requis: ${roles.join(' ou ')}. Votre rôle: ${req.user.role}`
      });
    }

    // Tout est OK, passer au controller
    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Admin uniquement'
    });
  }

  next();
};

/**
 * Middleware pour vérifier si l'utilisateur est propriétaire de boutique
 */
exports.isShopOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  if (req.user.role !== 'SHOP_MANAGER') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Boutique uniquement'
    });
  }

  next();
};

/**
 * Middleware pour vérifier si l'utilisateur est acheteur
 */
exports.isCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  if (req.user.role !== 'CUSTOMER') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Acheteur uniquement'
    });
  }

  next();
};