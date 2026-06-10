import CodingProfile from '../models/CodingProfile.js';
import CodingLog from '../models/CodingLog.js';
import CodingGoal from '../models/CodingGoal.js';
import CodingStreak from '../models/CodingStreak.js';
import mongoose from 'mongoose';

// Helper: Recalculate Streak based on all logs
const recalculateStreak = async (userId) => {
  const logs = await CodingLog.find({ userId }).sort({ date: 1 });
  
  if (logs.length === 0) {
    await CodingStreak.findOneAndUpdate(
      { userId },
      { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastCodingDate: null },
      { upsert: true }
    );
    return;
  }

  // Get unique dates in local string format (YYYY-MM-DD)
  const uniqueDates = [...new Set(logs.map(log => log.date.toISOString().split('T')[0]))].sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  
  let prevDate = null;
  
  uniqueDates.forEach(dateStr => {
    const currDate = new Date(dateStr);
    
    if (!prevDate) {
      currentStreak = 1;
      longestStreak = 1;
    } else {
      // Calculate difference in days
      const diffTime = Math.abs(currDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak += 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else if (diffDays > 1) {
        currentStreak = 1; // reset
      }
    }
    prevDate = currDate;
  });

  // Check if current streak is still active (last date should be today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
  lastDate.setHours(0, 0, 0, 0);
  
  const diffFromToday = Math.ceil((today - lastDate) / (1000 * 60 * 60 * 24));
  
  if (diffFromToday > 1) {
    // Missed yesterday and today
    currentStreak = 0;
  }

  await CodingStreak.findOneAndUpdate(
    { userId },
    { 
      currentStreak, 
      longestStreak, 
      totalActiveDays: uniqueDates.length, 
      lastCodingDate: new Date(uniqueDates[uniqueDates.length - 1]) 
    },
    { upsert: true, new: true }
  );
};

// @desc    Get complete coding dashboard data
// @route   GET /api/coding/dashboard
// @access  Private
export const getCodingDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const profiles = await CodingProfile.find({ userId });
    const logs = await CodingLog.find({ userId }).sort({ date: -1 }).limit(10);
    const goals = await CodingGoal.find({ userId });
    const streak = await CodingStreak.findOne({ userId }) || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
    
    // Aggregates
    const allLogs = await CodingLog.find({ userId });
    const totalProblemsSolved = allLogs.reduce((sum, log) => sum + log.problemsSolved, 0);
    const totalTimeSpent = allLogs.reduce((sum, log) => sum + log.timeSpent, 0); // minutes

    // Topic aggregation
    const topicCount = {};
    allLogs.forEach(log => {
      log.topics.forEach(t => {
        topicCount[t] = (topicCount[t] || 0) + log.problemsSolved;
      });
    });

    const topicsArray = Object.keys(topicCount).map(t => ({ name: t, count: topicCount[t] }));
    topicsArray.sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: {
        profiles,
        recentLogs: logs,
        goals,
        streak,
        stats: {
          totalProblemsSolved,
          totalTimeSpent,
          topTopics: topicsArray.slice(0, 5)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chart analytics data (heatmaps, bar charts)
// @route   GET /api/coding/analytics
// @access  Private
export const getCodingAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const logs = await CodingLog.find({ userId }).sort({ date: 1 });

    // Generate heatmap data (Date: Count)
    const heatmapData = {};
    const monthlyDataMap = {}; // for last 6 months
    const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };

    logs.forEach(log => {
      const dateStr = log.date.toISOString().split('T')[0];
      heatmapData[dateStr] = (heatmapData[dateStr] || 0) + log.problemsSolved;

      const monthStr = log.date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyDataMap[monthStr] = (monthlyDataMap[monthStr] || 0) + log.problemsSolved;
    });

    // We don't have exact difficulty per log, but we have it from profiles
    const profiles = await CodingProfile.find({ userId });
    profiles.forEach(p => {
      difficultyDistribution.easy += p.easySolved;
      difficultyDistribution.medium += p.mediumSolved;
      difficultyDistribution.hard += p.hardSolved;
    });

    const heatmapArray = Object.keys(heatmapData).map(date => ({ date, count: heatmapData[date] }));
    const monthlyTrend = Object.keys(monthlyDataMap).map(month => ({ month, solved: monthlyDataMap[month] }));

    res.status(200).json({
      success: true,
      data: {
        heatmap: heatmapArray,
        monthlyTrend,
        difficultyDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

// PROFILES
export const addProfile = async (req, res, next) => {
  try {
    const { platform, username, profileUrl, totalSolved, easySolved, mediumSolved, hardSolved } = req.body;
    
    const existing = await CodingProfile.findOne({ userId: req.user._id, platform });
    if (existing) {
      res.status(400);
      throw new Error(`Profile for ${platform} already exists.`);
    }

    const profile = await CodingProfile.create({
      userId: req.user._id,
      platform, username, profileUrl, totalSolved, easySolved, mediumSolved, hardSolved
    });

    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await CodingProfile.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!profile) {
      res.status(404);
      throw new Error('Profile not found');
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req, res, next) => {
  try {
    const profile = await CodingProfile.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!profile) {
      res.status(404);
      throw new Error('Profile not found');
    }
    res.status(200).json({ success: true, message: 'Profile deleted' });
  } catch (error) {
    next(error);
  }
};

// LOGS
export const addCodingLog = async (req, res, next) => {
  try {
    const { platform, date, problemsSolved, timeSpent, topics, notes } = req.body;

    const log = await CodingLog.create({
      userId: req.user._id,
      platform, date, problemsSolved, timeSpent, topics, notes
    });

    await recalculateStreak(req.user._id);

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const updateCodingLog = async (req, res, next) => {
  try {
    const log = await CodingLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!log) {
      res.status(404);
      throw new Error('Log not found');
    }

    await recalculateStreak(req.user._id);

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const deleteCodingLog = async (req, res, next) => {
  try {
    const log = await CodingLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) {
      res.status(404);
      throw new Error('Log not found');
    }

    await recalculateStreak(req.user._id);

    res.status(200).json({ success: true, message: 'Log deleted' });
  } catch (error) {
    next(error);
  }
};

// GOALS
export const addCodingGoal = async (req, res, next) => {
  try {
    const { goalTitle, targetValue, currentValue, deadline } = req.body;
    const goal = await CodingGoal.create({
      userId: req.user._id,
      goalTitle, targetValue, currentValue, deadline
    });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

export const updateCodingGoal = async (req, res, next) => {
  try {
    const goal = await CodingGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!goal) {
      res.status(404);
      throw new Error('Goal not found');
    }
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

export const deleteCodingGoal = async (req, res, next) => {
  try {
    const goal = await CodingGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      res.status(404);
      throw new Error('Goal not found');
    }
    res.status(200).json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};
