import express from 'express';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  changeUserRole,
  getPosts,
  deletePost,
  getComments,
  deleteComment,
  getReports,
  updateReportStatus,
  createReport,
  getAnalytics,
  getActivityLogs,
} from '../controllers/adminController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly accessible to any authenticated user to file a report
router.post('/reports', authenticateUser, createReport);

// All other routes strictly require Admin role authorization
router.get('/dashboard', authenticateUser, authorizeRoles('admin'), getDashboardStats);
router.get('/users', authenticateUser, authorizeRoles('admin'), getUsers);
router.get('/users/:id', authenticateUser, authorizeRoles('admin'), getUserById);
router.put('/users/:id', authenticateUser, authorizeRoles('admin'), updateUser);
router.delete('/users/:id', authenticateUser, authorizeRoles('admin'), deleteUser);
router.patch('/users/block/:id', authenticateUser, authorizeRoles('admin'), blockUser);
router.patch('/users/unblock/:id', authenticateUser, authorizeRoles('admin'), unblockUser);
router.patch('/users/role/:id', authenticateUser, authorizeRoles('admin'), changeUserRole);

router.get('/posts', authenticateUser, authorizeRoles('admin'), getPosts);
router.delete('/posts/:id', authenticateUser, authorizeRoles('admin'), deletePost);

router.get('/comments', authenticateUser, authorizeRoles('admin'), getComments);
router.delete('/comments/:id', authenticateUser, authorizeRoles('admin'), deleteComment);

router.get('/reports', authenticateUser, authorizeRoles('admin'), getReports);
router.patch('/reports/:id', authenticateUser, authorizeRoles('admin'), updateReportStatus);

router.get('/analytics', authenticateUser, authorizeRoles('admin'), getAnalytics);
router.get('/activity-logs', authenticateUser, authorizeRoles('admin'), getActivityLogs);

export default router;
