const Shop = require('../models/shop.model');
const Product = require('../models/product.model');
const Review = require('../models/review.model');
const Promotion = require('../models/promotion.model');

exports.getAllActiveShops = async (req, res) => {
  try {
    const { category, name, page = 1, limit = 20 } = req.query;
    const filter = { status: 'ACTIVE' };

    if (category) filter.category = category;
    if (name) filter.name = { $regex: name, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const shops = await Shop.find(filter)
      .populate('category', 'name')
      .populate('manager', 'first_name last_name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Shop.countDocuments(filter);

    res.json({
      success: true,
      data: shops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getShopDetail = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('category', 'name')
      .populate('manager', 'first_name last_name');

    if (!shop || shop.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const products = await Product.find({ shop: shop._id, isActive: true })
      .populate('category', 'name');
    const reviews = await Review.find({ shop: shop._id })
      .populate('user', 'first_name last_name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        shop,
        products,
        reviews
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { name, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    // Only products from ACTIVE shops
    const activeShops = await Shop.find({ status: 'ACTIVE' }).select('_id');
    const activeShopIds = activeShops.map(s => s._id);

    const filter = { shop: { $in: activeShopIds }, isActive: true };

    if (name) filter.name = { $regex: name, $options: 'i' };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(filter)
      .populate('shop', 'name')
      .populate('category', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('shop', 'name status')
      .populate('category', 'name');

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
      .populate('product', 'name price image')
      .populate('shop', 'name')
      .sort({ endDate: 1 });

    res.json({ success: true, data: promotions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
