const User = require('../models/user.model');
const Shop = require('../models/shop.models');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const Promotion = require('../models/promotion.model');

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
