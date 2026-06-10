import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Sparkles, Layout, Sliders, Printer, ZoomIn, ZoomOut,
  Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, CheckCircle, HelpCircle,
  AlertTriangle, Check, Loader, BarChart, Info, BookOpen, User, Briefcase, Award, GraduationCap, Settings2, Sun, Moon
} from 'lucide-react';

// Slices
import {
  fetchResumeById,
  updateResume,
  checkATSScore,
  generateSummary,
  clearAISuggestions,
  clearResumeError
} from '../redux/slices/resumeSlice';

// Components
import { ResumeTemplates } from '../components/ResumeTemplates';
import Toast from '../components/Toast';

export const ResumeEditor = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Theme state
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [toast, setToast] = useState(null);
  
  // UI Control states
  const [activeTab, setActiveTab] = useState('personal');
  const [zoom, setZoom] = useState(1.0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Local Form state (deep copy of resume)
  const [formData, setFormData] = useState(null);

  // Redux Selectors
  const { currentResume, currentAnalytics, aiSuggestions, loading, aiLoading, error } = useSelector((state) => state.resumes);

  // Fetch Resume Data on mount
  useEffect(() => {
    dispatch(fetchResumeById(id));
  }, [dispatch, id]);

  // Synchronize local form state with fetched Redux state
  useEffect(() => {
    if (currentResume) {
      setFormData(JSON.parse(JSON.stringify(currentResume)));
    }
  }, [currentResume]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearResumeError());
    }
  }, [error, dispatch]);

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

  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center">
        <Loader className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 mt-2">Loading Resume Draft...</p>
      </div>
    );
  }

  // --- Handlers ---
  
  // 1. Save Resume Draft
  const handleSave = () => {
    setSaveLoading(true);
    dispatch(updateResume({ id, resumeData: formData }))
      .unwrap()
      .then(() => {
        setToast({ message: 'Draft saved successfully!', type: 'success' });
        // Trigger ATS evaluation
        dispatch(checkATSScore(id));
      })
      .catch((err) => {
        setToast({ message: err || 'Failed to save draft', type: 'error' });
      })
      .finally(() => {
        setSaveLoading(false);
      });
  };

  // 2. Personal Info changes
  const handlePersonalInfoChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  // 3. Array generic actions (Education, Experience, Projects, Skills, Certifications)
  const addArrayItem = (field, defaultValue) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], defaultValue],
    }));
  };

  const removeArrayItem = (field, idx) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  const updateArrayItem = (field, idx, key, value) => {
    setFormData((prev) => {
      const list = [...prev[field]];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, [field]: list };
    });
  };

  const moveArrayItem = (field, idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= formData[field].length) return;

    setFormData((prev) => {
      const list = [...prev[field]];
      const temp = list[idx];
      list[idx] = list[targetIdx];
      list[targetIdx] = temp;
      return { ...prev, [field]: list };
    });
  };

  // 4. Technologies Tag List handler (Projects)
  const handleTechChange = (projIdx, value) => {
    const tags = value.split(',').map(tag => tag.trim());
    updateArrayItem('projects', projIdx, 'technologiesUsed', tags);
  };

  // 5. Plain Achievements handler
  const handleAchievementChange = (idx, value) => {
    setFormData((prev) => {
      const list = [...prev.achievements];
      list[idx] = value;
      return { ...prev, achievements: list };
    });
  };

  const addAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, ''],
    }));
  };

  const removeAchievement = (idx) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== idx),
    }));
  };

  // 6. AI Summary Helper trigger
  const handleAISummaryHelper = () => {
    const title = formData.personalInfo.professionalTitle;
    if (!title) {
      setToast({ message: 'Please specify your Professional Title first to generate custom summaries!', type: 'error' });
      return;
    }
    dispatch(generateSummary({ professionalTitle: title }));
    setShowAIModal(true);
  };

  const selectSummary = (summary) => {
    handlePersonalInfoChange('summary', summary);
    setShowAIModal(false);
    dispatch(clearAISuggestions());
    setToast({ message: 'AI summary applied to profile!', type: 'success' });
  };

  // 7. Print layout call
  const handlePrint = () => {
    // Save draft first to make sure PDF represents latest state
    dispatch(updateResume({ id, resumeData: formData })).unwrap().then(() => {
      window.print();
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* HEADER BAR (Hidden during Print) */}
      <header className="no-print h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-8 flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/resumes"
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.resumeTitle}
                onChange={(e) => setFormData({ ...formData, resumeTitle: e.target.value })}
                className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5 truncate max-w-[200px] sm:max-w-xs"
              />
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {formData.template}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Auto-calculated: {formData.completionPercentage}% Complete</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* ATS Badge Quick Trigger */}
          <button
            onClick={() => setActiveTab('ats')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              formData.atsScore >= 75
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : formData.atsScore >= 50
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-500 dark:text-amber-400'
                  : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-500'
            }`}
          >
            <BarChart className="h-4 w-4" />
            ATS Audit: {formData.atsScore}%
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
          >
            {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
          </button>

          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            {saveLoading ? <Loader className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
            Save Draft
          </button>
        </div>
      </header>

      {/* BODY WORKSPACE SPLIT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: EDITOR INPUTS (Hidden during Print) */}
        <div className="no-print w-full md:w-1/2 lg:w-[45%] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
          {/* Tab Selection Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-thin">
            {[
              { id: 'personal', label: 'Profile', icon: <User className="h-4 w-4" /> },
              { id: 'education', label: 'Education', icon: <GraduationCap className="h-4 w-4" /> },
              { id: 'experience', label: 'Work', icon: <Briefcase className="h-4 w-4" /> },
              { id: 'projects', label: 'Projects', icon: <BookOpen className="h-4 w-4" /> },
              { id: 'skills', label: 'Skills', icon: <Settings2 className="h-4 w-4" /> },
              { id: 'extra', label: 'Credentials', icon: <Award className="h-4 w-4" /> },
              { id: 'ats', label: 'ATS Audit', icon: <BarChart className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Fields Scrolling Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB: Personal Info */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-bold font-outfit text-slate-800 dark:text-slate-200">Personal Information</h3>
                  <div className="text-[10px] text-slate-400">Pre-populates name/email from profile</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.personalInfo.fullName}
                      onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Professional Title</label>
                    <input
                      type="text"
                      value={formData.personalInfo.professionalTitle}
                      onChange={(e) => handlePersonalInfoChange('professionalTitle', e.target.value)}
                      placeholder="e.g. Frontend Developer"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.personalInfo.phone}
                      onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.personalInfo.location}
                      onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      placeholder="San Francisco, CA"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={formData.personalInfo.linkedin}
                      onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">GitHub Profile</label>
                    <input
                      type="text"
                      value={formData.personalInfo.github}
                      onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Portfolio Website</label>
                    <input
                      type="text"
                      value={formData.personalInfo.portfolio}
                      onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)}
                      placeholder="https://myportfolio.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold uppercase text-slate-500">Professional Summary</label>
                      <button
                        type="button"
                        onClick={handleAISummaryHelper}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-85"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Writer Helper
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.personalInfo.summary}
                      onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                      placeholder="Briefly describe your career objectives, core skills, and academic focus..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Education */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-bold font-outfit text-slate-800 dark:text-slate-200">Education Details</h3>
                  <button
                    onClick={() => addArrayItem('education', { institutionName: '', degree: '', branch: '', university: '', startDate: '', endDate: '', cgpa: '', description: '' })}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New
                  </button>
                </div>

                {formData.education.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No education entries added yet. Click "Add New".</div>
                ) : (
                  formData.education.map((edu, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3 relative group">
                      {/* Control arrows/trash header */}
                      <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">Entry #{idx + 1}</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => moveArrayItem('education', idx, 'up')}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveArrayItem('education', idx, 'down')}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeArrayItem('education', idx)}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-600 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Institution Name</label>
                          <input
                            type="text"
                            value={edu.institutionName}
                            onChange={(e) => updateArrayItem('education', idx, 'institutionName', e.target.value)}
                            placeholder="e.g. Stanford University"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateArrayItem('education', idx, 'degree', e.target.value)}
                            placeholder="e.g. Bachelor of Science"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Branch / Major</label>
                          <input
                            type="text"
                            value={edu.branch}
                            onChange={(e) => updateArrayItem('education', idx, 'branch', e.target.value)}
                            placeholder="e.g. Computer Science"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">University / Board</label>
                          <input
                            type="text"
                            value={edu.university}
                            onChange={(e) => updateArrayItem('education', idx, 'university', e.target.value)}
                            placeholder="e.g. Stanford University Board"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Start Date</label>
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={(e) => updateArrayItem('education', idx, 'startDate', e.target.value)}
                            placeholder="e.g. Aug 2021"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">End Date</label>
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => updateArrayItem('education', idx, 'endDate', e.target.value)}
                            placeholder="e.g. May 2025"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">CGPA / Percentage</label>
                          <input
                            type="text"
                            value={edu.cgpa}
                            onChange={(e) => updateArrayItem('education', idx, 'cgpa', e.target.value)}
                            placeholder="e.g. 3.92 / 10.0"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Details / Achievements</label>
                          <textarea
                            rows={2}
                            value={edu.description}
                            onChange={(e) => updateArrayItem('education', idx, 'description', e.target.value)}
                            placeholder="Honors, relevant coursework, major studies..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Experience */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-bold font-outfit text-slate-800 dark:text-slate-200">Work Experience</h3>
                  <button
                    onClick={() => addArrayItem('experience', { companyName: '', jobTitle: '', employmentType: 'Internship', location: '', startDate: '', endDate: '', responsibilities: '', achievements: '' })}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New
                  </button>
                </div>

                {formData.experience.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No experience entries added yet. Click "Add New".</div>
                ) : (
                  formData.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3 relative group">
                      <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">Work Entry #{idx + 1}</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => moveArrayItem('experience', idx, 'up')}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveArrayItem('experience', idx, 'down')}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeArrayItem('experience', idx)}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-600 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Company Name</label>
                          <input
                            type="text"
                            value={exp.companyName}
                            onChange={(e) => updateArrayItem('experience', idx, 'companyName', e.target.value)}
                            placeholder="e.g. Google"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Job Title</label>
                          <input
                            type="text"
                            value={exp.jobTitle}
                            onChange={(e) => updateArrayItem('experience', idx, 'jobTitle', e.target.value)}
                            placeholder="e.g. Software Engineer Intern"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Employment Type</label>
                          <select
                            value={exp.employmentType}
                            onChange={(e) => updateArrayItem('experience', idx, 'employmentType', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="Internship">Internship</option>
                            <option value="Full Time">Full Time</option>
                            <option value="Part Time">Part Time</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Volunteer">Volunteer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Job Location</label>
                          <input
                            type="text"
                            value={exp.location}
                            onChange={(e) => updateArrayItem('experience', idx, 'location', e.target.value)}
                            placeholder="e.g. Mountain View, CA"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Start Date</label>
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => updateArrayItem('experience', idx, 'startDate', e.target.value)}
                            placeholder="e.g. Jun 2024"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">End Date</label>
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) => updateArrayItem('experience', idx, 'endDate', e.target.value)}
                            placeholder="e.g. Present or Sep 2024"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Responsibilities</label>
                          <textarea
                            rows={3}
                            value={exp.responsibilities}
                            onChange={(e) => updateArrayItem('experience', idx, 'responsibilities', e.target.value)}
                            placeholder="Describe your day-to-day duties, tech stacks, and team work..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Key Achievements / Metrics Outcomes</label>
                          <input
                            type="text"
                            value={exp.achievements}
                            onChange={(e) => updateArrayItem('experience', idx, 'achievements', e.target.value)}
                            placeholder="e.g. Optimized database load speeds by 24%."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Projects */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-bold font-outfit text-slate-800 dark:text-slate-200">Academic & Personal Projects</h3>
                  <button
                    onClick={() => addArrayItem('projects', { projectName: '', description: '', technologiesUsed: [], githubLink: '', liveDemoLink: '', startDate: '', endDate: '' })}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New
                  </button>
                </div>

                {formData.projects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No project entries added yet. Click "Add New".</div>
                ) : (
                  formData.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3 relative group">
                      <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">Project Entry #{idx + 1}</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => moveArrayItem('projects', idx, 'up')}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveArrayItem('projects', idx, 'down')}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeArrayItem('projects', idx)}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-600 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Project Name</label>
                          <input
                            type="text"
                            value={proj.projectName}
                            onChange={(e) => updateArrayItem('projects', idx, 'projectName', e.target.value)}
                            placeholder="e.g. StudentSphere Portal"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Technologies Used (comma separated)</label>
                          <input
                            type="text"
                            value={(proj.technologiesUsed || []).join(', ')}
                            onChange={(e) => handleTechChange(idx, e.target.value)}
                            placeholder="React, Node.js, Tailwind CSS"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Start Date</label>
                          <input
                            type="text"
                            value={proj.startDate}
                            onChange={(e) => updateArrayItem('projects', idx, 'startDate', e.target.value)}
                            placeholder="e.g. May 2024"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">End Date</label>
                          <input
                            type="text"
                            value={proj.endDate}
                            onChange={(e) => updateArrayItem('projects', idx, 'endDate', e.target.value)}
                            placeholder="e.g. Jun 2024"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">GitHub Link</label>
                          <input
                            type="text"
                            value={proj.githubLink}
                            onChange={(e) => updateArrayItem('projects', idx, 'githubLink', e.target.value)}
                            placeholder="https://github.com/user/repo"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Live Demo Link</label>
                          <input
                            type="text"
                            value={proj.liveDemoLink}
                            onChange={(e) => updateArrayItem('projects', idx, 'liveDemoLink', e.target.value)}
                            placeholder="https://liveportal.com"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold uppercase text-slate-500">Project Description</label>
                          <textarea
                            rows={3}
                            value={proj.description}
                            onChange={(e) => updateArrayItem('projects', idx, 'description', e.target.value)}
                            placeholder="Describe project goal, challenges solved, and your individual contribution..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Skills */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-bold font-outfit text-slate-800 dark:text-slate-200">Skills Profile</h3>
                  <button
                    onClick={() => addArrayItem('skills', { skillName: '', category: 'Technical', rating: 5 })}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Skill
                  </button>
                </div>

                {formData.skills.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No skills added yet. Click "Add Skill".</div>
                ) : (
                  <div className="space-y-3">
                    {formData.skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={skill.skillName}
                            onChange={(e) => updateArrayItem('skills', idx, 'skillName', e.target.value)}
                            placeholder="e.g. ReactJS"
                            className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />

                          <select
                            value={skill.category}
                            onChange={(e) => updateArrayItem('skills', idx, 'category', e.target.value)}
                            className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Technical">Technical</option>
                            <option value="Soft">Soft</option>
                            <option value="Tools">Tools</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold mr-1">Rating:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => updateArrayItem('skills', idx, 'rating', star)}
                                className={`text-sm focus:outline-none transition-all ${
                                  star <= skill.rating ? 'text-indigo-500 font-bold' : 'text-slate-200 dark:text-slate-800'
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-1.5 items-center">
                          <button
                            onClick={() => moveArrayItem('skills', idx, 'up')}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveArrayItem('skills', idx, 'down')}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeArrayItem('skills', idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Certifications & Achievements */}
            {activeTab === 'extra' && (
              <div className="space-y-6">
                {/* Certifications Subsection */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Certifications</h3>
                    <button
                      onClick={() => addArrayItem('certifications', { name: '', organization: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' })}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Certificate
                    </button>
                  </div>

                  {formData.certifications.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">No certifications listed yet.</div>
                  ) : (
                    formData.certifications.map((cert, idx) => (
                      <div key={idx} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3 relative">
                        <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-850 pb-2">
                          <span className="text-[10px] font-bold text-slate-500">Cert #{idx + 1}</span>
                          <button
                            onClick={() => removeArrayItem('certifications', idx)}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-600 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-500">Certificate Name</label>
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => updateArrayItem('certifications', idx, 'name', e.target.value)}
                              placeholder="e.g. AWS Certified Solutions Architect"
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-500">Issuer / Organization</label>
                            <input
                              type="text"
                              value={cert.organization}
                              onChange={(e) => updateArrayItem('certifications', idx, 'organization', e.target.value)}
                              placeholder="e.g. Amazon Web Services"
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-500">Issue Date</label>
                            <input
                              type="text"
                              value={cert.issueDate}
                              onChange={(e) => updateArrayItem('certifications', idx, 'issueDate', e.target.value)}
                              placeholder="e.g. Mar 2024"
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-slate-500">Credential URL</label>
                            <input
                              type="text"
                              value={cert.credentialUrl}
                              onChange={(e) => updateArrayItem('certifications', idx, 'credentialUrl', e.target.value)}
                              placeholder="https://credlink.com/id"
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Achievements Subsection */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Achievements (Plain Bullets)</h3>
                    <button
                      onClick={addAchievement}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Achievement
                    </button>
                  </div>

                  {formData.achievements.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">No achievements listed yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {formData.achievements.map((ach, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-slate-400">{idx + 1}.</span>
                          <input
                            type="text"
                            value={ach}
                            onChange={(e) => handleAchievementChange(idx, e.target.value)}
                            placeholder="e.g. Secured Rank 3 in Hackathon out of 400 teams."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                          <button
                            onClick={() => removeAchievement(idx)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ATS Audit breakdown */}
            {activeTab === 'ats' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-bold font-outfit text-slate-800 dark:text-slate-200">ATS Assessment Details</h3>
                  <button
                    onClick={handleSave}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Analyze Again
                  </button>
                </div>

                {/* ATS score meters */}
                {currentAnalytics ? (
                  <div className="space-y-6">
                    {/* circular meter or grid */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col items-center">
                      <div className="relative h-28 w-28 flex justify-center items-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200 dark:text-slate-800"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`transition-all duration-1000 ${
                              currentAnalytics.atsScore >= 75
                                ? 'text-emerald-500'
                                : currentAnalytics.atsScore >= 50
                                  ? 'text-amber-500'
                                  : 'text-rose-500'
                            }`}
                            strokeDasharray={`${currentAnalytics.atsScore}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-3xl font-extrabold font-outfit">{currentAnalytics.atsScore}</span>
                          <span className="text-[10px] block font-bold text-slate-400">ATS SCORE</span>
                        </div>
                      </div>

                      <div className="text-center mt-4">
                        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                          {currentAnalytics.atsScore >= 75
                            ? 'Great job! Your resume meets major ATS formats.'
                            : currentAnalytics.atsScore >= 50
                              ? 'Good draft, but needs keyword and layout updates.'
                              : 'Needs improvement. Follow suggestion checklist below.'}
                        </h4>
                      </div>
                    </div>

                    {/* Breakdown sub-meters */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center">
                        <div className="text-xs font-bold text-slate-400">Keywords</div>
                        <div className="text-lg font-extrabold mt-1 text-slate-800 dark:text-slate-100">{currentAnalytics.keywordScore}%</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center">
                        <div className="text-xs font-bold text-slate-400">Format</div>
                        <div className="text-lg font-extrabold mt-1 text-slate-800 dark:text-slate-100">{currentAnalytics.formattingScore}%</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center">
                        <div className="text-xs font-bold text-slate-400">Readability</div>
                        <div className="text-lg font-extrabold mt-1 text-slate-800 dark:text-slate-100">{currentAnalytics.readabilityScore}%</div>
                      </div>
                    </div>

                    {/* Recommendations checklist */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-indigo-500" /> Recruiter suggestions ({currentAnalytics.suggestions.length})
                      </h4>

                      {currentAnalytics.suggestions.length === 0 ? (
                        <div className="flex gap-2 items-center p-3 border border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 rounded-xl">
                          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Your resume satisfies all structural and formatting audits!</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {currentAnalytics.suggestions.map((sug, idx) => (
                            <div key={idx} className="flex gap-2 items-start p-3 border border-slate-150 dark:border-slate-800 bg-slate-50/30 rounded-xl">
                              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{sug}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    No analysis report generated. Click "Save Draft" to audit ATS metrics.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE RESUME PREVIEW CONTAINER */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-900 overflow-y-auto flex flex-col h-full relative">
          
          {/* CONTROL BAR (Hidden during Print) */}
          <div className="no-print h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 flex justify-between items-center sticky top-0 z-20">
            {/* Template select dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Template:</span>
              <select
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none"
              >
                <option value="Modern">Modern</option>
                <option value="Professional">Professional</option>
                <option value="ATS Friendly">ATS Friendly</option>
              </select>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-850 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-20 md:w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
              />
              <button
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-850 rounded"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-500 min-w-[30px]">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>

          {/* RENDER GRID */}
          <div className="flex-1 p-4 md:p-8 flex justify-center items-start overflow-x-auto min-h-max">
            <ResumeTemplates
              data={formData}
              template={formData.template}
              zoom={zoom}
            />
          </div>
        </div>
      </div>

      {/* AI SUMMARY WRITER SUGGESTIONS OVERLAY MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-lg shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                AI Summary Suggestion Writer
              </h2>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  dispatch(clearAISuggestions());
                }}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Generating professional objective summaries tailored to your active role: <span className="font-bold text-slate-800 dark:text-slate-200">"{formData.personalInfo.professionalTitle}"</span>.
            </p>

            {aiLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Failed to generate summaries. Try changing the Professional Title to a standard role.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {aiSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSummary(sug)}
                    className="p-3 border border-slate-150 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50/10 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      <span>Suggestion Option #{idx + 1}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-all text-xs font-semibold">Apply summary &rarr;</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">{sug}</p>
                  </div>
                ))}
              </div>
            )}
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

export default ResumeEditor;
