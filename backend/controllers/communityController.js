import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Discussion from '../models/Discussion.js';
import Notification from '../models/Notification.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { sendNotification, broadcastDiscussionMessage } from '../utils/socket.js';

// Configure Cloudinary if credentials are present
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Helper: Calculate Reputation Level
export const getReputationLevel = (points) => {
  if (points <= 25) return 'Beginner';
  if (points <= 100) return 'Contributor';
  if (points <= 300) return 'Active Member';
  if (points <= 600) return 'Expert';
  return 'Community Leader';
};

// Helper: Award Reputation Points to a user
const adjustReputation = async (userId, pointsDiff) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.reputationPoints = Math.max(0, user.reputationPoints + pointsDiff);
      await user.save();
    }
  } catch (err) {
    console.error('Error adjusting reputation points:', err);
  }
};

// Helper: Create Community Notification (in Database + emit via Socket.io)
const triggerNotification = async (recipientId, senderId, title, message, type, relatedId) => {
  try {
    if (recipientId.toString() === senderId.toString()) return; // Don't notify self

    const notification = await Notification.create({
      userId: recipientId,
      senderId,
      title,
      message,
      type,
      relatedId,
    });

    // Populate sender details for live socket delivery
    const sender = await User.findById(senderId).select('fullName avatar');
    sendNotification(recipientId, 'new_notification', {
      ...notification.toJSON(),
      senderId: sender,
    });
  } catch (err) {
    console.error('Error triggering notification:', err);
  }
};

// Helper: Handle file uploads to Cloudinary/Local
const handleFileUpload = async (file, req) => {
  let fileUrl = '';
  let name = file.originalname;
  let fileType = file.mimetype.startsWith('image/') ? 'image' : file.mimetype === 'application/pdf' ? 'pdf' : 'document';

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
        folder: 'studentsphere/community',
      });
      fileUrl = result.secure_url;
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.error('Cloudinary community file upload error:', err);
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/community/${file.filename}`;
    }
  } else {
    fileUrl = `${req.protocol}://${req.get('host')}/uploads/community/${file.filename}`;
  }

  return { url: fileUrl, name, fileType };
};

