const Job = require('../models/Job');

const createJob = async (req, res) => {
  try {
    const { title, description, location, salary, type, requirements, deadline } = req.body;
    const college_name = req.user.college_name;

    const job = await Job.create({
      title,
      description,
      location,
      salary,
      type,
      requirements,
      college_name,
      deadline
    });

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getJobsByCollege = async (req, res) => {
  try {
    const { college_name } = req.user;
    
    if (!college_name) {
      return res.status(400).json({ message: 'No college associated with user' });
    }

    const jobs = await Job.find({ college_name }).sort('-createdAt');
    res.json({ jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyPostedJobs = async (req, res) => {
  try {
    const { college_name } = req.user;
    
    if (!college_name) {
      return res.status(400).json({ message: 'No college associated with user' });
    }

    const jobs = await Job.find({ college_name }).sort('-createdAt');
    res.json({ jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createJob, getJobsByCollege, getMyPostedJobs };

