import express from 'express';
import {
  getSubjects,
  getOverview,
  getReports,
  getAnalytics,
  addSubject,
  updateSubject,
  deleteSubject,
  markAttendance,
  updateAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication on all attendance tracker APIs
router.use(authenticateUser);

router.route('/')
  .get(getSubjects);

router.get('/overview', getOverview);
router.get('/reports', getReports);
router.get('/analytics', getAnalytics);

router.route('/subject')
  .post(addSubject);

router.route('/subject/:id')
  .put(updateSubject)
  .delete(deleteSubject);

router.post('/mark', markAttendance);
router.put('/update/:id', updateAttendance);
router.delete('/delete/:id', deleteAttendance);

export default router;
