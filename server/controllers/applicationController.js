const Application = require('../models/Application');

const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const studentId = req.user.userId;

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      student: studentId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const application = await Application.create({
      job: jobId,
      student: studentId
    });

    await application.populate([
      { path: 'job', select: 'title description location' },
      { path: 'student', select: 'username' }
    ]);

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const applications = await Application.find({ student: studentId })
      .populate('job', 'title description location')
      .populate('student', 'username')
      .sort('-createdAt');

    res.json({ applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { applyToJob, getMyApplications };

