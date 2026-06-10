import Exam from '../models/Exam.js';
import StudyPlan from '../models/StudyPlan.js';
import Revision from '../models/Revision.js';

// Helper: Synchronize and recalculate exam progress & status variables
const syncExamState = async (exam) => {
  const now = new Date();
  
  // 1. Calculate preparation progress based on syllabus completion
  if (exam.syllabusTopics && exam.syllabusTopics.length > 0) {
    const completed = exam.syllabusTopics.filter((t) => t.completionStatus === 'Completed').length;
    exam.preparationProgress = Math.round((completed / exam.syllabusTopics.length) * 100);
  } else {
    exam.preparationProgress = 0;
  }

  // 2. Resolve exam datetime
  const examDateTime = new Date(exam.examDate || exam.date || now);
  if (exam.examTime) {
    const [hours, minutes] = exam.examTime.split(':');
    examDateTime.setHours(parseInt(hours, 10) || 10, parseInt(minutes, 10) || 0, 0, 0);
  }

  // 3. Resolve status
  const durationMs = (exam.duration || 180) * 60 * 1000;
  const endDateTime = new Date(examDateTime.getTime() + durationMs);

  let computedStatus = 'Upcoming';
  if (now > endDateTime) {
    computedStatus = 'Completed';
  } else {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);
    
    if (examDateTime >= todayStart && examDateTime <= todayEnd) {
      computedStatus = 'Today';
    }
  }

  // Check if status changed
  // Note: we can't save status directly as field because it's not a mongoose property in our schema.
  // But we return it in JSON.
  
  // Sync in database
  await Exam.findByIdAndUpdate(exam._id, {
    preparationProgress: exam.preparationProgress,
  });

  return computedStatus;
};

