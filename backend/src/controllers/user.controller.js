const User = require("../models/user.model");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.getAllUsersById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ success: true, message: "Utilisateur créé", data: newUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { email, first_name, last_name, phone, role, status, q } = req.query;

    if (q && q.trim() !== '') {
      const generic = q.trim();
      const searchQuery = {
        $or: [
          { email: { $regex: generic, $options: 'i' } },
          { first_name: { $regex: generic, $options: 'i' } },
          { last_name: { $regex: generic, $options: 'i' } },
          { phone: { $regex: generic, $options: 'i' } },
          { role: { $regex: generic, $options: 'i' } },
          { status: { $regex: generic, $options: 'i' } }
        ]
      };
      const users = await User.find(searchQuery).select('-password');
      return res.status(200).json({ success: true, count: users.length, data: users });
    }

    const searchQuery = {};
    if (email) searchQuery.email = { $regex: email, $options: 'i' };
    if (first_name) searchQuery.first_name = { $regex: first_name, $options: 'i' };
    if (last_name) searchQuery.last_name = { $regex: last_name, $options: 'i' };
    if (phone) searchQuery.phone = { $regex: phone, $options: 'i' };
    if (role) searchQuery.role = { $regex: role, $options: 'i' };
    if (status) searchQuery.status = { $regex: status, $options: 'i' };

    if (Object.keys(searchQuery).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un paramètre de recherche requis'
      });
    }

    const users = await User.find(searchQuery).select('-password');
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
    res.json({ success: true, message: "Utilisateur mis à jour", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
    res.json({ success: true, message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
