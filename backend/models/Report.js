import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['Post', 'Comment'],
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'contentType',
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for reporting'],
      enum: ['Spam', 'Abuse', 'Fake Information', 'Offensive Content', 'Copyright Issue'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Resolved', 'Ignored'],
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;
