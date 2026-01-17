import mongoose from "mongoose";

const BranchStockSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: Number,
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("BranchStock", BranchStockSchema);
