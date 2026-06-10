import mongoose from 'mongoose';

const codingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    problemsSolved: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    platformStats: {
      leetCode: { type: Number, default: 0 },
      hackerRank: { type: Number, default: 0 },
      codeChef: { type: Number, default: 0 },
    },
    weeklyActivity: {
      type: [Number], // submissions Mon-Sun, e.g. [3, 0, 4, 1, 2, 5, 0]
      default: [0, 0, 0, 0, 0, 0, 0],
    },
  },
  {
    timestamps: true,
  }
);

const CodingProgress = mongoose.model('CodingProgress', codingProgressSchema);
export default CodingProgress;
