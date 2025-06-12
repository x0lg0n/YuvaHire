const College = require('../models/College');

const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort('name');
    res.json({ colleges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCollege = async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Name and location are required' });
    }

    const existingCollege = await College.findOne({ name });
    if (existingCollege) {
      return res.status(400).json({ message: 'College already exists' });
    }

    const college = await College.create({ name, location });
    res.status(201).json({
      message: 'College created successfully',
      college
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Name and location are required' });
    }

    const existingCollege = await College.findById(id);
    if (!existingCollege) {
      return res.status(404).json({ message: 'College not found' });
    }

    const updatedCollege = await College.findByIdAndUpdate(
      id,
      { name, location },
      { new: true }
    );

    res.json({
      message: 'College updated successfully',
      college: updatedCollege
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCollege = await College.findById(id);
    if (!existingCollege) {
      return res.status(404).json({ message: 'College not found' });
    }

    await College.findByIdAndDelete(id);
    res.json({ message: 'College deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getAllColleges,
  createCollege,
  updateCollege,
  deleteCollege
};

