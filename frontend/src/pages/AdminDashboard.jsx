import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Sparkles, LogOut, ArrowLeft, Users, UserCheck, Activity, Cpu, 
  Search, Trash2, ShieldAlert, Ban, CheckCircle, BarChart3, AlertOctagon, 
  FileText, Clipboard, List, ArrowUpDown, ChevronLeft, ChevronRight, Pin, AlertTriangle, Eye, Edit
} from 'lucide-react';
import Toast from '../components/Toast';
import { logoutUser } from '../redux/slices/authSlice';
import { 
  fetchDashboard, fetchUsers, updateUser, deleteUser, blockUser, 
  unblockUser, changeUserRole, fetchPosts, deletePost, fetchComments, 
  deleteComment, fetchReports, resolveReport, fetchAnalytics, fetchActivityLogs, clearAdminError 
} from '../redux/slices/adminSlice';

// Recharts components
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Selected tab state: 'overview', 'users', 'moderation', 'reports', 'analytics', 'logs'
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  // Search, Filters & Pagination states for User Management
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userSort, setUserSort] = useState('newest');
  const [userPage, setUserPage] = useState(1);

  // Search states for Content Moderation
  const [postSearch, setPostSearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');

  // Editing User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Redux selectors
  const { 
    dashboard, users, pagination, posts, comments, 
    reports, analytics, activityLogs, loading, error 
  } = useSelector((state) => state.admin);

  // Trigger data fetching based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      dispatch(fetchDashboard());
    } else if (activeTab === 'users') {
      dispatch(fetchUsers({ 
        search: userSearch, 
        role: userRoleFilter, 
        status: userStatusFilter, 
        sort: userSort, 
        page: userPage 
      }));
    } else if (activeTab === 'moderation') {
      dispatch(fetchPosts({ search: postSearch }));
      dispatch(fetchComments({ search: commentSearch }));
    } else if (activeTab === 'reports') {
      dispatch(fetchReports());
    } else if (activeTab === 'analytics') {
      dispatch(fetchAnalytics());
    } else if (activeTab === 'logs') {
      dispatch(fetchActivityLogs());
    }
  }, [dispatch, activeTab, userSearch, userRoleFilter, userStatusFilter, userSort, userPage, postSearch, commentSearch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearAdminError());
    }
  }, [error, dispatch]);

  const handleShowToast = (message, type) => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    dispatch(logoutUser()).then((res) => {
      if (!res.error) {
        setToast({ message: 'Logged out successfully', type: 'success' });
        setTimeout(() => navigate('/login'), 1000);
      }
    });
  };

  // User Actions
  const handleEditClick = (userObj) => {
    setEditingUser(userObj);
    setEditFullName(userObj.fullName);
    setEditEmail(userObj.email);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editFullName || !editEmail) return;
    dispatch(updateUser({ id: editingUser._id, fullName: editFullName, email: editEmail })).then((res) => {
      if (!res.error) {
        handleShowToast('User updated successfully', 'success');
        setEditingUser(null);
      }
    });
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
      dispatch(deleteUser(id)).then((res) => {
        if (!res.error) {
          handleShowToast('User deleted successfully', 'success');
        }
      });
    }
  };

  const handleToggleBlock = (userObj) => {
    const isBlocked = userObj.status === 'Blocked';
    const action = isBlocked ? unblockUser : blockUser;
    dispatch(action(userObj._id)).then((res) => {
      if (!res.error) {
        handleShowToast(`User ${isBlocked ? 'unblocked' : 'blocked'} successfully`, 'success');
      }
    });
  };

  const handleRoleToggle = (userObj) => {
    const nextRole = userObj.role === 'admin' ? 'student' : 'admin';
    if (window.confirm(`Are you sure you want to change role to ${nextRole}?`)) {
      dispatch(changeUserRole({ id: userObj._id, role: nextRole })).then((res) => {
        if (!res.error) {
          handleShowToast(`Role updated to ${nextRole}`, 'success');
        }
      });
    }
  };

  // Post Actions
  const handleDeletePost = (id) => {
    if (window.confirm('Delete this community post and its replies?')) {
      dispatch(deletePost(id)).then((res) => {
        if (!res.error) {
          handleShowToast('Post deleted', 'success');
        }
      });
    }
  };

  // Comment Actions
  const handleDeleteComment = (id) => {
    if (window.confirm('Delete this comment?')) {
      dispatch(deleteComment(id)).then((res) => {
        if (!res.error) {
          handleShowToast('Comment deleted', 'success');
        }
      });
    }
  };

  // Report Actions
  const handleResolveReport = (id, status) => {
    dispatch(resolveReport({ id, status })).then((res) => {
      if (!res.error) {
        handleShowToast(`Report marked as ${status}`, 'success');
      }
    });
  };

  // Pie chart variables
  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 font-sans flex flex-col md:flex-row pb-12 md:pb-0">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between flex-shrink-0 md:min-h-screen">
        <div>
          {/* Logo Header */}
          <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span className="text-lg font-bold font-outfit text-slate-900 dark:text-white">Admin Console</span>
            </div>
            <span className="md:hidden text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">Live</span>
          </div>

          {/* Links list */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: <Cpu className="h-4.5 w-4.5" /> },
              { id: 'users', label: 'User Directory', icon: <Users className="h-4.5 w-4.5" /> },
              { id: 'moderation', label: 'Content Moderation', icon: <ShieldAlert className="h-4.5 w-4.5" /> },
              { id: 'reports', label: 'Report Queue', icon: <AlertOctagon className="h-4.5 w-4.5" /> },
              { id: 'analytics', label: 'Platform Analytics', icon: <BarChart3 className="h-4.5 w-4.5" /> },
              { id: 'logs', label: 'Audit Logs', icon: <Clipboard className="h-4.5 w-4.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer logouts */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Student Hub</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto max-h-screen">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Admin Management Portal</span>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                Live Console
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeTab === 'overview' && 'Verify database sizes, registered students count, and server workloads.'}
              {activeTab === 'users' && 'Search profiles, edit details, adjust permissions, and block accounts.'}
              {activeTab === 'moderation' && 'Pin important notifications, hide offensive threads, and delete replies.'}
              {activeTab === 'reports' && 'Inspect student flagged logs, handle bans, and mark resolves.'}
              {activeTab === 'analytics' && 'View growth graphs, registrations spikes, and feature usage pie charts.'}
              {activeTab === 'logs' && 'View audit trail logs generated by all administrators.'}
            </p>
          </div>
        </div>

        {/* LOADING SHIMMER STATE */}
        {loading && !dashboard && !users.length && !posts.length && !reports.length && (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
        )}

        {/* TAB CONTENTS PANELS */}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats aggregation grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: dashboard.stats.totalUsers, growth: dashboard.growth.usersGrowth, color: 'text-indigo-600 dark:text-indigo-400', desc: 'Registered accounts' },
                { label: 'Community Posts', value: dashboard.stats.totalPosts, growth: dashboard.growth.postsGrowth, color: 'text-emerald-500', desc: 'Discussions created' },
                { label: 'Total Comments', value: dashboard.stats.totalComments, growth: dashboard.growth.commentsGrowth, color: 'text-amber-500', desc: 'Replies logged' },
                { label: 'Resumes Generated', value: dashboard.stats.totalResumes, growth: dashboard.growth.resumesGrowth, color: 'text-rose-500', desc: 'ATS resumes created' },
              ].map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
                    <h3 className={`text-3xl font-extrabold font-outfit mt-2 ${card.color}`}>{card.value}</h3>
                  </div>
                  <div className="flex justify-between items-center mt-3 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    <span className="text-[9px] text-slate-400 font-semibold">{card.desc}</span>
                    <span className={`text-[10px] font-bold ${card.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {card.growth >= 0 ? `+${card.growth}%` : `${card.growth}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Other System diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Module Records breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-xl font-extrabold font-outfit text-indigo-500">{dashboard.stats.totalAssignments}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Assignments</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-xl font-extrabold font-outfit text-indigo-500">{dashboard.stats.totalNotes}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Exams Tracked</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-xl font-extrabold font-outfit text-indigo-500">{dashboard.stats.totalExpenses}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Expenses</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-xl font-extrabold font-outfit text-emerald-500">{dashboard.stats.activeUsers}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Active Users</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide pb-1.5 border-b border-slate-100 dark:border-slate-800">Server Environment</h2>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-450">Health Check Status</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Healthy
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-450">Active DB Connections</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">1</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-450">Server Port</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">5000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === 'users' && users && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-6 animate-fade-in">
            {/* Filter and control bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                />
              </div>

              {/* Filters dropdowns */}
              <div className="grid grid-cols-2 sm:flex flex-wrap gap-2.5 w-full lg:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                </select>

                <select
                  value={userSort}
                  onChange={(e) => { setUserSort(e.target.value); setUserPage(1); }}
                  className="col-span-2 sm:col-span-1 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="newest">Recently Joined</option>
                  <option value="oldest">Oldest</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 uppercase font-bold text-left tracking-wider">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4 text-center">Role</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Registration Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-slate-400 font-semibold">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          <img 
                            src={row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.fullName)}`} 
                            alt={row.fullName} 
                            className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800"
                          />
                          <span className="font-bold text-slate-900 dark:text-white">{row.fullName}</span>
                        </td>
                        <td className="px-5 py-3.5">{row.email}</td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => handleRoleToggle(row)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.role === 'admin' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30'}`}
                          >
                            {row.role}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleBlock(row)}
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.status === 'Blocked' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30'}`}
                          >
                            {row.status || 'Active'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-400 font-mono">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right flex justify-end gap-1">
                          <button
                            onClick={() => handleEditClick(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(row._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Page {pagination.page} of {pagination.pages}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setUserPage(userPage - 1)}
                    disabled={userPage === 1}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-150 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => setUserPage(userPage + 1)}
                    disabled={userPage === pagination.pages}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-150 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. CONTENT MODERATION TAB */}
        {activeTab === 'moderation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Posts Moderation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
                <span>Moderate Community Posts</span>
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {posts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No posts found.</p>
                ) : (
                  posts.map((post) => (
                    <div key={post._id} className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{post.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Author: {post.userId?.fullName || 'Anonymous'} | Category: {post.category}</p>
                        <p className="text-[10px] text-slate-400">Likes: {post.likesCount} | Comments: {post.commentsCount}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="p-1.5 border border-transparent rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                          title="Delete Post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comments Moderation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
                <span>Moderate Comments</span>
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search comments..."
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No comments found.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">"{comment.content}"</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Author: {comment.userId?.fullName || 'Anonymous'} | Post: {comment.postId?.title || 'Unknown Post'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="p-1.5 border border-transparent rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex-shrink-0"
                        title="Delete Comment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. REPORTS TAB */}
        {activeTab === 'reports' && reports && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-6 animate-fade-in">
            <h2 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <AlertOctagon className="h-5 w-5 text-indigo-500" />
              <span>Report Queue</span>
            </h2>

            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-550 uppercase font-bold text-left tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Reporter</th>
                    <th className="px-5 py-4">Content Type</th>
                    <th className="px-5 py-4">Reason</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Filed Date</th>
                    <th className="px-5 py-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-slate-450 font-semibold">
                        All clear! No pending reports queue.
                      </td>
                    </tr>
                  ) : (
                    reports.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 dark:text-white">{row.reportedBy?.fullName}</span>
                          <span className="text-[9px] text-slate-400 block">{row.reportedBy?.email}</span>
                        </td>
                        <td className="px-5 py-3.5 capitalize font-bold text-indigo-550">
                          {row.contentType}
                        </td>
                        <td className="px-5 py-3.5 text-rose-500 font-bold">{row.reason}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${row.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-600' : row.status === 'Resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-400 font-mono">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right flex justify-end gap-1">
                          {row.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleResolveReport(row._id, 'Resolved')}
                                className="p-1.5 border border-transparent rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                                title="Mark Resolved"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleResolveReport(row._id, 'Ignored')}
                                className="p-1.5 border border-transparent rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Ignore Report"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">
                              Reviewed by {row.reviewedBy?.fullName || 'Admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PLATFORM ANALYTICS TAB */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8 animate-fade-in">
            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Daily registrations */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Daily Student Registrations</h3>
                <div className="h-64">
                  {analytics.userAnalytics.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No registration logs.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.userAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="registrations" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Community Analytics */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Community Engagement Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.communityAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Module Usage (Pie Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-start">Feature usage analytics</h3>
                <div className="h-48 w-48 relative flex items-center justify-center">
                  {analytics.moduleUsageAnalytics.length === 0 ? (
                    <div className="text-xs text-slate-400">No usage data logged yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.moduleUsageAnalytics}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analytics.moduleUsageAnalytics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                
                {/* Legends */}
                <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400 justify-center">
                  {analytics.moduleUsageAnalytics.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly growth (Area Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm lg:col-span-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">User Monthly Growth Curve</h3>
                <div className="h-52">
                  {analytics.growthAnalytics.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">No data.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.growthAnalytics}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="users" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 6. AUDIT LOGS TAB */}
        {activeTab === 'logs' && activityLogs && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4 animate-fade-in">
            <h2 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Clipboard className="h-4.5 w-4.5 text-indigo-500" />
              <span>Admin Activity Logs (Audit Trail)</span>
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No actions logged yet.</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 flex justify-between items-center text-xs font-semibold">
                    <div className="space-y-0.5">
                      <p className="text-slate-800 dark:text-slate-200">{log.action}</p>
                      <p className="text-[10px] text-slate-400">Admin: {log.adminId?.fullName || 'System'}</p>
                    </div>
                    <span className="text-[10px] text-slate-450 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* Editing User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-slide-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white">Edit User Profile</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 font-bold">Close</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Save Details
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
