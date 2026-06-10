import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an assignment title'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date'],
    },
    dueTime: {
      type: String,
      default: '23:59',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'high', 'medium', 'low'],
      default: 'Medium',
      set: function (v) {
        if (!v) return v;
        return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      }
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Under Review', 'Completed', 'Overdue', 'pending', 'completed', 'not started', 'in progress', 'under review', 'overdue'],
      default: 'Not Started',
      set: function (v) {
        if (!v) return v;
        if (v === 'pending') return 'Not Started';
        const lower = v.toLowerCase();
        if (lower === 'completed') return 'Completed';
        if (lower === 'not started') return 'Not Started';
        if (lower === 'in progress') return 'In Progress';
        if (lower === 'under review') return 'Under Review';
        if (lower === 'overdue') return 'Overdue';
        return v;
      }
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add virtual field to check if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Completed') return false;
  const now = new Date();
  const due = new Date(this.dueDate);
  
  // Set time of due date based on dueTime (format HH:MM)
  if (this.dueTime) {
    const [hours, minutes] = this.dueTime.split(':');
    due.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
  }
  
  return now > due;
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
