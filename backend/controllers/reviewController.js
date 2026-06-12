import Review from '../models/Review.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendNotification } from '../utils/socket.js';

// Helper: Notify admins of new reviews
const notifyAdminsOfNewReview = async (review, sender) => {
  try {
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin._id,
        senderId: sender._id,
        title: 'New Review Submitted',
        message: `${sender.fullName} has submitted a review: "${review.title}"`,
        type: 'announcement',
        relatedId: review._id,
      });

      const senderPayload = { fullName: sender.fullName, avatar: sender.avatar };
      sendNotification(admin._id, 'new_notification', {
        ...notification.toJSON(),
        senderId: senderPayload,
      });
    }
  } catch (error) {
    console.error('Error sending admin notifications:', error);
  }
};

// Helper: Notify user of review status update
const notifyUserOfReviewStatus = async (review, status, adminId) => {
  try {
    const admin = await User.findById(adminId).select('fullName avatar');
    const isApproved = status === 'Approved';
    const notification = await Notification.create({
      userId: review.userId,
      senderId: adminId,
      title: isApproved ? 'Review Approved' : 'Review Rejected',
      message: isApproved
        ? 'Your review of StudentSphere AI has been approved and is now public! Thank you for sharing.'
        : 'Your review of StudentSphere AI was rejected by the moderation team.',
      type: 'announcement',
      relatedId: review._id,
    });

    const senderPayload = admin ? { fullName: admin.fullName, avatar: admin.avatar } : null;
    sendNotification(review.userId, 'new_notification', {
      ...notification.toJSON(),
      senderId: senderPayload,
    });
  } catch (error) {
    console.error('Error sending user notification:', error);
  }
};

// ==========================================
// PUBLIC CONTROLLERS
// ==========================================

// @desc    Get all approved reviews with filters and pagination
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const rating = req.query.rating || '';
    const sort = req.query.sort || 'latest';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const query = { status: 'Approved' };

    if (rating) {
      query.rating = Number(rating);
    }

    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'oldest') {
      sortQuery = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortQuery = { rating: -1, createdAt: -1 };
    }

    // We get total matching approved reviews count
    let reviews = await Review.find({ ...query, ...searchFilter })
      .populate('userId', 'fullName avatar')
      .sort(sortQuery);

    // If search text was entered, we also try to filter by populated user name if user not anonymous
    if (search) {
      reviews = reviews.filter((review) => {
        const titleMatch = review.title.toLowerCase().includes(search.toLowerCase());
        const descMatch = review.description.toLowerCase().includes(search.toLowerCase());
        const userMatch =
          review.userId &&
          !review.isAnonymous &&
          review.userId.fullName.toLowerCase().includes(search.toLowerCase());
        return titleMatch || descMatch || userMatch;
      });
    }

    const total = reviews.length;
    const startIndex = (page - 1) * limit;
    const paginatedReviews = reviews.slice(startIndex, startIndex + limit);

    // Censor anonymous reviews
    const formattedReviews = paginatedReviews.map((review) => {
      const reviewObj = review.toJSON();
      if (reviewObj.isAnonymous) {
        reviewObj.userId = {
          _id: null,
          fullName: 'Anonymous Student',
          avatar: `https://ui-avatars.com/api/?name=Anonymous+Student&background=6b7280&color=fff`,
        };
      }
      return reviewObj;
    });

    res.status(200).json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured reviews (maximum 6)
