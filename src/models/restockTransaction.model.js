const mongoose = require('mongoose');

const restockTransactionSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  items: [{
    drinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drink',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  restockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RestockTransaction', restockTransactionSchema);
