import express from 'express';
import {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  duplicateResume,
  calculateATS,
  generateAISummary
} from '../controllers/resumeController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce login session verification on all resume endpoints
router.use(authenticateUser);

router.route('/')
  .get(getResumes)
  .post(createResume);

router.route('/duplicate')
  .post(duplicateResume);

router.route('/ats-score')
  .post(calculateATS);

router.route('/ai-summary')
  .post(generateAISummary);

router.route('/:id')
  .get(getResumeById)
  .put(updateResume)
  .delete(deleteResume);

export default router;
