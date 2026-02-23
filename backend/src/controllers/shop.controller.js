const Shop = require('../models/shop.models');
const User = require('../models/user.model');

exports.createShop = async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user.id;

    // Vérifier que l'utilisateur existe et est un shop_manager
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'shop_manager') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const newShop = new Shop({
      name,
      description,
      owner: ownerId,
      status: 'pending' // Par défaut, le statut est "pending"
    });

    await newShop.save();
    res.status(201).json(newShop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().populate('owner', 'firstName lastName email');
    res.json(shops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'firstName lastName email');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Vérifier que l'utilisateur est le propriétaire de la boutique ou un admin
    if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    shop.name = name || shop.name;
    shop.description = description || shop.description;
    if (status) {
      shop.status = status; // Seul un admin peut changer le statut
    }

    await shop.save();
    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Vérifier que l'utilisateur est le propriétaire de la boutique ou un admin
    if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await shop.remove();
    res.json({ message: 'Shop deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user.id }).populate('owner', 'firstName lastName email');
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        res.json(shop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateMyShop = async (req, res) => {
    try {
        const { name, description } = req.body;
        const shop = await Shop.findOne({ owner: req.user.id });

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        shop.name = name || shop.name;
        shop.description = description || shop.description;

        await shop.save();
        res.json(shop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyShopStats = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.user.id });

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Placeholder pour les statistiques (ex: nombre de produits, ventes, etc.)
        const stats = {
            totalProducts: 0, // À implémenter
            totalSales: 0 // À implémenter
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};