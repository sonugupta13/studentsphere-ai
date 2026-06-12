import express from 'express';
import {
  submitFeedback,
  getFeedbacks,
  deleteFeedback,
} from '../controllers/reviewController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authenticated user can submit feedback
router.post('/', authenticateUser, submitFeedback);

// Admin only actions
router.get('/', authenticateUser, authorizeRoles('admin'), getFeedbacks);
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteFeedback);

export default router;
