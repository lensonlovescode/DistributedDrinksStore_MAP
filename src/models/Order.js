import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  drink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  paid: {
    type: String,
    default: 'No',
  },
  checkoutRequestID: {
    type: String,
  },
  payment: {
    method: {
      type: String,
    },
    amount: {
      type: Number,
    },
    mpesaCode: {
      type: String,
    },
    phone: {
      type: String,
    },
    transactionDate: {
      type: String,
    },
  },
});

const Order = mongoose.model('Order', OrderSchema);

export default Order;
