import mongoose from 'mongoose';

const codingProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['LeetCode', 'HackerRank', 'CodeChef', 'GeeksforGeeks', 'Codeforces', 'Other']
  },
  username: {
    type: String,
    required: true
  },
  profileUrl: {
    type: String,
    required: true
  },
  totalSolved: {
    type: Number,
    default: 0
  },
  easySolved: {
    type: Number,
    default: 0
  },
  mediumSolved: {
    type: Number,
    default: 0
  },
  hardSolved: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const CodingProfile = mongoose.model('CodingProfile', codingProfileSchema);
export default CodingProfile;
