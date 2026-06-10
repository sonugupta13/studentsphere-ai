import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Calendar, BookOpen, Clock, AlertTriangle, CheckCircle2, 
  Trash2, Plus, PlusCircle, ArrowLeft, Download, FileText, LayoutList 
} from 'lucide-react';

// Slice thunks
import { 
  fetchAttendance, fetchOverview, fetchReports, fetchAnalytics, 
  deleteSubject, clearAttendanceError 
} from '../redux/slices/attendanceSlice';

// Exporters
import { exportToPDF, exportToExcel } from '../utils/exporters';

// Modals & Sub-components
import AddSubjectModal from '../components/modals/AddSubjectModal';
import MarkAttendanceModal from '../components/modals/MarkAttendanceModal';
import Toast from '../components/Toast';

// Recharts
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

export const AttendanceDashboard = () => {
  const dispatch = useDispatch();
  const [toast, setToast] = useState(null);
  
  // Modal toggle states
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isMarkOpen, setIsMarkOpen] = useState(false);

  // Selector mappings
  const { subjects, overview, reports, attendanceAnalytics, loading, error } = useSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(fetchAttendance());
    dispatch(fetchOverview());
    dispatch(fetchReports());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearAttendanceError());
    }
  }, [error, dispatch]);

  const handleDeleteSubject = (id) => {
    if (window.confirm('Are you sure you want to delete this subject and all its attendance logs?')) {
      dispatch(deleteSubject(id)).then((res) => {
        if (!res.error) {
          setToast({ message: 'Subject and logs deleted successfully', type: 'success' });
        }
      });
    }
  };

  const handleShowToast = (message, type) => {
    setToast({ message, type });
  };

  // Prediction calculator logic
  const calculatePrediction = () => {
    if (!overview || overview.totalClasses === 0) {
      return { status: 'safe', text: 'No classes logged yet to predict.' };
    }

    const { totalClasses, attendedClasses, overallPercentage } = overview;
    const target = 75; // 75% target rate

    if (overallPercentage >= target) {
      // Safe Zone: How many upcoming classes can they miss?
      const maxMissable = Math.floor((attendedClasses - 0.75 * totalClasses) / 0.75);
      return {
        status: 'safe',
        zone: 'Safe Zone',
        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30',
        text: maxMissable > 0 
          ? `You can safely miss the next ${maxMissable} classes without falling below 75%.`
          : `You are in the safe zone, but you cannot miss any upcoming classes without falling below 75%.`,
      };
    } else {
      // Warning/Danger Zone: How many classes must they attend in a row to reach 75%?
      const requiredToAttend = Math.ceil((0.75 * totalClasses - attendedClasses) / 0.25);
      const isCritical = overallPercentage < 65;
      
      return {
        status: isCritical ? 'danger' : 'warning',
        zone: isCritical ? 'Danger Zone' : 'Warning Zone',
        color: isCritical
          ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
          : 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
        text: `You must attend the next ${requiredToAttend} classes in a row to bring your attendance back to 75%.`,
      };
    }
  };

  const prediction = calculatePrediction();

  // Status mapping helper
  const getSubjectStatus = (pct) => {
    if (pct >= 85) return { label: 'Excellent', color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' };
    if (pct >= 75) return { label: 'Good', color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30' };
    if (pct >= 65) return { label: 'Warning', color: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30' };
    return { label: 'Critical', color: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30' };
  };

  // Pie chart coloring
  const PIE_COLORS = ['#10b981', '#ef4444', '#6366f1']; // Present, Absent, Leave

  const distributionData = attendanceAnalytics ? [
    { name: 'Present', value: attendanceAnalytics.distribution.Present },
    { name: 'Absent', value: attendanceAnalytics.distribution.Absent },
    { name: 'Leave', value: attendanceAnalytics.distribution.Leave },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 pb-12">
      {/* Header navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Attendance Portal</span>
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
        
        {/* Actions header banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">Attendance Tracker</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add course modules, record daily lectures, and evaluate recovery options.
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsSubjectOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all gap-1.5"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Subject</span>
            </button>
            <button
              onClick={() => setIsMarkOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all shadow-sm gap-1.5"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Mark Attendance</span>
            </button>
          </div>
        </div>

        {/* Overview cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Rate</span>
              <h3 className={`text-2xl font-extrabold font-outfit mt-1 ${overview.overallPercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {overview.overallPercentage}%
              </h3>
              <p className="text-[10px] text-slate-400 mt-1.5">Target required: 75%</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Subjects</span>
              <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-1">
                {overview.totalSubjects}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1.5">Registered courses</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Classes</span>
              <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-1">
                {overview.totalClasses}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1.5">Conducted lectures</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attended</span>
              <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-1">
                {overview.attendedClasses}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1.5">Lectures present</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missed</span>
              <h3 className="text-2xl font-extrabold font-outfit text-rose-500 mt-1">
                {overview.missedClasses}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1.5">Lectures absent</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goal</span>
              <h3 className="text-2xl font-extrabold font-outfit text-indigo-500 mt-1">
                {overview.attendanceGoal}%
              </h3>
              <p className="text-[10px] text-slate-400 mt-1.5">Excused leaves logs</p>
            </div>
          </div>
        )}

        {/* Prediction Calculator Widget */}
        {overview && overview.totalClasses > 0 && (
          <div className={`p-4 rounded-2xl border flex gap-4.5 items-start mb-8 ${prediction.color}`}>
            <AlertTriangle className="h-6 w-6 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <span>Attendance Prediction Tracker</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-current">{prediction.zone}</span>
              </h3>
              <p className="text-xs font-medium mt-1 leading-relaxed">{prediction.text}</p>
            </div>
          </div>
        )}

        {/* Subjects Table Area */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">Subject-wise Attendance Logs</h2>
            <p className="text-xs text-slate-400">Aggregated subject analytics and warning flags.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/20 text-left text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Subject Name</th>
                  <th className="px-6 py-4">Subject Code</th>
                  <th className="px-6 py-4">Faculty</th>
                  <th className="px-6 py-4 text-center">Conducted</th>
                  <th className="px-6 py-4 text-center">Attended</th>
                  <th className="px-6 py-4 text-center">Attendance %</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                      No subjects added yet. Click "Add Subject" to begin.
                    </td>
                  </tr>
                ) : (
                  subjects.map((sub) => {
                    const status = getSubjectStatus(sub.attendancePercentage);
                    return (
                      <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{sub.subjectName}</td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-400">{sub.subjectCode}</td>
                        <td className="px-6 py-4 font-medium">{sub.facultyName}</td>
                        <td className="px-6 py-4 text-center font-bold">{sub.totalClasses}</td>
                        <td className="px-6 py-4 text-center font-bold">{sub.attendedClasses}</td>
                        <td className="px-6 py-4 text-center font-extrabold text-slate-900 dark:text-white">
                          {sub.attendancePercentage}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSubject(sub._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                            title="Delete Subject"
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

        {/* Charts and Analytics Section */}
        {attendanceAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Monthly attendance trend (Line Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Monthly Attendance Trend</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceAnalytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Distribution (Pie Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider self-start">Logs Distribution</h3>
              
              <div className="h-44 w-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends labels */}
              <div className="flex gap-4 text-[10px] font-bold text-slate-400 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>Present ({attendanceAnalytics.distribution.Present})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <span>Absent ({attendanceAnalytics.distribution.Absent})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                  <span>Leave ({attendanceAnalytics.distribution.Leave})</span>
                </div>
              </div>
            </div>

            {/* Semester Analytics summary card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Semester Performance Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Best Subject</p>
                  <p className="text-base font-extrabold text-slate-800 dark:text-white mt-1.5 truncate">
                    {attendanceAnalytics.bestSubject ? attendanceAnalytics.bestSubject.name : 'N/A'}
                  </p>
                  <p className="text-xs font-extrabold text-emerald-500 mt-0.5">
                    {attendanceAnalytics.bestSubject ? `${attendanceAnalytics.bestSubject.percentage}%` : '0%'}
                  </p>
                </div>

                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weakest Subject</p>
                  <p className="text-base font-extrabold text-slate-800 dark:text-white mt-1.5 truncate">
                    {attendanceAnalytics.weakestSubject ? attendanceAnalytics.weakestSubject.name : 'N/A'}
                  </p>
                  <p className="text-xs font-extrabold text-rose-500 mt-0.5">
                    {attendanceAnalytics.weakestSubject ? `${attendanceAnalytics.weakestSubject.percentage}%` : '0%'}
                  </p>
                </div>

                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Attendance</p>
                  <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5">
                    {attendanceAnalytics.averageAttendance}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Course average</p>
                </div>

                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Improvement Rate</p>
                  <p className="text-2xl font-extrabold text-emerald-500 mt-1.5">
                    Steady
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Trend positive</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Monthly reports & downloads */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white mb-4">Export Monthly Attendance Reports</h2>
          <div className="space-y-4">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">No attendance reports generated yet. Log attendance to build monthly logs.</p>
            ) : (
              reports.map((report, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:scale-[1.005] transition-all"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{report.month} Report</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Conducted classes: {report.totalClasses} | Attendance rate: {report.percentage}%
                    </p>
                  </div>
                  
                  <div className="flex gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => exportToPDF(report)}
                      className="flex-1 sm:flex-initial inline-flex justify-center items-center px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors gap-1.5"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Export PDF</span>
                    </button>
                    
                    <button
                      onClick={() => exportToExcel(report)}
                      className="flex-1 sm:flex-initial inline-flex justify-center items-center px-3.5 py-2 border border-transparent rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors gap-1.5 shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export Excel</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Modals Mounting */}
      <AddSubjectModal
        isOpen={isSubjectOpen}
        onClose={() => setIsSubjectOpen(false)}
        onShowToast={handleShowToast}
      />
      <MarkAttendanceModal
        isOpen={isMarkOpen}
        onClose={() => setIsMarkOpen(false)}
        subjects={subjects}
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

export default AttendanceDashboard;
