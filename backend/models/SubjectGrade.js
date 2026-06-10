import mongoose from 'mongoose';

const subjectGradeSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Please provide the subject name'],
      trim: true,
    },
    subjectCode: {
      type: String,
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, 'Please provide subject credits'],
      min: [1, 'Credits must be at least 1'],
    },
    grade: {
      type: String,
      required: [true, 'Please specify the grade obtained'],
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F'],
    },
    gradePoint: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-fill gradePoint based on grade before validation
subjectGradeSchema.pre('validate', function (next) {
  const gradeMap = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'F': 0,
  };
  
  if (this.grade && gradeMap[this.grade] !== undefined) {
    this.gradePoint = gradeMap[this.grade];
  }
  next();
});

const SubjectGrade = mongoose.model('SubjectGrade', subjectGradeSchema);
export default SubjectGrade;
