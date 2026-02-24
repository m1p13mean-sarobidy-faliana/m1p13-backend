const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize, isAdmin } = require('../middlewares/role.middleware');
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
  getDashboardStats
} = require('../controllers/admin.controller');

// Toutes les routes admin nécessitent d'être authentifié ET admin

// ==================== SHOPS ====================
// Méthode 1 : Utiliser authorize()
router.get('/shops', protect, authorize('admin'), getAllShops);
router.get('/shops/:id', protect, authorize('admin'), getShopById);
router.put('/shops/:id/approve', protect, authorize('admin'), approveShop);
router.put('/shops/:id/suspend', protect, authorize('admin'), suspendShop);
router.delete('/shops/:id', protect, authorize('admin'), deleteShop);

// Méthode 2 : Utiliser isAdmin (équivalent mais plus court)
// router.get('/shops', protect, isAdmin, getAllShops);

// ==================== CATEGORIES ====================
router.get('/categories', protect, authorize('admin'), getAllCategories);
router.post('/categories', protect, authorize('admin'), createCategory);
router.put('/categories/:id', protect, authorize('admin'), updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

// ==================== STATS ====================
router.get('/stats/dashboard', protect, authorize('admin'), getDashboardStats);

module.exports = router;