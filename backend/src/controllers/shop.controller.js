const Shop = require('../models/shop.models');
const User = require('../models/user.model');

exports.createShop = async (req, res) => {
  try {
    const manager = await User.findById(req.body.manager);
    if (!manager || manager.role !== 'SHOP_MANAGER') {
      return res.status(400).json({ success: false, message: 'Manager invalide' });
    }
    const { name, description } = req.body;
    const newShop = new Shop({
      name,
      description,
      manager: manager._id,
      note: 0,
    });

    await newShop.save();
    res.status(201).json({ success: true, message: 'Boutique créée', data: newShop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().populate('manager', 'first_name last_name email');
    res.json({ success: true, data: shops });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('manager', 'first_name last_name email');
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }
    res.json({ success: true, data: shop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    if (shop.manager.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    shop.name = name || shop.name;
    shop.description = description || shop.description;
    if (status && req.user.role === 'ADMIN') {
      shop.status = status;
    }

    await shop.save();
    res.json({ success: true, message: 'Boutique mise à jour', data: shop });
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

    if (shop.manager.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await Shop.findByIdAndDelete(shop._id);
    res.json({ success: true, message: 'Boutique supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Shop Manager
exports.getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id }).populate('manager', 'first_name last_name email');
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }
    res.json({ success: true, data: shop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updateMyShop = async (req, res) => {
  try {
    const { name, description, category, hours, image } = req.body;
    const shop = await Shop.findOne({ manager: req.user.id });

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    if (name) shop.name = name;
    if (description) shop.description = description;
    if (category !== undefined) shop.category = category;
    if (hours !== undefined) shop.hours = hours;
    if (image !== undefined) shop.image = image;

    await shop.save();
    res.json({ success: true, message: 'Boutique mise à jour', data: shop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyShopStats = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const Product = require('../models/product.model');
    const Review = require('../models/review.model');

    const totalProducts = await Product.countDocuments({ shop: shop._id });
    const totalReviews = await Review.countDocuments({ shop: shop._id });
    const avgRatingResult = await Review.aggregate([
      { $match: { shop: shop._id } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgRatingResult.length > 0 ? Math.round(avgRatingResult[0].avgRating * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalReviews,
        avgRating
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyShopReviews = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const Review = require('../models/review.model');
    const reviews = await Review.find({ shop: shop._id })
      .populate('user', 'first_name last_name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.searchShops = async (req, res) => {
  try {
    const { name, description, status, q } = req.query;

    if (q && q.trim() !== '') {
      const generic = q.trim();
      const searchQuery = {
        $or: [
          { name: { $regex: generic, $options: 'i' } },
          { description: { $regex: generic, $options: 'i' } },
          { status: { $regex: generic, $options: 'i' } }
        ]
      };
      const shops = await Shop.find(searchQuery);
      return res.status(200).json({ success: true, count: shops.length, data: shops });
    }

    const searchQuery = {};
    if (name) searchQuery.name = { $regex: name, $options: 'i' };
    if (description) searchQuery.description = { $regex: description, $options: 'i' };
    if (status) searchQuery.status = { $regex: status, $options: 'i' };

    if (Object.keys(searchQuery).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un paramètre de recherche requis (name, description, status) ou q'
      });
    }

    const shops = await Shop.find(searchQuery);
    return res.status(200).json({ success: true, count: shops.length, data: shops });
  } catch (error) {
    console.error('Erreur recherche boutiques:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
