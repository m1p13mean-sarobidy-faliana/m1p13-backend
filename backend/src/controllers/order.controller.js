const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Article = require('../models/article.model');
const Shop = require('../models/shop.model');

// Create a new order from the user's cart
exports.createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.article',
      populate: {
        path: 'shop',
        model: Shop
      }
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderItems = cart.items.map(item => ({
      article: item.article._id,
      quantity: item.quantity
    }));

    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.article.price * item.quantity;
    }, 0);

    const order = new Order({
      user: req.user.id,
      shop: cart.items[0].article.shop._id, // Assuming all items are from the same shop
      items: orderItems,
      totalPrice
    });
    
    await order.save();
    await Cart.findOneAndDelete({ user: req.user.id }); // Clear the cart after creating the order
    res.status(201).json({ success: true, message: 'Order created', data: order });
    } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all orders for the authenticated user
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('shop', 'name').populate('items.article', 'name price');
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get a specific order by ID (only if it belongs to the authenticated user)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id }).populate('shop', 'name').populate('items.article', 'name price');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel an order (only if it belongs to the authenticated user and is still pending)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
    }
    order.status = 'CANCELLED';
    await order.save();
    res.json({ success: true, message: 'Order cancelled', data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
