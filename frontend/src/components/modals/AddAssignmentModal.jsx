import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, GraduationCap, PlusCircle, Save, FileText, Trash2, Calendar, Clock } from 'lucide-react';
import { createAssignment, updateAssignment } from '../../redux/slices/assignmentSlice';
import { fetchAttendance } from '../../redux/slices/attendanceSlice';

export const AddAssignmentModal = ({ isOpen, onClose, onShowToast, assignmentToEdit = null }) => {
  const dispatch = useDispatch();

  // Redux subjects selector (for subject dropdown selection)
  const { subjects } = useSelector((state) => state.attendance);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Not Started');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Attachments states
  const [file, setFile] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  
  // Custom subject input flag
  const [isCustomSubject, setIsCustomSubject] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Load subjects if empty
  useEffect(() => {
    if (isOpen && subjects.length === 0) {
      dispatch(fetchAttendance());
    }
  }, [isOpen, subjects.length, dispatch]);

  // Load data for editing
  useEffect(() => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title || '');
      setSubject(assignmentToEdit.subject || '');
      setDescription(assignmentToEdit.description || '');
      
      // Format date to YYYY-MM-DD
      if (assignmentToEdit.dueDate) {
        const dateObj = new Date(assignmentToEdit.dueDate);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        setDueDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setDueDate('');
      }

      setDueTime(assignmentToEdit.dueTime || '23:59');
      setPriority(assignmentToEdit.priority || 'Medium');
      setStatus(assignmentToEdit.status || 'Not Started');
      setCompletionPercentage(assignmentToEdit.completionPercentage || 0);
      setEstimatedHours(assignmentToEdit.estimatedHours || 0);
      setNotes(assignmentToEdit.notes || '');
      setExistingAttachments(assignmentToEdit.attachments || []);
      setFile(null);

      // Check if current subject matches existing list
      const matchesExisting = subjects.some(s => s.subjectName.toLowerCase() === (assignmentToEdit.subject || '').toLowerCase());
      setIsCustomSubject(!matchesExisting && assignmentToEdit.subject);
    } else {
      // Clear form for adding
      setTitle('');
      setSubject(subjects[0]?.subjectName || '');
      setDescription('');
      
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}`);
      
      setDueTime('23:59');
      setPriority('Medium');
      setStatus('Not Started');
      setCompletionPercentage(0);
      setEstimatedHours(0);
      setNotes('');
      setExistingAttachments([]);
      setFile(null);
      setIsCustomSubject(subjects.length === 0);
    }
  }, [assignmentToEdit, isOpen, subjects]);

  if (!isOpen) return null;

  const handleRemoveExistingAttachment = (indexToRemove) => {
    setExistingAttachments(
      existingAttachments.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Completed') {
      setCompletionPercentage(100);
    } else if (newStatus === 'Not Started') {
      setCompletionPercentage(0);
    }
  };

  const handlePercentChange = (pct) => {
    const val = Math.min(100, Math.max(0, parseInt(pct, 10) || 0));
    setCompletionPercentage(val);
    if (val === 100) {
      setStatus('Completed');
    } else if (val === 0) {
      setStatus('Not Started');
    } else if (status === 'Completed' || status === 'Not Started') {
      setStatus('In Progress');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !subject || !dueDate) {
      onShowToast('Title, subject, and due date are required', 'error');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('description', description);
    formData.append('dueDate', dueDate);
    formData.append('dueTime', dueTime);
    formData.append('priority', priority);
    formData.append('status', status);
    formData.append('completionPercentage', completionPercentage);
    formData.append('estimatedHours', estimatedHours);
    formData.append('notes', notes);

    if (file) {
      formData.append('file', file);
    }

    if (assignmentToEdit && assignmentToEdit._id) {
      formData.append('existingAttachments', JSON.stringify(existingAttachments));
      dispatch(updateAssignment({ id: assignmentToEdit._id, formData })).then((res) => {
        setSubmitting(false);
        if (!res.error) {
          onShowToast('Assignment updated successfully!', 'success');
          onClose();
        } else {
          onShowToast(res.payload || 'Failed to update assignment', 'error');
        }
      });
    } else {
      dispatch(createAssignment(formData)).then((res) => {
        setSubmitting(false);
        if (!res.error) {
          onShowToast('Assignment created successfully!', 'success');
          onClose();
        } else {
          onShowToast(res.payload || 'Failed to create assignment', 'error');
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
          <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">
            {assignmentToEdit && assignmentToEdit._id ? 'Edit Assignment' : 'Add Assignment'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1.5">Assignment Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              placeholder="e.g. Database Design Lab 3"
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
                    setSubject(isCustomSubject ? (subjects[0]?.subjectName || '') : '');
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
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                placeholder="e.g. Theoretical Physics"
              />
            ) : (
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
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

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all resize-none"
              placeholder="Provide a detailed brief of the assignment task..."
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Due Date *</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Due Time</span>
              </label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                placeholder="23:59"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              >
                <option value="High">High (Red)</option>
                <option value="Medium">Medium (Yellow)</option>
                <option value="Low">Low (Green)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Progress & Est Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Progress ({completionPercentage}%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={completionPercentage}
                onChange={(e) => handlePercentChange(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Estimated Hours</label>
              <input
                type="number"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseInt(e.target.value, 10) || 0)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Upload Attachment (Max 10MB)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-800 dark:file:text-indigo-400"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            {file && (
              <p className="text-[10px] text-emerald-500 font-bold mt-1">
                Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}

            {/* List Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Attachments:</p>
                {existingAttachments.map((att, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                    <span className="flex items-center gap-1.5 font-medium max-w-[80%] truncate">
                      <FileText className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-slate-700 dark:text-slate-300 truncate">
                        {att.name}
                      </a>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingAttachment(idx)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      title="Remove Attachment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Study Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all resize-none"
              placeholder="e.g. Reference chapter 5 from textbook, focus on normalizations."
            />
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-all gap-2 items-center"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : assignmentToEdit && assignmentToEdit._id ? (
                <>
                  <Save className="h-4.5 w-4.5" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4.5 w-4.5" />
                  <span>Create Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssignmentModal;
