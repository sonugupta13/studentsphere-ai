import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a feedback subject'],
      trim: true,
    },
    feedbackType: {
      type: String,
      required: [true, 'Please select a feedback type'],
      enum: {
        values: ['Bug Report', 'Feature Request', 'Suggestion', 'Complaint', 'General Feedback'],
        message: '{VALUE} is not a valid feedback type',
      },
    },
    message: {
      type: String,
      required: [true, 'Please enter your feedback message'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'Reviewed', 'Resolved'],
      default: 'New',
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
