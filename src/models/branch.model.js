const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    enum: ['Nairobi', 'Kisumu', 'Mombasa', 'Nakuru', 'Eldoret']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Branch', branchSchema);