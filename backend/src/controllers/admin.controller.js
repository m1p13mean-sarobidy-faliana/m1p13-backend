// TSY METY ITY, MBOLA ALAMINA MIHITSY NY STRUCTURE AN'NY ADMIN

const User = require('../models/user.model');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclure les mots de passe
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};