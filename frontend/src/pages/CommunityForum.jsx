import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  MessageSquare, Plus, Search, SlidersHorizontal, Eye, ThumbsUp,
  Pin, Share2, Tag, Calendar, User, Compass, Bookmark, AlertCircle,
  TrendingUp, Award, Bell, ShieldAlert, Sparkles, ChevronRight, X, Loader,
  Upload, FileText, Globe
} from 'lucide-react';

import {
  fetchPosts,
  fetchTrendingPosts,
  createPost,
  togglePostLike,
  fetchDiscussions,
  createDiscussion,
  fetchNotifications,
  receiveLiveNotification,
  clearCommunityErrors
} from '../redux/slices/communitySlice';
const getReputationLevel = (points) => {
  if (points <= 25) return 'Beginner';
  if (points <= 100) return 'Contributor';
  if (points <= 300) return 'Active Member';
  if (points <= 600) return 'Expert';
  return 'Community Leader';
};

const CATEGORIES = ['Academics', 'Programming', 'Placements', 'Internships', 'Career Guidance', 'General Discussion'];
const DISCUSSION_CATEGORIES = ['Exam', 'Placement', 'Coding', 'College', 'General'];

const CATEGORY_ICONS = {
  Academics: <Globe className="h-4.5 w-4.5 text-indigo-500" />,
  Programming: <MessageSquare className="h-4.5 w-4.5 text-emerald-500" />,
  Placements: <Award className="h-4.5 w-4.5 text-amber-500" />,
  Internships: <Compass className="h-4.5 w-4.5 text-violet-500" />,
  'Career Guidance': <Sparkles className="h-4.5 w-4.5 text-rose-500" />,
  'General Discussion': <Bookmark className="h-4.5 w-4.5 text-slate-500" />
};

