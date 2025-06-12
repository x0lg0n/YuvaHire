const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth');

// Protected route - Update user profile
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;
