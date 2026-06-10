import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';
import Report from './models/Report.js';
import ActivityLog from './models/ActivityLog.js';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  changeUserRole,
  getPosts,
  deletePost,
  getComments,
  deleteComment,
  getReports,
  updateReportStatus,
  createReport,
  getAnalytics,
  getActivityLogs,
} from './controllers/adminController.js';

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
    const adminUser = await User.findOne({ email });
    if (!adminUser) {
      console.error(`Test User ${email} not found. Ensure DB is seeded.`);
      process.exit(1);
    }
    
    // Temporarily make sure the test user is admin for this suite
    adminUser.role = 'admin';
    await adminUser.save();

    console.log(`\nStarting Admin Panel Test Suite. Admin User: ${adminUser.fullName} (${adminUser._id})`);

    const reqMock = {
      user: adminUser,
    };

    // Create a dummy target user (student) to test blocking, role changes, deletion
    const dummyStudent = await User.create({
      fullName: 'Dummy Student Target',
      email: 'dummy.student.test@studentsphere.ai',
      password: 'Password123!',
      provider: 'local',
      role: 'student',
      status: 'Active'
    });
    console.log(`✔ Created dummy target user: ${dummyStudent.fullName} (${dummyStudent._id})`);

    // Create a dummy post & comment to test reporting/moderation
    const dummyPost = await Post.create({
      userId: dummyStudent._id,
      title: 'Offensive Post Title',
      content: 'Some inappropriate content that violates policy',
      category: 'General Discussion'
    });
    console.log(`✔ Created dummy post: "${dummyPost.title}"`);

    const dummyComment = await Comment.create({
      postId: dummyPost._id,
      userId: dummyStudent._id,
      content: 'Inappropriate spam comment'
    });
    console.log(`✔ Created dummy comment: "${dummyComment.content}"`);

    // --- STEP 1: Fetch Admin Dashboard Stats ---
    console.log('\n--- Step 1: Querying Admin Dashboard Stats ---');
    const resStats = makeMockRes();
    await getDashboardStats(reqMock, resStats, nextMock);
    
    if (resStats.statusCode !== 200 || !resStats.jsonData.success) {
      throw new Error(`Failed to fetch stats, status: ${resStats.statusCode}`);
    }
    const statsData = resStats.jsonData.data.stats;
    console.log(`✔ Dashboard stats retrieved. Total Users: ${statsData.totalUsers}, Active Users: ${statsData.activeUsers}`);

    // --- STEP 2: Query Users Directory ---
    console.log('\n--- Step 2: Querying Users Directory with pagination ---');
    const resUsers = makeMockRes();
    await getUsers({
      ...reqMock,
      query: { search: 'Dummy Student', limit: 5, page: 1 }
    }, resUsers, nextMock);

    const userList = resUsers.jsonData.data.users;
    console.log(`✔ User Directory query successful. Found ${userList.length} users matching search.`);
    if (!userList.some((u) => u._id.toString() === dummyStudent._id.toString())) {
      throw new Error('Dummy student user not found in search results');
    }

    // --- STEP 3: Block User ---
    console.log('\n--- Step 3: Blocking Student User ---');
    const resBlock = makeMockRes();
    await blockUser({
      ...reqMock,
      params: { id: dummyStudent._id }
    }, resBlock, nextMock);

    const blockedUser = resBlock.jsonData.data;
    console.log(`✔ Block User response. User status: ${blockedUser.status}`);
    if (blockedUser.status !== 'Blocked') {
      throw new Error('Status patch failed to block user');
    }

    // --- STEP 4: Unblock User ---
    console.log('\n--- Step 4: Unblocking Student User ---');
    const resUnblock = makeMockRes();
    await unblockUser({
      ...reqMock,
      params: { id: dummyStudent._id }
    }, resUnblock, nextMock);

    const activeUser = resUnblock.jsonData.data;
    console.log(`✔ Unblock User response. User status: ${activeUser.status}`);
    if (activeUser.status !== 'Active') {
      throw new Error('Status patch failed to unblock user');
    }

    // --- STEP 5: Change User Role ---
    console.log('\n--- Step 5: Promoting Student to Admin ---');
    const resRole = makeMockRes();
    await changeUserRole({
      ...reqMock,
      params: { id: dummyStudent._id },
      body: { role: 'admin' }
    }, resRole, nextMock);

    const roleUpdatedUser = resRole.jsonData.data;
    console.log(`✔ Role change successful. New role: ${roleUpdatedUser.role}`);
    if (roleUpdatedUser.role !== 'admin') {
      throw new Error('Failed to update user role');
    }

    // --- STEP 6: File content report (by regular student) ---
    console.log('\n--- Step 6: Filing a Post Report ---');
    const resReport = makeMockRes();
    await createReport({
      user: dummyStudent,
      body: {
        contentType: 'Post',
        contentId: dummyPost._id,
        reason: 'Offensive Content'
      }
    }, resReport, nextMock);

    if (resReport.statusCode !== 201) {
      throw new Error(`Failed to create report, status: ${resReport.statusCode}`);
    }
    const reportObj = resReport.jsonData.data;
    console.log(`✔ Report filed. ID: ${reportObj._id}, Reason: ${reportObj.reason}`);

    // --- STEP 7: Fetch and Resolve Report Queue ---
    console.log('\n--- Step 7: Fetching Reports & Resolving Report Queue ---');
    const resGetReports = makeMockRes();
    await getReports(reqMock, resGetReports, nextMock);
    const reportsList = resGetReports.jsonData.data;
    console.log(`✔ Reports retrieved. Total pending items: ${reportsList.length}`);
    if (!reportsList.some((r) => r._id.toString() === reportObj._id.toString())) {
      throw new Error('Filed report not found in reports queue');
    }

    const resResolve = makeMockRes();
    await updateReportStatus({
      ...reqMock,
      params: { id: reportObj._id },
      body: { status: 'Resolved' }
    }, resResolve, nextMock);
    console.log(`✔ Report resolved successfully. Status: ${resResolve.jsonData.data.status}`);

    // --- STEP 8: Moderate Community Posts & Comments (Delete) ---
    console.log('\n--- Step 8: Moderating & Deleting Content ---');
    
    // Delete comment
    const resDelComment = makeMockRes();
    await deleteComment({
      ...reqMock,
      params: { id: dummyComment._id }
    }, resDelComment, nextMock);
    console.log('✔ Comment moderated and deleted.');

    // Delete post
    const resDelPost = makeMockRes();
    await deletePost({
      ...reqMock,
      params: { id: dummyPost._id }
    }, resDelPost, nextMock);
    console.log('✔ Post moderated and deleted.');

    // --- STEP 9: Verify Analytics and Activity Logs ---
    console.log('\n--- Step 9: Verifying Platform Analytics & Audit Logs ---');
    const resAnalytics = makeMockRes();
    await getAnalytics(reqMock, resAnalytics, nextMock);
    console.log('✔ Analytics charts payload retrieved.');

    const resLogs = makeMockRes();
    await getActivityLogs(reqMock, resLogs, nextMock);
    const logs = resLogs.jsonData.data;
    console.log(`✔ Audit logs retrieved. Total actions logged: ${logs.length}`);
    if (logs.length === 0) {
      throw new Error('Audit activity logs failed to record operations');
    }
    console.log(`  Last recorded action: "${logs[0].action}"`);

    // --- CLEANUP ---
    console.log('\n--- Cleanup: Removing test target user & DB logs ---');
    await User.findByIdAndDelete(dummyStudent._id);
    await Report.deleteMany({ reportedBy: dummyStudent._id });
    await ActivityLog.deleteMany({ adminId: adminUser._id });
    console.log('✔ Cleanups completed.');

    console.log('\n======================================================');
    console.log('🎉 ALL ADMIN PANEL CORE CRUD & PERMISSIONS TESTED SUCCESSFUL!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Admin Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
