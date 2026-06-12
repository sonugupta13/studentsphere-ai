import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Calendar, BookOpen, Clock, AlertTriangle, CheckCircle2, 
  Trash2, Plus, PlusCircle, ArrowLeft, Download, FileText, Search,
  Filter, ArrowUpDown, CalendarDays, List, Copy, Edit3, Circle,
  Play, CheckCircle, HelpCircle, FileDown, ChevronLeft, ChevronRight, GraduationCap
} from 'lucide-react';

// Slice thunks
import { 
  fetchAssignments, fetchAnalytics, fetchCalendar,
  deleteAssignment, updateStatus, updatePriority, updateAssignment
} from '../redux/slices/assignmentSlice';

import AddAssignmentModal from '../components/modals/AddAssignmentModal';
import Toast from '../components/Toast';

// Recharts
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

export const AssignmentManager = () => {
  const dispatch = useDispatch();
  const [toast, setToast] = useState(null);
  
  // Modals & view states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [preselectedDate, setPreselectedDate] = useState(null);

  // Search & Filter & Sort states
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sort, setSort] = useState('Nearest Deadline');

  // Redux Selectors
  const { assignments, analytics, calendarData, loading, error } = useSelector((state) => state.assignments);
  const { subjects } = useSelector((state) => state.attendance);

  // Calendar states
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Load initial data
  useEffect(() => {
    dispatch(fetchAssignments({ search, subject: subjectFilter, priority: priorityFilter, status: statusFilter, dueDate: dateFilter, sort }));
    dispatch(fetchAnalytics());
    dispatch(fetchCalendar());
  }, [dispatch, search, subjectFilter, priorityFilter, statusFilter, dateFilter, sort]);

  const handleShowToast = (message, type) => {
    setToast({ message, type });
  };

  const handleCreateAssignmentClick = () => {
    setAssignmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (asg) => {
    setAssignmentToEdit(asg);
    setIsModalOpen(true);
  };

  const handleDuplicateClick = (asg) => {
    // Open modal with pre-filled details but without ID (so it creates a new entry)
    setAssignmentToEdit({
      title: `${asg.title} (Copy)`,
      subject: asg.subject,
      description: asg.description,
      dueDate: asg.dueDate,
      dueTime: asg.dueTime,
      priority: asg.priority,
      status: 'Not Started',
      completionPercentage: 0,
      estimatedHours: asg.estimatedHours,
      notes: asg.notes,
      attachments: [], // don't copy attachments to keep clean
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      dispatch(deleteAssignment(id)).then((res) => {
        if (!res.error) {
          handleShowToast('Assignment deleted successfully', 'success');
        }
      });
    }
  };

  const handleStatusToggle = (asg) => {
    const nextStatus = asg.status === 'Completed' ? 'Not Started' : 'Completed';
    dispatch(updateStatus({ id: asg._id, status: nextStatus })).then((res) => {
      if (!res.error) {
        handleShowToast(`Assignment marked as ${nextStatus}`, 'success');
      }
    });
  };

  const handleQuickStatusChange = (id, status) => {
    dispatch(updateStatus({ id, status })).then((res) => {
      if (!res.error) {
        handleShowToast(`Status updated to ${status}`, 'success');
      }
    });
  };

  const handleQuickPriorityChange = (id, priority) => {
    dispatch(updatePriority({ id, priority })).then((res) => {
      if (!res.error) {
        handleShowToast(`Priority updated to ${priority}`, 'success');
      }
    });
  };

  // Drag-and-Drop Handlers for Calendar View
  const handleDragStart = (e, asgId) => {
    e.dataTransfer.setData('text/plain', asgId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dateStr) => {
    e.preventDefault();
    const asgId = e.dataTransfer.getData('text/plain');
    if (!asgId) return;

    // Find assignment details to retain others
    const originalAsg = assignments.find((a) => a._id === asgId);
    if (!originalAsg) return;

    // Update assignment date
    const formData = new FormData();
    formData.append('dueDate', dateStr);

    dispatch(updateAssignment({ id: asgId, formData })).then((res) => {
      if (!res.error) {
        handleShowToast('Due date updated via drag & drop', 'success');
      }
    });
  };

  // Compile notifications (Overdue, Due Today, Due Tomorrow)
  const getDeadlineNotifications = () => {
    if (!assignments) return [];
    
    const nowStr = new Date().toISOString().split('T')[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const alerts = [];
    assignments.forEach((asg) => {
      if (asg.status === 'Completed') return;

      const dueStr = new Date(asg.dueDate).toISOString().split('T')[0];
      if (asg.status === 'Overdue') {
        alerts.push({
          id: asg._id,
          type: 'overdue',
          message: `Overdue: "${asg.title}" was due on ${new Date(asg.dueDate).toLocaleDateString()}`,
          color: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400',
        });
      } else if (dueStr === nowStr) {
        alerts.push({
          id: asg._id,
          type: 'today',
          message: `Due Today: "${asg.title}" deadline is today at ${asg.dueTime}`,
          color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400',
        });
      } else if (dueStr === tomorrowStr) {
        alerts.push({
          id: asg._id,
          type: 'tomorrow',
          message: `Due Tomorrow: "${asg.title}" is due tomorrow`,
          color: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400',
        });
      }
    });
    return alerts.slice(0, 3); // show top 3 alerts
  };

  const deadlineNotifications = getDeadlineNotifications();

  // Helper colors mapping
  const priorityColors = {
    High: 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400',
    Medium: 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400',
    Low: 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400',
  };

  const statusColors = {
    'Not Started': 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
    'In Progress': 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400',
    'Under Review': 'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900/30 dark:text-purple-400',
    'Completed': 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400',
    'Overdue': 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400',
  };

  // Recharts PIE configuration
  const PIE_COLORS = ['#64748b', '#3b82f6', '#a855f7', '#10b981', '#ef4444']; // Not Started, In Progress, Under Review, Completed, Overdue
  const doughnutData = analytics ? [
    { name: 'Not Started', value: analytics.statusDistribution['Not Started'] },
    { name: 'In Progress', value: analytics.statusDistribution['In Progress'] },
    { name: 'Under Review', value: analytics.statusDistribution['Under Review'] },
    { name: 'Completed', value: analytics.statusDistribution['Completed'] },
    { name: 'Overdue', value: analytics.statusDistribution['Overdue'] },
  ].filter(d => d.value > 0) : [];

  // Custom Calendar Generator Logic
  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // First day of current month
    const firstDay = new Date(year, month, 1).getDay();
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    
    // Fill empty cells for previous month padding
    for (let i = 0; i < firstDay; i++) {
      cells.push({ date: null, type: 'padding' });
    }
    
    // Fill cells for current month days
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      // Format to YYYY-MM-DD local format
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

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const handleCalendarCellClick = (dateStr) => {
    // Set clicked date as preselected date, open add modal
    setPreselectedDate(dateStr);
    setAssignmentToEdit({
      title: '',
      subject: subjects[0]?.subjectName || '',
      description: '',
      dueDate: dateStr,
      dueTime: '23:59',
      priority: 'Medium',
      status: 'Not Started',
      completionPercentage: 0,
      estimatedHours: 0,
      notes: '',
      attachments: [],
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 pb-12">
      {/* Navbar navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-45">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Assignment Manager</span>
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

      {/* Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {/* Alerts Banner */}
        {deadlineNotifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {deadlineNotifications.map((alert) => (
              <div 
                key={alert.id}
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all shadow-sm ${alert.color}`}
              >
                <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Dashboard Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">Assignments Center</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Organize tasks, track schedules, view completion rates, and submit on time.
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="inline-flex border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List Mode</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar Grid</span>
              </button>
            </div>
            
            <button
              onClick={handleCreateAssignmentClick}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all shadow-sm gap-1.5 ml-auto"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>New Assignment</span>
            </button>
          </div>
        </div>

        {/* Statistics Aggregations Cards */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-5 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks</p>
              <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-1.5">{analytics.total}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Assignments logged</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-extrabold font-outfit text-emerald-500 mt-1.5">{analytics.completed}</h3>
              <p className="text-[10px] text-emerald-600/70 mt-1">Submission ready</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-extrabold font-outfit text-blue-500 mt-1.5">{analytics.pending}</h3>
              <p className="text-[10px] text-blue-550 mt-1">In progress lists</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue</p>
              <h3 className="text-2xl font-extrabold font-outfit text-rose-500 mt-1.5">{analytics.overdue}</h3>
              <p className="text-[10px] text-rose-600/70 mt-1">Past due dates</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Priority</p>
              <h3 className="text-2xl font-extrabold font-outfit text-amber-500 mt-1.5">{analytics.highPriority}</h3>
              <p className="text-[10px] text-amber-600 mt-1">Urgent attention</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productivity Score</p>
              <h3 className="text-2xl font-extrabold font-outfit text-indigo-500 mt-1.5">{analytics.productivityScore}%</h3>
              <p className="text-[10px] text-slate-400 mt-1">Submission efficiency</p>
            </div>
          </div>
        )}

        {/* View Mode Switching */}
        {viewMode === 'list' ? (
          /* ================================== LIST VIEW ================================== */
          <div className="space-y-6">
            
            {/* Filter and Control Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4.5 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search assignments..."
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                />
              </div>

              {/* Filters dropdowns */}
              <div className="grid grid-cols-2 md:flex flex-wrap gap-2.5 w-full md:w-auto">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s.subjectName}>{s.subjectName}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="">All Dates</option>
                  <option value="today">Due Today</option>
                  <option value="tomorrow">Due Tomorrow</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="overdue">Overdue</option>
                </select>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="col-span-2 md:col-span-1 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="Nearest Deadline">Nearest Deadline</option>
                  <option value="Highest Priority">Highest Priority</option>
                  <option value="Recently Added">Recently Added</option>
                  <option value="Alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* List Table container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  <thead className="bg-slate-50/50 dark:bg-slate-950/20 text-left text-slate-400 dark:text-slate-550 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-5 py-4 text-center w-12">Submit</th>
                      <th className="px-5 py-4">Title & Subject</th>
                      <th className="px-5 py-4">Deadline</th>
                      <th className="px-5 py-4 text-center">Priority</th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4">Progress</th>
                      <th className="px-5 py-4 text-center">Attachments</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                          {loading ? 'Fetching assignments...' : 'No assignments found matching filters.'}
                        </td>
                      </tr>
                    ) : (
                      assignments.map((asg) => {
                        const daysLeft = Math.ceil((new Date(asg.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                        const isOverdue = asg.status === 'Overdue';
                        
                        return (
                          <tr key={asg._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                            {/* Complete checkbox */}
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => handleStatusToggle(asg)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                {asg.status === 'Completed' ? (
                                  <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </button>
                            </td>
                            
                            {/* Title & Subject */}
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900 dark:text-white">{asg.title}</div>
                              <div className="text-[10px] text-indigo-500 font-semibold mt-0.5">{asg.subject}</div>
                            </td>

                            {/* Deadline */}
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-700 dark:text-slate-200">
                                {new Date(asg.dueDate).toLocaleDateString()} at {asg.dueTime}
                              </div>
                              <div className="text-[10px] mt-0.5 font-bold">
                                {asg.status === 'Completed' ? (
                                  <span className="text-emerald-500">Submitted on-time</span>
                                ) : isOverdue ? (
                                  <span className="text-rose-500">Overdue</span>
                                ) : daysLeft === 0 ? (
                                  <span className="text-amber-500">Due Today</span>
                                ) : (
                                  <span className="text-slate-400">{daysLeft} days remaining</span>
                                )}
                              </div>
                            </td>

                            {/* Priority */}
                            <td className="px-5 py-4 text-center">
                              <select
                                value={asg.priority}
                                onChange={(e) => handleQuickPriorityChange(asg._id, e.target.value)}
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent ${priorityColors[asg.priority]}`}
                              >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4 text-center">
                              <select
                                value={asg.status}
                                onChange={(e) => handleQuickStatusChange(asg._id, e.target.value)}
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent ${statusColors[asg.status]}`}
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Completed">Completed</option>
                                <option value="Overdue">Overdue</option>
                              </select>
                            </td>

                            {/* Progress bar */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 max-w-[120px]">
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full ${asg.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${asg.completionPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="font-mono text-[10px] font-bold text-slate-400">{asg.completionPercentage}%</span>
                              </div>
                            </td>

                            {/* Attachments */}
                            <td className="px-5 py-4 text-center">
                              {asg.attachments.length > 0 ? (
                                <a 
                                  href={asg.attachments[0].url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 hover:underline text-indigo-600 dark:text-indigo-400 font-bold"
                                  title={asg.attachments[0].name}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>Preview</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 font-medium">-</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right flex justify-end gap-1">
                              <button
                                onClick={() => handleDuplicateClick(asg)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                                title="Duplicate Task"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditClick(asg)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                                title="Edit Task"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(asg._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ================================== CALENDAR VIEW ================================== */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
            {/* Calendar Header Navigation */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-5.5 w-5.5 text-indigo-500" />
                <span>{monthsList[calendarDate.getMonth()]} {calendarDate.getFullYear()}</span>
              </h2>

              <div className="flex gap-1.5">
                <button
                  onClick={handlePrevMonth}
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
                  onClick={handleNextMonth}
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

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2 min-h-[360px]">
              {calendarCells.map((cell, idx) => {
                if (cell.type === 'padding') {
                  return <div key={`pad-${idx}`} className="bg-slate-50/50 dark:bg-slate-950/5 rounded-xl border border-transparent"></div>;
                }

                const dayEvents = calendarData[cell.dateStr] || [];
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={cell.dateStr}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, cell.dateStr)}
                    onClick={() => handleCalendarCellClick(cell.dateStr)}
                    className={`min-h-[90px] border p-2 rounded-xl flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-colors ${isToday ? 'bg-indigo-50/15 border-indigo-200 dark:border-indigo-900/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
                  >
                    {/* Day number */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-extrabold font-mono flex items-center justify-center h-5 w-5 rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>
                        {cell.dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 px-1.5 py-0.25 rounded-md">
                          {dayEvents.length} Tasks
                        </span>
                      )}
                    </div>

                    {/* Events List */}
                    <div className="mt-1.5 space-y-1 flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      {dayEvents.slice(0, 3).map((asg) => {
                        const dotColor = asg.priority === 'High' ? 'bg-rose-500' : asg.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
                        return (
                          <div
                            key={asg._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asg._id)}
                            onClick={() => handleEditClick(asg)}
                            className="text-[9px] font-bold py-0.75 px-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 truncate hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-1 hover:border-indigo-300 cursor-grab"
                            title={`Drag to reschedule: ${asg.title}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotColor}`}></span>
                            <span className="truncate">{asg.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-[8px] font-bold text-slate-400 pl-1">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================== ANALYTICS SECTION ================================== */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Status Distribution (Doughnut Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-start">Status distribution</h3>
              
              {doughnutData.length === 0 ? (
                <div className="h-44 flex items-center text-slate-400 text-xs">No analytics logged.</div>
              ) : (
                <div className="h-44 w-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={doughnutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {doughnutData.map((entry, index) => {
                          const statusIndex = Object.keys(analytics.statusDistribution).indexOf(entry.name);
                          return (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[statusIndex % PIE_COLORS.length]} />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legends */}
              <div className="flex flex-wrap gap-2.5 justify-center text-[9px] font-bold text-slate-400 mt-2">
                <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500"></span>Not Started</div>
                <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span>In Progress</div>
                <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500"></span>Under Review</div>
                <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Completed</div>
                <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span>Overdue</div>
              </div>
            </div>

            {/* Weekly Completion Rate (Line Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Weekly Completion trend</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="week" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject wise assignments (Bar Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Subject-wise Assignment Distribution</h3>
              <div className="h-60">
                {analytics.subjectDistribution.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No subjects mapped.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.subjectDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="subject" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add/Edit Modal */}
      <AddAssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPreselectedDate(null);
        }}
        onShowToast={handleShowToast}
        assignmentToEdit={assignmentToEdit}
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

export default AssignmentManager;
