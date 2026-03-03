const User = require('../models/user.model');
const Shop = require('../models/shop.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const Promotion = require('../models/promotion.model');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');

// ==================== SHOPS ====================

exports.getAllShops = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const shops = await Shop.find(filter).populate('manager', 'first_name last_name email status');
    res.json({ success: true, data: shops });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('manager', 'first_name last_name email status');
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }
    res.json({ success: true, data: shop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getShopsByStatus = (status) => {
  return async (req, res) => {
    try {
      const shops = await Shop.find({ status }).populate('manager', 'first_name last_name email status');
      res.json({ success: true, data: shops });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  };
};


exports.approveShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    shop.status = 'ACTIVE';
    await shop.save();

    // Also set the manager's status to VALID
    await User.findByIdAndUpdate(shop.manager, { status: 'VALID' });

    res.json({ success: true, message: 'Boutique approuvée', data: shop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.suspendShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    shop.status = 'SUSPENDED';
    await shop.save();

    res.json({ success: true, message: 'Boutique suspendue', data: shop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    // Delete associated products and promotions
    await Product.deleteMany({ shop: shop._id });
    await Promotion.deleteMany({ shop: shop._id });
    await Shop.findByIdAndDelete(shop._id);

    res.json({ success: true, message: 'Boutique et données associées supprimées' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ==================== CATEGORIES ====================

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Nom requis' });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Cette catégorie existe déjà' });
    }

    const category = await Category.create({ name, description });
    res.status(201).json({ success: true, message: 'Catégorie créée', data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;

    await category.save();
    res.json({ success: true, message: 'Catégorie mise à jour', data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ==================== STATS ====================

exports.getDashboardStats = async (req, res) => {
  try {
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ status: 'ACTIVE' });
    const pendingShops = await Shop.countDocuments({ status: 'PENDING' });
    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
    const totalProducts = await Product.countDocuments();

    res.json({
      success: true,
      data: {
        totalShops,
        activeShops,
        pendingShops,
        totalCustomers,
        totalProducts
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};


// Admin: Get all orders (for admin users only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'first_name last_name email').populate('shop', 'name').populate('items.article', 'name price');
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Update order status (for admin users only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.status = status;
    await order.save();
    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Get a specific order by ID (for admin users only)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'first_name last_name email').populate('shop', 'name').populate('items.article', 'name price');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete an order (for admin users only)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Get all carts (for admin users only)
exports.getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find().populate('user', 'first_name last_name email').populate('items.article', 'name price');
    res.json({ success: true, data: carts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Update cart items (for admin users only)
exports.updateCartItems = async (req, res) => {
  try {
    const { items } = req.body; // Expecting an array of { articleId, quantity }
    const cart = await Cart.findById(req.params.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Validate and update items
    const updatedItems = [];
    for (const item of items) {
      const article = await Article.findById(item.articleId);
      if (!article) {
        return res.status(404).json({ success: false, message: `Article with ID ${item.articleId} not found` });
      }
      updatedItems.push({ article: item.articleId, quantity: item.quantity });
    }

    cart.items = updatedItems;
    await cart.save();
    res.json({ success: true, message: 'Cart items updated', data: cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Delete a cart (for admin users only)
exports.deleteCart = async (req, res) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    res.json({ success: true, message: 'Cart deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Get a specific cart by ID (for admin users only)
exports.getCartById = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id).populate('user', 'first_name last_name email').populate('items.article', 'name price');
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Delete a cart (for admin users only)
exports.deleteCart = async (req, res) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    res.json({ success: true, message: 'Cart deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
