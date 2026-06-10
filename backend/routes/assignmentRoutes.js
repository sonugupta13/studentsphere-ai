import express from 'express';
import {
  getAssignments,
  getAssignmentById,
  getCalendarData,
  getAnalytics,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  patchStatus,
  patchPriority,
} from '../controllers/assignmentController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Enforce authentication on all assignment tracker APIs
router.use(authenticateUser);

router.get('/calendar', getCalendarData);
router.get('/analytics', getAnalytics);

router.route('/')
  .get(getAssignments)
  .post(upload.single('file'), createAssignment);

router.route('/:id')
  .get(getAssignmentById)
  .put(upload.single('file'), updateAssignment)
  .delete(deleteAssignment);

router.patch('/status/:id', patchStatus);
router.patch('/priority/:id', patchPriority);

export default router;