// Helper: Cleanup community files
const cleanupFile = async (fileUrl) => {
  if (!fileUrl) return;

  if (process.env.CLOUDINARY_CLOUD_NAME && fileUrl.includes('cloudinary')) {
    try {
      const parts = fileUrl.split('/');
      const folderPartIndex = parts.indexOf('studentsphere');
      if (folderPartIndex !== -1) {
        const publicId = parts.slice(folderPartIndex).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.error('Cloudinary destroy community attachment error:', err);
    }
  } else {
    try {
      const filename = path.basename(fileUrl);
      const localPath = path.join('./uploads/community', filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (err) {
      console.error('Local community file cleanup error:', err);
    }
  }
};

// ==========================================
// 1. POSTS CONTROLLERS
// ==========================================

// @desc    Get all community posts
// @route   GET /api/community/posts
// @access  Private
export const getPosts = async (req, res, next) => {
  try {
    const { category, tag, search, userId, sort } = req.query;
    const query = { status: 'published' };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (userId) {
      query.userId = userId;
      query.isAnonymous = false; // Don't expose anonymous posts on a specific user's feed
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 }; // Default: latest
    if (sort === 'trending') {
      // Trending = Sum of Likes, Comments, and Views
      sortOption = { likesCount: -1, commentsCount: -1, views: -1 };
    } else if (sort === 'popular') {
      sortOption = { likesCount: -1 };
    } else if (sort === 'commented') {
      sortOption = { commentsCount: -1 };
    }

    const posts = await Post.find(query)
      .populate('userId', 'fullName avatar reputationPoints')
      .sort(sortOption);

    // Format posts to resolve reputation level for post authors
    const formattedPosts = posts.map(p => {
      const postObj = p.toObject();
      if (postObj.userId && !postObj.isAnonymous) {
        postObj.userId.reputationLevel = getReputationLevel(postObj.userId.reputationPoints || 0);
      }
      return postObj;
    });

    res.status(200).json({ success: true, data: formattedPosts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending posts list
// @route   GET /api/community/trending
// @access  Private
export const getTrendingPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('userId', 'fullName avatar')
      .sort({ likesCount: -1, commentsCount: -1, views: -1 })
      .limit(5);

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/community/posts/:id
// @access  Private
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'fullName avatar reputationPoints');

    if (!post) {
      res.status(404);
      throw new Error('Post not found.');
    }

    // Increment views
    post.views += 1;
    await post.save();

    const postObj = post.toObject();
    if (postObj.userId && !postObj.isAnonymous) {
      postObj.userId.reputationLevel = getReputationLevel(postObj.userId.reputationPoints || 0);
    }

    res.status(200).json({ success: true, data: postObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new community post
// @route   POST /api/community/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, content, category, tags, isAnonymous, status } = req.body;

    if (!title || !content || !category) {
      res.status(400);
      throw new Error('Title, content, and category are required.');
    }

    const attachments = [];
    if (req.file) {
      const attachment = await handleFileUpload(req.file, req);
      attachments.push(attachment);
    }

    const tagsArray = tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    const post = await Post.create({
      userId,
      title,
      content,
      category,
      tags: tagsArray,
      attachments,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      status: status || 'published',
    });

    // Award reputation points for posting
    if (status !== 'draft') {
      await adjustReputation(userId, 5); // +5 points
    }

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Update community post
// @route   PUT /api/community/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const post = await Post.findOne({ _id: req.params.id, userId });

    if (!post) {
      res.status(404);
      throw new Error('Post not found or unauthorized.');
    }

    const { title, content, category, tags, isAnonymous, status } = req.body;
    const originalStatus = post.status;

    if (req.file) {
      // Clear old attachments first
      for (const attachment of post.attachments) {
        await cleanupFile(attachment.url);
      }
      post.attachments = [];
      const attachment = await handleFileUpload(req.file, req);
      post.attachments.push(attachment);
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.isAnonymous = isAnonymous !== undefined ? (isAnonymous === 'true' || isAnonymous === true) : post.isAnonymous;
    post.status = status || post.status;

    if (tags) {
      post.tags = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    const updatedPost = await post.save();

    // Adjust points if transitioning from Draft to Published
    if (originalStatus === 'draft' && updatedPost.status === 'published') {
      await adjustReputation(userId, 5);
    }

    res.status(200).json({ success: true, data: updatedPost });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete community post
// @route   DELETE /api/community/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found.');
    }

    // Allow author or admin to delete post
    if (post.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this post.');
    }

    // Clean up attachments
    for (const attachment of post.attachments) {
      await cleanupFile(attachment.url);
    }

    // Clean up comments and likes
    await Comment.deleteMany({ postId: post._id });
    await Notification.deleteMany({ relatedId: post._id });

    // Deduct points from author
    if (post.status === 'published') {
      await adjustReputation(post.userId, -5);
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Pin a post (Admin Only)
// @route   PUT /api/community/posts/:id/pin
// @access  Private/Admin
export const pinPost = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Admin rights required.');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found.');
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. COMMENTS CONTROLLERS
// ==========================================

// @desc    Get comments for a post
// @route   GET /api/community/posts/:id/comments
// @access  Private
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .populate('userId', 'fullName avatar reputationPoints')
      .sort({ createdAt: 1 });

    const formattedComments = comments.map(c => {
      const commentObj = c.toObject();
      if (commentObj.userId && !commentObj.isAnonymous) {
        commentObj.userId.reputationLevel = getReputationLevel(commentObj.userId.reputationPoints || 0);
      }
      return commentObj;
    });

    res.status(200).json({ success: true, data: formattedComments });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new comment/reply
// @route   POST /api/community/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { postId, content, parentComment, isAnonymous } = req.body;

    if (!postId || !content) {
      res.status(400);
      throw new Error('Post ID and content are required.');
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error('Post not found.');
    }

    const comment = await Comment.create({
      postId,
      userId,
      content,
      parentComment: parentComment || null,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
    });

    // Increment post comments count
    post.commentsCount += 1;
    await post.save();

    // Award reputation points
    await adjustReputation(userId, 2); // +2 points for comment contribution

    // Send notifications
    const triggererName = comment.isAnonymous ? 'Anonymous' : req.user.fullName;
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent && parent.userId.toString() !== userId.toString()) {
        await triggerNotification(
          parent.userId,
          userId,
          'New reply on comment',
          `${triggererName} replied: "${content.substring(0, 30)}..."`,
          'reply',
          post._id
        );
      }
    } else {
      if (post.userId.toString() !== userId.toString()) {
        await triggerNotification(
          post.userId,
          userId,
          'New comment on post',
          `${triggererName} commented: "${content.substring(0, 30)}..."`,
          'comment',
          post._id
        );
      }
    }

    const commentData = await Comment.findById(comment._id).populate('userId', 'fullName avatar reputationPoints');
    res.status(201).json({ success: true, data: commentData });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/community/comments/:id
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404);
      throw new Error('Comment not found.');
    }

    if (comment.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this comment.');
    }

    // Decrement comments count from post
    const post = await Post.findById(comment.postId);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      await post.save();
    }

    // Deduct points
    await adjustReputation(comment.userId, -2);

    // Also delete any sub-replies that reference this comment as parent
    await Comment.deleteMany({ parentComment: comment._id });

    await comment.deleteOne();
    res.status(200).json({ success: true, message: 'Comment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. LIKES CONTROLLERS
// ==========================================

// @desc    Toggle post like status
// @route   POST /api/community/likes/post/:id
// @access  Private
export const togglePostLike = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found.');
    }

    const likeIndex = post.likes.indexOf(userId);
    let isLiked = false;

    if (likeIndex === -1) {
      // Like
      post.likes.push(userId);
      post.likesCount += 1;
      isLiked = true;

      // Award points to post author
      await adjustReputation(post.userId, 2);

      // Trigger notification
      const triggererName = req.user.fullName;
      await triggerNotification(
        post.userId,
        userId,
        'New post like',
        `${triggererName} liked your post "${post.title.substring(0, 20)}..."`,
        'like_post',
        post._id
      );
    } else {
      // Unlike
      post.likes.splice(likeIndex, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
      
      // Deduct points from author
      await adjustReputation(post.userId, -2);
    }

    await post.save();
    res.status(200).json({ success: true, isLiked, likesCount: post.likesCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle comment like status
// @route   POST /api/community/likes/comment/:id
// @access  Private
export const toggleCommentLike = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404);
      throw new Error('Comment not found.');
    }

    const likeIndex = comment.likes.indexOf(userId);
    let isLiked = false;

    if (likeIndex === -1) {
      comment.likes.push(userId);
      comment.likesCount += 1;
      isLiked = true;

      // Award points to comment author
      await adjustReputation(comment.userId, 1);

      // Trigger notification
      await triggerNotification(
        comment.userId,
        userId,
        'New comment like',
        `${req.user.fullName} liked your comment: "${comment.content.substring(0, 20)}..."`,
        'like_comment',
        comment.postId
      );
    } else {
      comment.likes.splice(likeIndex, 1);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
      
      await adjustReputation(comment.userId, -1);
    }

    await comment.save();
    res.status(200).json({ success: true, isLiked, likesCount: comment.likesCount });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. DISCUSSIONS CONTROLLERS
// ==========================================

// @desc    Get discussions
// @route   GET /api/community/discussions
// @access  Private
export const getDiscussions = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) {
      query.category = category;
    }

    const discussions = await Discussion.find(query)
      .populate('userId', 'fullName avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: discussions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single discussion details
// @route   GET /api/community/discussions/:id
// @access  Private
export const getDiscussionById = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('userId', 'fullName avatar')
      .populate('replies.userId', 'fullName avatar');

    if (!discussion) {
      res.status(404);
      throw new Error('Discussion thread not found.');
    }

    res.status(200).json({ success: true, data: discussion });
  } catch (error) {
    next(error);
  }
};

// @desc    Create discussion thread
// @route   POST /api/community/discussions
// @access  Private
export const createDiscussion = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      res.status(400);
      throw new Error('Title, content, and category are required.');
    }

    const discussion = await Discussion.create({
      userId,
      title,
      content,
      category,
      participants: [userId],
    });

    res.status(201).json({ success: true, data: discussion });
  } catch (error) {
    next(error);
  }
};

// @desc    Post reply in discussion thread
// @route   POST /api/community/discussions/:id/replies
// @access  Private
export const addDiscussionReply = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { content } = req.body;

    if (!content) {
      res.status(400);
      throw new Error('Content is required.');
    }

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      res.status(404);
      throw new Error('Discussion not found.');
    }

    const reply = {
      userId,
      content,
      createdAt: new Date(),
    };

    discussion.replies.push(reply);
    discussion.repliesCount += 1;
    
    // Add participant if not already added
    if (!discussion.participants.includes(userId)) {
      discussion.participants.push(userId);
    }

    await discussion.save();

    // Fetch the added reply with populated user details for immediate broadcast
    const updated = await Discussion.findById(discussion._id)
      .populate('replies.userId', 'fullName avatar');
    
    const addedReply = updated.replies[updated.replies.length - 1];

    // Award points
    await adjustReputation(userId, 2);

    // Broadcast messages to discussion sockets in real-time
    broadcastDiscussionMessage(discussion._id, addedReply);

    // Notify thread creator
    if (discussion.userId.toString() !== userId.toString()) {
      await triggerNotification(
        discussion.userId,
        userId,
        'New reply in discussion',
        `${req.user.fullName} replied to your thread: "${content.substring(0, 30)}..."`,
        'reply',
        discussion._id
      );
    }

    res.status(201).json({ success: true, data: addedReply });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete discussion
