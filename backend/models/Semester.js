import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    semesterNumber: {
      type: Number,
      required: [true, 'Please provide the semester number'],
      min: [1, 'Semester number must be at least 1'],
      max: [8, 'Semester number cannot exceed 8'],
    },
    semesterGPA: {
      type: Number,
      default: 0,
    },
    totalCredits: {
      type: Number,
      default: 0,
    },
    totalCreditPoints: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique semester per user
semesterSchema.index({ userId: 1, semesterNumber: 1 }, { unique: true });

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;
