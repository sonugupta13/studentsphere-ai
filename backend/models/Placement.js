import mongoose from 'mongoose';

const placementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Please provide a job role'],
      trim: true,
    },
    stage: {
      type: String,
      enum: ['Applied', 'Online Test', 'Interview', 'Offer'],
      default: 'Applied',
    },
    status: {
      type: String,
      enum: ['active', 'rejected', 'selected'],
      default: 'active',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Placement = mongoose.model('Placement', placementSchema);
export default Placement;