// @desc    Get all exams with countdown and status calculations
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const exams = await Exam.find({ userId }).sort({ examDate: 1 });

    const processedExams = await Promise.all(
      exams.map(async (exam) => {
        const now = new Date();
        const computedStatus = await syncExamState(exam);

        // Calculate countdown values
        const examDateTime = new Date(exam.examDate || exam.date || now);
        if (exam.examTime) {
          const [hours, minutes] = exam.examTime.split(':');
          examDateTime.setHours(parseInt(hours, 10) || 10, parseInt(minutes, 10) || 0, 0, 0);
        }

        const diffMs = examDateTime - now;
        
        let days = 0;
        let hours = 0;
        let minutes = 0;

        if (diffMs > 0) {
          days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        }

        // Return processed object
        return {
          ...exam.toJSON(),
          status: computedStatus,
          countdown: { days, hours, minutes },
        };
      })
    );

    res.status(200).json({ success: true, data: processedExams });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single exam by ID (including Study and Revision plans)
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const computedStatus = await syncExamState(exam);
    const studyPlan = await StudyPlan.find({ examId: exam._id });
    const revisionPlan = await Revision.find({ examId: exam._id });

    res.status(200).json({
      success: true,
      data: {
        ...exam.toJSON(),
        status: computedStatus,
        studyPlan,
        revisionPlan,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get exam calendar events (exams, study sessions, revisions)
// @route   GET /api/exams/calendar
// @access  Private
export const getCalendarData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const exams = await Exam.find({ userId });
    const studyPlans = await StudyPlan.find({ userId });
    const revisions = await Revision.find({ userId });

    const calendarEvents = [];

    // Map exams
    exams.forEach((ex) => {
      const actualDate = ex.examDate || ex.date;
      if (!actualDate) return;
      const dateStr = new Date(actualDate).toISOString().split('T')[0];
      calendarEvents.push({
        id: ex._id,
        title: `${ex.examName} (${ex.examType})`,
        date: dateStr,
        type: 'exam',
        color: 'bg-rose-500',
      });
    });

    // Map study plans
    studyPlans.forEach((sp) => {
      const dateStr = new Date(sp.studyDate).toISOString().split('T')[0];
      calendarEvents.push({
        id: sp._id,
        examId: sp.examId,
        title: `Study: ${sp.topics.join(', ')} (${sp.estimatedHours}h)`,
        date: dateStr,
        type: 'study',
        status: sp.completionStatus,
        color: 'bg-blue-500',
      });
    });

    // Map revisions
    revisions.forEach((rv) => {
      const dateStr = new Date(rv.revisionDate).toISOString().split('T')[0];
      calendarEvents.push({
        id: rv._id,
        examId: rv.examId,
        title: `Revise: ${rv.revisionLevel}`,
        date: dateStr,
        type: 'revision',
        status: rv.status,
        color: 'bg-emerald-500',
      });
    });

    res.status(200).json({ success: true, data: calendarEvents });
  } catch (error) {
    next(error);
  }
};

// @desc    Get exam readiness analytics and progress trends
// @route   GET /api/exams/analytics
// @access  Private
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const exams = await Exam.find({ userId });
    const studyPlans = await StudyPlan.find({ userId });
    const revisions = await Revision.find({ userId });

    const total = exams.length;
    const completed = exams.filter((e) => {
      const actualDate = e.examDate || e.date;
      if (!actualDate) return false;
      const due = new Date(actualDate);
      return due < new Date();
    }).length;
    const upcoming = total - completed;

    // Averages
    let avgProgress = 0;
    if (total > 0) {
      const sum = exams.reduce((acc, e) => acc + (e.preparationProgress || 0), 0);
      avgProgress = Math.round(sum / total);
    }

    // Revisions
    const totalRevisions = revisions.length;
    const completedRevisions = revisions.filter((r) => r.status === 'Completed').length;
    const pendingRevisions = totalRevisions - completedRevisions;

    // Study Hours
    const studyHoursLogged = studyPlans
      .filter((sp) => sp.completionStatus === 'Completed')
      .reduce((acc, sp) => acc + (sp.estimatedHours || 0), 0);

    // Calculate Exam Readiness Score:
    // syllabus completion (50%), completed revisions (30%), completed study hours (20%)
    let readinessScore = 0;
    if (total > 0) {
      const syllabusRate = avgProgress;
      const revisionRate = totalRevisions > 0 ? (completedRevisions / totalRevisions) * 100 : 100;
      const studyPlanRate = studyPlans.length > 0 
        ? (studyPlans.filter(sp => sp.completionStatus === 'Completed').length / studyPlans.length) * 100 
        : 100;
      
      readinessScore = Math.round((syllabusRate * 0.5) + (revisionRate * 0.3) + (studyPlanRate * 0.2));
    }

    let preparationLevel = 'Needs Improvement';
    if (readinessScore >= 85) preparationLevel = 'Excellent';
    else if (readinessScore >= 70) preparationLevel = 'Good';
    else if (readinessScore >= 50) preparationLevel = 'Average';

    // Chart 1: Subject wise completion
    const subjectDistribution = exams.map((ex) => ({
      subject: ex.subjectName,
      completion: ex.preparationProgress,
    }));

    // Chart 2: Daily Study Hours in past 7 days
    const studyTrends = [];
    const now = new Date();
    const daysLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23,59,59,999);

      const hours = studyPlans
        .filter((sp) => {
          const spDate = new Date(sp.studyDate);
          return spDate >= targetDate && spDate <= targetEnd && sp.completionStatus === 'Completed';
        })
        .reduce((acc, sp) => acc + (sp.estimatedHours || 0), 0);

      studyTrends.push({
        day: daysLabel[targetDate.getDay()],
        hours,
      });
    }

    // Chart 3: Revision Statuses
    const revisionStatusDistribution = {
      Completed: completedRevisions,
      Pending: pendingRevisions,
    };

    res.status(200).json({
      success: true,
      data: {
        totalExams: total,
        upcomingExams: upcoming,
        completedExams: completed,
        avgPreparationProgress: avgProgress,
        pendingRevisions,
        studyHoursLogged,
        readinessScore,
        preparationLevel,
        subjectDistribution,
        studyTrends,
        revisionStatusDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private
export const createExam = async (req, res, next) => {
  try {
    const {
      examName,
      subjectName,
      examType,
      examDate,
      examTime,
      totalMarks,
      duration,
      syllabusTopics,
      notes,
    } = req.body;

    if (!examName || !subjectName || !examDate) {
      res.status(400);
      throw new Error('Exam name, subject, and date are required fields.');
    }

    const exam = await Exam.create({
      userId: req.user._id,
      examName,
      subjectName,
      examType: examType || 'Mid Semester',
      examDate,
      examTime: examTime || '10:00',
      totalMarks: totalMarks || 100,
      duration: duration || 180,
      syllabusTopics: syllabusTopics || [],
      notes,
    });

    // Auto sync calculations
    await syncExamState(exam);

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Update exam details
// @route   PUT /api/exams/:id
// @access  Private
export const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const {
      examName,
      subjectName,
      examType,
      examDate,
      examTime,
      totalMarks,
      duration,
      syllabusTopics,
      notes,
      revisionStatus,
    } = req.body;

    exam.examName = examName || exam.examName;
    exam.subjectName = subjectName || exam.subjectName;
    exam.examType = examType || exam.examType;
    exam.examDate = examDate || exam.examDate;
    exam.examTime = examTime || exam.examTime;
    exam.totalMarks = totalMarks !== undefined ? totalMarks : exam.totalMarks;
    exam.duration = duration !== undefined ? duration : exam.duration;
    exam.syllabusTopics = syllabusTopics || exam.syllabusTopics;
    exam.notes = notes !== undefined ? notes : exam.notes;
    exam.revisionStatus = revisionStatus || exam.revisionStatus;

    await exam.save();
    await syncExamState(exam);

    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete exam (Cascading study plans and revisions)
// @route   DELETE /api/exams/:id
// @access  Private
export const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    // Cascade deletion of logs
    await StudyPlan.deleteMany({ examId: exam._id });
    await Revision.deleteMany({ examId: exam._id });
    await exam.deleteOne();

    res.status(200).json({ success: true, message: 'Exam and its plans deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Algorithmic Smart Study Plan Generator
// @route   POST /api/exams/generate-study-plan
// @access  Private
export const generateStudyPlan = async (req, res, next) => {
  try {
    const { examId, difficulty, dailyHours } = req.body;
    if (!examId || !difficulty || !dailyHours) {
      res.status(400);
      throw new Error('Please provide exam ID, subject difficulty, and daily study hours.');
    }

    const exam = await Exam.findOne({ _id: examId, userId: req.user._id });
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const topicsList = exam.syllabusTopics.map((t) => t.topicName);
    if (topicsList.length === 0) {
      res.status(400);
      throw new Error('The exam syllabus topics list is empty. Add topics first.');
    }

    // Clear existing plans for this exam
    await StudyPlan.deleteMany({ examId });

    // Calculate dates between today and exam date
    const now = new Date();
    now.setHours(0,0,0,0);
    const examDate = new Date(exam.examDate);
    examDate.setHours(0,0,0,0);

    const diffDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      res.status(400);
      throw new Error('Exam is either today or already completed. Cannot generate study plan.');
    }

    // Study plan allocations
    // Easy: 1.5 hrs per topic, Medium: 2.5 hrs per topic, Hard: 4 hrs per topic
    const hoursPerTopic = difficulty === 'Easy' ? 1.5 : difficulty === 'Medium' ? 2.5 : 4;
    const totalTopics = topicsList.length;

    // Distribute topics over available days
    // If we have more days than topics, schedule them spread out.
    // If we have fewer days, group multiple topics per day.
    const createdPlans = [];
    
    if (diffDays >= totalTopics) {
      // Spread out: 1 topic per study day
      for (let i = 0; i < totalTopics; i++) {
        const studyDate = new Date(now);
        studyDate.setDate(now.getDate() + i);

        const newPlan = await StudyPlan.create({
          userId: req.user._id,
          examId,
          studyDate,
          topics: [topicsList[i]],
          estimatedHours: hoursPerTopic,
          completionStatus: 'Not Started',
        });
        createdPlans.push(newPlan);
      }
    } else {
      // Condense: multiple topics per day
      const topicsPerDay = Math.ceil(totalTopics / diffDays);
      for (let i = 0; i < diffDays; i++) {
        const studyDate = new Date(now);
        studyDate.setDate(now.getDate() + i);

        const startIndex = i * topicsPerDay;
        const dayTopics = topicsList.slice(startIndex, startIndex + topicsPerDay);
        if (dayTopics.length === 0) break;

        const newPlan = await StudyPlan.create({
          userId: req.user._id,
          examId,
          studyDate,
          topics: dayTopics,
          estimatedHours: Math.min(dailyHours, dayTopics.length * hoursPerTopic),
          completionStatus: 'Not Started',
        });
        createdPlans.push(newPlan);
      }
    }

    res.status(201).json({ success: true, data: createdPlans });
  } catch (error) {
    next(error);
  }
};

// @desc    Algorithmic Revision Plan Generator (4 Levels)
// @route   POST /api/exams/generate-revision-plan
// @access  Private
export const generateRevisionPlan = async (req, res, next) => {
  try {
    const { examId } = req.body;
    if (!examId) {
      res.status(400);
      throw new Error('Please provide exam ID.');
    }

    const exam = await Exam.findOne({ _id: examId, userId: req.user._id });
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    // Clear existing revisions
    await Revision.deleteMany({ examId });

    // Generate revision levels at specific countdown intervals
    // First: 7 days before
    // Second: 3 days before
    // Third: 2 days before
    // Final: 1 day before
    const examDate = new Date(exam.examDate);
    
    const levels = [
      { level: 'First Revision', daysBefore: 7 },
      { level: 'Second Revision', daysBefore: 3 },
      { level: 'Third Revision', daysBefore: 2 },
      { level: 'Final Revision', daysBefore: 1 },
    ];

    const createdRevisions = [];

    for (const lvl of levels) {
      const revisionDate = new Date(examDate);
      revisionDate.setDate(examDate.getDate() - lvl.daysBefore);
      revisionDate.setHours(0,0,0,0);

      // Verify date is not in the past
      if (revisionDate >= new Date()) {
        const newRev = await Revision.create({
          userId: req.user._id,
          examId,
          revisionLevel: lvl.level,
          revisionDate,
          status: 'Pending',
        });
        createdRevisions.push(newRev);
      }
    }

    res.status(201).json({ success: true, data: createdRevisions });
  } catch (error) {
    next(error);
  }
};
