import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a note title'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject category name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'Please upload a PDF note file'],
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    cloudinaryId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model('Note', noteSchema);
export default Note;
