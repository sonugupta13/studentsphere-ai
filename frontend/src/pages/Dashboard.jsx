import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, ShieldAlert, Sparkles, BookOpen, Clock, Bot, 
  GraduationCap, Moon, Sun, Award, ClipboardCheck, Flame, 
  CalendarRange, CheckSquare, Briefcase, FileUp, Sparkle, AlertCircle,
  Wallet, Menu, X, Users
} from 'lucide-react';

// Slices
import { logoutUser } from '../redux/slices/authSlice';
import { 
  fetchOverview, fetchAttendance, fetchExams, fetchAssignments, 
  fetchInternships, fetchPlacements, fetchCoding, fetchGoals, 
  fetchAnalytics, clearDashboardError 
} from '../redux/slices/dashboardSlice';
import { fetchNotifications } from '../redux/slices/communitySlice';

// Core Reusable Components
import StatCard from '../components/StatCard';
import QuickActions from '../components/QuickActions';
import PomodoroTimer from '../components/PomodoroTimer';
import RecentActivity from '../components/RecentActivity';
import NotificationsPanel from '../components/NotificationsPanel';
import Toast from '../components/Toast';
import Footer from '../components/Footer';

// Modals
import AddAssignmentModal from '../components/modals/AddAssignmentModal';
import AddExamModal from '../components/modals/AddExamModal';
import AddInternshipModal from '../components/modals/AddInternshipModal';
import AddGoalModal from '../components/modals/AddGoalModal';

// Widgets
import AcademicPerformance from '../components/widgets/AcademicPerformance';
import InternshipTracker from '../components/widgets/InternshipTracker';
import PlacementTracker from '../components/widgets/PlacementTracker';
import CodingProgressWidget from '../components/widgets/CodingProgressWidget';
import DailyGoalsWidget from '../components/widgets/DailyGoalsWidget';

// Recharts components
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, 
  BarChart, Bar, AreaChart, Area 
} from 'recharts';

