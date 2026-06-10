import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Report from '../models/Report.js';
import ActivityLog from '../models/ActivityLog.js';
import Resume from '../models/Resume.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Exam from '../models/Exam.js';
import Expense from '../models/Expense.js';

// Growth calculator helper
const getGrowthPercentage = async (Model, dateField = 'createdAt') => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const currentMonthCount = await Model.countDocuments({
    [dateField]: { $gte: startOfCurrentMonth }
  });
  
  const prevMonthCount = await Model.countDocuments({
    [dateField]: { $gte: startOfPrevMonth, $lt: startOfCurrentMonth }
  });
  
  if (prevMonthCount === 0) {
    return currentMonthCount > 0 ? 100 : 0;
  }
  return Math.round(((currentMonthCount - prevMonthCount) / prevMonthCount) * 100);
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'Active' });
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalResumes = await Resume.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    const totalNotes = await Exam.countDocuments(); // Fallback representation of notes / study units
    const totalExpenses = await Expense.countDocuments();

    // Get growths
    const usersGrowth = await getGrowthPercentage(User);
    const postsGrowth = await getGrowthPercentage(Post);
    const commentsGrowth = await getGrowthPercentage(Comment);
    const resumesGrowth = await getGrowthPercentage(Resume);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalPosts,
          totalComments,
          totalResumes,
          totalAssignments,
          totalNotes,
          totalExpenses,
        },
        growth: {
          usersGrowth,
          postsGrowth,
          commentsGrowth,
          resumesGrowth,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with search, sort, filters, and pagination
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    const sort = req.query.sort || 'newest';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    let sortQuery = { createdAt: -1 };
    if (sort === 'oldest') sortQuery = { createdAt: 1 };
    if (sort === 'alphabetical') sortQuery = { fullName: 1 };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email || user.email;
    
    await user.save();

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'User Updated',
      targetId: user._id,
      targetType: 'User',
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    await User.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'User Deleted',
      targetId: user._id,
      targetType: 'User',
    });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Block user
// @route   PATCH /api/admin/users/block/:id
// @access  Private/Admin
export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.status = 'Blocked';
    await user.save();

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'User Blocked',
      targetId: user._id,
      targetType: 'User',
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock user
// @route   PATCH /api/admin/users/unblock/:id
// @access  Private/Admin
export const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.status = 'Active';
    await user.save();

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'User Unblocked',
      targetId: user._id,
      targetType: 'User',
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role
// @route   PATCH /api/admin/users/role/:id
// @access  Private/Admin
export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['student', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Please specify a valid role');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.role = role;
    await user.save();

    await ActivityLog.create({
      adminId: req.user._id,
      action: `Role Changed to ${role}`,
      targetId: user._id,
      targetType: 'User',
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts
// @route   GET /api/admin/posts
// @access  Private/Admin
export const getPosts = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const posts = await Post.find(query)
      .populate('userId', 'fullName email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    await Comment.deleteMany({ postId: post._id });
    await Post.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'Post Deleted',
      targetId: post._id,
      targetType: 'Post',
    });

    res.status(200).json({ success: true, message: 'Post and its comments deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all comments
// @route   GET /api/admin/comments
// @access  Private/Admin
export const getComments = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const query = {};
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const comments = await Comment.find(query)
      .populate('userId', 'fullName email avatar')
      .populate('postId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/admin/comments/:id
// @access  Private/Admin
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    await Comment.findByIdAndDelete(req.params.id);

    // Update comment counts on post
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

    await ActivityLog.create({
      adminId: req.user._id,
      action: 'Comment Deleted',
      targetId: comment._id,
      targetType: 'Comment',
    });

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({})
      .populate('reportedBy', 'fullName email avatar')
      .populate('reviewedBy', 'fullName email')
      .populate({
        path: 'contentId',
        select: 'title content'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PATCH /api/admin/reports/:id
// @access  Private/Admin
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['Resolved', 'Ignored'].includes(status)) {
      res.status(400);
      throw new Error('Please specify a valid status (Resolved, Ignored)');
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404);
      throw new Error('Report not found');
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    await report.save();

    await ActivityLog.create({
      adminId: req.user._id,
      action: `Report ${report._id} marked as ${status}`,
      targetId: report._id,
      targetType: 'Report',
    });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Create content report
// @route   POST /api/admin/reports (Public to authenticated students)
// @access  Private
export const createReport = async (req, res, next) => {
  try {
    const { contentType, contentId, reason } = req.body;
    if (!contentType || !contentId || !reason) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    // Verify target content exists
    if (contentType === 'Post') {
      const p = await Post.findById(contentId);
      if (!p) {
        res.status(404);
        throw new Error('Post not found');
      }
    } else if (contentType === 'Comment') {
      const c = await Comment.findById(contentId);
      if (!c) {
        res.status(404);
        throw new Error('Comment not found');
      }
    } else {
      res.status(400);
      throw new Error('Invalid contentType');
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      contentType,
      contentId,
      reason,
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res, next) => {
  try {
    // 1. User registrations analytics (last 10 days)
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const dailyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: tenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format daily registrations list
    const userAnalytics = dailyRegistrations.map((item) => ({
      date: item._id,
      registrations: item.count,
    }));

    // 2. Community Analytics
    const postsCount = await Post.countDocuments();
    const commentsCount = await Comment.countDocuments();
    
    // Total Likes sum
    const postLikesSum = await Post.aggregate([
      { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } }
    ]);
    const totalLikes = postLikesSum[0]?.totalLikes || 0;

    const communityAnalytics = [
      { name: 'Posts', value: postsCount },
      { name: 'Comments', value: commentsCount },
      { name: 'Likes', value: totalLikes },
    ];

    // 3. Module Usage Analytics
    const resumeUsage = await Resume.countDocuments();
    const attendanceUsage = await Attendance.countDocuments();
    const assignmentUsage = await Assignment.countDocuments();
    const examUsage = await Exam.countDocuments();
    const expenseUsage = await Expense.countDocuments();

    const moduleUsageAnalytics = [
      { name: 'Resume Builder', value: resumeUsage },
      { name: 'Attendance', value: attendanceUsage },
      { name: 'Assignments', value: assignmentUsage },
      { name: 'Exams', value: examUsage },
      { name: 'Expenses', value: expenseUsage },
    ].filter(m => m.value > 0);

    // 4. Growth Analytics (Monthly Registrations over last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const monthlyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const growthAnalytics = monthlyRegistrations.map(item => ({
      month: item._id,
      users: item.users,
      engagement: Math.round(item.users * 1.5), // simulated engagement metrics
    }));

    res.status(200).json({
      success: true,
      data: {
        userAnalytics,
        communityAnalytics,
        moduleUsageAnalytics,
        growthAnalytics,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
// @access  Private/Admin
export const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({})
      .populate('adminId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(50); // limit to last 50 entries to keep it optimized

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
