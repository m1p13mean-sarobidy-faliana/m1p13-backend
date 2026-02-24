const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { isShopOwner, isAdmin, authorize } = require('../middlewares/role.middleware');
const {
  getMyShop,
  createShop,
  getMyShopStats,
  updateShop,
  deleteShop
} = require('../controllers/shop.controller');

// Routes PROTÉGÉES - Propriétaire de boutique uniquement
router.get('/', protect, isShopOwner, getMyShop);
router.get('/stats', protect, isShopOwner, getMyShopStats);

router.post('/create', protect, isAdmin, createShop);
router.put('/update', protect, authorize('shop_manager','admin'), updateShop);
router.delete('/delete', protect, isAdmin, deleteShop);

module.exports = router;