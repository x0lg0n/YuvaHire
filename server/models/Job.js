const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  deadline: {
    type: String,
    required: true
  },
  college_name: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    required: true
  },
  requirements: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;

