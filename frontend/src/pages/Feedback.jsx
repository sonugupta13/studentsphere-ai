import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Moon,
  Sun,
  Mail,
  Send,
  HelpCircle,
  Bug,
  Lightbulb,
  FileText,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { logoutUser } from '../redux/slices/authSlice';
import { submitFeedback, clearReviewsError, resetSuccessFlags } from '../redux/slices/reviewSlice';
import { Footer } from '../components/Footer';
import Toast from '../components/Toast';

export const Feedback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux Selectors
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { loading, error, feedbackSuccess } = useSelector((state) => state.reviews);

  // Local State
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [subject, setSubject] = useState('');
  const [feedbackType, setFeedbackType] = useState('Suggestion');
  const [message, setMessage] = useState('');

  // SEO Setup
  useEffect(() => {
    document.title = 'Submit Feedback | StudentSphere AI';
  }, []);

  // Handle toast notifications and form reset on success
  useEffect(() => {
    if (feedbackSuccess) {
      setToast({
        message: 'Feedback submitted successfully! Thank you for helping us improve.',
        type: 'success',
      });
      setSubject('');
      setFeedbackType('Suggestion');
      setMessage('');
      dispatch(resetSuccessFlags());
    }
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearReviewsError());
    }
  }, [feedbackSuccess, error, dispatch]);

  // Dark mode handler
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

  // Logout handler
  const handleLogout = () => {
    dispatch(logoutUser()).then((res) => {
      if (!res.error) {
        navigate('/login');
      }
    });
  };

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setToast({ message: 'Please provide all fields.', type: 'error' });
      return;
    }

    const feedbackData = {
      subject,
      feedbackType,
      message,
    };

    dispatch(submitFeedback(feedbackData));
  };

  // Helper icon for feedback type
  const getFeedbackTypeIcon = (type) => {
    switch (type) {
      case 'Bug Report':
        return <Bug className="h-5 w-5 text-rose-500" />;
      case 'Feature Request':
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case 'Suggestion':
        return <Sparkles className="h-5 w-5 text-indigo-500" />;
      case 'Complaint':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 text-slate-800 dark:text-slate-100 overflow-x-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <Link to="/" className="text-xl font-bold font-outfit text-slate-900 dark:text-white">
                StudentSphere AI
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <Link
                to="/about"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                About
              </Link>
              <Link
                to="/reviews"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                Reviews
              </Link>
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Portal Hub
              </Link>

              {/* Theme Switcher */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all ml-2"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl uppercase tracking-wider">
                  Hi, {user?.fullName.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex justify-center items-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
              >
                {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
              </button>
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all font-bold"
              >
                {isNavOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {isNavOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-4 space-y-3 shadow-xl">
            <Link to="/about" className="block py-2 font-semibold text-slate-700 dark:text-slate-300">
              About
            </Link>
            <Link to="/reviews" className="block py-2 font-semibold text-slate-700 dark:text-slate-300">
              Reviews
            </Link>
            <Link to="/dashboard" className="block py-2 font-semibold text-indigo-600 dark:text-indigo-400">
              Portal Hub
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left py-2 font-semibold text-rose-650"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left Column Info / Contact Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
              <h3 className="text-xl font-extrabold font-outfit mb-2">We'd love to hear from you!</h3>
              <p className="text-xs text-indigo-150 leading-relaxed font-medium">
                Your thoughts, bug reports, and suggestions directly shape the future roadmap of StudentSphere AI.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-center">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full w-fit mx-auto mb-4">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Need Help?</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed font-medium">
                Encountering an account issue or billing query? Reach out directly to support.
              </p>
              
              <a
                href="mailto:support@studentsphere.ai?subject=Support%20Request%20-%20StudentSphere%20AI"
                className="mt-4 w-full inline-flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold transition-all"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Contact Support</span>
              </a>
            </div>
          </div>

          {/* Right Column Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white">
                Share Feedback
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-1">
                Feedback sent here is private and secure, reviewed directly by developers and administrators.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Feedback Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                  {['Bug Report', 'Feature Request', 'Suggestion', 'Complaint', 'General Feedback'].map((type) => {
                    const active = feedbackType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFeedbackType(type)}
                        className={`flex items-center gap-3 p-3.5 border rounded-2xl text-left transition-all ${
                          active
                            ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        {getFeedbackTypeIcon(type)}
                        <span className="text-xs font-bold">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Issues importing study guides / Feature idea for Pomodoro"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-indigo-550 transition-all"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Detailed Message</label>
                <textarea
                  rows={6}
                  placeholder="Please enter details of your request. Include steps to reproduce if you are reporting a bug."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-indigo-550 transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-md flex justify-center items-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Feedback;
