import Semester from '../models/Semester.js';
import SubjectGrade from '../models/SubjectGrade.js';
import AcademicGoal from '../models/AcademicGoal.js';

// Helper: Recalculate and update academic goals progress for a user
const updateGoalsProgress = async (userId, overallCGPA) => {
  const goals = await AcademicGoal.find({ userId, status: 'In Progress' });
  for (const goal of goals) {
    goal.currentProgress = overallCGPA;
    if (overallCGPA >= goal.targetCGPA) {
      goal.status = 'Achieved';
    }
    await goal.save();
  }
};

// @desc    Get all semesters with subjects and cumulative metrics
// @route   GET /api/cgpa
// @access  Private
export const getCGPAData = async (req, res, next) => {
  try {
    const semesters = await Semester.find({ userId: req.user._id }).sort({ semesterNumber: 1 });
    
    // Fetch subjects for each semester
    const populatedSemesters = await Promise.all(
      semesters.map(async (sem) => {
        const subjects = await SubjectGrade.find({ semesterId: sem._id });
        return {
          ...sem.toObject(),
          subjects,
        };
      })
    );

    // Calculate cumulative aggregates
    let totalCredits = 0;
    let totalCreditPoints = 0;

    semesters.forEach((sem) => {
      totalCredits += sem.totalCredits;
      totalCreditPoints += sem.totalCreditPoints;
    });

    const overallCGPA = totalCredits > 0 
      ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        semesters: populatedSemesters,
        overallCGPA,
        totalCredits,
        totalCreditPoints,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get CGPA statistics overview
// @route   GET /api/cgpa/overview
// @access  Private
export const getOverview = async (req, res, next) => {
  try {
    const semesters = await Semester.find({ userId: req.user._id }).sort({ semesterNumber: 1 });
    
    let totalCredits = 0;
    let totalCreditPoints = 0;
    let highestGPA = 0;
    let lowestGPA = 10;
    
    semesters.forEach((sem) => {
      totalCredits += sem.totalCredits;
      totalCreditPoints += sem.totalCreditPoints;
      if (sem.semesterGPA > highestGPA) highestGPA = sem.semesterGPA;
      if (sem.semesterGPA < lowestGPA) lowestGPA = sem.semesterGPA;
    });

    if (semesters.length === 0) lowestGPA = 0;

    const overallCGPA = totalCredits > 0 
      ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 
      : 0;

    const latestSemester = semesters[semesters.length - 1];
    const latestGPA = latestSemester ? latestSemester.semesterGPA : 0;

    // Get active goal
    const goal = await AcademicGoal.findOne({ userId: req.user._id, status: 'In Progress' }).sort({ createdAt: -1 });

    // Calculate growth/improvement rate (latest semester vs average of previous semesters)
    let improvementRate = 0;
    if (semesters.length > 1) {
      const prevSemesters = semesters.slice(0, -1);
      const prevTotalCredits = prevSemesters.reduce((acc, s) => acc + s.totalCredits, 0);
      const prevTotalPoints = prevSemesters.reduce((acc, s) => acc + s.totalCreditPoints, 0);
      const prevCGPA = prevTotalCredits > 0 ? prevTotalPoints / prevTotalCredits : 0;
      if (prevCGPA > 0) {
        improvementRate = Math.round(((latestGPA - prevCGPA) / prevCGPA) * 10000) / 100;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        overallCGPA,
        latestGPA,
        totalCredits,
        highestGPA,
        lowestGPA,
        improvementRate,
        goal: goal ? {
          targetCGPA: goal.targetCGPA,
          currentProgress: goal.currentProgress,
          status: goal.status,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed Recharts analytics and insights
// @route   GET /api/cgpa/analytics
// @access  Private
export const getAnalytics = async (req, res, next) => {
  try {
    const semesters = await Semester.find({ userId: req.user._id }).sort({ semesterNumber: 1 });
    
    // 1. GPA Trend & CGPA Growth over time
    const gpaTrend = [];
    const cgpaProgress = [];
    
    let cumCredits = 0;
    let cumPoints = 0;

    semesters.forEach((sem) => {
      cumCredits += sem.totalCredits;
      cumPoints += sem.totalCreditPoints;
      const runningCGPA = cumCredits > 0 ? Math.round((cumPoints / cumCredits) * 100) / 100 : 0;
      
      gpaTrend.push({
        semester: `Sem ${sem.semesterNumber}`,
        GPA: sem.semesterGPA,
      });

      cgpaProgress.push({
        semester: `Sem ${sem.semesterNumber}`,
        CGPA: runningCGPA,
      });
    });

    // 2. Subject Grades & GPA distributions
    const semesterIds = semesters.map(s => s._id);
    const subjectGrades = await SubjectGrade.find({ semesterId: { $in: semesterIds } });
    
    const subjectDistribution = subjectGrades.map(sg => ({
      subject: sg.subjectName,
      gradePoint: sg.gradePoint,
      grade: sg.grade,
      credits: sg.credits,
    }));

    // 3. Credit distributions (per semester)
    const creditDistribution = semesters.map(sem => ({
      name: `Sem ${sem.semesterNumber}`,
      value: sem.totalCredits,
    }));

    // 4. Generate academic insights
    let bestSem = null;
    let worstSem = null;
    let maxGPA = 0;
    let minGPA = 10;
    const focusSubjects = [];
    const riskSubjects = [];

    semesters.forEach((sem) => {
      if (sem.semesterGPA > maxGPA) {
        maxGPA = sem.semesterGPA;
        bestSem = `Semester ${sem.semesterNumber}`;
      }
      if (sem.semesterGPA < minGPA) {
        minGPA = sem.semesterGPA;
        worstSem = `Semester ${sem.semesterNumber}`;
      }
    });

    subjectGrades.forEach((sg) => {
      if (sg.grade === 'F') {
        riskSubjects.push(`${sg.subjectName} (Grade: F, Credits: ${sg.credits})`);
      } else if (sg.gradePoint <= 6) {
        focusSubjects.push(sg.subjectName);
      }
    });

    const insights = [];
    if (bestSem) insights.push(`Best Performing Semester: ${bestSem} with GPA of ${maxGPA}`);
    if (worstSem && semesters.length > 1) insights.push(`Lowest Performing Semester: ${worstSem} with GPA of ${minGPA}`);
    if (focusSubjects.length > 0) insights.push(`Subjects Needing Improvement: ${focusSubjects.slice(0, 3).join(', ')}`);
    if (riskSubjects.length > 0) {
      insights.push(`CRITICAL: You have ${riskSubjects.length} failed courses at risk! Recommended focus immediately.`);
    } else {
      insights.push('Academic Standing: Good consistency. Keep tracking study targets.');
    }

    res.status(200).json({
      success: true,
      data: {
        gpaTrend,
        cgpaProgress,
        subjectDistribution,
        creditDistribution,
        insights,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new semester record with grades list
// @route   POST /api/cgpa/semester
// @access  Private
export const createSemester = async (req, res, next) => {
  const { semesterNumber, subjects } = req.body;

  try {
    if (!semesterNumber || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      res.status(400);
      throw new Error('Please provide semester number and a list of subjects with grades.');
    }

    // Check if duplicate semester exists
    const existingSem = await Semester.findOne({ userId: req.user._id, semesterNumber });
    if (existingSem) {
      res.status(400);
      throw new Error(`Semester ${semesterNumber} already exists. Please edit it instead.`);
    }

    // Create the semester document first
    const semester = await Semester.create({
      userId: req.user._id,
      semesterNumber,
      semesterGPA: 0,
      totalCredits: 0,
      totalCreditPoints: 0,
    });

    let totalCredits = 0;
    let totalCreditPoints = 0;
    const gradeMap = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };

    const createdGrades = [];
    for (const sub of subjects) {
      const creditsNum = parseInt(sub.credits, 10);
      const gradePoint = gradeMap[sub.grade] !== undefined ? gradeMap[sub.grade] : 0;
      
      const newGrade = await SubjectGrade.create({
        semesterId: semester._id,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode || '',
        credits: creditsNum,
        grade: sub.grade,
        gradePoint,
      });

      totalCredits += creditsNum;
      totalCreditPoints += (creditsNum * gradePoint);
      createdGrades.push(newGrade);
    }

    semester.totalCredits = totalCredits;
    semester.totalCreditPoints = totalCreditPoints;
    semester.semesterGPA = totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0;
    await semester.save();

    // Trigger overall CGPA calculation to sync goals progress
    const allSemesters = await Semester.find({ userId: req.user._id });
    let globalCredits = 0;
    let globalPoints = 0;
    allSemesters.forEach(s => {
      globalCredits += s.totalCredits;
      globalPoints += s.totalCreditPoints;
    });
    const cumulativeCGPA = globalCredits > 0 ? globalPoints / globalCredits : 0;
    await updateGoalsProgress(req.user._id, Math.round(cumulativeCGPA * 100) / 100);

    res.status(201).json({
      success: true,
      data: {
        ...semester.toObject(),
        subjects: createdGrades,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a semester record (re-creates course grade lists)
// @route   PUT /api/cgpa/semester/:id
// @access  Private
export const updateSemester = async (req, res, next) => {
  const { semesterNumber, subjects } = req.body;

  try {
    const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
    if (!semester) {
      res.status(404);
      throw new Error('Semester record not found');
    }

    if (semesterNumber) {
      semester.semesterNumber = semesterNumber;
    }

    if (subjects && Array.isArray(subjects)) {
      // Clear existing grades
      await SubjectGrade.deleteMany({ semesterId: semester._id });

      let totalCredits = 0;
      let totalCreditPoints = 0;
      const gradeMap = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };

      const createdGrades = [];
      for (const sub of subjects) {
        const creditsNum = parseInt(sub.credits, 10);
        const gradePoint = gradeMap[sub.grade] !== undefined ? gradeMap[sub.grade] : 0;

        const newGrade = await SubjectGrade.create({
          semesterId: semester._id,
          subjectName: sub.subjectName,
          subjectCode: sub.subjectCode || '',
          credits: creditsNum,
          grade: sub.grade,
          gradePoint,
        });

        totalCredits += creditsNum;
        totalCreditPoints += (creditsNum * gradePoint);
        createdGrades.push(newGrade);
      }

      semester.totalCredits = totalCredits;
      semester.totalCreditPoints = totalCreditPoints;
      semester.semesterGPA = totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0;
    }

    await semester.save();

    // Trigger goal progress updates
    const allSemesters = await Semester.find({ userId: req.user._id });
    let globalCredits = 0;
    let globalPoints = 0;
    allSemesters.forEach(s => {
      globalCredits += s.totalCredits;
      globalPoints += s.totalCreditPoints;
    });
    const cumulativeCGPA = globalCredits > 0 ? globalPoints / globalCredits : 0;
    await updateGoalsProgress(req.user._id, Math.round(cumulativeCGPA * 100) / 100);

    const updatedSubjects = await SubjectGrade.find({ semesterId: semester._id });

    res.status(200).json({
      success: true,
      data: {
        ...semester.toObject(),
        subjects: updatedSubjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a semester record (cascading subjects grades)
// @route   DELETE /api/cgpa/semester/:id
// @access  Private
export const deleteSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
    if (!semester) {
      res.status(404);
      throw new Error('Semester record not found');
    }

    // Cascading cleanups
    await SubjectGrade.deleteMany({ semesterId: semester._id });
    await semester.deleteOne();

    // Trigger goal update after deletion
    const allSemesters = await Semester.find({ userId: req.user._id });
    let globalCredits = 0;
    let globalPoints = 0;
    allSemesters.forEach(s => {
      globalCredits += s.totalCredits;
      globalPoints += s.totalCreditPoints;
    });
    const cumulativeCGPA = globalCredits > 0 ? globalPoints / globalCredits : 0;
    await updateGoalsProgress(req.user._id, Math.round(cumulativeCGPA * 100) / 100);

    res.status(200).json({
      success: true,
      message: 'Semester and all course grades deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Grade Planner What-if analysis
// @route   POST /api/cgpa/calculate
// @access  Private
export const calculateCGPA = async (req, res, next) => {
  const { currentSemesters, projectedCourses } = req.body;

  try {
    let totalCredits = 0;
    let totalPoints = 0;
    const gradeMap = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };

    // Accumulate existing semester stats
    if (currentSemesters && Array.isArray(currentSemesters)) {
      currentSemesters.forEach(s => {
        totalCredits += parseFloat(s.totalCredits || 0);
        totalPoints += parseFloat(s.totalCreditPoints || s.totalCredits * s.semesterGPA || 0);
      });
    }

    // Accumulate projected grades
    let projectedCredits = 0;
    let projectedPoints = 0;
    if (projectedCourses && Array.isArray(projectedCourses)) {
      projectedCourses.forEach(c => {
        const cred = parseFloat(c.credits || 0);
        const pt = gradeMap[c.grade] !== undefined ? gradeMap[c.grade] : 0;
        projectedCredits += cred;
        projectedPoints += (cred * pt);
      });
    }

    const overallCredits = totalCredits + projectedCredits;
    const overallPoints = totalPoints + projectedPoints;
    const projectedGPA = projectedCredits > 0 ? Math.round((projectedPoints / projectedCredits) * 100) / 100 : 0;
    const projectedCGPA = overallCredits > 0 ? Math.round((overallPoints / overallCredits) * 100) / 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        projectedGPA,
        projectedCGPA,
        overallCredits,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    CGPA predictor logic
// @route   POST /api/cgpa/predict
// @access  Private
export const predictCGPA = async (req, res, next) => {
  const { targetCGPA, expectedCredits, remainingSemesters } = req.body;

  try {
    if (!targetCGPA || !expectedCredits || !remainingSemesters) {
      res.status(400);
      throw new Error('Please provide target CGPA, expected future credits, and remaining semesters count.');
    }

    // Get current progress
    const semesters = await Semester.find({ userId: req.user._id });
    let currentCredits = 0;
    let currentPoints = 0;

    semesters.forEach(s => {
      currentCredits += s.totalCredits;
      currentPoints += s.totalCreditPoints;
    });

    const overallCredits = currentCredits + expectedCredits;
    const requiredPoints = (targetCGPA * overallCredits) - currentPoints;
    
    const requiredGPA = expectedCredits > 0 
      ? Math.round((requiredPoints / expectedCredits) * 100) / 100 
      : 0;

    let probability = 'High';
    if (requiredGPA > 10.0) {
      probability = 'Impossible';
    } else if (requiredGPA > 9.0) {
      probability = 'Low';
    } else if (requiredGPA > 7.5) {
      probability = 'Medium';
    }

    res.status(200).json({
      success: true,
      data: {
        requiredGPA: requiredGPA > 0 ? requiredGPA : 0,
        probability,
        targetCGPA,
        message: requiredGPA > 10.0 
          ? `Target impossible. You need a future average GPA of ${requiredGPA} which exceeds the 10.0 limit.`
          : `To reach your target CGPA of ${targetCGPA}, you need to maintain an average of ${requiredGPA} GPA in your remaining ${remainingSemesters} semesters.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch academic goals
// @route   GET /api/cgpa/goals
// @access  Private
export const fetchGoals = async (req, res, next) => {
  try {
    const goals = await AcademicGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new academic CGPA goal
// @route   POST /api/cgpa/goals
// @access  Private
export const createGoal = async (req, res, next) => {
  const { targetCGPA, targetDate } = req.body;

  try {
    if (!targetCGPA) {
      res.status(400);
      throw new Error('Please specify your target CGPA.');
    }

    // Get current CGPA for starting progress
    const semesters = await Semester.find({ userId: req.user._id });
    let totalCredits = 0;
    let totalPoints = 0;
    semesters.forEach(s => {
      totalCredits += s.totalCredits;
      totalPoints += s.totalCreditPoints;
    });
    const currentCGPA = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;

    const newGoal = await AcademicGoal.create({
      userId: req.user._id,
      targetCGPA,
      targetDate: targetDate || null,
      currentProgress: currentCGPA,
      status: currentCGPA >= targetCGPA ? 'Achieved' : 'In Progress',
    });

    res.status(201).json({ success: true, data: newGoal });
  } catch (error) {
    next(error);
  }
};
