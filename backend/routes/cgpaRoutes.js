import express from 'express';
import {
  getCGPAData,
  getOverview,
  getAnalytics,
  createSemester,
  updateSemester,
  deleteSemester,
  calculateCGPA,
  predictCGPA,
  fetchGoals,
  createGoal
} from '../controllers/cgpaController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce login session verification on all CGPA endpoints
router.use(authenticateUser);

router.route('/')
  .get(getCGPAData);

router.route('/overview')
  .get(getOverview);

router.route('/analytics')
  .get(getAnalytics);

router.route('/semester')
  .post(createSemester);

router.route('/semester/:id')
  .put(updateSemester)
  .delete(deleteSemester);

router.route('/calculate')
  .post(calculateCGPA);

router.route('/predict')
  .post(predictCGPA);

router.route('/goals')
  .get(fetchGoals)
  .post(createGoal);

export default router;
