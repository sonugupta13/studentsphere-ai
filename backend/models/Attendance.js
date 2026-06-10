import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave'],
      required: [true, 'Please specify attendance status (Present, Absent, Leave)'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide class date'],
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records for the same subject on the same day for a user
attendanceSchema.index({ userId: 1, subjectId: 1, date: 1 }, { unique: false });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
