import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowLeft, PlusCircle, Calendar, Edit3, Trash2, 
  ChevronLeft, Award, TrendingUp, BarChart2, PieChart as PieIcon, 
  BookOpen, BrainCircuit, Target, Percent, Save, Plus, AlertTriangle, GraduationCap
} from 'lucide-react';

// Slice thunks
import { 
  fetchSemesters, deleteSemester, fetchAnalytics, 
  fetchGoals, createGoal, predictCGPA, calculateCGPA, clearPredictions, clearWhatIf 
} from '../redux/slices/cgpaSlice';

import AddSemesterModal from '../components/modals/AddSemesterModal';
import Toast from '../components/Toast';

// Recharts
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export const CGPACalculator = () => {
  const dispatch = useDispatch();
  const [toast, setToast] = useState(null);

  // Modal & View States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [semesterToEdit, setSemesterToEdit] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'predictor', 'whatif', 'analytics'

  // Form States for Goals & Predictions
  const [targetCGPA, setTargetCGPA] = useState('');
  const [expectedCredits, setExpectedCredits] = useState('');
  const [remainingSemesters, setRemainingSemesters] = useState('');

  // Form State for Goal creation
  const [newGoalTarget, setNewGoalTarget] = useState('');

  // What-If planner state
  const [whatIfCourses, setWhatIfCourses] = useState([
    { subjectName: '', credits: 4, grade: 'O' }
  ]);

  // Redux Selectors
  const { semesters, cgpaData, analytics, goals, predictions, whatIfResults, loading } = useSelector((state) => state.cgpa);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchSemesters());
    dispatch(fetchAnalytics());
    dispatch(fetchGoals());
  }, [dispatch]);

  const handleShowToast = (message, type) => {
    setToast({ message, type });
  };

  const handleAddSemesterClick = () => {
    setSemesterToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (e, sem) => {
    e.stopPropagation();
    setSemesterToEdit(sem);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this semester record and all its grades?')) {
      dispatch(deleteSemester(id)).then((res) => {
        if (!res.error) {
          handleShowToast('Semester grades deleted successfully', 'success');
          dispatch(fetchAnalytics()); // Refresh charts
        }
      });
    }
  };

  // Create Goal
  const handleCreateGoal = (e) => {
    e.preventDefault();
    const val = parseFloat(newGoalTarget);
    if (!val || val < 0 || val > 10) {
      handleShowToast('Target CGPA must be between 0 and 10.', 'error');
      return;
    }

    dispatch(createGoal({ targetCGPA: val })).then((res) => {
      if (!res.error) {
        handleShowToast('Academic goal set successfully!', 'success');
        setNewGoalTarget('');
        dispatch(fetchSemesters()); // Update progress in semester list
      }
    });
  };

  // Predict future GPA
  const handlePredict = (e) => {
    e.preventDefault();
    const target = parseFloat(targetCGPA);
    const credits = parseInt(expectedCredits, 10);
    const sems = parseInt(remainingSemesters, 10);

    if (!target || target < 0 || target > 10) {
      handleShowToast('Target CGPA must be between 0 and 10.', 'error');
      return;
    }
    if (!credits || credits < 1) {
      handleShowToast('Future credits must be at least 1.', 'error');
      return;
    }
    if (!sems || sems < 1) {
      handleShowToast('Remaining semesters must be at least 1.', 'error');
      return;
    }

    dispatch(predictCGPA({ targetCGPA: target, expectedCredits: credits, remainingSemesters: sems }));
  };

  // What-If planner actions
  const handleAddWhatIfRow = () => {
    setWhatIfCourses([...whatIfCourses, { subjectName: '', credits: 4, grade: 'O' }]);
  };

  const handleRemoveWhatIfRow = (index) => {
    setWhatIfCourses(whatIfCourses.filter((_, idx) => idx !== index));
  };

  const handleWhatIfFieldChange = (index, field, value) => {
    setWhatIfCourses(
      whatIfCourses.map((c, idx) => {
        if (idx === index) {
          return {
            ...c,
            [field]: field === 'credits' ? parseInt(value, 10) || 0 : value,
          };
        }
        return c;
      })
    );
  };

  const handleWhatIfSubmit = (e) => {
    e.preventDefault();
    
    // Map semesters into simple credits / GPA objects for server
    const currentSemesters = semesters.map(s => ({
      totalCredits: s.totalCredits,
      totalCreditPoints: s.totalCreditPoints,
    }));

    dispatch(calculateCGPA({ currentSemesters, projectedCourses: whatIfCourses }));
  };

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 pb-12 font-sans">
      
      {/* Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">CGPA Calculator</span>
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
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold font-outfit leading-tight">Academic Grading Dashboard</h1>
            <p className="text-xs text-indigo-100 mt-1">
              Calculate semester grade point averages, track cumulative CGPA targets, and simulate what-if planners.
            </p>
          </div>
          <div className="relative z-10 flex gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-sm">
            <div className="text-center pr-4 border-r border-white/25">
              <span className="text-2xl font-extrabold font-outfit leading-none">{cgpaData.overallCGPA}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider block mt-1 text-indigo-150">Current CGPA</span>
            </div>
            <div className="text-center pl-1 pr-1">
              <span className="text-2xl font-extrabold font-outfit leading-none">{cgpaData.totalCredits}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider block mt-1 text-indigo-150">Earned Credits</span>
            </div>
          </div>
        </div>

        {/* View Selection Menu */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="inline-flex border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex-1 sm:flex-initial p-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${viewMode === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <Award className="h-4 w-4" />
              <span>Semesters List</span>
            </button>
            <button
              onClick={() => setViewMode('predictor')}
              className={`flex-1 sm:flex-initial p-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${viewMode === 'predictor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <Target className="h-4 w-4" />
              <span>Target Predictor</span>
            </button>
            <button
              onClick={() => setViewMode('whatif')}
              className={`flex-1 sm:flex-initial p-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${viewMode === 'whatif' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <BrainCircuit className="h-4 w-4" />
              <span>What-If Planner</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex-1 sm:flex-initial p-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${viewMode === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Performance Analytics</span>
            </button>
          </div>

          {viewMode === 'dashboard' && (
            <button
              onClick={handleAddSemesterClick}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4.5 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm gap-1.5"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Log Semester Grades</span>
            </button>
          )}
        </div>

        {/* ================================== SEMESTERS LIST VIEW ================================== */}
        {viewMode === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            
            {/* Left: Semesters list details */}
            <div className="lg:col-span-2 space-y-6">
              {semesters.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-450">
                  <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-sm">No semesters logged yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Click the button above to add subjects, credits, and grades.</p>
                </div>
              ) : (
                semesters.map((sem) => (
                  <div 
                    key={sem._id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4"
                  >
                    {/* Semester Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                      <div>
                        <h3 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white">Semester {sem.semesterNumber}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Credits: {sem.totalCredits} | Credit Points: {sem.totalCreditPoints}</p>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-outfit">{sem.semesterGPA}</span>
                          <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">GPA</span>
                        </div>
                        <div className="flex gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
                          <button
                            onClick={(e) => handleEditClick(e, sem)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, sem._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subjects Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {sem.subjects && sem.subjects.map((sub, sIdx) => (
                        <div 
                          key={sIdx} 
                          className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl flex justify-between items-center"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">{sub.subjectName}</p>
                            <span className="text-[9px] text-slate-400 font-medium">
                              Code: {sub.subjectCode || 'N/A'} | Credits: {sub.credits}
                            </span>
                          </div>
                          <span className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-extrabold border ${sub.grade === 'F' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30'}`}>
                            {sub.grade}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Academic goals & Target Tracker */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Target Goal Setter */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-indigo-500" />
                  <span>Academic Target Setter</span>
                </h3>
                
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Target CGPA</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        required
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(e.target.value)}
                        placeholder="e.g. 8.5"
                        className="block w-full px-3 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Set Goal</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Goals progress */}
                <div className="mt-6 space-y-4 max-h-48 overflow-y-auto pr-1">
                  {goals.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">No target goals set yet.</p>
                  ) : (
                    goals.map((goal) => {
                      const ratio = Math.min(Math.max((goal.currentProgress / goal.targetCGPA) * 100, 0), 100);
                      
                      return (
                        <div key={goal._id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800 dark:text-white">Target: {goal.targetCGPA} CGPA</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${goal.status === 'Achieved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                              {goal.status}
                            </span>
                          </div>
                          
                          {/* Progress slider bar */}
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${ratio}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                            <span>Progress: {goal.currentProgress}</span>
                            <span>{Math.round(ratio)}% Achieved</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Insights alert block */}
              {analytics && analytics.insights && analytics.insights.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <BrainCircuit className="h-4 w-4 text-violet-500" />
                    <span>Academic Advisor Insights</span>
                  </h3>
                  
                  <ul className="space-y-3.5 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {analytics.insights.map((ins, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================================== TARGET PREDICTOR VIEW ================================== */}
        {viewMode === 'predictor' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <BrainCircuit className="h-6 w-6 text-indigo-500" />
              <span>Academic GPA Target Predictor</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Estimate the exact average GPA you need to maintain in future semesters to reach your target CGPA.
            </p>

            <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Target CGPA Goal</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={targetCGPA}
                  onChange={(e) => setTargetCGPA(e.target.value)}
                  placeholder="e.g. 8.5"
                  className="block w-full px-3 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Expected Future Credits</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="150"
                  value={expectedCredits}
                  onChange={(e) => setExpectedCredits(e.target.value)}
                  placeholder="e.g. 24"
                  className="block w-full px-3 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Remaining Semesters</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="8"
                  value={remainingSemesters}
                  onChange={(e) => setRemainingSemesters(e.target.value)}
                  placeholder="e.g. 2"
                  className="block w-full px-3 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="col-span-1 sm:col-span-3 mt-2 inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Predict Required GPA
              </button>
            </form>

            {/* Prediction Results Banner */}
            {predictions && (
              <div className="p-5 border border-indigo-100 bg-indigo-50/10 dark:border-indigo-900/30 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Required Future GPA</span>
                    <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-outfit">{predictions.requiredGPA}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Probability</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${predictions.probability === 'High' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : predictions.probability === 'Medium' ? 'bg-amber-50 border-amber-100 text-amber-600' : predictions.probability === 'Low' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      {predictions.probability}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {predictions.message}
                </p>
                <div className="text-[9px] text-slate-400 flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500 mt-0.5" />
                  <span>Calculated based on current credits ({cgpaData.totalCredits}) and credit points ({cgpaData.totalCreditPoints}).</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================== WHAT-IF PLANNER VIEW ================================== */}
        {viewMode === 'whatif' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <BrainCircuit className="h-6 w-6 text-violet-500" />
              <span>Projected Grade What-If Calculator</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Simulate expected semester grades to calculate projected GPA and view cumulative CGPA outcome instantly.
            </p>

            <form onSubmit={handleWhatIfSubmit} className="space-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Projected Subject Rows</span>
                <button
                  type="button"
                  onClick={handleAddWhatIfRow}
                  className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline gap-0.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Course Row</span>
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                {whatIfCourses.map((c, idx) => (
                  <div key={idx} className="flex gap-3 items-end p-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex-1">
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Subject Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Physics Lab"
                        value={c.subjectName}
                        onChange={(e) => handleWhatIfFieldChange(idx, 'subjectName', e.target.value)}
                        className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Credits</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="10"
                        value={c.credits}
                        onChange={(e) => handleWhatIfFieldChange(idx, 'credits', e.target.value)}
                        className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Expected Grade</label>
                      <select
                        value={c.grade}
                        onChange={(e) => handleWhatIfFieldChange(idx, 'grade', e.target.value)}
                        className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                      >
                        <option value="O">O (10)</option>
                        <option value="A+">A+ (9)</option>
                        <option value="A">A (8)</option>
                        <option value="B+">B+ (7)</option>
                        <option value="B">B (6)</option>
                        <option value="C">C (5)</option>
                        <option value="F">F (0)</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhatIfRow(idx)}
                      disabled={whatIfCourses.length === 1}
                      className="p-1.5 border border-transparent rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Project Projected Outcomes
              </button>
            </form>

            {/* What-If Results Banner */}
            {whatIfResults && (
              <div className="mt-6 p-5 border border-indigo-100 bg-indigo-50/10 dark:border-indigo-900/30 rounded-2xl flex flex-col sm:flex-row justify-between gap-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Projected Semester GPA</span>
                  <h3 className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400 font-outfit">{whatIfResults.projectedGPA}</h3>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Projected CGPA</span>
                  <h3 className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400 font-outfit">{whatIfResults.projectedCGPA}</h3>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Credits after Semester</span>
                  <h3 className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400 font-outfit">{whatIfResults.overallCredits}</h3>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================== ANALYTICS VIEW ================================== */}
        {viewMode === 'analytics' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* 1. Line Chart: GPA Trend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                <span>Semester GPA Trends</span>
              </h3>
              <div className="h-60">
                {analytics.gpaTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No semesters logged.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.gpaTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="semester" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="GPA" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 2. Area Chart: CGPA Growth */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                <span>CGPA Growth Progression</span>
              </h3>
              <div className="h-60">
                {analytics.cgpaProgress.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No semesters logged.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.cgpaProgress}>
                      <defs>
                        <linearGradient id="colorCGPA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="semester" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[0, 10]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="CGPA" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCGPA)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 3. Bar Chart: Subject Performance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <BarChart2 className="h-4.5 w-4.5 text-indigo-500" />
                <span>Subject Grade Distribution</span>
              </h3>
              <div className="h-60">
                {analytics.subjectDistribution.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No subjects logged.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.subjectDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="subject" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[0, 10]} />
                      <Tooltip />
                      <Bar dataKey="gradePoint" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 4. Pie Chart: Credit Distributions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 self-start flex items-center gap-1.5">
                <PieIcon className="h-4.5 w-4.5 text-indigo-500" />
                <span>Credit Load per Semester</span>
              </h3>
              
              <div className="h-44 w-44 relative flex items-center justify-center">
                {analytics.creditDistribution.length === 0 ? (
                  <div className="text-xs text-slate-400">No data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.creditDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {analytics.creditDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend List */}
              <div className="flex flex-wrap gap-3 text-[9px] font-bold text-slate-400 mt-2 justify-center">
                {analytics.creditDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                    <span>{entry.name} ({entry.value} Credits)</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Add/Edit Modal */}
      <AddSemesterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onShowToast={handleShowToast}
        semesterToEdit={semesterToEdit}
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

export default CGPACalculator;
