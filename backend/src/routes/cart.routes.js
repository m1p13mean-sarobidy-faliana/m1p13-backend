const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getMyCart,
  addToCart,
  removeFromCart
} = require('../controllers/cart.controller');

// All routes in this file require authentication
router.use(protect);

router.get('/', getMyCart);
router.post('/add', addToCart);
router.post('/remove', removeFromCart);

module.exports = router;