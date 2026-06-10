import express from 'express';
import {
  getPosts,
  getTrendingPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  pinPost,
  getComments,
  addComment,
  deleteComment,
  togglePostLike,
  toggleCommentLike,
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  addDiscussionReply,
  deleteDiscussion,
  getNotifications,
  markNotificationsRead,
  getUserProfile,
  toggleFollow,
  getCommunityAnalytics,
} from '../controllers/communityController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { uploadCommunityFile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Enforce authentication on all community routes
router.use(authenticateUser);

// Posts CRUD & filters
router.get('/posts', getPosts);
router.post('/posts', uploadCommunityFile.single('attachment'), createPost);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', uploadCommunityFile.single('attachment'), updatePost);
router.delete('/posts/:id', deletePost);
router.put('/posts/:id/pin', pinPost);

// Comments endpoints
router.get('/posts/:id/comments', getComments);
router.post('/comments', addComment);
router.delete('/comments/:id', deleteComment);

// Likes endpoints
router.post('/likes/post/:id', togglePostLike);
router.post('/likes/comment/:id', toggleCommentLike);

// Discussions endpoints
router.get('/discussions', getDiscussions);
router.post('/discussions', createDiscussion);
router.get('/discussions/:id', getDiscussionById);
router.delete('/discussions/:id', deleteDiscussion);
router.post('/discussions/:id/replies', addDiscussionReply);

// Profiles endpoints
router.get('/profiles/:id', getUserProfile);
router.post('/profiles/:id/follow', toggleFollow);

// Notifications endpoints
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);

// Analytics & trending
router.get('/trending', getTrendingPosts);
router.get('/analytics', getCommunityAnalytics);

export default router;
