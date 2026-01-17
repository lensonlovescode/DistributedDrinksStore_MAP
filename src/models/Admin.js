import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "admin"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Admin", adminSchema);
