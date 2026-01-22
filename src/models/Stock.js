import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  }
});

StockSchema.index({ branch: 1, product: 1 }, { unique: true });

const Stock = mongoose.model('Stock', StockSchema);

export default Stock;
