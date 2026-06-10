import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Award, BookOpen, Compass, Check, AlertCircle, Loader, MessageSquare, ThumbsUp, Eye } from 'lucide-react';

import {
  fetchUserProfile,
  toggleFollowUser,
  fetchPosts
} from '../redux/slices/communitySlice';

export const UserProfile = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { viewedProfile, posts, loading } = useSelector((state) => state.community);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchUserProfile(id));
    dispatch(fetchPosts({ userId: id }));
  }, [dispatch, id]);

  const handleFollow = () => {
    dispatch(toggleFollowUser(id));
  };

  if (loading && !viewedProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader className="h-10 w-10 text-indigo-650 animate-spin" />
      </div>
    );
  }

  if (!viewedProfile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-slate-400">
        Profile not found. <Link to="/community" className="text-indigo-600 underline">Back to forums</Link>
      </div>
    );
  }

  const isSelf = viewedProfile._id === user?._id;
  const isFollowing = viewedProfile.followers?.includes(user?._id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      
      {/* Header navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/community" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4.5 w-4.5" />
            <span className="font-bold text-xs uppercase">Community</span>
          </Link>
          <span className="font-extrabold text-sm font-outfit">Student Profile</span>
          <div className="w-8"></div> {/* spacer */}
        </div>
      </nav>

      {/* Main layout */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* User profile card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <img src={viewedProfile.avatar} alt={viewedProfile.fullName} className="h-16 w-16 rounded-full border border-indigo-100 shadow-sm" />
            <div>
              <h1 className="text-xl font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                {viewedProfile.fullName}
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {viewedProfile.college || 'College details not added'}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 font-extrabold uppercase">
                  Level: {viewedProfile.reputationLevel}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-extrabold">
                  {viewedProfile.reputationPoints || 0} Points
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
            {/* stats count */}
            <div className="flex gap-6 text-center text-xs">
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white text-base">{viewedProfile.postsCount || 0}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Posts</div>
              </div>
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white text-base">{viewedProfile.commentsCount || 0}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Remarks</div>
              </div>
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white text-base">{viewedProfile.followers?.length || 0}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Followers</div>
              </div>
            </div>

            {/* Follow action */}
            {!isSelf && (
              <button
                onClick={handleFollow}
                className={`ml-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 ${
                  isFollowing
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    : 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                }`}
              >
                {isFollowing ? <Check className="h-4 w-4" /> : null}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Bio, College, Skills detail blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Bio</h3>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                {viewedProfile.bio || 'This student hasn\'t updated their bio yet.'}
              </p>
            </div>
            
            {/* Skills */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skills & Knowledge Areas</h3>
              <div className="flex flex-wrap gap-1.5">
                {viewedProfile.skills && viewedProfile.skills.length > 0 ? (
                  viewedProfile.skills.map((skill, idx) => (
                    <span key={idx} className="text-[10px] px-2.5 py-1 bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg font-bold border border-indigo-100/50 dark:border-indigo-900/10">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No skills listed.</span>
                )}
              </div>
            </div>
          </div>

          {/* Gamification Reputation Badges summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Reputation Tier</h3>
            
            <div className="flex flex-col items-center py-4 text-center">
              <Award className="h-12 w-12 text-indigo-500 mb-2" />
              <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm font-outfit">{viewedProfile.reputationLevel}</div>
              <div className="text-[10px] text-slate-400 mt-1 font-bold">Reputation Score: {viewedProfile.reputationPoints || 0} PTS</div>
            </div>

            <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2 font-semibold">
              Levels scale from Beginner up to Community Leader by posting, commenting, and gathering likes.
            </div>
          </div>
        </div>

        {/* User's recent post activities */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">Recent Posts By Student ({posts.length})</h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 text-xs font-bold">
              This student has not created any public posts yet.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/community/post/${post._id}`} className="font-extrabold text-sm text-slate-800 dark:text-slate-100 hover:underline">
                      {post.title}
                    </Link>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md font-bold shrink-0 ml-4">
                      {post.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {post.content}
                  </p>
                  
                  {/* Actions summary footer */}
                  <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {post.likesCount} Likes</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {post.commentsCount} Comments</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views} Views</span>
                    <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
};

export default UserProfile;
