import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Subject from './models/Subject.js';
import Attendance from './models/Attendance.js';

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

const seedAttendance = async () => {
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
    console.log('Cleared existing subject & attendance log entries.');

    // 1. Create Subjects
    const subjectsList = [
      { userId, subjectName: 'Computer Science', subjectCode: 'CS-301', facultyName: 'Dr. Jane Smith' },
      { userId, subjectName: 'Mathematics', subjectCode: 'MA-302', facultyName: 'Prof. Robert Miller' },
      { userId, subjectName: 'Physics', subjectCode: 'PH-303', facultyName: 'Dr. Alan Parker' },
      { userId, subjectName: 'Database Systems', subjectCode: 'DS-304', facultyName: 'Prof. Sarah Connor' },
    ];

    const insertedSubjects = await Subject.insertMany(subjectsList);
    console.log('Subjects created.');

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

    // 3. Recalculate stats for each subject
    for (const sub of insertedSubjects) {
      await recalculateSubjectStats(sub._id);
    }
    console.log('Recalculated subject stats successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding attendance:', error.message);
    process.exit(1);
  }
};

seedAttendance();