// @route   DELETE /api/community/discussions/:id
// @access  Private
export const deleteDiscussion = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      res.status(404);
      throw new Error('Discussion not found.');
    }

    if (discussion.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Unauthorized.');
    }

    await discussion.deleteOne();
    res.status(200).json({ success: true, message: 'Discussion deleted.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. NOTIFICATIONS CONTROLLERS
// ==========================================

// @desc    Get user notifications
// @route   GET /api/community/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('senderId', 'fullName avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/community/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. USER PROFILES CONTROLLERS
// ==========================================

// @desc    Get student profile detail
// @route   GET /api/community/profiles/:id
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      res.status(404);
      throw new Error('User profile not found.');
    }

    // Accumulate community counts
    const postsCount = await Post.countDocuments({ userId: user._id, status: 'published', isAnonymous: false });
    const commentsCount = await Comment.countDocuments({ userId: user._id, isAnonymous: false });
    const reputationLevel = getReputationLevel(user.reputationPoints || 0);

    const profileObj = user.toObject();
    profileObj.postsCount = postsCount;
    profileObj.commentsCount = commentsCount;
    profileObj.reputationLevel = reputationLevel;

    res.status(200).json({ success: true, data: profileObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow student
// @route   POST /api/community/profiles/:id/follow
// @access  Private
export const toggleFollow = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      res.status(400);
      throw new Error('You cannot follow yourself.');
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      res.status(404);
      throw new Error('User not found.');
    }

    const followIndex = currentUser.following.indexOf(targetUserId);
    let isFollowing = false;

    if (followIndex === -1) {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      isFollowing = true;

      // Award points for follower
      await adjustReputation(targetUserId, 5);

      // Trigger notification
      await triggerNotification(
        targetUserId,
        currentUserId,
        'New Follower',
        `${currentUser.fullName} is now following you.`,
        'announcement',
        currentUser._id
      );
    } else {
      // Unfollow
      currentUser.following.splice(followIndex, 1);
      const followerIndex = targetUser.followers.indexOf(currentUserId);
      if (followerIndex !== -1) {
        targetUser.followers.splice(followerIndex, 1);
      }
      await adjustReputation(targetUserId, -5);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ success: true, isFollowing });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. ANALYTICS CONTROLLERS
// ==========================================

// @desc    Get community statistics for graphs
// @route   GET /api/community/analytics
// @access  Private
export const getCommunityAnalytics = async (req, res, next) => {
  try {
    // 1. Posts count per category
    const categories = ['Academics', 'Programming', 'Placements', 'Internships', 'Career Guidance', 'General Discussion'];
    const postDistribution = await Promise.all(
      categories.map(async (cat) => {
        const count = await Post.countDocuments({ category: cat, status: 'published' });
        return { name: cat, value: count };
      })
    );

    // Filter categories with 0 posts if needed, or keep for visual spread
    const filteredPostDistribution = postDistribution.filter(item => item.value > 0);

    // 2. Active memberships growth
    // Create static/dynamic growth trends based on creation dates of posts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const growthTrend = await Promise.all(
      months.map(async (mName, index) => {
        const startDate = new Date(currentYear, index, 1);
        const endDate = new Date(currentYear, index + 1, 0, 23, 59, 59);

        // Count active contributors (users who posted or commented this month)
        const postUsers = await Post.distinct('userId', { createdAt: { $gte: startDate, $lte: endDate } });
        const commentUsers = await Comment.distinct('userId', { createdAt: { $gte: startDate, $lte: endDate } });
        const activeCount = new Set([...postUsers, ...commentUsers]).size;

        return { month: mName, activeUsers: activeCount || 1 }; // Fallback to 1 for graph display
      })
    );

    // 3. Overall statistics summary
    const totalPosts = await Post.countDocuments({ status: 'published' });
    const totalComments = await Comment.countDocuments();
    const totalDiscussions = await Discussion.countDocuments();
    const activeMembers = await User.countDocuments();

    // 4. Engagement stats array
    const totalLikes = await Post.aggregate([
      { $group: { _id: null, count: { $sum: '$likesCount' } } }
    ]);
    const likesSum = totalLikes.length > 0 ? totalLikes[0].count : 0;

    const engagementStats = [
      { name: 'Likes', count: likesSum },
      { name: 'Comments', count: totalComments },
      { name: 'Discussions', count: totalDiscussions }
    ];

    res.status(200).json({
      success: true,
      data: {
        totalPosts,
        totalComments,
        totalDiscussions,
        activeMembers,
        postDistribution: filteredPostDistribution.length > 0 ? filteredPostDistribution : [{ name: 'General', value: 1 }],
        growthTrend,
        engagementStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
