import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Code, Flame, Target, Trophy, Clock, Calendar as CalendarIcon, Loader, 
  Plus, CheckCircle, BarChart2, TrendingUp, AlertCircle, Trash2, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

import { fetchCodingDashboard, fetchCodingAnalytics, addCodingLog, addCodingGoal, deleteCodingGoal } from '../redux/slices/codingSlice';
import Heatmap from '../components/Heatmap';

const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Easy, Medium, Hard

export const CodingDashboard = () => {
  const dispatch = useDispatch();
  
  const { 
    profiles, recentLogs, goals, streak, stats, 
    heatmap, monthlyTrend, difficultyDistribution, 
    loading 
  } = useSelector((state) => state.coding);

  const [showLogModal, setShowLogModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  // Log Form State
  const [logForm, setLogForm] = useState({
    platform: 'LeetCode', problemsSolved: 1, timeSpent: 30, topics: '', notes: ''
  });

  // Goal Form State
  const [goalForm, setGoalForm] = useState({
    goalTitle: '', targetValue: 100, deadline: ''
  });

  useEffect(() => {
    dispatch(fetchCodingDashboard());
    dispatch(fetchCodingAnalytics());
  }, [dispatch]);

  const handleAddLog = (e) => {
    e.preventDefault();
    dispatch(addCodingLog({
      ...logForm,
      topics: logForm.topics.split(',').map(t => t.trim()).filter(Boolean)
    })).then(() => {
      setShowLogModal(false);
      setLogForm({ platform: 'LeetCode', problemsSolved: 1, timeSpent: 30, topics: '', notes: '' });
    });
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    dispatch(addCodingGoal(goalForm)).then(() => {
      setShowGoalModal(false);
      setGoalForm({ goalTitle: '', targetValue: 100, deadline: '' });
    });
  };

  const pieData = [
    { name: 'Easy', value: difficultyDistribution.easy || 1 }, // Fallback to 1 for render if 0
    { name: 'Medium', value: difficultyDistribution.medium || 1 },
    { name: 'Hard', value: difficultyDistribution.hard || 1 },
  ];

  if (loading && !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit flex items-center gap-2">
            <Code className="h-8 w-8 text-indigo-600" />
            Coding Progress Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track your problem-solving journey, maintain streaks, and crush your goals.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowGoalModal(true)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Target className="h-4 w-4" /> New Goal
          </button>
          <button 
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Log Session
          </button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500">Total Solved</div>
            <div className="text-2xl font-extrabold">{stats?.totalProblemsSolved || 0}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500">Current Streak</div>
            <div className="text-2xl font-extrabold">{streak?.currentStreak || 0} Days</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500">Longest Streak</div>
            <div className="text-2xl font-extrabold">{streak?.longestStreak || 0} Days</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500">Time Spent</div>
            <div className="text-2xl font-extrabold">{Math.round((stats?.totalTimeSpent || 0)/60)} Hrs</div>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 mb-8 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-indigo-500" />
          Consistency Heatmap
        </h3>
        <Heatmap data={heatmap} year={new Date().getFullYear()} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Analytics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-md font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" /> Monthly Trend
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="solved" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-500" /> Difficulty Split
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Easy</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Medium</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Hard</span>
              </div>
            </div>
          </div>

          {/* Recent Logs List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No activity logged yet. Start coding!</div>
              ) : (
                recentLogs.map(log => (
                  <div key={log._id} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                        +{log.problemsSolved}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{log.platform}</div>
                        <div className="text-xs text-slate-500">{new Date(log.date).toLocaleDateString()} • {log.timeSpent} mins</div>
                      </div>
                    </div>
                    {log.topics && log.topics.length > 0 && (
                      <div className="hidden sm:flex gap-2">
                        {log.topics.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Goals & Topics */}
        <div className="space-y-8">
          
          {/* Active Goals */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" /> Active Goals
            </h3>
            <div className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No active goals. Set one!</div>
              ) : (
                goals.map(goal => {
                  const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                  return (
                    <div key={goal._id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm truncate pr-4">{goal.goalTitle}</div>
                        <button onClick={() => dispatch(deleteCodingGoal(goal._id))} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1 font-semibold">
                        <span>{goal.currentValue} / {goal.targetValue}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2 text-right">Deadline: {new Date(goal.deadline).toLocaleDateString()}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Topics */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Top Practiced Topics</h3>
            <div className="space-y-3">
              {stats?.topTopics?.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">Log topics to see analysis.</div>
              ) : (
                stats?.topTopics?.map((topic, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{topic.name}</span>
                    <span className="text-xs font-extrabold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg">{topic.count} solved</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* LOG MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Log Coding Session</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Platform</label>
                <select value={logForm.platform} onChange={e => setLogForm({...logForm, platform: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="LeetCode">LeetCode</option>
                  <option value="HackerRank">HackerRank</option>
                  <option value="CodeChef">CodeChef</option>
                  <option value="GeeksforGeeks">GeeksforGeeks</option>
                  <option value="Codeforces">Codeforces</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Problems Solved</label>
                  <input type="number" min="1" required value={logForm.problemsSolved} onChange={e => setLogForm({...logForm, problemsSolved: parseInt(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time Spent (Mins)</label>
                  <input type="number" min="1" required value={logForm.timeSpent} onChange={e => setLogForm({...logForm, timeSpent: parseInt(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Topics (comma separated)</label>
                <input type="text" placeholder="Arrays, DP, Graphs" value={logForm.topics} onChange={e => setLogForm({...logForm, topics: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <button type="submit" className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all">
                Save Session Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Set New Goal</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Goal Title</label>
                <input type="text" required placeholder="e.g. Solve 100 Graph Problems" value={goalForm.goalTitle} onChange={e => setGoalForm({...goalForm, goalTitle: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Value (Number)</label>
                <input type="number" min="1" required value={goalForm.targetValue} onChange={e => setGoalForm({...goalForm, targetValue: parseInt(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deadline</label>
                <input type="date" required value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <button type="submit" className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all">
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CodingDashboard;
