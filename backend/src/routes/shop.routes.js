const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { isShopOwner } = require('../middlewares/role.middleware');
const {
  getMyShop,
  updateMyShop,
  getMyShopStats,
  getMyShopReviews
} = require('../controllers/shop.controller');
const {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');
const {
  getMyPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion
} = require('../controllers/promotion.controller');

// All routes require protect + isShopOwner
router.use(protect, isShopOwner);

// Shop routes
router.get('/', getMyShop);
router.put('/', updateMyShop);
router.get('/stats', getMyShopStats);
router.get('/reviews', getMyShopReviews);

// Product routes
router.get('/products', getMyProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Promotion routes
router.get('/promotions', getMyPromotions);
router.post('/promotions', createPromotion);
router.put('/promotions/:id', updatePromotion);
router.delete('/promotions/:id', deletePromotion);

module.exports = router;
