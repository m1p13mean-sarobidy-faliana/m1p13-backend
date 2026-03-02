const Favorite = require('../models/favorite.model');
const Shop = require('../models/shop.models');

exports.addFavorite = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const existing = await Favorite.findOne({ user: req.user.id, shop: req.params.shopId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Déjà dans vos favoris' });
    }

    const favorite = await Favorite.create({ user: req.user.id, shop: req.params.shopId });
    res.status(201).json({ success: true, message: 'Ajouté aux favoris', data: favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({ user: req.user.id, shop: req.params.shopId });
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favori non trouvé' });
    }
    res.json({ success: true, message: 'Retiré des favoris' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate({
        path: 'shop',
        populate: { path: 'category', select: 'name' }
      });

    res.json({ success: true, data: favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
