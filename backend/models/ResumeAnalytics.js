import mongoose from 'mongoose';

const resumeAnalyticsSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      unique: true, // One analytics breakdown per resume draft
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    keywordScore: {
      type: Number,
      default: 0,
    },
    formattingScore: {
      type: Number,
      default: 0,
    },
    readabilityScore: {
      type: Number,
      default: 0,
    },
    suggestions: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const ResumeAnalytics = mongoose.model('ResumeAnalytics', resumeAnalyticsSchema);
export default ResumeAnalytics;
