import express from 'express';
import {
  getReviews,
  getFeaturedReviews,
  getReviewStats,
  submitReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  getMyReview,
} from '../controllers/reviewController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getReviews);
router.get('/featured', getFeaturedReviews);
router.get('/stats', getReviewStats);

// Authenticated user routes
router.get('/my-review', authenticateUser, getMyReview);
router.post('/', authenticateUser, submitReview);
router.put('/:id', authenticateUser, updateReview);
router.delete('/:id', authenticateUser, deleteReview);
router.post('/helpful/:id', authenticateUser, toggleHelpful);

export default router;
