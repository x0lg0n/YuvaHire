const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Update user profile
const updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const { username } = req.body;
    const userId = req.user.id;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username is already taken' 
        });
      }
    }    // Update user profile
    const updateData = {};
    if (username) updateData.username = username;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });  }
};

module.exports = {
  updateProfile
};
