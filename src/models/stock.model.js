const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  drinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drink',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure one stock record per branch-drink combination
stockSchema.index({ branchId: 1, drinkId: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);