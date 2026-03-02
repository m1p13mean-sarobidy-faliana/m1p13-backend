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
router.get('/shops', protect, authorize('ADMIN'), getAllShops);
router.get('/shops/:id', protect, authorize('ADMIN'), getShopById);
router.put('/shops/:id/approve', protect, authorize('ADMIN'), approveShop);
router.put('/shops/:id/suspend', protect, authorize('ADMIN'), suspendShop);
router.delete('/shops/:id', protect, authorize('ADMIN'), deleteShop);

// Méthode 2 : Utiliser isAdmin (équivalent mais plus court)
// router.get('/shops', protect, isAdmin, getAllShops);

// ==================== CATEGORIES ====================
router.get('/categories', protect, authorize('ADMIN'), getAllCategories);
router.post('/categories', protect, authorize('ADMIN'), createCategory);
router.put('/categories/:id', protect, authorize('ADMIN'), updateCategory);
router.delete('/categories/:id', protect, authorize('ADMIN'), deleteCategory);

// ==================== STATS ====================
router.get('/stats/dashboard', protect, authorize('ADMIN'), getDashboardStats);

module.exports = router;