import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Subject from './models/Subject.js';
import Attendance from './models/Attendance.js';

dotenv.config();

const testAttendanceData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentsphere');
    console.log('Connected to MongoDB.');

    const email = 'skg9199725658@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User ${email} not found.`);
      process.exit(1);
    }

    const userId = user._id;
    const subjects = await Subject.find({ userId });
    const totalLogs = await Attendance.countDocuments({ userId });

    console.log('\n================ ATTENDANCE MODULE DIAGNOSTIC ================');
    console.log(`User: ${user.fullName} (${user.email})`);
    console.log(`Total Subjects: ${subjects.length} registered`);
    console.log(`Total Attendance Log Entries: ${totalLogs} logged classes`);

    console.log('\n--- Subject Stats Breakdown ---');
    subjects.forEach((sub) => {
      console.log(`- Course: ${sub.subjectName} (${sub.subjectCode})`);
      console.log(`  Faculty: ${sub.facultyName}`);
      console.log(`  Conducted: ${sub.totalClasses} | Attended: ${sub.attendedClasses} | Attendance Rate: ${sub.attendancePercentage}%`);
    });
    console.log('==============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
    process.exit(1);
  }
};

testAttendanceData();
