import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Subject from './models/Subject.js';
import Attendance from './models/Attendance.js';
import Exam from './models/Exam.js';
import Assignment from './models/Assignment.js';
import Internship from './models/Internship.js';
import Placement from './models/Placement.js';
import CodingProgress from './models/CodingProgress.js';
import Goal from './models/Goal.js';

dotenv.config();

const recalculateSubjectStats = async (subjectId) => {
  const logs = await Attendance.find({ subjectId });
  const totalClasses = logs.filter((l) => l.status === 'Present' || l.status === 'Absent').length;
  const attendedClasses = logs.filter((l) => l.status === 'Present').length;
  const attendancePercentage = totalClasses > 0 
    ? Math.round((attendedClasses / totalClasses) * 100) 
    : 0;

  await Subject.findByIdAndUpdate(subjectId, {
    totalClasses,
    attendedClasses,
    attendancePercentage,
  });
};

const resetAndSeed = async () => {
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

    // Delete existing records
    await Subject.deleteMany({ userId });
    await Attendance.deleteMany({ userId });
    await Exam.deleteMany({ userId });
    await Assignment.deleteMany({ userId });
    await Internship.deleteMany({ userId });
    await Placement.deleteMany({ userId });
    await CodingProgress.deleteMany({ userId });
    await Goal.deleteMany({ userId });

    console.log('Cleared existing records.');

    // 1. Seed Subjects
    const subjectsList = [
      { userId, subjectName: 'Computer Science', subjectCode: 'CS-301', facultyName: 'Dr. Jane Smith' },
      { userId, subjectName: 'Mathematics', subjectCode: 'MA-302', facultyName: 'Prof. Robert Miller' },
      { userId, subjectName: 'Physics', subjectCode: 'PH-303', facultyName: 'Dr. Alan Parker' },
      { userId, subjectName: 'Database Systems', subjectCode: 'DS-304', facultyName: 'Prof. Sarah Connor' },
    ];

    const insertedSubjects = await Subject.insertMany(subjectsList);
    console.log('Subjects seeded.');

    // 2. Generate daily logs over last 3 months (March, April, May 2026)
    const logs = [];
    const startDates = {
      March: new Date('2026-03-01'),
      April: new Date('2026-04-01'),
      May: new Date('2026-05-01'),
    };

    insertedSubjects.forEach((sub) => {
      // March logs (6 classes per subject, mostly Present)
      for (let i = 0; i < 6; i++) {
        const classDate = new Date(startDates.March);
        classDate.setDate(classDate.getDate() + i * 4); // Spread dates out
        
        logs.push({
          userId,
          subjectId: sub._id,
          status: 'Present',
          date: classDate,
          remarks: 'Standard Lecture',
        });
      }

      // April logs (7 classes: mix of Present, 1 Absent, 1 Leave)
      for (let i = 0; i < 7; i++) {
        const classDate = new Date(startDates.April);
        classDate.setDate(classDate.getDate() + i * 4);

        let status = 'Present';
        if (i === 2) status = 'Absent';
        if (i === 5) status = 'Leave';

        logs.push({
          userId,
          subjectId: sub._id,
          status,
          date: classDate,
          remarks: status === 'Leave' ? 'Excused medical leave' : status === 'Absent' ? 'Missed class' : 'Lecture log',
        });
      }

      // May logs (6 classes: 5 Present, 1 Absent)
      for (let i = 0; i < 6; i++) {
        const classDate = new Date(startDates.May);
        classDate.setDate(classDate.getDate() + i * 4);

        let status = 'Present';
        if (i === 4) status = 'Absent';

        logs.push({
          userId,
          subjectId: sub._id,
          status,
          date: classDate,
          remarks: 'Regular class session',
        });
      }
    });

    await Attendance.insertMany(logs);
    console.log(`Successfully generated ${logs.length} daily class attendance logs.`);

    // Recalculate stats for each subject
    for (const sub of insertedSubjects) {
      await recalculateSubjectStats(sub._id);
    }
    console.log('Recalculated subject stats successfully!');

    // Seed Exams
    const today = new Date();
    await Exam.insertMany([
      { userId, examName: 'Computer Science Final Exam', subjectName: 'Computer Science', examDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), examType: 'Final', preparationProgress: 75 },
      { userId, examName: 'Mathematics Midterm Exam', subjectName: 'Mathematics', examDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000), examType: 'Midterm', preparationProgress: 40 },
      { userId, examName: 'Physics Practical Exam', subjectName: 'Physics', examDate: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000), examType: 'Practical', preparationProgress: 20 },
    ]);

    // Seed Assignments
    await Assignment.insertMany([
      { userId, title: 'Database Query Optimization', subject: 'Database Systems', dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), status: 'pending', priority: 'high' },
      { userId, title: 'Physics Lab Report', subject: 'Physics', dueDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), status: 'pending', priority: 'medium' },
      { userId, title: 'Math Calculus Assignment 3', subject: 'Mathematics', dueDate: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000), status: 'pending', priority: 'low' },
      { userId, title: 'CS Ethics Essay', subject: 'Computer Science', dueDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), status: 'completed', priority: 'low' },
    ]);

    // Seed Internships
    await Internship.insertMany([
      { userId, role: 'Software Engineer Intern', company: 'Google', status: 'Under Review' },
      { userId, role: 'Product Manager Intern', company: 'Microsoft', status: 'Interview Scheduled' },
      { userId, role: 'Data Engineer Intern', company: 'Meta', status: 'Selected' },
      { userId, role: 'Security Analyst Intern', company: 'Netflix', status: 'Rejected' },
    ]);

    // Seed Placements
    await Placement.insertMany([
      { userId, company: 'Uber', role: 'Graduate Engineer', stage: 'Applied' },
      { userId, company: 'Stripe', role: 'Software Engineer', stage: 'Online Test' },
      { userId, company: 'Airbnb', role: 'Systems Analyst', stage: 'Interview' },
      { userId, company: 'Vercel', role: 'Frontend Engineer', stage: 'Offer' },
    ]);

    // Seed Coding Progress
    await CodingProgress.create({
      userId,
      currentStreak: 7,
      longestStreak: 24,
      problemsSolved: { easy: 45, medium: 32, hard: 12 },
      platformStats: { leetCode: 52, hackerRank: 25, codeChef: 12 },
      weeklyActivity: [2, 0, 5, 3, 1, 0, 4],
    });

    // Seed Goals
    await Goal.insertMany([
      { userId, title: 'Solve 3 LeetCode problems', completed: false },
      { userId, title: 'Submit DBMS project report', completed: false },
      { userId, title: 'Revise Math calculus notes', completed: true },
      { userId, title: '30-minute Pomodoro study session', completed: true },
    ]);

    console.log('Seeded database successfully for user!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

resetAndSeed();
