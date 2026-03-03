const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  getAllShops,
  getShopById,
  approveShop,
  suspendShop,
  deleteShop,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDashboardStats,
  getShopsByStatus,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getAllCarts,
  getCartById,
  updateCartItems,
  deleteCart
} = require('../controllers/admin.controller');

// ==================== SHOPS ====================
router.use(protect, authorize('ADMIN')); // Toutes les routes suivantes nécessitent d'être authentifié et admin
router.get('/shops', getAllShops);
router.get('/shops/pending', getShopsByStatus('PENDING'));
router.get('/shops/suspended', getShopsByStatus('SUSPENDED'));
router.get('/shops/:id', getShopById);
router.put('/shops/:id/approve', approveShop);
router.put('/shops/:id/suspend', suspendShop);
router.delete('/shops/:id', deleteShop);

// ==================== CATEGORIES ====================
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ==================== STATS ====================
router.get('/stats/dashboard', getDashboardStats);

// ==================== ORDERS ====================
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.post('/orders/:id/update-status', updateOrderStatus);

// ==================== CARTS ====================
router.get('/carts', getAllCarts);
router.get('/carts/:id', getCartById);
router.post('/carts/:id/update', updateCartItems);
router.delete('/carts/:id', deleteCart);

module.exports = router;