import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Trash2, Copy, Edit, Loader, CheckCircle2,
  AlertCircle, Moon, Sun, LogOut, Sparkles, BarChart2, Calendar, Layout
} from 'lucide-react';

// Slices
import { logoutUser } from '../redux/slices/authSlice';
import {
  fetchResumes,
  createResume,
  deleteResume,
  duplicateResume,
  clearResumeError
} from '../redux/slices/resumeSlice';

// Components
import Toast from '../components/Toast';

export const ResumeBuilder = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Component State
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState('Modern');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Redux Selectors
  const { user } = useSelector((state) => state.auth);
  const { resumes, loading, error } = useSelector((state) => state.resumes);

  useEffect(() => {
    dispatch(fetchResumes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearResumeError());
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

  const handleCreateResume = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setToast({ message: 'Please enter a resume title', type: 'error' });
      return;
    }

    dispatch(createResume({ resumeTitle: newTitle, template: newTemplate }))
      .unwrap()
      .then((data) => {
        setToast({ message: 'Resume draft created successfully!', type: 'success' });
        setShowCreateModal(false);
        setNewTitle('');
        // Redirect straight to editor
        navigate(`/resumes/edit/${data.resume._id}`);
      })
      .catch((err) => {
        setToast({ message: err || 'Failed to create resume', type: 'error' });
      });
  };

  const handleDuplicate = (id) => {
    setActionLoadingId(id);
    dispatch(duplicateResume(id))
      .unwrap()
      .then(() => {
        setToast({ message: 'Resume duplicated successfully!', type: 'success' });
      })
      .catch((err) => {
        setToast({ message: err || 'Failed to duplicate resume', type: 'error' });
      })
      .finally(() => {
        setActionLoadingId(null);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this resume draft? This action cannot be undone.')) {
      setActionLoadingId(id);
      dispatch(deleteResume(id))
        .unwrap()
        .then(() => {
          setToast({ message: 'Resume deleted successfully.', type: 'success' });
        })
        .catch((err) => {
          setToast({ message: err || 'Failed to delete resume', type: 'error' });
        })
        .finally(() => {
          setActionLoadingId(null);
        });
    }
  };

  // Math helper for averages
  const totalResumes = resumes.length;
  const avgATS = totalResumes > 0
    ? Math.round(resumes.reduce((acc, r) => acc + (r.atsScore || 0), 0) / totalResumes)
    : 0;
  const avgCompletion = totalResumes > 0
    ? Math.round(resumes.reduce((acc, r) => acc + (r.completionPercentage || 0), 0) / totalResumes)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 font-sans pb-12">
      {/* Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <Link to="/dashboard" className="text-xl font-bold font-outfit text-slate-900 dark:text-white hover:opacity-90">
                StudentSphere AI
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
              >
                {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
              </button>

              <Link
                to="/attendance"
                className="hidden lg:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Attendance Portal
              </Link>

              <Link
                to="/assignments"
                className="hidden lg:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Assignments Portal
              </Link>

              <Link
                to="/notes"
                className="hidden lg:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Notes Vault
              </Link>

              <Link
                to="/exams"
                className="hidden lg:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Exam Planner
              </Link>

              <Link
                to="/cgpa"
                className="hidden lg:inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                CGPA Calculator
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <LogOut className="h-4.5 w-4.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">
              Resume Builder
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create, duplicate, customize and optimize recruiter-approved ATS-friendly resumes.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Build New Resume
          </button>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Resume Drafts</h3>
            <p className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mt-2">{totalResumes}</p>
            <div className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-1">Ready for custom applications</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Average ATS Score</h3>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">{avgATS}%</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${avgATS >= 75 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' : avgATS >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'}`}>
                {avgATS >= 75 ? 'Strong ATS' : avgATS >= 50 ? 'Medium' : 'Needs Work'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Based on keyword matching & formatting checks</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Average Completeness</h3>
            <p className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mt-2">{avgCompletion}%</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all"
                style={{ width: `${avgCompletion}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Resumes Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader className="h-10 w-10 text-indigo-600 animate-spin" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-3xl text-center flex flex-col items-center max-w-xl mx-auto shadow-sm mt-8">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-4">
              <FileText className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">No Resumes Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              Build a polished resume using professional templates and instant ATS score feedback.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Build Your First Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Card Title & Template style */}
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white truncate pr-4">
                      {resume.resumeTitle}
                    </h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Layout className="h-2.5 w-2.5" />
                      {resume.template}
                    </span>
                  </div>

                  {/* Completion and ATS score */}
                  <div className="mt-4 space-y-3">
                    {/* Completion bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        <span>Completeness</span>
                        <span>{resume.completionPercentage || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all"
                          style={{ width: `${resume.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* ATS gauge */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ATS Score:</span>
                      </div>
                      <span className={`text-sm font-extrabold ${resume.atsScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' : resume.atsScore >= 50 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {resume.atsScore || 0}%
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Updated: {new Date(resume.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                  <Link
                    to={`/resumes/edit/${resume._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Draft
                  </Link>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDuplicate(resume._id)}
                      disabled={actionLoadingId === resume._id}
                      className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
                      title="Duplicate Draft"
                    >
                      {actionLoadingId === resume._id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(resume._id)}
                      disabled={actionLoadingId === resume._id}
                      className="p-2 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 rounded-lg transition-all text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50"
                      title="Delete Draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE NEW MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl animate-scale-up">
            <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Build New Resume</h2>
            <p className="text-xs text-slate-500 mt-1">Specify your resume title and template style.</p>

            <form onSubmit={handleCreateResume} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Resume Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer Draft"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Template Style
                </label>
                <select
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="Modern">Modern (Sleek, Accent Color)</option>
                  <option value="Professional">Professional (Serif, Elegant Grid)</option>
                  <option value="ATS Friendly">ATS Friendly (Standard Single-Column)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTitle('');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
                >
                  Start Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
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

export default ResumeBuilder;
