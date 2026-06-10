import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { addSemester, updateSemester } from '../../redux/slices/cgpaSlice';

export const AddSemesterModal = ({ isOpen, onClose, onShowToast, semesterToEdit = null }) => {
  const dispatch = useDispatch();

  const [semesterNumber, setSemesterNumber] = useState('');
  const [subjects, setSubjects] = useState([
    { subjectName: '', subjectCode: '', credits: 4, grade: 'O' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (semesterToEdit) {
      setSemesterNumber(semesterToEdit.semesterNumber || '');
      setSubjects(
        semesterToEdit.subjects && semesterToEdit.subjects.length > 0
          ? semesterToEdit.subjects.map(s => ({
              subjectName: s.subjectName,
              subjectCode: s.subjectCode || '',
              credits: s.credits,
              grade: s.grade,
            }))
          : [{ subjectName: '', subjectCode: '', credits: 4, grade: 'O' }]
      );
    } else {
      setSemesterNumber('');
      setSubjects([{ subjectName: '', subjectCode: '', credits: 4, grade: 'O' }]);
    }
  }, [semesterToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSubjectRow = () => {
    setSubjects([...subjects, { subjectName: '', subjectCode: '', credits: 4, grade: 'O' }]);
  };

  const handleRemoveSubjectRow = (index) => {
    if (subjects.length === 1) {
      onShowToast('At least one subject is required.', 'error');
      return;
    }
    setSubjects(subjects.filter((_, idx) => idx !== index));
  };

  const handleSubjectFieldChange = (index, field, value) => {
    setSubjects(
      subjects.map((sub, idx) => {
        if (idx === index) {
          return {
            ...sub,
            [field]: field === 'credits' ? parseInt(value, 10) || 0 : value,
          };
        }
        return sub;
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const semNum = parseInt(semesterNumber, 10);

    if (!semNum || semNum < 1 || semNum > 8) {
      onShowToast('Semester number must be between 1 and 8.', 'error');
      return;
    }

    // Validate course rows
    for (const sub of subjects) {
      if (!sub.subjectName.trim()) {
        onShowToast('Subject name cannot be empty.', 'error');
        return;
      }
      if (!sub.credits || sub.credits < 1) {
        onShowToast('Subject credits must be at least 1.', 'error');
        return;
      }
    }

    setSubmitting(true);

    const semPayload = {
      semesterNumber: semNum,
      subjects,
    };

    if (semesterToEdit) {
      dispatch(updateSemester({ id: semesterToEdit._id, semesterData: semPayload })).then((res) => {
        setSubmitting(false);
        if (!res.error) {
          onShowToast('Semester grades updated successfully!', 'success');
          onClose();
        } else {
          onShowToast(res.payload || 'Failed to update semester grades', 'error');
        }
      });
    } else {
      dispatch(addSemester(semPayload)).then((res) => {
        setSubmitting(false);
        if (!res.error) {
          onShowToast('Semester grades logged successfully!', 'success');
          onClose();
        } else {
          onShowToast(res.payload || 'Failed to log semester grades', 'error');
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 dark:border-slate-850">
          <h2 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">
            {semesterToEdit ? `Edit Semester ${semesterToEdit.semesterNumber} Grades` : 'Log New Semester Grades'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Semester Number Input */}
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Semester Number (1-8)</label>
            <input
              type="number"
              min="1"
              max="8"
              required
              disabled={!!semesterToEdit}
              value={semesterNumber}
              onChange={(e) => setSemesterNumber(e.target.value)}
              placeholder="e.g. 3"
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Subjects Rows List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Course Grades Details</label>
              <button
                type="button"
                onClick={handleAddSubjectRow}
                className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline gap-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Course Row</span>
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
              {subjects.map((sub, idx) => (
                <div 
                  key={idx} 
                  className="grid grid-cols-12 gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 items-end"
                >
                  <div className="col-span-5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Subject Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Data Structures"
                      value={sub.subjectName}
                      onChange={(e) => handleSubjectFieldChange(idx, 'subjectName', e.target.value)}
                      className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="CS-301"
                      value={sub.subjectCode}
                      onChange={(e) => handleSubjectFieldChange(idx, 'subjectCode', e.target.value)}
                      className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Credits</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={sub.credits}
                      onChange={(e) => handleSubjectFieldChange(idx, 'credits', e.target.value)}
                      className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                    />
                  </div>

                  <div className="col-span-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Grade</label>
                    <select
                      value={sub.grade}
                      onChange={(e) => handleSubjectFieldChange(idx, 'grade', e.target.value)}
                      className="block w-full px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
                    >
                      <option value="O">O</option>
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="B+">B+</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="F">F</option>
                    </select>
                  </div>

                  <div className="col-span-0.5 flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveSubjectRow(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Saving...' : 'Save Grades'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddSemesterModal;
