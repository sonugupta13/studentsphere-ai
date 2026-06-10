import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an expense title'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an expense amount'],
      min: [0, 'Amount cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: {
        values: ['Food', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Utilities', 'Other'],
        message: '{VALUE} is not a supported category',
      },
    },
    subcategory: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Please provide a transaction date'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please specify payment method'],
      enum: {
        values: ['Cash', 'Card', 'UPI', 'Net Banking'],
        message: '{VALUE} is not a supported payment method',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
    },
    receiptName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
