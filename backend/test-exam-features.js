import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Exam from './models/Exam.js';
import StudyPlan from './models/StudyPlan.js';
import Revision from './models/Revision.js';
import {
  getExams,
  getExamById,
  getCalendarData,
  getAnalytics,
  createExam,
  updateExam,
  deleteExam,
  generateStudyPlan,
  generateRevisionPlan,
} from './controllers/examController.js';

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

    // Calculate dates: 10 days in the future
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 10);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // --- STEP 1: Add Exam ---
    console.log('\n--- Step 1: Creating a new Exam ---');
    const resAddExam = makeMockRes();
    const addExamReq = {
      ...reqMock,
      body: {
        examName: 'Physics End Sem Exam',
        subjectName: 'Physics',
        examType: 'End Semester',
        examDate: targetDateStr,
        examTime: '10:00',
        totalMarks: 100,
        duration: 180,
        syllabusTopics: [
          { topicName: 'Thermodynamics', completionStatus: 'Not Started', priorityLevel: 'High' },
          { topicName: 'Quantum Mechanics', completionStatus: 'In Progress', priorityLevel: 'High' },
          { topicName: 'Electromagnetism', completionStatus: 'Completed', priorityLevel: 'Medium' }
        ],
        notes: 'Review formula sheets.',
      },
    };
    await createExam(addExamReq, resAddExam, nextMock);

    if (resAddExam.statusCode !== 201 || !resAddExam.jsonData.success) {
      throw new Error(`Failed to create exam, status: ${resAddExam.statusCode}`);
    }
    const exam1 = resAddExam.jsonData.data;
    console.log(`✔ Exam created successfully. ID: ${exam1._id}, Prep Progress: ${exam1.preparationProgress}%`);

    // --- STEP 2: Query Exams List & Verify Countdown ---
    console.log('\n--- Step 2: Listing Exams & Verifying Countdown ---');
    const resList = makeMockRes();
    await getExams(reqMock, resList, nextMock);
    const examsList = resList.jsonData.data;
    const foundExam = examsList.find(e => e._id.toString() === exam1._id.toString());
    if (!foundExam) {
      throw new Error('Scheduled exam not found in user list!');
    }
    console.log(`✔ Exam found. Countdown ticker: Days remaining: ${foundExam.countdown.days}, Hours: ${foundExam.countdown.hours}`);

    // --- STEP 3: Generate Study Plan ---
    console.log('\n--- Step 3: Generating Smart Study Plan ---');
    const resGenPlan = makeMockRes();
    await generateStudyPlan({
      ...reqMock,
      body: {
        examId: exam1._id,
        difficulty: 'Hard',
        dailyHours: 4,
      }
    }, resGenPlan, nextMock);
    const studyPlans = resGenPlan.jsonData.data;
    console.log(`✔ Study plan generated successfully. Number of study sessions: ${studyPlans.length}`);
    if (studyPlans.length === 0) {
      throw new Error('Zero study sessions generated!');
    }

    // --- STEP 4: Generate Revision Plan ---
    console.log('\n--- Step 4: Generating Revision Plan (4 Levels) ---');
    const resGenRev = makeMockRes();
    await generateRevisionPlan({
      ...reqMock,
      body: { examId: exam1._id }
    }, resGenRev, nextMock);
    const revisions = resGenRev.jsonData.data;
    console.log(`✔ Revision levels generated: ${revisions.length} levels scheduled`);

    // --- STEP 5: Get Calendar View ---
    console.log('\n--- Step 5: Querying Calendar Events ---');
    const resCal = makeMockRes();
    await getCalendarData(reqMock, resCal, nextMock);
    const calendarEvents = resCal.jsonData.data;
    console.log(`✔ Calendar events successfully compiled. Total event logs: ${calendarEvents.length}`);

    // --- STEP 6: Get Analytics ---
    console.log('\n--- Step 6: Querying Analytics & Readiness Score ---');
    const resAnalytics = makeMockRes();
    await getAnalytics(reqMock, resAnalytics, nextMock);
    const analyticData = resAnalytics.jsonData.data;
    console.log(`✔ Analytics retrieved:`);
    console.log(`  Readiness Score: ${analyticData.readinessScore}%`);
    console.log(`  Preparation Level: ${analyticData.preparationLevel}`);
    console.log(`  Total Exams Tracked: ${analyticData.totalExams}`);

    // --- STEP 7: Delete Exam & Confirm Cascaded Cleanup ---
    console.log('\n--- Step 7: Deleting Exam & verifying Cascaded Cleanup ---');
    const resDelete = makeMockRes();
    await deleteExam({
      ...reqMock,
      params: { id: exam1._id }
    }, resDelete, nextMock);

    const remainingStudyPlans = await StudyPlan.countDocuments({ examId: exam1._id });
    const remainingRevisions = await Revision.countDocuments({ examId: exam1._id });
    const remainingExam = await Exam.findById(exam1._id);

    if (remainingExam) {
      throw new Error('Exam document was not deleted!');
    }
    if (remainingStudyPlans > 0 || remainingRevisions > 0) {
      throw new Error(`Cascaded cleanup failed! Leftover records: StudyPlans=${remainingStudyPlans}, Revisions=${remainingRevisions}`);
    }
    console.log('✔ Exam deleted and all associated Study Plans and Revision schedules cascaded successfully.');

    console.log('\n======================================================');
    console.log('🎉 ALL EXAMS PLANNERS CRUD & AI GENERATORS SUCCESSFUL!');
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
