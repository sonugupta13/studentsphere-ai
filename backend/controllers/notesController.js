import Note from '../models/Note.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if credentials are present
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// @desc    Get user's notes with search and subject categories filter
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { search, subject } = req.query;

    const query = { userId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (subject) {
      query.subject = subject;
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload PDF notes file
// @route   POST /api/notes
// @access  Private
export const uploadNote = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, subject, description } = req.body;

    if (!title || !subject) {
      res.status(400);
      throw new Error('Title and subject category are required fields.');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a PDF note file.');
    }

    let fileUrl = '';
    let cloudinaryId = '';

    // Handle Cloudinary upload if configured, else fall back to local disk
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'auto',
          folder: 'studentsphere/notes',
        });
        fileUrl = result.secure_url;
        cloudinaryId = result.public_id;
        
        // Cleanup local temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.error('Cloudinary notes upload error:', err);
        // Local fallback if Cloudinary upload fails
        fileUrl = `${req.protocol}://${req.get('host')}/uploads/notes/${req.file.filename}`;
      }
    } else {
      // Local serving URL
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/notes/${req.file.filename}`;
    }

    const newNote = await Note.create({
      userId,
      title,
      subject,
      description,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      cloudinaryId,
    });

    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    // Cleanup upload files on errors
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete PDF notes file
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const note = await Note.findOne({ _id: req.params.id, userId });

    if (!note) {
      res.status(404);
      throw new Error('Note not found');
    }

    // Cleanup Cloudinary file or local file
    if (note.cloudinaryId && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        await cloudinary.uploader.destroy(note.cloudinaryId);
      } catch (err) {
        console.error('Cloudinary destroy notes error:', err);
      }
    } else {
      // Local cleanup
      const filename = path.basename(note.fileUrl);
      const localPath = path.join('./uploads/notes', filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await note.deleteOne();

    res.status(200).json({ success: true, message: 'Note deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique note subject categories
// @route   GET /api/notes/subjects
// @access  Private
export const getNoteSubjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const uniqueSubjects = await Note.distinct('subject', { userId });
    res.status(200).json({ success: true, data: uniqueSubjects });
  } catch (error) {
    next(error);
  }
};
