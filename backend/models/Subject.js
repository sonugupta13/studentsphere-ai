import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
    },
    subjectCode: {
      type: String,
      required: [true, 'Please provide a subject code'],
      trim: true,
    },
    facultyName: {
      type: String,
      required: [true, 'Please provide a faculty name'],
      trim: true,
    },
    totalClasses: {
      type: Number,
      required: true,
      default: 0,
    },
    attendedClasses: {
      type: Number,
      required: true,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