// @route   GET /api/reviews/featured
// @access  Public
export const getFeaturedReviews = async (req, res, next) => {
  try {
    const featuredReviews = await Review.find({ status: 'Approved', featured: true })
      .populate('userId', 'fullName avatar')
      .limit(6);

    const formattedReviews = featuredReviews.map((review) => {
      const reviewObj = review.toJSON();
      if (reviewObj.isAnonymous) {
        reviewObj.userId = {
          _id: null,
          fullName: 'Anonymous Student',
          avatar: `https://ui-avatars.com/api/?name=Anonymous+Student&background=6b7280&color=fff`,
        };
      }
      return reviewObj;
    });

    res.status(200).json({
      success: true,
      data: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get review statistics (rating averages, counts, distributions)
// @route   GET /api/reviews/stats
// @access  Public
export const getReviewStats = async (req, res, next) => {
  try {
    const totalApproved = await Review.countDocuments({ status: 'Approved' });

    // Aggregate rating counts
    const aggregations = await Review.aggregate([
      { $match: { status: 'Approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalRatingSum = 0;

    aggregations.forEach((agg) => {
      if (distribution[agg._id] !== undefined) {
        distribution[agg._id] = agg.count;
        totalRatingSum += agg._id * agg.count;
      }
    });

    const averageRating = totalApproved > 0 ? parseFloat((totalRatingSum / totalApproved).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalReviews: totalApproved,
        averageRating,
        distribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// AUTHENTICATED USER CONTROLLERS
// ==========================================

// @desc    Get current user's review if any
// @route   GET /api/reviews/my-review
// @access  Private
export const getMyReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ userId: req.user._id });
    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a review (creates if none exists, or updates)
// @route   POST /api/reviews
// @access  Private
export const submitReview = async (req, res, next) => {
  try {
    const { rating, title, description, recommend, isAnonymous } = req.body;

    if (!rating || !title || !description) {
      res.status(400);
      throw new Error('Please provide all required fields: rating, title, and description');
    }

    if (rating < 1 || rating > 5) {
      res.status(400);
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if review already exists for user
    let review = await Review.findOne({ userId: req.user._id });

    if (review) {
      // Update existing
      review.rating = rating;
      review.title = title;
      review.description = description;
      review.recommend = recommend !== undefined ? recommend : review.recommend;
      review.isAnonymous = isAnonymous !== undefined ? isAnonymous : review.isAnonymous;
      review.status = 'Pending'; // Reset to pending for approval
      await review.save();
    } else {
      // Create new
      review = await Review.create({
        userId: req.user._id,
        rating,
        title,
        description,
        recommend,
        isAnonymous,
        status: 'Pending',
      });
    }

    // Notify administrators
    await notifyAdminsOfNewReview(review, req.user);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res, next) => {
  try {
    const { rating, title, description, recommend, isAnonymous } = req.body;

    let review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Check ownership
    if (review.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You are not authorized to update this review');
    }

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.description = description || review.description;
    review.recommend = recommend !== undefined ? recommend : review.recommend;
    review.isAnonymous = isAnonymous !== undefined ? isAnonymous : review.isAnonymous;
    review.status = 'Pending'; // require re-moderation

    await review.save();

    // Notify administrators
    await notifyAdminsOfNewReview(review, req.user);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully and is pending moderation approval',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Owner or admin can delete
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this review');
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as helpful (Toggle)
// @route   POST /api/reviews/helpful/:id
// @access  Private
export const toggleHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    const userId = req.user._id;
    const hasVoted = review.helpfulVotes.includes(userId);

    if (hasVoted) {
      // Pull vote
      review.helpfulVotes = review.helpfulVotes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Push vote
      review.helpfulVotes.push(userId);
    }

    review.helpfulCount = review.helpfulVotes.length;
    await review.save();

    res.status(200).json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        hasVoted: !hasVoted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FEEDBACK CONTROLLERS
// ==========================================

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
export const submitFeedback = async (req, res, next) => {
  try {
    const { subject, feedbackType, message } = req.body;

    if (!subject || !feedbackType || !message) {
      res.status(400);
      throw new Error('Please fill in all feedback fields: subject, feedbackType, message');
    }

    const feedback = await Feedback.create({
      userId: req.user._id,
      subject,
      feedbackType,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! It has been securely sent to our support team.',
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all feedback logs (Admin only)
// @route   GET /api/feedback
// @access  Private/Admin
export const getFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({})
      .populate('userId', 'fullName email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete feedback (Admin only)
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
export const deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      res.status(404);
      throw new Error('Feedback log not found');
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Feedback log deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN MODERATION CONTROLLERS
// ==========================================

// @desc    Get all reviews for moderation (Admin only)
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getAdminReviews = async (req, res, next) => {
  try {
    const status = req.query.status || '';
    const search = req.query.search || '';

    const query = {};
    if (status) {
      query.status = status;
    }

    let reviews = await Review.find(query)
      .populate('userId', 'fullName email avatar')
      .sort({ createdAt: -1 });

    if (search) {
      reviews = reviews.filter((review) => {
        const titleMatch = review.title.toLowerCase().includes(search.toLowerCase());
        const descMatch = review.description.toLowerCase().includes(search.toLowerCase());
        const userMatch =
          review.userId &&
          review.userId.fullName.toLowerCase().includes(search.toLowerCase());
        return titleMatch || descMatch || userMatch;
      });
    }

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve review
// @route   PATCH /api/admin/reviews/approve/:id
// @access  Private/Admin
export const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    review.status = 'Approved';
    await review.save();

    // Notify user of approval
    await notifyUserOfReviewStatus(review, 'Approved', req.user._id);

    res.status(200).json({
      success: true,
      message: 'Review approved successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject review
// @route   PATCH /api/admin/reviews/reject/:id
// @access  Private/Admin
export const rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    review.status = 'Rejected';
    review.featured = false; // Cannot feature a rejected review
    await review.save();

    // Notify user of rejection
    await notifyUserOfReviewStatus(review, 'Rejected', req.user._id);

    res.status(200).json({
      success: true,
      message: 'Review rejected successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle feature review status (Max 6 featured reviews)
// @route   PATCH /api/admin/reviews/feature/:id
// @access  Private/Admin
export const toggleFeatureReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    if (review.status !== 'Approved') {
      res.status(400);
      throw new Error('Only approved reviews can be featured');
    }

    if (!review.featured) {
      // Check feature limit
      const featuredCount = await Review.countDocuments({ featured: true });
      if (featuredCount >= 6) {
        res.status(400);
        throw new Error('Maximum of 6 featured reviews reached. Unfeature another review first.');
      }
    }

    review.featured = !review.featured;
    await review.save();

    res.status(200).json({
      success: true,
      message: review.featured ? 'Review marked as featured' : 'Review removed from featured list',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get review analytics summary
// @route   GET /api/admin/reviews/analytics
// @access  Private/Admin
export const getReviewAnalytics = async (req, res, next) => {
  try {
    // Basic counts
    const totalReviews = await Review.countDocuments();
    const pendingReviews = await Review.countDocuments({ status: 'Pending' });
    const approvedReviews = await Review.countDocuments({ status: 'Approved' });
    const rejectedReviews = await Review.countDocuments({ status: 'Rejected' });

    // Average rating
    const approvedList = await Review.find({ status: 'Approved' });
    const averageRating =
      approvedList.length > 0
        ? parseFloat((approvedList.reduce((acc, curr) => acc + curr.rating, 0) / approvedList.length).toFixed(1))
        : 0;

    // Monthly ratings trend (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyStats = await Review.aggregate([
      {
        $match: {
          status: 'Approved',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate full list of last 6 months in order
    const monthlyRatings = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed for matching aggregation group
      
      const matched = monthlyStats.find(m => m._id.year === year && m._id.month === month);
      monthlyRatings.push({
        month: `${monthNames[d.getMonth()]} ${year}`,
        avgRating: matched ? parseFloat(matched.avgRating.toFixed(1)) : 0,
        count: matched ? matched.count : 0,
      });
    }

    // Rating distribution
    const distributionAgg = await Review.aggregate([
      { $match: { status: 'Approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingDistribution = [
      { rating: '5 Stars', count: 0 },
      { rating: '4 Stars', count: 0 },
      { rating: '3 Stars', count: 0 },
      { rating: '2 Stars', count: 0 },
      { rating: '1 Star', count: 0 },
    ];

    distributionAgg.forEach(item => {
      const index = 5 - item._id;
      if (ratingDistribution[index]) {
        ratingDistribution[index].count = item.count;
      }
    });

    // Review status distribution (for Pie Chart)
    const reviewStatusDistribution = [
      { name: 'Approved', value: approvedReviews },
      { name: 'Pending', value: pendingReviews },
      { name: 'Rejected', value: rejectedReviews },
    ];

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReviews,
          pendingReviews,
          approvedReviews,
          rejectedReviews,
          averageRating,
        },
        monthlyRatings,
        ratingDistribution,
        reviewStatusDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};
