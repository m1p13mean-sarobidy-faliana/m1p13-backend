const Cart = require('../models/cart.model');
const Article = require('../models/article.model');
const Order = require('../models/order.model');

// Get current user's cart
exports.getMyCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.article');
    
    // Calculate total price
    let totalPrice = 0;
    if (cart && cart.items) {
      totalPrice = cart.items.reduce((sum, item) => {
        return sum + (item.article.price * item.quantity);
      }, 0);
    }
    
    const response = {
      ...cart.toObject(),
      totalPrice
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { articleId, quantity } = req.body;
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(item => item.article.toString() === articleId);
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ article: articleId, quantity });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { articleId } = req.body;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.article.toString() !== articleId);
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Checkout cart and create order
exports.checkoutCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.article');
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
