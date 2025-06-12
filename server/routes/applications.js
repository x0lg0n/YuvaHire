const express = require('express');
const { 
  applyToJob, 
  getMyApplications, 
  getJobApplications,
  updateApplicationStatus 
} = require('../controllers/applicationController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Student routes
router.post('/', authMiddleware, requireRole('student'), applyToJob);
router.get('/my-applications', authMiddleware, requireRole('student'), getMyApplications);

// Admin routes
router.get('/job/:jobId', authMiddleware, requireRole('college_admin'), getJobApplications);
router.put('/:applicationId/status', authMiddleware, requireRole('college_admin'), updateApplicationStatus);

module.exports = router;

