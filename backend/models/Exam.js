import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  topicName: {
    type: String,
    required: true,
    trim: true,
  },
  completionStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  priorityLevel: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
});

const examSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examName: {
      type: String,
      required: [true, 'Please provide an exam name'],
      trim: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
    },
    examType: {
      type: String,
      enum: [
        'Internal Exam', 'Mid Semester', 'End Semester', 'Practical Exam', 'Viva', 'Competitive Exam',
        'Midterm', 'Final', 'Quiz', 'Practical'
      ],
      default: 'Mid Semester',
    },
    examDate: {
      type: Date,
      required: [true, 'Please provide an exam date'],
    },
    examTime: {
      type: String,
      default: '10:00',
      trim: true,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    duration: {
      type: Number,
      default: 180, // Duration in minutes
    },
    syllabusTopics: {
      type: [topicSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    preparationProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    revisionStatus: {
      type: String,
      default: 'First Revision',
    },
  },
  {
    timestamps: true,
  }
);

// Backward Compatibility Virtuals
examSchema.virtual('date')
  .get(function () {
    return this.examDate;
  })
  .set(function (value) {
    this.examDate = value;
  });

examSchema.virtual('subject')
  .get(function () {
    return this.subjectName;
  })
  .set(function (value) {
    this.subjectName = value;
  });

examSchema.virtual('type')
  .get(function () {
    return this.examType;
  })
  .set(function (value) {
    this.examType = value;
  });

// Configure schemas to serialise virtuals
examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
