const mongoose = require('mongoose');

const drinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Coke', 'Fanta', 'Sprite'],
    unique: true
  },
  price: {
    type: Number,
    required: true,
    default: 50
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Drink', drinkSchema);