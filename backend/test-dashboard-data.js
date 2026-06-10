import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Attendance from './models/Attendance.js';
import Exam from './models/Exam.js';
import Assignment from './models/Assignment.js';
import Internship from './models/Internship.js';
import Placement from './models/Placement.js';
import CodingProgress from './models/CodingProgress.js';
import Goal from './models/Goal.js';

dotenv.config();

const testDashboardData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentsphere');
    console.log('Connected to MongoDB for testing.');

    const email = 'skg9199725658@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found. Register first.`);
      process.exit(1);
    }

    console.log('\n================ DATABASE DIAGNOSTIC FOR USER ================');
    console.log(`User ID: ${user._id}`);
    console.log(`Name: ${user.fullName}`);
    console.log(`Role: ${user.role}`);
    console.log(`Provider: ${user.provider}`);

    // Query counts
    const attendanceCount = await Attendance.countDocuments({ userId: user._id });
    const examCount = await Exam.countDocuments({ userId: user._id });
    const assignmentCount = await Assignment.countDocuments({ userId: user._id });
    const internshipCount = await Internship.countDocuments({ userId: user._id });
    const placementCount = await Placement.countDocuments({ userId: user._id });
    const codingProgress = await CodingProgress.findOne({ userId: user._id });
    const goalCount = await Goal.countDocuments({ userId: user._id });

    console.log('\n--- Model Record Counts ---');
    console.log(`1. Attendance Records: ${attendanceCount} documents`);
    console.log(`2. Exam Records: ${examCount} documents`);
    console.log(`3. Assignment Records: ${assignmentCount} documents`);
    console.log(`4. Internship Applications: ${internshipCount} documents`);
    console.log(`5. Placement Pipelines: ${placementCount} companies`);
    console.log(`6. Daily Checklist Goals: ${goalCount} items`);
    
    console.log('\n--- Coding Progress Summary ---');
    if (codingProgress) {
      console.log(`   Streak: Current ${codingProgress.currentStreak} days | Longest ${codingProgress.longestStreak} days`);
      console.log(`   Problems Solved: Easy ${codingProgress.problemsSolved.easy} | Medium ${codingProgress.problemsSolved.medium} | Hard ${codingProgress.problemsSolved.hard}`);
      console.log(`   Submissions Activity: [${codingProgress.weeklyActivity.join(', ')}]`);
    } else {
      console.log('   No coding progress data document found.');
    }
    console.log('==============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
    process.exit(1);
  }
};

testDashboardData();
