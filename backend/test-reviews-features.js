import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Review from './models/Review.js';
import Feedback from './models/Feedback.js';
import {
  getReviews,
  getFeaturedReviews,
  getReviewStats,
  submitReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  submitFeedback,
  getFeedbacks,
  deleteFeedback,
  getAdminReviews,
  approveReview,
  rejectReview,
  toggleFeatureReview,
  getReviewAnalytics,
  getMyReview
} from './controllers/reviewController.js';

dotenv.config();

// Helper to create mocked Express response object
const makeMockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

// Error helper
const nextMock = (err) => {
  if (err) {
    console.error('Express Error Handler caught:', err);
    throw err;
  }
};

const runSuite = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentsphere');
    console.log('Connected.');

    // Find our admin user (should have admin role or we set it)
    const email = 'skg9199725658@gmail.com';
    let adminUser = await User.findOne({ email });
    if (!adminUser) {
      // create fallback admin user
      adminUser = await User.create({
        fullName: 'Sonu Gupta',
        email,
        password: 'Password123!',
        provider: 'local',
        role: 'admin',
        status: 'Active',
      });
      console.log(`✔ Created fallback admin user: ${adminUser.fullName}`);
    } else {
      adminUser.role = 'admin';
      await adminUser.save();
    }

    // Create a regular student user for testing
    const studentUser = await User.create({
      fullName: 'Test Student Reviewer',
      email: 'test.reviewer@studentsphere.ai',
      password: 'Password123!',
      provider: 'local',
      role: 'student',
      status: 'Active',
    });
    console.log(`✔ Created test student: ${studentUser.fullName} (${studentUser._id})`);

    const studentReqMock = {
      user: studentUser,
      query: {},
      params: {},
    };

    const adminReqMock = {
      user: adminUser,
      query: {},
      params: {},
    };

    // --- STEP 1: Submit Review ---
    console.log('\n--- Step 1: Submitting student review ---');
    const resSubmit = makeMockRes();
    await submitReview(
      {
        ...studentReqMock,
        body: {
          rating: 5,
          title: 'Excellent Productivity Hub',
          description: 'This MERN application has really helped me streamline my exam preparation and coding logs.',
          recommend: true,
          isAnonymous: false,
        },
      },
      resSubmit,
      nextMock
    );

    if (resSubmit.statusCode !== 201 || !resSubmit.jsonData.success) {
      throw new Error(`Failed to submit review, status: ${resSubmit.statusCode}`);
    }
    const createdReview = resSubmit.jsonData.data;
    console.log(`✔ Review submitted. ID: ${createdReview._id}, Status: ${createdReview.status}`);

    // --- STEP 2: Fetch Student's Own Review ---
    console.log('\n--- Step 2: Fetching my review ---');
    const resMyReview = makeMockRes();
    await getMyReview(studentReqMock, resMyReview, nextMock);
    
    if (resMyReview.statusCode !== 200 || !resMyReview.jsonData.success) {
      throw new Error(`Failed to fetch my review, status: ${resMyReview.statusCode}`);
    }
    console.log(`✔ My review retrieved: "${resMyReview.jsonData.data.title}"`);

    // --- STEP 3: Admin Moderation Fetch Queue ---
    console.log('\n--- Step 3: Fetching admin moderation queue ---');
    const resAdminQueue = makeMockRes();
    await getAdminReviews(adminReqMock, resAdminQueue, nextMock);

    const adminReviews = resAdminQueue.jsonData.data;
    console.log(`✔ Admin review queue fetched. Total reviews in queue: ${adminReviews.length}`);
    const foundReview = adminReviews.find((r) => r._id.toString() === createdReview._id.toString());
    if (!foundReview) {
      throw new Error('Submitted review not found in admin moderation queue');
    }
    console.log(`✔ Submitted review verified in queue. Status: ${foundReview.status}`);

    // --- STEP 4: Approve Review ---
    console.log('\n--- Step 4: Approving student review ---');
    const resApprove = makeMockRes();
    await approveReview(
      {
        ...adminReqMock,
        params: { id: createdReview._id },
      },
      resApprove,
      nextMock
    );

    if (resApprove.statusCode !== 200 || !resApprove.jsonData.success) {
      throw new Error(`Failed to approve review, status: ${resApprove.statusCode}`);
    }
    console.log(`✔ Review approved. New status: ${resApprove.jsonData.data.status}`);

    // --- STEP 5: Toggle Featured Review ---
    console.log('\n--- Step 5: Featuring student review ---');
    const resFeature = makeMockRes();
    await toggleFeatureReview(
      {
        ...adminReqMock,
        params: { id: createdReview._id },
      },
      resFeature,
      nextMock
    );

    if (resFeature.statusCode !== 200 || !resFeature.jsonData.success) {
      throw new Error(`Failed to feature review, status: ${resFeature.statusCode}`);
    }
    console.log(`✔ Review featured. featured: ${resFeature.jsonData.data.featured}`);

    // --- STEP 6: Public Reviews Fetch (Search/Filter) ---
    console.log('\n--- Step 6: Verifying public review display, stats, and featured lists ---');
    
    // Stats
    const resStats = makeMockRes();
    await getReviewStats({}, resStats, nextMock);
    console.log(`✔ Stats: Avg Rating: ${resStats.jsonData.data.averageRating}, Total Reviews: ${resStats.jsonData.data.totalReviews}`);
    
    // Featured
    const resFeatured = makeMockRes();
    await getFeaturedReviews({}, resFeatured, nextMock);
    console.log(`✔ Featured reviews list size: ${resFeatured.jsonData.data.length}`);
    if (!resFeatured.jsonData.data.some((r) => r._id.toString() === createdReview._id.toString())) {
      throw new Error('Featured review not in featured reviews list');
    }

    // Public list
    const resPublic = makeMockRes();
    await getReviews(
      {
        query: { search: 'Productivity', rating: 5 },
      },
      resPublic,
      nextMock
    );
    console.log(`✔ Public review list query success. Found matching: ${resPublic.jsonData.data.reviews.length}`);

    // --- STEP 7: Mark Helpful (Vote Toggle) ---
    console.log('\n--- Step 7: Voting review as helpful ---');
    const resHelpful = makeMockRes();
    await toggleHelpful(
      {
        user: adminUser,
        params: { id: createdReview._id },
      },
      resHelpful,
      nextMock
    );

    if (resHelpful.statusCode !== 200 || !resHelpful.jsonData.success) {
      throw new Error(`Failed to vote helpful, status: ${resHelpful.statusCode}`);
    }
    console.log(`✔ Helpful vote registered. Helpful count: ${resHelpful.jsonData.data.helpfulCount}`);

    // --- STEP 8: Feedback Submission & Logging ---
    console.log('\n--- Step 8: Submitting private feedback ---');
    const resFeedback = makeMockRes();
    await submitFeedback(
      {
        ...studentReqMock,
        body: {
          subject: 'Sidebar link misalignment',
          feedbackType: 'Bug Report',
          message: 'The sidebar item for CGPA predictor overflows on iPhone SE screen size.',
        },
      },
      resFeedback,
      nextMock
    );

    if (resFeedback.statusCode !== 201 || !resFeedback.jsonData.success) {
      throw new Error(`Failed to submit feedback, status: ${resFeedback.statusCode}`);
    }
    const createdFeedback = resFeedback.jsonData.data;
    console.log(`✔ Feedback log submitted. ID: ${createdFeedback._id}`);

    // Fetch feedback as admin
    const resGetFeedbacks = makeMockRes();
    await getFeedbacks(adminReqMock, resGetFeedbacks, nextMock);
    console.log(`✔ Admin feedback log retrieval success. Logs count: ${resGetFeedbacks.jsonData.data.length}`);
    if (!resGetFeedbacks.jsonData.data.some((f) => f._id.toString() === createdFeedback._id.toString())) {
      throw new Error('Submitted feedback not found in admin logs list');
    }

    // --- STEP 9: Review Analytics ---
    console.log('\n--- Step 9: Querying reviews admin analytics ---');
    const resAnalytics = makeMockRes();
    await getReviewAnalytics(adminReqMock, resAnalytics, nextMock);
    const analytics = resAnalytics.jsonData.data;
    console.log(`✔ Reviews analytics summary retrieved. Total Reviews: ${analytics.summary.totalReviews}`);
    console.log(`✔ Distribution: ${JSON.stringify(analytics.ratingDistribution)}`);

    // --- CLEANUP & TEARDOWN ---
    console.log('\n--- Cleanup: Purging test reviewer, reviews, and feedback logs ---');
    await User.findByIdAndDelete(studentUser._id);
    await Review.findByIdAndDelete(createdReview._id);
    await Feedback.findByIdAndDelete(createdFeedback._id);
    console.log('✔ DB cleanups completed.');

    console.log('\n======================================================');
    console.log('🎉 REVIEWS & FEEDBACK CORE APIS VERIFIED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Reviews Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
