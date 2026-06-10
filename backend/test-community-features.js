import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import User from './models/User.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';
import Discussion from './models/Discussion.js';
import Notification from './models/Notification.js';
import {
  getPosts,
  getTrendingPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  pinPost,
  getComments,
  addComment,
  deleteComment,
  togglePostLike,
  toggleCommentLike,
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  addDiscussionReply,
  deleteDiscussion,
  getNotifications,
  markNotificationsRead,
  getUserProfile,
  toggleFollow,
  getCommunityAnalytics,
  getReputationLevel,
} from './controllers/communityController.js';

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

    const email = 'skg9199725658@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`Test User ${email} not found. Ensure DB is seeded.`);
      process.exit(1);
    }
    console.log(`\nStarting Test Suite for Main User: ${user.fullName} (${user._id})`);

    // Create or find dummy target user for follows
    let dummyUser = await User.findOne({ email: 'dummy_target@test.com' });
    if (!dummyUser) {
      dummyUser = await User.create({
        fullName: 'Dummy Target Student',
        email: 'dummy_target@test.com',
        password: 'password123',
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      });
      console.log(`Created dummy target user: ${dummyUser.fullName} (${dummyUser._id})`);
    }

    const reqMock = {
      user,
      protocol: 'http',
      get(name) {
        if (name === 'host') return 'localhost:5000';
        return '';
      }
    };

    const targetReqMock = {
      user: dummyUser,
      protocol: 'http',
      get(name) {
        if (name === 'host') return 'localhost:5000';
        return '';
      }
    };

    // Reset old community data for clean test runs
    await Post.deleteMany({ userId: { $in: [user._id, dummyUser._id] } });
    await Comment.deleteMany({ userId: { $in: [user._id, dummyUser._id] } });
    await Discussion.deleteMany({ userId: { $in: [user._id, dummyUser._id] } });
    await Notification.deleteMany({ userId: { $in: [user._id, dummyUser._id] } });

    // Reset user reputations
    user.reputationPoints = 0;
    await user.save();
    dummyUser.reputationPoints = 0;
    await dummyUser.save();

    // Make sure upload community directory exists
    const commDir = './uploads/community';
    if (!fs.existsSync(commDir)) {
      fs.mkdirSync(commDir, { recursive: true });
    }

    // Write dummy community file
    fs.writeFileSync('./uploads/community/test-community-file.jpg', 'fake file content');

    // --- STEP 1: CREATE POST (DRAFT & PUBLISH) ---
    console.log('\n--- Step 1: Creating Posts ---');
    const resPostDraft = makeMockRes();
    await createPost({
      ...reqMock,
      body: {
        title: 'DBMS Joins complete guide',
        content: 'This post covers inner, outer, left, right and cross joins.',
        category: 'Academics',
        tags: 'dbms, academics, exam',
        isAnonymous: false,
        status: 'draft',
      }
    }, resPostDraft, nextMock);

    if (resPostDraft.statusCode !== 201) {
      throw new Error(`Failed to create draft post, status: ${resPostDraft.statusCode}`);
    }
    const draftPost = resPostDraft.jsonData.data;
    console.log(`✔ Created draft post. ID: ${draftPost._id}. Status: ${draftPost.status}`);

    // Verify reputation was NOT awarded for drafts
    let freshUser = await User.findById(user._id);
    console.log(`  User reputation points for draft: ${freshUser.reputationPoints} (Expected: 0)`);
    if (freshUser.reputationPoints !== 0) {
      throw new Error('Reputation points awarded for draft posts!');
    }

    // Create Published Post
    const resPostPub = makeMockRes();
    const createPubReq = {
      ...reqMock,
      file: {
        fieldname: 'attachment',
        originalname: 'joins_cheatsheet.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: './uploads/community',
        filename: 'test-community-file.jpg',
        path: './uploads/community/test-community-file.jpg',
        size: 5120, // 5KB
      },
      body: {
        title: 'React Hooks Cheat Sheet',
        content: 'Comprehensive overview of useState, useEffect, useContext, useMemo, and custom hooks.',
        category: 'Programming',
        tags: 'react, webdev, hooks',
        isAnonymous: false,
        status: 'published',
      }
    };
    await createPost(createPubReq, resPostPub, nextMock);

    if (resPostPub.statusCode !== 201) {
      throw new Error(`Failed to create published post, status: ${resPostPub.statusCode}`);
    }
    const pubPost = resPostPub.jsonData.data;
    console.log(`✔ Created published post. ID: ${pubPost._id}. Status: ${pubPost.status}. Attachment: ${pubPost.attachments[0].name}`);

    // Verify reputation points awarded (+5)
    freshUser = await User.findById(user._id);
    console.log(`  User reputation points: ${freshUser.reputationPoints} (Expected: 5). Tier: ${getReputationLevel(freshUser.reputationPoints)}`);
    if (freshUser.reputationPoints !== 5) {
      throw new Error(`Reputation points mismatch. Expected 5, found ${freshUser.reputationPoints}`);
    }

    // --- STEP 2: LIKE THE PUBLISHED POST (USING TARGET USER) ---
    console.log('\n--- Step 2: Liking Post (Target User) ---');
    const resLike = makeMockRes();
    await togglePostLike({
      ...targetReqMock,
      params: { id: pubPost._id }
    }, resLike, nextMock);

    if (resLike.statusCode !== 200) {
      throw new Error(`Failed to like post, status: ${resLike.statusCode}`);
    }
    console.log(`✔ Post liked. Total likes: ${resLike.jsonData.likesCount}. isLiked: ${resLike.jsonData.isLiked}`);

    // Verify reputation points awarded to post author (+2 points for post like)
    freshUser = await User.findById(user._id);
    console.log(`  Author reputation points: ${freshUser.reputationPoints} (Expected: 7)`);
    if (freshUser.reputationPoints !== 7) {
      throw new Error(`Reputation points mismatch. Expected 7, found ${freshUser.reputationPoints}`);
    }

    // Verify notification was created
    const notifications = await Notification.find({ userId: user._id });
    console.log(`✔ Notifications triggered: ${notifications.length} (Expected: 1)`);
    console.log(`  Notification content: "${notifications[0].title}: ${notifications[0].message}"`);
    if (notifications.length !== 1 || notifications[0].type !== 'like_post') {
      throw new Error('Notification verification failed for post like.');
    }

    // --- STEP 3: NESTED COMMENTS AND REPLIES ---
    console.log('\n--- Step 3: Commenting & Replying ---');
    // Add top-level comment
    const resComment1 = makeMockRes();
    await addComment({
      ...targetReqMock,
      body: {
        postId: pubPost._id,
        content: 'This hooks cheat sheet is super helpful! Thanks.',
        isAnonymous: false,
      }
    }, resComment1, nextMock);

    if (resComment1.statusCode !== 201) {
      throw new Error(`Failed to add top-level comment, status: ${resComment1.statusCode}`);
    }
    const comment1 = resComment1.jsonData.data;
    console.log(`✔ Top-level comment added. ID: ${comment1._id}. By: ${comment1.userId.fullName}`);

    // Verify target user gained +2 reputation points for commenting
    const freshTargetUser = await User.findById(dummyUser._id);
    console.log(`  Commenter reputation points: ${freshTargetUser.reputationPoints} (Expected: 2)`);
    if (freshTargetUser.reputationPoints !== 2) {
      throw new Error(`Commenter points mismatch. Expected 2, found ${freshTargetUser.reputationPoints}`);
    }

    // Add nested reply to top-level comment
    const resReply1 = makeMockRes();
    await addComment({
      ...reqMock,
      body: {
        postId: pubPost._id,
        content: 'Glad you found it useful! Let me know if you need examples.',
        parentComment: comment1._id,
        isAnonymous: false,
      }
    }, resReply1, nextMock);

    if (resReply1.statusCode !== 201) {
      throw new Error(`Failed to add nested reply comment, status: ${resReply1.statusCode}`);
    }
    const reply1 = resReply1.jsonData.data;
    console.log(`✔ Nested reply comment added. ID: ${reply1._id}. Parent: ${reply1.parentComment}`);

    // Verify main user gained +2 points for comment reply
    freshUser = await User.findById(user._id);
    console.log(`  Main user reputation points: ${freshUser.reputationPoints} (Expected: 9)`);
    if (freshUser.reputationPoints !== 9) {
      throw new Error(`Main user points mismatch. Expected 9, found ${freshUser.reputationPoints}`);
    }

    // Check post comments count updated
    const freshPostObj = await Post.findById(pubPost._id);
    console.log(`  Post total comments count: ${freshPostObj.commentsCount} (Expected: 2)`);
    if (freshPostObj.commentsCount !== 2) {
      throw new Error(`Comments count mismatch. Expected 2, found ${freshPostObj.commentsCount}`);
    }

    // Toggle Comment Like
    console.log('\n--- Step 4: Liking Comment ---');
    const resCommentLike = makeMockRes();
    await toggleCommentLike({
      ...reqMock,
      params: { id: comment1._id }
    }, resCommentLike, nextMock);

    if (resCommentLike.statusCode !== 200) {
      throw new Error(`Failed to like comment, status: ${resCommentLike.statusCode}`);
    }
    console.log(`✔ Comment liked. total likes: ${resCommentLike.jsonData.likesCount}`);

    // Verify comment author (target user) gained +1 point for comment like
    const freshTargetUserAfterLike = await User.findById(dummyUser._id);
    console.log(`  Commenter reputation points: ${freshTargetUserAfterLike.reputationPoints} (Expected: 3)`);
    if (freshTargetUserAfterLike.reputationPoints !== 3) {
      throw new Error(`Commenter points mismatch after like. Expected 3, found ${freshTargetUserAfterLike.reputationPoints}`);
    }

    // --- STEP 4: LIVE DISCUSSIONS ROOMS ---
    console.log('\n--- Step 5: Live Discussions ---');
    // Create discussion room
    const resDisc = makeMockRes();
    await createDiscussion({
      ...reqMock,
      body: {
        title: 'Placement Prep 2026 Q&A Room',
        content: 'Live discussion regarding upcoming placement calendars, criteria, and interview experiences.',
        category: 'Placement',
      }
    }, resDisc, nextMock);

    if (resDisc.statusCode !== 201) {
      throw new Error(`Failed to create discussion room, status: ${resDisc.statusCode}`);
    }
    const discussion = resDisc.jsonData.data;
    console.log(`✔ Created discussion thread. ID: ${discussion._id}. Title: ${discussion.title}`);

    // Post reply in discussion room (by target user)
    const resDiscReply = makeMockRes();
    await addDiscussionReply({
      ...targetReqMock,
      params: { id: discussion._id },
      body: {
        content: 'Is Google hiring for Graduate Engineers this year?',
      }
    }, resDiscReply, nextMock);

    if (resDiscReply.statusCode !== 201) {
      throw new Error(`Failed to add reply, status: ${resDiscReply.statusCode}`);
    }
    console.log(`✔ Replied in discussion room. Reply: "${resDiscReply.jsonData.content}"`);

    // Verify reply poster (target user) reputation point update (+2 points)
    const freshTargetUserAfterReply = await User.findById(dummyUser._id);
    console.log(`  Commenter reputation points: ${freshTargetUserAfterReply.reputationPoints} (Expected: 5)`);
    if (freshTargetUserAfterReply.reputationPoints !== 5) {
      throw new Error(`Target user points mismatch. Expected 5, found ${freshTargetUserAfterReply.reputationPoints}`);
    }

    // --- STEP 5: PROFILES FOLLOWS ---
    console.log('\n--- Step 6: Profiles Follows ---');
    // Follow target user
    const resFollow = makeMockRes();
    await toggleFollow({
      ...reqMock,
      params: { id: dummyUser._id }
    }, resFollow, nextMock);

    if (resFollow.statusCode !== 200) {
      throw new Error(`Failed to follow, status: ${resFollow.statusCode}`);
    }
    console.log(`✔ Followed target user. isFollowing: ${resFollow.jsonData.isFollowing}`);

    // Verify target user points gained (+5 points)
    const freshTargetUserAfterFollow = await User.findById(dummyUser._id);
    console.log(`  Followed user reputation points: ${freshTargetUserAfterFollow.reputationPoints} (Expected: 10)`);
    if (freshTargetUserAfterFollow.reputationPoints !== 10) {
      throw new Error(`Target user points mismatch. Expected 10, found ${freshTargetUserAfterFollow.reputationPoints}`);
    }

    // Verify profile detail data aggregation
    const resProfile = makeMockRes();
    await getUserProfile({
      ...reqMock,
      params: { id: dummyUser._id }
    }, resProfile, nextMock);
    
    const profile = resProfile.jsonData.data;
    console.log(`✔ Profile retrieved for target user: ${profile.fullName}`);
    console.log(`  Posts count: ${profile.postsCount} (Expected: 0)`);
    console.log(`  Comments count: ${profile.commentsCount} (Expected: 1)`);
    console.log(`  Reputation level badge: ${profile.reputationLevel} (Expected: Beginner)`);

    if (profile.postsCount !== 0 || profile.commentsCount !== 1 || profile.reputationLevel !== 'Beginner') {
      throw new Error('Profile details aggregation check failed.');
    }

    // --- STEP 6: COMMUNITY ANALYTICS GROWTH ---
    console.log('\n--- Step 7: Community Analytics ---');
    const resAnalytics = makeMockRes();
    await getCommunityAnalytics(reqMock, resAnalytics, nextMock);

    if (resAnalytics.statusCode !== 200) {
      throw new Error(`Failed to get analytics, status: ${resAnalytics.statusCode}`);
    }
    const analytics = resAnalytics.jsonData.data;
    console.log('✔ Community analytics compiled.');
    console.log(`  Total published posts: ${analytics.totalPosts} (Expected: 1)`);
    console.log(`  Total comments: ${analytics.totalComments} (Expected: 2)`);
    console.log(`  Total discussions: ${analytics.totalDiscussions} (Expected: 1)`);
    
    // Verify category distribution
    const progDistribution = analytics.postDistribution.find(d => d.name === 'Programming');
    console.log(`  Programming category posts count: ${progDistribution ? progDistribution.value : 0} (Expected: 1)`);
    if (!progDistribution || progDistribution.value !== 1) {
      throw new Error('Analytics category distribution mismatch.');
    }

    // --- STEP 7: CLEANUP ACTIONS ---
    console.log('\n--- Step 8: Deleting Records & Verifying Reputation Deduction ---');
    
    // 1. Unlike post: Main user -2 (from 9 to 7)
    const resUnlike = makeMockRes();
    await togglePostLike({
      ...targetReqMock,
      params: { id: pubPost._id }
    }, resUnlike, nextMock);
    console.log('✔ Unliked post.');

    // 2. Delete nested reply first so its points are deducted: Main user -2 (from 7 to 5)
    const resDelReply = makeMockRes();
    await deleteComment({
      ...reqMock,
      params: { id: reply1._id }
    }, resDelReply, nextMock);
    console.log('✔ Deleted nested reply comment.');

    // 3. Unlike comment first so target user\'s point is deducted: Target user -1 (from 10 to 9)
    const resCommentUnlike = makeMockRes();
    await toggleCommentLike({
      ...reqMock,
      params: { id: comment1._id }
    }, resCommentUnlike, nextMock);
    console.log('✔ Unliked comment.');

    // 4. Delete top-level comment: Target user -2 (from 9 to 7)
    const resDelComment = makeMockRes();
    await deleteComment({
      ...targetReqMock,
      params: { id: comment1._id }
    }, resDelComment, nextMock);
    console.log('✔ Deleted top-level comment.');

    // 5. Unfollow target user: Target user -5 (from 7 to 2)
    const resUnfollow = makeMockRes();
    await toggleFollow({
      ...reqMock,
      params: { id: dummyUser._id }
    }, resUnfollow, nextMock);
    console.log('✔ Unfollowed target user.');

    // 6. Delete discussion room: Target user keeps 2 points for discussion reply (since no individual reply delete API exists)
    const resDelDisc = makeMockRes();
    await deleteDiscussion({
      ...reqMock,
      params: { id: discussion._id }
    }, resDelDisc, nextMock);
    console.log('✔ Deleted discussion room.');

    // 7. Delete published post: Main user -5 (from 5 to 0)
    const resDelPost = makeMockRes();
    await deletePost({
      ...reqMock,
      params: { id: pubPost._id }
    }, resDelPost, nextMock);
    console.log('✔ Deleted published post.');

    // Clean up draft post
    await Post.findByIdAndDelete(draftPost._id);

    // Verify user final reputation points deducted correctly
    freshUser = await User.findById(user._id);
    const finalTargetUser = await User.findById(dummyUser._id);
    console.log(`  Main user final reputation: ${freshUser.reputationPoints} (Expected: 0)`);
    console.log(`  Target user final reputation: ${finalTargetUser.reputationPoints} (Expected: 2)`);

    if (freshUser.reputationPoints !== 0 || finalTargetUser.reputationPoints !== 2) {
      throw new Error('Reputation points deductions did not cleanly calculate back on deletions!');
    }

    // Clean up local temp community file
    const localFileExists = fs.existsSync('./uploads/community/test-community-file.jpg');
    console.log(`  Community file exists on disk: ${localFileExists}`);
    if (localFileExists) {
      fs.unlinkSync('./uploads/community/test-community-file.jpg');
    }

    // Delete dummy target user
    await User.findByIdAndDelete(dummyUser._id);
    console.log('✔ Dummy target user removed.');

    console.log('\n======================================================');
    console.log('🎉 ALL COMMUNITY FEATURES INTEGRATION TEST SUCCESSFUL!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
