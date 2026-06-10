import express from 'express';
import {
  getExams,
  getExamById,
  getCalendarData,
  getAnalytics,
  createExam,
  updateExam,
  deleteExam,
  generateStudyPlan,
  generateRevisionPlan,
} from '../controllers/examController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce auth verification on all exam planner routes
router.use(authenticateUser);

router.get('/calendar', getCalendarData);
router.get('/analytics', getAnalytics);

router.post('/generate-study-plan', generateStudyPlan);
router.post('/generate-revision-plan', generateRevisionPlan);

router.route('/')
  .get(getExams)
  .post(createExam);

router.route('/:id')
  .get(getExamById)
  .put(updateExam)
  .delete(deleteExam);

export default router;
