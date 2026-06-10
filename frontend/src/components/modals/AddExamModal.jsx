import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Sparkles, PlusCircle, Save, Calendar, Clock, Trash2 } from 'lucide-react';
import { createExam, updateExam } from '../../redux/slices/examSlice';
import { fetchAttendance } from '../../redux/slices/attendanceSlice';

export const AddExamModal = ({ isOpen, onClose, onShowToast, examToEdit = null }) => {
  const dispatch = useDispatch();

  // Select registered subjects for course dropdown selection
  const { subjects } = useSelector((state) => state.attendance);

  // Form states
  const [examName, setExamName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [examType, setExamType] = useState('Mid Semester');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('10:00');
  const [totalMarks, setTotalMarks] = useState(100);
  const [duration, setDuration] = useState(180);
  const [notes, setNotes] = useState('');

  // Syllabus Topics state
  const [syllabusTopics, setSyllabusTopics] = useState([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicPriority, setNewTopicPriority] = useState('Medium');

  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load subjects if empty
  useEffect(() => {
    if (isOpen && subjects.length === 0) {
      dispatch(fetchAttendance());
    }
  }, [isOpen, subjects.length, dispatch]);

  // Load fields for edit
  useEffect(() => {
    if (examToEdit) {
      setExamName(examToEdit.examName || '');
      setSubjectName(examToEdit.subjectName || '');
      setExamType(examToEdit.examType || 'Mid Semester');
      
      if (examToEdit.examDate) {
        const dateObj = new Date(examToEdit.examDate);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        setExamDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setExamDate('');
      }

      setExamTime(examToEdit.examTime || '10:00');
      setTotalMarks(examToEdit.totalMarks || 100);
      setDuration(examToEdit.duration || 180);
      setNotes(examToEdit.notes || '');
      setSyllabusTopics(examToEdit.syllabusTopics || []);

      // Check if current subject matches existing list
      const matchesExisting = subjects.some(s => s.subjectName.toLowerCase() === (examToEdit.subjectName || '').toLowerCase());
      setIsCustomSubject(!matchesExisting && examToEdit.subjectName);
    } else {
      setExamName('');
      setSubjectName(subjects[0]?.subjectName || '');
      setExamType('Mid Semester');
      
      // Default to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const yyyy = nextWeek.getFullYear();
      const mm = String(nextWeek.getMonth() + 1).padStart(2, '0');
      const dd = String(nextWeek.getDate()).padStart(2, '0');
      setExamDate(`${yyyy}-${mm}-${dd}`);

      setExamTime('10:00');
      setTotalMarks(100);
      setDuration(180);
      setNotes('');
      setSyllabusTopics([]);
      setIsCustomSubject(subjects.length === 0);
    }
  }, [examToEdit, isOpen, subjects]);

  if (!isOpen) return null;

  const handleAddTopic = () => {
    if (!newTopicName.trim()) {
      onShowToast('Topic name cannot be empty', 'error');
      return;
    }
    setSyllabusTopics([
      ...syllabusTopics,
      {
        topicName: newTopicName.trim(),
        completionStatus: 'Not Started',
        completionPercentage: 0,
        priorityLevel: newTopicPriority,
      },
    ]);
    setNewTopicName('');
  };

  const handleRemoveTopic = (idx) => {
    setSyllabusTopics(syllabusTopics.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!examName || !subjectName || !examDate) {
      onShowToast('Exam name, subject, and date are required', 'error');
      return;
    }

    setSubmitting(true);
    const examData = {
      examName,
      subjectName,
      examType,
      examDate,
      examTime,
      totalMarks,
      duration,
      syllabusTopics,
      notes,
    };

    if (examToEdit) {
      dispatch(updateExam({ id: examToEdit._id, examData })).then((res) => {
        setSubmitting(false);
        if (!res.error) {
          onShowToast('Exam schedule updated!', 'success');
          onClose();
        } else {
          onShowToast(res.payload || 'Failed to update exam', 'error');
        }
      });
    } else {
      dispatch(createExam(examData)).then((res) => {
        setSubmitting(false);
        if (!res.error) {
          onShowToast('Exam scheduled successfully!', 'success');
          onClose();
        } else {
          onShowToast(res.payload || 'Failed to schedule exam', 'error');
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">
            {examToEdit ? 'Edit Exam Details' : 'Add Exam Schedule'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Exam Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Exam Name *</label>
            <input
              type="text"
              required
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              placeholder="e.g. End Semester Exam"
            />
          </div>

          {/* Subject Dropdown / Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subject *</label>
              {subjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSubject(!isCustomSubject);
                    setSubjectName(isCustomSubject ? (subjects[0]?.subjectName || '') : '');
                  }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isCustomSubject ? 'Select Registered Course' : 'Enter Custom Course'}
                </button>
              )}
            </div>

            {isCustomSubject ? (
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                placeholder="e.g. Advanced Algorithms"
              />
            ) : (
              <select
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub.subjectName}>
                    {sub.subjectName} ({sub.subjectCode})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            >
              <option value="Internal Exam">Internal Exam</option>
              <option value="Mid Semester">Mid Semester</option>
              <option value="End Semester">End Semester</option>
              <option value="Practical Exam">Practical Exam</option>
              <option value="Viva">Viva</option>
              <option value="Competitive Exam">Competitive Exam</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Exam Date *</span>
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Exam Time</span>
              </label>
              <input
                type="text"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                placeholder="10:00"
              />
            </div>
          </div>

          {/* Marks & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Total Marks</label>
              <input
                type="number"
                min="0"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value, 10) || 100)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Duration (Mins)</label>
              <input
                type="number"
                min="0"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 180)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Syllabus Topic Builder */}
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Syllabus Topics Builder</h4>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Add syllabus topic name..."
                className="block flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none"
              />
              <select
                value={newTopicPriority}
                onChange={(e) => setNewTopicPriority(e.target.value)}
                className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-white focus:outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-3.5 py-1.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-xs font-bold transition-all"
              >
                Add
              </button>
            </div>

            {/* List of syllabus topics */}
            {syllabusTopics.length > 0 && (
              <div className="mt-3.5 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {syllabusTopics.map((top, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${top.priorityLevel === 'High' ? 'bg-rose-500' : top.priorityLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                      <span>{top.topicName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Study Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Exam Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all resize-none"
              placeholder="e.g. Focus on chapters 1 to 4, remember calculations..."
            />
          </div>

          {/* Submit button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-all gap-2 items-center"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : examToEdit ? (
                <>
                  <Save className="h-4.5 w-4.5" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4.5 w-4.5" />
                  <span>Schedule Exam</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExamModal;
