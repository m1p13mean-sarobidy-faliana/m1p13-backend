const Promotion = require('../models/promotion.model');
const Product = require('../models/product.model');
const Shop = require('../models/shop.model');

exports.getMyPromotions = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const promotions = await Promotion.find({ shop: shop._id }).populate('product', 'name price');
    res.json({ success: true, data: promotions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const { product, discountPercent, startDate, endDate } = req.body;
    if (!product || !discountPercent || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Produit, réduction, date début et fin requis' });
    }

    // Verify the product belongs to this shop
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    if (productDoc.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ success: false, message: 'Ce produit ne vous appartient pas' });
    }

    const promotion = await Promotion.create({
      product,
      shop: shop._id,
      discountPercent,
      startDate,
      endDate
    });

    res.status(201).json({ success: true, message: 'Promotion créée', data: promotion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion non trouvée' });
    }

    if (promotion.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { discountPercent, startDate, endDate, isActive } = req.body;
    if (discountPercent !== undefined) promotion.discountPercent = discountPercent;
    if (startDate) promotion.startDate = startDate;
    if (endDate) promotion.endDate = endDate;
    if (isActive !== undefined) promotion.isActive = isActive;

    await promotion.save();
    res.json({ success: true, message: 'Promotion mise à jour', data: promotion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion non trouvée' });
    }

    if (promotion.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await Promotion.findByIdAndDelete(promotion._id);
    res.json({ success: true, message: 'Promotion supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
