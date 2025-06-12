const express = require('express');
const { 
  getAllColleges,
  createCollege,
  updateCollege,
  deleteCollege
} = require('../controllers/collegeController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Public route to get all colleges (needed for student registration)
router.get('/', getAllColleges);

// Protected routes for college management (super_admin only)
router.post('/', authMiddleware, requireRole('super_admin'), createCollege);
router.put('/:id', authMiddleware, requireRole('super_admin'), updateCollege);
router.delete('/:id', authMiddleware, requireRole('super_admin'), deleteCollege);

module.exports = router;