export const CommunityForum = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { posts, trendingPosts, discussions, notifications, loading, error } = useSelector((state) => state.community);
  const { user } = useSelector((state) => state.auth);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  
  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  
  // Forms
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    category: 'General Discussion',
    tags: '',
    isAnonymous: false,
    attachment: null,
    attachmentName: ''
  });

  const [discForm, setDiscForm] = useState({
    title: '',
    content: '',
    category: 'General'
  });

  // Socket Connection for Real-Time Alerts
  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true });

    if (user?._id) {
      socket.emit('join', user._id);
    }

    socket.on('notification', (data) => {
      // Add notification to redux state immediately
      dispatch(receiveLiveNotification(data.payload));
      // Trigger user-friendly alert or sound
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, user]);

  // Initial Fetching
  useEffect(() => {
    dispatch(fetchPosts({ category: categoryFilter, search: searchTerm, sort: sortOption }));
    dispatch(fetchTrendingPosts());
    dispatch(fetchDiscussions());
    dispatch(fetchNotifications());
  }, [dispatch, categoryFilter, searchTerm, sortOption]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content || !postForm.category) return;

    const formData = new FormData();
    formData.append('title', postForm.title);
    formData.append('content', postForm.content);
    formData.append('category', postForm.category);
    formData.append('tags', postForm.tags);
    formData.append('isAnonymous', postForm.isAnonymous);
    if (postForm.attachment) {
      formData.append('attachment', postForm.attachment);
    }

    await dispatch(createPost(formData));
    setShowPostModal(false);
    resetPostForm();
    dispatch(fetchPosts({ category: categoryFilter, search: searchTerm, sort: sortOption }));
  };

  const handleDiscussionSubmit = async (e) => {
    e.preventDefault();
    if (!discForm.title || !discForm.content || !discForm.category) return;

    await dispatch(createDiscussion(discForm));
    setShowDiscussionModal(false);
    setDiscForm({ title: '', content: '', category: 'General' });
    dispatch(fetchDiscussions());
  };

  const resetPostForm = () => {
    setPostForm({
      title: '',
      content: '',
      category: 'General Discussion',
      tags: '',
      isAnonymous: false,
      attachment: null,
      attachmentName: ''
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostForm(prev => ({
        ...prev,
        attachment: file,
        attachmentName: file.name
      }));
    }
  };

  const handleLike = (postId) => {
    dispatch(togglePostLike(postId));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      
      {/* Navbar wrapper */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-85 transition-all">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-sm text-slate-600 dark:text-slate-350">Hub</span>
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-indigo-650 dark:text-indigo-400" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Student Community</span>
            </div>
            <div className="relative">
              <Link to="/community/analytics" className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl block">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top search & post controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-sm w-full sm:w-80 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Search className="h-4.5 w-4.5 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search community posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none w-full text-slate-800 dark:text-slate-100 border-none"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowDiscussionModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <TrendingUp className="h-4 w-4 text-violet-500" /> Start Thread
            </button>
            <button
              onClick={() => setShowPostModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
            >
              <Plus className="h-4.5 w-4.5" /> New Post
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Categories and Profile reputation card */}
          <div className="space-y-6">
            
            {/* Reputation Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <img src={user?.avatar} alt={user?.fullName} className="h-11 w-11 rounded-full border border-indigo-200" />
                <div>
                  <h4 className="font-bold text-sm truncate max-w-[150px]">{user?.fullName}</h4>
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px] block">{user?.email}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-500" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reputation</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {getReputationLevel(user?.reputationPoints || 0)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{user?.reputationPoints || 0}</div>
                  <div className="text-[9px] font-bold text-slate-400">PTS</div>
                </div>
              </div>
            </div>

            {/* Categories filter */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Category Forums</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    categoryFilter === ''
                      ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Compass className="h-4.5 w-4.5" /> All Feed
                  </span>
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      categoryFilter === cat
                        ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {CATEGORY_ICONS[cat]} {cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column: Posts Feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sort bar */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex gap-4 text-xs font-bold">
                <button 
                  onClick={() => setSortOption('latest')} 
                  className={`pb-1 ${sortOption === 'latest' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-650'}`}
                >
                  Latest
                </button>
                <button 
                  onClick={() => setSortOption('trending')} 
                  className={`pb-1 ${sortOption === 'trending' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-650'}`}
                >
                  Trending
                </button>
                <button 
                  onClick={() => setSortOption('popular')} 
                  className={`pb-1 ${sortOption === 'popular' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-650'}`}
                >
                  Most Liked
                </button>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{posts.length} Posts</span>
            </div>

            {/* Posts feed */}
            {loading && posts.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
                No posts found. Be the first to create one!
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map(post => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all relative"
                  >
                    {post.isPinned && (
                      <span className="absolute top-4 right-4 text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    )}

                    {/* Author block */}
                    <div className="flex items-center gap-2 mb-4">
                      {post.isAnonymous ? (
                        <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
                          ?
                        </div>
                      ) : (
                        <Link to={`/community/profile/${post.userId?._id}`} className="block hover:opacity-85">
                          <img src={post.userId?.avatar} alt={post.userId?.fullName} className="h-8 w-8 rounded-full" />
                        </Link>
                      )}
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{post.isAnonymous ? 'Anonymous peer' : post.userId?.fullName}</span>
                          {!post.isAnonymous && post.userId?.reputationLevel && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold uppercase">
                              {post.userId.reputationLevel}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-semibold flex items-center gap-2">
                          <span>{post.category}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <Link to={`/community/post/${post._id}`} className="block group">
                      <h3 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white mb-2 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                        {post.content}
                      </p>
                    </Link>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-md font-bold flex items-center gap-1">
                            <Tag className="h-2.5 w-2.5" /> #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Attachments preview */}
                    {post.attachments && post.attachments.length > 0 && (
                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/20 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">{post.attachments[0].name}</span>
                        </div>
                        <a 
                          href={post.attachments[0].url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-indigo-650 hover:underline shrink-0"
                        >
                          View File
                        </a>
                      </div>
                    )}

                    {/* Action bar */}
                    <div className="flex items-center gap-6 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-bold text-slate-400">
                      <button 
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-1.5 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors ${
                          post.likes.includes(user?._id) ? 'text-indigo-600 dark:text-indigo-400' : ''
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" /> {post.likesCount} Likes
                      </button>
                      <Link to={`/community/post/${post._id}`} className="flex items-center gap-1.5 hover:text-indigo-650 transition-colors">
                        <MessageSquare className="h-4 w-4" /> {post.commentsCount} Comments
                      </Link>
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" /> {post.views} Views
                      </span>
                    </div>

                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Trending Discussions Tracker */}
          <div className="space-y-6">
            
            {/* Notification alert count widget */}
            {notifications.filter(n => !n.isRead).length > 0 && (
              <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3">
                <Bell className="h-5 w-5 text-rose-500 animate-bounce" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-400">Unread Community Alerts</div>
                  <div className="text-[10px] text-rose-500 font-semibold">{notifications.filter(n => !n.isRead).length} new updates in posts</div>
                </div>
                <Link to="/community/analytics" className="text-xs font-bold text-rose-600 hover:underline">View</Link>
              </div>
            )}

            {/* Live Discussion widget */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Active Live Threads</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h3>
              <div className="space-y-3">
                {discussions.length === 0 ? (
                  <div className="text-slate-400 text-xs font-semibold py-4 text-center">No active rooms. Start one!</div>
                ) : (
                  discussions.slice(0, 5).map(disc => (
                    <Link 
                      key={disc._id}
                      to={`/community/discussion/${disc._id}`} 
                      className="block p-3 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{disc.title}</div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-1">
                        <span>{disc.category} Room</span>
                        <span>{disc.repliesCount} chat messages</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Trending Tags widget */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Trending Topics</h3>
              <div className="flex flex-wrap gap-1.5">
                {trendingPosts.flatMap(p => p.tags || []).slice(0, 10).map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchTerm(tag)}
                    className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-950/60 dark:hover:bg-slate-800 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
                {trendingPosts.flatMap(p => p.tags || []).length === 0 && (
                  <div className="text-xs font-bold text-slate-400 py-2">No hashtags active today.</div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: Add New Post */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Create Community Post</h3>
                <button onClick={() => setShowPostModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Post Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. DBMS Joins complete summaries"
                    value={postForm.title}
                    onChange={e => setPostForm({...postForm, title: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select 
                      value={postForm.category}
                      onChange={e => setPostForm({...postForm, category: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="dbms, exams, studytips"
                      value={postForm.tags}
                      onChange={e => setPostForm({...postForm, tags: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Content</label>
                  <textarea 
                    required
                    placeholder="Write detailed post content here..."
                    value={postForm.content}
                    onChange={e => setPostForm({...postForm, content: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32 resize-none"
                  ></textarea>
                </div>

                {/* Upload Attachment */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Media Attachment (Optional)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      id="attachment-file"
                      onChange={handleFileChange}
                      className="hidden" 
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <label
                      htmlFor="attachment-file"
                      className="px-4 py-2 border border-dashed border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="h-4 w-4" /> Upload PDF or Image
                    </label>
                    {postForm.attachmentName && (
                      <span className="text-xs font-bold text-slate-500 truncate max-w-[200px]">{postForm.attachmentName}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="post-anonymous"
                    checked={postForm.isAnonymous}
                    onChange={e => setPostForm({...postForm, isAnonymous: e.target.checked})}
                    className="rounded text-indigo-650 focus:ring-indigo-500 h-4.5 w-4.5 border-slate-300"
                  />
                  <label htmlFor="post-anonymous" className="text-xs font-semibold text-slate-600">Post anonymously to protect your privacy</label>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 transition-all"
                >
                  Publish Post
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Add New Discussion Room */}
      <AnimatePresence>
        {showDiscussionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-500" /> Start Live Thread
                </h3>
                <button onClick={() => setShowDiscussionModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDiscussionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thread Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Placement Prep 2026 Q&A"
                    value={discForm.title}
                    onChange={e => setDiscForm({...discForm, title: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thread Category</label>
                  <select 
                    value={discForm.category}
                    onChange={e => setDiscForm({...discForm, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {DISCUSSION_CATEGORIES.map(c => <option key={c} value={c}>{c} Discussions</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Short Introduction Topic</label>
                  <textarea 
                    required
                    placeholder="What is this live discussion about?"
                    value={discForm.content}
                    onChange={e => setDiscForm({...discForm, content: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 transition-all"
                >
                  Create & Launch Thread
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CommunityForum;
