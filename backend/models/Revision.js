import mongoose from 'mongoose';

const revisionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    revisionLevel: {
      type: String,
      enum: ['First Revision', 'Second Revision', 'Third Revision', 'Final Revision'],
      required: true,
    },
    revisionDate: {
      type: Date,
      required: [true, 'Please provide a revision date'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

const Revision = mongoose.model('Revision', revisionSchema);
export default Revision;
