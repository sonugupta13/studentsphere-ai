import mongoose from 'mongoose';

const codingLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['LeetCode', 'HackerRank', 'CodeChef', 'GeeksforGeeks', 'Codeforces', 'Other']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  problemsSolved: {
    type: Number,
    required: true,
    min: 1
  },
  timeSpent: {
    type: Number, // in minutes
    required: true,
    default: 0
  },
  topics: [{
    type: String
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const CodingLog = mongoose.model('CodingLog', codingLogSchema);
export default CodingLog;
