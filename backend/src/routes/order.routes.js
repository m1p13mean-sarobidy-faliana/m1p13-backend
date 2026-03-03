const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder
} = require('../controllers/order.controller');

// All routes in this file require authentication
router.use(protect);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

module.exports = router;