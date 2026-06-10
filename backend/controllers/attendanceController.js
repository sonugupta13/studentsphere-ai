import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';

// Helper to recalculate and update Subject aggregated counts
const recalculateSubjectStats = async (subjectId) => {
  const logs = await Attendance.find({ subjectId });
  
  // Exclude 'Leave' status from total classes denominator as it is excused
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

// @desc    Get all subjects
// @route   GET /api/attendance
// @access  Private
export const getSubjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const subjects = await Subject.find({ userId });
    res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance overview metrics
// @route   GET /api/attendance/overview
// @access  Private
export const getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const subjects = await Subject.find({ userId });
    
    let totalClasses = 0;
    let attendedClasses = 0;
    
    subjects.forEach((sub) => {
      totalClasses += sub.totalClasses;
      attendedClasses += sub.attendedClasses;
    });

    const missedClasses = totalClasses - attendedClasses;
    const overallPercentage = totalClasses > 0 
      ? Math.round((attendedClasses / totalClasses) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overallPercentage,
        totalSubjects: subjects.length,
        totalClasses,
        attendedClasses,
        missedClasses,
        attendanceGoal: 75, // Standard target percentage
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly reports breakdown
// @route   GET /api/attendance/reports
// @access  Private
export const getReports = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const logs = await Attendance.find({ userId }).populate('subjectId');

    // Group logs by Month/Year
    const reportsMap = {};

    logs.forEach((log) => {
      const date = new Date(log.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!reportsMap[monthYear]) {
        reportsMap[monthYear] = {
          month: monthYear,
          totalClasses: 0,
          attended: 0,
          missed: 0,
          leave: 0,
          subjectsBreakdown: {},
        };
      }

      const report = reportsMap[monthYear];
      
      // Calculate statistics
      if (log.status === 'Present') {
        report.totalClasses += 1;
        report.attended += 1;
      } else if (log.status === 'Absent') {
        report.totalClasses += 1;
        report.missed += 1;
      } else if (log.status === 'Leave') {
        report.leave += 1;
      }

      // Subject breakdown
      if (log.subjectId) {
        const subName = log.subjectId.subjectName;
        if (!report.subjectsBreakdown[subName]) {
          report.subjectsBreakdown[subName] = { attended: 0, total: 0 };
        }
        if (log.status === 'Present') {
          report.subjectsBreakdown[subName].total += 1;
          report.subjectsBreakdown[subName].attended += 1;
        } else if (log.status === 'Absent') {
          report.subjectsBreakdown[subName].total += 1;
        }
      }
    });

    // Format output
    const reportsList = Object.values(reportsMap).map((rep) => {
      const percentage = rep.totalClasses > 0 ? Math.round((rep.attended / rep.totalClasses) * 100) : 0;
      
      const subjectsBreakdownList = Object.keys(rep.subjectsBreakdown).map((name) => {
        const sub = rep.subjectsBreakdown[name];
        return {
          subjectName: name,
          attended: sub.attended,
          total: sub.total,
          percentage: sub.total > 0 ? Math.round((sub.attended / sub.total) * 100) : 0,
        };
      });

      return {
        ...rep,
        percentage,
        subjectsBreakdown: subjectsBreakdownList,
      };
    });

    res.status(200).json({ success: true, data: reportsList });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance analytics trends
// @route   GET /api/attendance/analytics
// @access  Private
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const subjects = await Subject.find({ userId });
    const logs = await Attendance.find({ userId });

    // Calculate best & weakest subject
    let bestSubject = null;
    let weakestSubject = null;
    let highestPct = -1;
    let lowestPct = 101;

    subjects.forEach((sub) => {
      if (sub.totalClasses > 0) {
        if (sub.attendancePercentage > highestPct) {
          highestPct = sub.attendancePercentage;
          bestSubject = { name: sub.subjectName, percentage: sub.attendancePercentage };
        }
        if (sub.attendancePercentage < lowestPct) {
          lowestPct = sub.attendancePercentage;
          weakestSubject = { name: sub.subjectName, percentage: sub.attendancePercentage };
        }
      }
    });

    // If no records logged yet, fallback to placeholder labels
    if (!bestSubject && subjects[0]) {
      bestSubject = { name: subjects[0].subjectName, percentage: 0 };
      weakestSubject = { name: subjects[0].subjectName, percentage: 0 };
    }

    // Monthly attendance trend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};

    logs.forEach((log) => {
      const date = new Date(log.date);
      const mName = months[date.getMonth()];
      
      if (!monthlyData[mName]) {
        monthlyData[mName] = { attended: 0, total: 0 };
      }
      
      if (log.status === 'Present') {
        monthlyData[mName].total += 1;
        monthlyData[mName].attended += 1;
      } else if (log.status === 'Absent') {
        monthlyData[mName].total += 1;
      }
    });

    const monthlyTrends = Object.keys(monthlyData).map((month) => ({
      month,
      percentage: monthlyData[month].total > 0 
        ? Math.round((monthlyData[month].attended / monthlyData[month].total) * 100) 
        : 0,
    }));

    // Status distribution
    const distribution = {
      Present: logs.filter((l) => l.status === 'Present').length,
      Absent: logs.filter((l) => l.status === 'Absent').length,
      Leave: logs.filter((l) => l.status === 'Leave').length,
    };

    res.status(200).json({
      success: true,
      data: {
        bestSubject,
        weakestSubject,
        averageAttendance: subjects.length > 0 
          ? Math.round(subjects.reduce((acc, s) => acc + s.attendancePercentage, 0) / subjects.length) 
          : 0,
        monthlyTrends,
        distribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a subject profile
// @route   POST /api/attendance/subject
// @access  Private
export const addSubject = async (req, res, next) => {
  try {
    const { subjectName, subjectCode, facultyName } = req.body;
    if (!subjectName || !subjectCode || !facultyName) {
      res.status(400);
      throw new Error('Please fill in all subject fields');
    }

    const subject = await Subject.create({
      userId: req.user._id,
      subjectName,
      subjectCode,
      facultyName,
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit subject details
// @route   PUT /api/attendance/subject/:id
// @access  Private
export const updateSubject = async (req, res, next) => {
  try {
    const { subjectName, subjectCode, facultyName } = req.body;
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });

    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }

    subject.subjectName = subjectName || subject.subjectName;
    subject.subjectCode = subjectCode || subject.subjectCode;
    subject.facultyName = facultyName || subject.facultyName;
    
    await subject.save();

    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject profile & logs
// @route   DELETE /api/attendance/subject/:id
// @access  Private
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }

    // Clear corresponding attendance logs
    await Attendance.deleteMany({ subjectId: req.params.id });

    res.status(200).json({ success: true, message: 'Subject and logs deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark attendance log
// @route   POST /api/attendance/mark
// @access  Private
export const markAttendance = async (req, res, next) => {
  try {
    const { subjectId, status, date, remarks } = req.body;
    if (!subjectId || !status || !date) {
      res.status(400);
      throw new Error('Please provide subject, status, and date');
    }

    const log = await Attendance.create({
      userId: req.user._id,
      subjectId,
      status,
      date,
      remarks,
    });

    // Synchronize subject counts
    await recalculateSubjectStats(subjectId);

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// @desc    Update single class log
// @route   PUT /api/attendance/update/:id
// @access  Private
export const updateAttendance = async (req, res, next) => {
  try {
    const { status, date, remarks } = req.body;
    const log = await Attendance.findOne({ _id: req.params.id, userId: req.user._id });

    if (!log) {
      res.status(404);
      throw new Error('Attendance record not found');
    }

    log.status = status || log.status;
    log.date = date || log.date;
    log.remarks = remarks !== undefined ? remarks : log.remarks;

    await log.save();

    // Re-sync subject
    await recalculateSubjectStats(log.subjectId);

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete class log
// @route   DELETE /api/attendance/delete/:id
// @access  Private
export const deleteAttendance = async (req, res, next) => {
  try {
    const log = await Attendance.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) {
      res.status(404);
      throw new Error('Attendance record not found');
    }

    // Re-sync subject
    await recalculateSubjectStats(log.subjectId);

    res.status(200).json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    next(error);
  }
};
