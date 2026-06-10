import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Discussion Creator / Moderator
    },
    title: {
      type: String,
      required: [true, 'Please provide discussion title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide discussion topic introduction'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: {
        values: ['Exam', 'Placement', 'Coding', 'College', 'General'],
        message: '{VALUE} is not a valid category',
      },
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Discussion = mongoose.model('Discussion', discussionSchema);
export default Discussion;
