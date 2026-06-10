import express from 'express';
import {
  getOverview,
  getAttendance,
  getExams,
  createExam,
  getAssignments,
  createAssignment,
  getInternships,
  createInternship,
  getPlacements,
  getCoding,
  getGoals,
  createGoal,
  toggleGoal,
  getAnalytics,
} from '../controllers/dashboardController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication shield globally on all dashboard routes
router.use(authenticateUser);

router.get('/overview', getOverview);
router.get('/attendance', getAttendance);
router.get('/analytics', getAnalytics);

router.route('/exams')
  .get(getExams)
  .post(createExam);

router.route('/assignments')
  .get(getAssignments)
  .post(createAssignment);

router.route('/internships')
  .get(getInternships)
  .post(createInternship);

router.get('/placements', getPlacements);
router.get('/coding', getCoding);

router.route('/goals')
  .get(getGoals)
  .post(createGoal);

router.put('/goals/:id', toggleGoal);

export default router;
