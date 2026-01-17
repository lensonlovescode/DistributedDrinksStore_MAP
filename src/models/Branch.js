import mongoose from "mongoose";

const BranchSchema = new mongoose.Schema({
  name: String,
  location: String,
  isHeadquarter: Boolean
});

export default mongoose.model("Branch", BranchSchema);
