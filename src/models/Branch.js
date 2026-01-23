import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  isHQ: {
    type: Boolean,
    default: false
  }
});

const Branch = mongoose.model('Branch', BranchSchema);

export default Branch;
