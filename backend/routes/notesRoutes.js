import express from 'express';
import {
  getNotes,
  uploadNote,
  deleteNote,
  getNoteSubjects,
} from '../controllers/notesController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { uploadNoteFile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Enforce auth check on all notes vault routes
router.use(authenticateUser);

router.route('/')
  .get(getNotes)
  .post(uploadNoteFile.single('file'), uploadNote);

router.get('/subjects', getNoteSubjects);

router.route('/:id')
  .delete(deleteNote);

export default router;
