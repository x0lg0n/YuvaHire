const express = require('express');
const { createJob, getJobsByCollege, getMyPostedJobs } = require('../controllers/jobController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.post('/', authMiddleware, requireRole('college_admin'), createJob);
router.get('/college/:collegeId', authMiddleware, requireRole('student'), getJobsByCollege);
router.get('/my-posted', authMiddleware, requireRole('college_admin'), getMyPostedJobs);

module.exports = router;

