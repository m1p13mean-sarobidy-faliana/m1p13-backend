const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { getMyFavorites, addFavorite, removeFavorite } = require('../controllers/favorite.controller');
const { createReview } = require('../controllers/review.controller');

// All routes require auth + CUSTOMER role
router.use(protect, authorize('CUSTOMER'));

// Favorites
router.get('/favorites', getMyFavorites);
router.post('/favorites/:shopId', addFavorite);
router.delete('/favorites/:shopId', removeFavorite);

// Reviews
router.post('/shops/:shopId/reviews', createReview);

module.exports = router;
