import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './redux/slices/authSlice';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AttendanceDashboard from './pages/AttendanceDashboard';
import AssignmentManager from './pages/AssignmentManager';
import NotesVault from './pages/NotesVault';
import ExamPlanner from './pages/ExamPlanner';
import CGPACalculator from './pages/CGPACalculator';
import ResumeBuilder from './pages/ResumeBuilder';
import ResumeEditor from './pages/ResumeEditor';
import CodingDashboard from './pages/CodingDashboard';
import ExpenseDashboard from './pages/ExpenseDashboard';
import CommunityForum from './pages/CommunityForum';
import PostDetails from './pages/PostDetails';
import DiscussionRoom from './pages/DiscussionRoom';
import UserProfile from './pages/UserProfile';
import CommunityAnalytics from './pages/CommunityAnalytics';
import About from './pages/About';


export const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  // Trigger silent check of auth status on initial page load
  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  // Read saved theme from local storage or fallback to system preference
  useEffect(() => {
    const root = document.documentElement;
    const localTheme = localStorage.getItem('theme');
    
    if (localTheme === 'dark' || (!localTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  if (loading && !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-500"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading StudentSphere AI...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />

        {/* Protected Student Portal */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Attendance Portal */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AttendanceDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Assignment Manager Portal */}
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <AssignmentManager />
            </ProtectedRoute>
          }
        />

        {/* Protected Notes Vault Portal */}
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <NotesVault />
            </ProtectedRoute>
          }
        />

        {/* Protected Exam Planner Portal */}
        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <ExamPlanner />
            </ProtectedRoute>
          }
        />

        {/* Protected CGPA Calculator Portal */}
        <Route
          path="/cgpa"
          element={
            <ProtectedRoute>
              <CGPACalculator />
            </ProtectedRoute>
          }
        />

        {/* Protected Resume Builder Portal */}
        <Route
          path="/resumes"
          element={
            <ProtectedRoute>
              <ResumeBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resumes/edit/:id"
          element={
            <ProtectedRoute>
              <ResumeEditor />
            </ProtectedRoute>
          }
        />

        {/* Protected Coding Tracker Portal */}
        <Route
          path="/coding"
          element={
            <ProtectedRoute>
              <CodingDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Expense Tracker Portal */}
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <ExpenseDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Student Community */}
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityForum />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community/post/:id"
          element={
            <ProtectedRoute>
              <PostDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community/discussion/:id"
          element={
            <ProtectedRoute>
              <DiscussionRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community/profile/:id"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community/analytics"
          element={
            <ProtectedRoute>
              <CommunityAnalytics />
            </ProtectedRoute>
          }
        />


        {/* Protected Admin Portal */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Root Redirect handler */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
