import express from 'express';
import {
  getCodingDashboard,
  getCodingAnalytics,
  addProfile,
  updateProfile,
  deleteProfile,
  addCodingLog,
  updateCodingLog,
  deleteCodingLog,
  addCodingGoal,
  updateCodingGoal,
  deleteCodingGoal
} from '../controllers/codingController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/dashboard', getCodingDashboard);
router.get('/analytics', getCodingAnalytics);

router.post('/profile', addProfile);
router.put('/profile/:id', updateProfile);
router.delete('/profile/:id', deleteProfile);

router.post('/log', addCodingLog);
router.put('/log/:id', updateCodingLog);
router.delete('/log/:id', deleteCodingLog);

router.post('/goal', addCodingGoal);
router.put('/goal/:id', updateCodingGoal);
router.delete('/goal/:id', deleteCodingGoal);

export default router;
