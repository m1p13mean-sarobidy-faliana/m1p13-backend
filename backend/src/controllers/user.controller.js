const User = require("../models/user.model");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get by ID
exports.getAllUsersById = async (req, res) => {
  try {
    const users = await User.find({ _id: req.params.id });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Search users by any field
// Search users by query params (email, first_name, last_name, phone, role, status)
// Example: /api/users/search?email=john@example.com&status=VALID
exports.searchUsers = async (req, res) => {
  try {
    const { email, first_name, last_name, phone, role, status, q } = req.query;

    // Si param générique 'q' fourni, faire une recherche OR sur plusieurs champs
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
      const users = await User.find(searchQuery);
      return res.status(200).json({ success: true, count: users.length, data: users });
    }

    // Sinon construire une requête AND selon les params fournis
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
        message: 'Au moins un paramètre de recherche requis (email, first_name, last_name, phone, role, status) ou q'
      });
    }

    const users = await User.find(searchQuery);
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Update by ID
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete by ID
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
