import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Recipient
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Triggerer
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['like_post', 'like_comment', 'comment', 'reply', 'mention', 'announcement'],
        message: '{VALUE} is not a valid notification type',
      },
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId, // Can refer to Post ID, Comment ID, or Discussion ID
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
