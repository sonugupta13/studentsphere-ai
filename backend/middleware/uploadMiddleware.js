import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed formats: PDF, DOC, DOCX, JPG, PNG`), false);
  }
};

// Multer limits: 10MB
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// PDF specific configuration for Notes Vault
const notesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/notes';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `note-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const notesFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF note documents are allowed in the notes vault.'), false);
  }
};

export const uploadNoteFile = multer({
  storage: notesStorage,
  fileFilter: notesFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB PDF limit
  },
});

// Receipts configuration for Expense Tracker
const receiptsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/receipts';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const receiptsFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, or PDF files are allowed for receipts.'), false);
  }
};

export const uploadReceiptFile = multer({
  storage: receiptsStorage,
  fileFilter: receiptsFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Community attachments configuration
const communityStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/community';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `community-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const communityFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format not supported. Allowed formats: JPG, PNG, PDF, Word, Excel.'), false);
  }
};

export const uploadCommunityFile = multer({
  storage: communityStorage,
  fileFilter: communityFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
});


