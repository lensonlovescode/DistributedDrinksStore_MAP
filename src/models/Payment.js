import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  mpesaReceiptNumber: String,
  phoneNumber: String,
  amount: Number,
  status: String,
  transactionDate: { type: Date, default: Date.now }
});

export default mongoose.model("Payment", PaymentSchema);
