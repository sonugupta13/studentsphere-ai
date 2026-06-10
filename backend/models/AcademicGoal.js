import mongoose from 'mongoose';

const academicGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetCGPA: {
      type: Number,
      required: [true, 'Please specify target CGPA'],
      min: [0, 'Target CGPA must be at least 0'],
      max: [10, 'Target CGPA cannot exceed 10'],
    },
    targetDate: {
      type: Date,
    },
    currentProgress: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['In Progress', 'Achieved', 'Missed'],
      default: 'In Progress',
    },
  },
  {
    timestamps: true,
  }
);

const AcademicGoal = mongoose.model('AcademicGoal', academicGoalSchema);
export default AcademicGoal;
