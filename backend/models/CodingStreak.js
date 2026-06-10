import mongoose from 'mongoose';

const codingStreakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  totalActiveDays: {
    type: Number,
    default: 0
  },
  lastCodingDate: {
    type: Date
  }
}, {
  timestamps: true
});

const CodingStreak = mongoose.model('CodingStreak', codingStreakSchema);
export default CodingStreak;
