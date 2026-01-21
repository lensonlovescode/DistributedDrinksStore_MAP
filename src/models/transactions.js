import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  mpesaReceiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\d{10,15}$/, "Please provide a valid phone number"]
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, "Amount must be greater than 0"]
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled"],
    default: "pending",
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["mpesa", "cash", "card"],
    required: true
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model("Payment", PaymentSchema);
