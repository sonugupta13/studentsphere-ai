import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowLeft, PlusCircle, Calendar, Clock, Edit3, Trash2, 
  ChevronLeft, ChevronRight, CheckCircle, Circle, AlertTriangle, BookOpen,
  Award, TrendingUp, Compass, Play, BarChart2, Star, CalendarDays, BrainCircuit, GraduationCap
} from 'lucide-react';

// Slice thunks
import { 
  fetchExams, fetchExamAnalytics, fetchExamCalendar,
  deleteExam, updateExam, generateStudyPlan, generateRevisionPlan
} from '../redux/slices/examSlice';
import { fetchAttendance } from '../redux/slices/attendanceSlice';

import AddExamModal from '../components/modals/AddExamModal';
import Toast from '../components/Toast';

// Recharts
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

export const ExamPlanner = () => {
  const dispatch = useDispatch();
  const [toast, setToast] = useState(null);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState(null);
  
  // Selected Exam for sub-trackers (Syllabus, Study Plan, Revisions)
  const [selectedExamId, setSelectedExamId] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [dailyHours, setDailyHours] = useState(3);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'calendar', 'analytics'
  
  // Real-time Countdown tickers
  const [nextExam, setNextExam] = useState(null);
  const [countdownText, setCountdownText] = useState({ days: 0, hours: 0, minutes: 0 });

  // Calendar Date
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Redux Selectors
  const { exams, calendarData, analytics, loading, error } = useSelector((state) => state.exams);
  const { subjects } = useSelector((state) => state.attendance);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchExams());
    dispatch(fetchExamAnalytics());
    dispatch(fetchExamCalendar());
    dispatch(fetchAttendance());
  }, [dispatch]);

  // Set default selected exam once exams load
  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0]._id);
    }
  }, [exams, selectedExamId]);

  // Live countdown timer check loop
  useEffect(() => {
    const findNextExam = () => {
      if (!exams || exams.length === 0) return;
      const upcoming = exams.filter(e => new Date(e.examDate) > new Date());
      if (upcoming.length > 0) {
        setNextExam(upcoming[0]); // sorted by date asc in controller
      } else {
        setNextExam(null);
      }
    };

    findNextExam();
    const interval = setInterval(findNextExam, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [exams]);

  // Update countdown ticker variables
  useEffect(() => {
    if (!nextExam) return;

    const updateTicker = () => {
      const examDateTime = new Date(nextExam.examDate);
      if (nextExam.examTime) {
        const [hours, minutes] = nextExam.examTime.split(':');
        examDateTime.setHours(parseInt(hours, 10) || 10, parseInt(minutes, 10) || 0, 0, 0);
      }

      const diff = examDateTime - new Date();
      if (diff > 0) {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdownText({ days: d, hours: h, minutes: m });
      } else {
        setCountdownText({ days: 0, hours: 0, minutes: 0 });
      }
    };

    updateTicker();
    const interval = setInterval(updateTicker, 60000);
    return () => clearInterval(interval);
  }, [nextExam]);

  const handleShowToast = (message, type) => {
    setToast({ message, type });
  };

  const handleCreateExamClick = () => {
    setExamToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (e, exam) => {
    e.stopPropagation();
    setExamToEdit(exam);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this exam and its study plans?')) {
      dispatch(deleteExam(id)).then((res) => {
        if (!res.error) {
          handleShowToast('Exam deleted successfully', 'success');
          if (selectedExamId === id) {
            setSelectedExamId(exams.filter(ex => ex._id !== id)[0]?._id || '');
          }
        }
      });
    }
  };

  // Syllabus tracker toggle completion
  const handleToggleTopic = (topicIdx) => {
    const exam = exams.find(e => e._id === selectedExamId);
    if (!exam) return;

    // Deep copy topics array
    const updatedTopics = exam.syllabusTopics.map((t, idx) => {
      if (idx === topicIdx) {
        const nextStatus = t.completionStatus === 'Completed' ? 'Not Started' : 'Completed';
        return {
          ...t,
          completionStatus: nextStatus,
          completionPercentage: nextStatus === 'Completed' ? 100 : 0,
        };
      }
      return t;
    });

    dispatch(updateExam({
      id: selectedExamId,
      examData: { syllabusTopics: updatedTopics },
    })).then((res) => {
      if (!res.error) {
        handleShowToast('Syllabus topic status updated', 'success');
        dispatch(fetchExamAnalytics()); // Refresh charts
      }
    });
  };

  // Generate study plans algorithmically
  const handleGenerateStudyPlan = () => {
    if (!selectedExamId) return;
    dispatch(generateStudyPlan({ examId: selectedExamId, difficulty, dailyHours })).then((res) => {
      if (!res.error) {
        handleShowToast('Study Plan generated successfully!', 'success');
        dispatch(fetchExams()); // Reload exams to get updated logs
      } else {
        handleShowToast(res.payload || 'Failed to generate study plan', 'error');
      }
    });
  };

  // Generate revision plans
  const handleGenerateRevisions = () => {
    if (!selectedExamId) return;
    dispatch(generateRevisionPlan({ examId: selectedExamId })).then((res) => {
      if (!res.error) {
        handleShowToast('Revision schedule generated successfully!', 'success');
        dispatch(fetchExams());
      } else {
        handleShowToast(res.payload || 'Failed to generate revisions', 'error');
      }
    });
  };

  // Drag-and-Drop calendar handlers
  const handleDragStart = (e, type, id) => {
    e.dataTransfer.setData('eventType', type);
    e.dataTransfer.setData('eventId', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dateStr) => {
    e.preventDefault();
    const eventType = e.dataTransfer.getData('eventType');
    const eventId = e.dataTransfer.getData('eventId');

    if (eventType === 'exam') {
      dispatch(updateExam({
        id: eventId,
        examData: { examDate: dateStr },
      })).then((res) => {
        if (!res.error) {
          handleShowToast('Exam rescheduled via calendar', 'success');
          dispatch(fetchExamCalendar());
        }
      });
    }
    // We can support rescheduling study sessions / revisions too if needed,
    // but rescheduling the central exam is the primary roadmap trigger.
  };

  // Custom Calendar Generator
  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ date: null, type: 'padding' });
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      const localString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        date: cellDate,
        dateStr: localString,
        dayNum: day,
        type: 'day',
      });
    }
    return cells;
  };

  const calendarCells = generateCalendarDays();
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // AI Planner Advice helper
  const getAIAdviceText = () => {
    const exam = exams.find(e => e._id === selectedExamId);
    if (!exam) return 'Select an exam to get study tips.';

    if (difficulty === 'Hard') {
      return `Database/Maths models marked as "Hard" require structured spaced revision. We allocated 4 hours per session and put complex topics first. Recommended study: 2 hours slots with 10 minutes Pomodoro breaks.`;
    } else if (difficulty === 'Medium') {
      return `Your topics list will be distributed evenly. Revision blocks are scheduled at 7, 3, and 1 days before the exam date. Recommended study: 45 minutes slots, focus on practice tests.`;
    } else {
      return `For easier subjects, a light conceptual recap is recommended. Topics are spread out. Recommended: 1.5 hours study session per topic.`;
    }
  };

  const selectedExam = exams.find(e => e._id === selectedExamId);
  const PIE_COLORS = ['#10b981', '#f59e0b']; // Completed vs Pending revisions

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 pb-12 font-sans">
      {/* Navbar navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Exam Planner</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {/* Next Urgent Countdown Widget */}
        {nextExam && (
          <div className="bg-gradient-to-r from-rose-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left">
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/20 border border-white/30 text-white mb-2.5">
                Urgent Exam Countdown
              </span>
              <h2 className="text-2xl font-extrabold font-outfit leading-tight">{nextExam.examName}</h2>
              <p className="text-xs text-rose-100 mt-1">
                Subject: {nextExam.subjectName} ({nextExam.examType}) | {new Date(nextExam.examDate).toLocaleDateString()} at {nextExam.examTime}
              </p>
            </div>

            {/* Live Countdown */}
            <div className="flex gap-4.5 text-center relative z-10">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 w-18 h-18 flex flex-col justify-center shadow-sm">
                <span className="text-2xl font-extrabold font-mono leading-none">{countdownText.days}</span>
                <span className="text-[9px] font-bold uppercase text-rose-100 tracking-wider mt-1">Days</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 w-18 h-18 flex flex-col justify-center shadow-sm">
                <span className="text-2xl font-extrabold font-mono leading-none">{countdownText.hours}</span>
                <span className="text-[9px] font-bold uppercase text-rose-100 tracking-wider mt-1">Hours</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 w-18 h-18 flex flex-col justify-center shadow-sm">
                <span className="text-2xl font-extrabold font-mono leading-none">{countdownText.minutes}</span>
                <span className="text-[9px] font-bold uppercase text-rose-100 tracking-wider mt-1">Mins</span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Title & Mode Switchers */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">Exam Planner Hub</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create schedules, generate study sessions, map syllabus topics, and analyze readiness scores.
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="inline-flex border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900 shadow-sm">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Compass className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BarChart2 className="h-4 w-4" />
                <span>Analytics</span>
              </button>
            </div>
            
            <button
              onClick={handleCreateExamClick}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all shadow-sm gap-1.5 ml-auto"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Schedule Exam</span>
            </button>
          </div>
        </div>

        {/* Dashboard Statistics Cards */}
        {analytics && viewMode === 'dashboard' && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-5 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Exams</p>
              <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-1.5">{analytics.totalExams}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Schedules mapped</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming</p>
              <h3 className="text-2xl font-extrabold font-outfit text-indigo-500 mt-1.5">{analytics.upcomingExams}</h3>
              <p className="text-[10px] text-indigo-600/70 mt-1">Pending tests</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-extrabold font-outfit text-emerald-500 mt-1.5">{analytics.completedExams}</h3>
              <p className="text-[10px] text-emerald-600/70 mt-1">Finished exams</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Syllabus Progress</p>
              <h3 className="text-2xl font-extrabold font-outfit text-blue-500 mt-1.5">{analytics.avgPreparationProgress}%</h3>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-1.5">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${analytics.avgPreparationProgress}%` }}></div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Revisions</p>
              <h3 className="text-2xl font-extrabold font-outfit text-rose-500 mt-1.5">{analytics.pendingRevisions}</h3>
              <p className="text-[10px] text-rose-600/70 mt-1">Milestones left</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Study Hours Logged</p>
              <h3 className="text-2xl font-extrabold font-outfit text-amber-500 mt-1.5">{analytics.studyHoursLogged}h</h3>
              <p className="text-[10px] text-amber-600/70 mt-1">Completed slots</p>
            </div>
          </div>
        )}

        {/* View Layout Mounting */}
        {viewMode === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Exams Chronological Timeline Roadmap */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Exam Timeline Roadmap</h3>
                
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  {exams.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No exams scheduled yet.</p>
                  ) : (
                    exams.map((ex) => {
                      const isSelected = ex._id === selectedExamId;
                      const dateObj = new Date(ex.examDate);
                      const isPast = dateObj < new Date();
                      
                      return (
                        <div
                          key={ex._id}
                          onClick={() => setSelectedExamId(ex._id)}
                          className={`p-4 border rounded-2xl cursor-pointer hover:scale-[1.01] transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{ex.examName}</h4>
                              <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">{ex.subjectName}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${isPast ? 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700' : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30'}`}>
                              {ex.examType}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{dateObj.toLocaleDateString()}</span>
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => handleEditClick(e, ex)}
                                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, ex).bind(this)}
                                className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Syllabus, Study Planner and Revision generators */}
            <div className="lg:col-span-2 space-y-8">
              {selectedExam ? (
                <>
                  {/* Syllabus Tracker */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-outfit">Syllabus Tracker: {selectedExam.examName}</h3>
                        <p className="text-xs text-slate-400">Mark topics completed to update preparation progress rate.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-outfit">{selectedExam.preparationProgress}%</span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Covered</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mb-6">
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-350" style={{ width: `${selectedExam.preparationProgress}%` }}></div>
                    </div>

                    {/* Topics checklist */}
                    {selectedExam.syllabusTopics.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No topics added to syllabus yet. Click Edit to add topics.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                        {selectedExam.syllabusTopics.map((top, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleToggleTopic(idx)}
                            className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all"
                          >
                            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                              {top.completionStatus === 'Completed' ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </button>
                            <div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{top.topicName}</p>
                              <span className={`inline-flex px-1.5 py-0.25 rounded text-[8px] font-extrabold uppercase tracking-wide border mt-0.5 ${top.priorityLevel === 'High' ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20' : top.priorityLevel === 'Medium' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                {top.priorityLevel}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Smart Study Planner Generator */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-outfit mb-2 flex items-center gap-1.5">
                      <BrainCircuit className="h-5 w-5 text-indigo-500" />
                      <span>AI-Powered Study Planner</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">Generates balanced topic distributions and daily targets.</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Subject Difficulty</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                        >
                          <option value="Easy">Easy (1.5h per topic)</option>
                          <option value="Medium">Medium (2.5h per topic)</option>
                          <option value="Hard">Hard (4h per topic)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Max Daily Study Hours</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={dailyHours}
                          onChange={(e) => setDailyHours(parseInt(e.target.value, 10) || 3)}
                          className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Advice Card */}
                    <div className="p-3.5 border border-indigo-100 bg-indigo-50/10 dark:border-indigo-900/30 rounded-2xl flex gap-3 items-start mb-6 text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed font-medium">
                      <AlertTriangle className="h-5.5 w-5.5 flex-shrink-0" />
                      <div>
                        <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-0.5">AI Planner Advisor</span>
                        <p>{getAIAdviceText()}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleGenerateStudyPlan}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm gap-1.5"
                      >
                        <Play className="h-4 w-4" />
                        <span>Generate Study Plan</span>
                      </button>

                      <button
                        onClick={handleGenerateRevisions}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors gap-1.5"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Generate Revisions Plan</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center text-slate-400">
                  Select or Schedule an exam to track study targets.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================================== CALENDAR VIEW ================================== */}
        {viewMode === 'calendar' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-5.5 w-5.5 text-indigo-500" />
                <span>{monthsList[calendarDate.getMonth()]} {calendarDate.getFullYear()}</span>
              </h2>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-2 min-h-[380px]">
              {calendarCells.map((cell, idx) => {
                if (cell.type === 'padding') {
                  return <div key={`pad-${idx}`} className="bg-slate-50/50 dark:bg-slate-950/5 rounded-xl border border-transparent"></div>;
                }

                // Filter events matching local date string
                const cellEvents = calendarData.filter(e => e.date === cell.dateStr);
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={cell.dateStr}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, cell.dateStr)}
                    className={`min-h-[100px] border p-2 rounded-xl flex flex-col justify-between hover:border-indigo-400 transition-colors ${isToday ? 'bg-indigo-50/15 border-indigo-200 dark:border-indigo-900/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-extrabold font-mono flex items-center justify-center h-5 w-5 rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>
                        {cell.dayNum}
                      </span>
                    </div>

                    <div className="mt-1.5 space-y-1 flex-1 overflow-hidden">
                      {cellEvents.map((evt, eIdx) => {
                        return (
                          <div
                            key={eIdx}
                            draggable={evt.type === 'exam'}
                            onDragStart={(e) => handleDragStart(e, evt.type, evt.id)}
                            className={`text-[8px] font-bold py-0.5 px-1.5 rounded-md border text-white truncate transition-all cursor-grab active:cursor-grabbing ${evt.color}`}
                            title={evt.title}
                          >
                            {evt.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================== ANALYTICS VIEW ================================== */}
        {viewMode === 'analytics' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Readiness Score Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-start">Readiness Score</h3>
              
              <div className="text-center py-6">
                <h2 className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 font-outfit">{analytics.readinessScore}%</h2>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-extrabold border bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 mt-3">
                  Level: {analytics.preparationLevel}
                </span>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed max-w-[200px] mx-auto">
                  Weighted rate calculated on syllabus, hours logged, and revision milestones completed.
                </p>
              </div>
            </div>

            {/* Daily study hours (Line Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Weekly Study Hours Progress</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.studyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject completion rates (Bar Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Subject-wise Preparation rate</h3>
              <div className="h-56">
                {analytics.subjectDistribution.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No exams mapped.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.subjectDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="subject" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="completion" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Revision completions (Pie Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-start font-outfit">Revision Status</h3>
              
              <div className="h-40 w-40 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: analytics.revisionStatusDistribution.Completed },
                        { name: 'Pending', value: analytics.revisionStatusDistribution.Pending },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends */}
              <div className="flex gap-4 text-[9px] font-bold text-slate-400 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span>Completed ({analytics.revisionStatusDistribution.Completed})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  <span>Pending ({analytics.revisionStatusDistribution.Pending})</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Add/Edit Modal */}
      <AddExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onShowToast={handleShowToast}
        examToEdit={examToEdit}
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

export default ExamPlanner;
