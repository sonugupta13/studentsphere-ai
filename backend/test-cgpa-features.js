import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Semester from './models/Semester.js';
import SubjectGrade from './models/SubjectGrade.js';
import AcademicGoal from './models/AcademicGoal.js';
import {
  getCGPAData,
  getOverview,
  getAnalytics,
  createSemester,
  updateSemester,
  deleteSemester,
  calculateCGPA,
  predictCGPA,
  fetchGoals,
  createGoal,
} from './controllers/cgpaController.js';

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
    console.log(`\nStarting CGPA Test Suite for User: ${user.fullName} (${user._id})`);

    const reqMock = {
      user,
    };

    // Clean up any existing semesters for this test user to keep test environment clean
    const preExistingSems = await Semester.find({ userId: user._id });
    const preExistingSemIds = preExistingSems.map(s => s._id);
    await SubjectGrade.deleteMany({ semesterId: { $in: preExistingSemIds } });
    await Semester.deleteMany({ userId: user._id });
    await AcademicGoal.deleteMany({ userId: user._id });

    // --- STEP 1: Add Semester 1 ---
    console.log('\n--- Step 1: Logging Semester 1 grades ---');
    const resAddSem1 = makeMockRes();
    const addSem1Req = {
      ...reqMock,
      body: {
        semesterNumber: 1,
        subjects: [
          { subjectName: 'Computer Science', subjectCode: 'CS-101', credits: 4, grade: 'O' }, // 4 * 10 = 40 points
          { subjectName: 'Mathematics', subjectCode: 'MA-102', credits: 4, grade: 'A' },    // 4 * 8 = 32 points
        ],
      },
    };

    await createSemester(addSem1Req, resAddSem1, nextMock);
    const sem1 = resAddSem1.jsonData.data;
    console.log(`✔ Semester 1 logged. GPA: ${sem1.semesterGPA} (Expected: 9)`);
    if (sem1.semesterGPA !== 9) {
      throw new Error(`GPA calculation mismatch. Got: ${sem1.semesterGPA}`);
    }

    // --- STEP 2: Add Semester 2 ---
    console.log('\n--- Step 2: Logging Semester 2 grades ---');
    const resAddSem2 = makeMockRes();
    const addSem2Req = {
      ...reqMock,
      body: {
        semesterNumber: 2,
        subjects: [
          { subjectName: 'Physics', subjectCode: 'PH-201', credits: 4, grade: 'B' }, // 4 * 6 = 24 points
        ],
      },
    };

    await createSemester(addSem2Req, resAddSem2, nextMock);
    const sem2 = resAddSem2.jsonData.data;
    console.log(`✔ Semester 2 logged. GPA: ${sem2.semesterGPA} (Expected: 6)`);

    // --- STEP 3: Verify Cumulative CGPA ---
    console.log('\n--- Step 3: Verifying Cumulative CGPA ---');
    const resFetch = makeMockRes();
    await getCGPAData(reqMock, resFetch, nextMock);
    const overallData = resFetch.jsonData.data;
    console.log(`✔ Cumulative CGPA: ${overallData.overallCGPA} (Expected: 8)`);
    console.log(`  Total Credits: ${overallData.totalCredits} (Expected: 12)`);
    if (overallData.overallCGPA !== 8) {
      throw new Error(`CGPA mismatch. Got: ${overallData.overallCGPA}`);
    }

    // --- STEP 4: Set Target Academic Goal ---
    console.log('\n--- Step 4: Setting target CGPA goal ---');
    const resGoal = makeMockRes();
    const goalReq = {
      ...reqMock,
      body: {
        targetCGPA: 8.5,
      },
    };
    await createGoal(goalReq, resGoal, nextMock);
    console.log(`✔ Goal created successfully. Target: ${resGoal.jsonData.data.targetCGPA}, Status: ${resGoal.jsonData.data.status}`);

    // --- STEP 5: CGPA Future Predictor ---
    console.log('\n--- Step 5: Running future GPA predictor ---');
    const resPredict = makeMockRes();
    const predictReq = {
      ...reqMock,
      body: {
        targetCGPA: 8.5, // Total credits would become 12 + 8 = 20. Total points needed: 8.5 * 20 = 170. Current points: 96. Required points: 74. Required GPA in future 8 credits: 74/8 = 9.25.
        expectedCredits: 8,
        remainingSemesters: 2,
      },
    };
    await predictCGPA(predictReq, resPredict, nextMock);
    const predResult = resPredict.jsonData.data;
    console.log(`✔ Predictor result: Required GPA in future semesters is: ${predResult.requiredGPA} (Expected: 9.25), Success Probability: ${predResult.probability}`);
    if (predResult.requiredGPA !== 9.25) {
      throw new Error(`GPA predictor math mismatch. Got: ${predResult.requiredGPA}`);
    }

    // --- STEP 6: What-If Grade Simulation ---
    console.log('\n--- Step 6: Running What-If Grade simulator ---');
    const resWhatIf = makeMockRes();
    const whatIfReq = {
      ...reqMock,
      body: {
        currentSemesters: [
          { totalCredits: 12, totalCreditPoints: 96 } // Current CGPA = 8.0
        ],
        projectedCourses: [
          { subjectName: 'Project Work', credits: 4, grade: 'O' } // 4 * 10 = 40 points. Total credits: 16, Points: 136. Projected CGPA: 136/16 = 8.5.
        ],
      },
    };
    await calculateCGPA(whatIfReq, resWhatIf, nextMock);
    const whatIfRes = resWhatIf.jsonData.data;
    console.log(`✔ What-if Projected CGPA: ${whatIfRes.projectedCGPA} (Expected: 8.5), Projected GPA: ${whatIfRes.projectedGPA} (Expected: 10)`);
    if (whatIfRes.projectedCGPA !== 8.5) {
      throw new Error(`What-if CGPA projection mismatch. Got: ${whatIfRes.projectedCGPA}`);
    }

    // --- STEP 7: Analytics Insights check ---
    console.log('\n--- Step 7: Verifying Analytics Insights ---');
    const resAnalytics = makeMockRes();
    await getAnalytics(reqMock, resAnalytics, nextMock);
    console.log(`✔ Insights:`);
    resAnalytics.jsonData.data.insights.forEach(ins => console.log(`  - ${ins}`));

    // --- STEP 8: Deleting Semester 2 & Cascading Check ---
    console.log('\n--- Step 8: Deleting Semester 2 and checking cascading ---');
    const resDelete = makeMockRes();
    const deleteReq = {
      ...reqMock,
      params: { id: sem2._id },
    };
    await deleteSemester(deleteReq, resDelete, nextMock);
    console.log(`✔ Delete response: ${resDelete.jsonData.message}`);

    // Check subjects database records for Semester 2
    const sem2GradesCount = await SubjectGrade.countDocuments({ semesterId: sem2._id });
    console.log(`✔ Subject grades for deleted Semester 2 remaining in database: ${sem2GradesCount} (Expected: 0)`);
    if (sem2GradesCount !== 0) {
      throw new Error('SubjectGrade cascading deletion failed.');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL CGPA CALCULATORS, PREDICTORS & GOALS SUCCESSFUL!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CGPA Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
