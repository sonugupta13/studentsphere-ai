import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import User from './models/User.js';
import Note from './models/Note.js';
import {
  getNotes,
  uploadNote,
  deleteNote,
  getNoteSubjects,
} from './controllers/notesController.js';

dotenv.config();

// Helper to create mocked Express response object
const makeMockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

// Error helper
const nextMock = (err) => {
  if (err) {
    console.error('Express Error Handler caught:', err);
    throw err;
  }
};

const runSuite = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentsphere');
    console.log('Connected.');

    const email = 'skg9199725658@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`Test User ${email} not found. Ensure DB is seeded.`);
      process.exit(1);
    }
    console.log(`\nStarting Test Suite for User: ${user.fullName} (${user._id})`);

    const reqMock = {
      user,
      protocol: 'http',
      get(name) {
        if (name === 'host') return 'localhost:5000';
        return '';
      }
    };

    // Make sure upload notes directory exists
    const notesDir = './uploads/notes';
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }

    // Write dummy notes files
    fs.writeFileSync('./uploads/notes/test-dbms-joins.pdf', 'pdf contents');
    fs.writeFileSync('./uploads/notes/test-math-algebra.pdf', 'pdf contents');

    // --- STEP 1: Upload Note 1 ---
    console.log('\n--- Step 1: Uploading Note 1 (DBMS Joins) ---');
    const resUpload1 = makeMockRes();
    const uploadReq1 = {
      ...reqMock,
      file: {
        fieldname: 'file',
        originalname: 'dbms_joins.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        destination: './uploads/notes',
        filename: 'test-dbms-joins.pdf',
        path: './uploads/notes/test-dbms-joins.pdf',
        size: 51200, // 50KB
      },
      body: {
        title: 'DBMS Joins Summary Notes',
        subject: 'Database Systems',
        description: 'Complete join queries and visual examples',
      },
    };
    await uploadNote(uploadReq1, resUpload1, nextMock);
    
    if (resUpload1.statusCode !== 201 || !resUpload1.jsonData.success) {
      throw new Error(`Failed to upload note 1, status: ${resUpload1.statusCode}`);
    }
    const note1 = resUpload1.jsonData.data;
    console.log(`✔ Note 1 uploaded successfully. ID: ${note1._id}, Url: ${note1.fileUrl}`);

    // --- STEP 2: Upload Note 2 ---
    console.log('\n--- Step 2: Uploading Note 2 (Linear Algebra) ---');
    const resUpload2 = makeMockRes();
    const uploadReq2 = {
      ...reqMock,
      file: {
        fieldname: 'file',
        originalname: 'linear_algebra.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        destination: './uploads/notes',
        filename: 'test-math-algebra.pdf',
        path: './uploads/notes/test-math-algebra.pdf',
        size: 81920, // 80KB
      },
      body: {
        title: 'Linear Algebra Cheat Sheet',
        subject: 'Mathematics',
        description: 'Eigenvalues, vectors, and projections summary',
      },
    };
    await uploadNote(uploadReq2, resUpload2, nextMock);
    
    if (resUpload2.statusCode !== 201 || !resUpload2.jsonData.success) {
      throw new Error(`Failed to upload note 2, status: ${resUpload2.statusCode}`);
    }
    const note2 = resUpload2.jsonData.data;
    console.log(`✔ Note 2 uploaded successfully. ID: ${note2._id}, Url: ${note2.fileUrl}`);

    // --- STEP 3: Query Notes List & Filter by Category ---
    console.log('\n--- Step 3: Querying Notes & Filtering by Subject ---');
    const resGetNotes = makeMockRes();
    await getNotes({
      ...reqMock,
      query: { subject: 'Database Systems' }
    }, resGetNotes, nextMock);

    const filteredNotes = resGetNotes.jsonData.data;
    console.log(`✔ Found ${filteredNotes.length} notes in Database Systems category.`);
    if (!filteredNotes.some(n => n._id.toString() === note1._id.toString())) {
      throw new Error('Note 1 not found in Database Systems query');
    }

    // --- STEP 4: Query Note categories (Subjects) ---
    console.log('\n--- Step 4: Querying Unique Subject Categories ---');
    const resGetCats = makeMockRes();
    await getNoteSubjects(reqMock, resGetCats, nextMock);
    const categoriesList = resGetCats.jsonData.data;
    console.log(`✔ Unique Categories found: ${categoriesList.join(', ')}`);
    if (!categoriesList.includes('Database Systems') || !categoriesList.includes('Mathematics')) {
      throw new Error('Aggregation failed to return subjects list');
    }

    // --- STEP 5: Delete Note 1 & Note 2 ---
    console.log('\n--- Step 5: Deleting notes and cleaning storage ---');
    const resDelete1 = makeMockRes();
    await deleteNote({
      ...reqMock,
      params: { id: note1._id }
    }, resDelete1, nextMock);
    console.log('✔ Note 1 document and file removed.');

    const resDelete2 = makeMockRes();
    await deleteNote({
      ...reqMock,
      params: { id: note2._id }
    }, resDelete2, nextMock);
    console.log('✔ Note 2 document and file removed.');

    // Confirm local files are deleted
    const file1Exists = fs.existsSync('./uploads/notes/test-dbms-joins.pdf');
    const file2Exists = fs.existsSync('./uploads/notes/test-math-algebra.pdf');
    console.log(`  DBMS Joins file exists on disk: ${file1Exists}`);
    console.log(`  Math Algebra file exists on disk: ${file2Exists}`);

    if (file1Exists || file2Exists) {
      throw new Error('Local files were not cleaned up after note deletion!');
    }
    console.log('✔ Storage cleanups confirmed.');

    console.log('\n======================================================');
    console.log('🎉 ALL NOTES VAULT CRUD & APIS TESTED SUCCESSFUL!');
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