export const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Theme state
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [toast, setToast] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Modal states
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isInternshipOpen, setIsInternshipOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);

  // Redux Selectors
  const { user } = useSelector((state) => state.auth);
  const { 
    dashboardData, attendanceData, examData, assignmentData, 
    internshipData, placementData, codingData, goalData, 
    analyticsData, loading, error 
  } = useSelector((state) => state.dashboard);
  const { notifications } = useSelector((state) => state.community);

  // Fetch dashboard data on load
  useEffect(() => {
    dispatch(fetchOverview());
    dispatch(fetchAttendance());
    dispatch(fetchExams());
    dispatch(fetchAssignments());
    dispatch(fetchInternships());
    dispatch(fetchPlacements());
    dispatch(fetchCoding());
    dispatch(fetchGoals());
    dispatch(fetchAnalytics());
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Error logging
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearDashboardError());
    }
  }, [error, dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser()).then((res) => {
      if (!res.error) {
        setToast({ message: 'Logged out successfully', type: 'success' });
        setTimeout(() => navigate('/login'), 1000);
      }
    });
  };

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleShowToast = (message, type) => {
    setToast({ message, type });
  };

  // Pie chart COLORS
  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

  // Loading Skeleton screen for Vercel/Linear smoothness
  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-7xl space-y-8 animate-pulse">
          {/* Skeleton Header */}
          <div className="flex justify-between items-center h-16 border-b border-slate-200 dark:border-slate-800">
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          {/* Skeleton Banner */}
          <div className="h-44 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overview = dashboardData || {
    attendance: { percentage: 0, status: 'N/A', color: 'indigo' },
    exams: { count: 0, nearestDate: null },
    assignments: { pendingCount: 0 },
    internships: { total: 0, applied: 0, shortlisted: 0, rejected: 0, selected: 0 },
    placements: { companiesApplied: 0, onlineTests: 0, interviewsScheduled: 0, offersReceived: 0 },
    coding: { currentStreak: 0, longestStreak: 0, totalSolved: 0 },
    goals: { completed: 0, total: 0, percentage: 0 },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 font-sans pb-12">
      {/* Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">StudentSphere AI</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
              >
                {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
              </button>

              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="2xl:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
                aria-label="Toggle navigation menu"
              >
                {isNavOpen ? <X className="h-5.5 w-5.5 text-rose-500" /> : <Menu className="h-5.5 w-5.5" />}
              </button>

              <Link
                to="/attendance"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Attendance Portal
              </Link>

              <Link
                to="/assignments"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Assignments Portal
              </Link>

              <Link
                to="/notes"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Notes Vault
              </Link>

              <Link
                to="/exams"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Exam Planner
              </Link>

              <Link
                to="/cgpa"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                CGPA Calculator
              </Link>

              <Link
                to="/resumes"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Resume Builder
              </Link>

              <Link
                to="/coding"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Coding Tracker
              </Link>

              <Link
                to="/expenses"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Expense Tracker
              </Link>

              <Link
                to="/community"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
              >
                <span>Student Community</span>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </Link>

              <Link
                to="/about"
                className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                About
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="hidden 2xl:inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Admin Portal
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="hidden 2xl:inline-flex items-center justify-center px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <LogOut className="h-4.5 w-4.5 sm:mr-1.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Menu Panel */}
        {isNavOpen && (
          <div className="2xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                to="/attendance"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                Attendance Portal
              </Link>

              <Link
                to="/assignments"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <ClipboardCheck className="h-4.5 w-4.5 text-rose-500" />
                Assignments Portal
              </Link>

              <Link
                to="/notes"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <FileUp className="h-4.5 w-4.5 text-sky-500" />
                Notes Vault
              </Link>

              <Link
                to="/exams"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <CalendarRange className="h-4.5 w-4.5 text-amber-500" />
                Exam Planner
              </Link>

              <Link
                to="/cgpa"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <GraduationCap className="h-4.5 w-4.5 text-indigo-500" />
                CGPA Calculator
              </Link>

              <Link
                to="/resumes"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <Briefcase className="h-4.5 w-4.5 text-emerald-500" />
                Resume Builder
              </Link>

              <Link
                to="/coding"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <Flame className="h-4.5 w-4.5 text-violet-500" />
                Coding Tracker
              </Link>

              <Link
                to="/expenses"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <Wallet className="h-4.5 w-4.5 text-emerald-500" />
                Expense Tracker
              </Link>

              <Link
                to="/community"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <span className="flex items-center gap-3">
                  <Users className="h-4.5 w-4.5 text-indigo-500" />
                  Student Community
                </span>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </Link>

              <Link
                to="/about"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                About StudentSphere AI
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsNavOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-indigo-650 bg-indigo-55 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                >
                  <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
                  Admin Portal
                </Link>
              )}
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
              <button
                onClick={() => {
                  setIsNavOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-rose-200 dark:border-rose-900/30 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-455 transition-all"
              >
                <LogOut className="h-4.5 w-4.5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">
              Student Hub
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, {user?.fullName}. Here is your study portal and academic progress dashboard.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="capitalize">Role: {user?.role}</span>
          </div>
        </div>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Attendance"
            value={`${overview.attendance.percentage}%`}
            icon={<BookOpen className="h-5 w-5" />}
            subtitle={`Status: ${overview.attendance.status}`}
            color={overview.attendance.color}
          />
          <Link to="/exams" className="block hover:scale-[1.02] transition-all">
            <StatCard
              title="Upcoming Exams"
              value={`${overview.exams.count} Schedule${overview.exams.count !== 1 ? 's' : ''}`}
              icon={<CalendarRange className="h-5 w-5" />}
              subtitle={overview.exams.nearestDate ? `Next: ${new Date(overview.exams.nearestDate).toLocaleDateString()}` : 'No upcoming exams'}
              color="amber"
            />
          </Link>
          <Link to="/assignments" className="block hover:scale-[1.02] transition-all">
            <StatCard
              title="Pending Assignments"
              value={`${overview.assignments.pendingCount} Task${overview.assignments.pendingCount !== 1 ? 's' : ''}`}
              icon={<ClipboardCheck className="h-5 w-5" />}
              subtitle="Priority deadline active"
              color="rose"
            />
          </Link>
          <Link to="/coding" className="block hover:scale-[1.02] transition-all">
            <StatCard
              title="Coding Streak"
              value={`${overview.coding.currentStreak} Day${overview.coding.currentStreak !== 1 ? 's' : ''}`}
              icon={<Flame className="h-5 w-5" />}
              progress={overview.goals.percentage}
              color="violet"
            />
          </Link>
          <Link to="/expenses" className="block hover:scale-[1.02] transition-all">
            <StatCard
              title="Expense Tracker"
              value="Student Budget"
              icon={<Wallet className="h-5 w-5" />}
              subtitle="Track cash flow"
              color="emerald"
            />
          </Link>
          <Link to="/community" className="block hover:scale-[1.02] transition-all">
            <StatCard
              title="Student Community"
              value="Social Hub"
              icon={<Users className="h-5 w-5" />}
              subtitle={`${notifications.filter(n => !n.isRead).length} Unread alerts`}
              color="indigo"
            />
          </Link>
        </div>

        {/* Pomodoro Timer Collapsible Block */}
        {showPomodoro && (
          <div className="mb-8 w-full max-w-md animate-slide-in">
            <PomodoroTimer onShowToast={handleShowToast} />
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="mb-8">
          <QuickActions
            onAddAssignment={() => setIsAssignmentOpen(true)}
            onAddExam={() => setIsExamOpen(true)}
            onAddInternship={() => setIsInternshipOpen(true)}
            onAddGoal={() => setIsGoalOpen(true)}
            onTogglePomodoro={() => setShowPomodoro(!showPomodoro)}
            onShowToast={handleShowToast}
          />
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <AcademicPerformance attendance={attendanceData} exams={examData} />
          <InternshipTracker internships={internshipData} />
          <PlacementTracker placements={placementData} />
          <CodingProgressWidget codingData={codingData} />
          <DailyGoalsWidget goals={goalData} onShowToast={handleShowToast} />
          <NotificationsPanel exams={examData} assignments={assignmentData} internships={internshipData} />
        </div>

        {/* Charts & Analytics Section */}
        {analyticsData && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Productivity & Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Line Chart: Attendance Trends */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-wider">Attendance Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.monthlyAttendance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: '1px solid rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} dot={{ strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Coding Activity (Bar Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-wider">Weekly Coding Submissions</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.codingActivity}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: '1px solid rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="submissions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assignment Completion rate (Pie Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="w-full md:w-1/2">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-wider">Coursework Rate</h3>
                  <p className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Assignments Summary</p>
                  <p className="text-xs text-slate-400 mt-1">Comparing total pending tasks against finished submissions.</p>
                </div>
                <div className="h-48 w-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.assignmentStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.assignmentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Completed</p>
                    <p className="text-lg font-extrabold text-slate-800 dark:text-white">
                      {analyticsData.assignmentStats[0]?.value || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Internship Status (Doughnut Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="w-full md:w-1/2">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-wider">Internship Pipelines</h3>
                  <p className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">Status Breakdown</p>
                  <p className="text-xs text-slate-400 mt-1">Aggregated statistics mapping selection status.</p>
                </div>
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.internshipAnalytics}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {analyticsData.internshipAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Goal Productivity Chart (AreaChart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-2">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-wider">Daily Goal Productivity Curve</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.productivityStats}>
                      <defs>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: '1px solid rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="completion" stroke="#10b981" fillOpacity={1} fill="url(#colorProd)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="mt-8">
          <RecentActivity />
        </div>

      </main>

      {/* Reusable Footer */}
      <Footer />

      {/* Modals Mounting */}
      <AddAssignmentModal
        isOpen={isAssignmentOpen}
        onClose={() => setIsAssignmentOpen(false)}
        onShowToast={handleShowToast}
      />
      <AddExamModal
        isOpen={isExamOpen}
        onClose={() => setIsExamOpen(false)}
        onShowToast={handleShowToast}
      />
      <AddInternshipModal
        isOpen={isInternshipOpen}
        onClose={() => setIsInternshipOpen(false)}
        onShowToast={handleShowToast}
      />
      <AddGoalModal
        isOpen={isGoalOpen}
        onClose={() => setIsGoalOpen(false)}
        onShowToast={handleShowToast}
      />

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

export default Dashboard;
