const express = require('express');
const { getAllColleges } = require('../controllers/collegeController');

const router = express.Router();

router.get('/', getAllColleges);

module.exports = router;

