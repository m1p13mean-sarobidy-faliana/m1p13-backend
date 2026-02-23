const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize, isShopOwner } = require('../middlewares/role.middleware');
const {
  getMyShop,
  updateMyShop,
  getMyShopStats,
  getAllShops,
  getShopById
} = require('../controllers/shop.controller');

// Routes PUBLIQUES (pas de protection)
router.get('/', getAllShops);           // Liste toutes les boutiques
router.get('/:id', getShopById);        // Détails d'une boutique

// Routes PROTÉGÉES - Propriétaire de boutique uniquement
router.get('/my-shop/profile', protect, authorize('shop_manager'), getMyShop);
router.put('/my-shop/profile', protect, authorize('shop_manager'), updateMyShop);
router.get('/my-shop/stats', protect, authorize('shop_manager'), getMyShopStats);

module.exports = router;