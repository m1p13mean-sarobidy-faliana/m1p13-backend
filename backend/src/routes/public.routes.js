const express = require('express');
const router = express.Router();
const {
  getAllActiveShops,
  getShopDetail,
  getAllProducts,
  getProductById,
  getActivePromotions
} = require('../controllers/public.controller');
const { getShopReviews } = require('../controllers/review.controller');

// Public routes — no auth required
router.get('/shops', getAllActiveShops);
router.get('/shops/:id', getShopDetail);
router.get('/shops/:id/reviews', getShopReviews);
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.get('/promotions', getActivePromotions);

module.exports = router;
