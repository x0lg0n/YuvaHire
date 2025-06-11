const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'college_admin'],
    default: 'student'
  },
  college_name: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  }
}, {
  timestamps: true
});

// Add static method to find user by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

const User = mongoose.model('User', userSchema);

module.exports = User;

