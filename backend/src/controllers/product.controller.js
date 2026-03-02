const Product = require('../models/product.model');
const Shop = require('../models/shop.models');

exports.getMyProducts = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const products = await Product.find({ shop: shop._id }).populate('category', 'name');
    res.json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    if (shop.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Votre boutique doit être active pour ajouter des produits' });
    }

    const { name, description, price, image, category } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Nom et prix requis' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
      shop: shop._id
    });

    res.status(201).json({ success: true, message: 'Produit créé', data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { name, description, price, image, category, isActive } = req.body;
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (image !== undefined) product.image = image;
    if (category !== undefined) product.category = category;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    res.json({ success: true, message: 'Produit mis à jour', data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ manager: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await Product.findByIdAndDelete(product._id);
    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
