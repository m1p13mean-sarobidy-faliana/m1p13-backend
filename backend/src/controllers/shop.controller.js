const Shop = require('../models/shop.models');
const User = require('../models/user.model');

exports.createShop = async (req, res) => {
  try {
    // Seul ADMIN peut créer une boutique pour un manager existant
    const manager = await User.findById(req.body.manager);
    if (!manager || manager.role !== 'SHOP_MANAGER') {
      return res.status(400).json({ message: 'Manager invalide' });
    }
    const { name, description } = req.body;
    const newShop = new Shop({
      name,
      description,
      manager,
      note: 0,
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
    const shops = await Shop.find().populate('owner', 'first_name last_name email');
    res.json(shops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'first_name last_name email');
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

// ONLY ADMIN CAN DELETE
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

// Shop Manager
exports.getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ manager: req.user.id }).populate('manager', 'first_name last_name email');
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

// Search users by any field
// Search shops by query params (name, description, status)
// Example: /api/shops/search?name=MyShop&status=ACTIVATED
exports.searchShops = async (req, res) => {
  try {
    const { name, description, status, q } = req.query;

    // Si param générique 'q' fourni, faire une recherche OR sur plusieurs champs
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

    // Sinon construire une requête AND selon les params fournis
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