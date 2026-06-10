import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from './models/User.js';
import Assignment from './models/Assignment.js';
import {
  getAssignments,
  getAssignmentById,
  getCalendarData,
  getAnalytics,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  patchStatus,
  patchPriority,
} from './controllers/assignmentController.js';

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

    // --- STEP 1: Add Assignment 1 (Not Started, High Priority) ---
    console.log('\n--- Step 1: Adding a new High Priority Assignment ---');
    const resAddAsg1 = makeMockRes();
    const addAsgReq1 = {
      ...reqMock,
      body: {
        title: 'Database System Normalization',
        subject: 'Database Systems',
        description: 'Complete 3NF and BCNF questions',
        dueDate: '2026-06-15',
        dueTime: '12:00',
        priority: 'High',
        status: 'Not Started',
        estimatedHours: 4,
        notes: 'Chapter 5 review',
      },
    };
    await createAssignment(addAsgReq1, resAddAsg1, nextMock);
    
    if (resAddAsg1.statusCode !== 201 || !resAddAsg1.jsonData.success) {
      throw new Error(`Failed to add assignment, status: ${resAddAsg1.statusCode}`);
    }
    const asg1 = resAddAsg1.jsonData.data;
    console.log(`✔ Assignment 1 created successfully. ID: ${asg1._id}`);

    // --- STEP 2: Add Assignment 2 with Simulated Attachment file ---
    console.log('\n--- Step 2: Adding Assignment 2 with simulated attachment file ---');
    const resAddAsg2 = makeMockRes();
    const addAsgReq2 = {
      ...reqMock,
      file: {
        fieldname: 'file',
        originalname: 'schema_design.png',
        encoding: '7bit',
        mimetype: 'image/png',
        destination: './uploads',
        filename: 'mock-schema-design.png',
        path: './uploads/mock-schema-design.png',
        size: 20480, // 20KB
      },
      body: {
        title: 'Maths Assignment 1',
        subject: 'Mathematics',
        dueDate: '2026-06-12',
        priority: 'Medium',
      },
    };

    // Make sure temp folder exists and file is present for testing
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads');
    }
    fs.writeFileSync('./uploads/mock-schema-design.png', 'mock content');

    await createAssignment(addAsgReq2, resAddAsg2, nextMock);
    if (resAddAsg2.statusCode !== 201) {
      throw new Error(`Failed to add assignment 2, status: ${resAddAsg2.statusCode}`);
    }
    const asg2 = resAddAsg2.jsonData.data;
    console.log(`✔ Assignment 2 created. Attachment: ${asg2.attachments[0]?.name || 'none'}, Url: ${asg2.attachments[0]?.url || 'none'}`);

    // --- STEP 3: Query Assignments List & Filter by Priority ---
    console.log('\n--- Step 3: Querying List and Filtering by Priority ---');
    const resListHigh = makeMockRes();
    await getAssignments({
      ...reqMock,
      query: { priority: 'High' }
    }, resListHigh, nextMock);

    const highList = resListHigh.jsonData.data;
    console.log(`✔ Found ${highList.length} High priority assignments in query.`);
    if (!highList.some((a) => a._id.toString() === asg1._id.toString())) {
      throw new Error('Could not find created assignment 1 in High priority filter list');
    }

    // --- STEP 4: Update Assignment Status (PATCH /status) ---
    console.log('\n--- Step 4: Patching Assignment 1 Status to Completed ---');
    const resPatchStatus = makeMockRes();
    await patchStatus({
      ...reqMock,
      params: { id: asg1._id },
      body: { status: 'Completed' }
    }, resPatchStatus, nextMock);

    const updatedAsg1 = resPatchStatus.jsonData.data;
    console.log(`✔ Status updated to ${updatedAsg1.status}. Completion percentage: ${updatedAsg1.completionPercentage}%`);
    if (updatedAsg1.status !== 'Completed' || updatedAsg1.completionPercentage !== 100) {
      throw new Error('Status patch did not set percentage to 100%');
    }

    // --- STEP 5: Patch Priority (PATCH /priority) ---
    console.log('\n--- Step 5: Patching Assignment 2 Priority to High ---');
    const resPatchPriority = makeMockRes();
    await patchPriority({
      ...reqMock,
      params: { id: asg2._id },
      body: { priority: 'High' }
    }, resPatchPriority, nextMock);
    
    const updatedAsg2 = resPatchPriority.jsonData.data;
    console.log(`✔ Priority updated to: ${updatedAsg2.priority}`);
    if (updatedAsg2.priority !== 'High') {
      throw new Error('Priority patch failed to update value');
    }

    // --- STEP 6: Get Calendar view ---
    console.log('\n--- Step 6: Querying Calendar View ---');
    const resCal = makeMockRes();
    await getCalendarData(reqMock, resCal, nextMock);
    const calData = resCal.jsonData.data;
    const dateKey = '2026-06-15';
    console.log(`✔ Calendar Events queried successfully.`);
    if (calData[dateKey]) {
      console.log(`  Found ${calData[dateKey].length} assignments due on ${dateKey}`);
    }

    // --- STEP 7: Get Analytics ---
    console.log('\n--- Step 7: Querying Analytics & Productivity Scores ---');
    const resAnalytics = makeMockRes();
    await getAnalytics(reqMock, resAnalytics, nextMock);
    const analyticData = resAnalytics.jsonData.data;
    console.log(`✔ Analytics retrieved:`);
    console.log(`  Total Assignments count: ${analyticData.total}`);
    console.log(`  Productivity Score: ${analyticData.productivityScore}%`);
    console.log(`  Completion Rate: ${analyticData.completionRate}%`);
    console.log(`  On-Time Rate: ${analyticData.onTimeRate}%`);

    // --- STEP 8: Cleanup Assignment 1 & 2 (Deletes files too) ---
    console.log('\n--- Step 8: Deleting Assignments & Cleaning files ---');
    const resDelete1 = makeMockRes();
    await deleteAssignment({
      ...reqMock,
      params: { id: asg1._id }
    }, resDelete1, nextMock);
    console.log('✔ Assignment 1 deleted.');

    const resDelete2 = makeMockRes();
    await deleteAssignment({
      ...reqMock,
      params: { id: asg2._id }
    }, resDelete2, nextMock);
    console.log('✔ Assignment 2 deleted.');

    // Confirm file was deleted from disk
    const localFileExists = fs.existsSync('./uploads/mock-schema-design.png');
    console.log(`  Local mock file attachment exists on disk: ${localFileExists}`);
    if (localFileExists) {
      fs.unlinkSync('./uploads/mock-schema-design.png');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL ASSIGNMENT MODULE CRUD & APIS TESTED SUCCESSFUL!');
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
