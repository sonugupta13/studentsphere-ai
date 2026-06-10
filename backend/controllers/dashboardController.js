import Attendance from '../models/Attendance.js';
import Exam from '../models/Exam.js';
import Assignment from '../models/Assignment.js';
import Internship from '../models/Internship.js';
import Placement from '../models/Placement.js';
import CodingProgress from '../models/CodingProgress.js';
import Goal from '../models/Goal.js';

// Helper to seed data if a user is completely new
const ensureSeededData = async (userId) => {
  // Check if attendance exists
  const attendanceCount = await Attendance.countDocuments({ userId });
  if (attendanceCount === 0) {
    // Seed Attendance
    await Attendance.insertMany([
      { userId, subject: 'Computer Science', attended: 48, total: 52 },
      { userId, subject: 'Mathematics', attended: 42, total: 50 },
      { userId, subject: 'Physics', attended: 36, total: 45 },
      { userId, subject: 'Database Systems', attended: 32, total: 40 },
    ]);

    // Seed Exams
    const today = new Date();
    await Exam.insertMany([
      { userId, subject: 'Computer Science', date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), type: 'Final', preparationProgress: 75, priority: 'high' },
      { userId, subject: 'Mathematics', date: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000), type: 'Midterm', preparationProgress: 40, priority: 'medium' },
      { userId, subject: 'Physics', date: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000), type: 'Practical', preparationProgress: 20, priority: 'low' },
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

    // Seed Coding Progress (Safe findOneAndUpdate upsert)
    await CodingProgress.findOneAndUpdate(
      { userId },
      {
        currentStreak: 7,
        longestStreak: 24,
        problemsSolved: { easy: 45, medium: 32, hard: 12 },
        platformStats: { leetCode: 52, hackerRank: 25, codeChef: 12 },
        weeklyActivity: [2, 0, 5, 3, 1, 0, 4],
      },
      { upsert: true, new: true }
    );

    // Seed Goals
    await Goal.insertMany([
      { userId, title: 'Solve 3 LeetCode problems', completed: false },
      { userId, title: 'Submit DBMS project report', completed: false },
      { userId, title: 'Revise Math calculus notes', completed: true },
      { userId, title: '30-minute Pomodoro study session', completed: true },
    ]);
  }
};

