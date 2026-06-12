import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Sparkles, CheckCircle2, Copy, AlertCircle, GraduationCap } from 'lucide-react';
import { forgotPassword, clearError, clearSuccessMessage } from '../redux/slices/authSlice';
import Toast from '../components/Toast';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);

  const dispatch = useDispatch();
  const { loading, error, successMessage, devResetUrl } = useSelector((state) => state.auth);

  useEffect(() => {
    // Clear status on mount
    dispatch(clearError());
    dispatch(clearSuccessMessage());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setToast({ message: 'Please enter your email address', type: 'error' });
      return;
    }
    dispatch(forgotPassword(email));
  };

  const handleCopyLink = () => {
    if (devResetUrl) {
      navigator.clipboard.writeText(devResetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-6">
          <GraduationCap className="h-4 w-4" />
          <span>StudentSphere AI</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-outfit">
          Forgot password?
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          No worries, we'll send you instructions to reset it.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 border border-slate-200 dark:border-slate-800/80 shadow-md sm:rounded-2xl sm:px-10 glass transition-all duration-300">
          {successMessage ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Email Sent Successfully</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  We have generated a password reset link. Please check your inbox (or check the server console logs).
                </p>
              </div>

              {/* Dev convenience block */}
              {devResetUrl && (
                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/20 text-left">
                  <div className="flex gap-2 items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>DEVELOPER TESTING PORTAL</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    A test reset URL was created and logged. Click below to reset directly:
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to={`/reset-password/${devResetUrl.split('/').pop()}`}
                      className="flex-1 text-center py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Reset Password Now
                    </Link>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy Reset Link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {copied && <p className="text-[10px] text-emerald-500 font-semibold mt-1.5 text-right">Copied link!</p>}
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <div className="mt-1.5 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent sm:text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-all gap-2 items-center"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Send reset link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 gap-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

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

export default ForgotPassword;
