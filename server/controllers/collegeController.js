const College = require('../models/College');

const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.findAll();
    res.json({ colleges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllColleges };

