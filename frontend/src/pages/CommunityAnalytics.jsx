import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, FileText, MessageSquare, Award, Loader, RefreshCw, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

import { fetchCommunityAnalytics } from '../redux/slices/communitySlice';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#64748b'];

export const CommunityAnalytics = () => {
  const dispatch = useDispatch();
  const { analytics, loading } = useSelector((state) => state.community);

  useEffect(() => {
    dispatch(fetchCommunityAnalytics());
  }, [dispatch]);

  if (loading && !analytics) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader className="h-10 w-10 text-indigo-650 animate-spin" />
      </div>
    );
  }

  const {
    totalPosts = 0,
    totalComments = 0,
    totalDiscussions = 0,
    activeMembers = 0,
    postDistribution = [],
    growthTrend = [],
    engagementStats = []
  } = analytics || {};

  return (
    <div className="min-h-screen bg-slate-55 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      
      {/* Header bar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/community" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4.5 w-4.5" />
            <span className="font-bold text-xs uppercase">Forums</span>
          </Link>
          <span className="font-extrabold text-sm font-outfit">Community Analytics</span>
          <div className="w-8"></div>
        </div>
      </nav>

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Forums Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1">Community growth, category spread, and active engagements.</p>
          </div>
          <button 
            onClick={() => dispatch(fetchCommunityAnalytics())}
            className="p-2 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 transition-all text-slate-500"
            title="Refresh analytics data"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Top Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Active Members */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-900/10">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Members</div>
              <div className="text-2xl font-extrabold font-outfit mt-0.5">{activeMembers}</div>
            </div>
          </div>

          {/* Total Posts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100/50 dark:border-emerald-900/10">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Posts</div>
              <div className="text-2xl font-extrabold font-outfit mt-0.5">{totalPosts}</div>
            </div>
          </div>

          {/* Comments count */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100/50 dark:border-rose-900/10">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Remarks</div>
              <div className="text-2xl font-extrabold font-outfit mt-0.5">{totalComments}</div>
            </div>
          </div>

          {/* Discussion threads count */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100/50 dark:border-amber-900/10">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Threads</div>
              <div className="text-2xl font-extrabold font-outfit mt-0.5">{totalDiscussions}</div>
            </div>
          </div>
        </div>

        {/* Charts Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Growth Trend (Line Chart) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Active Contributors Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="activeUsers" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution (Pie Chart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Post Spread</h3>
            
            <div className="h-48 w-full relative flex items-center justify-center">
              {postDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={postDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {postDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-xs font-semibold">No category posts logged yet.</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold text-slate-500">
              {postDistribution.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="truncate">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Overview (Bar Chart) */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Interaction Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
};

export default CommunityAnalytics;
