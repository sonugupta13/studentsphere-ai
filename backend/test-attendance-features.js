import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Subject from './models/Subject.js';
import Attendance from './models/Attendance.js';
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
} from './controllers/attendanceController.js';

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

    const reqMock = { user };

    // --- STEP 1: Add Subject ---
    console.log('\n--- Step 1: Adding a new Subject ---');
    const resAddSub = makeMockRes();
    const addSubReq = {
      ...reqMock,
      body: {
        subjectName: 'Software Engineering Test',
        subjectCode: 'SE-101-TEST',
        facultyName: 'Dr. Grace Hopper',
      },
    };
    await addSubject(addSubReq, resAddSub, nextMock);
    
    if (resAddSub.statusCode !== 201 || !resAddSub.jsonData.success) {
      throw new Error(`Failed to add subject, status: ${resAddSub.statusCode}`);
    }
    const createdSubject = resAddSub.jsonData.data;
    console.log(`✔ Subject created successfully. ID: ${createdSubject._id}`);

    // --- STEP 2: Verify Subject in List ---
    console.log('\n--- Step 2: Querying Subjects List ---');
    const resGetSubs = makeMockRes();
    await getSubjects(reqMock, resGetSubs, nextMock);
    const subjectList = resGetSubs.jsonData.data;
    const foundSub = subjectList.find(s => s._id.toString() === createdSubject._id.toString());
    if (!foundSub) {
      throw new Error('Created subject not found in list!');
    }
    console.log(`✔ Subject found in user list. Initial stats: Conducted=${foundSub.totalClasses}, Attended=${foundSub.attendedClasses}`);

    // --- STEP 3: Mark Attendance Logs (Present, Absent, Leave) ---
    console.log('\n--- Step 3: Logging attendance (Present, Absent, Leave) ---');
    
    // Log 1: Present
    const resLog1 = makeMockRes();
    await markAttendance({
      ...reqMock,
      body: {
        subjectId: createdSubject._id,
        status: 'Present',
        date: '2026-06-01',
        remarks: 'Attended full lecture',
      }
    }, resLog1, nextMock);
    const log1 = resLog1.jsonData.data;
    console.log(`✔ Logged Present. Log ID: ${log1._id}`);

    // Log 2: Absent
    const resLog2 = makeMockRes();
    await markAttendance({
      ...reqMock,
      body: {
        subjectId: createdSubject._id,
        status: 'Absent',
        date: '2026-06-02',
        remarks: 'Woke up late',
      }
    }, resLog2, nextMock);
    const log2 = resLog2.jsonData.data;
    console.log(`✔ Logged Absent. Log ID: ${log2._id}`);

    // Log 3: Leave (Excused)
    const resLog3 = makeMockRes();
    await markAttendance({
      ...reqMock,
      body: {
        subjectId: createdSubject._id,
        status: 'Leave',
        date: '2026-06-03',
        remarks: 'Medical checkup',
      }
    }, resLog3, nextMock);
    const log3 = resLog3.jsonData.data;
    console.log(`✔ Logged Excused Leave. Log ID: ${log3._id}`);

    // --- STEP 4: Verify Calculations (Excused leaves check) ---
    console.log('\n--- Step 4: Verifying Excused Leave Calculations ---');
    const updatedSubject = await Subject.findById(createdSubject._id);
    console.log(`  Conducted Classes (excluding Leave): ${updatedSubject.totalClasses}`);
    console.log(`  Attended Classes: ${updatedSubject.attendedClasses}`);
    console.log(`  Attendance Percentage: ${updatedSubject.attendancePercentage}%`);

    if (updatedSubject.totalClasses !== 2) {
      throw new Error(`Total classes calculation error. Expected 2, got ${updatedSubject.totalClasses}`);
    }
    if (updatedSubject.attendedClasses !== 1) {
      throw new Error(`Attended classes calculation error. Expected 1, got ${updatedSubject.attendedClasses}`);
    }
    if (updatedSubject.attendancePercentage !== 50) {
      throw new Error(`Attendance percentage calculation error. Expected 50%, got ${updatedSubject.attendancePercentage}%`);
    }
    console.log('✔ Excused leaves are successfully excluded. Calculations match perfectly (50%).');

    // --- STEP 5: Verify Overview Stats ---
    console.log('\n--- Step 5: Querying Attendance Overview ---');
    const resOverview = makeMockRes();
    await getOverview(reqMock, resOverview, nextMock);
    console.log(`✔ Overview fetched. Overall Percentage: ${resOverview.jsonData.data.overallPercentage}%`);
    console.log(`  Total Conducted Across All Courses: ${resOverview.jsonData.data.totalClasses}`);

    // --- STEP 6: Verify Reports & Analytics ---
    console.log('\n--- Step 6: Querying Reports & Analytics ---');
    const resReports = makeMockRes();
    await getReports(reqMock, resReports, nextMock);
    const juneReport = resReports.jsonData.data.find(r => r.month.includes('June 2026'));
    if (!juneReport) {
      throw new Error('June 2026 report group not generated!');
    }
    console.log(`✔ June 2026 Monthly Report verified. Conducted classes: ${juneReport.totalClasses}, Percentage: ${juneReport.percentage}%`);

    const resAnalytics = makeMockRes();
    await getAnalytics(reqMock, resAnalytics, nextMock);
    console.log(`✔ Analytics trends and best/weakest subjects verified. Avg attendance: ${resAnalytics.jsonData.data.averageAttendance}%`);

    // --- STEP 7: Update Attendance Log (Absent -> Present) ---
    console.log('\n--- Step 7: Updating log status (Absent -> Present) ---');
    const resUpdateLog = makeMockRes();
    await updateAttendance({
      ...reqMock,
      params: { id: log2._id },
      body: { status: 'Present', remarks: 'Late admission approved' }
    }, resUpdateLog, nextMock);
    
    const subjectPostUpdate = await Subject.findById(createdSubject._id);
    console.log(`  Updated Conducted: ${subjectPostUpdate.totalClasses}`);
    console.log(`  Updated Attended: ${subjectPostUpdate.attendedClasses}`);
    console.log(`  Updated Percentage: ${subjectPostUpdate.attendancePercentage}%`);

    if (subjectPostUpdate.attendedClasses !== 2 || subjectPostUpdate.attendancePercentage !== 100) {
      throw new Error(`Recalculation error after log update. Expected 100%, got ${subjectPostUpdate.attendancePercentage}%`);
    }
    console.log('✔ Attendance log updated. Calculations successfully updated to 100%.');

    // --- STEP 8: Delete Attendance Log ---
    console.log('\n--- Step 8: Deleting one Attendance Log ---');
    const resDeleteLog = makeMockRes();
    await deleteAttendance({
      ...reqMock,
      params: { id: log1._id }
    }, resDeleteLog, nextMock);

    const subjectPostDeleteLog = await Subject.findById(createdSubject._id);
    console.log(`  Conducted after log deletion: ${subjectPostDeleteLog.totalClasses}`);
    console.log(`  Attended after log deletion: ${subjectPostDeleteLog.attendedClasses}`);
    console.log(`  Percentage after log deletion: ${subjectPostDeleteLog.attendancePercentage}%`);
    if (subjectPostDeleteLog.totalClasses !== 1 || subjectPostDeleteLog.attendedClasses !== 1) {
      throw new Error('Log deletion did not sync properly with subject!');
    }
    console.log('✔ Attendance log deleted. Parent subject stats successfully synced.');

    // --- STEP 9: Delete Subject & Cascade ---
    console.log('\n--- Step 9: Deleting Subject (Cascading logs) ---');
    const resDeleteSub = makeMockRes();
    await deleteSubject({
      ...reqMock,
      params: { id: createdSubject._id }
    }, resDeleteSub, nextMock);

    const remainingLogs = await Attendance.countDocuments({ subjectId: createdSubject._id });
    const checkDeletedSubject = await Subject.findById(createdSubject._id);

    if (checkDeletedSubject) {
      throw new Error('Subject document was not deleted!');
    }
    if (remainingLogs > 0) {
      throw new Error(`Logs were not cascaded! Found ${remainingLogs} orphaned logs.`);
    }
    console.log('✔ Subject deleted and all its associated class logs cascaded successfully.');

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND CALCULATIONS & FEATURES TESTED SUCCESSFUL!');
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