// @desc    Get dashboard overview metrics
// @route   GET /api/dashboard/overview
// @access  Private
export const getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await ensureSeededData(userId);

    // 1. Attendance percentage aggregation
    const attendance = await Attendance.find({ userId });
    let totalAttended = 0;
    let totalClasses = 0;
    attendance.forEach((att) => {
      totalAttended += att.attended;
      totalClasses += att.total;
    });
    const attendancePercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    // 2. Upcoming Exams count & nearest exam date
    const exams = await Exam.find({ userId }).sort({ date: 1 });
    const upcomingExamsCount = exams.length;
    const nearestExamDate = exams[0] ? exams[0].date : null;

    // 3. Pending Assignments
    const pendingAssignmentsCount = await Assignment.countDocuments({ userId, status: 'pending' });

    // 4. Internship Applications
    const internships = await Internship.find({ userId });
    const internshipStats = {
      total: internships.length,
      applied: internships.filter((i) => i.status === 'Applied').length,
      underReview: internships.filter((i) => i.status === 'Under Review').length,
      interviewScheduled: internships.filter((i) => i.status === 'Interview Scheduled').length,
      rejected: internships.filter((i) => i.status === 'Rejected').length,
      selected: internships.filter((i) => i.status === 'Selected').length,
    };

    // 5. Placements
    const placements = await Placement.find({ userId });
    const placementStats = {
      companiesApplied: placements.length,
      onlineTests: placements.filter((p) => p.stage !== 'Applied').length,
      interviewsScheduled: placements.filter((p) => p.stage === 'Interview' || p.stage === 'Offer').length,
      offersReceived: placements.filter((p) => p.stage === 'Offer').length,
    };

    // 6. Coding progress
    const coding = await CodingProgress.findOne({ userId });

    // 7. Goals
    const goals = await Goal.find({ userId });
    const completedGoals = goals.filter((g) => g.completed).length;
    const totalGoals = goals.length;
    const goalsCompletionPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        attendance: {
          percentage: attendancePercentage,
          status: attendancePercentage >= 75 ? 'Excellent' : 'Needs Improvement',
          color: attendancePercentage >= 75 ? 'emerald' : 'rose',
        },
        exams: {
          count: upcomingExamsCount,
          nearestDate: nearestExamDate,
        },
        assignments: {
          pendingCount: pendingAssignmentsCount,
        },
        internships: internshipStats,
        placements: placementStats,
        coding: {
          currentStreak: coding ? coding.currentStreak : 0,
          longestStreak: coding ? coding.longestStreak : 0,
          totalSolved: coding ? (coding.problemsSolved.easy + coding.problemsSolved.medium + coding.problemsSolved.hard) : 0,
        },
        goals: {
          completed: completedGoals,
          total: totalGoals,
          percentage: goalsCompletionPercentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subject-wise attendance list
// @route   GET /api/dashboard/attendance
// @access  Private
export const getAttendance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const attendance = await Attendance.find({ userId });
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming exams
// @route   GET /api/dashboard/exams
// @access  Private
export const getExams = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const exams = await Exam.find({ userId }).sort({ date: 1 });
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new exam
// @route   POST /api/dashboard/exams
// @access  Private
export const createExam = async (req, res, next) => {
  try {
    const { subject, date, type, preparationProgress, priority } = req.body;
    if (!subject || !date) {
      res.status(400);
      throw new Error('Please enter subject and date');
    }

    const exam = await Exam.create({
      userId: req.user._id,
      subject,
      date,
      type,
      preparationProgress,
      priority,
    });

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignments
// @route   GET /api/dashboard/assignments
// @access  Private
export const getAssignments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const assignments = await Assignment.find({ userId }).sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new assignment
// @route   POST /api/dashboard/assignments
// @access  Private
export const createAssignment = async (req, res, next) => {
  try {
    const { title, subject, dueDate, priority } = req.body;
    if (!title || !subject || !dueDate) {
      res.status(400);
      throw new Error('Please fill in all fields');
    }

    const assignment = await Assignment.create({
      userId: req.user._id,
      title,
      subject,
      dueDate,
      priority,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get internships list
// @route   GET /api/dashboard/internships
// @access  Private
export const getInternships = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const internships = await Internship.find({ userId }).sort({ appliedDate: -1 });
    res.status(200).json({ success: true, data: internships });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new internship application
// @route   POST /api/dashboard/internships
// @access  Private
export const createInternship = async (req, res, next) => {
  try {
    const { role, company, status } = req.body;
    if (!role || !company) {
      res.status(400);
      throw new Error('Please provide role and company name');
    }

    const internship = await Internship.create({
      userId: req.user._id,
      role,
      company,
      status,
    });

    res.status(201).json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// @desc    Get placement journey list
// @route   GET /api/dashboard/placements
// @access  Private
export const getPlacements = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const placements = await Placement.find({ userId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: placements });
  } catch (error) {
    next(error);
  }
};

// @desc    Get coding streak and problems solved details
// @route   GET /api/dashboard/coding
// @access  Private
export const getCoding = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let coding = await CodingProgress.findOne({ userId });
    
    if (!coding) {
      coding = await CodingProgress.create({ userId });
    }
    
    res.status(200).json({ success: true, data: coding });
  } catch (error) {
    next(error);
  }
};

// @desc    Get goals list
// @route   GET /api/dashboard/goals
// @access  Private
export const getGoals = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const goals = await Goal.find({ userId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a daily goal task
// @route   POST /api/dashboard/goals
// @access  Private
export const createGoal = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) {
      res.status(400);
      throw new Error('Please provide a goal description');
    }

    const goal = await Goal.create({
      userId: req.user._id,
      title,
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle goal completion status
// @route   PUT /api/dashboard/goals/:id
// @access  Private
export const toggleGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      res.status(404);
      throw new Error('Goal not found');
    }

    goal.completed = !goal.completed;
    await goal.save();

    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Get charting data for multiple dashboard sections
// @route   GET /api/dashboard/analytics
// @access  Private
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Monthly attendance mock trend (re-maps subject data over historical months)
    const monthlyAttendance = [
      { month: 'Jan', percentage: 78 },
      { month: 'Feb', percentage: 80 },
      { month: 'Mar', percentage: 85 },
      { month: 'Apr', percentage: 82 },
      { month: 'May', percentage: 88 },
      { month: 'Jun', percentage: 86 },
    ];

    // Subject-wise attendance details
    const attendance = await Attendance.find({ userId });
    const subjectAttendance = attendance.map((a) => ({
      name: a.subject,
      percentage: a.total > 0 ? Math.round((a.attended / a.total) * 100) : 0,
    }));

    // Assignments stats
    const totalAssignments = await Assignment.countDocuments({ userId });
    const completedAssignments = await Assignment.countDocuments({ userId, status: 'completed' });
    const assignmentStats = [
      { name: 'Completed', value: completedAssignments },
      { name: 'Pending', value: Math.max(0, totalAssignments - completedAssignments) },
    ];

    // Internships status distribution
    const internships = await Internship.find({ userId });
    const statuses = ['Applied', 'Under Review', 'Interview Scheduled', 'Rejected', 'Selected'];
    const internshipAnalytics = statuses.map((status) => ({
      name: status,
      value: internships.filter((i) => i.status === status).length,
    }));

    // Coding submission activity
    const coding = await CodingProgress.findOne({ userId });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const codingActivity = days.map((day, idx) => ({
      day,
      submissions: coding ? (coding.weeklyActivity[idx] || 0) : 0,
    }));

    // Productivity rate (simulated goals met rates)
    const productivityStats = [
      { date: 'Mon', completion: 60 },
      { date: 'Tue', completion: 40 },
      { date: 'Wed', completion: 80 },
      { date: 'Thu', completion: 70 },
      { date: 'Fri', completion: 90 },
      { date: 'Sat', completion: 50 },
      { date: 'Sun', completion: 100 },
    ];

    res.status(200).json({
      success: true,
      data: {
        monthlyAttendance,
        subjectAttendance,
        assignmentStats,
        internshipAnalytics,
        codingActivity,
        productivityStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
