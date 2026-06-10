import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    limit: {
      type: Number,
      required: [true, 'Please specify a budget limit'],
      min: [0, 'Limit cannot be negative'],
    },
    category: {
      type: String,
      required: true,
      default: 'All', // 'All' denotes overall monthly budget, or specific categories like 'Food', 'Travel' etc.
    },
    month: {
      type: String, // 'YYYY-MM' format, e.g., '2026-06'
      required: [true, 'Please specify a month in YYYY-MM format'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one budget setting per category per month
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
