const express = require('express');
const { applyToJob, getMyApplications } = require('../controllers/applicationController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.post('/', authMiddleware, requireRole('student'), applyToJob);
router.get('/my-applications', authMiddleware, requireRole('student'), getMyApplications);

module.exports = router;

