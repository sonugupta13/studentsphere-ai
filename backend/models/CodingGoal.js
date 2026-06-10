import mongoose from 'mongoose';

const codingGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goalTitle: {
    type: String,
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Failed'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const CodingGoal = mongoose.model('CodingGoal', codingGoalSchema);
export default CodingGoal;
