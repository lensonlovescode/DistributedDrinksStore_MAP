import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Customer", CustomerSchema);
