import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ThumbsUp,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Moon,
  Sun,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { logoutUser } from '../redux/slices/authSlice';
import {
  fetchReviews,
  fetchReviewStats,
  fetchMyReview,
  submitReview,
  updateReview,
  deleteReview,
  markHelpful,
  clearReviewsError,
  resetSuccessFlags,
} from '../redux/slices/reviewSlice';
import { Footer } from '../components/Footer';
import Toast from '../components/Toast';

export const Reviews = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux Selectors
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const {
    reviews,
    pagination,
    reviewStats,
    myReview,
    loading,
    error,
    submitSuccess,
  } = useSelector((state) => state.reviews);

  // Local State
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Form & Filtering State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);

  // Review Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRecommend, setFormRecommend] = useState(true);
  const [formAnonymous, setFormAnonymous] = useState(false);

  // SEO Setup
  useEffect(() => {
    document.title = 'Student Reviews | StudentSphere AI';
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content =
      'See what verified students are saying about StudentSphere AI and share your own experience.';
  }, []);

  // Fetch initial stats and list
  useEffect(() => {
    dispatch(fetchReviewStats());
    if (isAuthenticated) {
      dispatch(fetchMyReview());
    }
  }, [dispatch, isAuthenticated]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch reviews when filters / pagination change
  useEffect(() => {
    dispatch(
      fetchReviews({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        rating: ratingFilter,
        sort: sortOrder,
      })
    );
  }, [dispatch, currentPage, debouncedSearch, ratingFilter, sortOrder]);

  // Handle toast notifications and modal close on success
  useEffect(() => {
    if (submitSuccess) {
      setToast({
        message: myReview ? 'Review updated successfully. Pending moderation approval.' : 'Review submitted successfully. Pending moderation approval.',
        type: 'success',
      });
      setIsModalOpen(false);
      dispatch(resetSuccessFlags());
      dispatch(fetchMyReview());
    }
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearReviewsError());
    }
  }, [submitSuccess, error, dispatch, myReview]);

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

  // Open modal for new review or editing existing review
  const handleWriteReviewClick = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=reviews');
      return;
    }
    
    if (myReview) {
      setFormRating(myReview.rating);
      setFormTitle(myReview.title);
      setFormDescription(myReview.description);
      setFormRecommend(myReview.recommend);
      setFormAnonymous(myReview.isAnonymous);
    } else {
      setFormRating(5);
      setFormTitle('');
      setFormDescription('');
      setFormRecommend(true);
      setFormAnonymous(false);
    }
    setIsModalOpen(true);
  };

  // Review Form Submit Handler
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      setToast({ message: 'Please provide both title and description.', type: 'error' });
      return;
    }

    const reviewData = {
      rating: formRating,
      title: formTitle,
      description: formDescription,
      recommend: formRecommend,
      isAnonymous: formAnonymous,
    };

    if (myReview) {
      dispatch(updateReview({ id: myReview._id, reviewData }));
    } else {
      dispatch(submitReview(reviewData));
    }
  };

  // Review Delete Handler
  const handleReviewDelete = () => {
    if (myReview && window.confirm('Are you sure you want to delete your review?')) {
      dispatch(deleteReview(myReview._id)).then((res) => {
        if (!res.error) {
          setToast({ message: 'Review deleted successfully.', type: 'success' });
          setIsModalOpen(false);
          dispatch(fetchMyReview());
        }
      });
    }
  };

  // Helpful Vote Handler
  const handleHelpfulClick = (reviewId) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=reviews');
      return;
    }
    dispatch(markHelpful(reviewId));
  };

  // Distribution percentages helper
  const getRatingPercentage = (stars) => {
    if (!reviewStats || reviewStats.totalReviews === 0) return 0;
    const count = reviewStats.distribution[stars] || 0;
    return Math.round((count / reviewStats.totalReviews) * 100);
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
                to="/feedback"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                Feedback
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Portal Hub
                </Link>
              ) : null}

              {/* Theme Switcher */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all ml-2"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
              </button>

              {/* Action Buttons */}
              {!isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="inline-flex justify-center items-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              ) : (
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
              )}
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
            <Link to="/feedback" className="block py-2 font-semibold text-slate-700 dark:text-slate-300">
              Feedback
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block py-2 font-semibold text-indigo-600 dark:text-indigo-400">
                  Portal Hub
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 font-semibold text-rose-650"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1 text-center py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl font-semibold text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="flex-1 text-center py-2.5 bg-indigo-650 text-white rounded-xl font-semibold text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Student Experiences</span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold font-outfit text-slate-900 dark:text-white">
            What Students Say ❤️
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Hear from verified students managing exams, coding profiles, budgets, and academics in one smart workspace.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Average Rating Big Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm flex flex-col justify-center items-center text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Rating</h3>
            <div className="text-6xl font-extrabold font-outfit text-slate-950 dark:text-white flex items-baseline gap-1">
              <span>{reviewStats ? reviewStats.averageRating : '0.0'}</span>
              <span className="text-lg font-bold text-slate-400">/ 5</span>
            </div>
            
            {/* Stars */}
            <div className="flex items-center gap-1 my-3 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(reviewStats?.averageRating || 0)
                      ? 'fill-current'
                      : 'text-slate-200 dark:text-slate-800'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
              Based on {reviewStats ? reviewStats.totalReviews : 0} Verified Reviews
            </p>

            <button
              onClick={handleWriteReviewClick}
              className="mt-6 w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus className="h-4 w-4" />
              <span>{myReview ? 'Update My Review' : 'Write a Review'}</span>
            </button>

            {myReview && (
              <div className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>My Review Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  myReview.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : myReview.status === 'Rejected'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450'
                }`}>
                  {myReview.status}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bars Distribution Card */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Rating Distribution</h3>
            
            <div className="space-y-3.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const pct = getRatingPercentage(stars);
                const count = reviewStats?.distribution[stars] || 0;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-12 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 justify-end">
                      <span>{stars}</span>
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    </span>

                    {/* Progress Track */}
                    <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full"
                      />
                    </div>

                    <span className="w-20 text-xs font-bold text-slate-400 flex justify-between">
                      <span>{pct}%</span>
                      <span className="text-[10px]">({count})</span>
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-indigo-650 dark:text-indigo-400">
                <CheckCircle className="h-4 w-4" />
                <span>100% genuine students</span>
              </span>
              <span>All reviews moderated manually</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold outline-none focus:border-indigo-550 transition-all placeholder-slate-400 dark:placeholder-slate-650"
            />
          </div>

          {/* Filters and Sorting selectors */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Filter by Stars */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-sm font-semibold outline-none border-none cursor-pointer py-1.5"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                <option value="4">4 Stars ⭐⭐⭐⭐</option>
                <option value="3">3 Stars ⭐⭐⭐</option>
                <option value="2">2 Stars ⭐⭐</option>
                <option value="1">1 Star ⭐</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-sm font-semibold outline-none border-none cursor-pointer py-1.5"
              >
                <option value="latest">Latest Reviews</option>
                <option value="highest">Highest Rating</option>
                <option value="oldest">Oldest Reviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews Listing Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[1, 2, 3, 4].map((skeleton) => (
              <div key={skeleton} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-60 animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-850 rounded"></div>
                      <div className="h-2 w-20 bg-slate-200 dark:bg-slate-850 rounded"></div>
                    </div>
                  </div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-850 rounded"></div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-850 rounded"></div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-850 rounded"></div>
                  <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-850 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm mb-8 space-y-4">
            <div className="text-slate-300 dark:text-slate-700 text-5xl">⭐</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No reviews found</h3>
            <p className="text-sm text-slate-450 dark:text-slate-500 max-w-sm mx-auto">
              There are no approved reviews matching your filters. Be the first to submit a review!
            </p>
            <button
              onClick={handleWriteReviewClick}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all"
            >
              Write a Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AnimatePresence mode="popLayout">
              {reviews.map((review) => (
                <motion.div
                  key={review._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-slate-750 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: User details & Stars */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img
                          src={review.userId?.avatar || `https://ui-avatars.com/api/?name=User&background=random`}
                          alt={review.isAnonymous ? 'Anonymous' : review.userId?.fullName || 'User'}
                          className="h-10 w-10 rounded-full border border-slate-150 dark:border-slate-800 object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {review.isAnonymous ? 'Anonymous Student' : review.userId?.fullName || 'Student'}
                            </h4>
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded-md leading-none gap-0.5">
                              <span>✓</span>
                              <span>Verified Student</span>
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 leading-none">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4.5 w-4.5 ${
                              star <= review.rating ? 'fill-current' : 'text-slate-100 dark:text-slate-850'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {review.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                        {review.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: recommend & helpful votes */}
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <span>Recommend?</span>
                      <span className={review.recommend ? 'text-indigo-500' : 'text-slate-450'}>
                        {review.recommend ? 'Yes 👍' : 'No 👎'}
                      </span>
                    </span>

                    {/* Helpful Button */}
                    <button
                      onClick={() => handleHelpfulClick(review._id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[10px] font-bold transition-all ${
                        review.helpfulVotes?.includes(user?._id)
                          ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-950/30 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-450'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>Helpful ({review.helpfulCount})</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-xs font-bold text-slate-500 dark:text-slate-450">
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {/* Review Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10 p-6 md:p-8 space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-extrabold font-outfit text-slate-900 dark:text-white">
                    {myReview ? 'Edit Your Experience' : 'Rate StudentSphere AI'}
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                    Help us improve the platform for students globally.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Review Submit Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Rating component */}
                <div className="space-y-1.5 text-center bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">How would you rate StudentSphere?</span>
                  <div className="flex justify-center items-center gap-1.5 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormRating(star)}
                        className="p-1 outline-none text-amber-500 scale-100 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Star
                          className={`h-8 w-8 cursor-pointer ${
                            star <= (hoverRating || formRating)
                              ? 'fill-current'
                              : 'text-slate-200 dark:text-slate-850'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase">
                    {formRating === 5
                      ? '⭐ 5 Stars - Excellent Productivity Platform!'
                      : formRating === 4
                      ? '⭐⭐ 4 Stars - Very Good Platform'
                      : formRating === 3
                      ? '⭐⭐⭐ 3 Stars - Average / Decent'
                      : formRating === 2
                      ? '⭐⭐⭐⭐ 2 Stars - Need Improvements'
                      : '⭐⭐⭐⭐⭐ 1 Star - Poor Experience'}
                  </span>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Review Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Excellent productivity companion! / Life saver for finals"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-indigo-550 transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Detailed Review</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us what you liked, how it helped you study, or what we should add to make it even better."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-indigo-550 transition-all resize-none"
                  />
                </div>

                {/* Recommendations and anonymity toggles */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Recommend toggle */}
                  <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formRecommend}
                      onChange={(e) => setFormRecommend(e.target.checked)}
                      className="h-4.5 w-4.5 accent-indigo-650 cursor-pointer"
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold leading-tight">Recommend?</div>
                      <span className="text-[9px] font-semibold text-slate-400 leading-none">Would recommend to peers</span>
                    </div>
                  </label>

                  {/* Anonymous toggle */}
                  <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formAnonymous}
                      onChange={(e) => setFormAnonymous(e.target.checked)}
                      className="h-4.5 w-4.5 accent-indigo-650 cursor-pointer"
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold leading-tight">Post Anonymously</div>
                      <span className="text-[9px] font-semibold text-slate-400 leading-none">Censors name & avatar</span>
                    </div>
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex gap-3">
                  {myReview && (
                    <button
                      type="button"
                      onClick={handleReviewDelete}
                      className="px-4 py-3 border border-rose-200 hover:bg-rose-50 text-rose-600 dark:border-rose-950/20 dark:hover:bg-rose-950/30 rounded-xl font-bold text-sm transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md"
                  >
                    {loading ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Reviews;
