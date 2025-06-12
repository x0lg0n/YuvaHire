const Application = require('../models/Application');
const Job = require('../models/Job');

const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const studentId = req.user.userId;
    if (!studentId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

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
      student: studentId,
      status: 'pending'
    });

    await application.populate([
      { path: 'job', select: 'title description location type college_name salary' },
      { path: 'student', select: 'username email' }
    ]);

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Application submission error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid application data' });
    }
    res.status(500).json({ message: 'Error submitting application. Please try again.' });
  }
};



const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { college_name } = req.user;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // First verify that this job belongs to the admin's college
    const job = await Job.findOne({ _id: jobId, college_name });
    if (!job) {
      return res.status(403).json({ message: 'Not authorized to view applications for this job' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('student', 'username email')
      .populate('job', 'title description location type college_name salary')
      .sort('-createdAt');

    res.json({ 
      applications,
      total: applications.length,
      job: {
        title: job.title,
        college: job.college_name
      }
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    res.status(500).json({ message: 'Error fetching applications. Please try again.' });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending, accepted, or rejected' });
    }

    const application = await Application.findById(applicationId)
      .populate('job', 'title college_name')
      .populate('student', 'username email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the admin belongs to the same college as the job
    if (application.job.college_name !== req.user.college_name) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Only update if status is actually different
    if (application.status === status) {
      return res.json({ 
        message: 'Application already has this status',
        application
      });
    }

    application.status = status;
    await application.save();

    res.json({ 
      message: `Application ${status} successfully`, 
      application,
      previousStatus: application.status
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid application ID format' });
    }
    res.status(500).json({ message: 'Error updating application status. Please try again.' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    if (!studentId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const applications = await Application.find({ student: studentId })
      .populate('job', 'title description location type college_name salary')
      .populate('student', 'username email')
      .sort('-createdAt');

    res.json({ 
      applications,
      total: applications.length
    });
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({ message: 'Error fetching your applications. Please try again.' });
  }
};

module.exports = { 
  applyToJob, 
  getMyApplications, 
  getJobApplications, 
  updateApplicationStatus 
};

